// Entry point: bootstrap the game and wire everything together.

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const holdCanvas = document.getElementById('hold-canvas');
  const nextCanvas1 = document.getElementById('next-canvas-1');
  const nextCanvas2 = document.getElementById('next-canvas-2');

  const renderer = new Renderer(canvas, holdCanvas, nextCanvas1, nextCanvas2);
  const game = new Game(renderer);

  // Show menu
  renderer.showOverlay('RUSSIANSQUARE', 'PRESS ENTER TO START');

  // Bind input
  game.input.bind();

  // Start the single render loop
  game.startRenderLoop();

  // Pause on window blur
  window.addEventListener('blur', () => {
    if (game.state === 'PLAYING') {
      game.togglePause();
    }
  });

  // Resume audio on first user gesture
  document.addEventListener('keydown', () => audio.resume(), { once: true });

  // Expose for debugging
  window.game = game;
});
