import { practicePolicy } from "./data";
import type { PracticeProblem } from "../../types/content";
import { verifyQuadraticAnswer } from "./quadratic";

export type PracticeIssue =
  "empty" | "format" | "equation" | "roots" | "incomplete";
export type AnswerCheck = {
  valid: boolean;
  message: string;
  issue?: PracticeIssue;
};
export type SketchPoint = { x: number; y: number };
export type PracticeEvent = {
  id: string;
  at: number;
  kind: "start" | "hint" | "check" | "submit";
  detail: string;
  input?: string;
  valid?: boolean;
  issue?: PracticeIssue;
};

export type PracticeSession = {
  input: string;
  openedHints: number[];
  rewarded: boolean;
  solved?: boolean;
  usedHelp?: string[];
  problemId?: string;
  startedAt?: number;
  events?: PracticeEvent[];
  sketch?: SketchPoint[][];
  savedMistakes?: string[];
};

export function createPracticeSession(
  problemId: string,
  at = Date.now(),
): PracticeSession {
  return {
    problemId,
    startedAt: at,
    input: "",
    openedHints: [],
    rewarded: false,
    events: [
      {
        id: `${at}-start`,
        at,
        kind: "start",
        detail: "Bắt đầu phiên làm bài.",
      },
    ],
  };
}

export function appendPracticeEvent(
  session: PracticeSession,
  kind: PracticeEvent["kind"],
  detail: string,
  valid?: boolean,
  at = Date.now(),
  issue?: PracticeIssue,
  helpId?: string,
): PracticeSession {
  const previous = session.events ?? [];
  const timestamp = Math.max(
    at,
    session.startedAt ?? at,
    previous.at(-1)?.at ?? at,
  );
  let sequence = previous.length;
  while (previous.some((event) => event.id === `${timestamp}-${sequence}`))
    sequence++;
  const event: PracticeEvent = {
    id: `${timestamp}-${sequence}`,
    at: timestamp,
    kind,
    detail,
  };
  if (kind === "check" || kind === "submit") {
    event.input = session.input;
    event.valid = valid;
    event.issue = issue;
  }
  return {
    ...session,
    solved: session.solved || valid === true,
    usedHelp:
      kind === "hint"
        ? [
            ...new Set([
              ...getUsedPracticeHelp(session),
              helpId ?? `event:${event.id}`,
            ]),
          ]
        : session.usedHelp,
    events: [...previous, event].slice(-practicePolicy.eventLimit),
  };
}

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as PracticeSession;
  return (
    typeof session.input === "string" &&
    session.input.length <= practicePolicy.inputLimit &&
    typeof session.rewarded === "boolean" &&
    Array.isArray(session.openedHints) &&
    (session.solved === undefined || typeof session.solved === "boolean") &&
    (session.usedHelp === undefined ||
      (Array.isArray(session.usedHelp) &&
        session.usedHelp.every((id) => typeof id === "string") &&
        new Set(session.usedHelp).size === session.usedHelp.length)) &&
    session.openedHints.every(
      (id) => Number.isInteger(id) && id >= 1 && id <= 3,
    ) &&
    new Set(session.openedHints).size === session.openedHints.length &&
    (session.problemId === undefined ||
      typeof session.problemId === "string") &&
    (session.startedAt === undefined || Number.isFinite(session.startedAt)) &&
    (session.sketch === undefined ||
      (Array.isArray(session.sketch) &&
        session.sketch.length <= practicePolicy.sketchStrokeLimit &&
        session.sketch.every(
          (stroke) =>
            Array.isArray(stroke) &&
            stroke.length <= practicePolicy.sketchPointLimit &&
            stroke.every(
              (point) =>
                !!point &&
                Number.isFinite(point.x) &&
                Number.isFinite(point.y) &&
                point.x >= 0 &&
                point.x <= 800 &&
                point.y >= 0 &&
                point.y <= 300,
            ),
        ))) &&
    (session.savedMistakes === undefined ||
      (Array.isArray(session.savedMistakes) &&
        session.savedMistakes.every((id) => typeof id === "string"))) &&
    (session.events === undefined ||
      (Array.isArray(session.events) &&
        session.events.length <= practicePolicy.eventLimit &&
        new Set(session.events.map((event) => event?.id)).size ===
          session.events.length &&
        session.events.every(
          (event, index, events) =>
            !!event &&
            typeof event.id === "string" &&
            Number.isFinite(event.at) &&
            ["start", "hint", "check", "submit"].includes(event.kind) &&
            event.at >= (session.startedAt ?? 0) &&
            (index === 0 || event.at >= events[index - 1].at) &&
            typeof event.detail === "string" &&
            (!["check", "submit"].includes(event.kind) ||
              (typeof event.input === "string" &&
                typeof event.valid === "boolean")) &&
            (event.input === undefined ||
              (typeof event.input === "string" &&
                event.input.length <= practicePolicy.inputLimit)) &&
            (event.issue === undefined ||
              ["empty", "format", "equation", "roots", "incomplete"].includes(
                event.issue,
              )) &&
            (event.valid === undefined || typeof event.valid === "boolean"),
        )))
  );
}

