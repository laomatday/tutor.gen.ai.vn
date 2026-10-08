import { contentDatabaseConfig } from "../../config/contentDatabase";

/**
 * Small, dependency-free PostgREST and GoTrue adapter for the isolated Tutor
 * pilot. This is NOT the server authorization boundary: Postgres RLS is.
 * Never use a service-role key here or trust client-provided roles/results.
 */
const base = contentDatabaseConfig.url.replace(/\/$/, "");
const apiKey = contentDatabaseConfig.publishableKey;

export interface PilotIdentity {
  id: string;
  email?: string;
}

export interface PilotSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}

export interface PilotProfile {
  user_id: string;
  display_name: string;
  role: "student" | "teacher" | "admin";
  grade_id: string | null;
  consent_approved_at: string | null;
  active: boolean;
}

export interface PilotEnrollment {
  learner_id: string;
  grade_id: string;
  subject_id: string;
  active: boolean;
}

export interface PilotCompletion {
  learner_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface PilotQuizAttempt {
  id: string;
  learner_id: string;
  lesson_id: string;
  correct_count: number;
  question_count: number;
  submitted_at: string;
}

export interface PilotTeacherLink {
  teacher_id: string;
  learner_id: string;
  class_label: string;
}

export interface PilotRewardEvent {
  id: string;
  amount: number;
  source: string;
  source_id: string;
  created_at: string;
}

export interface PilotSkill {
  id: string;
  label: string;
  description: string;
  grade_id: string;
  subject_id: string;
}

export interface PilotSkillEvidence {
  learner_id: string;
  skill_id: string;
  lesson_id: string;
  created_at: string;
}

export interface PilotAssignment {
  id: string;
  teacher_id: string;
  lesson_id: string;
  title: string;
  due_at: string | null;
  created_at: string;
}

export interface PilotAssignmentTarget {
  assignment_id: string;
  learner_id: string;
}

export interface PilotQuizResult {
  correct: number;
  total: number;
  completed: boolean;
  newlyCompleted: boolean;
  awardedGp: number;
}

export interface PilotStudioEvent {
  id: string;
  kind: "hint" | "check";
  at: number;
  detail: string;
  input?: string;
  valid?: boolean;
}

export interface PilotStudioPayload {
  input: string;
  openedHints: number[];
  events: PilotStudioEvent[];
  sketch: Array<Array<{ x: number; y: number }>>;
}

/** Treat persisted learner notes as untrusted JSON, never as verified mastery. */
export function readStudioPayload(value: unknown): PilotStudioPayload {
  const initial: PilotStudioPayload = { input: "", openedHints: [], events: [], sketch: [] };
  if (!value || typeof value !== "object" || Array.isArray(value)) return initial;
  const obj = value as Record<string, unknown>;
  const input = typeof obj.input === "string" ? obj.input.slice(0, 4000) : "";
  const openedHints = Array.isArray(obj.openedHints)
    ? obj.openedHints.filter((v): v is number => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 3).slice(0, 3)
    : [];
  const events: PilotStudioEvent[] = Array.isArray(obj.events)
    ? obj.events.filter((v): v is PilotStudioEvent =>
      Boolean(v) && typeof v === "object" && typeof v.id === "string"
      && (v.kind === "hint" || v.kind === "check")
      && Number.isFinite(v.at) && typeof v.detail === "string"
      && (v.input === undefined || typeof v.input === "string")
      && (v.valid === undefined || typeof v.valid === "boolean"))
      .slice(-100).map(v => ({
        id: v.id.slice(0, 100), kind: v.kind, at: v.at,
        detail: v.detail.slice(0, 500),
        input: typeof v.input === "string" ? v.input.slice(0, 4000) : undefined,
        valid: v.valid,
      }))
    : [];
  const sketch = Array.isArray(obj.sketch)
    ? obj.sketch.filter((stroke): stroke is Array<{x:number; y:number}> =>
      Array.isArray(stroke) && stroke.length <= 300 &&
      stroke.every(point => point && typeof point === "object" &&
        Number.isFinite(point.x) && Number.isFinite(point.y) &&
        point.x >= 0 && point.x <= 800 && point.y >= 0 && point.y <= 300))
      .slice(-80)
    : [];
  return { input, openedHints: [...new Set(openedHints)], events, sketch };
}

async function extractResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Avoid displaying the full provider response (possibly sensitive details).
    const reason =
      response.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." :
      response.status === 403 ? "Tài khoản chưa được cấp quyền cho thao tác này." :
      response.status === 409 ? "Dữ liệu đã thay đổi, hãy tải lại trước khi lưu." :
      response.status === 429 ? "Thao tác quá nhanh. Hãy thử lại." :
      response.status >= 500 ? "Dịch vụ học tập tạm thời không phản hồi." :
      "Yêu cầu chưa được hệ thống chấp nhận. Hãy kiểm tra dữ liệu và thử lại.";
    throw new Error(reason);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function headers(token?: string, extras?: HeadersInit) {
  const h = new Headers(extras);
  h.set("apikey", apiKey);
  if (token) h.set("Authorization", "Bearer " + token);
  h.set("Accept", "application/json");
  h.set("Content-Type", "application/json");
  return h;
}

export async function pilotRead<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(base + "/rest/v1/" + path, {
    method: "GET", headers: headers(token), cache: "no-store", signal,
  });
  return extractResponse<T>(response);
}

