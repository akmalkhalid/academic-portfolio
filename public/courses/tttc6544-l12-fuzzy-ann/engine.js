/* TTTC6544 deck engine — bilingual slides, notes, TOC, code labs, quizzes, plotting helpers.
   Pure vanilla JS. Every interactive piece works offline; storage is optional (try/catch). */
(function(){
"use strict";
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const L=(en,bm)=>`<span class="en">${en}</span><span class="bm">${bm==null?en:bm}</span>`;
const OL=(en,bm)=>"⟦"+en+"¦"+(bm==null?en:bm)+"⟧";
const LL=o=>o==null?"":(typeof o==="string"?o:L(o.en,o.bm));
const REG={code:{},quiz:{}}; let uid=0;
function toast(msg){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t)}t.innerHTML=msg;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),1600)}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);return true}catch(e){try{const ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok}catch(e2){return false}}}

/* ---------- tiny syntax highlighter ---------- */
const KW={python:/\b(import|from|as|def|return|for|in|if|elif|else|while|print|lambda|and|or|not|True|False|None|with|class|range|len)\b/g,
  excel:/\b(IF|MAX|MIN|AND|OR|SUMPRODUCT|SUM|LET|EXP|ROUND|LAMBDA|MAP|SEQUENCE)\b/g, prompt:/^$/g,text:/^$/g};
function hl(line,lang){
  if(lang==="prompt"||lang==="text") return esc(line).replace(/(\[[^\]]+\])/g,'<span class="nu">$1</span>').replace(/^(#.*)$/,'<span class="cm">$1</span>');
  let out="",i=0,cm=lang==="python"?"#":(lang==="excel"?"'":null);
  const seg=(s)=>esc(s).replace(KW[lang]||/^$/g,'<span class="kw">$1</span>').replace(/\b(\d+\.?\d*)\b/g,'<span class="nu">$1</span>');
  let buf="";
  while(i<line.length){const c=line[i];
    if(c==='"'||(c==="'"&&lang==="python")){out+=seg(buf);buf="";let j=i+1;while(j<line.length&&line[j]!==c)j++;out+='<span class="st">'+esc(line.slice(i,j+1))+'</span>';i=j+1;continue}
    if(cm&&c===cm&&lang==="python"){out+=seg(buf);buf="";out+='<span class="cm">'+esc(line.slice(i))+'</span>';i=line.length;continue}
    buf+=c;i++}
  return out+seg(buf);
}

/* ---------- code lab component ---------- */
function code(spec){const id="cd"+(uid++);REG.code[id]=spec;return `<div class="code" id="${id}"></div>`}
const LV={l1:{en:"L1 · No-code",bm:"T1 · Tanpa kod"},l2:{en:"L2 · Low-code",bm:"T2 · Kod rendah"},l3:{en:"L3 · Code",bm:"T3 · Berkod"}};
function hydrateCode(el,spec){
  let cur=0; const v=()=>spec.variants[cur];
  function render(){
    const V=v();
    el.innerHTML=`<div class="tabs">${spec.variants.map((x,i)=>`<button class="${i===cur?"on":""}" data-i="${i}">${LL(x.label)}</button>`).join("")}</div>
    ${V.desc?`<div class="desc">${LL(V.desc)}</div>`:""}
    <div class="bar"><span class="pill ${V.level}">${LL(LV[V.level])}</span><span>${esc(V.tool||V.lang)}</span><span class="sp"></span>
      <button data-a="copy">📋 ${L("Copy","Salin")}</button><button data-a="out">▶ ${L("Expected output","Output dijangka")}</button><button data-a="ex">📖 ${L("Explain all lines","Terangkan semua baris")}</button></div>
    <div class="body"><ol>${V.lines.map((ln,i)=>`<li data-i="${i}"><span>${hl(ln[0],V.lang)||" "}</span></li><div class="inline-ex">↳ ${L(ln[1]||"",ln[2]||ln[1]||"")}</div>`).join("")}</ol>
      <div class="ex"><div class="h">${L("Line-by-line explanation","Penerangan baris demi baris")}</div><div class="exbody muted">${L("Click any line to see what it does and why.","Klik mana-mana baris untuk melihat fungsinya dan sebabnya.")}</div></div></div>
    <div class="out"><b>${L("Expected output","Output dijangka")}:</b>\n${esc(V.out||"")}</div>`;
    el.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{cur=+b.dataset.i;render()});
    el.querySelectorAll("li").forEach(li=>li.onclick=()=>{el.querySelectorAll("li.sel").forEach(x=>x.classList.remove("sel"));li.classList.add("sel");const ln=V.lines[+li.dataset.i];
      el.querySelector(".exbody").innerHTML=`<div class="small" style="opacity:.7">${L("Line","Baris")} ${+li.dataset.i+1}</div><code style="color:#ffcb6b;white-space:pre-wrap">${esc(ln[0]||"(blank)")}</code><p>${L(ln[1]||"—",ln[2]||ln[1]||"—")}</p>`});
    el.querySelector('[data-a=copy]').onclick=async()=>{const ok=await copyText(V.lines.map(l=>l[0]).join("\n"));toast(ok?L("Copied ✓","Disalin ✓"):L("Select the text and press Ctrl+C","Pilih teks dan tekan Ctrl+C"))};
    el.querySelector('[data-a=out]').onclick=()=>el.querySelector(".out").classList.toggle("show");
    el.querySelector('[data-a=ex]').onclick=()=>el.classList.toggle("allex");
  }
  render();
}

