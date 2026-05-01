// Canvas-based rendering: board, pieces, ghost, UI panels, animations.

class Renderer {
  constructor(canvas, holdCanvas, nextCanvas1, nextCanvas2) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.holdCanvas = holdCanvas;
    this.holdCtx = holdCanvas.getContext('2d');
    this.nextCanvas1 = nextCanvas1;
    this.nextCtx1 = nextCanvas1.getContext('2d');
    this.nextCanvas2 = nextCanvas2;
    this.nextCtx2 = nextCanvas2.getContext('2d');

    // High-DPI scaling for main canvas
    this._setupHiDPI(canvas, COLS, ROWS);
    this._setupHiDPI(holdCanvas, 4, 4);
    this._setupHiDPI(nextCanvas1, 4, 4);
    this._setupHiDPI(nextCanvas2, 4, 4);

    this.clearFlashTimer = 0;
    this.clearFlashRows = [];
    this.shakeTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
  }

  _setupHiDPI(canvas, cols, rows) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = cols * CELL_SIZE;
    const cssHeight = rows * CELL_SIZE;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
  }

  // Main render entry point
  render(board, piece, ghostY, scoring, holdPiece, nextPieces) {
    const ctx = this.ctx;

    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= 16;
      this.shakeOffset.x = (Math.random() - 0.5) * 6;
      this.shakeOffset.y = (Math.random() - 0.5) * 6;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    ctx.save();
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    // Clear
    ctx.fillStyle = UI.bgDark;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    this._drawGrid(ctx);

    // Locked pieces (only visible rows)
    this._drawBoard(ctx, board);

    // Clear flash animation
    if (this.clearFlashTimer > 0) {
      this.clearFlashTimer -= 16;
      this._drawClearFlash(ctx);
    }

    // Ghost piece
    if (ghostY !== null && piece) {
      this._drawPiece(ctx, piece.type, piece.getShape(), piece.x, ghostY, true);
    }

    // Active piece
    if (piece) {
      this._drawPiece(ctx, piece.type, piece.getShape(), piece.x, piece.y, false);
    }

    ctx.restore();

    // Side panels
    this._drawHold(holdPiece);
    this._drawNext(nextPieces);

    // UI text
    this._updateUI(scoring);
  }

  _drawGrid(ctx) {
    ctx.strokeStyle = UI.gridLine;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }
  }

  _drawBoard(ctx, board) {
    for (let row = HIDDEN_ROWS; row < ROWS + HIDDEN_ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = board.grid[row][col];
        if (cell === 0) continue;
        const screenY = (row - HIDDEN_ROWS) * CELL_SIZE;
        this._drawCell(ctx, col * CELL_SIZE, screenY, COLOR_ARRAY[cell], false);
      }
    }
  }

  _drawPiece(ctx, type, shape, x, y, isGhost) {
    const color = COLORS[type];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (!shape[row][col]) continue;
        const screenY = (y + row - HIDDEN_ROWS) * CELL_SIZE;
        if (screenY < -CELL_SIZE || screenY >= CANVAS_HEIGHT) continue;
        this._drawCell(ctx, (x + col) * CELL_SIZE, screenY, color, isGhost);
      }
    }
  }

  _drawCell(ctx, px, py, color, isGhost) {
    const pad = 1;

    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = UI.ghostAlpha;
      ctx.strokeRect(px + pad, py + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2);
      ctx.globalAlpha = 1;
      return;
    }

    // Main fill
    ctx.fillStyle = color;
    ctx.fillRect(px + pad, py + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2);

    // Top-left highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px + pad, py + pad, CELL_SIZE - pad * 2, 2);
    ctx.fillRect(px + pad, py + pad, 2, CELL_SIZE - pad * 2);

    // Bottom-right shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + pad, py + CELL_SIZE - pad - 2, CELL_SIZE - pad * 2, 2);
    ctx.fillRect(px + CELL_SIZE - pad - 2, py + pad, 2, CELL_SIZE - pad * 2);

    // Inner glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    ctx.shadowBlur = 0;
  }

  _drawClearFlash(ctx) {
    ctx.fillStyle = UI.clearFlash;
    for (const row of this.clearFlashRows) {
      const screenY = (row - HIDDEN_ROWS) * CELL_SIZE;
      ctx.fillRect(0, screenY, CANVAS_WIDTH, CELL_SIZE);
    }
  }

  _drawHold(piece) {
    const ctx = this.holdCtx;
    const w = this.holdCanvas.width / (window.devicePixelRatio || 1);
    const h = this.holdCanvas.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = UI.bgPanel;
    ctx.fillRect(0, 0, w, h);
    if (piece) {
      this._drawPieceMini(ctx, piece.type, piece.getShape(), w, h);
    }
  }

  _drawNext(pieces) {
    // Next piece 1
    let ctx = this.nextCtx1;
    let w = this.nextCanvas1.width / (window.devicePixelRatio || 1);
    let h = this.nextCanvas1.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = UI.bgPanel;
    ctx.fillRect(0, 0, w, h);
    if (pieces[0]) {
      const shape = SHAPES[pieces[0]];
      this._drawPieceMini(ctx, pieces[0], shape, w, h);
    }

    // Next piece 2
    ctx = this.nextCtx2;
    w = this.nextCanvas2.width / (window.devicePixelRatio || 1);
    h = this.nextCanvas2.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = UI.bgPanel;
    ctx.fillRect(0, 0, w, h);
    if (pieces[1]) {
      const shape = SHAPES[pieces[1]];
      this._drawPieceMini(ctx, pieces[1], shape, w, h);
    }
  }

  _drawPieceMini(ctx, type, shape, w, h) {
    const miniCell = 18;
    const sw = shape[0].length * miniCell;
    const sh = shape.length * miniCell;
    const ox = (w - sw) / 2;
    const oy = (h - sh) / 2;
    const color = COLORS[type];

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (!shape[row][col]) continue;
        const px = ox + col * miniCell;
        const py = oy + row * miniCell;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, miniCell - 2, miniCell - 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(px + 1, py + 1, miniCell - 2, 2);
        ctx.fillRect(px + 1, py + 1, 2, miniCell - 2);
      }
    }
  }

  _updateUI(scoring) {
    document.getElementById('score').textContent = scoring.score.toLocaleString();
    document.getElementById('level').textContent = scoring.level;
    document.getElementById('lines').textContent = scoring.lines;
  }

  // Trigger a flash on specific rows for line clear animation
  triggerClearFlash(rows) {
    this.clearFlashRows = rows;
    this.clearFlashTimer = 150;
  }

  // Trigger screen shake (for tetris)
  triggerShake() {
    this.shakeTimer = 200;
  }

  showOverlay(title, message) {
    const overlay = document.getElementById('overlay');
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-message').textContent = message;
    overlay.classList.remove('hidden');
  }

  hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
  }

  showMuteIndicator(muted) {
    const indicator = document.getElementById('mute-indicator');
    indicator.textContent = muted ? 'MUTED' : '';
    indicator.style.display = muted ? 'block' : 'none';
  }
}
