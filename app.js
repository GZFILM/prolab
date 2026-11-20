/* ProLab · by G.Z MOTION LAB
   Script breakdown, shots + storyboard, shooting plan, set mode and edit suggestions.
   Plain JavaScript, no build step. Data lives in IndexedDB on the device. */
"use strict";

/* ================= basics ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const normLoc = l => String(l || "").trim().toLowerCase();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const TYPES = [
  ["narrative", "עלילתי", "narr"], ["corporate", "תדמית", "corp"], ["marketing", "שיווק", "mkt"], ["promo", "פרומו", "promo"],
  ["event", "כנס / אירוע", "evt"], ["clip", "וידאו קליפ", "clip"], ["mitzvah", "בר/בת מצווה", "mitz"]];
const TYPE_LABEL = Object.fromEntries(TYPES.map(t => [t[0], t[1]]));
const TYPE_DESC = {
  narrative: "Narrative short fiction film",
  corporate: "Corporate / company profile film (interviews, workplace, team, values)",
  marketing: "Marketing / commercial video for social and web",
  promo: "Promo / teaser: a short punchy video (15-60s) with a strong hook, fast rhythm and a logo / call-to-action ending",
  event: "Conference or event coverage film (speakers, audience, atmosphere, interviews, sponsors)",
  clip: "Music video: structured by song sections (intro, verse, chorus, bridge, outro), performance shots vs story shots, cuts on the beat",
  mitzvah: "Israeli Bar/Bat Mitzvah film: a short staged film starring the 12-13 year old and family, screened at the celebration; emotional, playful and cinematic"};
const TYPE_HINT = {
  clip: "Treat song sections as scenes (e.g. 'Verse 1', 'Chorus 1'); sung lyrics can be dialogue blocks of the singer.",
  event: "Typical segments: arrival & registration, stage & speakers, interviews, audience & atmosphere, networking, sponsors.",
  corporate: "Typical segments: interviews, workplace b-roll, team, product/service, values, closing.",
  promo: "Keep it short: hook, 3-5 punchy beats, logo / call to action.",
  marketing: "Structure around the message: hook, problem, solution/product, proof, call to action."};
const MUST_GROUPS = {
  narrative: "Coverage, Pickups & Inserts, Sound (wild tracks, room tone), Continuity & Props",
  mitzvah: "Family, Preparations, Key Moments, Locations & Establishing, Details & Props, Fun & Bloopers",
  corporate: "Interviews, B-roll, Team & Workplace, Product / Service, Branding, Establishing & Drone",
  marketing: "Hero Shots, Product, Lifestyle, Details & Textures, Graphics Plates, Social Cutdowns",
  promo: "Hook Shots, Hero / Product, Details & Textures, Talent, Logo & End Card, Social Cutdowns",
  event: "Arrival & Registration, Stage & Speakers, Interviews / Vox Pops, Audience & Atmosphere, Networking, Branding & Sponsors, Details",
  clip: "Performance (wide / mid / close), Story Scenes, Band & Instruments, Details & Texture, Beat Transitions, Atmosphere B-roll"};
const ST = ["left", "shot", "part", "cut"], STL = { left: "Left", shot: "Shot ✓", part: "Partial", cut: "Cut ✕" };
const NOTE_CATS = [["cam", "📷", "צילום"], ["light", "💡", "תאורה"], ["sound", "🎤", "סאונד"], ["cast", "🎭", "שחקנים"], ["art", "🪑", "ארט"], ["log", "🚗", "לוגיסטיקה"], ["gen", "📢", "כללי"]];
const NOTE_CAT = Object.fromEntries(NOTE_CATS.map(c => [c[0], c]));
const TONES = [["drama", "דרמה"], ["comedy", "קומדיה"], ["emotional", "מרגש"], ["action", "אקשן"], ["corporate", "תדמיתי"]];
const SETUP = 45, MOVE = 20, MEAL = 30;
const MODEL = "claude-opus-5-5";

const ICONS = {
  narr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l3-4h3l-3 4M10 7l3-4h3l-3 4"/></svg>',
  corp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M10 21v-4h4v4"/></svg>',
  mkt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11v2l13 5V6L3 11z"/><path d="M16 9a3 3 0 0 1 0 6M6 13l1 6h3l-1-5"/></svg>',
  promo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
  evt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/><path d="M3 9h2M19 9h2"/></svg>',
  clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
  mitz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>',
  paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/></svg>',
  idea: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/></svg>'};

const LOGO = id => `<svg viewBox="0 0 1024 1024" aria-hidden="true"><defs><clipPath id="lc${id}"><rect width="1024" height="1024" rx="232"/></clipPath><linearGradient id="lb${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#132C45"/><stop offset="1" stop-color="#0B1828"/></linearGradient><linearGradient id="lf${id}" gradientUnits="userSpaceOnUse" x1="250" y1="790" x2="702" y2="338"><stop offset="0" stop-color="#9CC4E8" stop-opacity="0.55"/><stop offset="1" stop-color="#9CC4E8" stop-opacity="0.08"/></linearGradient><pattern id="lgr${id}" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#9CC4E8" stroke-opacity="0.09" stroke-width="2"/></pattern></defs><g clip-path="url(#lc${id})"><rect width="1024" height="1024" fill="url(#lb${id})"/><rect width="1024" height="1024" fill="url(#lgr${id})"/><polygon points="250,790 849,485 555,191" fill="url(#lf${id})"/><path d="M250 790 L849 485 M250 790 L555 191" stroke="#9CC4E8" stroke-opacity="0.5" stroke-width="5" fill="none"/><path d="M664 478 Q 820 540 778 646" fill="none" stroke="#FFF6EC" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 30"/><circle cx="760" cy="706" r="50" fill="none" stroke="#F0A94C" stroke-width="12" stroke-dasharray="26 18"/><circle cx="620" cy="420" r="70" fill="#F0A94C"/><polygon points="555,450 530,512 592,486" fill="#F0A94C"/><circle cx="250" cy="790" r="22" fill="#FFF6EC"/></g></svg>`;

/* ================= storage ================= */
const IDB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open("prolab", 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("projects", { keyPath: "id" }); d.createObjectStore("images"); };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  req(store, mode, fn) {
    return new Promise((res, rej) => {
      if (!this.db) return res(null);
      const t = this.db.transaction(store, mode); const q = fn(t.objectStore(store));
      t.oncomplete = () => res(q ? q.result : null); t.onerror = () => rej(t.error);
    });
  },
  all() { return this.req("projects", "readonly", s => s.getAll()); },
  put(p) { return this.req("projects", "readwrite", s => s.put(p)); },
  del(id) { return this.req("projects", "readwrite", s => s.delete(id)); },
  putImg(id, b) { return this.req("images", "readwrite", s => s.put(b, id)); },
  getImg(id) { return this.req("images", "readonly", s => s.get(id)); },
  delImg(id) { return this.req("images", "readwrite", s => s.delete(id)); }
};
let projects = [];
let P = null;
let saveT = null;
function save() {
  if (!P) return;
  P.updated = Date.now();
  clearTimeout(saveT);
  const snap = P;
  saveT = setTimeout(() => IDB.put(JSON.parse(JSON.stringify(snap))).catch(() => toast("השמירה במכשיר נכשלה. שמור גיבוי בלשונית עריכה.")), 250);
}
let CFG = { mode: "manual", key: "" };
try { Object.assign(CFG, JSON.parse(localStorage.getItem("prolab-cfg") || "{}")); } catch (e) {}
function saveCfg() { try { localStorage.setItem("prolab-cfg", JSON.stringify(CFG)); } catch (e) {} }

const imgCache = {};
async function hydrateImages(root = document) {
  for (const el of $$("img[data-img]", root)) {
    const id = el.dataset.img;
    if (!imgCache[id]) { const b = await IDB.getImg(id).catch(() => null); if (b) imgCache[id] = URL.createObjectURL(b); }
    if (imgCache[id]) el.src = imgCache[id];
  }
}

/* ================= UI state ================= */
const ACTIONS_EXTRA = {};
const ui = {
  view: "home", sub: "scenes", scene: null, char: null, loc: null, q: "", edit: null, editHead: false,
  shScene: null, aiScene: null, tone: "drama", setDay: 1, setShot: null, wiz: null, planDay: 0
};
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3200); }

/* ================= Claude connection ================= */
let ctl = null, tick = null;
function busy(on, txt) {
  $("#status").hidden = !on;
  $$("[data-ai]").forEach(b => b.disabled = on);
  clearInterval(tick);
  if (on) {
    const t0 = Date.now();
    const upd = () => { $("#stxt").textContent = txt + " · " + Math.round((Date.now() - t0) / 1000) + " שנ׳"; };
    upd(); tick = setInterval(upd, 1000); $("#spin").hidden = false; $("#bStop").hidden = false;
  }
}
function sayStatus(txt, isErr) { $("#status").hidden = false; $("#spin").hidden = true; $("#bStop").hidden = true; $("#stxt").innerHTML = isErr ? `<span class="err">${esc(txt)}</span>` : esc(txt); }
$("#bStop").onclick = () => ctl && ctl.abort();
$("#bStatusX").onclick = () => { if ($("#spin").hidden) $("#status").hidden = true; };

function parseJSON(text) {
  const t = String(text || "").trim();
  try { return JSON.parse(t); } catch (_) {}
  const f = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) { try { return JSON.parse(f[1]); } catch (_) {} }
  const a = t.search(/[\[{]/), b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (_) {} }
  throw { code: "invalid_json" };
}
function errText(e) {
  const A = window.Anthropic;
  if (e && e.code === "cancelled") return "בוטל.";
  if (e && e.code === "invalid_json") return "התשובה הגיעה בפורמט שבור. נסה שוב, ואם זה חוזר, קצר את הטקסט.";
  if (e && e.code === "refusal") return "Claude סירב לבקשה הזו. נסה לנסח אחרת.";
  if (e && e.code === "too_long") return "התשובה נחתכה כי היא ארוכה מדי. נסה לפרק חלק מהתסריט בכל פעם.";
  if (A && e instanceof A.APIUserAbortError) return "בוטל.";
  if (A && e instanceof A.AuthenticationError) return "מפתח ה-API לא תקין. בדוק אותו בהגדרות.";
  if (A && e instanceof A.PermissionDeniedError) return "למפתח הזה אין הרשאה. בדוק את החשבון ב-console.anthropic.com.";
  if (A && e instanceof A.RateLimitError) return "יותר מדי בקשות כרגע. חכה דקה ונסה שוב.";
  if (A && e instanceof A.APIConnectionError) return "אין חיבור ל-Claude. בדוק את האינטרנט.";
  if (A && e instanceof A.BadRequestError) { const m = e.message || ""; return /credit|billing|balance/i.test(m) ? "נגמר הקרדיט בחשבון ה-API. אפשר להטעין ב-console.anthropic.com או לעבור למצב ידני בהגדרות." : "הבקשה נדחתה: " + m; }
  if (A && e instanceof A.APIError) return "שגיאה מ-Claude (" + (e.status || "") + "): " + (e.message || "");
  return "שגיאה: " + ((e && e.message) || e);
}
async function askAPI(prompt, label) {
  const client = new window.Anthropic({ apiKey: CFG.key, dangerouslyAllowBrowser: true, maxRetries: 2 });
  busy(true, label);
  try {
    const stream = client.beta.messages.stream({
      model: MODEL, max_tokens: 64000,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      messages: [{ role: "user", content: prompt }]
    });
    ctl = { abort: () => stream.abort() };
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw { code: "refusal" };
    if (msg.stop_reason === "max_tokens") throw { code: "too_long" };
    const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    const r = parseJSON(text);
    busy(false); $("#status").hidden = true; return r;
  } catch (e) { busy(false); sayStatus(errText(e), true); throw e; }
}
let manualRes = null;
function askManual(prompt, label) {
  return new Promise((res, rej) => {
    manualRes = { res, rej };
    $("#mLabel").textContent = label; $("#mPrompt").value = prompt; $("#mAnswer").value = ""; $("#mErr").textContent = ""; $("#mCopied").textContent = "";
    $("#manual").hidden = false; $("#mCopy").focus();
  });
}
$("#mCopy").onclick = async () => { const t = $("#mPrompt"); try { await navigator.clipboard.writeText(t.value); $("#mCopied").textContent = "הועתק ✓"; } catch (_) { t.focus(); t.select(); $("#mCopied").textContent = "סומן. העתק ידנית."; } };
$("#mGo").onclick = () => { try { const r = parseJSON($("#mAnswer").value); $("#manual").hidden = true; const m = manualRes; manualRes = null; m && m.res(r); } catch (_) { $("#mErr").textContent = "לא הצלחתי לקרוא את התשובה. ודא שהעתקת את כל התשובה של Claude, כולל הסוגריים { }."; } };
$("#mCancel").onclick = () => { $("#manual").hidden = true; const m = manualRes; manualRes = null; m && m.rej({ code: "cancelled" }); };
function askLocalChoice(prompt, label) {
  return new Promise((res, rej) => {
    openSheet(`<h2>✦ זה צריך את Claude</h2><p>${esc(label)}: החלק הזה דורש הבנה של התסריט, ולכן הוא עובד עם Claude.</p><p class="muted small">אתה במצב ⚡ עצמאי. אפשר להשתמש ב-Claude רק הפעם (העתקה ל-claude.ai והדבקה), או להחליף מצב בהגדרות.</p>
      <div class="row"><button class="btn primary" id="lcGo">✦ השתמש ב-Claude הפעם</button>${CFG.key ? `<button class="btn" id="lcApi">✦ עם מפתח ה-API</button>` : ""}<button class="btn" id="lcNo">ביטול</button></div>`);
    $("#lcGo").onclick = () => { closeSheet(); askManual(prompt, label).then(res, rej); };
    if ($("#lcApi")) $("#lcApi").onclick = () => { closeSheet(); askAPI(prompt, label).then(res, rej); };
    $("#lcNo").onclick = () => { closeSheet(); rej({ code: "cancelled" }); };
  });
}
async function ask(prompt, label) {
  if (CFG.mode === "local") return askLocalChoice(prompt, label);
  if (CFG.mode === "api") {
    if (!CFG.key) { go("settings"); sayStatus("כדי לעבוד במצב אוטומטי צריך להדביק מפתח API.", true); throw { code: "nokey" }; }
    if (!window.Anthropic) { sayStatus("רכיב החיבור ל-Claude לא נטען. בדוק את האינטרנט ורענן.", true); throw { code: "nosdk" }; }
    return askAPI(prompt, label);
  }
  return askManual(prompt, label);
}

/* ================= prompts ================= */
const charList = () => (P.characters || []).map(c => c.name + " (" + c.role + ")").join(", ");
function sceneText(s, numbered) {
  return (s.blocks || []).map((b, i) => (numbered ? i + " " : "") + (b.t === "d" ? `[dialogue: ${b.c}${b.p ? ", " + b.p : ""}] ${b.x}` : `[action] ${b.x}`)).join("\n").slice(0, 7000);
}
function pBreakdown(text, type, w) {
  return `You are an experienced 1st AD and script supervisor preparing a production breakdown for G.Z MOTION LAB, an Israeli director / DP / editor.
FILM TYPE: ${TYPE_DESC[type]}
${TYPE_HINT[type] ? "HINT: " + TYPE_HINT[type] + "\n" : ""}
TASK: Break the INPUT into scenes. The input may be a formatted screenplay, a messy script, or only a loose client brief / idea.
- If it is a brief or idea without real scenes, design a sensible scene/segment structure for this film type and set "inferred": true.
- Use short, consistent location names so the same place is spelled identically in every scene.
- intExt: "INT" | "EXT" | "INT/EXT". time: one of "SUNRISE","MORNING","DAY","SUNSET","EVENING","NIGHT".
- characters: role "lead" (the protagonist, usually one), "supporting" or "extra". In client films real people (CEO, speakers, the bar mitzvah kid, parents, the singer) are characters.
- blocks: the scene text split into action {"t":"a","x":...} and dialogue {"t":"d","c":character name exactly as in characters,"p":optional parenthetical,"x":the line}. Keep dialogue verbatim in its original language. Lightly condense long action. Inferred segments get 1-3 action blocks describing what happens.
- summary: one short Hebrew sentence. estMinutes: realistic minutes to shoot the scene on set including lighting and setup (integer).${type === "mitzvah" ? "\n- BAR/BAT MITZVAH TIME BUDGET: the whole script is shot in ONE day of 4-6 hours (max 6) by an experienced, fast director: a 13-page script takes 4-6 hours. Give every scene estMinutes between 10 and 20 (typically 15). Do not merge or drop scenes to save time." : w && w.days ? `\n- TIME BUDGET: the shoot is planned for ${w.days} day(s) of about ${w.hours} hours each. Size estMinutes so that the whole script fits that time (after setup, meals and location moves); bigger scenes get more, small ones less. Do not drop scenes to save time.` : ""}
- All descriptive text (title, logline, summary, desc) in Hebrew. Keep industry terms (INT/EXT, DAY/NIGHT) in English.
Reply with ONLY JSON in exactly this shape:
{"title":"short Hebrew title","logline":"one Hebrew sentence","inferred":false,"characters":[{"name":"...","role":"lead","desc":"short Hebrew"}],"scenes":[{"n":1,"heading":"INT. LOCATION - DAY","location":"...","intExt":"INT","time":"DAY","summary":"...","characters":["..."],"estMinutes":40,"blocks":[{"t":"a","x":"..."},{"t":"d","c":"...","p":"","x":"..."}]}]}

INPUT:
<<<
${text.slice(0, 60000)}
>>>`;
}
function pShots(s) {
  const creative = ["narrative", "mitzvah", "clip", "promo"].includes(P.type);
  const notes = notesFor("scene", s.id).map(n => "- " + n.text).join("\n");
  return `You are a cinematographer-director planning camera coverage for one scene. Use professional shot language.
FILM TYPE: ${TYPE_DESC[P.type]}
FILM: ${P.title} — ${P.logline || ""}
CHARACTERS: ${charList()}

SCENE ${s.n}: ${s.heading}
Summary: ${s.summary}
In scene: ${(s.characters || []).join(", ")}
Text:
${sceneText(s)}
${notes ? "Director's notes for this scene:\n" + notes + "\n" : ""}
${isMitz() ? `Plan 2-4 shots that cover the scene within its ${s.estMinutes || sceneBudget()}-minute budget (all shot minutes together must not exceed it). Lean, fast coverage: quick setups, handheld or gimbal where it helps, no complex rigs; the most important moment gets the best shot.` : budgeted() ? `Plan ${shotCountHint(s.estMinutes || sceneBudget())} shots that cover the scene within its ${s.estMinutes || sceneBudget()}-minute budget (all shot minutes together must not exceed it), ordered by camera setup, the way you would shoot them.` : "Plan 3-8 shots that cover the scene efficiently on set (order them by camera setup, the way you would shoot them)."}${budgetRules()}
- size: one of EWS, WS, FS, MS, 2-SHOT, OTS, MCU, CU, ECU, INSERT
- angle: eye | low | high | overhead | dutch
- move: static | push-in | pull-out | pan-left | pan-right | tilt-up | tilt-down | tracking | handheld | crane | orbit
- lens: e.g. "35mm"
- desc: what we see, one Hebrew sentence. purpose: the dramatic or editorial reason, short Hebrew.
- minutes: realistic shooting minutes for this shot including setup (integer).
- figures: people in frame for a stick-figure storyboard, max 3: [{"name": character name, "x": 0-100 horizontal position measured from the LEFT edge of frame}]. Empty for inserts and pure landscapes.
- prop: optional short Hebrew label of a key object in frame, else "".
${creative ? `- Mark 1-2 shots "creative": true: original, cinematic ideas that lift the scene (avoid clichés).
- "ideas": 2-3 original Hebrew ideas for staging, a visual motif or a moment that would make this scene memorable.` : `- Include detail / b-roll coverage useful for the edit.
- "ideas": 2-3 practical Hebrew tips for shooting this segment well (light, sound, people, timing).`}
Reply with ONLY JSON: {"shots":[{"size":"MS","angle":"eye","move":"static","lens":"35mm","desc":"...","purpose":"...","minutes":10,"figures":[{"name":"...","x":50}],"prop":"","creative":false}],"ideas":["..."]}`;
}
function pTransitions() {
  const rows = P.scenes.map(s => {
    const sh = (s.shots || []).filter(x => x.status !== "cut");
    return `${s.n} | ${s.heading} | ${s.summary} | first shot: ${sh[0] ? sh[0].size + " " + sh[0].desc : "-"} | last shot: ${sh.length ? sh[sh.length - 1].size + " " + sh[sh.length - 1].desc : "-"}`;
  }).join("\n");
  return `You are a film editor. For each pair of consecutive scenes in story order, suggest one smart transition that makes the cut connect: match cut, graphic match, motion continuation, sound bridge, J-cut, L-cut, recurring object, whip pan, light or color match, and so on. Use a plain dissolve only when it is truly best.${isMitz() ? " This is a fast one-day Bar/Bat Mitzvah shoot: prefer transitions that need at most one quick extra shot (an insert or a few seconds of sound)." : budgeted() ? " The shoot has a fixed time budget: prefer transitions that need little or no extra shooting time." : ""}
For each, add "shoot": what the crew must remember to capture on set so the transition works (Hebrew, short).
FILM TYPE: ${TYPE_DESC[P.type]}
FILM: ${P.title} — ${P.logline || ""}
SCENES (n | heading | summary | first shot | last shot):
${rows}
Reply with ONLY JSON: {"transitions":[{"from":1,"to":2,"type":"Match Cut","idea":"Hebrew explanation","shoot":"Hebrew"}]}`;
}
function pMust() {
  const rows = P.scenes.map(s => `${s.n}. ${s.heading} — ${s.summary}`).join("\n");
  return `You are an experienced producer and director of this kind of film: ${TYPE_DESC[P.type]}.
Write a practical "Must-Shoot" checklist for the shoot, based on the breakdown below. Group it using groups like: ${MUST_GROUPS[P.type]}.
Each item: concrete and short, in Hebrew. priority "must" or "nice". 12-28 items in total.${budgetRules("Mark as \"must\" only what fits the day; the rest is \"nice\".")}
FILM: ${P.title} — ${P.logline || ""}
PEOPLE: ${P.characters.map(c => c.name).join(", ")}
SCENES:
${rows}
Reply with ONLY JSON: {"groups":[{"name":"English group name","items":[{"text":"...","priority":"must"}]}]}`;
}
function pUpgrade(s, tone) {
  const i = P.scenes.indexOf(s), next = P.scenes[i + 1];
  const toneName = (TONES.find(t => t[0] === tone) || TONES[0])[1];
  return `You are a top creative director and script doctor working with G.Z MOTION LAB. Suggest ways to upgrade ONE scene. Requested tone: ${tone} (${toneName}).
FILM TYPE: ${TYPE_DESC[P.type]}
FILM: ${P.title} — ${P.logline || ""}
CHARACTERS: ${charList()}

SCENE ${s.n}: ${s.heading}
Summary: ${s.summary}
Numbered lines:
${sceneText(s, true)}
NEXT SCENE: ${next ? next.n + ". " + next.heading + " — " + next.summary : "none (this is the last scene)"}

${budgetRules("Every suggestion must be shootable inside the scene's budget, at most about 5 extra minutes; prefer upgrades that cost no time: a sharper line, a smarter angle, a prop, a sound idea.")}Give 4-6 specific suggestions that fit the tone, mixing these kinds:
- "punch": a sharper / funnier / more emotional version of ONE existing line. apply: {"type":"replace_line","index":<line number>,"text":"the new line","speaker":"character name, or empty for action"}
- "add": a new short moment (1-3 lines) to insert. apply: {"type":"add_lines","after":<line number, or -1 for the start>,"lines":[{"t":"a" or "d","c":"character name or empty","x":"..."}]}
- "shot": an original creative shot. apply: {"type":"add_shot","shot":{"size":"CU","angle":"low","move":"push-in","lens":"50mm","desc":"Hebrew","purpose":"Hebrew","minutes":10,"figures":[{"name":"...","x":50}],"prop":""}}
- "structure": a structural change (opening, ending, order, pacing) explained in words. apply: null
- "transition": a transition into the next scene (skip if there is none). apply: {"type":"transition","name":"Match Cut","idea":"Hebrew","shoot":"what to capture on set, Hebrew"}
title: 2-4 Hebrew words. text: what and why, 1-2 Hebrew sentences. Keep new dialogue in the script's language. Avoid clichés; be specific to this scene and these characters.
Reply with ONLY JSON: {"suggestions":[{"kind":"punch","title":"...","text":"...","apply":{...}}]}`;
}
function pWhisky(day) {
  const lines = [];
  day.scenes.forEach(s => {
    lines.push(`Scene ${s.n} (${s.heading}): ${s.summary}`);
    s.shots.forEach(x => lines.push(`  ${x.code} ${x.size} ${x.move} — ${x.desc} [${x.status}]${shotFlagsText(x)}`));
  });
  const notes = (P.notes || []).filter(n => !n.done).map(n => "- " + n.text).join("\n");
  return `You are an experienced 1st AD and director at the end of a shoot day. "Whisky shot" = the last shot of the day, the last chance to grab what is missing before wrapping.
FILM TYPE: ${TYPE_DESC[P.type]}
FILM: ${P.title} — ${P.logline || ""}
TODAY (scenes and shots with status):
${lines.join("\n")}
OPEN NOTES:
${notes || "none"}
${budgetRules("Only quick grabs: each suggestion should take 2-5 minutes.")}Suggest only what is clearly useful before wrap (3-7 items): forgotten coverage (wides, cutaways, inserts, establishing), sound (room tone, wild tracks, pickup lines), narration / voice-over lines worth recording now, inserts or effects that will help the edit. Do not repeat flagged sound pickups or open notes, they are listed separately. Hebrew.
Reply with ONLY JSON: {"items":[{"kind":"shot","title":"...","text":"..."}]} where kind is one of shot, sound, vo, insert, other.`;
}

