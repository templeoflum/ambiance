/* ═══════════════════════════════════════════════════════════════════════════
   AMB · 02 — tactility engine (core.js)
   Makes the surface feel physical.
     · knob()        — grab-to-turn with inertia + detents + a synthesized click
     · button()      — a key that depresses, springs back, clicks
     · vu(meterEl)   — a VU needle with mass; breathes with an oscillator
     · lod()         — level-of-detail controller (rest / engage / inspect)
   Everything is self-contained, no deps, runs straight in a browser tab.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
const AMB = window.AMB = {};

/* ─── gentle audio engine: real clicks/soft touches, not UI noise ─────── */
let ctx = null;
function audio(){
   if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
   return ctx;
}
function click(opts={}){
  const c = audio(); if(!c) return;
   // resume on first gesture
   if(c.state === 'suspended') c.resume();
   const now = c.currentTime;
   const o = c.createOscillator(), g = c.createGain();
   o.connect(g).connect(c.destination);
   o.type = 'square';
   o.frequency.setValueAtTime(opts.hz || 1400, now);
   o.frequency.exponentialRampToValueAtTime((opts.hz||1400)*.4, now + .02);
   g.gain.setValueAtTime(opts.vol || .05, now);
   g.gain.exponentialRampToValueAtTime(.0001, now + (opts.len||.035));
   o.start(now); o.stop(now + .05);
}

/* ─── KNOB: grab and turn, with momentum + detents + click ──────────────── */
function knob(el, opts={}){
  const min=opts.min??0, max=opts.max??1, detents=opts.detents??null,
        step=opts.detents!=null?1/opts.detents: (max-min)/360,
        cb=opts.onchange||function(){};
  let value = opts.value ?? .65;
  let angle = -135 + value*(270);       // 270° travel, ±135°
  let dragging=false, last=null, velocity=0, lastT=0, momentum=0, raf=null;
  const idx = el.querySelector('.idx');

  function apply(){
    if(idx) idx.style.transform = `rotate(${angle}deg)`;
    const out = el.querySelector('.val');
    if(out) out.textContent = opts.format ? opts.format(value) : Math.round(value*100);
    cb(value, angle);
    el.setAttribute('aria-valuenow', Math.round(value*100));
  }
  function snap(){
    const near = Math.round(value/step)*step;
    if(Math.abs(near - value) < step*0.30){
      value = Math.max(min,Math.min(max,near));
      angle = -135 + value*270;
      el.classList.remove('detent-flash'); void el.offsetWidth; el.classList.add('detent-flash');
      click({hz:1600,vol:.04,len:.03});
      apply();
     }
  }
  function tick(v){ value=Math.max(min,Math.min(max,v)); angle=-135+value*270; }

  el.addEventListener('pointerdown',e=>{
    dragging=true; last=e; lastT=performance.now(); velocity=0;
    el.setPointerCapture(e.pointerId); el.classList.add('grab','press');
    cancelAnimationFrame(raf);
    click({hz:1100,vol:.05,len:.04});
  });
  el.addEventListener('pointermove',e=>{
    if(!dragging) return;
     // turn by horizontal OR angular drag
    const dy = e.clientY - last.clientY;
    const dx = e.clientX - last.clientX;
    const d = -(dy + dx*0.35);
    tick(value + (d/220));
    const now=performance.now();
    if(now-lastT>0){ velocity = d/(now-lastT); lastT=now; }
    last=e; apply();
  });
  el.addEventListener('pointerup',e=>{
    if(!dragging) return;
    dragging=false; el.classList.remove('grab','press');
    el.setPointerCapture?.(e.pointerId);
    // inertia + detent snapping
    momentum = velocity*1.4;
    const loop = ()=>{
      if(dragging){ momentum=0; return; }
      tick(value + momentum/10);
      momentum *= .9;
      apply();
      apply();
     if(Math.abs(momentum) > 0.0008){ raf = requestAnimationFrame(loop); }
      else { snap(); apply(); }
    };
    raf = requestAnimationFrame(loop);
  });
  // keyboard
  el.setAttribute('role','slider'); el.setAttribute('tabindex',0);
  el.addEventListener('keydown',e=>{
     const s = step<0.05?step: (max-min)/20;
    if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ value=Math.max(min,value-s); apply(); click({vol:.03}); }
    else if(e.key==='ArrowRight'||e.key==='ArrowUp'){ value=Math.min(max,value+s); apply(); click({vol:.03}); }
    else return;
    e.preventDefault(); e.stopPropagation();
  });
  apply();
  return {
    get value(){ return value; },
    set value(v){ tick(v); apply(); },
    turnTo(v){ tick(Math.max(min,Math.min(max,v))); apply(); },
    refresh(){ apply(); }
  };
}

