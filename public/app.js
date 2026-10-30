/* StudyAI — vanilla JS PWA. Data lives in localStorage; AI goes through /api/chat (server-side key). */
'use strict';

/* ============================ helpers ============================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const z2 = (n) => String(n).padStart(2, '0');
const dkey = (d) => `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
const today = () => dkey(new Date());
const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  note: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
  quiz: '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',
  grip: '<circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  save: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 12 0 4 3 7 7 7z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  retry: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

const SUBJ = {
  general: { label: 'General', emoji: '✨' },
  math: { label: 'Maths', emoji: '🧮' },
  physics: { label: 'Physics', emoji: '⚛️' },
  chemistry: { label: 'Chemistry', emoji: '🧪' },
  biology: { label: 'Biology', emoji: '🧬' },
  english: { label: 'English', emoji: '📖' },
  japanese: { label: 'Japanese', emoji: 'あ' },
};

/* ============================ storage ============================ */
const KEY = 'studyai:v1';
const DEFAULTS = {
  name: '', theme: 'system', grade: 'High school', level: 'N5', mode: 'general',
  chats: [], currentChat: null, notes: [], tasks: [], quizzes: [], activity: {}, streak: { count: 0, last: '' },
};
let S = load();
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...JSON.parse(JSON.stringify(DEFAULTS)), ...saved };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {
    toast('Storage is full. Export your data and delete old chats.', 'error');
  }
}
function markActive(n = 1) {
  const t = today();
  S.activity[t] = (S.activity[t] || 0) + n;
  const st = S.streak;
  if (st.last !== t) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    st.count = st.last === dkey(y) ? st.count + 1 : 1;
    st.last = t;
  }
  save();
}
function streakNow() {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return S.streak.last === today() || S.streak.last === dkey(y) ? S.streak.count : 0;
}

/* ============================ UI utilities ============================ */
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

let sheetTimer;
function openSheet(html, mount) {
  clearTimeout(sheetTimer);
  const w = $('#sheetWrap');
  $('#sheet').innerHTML = `<div class="grab"></div>${html}`;
  w.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('open')));
  if (mount) mount($('#sheet'));
}
function closeSheet() {
  const w = $('#sheetWrap');
  w.classList.remove('open');
  sheetTimer = setTimeout(() => { w.hidden = true; $('#sheet').innerHTML = ''; }, 280);
}

function applyTheme() {
  const dark = S.theme === 'dark' || (S.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = dark ? '#0e0c1f' : '#7c3aed';
  $('#themeBtn').innerHTML = ic(dark ? 'sun' : 'moon');
}

/* ============================ markdown ============================ */
function md(src) {
  const blocks = [];
  let h = esc(src).replace(/```[\w-]*\n?([\s\S]*?)```/g, (_, c) => { blocks.push(`<pre><code>${c.replace(/\n$/, '')}</code></pre>`); return `\u0000${blocks.length - 1}\u0000`; });
  const inline = (t) => t
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  let out = '', list = null, tbl = [];
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  const flushTable = () => {
    if (!tbl.length) return;
    const rows = tbl.filter((r) => !/^\|?[\s:|-]+\|?$/.test(r) || !/-/.test(r)).map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    if (rows.length) {
      out += '<div class="tw"><table><thead><tr>' + rows[0].map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.slice(1).map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
    }
    tbl = [];
  };
  for (const raw of h.split('\n')) {
    const l = raw.trimEnd();
    let m;
    if (/^\s*\|.*\|\s*$/.test(l)) { close(); tbl.push(l.trim()); continue; }
    flushTable();
    if ((m = l.match(/^\u0000(\d+)\u0000$/))) { close(); out += blocks[m[1]]; }
    else if ((m = l.match(/^(#{1,4})\s+(.*)/))) { close(); const n = m[1].length + 1; out += `<h${n}>${inline(m[2])}</h${n}>`; }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^&gt;\s?(.*)/))) { close(); out += `<blockquote>${inline(m[1])}</blockquote>`; }
    else if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { close(); out += '<hr>'; }
    else if (!l.trim()) { close(); }
    else { close(); out += `<p>${inline(l)}</p>`; }
  }
  close(); flushTable();
  return out;
}

/* ============================ AI client ============================ */
async function ai({ system, messages, json = false }) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, json }),
      signal: ctl.signal,
    });
    let data = null;
    try { data = await r.json(); } catch { /* not JSON */ }
    if (!r.ok) {
      if (!data && [404, 405, 501].includes(r.status)) throw new Error('The AI backend is not running. Deploy the /functions folder or start it with "npx wrangler pages dev public" (see README).');
      throw new Error(data?.error || `Server error (${r.status}). Please try again.`);
    }
    if (!data?.text) throw new Error('The AI returned an empty answer. Please try again.');
    return data.text;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The AI took too long to answer. Please try again.');
    if (!navigator.onLine) throw new Error('You are offline. Connect to the internet and try again.');
    if (e instanceof TypeError) throw new Error('Could not reach the server. Check your connection.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
function parseJSON(t) {
  t = String(t).trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('bad json');
  return JSON.parse(t.slice(a, b + 1));
}

function systemFor(mode) {
  const base = `You are StudyAI, a friendly, patient study assistant for students. Student level: ${S.grade}. Explain in simple language with short paragraphs. Use Markdown: headings, bullet lists, **bold** key terms, and tables when comparing. Be accurate and say so if you are unsure. Teach the reasoning instead of only giving answers. Reply in the language the student writes in.`;
  const extra = {
    general: '',
    math: ' Subject: Maths. Solve step by step with numbered steps, write maths in plain text (x^2, sqrt(x), a/b) without LaTeX, state the final answer clearly, and finish with a quick way to check it.',
    physics: ' Subject: Physics. Name the concept, give the formula in plain text with units, show a worked example, and relate it to everyday life.',
    chemistry: ' Subject: Chemistry. Use plain-text formulas (H2O, CO2), explain what happens at particle level, balance equations step by step, and mention safety where relevant.',
    biology: ' Subject: Biology. Explain processes in ordered steps, define terms simply, and use analogies and memory tricks.',
    english: ' Subject: English. Explain grammar rules with clear examples, correct mistakes gently and show why, and suggest improved versions of sentences.',
    japanese: ` Subject: Japanese tutor. The student's JLPT target is ${S.level} (cover N5 to N2 when asked). For every Japanese word show: kanji/kana, reading in hiragana, romaji and the English meaning. Explain grammar with 2-3 example sentences (Japanese, romaji, English). Give pronunciation tips (long vowels, small tsu, pitch). Keep vocabulary and grammar at the target level unless asked otherwise. Prefer tables for vocabulary lists.`,
  };
  return base + (extra[mode] || '');
}

/* ============================ router ============================ */
const VIEWS = {
  home: { title: 'StudyAI', nav: 'home' },
  chat: { title: 'AI Chat', nav: 'chat' },
  homework: { title: 'Homework Helper', nav: 'home', back: 1 },
  japanese: { title: 'Japanese Tutor', nav: 'home', back: 1 },
  plan: { title: 'Study Planner', nav: 'plan' },
  notes: { title: 'Notes', nav: 'notes' },
  quiz: { title: 'Quiz', nav: 'quiz' },
};
let current = 'home';
const renderers = {};

function route() {
  const v = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
  const name = VIEWS[v] ? v : 'home';
  const changed = name !== current;
  current = name;
  $$('.view').forEach((el) => el.classList.toggle('active', el.id === 'v-' + name));
  $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.nav === VIEWS[name].nav));
  $('#title').textContent = VIEWS[name].title;
  $('#backBtn').hidden = !VIEWS[name].back;
  document.body.classList.toggle('sub', !!VIEWS[name].back);
  renderers[name]();
  if (changed && name !== 'chat') $('#v-' + name).scrollTop = 0;
}
const go = (v) => { if (location.hash === '#/' + v) route(); else location.hash = '#/' + v; };
const refresh = () => renderers[current]?.();

