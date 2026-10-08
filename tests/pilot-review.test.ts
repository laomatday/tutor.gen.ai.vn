import test from "node:test";
import assert from "node:assert/strict";
import {classifyLatestQuiz,countDistinctSkillEvidence,rewardLedgerBalance} from "../src/features/pilot/pilotReview";

test("teacher review signal describes latest quiz, not learner ability",()=>{
  assert.equal(classifyLatestQuiz(null),"no-evidence");
  assert.equal(classifyLatestQuiz({correct_count:0,question_count:0}),"no-evidence");
  assert.equal(classifyLatestQuiz({correct_count:-1,question_count:3}),"no-evidence");
  assert.equal(classifyLatestQuiz({correct_count:5,question_count:3}),"no-evidence");
  assert.equal(classifyLatestQuiz({correct_count:1,question_count:3}),"review-needed");
  assert.equal(classifyLatestQuiz({correct_count:3,question_count:3}),"quiz-passed");
});

test("skill evidence counts unique skill IDs but does not produce a mastery score",()=>{
  assert.equal(countDistinctSkillEvidence([]),0);
  assert.equal(countDistinctSkillEvidence([{skill_id:"a"},{skill_id:"a"},{skill_id:"b"}]),2);
});

test("official pilot GP derives from server ledger events",()=>{
  assert.equal(rewardLedgerBalance([]),0);
  assert.equal(rewardLedgerBalance([{amount:20},{amount:20}]),40);
  assert.equal(rewardLedgerBalance([{amount:20},{amount:-5}]),15);
  assert.equal(rewardLedgerBalance([{amount:20},{amount:1.5}]),20);
});
