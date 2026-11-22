/* Module A — Fuzzy Logic Type-1 & Type-2 (TTTC6544) */
(function(){
const {L,LL,OL,code,quiz,plot,css,tx}=T6544;
/* ---------- fuzzy maths (shared by all simulators) ---------- */
const tri=(x,a,b,c)=>Math.max(0,Math.min(b>a?(x-a)/(b-a):(x>=a?1:0),c>b?(c-x)/(c-b):(x<=c?1:0)));
const trap=(x,a,b,c,d)=>Math.max(0,Math.min(b>a?(x-a)/(b-a):(x>=a?1:0),1,d>c?(d-x)/(d-c):(x<=d?1:0)));
const mu=(def,x)=>def[0]==="tri"?tri(x,...def[1]):trap(x,...def[1]);
const MF={rain:{light:["trap",[0,0,10,30]],moderate:["tri",[10,35,60]],heavy:["trap",[40,70,100,100]]},
  level:{normal:["trap",[0,0,40,60]],alert:["tri",[40,65,85]],danger:["trap",[70,90,100,100]]},
  risk:{low:["trap",[0,0,20,40]],medium:["tri",[25,50,75]],high:["trap",[60,80,100,100]]}};
const NAME={light:["Light","Ringan"],moderate:["Moderate","Sederhana"],heavy:["Heavy","Lebat"],normal:["Normal","Normal"],alert:["Alert","Waspada"],danger:["Danger","Bahaya"],low:["Low","Rendah"],medium:["Medium","Sederhana"],high:["High","Tinggi"]};
const nm=k=>tx(NAME[k][0],NAME[k][1]);
const RULES=[["light","normal","low"],["light","alert","medium"],["light","danger","high"],["moderate","normal","low"],["moderate","alert","medium"],["moderate","danger","high"],["heavy","normal","medium"],["heavy","alert","high"],["heavy","danger","high"]];
const CENTRE={low:15,medium:50,high:85};
function mamdani(r,w,andOp){const f=RULES.map(([a,b])=>{const x=mu(MF.rain[a],r),y=mu(MF.level[b],w);return andOp==="prod"?x*y:Math.min(x,y)});
  const agg=y=>Math.max(0,...RULES.map((R,i)=>Math.min(f[i],mu(MF.risk[R[2]],y))));
  /* piecewise-linear centroid on y = 0..100 (same formula as scikit-fuzzy) */
  let A=0,M=0;for(let y=0;y<100;y++){const x1=y,x2=y+1,y1=agg(x1),y2=agg(x2);let c,a;
    if(y1===y2){c=(x1+x2)/2;a=y1}else if(y1===0){c=x1+2/3;a=y2/2}else if(y2===0){c=x1+1/3;a=y1/2}else{c=(2/3*(y2+.5*y1))/(y1+y2)+x1;a=(y1+y2)/2}M+=c*a;A+=a}
  return {f,agg,crisp:A?M/A:NaN}}
function it2mf(def,x,U){const [t,p]=def;if(t==="tri"){const [a,b,c]=p;return [tri(x,Math.min(a+U,b),b,Math.max(c-U,b)),tri(x,a-U,b,c+U)]}
  const [a,b,c,d]=p;return [trap(x,a===b?a:Math.min(a+U,b),b,c,c===d?d:Math.max(d-U,c)),trap(x,a===b?a:a-U,b,c,c===d?d:d+U)]}
function km(y,fl,fu){const o=y.map((v,i)=>i).sort((i,j)=>y[i]-y[j]);const Y=o.map(i=>y[i]),FL=o.map(i=>fl[i]),FU=o.map(i=>fu[i]);let yl=Infinity,yr=-Infinity,kl=0,kr=0;
  for(let k=0;k<=Y.length;k++){let nl=0,dl=0,nr=0,dr=0;Y.forEach((v,i)=>{const wl=i<k?FU[i]:FL[i],wr=i<k?FL[i]:FU[i];nl+=wl*v;dl+=wl;nr+=wr*v;dr+=wr});
    if(dl>0&&nl/dl<yl){yl=nl/dl;kl=k}if(dr>0&&nr/dr>yr){yr=nr/dr;kr=k}}return {yl,yr,kl,kr}}
function it2infer(r,w,U){const fl=[],fu=[],y=[];RULES.forEach(([a,b,o])=>{const [rl,ru]=it2mf(MF.rain[a],r,U),[wl,wu]=it2mf(MF.level[b],w,U);fl.push(Math.min(rl,wl));fu.push(Math.min(ru,wu));y.push(CENTRE[o])});
  const k=km(y,fl,fu);let nt=0,nd=0;y.forEach((v,i)=>{nt+=v*(fl[i]+fu[i]);nd+=fl[i]+fu[i]});return {fl,fu,y,...k,crisp:(k.yl+k.yr)/2,nietan:nd?nt/nd:NaN}}
const riskLabel=v=>v<35?[tx("LOW","RENDAH"),"var(--ok)"]:v<65?[tx("MEDIUM — prepare","SEDERHANA — bersedia"),"var(--warn)"]:[tx("HIGH — evacuate early","TINGGI — pindah awal"),"var(--bad)"];
const C=()=>({a1:css("--a1"),a2:css("--a2"),acc:css("--acc"),ink:css("--ink2"),ok:css("--ok"),bad:css("--bad"),warn:css("--warn")});
const slider=(id,lab,min,max,val,step=1)=>`<label class="ctrl"><span>${lab}</span><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"><output id="${id}o">${val}</output></label>`;
const bind=(el,ids,fn)=>{ids.forEach(i=>{const s=el.querySelector("#"+i);s.oninput=()=>{el.querySelector("#"+i+"o").textContent=s.value;fn()}});fn()};
const val=(el,id)=>+el.querySelector("#"+id).value;
function drawSets(svg,setDefs,x0,x1,probe,xl,U){const P=plot(svg,{x0,x1,y0:0,y1:1.05,w:520,h:200,pad:{l:34,r:10,t:10,b:30}});const c=C(),cols=[c.ok,c.warn,c.bad];
  P.axes(xl,"μ",[x0,(x0+x1)/4,(x0+x1)/2,3*(x0+x1)/4,x1].map(Math.round),[0,0.5,1]);
  Object.entries(setDefs).forEach(([k,def],i)=>{if(U){P.el("path",{d:P.band(x=>it2mf(def,x,U)[0],x=>it2mf(def,x,U)[1]),fill:cols[i],"fill-opacity":.22,stroke:"none"})}
    P.el("path",{d:P.path(x=>U?it2mf(def,x,U)[1]:mu(def,x)),fill:"none",stroke:cols[i],"stroke-width":2.5});
    if(U)P.el("path",{d:P.path(x=>it2mf(def,x,U)[0]),fill:"none",stroke:cols[i],"stroke-width":1.5,"stroke-dasharray":"4 3"});
    const pk=def[0]==="tri"?def[1][1]:(def[1][1]+def[1][2])/2;P.el("text",{x:P.X(pk),y:P.Y(1.02)-2,"text-anchor":"middle","font-size":12,"font-weight":700,fill:cols[i]}).textContent=nm(k)});
  if(probe!=null){P.el("line",{x1:P.X(probe),x2:P.X(probe),y1:P.Y(0),y2:P.Y(1.05),stroke:c.a1,"stroke-width":2,"stroke-dasharray":"5 4"})}return P}

/* ---------- section labels ---------- */
const S3b={en:"Beyond the basics",bm:"Melangkaui asas"};const S0={en:"Start",bm:"Mula"},S1={en:"Empathise & define",bm:"Empati & takrif"},S2={en:"Type-1 fuzzy logic",bm:"Logik kabur Jenis-1"},S3={en:"Type-2 fuzzy logic",bm:"Logik kabur Jenis-2"},S4={en:"Apply, protect & reflect",bm:"Aplikasi, lindungi & refleksi"};
const dt=on=>`<div class="dtbar">${[["Empathise","Empati"],["Define","Takrif"],["Ideate","Idea"],["Prototype","Prototaip"],["Test","Uji"]].map((s,i)=>`<span class="${on.includes(i)?"on":""}">${L(s[0],s[1])}</span>`).join("")}</div>`;
const ref=(txt,url)=>`<li>${txt} <a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\//,"")}</a></li>`;

const slides=[];const add=s=>slides.push(s);

/* 1 TITLE */
add({sec:S0,t:{en:"Title",bm:"Tajuk"},html:`
<div class="cols c2" style="align-items:center">
 <div><div class="kicker rv">TTTC6544 · ${L("Advanced Artificial Intelligence","Kecerdasan Buatan Lanjutan")} · ${L("Module A","Modul A")}</div>
 <h1 class="big rv"><span class="grad">${L("Fuzzy Logic","Logik Kabur")}</span><br>${L("Type-1 &amp; Type-2","Jenis-1 &amp; Jenis-2")}</h1>
 <p class="lead rv">${L("Reasoning with words, degrees and doubt — then designing for the doubt itself.","Menaakul dengan kata, darjah dan keraguan — kemudian mereka bentuk untuk keraguan itu sendiri.")}</p>
 <div class="rv" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><span class="pill l1">${L("No-code first","Tanpa kod dahulu")}</span><span class="pill">${L("Problem-based","Berasaskan masalah")}</span><span class="pill">${L("Design thinking","Pemikiran reka bentuk")}</span><span class="pill">${L("Values-based","Berasaskan nilai")}</span><span class="pill">≈ 3 ${L("hours","jam")}</span></div>
 <p class="small muted rv" style="margin-top:16px">${L("Press","Tekan")} <kbd>→</kbd> ${L("to begin ·","untuk mula ·")} <kbd>N</kbd> ${L("for deep-dive notes","untuk nota mendalam")}</p></div>
 <div class="rv float"><svg viewBox="0 0 420 300" id="heroF" aria-hidden="true"></svg></div></div>`,
 notes:{en:"<p>This module is self-instructional: every slide has deep-dive notes (N), every simulator has a challenge, and every section ends with a quiz that gives instant feedback. Work at your own pace; the run-sheet in the hub suggests timings for a whole-day session.</p>",bm:"<p>Modul ini direka untuk pembelajaran kendiri: setiap slaid mempunyai nota mendalam (N), setiap simulator mempunyai cabaran, dan setiap bahagian diakhiri kuiz dengan maklum balas serta-merta. Belajar mengikut kadar sendiri; jadual pelaksanaan di hab mencadangkan masa untuk sesi sehari penuh.</p>"},
 show(el){const svg=el.querySelector("#heroF");const P=plot(svg,{x0:0,x1:100,y0:0,y1:1.15,w:420,h:300,pad:{l:10,r:10,t:10,b:20}});P.clear();const c=C();
  P.el("path",{d:P.band(x=>tri(x,30,50,70),x=>tri(x,15,50,85)),fill:c.a1,"fill-opacity":.18});
  [0,1,2,3,4].forEach(i=>P.el("path",{d:P.path(x=>tri(x,15+i*3.75,50,85-i*3.75)),fill:"none",stroke:i%2?c.a2:c.a1,"stroke-width":2,"stroke-opacity":.35+i*.15,class:"drawon",style:`animation-delay:${.2+i*.25}s`}));
  P.el("path",{d:P.path(x=>x<50?0:1),fill:"none",stroke:c.acc,"stroke-width":2,"stroke-dasharray":"6 5"});
  P.el("text",{x:P.X(8),y:P.Y(1.08),"font-size":13,fill:c.acc}).textContent=tx("crisp","rangup");P.el("text",{x:P.X(72),y:P.Y(.55),"font-size":13,fill:c.a1}).textContent=tx("FOU (Type-2)","FOU (Jenis-2)")}});

/* 2 HOW TO USE */
add({sec:S0,t:{en:"How to use this module",bm:"Cara menggunakan modul ini"},html:`
<div class="kicker rv">🧭 ${L("Self-instructional guide","Panduan pembelajaran kendiri")}</div><h2 class="rv">${L("Your controls &amp; signposts","Kawalan &amp; penanda arah anda")}</h2>
<div class="cols c4">
 <div class="card rv"><div class="ic">⌨️</div><h4>${L("Navigate","Navigasi")}</h4><p class="small"><kbd>←</kbd> <kbd>→</kbd> ${L("or swipe","atau leret")} · <kbd>T</kbd> ${L("contents","kandungan")} · <kbd>N</kbd> ${L("notes","nota")}</p></div>
 <div class="card rv"><div class="ic">🌐</div><h4>BM / EN</h4><p class="small">${L("Toggle any time (top bar or","Tukar bila-bila masa (bar atas atau")} <kbd>L</kbd>). ${L("Dark mode:","Mod gelap:")} <kbd>D</kbd></p></div>
 <div class="card rv"><div class="ic">🧪</div><h4>${L("Three levels","Tiga tahap")}</h4><p class="small"><span class="pill l1">${L("L1 No-code","T1 Tanpa kod")}</span><span class="pill l2">${L("L2 Low-code","T2 Kod rendah")}</span><span class="pill l3">${L("L3 Code","T3 Berkod")}</span><br>${L("Pick the one that fits you; all reach the same answer.","Pilih yang sesuai; semuanya mencapai jawapan yang sama.")}</p></div>
 <div class="card rv"><div class="ic">✅</div><h4>${L("Instant feedback","Maklum balas segera")}</h4><p class="small">${L("Quizzes explain every answer. Progress ticks appear in Contents.","Kuiz menerangkan setiap jawapan. Tanda kemajuan muncul dalam Kandungan.")}</p></div></div>
<div class="cols c3" style="margin-top:14px">
 <div class="call fact rv"><b>${L("Fact","Fakta")}</b>${L("Key facts worth remembering.","Fakta penting untuk diingati.")}</div>
 <div class="call new rv"><b>${L("Now (2024–2026)","Terkini (2024–2026)")}</b>${L("Recent advances and new technology.","Kemajuan dan teknologi terkini.")}</div>
 <div class="call eth rv"><b>${L("Safety &amp; ethics","Keselamatan &amp; etika")}</b>${L("Data protection and responsible AI use.","Perlindungan data dan penggunaan AI bertanggungjawab.")}</div>
 <div class="call val rv"><b>${L("Value","Nilai")}</b>${L("The value anchoring this part (values-based education).","Nilai yang menjadi teras bahagian ini (pendidikan berasaskan nilai).")}</div>
 <div class="call dt rv"><b>${L("Design thinking","Pemikiran reka bentuk")}</b>${L("Which stage you are in.","Peringkat yang sedang anda lalui.")}</div>
 <div class="call tip rv"><b>${L("Challenge","Cabaran")}</b>${L("A task to try in a simulator before moving on.","Tugasan untuk dicuba dalam simulator sebelum meneruskan.")}</div></div>`,
 notes:{en:"<p>Andragogy (Knowles) assumes adult learners need to know <i>why</i>, bring experience, and learn best around real problems. So each section opens with the problem, lets you choose your level, and asks you to apply ideas immediately.</p>",bm:"<p>Andragogi (Knowles) mengandaikan pelajar dewasa perlu tahu <i>mengapa</i>, membawa pengalaman, dan belajar paling baik melalui masalah sebenar. Oleh itu setiap bahagian dibuka dengan masalah, membenarkan anda memilih tahap, dan meminta anda mengaplikasikan idea dengan segera.</p>"}});

/* 3 JOURNEY */
add({sec:S0,t:{en:"Learning journey",bm:"Perjalanan pembelajaran"},html:`
<div class="kicker rv">🗺️ ${L("The day at a glance","Gambaran keseluruhan hari")}</div><h2 class="rv">${L("One problem, two toolkits, five design stages","Satu masalah, dua set alat, lima peringkat reka bentuk")}</h2>
<svg viewBox="0 0 1000 220" class="rv" style="width:100%" aria-label="design thinking journey">
 <defs><linearGradient id="gj" x1="0" x2="1"><stop offset="0" stop-color="var(--a1)"/><stop offset="1" stop-color="var(--a2)"/></linearGradient></defs>
 <path d="M40 120 C 200 20, 300 220, 500 120 S 800 20, 960 120" stroke="url(#gj)" stroke-width="6" fill="none" class="drawon"/>
 ${[["Empathise","Empati","👥",60,"Module A s4"],["Define","Takrif","🎯",260,""],["Ideate","Idea","💡",480,""],["Prototype","Prototaip","🛠️",700,""],["Test","Uji","🧪",900,""]].map(s=>`<g><circle cx="${s[3]}" cy="120" r="34" fill="var(--bg2)" stroke="url(#gj)" stroke-width="4"/><text x="${s[3]}" y="130" text-anchor="middle" font-size="26">${s[2]}</text><text x="${s[3]}" y="185" text-anchor="middle" font-size="16" font-weight="700" style="fill:var(--ink)"><tspan class="en">${s[0]}</tspan><tspan class="bm">${s[1]}</tspan></text></g>`).join("")}
</svg>
<div class="cols c3">
 <div class="card rv"><h4>${L("Morning · Module A","Pagi · Modul A")}</h4><p class="small">${L("Fuzzy Type-1 → Type-2. Encode expert knowledge as rules; model disagreement as a Footprint of Uncertainty.","Kabur Jenis-1 → Jenis-2. Mengekod pengetahuan pakar sebagai peraturan; memodelkan percanggahan sebagai Jejak Ketidakpastian.")}</p></div>
 <div class="card rv"><h4>${L("Afternoon · Module B","Petang · Modul B")}</h4><p class="small">${L("Artificial neural networks. Learn the pattern from data; evaluate, explain and protect it.","Rangkaian neural buatan. Mempelajari corak daripada data; menilai, menerang dan melindunginya.")}</p></div>
 <div class="card rv"><h4>${L("Studio · Hybrid","Studio · Hibrid")}</h4><p class="small">${L("Prototype and test a hybrid early-warning concept (fuzzy + ANN) with an ethics impact check.","Membina prototaip dan menguji konsep amaran awal hibrid (kabur + ANN) dengan semakan impak etika.")}</p></div></div>`,
 notes:{en:"<p>Design thinking (Stanford d.school) runs through the day: <b>Empathise</b> with people affected by floods, <b>Define</b> the decision to support, <b>Ideate</b> rules and models, <b>Prototype</b> with no-code tools, and <b>Test</b> against data, stakeholders and ethics.</p>",bm:"<p>Pemikiran reka bentuk (Stanford d.school) menjadi benang merah sepanjang hari: <b>Empati</b> terhadap mangsa banjir, <b>Takrif</b> keputusan yang ingin dibantu, <b>Idea</b> peraturan dan model, <b>Prototaip</b> dengan alat tanpa kod, dan <b>Uji</b> terhadap data, pihak berkepentingan serta etika.</p>"}});

/* 4 ANCHOR PROBLEM */
add({sec:S1,t:{en:"The anchor problem",bm:"Masalah teras"},html:`
${dt([0])}<div class="kicker rv">🌧️ ${L("Problem-based learning","Pembelajaran berasaskan masalah")}</div>
<h2 class="rv">${L("4:40 pm. Heavy rain. Should the taman be warned?","4:40 petang. Hujan lebat. Perlukah taman perumahan diberi amaran?")}</h2>
<p class="lead rv">${L("Flash floods hit the Klang Valley repeatedly. Sensors give numbers; people need a decision they trust — early, explainable and fair.","Banjir kilat berulang kali melanda Lembah Klang. Penderia memberi nombor; manusia memerlukan keputusan yang boleh dipercayai — awal, boleh diterangkan dan adil.")}</p>
<div class="cols c3">
 <div class="card tint rv"><div class="ic">👵</div><h4>${L("Mak Som, resident","Mak Som, penduduk")}</h4><p class="small">${L("“Don't flood me with false alarms — but never let me be the last to know.”","“Jangan beri saya amaran palsu bertubi-tubi — tetapi jangan biarkan saya orang terakhir yang tahu.”")}</p></div>
 <div class="card tint rv"><div class="ic">👷</div><h4>${L("Encik Hafiz, drainage officer","Encik Hafiz, pegawai saliran")}</h4><p class="small">${L("“My experts don't agree on what ‘heavy rain’ means. I need a system that can explain itself.”","“Pakar saya tidak sepakat tentang maksud ‘hujan lebat’. Saya perlukan sistem yang boleh menerangkan dirinya.”")}</p></div>
 <div class="card tint rv"><div class="ic">🧑‍💻</div><h4>${L("Aina, data steward","Aina, pengurus data")}</h4><p class="small">${L("“Phone-location data would help — but whose consent do we have?”","“Data lokasi telefon akan membantu — tetapi persetujuan siapa yang kita ada?”")}</p></div></div>
<div class="call dt rv"><b>${L("Empathise task (5 min)","Tugasan empati (5 minit)")}</b>${L("Write one need, one fear and one constraint for each persona. Keep them — you will design against them later.","Tulis satu keperluan, satu kebimbangan dan satu kekangan bagi setiap persona. Simpan — anda akan mereka bentuk berdasarkannya kemudian.")}</div>`,
 notes:{en:"<p>The personas are fictional but the pattern is real: early-warning systems trade off false alarms against missed events, depend on expert judgement, and often touch personal data. We will return to all three tensions.</p>",bm:"<p>Persona ini rekaan tetapi coraknya benar: sistem amaran awal mengimbangi amaran palsu dengan kejadian terlepas, bergantung pada pertimbangan pakar, dan sering melibatkan data peribadi. Kita akan kembali kepada ketiga-tiga ketegangan ini.</p>"}});

/* 5 HMW + LO */
add({sec:S1,t:{en:"Define & learning outcomes",bm:"Takrif & hasil pembelajaran"},html:`
${dt([1])}<div class="cols c2" style="align-items:start">
<div><div class="kicker rv">🎯 ${L("Point of view","Sudut pandangan")}</div><h2 class="rv">${L("How might we…","Bagaimanakah kita boleh…")}</h2>
<p class="lead rv">${L("…turn vague, disputed expert knowledge (“heavy rain”, “rising fast”) into a transparent flood-risk decision that residents can trust?","…menukar pengetahuan pakar yang kabur dan dipertikai (“hujan lebat”, “naik dengan cepat”) kepada keputusan risiko banjir yang telus dan dipercayai penduduk?")}</p>
<div class="call val rv"><b>${L("Value: Amanah (trust)","Nilai: Amanah")}</b>${L("A warning is a promise. Design so that people can check why it was made.","Amaran ialah janji. Reka bentuk supaya orang boleh menyemak mengapa ia dibuat.")}</div></div>
<div class="card rv"><h3>${L("By the end you can…","Pada akhir modul anda boleh…")}</h3><ol class="tight">
<li>${L("Explain fuzzy sets, membership functions and linguistic variables.","Menerangkan set kabur, fungsi keahlian dan pemboleh ubah linguistik.")}</li>
<li>${L("Build and trace a Mamdani fuzzy inference system by hand and with no-code tools.","Membina dan menjejak sistem inferens kabur Mamdani secara manual dan dengan alat tanpa kod.")}</li>
<li>${L("Distinguish Type-1 from interval Type-2 and justify when Type-2 is worth it.","Membezakan Jenis-1 daripada Jenis-2 selang dan mewajarkan bila Jenis-2 berbaloi.")}</li>
<li>${L("Compute a type-reduced interval with Karnik–Mendel (conceptually).","Mengira selang terturun jenis dengan Karnik–Mendel (secara konsep).")}</li>
<li>${L("Evaluate a fuzzy system for transparency, fairness and data protection.","Menilai sistem kabur dari segi ketelusan, keadilan dan perlindungan data.")}</li></ol></div></div>`,
 notes:{en:"<p>Outcomes map to Bloom levels: explain (understand), build/trace (apply), distinguish/justify (analyse/evaluate), evaluate ethically (evaluate). The studio at the end asks you to create.</p>",bm:"<p>Hasil pembelajaran dipetakan kepada aras Bloom: menerangkan (memahami), membina/menjejak (mengaplikasi), membeza/mewajarkan (menganalisis/menilai), menilai secara beretika (menilai). Studio di akhir modul meminta anda mencipta.</p>"}});

/* 6 WARM-UP */
add({sec:S2,t:{en:"Warm-up: is 30 °C hot?",bm:"Pemanasan: adakah 30 °C panas?"},html:`
<div class="cols c2" style="align-items:center"><div>
<div class="kicker rv">🔥 ${L("Warm-up","Pemanasan")}</div><h2 class="rv">${L("Is 29.9 °C “hot”? And 30.0 °C?","Adakah 29.9 °C “panas”? Bagaimana dengan 30.0 °C?")}</h2>
<p class="lead rv">${L("Crisp logic draws a hard line. Human language doesn't. Move the threshold and the probe, and watch the two answers disagree.","Logik rangup melukis garis keras. Bahasa manusia tidak begitu. Gerakkan ambang dan prob, dan lihat dua jawapan itu bercanggah.")}</p>
<div class="call fact rv"><b>${L("The sorites paradox","Paradoks sorites")}</b>${L("If one grain doesn't make a heap, when does a heap begin? Fuzzy sets answer: gradually.","Jika sebutir pasir tidak membentuk timbunan, bila timbunan bermula? Set kabur menjawab: secara beransur-ansur.")}</div></div>
<div class="sim rv"><svg id="wu"></svg>${slider("thr",L("Your “hot” threshold","Ambang “panas” anda"),24,36,30,.5)}${slider("tp",L("Temperature now","Suhu sekarang"),20,40,29.9,.1)}<div class="readout" id="wur"></div></div></div>`,
 notes:{en:"<p>A crisp set has membership 0 or 1. A fuzzy set (Zadeh, 1965) allows any degree in [0,1]. Here the fuzzy curve ramps from threshold−4 °C to threshold+4 °C, so 29.9 °C and 30.0 °C get almost the same degree — matching intuition.</p>",bm:"<p>Set rangup mempunyai keahlian 0 atau 1. Set kabur (Zadeh, 1965) membenarkan sebarang darjah dalam [0,1]. Di sini lengkung kabur meningkat dari ambang−4 °C hingga ambang+4 °C, jadi 29.9 °C dan 30.0 °C mendapat darjah hampir sama — selari dengan gerak hati.</p>"},
 init(el){this._el=el;bind(el,["thr","tp"],()=>this.show(el))},
 show(el){const t=val(el,"thr"),p=val(el,"tp"),c=C();const P=plot(el.querySelector("#wu"),{x0:20,x1:40,y0:0,y1:1.1,w:520,h:230});P.clear();P.axes("°C","μ(hot)",[20,25,30,35,40],[0,.5,1]);
  P.el("path",{d:P.path(x=>x>=t?1:0,400),fill:"none",stroke:c.acc,"stroke-width":2.5,"stroke-dasharray":"6 4"});P.el("path",{d:P.path(x=>trap(x,t-4,t+4,99,99)),fill:"none",stroke:c.a1,"stroke-width":3});
  P.el("line",{x1:P.X(p),x2:P.X(p),y1:P.Y(0),y2:P.Y(1.1),stroke:c.a2,"stroke-width":2});
  const cr=p>=t?1:0,fz=trap(p,t-4,t+4,99,99);el.querySelector("#wur").innerHTML=`<span class="r" style="color:${c.acc}"><b>${tx("Crisp","Rangup")}</b>${cr}</span><span class="r" style="color:${c.a1}"><b>${tx("Fuzzy","Kabur")}</b>${fz.toFixed(2)}</span><span class="r"><b>Δ</b>${tx("a 0.1 °C change can flip crisp from 0 to 1","perubahan 0.1 °C boleh menukar rangup dari 0 ke 1")}</span>`}});

/* 7 DEFINITIONS */
add({sec:S2,t:{en:"Key definitions",bm:"Takrif utama"},html:`
<div class="kicker rv">📐 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Anatomy of a fuzzy set","Anatomi set kabur")}</h2>
<div class="cols c2" style="align-items:center">
<svg viewBox="0 0 520 260" class="rv" aria-label="anatomy">
 <line x1="40" y1="220" x2="500" y2="220" class="axis"/><line x1="40" y1="220" x2="40" y2="20" class="axis"/>
 <path d="M90 220 L200 50 L320 50 L440 220" fill="var(--a1)" fill-opacity=".12" stroke="var(--a1)" stroke-width="3" class="drawon"/>
 <line x1="40" y1="50" x2="500" y2="50" class="gridl"/><text x="30" y="54" text-anchor="end" font-size="12">1</text><text x="30" y="224" text-anchor="end" font-size="12">0</text>
 <line x1="40" y1="135" x2="500" y2="135" stroke="var(--a2)" stroke-dasharray="5 4"/><text x="30" y="139" text-anchor="end" font-size="12">α</text>
 <line x1="145" y1="135" x2="380" y2="135" stroke="var(--a2)" stroke-width="5"/>
 <line x1="200" y1="40" x2="320" y2="40" stroke="var(--acc)" stroke-width="5"/>
 <line x1="90" y1="238" x2="440" y2="238" stroke="var(--ink2)" stroke-width="3"/>
 <text x="260" y="32" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--acc)"><tspan class="en">core (μ = 1)</tspan><tspan class="bm">teras (μ = 1)</tspan></text>
 <text x="262" y="128" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--a2)"><tspan class="en">α-cut</tspan><tspan class="bm">potongan-α</tspan></text>
 <text x="265" y="256" text-anchor="middle" font-size="13" font-weight="700"><tspan class="en">support (μ &gt; 0)</tspan><tspan class="bm">sokongan (μ &gt; 0)</tspan></text>
 <text x="480" y="212" text-anchor="end" font-size="12"><tspan class="en">universe X</tspan><tspan class="bm">semesta X</tspan></text></svg>
<div class="cols" style="grid-template-columns:1fr 1fr;gap:10px">
 <div class="card rv"><b>${L("Fuzzy set","Set kabur")}</b><p class="small">A = {(x, μ<sub>A</sub>(x)) | x ∈ X}, μ<sub>A</sub>: X → [0,1]</p></div>
 <div class="card rv"><b>${L("Membership function","Fungsi keahlian")}</b><p class="small">${L("Degree to which x is compatible with the concept.","Darjah keserasian x dengan konsep.")}</p></div>
 <div class="card rv"><b>${L("Linguistic variable","Pemboleh ubah linguistik")}</b><p class="small">${L("A variable whose values are words: Rain ∈ {Light, Moderate, Heavy}.","Pemboleh ubah yang nilainya ialah kata: Hujan ∈ {Ringan, Sederhana, Lebat}.")}</p></div>
 <div class="card rv"><b>${L("Normal &amp; height","Normal &amp; ketinggian")}</b><p class="small">${L("Height = max μ. A normal set reaches 1.","Ketinggian = μ maksimum. Set normal mencapai 1.")}</p></div></div></div>
<div class="call fact rv"><b>${L("Membership ≠ probability","Keahlian ≠ kebarangkalian")}</b>${L("μ = 0.7 says “compatible to degree 0.7” (vagueness), not “70% chance” (randomness). Memberships across sets need not sum to 1.","μ = 0.7 bermaksud “serasi pada darjah 0.7” (kekaburan), bukan “peluang 70%” (kerawakan). Jumlah keahlian merentas set tidak semestinya 1.")}</div>`,
 notes:{en:"<p>An α-cut A<sub>α</sub> = {x | μ<sub>A</sub>(x) ≥ α} turns a fuzzy set into a crisp interval. α-cuts matter later: some Type-2 methods (α-planes) and many fuzzy-arithmetic tools work slice by slice.</p>",bm:"<p>Potongan-α A<sub>α</sub> = {x | μ<sub>A</sub>(x) ≥ α} menukar set kabur kepada selang rangup. Potongan-α penting kemudian: sesetengah kaedah Jenis-2 (satah-α) dan banyak alat aritmetik kabur bekerja hirisan demi hirisan.</p>"}});

/* 8 TIMELINE */
add({sec:S2,t:{en:"60 years of fuzzy logic",bm:"60 tahun logik kabur"},html:`
<div class="kicker rv">🕰️ ${L("History","Sejarah")}</div><h2 class="rv">${L("From a 1965 paper to deep learning hybrids","Daripada makalah 1965 kepada hibrid pembelajaran mendalam")}</h2>
<div class="tl rv">
 <div class="ev"><div class="y">1965</div>${L("Zadeh publishes “Fuzzy Sets”.","Zadeh menerbitkan “Fuzzy Sets”.")}</div>
 <div class="ev"><div class="y">1975</div>${L("Mamdani &amp; Assilian control a steam engine with rules; Zadeh proposes type-2 sets.","Mamdani &amp; Assilian mengawal enjin stim dengan peraturan; Zadeh mencadangkan set jenis-2.")}</div>
 <div class="ev"><div class="y">1985</div>${L("Takagi–Sugeno model: rule outputs become functions.","Model Takagi–Sugeno: output peraturan menjadi fungsi.")}</div>
 <div class="ev"><div class="y">1987</div>${L("Sendai subway runs on fuzzy train control.","Kereta api bawah tanah Sendai beroperasi dengan kawalan kabur.")}</div>
 <div class="ev"><div class="y">1993</div>${L("ANFIS: neural learning tunes fuzzy rules.","ANFIS: pembelajaran neural menala peraturan kabur.")}</div>
 <div class="ev"><div class="y">2000–02</div>${L("Mendel et al. make interval type-2 systems practical.","Mendel et al. menjadikan sistem jenis-2 selang praktikal.")}</div>
 <div class="ev"><div class="y">2004</div>${L("Type-2 controllers steer outdoor mobile robots.","Pengawal jenis-2 mengemudi robot bergerak luar.")}</div>
 <div class="ev now"><div class="y">2025</div>${L("IT2 systems trained with deep-learning optimisers for prediction intervals.","Sistem IT2 dilatih dengan pengoptimum pembelajaran mendalam untuk selang ramalan.")}</div></div>
<div class="call fact rv"><b>${L("Memorable","Mudah diingat")}</b>${L("The 1990 Japanese consumer boom put “fuzzy” on rice cookers, washing machines and camcorders — logic you could buy at a shop.","Ledakan pengguna Jepun sekitar 1990 meletakkan label “fuzzy” pada periuk nasi, mesin basuh dan kamera video — logik yang boleh dibeli di kedai.")}</div>`,
 notes:{en:"<p>Primary sources are on the Resources slide with DOIs: Zadeh (1965), Mamdani &amp; Assilian (1975), Takagi &amp; Sugeno (1985), Jang (1993), Karnik, Mendel &amp; Liang (1999), Mendel &amp; John (2002), Hagras (2004), Köklü, Güven &amp; Kumbasar (2025).</p>",bm:"<p>Sumber primer disenaraikan pada slaid Sumber beserta DOI: Zadeh (1965), Mamdani &amp; Assilian (1975), Takagi &amp; Sugeno (1985), Jang (1993), Karnik, Mendel &amp; Liang (1999), Mendel &amp; John (2002), Hagras (2004), Köklü, Güven &amp; Kumbasar (2025).</p>"}});

/* 9 MF EXPLORER */
const MFT={tri:{n:["Triangular","Segi tiga"],p:[["a",10],["b",50],["c",90]],f:(x,p)=>tri(x,p[0],p[1],p[2]),eq:"max(0, min((x−a)/(b−a), (c−x)/(c−b)))"},
 trap:{n:["Trapezoidal","Trapezium"],p:[["a",10],["b",35],["c",65],["d",90]],f:(x,p)=>trap(x,...p),eq:"max(0, min((x−a)/(b−a), 1, (d−x)/(d−c)))"},
 gauss:{n:["Gaussian","Gaussian"],p:[["c",50],["σ",12]],f:(x,p)=>Math.exp(-((x-p[0])**2)/(2*Math.max(p[1],1)**2)),eq:"exp(−(x−c)² / 2σ²)"},
 bell:{n:["Generalised bell","Loceng teritlak"],p:[["a",20],["b",3],["c",50]],f:(x,p)=>1/(1+Math.abs((x-p[2])/Math.max(p[0],1))**(2*Math.max(p[1],.5))),eq:"1 / (1 + |(x−c)/a|^(2b))"},
 sig:{n:["Sigmoid","Sigmoid"],p:[["a",15],["c",50]],f:(x,p)=>1/(1+Math.exp(-p[0]/100*(x-p[1]))),eq:"1 / (1 + exp(−a(x−c)))   (a shown ×100)"}};
add({sec:S2,t:{en:"Membership function explorer",bm:"Penjelajah fungsi keahlian"},html:`
<div class="kicker rv">🧪 ${L("Instrument","Instrumen")} · ${L("Interactive","Interaktif")}</div><h2 class="rv">${L("Shape the meaning of a word","Bentukkan makna sesuatu perkataan")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="mfx"></svg><div class="readout" id="mfr"></div></div>
<div class="rv"><label class="ctrl"><span>${L("Shape","Bentuk")}</span><select id="mft">${Object.entries(MFT).map(([k,v])=>`<option value="${k}">${v.n[0]} / ${v.n[1]}</option>`).join("")}</select><span></span></label>
<div id="mfp"></div>${slider("mfx0",L("Probe x","Prob x"),0,100,42)}
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("Make a trapezoid whose core is 40–60 and whose μ(30) = 0.5. Which a and b work?","Bina trapezium dengan teras 40–60 dan μ(30) = 0.5. Nilai a dan b manakah yang sesuai?")}</div>
<table class="t small"><tr><th>${L("Shape","Bentuk")}</th><th>${L("Use when…","Guna apabila…")}</th></tr>
<tr><td>${L("Triangle / trapezoid","Segi tiga / trapezium")}</td><td>${L("Fast, easy to explain; experts give corner points.","Pantas, mudah diterangkan; pakar memberi titik sudut.")}</td></tr>
<tr><td>Gaussian / bell</td><td>${L("Smooth outputs; gradient-based tuning (e.g. ANFIS).","Output licin; penalaan berasaskan kecerunan (cth. ANFIS).")}</td></tr>
<tr><td>Sigmoid</td><td>${L("Open-ended concepts: “very high”, “old”.","Konsep terbuka: “sangat tinggi”, “tua”.")}</td></tr></table></div></div>`,
 notes:{en:"<p>Choosing a shape is a modelling decision, not a mathematical truth. In practice, triangles/trapezoids dominate controllers and expert systems; Gaussians dominate learned neuro-fuzzy models because they are differentiable everywhere.</p>",bm:"<p>Memilih bentuk ialah keputusan pemodelan, bukan kebenaran matematik. Dalam amalan, segi tiga/trapezium mendominasi pengawal dan sistem pakar; Gaussian mendominasi model neuro-kabur yang dipelajari kerana ia boleh dibezakan di semua titik.</p>"},
 init(el){const sel=el.querySelector("#mft");const build=()=>{const T=MFT[sel.value];el.querySelector("#mfp").innerHTML=T.p.map((q,i)=>slider("mp"+i,q[0],q[0]==="b"&&sel.value==="bell"?1:0,100,q[1])).join("");bind(el,T.p.map((q,i)=>"mp"+i),()=>this.show(el))};
  sel.onchange=build;build();bind(el,["mfx0"],()=>this.show(el))},
 show(el){const k=el.querySelector("#mft").value,T=MFT[k];const p=T.p.map((q,i)=>val(el,"mp"+i));if(k==="tri"){p.sort((a,b)=>a-b)}if(k==="trap")p.sort((a,b)=>a-b);
  const x=val(el,"mfx0"),c=C();const P=plot(el.querySelector("#mfx"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:240});P.clear();P.axes("x","μ(x)",[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.area(z=>T.f(z,p)),fill:c.a1,"fill-opacity":.15});P.el("path",{d:P.path(z=>T.f(z,p),300),fill:"none",stroke:c.a1,"stroke-width":3});
  const m=T.f(x,p);P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(0),y2:P.Y(m),stroke:c.a2,"stroke-width":2});P.el("circle",{cx:P.X(x),cy:P.Y(m),r:6,fill:c.a2});
  el.querySelector("#mfr").innerHTML=`<span class="r"><b>μ(${x})</b>${m.toFixed(3)}</span><span class="r"><b>${tx("formula","formula")}</b>${T.eq}</span>`}});

