import { shuffleInPlace, sampleOne, formatTime, store, toast } from './ui.js';

export function createHomeView({ onOpenFlashcards, onOpenRandom, onOpenQuick10, onOpenMock }){
  const wrap = document.createElement('div');

  const hero = document.createElement('div');
  hero.className = 'card';
  hero.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px;">
      <div>
        <div style="font-weight:900; font-size:22px;">Pick a mode</div>
        <div style="color:var(--muted); margin-top:6px; line-height:1.35;">
          Flashcards are always ready like a deck. Tests pull from your question bank.
        </div>
      </div>
      <div class="pill">Offline-ready</div>
    </div>
    <div class="spacer"></div>
    <div class="grid" id="tiles"></div>
  `;
  wrap.appendChild(hero);

  const tiles = hero.querySelector('#tiles');
  tiles.appendChild(tile('Flashcards', 'Flip, shuffle, and grind terms.', 'layers', onOpenFlashcards));
  tiles.appendChild(tile('Random Question', 'One question. Instant feedback.', 'shuffle', onOpenRandom));
  tiles.appendChild(tile('Quick 10', '10 questions. Fast reps.', 'bolt', onOpenQuick10));
  tiles.appendChild(tile('Mock Exam', 'Timed + weighted like the real thing.', 'clock', onOpenMock));

  const note = document.createElement('div');
  note.style.marginTop='14px';
  note.innerHTML = `
    <div class="card" style="background:rgba(255,255,255,.03); box-shadow:none;">
      <div style="font-weight:850;">HomeSafe- MLO Test Prep</div>
      <div style="color:var(--muted); margin-top:6px; line-height:1.35;">
        Put your full flashcard deck in <code style="color:var(--text)">/data/flashcards.json</code> and your question bank in
        <code style="color:var(--text)">/data/questions.json</code>.
      </div>
    </div>
  `;
  wrap.appendChild(note);
  return wrap;
}

function tile(title, sub, icon, onClick){
  const el = document.createElement('div');
  el.className = 'card tile';
  el.addEventListener('click', onClick);
  el.innerHTML = `
    <div class="tile-icon">${icons[icon]}</div>
    <div class="tile-title">${title}</div>
    <div class="tile-sub">${sub}</div>
  `;
  return el;
}

export function createSettingsView({ settings, onChange }){
  const wrap = document.createElement('div');
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div style="font-weight:900; font-size:20px;">Settings</div>
    <div style="color:var(--muted); margin-top:6px;">Small tweaks that matter in repetition.</div>
    <div class="spacer"></div>

    <div class="row">
      <div class="pill">Flashcards start on</div>
      <button id="term" class="btn ghost">Keyword</button>
      <button id="def" class="btn ghost">Definition</button>
    </div>
    <div class="spacer"></div>

    <div style="color:var(--muted); font-size:13px; line-height:1.35;">
      Tip: keep “Keyword” first when you’re drilling recall; switch to “Definition” first when you’re drilling recognition.
    </div>
  `;
  wrap.appendChild(card);

  const termBtn = card.querySelector('#term');
  const defBtn = card.querySelector('#def');

  function refresh(){
    const first = settings.flashcardsFirstSide;
    termBtn.style.borderColor = first==='term' ? 'rgba(45,212,191,.7)' : 'rgba(255,255,255,.14)';
    defBtn.style.borderColor  = first==='definition' ? 'rgba(45,212,191,.7)' : 'rgba(255,255,255,.14)';
  }
  refresh();

  termBtn.onclick = ()=>{
    settings.flashcardsFirstSide = 'term';
    refresh();
    onChange({ ...settings });
  };
  defBtn.onclick = ()=>{
    settings.flashcardsFirstSide = 'definition';
    refresh();
    onChange({ ...settings });
  };

  return wrap;
}

