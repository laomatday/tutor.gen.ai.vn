import type { Lesson, Topic } from "../../types/content";
import { ownedPublishedLessons } from "../../features/curriculum";

export interface UniverseTopicNode {
  id: string;
  topic: Topic;
  subjectId: string;
  gradeId: string;
  lessons: Lesson[];
  complete: number;
  state: "complete" | "current" | "available";
  x: number;
  y: number;
}

export interface UniverseEdge {
  sourceId: string;
  targetId: string;
  kind: "curriculum_order";
}

// Spatial composition maps enrolled subjects to distinct learning territories.
// Display-only positions are deterministic, never prerequisite/mastery evidence.
// The first two territories reserve separate zones at common 1440px widths.
const subjectAnchors = [
  { x: 63, y: 40, rx: 20, ry: 28 },
  { x: 20, y: 68, rx: 8, ry: 20 },
  { x: 80, y: 73, rx: 8, ry: 13 },
  { x: 23, y: 24, rx: 11, ry: 13 },
] as const;

/**
 * Only the actual published, enrolled curriculum produces topic nodes.
 * Spatial position is decorative and deterministic, not a mastery estimate.
 */
export function buildUniverseGraph(
  allLessons: Lesson[],
  allTopics: Topic[],
  completedIds: string[],
) {
  const available = ownedPublishedLessons(allLessons, allTopics);
  const completed = new Set(completedIds);
  const next = available.find((lesson) => !completed.has(lesson.id));
  const bySubject = [...new Set(available.map((lesson) => lesson.subjectId))];
  const nodes: UniverseTopicNode[] = [];
  const edges: UniverseEdge[] = [];

  for (const [group, subjectId] of bySubject.entries()) {
    const all = available.filter((lesson) => lesson.subjectId === subjectId);
    const topicIds = [...new Set(all.map((lesson) => lesson.topicId))];
    const anchor = subjectAnchors[group % subjectAnchors.length];
    for (const [index, topicId] of topicIds.entries()) {
      const groupedLessons = all.filter((lesson) => lesson.topicId === topicId);
      const topic = allTopics.find(
        (item) =>
          item.id === topicId &&
          item.gradeId === groupedLessons[0].gradeId &&
          item.subjectId === subjectId,
      );
      if (!topic) continue;
      const done = groupedLessons.filter((lesson) => completed.has(lesson.id)).length;
      const theta = -Math.PI / 2 + index * (Math.PI * 2 / Math.max(topicIds.length, 3));
      nodes.push({
        id: `${topic.gradeId}:${subjectId}:${topic.id}`,
        topic,
        subjectId,
        gradeId: topic.gradeId,
        lessons: groupedLessons,
        complete: done,
        state:
          done === groupedLessons.length
            ? "complete"
            : groupedLessons.some((lesson) => lesson.id === next?.id)
              ? "current"
              : "available",
        x: Math.min(94, Math.max(6, anchor.x + Math.cos(theta) * anchor.rx)),
        y: Math.min(90, Math.max(10, anchor.y + Math.sin(theta) * anchor.ry)),
      });
    }
    const groupNodes = nodes.filter((item) => item.subjectId === subjectId);
    for (let i = 0; i < groupNodes.length - 1; i++) {
      edges.push({
        sourceId: groupNodes[i].id,
        targetId: groupNodes[i + 1].id,
        kind: "curriculum_order",
      });
    }
  }
  return { nodes, edges };
}

export function universeSearch(
  nodes: UniverseTopicNode[],
  needle: string,
  subject: string,
) {
  const term = needle.trim().toLocaleLowerCase("vi");
  return nodes.filter(
    (node) =>
      (subject === "all" || node.subjectId === subject) &&
      (!term ||
        [
          node.topic.title,
          node.topic.description,
          ...node.lessons.flatMap((lesson) => [lesson.title, lesson.summary]),
        ].join(" ").toLocaleLowerCase("vi").includes(term)),
  );
}
