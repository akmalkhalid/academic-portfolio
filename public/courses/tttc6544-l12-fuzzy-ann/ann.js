/* Module B — Artificial Neural Networks (TTTC6544) */
(function(){
const {L,LL,OL,code,quiz,plot,css,tx}=T6544;
const C=()=>({a1:css("--a1"),a2:css("--a2"),acc:css("--acc"),ink:css("--ink2"),ok:css("--ok"),bad:css("--bad"),warn:css("--warn"),bg:css("--bg2")});
const slider=(id,lab,min,max,v,step=1)=>`<label class="ctrl"><span>${lab}</span><input type="range" id="${id}" min="${min}" max="${max}" value="${v}" step="${step}"><output id="${id}o">${v}</output></label>`;
const bind=(el,ids,fn)=>{ids.forEach(i=>{const s=el.querySelector("#"+i);s.oninput=()=>{el.querySelector("#"+i+"o").textContent=s.value;fn()}});fn()};
const val=(el,id)=>+el.querySelector("#"+id).value;
const sig=z=>1/(1+Math.exp(-z));
const ACT={step:{f:z=>z>=0?1:0,d:z=>0,n:"Step"},sigmoid:{f:sig,d:z=>sig(z)*(1-sig(z)),n:"Sigmoid"},tanh:{f:Math.tanh,d:z=>1-Math.tanh(z)**2,n:"tanh"},relu:{f:z=>Math.max(0,z),d:z=>z>0?1:0,n:"ReLU"},leaky:{f:z=>z>0?z:.1*z,d:z=>z>0?1:.1,n:"Leaky ReLU (0.1)"},gelu:{f:z=>.5*z*(1+Math.tanh(Math.sqrt(2/Math.PI)*(z+.044715*z**3))),d:z=>{const h=1e-4;return(ACT.gelu.f(z+h)-ACT.gelu.f(z-h))/(2*h)},n:"GELU"}};
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const gauss=r=>{let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const GATES={AND:[0,0,0,1],OR:[0,1,1,1],NAND:[1,1,1,0],XOR:[0,1,1,0]},PTS=[[0,0],[0,1],[1,0],[1,1]];
const S0={en:"Start",bm:"Mula"},S1={en:"Empathise & define",bm:"Empati & takrif"},S2={en:"Neurons & learning",bm:"Neuron & pembelajaran"},S3={en:"Deep learning in practice",bm:"Pembelajaran mendalam dalam amalan"},S4={en:"Apply, protect & reflect",bm:"Aplikasi, lindungi & refleksi"};
const dt=on=>`<div class="dtbar">${[["Empathise","Empati"],["Define","Takrif"],["Ideate","Idea"],["Prototype","Prototaip"],["Test","Uji"]].map((s,i)=>`<span class="${on.includes(i)?"on":""}">${L(s[0],s[1])}</span>`).join("")}</div>`;
const ref=(t,u)=>`<li>${t} <a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//,"")}</a></li>`;
const slides=[];const add=s=>slides.push(s);

/* network diagram svg helper */
function netSVG(layers,w=520,h=260,id=""){const xs=layers.map((_,i)=>40+i*(w-80)/(layers.length-1));let s="";const pos=layers.map((n,i)=>[...Array(n)].map((_,j)=>[xs[i],h/2+(j-(n-1)/2)*Math.min(56,(h-40)/n)]));
  pos.forEach((L1,i)=>{if(i<pos.length-1)L1.forEach(a=>pos[i+1].forEach(b=>{s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--a1)" stroke-opacity=".45" stroke-width="1.6" class="dash"/>`}))});
  pos.forEach((L1,i)=>L1.forEach(a=>{s+=`<circle cx="${a[0]}" cy="${a[1]}" r="15" fill="var(--bg2)" stroke="${i===0?"var(--acc)":i===pos.length-1?"var(--a2)":"var(--a1)"}" stroke-width="3"/>`}));
  return `<svg viewBox="0 0 ${w} ${h}" ${id?`id="${id}"`:""} style="width:100%">${s}</svg>`}

/* 1 TITLE */
add({sec:S0,t:{en:"Title",bm:"Tajuk"},html:`
<div class="cols c2" style="align-items:center"><div><div class="kicker rv">TTTC6544 · ${L("Advanced Artificial Intelligence","Kecerdasan Buatan Lanjutan")} · ${L("Module B","Modul B")}</div>
<h1 class="big rv"><span class="grad">${L("Artificial Neural","Rangkaian Neural")}</span><br>${L("Networks","Buatan")}</h1>
<p class="lead rv">${L("When the rules are hidden in the data — learn them, test them, explain them, protect them.","Apabila peraturan tersembunyi dalam data — pelajari, uji, terangkan dan lindunginya.")}</p>
<div class="rv" style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill l1">${L("No-code first","Tanpa kod dahulu")}</span><span class="pill">${L("Live trainer","Pelatih langsung")}</span><span class="pill">${L("Problem-based","Berasaskan masalah")}</span><span class="pill">≈ 3 ${L("hours","jam")}</span></div>
<p class="small muted rv" style="margin-top:16px">${L("Press","Tekan")} <kbd>→</kbd> · <kbd>N</kbd> ${L("notes","nota")} · <kbd>L</kbd> BM/EN</p></div>
<div class="rv float">${netSVG([3,5,5,1],460,300)}</div></div>`,
 notes:{en:"<p>Module B continues the flood problem from Module A. If you skipped Module A, read its slides 4–5 (personas and the problem statement) first.</p>",bm:"<p>Modul B menyambung masalah banjir daripada Modul A. Jika anda melangkau Modul A, baca slaid 4–5 (persona dan pernyataan masalah) terlebih dahulu.</p>"}});

/* 2 BRIDGE */
add({sec:S1,t:{en:"From rules to data",bm:"Daripada peraturan kepada data"},html:`
${dt([0,1])}<div class="kicker rv">🌊 ${L("Problem-based learning","Pembelajaran berasaskan masalah")}</div><h2 class="rv">${L("Encik Hafiz has 10 years of sensor logs. Can they forecast the river 3 hours ahead?","Encik Hafiz mempunyai log penderia 10 tahun. Bolehkah ia meramal paras sungai 3 jam ke hadapan?")}</h2>
<div class="cols c3">
 <div class="card rv"><div class="ic">📏</div><b>${L("Module A: knowledge → rules","Modul A: pengetahuan → peraturan")}</b><p class="small">${L("Experts tell us the rules. Transparent, but limited by what experts can say.","Pakar memberi peraturan. Telus, tetapi terhad kepada apa yang pakar boleh nyatakan.")}</p></div>
 <div class="card tint rv"><div class="ic">📈</div><b>${L("Module B: data → patterns","Modul B: data → corak")}</b><p class="small">${L("A network learns the mapping from examples. Powerful, but it must be tested and explained.","Rangkaian mempelajari pemetaan daripada contoh. Berkuasa, tetapi mesti diuji dan diterangkan.")}</p></div>
 <div class="card rv"><div class="ic">🤝</div><b>${L("Studio: both","Studio: kedua-duanya")}</b><p class="small">${L("Forecast with an ANN, decide with fuzzy rules, keep a human accountable.","Ramal dengan ANN, putuskan dengan peraturan kabur, kekalkan manusia yang bertanggungjawab.")}</p></div></div>
<div class="call dt rv"><b>${L("How might we…","Bagaimanakah kita boleh…")}</b>${L("…learn an early, reliable river-level forecast from past data — and know when not to trust it?","…mempelajari ramalan paras sungai yang awal dan boleh dipercayai daripada data lampau — dan tahu bila tidak patut mempercayainya?")}</div>
<div class="call val rv"><b>${L("Value: Ihsan (care &amp; excellence)","Nilai: Ihsan")}</b>${L("A model's errors fall on real households. Care shows in how carefully we test.","Kesilapan model menimpa isi rumah sebenar. Keprihatinan terserlah melalui ketelitian kita menguji.")}</div>`,
 notes:{en:"<p>This is supervised learning (Pembelajaran Terarah): inputs (rain now, rain 1 h ago, level now) and a known target (level 3 h later) from history.</p>",bm:"<p>Ini ialah Pembelajaran Terarah: input (hujan sekarang, hujan 1 jam lalu, paras sekarang) dan sasaran diketahui (paras 3 jam kemudian) daripada sejarah.</p>"}});

/* 3 LOs */
add({sec:S1,t:{en:"Learning outcomes",bm:"Hasil pembelajaran"},html:`
<div class="kicker rv">🎯 ${L("Outcomes","Hasil")}</div><h2 class="rv">${L("By the end you can…","Pada akhir modul anda boleh…")}</h2>
<div class="cols c3">
 ${[["🧠","Explain neurons, weights, biases and activation functions.","Menerangkan neuron, pemberat, pincang dan fungsi pengaktifan."],["🔁","Trace a forward pass and one step of backpropagation by hand.","Menjejak hantaran ke hadapan dan satu langkah rambatan balik secara manual."],["🎛️","Train and tune an MLP with no-code tools and interpret loss curves.","Melatih dan menala MLP dengan alat tanpa kod dan mentafsir lengkung kerugian."],["📊","Choose metrics that reflect real costs (missed floods vs false alarms).","Memilih metrik yang mencerminkan kos sebenar (banjir terlepas lwn amaran palsu)."],["🧩","Relate ANNs to fuzzy systems (ANFIS) and recent architectures (KAN, liquid networks).","Mengaitkan ANN dengan sistem kabur (ANFIS) dan seni bina terkini (KAN, rangkaian cecair)."],["🛡️","Apply privacy, fairness and accountability checks before deployment.","Mengaplikasi semakan privasi, keadilan dan akauntabiliti sebelum penggunaan."]].map(o=>`<div class="card rv"><div class="ic">${o[0]}</div><p class="small">${L(o[1],o[2])}</p></div>`).join("")}</div>`});

/* 4 BIO vs ART */
add({sec:S2,t:{en:"Biological vs artificial neuron",bm:"Neuron biologi lwn buatan"},html:`
<div class="kicker rv">🧠 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Inspired by biology, built from arithmetic","Diilhamkan biologi, dibina daripada aritmetik")}</h2>
<svg viewBox="0 0 1000 260" class="rv" style="width:100%">
 <g><circle cx="190" cy="130" r="48" fill="var(--a1)" fill-opacity=".15" stroke="var(--a1)" stroke-width="3"/>
 ${[[-60,-70],[-80,-10],[-60,55],[-20,-85]].map(d=>`<path d="M190 130 q ${d[0]/2} ${d[1]/3} ${d[0]*1.6} ${d[1]}" stroke="var(--a1)" stroke-width="3" fill="none"/>`).join("")}
 <path d="M238 130 C 300 120, 340 140, 400 130" stroke="var(--a1)" stroke-width="5" fill="none"/><circle cx="405" cy="130" r="8" fill="var(--a2)"/>
 <text x="70" y="40" font-size="14"><tspan class="en">dendrites</tspan><tspan class="bm">dendrit</tspan></text><text x="160" y="205" font-size="14"><tspan class="en">cell body</tspan><tspan class="bm">badan sel</tspan></text><text x="300" y="110" font-size="14"><tspan class="en">axon</tspan><tspan class="bm">akson</tspan></text><text x="380" y="165" font-size="14"><tspan class="en">synapse</tspan><tspan class="bm">sinaps</tspan></text></g>
 <text x="500" y="138" font-size="34" text-anchor="middle" style="fill:var(--a2)">⇄</text>
 <g>${[60,130,200].map((y,i)=>`<circle cx="600" cy="${y}" r="20" fill="var(--bg2)" stroke="var(--acc)" stroke-width="3"/><text x="600" y="${y+5}" text-anchor="middle" font-size="14" style="fill:var(--ink)">x${i+1}</text><line x1="620" y1="${y}" x2="752" y2="130" stroke="var(--a1)" stroke-width="2.5"/><text x="680" y="${(y+130)/2-6}" font-size="13" style="fill:var(--a1)">w${i+1}</text>`).join("")}
 <circle cx="790" cy="130" r="40" fill="var(--a1)" fill-opacity=".15" stroke="var(--a1)" stroke-width="3"/><text x="790" y="128" text-anchor="middle" font-size="18" style="fill:var(--ink)">Σ + b</text><text x="790" y="150" text-anchor="middle" font-size="14">φ(z)</text>
 <line x1="830" y1="130" x2="930" y2="130" stroke="var(--a2)" stroke-width="4"/><text x="945" y="135" font-size="16" style="fill:var(--ink)">ŷ</text></g></svg>
<div class="cols c4">
 <div class="card rv"><b>${L("Inputs x","Input x")}</b><p class="small">${L("Features: rain, level…","Ciri: hujan, paras…")}</p></div>
 <div class="card rv"><b>${L("Weights w","Pemberat w")}</b><p class="small">${L("Importance of each input (learned).","Kepentingan setiap input (dipelajari).")}</p></div>
 <div class="card rv"><b>${L("Bias b","Pincang b")}</b><p class="small">${L("Shifts the threshold.","Mengalihkan ambang.")}</p></div>
 <div class="card rv"><b>${L("Activation φ","Pengaktifan φ")}</b><p class="small">ŷ = φ(Σ w<sub>i</sub>x<sub>i</sub> + b)</p></div></div>
<div class="call warn rv"><b>${L("Caution","Awas")}</b>${L("The brain analogy is loose. Real neurons spike in time and adapt chemically; artificial ones are weighted sums.","Analogi otak hanya longgar. Neuron sebenar menghasilkan pancang mengikut masa dan menyesuaikan diri secara kimia; neuron buatan hanyalah hasil tambah berpemberat.")}</div>`});

/* 5 TIMELINE */
add({sec:S2,t:{en:"80 years of neural networks",bm:"80 tahun rangkaian neural"},html:`
<div class="kicker rv">🕰️ ${L("History","Sejarah")}</div><h2 class="rv">${L("Winters, springs and a Nobel Prize","Musim sejuk, musim bunga dan Hadiah Nobel")}</h2>
<div class="tl rv">
 <div class="ev"><div class="y">1943</div>${L("McCulloch &amp; Pitts: a logical neuron.","McCulloch &amp; Pitts: neuron logik.")}</div>
 <div class="ev"><div class="y">1958</div>${L("Rosenblatt's perceptron learns from examples.","Perseptron Rosenblatt belajar daripada contoh.")}</div>
 <div class="ev"><div class="y">1969</div>${L("Minsky &amp; Papert: a single layer can't do XOR → first AI winter.","Minsky &amp; Papert: satu lapisan tidak boleh XOR → musim sejuk AI pertama.")}</div>
 <div class="ev"><div class="y">1986</div>${L("Backpropagation popularised (Rumelhart, Hinton, Williams).","Rambatan balik dipopularkan (Rumelhart, Hinton, Williams).")}</div>
 <div class="ev"><div class="y">1997</div>${L("LSTM remembers long sequences.","LSTM mengingati jujukan panjang.")}</div>
 <div class="ev"><div class="y">2012</div>${L("Deep CNN wins ImageNet — the deep-learning boom.","CNN mendalam menang ImageNet — ledakan pembelajaran mendalam.")}</div>
 <div class="ev"><div class="y">2017</div>${L("Transformer: “attention is all you need”.","Transformer: “attention is all you need”.")}</div>
 <div class="ev now"><div class="y">2024</div>${L("Nobel Prize in Physics: Hopfield &amp; Hinton. KANs proposed.","Hadiah Nobel Fizik: Hopfield &amp; Hinton. KAN dicadangkan.")}</div>
 <div class="ev now"><div class="y">2025</div>${L("Small, on-device “liquid” foundation models (LFM2).","Model asas “cecair” kecil pada peranti (LFM2).")}</div></div>
<div class="call fact rv"><b>${L("Memorable","Mudah diingat")}</b>${L("The 2024 Nobel Prize in Physics went to Hopfield and Hinton “for foundational discoveries and inventions that enable machine learning with artificial neural networks”.","Hadiah Nobel Fizik 2024 dianugerahkan kepada Hopfield dan Hinton atas penemuan dan ciptaan asas yang membolehkan pembelajaran mesin dengan rangkaian neural buatan.")}</div>`});

/* 6 NEURON PLAYGROUND */
add({sec:S2,t:{en:"Neuron playground",bm:"Taman permainan neuron"},html:`
<div class="kicker rv">🧪 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Be the learning algorithm","Jadilah algoritma pembelajaran")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="np"></svg><div class="readout" id="npr"></div></div>
<div class="rv"><label class="ctrl"><span>${L("Target gate","Get sasaran")}</span><select id="ng"><option>AND</option><option>OR</option><option>NAND</option><option>XOR</option></select><span></span></label>
<label class="ctrl"><span>${L("Activation","Pengaktifan")}</span><select id="na"><option value="step">Step</option><option value="sigmoid">Sigmoid</option></select><span></span></label>
${slider("w1","w₁",-3,3,1,.1)}${slider("w2","w₂",-3,3,1,.1)}${slider("nb","b",-4,4,-.5,.1)}
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("Get 4/4 on AND, then OR, then NAND. Now try XOR. Why does no setting work?","Dapatkan 4/4 untuk AND, kemudian OR, kemudian NAND. Sekarang cuba XOR. Mengapa tiada tetapan yang berjaya?")}</div></div></div>`,
 notes:{en:"<p>A single neuron draws one straight line (w₁x₁ + w₂x₂ + b = 0). AND, OR and NAND can be separated by one line; XOR cannot — it is not linearly separable. This is the 1969 Minsky–Papert result in one picture.</p>",bm:"<p>Satu neuron melukis satu garis lurus (w₁x₁ + w₂x₂ + b = 0). AND, OR dan NAND boleh dipisahkan dengan satu garis; XOR tidak boleh — ia tidak boleh dipisahkan secara linear. Inilah hasil Minsky–Papert 1969 dalam satu gambar.</p>"},
 init(el){["ng","na"].forEach(i=>el.querySelector("#"+i).onchange=()=>this.show(el));bind(el,["w1","w2","nb"],()=>this.show(el))},
 show(el){const g=el.querySelector("#ng").value,a=ACT[el.querySelector("#na").value].f,w1=val(el,"w1"),w2=val(el,"w2"),b=val(el,"nb"),c=C();
  const P=plot(el.querySelector("#np"),{x0:-.3,x1:1.3,y0:-.3,y1:1.3,w:420,h:380,pad:{l:36,r:12,t:12,b:32}});P.clear();
  const N=28;for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=-.3+1.6*(i+.5)/N,y=-.3+1.6*(j+.5)/N,o=a(w1*x+w2*y+b);P.el("rect",{x:P.X(-.3+1.6*i/N),y:P.Y(-.3+1.6*(j+1)/N),width:P.X(1.6/N)-P.X(0)+.5,height:P.Y(0)-P.Y(1.6/N)+.5,fill:o>=.5?c.a2:c.a1,"fill-opacity":.12+.25*Math.abs(o-.5)})}
  P.axes("x₁","x₂",[0,1],[0,1]);if(Math.abs(w2)>1e-6)P.el("line",{x1:P.X(-.3),y1:P.Y((-b-w1*-.3)/w2),x2:P.X(1.3),y2:P.Y((-b-w1*1.3)/w2),stroke:c.ink,"stroke-width":2.5});
  let ok=0;PTS.forEach((p,k)=>{const t=GATES[g][k],o=a(w1*p[0]+w2*p[1]+b),pr=o>=.5?1:0;if(pr===t)ok++;P.el("circle",{cx:P.X(p[0]),cy:P.Y(p[1]),r:13,fill:t?c.a2:c.a1,stroke:pr===t?c.ok:c.bad,"stroke-width":4});P.el("text",{x:P.X(p[0]),y:P.Y(p[1])+5,"text-anchor":"middle","font-size":13,fill:"#fff","font-weight":700}).textContent=t});
  el.querySelector("#npr").innerHTML=`<span class="r"><b>z(1,1)</b>${(w1+w2+b).toFixed(2)}</span><span class="r" style="color:${ok===4?c.ok:c.bad}"><b>${tx("correct","betul")}</b>${ok}/4</span>${ok===4?`<span class="r">🎉 ${tx("solved","selesai")}</span>`:""}`}});

/* 7 ACTIVATIONS */
add({sec:S2,t:{en:"Activation functions",bm:"Fungsi pengaktifan"},html:`
<div class="kicker rv">📈 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("The bend that makes networks powerful","Lengkungan yang menjadikan rangkaian berkuasa")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="ac"></svg><label class="ctrl"><span>φ</span><select id="acs">${Object.entries(ACT).map(([k,v])=>`<option value="${k}" ${k==="relu"?"selected":""}>${v.n}</option>`).join("")}</select><span></span></label><label class="ctrl"><span>${L("Show derivative","Papar terbitan")}</span><input type="checkbox" id="acd" checked><span></span></label>${slider("acz","z",-5,5,1,.1)}<div class="readout" id="acr"></div></div>
<div class="rv"><table class="t small"><tr><th>φ</th><th>${L("Range","Julat")}</th><th>${L("Where you meet it","Di mana ditemui")}</th></tr>
<tr><td>Sigmoid</td><td>(0, 1)</td><td>${L("Output layer for probabilities","Lapisan output untuk kebarangkalian")}</td></tr><tr><td>tanh</td><td>(−1, 1)</td><td>${L("RNN/LSTM gates, small MLPs","Get RNN/LSTM, MLP kecil")}</td></tr>
<tr><td>ReLU</td><td>[0, ∞)</td><td>${L("Default for hidden layers; fast","Lalai untuk lapisan tersembunyi; pantas")}</td></tr><tr><td>GELU</td><td>≈ [−0.17, ∞)</td><td>${L("Transformers (BERT, GPT-style)","Transformer (gaya BERT, GPT)")}</td></tr></table>
<div class="call fact"><b>${L("Why non-linear?","Mengapa tidak linear?")}</b>${L("Stack 100 linear layers and you still get one linear map. Non-linearity lets depth matter.","Tindan 100 lapisan linear dan anda masih mendapat satu pemetaan linear. Ketaklinearan menjadikan kedalaman bermakna.")}</div>
<div class="call warn"><b>${L("Vanishing gradient","Kecerunan lenyap")}</b>${L("Sigmoid's derivative peaks at 0.25 — multiply many and learning stalls. ReLU's derivative is 1 for z &gt; 0.","Terbitan sigmoid memuncak pada 0.25 — darab banyak kali dan pembelajaran terhenti. Terbitan ReLU ialah 1 untuk z &gt; 0.")}</div></div></div>`,
 init(el){el.querySelector("#acs").onchange=()=>this.show(el);el.querySelector("#acd").onchange=()=>this.show(el);bind(el,["acz"],()=>this.show(el))},
 show(el){const k=el.querySelector("#acs").value,A=ACT[k],z=val(el,"acz"),c=C(),dv=el.querySelector("#acd").checked;const P=plot(el.querySelector("#ac"),{x0:-5,x1:5,y0:-1.2,y1:2.2,w:520,h:260});P.clear();P.axes("z","φ(z)",[-5,-2.5,0,2.5,5],[-1,0,1,2]);
  P.el("line",{x1:P.X(0),x2:P.X(0),y1:P.Y(-1.2),y2:P.Y(2.2),class:"gridl"});P.el("path",{d:P.path(x=>Math.max(-1.2,Math.min(2.2,A.f(x))),400),fill:"none",stroke:c.a1,"stroke-width":3});
  if(dv&&k!=="step")P.el("path",{d:P.path(x=>A.d(x),400),fill:"none",stroke:c.a2,"stroke-width":2,"stroke-dasharray":"5 4"});P.el("circle",{cx:P.X(z),cy:P.Y(Math.max(-1.2,Math.min(2.2,A.f(z)))),r:6,fill:c.acc});
  el.querySelector("#acr").innerHTML=`<span class="r" style="color:${c.a1}"><b>φ(${z})</b>${A.f(z).toFixed(3)}</span>${k!=="step"?`<span class="r" style="color:${c.a2}"><b>φ′(${z})</b>${A.d(z).toFixed(3)}</span>`:""}`}});

/* 8 PERCEPTRON LEARNING */
add({sec:S2,t:{en:"Perceptron learning rule",bm:"Peraturan pembelajaran perseptron"},html:`
<div class="kicker rv">🔁 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Learning = nudging weights after each mistake","Belajar = menolak pemberat selepas setiap kesilapan")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="pl"></svg><div class="readout" id="plr"></div></div>
<div class="rv"><p style="font-family:var(--fm);font-size:1.05rem;background:var(--chip);padding:10px;border-radius:12px">w ← w + η (t − ŷ) x<br>b ← b + η (t − ŷ)</p>
<label class="ctrl"><span>${L("Gate","Get")}</span><select id="pg"><option>AND</option><option>OR</option><option>XOR</option></select><span></span></label>${slider("pe","η",.05,1,.2,.05)}
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="pstep">▶ ${L("One example","Satu contoh")}</button><button class="btn" id="pep">⏩ ${L("One epoch","Satu epok")}</button><button class="btn" id="prs">↺ ${L("Reset","Set semula")}</button></div>
<div id="plog" class="small" style="font-family:var(--fm);margin-top:8px;max-height:150px;overflow:auto"></div>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("How many epochs until AND converges with η = 0.2? Run XOR for 20 epochs — what happens to the line?","Berapa epok sehingga AND menumpu dengan η = 0.2? Jalankan XOR selama 20 epok — apa berlaku pada garis?")}</div></div></div>`,
 init(el){const st=this.st={w:[0,0],b:0,k:0,ep:0,log:[]};const reset=()=>{st.w=[0,0];st.b=0;st.k=0;st.ep=0;st.log=[];this.show(el)};
  const step=()=>{const g=el.querySelector("#pg").value,eta=val(el,"pe"),p=PTS[st.k],t=GATES[g][st.k],y=st.w[0]*p[0]+st.w[1]*p[1]+st.b>=0?1:0,e=t-y;
   st.w=[st.w[0]+eta*e*p[0],st.w[1]+eta*e*p[1]];st.b+=eta*e;st.log.unshift(`x=(${p}) t=${t} ŷ=${y} ${e?"→ w=("+st.w.map(v=>v.toFixed(2))+") b="+st.b.toFixed(2):"✓"}`);st.k=(st.k+1)%4;if(!st.k)st.ep++;this.show(el)};
  el.querySelector("#pstep").onclick=step;el.querySelector("#pep").onclick=()=>{for(let i=0;i<4;i++)step()};el.querySelector("#prs").onclick=reset;el.querySelector("#pg").onchange=reset;bind(el,["pe"],()=>{})},
 show(el){const st=this.st;if(!st)return;const g=el.querySelector("#pg").value,c=C();const P=plot(el.querySelector("#pl"),{x0:-.3,x1:1.3,y0:-.3,y1:1.3,w:420,h:360,pad:{l:36,r:12,t:12,b:32}});P.clear();P.axes("x₁","x₂",[0,1],[0,1]);
  if(Math.abs(st.w[1])>1e-9)P.el("line",{x1:P.X(-.3),y1:P.Y((-st.b-st.w[0]*-.3)/st.w[1]),x2:P.X(1.3),y2:P.Y((-st.b-st.w[0]*1.3)/st.w[1]),stroke:c.ink,"stroke-width":2.5});else if(Math.abs(st.w[0])>1e-9){const x=-st.b/st.w[0];P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(-.3),y2:P.Y(1.3),stroke:c.ink,"stroke-width":2.5})}
  let ok=0;PTS.forEach((p,k)=>{const t=GATES[g][k],y=st.w[0]*p[0]+st.w[1]*p[1]+st.b>=0?1:0;if(y===t)ok++;P.el("circle",{cx:P.X(p[0]),cy:P.Y(p[1]),r:13,fill:t?c.a2:c.a1,stroke:y===t?c.ok:c.bad,"stroke-width":4,opacity:k===st.k?1:.75})});
  el.querySelector("#plr").innerHTML=`<span class="r"><b>${tx("epoch","epok")}</b>${st.ep}</span><span class="r"><b>w</b>(${st.w.map(v=>v.toFixed(2))})</span><span class="r"><b>b</b>${st.b.toFixed(2)}</span><span class="r" style="color:${ok===4?c.ok:c.bad}"><b>${tx("correct","betul")}</b>${ok}/4</span>`;el.querySelector("#plog").innerHTML=st.log.slice(0,12).join("<br>")}});

/* 9 MLP */
add({sec:S2,t:{en:"Multilayer perceptron",bm:"Perseptron berbilang lapisan"},html:`
<div class="kicker rv">🏗️ ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Hidden layers bend the space","Lapisan tersembunyi melentur ruang")}</h2>
<div class="cols c2" style="align-items:center"><div class="rv">${netSVG([2,2,1],480,250)}
<p class="center small muted">${L("input → hidden (OR, NAND) → output (AND) = XOR","input → tersembunyi (OR, NAND) → output (AND) = XOR")}</p></div>
<div class="rv"><div class="card"><b>${L("The XOR trick (memorable)","Helah XOR (mudah diingat)")}</b><p class="small">${L("XOR = OR <b>and</b> NAND. One hidden neuron learns OR, another learns NAND; the output neuron ANDs them.","XOR = OR <b>dan</b> NAND. Satu neuron tersembunyi mempelajari OR, satu lagi NAND; neuron output menggabungkannya dengan AND.")}</p></div>
<div class="call fact"><b>${L("Universal approximation","Penghampiran sejagat")}</b>${L("One hidden layer with enough neurons can approximate any continuous function on a bounded region (Hornik et al., 1989). Depth makes it efficient.","Satu lapisan tersembunyi dengan neuron mencukupi boleh menghampiri sebarang fungsi selanjar pada kawasan terbatas (Hornik et al., 1989). Kedalaman menjadikannya cekap.")}</div>
<table class="t small"><tr><th>${L("Term","Istilah")}</th><th>${L("Meaning","Maksud")}</th></tr><tr><td>${L("Layer","Lapisan")}</td><td>${L("A set of neurons computed together","Set neuron yang dikira bersama")}</td></tr><tr><td>${L("Parameters","Parameter")}</td><td>${L("All weights + biases (2-2-1 has 9)","Semua pemberat + pincang (2-2-1 ada 9)")}</td></tr><tr><td>${L("Epoch","Epok")}</td><td>${L("One pass over the training set","Satu laluan atas set latihan")}</td></tr></table></div></div>`});

/* 10 FORWARD PASS */
add({sec:S2,t:{en:"Forward pass by hand",bm:"Hantaran ke hadapan secara manual"},html:`
<div class="kicker rv">✍️ ${L("Trace it","Jejaknya")}</div><h2 class="rv">${L("XOR network: compute every number","Rangkaian XOR: kira setiap nombor")}</h2>
<div class="cols c2"><div class="rv"><div class="card small" style="font-family:var(--fm)">h₁ = σ(20x₁ + 20x₂ − 10) &nbsp; ← OR<br>h₂ = σ(−20x₁ − 20x₂ + 30) &nbsp; ← NAND<br>ŷ = σ(20h₁ + 20h₂ − 30) &nbsp; ← AND</div>
<table class="t" id="fwt" style="margin-top:10px"><tr><th>x₁ x₂</th><th>z₁ → h₁</th><th>z₂ → h₂</th><th>z₃ → ŷ</th></tr></table>
<button class="btn pri" id="fwb" style="margin-top:10px">${L("Reveal next row","Dedahkan baris seterusnya")} ▶</button></div>
<div class="rv"><div class="call fact"><b>${L("What to notice","Apa yang perlu diperhati")}</b>${L("σ(10) ≈ 0.99995 and σ(−10) ≈ 0.00005: large weights make sigmoids behave like switches, turning the MLP into logic gates.","σ(10) ≈ 0.99995 dan σ(−10) ≈ 0.00005: pemberat besar menjadikan sigmoid bertindak seperti suis, menukar MLP kepada get logik.")}</div>
<div class="call tip"><b>${L("Variation · harder","Variasi · lebih sukar")}</b>${L("Halve every weight and bias. Recompute (1,0). Does the network still answer correctly? What does that tell you about confidence?","Separuhkan setiap pemberat dan pincang. Kira semula (1,0). Adakah rangkaian masih menjawab dengan betul? Apa maksudnya tentang keyakinan?")}</div>
<p class="rv"><a class="btn" href="deck-ann-math.html#s7">∑ ${L("Maths deep dive: forward pass in matrix form","Pendalaman matematik: hantaran ke hadapan dalam bentuk matriks")} →</a></p><div class="call tip"><b>${L("Variation · perspective","Variasi · perspektif")}</b>${L("A trained network rarely has such tidy weights. Why would explaining a learned network be harder than this one?","Rangkaian terlatih jarang mempunyai pemberat sekemas ini. Mengapa menerangkan rangkaian yang dipelajari lebih sukar berbanding yang ini?")}</div></div></div>`,
 init(el){let i=0;const tb=el.querySelector("#fwt"),btn=el.querySelector("#fwb");btn.onclick=()=>{if(i>=4){i=0;tb.querySelectorAll("tr.r").forEach(r=>r.remove());return}const [a,b]=PTS[i];const z1=20*a+20*b-10,z2=-20*a-20*b+30,h1=sig(z1),h2=sig(z2),z3=20*h1+20*h2-30,y=sig(z3);
  tb.insertAdjacentHTML("beforeend",`<tr class="r rv" style="--i:0"><td>${a} ${b}</td><td>${z1} → ${h1.toFixed(3)}</td><td>${z2} → ${h2.toFixed(3)}</td><td>${z3.toFixed(2)} → <b>${y.toFixed(3)}</b></td></tr>`);i++;if(i===4)btn.innerHTML="↺"}}});

/* 11 LOSS */
add({sec:S2,t:{en:"Loss functions",bm:"Fungsi kerugian"},html:`
<div class="kicker rv">📉 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("How wrong is wrong?","Sejauh mana salah itu salah?")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="ls"></svg>${slider("lp",L("Predicted probability of flood ŷ (true label = flood)","Kebarangkalian banjir diramal ŷ (label sebenar = banjir)"),.01,.99,.7,.01)}<div class="readout" id="lsr"></div></div>
<div class="rv"><table class="t"><tr><th>${L("Task","Tugasan")}</th><th>${L("Loss","Kerugian")}</th><th>${L("Formula","Formula")}</th></tr>
<tr><td>${L("Regression (river level)","Regresi (paras sungai)")}</td><td>MSE</td><td>(1/n) Σ (y − ŷ)²</td></tr>
<tr><td>${L("Classification (flood / no flood)","Klasifikasi (banjir / tiada)")}</td><td>${L("Cross-entropy","Entropi silang")}</td><td>−[y log ŷ + (1−y) log(1−ŷ)]</td></tr></table>
<div class="call fact"><b>${L("Feel the difference","Rasai perbezaannya")}</b>${L("Slide ŷ towards 0.01: cross-entropy explodes, MSE stays below 1. Confident wrong answers are punished hard — usually what we want for warnings.","Leret ŷ ke arah 0.01: entropi silang meletup, MSE kekal bawah 1. Jawapan salah yang yakin dihukum berat — biasanya itulah yang kita mahu untuk amaran.")}</div></div></div>`,
 init(el){bind(el,["lp"],()=>this.show(el))},
 show(el){const p=val(el,"lp"),c=C();const P=plot(el.querySelector("#ls"),{x0:0,x1:1,y0:0,y1:5,w:520,h:240});P.clear();P.axes("ŷ",tx("loss","kerugian"),[0,.25,.5,.75,1],[0,1,2,3,4,5]);
  P.el("path",{d:P.path(x=>Math.min(5,-Math.log(Math.max(x,1e-3))),300,.005,1),fill:"none",stroke:c.a1,"stroke-width":3});P.el("path",{d:P.path(x=>(1-x)**2),fill:"none",stroke:c.a2,"stroke-width":3,"stroke-dasharray":"6 4"});
  P.el("line",{x1:P.X(p),x2:P.X(p),y1:P.Y(0),y2:P.Y(5),stroke:c.ink,"stroke-dasharray":"3 3"});
  el.querySelector("#lsr").innerHTML=`<span class="r" style="color:${c.a1}"><b>${tx("cross-entropy","entropi silang")}</b>${(-Math.log(p)).toFixed(3)}</span><span class="r" style="color:${c.a2}"><b>MSE</b>${((1-p)**2).toFixed(3)}</span>`}});

/* 12 GRADIENT DESCENT */
add({sec:S2,t:{en:"Gradient descent",bm:"Penurunan kecerunan"},html:`
<div class="kicker rv">⛰️ ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Walk downhill — but how big a step?","Berjalan menuruni bukit — tetapi sebesar mana langkahnya?")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="gd"></svg><div class="readout" id="gdr"></div></div>
<div class="rv"><p style="font-family:var(--fm);background:var(--chip);padding:10px;border-radius:12px">w ← w − η · ∂L/∂w</p>
<label class="ctrl"><span>${L("Landscape","Landskap")}</span><select id="gds"><option value="c">${OL("Convex bowl","Mangkuk cembung")}</option><option value="b">${OL("Bumpy (local minima)","Berbonggol (minimum setempat)")}</option></select><span></span></label>
${slider("geta",L("Learning rate η","Kadar pembelajaran η"),.02,1.1,.2,.02)}${slider("gw0",L("Start w","w mula"),-4,6,-3,.1)}
<div style="display:flex;gap:8px"><button class="btn" id="gst">▶ ${L("Step","Langkah")}</button><button class="btn" id="g10">⏩ ×10</button><button class="btn" id="grs">↺</button></div>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("Find an η that overshoots and oscillates, and one that diverges. On the bumpy landscape, which start points get trapped?","Cari η yang terlajak dan berayun, dan satu yang mencapah. Pada landskap berbonggol, titik mula mana yang terperangkap?")}</div>
<div class="call fact"><b>${L("Link to L6","Kaitan dengan L6")}</b>${L("Same idea as the gradient descent you met with simulated annealing — local search on the loss surface. Optimisers like Adam adapt η per weight.","Idea sama seperti penurunan kecerunan bersama penyepuhlindapan simulasi — carian setempat pada permukaan kerugian. Pengoptimum seperti Adam menyesuaikan η bagi setiap pemberat.")}</div></div></div>`,
 init(el){const st=this.st={path:[]};const F=()=>el.querySelector("#gds").value==="c"?{f:w=>.5*(w-2)**2,d:w=>w-2}:{f:w=>.5*(w-2)**2/2+Math.sin(2.2*w)*1.2+1.2,d:w=>(w-2)/2+2.64*Math.cos(2.2*w)};this.F=F;
  const reset=()=>{st.path=[val(el,"gw0")];this.show(el)};const step=n=>{const f=F();for(let i=0;i<n;i++){const w=st.path[st.path.length-1];const nw=w-val(el,"geta")*f.d(w);st.path.push(Math.max(-50,Math.min(50,nw)))}this.show(el)};
  el.querySelector("#gst").onclick=()=>step(1);el.querySelector("#g10").onclick=()=>step(10);el.querySelector("#grs").onclick=reset;el.querySelector("#gds").onchange=reset;bind(el,["geta"],()=>{});bind(el,["gw0"],reset)},
 show(el){if(!this.st)return;const f=this.F(),c=C(),pth=this.st.path;const P=plot(el.querySelector("#gd"),{x0:-4,x1:6,y0:0,y1:13,w:520,h:280});P.clear();P.axes("w","L(w)",[-4,-2,0,2,4,6],[0,4,8,12]);
  P.el("path",{d:P.path(w=>Math.min(13,f.f(w)),400),fill:"none",stroke:c.a1,"stroke-width":3});
  let d="";pth.forEach((w,i)=>{if(w<-4||w>6)return;d+=(d?"L":"M")+P.X(w)+","+P.Y(Math.min(13,f.f(w)))});if(d)P.el("path",{d,fill:"none",stroke:c.a2,"stroke-width":1.5});
  pth.forEach((w,i)=>{if(w<-4||w>6)return;P.el("circle",{cx:P.X(w),cy:P.Y(Math.min(13,f.f(w))),r:i===pth.length-1?7:4,fill:i===pth.length-1?c.acc:c.a2})});
  const w=pth[pth.length-1];el.querySelector("#gdr").innerHTML=`<span class="r"><b>${tx("steps","langkah")}</b>${pth.length-1}</span><span class="r"><b>w</b>${w.toFixed(3)}</span><span class="r"><b>L</b>${f.f(w).toFixed(3)}</span><span class="r"><b>∂L/∂w</b>${f.d(w).toFixed(3)}</span>${Math.abs(w)>=50?`<span class="r" style="color:${c.bad}">${tx("diverged!","mencapah!")}</span>`:""}`}});

/* 13 BACKPROP */
add({sec:S2,t:{en:"Backpropagation",bm:"Rambatan balik"},html:`
<div class="kicker rv">🔙 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Blame flows backwards through the chain rule","Kesalahan mengalir ke belakang melalui petua rantai")}</h2>
<div class="cols c2"><div class="rv"><svg viewBox="0 0 520 170" style="width:100%">
 ${[["x = 2",40],["z = wx+b",160],["ŷ = σ(z)",290],["L = (ŷ−t)²",420]].map((b,i)=>`<rect x="${b[1]-50}" y="40" width="${i===0?80:110}" height="46" rx="12" fill="var(--bg2)" stroke="var(--a1)" stroke-width="2.5"/><text x="${b[1]+(i===0?-10:5)}" y="69" text-anchor="middle" font-size="14" style="fill:var(--ink)">${b[0]}</text>`).join("")}
 <path d="M75 63 H105 M220 63 H235 M350 63 H365" stroke="var(--a1)" stroke-width="3"/>
 <path d="M470 110 C 400 150, 200 150, 120 110" stroke="var(--a2)" stroke-width="3" fill="none" class="dash"/><text x="290" y="160" text-anchor="middle" font-size="13" style="fill:var(--a2)">∂L/∂w = ∂L/∂ŷ · ∂ŷ/∂z · ∂z/∂w</text></svg>
<table class="t small"><tr><th>${L("Quantity","Kuantiti")}</th><th>${L("Value","Nilai")}</th></tr>
<tr><td>z = 0.5·2 + 0</td><td>1.000</td></tr><tr><td>ŷ = σ(1)</td><td>0.731</td></tr><tr><td>L = (0.731 − 1)²</td><td>0.072</td></tr>
<tr><td>∂L/∂ŷ = 2(ŷ − t)</td><td>−0.538</td></tr><tr><td>∂ŷ/∂z = ŷ(1 − ŷ)</td><td>0.197</td></tr><tr><td>∂z/∂w = x</td><td>2</td></tr><tr><td><b>∂L/∂w</b></td><td><b>−0.212</b></td></tr></table></div>
<div class="rv"><div class="card"><b>${L("One update (η = 0.5)","Satu kemas kini (η = 0.5)")}</b><p class="small" style="font-family:var(--fm)">w ← 0.5 − 0.5·(−0.212) = 0.606<br>b ← 0 − 0.5·(−0.106) = 0.053<br>${L("new","baharu")} ŷ = σ(1.264) = 0.780 · L = 0.049 ↓</p></div>
<div class="call fact"><b>${L("The big idea","Idea besar")}</b>${L("Backprop reuses each layer's local derivative, so all gradients cost about as much as one extra forward pass. That efficiency made deep learning possible.","Rambatan balik menggunakan semula terbitan setempat setiap lapisan, jadi semua kecerunan berkos lebih kurang satu hantaran ke hadapan tambahan. Kecekapan itulah yang memungkinkan pembelajaran mendalam.")}</div>
<p class="rv"><a class="btn" href="deck-ann-math.html#s10">∑ ${L("Maths deep dive: every gradient of a 2-2-1 network","Pendalaman matematik: setiap kecerunan rangkaian 2-2-1")} →</a></p><div class="call tip"><b>${L("Check yourself","Semak diri")}</b>${L("Why did the loss fall from 0.072 to 0.049? Which sign told the weight to grow?","Mengapa kerugian turun daripada 0.072 kepada 0.049? Tanda mana yang memberitahu pemberat untuk meningkat?")}</div></div></div>`,
 notes:{en:"<p>Given x = 2, target t = 1, w = 0.5, b = 0, sigmoid output and squared loss. ∂L/∂b = ∂L/∂ŷ · ∂ŷ/∂z = −0.106. All numbers were verified in Python.</p>",bm:"<p>Diberi x = 2, sasaran t = 1, w = 0.5, b = 0, output sigmoid dan kerugian kuasa dua. ∂L/∂b = ∂L/∂ŷ · ∂ŷ/∂z = −0.106. Semua nombor disahkan dalam Python.</p>"}});

/* 14 LIVE TRAINER */
function makeData(kind,n,noise,seed){const r=rng(seed),X=[],Y=[];for(let i=0;i<n;i++){let x,y,l;
  if(kind==="xor"){x=r()*2-1;y=r()*2-1;l=x*y>0?1:0}else if(kind==="circle"){x=r()*2-1;y=r()*2-1;l=x*x+y*y<.42?1:0}else if(kind==="linear"){x=r()*2-1;y=r()*2-1;l=y>.5*x+.1?1:0}
  else{const a=r()*Math.PI,c=i%2;l=c;x=c?1-Math.cos(a)-.5:Math.cos(a)-.5;y=c?.3-Math.sin(a)+.25:Math.sin(a)-.25;x*=.9;y*=.9}
  X.push([x+gauss(r)*noise,y+gauss(r)*noise]);Y.push(l)}return {X,Y}}
function MLP(H,act,seed){const r=rng(seed),A=ACT[act];const W1=[...Array(H)].map(()=>[gauss(r)*.8,gauss(r)*.8]),b1=Array(H).fill(0),W2=[...Array(H)].map(()=>gauss(r)*.8);let b2=0;
  const fwd=x=>{const z=W1.map((w,j)=>w[0]*x[0]+w[1]*x[1]+b1[j]),h=z.map(A.f);return {z,h,o:sig(h.reduce((s,v,j)=>s+v*W2[j],b2))}};
  const train=(X,Y,lr)=>{const gW1=W1.map(()=>[0,0]),gb1=Array(H).fill(0),gW2=Array(H).fill(0);let gb2=0,loss=0;const n=X.length;
   X.forEach((x,i)=>{const {z,h,o}=fwd(x),y=Y[i];loss+=-(y*Math.log(o+1e-9)+(1-y)*Math.log(1-o+1e-9));const d=o-y;gb2+=d;h.forEach((v,j)=>{gW2[j]+=d*v;const dh=d*W2[j]*A.d(z[j]);gW1[j][0]+=dh*x[0];gW1[j][1]+=dh*x[1];gb1[j]+=dh})});
   for(let j=0;j<H;j++){W2[j]-=lr*gW2[j]/n;W1[j][0]-=lr*gW1[j][0]/n;W1[j][1]-=lr*gW1[j][1]/n;b1[j]-=lr*gb1[j]/n}b2-=lr*gb2/n;return loss/n};
  return {fwd,train}}
add({sec:S3,t:{en:"Live network trainer",bm:"Pelatih rangkaian langsung"},html:`
${dt([3,4])}<div class="kicker rv">🧪 ${L("Instrument","Instrumen")} · ${L("no code","tanpa kod")}</div><h2 class="rv" style="margin-bottom:6px">${L("Train a network in your browser","Latih rangkaian dalam pelayar anda")}</h2>
<div class="cols c2"><div class="sim rv"><canvas id="lt" width="360" height="360" style="max-width:420px;margin:auto;border-radius:12px"></canvas><svg id="ltl"></svg></div>
<div class="rv"><label class="ctrl"><span>${L("Dataset","Set data")}</span><select id="lds"><option value="xor">XOR</option><option value="circle">${OL("Circle","Bulatan")}</option><option value="moons">${OL("Two moons","Dua bulan sabit")}</option><option value="linear">${OL("Linear","Linear")}</option></select><span></span></label>
<label class="ctrl"><span>${L("Hidden activation","Pengaktifan tersembunyi")}</span><select id="lac"><option value="tanh">tanh</option><option value="relu">ReLU</option><option value="sigmoid">Sigmoid</option></select><span></span></label>
${slider("lh",L("Hidden neurons","Neuron tersembunyi"),1,12,4)}${slider("llr",L("Learning rate","Kadar pembelajaran"),.05,3,.8,.05)}${slider("lno",L("Noise (ralat)","Ralat (noise)"),0,.4,.08,.02)}
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="lgo">▶ ${L("Train","Latih")}</button><button class="btn" id="lrs">↺ ${L("New weights","Pemberat baharu")}</button></div><div class="readout" id="ltr"></div>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("(1) Smallest hidden layer that solves the circle? (2) Set η = 3 — what happens to the loss curve? (3) Raise noise to 0.3 with 12 neurons: is a wiggly boundary “better”?","(1) Lapisan tersembunyi terkecil yang menyelesaikan bulatan? (2) Tetapkan η = 3 — apa berlaku pada lengkung kerugian? (3) Naikkan ralat ke 0.3 dengan 12 neuron: adakah sempadan berliku “lebih baik”?")}</div></div></div>`,
 notes:{en:"<p>A real 2–H–1 network: hidden activation of your choice, sigmoid output, binary cross-entropy, full-batch gradient descent on 200 points. Colours show the predicted probability; dots are training data. Seeds are fixed, so results are reproducible.</p>",bm:"<p>Rangkaian 2–H–1 sebenar: pengaktifan tersembunyi pilihan anda, output sigmoid, entropi silang binari, penurunan kecerunan kelompok penuh pada 200 titik. Warna menunjukkan kebarangkalian ramalan; titik ialah data latihan. Benih ditetapkan, jadi keputusan boleh dihasilkan semula.</p>"},
 init(el){const st=this.st={run:false,seed:7,ep:0,hist:[]};const rebuild=()=>{st.data=makeData(el.querySelector("#lds").value,200,val(el,"lno"),11);st.net=MLP(val(el,"lh"),el.querySelector("#lac").value,st.seed);st.ep=0;st.hist=[];this.show(el)};this.rebuild=rebuild;
  el.querySelector("#lgo").onclick=()=>{st.run=!st.run;el.querySelector("#lgo").innerHTML=st.run?"⏸ "+tx("Pause","Jeda"):"▶ "+tx("Train","Latih");if(st.run)loop()};
  el.querySelector("#lrs").onclick=()=>{st.seed++;rebuild()};["lds","lac"].forEach(i=>el.querySelector("#"+i).onchange=rebuild);bind(el,["lh","lno"],rebuild);bind(el,["llr"],()=>{});
  const loop=()=>{if(!st.run||!el.classList.contains("on")){st.run=false;el.querySelector("#lgo").innerHTML="▶ "+tx("Train","Latih");return}for(let i=0;i<15;i++){st.hist.push(st.net.train(st.data.X,st.data.Y,val(el,"llr")));st.ep++}this.show(el);if(st.ep<4000)requestAnimationFrame(loop);else{st.run=false}};rebuild()},
 show(el){const st=this.st;if(!st||!st.net)return;const c=C(),cv=el.querySelector("#lt"),g=cv.getContext("2d"),S=360,N=60;const hex=h=>{const m=h.replace("#","");const v=m.length===3?m.split("").map(x=>x+x).join(""):m;return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16))};
  const A1=hex(c.a1||"#4c6ef5"),A2=hex(c.a2||"#12b886");for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=-1.2+2.4*(i+.5)/N,y=1.2-2.4*(j+.5)/N,o=st.net.fwd([x,y]).o;const col=A1.map((v,k)=>Math.round(v*(1-o)+A2[k]*o));g.fillStyle=`rgba(${col},0.55)`;g.fillRect(i*S/N,j*S/N,S/N+1,S/N+1)}
  let ok=0;st.data.X.forEach((p,i)=>{const y=st.data.Y[i],pr=st.net.fwd(p).o>=.5?1:0;if(pr===y)ok++;g.beginPath();g.arc((p[0]+1.2)/2.4*S,(1.2-p[1])/2.4*S,4,0,7);g.fillStyle=y?c.a2:c.a1;g.fill();g.lineWidth=1.5;g.strokeStyle="#fff";g.stroke()});
  const h=st.hist,mx=Math.max(.8,...h.slice(0,5));const P=plot(el.querySelector("#ltl"),{x0:0,x1:Math.max(100,h.length),y0:0,y1:mx,w:420,h:130,pad:{l:36,r:26,t:8,b:26}});P.clear();P.axes(tx("epoch","epok"),tx("loss","kerugian"),[0,Math.max(100,h.length)],[0,+mx.toFixed(1)]);
  if(h.length>1)P.el("path",{d:h.map((v,i)=>(i?"L":"M")+P.X(i)+","+P.Y(Math.min(mx,v))).join(""),fill:"none",stroke:c.a1,"stroke-width":2});
  el.querySelector("#ltr").innerHTML=`<span class="r"><b>${tx("epoch","epok")}</b>${st.ep}</span><span class="r"><b>${tx("loss","kerugian")}</b>${h.length?h[h.length-1].toFixed(3):"—"}</span><span class="r"><b>${tx("train accuracy","ketepatan latihan")}</b>${(ok/st.data.X.length*100).toFixed(0)}%</span>`}});

/* 15 OVERFITTING */
add({sec:S3,t:{en:"Generalisation & overfitting",bm:"Pengitlakan & lebih suai"},html:`
<div class="kicker rv">🎯 ${L("Practice","Amalan")}</div><h2 class="rv">${L("Memorising is not learning","Menghafal bukan belajar")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="of"></svg>${slider("ofc",L("Model capacity (neurons)","Kapasiti model (neuron)"),1,10,6)}<div class="readout" id="ofr"></div><p class="small muted">${L("Illustrative curves — shapes typical of real training runs.","Lengkung ilustrasi — bentuk lazim larian latihan sebenar.")}</p></div>
<div class="rv"><table class="t small"><tr><th>${L("Practice","Amalan")}</th><th>${L("Why","Mengapa")}</th></tr>
<tr><td>${L("Split train / validation / test (e.g. 70/15/15)","Bahagi latihan / pengesahan / ujian (cth. 70/15/15)")}</td><td>${L("Test data is the exam — never study from it.","Data ujian ialah peperiksaan — jangan belajar daripadanya.")}</td></tr>
<tr><td>${L("Split by time for forecasts","Bahagi mengikut masa untuk ramalan")}</td><td>${L("Train on 2015–2022, test on 2023–2024; random splits leak the future.","Latih pada 2015–2022, uji pada 2023–2024; pembahagian rawak membocorkan masa depan.")}</td></tr>
<tr><td>${L("Fit scaling on training data only","Muatkan penskalaan pada data latihan sahaja")}</td><td>${L("Otherwise test statistics leak in.","Jika tidak, statistik ujian bocor masuk.")}</td></tr>
<tr><td>${L("Early stopping, dropout, weight decay","Henti awal, dropout, susutan pemberat")}</td><td>${L("Regularise to keep the model simple.","Regularisasi supaya model kekal ringkas.")}</td></tr>
<tr><td>${L("More (representative) data","Lebih banyak data (mewakili)")}</td><td>${L("Include rare extreme storms, not just ordinary days.","Sertakan ribut ekstrem yang jarang, bukan hari biasa sahaja.")}</td></tr></table></div></div>`,
 init(el){bind(el,["ofc"],()=>this.show(el))},
 show(el){const k=val(el,"ofc"),c=C();const tr=e=>.9*Math.exp(-e/(14-k))+.02+.25/(k*k),va=e=>tr(e)+.002*e*Math.max(0,k-4)**1.3+.05;const P=plot(el.querySelector("#of"),{x0:0,x1:100,y0:0,y1:1.1,w:520,h:240});P.clear();P.axes(tx("epoch","epok"),tx("loss","kerugian"),[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.path(tr),fill:"none",stroke:c.a1,"stroke-width":3});P.el("path",{d:P.path(va),fill:"none",stroke:c.a2,"stroke-width":3,"stroke-dasharray":"6 4"});
  let be=0,bv=9;for(let e=0;e<=100;e++)if(va(e)<bv){bv=va(e);be=e}P.el("line",{x1:P.X(be),x2:P.X(be),y1:P.Y(0),y2:P.Y(1.1),stroke:c.acc,"stroke-width":2});P.el("text",{x:P.X(be)+4,y:P.Y(1),"font-size":12,fill:c.acc}).textContent=tx("early stop","henti awal");
  el.querySelector("#ofr").innerHTML=`<span class="r" style="color:${c.a1}"><b>${tx("training","latihan")}</b>${tr(100).toFixed(3)}</span><span class="r" style="color:${c.a2}"><b>${tx("validation","pengesahan")}</b>${va(100).toFixed(3)}</span><span class="r"><b>${tx("diagnosis","diagnosis")}</b>${k<=2?tx("underfitting","kurang suai"):va(100)-bv>.05?tx("overfitting — stop early","lebih suai — henti awal"):tx("good fit","padanan baik")}</span>`}});

/* 16 HYPERPARAMS */
add({sec:S3,t:{en:"Hyperparameter cheat sheet",bm:"Helaian ringkas hiperparameter"},html:`
<div class="kicker rv">🎛️ ${L("Reference","Rujukan")}</div><h2 class="rv">${L("Knobs you will turn","Tombol yang akan anda putar")}</h2>
<table class="t rv"><tr><th>${L("Hyperparameter","Hiperparameter")}</th><th>${L("Start with","Mulakan dengan")}</th><th>${L("If loss…","Jika kerugian…")}</th></tr>
<tr><td>${L("Learning rate","Kadar pembelajaran")}</td><td>0.001 (Adam) · 0.01–0.1 (SGD)</td><td>${L("explodes → lower it; crawls → raise it","meletup → turunkan; merangkak → naikkan")}</td></tr>
<tr><td>${L("Hidden layers / neurons","Lapisan / neuron tersembunyi")}</td><td>1–2 · 8–64</td><td>${L("train high → bigger; val ≫ train → smaller","latihan tinggi → besarkan; pengesahan ≫ latihan → kecilkan")}</td></tr>
<tr><td>${L("Batch size","Saiz kelompok")}</td><td>32</td><td>${L("noisy → larger batch","bising → kelompok lebih besar")}</td></tr>
<tr><td>${L("Epochs","Epok")}</td><td>${L("until early stopping triggers","sehingga henti awal dicetuskan")}</td><td>—</td></tr>
<tr><td>Dropout · weight decay</td><td>0.1–0.3 · 1e-4</td><td>${L("overfitting → increase","lebih suai → tingkatkan")}</td></tr>
<tr><td>${L("Activation","Pengaktifan")}</td><td>ReLU ${L("hidden","tersembunyi")} · sigmoid/softmax ${L("output","output")}</td><td>${L("dead ReLUs → Leaky ReLU/GELU","ReLU mati → Leaky ReLU/GELU")}</td></tr></table>
<div class="call new rv"><b>${L("Now","Terkini")}</b>${L("AutoML tools and AI assistants can propose a search plan for hyperparameters — but keep the test set locked until the very end.","Alat AutoML dan pembantu AI boleh mencadangkan pelan carian hiperparameter — tetapi kunci set ujian sehingga akhir.")}</div>`});

/* 16b FEATURE SCALING */
add({sec:S3,t:{en:"Why we scale features",bm:"Mengapa ciri diskalakan"},html:`
<div class="kicker rv">📐 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Unscaled features turn the loss into a ravine","Ciri tidak berskala menukar kerugian menjadi gaung")}</h2>
<div class="cols c2"><div class="sim rv"><canvas id="fsc" width="460" height="300" style="width:100%;border-radius:12px"></canvas><div class="readout" id="fsr"></div></div>
<div class="rv"><label class="ctrl"><span>${L("Scaling","Penskalaan")}</span><select id="fss"><option value="raw">${OL("none (raw units)","tiada (unit asal)")}</option><option value="mm">${OL("min–max to [0, 1]","min–maks ke [0, 1]")}</option><option value="z">${OL("z-score (mean 0, sd 1)","skor-z (min 0, sp 1)")}</option></select><span></span></label>${slider("fseta",L("log₁₀ η","log₁₀ η"),-4,0,-1.5,.1)}
<table class="t small"><tr><th>${L("Feature","Ciri")}</th><th>${L("raw range","julat asal")}</th><th>${L("formula","formula")}</th></tr><tr><td>${L("rain (mm/h)","hujan (mm/j)")}</td><td>0–100</td><td class="mono">(x − min)/(max − min)</td></tr><tr><td>${L("catchment area (ha)","luas tadahan (ha)")}</td><td>0–5000</td><td class="mono">(x − μ)/σ</td></tr></table>
<p class="small">${L("With raw units, one weight needs tiny steps and the other huge ones; a single learning rate can't serve both, so GD zig-zags or crawls. After scaling, the contours are round and GD walks straight to the minimum.","Dengan unit asal, satu pemberat memerlukan langkah kecil dan satu lagi langkah besar; satu kadar pembelajaran tidak dapat memenuhi kedua-duanya, jadi PK bergerak zig-zag atau merangkak. Selepas penskalaan, kontur menjadi bulat dan PK terus ke minimum.")}</p>
<div class="call warn"><b>${L("Leakage reminder","Peringatan kebocoran")}</b>${L("Compute min, max, μ and σ on the training split only, then apply them unchanged to validation and test data.","Kira min, maks, μ dan σ pada bahagian latihan sahaja, kemudian gunakan tanpa ubah pada data pengesahan dan ujian.")}</div></div></div>`,
 init(el){el.querySelector("#fss").onchange=()=>this.show(el);bind(el,["fseta"],()=>this.show(el))},
 show(el){const m=el.querySelector("#fss").value,eta=10**val(el,"fseta"),cv=el.querySelector("#fsc"),g=cv.getContext("2d"),W=460,H=300;const a=m==="raw"?60:m==="mm"?1.6:1,b=1;const f=(x,y)=>.5*(a*x*x+b*y*y);
  const dark=document.documentElement.dataset.theme==="dark";const img=g.createImageData(W,H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=-3+6*i/W,y=2-4*j/H,v=Math.log1p(f(x,y)),band=(v*3)%1<.07;const k=(j*W+i)*4,s=Math.min(1,v/5);const base=dark?[25+40*s,30+30*s,50+60*(1-s)]:[236-60*s,240-40*s,250-90*s];img.data[k]=base[0]-(band?40:0);img.data[k+1]=base[1]-(band?40:0);img.data[k+2]=base[2]-(band?30:0);img.data[k+3]=255}g.putImageData(img,0,0);
  let x=-2.6,y=1.6,ok=true;const X=v=>(v+3)/6*W,Y=v=>(2-v)/4*H;g.strokeStyle="#e03131";g.lineWidth=2.2;g.beginPath();g.moveTo(X(x),Y(y));let n=0;for(;n<60;n++){x-=eta*a*x;y-=eta*b*y;if(!isFinite(x)||Math.abs(x)>50){ok=false;break}g.lineTo(X(Math.max(-3.2,Math.min(3.2,x))),Y(Math.max(-2.2,Math.min(2.2,y))))}g.stroke();g.fillStyle="#fff";g.beginPath();g.arc(X(0),Y(0),5,0,7);g.fill();
  el.querySelector("#fsr").innerHTML=`<span class="r"><b>${tx("curvature ratio","nisbah kelengkungan")}</b>${a.toFixed(1)} : 1</span><span class="r"><b>${tx("after 60 steps","selepas 60 langkah")}</b>${ok?"L = "+f(x,y).toExponential(1):tx("diverged","mencapah")}</span><span class="r"><b>${tx("max stable η","η stabil maks")}</b>${(2/Math.max(a,b)).toPrecision(2)}</span>`}});

/* 16c TIME SERIES WINDOWS */
add({sec:S3,t:{en:"Sequences: windows, RNNs and LSTMs",bm:"Jujukan: tetingkap, RNN dan LSTM"},html:`
<div class="kicker rv">⏳ ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("Turning a river record into training examples","Menukar rekod sungai kepada contoh latihan")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="tsv"></svg>${slider("tsw",L("Window length (hours of history)","Panjang tetingkap (jam sejarah)"),2,24,6)}${slider("tsh",L("Forecast horizon (hours ahead)","Ufuk ramalan (jam ke hadapan)"),1,12,3)}${slider("tsp",L("Slide the window","Gelongsor tetingkap"),0,60,20)}<div class="readout" id="tsr"></div></div>
<div class="rv"><div class="card small"><b>${L("Three ways to use the window","Tiga cara menggunakan tetingkap")}</b><ul class="tight"><li><b>MLP</b> — ${L("flatten the window into one input vector (Lab B1 used 2 lags).","ratakan tetingkap menjadi satu vektor input (Makmal B1 menggunakan 2 lat).")}</li><li><b>RNN</b> — ${L("read one hour at a time, carrying a hidden state h<sub>t</sub> = tanh(W<sub>x</sub>x<sub>t</sub> + W<sub>h</sub>h<sub>t−1</sub> + b).","baca satu jam pada satu masa, membawa keadaan tersembunyi h<sub>t</sub> = tanh(W<sub>x</sub>x<sub>t</sub> + W<sub>h</sub>h<sub>t−1</sub> + b).")}</li><li><b>LSTM</b> — ${L("adds forget / input / output gates so useful memories (yesterday's storm) survive long gaps.","menambah get lupa / input / output supaya ingatan berguna (ribut semalam) bertahan merentas jurang panjang.")}</li></ul></div>
<svg viewBox="0 0 460 120" style="width:100%">${[0,1,2,3].map(i=>`<rect x="${20+i*110}" y="30" width="70" height="50" rx="12" fill="var(--bg2)" stroke="var(--a1)" stroke-width="2.5"/><text x="${55+i*110}" y="60" text-anchor="middle" font-size="13" style="fill:var(--ink)">LSTM</text><text x="${55+i*110}" y="105" text-anchor="middle" font-size="12">x<tspan font-size="9" dy="3">t${i?"+"+i:""}</tspan></text><line x1="${55+i*110}" y1="95" x2="${55+i*110}" y2="82" stroke="var(--acc)" stroke-width="2"/>${i<3?`<line x1="${92+i*110}" y1="55" x2="${128+i*110}" y2="55" stroke="var(--a2)" stroke-width="3" class="dash"/>`:""}`).join("")}<text x="230" y="18" text-anchor="middle" font-size="12" style="fill:var(--a2)"><tspan class="en">memory c_t and hidden state h_t flow along time</tspan><tspan class="bm">ingatan c_t dan keadaan tersembunyi h_t mengalir sepanjang masa</tspan></text></svg>
<div class="call warn"><b>${L("Leakage again","Kebocoran lagi")}</b>${L("Windows from the test period must never overlap training windows. Split by date first, then cut windows.","Tetingkap daripada tempoh ujian tidak boleh bertindih dengan tetingkap latihan. Bahagi mengikut tarikh dahulu, kemudian potong tetingkap.")}</div></div></div>`,
 init(el){const r=rng(8);this.S=[...Array(96)].map((_,t)=>40+18*Math.sin(t/9)+12*Math.max(0,Math.sin(t/4.3-1))**3+gauss(r)*2);bind(el,["tsw","tsh","tsp"],()=>this.show(el))},
 show(el){const W=val(el,"tsw"),H=val(el,"tsh"),p=Math.min(val(el,"tsp"),96-W-H),c=C(),S=this.S;const P=plot(el.querySelector("#tsv"),{x0:0,x1:95,y0:10,y1:90,w:520,h:220});P.clear();P.axes(tx("hour","jam"),tx("level %","paras %"),[0,24,48,72,95],[20,50,80]);
  P.el("rect",{x:P.X(p),width:P.X(W-1)-P.X(0),y:P.Y(90),height:P.Y(10)-P.Y(90),fill:c.a1,"fill-opacity":.15});P.el("rect",{x:P.X(p+W-1+H)-3,width:6,y:P.Y(90),height:P.Y(10)-P.Y(90),fill:c.a2,"fill-opacity":.4});
  P.el("path",{d:S.map((v,i)=>(i?"L":"M")+P.X(i)+","+P.Y(v)).join(""),fill:"none",stroke:c.ink,"stroke-width":2});for(let i=p;i<p+W;i++)P.el("circle",{cx:P.X(i),cy:P.Y(S[i]),r:3.5,fill:c.a1});P.el("circle",{cx:P.X(p+W-1+H),cy:P.Y(S[p+W-1+H]),r:6,fill:c.a2});
  const n=96-W-H+1;el.querySelector("#tsr").innerHTML=`<span class="r" style="color:${c.a1}"><b>${tx("inputs","input")}</b>${W} ${tx("values","nilai")}</span><span class="r" style="color:${c.a2}"><b>${tx("target","sasaran")}</b>${S[p+W-1+H].toFixed(1)}%</span><span class="r"><b>${tx("examples from 96 h","contoh daripada 96 j")}</b>${n}</span>`}});

/* 17 CODE LAB */
add({sec:S3,t:{en:"Lab B1: forecast the river",bm:"Makmal B1: ramal paras sungai"},html:`
<div class="kicker rv">🛠️ ${L("Practice","Latihan")} · ${L("choose your level","pilih tahap anda")}</div><h2 class="rv">${L("Four routes to a working network","Empat laluan ke rangkaian yang berfungsi")}</h2>
<div class="rv">${code({variants:[
 {label:{en:"L1 · TensorFlow Playground",bm:"T1 · TensorFlow Playground"},level:"l1",lang:"text",tool:"playground.tensorflow.org",desc:{en:"Pure clicking. A visual neural network in the browser — no account, no data upload.",bm:"Klik sahaja. Rangkaian neural visual dalam pelayar — tanpa akaun, tanpa muat naik data."},
  lines:[["1. Open playground.tensorflow.org","Google's open-source visual trainer.","Pelatih visual sumber terbuka Google."],
   ["2. Data: choose the 'Circle' dataset; Noise = 10; Ratio of training data = 50%","Same shape as our live trainer; half the data is held out for testing.","Bentuk sama seperti pelatih langsung kita; separuh data diasingkan untuk ujian."],
   ["3. Features: keep only X1 and X2","Forces the network to learn the curve itself.","Memaksa rangkaian mempelajari lengkung sendiri."],
   ["4. Hidden layers: 1 layer with 1 neuron. Press ▶ and watch Test loss.","A single neuron can only draw a line — it will fail.","Satu neuron hanya boleh melukis garis — ia akan gagal."],
   ["5. Increase to 3 neurons, then 1 layer of 6. Press ▶ again.","Capacity grows; the boundary bends into a ring.","Kapasiti bertambah; sempadan melentur menjadi gelang."],
   ["6. Set Learning rate = 3 and restart. Watch the loss.","Experience divergence with your own eyes.","Alami pencapahan dengan mata sendiri."],
   ["7. Add Regularization = L2, rate 0.01, with Noise = 40","Observe how regularisation smooths an over-wiggly boundary.","Perhatikan bagaimana regularisasi melicinkan sempadan yang terlalu berliku."],
   ["8. Record: smallest network with Test loss < 0.05","Your evidence for the reflection.","Bukti anda untuk refleksi."]],
  out:"1 neuron: test loss stays ≈ 0.5 (a straight line can't enclose a circle)\n3+ neurons: test loss < 0.05 within ~200 epochs\nLearning rate 3: loss jumps around / fails to settle\nL2 on noisy data: smoother boundary, train and test loss closer"},
 {label:{en:"L1 · Teachable Machine",bm:"T1 · Teachable Machine"},level:"l1",lang:"text",tool:"teachablemachine.withgoogle.com",desc:{en:"Train an image classifier with your webcam or uploaded photos. Training runs in your browser.",bm:"Latih pengelas imej dengan kamera web atau foto dimuat naik. Latihan berjalan dalam pelayar anda."},
  lines:[["1. New project → Image project → Standard image model","Uses transfer learning on a pre-trained CNN.","Menggunakan pemindahan pembelajaran pada CNN pra-latih."],
   ["2. Class 1 'Clear drain' — upload 30+ photos of clear drains","Classes are labels (Pembelajaran Terarah).","Kelas ialah label (Pembelajaran Terarah)."],
   ["3. Class 2 'Blocked drain' — upload 30+ photos of blocked drains","Balance the classes to avoid bias.","Seimbangkan kelas untuk mengelakkan bias."],
   ["4. Train model → Preview with NEW photos not used in training","A tiny version of a held-out test.","Versi kecil ujian data diasingkan."],
   ["5. Advanced: change epochs and learning rate; observe accuracy per class","Hyperparameters without code.","Hiperparameter tanpa kod."],
   ["6. Ethics: use your own photos or openly licensed ones; no faces or car plates","Data protection by design.","Perlindungan data melalui reka bentuk."]],
  out:"A browser model that labels drain photos with a confidence bar.\nExpect errors on unusual lighting — note them as limitations."},
 {label:{en:"L3 · Python (scikit-learn)",bm:"T3 · Python (scikit-learn)"},level:"l3",lang:"python",tool:"Google Colab",desc:{en:"Synthetic river data (no personal data). An MLP forecasts the level 3 hours ahead.",bm:"Data sungai sintetik (tiada data peribadi). MLP meramal paras 3 jam ke hadapan."},
  lines:[["import numpy as np","Numerical arrays.","Tatasusunan berangka."],
   ["from sklearn.model_selection import train_test_split","Holds out a test set.","Mengasingkan set ujian."],
   ["from sklearn.preprocessing import StandardScaler","Puts features on a similar scale — networks train faster.","Meletakkan ciri pada skala serupa — rangkaian dilatih lebih pantas."],
   ["from sklearn.neural_network import MLPRegressor","A multilayer perceptron for regression.","Perseptron berbilang lapisan untuk regresi."],
   ["from sklearn.metrics import mean_absolute_error, r2_score","Evaluation metrics.","Metrik penilaian."],
   ["rng = np.random.default_rng(42)                     # fixed seed = reproducible","Same random numbers every run.","Nombor rawak sama setiap larian."],
   ["n = 600","600 synthetic hourly records.","600 rekod setiap jam sintetik."],
   ["rain_now = rng.uniform(0, 100, n)                   # mm/h","Feature 1.","Ciri 1."],
   ["rain_1h  = rng.uniform(0, 100, n)                   # mm/h, one hour ago","Feature 2 — a lag feature.","Ciri 2 — ciri lat."],
   ["level    = rng.uniform(10, 90, n)                   # % of danger level","Feature 3.","Ciri 3."],
   ["noise    = rng.normal(0, 3, n)                      # \"ralat\" (sensor noise)","Realistic measurement noise.","Ralat pengukuran yang realistik."],
   ["level_3h = np.clip(0.6*level + 0.25*rain_now + 0.15*rain_1h + 0.002*rain_now*level + noise, 0, 120)","The hidden 'truth' the network must discover — including an interaction term.","‘Kebenaran’ tersembunyi yang perlu ditemui rangkaian — termasuk sebutan interaksi."],
   ["X = np.column_stack([rain_now, rain_1h, level])","Feature matrix (600 × 3).","Matriks ciri (600 × 3)."],
   ["X_tr, X_te, y_tr, y_te = train_test_split(X, level_3h, test_size=0.2, random_state=42)","80% train, 20% test. (Real time-series: split by date instead!)","80% latihan, 20% ujian. (Siri masa sebenar: bahagi mengikut tarikh!)"],
   ["scaler = StandardScaler().fit(X_tr)                 # learn scaling from TRAIN only","Prevents data leakage.","Mengelakkan kebocoran data."],
   ["model = MLPRegressor(hidden_layer_sizes=(8,), activation='relu',","One hidden layer of 8 ReLU neurons.","Satu lapisan tersembunyi dengan 8 neuron ReLU."],
   ["                     learning_rate_init=0.01, max_iter=2000, random_state=42)","Adam optimiser by default.","Pengoptimum Adam secara lalai."],
   ["model.fit(scaler.transform(X_tr), y_tr)","Backpropagation happens here.","Rambatan balik berlaku di sini."],
   ["pred = model.predict(scaler.transform(X_te))","Predict unseen test cases.","Ramal kes ujian yang belum dilihat."],
   ["print(f\"MAE  = {mean_absolute_error(y_te, pred):.2f} percentage points\")","Average absolute error in level points.","Purata kesilapan mutlak dalam mata paras."],
   ["print(f\"R^2  = {r2_score(y_te, pred):.3f}\")","Share of variance explained (1.0 = perfect).","Bahagian varians yang diterangkan (1.0 = sempurna)."],
   ["new = scaler.transform([[45, 30, 70]])","A new situation: 45 mm/h now, 30 an hour ago, level 70%.","Situasi baharu: 45 mm/j sekarang, 30 sejam lalu, paras 70%."],
   ["print(f\"Forecast for rain 45, 30 mm/h & level 70% -> level in 3 h = {model.predict(new)[0]:.1f}%\")","The forecast that would feed the fuzzy warning rules.","Ramalan yang akan dimasukkan ke peraturan amaran kabur."]],
  out:"MAE  = 2.60 percentage points\nR^2  = 0.973\nForecast for rain 45, 30 mm/h & level 70% -> level in 3 h = 63.2%\n(Tiny differences are possible across scikit-learn versions.)"},
 {label:{en:"L3 · XOR from scratch",bm:"T3 · XOR dari asas"},level:"l3",lang:"python",tool:"numpy only",desc:{en:"Every gradient written by hand — the forward pass and backprop from slides 10 and 13.",bm:"Setiap kecerunan ditulis dengan tangan — hantaran ke hadapan dan rambatan balik daripada slaid 10 dan 13."},
  lines:[["import numpy as np","",""],["X = np.array([[0,0],[0,1],[1,0],[1,1]])","The four XOR inputs.","Empat input XOR."],["y = np.array([[0],[1],[1],[0]])","Targets.","Sasaran."],
   ["rng = np.random.default_rng(1)","Fixed seed.","Benih tetap."],["W1 = rng.normal(0, 1, (2, 4)); b1 = np.zeros(4)","2 inputs → 4 hidden neurons.","2 input → 4 neuron tersembunyi."],["W2 = rng.normal(0, 1, (4, 1)); b2 = np.zeros(1)","4 hidden → 1 output.","4 tersembunyi → 1 output."],
   ["sig = lambda z: 1 / (1 + np.exp(-z))","Sigmoid for the output.","Sigmoid untuk output."],["lr = 1.0","Learning rate.","Kadar pembelajaran."],
   ["for epoch in range(5001):","",""],["    h   = np.tanh(X @ W1 + b1)            # forward: hidden layer","Hidden activations.","Pengaktifan tersembunyi."],
   ["    out = sig(h @ W2 + b2)                # forward: output layer","Predictions.","Ramalan."],["    loss = np.mean((out - y) ** 2)","MSE loss.","Kerugian MSE."],
   ["    d_out = 2 * (out - y) / len(X) * out * (1 - out)   # backprop: output","∂L/∂z at the output (chain rule).","∂L/∂z di output (petua rantai)."],
   ["    d_h   = (d_out @ W2.T) * (1 - h ** 2)               # backprop: hidden","Blame passed back through W2 and tanh′.","Kesalahan dihantar balik melalui W2 dan tanh′."],
   ["    W2 -= lr * h.T @ d_out;  b2 -= lr * d_out.sum(0)","Gradient-descent update, output layer.","Kemas kini penurunan kecerunan, lapisan output."],
   ["    W1 -= lr * X.T @ d_h;    b1 -= lr * d_h.sum(0)","Update, hidden layer.","Kemas kini, lapisan tersembunyi."],
   ["    if epoch % 1000 == 0:","",""],["        print(f\"epoch {epoch:4d}  loss {loss:.4f}\")","Watch the loss fall.","Lihat kerugian menurun."],
   ["print(\"predictions:\", out.round(2).ravel())","Should be close to 0, 1, 1, 0.","Sepatutnya hampir 0, 1, 1, 0."]],
  out:"epoch    0  loss 0.2400\nepoch 1000  loss 0.0008\nepoch 2000  loss 0.0003\nepoch 3000  loss 0.0002\nepoch 4000  loss 0.0002\nepoch 5000  loss 0.0001\npredictions: [0.   0.99 0.99 0.01]"}]})}</div>`,
 notes:{en:"<p>The scikit-learn lab uses synthetic data on purpose: you can practise the full workflow without touching anyone's personal data. When you move to real gauge data (e.g. public hydrological records), split by time, not randomly.</p>",bm:"<p>Makmal scikit-learn menggunakan data sintetik dengan sengaja: anda boleh berlatih aliran kerja penuh tanpa menyentuh data peribadi sesiapa. Apabila beralih kepada data tolok sebenar (cth. rekod hidrologi awam), bahagi mengikut masa, bukan secara rawak.</p>"}});

/* 18 QUIZ C */
add({sec:S3,t:{en:"Checkpoint C (ANN basics)",bm:"Titik semak C (asas ANN)"},noAutoDone:true,html:`
<div class="kicker rv">✅ ${L("Formative assessment","Pentaksiran formatif")} · 6 ${L("items","item")} · ~8 min</div><h2 class="rv">${L("Checkpoint C","Titik semak C")}</h2>
<div class="rv">${quiz({id:"anC",items:[
 {q:{en:"w = [0.5, −1], x = [2, 1], b = 0.5. What is z = w·x + b?",bm:"w = [0.5, −1], x = [2, 1], b = 0.5. Berapakah z = w·x + b?"},o:["−0.5","0.5","1.5","2.5"],a:1,why:{en:"0.5·2 + (−1)·1 + 0.5 = 1 − 1 + 0.5 = 0.5.",bm:"0.5·2 + (−1)·1 + 0.5 = 1 − 1 + 0.5 = 0.5."}},
 {q:{en:"Why can't a single perceptron learn XOR?",bm:"Mengapa satu perseptron tidak boleh mempelajari XOR?"},o:[{en:"Too few training examples",bm:"Contoh latihan terlalu sedikit"},{en:"XOR is not linearly separable",bm:"XOR tidak boleh dipisahkan secara linear"},{en:"The learning rate is too small",bm:"Kadar pembelajaran terlalu kecil"},{en:"It needs a sigmoid output",bm:"Ia memerlukan output sigmoid"}],a:1,why:{en:"One neuron draws one straight line; XOR's classes need two lines (a hidden layer).",bm:"Satu neuron melukis satu garis lurus; kelas XOR memerlukan dua garis (lapisan tersembunyi)."}},
 {q:{en:"What happens if you remove all activation functions from a deep network?",bm:"Apa berlaku jika semua fungsi pengaktifan dibuang daripada rangkaian mendalam?"},o:[{en:"It trains faster and better",bm:"Ia dilatih lebih pantas dan baik"},{en:"It collapses into one linear model",bm:"Ia runtuh menjadi satu model linear"},{en:"It becomes a fuzzy system",bm:"Ia menjadi sistem kabur"},{en:"It cannot be trained at all",bm:"Ia langsung tidak boleh dilatih"}],a:1,why:{en:"A composition of linear maps is linear; depth adds nothing without non-linearity.",bm:"Gubahan pemetaan linear adalah linear; kedalaman tidak menambah apa-apa tanpa ketaklinearan."}},
 {q:{en:"The loss jumps up and down and grows over epochs. Most likely cause?",bm:"Kerugian melompat naik turun dan meningkat sepanjang epok. Punca paling mungkin?"},o:[{en:"Learning rate too high",bm:"Kadar pembelajaran terlalu tinggi"},{en:"Too much test data",bm:"Terlalu banyak data ujian"},{en:"Too few output neurons",bm:"Terlalu sedikit neuron output"},{en:"Using ReLU",bm:"Menggunakan ReLU"}],a:0,why:{en:"Large steps overshoot the minimum and can diverge — lower η.",bm:"Langkah besar terlajak minimum dan boleh mencapah — turunkan η."}},
 {q:{en:"Backpropagation computes…",bm:"Rambatan balik mengira…"},o:[{en:"the best architecture",bm:"seni bina terbaik"},{en:"gradients of the loss with respect to every weight, via the chain rule",bm:"kecerunan kerugian terhadap setiap pemberat, melalui petua rantai"},{en:"the training data labels",bm:"label data latihan"},{en:"the activation function",bm:"fungsi pengaktifan"}],a:1,why:{en:"Backprop is efficient gradient computation; an optimiser (e.g. gradient descent) then uses those gradients.",bm:"Rambatan balik ialah pengiraan kecerunan yang cekap; pengoptimum (cth. penurunan kecerunan) kemudian menggunakannya."}},
 {q:{en:"What is σ(0) for the sigmoid function?",bm:"Berapakah σ(0) bagi fungsi sigmoid?"},o:["0","0.25","0.5","1"],a:2,why:{en:"σ(0) = 1/(1+e⁰) = 0.5. (0.25 is the maximum of its derivative.)",bm:"σ(0) = 1/(1+e⁰) = 0.5. (0.25 ialah maksimum terbitannya.)"}}]})}</div>`});

/* 19 VIDEO */
add({sec:S3,t:{en:"Animated explainer",bm:"Penerang animasi"},html:`
<div class="kicker rv">🎬 ${L("Watch (53 s, English voice)","Tonton (66 s, suara Bahasa Malaysia)")}</div><h2 class="rv">${L("One neuron → a network → learning","Satu neuron → rangkaian → pembelajaran")}</h2>
<div class="cols c2" style="align-items:center"><div class="rv"><video class="en" src="media/ann-explainer.mp4" controls playsinline preload="metadata"></video><video class="bm" src="media/ann-explainer-bm.mp4" controls playsinline preload="metadata"></video></div>
<div class="rv"><p class="lead">${L("Watch for:","Perhatikan:")}</p><ol class="tight"><li>${L("weighted sum + activation","hasil tambah berpemberat + pengaktifan")}</li><li>${L("signals flowing forward","isyarat mengalir ke hadapan")}</li><li>${L("error flowing backward and the loss falling","kesilapan mengalir ke belakang dan kerugian menurun")}</li></ol><p class="small muted">${L("English voice-over with English and Malay captions. Switch to BM for the Malay-narrated version.","Suara latar Bahasa Malaysia (suara neural Microsoft) dengan kapsyen BM dan Inggeris. Tukar ke EN untuk versi bahasa Inggeris.")}</p></div></div>`});

/* 20 ZOO */
add({sec:S3,t:{en:"Architecture zoo",bm:"Zoo seni bina"},html:`
<div class="kicker rv">🦁 ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Pick the network that matches your data","Pilih rangkaian yang sepadan dengan data anda")}</h2>
<div class="cols c4">
 ${[["🧱","MLP","Tables of features","Jadual ciri","River level from rain + level","Paras sungai daripada hujan + paras"],["🖼️","CNN","Images, grids","Imej, grid","Blocked-drain photos, radar maps","Foto longkang tersumbat, peta radar"],["⏳","RNN / LSTM","Sequences, time series","Jujukan, siri masa","Hourly gauge readings","Bacaan tolok setiap jam"],["🔭","Transformer","Long sequences, text, multimodal","Jujukan panjang, teks, multimodal","Reports, weather foundation models","Laporan, model asas cuaca"],["🕸️","GNN","Graphs, networks","Graf, rangkaian","River networks, drainage pipes","Rangkaian sungai, paip saliran"],["🗜️","Autoencoder","Compression, anomalies","Pemampatan, anomali","Faulty sensor detection","Pengesanan penderia rosak"],["🎨","Diffusion / GAN","Generating data","Menjana data","Synthetic storm scenarios","Senario ribut sintetik"],["🧬","KAN · Liquid NN","Interpretable / adaptive (new)","Boleh ditafsir / adaptif (baharu)","Compact edge forecasting","Ramalan padat di pinggir"]].map(z=>`<div class="card rv"><div class="ic">${z[0]}</div><b>${z[1]}</b><p class="small">${L(z[2],z[3])}<br><span class="muted">${L("e.g. ","cth. ")}${L(z[4],z[5])}</span></p></div>`).join("")}</div>
<div class="call fact rv"><b>${L("Rule of thumb","Panduan umum")}</b>${L("Structure in the data → structure in the network: grids → convolutions, order → recurrence/attention, links → graphs.","Struktur dalam data → struktur dalam rangkaian: grid → konvolusi, tertib → rekurensi/perhatian, pautan → graf.")}</div>`});

/* 21 METRICS / CONFUSION */
add({sec:S3,t:{en:"Metrics that matter",bm:"Metrik yang penting"},html:`
<div class="kicker rv">📊 ${L("Instrument","Instrumen")}</div><h2 class="rv">${L("False alarm or missed flood — you choose the threshold","Amaran palsu atau banjir terlepas — anda pilih ambang")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="cm"></svg>${slider("cth",L("Alert threshold on model score","Ambang amaran pada skor model"),.05,.95,.5,.01)}</div>
<div class="rv"><div id="cmt"></div><div class="readout" id="cmr"></div>
<div class="call val"><b>${L("Value: Ihsan","Nilai: Ihsan")}</b>${L("A missed flood can cost lives; a false alarm costs trust. Decide the trade-off with residents, then document it.","Banjir terlepas boleh meragut nyawa; amaran palsu meragut kepercayaan. Putuskan pertukaran bersama penduduk, kemudian dokumentasikannya.")}</div>
<div class="call tip"><b>${L("Challenge","Cabaran")}</b>${L("Find the threshold where recall ≥ 95%. How many false alarms does that cost out of 160 dry days?","Cari ambang di mana dapatan semula ≥ 95%. Berapa banyak amaran palsu sebagai kosnya daripada 160 hari kering?")}</div></div></div>`,
 notes:{en:"<p>Synthetic scores for 200 events (40 floods). Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = harmonic mean. For regression forecasts use MAE/RMSE, and always report performance on extreme events separately — averages hide the storms that matter.</p>",bm:"<p>Skor sintetik bagi 200 kejadian (40 banjir). Kepersisan = TP/(TP+FP), Dapatan semula = TP/(TP+FN), F1 = min harmonik. Untuk ramalan regresi gunakan MAE/RMSE, dan sentiasa laporkan prestasi pada kejadian ekstrem secara berasingan — purata menyembunyikan ribut yang penting.</p>"},
 init(el){const r=rng(3);this.D=[...Array(200)].map((_,i)=>{const f=i<40;return {f,s:Math.max(0,Math.min(1,(f?.68:.34)+gauss(r)*.15))}});bind(el,["cth"],()=>this.show(el))},
 show(el){const t=val(el,"cth"),c=C(),D=this.D;let TP=0,FP=0,FN=0,TN=0;D.forEach(d=>{const a=d.s>=t;if(d.f&&a)TP++;else if(!d.f&&a)FP++;else if(d.f)FN++;else TN++});
  const P=plot(el.querySelector("#cm"),{x0:0,x1:1,y0:0,y1:30,w:520,h:230});P.clear();P.axes(tx("model score","skor model"),tx("count","bilangan"),[0,.25,.5,.75,1],[0,10,20,30]);
  const bins=20;for(let k=0;k<bins;k++){const lo=k/bins,hi=(k+1)/bins;const nf=D.filter(d=>d.f&&d.s>=lo&&d.s<hi).length,nd=D.filter(d=>!d.f&&d.s>=lo&&d.s<hi).length;
   P.el("rect",{x:P.X(lo)+1,width:P.X(hi)-P.X(lo)-2,y:P.Y(nd),height:P.Y(0)-P.Y(nd),fill:c.a1,"fill-opacity":.45});P.el("rect",{x:P.X(lo)+1,width:P.X(hi)-P.X(lo)-2,y:P.Y(nd+nf),height:P.Y(0)-P.Y(nf),fill:c.bad,"fill-opacity":.8})}
  P.el("line",{x1:P.X(t),x2:P.X(t),y1:P.Y(0),y2:P.Y(30),stroke:c.acc,"stroke-width":3});
  const pr=TP/(TP+FP||1),re=TP/(TP+FN||1),f1=2*pr*re/(pr+re||1);
  el.querySelector("#cmt").innerHTML=`<table class="t" style="text-align:center"><tr><th></th><th>${tx("Alert","Amaran")}</th><th>${tx("No alert","Tiada amaran")}</th></tr><tr><th style="color:${c.bad}">${tx("Flood","Banjir")}</th><td>TP <b>${TP}</b></td><td style="background:color-mix(in srgb,${c.bad} 20%,transparent)">FN <b>${FN}</b> ${tx("missed","terlepas")}</td></tr><tr><th>${tx("Dry","Kering")}</th><td style="background:color-mix(in srgb,${c.warn} 20%,transparent)">FP <b>${FP}</b> ${tx("false alarms","amaran palsu")}</td><td>TN <b>${TN}</b></td></tr></table>`;
  el.querySelector("#cmr").innerHTML=`<span class="r"><b>${tx("Precision","Kepersisan")}</b>${(pr*100).toFixed(0)}%</span><span class="r"><b>${tx("Recall","Dapatan semula")}</b>${(re*100).toFixed(0)}%</span><span class="r"><b>F1</b>${f1.toFixed(2)}</span><span class="r"><b>${tx("Accuracy","Ketepatan")}</b>${((TP+TN)/2).toFixed(0)}%</span>`}});

/* 22 EXPLAIN + ANFIS */
add({sec:S3,t:{en:"Explainability & ANFIS",bm:"Kebolehterangan & ANFIS"},html:`
<div class="kicker rv">🔍 ${L("Open the box","Buka kotak")}</div><h2 class="rv">${L("Two ways to trust a network","Dua cara untuk mempercayai rangkaian")}</h2>
<div class="cols c2"><div class="card rv"><h3>${L("Explain after training","Terangkan selepas latihan")}</h3><ul class="tight small">
<li><b>SHAP</b> — ${L("how much each feature pushed this prediction up or down.","sejauh mana setiap ciri menolak ramalan ini naik atau turun.")}</li>
<li><b>LIME</b> — ${L("fit a simple local model around one case.","muatkan model setempat ringkas di sekitar satu kes.")}</li>
<li><b>${L("Saliency maps","Peta saliensi")}</b> — ${L("which pixels a CNN looked at.","piksel mana yang dilihat CNN.")}</li>
<li><b>${L("Model cards","Kad model")}</b> — ${L("document data, intended use, limits and metrics per group.","dokumentasikan data, kegunaan, had dan metrik mengikut kumpulan.")}</li></ul>
<div class="call warn"><b>${L("Caution","Awas")}</b>${L("Post-hoc explanations approximate the model; they can be wrong or manipulated.","Penerangan pasca-hoc hanya menghampiri model; ia boleh salah atau dimanipulasi.")}</div></div>
<div class="card tint rv"><h3>${L("Build it readable: ANFIS (Jang, 1993)","Bina supaya boleh dibaca: ANFIS (Jang, 1993)")}</h3>
<svg viewBox="0 0 480 170" style="width:100%">${["Input","μ (fuzzify)","Π (fire)","N (normalise)","f (TSK)","Σ"].map((n,i)=>`<rect x="${5+i*79}" y="55" width="70" height="56" rx="10" fill="var(--bg2)" stroke="${i%2?"var(--a2)":"var(--a1)"}" stroke-width="2.5"/><text x="${40+i*79}" y="88" text-anchor="middle" font-size="11" style="fill:var(--ink)">${n}</text>${i<5?`<line x1="${75+i*79}" y1="83" x2="${84+i*79}" y2="83" stroke="var(--a1)" stroke-width="2"/>`:""}`).join("")}
<text x="240" y="140" text-anchor="middle" font-size="12" style="fill:var(--a1)"><tspan class="en">a Sugeno fuzzy system laid out as a network</tspan><tspan class="bm">sistem kabur Sugeno disusun sebagai rangkaian</tspan></text></svg>
<p class="small">${L("Gradient descent tunes the membership functions; least squares fits the rule outputs. You get learned accuracy and readable IF–THEN rules — Module A and B combined.","Penurunan kecerunan menala fungsi keahlian; kuasa dua terkecil memuatkan output peraturan. Anda mendapat ketepatan dipelajari dan peraturan JIKA–MAKA yang boleh dibaca — gabungan Modul A dan B.")}</p></div></div>`});

/* 22b EXPLAIN ONE FORECAST */
add({sec:S3,t:{en:"Explaining one forecast",bm:"Menerangkan satu ramalan"},html:`
<div class="kicker rv">💧 ${L("Instrument","Instrumen")} · ${L("additive explanation","penerangan aditif")}</div><h2 class="rv">${L("Why did the model say 72%? A waterfall of contributions","Mengapa model berkata 72%? Air terjun sumbangan")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="wfv"></svg></div>
<div class="rv">${slider("wr",L("Rain now (mm/h)","Hujan sekarang (mm/j)"),0,100,70)}${slider("wr1",L("Rain 1 h ago","Hujan 1 jam lalu"),0,100,40)}${slider("wl",L("Level now (%)","Paras sekarang (%)"),10,90,75)}${slider("wsm",L("Soil moisture (%)","Kelembapan tanah (%)"),0,100,60)}
<p class="small">${L("Each bar shows how far a feature pushes the forecast from the average forecast (the base value). Bars add up exactly to the prediction — the property that SHAP values guarantee for any model.","Setiap bar menunjukkan sejauh mana satu ciri menolak ramalan daripada ramalan purata (nilai asas). Bar dijumlahkan tepat kepada ramalan — sifat yang dijamin nilai SHAP bagi sebarang model.")}</p>
<div class="call warn"><b>${L("Honest caveat","Kaveat jujur")}</b>${L("Here the “model” is an additive surrogate, so contributions are exact. For a real network, SHAP estimates them — useful, but an approximation.","Di sini “model” ialah pengganti aditif, jadi sumbangan adalah tepat. Bagi rangkaian sebenar, SHAP menganggarkannya — berguna, tetapi hanya anggaran.")}</div></div></div>`,
 init(el){bind(el,["wr","wr1","wl","wsm"],()=>this.show(el))},
 show(el){const c=C(),x=[val(el,"wr"),val(el,"wr1"),val(el,"wl"),val(el,"wsm")],mean=[35,35,50,50],fn=[v=>.25*v,v=>.12*v,v=>.6*v,v=>.08*v+.0006*v*v];const names=[tx("rain now","hujan sekarang"),tx("rain −1 h","hujan −1 j"),tx("level now","paras sekarang"),tx("soil moisture","kelembapan tanah")];
  const base=42,ct=x.map((v,i)=>fn[i](v)-fn[i](mean[i]));const pred=base+ct.reduce((a,b)=>a+b,0);let run=base;const bars=ct.map((v,i)=>{const b={n:names[i],a:run,b:run+v,v};run+=v;return b});
  const lo=Math.min(base,...bars.map(b=>Math.min(b.a,b.b)))-5,hi=Math.max(base,...bars.map(b=>Math.max(b.a,b.b)))+5;const P=plot(el.querySelector("#wfv"),{x0:lo,x1:hi,y0:0,y1:6,w:520,h:280,pad:{l:110,r:20,t:10,b:30}});P.clear();P.axes(tx("forecast level in 3 h (%)","ramalan paras 3 j (%)"),"",[Math.round(lo),Math.round(base),Math.round(hi)],[]);
  const row=(k,lab,a,b,col,txt)=>{const y=5.4-k;P.el("rect",{x:P.X(Math.min(a,b)),width:Math.max(2,Math.abs(P.X(b)-P.X(a))),y:P.Y(y+.32),height:P.Y(y-.32)-P.Y(y+.32),fill:col,rx:4});P.el("text",{x:8,y:P.Y(y)+4,"font-size":12}).textContent=lab;P.el("text",{x:P.X(Math.max(a,b))+5,y:P.Y(y)+4,"font-size":12,"font-weight":700,fill:col}).textContent=txt};
  row(0,tx("base value","nilai asas"),lo+1,base,c.ink,base.toFixed(1));bars.forEach((b,i)=>row(i+1,b.n,b.a,b.b,b.v>=0?c.bad:c.ok,(b.v>=0?"+":"")+b.v.toFixed(1)));row(5,tx("prediction","ramalan"),lo+1,pred,c.a1,pred.toFixed(1)+"%")}});

/* 22c UNCERTAINTY */
add({sec:S3,t:{en:"How sure is the network?",bm:"Sejauh mana rangkaian pasti?"},html:`
<div class="kicker rv">🌫️ ${L("Instrument","Instrumen")} · ${L("uncertainty quantification","kuantifikasi ketidakpastian")}</div><h2 class="rv">${L("Ensembles and prediction intervals — the neural cousin of Type-2","Ensembel dan selang ramalan — saudara neural Jenis-2")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="unv"></svg><div class="readout" id="unr"></div></div>
<div class="rv">${slider("unk",L("Ensemble members","Ahli ensembel"),1,12,6)}${slider("und",L("Model flexibility (polynomial degree)","Kelenturan model (darjah polinomial)"),1,7,4)}${slider("unc",L("Interval coverage target (%)","Sasaran liputan selang (%)"),50,99,90)}
<p class="small">${L("Each member is trained on a different bootstrap resample. Where members disagree — usually where data are scarce, like extreme storms — the spread widens. The shaded band adds a calibrated margin from held-out errors (split-conformal style).","Setiap ahli dilatih pada sampel semula bootstrap yang berbeza. Di mana ahli tidak sepakat — lazimnya di tempat data terhad, seperti ribut ekstrem — sebaran melebar. Jalur berlorek menambah margin dikalibrasi daripada kesilapan data diasingkan (gaya konformal pisah).")}</p>
<div class="call fact"><b>${L("Connect to Module A","Kaitkan dengan Modul A")}</b>${L("An IT2 output [yₗ, yᵣ] and an ensemble interval answer the same question: “how much should you trust this number?” Report both the forecast and its interval to decision-makers.","Output IT2 [yₗ, yᵣ] dan selang ensembel menjawab soalan yang sama: “sejauh mana anda patut mempercayai nombor ini?” Laporkan kedua-dua ramalan dan selangnya kepada pembuat keputusan.")}</div></div></div>`,
 init(el){const r=rng(21);this.D=[...Array(40)].map(()=>{const x=Math.pow(r(),1.6)*10;return [x,30+4*x+3*Math.sin(x)+gauss(r)*(2+.4*x)]});this.cal=[...Array(30)].map(()=>{const x=r()*10;return [x,30+4*x+3*Math.sin(x)+gauss(r)*(2+.4*x)]});bind(el,["unk","und","unc"],()=>this.show(el))},
 show(el){const K=val(el,"unk"),deg=val(el,"und"),cov=val(el,"unc")/100,c=C();const fit=(pts)=>{const n=deg+1,A=[...Array(n)].map(()=>Array(n).fill(0)),b=Array(n).fill(0);pts.forEach(([x,y])=>{const xs=[...Array(n)].map((_,i)=>(x/10)**i);for(let i=0;i<n;i++){b[i]+=xs[i]*y;for(let j=0;j<n;j++)A[i][j]+=xs[i]*xs[j]}});for(let i=0;i<n;i++)A[i][i]+=1e-3;
   for(let i=0;i<n;i++){let p=i;for(let k=i+1;k<n;k++)if(Math.abs(A[k][i])>Math.abs(A[p][i]))p=k;[A[i],A[p]]=[A[p],A[i]];[b[i],b[p]]=[b[p],b[i]];for(let k=i+1;k<n;k++){const f=A[k][i]/A[i][i];for(let j=i;j<n;j++)A[k][j]-=f*A[i][j];b[k]-=f*b[i]}}const w=Array(n).fill(0);for(let i=n-1;i>=0;i--){w[i]=(b[i]-A[i].slice(i+1).reduce((s,v,j)=>s+v*w[i+1+j],0))/A[i][i]}return x=>w.reduce((s,v,i)=>s+v*(x/10)**i,0)};
  const r=rng(77),M=[...Array(K)].map(()=>fit([...Array(this.D.length)].map(()=>this.D[Math.floor(r()*this.D.length)])));const mean=x=>M.reduce((s,f)=>s+f(x),0)/K;const res=this.cal.map(([x,y])=>Math.abs(y-mean(x))).sort((a,b)=>a-b);const q=res[Math.min(res.length-1,Math.ceil(cov*(res.length+1))-1)];
  const sd=x=>Math.sqrt(M.reduce((s,f)=>s+(f(x)-mean(x))**2,0)/K);const P=plot(el.querySelector("#unv"),{x0:0,x1:12,y0:10,y1:110,w:520,h:280});P.clear();P.axes(tx("rain intensity (scaled)","keamatan hujan (berskala)"),tx("level in 3 h","paras 3 j"),[0,4,8,12],[20,60,100]);
  P.el("path",{d:P.band(x=>mean(x)-q-2*sd(x),x=>mean(x)+q+2*sd(x)),fill:c.a1,"fill-opacity":.18});M.forEach(f=>P.el("path",{d:P.path(x=>Math.max(10,Math.min(110,f(x)))),fill:"none",stroke:c.a2,"stroke-width":1,"stroke-opacity":.6}));
  P.el("path",{d:P.path(mean),fill:"none",stroke:c.a1,"stroke-width":3});this.D.forEach(([x,y])=>P.el("circle",{cx:P.X(x),cy:P.Y(y),r:3.5,fill:c.ink}));P.el("rect",{x:P.X(10),width:P.X(12)-P.X(10),y:P.Y(110),height:P.Y(10)-P.Y(110),fill:c.bad,"fill-opacity":.08});P.el("text",{x:P.X(10.1),y:P.Y(105),"font-size":11,fill:c.bad}).textContent=tx("no data","tiada data");
  el.querySelector("#unr").innerHTML=`<span class="r"><b>${tx("width at x=2","lebar pada x=2")}</b>±${(q+2*sd(2)).toFixed(1)}</span><span class="r"><b>${tx("width at x=11","lebar pada x=11")}</b>±${(q+2*sd(11)).toFixed(1)}</span><span class="r"><b>${tx("calibration margin","margin kalibrasi")}</b>${q.toFixed(1)}</span>`}});

/* 22d FOUNDATION MODELS */
add({sec:S3,t:{en:"Transfer learning & foundation models",bm:"Pemindahan pembelajaran & model asas"},html:`
<div class="kicker rv">🏗️ ${L("Concepts","Konsep")}</div><h2 class="rv">${L("Don't start from zero: reuse what big models already learned","Jangan mula dari sifar: guna semula apa yang model besar sudah pelajari")}</h2>
<div class="cols c2"><svg viewBox="0 0 520 260" class="rv" style="width:100%">
 <rect x="20" y="40" width="220" height="170" rx="18" fill="var(--a1)" fill-opacity=".12" stroke="var(--a1)" stroke-width="2.5"/><text x="130" y="30" text-anchor="middle" font-size="14" font-weight="700" style="fill:var(--a1)"><tspan class="en">Pre-trained (frozen)</tspan><tspan class="bm">Pra-latih (dibekukan)</tspan></text>
 ${[0,1,2,3].map(i=>`<rect x="${40+i*48}" y="70" width="36" height="110" rx="8" fill="var(--bg2)" stroke="var(--a1)" stroke-width="2"/><text x="${58+i*48}" y="200" text-anchor="middle" font-size="10">L${i+1}</text>`).join("")}
 <line x1="240" y1="125" x2="300" y2="125" stroke="var(--a2)" stroke-width="3" class="dash"/>
 <rect x="300" y="70" width="60" height="110" rx="10" fill="var(--a2)" fill-opacity=".25" stroke="var(--a2)" stroke-width="2.5"/><text x="330" y="200" text-anchor="middle" font-size="11"><tspan class="en">new head</tspan><tspan class="bm">kepala baharu</tspan></text>
 <text x="430" y="110" text-anchor="middle" font-size="13" style="fill:var(--ink)"><tspan class="en">your small</tspan><tspan class="bm">data kecil</tspan></text><text x="430" y="130" text-anchor="middle" font-size="13" style="fill:var(--ink)"><tspan class="en">labelled data</tspan><tspan class="bm">berlabel anda</tspan></text><line x1="380" y1="125" x2="362" y2="125" stroke="var(--acc)" stroke-width="3"/>
 <text x="260" y="245" text-anchor="middle" font-size="12" style="fill:var(--a2)"><tspan class="en">feature extraction → fine-tuning → prompting</tspan><tspan class="bm">pengekstrakan ciri → penalaan halus → prom</tspan></text></svg>
<div class="rv"><table class="t small"><tr><th>${L("Strategy","Strategi")}</th><th>${L("What you train","Apa yang dilatih")}</th><th>${L("Data needed","Data diperlukan")}</th></tr>
<tr><td>${L("Feature extraction","Pengekstrakan ciri")}</td><td>${L("only a new output head","kepala output baharu sahaja")}</td><td>${L("hundreds","ratusan")}</td></tr><tr><td>${L("Fine-tuning","Penalaan halus")}</td><td>${L("top layers or adapters (e.g. LoRA)","lapisan atas atau penyesuai (cth. LoRA)")}</td><td>${L("thousands","ribuan")}</td></tr>
<tr><td>${L("Prompting","Prom")}</td><td>${L("nothing — instructions and examples only","tiada — arahan dan contoh sahaja")}</td><td>${L("a few examples","beberapa contoh")}</td></tr></table>
<div class="call new"><b>${L("Now","Terkini")}</b>${L("Foundation models exist for weather and climate, satellite imagery and time series; small on-device models (e.g. LFM2) bring them to phones without sending data to the cloud.","Model asas wujud untuk cuaca dan iklim, imej satelit dan siri masa; model kecil pada peranti (cth. LFM2) membawanya ke telefon tanpa menghantar data ke awan.")}</div>
<div class="call eth"><b>${L("Ask before reusing","Tanya sebelum guna semula")}</b>${L("Check the model's licence, training data and known biases (its model card) — you inherit them.","Semak lesen, data latihan dan bias diketahui model (kad modelnya) — anda mewarisinya.")}</div></div></div>`});

/* 22e PITFALLS */
add({sec:S3,t:{en:"Debugging a network",bm:"Menyahpepijat rangkaian"},html:`
<div class="kicker rv">🚧 ${L("Checklist","Senarai semak")}</div><h2 class="rv">${L("When training goes wrong — symptom → likely cause → fix","Apabila latihan tersasar — simptom → punca → pembaikan")}</h2>
<table class="t rv"><tr><th>${L("Symptom","Simptom")}</th><th>${L("Likely cause","Punca mungkin")}</th><th>${L("Try","Cuba")}</th></tr>
<tr><td>${L("Loss is NaN or explodes","Kerugian NaN atau meletup")}</td><td>${L("learning rate too high; unscaled inputs","kadar pembelajaran terlalu tinggi; input tidak berskala")}</td><td>${L("lower η 10×, scale features, gradient clipping","turunkan η 10×, skala ciri, pemotongan kecerunan")}</td></tr>
<tr><td>${L("Loss stuck from epoch 1","Kerugian tersekat dari epok 1")}</td><td>${L("dead ReLUs, bad init, labels shuffled","ReLU mati, pengawalan buruk, label bercelaru")}</td><td>${L("He init, Leaky ReLU, overfit 10 examples first","pengawalan He, Leaky ReLU, lebih suai 10 contoh dahulu")}</td></tr>
<tr><td>${L("Train great, test poor","Latihan bagus, ujian lemah")}</td><td>${L("overfitting or data leakage","lebih suai atau kebocoran data")}</td><td>${L("early stopping, regularisation, check splits","henti awal, regularisasi, semak pembahagian")}</td></tr>
<tr><td>${L("Test suspiciously perfect","Ujian terlalu sempurna")}</td><td>${L("leakage (future data, duplicates, target in features)","kebocoran (data masa depan, pendua, sasaran dalam ciri)")}</td><td>${L("time-based split, dedupe, audit features","pembahagian masa, buang pendua, audit ciri")}</td></tr>
<tr><td>${L("Fine on average, fails on storms","Baik secara purata, gagal semasa ribut")}</td><td>${L("rare events under-represented","kejadian jarang kurang diwakili")}</td><td>${L("report extremes separately, weight or oversample","laporkan ekstrem berasingan, beri pemberat atau terlebih sampel")}</td></tr>
<tr><td>${L("Accuracy high, users unhappy","Ketepatan tinggi, pengguna tidak puas")}</td><td>${L("wrong metric for the real cost","metrik salah untuk kos sebenar")}</td><td>${L("choose recall/precision/thresholds with stakeholders","pilih dapatan semula/kepersisan/ambang bersama pihak berkepentingan")}</td></tr></table>
<div class="call tip rv"><b>${L("Golden rule","Peraturan emas")}</b>${L("Before training on everything, make sure the network can overfit a tiny batch. If it can't memorise 10 examples, the bug is in the code, not the data.","Sebelum melatih pada semua data, pastikan rangkaian boleh lebih suai satu kelompok kecil. Jika ia tidak dapat menghafal 10 contoh, pepijat ada dalam kod, bukan data.")}</div>`});

/* 23 APPLICATIONS */
add({sec:S4,t:{en:"Real-world applications",bm:"Aplikasi dunia sebenar"},html:`
<div class="kicker rv">🌍 ${L("Association","Kaitan")}</div><h2 class="rv">${L("Networks at work — including floods","Rangkaian di tempat kerja — termasuk banjir")}</h2>
<div class="cols c3">
 <div class="card tint rv"><div class="ic">🌊</div><b>${L("Global flood forecasting","Ramalan banjir global")}</b><p class="small">${L("Google's AI model forecasts extreme riverine floods in ungauged basins up to 5 days ahead with reliability similar to or better than current nowcasts (Nearing et al., Nature 2024).","Model AI Google meramal banjir sungai ekstrem di lembangan tanpa tolok sehingga 5 hari lebih awal dengan kebolehpercayaan setanding atau lebih baik daripada ramalan semasa (Nearing et al., Nature 2024).")}</p></div>
 <div class="card rv"><div class="ic">⛈️</div><b>${L("Weather forecasting","Ramalan cuaca")}</b><p class="small">${L("Graph neural networks (GraphCast, Science 2023) produce 10-day global forecasts in under a minute.","Rangkaian neural graf (GraphCast, Science 2023) menghasilkan ramalan global 10 hari dalam masa kurang seminit.")}</p></div>
 <div class="card rv"><div class="ic">🩺</div><b>${L("Medical imaging","Pengimejan perubatan")}</b><p class="small">${L("CNNs flag diabetic retinopathy and lung nodules for clinicians to review.","CNN menandakan retinopati diabetik dan nodul paru-paru untuk disemak klinisian.")}</p></div>
 <div class="card rv"><div class="ic">🌴</div><b>${L("Agriculture","Pertanian")}</b><p class="small">${L("Drone imagery + CNNs detect crop disease and estimate yields.","Imej dron + CNN mengesan penyakit tanaman dan menganggar hasil.")}</p></div>
 <div class="card rv"><div class="ic">🗣️</div><b>${L("Language","Bahasa")}</b><p class="small">${L("Transformers power translation, speech recognition and Malay-language assistants.","Transformer menggerakkan terjemahan, pengecaman pertuturan dan pembantu bahasa Melayu.")}</p></div>
 <div class="card rv"><div class="ic">💳</div><b>${L("Fraud detection","Pengesanan penipuan")}</b><p class="small">${L("Sequence and graph models spot unusual transactions in real time.","Model jujukan dan graf mengesan transaksi luar biasa secara masa nyata.")}</p></div></div>
<div class="call tip rv"><b>${L("Connect to your work","Kaitkan dengan kerja anda")}</b>${L("What data does your organisation already collect that could predict something useful? Who owns it, and did they consent to that use?","Apakah data yang sudah dikumpul organisasi anda yang boleh meramal sesuatu yang berguna? Siapa pemiliknya, dan adakah mereka bersetuju dengan penggunaan itu?")}</div>`});

/* 24 RECENT */
add({sec:S4,t:{en:"Recent advancements",bm:"Kemajuan terkini"},html:`
<div class="kicker rv"><span class="pill new">2024–2026</span> ${L("What's new","Apa yang baharu")}</div><h2 class="rv">${L("Beyond the classic MLP","Melangkaui MLP klasik")}</h2>
<div class="cols c2">
 <div class="call new rv"><b>${L("Kolmogorov–Arnold Networks (ICLR 2025)","Rangkaian Kolmogorov–Arnold (ICLR 2025)")}</b>${L("Learnable activation functions on edges (splines) instead of fixed activations on nodes — smaller, more interpretable models for science tasks.","Fungsi pengaktifan boleh dipelajari pada tepi (splin) dan bukannya pengaktifan tetap pada nod — model lebih kecil dan mudah ditafsir untuk tugasan sains.")} <a href="https://arxiv.org/abs/2404.19756" target="_blank" rel="noopener">arXiv:2404.19756</a></div>
 <div class="call new rv"><b>${L("Liquid networks → on-device foundation models","Rangkaian cecair → model asas pada peranti")}</b>${L("From liquid time-constant networks (AAAI 2021) to LFM2 (2025): compact models (350M–8.3B parameters) designed to run on phones and laptops, keeping data local.","Daripada rangkaian pemalar masa cecair (AAAI 2021) kepada LFM2 (2025): model padat (350J–8.3B parameter) direka untuk berjalan pada telefon dan komputer riba, mengekalkan data setempat.")} <a href="https://arxiv.org/abs/2511.23404" target="_blank" rel="noopener">arXiv:2511.23404</a></div>
 <div class="call new rv"><b>${L("AI for floods and weather","AI untuk banjir dan cuaca")}</b>${L("AI flood forecasts now run operationally in ungauged basins worldwide; ML weather models rival physics models at a fraction of the compute.","Ramalan banjir AI kini beroperasi di lembangan tanpa tolok di seluruh dunia; model cuaca ML menyaingi model fizik dengan sebahagian kecil kos pengiraan.")} <a href="https://doi.org/10.1038/s41586-024-07145-1" target="_blank" rel="noopener">doi:10.1038/s41586-024-07145-1</a></div>
 <div class="call new rv"><b>${L("Physics-informed neural networks","Rangkaian neural berpandukan fizik")}</b>${L("Add the governing equations (e.g. water flow) to the loss, so the network can't break physics — useful when data are scarce.","Tambah persamaan menakluk (cth. aliran air) ke dalam kerugian, supaya rangkaian tidak melanggar hukum fizik — berguna apabila data terhad.")} <a href="https://doi.org/10.1016/j.jcp.2018.10.045" target="_blank" rel="noopener">doi:10.1016/j.jcp.2018.10.045</a></div></div>
<div class="call fact rv"><b>${L("The 2024 Nobel","Nobel 2024")}</b>${L("Physics recognised neural networks: Hopfield's associative memory and Hinton's Boltzmann machine laid foundations for today's deep learning.","Fizik mengiktiraf rangkaian neural: memori bersekutu Hopfield dan mesin Boltzmann Hinton meletakkan asas pembelajaran mendalam masa kini.")} <a href="https://www.nobelprize.org/prizes/physics/2024/press-release/" target="_blank" rel="noopener">nobelprize.org</a></div>`});

/* 25 TOOLS */
add({sec:S4,t:{en:"Companion AI tools",bm:"Alat AI pendamping"},html:`
<div class="kicker rv">🧰 ${L("Companion tools","Alat pendamping")}</div><h2 class="rv">${L("From clicking to coding","Daripada klik ke pengekodan")}</h2>
<table class="t rv"><tr><th>${L("Tool","Alat")}</th><th>${L("Level","Tahap")}</th><th>${L("Use it to…","Gunakan untuk…")}</th><th>${L("Data caution","Awasan data")}</th></tr>
<tr><td><a href="https://playground.tensorflow.org" target="_blank" rel="noopener">TensorFlow Playground</a></td><td><span class="pill l1">L1</span></td><td>${L("See layers, activations, regularisation in action.","Lihat lapisan, pengaktifan, regularisasi berfungsi.")}</td><td>${L("Toy data only.","Data mainan sahaja.")}</td></tr>
<tr><td><a href="https://teachablemachine.withgoogle.com" target="_blank" rel="noopener">Teachable Machine</a></td><td><span class="pill l1">L1</span></td><td>${L("Train image/sound/pose classifiers in the browser.","Latih pengelas imej/bunyi/postur dalam pelayar.")}</td><td>${L("Avoid faces and identifiable people.","Elakkan wajah dan individu yang boleh dikenal pasti.")}</td></tr>
<tr><td><a href="https://orangedatamining.com" target="_blank" rel="noopener">Orange Data Mining</a> · <a href="https://www.knime.com" target="_blank" rel="noopener">KNIME</a></td><td><span class="pill l2">L2</span></td><td>${L("Drag-and-drop workflows: data → neural network → evaluation.","Aliran kerja seret-dan-lepas: data → rangkaian neural → penilaian.")}</td><td>${L("Runs locally — good for sensitive data.","Berjalan setempat — sesuai untuk data sensitif.")}</td></tr>
<tr><td><a href="https://colab.research.google.com" target="_blank" rel="noopener">Google Colab</a> + Gemini</td><td><span class="pill l2">L2</span>/<span class="pill l3">L3</span></td><td>${L("Run Lab B1; ask the assistant to explain or fix code.","Jalankan Makmal B1; minta pembantu menerangkan atau membaiki kod.")}</td><td>${L("Synthetic or anonymised data only.","Data sintetik atau tanpa nama sahaja.")}</td></tr>
<tr><td><a href="https://netron.app" target="_blank" rel="noopener">Netron</a></td><td><span class="pill l1">L1</span></td><td>${L("Visualise a saved model's layers.","Visualkan lapisan model yang disimpan.")}</td><td>${L("Opens files locally in the browser.","Membuka fail secara setempat dalam pelayar.")}</td></tr>
<tr><td>Claude · Gemini · ChatGPT</td><td><span class="pill l1">L1</span></td><td>${L("Explain concepts, generate quizzes, build interactive demos from a precise prompt.","Menerangkan konsep, menjana kuiz, membina demo interaktif daripada prom yang tepat.")}</td><td>${L("Institution-approved accounts; no personal data.","Akaun diluluskan institusi; tiada data peribadi.")}</td></tr>
<tr><td><a href="https://huggingface.co/spaces" target="_blank" rel="noopener">Hugging Face Spaces</a></td><td><span class="pill l1">L1</span></td><td>${L("Try published models (vision, speech, forecasting) in the browser.","Cuba model yang diterbitkan (penglihatan, pertuturan, ramalan) dalam pelayar.")}</td><td>${L("Check each Space's licence and data policy.","Semak lesen dan dasar data setiap Space.")}</td></tr></table>`});

/* 26 ETHICS */
add({sec:S4,t:{en:"Safety, ethics & data protection",bm:"Keselamatan, etika & perlindungan data"},html:`
<div class="kicker rv">🛡️ ${L("Responsible AI","AI bertanggungjawab")}</div><h2 class="rv">${L("Before you train, before you deploy","Sebelum melatih, sebelum menggunakan")}</h2>
<div class="cols c2"><div class="card rv"><h3>✅ SAFE ${L("check for any AI tool","semakan untuk sebarang alat AI")}</h3><ul class="tight">
<li><b>S</b> — ${L("Sensitive? Remove names, IC numbers, addresses, faces; minimise.","Sensitif? Buang nama, nombor KP, alamat, wajah; minimumkan.")}</li>
<li><b>A</b> — ${L("Approved? Use institution-approved tools and accounts.","Diluluskan? Guna alat dan akaun yang diluluskan institusi.")}</li>
<li><b>F</b> — ${L("Fair? Check errors per group and per area (rich vs poor neighbourhoods).","Adil? Semak kesilapan mengikut kumpulan dan kawasan (kejiranan mampu vs kurang mampu).")}</li>
<li><b>E</b> — ${L("Explainable &amp; escalated? A human can explain, override and is accountable.","Boleh diterang &amp; dirujuk? Manusia boleh menerangkan, mengatasi dan bertanggungjawab.")}</li></ul>
<div class="call val"><b>${L("Value: Amanah","Nilai: Amanah")}</b>${L("Data given for one purpose is held in trust — don't repurpose it silently.","Data yang diberi untuk satu tujuan ialah amanah — jangan gunakan semula secara senyap.")}</div></div>
<div class="rv"><div class="call eth"><b>${L("Malaysia","Malaysia")}</b>${L("PDPA amended in 2024 (breach notification, DPOs, portability); AIGE (2024) sets seven voluntary principles for users, policymakers and developers.","PDPA dipinda pada 2024 (pemberitahuan pelanggaran, DPO, kemudahalihan); AIGE (2024) menetapkan tujuh prinsip sukarela untuk pengguna, penggubal dasar dan pembangun.")}</div>
<div class="call eth"><b>${L("International","Antarabangsa")}</b>${L("EU AI Act: prohibitions and AI-literacy duties since Feb 2025; after the 2026 Digital Omnibus, high-risk obligations apply from 2 Dec 2027 (Annex III) and 2 Aug 2028 (Annex I). NIST AI RMF offers a practical risk process.","Akta AI EU: larangan dan kewajipan literasi AI sejak Feb 2025; selepas Omnibus Digital 2026, kewajipan berisiko tinggi terpakai mulai 2 Dis 2027 (Lampiran III) dan 2 Ogos 2028 (Lampiran I). NIST AI RMF menawarkan proses risiko praktikal.")}</div>
<div class="call eth"><b>${L("Safety by design","Keselamatan melalui reka bentuk")}</b>${L("Monitor drift (a new housing estate changes runoff), set a fallback (fuzzy rules on raw sensors if the ANN fails), log every warning.","Pantau hanyutan (taman perumahan baharu mengubah air larian), sediakan sandaran (peraturan kabur pada penderia mentah jika ANN gagal), log setiap amaran.")}</div></div></div>`,
 notes:{en:"<p>Watch for subtle bias: gauges are denser in wealthier, better-drained areas, so a model may be most accurate where it is least needed. Report metrics per area.</p>",bm:"<p>Awasi bias halus: tolok lebih padat di kawasan mampu dan bersaliran baik, jadi model mungkin paling tepat di tempat yang paling kurang memerlukannya. Laporkan metrik mengikut kawasan.</p>"}});

/* 27 QUIZ D */
add({sec:S4,t:{en:"Checkpoint D (integrative)",bm:"Titik semak D (bersepadu)"},noAutoDone:true,html:`
<div class="kicker rv">✅ ${L("Formative assessment","Pentaksiran formatif")} · 6 ${L("items","item")} · ~10 min</div><h2 class="rv">${L("Checkpoint D — fuzzy + neural + ethics","Titik semak D — kabur + neural + etika")}</h2>
<div class="rv">${quiz({id:"anD",items:[
 {q:{en:"Training loss keeps falling while validation loss rises after epoch 40. You should…",bm:"Kerugian latihan terus menurun manakala kerugian pengesahan meningkat selepas epok 40. Anda patut…"},o:[{en:"train longer",bm:"latih lebih lama"},{en:"stop near epoch 40 and/or regularise",bm:"henti hampir epok 40 dan/atau regularisasi"},{en:"add more neurons",bm:"tambah lebih banyak neuron"},{en:"evaluate on the training set",bm:"nilai pada set latihan"}],a:1,why:{en:"Classic overfitting — early stopping, dropout or weight decay.",bm:"Lebih suai klasik — henti awal, dropout atau susutan pemberat."}},
 {q:{en:"A team fits StandardScaler on all data, then splits train/test. The problem is…",bm:"Satu pasukan memuatkan StandardScaler pada semua data, kemudian membahagi latihan/ujian. Masalahnya ialah…"},o:[{en:"none",bm:"tiada"},{en:"data leakage from the test set",bm:"kebocoran data daripada set ujian"},{en:"too little scaling",bm:"penskalaan terlalu sedikit"},{en:"vanishing gradients",bm:"kecerunan lenyap"}],a:1,why:{en:"Test statistics leak into training; fit preprocessing on the training split only.",bm:"Statistik ujian bocor ke dalam latihan; muatkan prapemprosesan pada bahagian latihan sahaja."}},
 {q:{en:"Missing a flood is far worse than a false alarm. Which metric should drive the threshold?",bm:"Banjir terlepas jauh lebih buruk daripada amaran palsu. Metrik manakah patut menentukan ambang?"},o:[{en:"Accuracy",bm:"Ketepatan"},{en:"Recall (sensitivity)",bm:"Dapatan semula (sensitiviti)"},{en:"Precision only",bm:"Kepersisan sahaja"},{en:"Training loss",bm:"Kerugian latihan"}],a:1,why:{en:"Recall measures the share of real floods caught; then manage the false-alarm cost with residents.",bm:"Dapatan semula mengukur bahagian banjir sebenar yang dikesan; kemudian urus kos amaran palsu bersama penduduk."}},
 {q:{en:"ANFIS combines…",bm:"ANFIS menggabungkan…"},o:[{en:"two CNNs",bm:"dua CNN"},{en:"a Sugeno fuzzy rule structure with neural-style parameter learning",bm:"struktur peraturan kabur Sugeno dengan pembelajaran parameter gaya neural"},{en:"type-2 sets with GANs",bm:"set jenis-2 dengan GAN"},{en:"decision trees and SVMs",bm:"pepohon keputusan dan SVM"}],a:1,why:{en:"Jang (1993): readable rules whose membership functions and consequents are learned from data.",bm:"Jang (1993): peraturan boleh dibaca yang fungsi keahlian dan akibatnya dipelajari daripada data."}},
 {q:{en:"How do Kolmogorov–Arnold Networks differ from MLPs?",bm:"Bagaimanakah Rangkaian Kolmogorov–Arnold berbeza daripada MLP?"},o:[{en:"They have no training",bm:"Ia tiada latihan"},{en:"Learnable activation functions sit on edges instead of fixed ones on nodes",bm:"Fungsi pengaktifan boleh dipelajari terletak pada tepi dan bukan fungsi tetap pada nod"},{en:"They only work on images",bm:"Ia hanya berfungsi pada imej"},{en:"They use fuzzy rules",bm:"Ia menggunakan peraturan kabur"}],a:1,why:{en:"KANs replace linear weights with learnable univariate spline functions (Liu et al., ICLR 2025).",bm:"KAN menggantikan pemberat linear dengan fungsi splin univariat boleh dipelajari (Liu et al., ICLR 2025)."}},
 {q:{en:"You want an AI assistant to help analyse residents' flood-report forms. First you should…",bm:"Anda mahu pembantu AI membantu menganalisis borang laporan banjir penduduk. Perkara pertama yang patut dilakukan ialah…"},o:[{en:"upload everything — it's for research",bm:"muat naik semuanya — ia untuk penyelidikan"},{en:"remove identifiers, minimise fields and use an approved tool within the consent given",bm:"buang pengecam, minimumkan medan dan guna alat diluluskan dalam lingkungan persetujuan yang diberi"},{en:"ask the AI whether it is safe",bm:"tanya AI sama ada ia selamat"},{en:"share it publicly for transparency",bm:"kongsi secara terbuka demi ketelusan"}],a:1,why:{en:"PDPA and AIGE: purpose limitation, data minimisation, security and accountability come first.",bm:"PDPA dan AIGE: had tujuan, peminimuman data, keselamatan dan akauntabiliti didahulukan."}}]})}</div>`});

/* 28 STUDIO 2 */
add({sec:S4,t:{en:"Design studio 2: hybrid prototype",bm:"Studio reka bentuk 2: prototaip hibrid"},html:`
${dt([3,4])}<div class="kicker rv">🎨 ${L("Team challenge · 30 min","Cabaran pasukan · 30 minit")}</div><h2 class="rv">${L("Prototype &amp; test a hybrid early-warning concept","Bina prototaip &amp; uji konsep amaran awal hibrid")}</h2>
<div class="cols c2"><div class="rv"><svg viewBox="0 0 520 180" style="width:100%">
 ${[["📡 Sensors","📡 Penderia",10],["🧠 ANN forecast","🧠 Ramalan ANN",140],["📏 Fuzzy risk rules","📏 Peraturan risiko kabur",270],["👷 Officer decides","👷 Pegawai putuskan",400]].map((b,i)=>`<rect x="${b[2]}" y="50" width="110" height="64" rx="14" fill="var(--bg2)" stroke="${i%2?"var(--a2)":"var(--a1)"}" stroke-width="2.5"/><text x="${b[2]+55}" y="87" text-anchor="middle" font-size="11.5" style="fill:var(--ink)"><tspan class="en">${b[0]}</tspan><tspan class="bm">${b[1]}</tspan></text>${i<3?`<line x1="${b[2]+112}" y1="82" x2="${b[2]+138}" y2="82" stroke="var(--a1)" stroke-width="3"/>`:""}`).join("")}
 <text x="260" y="150" text-anchor="middle" font-size="12" style="fill:var(--a1)"><tspan class="en">forecast level + rain → readable risk → accountable human</tspan><tspan class="bm">paras ramalan + hujan → risiko boleh dibaca → manusia bertanggungjawab</tspan></text></svg>
<div class="card"><h3>${L("Steps","Langkah")}</h3><ol class="tight small"><li>${L("Reuse your Studio 1 rule base; replace “river level now” with “forecast level in 3 h”.","Guna semula pangkalan peraturan Studio 1; ganti “paras sungai sekarang” dengan “paras ramalan 3 jam”.")}</li>
<li>${L("Prototype with no code: Lab B1 (L1) for the ANN idea, the Module A simulator for the rules, or one AI-assistant prompt that builds both.","Bina prototaip tanpa kod: Makmal B1 (T1) untuk idea ANN, simulator Modul A untuk peraturan, atau satu prom pembantu AI yang membina kedua-duanya.")}</li>
<li>${L("Test with 3 scenarios: ordinary rain, flash storm, faulty sensor.","Uji dengan 3 senario: hujan biasa, ribut kilat, penderia rosak.")}</li>
<li>${L("Complete the ethics impact check (below) and a 90-second pitch.","Lengkapkan semakan impak etika (di bawah) dan pitch 90 saat.")}</li></ol></div></div>
<div class="rv"><table class="t small"><tr><th>${L("Ethics impact check","Semakan impak etika")}</th></tr>
<tr><td>${L("Who benefits? Who could be harmed by a miss / a false alarm?","Siapa mendapat manfaat? Siapa boleh dirugikan oleh terlepas / amaran palsu?")}</td></tr>
<tr><td>${L("What personal data, if any? Consent? Retention period?","Data peribadi apa, jika ada? Persetujuan? Tempoh simpanan?")}</td></tr>
<tr><td>${L("Which AIGE principle is most at risk, and your mitigation?","Prinsip AIGE mana paling berisiko, dan mitigasi anda?")}</td></tr>
<tr><td>${L("Fallback when the model or a sensor fails?","Sandaran apabila model atau penderia gagal?")}</td></tr></table>
<table class="t small" style="margin-top:10px"><tr><th>${L("Rubric (4 marks each, 16 total)","Rubrik (4 markah setiap satu, jumlah 16)")}</th></tr>
<tr><td>${L("Integration: ANN and fuzzy roles are clear and justified","Integrasi: peranan ANN dan kabur jelas dan diwajarkan")}</td></tr><tr><td>${L("Testing: scenarios, metrics and a stated threshold trade-off","Pengujian: senario, metrik dan pertukaran ambang yang dinyatakan")}</td></tr>
<tr><td>${L("Responsibility: privacy, fairness, human oversight, fallback","Tanggungjawab: privasi, keadilan, pengawasan manusia, sandaran")}</td></tr><tr><td>${L("Communication: a resident could understand the warning","Komunikasi: penduduk boleh memahami amaran")}</td></tr></table></div></div>`});

/* 29 EXIT TICKET */
add({sec:S4,t:{en:"Exit ticket",bm:"Tiket keluar"},html:`
<div class="kicker rv">🎟️ ${L("Reflect","Refleksi")} · 5 min</div><h2 class="rv">3 · 2 · 1</h2>
<div class="cols c3"><div class="card tint rv"><div class="big grad">3</div><b>${L("things you learned today","perkara yang anda pelajari hari ini")}</b><textarea id="x3" rows="4" style="width:100%;margin-top:8px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:8px"></textarea></div>
<div class="card tint rv"><div class="big grad">2</div><b>${L("ways you'll apply them at work","cara anda akan mengaplikasikannya di tempat kerja")}</b><textarea id="x2" rows="4" style="width:100%;margin-top:8px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:8px"></textarea></div>
<div class="card tint rv"><div class="big grad">1</div><b>${L("question you still have","soalan yang masih ada")}</b><textarea id="x1" rows="4" style="width:100%;margin-top:8px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:8px"></textarea></div></div>
<div class="rv" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="xcopy">📋 ${L("Copy my reflection","Salin refleksi saya")}</button><span class="small muted">${L("Saved only in this browser. Paste into your course portfolio.","Disimpan dalam pelayar ini sahaja. Tampal ke portfolio kursus anda.")}</span></div>`,
 init(el){["x3","x2","x1"].forEach(id=>{const t=el.querySelector("#"+id);t.value=T6544.store.get("tttc6544:exit:"+id,"");t.oninput=()=>T6544.store.set("tttc6544:exit:"+id,t.value)});
  el.querySelector("#xcopy").onclick=async()=>{const s=`3: ${el.querySelector("#x3").value}\n2: ${el.querySelector("#x2").value}\n1: ${el.querySelector("#x1").value}`;const ok=await T6544.copyText(s);T6544.toast(ok?tx("Copied ✓","Disalin ✓"):tx("Select and copy manually","Pilih dan salin secara manual"))}}});

/* 30 RESOURCES */
add({sec:S4,t:{en:"Resources & further reading",bm:"Sumber & bacaan lanjut"},html:`
<div class="kicker rv">📚 ${L("Primary sources (with DOI)","Sumber primer (dengan DOI)")}</div><h2 class="rv">${L("Read deeper","Baca lebih mendalam")}</h2>
<div class="cols c2"><ol class="refs rv">
${ref("McCulloch, W. S., &amp; Pitts, W. (1943). A logical calculus of the ideas immanent in nervous activity. <i>Bull. Math. Biophysics</i>, 5, 115–133.","https://doi.org/10.1007/BF02478259")}
${ref("Rosenblatt, F. (1958). The perceptron. <i>Psychological Review</i>, 65(6), 386–408.","https://doi.org/10.1037/h0042519")}
${ref("Rumelhart, D. E., Hinton, G. E., &amp; Williams, R. J. (1986). Learning representations by back-propagating errors. <i>Nature</i>, 323, 533–536.","https://doi.org/10.1038/323533a0")}
${ref("Hornik, K., Stinchcombe, M., &amp; White, H. (1989). Multilayer feedforward networks are universal approximators. <i>Neural Networks</i>, 2(5), 359–366.","https://doi.org/10.1016/0893-6080(89)90020-8")}
${ref("Hochreiter, S., &amp; Schmidhuber, J. (1997). Long short-term memory. <i>Neural Computation</i>, 9(8), 1735–1780.","https://doi.org/10.1162/neco.1997.9.8.1735")}
${ref("LeCun, Y., Bengio, Y., &amp; Hinton, G. (2015). Deep learning. <i>Nature</i>, 521, 436–444.","https://doi.org/10.1038/nature14539")}
${ref("Vaswani, A., et al. (2017). Attention is all you need.","https://arxiv.org/abs/1706.03762")}
${ref("Raissi, M., Perdikaris, P., &amp; Karniadakis, G. E. (2019). Physics-informed neural networks. <i>J. Computational Physics</i>, 378, 686–707.","https://doi.org/10.1016/j.jcp.2018.10.045")}</ol>
<ol class="refs rv" start="9">
${ref("Hasani, R., et al. (2021). Liquid time-constant networks. <i>AAAI</i>, 35(9), 7657–7666.","https://doi.org/10.1609/aaai.v35i9.16936")}
${ref("Lam, R., et al. (2023). Learning skillful medium-range global weather forecasting. <i>Science</i>, 382, 1416–1421.","https://doi.org/10.1126/science.adi2336")}
${ref("Nearing, G., et al. (2024). Global prediction of extreme floods in ungauged watersheds. <i>Nature</i>, 627, 559–563.","https://doi.org/10.1038/s41586-024-07145-1")}
${ref("Liu, Z., et al. (2025). KAN: Kolmogorov–Arnold Networks. <i>ICLR 2025</i>.","https://arxiv.org/abs/2404.19756")}
${ref("Liquid AI (2025). LFM2 Technical Report.","https://arxiv.org/abs/2511.23404")}
${ref("Mitchell, M., et al. (2019). Model cards for model reporting. <i>FAT* '19</i>.","https://doi.org/10.1145/3287560.3287596")}
${ref("NIST (2023). AI Risk Management Framework (AI RMF 1.0).","https://doi.org/10.6028/NIST.AI.100-1")}
${ref("Regulation (EU) 2024/1689 (Artificial Intelligence Act).","https://eur-lex.europa.eu/eli/reg/2024/1689/oj")}
${ref("Nobel Prize in Physics 2024 — press release.","https://www.nobelprize.org/prizes/physics/2024/press-release/")}</ol></div>
<div class="call tip rv"><b>${L("Further topics","Topik lanjutan")}</b>${L("Convolution and pooling · attention and transformers · regularisation (dropout: Srivastava et al., 2014) · optimisers (Adam: Kingma &amp; Ba, 2015) · uncertainty quantification (MC dropout, conformal prediction) · federated learning for privacy · neuromorphic computing.","Konvolusi dan pengumpulan · perhatian dan transformer · regularisasi (dropout: Srivastava et al., 2014) · pengoptimum (Adam: Kingma &amp; Ba, 2015) · kuantifikasi ketidakpastian (MC dropout, ramalan konformal) · pembelajaran teragih untuk privasi · pengkomputeran neuromorfik.")}</div>`});

/* 31 RECAP */
add({sec:S4,t:{en:"Recap",bm:"Rumusan"},html:`
<div class="kicker rv">🏁 ${L("Recap","Rumusan")}</div><h2 class="rv">${L("Remember the day in three lines","Ingati hari ini dalam tiga baris")}</h2>
<div class="cols c3">
 <div class="card tint rv"><div class="big grad">Σφ</div><b>${L("A neuron = weighted sum + bend","Neuron = hasil tambah berpemberat + lenturan")}</b><p class="small">${L("Hidden layers stack bends to model complex patterns.","Lapisan tersembunyi menindan lenturan untuk memodelkan corak kompleks.")}</p></div>
 <div class="card tint rv"><div class="big grad">∂L/∂w</div><b>${L("Learning = descending the loss","Belajar = menuruni kerugian")}</b><p class="small">${L("Backprop finds the slope; the learning rate sets the stride.","Rambatan balik mencari cerun; kadar pembelajaran menetapkan langkah.")}</p></div>
 <div class="card tint rv"><div class="big grad">μ + ŷ</div><b>${L("Forecast with data, decide with words","Ramal dengan data, putuskan dengan kata")}</b><p class="small">${L("Neural accuracy + fuzzy transparency + accountable humans.","Ketepatan neural + ketelusan kabur + manusia bertanggungjawab.")}</p></div></div>
<p class="lead rv">${L("Back to the start: would you now warn Mak Som at 4:40 pm? What evidence would you show her?","Kembali ke permulaan: adakah anda kini akan memberi amaran kepada Mak Som pada 4:40 petang? Bukti apa yang akan anda tunjukkan kepadanya?")}</p>
<p class="rv"><a class="btn" href="deck-fuzzy.html">← ${L("Module A","Modul A")}</a> <a class="btn" href="deck-ann-math.html">∂ ${L("Maths of neural networks","Matematik rangkaian neural")}</a> <a class="btn pri" href="index.html">🏠 ${L("Course hub &amp; guide","Hab kursus &amp; panduan")}</a></p>`});

T6544.start({key:"ann",title:{en:"Module B · Artificial Neural Networks",bm:"Modul B · Rangkaian Neural Buatan"},hub:"index.html",twin:{href:"deck-ann-math.html",label:{en:"∂ Maths deck",bm:"∂ Dek matematik"}},slides});
})();