export type PracticeSessions = Record<string, PracticeSession>;
export function isPracticeSessions(value: unknown): value is PracticeSessions {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([id, session]) => isPracticeSession(session) && session.problemId === id,
    )
  );
}

export function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function getPracticeStats(session: PracticeSession | undefined) {
  const events = session?.events ?? [];
  const checks = events.filter(
    (event) => event.kind === "check" || event.kind === "submit",
  );
  const mistakes = checks.filter(
    (event) =>
      event.valid === false &&
      (!event.issue || ["equation", "roots"].includes(event.issue)),
  );
  let awaitingCorrection = false;
  let corrections = 0;
  for (const event of checks) {
    if (mistakes.includes(event)) awaitingCorrection = true;
    else if (event.valid && awaitingCorrection) {
      corrections++;
      awaitingCorrection = false;
    }
  }
  return {
    events,
    checks,
    mistakes,
    corrections,
    hints: events.filter((event) => event.kind === "hint"),
    solved:
      !!session?.rewarded ||
      !!session?.solved ||
      checks.some((event) => event.valid),
    durationMs: Math.max(
      0,
      (events.at(-1)?.at ?? 0) - (session?.startedAt ?? events[0]?.at ?? 0),
    ),
  };
}

/** Reward evidence outlives the bounded replay log and a learner's decision to retry. */
export function getUsedPracticeHelp(session: PracticeSession): string[] {
  if (session.usedHelp) return session.usedHelp;
  const legacyHints = session.openedHints.map((id) => `hint:${id}`);
  const prompts = (session.events ?? [])
    .filter((event) => event.kind === "hint")
    .slice(legacyHints.length);
  return [...legacyHints, ...prompts.map((event) => `legacy:${event.id}`)];
}

/** Replay seeks by elapsed wall time, including the actual gaps between events. */
export function getReplayCursor(
  events: PracticeEvent[],
  start: number,
  elapsedMs: number,
): number {
  let cursor = -1;
  for (let i = 0; i < events.length; i++) {
    if (events[i].at - start <= elapsedMs) cursor = i;
  }
  return cursor;
}

export function autonomyReward(base: number, openedEarly: number): number {
  return Math.max(
    practicePolicy.minimumRewardGp,
    base - Math.max(0, openedEarly) * practicePolicy.hintPenaltyGp,
  );
}

