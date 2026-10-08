import { ICONS } from "../../components/ui/Icon";
import { appConfig } from "../../config/app";
import { storageKeys } from "../../config/storage";
import { readStoredValue, type StorageAdapter } from "../../lib/browserStorage";
import { localDate, localDayOfWeek } from "../../lib/dates";
import { initialScheduleSessions } from "./data";
import { DAYS_OF_WEEK, type ScheduleSession, type SessionType } from "./types";

const sessionTypes: readonly SessionType[] = [
  "chinh-khoa",
  "tutor",
  "tu-hoc",
  "thi-thu",
];

export interface ScheduleDraft {
  title: string;
  subjectName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionType: SessionType;
  location?: string;
  instructor?: string;
  notes?: string;
  onlineLink?: string;
}

export function timeToMinutes(time: string): number {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isWebLink(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function validateScheduleDraft(draft: ScheduleDraft) {
  const errors: Partial<Record<keyof ScheduleDraft, string>> = {};
  if (!draft.title.trim()) errors.title = "Đặt tên cho buổi học của em.";
  if (!draft.subjectName.trim())
    errors.subjectName = "Chọn môn học hoặc nội dung muốn học.";
  if (
    !Number.isInteger(draft.dayOfWeek) ||
    draft.dayOfWeek < 2 ||
    draft.dayOfWeek > 8
  )
    errors.dayOfWeek = "Chọn một ngày trong tuần.";
  if (!sessionTypes.includes(draft.sessionType))
    errors.sessionType = "Chọn hình thức học.";
  const start = timeToMinutes(draft.startTime);
  const end = timeToMinutes(draft.endTime);
  if (!Number.isFinite(start)) errors.startTime = "Nhập giờ bắt đầu hợp lệ.";
  if (!Number.isFinite(end)) errors.endTime = "Nhập giờ kết thúc hợp lệ.";
  else if (Number.isFinite(start) && end <= start)
    errors.endTime = "Giờ kết thúc cần sau giờ bắt đầu trong cùng ngày.";
  if (draft.onlineLink?.trim() && !isWebLink(draft.onlineLink.trim()))
    errors.onlineLink =
      "Nhập đường dẫn lớp học bắt đầu bằng https:// hoặc http://.";
  return errors;
}

export function isScheduleSessions(value: unknown): value is ScheduleSession[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return false;
    const item = entry as Record<string, unknown>;
    for (const field of [
      "id",
      "title",
      "subjectName",
      "subjectIcon",
      "startTime",
      "endTime",
      "location",
      "instructor",
    ])
      if (typeof item[field] !== "string") return false;
    for (const field of ["notes", "lessonId", "onlineLink"])
      if (item[field] !== undefined && typeof item[field] !== "string")
        return false;
    if (
      typeof item.dayOfWeek !== "number" ||
      typeof item.sessionType !== "string"
    )
      return false;
    if (!Object.hasOwn(ICONS, item.subjectIcon as string)) return false;
    if (
      !["upcoming", "in-progress", "completed"].includes(item.status as string)
    )
      return false;
    if (!(item.id as string).trim() || ids.has(item.id as string)) return false;
    ids.add(item.id as string);
    return (
      Object.keys(validateScheduleDraft(item as unknown as ScheduleDraft))
        .length === 0
    );
  });
}

/** Recurring timetable: dates label the displayed week, not dated appointments. */
export function getScheduleWeek(now = new Date(), weekOffset = 0) {
  const today = localDate(0, now);
  const mondayOffset = 2 - localDayOfWeek(now) + weekOffset * 7;
  return DAYS_OF_WEEK.map((day, index) => {
    const date = localDate(mondayOffset + index, now);
    return { ...day, date, isToday: date === today };
  });
}

export function selectScheduleSessions(
  sessions: readonly ScheduleSession[],
  filters: { day?: number; type?: SessionType | "all" } = {},
) {
  return sessions
    .filter(
      (session) =>
        (filters.day === undefined || session.dayOfWeek === filters.day) &&
        (!filters.type ||
          filters.type === "all" ||
          session.sessionType === filters.type),
    )
    .sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek ||
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime) ||
        a.id.localeCompare(b.id),
    );
}

export function summarizeSchedule(sessions: readonly ScheduleSession[]) {
  const typeCounts: Record<SessionType, number> = {
    "chinh-khoa": 0,
    tutor: 0,
    "tu-hoc": 0,
    "thi-thu": 0,
  };
  let minutes = 0;
  let completed = 0;
  for (const session of sessions) {
    typeCounts[session.sessionType] += 1;
    minutes +=
      timeToMinutes(session.endTime) - timeToMinutes(session.startTime);
    if (session.status === "completed") completed += 1;
  }
  return { count: sessions.length, minutes, completed, typeCounts };
}

/** Use wall-clock time in the configured timezone, never the browser timezone. */
export function getNextScheduleSession(
  sessions: readonly ScheduleSession[],
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: appConfig.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hours = Number(parts.find((part) => part.type === "hour")!.value);
  const minutes =
    hours * 60 + Number(parts.find((part) => part.type === "minute")!.value);
  const today = localDayOfWeek(now);
  const candidates = sessions
    .filter((session) => session.status !== "completed")
    .map((session) => {
      let daysAway = (session.dayOfWeek - today + 7) % 7;
      const start = timeToMinutes(session.startTime);
      const end = timeToMinutes(session.endTime);
      if (daysAway === 0 && end <= minutes) daysAway = 7;
      return {
        session,
        daysAway,
        date: localDate(daysAway, now),
        isOngoing: daysAway === 0 && start <= minutes && minutes < end,
      };
    });
  candidates.sort(
    (a, b) =>
      a.daysAway - b.daysAway ||
      a.session.startTime.localeCompare(b.session.startTime) ||
      a.session.id.localeCompare(b.session.id),
  );
  return candidates[0] ?? null;
}

/** Read-only on initialization; a malformed existing value remains recoverable. */
export function readSchedule(adapter: StorageAdapter) {
  return readStoredValue(
    adapter,
    storageKeys.studentSchedule,
    initialScheduleSessions,
    isScheduleSessions,
  );
}
