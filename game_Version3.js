// ==== VOID LOOP: Pro Code Edition ==== //
// Full pro features, pro visuals, pro sound, pro save system, all code, no assets!

// === GLOBALS ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
canvas.width = W; canvas.height = H;

// --- UI refs
const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');
const coinsElem = document.getElementById('coins');
const bestElem = document.getElementById('best');
const statRunsElem = document.getElementById('statRuns');
const statEnemiesElem = document.getElementById('statEnemies');
const statShotsElem = document.getElementById('statShots');
const statPowerupsElem = document.getElementById('statPowerups');
const statsPanel = document.getElementById('statsPanel');

// === SAVE / LOAD ===
let save = JSON.parse(localStorage.voidloopSave || '{}');
function persist() {
  localStorage.voidloopSave = JSON.stringify(save);
}
function statInc(k, amt=1) {
  save[k] = (save[k]||0) + amt; persist();
}

// === GAME STATE ===
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let player, bullets, enemies, particles, powerups, stars;
let upgrades, coins, score, best, level, waveTimer, slowmoTimer, shieldTimer;
let shotsFired = 0;

// === RESET ===
function resetGame() {
  // Stats
  score = 0; level = 1; coins = save.coins||0; shotsFired = 0;
  upgrades = { weapon: save.weapon||1, health: save.health||3 };
  player = {
    x: W/2, y: H*0.8, r: 22, cooldown: 0, hp: upgrades.health, vx: 0, vy: 0, angle: 0, shield: 0
  };
  bullets = [];
  enemies = [];
  particles = [];
  powerups = [];
  stars = [];
  waveTimer = 0;
  slowmoTimer = 0;
  shieldTimer = 0;
  spawnStars();
}

// === STARFIELD ===
function spawnStars() {
  for (let i=0; i<120; ++i) {
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*2.2+0.6,
      s: Math.random()*0.5+0.15,
      c: `hsl(${Math.random()*360},100%,${65+Math.random()*18}%)`
    });
  }
}
function drawStars() {
  ctx.save();
  ctx.globalAlpha = 0.79;
  for (let s of stars) {
    s.y += s.s;
    if (s.y > H) s.y = 0, s.x = Math.random()*W;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 2*Math.PI);
    ctx.fillStyle = s.c;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// === DRAW PLAYER ===
function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Glow
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 25 + (p.shield?22:0);
  // Body
  ctx.strokeStyle = p.shield ? '#fff' : '#0ff';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, -p.r);
  for (let i=1; i<=3; ++i)
    ctx.lineTo(Math.sin(i*2*Math.PI/3)*p.r, -Math.cos(i*2*Math.PI/3)*p.r);
  ctx.closePath();
  ctx.stroke();
  // Engine flame
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.rotate(Math.PI);
  ctx.beginPath();
  ctx.moveTo(0, p.r*0.85);
  ctx.lineTo(-7, p.r*1.25 + Math.random()*7);
  ctx.lineTo(7, p.r*1.25 + Math.random()*7);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,255,255,0.7)';
  ctx.fill();
  ctx.restore();
  // Shield
  if (p.shield) {
    ctx.beginPath();
    ctx.arc(0, 0, p.r+7, 0, 2*Math.PI);
    ctx.strokeStyle = `rgba(0,255,255,${0.45+0.5*Math.random()})`;
    ctx.lineWidth = 4.5+Math.random()*2;
    ctx.shadowBlur = 20+Math.random()*12;
    ctx.shadowColor = '#fff';
    ctx.stroke();
  }
  ctx.restore();
}

