import test from "node:test";
import assert from "node:assert/strict";
import lessonsJson from "../../data/curriculum/lessons.json";
import topicsJson from "../../data/curriculum/topics.json";
import type { Lesson, Topic } from "../../types/content";
import { buildUniverseGraph, universeSearch } from "./graphDomain";

const lessons = lessonsJson as Lesson[];
const topics = topicsJson as Topic[];

test("Universe nodes match exclusively published, available learning content", () => {
  const graph = buildUniverseGraph(lessons, topics, []);
  assert.ok(graph.nodes.length > 2);
  assert.ok(graph.nodes.every((node) => node.lessons.length > 0));
  assert.ok(
    graph.nodes.every((node) =>
      node.lessons.every(
        (lesson) =>
          lesson.status === "published" &&
          lesson.gradeId === node.gradeId &&
          lesson.subjectId === node.subjectId &&
          lesson.topicId === node.topic.id,
      ),
    ),
  );
  assert.ok(graph.nodes.every((node) => Number.isFinite(node.x) && node.x >= 6 && node.x <= 94));
  assert.ok(graph.nodes.every((node) => Number.isFinite(node.y) && node.y >= 10 && node.y <= 90));
  assert.equal(new Set(graph.nodes.map((node) => node.id)).size, graph.nodes.length);
});

test("Map edges only represent order within one enrolled subject", () => {
  const graph = buildUniverseGraph(lessons, topics, []);
  for (const edge of graph.edges) {
    assert.equal(edge.kind, "curriculum_order");
    const source = graph.nodes.find((node) => node.id === edge.sourceId);
    const target = graph.nodes.find((node) => node.id === edge.targetId);
    assert.ok(source && target);
    assert.equal(source.subjectId, target.subjectId);
  }
  assert.deepEqual(buildUniverseGraph(lessons, topics, []), graph);
});

test("Universe search and completion labels honor real published lessons", () => {
  const published = buildUniverseGraph(lessons, topics, []);
  const current = published.nodes.flatMap((node) => node.lessons).find((lesson) => lesson.status === "published");
  assert.ok(current);
  const query = universeSearch(published.nodes, current.title, current.subjectId);
  assert.ok(query.some((node) => node.lessons.some((lesson) => lesson.id === current.id)));

  const completed = buildUniverseGraph(lessons, topics, [current.id]);
  const topic = completed.nodes.find((node) => node.lessons.some((lesson) => lesson.id === current.id));
  assert.ok(topic);
  assert.equal(topic.complete, 1);

  const unpublished = lessons.map((lesson) =>
    lesson.id === current.id ? { ...lesson, status: "draft" as const } : lesson,
  );
  const filtered = buildUniverseGraph(unpublished, topics, []);
  assert.ok(!filtered.nodes.some((node) => node.lessons.some((lesson) => lesson.id === current.id)));
});