/* 10 HEDGES */
add({sec:S2,t:{en:"Linguistic hedges",bm:"Pagar linguistik"},html:`
<div class="kicker rv">🗣️ ${L("Computing with words","Pengkomputeran dengan kata")}</div><h2 class="rv">${L("“Very”, “somewhat”, “not” — as maths","“Sangat”, “agak”, “tidak” — sebagai matematik")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="hg"></svg>${slider("hx",L("River level (%)","Paras sungai (%)"),0,100,70)}<div class="readout" id="hgr"></div></div>
<div class="rv"><table class="t"><tr><th>${L("Hedge","Pagar")}</th><th>${L("Operation","Operasi")}</th><th>${L("Effect","Kesan")}</th></tr>
<tr><td>${L("very","sangat")}</td><td>μ²</td><td>${L("concentration — stricter","pemekatan — lebih ketat")}</td></tr>
<tr><td>${L("extremely","amat sangat")}</td><td>μ³</td><td>${L("even stricter","lebih ketat lagi")}</td></tr>
<tr><td>${L("somewhat","agak")}</td><td>√μ</td><td>${L("dilation — looser","peluasan — lebih longgar")}</td></tr>
<tr><td>${L("not","tidak")}</td><td>1 − μ</td><td>${L("complement","pelengkap")}</td></tr></table>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("At what level is “very high” exactly 0.5? (Hint: solve μ² = 0.5.)","Pada paras berapakah “sangat tinggi” tepat 0.5? (Petunjuk: selesaikan μ² = 0.5.)")}</div>
<div class="call new"><b>${L("Now","Terkini")}</b>${L("Large language models handle hedges in text; fuzzy hedges let you pin the meaning down so a system behaves the same way every time — useful for audit.","Model bahasa besar mengendalikan pagar dalam teks; pagar kabur membolehkan makna ditetapkan supaya sistem bertindak sama setiap kali — berguna untuk audit.")}</div></div></div>`,
 notes:{en:"<p>Zadeh's hedges are conventions, not laws of nature. Their value is consistency: “very high” always means μ² of “high”, so stakeholders can inspect and argue about one definition.</p>",bm:"<p>Pagar Zadeh ialah konvensyen, bukan hukum alam. Nilainya ialah ketekalan: “sangat tinggi” sentiasa bermaksud μ² bagi “tinggi”, jadi pihak berkepentingan boleh memeriksa dan membahaskan satu takrif.</p>"},
 init(el){bind(el,["hx"],()=>this.show(el))},
 show(el){const x=val(el,"hx"),c=C();const base=z=>trap(z,55,85,100,100);const H=[[tx("high","tinggi"),z=>base(z),c.a1,0],[tx("very high","sangat tinggi"),z=>base(z)**2,c.a2,0],[tx("somewhat high","agak tinggi"),z=>Math.sqrt(base(z)),c.ok,0],[tx("not high","tidak tinggi"),z=>1-base(z),c.acc,1]];
  const P=plot(el.querySelector("#hg"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:240});P.clear();P.axes("%","μ",[0,25,50,75,100],[0,.5,1]);
  H.forEach(h=>P.el("path",{d:P.path(h[1],300),fill:"none",stroke:h[2],"stroke-width":2.5,"stroke-dasharray":h[3]?"6 4":""}));P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(0),y2:P.Y(1.08),stroke:c.ink,"stroke-dasharray":"3 3"});
  el.querySelector("#hgr").innerHTML=H.map(h=>`<span class="r" style="color:${h[2]}"><b>${h[0]}</b>${h[1](x).toFixed(2)}</span>`).join("")}});