export async function pilotWrite<T>(
  path: string, token: string, body: unknown,
  method: "POST" | "PATCH" = "POST", prefer = "return=representation",
): Promise<T> {
  const response = await fetch(base + "/rest/v1/" + path, {
    method, headers: headers(token, { Prefer: prefer }), cache: "no-store",
    body: JSON.stringify(body),
  });
  return extractResponse<T>(response);
}

export async function pilotDelete(path: string, token: string): Promise<void> {
  const response = await fetch(base + "/rest/v1/" + path, {
    method: "DELETE", headers: headers(token), cache: "no-store",
  });
  await extractResponse<void>(response);
}

export function pilotRpc<T>(name: "tutor_submit_lesson_quiz", token: string, body: unknown) {
  return pilotWrite<T>("rpc/" + name, token, body);
}

type RawGrant = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: { id: string; email?: string };
};

function grantSession(raw: RawGrant, fallback?: PilotSession): PilotSession {
  if (!raw.access_token || !raw.refresh_token || !Number.isFinite(raw.expires_in)) {
    throw new Error("Máy chủ không trả về phiên đăng nhập hợp lệ.");
  }
  const userId = raw.user?.id ?? fallback?.userId;
  if (!userId) throw new Error("Không xác minh được tài khoản.");
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: Date.now() + raw.expires_in * 1000,
    userId,
    email: raw.user?.email ?? fallback?.email ?? "",
  };
}

export async function pilotSignIn(email: string, password: string): Promise<PilotSession> {
  const response = await fetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: headers(), cache: "no-store",
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (response.status === 400 || response.status === 401) {
    throw new Error("Email hoặc mật khẩu chưa đúng.");
  }
  return grantSession(await extractResponse<RawGrant>(response));
}

export async function pilotRefresh(session: PilotSession): Promise<PilotSession> {
  const response = await fetch(base + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST", headers: headers(), cache: "no-store",
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  return grantSession(await extractResponse<RawGrant>(response), session);
}

export async function pilotGetUser(token: string): Promise<PilotIdentity> {
  const response = await fetch(base + "/auth/v1/user", {
    headers: headers(token), cache: "no-store",
  });
  return extractResponse<PilotIdentity>(response);
}

export async function pilotSignOut(token: string): Promise<void> {
  const response = await fetch(base + "/auth/v1/logout", {
    method: "POST", headers: headers(token), cache: "no-store",
  });
  if (!response.ok && response.status !== 401) {
    throw new Error("Không thể hủy phiên đăng nhập trên máy chủ.");
  }
}