/* ================= quick local breakdown (no AI) =================
   Reads a formatted script: scene headings (INT./EXT., פנים/חוץ, "סצנה 3"), character cues and
   "NAME: line" dialogue. Instant, free and offline. Creative work (shots, ideas) stays with Claude. */
const TIME_WORDS = [
  [/\b(night|לילה|ליל)\b|לילה/i, "NIGHT"], [/\b(evening|dusk)\b|ערב|בין ערביים/i, "EVENING"], [/\b(sunset)\b|שקיעה/i, "SUNSET"],
  [/\b(sunrise|dawn)\b|זריחה|שחר/i, "SUNRISE"], [/\b(morning)\b|בוקר/i, "MORNING"], [/\b(day|noon|afternoon)\b|יום|צהריים|צהרים/i, "DAY"]];
const HEAD_RE = /^\s*(?:\d+[A-Za-z]?\s*[.)\-:]?\s*)?(?:(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\/E|INT|EXT)\b\.?|(פנים\s*\/\s*חוץ|חוץ\s*\/\s*פנים|פנים|חוץ)(?=[\s.,:\-–—\/]|$)|(scene|סצנה|סצינה|תמונה)\s*\d+)/i;
function isHeading(line) { const t = line.trim(); return t.length > 2 && t.length < 110 && HEAD_RE.test(t); }
function parseHeading(line) {
  const t = line.trim(); let ie = "INT";
  if (/INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\/E|פנים\s*\/\s*חוץ|חוץ\s*\/\s*פנים/i.test(t)) ie = "INT/EXT";
  else if (/\bEXT\b|חוץ/i.test(t)) ie = "EXT";
  let time = "DAY"; for (const [re, v] of TIME_WORDS) if (re.test(t)) { time = v; break; }
  let loc = t.replace(HEAD_RE, " ")
    .replace(/\b(DAY|NIGHT|MORNING|EVENING|SUNSET|SUNRISE|DAWN|DUSK|NOON|AFTERNOON|CONTINUOUS|LATER|SAME)\b/gi, " ")
    .replace(/(^|[\s.,:\-–—\/])(יום|לילה|בוקר|ערב|שקיעה|זריחה|צהריים|צהרים|שחר|המשך|מאוחר יותר)(?=$|[\s.,:\-–—\/])/g, " ")
    .replace(/(^|[\s.,:\-–—\/])(פנים|חוץ|INT|EXT|I\/E)(?=$|[\s.,:\-–—\/])/gi, " ")
    .replace(/^[\s.,:\-–—\/\d]+|[\s.,:\-–—\/]+$/g, "").replace(/\s{2,}/g, " ").trim();
  return { intExt: ie, time, location: loc || "לוקיישן", heading: t };
}
const NAME_COLON = /^\s*([^\s:.,!?"״'()][^:.,!?"״]{0,24}?)\s*(?:\(([^)]{1,40})\))?\s*:\s*(.+)$/;
function isCueLine(t) { return t.length > 0 && t.length <= 26 && t.split(/\s+/).length <= 3 && !/[.!?,:;"״]$/.test(t) && !/^\(.*\)$/.test(t) && !isHeading(t); }
function localBreakdown(raw, type) {
  const lines = String(raw || "").replace(/\r/g, "").split("\n");
  // candidate cue names: short lines followed by text, or "NAME:" prefixes
  const freq = {};
  lines.forEach((l, i) => { const t = l.trim(); const nx = (lines[i + 1] || "").trim();
    if (isCueLine(t) && nx && !isHeading(nx)) { const k = t.replace(/\s*\(.*\)$/, "").replace(/\s*(V\.O\.|O\.S\.|O\.C\.|CONT'D|\(המשך\))\s*$/i, "").trim(); freq[k] = (freq[k] || 0) + 1; }
    const m = t.match(NAME_COLON); if (m && !isHeading(t)) freq[m[1].trim()] = (freq[m[1].trim()] || 0) + 1; });
  const isUpper = t => /[A-Z]/.test(t) && t === t.toUpperCase();
  const names = new Set(Object.keys(freq).filter(k => freq[k] >= 2 || isUpper(k)));
  // scripts written as "NAME: line" — once that format is clear, accept every short colon name
  const colon = lines.map(l => l.trim().match(NAME_COLON)).filter(m => m && m[1].trim().split(/\s+/).length <= 3);
  if (colon.length >= 2) colon.forEach(m => names.add(m[1].trim()));
  const scenes = []; let cur = null; let title = "";
  const pushAct = x => { const last = cur.blocks[cur.blocks.length - 1]; if (last && last.t === "a" && !last.br) last.x += " " + x; else cur.blocks.push({ t: "a", c: "", p: "", x }); };
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (isHeading(t)) { const h = parseHeading(t); cur = { ...h, blocks: [] }; scenes.push(cur); continue; }
    if (!cur) { if (t && !title && t.length < 60) title = t; continue; }
    if (!t) { const last = cur.blocks[cur.blocks.length - 1]; if (last) last.br = true; continue; }
    const m = t.match(NAME_COLON);
    if (m && names.has(m[1].trim())) { cur.blocks.push({ t: "d", c: m[1].trim(), p: m[2] || "", x: m[3].trim() }); continue; }
    const cue = t.replace(/\s*\(.*\)$/, "").replace(/\s*(V\.O\.|O\.S\.|O\.C\.|CONT'D|\(המשך\))\s*$/i, "").trim();
    if (isCueLine(t) && names.has(cue)) {
      const b = { t: "d", c: cue, p: (t.match(/\(([^)]+)\)\s*$/) || [])[1] || "", x: "" }; let j = i + 1;
      while (j < lines.length) { const u = lines[j].trim(); if (!u || isHeading(u)) break; const um = u.match(NAME_COLON); if ((isCueLine(u) && names.has(u)) || (um && names.has(um[1].trim()))) break;
        if (/^\(.*\)$/.test(u) && !b.x) b.p = u.slice(1, -1); else b.x += (b.x ? " " : "") + u; j++; }
      if (b.x) { cur.blocks.push(b); i = j - 1; continue; }
    }
    pushAct(t);
  }
  if (!scenes.length) return null;
  const count = {}; scenes.forEach(sc => sc.blocks.forEach(b => { if (b.t === "d") count[b.c] = (count[b.c] || 0) + 1; }));
  const sorted = Object.keys(count).sort((a, b) => count[b] - count[a]);
  const chars = sorted.map((n, i) => ({ name: n, role: i === 0 ? "lead" : count[n] >= 2 ? "supporting" : "extra", desc: "" }));
  const per = type === "mitzvah" ? 15 : 0;
  const out = scenes.map((sc, i) => {
    const words = sc.blocks.reduce((a, b) => a + b.x.split(/\s+/).length, 0);
    const speakers = [...new Set(sc.blocks.filter(b => b.t === "d").map(b => b.c))];
    const mentioned = sorted.filter(n => !speakers.includes(n) && sc.blocks.some(b => b.t === "a" && b.x.includes(n)));
    const firstAct = (sc.blocks.find(b => b.t === "a") || sc.blocks[0] || { x: "" }).x;
    const summary = firstAct.length > 80 ? firstAct.slice(0, 78).replace(/\s+\S*$/, "") + "…" : firstAct;
    return newScene({ n: i + 1, heading: sc.heading, location: sc.location, intExt: sc.intExt, time: sc.time, summary: summary || sc.location,
      characters: speakers.concat(mentioned), estMinutes: per || clamp(Math.round(15 + words * 0.35), 10, 120),
      blocks: sc.blocks.map(b => ({ t: b.t, c: b.c, p: b.p, x: b.x })) });
  });
  return { title: title || "פרויקט חדש", chars, scenes: out };
}
/* basic coverage without AI: master, singles for speakers, a two-shot and an insert */
function quickShots(s) {
  const sp = [...new Set(s.blocks.filter(b => b.t === "d").map(b => b.c))];
  const who = sp.length ? sp : (s.characters || []).slice(0, 2);
  const list = [{ size: /EXT/.test(s.intExt) ? "EWS" : "WS", angle: "eye", move: "static", lens: "24mm", desc: "מאסטר של " + s.location, purpose: "Establishing ומאסטר לכל הסצנה", figures: who.slice(0, 3).map((n, i, a) => ({ name: n, x: a.length === 1 ? 50 : 30 + i * (40 / Math.max(1, a.length - 1)) })) }];
  if (who.length >= 2) list.push({ size: "2-SHOT", angle: "eye", move: "static", lens: "35mm", desc: who[0] + " ו" + who[1], purpose: "היחסים בין הדמויות", figures: [{ name: who[0], x: 38 }, { name: who[1], x: 62 }] });
  who.slice(0, 3).forEach((n, i) => list.push({ size: sp.includes(n) ? "MCU" : "MS", angle: "eye", move: "static", lens: "50mm", desc: (sp.includes(n) ? "קלוז על " : "") + n, purpose: sp.includes(n) ? "הדיאלוג והתגובות" : "הפעולה", figures: [{ name: n, x: i % 2 ? 62 : 40 }] }));
  if (!who.length) list.push({ size: "MS", angle: "eye", move: "handheld", lens: "35mm", desc: "הפעולה בסצנה", purpose: "כיסוי", figures: [] });
  list.push({ size: "INSERT", angle: "high", move: "static", lens: "100mm", desc: "פרט מהסצנה", purpose: "לעריכה", figures: [], prop: "פרט" });
  const budget = s.estMinutes || 30; const each = Math.max(3, Math.floor(budget / list.length));
  return list.map(x => Object.assign(x, { minutes: each }));
}

/* ================= normalize ================= */
function normBreakdown(r) {
  const chars = (Array.isArray(r.characters) ? r.characters : []).filter(c => c && c.name).map(c => ({ name: String(c.name), role: ["lead", "supporting", "extra"].includes(c.role) ? c.role : "supporting", desc: c.desc || "" }));
  const scenes = (Array.isArray(r.scenes) ? r.scenes : []).map((s, i) => newScene({
    n: i + 1, heading: s.heading || "", location: (s.location || "").trim() || "לוקיישן", intExt: String(s.intExt || "INT").toUpperCase(), time: String(s.time || "DAY").toUpperCase(),
    summary: s.summary || "", characters: Array.isArray(s.characters) ? s.characters.map(String) : [], estMinutes: Math.max(5, parseInt(s.estMinutes) || 30),
    blocks: (Array.isArray(s.blocks) ? s.blocks : []).filter(b => b && b.x).map(b => ({ t: b.t === "d" ? "d" : "a", c: b.c || "", p: b.p || "", x: String(b.x) }))
  }));
  return { chars, scenes };
}
function newScene(o) { return Object.assign({ id: uid(), n: 1, heading: "", location: "", intExt: "INT", time: "DAY", summary: "", characters: [], estMinutes: 30, blocks: [], shots: [], ideas: [], status: "left", day: 0, dirty: false, ai: null }, o); }
function normShot(x, code) {
  return {
    id: uid(), code, size: x.size || "MS", angle: x.angle || "eye", move: x.move || "static", lens: x.lens || "",
    desc: x.desc || "", purpose: x.purpose || "", minutes: Math.max(2, parseInt(x.minutes) || 10),
    figures: (Array.isArray(x.figures) ? x.figures : []).slice(0, 3).map(f => ({ name: String(f.name || ""), x: clamp(+f.x || 50, 5, 95) })),
    prop: x.prop || "", creative: !!x.creative, status: "left", refs: [], flags: {}
  };
}
function recode(s) { s.shots.forEach((x, i) => x.code = s.n + String.fromCharCode(65 + (i % 26))); }
function renumber() { P.scenes.forEach((s, i) => { s.n = i + 1; recode(s); }); }

/* ================= storyboard ================= */
const PAL_APP = { ink: "var(--ink)", muted: "var(--muted)", line: "var(--line)", accent: "var(--amber)", bg: "var(--left-bg)", fg2: "var(--card)" };
const PAL_PRINT = { ink: "#0b1828", muted: "#52677d", line: "#c9d6e3", accent: "#c4741a", bg: "#f1f5f9", fg2: "#dde6ef" };
function sizeKey(s) {
  s = String(s || "").toUpperCase();
  if (/INSERT/.test(s)) return "INSERT"; if (/OTS|OVER/.test(s)) return "OTS"; if (/ECU|EXTREME CLOSE/.test(s)) return "ECU"; if (/MCU|MEDIUM CLOSE/.test(s)) return "MCU";
  if (/\bCU\b|CLOSE/.test(s)) return "CU"; if (/EWS|EXTREME WIDE|\bLS\b|ESTAB/.test(s)) return "WS"; if (/MWS|FS|FULL/.test(s)) return "FS"; if (/WS|WIDE/.test(s)) return "WS"; return "MS";
}
function angKey(a) { a = String(a || "").toLowerCase(); return /low/.test(a) ? "low" : /over|top|bird/.test(a) ? "overhead" : /high/.test(a) ? "high" : /dutch|cant/.test(a) ? "dutch" : "eye"; }
function moveKey(m) {
  m = String(m || "").toLowerCase();
  if (/push|dolly.?in|zoom.?in/.test(m)) return "push"; if (/pull|dolly.?out|zoom.?out/.test(m)) return "pull"; if (/pan.?l/.test(m)) return "pan-l"; if (/pan/.test(m)) return "pan-r";
  if (/tilt.?d/.test(m)) return "tilt-d"; if (/tilt/.test(m)) return "tilt-u"; if (/track|truck|follow|steadi|gimbal/.test(m)) return "track"; if (/hand/.test(m)) return "hand";
  if (/crane|jib|drone|ped/.test(m)) return "crane"; if (/orbit|arc/.test(m)) return "orbit"; return "static";
}
const ANG_LABEL = { eye: "Eye level", low: "Low angle", high: "High angle", overhead: "Overhead", dutch: "Dutch" };
const FIG = { WS: { r: 3.5, hy: 46, body: 14, leg: 11 }, FS: { r: 6, hy: 16, body: 30, leg: 27 }, MS: { r: 11, hy: 30, body: 50, leg: 0 }, MCU: { r: 17, hy: 38, body: 60, leg: 0 }, CU: { r: 26, hy: 47, body: 60, leg: 0 } };
function stick(x, k, name, C) {
  if (k === "ECU") return `<circle cx="${x}" cy="62" r="62"/><circle cx="${x - 20}" cy="42" r="6"/><circle cx="${x + 20}" cy="42" r="6"/><path d="M${x - 30} 30 q10 -6 20 0 M${x + 10} 30 q10 -6 20 0"/>`;
  const { r, hy, body, leg } = FIG[k] || FIG.MS, ny = hy + r, by = ny + body;
  let g = `<circle cx="${x}" cy="${hy}" r="${r}"/><line x1="${x}" y1="${ny}" x2="${x}" y2="${by}"/>`;
  const aw = (k === "WS" || k === "FS") ? r * 1.7 : r * 1.6;
  if (k === "CU" || k === "MCU") g += `<path d="M${x - aw} ${by} Q${x - aw} ${ny + r * .6} ${x} ${ny + r * .4} Q${x + aw} ${ny + r * .6} ${x + aw} ${by}"/>`;
  else g += `<line x1="${x - aw}" y1="${ny + body * .55}" x2="${x}" y2="${ny + body * .2}"/><line x1="${x + aw}" y1="${ny + body * .55}" x2="${x}" y2="${ny + body * .2}"/>`;
  if (leg) g += `<line x1="${x}" y1="${by}" x2="${x - r * 1.2}" y2="${by + leg}"/><line x1="${x}" y1="${by}" x2="${x + r * 1.2}" y2="${by + leg}"/>`;
  const ty = (k === "WS" || k === "FS") ? hy - r - 3 : Math.min(86, hy + r + 9);
  if (name) g += `<text x="${x}" y="${ty}" text-anchor="middle" stroke="none" fill="${C.muted}" font-size="${k === "WS" ? 5.5 : 6.5}" font-family="Assistant,Arial,sans-serif">${esc(name)}</text>`;
  return g;
}
const ARROWS = {
  push: "M92 80 L68 80 M72 77 L68 80 L72 83 M92 77 L92 83", pull: "M68 80 L92 80 M88 77 L92 80 L88 83 M68 77 L68 83",
  "pan-l": "M112 9 L48 9 M52 6 L48 9 L52 12", "pan-r": "M48 9 L112 9 M108 6 L112 9 L108 12",
  "tilt-u": "M152 68 L152 20 M149 24 L152 20 L155 24", "tilt-d": "M152 20 L152 68 M149 64 L152 68 L155 64",
  track: "M40 84 L120 84 M116 81 L120 84 L116 87 M44 81 L40 84 L44 87", hand: "M56 83 q4 -5 8 0 t8 0 t8 0 t8 0 t8 0 t8 0",
  crane: "M151 72 L151 16 M148 20 L151 16 L154 20 M146 72 L156 72", orbit: "M112 78 Q80 92 48 78 M53 76 L48 78 L52 83"};
let fid = 0, fpre = "sb";
function frame(shot, C) {
  const k = sizeKey(shot.size), a = angKey(shot.angle), m = moveKey(shot.move), id = fpre + (++fid);
  const hz = { eye: 58, low: 77, high: 22, dutch: 58, overhead: null }[a];
  let figs = (shot.figures || []).slice(0, 3).map(f => ({ x: 8 + (clamp(+f.x || 50, 0, 100) / 100) * 144, name: f.name }));
  let fg = "", inner = "";
  if (k === "INSERT") {
    inner = `<rect x="48" y="26" width="64" height="38" rx="3" fill="none" stroke="${C.accent}" stroke-width="1.4"/><text x="80" y="49" text-anchor="middle" font-size="8" fill="${C.ink}" font-family="Assistant,Arial,sans-serif">${esc(shot.prop || "INSERT")}</text>`;
  } else {
    if (k === "OTS" && figs.length) {
      const subj = figs[0], fx = subj.x >= 80 ? 18 : 142;
      fg = `<g fill="${C.fg2}" stroke="${C.muted}" stroke-width="1"><circle cx="${fx}" cy="44" r="24"/><path d="M${fx - 40} 92 Q${fx - 38} 64 ${fx} 62 Q${fx + 38} 64 ${fx + 40} 92 Z"/></g>`;
      if (figs[1]) fg += `<text x="${fx}" y="86" text-anchor="middle" font-size="6.5" fill="${C.muted}" font-family="Assistant,Arial,sans-serif">${esc(figs[1].name)}</text>`;
      figs = [subj];
    }
    const kk = k === "OTS" ? "MCU" : k;
    if (kk === "ECU" && figs.length > 1) figs = [figs[0]];
    inner = `<g filter="url(#w${id})" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round">${figs.map(f => stick(f.x, kk, kk === "ECU" ? "" : f.name, C)).join("")}</g>`;
    if (kk === "ECU" && figs[0]) inner += `<text x="${figs[0].x}" y="86" text-anchor="middle" font-size="6.5" fill="${C.muted}" font-family="Assistant,Arial,sans-serif">${esc(figs[0].name)}</text>`;
    if (shot.prop) inner += `<text x="150" y="84" text-anchor="end" font-size="6" fill="${C.accent}" font-family="Assistant,Arial,sans-serif">◆ ${esc(shot.prop)}</text>`;
  }
  const horizon = hz == null ? `<text x="80" y="10" text-anchor="middle" font-size="6" fill="${C.muted}" font-family="IBM Plex Mono,monospace">TOP VIEW</text>` : `<line x1="-20" y1="${hz}" x2="180" y2="${hz}" stroke="${C.muted}" stroke-width=".8" stroke-dasharray="3 2"/>`;
  const content = horizon + fg + inner;
  return `<svg class="sb" viewBox="0 0 160 90" role="img" aria-label="${esc(shot.size + " " + shot.angle + " " + shot.move)}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="c${id}"><rect width="160" height="90"/></clipPath><filter id="w${id}"><feTurbulence baseFrequency=".05" numOctaves="2" seed="${fid % 9 + 1}"/><feDisplacementMap in="SourceGraphic" scale="1.5"/></filter></defs>
<rect width="160" height="90" fill="${C.bg}"/><g clip-path="url(#c${id})"><g stroke="${C.line}" stroke-width=".5"><line x1="53.3" y1="0" x2="53.3" y2="90"/><line x1="106.6" y1="0" x2="106.6" y2="90"/><line x1="0" y1="30" x2="160" y2="30"/><line x1="0" y1="60" x2="160" y2="60"/></g>
${a === "dutch" ? `<g transform="rotate(-11 80 45)">${content}</g>` : content}
${ARROWS[m] ? `<path d="${ARROWS[m]}" stroke="${C.accent}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : ""}</g>
<rect x=".5" y=".5" width="159" height="89" fill="none" stroke="${C.ink}" stroke-width="1"/><text x="4" y="87" font-size="6.5" font-family="IBM Plex Mono,monospace" fill="${C.accent}">${esc(shot.code)}</text></svg>`;
}

/* ================= schedule ================= */
const RANK = { SUNRISE: 0, MORNING: 1, DAY: 2, SUNSET: 3, EVENING: 4, NIGHT: 5 };
const liveShots = s => (s.shots || []).filter(x => x.status !== "cut");
function sceneMin(s) { return s.shots && s.shots.length ? liveShots(s).reduce((a, x) => a + (+x.minutes || 0), 0) : (+s.estMinutes || 30); }
function toMin(t) { const [h, m] = (t || "07:00").split(":").map(Number); return h * 60 + (m || 0); }
function hhmm(t) { t = ((Math.round(t) % 1440) + 1440) % 1440; return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); }
/* Time budget. Bar/Bat Mitzvah: one fast day, max 6h, 10-20 min per scene.
   Other types: the director sets shoot days x hours per day, and everything is fitted to it. */
const MITZ = { maxH: 6, setup: 20, move: 15, min: 10, max: 20 };
const isMitz = p => !!(p || P) && (p || P).type === "mitzvah";
const hoursOpts = type => type === "mitzvah" ? [4, 5, 6] : [4, 5, 6, 8, 10, 12];
const budgeted = p => !!(p || P) && (isMitz(p) || +(p || P).days > 0);
function timeCfg() { return isMitz() ? { setup: MITZ.setup, move: MITZ.move, meal: false } : { setup: SETUP, move: MOVE, meal: true }; }
const sceneRange = () => isMitz() ? [MITZ.min, MITZ.max] : [5, 120];
const planDays = () => isMitz() ? 1 : Math.max(1, +P.days || 1);
const planHours = () => isMitz() ? Math.min(+P.hours || 6, MITZ.maxH) : (+P.hours || 8);
function availMin() {
  const tc = timeCfg(), D = planDays(), H = planHours();
  const live = P.scenes.filter(s => s.status !== "cut");
  const locs = new Set(live.map(s => normLoc(s.location))).size;
  const meal = tc.meal && H >= 6 ? MEAL : 0;
  return D * (H * 60 - tc.setup - meal) - Math.max(0, locs - D) * tc.move;
}
function sceneBudget() { const n = P.scenes.filter(s => s.status !== "cut").length || 1; const [a, b] = sceneRange(); return clamp(Math.floor(availMin() / n), a, b); }
function fitShots(s) {
  if (!budgeted()) return;
  const b = s.estMinutes || sceneBudget(); const live = liveShots(s); const sum = live.reduce((a, x) => a + (+x.minutes || 0), 0);
  if (sum > b) { const f = b / sum; live.forEach(x => x.minutes = Math.max(2, Math.floor(x.minutes * f))); }
}
function fitPlan() {
  if (!budgeted()) return;
  if (isMitz()) { P.hours = Math.min(+P.hours || 6, MITZ.maxH); P.days = 1; }
  const live = P.scenes.filter(s => s.status !== "cut"); if (!live.length) return;
  const [a, b] = sceneRange();
  live.forEach(s => s.estMinutes = clamp(Math.round(+s.estMinutes || 15), a, b));
  const avail = availMin(); const total = live.reduce((x, s) => x + s.estMinutes, 0);
  if (total > avail) { const f = avail / total; live.forEach(s => s.estMinutes = Math.max(a, Math.round(s.estMinutes * f))); }
  live.forEach(fitShots);
}
function budgetRules(extra) {
  if (!budgeted()) return "";
  const n = P.scenes.length, per = n ? sceneBudget() : 15;
  if (isMitz()) return `\nTIME BUDGET (very important): this Bar/Bat Mitzvah film is shot in ONE day of at most ${planHours()} hours including setup and moves${n ? `; ${n} scenes means about ${per} minutes per scene` : ""} (every scene 10-20 minutes). The director has done many of these and works fast. ${extra || ""}\n`;
  return `\nTIME BUDGET (important): the shoot is planned for ${planDays()} day(s) of about ${planHours()} hours each, about ${availMin()} minutes of actual shooting after setup, meals and moves${n ? `; ${n} scenes means about ${per} minutes per scene on average (bigger scenes may get more, small ones less)` : ""}. Fit everything to this budget. ${extra || ""}\n`;
}
const shotCountHint = m => m <= 20 ? "2-4" : m <= 45 ? "3-6" : "3-8";
/* what is still left to shoot: Left = full time, Partial = half, Shot = nothing */
function remMin(s) {
  if (s.status === "cut") return 0;
  if (s.shots && s.shots.length) return liveShots(s).reduce((a, x) => a + (x.status === "shot" ? 0 : x.status === "part" ? Math.ceil((+x.minutes || 0) / 2) : (+x.minutes || 0)), 0);
  return s.status === "shot" ? 0 : s.status === "part" ? Math.ceil((+s.estMinutes || 30) / 2) : (+s.estMinutes || 30);
}
const hasProgress = () => P && P.scenes.some(s => s.status === "shot" || s.status === "part" || (s.shots || []).some(x => x.status === "shot" || x.status === "part"));
function schedule(opts = {}) {
  const R = !!opts.remaining;
  const mins = s => R ? remMin(s) : sceneMin(s);
  const tc = Object.assign(timeCfg(), { oneDay: budgeted() && planDays() === 1 && !R });
  const cap = (+P.hours || 6) * 60;
  const live = P.scenes.filter(s => s.status !== "cut" && (!R || remMin(s) > 0));
  const first = {}, hasExt = {};
  live.forEach((s, i) => { const L = normLoc(s.location); if (!(L in first)) first[L] = i; if (/EXT/.test(s.intExt)) hasExt[L] = true; });
  const rank = s => RANK[s.time] ?? 2;
  const order = (a, b) => rank(a) - rank(b) || (hasExt[normLoc(a.location)] ? 0 : 1) - (hasExt[normLoc(b.location)] ? 0 : 1) || first[normLoc(a.location)] - first[normLoc(b.location)] || (/EXT/.test(a.intExt) ? 0 : 1) - (/EXT/.test(b.intExt) ? 0 : 1) || a.n - b.n;
  const days = [{ scenes: [] }]; let used = tc.setup, last = null;
  for (const s of live.filter(s => !s.day).sort(order)) {
    const L = normLoc(s.location), m = mins(s), mv = (last && last !== L) ? tc.move : 0;
    if (!tc.oneDay && days[days.length - 1].scenes.length && used + mv + m > cap) { days.push({ scenes: [] }); used = tc.setup; last = null; }
    used += mv + m; days[days.length - 1].scenes.push(s); last = L;
  }
  if (!R) live.filter(s => s.day).sort(order).forEach(s => { while (days.length < s.day) days.push({ scenes: [] }); days[s.day - 1].scenes.push(s); });
  const call = toMin(P.call);
  days.forEach((d, i) => {
    d.n = i + 1; let t = call, work = tc.setup, lastL = null, meal = !tc.meal || (+P.hours < 6); d.items = [{ kind: "call", t, m: tc.setup }]; t += tc.setup;
    for (const s of d.scenes) {
      const L = normLoc(s.location), m = mins(s);
      if (!meal && work >= cap / 2) { d.items.push({ kind: "meal", t, m: MEAL }); t += MEAL; meal = true; }
      if (lastL !== L) { d.items.push({ kind: "loc", t, m: lastL ? tc.move : 0, loc: s.location, ie: s.intExt, time: s.time }); if (lastL) { t += tc.move; work += tc.move; } }
      d.items.push({ kind: "scene", s, t, m }); t += m; work += m; lastL = L;
    }
    d.wrap = t; d.work = work;
  });
  return days.filter(d => d.scenes.length || d.n === 1);
}
function progressOf(scenes) {
  let total = 0, done = 0, cut = 0, nShots = 0, nDone = 0;
  scenes.forEach(s => {
    if (s.shots && s.shots.length) s.shots.forEach(x => { const m = +x.minutes || 0; if (s.status === "cut" || x.status === "cut") { cut += m; return; } total += m; nShots++; if (x.status === "shot") { done += m; nDone++; } else if (x.status === "part") done += m / 2; });
    else { const m = +s.estMinutes || 30; if (s.status === "cut") { cut += m; return; } total += m; nShots++; if (s.status === "shot") { done += m; nDone++; } else if (s.status === "part") done += m / 2; }
  });
  return { total, done: Math.round(done), cut, pct: total ? Math.round(done / total * 100) : 0, nShots, nDone };
}
function remindersFor(n) { return (P.transitions || []).filter(t => (t.from === n || t.to === n) && t.shoot).map(t => `${t.type} ${t.from}→${t.to}: ${t.shoot}`); }
function shotFlagsText(x) { const f = x.flags || {}; const a = []; if (f.sound) a.push("bad sound"); if (f.nomic) a.push("no mic for actor"); if (f.later) a.push("finish later"); return a.length ? " (flags: " + a.join(", ") + ")" : ""; }

/* ================= notes ================= */
function notesFor(scope, ref) { return (P.notes || []).filter(n => n.scope === scope && n.ref === ref); }
function noteCount(scope, ref) { return notesFor(scope, ref).filter(n => !n.done).length; }
function notesContext() {
  const v = ui.view;
  if (v === "script" && ui.sub === "chars" && ui.char) return ["char", ui.char, "הערות לדמות"];
  if (v === "script" && ui.sub === "locs" && ui.loc) return ["loc", ui.loc, "הערות ללוקיישן"];
  if ((v === "script" || v === "ai") && curScene()) return ["scene", curScene().id, "הערות לסצנה " + curScene().n];
  if (v === "shots" && shScene()) return ["scene", shScene().id, "הערות לסצנה " + shScene().n];
  if (v === "plan" || v === "set" || v === "whisky") return ["day", String(ui.setDay || 1), "הערות ליום " + (ui.setDay || 1)];
  if (P && P.scenes.length) return ["project", "p", "הערות לפרויקט"];
  return null;
}
function notesPane() {
  const c = notesContext(); if (!c || !P) return "";
  const [scope, ref, title] = c;
  const list = notesFor(scope, ref);
  return `<aside class="notes-pane" aria-label="${esc(title)}"><h3>📝 ${esc(title)}</h3>
    ${list.map(n => noteHTML(n)).join("") || '<p class="muted small">עוד אין הערות כאן.</p>'}
    <div class="quick">${NOTE_CATS.map(([k, ic, l]) => `<button data-act="note-add" data-cat="${k}">${ic} ${l}</button>`).join("")}</div></aside>`;
}
function noteHTML(n) {
  const c = NOTE_CAT[n.cat] || NOTE_CAT.gen;
  return `<div class="note ${n.done ? "done" : ""}"><button data-act="note-done" data-id="${n.id}" aria-label="סמן כטופל">${n.done ? "☑" : "☐"}</button><div class="grow"><span class="nt">${c[1]} ${c[2]}</span><span class="nx">${esc(n.text)}</span></div><button data-act="note-del" data-id="${n.id}" aria-label="מחק">✕</button></div>`;
}
function openNoteSheet(cat, scope, ref) {
  const c = notesContext(); scope = scope || (c && c[0]); ref = ref || (c && c[1]);
  if (!scope) return;
  openSheet(`<h2>📝 הערה מהירה</h2>
    <div class="quick" id="ncats">${NOTE_CATS.map(([k, ic, l]) => `<button data-ncat="${k}" class="${k === cat ? "on" : ""}" style="${k === cat ? "border-color:var(--amber);color:var(--amber)" : ""}">${ic} ${l}</button>`).join("")}</div>
    <textarea id="ntext" placeholder="מה לזכור?" style="min-height:90px"></textarea>
    <div class="row"><button class="btn primary" id="nsave">שמור</button><button class="btn" data-act="sheet-close">ביטול</button></div>`);
  let cur = cat || "gen";
  $("#ncats").onclick = e => { const b = e.target.closest("[data-ncat]"); if (!b) return; cur = b.dataset.ncat; $$("#ncats button").forEach(x => { const on = x === b; x.style.borderColor = on ? "var(--amber)" : ""; x.style.color = on ? "var(--amber)" : ""; }); };
  $("#nsave").onclick = () => { const t = $("#ntext").value.trim(); if (!t) return; (P.notes = P.notes || []).push({ id: uid(), scope, ref, cat: cur, text: t, done: false, at: Date.now() }); save(); closeSheet(); render(); };
  setTimeout(() => $("#ntext")?.focus(), 50);
}

/* ================= sheet ================= */
function openSheet(html) { $("#sheet").innerHTML = html; $("#sheetwrap").hidden = false; }
function closeSheet() { $("#sheetwrap").hidden = true; $("#sheet").innerHTML = ""; $("#sheet").onchange = null; }
$("#sheetwrap").addEventListener("click", e => { if (e.target.id === "sheetwrap") closeSheet(); });

/* ================= helpers for views ================= */
const curScene = () => P && P.scenes.find(s => s.id === ui.scene) || (P && P.scenes[0]) || null;
const shScene = () => P && P.scenes.find(s => s.id === ui.shScene) || (P && P.scenes[0]) || null;
function tags(s) { const night = /NIGHT|EVENING/.test(s.time); return `<span class="tag ${/INT/.test(s.intExt) && !/EXT/.test(s.intExt) ? "a" : "t"}">${esc(s.intExt)}</span> <span class="tag ${night ? "r" : ""}">${esc(s.time)}</span>`; }
function chip(st, attrs) { return `<button class="chip" data-s="${st || "left"}" ${attrs}>${STL[st || "left"]}</button>`; }
function bar(title, sub, actions = "", back = "") { return `<div class="bar">${back}<div class="ttl"><h2>${title}</h2>${sub ? `<span class="sub">${sub}</span>` : ""}</div>${actions}</div>`; }
const noteBtn = `<button class="btn notefab" data-act="note-open" aria-label="הערה מהירה">📝</button>`;
function noProject() {
  return bar("ProLab", "") + `<div class="body"><div class="empty"><p>עוד אין פרויקט פתוח.</p><div class="row"><button class="btn primary" data-act="new">+ פרויקט חדש</button><button class="btn" data-go="home">לכל הפרויקטים</button></div></div></div>`;
}
function noScenes() {
  return `<div class="empty"><p>עוד אין פירוק לפרויקט הזה.</p><button class="btn primary" data-act="new">+ פרויקט חדש מתסריט</button></div>`;
}
function thumbFor(p) {
  const s = (p.scenes || []).find(x => x.shots && x.shots.length);
  const shot = s ? s.shots[0] : { code: "", size: "WS", angle: "eye", move: "static", figures: (p.characters || []).slice(0, 2).map((c, i) => ({ name: c.name, x: 40 + i * 25 })) };
  return frame(shot, PAL_APP);
}

/* ================= views ================= */
const VIEWS = {};

VIEWS.home = () => {
  const list = projects.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0));
  return `<div class="col">${bar(`<span class="logo"><span><span class="wm">Pro<em>Lab</em></span><small>by G.Z MOTION LAB</small></span></span>`, "", `<button class="btn primary" data-act="new">+ פרויקט חדש</button>`)}
  <div class="body"><div class="projgrid">
    <button class="newcard" data-act="new"><b>+</b>פרויקט חדש</button>
    ${list.map(p => { const pr = progressOf(p.scenes || []); return `<div class="projwrap"><button class="pdel" data-act="home-del" data-id="${p.id}" aria-label="מחק את ${esc(p.title || "הפרויקט")}">🗑</button><button class="card proj" data-act="open" data-id="${p.id}"><span class="thumb">${thumbFor(p)}</span><span class="in"><b>${esc(p.title || "פרויקט ללא שם")}${p.demo ? ' <span class="tag n">דוגמה</span>' : ""}</b><span class="muted small">${TYPE_LABEL[p.type] || ""} · ${(p.scenes || []).length} סצנות</span><span class="prog"><i style="width:${pr.pct}%"></i></span><span class="mono muted">${pr.pct === 100 ? "הושלם ✓" : pr.pct ? pr.pct + "% צולם" : "מוכן לצילום"}</span></span></button></div>`; }).join("")}
  </div></div></div>`;
};

VIEWS.new = () => {
  const w = ui.wiz || (ui.wiz = { step: 1, type: (P && P.type) || "narrative", src: "file", text: "", fileName: "", days: 1, hours: 6, call: "07:00", busy: false });
  const steps = `<div class="steps"><span class="${w.step >= 1 ? "on" : ""}"><i>1</i>סוג</span>‹<span class="${w.step >= 2 ? "on" : ""}"><i>2</i>תסריט</span>‹<span class="${w.step >= 3 ? "on" : ""}"><i>3</i>יום צילום</span></div>`;
  let body = "";
  if (w.step === 1) body = `<h3>איזה סרט?</h3><div class="types">${TYPES.map(([k, l, ic]) => `<button class="type ${w.type === k ? "on" : ""}" data-act="wiz-type" data-k="${k}">${ICONS[ic]}${l}</button>`).join("")}</div>
    <div class="row"><button class="btn primary" data-act="wiz-next">המשך ←</button></div>`;
  if (w.step === 2) body = `<h3>מה יש לך?</h3><div class="sources">
      <button class="card src ${w.src === "file" ? "on" : ""}" data-act="wiz-src" data-k="file">${ICONS.upload}<b>קובץ תסריט</b><span class="muted">Word · PDF · TXT<br>מהמכשיר, מ-Drive או מוואטסאפ</span></button>
      <button class="card src ${w.src === "paste" ? "on" : ""}" data-act="wiz-src" data-k="paste">${ICONS.paste}<b>הדבק טקסט</b><span class="muted">תסריט, טיוטה או הודעה מהלקוח</span></button>
      <button class="card src ${w.src === "idea" ? "on" : ""}" data-act="wiz-src" data-k="idea">${ICONS.idea}<b>רק רעיון</b><span class="muted">2-3 משפטים, ו-Claude מציע מבנה</span></button></div>
    ${w.src === "file" ? `<div class="row"><button class="btn teal" data-act="wiz-file">⬆ בחר קובץ</button><span class="muted small" id="srcinfo">${esc(w.fileName ? w.fileName + " · " + w.text.length.toLocaleString() + " תווים" : "")}</span></div>` : ""}
    <textarea id="wtext" placeholder="${w.src === "idea" ? "למשל: סרט תדמית לחברת הייטק, 2 דקות, ראיון עם המנכ״ל, צוות בעבודה, אווירה צעירה." : "הטקסט של התסריט יופיע כאן. אפשר גם לערוך אותו."}" style="${w.src === "idea" ? "min-height:120px" : ""}">${esc(w.text)}</textarea>
    <div class="row"><button class="btn" data-act="wiz-back">→ חזרה</button><button class="btn primary" data-act="wiz-next">המשך ←</button></div>`;
  if (w.step === 3) body = `<h3>${w.type === "mitzvah" ? "יום צילום" : "כמה זמן משריינים לצילומים?"}</h3>
    ${w.type === "mitzvah" ? "" : `<div class="row"><span class="lbl">ימי צילום</span><div class="seg">${[1, 2, 3, 4].map(d => `<button class="${w.days === d ? "on" : ""}" data-act="wiz-days" data-d="${d}">${d === 1 ? "יום אחד" : d + " ימים"}</button>`).join("")}</div></div>`}
    <div class="row"><span class="lbl">${w.type === "mitzvah" ? "שעות נטו" : "שעות ביום"}</span><div class="seg">${hoursOpts(w.type).map(h => `<button class="${w.hours === h ? "on" : ""}" data-act="wiz-hours" data-h="${h}">${h}h</button>`).join("")}</div>
    <label class="row"><span class="lbl">Call</span><input type="time" id="wcall" value="${esc(w.call)}"></label></div>
    <p class="muted small">${TYPE_LABEL[w.type]} · ${w.src === "idea" ? "רעיון" : w.text.length.toLocaleString() + " תווים"}</p>
    ${w.type === "mitzvah" ? `<p class="callout">בר/בת מצווה: כל הסרט ביום אחד, עד ${w.hours} שעות. כל סצנה מקבלת 10-20 דקות, והשוטים, הרעיונות והמעברים מותאמים לזמן הזה.</p>` : `<p class="callout">${w.days === 1 ? "יום אחד" : w.days + " ימים"} × ${w.hours} שעות. הפירוק, השוטים, הרעיונות והמעברים יותאמו לזמן הזה.</p>`}
    <div class="row"><button class="btn" data-act="wiz-back">→ חזרה</button>${w.src === "idea" ? "" : `<button class="btn primary" data-act="wiz-quick">⚡ פירוק מהיר (עצמאי)</button>`}<button class="btn ${w.src === "idea" ? "primary" : "ai"}" data-act="wiz-run" data-ai>✦ פירוק חכם עם Claude</button></div>
    <p class="muted small">${w.src === "idea" ? "רעיון בלי תסריט צריך את Claude כדי לבנות מבנה של סצנות." : "<b>⚡ פירוק מהיר</b>: מיידי, בחינם ובלי אינטרנט. מזהה סצנות, לוקיישנים, דמויות ודיאלוגים בתסריט מסודר. <b>✦ פירוק חכם</b>: Claude מבין גם תסריט לא מסודר, כותב תקצירים ובונה רשימת \"חובה לצלם\"."}</p>`;
  return `<div class="col">${bar("פרויקט חדש", "", steps, `<button class="btn ghost" data-go="home" aria-label="סגור">✕</button>`)}<div class="body">${body}</div></div>`;
};

VIEWS.script = () => {
  if (!P) return `<div class="col">${noProject()}</div>`;
  if (!P.scenes.length) return `<div class="col">${bar(esc(P.title || "פרויקט"), "")}<div class="body">${noScenes()}</div></div>`;
  const seg = `<div class="seg">${[["scenes", "סצנות"], ["chars", "דמויות"], ["locs", "לוקיישנים"], ["list", "רשימה"]].map(([k, l]) => `<button class="${ui.sub === k ? "on" : ""}" data-act="sub" data-k="${k}">${l}</button>`).join("")}</div>`;
  let main = "", sub = "";
  if (ui.sub === "chars") { [main, sub] = scriptChars(); }
  else if (ui.sub === "locs") { [main, sub] = scriptLocs(); }
  else if (ui.sub === "list") { [main, sub] = scriptList(); }
  else { [main, sub] = scriptScenes(); }
  const s = curScene();
  const actions = `${seg}${ui.sub === "scenes" && s ? `<button class="btn ai" data-act="ai-open">✦ שדרג סצנה</button>` : ""}<input type="search" id="q" placeholder="חיפוש" value="${esc(ui.q)}" style="width:150px"><button class="btn" data-act="src-open">📄 מקורי</button>${noteBtn}`;
  return `<div class="col">${bar(esc(P.title || "פרויקט"), sub, actions)}<div class="body">${P.inferred ? `<p class="callout">התסריט היה תיאור חופשי, אז המבנה הוצע על ידי Claude. כדאי לעבור עליו.</p>` : ""}${main}</div></div>${notesPane()}`;
};
function sceneListHTML() {
  const q = ui.q.trim();
  return `<div class="scenes">${P.scenes.map(x => {
    const hit = !q || x.blocks.some(b => b.x.includes(q) || (b.c || "").includes(q)) || x.summary.includes(q) || x.location.includes(q);
    const nc = noteCount("scene", x.id);
    return `<button class="scn ${x.id === curScene().id ? "on" : ""} ${hit ? "" : "dim"}" data-act="scene" data-id="${x.id}"><b>${x.n} · ${esc(x.location)}</b><span class="t">${tags(x)}<span class="tag">${sceneMin(x)}'</span>${nc ? `<span class="tag n">📝 ${nc}</span>` : ""}${x.status === "cut" ? '<span class="tag r">Cut</span>' : ""}</span></button>`;
  }).join("")}<button class="addline" data-act="scene-add">+ סצנה</button></div>`;
}
function scriptScenes() {
  const s = curScene(); const q = ui.q.trim();
  const hl = t => q ? esc(t).split(esc(q)).join(`<mark>${esc(q)}</mark>`) : esc(t);
  const speakers = P.characters.map(c => c.name);
  const lines = s.blocks.map((b, i) => {
    if (ui.edit && ui.edit.scene === s.id && ui.edit.i === i) {
      return `<div class="ln edit ${b.t === "d" ? "dlg" : "act"}"><div class="lntools"><select id="espk" aria-label="דובר"><option value="">פעולה</option>${speakers.map(n => `<option ${b.t === "d" && b.c === n ? "selected" : ""}>${esc(n)}</option>`).join("")}<option value="__new">+ דמות חדשה…</option></select>
        <input type="text" id="epar" placeholder="(הוראת משחק)" value="${esc(b.p || "")}" style="min-height:34px;padding:4px 10px;flex:1;min-width:120px" ${b.t === "d" ? "" : "hidden"}></div>
        <textarea id="etext">${esc(b.x)}</textarea>
        <div class="lntools"><button data-act="ed-done" style="background:var(--amber);color:#1a1206;border-color:var(--amber)">סיום</button><button data-act="ed-move" data-d="-1">↑ הזז</button><button data-act="ed-move" data-d="1">↓ הזז</button><button data-act="ed-add" data-t="a">+ פעולה אחרי</button><button data-act="ed-add" data-t="d">+ דיאלוג אחרי</button><button data-act="note-open">📝 הערה</button><button data-act="ed-del" style="color:var(--crimson)">מחק</button></div></div>`;
    }
    return `<button class="ln ${b.t === "d" ? "dlg" : "act"}" data-act="ed" data-i="${i}"><span class="who">${b.t === "d" ? esc(b.c) : "פעולה"}</span><span class="txt">${b.p ? `<i>(${esc(b.p)})</i> ` : ""}${hl(b.x)}</span></button>`;
  }).join("");
  const head = ui.editHead ? `<div class="card" style="padding:12px;display:flex;flex-direction:column;gap:10px"><div class="formgrid">
      <label><span class="lbl">לוקיישן</span><input type="text" id="hloc" value="${esc(s.location)}"></label>
      <label><span class="lbl">INT/EXT</span><select id="hie">${["INT", "EXT", "INT/EXT"].map(v => `<option ${s.intExt === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label><span class="lbl">זמן</span><select id="htime">${Object.keys(RANK).map(v => `<option ${s.time === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label><span class="lbl">הערכת זמן (דק׳)</span><input type="number" id="hest" min="5" value="${s.estMinutes}"></label></div>
      <label style="display:flex;flex-direction:column;gap:4px"><span class="lbl">תקציר</span><input type="text" id="hsum" value="${esc(s.summary)}"></label>
      <div class="row"><button class="btn primary sm2" data-act="head-save">שמור</button><button class="btn sm2" data-act="head-cancel">ביטול</button><span class="grow"></span><button class="btn danger sm2" data-act="scene-del">מחק סצנה</button></div></div>`
    : `<div class="scenehead"><h3>Scene ${s.n} · ${esc(s.location)}</h3>${tags(s)}<button class="btn ghost sm2" data-act="head-edit">✎ ערוך</button></div><p><b>תקציר:</b> ${esc(s.summary)}</p>`;
  const main = `<div class="split">${sceneListHTML()}<div style="display:flex;flex-direction:column;gap:12px;min-width:0">
    ${s.dirty && s.shots.length ? `<div class="dirty">✎ שינית את הסצנה. <button class="btn primary sm2" data-act="gen1" data-id="${s.id}" data-ai>עדכן שוטים</button><button class="btn sm2" data-act="undirty">אחר כך</button></div>` : ""}
    ${head}<div class="lines">${lines || '<p class="muted">אין טקסט לסצנה.</p>'}<button class="addline" data-act="line-add">+ הוסף שורה</button></div></div></div>`;
  return [main, `Scene ${s.n} · ${esc(s.heading || s.location)}`];
}
function scriptChars() {
  const counts = {}; P.scenes.forEach(s => s.blocks.forEach(b => { if (b.t === "d") counts[b.c] = (counts[b.c] || 0) + 1; }));
  if (!ui.char || !P.characters.find(c => c.name === ui.char)) ui.char = (P.characters[0] || {}).name || null;
  const roleL = { lead: "Lead", supporting: "Supporting", extra: "Extra" };
  const list = `<div class="scenes">${P.characters.map(c => `<button class="scn ${ui.char === c.name ? "on" : ""}" data-act="char" data-k="${esc(c.name)}"><b>${esc(c.name)}</b><span class="t"><span class="tag ${c.role === "lead" ? "a" : ""}">${roleL[c.role]}</span><span class="tag">${counts[c.name] || 0} שורות</span>${noteCount("char", c.name) ? `<span class="tag n">📝 ${noteCount("char", c.name)}</span>` : ""}</span></button>`).join("")}</div>`;
  const lines = []; P.scenes.forEach(s => s.blocks.forEach((b, i) => { if (b.t === "d" && b.c === ui.char) lines.push({ s, b, i }); }));
  const inScenes = new Set(P.scenes.filter(s => (s.characters || []).includes(ui.char) || s.blocks.some(b => b.c === ui.char)).map(s => s.n));
  const c = P.characters.find(x => x.name === ui.char);
  const main = `<div class="split">${list}<div style="display:flex;flex-direction:column;gap:10px;min-width:0">
    <div class="row"><h3>${esc(ui.char || "")} · כל הדיאלוגים</h3><span class="mono muted">${lines.length} שורות · ${inScenes.size} סצנות</span><button class="btn sm2" data-act="share-lines">שתף דף שורות</button></div>
    ${c && c.desc ? `<p class="muted">${esc(c.desc)}</p>` : ""}
    <div class="lines">${lines.map(({ s, b, i }) => `<button class="ln dlg" data-act="goto-line" data-id="${s.id}" data-i="${i}"><span class="who mono">Sc ${s.n}</span><span class="txt">${b.p ? `<i>(${esc(b.p)})</i> ` : ""}${esc(b.x)}</span></button>`).join("") || '<p class="muted">אין שורות דיאלוג לדמות הזו.</p>'}</div></div></div>`;
  return [main, "נוגעים בדמות ורואים את כל השורות שלה"];
}
function scriptList() {
  const q = ui.q.trim();
  const rows = P.scenes.filter(s => !q || s.summary.includes(q) || s.location.includes(q) || s.blocks.some(b => b.x.includes(q))).map(s => {
    const done = s.shots.length ? `${s.shots.filter(x => x.status === "shot").length}/${liveShots(s).length} שוטים` : STL[s.status || "left"];
    return `<div class="card lrow ${s.status === "cut" ? "is-cut" : ""}"><span class="scnum">${s.n}</span>
      <div class="grow"><b>${esc(s.intExt)}. ${esc(s.location)} · ${esc(s.time)}</b><p class="small">${esc(s.summary)}</p><span class="muted small">${sceneMin(s)} דק׳ · ${done}${noteCount("scene", s.id) ? " · 📝 " + noteCount("scene", s.id) : ""}</span></div>
      <div class="lgo"><button class="btn sm2" data-act="list-go" data-to="script" data-id="${s.id}">תסריט</button><button class="btn sm2" data-act="list-go" data-to="shots" data-id="${s.id}">שוטים</button><button class="btn sm2" data-act="list-go" data-to="plan" data-id="${s.id}">לו"ז</button></div></div>`;
  }).join("");
  return [`<div class="queue">${rows || '<p class="muted">אין סצנות שמתאימות לחיפוש.</p>'}</div>`, `${P.scenes.length} סצנות לפי סדר התסריט · ${Math.round(P.scenes.reduce((a, s) => a + (s.status === "cut" ? 0 : sceneMin(s)), 0) / 6) / 10}h`];
}
function scriptLocs() {
  const groups = {}; P.scenes.forEach(s => { const k = normLoc(s.location); (groups[k] = groups[k] || { name: s.location, scenes: [] }).scenes.push(s); });
  const keys = Object.keys(groups);
  if (!ui.loc || !groups[ui.loc]) ui.loc = keys[0];
  const g = groups[ui.loc];
  const list = `<div class="scenes">${keys.map(k => { const x = groups[k]; const ie = [...new Set(x.scenes.map(s => s.intExt))].join("/"); return `<button class="scn ${ui.loc === k ? "on" : ""}" data-act="loc" data-k="${esc(k)}"><b>${esc(x.name)}</b><span class="t"><span class="tag">${esc(ie)}</span><span class="tag">${x.scenes.length} סצנות</span>${noteCount("loc", k) ? `<span class="tag n">📝 ${noteCount("loc", k)}</span>` : ""}</span></button>`; }).join("")}</div>`;
  const times = [...new Set(g.scenes.map(s => s.time))];
  const cast = [...new Set(g.scenes.flatMap(s => s.characters || []))];
  const mins = g.scenes.reduce((a, s) => a + sceneMin(s), 0);
  const main = `<div class="split">${list}<div style="display:flex;flex-direction:column;gap:12px;min-width:0">
    <div class="row"><h3>${esc(g.name)}</h3>${times.map(t => `<span class="tag">${esc(t)}</span>`).join("")}<span class="mono muted">${g.scenes.length} סצנות · ${mins} דק׳ · ${esc(cast.join(", "))}</span></div>
    ${g.scenes.map(s => `<div class="card loccard"><div class="row"><b class="grow">Sc ${s.n} · ${esc(s.summary)}</b>${tags(s)}<button class="btn ghost sm2" data-act="goto-scene" data-id="${s.id}">פתח ←</button></div>
      ${s.blocks.map(b => `<div class="ln ${b.t === "d" ? "dlg" : "act"}" style="cursor:default"><span class="who">${b.t === "d" ? esc(b.c) : "פעולה"}</span><span class="txt">${esc(b.x)}</span></div>`).join("")}</div>`).join("")}
  </div></div>`;
  return [main, "נוגעים בלוקיישן ורואים כל מה שקורה בו"];
}

VIEWS.ai = () => {
  if (!P || !P.scenes.length) return `<div class="col">${noProject()}</div>`;
  const s = P.scenes.find(x => x.id === ui.aiScene) || curScene();
  const seg = `<div class="seg">${TONES.map(([k, l]) => `<button class="${ui.tone === k ? "on" : ""}" data-act="tone" data-k="${k}">${l}</button>`).join("")}</div>`;
  const cards = (s.ai && s.ai.items) || [];
  const KIND = { punch: ["פאנץ'", "a"], add: ["רגע חדש", "a"], shot: ["שוט קריאייטיבי", "t"], structure: ["מבנה", ""], transition: ["מעבר", ""] };
  const cardHTML = (c, i) => {
    const [kl, kc] = KIND[c.kind] || [c.kind, ""];
    let extra = "";
    const ap = c.apply || null;
    if (ap && ap.type === "replace_line") { const b = s.blocks[ap.index]; extra = `${b ? `<div class="muted small">במקום: "${esc(b.x)}"</div>` : ""}<div class="quote">${ap.speaker ? `<b>${esc(ap.speaker)}:</b> ` : ""}${esc(ap.text)}</div>`; }
    if (ap && ap.type === "add_lines") extra = `<div class="quote">${(ap.lines || []).map(l => (l.t === "d" ? `<b>${esc(l.c)}:</b> ` : "") + esc(l.x)).join("<br>")}</div>`;
    if (ap && ap.type === "transition") extra = `<div class="quote"><b>${esc(ap.name)}</b> · ${esc(ap.idea)}${ap.shoot ? `<br><span class="muted">✂ לצלם: ${esc(ap.shoot)}</span>` : ""}</div>`;
    if (ap && ap.type === "add_shot" && ap.shot) extra = `<div class="quote"><b>${esc(ap.shot.size)} · ${esc(ap.shot.move)}</b> · ${esc(ap.shot.desc)}</div>`;
    const btn = !ap ? `<button class="btn primary sm2" data-act="ai-apply" data-i="${i}">שמור כהערה</button>`
      : ap.type === "add_shot" ? `<button class="btn primary sm2" data-act="ai-apply" data-i="${i}">הוסף כשוט</button>`
      : ap.type === "transition" ? `<button class="btn primary sm2" data-act="ai-apply" data-i="${i}">שמור מעבר</button>`
      : `<button class="btn primary sm2" data-act="ai-apply" data-i="${i}">הכנס לתסריט</button>`;
    return `<div class="card aic ${c.used ? "used" : ""}"><div class="aih"><span class="aiic">✦</span><b>${esc(c.title)}</b><span class="tag ${kc}">${kl}</span></div><p>${esc(c.text)}</p>${extra}
      <div class="aib">${c.used ? '<span class="tag t">✓ הוכנס</span>' : btn}<button class="btn ghost sm2" data-act="ai-dismiss" data-i="${i}" aria-label="דחה">✕</button></div></div>`;
  };
  return `<div class="col">${bar(`<span class="aiic">✦</span> שדרוג סצנה ${s.n}`, esc(s.location) + " · הצעות של Claude", seg, `<button class="btn ghost" data-go="script" aria-label="חזרה">→</button>`)}
  <div class="body">
    <p class="callout">בוחרים טון ולוחצים "הצע". שום דבר לא משתנה בתסריט עד שלוחצים "הכנס".</p>
    ${cards.length ? `<div class="aigrid">${cards.map(cardHTML).join("")}</div>` : `<div class="empty"><p>עוד אין הצעות לסצנה הזו.</p></div>`}
    <div class="row"><button class="btn primary" data-act="ai-run" data-ai>✦ ${cards.length ? "עוד הצעות" : "הצע שדרוגים"}</button><button class="btn" data-go="script">חזרה לתסריט</button></div>
  </div></div>${notesPane()}`;
};

VIEWS.shots = () => {
  if (!P) return `<div class="col">${noProject()}</div>`;
  if (!P.scenes.length) return `<div class="col">${bar("שוטים", "")}<div class="body">${noScenes()}</div></div>`;
  const s = shScene();
  const missing = P.scenes.filter(x => !x.shots.length).length;
  const shotCard = x => `<article class="card shot ${x.status === "cut" ? "is-cut" : ""}">${frame(x, PAL_APP)}<div class="in">
      <div class="tech"><span class="tag">${esc(x.code)}</span><span class="tag">${esc(x.size)}</span><span class="tag">${ANG_LABEL[angKey(x.angle)]}</span><span class="tag">${esc(x.move)}</span>${x.lens ? `<span class="tag">${esc(x.lens)}</span>` : ""}${x.creative ? '<span class="tag a">✦ Creative</span>' : ""}${(x.flags || {}).sound ? '<span class="tag r">🎤</span>' : ""}${(x.flags || {}).nomic ? '<span class="tag r">🎙</span>' : ""}</div>
      <p>${esc(x.desc)}</p>${x.purpose ? `<p class="muted small">${esc(x.purpose)}</p>` : ""}
      ${(x.refs || []).length ? `<div class="refs">${x.refs.map(r => r.type === "img" ? `<span class="ref"><img data-img="${r.img}" data-shot="${x.id}" data-ref="${r.id}" alt="רפרנס"><button class="btn ghost sm2" data-act="ref-del" data-shot="${x.id}" data-ref="${r.id}" aria-label="הסר רפרנס">✕</button></span>` : `<span class="ref"><a class="lk" href="${esc(r.url)}" target="_blank" rel="noopener">🔗 ${esc(r.url.replace(/^https?:\/\/(www\.)?/, ""))}</a><button class="btn ghost sm2" data-act="ref-del" data-shot="${x.id}" data-ref="${r.id}" aria-label="הסר קישור">✕</button></span>`).join("")}</div>` : ""}
      <div class="refbtns"><button data-act="ref-cam" data-shot="${x.id}">📷 צלם רפרנס</button><button data-act="ref-gal" data-shot="${x.id}">🖼 מהגלריה</button><button data-act="ref-link" data-shot="${x.id}">🔗 קישור</button></div>
      <div class="foot">${chip(x.status, `data-act="st" data-k="shot" data-id="${x.id}"`)}<span class="mono muted">${x.minutes} דק׳</span><span class="grow"></span><button class="btn ghost sm2" data-act="shot-move" data-id="${x.id}" data-d="-1" aria-label="הזז אחורה">↑</button><button class="btn ghost sm2" data-act="shot-move" data-id="${x.id}" data-d="1" aria-label="הזז קדימה">↓</button><button class="btn sm2" data-act="shot-edit" data-id="${x.id}">✎ ערוך</button></div>
    </div></article>`;
  const over = budgeted() && sceneMin(s) > (s.estMinutes || sceneBudget());
  return `<div class="col">${bar("שוטים וסטוריבורד", `Scene ${s.n} · ${s.shots.length} שוטים · ${sceneMin(s)} דק׳${budgeted() ? ` מתוך ${s.estMinutes || sceneBudget()}${over ? " ⚠" : ""}` : ""}`, `<button class="btn ${s.shots.length ? "ai" : "primary"}" data-act="gen1" data-id="${s.id}" data-ai>✦ ${s.shots.length ? "צור מחדש" : "צור שוטים"}</button><button class="btn" data-act="quick-shots">⚡ כיסוי בסיסי</button><button class="btn" data-act="shot-new">+ שוט</button>${missing ? `<button class="btn" data-act="genall" data-ai>✦ לכל הסצנות (${missing})</button><button class="btn" data-act="quick-shots" data-all="1">⚡ בסיסי לכל הסצנות</button>` : ""}${noteBtn}`)}
  <div class="body">
    <div class="scenetabs">${P.scenes.map(x => `<button class="${x.id === s.id ? "on" : ""} ${x.shots.length ? "has" : ""}" data-act="shs" data-id="${x.id}">Sc ${x.n}</button>`).join("")}</div>
    <p class="muted small">${esc(s.summary)}</p>
    ${s.shots.length ? `<div class="shotgrid">${s.shots.map(shotCard).join("")}</div>` : `<div class="empty"><p>עוד אין שוטים לסצנה הזו. בינתיים הלו"ז משתמש בהערכה של ${s.estMinutes} דקות.</p><div class="row" style="justify-content:center"><button class="btn primary" data-act="gen1" data-id="${s.id}" data-ai>✦ שוטים חכמים עם Claude</button><button class="btn" data-act="quick-shots">⚡ כיסוי בסיסי (בלי Claude)</button></div></div>`}
    ${s.ideas && s.ideas.length ? `<div><h3>${["narrative", "mitzvah", "clip", "promo"].includes(P.type) ? "✦ רעיונות מקוריים" : "✦ טיפים לצילום"}</h3><ul class="ideas">${s.ideas.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
  </div></div>${notesPane()}`;
};

VIEWS.plan = () => {
  if (!P) return `<div class="col">${noProject()}</div>`;
  if (!P.scenes.length) return `<div class="col">${bar('לו"ז', "")}<div class="body">${noScenes()}</div></div>`;
  const R = hasProgress() && (ui.planRemainSet ? !!ui.planRemain : true);
  const days = schedule({ remaining: R }), pr = progressOf(P.scenes);
  const pc = v => (pr.total + pr.cut) ? v / (pr.total + pr.cut) * 100 : 0;
  const dayOpts = s => `<select data-act="pin" data-id="${s.id}" aria-label="יום צילום" style="min-height:34px;padding:4px 8px"><option value="0">Auto</option>${Array.from({ length: Math.max(days.length + 1, 2) }, (_, i) => `<option value="${i + 1}" ${s.day === i + 1 ? "selected" : ""}>Day ${i + 1}</option>`).join("")}</select>`;
  const dayHTML = d => `<div class="day"><div class="dayhead"><h2>${R ? (d.n === 1 ? "יום הצילום הבא" : "עוד יום " + d.n) : "Day " + d.n} · Call ${hhmm(toMin(P.call))}</h2><span class="mono muted">Wrap ≈ ${hhmm(d.wrap)} · ${Math.round(d.work / 6) / 10}h מתוך ${P.hours}h</span><button class="btn whisky sm2" data-act="whisky" data-day="${d.n}">🥃 Whisky Shot</button><button class="btn sm2" data-act="set-day" data-day="${d.n}">מצב סט ←</button></div>
    ${d.work > P.hours * 60 ? `<p class="callout" style="color:var(--crimson)">היום הזה עובר את ${P.hours} השעות. כדאי להעביר סצנה ליום אחר או לסמן שוטים כ-Cut.</p>` : ""}
    <div class="queue">${d.items.map(it => {
      if (it.kind === "call") return `<div class="card q misc"><span class="t">${hhmm(it.t)}</span><span>Call · הקמה וציוד (${it.m}')</span></div>`;
      if (it.kind === "meal") return `<div class="card q misc"><span class="t">${hhmm(it.t)}</span><span>🍽 הפסקת אוכל (${it.m}')</span></div>`;
      if (it.kind === "loc") return `<div class="card q loc"><span class="t">${hhmm(it.t)}</span><span>📍 ${esc(it.loc)} · ${esc(it.ie)} · ${esc(it.time)}${it.m ? ` <span class="muted small">(מעבר ${it.m}')</span>` : ""}</span>${noteCount("loc", normLoc(it.loc)) ? `<span class="tag n">📝 ${noteCount("loc", normLoc(it.loc))}</span>` : ""}</div>`;
      const s = it.s; let t = it.t; const live = s.shots.length; const doneN = s.shots.filter(x => x.status === "shot").length; const rem = remindersFor(s.n); const nc = noteCount("scene", s.id);
      return `<div class="card q sc" id="pl-${s.id}"><div class="top"><span class="t">${hhmm(it.t)}</span><span class="grow"><span class="schead"><span class="scnum">${s.n}</span><b>${esc(s.intExt)}. ${esc(s.location)} · ${esc(s.time)}</b></span><span class="small">${esc(s.summary)}</span><br><span class="muted small">${live ? s.shots.length + " שוטים · " : ""}${it.m}'${nc ? " · 📝 " + nc : ""}</span>${rem.map(r => `<span class="remind">✂ ${esc(r)}</span>`).join("")}</span>${dayOpts(s)}${live ? `<span class="mono">${s.shots.filter(x => x.status === "shot").length}/${liveShots(s).length}</span>` : chip(s.status, `data-act="st" data-k="scene" data-id="${s.id}"`)}</div>
        ${live ? `<div class="shotrows">${R && doneN ? `<span class="muted small">✓ ${doneN} שוטים כבר צולמו</span>` : ""}${s.shots.filter(x => !R || x.status !== "shot").map(x => { const h = `<div class="shotrow ${x.status === "cut" ? "is-cut" : ""}"><span class="mono muted">${x.status === "cut" ? "" : hhmm(t)}</span><span class="mono">${esc(x.code)}</span><span class="d">${esc(x.desc)}</span><span class="mono muted">${esc(x.size)} · ${x.minutes}'</span>${chip(x.status, `data-act="st" data-k="shot" data-id="${x.id}"`)}</div>`; if (x.status !== "cut") t += +x.minutes || 0; return h; }).join("")}</div>` : ""}</div>`;
    }).join("")}</div></div>`;
  const cutScenes = P.scenes.filter(s => s.status === "cut");
  const must = P.must && P.must.groups && P.must.groups.length ? `<div class="must">${P.must.groups.map(g => `<section><h3>${esc(g.name)}</h3>${g.items.map(i => `<div class="it ${i.priority === "nice" ? "nice" : ""} ${i.status === "cut" ? "is-cut" : ""}">${chip(i.status, `data-act="st" data-k="must" data-id="${i.id}"`)}<span>${esc(i.text)}${i.priority === "nice" ? ' <span class="muted small">(nice)</span>' : ""}</span></div>`).join("")}</section>`).join("")}</div>` : `<p class="muted">עוד לא נוצרה רשימה.</p>`;
  const sel = `${isMitz() ? "" : `<div class="seg"><span class="lbl" style="align-self:center;padding:0 8px">ימים</span>${[1, 2, 3, 4].map(d => `<button class="${planDays() === d && budgeted() ? "on" : ""}" data-act="pdays" data-d="${d}">${d}</button>`).join("")}</div>`}<div class="seg"><span class="lbl" style="align-self:center;padding:0 8px">שעות</span>${hoursOpts(P.type).map(h => `<button class="${+P.hours === h ? "on" : ""}" data-act="hours" data-h="${h}">${h}h</button>`).join("")}</div><label class="row"><span class="lbl">Call</span><input type="time" id="pcall" value="${esc(P.call || "07:00")}"></label>`;
  const mz = isMitz() ? ` · בר/בת מצווה: עד ${planHours()}h, ~${sceneBudget()} דק׳ לסצנה` : budgeted() ? ` · מתוכנן: ${planDays()}×${planHours()}h, ~${sceneBudget()} דק׳ לסצנה` : "";
  return `<div class="col">${bar('לו"ז צילום', `${days.length} ימי צילום · ${Math.round(pr.total / 6) / 10}h · ${pr.pct}% צולם${mz}`, `${sel}<button class="btn" data-act="src-open">📄 תסריט מקורי</button><button class="btn teal" data-act="share-plan">שתף לצוות</button>${noteBtn}`)}
  <div class="body">
    <div class="pbar" title="ירוק = צולם · אדום = ירד"><i style="width:${pc(pr.done)}%;background:var(--teal)"></i><i style="width:${pc(pr.cut)}%;background:var(--crimson)"></i></div>
    ${hasProgress() ? (() => {
      const remTotal = P.scenes.reduce((a, s) => a + remMin(s), 0), doneScenes = P.scenes.filter(s => s.status !== "cut" && remMin(s) === 0).length;
      const leftScenes = P.scenes.filter(s => remMin(s) > 0).length, nd = schedule({ remaining: true });
      const fits = nd.length <= 1 && (!nd[0] || nd[0].work <= P.hours * 60);
      return `<div class="card" style="padding:14px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div class="sumrow grow"><div><span class="lbl">צולם</span><b>${doneScenes} סצנות</b></div><div><span class="lbl">נשאר לצלם</span><b>${leftScenes} סצנות · ${Math.round(remTotal / 6) / 10}h</b></div>
        <div><span class="lbl">ביום הבא</span><b style="color:${fits ? "var(--teal)" : "var(--crimson)"}">${leftScenes === 0 ? "הכל צולם 🎬" : fits ? "נכנס ביום אחד ✓" : "צריך " + nd.length + " ימים"}</b></div></div>
        <div class="seg"><button class="${R ? "on" : ""}" data-act="plan-remain" data-v="1">מה שנשאר</button><button class="${R ? "" : "on"}" data-act="plan-remain" data-v="0">כל התוכנית</button></div></div>`;
    })() : ""}
    ${days.map(dayHTML).join("") || (R ? `<div class="empty"><p>הכל צולם 🎬</p><button class="btn whisky" data-act="whisky" data-day="1">🥃 Whisky Shot</button></div>` : "")}
    ${cutScenes.length ? `<div><h3>סצנות שירדו</h3>${cutScenes.map(s => `<div class="row small"><span class="mono">Sc ${s.n}</span><span>${esc(s.summary)}</span>${chip(s.status, `data-act="st" data-k="scene" data-id="${s.id}"`)}</div>`).join("")}</div>` : ""}
    <div class="row"><h2 class="grow">Must-Shoot · חובה לצלם</h2><button class="btn ai sm2" data-act="must" data-ai>✦ ${P.must && P.must.groups && P.must.groups.length ? "צור מחדש" : "צור רשימה"}</button></div>
    ${must}
    <p class="muted small">${isMitz() ? `בר/בת מצווה: הכל ביום אחד. Call כולל ${MITZ.setup}' הקמה, כל מעבר לוקיישן ${MITZ.move}', כל סצנה 10-20 דקות. הסדר מקובץ לפי לוקיישן ואור.` : `הסדר מקובץ לפי לוקיישן ואור: חוץ ביום קודם, שקיעה ולילה בסוף. Call כולל ${SETUP}' הקמה, כל מעבר לוקיישן ${MOVE}', והפסקת אוכל ${MEAL}' בימים של 6 שעות ומעלה. אפשר לנעוץ סצנה ליום מסוים.`}</p>
    ${budgeted() && days.length > planDays() ? `<p class="callout" style="color:var(--crimson)">התוכנית חורגת מ-${planDays() === 1 ? "יום אחד" : planDays() + " ימים"}. לחץ ⏱ כדי להתאים, או הוסף יום.</p>` : ""}
    <div class="row">${(ui.undo || []).length ? `<button class="btn sm2" data-act="undo">↩ בטל סימון</button>` : ""}${hasProgress() ? `<button class="btn sm2" data-act="reset-progress">↺ אפס סימונים</button>` : ""}<button class="btn sm2" data-act="plan-fit">⏱ התאם את כל הסצנות ל-${isMitz() ? planHours() + " שעות" : (budgeted() ? planDays() : Math.max(1, days.length)) + "×" + planHours() + "h"}</button></div>
  </div></div>${notesPane()}`;
};

function setQueue(day) {
  const q = [];
  day.scenes.forEach(s => { if (s.shots.length) s.shots.forEach(x => { if (x.status !== "cut") q.push({ s, x }); }); else q.push({ s, x: null }); });
  return q;
}
VIEWS.set = () => {
  if (!P || !P.scenes.length) return `<div class="col">${P ? bar("מצב סט", "") + `<div class="body">${noScenes()}</div>` : noProject()}</div>`;
  const days = schedule(); ui.setDay = clamp(ui.setDay || 1, 1, days.length);
  const day = days[ui.setDay - 1]; const q = setQueue(day);
  const isDone = e => (e.x ? e.x.status : e.s.status) === "shot";
  let cur = q.find(e => (e.x ? e.x.id : e.s.id) === ui.setShot) || q.find(e => !isDone(e)) || null;
  const pr = progressOf(day.scenes);
  const daySeg = days.length > 1 ? `<div class="seg">${days.map(d => `<button class="${d.n === ui.setDay ? "on" : ""}" data-act="set-day" data-day="${d.n}">Day ${d.n}</button>`).join("")}</div>` : "";
  const ring = `<svg class="ring" viewBox="0 0 36 36"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#9cc4e8"/><stop offset="1" stop-color="#f0a94c"/></linearGradient></defs><circle cx="18" cy="18" r="15" fill="none" stroke="var(--left-bg)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="url(#rg)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(pr.pct / 100 * 94.2).toFixed(1)} 94.2" transform="rotate(-90 18 18)"/><text x="18" y="21" text-anchor="middle" font-size="8" font-weight="700" fill="var(--ink)" font-family="Rubik">${pr.pct}%</text></svg>`;
  let now;
  if (!cur) now = `<div class="card now" style="align-items:center;text-align:center"><h2>הכל צולם ביום הזה 🎬</h2><p class="muted">לפני שמקפלים, עוד בדיקה אחת.</p><button class="btn whisky" data-act="whisky" data-day="${ui.setDay}">🥃 Whisky Shot</button></div>`;
  else {
    const x = cur.x, s = cur.s, f = (x && x.flags) || {};
    const rem = remindersFor(s.n);
    const cst = (x || s).status || "left";
    now = `<div class="card now"><span class="mono muted">${cst === "left" ? "עכשיו מצלמים" : "פתחת שוט שכבר סומן"} · Sc ${s.n} · ${esc(s.location)}</span>
      ${cst !== "left" ? `<div class="dirty">כרגע מסומן: ${STL[cst]} <button class="btn sm2" data-act="set-mark" data-s="left">↺ החזר ל-Left (לא צולם)</button></div>` : ""}
      <div class="row"><span class="code">${x ? esc(x.code) : "Sc " + s.n}</span><div><h3>${esc(x ? x.desc : s.summary)}</h3><span class="muted">${x ? `${esc(x.size)} · ${esc(x.move)}${x.lens ? " · " + esc(x.lens) : ""} · ${x.minutes} דק׳` : "בלי פירוק לשוטים"}</span></div></div>
      ${x ? `<div class="sbbox">${frame(x, PAL_APP)}</div>` : ""}
      ${x && (x.refs || []).length ? `<div class="refs">${x.refs.map(r => r.type === "img" ? `<span class="ref"><img data-img="${r.img}" data-shot="${x.id}" data-ref="${r.id}" alt="רפרנס"><button class="btn ghost sm2" data-act="ref-del" data-shot="${x.id}" data-ref="${r.id}" aria-label="מחק רפרנס">✕</button></span>` : `<span class="ref"><a class="lk" href="${esc(r.url)}" target="_blank" rel="noopener">🔗 ${esc(r.url.replace(/^https?:\/\/(www\.)?/, ""))}</a><button class="btn ghost sm2" data-act="ref-del" data-shot="${x.id}" data-ref="${r.id}" aria-label="מחק קישור">✕</button></span>`).join("")}</div>` : ""}
      <div class="bigbtns"><button style="background:var(--teal-soft);color:var(--teal)" data-act="set-mark" data-s="shot">✓ צולם</button><button style="background:var(--part-bg);color:var(--part)" data-act="set-mark" data-s="part">◐ חלקי</button><button style="background:var(--crimson-soft);color:var(--crimson)" data-act="set-mark" data-s="cut">✕ ירד</button></div>
      ${x ? `<div class="flags"><button class="flag ${f.sound ? "on" : ""}" data-act="flag" data-f="sound">🎤 סאונד בעייתי</button><button class="flag ${f.nomic ? "on" : ""}" data-act="flag" data-f="nomic">🎙 אין מיק לשחקן</button><button class="flag ${f.later ? "on" : ""}" data-act="flag" data-f="later">… להשלים בסוף</button></div>` : ""}
      ${rem.map(r => `<span class="callout" style="color:var(--amber)">✂ לזכור: ${esc(r)}</span>`).join("")}
      ${notesFor("scene", s.id).filter(n => !n.done).map(noteHTML).join("")}
    </div>`;
  }
  const nextList = q.filter(e => e !== cur && !isDone(e)).slice(0, 4);
  const undoBtn = (ui.undo || []).length ? `<button class="btn" data-act="undo">↩ בטל סימון</button>` : "";
  return `<div class="col">${bar("מצב סט", `Day ${ui.setDay} · ${pr.nDone}/${pr.nShots} צולמו`, `${undoBtn}${daySeg}<button class="btn whisky" data-act="whisky" data-day="${ui.setDay}">🥃 Whisky Shot</button>${cur && cur.x ? `<button class="btn" data-act="ref-cam" data-shot="${cur.x.id}">📷 רפרנס</button>` : ""}<button class="btn" data-act="note-open">📝 הערה</button>`)}
  <div class="body"><div class="setwrap">${now}
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="card" style="padding:14px;display:flex;gap:14px;align-items:center">${ring}<div><b>Day ${ui.setDay}</b><br><span class="muted">${pr.nDone} מתוך ${pr.nShots} · Wrap ≈ ${hhmm(day.wrap)}</span></div></div>
      ${nextList.length ? `<span class="mono muted">הבא בתור</span>${nextList.map(e => `<button class="card q qbtn" data-act="set-pick" data-id="${e.x ? e.x.id : e.s.id}"><span class="t">${e.x ? esc(e.x.code) : "Sc " + e.s.n}</span><span class="grow">${esc(e.x ? e.x.size + " · " + e.x.desc : e.s.summary)}</span>${e.x && e.x.status === "part" ? '<span class="tag a">Partial</span>' : ""}</button>`).join("")}` : ""}
      ${q.filter(isDone).length ? `<span class="mono muted">צולמו · נגיעה פותחת ומאפשרת לבטל</span>${q.filter(isDone).slice(-6).map(e => `<button class="card q qbtn" data-act="set-pick" data-id="${e.x ? e.x.id : e.s.id}" style="opacity:.6"><span class="t">${e.x ? esc(e.x.code) : "Sc " + e.s.n}</span><span class="grow">${esc(e.x ? e.x.desc : e.s.summary)}</span><span class="tag t">✓</span></button>`).join("")}` : ""}
      ${hasProgress() ? `<button class="btn ghost sm2" data-act="reset-progress">↺ אפס את כל הסימונים</button>` : ""}
    </div></div></div></div>${notesPane()}`;
};

/* ----- whisky ----- */
function whiskyDet(day) {
  const items = [];
  const flagged = [];
  day.scenes.forEach(s => s.shots.forEach(x => { const f = x.flags || {}; if (f.sound || f.nomic) flagged.push({ s, x, f }); }));
  if (flagged.length) {
    const lines = [];
    flagged.forEach(({ s, x, f }) => {
      const who = new Set((x.figures || []).map(g => g.name));
      s.blocks.forEach(b => { if (b.t === "d" && (!who.size || who.has(b.c) || [...who].some(n => b.c.includes(n) || n.includes(b.c)))) lines.push({ code: x.code, c: b.c, x: b.x, why: f.sound ? "סאונד בעייתי" : "אין מיק" }); });
    });
    items.push({ key: "wild", kind: "wild", title: "השלמות סאונד · Wild lines", text: `סימנת ${flagged.map(e => e.x.code).join(", ")}. להקליט אוף-קמרה, קרוב למיק, ולסנכרן בעריכה. לבקש מהשחקן אותו קצב כמו בטייק, 2-3 טייקים.`, lines: lines.slice(0, 12) });
  }
  day.scenes.forEach(s => s.shots.forEach(x => { if ((x.flags || {}).later && x.status !== "shot") items.push({ key: "later-" + x.id, kind: "shot", title: "סימנת: להשלים בסוף · " + x.code, text: x.desc }); }));
  const ids = new Set(day.scenes.map(s => s.id));
  (P.notes || []).filter(n => !n.done && ((n.scope === "scene" && ids.has(n.ref)) || (n.scope === "day" && n.ref === String(day.n)) || n.scope === "project")).slice(0, 6)
    .forEach(n => items.push({ key: "note-" + n.id, kind: "note", title: "מההערות שלך", text: n.text, noteId: n.id }));
  day.scenes.forEach(s => remindersFor(s.n).forEach((r, i) => items.push({ key: "tr-" + s.id + "-" + i, kind: "sound", title: "לטובת מעבר בעריכה", text: r })));
  return items;
}
VIEWS.whisky = () => {
  if (!P || !P.scenes.length) return `<div class="col">${noProject()}</div>`;
  const days = schedule(); const dn = clamp(ui.setDay || 1, 1, days.length); const day = days[dn - 1];
  const W = (P.whisky = P.whisky || {})[dn] = P.whisky[dn] || { ai: [], st: {} };
  const det = whiskyDet(day);
  const all = det.concat((W.ai || []).map((x, i) => Object.assign({ key: "ai-" + i }, x)));
  const ICON = { wild: "🎙", shot: "📷", sound: "🎤", vo: "🎙", insert: "✨", note: "📝", other: "💡" };
  const pr = progressOf(day.scenes);
  const card = it => {
    const st = it.kind === "note" ? ((P.notes || []).find(n => n.id === it.noteId) || {}).done ? "shot" : "left" : (W.st[it.key] || "left");
    const done = st === "shot" || st === "cut";
    return `<div class="card wi ${it.kind === "note" ? "note-wi" : ""} ${done ? "done" : ""}"><span class="wic">${ICON[it.kind] || "💡"}</span><div class="grow"><b>${esc(it.title)}</b><p>${esc(it.text)}</p>${it.lines && it.lines.length ? `<ul class="wl">${it.lines.map(l => `<li><b>${esc(l.c)} · ${esc(l.code)}</b> "${esc(l.x)}" <span class="muted small">(${esc(l.why)})</span></li>`).join("")}</ul>` : ""}</div>
      <div class="wb">${it.kind === "note" ? `<button class="chip" data-s="${st}" data-act="w-note" data-id="${it.noteId}">${st === "shot" ? "טופל ✓" : "טופל?"}</button>` : `<button class="chip" data-s="${st}" data-act="w-st" data-k="${esc(it.key)}" data-v="shot">${st === "shot" ? "Shot ✓" : "לצלם"}</button><button class="btn ghost sm2" data-act="w-st" data-k="${esc(it.key)}" data-v="${st === "cut" ? "left" : "cut"}">${st === "cut" ? "החזר" : "דלג"}</button>`}</div></div>`;
  };
  return `<div class="col">${bar("🥃 Whisky Shot", "לפני שמקפלים: מה אולי שכחת?", `<span class="tag a">Day ${dn} · ${pr.nDone} מתוך ${pr.nShots} צולמו</span>`, `<button class="btn ghost" data-go="set" aria-label="חזרה">→</button>`)}
  <div class="body">
    <p class="muted">ProLab עובר על הסימונים שלך בסט, ההערות והמעברים. "✦ בקש הצעות" מוסיף בדיקה של Claude: שוטים, סאונד, קריינות ואינסרטים שכדאי לקחת עכשיו.</p>
    <div class="wlist">${all.map(card).join("") || '<div class="empty"><p>אין משהו פתוח מהסימונים וההערות שלך.</p></div>'}</div>
    <div class="row"><button class="btn primary" data-act="cheers">🥂 הכל צולם, סיימנו</button><button class="btn ai" data-act="w-ai" data-ai>✦ ${W.ai && W.ai.length ? "עוד הצעות" : "בקש הצעות מ-Claude"}</button></div>
  </div></div>${notesPane()}`;
};
VIEWS.cheers = () => {
  const days = P ? schedule() : []; const dn = clamp(ui.setDay || 1, 1, Math.max(1, days.length)); const day = days[dn - 1];
  const pr = day ? progressOf(day.scenes) : { nDone: 0 };
  return `<div class="col"><div class="cheers">
    <svg class="glasses" viewBox="0 0 220 150" aria-label="שתי כוסות ויסקי משיקות"><defs><linearGradient id="wh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3b54a"/><stop offset="1" stop-color="#b8541c"/></linearGradient></defs>
      <g class="sp"><path d="M110 22v-14M92 28l-8-11M128 28l8-11" stroke="#f3b54a" stroke-width="3" stroke-linecap="round"/></g>
      <g class="gl gl1"><path d="M58 52h56l-6 70a8 8 0 0 1-8 7H72a8 8 0 0 1-8-7z" fill="rgba(255,255,255,.07)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/><path d="M62 84h48l-3.4 38a6 6 0 0 1-6 5H71.4a6 6 0 0 1-6-5z" fill="url(#wh)"/><rect x="70" y="74" width="16" height="16" rx="3" fill="rgba(255,255,255,.35)" transform="rotate(-12 78 82)"/></g>
      <g class="gl gl2"><path d="M106 52h56l-6 70a8 8 0 0 1-8 7h-28a8 8 0 0 1-8-7z" fill="rgba(255,255,255,.07)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/><path d="M110 84h48l-3.4 38a6 6 0 0 1-6 5h-29.2a6 6 0 0 1-6-5z" fill="url(#wh)"/><rect x="132" y="72" width="15" height="15" rx="3" fill="rgba(255,255,255,.35)" transform="rotate(14 140 80)"/></g></svg>
    <h2 class="ch">צ'ירס!<br><span dir="ltr">That's a wrap</span></h2>
    <p class="muted">${P ? esc(P.title) + " · " : ""}Day ${dn} הסתיים · ${pr.nDone} שוטים צולמו${day ? " · " + day.scenes.length + " סצנות" : ""}</p>
    <div class="row" style="justify-content:center"><button class="btn primary" data-act="share-day">שלח סיכום יום לצוות</button><button class="btn" data-go="home">לפרויקטים</button><button class="btn ghost" data-act="cheers">🥂 שוב</button></div>
  </div></div>`;
};

VIEWS.cut = () => {
  if (!P) return `<div class="col">${noProject()}</div>`;
  const tr = P.transitions || [];
  const tl = P.scenes.length ? P.scenes.map((s, i) => { const t = tr.find(x => x.from === s.n);
    return `<div class="card tl-scene"><span class="mono muted">SC ${s.n}</span><span>${esc(s.location)} · ${esc(s.summary)}</span></div>${i < P.scenes.length - 1 ? (t ? `<div class="tl-tr"><span class="aiic">✦</span><div><b>${esc(t.type)}</b><div>${esc(t.idea)}</div>${t.shoot ? `<div class="shoot">✂ לצלם: ${esc(t.shoot)}</div>` : ""}</div></div>` : `<div class="tl-tr"><span class="muted small">—</span></div>`) : ""}`; }).join("") : noScenes();
  const canShare = !!(navigator.canShare && window.File);
  return `<div class="col">${bar("עריכה וייצוא", "מעברים לפי סדר הסיפור", `<button class="btn ai" data-act="trans" data-ai ${P.scenes.length < 2 ? "disabled" : ""}>✦ ${tr.length ? "הצע מחדש" : "הצע מעברים"}</button>`)}
  <div class="body">
    ${tr.length ? "" : `<p class="muted small">הכי טוב ליצור מעברים אחרי שיש שוטים, כי Claude נשען על השוט הראשון והאחרון של כל סצנה.</p>`}
    <div class="queue">${tl}</div>
    <h2>ייצוא ושיתוף</h2>
    <div class="exports">
      <div class="card exp"><h3>PDF</h3><p>לו"ז, רשימת חובה, מעברים, הערות וסטוריבורד. בחלון ההדפסה בוחרים "שמור כ-PDF".</p><button class="btn" data-act="x" data-k="pdf">הדפס / PDF</button></div>
      <div class="card exp"><h3>HTML לסט</h3><p>קובץ אחד שנפתח בכל טלפון. הצוות מסמן בו Shot / Partial / Cut וכותב הערות.</p><div class="row"><button class="btn" data-act="x" data-k="html">שמור</button>${canShare ? `<button class="btn teal" data-act="xs" data-k="html">שתף</button>` : ""}</div></div>
      <div class="card exp"><h3>Word</h3><p>טבלאות לעריכה חופשית ב-Word.</p><div class="row"><button class="btn" data-act="x" data-k="doc">שמור</button>${canShare ? `<button class="btn teal" data-act="xs" data-k="doc">שתף</button>` : ""}</div></div>
      <div class="card exp"><h3>CSV</h3><p>רשימת שוטים ל-Excel או Google Sheets.</p><button class="btn" data-act="x" data-k="csv">שמור</button></div>
      <div class="card exp"><h3>גיבוי פרויקט</h3><p>קובץ עם כל הפרויקט (בלי תמונות הרפרנס). אפשר לפתוח אותו במכשיר אחר.</p><div class="row"><button class="btn" data-act="x" data-k="json">שמור גיבוי</button><button class="btn" data-act="import">פתח גיבוי</button></div></div>
    </div>
    <div class="row"><span class="grow"></span><button class="btn danger sm2" data-act="proj-del">מחק פרויקט</button></div>
  </div></div>`;
};

VIEWS.settings = () => {
  return `<div class="col">${bar("הגדרות", "חיבור ל-Claude ומידע", `<button class="btn" data-act="set-close">✕ סגור</button>`)}
  <div class="body"><div class="setgrid">
    <div class="logo">${LOGO("s")}<div><div class="wm">Pro<em>Lab</em></div><small>by G.Z MOTION LAB</small></div></div>
    <h2>איך ProLab מפרק ובונה את התוכנית</h2>
    <label class="radio"><input type="radio" name="mode" value="local" ${CFG.mode === "local" ? "checked" : ""}><span><b>⚡ עצמאי, בלי Claude</b> · מיידי, בחינם, בלי אינטרנט<br><span class="small muted">פירוק מהיר של תסריט מסודר: סצנות, לוקיישנים, דמויות, דיאלוגים ולו"ז, וכיסוי בסיסי של שוטים עם סטוריבורד. רעיונות, שדרוגים ומעברים דורשים Claude, ואפשר להפעיל אותו בלחיצה כשצריך.</span></span></label>
    <label class="radio"><input type="radio" name="mode" value="manual" ${CFG.mode === "manual" || !CFG.mode ? "checked" : ""}><span><b>ידני דרך claude.ai</b> · כלול במנוי שלך<br><span class="small muted">בכל שלב האפליקציה מכינה בקשה. מעתיקים אותה לשיחה ב-claude.ai ומדביקים בחזרה את התשובה.</span></span></label>
    <label class="radio"><input type="radio" name="mode" value="api" ${CFG.mode === "api" ? "checked" : ""}><span><b>אוטומטי עם מפתח API</b> · לחיצה אחת, בלי העתקות<br><span class="small muted">צריך מפתח מ-console.anthropic.com. זה חשבון נפרד מהמנוי, ומשלמים לפי שימוש.</span></span></label>
    <div class="row"><label class="lbl" for="apikey">מפתח API</label><input type="password" id="apikey" style="flex:1;min-width:220px" placeholder="sk-ant-..." value="${esc(CFG.key)}" autocomplete="off"><button class="btn" data-act="key-save">שמור</button><button class="btn" data-act="key-test" data-ai>בדוק חיבור</button></div>
    <p class="small" id="keymsg"></p>
    <p class="muted small">המפתח נשמר רק במכשיר הזה ונשלח רק ל-Anthropic. מודל: ${MODEL}.</p>
    <h2>התקנה כאפליקציה</h2>
    <p class="muted">ב-Chrome באנדרואיד: תפריט ⋮ ואז "הוסף למסך הבית" או "התקן אפליקציה". האפליקציה תיפתח במסך מלא ותעבוד גם בלי אינטרנט (חוץ מ-Claude).</p>
    <h2>הנתונים שלך</h2>
    <p class="muted">הפרויקטים ותמונות הרפרנס נשמרים רק במכשיר הזה. כדי להעביר פרויקט למכשיר אחר, שומרים גיבוי בלשונית עריכה.</p>
    <div class="row"><button class="btn" data-act="demo">טען פרויקט לדוגמה</button></div>
  </div></div></div>`;
};

/* ================= side menu ================= */
const APP_VERSION = "2.6";
const CHANGES = [
  ["2.6", ["מחיקת תמונת רפרנס גם במצב סט, וגם מתוך התמונה המוגדלת (🗑 מחק)."]],
  ["2.5", ["צבעי האפליקציה לפי הלוגו: כחול לילה, תכלת, ענבר וקרם."]],
  ["2.4", ["אייקון ולוגו חדשים לאפליקציה."]],
  ["2.3", ["במסך התסריט: לשונית \"רשימה\" עם כל הסצנות לפי הסדר ותיאור קצר, ומכל סצנה קפיצה לתסריט, לשוטים או ללו\"ז."]],
  ["2.2", ["📄 התסריט המקורי בלחיצה: בלו\"ז, במסך התסריט ובתפריט. המספר של כל סצנה מופיע ליד הכותרת שלה, והקובץ המקורי (PDF / Word) נפתח מכאן.", "בלו\"ז: מספר הסצנה צמוד לכותרת (פנים/חוץ, לוקיישן, יום/לילה)."]],
  ["2.1", ["↩ בטל סימון: מבטל את הסימון האחרון (Shot / Partial / Cut).", "במצב סט: נגיעה בשוט שכבר צולם פותחת אותו, ואפשר להחזיר אותו ל-Left.", "↺ אפס את כל הסימונים: מחזיר את הפרויקט למצב שלפני הצילום."]],
  ["2.0", ["לו\"ז \"מה שנשאר\": אחרי שמסמנים Shot ✓, הלו\"ז מראה רק מה שנשאר לצלם, כמה זמן זה לוקח, והאם זה נכנס ביום הבא.", "אפשר לעבור בין \"מה שנשאר\" ל\"כל התוכנית\"."]],
  ["1.9", ["מחיקת פרויקט ישר ממסך הבית: כפתור 🗑 בפינת הכרטיס."]],
  ["1.8", ["בהגדרות: מצב ⚡ עצמאי, בלי Claude. כשצריך רעיון או שדרוג, אפשר להפעיל את Claude רק לפעם הזו.", "\"אודות\" מעודכן."]],
  ["1.7", ["⚡ פירוק מהיר בלי Claude: מזהה סצנות, לוקיישנים, דמויות ודיאלוגים בשנייה, בחינם ובלי אינטרנט.", "⚡ כיסוי בסיסי: רשימת שוטים וסטוריבורד בסיסיים בלי Claude."]],
  ["1.6", ["בעלילתי, תדמית, שיווק, פרומו, קליפ וכנס: בוחרים כמה ימי צילום וכמה שעות ביום, והפירוק, השוטים והרעיונות מותאמים לזה.", "בלו\"ז: שינוי ימים ושעות, והתראה אם התוכנית חורגת."]],
  ["1.5", ["בר/בת מצווה: כל הסרט ביום אחד של עד 6 שעות, 10-20 דקות לסצנה.", "השוטים, הרעיונות, השדרוגים, המעברים וה-Whisky Shot מותאמים לתקציב הזמן.", "כפתור ⏱ להתאמת כל הסצנות לשעות היום."]],
  ["1.4", ["הגדרות: כפתור ✕ סגור, ולחיצה שנייה על ⚙ הגדרות סוגרת וחוזרת למסך הקודם."]],
  ["1.3", ["השם ProLab צמוד ללוגו בסרגל.", "עדכונים נטענים תמיד במלואם, כדי שכל הכפתורים יעבדו אחרי עדכון."]],
  ["1.2", ["נגיעה בתמונת רפרנס מגדילה אותה ל-3 שניות. נגיעה בתמונה המוגדלת משאירה אותה פתוחה."]],
  ["1.1", ["תפריט צד עם שיתוף האפליקציה, הוספה למסך הבית, מה חדש ואודות.", "שמירה וגיבוי ישירות מהתפריט."]],
  ["1.0", ["גרסה ראשונה: פירוק תסריט עם עריכה, דמויות ולוקיישנים.", "✦ שדרוג סצנה לפי טון, שוטים וסטוריבורד עם רפרנסים מהמצלמה.", "לו\"ז צילום, מצב סט עם סימוני סאונד, 🥃 Whisky Shot ו-🥂 צ'ירס.", "מעברים לעריכה וייצוא ל-PDF, HTML לסט, Word ו-CSV."]]];
const DICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  script: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/></svg>',
  shots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  set: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8l16-4v4H4z"/><rect x="4" y="8" width="16" height="12" rx="1"/></svg>',
  cut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5v.5"/></svg>'};
function openMenu() {
  const it = (act, ic, t, sub, opt = {}) => `<button class="ditem ${opt.on ? "on" : ""}" data-act="${act}" ${opt.v ? `data-v="${opt.v}"` : ""} ${opt.dis ? "disabled" : ""}>${DICON[ic]}<span><b>${t}</b>${sub ? `<span>${sub}</span>` : ""}</span></button>`;
  const on = v => ui.view === v || ({ new: "home", ai: "script", whisky: "set", cheers: "set" }[ui.view] === v);
  const noP = !P;
  $("#drawer").innerHTML = `<div class="dhead"><div class="logo">${LOGO("d")}<div><div class="wm">Pro<em>Lab</em></div><small>by G.Z MOTION LAB</small></div></div><p>פירוק תסריט, שוטים ולו"ז צילום</p></div>
    ${it("dgo", "home", "בית", "כל הפרויקטים שלך", { v: "home", on: on("home") })}
    ${it("dgo", "script", "הפרויקט שלי", P ? esc(P.title || "תסריט") + " · תסריט, דמויות ולוקיישנים" : "תסריט, דמויות ולוקיישנים", { v: "script", on: on("script"), dis: noP })}
    ${it("src-open", "script", "התסריט המקורי", "הטקסט והקובץ כפי שהועלו", { dis: noP })}
    ${it("dgo", "shots", "שוטים וסטוריבורד", "שוטים, ציורים ורפרנסים", { v: "shots", on: on("shots"), dis: noP })}
    ${it("dgo", "plan", 'לו"ז צילום', "סדר צילום, ימים וחובה לצלם", { v: "plan", on: on("plan"), dis: noP })}
    ${it("dgo", "set", "מצב סט", "צילום, סימונים ו-Whisky Shot", { v: "set", on: on("set"), dis: noP })}
    ${it("dgo", "cut", "עריכה וייצוא", "מעברים, PDF ושיתוף לצוות", { v: "cut", on: on("cut"), dis: noP })}
    ${it("m-backup", "save", "שמירה וגיבוי", "שומרים קובץ גיבוי של הפרויקט וממשיכים במכשיר אחר", { dis: noP })}
    ${it("m-new", "plus", "פרויקט חדש", "")}
    <div class="dsep"></div>
    ${it("m-share", "share", "שיתוף האפליקציה", "שלח קישור לחברים")}
    ${it("m-install", "install", "הוספה למסך הבית", "אייקון כמו אפליקציה")}
    ${it("dgo", "gear", "הגדרות", "חיבור ל-Claude", { v: "settings", on: on("settings") })}
    ${it("m-news", "news", "מה חדש", "עדכוני גרסה · " + APP_VERSION)}
    ${it("m-about", "info", "אודות", "")}`;
  $("#drawerwrap").hidden = false;
  setTimeout(() => $("#drawer .ditem")?.focus(), 30);
}
function closeSettings() { const p = ui.prev && ui.prev !== "settings" && VIEWS[ui.prev] ? ui.prev : "home"; go(p); }
function closeMenu() { $("#drawerwrap").hidden = true; }
$("#drawerwrap").addEventListener("click", e => { if (e.target.id === "drawerwrap") closeMenu(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("#lightbox").hidden) closeLightbox(); else if (!$("#drawerwrap").hidden) closeMenu(); else if (!$("#sheetwrap").hidden) closeSheet(); } });
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
window.addEventListener("appinstalled", () => { installEvt = null; toast("ProLab הותקנה במסך הבית ✓"); });
const APP_URL = "https://gzfilm.github.io/prolab/";
Object.assign(ACTIONS_EXTRA, {
  menu() { if (!$("#drawerwrap").hidden) closeMenu(); else openMenu(); },
  "set-close"() { closeSettings(); },
  dgo(el) { closeMenu(); commitEdit(); if (el.dataset.v === "settings" && ui.view === "settings") { closeSettings(); return; } go(el.dataset.v); },
  "m-new"() { closeMenu(); ACTIONS.new(); },
  "m-backup"() { closeMenu(); doExport("json", !!navigator.canShare); },
  async "m-share"() {
    closeMenu();
    const data = { title: "ProLab", text: "ProLab · פירוק תסריט, שוטים ולו\"ז צילום · by G.Z MOTION LAB", url: APP_URL };
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    shareText(data.text + "\n" + APP_URL);
  },
  async "m-install"() {
    closeMenu();
    if (matchMedia("(display-mode: standalone)").matches) { toast("ProLab כבר מותקנת ופתוחה כאפליקציה ✓"); return; }
    if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (_) {} installEvt = null; return; }
    openSheet(`<h2>הוספה למסך הבית</h2><ol class="steps-list"><li>ב-Chrome לוחצים על התפריט ⋮ בפינה.</li><li>בוחרים <b>"הוסף למסך הבית"</b> או <b>"התקן אפליקציה"</b>.</li><li>ProLab תופיע עם אייקון משלה ותיפתח במסך מלא.</li></ol><p class="muted small">באייפון: כפתור השיתוף ב-Safari, ואז "הוסף למסך הבית".</p><div class="row"><button class="btn" data-act="sheet-close">הבנתי</button></div>`);
  },
  "m-news"() { closeMenu(); openSheet(`<h2>מה חדש</h2><div class="changes">${CHANGES.map(([v, l]) => `<div><h3>גרסה ${v}</h3><ul>${l.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div><div class="row"><button class="btn" data-act="sheet-close">סגור</button></div>`); },
  "m-about"() { closeMenu(); openSheet(`<div class="logo">${LOGO("ab")}<div><div class="wm">Pro<em>Lab</em></div><small>by G.Z MOTION LAB</small></div></div>
    <p>מהתסריט ועד סוף יום הצילום, באפליקציה אחת:</p>
    <ul class="steps-list">
      <li><b>⚡ פירוק עצמאי</b> של תסריט: סצנות, לוקיישנים, דמויות ודיאלוגים. מיידי, בחינם ובלי אינטרנט.</li>
      <li><b>✦ פירוק חכם עם Claude</b> גם לתסריט לא מסודר או לרעיון של לקוח.</li>
      <li>עריכת התסריט, ותצוגה לפי סצנה, לפי דמות ולפי לוקיישן.</li>
      <li>שוטים וסטוריבורד, עם רפרנסים מהמצלמה.</li>
      <li>לו"ז צילום לפי ימים ושעות, ורשימת "חובה לצלם".</li>
      <li>מצב סט, סימוני סאונד, 🥃 Whisky Shot ו-🥂 צ'ירס.</li>
      <li>רעיונות, שדרוגים ומעברים לעריכה, וייצוא ל-PDF, Word ו-HTML לצוות.</li>
    </ul>
    <p class="muted small">גרסה ${APP_VERSION} · ההצעות החכמות מבוססות על Claude של Anthropic · הנתונים נשמרים רק במכשיר שלך.</p>
    <div class="row"><button class="btn" data-act="sheet-close">סגור</button></div>`); }
});

/* ================= reference lightbox ================= */
let lbTimer = null;
let lbCtx = null;
function openLightbox(src, ctx) {
  lbCtx = ctx || null; const del = $("#lbdel"); del.hidden = !lbCtx; del.textContent = "🗑 מחק"; del.dataset.armed = "";
  const lb = $("#lightbox"), fig = $("#lbfig");
  $("#lbimg").src = src; fig.classList.remove("pinned"); $("#lbcap").textContent = "נגיעה בתמונה משאירה אותה פתוחה";
  const bar = $("#lbbar"); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
  lb.hidden = false; clearTimeout(lbTimer); lbTimer = setTimeout(closeLightbox, 3000);
}
function closeLightbox() { clearTimeout(lbTimer); $("#lightbox").hidden = true; }
$("#lbimg").addEventListener("click", e => {
  e.stopPropagation(); const fig = $("#lbfig");
  if (fig.classList.contains("pinned")) { closeLightbox(); return; }
  clearTimeout(lbTimer); fig.classList.add("pinned"); $("#lbcap").textContent = "📌 נשארת פתוחה · נגיעה נוספת סוגרת";
});
$("#lbx").addEventListener("click", e => { e.stopPropagation(); closeLightbox(); });
$("#lbdel").addEventListener("click", e => {
  e.stopPropagation(); const b = e.currentTarget; clearTimeout(lbTimer); $("#lbfig").classList.add("pinned");
  if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "לחץ שוב למחיקה"; return; }
  closeLightbox(); if (lbCtx) ACTIONS["ref-del"]({ dataset: { shot: lbCtx.shot, ref: lbCtx.ref } }); toast("הרפרנס נמחק");
});
$("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") closeLightbox(); });

/* ================= render + routing ================= */
const NEEDS_P = ["script", "shots", "plan", "set", "cut", "ai", "whisky", "cheers"];
function render() {
  const v = VIEWS[ui.view] ? ui.view : "home";
  fid = 0;
  const main = $("#main");
  const scroll = (main.querySelector(".body") || {}).scrollTop || 0;
  main.innerHTML = VIEWS[v]();
  const railMap = { new: "home", ai: "script", whisky: "set", cheers: "set" };
  $$(".rail button").forEach(b => { b.classList.toggle("on", b.dataset.view === (railMap[v] || v)); if (NEEDS_P.includes(b.dataset.view)) b.disabled = !P; });
  if (render.keepScroll) { const b = main.querySelector(".body"); if (b) b.scrollTop = scroll; }
  render.keepScroll = false;
  hydrateImages(main);
  if (ui.focus) {
    const el = document.getElementById(ui.focus);
    if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800); }
    ui.focus = null;
  }
  if (ui.edit) { const t = $("#etext"); if (t && render.focusEdit) { t.focus(); render.focusEdit = false; } }
}
function go(v, opts = {}) {
  if (v === ui.view && !opts.force) { render(); return; }
  if (v === "settings" && ui.view !== "settings") ui.prev = ui.view;
  ui.view = v; ui.edit = null; ui.editHead = false;
  if (location.hash.slice(1) !== v) history.pushState(null, "", "#" + v);
  render();
}
window.addEventListener("popstate", () => { const v = location.hash.slice(1) || "home"; ui.view = VIEWS[v] ? v : "home"; ui.edit = null; render(); });
function rerender() { render.keepScroll = true; render(); }

/* ================= actions ================= */
function findShot(id) { for (const s of P.scenes) for (const x of s.shots) if (x.id === id) return { s, x }; return null; }
function markDirty(s) { if (s.shots.length) s.dirty = true; }
function commitEdit() {
  if (!ui.edit) return;
  const s = P.scenes.find(x => x.id === ui.edit.scene); const b = s && s.blocks[ui.edit.i];
  if (!b) { ui.edit = null; return; }
  const t = $("#etext"), sp = $("#espk"), pa = $("#epar");
  if (t) { const nx = t.value.trim(); if (nx !== b.x) { b.x = nx; markDirty(s); } }
  if (sp) { const v = sp.value; if (v && v !== "__new") { if (b.t !== "d" || b.c !== v) markDirty(s); b.t = "d"; b.c = v; } else if (!v) { if (b.t !== "a") markDirty(s); b.t = "a"; b.c = ""; b.p = ""; } }
  if (pa && b.t === "d") b.p = pa.value.trim();
  if (!b.x) s.blocks.splice(ui.edit.i, 1);
  syncSceneChars(s);
  save();
}
function syncSceneChars(s) { const set = new Set(s.characters || []); s.blocks.forEach(b => { if (b.t === "d" && b.c) set.add(b.c); }); s.characters = [...set]; }
async function runAI(fn) { try { await fn(); } catch (e) { /* status already shown */ } }

const ACTIONS = {
  new() { ui.wiz = null; go("new"); },
  open(el) { const p = projects.find(x => x.id === el.dataset.id); if (p) { P = p; ui.scene = ui.shScene = ui.char = ui.loc = null; ui.setDay = 1; ui.setShot = null; ui.planRemainSet = false; ui.undo = []; go(p.scenes.length ? "script" : "new"); } },
  "wiz-type"(el) { const k = ui.wiz.type = el.dataset.k; if (k === "mitzvah" && ui.wiz.hours > 6) ui.wiz.hours = 6; if (k !== "mitzvah" && ui.wiz.hours === 6 && !ui.wiz.touched) ui.wiz.hours = 8; rerender(); },
  "wiz-src"(el) { ui.wiz.text = ($("#wtext") || {}).value ?? ui.wiz.text; ui.wiz.src = el.dataset.k; rerender(); if (el.dataset.k === "file") $("#fScript").click(); },
  "wiz-file"() { $("#fScript").click(); },
  "wiz-back"() { if ($("#wtext")) ui.wiz.text = $("#wtext").value; ui.wiz.step = Math.max(1, ui.wiz.step - 1); render(); },
  "wiz-next"() {
    const w = ui.wiz;
    if (w.step === 2) { w.text = $("#wtext").value; if (w.text.trim().length < 10) { toast(w.src === "idea" ? "כתוב 2-3 משפטים על הסרט." : "צריך קודם טקסט: קובץ או הדבקה."); return; } }
    w.step = Math.min(3, w.step + 1); render();
  },
  "wiz-hours"(el) { ui.wiz.hours = +el.dataset.h; ui.wiz.call = $("#wcall").value || ui.wiz.call; rerender(); },
  "wiz-days"(el) { ui.wiz.days = +el.dataset.d; ui.wiz.call = $("#wcall").value || ui.wiz.call; rerender(); },
  "wiz-quick"() {
    const w = ui.wiz; w.call = $("#wcall").value || "07:00";
    const r = localBreakdown(w.text, w.type);
    if (!r) { openSheet(`<h2>לא זיהיתי סצנות</h2><p>הפירוק המהיר מחפש כותרות סצנה, למשל:</p><p class="mono" dir="auto">פנים. החדר של יונתן - בוקר<br>EXT. BEACH - SUNSET<br>סצנה 3: חוף הים, שקיעה</p><p class="muted">אפשר להוסיף כותרות כאלה לתסריט, או להשתמש ב-✦ פירוק חכם עם Claude, שמבין גם טקסט לא מסודר.</p><div class="row"><button class="btn" data-act="sheet-close">הבנתי</button></div>`); return; }
    P = { id: uid(), v: 2, created: Date.now(), type: w.type, days: w.type === "mitzvah" ? 1 : w.days, hours: w.hours, call: w.call, source: w.text.slice(0, 60000), title: r.title, logline: "", inferred: false, quick: true, characters: r.chars, scenes: r.scenes, transitions: [], must: null, notes: [], whisky: {} };
    fitPlan(); attachSourceFile(w); projects.push(P); save(); ui.wiz = null; ui.scene = null; ui.sub = "scenes"; go("script");
    toast(`⚡ ${r.scenes.length} סצנות · ${r.chars.length} דמויות · בלי Claude`);
  },
  "wiz-run"() {
    const w = ui.wiz; w.call = $("#wcall").value || "07:00";
    runAI(async () => {
      const text = w.src === "idea" ? "CLIENT BRIEF / IDEA (no script yet):\n" + w.text : w.text;
      const r = await ask(pBreakdown(text, w.type, w), "מפרק את התסריט");
      const { chars, scenes } = normBreakdown(r);
      if (!scenes.length) { sayStatus("לא זוהו סצנות. נסה להוסיף עוד פרטים.", true); return; }
      P = { id: uid(), v: 2, created: Date.now(), type: w.type, days: w.type === "mitzvah" ? 1 : w.days, hours: w.hours, call: w.call, source: w.text.slice(0, 60000), title: r.title || "פרויקט חדש", logline: r.logline || "", inferred: !!r.inferred || w.src === "idea", characters: chars, scenes, transitions: [], must: null, notes: [], whisky: {} };
      fitPlan(); attachSourceFile(w); projects.push(P); save(); ui.wiz = null; ui.scene = null; ui.sub = "scenes"; go("script");
      try { await makeMust(); render(); } catch (_) {}
    });
  },
  sub(el) { commitEdit(); ui.edit = null; ui.sub = el.dataset.k; render(); },
  scene(el) { commitEdit(); ui.edit = null; ui.editHead = false; ui.scene = el.dataset.id; rerender(); },
  char(el) { ui.char = el.dataset.k; rerender(); },
  loc(el) { ui.loc = el.dataset.k; rerender(); },
  "goto-scene"(el) { ui.scene = el.dataset.id; ui.sub = "scenes"; render(); },
  "goto-line"(el) { ui.scene = el.dataset.id; ui.sub = "scenes"; ui.edit = { scene: el.dataset.id, i: +el.dataset.i }; render.focusEdit = true; render(); },
  ed(el) { commitEdit(); ui.edit = { scene: curScene().id, i: +el.dataset.i }; render.focusEdit = true; rerender(); },
  "ed-done"() { commitEdit(); ui.edit = null; rerender(); },
  "ed-move"(el) { commitEdit(); const s = curScene(), i = ui.edit.i, j = i + +el.dataset.d; if (j < 0 || j >= s.blocks.length) return; [s.blocks[i], s.blocks[j]] = [s.blocks[j], s.blocks[i]]; ui.edit.i = j; markDirty(s); save(); rerender(); },
  "ed-add"(el) { commitEdit(); const s = curScene(), i = ui.edit ? ui.edit.i : s.blocks.length - 1; const prev = s.blocks[i]; const nb = el.dataset.t === "d" ? { t: "d", c: prev && prev.t === "d" ? "" : (P.characters[0] || {}).name || "", p: "", x: "" } : { t: "a", c: "", p: "", x: "" }; s.blocks.splice(i + 1, 0, nb); ui.edit = { scene: s.id, i: i + 1 }; render.focusEdit = true; markDirty(s); rerender(); },
  "ed-del"() { const s = curScene(); s.blocks.splice(ui.edit.i, 1); ui.edit = null; markDirty(s); save(); rerender(); },
  "line-add"() { commitEdit(); const s = curScene(); s.blocks.push({ t: "a", c: "", p: "", x: "" }); ui.edit = { scene: s.id, i: s.blocks.length - 1 }; render.focusEdit = true; markDirty(s); rerender(); },
  undirty() { curScene().dirty = false; save(); rerender(); },
  "head-edit"() { ui.editHead = true; rerender(); },
  "head-cancel"() { ui.editHead = false; rerender(); },
  "head-save"() { const s = curScene(); s.location = $("#hloc").value.trim() || s.location; s.intExt = $("#hie").value; s.time = $("#htime").value; s.estMinutes = Math.max(5, +$("#hest").value || s.estMinutes); s.summary = $("#hsum").value.trim(); s.heading = `${s.intExt}. ${s.location} - ${s.time}`; ui.editHead = false; save(); rerender(); },
  "scene-add"() { commitEdit(); const s = newScene({ n: P.scenes.length + 1, location: "לוקיישן חדש", summary: "סצנה חדשה", heading: "INT. לוקיישן חדש - DAY" }); P.scenes.push(s); ui.scene = s.id; ui.editHead = true; save(); render(); },
  "scene-del"(el) { if (el.dataset.armed !== "1") { el.dataset.armed = "1"; el.textContent = "לחץ שוב למחיקה"; return; } const s = curScene(); P.scenes = P.scenes.filter(x => x !== s); renumber(); ui.scene = null; ui.editHead = false; save(); render(); },
  "ai-open"() { commitEdit(); ui.edit = null; ui.aiScene = curScene().id; go("ai"); },
  tone(el) { ui.tone = el.dataset.k; rerender(); },
  "ai-run"() {
    const s = P.scenes.find(x => x.id === ui.aiScene) || curScene();
    runAI(async () => {
      const r = await ask(pUpgrade(s, ui.tone), "Claude מחפש שדרוגים לסצנה " + s.n);
      const items = (Array.isArray(r.suggestions) ? r.suggestions : []).filter(x => x && x.title).map(x => ({ kind: x.kind || "structure", title: String(x.title), text: String(x.text || ""), apply: x.apply && typeof x.apply === "object" ? x.apply : null }));
      s.ai = { tone: ui.tone, items: items.concat(((s.ai && s.ai.items) || []).filter(c => !c.used)).slice(0, 12) };
      save(); render();
    });
  },
  "ai-dismiss"(el) { const s = P.scenes.find(x => x.id === ui.aiScene) || curScene(); s.ai.items.splice(+el.dataset.i, 1); save(); rerender(); },
  "ai-apply"(el) {
    const s = P.scenes.find(x => x.id === ui.aiScene) || curScene(); const c = s.ai.items[+el.dataset.i]; const ap = c.apply;
    if (!ap) { (P.notes = P.notes || []).push({ id: uid(), scope: "scene", ref: s.id, cat: "gen", text: "✦ " + c.title + ": " + c.text, done: false, at: Date.now() }); toast("נשמר כהערה לסצנה"); }
    else if (ap.type === "replace_line") { const b = s.blocks[ap.index]; if (b) { b.x = ap.text; if (ap.speaker) { b.t = "d"; b.c = ap.speaker; } markDirty(s); toast("השורה הוחלפה"); } else { toast("השורה כבר לא קיימת. נשמר כהערה."); (P.notes = P.notes || []).push({ id: uid(), scope: "scene", ref: s.id, cat: "gen", text: "✦ " + ap.text, done: false }); } }
    else if (ap.type === "add_lines") { const at = clamp((+ap.after) + 1, 0, s.blocks.length); s.blocks.splice(at, 0, ...(ap.lines || []).filter(l => l && l.x).map(l => ({ t: l.t === "d" ? "d" : "a", c: l.c || "", p: "", x: String(l.x) }))); syncSceneChars(s); markDirty(s); toast("נוסף לתסריט"); }
    else if (ap.type === "add_shot" && ap.shot) { const x = normShot(ap.shot, ""); x.creative = true; s.shots.push(x); recode(s); if (isMitz()) { x.minutes = Math.min(x.minutes, 5); } toast("השוט נוסף ל-" + x.code + (budgeted() ? " · " + sceneMin(s) + " דק׳ לסצנה" : "")); }
    else if (ap.type === "transition") { P.transitions = (P.transitions || []).filter(t => t.from !== s.n); P.transitions.push({ from: s.n, to: s.n + 1, type: ap.name || "Cut", idea: ap.idea || "", shoot: ap.shoot || "" }); toast("המעבר נשמר"); }
    c.used = true; save(); rerender();
  },
  shs(el) { ui.shScene = el.dataset.id; rerender(); },
  gen1(el) {
    const s = P.scenes.find(x => x.id === el.dataset.id) || shScene();
    if (CFG.mode === "local") { ui.shScene = s.id; ACTIONS["quick-shots"]({ dataset: {} }); if (ui.view !== "shots") go("shots"); return; }
    runAI(async () => { const r = await ask(pShots(s), "יוצר שוטים לסצנה " + s.n); applyShots(s, r); save(); ui.shScene = s.id; if (ui.view !== "shots") go("shots"); else render(); });
  },
  genall() {
    if (CFG.mode === "local") { ACTIONS["quick-shots"]({ dataset: { all: "1" } }); return; }
    runAI(async () => {
      for (const s of P.scenes.filter(x => !x.shots.length)) { ui.shScene = s.id; render(); const r = await ask(pShots(s), `יוצר שוטים לסצנה ${s.n} מתוך ${P.scenes.length}`); applyShots(s, r); save(); render(); }
    });
  },
  "quick-shots"(el) {
    const targets = el.dataset.all ? P.scenes.filter(x => !x.shots.length) : [shScene()];
    targets.forEach(s => { s.shots = s.shots.filter(x => x.status !== "left" || (x.refs || []).length).concat(quickShots(s).map(x => normShot(x, ""))); recode(s); s.dirty = false; fitShots(s); });
    save(); toast(targets.length > 1 ? `⚡ כיסוי בסיסי ל-${targets.length} סצנות` : "⚡ כיסוי בסיסי נוצר"); rerender();
  },
  "shot-new"() { const s = shScene(); const x = normShot({ size: "MS", desc: "שוט חדש", minutes: 10, figures: (s.characters || []).slice(0, 1).map(n => ({ name: n, x: 50 })) }, ""); s.shots.push(x); recode(s); save(); openShotSheet(x.id); },
  "shot-edit"(el) { openShotSheet(el.dataset.id); },
  "shot-move"(el) { const f = findShot(el.dataset.id); if (!f) return; const a = f.s.shots, i = a.indexOf(f.x), j = i + +el.dataset.d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; recode(f.s); save(); rerender(); },
  "ref-cam"(el) { refTarget = el.dataset.shot; $("#fCam").click(); },
  "ref-gal"(el) { refTarget = el.dataset.shot; $("#fGal").click(); },
  "ref-link"(el) {
    const id = el.dataset.shot;
    openSheet(`<h2>🔗 קישור לרפרנס</h2><p class="muted small">יוטיוב, אינסטגרם, פינטרסט, Vimeo או כל קישור אחר.</p><input type="url" id="rlink" placeholder="https://" dir="ltr"><div class="row"><button class="btn primary" id="rsave">שמור</button><button class="btn" data-act="sheet-close">ביטול</button></div>`);
    $("#rsave").onclick = () => { let u = $("#rlink").value.trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = "https://" + u; const f = findShot(id); (f.x.refs = f.x.refs || []).push({ id: uid(), type: "link", url: u }); save(); closeSheet(); rerender(); };
    setTimeout(() => $("#rlink")?.focus(), 50);
  },
  "ref-del"(el) { const f = findShot(el.dataset.shot); const r = f.x.refs.find(r => r.id === el.dataset.ref); f.x.refs = f.x.refs.filter(x => x !== r); if (r && r.img) IDB.delImg(r.img).catch(() => {}); save(); rerender(); },
  st(el) {
    const id = el.dataset.id, k = el.dataset.k; let o = null;
    if (k === "scene") o = P.scenes.find(s => s.id === id);
    if (k === "shot") { const f = findShot(id); o = f && f.x; }
    if (k === "must") (P.must && P.must.groups || []).forEach(g => g.items.forEach(i => { if (i.id === id) o = i; }));
    if (o) { setStatus(k, id, ST[(ST.indexOf(o.status || "left") + 1) % ST.length]); rerender(); }
  },
  undo() {
    const batch = (ui.undo || []).pop(); if (!batch) return;
    batch.forEach(u => { const o = statusObj(u.kind, u.id); if (o) o.status = u.prev; });
    save(); toast(batch.length > 1 ? `בוטל: ${batch.length} סימונים חזרו` : "הסימון בוטל"); rerender();
  },
  "reset-progress"() {
    openSheet(`<h2>↺ לאפס את כל הסימונים?</h2><p>כל מה שסומן <b>Shot ✓</b> או <b>Partial</b> בפרויקט יחזור ל-<b>Left</b>, כאילו עוד לא צילמת. התסריט, השוטים וההערות נשארים כמו שהם.</p>
      <label class="row small"><input type="checkbox" id="rcut"> להחזיר גם את מה שסומן <b>Cut ✕</b></label>
      <p class="muted small">אפשר לבטל את האיפוס בכפתור "↩ בטל סימון".</p>
      <div class="row"><button class="btn danger" id="rgo">אפס</button><button class="btn" data-act="sheet-close">ביטול</button></div>`);
    $("#rgo").onclick = () => {
      const withCut = $("#rcut").checked, batch = [];
      const reset = (kind, o) => { const st = o.status || "left"; if (st === "shot" || st === "part" || (withCut && st === "cut")) { batch.push({ kind, id: o.id, prev: st }); o.status = "left"; } };
      P.scenes.forEach(s => { reset("scene", s); s.shots.forEach(x => reset("shot", x)); });
      if (batch.length) (ui.undo = ui.undo || []).push(batch);
      save(); closeSheet(); ui.setShot = null; toast(`אופס: ${batch.length} סימונים`); rerender();
    };
  },
  pin(el) {},
  "src-open"() { openSource(); },
  "src-goto"(el) { closeSheet(); ui.scene = el.dataset.id; ui.sub = "scenes"; go("script", { force: true }); },
  async "src-file"() {
    const b = await IDB.getImg(P.srcFile.id).catch(() => null);
    if (!b) { toast("הקובץ המקורי לא נמצא במכשיר."); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.target = "_blank"; a.rel = "noopener";
    if (!/pdf|text/.test(P.srcFile.type)) a.download = P.srcFile.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  },
  "list-go"(el) {
    const id = el.dataset.id, to = el.dataset.to;
    if (to === "script") { ui.scene = id; ui.sub = "scenes"; ui.edit = null; rerender(); return; }
    if (to === "shots") { ui.shScene = id; go("shots"); return; }
    const s = P.scenes.find(x => x.id === id);
    if (s && (s.status === "cut")) { toast("הסצנה הזו סומנה Cut, ולכן היא לא בלו\"ז."); return; }
    if (s && hasProgress() && remMin(s) === 0) { ui.planRemain = false; ui.planRemainSet = true; }
    ui.focus = "pl-" + id; go("plan", { force: true });
  },
  "plan-remain"(el) { ui.planRemain = el.dataset.v === "1"; ui.planRemainSet = true; rerender(); },
  "plan-fit"() { if (!P.days && !isMitz()) P.days = Math.max(1, schedule().length); P.scenes.forEach(s => s.estMinutes = sceneBudget()); fitPlan(); save(); toast("כל הסצנות הותאמו: ~" + sceneBudget() + " דק׳ לסצנה"); rerender(); },
  hours(el) { P.hours = +el.dataset.h; fitPlan(); save(); rerender(); },
  pdays(el) { P.days = +el.dataset.d; fitPlan(); save(); rerender(); },
  must() { runAI(async () => { await makeMust(); render(); }); },
  "set-day"(el) { ui.setDay = +el.dataset.day; ui.setShot = null; if (ui.view !== "set") go("set"); else rerender(); },
  "set-pick"(el) { ui.setShot = el.dataset.id; rerender(); },
  "set-mark"(el) {
    const days = schedule(); const day = days[clamp(ui.setDay, 1, days.length) - 1]; const q = setQueue(day);
    const isDone = e => (e.x ? e.x.status : e.s.status) === "shot";
    const cur = q.find(e => (e.x ? e.x.id : e.s.id) === ui.setShot) || q.find(e => !isDone(e)); if (!cur) return;
    setStatus(cur.x ? "shot" : "scene", (cur.x || cur.s).id, el.dataset.s); ui.setShot = el.dataset.s === "left" ? (cur.x || cur.s).id : null;
    toast(el.dataset.s === "left" ? "הוחזר ל-Left" : STL[el.dataset.s] + " · " + (cur.x ? cur.x.code : "Sc " + cur.s.n) + " · אפשר לבטל ב-↩");
    if (navigator.vibrate) navigator.vibrate(30);
    rerender();
  },
  flag(el) {
    const days = schedule(); const day = days[clamp(ui.setDay, 1, days.length) - 1]; const q = setQueue(day);
    const isDone = e => (e.x ? e.x.status : e.s.status) === "shot";
    const cur = q.find(e => (e.x ? e.x.id : e.s.id) === ui.setShot) || q.find(e => !isDone(e)); if (!cur || !cur.x) return;
    const f = cur.x.flags = cur.x.flags || {}; f[el.dataset.f] = !f[el.dataset.f]; ui.setShot = cur.x.id; save(); rerender();
  },
  whisky(el) { if (el.dataset.day) ui.setDay = +el.dataset.day; go("whisky"); },
  "w-st"(el) { const dn = ui.setDay || 1; const W = P.whisky[dn]; const cur = W.st[el.dataset.k] || "left"; W.st[el.dataset.k] = el.dataset.v === "shot" ? (cur === "shot" ? "left" : "shot") : el.dataset.v; save(); rerender(); },
  "w-note"(el) { const n = (P.notes || []).find(n => n.id === el.dataset.id); if (n) { n.done = !n.done; save(); rerender(); } },
  "w-ai"() {
    const days = schedule(); const dn = clamp(ui.setDay || 1, 1, days.length);
    runAI(async () => { const r = await ask(pWhisky(days[dn - 1]), "Claude בודק מה אולי שכחת"); const W = P.whisky[dn]; W.ai = (W.ai || []).concat((Array.isArray(r.items) ? r.items : []).filter(i => i && i.title).map(i => ({ kind: i.kind || "other", title: String(i.title), text: String(i.text || "") }))); save(); render(); });
  },
  cheers() { if (ui.view === "cheers") { ui.view = "x"; } go("cheers", { force: true }); },
  "share-day"() {
    const days = schedule(); const dn = clamp(ui.setDay || 1, 1, days.length); const day = days[dn - 1]; const pr = progressOf(day.scenes);
    const txt = `🎬 ${P.title} · Day ${dn} · That's a wrap!\n${pr.nDone} מתוך ${pr.nShots} שוטים צולמו · ${day.scenes.length} סצנות.\nתודה לכל הצוות 🥂\n— ProLab · by G.Z MOTION LAB`;
    shareText(txt);
  },
  "share-plan"() { shareText(planText()); },
  "share-lines"() {
    const lines = []; P.scenes.forEach(s => s.blocks.forEach(b => { if (b.t === "d" && b.c === ui.char) lines.push(`Sc ${s.n}: ${b.p ? "(" + b.p + ") " : ""}${b.x}`); }));
    shareText(`${P.title} · השורות של ${ui.char}\n\n${lines.join("\n")}`);
  },
  trans() { runAI(async () => { const r = await ask(pTransitions(), "מחפש מעברים חכמים"); P.transitions = (Array.isArray(r.transitions) ? r.transitions : []).map(t => ({ from: +t.from, to: +t.to, type: t.type || "Cut", idea: t.idea || "", shoot: t.shoot || "" })); save(); render(); }); },
  x(el) { doExport(el.dataset.k, false); },
  xs(el) { doExport(el.dataset.k, true); },
  import() { $("#fJson").click(); },
  "home-del"(el) {
    const p = projects.find(x => x.id === el.dataset.id); if (!p) return;
    openSheet(`<h2>🗑 למחוק את "${esc(p.title || "פרויקט ללא שם")}"?</h2><p>הפרויקט, ההערות והרפרנסים שלו יימחקו מהמכשיר. אי אפשר לבטל.</p><p class="muted small">רוצה לשמור עותק? קודם "שמירה וגיבוי" מהתפריט ☰.</p>
      <div class="row"><button class="btn danger" id="hdYes">מחק</button><button class="btn" data-act="sheet-close">ביטול</button></div>`);
    $("#hdYes").onclick = () => { deleteProject(p); closeSheet(); toast("הפרויקט נמחק"); render(); };
  },
  "proj-del"(el) { if (el.dataset.armed !== "1") { el.dataset.armed = "1"; el.textContent = "לחץ שוב כדי למחוק את הפרויקט"; return; } deleteProject(P); go("home"); },
  "key-save"() { CFG.key = $("#apikey").value.trim(); if (CFG.key) CFG.mode = "api"; saveCfg(); render(); $("#keymsg").innerHTML = '<span class="ok">נשמר.</span>'; },
  "key-test"() {
    CFG.key = $("#apikey").value.trim(); saveCfg(); const m = $("#keymsg");
    if (!CFG.key) { m.textContent = "הדבק קודם מפתח."; return; }
    const old = CFG.mode; CFG.mode = "api";
    runAI(async () => { try { const r = await ask('Reply with only this JSON: {"ok":true}', "בודק חיבור"); $("#keymsg").innerHTML = r && r.ok ? '<span class="ok">החיבור עובד ✓</span>' : "התקבלה תשובה לא צפויה."; saveCfg(); } catch (e) { $("#keymsg").textContent = errText(e); CFG.mode = old; saveCfg(); throw e; } });
  },
  demo() { const d = demo(); const ex = projects.find(p => p.id === d.id); if (ex) { P = ex; } else { projects.push(d); P = d; save(); } ui.setDay = 1; go("plan"); },
  "note-open"() { openNoteSheet("gen"); },
  "note-add"(el) { openNoteSheet(el.dataset.cat); },
  "note-done"(el) { const n = P.notes.find(n => n.id === el.dataset.id); if (n) { n.done = !n.done; save(); rerender(); } },
  "note-del"(el) { P.notes = P.notes.filter(n => n.id !== el.dataset.id); save(); rerender(); },
  "sheet-close"() { closeSheet(); }
};
document.addEventListener("click", e => {
  const im = e.target.closest(".ref img[data-img]"); if (im && im.src) { e.preventDefault(); openLightbox(im.src, im.dataset.shot ? { shot: im.dataset.shot, ref: im.dataset.ref } : null); return; }
  const g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); commitEdit(); go(g.dataset.go); return; }
  const v = e.target.closest(".rail [data-view]"); if (v) { commitEdit(); if (v.dataset.view === "settings" && ui.view === "settings") { closeSettings(); return; } go(v.dataset.view); return; }
  const a = e.target.closest("[data-act]");
  const fn = a && (ACTIONS[a.dataset.act] || ACTIONS_EXTRA[a.dataset.act]);
  if (fn && a.tagName !== "SELECT") { if (a.disabled) return; fn(a, e); }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.matches("select[data-act=pin]")) { const s = P.scenes.find(x => x.id === t.dataset.id); s.day = +t.value; save(); rerender(); return; }
  if (t.id === "pcall") { P.call = t.value || "07:00"; save(); rerender(); return; }
  if (t.id === "espk") { if (t.value === "__new") { openSheet(`<h2>דמות חדשה</h2><input type="text" id="cname" placeholder="שם הדמות"><div class="row"><button class="btn primary" id="csave">הוסף</button><button class="btn" data-act="sheet-close">ביטול</button></div>`); $("#csave").onclick = () => { const n = $("#cname").value.trim(); if (!n) return; if (!P.characters.find(c => c.name === n)) P.characters.push({ name: n, role: "supporting", desc: "" }); const s = curScene(); const b = s.blocks[ui.edit.i]; b.t = "d"; b.c = n; commitEdit(); closeSheet(); rerender(); }; return; } const pa = $("#epar"); if (pa) pa.hidden = !t.value; return; }
  if (t.name === "mode") { CFG.mode = t.value; saveCfg(); return; }
});
let qT = null;
document.addEventListener("input", e => {
  if (e.target.id === "q") { ui.q = e.target.value; clearTimeout(qT); qT = setTimeout(() => { const pos = e.target.selectionStart; rerender(); const q = $("#q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (_) {} } }, 250); }
  if (e.target.id === "wtext" && ui.wiz) ui.wiz.text = e.target.value;
});

function statusObj(kind, id) {
  if (kind === "scene") return P.scenes.find(s => s.id === id);
  if (kind === "shot") { const f = findShot(id); return f && f.x; }
  if (kind === "must") { let o = null; (P.must && P.must.groups || []).forEach(g => g.items.forEach(i => { if (i.id === id) o = i; })); return o; }
  return null;
}
function setStatus(kind, id, val) {
  const o = statusObj(kind, id); if (!o) return;
  (ui.undo = ui.undo || []).push([{ kind, id, prev: o.status || "left" }]); if (ui.undo.length > 40) ui.undo.shift();
  o.status = val; save();
}
function attachSourceFile(w) {
  if (!w.file || w.src !== "file") return;
  const id = uid(); P.srcFile = { id, name: w.fileName, type: w.file.type || "" };
  IDB.putImg(id, w.file).catch(() => { delete P.srcFile; });
}
function sourceText() {
  if (P.source && P.source.trim()) return { text: P.source, built: false };
  return { built: true, text: P.scenes.map(s => [`${s.n}. ${s.intExt}. ${s.location} - ${s.time}`].concat(s.blocks.map(b => b.t === "d" ? `${b.c}${b.p ? " (" + b.p + ")" : ""}: ${b.x}` : b.x)).join("\n")).join("\n\n") };
}
function openSource() {
  closeMenu();
  const { text, built } = sourceText(); let k = 0;
  const body = text.split("\n").map(l => {
    if (isHeading(l)) { k++; const sc = P.scenes[k - 1]; return `<div class="srch"><span class="scnum">${k}</span><b class="grow">${esc(l.trim())}</b>${sc ? `<button class="btn ghost sm2" data-act="src-goto" data-id="${sc.id}">פתח ←</button>` : ""}</div>`; }
    return `<div class="srl">${esc(l) || "&nbsp;"}</div>`;
  }).join("");
  openSheet(`<div class="row"><h2 class="grow">📄 התסריט המקורי</h2>${P.srcFile ? `<button class="btn teal" data-act="src-file">פתח את הקובץ (${esc(P.srcFile.name)})</button>` : ""}<button class="btn" data-act="sheet-close">✕ סגור</button></div>
    ${built ? `<p class="muted small">הטקסט המקורי לא נשמר בפרויקט הזה, אז זה התסריט כפי שהוא בפירוק.</p>` : `<p class="muted small">${k} כותרות סצנה זוהו. המספר ליד כל כותרת הוא מספר הסצנה בפירוק.</p>`}
    <div class="srcview">${body}</div>`);
}
function deleteProject(p) {
  IDB.del(p.id).catch(() => {});
  (p.scenes || []).forEach(s => (s.shots || []).forEach(x => (x.refs || []).forEach(r => { if (r.img) IDB.delImg(r.img).catch(() => {}); })));
  if (p.srcFile) IDB.delImg(p.srcFile.id).catch(() => {});
  projects = projects.filter(x => x !== p); if (P === p) P = null;
}
function applyShots(s, r) {
  const keep = s.shots.filter(x => x.status !== "left" || (x.refs || []).length);
  s.shots = keep.concat((Array.isArray(r.shots) ? r.shots : []).map(x => normShot(x, "")));
  recode(s); s.ideas = Array.isArray(r.ideas) ? r.ideas.map(String) : []; s.dirty = false;
  fitShots(s);
}
async function makeMust() {
  const r = await ask(pMust(), "בונה רשימת חובה לצלם");
  P.must = { groups: (Array.isArray(r.groups) ? r.groups : []).map(g => ({ name: g.name || "", items: (Array.isArray(g.items) ? g.items : []).map(i => ({ id: uid(), text: i.text || "", priority: i.priority === "nice" ? "nice" : "must", status: "left" })) })) };
  save();
}

function openShotSheet(id) {
  const f = findShot(id); if (!f) return; const x = f.x;
  const sizes = ["EWS", "WS", "FS", "MS", "2-SHOT", "OTS", "MCU", "CU", "ECU", "INSERT"];
  const angles = ["eye", "low", "high", "overhead", "dutch"];
  const moves = ["static", "push-in", "pull-out", "pan-left", "pan-right", "tilt-up", "tilt-down", "tracking", "handheld", "crane", "orbit"];
  const sel = (id, arr, v) => `<select id="${id}">${arr.map(o => `<option ${String(v).toLowerCase() === o.toLowerCase() ? "selected" : ""}>${o}</option>`).join("")}${arr.some(o => o.toLowerCase() === String(v).toLowerCase()) ? "" : `<option selected>${esc(v)}</option>`}</select>`;
  openSheet(`<h2>✎ שוט ${esc(x.code)}</h2><div id="sprev" style="max-width:360px">${frame(x, PAL_APP)}</div>
    <div class="formgrid"><label><span class="lbl">Size</span>${sel("xs", sizes, x.size)}</label><label><span class="lbl">Angle</span>${sel("xa", angles, x.angle)}</label><label><span class="lbl">Move</span>${sel("xm", moves, x.move)}</label>
    <label><span class="lbl">Lens</span><input type="text" id="xl" value="${esc(x.lens)}" dir="ltr"></label><label><span class="lbl">דקות</span><input type="number" id="xmin" min="1" value="${x.minutes}"></label></div>
    <label style="display:flex;flex-direction:column;gap:4px"><span class="lbl">מה רואים</span><input type="text" id="xd" value="${esc(x.desc)}"></label>
    <label style="display:flex;flex-direction:column;gap:4px"><span class="lbl">למה</span><input type="text" id="xp" value="${esc(x.purpose)}"></label>
    <label style="display:flex;flex-direction:column;gap:4px"><span class="lbl">דמויות בפריים (מופרדות בפסיק)</span><input type="text" id="xf" value="${esc((x.figures || []).map(g => g.name).join(", "))}"></label>
    <div class="row"><button class="btn primary" id="xsave">שמור</button><button class="btn" data-act="sheet-close">ביטול</button><span class="grow"></span><button class="btn danger" id="xdel">מחק שוט</button></div>`);
  const read = () => {
    const names = $("#xf").value.split(/[,،]/).map(s => s.trim()).filter(Boolean).slice(0, 3);
    return { size: $("#xs").value, angle: $("#xa").value, move: $("#xm").value, lens: $("#xl").value.trim(), minutes: Math.max(1, +$("#xmin").value || 10), desc: $("#xd").value.trim(), purpose: $("#xp").value.trim(),
      figures: names.map((n, i) => { const old = (x.figures || []).find(g => g.name === n); return { name: n, x: old ? old.x : (names.length === 1 ? 50 : 25 + i * (50 / Math.max(1, names.length - 1))) }; }) };
  };
  $("#sheet").onchange = () => { if (!$("#xf")) return; const t = Object.assign({}, x, read()); $("#sprev").innerHTML = frame(t, PAL_APP); };
  $("#xsave").onclick = () => { Object.assign(x, read()); save(); closeSheet(); rerender(); };
  $("#xdel").onclick = e => { if (e.target.dataset.armed !== "1") { e.target.dataset.armed = "1"; e.target.textContent = "לחץ שוב"; return; } f.s.shots = f.s.shots.filter(y => y !== x); recode(f.s); save(); closeSheet(); rerender(); };
}

/* ----- references: images ----- */
let refTarget = null;
async function shrink(file, max = 1280) {
  try {
    const bmp = await createImageBitmap(file);
    const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(r, "image/jpeg", .82));
  } catch (_) { return file; }
}
async function onRefFile(e) {
  const file = e.target.files[0]; e.target.value = ""; if (!file || !refTarget) return;
  const f = findShot(refTarget); if (!f) return;
  const blob = await shrink(file); const id = uid();
  try { await IDB.putImg(id, blob); } catch (_) { toast("לא הצלחתי לשמור את התמונה במכשיר."); return; }
  (f.x.refs = f.x.refs || []).push({ id: uid(), type: "img", img: id }); save(); toast("הרפרנס נשמר ל-" + f.x.code); rerender();
}
$("#fCam").addEventListener("change", onRefFile);
$("#fGal").addEventListener("change", onRefFile);

/* ----- script file reading ----- */
const loaded = {};
function loadScript(src) { return loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error("load " + src)); }; document.head.appendChild(s); })); }
async function readScriptFile(f) {
  const name = f.name.toLowerCase();
  const info = $("#srcinfo"); if (info) info.textContent = "קורא את " + f.name + "...";
  let text = "";
  try {
    if (name.endsWith(".docx") || /wordprocessingml/.test(f.type)) { await loadScript("vendor/mammoth.browser.min.js"); text = (await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value; }
    else if (name.endsWith(".pdf") || f.type === "application/pdf") {
      await loadScript("vendor/pdf.min.js"); const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
      const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise; const out = [];
      for (let i = 1; i <= doc.numPages; i++) { const c = await (await doc.getPage(i)).getTextContent(); out.push(c.items.map(it => it.str + (it.hasEOL ? "\n" : " ")).join("")); }
      text = out.join("\n\n");
    } else if (name.endsWith(".doc")) { toast("קבצי DOC ישנים לא נתמכים. שמור כ-DOCX או PDF."); return; }
    else text = await f.text();
  } catch (err) { toast("לא הצלחתי לקרוא את הקובץ. נסה להעתיק ולהדביק את הטקסט."); if (info) info.textContent = ""; return; }
  text = text.trim();
  if (ui.wiz) { ui.wiz.text = text; ui.wiz.fileName = f.name; ui.wiz.src = "file"; ui.wiz.file = f; }
  rerender();
  if (text.length < 20) toast("כמעט לא נמצא טקסט. אם זה PDF סרוק, העתק את הטקסט ידנית.");
}
$("#fScript").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) readScriptFile(f); });
$("#fJson").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (!j.scenes) throw 0; if (projects.find(p => p.id === j.id)) j.id = uid(); j.notes = j.notes || []; j.whisky = j.whisky || {}; projects.push(j); P = j; save(); toast("הפרויקט נפתח"); go("plan"); }
  catch (_) { toast("הקובץ הזה לא נראה כמו גיבוי של ProLab."); }
});