/* ---------- quiz component ---------- */
function quiz(spec){const id=spec.id||("qz"+(uid++));REG.quiz[id]=spec;return `<div class="quiz" id="${id}"></div>`}
function hydrateQuiz(el,spec){
  const key="tttc6544:quiz:"+el.id; let st=store.get(key,{});
  const perm=(qi,n)=>{let h=2166136261;for(const ch of el.id+":"+qi){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){h=Math.imul(h^(h>>>13),1597334677)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  function render(){
    const answered=Object.keys(st).length, right=Object.values(st).filter(x=>x.ok).length;
    el.innerHTML=`<div class="qgrid">${spec.items.map((it,qi)=>`<div class="q" data-q="${qi}"><h4>${qi+1}. ${LL(it.q)}</h4>
      ${perm(qi,it.o.length).map((oi,pos)=>`<button class="opt" data-o="${oi}">${String.fromCharCode(65+pos)}. ${LL(it.o[oi])}</button>`).join("")}
      <div class="fb"></div></div>`).join("")}</div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap"><span class="score">${L("Score","Skor")}: ${right}/${spec.items.length}</span><span class="muted small">${L("First attempt counts. Feedback is immediate.","Cubaan pertama dikira. Maklum balas serta-merta.")}</span><button class="btn" data-reset>↺ ${L("Reset","Set semula")}</button></div>`;
    el.querySelectorAll(".q").forEach(qe=>{const qi=+qe.dataset.q,it=spec.items[qi];
      const pm=perm(qi,it.o.length),letter=String.fromCharCode(65+pm.indexOf(it.a));
      const show=(oi)=>{const ok=oi===it.a;qe.querySelectorAll(".opt").forEach(b=>{const bo=+b.dataset.o;b.disabled=true;if(bo===it.a)b.classList.add("right");else if(bo===oi)b.classList.add("wrong")});
        const fb=qe.querySelector(".fb");fb.className="fb show "+(ok?"ok":"no");
        fb.innerHTML=(ok?"✅ "+L("Correct!","Betul!"):"❌ "+L("Not quite — the answer is ","Belum tepat — jawapannya ")+letter+".")+" "+LL(it.why);};
      if(st[qi]) show(st[qi].o);
      qe.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{const oi=+b.dataset.o;if(st[qi])return;st[qi]={o:oi,ok:oi===it.a};store.set(key,st);show(oi);
        const sc=el.querySelector(".score");const r=Object.values(st).filter(x=>x.ok).length;sc.innerHTML=L("Score","Skor")+": "+r+"/"+spec.items.length;
        if(Object.keys(st).length===spec.items.length){toast(r===spec.items.length?L("🎉 Perfect score!","🎉 Skor penuh!"):L("Done! Review the explanations.","Selesai! Semak penerangan."));markDone()}});
    });
    el.querySelector("[data-reset]").onclick=()=>{st={};store.set(key,st);render()};
  }
  render();
}


/* ---------- step-by-step solver & practice generator ---------- */
function mountSteps(box,steps){if(box._k==null)box._k=1;box._k=Math.min(Math.max(1,box._k),steps.length);
  const draw=()=>{box.innerHTML=`<div class="steps">${steps.map((s,i)=>`<div class="stp ${i<box._k?"on":""}"><span class="sn">${i+1}</span><div>${s}</div></div>`).join("")}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn" data-s="-1">◀ ${L("Back","Undur")}</button><button class="btn pri" data-s="1">${L("Next step","Langkah seterusnya")} ▶</button><button class="btn" data-s="all">⏭ ${L("Show all","Papar semua")}</button><button class="btn" data-s="0">↺</button><span class="small muted" style="align-self:center">${box._k}/${steps.length}</span></div>`;
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{const v=b.dataset.s;box._k=v==="all"?steps.length:v==="0"?1:box._k+(+v);mountSteps(box,steps)})};draw()}
function practice(box,gen){let cur=gen();const draw=()=>{box.innerHTML=`<div class="card"><div class="kicker">🎲 ${L("Practice generator","Penjana latihan")} · <span class="pill ${cur.lv||"l2"}">${cur.lv==="l1"?L("easy","mudah"):cur.lv==="l3"?L("hard","sukar"):L("medium","sederhana")}</span></div><div style="margin:8px 0">${cur.q}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><input type="number" step="any" class="pin" style="width:9em;padding:6px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 1rem var(--fm)" placeholder="?">
  <button class="btn pri" data-p="chk">✔ ${L("Check","Semak")}</button><button class="btn" data-p="sol">💡 ${L("Solution","Penyelesaian")}</button><button class="btn" data-p="new">🎲 ${L("New problem","Soalan baharu")}</button></div><div class="pfb small" style="margin-top:8px"></div><div class="psol" style="display:none;margin-top:8px"></div></div>`;
  const fb=box.querySelector(".pfb"),sol=box.querySelector(".psol");
  box.querySelector('[data-p=chk]').onclick=()=>{const v=parseFloat(box.querySelector(".pin").value);if(isNaN(v)){fb.innerHTML=L("Type a number first.","Taip nombor dahulu.");return}
   const ok=Math.abs(v-cur.ans)<=(cur.tol??0.01);fb.innerHTML=ok?`✅ ${L("Correct!","Betul!")} (${cur.ans.toFixed(cur.dp??2)})`:`❌ ${L("Not yet — try again or open the solution.","Belum tepat — cuba lagi atau buka penyelesaian.")}`;fb.style.color=ok?"var(--ok)":"var(--bad)"};
  box.querySelector('[data-p=sol]').onclick=()=>{sol.style.display="block";sol.innerHTML=cur.sol};box.querySelector('[data-p=new]').onclick=()=>{cur=gen();draw()}};draw()}

