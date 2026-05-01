// ─── Board dimensions ────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const HIDDEN_ROWS = 2; // rows above the visible board for spawning
const CELL_SIZE = 30;
const CANVAS_WIDTH = COLS * CELL_SIZE;  // 300
const CANVAS_HEIGHT = ROWS * CELL_SIZE; // 600

// ─── Neon color palette (one per tetromino) ──────────────────────
const COLORS = {
  I: '#00FFFF',
  O: '#FFFF00',
  T: '#BF00FF',
  S: '#00FF00',
  Z: '#FF0000',
  J: '#4444FF',
  L: '#FF8C00',
};

const COLOR_ARRAY = [null, COLORS.I, COLORS.O, COLORS.T, COLORS.S, COLORS.Z, COLORS.J, COLORS.L];
const PIECE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// ─── UI colors ───────────────────────────────────────────────────
const UI = {
  bgDark: '#0a0a12',
  bgPanel: '#0d0d1a',
  gridLine: 'rgba(0, 255, 255, 0.06)',
  neonCyan: '#00FFFF',
  textPrimary: '#e0e0ff',
  textDim: '#6a6a8a',
  ghostAlpha: 0.25,
  clearFlash: 'rgba(255, 255, 255, 0.9)',
};

// ─── Tetromino base shapes (unrotated) ───────────────────────────
// Each shape is stored as a 2D matrix of 0/1 values.
const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// ─── SRS Wall Kick Data ──────────────────────────────────────────
// Each entry is [dx, dy] test offsets. Tests are tried in order.
const WALL_KICKS_JLSTZ = {
  '0,1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1,0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1,2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2,1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2,3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3,2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3,0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0,3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
};

const WALL_KICKS_I = {
  '0,1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1,0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1,2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2,1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2,3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3,2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3,0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0,3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};

function getWallKicks(type, fromRot, toRot) {
  const key = `${fromRot},${toRot}`;
  if (type === 'I') return WALL_KICKS_I[key] || [[0,0]];
  if (type === 'O') return [[0,0]];
  return WALL_KICKS_JLSTZ[key] || [[0,0]];
}

// ─── Scoring ─────────────────────────────────────────────────────
const LINE_SCORES = [0, 100, 300, 500, 800];
const SOFT_DROP_PTS = 1;
const HARD_DROP_PTS = 2;
const LINES_PER_LEVEL = 10;

// ─── Timing ──────────────────────────────────────────────────────
const BASE_GRAVITY = 1000; // ms at level 1
const GRAVITY_FACTOR = 0.85;
const MIN_GRAVITY = 50;
const LOCK_DELAY = 500; // ms before piece locks after landing
const LOCK_RESETS = 15; // max lock delay resets per piece

// ─── Input ───────────────────────────────────────────────────────
const DAS_DELAY = 170; // ms before auto-repeat starts
const ARR_DELAY = 30;  // ms between auto-repeat ticks

function getGravityInterval(level) {
  return Math.max(MIN_GRAVITY, BASE_GRAVITY * Math.pow(GRAVITY_FACTOR, level - 1));
}
