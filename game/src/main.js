// Main: game loop, state machine, physics, collisions, scoring, lives.
'use strict';

const TurkeyGame = {
  canvas: null, ctx: null,
  state: 'title', // title | play | paused | caught | escaped
  seed: 1,
  time: 0,
  meters: 0, score: 0, lives: CONFIG.LIVES,
  speed: CONFIG.BASE_SPEED,
  farmerGap: CONFIG.FARMER_GAP_START,
  corn: 0, drums: 0,
  player: null,
  world: null,
  scrollPx: 0,
  invuln: 0,
  pausedFrom: null,
  shotMode: false,

  init(canvas, seed) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.seed = seed >>> 0;
    this.reset();
    Input.init(canvas, () => { AudioSys.init(); AudioSys.resume(); });
    return this;
  },

  reset() {
    this.state = 'title';
    this.time = 0; this.meters = 0; this.score = 0; this.lives = CONFIG.LIVES;
    this.speed = CONFIG.BASE_SPEED;
    this.farmerGap = CONFIG.FARMER_GAP_START;
    this.corn = 0; this.drums = 0;
    this.invuln = 0; this.scrollPx = 0;
    this.world = createWorld(this.seed);
    this.player = { x: CONFIG.PLAYER_X, y: CONFIG.GROUND_Y, vy: 0, onGround: true, duck: false, w: 72, h: 84 };
  },

  start() {
    this.reset();
    this.state = 'play';
    AudioSys.init(); AudioSys.resume(); AudioSys.startMusic();
  },

  restart() { this.start(); },

  togglePause() {
    if (this.state === 'play') { this.state = 'paused'; AudioSys.stopMusic(); }
    else if (this.state === 'paused') { this.state = 'play'; AudioSys.startMusic(); }
  },

  playerBox() {
    const p = this.player;
    const h = p.duck ? 52 : 84;
    return { x: p.x - 34, y: p.y - h, w: 68, h };
  },

  hitObstacle(o) {
    if (this.invuln > 0 || o.hit) return;
    o.hit = true;
    this.lives -= 1;
    this.farmerGap = Math.max(0, this.farmerGap - 62);
    this.invuln = 1.2;
    AudioSys.crash();
    if (this.lives <= 0 || this.farmerGap <= 0) this.endCaught();
  },

  endCaught() {
    this.state = 'caught';
    AudioSys.stopMusic(); AudioSys.caught();
  },
  endEscaped() {
    this.score += CONFIG.ESCAPE_BONUS;
    this.state = 'escaped';
    AudioSys.stopMusic(); AudioSys.win();
  },

  update(dt) {
    this.time += dt;
    if (this.state === 'title') {
      // Idle turkey bobs on the title screen.
      this.player.y = CONFIG.GROUND_Y + Math.sin(this.time * 2) * 2;
      this.drainClicksTitle();
      return;
    }
    // Paused: only P resumes (handled by Input); never restart from here.
    if (this.state === 'paused') { Input.clicks.length = 0; Input.jumpQueued = false; return; }
    if (this.state !== 'play') { this.drainClicksEnd(); return; }

    const p = this.player;
    // Speed grows with distance.
    this.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.BASE_SPEED + this.meters * 0.35);
    const dx = this.speed * dt;
    this.scrollPx += dx;
    this.meters += dx / CONFIG.PX_PER_M;
    this.score = Math.floor(this.meters) * 10 + this.corn * CONFIG.CORN_SCORE + this.drums * CONFIG.DRUM_SCORE;
    // Farmer slowly closes in, faster when you are slow is not a thing — he
    // recovers a little ground when you run clean.
    this.farmerGap = Math.min(CONFIG.FARMER_GAP_START, this.farmerGap + 7 * dt);
    if (this.invuln > 0) this.invuln -= dt;

    // Jump / duck input.
    if (Input.jumpQueued) {
      Input.jumpQueued = false;
      if (p.onGround) { p.vy = -CONFIG.JUMP_V; p.onGround = false; AudioSys.jump(); }
    }
    p.duck = Input.duckHeld && p.onGround;

    // Physics.
    if (!p.onGround) {
      p.vy += CONFIG.GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= CONFIG.GROUND_Y) { p.y = CONFIG.GROUND_Y; p.vy = 0; p.onGround = true; }
    }

    worldUpdate(this.world, dt, this.meters, this.speed, p.x);

    // Collisions.
    const box = this.playerBox();
    for (const o of this.world.obstacles) {
      if (o.hit) continue;
      let ob;
      if (o.kind === 'swingknife') {
        const ang = Math.sin(o.phase) * 0.55;
        const kx = o.x + 23 + Math.sin(ang) * 150, ky = 40 + Math.cos(ang) * 150;
        ob = { x: kx - 14, y: ky - 40, w: 28, h: 96 };
      } else if (o.kind === 'fallknife') {
        ob = { x: o.x + 4, y: o.y, w: 32, h: 78 };
      } else {
        ob = { x: o.x + 6, y: o.y + 4, w: o.w - 12, h: o.h - 4 };
      }
      if (box.x < ob.x + ob.w && box.x + box.w > ob.x && box.y < ob.y + ob.h && box.y + box.h > ob.y) {
        this.hitObstacle(o);
        if (this.state !== 'play') return;
      }
    }
    // Pickups.
    for (const pk of this.world.pickups) {
      if (pk.taken) continue;
      const dxp = pk.x - p.x, dyp = pk.y - (p.y - 42);
      if (dxp * dxp + dyp * dyp < 48 * 48) {
        pk.taken = true;
        if (pk.kind === 'corn') { this.corn++; AudioSys.coin(); }
        else { this.drums++; AudioSys.drum(); }
      }
    }
    this.world.pickups = this.world.pickups.filter(pk => !pk.taken);

    // Caught by the farmer?
    if (this.farmerGap <= 0) { this.endCaught(); return; }
    // Reached the barn?
    if (this.meters >= CONFIG.GOAL_M) { this.endEscaped(); return; }

    // Clicks during play do nothing except jump (handled in Input).
    Input.clicks.length = 0;
  },

  drainClicksTitle() {
    for (const c of Input.clicks) {
      if (c.x > CONFIG.W / 2 - 180 && c.x < CONFIG.W / 2 + 180 && c.y > 420 && c.y < 520) this.start();
    }
    Input.clicks.length = 0;
    if (Input.jumpQueued) { Input.jumpQueued = false; this.start(); }
  },
  drainClicksEnd() {
    for (const c of Input.clicks) {
      if (c.x > CONFIG.W / 2 - 190 && c.x < CONFIG.W / 2 + 190 && c.y > 490 && c.y < 590) this.restart();
    }
    Input.clicks.length = 0;
    if (Input.jumpQueued) { Input.jumpQueued = false; this.restart(); }
  },

  render() {
    const ctx = this.ctx, g = this;
    ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
    const escaped = this.state === 'escaped';
    Render.background(ctx, this.time, this.scrollPx, escaped);
    Render.leaves(ctx, this.world.leaves);
    Render.dust(ctx, this.world.dust);
    // Pickups (behind obstacles).
    for (const pk of this.world.pickups) {
      if (pk.kind === 'corn') Render.corn(ctx, pk); else Render.drum(ctx, pk);
    }
    // Obstacles.
    for (const o of this.world.obstacles) {
      if (o.kind === 'oven') Render.oven(ctx, o, this.time);
      else if (o.kind === 'fence') Render.fence(ctx, o);
      else if (o.kind === 'wood') Render.wood(ctx, o);
      else if (o.kind === 'swingknife') Render.swingKnife(ctx, o);
      else if (o.kind === 'fallknife') Render.fallKnife(ctx, o);
    }
    if (this.state === 'title') {
      // Title overlay first, then the big hero turkey on top of it.
      Render.title(ctx, this.time);
      // Hero turkey stands left of the START button, clear of the hint text.
      Render.turkey(ctx, { x: 300, y: CONFIG.GROUND_Y - 10, onGround: true, duck: false }, this.time);
      return;
    }
    // Farmer behind the turkey.
    const farmerX = this.player.x - 60 - this.farmerGap;
    Render.farmer(ctx, farmerX, this.time, this.farmerGap);
    // Turkey (blink while invulnerable).
    if (!(this.invuln > 0 && Math.floor(this.time * 12) % 2 === 0)) {
      Render.turkey(ctx, this.player, this.time);
    }
    if (this.state === 'play' || this.state === 'paused') Render.hud(ctx, g);
    if (this.state === 'paused') Render.paused(ctx);
    if (this.state === 'caught') Render.endScreen(ctx, g, false);
    if (this.state === 'escaped') Render.endScreen(ctx, g, true);
  },

  frame(dt) {
    this.update(dt);
    this.render();
  },
};

// Boot + rAF loop (skipped in deterministic shot mode — shots.js drives frames).
(function boot() {
  const params = new URLSearchParams(location.search);
  const seedParam = params.get('seed');
  const seed = seedParam ? (hashSeed(seedParam) ^ 0x9e3779b9) >>> 0 : 1;
  const canvas = document.getElementById('game');
  window.TurkeyGame = TurkeyGame;
  TurkeyGame.init(canvas, seed);
  if (params.get('shot')) { window.__shotMode = true; return; } // shots.js takes over
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    TurkeyGame.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