/* ---------- plotting helper ---------- */
function plot(svg,o){const W=o.w||600,H=o.h||300,p=o.pad||{l:40,r:14,t:14,b:34};svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const X=x=>p.l+(x-o.x0)/(o.x1-o.x0)*(W-p.l-p.r), Y=y=>H-p.b-(y-o.y0)/(o.y1-o.y0)*(H-p.t-p.b);
  const ns="http://www.w3.org/2000/svg";
  const api={X,Y,W,H,p,
    el(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);(parent||svg).appendChild(e);return e},
    clear(){svg.innerHTML=""},
    path(f,n=200,x0=o.x0,x1=o.x1){let d="";for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;d+=(i?"L":"M")+X(x).toFixed(1)+","+Y(f(x)).toFixed(1)}return d},
    area(f,n=200,x0=o.x0,x1=o.x1){return api.path(f,n,x0,x1)+`L${X(x1)},${Y(o.y0)}L${X(x0)},${Y(o.y0)}Z`},
    band(fl,fu,n=200){let d="";for(let i=0;i<=n;i++){const x=o.x0+(o.x1-o.x0)*i/n;d+=(i?"L":"M")+X(x)+","+Y(fu(x))}for(let i=n;i>=0;i--){const x=o.x0+(o.x1-o.x0)*i/n;d+="L"+X(x)+","+Y(fl(x))}return d+"Z"},
    axes(xl,yl,xt,yt){api.el("line",{x1:X(o.x0),y1:Y(o.y0),x2:X(o.x1),y2:Y(o.y0),class:"axis"});api.el("line",{x1:X(o.x0),y1:Y(o.y0),x2:X(o.x0),y2:Y(o.y1),class:"axis"});
      (xt||[]).forEach(v=>{api.el("text",{x:X(v),y:H-p.b+16,"text-anchor":"middle","font-size":11}).textContent=v});
      (yt||[]).forEach(v=>{api.el("line",{x1:X(o.x0),x2:X(o.x1),y1:Y(v),y2:Y(v),class:"gridl"});api.el("text",{x:p.l-6,y:Y(v)+4,"text-anchor":"end","font-size":11}).textContent=v});
      if(xl)api.el("text",{x:W-p.r,y:Y(o.y0)-6,"text-anchor":"end","font-size":12,"font-weight":600}).textContent=xl;
      if(yl){const t=api.el("text",{x:12,y:(H-p.b)/2,"text-anchor":"middle","font-size":12,transform:`rotate(-90 12 ${(H-p.b)/2})`});t.textContent=yl}}};
  return api}
