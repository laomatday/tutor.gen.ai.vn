import {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, type ReactNode,
} from "react";
import { storageKeys } from "../../config/storage";
import {
  pilotGetUser, pilotRead, pilotRefresh, pilotSignIn, pilotSignOut,
  type PilotProfile, type PilotSession,
} from "./pilotApi";

/**
 * Pilot credentials are scoped to this tab (sessionStorage, never localStorage).
 * Tutor profiles/roles/consent are READ from RLS-protected database rows.
 * This provider never provisions accounts or derives privileges from metadata.
 */
const SESSION_KEY = storageKeys.pilotSession;
type PilotStatus = "checking" | "anonymous" | "ready" | "blocked";
interface PilotAuthState {
  status: PilotStatus;
  profile: PilotProfile | null;
  userId: string | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getAccessToken(): Promise<string>;
}
const Context = createContext<PilotAuthState | null>(null);

function load(): PilotSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const session = value as Record<string, unknown>;
    if (typeof session.accessToken !== "string" ||
        typeof session.refreshToken !== "string" ||
        typeof session.expiresAt !== "number" ||
        typeof session.userId !== "string" ||
        typeof session.email !== "string") return null;
    return session as unknown as PilotSession;
  } catch {
    return null;
  }
}
function persist(session: PilotSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Browser storage may be restricted; the in-memory session still works.
  }
}
async function resolveProfile(session: PilotSession): Promise<PilotProfile | null> {
  const identity = await pilotGetUser(session.accessToken);
  if (identity.id !== session.userId) throw new Error("Không khớp định danh phiên đăng nhập.");
  const rows = await pilotRead<PilotProfile[]>(
    "tutor_profiles?select=user_id,display_name,role,grade_id,consent_approved_at,active&user_id=eq." +
    encodeURIComponent(identity.id), session.accessToken,
  );
  return rows[0] ?? null;
}
function canEnter(profile: PilotProfile | null) {
  return Boolean(profile?.active &&
    (profile.role !== "student" || Boolean(profile.consent_approved_at)));
}

export function TutorAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PilotStatus>(() => load() ? "checking" : "anonymous");
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const session = useRef<PilotSession | null>(load());
  const refreshing = useRef<Promise<PilotSession> | null>(null);

  const updateSession = useCallback((next: PilotSession | null) => {
    session.current = next;
    persist(next);
  }, []);

  const getAccessToken = useCallback(async () => {
    const current = session.current;
    if (!current) throw new Error("Hãy đăng nhập để tiếp tục.");
    if (current.expiresAt > Date.now() + 60_000) return current.accessToken;
    if (!refreshing.current) {
      refreshing.current = pilotRefresh(current).then(next => {
        // Do not resurrect a session that the user signed out from.
        if (session.current === current) updateSession(next);
        return next;
      }).finally(() => { refreshing.current = null; });
    }
    const next = await refreshing.current;
    if (!session.current) throw new Error("Phiên đã đăng xuất.");
    return next.accessToken;
  }, [updateSession]);

  useEffect(() => {
    let alive = true;
    async function restore() {
      if (!session.current) return;
      try {
        const token = await getAccessToken();
        const current = session.current;
        if (!current) return;
        const found = await resolveProfile({ ...current, accessToken: token });
        if (!alive) return;
        setProfile(found);
        setStatus(canEnter(found) ? "ready" : "blocked");
      } catch {
        if (!alive) return;
        updateSession(null);
        setProfile(null);
        setStatus("anonymous");
      }
    }
    void restore();
    return () => { alive = false; };
  }, [getAccessToken, updateSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const current = await pilotSignIn(email, password);
    const found = await resolveProfile(current);
    updateSession(current);
    setProfile(found);
    setStatus(canEnter(found) ? "ready" : "blocked");
  }, [updateSession]);

  const signOut = useCallback(async () => {
    const current = session.current;
    // Clear immediately even when the network is unavailable.
    updateSession(null);
    setProfile(null);
    setStatus("anonymous");
    if (current) {
      try { await pilotSignOut(current.accessToken); }
      catch { /* The local session is gone; remote expiry remains bounded. */ }
    }
  }, [updateSession]);

  return (
    <Context.Provider value={{
      status, profile, userId: session.current?.userId ?? null,
      signIn, signOut, getAccessToken,
    }}>
      {children}
    </Context.Provider>
  );
}

export function useTutorAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useTutorAuth must be called inside TutorAuthProvider");
  return value;
}
