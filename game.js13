// ==== VOID LOOP: Local Edition ====
// No sign up, no sign in, no Firebase!

// Settings and save data will use localStorage
let userData = {
  best: 0,
  coins: 0,
  weaponLevel: 1,
  hearts: 3,
  upgrades: 0,
  profilePic: "",
  displayName: "Player",
  email: "",
  runs: 0
};
let saveKey = "voidloopSave";

// Try to load from localStorage
function loadLocal() {
  try {
    let save = JSON.parse(localStorage.getItem(saveKey));
    if (save && typeof save === "object") {
      userData = { ...userData, ...save };
    }
  } catch (e) {}
}
function saveLocal() {
  localStorage.setItem(saveKey, JSON.stringify(userData));
}

// ====== UI refs ======
const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');
const coinsElem = document.getElementById('coins');
const bestElem = document.getElementById('best');
const statRunsElem = document.getElementById('statRuns');
const statEnemiesElem = document.getElementById('statEnemies');
const statShotsElem = document.getElementById('statShots');
const statPowerupsElem = document.getElementById('statPowerups');
const statsPanel = document.getElementById('statsPanel');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const soundToggle = document.getElementById('soundToggle');
const musicToggle = document.getElementById('musicToggle');
const difficultySelect = document.getElementById('difficultySelect');
const gfxToggle = document.getElementById('gfxToggle');
const bombBtn = document.getElementById('bombBtn');
const bombCountElem = document.getElementById('bombCount');
const miniMapElem = document.getElementById('miniMap');
const pauseBtn = document.getElementById('pauseBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const heartsElem = document.getElementById('hearts');

// ========== CANVAS ========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
canvas.width = W; canvas.height = H;

// ========== SETTINGS =========
let settings = {
  sound: true,
  music: true,
  difficulty: "normal",
  gfx: true
};
let save = {};
function persistSettings() {
  save.sound = settings.sound;
  save.music = settings.music;
  save.difficulty = settings.difficulty;
  save.gfx = settings.gfx;
  localStorage.voidloopSettings = JSON.stringify(save);
}
function loadSettings() {
  try {
    let s = JSON.parse(localStorage.voidloopSettings);
    if (s && typeof s === "object") {
      settings = { ...settings, ...s };
    }
  } catch (e) {}
}
loadLocal();
loadSettings();
soundToggle.checked = settings.sound;
musicToggle.checked = settings.music;
difficultySelect.value = settings.difficulty;
gfxToggle.checked = settings.gfx;
soundToggle.onchange = () => { settings.sound = soundToggle.checked; persistSettings(); };
musicToggle.onchange = () => { settings.music = musicToggle.checked; settings.music?startMusic():stopMusic(); persistSettings(); };
difficultySelect.onchange = () => { settings.difficulty = difficultySelect.value; persistSettings(); };
gfxToggle.onchange = () => { settings.gfx = gfxToggle.checked; persistSettings(); };
settingsBtn.onclick = () => { settingsPanel.style.display = ''; };
closeSettingsBtn.onclick = () => { settingsPanel.style.display = 'none'; };

// ========== GAME STATE =========
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
let player, bullets, enemies, particles, powerups, stars;
let upgrades, coins, score, best, level, waveTimer, slowmoTimer, shieldTimer, bombCount, timeSurvived, bombCooldown;
let shotsFired = 0, onBeat = false, beatTimer = 0, musicBeat = 0, lastMusicTime = 0;
let frameCounter = 0, lowHpFlash = 0;
let pauseRequested = false, pauseTime = 0, pauseSavedState = null;

// ========== RESET =========
function initUserGameData() {
  score = 0;
  level = 1;
  coins = userData.coins || 0;
  upgrades = {
    weapon: userData.weaponLevel || 1,
    health: userData.hearts || 3,
    upgrades: userData.upgrades || 0
  };
  best = userData.best || 0;
  bombCount = userData.bombs || 1;
}
function resetGame() {
  initUserGameData();
  shotsFired = 0; timeSurvived = 0; bombCooldown = 0;
  player = { x: W/2, y: H*0.8, r: 22, cooldown: 0, hp: upgrades.health, vx: 0, vy: 0, angle: 0, shield: 0, maxHearts: 3 };
  bullets = []; enemies = []; particles = []; powerups = []; stars = [];
  waveTimer = 0; slowmoTimer = 0; shieldTimer = 0;
  miniMapElem.style.display = (window.innerWidth>800) ? '' : 'none';
  spawnStars();
  updateHeartsUI();
}
function spawnStars() {
  stars = [];
  for (let i=0; i<(settings.gfx?120:40); ++i) {
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
  if (!settings.gfx) return;
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

// ========== HEARTS UI ==========
function updateHeartsUI() {
  heartsElem.innerHTML = '';
  let maxH = Math.min(player.maxHearts || 3, 4);
  let h = Math.min(player.hp, maxH);
  for (let i = 0; i < maxH; ++i) {
    let heart = document.createElement('span');
    heart.className = 'heart' + (i >= 3 ? ' bonus' : '');
    if (i >= h) heart.style.filter = 'grayscale(1) brightness(0.4)';
    heartsElem.appendChild(heart);
  }
}

// ========== PAUSE ==========
pauseBtn.onclick = () => {
  if (gameState === 'playing') {
    pauseRequested = true;
  }
};
resumeBtn.onclick = () => {
  if (gameState === 'paused') {
    pauseOverlay.style.display = 'none';
    gameState = 'playing';
    if(settings.music) startMusic();
    requestAnimationFrame(gameLoop);
  }
};

// ========== DRAW MINI-MAP =========
function drawMiniMap() {
  if (window.innerWidth<=800) { miniMapElem.style.display='none'; return; }
  miniMapElem.style.display='';
  let mmW = miniMapElem.offsetWidth, mmH = miniMapElem.offsetHeight;
  let scale = Math.min(mmW/W, mmH/H) * 0.95;
  let px = player.x*scale, py = player.y*scale;
  miniMapElem.innerHTML = ""; // clear
  let mm = document.createElement('canvas');
  mm.width = mmW; mm.height = mmH;
  let mmctx = mm.getContext('2d');
  mmctx.fillStyle = "#222"; mmctx.fillRect(0,0,mmW,mmH);
  // player
  mmctx.beginPath();
  mmctx.arc(px,py,6,0,2*Math.PI);
  mmctx.fillStyle = "#0ff"; mmctx.fill();
  // enemies
  for (let e of enemies) {
    let ex = e.x*scale, ey = e.y*scale;
    mmctx.beginPath();
    mmctx.arc(ex,ey,4,0,2*Math.PI);
    mmctx.fillStyle = "#f0f"; mmctx.fill();
  }
  // powerups
  for (let p of powerups) {
    let pxp = p.x*scale, pyp = p.y*scale;
    mmctx.beginPath();
    mmctx.arc(pxp,pyp,3,0,2*Math.PI);
    mmctx.fillStyle = "#ff0"; mmctx.fill();
  }
  miniMapElem.appendChild(mm);
}

// ========== DRAW PLAYER =========
function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.shadowColor = '#0ff'; ctx.shadowBlur = 25 + (p.shield?22:0);
  ctx.strokeStyle = p.shield ? '#fff' : '#0ff';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, -p.r);
  for (let i=1; i<=3; ++i)
    ctx.lineTo(Math.sin(i*2*Math.PI/3)*p.r, -Math.cos(i*2*Math.PI/3)*p.r);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.save(); ctx.rotate(Math.PI);
  ctx.beginPath();
  ctx.moveTo(0, p.r*0.85);
  ctx.lineTo(-7, p.r*1.25 + Math.random()*7);
  ctx.lineTo(7, p.r*1.25 + Math.random()*7);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,255,255,0.7)';
  ctx.fill();
  ctx.restore();
  if (p.shield && settings.gfx) {
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

// ========== ENEMY TYPES =========
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
  let diffMult = settings.difficulty==="easy"?0.7:settings.difficulty==="hard"?1.35:1;
  let baseSpeed = (1.6 + (level*0.3)) * diffMult;
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

// ========== POWERUPS =========
function spawnPowerup(x, y) {
  let t = Math.random();
  let type = 'coin';
  if (t < 0.45) type = 'coin';
  else if (t < 0.7) type = 'shield';
  else if (t < 0.85) type = 'slowmo';
  else if (t < 0.97) type = 'double';
  else type = 'bonusHeart';
  powerups.push({x, y, r: 15, type, life: 320});
}
function drawPowerup(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.93 + 0.07*Math.sin(Date.now()/140+p.x);
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0,0,10,0,2*Math.PI);
  ctx.stroke();
  ctx.font = '13px VT323, monospace';
  if (p.type === 'coin') { ctx.fillStyle = '#ff0'; ctx.fillText('C', -5, 5);}
  else if (p.type === 'shield') { ctx.fillStyle = '#0ff'; ctx.fillText('S', -6, 5);}
  else if (p.type === 'slowmo') { ctx.fillStyle = '#fff'; ctx.fillText('⏳', -7, 6);}
  else if (p.type === 'double') { ctx.fillStyle = '#f0f'; ctx.fillText('2x', -10, 6);}
  else if (p.type === 'bonusHeart') { ctx.fillStyle = '#f44'; ctx.fillText('❤️', -10, 7);}
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ========== INPUT =========
let mouseX = W/2, mouseY = H/2, lastTouchX = null, lastTouchY = null;
canvas.addEventListener('mousemove', e=>{
  mouseX = e.clientX; mouseY = e.clientY;
});
canvas.addEventListener('touchstart', e=>{
  if (e.touches.length) {
    let t = e.touches[0];
    mouseX = t.clientX; mouseY = t.clientY; lastTouchX = mouseX; lastTouchY = mouseY;
    if (gameState === 'playing' && player.cooldown <= 0) shoot();
  }
}, {passive: false});
canvas.addEventListener('touchmove', e=>{
  if (e.touches.length) {
    let t = e.touches[0];
    mouseX = t.clientX; mouseY = t.clientY; lastTouchX = mouseX; lastTouchY = mouseY;
  }
});
canvas.addEventListener('mousedown', e=>{
  if (gameState === 'playing' && player.cooldown <= 0) shoot();
});
window.addEventListener('resize', ()=>{
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
  stars = []; spawnStars();
  miniMapElem.style.display = (window.innerWidth>800) ? '' : 'none';
});

// ========== BUTTONS =========
document.getElementById('startBtn').onclick = ()=>{
  userData.runs = (userData.runs || 0) + 1;
  resetGame();
  gameState = 'playing';
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('upgradePanel').style.display = '';
  statsPanel.style.display = 'none';
  bombBtn.style.display = '';
  bombCountElem.innerText = bombCount;
  pauseBtn.style.display = '';
  if(settings.music) startMusic();
};
document.getElementById('upgradeBtn').onclick = ()=>{
  if(coins >= 14 && upgrades.weapon < 10 && upgrades.upgrades < 10) {
    coins -= 14; upgrades.weapon++; upgrades.upgrades++;
    userData.weaponLevel = upgrades.weapon;
    userData.upgrades = upgrades.upgrades;
    userData.coins = coins;
    saveLocal();
    playSound('upgrade');
  }
};
document.getElementById('healBtn').onclick = ()=>{
  let maxHearts = player.maxHearts || 3;
  if(coins >= 12 && player.hp < maxHearts) {
    coins -= 12; player.hp++; updateHeartsUI();
    userData.coins = coins;
    saveLocal();
    playSound('upgrade');
  }
};
document.getElementById('shieldBtn').onclick = ()=>{
  if(coins >= 18 && !player.shield) {
    coins -= 18; player.shield = 220; shieldTimer = 220;
    userData.coins = coins;
    saveLocal();
    playSound('powerup');
  }
};
document.getElementById('slowmoBtn').onclick = ()=>{
  if(coins >= 20 && slowmoTimer <= 0) {
    coins -= 20; slowmoTimer = 320; userData.coins = coins;
    saveLocal();
    playSound('powerup');
  }
};
document.getElementById('resetStatsBtn').onclick = ()=>{
  if(confirm('Reset all stats and upgrades?')) {
    localStorage.removeItem(saveKey);
    localStorage.removeItem("voidloopSettings");
    location.reload();
  }
};
bombBtn.onclick = ()=>{
  if(bombCount>0 && bombCooldown<=0 && gameState==='playing'){
    bombCount--;
    bombCooldown = 120;
    enemies.forEach(e=>{spawnParticles(e.x,e.y,e.color);});
    enemies = [];
    playSound('explode'); playSound('explode');
    bombCountElem.innerText = bombCount;
  }
};

// ========== SHOOTING & BULLET SYNTH =========
function shoot() {
  let now = performance.now();
  let beatWindow = Math.abs((now-lastMusicTime)%musicBeat - musicBeat/2) < musicBeat/6; // on beat?
  onBeat = beatWindow;
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
  for(let i=0; i<upgrades.weapon; ++i) {
    let spread = (i - (upgrades.weapon-1)/2) * 0.12;
    bullets.push({
      x: player.x + Math.cos(angle+spread)*player.r,
      y: player.y + Math.sin(angle+spread)*player.r,
      dx: Math.cos(angle+spread)*14 * (slowmoTimer>0?0.5:1),
      dy: Math.sin(angle+spread)*14 * (slowmoTimer>0?0.5:1),
      r: 8, life: 0, trail: [], synth: onBeat?2:1
    });
  }
  player.cooldown = slowmoTimer>0 ? 6 : 10;
  shotsFired++;
  playSound('shoot');
  if(onBeat) playSound('upgrade');
}

// ========== MUSIC (Procedural Beat Loop) =========
let musicOsc, musicGain, musicRunning = false;
function startMusic() {
  if(musicRunning) return;
  musicRunning = true;
  musicOsc = audioCtx.createOscillator();
  musicGain = audioCtx.createGain();
  musicOsc.connect(musicGain); musicGain.connect(audioCtx.destination);
  musicOsc.type = 'triangle';
  musicOsc.frequency.value = 60;
  musicGain.gain.value = 0.07;
  musicOsc.start();
  musicBeat = 650; // ms per beat
  let musicStep = 0;
  function nextBeat() {
    if(!musicRunning) return;
    lastMusicTime = performance.now();
    musicOsc.frequency.value = (musicStep%4==0)?90:(musicStep%2==0?60:120);
    playSound('powerup');
    musicStep++;
    setTimeout(nextBeat,musicBeat);
  }
  nextBeat();
}
function stopMusic() {
  if(!musicRunning) return;
  musicRunning=false;
  try { musicOsc.stop(); } catch(e){}
  musicOsc=null;
}

// ========== GAME LOOP =========
function dist(a, b) { let dx = a.x-b.x, dy = a.y-b.y; return Math.sqrt(dx*dx+dy*dy);}
function gameLoop() {
  if (pauseRequested && gameState==='playing') {
    gameState = 'paused';
    pauseOverlay.style.display = '';
    stopMusic();
    pauseRequested = false;
    return;
  }
  if (gameState === 'paused') return;

  frameCounter++;
  ctx.clearRect(0,0,W,H);
  drawStars();

  // Low HP warning FX
  if(player && player.hp!==undefined && player.hp<=1) { lowHpFlash=(lowHpFlash+1)%30; if(lowHpFlash<10&&settings.gfx) {ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle="#f44";ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.restore();} }

  if (gameState === 'playing') {
    timeSurvived += 1/60;
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
    if (bombCooldown>0) bombCooldown--;

    drawPlayer(player);

    // Bullets
    for (let b of bullets) {
      b.trail.push({x: b.x, y: b.y});
      if (b.trail.length > (settings.gfx?8:2)) b.trail.shift();
      b.x += b.dx; b.y += b.dy; b.life++;
      if (settings.gfx) {
        ctx.save();
        for (let i=0; i<b.trail.length-1; ++i) {
          ctx.strokeStyle = b.synth==2?`rgba(255,0,255,${0.06+0.12*i})`:`rgba(0,255,255,${0.06+0.12*i})`;
          ctx.lineWidth = 4-i*0.35;
          ctx.beginPath();
          ctx.moveTo(b.trail[i].x, b.trail[i].y);
          ctx.lineTo(b.trail[i+1].x, b.trail[i+1].y);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
      ctx.fillStyle = b.synth==2 ? '#f0f' : '#fff';
      if (settings.gfx) {
        ctx.shadowColor = b.synth==2?'#f0f':'#0ff';
        ctx.shadowBlur = 16;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    bullets = bullets.filter(b=>b.x>-30&&b.x<W+30&&b.y>-30&&b.y<H+30&&b.life<60);

    // Powerups
    for (let p of powerups) drawPowerup(p);
    for (let p of powerups) {
      if (dist(player, p) < player.r+p.r) {
        if (p.type==='coin') { coins+=2+Math.floor(level/2); userData.coins = coins; saveLocal();}
        if (p.type==='shield') { player.shield=260; shieldTimer=260; playSound('powerup');}
        if (p.type==='slowmo') { slowmoTimer=260; playSound('powerup');}
        if (p.type==='double' && upgrades.weapon < 10 && upgrades.upgrades < 10) {
          upgrades.weapon++; upgrades.upgrades++; userData.weaponLevel = upgrades.weapon; userData.upgrades = upgrades.upgrades; saveLocal(); playSound('upgrade');
        }
        if (p.type==='bonusHeart') {
          if (player.maxHearts < 4) player.maxHearts = 4;
          if (player.hp < player.maxHearts) player.hp++;
          updateHeartsUI();
        }
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
          let damage = b.synth||1;
          e.hp -= damage; b.life = 9999; e.hitFlash = 7;
          spawnParticles(e.x, e.y, e.color);
          playSound('hit');
          if (e.hp <= 0) {
            score += 8+level*2;
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
          player.hp--;
          updateHeartsUI();
          spawnParticles(player.x, player.y, '#f44');
          playSound('hurt');
          e.x = -999;
          if (player.hp <= 0) {
            if(score > best) { best = score; userData.best = best; saveLocal();}
            userData.coins = coins;
            userData.hearts = player.hp;
            showGameOver();
          }
        }
      }
    }
    enemies = enemies.filter(e=>e.x > -500);

    // Particles
    if (settings.gfx) {
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
    }
    particles = particles.filter(p=>p.life>0);

    // Spawn logic (waves)
    waveTimer--;
    let spawnRate = 120+Math.max(0,180-level*5);
    if (settings.difficulty==="easy") spawnRate*=1.3;
    else if (settings.difficulty==="hard") spawnRate*=0.7;
    if (waveTimer<=0) { waveTimer=spawnRate; spawnEnemy(); }
    if (score/20+1 > level && score>0) level++;

    // UI
    scoreElem.innerText = `Score: ${score}`;
    coinsElem.innerText = `Coins: ${coins}`;
    levelElem.innerText = `Level: ${level}`;
    bestElem.innerText = `Best: ${best}`;
    document.getElementById('upgradePanel').style.display = '';
    bombBtn.style.display = '';
    bombCountElem.innerText = bombCount;
    if(bombCooldown>0) bombBtn.setAttribute('disabled','disabled'); else bombBtn.removeAttribute('disabled');
    drawMiniMap();
  }

  if (gameState === 'menu') {
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 60px Press Start 2P, Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOID LOOP', W/2, H/2-80);
    ctx.font = '26px VT323, Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press PLAY to start!', W/2, H/2-30);
    ctx.font = '18px VT323, Courier New, monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Best: ${userData.best || 0}   Coins: ${userData.coins || 0}`, W/2, H/2+10);
    ctx.font = '16px VT323, Courier New, monospace';
    ctx.fillStyle = '#fff9';
    ctx.fillText('Controls: Tap/drag or move mouse to steer | Tap/click to shoot', W/2, H/2+46);
    statsPanel.style.display = '';
    bombBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    drawMiniMap();
    stopMusic();
    // Stats UI
    statRunsElem.innerText = `Runs: ${userData.runs || 0}`;
  }
  if (gameState === 'gameover') {
    // already handled in showGameOver()
    bombBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    stopMusic();
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
  ctx.fillText(`Coins: ${coins}   Best: ${userData.best || 0}`, W/2, H/2+64);
  ctx.fillStyle = '#fff9';
  ctx.fillText('Click PLAY to try again!', W/2, H/2+86);
  ctx.restore();
  document.getElementById('startBtn').style.display = '';
  document.getElementById('upgradePanel').style.display = 'none';
  statsPanel.style.display = '';
  bombBtn.style.display = 'none';
  pauseBtn.style.display = 'none';
  drawMiniMap();
}

// ========== PARTICLES =========
function spawnParticles(x, y, c) {
  for(let i=0; i<(settings.gfx?16:5); ++i) {
    let a = Math.random()*2*Math.PI;
    let s = Math.random()*(settings.gfx?5:2)+1.5;
    particles.push({
      x, y, dx: Math.cos(a)*s, dy: Math.sin(a)*s,
      r: Math.random()*(settings.gfx?2.6:1.2)+2.2, c, life: 24+Math.random()*8
    });
  }
}

// ========== SOUND =========
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (!settings.sound) return;
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

// ========== LAUNCH =========
gameState = 'menu';
requestAnimationFrame(gameLoop);
