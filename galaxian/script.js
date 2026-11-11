const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const livesEl = document.getElementById("lives");
const msgEl = document.getElementById("msg");
const playBtn = document.getElementById("play");

const ROW_COLORS = ["#ef476f", "#ffd166", "#06d6a0", "#4a90d9"];
const COLS = 6, ROWS = 4;
const SPACING_X = 64, SPACING_Y = 50;
const FORM_TOP = 70;

let player, pBullets, eBullets, enemies, score, lives, wave;
let state = "menu";        // menu | playing | over
let keys = {};
let time = 0;
let diveCooldown = 60;

// звёзды на фоне
const stars = Array.from({ length: 60 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  s: Math.random() * 1.6 + 0.4
}));

function beep(freq, dur = 0.08, type = "square", vol = 0.12) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
let audioCtx = null;

function makeEnemies() {
  const list = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      list.push({
        homeX: W / 2 + (c - (COLS - 1) / 2) * SPACING_X,
        homeY: FORM_TOP + r * SPACING_Y,
        x: 0, y: 0,
        color: ROW_COLORS[r],
        points: (ROWS - r) * 10,
        diving: false,
        phase: Math.random() * Math.PI * 2,
        speed: 1.7 + wave * 0.3,
        alive: true
      });
    }
  }
  return list;
}

function reset() {
  player = { x: W / 2, y: H - 50, cooldown: 0 };
  pBullets = [];
  eBullets = [];
  score = 0;
  lives = 3;
  wave = 1;
  enemies = makeEnemies();
  diveCooldown = 60;
  msgEl.textContent = "";
  playBtn.style.display = "none";
  state = "playing";
}

function loseLife() {
  lives--;
  beep(160, 0.3, "triangle");
  player.x = W / 2;
  if (lives <= 0) {
    state = "over";
    playBtn.style.display = "inline-block";
    msgEl.textContent = `Игра окончена! Очки: ${score}`;
    beep(90, 0.5, "triangle");
  }
}

function update() {
  time++;

  // игрок
  if (keys["ArrowLeft"] || keys["a"] || keys["ф"]) player.x -= 4.5;
  if (keys["ArrowRight"] || keys["d"] || keys["в"]) player.x += 4.5;
  player.x = Math.max(22, Math.min(W - 22, player.x));

  if (player.cooldown <= 0 && pBullets.length < 2) { // как в оригинале: максимум 2 пули
      pBullets.push({ x: player.x, y: player.y - 16 });
      player.cooldown = 16;
      beep(880, 0.06);
  }
  player.cooldown--;

  pBullets = pBullets.filter(b => (b.y -= 8) > -10);

  // покачивание формации
  const sway = Math.sin(time * 0.02) * 34;

  for (const e of enemies) {
    if (!e.alive) continue;
    if (!e.diving) {
      e.x = e.homeX + sway;
      e.y = e.homeY;
    } else {
      e.y += e.speed;
      e.x += Math.sin(time * 0.08 + e.phase) * 2.4;
      e.x += Math.sign(player.x - e.x) * 0.4;   // слегка охотится
      if (Math.random() < 0.02) {
        eBullets.push({ x: e.x, y: e.y + 12, vy: 3 + wave * 0.3 });
        beep(220, 0.05, "sawtooth", 0.07);
      }
      if (e.y > H + 20) e.diving = false;        // улетел — вернулся в строй
    }
  }

  // запуск пикирования
  if (--diveCooldown <= 0) {
    const inForm = enemies.filter(e => e.alive && !e.diving);
    if (inForm.length) inForm[Math.floor(Math.random() * inForm.length)].diving = true;
    diveCooldown = Math.max(30, 110 - wave * 12);
  }

  eBullets = eBullets.filter(b => (b.y += b.vy) < H + 10);

  // попадания игрока по врагам
  for (const b of pBullets) {
    for (const e of enemies) {
      if (e.alive && Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 16) {
        e.alive = false;
        b.dead = true;
        score += e.points;
        beep(120, 0.15, "sawtooth");
        break;
      }
    }
  }
  pBullets = pBullets.filter(b => !b.dead);

  // вражеские пули и пикировщики против игрока
  for (const b of eBullets) {
    if (Math.abs(b.x - player.x) < 18 && Math.abs(b.y - player.y) < 16) {
      b.y = H + 100;
      loseLife();
    }
  }
  for (const e of enemies) {
    if (e.alive && e.diving && Math.abs(e.x - player.x) < 26 && Math.abs(e.y - player.y) < 22) {
      loseLife();
    }
  }
  eBullets = eBullets.filter(b => b.y < H + 10);

  // волна очищена — новая, чуть быстрее
  if (enemies.every(e => !e.alive)) {
    wave++;
    enemies = makeEnemies();
    eBullets = [];
    msgEl.textContent = `Волна ${wave}! Враги стали быстрее`;
    beep(660, 0.2);
  }
}

function draw() {
  // фон и звёзды
  ctx.fillStyle = "#0b1030";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  for (const st of stars) {
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.03 + st.x));
    ctx.fillRect(st.x, st.y, st.s, st.s);
  }
  ctx.globalAlpha = 1;

  if (state === "menu") {
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Галактика", W / 2, H / 2 - 20);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#9db4d8";
    ctx.fillText("Нажми «Играть»", W / 2, H / 2 + 20);
    return;
  }

  if (state === "over") {
    ctx.fillStyle = "#ef476f";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Игра окончена", W / 2, H / 2 - 20);
    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Очки: ${score}`, W / 2, H / 2 + 16);
    return;
  }

  // враги
  for (const e of enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // крылья
    ctx.beginPath();
    ctx.moveTo(e.x - 18, e.y + 2);
    ctx.lineTo(e.x - 26, e.y + 10);
    ctx.lineTo(e.x - 12, e.y + 8);
    ctx.moveTo(e.x + 18, e.y + 2);
    ctx.lineTo(e.x + 26, e.y + 10);
    ctx.lineTo(e.x + 12, e.y + 8);
    ctx.fill();
    // глаза
    ctx.fillStyle = "#fff";
    ctx.fillRect(e.x - 7, e.y - 4, 4, 4);
    ctx.fillRect(e.x + 3, e.y - 4, 4, 4);
  }

  // пули
  ctx.fillStyle = "#fff";
  for (const b of pBullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
  ctx.fillStyle = "#ff8fa3";
  for (const b of eBullets) ctx.fillRect(b.x - 2, b.y, 4, 12);

  // корабль игрока
  ctx.fillStyle = "#4de3ff";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 18);
  ctx.lineTo(player.x - 16, player.y + 14);
  ctx.lineTo(player.x + 16, player.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff6b6b";
  ctx.fillRect(player.x - 4, player.y + 6, 8, 6); // сопло
}

function loop() {
  if (state === "playing") update();
  draw();
  requestAnimationFrame(loop);
}

// управление с клавиатуры
addEventListener("keydown", e => {
  if ([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
  if (state === "menu" || state === "over") { if (e.key === " ") reset(); }
});
addEventListener("keyup", e => { keys[e.key] = false; });

// сенсорные кнопки
function hold(id, key) {
  const btn = document.getElementById(id);
  const on = e => { e.preventDefault(); keys[key] = true; };
  const off = e => { e.preventDefault(); keys[key] = false; };
  btn.addEventListener("pointerdown", on);
  btn.addEventListener("pointerup", off);
  btn.addEventListener("pointerleave", off);
}
hold("t-left", "ArrowLeft");
hold("t-right", "ArrowRight");
hold("t-fire", " ");

playBtn.addEventListener("click", reset);
loop();
