// Keyboard input with DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate).

class InputHandler {
  constructor(game) {
    this.game = game;
    this.keys = {};
    // DAS/ARR state for left/right
    this.das = {
      dir: null,     // 'left' | 'right' | null
      timer: null,   // DAS timer
      arrTimer: null,// ARR timer
      dasStart: 0,
    };
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  bind() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  unbind() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._clearDas();
  }

  _onKeyDown(e) {
    if (this.keys[e.code]) return; // prevent repeat for non-DAS keys
    this.keys[e.code] = true;

    // Initialize audio on first interaction
    audio.init();

    const state = this.game.state;

    // Menu / Game Over: Enter or Space to start
    if (state === 'MENU' || state === 'GAME_OVER') {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.game.start();
      }
      return;
    }

    // Pause
    if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      this.game.togglePause();
      return;
    }

    // Restart from game over
    if (e.code === 'KeyR' && state === 'GAME_OVER') {
      e.preventDefault();
      this.game.start();
      return;
    }

    // Mute
    if (e.code === 'KeyM') {
      e.preventDefault();
      const muted = audio.toggleMute();
      this.game.showMuteIndicator(muted);
      return;
    }

    if (state !== 'PLAYING') return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        this.game.moveLeft();
        this._startDas('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.game.moveRight();
        this._startDas('right');
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.game.softDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        e.preventDefault();
        this.game.rotateCW();
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        e.preventDefault();
        this.game.rotateCCW();
        break;
      case 'Space':
        e.preventDefault();
        this.game.hardDrop();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyC':
        e.preventDefault();
        this.game.hold();
        break;
    }
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;

    if (e.code === 'ArrowLeft' && this.das.dir === 'left') {
      this._clearDas();
    }
    if (e.code === 'ArrowRight' && this.das.dir === 'right') {
      this._clearDas();
    }

    // If the opposite direction key is pressed while DAS is active for current, switch immediately
    if (e.code === 'ArrowLeft' && this.das.dir === 'right') {
      this._clearDas();
      this.game.moveLeft();
      this._startDas('left');
    }
    if (e.code === 'ArrowRight' && this.das.dir === 'left') {
      this._clearDas();
      this.game.moveRight();
      this._startDas('right');
    }
  }

  _startDas(dir) {
    this._clearDas();
    this.das.dir = dir;
    this.das.dasStart = performance.now();

    this.das.timer = setTimeout(() => {
      this.das.arrTimer = setInterval(() => {
        if (this.das.dir === 'left') this.game.moveLeft();
        else if (this.das.dir === 'right') this.game.moveRight();
      }, ARR_DELAY);
    }, DAS_DELAY);
  }

  _clearDas() {
    if (this.das.timer) clearTimeout(this.das.timer);
    if (this.das.arrTimer) clearInterval(this.das.arrTimer);
    this.das.timer = null;
    this.das.arrTimer = null;
    this.das.dir = null;
  }
}
