import test from 'node:test';
import assert from 'node:assert/strict';
import { toss, nextChain, verdictLine } from '../lib/oracle.js';

function seeded(seed) {
  let a = seed;
  return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; };
}

test('faces always match the outcome', () => {
  const rng = seeded(7);
  for (let i = 0; i < 500; i++) {
    const { kind, faces } = toss(50, rng);
    const flats = faces.filter((f) => f === 'flat').length;
    assert.equal(kind, flats === 1 ? 'yes' : flats === 2 ? 'laugh' : 'no');
  }
});

test('odds follow the tradition, gently tilted by luck', () => {
  const rate = (luck) => {
    const rng = seeded(42);
    let yes = 0;
    for (let i = 0; i < 20000; i++) if (toss(luck, rng).kind === 'yes') yes++;
    return yes / 20000;
  };
  const low = rate(0), mid = rate(50), high = rate(100);
  assert.ok(Math.abs(mid - 0.5) < 0.02, `mid ${mid}`);
  assert.ok(low < mid && mid < high);
  assert.ok(high < 0.6 && low > 0.42, 'tilt stays gentle');
});

test('three yeses in a row confirm; anything else resets', () => {
  let s = { chain: 0 };
  s = nextChain(s.chain, 'yes'); s = nextChain(s.chain, 'yes');
  assert.equal(s.confirmed, false);
  s = nextChain(s.chain, 'yes');
  assert.deepEqual(s, { chain: 3, confirmed: true });
  assert.deepEqual(nextChain(2, 'laugh'), { chain: 0, confirmed: false });
});

test('verdict lines quote the wish', () => {
  assert.match(verdictLine('yes', 'A great card pull?', () => 0), /“A great card pull”/);
  assert.match(verdictLine('no', '', () => 0), /“your wish”/);
});
