// perfil.js — Sistema de cuentas personales · Felipe Vergel Arte en Vidrio
(function(){
'use strict';
const SK='fv_perfil', SH='fv_historial_pedidos';
const get=()=>{try{return JSON.parse(localStorage.getItem(SK)||'null')}catch(e){return null}};
const set=d=>{try{localStorage.setItem(SK,JSON.stringify(d))}catch(e){}};
const getHist=()=>{try{return JSON.parse(localStorage.getItem(SH)||'[]')}catch(e){return[]}};
const fmt=n=>n!=null?new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n):'—';
const fmtD=s=>{try{return new Date(s).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})}catch(e){return s||''}};
function ini(n,e){if(n){const p=n.trim().split(/\s+/);return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():p[0].slice(0,2).toUpperCase()}return(e||'?')[0].toUpperCase()}
function aBg(e){let h=0;for(let i=0;i<(e||'').length;i++)h=(h<<5)-h+e.charCodeAt(i)|0;return['#8A391B','#572932','#7a4b32','#5a4a4a','#855b4a'][Math.abs(h)%5]}

// ── CSS ──────────────────────────────────────────────────────
function injectCSS(){
  if(document.getElementById('fvPerfilCSS'))return;
  const s=document.createElement('style');
  s.id='fvPerfilCSS';
  s.textContent=`
#fvPerfilPanel{position:fixed;inset:0;z-index:400;pointer-events:none}
#fvPerfilPanel.open{pointer-events:auto}
#fvPOverlay{position:absolute;inset:0;background:rgba(26,35,34,.52);opacity:0;transition:opacity .3s;cursor:pointer}
#fvPerfilPanel.open #fvPOverlay{opacity:1}
#fvPDrawer{position:absolute;top:0;right:0;bottom:0;width:min(390px,100%);background:var(--crema,#FAF4ED);display:flex;flex-direction:column;transform:translateX(110%);transition:transform .38s cubic-bezier(.4,0,.2,1);box-shadow:-20px 0 60px -16px rgba(26,35,34,.22);z-index:1}
#fvPerfilPanel.open #fvPDrawer{transform:translateX(0)}
#fvPHead{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 18px;border-bottom:1px solid var(--linea,#E8DDD0);flex-shrink:0}
#fvPHead span{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--verde,#C04C36);font-family:'Jost',sans-serif}
#fvPClose{width:36px;height:36px;border-radius:50%;background:none;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--tinta-soft,#6B5F5A);transition:background .2s;padding:0;flex-shrink:0}
#fvPClose:hover{background:var(--crema-2,#F5E8D8)}
#fvPClose svg{width:18px;height:18px}
#fvPBody{flex:1;overflow-y:auto;padding-bottom:28px;-webkit-overflow-scrolling:touch}
#fvPBody::-webkit-scrollbar{width:5px}
#fvPBody::-webkit-scrollbar-thumb{background:var(--linea,#E8DDD0);border-radius:6px}
.fvp-user{display:flex;gap:16px;padding:24px 24px 22px;border-bottom:1px solid var(--linea,#E8DDD0);align-items:center}
.fvp-ava{position:relative;flex-shrink:0}
.fvp-ava img,.fvp-ava-i{width:72px;height:72px;border-radius:50%;border:3px solid var(--crema-rosa,#F3CFB3);object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;font-family:'Jost',sans-serif;color:#fff}
.fvp-gbadge{position:absolute;bottom:-3px;right:-3px;width:22px;height:22px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 6px rgba(0,0,0,.15);border:1.5px solid #eee}
.fvp-info{flex:1;min-width:0}
.fvp-name{font-size:15px;font-weight:700;color:var(--verde-dark,#572932);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Jost',sans-serif}
.fvp-email{font-size:12px;color:var(--tinta-soft,#6B5F5A);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:200}
.fvp-since{font-size:11px;color:var(--cobre,#C66E4E);margin-top:6px;font-family:'Cormorant Garamond',serif;font-style:italic}
.fvp-badge{display:inline-flex;align-items:center;gap:5px;margin-top:7px;padding:3px 10px;border-radius:2px;background:rgba(192,76,54,.1);border:1px solid rgba(192,76,54,.2);font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--verde,#C04C36);font-family:'Jost',sans-serif}
.fvp-sec{padding:20px 24px;border-bottom:1px solid var(--linea,#E8DDD0)}
.fvp-sec-t{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tinta-soft,#6B5F5A);font-weight:400;margin-bottom:14px;font-family:'Jost',sans-serif}
.fvp-code-row{display:flex;align-items:center;gap:10px}
.fvp-code{flex:1;padding:12px 16px;border:2px dashed var(--crema-rosa,#F3CFB3);border-radius:12px;font-family:'Jost',sans-serif;font-weight:800;font-size:16px;letter-spacing:.12em;color:var(--verde-dark,#572932);background:rgba(243,207,179,.14);text-align:center}
.fvp-copy{width:40px;height:40px;border-radius:50%;background:var(--verde,#C04C36);color:#fff;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;flex-shrink:0;transition:all .2s;padding:0}
.fvp-copy:hover{background:var(--verde-dark,#572932);transform:scale(1.06)}
.fvp-copy svg{width:15px;height:15px;pointer-events:none}
.fvp-code-note{font-size:11px;color:var(--tinta-soft,#6B5F5A);margin:8px 0 0;font-weight:200;font-family:'Jost',sans-serif}
.fvp-empty{font-size:13px;color:var(--tinta-soft,#6B5F5A);font-weight:200;line-height:1.65}
.fvp-order{padding:12px 0;border-bottom:1px solid var(--linea,#E8DDD0)}
.fvp-order:last-child{border-bottom:none}
.fvp-order-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px}
.fvp-oref{font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--verde,#C04C36);font-family:'Jost',sans-serif}
.fvp-ostate{font-size:9px;padding:3px 9px;border-radius:2px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
.fvp-s-ap{background:rgba(34,197,94,.12);color:#15803d}
.fvp-s-wa{background:rgba(37,211,102,.12);color:#166534}
.fvp-s-pe{background:rgba(245,158,11,.12);color:#92400e}
.fvp-odate{font-size:11px;color:var(--tinta-soft,#6B5F5A);font-weight:200;margin-bottom:4px}
.fvp-oitems{font-size:12px;color:var(--tinta,#3F4443);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fvp-ototal{font-size:13px;font-weight:700;color:var(--verde-dark,#572932);margin-top:5px}
.fvp-logout-sec{padding:20px 24px 28px}
.fvp-logout{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px 20px;border-radius:2px;border:1.5px solid var(--linea,#E8DDD0);color:var(--tinta-soft,#6B5F5A);font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:400;cursor:pointer;transition:all .2s;background:transparent;font-family:'Jost',sans-serif}
.fvp-logout:hover{border-color:var(--verde,#C04C36);color:var(--verde,#C04C36);background:rgba(192,76,54,.04)}
.fvp-logout svg{width:15px;height:15px}
.fvp-nologin{text-align:center;padding:48px 24px 36px}
.fvp-nl-icon{width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,var(--crema-2,#F5E8D8),var(--crema-rosa,#F3CFB3));display:flex;align-items:center;justify-content:center;margin:0 auto 22px;color:var(--cobre,#C66E4E)}
.fvp-nl-icon svg{width:38px;height:38px}
.fvp-nologin h4{font-family:'Cormorant Garamond',serif;font-weight:400;font-style:italic;font-size:22px;margin:0 0 12px;color:var(--verde-dark,#572932)}
.fvp-nologin p{font-size:13px;color:var(--tinta-soft,#6B5F5A);line-height:1.65;margin:0 0 22px;font-weight:200}
.fvp-nl-cta{display:inline-block;padding:13px 30px;border-radius:2px;background:var(--verde,#C04C36);color:#fff;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;text-decoration:none;transition:all .2s;font-family:'Jost',sans-serif;border:none;cursor:pointer}
.fvp-nl-cta:hover{background:var(--verde-dark,#572932)}
.fvp-nl-note{font-size:11px;color:var(--tinta-soft,#6B5F5A);margin-top:18px;font-weight:200}
/* Nav button — todas las páginas */
#navProfile{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1.5px solid var(--linea,#E8DDD0);background:var(--crema,#FAF4ED);cursor:pointer;transition:all .25s;padding:0;flex-shrink:0;color:var(--tinta-soft,#6B5F5A)}
#navProfile:hover{border-color:var(--cobre,#C66E4E);background:var(--crema-2,#F5E8D8)}
/* index.html: hero transparente */
.nav:not(.scrolled) #navProfile{border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.1);color:rgba(255,255,255,.9)}
.nav:not(.scrolled) #navProfile:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.55)}
  `;
  document.head.appendChild(s);
}

