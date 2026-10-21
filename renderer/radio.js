// renderer/radio.js — ambient radio control logic
// Runs in Electron renderer with nodeIntegration:true, webSecurity:false
// Reads channels + config via fs (local), routes app control via ipcRenderer.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { ipcRenderer } = require('electron');

// ─── Load config + channels ────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, '..', 'config', 'radio.json');
const DEFAULTS = {
  position: { x: null, y: null },
  size: { width: 520, height: 400 },
  channel: 'izah',
  volume: 0.65,
  muted: false,
  powered: false,
};

function loadState() {
  let s = { ...DEFAULTS };
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    s = { ...DEFAULTS, ...raw };
    if (raw.position) s.position = { ...DEFAULTS.position, ...raw.position };
    if (raw.size)     s.size     = { ...DEFAULTS.size, ...raw.size };
   } catch { /* first run */ }
  return s;
}

function saveState() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE + '.tmp', JSON.stringify(state, null, 2));
    fs.renameSync(CONFIG_FILE + '.tmp', CONFIG_FILE);
   } catch (e) { console.warn('save failed', e); }
}

const state = loadState();
const channels = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'channels', 'radio.json'), 'utf-8')
);

// ─── DOM refs ──────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const display   = $('display');
const onairDot  = $('onair-dot');
const onairLabel= $('onair-label');
const stationName = $('station-name');
const stationSub  = $('station-sub');
const freqEl      = $('freq');
const timerEl     = $('timer');
const eq          = document.querySelector('.eq');
const powerBtn    = $('btn-power');
const powerLabel  = $('power-label');
const volFill     = $('vol-fill');
const volKnob     = $('vol-knob');
const volDial     = $('vol-dial');
const volTrackEl  = volDial.querySelector('.vol-track');
const muteBtn     = $('btn-mute');
const muteLabel   = $('mute-label');
const channelNum  = $('channel-num');
const quitBtn     = $('btn-quit');
const audio       = $('audio');

let curChannel = Math.max(0, channels.findIndex(c => c.id === state.channel));

// ─── Render helpers ────────────────────────────────────────────────────
function renderFreq() {
  const ch = channels[curChannel] || {};
  freqEl.textContent = (ch.freq || '00.0') + ' FM';
  channelNum.textContent = `CH ${curChannel + 1}`;
}

function renderStation() {
  const ch = channels[curChannel] || { name: '—', sub: '' };
  stationName.textContent = ch.name || '—';
  stationSub.textContent  = ch.sub || '';
}

function setVolume(v) {
  v = Math.max(0, Math.min(1, v));
  state.volume = v;
  audio.volume = v;
  volFill.style.width = `${v * 100}%`;
  volKnob.style.left  = `${Math.min(100, v * 100)}%`;
  volDial.setAttribute('aria-valuenow', String(Math.round(v * 100)));
}

function renderMute() {
  muteBtn.classList.toggle('on', state.muted);
  muteLabel.textContent = state.muted ? 'MUTED' : '—';
  audio.muted = state.muted;
}

function renderPower() {
  const on = state.powered;
  powerBtn.classList.toggle('on', on);
  powerLabel.textContent = on ? 'ON' : 'OFF';
  onairDot.classList.toggle('on', on && !state.muted);
  onairLabel.textContent = on ? (state.muted ? 'MUTED' : 'ON AIR') : 'OFF';
  display.classList.toggle('off', !on);
  document.body.classList.toggle('off', !on);
  updateEq();
}

function updateEq() {
  eq.classList.toggle('active', state.powered && !audio.paused && !state.muted);
}

