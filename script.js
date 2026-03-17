// -- CONFIG --------------------------------------------------------------------
const UNSPLASH_KEY = '7clGwldz_Ty9Xzn-UEEEBCJq59R2U__Greh--78Hrpg';

const EPD_BASE = {
  cs: {
    'NORTEC':         { elec: 9.16, thermal: 13.23, water: 28.13, alpha: 0.93,  beta: 36.08 },
    'FLOOR and more': { elec: 4.43, thermal: 13.40, water: 23.10, alpha: 6.57,  beta: 20.81 },
    'NORIT':          { elec: 4.43, thermal: 13.40, water: 23.10, alpha: 6.57,  beta: 20.81 },
  },
  wf: {
    'LIGNA':    { energy: 0.60, virginWood: 9.3, incinerationBase: 78.56 },
    'LIGNA ST': { energy: 0.60, virginWood: 9.3, incinerationBase: 78.56 },
  },
};

const MATH_INFO = {
  co2_cs_reuse:    { formula: '(A1-C4 orig - A1-C4 ref) x m2', example: 'e.g. (14.60 - 3.41) x 500 = 5,595 kg CO2' },
  energy_cs:       { formula: '(Elec% x base_elec + Thermal% x base_thermal) x m2', example: 'e.g. (0.93x9.16 + 1.00x13.23) x 500 kWh' },
  water_cs:        { formula: 'Water% x base_water_litres x m2', example: 'e.g. 1.00 x 28.13 x 500 = 14,065 L' },
  gypsum_cs:       { formula: '(Alpha% x base_alpha + Beta% x base_beta) x m2', example: 'e.g. (1.00x0.93 + 1.00x36.08) x 500 = 18,505 kg' },
  co2_wf_reuse:    { formula: '(A1-C4 orig - A1-C4 ref) x m2', example: 'e.g. (5.14 - 1.02) x 500 = 2,060 kg CO2' },
  wood_wf:         { formula: 'Wood% x 9.3 kg/m2 x m2', example: 'e.g. 0.50 x 9.3 x 500 = 2,325 kg' },
  energy_wf_reuse: { formula: 'Elec% x base_energy_kWh x m2', example: 'e.g. 1.00 x 0.60 x 500 = 300 kWh' },
  elec_recovery:   { formula: 'ElecRec% x (18.66 kg x 4.21 kWh/kg) x m2', example: 'e.g. 0.25 x 78.56 x 12 = 235.7 kWh' },
  thermal_recovery:{ formula: 'ThermalRec% x (18.66 kg x 4.21 kWh/kg) x m2', example: 'e.g. 0.45 x 78.56 x 12 = 424.2 kWh' },
};

const EOL_INFO = {
  Landfilling: {
    query:'construction waste landfill site', label:'LANDFILLING', title:'End of the Road',
    color:'#e05c5c', fallback:'linear-gradient(160deg,#2a1a1a,#3d2020)',
    bullets:[{icon:'X',text:'No material or energy recovered'},{icon:'!',text:'Worst environmental outcome'}],
  },
  Recycling: {
    query:'gypsum recycling industrial facility', label:'RECYCLING', title:'Back into Production',
    color:'#c8b84a', fallback:'linear-gradient(160deg,#1e2010,#2e3518)',
    bullets:[{icon:'*',text:'Raw gypsum recovered and re-entered into production'},{icon:'~',text:'Reduces demand for virgin material'}],
  },
  Reuse: {
    query:'beautiful restored wooden floor interior architecture', label:'REUSE', title:'A Second Life',
    color:'#4ecca3', fallback:'linear-gradient(160deg,#0d1f1a,#122b22)',
    bullets:[
      {icon:'*',text:'Panel refurbished — no new production needed'},
      {icon:'+',text:'Maximum carbon and resource savings'},
    ],
    bulletsCarbonWood:[
      {icon:'*',text:'Panel refurbished — no new production needed'},
      {icon:'&#127795;',text:'Avoids cutting new trees — virgin Wood demand eliminated'},
      {icon:'&#129504;',text:'Carbon stored in wood is preserved — no release from burning or decay'},
      {icon:'+',text:'Maximum carbon and resource savings'},
    ],
  },
  Incineration: {
    query:'biomass energy plant renewable electricity', label:'INCINERATION', title:'Energy Recovery',
    color:'#f7a04a', fallback:'linear-gradient(160deg,#1f1200,#2e1e00)',
    bullets:[{icon:'~',text:'Wood product been burned — product discarded'},{icon:'*',text:'Generates electricity and District heat'}],
  },
};

const CR_EOL_INFO = {
  Reuse: {
    query:'modular office pod refurbished architecture interior',
    label:'REUSE', title:'A Second Life',
    color:'#4ecca3', fallback:'linear-gradient(160deg,#0d1f1a,#122b22)',
    bullets:[
      {icon:'*', text:'CAS room refurbished -- no new production needed'},
      {icon:'+', text:'All modular components reused in new configuration'},
      {icon:'~', text:'Maximum energy and material resource savings'},
      {icon:'~', text:'Carbon locked in materials is preserved -- no new extraction'},
    ],
  },
  Recycling: {
    query:'modular building dismantling material recycling facility',
    label:'RECYCLING', title:'Material Recycling',
    color:'#c8b84a', fallback:'linear-gradient(160deg,#1e2010,#2e3518)',
    bullets:[
      {icon:'*', text:'CAS room dismantled -- components sorted by material'},
      {icon:'~', text:'Aluminium, glass, steel, wood & stainless steel recovered'},
      {icon:'+', text:'Raw materials re-entered into production cycles'},
    ],
  },
};
const _photoCache = {};

