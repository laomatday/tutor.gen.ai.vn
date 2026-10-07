import gradesData from '../../data/curriculum/grades.json';
import subjectsData from '../../data/curriculum/subjects.json';
import stagesData from '../../data/curriculum/stages.json';
import type { Grade, Subject, LessonStageInfo } from '../../types/content';

export const GRADES: Grade[] = gradesData as Grade[];
export const SUBJECTS: Subject[] = subjectsData as Subject[];
export const lessonStages: LessonStageInfo[] = stagesData as LessonStageInfo[];