/* ============================ HOME ============================ */
const FEATURES = [
  { t: 'AI Chat', d: 'Ask anything', i: 'chat', go: 'chat', c: 'f1' },
  { t: 'Homework', d: '6 subjects', i: 'book', go: 'homework', c: 'f2' },
  { t: 'Japanese', d: 'N5 – N2 tutor', g: 'あ', go: 'japanese', c: 'f3' },
  { t: 'Planner', d: 'Plan your day', i: 'calendar', go: 'plan', c: 'f4' },
  { t: 'Notes', d: 'AI study notes', i: 'note', go: 'notes', c: 'f5' },
  { t: 'Quiz', d: 'Test yourself', i: 'quiz', go: 'quiz', c: 'f6' },
];

const tasksFor = (d) => S.tasks.filter((t) => t.date === d);
const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');

function taskRow(t, opts = {}) {
  const meta = [t.time, t.minutes ? `${t.minutes}m` : '', ].filter(Boolean).join(' · ');
  const sub = t.subject && t.subject !== 'general' ? `<span class="tag">${SUBJ[t.subject]?.label || ''}</span>` : '';
  return `<div class="task ${t.done ? 'done' : ''}" data-id="${t.id}">
    ${opts.drag ? `<button class="drag" aria-label="Drag to reorder">${ic('grip')}</button>` : '<span style="width:6px"></span>'}
    <button class="chk" data-act="toggleTask" data-id="${t.id}" aria-label="Mark done">${ic('check')}</button>
    <div class="tbody" ${opts.drag ? `data-act="editTask" data-id="${t.id}"` : `data-go="plan"`}><div class="tt">${esc(t.title)}</div><div class="tm">${meta || 'Anytime'}${sub}</div></div>
  </div>`;
}

renderers.home = function renderHome() {
  const h = new Date().getHours();
  const g = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const t = tasksFor(today()).sort(byTime);
  const done = t.filter((x) => x.done).length;
  const pct = t.length ? Math.round((done / t.length) * 100) : 0;
  const quizAvg = S.quizzes.length ? Math.round((S.quizzes.reduce((a, q) => a + q.score / q.total, 0) / S.quizzes.length) * 100) : null;
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const vals = days.map((d) => S.activity[dkey(d)] || 0);
  const max = Math.max(...vals, 1);

  $('#v-home').innerHTML = `<div class="pad">
    <div class="hero"><p class="hello">${g}${S.name ? ', ' + esc(S.name) : ''} 👋</p><h2>What would you like to learn today?</h2></div>
    <form class="askbar" id="homeAsk"><input id="homeIn" placeholder="Ask StudyAI anything…" autocomplete="off" enterkeyhint="send" aria-label="Ask StudyAI"><button class="send" aria-label="Ask">${ic('send')}</button></form>
    <div class="grid2">${FEATURES.map((f) => `<button class="feat ${f.c}" data-go="${f.go}"><div class="tile">${f.g || ic(f.i)}</div><div><b>${f.t}</b><span class="d">${f.d}</span></div></button>`).join('')}</div>

    <div class="sec-h"><h3>Today's tasks</h3><button class="link" data-go="plan">${t.length ? 'See all' : 'Add'}</button></div>
    <div class="card">${t.length
      ? `<div class="tasks">${t.slice(0, 4).map((x) => taskRow(x)).join('')}</div>${t.length > 4 ? `<p class="hint">+${t.length - 4} more in the planner</p>` : ''}`
      : `<div class="empty"><b>Nothing planned yet</b>Plan your study day in a few taps.<br><button class="btn primary" style="margin-top:12px" data-go="plan">Open planner</button></div>`}</div>

    <div class="sec-h"><h3>Study progress</h3></div>
    <div class="card prog">
      <div class="prog-top">
        <div class="ring"><svg viewBox="0 0 86 86"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs><circle class="bg" cx="43" cy="43" r="34"/><circle class="fg" cx="43" cy="43" r="34" style="--v:${(pct * 2.136).toFixed(1)}"/></svg><div class="pct">${pct}%</div></div>
        <div class="stats">
          <div class="stat"><b>🔥 ${streakNow()}</b><span>Day streak</span></div>
          <div class="stat"><b>${done}/${t.length}</b><span>Tasks today</span></div>
          <div class="stat"><b>${S.notes.length}</b><span>Notes</span></div>
          <div class="stat"><b>${S.quizzes.length}</b><span>Quizzes</span></div>
          <div class="stat"><b>${quizAvg === null ? '–' : quizAvg + '%'}</b><span>Quiz avg</span></div>
          <div class="stat"><b>${S.chats.length}</b><span>Chats</span></div>
        </div>
      </div>
      <div><div class="hint" style="margin:0 0 8px;font-weight:700">Activity this week</div>
      <div class="week">${vals.map((v, i) => `<div><i class="${v ? '' : 'z'}" style="height:${v ? Math.max(12, (v / max) * 100) : 8}%;animation-delay:${i * 60}ms"></i><small>${'SMTWTFS'[days[i].getDay()]}</small></div>`).join('')}</div></div>
    </div>
  </div>`;
};

/* ============================ CHAT ============================ */
let sending = false;
const SUGGEST = {
  general: ['Explain photosynthesis in simple words', 'Give me 5 tips to study effectively', 'What is the difference between speed and velocity?'],
  math: ['Solve 3x + 7 = 22 step by step', 'Explain the Pythagoras theorem', 'What is a derivative, in simple words?'],
  physics: ["Explain Newton's three laws", 'Difference between mass and weight?', 'How does an electric circuit work?'],
  chemistry: ['Balance H2 + O2 → H2O', 'Ionic vs covalent bonds', 'Explain periodic table trends'],
  biology: ['Mitosis vs meiosis', 'How does DNA replicate?', 'What do mitochondria do?'],
  english: ['Affect vs effect: when to use which?', 'Help me write a strong thesis statement', 'Explain the present perfect tense'],
  japanese: ['Teach me 10 Japanese greetings', 'What is the difference between は and が?', 'How do I read and use 食べる?'],
};
const curChat = () => S.chats.find((c) => c.id === S.currentChat);
function newChat(mode) {
  const c = { id: uid(), title: 'New chat', mode: mode || S.mode || 'general', messages: [], updated: Date.now() };
  S.chats.unshift(c);
  S.currentChat = c.id;
  save();
  return c;
}
function ensureChat() {
  let c = curChat();
  if (!c) c = S.chats.find((x) => x.messages.length === 0) || newChat();
  S.currentChat = c.id;
  return c;
}