// -- EOL CARD ------------------------------------------------------------------
async function showEolCard(matKey, eol) {
  const area = document.getElementById('eol-card-area-' + matKey);
  if (!area) return;
  if (!eol) { area.style.display='none'; area.innerHTML=''; return; }
  const info = (matKey==='cr' && CR_EOL_INFO[eol]) ? CR_EOL_INFO[eol] : EOL_INFO[eol]; if (!info) return;
  // icons handled per-eol below
  // For wooden floors Reuse — use the richer wood/carbon bullet list
  const activeBullets = (eol==='Reuse' && matKey==='wf' && info.bulletsCarbonWood)
    ? info.bulletsCarbonWood : info.bullets;
  const eolIcons = {
    Reuse:        ['✨','&#x1F333;','&#x1F9E0;','+'],
    Recycling:    ['&#x1F3ED;','♻️','&#x1F535;'],
    Incineration: ['&#x1F525;','&#x1F4A1;','♻️'],
    Landfilling:  ['❌','&#x1F4CD;','⚠️'],
  };
  const iconArr = eolIcons[eol]||[];
  area.innerHTML = `
    <div class="eol-single-card" style="border-color:${info.color};box-shadow:0 0 24px ${info.color}28">
      <div class="eol-card-photo" id="eol-photo-${matKey}" style="background:${info.fallback}"><div class="eol-photo-overlay"></div></div>
      <div class="eol-card-body">
        <div class="eol-card-label" style="color:${info.color}">${info.label}</div>
        <div class="eol-card-title">${info.title}</div>
        <ul class="eol-card-bullets">${activeBullets.map((b,i)=>`<li><span class="eol-bullet-icon">${iconArr[i]||'•'}</span>${b.text}</li>`).join('')}</ul>
        <div class="eol-photo-credit" id="eol-credit-${matKey}"></div>
      </div>
    </div>`;
  area.style.display = 'block';
  if (_photoCache[eol]) {
    const c=_photoCache[eol];
    const p=document.getElementById('eol-photo-'+matKey); if(p){p.style.backgroundImage=`url(${c.url})`;p.style.backgroundSize='cover';}
    const cr=document.getElementById('eol-credit-'+matKey); if(cr&&c.credit)cr.innerHTML=c.credit;
    return;
  }
  try {
    const res=await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(info.query)}&orientation=landscape&client_id=${UNSPLASH_KEY}`);
    if(!res.ok)throw new Error(res.status);
    const data=await res.json();
    const url=data.urls.regular;
    let credit='';
    if(data.user){const link=`${data.user.links.html}?utm_source=boden_optimizer&utm_medium=referral`;credit=`Photo: <a href="${link}" target="_blank">${data.user.name}</a> on Unsplash`;}
    _photoCache[eol]={url,credit};
    const p=document.getElementById('eol-photo-'+matKey); if(p){p.style.backgroundImage=`url(${url})`;p.style.backgroundSize='cover';}
    const cr=document.getElementById('eol-credit-'+matKey); if(cr&&credit)cr.innerHTML=credit;
  } catch(err){console.warn('Unsplash fail:',err.message);}
}

// -- MATERIAL SWITCH -----------------------------------------------------------
function switchMaterial(key){
  const isCS=key==='calcium_sulphate', isWF=key==='wooden_floors', isCR=key==='cas_room';
  document.getElementById('btn-cs').classList.toggle('active',isCS);
  document.getElementById('btn-wf').classList.toggle('active',isWF);
  document.getElementById('btn-cr').classList.toggle('active',isCR);
  document.getElementById('panel-calcium_sulphate').style.display=isCS?'block':'none';
  document.getElementById('panel-wooden_floors').style.display=isWF?'block':'none';
  document.getElementById('panel-cas_room').style.display=isCR?'block':'none';
}

// -- MATERIALS -----------------------------------------------------------------
const MATERIALS = {
  cs:{csvPath:'calcium_sulphate.csv',selProduct:'sel-product-cs',selEol:'sel-eol-cs',results:'results-cs',inner:'results-inner-cs',noData:'no-data-cs',loading:'csv-loading-cs',error:'csv-error-cs',comingSoon:null,data:{}},
  wf:{csvPath:'wooden_floors.csv',selProduct:'sel-product-wf',selEol:'sel-eol-wf',results:'results-wf',inner:'results-inner-wf',noData:'no-data-wf',loading:'csv-loading-wf',error:'csv-error-wf',comingSoon:null,data:{}},
  cr:{csvPath:'CAS.csv',selProduct:'sel-product-cr',selEol:'sel-eol-cr',results:'results-cr',inner:'results-inner-cr',noData:'no-data-cr',loading:'csv-loading-cr',error:'csv-error-cr',comingSoon:null,data:{}},
};

let _pieId=0, _renderStamp=0, _pieRegistry=[];

// -- CSV PARSERS ---------------------------------------------------------------
const parsePct = v=>{const s=(v||'').replace('%','').trim();return s===''?0:parseInt(s,10)||0;};

function parseCSV_cs(text){
  const parsed={};
  text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/^\uFEFF/,'').split('\n').map(r=>r.split(',').map(c=>c.trim())).forEach(cols=>{
    const product=cols[1],eol=cols[2],origVal=parseFloat(cols[3]);
    if(!product||!eol||isNaN(origVal))return;
    const pl=product.toLowerCase();
    if(pl.includes('calcium')||pl.includes('boden')||pl==='wooden floors'||eol.toLowerCase()==='eol')return;
    if(!parsed[product])parsed[product]={refurbishedTo:'',scenarios:{}};
    if(cols[4])parsed[product].refurbishedTo=cols[4];
    parsed[product].scenarios[eol]={a1c4_orig:origVal,a1c4_ref:eol==='Reuse'?(parseFloat(cols[5])||0):0,
      electricity:parsePct(cols[6]),thermal:parsePct(cols[7]),water:parsePct(cols[8]),alpha:parsePct(cols[9]),beta:parsePct(cols[10])};
  });
  return parsed;
}

function parseCSV_wf(text){
  const parsed={};
  text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/^\uFEFF/,'').split('\n').map(r=>r.split(',').map(c=>c.trim())).forEach(cols=>{
    const product=cols[1],eol=cols[2],origVal=parseFloat(cols[3]);
    if(!product||!eol||isNaN(origVal))return;
    const pl=product.toLowerCase();
    if(pl.includes('wooden')||pl.includes('boden')||eol.toLowerCase()==='eol')return;
    if(!parsed[product])parsed[product]={refurbishedTo:'',scenarios:{}};
    if(cols[4])parsed[product].refurbishedTo=cols[4].trim();
    parsed[product].scenarios[eol]={a1c4_orig:origVal,a1c4_ref:eol==='Reuse'?(parseFloat(cols[5])||0):0,
      electricity:parsePct(cols[6]),thermal:parsePct(cols[7]),treeSavings:parsePct(cols[8]),steelSavings:parsePct(cols[9]),
      recoveryElec:parsePct(cols[10]),recoveryThermal:parsePct(cols[11])};
  });
  return parsed;
}

function parseCSV_cr(text){
  const parsed={};
  const pct=v=>{const x=(v||'').replace('%','').trim();return x===''?0:parseInt(x,10)||0;};
  text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').forEach(line=>{
    const cols=line.split(',').map(c=>c.trim());
    const product=cols[0];
    const eolRaw=(cols[1]||'').trim();
    const origVal=parseFloat(cols[2]);
    if(!product||!eolRaw||isNaN(origVal))return;
    if(product.toLowerCase().includes('cas')||product.toLowerCase().includes('type'))return;
    if(eolRaw.toLowerCase().includes('scenario')||eolRaw.toLowerCase().includes('energy'))return;
    const eol=eolRaw.toLowerCase().includes('rec')?'Recycling':'Reuse';
    if(!parsed[product])parsed[product]={refurbishedTo:'Refurbished CAS Room',scenarios:{}};
    parsed[product].scenarios[eol]={
      a1c4_orig:origVal, a1c4_ref:13.45,
      energy:pct(cols[3]),
      aluminium:pct(cols[4]), steel:pct(cols[5]),
      wood:pct(cols[6]),      glass:pct(cols[7]),
      stainlessSteel:pct(cols[8])
    };
  });
  return parsed;
}
function populateSelectors(matKey){
  const m=MATERIALS[matKey];
  const selProduct=document.getElementById(m.selProduct),selEol=document.getElementById(m.selEol);
  const products=Object.keys(m.data);
  selProduct.innerHTML='<option value="">— Select product —</option>';
  products.forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;selProduct.appendChild(o);});
  const eolSet=new Set();
  products.forEach(p=>Object.keys(m.data[p].scenarios).forEach(e=>eolSet.add(e)));
  const order=['Reuse','Recycling','Incineration','Landfilling'];
  selEol.innerHTML='<option value="">— Select EOL scenario —</option>';
  order.forEach(e=>{if(eolSet.has(e)){const o=document.createElement('option');o.value=e;o.textContent=e;selEol.appendChild(o);eolSet.delete(e);}});
  eolSet.forEach(e=>{const o=document.createElement('option');o.value=e;o.textContent=e;selEol.appendChild(o);});
  selProduct.value='';selEol.value='';
  document.getElementById(m.results).classList.remove('visible');
  document.getElementById(m.noData).style.display='block';
}

// -- PIE -----------------------------------------------------------------------
function makePie(pctVal,color){
  const id='pie-'+_renderStamp+'-'+(_pieId++);
  // r=54 gives a good ring. stroke-width=13 is balanced.
  const r=54, cx=70, cy=70, circ=2*Math.PI*r;
  const arcColor = pctVal===0 ? 'var(--surface2)' : color;
  const textColor = pctVal===0 ? 'var(--text-dim)' : 'var(--text)';
  // Round caps add ~strokeWidth of length, so at 100% use butt cap to fill perfectly
  const linecap = pctVal>=100 ? 'butt' : 'round';
  // At 100% with butt cap, full circ fills ring exactly
  const initDash = 0;
  const targetDash = pctVal>=100 ? circ : (pctVal/100)*circ;
  const glow = pctVal>0 ? `filter:drop-shadow(0 0 10px ${color}66);` : '';
  _pieRegistry.push({arcId:`${id}-arc`,txtId:`${id}-txt`,targetPct:pctVal,targetDash,fullDash:circ,linecap});
  return `<div class="pie-svg-wrap">
    <svg viewBox="0 0 140 140" overflow="visible">
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="13"/>
      <circle id="${id}-arc" cx="70" cy="70" r="${r}" fill="none" stroke="${arcColor}" stroke-width="13"
        stroke-dasharray="0 ${circ}" stroke-linecap="${linecap}"
        style="transition:stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1);${glow}"/>
    </svg>
    <div class="pie-pct-text" id="${id}-txt" style="color:${textColor}">0%</div>
  </div>`;
}

function animateAllPies(){
  const registry=[..._pieRegistry];
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    setTimeout(()=>{
      registry.forEach(({arcId,txtId,targetPct,targetDash,fullDash,linecap})=>{
        const arc=document.getElementById(arcId),txt=document.getElementById(txtId);
        if(!arc||!txt)return;
        // Apply correct linecap before animating (butt for 100%, round otherwise)
        arc.setAttribute('stroke-linecap', linecap||'round');
        arc.style.strokeDasharray=`${targetDash} ${fullDash}`;
        if(targetPct>0){
          let cur=0;const inc=Math.max(1,Math.ceil(targetPct/50));
          const tick=()=>{
            cur=Math.min(cur+inc,targetPct);
            txt.textContent=cur+'%';
            if(cur<targetPct) requestAnimationFrame(tick);
            else txt.textContent=targetPct+'%';
          };
          requestAnimationFrame(tick);
        } else {
          txt.textContent='0%';
        }
      });
    },80);
  }));
}

function animateDonut(stamp,reduction){
  const circ=2*Math.PI*80,filled=(reduction/100)*circ;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    setTimeout(()=>{
      const arc=document.getElementById('donut-arc-'+stamp);
      const pctEl=document.getElementById('donut-pct-'+stamp);
      if(!arc||!pctEl)return;
      arc.style.strokeDasharray=`${filled} ${circ}`;
      let start=0;const inc=Math.max(1,Math.ceil(reduction/60));
      const step=()=>{start=Math.min(start+inc,reduction);pctEl.textContent=start+'%';if(start<reduction)requestAnimationFrame(step);};
      requestAnimationFrame(step);
    },120);
  }));
}

function co2Reduction(orig,ref){return Math.round(((orig-ref)/orig)*100);}
function fmt(val,dec=1){
  if(typeof val!=='number'||isNaN(val))return '0';
  // Indian number system: groups as 1,00,000 with period decimal
  const parts=val.toFixed(dec).split('.');
  let intPart=parts[0], decPart=parts[1]||'';
  const neg=intPart.startsWith('-');
  if(neg)intPart=intPart.slice(1);
  // Indian grouping: last 3 digits, then groups of 2
  let res='';
  if(intPart.length>3){
    const last3=intPart.slice(-3);
    const rest=intPart.slice(0,-3);
    const groups=[];
    for(let i=rest.length;i>0;i-=2) groups.unshift(rest.slice(Math.max(0,i-2),i));
    res=groups.join(',') + ',' + last3;
  } else {
    res=intPart;
  }
  return (neg?'-':'')+res+(dec>0?'.'+decPart:'');
}
function pieItem(pct,color,label,sub){
  return `<div class="pie-item">${makePie(pct,color)}<div class="pie-label-block"><span class="pie-label" style="color:${color}">${label}</span><span class="pie-sublabel">${sub}</span></div></div>`;
}

// -- MATH TOOLTIP -------------------------------------------------------------
function mathTooltip(key){
  const info=MATH_INFO[key]; if(!info)return '';
  return `<button class="math-btn" onclick="toggleMath('math-${key}')" title="Show formula">f</button>
    <div class="math-tooltip" id="math-${key}" style="display:none">
      <div class="math-formula">${info.formula}</div>
      <div class="math-example">${info.example}</div>
    </div>`;
}
function toggleMath(id){const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'block':'none';}

// -- SAVINGS CARDS -------------------------------------------------------------
function renderSavingsCS(sc){
  const energyAvg=Math.round((sc.electricity+sc.thermal)/2);
  const gypsumAvg=Math.round((sc.alpha+sc.beta)/2);
  return `<div class="savings-grid-outer savings-3col anim anim-d3">
    <div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#9889;</div><div class="savings-card-title-block"><div class="savings-card-title">Energy Savings</div><div class="savings-card-desc">Combined electricity and thermal energy avoided vs. new production.</div></div></div>
      <div class="savings-card-body">${pieItem(energyAvg,'#f7c873','Energy Savings','% vs. new production')}</div></div>
    <div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#128167;</div><div class="savings-card-title-block"><div class="savings-card-title">Water Savings</div><div class="savings-card-desc">Freshwater consumption avoided vs. manufacturing new.</div></div></div>
      <div class="savings-card-body">${pieItem(sc.water,'#7b9ee8','Water Savings','% vs. new production')}</div></div>
    <div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#129704;</div><div class="savings-card-title-block"><div class="savings-card-title">Resource Savings</div><div class="savings-card-desc">Alpha and beta gypsum recovered — mining avoided.</div></div></div>
      <div class="savings-card-body">${pieItem(gypsumAvg,'#4ecca3','Resource Savings','% material recovered')}</div></div>
  </div>`;
}

function renderSavingsWF(sc,product){
  const isST=product&&product.toUpperCase().includes('ST');
  const hasEnergy=sc.electricity>0||sc.thermal>0;
  const hasResource=sc.treeSavings>0||sc.steelSavings>0;
  const hasRecovery=sc.recoveryElec>0||sc.recoveryThermal>0;
  const energyAvg=Math.round((sc.electricity+sc.thermal)/2);
  // Count visible cards to pick right grid class
  const cardCount=[hasEnergy,hasResource,hasRecovery].filter(Boolean).length;
  const gridClass=cardCount===3?'savings-3col':cardCount===2?'savings-2col':'savings-1col';
  return `<div class="savings-grid-outer ${gridClass} anim anim-d3">
    ${hasEnergy?`<div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#9889;</div><div class="savings-card-title-block"><div class="savings-card-title">Energy Savings</div><div class="savings-card-desc">Manufacturing energy avoided vs. new production.</div></div></div>
      <div class="savings-card-body">${pieItem(energyAvg,'#f7c873','Energy Savings','% vs. new production')}</div></div>`:''}
    ${hasResource?`<div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#127795;</div><div class="savings-card-title-block"><div class="savings-card-title">Resource Savings</div><div class="savings-card-desc">${isST?'Virgin wood and steel avoided.':'Virgin wood avoided.'}</div></div></div>
      <div class="savings-card-body">
        ${pieItem(sc.treeSavings,'#4ecca3','Wood Savings','% virgin wood avoided')}
        ${isST?`<div class="pie-divider"></div>${pieItem(sc.steelSavings,'#a8edcc','Steel Savings','% steel avoided')}`:''}
      </div></div>`:''}
    ${hasRecovery?`<div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#128293;</div><div class="savings-card-title-block"><div class="savings-card-title">Energy Recovery</div><div class="savings-card-desc">Energy from incineration.</div></div></div>
      <div class="savings-card-body">
        ${pieItem(sc.recoveryElec,'#f7a04a','Electricity','% recovered')}
        <div class="pie-divider"></div>
        ${pieItem(sc.recoveryThermal,'#e06b75','Thermal Heat','% heat recovered')}
      </div></div>`:''}
  </div>`;
}

function renderSavingsCR(sc){
  const hasEnergy=sc.energy>0;
  const resources=[];
  if(sc.aluminium>0) resources.push({pct:sc.aluminium,color:'#a8c5da',label:'Aluminium',sub:'% recovered'});
  if(sc.steel>0)     resources.push({pct:sc.steel,    color:'#7b9ee8',label:'Steel',    sub:'% recovered'});
  if(sc.wood>0)      resources.push({pct:sc.wood,     color:'#4ecca3',label:'Wood',     sub:'% recovered'});
  if(sc.glass>0)     resources.push({pct:sc.glass,    color:'#a8edcc',label:'Glass',    sub:'% recovered'});
  if(sc.stainlessSteel>0) resources.push({pct:sc.stainlessSteel,color:'#e0b87a',label:'Stainless Steel',sub:'% recovered'});
  const cards=[];
  if(hasEnergy) cards.push(
    '<div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#9889;</div>' +
    '<div class="savings-card-title-block"><div class="savings-card-title">Energy Savings</div>' +
    '<div class="savings-card-desc">Manufacturing energy avoided vs. new production.</div></div></div>' +
    '<div class="savings-card-body">' + pieItem(sc.energy,'#f7c873','Energy Savings','% vs. new production') + '</div></div>'
  );
  if(resources.length>0){
    const ringsHtml=resources.map((r,i)=>(i>0?'<div class="pie-divider"></div>':'')+pieItem(r.pct,r.color,r.label,r.sub)).join('');
    cards.push(
      '<div class="savings-card-new"><div class="savings-card-top"><div class="savings-card-icon">&#9851;</div>' +
      '<div class="savings-card-title-block"><div class="savings-card-title">Material Recovery</div>' +
      '<div class="savings-card-desc">Aluminium, steel, wood, glass and stainless steel recovered.</div></div></div>' +
      '<div class="savings-card-body">' + ringsHtml + '</div></div>'
    );
  }
  const gridClass=cards.length===1?'savings-1col':'savings-2col';
  return '<div class="savings-grid-outer '+gridClass+' anim anim-d3">'+cards.join('')+'</div>';
}
// -- ABSOLUTE IMPACT -----------------------------------------------------------
function absStatCard(icon,value,unit,label,color,mathKey){
  return `<div class="abs-stat-card">
    <div class="abs-stat-header"><div class="abs-stat-icon">${icon}</div>${mathKey?mathTooltip(mathKey):''}</div>
    <div class="abs-stat-value" style="color:${color}">${value}</div>
    <div class="abs-stat-unit">${unit}</div>
    <div class="abs-stat-label">${label}</div>
  </div>`;
}

function renderAbsoluteCS(product,sc,m2){
  const base=EPD_BASE.cs[product]||EPD_BASE.cs['FLOOR and more'];
  const cards=[];
  if(sc.a1c4_ref>0){const co2=(sc.a1c4_orig-sc.a1c4_ref)*m2;if(co2>0)cards.push(absStatCard('&#x1F33F;',fmt(co2),'kg CO2 avoided','Carbon footprint avoided vs. new production','#4ecca3','co2_cs_reuse'));}
  const elecS=(sc.electricity/100)*base.elec*m2,thermalS=(sc.thermal/100)*base.thermal*m2,energyS=elecS+thermalS;
  if(energyS>0)cards.push(absStatCard('⚡',fmt(energyS),'kWh saved','Electricity + thermal energy avoided','#f7c873','energy_cs'));
  const waterS=(sc.water/100)*base.water*m2;
  if(waterS>0)cards.push(absStatCard('&#x1F4A7;',fmt(waterS),'litres saved','Freshwater consumption avoided','#7b9ee8','water_cs'));
  const gypsumS=((sc.alpha/100)*base.alpha+(sc.beta/100)*base.beta)*m2;
  if(gypsumS>0)cards.push(absStatCard('&#x1FAA8;',fmt(gypsumS),'kg gypsum saved','Virgin gypsum extraction avoided','#a8edcc','gypsum_cs'));
  if(!cards.length)return '';
  return `<div class="abs-section anim anim-d4">
    <div class="section-label">Project Impact</div>
    <div class="abs-impact-banner">
      <div class="abs-impact-banner-icon">&#127881;</div>
      <div class="abs-impact-banner-text">
        <strong>Total Impact for ${fmt(m2,0)} m&#178;</strong>
        <span>Estimated savings when refurbishing instead of producing new flooring</span>
      </div>
    </div>
    <div class="abs-grid">${cards.join('')}</div>
  </div>`;
}

function renderAbsoluteWF(product,sc,eol,m2){
  const base=EPD_BASE.wf[product]||EPD_BASE.wf['LIGNA'];
  const cards=[];
  if(eol==='Reuse'){
    if(sc.a1c4_ref>0){const co2=(sc.a1c4_orig-sc.a1c4_ref)*m2;if(co2>0)cards.push(absStatCard('&#x1F33F;',fmt(co2),'kg CO2 avoided','Carbon footprint avoided','#4ecca3','co2_wf_reuse'));}
    const woodS=(sc.treeSavings/100)*base.virginWood*m2;
    if(woodS>0)cards.push(absStatCard('&#x1F333;',fmt(woodS),'kg wood saved','Virgin Wood extraction avoided','#a8edcc','wood_wf'));
    const energyS=(sc.electricity/100)*base.energy*m2;
    if(energyS>0)cards.push(absStatCard('⚡',fmt(energyS),'kWh saved','Manufacturing energy avoided','#f7c873','energy_wf_reuse'));
  } else {
    const inc=base.incinerationBase;
    const elecG=(sc.recoveryElec/100)*inc*m2,thermalG=(sc.recoveryThermal/100)*inc*m2;
    if(elecG>0)cards.push(absStatCard('&#x1F4A1;',fmt(elecG),'kWh electricity','Electricity generated','#f7a04a','elec_recovery'));
    if(thermalG>0)cards.push(absStatCard('&#x1F525;',fmt(thermalG),'kWh heat','Thermal energy recovered','#e06b75','thermal_recovery'));
  }
  if(!cards.length)return '';
  const bannerText = eol==='Reuse'
    ? 'Estimated savings when refurbishing instead of producing new flooring'
    : 'Energy generated from biomass incineration at end of life';
  return `<div class="abs-section anim anim-d4">
    <div class="section-label">Project Impact</div>
    <div class="abs-impact-banner">
      <div class="abs-impact-banner-icon">${eol==='Reuse'?'&#127881;':'&#9889;'}</div>
      <div class="abs-impact-banner-text">
        <strong>Total Impact for ${fmt(m2,0)} m&#178;</strong>
        <span>${bannerText}</span>
      </div>
    </div>
    <div class="abs-grid">${cards.join('')}</div>
  </div>`;
}

function renderAbsoluteCR(product,sc,eol,m2){
  const cards=[];
  if(eol==='Reuse'){
    const co2=sc.a1c4_orig*m2;
    if(co2>0)cards.push(absStatCard('&#127807;',fmt(co2),'kg CO2 avoided','Full carbon footprint avoided -- CAS room fully reused','#4ecca3',null));
  }
  if(!cards.length)return '';
  return `<div class="abs-section anim anim-d4">
    <div class="section-label">Project Impact</div>
    <div class="abs-impact-banner">
      <div class="abs-impact-banner-icon">&#127881;</div>
      <div class="abs-impact-banner-text">
        <strong>Total Impact for ${fmt(m2,0)} m&#178;</strong>
        <span>${eol==='Reuse'?'Full CO2 savings -- CAS Room fully reused, no new production':'Material recovery savings'}</span>
      </div>
    </div>
    <div class="abs-grid">${cards.join('')}</div>
  </div>`;
}
function updateAbsoluteSingle(matKey,product,eol){
  const input=document.getElementById('mlinput-'+matKey);
  const absEl=document.getElementById('mlabs-'+matKey);
  if(!input||!absEl)return;
  const m2=parseFloat(input.value);
  if(!m2||m2<=0){absEl.innerHTML='';return;}
  const sc=MATERIALS[matKey].data[product].scenarios[eol];
  absEl.innerHTML=matKey==='cs'?renderAbsoluteCS(product,sc,m2):matKey==='cr'?renderAbsoluteCR(product,sc,eol,m2):renderAbsoluteWF(product,sc,eol,m2);
}

function updateAbsoluteCompare(matKey,product,eol,side){
  const input=document.getElementById('mlinput-'+matKey+'-'+side);
  const absEl=document.getElementById('mlabs-'+matKey+'-'+side);
  if(!input||!absEl)return;
  const m2=parseFloat(input.value);
  if(!m2||m2<=0){absEl.innerHTML='';return;}
  const sc=MATERIALS[matKey].data[product].scenarios[eol];
  absEl.innerHTML=matKey==='cs'?renderAbsoluteCS(product,sc,m2):matKey==='cr'?renderAbsoluteCR(product,sc,eol,m2):renderAbsoluteWF(product,sc,eol,m2);
}

// Legacy alias for PDF export compatibility
function updateAbsolute(matKey,product,eol){
  updateAbsoluteSingle(matKey,product,eol);
}

// -- PROJECT AREA INPUT -------------------------------------------------------
function m2CardHtml(inputId, absId, product, eol, onInputCall) {
  const eolInfo = EOL_INFO[eol] || {};
  const eolColor = eolInfo.color || 'var(--accent)';
  return `
  <div class="m2-card anim anim-d4" style="border-color:${eolColor}20;box-shadow:0 0 20px ${eolColor}08">
    <div class="m2-card-label" style="color:${eolColor}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
      Project Area <span class="m2-badge" style="background:${eolColor}18;border-color:${eolColor}40;color:${eolColor}">optional</span>
    </div>
    <div class="m2-card-body">
      <div class="m2-card-desc">Enter floor area to see total impact for <strong style="color:${eolColor}">${eol}</strong> scenario</div>
      <div class="m2-input-group">
        <input type="number" id="${inputId}" class="m2-input-field" placeholder="0" min="1" max="99999"
          oninput="${onInputCall}"/>
        <span class="m2-input-unit" style="color:${eolColor}">m&#178;</span>
      </div>
    </div>
  </div>
  <div id="${absId}"></div>`;
}

function makeM2Input(matKey,product,eol){
  return m2CardHtml(
    'mlinput-'+matKey,
    'mlabs-'+matKey,
    product, eol,
    "updateAbsoluteSingle('" + matKey + "','" + product + "','" + eol + "')"
  );
}

function makeM2InputCompare(matKey,product,eol,side){
  const inputId='mlinput-'+matKey+'-'+side;
  const absId='mlabs-'+matKey+'-'+side;
  return m2CardHtml(
    inputId, absId, product, eol,
    "updateAbsoluteCompare('" + matKey + "','" + product + "','" + eol + "','" + side + "')"
  );
}

// -- RENDER — returns structured sections for single OR compare view ------------
function buildSections(matKey,product,eol,stamp){
  const m=MATERIALS[matKey],pd=m.data[product],sc=pd.scenarios[eol];
  const refName=pd.refurbishedTo,isReuse=eol==='Reuse';
  let a1c4Html='',contextHtml='';

  if(isReuse){
    const reduction=co2Reduction(sc.a1c4_orig,sc.a1c4_ref);
    a1c4Html='';
    contextHtml=`
      <div class="co2-donut-wrap">
        <div class="donut-center">
          <svg viewBox="0 0 200 200" style="transform:rotate(-90deg);filter:drop-shadow(0 0 18px rgba(78,204,163,0.22))">
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--surface2)" stroke-width="20"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e06b75" stroke-width="20" stroke-dasharray="502.65 502.65" stroke-linecap="round" opacity="0.3"/>
            <circle id="donut-arc-${stamp}" cx="100" cy="100" r="80" fill="none" stroke="#4ecca3" stroke-width="20" stroke-dasharray="0 502.65" stroke-linecap="round" style="transition:stroke-dasharray 1.4s cubic-bezier(.22,1,.36,1)"/>
          </svg>
          <div class="donut-inner-text">
            <div class="donut-pct" id="donut-pct-${stamp}">0%</div>
            <div class="donut-sub">CO&#8322; savings</div>
          </div>
        </div>
        <div class="donut-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background:#e06b75"></div>
            <div>
              <div class="legend-item-label">Original</div>
              <div class="legend-item-name">${product}</div>
              <div class="legend-item-val" style="color:#e06b75">${sc.a1c4_orig.toFixed(2)} <span class="legend-unit">${matKey==='cr'?'kg CO&#8322; / CAS room':'kg CO&#8322;/m&#178;'}</span></div>
            </div>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background:#4ecca3"></div>
            <div>
              <div class="legend-item-label">Refurbished To</div>
              <div class="legend-item-name">${refName}</div>
              <div class="legend-item-val" style="color:#4ecca3">${sc.a1c4_ref.toFixed(2)} <span class="legend-unit">${matKey==='cr'?'kg CO&#8322; / CAS room':'kg CO&#8322;/m&#178;'}</span></div>
            </div>
          </div>

        </div>
      </div>`;
  } else {
    const isInc=eol==='Incineration';
    const hlColor=isInc?'rgba(247,160,74,0.25)':eol==='Recycling'?'rgba(200,184,74,0.2)':'rgba(139,148,158,0.2)';
    const hlBg=isInc?'rgba(247,160,74,0.05)':eol==='Recycling'?'rgba(200,184,74,0.04)':'rgba(139,148,158,0.04)';
    const hlIcon=isInc?'&#128293;':eol==='Recycling'?'&#9851;':'&#9888;';
    const hlTitle=isInc
      ?`<div class="ctx-title" style="color:#f7a04a">&#9889; Energy Recovery</div>`
      :eol==='Recycling'
      ?`<div class="ctx-title" style="color:#c8b84a">&#9851; Material Recycling</div>`
      :`<div class="ctx-title" style="color:#e06b75">&#9888; Landfilling</div>`;
    const hlText=isInc
      ?`<span class="ctx-product">${product}</span> is <span class="ctx-action" style="color:#f7a04a;font-weight:700">incinerated</span> at end of life.<br><span class="ctx-benefit" style="color:#f7c873">&#10003; Generates Electricity &amp; District heat</span>`
      :eol==='Recycling'
      ?(matKey==='cr'
        ?`<span class="ctx-product">${product}</span> CAS room is <span class="ctx-action" style="color:#c8b84a;font-weight:700">recycled</span>.<br><span class="ctx-benefit" style="color:#c8b84a">&#10003; Aluminium, steel, wood, glass &amp; stainless steel recovered and re-entered into production</span>`
        :`<span class="ctx-product">${product}</span> is <span class="ctx-action" style="color:#c8b84a;font-weight:700">recycled</span>.<br><span class="ctx-benefit" style="color:#c8b84a">&#10003; Raw gypsum recovered &amp; re-entered into production</span>`)
      :`<span class="ctx-product">${product}</span> is <span class="ctx-action" style="color:#e06b75;font-weight:700">sent to landfill</span>.<br><span class="ctx-warn">&#10007; No material or energy is recovered</span>`;
    a1c4Html=`
      <div class="a1c4-grid" style="grid-template-columns:1fr">
        <div class="a1c4-card original"><div class="card-tag">${matKey==='cr'?'Original CAS Room':'Original Boden'}</div><div class="product-name">${product}</div><div class="co2-value">${sc.a1c4_orig.toFixed(2)}</div><div class="co2-unit">kg CO&#8322; eq. ${matKey==='cr'?'/ CAS room':'/ m&#178;'}</div></div>
      </div>`;
    contextHtml=`
      <div class="loop-highlight" style="border-color:${hlColor};background:${hlBg};margin-bottom:0">
        <div class="loop-icon">${hlIcon}</div>
        <div class="loop-text">${hlTitle}<p class="ctx-body">${hlText}</p></div>
      </div>`;
  }

  const savingsHtml=matKey==='cs'?renderSavingsCS(sc):matKey==='cr'?renderSavingsCR(sc):renderSavingsWF(sc,product);
  return {a1c4Html,contextHtml,savingsHtml,sc,isReuse,reduction:isReuse?co2Reduction(sc.a1c4_orig,sc.a1c4_ref):0};
}

