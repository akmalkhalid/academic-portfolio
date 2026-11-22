/* Module A-M — The mathematics of fuzzy logic (Type-1 & interval Type-2) */
(function(){
const {L,LL,OL,quiz,plot,css,tx,mountSteps,practice}=T6544;
const tri=(x,a,b,c)=>Math.max(0,Math.min(b>a?(x-a)/(b-a):(x>=a?1:0),c>b?(c-x)/(c-b):(x<=c?1:0)));
const trap=(x,a,b,c,d)=>Math.max(0,Math.min(b>a?(x-a)/(b-a):(x>=a?1:0),1,d>c?(d-x)/(d-c):(x<=d?1:0)));
const f2=v=>(+v).toFixed(2),f3=v=>(+v).toFixed(3);
const C=()=>({a1:css("--a1"),a2:css("--a2"),acc:css("--acc"),ink:css("--ink2"),ok:css("--ok"),bad:css("--bad"),warn:css("--warn")});
const slider=(id,lab,min,max,v,step=1)=>`<label class="ctrl"><span>${lab}</span><input type="range" id="${id}" min="${min}" max="${max}" value="${v}" step="${step}"><output id="${id}o">${v}</output></label>`;
const bind=(el,ids,fn)=>{ids.forEach(i=>{const s=el.querySelector("#"+i);s.oninput=()=>{const o=el.querySelector("#"+i+"o");if(o)o.textContent=s.value;fn()}});fn()};
const val=(el,id)=>+el.querySelector("#"+id).value;
const rnd=(a,b,s=1)=>Math.round((a+Math.random()*(b-a))/s)*s;
const MF={rain:{light:[0,0,10,30],moderate:[10,35,35,60],heavy:[40,70,100,100]},level:{normal:[0,0,40,60],alert:[40,65,65,85],danger:[70,90,100,100]},risk:{low:[0,0,20,40],medium:[25,50,50,75],high:[60,80,100,100]}};
const mu=(p,x)=>trap(x,...p);
const RULES=[["light","normal","low"],["light","alert","medium"],["light","danger","high"],["moderate","normal","low"],["moderate","alert","medium"],["moderate","danger","high"],["heavy","normal","medium"],["heavy","alert","high"],["heavy","danger","high"]];
const NM={light:["Light","Ringan"],moderate:["Moderate","Sederhana"],heavy:["Heavy","Lebat"],normal:["Normal","Normal"],alert:["Alert","Waspada"],danger:["Danger","Bahaya"],low:["Low","Rendah"],medium:["Medium","Sederhana"],high:["High","Tinggi"]};
const nm=k=>tx(NM[k][0],NM[k][1]);
const S0={en:"Foundations",bm:"Asas"},S1={en:"Type-1 inference maths",bm:"Matematik inferens Jenis-1"},S2={en:"Interval Type-2 maths",bm:"Matematik Jenis-2 selang"},S3={en:"Check & consolidate",bm:"Semak & kukuhkan"};
const slides=[];const add=s=>slides.push(s);

/* KM iterative (Karnik–Mendel 2001) with full trace */
function kmTrace(y,fl,fu,side){const o=y.map((_,i)=>i).sort((a,b)=>y[a]-y[b]);const Y=o.map(i=>y[i]),FL=o.map(i=>fl[i]),FU=o.map(i=>fu[i]),N=Y.length;
  const wavg=w=>{const s=w.reduce((a,b)=>a+b,0);return s?w.reduce((a,v,i)=>a+v*Y[i],0)/s:NaN};
  let yp=wavg(FL.map((v,i)=>(v+FU[i])/2));const it=[];for(let n=0;n<20;n++){let k=0;for(let i=0;i<N-1;i++)if(Y[i]<=yp+1e-12&&yp<=Y[i+1]+1e-12){k=i+1;break}
   if(yp>=Y[N-1])k=N;const w=Y.map((_,i)=>side==="l"?(i<k?FU[i]:FL[i]):(i<k?FL[i]:FU[i]));const yn=wavg(w);it.push({yp,k,w,yn});if(Math.abs(yn-yp)<1e-9)break;yp=yn}
  return {Y,FL,FU,it,val:it[it.length-1].yn}}

/* 1 TITLE */
add({sec:S0,t:{en:"Title",bm:"Tajuk"},html:`
<div class="cols c2" style="align-items:center"><div><div class="kicker rv">TTTC6544 · ${L("Module A-M","Modul A-M")} · ${L("Mathematics companion","Pendamping matematik")}</div>
<h1 class="big rv"><span class="grad">${L("The maths of","Matematik")}</span><br>${L("fuzzy logic","logik kabur")}</h1>
<p class="lead rv">${L("Every formula behind Type-1 and interval Type-2 systems — with step-by-step solvers you can drive and a practice generator that never runs out of questions.","Setiap formula di sebalik sistem Jenis-1 dan Jenis-2 selang — dengan penyelesai langkah demi langkah yang boleh anda kawal dan penjana latihan yang tidak pernah kehabisan soalan.")}</p>
<div class="rv" style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill">${L("Step solvers","Penyelesai langkah")}</span><span class="pill">${L("Editable matrices","Matriks boleh suntin")}</span><span class="pill">${L("KM iteration stepper","Pelangkah lelaran KM")}</span><span class="pill">${L("Practice generator","Penjana latihan")}</span></div></div>
<div class="rv sim"><div class="eq">μ<sub>A∩B</sub>(x) = min(μ<sub>A</sub>(x), μ<sub>B</sub>(x))</div><div class="eq">T = R ∘ S : T(i,k) = max<sub>j</sub> min(R(i,j), S(j,k))</div><div class="eq">y* = Σ μ(y)·y / Σ μ(y)</div><div class="eq">y<sub>l</sub> = min<sub>k</sub> (Σ<sub>i≤k</sub> f̄<sub>i</sub>y<sub>i</sub> + Σ<sub>i&gt;k</sub> f̲<sub>i</sub>y<sub>i</sub>) / (Σ<sub>i≤k</sub> f̄<sub>i</sub> + Σ<sub>i&gt;k</sub> f̲<sub>i</sub>)</div></div></div>`,
 notes:{en:"<p>Use this deck alongside Module A. Each slide states the formula, shows it applied to the same flood example, and lets you change the numbers. The practice generators produce unlimited problems with worked solutions.</p>",bm:"<p>Gunakan dek ini bersama Modul A. Setiap slaid menyatakan formula, menunjukkannya pada contoh banjir yang sama, dan membenarkan anda mengubah nombor. Penjana latihan menghasilkan soalan tanpa had dengan penyelesaian.</p>"}});

/* 2 NOTATION */
add({sec:S0,t:{en:"Notation & roadmap",bm:"Tatatanda & peta jalan"},html:`
<div class="kicker rv">🔣 ${L("Notation","Tatatanda")}</div><h2 class="rv">${L("The symbols you'll meet","Simbol yang akan anda temui")}</h2>
<div class="cols c2"><table class="t rv"><tr><th>${L("Symbol","Simbol")}</th><th>${L("Meaning","Maksud")}</th></tr>
<tr><td>X</td><td>${L("universe of discourse (e.g. rain 0–100 mm/h)","semesta wacana (cth. hujan 0–100 mm/j)")}</td></tr>
<tr><td>μ<sub>A</sub>(x)</td><td>${L("membership of x in fuzzy set A, in [0,1]","keahlian x dalam set kabur A, dalam [0,1]")}</td></tr>
<tr><td>A = Σ μ<sub>A</sub>(x<sub>i</sub>)/x<sub>i</sub></td><td>${L("discrete set (“/” pairs a grade with an element — not division)","set diskret (“/” memasangkan gred dengan unsur — bukan bahagi)")}</td></tr>
<tr><td>A<sub>α</sub></td><td>${L("α-cut: {x | μ<sub>A</sub>(x) ≥ α}","potongan-α: {x | μ<sub>A</sub>(x) ≥ α}")}</td></tr>
<tr><td>T, S</td><td>${L("t-norm (AND), t-conorm (OR)","norma-t (DAN), konorma-t (ATAU)")}</td></tr>
<tr><td>f<sub>i</sub></td><td>${L("firing strength of rule i","kekuatan nyalaan peraturan i")}</td></tr>
<tr><td>μ̲, μ̄ · f̲, f̄</td><td>${L("lower / upper membership and firing (Type-2)","keahlian dan nyalaan bawah / atas (Jenis-2)")}</td></tr>
<tr><td>[y<sub>l</sub>, y<sub>r</sub>]</td><td>${L("type-reduced interval","selang terturun jenis")}</td></tr></table>
<div class="rv"><div class="card"><h3>${L("Roadmap","Peta jalan")}</h3><ol class="tight">
<li>${L("Sets, operations, α-cuts, extension principle","Set, operasi, potongan-α, prinsip lanjutan")}</li><li>${L("Relations &amp; composition — the algebra of rules","Hubungan &amp; gubahan — algebra peraturan")}</li>
<li>${L("Implication, aggregation, centroid (discrete &amp; continuous)","Implikasi, agregat, sentroid (diskret &amp; selanjar)")}</li><li>${L("First-order Sugeno","Sugeno tertib pertama")}</li>
<li>${L("IT2: firing intervals, Karnik–Mendel, closed-form alternatives","IT2: selang nyalaan, Karnik–Mendel, alternatif bentuk tertutup")}</li></ol></div>
<div class="call tip"><b>${L("How to study","Cara belajar")}</b>${L("Predict the next step before pressing “Next step”. Then check yourself with the practice generator at the end of each section.","Ramal langkah seterusnya sebelum menekan “Langkah seterusnya”. Kemudian uji diri dengan penjana latihan di akhir setiap bahagian.")}</div></div></div>`});

/* 3 DISCRETE SET CALCULATOR */
add({sec:S0,t:{en:"Discrete set operations",bm:"Operasi set diskret"},html:`
<div class="kicker rv">🧮 ${L("Calculator","Kalkulator")}</div><h2 class="rv">${L("Operate on fuzzy sets element by element","Kendalikan set kabur unsur demi unsur")}</h2>
<div class="cols c2"><div class="sim rv"><p class="small muted">${L("Edit the grades (0–1). X = river level bands.","Ubah gred (0–1). X = jalur paras sungai.")}</p><div id="dsin"></div>${slider("dsa",L("α for the α-cut","α untuk potongan-α"),0,1,.5,.05)}<svg id="dsp"></svg></div>
<div class="rv"><div id="dst"></div><div class="readout" id="dsr"></div><div class="call fact"><b>${L("Formulas","Formula")}</b><span class="mono">|A| = Σμ<sub>A</sub>(x) · h(A) = max μ<sub>A</sub> · S(A,B) = |A∩B| / |A|</span><br>${L("S(A,B) is subsethood: how much A is contained in B.","S(A,B) ialah darjah subset: sejauh mana A terkandung dalam B.")}</div></div></div>`,
 notes:{en:"<p>Sigma-count |A| generalises cardinality. Subsethood S(A,B) (Kosko) equals 1 exactly when μ<sub>A</sub>(x) ≤ μ<sub>B</sub>(x) everywhere. Try making A ⊆ B and watch S become 1.</p>",bm:"<p>Kiraan sigma |A| mengitlakkan kekardinalan. Darjah subset S(A,B) (Kosko) bernilai 1 tepat apabila μ<sub>A</sub>(x) ≤ μ<sub>B</sub>(x) di semua titik. Cuba jadikan A ⊆ B dan lihat S menjadi 1.</p>"},
 init(el){const X=["20%","40%","60%","80%","100%"],A=[0,.2,.7,1,.6],B=[.1,.5,.9,.8,.3];this.d={X,A,B};
  el.querySelector("#dsin").innerHTML=`<table class="mtx"><tr><th>x</th>${X.map(x=>`<th>${x}</th>`).join("")}</tr><tr><th>μA</th>${A.map((v,i)=>`<td><input class="cell-in" data-s="A" data-i="${i}" type="number" min="0" max="1" step=".1" value="${v}"></td>`).join("")}</tr><tr><th>μB</th>${B.map((v,i)=>`<td><input class="cell-in" data-s="B" data-i="${i}" type="number" min="0" max="1" step=".1" value="${v}"></td>`).join("")}</tr></table>`;
  el.querySelectorAll(".cell-in").forEach(c=>c.oninput=()=>{this.d[c.dataset.s][+c.dataset.i]=Math.max(0,Math.min(1,+c.value||0));this.show(el)});bind(el,["dsa"],()=>this.show(el))},
 show(el){const {X,A,B}=this.d,a=val(el,"dsa"),c=C();const rows=[["A∪B · max",A.map((v,i)=>Math.max(v,B[i]))],["A∩B · min",A.map((v,i)=>Math.min(v,B[i]))],["¬A · 1−μ",A.map(v=>1-v)],["A·B",A.map((v,i)=>v*B[i])],["A+B−A·B",A.map((v,i)=>v+B[i]-v*B[i])],[tx("very A · μ²","sangat A · μ²"),A.map(v=>v*v)]];
  el.querySelector("#dst").innerHTML=`<table class="t small" style="text-align:center"><tr><th></th>${X.map(x=>`<th>${x}</th>`).join("")}</tr>${rows.map(r=>`<tr><td style="text-align:left">${r[0]}</td>${r[1].map(v=>`<td class="mono">${f2(v)}</td>`).join("")}</tr>`).join("")}</table>`;
  const sA=A.reduce((s,v)=>s+v,0),sI=A.reduce((s,v,i)=>s+Math.min(v,B[i]),0),cut=X.filter((x,i)=>A[i]>=a-1e-9);
  el.querySelector("#dsr").innerHTML=`<span class="r"><b>|A|</b>${f2(sA)}</span><span class="r"><b>h(A)</b>${f2(Math.max(...A))}</span><span class="r"><b>supp(A)</b>{${X.filter((x,i)=>A[i]>0).join(", ")}}</span><span class="r"><b>core(A)</b>{${X.filter((x,i)=>A[i]>=1).join(", ")||"∅"}}</span><span class="r"><b>A<sub>${a}</sub></b>{${cut.join(", ")||"∅"}}</span><span class="r"><b>S(A,B)</b>${sA?f2(sI/sA):"—"}</span>`;
  const P=plot(el.querySelector("#dsp"),{x0:-.5,x1:4.5,y0:0,y1:1.05,w:520,h:200,pad:{l:30,r:10,t:10,b:28}});P.clear();P.axes("","μ",[],[0,.5,1]);
  X.forEach((x,i)=>{P.el("rect",{x:P.X(i-.32),width:P.X(.3)-P.X(0),y:P.Y(A[i]),height:P.Y(0)-P.Y(A[i]),fill:c.a1});P.el("rect",{x:P.X(i+.02),width:P.X(.3)-P.X(0),y:P.Y(B[i]),height:P.Y(0)-P.Y(B[i]),fill:c.acc});P.el("text",{x:P.X(i),y:P.H-8,"text-anchor":"middle","font-size":11}).textContent=x});
  P.el("line",{x1:P.X(-.5),x2:P.X(4.5),y1:P.Y(a),y2:P.Y(a),stroke:c.a2,"stroke-width":2,"stroke-dasharray":"5 4"})}});

/* 4 MF STEP SOLVER */
add({sec:S0,t:{en:"Evaluating a membership function",bm:"Menilai fungsi keahlian"},html:`
<div class="kicker rv">🪜 ${L("Step solver","Penyelesai langkah")}</div><h2 class="rv">${L("Piecewise formulas, one case at a time","Formula cebisan, satu kes pada satu masa")}</h2>
<div class="cols c2"><div class="rv"><div class="eq">tri(x; a,b,c) = 0 if x≤a · (x−a)/(b−a) if a&lt;x≤b · (c−x)/(c−b) if b&lt;x&lt;c · 0 if x≥c</div>
<div class="sim">${slider("ma","a",0,100,10)}${slider("mb","b",0,100,35)}${slider("mc","c",0,100,60)}${slider("mx","x",0,100,45)}<svg id="msv"></svg></div></div>
<div class="rv"><div id="mst"></div><div id="mpr" style="margin-top:12px"></div></div></div>`,
 init(el){bind(el,["ma","mb","mc","mx"],()=>this.show(el));
  practice(el.querySelector("#mpr"),()=>{const a=rnd(0,40,5),b=a+rnd(10,30,5),c=b+rnd(10,30,5),x=rnd(a,c,1),m=tri(x,a,b,c);return {lv:"l1",q:L(`Compute μ(${x}) for tri(${a}, ${b}, ${c}).`,`Kira μ(${x}) bagi tri(${a}, ${b}, ${c}).`),ans:m,tol:.01,
   sol:`<div class="eq">${x<=a||x>=c?`x outside (a, c) → μ = 0`:x<=b?`(x−a)/(b−a) = (${x}−${a})/(${b}−${a}) = ${f3(m)}`:`(c−x)/(c−b) = (${c}−${x})/(${c}−${b}) = ${f3(m)}`}</div>`}})},
 show(el){let [a,b,c]=[val(el,"ma"),val(el,"mb"),val(el,"mc")].sort((p,q)=>p-q);const x=val(el,"mx"),m=tri(x,a,b,c),col=C();
  const steps=[L(`Sort the parameters so a ≤ b ≤ c: <span class="mono">a=${a}, b=${b}, c=${c}</span>.`,`Susun parameter supaya a ≤ b ≤ c: <span class="mono">a=${a}, b=${b}, c=${c}</span>.`),
   L(`Locate x = ${x}: ${x<=a?"x ≤ a (left of the support)":x<=b?"a &lt; x ≤ b (rising edge)":x<c?"b &lt; x &lt; c (falling edge)":"x ≥ c (right of the support)"}.`,`Kedudukan x = ${x}: ${x<=a?"x ≤ a (kiri sokongan)":x<=b?"a &lt; x ≤ b (tepi menaik)":x<c?"b &lt; x &lt; c (tepi menurun)":"x ≥ c (kanan sokongan)"}.`),
   `<span class="mono">${x<=a||x>=c?"μ = 0":x<=b?`μ = (x−a)/(b−a) = (${x}−${a})/(${b}−${a}) = ${x-a}/${b-a||1}`:`μ = (c−x)/(c−b) = (${c}−${x})/(${c}−${b}) = ${c-x}/${c-b||1}`}</span>`,
   `<b>μ(${x}) = ${f3(m)}</b> — ${L("cross-check on the plot: the dot sits at this height.","semak silang pada plot: titik berada pada ketinggian ini.")}`];
  mountSteps(el.querySelector("#mst"),steps);
  const P=plot(el.querySelector("#msv"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:200,pad:{l:30,r:10,t:10,b:28}});P.clear();P.axes("x","μ",[0,a,b,c,100].filter((v,i,s)=>s.indexOf(v)===i),[0,.5,1]);
  P.el("path",{d:P.path(z=>tri(z,a,b,c),300),fill:"none",stroke:col.a1,"stroke-width":3});P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(0),y2:P.Y(m),stroke:col.a2,"stroke-width":2});P.el("circle",{cx:P.X(x),cy:P.Y(m),r:6,fill:col.a2})}});