// ── Panel HTML ───────────────────────────────────────────────
function injectPanel(){
  if(document.getElementById('fvPerfilPanel'))return;
  const d=document.createElement('div');
  d.id='fvPerfilPanel';
  d.innerHTML=
    `<div id="fvPOverlay"></div>`+
    `<div id="fvPDrawer">`+
      `<div id="fvPHead"><span>Mi Perfil</span><button id="fvPClose" aria-label="Cerrar perfil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`+
      `<div id="fvPBody"></div>`+
    `</div>`;
  document.body.appendChild(d);
  document.getElementById('fvPOverlay').addEventListener('click',close);
  document.getElementById('fvPClose').addEventListener('click',close);
}

// ── Open / Close ─────────────────────────────────────────────
function open(){
  const p=document.getElementById('fvPerfilPanel');
  if(!p)return;
  p.classList.add('open');
  document.body.style.overflow='hidden';
  const perfil=get();
  document.getElementById('fvPBody').innerHTML=perfil?buildIn(perfil):buildOut();
  if(perfil)wireIn();else wireOut();
}
function close(){
  const p=document.getElementById('fvPerfilPanel');
  if(!p)return;
  p.classList.remove('open');
  document.body.style.overflow='';
}

// ── Build HTML: logged in ────────────────────────────────────
function buildIn(p){
  const in2=ini(p.nombre,p.email), bg=aBg(p.email);
  const ava=p.avatar
    ?`<img src="${p.avatar}" alt="${p.nombre||''}">`
    :`<div class="fvp-ava-i" style="background:${bg}">${in2}</div>`;
  const gb=p.metodoLogin==='google'
    ?`<span class="fvp-gbadge"><svg width="13" height="13" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 8 3l5.7-5.7C33.6 5.7 29 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15 18.9 12 24 12c3 0 5.8 1.1 8 3l5.7-5.7C33.6 5.7 29 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 13-5l-6-5c-2 1.4-4.4 2-7 2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.1 5C42.1 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg></span>`
    :'';
  const hist=getHist().slice().reverse().slice(0,5);
  const estados={'APROBADO':'fvp-s-ap','APPROVED':'fvp-s-ap','WHATSAPP':'fvp-s-wa','PENDIENTE':'fvp-s-pe','PENDING':'fvp-s-pe'};
  const ordersHTML=hist.length===0
    ?`<p class="fvp-empty">Aún no tienes pedidos. <a href="index.html#catalogo" style="color:var(--cobre-dark,#8A391B);text-decoration:underline">Explorar piezas</a></p>`
    :hist.map(o=>`<div class="fvp-order"><div class="fvp-order-top"><span class="fvp-oref">${o.ref}</span><span class="fvp-ostate ${estados[o.estado]||'fvp-s-pe'}">${o.estado}</span></div><div class="fvp-odate">${fmtD(o.fecha)}</div><div class="fvp-oitems">${(o.items||[]).map(i=>`${i.qty}× ${i.name}`).join(', ')}</div><div class="fvp-ototal">${fmt(o.total)}</div></div>`).join('');
  return `
  <div class="fvp-user">
    <div class="fvp-ava">${ava}${gb}</div>
    <div class="fvp-info">
      <div class="fvp-name">${p.nombre||'Coleccionista'}</div>
      <div class="fvp-email">${p.email}</div>
      <div class="fvp-since">Miembro desde ${fmtD(p.fechaRegistro)}</div>
      <div class="fvp-badge">✦ Círculo Felipe Vergel</div>
    </div>
  </div>
  <div class="fvp-sec">
    <div class="fvp-sec-t">Código de descuento</div>
    <div class="fvp-code-row">
      <div class="fvp-code" id="fvPCode">${p.codigoDescuento||'—'}</div>
      <button class="fvp-copy" id="fvPCopy" title="Copiar código"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
    </div>
    <p class="fvp-code-note">15% OFF en tu primera compra · solo válido una vez</p>
  </div>
  <div class="fvp-sec">
    <div class="fvp-sec-t">Mis pedidos</div>
    ${ordersHTML}
  </div>
  <div class="fvp-logout-sec">
    <button class="fvp-logout" id="fvPLogout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Cerrar sesión</button>
  </div>`;
}