function render(matKey,product,eol){
  const stamp=_renderStamp;
  const {a1c4Html,contextHtml,savingsHtml}=buildSections(matKey,product,eol,stamp);
  const m2Html=matKey==='cr'?'':makeM2Input(matKey,product,eol);
  return `
    <div class="section-label anim anim-d1">A1 &#8211; C4 Carbon Footprint</div>
    ${a1c4Html}${contextHtml}
    <hr class="divider">
    <div class="section-label anim anim-d3">Savings Overview</div>
    ${savingsHtml}${m2Html}`;
}

// -- COMPARE — row-by-row banded layout ----------------------------------------
function renderCompare(matKey,product,eolA,eolB){
  const stampA=_renderStamp, stampB=_renderStamp+1;
  const sA=buildSections(matKey,product,eolA,stampA);
  const sB=buildSections(matKey,product,eolB,stampB);

  const eolColor=e=>EOL_INFO[e]?EOL_INFO[e].color:'var(--accent)';

  const header=(eol,color)=>`<div class="cmp-header" style="border-color:${color};color:${color}">${eol.toUpperCase()}</div>`;

  return `
    <!-- ROW: A1-C4 -->
    <div class="section-label anim anim-d1">A1 &#8211; C4 Carbon Footprint</div>
    <div class="cmp-row">
      <div class="cmp-cell">${header(eolA,eolColor(eolA))}${sA.a1c4Html}</div>
      <div class="cmp-divider"></div>
      <div class="cmp-cell">${header(eolB,eolColor(eolB))}${sB.a1c4Html}</div>
    </div>

    <!-- ROW: Context / Donut -->
    <div class="cmp-row cmp-row-context">
      <div class="cmp-cell">${sA.contextHtml}</div>
      <div class="cmp-divider"></div>
      <div class="cmp-cell">${sB.contextHtml}</div>
    </div>

    <hr class="divider">

    <!-- ROW: Savings -->
    <div class="section-label anim anim-d3">Savings Overview</div>
    <div class="cmp-row cmp-row-savings">
      <div class="cmp-cell">${sA.savingsHtml}</div>
      <div class="cmp-divider"></div>
      <div class="cmp-cell">${sB.savingsHtml}</div>
    </div>
    <hr class="divider">
    <!-- ROW: Separate Project Impact per scenario -->
    ${matKey!=='cr'?`<div class="section-label anim anim-d5">Project Impact</div>
    <div class="cmp-row">
      <div class="cmp-cell">${makeM2InputCompare(matKey,product,eolA,'a')}</div>
      <div class="cmp-divider"></div>
      <div class="cmp-cell">${makeM2InputCompare(matKey,product,eolB,'b')}</div>
    </div>`:''}`;
}