/* 5 ALPHA CUTS */
add({sec:S0,t:{en:"α-cuts & the resolution principle",bm:"Potongan-α & prinsip resolusi"},html:`
<div class="kicker rv">✂️ ${L("Concepts + calculator","Konsep + kalkulator")}</div><h2 class="rv">${L("Slice a fuzzy set into crisp intervals","Hiris set kabur kepada selang rangup")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="acs"></svg>${slider("aa","α",0,1,.4,.05)}${slider("an",L("Number of slices","Bilangan hirisan"),1,12,5)}</div>
<div class="rv"><div class="eq">A<sub>α</sub> = [a + α(b − a), c − α(c − b)] ${L("for tri(a,b,c)","bagi tri(a,b,c)")}</div><div class="eq">μ<sub>A</sub>(x) = sup<sub>α∈[0,1]</sub> α · 𝟙<sub>A<sub>α</sub></sub>(x)</div>
<div id="acr" class="readout"></div><p class="small">${L("The resolution (decomposition) principle: stacking all α-cuts, each lifted to height α, rebuilds the set. More slices → a closer staircase. This is how fuzzy arithmetic and α-plane Type-2 methods compute — interval maths, slice by slice.","Prinsip resolusi (penguraian): menindan semua potongan-α, setiap satu diangkat ke ketinggian α, membina semula set. Lebih banyak hirisan → tangga lebih hampir. Beginilah aritmetik kabur dan kaedah Jenis-2 satah-α mengira — matematik selang, hirisan demi hirisan.")}</p>
<div id="apr"></div></div></div>`,
 init(el){bind(el,["aa","an"],()=>this.show(el));practice(el.querySelector("#apr"),()=>{const a=rnd(0,30,5),b=a+rnd(10,30,5),c=b+rnd(10,30,5),al=rnd(.1,.9,.1),side=Math.random()<.5;const v=side?a+al*(b-a):c-al*(c-b);
  return {lv:"l2",q:L(`For tri(${a}, ${b}, ${c}) give the ${side?"left":"right"} end of the α-cut at α = ${f2(al)}.`,`Bagi tri(${a}, ${b}, ${c}) berikan hujung ${side?"kiri":"kanan"} potongan-α pada α = ${f2(al)}.`),ans:v,tol:.05,sol:`<div class="eq">${side?`a + α(b−a) = ${a} + ${f2(al)}·${b-a} = ${f2(v)}`:`c − α(c−b) = ${c} − ${f2(al)}·${c-b} = ${f2(v)}`}</div>`}})},
 show(el){const al=val(el,"aa"),n=val(el,"an"),c=C(),[a,b,cc]=[20,50,80];const P=plot(el.querySelector("#acs"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:240});P.clear();P.axes("x","μ",[0,20,50,80,100],[0,.5,1]);
  for(let k=1;k<=n;k++){const h=k/n,l=a+h*(b-a),r=cc-h*(cc-b);P.el("rect",{x:P.X(l),width:P.X(r)-P.X(l),y:P.Y(h),height:P.Y((k-1)/n)-P.Y(h),fill:c.acc,"fill-opacity":.25,stroke:c.acc,"stroke-opacity":.5})}
  P.el("path",{d:P.path(z=>tri(z,a,b,cc)),fill:"none",stroke:c.a1,"stroke-width":3});const l=a+al*(b-a),r=cc-al*(cc-b);
  P.el("line",{x1:P.X(l),x2:P.X(r),y1:P.Y(al),y2:P.Y(al),stroke:c.a2,"stroke-width":6,"stroke-linecap":"round"});
  el.querySelector("#acr").innerHTML=`<span class="r"><b>A<sub>${al}</sub></b>[${f2(l)}, ${f2(r)}]</span><span class="r"><b>${tx("width","lebar")}</b>${f2(r-l)}</span>`}});

