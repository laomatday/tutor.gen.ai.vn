export type SessionType = "chinh-khoa" | "tutor" | "tu-hoc" | "thi-thu";

export interface ScheduleSession {
  id: string;
  dayOfWeek: number; // 2: Thứ 2, 3: Thứ 3, ..., 7: Thứ 7, 8: Chủ Nhật
  title: string;
  subjectName: string;
  subjectIcon: string;
  startTime: string;
  endTime: string;
  sessionType: SessionType;
  location: string;
  instructor: string;
  notes?: string;
  lessonId?: string;
  onlineLink?: string;
  status: "upcoming" | "in-progress" | "completed";
}

export const DAYS_OF_WEEK = [
  { day: 2, label: "Thứ 2", short: "T2", full: "Thứ Hai" },
  { day: 3, label: "Thứ 3", short: "T3", full: "Thứ Ba" },
  { day: 4, label: "Thứ 4", short: "T4", full: "Thứ Tư" },
  { day: 5, label: "Thứ 5", short: "T5", full: "Thứ Năm" },
  { day: 6, label: "Thứ 6", short: "T6", full: "Thứ Sáu" },
  { day: 7, label: "Thứ 7", short: "T7", full: "Thứ Bảy" },
  { day: 8, label: "Chủ Nhật", short: "CN", full: "Chủ Nhật" },
];

export { initialScheduleSessions } from "./data";
