import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  INITIAL_LESSONS,
  INITIAL_TOPICS,
  canStudy,
  isLessons,
  isTopics,
  type Lesson,
  type Topic,
} from "../data/curriculum";
import { storageKeys } from "../config/storage";
import { initialCompletedLessonIds } from "../features/learning/data/student";

interface CurriculumState {
  topics: Topic[];
  setTopics: Dispatch<SetStateAction<Topic[]>>;
  lessons: Lesson[];
  setLessons: Dispatch<SetStateAction<Lesson[]>>;
  completedLessonIds: string[];
  setCompletedLessonIds: Dispatch<SetStateAction<string[]>>;
  completeLesson: (lessonId: string) => boolean;
  storageError: string | null;
}
const CurriculumContext = createContext<CurriculumState | null>(null);
const isCompletedIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((id) => typeof id === "string") &&
  new Set(value).size === value.length;

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics, topicError] = useLocalStorage(
    storageKeys.curriculumTopics,
    INITIAL_TOPICS,
    isTopics,
  );
  const [lessons, setLessons, lessonError] = useLocalStorage(
    storageKeys.curriculumLessons,
    INITIAL_LESSONS,
    isLessons,
  );
  const [completedLessonIds, setCompletedLessonIds, completionError] =
    useLocalStorage(
      storageKeys.completedLessons,
      initialCompletedLessonIds,
      isCompletedIds,
    );
  const completedRef = useRef(completedLessonIds);
  useEffect(() => {
    completedRef.current = completedLessonIds;
  }, [completedLessonIds]);

  const completeLesson = (lessonId: string) => {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (
      !lesson ||
      lesson.status !== "published" ||
      !canStudy(lesson.gradeId, lesson.subjectId) ||
      completedRef.current.includes(lessonId)
    )
      return false;
    const next = [...completedRef.current, lessonId];
    completedRef.current = next;
    setCompletedLessonIds(next);
    return true;
  };

  return (
    <CurriculumContext.Provider
      value={{
        topics,
        setTopics,
        lessons,
        setLessons,
        completedLessonIds,
        setCompletedLessonIds,
        completeLesson,
        storageError: topicError || lessonError || completionError,
      }}
    >
      {children}
    </CurriculumContext.Provider>
  );
}

export function useCurriculum() {
  const context = useContext(CurriculumContext);
  if (!context) throw new Error("useCurriculum requires CurriculumProvider");
  return context;
}
