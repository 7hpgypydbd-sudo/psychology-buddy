/* Psychology Buddy: a companion for fortnightly psychology sessions.
   Everything is saved on this phone only (localStorage). Optional AI uses the person's own Claude API key. */
'use strict';
const BUILD = 7;
const KEY = 'psybuddy.v1';

/* ---------- tag vocab ---------- */
const MOODS = [
  {v:1, e:'😞', w:'Rough'}, {v:2, e:'🙁', w:'Low'}, {v:3, e:'😐', w:'Okay'}, {v:4, e:'🙂', w:'Good'}, {v:5, e:'😊', w:'Great'}
];
const KINDS = ['Thought','Feeling','Incident','Pattern','Question','Win'];
const TAGS = {
  feelings: {label:'Feelings', custom:true, opts:['Anxious','Sad','Angry','Overwhelmed','Frustrated','Lonely','Guilty','Ashamed','Numb','Irritable','Calm','Hopeful','Proud','Grateful']},
  body:     {label:'Physical symptoms', custom:true, opts:['Tense','Headache','Tired','Racing heart','Tight chest','Upset stomach','Restless','Shaky','Short of breath','Low energy','Appetite change']},
  sleep:    {label:'Sleep', opts:['Slept badly','Slept okay','Slept well','Couldn’t fall asleep','Woke in the night','Overslept','Nightmares']},
  triggers: {label:'Triggers', opts:['Work','Family','Relationship','Friends','Social situation','Health','Money','News / online','Being alone','Conflict','Change','Tiredness'], custom:true},
  people:   {label:'People', opts:[], custom:true}
};
const OUTCOMES = ['Helpful','Feel better about it','Need more time','Revisit next session','Resolved'];

/* ---------- state ---------- */
const DEFAULT_STATE = () => ({
  version:1,
  settings:{theme:'auto', nextSession:'', intervalDays:14, remindDays:2, apiKey:'', pin:'', faceId:'', backupPass:'', lastBackup:'', driveUrl:'', driveToken:'', lastAuto:'', lastAutoErr:'', dirty:false, reminders:[], habits:['Walk','Meditation','Exercise'], keyHabit:'Walk', keyHabitNote:'', upcoming:[], hardMonths:[], hardMonthNote:'', evidence:[], toughWords:[], toughQuestions:[], toughSteps:[], therapistName:'', customTags:{feelings:[], body:[], triggers:[], people:[]}},
  sessions:[], todos:[], notes:[], prep:null, talkSkip:[], habitLog:{}
});
let S = load();
function load(){
  try { const j = localStorage.getItem(KEY); if (j) { const s = JSON.parse(j); return deepMerge(DEFAULT_STATE(), s); } } catch(e){}
  return DEFAULT_STATE();
}
function deepMerge(base, add){
  for (const k in add){
    if (add[k] && typeof add[k]==='object' && !Array.isArray(add[k]) && base[k] && typeof base[k]==='object' && !Array.isArray(base[k])) base[k]=deepMerge(base[k],add[k]);
    else base[k]=add[k];
  }
  return base;
}
function save(){ S.settings.dirty = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){ toast('Couldn’t save. Storage may be full.'); } }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

/* ---------- helpers ---------- */
const $ = (s, el=document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICON = {
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  tick:'<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  paste:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></svg>'
};
const DAY = 864e5;
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function daysUntil(d){ return Math.round((startOfDay(d)-startOfDay(new Date()))/DAY); }
function fmtDate(d, opts){ return new Date(d).toLocaleDateString('en-AU', opts || {weekday:'short', day:'numeric', month:'short'}); }
function fmtTime(d){ return new Date(d).toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'}).replace(' ', '').toLowerCase(); }
function fmtWhen(d){ return fmtDate(d, {weekday:'long', day:'numeric', month:'long'}) + ' at ' + fmtTime(d); }
function dayLabel(d){ const n = daysUntil(d); if (n===0) return 'Today'; if (n===-1) return 'Yesterday'; return fmtDate(d, {weekday:'long', day:'numeric', month:'long'}); }
function toLocalInput(d){ const x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,16); }
function plural(n, w){ return n + ' ' + w + (n===1?'':'s'); }
function upcomingAfter(d){ return (S.settings.upcoming||[]).map(x=>new Date(x)).filter(x=>x > new Date(d.getTime()+DAY/2)).sort((a,b)=>a-b); }
function nextSessionDate(){ return S.settings.nextSession ? new Date(S.settings.nextSession) : null; }
function lastSession(){ return [...S.sessions].sort((a,b)=>b.date.localeCompare(a.date))[0] || null; }
function openTodos(){ return S.todos.filter(t=>!t.done && !t.archived); }
function currentTodos(){ const ls = lastSession(); return S.todos.filter(t => !t.archived && (!ls || t.sessionId===ls.id || !t.done)); }
function notesToRaise(){ return S.notes.filter(n=>!n.discussed).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)); }
function moodOf(v){ return MOODS.find(m=>m.v===v); }
function allTagOpts(group){ return [...TAGS[group].opts, ...(S.settings.customTags[group]||[])]; }
function haptic(){ try{ navigator.vibrate && navigator.vibrate(8); }catch(e){} }

let toastT;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'), 2600); }

/* ---------- theme ---------- */
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){
  const t = S.settings.theme==='auto' ? (mq.matches?'night':'calm') : S.settings.theme;
  document.documentElement.dataset.theme = t;
  $('#themeColor').content = t==='night' ? '#1C1E26' : '#EEF3F7';
}
mq.addEventListener && mq.addEventListener('change', applyTheme);

/* ---------- routing ---------- */
let tab = 'home';
let noteFilter = 'raise';
function go(t){ tab=t; render(); window.scrollTo(0,0); }
function render(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on', b.dataset.tab===tab));
  const app = $('#app');
  app.innerHTML = ({home:renderHome, notes:renderNotes, prep:renderPrep, sessions:renderSessions})[tab]();
}