function renderTimer() {
  if (!state.powered || audio.paused) { timerEl.textContent = '0:00'; return; }
  const s = Math.floor(audio.currentTime);
  const m = Math.floor(s / 60);
  timerEl.textContent = `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// ─── Tune ──────────────────────────────────────────────────────────────
function playLocal(ch) {
  if (!ch || ch.kind !== 'local-audio') return;
  try {
    const url = pathToFileURL(ch.path.replace(/^file:\/\//, '')).href;
    // ch.path is a posix path already
    audio.src = pathToFileURL(ch.path).href;
  } catch (e) { console.warn('load audio failed', e); }
}

function tuneTo(index) {
  if (index < 0) index = channels.length - 1;
  if (index >= channels.length) index = 0;
  curChannel = index;
  const ch = channels[curChannel];
  state.channel = ch.id;
  renderStation();
  renderFreq();
  audio.pause();
  audio.src = pathToFileURL(ch.path).href;
  audio.currentTime = 0;
  if (state.powered && !state.muted) audio.play().catch(() => {});
  saveState();
}

// ─── Power / mute ──────────────────────────────────────────────────────
function powerOn() {
  if (state.powered) return;
  state.powered = true;
  renderPower();
  const ch = channels[curChannel];
  if (ch && ch.kind === 'local-audio') audio.src = pathToFileURL(ch.path).href;
  audio.currentTime = 0;
  audio.play().catch(e => console.log('play() rejected (autoplay ok after gesture):', e.name));
  saveState();
}

function powerOff() {
  state.powered = false;
  audio.pause();
  renderPower();
  saveState();
}

function togglePower() { state.powered ? powerOff() : powerOn(); }
function toggleMute()  { state.muted = !state.muted; renderMute(); saveState(); }
function nextChannel() { tuneTo(curChannel + 1); }
function prevChannel() { tuneTo(curChannel - 1); }
function quit()        { ipcRenderer.send('app:quit'); }

// ─── Wire controls ─────────────────────────────────────────────────────
display.addEventListener('click', () => {
  if (!state.powered || state.muted) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
});

powerBtn.addEventListener('click', togglePower);
powerBtn.addEventListener('keydown', e => { if (e.key === 'Enter') togglePower(); });
$('btn-next').addEventListener('click', nextChannel);
$('btn-prev').addEventListener('click', prevChannel);
muteBtn.addEventListener('click', toggleMute);
muteBtn.addEventListener('keydown', e => { if (e.key === 'Enter') toggleMute(); });
quitBtn.addEventListener('click', quit);

// ─── Volume drag ───────────────────────────────────────────────────────
let volDragging = false;
function positionVolFromEvent(e) {
  const clientX = (e.touches && e.touches[0] && e.touches[0].clientX)
    || e.clientX
    || 0;
  const rect = volTrackEl.getBoundingClientRect();
  const v = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  setVolume(v);
}
volDial.addEventListener('mousedown', e => { volDragging = true; volDial.classList.add('dragging'); positionVolFromEvent(e); e.preventDefault(); });
document.addEventListener('mousemove', e => { if (volDragging) positionVolFromEvent(e); });
document.addEventListener('mouseup',   () => { if (volDragging) { volDragging = false; volDial.classList.remove('dragging'); saveState(); } });
volDial.addEventListener('touchstart', e => { volDragging = true; volDial.classList.add('dragging'); positionVolFromEvent(e); }, { passive: true });
volDial.addEventListener('touchmove',  positionVolFromEvent, { passive: true });
volDial.addEventListener('touchend',   () => { if (volDragging) { volDragging = false; volDial.classList.remove('dragging'); saveState(); } });

// ─── Audio events ──────────────────────────────────────────────────────
audio.addEventListener('timeupdate', renderTimer);
audio.addEventListener('play',  updateEq);
audio.addEventListener('pause', () => { if (!state.powered) updateEq(); else setTimeout(updateEq, 50); });
audio.addEventListener('ended', () => { /* stop at end for now */ });

// ─── Global hotkeys ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'q') quit();
  else if (k === ' ' || k === 'enter') { togglePower(); e.preventDefault(); }
  else if (k === 'm') toggleMute();
  else if (k === 'arrowright' || k === ']') nextChannel();
  else if (k === 'arrowleft'  || k === '[') prevChannel();
});

// ─── Init ──────────────────────────────────────────────────────────────
(function init() {
  renderStation();
  renderFreq();
  setVolume(state.volume);
  renderMute();
  renderPower();
  // If it was left powered on, come back to life after a short delay
  if (state.powered) setTimeout(powerOn, 400);
  // Log a heartbeat so we can confirm the renderer booted
  console.log('[radio] booted, channel:', channels[curChannel] ? channels[curChannel].name : 'none',
              'powered:', state.powered);
})();

// Forward close-save to main on window close (best effort)
window.addEventListener('beforeunload', saveState);
