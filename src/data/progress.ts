import assessmentData from "./progress/sample-assessment.json";

import type { SampleAssessment, ProgressPolicy } from "../types/content";
import { validateAssessmentData } from "./validation";

const assessment = assessmentData.assessment as SampleAssessment;
const policy = assessmentData.policy as ProgressPolicy;

if (process.env.NODE_ENV !== "production") {
  const errors = validateAssessmentData(assessment);
  if (errors.length > 0) {
    console.warn("[Content Validation] Assessment issues:", errors);
  }
}

export function getSampleAssessment(): SampleAssessment {
  return structuredClone(assessment);
}

export function getProgressPolicy(): ProgressPolicy {
  return { ...policy };
}

export function assessmentSummary(
  targetAssessment: SampleAssessment = assessment,
) {
  const recoverablePoints =
    Math.round(
      targetAssessment.errors.reduce(
        (total, error) => total + error.lostPoints,
        0,
      ) * 10,
    ) / 10;
  return {
    recoverablePoints,
    reviewedScore: Math.min(
      targetAssessment.maximumScore,
      Math.round((targetAssessment.score + recoverablePoints) * 10) / 10,
    ),
    planDays: Math.max(...targetAssessment.plan.map((step) => step.toDay)),
    masteredSkills: targetAssessment.skills.filter(
      (skill) => skill.earned / skill.maximum >= policy.masteredRatio,
    ),
    developingSkills: targetAssessment.skills.filter(
      (skill) => skill.earned / skill.maximum < policy.masteredRatio,
    ),
  };
}

/** Backward-compatible exports loaded from JSON */
export const sampleAssessment = Object.freeze(getSampleAssessment());
export const progressPolicy = Object.freeze(getProgressPolicy());
export type AssessmentError = (typeof sampleAssessment.errors)[number];