/* 11 OPERATORS */
add({sec:S2,t:{en:"Fuzzy operators",bm:"Pengendali kabur"},html:`
<div class="kicker rv">⚙️ ${L("Concepts","Konsep")}</div><h2 class="rv">${L("AND, OR, NOT when truth is a degree","DAN, ATAU, TIDAK apabila kebenaran ialah darjah")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="op"></svg><label class="ctrl"><span>${L("Operator","Pengendali")}</span><select id="ops">
<option value="min">AND · min (Zadeh)</option><option value="prod">AND · ${OL("product","hasil darab")}</option><option value="max">OR · max</option><option value="psum">OR · ${OL("probabilistic sum","hasil tambah kebarangkalian")}</option><option value="not">NOT A · 1 − μ</option></select><span></span></label>${slider("ox",L("Probe x","Prob x"),0,100,52)}<div class="readout" id="opr"></div></div>
<div class="rv"><table class="t"><tr><th></th><th>${L("Classic (Zadeh)","Klasik (Zadeh)")}</th><th>${L("Algebraic","Algebra")}</th></tr>
<tr><td>AND (t-norm)</td><td>min(a,b)</td><td>a·b</td></tr><tr><td>OR (t-conorm)</td><td>max(a,b)</td><td>a + b − a·b</td></tr><tr><td>NOT</td><td colspan="2">1 − a</td></tr></table>
<div class="call fact"><b>${L("Why it matters","Mengapa penting")}</b>${L("min ignores the stronger input; product lets both count. Your choice changes how rules fire — and how strict your warning system is.","min mengabaikan input yang lebih kuat; hasil darab mengambil kira kedua-duanya. Pilihan anda mengubah cara peraturan menyala — dan ketegasan sistem amaran anda.")}</div>
<div class="call fact"><b>${L("Surprise","Kejutan")}</b>${L("With fuzzy sets, A AND (NOT A) is usually not empty. The law of the excluded middle does not hold — by design.","Bagi set kabur, A DAN (TIDAK A) lazimnya tidak kosong. Hukum tengah tersisih tidak berlaku — secara reka bentuk.")}</div></div></div>`,
 notes:{en:"<p>Any operator satisfying commutativity, associativity, monotonicity and boundary conditions is a valid t-norm. min is the largest t-norm; the drastic product is the smallest. Most toolkits let you choose.</p>",bm:"<p>Sebarang pengendali yang memenuhi sifat kalis tukar tertib, kalis sekutuan, keekanadaan dan syarat sempadan ialah norma-t yang sah. min ialah norma-t terbesar; hasil darab drastik ialah yang terkecil. Kebanyakan perisian membenarkan anda memilih.</p>"},
 init(el){el.querySelector("#ops").onchange=()=>this.show(el);bind(el,["ox"],()=>this.show(el))},
 show(el){const o=el.querySelector("#ops").value,x=val(el,"ox"),c=C();const A=z=>tri(z,10,40,70),B=z=>tri(z,35,65,95);
  const F={min:z=>Math.min(A(z),B(z)),prod:z=>A(z)*B(z),max:z=>Math.max(A(z),B(z)),psum:z=>A(z)+B(z)-A(z)*B(z),not:z=>1-A(z)}[o];
  const P=plot(el.querySelector("#op"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:240});P.clear();P.axes("x","μ",[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.area(F,300),fill:c.a2,"fill-opacity":.35});P.el("path",{d:P.path(A),fill:"none",stroke:c.a1,"stroke-width":2.5});if(o!=="not")P.el("path",{d:P.path(B),fill:"none",stroke:c.acc,"stroke-width":2.5});
  P.el("text",{x:P.X(40),y:P.Y(1.02),"text-anchor":"middle","font-size":13,"font-weight":700,fill:c.a1}).textContent="A";if(o!=="not")P.el("text",{x:P.X(65),y:P.Y(1.02),"text-anchor":"middle","font-size":13,"font-weight":700,fill:c.acc}).textContent="B";
  P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(0),y2:P.Y(1.08),stroke:c.ink,"stroke-dasharray":"3 3"});
  el.querySelector("#opr").innerHTML=`<span class="r"><b>μA</b>${A(x).toFixed(2)}</span>${o!=="not"?`<span class="r"><b>μB</b>${B(x).toFixed(2)}</span>`:""}<span class="r" style="color:${c.a2}"><b>${tx("result","hasil")}</b>${F(x).toFixed(2)}</span>`}});

/* 12 FIS PIPELINE */
add({sec:S2,t:{en:"The fuzzy inference pipeline",bm:"Saluran inferens kabur"},html:`
<div class="kicker rv">🔁 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Four steps: Fuzzify → Rules → Aggregate → Defuzzify","Empat langkah: Kaburkan → Peraturan → Agregat → Nyahkabur")}</h2>
<svg viewBox="0 0 1000 250" class="rv" style="width:100%">
 <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--a1)"/></marker></defs>
 ${[["Crisp inputs","Input rangup","🌧️ 45 mm/h · 🌊 70%",20],["Fuzzify","Kaburkan","Moderate 0.6 · Alert 0.75",215],["Rule base","Pangkalan peraturan","IF Moderate AND Alert THEN Medium",410],["Aggregate","Agregat","max of clipped outputs",605],["Defuzzify","Nyahkabur","centroid → 56.4",800]].map((b,i)=>`<g><rect x="${b[3]}" y="60" width="175" height="110" rx="16" fill="var(--bg2)" stroke="${i%2?"var(--a2)":"var(--a1)"}" stroke-width="2.5"/>
 <text x="${b[3]+87}" y="98" text-anchor="middle" font-size="17" font-weight="700" style="fill:var(--ink)"><tspan class="en">${b[0]}</tspan><tspan class="bm">${b[1]}</tspan></text><text x="${b[3]+87}" y="130" text-anchor="middle" font-size="11.5">${b[2]}</text></g>
 ${i<4?`<line x1="${b[3]+178}" y1="115" x2="${b[3]+212}" y2="115" stroke="var(--a1)" stroke-width="3" marker-end="url(#ar)" class="dash"/>`:""}`).join("")}
 <text x="500" y="220" text-anchor="middle" font-size="14" style="fill:var(--a1)" font-weight="700"><tspan class="en">Knowledge lives in the rule base — readable by humans</tspan><tspan class="bm">Pengetahuan tersimpan dalam pangkalan peraturan — boleh dibaca manusia</tspan></text></svg>
<div class="cols c4">
 <div class="card rv"><b>1 · ${L("Fuzzify","Kaburkan")}</b><p class="small">${L("Map each crisp input to degrees in every set.","Petakan setiap input rangup kepada darjah dalam setiap set.")}</p></div>
 <div class="card rv"><b>2 · ${L("Fire rules","Nyalakan peraturan")}</b><p class="small">${L("Combine antecedents with AND/OR → firing strength.","Gabungkan anteseden dengan DAN/ATAU → kekuatan nyalaan.")}</p></div>
 <div class="card rv"><b>3 · ${L("Imply &amp; aggregate","Implikasi &amp; agregat")}</b><p class="small">${L("Clip each consequent at its strength; merge with max.","Potong setiap akibat pada kekuatannya; gabung dengan max.")}</p></div>
 <div class="card rv"><b>4 · ${L("Defuzzify","Nyahkabur")}</b><p class="small">${L("Reduce the output shape to one actionable number.","Kurangkan bentuk output kepada satu nombor yang boleh diambil tindakan.")}</p></div></div>
<p class="small muted rv">${L("Mnemonic:","Mnemonik:")} <b>F-R-A-D</b> — ${L("“Fuzzy Rules Are Defensible.”","“Fuzzy Rules Are Defensible” (Peraturan kabur boleh dipertahankan).")}</p>`,
 notes:{en:"<p>This is the Mamdani pipeline. Sugeno/TSK replaces steps 3–4 with a weighted average of rule output functions, which is cheaper and differentiable — the reason TSK dominates learning and control optimisation.</p>",bm:"<p>Ini saluran Mamdani. Sugeno/TSK menggantikan langkah 3–4 dengan purata berpemberat bagi fungsi output peraturan, yang lebih murah dan boleh dibezakan — sebab TSK mendominasi pembelajaran dan pengoptimuman kawalan.</p>"}});

/* 13 MAMDANI SIM */
add({sec:S2,t:{en:"Flood-risk simulator (Type-1)",bm:"Simulator risiko banjir (Jenis-1)"},html:`
${dt([2,3])}<div class="kicker rv">🧪 ${L("Instrument","Instrumen")} · Mamdani</div><h2 class="rv" style="margin-bottom:6px">${L("Drive the flood-risk system","Pandu sistem risiko banjir")}</h2>
<div class="cols c2">
 <div class="sim rv">${slider("mr",L("🌧️ Rain (mm/h)","🌧️ Hujan (mm/j)"),0,100,45)}${slider("mw",L("🌊 River level (% of danger)","🌊 Paras sungai (% bahaya)"),0,100,70)}
  <label class="ctrl"><span>AND</span><select id="mand"><option value="min">min</option><option value="prod">${OL("product","hasil darab")}</option></select><span></span></label>
  <svg id="msr"></svg><svg id="msw"></svg></div>
 <div class="sim rv"><div id="mtab"></div><svg id="mout"></svg><div class="readout" id="mres"></div></div></div>
<div class="call tip rv"><b>${L("Challenge","Cabaran")}</b>${L("(1) Find a setting where rain is Light but risk is High. Which rule fires? (2) Switch AND to product — does the 45/70 answer move up or down? Why?","(1) Cari tetapan dengan hujan Ringan tetapi risiko Tinggi. Peraturan mana yang menyala? (2) Tukar DAN kepada hasil darab — adakah jawapan 45/70 naik atau turun? Mengapa?")}</div>`,
 notes:{en:"<p>Inputs: Rain (Light trap 0,0,10,30; Moderate tri 10,35,60; Heavy trap 40,70,100,100) and River level (Normal trap 0,0,40,60; Alert tri 40,65,85; Danger trap 70,90,100,100). Output Risk (Low, Medium, High). Nine rules, min implication, max aggregation, centroid over 0–100 in steps of 1. Identical settings in scikit-fuzzy give 56.4 for 45/70 — the same number you see here.</p>",bm:"<p>Input: Hujan (Ringan trap 0,0,10,30; Sederhana tri 10,35,60; Lebat trap 40,70,100,100) dan Paras sungai (Normal trap 0,0,40,60; Waspada tri 40,65,85; Bahaya trap 70,90,100,100). Output Risiko (Rendah, Sederhana, Tinggi). Sembilan peraturan, implikasi min, agregat max, sentroid pada 0–100 dengan langkah 1. Tetapan sama dalam scikit-fuzzy memberi 56.4 untuk 45/70 — nombor yang sama di sini.</p>"},
 init(el){el.querySelector("#mand").onchange=()=>this.show(el);bind(el,["mr","mw"],()=>this.show(el))},
 show(el){const r=val(el,"mr"),w=val(el,"mw"),op=el.querySelector("#mand").value,c=C();const R=mamdani(r,w,op);
  drawSets(el.querySelector("#msr"),MF.rain,0,100,r,tx("rain mm/h","hujan mm/j"));drawSets(el.querySelector("#msw"),MF.level,0,100,w,tx("level %","paras %"));
  const rows=["light","moderate","heavy"],cols=["normal","alert","danger"];
  el.querySelector("#mtab").innerHTML=`<table class="t small" style="text-align:center"><tr><th>${tx("Rain ↓ / Level →","Hujan ↓ / Paras →")}</th>${cols.map(k=>`<th>${nm(k)}</th>`).join("")}</tr>${rows.map((a,i)=>`<tr><th>${nm(a)}</th>${cols.map((b,j)=>{const k=i*3+j,f=R.f[k],o=RULES[k][2];return `<td style="background:color-mix(in srgb,${o==="low"?c.ok:o==="medium"?c.warn:c.bad} ${Math.round(f*70)}%,transparent)"><b>${nm(o)}</b><br><span style="font-family:var(--fm)">${f.toFixed(2)}</span></td>`}).join("")}</tr>`).join("")}</table>`;
  const P=plot(el.querySelector("#mout"),{x0:0,x1:100,y0:0,y1:1.05,w:520,h:200,pad:{l:34,r:10,t:10,b:30}});P.clear();P.axes(tx("risk","risiko"),"μ",[0,25,50,75,100],[0,.5,1]);
  Object.entries(MF.risk).forEach(([k,d],i)=>P.el("path",{d:P.path(x=>mu(d,x)),fill:"none",stroke:[c.ok,c.warn,c.bad][i],"stroke-width":1.2,"stroke-dasharray":"4 3"}));
  P.el("path",{d:P.area(R.agg,100),fill:c.a1,"fill-opacity":.35,stroke:c.a1,"stroke-width":2});
  if(!isNaN(R.crisp)){P.el("line",{x1:P.X(R.crisp),x2:P.X(R.crisp),y1:P.Y(0),y2:P.Y(1.05),stroke:c.a2,"stroke-width":3});P.el("text",{x:P.X(R.crisp)+5,y:P.Y(.95),"font-size":12,"font-weight":700,fill:c.a2}).textContent=tx("centroid","sentroid")}
  const lb=riskLabel(R.crisp);el.querySelector("#mres").innerHTML=`<span class="r" style="font-size:1.1rem"><b>${tx("Risk","Risiko")}</b>${isNaN(R.crisp)?"—":R.crisp.toFixed(1)}</span><span class="r" style="color:#fff;background:${lb[1]}">${lb[0]}</span>`}});

/* 14 WORKED EXAMPLE */
add({sec:S2,t:{en:"Worked example by hand",bm:"Contoh kerja secara manual"},html:`
<div class="kicker rv">✍️ ${L("Trace it","Jejaknya")}</div><h2 class="rv">${L("Rain 45 mm/h, level 70% — step by step","Hujan 45 mm/j, paras 70% — langkah demi langkah")}</h2>
<div class="cols c2"><div class="rv"><table class="t">
<tr><th>${L("Step","Langkah")}</th><th>${L("Working","Pengiraan")}</th><th>${L("Result","Hasil")}</th></tr>
<tr><td>1 ${L("Fuzzify rain","Kaburkan hujan")}</td><td>Moderate: (60−45)/(60−35)<br>Heavy: (45−40)/(70−40)</td><td>0.60<br>0.17</td></tr>
<tr><td>1 ${L("Fuzzify level","Kaburkan paras")}</td><td>Alert: (85−70)/(85−65)<br>Danger: (70−70)/20</td><td>0.75<br>0.00</td></tr>
<tr><td>2 ${L("Fire rules","Nyala peraturan")}</td><td>R5 Moderate∧Alert → Medium: min(0.60, 0.75)<br>R8 Heavy∧Alert → High: min(0.17, 0.75)</td><td>0.60<br>0.17</td></tr>
<tr><td>3 ${L("Aggregate","Agregat")}</td><td>${L("Medium clipped at 0.60 ∪ High clipped at 0.17","Sederhana dipotong pada 0.60 ∪ Tinggi dipotong pada 0.17")}</td><td>${L("shape","bentuk")}</td></tr>
<tr><td>4 ${L("Centroid","Sentroid")}</td><td>Σ μ(y)·y / Σ μ(y), y = 0…100</td><td><b>56.4</b></td></tr></table></div>
<div class="rv"><div class="call fact"><b>${L("Read it aloud","Baca dengan kuat")}</b>${L("“Rain is fairly moderate (0.6) and the river is on alert (0.75), so risk is medium to degree 0.6 — with a little pull towards high.” That sentence is the explanation.","“Hujan agak sederhana (0.6) dan sungai pada tahap waspada (0.75), maka risiko sederhana pada darjah 0.6 — dengan sedikit tarikan ke arah tinggi.” Ayat itulah penerangannya.")}</div>
<div class="call tip"><b>${L("Variation · harder","Variasi · lebih sukar")}</b>${L("Recompute with rain = 55. Which rule now dominates, and does the risk rise above 60? Check in the simulator.","Kira semula dengan hujan = 55. Peraturan mana yang dominan sekarang, dan adakah risiko melebihi 60? Semak dalam simulator.")}</div>
<p class="rv"><a class="btn" href="deck-fuzzy-math.html#s9">∑ ${L("Maths deep dive: the full Mamdani table","Pendalaman matematik: jadual Mamdani penuh")} →</a></p><div class="call tip"><b>${L("Variation · perspective","Variasi · perspektif")}</b>${L("A resident says “70% is already scary”. Edit the Alert set so 70% is mostly Danger. Who should be allowed to change the sets?","Seorang penduduk berkata “70% sudah menakutkan”. Ubah set Waspada supaya 70% kebanyakannya Bahaya. Siapakah yang patut dibenarkan mengubah set?")}</div></div></div>`,
 notes:{en:"<p>Tracing by hand at least once builds the mental model that no tool can give you. The final step is numerical: sum μ(y)·y over the grid and divide by Σμ(y). With a step of 1 the answer is 56.4; finer grids change the first decimal only slightly.</p>",bm:"<p>Menjejak secara manual sekurang-kurangnya sekali membina model mental yang tidak dapat diberikan oleh sebarang alat. Langkah akhir ialah berangka: jumlahkan μ(y)·y pada grid dan bahagi dengan Σμ(y). Dengan langkah 1 jawapannya 56.4; grid lebih halus hanya mengubah sedikit tempat perpuluhan pertama.</p>"}});

/* 15 MAMDANI vs SUGENO */
add({sec:S2,t:{en:"Mamdani vs Sugeno vs Tsukamoto",bm:"Mamdani lwn Sugeno lwn Tsukamoto"},html:`
<div class="kicker rv">⚖️ ${L("Compare","Bandingkan")}</div><h2 class="rv">${L("Three ways to finish a rule","Tiga cara melengkapkan peraturan")}</h2>
<table class="t rv"><tr><th></th><th>Mamdani (1975)</th><th>Sugeno / TSK (1985)</th><th>Tsukamoto</th></tr>
<tr><td>${L("Rule output","Output peraturan")}</td><td>${L("Fuzzy set: risk is <i>High</i>","Set kabur: risiko <i>Tinggi</i>")}</td><td>${L("Function: risk = 0.4·rain + 0.6·level","Fungsi: risiko = 0.4·hujan + 0.6·paras")}</td><td>${L("Monotonic fuzzy set → crisp value","Set kabur monoton → nilai rangup")}</td></tr>
<tr><td>${L("Final step","Langkah akhir")}</td><td>${L("Aggregate + defuzzify","Agregat + nyahkabur")}</td><td>${L("Weighted average","Purata berpemberat")}</td><td>${L("Weighted average","Purata berpemberat")}</td></tr>
<tr><td>${L("Strength","Kekuatan")}</td><td>${L("Most readable","Paling mudah dibaca")}</td><td>${L("Fast, differentiable, learnable","Pantas, boleh dibeza, boleh dipelajari")}</td><td>${L("Simple crisp outputs","Output rangup ringkas")}</td></tr>
<tr><td>${L("Typical use","Kegunaan lazim")}</td><td>${L("Expert systems, decision support","Sistem pakar, sokongan keputusan")}</td><td>${L("Control, ANFIS, forecasting","Kawalan, ANFIS, ramalan")}</td><td>${L("Teaching, simple control","Pengajaran, kawalan ringkas")}</td></tr></table>
<div class="cols c2" style="margin-top:12px"><div class="call fact rv"><b>Sugeno ${L("in one line","dalam satu baris")}</b>y = Σ w<sub>i</sub>·z<sub>i</sub> / Σ w<sub>i</sub> — ${L("w = firing strength, z = rule output.","w = kekuatan nyalaan, z = output peraturan.")}</div>
<div class="call tip rv"><b>${L("Quick check","Semakan pantas")}</b>${L("With z = 50 (R5) and z = 85 (R8): (0.6·50 + 0.17·85)/(0.77) ≈ 57.6 — close to Mamdani's 56.4.","Dengan z = 50 (R5) dan z = 85 (R8): (0.6·50 + 0.17·85)/(0.77) ≈ 57.6 — hampir dengan 56.4 Mamdani.")}</div></div>`,
 notes:{en:"<p>The quick check uses a zero-order Sugeno model whose rule outputs are the centres of the Mamdani output sets (Low 15, Medium 50, High 85). We reuse exactly these centres in the Type-2 simulator.</p>",bm:"<p>Semakan pantas menggunakan model Sugeno tertib sifar dengan output peraturan ialah pusat set output Mamdani (Rendah 15, Sederhana 50, Tinggi 85). Pusat yang sama digunakan dalam simulator Jenis-2.</p>"}});

/* 16 DEFUZZ */
add({sec:S2,t:{en:"Defuzzification methods",bm:"Kaedah penyahkaburan"},html:`
<div class="kicker rv">🎯 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("One shape, five answers","Satu bentuk, lima jawapan")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="df"></svg>${slider("dr",L("Rain","Hujan"),0,100,62)}${slider("dw",L("Level","Paras"),0,100,72)}</div>
<div class="rv"><div id="dfr"></div><div class="call fact"><b>${L("Rule of thumb","Panduan umum")}</b>${L("Centroid for smooth decisions; mean of maximum when you must act on the most supported value; avoid SOM/LOM for safety-critical outputs — they jump.","Sentroid untuk keputusan licin; min maksimum apabila perlu bertindak pada nilai paling disokong; elakkan SOM/LOM untuk output kritikal keselamatan — ia melompat.")}</div></div></div>`,
 notes:{en:"<p>Centroid = centre of gravity; Bisector = vertical line splitting the area in half; MOM/SOM/LOM = mean/smallest/largest of the points where the aggregated membership is maximal.</p>",bm:"<p>Sentroid = pusat graviti; Pembahagi dua = garis tegak yang membahagi luas kepada dua; MOM/SOM/LOM = min/terkecil/terbesar bagi titik di mana keahlian teragregat adalah maksimum.</p>"},
 init(el){bind(el,["dr","dw"],()=>this.show(el))},
 show(el){const c=C(),R=mamdani(val(el,"dr"),val(el,"dw"),"min");const ys=[...Array(1001)].map((_,i)=>i/10),m=ys.map(R.agg);const tot=m.reduce((a,b)=>a+b,0);
  if(!tot){el.querySelector("#dfr").innerHTML="—";return}let acc=0,bis=0;for(let i=0;i<m.length;i++){acc+=m[i];if(acc>=tot/2){bis=ys[i];break}}
  const mx=Math.max(...m),ix=ys.filter((y,i)=>m[i]>=mx-1e-9);const V={[tx("Centroid","Sentroid")]:ys.reduce((a,y,i)=>a+y*m[i],0)/tot,[tx("Bisector","Pembahagi dua")]:bis,MOM:ix.reduce((a,b)=>a+b,0)/ix.length,SOM:ix[0],LOM:ix[ix.length-1]};
  const cols=[c.a1,c.a2,c.acc,c.ok,c.bad];const P=plot(el.querySelector("#df"),{x0:0,x1:100,y0:0,y1:1.05,w:520,h:230});P.clear();P.axes(tx("risk","risiko"),"μ",[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.area(R.agg,200),fill:c.ink,"fill-opacity":.15,stroke:c.ink});Object.values(V).forEach((v,i)=>P.el("line",{x1:P.X(v),x2:P.X(v),y1:P.Y(0),y2:P.Y(1),stroke:cols[i],"stroke-width":2.5}));
  el.querySelector("#dfr").innerHTML=`<div class="readout">${Object.entries(V).map(([k,v],i)=>`<span class="r" style="border-left:4px solid ${cols[i]}"><b>${k}</b>${v.toFixed(1)}</span>`).join("")}</div>`}});

