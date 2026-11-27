// shots.js — deterministic screenshot scenes (?shot=start|play|end|escaped&seed=N).
// Simulates a fixed number of 1/60s steps, renders once, then stops.
// Same seed + same shot => same frame, every run.
'use strict';
(function () {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;
  const g = window.TurkeyGame;
  const DT = 1 / 60;

  function step(n) { for (let i = 0; i < n; i++) g.frame(DT); }
  function finish() {
    g.render();
    window.__shotReady = true;
    window.__gameState = { state: g.state, score: g.score, meters: Math.floor(g.meters), lives: g.lives };
  }

  if (shot === 'start') {
    // Title screen with the turkey standing in the farm at dusk.
    step(30);
    finish();
  } else if (shot === 'play') {
    // Busy action scene: turkey mid-jump over a glowing oven, a falling
    // knife in the air, corn arc ahead, farmer close behind, HUD complete.
    g.start();
    step(60); // ~1s of running so the world has spawned
    // Script the set-piece deterministically (overrides whatever spawned).
    const W = g.world, G = CONFIG.GROUND_Y;
    W.obstacles = [
      { kind: 'oven', x: 245, y: G - 92, w: 96, h: 92, phase: 0.7, hit: false },
      { kind: 'fallknife', x: 700, y: 240, w: 40, h: 120, vy: 260, state: 'fall', phase: 1.1, hit: false },
      { kind: 'fence', x: 940, y: G - 64, w: 84, h: 64, phase: 0.2, hit: false },
      { kind: 'wood', x: 1120, y: G - 58, w: 110, h: 58, phase: 0.4, hit: false },
    ];
    W.pickups = [
      { kind: 'corn', x: 560, y: G - 150, taken: false, phase: 0 },
      { kind: 'corn', x: 612, y: G - 185, taken: false, phase: 0.5 },
      { kind: 'corn', x: 664, y: G - 150, taken: false, phase: 1 },
      { kind: 'drum', x: 830, y: G - 170, taken: false, phase: 0 },
      { kind: 'corn', x: 1020, y: G - 52, taken: false, phase: 0.3 },
    ];
    // Turkey mid-jump right above the oven, farmer close behind.
    g.player.y = G - 130; g.player.vy = -220; g.player.onGround = false;
    g.farmerGap = 55;
    g.meters = 342; g.score = 342 * 10 + 3 * 100;
    g.corn = 3;
    // Silence the distance spawner so no cluster pile-up appears at the edge.
    W.nextSpawnM = 360; W.nextCornM = 360; W.nextDrumM = 500;
    step(6); // settle one jump arc beat so dust/leaves exist
    // Re-assert the jump pose after the settle steps (physics moved it).
    g.player.y = G - 128; g.player.vy = -200; g.player.onGround = false;
    g.farmerGap = 55;
    finish();
  } else if (shot === 'end') {
    // Caught screen: farmer right on top of the turkey, 1 life left story.
    g.start();
    step(45);
    g.lives = 0; g.meters = 487; g.score = 487 * 10 + 5 * 100; g.corn = 5;
    g.farmerGap = 0;
    g.world.nextSpawnM = 9999; g.world.nextCornM = 9999; g.world.nextDrumM = 9999;
    g.endCaught();
    step(10);
    finish();
  } else if (shot === 'escaped') {
    // Escaped screen: safe barn behind, big score.
    g.start();
    step(45);
    g.meters = 1000; g.score = 1000 * 10 + 12 * 100 + 2 * 500 + CONFIG.ESCAPE_BONUS;
    g.corn = 12; g.drums = 2; g.lives = 2;
    g.world.nextSpawnM = 9999; g.world.nextCornM = 9999; g.world.nextDrumM = 9999;
    g.endEscaped();
    step(10);
    finish();
  }
})();
