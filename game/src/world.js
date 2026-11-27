// World generation: deterministic obstacle + pickup spawning from a seeded RNG.
// Spawn cadence is driven by travelled distance, never by wall-clock time.
'use strict';

function createWorld(seed) {
  const rng = makeRng(seed);
  return {
    rng,
    obstacles: [],   // {kind,x,y,w,h,phase,vy,state,hit}
    pickups: [],     // {kind:'corn'|'drum',x,y,taken,phase}
    leaves: [],      // ambient falling leaves (visual only, seeded)
    dust: [],
    nextSpawnM: 14,  // metres until next obstacle cluster
    nextCornM: 6,
    nextDrumM: 90,
    travelledPx: 0,
  };
}

// One obstacle cluster at world-x `x` (screen px, off the right edge).
function spawnCluster(world, x) {
  const rng = world.rng;
  const roll = rng.next();
  let kind;
  if (roll < 0.28) kind = 'oven';
  else if (roll < 0.48) kind = 'fence';
  else if (roll < 0.66) kind = 'wood';
  else if (roll < 0.83) kind = 'swingknife';
  else kind = 'fallknife';
  const G = CONFIG.GROUND_Y;
  if (kind === 'oven') {
    world.obstacles.push({ kind, x, y: G - 92, w: 96, h: 92, phase: rng.range(0, 6.28), hit: false });
  } else if (kind === 'fence') {
    world.obstacles.push({ kind, x, y: G - 64, w: 84, h: 64, phase: rng.range(0, 6.28), hit: false });
  } else if (kind === 'wood') {
    world.obstacles.push({ kind, x, y: G - 58, w: 110, h: 58, phase: rng.range(0, 6.28), hit: false });
    if (rng.next() < 0.4) {
      world.obstacles.push({ kind: 'fence', x: x + 150, y: G - 64, w: 84, h: 64, phase: rng.range(0, 6.28), hit: false });
    }
  } else if (kind === 'swingknife') {
    // Knife swinging on a rope at head height — DUCK under it.
    world.obstacles.push({ kind, x, y: 0, w: 46, h: 190, phase: rng.range(0, 6.28), swing: rng.range(0.9, 1.3), hit: false });
  } else {
    // Falling knife: hangs in the air, drops when the turkey gets close.
    world.obstacles.push({ kind, x, y: 150, w: 40, h: 120, vy: 0, state: 'hang', phase: rng.range(0, 6.28), hit: false });
  }
}

function spawnCorn(world, x, arc) {
  const n = world.rng.int(3, 5);
  for (let i = 0; i < n; i++) {
    const cx = x + i * 52;
    const cy = arc ? CONFIG.GROUND_Y - 150 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 70
                    : CONFIG.GROUND_Y - 52;
    world.pickups.push({ kind: 'corn', x: cx, y: cy, taken: false, phase: world.rng.range(0, 6.28) });
  }
}

function worldUpdate(world, dt, meters, speed, playerX) {
  // Spawn obstacles by distance (keep a minimum gap so clusters never stack).
  while (meters >= world.nextSpawnM) {
    const last = world.obstacles[world.obstacles.length - 1];
    const x = Math.max(CONFIG.W + 80 + world.rng.range(0, 120), last ? last.x + 300 : 0);
    spawnCluster(world, x);
    world.nextSpawnM += world.rng.range(11, 19);
  }
  while (meters >= world.nextCornM) {
    spawnCorn(world, CONFIG.W + 60, world.rng.next() < 0.45);
    world.nextCornM += world.rng.range(16, 26);
  }
  while (meters >= world.nextDrumM) {
    world.pickups.push({ kind: 'drum', x: CONFIG.W + 80, y: CONFIG.GROUND_Y - 170, taken: false, phase: 0 });
    world.nextDrumM += world.rng.range(120, 200);
  }
  const dx = speed * dt;
  for (const o of world.obstacles) {
    o.x -= dx;
    if (o.kind === 'fallknife') {
      if (o.state === 'hang' && o.x - playerX < 320) o.state = 'fall';
      if (o.state === 'fall') { o.vy += 2400 * dt; o.y += o.vy * dt; if (o.y > CONFIG.GROUND_Y - 60) { o.y = CONFIG.GROUND_Y - 60; o.state = 'stuck'; } }
    }
    if (o.kind === 'swingknife') o.phase += dt * o.swing * 2.2;
  }
  for (const p of world.pickups) { p.x -= dx; p.phase += dt * 4; }
  world.obstacles = world.obstacles.filter(o => o.x + o.w > -80);
  world.pickups = world.pickups.filter(p => p.x > -60 && !p.taken);
  // Ambient leaves (seeded, capped).
  if (world.leaves.length < 26 && world.rng.next() < dt * 6) {
    world.leaves.push({ x: world.rng.range(0, CONFIG.W), y: -10, vy: world.rng.range(28, 60), vx: world.rng.range(-24, -6), rot: world.rng.range(0, 6.28), vr: world.rng.range(-2, 2), c: world.rng.pick(['#e8862e', '#d94f2b', '#f2b134', '#a34d1f']) });
  }
  for (const l of world.leaves) { l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vr * dt; }
  world.leaves = world.leaves.filter(l => l.y < CONFIG.H + 12);
  // Dust puffs behind the turkey.
  if (world.rng.next() < dt * 22) {
    world.dust.push({ x: playerX - 20, y: CONFIG.GROUND_Y - 4, r: world.rng.range(3, 7), life: 0.5, max: 0.5 });
  }
  for (const d of world.dust) { d.x -= dx * 0.6; d.life -= dt; d.r += dt * 10; }
  world.dust = world.dust.filter(d => d.life > 0);
}