const css=v=>getComputedStyle(document.body).getPropertyValue(v).trim();

/* ---------- deck runtime ---------- */
let D,cur=0,inited=new Set();
function markDone(){const d=store.get("tttc6544:done:"+D.key,{});d[cur]=1;store.set("tttc6544:done:"+D.key,d);buildToc()}
function buildToc(){const t=document.querySelector("#toc .toc");if(!t)return;const done=store.get("tttc6544:done:"+D.key,{});let last=null,h="";
  D.slides.forEach((s,i)=>{const g=JSON.stringify(s.sec);if(g!==last){h+=`<div class="grp">${LL(s.sec)}</div>`;last=g}
    h+=`<a href="#s${i+1}" data-i="${i}" class="${i===cur?"cur":""} ${done[i]?"done":""}"><span class="n">${i+1}</span><span>${LL(s.t)}</span></a>`});t.innerHTML=h;
  t.querySelectorAll("a").forEach(a=>a.onclick=e=>{e.preventDefault();go(+a.dataset.i);if(innerWidth<900)toggle("toc",false)})}
function toggle(id,force){const d=document.getElementById(id);const open=force==null?!d.classList.contains("open"):force;d.classList.toggle("open",open)}
function go(i){document.querySelectorAll("video").forEach(v=>{try{v.pause()}catch(_){}});i=Math.max(0,Math.min(D.slides.length-1,i));const sl=document.querySelectorAll(".slide");sl[cur]&&sl[cur].classList.remove("on");cur=i;const el=sl[i];el.classList.add("on");el.scrollTop=0;
  const s=D.slides[i];if(s.init&&!inited.has(i)){try{s.init(el)}catch(e){console.error(e)}inited.add(i)}if(s.show)try{s.show(el)}catch(e){console.error(e)}
  document.querySelector(".count").textContent=`${i+1} / ${D.slides.length}`;document.querySelector(".progress").style.width=((i+1)/D.slides.length*100)+"%";
  document.querySelector(".sec").innerHTML=LL(s.sec);document.querySelector("#notes .nb").innerHTML=s.notes?`<h3>${LL(s.t)}</h3>${LL(s.notes)}`:`<p class="muted">${L("No extra notes for this slide.","Tiada nota tambahan untuk slaid ini.")}</p>`;
  document.querySelector(".notebtn").classList.toggle("has",!!s.notes);
  if(location.hash!=="#s"+(i+1))history.replaceState(null,"","#s"+(i+1));store.set("tttc6544:pos:"+D.key,i);
  const done=store.get("tttc6544:done:"+D.key,{});if(!s.noAutoDone){done[i]=1;store.set("tttc6544:done:"+D.key,done)}buildToc()}
function setLang(l){document.querySelectorAll("video").forEach(v=>{try{v.pause()}catch(_){}});document.documentElement.dataset.lang=l;document.querySelectorAll("option[data-en]").forEach(o=>o.textContent=o.dataset[l]);store.set("tttc6544:lang",l);document.querySelectorAll("[data-lang-btn]").forEach(b=>b.classList.toggle("on",b.dataset.langBtn===l));document.documentElement.lang=l==="bm"?"ms":"en";
  window.dispatchEvent(new Event("langchange"))}
