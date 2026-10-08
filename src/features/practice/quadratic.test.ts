import assert from "node:assert/strict";
import { test } from "node:test";
import { getPracticeProblem } from "./data";
import { parsePolynomial, verifyQuadraticAnswer } from "./quadratic";
import {
  appendPracticeEvent,
  createPracticeSession,
  getPracticeStats,
  getReplayCursor,
  isPracticeSessions,
  verifyPracticeAnswer,
} from "./domain";

const problem = getPracticeProblem("quadratic-factor-01");
const quadratic = problem.quadratic!;

test("quadratic verifier accepts equivalent steps and the complete solution set", () => {
  for (const input of [
    "x² - 5x + 6 = 0\n(x-2)(x-3)=0\nx=2 hoặc x=3",
    "x^2-2x-3x+6=0 ⇔ x(x-2)-3(x-2)=0 ⇔ (x-2)(x-3)=0\nS={2;3}",
    "2x^2-10x+12=0; x=3; x=2",
    "S={3,2}",
    "x=6/2 hoặc x=4/2",
  ])
    assert.equal(verifyQuadraticAnswer(input, quadratic).valid, true, input);
});

test("quadratic verifier rejects an earlier wrong transformation even when final roots are right", () => {
  for (const input of [
    "(x-1)(x-6)=0\nx=2 hoặc x=3",
    "x²+5x+6=0\nS={2;3}",
    "2x²-5x+6=0\nS={2;3}",
  ]) {
    assert.equal(
      verifyQuadraticAnswer(input, quadratic).issue,
      "equation",
      input,
    );
  }
  for (const input of ["x=2", "S={-2;-3}", "S={2;3;4}"])
    assert.equal(verifyQuadraticAnswer(input, quadratic).issue, "roots", input);
  assert.equal(
    verifyQuadraticAnswer("(x-2)(x-3)=0", quadratic).issue,
    "incomplete",
  );
});

test("polynomial grammar rejects code, unknown variables, rational variable denominators and high powers", () => {
  assert.deepEqual(parsePolynomial("(x-2)(x-3)"), [6, -5, 1]);
  assert.deepEqual(parsePolynomial("-x^2"), [0, 0, -1]);
  assert.deepEqual(parsePolynomial("(-x)^2"), [0, 0, 1]);
  for (const source of [
    "alert(1)",
    "x^3",
    "(x*x)*x",
    "1/x",
    "3/0",
    "a+1",
    "NaN",
    "x**2",
  ])
    assert.throws(() => parsePolynomial(source), Error, source);
  assert.equal(
    verifyQuadraticAnswer("S={2;3};alert(1)", quadratic).valid,
    false,
  );
  assert.equal(verifyQuadraticAnswer("", quadratic).issue, "empty");
});

test("practice dispatch preserves the legacy parabola verifier and checks each problem independently", () => {
  assert.equal(
    verifyPracticeAnswer("a=3", getPracticeProblem("parabola-coefficient-03"))
      .valid,
    true,
  );
  assert.equal(verifyPracticeAnswer("a=3", problem).valid, false);
  assert.equal(verifyPracticeAnswer("x=2 hoặc x=3", problem).valid, true);
});

test("replay uses real timestamps and distinguishes corrections from repeated successful checks", () => {
  let session = createPracticeSession(problem.id, 1000);
  session = appendPracticeEvent(
    { ...session, input: "(x-2)(x-3)=0" },
    "check",
    "Need conclusion",
    false,
    2000,
    "incomplete",
  );
  session = appendPracticeEvent(
    { ...session, input: "(x-1)(x-6)=0" },
    "check",
    "Wrong sum",
    false,
    31000,
    "equation",
  );
  session = appendPracticeEvent(
    session,
    "hint",
    "Check the sum",
    undefined,
    44000,
  );
  session = appendPracticeEvent(
    { ...session, input: "x=2 hoặc x=3" },
    "check",
    "Correct",
    true,
    62000,
  );
  session = appendPracticeEvent(session, "submit", "Correct", true, 95000);
  const stats = getPracticeStats(session);
  assert.equal(stats.mistakes.length, 1);
  assert.equal(stats.corrections, 1);
  assert.equal(stats.hints.length, 1);
  assert.equal(stats.durationMs, 94000);
  assert.equal(getReplayCursor(stats.events, 1000, 29999), 1);
  assert.equal(getReplayCursor(stats.events, 1000, 30000), 2);
  assert.equal(getReplayCursor(stats.events, 1000, 60999), 3);
  assert.equal(getReplayCursor(stats.events, 1000, 61000), 4);
  assert.equal(getReplayCursor(stats.events, 1000, 94000), 5);
});

