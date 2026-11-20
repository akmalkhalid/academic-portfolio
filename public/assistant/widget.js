/* ============================================================================================
   Site assistant for akmal.app  (public/assistant/widget.js)

   One file, no dependencies. Any page that loads it gets:
     - a glowing orb the visitor can drag anywhere, with a speech bubble that invites a question
     - a chat panel that answers about Dr. Akmal and the public pages of this site

   Everything runs in the visitor's browser. Nothing they type is sent to a server.

   How it is wired into the site
     - Next.js pages:   app/layout.tsx loads this file with <Script>.
     - Static pages in public/:   scripts/index-site.mjs adds the <script> tag after the build,
       to PUBLIC pages only (pages marked noindex, such as unlisted workshop kits, are left alone).
     - The knowledge lives in /assistant/data.json, fetched the first time the panel is opened:
         data = publications, grants, students, CV      (scripts/build-engine.mjs, before the build)
         site = passages from every public page         (scripts/index-site.mjs, after the build)

   Parts of this file
     A. Styles and markup (inside a shadow root, so no page can restyle it and it restyles no page)
     B. Orb, bubble and panel: dragging, idle fade, positioning
     C. Brain: search, ready-made answers, optional on-device language model
   ============================================================================================ */
(function(){
'use strict';
if(window.top!==window.self||window.AkmalAssistant)return;      // not inside embedded demos, and only once per page
const BASE=location.origin,DATA_URL='/assistant/data.json';

/* ---------- A. Styles and markup ---------- */
const CSS=`
:host{all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;
  --line:rgba(255,255,255,.12);--paper:#f4f2ff;--mute:#a9a4bd;--gen:#b6a8ff;--eva:#ff9b78;--sea:#4fd8c6;
  --display:'Space Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif;
  --body:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;
  --rule:linear-gradient(90deg,#21b3a0 0%,#4d8df0 34%,#8b7bf0 58%,#f2683f 100%);
  color-scheme:dark;font:400 16px/1.6 var(--body);color:var(--paper);-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}
a{color:inherit}
button,input{font:inherit;color:inherit}
input[type=text]{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:10px 12px;font-size:14.5px;outline:none}
input[type=text]:focus{border-color:#8b7bf0;box-shadow:0 0 0 3px rgba(139,123,240,.22)}
input::placeholder{color:rgba(214,208,240,.5)}
:focus-visible{outline:2px solid #8b7bf0;outline-offset:3px}
.mono{font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(214,208,240,.6)}
.live{width:8px;height:8px;border-radius:50%;background:#21b3a0;animation:liveDot 2.2s ease-out infinite;flex:0 0 auto}
@keyframes liveDot{0%{box-shadow:0 0 0 0 rgba(33,179,160,.5)}70%{box-shadow:0 0 0 9px rgba(33,179,160,0)}100%{box-shadow:0 0 0 0 rgba(33,179,160,0)}}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);cursor:pointer;font-size:14.5px;font-weight:500;color:#e4e0f5}
.btn.pri{color:#0a0812;background:#f4f2ff;border-color:#f4f2ff}
.btn.pri:hover:enabled{background:#fff}
.chip{font-family:var(--mono);font-size:12px;padding:6px 11px;border-radius:99px;border:1px solid var(--line);background:rgba(255,255,255,.03);cursor:pointer;color:var(--mute);white-space:nowrap}
.chip:hover{color:#fff;border-color:rgba(255,255,255,.4)}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
[hidden]{display:none!important}
#orb{position:fixed;z-index:3;width:58px;height:58px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(20,18,28,.5);backdrop-filter:blur(12px) saturate(1.6);-webkit-backdrop-filter:blur(12px) saturate(1.6);cursor:grab;touch-action:none;display:grid;place-items:center;transition:opacity .7s,transform .45s,box-shadow .45s,border-color .45s;box-shadow:0 0 34px -4px rgba(139,123,240,.75)}
#orb::before{content:'';position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(#21b3a0,#4d8df0,#8b7bf0,#f2683f,#21b3a0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));animation:spin 5s linear infinite;transition:opacity .7s}
#orb .core{position:relative;width:26px;height:26px;animation:spin 9s linear infinite reverse}
#orb .core i{position:absolute;width:8px;height:8px;border-radius:50%}
#orb .core i:nth-child(1){left:9px;top:0;background:var(--gen);box-shadow:0 0 10px var(--gen)}
#orb .core i:nth-child(2){left:0;bottom:2px;background:var(--eva);box-shadow:0 0 10px var(--eva)}
#orb .core i:nth-child(3){right:0;bottom:2px;background:var(--sea);box-shadow:0 0 10px var(--sea)}
@keyframes spin{to{transform:rotate(360deg)}}
#orb.drag{cursor:grabbing;transition:none}
#orb.idle{opacity:.5;transform:scale(.8);box-shadow:none;border-color:rgba(255,255,255,.14)}
#orb.idle::before{opacity:.25;animation-play-state:paused}
#orb.idle .core{animation-play-state:paused}
#orb:hover,#orb:focus-visible{opacity:1;transform:scale(1)}
#panel{position:fixed;z-index:2;width:min(392px,calc(100vw - 24px));height:min(540px,calc(100dvh - 96px));display:none;flex-direction:column;background:rgba(12,10,20,.97);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);border:1px solid rgba(255,255,255,.16);border-radius:16px;overflow:hidden;box-shadow:0 30px 90px -20px rgba(0,0,0,.85),0 0 60px -22px rgba(139,123,240,.9)}
#panel.open{display:flex;animation:pop .22s ease-out}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
#panel::before{content:'';display:block;height:2px;background:var(--rule);flex:0 0 auto}
#pHead{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
#pHead b{font-family:var(--display);font-weight:600;font-size:15px;margin-right:auto}
#pHead .mono{font-size:9.5px}
#pClose{width:28px;height:28px;border-radius:7px;border:1px solid var(--line);background:transparent;cursor:pointer;line-height:1;font-size:16px}
.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
.msg{max-width:92%;padding:10px 13px;border-radius:12px;font-size:14.5px;line-height:1.5;overflow-wrap:anywhere}
.msg.u{align-self:flex-end;background:#f4f2ff;color:#0a0812;border-bottom-right-radius:4px}
.msg.b{align-self:flex-start;background:rgba(255,255,255,.06);border:1px solid var(--line);border-bottom-left-radius:4px}
.msg ul{margin:6px 0 0;padding-left:18px}
.msg li{margin-bottom:4px}
.msg .mono{letter-spacing:.02em;text-transform:none;font-size:11px}
.msg .src{margin-top:8px;font-family:var(--mono);font-size:10.5px;color:var(--mute)}
.msg .go{margin-top:9px;padding-top:8px;border-top:1px solid var(--line);font-size:13px}
.msg .go a{color:var(--sea)}
.pre,.pick{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.pre button,.pick button{text-align:left;font:inherit;font-size:13.5px;color:var(--paper);background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:8px;padding:8px 11px;cursor:pointer;transition:border-color .15s,background .15s}
.pre button:hover,.pick button:hover:enabled{border-color:var(--gen);background:rgba(139,123,240,.14)}
.pick{margin-bottom:10px}
.pick button{padding:11px 12px}
.pick b{display:block;font-family:var(--display);font-size:15px;margin-bottom:3px}
.pick span{display:block;font-size:12.5px;color:var(--mute);line-height:1.45}
.pick button:disabled{opacity:.5;cursor:default}
.say input:disabled,.say .btn:disabled{opacity:.45;cursor:not-allowed}
.say{display:flex;gap:8px;padding:10px 14px}
.say input{flex:1;min-width:0}
.say .btn{padding:10px 16px}
.pfoot{display:flex;flex-direction:column;gap:7px;padding:10px 14px 12px;border-top:1px solid var(--line);background:rgba(255,255,255,.02)}
.pfoot .row{justify-content:space-between;flex-wrap:nowrap}
#llmStatus{font-family:var(--mono);font-size:10.5px;color:var(--mute);overflow-wrap:anywhere;line-height:1.5}
.meter{height:3px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden}
.meter i{display:block;height:100%;width:0;background:var(--rule)}
/* the speech bubble beside the orb */
#bubble{position:fixed;z-index:3;display:flex;align-items:stretch;max-width:min(250px,calc(100vw - 96px));background:#f4f2ff;color:#0a0812;border-radius:14px;box-shadow:0 14px 40px -12px rgba(0,0,0,.55),0 0 0 1px rgba(139,123,240,.35),0 0 34px -8px rgba(139,123,240,.8);transition:opacity .35s,transform .35s,visibility .35s;animation:bob 3.2s ease-in-out 1.2s infinite}
#bubble::after{content:'';position:absolute;top:50%;right:-5px;width:12px;height:12px;margin-top:-6px;background:#f4f2ff;transform:rotate(45deg);border-radius:2px}
#bubble.r::after{right:auto;left:-5px}
#bubble.off{opacity:0;visibility:hidden;transform:translateY(6px) scale(.96);pointer-events:none;animation:none}
#bubbleGo{flex:1;text-align:left;background:none;border:0;padding:10px 4px 10px 14px;cursor:pointer;color:inherit;border-radius:14px 0 0 14px}
#bubbleGo b{display:block;font-family:var(--display);font-weight:600;font-size:15px;line-height:1.25}
#bubbleGo span{display:block;font-size:12.5px;line-height:1.35;color:#4a4560;margin-top:2px}
#bubbleX{flex:0 0 auto;align-self:flex-start;background:none;border:0;cursor:pointer;color:#6b6680;font-size:17px;line-height:1;padding:8px 10px 8px 6px;border-radius:0 14px 0 0}
#bubbleX:hover{color:#0a0812}
@keyframes bob{0%,100%{translate:0 0}50%{translate:0 -4px}}
@media print{:host{display:none!important}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;
const HTML=`
<button id="orb" type="button" aria-label="Site assistant. Press Enter to open, arrow keys to move." aria-expanded="false" aria-controls="panel"><span class="core"><i></i><i></i><i></i></span></button>
<div id="bubble" class="off"><button id="bubbleGo" type="button"><b>Ask me anything</b><span>about Dr. Akmal or this site</span></button><button id="bubbleX" type="button" aria-label="Hide this tip">&times;</button></div>
<div id="panel" role="dialog" aria-label="Site assistant">
  <div id="pHead"><span class="live"></span><b>Ask this site</b><span class="mono">drag to move</span><button id="pClose" type="button" aria-label="Close the assistant">&times;</button></div>
  <div class="log" id="log" aria-live="polite"></div>
  <form class="say" id="say">
    <input id="ask-in" type="text" autocomplete="off" placeholder="Choose how to start, above" disabled aria-label="Your question">
    <button class="btn pri" type="submit">Ask</button>
  </form>
  <div class="pfoot">
    <div class="row"><div id="llmStatus">Open to begin</div><button class="chip" id="bLLM" type="button" hidden>Switch to smart assistant</button></div>
    <div class="meter"><i id="llmBar"></i></div>
  </div>
</div>`;
const host=document.createElement('div');host.id='akmal-assistant';
const root=host.attachShadow({mode:'open'});root.innerHTML='<style>'+CSS+'</style>'+HTML;
(document.body||document.documentElement).appendChild(host);
const $=s=>root.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mem=(box)=>({get(k){try{return box.getItem(k)}catch(e){return null}},set(k,v){try{box.setItem(k,v)}catch(e){}},del(k){try{box.removeItem(k)}catch(e){}}});
let local,session;try{local=mem(localStorage);session=mem(sessionStorage)}catch(e){local=session=mem({getItem(){return null},setItem(){},removeItem(){}})}

/* ---------- B. Orb, bubble and panel ---------- */
const orb=$('#orb'),panel=$('#panel'),bubble=$('#bubble'),S=58;
const POS='engine-orb';               // where the visitor left the orb
const USED='akmal-assistant-used';    // set once the visitor has opened the assistant: no more bubble
const TIPOFF='akmal-assistant-tip';   // set when the bubble is closed: stays away for this visit
let open=false,idleT=0,moved=false,pos=null,tipOn=false,brainStarted=false;
const isOpen=()=>open;
try{const v=JSON.parse(local.get(POS));if(v&&isFinite(v.x)&&isFinite(v.y))pos=v}catch(e){}
if(!pos)pos={x:innerWidth-S-22,y:innerHeight-S-22};
const save=()=>local.set(POS,JSON.stringify(pos));
function place(){const m=8;pos.x=Math.max(m,Math.min(innerWidth-S-m,pos.x));pos.y=Math.max(m,Math.min(innerHeight-S-m,pos.y));
  orb.style.left=pos.x+'px';orb.style.top=pos.y+'px';
  // bubble: to the left of the orb when there is room, otherwise to the right
  const bw=bubble.offsetWidth,bh=bubble.offsetHeight,left=pos.x-bw-14>=8;bubble.classList.toggle('r',!left);
  bubble.style.left=(left?pos.x-bw-14:pos.x+S+14)+'px';bubble.style.top=Math.max(8,Math.min(innerHeight-bh-8,pos.y+S/2-bh/2))+'px';
  if(open){const pw=panel.offsetWidth,ph=panel.offsetHeight,g=12;let px=pos.x+S-pw;if(px<g)px=Math.min(pos.x,innerWidth-pw-g);px=Math.max(g,px);
    let py=pos.y-ph-g;if(py<g)py=pos.y+S+g;if(py+ph>innerHeight-g){py=Math.max(g,Math.min(pos.y+S-ph,innerHeight-ph-g));py=Math.max(g,py);if(pos.x-pw-g>=g)px=pos.x-pw-g;else if(pos.x+S+g+pw<=innerWidth-g)px=pos.x+S+g}
    panel.style.left=px+'px';panel.style.top=py+'px'}}
// the orb fades into the page after 5 quiet seconds, but never while the bubble is showing
function wake(){orb.classList.remove('idle');clearTimeout(idleT);if(!open&&!tipOn)idleT=setTimeout(()=>orb.classList.add('idle'),5000)}
function tip(on,forget){tipOn=on;bubble.classList.toggle('off',!on);if(!on&&forget)session.set(TIPOFF,'1');place();wake()}
function toggle(v){open=v===undefined?!open:v;panel.classList.toggle('open',open);orb.setAttribute('aria-expanded',open);
  if(open){local.set(USED,'1');tip(false);startBrain()}
  place();wake();
  if(open&&matchMedia('(hover:hover)').matches&&!$('#ask-in').disabled)$('#ask-in').focus()}
function draggable(el,isOrb){let sx,sy,ox,oy,on=false;
  el.addEventListener('pointerdown',e=>{if(!isOrb&&e.target.closest('button'))return;on=true;moved=false;sx=e.clientX;sy=e.clientY;ox=pos.x;oy=pos.y;el.setPointerCapture(e.pointerId);wake()});
  el.addEventListener('pointermove',e=>{if(!on)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&Math.abs(dx)+Math.abs(dy)<6)return;moved=true;orb.classList.add('drag');pos.x=ox+dx;pos.y=oy+dy;place()});
  const end=()=>{if(!on)return;on=false;orb.classList.remove('drag');if(moved)save();wake()};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)}
draggable(orb,true);draggable($('#pHead'),false);
orb.addEventListener('click',()=>{if(moved){moved=false;return}toggle()});
orb.addEventListener('keydown',e=>{const d={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[e.key];if(!d)return;e.preventDefault();pos.x+=d[0];pos.y+=d[1];place();save();wake()});
orb.addEventListener('pointerenter',wake);orb.addEventListener('focus',wake);
$('#pClose').onclick=()=>{toggle(false);orb.focus()};
$('#bubbleGo').onclick=()=>toggle(true);
$('#bubbleX').onclick=()=>tip(false,true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){toggle(false);orb.focus()}});
addEventListener('resize',place);
place();wake();
// invite a question: shown to visitors who have not opened the assistant yet
if(!local.get(USED)&&!session.get(TIPOFF))setTimeout(()=>{if(open)return;tip(true);
  if(innerWidth<480)setTimeout(()=>{if(tipOn)tip(false,true)},9000)},1400);      // on phones it steps aside by itself
window.AkmalAssistant={open:()=>toggle(true),close:()=>toggle(false)};

/* ---------- C. Brain ---------- */
const P={gen:{verb:'Generate',name:'Generative & Agentic AI',q:'What could exist?',body:'Generative models, language models and agent teams propose candidates: levels, quests, puzzles, layouts, schedules.'},
  eva:{verb:'Evaluate',name:'Games Informatics & Engagement Modelling',q:'Is it any good, for people?',body:'Each candidate is scored by models of how people experience it, such as game refinement theory and the motion in mind model.'},
  sea:{verb:'Search',name:'Computational Intelligence & Optimization',q:'How do we find better ones?',body:'Evolutionary, immune and swarm algorithms decide what gets generated next. Quality-diversity archives such as MAP-Elites keep many different good answers.'}};
const ORDER=['gen','eva','sea'];
const pubUrl=p=>BASE+'/publications/'+p.g+'/';
// the records are fetched the first time the panel opens, so pages stay light for visitors who never ask
function startBrain(){if(brainStarted)return;brainStarted=true;$('#llmStatus').textContent='Loading the site records';
  fetch(DATA_URL).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>brain(j.data,j.site))
    .catch(()=>{brainStarted=false;$('#llmStatus').textContent='The site records could not be loaded. Close and reopen to try again.'})}

function brain(D,SITE){
  const KEY='engine-ai',NOW=new Date().getFullYear();
  const STOP=new Set('a an the of on in for to and or is are was were be been do does did what which who whom how many much he his him has have had with about any there their this that it its at as by from i me my you your can could would should tell show list give papers paper publications publication work works research dr akmal khalid where find page link site'.split(' '));
  const SYN={llm:['language','model','llms','large'],llms:['language','model','large'],pcg:['procedural','content','generation'],ga:['genetic','algorithm'],ai:['artificial','intelligence','ai'],malay:['malay','melayu','bahasa'],
    students:['supervision','phd','student'],student:['supervision','phd','student'],supervise:['supervision','phd','student'],phd:['phd','supervision'],funding:['grant','frgs'],grants:['grant','frgs'],
    swarm:['swarm','metaheuristic'],games:['game'],gaming:['game'],scheduling:['scheduling','schedule'],evacuation:['evacuation','crowd'],tools:['tool','toolkit'],newsletter:['newsletter','kopi'],job:['employment','career'],studied:['education','degree']};
  const tok=s=>s.toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/[\s-]+/).filter(w=>w.length>1&&!STOP.has(w)).map(w=>w.length>4&&w.endsWith('s')&&!w.endsWith('ss')?w.slice(0,-1):w);
  const docs=[];const add=(type,title,text,url,meta)=>docs.push({type,title,text,url,meta});
  D.pubs.forEach(p=>add('pub',p.t,`${p.t}. ${p.v}. ${p.y}. ${P[p.p].name}. ${p.a.join(', ')}`,pubUrl(p),p));
  D.grants.forEach(g=>add('grant',g.t,`${g.t}. ${g.ag}. grant funding ${g.role} ${g.s}-${g.e} ${g.st}. ${P[g.p].name}`,BASE+'/research/',g));
  D.students.forEach(s=>add('student',s.t,`${s.t}. ${s.d} student supervision ${s.r} ${s.st}. ${P[s.p].name}`,BASE+'/teaching/',s));
  ORDER.forEach(k=>add('pillar',P[k].name,`${P[k].verb}. ${P[k].name}. ${P[k].q} ${P[k].body}`,BASE+'/generative-optimization/',{k}));
  add('bio','Profile',D.cv.profile,BASE+'/about/');
  D.cv.employment.forEach(e=>add('career',e.role+', '+e.place,`employment career appointment position ${e.period} ${e.role} ${e.place}`,BASE+'/about/'));
  D.cv.education.forEach(e=>add('edu',e.degree+', '+e.place,`education degree ${e.period} ${e.degree} ${e.place} ${e.detail}`,BASE+'/cv/'));
  D.cv.membership.forEach(t=>add('member',t,`membership professional body ${t}`,BASE+'/cv/'));
  Object.entries(D.cv.skills).forEach(([k,v])=>add('skill',k+': '+v,`skills ${k} ${v}`,BASE+'/cv/'));
  D.cv.teaching.forEach(t=>add('teach',t.text,`teaching course ${t.text} ${t.when}`,BASE+'/teaching/'));
  D.cv.awards.forEach(t=>add('award',t,`award ${t}`,BASE+'/cv/'));
  D.cv.service.forEach(t=>add('service',t,`service ${t}`,BASE+'/cv/'));
  D.cv.ip.forEach(t=>add('ip',t.title,`training module workshop ${t.title} ${t.place} ${t.year}`,BASE+'/teaching/'));
  // every public page of the site, cut into passages by scripts/index-site.mjs after the build
  (SITE||[]).forEach(c=>add('page',c.t,`${c.t}. ${c.h}. ${c.x}`,BASE+c.u,c));
  const df={};let avg=0;docs.forEach(d=>{d.tk=tok(d.text);d.tf={};d.tk.forEach(w=>d.tf[w]=(d.tf[w]||0)+1);Object.keys(d.tf).forEach(w=>df[w]=(df[w]||0)+1);avg+=d.tk.length;if(d.type==='page')d.tt=new Set(tok(d.meta.t+' '+d.meta.u.replace(/[\/-]/g,' ')))});avg/=docs.length;
  function search(q,types,n=6){let qt=tok(q);qt=[...new Set(qt.flatMap(w=>[w,...(SYN[w]||[])]))];
    const yr=(q.match(/\b(19|20)\d{2}\b/g)||[]).map(Number);
    return{qt,hits:docs.filter(d=>!types||types.includes(d.type)).map(d=>{let s=0,mc=0;for(const w of qt){const f=d.tf[w];if(!f)continue;mc++;const idf=Math.log(1+(docs.length-df[w]+.5)/(df[w]+.5));s+=idf*f*2.2/(f+1.2*(.25+.75*d.tk.length/avg))}
      if(d.type==='pub'&&yr.length&&s>0&&yr.includes(d.meta.y))s*=1.5;
      let th=0;if(d.type==='page'&&s>0){th=qt.filter(w=>d.tt.has(w)).length;if(th)s*=1+.45*th;if(!d.meta.h)s*=1.15}
      return{d,s,th,mc}}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,n)}}
  // best public pages for a question, one entry per page
  function pagesFor(q,n=3,min=2.4){const seen=new Set(),out=[],one=tok(q).length<2;for(const x of search(q,['page'],24).hits){if(x.s<min||seen.has(x.d.url)||!(one||x.mc>=2||x.th))continue;seen.add(x.d.url);out.push(x);if(out.length>=n)break}return out}
  const link=d=>`<a href="${d.url}">${esc(d.title)}</a>`;
  const go=(hits,skip)=>{const L=hits.filter(x=>!skip||!skip.includes(x.d.url));return L.length?'<div class="go">On the site: '+L.map(x=>link(x.d)).join(' &middot; ')+'</div>':''};
  const has=u=>!SITE||SITE.some(c=>c.u===u);
  const m=D.metrics,isPI=r=>/^princip/i.test(r);
  function answer(q){
    const s=q.toLowerCase(),is=r=>r.test(s);
    if(is(/^(hi|hello|hey|salam|assalam|hai)\b/))return{h:'Hello. Ask me about Dr. Akmal, his research, teaching, books and tools, or where to find something on this site.'};
    if(is(/contact|email|e-mail|reach|get in touch|hubungi/))return{h:`Email is the best route: <b>akmal@ukm.edu.my</b>. He is based at the Faculty of Information Science &amp; Technology, UKM Bangi. There is also a <a href="${BASE}/contact/">contact page</a>. Profiles: <a href="https://scholar.google.com/citations?user=GJeS-CwAAAAJ">Google Scholar</a>, <a href="https://orcid.org/0000-0002-7909-8869">ORCID</a>.`,src:'site settings'};
    if(is(/\bcv\b|resume|résumé|curriculum vitae/))return{h:`His CV is on the <a href="${BASE}/cv/">CV page</a>, with a <a href="${BASE}/cv/Akmal_CV_2026.pdf">PDF version</a> to download. On this page, the CV builder above assembles a shorter one for your purpose.`,src:'site pages'};
    if(is(/\bbooks?\b|cookbook|masterclass|autowriter|product|ebook|e-book|\bbuku\b|for sale|\bbuy\b/)){const L=[];
      if(has('/cookbook/'))L.push(`<li><a href="${BASE}/cookbook/">Prompt Cookbook</a>: an 88-page guide to prompting for research and academic writing. Free download.</li>`);
      if(has('/masterclass/'))L.push(`<li><a href="${BASE}/masterclass/">Prompt Culinary Masterclass</a>: the next book, on turning prompts into assistants, tools and agent briefs. Coming soon.</li>`);
      if(has('/autowriter/'))L.push(`<li><a href="${BASE}/autowriter/">AutoWriterAI</a>: a private desktop workspace for scientific writing. Coming soon.</li>`);
      if(has('/toolkit/'))L.push(`<li><a href="${BASE}/toolkit/">Toolkit</a>: the AI tools he uses and recommends.</li>`);
      if(L.length)return{h:'Books and tools:<ul>'+L.join('')+'</ul>',src:'site pages'}}
    if(is(/how long|years? of experience|since when|experience|work(ed|ing|s)? (history|at|for|in|as)|career|employ|\bjob\b|position|appointment|berapa lama|pengalaman/)){
      const E=D.cv.employment.map(e=>({...e,start:parseInt(e.period),now:/present/i.test(e.period)})),cur=E.find(e=>e.now)||E[0];
      const posts=E.filter(e=>/professor|lecturer/i.test(e.role)),first=Math.min(...posts.map(e=>e.start)),all=Math.min(...E.map(e=>e.start));
      return{h:`He has been <b>${esc(cur.role)}</b> at ${esc(cur.place.replace(/\.$/,''))} since <b>${cur.start}</b>, about ${NOW-cur.start} year${NOW-cur.start===1?'':'s'}. He has held academic posts since ${first} (about ${NOW-first} years) and has worked in research since ${all}.<ul>`+E.map(e=>`<li><span class="mono">${esc(e.period)}</span> ${esc(e.role)}, ${esc(e.place)}</li>`).join('')+'</ul>',src:'CV data',url:[BASE+'/about/']}}
    if(is(/educat|degree|studied|did he study|his (phd|ph\.d|doctorate|master)|thesis|alma mater|qualification|ijazah|graduat(e|ed) from/))
      return{h:'Education:<ul>'+D.cv.education.map(e=>`<li><span class="mono">${esc(e.period)}</span> <b>${esc(e.degree)}</b>, ${esc(e.place)}. ${esc(e.detail)}</li>`).join('')+'</ul>',src:'CV data',url:[BASE+'/about/']};
    const pg=pagesFor(q,3),nav=is(/where|link|\bpage\b|\burl\b|show me|take me|\bopen\b|navigate|find|mana|ada tak/),wantPubs=is(/paper|publication|article|journal|published|wrote|written/);
    // answer with a page: its title as the link, its opening passage as the summary, and the matching section if there is one
    const pageAns=x=>{const t=x.d,lead=(SITE||[]).find(c=>c.u===t.meta.u)||t.meta,sec=t.meta.h&&t.meta.h.toLowerCase()!==t.title.toLowerCase()&&!x.th?` See the section “${esc(t.meta.h)}”.`:'';
      return{h:(nav?'Here it is: ':'From ')+`<a href="${t.url}">${esc(t.title)}</a>.<br>${esc(lead.x.slice(0,240))}${lead.x.length>240?'…':''}${sec}`,src:'site pages',url:[t.url],pages:pg.filter(y=>y.d.url!==t.url&&y.s>=4.2).slice(0,2)}};
    // a page named by its address, e.g. "research page", "toolkit", "take me to teaching"
    const words=(s.match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!/^(the|page|site|his|her|link|url|take|show|open|where|find|for|and|can|you|what|about)$/.test(w));
    if(SITE&&!wantPubs&&(nav||words.length<=2)){let best=null;for(const d of docs){if(d.type!=='page'||d.meta!==(SITE.find(c=>c.u===d.meta.u)))continue;const seg=d.meta.u.split(/[\/-]/).filter(Boolean),k=words.filter(w=>seg.includes(w)).length;
        if(k&&(!best||k>best.k||(k===best.k&&d.meta.u.length<best.d.meta.u.length)))best={d,k}}
      if(best)return pageAns({d:best.d,th:1,s:9})}
    if(pg.length&&!wantPubs&&(pg[0].th>=2||(nav&&pg[0].th>=1)))return pageAns(pg[0]);       // the question names a page by its title
    if(is(/\bmember|membership|\bieee\b|\bmbot\b|\baaai\b|professional (body|technologist)|\bahli\b/))return{h:'Professional memberships and roles:<ul>'+D.cv.membership.map(t=>`<li>${esc(t)}</li>`).join('')+'</ul>',src:'CV data'};
    if(is(/generative optimi[sz]ation|three pillars|3 pillars|pillars|research (focus|area|direction|interest)/))return{h:'<b>Generative optimization</b> joins three lines of work into one loop:<ul>'+ORDER.map(k=>`<li><b>${P[k].verb}</b> (${P[k].name}, ${D.pubs.filter(p=>p.p===k).length} papers): ${P[k].body.split('. ')[0]}.</li>`).join('')+`</ul>The level grid at the top of this page is that loop running. More on the <a href="${BASE}/generative-optimization/">programme page</a>.`,src:'research programme'};
    if(is(/how many|number of|count|berapa/)||is(/\b(h-?index|citations?|metrics|stats)\b/)){
      const act=D.grants.filter(g=>g.st==='Active').length,on=D.students.filter(x=>x.st==='Ongoing').length;
      return{h:`The record on this site: <b>${D.pubs.length}</b> publications (${D.pubs.filter(p=>p.c==='J').length} journal, ${D.pubs.filter(p=>p.c==='C').length} conference, ${D.pubs.filter(p=>p.c==='B').length} chapters), <b>${m.citations.toLocaleString()}</b> citations, h-index <b>${m.hIndex}</b>, i10-index <b>${m.i10Index}</b>. ${D.grants.length} grants worth ${rm(D.grants.reduce((a,g)=>a+g.amt,0))} in total (${act} active), and ${D.students.length} postgraduate researchers (${on} ongoing).`,src:'publication files, site settings (Google Scholar figures)'}}
    if(is(/grant|funding|funded|frgs|geran|principal investigator|\bpi\b/)){const r=search(q,['grant'],4).hits.map(x=>x.d.meta),L=(r.length&&!is(/all|lead|list|what grants/)?r:[...D.grants].sort((a,b)=>isPI(b.role)-isPI(a.role)||b.amt-a.amt).slice(0,6));
      return{h:`${D.grants.length} grants, ${rm(D.grants.reduce((a,g)=>a+g.amt,0))} in total, ${rm(D.grants.filter(g=>isPI(g.role)).reduce((a,g)=>a+g.amt,0))} as principal investigator. Most relevant:<ul>`+L.map(g=>`<li><b>${isPI(g.role)?'PI':'Co-I'}</b>, ${g.s}–${g.e}: ${esc(g.t)} (${esc(g.ag)}${g.amt?', RM '+g.amt.toLocaleString():''})</li>`).join('')+'</ul>',src:'project files'}}
    if(is(/supervis|phd|ph\.d|master|msc|postgrad|student|pelajar/)){const on=D.students.filter(x=>x.st==='Ongoing'),r=search(q,['student'],5).hits.map(x=>x.d.meta),L=r.length>1?r:on.slice(0,6);
      return{h:`He supervises ${D.students.length} postgraduate researchers, ${on.length} of them ongoing (${on.filter(x=>x.r.startsWith('Main')).length} as main supervisor). Example topics:<ul>`+L.map(x=>`<li>${esc(x.t)} <span class="mono">${x.d}</span></li>`).join('')+'</ul>For openings, write to <b>akmal@ukm.edu.my</b> with a short proposal that fits one of the three pillars.',src:'student records'}}
    if(is(/teach|course|subject|kursus|lectur/))return{h:'Teaching:<ul>'+D.cv.teaching.map(t=>`<li><span class="mono">${esc(t.when)}</span> ${esc(t.text)}</li>`).join('')+'</ul>',src:'CV data'};
    if(is(/workshop|training|module|bengkel|speaker|talk/))return{h:'Registered training modules at UKM:<ul>'+D.cv.ip.map(t=>`<li>${esc(t.title)} (${t.year})</li>`).join('')+'</ul>He also gives invited talks on AI for research, education and the workplace. To book a session, email <b>akmal@ukm.edu.my</b>.',src:'CV data'};
    if(is(/award|prize|anugerah/))return{h:'Awards:<ul>'+D.cv.awards.map(a=>`<li>${esc(a)}</li>`).join('')+'</ul>',src:'CV data'};
    if(is(/^who('s| is| are)? (he|him|dr|akmal|mohd|this|the (author|owner|person))|who is this|about (him|akmal|the author)|background|biograph|\bbio\b|siapa (dia|akmal|dr)|jaist/))return{h:esc(D.cv.profile),src:'CV data',url:[BASE+'/about/']};
    // open question: papers first, then anything else on the site
    const r=search(q,['pub'],6),loose=r.hits.filter(x=>x.s>=3.2).slice(0,3);r.hits=r.hits.filter(x=>x.mc>=2||x.s>=6||tok(q).length<2);
    const rec=search(q,['grant','student','career','edu','member','teach','award','service','ip'],4).hits.filter(x=>x.s>=3.6&&x.mc>=2);
    if(rec.length&&!wantPubs&&(!r.hits.length||rec[0].s>r.hits[0].s)&&(!pg.length||(!pg[0].th&&rec[0].s>=pg[0].s*.7)))
      return{h:'From the records:<ul>'+rec.map(x=>`<li>${esc(x.d.title)} <span class="mono">${({grant:'grant',student:'student project',career:'appointment',edu:'education',member:'membership',skill:'skills',teach:'teaching',award:'award',service:'service',ip:'training module'})[x.d.type]}</span></li>`).join('')+'</ul>',src:'site records',pages:[{d:{url:rec[0].d.url,title:rec[0].d.url.replace(BASE,'').replace(/\//g,' ').trim().replace(/^./,c=>c.toUpperCase())+' page'}}].concat(pg.slice(0,1))};
    if(pg.length&&!wantPubs&&(!r.hits.length||r.hits[0].s<2.2||pg[0].s>r.hits[0].s*1.25)){const A=pageAns(pg[0]);   // a page fits best; still mention papers on the same topic
      if(loose.length)A.h+='<div style="margin-top:8px">Related publications:<ul>'+loose.map(x=>`<li>${link(x.d)} <span class="mono">${x.d.meta.y}</span></li>`).join('')+'</ul></div>';return A}
    if(!r.hits.length||r.hits[0].s<2.2){const any=search(q,null,4).hits.filter(x=>x.s>=3.6&&(x.mc>=2||tok(q).length===1));
      const seen=new Set(),uniq=any.filter(x=>!seen.has(x.d.url+x.d.title)&&seen.add(x.d.url+x.d.title));
      if(uniq.length)return{h:(wantPubs?'No publication matches that closely. ':'')+'Closest matches on the site:<ul>'+uniq.map(x=>`<li>${link(x.d)}</li>`).join('')+'</ul>',src:'site records'};
      return{none:1,h:'I could not find that on this site. I only answer about Dr. Akmal and what is published here: his background, research, publications, grants, teaching, books and tools, and how to reach him.'}}
    const by={};r.hits.forEach(x=>by[x.d.meta.p]=(by[x.d.meta.p]||0)+1);const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0][0];
    return{h:`${r.hits.length===1?'One close publication, in the':r.hits.length+' closest publications, mostly from the'} <b>${P[top].verb.toLowerCase()}</b> pillar (${P[top].name}):<ul>`+r.hits.map(x=>`<li>${link(x.d)} <span class="mono">${x.d.meta.y} &middot; ${esc(x.d.meta.v)}</span></li>`).join('')+'</ul>',src:'publication files',url:[BASE+'/publications/']}}
  // page links to show under an answer: those the answer chose, else the best matches for the question
  const linksFor=(q,a)=>a.none?'':go(a.pages||pagesFor(q,2,4.2),(a.url||[]).concat((a.h.match(/href="([^"]+)"/g)||[]).map(x=>x.slice(6,-1))));

  const log=$('#log'),input=$('#ask-in'),send=$('#say button'),bL=$('#bLLM');let llm=null,busy=false,mode=null;
  // the conversation follows the visitor from page to page for as long as the tab stays open
  const LOG='akmal-assistant-log';
  function keep(){try{while(log.innerHTML.length>60000&&log.firstChild)log.firstChild.remove();sessionStorage.setItem(LOG,log.innerHTML)}catch(e){}}
  const canLLM=('LanguageModel'in window)||!!navigator.gpu;
  const store={get(){try{return localStorage.getItem(KEY)}catch(e){return null}},set(v){try{localStorage.setItem(KEY,v)}catch(e){}}};
  function say(cls,html){const d=document.createElement('div');d.className='msg '+cls;d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight;keep();return d}
  function gate(on,hint){input.disabled=!on;send.disabled=!on;input.placeholder=hint}
  const status=t=>$('#llmStatus').textContent=t,bar=v=>$('#llmBar').style.width=Math.round(v*100)+'%';
  const PRE=['Who is Dr. Akmal?','How long has he worked in academia?','What is generative optimization?','Which grants does he lead?','Does he supervise postgraduate students?','What does he teach?','Does he offer workshops or training?','What books and tools does he offer?','Where can I find his CV?','How do I contact him?'];
  const menu=()=>'<div class="pre">'+PRE.map(t=>`<button type="button" data-pre>${t}</button>`).join('')+'</div>';

  const SYS='You are the assistant on akmal.app, the website of Dr. Mohd Nor Akmal Khalid, Senior Lecturer in AI at Universiti Kebangsaan Malaysia. Answer the visitor in their language, in at most 110 words, using only the FACTS given. Write plain sentences only: no links, no URLs, no markdown, and never name a page that is not in the FACTS; the right links are added under your answer automatically. Only answer questions about Dr. Akmal and this website. If the FACTS do not contain the answer, say so and suggest emailing akmal@ukm.edu.my. Never invent papers, numbers, dates or links. Page links are added below your answer automatically.';
  const CARD='Career: '+D.cv.employment.map(e=>`${e.period} ${e.role}, ${e.place}`).join(' | ')+'\nEducation: '+D.cv.education.map(e=>`${e.period} ${e.degree}, ${e.place}`).join(' | ')+`\nTotals: ${D.pubs.length} publications, ${m.citations} citations, h-index ${m.hIndex}, ${D.grants.length} grants, ${D.students.length} postgraduate researchers. Current year: ${NOW}. Research programme: generative optimization (generate, evaluate, search).`;
  const plain=h=>h.replace(/<li>/g,'\n- ').replace(/<[^>]+>/g,' ').replace(/&middot;/g,'·').replace(/&amp;/g,'&').replace(/\s+\n/g,'\n').trim();
  async function viaLLM(q,a,el){
    const facts=search(q,['pub','grant','student','pillar','bio','career','edu','member','skill','teach','award','service','ip'],5).hits.map(x=>'- '+x.d.text),
      pages=pagesFor(q,4,1.8).map(x=>`- [page "${x.d.title}"] ${x.d.meta.h?x.d.meta.h+': ':''}${x.d.meta.x.slice(0,380)}`);
    const user='FACTS:\n'+CARD+'\n'+(a.none?'':'Prepared answer: '+plain(a.h)+'\n')+facts.concat(pages).join('\n')+'\n\nQUESTION: '+q;let out='';
    if(llm.kind==='nano'){const st=llm.session.promptStreaming(user);for await(const ch of st){out+=ch;el.textContent=out;log.scrollTop=log.scrollHeight}}
    else{const st=await llm.engine.chat.completions.create({messages:[{role:'system',content:SYS},{role:'user',content:user}],stream:true,temperature:.3,max_tokens:300});
      for await(const ch of st){out+=ch.choices[0]?.delta?.content||'';el.textContent=out;log.scrollTop=log.scrollHeight}}
    // small models like to invent links: drop anything link-shaped and attach only links we know exist
    el.textContent=out.replace(/\[[^\]]*\]\([^)]*\)/g,'').replace(/https?:\/\/\S+/g,'').replace(/\*\*|__|^#+\s*/gm,'').replace(/[ \t]+\n/g,'\n').trim();
    const known=[...new Set((a.url||[]).concat((a.h.match(/href="([^"]+)"/g)||[]).map(x=>x.slice(6,-1))))].filter(u=>u.startsWith(BASE)&&!/\/publications\/[^/]+/.test(u)).slice(0,3)
      .map(u=>{const pg=SITE&&SITE.find(c=>BASE+c.u===u);return{d:{url:u,title:pg?pg.t:(u.replace(BASE,'').replace(/[\/-]+/g,' ').trim()||'Home').replace(/^./,c=>c.toUpperCase())}}});
    const more=a.none?[]:(a.pages||pagesFor(q,2,4.2)).filter(x=>!known.some(k=>k.d.url===x.d.url));
    el.insertAdjacentHTML('beforeend',go(known.concat(more).slice(0,4))+'<div class="src">written on your device from this site\'s records</div>');log.scrollTop=log.scrollHeight;keep()}
  async function ask(q,premade){if(busy||!mode||!q.trim())return;busy=true;say('u',esc(q));
    const a=answer(q),quick=()=>say('b',a.h+linksFor(q,a)+(a.src?`<div class="src">source: ${a.src}</div>`:''));
    if(a.none&&!pagesFor(q,1,1.8).length)say('b',a.h+menu());                    // nothing on the site about this: stay in scope
    else if(llm&&!premade&&!/^(hi|hello|hey|salam)/i.test(q)){const el=say('b','…');try{await viaLLM(q,a,el)}catch(e){el.remove();quick()}}
    else quick();
    busy=false}
  $('#say').addEventListener('submit',e=>{e.preventDefault();ask(input.value);input.value=''});
  log.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.pre!==undefined)ask(b.textContent,true);
    else if(b.dataset.pick==='llm'){b.closest('.msg').querySelectorAll('button').forEach(x=>x.disabled=true);loadLLM(true)}
    else if(b.dataset.pick==='quick'){b.closest('.msg').querySelectorAll('button').forEach(x=>x.disabled=true);store.set('quick');quickMode('')}});

  function quickMode(why,quiet){mode='quick';gate(true,'Pick a question above, or type to search the site');bar(0);status('Mode: quick answers, no download');bL.hidden=!canLLM;bL.disabled=false;bL.textContent='Switch to smart assistant';
    if(!quiet)say('b',(why?esc(why)+' ':'')+'Quick answers are on. Pick a question, or type your own and I will search the whole site.'+menu())}
  const MODEL='Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
  async function loadLLM(chosen,quiet){bL.hidden=true;gate(false,'Preparing the assistant…');
    try{
      if('LanguageModel'in window){status('Checking the browser\'s built-in model');const av=await LanguageModel.availability();
        if(av&&av!=='unavailable'){if(av!=='available')status('Downloading the browser\'s built-in model');
          const session=await LanguageModel.create({initialPrompts:[{role:'system',content:SYS}],monitor(mon){mon.addEventListener('downloadprogress',e=>{bar(e.loaded||0);status('Downloading the built-in model: '+Math.round((e.loaded||0)*100)+'%')})}});
          llm={kind:'nano',session};status('Mode: smart assistant, browser built-in model on this device')}}
      if(!llm){if(!navigator.gpu)throw new Error('This browser cannot run a model on this device.');
        status('Fetching the model runtime');
        const webllm=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm');
        const engine=await webllm.CreateMLCEngine(MODEL,{initProgressCallback:p=>{bar(p.progress||0);status(p.text||'Loading')}});
        llm={kind:'webllm',engine};status('Mode: smart assistant, '+MODEL.split('-q4')[0]+' on your graphics card')}
      mode='llm';store.set('llm');bar(1);gate(true,'Ask anything about Dr. Akmal or this site');
      if(!quiet)say('b','The assistant is ready and runs on your device. Ask anything about Dr. Akmal or this site, or start with one of these.'+menu());if(isOpen())input.focus();
    }catch(e){llm=null;if(chosen)store.set('quick');
      quickMode(/cannot run/.test(e.message)?e.message:'The model could not be loaded here.')}}
  bL.onclick=()=>loadLLM(true);


  // first time the panel opens on this page: carry on the conversation from the previous page, resume the
  // mode chosen last time, or ask before any download
  const saved=store.get(),old=session.get(LOG);
  if(old&&(saved||!canLLM)){log.innerHTML=old;log.querySelectorAll('.pick button').forEach(b=>b.disabled=true);log.scrollTop=log.scrollHeight}
  const again=!!log.firstChild;
  if(!canLLM)return quickMode('This browser cannot run a language model on the device.',again);
  if(saved==='llm'){if(!again)say('b','Welcome back. Loading the assistant you chose last time.');return loadLLM(false,again)}
  if(saved==='quick')return quickMode('',again);
  gate(false,'Choose how to start, above');bL.hidden=true;status('Choose a mode to begin');
  say('b','Before you ask, choose how I should answer.<div class="pick"><button type="button" data-pick="llm"><b>Smart assistant</b><span>A small language model runs on your own device and answers in full sentences. It uses your browser\'s built-in model when there is one. Otherwise it downloads about 1 GB once, so use Wi-Fi and a recent computer.</span></button><button type="button" data-pick="quick"><b>Quick answers</b><span>No download. Choose from ready-made answers or search the whole site.</span></button></div>Either way, nothing you type leaves this tab.');
}
})();