/* 6 EXTENSION PRINCIPLE */
add({sec:S0,t:{en:"The extension principle",bm:"Prinsip lanjutan"},html:`
<div class="kicker rv">🔁 ${L("Concepts + worked example","Konsep + contoh kerja")}</div><h2 class="rv">${L("Push a fuzzy input through any function","Tolak input kabur melalui sebarang fungsi")}</h2>
<div class="cols c2"><div class="rv"><div class="eq">μ<sub>B</sub>(y) = sup<sub>x : f(x)=y</sub> μ<sub>A</sub>(x)</div>
<p class="small">${L("Example: “about zero” A on x ∈ {−2,…,2} and f(x) = x². Several x map to the same y, so we keep the <b>largest</b> grade.","Contoh: “lebih kurang sifar” A pada x ∈ {−2,…,2} dan f(x) = x². Beberapa x dipetakan ke y yang sama, jadi kita kekalkan gred <b>terbesar</b>.")}</p>
<div id="exin"></div><div id="exst" style="margin-top:10px"></div></div>
<div class="sim rv"><svg id="exsv"></svg><div class="call fact"><b>${L("Why it matters","Mengapa penting")}</b>${L("It defines fuzzy arithmetic (“about 3” + “about 5”) and how uncertain inputs propagate through models — the same idea Type-2 uses for uncertain memberships.","Ia mentakrif aritmetik kabur (“lebih kurang 3” + “lebih kurang 5”) dan cara input tidak pasti merambat melalui model — idea sama yang digunakan Jenis-2 untuk keahlian tidak pasti.")}</div></div></div>`,
 init(el){this.A=[.3,.7,1,.6,.2];el.querySelector("#exin").innerHTML=`<table class="mtx"><tr><th>x</th>${[-2,-1,0,1,2].map(x=>`<th>${x}</th>`).join("")}</tr><tr><th>μA</th>${this.A.map((v,i)=>`<td><input class="cell-in" data-i="${i}" type="number" min="0" max="1" step=".1" value="${v}"></td>`).join("")}</tr></table>`;
  el.querySelectorAll(".cell-in").forEach(c=>c.oninput=()=>{this.A[+c.dataset.i]=Math.max(0,Math.min(1,+c.value||0));this.show(el)});this.show(el)},
 show(el){const xs=[-2,-1,0,1,2],A=this.A,c=C();const ys=[0,1,4];const B=ys.map(y=>Math.max(...xs.map((x,i)=>x*x===y?A[i]:0)));
  mountSteps(el.querySelector("#exst"),[L("List images: f(−2)=f(2)=4, f(−1)=f(1)=1, f(0)=0.","Senarai imej: f(−2)=f(2)=4, f(−1)=f(1)=1, f(0)=0."),`<span class="mono">μB(0) = μA(0) = ${f2(B[0])}</span>`,`<span class="mono">μB(1) = max(μA(−1), μA(1)) = max(${f2(A[1])}, ${f2(A[3])}) = ${f2(B[1])}</span>`,`<span class="mono">μB(4) = max(μA(−2), μA(2)) = max(${f2(A[0])}, ${f2(A[4])}) = ${f2(B[2])}</span>`,`<b>B = ${f2(B[0])}/0 + ${f2(B[1])}/1 + ${f2(B[2])}/4</b>`]);
  const P=plot(el.querySelector("#exsv"),{x0:-2.6,x1:4.6,y0:0,y1:1.08,w:520,h:220});P.clear();P.axes("x  →  y = x²","μ",[-2,-1,0,1,2,4],[0,.5,1]);
  xs.forEach((x,i)=>{P.el("rect",{x:P.X(x-.15),width:P.X(.3)-P.X(0),y:P.Y(A[i]),height:P.Y(0)-P.Y(A[i]),fill:c.a1,"fill-opacity":.7});P.el("path",{d:`M${P.X(x)},${P.Y(A[i])} Q ${P.X((x+x*x)/2)},${P.Y(1.05)} ${P.X(x*x)},${P.Y(B[ys.indexOf(x*x)])}`,stroke:c.ink,"stroke-dasharray":"3 3",fill:"none"})});
  ys.forEach((y,i)=>P.el("circle",{cx:P.X(y),cy:P.Y(B[i]),r:8,fill:c.a2}))}});

/* 7 RELATIONS & COMPOSITION */
add({sec:S1,t:{en:"Fuzzy relations & max–min composition",bm:"Hubungan kabur & gubahan maks–min"},html:`
<div class="kicker rv">🧩 ${L("Interactive matrices","Matriks interaktif")}</div><h2 class="rv">${L("Chaining rules is matrix maths with min and max","Merantai peraturan ialah matematik matriks dengan min dan maks")}</h2>
<div class="cols c2"><div class="rv"><div class="eq">T(i,k) = max<sub>j</sub> [ R(i,j) ⋆ S(j,k) ] , ⋆ = min ${L("or","atau")} ×</div>
<label class="ctrl"><span>⋆</span><select id="rcop"><option value="min">max–min</option><option value="prod">max–product</option></select><span></span></label>
<div id="rcm" style="overflow-x:auto"></div></div>
<div class="rv"><div id="rcx"></div><div class="call tip"><b>${L("Try","Cuba")}</b>${L("Click any cell of T to see its computation. Edit R or S and watch only the affected cells change.","Klik mana-mana sel T untuk melihat pengiraannya. Ubah R atau S dan lihat hanya sel yang terkesan berubah.")}</div>
<p class="small">${L("Here R relates rain → river level (how strongly each rain band leads to each level band) and S relates level → risk. T = R∘S is the derived rain → risk relation. Zadeh's compositional rule of inference uses the same operation: B′ = A′ ∘ R.","Di sini R menghubungkan hujan → paras sungai dan S menghubungkan paras → risiko. T = R∘S ialah hubungan terbitan hujan → risiko. Peraturan inferens gubahan Zadeh menggunakan operasi yang sama: B′ = A′ ∘ R.")}</p></div></div>`,
 init(el){this.R=[[.9,.3,0],[.4,.8,.3],[.1,.6,.9]];this.S=[[.9,.2,0],[.3,.9,.3],[0,.4,1]];this.sel=[1,1];el.querySelector("#rcop").onchange=()=>this.show(el);this.show(el)},
 show(el){const op=el.querySelector("#rcop").value,f=(a,b)=>op==="min"?Math.min(a,b):a*b,R=this.R,S=this.S;const T=R.map(r=>S[0].map((_,k)=>Math.max(...r.map((v,j)=>f(v,S[j][k])))));
  const [si,sk]=this.sel,rl=[tx("Light","Ringan"),tx("Moderate","Sederhana"),tx("Heavy","Lebat")],ll=[tx("Normal","Normal"),tx("Alert","Waspada"),tx("Danger","Bahaya")],kl=[tx("Low","Rendah"),tx("Med","Sed"),tx("High","Tinggi")];
  const mat=(M,name,rows,cols,edit,hl)=>`<div style="display:inline-block;margin:4px 8px 4px 0;vertical-align:top"><div class="small" style="font-weight:700">${name}</div><table class="mtx"><tr><th></th>${cols.map(c=>`<th>${c}</th>`).join("")}</tr>${M.map((r,i)=>`<tr><th>${rows[i]}</th>${r.map((v,j)=>`<td class="${hl(i,j)}" data-m="${name}" data-i="${i}" data-j="${j}">${edit?`<input class="cell-in" type="number" min="0" max="1" step=".1" value="${v}">`:f2(v)}</td>`).join("")}</tr>`).join("")}</table></div>`;
  el.querySelector("#rcm").innerHTML=mat(R,"R",rl,ll,1,(i,j)=>i===si?"hl":"")+mat(S,"S",ll,kl,1,(i,j)=>j===sk?"hl":"")+mat(T,"T = R∘S",rl,kl,0,(i,j)=>i===si&&j===sk?"hl2":"");
  el.querySelectorAll('td[data-m="T = R∘S"]').forEach(td=>td.onclick=()=>{this.sel=[+td.dataset.i,+td.dataset.j];this.show(el)});
  el.querySelectorAll('td[data-m="R"] input,td[data-m="S"] input').forEach(inp=>inp.oninput=()=>{const td=inp.parentElement;this[td.dataset.m][+td.dataset.i][+td.dataset.j]=Math.max(0,Math.min(1,+inp.value||0));clearTimeout(this._t);this._t=setTimeout(()=>this.show(el),350)});
  const terms=R[si].map((v,j)=>`${op}(${f2(v)}, ${f2(S[j][sk])}) = ${f2(f(v,S[j][sk]))}`);
  el.querySelector("#rcx").innerHTML=`<div class="card"><b>T(${rl[si]}, ${kl[sk]})</b><div class="eq" style="white-space:normal">= max[ ${terms.join(" , ")} ]</div><div class="eq">= <b>${f2(T[si][sk])}</b></div><p class="small muted">${L("Read: the strongest chain rain → some level → risk, where each chain is only as strong as its weakest link.","Baca: rantai terkuat hujan → sesuatu paras → risiko, di mana setiap rantai hanya sekuat pautan terlemahnya.")}</p></div>`}});