// ── Build HTML: not logged in ────────────────────────────────
function buildOut(){
  const isIndex=!!document.getElementById('clubOverlay');
  return `
  <div class="fvp-nologin">
    <div class="fvp-nl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
    <h4>Únete al Círculo</h4>
    <p>Regístrate para obtener un <strong>15% de descuento</strong> en tu primera pieza, acceso anticipado a nuevas colecciones y seguimiento de tus pedidos.</p>
    ${isIndex
      ?`<button class="fvp-nl-cta" id="fvPOpenClub">Quiero mi descuento</button>`
      :`<a href="index.html" class="fvp-nl-cta">Ir al inicio</a>`
    }
    <p class="fvp-nl-note">¿Ya eres miembro? Tu código llegó a tu correo al registrarte.</p>
  </div>`;
}

// ── Wire events (logged in) ──────────────────────────────────
function wireIn(){
  const cb=document.getElementById('fvPCopy');
  if(cb) cb.addEventListener('click',function(){
    const code=document.getElementById('fvPCode').textContent;
    if(!code||code==='—')return;
    if(navigator.clipboard){
      navigator.clipboard.writeText(code).then(()=>{
        cb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(()=>{cb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'},2200);
      }).catch(()=>{});
    }else{
      // Fallback para móvil sin navigator.clipboard
      const ta=document.createElement('textarea');ta.value=code;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);
    }
  });
  const lb=document.getElementById('fvPLogout');
  if(lb) lb.addEventListener('click',()=>{
    if(confirm('¿Cerrar sesión? Tu historial de pedidos se conservará en este dispositivo.')){
      try{localStorage.removeItem(SK)}catch(e){}
      close();
      renderBtn(null);
    }
  });
}
// ── Wire events (not logged in) ──────────────────────────────
function wireOut(){
  const oc=document.getElementById('fvPOpenClub');
  if(oc) oc.addEventListener('click',()=>{
    close();
    const co=document.getElementById('clubOverlay');
    if(co){try{sessionStorage.removeItem('fv_club_seen')}catch(e){}; setTimeout(()=>co.classList.add('show'),250);}
  });
}

// ── Nav button ───────────────────────────────────────────────
function renderBtn(perfil){
  const btn=document.getElementById('navProfile');
  if(!btn)return;
  if(perfil){
    const bg=aBg(perfil.email), in2=ini(perfil.nombre,perfil.email);
    btn.innerHTML=perfil.avatar
      ?`<img src="${perfil.avatar}" alt="${perfil.nombre||''}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;display:block;border:2px solid var(--crema-rosa,#F3CFB3)">`
      :`<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;font-size:11px;font-weight:800;font-family:'Jost',sans-serif">${in2}</span>`;
    btn.title=perfil.nombre||perfil.email;
    btn.setAttribute('aria-label','Mi perfil — '+(perfil.nombre||perfil.email));
  }else{
    btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    btn.title='Únete al Círculo';
    btn.setAttribute('aria-label','Únete al Círculo de coleccionistas');
  }
}

// ── Init ─────────────────────────────────────────────────────
function init(){
  injectCSS();
  injectPanel();
  renderBtn(get());
  const btn=document.getElementById('navProfile');
  if(btn) btn.addEventListener('click',()=>{
    const p=get();
    if(p){open();return;}
    const co=document.getElementById('clubOverlay');
    if(co){try{sessionStorage.removeItem('fv_club_seen')}catch(e){}; co.classList.add('show');}
    else open();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}

// ── Public API ───────────────────────────────────────────────
window.FVPerfil={
  save(data){
    const ex=get();
    const m=Object.assign({},ex||{},data);
    if(!m.fechaRegistro)m.fechaRegistro=new Date().toISOString();
    if(m.email)m.email=m.email.toLowerCase().trim();
    if(m.email&&!m.codigoDescuento){
      try{const c=localStorage.getItem('fv_club_codigo_'+m.email);if(c)m.codigoDescuento=c;}catch(e){}
    }
    set(m);renderBtn(m);
  },
  get,
  addOrder(order){
    try{const h=getHist();h.push(order);localStorage.setItem(SH,JSON.stringify(h.slice(-20)));}catch(e){}
  },
  open,close
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