/* 16b CONTROL SURFACE */
add({sec:S2,t:{en:"The control surface",bm:"Permukaan kawalan"},html:`
<div class="kicker rv">🗺️ ${L("Instrument","Instrumen")} · ${L("whole system at a glance","keseluruhan sistem sekali pandang")}</div><h2 class="rv">${L("Every input pair, one colour — the rule base made visible","Setiap pasangan input, satu warna — pangkalan peraturan dijadikan nyata")}</h2>
<div class="cols c2"><div class="sim rv"><canvas id="csv" width="400" height="400" style="width:100%;max-width:440px;display:block;margin:auto;border-radius:12px;cursor:crosshair"></canvas><div class="readout" id="csr"></div></div>
<div class="rv"><label class="ctrl"><span>${L("Show","Papar")}</span><select id="csm"><option value="t1">${OL("Type-1 Mamdani risk","Risiko Mamdani Jenis-1")}</option><option value="it2">${OL("IT2 crisp risk (U = 5)","Risiko rangup IT2 (U = 5)")}</option><option value="diff">${OL("IT2 − Type-1 difference","Beza IT2 − Jenis-1")}</option><option value="width">${OL("IT2 interval width (yᵣ − yₗ)","Lebar selang IT2 (yᵣ − yₗ)")}</option></select><span></span></label>
<p class="small">${L("Hover or tap the map to read any point. The plateaus are regions where one rule dominates; the slopes are where rules blend — that blending is what makes fuzzy control smooth.","Lalukan atau ketik peta untuk membaca mana-mana titik. Dataran ialah kawasan di mana satu peraturan dominan; cerun ialah tempat peraturan bercampur — percampuran inilah yang menjadikan kawalan kabur licin.")}</p>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("Switch to “interval width”. Where is the system most uncertain — and does that match where you'd expect experts to argue?","Tukar kepada “lebar selang”. Di manakah sistem paling tidak pasti — dan adakah ia sepadan dengan tempat yang anda jangka pakar berbalah?")}</div>
<div class="call fact"><b>${L("Design use","Kegunaan reka bentuk")}</b>${L("Engineers inspect control surfaces for holes (no rule fires), cliffs (abrupt jumps) and non-monotonic dips before deployment.","Jurutera memeriksa permukaan kawalan untuk lubang (tiada peraturan menyala), cenuram (lompatan mendadak) dan lekuk tidak ekanada sebelum penggunaan.")}</div></div></div>`,
 init(el){el.querySelector("#csm").onchange=()=>{this.cache=null;this.show(el)};const cv=el.querySelector("#csv");const pick=e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=100-(e.clientY-r.top)/r.height*100;this.probe=[Math.round(x),Math.round(y)];this.show(el)};cv.onmousemove=pick;cv.onclick=pick},
 show(el){const m=el.querySelector("#csm").value,cv=el.querySelector("#csv"),g=cv.getContext("2d"),N=50,c=C();const F=(r,w)=>{if(m==="t1")return mamdani(r,w,"min").crisp;const R=it2infer(r,w,5);if(m==="it2")return R.crisp;if(m==="width")return R.yr-R.yl;return R.crisp-mamdani(r,w,"min").crisp};
  if(!this.cache||this.cache.m!==m){const V=[];for(let i=0;i<N;i++){V.push([]);for(let j=0;j<N;j++)V[i].push(F((i+.5)*100/N,(j+.5)*100/N))}this.cache={m,V}}const V=this.cache.V,fl=V.flat().filter(isFinite),lo=m==="diff"?-Math.max(...fl.map(Math.abs)):Math.min(...fl),hi=m==="diff"?-lo:Math.max(...fl);
  const col=v=>{if(!isFinite(v))return"#888";const t=(v-lo)/((hi-lo)||1);if(m==="diff"){const a=Math.abs(t-.5)*2;return t>.5?`rgba(224,49,49,${a})`:`rgba(28,126,214,${a})`}const s=[[43,138,62],[245,159,0],[224,49,49]];const k=t<.5?0:1,u=t<.5?t*2:(t-.5)*2;return `rgb(${s[k].map((v0,i)=>Math.round(v0+(s[k+1][i]-v0)*u))})`};
  g.clearRect(0,0,400,400);for(let i=0;i<N;i++)for(let j=0;j<N;j++){g.fillStyle=col(V[i][j]);g.fillRect(i*8,400-(j+1)*8,8.5,8.5)}
  g.fillStyle="rgba(0,0,0,.6)";g.font="12px Inter,sans-serif";g.fillText(tx("rain →","hujan →"),340,392);g.save();g.translate(12,60);g.rotate(-Math.PI/2);g.fillText(tx("level →","paras →"),-50,0);g.restore();
  const p=this.probe||[45,70];g.strokeStyle="#fff";g.lineWidth=2;g.beginPath();g.arc(p[0]*4,400-p[1]*4,8,0,7);g.stroke();const v=F(p[0],p[1]);
  el.querySelector("#csr").innerHTML=`<span class="r"><b>${tx("rain","hujan")}</b>${p[0]}</span><span class="r"><b>${tx("level","paras")}</b>${p[1]}</span><span class="r"><b>${tx("value","nilai")}</b>${isFinite(v)?v.toFixed(1):"—"}</span><span class="r"><b>${tx("range","julat")}</b>${lo.toFixed(1)} … ${hi.toFixed(1)}</span>`}});

/* 16c RULE BASE DESIGN */
add({sec:S2,t:{en:"Designing a good rule base",bm:"Mereka bentuk pangkalan peraturan yang baik"},html:`
<div class="kicker rv">🧱 ${L("Design principles","Prinsip reka bentuk")}</div><h2 class="rv">${L("Complete, consistent, continuous — and not too many","Lengkap, konsisten, berterusan — dan tidak terlalu banyak")}</h2>
<div class="cols c2"><div class="rv"><div class="cols" style="grid-template-columns:1fr 1fr;gap:10px">
<div class="card"><b>✅ ${L("Completeness","Kelengkapan")}</b><p class="small">${L("Every input combination fires at least one rule (ε-completeness: some rule fires ≥ ε).","Setiap gabungan input menyalakan sekurang-kurangnya satu peraturan (kelengkapan-ε: sesuatu peraturan menyala ≥ ε).")}</p></div>
<div class="card"><b>⚖️ ${L("Consistency","Ketekalan")}</b><p class="small">${L("No two rules with the same IF part and opposite THEN parts.","Tiada dua peraturan dengan bahagian JIKA sama dan bahagian MAKA bertentangan.")}</p></div>
<div class="card"><b>〰️ ${L("Continuity","Keselanjaran")}</b><p class="small">${L("Neighbouring IF parts lead to neighbouring THEN parts — no Low next to High.","Bahagian JIKA berjiran membawa kepada bahagian MAKA berjiran — tiada Rendah bersebelahan Tinggi.")}</p></div>
<div class="card"><b>🔍 ${L("Interpretability","Kebolehtafsiran")}</b><p class="small">${L("5–9 terms per variable at most (Miller's 7 ± 2); sets overlap around 0.5.","Paling banyak 5–9 istilah setiap pemboleh ubah (7 ± 2 Miller); set bertindih sekitar 0.5.")}</p></div></div></div>
<div class="sim rv"><b>${L("The curse of dimensionality","Sumpahan dimensi")}</b><div class="eq">${L("rules","peraturan")} = m<sup>n</sup></div>${slider("rbm",L("Terms per input m","Istilah setiap input m"),2,9,3)}${slider("rbn",L("Number of inputs n","Bilangan input n"),1,10,2)}<svg id="rbv"></svg><div class="readout" id="rbr"></div>
<p class="small muted">${L("Remedies: hierarchical fuzzy systems (chain small subsystems), rule reduction from data, or TSK models learned with ANFIS-style training.","Penyelesaian: sistem kabur berhierarki (rantaikan subsistem kecil), pengurangan peraturan daripada data, atau model TSK yang dipelajari melalui latihan gaya ANFIS.")}</p></div></div>`,
 init(el){bind(el,["rbm","rbn"],()=>this.show(el))},
 show(el){const m=val(el,"rbm"),n=val(el,"rbn"),c=C();const P=plot(el.querySelector("#rbv"),{x0:.5,x1:10.5,y0:0,y1:10,w:520,h:190,pad:{l:44,r:8,t:8,b:26}});P.clear();P.axes(tx("inputs n","input n"),"log₁₀ rules",[1,2,4,6,8,10],[0,3,6,9]);
  for(let k=1;k<=10;k++){const v=k*Math.log10(m),h=(n>=2?(n-1)*Math.log10(m*m):0);P.el("rect",{x:P.X(k-.35),width:P.X(.32)-P.X(0),y:P.Y(Math.min(10,v)),height:P.Y(0)-P.Y(Math.min(10,v)),fill:k===n?c.a1:c.ink,"fill-opacity":k===n?1:.35});const hv=k>=2?Math.log10((k-1)*m*m):Math.log10(m);P.el("rect",{x:P.X(k+.03),width:P.X(.32)-P.X(0),y:P.Y(hv),height:P.Y(0)-P.Y(hv),fill:c.acc,"fill-opacity":k===n?1:.35})}
  const flat=m**n,hier=n>=2?(n-1)*m*m:m;el.querySelector("#rbr").innerHTML=`<span class="r" style="color:${c.a1}"><b>${tx("flat","rata")}</b>${flat.toLocaleString()}</span><span class="r" style="color:${c.acc}"><b>${tx("hierarchical (2-input blocks)","berhierarki (blok 2-input)")}</b>${hier.toLocaleString()}</span>`}});

/* 17 CODE LAB T1 */
add({sec:S2,t:{en:"Lab A1: build it three ways",bm:"Makmal A1: bina dengan tiga cara"},html:`
${dt([3])}<div class="kicker rv">🛠️ ${L("Practice","Latihan")} · ${L("choose your level","pilih tahap anda")}</div><h2 class="rv">${L("Same system, three routes","Sistem sama, tiga laluan")}</h2>
<div class="rv">${code({variants:[
 {label:{en:"L1 · Prompt an AI assistant",bm:"T1 · Prom pembantu AI"},level:"l1",lang:"prompt",tool:"Gemini / Claude / ChatGPT",desc:{en:"No code. Paste into an AI assistant. It must show its working so you can verify it against the slide.",bm:"Tanpa kod. Tampal ke dalam pembantu AI. Ia mesti menunjukkan pengiraan supaya anda boleh menyemaknya dengan slaid."},
  lines:[["Act as a fuzzy logic tutor. Build a Mamdani fuzzy system and SHOW every step.","Sets the role and demands visible working — so you can audit the answer.","Menetapkan peranan dan menuntut pengiraan dipaparkan — supaya jawapan boleh diaudit."],
   ["Inputs: Rain 0-100 mm/h {Light trap(0,0,10,30), Moderate tri(10,35,60), Heavy trap(40,70,100,100)}","Gives exact membership functions; vague prompts give vague maths.","Memberi fungsi keahlian tepat; prom kabur menghasilkan matematik kabur."],
   ["River level 0-100% {Normal trap(0,0,40,60), Alert tri(40,65,85), Danger trap(70,90,100,100)}","Second input with its three sets.","Input kedua dengan tiga setnya."],
   ["Output Risk 0-100 {Low trap(0,0,20,40), Medium tri(25,50,75), High trap(60,80,100,100)}","Output sets used for clipping and the centroid.","Set output untuk pemotongan dan sentroid."],
   ["Rules: Light&Normal->Low, Light&Alert->Medium, Light&Danger->High, Moderate&Normal->Low, Moderate&Alert->Medium, Moderate&Danger->High, Heavy&Normal->Medium, Heavy&Alert->High, Heavy&Danger->High","The full 3×3 rule base, written compactly.","Pangkalan peraturan 3×3 lengkap, ditulis secara padat."],
   ["Use AND = min, implication = min, aggregation = max, centroid on y = 0,1,...,100.","Fixes every design choice so the answer is reproducible.","Menetapkan setiap pilihan reka bentuk supaya jawapan boleh dihasilkan semula."],
   ["Compute risk for rain = 45 and level = 70. Present a table of memberships and firing strengths.","Asks for the worked example as a table.","Meminta contoh kerja dalam bentuk jadual."],
   ["Then explain the result in one plain-language sentence for residents, in Bahasa Malaysia.","Turns the number into an explanation people can act on.","Menukar nombor kepada penerangan yang boleh diambil tindakan."],
   ["Do not invent data. If anything is ambiguous, ask me first.","Guardrail against hallucinated assumptions.","Pagar keselamatan terhadap andaian halusinasi."]],
  out:"Moderate = 0.60, Heavy = 0.17, Alert = 0.75\nR5 (Moderate AND Alert -> Medium) = 0.60; R8 (Heavy AND Alert -> High) = 0.17\nCentroid risk ≈ 56 (exact grid result 56.4)\n“Risiko banjir sederhana; bersedia untuk berpindah jika hujan berterusan.”\n⚠ Verify: AI assistants sometimes slip on the centroid — compare with slide 13."},
 {label:{en:"L2 · Spreadsheet",bm:"T2 · Hamparan"},level:"l2",lang:"excel",tool:"Excel / Google Sheets",desc:{en:"Put rain in B1 and level in B2. Each formula is one cell. No macros needed.",bm:"Letak hujan di B1 dan paras di B2. Setiap formula satu sel. Tiada makro diperlukan."},
  lines:[["B1: 45","Rain input (mm/h).","Input hujan (mm/j)."],["B2: 70","River level input (% of danger).","Input paras sungai (% bahaya)."],
   ["B4: =MAX(0,MIN((B1-10)/(35-10),(60-B1)/(60-35)))","Triangular MF Moderate(10,35,60): rising edge, falling edge, floor at 0.","FK segi tiga Sederhana(10,35,60): tepi naik, tepi turun, lantai 0."],
   ["B5: =MAX(0,MIN((B1-40)/(70-40),1))","Trapezoid shoulder Heavy(40,70,100,100) — never exceeds 1.","Bahu trapezium Lebat(40,70,100,100) — tidak melebihi 1."],
   ["B6: =MAX(0,MIN((B2-40)/(65-40),(85-B2)/(85-65)))","Alert(40,65,85) for the river level.","Waspada(40,65,85) untuk paras sungai."],
   ["B8: =MIN(B4,B6)","Rule 5 firing strength (AND = min).","Kekuatan nyalaan peraturan 5 (DAN = min)."],
   ["B9: =MIN(B5,B6)","Rule 8 firing strength.","Kekuatan nyalaan peraturan 8."],
   ["B11: =(B8*50+B9*85)/(B8+B9)","Sugeno-style shortcut using set centres 50 and 85.","Jalan pintas gaya Sugeno menggunakan pusat set 50 dan 85."],
   ["' For the exact Mamdani centroid, list y = 0..100 in column D and use SUMPRODUCT.","Optional extension: full centroid with a 101-row helper column.","Lanjutan pilihan: sentroid penuh dengan lajur bantu 101 baris."]],
  out:"B4 = 0.60   B5 = 0.17   B6 = 0.75\nB8 = 0.60   B9 = 0.17\nB11 = 57.6  (Sugeno shortcut; Mamdani centroid = 56.4)"},
 {label:{en:"L3 · Python (scikit-fuzzy)",bm:"T3 · Python (scikit-fuzzy)"},level:"l3",lang:"python",tool:"Google Colab · pip install scikit-fuzzy",desc:{en:"Runs in Colab. Ask Gemini in Colab to explain any line you don't understand.",bm:"Boleh dijalankan dalam Colab. Minta Gemini dalam Colab menerangkan baris yang anda tidak faham."},
  lines:[["# !pip install scikit-fuzzy","Install once in Colab (remove the # to run).","Pasang sekali dalam Colab (buang # untuk jalankan)."],
   ["import numpy as np","Arrays for the universes of discourse.","Tatasusunan untuk semesta wacana."],
   ["import skfuzzy as fuzz","Membership function library.","Pustaka fungsi keahlian."],
   ["from skfuzzy import control as ctrl","High-level rule/controller API.","API peringkat tinggi untuk peraturan/pengawal."],
   ["rain  = ctrl.Antecedent(np.arange(0, 101, 1), 'rain')","Input variable with universe 0–100, step 1.","Pemboleh ubah input dengan semesta 0–100, langkah 1."],
   ["level = ctrl.Antecedent(np.arange(0, 101, 1), 'level')","Second input.","Input kedua."],
   ["risk  = ctrl.Consequent(np.arange(0, 101, 1), 'risk')","Output variable; centroid is the default defuzzifier.","Pemboleh ubah output; sentroid ialah penyahkabur lalai."],
   ["rain['light']    = fuzz.trapmf(rain.universe, [0, 0, 10, 30])","Left-shoulder trapezoid.","Trapezium bahu kiri."],
   ["rain['moderate'] = fuzz.trimf(rain.universe, [10, 35, 60])","Triangle.","Segi tiga."],
   ["rain['heavy']    = fuzz.trapmf(rain.universe, [40, 70, 100, 100])","Right-shoulder trapezoid.","Trapezium bahu kanan."],
   ["level['normal']  = fuzz.trapmf(level.universe, [0, 0, 40, 60])","",""],
   ["level['alert']   = fuzz.trimf(level.universe, [40, 65, 85])","",""],
   ["level['danger']  = fuzz.trapmf(level.universe, [70, 90, 100, 100])","",""],
   ["risk['low']      = fuzz.trapmf(risk.universe, [0, 0, 20, 40])","Output sets.","Set output."],
   ["risk['medium']   = fuzz.trimf(risk.universe, [25, 50, 75])","",""],
   ["risk['high']     = fuzz.trapmf(risk.universe, [60, 80, 100, 100])","",""],
   ["R, W, K = rain, level, risk","Short aliases to keep rules on one line.","Alias pendek supaya peraturan muat satu baris."],
   ["rules = [ctrl.Rule(R['light'] & W['normal'], K['low']),","& means fuzzy AND (min by default).","& bermaksud DAN kabur (min secara lalai)."],
   ["  ctrl.Rule(R['light'] & W['alert'], K['medium']), ctrl.Rule(R['light'] & W['danger'], K['high']),","",""],
   ["  ctrl.Rule(R['moderate'] & W['normal'], K['low']), ctrl.Rule(R['moderate'] & W['alert'], K['medium']),","",""],
   ["  ctrl.Rule(R['moderate'] & W['danger'], K['high']), ctrl.Rule(R['heavy'] & W['normal'], K['medium']),","",""],
   ["  ctrl.Rule(R['heavy'] & W['alert'], K['high']), ctrl.Rule(R['heavy'] & W['danger'], K['high'])]","All nine rules.","Kesemua sembilan peraturan."],
   ["sim = ctrl.ControlSystemSimulation(ctrl.ControlSystem(rules))","Compile the rule base into a simulator.","Menyusun pangkalan peraturan menjadi simulator."],
   ["for r, w in [(45, 70), (20, 30), (80, 95)]:","Three test scenarios: our example, calm, storm.","Tiga senario ujian: contoh kita, tenang, ribut."],
   ["    sim.input['rain'], sim.input['level'] = r, w","Feed crisp inputs.","Masukkan input rangup."],
   ["    sim.compute()","Fuzzify → fire → aggregate → defuzzify.","Kaburkan → nyala → agregat → nyahkabur."],
   ["    print(f\"rain={r}, level={w}% -> risk = {sim.output['risk']:.1f}\")","Print the crisp risk.","Cetak risiko rangup."]],
  out:"rain=45, level=70% -> risk = 56.4\nrain=20, level=30% -> risk = 17.6\nrain=80, level=95% -> risk = 84.4"}]})}</div>`,
 notes:{en:"<p>All three routes were checked against the simulator. Outputs differ only where a route deliberately uses the Sugeno shortcut. When you use an AI assistant (L1), always verify numbers; assistants can make arithmetic slips on centroids.</p>",bm:"<p>Ketiga-tiga laluan telah disemak dengan simulator. Output berbeza hanya apabila laluan sengaja menggunakan jalan pintas Sugeno. Apabila menggunakan pembantu AI (T1), sentiasa semak nombor; pembantu AI boleh tersilap aritmetik bagi sentroid.</p>"}});