/* 8 IMPLICATION OPERATORS */
add({sec:S1,t:{en:"Implication operators",bm:"Pengendali implikasi"},html:`
<div class="kicker rv">➡️ ${L("Compare","Bandingkan")}</div><h2 class="rv">${L("What “THEN” does to the consequent","Apa yang “MAKA” lakukan pada akibat")}</h2>
<div class="cols c2"><div class="sim rv"><svg id="imp"></svg>${slider("ia",L("Firing strength α","Kekuatan nyalaan α"),0,1,.6,.05)}<div class="readout" id="imr"></div></div>
<div class="rv"><table class="t small"><tr><th>${L("Name","Nama")}</th><th>μ<sub>B′</sub>(y)</th><th>${L("Family","Keluarga")}</th></tr>
<tr><td style="color:var(--a1)">■ Mamdani (min)</td><td class="mono">min(α, μ<sub>B</sub>(y))</td><td>${L("conjunctive — clips","konjungtif — memotong")}</td></tr>
<tr><td style="color:var(--a2)">■ Larsen (product)</td><td class="mono">α · μ<sub>B</sub>(y)</td><td>${L("conjunctive — scales","konjungtif — menskala")}</td></tr>
<tr><td style="color:var(--acc)">■ Łukasiewicz</td><td class="mono">min(1, 1 − α + μ<sub>B</sub>(y))</td><td>${L("logical implication","implikasi logik")}</td></tr>
<tr><td style="color:var(--ok)">■ Kleene–Dienes</td><td class="mono">max(1 − α, μ<sub>B</sub>(y))</td><td>${L("logical implication","implikasi logik")}</td></tr></table>
<div class="call fact"><b>${L("Key insight","Pencerahan utama")}</b>${L("Engineering systems use conjunctive operators (Mamdani, Larsen) and aggregate with max. Logical implications raise the floor to 1 − α and are aggregated with min — mixing the two families gives nonsense.","Sistem kejuruteraan menggunakan pengendali konjungtif (Mamdani, Larsen) dan mengagregat dengan max. Implikasi logik menaikkan lantai kepada 1 − α dan diagregat dengan min — mencampurkan dua keluarga ini memberi hasil tidak bermakna.")}</div></div></div>`,
 init(el){bind(el,["ia"],()=>this.show(el))},
 show(el){const a=val(el,"ia"),c=C(),B=y=>tri(y,25,50,75);const F=[[y=>Math.min(a,B(y)),c.a1],[y=>a*B(y),c.a2],[y=>Math.min(1,1-a+B(y)),c.acc],[y=>Math.max(1-a,B(y)),c.ok]];
  const P=plot(el.querySelector("#imp"),{x0:0,x1:100,y0:0,y1:1.08,w:520,h:250});P.clear();P.axes(tx("risk y","risiko y"),"μ",[0,25,50,75,100],[0,.5,1]);
  P.el("path",{d:P.path(B),fill:"none",stroke:c.ink,"stroke-dasharray":"4 4","stroke-width":1.5});F.forEach(g=>P.el("path",{d:P.path(g[0],300),fill:"none",stroke:g[1],"stroke-width":2.5}));
  el.querySelector("#imr").innerHTML=`<span class="r"><b>${tx("Mamdani area","Luas Mamdani")}</b>${f2(Array.from({length:101},(_,i)=>F[0][0](i)).reduce((s,v)=>s+v,0))}</span><span class="r"><b>${tx("Larsen area","Luas Larsen")}</b>${f2(Array.from({length:101},(_,i)=>F[1][0](i)).reduce((s,v)=>s+v,0))}</span><span class="r"><b>${tx("floor (logical)","lantai (logik)")}</b>${f2(1-a)}</span>`}});

/* 9 DISCRETE MAMDANI TABLE */
add({sec:S1,t:{en:"Mamdani by hand: the full table",bm:"Mamdani secara manual: jadual penuh"},html:`
<div class="kicker rv">📋 ${L("Every number, every row","Setiap nombor, setiap baris")}</div><h2 class="rv">${L("Discrete centroid on a coarse grid","Sentroid diskret pada grid kasar")}</h2>
<div class="cols c2"><div class="rv">${slider("tr",L("Rain","Hujan"),0,100,45)}${slider("tw",L("Level","Paras"),0,100,70)}${slider("tg",L("Grid step Δy","Langkah grid Δy"),1,25,10)}<div id="tst"></div></div>
<div class="rv"><div id="ttab" style="max-height:52vh;overflow:auto"></div><div class="readout" id="tres"></div></div></div>`,
 notes:{en:"<p>The discrete centroid y* = Σ μ(y<sub>k</sub>)·y<sub>k</sub> / Σ μ(y<sub>k</sub>) depends on the grid. With Δy = 10 you can do it on paper in five minutes; shrink Δy and it converges to the continuous centroid (56.4 for 45/70).</p>",bm:"<p>Sentroid diskret y* = Σ μ(y<sub>k</sub>)·y<sub>k</sub> / Σ μ(y<sub>k</sub>) bergantung pada grid. Dengan Δy = 10 anda boleh melakukannya di atas kertas dalam lima minit; kecilkan Δy dan ia menumpu kepada sentroid selanjar (56.4 untuk 45/70).</p>"},
 init(el){bind(el,["tr","tw","tg"],()=>this.show(el))},
 show(el){const r=val(el,"tr"),w=val(el,"tw"),g=val(el,"tg");const fr=Object.fromEntries(Object.entries(MF.rain).map(([k,p])=>[k,mu(p,r)])),fw=Object.fromEntries(Object.entries(MF.level).map(([k,p])=>[k,mu(p,w)]));
  const fire=RULES.map(([a,b,o])=>({a,b,o,f:Math.min(fr[a],fw[b])})),act=fire.filter(x=>x.f>0);const cl={low:0,medium:0,high:0};act.forEach(x=>cl[x.o]=Math.max(cl[x.o],x.f));
  mountSteps(el.querySelector("#tst"),[`${L("Fuzzify rain","Kaburkan hujan")}: ${Object.entries(fr).map(([k,v])=>`${nm(k)} ${f2(v)}`).join(" · ")}`,`${L("Fuzzify level","Kaburkan paras")}: ${Object.entries(fw).map(([k,v])=>`${nm(k)} ${f2(v)}`).join(" · ")}`,
   `${L("Active rules (min)","Peraturan aktif (min)")}: ${act.map(x=>`${nm(x.a)}∧${nm(x.b)}→${nm(x.o)} = ${f2(x.f)}`).join("; ")||"—"}`,`${L("Clip level per output set (max over rules)","Aras potong setiap set output (max atas peraturan)")}: ${Object.entries(cl).map(([k,v])=>`${nm(k)} ${f2(v)}`).join(" · ")}`,
   L("Fill the table: μ(y) = max over sets of min(clip, μ<sub>set</sub>(y)); multiply by y; sum both columns.","Isi jadual: μ(y) = max atas set bagi min(potongan, μ<sub>set</sub>(y)); darab dengan y; jumlahkan kedua-dua lajur.")]);
  let sm=0,smy=0,rows="";for(let y=0;y<=100;y+=g){const c3=["low","medium","high"].map(k=>Math.min(cl[k],mu(MF.risk[k],y))),m=Math.max(...c3);sm+=m;smy+=m*y;rows+=`<tr${m>0?"":` style="opacity:.45"`}><td>${y}</td>${c3.map(v=>`<td>${f2(v)}</td>`).join("")}<td><b>${f2(m)}</b></td><td>${f2(m*y)}</td></tr>`}
  el.querySelector("#ttab").innerHTML=`<table class="t small mono" style="text-align:center"><tr><th>y</th><th>${nm("low")}</th><th>${nm("medium")}</th><th>${nm("high")}</th><th>μ(y)</th><th>μ·y</th></tr>${rows}<tr><th colspan="4">Σ</th><th>${f2(sm)}</th><th>${f2(smy)}</th></tr></table>`;
  el.querySelector("#tres").innerHTML=`<span class="r" style="font-size:1.05rem"><b>y* = ${f2(smy)} / ${f2(sm)}</b> = ${sm?f2(smy/sm):"—"}</span><span class="r"><b>Δy</b>${g}</span>`}});

