const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nodeStars } = require('../.domain-test/domain/nodeStars.js');

test('node stars use saved score thresholds and give no stars to unplayed nodes', () => {
  for (const score of [undefined, null, NaN, Infinity, -1, 101]) assert.equal(nodeStars(score), 0);
  for (const score of [0, 30, 59.99]) assert.equal(nodeStars(score), 1);
  for (const score of [60, 75, 84.99]) assert.equal(nodeStars(score), 2);
  for (const score of [85, 95, 100]) assert.equal(nodeStars(score), 3);
});
