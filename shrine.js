// Auspicious — the shrine: ask a yes/no wish and toss the moon blocks.
import { toss, verdictLine, nextChain, OUTCOMES, PROMPTS } from './lib/oracle.js';
import { tick, chime, clack, flip, riser, reveal } from './lib/sound.js';
import { burst, centerOf } from './lib/fx.js';

const FACES = { yes: 'One flat, one round', laugh: 'Both flat', no: 'Both round' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A crescent moon block, drawn flat-side-up or round-side-up.
const BLOCK_PATH = 'M5,31 C5,13 22,3 40,3 C58,3 75,13 75,31 C75,39 69,43 61,40 C52,31 28,31 19,40 C11,43 5,39 5,31 Z';
const blockSvg = (id) => `
  <svg viewBox="0 0 80 46" aria-hidden="true">
    <defs>
      <radialGradient id="dome${id}" cx="45%" cy="35%" r="70%">
        <stop offset="0" stop-color="#f06a55"/><stop offset=".55" stop-color="#b8261c"/><stop offset="1" stop-color="#7a140e"/>
      </radialGradient>
    </defs>
    <g class="f-flat">
      <path d="${BLOCK_PATH}" fill="#c9332a" stroke="#e7b75a" stroke-width="1.6"/>
      <path d="M14,29 C16,17 28,10 40,10 C52,10 64,17 66,29" fill="none" stroke="#f3c97a" stroke-width="1.2" opacity=".75"/>
    </g>
    <g class="f-round">
      <path d="${BLOCK_PATH}" fill="url(#dome${id})" stroke="#6d120c" stroke-width="1.2"/>
      <ellipse cx="33" cy="13" rx="11" ry="4" fill="#fff" opacity=".28"/>
    </g>
  </svg>`;

export function mountShrine({ card, local, today, getLuck, getColors, pin, onConfirmed }) {
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Make a wish with the moon blocks');
  fab.innerHTML = '<span class="g">祈</span><span class="dot" aria-hidden="true"></span>';

  const el = document.createElement('div');
  el.className = 'shrine';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'shrineTitle');
  el.innerHTML = `
    <div class="shrine-in">
      <div class="shrine-top">
        <span class="kick">Moon blocks · 筊杯</span>
        <button class="icon-btn shrine-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <h2 class="shrine-q" id="shrineTitle">What are you wishing for?</h2>
      <input class="wish" id="wishInput" type="text" maxlength="80" placeholder="A great card pull" autocomplete="off" aria-label="Your wish">
      <div class="prompts">${PROMPTS.map((p) => `<button type="button" class="chip" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}</div>
      <div class="altar" id="altar">
        <div class="incense" aria-hidden="true">
          <span class="smoke s1"></span><span class="smoke s2"></span><span class="smoke s3"></span>
          <span class="ember"></span><span class="stick"></span><span class="holder"></span>
        </div>
        <div class="tray" aria-hidden="true">
          <div class="blk" id="blkA" style="--home:-58px"><div class="face">${blockSvg('A')}</div></div>
          <div class="blk" id="blkB" style="--home:10px"><div class="face">${blockSvg('B')}</div></div>
          <div class="shadow"></div>
        </div>
        <div class="verdict" id="verdict" aria-live="polite"></div>
      </div>
      <div class="chain" id="chain" aria-label="Yes streak">
        <span></span><span></span><span></span><em id="chainText">Three yeses in a row confirm a wish</em>
      </div>
      <div class="pray-row">
        <button class="pray-btn" id="prayBtn" type="button" aria-describedby="prayHint">
          <svg class="ring" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="35"/></svg>
          <span class="g">祈</span>
        </button>
        <div class="pray-copy"><b id="prayTitle">Hold to pray</b><span id="prayHint">Then let go to toss the blocks.</span></div>
      </div>
      <details class="about">
        <summary>What are moon blocks?</summary>
        <p>Jiaobei (筊杯) are a pair of crescent blocks used in Chinese temples to ask yes/no questions. One flat and one round side up means yes. Both flat: the gods are laughing, so ask again. Both round: no. Tradition asks for three yeses in a row. Just for fun: today’s luck tilts the odds only slightly.</p>
      </details>
    </div>`;
  card.append(fab, el);

  const $ = (id) => el.querySelector(`#${id}`);
  const input = $('wishInput'), altar = $('altar'), verdict = $('verdict'), btn = $('prayBtn');
  const blocks = [$('blkA'), $('blkB')];
  let state = { date: today, text: '', chain: 0, confirmed: false, tosses: 0 };
  let busy = false;

  local.get(['wish']).then(({ wish }) => {
    if (wish?.date === today) state = { ...state, ...wish };
    if (state.tosses) fab.classList.add('done');
    renderChain();
  });
  const save = () => local.set({ wish: { ...state, date: today } });

  function renderChain(justConfirmed = false) {
    const dots = el.querySelectorAll('.chain span');
    dots.forEach((d, k) => d.classList.toggle('on', k < state.chain));
    el.querySelector('.chain').classList.toggle('confirmed', state.confirmed);
    $('chainText').textContent = state.confirmed ? 'Confirmed. The wish is blessed.'
      : state.chain ? `${state.chain} of 3 yeses. Keep going.` : 'Three yeses in a row confirm a wish';
    if (justConfirmed) el.querySelector('.chain').classList.add('celebrate');
  }

  // ---------- open / close ----------
  function open() {
    pin();
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
    input.value = state.text || '';
    tick(0.9);
    setTimeout(() => (input.value ? btn : input).focus(), 250);
  }
  function close() {
    el.classList.remove('open');
    setTimeout(() => { el.hidden = true; fab.focus(); }, 260);
  }
  fab.addEventListener('click', open);
  el.querySelector('.shrine-close').addEventListener('click', close);
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  el.querySelector('.prompts').addEventListener('click', (e) => {
    const p = e.target.closest('[data-prompt]');
    if (!p) return;
    input.value = p.dataset.prompt;
    onWishChange();
    tick(1.1);
    btn.focus();
  });
  function onWishChange() {
    const text = input.value.trim();
    if (text !== state.text) { state.text = text; state.chain = 0; state.confirmed = false; renderChain(); save(); }
  }
  input.addEventListener('change', onWishChange);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { onWishChange(); btn.focus(); } });

  // ---------- hold to pray ----------
  const HOLD_MS = 800, AUTO_MS = 2400;
  let start = 0, ticker = 0, auto = 0, rise = null, holding = false;
  const setPull = (v) => el.style.setProperty('--pray', v.toFixed(3));
  function down(e) {
    if (busy || (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') || e.repeat) return;
    e.preventDefault();
    onWishChange();
    holding = true;
    start = performance.now();
    altar.classList.add('praying');
    altar.classList.remove('landed');
    verdict.classList.remove('show');
    blocks.forEach((b) => { b.classList.remove('tossing', 'flat', 'round'); b.classList.add('lifted'); });
    rise = riser();
    $('prayTitle').textContent = 'Praying…';
    $('prayHint').textContent = state.text ? `For “${state.text}”` : 'Make it count.';
    ticker = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / HOLD_MS);
      setPull(p);
      rise?.set(Math.min(1, (performance.now() - start) / AUTO_MS));
      if (p >= 1) $('prayHint').textContent = 'Let go to toss.';
    }, 16);
    auto = setTimeout(() => up(true), AUTO_MS);
  }
  function up(force) {
    if (!holding) return;
    holding = false;
    clearInterval(ticker);
    clearTimeout(auto);
    rise?.stop();
    altar.classList.remove('praying');
    const held = performance.now() - start;
    if (held < HOLD_MS && force !== true) {
      setPull(0);
      blocks.forEach((b) => b.classList.remove('lifted'));
      $('prayTitle').textContent = 'Hold a little longer';
      $('prayHint').textContent = 'A wish needs a moment.';
      tick(0.6);
      return;
    }
    setPull(0);
    doToss();
  }
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('keydown', down);
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'keyup']) btn.addEventListener(ev, () => up(false));

  // ---------- the toss ----------
  function doToss() {
    busy = true;
    const result = toss(getLuck());
    state.tosses++;
    fab.classList.add('done');
    flip();
    blocks.forEach((b, k) => {
      const dx = (k ? 1 : -1) * (10 + Math.random() * 34);
      const spin = (Math.random() < 0.5 ? -1 : 1) * (540 + Math.floor(Math.random() * 3) * 180);
      const rot = (Math.random() - 0.5) * 50;
      b.style.setProperty('--dx', `${dx.toFixed(0)}px`);
      b.style.setProperty('--spin', `${spin}deg`);
      b.style.setProperty('--rot', `${(spin + rot).toFixed(0)}deg`);
      b.style.setProperty('--delay', `${k * 60}ms`);
      b.classList.remove('lifted', 'flat', 'round');
      void b.offsetWidth;
      b.classList.add('tossing');
      // Show the landing face as the block comes down.
      setTimeout(() => b.classList.add(result.faces[k]), 760 + k * 60);
    });
    setTimeout(() => clack(1), 820);
    setTimeout(() => clack(0.9), 880);
    setTimeout(() => clack(0.35), 1010);
    setTimeout(() => { altar.classList.add('landed'); land(result); }, 1250);
  }

  function land(result) {
    const o = OUTCOMES[result.kind];
    const { chain, confirmed } = nextChain(state.chain, result.kind);
    const newlyConfirmed = confirmed && !state.confirmed;
    state.chain = chain;
    state.confirmed = state.confirmed || confirmed; // once blessed, the wish stays blessed today
    save();
    verdict.className = `verdict k-${result.kind}`;
    verdict.innerHTML = `
      <div class="stamp"><span class="zh">${o.zh}</span></div>
      <div class="v-copy"><i>${FACES[result.kind]}</i><b>${o.en}</b><span>${esc(verdictLine(result.kind, state.text))}</span></div>`;
    void verdict.offsetWidth;
    verdict.classList.add('show');
    reveal(result.kind === 'yes' ? 'good' : result.kind === 'laugh' ? 'neutral' : 'bad');
    const stamp = verdict.querySelector('.stamp');
    if (result.kind === 'yes') {
      const { x, y } = centerOf(stamp, card);
      burst(card, x, y, { kind: newlyConfirmed ? 'confetti' : 'sparkle', count: newlyConfirmed ? 90 : 24, colors: getColors() });
    }
    renderChain(newlyConfirmed);
    if (newlyConfirmed) {
      setTimeout(chime, 250);
      onConfirmed?.(state.text);
    }
    $('prayTitle').textContent = result.kind === 'yes' && !state.confirmed ? 'Toss again' : result.kind === 'laugh' ? 'Ask again' : state.confirmed ? 'Blessed' : 'Try again';
    $('prayHint').textContent = result.kind === 'yes' && !state.confirmed ? `${3 - state.chain} more yes${3 - state.chain === 1 ? '' : 'es'} to confirm.`
      : state.confirmed ? 'Hold to toss again, just for fun.' : 'Hold to pray, then let go.';
    busy = false;
  }

  // Dev/demo hook: open and toss without a real press (used by ?demo=shrine for frame captures).
  const demo = (wish) => { open(); input.value = wish || ''; onWishChange(); setTimeout(doToss, 700); };
  return { fab, open, demo, state: () => state };
}
