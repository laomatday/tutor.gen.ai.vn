import practiceData from "./practice/practice-problems.json";
import toolsData from "./practice/tools.json";

import type {
  PracticeProblem,
  FormulaTool,
  PracticePolicy,
} from "../types/content";
import { validatePracticeProblemData } from "./validation";

const problems = practiceData as PracticeProblem[];
const formulaToolsList = toolsData.formulaTools as FormulaTool[];
const policy = toolsData.policy as PracticePolicy;

if (process.env.NODE_ENV !== "production") {
  const errors = problems.flatMap(validatePracticeProblemData);
  if (errors.length > 0) {
    console.warn("[Content Validation] Practice problem issues:", errors);
  }
}

export function getPracticeProblems(): PracticeProblem[] {
  return problems.map((p) => structuredClone(p));
}

export function getPracticeProblem(id?: string): PracticeProblem {
  const found = id ? problems.find((p) => p.id === id) : problems[0];
  if (!found) throw new Error(`Practice problem not found: ${id}`);
  return structuredClone(found);
}

export function getFormulaTools(): FormulaTool[] {
  return formulaToolsList.map((t) => ({ ...t }));
}

export function getPracticePolicy(): PracticePolicy {
  return { ...policy };
}

/** Backward-compatible exports loaded from JSON */
export const practiceProblem = Object.freeze(getPracticeProblem());
export const formulaTools = Object.freeze(getFormulaTools());
export const practicePolicy = Object.freeze(getPracticePolicy());