/** A deliberately small arithmetic parser for the sample exercise; never executes user code. */
function evaluateExpression(source: string, coefficient: number): number {
  const scanned = source.match(/\d+(?:\.\d+)?|[a()+\-*/^]/g);
  if (!scanned || scanned.join("") !== source || scanned.length > 256)
    throw new Error("Unsupported expression");
  const tokens = scanned;
  let position = 0;
  const peek = () => tokens[position];
  function atom(): number {
    const token = tokens[position++];
    if (token === "(") {
      const value = sum();
      if (tokens[position++] !== ")") throw new Error("Unclosed parenthesis");
      return value;
    }
    if (token === "a") return coefficient;
    if (token && /^\d/.test(token)) return Number(token);
    throw new Error("Expected number");
  }
  function power(): number {
    const left = atom();
    if (peek() === "^") {
      position++;
      return left ** unary();
    }
    return left;
  }
  function unary(): number {
    if (peek() === "+") {
      position++;
      return unary();
    }
    if (peek() === "-") {
      position++;
      return -unary();
    }
    return power();
  }
  function product(): number {
    let value = unary();
    while (
      peek() === "*" ||
      peek() === "/" ||
      peek() === "a" ||
      peek() === "(" ||
      /^\d/.test(peek() ?? "")
    ) {
      const token = peek();
      if (token === "*" || token === "/") position++;
      const right = unary();
      value = token === "/" ? value / right : value * right;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const operator = tokens[position++];
      const right = product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }
  const value = sum();
  if (position !== tokens.length || !Number.isFinite(value))
    throw new Error("Invalid expression");
  return value;
}

/** Verifies arithmetic and an explicit a=… conclusion for this sample only, not arbitrary proofs. */
export function verifySampleAnswer(
  input: string,
  point: { x: number; y: number },
): AnswerCheck {
  if (!input.trim())
    return {
      valid: false,
      message: "Hãy nhập bước giải và kết luận hệ số a trước khi kiểm tra.",
    };
  if (input.length > practicePolicy.inputLimit)
    return {
      valid: false,
      message:
        "Bước giải quá dài. Hãy trình bày bằng các phép biến đổi ngắn gọn.",
    };
  const coefficient = point.y / point.x ** 2;
  if (!Number.isFinite(coefficient) || coefficient === 0)
    return {
      valid: false,
      message: "Bài mẫu chưa có hệ số hợp lệ để đối chiếu.",
    };
  let normalized = input
    .trim()
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\\(?:iff|Leftrightarrow|Rightarrow|implies)|⇔|⇒|=>/g, ";")
    .replace(/\\(?:cdot|times)|×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/²/g, "^2")
    .replace(/\\(?:left|right)/g, "");
  while (/\\frac\{[^{}]+\}\{[^{}]+\}/.test(normalized)) {
    normalized = normalized.replace(
      /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
      "(($1)/($2))",
    );
  }
  normalized = normalized.replace(/[{}]/g, (match) =>
    match === "{" ? "(" : ")",
  );
  const equations = normalized.split(";");
  let isolatedConclusion = false;
  try {
    for (const equation of equations) {
      const parts = equation.split("=");
      if (parts.length < 2 || parts.some((part) => !part))
        throw new Error("Expected equation");
      const values = parts.map((part) => evaluateExpression(part, coefficient));
      if (values.some((value) => Math.abs(value - values[0]) > 1e-9)) {
        return {
          valid: false,
          message:
            "Có phép biến đổi chưa đúng. Kiểm tra dấu, bình phương số âm và phép chia ở từng bước.",
        };
      }
      if (parts.includes("a") && parts.some((part) => !part.includes("a")))
        isolatedConclusion = true;
    }
  } catch {
    return {
      valid: false,
      message:
        "Chưa đối chiếu được cách viết này. Bài mẫu hỗ trợ số, a, dấu =, +, −, ×, /, bình phương, phân số và ⇔. Hãy viết rõ a = kết quả.",
    };
  }
  return isolatedConclusion
    ? {
        valid: true,
        message: "Các phép tính khớp với bài mẫu và hệ số a thỏa mãn đề bài.",
      }
    : {
        valid: false,
        message:
          "Phép biến đổi phù hợp. Hãy viết thêm kết luận a = kết quả để hoàn thành bước giải.",
      };
}

export function verifyPracticeAnswer(
  input: string,
  problem: PracticeProblem,
): AnswerCheck {
  if (problem.kind === "quadratic-factor" && problem.quadratic)
    return verifyQuadraticAnswer(input, problem.quadratic);
  const result = verifySampleAnswer(input, problem.point);
  if (result.valid) return result;
  const issue: PracticeIssue = !input.trim()
    ? "empty"
    : result.message.startsWith("Chưa đối chiếu")
      ? "format"
      : result.message.startsWith("Phép biến đổi phù hợp")
        ? "incomplete"
        : "equation";
  return { ...result, issue };
}