// -- SELECTION CHANGE ----------------------------------------------------------
function onSelectionChange(matKey){
  const m=MATERIALS[matKey];
  const product=document.getElementById(m.selProduct).value;
  const eol=document.getElementById(m.selEol).value;
  const results=document.getElementById(m.results);
  const noData=document.getElementById(m.noData);
  const inner=document.getElementById(m.inner);

  if(!product||!eol){results.classList.remove('visible');noData.style.display='block';showEolCard(matKey,null);return;}

  noData.style.display='none';_pieId=0;_renderStamp=Date.now();_pieRegistry=[];

  // Check if compare is active
  const eolB=_compareActive[matKey]?document.getElementById('sel-eol-'+matKey+'-b').value:'';
  if(_compareActive[matKey]&&eolB){
    inner.innerHTML=renderCompare(matKey,product,eol,eolB);
    animateAllPies();
    if(buildSections(matKey,product,eol,_renderStamp).isReuse)animateDonut(_renderStamp,co2Reduction(m.data[product].scenarios[eol].a1c4_orig,m.data[product].scenarios[eol].a1c4_ref));
    if(buildSections(matKey,product,eolB,_renderStamp+1).isReuse)animateDonut(_renderStamp+1,co2Reduction(m.data[product].scenarios[eolB].a1c4_orig,m.data[product].scenarios[eolB].a1c4_ref));
  } else {
    inner.innerHTML=render(matKey,product,eol);
    animateAllPies();
    if(eol==='Reuse'){
      const sc=m.data[product].scenarios[eol];
      animateDonut(_renderStamp,co2Reduction(sc.a1c4_orig,sc.a1c4_ref));
    }
  }

  results.classList.add('visible');
  showEolCard(matKey,eol);
  const cmpBtn=document.getElementById('compare-btn-'+matKey);
  if(cmpBtn)cmpBtn.style.display='block';
  showExportBar();
  if(_compareActive[matKey])populateCompareSelector(matKey);
}

