// Tetromino definitions, 7-bag randomizer, rotation, and SRS wall kicks.

class Piece {
  constructor(type) {
    this.type = type;
    this.rotation = 0;
    // Spawn position: centered horizontally, top of visible board
    this.x = Math.floor((COLS - SHAPES[type][0].length) / 2);
    this.y = 0;
  }

  // Return the rotated shape matrix for this piece.
  getShape() {
    let shape = SHAPES[this.type];
    for (let r = 0; r < this.rotation % 4; r++) {
      shape = rotateMatrix(shape);
    }
    return shape;
  }

  // Return the color for this piece.
  getColor() {
    return COLORS[this.type];
  }
}

// Rotate a matrix 90 degrees clockwise.
function rotateMatrix(matrix) {
  const n = matrix.length;
  const result = [];
  for (let i = 0; i < n; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      result[i][j] = matrix[n - 1 - j][i];
    }
  }
  return result;
}

// 7-bag randomizer: shuffle the 7 piece types, draw one at a time,
// refill when empty. Guarantees each piece appears once per bag.
class SevenBagRandomizer {
  constructor() {
    this.bag = [];
  }

  refill() {
    const types = PIECE_KEYS.slice();
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.bag = types;
  }

  next() {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop();
  }

  // Peek at the next piece without consuming it.
  peek() {
    if (this.bag.length === 0) this.refill();
    return this.bag[this.bag.length - 1];
  }

  // Peek ahead n pieces.
  peekAhead(n) {
    const results = [];
    const saved = this.bag.slice();
    for (let i = 0; i < n; i++) {
      results.push(this.next());
    }
    this.bag = saved;
    return results;
  }
}

// Apply SRS wall kicks for a rotation. Returns the {dx, dy} that succeeded,
// or null if no kick position is valid.
function tryWallKicks(board, piece, fromRot, toRot) {
  const kicks = getWallKicks(piece.type, fromRot, toRot);
  for (const [dx, dy] of kicks) {
    const testX = piece.x + dx;
    const testY = piece.y - dy; // SRS dy is inverted (positive = up)
    if (!board.collides(piece.type, getShapeAtRotation(piece.type, toRot), testX, testY)) {
      return { dx, dy: -dy };
    }
  }
  return null;
}

// Get a shape matrix at a specific rotation without mutating the piece.
function getShapeAtRotation(type, rotation) {
  let shape = SHAPES[type];
  for (let r = 0; r < rotation % 4; r++) {
    shape = rotateMatrix(shape);
  }
  return shape;
}
