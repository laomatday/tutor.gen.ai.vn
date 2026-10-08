import { contentDatabaseConfig } from "../config/contentDatabase";
import type {
  Subject,
  Topic,
  Lesson,
  LessonContentBlock,
  LessonExample,
  LessonExercise,
} from "../types/content";

interface SubjectRow {
  id: string;
  name: string;
  icon: string;
  description: string;
  card_image_url: string | null;
  hero_image_url: string | null;
  capabilities: Subject["capabilities"] | null;
  theme: Record<string, string> | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
}

interface TopicRow {
  id: string;
  grade_id: string;
  subject_id: string;
  title: string;
  description: string;
  card_image_url: string | null;
  hero_image_url: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
}

interface LessonRow {
  id: string;
  grade_id: string;
  subject_id: string;
  topic_id: string;
  title: string;
  summary: string;
  kind: "lesson" | "problem-type";
  duration_minutes: number;
  sort_order: number;
  status: "draft" | "published" | "archived";
  thumbnail_url: string | null;
  hero_image_url: string | null;
  content_blocks: LessonContentBlock[] | null;
  examples: LessonExample[] | null;
  exercises: LessonExercise[] | null;
  media: Lesson["media"] | null;
}

export interface PublishedCurriculumSnapshot {
  subjects: Subject[];
  topics: Topic[];
  lessons: Lesson[];
}

function endpoint(table: string, query: string) {
  const base = contentDatabaseConfig.url.replace(/\/$/, "");
  return `${base}/rest/v1/${table}?${query}`;
}

async function readRows<T>(table: string, query: string, signal?: AbortSignal): Promise<T[]> {
  if (!contentDatabaseConfig.enabled) {
    throw new Error("Database content disabled by VITE_CONTENT_SOURCE=local.");
  }
  const response = await fetch(endpoint(table, query), {
    headers: {
      apikey: contentDatabaseConfig.publishableKey,
      Accept: "application/json",
    },
    signal,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Content database request failed (${response.status}) for ${table}${body ? `: ${body.slice(0, 180)}` : ""}`,
    );
  }
  return (await response.json()) as T[];
}

function topicRowToModel(row: TopicRow): Topic {
  return {
    id: row.id,
    gradeId: row.grade_id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description,
    cardImageUrl: row.card_image_url,
    heroImageUrl: row.hero_image_url,
  };
}

function subjectRowToModel(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    description: row.description,
    cardImageUrl: row.card_image_url,
    heroImageUrl: row.hero_image_url,
    capabilities: row.capabilities ?? {},
    theme: row.theme ?? {},
  };
}

function blockToLegacyTheory(block: LessonContentBlock) {
  if (block.type === "paragraph") {
    return { heading: block.heading ?? "", text: block.text };
  }
  if (block.type === "callout") {
    return { heading: block.title ?? "", text: block.text };
  }
  return null;
}

function lessonRowToModel(row: LessonRow): Lesson {
  const blocks = Array.isArray(row.content_blocks) ? row.content_blocks : [];
  const theory = blocks
    .map(blockToLegacyTheory)
    .filter((block): block is { heading: string; text: string } => Boolean(block));

  return {
    id: row.id,
    gradeId: row.grade_id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    title: row.title,
    summary: row.summary,
    kind: row.kind,
    durationMinutes: row.duration_minutes,
    order: row.sort_order,
    status: row.status === "published" ? "published" : "draft",
    thumbnailUrl: row.thumbnail_url,
    heroImageUrl: row.hero_image_url,
    contentBlocks: blocks,
    media: Array.isArray(row.media) ? row.media : [],
    theory,
    examples: Array.isArray(row.examples) ? row.examples : [],
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
  };
}

export async function loadPublishedCurriculum(
  signal?: AbortSignal,
): Promise<PublishedCurriculumSnapshot> {
  const [subjectRows, topicRows, lessonRows] = await Promise.all([
    readRows<SubjectRow>(
      "tutor_subjects",
      "select=id,name,icon,description,card_image_url,hero_image_url,capabilities,theme,status,sort_order&status=eq.published&order=sort_order.asc",
      signal,
    ),
    readRows<TopicRow>(
      "tutor_topics",
      "select=id,grade_id,subject_id,title,description,card_image_url,hero_image_url,status,sort_order&status=eq.published&order=subject_id.asc,grade_id.asc,sort_order.asc",
      signal,
    ),
    readRows<LessonRow>(
      "tutor_lessons",
      "select=id,grade_id,subject_id,topic_id,title,summary,kind,duration_minutes,sort_order,status,thumbnail_url,hero_image_url,content_blocks,examples,exercises,media&status=eq.published&order=subject_id.asc,topic_id.asc,sort_order.asc",
      signal,
    ),
  ]);

  if (!subjectRows.length || !topicRows.length || !lessonRows.length) {
    throw new Error("Content database returned an incomplete curriculum snapshot.");
  }

  return {
    subjects: subjectRows.map(subjectRowToModel),
    topics: topicRows.map(topicRowToModel),
    lessons: lessonRows.map(lessonRowToModel),
  };
}