/* 10 CONTINUOUS CENTROID */
add({sec:S1,t:{en:"The continuous centroid",bm:"Sentroid selanjar"},html:`
<div class="kicker rv">∫ ${L("Derivation","Terbitan")}</div><h2 class="rv">${L("Areas and moments of straight-line pieces","Luas dan momen cebisan garis lurus")}</h2>
<div class="cols c2"><div class="rv"><div class="eq">y* = ∫ y μ(y) dy / ∫ μ(y) dy</div>
<p class="small">${L("An aggregated Mamdani output is piecewise linear, so split it into segments [y₁, y₂] with heights h₁, h₂. Each segment is a trapezoid:","Output Mamdani teragregat adalah linear cebisan, jadi bahagikannya kepada segmen [y₁, y₂] dengan ketinggian h₁, h₂. Setiap segmen ialah trapezium:")}</p>
<div class="eq">A<sub>s</sub> = (y₂ − y₁)(h₁ + h₂)/2</div><div class="eq">ȳ<sub>s</sub> = y₁ + (y₂ − y₁)(h₁ + 2h₂) / (3(h₁ + h₂))</div><div class="eq">y* = Σ A<sub>s</sub> ȳ<sub>s</sub> / Σ A<sub>s</sub></div>
<p class="small muted">${L("Special cases: h₁ = h₂ → centre; h₁ = 0 → 2/3 of the way; h₂ = 0 → 1/3 of the way.","Kes khas: h₁ = h₂ → pusat; h₁ = 0 → 2/3 jarak; h₂ = 0 → 1/3 jarak.")}</p></div>
<div class="rv sim">${slider("cr",L("Rain","Hujan"),0,100,45)}${slider("cw",L("Level","Paras"),0,100,70)}<svg id="ccv"></svg><div id="cct"></div></div></div>`,
 init(el){bind(el,["cr","cw"],()=>this.show(el))},
 show(el){const r=val(el,"cr"),w=val(el,"cw"),c=C();const f=RULES.map(([a,b])=>Math.min(mu(MF.rain[a],r),mu(MF.level[b],w)));const agg=y=>Math.max(0,...RULES.map((R,i)=>Math.min(f[i],mu(MF.risk[R[2]],y))));
  /* breakpoints: every 1 unit is exact enough for straight pieces; group into visible segments where slope constant */
  const pts=[];for(let y=0;y<=100;y++)pts.push([y,agg(y)]);const seg=[];let s0=0;for(let i=1;i<pts.length;i++){const sl=(p,q)=>q[1]-p[1];if(i===pts.length-1||Math.abs(sl(pts[i],pts[i+1])-sl(pts[i-1],pts[i]))>1e-9){seg.push([pts[s0],pts[i]]);s0=i}}
  let A=0,M=0;const rows=seg.filter(s=>s[0][1]+s[1][1]>0).map(([p,q])=>{const a=(q[0]-p[0])*(p[1]+q[1])/2,yb=p[0]+(q[0]-p[0])*(p[1]+2*q[1])/(3*(p[1]+q[1]));A+=a;M+=a*yb;return [p[0],q[0],p[1],q[1],a,yb]});
  const P=plot(el.querySelector("#ccv"),{x0:0,x1:100,y0:0,y1:1.05,w:520,h:180,pad:{l:30,r:10,t:8,b:26}});P.clear();P.axes(tx("risk","risiko"),"μ",[0,25,50,75,100],[0,1]);
  rows.forEach((s,i)=>P.el("path",{d:`M${P.X(s[0])},${P.Y(0)}L${P.X(s[0])},${P.Y(s[2])}L${P.X(s[1])},${P.Y(s[3])}L${P.X(s[1])},${P.Y(0)}Z`,fill:i%2?c.a1:c.a2,"fill-opacity":.45,stroke:c.ink}));
  if(A)P.el("line",{x1:P.X(M/A),x2:P.X(M/A),y1:P.Y(0),y2:P.Y(1),stroke:c.bad,"stroke-width":3});
  el.querySelector("#cct").innerHTML=`<table class="t small mono" style="text-align:center"><tr><th>[y₁,y₂]</th><th>h₁</th><th>h₂</th><th>A</th><th>ȳ</th></tr>${rows.map(s=>`<tr><td>[${s[0]},${s[1]}]</td><td>${f2(s[2])}</td><td>${f2(s[3])}</td><td>${f2(s[4])}</td><td>${f2(s[5])}</td></tr>`).join("")}<tr><th colspan="3">Σ</th><th>${f2(A)}</th><th>y* = ${A?f2(M/A):"—"}</th></tr></table>`}});

/* 11 SUGENO FIRST ORDER */
const SUG={low:[.1,.1,5],medium:[.3,.3,15],high:[.4,.4,40]};
add({sec:S1,t:{en:"First-order Sugeno, computed",bm:"Sugeno tertib pertama, dikira"},html:`
<div class="kicker rv">📐 ${L("Worked system","Sistem kerja")}</div><h2 class="rv">${L("Each rule outputs a plane; the system averages the planes","Setiap peraturan menghasilkan satah; sistem mempuratakan satah")}</h2>
<div class="cols c2"><div class="rv"><div class="eq">z<sub>i</sub> = p<sub>i</sub>·r + q<sub>i</sub>·w + c<sub>i</sub> · y = Σ f<sub>i</sub> z<sub>i</sub> / Σ f<sub>i</sub> = Σ f̄<sub>i</sub> z<sub>i</sub></div>
<table class="t small"><tr><th>${L("Consequent","Akibat")}</th><th>z = p·r + q·w + c</th></tr><tr><td>${nm("low")}</td><td class="mono">0.1r + 0.1w + 5</td></tr><tr><td>${nm("medium")}</td><td class="mono">0.3r + 0.3w + 15</td></tr><tr><td>${nm("high")}</td><td class="mono">0.4r + 0.4w + 40</td></tr></table>
${slider("sr",L("Rain","Hujan"),0,100,45)}${slider("sw",L("Level","Paras"),0,100,70)}</div>
<div class="rv"><div id="stab"></div><div class="readout" id="sres"></div><div class="call fact"><b>${L("Why ANFIS loves this","Mengapa ANFIS menyukainya")}</b>${L("y is linear in p, q, c once the firing strengths are fixed — so least squares fits the consequents in one shot, while gradient descent tunes the memberships.","y adalah linear dalam p, q, c apabila kekuatan nyalaan ditetapkan — jadi kuasa dua terkecil memuatkan akibat sekali gus, manakala penurunan kecerunan menala keahlian.")}</div></div></div>`,
 init(el){bind(el,["sr","sw"],()=>this.show(el))},
 show(el){const r=val(el,"sr"),w=val(el,"sw");const rows=RULES.map(([a,b,o])=>{const f=Math.min(mu(MF.rain[a],r),mu(MF.level[b],w)),p=SUG[o],z=p[0]*r+p[1]*w+p[2];return {a,b,o,f,z}}).filter(x=>x.f>0);const sf=rows.reduce((s,x)=>s+x.f,0);
  el.querySelector("#stab").innerHTML=`<table class="t small mono" style="text-align:center"><tr><th>${tx("rule","peraturan")}</th><th>f</th><th>f̄ = f/Σf</th><th>z</th><th>f̄·z</th></tr>${rows.map(x=>`<tr><td style="font-family:var(--fb)">${nm(x.a)}∧${nm(x.b)}→${nm(x.o)}</td><td>${f3(x.f)}</td><td>${f3(x.f/sf)}</td><td>${f2(x.z)}</td><td>${f2(x.f/sf*x.z)}</td></tr>`).join("")}<tr><th>Σ</th><th>${f3(sf)}</th><th>1.000</th><th></th><th>${f2(rows.reduce((s,x)=>s+x.f/sf*x.z,0))}</th></tr></table>`;
  el.querySelector("#sres").innerHTML=`<span class="r" style="font-size:1.05rem"><b>y</b>${sf?f2(rows.reduce((s,x)=>s+x.f*x.z,0)/sf):"—"}</span>`}});

/* 12 PRACTICE T1 */
function genT1(){const t=Math.floor(Math.random()*4);
 if(t===0){const a=rnd(.1,.9,.1),b=rnd(.1,.9,.1),prod=Math.random()<.5;return {lv:"l1",q:L(`μ<sub>A</sub> = ${f2(a)}, μ<sub>B</sub> = ${f2(b)}. Firing strength with AND = ${prod?"product":"min"}?`,`μ<sub>A</sub> = ${f2(a)}, μ<sub>B</sub> = ${f2(b)}. Kekuatan nyalaan dengan DAN = ${prod?"hasil darab":"min"}?`),ans:prod?a*b:Math.min(a,b),sol:`<div class="eq">${prod?`${f2(a)} × ${f2(b)} = ${f3(a*b)}`:`min(${f2(a)}, ${f2(b)}) = ${f2(Math.min(a,b))}`}</div>`}}
 if(t===1){const f1=rnd(.1,.9,.1),f2v=rnd(.1,.9,.1),z1=rnd(10,40,5),z2=rnd(50,90,5),y=(f1*z1+f2v*z2)/(f1+f2v);return {lv:"l2",q:L(`Zero-order Sugeno: rule 1 fires ${f2(f1)} with z₁ = ${z1}; rule 2 fires ${f2(f2v)} with z₂ = ${z2}. Output y?`,`Sugeno tertib sifar: peraturan 1 menyala ${f2(f1)} dengan z₁ = ${z1}; peraturan 2 menyala ${f2(f2v)} dengan z₂ = ${z2}. Output y?`),ans:y,tol:.05,sol:`<div class="eq">(${f2(f1)}·${z1} + ${f2(f2v)}·${z2}) / (${f2(f1)} + ${f2(f2v)}) = ${f2(f1*z1+f2v*z2)} / ${f2(f1+f2v)} = ${f2(y)}</div>`}}
 if(t===2){const ys=[20,40,60,80],ms=ys.map(()=>rnd(0,1,.1));if(ms.every(m=>!m))ms[1]=.5;const s=ms.reduce((a,b)=>a+b,0),y=ms.reduce((a,m,i)=>a+m*ys[i],0)/s;return {lv:"l2",q:L(`Discrete output: μ(20)=${f2(ms[0])}, μ(40)=${f2(ms[1])}, μ(60)=${f2(ms[2])}, μ(80)=${f2(ms[3])}. Centroid?`,`Output diskret: μ(20)=${f2(ms[0])}, μ(40)=${f2(ms[1])}, μ(60)=${f2(ms[2])}, μ(80)=${f2(ms[3])}. Sentroid?`),ans:y,tol:.05,sol:`<div class="eq" style="white-space:normal">Σμ·y = ${ms.map((m,i)=>`${f2(m)}·${ys[i]}`).join(" + ")} = ${f2(s*y)} ; Σμ = ${f2(s)} ; y* = ${f2(y)}</div>`}}
 const r=rnd(5,95,1),k=["light","moderate","heavy"][Math.floor(Math.random()*3)],p=MF.rain[k],m=mu(p,r);return {lv:"l3",q:L(`Using the flood sets, rain = ${r} mm/h. μ<sub>${NM[k][0]}</sub>(${r})? (set = trap(${p.join(", ")}))`,`Menggunakan set banjir, hujan = ${r} mm/j. μ<sub>${NM[k][1]}</sub>(${r})? (set = trap(${p.join(", ")}))`),ans:m,sol:`<div class="eq">trap(${r}; ${p.join(", ")}) = max(0, min((${r}−${p[0]})/(${p[1]}−${p[0]}), 1, (${p[3]}−${r})/(${p[3]}−${p[2]}))) = ${f3(m)}</div>`}}