/* 18 QUIZ A */
add({sec:S2,t:{en:"Checkpoint A (Type-1)",bm:"Titik semak A (Jenis-1)"},noAutoDone:true,html:`
<div class="kicker rv">✅ ${L("Formative assessment","Pentaksiran formatif")} · 6 ${L("items","item")} · ~8 min</div><h2 class="rv">${L("Checkpoint A","Titik semak A")}</h2>
<div class="rv">${quiz({id:"fzA",items:[
 {q:{en:"Moderate = tri(10, 35, 60). What is μ(45)?",bm:"Sederhana = tri(10, 35, 60). Berapakah μ(45)?"},o:["0.40","0.60","0.80","1.00"],a:1,why:{en:"45 is on the falling edge: (60−45)/(60−35) = 15/25 = 0.6.",bm:"45 berada pada tepi menurun: (60−45)/(60−35) = 15/25 = 0.6."}},
 {q:{en:"μA = 0.7 and μB = 0.4. With AND = min, the rule fires at…",bm:"μA = 0.7 dan μB = 0.4. Dengan DAN = min, peraturan menyala pada…"},o:["0.28","0.40","0.70","1.10"],a:1,why:{en:"min(0.7, 0.4) = 0.4. 0.28 would be the product t-norm.",bm:"min(0.7, 0.4) = 0.4. 0.28 ialah norma-t hasil darab."}},
 {q:{en:"Which step converts the aggregated fuzzy output into one number?",bm:"Langkah manakah yang menukar output kabur teragregat kepada satu nombor?"},o:[{en:"Fuzzification",bm:"Pengaburan"},{en:"Implication",bm:"Implikasi"},{en:"Defuzzification",bm:"Penyahkaburan"},{en:"Normalisation",bm:"Penormalan"}],a:2,why:{en:"Defuzzification (e.g. centroid) maps a fuzzy set to a crisp value.",bm:"Penyahkaburan (cth. sentroid) memetakan set kabur kepada nilai rangup."}},
 {q:{en:"The key difference between Mamdani and Sugeno systems is…",bm:"Perbezaan utama antara sistem Mamdani dan Sugeno ialah…"},o:[{en:"Sugeno cannot use AND",bm:"Sugeno tidak boleh menggunakan DAN"},{en:"Sugeno rule outputs are functions/constants",bm:"Output peraturan Sugeno ialah fungsi/pemalar"},{en:"Mamdani has no rules",bm:"Mamdani tiada peraturan"},{en:"Mamdani is always more accurate",bm:"Mamdani sentiasa lebih tepat"}],a:1,why:{en:"Sugeno/TSK consequents are crisp functions, so the output is a weighted average — no defuzzification of a shape.",bm:"Akibat Sugeno/TSK ialah fungsi rangup, jadi output ialah purata berpemberat — tiada penyahkaburan bentuk."}},
 {q:{en:"μ(high) = 0.6. What is μ(very high) using Zadeh's hedge?",bm:"μ(tinggi) = 0.6. Berapakah μ(sangat tinggi) menggunakan pagar Zadeh?"},o:["0.36","0.60","0.77","0.84"],a:0,why:{en:"“Very” is concentration: 0.6² = 0.36. 0.77 ≈ √0.6 would be “somewhat”.",bm:"“Sangat” ialah pemekatan: 0.6² = 0.36. 0.77 ≈ √0.6 ialah “agak”."}},
 {q:{en:"Which statement is TRUE?",bm:"Pernyataan manakah yang BENAR?"},o:[{en:"Memberships across sets must sum to 1",bm:"Jumlah keahlian merentas set mesti 1"},{en:"μ = 0.7 means a 70% chance",bm:"μ = 0.7 bermaksud peluang 70%"},{en:"Membership models vagueness, not randomness",bm:"Keahlian memodelkan kekaburan, bukan kerawakan"},{en:"Fuzzy logic cannot be explained",bm:"Logik kabur tidak boleh diterangkan"}],a:2,why:{en:"Fuzzy membership grades compatibility with a vague concept; probability handles uncertainty about outcomes.",bm:"Keahlian kabur menggred keserasian dengan konsep kabur; kebarangkalian mengendalikan ketidakpastian hasil."}}]})}</div>`});

/* 19 VIDEO */
add({sec:S3,t:{en:"Animated explainer",bm:"Penerang animasi"},html:`
<div class="kicker rv">🎬 ${L("Watch (55 s, English voice)","Tonton (83 s, suara Bahasa Malaysia)")}</div><h2 class="rv">${L("From crisp to Type-1 to Type-2","Daripada rangup ke Jenis-1 ke Jenis-2")}</h2>
<div class="cols c2" style="align-items:center"><div class="rv"><video class="en" src="media/fuzzy-explainer.mp4" controls playsinline preload="metadata"></video><video class="bm" src="media/fuzzy-explainer-bm.mp4" controls playsinline preload="metadata"></video></div>
<div class="rv"><p class="lead">${L("Watch for three moments:","Perhatikan tiga detik:")}</p><ol class="tight"><li>${L("the hard step of a crisp set","langkah keras set rangup")}</li><li>${L("one smooth curve (Type-1)","satu lengkung licin (Jenis-1)")}</li><li>${L("three experts → a shaded band: the Footprint of Uncertainty","tiga pakar → jalur berlorek: Jejak Ketidakpastian")}</li></ol>
<p class="small muted">${L("English voice-over with English and Malay captions. Switch to BM for the Malay-narrated version.","Suara latar Bahasa Malaysia (suara neural Microsoft) dengan kapsyen BM dan Inggeris. Tukar ke EN untuk versi bahasa Inggeris.")}</p></div></div>`,
 notes:{en:"<p>The animation was generated programmatically (every frame is a function of time), so it can be re-rendered with new labels or voice-over.</p>",bm:"<p>Animasi dijana secara pengaturcaraan (setiap bingkai ialah fungsi masa), jadi ia boleh dirender semula dengan label atau suara latar baharu.</p>"}});

/* 20 EXPERTS → FOU */
add({sec:S3,t:{en:"When experts disagree",bm:"Apabila pakar tidak sepakat"},html:`
${dt([0,1])}<div class="kicker rv">👥 ${L("Why Type-2?","Mengapa Jenis-2?")}</div><h2 class="rv">${L("Three experts, three meanings of “heavy rain”","Tiga pakar, tiga maksud “hujan lebat”")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="ex"></svg><div class="readout" id="exr"></div></div>
<div class="rv">${slider("e1",L("Expert 1: heavy starts at","Pakar 1: lebat bermula pada"),20,70,40)}${slider("e2",L("Expert 2: heavy starts at","Pakar 2: lebat bermula pada"),20,70,48)}${slider("e3",L("Expert 3: heavy starts at","Pakar 3: lebat bermula pada"),20,70,33)}
<p class="small muted">${L("Each expert's set reaches 1 thirty units later.","Set setiap pakar mencapai 1 tiga puluh unit kemudian.")}</p>
<div class="call fact"><b>${L("The insight","Pencerahan")}</b>${L("A Type-1 system forces you to pick one curve and hide the disagreement. Type-2 keeps the whole band — the <b>Footprint of Uncertainty (FOU)</b> — and reasons with it.","Sistem Jenis-1 memaksa anda memilih satu lengkung dan menyembunyikan percanggahan. Jenis-2 mengekalkan seluruh jalur — <b>Jejak Ketidakpastian (FOU)</b> — dan menaakul dengannya.")}</div>
<div class="call val"><b>${L("Value: Keadilan (fairness)","Nilai: Keadilan")}</b>${L("Averaging experts silently can erase a minority view. Making the spread visible is a fairer record of what is known.","Mempuratakan pendapat pakar secara senyap boleh memadam pandangan minoriti. Memaparkan sebaran ialah rekod yang lebih adil tentang apa yang diketahui.")}</div></div></div>`,
 notes:{en:"<p>Sources of uncertainty that motivate Type-2 (Mendel): words mean different things to different people; experts give different rule consequents; noisy measurements activate the system; data used to tune parameters are noisy.</p>",bm:"<p>Sumber ketidakpastian yang mendorong Jenis-2 (Mendel): kata membawa maksud berbeza kepada orang berbeza; pakar memberi akibat peraturan berbeza; pengukuran beralat (ralat) mengaktifkan sistem; data untuk menala parameter mengandungi ralat.</p>"},
 init(el){bind(el,["e1","e2","e3"],()=>this.show(el))},
 show(el){const e=[val(el,"e1"),val(el,"e2"),val(el,"e3")],c=C(),f=e.map(a=>x=>trap(x,a,a+30,100,100));const lo=x=>Math.min(...f.map(g=>g(x))),hi=x=>Math.max(...f.map(g=>g(x)));
  const P=plot(el.querySelector("#ex"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:250});P.clear();P.axes(tx("rain mm/h","hujan mm/j"),"μ(heavy)",[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.band(lo,hi),fill:c.a1,"fill-opacity":.25});[c.a2,c.acc,c.ok].forEach((col,i)=>P.el("path",{d:P.path(f[i]),fill:"none",stroke:col,"stroke-width":2}));
  P.el("text",{x:P.X(Math.min(...e)+18),y:P.Y(.5),"font-size":13,"font-weight":700,fill:c.a1}).textContent="FOU";
  const x=55;el.querySelector("#exr").innerHTML=`<span class="r"><b>μ(55) ${tx("range","julat")}</b>[${lo(x).toFixed(2)}, ${hi(x).toFixed(2)}]</span><span class="r"><b>${tx("width","lebar")}</b>${(hi(x)-lo(x)).toFixed(2)}</span>`}});

/* 21 ANATOMY T2 */
add({sec:S3,t:{en:"Anatomy of a Type-2 set",bm:"Anatomi set Jenis-2"},html:`
<div class="kicker rv">📐 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("A membership that is itself fuzzy","Keahlian yang juga kabur")}</h2>
<div class="cols c2" style="align-items:center"><svg viewBox="0 0 520 300" class="rv">
 <line x1="50" y1="250" x2="480" y2="250" class="axis"/><line x1="50" y1="250" x2="50" y2="30" class="axis"/><line x1="50" y1="250" x2="130" y2="200" class="axis"/>
 <path d="M90 250 L250 60 L410 250 Z" fill="var(--a1)" fill-opacity=".08" stroke="var(--a1)" stroke-width="3"/>
 <path d="M150 250 L250 110 L350 250 Z" fill="var(--bg)" stroke="var(--a1)" stroke-width="2" stroke-dasharray="6 4"/>
 <path d="M90 250 L250 60 L410 250 L350 250 L250 110 L150 250 Z" fill="var(--a1)" fill-opacity=".28"/>
 <line x1="200" y1="250" x2="200" y2="120" stroke="var(--a2)" stroke-width="2"/><line x1="200" y1="180" x2="200" y2="120" stroke="var(--a2)" stroke-width="7" stroke-linecap="round"/>
 <path d="M200 180 L236 158 L236 98 L200 120" fill="var(--a2)" fill-opacity=".35" stroke="var(--a2)"/>
 <text x="300" y="80" font-size="13" font-weight="700" style="fill:var(--a1)">UMF μ̄</text><text x="262" y="150" font-size="13" font-weight="700" style="fill:var(--a1)">LMF μ̲</text>
 <text x="120" y="215" font-size="13" font-weight="700" style="fill:var(--a1)">FOU</text>
 <text x="240" y="95" font-size="12" style="fill:var(--a2)"><tspan class="en">secondary grade = 1</tspan><tspan class="bm">gred sekunder = 1</tspan></text>
 <text x="200" y="268" text-anchor="middle" font-size="12">x′</text><text x="470" y="268" font-size="12">x</text><text x="40" y="34" text-anchor="end" font-size="12">u</text><text x="138" y="196" font-size="12">μ(x,u)</text></svg>
<div class="rv"><table class="t"><tr><th>${L("Term","Istilah")}</th><th>${L("Meaning","Maksud")}</th></tr>
<tr><td>${L("Primary membership","Keahlian primer")} J<sub>x</sub></td><td>${L("The interval of possible degrees at x: [μ̲(x), μ̄(x)].","Selang darjah yang mungkin pada x: [μ̲(x), μ̄(x)].")}</td></tr>
<tr><td>${L("Secondary grade","Gred sekunder")}</td><td>${L("How much we believe each degree. Interval Type-2: all equal 1.","Sejauh mana kita mempercayai setiap darjah. Jenis-2 selang: semuanya 1.")}</td></tr>
<tr><td>FOU</td><td>${L("Union of all primary memberships — bounded by UMF and LMF.","Kesatuan semua keahlian primer — dibatasi UMF dan LMF.")}</td></tr>
<tr><td>${L("General Type-2","Jenis-2 umum")}</td><td>${L("Secondary grades vary (a 3-D surface); richer but costlier — handled via α-planes / zSlices.","Gred sekunder berubah (permukaan 3-D); lebih kaya tetapi lebih mahal — dikendalikan melalui satah-α / zSlices.")}</td></tr></table>
<div class="call fact"><b>${L("Remember","Ingat")}</b>${L("Type-1 is the special case where the FOU has zero width.","Jenis-1 ialah kes khas apabila lebar FOU sifar.")}</div></div></div>`,
 notes:{en:"<p>Mendel &amp; John (2002) showed that an IT2 set can be seen as a collection of embedded Type-1 sets inside the FOU — which is why IT2 systems can be computed with Type-1 mathematics applied to the upper and lower bounds.</p>",bm:"<p>Mendel &amp; John (2002) menunjukkan set IT2 boleh dilihat sebagai himpunan set Jenis-1 terbenam dalam FOU — sebab itulah sistem IT2 boleh dikira dengan matematik Jenis-1 yang diaplikasikan pada batas atas dan bawah.</p>"}});

/* 22 FOU EXPLORER */
add({sec:S3,t:{en:"FOU explorer",bm:"Penjelajah FOU"},html:`
<div class="kicker rv">🧪 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Widen the doubt, watch the interval grow","Lebarkan keraguan, lihat selang membesar")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="fo"></svg></div><div class="rv">${slider("fu",L("Uncertainty U (±units)","Ketidakpastian U (±unit)"),0,20,8)}${slider("fx",L("Probe x","Prob x"),0,100,38)}<div class="readout" id="for"></div>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("Where along x is the interval widest? Where is it zero? Explain why the peak is “certain” in this design.","Di manakah sepanjang x selang paling lebar? Di manakah ia sifar? Terangkan mengapa puncak “pasti” dalam reka bentuk ini.")}</div>
<div class="call fact"><b>${L("Design choice","Pilihan reka bentuk")}</b>${L("Here we blur the feet (uncertain support). Other designs blur the peak position or the height. Each encodes a different kind of doubt.","Di sini kita mengaburkan kaki (sokongan tidak pasti). Reka bentuk lain mengaburkan kedudukan puncak atau ketinggian. Setiap satu mengekod jenis keraguan berbeza.")}</div></div></div>`,
 notes:{en:"<p>UMF = tri(a−U, b, c+U); LMF = tri(a+U, b, c−U). At the peak both equal 1, so the interval has zero width there. The same construction is used in the IT2 simulator.</p>",bm:"<p>UMF = tri(a−U, b, c+U); LMF = tri(a+U, b, c−U). Di puncak kedua-duanya bernilai 1, jadi lebar selang sifar di situ. Pembinaan yang sama digunakan dalam simulator IT2.</p>"},
 init(el){bind(el,["fu","fx"],()=>this.show(el))},
 show(el){const U=val(el,"fu"),x=val(el,"fx"),c=C(),def=["tri",[20,50,80]];const P=plot(el.querySelector("#fo"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:260});P.clear();P.axes("x","μ",[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.band(z=>it2mf(def,z,U)[0],z=>it2mf(def,z,U)[1]),fill:c.a1,"fill-opacity":.25});P.el("path",{d:P.path(z=>it2mf(def,z,U)[1]),fill:"none",stroke:c.a1,"stroke-width":2.5});P.el("path",{d:P.path(z=>it2mf(def,z,U)[0]),fill:"none",stroke:c.a1,"stroke-width":2,"stroke-dasharray":"5 4"});
  const [l,u]=it2mf(def,x,U);P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(0),y2:P.Y(1.08),stroke:c.ink,"stroke-dasharray":"3 3"});P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(l),y2:P.Y(u),stroke:c.a2,"stroke-width":7,"stroke-linecap":"round"});
  el.querySelector("#for").innerHTML=`<span class="r"><b>μ̲(${x})</b>${l.toFixed(2)}</span><span class="r"><b>μ̄(${x})</b>${u.toFixed(2)}</span><span class="r" style="color:${c.a2}"><b>${tx("interval width","lebar selang")}</b>${(u-l).toFixed(2)}</span>`}});

/* 23 IT2 PIPELINE */
add({sec:S3,t:{en:"The IT2 fuzzy logic system",bm:"Sistem logik kabur IT2"},html:`
<div class="kicker rv">🔁 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("One extra block: type reduction","Satu blok tambahan: penurunan jenis")}</h2>
<svg viewBox="0 0 1000 200" class="rv" style="width:100%"><defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--a1)"/></marker></defs>
 ${[["Fuzzifier","Pengabur","[μ̲, μ̄] per set",10],["Rules","Peraturan","firing [f̲, f̄]",205],["Inference","Inferens","T2 output sets",400],["Type reducer","Penurun jenis","KM → [yₗ, yᵣ]",595],["Defuzzifier","Penyahkabur","y = (yₗ+yᵣ)/2",790]].map((b,i)=>`<g><rect x="${b[3]}" y="40" width="185" height="100" rx="16" fill="${i===3?"color-mix(in srgb, var(--a2) 22%, var(--bg2))":"var(--bg2)"}" stroke="${i===3?"var(--a2)":"var(--a1)"}" stroke-width="${i===3?4:2.5}"/>
 <text x="${b[3]+92}" y="80" text-anchor="middle" font-size="17" font-weight="700" style="fill:var(--ink)"><tspan class="en">${b[0]}</tspan><tspan class="bm">${b[1]}</tspan></text><text x="${b[3]+92}" y="110" text-anchor="middle" font-size="12">${b[2]}</text></g>
 ${i<4?`<line x1="${b[3]+188}" y1="90" x2="${b[3]+202}" y2="90" stroke="var(--a1)" stroke-width="3" marker-end="url(#ar2)"/>`:""}`).join("")}
 <text x="687" y="170" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--a2)"><tspan class="en">the new step</tspan><tspan class="bm">langkah baharu</tspan></text></svg>
<div class="cols c3">
 <div class="card rv"><b>${L("Firing interval","Selang nyalaan")}</b><p class="small">f̲ = min(μ̲₁, μ̲₂), f̄ = min(μ̄₁, μ̄₂)</p></div>
 <div class="card rv"><b>${L("Karnik–Mendel (KM)","Karnik–Mendel (KM)")}</b><p class="small">${L("Find switch points: use upper weights on the left and lower on the right to get yₗ; the reverse for yᵣ.","Cari titik suis: guna pemberat atas di kiri dan bawah di kanan untuk yₗ; sebaliknya untuk yᵣ.")}</p></div>
 <div class="card rv"><b>${L("Shortcuts","Jalan pintas")}</b><p class="small">${L("Nie–Tan: y = Σ y<sub>i</sub>(f̲<sub>i</sub>+f̄<sub>i</sub>) / Σ(f̲<sub>i</sub>+f̄<sub>i</sub>) — no iteration, cheap on microcontrollers.","Nie–Tan: y = Σ y<sub>i</sub>(f̲<sub>i</sub>+f̄<sub>i</sub>) / Σ(f̲<sub>i</sub>+f̄<sub>i</sub>) — tanpa lelaran, murah pada mikropengawal.")}</p></div></div>
<div class="call fact rv"><b>${L("Bonus","Bonus")}</b>${L("The interval [yₗ, yᵣ] is information in itself: a wide interval says “the experts' disagreement matters here”.","Selang [yₗ, yᵣ] sendiri ialah maklumat: selang lebar bermaksud “percanggahan pakar penting di sini”.")}</div>`,
 notes:{en:"<p>KM is iterative but converges in a few steps; Enhanced KM (EKM) speeds it up. Our simulator evaluates every possible switch point exhaustively, which gives the same answer as KM for centre-of-sets type reduction.</p>",bm:"<p>KM bersifat lelaran tetapi menumpu dalam beberapa langkah; KM Dipertingkat (EKM) mempercepatkannya. Simulator kita menilai setiap titik suis yang mungkin secara menyeluruh, yang memberi jawapan sama seperti KM untuk penurunan jenis pusat set.</p>"}});

/* 24 IT2 SIM */
add({sec:S3,t:{en:"Flood-risk simulator (IT2 vs T1)",bm:"Simulator risiko banjir (IT2 lwn T1)"},html:`
${dt([3,4])}<div class="kicker rv">🧪 ${L("Instrument","Instrumen")} · ${L("Interval Type-2","Jenis-2 selang")}</div><h2 class="rv" style="margin-bottom:6px">${L("Same rules — now with the experts' doubt","Peraturan sama — kini dengan keraguan pakar")}</h2>
<div class="cols c2"><div class="sim rv">${slider("ir",L("🌧️ Rain","🌧️ Hujan"),0,100,45)}${slider("iw",L("🌊 Level","🌊 Paras"),0,100,70)}${slider("iu",L("FOU width U","Lebar FOU U"),0,15,5)}<svg id="isr"></svg><svg id="isw"></svg></div>
<div class="sim rv"><svg id="ibar"></svg><svg id="iout"></svg><div class="readout" id="ires"></div></div></div>
<div class="call tip rv"><b>${L("Challenge","Cabaran")}</b>${L("Set U = 0: the interval collapses and IT2 equals the Type-1 centre-of-sets answer. Now raise U slowly at 45/70 — which side of the interval moves, and what would you tell Encik Hafiz?","Tetapkan U = 0: selang runtuh dan IT2 sama dengan jawapan pusat set Jenis-1. Kini naikkan U perlahan-lahan pada 45/70 — sisi selang mana yang bergerak, dan apa yang akan anda beritahu Encik Hafiz?")}</div>`,
 notes:{en:"<p>Rules and centres (Low 15, Medium 50, High 85) are the same as Type-1. Each input set gets a FOU of ±U on its feet. Rule firing intervals are combined with KM centre-of-sets type reduction. At 45/70 with U = 5 the interval is [50.0, 70.2] and the crisp output 60.1, matching the Python lab.</p>",bm:"<p>Peraturan dan pusat (Rendah 15, Sederhana 50, Tinggi 85) sama seperti Jenis-1. Setiap set input diberi FOU ±U pada kakinya. Selang nyalaan peraturan digabungkan dengan penurunan jenis pusat set KM. Pada 45/70 dengan U = 5 selangnya [50.0, 70.2] dan output rangup 60.1, sepadan dengan makmal Python.</p>"},
 init(el){bind(el,["ir","iw","iu"],()=>this.show(el))},
 show(el){const r=val(el,"ir"),w=val(el,"iw"),U=val(el,"iu"),c=C();const R=it2infer(r,w,U),T1=it2infer(r,w,0),M=mamdani(r,w,"min");
  drawSets(el.querySelector("#isr"),MF.rain,0,100,r,tx("rain","hujan"),U||.001);drawSets(el.querySelector("#isw"),MF.level,0,100,w,tx("level","paras"),U||.001);
  const act=RULES.map((x,i)=>i).filter(i=>R.fu[i]>0);const P=plot(el.querySelector("#ibar"),{x0:0,x1:Math.max(act.length,1),y0:0,y1:1.05,w:520,h:160,pad:{l:34,r:10,t:10,b:30}});P.clear();P.axes(tx("active rules","peraturan aktif"),"f",[],[0,.5,1]);
  act.forEach((i,k)=>{const x0=P.X(k+.25),x1=P.X(k+.75);P.el("rect",{x:x0,width:x1-x0,y:P.Y(R.fu[i]),height:P.Y(0)-P.Y(R.fu[i]),fill:c.a1,"fill-opacity":.25,stroke:c.a1});P.el("rect",{x:x0,width:x1-x0,y:P.Y(R.fl[i]),height:P.Y(0)-P.Y(R.fl[i]),fill:c.a1});
   P.el("text",{x:(x0+x1)/2,y:P.H-14,"text-anchor":"middle","font-size":10}).textContent="R"+(i+1)+" "+nm(RULES[i][0]).slice(0,3)+"∧"+nm(RULES[i][1]).slice(0,3)+"→"+nm(RULES[i][2]).slice(0,3)});
  const Q=plot(el.querySelector("#iout"),{x0:0,x1:100,y0:0,y1:1,w:520,h:120,pad:{l:34,r:10,t:10,b:30}});Q.clear();Q.axes(tx("risk","risiko"),"",[0,25,50,75,100],[]);
  Q.el("rect",{x:Q.X(R.yl),width:Math.max(2,Q.X(R.yr)-Q.X(R.yl)),y:Q.Y(.75),height:Q.Y(.25)-Q.Y(.75),rx:8,fill:c.a1,"fill-opacity":.3,stroke:c.a1});
  [[R.crisp,c.a2,"IT2"],[T1.crisp,c.acc,"T1-COS"],[M.crisp,c.ok,"T1-Mamdani"]].forEach((d,i)=>{if(isNaN(d[0]))return;Q.el("line",{x1:Q.X(d[0]),x2:Q.X(d[0]),y1:Q.Y(.95),y2:Q.Y(.05),stroke:d[1],"stroke-width":3});0});
  const lb=riskLabel(R.crisp);el.querySelector("#ires").innerHTML=`<span class="r"><b>[yₗ, yᵣ]</b>[${R.yl.toFixed(1)}, ${R.yr.toFixed(1)}]</span><span class="r" style="color:${c.a2}"><b>IT2</b>${R.crisp.toFixed(1)}</span><span class="r"><b>Nie–Tan</b>${R.nietan.toFixed(1)}</span><span class="r" style="color:${c.acc}"><b>T1-COS</b>${T1.crisp.toFixed(1)}</span><span class="r" style="color:${c.ok}"><b>Mamdani</b>${M.crisp.toFixed(1)}</span><span class="r" style="color:#fff;background:${lb[1]}">${lb[0]}</span>`}});

