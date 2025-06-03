// ==== VOID LOOP: Pure Code Space Survival (Pro Edition) ==== //
// UPGRADED: Smoother controls, juicy visuals, difficulty curve, score save! 🚀

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
canvas.width = W; canvas.height = H;

let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0, bestScore = 0, lastScore = 0, level = 1, enemiesKilled = 0;

// --- Load last/best score ---
if (localStorage.voidloopBest) bestScore = +localStorage.voidloopBest;
if (localStorage.voidloopLast) lastScore = +localStorage.voidloopLast;

let player, bullets = [], enemies = [], particles = [], stars = [];
let upgrades = { weapon: 1, health: 3 };

function resetGame() {
  score = 0; level = 1; enemiesKilled = 0;
  upgrades = { weapon: 1, health: 3 };
  player = {
    x: W/2, y: H*0.8, r: 22, cooldown: 0, hp: upgrades.health,
    vx: 0, vy: 0, angle: 0
  };
  bullets = [];
  enemies = [];
  particles = [];
  if (stars.length === 0) spawnStars();
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Body
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 25;
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 3;
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
  ctx.moveTo(0, p.r*0.8);
  ctx.lineTo(-7, p.r*1.3 + Math.random()*7);
  ctx.lineTo(7, p.r*1.3 + Math.random()*7);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,255,255,0.7)';
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// --- Starfield ---
function spawnStars() {
  for (let i=0; i<100; ++i) {
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*1.9+0.6,
      s: Math.random()*0.5+0.15
    });
  }
}
function drawStars() {
  ctx.save();
  ctx.fillStyle = '#0ff3';
  for (let s of stars) {
    s.y += s.s;
    if (s.y > H) s.y = 0, s.x = Math.random()*W;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 2*Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

// --- Input ---
let mouseX = W/2, mouseY = H/2;
canvas.addEventListener('mousemove', e=>{
  mouseX = e.clientX; mouseY = e.clientY;
});
window.addEventListener('resize', ()=>{
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
  stars = []; spawnStars();
});

// --- Shooting ---
canvas.addEventListener('mousedown', e=>{
  if (gameState === 'playing' && player.cooldown <= 0) {
    shoot();
  }
});
function shoot() {
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
  for(let i=0; i<upgrades.weapon; ++i) {
    let spread = (i - (upgrades.weapon-1)/2) * 0.12;
    bullets.push({
      x: player.x + Math.cos(angle+spread)*player.r,
      y: player.y + Math.sin(angle+spread)*player.r,
      dx: Math.cos(angle+spread)*14,
      dy: Math.sin(angle+spread)*14,
      r: 8, life: 0, trail: []
    });
  }
  player.cooldown = 10;
  playSound('shoot');
}

// --- Enemy Spawning ---
function spawnEnemy() {
  let types = ['circle','square','triangle'];
  let type = types[Math.floor(Math.random()*types.length)];
  let angle = Math.random()*2*Math.PI;
  let radius = Math.max(W,H)*0.5 + 40;
  let ex = W/2 + Math.cos(angle)*radius;
  let ey = H/2 + Math.sin(angle)*radius;
  let speed = 1.5 + level*0.3 + Math.random();
  enemies.push({
    x: ex, y: ey, r: 22+Math.random()*6, hp: 1+level, dx: 0, dy: 0, speed, type, rot: 0, hitFlash: 0
  });
}

// --- Collision ---
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
    if (d > 2) {
      let speed = Math.min(10, d*0.16);
      player.vx = dx/d*speed;
      player.vy = dy/d*speed;
    } else {
      player.vx *= 0.7; player.vy *= 0.7;
    }
    player.x += player.vx;
    player.y += player.vy;
    player.cooldown = Math.max(0, player.cooldown-1);
    player.angle = Math.atan2(mouseY-player.y, mouseX-player.x);

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

    // Enemies
    for (let e of enemies) {
      let angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.dx = Math.cos(angle) * e.speed;
      e.dy = Math.sin(angle) * e.speed;
      e.x += e.dx; e.y += e.dy;
      e.rot += 0.04 + level*0.008;
      if (e.hitFlash > 0) e.hitFlash--;

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rot);
      ctx.lineWidth = 3;
      if (e.hitFlash>0) {
        ctx.shadowColor = '#ff0'; ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ff0';
      } else {
        ctx.shadowColor = '#f0f'; ctx.shadowBlur = 16;
        ctx.strokeStyle = '#f0f';
      }
      // Enemy shapes
      if (e.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, 2*Math.PI);
        ctx.stroke();
      }
      if (e.type === 'square') {
        ctx.beginPath();
        ctx.rect(-e.r*0.8, -e.r*0.8, e.r*1.6, e.r*1.6);
        ctx.stroke();
      }
      if (e.type === 'triangle') {
        ctx.beginPath();
        for(let i=0;i<3;i++) {
          let a = i*2*Math.PI/3-Math.PI/2;
          ctx.lineTo(Math.cos(a)*e.r, Math.sin(a)*e.r);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Collisions
    for (let e of enemies) {
      for (let b of bullets) {
        if (dist(e,b) < e.r+b.r) {
          e.hp--; b.life = 9999; e.hitFlash = 7;
          spawnParticles(e.x, e.y, '#f0f');
          playSound('hit');
          if (e.hp <= 0) {
            score += 8+level*2;
            e.x = -999; // remove
            spawnParticles(e.x, e.y, '#ff0');
            playSound('explode');
            enemiesKilled++;
            if (enemiesKilled%7===0) { level++; }
          }
        }
      }
      if (dist(e, player) < e.r + player.r) {
        upgrades.health--;
        player.hp--;
        spawnParticles(player.x, player.y, '#f44');
        playSound('hurt');
        e.x = -999;
        if (player.hp <= 0) {
          // Save scores
          lastScore = score;
          if (score > bestScore) bestScore = score;
          localStorage.voidloopBest = bestScore;
          localStorage.voidloopLast = lastScore;
          gameState = 'gameover';
          document.getElementById('startBtn').style.display = '';
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

    // Spawn logic
    if (Math.random() < (0.02 + level/70)) spawnEnemy();

    // Score/UI
    document.getElementById('score').innerText = `Score: ${score} | Level: ${level}`;
    document.getElementById('upgradePanel').style.display = '';
  }
  if (gameState === 'menu') {
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 60px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOID LOOP', W/2, H/2-80);
    ctx.font = '26px Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Click START to play!', W/2, H/2-30);
    ctx.font = '18px Courier New, monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Last: ${lastScore}   Best: ${bestScore}`, W/2, H/2+10);
    ctx.font = '16px Courier New, monospace';
    ctx.fillStyle = '#fff9';
    ctx.fillText('Move mouse to steer | Click to shoot', W/2, H/2+46);
  }
  if (gameState === 'gameover') {
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 52px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W/2, H/2-30);
    ctx.font = '28px Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Final Score: ' + score, W/2, H/2+30);
    ctx.font = '18px Courier New, monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Last: ${lastScore}   Best: ${bestScore}`, W/2, H/2+64);
    ctx.fillStyle = '#fff9';
    ctx.fillText('Click START to try again!', W/2, H/2+86);
    document.getElementById('upgradePanel').style.display = 'none';
  }
  requestAnimationFrame(gameLoop);
}

// --- Particles ---
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

// --- Upgrades ---
document.getElementById('upgradeBtn').onclick = ()=>{
  if(score >= 14) {
    score -= 14;
    upgrades.weapon++;
    playSound('upgrade');
  }
};
document.getElementById('healBtn').onclick = ()=>{
  if(score >= 12 && player.hp < upgrades.health) {
    score -= 12;
    player.hp++;
    playSound('upgrade');
  }
};
document.getElementById('startBtn').onclick = ()=>{
  resetGame();
  gameState = 'playing';
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('upgradePanel').style.display = '';
};

// --- Procedural Sound (Web Audio API) ---
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
  }
  o.start();
  o.stop(audioCtx.currentTime+0.25);
}

resetGame();
gameLoop();