export function createFlashcardsView({ cards, firstSide='term' }){
  const wrap = document.createElement('div');

  const top = document.createElement('div');
  top.className = 'row';
  top.innerHTML = `
    <div class="pill">${cards.length || 0} cards</div>
    <button class="btn ghost" id="shuffle">Shuffle</button>
    <button class="btn ghost" id="swap">Swap sides</button>
  `;
  wrap.appendChild(top);

  const deck = document.createElement('div');
  deck.className = 'deck';
  deck.style.marginTop='14px';
  wrap.appendChild(deck);

  let idx = 0;
  let flipped = false;
  let side = firstSide; // 'term' or 'definition'

  if (!cards.length){
    const empty = document.createElement('div');
    empty.className='card';
    empty.style.marginTop='14px';
    empty.innerHTML = `
      <div style="font-weight:900; font-size:18px;">No flashcards loaded</div>
      <div style="color:var(--muted); margin-top:6px;">Drop your deck into /data/flashcards.json.</div>
    `;
    return wrap;
  }

  const cardEl = document.createElement('div');
  cardEl.className = 'flashcard';
  deck.appendChild(cardEl);

  const front = document.createElement('div');
  front.className = 'face front';
  const back = document.createElement('div');
  back.className = 'face back';
  cardEl.append(front, back);

  function render(){
    const c = cards[idx];
    const a = side==='term' ? c.term : c.definition;
    const b = side==='term' ? c.definition : c.term;

    front.innerHTML = `<div class="label">${side==='term'?'Keyword':'Definition'}</div>
      <div class="text">${escapeHTML(a)}</div>
      <div class="hint">tap to flip • swipe left/right</div>`;
    back.innerHTML = `<div class="label">${side==='term'?'Definition':'Keyword'}</div>
      <div class="text">${escapeHTML(b)}</div>
      <div class="hint">tap to flip • swipe left/right</div>`;

    cardEl.classList.toggle('flipped', flipped);
  }

  cardEl.addEventListener('click', ()=>{
    flipped = !flipped;
    render();
  });

  // swipe
  let startX = 0;
  cardEl.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
  cardEl.addEventListener('touchend', (e)=>{
    const endX = e.changedTouches[0].clientX;
    const dx = endX - startX;
    if (Math.abs(dx) < 30) return;
    if (dx < 0) next(); else prev();
  });

  function next(){
    idx = (idx + 1) % cards.length;
    flipped = false;
    render();
  }
  function prev(){
    idx = (idx - 1 + cards.length) % cards.length;
    flipped = false;
    render();
  }

  top.querySelector('#shuffle').onclick = ()=>{
    shuffleInPlace(cards);
    idx = 0; flipped=false;
    render();
    toast('Shuffled');
  };
  top.querySelector('#swap').onclick = ()=>{
    side = side==='term' ? 'definition' : 'term';
    flipped = false;
    render();
    toast('Swapped');
  };

  render();
  return wrap;
}