/* 25 KM WORKED */
add({sec:S3,t:{en:"KM worked example",bm:"Contoh kerja KM"},html:`
<div class="kicker rv">✍️ ${L("Trace it","Jejaknya")}</div><h2 class="rv">${L("45 mm/h, 70%, U = 5 — type reduction by hand","45 mm/j, 70%, U = 5 — penurunan jenis secara manual")}</h2>
<div class="cols c2"><div class="rv"><table class="t">
<tr><th>${L("Active rule","Peraturan aktif")}</th><th>y</th><th>f̲</th><th>f̄</th></tr>
<tr><td>R5 Moderate∧Alert → Medium</td><td>50</td><td>min(0.50, 0.67) = 0.50</td><td>min(0.67, 0.80) = 0.67</td></tr>
<tr><td>R6 Moderate∧Danger → High</td><td>85</td><td>0</td><td>min(0.67, 0.20) = 0.20</td></tr>
<tr><td>R8 Heavy∧Alert → High</td><td>85</td><td>0</td><td>min(0.29, 0.80) = 0.29</td></tr>
<tr><td>R9 Heavy∧Danger → High</td><td>85</td><td>0</td><td>min(0.29, 0.20) = 0.20</td></tr></table>
<p class="small muted">${L("Upper sets widen by 5 units, lower sets narrow by 5. Example: Moderate upper = tri(5,35,65) → (65−45)/30 = 0.67; lower = tri(15,35,55) → (55−45)/20 = 0.50. Note that two rules which were silent in Type-1 (R6, R9) now carry upper firing.","Set atas melebar 5 unit, set bawah menyempit 5. Contoh: Sederhana atas = tri(5,35,65) → (65−45)/30 = 0.67; bawah = tri(15,35,55) → (55−45)/20 = 0.50. Perhatikan dua peraturan yang senyap dalam Jenis-1 (R6, R9) kini mempunyai nyalaan atas.")}</p></div>
<div class="rv"><div class="card"><p><b>yₗ</b> ${L("— pull the answer down: upper weight on y = 50, lower weights on y = 85","— tarik jawapan ke bawah: pemberat atas pada y = 50, pemberat bawah pada y = 85")}</p><p style="font-family:var(--fm)">(0.67·50 + 0·85) / 0.67 = <b>50.0</b></p>
<p><b>yᵣ</b> ${L("— pull the answer up: lower weight on 50, upper weights on 85","— tarik jawapan ke atas: pemberat bawah pada 50, pemberat atas pada 85")}</p><p style="font-family:var(--fm)">(0.50·50 + (0.20+0.29+0.20)·85) / (0.50+0.69) = <b>70.2</b></p>
<p><b>y</b> = (50.0 + 70.2) / 2 = <b>60.1</b> &nbsp;·&nbsp; Nie–Tan = 63.0 &nbsp;·&nbsp; T1 = 57.6</p></div>
<p class="rv"><a class="btn" href="deck-fuzzy-math.html#s15">∑ ${L("Maths deep dive: KM iteration by iteration","Pendalaman matematik: KM lelaran demi lelaran")} →</a></p><div class="call fact"><b>${L("Interpretation","Tafsiran")}</b>${L("The interval says: “If the more cautious experts are right, risk could be as high as 70.” That is a reason to prepare — not to panic.","Selang itu berkata: “Jika pakar yang lebih berhati-hati betul, risiko boleh mencecah 70.” Itu alasan untuk bersedia — bukan panik.")}</div></div></div>`,
 notes:{en:"<p>With only two distinct centres (50 and 85), the KM switch point is obvious: put all the weight you can on the low centre for yₗ and on the high centre for yᵣ. With many rules, KM/EKM search the switch point iteratively; the simulator checks every switch point.</p>",bm:"<p>Dengan hanya dua pusat berbeza (50 dan 85), titik suis KM jelas: letakkan seberapa banyak pemberat pada pusat rendah untuk yₗ dan pada pusat tinggi untuk yᵣ. Dengan banyak peraturan, KM/EKM mencari titik suis secara lelaran; simulator menyemak setiap titik suis.</p>"}});

/* 26 CODE LAB IT2 */
add({sec:S3,t:{en:"Lab A2: interval Type-2",bm:"Makmal A2: Jenis-2 selang"},html:`
<div class="kicker rv">🛠️ ${L("Practice","Latihan")}</div><h2 class="rv">${L("Add a footprint of uncertainty","Tambah jejak ketidakpastian")}</h2>
<div class="rv">${code({variants:[
 {label:{en:"L1 · Prompt: build me a simulator",bm:"T1 · Prom: bina simulator"},level:"l1",lang:"prompt",tool:"Claude (artifact) / Gemini (Canvas)",desc:{en:"Ask the assistant to build an interactive page. You test it; you don't write code.",bm:"Minta pembantu membina halaman interaktif. Anda mengujinya; anda tidak menulis kod."},
  lines:[["Build a single-page interactive interval type-2 fuzzy logic simulator for flood risk.","States the deliverable: one interactive page.","Menyatakan hasil: satu halaman interaktif."],
   ["Use the same 3x3 rule base as my Type-1 system: [paste rules and sets from Lab A1].","Reuse — keeps T1 and T2 comparable.","Guna semula — memastikan T1 dan T2 boleh dibandingkan."],
   ["Each input set gets a footprint of uncertainty: upper MF feet widened by U, lower MF feet narrowed by U.","Defines the FOU precisely.","Mentakrif FOU dengan tepat."],
   ["Firing interval = [min of lower memberships, min of upper memberships].","Defines rule firing for IT2.","Mentakrif nyalaan peraturan untuk IT2."],
   ["Type reduction: Karnik-Mendel centre-of-sets with centres Low=15, Medium=50, High=85.","Names the algorithm so the AI doesn't improvise.","Menamakan algoritma supaya AI tidak berimprovisasi."],
   ["Show sliders for rain, level and U; plot the FOUs; show [yl, yr], the crisp output and the Type-1 result.","Specifies the instrument's controls and readouts.","Menentukan kawalan dan bacaan instrumen."],
   ["Add a test: with rain=45, level=70, U=5 the page must show [50.0, 70.2] and 60.1.","A built-in acceptance test — the habit of verifying AI output.","Ujian penerimaan terbina — tabiat menyemak output AI."],
   ["Make labels bilingual (BM/EN). Use no external data and no tracking.","Accessibility and privacy constraints.","Kekangan kebolehcapaian dan privasi."]],
  out:"An interactive page with three sliders and two plots.\nAcceptance test: [50.0, 70.2] → 60.1 at 45 / 70 / U=5.\nIf the numbers differ, ask: “Show me your KM switch points step by step.”"},
 {label:{en:"L2 · Spreadsheet (Nie–Tan)",bm:"T2 · Hamparan (Nie–Tan)"},level:"l2",lang:"excel",tool:"Excel / Google Sheets",desc:{en:"A closed-form IT2 output — no iteration, ideal for a spreadsheet.",bm:"Output IT2 bentuk tertutup — tanpa lelaran, sesuai untuk hamparan."},
  lines:[["B1: 45   B2: 70   B3: 5","Rain, level and U.","Hujan, paras dan U."],
   ["C4: =MAX(0,MIN((B1-(10-B3))/(35-(10-B3)),((60+B3)-B1)/((60+B3)-35)))","Upper Moderate = tri(10−U, 35, 60+U).","Sederhana atas = tri(10−U, 35, 60+U)."],
   ["D4: =MAX(0,MIN((B1-(10+B3))/(35-(10+B3)),((60-B3)-B1)/((60-B3)-35)))","Lower Moderate = tri(10+U, 35, 60−U).","Sederhana bawah = tri(10+U, 35, 60−U)."],
   ["C6: =MAX(0,MIN((B2-(40-B3))/(65-(40-B3)),((85+B3)-B2)/((85+B3)-65)))","Upper Alert.","Waspada atas."],
   ["D6: =MAX(0,MIN((B2-(40+B3))/(65-(40+B3)),((85-B3)-B2)/((85-B3)-65)))","Lower Alert.","Waspada bawah."],
   ["E8: =MIN(D4,D6)   F8: =MIN(C4,C6)","R5 firing interval [lower, upper].","Selang nyalaan R5 [bawah, atas]."],
   ["' Repeat for the other active rules (R6, R8, R9) in rows 9-11 with y = 85.","Same pattern for each active rule.","Corak sama untuk setiap peraturan aktif."],
   ["H8: =SUMPRODUCT(G8:G11,E8:E11+F8:F11)/SUM(E8:F11)","Nie–Tan: weighted by the average of lower and upper firing (G = rule centres).","Nie–Tan: berpemberat purata nyalaan bawah dan atas (G = pusat peraturan)."]],
  out:"Moderate [lower, upper] = [0.50, 0.67]; Alert = [0.67, 0.80]\nR5 = [0.50, 0.67]; R6, R8, R9 = [0, 0.20], [0, 0.29], [0, 0.20]\nNie–Tan output = 63.0 (compare: KM midpoint 60.1, Type-1 57.6)"},
 {label:{en:"L3 · Python (from scratch)",bm:"T3 · Python (dari asas)"},level:"l3",lang:"python",tool:"Colab · numpy only",desc:{en:"Every line is visible — no black box. Matches the simulator exactly.",bm:"Setiap baris kelihatan — tiada kotak hitam. Sepadan tepat dengan simulator."},
  lines:[["import numpy as np","Only numpy — the maths stays transparent.","Hanya numpy — matematik kekal telus."],
   ["tri  = lambda x, a, b, c: max(0, min((x-a)/(b-a) if b > a else 1, (c-x)/(c-b) if c > b else 1))","Triangular MF with guards for shoulders.","FK segi tiga dengan pengawal untuk bahu."],
   ["trap = lambda x, a, b, c, d: max(0, min((x-a)/(b-a) if b > a else 1, 1, (d-x)/(d-c) if d > c else 1))","Trapezoidal MF.","FK trapezium."],
   ["U = 5  # +/- units of expert disagreement","Width of the footprint of uncertainty.","Lebar jejak ketidakpastian."],
   ["def it2(kind, p, x):","Returns [lower, upper] membership at x.","Memulangkan keahlian [bawah, atas] pada x."],
   ["    if kind == 'tri':","",""],
   ["        a, b, c = p; return tri(x, a+U, b, c-U), tri(x, a-U, b, c+U)","Lower narrows, upper widens.","Bawah menyempit, atas melebar."],
   ["    a, b, c, d = p","",""],
   ["    lo = trap(x, a if a == b else a+U, b, c, d if c == d else d-U)","Shoulders (a==b or c==d) stay fixed.","Bahu (a==b atau c==d) kekal tetap."],
   ["    hi = trap(x, a if a == b else a-U, b, c, d if c == d else d+U)","",""],
   ["    return lo, hi","",""],
   ["RAIN  = {'light': ('trap', (0, 0, 10, 30)), 'moderate': ('tri', (10, 35, 60)), 'heavy': ('trap', (40, 70, 100, 100))}","Same sets as Type-1.","Set sama seperti Jenis-1."],
   ["LEVEL = {'normal': ('trap', (0, 0, 40, 60)), 'alert': ('tri', (40, 65, 85)), 'danger': ('trap', (70, 90, 100, 100))}","",""],
   ["CENTRE = {'low': 15, 'medium': 50, 'high': 85}","Consequent centres for centre-of-sets.","Pusat akibat untuk pusat set."],
   ["RULES = [(a, b, o) for a, row in zip(RAIN, [['low','medium','high'], ['low','medium','high'], ['medium','high','high']]) for b, o in zip(LEVEL, row)]","Builds the same nine rules compactly.","Membina sembilan peraturan yang sama secara padat."],
   ["def km(y, fl, fu):","Karnik–Mendel by checking every switch point.","Karnik–Mendel dengan menyemak setiap titik suis."],
   ["    o = np.argsort(y); y, fl, fu = y[o], fl[o], fu[o]","Sort rules by their centre.","Isih peraturan mengikut pusat."],
   ["    L = [np.r_[fu[:k], fl[k:]] for k in range(len(y)+1)]","yl weights: upper on the left, lower on the right.","Pemberat yl: atas di kiri, bawah di kanan."],
   ["    R = [np.r_[fl[:k], fu[k:]] for k in range(len(y)+1)]","yr weights: the reverse.","Pemberat yr: sebaliknya."],
   ["    return min(w @ y / w.sum() for w in L if w.sum()), max(w @ y / w.sum() for w in R if w.sum())","Smallest and largest weighted averages.","Purata berpemberat terkecil dan terbesar."],
   ["def infer(r, w):","",""],
   ["    F = [(min(it2(*RAIN[a], r)[0], it2(*LEVEL[b], w)[0]), min(it2(*RAIN[a], r)[1], it2(*LEVEL[b], w)[1])) for a, b, _ in RULES]","Firing interval [f_lower, f_upper] for every rule.","Selang nyalaan [f_bawah, f_atas] bagi setiap peraturan."],
   ["    yl, yr = km(np.array([CENTRE[o] for *_, o in RULES], float), *map(np.array, zip(*F)))","Type reduction.","Penurunan jenis."],
   ["    return yl, yr, (yl + yr) / 2","Defuzzify: midpoint of the interval.","Nyahkabur: titik tengah selang."],
   ["for r, w in [(45, 70), (20, 30), (80, 95)]:","",""],
   ["    yl, yr, y = infer(r, w)","",""],
   ["    print(f\"rain={r}, level={w}% -> [{yl:.1f}, {yr:.1f}] crisp {y:.1f}\")","",""]],
  out:"rain=45, level=70% -> [50.0, 70.2] crisp 60.1\nrain=20, level=30% -> [15.0, 15.0] crisp 15.0\nrain=80, level=95% -> [85.0, 85.0] crisp 85.0"}]})}</div>`,
 notes:{en:"<p>Notice the calm (20/30) and storm (80/95) scenarios give zero-width intervals: only one consequent is active, so expert disagreement doesn't change the decision. Type-2 earns its keep in the grey zone — exactly where decisions are hardest. Library option: PyIT2FLS (see Tools).</p>",bm:"<p>Perhatikan senario tenang (20/30) dan ribut (80/95) memberi selang lebar sifar: hanya satu akibat aktif, jadi percanggahan pakar tidak mengubah keputusan. Jenis-2 berbaloi di zon kelabu — tepat di mana keputusan paling sukar. Pilihan pustaka: PyIT2FLS (lihat Alat).</p>"}});

/* 27 DECISION GUIDE */
add({sec:S3,t:{en:"Type-1 or Type-2?",bm:"Jenis-1 atau Jenis-2?"},html:`
<div class="kicker rv">🧭 ${L("Decide","Putuskan")}</div><h2 class="rv">${L("Choose with evidence, not fashion","Pilih berdasarkan bukti, bukan trend")}</h2>
<div class="cols c2"><div class="card rv"><h3>${L("Prefer Type-1 when…","Pilih Jenis-1 apabila…")}</h3><ul class="tight">
<li>${L("experts agree on the meaning of words","pakar sepakat tentang maksud perkataan")}</li><li>${L("sensors are clean and calibrated","penderia bersih dan ditentukur")}</li><li>${L("hardware is tiny or latency is critical","perkakasan sangat kecil atau kependaman kritikal")}</li><li>${L("you need the simplest explanation","anda perlukan penerangan paling ringkas")}</li></ul></div>
<div class="card tint rv"><h3>${L("Consider Type-2 when…","Pertimbangkan Jenis-2 apabila…")}</h3><ul class="tight">
<li>${L("people interpret the words differently","orang mentafsir perkataan secara berbeza")}</li><li>${L("measurements are noisy or drift","pengukuran mengandungi ralat atau hanyut")}</li><li>${L("you want an output interval that flags doubt","anda mahu selang output yang menandakan keraguan")}</li><li>${L("a T1 system performs poorly under disturbance","sistem J1 berprestasi lemah di bawah gangguan")}</li></ul></div></div>
<div class="cols c3" style="margin-top:12px">
<div class="call warn rv"><b>${L("Myth","Mitos")}</b>${L("“Type-2 is always better.” It has more parameters — it can overfit and costs more. Compare on held-out data.","“Jenis-2 sentiasa lebih baik.” Ia mempunyai lebih banyak parameter — boleh lebih suai dan lebih mahal. Bandingkan pada data yang diasingkan.")}</div>
<div class="call warn rv"><b>${L("Myth","Mitos")}</b>${L("“Type-2 is a black box.” Rules stay readable; only the sets gained a band.","“Jenis-2 ialah kotak hitam.” Peraturan kekal boleh dibaca; hanya set yang mendapat jalur.")}</div>
<div class="call fact rv"><b>${L("Fair test","Ujian adil")}</b>${L("Give T1 the same tuning budget as T2 before claiming T2 wins (Wu &amp; Mendel's design recommendations).","Beri J1 bajet penalaan yang sama dengan J2 sebelum mendakwa J2 menang (cadangan reka bentuk Wu &amp; Mendel).")}</div></div>`,
 notes:{en:"<p>Wu &amp; Mendel (2019) recommend starting with T1, then IT2 with the same structure, tuning both fairly, and reporting both accuracy and computational cost.</p>",bm:"<p>Wu &amp; Mendel (2019) mencadangkan bermula dengan J1, kemudian IT2 dengan struktur sama, menala kedua-duanya secara adil, dan melaporkan ketepatan serta kos pengiraan.</p>"}});

/* 27b THREE KINDS OF UNCERTAINTY */
add({sec:S3b,t:{en:"Fuzziness, randomness, ignorance",bm:"Kekaburan, kerawakan, kejahilan"},html:`
<div class="kicker rv">🧭 ${L("Big picture","Gambaran besar")}</div><h2 class="rv">${L("Not all uncertainty is the same — pick the right maths","Tidak semua ketidakpastian sama — pilih matematik yang betul")}</h2>
<table class="t rv"><tr><th></th><th>${L("Probability","Kebarangkalian")}</th><th>${L("Type-1 fuzzy","Kabur Jenis-1")}</th><th>${L("Type-2 fuzzy","Kabur Jenis-2")}</th><th>${L("Rough / interval sets","Set kasar / selang")}</th></tr>
<tr><td>${L("Question","Soalan")}</td><td>${L("Will it rain more than 50 mm?","Adakah hujan melebihi 50 mm?")}</td><td>${L("Is 45 mm “heavy”?","Adakah 45 mm “lebat”?")}</td><td>${L("Do we even agree what “heavy” means?","Adakah kita sepakat maksud “lebat”?")}</td><td>${L("Which category, given coarse data?","Kategori mana, dengan data kasar?")}</td></tr>
<tr><td>${L("Uncertainty about","Ketidakpastian tentang")}</td><td>${L("whether an event happens","sama ada kejadian berlaku")}</td><td>${L("the meaning of a word (vagueness)","maksud perkataan (kekaburan)")}</td><td>${L("the membership itself","keahlian itu sendiri")}</td><td>${L("indiscernibility / missing detail","ketakbolehbezaan / butiran tiada")}</td></tr>
<tr><td>${L("Numbers add to 1?","Jumlah = 1?")}</td><td>${L("yes","ya")}</td><td>${L("no","tidak")}</td><td>${L("no","tidak")}</td><td>—</td></tr>
<tr><td>${L("Resolves with more data?","Selesai dengan lebih data?")}</td><td>${L("yes (after the event)","ya (selepas kejadian)")}</td><td>${L("no — vagueness stays","tidak — kekaburan kekal")}</td><td>${L("partly (by consensus)","sebahagian (melalui konsensus)")}</td><td>${L("yes (finer data)","ya (data lebih halus)")}</td></tr></table>
<div class="cols c2" style="margin-top:12px"><div class="call fact rv"><b>${L("They combine","Ia boleh digabung")}</b>${L("“The probability of heavy rain tomorrow is 0.7” mixes both: a probability of a fuzzy event (Zadeh, 1968).","“Kebarangkalian hujan lebat esok ialah 0.7” mencampurkan kedua-duanya: kebarangkalian kejadian kabur (Zadeh, 1968).")}</div>
<div class="call tip rv"><b>${L("Classify","Klasifikasi")}</b>${L("“Sensor reading ±2 cm”, “a ‘safe’ level”, “a 1-in-100-year flood”, “residents disagree on ‘near the river’”. Which tool fits each?","“Bacaan penderia ±2 cm”, “paras ‘selamat’”, “banjir 1-dalam-100-tahun”, “penduduk tidak sepakat tentang ‘dekat sungai’”. Alat mana sesuai bagi setiap satu?")}</div></div>`,
 notes:{en:"<p>Suggested answers: sensor ±2 cm → interval/probabilistic noise model; ‘safe’ level → Type-1 fuzzy; 1-in-100-year flood → probability (return period); residents disagree → Type-2 fuzzy.</p>",bm:"<p>Cadangan jawapan: penderia ±2 cm → model ralat selang/kebarangkalian; paras ‘selamat’ → kabur Jenis-1; banjir 1-dalam-100-tahun → kebarangkalian (tempoh kembali); penduduk tidak sepakat → kabur Jenis-2.</p>"}});