add({sec:S1,t:{en:"Practice: Type-1 calculations",bm:"Latihan: pengiraan Jenis-1"},noAutoDone:true,html:`
<div class="kicker rv">🎲 ${L("Unlimited practice","Latihan tanpa had")}</div><h2 class="rv">${L("Four problem types, three levels","Empat jenis soalan, tiga tahap")}</h2>
<div class="cols c2"><div id="p1a" class="rv"></div><div id="p1b" class="rv"></div></div>
<div class="call tip rv"><b>${L("Aim","Sasaran")}</b>${L("Five correct in a row without opening the solution. Use a calculator — the point is the method, not mental arithmetic.","Lima betul berturut-turut tanpa membuka penyelesaian. Guna kalkulator — yang penting ialah kaedah, bukan aritmetik mental.")}</div>`,
 init(el){practice(el.querySelector("#p1a"),genT1);practice(el.querySelector("#p1b"),genT1)}});

/* 13 IT2 DEFINITIONS */
add({sec:S2,t:{en:"Interval Type-2: the definitions",bm:"Jenis-2 selang: takrifan"},html:`
<div class="kicker rv">📐 ${L("Formal definitions","Takrifan formal")}</div><h2 class="rv">${L("From a curve to a region","Daripada lengkung kepada kawasan")}</h2>
<div class="cols c2"><div class="rv"><div class="eq">Ã = ∫<sub>x∈X</sub> ∫<sub>u∈J<sub>x</sub></sub> 1/(x,u) , J<sub>x</sub> ⊆ [0,1]</div><div class="eq">J<sub>x</sub> = [μ̲<sub>Ã</sub>(x), μ̄<sub>Ã</sub>(x)]</div><div class="eq">FOU(Ã) = ∪<sub>x∈X</sub> J<sub>x</sub></div>
<div class="eq">f̲<sub>i</sub> = T(μ̲<sub>1</sub>(x₁), μ̲<sub>2</sub>(x₂)) · f̄<sub>i</sub> = T(μ̄<sub>1</sub>(x₁), μ̄<sub>2</sub>(x₂))</div></div>
<div class="rv"><div class="card"><b>${L("Embedded sets (Mendel–John)","Set terbenam (Mendel–John)")}</b><p class="small">${L("Any Type-1 curve that stays inside the FOU is an embedded set. With N sample points and M grade levels per point there are M<sup>N</sup> of them — the IT2 set is their union. That is why IT2 maths reduces to working with just two of them: the upper and lower bounds.","Sebarang lengkung Jenis-1 yang kekal dalam FOU ialah set terbenam. Dengan N titik sampel dan M aras gred setiap titik terdapat M<sup>N</sup> daripadanya — set IT2 ialah kesatuannya. Sebab itu matematik IT2 berkurang kepada bekerja dengan dua sahaja: batas atas dan bawah.")}</p></div>
<div class="call fact"><b>${L("Monotonicity does the work","Keekanadaan melakukan kerja")}</b>${L("t-norms are monotone, so the smallest firing comes from all lower grades and the largest from all upper grades. No search needed for the firing interval.","Norma-t adalah ekanada, jadi nyalaan terkecil datang daripada semua gred bawah dan terbesar daripada semua gred atas. Tiada carian diperlukan untuk selang nyalaan.")}</div></div></div>`});

/* 14 IT2 FIRING CALC */
add({sec:S2,t:{en:"Firing-interval calculator",bm:"Kalkulator selang nyalaan"},html:`
<div class="kicker rv">🧮 ${L("Calculator","Kalkulator")}</div><h2 class="rv">${L("Two IT2 antecedents → one firing interval","Dua anteseden IT2 → satu selang nyalaan")}</h2>
<div class="cols c2"><div class="sim rv">${slider("fx1",L("x₁ (rain)","x₁ (hujan)"),0,100,45)}${slider("fx2",L("x₂ (level)","x₂ (paras)"),0,100,70)}${slider("fu",L("FOU width U","Lebar FOU U"),0,15,5)}
<label class="ctrl"><span>T</span><select id="ftn"><option value="min">min</option><option value="prod">${OL("product","hasil darab")}</option></select><span></span></label><svg id="fsv"></svg></div>
<div class="rv"><div id="fst"></div></div></div>`,
 init(el){el.querySelector("#ftn").onchange=()=>this.show(el);bind(el,["fx1","fx2","fu"],()=>this.show(el))},
 show(el){const x1=val(el,"fx1"),x2=val(el,"fx2"),U=val(el,"fu"),T=el.querySelector("#ftn").value==="min"?Math.min:(a,b)=>a*b,c=C();
  const lo1=tri(x1,10+U,35,60-U),hi1=tri(x1,10-U,35,60+U),lo2=tri(x2,40+U,65,85-U),hi2=tri(x2,40-U,65,85+U);
  mountSteps(el.querySelector("#fst"),[L(`Antecedent 1 = ${nm("moderate")} rain, tri(10, 35, 60) with FOU ±${U}:`,`Anteseden 1 = hujan ${nm("moderate")}, tri(10, 35, 60) dengan FOU ±${U}:`)+`<div class="eq">μ̲₁ = tri(${x1}; ${10+U}, 35, ${60-U}) = ${f3(lo1)} · μ̄₁ = tri(${x1}; ${10-U}, 35, ${60+U}) = ${f3(hi1)}</div>`,
   L(`Antecedent 2 = ${nm("alert")} level, tri(40, 65, 85):`,`Anteseden 2 = paras ${nm("alert")}, tri(40, 65, 85):`)+`<div class="eq">μ̲₂ = ${f3(lo2)} · μ̄₂ = ${f3(hi2)}</div>`,
   `<div class="eq">f̲ = T(${f3(lo1)}, ${f3(lo2)}) = ${f3(T(lo1,lo2))}</div><div class="eq">f̄ = T(${f3(hi1)}, ${f3(hi2)}) = ${f3(T(hi1,hi2))}</div>`,`<b>[f̲, f̄] = [${f3(T(lo1,lo2))}, ${f3(T(hi1,hi2))}]</b> — ${L("width","lebar")} ${f3(T(hi1,hi2)-T(lo1,lo2))}`]);
  const P=plot(el.querySelector("#fsv"),{x0:0,x1:100,y0:0,y1:1.05,w:520,h:200,pad:{l:30,r:10,t:8,b:26}});P.clear();P.axes("x","μ",[0,25,50,75,100],[0,1]);
  [[10,35,60,x1,c.a1],[40,65,85,x2,c.acc]].forEach(([a,b,cc,x,col])=>{P.el("path",{d:P.band(z=>tri(z,a+U,b,cc-U),z=>tri(z,a-U,b,cc+U)),fill:col,"fill-opacity":.25});P.el("line",{x1:P.X(x),x2:P.X(x),y1:P.Y(tri(x,a+U,b,cc-U)),y2:P.Y(tri(x,a-U,b,cc+U)),stroke:col,"stroke-width":6,"stroke-linecap":"round"})})}});

