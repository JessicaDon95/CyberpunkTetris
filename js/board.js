// Board/grid: 10 columns x (20 visible + 2 hidden) rows.
// Value 0 = empty, 1-7 = piece type index (matching COLOR_ARRAY).

class Board {
  constructor() {
    this.clear();
  }

  clear() {
    this.grid = Array.from({ length: ROWS + HIDDEN_ROWS }, () => Array(COLS).fill(0));
  }

  // Check if a piece at the given position collides with walls or locked blocks.
  collides(type, shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (!shape[row][col]) continue;
        const bx = x + col;
        const by = y + row;
        if (bx < 0 || bx >= COLS || by >= ROWS + HIDDEN_ROWS) return true;
        if (by >= 0 && this.grid[by][bx] !== 0) return true;
      }
    }
    return false;
  }

  // Lock a piece into the grid. Returns the board rows that were filled (for scoring).
  lockPiece(piece) {
    const shape = piece.getShape();
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (!shape[row][col]) continue;
        const bx = piece.x + col;
        const by = piece.y + row;
        if (by >= 0 && by < ROWS + HIDDEN_ROWS) {
          this.grid[by][bx] = PIECE_KEYS.indexOf(piece.type) + 1;
        }
      }
    }
  }

  // Check for completed lines, return their row indices.
  getFullLines() {
    const full = [];
    for (let row = 0; row < ROWS + HIDDEN_ROWS; row++) {
      if (this.grid[row].every(cell => cell !== 0)) {
        full.push(row);
      }
    }
    return full;
  }

  // Remove the given rows and shift everything down.
  clearLines(rows) {
    const sorted = rows.slice().sort((a, b) => b - a);
    for (const row of sorted) {
      this.grid.splice(row, 1);
      this.grid.unshift(Array(COLS).fill(0));
    }
  }

  // Check if the spawn position collides with existing blocks (game over condition).
  isGameOver(piece) {
    const shape = piece.getShape();
    return this.collides(piece.type, shape, piece.x, piece.y);
  }
}