/* ================= sharing + exports ================= */
async function shareText(text) {
  if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(text); toast("הועתק. אפשר להדביק בוואטסאפ."); }
  catch (_) { openSheet(`<h2>להעתקה</h2><textarea readonly style="min-height:240px">${esc(text)}</textarea><div class="row"><button class="btn" data-act="sheet-close">סגור</button></div>`); }
}
function planText() {
  const days = schedule(); const out = [`🎬 ${P.title} · לו"ז צילום`];
  days.forEach(d => {
    out.push("", `Day ${d.n} · Call ${hhmm(toMin(P.call))} · Wrap ≈ ${hhmm(d.wrap)}`);
    d.items.forEach(it => {
      if (it.kind === "call") out.push(`${hhmm(it.t)} Call · הקמה`);
      else if (it.kind === "meal") out.push(`${hhmm(it.t)} הפסקת אוכל`);
      else if (it.kind === "loc") out.push(`📍 ${it.loc} (${it.ie} ${it.time})`);
      else out.push(`${hhmm(it.t)} Sc ${it.s.n} · ${it.s.summary} (${it.m}')`);
    });
  });
  out.push("", "— ProLab · by G.Z MOTION LAB");
  return out.join("\n");
}
const XCSS = `.smx{font-family:Assistant,Arial,sans-serif;color:#1d2a33;background:#fff;direction:rtl;line-height:1.45;font-size:13px}
.smx h1{font-family:Rubik,Arial,sans-serif;font-size:22px;margin:0 0 4px}.smx h2{font-family:Rubik,Arial,sans-serif;font-size:16px;margin:0 0 8px}.smx h3{font-size:14px;margin:6px 0}
.smx .blk{padding:14px 0;border-bottom:1px solid #c9d0cd}.smx .muted{color:#5d6b72}.smx .mono{font-family:"IBM Plex Mono",Consolas,monospace;font-size:11px}
.smx table{border-collapse:collapse;width:100%}.smx th{font:600 10px "IBM Plex Mono",monospace;color:#5d6b72;text-align:right;padding:4px 6px;border-bottom:1px solid #c9d0cd;text-transform:uppercase}
.smx td{padding:5px 6px;border-bottom:1px solid #e3e7e5;vertical-align:top}.smx tr.loc td{background:#eef0ee;font-weight:700}.smx tr.misc td{color:#5d6b72}.smx tr.sc td{font-weight:700}
.smx tr.sh td:nth-child(2){padding-right:16px}.smx tr.is-cut td:not(:last-child){text-decoration:line-through;color:#8a979d}
.smx .chip{font:600 11px Assistant,Arial,sans-serif;border:0;border-radius:99px;padding:3px 9px;white-space:nowrap;cursor:pointer}
.smx .chip[data-s=left]{background:#e3e8ec;color:#4a5a66}.smx .chip[data-s=shot]{background:#dbe8f5;color:#2b6699}.smx .chip[data-s=part]{background:#fbefcc;color:#9a6a00}.smx .chip[data-s=cut]{background:#f7dcde;color:#b7323e}
.smx .rem{display:block;font-weight:400;font-size:11px;color:#c4741a}.smx .nt{display:block;font-weight:400;font-size:11px;color:#5b4500;background:#fff4cc;padding:2px 6px;border-radius:4px;margin-top:2px}.smx .ed{display:block;font-weight:400;font-size:11px;color:#0f7466;min-height:1em}
.smx .sbg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.smx .sbg figure{margin:0;break-inside:avoid}.smx .sbg svg{width:100%;height:auto;display:block}.smx figcaption{font-size:11px;padding-top:3px}
.smx .grp{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 16px}.smx .it{display:flex;gap:6px;align-items:flex-start}
.smx .tr{padding:6px 0;border-bottom:1px dashed #e3a58c}.smx .tr b{color:#c4741a;font:600 11px "IBM Plex Mono",monospace}`;
function exportBody(interactive) {
  fpre = "xb"; const days = schedule(), pr = progressOf(P.scenes);
  const c = (s, id) => `<button class="chip" data-s="${s || "left"}" data-id="${id}">${STL[s || "left"]}</button>`;
  const notesOf = s => notesFor("scene", s.id).filter(n => !n.done).map(n => `<span class="nt">📝 ${esc(n.text)}</span>`).join("");
  let h = `<section class="blk"><h1>${esc(P.title || "ProLab")}</h1><div class="muted">${TYPE_LABEL[P.type]} · ${days.length} ימי צילום · ${Math.round(pr.total / 6) / 10}h · ${new Date().toLocaleDateString("he-IL")}</div>${P.logline ? `<p>${esc(P.logline)}</p>` : ""}
    <div class="muted">Cast: ${P.characters.map(c => esc(c.name) + (c.role === "lead" ? " (Lead)" : "")).join(" · ")}</div></section>`;
  days.forEach(d => {
    h += `<section class="blk"><h2>Day ${d.n} · Call ${hhmm(toMin(P.call))} · Wrap ≈ ${hhmm(d.wrap)}</h2><table><thead><tr><th>שעה</th><th>Sc</th><th>תיאור</th><th>Size · Move</th><th>זמן</th><th>סטטוס</th></tr></thead><tbody>`;
    d.items.forEach(it => {
      if (it.kind === "call") { h += `<tr class="misc"><td class="mono">${hhmm(it.t)}</td><td colspan="5">Call · הקמה (${it.m}')</td></tr>`; return; }
      if (it.kind === "meal") { h += `<tr class="misc"><td class="mono">${hhmm(it.t)}</td><td colspan="5">הפסקת אוכל (${it.m}')</td></tr>`; return; }
      if (it.kind === "loc") { h += `<tr class="loc"><td class="mono">${hhmm(it.t)}</td><td colspan="5">📍 ${esc(it.loc)} · ${esc(it.ie)} · ${esc(it.time)}</td></tr>`; return; }
      const s = it.s; let t = it.t;
      h += `<tr class="sc"><td class="mono">${hhmm(it.t)}</td><td class="mono">${s.n}</td><td><b>${s.n}. ${esc(s.intExt)}. ${esc(s.location)} - ${esc(s.time)}</b><br><span style="font-weight:400">${esc(s.summary)}</span>${remindersFor(s.n).map(r => `<span class="rem">✂ ${esc(r)}</span>`).join("")}${notesOf(s)}${interactive ? `<span class="ed" contenteditable="true" data-nt="${s.id}" aria-label="הערות"></span>` : ""}</td><td></td><td class="mono">${it.m}'</td><td>${s.shots.length ? "" : c(s.status, s.id)}</td></tr>`;
      s.shots.forEach(x => { h += `<tr class="sh ${x.status === "cut" ? "is-cut" : ""}"><td class="mono muted">${x.status === "cut" ? "" : hhmm(t)}</td><td class="mono">${esc(x.code)}</td><td>${esc(x.desc)}${(x.refs || []).filter(r => r.type === "link").map(r => ` <a href="${esc(r.url)}">🔗</a>`).join("")}</td><td class="mono">${esc(x.size)} · ${esc(x.move)}${x.lens ? " · " + esc(x.lens) : ""}</td><td class="mono">${x.minutes}'</td><td>${c(x.status, x.id)}</td></tr>`; if (x.status !== "cut") t += +x.minutes || 0; });
    });
    h += `</tbody></table></section>`;
  });
  if (P.must && P.must.groups && P.must.groups.length) { h += `<section class="blk"><h2>Must-Shoot · חובה לצלם</h2>`; P.must.groups.forEach(g => { h += `<h3>${esc(g.name)}</h3><div class="grp">${g.items.map(i => `<div class="it">${c(i.status, i.id)}<span>${esc(i.text)}${i.priority === "nice" ? ' <span class="muted">(nice)</span>' : ""}</span></div>`).join("")}</div>`; }); h += `</section>`; }
  if (P.transitions && P.transitions.length) h += `<section class="blk"><h2>Transitions · מעברים לעריכה</h2>${P.transitions.map(t => `<div class="tr"><b>${t.from}→${t.to} · ${esc(t.type)}</b><div>${esc(t.idea)}</div>${t.shoot ? `<div class="muted">✂ לצלם: ${esc(t.shoot)}</div>` : ""}</div>`).join("")}</section>`;
  const pnotes = (P.notes || []).filter(n => !n.done && n.scope !== "scene");
  if (pnotes.length) h += `<section class="blk"><h2>הערות</h2>${pnotes.map(n => `<div>${(NOTE_CAT[n.cat] || NOTE_CAT.gen)[1]} ${esc(n.text)}</div>`).join("")}</section>`;
  P.scenes.filter(s => s.shots.length).forEach(s => { h += `<section class="blk"><h2>Storyboard · Sc ${s.n} · ${esc(s.location)}</h2><div class="sbg">${s.shots.map(x => `<figure>${frame(x, PAL_PRINT)}<figcaption><b class="mono">${esc(x.code)} · ${esc(x.size)} · ${esc(x.move)}</b><br>${esc(x.desc)}</figcaption></figure>`).join("")}</div></section>`; });
  fpre = "sb"; return h;
}
function statusMap() { const m = {}; P.scenes.forEach(s => { m[s.id] = s.status; s.shots.forEach(x => m[x.id] = x.status); }); (P.must && P.must.groups || []).forEach(g => g.items.forEach(i => m[i.id] = i.status)); return m; }
function exportHTML() {
  const data = JSON.stringify({ pid: P.id, status: statusMap(), notes: {} }).replace(/</g, "\\u003c");
  const script = `(function(){var D=JSON.parse(document.getElementById("smdata").textContent),K="pl-"+D.pid,S={};try{S=JSON.parse(localStorage.getItem(K)||"{}")}catch(e){}
S.status=Object.assign({},D.status,S.status||{});S.notes=Object.assign({},D.notes,S.notes||{});var O=["left","shot","part","cut"],L={left:"Left",shot:"Shot \\u2713",part:"Partial",cut:"Cut \\u2715"};
function sv(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
function ap(){document.querySelectorAll(".chip[data-id]").forEach(function(b){var s=S.status[b.dataset.id]||"left";b.dataset.s=s;b.textContent=L[s];var tr=b.closest("tr");if(tr&&tr.classList.contains("sh"))tr.classList.toggle("is-cut",s==="cut")});
document.querySelectorAll("[data-nt]").forEach(function(n){if(document.activeElement!==n)n.textContent=S.notes[n.dataset.nt]||""})}
document.addEventListener("click",function(e){var b=e.target.closest(".chip[data-id]");if(!b)return;var c=S.status[b.dataset.id]||"left";S.status[b.dataset.id]=O[(O.indexOf(c)+1)%4];sv();ap()});
document.addEventListener("input",function(e){var n=e.target.closest("[data-nt]");if(n){S.notes[n.dataset.nt]=n.textContent;sv()}});
document.getElementById("pp").onclick=function(){window.print()};
document.getElementById("cp").onclick=function(){var d=document.getElementById("smdata");var old=d.textContent;d.textContent=JSON.stringify({pid:D.pid,status:S.status,notes:S.notes}).replace(/</g,"\\\\u003c");
var html="<!doctype html>"+document.documentElement.outerHTML;d.textContent=old;var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html"}));a.download=document.title.replace(/[^\\w\\u0590-\\u05FF -]/g,"")+" - updated.html";document.body.appendChild(a);a.click();a.remove()};
ap()})();`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(P.title || "ProLab")} · ProLab</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>body{margin:0;background:#fff}.page{max-width:900px;margin:0 auto;padding:16px}.tb{display:flex;gap:8px;flex-wrap:wrap;position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #c9d0cd;z-index:2}
.tb button{font:600 14px Assistant,Arial,sans-serif;padding:8px 14px;border-radius:8px;border:1px solid #c9d0cd;background:#fff;cursor:pointer}.tb .hint{font:12px Assistant,Arial,sans-serif;color:#5d6b72;align-self:center}
.tw{overflow-x:auto}@media print{.tb{display:none}tr{break-inside:avoid}}${XCSS}</style></head>
<body><div class="page smx"><div class="tb"><button id="pp">הדפס / PDF</button><button id="cp">שמור עותק מעודכן</button><span class="hint">הסימונים וההערות נשמרים בדפדפן הזה. לשיתוף הסטטוס, שלחו עותק מעודכן.</span></div>${exportBody(true).replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, "</table></div>")}<p class="muted" style="text-align:center;padding:12px">ProLab · by G.Z MOTION LAB</p></div>
<script type="application/json" id="smdata">${data}<\/script><script>${script}<\/script></body></html>`;
}
function exportDoc() {
  const days = schedule(); const td = 'style="border:1px solid #999;padding:4px;vertical-align:top"';
  let h = `<h1>${esc(P.title)}</h1><p>${TYPE_LABEL[P.type]} · ${esc(P.logline || "")}</p>`;
  days.forEach(d => {
    h += `<h2>Day ${d.n} · Call ${hhmm(toMin(P.call))} · Wrap ${hhmm(d.wrap)}</h2><table style="border-collapse:collapse;width:100%"><tr><th ${td}>שעה</th><th ${td}>Sc</th><th ${td}>תיאור</th><th ${td}>Size · Move</th><th ${td}>זמן</th><th ${td}>סטטוס</th><th ${td}>הערות</th></tr>`;
    d.items.forEach(it => {
      if (it.kind === "call" || it.kind === "meal") { h += `<tr><td ${td}>${hhmm(it.t)}</td><td ${td} colspan="6">${it.kind === "call" ? "Call · הקמה" : "הפסקת אוכל"} (${it.m}')</td></tr>`; return; }
      if (it.kind === "loc") { h += `<tr style="background:#eee"><td ${td}>${hhmm(it.t)}</td><td ${td} colspan="6"><b>${esc(it.loc)} · ${esc(it.ie)} · ${esc(it.time)}</b></td></tr>`; return; }
      const s = it.s; h += `<tr><td ${td}>${hhmm(it.t)}</td><td ${td}><b>${s.n}</b></td><td ${td}><b>${esc(s.summary)}</b></td><td ${td}></td><td ${td}>${it.m}'</td><td ${td}>${s.shots.length ? "" : STL[s.status || "left"]}</td><td ${td}>${notesFor("scene", s.id).map(n => esc(n.text)).join("<br>")}</td></tr>`;
      s.shots.forEach(x => { h += `<tr><td ${td}></td><td ${td}>${esc(x.code)}</td><td ${td}>${esc(x.desc)}</td><td ${td}>${esc(x.size)} · ${esc(x.angle)} · ${esc(x.move)} ${esc(x.lens)}</td><td ${td}>${x.minutes}'</td><td ${td}>${STL[x.status || "left"]}</td><td ${td}></td></tr>`; });
    });
    h += `</table>`;
  });
  if (P.must && P.must.groups) P.must.groups.forEach(g => { h += `<h3>${esc(g.name)}</h3><ul>${g.items.map(i => `<li>[${STL[i.status || "left"]}] ${esc(i.text)}</li>`).join("")}</ul>`; });
  if (P.transitions && P.transitions.length) h += `<h2>Transitions</h2><ul>${P.transitions.map(t => `<li><b>${t.from}→${t.to} ${esc(t.type)}:</b> ${esc(t.idea)} ${t.shoot ? "(לצלם: " + esc(t.shoot) + ")" : ""}</li>`).join("")}</ul>`;
  return `﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Arial;direction:rtl}</style></head><body dir="rtl">${h}</body></html>`;
}
function exportCSV() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`; const rows = [["Day", "Time", "Scene", "Shot", "Location", "INT/EXT", "Time of day", "Size", "Angle", "Move", "Lens", "Description", "Purpose", "Minutes", "Status", "Notes"]];
  schedule().forEach(d => d.items.forEach(it => {
    if (it.kind !== "scene") return; const s = it.s; let t = it.t;
    const nts = notesFor("scene", s.id).map(n => n.text).join(" | ");
    if (!s.shots.length) rows.push([d.n, hhmm(it.t), s.n, "", s.location, s.intExt, s.time, "", "", "", "", s.summary, "", it.m, STL[s.status || "left"], nts]);
    s.shots.forEach(x => { rows.push([d.n, x.status === "cut" ? "" : hhmm(t), s.n, x.code, s.location, s.intExt, s.time, x.size, x.angle, x.move, x.lens, x.desc, x.purpose, x.minutes, STL[x.status || "left"], nts]); if (x.status !== "cut") t += +x.minutes || 0; });
  }));
  return "﻿" + rows.map(r => r.map(q).join(",")).join("\r\n");
}
const fname = ext => { const t = (P.title || "").replace(/[^A-Za-z0-9 _-]/g, "").trim().replace(/\s+/g, "-"); return "ProLab-" + (/[A-Za-z]/.test(t) ? t + "-" : "") + new Date().toISOString().slice(0, 10) + "." + ext; };
async function doExport(kind, share) {
  if (kind === "pdf") {
    $("#printview").innerHTML = `<style>${XCSS}@page{size:A4;margin:12mm}tr{break-inside:avoid}.sbg figure{break-inside:avoid}</style><div class="smx">${exportBody(false)}</div>`;
    setTimeout(() => window.print(), 60); return;
  }
  const map = { html: [exportHTML, "text/html"], doc: [exportDoc, "application/msword"], csv: [exportCSV, "text/csv"], json: [() => JSON.stringify(P, null, 1), "application/json"] };
  const [fn, type] = map[kind]; const blob = new Blob([fn()], { type }); const name = fname(kind);
  if (share && navigator.canShare) {
    const file = new File([blob], name, { type });
    if (navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: P.title }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast("נשמר להורדות: " + name);
}

/* ================= demo ================= */
function demo() {
  const S = (n, heading, location, intExt, time, summary, chars, est, blocks) => newScene({ id: "d" + n, n, heading, location, intExt, time, summary, characters: chars, estMinutes: est, blocks });
  const p = { id: "demo", v: 2, demo: true, type: "mitzvah", hours: 6, call: "06:30", title: "יונתן בן 13", logline: "בבוקר של יום ההכנה לבר המצווה, סבא משה לוקח את יונתן לים ומלמד אותו מה זה להיות גדול.", inferred: false,
    characters: [{ name: "יונתן", role: "lead", desc: "חתן בר המצווה, ספורטיבי וביישן" }, { name: "סבא משה", role: "supporting", desc: "סבא חם ומצחיק" }, { name: "אמא", role: "supporting", desc: "" }, { name: "חזן", role: "extra", desc: "" }],
    scenes: [
      S(1, "INT. החדר של יונתן - MORNING", "החדר של יונתן", "INT", "MORNING", "יונתן מתחמק מהבוקר, וסבא קורא לו לים.", ["יונתן", "סבא משה"], 50, [{ t: "a", c: "", p: "", x: "יונתן (13) שוכב במיטה ומגלגל כדור טניס על התקרה. תפילין חדשות מונחות על השולחן, עדיין בניילון." }, { t: "d", c: "סבא משה", p: "מבעד לדלת", x: "יונתן, הים לא מחכה!" }, { t: "d", c: "יונתן", p: "", x: "עוד חמש דקות..." }, { t: "a", c: "", p: "", x: "הכדור נופל. יונתן מסתכל על התפילין." }]),
      S(2, "EXT. חוף הים - SUNSET", "חוף הים", "EXT", "SUNSET", "סבא ויונתן על הסלע, שיחה על להיות גדול.", ["יונתן", "סבא משה"], 45, [{ t: "a", c: "", p: "", x: "סבא ויונתן יושבים על סלע מול השקיעה." }, { t: "d", c: "סבא משה", p: "", x: "כשהייתי בן שלוש עשרה, אבא שלי אמר לי שלהיות גדול זה לדעת מתי לשתוק." }, { t: "d", c: "יונתן", p: "", x: "ומתי זה?" }, { t: "d", c: "סבא משה", p: "מחייך", x: "עכשיו." }]),
      S(3, "INT. בית הכנסת - DAY", "בית הכנסת", "INT", "DAY", "העלייה לתורה: יונתן קורא, המשפחה מתרגשת.", ["יונתן", "אמא", "חזן"], 40, [{ t: "a", c: "", p: "", x: "יונתן עומד ליד התורה, הטלית על כתפיו. אמא מוחה דמעה." }, { t: "d", c: "חזן", p: "", x: "יעמוד יונתן בן דוד, בר מצווה." }]),
      S(4, "EXT. חוף הים - DAY", "חוף הים", "EXT", "DAY", "סגירה: יונתן מוביל את סבא לאורך החוף.", ["יונתן", "סבא משה"], 40, [{ t: "a", c: "", p: "", x: "יונתן הולך לפני סבא לאורך המים, משאיר עקבות. סבא הולך בעקבות שלו." }])],
    transitions: [{ from: 1, to: 2, type: "Match Cut", idea: "הכדור נופל מהתקרה בחדר, ובקאט הבא כדור נוחת בחול באותו מקום בפריים.", shoot: "CU של כדור נוחת בחול, מאותה זווית כמו 1B" },
      { from: 2, to: 3, type: "Sound Bridge", idea: "רעש הגלים ממשיך ומתמזג בשירת הקהל בבית הכנסת.", shoot: "Wild track של גלים, 60 שניות" },
      { from: 3, to: 4, type: "Motion Match", idea: "הטלית מתנופפת בהילוך איטי, וממשיכים לדגל שמתנופף ברוח על החוף.", shoot: "Slow-mo של טלית ושל דגל, אותו כיוון תנועה" }],
    must: { groups: [{ name: "Family", items: [{ id: "m1", text: "תמונה משפחתית על החוף", priority: "must", status: "left" }, { id: "m2", text: "סבא ויונתן מתחבקים", priority: "must", status: "left" }] },
      { name: "Details & Props", items: [{ id: "m3", text: "התפילין בניילון, Insert", priority: "must", status: "shot" }, { id: "m4", text: "עקבות בחול", priority: "nice", status: "left" }] }] },
    notes: [{ id: "n1", scope: "scene", ref: "d1", cat: "art", text: "לבקש מהמשפחה את התפילין האמיתיות", done: false }, { id: "n2", scope: "scene", ref: "d1", cat: "light", text: "חלון מזרחי, לצלם עד 08:00", done: false }, { id: "n3", scope: "loc", ref: "חוף הים", cat: "cam", text: "שקיעה 16:48. להיות מוכנים 16:15", done: false }, { id: "n4", scope: "loc", ref: "חוף הים", cat: "sound", text: "רוח חזקה: להביא דד-קאט", done: false }],
    whisky: {} };
  const sh = (s, arr) => { s.shots = arr.map((a, i) => Object.assign(normShot({ size: a[0], angle: a[1], move: a[2], lens: a[3], desc: a[4], purpose: a[5], minutes: a[6], figures: a[7], prop: a[8] || "", creative: !!a[9] }, ""), { status: a[10] || "left", flags: a[11] || {} })); recode(s); };
  sh(p.scenes[0], [["WS", "overhead", "static", "24mm", "Top shot על המיטה. יונתן קטן בתוך החדר.", "פתיחה ואווירה", 10, [{ name: "יונתן", x: 50 }], "", true, "shot"],
    ["CU", "low", "tilt-up", "50mm", "הכדור עולה לתקרה, המצלמה עוקבת למעלה.", "קצב ומשחק", 10, [{ name: "יונתן", x: 35 }], "כדור", false, "shot"],
    ["MS", "eye", "push-in", "35mm", "סבא בדלת: \"הים לא מחכה!\"", "דמות משנית נכנסת", 10, [{ name: "סבא משה", x: 70 }], "", false, "left", { nomic: true }],
    ["INSERT", "high", "static", "100mm", "התפילין בניילון על השולחן.", "הסמל של הסרט", 5, [], "תפילין", false, "part"],
    ["MCU", "eye", "static", "50mm", "יונתן מסתכל על התפילין.", "רגע רגשי, שקט", 8, [{ name: "יונתן", x: 62 }]]]);
  sh(p.scenes[1], [["EWS", "eye", "static", "24mm", "שתי צלליות על הסלע מול השקיעה.", "Establishing", 10, [{ name: "סבא", x: 42 }, { name: "יונתן", x: 56 }]],
    ["OTS", "eye", "static", "50mm", "מעבר לכתף של יונתן על סבא.", "השיחה", 12, [{ name: "סבא משה", x: 35 }, { name: "יונתן", x: 80 }], "", false, "left", { sound: true }],
    ["CU", "low", "orbit", "85mm", "יונתן מבין, השמש מאחוריו.", "הרגע של הסרט", 12, [{ name: "יונתן", x: 50 }], "", true],
    ["INSERT", "eye", "static", "100mm", "כדור נוחת בחול (Match cut).", "מעבר מסצנה 1", 5, [], "כדור בחול"]]);
  p.scenes[0].ideas = ["הכדור חוזר בכל הסרט כמוטיב: בחדר, בחוף, ובסוף ביד של סבא.", "לצלם את השוט הראשון והאחרון של הסרט מאותה זווית, כדי לסגור מעגל."];
  return p;
}

/* ================= boot ================= */
(async function boot() {
  $("#railmark").innerHTML = LOGO("r");
  try { await IDB.open(); projects = (await IDB.all()) || []; } catch (e) { toast("האחסון במכשיר לא זמין. הפרויקטים לא יישמרו אחרי סגירה."); }
  let seeded = false; try { seeded = localStorage.getItem("prolab-seeded") === "1"; localStorage.setItem("prolab-seeded", "1"); } catch (_) {}
  if (!projects.length && !seeded) { const d = demo(); projects.push(d); P = d; save(); }
  else if (!projects.length) P = null;
  else P = projects.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
  projects.forEach(p => { p.notes = p.notes || []; p.whisky = p.whisky || {}; (p.scenes || []).forEach(s => s.shots.forEach(x => { x.refs = x.refs || []; x.flags = x.flags || {}; })); });
  const v = location.hash.slice(1); ui.view = VIEWS[v] && v !== "cheers" ? v : "home";
  history.replaceState(null, "", "#" + ui.view);
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const hadCtl = !!navigator.serviceWorker.controller; let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadCtl && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(r => r.update()).catch(() => {});
  }
})();
