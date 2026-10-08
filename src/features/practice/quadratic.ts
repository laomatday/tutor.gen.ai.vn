import type { PracticeProblem } from "../../types/content";
import { practicePolicy } from "./data";
import type { AnswerCheck } from "./domain";

/** Coefficients in ascending power order. The grammar only accepts polynomials of degree <= 2. */
type Polynomial = [number, number, number];
const EPSILON = 1e-8;
const add = (a: Polynomial, b: Polynomial, sign = 1): Polynomial =>
  a.map((value, i) => value + sign * b[i]) as Polynomial;
function multiply(a: Polynomial, b: Polynomial): Polynomial {
  const result = [0, 0, 0, 0, 0];
  a.forEach((left, i) =>
    b.forEach((right, j) => {
      result[i + j] += left * right;
    }),
  );
  if (result.slice(3).some((value) => Math.abs(value) > EPSILON))
    throw new Error("Degree too high");
  return result.slice(0, 3) as Polynomial;
}
export function parsePolynomial(source: string): Polynomial {
  const scanned = source.match(/\d+(?:\.\d+)?|[x()+\-*/^]/g);
  if (!scanned || scanned.join("") !== source || scanned.length > 256)
    throw new Error("Unsupported expression");
  const tokens = scanned;
  let position = 0;
  const peek = () => tokens[position];
  function atom(): Polynomial {
    const token = tokens[position++];
    if (token === "(") {
      const result = sum();
      if (tokens[position++] !== ")") throw new Error("Unclosed parenthesis");
      return result;
    }
    if (token === "x") return [0, 1, 0];
    if (token && /^\d/.test(token)) return [Number(token), 0, 0];
    throw new Error("Expected number or x");
  }
  function power(): Polynomial {
    let value = atom();
    if (peek() === "^") {
      position++;
      if (tokens[position++] !== "2")
        throw new Error("Only squares are supported");
      value = multiply(value, value);
    }
    return value;
  }
  function unary(): Polynomial {
    if (peek() === "+") {
      position++;
      return unary();
    }
    if (peek() === "-") {
      position++;
      return unary().map((value) => -value) as Polynomial;
    }
    return power();
  }
  function product(): Polynomial {
    let value = unary();
    while (["*", "/", "x", "("].includes(peek()) || /^\d/.test(peek() ?? "")) {
      const operator = peek();
      if (operator === "*" || operator === "/") position++;
      const right = unary();
      if (operator === "/") {
        if (right[1] || right[2] || Math.abs(right[0]) < EPSILON)
          throw new Error("Nonconstant denominator");
        value = value.map(
          (coefficient) => coefficient / right[0],
        ) as Polynomial;
      } else value = multiply(value, right);
    }
    return value;
  }
  function sum(): Polynomial {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const operator = tokens[position++];
      value = add(value, product(), operator === "+" ? 1 : -1);
    }
    return value;
  }
  const result = sum();
  if (
    position !== tokens.length ||
    result.some((value) => !Number.isFinite(value))
  )
    throw new Error("Invalid expression");
  return result.map((value) => (value === 0 ? 0 : value)) as Polynomial;
}

