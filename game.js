// ==== VOID LOOP: Pure Code Space Survival ==== //
// All code, no assets, just math & magic! 🚀

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
canvas.width = W; canvas.height = H;

let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0;

let player, bullets = [], enemies = [], particles = [];
let upgrades = { weapon: 1, health: 3 };

function resetGame() {
  score = 0;
  upgrades = { weapon: 1, health: 3 };
  player = {
    x: W/2, y: H*0.8, r: 20, cooldown: 0, hp: upgrades.health
  };
  bullets = [];
  enemies = [];
  particles = [];
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 15;
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -p.r);
  for (let i=1; i<=3; ++i)
    ctx.lineTo(Math.sin(i*2*Math.PI/3)*p.r, -Math.cos(i*2*Math.PI/3)*p.r);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// --- Input ---
let mouseX = W/2, mouseY = H/2;
canvas.addEventListener('mousemove', e=>{
  mouseX = e.clientX; mouseY = e.clientY;
});
canvas.addEventListener('mousedown', e=>{
  if (gameState === 'playing' && player.cooldown <= 0) {
    shoot();
  }
});
window.addEventListener('resize', ()=>{
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
});

// --- Shooting ---
function shoot() {
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
  for(let i=0; i<upgrades.weapon; ++i) {
    let spread = (i - (upgrades.weapon-1)/2) * 0.12;
    bullets.push({
      x: player.x, y: player.y,
      dx: Math.cos(angle+spread)*12,
      dy: Math.sin(angle+spread)*12,
      r: 7, life: 0
    });
  }
  player.cooldown = 12;
  playSound('shoot');
}

// --- Enemy Spawning ---
function spawnEnemy() {
  let angle = Math.random()*2*Math.PI;
  let radius = Math.max(W,H)*0.5 + 40;
  let ex = W/2 + Math.cos(angle)*radius;
  let ey = H/2 + Math.sin(angle)*radius;
  let speed = 2 + Math.random()*1.5 + score/100;
  enemies.push({
    x: ex, y: ey, r: 22, hp: 1 + Math.floor(score/30),
    dx: 0, dy: 0, speed
  });
}

// --- Collision ---
function dist(a, b) {
  let dx = a.x-b.x, dy = a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
}

function gameLoop() {
  ctx.clearRect(0,0,W,H);
  if (gameState === 'playing') {
    // Player
    // Smooth move towards mouse
    player.x += (mouseX-player.x)*0.14;
    player.y += (mouseY-player.y)*0.14;
    player.cooldown = Math.max(0, player.cooldown-1);

    drawPlayer(player);

    // Bullets
    for (let b of bullets) {
      b.x += b.dx; b.y += b.dy;
      b.life++;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    bullets = bullets.filter(b=>b.x>0&&b.x<W&&b.y>0&&b.y<H&&b.life<40);

    // Enemies
    for (let e of enemies) {
      let angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.dx = Math.cos(angle) * e.speed;
      e.dy = Math.sin(angle) * e.speed;
      e.x += e.dx; e.y += e.dy;

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.strokeStyle = '#f0f';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, 2*Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Collisions
    for (let e of enemies) {
      for (let b of bullets) {
        if (dist(e,b) < e.r+b.r) {
          e.hp--; b.life = 1000;
          spawnParticles(e.x, e.y, '#f0f');
          playSound('hit');
          if (e.hp <= 0) {
            score += 5;
            e.x = -999; // remove
            spawnParticles(e.x, e.y, '#ff0');
            playSound('explode');
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
      ctx.globalAlpha = p.life/20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
      ctx.fillStyle = p.c;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    particles = particles.filter(p=>p.life>0);

    // Spawn logic
    if (Math.random() < (0.03 + score/8000)) spawnEnemy();

    // Score
    document.getElementById('score').innerText = "Score: " + score;
    document.getElementById('upgradePanel').style.display = '';
  }
  if (gameState === 'menu') {
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 60px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOID LOOP', W/2, H/2-40);
    ctx.font = '20px Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Click START to play!', W/2, H/2+30);
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
    ctx.fillText('Click START to try again!', W/2, H/2+60);
    document.getElementById('upgradePanel').style.display = 'none';
  }
  requestAnimationFrame(gameLoop);
}

// --- Particles ---
function spawnParticles(x, y, c) {
  for(let i=0; i<12; ++i) {
    let a = Math.random()*2*Math.PI;
    let s = Math.random()*4+1;
    particles.push({
      x, y, dx: Math.cos(a)*s, dy: Math.sin(a)*s,
      r: Math.random()*3+2, c, life: 20+Math.random()*10
    });
  }
}

// --- Upgrades ---
document.getElementById('upgradeBtn').onclick = ()=>{
  if(score >= 10) {
    score -= 10;
    upgrades.weapon++;
    playSound('upgrade');
  }
};
document.getElementById('healBtn').onclick = ()=>{
  if(score >= 10 && player.hp < upgrades.health) {
    score -= 10;
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