// Render: every pixel is drawn on canvas — vector art only, no images/fonts loaded.
'use strict';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

const Render = {
  // ---- background: sunset farm parallax ----
  background(ctx, t, scrollPx, escaped) {
    const C = CONFIG.COLORS, W = CONFIG.W, H = CONFIG.H, G = CONFIG.GROUND_Y;
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, C.skyTop); sky.addColorStop(0.45, C.skyMid); sky.addColorStop(1, C.skyLow);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, G + 4);
    // Sun
    ctx.fillStyle = C.sunCore; circle(ctx, 1010, 150, 58);
    ctx.fillStyle = C.sun; circle(ctx, 1010, 150, 44);
    // Clouds
    ctx.fillStyle = 'rgba(255,220,180,0.85)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 340 - scrollPx * 0.08) % (W + 260) + W + 260) % (W + 260) - 130;
      const cy = 70 + i * 46;
      ellipse(ctx, cx, cy, 62, 18); ellipse(ctx, cx + 44, cy + 6, 46, 14); ellipse(ctx, cx - 48, cy + 8, 40, 12);
    }
    // Far hills + barn silhouette (slow parallax)
    ctx.fillStyle = C.hillFar;
    ctx.beginPath(); ctx.moveTo(0, G);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, G - 90 - Math.sin((x + scrollPx * 0.15) * 0.006) * 34);
    ctx.lineTo(W, G); ctx.closePath(); ctx.fill();
    // Distant barn
    const bx = 880 - (scrollPx * 0.15 % 1400);
    ctx.fillStyle = C.barn;
    ctx.fillRect(bx, G - 150, 150, 90);
    ctx.fillStyle = C.barnRoof;
    ctx.beginPath(); ctx.moveTo(bx - 10, G - 150); ctx.lineTo(bx + 75, G - 196); ctx.lineTo(bx + 160, G - 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.barnTrim; ctx.fillRect(bx + 62, G - 96, 26, 36);
    // Trees
    ctx.fillStyle = '#3d2417';
    for (let i = 0; i < 5; i++) {
      const tx = ((i * 300 + 120 - scrollPx * 0.25) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.fillRect(tx - 5, G - 110, 10, 50);
      circle(ctx, tx, G - 130, 34); circle(ctx, tx - 24, G - 108, 22); circle(ctx, tx + 24, G - 108, 22);
    }
    // Near hill
    ctx.fillStyle = C.hillNear;
    ctx.beginPath(); ctx.moveTo(0, G);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, G - 26 - Math.sin((x + scrollPx * 0.4) * 0.008) * 12);
    ctx.lineTo(W, G); ctx.closePath(); ctx.fill();
    // Ground
    ctx.fillStyle = C.ground; ctx.fillRect(0, G, W, H - G);
    ctx.fillStyle = C.groundTop; ctx.fillRect(0, G, W, 10);
    ctx.fillStyle = C.grass;
    for (let i = 0; i < 40; i++) {
      const gx = ((i * 97 - scrollPx) % (W + 40) + W + 40) % (W + 40) - 20;
      ctx.fillRect(gx, G + 14 + (i % 5) * 16, 14, 4);
    }
    // Fence posts (mid parallax)
    ctx.fillStyle = '#5d3a1c';
    for (let i = 0; i < 14; i++) {
      const fx = ((i * 110 - scrollPx * 0.7) % (W + 120) + W + 120) % (W + 120) - 60;
      ctx.fillRect(fx, G - 52, 8, 52);
    }
    ctx.fillRect(0, G - 48, W, 6); ctx.fillRect(0, G - 28, W, 6);
    // Safe barn at the goal (drawn big when escaped / near the end)
    if (escaped) {
      ctx.fillStyle = C.barn; ctx.fillRect(980, G - 260, 260, 200);
      ctx.fillStyle = C.barnRoof;
      ctx.beginPath(); ctx.moveTo(960, G - 260); ctx.lineTo(1110, G - 340); ctx.lineTo(1260, G - 260); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.barnTrim; ctx.fillRect(1078, G - 150, 64, 90);
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('SAFE BARN!', 1110, G - 190);
    }
  },

  leaves(ctx, leaves) {
    for (const l of leaves) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot);
      ctx.fillStyle = l.c; ellipse(ctx, 0, 0, 7, 4); ctx.restore();
    }
  },
  dust(ctx, dust) {
    for (const d of dust) {
      ctx.fillStyle = 'rgba(210,170,110,' + Math.max(0, d.life / d.max * 0.5) + ')';
      circle(ctx, d.x, d.y, d.r);
    }
  },

  // ---- turkey ----
  turkey(ctx, p, t) {
    const C = CONFIG.COLORS;
    const run = Math.sin(t * 18);
    const squash = p.onGround ? 1 + Math.sin(t * 18) * 0.04 : 1.12;
    const stretchY = p.onGround ? 1 : 1.08;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(2 - squash > 1.1 ? 1 : squash, stretchY);
    const duck = p.duck ? 1 : 0;
    const bodyY = duck ? 12 : 0;
    // Tail feathers (fan)
    ctx.fillStyle = '#7a4a22';
    for (let i = -2; i <= 2; i++) {
      ctx.save(); ctx.translate(-34, -18 + bodyY); ctx.rotate(i * 0.42);
      ctx.beginPath(); ctx.ellipse(-16, 0, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#a8642e';
    for (let i = -1; i <= 1; i++) {
      ctx.save(); ctx.translate(-34, -18 + bodyY); ctx.rotate(i * 0.5);
      ctx.beginPath(); ctx.ellipse(-12, 0, 16, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // Legs (running)
    ctx.strokeStyle = '#f2a541'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const legSwing = p.onGround ? run * 12 : 6;
    ctx.beginPath(); ctx.moveTo(-6, 18 + bodyY); ctx.lineTo(-6 + legSwing, 34); ctx.moveTo(8, 18 + bodyY); ctx.lineTo(8 - legSwing, 34); ctx.stroke();
    // Body
    ctx.fillStyle = C.turkeyBody; ellipse(ctx, 0, 0 + bodyY, 36, 26 - duck * 8);
    ctx.fillStyle = C.turkeyBreast; ellipse(ctx, 14, 8 + bodyY, 22, 16 - duck * 5);
    // Wing
    ctx.fillStyle = C.turkeyWing;
    ctx.save(); ctx.translate(-4, -2 + bodyY); ctx.rotate(p.onGround ? run * 0.25 : -0.9);
    ctx.beginPath(); ctx.ellipse(-6, 0, 20, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Neck + head
    ctx.fillStyle = C.turkeyHead;
    ctx.beginPath(); ctx.ellipse(26, -26 + bodyY, 9, 16, 0.25, 0, Math.PI * 2); ctx.fill();
    circle(ctx, 30, -40 + bodyY, 13);
    // Panicked eye (big white + pupil looking back)
    ctx.fillStyle = '#fff'; circle(ctx, 33, -44 + bodyY, 6);
    ctx.fillStyle = '#1a1a1a'; circle(ctx, 30, -44 + bodyY, 3);
    ctx.fillStyle = '#fff'; circle(ctx, 31, -46 + bodyY, 1.2);
    // Beak + wattle
    ctx.fillStyle = C.turkeyBeak;
    ctx.beginPath(); ctx.moveTo(40, -42 + bodyY); ctx.lineTo(54, -38 + bodyY); ctx.lineTo(40, -34 + bodyY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.turkeyWattle; ellipse(ctx, 40, -30 + bodyY, 4, 8);
    // Sweat drop of panic
    ctx.fillStyle = '#9fd8ff'; ellipse(ctx, 18, -56 + bodyY, 3, 5);
    ctx.restore();
  },

  // ---- farmer ----
  farmer(ctx, x, t, gap) {
    const C = CONFIG.COLORS;
    const run = Math.sin(t * 16);
    ctx.save(); ctx.translate(x, CONFIG.GROUND_Y);
    // Legs
    ctx.strokeStyle = C.farmerPants; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(-4 + run * 10, 0); ctx.moveTo(6, -34); ctx.lineTo(6 - run * 10, 0); ctx.stroke();
    // Body: blue overalls shirt + red
    ctx.fillStyle = '#c9402e'; rr(ctx, -22, -78, 44, 48, 10); ctx.fill();
    ctx.fillStyle = C.farmerShirt; ctx.fillRect(-18, -52, 36, 26);
    // Arm reaching forward with pitchfork
    ctx.strokeStyle = '#e8b98a'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(14, -66); ctx.lineTo(44, -52 + run * 4); ctx.stroke();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(40, -78); ctx.lineTo(58, -30); ctx.stroke();
    ctx.strokeStyle = '#cfd6de'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(58 + i * 5, -30); ctx.lineTo(62 + i * 6, -12); ctx.stroke();
    }
    // Head + straw hat + angry moustache
    ctx.fillStyle = '#e8b98a'; circle(ctx, 0, -92, 15);
    ctx.fillStyle = C.farmerHat;
    ctx.beginPath(); ctx.ellipse(0, -102, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -106, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(2, -86, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); // moustache
    circle(ctx, 6, -96, 2); circle(ctx, -6, -96, 2); // eyes
    // "!" when close
    if (gap < 90) {
      ctx.fillStyle = '#ff2e2e'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', 0, -136);
    }
    ctx.restore();
  },

  // ---- obstacles & pickups ----
  oven(ctx, o, t) {
    const C = CONFIG.COLORS, flick = 0.7 + Math.sin(t * 9 + o.phase) * 0.3;
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = C.oven; rr(ctx, 0, 0, o.w, o.h, 10); ctx.fill();
    ctx.fillStyle = '#22222a'; rr(ctx, 10, 12, o.w - 20, 44, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,' + Math.floor(110 + 90 * flick) + ',26,' + (0.55 + 0.4 * flick) + ')';
    ctx.beginPath(); ctx.moveTo(18, 50);
    ctx.quadraticCurveTo(30, 18 + flick * 8, 42, 50);
    ctx.quadraticCurveTo(54, 22 + flick * 8, 66, 50);
    ctx.quadraticCurveTo(74, 30, 80, 50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.ovenFire; circle(ctx, 30, 40, 6); circle(ctx, 58, 42, 5);
    ctx.fillStyle = '#888'; ctx.fillRect(14, 66, o.w - 28, 6);
    ctx.fillStyle = '#ff5a1a'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('HOT!', o.w / 2, 86);
    ctx.restore();
  },
  fence(ctx, o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = '#8a6a2f';
    ctx.fillRect(0, 0, 10, o.h); ctx.fillRect(o.w - 10, 0, 10, o.h); ctx.fillRect(o.w / 2 - 5, 0, 10, o.h);
    ctx.fillRect(0, 8, o.w, 9); ctx.fillRect(0, 32, o.w, 9);
    ctx.fillStyle = '#c98a3d'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(o.w, 0); ctx.lineTo(o.w - 6, -10); ctx.lineTo(6, -10); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  wood(ctx, o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = '#6e4520';
    ellipse(ctx, 22, o.h - 14, 20, 13); ellipse(ctx, 58, o.h - 14, 20, 13); ellipse(ctx, 92, o.h - 14, 20, 13);
    ellipse(ctx, 40, o.h - 36, 20, 13); ellipse(ctx, 76, o.h - 36, 20, 13);
    ctx.fillStyle = '#d9a05b';
    circle(ctx, 22, o.h - 14, 7); circle(ctx, 58, o.h - 14, 7); circle(ctx, 92, o.h - 14, 7);
    ctx.fillStyle = '#a8642e'; circle(ctx, 22, o.h - 14, 3); circle(ctx, 58, o.h - 14, 3);
    ctx.restore();
  },
  swingKnife(ctx, o) {
    const ang = Math.sin(o.phase) * 0.55;
    const pivotX = o.x + 23, pivotY = 40;
    const kx = pivotX + Math.sin(ang) * 150, ky = pivotY + Math.cos(ang) * 150;
    ctx.save();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.translate(kx, ky); ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = '#5b2a1a'; ctx.fillRect(-6, -34, 12, 30);
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(0, 62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-2, 2, 2, 44);
    ctx.restore();
    // Warning sign
    ctx.fillStyle = '#ffd23e'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('DUCK!', pivotX, 30);
  },
  fallKnife(ctx, o) {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = '#5b2a1a'; ctx.fillRect(14, -30, 12, 30);
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(36, 0); ctx.lineTo(20, 78); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(17, 6, 3, 52);
    ctx.restore();
  },
  corn(ctx, p) {
    const bob = Math.sin(p.phase) * 4;
    ctx.save(); ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = '#4e9b3a';
    ctx.beginPath(); ctx.ellipse(-12, 6, 8, 18, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, 6, 8, 18, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23e'; ellipse(ctx, 0, 0, 11, 17);
    ctx.fillStyle = '#f2a541';
    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) circle(ctx, c * 5, r * 8, 1.6);
    ctx.restore();
  },
  drum(ctx, p) {
    const bob = Math.sin(p.phase) * 5;
    ctx.save(); ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = 'rgba(255,215,106,0.35)'; circle(ctx, 0, 0, 30 + Math.sin(p.phase * 2) * 4);
    ctx.fillStyle = '#e8a34c'; ellipse(ctx, -4, 4, 20, 15);
    ctx.fillStyle = '#c97e2e'; ellipse(ctx, -4, 8, 16, 10);
    ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(28, -18); ctx.stroke();
    ctx.fillStyle = '#fff6e0'; circle(ctx, 30, -20, 6); circle(ctx, 24, -14, 5);
    ctx.restore();
  },

  // ---- HUD ----
  hud(ctx, g) {
    ctx.textAlign = 'left';
    // Top bar
    ctx.fillStyle = 'rgba(30,12,4,0.55)'; rr(ctx, 16, 14, 560, 86, 14); ctx.fill();
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 34px sans-serif';
    ctx.fillText(Math.floor(g.meters) + ' m', 36, 52);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('SCORE ' + g.score, 36, 84);
    ctx.fillStyle = '#ffb347'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('GOAL 1000 m  •  ' + Math.max(0, CONFIG.GOAL_M - Math.floor(g.meters)) + ' m to barn', 240, 50);
    // Progress bar to barn
    ctx.fillStyle = 'rgba(30,12,4,0.55)'; rr(ctx, 16, 112, 560, 22, 11); ctx.fill();
    ctx.fillStyle = '#4e9b3a'; rr(ctx, 20, 115, Math.max(8, 552 * Math.min(1, g.meters / CONFIG.GOAL_M)), 16, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    // Little barn marker at the progress position (drawn, not emoji).
    const bx = 20 + 552 * Math.min(1, g.meters / CONFIG.GOAL_M);
    ctx.fillStyle = '#7e2f1d'; ctx.fillRect(bx - 8, 106, 16, 12);
    ctx.fillStyle = '#4a1d12';
    ctx.beginPath(); ctx.moveTo(bx - 10, 107); ctx.lineTo(bx, 98); ctx.lineTo(bx + 10, 107); ctx.closePath(); ctx.fill();
    // Lives (hearts)
    ctx.textAlign = 'right';
    for (let i = 0; i < CONFIG.LIVES; i++) {
      const hx = CONFIG.W - 40 - i * 52, hy = 52;
      ctx.fillStyle = i < g.lives ? '#ff2e4d' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 10);
      ctx.bezierCurveTo(hx - 18, hy - 6, hx - 8, hy - 20, hx, hy - 8);
      ctx.bezierCurveTo(hx + 8, hy - 20, hx + 18, hy - 6, hx, hy + 10);
      ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SPEED x' + (g.speed / CONFIG.BASE_SPEED).toFixed(1), CONFIG.W - 36, 92);
    // Farmer danger meter
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(30,12,4,0.55)'; rr(ctx, 16, CONFIG.H - 66, 360, 50, 12); ctx.fill();
    ctx.fillStyle = '#ff5a4d'; ctx.font = 'bold 19px sans-serif';
    ctx.fillText('FARMER ' + (g.farmerGap < 60 ? 'CLOSE!' : g.farmerGap < 120 ? 'NEAR' : 'BEHIND'), 32, CONFIG.H - 32);
    const frac = Math.max(0, Math.min(1, g.farmerGap / CONFIG.FARMER_GAP_START));
    ctx.fillStyle = '#3a1c10'; rr(ctx, 220, CONFIG.H - 52, 140, 16, 8); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#4e9b3a' : frac > 0.25 ? '#ffd23e' : '#ff2e2e';
    rr(ctx, 222, CONFIG.H - 50, 136 * frac, 12, 6); ctx.fill();
  },

  // ---- screens ----
  title(ctx, t) {
    ctx.fillStyle = 'rgba(30,10,4,0.45)'; ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 84px sans-serif';
    ctx.fillText('TURKEY RUN', CONFIG.W / 2, 150);    ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText('GREAT ESCAPE', CONFIG.W / 2, 210);
    ctx.fillStyle = '#ffe9c4'; ctx.font = '24px sans-serif';
    ctx.fillText('The farmer wants Thanksgiving dinner. YOU are dinner. Run 1000 m to the safe barn!', CONFIG.W / 2, 262);
    ctx.fillText('SPACE / ↑ / W — jump     ↓ / S — duck     P — pause     R — restart', CONFIG.W / 2, 300);
    ctx.fillText('Jump the ovens, fences & wood piles. Duck the swinging knives. Grab corn +100, golden drumstick +500.', CONFIG.W / 2, 334);
    // Big START button
    const pulse = 1 + Math.sin(t * 4) * 0.03;
    ctx.save(); ctx.translate(CONFIG.W / 2, 470); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff7a1a'; rr(ctx, -170, -46, 340, 92, 18); ctx.fill();
    ctx.fillStyle = '#fff3d6'; rr(ctx, -170, -46, 340, 92, 18); ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText('▶  START', 0, 15);
    ctx.restore();
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('or press ENTER / SPACE', CONFIG.W / 2, 570);
  },
  paused(ctx) {
    ctx.fillStyle = 'rgba(20,8,2,0.6)'; ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 64px sans-serif';
    ctx.fillText('PAUSED', CONFIG.W / 2, 340);
    ctx.font = '26px sans-serif'; ctx.fillText('Press P to keep running', CONFIG.W / 2, 390);
  },
  endScreen(ctx, g, escaped) {
    ctx.fillStyle = escaped ? 'rgba(16,48,20,0.45)' : 'rgba(40,8,2,0.6)';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 72px sans-serif';
      ctx.fillText('ESCAPED!', CONFIG.W / 2, 190);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif';
      ctx.fillText('You made it to the safe barn — Happy Thanksgiving!', CONFIG.W / 2, 250);
    } else {
      ctx.fillStyle = '#ff5a4d'; ctx.font = 'bold 72px sans-serif';
      ctx.fillText('CAUGHT!', CONFIG.W / 2, 190);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif';
      ctx.fillText('The farmer got his Thanksgiving dinner...', CONFIG.W / 2, 250);
    }
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText('DISTANCE  ' + Math.floor(g.meters) + ' m', CONFIG.W / 2, 330);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px sans-serif';
    ctx.fillText('SCORE  ' + g.score, CONFIG.W / 2, 400);
    ctx.font = '24px sans-serif'; ctx.fillStyle = '#ffe9c4';
    ctx.fillText('Corn x' + g.corn + '    Drumsticks x' + g.drums + (escaped ? '    Escape bonus +2000' : ''), CONFIG.W / 2, 448);
    const pulse = 1 + Math.sin(g.time * 4) * 0.03;
    ctx.save(); ctx.translate(CONFIG.W / 2, 540); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff7a1a'; rr(ctx, -180, -46, 360, 92, 18); ctx.fill();
    ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText('↻  RESTART', 0, 14);
    ctx.restore();
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 22px sans-serif';
    ctx.fillText('or press R / ENTER', CONFIG.W / 2, 640);
  },
};