export function createTestView({ mode, questions }){
  const wrap = document.createElement('div');

  if (!questions || !questions.length){
    const empty = document.createElement('div');
    empty.className='card';
    empty.innerHTML = `
      <div style="font-weight:900; font-size:18px;">No questions loaded</div>
      <div style="color:var(--muted); margin-top:6px;">Add /data/questions.json (or load flashcards to auto-generate).</div>
    `;
    wrap.appendChild(empty);
    return wrap;
  }

  const config = buildSessionConfig(mode);
  const session = createSession(config, questions);

  const header = document.createElement('div');
  header.className = 'row';
  header.style.justifyContent='space-between';
  header.innerHTML = `
    <div class="row">
      <div class="pill">${labelForMode(mode)}</div>
      <div class="pill" id="progress"></div>
    </div>
    <div class="row">
      <div class="pill" id="timer" ${mode!=='mock'?'hidden':''}></div>
      <button class="btn ghost" id="reset">Reset</button>
    </div>
  `;
  wrap.appendChild(header);

  const qwrap = document.createElement('div');
  qwrap.style.marginTop='14px';
  wrap.appendChild(qwrap);

  header.querySelector('#reset').onclick = ()=>{
    if (mode==='mock'){
      store.del('mockSession');
      toast('Mock reset');
      window.location.reload();
    }else{
      window.location.reload();
    }
  };

  function render(){
    qwrap.innerHTML = '';
    const q = session.current();
    if (!q){
      const done = document.createElement('div');
      done.className='card';
      done.innerHTML = `
        <div style="font-weight:900; font-size:22px;">Done</div>
        <div style="color:var(--muted); margin-top:6px;">Score: <strong>${session.score()}</strong></div>
        <div class="spacer"></div>
        <button class="btn" id="again">Run it back</button>
      `;
      done.querySelector('#again').onclick = ()=>window.location.reload();
      qwrap.appendChild(done);
      header.querySelector('#progress').textContent = '';
      return;
    }

    header.querySelector('#progress').textContent = `${session.index()+1} / ${session.total()}`;

    const card = document.createElement('div');
    card.className='qcard';

    const stem = q.stem ? `<div style="margin-top:8px; color:var(--muted); line-height:1.35;">${escapeHTML(q.stem)}</div>` : '';
    card.innerHTML = `<div class="qtext">${escapeHTML(q.prompt)}</div>${stem}`;

    const choiceLetters = ['A','B','C','D','E','F'];
    q.choices.forEach((c, i)=>{
      const row = document.createElement('div');
      row.className='choice';
      row.innerHTML = `<div class="badge">${choiceLetters[i]}</div><div>${escapeHTML(String(c))}</div>`;
      row.onclick = ()=>{
        if (session.locked) return;
        session.answer(i);
        // mark
        const correct = session.correctIndex();
        [...card.querySelectorAll('.choice')].forEach((el, idx)=>{
          if (idx===correct) el.classList.add('correct');
          if (idx===i && idx!==correct) el.classList.add('wrong');
        });
        const explain = document.createElement('div');
        explain.className='explain';
        explain.textContent = q.explanation ? `Why: ${q.explanation}` : '';
        card.appendChild(explain);

        const nextBtn = document.createElement('button');
        nextBtn.className='btn';
        nextBtn.style.marginTop='12px';
        nextBtn.textContent = 'Next';
        nextBtn.onclick = ()=>{ session.next(); render(); };
        card.appendChild(nextBtn);
      };
      card.appendChild(row);
    });

    qwrap.appendChild(card);
  }

  // Timer for mock exam (4 hours window by default)
  if (mode === 'mock'){
    const timerEl = header.querySelector('#timer');
    const tick = ()=>{
      const ms = session.timeRemaining();
      timerEl.textContent = `Time left: ${formatTime(ms)}`;
      if (ms<=0){
        session.forceFinish();
        render();
      }else{
        requestAnimationFrame(()=>setTimeout(tick, 250));
      }
    };
    tick();
  }

  render();
  return wrap;
}

function labelForMode(mode){
  if (mode==='random') return 'Random Question';
  if (mode==='quick10') return 'Quick 10';
  return 'Mock Exam (4h)';
}

// NMLS SAFE test weighting (content outline): 24% federal laws, 11% uniform state, 20% general,
// 27% origination, 18% ethics.
function buildSessionConfig(mode){
  if (mode==='random') return { n:1, timed:false };
  if (mode==='quick10') return { n:10, timed:false };
  return {
    n:120,
    timed:true,
    minutes: 240,
    weights: { federal:24, state:11, general:20, origination:27, ethics:18 },
    persistKey: 'mockSession'
  };
}

