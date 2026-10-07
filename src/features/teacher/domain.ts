import { GRADES, SUBJECTS } from '../curriculum/catalog';
import { classes, students } from './data';
import type { Student, Assignment } from './types';

export const teacherRules = { supportProgressPercent: 60, supportScore: 6.5, scoreScale: 10 } as const;
export const needsSupport = (student: Student) => student.completion < teacherRules.supportProgressPercent || student.score < teacherRules.supportScore;
export const averageProgress = (group: Student[]) => group.length ? Math.round(group.reduce((sum, student) => sum + student.completion, 0) / group.length) : 0;
export function isAssignment(value: unknown): value is Assignment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Assignment;
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.description === 'string'
    && classes.some(group => group.id === item.classId) && typeof item.dueDate === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) && !Number.isNaN(new Date(`${item.dueDate}T12:00:00`).getTime())
    && Array.isArray(item.submitted) && item.submitted.every(id => typeof id === 'string');
}


export const classStudents = (classId: string) => students.filter(student => student.classId === classId);
export const submissionCount = (assignment: Assignment) => classStudents(assignment.classId).filter(student => assignment.submitted.includes(student.id)).length;
export const isAssignments = (value: unknown): value is Assignment[] => Array.isArray(value) && value.every(isAssignment) && new Set(value.map(item => item.id)).size === value.length;

export function classLabel(classId: string): string {
  const group = classes.find(item => item.id === classId);
  const subject = SUBJECTS.find(item => item.id === group?.subjectId);
  return `${subject?.name || 'Lớp'} ${classId}`;
}
export const teachingProgramLabel = [
  ...new Set(classes.map(group => SUBJECTS.find(subject => subject.id === group.subjectId)?.name).filter(Boolean)),
  ...new Set(classes.map(group => GRADES.find(grade => grade.id === group.gradeId)?.label).filter(Boolean)),
].join(' · ');