function msgHTML(m, i) {
  if (m.role === 'user') return `<div class="msg user"><div class="bub">${esc(m.content)}</div></div>`;
  if (m.error) return `<div class="msg ai err"><div class="avatar">!</div><div class="bub">${esc(m.content)}<div class="macts"><button data-act="retry">${ic('retry')}Retry</button></div></div></div>`;
  const jp = /[぀-ヿ一-鿿]/.test(m.content);
  return `<div class="msg ai"><div class="avatar">✦</div><div class="bub"><div class="md">${md(m.content)}</div>
    <div class="macts"><button data-act="copyMsg" data-i="${i}">${ic('copy')}Copy</button><button data-act="msgToNote" data-i="${i}">${ic('save')}Save as note</button>${jp ? `<button data-act="speakMsg" data-i="${i}">${ic('volume')}Listen</button>` : ''}</div></div></div>`;
}

renderers.chat = function renderChat() {
  const c = ensureChat();
  $('#modeChips').innerHTML = Object.entries(SUBJ).map(([k, v]) => `<button class="chip ${c.mode === k ? 'sel' : ''}" data-act="setMode" data-m="${k}">${v.emoji} ${v.label}</button>`).join('');
  const box = $('#msgs');
  if (!c.messages.length && !sending) {
    box.innerHTML = `<div class="chat-empty"><div class="big">✦</div><h3>${c.mode === 'general' ? 'Ask me anything' : SUBJ[c.mode].label + ' helper'}</h3><p>I explain things in simple language, step by step.</p><div class="sugg">${(SUGGEST[c.mode] || SUGGEST.general).map((s) => `<button data-act="suggest" data-t="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
  } else {
    box.innerHTML = c.messages.map(msgHTML).join('') + (sending ? `<div class="msg ai" id="typingRow"><div class="avatar">✦</div><div class="bub"><div class="typing"><i></i><i></i><i></i></div></div></div>` : '');
    box.scrollTop = box.scrollHeight;
  }
  $('#sendBtn').disabled = sending;
};

async function respond(c) {
  sending = true;
  if (current === 'chat') renderers.chat();
  try {
    const history = c.messages.filter((m) => !m.error).slice(-20).map((m) => ({ role: m.role, content: m.content }));
    const text = await ai({ system: systemFor(c.mode), messages: history });
    c.messages.push({ role: 'assistant', content: text, ts: Date.now() });
  } catch (e) {
    c.messages.push({ role: 'assistant', content: e.message, error: true, ts: Date.now() });
  } finally {
    sending = false;
    c.updated = Date.now();
    save();
    if (current === 'chat') renderers.chat();
  }
}
async function sendMsg(text) {
  text = String(text || '').trim();
  if (!text || sending) return;
  const c = ensureChat();
  c.messages.push({ role: 'user', content: text, ts: Date.now() });
  if (c.title === 'New chat') c.title = text.slice(0, 48);
  c.updated = Date.now();
  S.mode = c.mode;
  save();
  markActive();
  await respond(c);
}
function openChatWith(mode, prompt) {
  if (sending) { toast('Please wait for the current answer first'); go('chat'); return; }
  let c = curChat();
  if (!c || c.messages.length) c = newChat(mode);
  c.mode = mode;
  S.mode = mode;
  save();
  go('chat');
  if (prompt) sendMsg(prompt);
}

function historySheet() {
  const list = [...S.chats].filter((c) => c.messages.length).sort((a, b) => b.updated - a.updated);
  openSheet(`<h3>Chat history</h3><p class="hint" style="margin:0 0 6px">Saved on this device.</p>
    ${list.length ? list.map((c) => `<div class="list-item ${c.id === S.currentChat ? 'cur' : ''}"><button class="grow mini" style="text-align:left;color:inherit;padding:0" data-act="openChat" data-id="${c.id}"><b>${esc(c.title)}</b><small>${SUBJ[c.mode]?.label || 'General'} · ${c.messages.length} messages · ${fmtDate(c.updated)}</small></button><button class="mini" data-act="delChat" data-id="${c.id}" aria-label="Delete chat">${ic('trash')}</button></div>`).join('') : '<div class="empty"><b>No chats yet</b>Your conversations will appear here.</div>'}
    <div class="sheet-actions"><button class="btn primary" data-act="newChat">New chat</button><button class="btn" data-act="closeSheet">Close</button></div>`);
}

/* ============================ HOMEWORK ============================ */
const HW_EX = {
  math: ['Solve 2x + 5 = 17 and explain each step', 'How do I find the area of a circle?', 'Explain fractions with a pizza example'],
  physics: ['Why do objects fall at the same speed?', 'Explain Ohm\'s law with an example', 'What is kinetic energy?'],
  chemistry: ['How do I balance chemical equations?', 'What is a mole in chemistry?', 'Explain acids and bases simply'],
  biology: ['Explain photosynthesis step by step', 'What is the difference between DNA and RNA?', 'How does the heart pump blood?'],
  english: ['Explain subject-verb agreement', 'How do I write a good paragraph?', 'What is a metaphor? Give examples'],
  japanese: ['Explain the particles は, が and を', 'How do I make the polite form of verbs?', 'Teach me numbers 1–10'],
};
let hwSubj = 'math';
renderers.homework = function renderHomework() {
  const prev = $('#hwQ')?.value || '';
  $('#v-homework').innerHTML = `<div class="pad">
    <p class="lead">Pick a subject, type your question and get a clear, step-by-step explanation.</p>
    <div class="subj-grid">${Object.entries(SUBJ).filter(([k]) => k !== 'general').map(([k, v]) => `<button class="subj ${hwSubj === k ? 'sel' : ''}" data-act="hwSubj" data-s="${k}"><span class="e">${v.emoji}</span>${v.label}</button>`).join('')}</div>
    <form id="hwForm" class="card" style="margin-top:16px">
      <label style="margin-top:0" for="hwQ">Your question</label>
      <textarea id="hwQ" rows="4" placeholder="e.g. Solve 2x + 5 = 17 and explain each step" required>${esc(prev)}</textarea>
      <label for="hwStyle">Explanation style</label>
      <select id="hwStyle"><option>Explain simply</option><option>Give a step-by-step solution</option><option>Explain like I'm 10 years old</option><option>Give hints only, don't reveal the answer</option><option>Explain with a real-life example</option></select>
      <button class="btn primary block" style="margin-top:16px">${ic('sparkles')} Get help</button>
    </form>
    <div class="sec-h"><h3>Try one of these</h3></div>
    <div class="ex" id="hwEx">${hwExamples()}</div>
  </div>`;
};
const hwExamples = () => HW_EX[hwSubj].map((s) => `<button data-act="hwEx" data-t="${esc(s)}">${esc(s)}</button>`).join('');