// === ENEMY TYPES ===
function spawnEnemy() {
  let t = Math.random();
  let type = 'basic';
  if (t < 0.5) type = 'basic';
  else if (t < 0.7) type = 'fast';
  else if (t < 0.85) type = 'splitter';
  else type = 'slow';
  let angle = Math.random()*2*Math.PI;
  let radius = Math.max(W,H)*0.5 + 60;
  let ex = W/2 + Math.cos(angle)*radius;
  let ey = H/2 + Math.sin(angle)*radius;
  let baseSpeed = 1.6 + (level*0.3);
  let conf = {
    basic:  {r: 20, hp: 2+level*0.2, speed: baseSpeed, shape:'circle', color:'#f0f'},
    fast:   {r: 16, hp: 1+level*0.1, speed: baseSpeed*1.8, shape:'triangle', color:'#0f0'},
    slow:   {r: 30, hp: 5+level*0.3, speed: baseSpeed*0.6, shape:'square', color:'#ff0'},
    splitter:{r: 22, hp: 2+level*0.13, speed: baseSpeed*1.1, shape:'circle', color:'#0ff', split: true}
  };
  let c = conf[type];
  enemies.push({
    x: ex, y: ey, r: c.r, hp: c.hp, dx: 0, dy: 0, speed: c.speed, 
    type, shape: c.shape, color: c.color, rot: 0, hitFlash: 0, split: c.split||false
  });
}
function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rot);
  ctx.lineWidth = 3.5;
  ctx.shadowColor = e.hitFlash ? '#fff' : e.color;
  ctx.shadowBlur = e.hitFlash ? 22 : 14;
  ctx.strokeStyle = e.hitFlash ? '#fff' : e.color;
  // Shape
  if (e.shape === 'circle') {
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, 2*Math.PI); ctx.stroke();
  } else if (e.shape === 'square') {
    ctx.beginPath(); ctx.rect(-e.r, -e.r, e.r*2, e.r*2); ctx.stroke();
  } else if (e.shape === 'triangle') {
    ctx.beginPath();
    for(let i=0;i<3;i++) {
      let a = i*2*Math.PI/3-Math.PI/2;
      ctx.lineTo(Math.cos(a)*e.r, Math.sin(a)*e.r);
    }
    ctx.closePath(); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// === POWERUPS ===
function spawnPowerup(x, y) {
  let t = Math.random();
  let type = 'coin';
  if (t < 0.5) type = 'coin';
  else if (t < 0.75) type = 'shield';
  else if (t < 0.9) type = 'slowmo';
  else type = 'double';
  powerups.push({x, y, r: 15, type, life: 320});
}
function drawPowerup(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.93 + 0.07*Math.sin(Date.now()/140+p.x);
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3.5;
  // Symbol
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  if (p.type === 'coin') {
    ctx.arc(0,0,10,0,2*Math.PI);
    ctx.stroke();
    ctx.font = '13px VT323, monospace';
    ctx.fillStyle = '#ff0';
    ctx.fillText('C', -5, 5);
  } else if (p.type === 'shield') {
    ctx.arc(0,0,10,0,2*Math.PI); ctx.stroke();
    ctx.font = '13px VT323, monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText('S', -6, 5);
  } else if (p.type === 'slowmo') {
    ctx.arc(0,0,10,0,2*Math.PI); ctx.stroke();
    ctx.font = '13px VT323, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('⏳', -7, 6);
  } else if (p.type === 'double') {
    ctx.arc(0,0,10,0,2*Math.PI); ctx.stroke();
    ctx.font = '13px VT323, monospace';
    ctx.fillStyle = '#f0f';
    ctx.fillText('2x', -10, 6);
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// === INPUT ===
let mouseX = W/2, mouseY = H/2;
canvas.addEventListener('mousemove', e=>{
  mouseX = e.clientX; mouseY = e.clientY;
});
window.addEventListener('resize', ()=>{
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
  stars = []; spawnStars();
});
canvas.addEventListener('mousedown', e=>{
  if (gameState === 'playing' && player.cooldown <= 0) {
    shoot();
  }
});
document.getElementById('startBtn').onclick = ()=>{
  resetGame();
  gameState = 'playing';
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('upgradePanel').style.display = '';
  statsPanel.style.display = 'none';
};
document.getElementById('upgradeBtn').onclick = ()=>{
  if(coins >= 14) {
    coins -= 14; upgrades.weapon++; save.weapon = upgrades.weapon; save.coins = coins; persist();
    playSound('upgrade'); 
  }
};
document.getElementById('healBtn').onclick = ()=>{
  if(coins >= 12 && player.hp < upgrades.health) {
    coins -= 12; player.hp++; save.coins = coins; persist();
    playSound('upgrade');
  }
};
document.getElementById('shieldBtn').onclick = ()=>{
  if(coins >= 18 && !player.shield) {
    coins -= 18; player.shield = 220; shieldTimer = 220; save.coins = coins; persist();
    playSound('powerup');
  }
};
document.getElementById('slowmoBtn').onclick = ()=>{
  if(coins >= 20 && slowmoTimer <= 0) {
    coins -= 20; slowmoTimer = 320; save.coins = coins; persist();
    playSound('powerup');
  }
};
document.getElementById('resetStatsBtn').onclick = ()=>{
  if(confirm('Reset all stats and upgrades?')) {
    localStorage.clear();
    location.reload();
  }
};

// === SHOOTING ===
function shoot() {
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
  for(let i=0; i<upgrades.weapon; ++i) {
    let spread = (i - (upgrades.weapon-1)/2) * 0.12;
    bullets.push({
      x: player.x + Math.cos(angle+spread)*player.r,
      y: player.y + Math.sin(angle+spread)*player.r,
      dx: Math.cos(angle+spread)*14 * (slowmoTimer>0?0.5:1),
      dy: Math.sin(angle+spread)*14 * (slowmoTimer>0?0.5:1),
      r: 8, life: 0, trail: []
    });
  }
  player.cooldown = slowmoTimer>0 ? 6 : 10;
  shotsFired++;
  statInc('shots',1);
  playSound('shoot');
}

// === GAME LOOP ===
function dist(a, b) {
  let dx = a.x-b.x, dy = a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
}
function gameLoop() {
  ctx.clearRect(0,0,W,H);
  drawStars();

  if (gameState === 'playing') {
    // Player follows mouse always
    let dx = mouseX-player.x, dy = mouseY-player.y;
    let d = Math.sqrt(dx*dx+dy*dy);
    let speed = Math.min(10, d*0.16) * (slowmoTimer>0?0.6:1);
    if (d > 2) {
      player.vx = dx/d*speed;
      player.vy = dy/d*speed;
    } else {
      player.vx *= 0.7; player.vy *= 0.7;
    }
    player.x += player.vx;
    player.y += player.vy;
    player.cooldown = Math.max(0, player.cooldown-1);
    player.angle = Math.atan2(mouseY-player.y, mouseX-player.x);

    // Slo-mo/shield timers
    if (slowmoTimer>0) slowmoTimer--;
    if (player.shield>0) { player.shield--; shieldTimer--; if(player.shield<=0) player.shield=0; }

    drawPlayer(player);

    // Bullets
    for (let b of bullets) {
      b.trail.push({x: b.x, y: b.y});
      if (b.trail.length > 8) b.trail.shift();
      b.x += b.dx; b.y += b.dy; b.life++;
      // Draw neon trail
      ctx.save();
      for (let i=0; i<b.trail.length-1; ++i) {
        ctx.strokeStyle = `rgba(0,255,255,${0.06+0.12*i})`;
        ctx.lineWidth = 4-i*0.35;
        ctx.beginPath();
        ctx.moveTo(b.trail[i].x, b.trail[i].y);
        ctx.lineTo(b.trail[i+1].x, b.trail[i+1].y);
        ctx.stroke();
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    bullets = bullets.filter(b=>b.x>-30&&b.x<W+30&&b.y>-30&&b.y<H+30&&b.life<60);

    // Powerups
    for (let p of powerups) {
      drawPowerup(p);
    }
    // Powerup collision
    for (let p of powerups) {
      if (dist(player, p) < player.r+p.r) {
        if (p.type==='coin') { coins+=2+Math.floor(level/2); statInc('coins',2+Math.floor(level/2)); }
        if (p.type==='shield') { player.shield=260; shieldTimer=260; statInc('powerups'); playSound('powerup'); }
        if (p.type==='slowmo') { slowmoTimer=260; statInc('powerups'); playSound('powerup'); }
        if (p.type==='double') { upgrades.weapon++; statInc('powerups'); playSound('upgrade'); }
        p.life = 0;
      }
    }
    powerups = powerups.filter(p=>--p.life>0);

    // Enemies
    for (let e of enemies) {
      let angle = Math.atan2(player.y - e.y, player.x - e.x);
      let spd = e.speed * (slowmoTimer>0?0.6:1);
      e.dx = Math.cos(angle) * spd;
      e.dy = Math.sin(angle) * spd;
      e.x += e.dx; e.y += e.dy;
      e.rot += 0.04 + level*0.008;
      if (e.hitFlash > 0) e.hitFlash--;

      drawEnemy(e);
    }

    // Collisions
    for (let e of enemies) {
      for (let b of bullets) {
        if (dist(e,b) < e.r+b.r) {
          e.hp--; b.life = 9999; e.hitFlash = 7;
          spawnParticles(e.x, e.y, e.color);
          playSound('hit');
          if (e.hp <= 0) {
            score += 8+level*2;
            statInc('enemies');
            if (e.split) {
              for (let k=0;k<2;k++) {
                let a = Math.random()*2*Math.PI;
                enemies.push({
                  x: e.x+Math.cos(a)*16, y: e.y+Math.sin(a)*16,
                  r: 13, hp: 1, dx: 0, dy: 0, speed: e.speed*1.4, 
                  type:'fast', shape:'triangle', color:'#0ff', rot: 0, hitFlash: 0, split:false
                });
              }
            }
            if (Math.random()<0.3) spawnPowerup(e.x, e.y);
            e.x = -999; // remove
            spawnParticles(e.x, e.y, '#ff0');
            playSound('explode');
          }
        }
      }
      if (dist(e, player) < e.r + player.r) {
        if (player.shield>0) {
          player.shield=0;
          spawnParticles(player.x, player.y, '#0ff');
          playSound('powerup');
        } else {
          upgrades.health--;
          player.hp--;
          spawnParticles(player.x, player.y, '#f44');
          playSound('hurt');
          e.x = -999;
          if (player.hp <= 0) {
            // Save scores/stats
            best = Math.max(score, save.best||0); save.best = best;
            coins += Math.floor(score/12); save.coins = coins;
            statInc('runs'); save.weapon = upgrades.weapon; save.health = upgrades.health; persist();
            showGameOver();
          }
        }
      }
    }
    enemies = enemies.filter(e=>e.x > -500);

    // Particles
    for(let p of particles) {
      p.x += p.dx; p.y += p.dy;
      p.life--;
      ctx.globalAlpha = p.life/24;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
      ctx.fillStyle = p.c;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    particles = particles.filter(p=>p.life>0);

    // Spawn logic (waves)
    waveTimer--;
    if (waveTimer<=0) { waveTimer=120+Math.max(0,180-level*5); spawnEnemy(); }
    if (score/20+1 > level && score>0) level++;

    // UI
    scoreElem.innerText = `Score: ${score}`;
    coinsElem.innerText = `Coins: ${coins}`;
    levelElem.innerText = `Level: ${level}`;
    bestElem.innerText = `Best: ${save.best||0}`;
    document.getElementById('upgradePanel').style.display = '';
  }

  if (gameState === 'menu') {
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 60px Press Start 2P, Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOID LOOP', W/2, H/2-80);
    ctx.font = '26px VT323, Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Click PLAY to start!', W/2, H/2-30);
    ctx.font = '18px VT323, Courier New, monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Best: ${save.best||0}   Coins: ${save.coins||0}`, W/2, H/2+10);
    ctx.font = '16px VT323, Courier New, monospace';
    ctx.fillStyle = '#fff9';
    ctx.fillText('Controls: Move mouse to steer | Click to shoot', W/2, H/2+46);
    // Show stats
    statRunsElem.innerText = `Runs: ${save.runs||0}`;
    statEnemiesElem.innerText = `Enemies Defeated: ${save.enemies||0}`;
    statShotsElem.innerText = `Shots Fired: ${save.shots||0}`;
    statPowerupsElem.innerText = `Powerups Collected: ${save.powerups||0}`;
    statsPanel.style.display = '';
  }
  if (gameState === 'gameover') {
    // already handled in showGameOver()
  }
  requestAnimationFrame(gameLoop);
}
function showGameOver() {
  gameState = 'gameover';
  ctx.save();
  ctx.globalAlpha = 0.91;
  ctx.fillStyle = '#111b';
  ctx.fillRect(0,0,W,H);
  ctx.globalAlpha = 1;
  ctx.font = 'bold 52px Press Start 2P, Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f44';
  ctx.fillText('GAME OVER', W/2, H/2-30);
  ctx.font = '28px VT323, Courier New, monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Final Score: ' + score, W/2, H/2+30);
  ctx.font = '18px VT323, Courier New, monospace';
  ctx.fillStyle = '#0ff';
  ctx.fillText(`Coins: ${coins}   Best: ${save.best||0}`, W/2, H/2+64);
  ctx.fillStyle = '#fff9';
  ctx.fillText('Click PLAY to try again!', W/2, H/2+86);
  ctx.restore();
  document.getElementById('startBtn').style.display = '';
  document.getElementById('upgradePanel').style.display = 'none';
  statsPanel.style.display = '';
}

// === PARTICLES ===
function spawnParticles(x, y, c) {
  for(let i=0; i<16; ++i) {
    let a = Math.random()*2*Math.PI;
    let s = Math.random()*5+1.5;
    particles.push({
      x, y, dx: Math.cos(a)*s, dy: Math.sin(a)*s,
      r: Math.random()*2.6+2.2, c, life: 24+Math.random()*8
    });
  }
}

// === SOUND ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  let o = audioCtx.createOscillator();
  let g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  if(type==='shoot') {
    o.type = 'triangle'; o.frequency.value = 420;
    g.gain.value = 0.12;
    o.frequency.linearRampToValueAtTime(800, audioCtx.currentTime+0.08);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.13);
  } else if(type==='hit') {
    o.type = 'square'; o.frequency.value = 180;
    g.gain.value = 0.18;
    o.frequency.linearRampToValueAtTime(80, audioCtx.currentTime+0.12);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.15);
  } else if(type==='explode') {
    o.type = 'sawtooth'; o.frequency.value = 90;
    g.gain.value = 0.22;
    o.frequency.linearRampToValueAtTime(20, audioCtx.currentTime+0.2);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.22);
  } else if(type==='hurt') {
    o.type = 'triangle'; o.frequency.value = 80;
    g.gain.value = 0.23;
    o.frequency.linearRampToValueAtTime(20, audioCtx.currentTime+0.22);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.25);
  } else if(type==='upgrade') {
    o.type = 'triangle'; o.frequency.value = 600;
    g.gain.value = 0.16;
    o.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime+0.18);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.23);
  } else if(type==='powerup') {
    o.type = 'sine'; o.frequency.value = 340;
    g.gain.value = 0.19;
    o.frequency.linearRampToValueAtTime(120, audioCtx.currentTime+0.16);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.25);
  }
  o.start();
  o.stop(audioCtx.currentTime+0.25);
}

// === LAUNCH ===
resetGame();
gameLoop();