import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  INITIAL_LESSONS,
  INITIAL_TOPICS,
  SUBJECTS,
  canStudy,
  type Lesson,
  type Topic,
  type Subject,
} from "../data/curriculum";
import { loadPublishedCurriculum } from "../data/contentRepository";
import { storageKeys } from "../config/storage";
import { initialCompletedLessonIds } from "../features/learning/data/student";

export type CurriculumContentSource = "database" | "fallback";

interface CurriculumState {
  subjects: Subject[];
  topics: Topic[];
  setTopics: Dispatch<SetStateAction<Topic[]>>;
  lessons: Lesson[];
  setLessons: Dispatch<SetStateAction<Lesson[]>>;
  completedLessonIds: string[];
  setCompletedLessonIds: Dispatch<SetStateAction<string[]>>;
  completeLesson: (lessonId: string) => boolean;
  contentSource: CurriculumContentSource;
  contentLoading: boolean;
  contentError: string | null;
  refreshContent: () => Promise<void>;
  storageError: string | null;
}

const CurriculumContext = createContext<CurriculumState | null>(null);

const isCompletedIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((id) => typeof id === "string") &&
  new Set(value).size === value.length;

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    SUBJECTS.map((subject) => ({ ...subject })),
  );
  const [topics, setTopics] = useState<Topic[]>(() =>
    structuredClone(INITIAL_TOPICS),
  );
  const [lessons, setLessons] = useState<Lesson[]>(() =>
    structuredClone(INITIAL_LESSONS),
  );
  const [contentSource, setContentSource] =
    useState<CurriculumContentSource>("fallback");
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

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

  const refreshContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const snapshot = await loadPublishedCurriculum();
      setSubjects(snapshot.subjects);
      setTopics(snapshot.topics);
      setLessons(snapshot.lessons);
      setContentSource("database");
      setContentError(null);
    } catch (error) {
      setContentSource("fallback");
      setContentError(
        error instanceof Error
          ? error.message
          : "Không tải được nội dung từ database. Đang dùng dữ liệu dự phòng.",
      );
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshContent();
  }, [refreshContent]);

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
        subjects,
        topics,
        setTopics,
        lessons,
        setLessons,
        completedLessonIds,
        setCompletedLessonIds,
        completeLesson,
        contentSource,
        contentLoading,
        contentError,
        refreshContent,
        storageError: completionError,
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