/* ============================ JAPANESE ============================ */
const KROM = [['a', 'i', 'u', 'e', 'o'], ['ka', 'ki', 'ku', 'ke', 'ko'], ['sa', 'shi', 'su', 'se', 'so'], ['ta', 'chi', 'tsu', 'te', 'to'], ['na', 'ni', 'nu', 'ne', 'no'], ['ha', 'hi', 'fu', 'he', 'ho'], ['ma', 'mi', 'mu', 'me', 'mo'], ['ya', '', 'yu', '', 'yo'], ['ra', 'ri', 'ru', 're', 'ro'], ['wa', '', '', '', 'wo'], ['n', '', '', '', '']];
const HIRA = ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や・ゆ・よ', 'らりるれろ', 'わ・・・を', 'ん・・・・'];
const KATA = ['アイウエオ', 'カキクケコ', 'サシスセソ', 'タチツテト', 'ナニヌネノ', 'ハヒフヘホ', 'マミムメモ', 'ヤ・ユ・ヨ', 'ラリルレロ', 'ワ・・・ヲ', 'ン・・・・'];
let kanaSet = 'h';
const LESSONS = [
  { t: 'Hiragana', d: 'Start from あ い う え お', p: () => 'Teach me hiragana step by step, starting with the vowel row (あ い う え お). Include romaji, how to pronounce each, a memory trick, and a mini practice at the end.' },
  { t: 'Katakana', d: 'For foreign words', p: () => 'Teach me katakana step by step, starting with the vowel row (ア イ ウ エ オ). Include romaji, pronunciation, memory tricks, common loanwords and a mini practice.' },
  { t: 'Vocabulary', d: (l) => `10 words for ${l}`, p: (l) => `Teach me 10 useful JLPT ${l} vocabulary words. Use a table with kanji, hiragana reading, romaji and meaning, then one example sentence for each word.` },
  { t: 'Kanji', d: (l) => `5 kanji for ${l}`, p: (l) => `Teach me 5 JLPT ${l} kanji. For each: meaning, on'yomi and kun'yomi readings, stroke-order tip, a mnemonic and 2 example words.` },
  { t: 'Grammar', d: (l) => `Key pattern for ${l}`, p: (l) => `Teach me one important JLPT ${l} grammar point I may not know yet. Explain when to use it, the pattern, 3 example sentences (Japanese, romaji, English) and common mistakes. Then give me one sentence to translate.` },
  { t: 'Pronunciation', d: 'Sound like a native', p: () => 'Give me practical Japanese pronunciation tips: vowel length, small っ, ん, pitch accent, and how the particles は, を and へ are pronounced. Add short practice words with romaji.' },
  { t: 'Conversation', d: 'Role-play practice', p: (l) => `Let's practise a simple Japanese conversation at JLPT ${l} level. Start with a short scenario (e.g. introducing myself at school). Show Japanese, romaji and English, then let me reply and correct my mistakes kindly.` },
  { t: 'Kana quiz', d: 'Test your reading', quiz: 'Hiragana and katakana reading (romaji answers)' },
];

renderers.japanese = function renderJapanese() {
  const rows = (kanaSet === 'h' ? HIRA : KATA);
  const cells = rows.map((r, ri) => Array.from(r).map((ch, ci) => ch === '・' ? '<div class="kc blank"></div>' : `<button class="kc" data-act="kana" data-ch="${ch}"><b>${ch}</b><small>${KROM[ri][ci]}</small></button>`).join('')).join('');
  $('#v-japanese').innerHTML = `<div class="pad">
    <div class="card"><label style="margin-top:0">JLPT level</label>
      <div class="chips">${['N5', 'N4', 'N3', 'N2'].map((l) => `<button class="chip ${S.level === l ? 'sel' : ''}" data-act="lvl" data-l="${l}">${l}</button>`).join('')}</div>
      <p class="hint">Lessons below are tailored to this level.</p></div>
    <div class="sec-h"><h3>Start a lesson</h3></div>
    <div class="lessons">${LESSONS.map((l, i) => `<button class="lesson" data-act="lesson" data-i="${i}">${l.t}<small>${typeof l.d === 'function' ? l.d(S.level) : l.d}</small></button>`).join('')}</div>
    <div class="sec-h"><h3>Kana charts</h3><div class="seg"><button class="${kanaSet === 'h' ? 'sel' : ''}" data-act="kset" data-k="h">Hiragana</button><button class="${kanaSet === 'k' ? 'sel' : ''}" data-act="kset" data-k="k">Katakana</button></div></div>
    <div class="card"><div class="kana">${cells}</div></div>
    <p class="hint">Tap a character to hear it. Or ask the tutor anything in the chat.</p>
    <button class="btn primary block" style="margin-top:14px" data-act="jpChat">${ic('chat')} Ask the Japanese tutor</button>
  </div>`;
};
function speak(text) {
  if (!('speechSynthesis' in window)) return toast('Speech is not supported on this device', 'error');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.8;
  const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith('ja'));
  if (v) u.voice = v; else if (speechSynthesis.getVoices().length) toast('No Japanese voice installed. Add one in Android settings → Text-to-speech.');
  speechSynthesis.speak(u);
}

