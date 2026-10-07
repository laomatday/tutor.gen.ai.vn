import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rewardCatalog } from './data';
import { availableStock, canRedeem, filterRewards, isRewardRequests, rewardProgress, validateDelivery, type RewardRequest } from './domain';

test('redemption requires enough points, positive safe integer cost and stock', () => {
  assert.equal(canRedeem(350, 350, 1), true);
  for (const values of [[349, 350, 1], [350, -1, 1], [350, 0, 1], [350, 1.5, 1], [NaN, 350, 1], [350, 350, 0], [Infinity, 350, 1]]) {
    assert.equal(canRedeem(...values as [number, number, number]), false, values.join(','));
  }
});

test('local redemptions decrease catalog stock and ready filter respects stock and balance', () => {
  const item = { ...rewardCatalog[0], stock: 1 };
  const request: RewardRequest = { id: 'sample', itemId: item.id, itemName: item.name, cost: item.cost, createdAt: '2026-10-07T00:00:00Z' };
  assert.equal(availableStock(item, []), 1);
  assert.equal(availableStock(item, [request]), 0);
  assert.equal(filterRewards([item], 'ready', item.cost, []).length, 1);
  assert.equal(filterRewards([item], 'ready', item.cost - 1, []).length, 0);
  assert.equal(filterRewards([item], 'ready', item.cost, [request]).length, 0);
});

test('delivery validation rejects masked placeholders and missing addresses', () => {
  assert.deepEqual(validateDelivery({ address: 'Số 12 đường Nguyễn Trãi', parentPhone: '+84 901 234 567' }), {});
  const errors = validateDelivery({ address: '', parentPhone: '098 ••• •812' });
  assert.ok(errors.address);
  assert.ok(errors.parentPhone);
});

test('progress remains bounded and persisted request costs cannot be negative', () => {
  assert.equal(rewardProgress(-10, 100), 0);
  assert.equal(rewardProgress(150, 100), 100);
  assert.equal(rewardProgress(1, 0), 0);
  assert.equal(isRewardRequests([{ id: '1', itemId: 'sticker', itemName: 'Sticker', cost: -1, createdAt: '2026-10-07' }]), false);
});