// -- INLINE CSV DATA ---------------------------------------------------------

// INLINE CSV DATA
const INLINE_CSV = {
  cs: [
    ",Boden type normal,EOL,A1-C4(kg co2),Boden type refurbished to,A1-C4(kg co2),Energy savings,,Water Savings,Resource Savings,",
    "Calcium sulphate,,,,,,Electrcity,Thermal,Water Savings,alpha gypsum,beta gypsum",
    ",NORTEC,Reuse,14.6,LOOP,3.41,93%,100%,100%,95%,90%",
    ",NORTEC,Recycling,16.8,,4.1,0%,0%,0%,14%,56%",
    ",NORTEC,Landfilling,13.1,,3.36,0%,0%,0%,0%,0%",
    ",,,,,,,,,,",
    ",,,,,,,,,,",
    ",,,,,,,,,,",
    ",FLOOR and more,Reuse,16.7,ADDLIFE,3.41,90%,100%,100%,95%,85%",
    ",FLOOR and more,Recycling,18.73,,3.75,0%,0%,0%,14%,56%",
    ",FLOOR and more,Landfilling,17.23,,3.13,0%,0%,0%,0%,0%",
    ",,,,,,,,,,",
    ",,,,,,,,,,",

  ],
  wf: [
    ",Boden type normal,EOL,A1-C4(kg co2),Boden type refurbished to,A1-C4(kg co2),Energy savings,,resource savings ,,Energy recovery,",
    "Wooden floors,,,,,,Electrcity,Thermal,Tree Savings,Steel savings,Electrcity,Thermal",
    ",LIGNA,Reuse,5.14,RELIFE ,1.02,100%,0%,50%,0%,0%,0%",
    ",LIGNA,Incineration,5.49,,2.28,0%,0%,0%,0%,25%,35%",
    ",,,,,,,,,,,",
    ",,,,,,,,,,,",
    ",,,,,,,,,,,",
    ",LIGNA ST,Reuse,13.83,RELIFE ST,0.68,100%,0%,50%,99%,0%,0%",
    ",LIGNA ST,Incineration,17.4,,5.03,0%,0%,0%,0%,25%,35%"
  ],
  cr: [
    "CAS room Type,Scenario  ,A1-C4,Energy savings,Aluminium,Steel,Wood,Glass,Stainless Steel",
    "3400x4000,Recyling ,3729.17,0%,40%,50%,40%,50%,50%",
    "2400x2400,Recyling ,2197.29,0%,40%,50%,40%,50%,50%",
    "1200x2000,Recyling ,1457.87,0%,40%,50%,40%,50%,50%",
    "3400x4000,Reuse,3692.24,98%,99%,98%,99%,98%,99%",
    "2400x2400,Reuse,2175.57,98%,99%,98%,99%,98%,99%",
    "1200x2000,Reuse,1444.23,98%,99%,98%,99%,98%,99%",
  ]
};
// -- LOAD CSV ------------------------------------------------------------------
async function fetchCSV(paths){
  for(const path of paths){
    try{const res=await fetch(path);if(res.ok)return await res.text();}catch(_){}
  }
  return null; // return null instead of throwing — we'll use inline fallback
}