/* ─── BUTTON: presses in, springs out, clicks ──────────────────────────── */
function button(el, opts={}){
  const cb=opts.onclick||function(){};
  el.classList.add('button');
  el.addEventListener('click',()=>{ cb(el); click({hz:900,vol:.05,len:.04}); });
  el.addEventListener('pointerdown',()=>{ el.classList.add('down'); click({hz:600,vol:.04,len:.03}); });
  window.addEventListener('pointerup',()=>{ setTimeout(()=>el.classList.remove('down'),60); });
  return { toggleState(on){ el.classList.toggle('on', !!on); } };
}

/* ─── VU METER: needle with mass, breathes ─────────────────────────────── */
function vu(meterEl, opts={}){
  const needle=meterEl.querySelector('.needle'),
        shadow=meterEl.querySelector('.needle-shadow'),
        scale=meterEl.querySelector('.scale'),
        valEl=opts.valueEl;
  let level=0, target=0, phase=Math.random()*10, lastT=0;
  function set(t){ target=t; if(needle) meterEl.style.setProperty('--glow', `rgba(255,180,90,${.2+t*.6})`); }
  function loop(t){
    const dt=Math.min(.05,(t-lastT)/1000||0); lastT=t;
    phase += dt*2;
     // needle chases target, with a little overshoot mass
    level += (target - level) * Math.min(1, dt*(opts.smooth||8));
    target += Math.sin(phase)*(opts.jitter||0.12)*target;
    const deg = -82 + level*150;
    if(needle) needle.style.transform = `rotate(${deg}deg)`;
    if(shadow) shadow.style.transform = `rotate(${deg*1.15}deg)`;
     if(valEl) valEl.textContent = Math.round(level*100);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
   return { set, get value(){return level;} };
}

/* ─── LOD controller: rest → engage → inspect, blooms detail ────────────── */
function lod(host, opts={}){
  const defaultLevel=opts.default??0, setter=opts.apply||function(){};
   let level=defaultLevel;
  host.dataset.lod = level;
  function set(L){
   Math.max(0,Math.min(2,L));
    level=Math.max(0,Math.min(2,L));
    host.dataset.lod = level;
    if(opts.track) opts.track(level);
     if(opts.bar){
       const bar=opts.bar.querySelector('.fill');
       if(bar) bar.style.width = [34,62,100][level] + '%';
     }
    if(opts.log) opts.log('LOD '+level);
  }
   // engage on hover / focus, settle back after a beat
  let settle=null;
  host.addEventListener('pointerenter',()=>{ clearTimeout(settle); set(2); });
  host.addEventListener('pointerleave',()=>{ clearTimeout(settle); settle=setTimeout(()=>set(opts.rest||0), opts.restDelay??900); });
  host.addEventListener('focusin',()=>{ clearTimeout(settle); set(2); });
  // explicit buttons
  function makeBtn(label, L){
     const b=document.createElement('button'); b.textContent=label; b.dataset.lod=L;
     b.addEventListener('click',()=>{ clearTimeout(settle); set(L); click({vol:.035}); });
     return b;
  }
  set(level);
  return { set, get level(){return level;}, makeBtn, current(){return level;} };
}

// expose
window.AMB = { knob, button, vu, lod, audio };
})();
