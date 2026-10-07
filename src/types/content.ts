/**
 * Semantic types for academic content and application data.
 * All content files are JSON-backed and validated via the Data Access Layer.
 */

export interface Grade {
  id: string;
  label: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export type LessonStage = 'theory' | 'examples' | 'exercises';

export interface LessonStageInfo {
  id: LessonStage;
  label: string;
  title: string;
  icon: string;
  description: string;
}

export interface Topic {
  id: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description: string;
}

export interface LessonTheoryBlock {
  heading: string;
  text: string;
}

export interface LessonExample {
  title: string;
  prompt: string;
  steps: string[];
  answer: string;
}

export interface LessonExercise {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  gradeId: string;
  subjectId: string;
  topicId: string;
  title: string;
  summary: string;
  kind: 'lesson' | 'problem-type';
  durationMinutes: number;
  order: number;
  status: 'draft' | 'published';
  theory: LessonTheoryBlock[];
  examples: LessonExample[];
  exercises: LessonExercise[];
}

export interface PracticeProblemPoint {
  x: number;
  y: number;
}

export interface PracticeHint {
  id: number;
  title: string;
  text: string;
}

export interface PracticePrompt {
  question: string;
  answer: string;
}

export interface PracticeProblem {
  id: string;
  label: string;
  title: string;
  course: string;
  topic: string;
  difficulty: string;
  point: PracticeProblemPoint;
  variable: string;
  statement: string;
  initialInput: string;
  setup: string;
  conclusion: string;
  graphXs: number[];
  hints: PracticeHint[];
  prompts: PracticePrompt[];
}

export interface FormulaTool {
  label: string;
  value: string;
  title: string;
}

export interface PracticePolicy {
  hintPenaltyGp: number;
  minimumRewardGp: number;
  inputLimit: number;
}

export interface RewardItem {
  id: string;
  name: string;
  cost: number;
  stock: number;
  unit: string;
  badgeText: string;
  badgeIcon: string;
  description: string;
  image: string;
  category: 'stationery' | 'tech' | 'limited';
  featured?: boolean;
}

export interface RewardFilter {
  id: 'all' | 'ready' | 'tech' | 'limited';
  label: string;
}

export interface RewardFlowStep {
  title: string;
  description: string;
}

export interface AssessmentErrorItem {
  id: string;
  title: string;
  category: string;
  lostPoints: number;
  wrong: string;
  correct: string;
  description: string;
  hint: string;
  lessonId: string | null;
}

export interface AssessmentSkillItem {
  id: string;
  title: string;
  earned: number;
  maximum: number;
  description: string;
  lessonId: string | null;
}

export interface AssessmentTimelineItem {
  from: number;
  to: number;
  label: string;
  description: string;
  tone: 'warning' | 'success' | 'primary' | 'neutral';
}

export interface AssessmentPlanStep {
  fromDay: number;
  toDay: number;
  title: string;
  minutesPerDay: number;
  description: string;
  lessonId: string | null;
}

export interface SampleAssessment {
  id: string;
  title: string;
  course: string;
  durationMinutes: number;
  questionCount: number;
  score: number;
  maximumScore: number;
  targetScore: number;
  errors: AssessmentErrorItem[];
  skills: AssessmentSkillItem[];
  timeline: AssessmentTimelineItem[];
  plan: AssessmentPlanStep[];
}

export interface ProgressPolicy {
  masteredRatio: number;
}

export interface AppConfig {
  brand: {
    name: string;
    wordmark: string;
    product: string;
    tagline: string;
    logoUrl: string;
    description: string;
  };
  locale: string;
  timeZone: string;
  rewards: {
    dailyLimit: number;
    lessonCompletionGp: number;
    initialBalance: number;
    initialDailyEarned: number;
  };
  feedback: {
    noticeDurationMs: number;
  };
}

export interface StudentEnrollment {
  gradeId: string;
  subjectId: string;
}

export interface StudentProfile {
  name: string;
  gradeId: string;
  className: string;
  avatarUrl: string;
  levelLabel: string;
  enrollments: StudentEnrollment[];
}

export interface TeacherClass {
  id: string;
  gradeId: string;
  subjectId: string;
  topic: string;
  tone: string;
}

export interface TeacherStudent {
  id: string;
  name: string;
  classId: string;
  completion: number;
  score: number;
  focus: string;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  classId: string;
  dueDate: string;
  description: string;
  submitted: string[];
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  active: boolean;
  group: string;
}
