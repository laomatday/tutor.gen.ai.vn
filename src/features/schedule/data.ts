import scheduleData from "../../data/demo/schedule.json";
import type { ScheduleSession } from "./types";

/** Illustrative timetable, separate from the student's locally saved changes. */
export const initialScheduleSessions = structuredClone(
  scheduleData,
) as ScheduleSession[];