/* 15 KM STEPPER */
add({sec:S2,t:{en:"Karnik–Mendel, iteration by iteration",bm:"Karnik–Mendel, lelaran demi lelaran"},html:`
<div class="kicker rv">🔁 ${L("Algorithm stepper","Pelangkah algoritma")}</div><h2 class="rv">${L("Find the switch point, update, repeat","Cari titik suis, kemas kini, ulang")}</h2>
<div class="cols c2"><div class="rv"><div class="card small"><b>KM ${L("for","untuk")} y<sub>l</sub></b><ol class="tight"><li>${L("Sort rules by y<sub>i</sub>. Start with average weights f<sub>i</sub> = (f̲<sub>i</sub>+f̄<sub>i</sub>)/2 → y′.","Isih peraturan mengikut y<sub>i</sub>. Mula dengan pemberat purata f<sub>i</sub> = (f̲<sub>i</sub>+f̄<sub>i</sub>)/2 → y′.")}</li>
<li>${L("Find k with y<sub>k</sub> ≤ y′ ≤ y<sub>k+1</sub>.","Cari k dengan y<sub>k</sub> ≤ y′ ≤ y<sub>k+1</sub>.")}</li><li>${L("Weights: f̄ for i ≤ k, f̲ for i &gt; k → new y″.","Pemberat: f̄ untuk i ≤ k, f̲ untuk i &gt; k → y″ baharu.")}</li><li>${L("If y″ = y′ stop; else y′ ← y″ and go to 2.","Jika y″ = y′ berhenti; jika tidak y′ ← y″ dan ke langkah 2.")}</li></ol>${L("For y<sub>r</sub> swap: f̲ for i ≤ k, f̄ for i &gt; k.","Untuk y<sub>r</sub> tukar: f̲ untuk i ≤ k, f̄ untuk i &gt; k.")}</div>
<div id="kmin" style="overflow-x:auto;margin-top:8px"></div><div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" id="kmf">🌊 ${L("Flood example (45/70)","Contoh banjir (45/70)")}</button><button class="btn" id="kmr">🎲 ${L("Random 5-rule example","Contoh rawak 5 peraturan")}</button></div></div>
<div class="rv"><label class="ctrl"><span>${L("Compute","Kira")}</span><select id="kms"><option value="l">y_l</option><option value="r">y_r</option></select><span></span></label><div id="kmst"></div><div class="readout" id="kmres"></div></div></div>`,
 notes:{en:"<p>KM converges monotonically in at most N iterations (usually 2–4). The default example is the flood system at 45 mm/h, 70%, U = 5: four active rules with centres 50, 85, 85, 85. Compare the result with the exhaustive search in the Module A simulator — they agree.</p>",bm:"<p>KM menumpu secara ekanada dalam paling banyak N lelaran (lazimnya 2–4). Contoh lalai ialah sistem banjir pada 45 mm/j, 70%, U = 5: empat peraturan aktif dengan pusat 50, 85, 85, 85. Bandingkan hasil dengan carian menyeluruh dalam simulator Modul A — keputusannya sama.</p>"},
 init(el){const flood=()=>{this.d={y:[50,85,85,85],fl:[.5,0,0,0],fu:[2/3,.2,2/7,.2]};this.show(el)};const rand=()=>{const y=[...Array(5)].map(()=>rnd(10,90,5)),fl=y.map(()=>rnd(0,.6,.05));this.d={y,fl,fu:fl.map(v=>Math.min(1,v+rnd(.05,.4,.05)))};this.show(el)};
  el.querySelector("#kmf").onclick=flood;el.querySelector("#kmr").onclick=rand;el.querySelector("#kms").onchange=()=>{el.querySelector("#kmst")._k=1;this.show(el)};flood()},
 show(el){const d=this.d,side=el.querySelector("#kms").value;el.querySelector("#kmin").innerHTML=`<table class="mtx"><tr><th>i</th>${d.y.map((_,i)=>`<th>${i+1}</th>`).join("")}</tr>${[["y","y"],["f̲","fl"],["f̄","fu"]].map(([lab,k])=>`<tr><th>${lab}</th>${d[k].map((v,i)=>`<td><input class="cell-in" data-k="${k}" data-i="${i}" type="number" step=".01" value="${k==="y"?v:(+v).toFixed(3)}"></td>`).join("")}</tr>`).join("")}</table>`;
  el.querySelectorAll("#kmin .cell-in").forEach(c=>c.onchange=()=>{let v=+c.value||0;if(c.dataset.k!=="y")v=Math.max(0,Math.min(1,v));d[c.dataset.k][+c.dataset.i]=v;if(c.dataset.k==="fl"&&d.fu[+c.dataset.i]<v)d.fu[+c.dataset.i]=v;this.show(el)});
  const R=kmTrace(d.y,d.fl,d.fu,side);const steps=[`${L("Sorted","Diisih")}: <span class="mono">y = [${R.Y.join(", ")}] · f̲ = [${R.FL.map(f3).join(", ")}] · f̄ = [${R.FU.map(f3).join(", ")}]</span>`];
  R.it.forEach((s,n)=>steps.push(`<b>${L("Iteration","Lelaran")} ${n+1}</b>: y′ = ${f3(s.yp)} → k = ${s.k} → ${L("weights","pemberat")} <span class="mono">[${s.w.map(f3).join(", ")}]</span><div class="eq">y″ = Σw·y / Σw = ${f3(s.w.reduce((a,v,i)=>a+v*R.Y[i],0))} / ${f3(s.w.reduce((a,b)=>a+b,0))} = ${f3(s.yn)}</div>${Math.abs(s.yn-s.yp)<1e-9?"✔ "+L("y″ = y′ → converged","y″ = y′ → menumpu"):""}`));
  steps.push(`<b>y<sub>${side}</sub> = ${f3(R.val)}</b>`);mountSteps(el.querySelector("#kmst"),steps);
  const Lr=kmTrace(d.y,d.fl,d.fu,"l").val,Rr=kmTrace(d.y,d.fl,d.fu,"r").val;el.querySelector("#kmres").innerHTML=`<span class="r"><b>[y<sub>l</sub>, y<sub>r</sub>]</b>[${f2(Lr)}, ${f2(Rr)}]</span><span class="r"><b>y</b>${f2((Lr+Rr)/2)}</span><span class="r"><b>${tx("iterations","lelaran")}</b>${R.it.length}</span>`}});

/* 16 CLOSED FORMS */
add({sec:S2,t:{en:"Closed-form alternatives to KM",bm:"Alternatif bentuk tertutup kepada KM"},html:`
<div class="kicker rv">⚡ ${L("Compare","Bandingkan")}</div><h2 class="rv">${L("When you can't afford iterations","Apabila lelaran tidak mampu ditanggung")}</h2>
<div class="cols c2"><div class="rv"><table class="t small"><tr><th>${L("Method","Kaedah")}</th><th>${L("Formula","Formula")}</th></tr>
<tr><td>Nie–Tan (NT)</td><td class="mono">Σ y<sub>i</sub>(f̲<sub>i</sub>+f̄<sub>i</sub>) / Σ(f̲<sub>i</sub>+f̄<sub>i</sub>)</td></tr>
<tr><td>Begian–Melek–Mendel (BMM)</td><td class="mono">m·Σf̲<sub>i</sub>y<sub>i</sub>/Σf̲<sub>i</sub> + n·Σf̄<sub>i</sub>y<sub>i</sub>/Σf̄<sub>i</sub> (m=n=½)</td></tr>
<tr><td>${L("KM midpoint","Titik tengah KM")}</td><td class="mono">(y<sub>l</sub> + y<sub>r</sub>)/2</td></tr>
<tr><td>${L("Two-rule closed form","Bentuk tertutup dua peraturan")}</td><td class="mono">y<sub>l</sub> = (f̄₁y₁+f̲₂y₂)/(f̄₁+f̲₂), y<sub>r</sub> = (f̲₁y₁+f̄₂y₂)/(f̲₁+f̄₂), y₁&lt;y₂</td></tr></table>
<div class="call fact"><b>${L("Trade-off","Pertukaran")}</b>${L("NT and BMM are O(N) and differentiable — popular in learned IT2 systems. KM gives the exact centroid interval (the uncertainty information) at O(N log N) plus iterations.","NT dan BMM berkos O(N) dan boleh dibeza — popular dalam sistem IT2 yang dipelajari. KM memberi selang sentroid tepat (maklumat ketidakpastian) pada O(N log N) serta lelaran.")}</div></div>
<div class="sim rv">${slider("cu",L("FOU width U (flood 45/70)","Lebar FOU U (banjir 45/70)"),0,15,5)}<svg id="cfv"></svg><div class="readout" id="cfr"></div></div></div>`,
 init(el){bind(el,["cu"],()=>this.show(el))},
 show(el){const U=val(el,"cu"),r=45,w=70,c=C();const it=(p,x)=>{const [a,b,cc,d]=p;return [trap(x,a===b?a:Math.min(a+U,b),b,cc,cc===d?d:Math.max(d-U,cc)),trap(x,a===b?a:a-U,b,cc,cc===d?d:d+U)]};
  const CEN={low:15,medium:50,high:85};const y=[],fl=[],fu=[];RULES.forEach(([a,b,o])=>{const A=it(MF.rain[a],r),B=it(MF.level[b],w);if(Math.min(A[1],B[1])>0){y.push(CEN[o]);fl.push(Math.min(A[0],B[0]));fu.push(Math.min(A[1],B[1]))}});
  const yl=kmTrace(y,fl,fu,"l").val,yr=kmTrace(y,fl,fu,"r").val,s=(a)=>a.reduce((p,q)=>p+q,0);const nt=s(y.map((v,i)=>v*(fl[i]+fu[i])))/s(fl.map((v,i)=>v+fu[i]));const sl=s(fl),su=s(fu);const upA=su?s(y.map((v,i)=>v*fu[i]))/su:NaN,loA=sl?s(y.map((v,i)=>v*fl[i]))/sl:upA,bmm=.5*loA+.5*upA;
  const V=[["KM",(yl+yr)/2,c.a1],["Nie–Tan",nt,c.a2],["BMM",bmm,c.acc]];const P=plot(el.querySelector("#cfv"),{x0:40,x1:80,y0:0,y1:3.5,w:520,h:170,pad:{l:80,r:10,t:8,b:26}});P.clear();P.axes(tx("risk","risiko"),"",[40,50,60,70,80],[]);
  P.el("rect",{x:P.X(yl),width:Math.max(2,P.X(yr)-P.X(yl)),y:P.Y(3.4),height:P.Y(0)-P.Y(3.4),fill:c.a1,"fill-opacity":.12});V.forEach((v,i)=>{P.el("circle",{cx:P.X(v[1]),cy:P.Y(2.8-i),r:8,fill:v[2]});P.el("text",{x:8,y:P.Y(2.8-i)+4,"font-size":13,fill:v[2],"font-weight":700}).textContent=v[0]});
  el.querySelector("#cfr").innerHTML=`<span class="r"><b>[y<sub>l</sub>, y<sub>r</sub>]</b>[${f2(yl)}, ${f2(yr)}]</span>${V.map(v=>`<span class="r" style="color:${v[2]}"><b>${v[0]}</b>${f2(v[1])}</span>`).join("")}`}});