function setTheme(t){document.documentElement.dataset.theme=t;store.set("tttc6544:theme",t);document.querySelectorAll("[data-theme-btn]").forEach(b=>b.textContent=t==="dark"?"☀️":"🌙");setTimeout(()=>window.dispatchEvent(new Event("themechange")),50)}
function shell(){return `<header class="top"><div class="brand"><span class="dot"></span><span class="hidden-sm">TTTC6544</span></div>
  <button class="btn" data-act="toc" title="T">☰ <span class="hidden-sm">${L("Contents","Kandungan")}</span></button><div class="sec"></div>
  <div class="seg" role="group" aria-label="Language"><button data-lang-btn="bm">BM</button><button data-lang-btn="en">EN</button></div>
  <button class="btn" data-theme-btn title="D">🌙</button><button class="btn notebtn" data-act="notes" title="N">📝 <span class="hidden-sm">${L("Notes","Nota")}</span></button>
  ${D.twin?`<a class="btn pri" href="${D.twin.href}" title="${D.twin.title||""}">${LL(D.twin.label)}</a>`:""}${D.hub?`<a class="btn hidden-sm" href="${D.hub}">🏠 ${L("Hub","Hab")}</a>`:""}</header><div class="progress"></div>
  <main class="deck">${D.slides.map((s,i)=>`<section class="slide" id="s${i+1}" aria-label="slide ${i+1}"><div class="inner">${s.html}</div></section>`).join("")}</main>
  <aside class="drawer left" id="toc"><h3>${LL(D.title)}</h3><div class="toc"></div></aside>
  <aside class="drawer right" id="notes"><div class="kicker">📝 ${L("Deep-dive notes","Nota mendalam")}</div><div class="nb"></div>
    <hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><p class="small muted">${L("Keys","Kekunci")}: <kbd>←</kbd><kbd>→</kbd> ${L("move","gerak")} · <kbd>N</kbd> ${L("notes","nota")} · <kbd>T</kbd> ${L("contents","kandungan")} · <kbd>L</kbd> BM/EN · <kbd>D</kbd> ${L("dark mode","mod gelap")}</p></aside>
  <footer class="bot"><button class="btn" data-act="prev">← ${L("Back","Kembali")}</button><span class="count"></span><button class="btn pri" data-act="next">${L("Next","Seterusnya")} →</button></footer>`}
function start(deck){D=deck;document.body.insertAdjacentHTML("afterbegin",shell());
  document.querySelectorAll("option").forEach(o=>{if(o.textContent.includes("⟦")){const t=o.textContent;o.dataset.en=t.replace(/⟦(.*?)¦(.*?)⟧/g,"$1");o.dataset.bm=t.replace(/⟦(.*?)¦(.*?)⟧/g,"$2")}});
  document.querySelectorAll(".code").forEach(el=>REG.code[el.id]&&hydrateCode(el,REG.code[el.id]));
  document.querySelectorAll(".quiz").forEach(el=>REG.quiz[el.id]&&hydrateQuiz(el,REG.quiz[el.id]));
  document.querySelectorAll(".rv").forEach(el=>{if(!el.style.getPropertyValue("--i")){const sib=[...el.parentElement.querySelectorAll(":scope > .rv")];el.style.setProperty("--i",sib.indexOf(el))}});
  setLang(store.get("tttc6544:lang","bm"));setTheme(store.get("tttc6544:theme",matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
  document.querySelectorAll("[data-lang-btn]").forEach(b=>b.onclick=()=>setLang(b.dataset.langBtn));
  document.querySelector("[data-theme-btn]").onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
  document.querySelector('[data-act=toc]').onclick=()=>toggle("toc");document.querySelector('[data-act=notes]').onclick=()=>toggle("notes");
  document.querySelector('[data-act=prev]').onclick=()=>go(cur-1);document.querySelector('[data-act=next]').onclick=()=>go(cur+1);
  addEventListener("keydown",e=>{const tg=e.target.tagName;if(/INPUT|TEXTAREA|SELECT/.test(tg))return;
    if(["ArrowRight","PageDown"].includes(e.key)){go(cur+1);e.preventDefault()}else if(["ArrowLeft","PageUp"].includes(e.key)){go(cur-1);e.preventDefault()}
    else if(e.key==="Home")go(0);else if(e.key==="End")go(D.slides.length-1);else if(e.key==="n"||e.key==="N")toggle("notes");else if(e.key==="t"||e.key==="T")toggle("toc");
    else if(e.key==="l"||e.key==="L")setLang(document.documentElement.dataset.lang==="en"?"bm":"en");else if(e.key==="d"||e.key==="D")setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")});
  let tx=null;document.querySelector(".deck").addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});
  document.querySelector(".deck").addEventListener("touchend",e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>70&&!e.target.closest("input,.sim,.code"))go(cur+(dx<0?1:-1));tx=null});
  const fromHash=()=>{const m=location.hash.match(/^#s(\d+)$/);return m?+m[1]-1:null};
  addEventListener("hashchange",()=>{const h=fromHash();if(h!=null&&h!==cur)go(h)});
  go(fromHash()??store.get("tttc6544:pos:"+D.key,0));
  const reshow=()=>{const s=D.slides[cur];if(s.show)try{s.show(document.querySelectorAll(".slide")[cur])}catch(e){console.error(e)}};
  addEventListener("themechange",reshow);addEventListener("langchange",reshow);
}
const lang=()=>document.documentElement.dataset.lang||"bm";
const tx=(en,bm)=>lang()==="en"?en:bm;
window.T6544={mountSteps,practice,L,LL,OL,esc,lang,tx,code,quiz,plot,css,start,toast,copyText,store,go:i=>go(i)};
})();