function loadCSV(matKey){
  const m=MATERIALS[matKey];
  const loadingEl=document.getElementById(m.loading);
  const errorEl=document.getElementById(m.error);
  const noDataEl=document.getElementById(m.noData);
  const csEl=m.comingSoon?document.getElementById(m.comingSoon):null;
  if(loadingEl)loadingEl.style.display='none';
  if(csEl)csEl.style.display='none';
  try{
    const text=INLINE_CSV[matKey];
    if(!text)throw new Error('No inline data for '+matKey);
    m.data=matKey==='cs'?parseCSV_cs(text):parseCSV_wf(text);
    if(Object.keys(m.data).length===0)throw new Error('No rows parsed.');
    populateSelectors(matKey);
    if(noDataEl)noDataEl.style.display='block';
    if(errorEl)errorEl.style.display='none';
  }catch(err){
    if(errorEl){
      errorEl.style.display='block';
      errorEl.innerHTML='<span class="big">&#9888;</span><strong>Error:</strong> '+err.message;
    }
    console.error('loadCSV failed:',err);
  }
}
window.addEventListener('DOMContentLoaded',()=>{loadCSV('cs');loadCSV('wf');loadCSV('cr');});

// ------------------------------------------------------------
// THEME
// ------------------------------------------------------------
function toggleTheme(){
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const next=isDark?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  document.getElementById('theme-icon').textContent=next==='dark'?'☀️':'🌙';
  try{localStorage.setItem('bo-theme',next);}catch(_){}
}
(function initTheme(){
  try{const s=localStorage.getItem('bo-theme');if(s){document.documentElement.setAttribute('data-theme',s);const i=document.getElementById('theme-icon');if(i)i.textContent=s==='dark'?'☀️':'&#x1F319;';}}catch(_){}
})();