/* 17 PRACTICE IT2 */
function genT2(){const t=Math.floor(Math.random()*3);
 if(t===0){const a=[rnd(.1,.6,.05),0],b=[rnd(.1,.6,.05),0];a[1]=Math.min(1,a[0]+rnd(.1,.4,.05));b[1]=Math.min(1,b[0]+rnd(.1,.4,.05));const up=Math.random()<.5;return {lv:"l1",q:L(`Antecedents [${f2(a[0])}, ${f2(a[1])}] and [${f2(b[0])}, ${f2(b[1])}], T = min. ${up?"Upper":"Lower"} firing?`,`Anteseden [${f2(a[0])}, ${f2(a[1])}] dan [${f2(b[0])}, ${f2(b[1])}], T = min. Nyalaan ${up?"atas":"bawah"}?`),ans:up?Math.min(a[1],b[1]):Math.min(a[0],b[0]),sol:`<div class="eq">${up?`f̄ = min(${f2(a[1])}, ${f2(b[1])})`:`f̲ = min(${f2(a[0])}, ${f2(b[0])})`} = ${f2(up?Math.min(a[1],b[1]):Math.min(a[0],b[0]))}</div>`}}
 const y1=rnd(10,40,5),y2=rnd(55,90,5),l1=rnd(.1,.5,.05),u1=Math.min(1,l1+rnd(.1,.4,.05)),l2=rnd(.1,.5,.05),u2=Math.min(1,l2+rnd(.1,.4,.05));
 if(t===1){const nt=(y1*(l1+u1)+y2*(l2+u2))/(l1+u1+l2+u2);return {lv:"l2",q:L(`Two rules: y₁=${y1} [${f2(l1)}, ${f2(u1)}], y₂=${y2} [${f2(l2)}, ${f2(u2)}]. Nie–Tan output?`,`Dua peraturan: y₁=${y1} [${f2(l1)}, ${f2(u1)}], y₂=${y2} [${f2(l2)}, ${f2(u2)}]. Output Nie–Tan?`),ans:nt,tol:.05,sol:`<div class="eq" style="white-space:normal">(${y1}·${f2(l1+u1)} + ${y2}·${f2(l2+u2)}) / (${f2(l1+u1)} + ${f2(l2+u2)}) = ${f2(nt)}</div>`}}
 const left=Math.random()<.5,v=left?(u1*y1+l2*y2)/(u1+l2):(l1*y1+u2*y2)/(l1+u2);return {lv:"l3",q:L(`Two rules: y₁=${y1} [${f2(l1)}, ${f2(u1)}], y₂=${y2} [${f2(l2)}, ${f2(u2)}]. Compute y<sub>${left?"l":"r"}</sub>.`,`Dua peraturan: y₁=${y1} [${f2(l1)}, ${f2(u1)}], y₂=${y2} [${f2(l2)}, ${f2(u2)}]. Kira y<sub>${left?"l":"r"}</sub>.`),ans:v,tol:.05,
  sol:`<div class="eq">${left?`(f̄₁y₁ + f̲₂y₂)/(f̄₁ + f̲₂) = (${f2(u1)}·${y1} + ${f2(l2)}·${y2})/(${f2(u1)} + ${f2(l2)})`:`(f̲₁y₁ + f̄₂y₂)/(f̲₁ + f̄₂) = (${f2(l1)}·${y1} + ${f2(u2)}·${y2})/(${f2(l1)} + ${f2(u2)})`} = ${f2(v)}</div>`}}
add({sec:S2,t:{en:"Practice: IT2 calculations",bm:"Latihan: pengiraan IT2"},noAutoDone:true,html:`
<div class="kicker rv">🎲 ${L("Unlimited practice","Latihan tanpa had")}</div><h2 class="rv">${L("Firing intervals, Nie–Tan and two-rule KM","Selang nyalaan, Nie–Tan dan KM dua peraturan")}</h2>
<div class="cols c2"><div id="p2a" class="rv"></div><div id="p2b" class="rv"></div></div>`,
 init(el){practice(el.querySelector("#p2a"),genT2);practice(el.querySelector("#p2b"),genT2)}});

/* 18 QUIZ */
add({sec:S3,t:{en:"Maths checkpoint",bm:"Titik semak matematik"},noAutoDone:true,html:`
<div class="kicker rv">✅ ${L("Formative assessment","Pentaksiran formatif")} · 6 ${L("items","item")}</div><h2 class="rv">${L("Maths checkpoint A-M","Titik semak matematik A-M")}</h2>
<div class="rv">${quiz({id:"fzM",items:[
 {q:{en:"A = 0.2/1 + 0.7/2 + 1/3. What is |A| (sigma-count)?",bm:"A = 0.2/1 + 0.7/2 + 1/3. Berapakah |A| (kiraan sigma)?"},o:["1.0","1.9","3","0.63"],a:1,why:{en:"Sum the grades: 0.2 + 0.7 + 1 = 1.9. The “/” pairs grade with element.",bm:"Jumlahkan gred: 0.2 + 0.7 + 1 = 1.9. “/” memasangkan gred dengan unsur."}},
 {q:{en:"α-cut of tri(20, 50, 80) at α = 0.5?",bm:"Potongan-α bagi tri(20, 50, 80) pada α = 0.5?"},o:["[25, 75]","[35, 65]","[40, 60]","[20, 80]"],a:1,why:{en:"[20 + 0.5·30, 80 − 0.5·30] = [35, 65].",bm:"[20 + 0.5·30, 80 − 0.5·30] = [35, 65]."}},
 {q:{en:"Max–min composition: R row = (0.9, 0.3), S column = (0.4, 0.8). T = ?",bm:"Gubahan maks–min: baris R = (0.9, 0.3), lajur S = (0.4, 0.8). T = ?"},o:["0.3","0.4","0.8","0.36"],a:1,why:{en:"max(min(0.9,0.4), min(0.3,0.8)) = max(0.4, 0.3) = 0.4.",bm:"max(min(0.9,0.4), min(0.3,0.8)) = max(0.4, 0.3) = 0.4."}},
 {q:{en:"A trapezoid segment from y=40 (h=0.6) to y=50 (h=0.6) has area…",bm:"Segmen trapezium dari y=40 (h=0.6) hingga y=50 (h=0.6) mempunyai luas…"},o:["3","6","0.6","12"],a:1,why:{en:"(50−40)(0.6+0.6)/2 = 6; its centroid is the midpoint 45.",bm:"(50−40)(0.6+0.6)/2 = 6; sentroidnya ialah titik tengah 45."}},
 {q:{en:"In KM for y_l, rules left of the switch point use…",bm:"Dalam KM untuk y_l, peraturan di kiri titik suis menggunakan…"},o:[{en:"lower firing f̲",bm:"nyalaan bawah f̲"},{en:"upper firing f̄",bm:"nyalaan atas f̄"},{en:"the average",bm:"purata"},{en:"zero",bm:"sifar"}],a:1,why:{en:"To minimise the weighted average, give the small y values as much weight as possible: f̄ on the left, f̲ on the right.",bm:"Untuk meminimumkan purata berpemberat, beri nilai y kecil pemberat sebanyak mungkin: f̄ di kiri, f̲ di kanan."}},
 {q:{en:"Two rules y₁=20 [0.2,0.6], y₂=80 [0.4,0.5]. Nie–Tan output?",bm:"Dua peraturan y₁=20 [0.2,0.6], y₂=80 [0.4,0.5]. Output Nie–Tan?"},o:["50.0","51.8","44.7","55.3"],a:1,why:{en:"Weights are f̲+f̄: 0.8 and 0.9. (20·0.8 + 80·0.9)/(0.8 + 0.9) = 88/1.7 ≈ 51.8.",bm:"Pemberat ialah f̲+f̄: 0.8 dan 0.9. (20·0.8 + 80·0.9)/(0.8 + 0.9) = 88/1.7 ≈ 51.8."}}]})}</div>`});

/* 19 FORMULA SHEET */
add({sec:S3,t:{en:"Formula sheet",bm:"Helaian formula"},html:`
<div class="kicker rv">📄 ${L("Keep this","Simpan ini")}</div><h2 class="rv">${L("Fuzzy logic formula sheet","Helaian formula logik kabur")}</h2>
<div class="cols c3 rv">
<div class="card small"><b>${L("Sets","Set")}</b><div class="mono">∪ max · ∩ min · ¬ 1−μ<br>|A| = Σμ · h = max μ<br>A<sub>α</sub> = [a+α(b−a), c−α(c−b)]<br>very μ² · somewhat √μ<br>S(A,B) = |A∩B|/|A|</div></div>
<div class="card small"><b>${L("Inference (T1)","Inferens (J1)")}</b><div class="mono">f<sub>i</sub> = T(μ<sub>1</sub>, μ<sub>2</sub>)<br>Mamdani: min(f, μ<sub>B</sub>) · Larsen: f·μ<sub>B</sub><br>agg: max<sub>i</sub><br>y* = Σμy/Σμ<br>A<sub>s</sub>=(Δy)(h₁+h₂)/2<br>Sugeno: Σf<sub>i</sub>z<sub>i</sub>/Σf<sub>i</sub></div></div>
<div class="card small"><b>IT2</b><div class="mono">J<sub>x</sub> = [μ̲(x), μ̄(x)]<br>f̲ = T(μ̲…), f̄ = T(μ̄…)<br>y<sub>l</sub>: f̄ left / f̲ right<br>y<sub>r</sub>: f̲ left / f̄ right<br>y = (y<sub>l</sub>+y<sub>r</sub>)/2<br>NT: Σy(f̲+f̄)/Σ(f̲+f̄)</div></div></div>
<div class="cols c2" style="margin-top:12px"><ol class="refs rv">
<li>Zadeh, L. A. (1965). Fuzzy sets. <a href="https://doi.org/10.1016/S0019-9958(65)90241-X" target="_blank" rel="noopener">doi.org/10.1016/S0019-9958(65)90241-X</a></li>
<li>Zadeh, L. A. (1975). The concept of a linguistic variable… <a href="https://doi.org/10.1016/0020-0255(75)90036-5" target="_blank" rel="noopener">doi.org/10.1016/0020-0255(75)90036-5</a></li>
<li>Takagi, T., &amp; Sugeno, M. (1985). <a href="https://doi.org/10.1109/TSMC.1985.6313399" target="_blank" rel="noopener">doi.org/10.1109/TSMC.1985.6313399</a></li></ol>
<ol class="refs rv" start="4"><li>Karnik, N. N., Mendel, J. M., &amp; Liang, Q. (1999). Type-2 fuzzy logic systems. <a href="https://doi.org/10.1109/91.811231" target="_blank" rel="noopener">doi.org/10.1109/91.811231</a></li>
<li>Mendel, J. M., &amp; John, R. I. (2002). Type-2 fuzzy sets made simple. <a href="https://doi.org/10.1109/91.995115" target="_blank" rel="noopener">doi.org/10.1109/91.995115</a></li>
<li>Mendel, J. M. (2017). <i>Uncertain Rule-Based Fuzzy Systems</i> (2nd ed.). <a href="https://doi.org/10.1007/978-3-319-51370-6" target="_blank" rel="noopener">doi.org/10.1007/978-3-319-51370-6</a></li></ol></div>
<p class="rv"><a class="btn" href="deck-fuzzy.html">← ${L("Module A","Modul A")}</a> <a class="btn pri" href="deck-ann-math.html">${L("Module B-M: maths of neural networks","Modul B-M: matematik rangkaian neural")} →</a></p>`});

T6544.start({key:"fuzzymath",title:{en:"Module A-M · Maths of fuzzy logic",bm:"Modul A-M · Matematik logik kabur"},hub:"index.html",twin:{href:"deck-fuzzy.html",label:{en:"📘 Main deck",bm:"📘 Dek utama"}},slides});
})();