/* 27c FUZZY C-MEANS */
add({sec:S3b,t:{en:"Fuzzy c-means clustering",bm:"Pengelompokan c-min kabur"},html:`
<div class="kicker rv">🫧 ${L("Instrument","Instrumen")} · ${L("Pembelajaran Tidak Terarah","Pembelajaran Tidak Terarah")}</div><h2 class="rv">${L("Let the data suggest the fuzzy sets","Biarkan data mencadangkan set kabur")}</h2>
<div class="cols c2"><div class="sim rv"><canvas id="fcv" width="420" height="340" style="width:100%;border-radius:12px"></canvas><div class="readout" id="fcr"></div></div>
<div class="rv">${slider("fck",L("Clusters c","Kelompok c"),2,5,3)}${slider("fcm",L("Fuzzifier m","Pengabur m"),1.1,4,2,.1)}
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="fcs">▶ ${L("One iteration","Satu lelaran")}</button><button class="btn" id="fcr10">⏩ ×10</button><button class="btn" id="fcn">🎲 ${L("New data","Data baharu")}</button></div>
<div class="eq">u<sub>ik</sub> = 1 / Σ<sub>j</sub> (‖x<sub>k</sub>−v<sub>i</sub>‖ / ‖x<sub>k</sub>−v<sub>j</sub>‖)<sup>2/(m−1)</sup></div><div class="eq">v<sub>i</sub> = Σ<sub>k</sub> u<sub>ik</sub><sup>m</sup> x<sub>k</sub> / Σ<sub>k</sub> u<sub>ik</sub><sup>m</sup></div>
<p class="small">${L("Each point belongs to every cluster to a degree (colour blend). m → 1 gives crisp k-means; large m makes everything belong everywhere. Projecting the memberships onto one axis yields data-driven membership functions — e.g. what “heavy rain” looks like in your catchment's records.","Setiap titik tergolong dalam setiap kelompok pada satu darjah (campuran warna). m → 1 memberi k-min rangup; m besar menjadikan semua tergolong di mana-mana. Mengunjurkan keahlian pada satu paksi menghasilkan fungsi keahlian berasaskan data — cth. rupa “hujan lebat” dalam rekod tadahan anda.")}</p></div></div>`,
 init(el){const COLS=["#e03131","#1c7ed6","#2f9e44","#f08c00","#7048e8"];let seed=3;const R=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
  const newData=()=>{const k=3+Math.floor(R()*2),ctr=[...Array(k)].map(()=>[60+R()*300,50+R()*240]);this.X=[...Array(150)].map((_,i)=>{const cc=ctr[i%k],a=R()*6.28,r=Math.sqrt(-2*Math.log(R()+1e-9))*28;return [cc[0]+r*Math.cos(a),cc[1]+r*Math.sin(a)]});reset()};
  const reset=()=>{const c=val(el,"fck");this.V=[...Array(c)].map((_,i)=>this.X[Math.floor(i*this.X.length/c)].slice());this.it=0;this.U=null;step(0)};
  const step=n=>{const c=this.V.length,m=val(el,"fcm");for(let s=0;s<=n;s++){this.U=this.X.map(x=>{const d=this.V.map(v=>Math.max(1e-6,Math.hypot(x[0]-v[0],x[1]-v[1])));return d.map(di=>1/d.reduce((a,dj)=>a+(di/dj)**(2/(m-1)),0))});if(s<n){this.V=this.V.map((_,i)=>{let sx=0,sy=0,sw=0;this.X.forEach((x,k)=>{const w=this.U[k][i]**m;sx+=w*x[0];sy+=w*x[1];sw+=w});return [sx/sw,sy/sw]});this.it++}}draw()};
  const draw=()=>{const g=el.querySelector("#fcv").getContext("2d");g.clearRect(0,0,420,340);const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
   this.X.forEach((x,k)=>{const u=this.U[k],rgb=[0,1,2].map(ch=>Math.round(u.reduce((a,ui,i)=>a+ui*hex(COLS[i])[ch],0)));g.fillStyle=`rgb(${rgb})`;g.globalAlpha=.35+.65*Math.max(...u);g.beginPath();g.arc(x[0],x[1],4.5,0,7);g.fill()});g.globalAlpha=1;
   this.V.forEach((v,i)=>{g.fillStyle=COLS[i];g.strokeStyle="#fff";g.lineWidth=3;g.beginPath();g.arc(v[0],v[1],10,0,7);g.fill();g.stroke()});
   const J=this.X.reduce((a,x,k)=>a+this.V.reduce((b,v,i)=>b+this.U[k][i]**val(el,"fcm")*((x[0]-v[0])**2+(x[1]-v[1])**2),0),0);const pc=this.U.reduce((a,u)=>a+u.reduce((b,v)=>b+v*v,0),0)/this.X.length;
   el.querySelector("#fcr").innerHTML=`<span class="r"><b>${tx("iteration","lelaran")}</b>${this.it}</span><span class="r"><b>J<sub>m</sub></b>${(J/1000).toFixed(1)}k</span><span class="r"><b>${tx("partition coefficient","pekali sekatan")}</b>${pc.toFixed(3)}</span>`};
  this.draw=draw;el.querySelector("#fcs").onclick=()=>step(1);el.querySelector("#fcr10").onclick=()=>step(10);el.querySelector("#fcn").onclick=newData;bind(el,["fck"],()=>{if(this.X)reset()});bind(el,["fcm"],()=>{if(this.X)step(0)});newData()},
 show(el){if(this.draw)this.draw()}});

/* 27d TUNING WITH METAHEURISTICS */
add({sec:S3b,t:{en:"Tuning a fuzzy system with simulated annealing",bm:"Menala sistem kabur dengan penyepuhlindapan simulasi"},html:`
<div class="kicker rv">🔥 ${L("Link to L6","Kaitan dengan L6")} · ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Let an optimiser place the Alert peak","Biarkan pengoptimum meletakkan puncak Waspada")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="tnv"></svg><div class="readout" id="tnr"></div></div>
<div class="rv"><p class="small">${L("Twelve historical events were rated by officers (target risk). We search the peak b of the Alert set (tri(40, b, 85)) that minimises the error between the fuzzy output and the officers' ratings.","Dua belas kejadian sejarah telah dinilai oleh pegawai (risiko sasaran). Kita mencari puncak b set Waspada (tri(40, b, 85)) yang meminimumkan kesilapan antara output kabur dan penilaian pegawai.")}</p>
<div class="eq">RMSE(b) = √( Σ (y<sub>fuzzy</sub>(r,w; b) − y<sub>officer</sub>)² / 12 )</div>${slider("tnb",L("Manual b","b manual"),45,80,65,.5)}
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="tnsa">🔥 ${L("Run simulated annealing","Jalankan penyepuhlindapan simulasi")}</button><button class="btn" id="tnrs">↺</button></div>
<div class="call fact"><b>${L("Why metaheuristics?","Mengapa metaheuristik?")}</b>${L("Mamdani with min/max is not smooth in its parameters, so gradients are unreliable. SA, GA or PSO only need the error value — exactly the derivative-free search from L6.","Mamdani dengan min/max tidak licin dalam parameternya, jadi kecerunan tidak boleh dipercayai. SA, GA atau PSO hanya memerlukan nilai kesilapan — tepat carian bebas terbitan daripada L6.")}</div>
<div class="call warn"><b>${L("Careful","Berhati-hati")}</b>${L("Tuning to officers' past ratings also copies their past biases. Validate on events the optimiser never saw.","Menala kepada penilaian lampau pegawai juga menyalin bias lampau mereka. Sahkan pada kejadian yang tidak pernah dilihat pengoptimum.")}</div></div></div>`,
 init(el){const EV=[[20,30,15],[45,70,62],[60,55,55],[80,95,88],[30,75,60],[70,40,45],[10,85,70],[55,80,78],[35,50,35],[90,60,72],[50,65,58],[25,90,80]];
  const run=(b,r,w)=>{const lv={normal:[0,0,40,60],alert:[40,b,b,85],danger:[70,90,100,100]};const f=RULES.map(([a,bb])=>Math.min(mu(MF.rain[a],r),trap(w,...lv[bb])));const agg=y=>Math.max(0,...RULES.map((R,i)=>Math.min(f[i],mu(MF.risk[R[2]],y))));let n=0,d=0;for(let y=0;y<=100;y+=2){const m=agg(y);n+=m*y;d+=m}return d?n/d:50};
  EV.forEach((e,i)=>{e[2]=run(52,e[0],e[1])+[2,-3,1,-1,3,-2,0,2,-1,1,-2,3][i]});this.err=b=>Math.sqrt(EV.reduce((s,[r,w,t])=>s+(run(b,r,w)-t)**2,0)/EV.length);this.curve=[];for(let b=45;b<=80;b+=.5)this.curve.push([b,this.err(b)]);this.path=[];
  el.querySelector("#tnsa").onclick=()=>{clearInterval(this.iv);let b=val(el,"tnb"),e=this.err(b),T=5,best=[b,e];this.path=[[b,e]];let k=0;let s=12345;const R=()=>{s=(s*16807)%2147483647;return s/2147483647};
   this.iv=setInterval(()=>{if(k++>60||!el.classList.contains("on")){clearInterval(this.iv);return}const nb=Math.max(45,Math.min(80,b+(R()-.5)*8)),ne=this.err(nb);if(ne<e||R()<Math.exp(-(ne-e)/T)){b=nb;e=ne}if(e<best[1])best=[b,e];T*=.92;this.path.push([b,e]);this.best=best;this.T=T;this.show(el)},90)};
  el.querySelector("#tnrs").onclick=()=>{clearInterval(this.iv);this.path=[];this.best=null;this.show(el)};bind(el,["tnb"],()=>this.show(el))},
 show(el){const c=C(),b=val(el,"tnb"),mx=Math.max(...this.curve.map(p=>p[1]));const mn=Math.min(...this.curve.map(p=>p[1]));const P=plot(el.querySelector("#tnv"),{x0:45,x1:80,y0:Math.floor(mn*.8),y1:Math.ceil(mx*1.05),w:520,h:260});P.clear();P.axes(tx("Alert peak b","puncak Waspada b"),"RMSE",[45,55,65,75,80],[Math.floor(mn*.8),Math.round((mn+mx)/2),Math.ceil(mx)]);
  P.el("path",{d:this.curve.map((p,i)=>(i?"L":"M")+P.X(p[0])+","+P.Y(p[1])).join(""),fill:"none",stroke:c.a1,"stroke-width":3});
  if(this.path.length){P.el("path",{d:this.path.map((p,i)=>(i?"L":"M")+P.X(p[0])+","+P.Y(p[1])).join(""),fill:"none",stroke:c.a2,"stroke-width":1.2,"stroke-dasharray":"3 3"});const l=this.path[this.path.length-1];P.el("circle",{cx:P.X(l[0]),cy:P.Y(l[1]),r:7,fill:c.a2})}
  const e=this.err(b);P.el("circle",{cx:P.X(b),cy:P.Y(e),r:6,fill:c.acc});
  el.querySelector("#tnr").innerHTML=`<span class="r" style="color:${c.acc}"><b>${tx("manual","manual")}</b>b=${b} → ${e.toFixed(2)}</span>${this.best?`<span class="r" style="color:${c.a2}"><b>SA ${tx("best","terbaik")}</b>b=${this.best[0].toFixed(1)} → ${this.best[1].toFixed(2)}</span><span class="r"><b>T</b>${this.T.toFixed(2)}</span>`:""}`}});

/* 27e PITFALLS */
add({sec:S3b,t:{en:"Common pitfalls",bm:"Perangkap biasa"},html:`
<div class="kicker rv">🚧 ${L("Debugging checklist","Senarai semak nyahpepijat")}</div><h2 class="rv">${L("Seven mistakes we see every semester","Tujuh kesilapan yang kami lihat setiap semester")}</h2>
<div class="cols c3">
${[["🕳️","Gaps between sets","Jurang antara set","An input in the gap fires no rule → undefined output. Overlap neighbouring sets.","Input dalam jurang tidak menyalakan peraturan → output tidak ditakrif. Tindihkan set berjiran."],["🧨","Rule explosion","Letupan peraturan","Adding a 4th input with 5 terms multiplies rules by 5. Go hierarchical.","Menambah input ke-4 dengan 5 istilah mendarab peraturan dengan 5. Gunakan hierarki."],["🔀","Mixing implication families","Mencampur keluarga implikasi","Łukasiewicz implication + max aggregation gives nonsense.","Implikasi Łukasiewicz + agregat max memberi hasil tidak bermakna."],["📏","Universe too narrow","Semesta terlalu sempit","Rain of 140 mm/h falls off the chart. Clip inputs or extend shoulders.","Hujan 140 mm/j terkeluar carta. Hadkan input atau lanjutkan bahu."],["🎯","Centroid can't reach the edges","Sentroid tidak sampai ke hujung","With symmetric end sets the centroid never hits 0 or 100. Use shoulders or adjust output range.","Dengan set hujung simetri sentroid tidak pernah mencapai 0 atau 100. Guna bahu atau laraskan julat output."],["🧪","Unfair T1 vs T2 tests","Ujian J1 lwn J2 tidak adil","Tuning only the T2 system. Give both the same budget.","Menala sistem J2 sahaja. Beri kedua-duanya bajet sama."],["🙈","Silent expert bias","Bias pakar senyap","One engineer wrote all sets. Record who elicited what, and review with users.","Seorang jurutera menulis semua set. Rekod siapa mendapatkan apa, dan semak bersama pengguna."]].map(p=>`<div class="card rv"><div class="ic">${p[0]}</div><b>${L(p[1],p[2])}</b><p class="small">${L(p[3],p[4])}</p></div>`).join("")}</div>`});

/* 28 APPLICATIONS */
add({sec:S4,t:{en:"Real-world applications",bm:"Aplikasi dunia sebenar"},html:`
<div class="kicker rv">🌍 ${L("Association","Kaitan")}</div><h2 class="rv">${L("Where fuzzy logic quietly works","Di mana logik kabur bekerja secara senyap")}</h2>
<div class="cols c4">
 <div class="card rv"><div class="ic">🚇</div><b>${L("Transport","Pengangkutan")}</b><p class="small">${L("Smooth train braking (Sendai), anti-lock brakes, cruise control.","Brek kereta api yang licin (Sendai), brek anti-kunci, kawalan pelayaran.")}</p></div>
 <div class="card rv"><div class="ic">🍚</div><b>${L("Home appliances","Peralatan rumah")}</b><p class="small">${L("Rice cookers, washing machines, air-conditioners adjusting to load and humidity.","Periuk nasi, mesin basuh, penyaman udara menyesuaikan beban dan kelembapan.")}</p></div>
 <div class="card rv"><div class="ic">🤖</div><b>${L("Robotics (T2)","Robotik (J2)")}</b><p class="small">${L("Outdoor robots under sensor noise and changing terrain.","Robot luar di bawah ralat penderia dan rupa bumi berubah.")}</p></div>
 <div class="card rv"><div class="ic">🏥</div><b>${L("Healthcare","Kesihatan")}</b><p class="small">${L("Triage and risk scoring where clinicians' words carry uncertainty.","Triaj dan pemarkahan risiko di mana kata-kata klinisian membawa ketidakpastian.")}</p></div>
 <div class="card rv"><div class="ic">🌴</div><b>${L("Agriculture","Pertanian")}</b><p class="small">${L("Grading fruit ripeness; irrigation scheduling from soil and weather.","Menggred kematangan buah; penjadualan pengairan daripada tanah dan cuaca.")}</p></div>
 <div class="card rv"><div class="ic">🌊</div><b>${L("Disaster risk","Risiko bencana")}</b><p class="small">${L("Flood and landslide susceptibility mapping combining expert criteria.","Pemetaan kerentanan banjir dan tanah runtuh menggabungkan kriteria pakar.")}</p></div>
 <div class="card rv"><div class="ic">💳</div><b>${L("Finance","Kewangan")}</b><p class="small">${L("Credit and fraud rules that auditors can read.","Peraturan kredit dan penipuan yang boleh dibaca juruaudit.")}</p></div>
 <div class="card rv"><div class="ic">🧠</div><b>${L("Explainable AI","AI boleh diterangkan")}</b><p class="small">${L("Rule-based surrogates that explain black-box models to people.","Model pengganti berasaskan peraturan yang menerangkan model kotak hitam kepada manusia.")}</p></div></div>
<div class="call tip rv"><b>${L("Connect to your work","Kaitkan dengan kerja anda")}</b>${L("Name one decision in your workplace that uses words like “high”, “urgent” or “risky”. Write two rules for it.","Namakan satu keputusan di tempat kerja anda yang menggunakan kata seperti “tinggi”, “segera” atau “berisiko”. Tulis dua peraturan untuknya.")}</div>`,
 notes:{en:"<p>Andragogy: connecting new knowledge to your own experience improves transfer. The prompt on this slide is the seed for your studio idea.</p>",bm:"<p>Andragogi: mengaitkan pengetahuan baharu dengan pengalaman sendiri meningkatkan pemindahan. Prom pada slaid ini ialah benih idea studio anda.</p>"}});

/* 29 RECENT ADVANCES */
add({sec:S4,t:{en:"Recent advancements",bm:"Kemajuan terkini"},html:`
<div class="kicker rv"><span class="pill new">2024–2026</span> ${L("What's new","Apa yang baharu")}</div><h2 class="rv">${L("Fuzzy logic meets deep learning","Logik kabur bertemu pembelajaran mendalam")}</h2>
<div class="cols c2">
 <div class="call new rv"><b>${L("Deep-learning-trained IT2 systems (2025)","Sistem IT2 dilatih pembelajaran mendalam (2025)")}</b>${L("Köklü, Güven &amp; Kumbasar reparameterise IT2 systems so standard optimisers and automatic differentiation can train them, producing prediction intervals for high-risk scenarios.","Köklü, Güven &amp; Kumbasar memparameter semula sistem IT2 supaya pengoptimum standard dan pembezaan automatik boleh melatihnya, menghasilkan selang ramalan untuk senario berisiko tinggi.")} <a href="https://doi.org/10.1109/TFUZZ.2024.3482393" target="_blank" rel="noopener">doi:10.1109/TFUZZ.2024.3482393</a></div>
 <div class="call new rv"><b>${L("Neuro-fuzzy for explainable AI (2025)","Neuro-kabur untuk AI boleh diterangkan (2025)")}</b>${L("A 2025 survey maps deep neuro-fuzzy architectures from 2020–2025 by how they fuse learning with readable rules (preprint, not yet peer-reviewed).","Tinjauan 2025 memetakan seni bina neuro-kabur mendalam 2020–2025 mengikut cara menggabungkan pembelajaran dengan peraturan boleh dibaca (pracetak, belum disemak rakan).")} <a href="https://www.preprints.org/manuscript/202506.1173" target="_blank" rel="noopener">preprints.org/202506.1173</a></div>
 <div class="call new rv"><b>${L("Fuzzy computer vision review (2025)","Tinjauan penglihatan komputer kabur (2025)")}</b>${L("Reviews fuzzy clustering, type-2 sets and hybrids with CNNs for noisy, ambiguous images.","Meninjau pengelompokan kabur, set jenis-2 dan hibrid dengan CNN untuk imej beralat dan samar.")} <a href="https://arxiv.org/abs/2507.18660" target="_blank" rel="noopener">arXiv:2507.18660</a></div>
 <div class="call new rv"><b>${L("Regulation pulls towards transparency","Peraturan mendorong ketelusan")}</b>${L("Malaysia's AIGE (2024) lists transparency and accountability among seven principles; the EU AI Act's high-risk duties now apply from Dec 2027 (Annex III). Readable rule bases are an advantage.","AIGE Malaysia (2024) menyenaraikan ketelusan dan akauntabiliti antara tujuh prinsip; tanggungjawab berisiko tinggi Akta AI EU kini terpakai dari Dis 2027 (Lampiran III). Pangkalan peraturan yang boleh dibaca ialah kelebihan.")}</div></div>
<div class="call tip rv"><b>${L("Think","Fikir")}</b>${L("Large language models can draft rule bases from interviews — but who checks that the rules match what experts meant?","Model bahasa besar boleh mendraf pangkalan peraturan daripada temu bual — tetapi siapa yang menyemak bahawa peraturan sepadan dengan maksud pakar?")}</div>`,
 notes:{en:"<p>The direction of travel: fuzzy systems are trained like neural networks (gradients, mini-batches) while keeping linguistic rules, and they increasingly output uncertainty (intervals) rather than a single number.</p>",bm:"<p>Hala tuju: sistem kabur dilatih seperti rangkaian neural (kecerunan, kelompok mini) sambil mengekalkan peraturan linguistik, dan semakin banyak menghasilkan ketidakpastian (selang) dan bukannya satu nombor.</p>"}});

