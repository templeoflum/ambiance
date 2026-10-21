// main/store.cjs
// Load / save per-device state (position, size, channel, volume, muted, powered)
// File: ~/work/ambiance/config/radio.json
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'config');

const DEFAULTS = {
  position: { x: null, y: null },   // null = let Electron center it
  size:     { width: 520, height: 400 },
  channel:  'izah',
  volume:   0.65,
  muted:    false,
  powered:  false,
};

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function load(device = 'radio') {
  ensureDir();
  const file = path.join(CONFIG_DIR, `${device}.json`);
  let state = { ...DEFAULTS };
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
    state = { ...DEFAULTS, ...raw };
    // Merge nested objects shallowly to avoid clobbering missing keys
    if (raw.position) state.position = { ...DEFAULTS.position, ...raw.position };
    if (raw.size)     state.size     = { ...DEFAULTS.size, ...raw.size };
  } catch {
    // First run or corrupt file: use defaults, then persist
    save(device, state);
  }
  return state;
}

function save(device, state) {
  ensureDir();
  const file = path.join(CONFIG_DIR, `${device}.json`);
  // Strip null position so Electron re-centres on a fresh run
  const clean = { ...state, position: { x: state.position?.x ?? null, y: state.position?.y ?? null } };
  fs.writeFileSync(file + '.tmp', JSON.stringify(clean, null, 2));
  fs.renameSync(file + '.tmp', file);
}

module.exports = { load, save, DEFAULTS };
