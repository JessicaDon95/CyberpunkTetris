// Game loop controller: state machine, timing, piece lifecycle.

class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.board = new Board();
    this.scoring = new Scoring();
    this.randomizer = new SevenBagRandomizer();
    this.state = 'MENU'; // MENU | PLAYING | PAUSED | GAME_OVER

    this.piece = null;
    this.holdPiece = null;
    this.canHold = true;

    this.gravityTimer = 0;
    this.lockTimer = null;
    this.lockResets = 0;
    this.lastTime = 0;

    this.nextPieces = [];
    for (let i = 0; i < 3; i++) {
      this.nextPieces.push(this.randomizer.next());
    }

    this.input = new InputHandler(this);
  }

  start() {
    this.board.clear();
    this.scoring.reset();
    this.randomizer = new SevenBagRandomizer();
    this.piece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.gravityTimer = 0;
    this.lockTimer = null;
    this.lockResets = 0;
    this.nextPieces = [];
    for (let i = 0; i < 3; i++) {
      this.nextPieces.push(this.randomizer.next());
    }

    this.state = 'PLAYING';
    this.renderer.hideOverlay();
    this.renderer.showMuteIndicator(false);
    this.lastTime = performance.now();
    this.spawnPiece();
  }

  spawnPiece() {
    const type = this.nextPieces.shift();
    this.nextPieces.push(this.randomizer.next());
    this.piece = new Piece(type);
    this.canHold = true;
    this.lockResets = 0;
    this.lockTimer = null;

    if (this.board.isGameOver(this.piece)) {
      this._gameOver();
    }
  }

  _loop(timestamp) {
    if (this.state === 'PLAYING') {
      const delta = timestamp - this.lastTime;
      this.lastTime = timestamp;

      // Gravity
      this.gravityTimer += delta;
      const interval = this.scoring.getGravityInterval();
      if (this.gravityTimer >= interval) {
        this.gravityTimer -= interval;
        this._gravityTick();
      }

      // Lock delay countdown
      if (this.lockTimer !== null) {
        this.lockTimer -= delta;
        if (this.lockTimer <= 0) {
          this._lockPiece();
        }
      }
    } else {
      this.lastTime = timestamp;
    }

    // Always render
    const ghostY = this._getGhostY();
    this.renderer.render(this.board, this.piece, ghostY, this.scoring, this.holdPiece, this.nextPieces.slice(0, 2));

    requestAnimationFrame((t) => this._loop(t));
  }

  startRenderLoop() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _gravityTick() {
    if (!this.piece) return;
    const shape = this.piece.getShape();

    if (!this.board.collides(this.piece.type, shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      // Still falling — clear lock timer
      this.lockTimer = null;
    } else {
      // Blocked — start lock delay if not already running
      if (this.lockTimer === null && this.lockResets < LOCK_RESETS) {
        this.lockTimer = LOCK_DELAY;
      }
    }
  }

  _getGhostY() {
    if (!this.piece) return null;
    const shape = this.piece.getShape();
    let ghostY = this.piece.y;
    while (!this.board.collides(this.piece.type, shape, this.piece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  _lockPiece() {
    if (!this.piece) return;
    this.board.lockPiece(this.piece);
    audio.play('lock');

    const fullLines = this.board.getFullLines();
    if (fullLines.length > 0) {
      this.renderer.triggerClearFlash(fullLines);
      if (fullLines.length === 4) {
        audio.play('tetris');
        this.renderer.triggerShake();
      } else {
        audio.play('lineClear');
      }
      const cleared = fullLines.length;
      setTimeout(() => {
        this.board.clearLines(fullLines);
        this.scoring.awardLines(cleared);
      }, 150);
    }

    this.spawnPiece();
  }

  _gameOver() {
    this.state = 'GAME_OVER';
    audio.play('gameOver');
    this.renderer.showOverlay('GAME OVER', `SCORE: ${this.scoring.score.toLocaleString()}  PRESS ENTER`);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.renderer.showOverlay('PAUSED', 'PRESS P TO RESUME');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      this.renderer.hideOverlay();
    }
  }

  // ─── Player actions ────────────────────────────────────────────

  moveLeft() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    const shape = this.piece.getShape();
    if (!this.board.collides(this.piece.type, shape, this.piece.x - 1, this.piece.y)) {
      this.piece.x--;
      audio.play('move');
      this._resetLockDelay();
    }
  }

  moveRight() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    const shape = this.piece.getShape();
    if (!this.board.collides(this.piece.type, shape, this.piece.x + 1, this.piece.y)) {
      this.piece.x++;
      audio.play('move');
      this._resetLockDelay();
    }
  }

  softDrop() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    const shape = this.piece.getShape();
    if (!this.board.collides(this.piece.type, shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      this.gravityTimer = 0;
      this.scoring.awardDrop(SOFT_DROP_PTS);
      audio.play('softDrop');
      this._resetLockDelay();
    }
  }

  hardDrop() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    const shape = this.piece.getShape();
    let dropDist = 0;
    while (!this.board.collides(this.piece.type, shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      dropDist++;
    }
    this.scoring.awardDrop(dropDist * HARD_DROP_PTS);
    audio.play('hardDrop');
    this.lockTimer = null;
    this._lockPiece();
  }

  rotateCW() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    if (this.piece.type === 'O') return;
    const fromRot = this.piece.rotation;
    const toRot = (fromRot + 1) % 4;
    const kick = tryWallKicks(this.board, this.piece, fromRot, toRot);
    if (kick) {
      this.piece.rotation = toRot;
      this.piece.x += kick.dx;
      this.piece.y += kick.dy;
      audio.play('rotate');
      this._resetLockDelay();
    }
  }

  rotateCCW() {
    if (this.state !== 'PLAYING' || !this.piece) return;
    if (this.piece.type === 'O') return;
    const fromRot = this.piece.rotation;
    const toRot = (fromRot + 3) % 4; // -1 mod 4
    const kick = tryWallKicks(this.board, this.piece, fromRot, toRot);
    if (kick) {
      this.piece.rotation = toRot;
      this.piece.x += kick.dx;
      this.piece.y += kick.dy;
      audio.play('rotate');
      this._resetLockDelay();
    }
  }

  hold() {
    if (this.state !== 'PLAYING' || !this.piece || !this.canHold) return;
    const currentType = this.piece.type;
    if (this.holdPiece) {
      const swapType = this.holdPiece.type;
      this.holdPiece = new Piece(currentType);
      this.piece = new Piece(swapType);
    } else {
      this.holdPiece = new Piece(currentType);
      this.spawnPiece();
    }
    this.canHold = false;
    this.lockTimer = null;
    audio.play('rotate');
  }

  _resetLockDelay() {
    if (this.lockTimer !== null && this.lockResets < LOCK_RESETS) {
      this.lockTimer = LOCK_DELAY;
      this.lockResets++;
    }
  }

  showMuteIndicator(muted) {
    this.renderer.showMuteIndicator(muted);
  }
}