/* ============================ PLANNER ============================ */
let planDate = today();
renderers.plan = function renderPlan() {
  const base = new Date();
  base.setDate(base.getDate() - 2);
  const strip = [...Array(16)].map((_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
  const [y, m, dd] = planDate.split('-').map(Number);
  const sel = new Date(y, m - 1, dd);
  const list = tasksFor(planDate);
  const done = list.filter((t) => t.done).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  $('#v-plan').innerHTML = `<div class="pad">
    <div class="daystrip">${strip.map((d) => { const k = dkey(d); return `<button class="day ${k === planDate ? 'sel' : ''} ${k === today() ? 'tdy' : ''}" data-act="pickDay" data-d="${k}"><small>${d.toLocaleDateString(undefined, { weekday: 'short' })}</small><b>${d.getDate()}</b></button>`; }).join('')}</div>
    <div class="card" style="margin-bottom:14px">
      <div class="row"><div class="grow"><b style="font-size:17px">${sel.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</b><div class="hint" style="margin:0">${list.length ? `${done} of ${list.length} done` : 'No tasks yet'}</div></div><b style="color:var(--p);font-size:20px">${pct}%</b></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="row" style="margin-top:12px"><button class="btn grow" data-act="aiPlan">${ic('sparkles')} AI plan</button><button class="btn grow" data-act="sortTime" ${list.length < 2 ? 'disabled' : ''}>Sort by time</button></div>
    </div>
    ${list.length ? `<div class="tasks" id="taskList">${list.map((t) => taskRow(t, { drag: true })).join('')}</div><p class="hint" style="text-align:center">Hold the ⋮⋮ handle and drag to reorder</p>` : `<div class="empty card"><b>Your day is free</b>Tap + to add a task, or let AI build a schedule for you.</div>`}
    <div style="height:70px"></div>
    <button class="fab" data-act="addTask" aria-label="Add task">${ic('plus')}</button>
  </div>`;
  $('.day.sel')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' });
  const tl = $('#taskList');
  if (tl) makeSortable(tl, (ids) => {
    const order = ids.map((id) => S.tasks.find((t) => t.id === id));
    replaceDay(planDate, order);
  });
};
function replaceDay(date, ordered) {
  const q = [...ordered];
  S.tasks = S.tasks.map((t) => (t.date === date ? q.shift() : t));
  save();
}

function makeSortable(list, onDone) {
  list.onpointerdown = (e) => {
    const h = e.target.closest('.drag');
    if (!h) return;
    const item = h.closest('.task');
    e.preventDefault();
    h.setPointerCapture(e.pointerId);
    let sy = e.clientY;
    item.classList.add('dragging');
    const move = (ev) => {
      item.style.transform = `translateY(${ev.clientY - sy}px)`;
      const ir = item.getBoundingClientRect();
      const mid = ir.top + ir.height / 2;
      const nx = item.nextElementSibling, pv = item.previousElementSibling;
      let moved = false;
      if (nx) { const r = nx.getBoundingClientRect(); if (mid > r.top + r.height / 2) { const b = item.offsetTop; list.insertBefore(nx, item); sy += item.offsetTop - b; moved = true; } }
      if (!moved && pv) { const r = pv.getBoundingClientRect(); if (mid < r.top + r.height / 2) { const b = item.offsetTop; list.insertBefore(pv, item.nextSibling); sy += item.offsetTop - b; moved = true; } }
      if (moved) item.style.transform = `translateY(${ev.clientY - sy}px)`;
      const sc = $('#v-plan');
      if (ev.clientY < 150) sc.scrollTop -= 10; else if (ev.clientY > innerHeight - 140) sc.scrollTop += 10;
    };
    const end = () => {
      h.removeEventListener('pointermove', move);
      h.removeEventListener('pointerup', end);
      h.removeEventListener('pointercancel', end);
      item.classList.remove('dragging');
      item.style.transform = '';
      onDone([...list.children].map((c) => c.dataset.id));
      if (navigator.vibrate) navigator.vibrate(10);
    };
    h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
  };
}

function taskSheet(id) {
  const t = id ? S.tasks.find((x) => x.id === id) : null;
  openSheet(`<h3>${t ? 'Edit task' : 'New task'}</h3>
    <form id="taskForm" data-id="${t?.id || ''}">
      <label for="tTitle">What will you study?</label>
      <input id="tTitle" type="text" required maxlength="120" placeholder="e.g. Maths exercise 4.2" value="${esc(t?.title || '')}">
      <div class="row"><div class="grow"><label for="tTime">Time</label><input id="tTime" type="time" value="${t?.time || ''}"></div><div class="grow"><label for="tMin">Minutes</label><input id="tMin" type="number" min="5" max="600" step="5" placeholder="45" value="${t?.minutes || ''}"></div></div>
      <div class="row"><div class="grow"><label for="tSub">Subject</label><select id="tSub">${Object.entries(SUBJ).map(([k, v]) => `<option value="${k}" ${(t?.subject || 'general') === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div><div class="grow"><label for="tDate">Date</label><input id="tDate" type="date" required value="${t?.date || planDate}"></div></div>
      <div class="sheet-actions">${t ? '<button type="button" class="btn danger" data-act="delTask">Delete</button>' : '<button type="button" class="btn" data-act="closeSheet">Cancel</button>'}<button class="btn primary">Save</button></div>
    </form>`, () => { if (!t) setTimeout(() => $('#tTitle')?.focus(), 350); });
}

function aiPlanSheet() {
  openSheet(`<h3>${ic('sparkles')} AI study plan</h3><p class="hint" style="margin:0">Tell me what to cover and I'll schedule it for ${esc(planDate)}.</p>
    <form id="aiPlanForm">
      <label for="apWhat">What do you need to study?</label>
      <textarea id="apWhat" rows="3" required placeholder="e.g. Maths chapter 5, Physics revision, 20 new Japanese N5 words"></textarea>
      <div class="row"><div class="grow"><label for="apStart">Start time</label><input id="apStart" type="time" value="16:00"></div><div class="grow"><label for="apHours">Hours available</label><input id="apHours" type="number" min="1" max="12" step="0.5" value="3"></div></div>
      <div class="sheet-actions"><button type="button" class="btn" data-act="closeSheet">Cancel</button><button class="btn primary" id="apGo">Create plan</button></div>
    </form>`);
}

/* ============================ NOTES ============================ */
let noteQuery = '';
renderers.notes = function renderNotes() {
  const q = noteQuery.toLowerCase();
  const list = [...S.notes].sort((a, b) => b.ts - a.ts).filter((n) => !q || (n.title + n.content).toLowerCase().includes(q));
  $('#v-notes').innerHTML = `<div class="pad">
    <p class="lead">Paste text or lecture material and let AI turn it into clean, organised study notes.</p>
    ${S.notes.length ? `<input class="search" id="noteSearch" placeholder="Search notes…" value="${esc(noteQuery)}" aria-label="Search notes">` : ''}
    ${list.length ? list.map((n) => `<button class="note" data-act="openNote" data-id="${n.id}"><b>${esc(n.title)}</b><p>${esc(n.content.replace(/[#*>|`-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160))}</p><small>${fmtDate(n.ts)}${n.ai ? ' · AI notes' : ''}</small></button>`).join('')
      : `<div class="empty card"><b>${S.notes.length ? 'No matching notes' : 'No notes yet'}</b>${S.notes.length ? 'Try another search.' : 'Create your first set of study notes.'}</div>`}
    <div style="height:70px"></div>
    <button class="fab" data-act="newNote" aria-label="New note">${ic('plus')}</button>
  </div>`;
};
function noteSheet(prefill = '') {
  openSheet(`<h3>${ic('sparkles')} New note</h3>
    <form id="noteForm">
      <label for="nText">Paste your text or topic</label>
      <textarea id="nText" rows="7" required placeholder="Paste a chapter, lecture transcript or just type a topic like 'Causes of World War 1'">${esc(prefill)}</textarea>
      <label for="nStyle">Note style</label>
      <select id="nStyle"><option value="structured">Structured study notes</option><option value="bullets">Short bullet summary</option><option value="cheat">One-page cheat sheet</option><option value="flash">Flashcards (Q &amp; A)</option></select>
      <div class="sheet-actions"><button type="button" class="btn" data-act="saveRaw">Save as is</button><button class="btn primary" id="nGo">${ic('sparkles')} Generate</button></div>
    </form>`);
}
function viewNote(id) {
  const n = S.notes.find((x) => x.id === id);
  if (!n) return;
  openSheet(`<div class="md" id="noteBody">${md(n.content)}</div>
    <div class="sheet-actions" style="flex-wrap:wrap"><button class="btn" data-act="copyNote" data-id="${id}">${ic('copy')} Copy</button><button class="btn" data-act="editNote" data-id="${id}">${ic('edit')} Edit</button><button class="btn" data-act="noteQuiz" data-id="${id}">${ic('quiz')} Quiz me</button></div>
    <div class="sheet-actions"><button class="btn danger" data-act="delNote" data-id="${id}">${ic('trash')} Delete</button><button class="btn primary" data-act="closeSheet">Done</button></div>`);
}
function editNoteSheet(id) {
  const n = S.notes.find((x) => x.id === id);
  openSheet(`<h3>Edit note</h3><form id="editNoteForm" data-id="${id}"><label for="enT">Title</label><input id="enT" type="text" required value="${esc(n.title)}"><label for="enC">Content (Markdown)</label><textarea id="enC" rows="12">${esc(n.content)}</textarea><div class="sheet-actions"><button type="button" class="btn" data-act="closeSheet">Cancel</button><button class="btn primary">Save</button></div></form>`);
}

/* ============================ QUIZ ============================ */
let Q = { phase: 'setup', data: null, i: 0, score: 0, picked: null, answers: [], topic: '', source: '', count: 5, diff: 'Medium', prefill: '', error: '' };
renderers.quiz = function renderQuiz() {
  const el = $('#v-quiz');
  const L = 'ABCD';
  if (Q.phase === 'loading') {
    el.innerHTML = `<div class="pad"><div class="loadbox"><span class="spin"></span>Creating your quiz…<small style="font-weight:500">This usually takes 5–15 seconds</small></div></div>`;
  } else if (Q.phase === 'play') {
    const q = Q.data.questions[Q.i];
    const n = Q.data.questions.length;
    el.innerHTML = `<div class="pad">
      <div class="qprog"><span>${Q.i + 1}/${n}</span><div class="bar"><i style="width:${(Q.i / n) * 100}%"></i></div><span>⭐ ${Q.score}</span></div>
      <div class="qtext">${esc(q.q)}</div>
      <div class="opts">${q.options.map((o, i) => {
        let cls = '';
        if (Q.picked !== null) cls = i === q.answer ? 'ok' : i === Q.picked ? 'bad' : 'dim';
        return `<button class="opt ${cls}" style="animation-delay:${i * 50}ms" data-act="pick" data-i="${i}" ${Q.picked !== null ? 'disabled' : ''}><i>${L[i]}</i><span>${esc(o)}</span></button>`;
      }).join('')}</div>
      ${Q.picked !== null ? `<div class="explain"><b>${Q.picked === q.answer ? '✅ Correct!' : '❌ Not quite'}</b><div class="md" style="margin-top:4px">${md(q.explanation || '')}</div></div>
      <button class="btn primary block" style="margin-top:14px" data-act="nextQ">${Q.i + 1 === n ? 'See results' : 'Next question'}</button>` : ''}
      <button class="link" style="display:block;margin:16px auto 0;color:var(--muted)" data-act="quitQuiz">Quit quiz</button>
    </div>`;
  } else if (Q.phase === 'result') {
    const n = Q.data.questions.length, pctv = Math.round((Q.score / n) * 100);
    const msg = pctv >= 90 ? 'Outstanding! 🏆' : pctv >= 70 ? 'Great job! 🎉' : pctv >= 50 ? 'Good effort, keep going! 💪' : "Don't worry, review and retry! 🌱";
    el.innerHTML = `<div class="pad"><div class="card"><div class="score"><div class="big">${Q.score}/${n}</div><b>${msg}</b><div class="hint">${esc(Q.data.title || Q.topic)}</div></div>
      <div class="sheet-actions"><button class="btn" data-act="retryQuiz">Retry</button><button class="btn primary" data-act="newQuiz">New quiz</button></div></div>
      <div class="sec-h"><h3>Review</h3></div><div class="card">${Q.data.questions.map((q, i) => { const a = Q.answers[i]; return `<div class="rev"><b>${i + 1}. ${esc(q.q)}</b><div>${a === q.answer ? `<span class="y">✓ ${esc(q.options[a])}</span>` : `<span class="n">✗ ${esc(q.options[a] ?? '–')}</span><br><span class="y">✓ ${esc(q.options[q.answer])}</span>`}</div><div class="hint md" style="margin-top:4px">${md(q.explanation || '')}</div></div>`; }).join('')}</div></div>`;
  } else {
    const notes = [...S.notes].sort((a, b) => b.ts - a.ts);
    el.innerHTML = `<div class="pad">
      <p class="lead">Generate a quiz on any topic, or from your own notes. Every answer comes with an explanation.</p>
      ${Q.error ? `<div class="card" style="border-color:var(--danger);color:var(--danger);margin-bottom:14px"><b>Couldn't create the quiz</b><div style="font-size:14px">${esc(Q.error)}</div></div>` : ''}
      <form id="quizForm" class="card">
        <label for="qTopic" style="margin-top:0">Topic</label>
        <input id="qTopic" type="text" maxlength="200" placeholder="e.g. Photosynthesis, JLPT N5 vocabulary, Algebra" value="${esc(Q.prefill || Q.topic)}">
        ${notes.length ? `<label for="qNote">…or use one of your notes</label><select id="qNote"><option value="">None</option>${notes.map((n) => `<option value="${n.id}" ${Q.source === n.id ? 'selected' : ''}>${esc(n.title.slice(0, 50))}</option>`).join('')}</select>` : ''}
        <div class="row"><div class="grow"><label for="qCount">Questions</label><select id="qCount">${[5, 8, 10].map((x) => `<option ${Q.count === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="grow"><label for="qDiff">Difficulty</label><select id="qDiff">${['Easy', 'Medium', 'Hard'].map((x) => `<option ${Q.diff === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
        <button class="btn primary block" style="margin-top:16px">${ic('sparkles')} Generate quiz</button>
      </form>
      <div class="sec-h"><h3>Recent quizzes</h3></div>
      ${S.quizzes.length ? S.quizzes.slice(0, 6).map((r) => `<div class="list-item"><div class="grow"><b>${esc(r.title)}</b><small>${fmtDate(r.ts)}</small></div><b style="color:var(--p)">${r.score}/${r.total}</b></div>`).join('') : '<div class="empty card"><b>No quizzes taken yet</b>Your scores will show up here.</div>'}
    </div>`;
  }
};
function shuffleQ(q) {
  const idx = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
  return { ...q, options: idx.map((i) => q.options[i]), answer: idx.indexOf(q.answer) };
}
async function makeQuiz() {
  const topic = $('#qTopic').value.trim();
  const noteId = $('#qNote')?.value || '';
  const note = S.notes.find((n) => n.id === noteId);
  Q.count = +$('#qCount').value; Q.diff = $('#qDiff').value; Q.source = noteId; Q.topic = topic; Q.prefill = ''; Q.error = '';
  if (!topic && !note) { Q.error = 'Enter a topic or choose a note first.'; return renderers.quiz(); }
  Q.phase = 'loading';
  renderers.quiz();
  const base = note ? `Create the quiz ONLY from this study material:\n"""${note.content.slice(0, 6000)}"""` : `Create the quiz on the topic: "${topic}".`;
  const prompt = `${base}\nWrite exactly ${Q.count} multiple-choice questions for ${S.grade} students, difficulty: ${Q.diff}. Each question has exactly 4 options and one correct answer. Add a short, clear explanation for the correct answer. Return ONLY valid JSON in this shape: {"title":"short quiz title","questions":[{"q":"question","options":["A","B","C","D"],"answer":0,"explanation":"why"}]} where "answer" is the 0-based index of the correct option.`;
  try {
    const raw = await ai({ system: 'You are a careful quiz writer. Output strictly valid JSON, with no text outside the JSON.', messages: [{ role: 'user', content: prompt }], json: true });
    const data = parseJSON(raw);
    const qs = (data.questions || []).filter((q) => q && q.q && Array.isArray(q.options) && q.options.length >= 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4).map((q) => shuffleQ({ ...q, q: String(q.q), options: q.options.slice(0, 4).map(String) }));
    if (!qs.length) throw new Error('The AI did not return usable questions. Please try again.');
    Q.data = { title: data.title || topic || note.title, questions: qs };
    Q.i = 0; Q.score = 0; Q.picked = null; Q.answers = []; Q.phase = 'play';
  } catch (e) {
    Q.phase = 'setup';
    Q.error = e instanceof SyntaxError || e.message === 'bad json' ? 'The AI answer was not in the right format. Please try again.' : e.message;
  }
  if (current === 'quiz') renderers.quiz();
}

/* ============================ SETTINGS / DATA ============================ */
let installEvt = null;
function settingsSheet() {
  openSheet(`<h3>Settings</h3>
    <label for="sName">Your name</label><input id="sName" type="text" maxlength="30" placeholder="Shown in the greeting" value="${esc(S.name)}">
    <label>Theme</label><div class="seg" style="display:flex">${['system', 'light', 'dark'].map((t) => `<button style="flex:1" class="${S.theme === t ? 'sel' : ''}" data-act="theme" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
    <label for="sGrade">Study level</label><select id="sGrade">${['Middle school', 'High school', 'College / University', 'Adult learner'].map((g) => `<option ${S.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
    <label>AI connection</label><button class="btn block" id="testAi" data-act="testAi">Test AI connection</button><p class="hint" id="aiStatus"></p>
    ${installEvt ? `<button class="btn primary block" style="margin-top:12px" data-act="install">Install StudyAI on this device</button>` : ''}
    <label>Your data (stored on this device)</label>
    <div class="row"><button class="btn grow" data-act="export">Export</button><button class="btn grow" data-act="import">Import</button></div>
    <button class="btn danger block" style="margin-top:10px" data-act="wipe">Delete all data</button>
    <div class="sheet-actions"><button class="btn primary" data-act="closeSheet">Done</button></div>
    <input type="file" id="importFile" accept="application/json" hidden>`, (s) => {
    $('#sName', s).addEventListener('change', (e) => { S.name = e.target.value.trim(); save(); refresh(); });
    $('#sGrade', s).addEventListener('change', (e) => { S.grade = e.target.value; save(); });
    $('#importFile', s).addEventListener('change', async (e) => {
      try {
        const data = JSON.parse(await e.target.files[0].text());
        if (typeof data !== 'object' || !Array.isArray(data.tasks || [])) throw new Error();
        S = { ...JSON.parse(JSON.stringify(DEFAULTS)), ...data };
        save(); applyTheme(); closeSheet(); refresh(); toast('Data imported', 'ok');
      } catch { toast('That file is not a valid StudyAI backup', 'error'); }
    });
  });
}

/* ============================ actions (click delegation) ============================ */
const actions = {
  closeSheet,
  hist: historySheet,
  newChat() { if (sending) return toast('Please wait for the current answer'); const c = curChat(); if (!c || c.messages.length) newChat(c?.mode); closeSheet(); go('chat'); renderers.chat(); $('#cin').focus(); },
  openChat(b) { if (sending) return toast('Please wait for the current answer'); S.currentChat = b.dataset.id; S.mode = curChat().mode; save(); closeSheet(); go('chat'); renderers.chat(); },
  delChat(b) { if (sending && b.dataset.id === S.currentChat) return toast('Please wait for the current answer'); S.chats = S.chats.filter((c) => c.id !== b.dataset.id); if (S.currentChat === b.dataset.id) S.currentChat = null; save(); historySheet(); refresh(); },
  setMode(b) { const c = ensureChat(); c.mode = b.dataset.m; S.mode = c.mode; save(); renderers.chat(); },
  suggest(b) { sendMsg(b.dataset.t); },
  retry() { const c = curChat(); if (!c || sending) return; c.messages = c.messages.filter((m) => !m.error); save(); respond(c); },
  async copyMsg(b) { await copy(curChat().messages[+b.dataset.i].content); },
  msgToNote(b) {
    const c = curChat(), m = c.messages[+b.dataset.i];
    const title = (m.content.match(/^#{1,4}\s+(.+)/m)?.[1] || c.title || 'Chat note').replace(/[*_`]/g, '').slice(0, 70);
    S.notes.unshift({ id: uid(), title, content: m.content, ts: Date.now(), ai: true });
    save(); markActive(); toast('Saved to Notes', 'ok');
  },
  speakMsg(b) { const t = (curChat().messages[+b.dataset.i].content.match(/[぀-ヿ一-鿿][぀-ヿ一-鿿、。！？ー\s]*/g) || []).join(' ').slice(0, 300); speak(t); },
  hwSubj(b) { hwSubj = b.dataset.s; $$('.subj').forEach((x) => x.classList.toggle('sel', x === b)); $('#hwEx').innerHTML = hwExamples(); },
  hwEx(b) { $('#hwQ').value = b.dataset.t; $('#hwQ').focus(); },
  lvl(b) { S.level = b.dataset.l; save(); renderers.japanese(); },
  lesson(b) { const l = LESSONS[+b.dataset.i]; if (l.quiz) { Q = { ...Q, phase: 'setup', prefill: l.quiz, source: '', error: '' }; go('quiz'); } else openChatWith('japanese', l.p(S.level)); },
  jpChat() { openChatWith('japanese'); },
  kset(b) { kanaSet = b.dataset.k; renderers.japanese(); },
  kana(b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 300); speak(b.dataset.ch); },
  pickDay(b) { planDate = b.dataset.d; renderers.plan(); },
  addTask() { taskSheet(); },
  editTask(b) { taskSheet(b.dataset.id); },
  toggleTask(b, e) {
    e.stopPropagation();
    const t = S.tasks.find((x) => x.id === b.dataset.id);
    t.done = !t.done; save();
    if (t.done) markActive(2);
    refresh();
  },
  delTask() { const id = $('#taskForm').dataset.id; S.tasks = S.tasks.filter((t) => t.id !== id); save(); closeSheet(); refresh(); toast('Task deleted'); },
  sortTime() { replaceDay(planDate, tasksFor(planDate).sort(byTime)); renderers.plan(); toast('Sorted by time', 'ok'); },
  aiPlan: aiPlanSheet,
  newNote() { noteSheet(); },
  openNote(b) { viewNote(b.dataset.id); },
  async copyNote(b) { await copy(S.notes.find((n) => n.id === b.dataset.id).content); },
  editNote(b) { editNoteSheet(b.dataset.id); },
  delNote(b) { if (!confirm('Delete this note?')) return; S.notes = S.notes.filter((n) => n.id !== b.dataset.id); save(); closeSheet(); refresh(); toast('Note deleted'); },
  noteQuiz(b) { Q = { ...Q, phase: 'setup', source: b.dataset.id, topic: '', prefill: '', error: '' }; closeSheet(); go('quiz'); },
  saveRaw() {
    const text = $('#nText').value.trim();
    if (!text) return toast('Write something first', 'error');
    S.notes.unshift({ id: uid(), title: text.split('\n')[0].slice(0, 60), content: text, ts: Date.now(), ai: false });
    save(); markActive(); closeSheet(); refresh(); toast('Note saved', 'ok');
  },
  pick(b) {
    if (Q.picked !== null) return;
    const q = Q.data.questions[Q.i];
    Q.picked = +b.dataset.i; Q.answers[Q.i] = Q.picked;
    if (Q.picked === q.answer) Q.score++;
    renderers.quiz();
  },
  nextQ() {
    if (Q.i + 1 < Q.data.questions.length) { Q.i++; Q.picked = null; }
    else {
      Q.phase = 'result';
      S.quizzes.unshift({ id: uid(), ts: Date.now(), title: Q.data.title, score: Q.score, total: Q.data.questions.length });
      S.quizzes = S.quizzes.slice(0, 100);
      save(); markActive(3);
    }
    renderers.quiz(); $('#v-quiz').scrollTop = 0;
  },
  quitQuiz() { if (confirm('Quit this quiz? Your progress will be lost.')) { Q.phase = 'setup'; renderers.quiz(); } },
  retryQuiz() { Q.data.questions = Q.data.questions.map(shuffleQ); Q.i = 0; Q.score = 0; Q.picked = null; Q.answers = []; Q.phase = 'play'; renderers.quiz(); $('#v-quiz').scrollTop = 0; },
  newQuiz() { Q = { ...Q, phase: 'setup', data: null, source: '', topic: '', prefill: '', error: '' }; renderers.quiz(); },
  theme(b) { S.theme = b.dataset.t; save(); applyTheme(); $$('.seg button[data-act=theme]').forEach((x) => x.classList.toggle('sel', x === b)); },
  async testAi(b) {
    const st = $('#aiStatus');
    b.disabled = true; st.innerHTML = '<span class="spin"></span> Checking…';
    try {
      const h = await fetch('/api/chat').then((r) => r.json()).catch(() => null);
      if (!h) throw new Error('Backend not found. Deploy the /functions folder (see README).');
      if (!h.configured) throw new Error('Backend is running but GEMINI_API_KEY is not set.');
      await ai({ system: 'Reply with the single word OK.', messages: [{ role: 'user', content: 'ping' }] });
      st.textContent = '✅ Connected. The AI is working.';
    } catch (e) { st.textContent = '⚠️ ' + e.message; } finally { b.disabled = false; }
  },
  async install() { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; closeSheet(); },
  export() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = `studyai-backup-${today()}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  import() { $('#importFile').click(); },
  wipe() { if (!confirm('Delete ALL chats, notes, tasks and progress from this device?')) return; S = JSON.parse(JSON.stringify(DEFAULTS)); save(); applyTheme(); closeSheet(); go('home'); refresh(); toast('All data deleted'); },
};

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied', 'ok'); }
  catch { toast('Could not copy on this browser', 'error'); }
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  if (a && actions[a.dataset.act]) { actions[a.dataset.act](a, e); return; }
  const g = e.target.closest('[data-go]');
  if (g) go(g.dataset.go);
});

/* ============================ forms ============================ */
document.addEventListener('submit', async (e) => {
  const f = e.target;
  e.preventDefault();
  if (f.id === 'homeAsk') {
    const v = $('#homeIn').value.trim();
    if (v) openChatWith('general', v);
  } else if (f.id === 'composer') {
    const v = $('#cin').value;
    if (!v.trim() || sending) return;
    $('#cin').value = ''; autoGrow();
    sendMsg(v);
  } else if (f.id === 'hwForm') {
    openChatWith(hwSubj, `${$('#hwStyle').value}: ${$('#hwQ').value.trim()}`);
  } else if (f.id === 'taskForm') {
    const data = { title: $('#tTitle').value.trim(), time: $('#tTime').value, minutes: +$('#tMin').value || 0, subject: $('#tSub').value, date: $('#tDate').value };
    if (!data.title) return;
    if (f.dataset.id) Object.assign(S.tasks.find((t) => t.id === f.dataset.id), data);
    else S.tasks.push({ id: uid(), done: false, ...data });
    planDate = data.date; save(); closeSheet(); refresh();
  } else if (f.id === 'aiPlanForm') {
    const btn = $('#apGo'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Planning…';
    try {
      const raw = await ai({
        system: 'You are an expert study coach. Output strictly valid JSON only.',
        json: true,
        messages: [{ role: 'user', content: `Create a realistic study schedule for a ${S.grade} student.\nTopics: ${$('#apWhat').value}\nStart time: ${$('#apStart').value || '16:00'}\nTotal time available: ${$('#apHours').value} hours.\nInclude short breaks as tasks titled "Break". Keep titles short and specific. Times must be 24h HH:MM, in order, with no overlap. Return ONLY JSON: {"tasks":[{"title":"...","time":"HH:MM","minutes":45,"subject":"math|physics|chemistry|biology|english|japanese|general"}]}` }],
      });
      const tasks = (parseJSON(raw).tasks || []).filter((t) => t && t.title).slice(0, 20);
      if (!tasks.length) throw new Error('No tasks came back. Please try again.');
      tasks.forEach((t) => S.tasks.push({ id: uid(), done: false, title: String(t.title).slice(0, 120), time: /^\d{2}:\d{2}$/.test(t.time) ? t.time : '', minutes: Math.min(600, +t.minutes || 0), subject: SUBJ[t.subject] ? t.subject : 'general', date: planDate }));
      save(); markActive(); closeSheet(); refresh(); toast(`Added ${tasks.length} tasks`, 'ok');
    } catch (err) {
      btn.disabled = false; btn.innerHTML = 'Create plan';
      toast(err instanceof SyntaxError || err.message === 'bad json' ? 'The AI answer was not in the right format. Try again.' : err.message, 'error');
    }
  } else if (f.id === 'noteForm') {
    const text = $('#nText').value.trim(); if (!text) return;
    const btn = $('#nGo'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Writing notes…';
    const style = { structured: 'well-organised study notes with clear ## sections, bullet points, **bold** key terms, a short "Key takeaways" section and 3 quick revision questions at the end', bullets: 'a short bullet-point summary (max 12 bullets) with **bold** key terms', cheat: 'a one-page cheat sheet: key definitions, formulas or rules, and a table where helpful', flash: 'flashcards: a list of "**Q:** question" followed by "**A:** answer" pairs (10-15 cards)' }[$('#nStyle').value];
    try {
      const out = await ai({
        system: 'You turn raw text or a topic into clear study notes for students. Use Markdown. The first line must be a "# Title" heading. Stay faithful to the source text; you may clarify, but do not invent facts.',
        messages: [{ role: 'user', content: `Make ${style} from the following:\n\n${text.slice(0, 9000)}` }],
      });
      const title = (out.match(/^#{1,3}\s+(.+)/m)?.[1] || text.split('\n')[0]).replace(/[*_`]/g, '').slice(0, 70);
      const n = { id: uid(), title, content: out, source: text.slice(0, 300), ts: Date.now(), ai: true };
      S.notes.unshift(n); save(); markActive(2); refresh(); viewNote(n.id);
    } catch (err) {
      btn.disabled = false; btn.innerHTML = `${ic('sparkles')} Generate`;
      toast(err.message, 'error');
    }
  } else if (f.id === 'editNoteForm') {
    const n = S.notes.find((x) => x.id === f.dataset.id);
    n.title = $('#enT').value.trim() || n.title; n.content = $('#enC').value; save(); refresh(); viewNote(n.id);
  } else if (f.id === 'quizForm') {
    makeQuiz();
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'noteSearch') { noteQuery = e.target.value; const pos = e.target.selectionStart; renderers.notes(); const n = $('#noteSearch'); n.focus(); n.setSelectionRange(pos, pos); }
  if (e.target.id === 'cin') autoGrow();
});
function autoGrow() { const t = $('#cin'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }
$('#cin').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#composer').requestSubmit(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheetWrap').hidden) closeSheet(); });

/* ============================ init ============================ */
$$('[data-ic]').forEach((el) => { el.innerHTML = ic(el.dataset.ic); });
$('#themeBtn').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  S.theme = dark ? 'light' : 'dark'; save(); applyTheme();
});
$('#setBtn').addEventListener('click', settingsSheet);
$('#backBtn').addEventListener('click', () => (history.length > 1 ? history.back() : go('home')));
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.theme === 'system') applyTheme(); });
window.addEventListener('hashchange', route);
window.addEventListener('offline', () => toast('You are offline. Notes and tasks still work.'));
window.addEventListener('online', () => toast('Back online', 'ok'));
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
window.addEventListener('appinstalled', () => { installEvt = null; toast('StudyAI installed 🎉', 'ok'); });
if ('speechSynthesis' in window) speechSynthesis.getVoices();

applyTheme();
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
