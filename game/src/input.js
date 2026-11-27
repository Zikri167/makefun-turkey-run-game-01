// Input: keyboard + mouse + touch. Exposes a small event queue the game drains.
'use strict';
const Input = {
  jumpQueued: false,
  duckHeld: false,
  anyKey: false,
  clicks: [],   // {x,y} in canvas coords
  init(canvas, onFirstInteract) {
    let interacted = false;
    const first = () => { if (!interacted) { interacted = true; if (onFirstInteract) onFirstInteract(); } };
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      first();
      Input.anyKey = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { Input.jumpQueued = true; e.preventDefault(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { Input.duckHeld = true; e.preventDefault(); }
      if (e.code === 'KeyP') window.TurkeyGame && window.TurkeyGame.togglePause();
      if (e.code === 'KeyR') window.TurkeyGame && window.TurkeyGame.restart();
      if (e.code === 'Enter') { Input.jumpQueued = true; }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') Input.duckHeld = false;
    });
    const toCanvas = (ev) => {
      const r = canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left) * (canvas.width / r.width), y: (ev.clientY - r.top) * (canvas.height / r.height) };
    };
    canvas.addEventListener('pointerdown', (ev) => {
      first();
      const p = toCanvas(ev);
      Input.clicks.push(p);
      // Tap on the lower half of the screen also jumps (mobile play).
      // Buttons live above y=420, so a tap on START/RESTART never jumps.
      if (window.TurkeyGame && window.TurkeyGame.state === 'play' && p.y > 560) Input.jumpQueued = true;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },
};