function createSession(config, questions){
  let qset = [];
  let cursor = 0;
  let correct = 0;
  let locked = false;

  let startTs = Date.now();
  let endTs = startTs + (config.minutes||0)*60*1000;

  if (config.persistKey){
    const saved = store.get(config.persistKey, null);
    if (saved && saved.qset && saved.cursor!=null && saved.startTs && saved.endTs){
      qset = saved.qset;
      cursor = saved.cursor;
      correct = saved.correct || 0;
      startTs = saved.startTs;
      endTs = saved.endTs;
    }
  }

  if (!qset.length){
    qset = pickQuestions(config, questions);
    cursor = 0;
    correct = 0;
    locked = false;
    startTs = Date.now();
    endTs = startTs + (config.minutes||0)*60*1000;
    persist();
  }

  function persist(){
    if (!config.persistKey) return;
    store.set(config.persistKey, { qset, cursor, correct, startTs, endTs });
  }

  function current(){
    return qset[cursor] || null;
  }

  function answer(i){
    locked = true;
    const q = current();
    const correctIdx = q.answerIndex;
    if (i === correctIdx) correct++;
    persist();
  }

  function next(){
    locked = false;
    cursor++;
    persist();
  }

  function score(){
    return `${correct} / ${qset.length}`;
  }

  function total(){ return qset.length; }
  function index(){ return cursor; }
  function correctIndex(){ return current()?.answerIndex ?? 0; }

  function timeRemaining(){
    return endTs - Date.now();
  }

  function forceFinish(){
    cursor = qset.length; // show done
    persist();
  }

  return { current, answer, next, score, total, index, correctIndex, timeRemaining, forceFinish, get locked(){ return locked; } };
}

function pickQuestions(config, questions){
  if (!config.weights){
    const pool = questions.slice();
    shuffleInPlace(pool);
    return pool.slice(0, config.n);
  }

  // Weighted mock exam by category (edit categories in /data/questions.json)
  const buckets = {
    federal: questions.filter(q=>q.category==='federal'),
    state: questions.filter(q=>q.category==='state'),
    general: questions.filter(q=>q.category==='general'),
    origination: questions.filter(q=>q.category==='origination'),
    ethics: questions.filter(q=>q.category==='ethics'),
  };

  // If buckets are empty, fallback to all questions
  const anyBucketHas = Object.values(buckets).some(b=>b.length);
  if (!anyBucketHas){
    const pool = questions.slice();
    shuffleInPlace(pool);
    return pool.slice(0, config.n);
  }

  const totalWeight = Object.values(config.weights).reduce((a,b)=>a+b,0);
  const targetCounts = {};
  let sum = 0;

  // initial rounding
  for (const [k,w] of Object.entries(config.weights)){
    const n = Math.round((w/totalWeight)*config.n);
    targetCounts[k]=n;
    sum += n;
  }
  // fix rounding to exact N
  const keys = Object.keys(targetCounts);
  while (sum > config.n){
    const k = keys.sort((a,b)=>targetCounts[b]-targetCounts[a])[0];
    targetCounts[k]--; sum--;
  }
  while (sum < config.n){
    const k = keys.sort((a,b)=>targetCounts[a]-targetCounts[b])[0];
    targetCounts[k]++; sum++;
  }

  const picked = [];
  for (const k of keys){
    const pool = buckets[k].slice();
    shuffleInPlace(pool);
    const want = targetCounts[k];
    picked.push(...pool.slice(0, want));
  }

  // if not enough questions in a bucket, top up from full pool
  const poolAll = questions.slice();
  shuffleInPlace(poolAll);
  const unique = new Map();
  for (const q of picked) unique.set(q.id, q);
  for (const q of poolAll){
    if (unique.size >= config.n) break;
    unique.set(q.id, q);
  }

  const out = Array.from(unique.values()).slice(0, config.n);
  shuffleInPlace(out);
  return out;
}

function escapeHTML(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

const icons = {
  layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 1 7l11 5 11-5-11-5zm0 7L1 14l11 5 11-5-11-5zm0 7L1 21l11 5 11-5-11-5z"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3h4v4l-1.4-1.4-3.2 3.2-1.4-1.4 3.2-3.2L17 3zM3 7h4l3 3-1.4 1.4L6.6 9H3V7zm0 10h4l2.2-2.2 1.4 1.4L7 19H3v-2zm14 0h4v4h-4l1.4-1.4-3.2-3.2 1.4-1.4 3.2 3.2L17 17z"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 21h-1l1-7H7l6-11h1l-1 7h4z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h5v-2h-4V6h-2z"/></svg>'
};
