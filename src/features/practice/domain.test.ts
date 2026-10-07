import assert from 'node:assert/strict';
import { test } from 'node:test';
import { autonomyReward, isPracticeSession, verifySampleAnswer } from './domain';
import { practiceProblem } from './data';

test('sample practice rejects blank, random text, incomplete work and a wrong coefficient', () => {
  for (const input of ['', '   ', 'random answer', 'a=-3', '12=4a', 'a=a', 'a=3 or a=-3', 'a=30/0', 'a=3; a=-3']) {
    assert.equal(verifySampleAnswer(input, practiceProblem.point).valid, false, input);
  }
});

test('sample practice checks every arithmetic step and accepts supported equivalent answers', () => {
  for (const input of ['a=3', 'a=12/4=3', '3=a', '12 = a \\cdot (-2)^2 \\iff 12=4a \\iff a=\\frac{12}{4}=3', 'a=\\frac{6}{2}', '12 = a×(-2)² ⇔ a = 3']) {
    assert.equal(verifySampleAnswer(input, practiceProblem.point).valid, true, input);
  }
  for (const input of ['12=-4a ⇔ a=3', '(-2)^2=-4 ⇔ a=3', 'a=12/0', 'a=2^3', 'a=3abc', 'a=alert(3)']) {
    assert.equal(verifySampleAnswer(input, practiceProblem.point).valid, false, input);
  }
});

test('practice data validation rejects corrupted or duplicate persisted hints', () => {
  assert.equal(isPracticeSession({ input: 'a=3', openedHints: [1, 2], rewarded: true }), true);
  assert.equal(isPracticeSession({ input: 'a=3', openedHints: [1, 1], rewarded: true }), false);
  assert.equal(isPracticeSession({ input: 'a=3', openedHints: [99], rewarded: true }), false);
  assert.equal(isPracticeSession({ input: [], openedHints: [1], rewarded: 'yes' }), false);
});

test('early hints reduce the reward without producing negative rewards', () => {
  assert.equal(autonomyReward(20, 0), 20);
  assert.equal(autonomyReward(20, 1), 15);
  assert.equal(autonomyReward(20, 99), 5);
});