/* ---------- HOME ---------- */
function greeting(){ const h=new Date().getHours(); return h<5?'Hi there':h<12?'Good morning':h<17?'Good afternoon':'Good evening'; }
function reminderText(){
  const ns = nextSessionDate(); if (!ns) return '';
  const d = daysUntil(ns); const left = openTodos().length; const raise = notesToRaise().length;
  if (d < 0) return 'Your session date has passed. Tap “I’ve had my session” on the Next session tab when you’re ready.';
  if (d > S.settings.remindDays) return '';
  const when = d===0 ? 'Your session is today' : d===1 ? 'Your session is tomorrow' : `${d} days until your session`;
  const bits = [];
  if (left) bits.push(plural(left,'to-do')+' left');
  if (raise) bits.push(plural(raise,'note')+' to bring up');
  return when + (bits.length ? ' · ' + bits.join(', ') : ' · you’re all set');
}
function backupDue(){ if (S.settings.driveUrl && (!S.settings.lastAutoErr || !S.settings.backupPass)) return false; return (S.notes.length + S.sessions.length) >= 3 && (!S.settings.lastBackup || Date.now()-new Date(S.settings.lastBackup) > 7*DAY); }
let coachShift = 0;
function coachLine(){
  const ls = lastSession();
  const pool = [];
  if (ls){
    if (ls.coachNote) pool.push({text:ls.coachNote, from:'session', date:ls.date});
    (ls.insights||[]).forEach(t=>pool.push({text:t, from:'session', date:ls.date}));
    S.todos.filter(t=>t.sessionId===ls.id && t.kind==='practice').forEach(t=>pool.push({text:'Remember to practise: ' + t.text, from:'session', date:ls.date}));
    (ls.practiceList||[]).forEach(t=>pool.push({text:t, from:'session', date:ls.date}));
  }
  (S.settings.reminders||[]).forEach(t=>pool.push({text:'\u201c'+t+'\u201d', from:'reminder'}));
  if (!pool.length) return null;
  const i = (Math.floor(Date.now()/ (6*3600e3)) + coachShift) % pool.length; // rotates every 6 hours, or on tap
  return pool[i];
}
const dayKey = d => toLocalInput(d).slice(0,10);
function habitsCard(){
  const hs = S.settings.habits||[]; if (!hs.length) return '';
  const today = S.habitLog[dayKey(new Date())]||[];
  const days = [...Array(7)].map((_,i)=>{ const d=new Date(Date.now()-(6-i)*DAY); return {d, k:dayKey(d)}; });
  const kh = S.settings.keyHabit;
  let nudge = '';
  if (kh && hs.includes(kh)){
    const logged = Object.keys(S.habitLog).filter(k=>(S.habitLog[k]||[]).length).sort();
    const lastKey = Object.keys(S.habitLog).filter(k=>(S.habitLog[k]||[]).includes(kh)).sort().pop();
    const since = lastKey ? daysUntil(new Date()) - daysUntil(new Date(lastKey+'T12:00')) : null;
    const gap = lastKey ? -daysUntil(new Date(lastKey+'T12:00')) : (logged.length && -daysUntil(new Date(logged[0]+'T12:00')));
    if (gap >= 3) nudge = `<div class="small" style="margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--warmSoft);font-weight:600">No ${esc(kh.toLowerCase())} logged for ${gap} days. ${esc(S.settings.keyHabitNote || 'Even a short one counts.')}</div>`;
  }
  return `<div class="card tight"><div class="row" style="margin-bottom:10px"><div class="lbl" style="margin:0">Today I did\u2026</div><span class="small muted" style="font-weight:700">tap to tick</span></div>
    <div class="chips">${hs.map(h=>`<button class="chip ${today.includes(h)?'on':''}" data-action="habit" data-v="${esc(h)}">${today.includes(h)?'\u2713 ':''}${esc(h)}</button>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:14px;text-align:center">${days.map(({d,k})=>{ const n=(S.habitLog[k]||[]).length; return `<div><div class="small muted" style="font-weight:700">${d.toLocaleDateString('en-AU',{weekday:'narrow'})}</div><div style="width:22px;height:22px;border-radius:8px;margin:4px auto 0;background:${n?'var(--accent)':'var(--accentSoft)'};opacity:${n?Math.min(1,.45+n*.2):1}"></div></div>`; }).join('')}</div>
    ${nudge}</div>`;
}
const DEFAULT_QUESTIONS = ['What are the facts I actually know?','Am I assuming what someone thinks or what will happen?','What happened last time I faced something like this?','What’s one small thing I can do right now?'];
const DEFAULT_STEPS = ['Take five slow breaths, longer out than in','Step outside, even for a minute','Feel your feet on the floor and name 3 things you can see','Message someone supportive'];
function openTough(){
  const st = S.settings;
  const ev = st.evidence||[], words = st.toughWords||[], qs = st.toughQuestions?.length ? st.toughQuestions : DEFAULT_QUESTIONS, steps = st.toughSteps?.length ? st.toughSteps : DEFAULT_STEPS;
  const list = (items) => `<ul class="clean">${items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`;
  openSheet('A tough moment', `
    <div class="muted" style="margin:0 2px 14px">This feeling is temporary. You don’t have to fix everything now, just the next small step.</div>
    ${words.length?`<div class="section coach"><div class="lbl">In your own words</div>${words.map(w=>`<div style="font-weight:700;font-size:17px;line-height:1.4;margin:0 0 10px">${esc(w)}</div>`).join('')}</div>`:''}
    ${ev.length?`<div class="section"><div class="lbl">You’ve already come through</div>${list(ev)}<div class="small muted" style="margin-top:8px">You’re still here, and stronger for it.</div></div>`:''}
    <div class="section"><div class="lbl">Check the story</div>${list(qs)}</div>
    <div class="section"><div class="lbl">One small step</div>${list(steps)}</div>
    <button class="btn" data-action="toughNote">Write down what’s happening</button>
    <div class="small muted" style="text-align:center;margin-top:12px">If you feel unsafe, call Lifeline on 13 11 14 or 000.</div>`);
}
function hardMonthBanner(){
  const hm = S.settings.hardMonths||[]; if (!hm.length) return '';
  const now = new Date(); const m = now.getMonth()+1; const nextM = m%12+1;
  if (hm.includes(m) || (hm.includes(nextM) && now.getDate()>=20)) return `<div class="banner" style="background:var(--accentSoft)"><span class="dot" style="background:var(--accent);box-shadow:none"></span><span>${esc(S.settings.hardMonthNote || 'This time of year can be harder for you. Small steps count.')}</span></div>`;
  return '';
}
function renderHome(){
  const ns = nextSessionDate();
  const todos = currentTodos();
  const done = todos.filter(t=>t.done).length;
  const raise = notesToRaise().length;
  const rem = reminderText();
  const coach = coachLine();
  let hero;
  if (ns){
    const d = daysUntil(ns);
    hero = `<div class="card hero">
      <div class="eyebrow" style="color:inherit;opacity:.85">Next session</div>
      <div style="margin-top:6px"><span class="big">${d<0?'–':d===0?'Today':d}</span> ${d>0?`<span class="unit">${d===1?'day to go':'days to go'}</span>`:''}</div>
      <div class="when">${esc(fmtWhen(ns))}</div>
      ${upcomingAfter(ns).length?`<div class="small" style="opacity:.85;margin-top:2px;font-weight:600">Then ${upcomingAfter(ns).slice(0,3).map(d=>esc(fmtDate(d,{day:'numeric',month:'short'}))).join(' \u00b7 ')}</div>`:''}
      <div class="row"><button class="pill press" data-action="calendar">${ICON.cal.replace('<svg','<svg style="width:16px;height:16px;vertical-align:-3px;margin-right:4px"')}Add reminder to calendar</button><button class="pill press" data-action="settings">Change</button></div>
    </div>`;
  } else {
    hero = `<div class="card hero"><div class="eyebrow" style="color:inherit;opacity:.85">Next session</div>
      <div style="font-size:22px;font-weight:800;margin:8px 0 4px">When’s your next session?</div>
      <div class="when">Set it once and I’ll count down and remind you.</div>
      <div class="row"><button class="pill press" data-action="settings">Set the date</button></div></div>`;
  }
  return `<div class="screen">
    <div class="top"><div><div class="sub">${esc(fmtDate(new Date(),{weekday:'long', day:'numeric', month:'long'}))}</div><h1>${greeting()}</h1></div>
      <button class="iconbtn" data-action="settings" aria-label="Settings">${ICON.gear}</button></div>
    ${rem?`<div class="banner"><span class="dot"></span><span>${esc(rem)}</span></div>`:''}
    ${backupDue()?`<button class="banner press" style="width:100%;text-align:left;background:var(--accentSoft)" data-action="backupNow"><span class="dot" style="background:var(--accent);box-shadow:none"></span><span style="flex:1">${S.settings.lastAutoErr?'Automatic backup isn\u2019t working right now.':S.settings.lastBackup?'It\u2019s been a week since your last backup.':'Keep your notes safe: turn on automatic backup.'} <b style="color:var(--accent)">Back up now</b></span></button>`:''}
    ${hardMonthBanner()}
    ${S.settings.driveUrl && !S.settings.backupPass?`<button class="banner press" style="width:100%;text-align:left;background:var(--accentSoft)" data-action="finishBackup"><span class="dot" style="background:var(--accent);box-shadow:none"></span><span style="flex:1">Automatic Google Drive backup is ready. <b style="color:var(--accent)">Choose a backup password to turn it on</b></span></button>`:''}
    ${(!S.sessions.length || !(S.settings.imported||[]).includes('sessions-2026-11-15b'))?`<button class="banner press" style="width:100%;text-align:left;background:var(--goodSoft)" data-action="pasteImport"><span class="dot" style="background:var(--good);box-shadow:none"></span><span style="flex:1">Got a link from Claude with your sessions? <b style="color:var(--good)">Paste my sessions</b></span></button>`:''}
    ${hero}
    <div class="card tight"><div class="lbl" style="margin-bottom:10px">How are you feeling right now?</div>
      <div class="moods">${MOODS.map(m=>`<button class="mood" data-action="quickMood" data-v="${m.v}"><span class="e">${m.e}</span><span class="w">${m.w}</span></button>`).join('')}</div></div>
    <button class="btn ghost press" style="margin:-4px 0 14px;background:var(--card)" data-action="tough">♥︎ Having a tough moment?</button>
    <div class="stats">
      <button class="stat press" data-action="tab" data-to="prep"><div class="n">${raise}</div><div class="l">${raise===1?'note':'notes'} to bring up</div></button>
      <button class="stat press" data-action="tab" data-to="sessions"><div class="n">${todos.length?`${done}<span class="muted" style="font-size:20px">/${todos.length}</span>`:'0'}</div><div class="l">to-dos done</div></button>
    </div>
    ${coach?`<button class="card coach press" style="display:block;width:100%;text-align:left" data-action="coachNext"><div class="row"><span class="eyebrow">Your backup coach</span><span class="small muted" style="font-weight:700">tap for another</span></div><div class="q" style="margin-top:8px">${esc(coach.text)}</div><div class="from small muted">${coach.from==='reminder'?'One of your reminders.':'From your session on '+esc(fmtDate(coach.date))+'.'} Your psychologist knows best, this is just a nudge.</div></button>`:''}
    ${habitsCard()}
    ${renderTodoCard(todos, 'Before next session')}
    ${coach?'':
      `<div class="card coach"><div class="eyebrow">Getting started</div><div class="q" style="margin-top:8px">Paste in your last session summary and I’ll turn it into a to-do list, the things to practise, and gentle reminders.</div><div style="margin-top:12px"><button class="btn" data-action="newSession">${ICON.paste}Add a session summary</button></div></div>`}
  </div>`;
}
function renderTodoCard(todos, title){
  if (!todos.length) return '';
  const done = todos.filter(t=>t.done).length;
  const sorted = [...todos].sort((a,b)=>(a.done-b.done) || (a.kind==='practice')-(b.kind==='practice'));
  return `<div class="card"><div class="head"><h2>${esc(title)}</h2><span class="muted small" style="font-weight:800">${done} of ${todos.length}</span></div>
    <div class="progress"><i style="width:${todos.length?Math.round(done/todos.length*100):0}%"></i></div>
    <div style="margin-top:8px">${sorted.map(todoRow).join('')}</div></div>`;
}
function todoRow(t){
  return `<button class="todo ${t.done?'done':''}" data-action="toggleTodo" data-id="${t.id}" style="width:100%;text-align:left"><span class="check">${ICON.tick}</span><span class="t">${esc(t.text)}${t.kind==='practice'?'<span class="k">practise</span>':''}</span></button>`;
}

/* ---------- NOTES ---------- */
function renderNotes(){
  const filters = [['raise','To bring up'],['starred','Starred'],['discussed','Discussed'],['all','All']];
  let list = [...S.notes].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if (noteFilter==='raise') list = list.filter(n=>!n.discussed);
  else if (noteFilter==='discussed') list = list.filter(n=>n.discussed);
  else if (noteFilter==='starred') list = list.filter(n=>n.starred);
  else if (noteFilter.startsWith('tag:')) { const t=noteFilter.slice(4); list = list.filter(n=>noteTagList(n).includes(t)); }
  const tagCounts = {};
  S.notes.forEach(n=>noteTagList(n).forEach(t=>tagCounts[t]=(tagCounts[t]||0)+1));
  const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]);
  let html = `<div class="screen"><div class="top"><div><div class="sub">Thoughts, feelings and moments</div><h1>Notes</h1></div></div>
    <div class="scrollx">${filters.map(([k,l])=>`<button class="chip ${noteFilter===k?'on':''}" data-action="filter" data-f="${k}">${l}</button>`).join('')}
    ${topTags.map(t=>`<button class="chip ${noteFilter==='tag:'+t?'on':''}" data-action="filter" data-f="tag:${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
  if (!list.length){
    html += `<div class="card empty"><div class="ic">🌿</div><div style="font-weight:800;color:var(--text)">${noteFilter==='raise'?'Nothing waiting to bring up':'No notes here yet'}</div><div class="small" style="margin:4px 0 14px">When something comes up, a thought, a feeling, a moment, jot it down. Each time is a fresh note.</div><button class="btn" data-action="newNote">Log a note</button></div>`;
  } else {
    let lastDay = '';
    list.forEach(n=>{
      const dl = dayLabel(n.createdAt);
      if (dl!==lastDay){ html += `<div class="day eyebrow">${esc(dl)}</div>`; lastDay=dl; }
      html += noteCard(n);
    });
  }
  return html + '</div>';
}
function noteTagList(n){ const t=n.tags||{}; return [...(t.feelings||[]),...(t.body||[]),...(t.sleep||[]),...(t.triggers||[]),...(t.people||[])]; }
function noteCard(n, opts={}){
  const m = moodOf(n.tags?.mood);
  const t = n.tags||{};
  const tagHtml = [
    ...(t.feelings||[]).map(x=>`<span class="tag">${esc(x)}</span>`),
    ...(t.body||[]).map(x=>`<span class="tag warm">${esc(x)}</span>`),
    ...(t.sleep||[]).map(x=>`<span class="tag">☾ ${esc(x)}</span>`),
    ...(t.triggers||[]).map(x=>`<span class="tag warm">⚡ ${esc(x)}</span>`),
    ...(t.people||[]).map(x=>`<span class="tag good">@ ${esc(x)}</span>`)
  ].join('');
  return `<button class="note press ${n.discussed?'discussed':''}" data-action="${opts.action||'openNote'}" data-id="${n.id}">
    ${n.starred?'<span class="star">★</span>':''}
    <div class="meta">${m?`<span style="font-size:18px">${m.e}</span>`:''}<span>${esc(fmtTime(n.createdAt))}${opts.showDay?' · '+esc(fmtDate(n.createdAt)):''}</span>${n.kind?`<span class="kind">${esc(n.kind)}</span>`:''}${n.discussed?'<span class="tag good" style="margin:0">Discussed</span>':''}</div>
    ${n.text?`<div class="txt">${esc(n.text)}</div>`:`<div class="txt muted">${m?'Feeling '+m.w.toLowerCase():'(no words)'}</div>`}
    ${tagHtml?`<div class="tags">${tagHtml}</div>`:''}
    ${n.outcome?`<div class="small" style="margin-top:6px"><b>Outcome:</b> ${esc(n.outcome)}</div>`:''}
  </button>`;
}

/* note editor */
let draft = null;
function openNoteEditor(note, preset={}){
  draft = note ? JSON.parse(JSON.stringify(note)) : {id:uid(), text:'', kind:'', createdAt:new Date().toISOString(), tags:{mood:preset.mood||0, feelings:[], body:[], sleep:[], triggers:[], people:[]}, starred:false, discussed:false};
  draft._isNew = !note;
  openSheet(note?'Edit note':'Log a note', noteEditorHtml());
  if (!note && !preset.mood) setTimeout(()=>$('#noteText')?.focus(), 350);
}
function noteEditorHtml(){
  const d = draft; const t = d.tags;
  const chipGroup = (g) => {
    const opts = [...new Set([...allTagOpts(g), ...(t[g]||[])])];
    const sel = t[g]||[];
    return `<details class="section" ${sel.length||g==='feelings'?'open':''}><summary>${TAGS[g].label}<span class="r">${sel.length?`<span class="cnt">${sel.length}</span>`:''}</span></summary>
      <div class="chips">${opts.map(o=>`<button class="chip ${sel.includes(o)?'on':''}" data-action="tagToggle" data-g="${g}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}
      ${TAGS[g].custom?`<button class="chip add" data-action="tagAdd" data-g="${g}">+ Add</button>`:''}</div></details>`;
  };
  return `
    <div class="field"><textarea id="noteText" placeholder="What’s on your mind? What happened, what you thought, how it felt…">${esc(d.text)}</textarea></div>
    <div class="field"><div class="lbl">What kind of note?</div><div class="chips">${KINDS.map(k=>`<button class="chip ${d.kind===k?'on':''}" data-action="kind" data-v="${k}">${k}</button>`).join('')}</div></div>
    <div class="section"><div class="lbl">Mood</div><div class="moods">${MOODS.map(m=>`<button class="mood ${t.mood===m.v?'on':''}" data-action="moodPick" data-v="${m.v}"><span class="e">${m.e}</span><span class="w">${m.w}</span></button>`).join('')}</div></div>
    ${chipGroup('feelings')}${chipGroup('body')}${chipGroup('sleep')}${chipGroup('triggers')}${chipGroup('people')}
    <div class="section"><div class="row"><div><div style="font-weight:800">Definitely bring this up</div><div class="small muted">Starred notes come first in session</div></div>
      <button class="chip ${d.starred?'on':''}" data-action="starToggle">${d.starred?'★ Starred':'☆ Star'}</button></div></div>
    <div class="section"><div class="lbl" style="margin-bottom:6px">When</div><input type="datetime-local" id="noteWhen" value="${toLocalInput(d.createdAt)}"></div>
    ${!d._isNew?`<div class="section"><div class="row" style="margin-bottom:10px"><div style="font-weight:800">Talked about in session</div><button class="chip ${d.discussed?'on':''}" data-action="discussedToggle">${d.discussed?'✓ Discussed':'Not yet'}</button></div>
      <input type="text" id="noteOutcome" placeholder="Outcome or what you took from it (optional)" value="${esc(d.outcome||'')}"></div>`:''}
    <button class="btn" data-action="saveNote">${d._isNew?'Save note':'Save changes'}</button>
    ${!d._isNew?`<div style="height:10px"></div><button class="btn danger" data-action="deleteNote">Delete note</button>`:''}`;
}
function syncDraftFields(){
  if (!draft) return;
  const tx=$('#noteText'); if (tx) draft.text=tx.value;
  const w=$('#noteWhen'); if (w && w.value) draft.createdAt=new Date(w.value).toISOString();
  const o=$('#noteOutcome'); if (o) draft.outcome=o.value;
}
function refreshEditor(){ syncDraftFields(); const sb=$('#sheetBody'); const st=sb.scrollTop; sb.innerHTML=noteEditorHtml(); sb.scrollTop=st; }

/* ---------- PREP (next session) ---------- */
function renderPrep(){
  const ns = nextSessionDate();
  const raise = notesToRaise();
  const todos = currentTodos();
  const recent = S.notes.filter(n=>new Date(n.createdAt) > new Date(Date.now()-21*DAY));
  const sumHtml = renderNotesSummary(raise);
  return `<div class="screen">
    <div class="top"><div><div class="sub">${ns?esc(fmtWhen(ns)):'No date set yet'}</div><h1>${S.settings.therapistName?'Next session with '+esc(S.settings.therapistName):'Next session'}</h1></div>
      <button class="iconbtn" data-action="settings" aria-label="Settings">${ICON.gear}</button></div>
    <button class="btn talkbtn press" data-action="talk" ${raise.length?'':'disabled'}>${ICON.chat}Give me something to talk about</button>
    <div class="small muted" style="text-align:center;margin:8px 0 16px">${raise.length?`One tap, one topic at a time. ${plural(raise.length,'note')} waiting.`:'Log a few notes and they’ll show up here.'}</div>
    ${sumHtml}
    ${recent.length>=2?renderMoodCard(recent):''}
    ${renderTodoCard(todos, 'To-dos before this session')}
    ${raise.length?`<div class="card"><div class="head"><h2>Notes to bring up</h2><button class="link" data-action="tab" data-to="notes">See all</button></div>
      ${raise.slice(-6).reverse().map(n=>noteCard(n,{showDay:true})).join('')}</div>`:''}
    <div class="card"><h2 style="margin-bottom:6px">After your session</h2><div class="muted small" style="margin-bottom:12px">Mark what you talked about, jot how it went, and set the next date.</div>
      <button class="btn warm" data-action="afterSession">I’ve had my session</button></div>
  </div>`;
}
function renderNotesSummary(raise){
  if (!raise.length) return '';
  const p = S.prep && S.prep.noteIds && raise.every(n=>S.prep.noteIds.includes(n.id)) && S.prep.noteIds.length===raise.length ? S.prep : null;
  if (p && p.ai){
    return `<div class="card"><div class="head"><h2>Before you go in</h2><span class="tag" style="margin:0">${ICON.spark.replace('<svg','<svg style="width:12px;height:12px;vertical-align:-1px"')} AI summary</span></div>
      ${p.overview?`<div style="font-weight:600;margin-bottom:12px">${esc(p.overview)}</div>`:''}
      ${(p.themes||[]).map(th=>`<div class="theme"><h3>${esc(th.title)}</h3><div class="small" style="font-weight:600">${esc(th.summary)}</div>${th.talking_point?`<div class="small" style="margin-top:6px;color:var(--accent);font-weight:700">Try saying: “${esc(th.talking_point)}”</div>`:''}<div class="small muted" style="margin-top:4px">${plural((th.note_ids||[]).length,'note')}</div></div>`).join('')}
      ${p.opener?`<div class="small muted" style="margin-top:4px"><b>An easy way to start:</b> “${esc(p.opener)}”</div>`:''}
      <button class="btn ghost" style="margin-top:12px" data-action="aiSummarise">Refresh summary</button></div>`;
  }
  const g = localGroup(raise);
  return `<div class="card"><div class="head"><h2>Before you go in</h2><span class="muted small" style="font-weight:800">${plural(raise.length,'note')}</span></div>
    ${g.lines.length?`<ul class="clean">${g.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}
    ${g.bars.length?`<div style="margin-top:12px">${g.bars.map(b=>`<div class="bar"><span class="lb">${esc(b[0])}</span><span class="tr"><i style="width:${Math.round(b[1]/g.max*100)}%"></i></span><span class="c">${b[1]}</span></div>`).join('')}</div>`:''}
    <button class="btn soft" style="margin-top:14px" data-action="aiSummarise">${ICON.spark}Group my notes into themes</button></div>`;
}
function localGroup(notes){
  const count = (key) => { const c={}; notes.forEach(n=>(n.tags?.[key]||[]).forEach(t=>c[t]=(c[t]||0)+1)); return Object.entries(c).sort((a,b)=>b[1]-a[1]); };
  const feelings=count('feelings'), body=count('body'), trig=count('triggers'), people=count('people'), sleep=count('sleep');
  const lines = [];
  const starred = notes.filter(n=>n.starred).length;
  if (starred) lines.push(`${plural(starred,'starred note')} you really want to raise.`);
  if (feelings[0]) lines.push(`Most common feeling: ${feelings.slice(0,2).map(f=>f[0].toLowerCase()+(f[1]>1?` (${f[1]}×)`:'')).join(', ')}.`);
  if (trig[0]) lines.push(`Main triggers: ${trig.slice(0,3).map(f=>f[0]+(f[1]>1?` (${f[1]}×)`:'')).join(', ')}.`);
  if (body[0]) lines.push(`In your body: ${body.slice(0,3).map(f=>f[0].toLowerCase()).join(', ')}.`);
  const poor = sleep.filter(s=>/badly|couldn|woke|nightmare/i.test(s[0])).reduce((a,s)=>a+s[1],0);
  if (poor) lines.push(`Sleep was rough ${plural(poor,'time')}.`);
  if (people[0]) lines.push(`People involved: ${people.slice(0,3).map(f=>f[0]).join(', ')}.`);
  const moods = notes.map(n=>n.tags?.mood).filter(Boolean);
  if (moods.length) { const avg = moods.reduce((a,b)=>a+b,0)/moods.length; lines.push(`Average mood in these notes: ${moodOf(Math.round(avg)).w.toLowerCase()}.`); }
  const bars = [...trig, ...feelings].sort((a,b)=>b[1]-a[1]).slice(0,5);
  return {lines, bars, max: bars[0]?.[1]||1};
}
function renderMoodCard(notes){
  const days = 14; const pts=[];
  for (let i=days-1;i>=0;i--){
    const d0 = startOfDay(Date.now()-i*DAY);
    const ms = S.notes.filter(n=>n.tags?.mood && startOfDay(n.createdAt).getTime()===d0.getTime()).map(n=>n.tags.mood);
    pts.push(ms.length? ms.reduce((a,b)=>a+b,0)/ms.length : null);
  }
  if (pts.filter(p=>p!==null).length<2) return '';
  const W=300,H=56,pad=6; const x=i=>pad+i*(W-2*pad)/(days-1); const y=v=>H-pad-(v-1)*(H-2*pad)/4;
  let path='', dots='';
  pts.forEach((p,i)=>{ if(p===null) return; path += (path?'L':'M')+x(i).toFixed(1)+' '+y(p).toFixed(1); dots+=`<circle cx="${x(i).toFixed(1)}" cy="${y(p).toFixed(1)}" r="3.5" fill="var(--accent)"/>`; });
  return `<div class="card"><div class="head"><h2>Mood, last two weeks</h2><span class="muted small" style="font-weight:800">😞 → 😊</span></div>
    <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="0" x2="${W}" y1="${y(3)}" y2="${y(3)}" stroke="var(--line)" stroke-dasharray="4 4"/><path d="${path}" fill="none" stroke="var(--accent2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>
    <div class="row small muted" style="font-weight:700"><span>2 weeks ago</span><span>Today</span></div></div>`;
}

/* talk mode */
let talkQueue=[], talkIdx=0;
function buildTalkQueue(){
  const raise = notesToRaise();
  const p = S.prep && S.prep.ai ? S.prep : null;
  const q=[];
  if (p && p.themes?.length){
    const used = new Set();
    p.themes.forEach(th=>{
      const ns = (th.note_ids||[]).map(id=>raise.find(n=>n.id===id)).filter(Boolean);
      if (!ns.length) return; ns.forEach(n=>used.add(n.id));
      q.push({type:'theme', title:th.title, text:th.talking_point||th.summary, notes:ns});
    });
    raise.filter(n=>!used.has(n.id)).forEach(n=>q.push({type:'note', notes:[n]}));
  } else {
    // starred first, then notes whose tags recur the most, oldest first within that
    const freq={}; raise.forEach(n=>noteTagList(n).forEach(t=>freq[t]=(freq[t]||0)+1));
    const score = n => (n.starred?100:0) + noteTagList(n).reduce((a,t)=>a+(freq[t]>1?freq[t]:0),0);
    [...raise].sort((a,b)=>score(b)-score(a) || a.createdAt.localeCompare(b.createdAt)).forEach(n=>q.push({type:'note', notes:[n]}));
  }
  return q;
}
function openTalk(){ talkQueue=buildTalkQueue(); talkIdx=0; if(!talkQueue.length) return toast('No notes waiting'); renderTalk(); $('#talk').classList.add('on'); haptic(); }
function renderTalk(){
  const el=$('#talk');
  if (talkIdx>=talkQueue.length){
    el.innerHTML = `<div class="tc"><div class="bigcard" style="text-align:center"><div style="font-size:44px">🌤️</div><div class="q">That’s everything for now</div><div class="muted">Nice work showing up for yourself.</div></div>
      <div style="height:18px"></div><button class="btn" data-action="talkClose">Done</button></div>`;
    return;
  }
  const it = talkQueue[talkIdx];
  const n0 = it.notes[0]; const m = moodOf(n0.tags?.mood);
  const body = it.type==='theme'
    ? `<div class="eyebrow">Theme</div><div class="q">${esc(it.title)}</div><div style="font-weight:600">${esc(it.text)}</div>
       <div style="margin-top:14px">${it.notes.map(n=>`<div class="small" style="padding:8px 0;border-top:1px solid var(--line)"><span class="muted" style="font-weight:700">${esc(fmtDate(n.createdAt))}:</span> ${esc(n.text||'(mood only)')}</div>`).join('')}</div>`
    : `<div class="eyebrow">${esc(dayLabel(n0.createdAt))} · ${esc(fmtTime(n0.createdAt))}${n0.kind?' · '+esc(n0.kind):''}</div>
       <div class="q">${m?m.e+' ':''}${esc(n0.text|| (m?'I was feeling '+m.w.toLowerCase():''))}</div>
       <div>${noteTagList(n0).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;
  el.innerHTML = `<div class="row" style="max-width:520px;margin:0 auto;width:100%"><button class="close" data-action="talkClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button><span class="eyebrow">Something to talk about</span><span style="width:36px"></span></div>
    <div class="tc"><div class="counter">${talkIdx+1} of ${talkQueue.length}</div><div class="bigcard" id="talkCard">${body}</div>
      <div style="height:18px"></div>
      <button class="btn" data-action="talkDone">${ICON.tick.replace('<svg','<svg style="stroke:currentColor;stroke-width:3"')}We talked about this</button>
      <div style="height:10px"></div>
      <div class="btnrow"><button class="btn ghost" data-action="talkBack" ${talkIdx?'':'disabled'}>Back</button><button class="btn soft" data-action="talkNext">Skip for now</button></div></div>`;
}

/* after session wizard */
let after = null;
function openAfterSession(){
  const raise = notesToRaise();
  // assume the session was today, at the usual session time
  const today = new Date(); const ns = nextSessionDate();
  if (ns && daysUntil(ns) < 0) today.setTime(ns.getTime()); else if (ns) today.setHours(ns.getHours(), ns.getMinutes(), 0, 0);
  after = {step:1, discussed:new Set(S.notes.filter(n=>n.discussedPending).map(n=>n.id)), outcomes:{}, date: toLocalInput(today)};
  renderAfter();
}
function renderAfter(){
  const raise = notesToRaise();
  if (after.step===1){
    openSheet('How did it go?', `
      <div class="muted" style="margin:0 2px 14px">Tap the notes you talked about.</div>
      ${raise.length?raise.map(n=>`<button class="list-sel ${after.discussed.has(n.id)?'on':''}" data-action="afterPick" data-id="${n.id}"><span class="check" style="${after.discussed.has(n.id)?'background:var(--accent);border-color:var(--accent)':''}">${after.discussed.has(n.id)?ICON.tick.replace('<svg','<svg style="opacity:1;transform:none"'):''}</span><span style="flex:1"><span class="small muted" style="font-weight:700">${esc(fmtDate(n.createdAt))}</span><br><span style="font-weight:600">${esc(n.text||'(mood only)')}</span></span></button>`).join(''):'<div class="card empty">No open notes this time.</div>'}
      <div style="height:8px"></div><button class="btn" data-action="afterNext">Next</button>`);
  } else if (after.step===2){
    const picked = raise.filter(n=>after.discussed.has(n.id));
    openSheet('What came out of it?', `
      <div class="muted" style="margin:0 2px 14px">${picked.length?'A word or two for each is plenty. All optional.':'Nothing marked, that’s fine.'}</div>
      ${picked.map(n=>`<div class="section"><div style="font-weight:700;margin-bottom:10px">${esc(n.text||'(mood only)')}</div>
        <div class="chips" style="margin-bottom:10px">${OUTCOMES.map(o=>`<button class="chip sm ${(after.outcomes[n.id]||'')===o?'on':''}" data-action="afterOutcome" data-id="${n.id}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <input type="text" data-outcome="${n.id}" placeholder="Or write your own" value="${esc(OUTCOMES.includes(after.outcomes[n.id])?'':(after.outcomes[n.id]||''))}"></div>`).join('')}
      <div class="btnrow"><button class="btn ghost" data-action="afterBack">Back</button><button class="btn" data-action="afterNext">Next</button></div>`);
  } else {
    const prev = new Date(after.date);
    const next = upcomingAfter(prev)[0] || new Date(prev.getTime() + S.settings.intervalDays*DAY);
    const fromList = !!upcomingAfter(prev)[0];
    openSheet('Next session', `
      <div class="field"><label>This session was on</label><input type="datetime-local" id="afterDate" value="${esc(after.date)}"></div>
      <div class="field"><label>Next session</label><input type="datetime-local" id="afterNextDate" value="${toLocalInput(next)}"><div class="small muted" style="margin:6px 2px 0">${fromList?'Your next booked session.':'Set to '+S.settings.intervalDays+' days later.'} Change it if needed.</div></div>
      <div class="section"><div style="font-weight:800;margin-bottom:4px">Got your session summary?</div><div class="small muted" style="margin-bottom:10px">You can paste it now or add it later from Sessions.</div>
        <textarea id="afterSummary" class="big" placeholder="Paste the summary from your psychologist’s website here (optional)"></textarea>
        <button class="btn soft" style="margin-top:10px" data-action="pasteInto" data-target="afterSummary">${ICON.paste}Paste</button></div>
      <div class="btnrow"><button class="btn ghost" data-action="afterBack">Back</button><button class="btn" data-action="afterFinish">Finish</button></div>`);
  }
}
function captureAfterOutcomes(){ document.querySelectorAll('[data-outcome]').forEach(i=>{ if (i.value.trim()) after.outcomes[i.dataset.outcome]=i.value.trim(); }); }

/* ---------- SESSIONS ---------- */
let openSessionId = null;
function renderSessions(){
  const list = [...S.sessions].sort((a,b)=>b.date.localeCompare(a.date));
  let html = `<div class="screen"><div class="top"><div><div class="sub">Summaries, to-dos and insights</div><h1>Sessions</h1></div></div>
    <div class="btnrow" style="margin-bottom:16px"><button class="btn press" data-action="newSession">${ICON.paste}Add a summary</button><button class="btn soft press" style="flex:.8" data-action="pasteImport">Paste update from Claude</button></div>`;
  if (!list.length) html += `<div class="card empty"><div class="ic">🗂️</div><div style="font-weight:800;color:var(--text)">No sessions yet</div><div class="small" style="margin-top:4px">Copy the summary from your psychologist’s website and paste it here. I’ll pull out your to-dos, insights and things to practise.</div></div>`;
  list.forEach((s,i)=>{
    const todos = S.todos.filter(t=>t.sessionId===s.id && !t.archived);
    const done = todos.filter(t=>t.done).length;
    const disc = S.notes.filter(n=>n.discussedSessionId===s.id);
    const open = openSessionId===s.id || (openSessionId===null && i===0);
    html += `<div class="card">
      <button class="row" style="width:100%;text-align:left" data-action="toggleSession" data-id="${s.id}"><div><div class="eyebrow">${i===0?'Latest session':'Session'}</div><h2 style="margin-top:2px">${esc(fmtDate(s.date,{weekday:'long', day:'numeric', month:'long'}))}</h2></div>
        <span class="muted small" style="font-weight:800">${todos.length?`${done}/${todos.length} done`:''}</span></button>
      ${open?`<div style="margin-top:14px">
        ${s.coachNote?`<div class="theme coach" style="margin-bottom:12px"><div class="eyebrow">Backup coach</div><div style="font-weight:700;margin-top:4px">${esc(s.coachNote)}</div></div>`:''}
        ${todos.length?`<div class="eyebrow" style="margin-bottom:6px">To-do</div>${todos.map(todoRow).join('')}`:''}
        ${listBlock('Between-session practice', s.practiceList)}${listBlock('Key insights', s.insights)}${listBlock('Suggestions', s.suggestions)}
        ${disc.length?`<div class="eyebrow" style="margin:14px 0 6px">Notes you talked about</div>${disc.map(n=>`<div class="small" style="padding:6px 0;border-top:1px solid var(--line)"><b>${esc(n.text||'(mood only)')}</b>${n.outcome?`<br><span class="muted">→ ${esc(n.outcome)}</span>`:''}</div>`).join('')}`:''}
        ${s.summary?`<div class="eyebrow" style="margin:14px 0 6px">Full summary</div><div class="summaryText" id="sum-${s.id}">${esc(s.summary)}</div><button class="link small" style="color:var(--accent);font-weight:800;margin-top:6px" data-action="expandSum" data-id="${s.id}">Show all</button>`:''}
        <div class="btnrow" style="margin-top:14px"><button class="btn ghost" data-action="editSession" data-id="${s.id}">Edit</button><button class="btn danger" data-action="deleteSession" data-id="${s.id}">Delete</button></div>
      </div>`:''}
    </div>`;
  });
  return html + '</div>';
}
function listBlock(title, items){ if(!items||!items.length) return ''; return `<div class="eyebrow" style="margin:14px 0 6px">${esc(title)}</div><ul class="clean">${items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`; }

/* new session: paste -> organise -> review */
let sdraft = null;
function openNewSession(existing){
  const ls = lastSession();
  const ns = nextSessionDate();
  const defDate = existing ? existing.date : (ns && ns <= new Date(Date.now()+DAY) ? ns : new Date());
  sdraft = existing ? {id:existing.id, date:existing.date, summary:existing.summary||'', editing:true} : {id:uid(), date:new Date(defDate).toISOString(), summary:''};
  openSheet(existing?'Edit session':'Add a session summary', `
    <div class="field"><label>Session date</label><input type="date" id="sDate" value="${toLocalInput(sdraft.date).slice(0,10)}"></div>
    <div class="field"><label>Summary</label><textarea id="sText" class="big" placeholder="Paste the summary from your psychologist’s website here">${esc(sdraft.summary)}</textarea>
      <button class="btn soft" style="margin-top:10px" data-action="pasteInto" data-target="sText">${ICON.paste}Paste from clipboard</button></div>
    <button class="btn" data-action="organise" id="orgBtn">${ICON.spark}Organise it for me</button>
    <div class="small muted" style="text-align:center;margin-top:8px">${S.settings.apiKey?'Uses Claude to read it carefully. You’ll check everything before it’s saved.':'Uses simple built-in sorting. Add a Claude key in Settings for smarter results.'}</div>`);
}
async function organise(){
  const text = $('#sText').value.trim();
  const dv = $('#sDate').value;
  if (!text) return toast('Paste your summary first');
  sdraft.summary = text; if (dv) sdraft.date = new Date(dv+'T12:00').toISOString();
  const btn = $('#orgBtn'); btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Reading your summary…';
  let res = null, usedAI = false;
  if (S.settings.apiKey){
    try { res = await aiExtract(text); usedAI = true; }
    catch(e){ toast('AI didn’t work (' + e.message + '). Used simple sorting instead.'); }
  }
  if (!res) res = localExtract(text);
  sdraft.items = {
    todos: res.todos.map(t=>({text:t, on:true})),
    practice: res.practice.map(t=>({text:t, on:true})),
    insights: res.insights.map(t=>({text:t, on:true})),
    suggestions: res.suggestions.map(t=>({text:t, on:true}))
  };
  sdraft.coachNote = res.coach_note || '';
  sdraft.usedAI = usedAI;
  renderReview();
}
function renderReview(){
  const sec = (key, title, hint) => `<div class="section"><div class="lbl"><span>${title}</span><span class="small muted">${hint}</span></div>
    ${sdraft.items[key].map((it,i)=>`<div class="ritem ${it.on?'':'off'}"><button class="check" data-action="rToggle" data-k="${key}" data-i="${i}" style="${it.on?'background:var(--accent);border-color:var(--accent)':''}">${ICON.tick.replace('<svg','<svg style="opacity:'+(it.on?1:0)+';transform:none"')}</button><textarea rows="1" class="grow" data-ritem="${key}:${i}">${esc(it.text)}</textarea></div>`).join('') || '<div class="small muted">Nothing found.</div>'}
    <button class="chip add sm" style="margin-top:8px" data-action="rAdd" data-k="${key}">+ Add</button></div>`;
  openSheet('Check it over', `
    <div class="muted" style="margin:0 2px 14px">${sdraft.usedAI?'Here’s what I found.':'I sorted it with simple rules, so give it a quick check.'} Untick anything that doesn’t fit, tap text to edit.</div>
    ${sec('todos','To-do before next session','')}
    ${sec('practice','Things to practise','')}
    ${sec('insights','Key insights','')}
    ${sec('suggestions','Suggestions','')}
    <div class="section"><div class="lbl">Backup coach note</div><textarea id="coachNote" style="min-height:80px" placeholder="A short, kind reminder to yourself (optional)">${esc(sdraft.coachNote)}</textarea></div>
    <button class="btn" data-action="saveSession">Save session</button>`);
  requestAnimationFrame(growAll);
}
function growAll(){ document.querySelectorAll('textarea.grow').forEach(t=>{ t.style.height='auto'; t.style.height=t.scrollHeight+'px'; }); }
document.addEventListener('input', e=>{ if (e.target.matches('textarea.grow')){ e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; } });
function captureReview(){ document.querySelectorAll('[data-ritem]').forEach(i=>{ const [k,ix]=i.dataset.ritem.split(':'); sdraft.items[k][+ix].text=i.value; }); const c=$('#coachNote'); if(c) sdraft.coachNote=c.value; }
function saveSession(){
  captureReview();
  const pick = k => sdraft.items[k].filter(i=>i.on && i.text.trim()).map(i=>i.text.trim());
  let s = S.sessions.find(x=>x.id===sdraft.id);
  if (!s){ s = {id:sdraft.id}; S.sessions.push(s); }
  Object.assign(s, {date:sdraft.date, summary:sdraft.summary, insights:pick('insights'), suggestions:pick('suggestions'), coachNote:sdraft.coachNote.trim(), aiUsed:!!sdraft.usedAI});
  // replace this session's to-dos, keeping done state where the text matches
  const old = S.todos.filter(t=>t.sessionId===s.id);
  S.todos = S.todos.filter(t=>t.sessionId!==s.id);
  [['todos','todo'],['practice','practice']].forEach(([k,kind])=>pick(k).forEach(text=>{
    const prev = old.find(o=>o.text===text);
    S.todos.push({id:prev?.id||uid(), sessionId:s.id, text, kind, done:prev?.done||false, doneAt:prev?.doneAt||null});
  }));
  // older sessions' finished to-dos get tidied away once a newer session exists
  const latest = lastSession();
  S.todos.forEach(t=>{ if (t.done && t.sessionId!==latest.id) t.archived=true; });
  save(); closeSheet(); openSessionId = s.id; go('sessions'); toast('Session saved');
}

/* local (no-AI) extraction */
function splitItems(text){
  return text.replace(/\r/g,'').split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.replace(/^\s*([-*•●▪\d]+[.)]?\s*)+/,'').trim()).filter(s=>s.length>8 && !/:$/.test(s));
}
function localExtract(text){
  const out = {todos:[], practice:[], insights:[], suggestions:[], coach_note:''};
  let section = '';
  text.replace(/\r/g,'').split(/\n/).forEach(rawLine=>{
    const line = rawLine.trim(); if (!line) return;
    const h = line.toLowerCase();
    if (/^(#+\s*)?(homework|tasks?|action items?|to[- ]?do|between sessions?|next steps?|goals?)\b.*:?$/.test(h) && line.length<60) { section='todos'; return; }
    if (/^(#+\s*)?(practi[cs]e|exercises?|skills?|strateg(y|ies)|tools?)\b.*:?$/.test(h) && line.length<60) { section='practice'; return; }
    if (/^(#+\s*)?(insights?|key (points|themes|takeaways)|themes|observations|summary|discussion|what we (discussed|covered))\b.*:?$/.test(h) && line.length<60) { section='insights'; return; }
    if (/^(#+\s*)?(suggestions?|recommendations?|plan|considerations?)\b.*:?$/.test(h) && line.length<60) { section='suggestions'; return; }
    splitItems(line).forEach(s=>{
      const l = s.toLowerCase();
      let k = '';
      if (/\b(practi[sc]e|exercise|breathing|mindful|meditat|grounding|journal(ling)?|each day|daily|every (day|morning|night|evening))\b/.test(l)) k='practice';
      else if (/\b(homework|before (the )?next session|task|will (try|aim|work on|complete|write|book|call|schedule|keep|track|read|start)|to try|try to|aim to|commit(ted)? to|agreed to|plan(s|ned)? to|action|complete|fill (in|out)|write down|keep a|track|book|schedule|reach out)\b/.test(l)) k='todos';
      else if (/\b(suggest|recommend|consider|might (help|be)|could (try|help|be)|may (help|benefit)|worth)\b/.test(l)) k='suggestions';
      else if (/\b(notic|realis|realiz|recognis|recogniz|identif|explor|discuss|insight|pattern|link|connect|understand|reflect|learn|became aware|tend(s)? to)\b/.test(l)) k='insights';
      if (!k && section) k = section;
      if (!k) return;
      if (k==='insights' && section==='todos') k='todos';
      out[k].push(tidy(s));
    });
  });
  for (const k of ['todos','practice','insights','suggestions']) out[k] = [...new Set(out[k])].slice(0, 10);
  return out;
}
function tidy(s){ s = s.replace(/\s+/g,' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---------- AI (Claude, using the person's own key) ---------- */
const AI_SYSTEM = `You are the background "backup coach" inside a private journaling app that Bryce uses alongside fortnightly sessions with a psychologist. You support the psychologist's work and never replace it: no diagnoses, no new treatment plans, no contradicting the psychologist. Stay close to Bryce's own words and the summary's wording. Write in warm, plain Australian English, short and clear, second person ("you"). If anything in the text suggests Bryce may be at risk of harm, gently mention contacting their psychologist or Lifeline (13 11 14).`;
const EXTRACT_SCHEMA = {type:'object', additionalProperties:false, required:['todos','practice','insights','suggestions','coach_note'], properties:{
  todos:{type:'array', items:{type:'string'}, description:'Concrete tasks to do before the next session, each a short action starting with a verb.'},
  practice:{type:'array', items:{type:'string'}, description:'Skills or exercises to practise regularly (breathing, journaling, challenging thoughts, etc).'},
  insights:{type:'array', items:{type:'string'}, description:'Key insights or realisations from the session, one sentence each.'},
  suggestions:{type:'array', items:{type:'string'}, description:'Suggestions or ideas the psychologist raised that are not firm tasks.'},
  coach_note:{type:'string', description:'One or two kind sentences Bryce can read between sessions, grounded in the summary.'}
}};
const GROUP_SCHEMA = {type:'object', additionalProperties:false, required:['overview','themes','opener'], properties:{
  overview:{type:'string', description:'Two sentences on how the last fortnight seems to have gone, from the notes.'},
  themes:{type:'array', items:{type:'object', additionalProperties:false, required:['title','summary','talking_point','note_ids'], properties:{
    title:{type:'string', description:'Short theme name, 2 to 5 words.'},
    summary:{type:'string', description:'One or two sentences on what the notes in this theme show.'},
    talking_point:{type:'string', description:'A first-person sentence Bryce could say to open this topic in session.'},
    note_ids:{type:'array', items:{type:'string'}}
  }}, description:'Group related notes into 1 to 5 themes, most important first. Every note id should appear in exactly one theme.'},
  opener:{type:'string', description:'A gentle first-person sentence to start the session with.'}
}};
async function callClaude(userText, schema){
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':S.settings.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','anthropic-beta':'server-side-fallback-2026-07-01'},
    body: JSON.stringify({model:'claude-opus-5-5', max_tokens:16000, fallbacks:'default', system:AI_SYSTEM,
      output_config:{effort:'low', format:{type:'json_schema', schema}},
      messages:[{role:'user', content:userText}]})
  });
  if (!r.ok){
    let msg = 'error ' + r.status; try { const j = await r.json(); msg = j.error?.message || msg; } catch(e){}
    if (r.status===401) msg = 'the key wasn’t accepted';
    throw new Error(msg);
  }
  const j = await r.json();
  if (j.stop_reason==='refusal') throw new Error('Claude declined this one');
  const txt = (j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
  return JSON.parse(txt);
}
async function aiExtract(summary){
  const ls = lastSession();
  return callClaude(`Here is the summary of my latest psychology session. Pull out my to-dos, things to practise, key insights and suggestions, and write a short coach note.\n\n<summary>\n${summary}\n</summary>`, EXTRACT_SCHEMA);
}
async function aiGroup(notes){
  const lines = notes.map(n=>JSON.stringify({id:n.id, when:new Date(n.createdAt).toLocaleString('en-AU'), kind:n.kind||undefined, starred:n.starred||undefined, mood:moodOf(n.tags?.mood)?.w, tags:noteTagList(n), text:n.text})).join('\n');
  const ls = lastSession();
  const ctx = ls ? `\n\nFor context, my last session's insights were: ${(ls.insights||[]).join(' ')}` : '';
  return callClaude(`These are the notes I've logged since my last session, to bring up with my psychologist. Group them into themes and help me get ready.${ctx}\n\n<notes>\n${lines}\n</notes>`, GROUP_SCHEMA);
}
async function aiSummarise(btn){
  const raise = notesToRaise();
  if (!S.settings.apiKey){ openSettings(); setTimeout(()=>toast('Add a Claude key to group notes with AI'), 400); return; }
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Reading your notes…';
  try {
    const r = await aiGroup(raise);
    S.prep = {ai:true, noteIds:raise.map(n=>n.id), overview:r.overview, opener:r.opener, themes:r.themes.map(t=>({...t, note_ids:t.note_ids.filter(id=>raise.some(n=>n.id===id))})), at:new Date().toISOString()};
    save(); render(); toast('Notes grouped');
  } catch(e){ toast('Couldn’t reach Claude: ' + e.message); render(); }
}

/* ---------- sheet ---------- */
let sheetKind = '';
function openSheet(title, html){
  $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html; $('#sheetBody').scrollTop = 0;
  $('#sheet').classList.add('on'); $('#scrim').classList.add('on'); document.body.style.overflow='hidden';
}
function closeSheet(){ $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on'); document.body.style.overflow=''; draft=null; }

/* ---------- settings ---------- */
function openSettings(){
  const s = S.settings;
  const lb = s.lastBackup ? `Last backup ${fmtDate(s.lastBackup)}.` : 'Not backed up yet.';
  openSheet('Settings', `
    <div class="section"><div class="lbl">Look</div><div class="seg">${[['auto','Auto'],['calm','Calm'],['night','Night']].map(([k,l])=>`<button class="${s.theme===k?'on':''}" data-action="theme" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="small muted" style="margin-top:8px">Auto follows your phone: Calm by day, Night in dark mode.</div></div>
    <div class="section"><div class="lbl">Sessions</div>
      <div class="field"><label class="small muted">Next session</label><input type="datetime-local" id="setNext" value="${s.nextSession?esc(s.nextSession):''}"></div>
      <div class="field" style="margin-bottom:8px"><label class="small muted">How often</label><div class="seg">${[[7,'Weekly'],[14,'Fortnightly'],[21,'3 weeks'],[28,'Monthly']].map(([k,l])=>`<button class="${s.intervalDays===k?'on':''}" data-action="interval" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="field" style="margin-bottom:0"><label class="small muted">Start reminding me</label><div class="seg">${[[1,'1 day before'],[2,'2 days'],[3,'3 days']].map(([k,l])=>`<button class="${s.remindDays===k?'on':''}" data-action="remind" data-v="${k}">${l}</button>`).join('')}</div></div>
      <button class="btn soft" style="margin-top:14px" data-action="calendar">${ICON.cal}Add session reminder to my calendar</button>
      <div class="small muted" style="margin-top:6px">Puts the session in your phone’s calendar with alerts 2 days and 1 hour before.</div></div>
    <div class="section"><div class="lbl">My reminders</div><div class="small muted" style="margin-bottom:10px">Phrases that help you. The backup coach on Home rotates through them.</div>
      ${(s.reminders||[]).map((r,i)=>`<div class="ritem"><span style="flex:1;font-weight:600">${esc(r)}</span><button class="x" data-action="remDel" data-i="${i}" aria-label="Remove">\u00d7</button></div>`).join('')}
      <button class="chip add sm" style="margin-top:8px" data-action="remAdd">+ Add reminder</button></div>
    <div class="section"><div class="lbl">Evidence I can cope</div><div class="small muted" style="margin-bottom:10px">Things you’ve come through. Shown when you tap “Having a tough moment?”</div>
      ${(s.evidence||[]).map((r,i)=>`<div class="ritem"><span style="flex:1;font-weight:600">${esc(r)}</span><button class="x" data-action="evDel" data-i="${i}" aria-label="Remove">×</button></div>`).join('')}
      <button class="chip add sm" style="margin-top:8px" data-action="evAdd">+ Add</button></div>
    <div class="section"><div class="lbl">Daily habits</div><div class="small muted" style="margin-bottom:10px">Tick these off on Home.${s.keyHabit?' You\u2019ll get a gentle nudge if '+esc(s.keyHabit.toLowerCase())+' stops for 3 days.':''}</div>
      ${(s.habits||[]).map((r,i)=>`<div class="ritem"><span style="flex:1;font-weight:600">${esc(r)}</span><button class="x" data-action="habDel" data-i="${i}" aria-label="Remove">\u00d7</button></div>`).join('')}
      <button class="chip add sm" style="margin-top:8px" data-action="habAdd">+ Add habit</button></div>
    <div class="section"><div class="lbl">AI helper (optional)</div>
      <div class="small muted" style="margin-bottom:10px">With your own Claude API key, I can read summaries more carefully and group your notes into themes. The key stays on this phone. Summaries and notes are sent to Claude only when you tap an AI button.</div>
      <input type="password" id="setKey" placeholder="sk-ant-…" value="${esc(s.apiKey)}" autocomplete="off">
      <div class="btnrow" style="margin-top:10px"><button class="btn soft" data-action="testKey">Test key</button>${s.apiKey?'<button class="btn ghost" data-action="clearKey">Remove</button>':''}</div>
      <div class="small muted" style="margin-top:8px">Get one at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.</div></div>
    <div class="section"><div class="lbl">Backup</div><div class="small muted" style="margin-bottom:10px">${lb} Everything lives only on this phone, so keep a backup. Backups are locked with your backup password${s.backupPass?'':' (you’ll choose one first)'}. Pick Google Drive or Files from the share menu.</div>
      <div class="theme" style="margin-bottom:12px"><div class="row"><div><div style="font-weight:800">Automatic Google Drive backup</div><div class="small muted">${s.driveUrl?(s.lastAutoErr?'Last try failed: '+esc(s.lastAutoErr):s.lastAuto?'On \u00b7 last saved '+esc(fmtDate(s.lastAuto))+' '+esc(fmtTime(s.lastAuto)):'On'):'Off'}</div></div>
        <button class="chip ${s.driveUrl?'on':''}" data-action="driveSetup">${s.driveUrl?'On':'Set up'}</button></div>
        ${s.driveUrl?'<button class="small" style="color:var(--accent);font-weight:800;margin-top:8px" data-action="driveNow">Back up now</button>':''}</div>
      <div class="btnrow"><button class="btn soft" data-action="export">Save backup file</button><button class="btn ghost" data-action="import">Restore</button></div>
      ${s.backupPass?'<button class="small" style="color:var(--accent);font-weight:800;margin-top:10px" data-action="changeBackupPass">Change backup password</button>':''}</div>
    <div class="section"><div class="lbl">Lock</div>
      <div class="row"><div class="small muted">${s.pin?'A 4-digit code is needed to open the app.':'Ask for a 4-digit code when opening the app.'}</div>
      <button class="chip ${s.pin?'on':''}" data-action="pin">${s.pin?'Code on':'Set code'}</button></div>
      ${s.pin && faceIdSupported()?`<div class="row" style="margin-top:12px"><div class="small muted">Unlock with Face ID instead of typing the code.</div><button class="chip ${s.faceId?'on':''}" data-action="faceid">${s.faceId?'Face ID on':'Turn on'}</button></div>`:''}</div>
    <div class="section"><div class="lbl">What leaves this phone</div>
      <ul class="clean small">
        <li>Your notes, sessions and to-dos are saved only on this phone. There’s no account and no server.</li>
        <li>Text goes to Claude only when you tap an AI button, and only that text.${s.apiKey?'':' (AI is off right now.)'}</li>
        <li>Backups go only where you send them, locked with your password.</li>
        <li>Calendar reminders hold just the session time and your to-do list.</li>
      </ul></div>
    <button class="btn" data-action="saveSettings">Done</button>
    <div style="height:18px"></div>
    <button class="btn danger" data-action="wipe">Erase everything</button>
    <div class="small muted" style="text-align:center;margin-top:14px">Psychology Buddy v${BUILD} · A companion to your sessions, not a replacement for your psychologist. In a crisis call Lifeline on 13 11 14 or 000.</div>`);
}
function saveSettingsFields(){
  const n=$('#setNext'); if (n) S.settings.nextSession = n.value || '';
  const k=$('#setKey'); if (k) S.settings.apiKey = k.value.trim();
}

/* ---------- calendar (.ics) ---------- */
function icsDate(d){ return new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
async function shareFile(name, type, text){
  const file = new File([text], name, {type});
  if (navigator.canShare && navigator.canShare({files:[file]})){
    try { await navigator.share({files:[file], title:name}); return true; } catch(e){ if (e.name==='AbortError') return false; }
  }
  const url = URL.createObjectURL(file); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 4000); return true;
}
function addToCalendar(){
  saveSettingsFields();
  const ns = nextSessionDate(); if (!ns) { toast('Set your next session date first'); return; }
  const end = new Date(ns.getTime()+50*60e3);
  const todos = openTodos().map(t=>'- '+t.text).join('\\n');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Psychology Buddy//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:'+uid()+'@psychology-buddy','DTSTAMP:'+icsDate(new Date()),'DTSTART:'+icsDate(ns),'DTEND:'+icsDate(end),
    'SUMMARY:Psychology session','DESCRIPTION:Open Psychology Buddy to check your to-dos and notes.'+(todos?'\\n\\nTo-dos:\\n'+todos:''),
    'BEGIN:VALARM','TRIGGER:-P2D','ACTION:DISPLAY','DESCRIPTION:2 days until your session. Check your to-dos in Psychology Buddy.','END:VALARM',
    'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:Session in an hour. Tap "Give me something to talk about" in Psychology Buddy.','END:VALARM',
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  shareFile('psychology-session.ics','text/calendar', ics);
}

/* ---------- backup ---------- */
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function deriveKey(pass, salt){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:250000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function encryptJSON(obj, pass){
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify(obj)));
  return {app:'psychology-buddy', encrypted:true, v:1, exportedAt:new Date().toISOString(), salt:b64(salt), iv:b64(iv), data:b64Big(ct)};
}
function b64Big(buf){ const u=new Uint8Array(buf); let s=''; for (let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode(...u.subarray(i,i+0x8000)); return btoa(s); }
async function decryptJSON(file, pass){
  const key = await deriveKey(pass, unb64(file.salt));
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(file.iv)}, key, unb64(file.data));
  return JSON.parse(new TextDecoder().decode(pt));
}
function backupData(){ const data = JSON.parse(JSON.stringify(S)); ['apiKey','pin','faceId','backupPass','driveToken'].forEach(k=>delete data.settings[k]); return data; }
async function exportBackup(){
  if (!S.settings.backupPass){ askBackupPass(()=>exportBackup()); return; }
  const enc = await encryptJSON(backupData(), S.settings.backupPass);
  const name = 'psychology-buddy-backup-' + new Date().toISOString().slice(0,10) + '.json';
  const ok = await shareFile(name, 'application/json', JSON.stringify(enc));
  if (ok){ S.settings.lastBackup = new Date().toISOString(); save(); render(); }
}
/* ---------- automatic Google Drive backup (via a small Google Apps Script that Bryce owns) ---------- */
function driveScript(token){ return `// Psychology Buddy: saves encrypted backups into your Google Drive.
// Backups are locked on your phone before they arrive here, so this script can't read them.
const TOKEN = '${token}';
const FOLDER = 'Psychology Buddy backups';
const KEEP = 30; // how many backups to keep

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.token !== TOKEN) return ContentService.createTextOutput('wrong token');
  const found = DriveApp.getFoldersByName(FOLDER);
  const folder = found.hasNext() ? found.next() : DriveApp.createFolder(FOLDER);
  const name = 'psychology-buddy-' + Utilities.formatDate(new Date(), 'Australia/Sydney', 'yyyy-MM-dd-HHmm') + '.json';
  folder.createFile(name, JSON.stringify(body.backup), 'application/json');
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated());
  files.slice(KEEP).forEach(f => f.setTrashed(true));
  return ContentService.createTextOutput('ok');
}
`; }
async function driveBackup(manual){
  const st = S.settings;
  if (!st.driveUrl || !st.backupPass || !st.driveToken) return false;
  try {
    const backup = await encryptJSON(backupData(), st.backupPass);
    const body = JSON.stringify({token:st.driveToken, backup});
    let ok = false;
    try {
      const r = await fetch(st.driveUrl, {method:'POST', headers:{'content-type':'text/plain;charset=utf-8'}, body, redirect:'follow'});
      const t = await r.text(); ok = r.ok && t.trim()==='ok';
      if (!ok) throw new Error(t.trim()==='wrong token' ? 'the setup code doesn\u2019t match' : 'Google said ' + (t.slice(0,60) || r.status));
    } catch(err){
      if (err instanceof TypeError){ // browser blocked reading the reply; send blind
        await fetch(st.driveUrl, {method:'POST', mode:'no-cors', headers:{'content-type':'text/plain;charset=utf-8'}, body, keepalive: body.length < 60000});
        ok = true;
      } else throw err;
    }
    st.lastAuto = st.lastBackup = new Date().toISOString(); st.lastAutoErr = ''; st.dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
    if (manual) toast('Backed up to Google Drive \u2713');
    return true;
  } catch(e){
    st.lastAutoErr = e.message || 'no connection';
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(x){}
    if (manual) toast('Drive backup failed: ' + st.lastAutoErr);
    return false;
  }
}
// back up quietly when something changed: on leaving the app, and on opening it, at most every 30 minutes
function maybeAutoBackup(){
  const st = S.settings;
  if (!st.driveUrl || !st.dirty || !navigator.onLine) return;
  if (st.lastAuto && Date.now() - new Date(st.lastAuto) < 30*60e3) return;
  driveBackup(false);
}
function openDriveSetup(){
  if (!S.settings.backupPass){ askBackupPass(()=>openDriveSetup()); return; }
  if (!S.settings.driveToken){ S.settings.driveToken = b64(crypto.getRandomValues(new Uint8Array(18))).replace(/[^A-Za-z0-9]/g,''); save(); }
  openSheet('Automatic Drive backup', `
    <div class="muted" style="margin:0 2px 14px">A one-time setup, about 5 minutes. You\u2019re making a tiny helper in your own Google account that saves locked backups into a Drive folder called \u201cPsychology Buddy backups\u201d. Easiest on a computer, but a phone works too.</div>
    <div class="section"><div class="lbl">1. Copy the helper code</div><button class="btn soft" data-action="copyScript">Copy code</button></div>
    <div class="section"><div class="lbl">2. Make the helper</div>
      <ul class="clean small"><li>Open <a href="https://script.google.com/create" target="_blank" rel="noopener">script.google.com/create</a> (signed in to your Google account).</li>
      <li>Select all the sample code, delete it, and paste.</li>
      <li>Press <b>Deploy</b> \u2192 <b>New deployment</b>. Tap the gear, pick <b>Web app</b>.</li>
      <li>Execute as: <b>Me</b>. Who has access: <b>Anyone</b>. Press <b>Deploy</b>.</li>
      <li>Allow access when Google asks (it may say \u201cunverified app\u201d: tap Advanced, then Go to project, as it\u2019s your own).</li>
      <li>Copy the <b>Web app URL</b>.</li></ul></div>
    <div class="section"><div class="lbl">3. Paste the URL here</div><input type="text" id="driveUrl" placeholder="https://script.google.com/macros/s/\u2026/exec" value="${esc(S.settings.driveUrl)}">
      <button class="btn" style="margin-top:10px" data-action="driveConnect">Connect and back up now</button></div>
    <div class="small muted">\u201cAnyone\u201d only means your phone can send to it without signing in. Each backup is locked with your backup password before it leaves the phone, and the helper rejects anything without your private code.</div>
    ${S.settings.driveUrl?'<div style="height:12px"></div><button class="btn danger" data-action="driveOff">Turn off automatic backup</button>':''}`);
}
function askBackupPass(then){
  openSheet('Backup password', `<div class="muted" style="margin:0 2px 14px">Your backups are locked with this password, so nobody can read them, even in Google Drive. Write it down somewhere safe: without it a backup can’t be opened.</div>
    <div class="field"><input type="password" id="bp1" placeholder="Choose a password (8+ characters)" autocomplete="new-password"></div>
    <div class="field"><input type="password" id="bp2" placeholder="Type it again" autocomplete="new-password"></div>
    <button class="btn" id="bpOk">Save password</button>`);
  $('#bpOk').onclick = () => { const a=$('#bp1').value, c=$('#bp2').value;
    if (a.length<8) return toast('Use at least 8 characters'); if (a!==c) return toast('They don’t match');
    S.settings.backupPass=a; save(); closeSheet(); toast('Backup password saved'); then && then(); };
}

function importBackup(file){
  const rd = new FileReader();
  rd.onload = () => {
    let j; try { j = JSON.parse(rd.result); } catch(e){ return toast('That file isn\u2019t a Psychology Buddy backup'); }
    if (j.encrypted){
      openSheet('Unlock backup', `<div class="muted" style="margin:0 2px 14px">Enter the backup password you chose.</div><div class="field"><input type="password" id="ubp" placeholder="Backup password"></div><button class="btn" id="ubOk">Restore</button>`);
      $('#ubOk').onclick = async () => { const pass=$('#ubp').value; let data; try { data = await decryptJSON(j, pass); } catch(e){ return toast('That password didn\u2019t work'); } restoreData(data); S.settings.backupPass = pass; save(); };
      return;
    }
    if (j.kind==='sessions-import') return importSessions(j);
    restoreData(j.data || j);
  };
  rd.readAsText(file);
}
// adds past sessions (and their to-dos) without touching anything already in the app
/* ---------- one-tap link: data travels in the #fragment, which never reaches any server ---------- */
const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
async function inflateB64(b){
  const bin = Uint8Array.from(atob(b.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text());
}
async function checkLinkImport(){
  const m = location.hash.match(/^#add=([A-Za-z0-9_-]+)/); if (!m) return;
  const code = m[1];
  history.replaceState(null, '', location.pathname + location.search); // wipe it from the address bar
  try { offerImport(await inflateB64(code), code); } catch(e){ toast('That link didn’t work. Ask Claude for a fresh one.'); }
}
function offerImport(j, code){
  const n = (j.sessions||[]).length;
  openSheet('Add your sessions?', `<div style="font-weight:600;margin:4px 2px 18px">This adds ${plural(n,'session')} (${esc(fmtDate(j.sessions[0].date,{day:'numeric',month:'short'}))} to ${esc(fmtDate(j.sessions[n-1].date,{day:'numeric',month:'short'}))}), their to-dos, and your personal reminders, habits and session dates. Nothing already in the app is replaced.</div>
    <button class="btn" id="liAdd">Add them</button>`);
  $('#liAdd').onclick = async () => {
    // also copy, so the Home Screen app can pick it up if this opened in a Safari tab
    if (!isStandalone() && code) { try { await navigator.clipboard.writeText('PSYBUDDY:' + code); } catch(e){} }
    importSessions(j);
    if (code && !isStandalone() && /iPhone|iPad/.test(navigator.userAgent)) setTimeout(()=>openSheet('Nearly there', `<div style="font-weight:600;margin:4px 2px 14px">Added here in Safari. If you use Buddy from your Home Screen, open it there now and tap <b>Paste my sessions</b> on the Home page. It’s already copied.</div><div class="small muted" style="margin:0 2px 16px">Haven’t added it to your Home Screen yet? Tap Share, then Add to Home Screen.</div><button class="btn" data-action="closeSheet">OK</button>`), 900);
  };
}
async function pasteImport(){
  try {
    const t = (await navigator.clipboard.readText()||'').trim();
    const m = t.match(/PSYBUDDY:([A-Za-z0-9_-]+)/) || t.match(/#add=([A-Za-z0-9_-]+)/);
    if (!m) return toast('Nothing to paste yet. Tap the link from Claude first.');
    offerImport(await inflateB64(m[1]), null);
  } catch(e){ toast('Couldn’t paste. Tap the link from Claude again.'); }
}
function importSessions(j){
  let added = 0;
  (j.sessions||[]).forEach(sess=>{
    const day = sess.date.slice(0,10);
    if (S.sessions.some(x=>x.id===sess.id || x.date.slice(0,10)===day)) return;
    S.sessions.push(sess); added++;
    (j.todos||[]).filter(t=>t.sessionId===sess.id).forEach(t=>S.todos.push(t));
  });
  const latest = lastSession();
  S.todos.forEach(t=>{ if (t.done && latest && t.sessionId!==latest.id) t.archived=true; });
  const ps = j.settings || {}, st = S.settings;
  st.imported = st.imported || [];
  if (j.id && st.imported.includes(j.id)) { closeSheet(); go('home'); return toast('Already added'); }
  if (j.id) st.imported.push(j.id);
  const union = (a,b) => [...new Set([...(a||[]), ...(b||[])])];
  if (ps.reminders) st.reminders = union(st.reminders, ps.reminders);
  ['evidence','toughWords','toughQuestions','toughSteps'].forEach(k=>{ if (ps[k]) st[k] = union(st[k], ps[k]); });
  if (ps.therapistName) st.therapistName = ps.therapistName;
  if (ps.habits) st.habits = union(ps.habits, st.habits.filter(h=>!['Walk','Meditation','Exercise'].includes(h) || ps.habits.includes(h)));
  ['keyHabit','keyHabitNote','hardMonthNote','intervalDays','driveUrl','driveToken'].forEach(k=>{ if (ps[k]!==undefined) st[k]=ps[k]; });
  if (ps.hardMonths) st.hardMonths = union(st.hardMonths, ps.hardMonths);
  if (ps.upcoming) st.upcoming = union(st.upcoming, ps.upcoming).sort();
  if (ps.nextSession && (!st.nextSession || new Date(st.nextSession) < new Date() || new Date(ps.nextSession) < new Date(st.nextSession))) st.nextSession = ps.nextSession;
  if (ps.customTags) for (const g in ps.customTags) st.customTags[g] = union(st.customTags[g], ps.customTags[g]);
  save(); closeSheet(); openSessionId=null; go('home');
  toast(added ? `Added ${plural(added,'session')} and your personal settings` : 'Sessions already there. Personal settings updated.');
}
function restoreData(data){
  try {
    if (!Array.isArray(data.notes) || !Array.isArray(data.sessions)) throw new Error('not a backup');
    const keep = {apiKey:S.settings.apiKey, pin:S.settings.pin, faceId:S.settings.faceId, backupPass:S.settings.backupPass};
    S = deepMerge(DEFAULT_STATE(), data); Object.assign(S.settings, keep);
    save(); closeSheet(); applyTheme(); go('home'); toast('Backup restored');
  } catch(e){ toast('That file isn\u2019t a Psychology Buddy backup'); }
}

/* ---------- confirm (in-app, never browser dialogs) ---------- */
function confirmSheet(title, msg, yesLabel, onYes, danger=true){
  openSheet(title, `<div style="font-weight:600;margin:4px 2px 18px">${esc(msg)}</div>
    <button class="btn ${danger?'warm':''}" id="cfYes">${esc(yesLabel)}</button><div style="height:10px"></div><button class="btn ghost" data-action="closeSheet">Cancel</button>`);
  $('#cfYes').onclick = onYes;
}
function promptSheet(title, placeholder, onOk){
  openSheet(title, `<div class="field"><input type="text" id="pmIn" placeholder="${esc(placeholder)}"></div><button class="btn" id="pmOk">Add</button>`);
  setTimeout(()=>$('#pmIn').focus(), 300);
  const go = () => { const v=$('#pmIn').value.trim(); if (v) onOk(v); };
  $('#pmOk').onclick = go; $('#pmIn').onkeydown = e => { if (e.key==='Enter') go(); };
}

/* ---------- Face ID (device unlock via passkey, checked on this phone only) ---------- */
const faceIdSupported = () => !!(window.PublicKeyCredential && navigator.credentials && location.protocol==='https:');
async function setupFaceId(){
  try {
    const cred = await navigator.credentials.create({publicKey:{
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp:{name:'Psychology Buddy', id:location.hostname},
      user:{id:crypto.getRandomValues(new Uint8Array(16)), name:'Psychology Buddy lock', displayName:'Psychology Buddy lock'},
      pubKeyCredParams:[{type:'public-key', alg:-7},{type:'public-key', alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform', userVerification:'required', residentKey:'discouraged'},
      timeout:60000, attestation:'none'}});
    S.settings.faceId = b64(cred.rawId); save(); toast('Face ID unlock is on');
  } catch(e){ toast('Face ID wasn’t set up'); }
  openSettings();
}
async function faceIdUnlock(){
  try {
    await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)), rpId:location.hostname,
      allowCredentials:[{type:'public-key', id:unb64(S.settings.faceId)}], userVerification:'required', timeout:60000}});
    $('#lock').classList.add('hidden'); pinBuf='';
  } catch(e){ /* fall back to the code */ }
}

/* ---------- PIN lock ---------- */
let pinBuf='', pinMode='unlock', pinFirst='', hiddenAt=0;
function showLock(mode){
  pinMode = mode; pinBuf=''; pinFirst='';
  const el=$('#lock'); el.classList.remove('hidden'); renderLock();
  if (mode==='unlock' && S.settings.faceId) setTimeout(faceIdUnlock, 300);
}
function renderLock(msg){
  const title = pinMode==='unlock' ? 'Enter your code' : pinMode==='set1' ? 'Choose a 4-digit code' : 'Enter it again';
  $('#lock').innerHTML = `<div style="font-size:40px">🌿</div><h2>${title}</h2><div class="dots" id="dots">${[0,1,2,3].map(i=>`<i class="${i<pinBuf.length?'f':''}"></i>`).join('')}</div>
    ${msg?`<div class="small muted">${esc(msg)}</div>`:''}
    ${pinMode==='unlock' && S.settings.faceId?`<button class="chip" data-faceid="1">Use Face ID</button>`:''}
    <div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-pin="${n}">${n}</button>`).join('')}<button data-pin="x" style="font-size:15px;background:transparent;box-shadow:none">${pinMode==='unlock'?'':'Cancel'}</button><button data-pin="0">0</button><button data-pin="b" style="font-size:20px;background:transparent;box-shadow:none">⌫</button></div>`;
}
function pinPress(k){
  if (k==='b'){ pinBuf=pinBuf.slice(0,-1); return renderLock(); }
  if (k==='x'){ if (pinMode!=='unlock'){ $('#lock').classList.add('hidden'); } return; }
  if (pinBuf.length>=4) return;
  pinBuf += k; haptic(); renderLock();
  if (pinBuf.length<4) return;
  setTimeout(()=>{
    if (pinMode==='unlock'){
      if (pinBuf===S.settings.pin){ $('#lock').classList.add('hidden'); pinBuf=''; }
      else { pinBuf=''; renderLock('Not quite. Try again.'); $('#dots').classList.add('shake'); }
    } else if (pinMode==='set1'){ pinFirst=pinBuf; pinBuf=''; pinMode='set2'; renderLock(); }
    else { if (pinBuf===pinFirst){ S.settings.pin=pinBuf; save(); $('#lock').classList.add('hidden'); openSettings(); toast('Code set'); } else { pinMode='set1'; pinBuf=''; renderLock('They didn’t match. Start again.'); } }
  }, 150);
}
document.addEventListener('visibilitychange', ()=>{
  if (document.hidden){ hiddenAt = Date.now(); maybeAutoBackup(); }
  else { if (S.settings.pin && hiddenAt && Date.now()-hiddenAt > 2*60e3) showLock('unlock'); render(); }
});

/* ---------- events ---------- */
document.addEventListener('click', async e=>{
  const pinB = e.target.closest('[data-pin]'); if (pinB) return pinPress(pinB.dataset.pin);
  if (e.target.closest('[data-faceid]')) return faceIdUnlock();
  const tb = e.target.closest('.tab'); if (tb){ haptic(); return go(tb.dataset.tab); }
  if (e.target.id==='scrim') return closeSheet();
  const b = e.target.closest('[data-action]'); if (!b) return;
  const a = b.dataset.action, id = b.dataset.id;
  switch(a){
    case 'tab': go(b.dataset.to); break;
    case 'closeSheet': closeSheet(); break;
    case 'settings': openSettings(); break;
    case 'newNote': haptic(); openNoteEditor(null); break;
    case 'quickMood': haptic(); openNoteEditor(null, {mood:+b.dataset.v}); break;
    case 'openNote': openNoteEditor(S.notes.find(n=>n.id===id)); break;
    case 'filter': noteFilter=b.dataset.f; render(); break;
    case 'kind': syncDraftFields(); draft.kind = draft.kind===b.dataset.v?'':b.dataset.v; haptic(); refreshEditor(); break;
    case 'moodPick': syncDraftFields(); draft.tags.mood = draft.tags.mood===+b.dataset.v?0:+b.dataset.v; haptic(); refreshEditor(); break;
    case 'tagToggle': { syncDraftFields(); const g=b.dataset.g, v=b.dataset.v; const arr=draft.tags[g]=draft.tags[g]||[]; const i=arr.indexOf(v); i>=0?arr.splice(i,1):arr.push(v); haptic(); b.classList.toggle('on'); const sum=b.closest('details').querySelector('.r'); sum.innerHTML = arr.length?`<span class="cnt">${arr.length}</span>`:''; break; }
    case 'tagAdd': { syncDraftFields(); const g=b.dataset.g; const keep=draft; promptSheet(g==='people'?'Add a person':'Add a '+TAGS[g].label.toLowerCase().replace(/s$/,''), g==='people'?'Name':'Type it here', v=>{ draft=keep; const ct=S.settings.customTags[g]; if(!ct.includes(v)) ct.push(v); save(); draft.tags[g].push(v); openSheet(draft._isNew?'Log a note':'Edit note', noteEditorHtml()); }); break; }
    case 'starToggle': syncDraftFields(); draft.starred=!draft.starred; haptic(); refreshEditor(); break;
    case 'discussedToggle': syncDraftFields(); draft.discussed=!draft.discussed; refreshEditor(); break;
    case 'saveNote': {
      syncDraftFields();
      const t=draft.tags; const hasTag = t.mood || noteTagList(draft).length;
      if (!draft.text.trim() && !hasTag) return toast('Write something or pick a tag first');
      const n = {...draft}; delete n._isNew; n.text = n.text.trim();
      if (n.discussed && !n.discussedAt) n.discussedAt = new Date().toISOString();
      if (!n.discussed){ delete n.discussedAt; delete n.discussedSessionId; }
      const i = S.notes.findIndex(x=>x.id===n.id); if (i>=0) S.notes[i]=n; else S.notes.push(n);
      save(); const wasNew = draft._isNew; closeSheet(); render(); toast(wasNew?'Saved for next session':'Note updated'); break; }
    case 'deleteNote': { const nid=draft.id; confirmSheet('Delete this note?', 'This can’t be undone.', 'Delete', ()=>{ S.notes=S.notes.filter(n=>n.id!==nid); save(); closeSheet(); render(); toast('Note deleted'); }); break; }
    case 'toggleTodo': { const t=S.todos.find(x=>x.id===id); if(!t) break; t.done=!t.done; t.doneAt=t.done?new Date().toISOString():null; save(); haptic();
      b.classList.toggle('done', t.done); setTimeout(render, 380); if (t.done && openTodos().length===0) toast('All done. Lovely work 🌿'); break; }
    case 'talk': openTalk(); break;
    case 'talkClose': $('#talk').classList.remove('on'); render(); break;
    case 'talkNext': talkIdx++; renderTalk(); break;
    case 'talkBack': talkIdx=Math.max(0,talkIdx-1); renderTalk(); break;
    case 'talkDone': { const it=talkQueue[talkIdx]; it.notes.forEach(n=>{ const sn=S.notes.find(x=>x.id===n.id); if (sn) sn.discussedPending=true; }); save(); haptic(); talkIdx++; renderTalk(); toast('Marked. You can add how it went after the session.'); break; }
    case 'afterSession': openAfterSession(); break;
    case 'afterPick': after.discussed.has(id)?after.discussed.delete(id):after.discussed.add(id); haptic(); renderAfter(); break;
    case 'afterOutcome': captureAfterOutcomes(); after.outcomes[id] = after.outcomes[id]===b.dataset.v?'':b.dataset.v; renderAfter(); break;
    case 'afterBack': if (after.step===2) captureAfterOutcomes(); after.step--; renderAfter(); break;
    case 'afterNext': if (after.step===2) captureAfterOutcomes(); after.step++; renderAfter(); break;
    case 'afterFinish': {
      const sd=$('#afterDate').value || toLocalInput(new Date()); const nd=$('#afterNextDate').value; const sum=$('#afterSummary').value.trim();
      let sess = S.sessions.find(s=>s.date.slice(0,10)===new Date(sd).toISOString().slice(0,10));
      const sessId = sess ? sess.id : uid();
      S.notes.forEach(n=>{ if (after.discussed.has(n.id)){ n.discussed=true; n.discussedAt=new Date(sd).toISOString(); n.discussedSessionId=sessId; if (after.outcomes[n.id]) n.outcome=after.outcomes[n.id]; } delete n.discussedPending; });
      if (nd) S.settings.nextSession = nd;
      S.prep = null;
      save();
      if (sum){ openNewSession(); sdraft.id=sessId; $('#sText').value=sum; $('#sDate').value=sd.slice(0,10); organise(); }
      else {
        if (!sess){ S.sessions.push({id:sessId, date:new Date(sd).toISOString(), summary:'', insights:[], suggestions:[], coachNote:''}); S.todos.forEach(t=>{ if (t.done) t.archived=true; }); save(); }
        closeSheet(); go('home'); toast('Saved. Add your summary when it arrives.');
      }
      break; }
    case 'newSession': openNewSession(); break;
    case 'editSession': openNewSession(S.sessions.find(s=>s.id===id)); break;
    case 'deleteSession': confirmSheet('Delete this session?', 'Its summary and to-dos will be removed. Your notes stay.', 'Delete', ()=>{ S.sessions=S.sessions.filter(s=>s.id!==id); S.todos=S.todos.filter(t=>t.sessionId!==id); save(); closeSheet(); render(); }); break;
    case 'toggleSession': openSessionId = openSessionId===id ? '' : id; render(); break;
    case 'expandSum': $('#sum-'+id).classList.toggle('open'); b.textContent = $('#sum-'+id).classList.contains('open')?'Show less':'Show all'; break;
    case 'pasteInto': try { const t = await navigator.clipboard.readText(); if (t){ $('#'+b.dataset.target).value = t; toast('Pasted'); } else toast('Clipboard is empty'); } catch(err){ toast('Tap and hold in the box, then choose Paste'); $('#'+b.dataset.target).focus(); } break;
    case 'organise': organise(); break;
    case 'rToggle': captureReview(); { const it=sdraft.items[b.dataset.k][+b.dataset.i]; it.on=!it.on; } const st=$('#sheetBody').scrollTop; renderReview(); $('#sheetBody').scrollTop=st; break;
    case 'rAdd': { captureReview(); sdraft.items[b.dataset.k].push({text:'', on:true}); const st2=$('#sheetBody').scrollTop; renderReview(); $('#sheetBody').scrollTop=st2; const ins=document.querySelectorAll(`[data-ritem^="${b.dataset.k}:"]`); ins[ins.length-1]?.focus(); break; }
    case 'saveSession': saveSession(); break;
    case 'aiSummarise': aiSummarise(b); break;
    case 'theme': saveSettingsFields(); S.settings.theme=b.dataset.v; save(); applyTheme(); openSettings(); break;
    case 'interval': saveSettingsFields(); S.settings.intervalDays=+b.dataset.v; save(); openSettings(); break;
    case 'remind': saveSettingsFields(); S.settings.remindDays=+b.dataset.v; save(); openSettings(); break;
    case 'calendar': addToCalendar(); break;
    case 'testKey': { saveSettingsFields(); save(); if (!S.settings.apiKey) return toast('Paste a key first'); b.disabled=true; b.innerHTML='<span class="spinner"></span>';
      try { await callClaude('Reply with an empty to-do list and the coach note "Ready when you are."', EXTRACT_SCHEMA); toast('Key works ✓'); } catch(err){ toast('Key problem: '+err.message); } b.disabled=false; b.textContent='Test key'; break; }
    case 'clearKey': S.settings.apiKey=''; save(); openSettings(); break;
    case 'export': saveSettingsFields(); save(); exportBackup(); break;
    case 'import': $('#importFile').click(); break;
    case 'pin': saveSettingsFields(); save(); if (S.settings.pin){ S.settings.pin=''; S.settings.faceId=''; save(); openSettings(); toast('Code removed'); } else { closeSheet(); showLock('set1'); } break;
    case 'faceid': saveSettingsFields(); save(); if (S.settings.faceId){ S.settings.faceId=''; save(); openSettings(); toast('Face ID unlock off'); } else setupFaceId(); break;
    case 'changeBackupPass': saveSettingsFields(); save(); askBackupPass(()=>openSettings()); break;
    case 'pasteImport': pasteImport(); break;
    case 'tough': haptic(); openTough(); break;
    case 'toughNote': closeSheet(); setTimeout(()=>openNoteEditor(null), 350); break;
    case 'finishBackup': askBackupPass(()=>{ driveBackup(true).then(render); }); break;
    case 'coachNext': coachShift++; haptic(); render(); break;
    case 'habit': { const k=dayKey(new Date()); const arr=S.habitLog[k]=S.habitLog[k]||[]; const v=b.dataset.v; const i=arr.indexOf(v); i>=0?arr.splice(i,1):arr.push(v); save(); haptic(); render(); if (i<0) toast('Nice. Small steps count.'); break; }
    case 'remAdd': saveSettingsFields(); save(); promptSheet('Add a reminder', 'e.g. Stay with the facts', v=>{ S.settings.reminders.push(v); save(); openSettings(); }); break;
    case 'remDel': saveSettingsFields(); S.settings.reminders.splice(+b.dataset.i,1); save(); openSettings(); break;
    case 'evAdd': saveSettingsFields(); save(); promptSheet('Something you’ve come through', 'e.g. Moving house', v=>{ S.settings.evidence.push(v); save(); openSettings(); }); break;
    case 'evDel': saveSettingsFields(); S.settings.evidence.splice(+b.dataset.i,1); save(); openSettings(); break;
    case 'habAdd': saveSettingsFields(); save(); promptSheet('Add a daily habit', 'e.g. Physio', v=>{ S.settings.habits.push(v); save(); openSettings(); }); break;
    case 'habDel': saveSettingsFields(); S.settings.habits.splice(+b.dataset.i,1); save(); openSettings(); break;
    case 'backupNow': S.settings.driveUrl ? driveBackup(true).then(render) : (S.settings.lastBackup ? exportBackup() : openDriveSetup()); break;
    case 'driveSetup': saveSettingsFields(); save(); openDriveSetup(); break;
    case 'driveNow': driveBackup(true).then(()=>openSettings()); break;
    case 'copyScript': try { await navigator.clipboard.writeText(driveScript(S.settings.driveToken)); toast('Code copied'); } catch(err){ openSheet('Copy this code', `<textarea class="big" style="font-family:monospace;font-size:12px" readonly>${esc(driveScript(S.settings.driveToken))}</textarea><div class="small muted" style="margin-top:8px">Tap and hold, Select All, Copy.</div>`); } break;
    case 'driveConnect': { const u=$('#driveUrl').value.trim(); if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(u)) return toast('That doesn\u2019t look like the Web app URL'); S.settings.driveUrl=u; save(); b.disabled=true; b.innerHTML='<span class="spinner"></span> Backing up\u2026'; const ok = await driveBackup(true); if (ok) openSettings(); else { b.disabled=false; b.textContent='Try again'; } break; }
    case 'driveOff': S.settings.driveUrl=''; S.settings.lastAutoErr=''; save(); openSettings(); toast('Automatic backup off'); break;
    case 'saveSettings': saveSettingsFields(); save(); closeSheet(); render(); break;
    case 'wipe': confirmSheet('Erase everything?', 'All notes, sessions and to-dos on this phone will be deleted. Save a backup first if you might want them.', 'Erase everything', ()=>{ localStorage.removeItem(KEY); S=DEFAULT_STATE(); applyTheme(); closeSheet(); go('home'); toast('Everything erased'); }); break;
  }
});
$('#importFile').addEventListener('change', e=>{ const f=e.target.files[0]; if (f) importBackup(f); e.target.value=''; });

/* swipe down on the sheet's grab handle to close */
(()=>{ let y0=null; const sh=$('#sheet');
  sh.addEventListener('touchstart', e=>{ if (e.target.closest('.grab,.sh')) y0=e.touches[0].clientY; }, {passive:true});
  sh.addEventListener('touchmove', e=>{ if (y0===null) return; const dy=e.touches[0].clientY-y0; if (dy>0) sh.style.transform=`translateY(${dy}px)`; }, {passive:true});
  sh.addEventListener('touchend', e=>{ if (y0===null) return; const dy=e.changedTouches[0].clientY-y0; sh.style.transform=''; y0=null; if (dy>90) closeSheet(); });
})();

/* ---------- start ---------- */
applyTheme();
render();
if (S.settings.pin) showLock('unlock');
setTimeout(maybeAutoBackup, 4000);
checkLinkImport();
window.addEventListener('hashchange', checkLinkImport);
window.addEventListener('online', maybeAutoBackup);
if ('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