/* 30 TOOLS */
add({sec:S4,t:{en:"Companion AI tools",bm:"Alat AI pendamping"},html:`
<div class="kicker rv">🧰 ${L("Companion tools","Alat pendamping")}</div><h2 class="rv">${L("Learn, demonstrate and apply — mostly without code","Belajar, demonstrasi dan aplikasi — kebanyakannya tanpa kod")}</h2>
<table class="t rv"><tr><th>${L("Tool","Alat")}</th><th>${L("Level","Tahap")}</th><th>${L("Use it to…","Gunakan untuk…")}</th><th>${L("Data caution","Awasan data")}</th></tr>
<tr><td><a href="https://www.desmos.com/calculator" target="_blank" rel="noopener">Desmos</a></td><td><span class="pill l1">L1</span></td><td>${L("Plot membership functions and hedges by typing formulas.","Plot fungsi keahlian dan pagar dengan menaip formula.")}</td><td>${L("None — no personal data.","Tiada — tiada data peribadi.")}</td></tr>
<tr><td>Gemini · Claude · ChatGPT</td><td><span class="pill l1">L1</span></td><td>${L("Explain steps, draft rule bases, build interactive simulators (Canvas / artifacts).","Menerangkan langkah, mendraf pangkalan peraturan, membina simulator interaktif (Canvas / artifak).")}</td><td>${L("Never paste personal or confidential data; use institution-approved accounts.","Jangan tampal data peribadi atau sulit; guna akaun yang diluluskan institusi.")}</td></tr>
<tr><td><a href="https://notebooklm.google.com" target="_blank" rel="noopener">NotebookLM</a></td><td><span class="pill l1">L1</span></td><td>${L("Ask questions grounded in the papers on the Resources slide.","Bertanya soalan berdasarkan makalah pada slaid Sumber.")}</td><td>${L("Upload only papers you may share.","Muat naik hanya makalah yang boleh dikongsi.")}</td></tr>
<tr><td><a href="https://fuzzylite.com" target="_blank" rel="noopener">FuzzyLite / QtFuzzyLite</a></td><td><span class="pill l2">L2</span></td><td>${L("Design Mamdani/TSK systems in a GUI; export code.","Mereka bentuk sistem Mamdani/TSK dalam GUI; eksport kod.")}</td><td>${L("Runs locally.","Berjalan secara setempat.")}</td></tr>
<tr><td><a href="https://www.mathworks.com/help/fuzzy/" target="_blank" rel="noopener">MATLAB Fuzzy Logic Designer</a></td><td><span class="pill l2">L2</span></td><td>${L("Drag-and-drop T1 and IT2 systems with rule viewer and surface plots.","Sistem J1 dan IT2 seret-dan-lepas dengan pemapar peraturan dan plot permukaan.")}</td><td>${L("Licensed software.","Perisian berlesen.")}</td></tr>
<tr><td><a href="https://colab.research.google.com" target="_blank" rel="noopener">Google Colab</a> + <a href="https://github.com/scikit-fuzzy/scikit-fuzzy" target="_blank" rel="noopener">scikit-fuzzy</a></td><td><span class="pill l3">L3</span></td><td>${L("Run Lab A1; ask Gemini in Colab to explain errors.","Jalankan Makmal A1; minta Gemini dalam Colab menerangkan ralat kod.")}</td><td>${L("Use synthetic or anonymised data.","Guna data sintetik atau tanpa nama.")}</td></tr>
<tr><td><a href="https://github.com/Haghrah/PyIT2FLS" target="_blank" rel="noopener">PyIT2FLS</a></td><td><span class="pill l3">L3</span></td><td>${L("Interval Type-2 sets, KM type reduction and IT2 TSK in Python.","Set Jenis-2 selang, penurunan jenis KM dan TSK IT2 dalam Python.")}</td><td>—</td></tr></table>`,
 notes:{en:"<p>Low/no-code path for the whole module: Desmos to see shapes → this deck's simulators to trace inference → an AI assistant to build your own simulator from a precise prompt → verify against the acceptance test.</p>",bm:"<p>Laluan tanpa/kod rendah untuk keseluruhan modul: Desmos untuk melihat bentuk → simulator dek ini untuk menjejak inferens → pembantu AI untuk membina simulator sendiri daripada prom yang tepat → sahkan dengan ujian penerimaan.</p>"}});

/* 31 ETHICS */
add({sec:S4,t:{en:"Safety, ethics & data protection",bm:"Keselamatan, etika & perlindungan data"},html:`
<div class="kicker rv">🛡️ ${L("Responsible AI","AI bertanggungjawab")}</div><h2 class="rv">${L("Transparent is not the same as fair","Telus tidak sama dengan adil")}</h2>
<div class="cols c2"><div class="rv"><div class="call eth"><b>${L("Rule bias","Bias peraturan")}</b>${L("Rules encode whoever wrote them. If only engineers set “Danger”, residents' lived knowledge is missing. Record who elicited each set and when.","Peraturan mengekod pandangan penulisnya. Jika hanya jurutera menetapkan “Bahaya”, pengetahuan penduduk tertinggal. Rekod siapa yang mendapatkan setiap set dan bila.")}</div>
<div class="call eth"><b>${L("Personal data","Data peribadi")}</b>${L("Location or household data for warnings falls under Malaysia's PDPA (amended 2024: breach notification, data protection officers, data portability). Collect the minimum; get consent; anonymise.","Data lokasi atau isi rumah untuk amaran tertakluk kepada PDPA Malaysia (dipinda 2024: pemberitahuan pelanggaran, pegawai perlindungan data, kemudahalihan data). Kumpul minimum; dapatkan persetujuan; jadikan tanpa nama.")}</div>
<div class="call eth"><b>${L("Human oversight","Pengawasan manusia")}</b>${L("A fuzzy score supports a decision — an accountable officer issues the warning.","Skor kabur menyokong keputusan — pegawai yang bertanggungjawab mengeluarkan amaran.")}</div></div>
<div class="card rv"><h3>${L("AIGE's seven principles (MOSTI, 2024)","Tujuh prinsip AIGE (MOSTI, 2024)")}</h3><ol class="tight small">
<li>${L("Fairness","Keadilan")}</li><li>${L("Reliability, safety &amp; control","Kebolehpercayaan, keselamatan &amp; kawalan")}</li><li>${L("Privacy &amp; security","Privasi &amp; keselamatan")}</li><li>${L("Inclusiveness","Keterangkuman")}</li><li>${L("Transparency","Ketelusan")}</li><li>${L("Accountability","Akauntabiliti")}</li><li>${L("Pursuit of human benefit &amp; happiness","Mengejar manfaat &amp; kesejahteraan insan")}</li></ol>
<div class="call val"><b>${L("Value: Tanggungjawab (responsibility)","Nilai: Tanggungjawab")}</b>${L("Before using any AI tool, ask: whose data, whose consent, who is accountable?","Sebelum menggunakan sebarang alat AI, tanya: data siapa, persetujuan siapa, siapa bertanggungjawab?")}</div></div></div>`,
 notes:{en:"<p>AIGE is voluntary guidance from MOSTI (launched 20 Sept 2024) for end users, policymakers and developers. When you use public AI assistants for coursework, remove names, IC numbers, addresses and any confidential institutional data first.</p>",bm:"<p>AIGE ialah garis panduan sukarela MOSTI (dilancarkan 20 Sept 2024) untuk pengguna akhir, penggubal dasar dan pembangun. Apabila menggunakan pembantu AI awam untuk kerja kursus, buang nama, nombor KP, alamat dan sebarang data sulit institusi terlebih dahulu.</p>"}});

/* 32 QUIZ B */
add({sec:S4,t:{en:"Checkpoint B (Type-2)",bm:"Titik semak B (Jenis-2)"},noAutoDone:true,html:`
<div class="kicker rv">✅ ${L("Formative assessment","Pentaksiran formatif")} · 6 ${L("items","item")} · ~8 min</div><h2 class="rv">${L("Checkpoint B","Titik semak B")}</h2>
<div class="rv">${quiz({id:"fzB",items:[
 {q:{en:"The Footprint of Uncertainty is bounded by…",bm:"Jejak Ketidakpastian dibatasi oleh…"},o:[{en:"the core and support",bm:"teras dan sokongan"},{en:"the upper and lower membership functions",bm:"fungsi keahlian atas dan bawah"},{en:"two α-cuts",bm:"dua potongan-α"},{en:"the input and output universes",bm:"semesta input dan output"}],a:1,why:{en:"FOU lies between the UMF (μ̄) and the LMF (μ̲).",bm:"FOU terletak antara UMF (μ̄) dan LMF (μ̲)."}},
 {q:{en:"In an interval Type-2 set, the membership of x is…",bm:"Dalam set Jenis-2 selang, keahlian x ialah…"},o:[{en:"a single number",bm:"satu nombor"},{en:"an interval whose secondary grades all equal 1",bm:"selang dengan semua gred sekunder bernilai 1"},{en:"a probability distribution",bm:"taburan kebarangkalian"},{en:"always 0 or 1",bm:"sentiasa 0 atau 1"}],a:1,why:{en:"IT2 = uniform secondary grade of 1 over [μ̲(x), μ̄(x)].",bm:"IT2 = gred sekunder seragam 1 pada [μ̲(x), μ̄(x)]."}},
 {q:{en:"Rule antecedents give [0.5, 0.8] and [0.6, 0.7]. With min, the firing interval is…",bm:"Anteseden peraturan memberi [0.5, 0.8] dan [0.6, 0.7]. Dengan min, selang nyalaan ialah…"},o:["[0.5, 0.7]","[0.6, 0.8]","[0.3, 0.56]","[0.5, 0.8]"],a:0,why:{en:"Lower = min(0.5, 0.6) = 0.5; upper = min(0.8, 0.7) = 0.7.",bm:"Bawah = min(0.5, 0.6) = 0.5; atas = min(0.8, 0.7) = 0.7."}},
 {q:{en:"Why does an IT2 system need type reduction?",bm:"Mengapa sistem IT2 memerlukan penurunan jenis?"},o:[{en:"To speed up fuzzification",bm:"Untuk mempercepat pengaburan"},{en:"Its inference output is a Type-2 set that must become Type-1 (an interval) before defuzzifying",bm:"Output inferensnya ialah set Jenis-2 yang perlu menjadi Jenis-1 (selang) sebelum dinyahkabur"},{en:"To remove rules",bm:"Untuk membuang peraturan"},{en:"Because KM needs it to train",bm:"Kerana KM memerlukannya untuk latihan"}],a:1,why:{en:"Type reduction (e.g. KM) maps the T2 output to an interval [yₗ, yᵣ]; then we take its midpoint.",bm:"Penurunan jenis (cth. KM) memetakan output J2 kepada selang [yₗ, yᵣ]; kemudian kita ambil titik tengahnya."}},
 {q:{en:"Setting the FOU width U = 0 makes the IT2 system…",bm:"Menetapkan lebar FOU U = 0 menjadikan sistem IT2…"},o:[{en:"unstable",bm:"tidak stabil"},{en:"identical to its Type-1 counterpart",bm:"sama dengan rakan Jenis-1"},{en:"output only zeros",bm:"menghasilkan sifar sahaja"},{en:"a neural network",bm:"rangkaian neural"}],a:1,why:{en:"UMF = LMF, so every interval collapses to a point — Type-1 is the special case.",bm:"UMF = LMF, jadi setiap selang runtuh menjadi titik — Jenis-1 ialah kes khas."}},
 {q:{en:"Which situation most justifies Type-2?",bm:"Situasi manakah yang paling mewajarkan Jenis-2?"},o:[{en:"A calibrated lab thermostat with one expert",bm:"Termostat makmal ditentukur dengan seorang pakar"},{en:"Several experts disagree on terms and sensors are noisy",bm:"Beberapa pakar tidak sepakat tentang istilah dan penderia beralat"},{en:"A 4-bit microcontroller with 1 ms deadline",bm:"Mikropengawal 4-bit dengan tarikh akhir 1 ms"},{en:"When no data or experts exist",bm:"Apabila tiada data atau pakar"}],a:1,why:{en:"Type-2 targets linguistic and measurement uncertainty; tiny hardware and clean settings favour Type-1.",bm:"Jenis-2 menyasarkan ketidakpastian linguistik dan pengukuran; perkakasan kecil dan tetapan bersih memihak kepada Jenis-1."}}]})}</div>`});

/* 33 STUDIO */
add({sec:S4,t:{en:"Design studio 1",bm:"Studio reka bentuk 1"},html:`
${dt([1,2,3])}<div class="kicker rv">🎨 ${L("Team challenge · 40 min","Cabaran pasukan · 40 minit")}</div><h2 class="rv">${L("Design a flood-warning rule base for one neighbourhood","Reka pangkalan peraturan amaran banjir untuk satu kejiranan")}</h2>
<div class="cols c2"><div class="card rv"><h3>${L("Brief","Taklimat")}</h3><ol class="tight">
<li>${L("Pick a real neighbourhood you know (e.g. near Sungai Langat). Revisit your persona notes.","Pilih kejiranan sebenar yang anda kenali (cth. berhampiran Sungai Langat). Semak semula nota persona.")}</li>
<li>${L("Choose ≥ 2 inputs and 1 output; define 3 linguistic terms each.","Pilih ≥ 2 input dan 1 output; takrifkan 3 istilah linguistik bagi setiap satu.")}</li>
<li>${L("Write ≥ 6 rules. Mark which rules came from which stakeholder.","Tulis ≥ 6 peraturan. Tandakan peraturan mana datang daripada pihak berkepentingan mana.")}</li>
<li>${L("Decide T1 or IT2 — justify with a source of uncertainty.","Putuskan J1 atau IT2 — wajarkan dengan sumber ketidakpastian.")}</li>
<li>${L("Prototype with the L1 prompt or the simulators; test 3 scenarios.","Bina prototaip dengan prom T1 atau simulator; uji 3 senario.")}</li></ol>
<p class="small"><b>${L("Roles","Peranan")}:</b> ${L("domain expert · AI designer · data steward (ethics)","pakar domain · pereka AI · pengurus data (etika)")}</p></div>
<div class="rv"><table class="t small"><tr><th>${L("Criterion (4 marks each)","Kriteria (4 markah setiap satu)")}</th><th>${L("Excellent looks like…","Cemerlang kelihatan seperti…")}</th></tr>
<tr><td>${L("Empathy &amp; framing","Empati &amp; pembingkaian")}</td><td>${L("Rules trace back to named user needs and fears.","Peraturan boleh dijejak kepada keperluan dan kebimbangan pengguna.")}</td></tr>
<tr><td>${L("Rule base quality","Kualiti pangkalan peraturan")}</td><td>${L("Complete, consistent, no contradictory rules; sensible sets.","Lengkap, konsisten, tiada peraturan bercanggah; set munasabah.")}</td></tr>
<tr><td>${L("Uncertainty justification","Justifikasi ketidakpastian")}</td><td>${L("T1/IT2 choice argued with evidence from testing.","Pilihan J1/IT2 dihujahkan dengan bukti ujian.")}</td></tr>
<tr><td>${L("Ethics &amp; data","Etika &amp; data")}</td><td>${L("Minimal data, consent, accountable human, AIGE principle named.","Data minimum, persetujuan, manusia bertanggungjawab, prinsip AIGE dinamakan.")}</td></tr></table>
<div class="call dt"><b>${L("Output","Hasil")}</b>${L("One slide or page: rules table, set sketch, test results, ethics note. Keep it — you'll add an ANN in Module B.","Satu slaid atau halaman: jadual peraturan, lakaran set, keputusan ujian, nota etika. Simpan — anda akan menambah ANN dalam Modul B.")}</div></div></div>`,
 notes:{en:"<p>Solo learner? Play all three roles in turn: spend 10 minutes per role and write down how each role would criticise the others' choices.</p>",bm:"<p>Belajar seorang diri? Mainkan ketiga-tiga peranan secara bergilir: 10 minit setiap peranan dan catat bagaimana setiap peranan akan mengkritik pilihan peranan lain.</p>"}});

/* 34 RESOURCES */
add({sec:S4,t:{en:"Resources & further reading",bm:"Sumber & bacaan lanjut"},html:`
<div class="kicker rv">📚 ${L("Primary sources (with DOI)","Sumber primer (dengan DOI)")}</div><h2 class="rv">${L("Read deeper","Baca lebih mendalam")}</h2>
<div class="cols c2"><ol class="refs rv">
${ref("Zadeh, L. A. (1965). Fuzzy sets. <i>Information and Control</i>, 8(3), 338–353.","https://doi.org/10.1016/S0019-9958(65)90241-X")}
${ref("Zadeh, L. A. (1975). The concept of a linguistic variable and its application to approximate reasoning—I. <i>Information Sciences</i>, 8(3), 199–249.","https://doi.org/10.1016/0020-0255(75)90036-5")}
${ref("Mamdani, E. H., &amp; Assilian, S. (1975). An experiment in linguistic synthesis with a fuzzy logic controller. <i>Int. J. Man-Machine Studies</i>, 7(1), 1–13.","https://doi.org/10.1016/S0020-7373(75)80002-2")}
${ref("Takagi, T., &amp; Sugeno, M. (1985). Fuzzy identification of systems and its applications to modeling and control. <i>IEEE Trans. SMC</i>, 15(1), 116–132.","https://doi.org/10.1109/TSMC.1985.6313399")}
${ref("Jang, J.-S. R. (1993). ANFIS: Adaptive-network-based fuzzy inference system. <i>IEEE Trans. SMC</i>, 23(3), 665–685.","https://doi.org/10.1109/21.256541")}
${ref("Karnik, N. N., Mendel, J. M., &amp; Liang, Q. (1999). Type-2 fuzzy logic systems. <i>IEEE Trans. Fuzzy Systems</i>, 7(6), 643–658.","https://doi.org/10.1109/91.811231")}</ol>
<ol class="refs rv" start="7">
${ref("Liang, Q., &amp; Mendel, J. M. (2000). Interval type-2 fuzzy logic systems: Theory and design. <i>IEEE TFS</i>, 8(5), 535–550.","https://doi.org/10.1109/91.873577")}
${ref("Mendel, J. M., &amp; John, R. I. (2002). Type-2 fuzzy sets made simple. <i>IEEE TFS</i>, 10(2), 117–127.","https://doi.org/10.1109/91.995115")}
${ref("Hagras, H. (2004). A hierarchical type-2 fuzzy logic control architecture for autonomous mobile robots. <i>IEEE TFS</i>, 12(4), 524–539.","https://doi.org/10.1109/TFUZZ.2004.832538")}
${ref("Mendel, J. M. (2017). <i>Uncertain Rule-Based Fuzzy Systems</i> (2nd ed.). Springer.","https://doi.org/10.1007/978-3-319-51370-6")}
${ref("Wu, D., &amp; Mendel, J. M. (2019). Recommendations on designing practical interval type-2 fuzzy systems.","https://arxiv.org/abs/1907.01697")}
${ref("Köklü, A., Güven, Y., &amp; Kumbasar, T. (2025). Odyssey of interval type-2 fuzzy logic systems: Learning strategies for uncertainty quantification. <i>IEEE TFS</i>, 33(1), 468–478.","https://doi.org/10.1109/TFUZZ.2024.3482393")}
${ref("MOSTI (2024). National Guidelines on AI Governance &amp; Ethics (AIGE).","https://mastic.mosti.gov.my/publication/the-national-guidelines-on-ai-governance-ethics/")}</ol></div>
<div class="call tip rv"><b>${L("Further topics","Topik lanjutan")}</b>${L("General type-2 (α-planes, zSlices) · fuzzy clustering (FCM) · ANFIS (Module B) · fuzzy multi-criteria decision making (fuzzy AHP/TOPSIS) · intuitionistic and neutrosophic sets · Fuzzy Markup Language (IEEE 1855).","Jenis-2 umum (satah-α, zSlices) · pengelompokan kabur (FCM) · ANFIS (Modul B) · pembuatan keputusan pelbagai kriteria kabur (AHP/TOPSIS kabur) · set intuisionistik dan neutrosofik · Fuzzy Markup Language (IEEE 1855).")}</div>`,
 notes:{en:"<p>Start with Mendel &amp; John (2002) — it is short and visual. Then read Köklü et al. (2025) to see where the field is heading.</p>",bm:"<p>Mulakan dengan Mendel &amp; John (2002) — ia ringkas dan visual. Kemudian baca Köklü et al. (2025) untuk melihat hala tuju bidang ini.</p>"}});

/* 35 RECAP */
add({sec:S4,t:{en:"Recap & bridge to Module B",bm:"Rumusan & jambatan ke Modul B"},html:`
<div class="kicker rv">🏁 ${L("Recap","Rumusan")}</div><h2 class="rv">${L("Three things to remember","Tiga perkara untuk diingati")}</h2>
<div class="cols c3">
 <div class="card tint rv"><div class="big grad">μ</div><b>${L("Degrees, not switches","Darjah, bukan suis")}</b><p class="small">${L("Fuzzy sets capture vague words with membership in [0,1].","Set kabur menangkap kata kabur dengan keahlian dalam [0,1].")}</p></div>
 <div class="card tint rv"><div class="big grad">FRAD</div><b>${L("Fuzzify · Rules · Aggregate · Defuzzify","Kaburkan · Peraturan · Agregat · Nyahkabur")}</b><p class="small">${L("Readable rules make decisions defensible.","Peraturan boleh dibaca menjadikan keputusan boleh dipertahankan.")}</p></div>
 <div class="card tint rv"><div class="big grad">FOU</div><b>${L("Model the doubt","Modelkan keraguan")}</b><p class="small">${L("Type-2 keeps disagreement as a band and returns an interval.","Jenis-2 mengekalkan percanggahan sebagai jalur dan memulangkan selang.")}</p></div></div>
<div class="call tip rv"><b>${L("Exit reflection (2 min)","Refleksi keluar (2 minit)")}</b>${L("One idea you will use · one question you still have · one place in your work where vagueness causes trouble.","Satu idea yang akan anda gunakan · satu soalan yang masih ada · satu tempat dalam kerja anda di mana kekaburan menimbulkan masalah.")}</div>
<p class="lead rv">${L("Rules come from experts. But what if the pattern is hidden in years of data? → ","Peraturan datang daripada pakar. Tetapi bagaimana jika corak tersembunyi dalam data bertahun-tahun? → ")}<a class="btn" href="deck-fuzzy-math.html">∑ ${L("Maths of fuzzy logic","Matematik logik kabur")}</a> <a class="btn pri" href="deck-ann.html">${L("Module B: Neural networks","Modul B: Rangkaian neural")} →</a></p>`});

T6544.start({key:"fuzzy",title:{en:"Module A · Fuzzy Logic T1 & T2",bm:"Modul A · Logik Kabur J1 & J2"},hub:"index.html",twin:{href:"deck-fuzzy-math.html",label:{en:"∑ Maths deck",bm:"∑ Dek matematik"}},slides});
window.FZ={mamdani,it2infer};
})();