// ------------------------------------------------------------
// LANGUAGE
// ------------------------------------------------------------
const I18N={
  en:{'eyebrow':'Lifecycle Data','mat-cs':'Calcium Sulphate Floors','mat-wf':'Wooden Floors','mat-cr':'CAS Room','label-product':'Boden Type','label-eol':'EOL Scenario','label-compare-eol':'Compare with EOL','sel-product-placeholder':'— Select product —','sel-eol-placeholder':'— Select EOL scenario —','sel-compare-placeholder':'— Select scenario to compare —','no-data':'Select a Boden type and EOL scenario to view the analysis.','loading-cs':'Loading calcium sulphate data…','coming-soon':'Wooden Floors data coming soon.','btn-compare':'⇄ Compare Scenarios','btn-export':'Export PDF'},
  de:{'eyebrow':'Lebenszyklus-Daten','mat-cs':'Calciumsulfatböden','mat-wf':'Holzböden','mat-cr':'CAS Raum','label-product':'Bodentyp','label-eol':'EOL-Szenario','label-compare-eol':'Vergleich mit EOL','sel-product-placeholder':'— Produkt wählen —','sel-eol-placeholder':'— EOL-Szenario wählen —','sel-compare-placeholder':'— Vergleichsszenario wählen —','no-data':'Wählen Sie Bodentyp und EOL-Szenario.','loading-cs':'Daten werden geladen…','coming-soon':'Holzboden-Daten demnächst verfügbar.','btn-compare':'⇄ Szenarien vergleichen','btn-export':'PDF exportieren'},
};
let _lang='en';
function setLang(lang){
  _lang=lang;
  document.getElementById('btn-en').classList.toggle('active',lang==='en');
  document.getElementById('btn-de').classList.toggle('active',lang==='de');
  document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(I18N[lang][k])el.textContent=I18N[lang][k];});
  ['cs','wf','cr'].forEach(mk=>{const m=MATERIALS[mk];const p=document.getElementById(m.selProduct).value,e=document.getElementById(m.selEol).value;if(p&&e)onSelectionChange(mk);});
  try{localStorage.setItem('bo-lang',lang);}catch(_){}
}
(function initLang(){try{const s=localStorage.getItem('bo-lang');if(s&&I18N[s]){_lang=s;setLang(s);}}catch(_){}})();