test("per-problem storage rejects mismatched ids, malformed sketches and corrupted events", () => {
  const first = createPracticeSession(problem.id, 1000);
  const second = createPracticeSession("parabola-coefficient-03", 1000);
  assert.equal(
    isPracticeSessions({ [problem.id]: first, [second.problemId!]: second }),
    true,
  );
  assert.equal(isPracticeSessions({ [problem.id]: second }), false);
  assert.equal(
    isPracticeSessions({
      [problem.id]: { ...first, sketch: [[{ x: 900, y: 0 }]] },
    }),
    false,
  );
  assert.equal(
    isPracticeSessions({
      [problem.id]: {
        ...first,
        events: [{ id: "bad", at: "tomorrow", kind: "start", detail: "" }],
      },
    }),
    false,
  );
});

test("root alternatives keep their logical grouping through every proof stage", () => {
  for (const input of ["x=2 ⇔ x=3", "x^2-5x+6=0 ⇔ x=2 ⇔ x=3", "x=2 ⇒ x=3"]) {
    assert.equal(verifyQuadraticAnswer(input, quadratic).valid, false, input);
  }
  const proof = "(x-2)(x-3)=0 ⇔ x-2=0 hoặc x-3=0 ⇔ x=2 hoặc x=3";
  assert.equal(verifyQuadraticAnswer(proof, quadratic).valid, true);
  assert.equal(
    verifyQuadraticAnswer("x-1=0 hoặc x-6=0 ⇔ x=2 hoặc x=3", quadratic).valid,
    false,
  );
});

test("durable help and completion survive a bounded replay log and a retry", async () => {
  const { getUsedPracticeHelp, autonomyReward } = await import("./domain");
  let session = createPracticeSession(problem.id, 1000);
  session = appendPracticeEvent(
    { ...session, openedHints: [1] },
    "hint",
    "First hint",
    undefined,
    2000,
    undefined,
    "hint:1",
  );
  session = appendPracticeEvent(
    session,
    "hint",
    "Prompt",
    undefined,
    2001,
    undefined,
    "prompt:0",
  );
  session = appendPracticeEvent(
    { ...session, input: "x=2 hoặc x=3" },
    "submit",
    "Correct",
    true,
    2002,
  );
  for (let index = 0; index < 125; index++)
    session = appendPracticeEvent(
      session,
      "check",
      "Keep trying",
      false,
      3000 + index,
      "equation",
    );
  assert.equal(session.events?.length, 120);
  assert.equal(getUsedPracticeHelp(session).length, 2);
  assert.equal(autonomyReward(20, getUsedPracticeHelp(session).length), 10);
  assert.equal(getPracticeStats(session).solved, true);
  const retried = {
    ...createPracticeSession(problem.id, 5000),
    usedHelp: getUsedPracticeHelp(session),
    solved: session.solved,
  };
  assert.equal(autonomyReward(20, getUsedPracticeHelp(retried).length), 10);
  assert.equal(getPracticeStats(retried).solved, true);
});

test("stored replay requires ordered timestamps, unique ids and real checked input", () => {
  const session = createPracticeSession(problem.id, 2000);
  for (const events of [
    [{ id: "a", at: 1000, kind: "start", detail: "" }],
    [
      { id: "a", at: 3000, kind: "start", detail: "" },
      { id: "b", at: 2000, kind: "hint", detail: "" },
    ],
    [
      { id: "a", at: 2000, kind: "start", detail: "" },
      { id: "a", at: 3000, kind: "hint", detail: "" },
    ],
    [{ id: "a", at: 3000, kind: "check", detail: "", valid: true }],
  ])
    assert.equal(
      isPracticeSessions({ [problem.id]: { ...session, events } }),
      false,
    );
  let bounded = session;
  for (let index = 0; index < 250; index++)
    bounded = appendPracticeEvent(bounded, "hint", "Hint", undefined, 3000);
  assert.equal(isPracticeSessions({ [problem.id]: bounded }), true);
});