export function verifyQuadraticAnswer(
  input: string,
  quadratic: NonNullable<PracticeProblem["quadratic"]>,
): AnswerCheck {
  if (!input.trim())
    return {
      valid: false,
      issue: "empty",
      message:
        "Viết phép biến đổi đầu tiên, rồi kiểm tra để ghi lại tiến trình của em.",
    };
  if (input.length > practicePolicy.inputLimit)
    return {
      valid: false,
      issue: "format",
      message: "Bài làm quá dài. Hãy chia thành các phép biến đổi ngắn.",
    };
  let source = input
    .replace(/\$/g, "")
    .replace(/\\(?:left|right)/g, "")
    .replace(/\\(?:iff|Leftrightarrow|Rightarrow|implies)|⇔|⇒|=>/g, "⇔")
    .replace(/\\(?:cdot|times)|×|·/g, "*")
    .replace(/−/g, "-")
    .replace(/²/g, "^2")
    .replace(/÷/g, "/");
  while (/\\frac\{[^{}]+\}\{[^{}]+\}/.test(source)) {
    source = source.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))");
  }
  const target: Polynomial = [quadratic.c, quadratic.b, quadratic.a];
  const rootError: AnswerCheck = {
    valid: false,
    issue: "roots",
    message:
      "Tập nghiệm chưa đúng hoặc chưa đủ. Viết cả hai nhánh bằng “hoặc”, rồi kiểm tra từng nghiệm trong phương trình ban đầu.",
  };
  const expected = [...new Set(quadratic.roots)].sort((a, b) => a - b);
  const matchesRoots = (values: number[]) => {
    const unique = [...new Set(values)].sort((a, b) => a - b);
    return (
      unique.length === expected.length &&
      unique.every(
        (value, index) => Math.abs(value - expected[index]) < EPSILON,
      )
    );
  };
  if (!Number.isFinite(quadratic.a) || quadratic.a === 0)
    return {
      valid: false,
      issue: "format",
      message: "Bài tập chưa có dữ kiện hợp lệ.",
    };
  let hasConclusion = false;
  const listedRoots: number[] = [];
  try {
    source = source.replace(
      /S\s*=\s*\\?\{([^}]+)\\?\}/gi,
      (_, values: string) => {
        const parts = values
          .replace(/\\/g, "")
          .split(/[;,]/)
          .map((value) => Number(value.trim()));
        if (!parts.length || parts.some((value) => !Number.isFinite(value)))
          throw new Error("Invalid roots");
        return parts.map((value) => `x=${value}`).join(" hoặc ");
      },
    );
    // Explicit equivalence/implication joins whole solution sets. It must never merge x=r1 ⇔ x=r2 into an OR.
    const hasConnectors = source.includes("⇔");
    const stages = source
      .split(/\n|;|⇔/)
      .map((stage) => stage.trim())
      .filter(Boolean);
    for (const stage of stages) {
      const branches = stage
        .split(/hoặc|\bor\b|∨|,/)
        .map((branch) => branch.replace(/\s+/g, ""))
        .filter(Boolean);
      if (branches.length > 1) {
        const branchRoots = branches.map((branch) => {
          const parts = branch.split("=");
          if (parts.length !== 2)
            throw new Error("Expected one linear equation in each branch");
          const difference = add(
            parsePolynomial(parts[0]),
            parsePolynomial(parts[1]),
            -1,
          );
          if (
            Math.abs(difference[2]) > EPSILON ||
            Math.abs(difference[1]) < EPSILON
          )
            throw new Error("Expected linear branches");
          return -difference[0] / difference[1];
        });
        if (!matchesRoots(branchRoots)) return rootError;
        hasConclusion = true;
        continue;
      }
      const parts = branches[0]?.split("=") ?? [];
      if (parts.length < 2 || parts.some((part) => !part))
        throw new Error("Expected equation");
      if (parts[0] === "x" && parts.length === 2) {
        const value = parsePolynomial(parts[1]);
        if (value[1] || value[2]) throw new Error("Expected constant root");
        if (hasConnectors && !matchesRoots([value[0]])) return rootError;
        listedRoots.push(value[0]);
        continue;
      }
      const expressions = parts.map(parsePolynomial);
      for (let i = 1; i < expressions.length; i++) {
        const difference = add(expressions[i - 1], expressions[i], -1);
        if (difference.every((value) => Math.abs(value) < EPSILON)) continue;
        const ratio = difference[2] / target[2];
        if (
          Math.abs(ratio) < EPSILON ||
          difference.some(
            (value, index) => Math.abs(value - ratio * target[index]) > EPSILON,
          )
        ) {
          return {
            valid: false,
            issue: "equation",
            message:
              "Phép biến đổi chưa khớp phương trình. Thử khai triển lại: tổng hai số phải bằng hệ số của x, còn tích phải bằng hệ số tự do.",
          };
        }
      }
    }
    if (listedRoots.length) {
      if (!matchesRoots(listedRoots)) return rootError;
      hasConclusion = true;
    }
    if (!hasConclusion)
      return {
        valid: false,
        issue: "incomplete",
        message:
          "Các phép biến đổi phù hợp. Hãy kết luận đủ nghiệm bằng x = … hoặc x = … để hoàn thành.",
      };
    return {
      valid: true,
      message:
        "Các phép biến đổi và tập nghiệm đều khớp phương trình. Em đã hoàn thành bài tập!",
    };
  } catch {
    return {
      valid: false,
      issue: "format",
      message:
        "Bộ kiểm tra hỗ trợ x, số, +, −, ×, /, bình phương và dấu =. Viết mỗi phép biến đổi một dòng; kết luận x = … hoặc x = ….",
    };
  }
}