// ------------------------------------------------------------
// COMPARE
// ------------------------------------------------------------
const _compareActive={cs:false,wf:false,cr:false};

function toggleCompare(matKey){
  const btn=document.getElementById('compare-btn-'+matKey);
  const panel=document.getElementById('compare-panel-'+matKey);
  const isActive=_compareActive[matKey];
  _compareActive[matKey]=!isActive;
  btn.classList.toggle('active',!isActive);
  if(isActive){
    panel.style.display='none';
    // re-render as single view
    const m=MATERIALS[matKey];
    const product=document.getElementById(m.selProduct).value,eol=document.getElementById(m.selEol).value;
    if(product&&eol)onSelectionChange(matKey);
  } else {
    panel.style.display='block';
    populateCompareSelector(matKey);
  }
}

function populateCompareSelector(matKey){
  const m=MATERIALS[matKey];
  const product=document.getElementById(m.selProduct).value;
  const currentEol=document.getElementById(m.selEol).value;
  const sel=document.getElementById('sel-eol-'+matKey+'-b');
  sel.innerHTML=`<option value="">— Select scenario to compare —</option>`;
  if(!product)return;
  const eols=Object.keys(m.data[product].scenarios);
  ['Reuse','Recycling','Incineration','Landfilling'].forEach(e=>{
    if(eols.includes(e)&&e!==currentEol){const o=document.createElement('option');o.value=e;o.textContent=e;sel.appendChild(o);}
  });
}

function onCompareChange(matKey){
  const m=MATERIALS[matKey];
  const product=document.getElementById(m.selProduct).value;
  const eolB=document.getElementById('sel-eol-'+matKey+'-b').value;
  if(!product||!eolB)return;
  // Trigger full re-render with compare
  onSelectionChange(matKey);
}

// ------------------------------------------------------------
// EXPORT PDF — clean structured report, no screenshot
// ------------------------------------------------------------
function showExportBar(){
  const btn=document.getElementById('export-btn-header');
  if(btn)btn.style.display='flex';
}

async function exportPDF(){
  const btn=document.getElementById('export-btn-header');
  if(!btn)return;
  const orig=btn.innerHTML;
  btn.innerHTML='<span>&#8987;</span><span>Generating...</span>';
  btn.style.opacity='0.7'; btn.style.pointerEvents='none';

  // Temporarily hide the export button itself so it doesn't appear in screenshot
  btn.style.visibility='hidden';

  try{
    // Load html2canvas dynamically if not already loaded
    if(!window.html2canvas){
      await new Promise((resolve,reject)=>{
        const sc=document.createElement('script');
        sc.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        sc.onload=resolve; sc.onerror=reject;
        document.head.appendChild(sc);
      });
    }

    const {jsPDF}=window.jspdf;

    // Capture the full container
    const container=document.querySelector('.container');
    const canvas=await html2canvas(container,{
      scale:2,
      useCORS:true,
      allowTaint:true,
      backgroundColor: document.documentElement.getAttribute('data-theme')==='light'?'#f8fafc':'#0d1117',
      logging:false,
      windowWidth: container.scrollWidth,
      height: container.scrollHeight,
      scrollY: 0
    });

    const imgData=canvas.toDataURL('image/png');
    const imgW=canvas.width;
    const imgH=canvas.height;

    // A4 dimensions in mm
    const pdfW=210;
    const pdfH=Math.round((imgH/imgW)*pdfW);

    // If content is taller than one A4 page, split across pages
    const pageHeightPx=Math.round((297/pdfW)*imgW); // pixels per A4 page
    const totalPages=Math.ceil(imgH/pageHeightPx);

    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});

    for(let page=0;page<totalPages;page++){
      if(page>0)pdf.addPage();
      const srcY=page*pageHeightPx;
      const srcH=Math.min(pageHeightPx, imgH-srcY);
      const sliceH=Math.round((srcH/imgW)*pdfW);

      // Create a slice canvas for this page
      const slice=document.createElement('canvas');
      slice.width=imgW; slice.height=srcH;
      const ctx=slice.getContext('2d');
      ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);
      const sliceData=slice.toDataURL('image/png');
      pdf.addImage(sliceData,'PNG',0,0,pdfW,sliceH);
    }

    const activeMatKey=document.getElementById('btn-cs').classList.contains('active')?'cs':'wf';
    const m=MATERIALS[activeMatKey];
    const product=document.getElementById(m.selProduct).value||'export';
    const eolA=document.getElementById(m.selEol).value||'';
    const eolB=_compareActive[activeMatKey]?document.getElementById('sel-eol-'+activeMatKey+'-b').value:'';
    const filename='Boden_Optimizer_'+product.replace(/\s+/g,'_')+'_'+eolA+(eolB?'_vs_'+eolB:'')+'.pdf';

    pdf.save(filename);

  }catch(err){
    console.error('PDF failed:',err);
    alert('Export failed: '+err.message);
  }finally{
    btn.innerHTML=orig;
    btn.style.opacity='';
    btn.style.pointerEvents='';
    btn.style.visibility='';
  }
}

function loadCSV(matKey){
  const m=MATERIALS[matKey];
  const loadingEl=document.getElementById(m.loading);
  const errorEl=document.getElementById(m.error);
  const noDataEl=document.getElementById(m.noData);
  if(loadingEl)loadingEl.style.display='none';
  try{
    const raw=INLINE_CSV[matKey];
    if(!raw)throw new Error('No data for '+matKey);
    const text=Array.isArray(raw)?raw.join('\n'):raw;
    m.data=matKey==='cs'?parseCSV_cs(text):matKey==='cr'?parseCSV_cr(text):parseCSV_wf(text);
    if(Object.keys(m.data).length===0)throw new Error('No rows parsed for '+matKey);
    populateSelectors(matKey);
    if(noDataEl)noDataEl.style.display='block';
    if(errorEl)errorEl.style.display='none';
  }catch(err){
    if(errorEl){errorEl.style.display='block';errorEl.innerHTML='<b>Error:</b> '+err.message;}
    console.error('loadCSV',matKey,err);
  }
}

