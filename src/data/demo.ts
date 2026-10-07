import studentData from "./demo/student.json";
import teacherData from "./demo/teacher.json";
import usersData from "./demo/users.json";
import { localDate } from "../lib/dates";
import type {
  StudentProfile,
  TeacherClass,
  TeacherStudent,
  TeacherAssignment,
  ManagedUser,
} from "../types/content";

const profile = studentData.profile as StudentProfile;
const completedIds = studentData.initialCompletedLessonIds as string[];
const classes = teacherData.classes as TeacherClass[];
const students = teacherData.students as TeacherStudent[];
const users = usersData as ManagedUser[];

export function getStudentProfile(): StudentProfile {
  return structuredClone(profile);
}

export function getInitialCompletedLessonIds(): string[] {
  return [...completedIds];
}

export function getTeacherClasses(): TeacherClass[] {
  return classes.map((c) => ({ ...c }));
}

export function getTeacherStudents(): TeacherStudent[] {
  return students.map((s) => ({ ...s }));
}

export function getInitialAssignments(): TeacherAssignment[] {
  return teacherData.assignments.map((a) => ({
    id: a.id,
    title: a.title,
    classId: a.classId,
    dueDate: localDate(a.dueOffsetDays),
    description: a.description,
    submitted: [...a.submitted],
  }));
}

export function getInitialUsers(): ManagedUser[] {
  return users.map((u) => ({ ...u }));
}

/** Backward-compatible exports loaded from JSON */
export const studentProfile: StudentProfile = getStudentProfile();
export const initialCompletedLessonIds: string[] =
  getInitialCompletedLessonIds();
