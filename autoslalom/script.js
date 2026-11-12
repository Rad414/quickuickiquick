const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const bestEl = document.getElementById("best");
const msgEl = document.getElementById("msg");
const playBtn = document.getElementById("play");

const L = 60, R = W - 60;
const CAR_W = 34, CAR_H = 56;

let state = "menu";
let keys = {};
let score, best, speed, dist, car, obstacles, laneTimer;

best = Number(localStorage.getItem("autoslalom-best") || 0);
bestEl.textContent = best;

let audioCtx = null;
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

// только встречные машины, на случайной полосе
function spawnCar() {
  const x = L + 16 + Math.floor(Math.random() * 4) * 66;
  obstacles.push({ x, y: -90, w: 44, h: 76, vy: speed * 0.2 });
}

function reset() {
  score = 0;
  speed = 80;                 // старт медленнее
  dist = 0;
  car = { x: W / 2 - CAR_W / 2 };
  obstacles = [];
  laneTimer = 70;             // первая машина не сразу
  msgEl.textContent = "";
  playBtn.style.display = "none";
  state = "playing";
}

function crash() {
  state = "over";
  beep(120, 0.4, "triangle");
  if (score > best) {
    best = score;
    localStorage.setItem("autoslalom-best", best);
    bestEl.textContent = best;
    msgEl.textContent = `Авария! Новый рекорд: ${score} 🏆`;
  } else {
    msgEl.textContent = `Авария! Очки: ${score}. Нажми «Играть»`;
  }
  playBtn.style.display = "inline-block";
}

function update() {
  dist++;
  speed = 80 + Math.floor(dist / 200) * 5;   // растёт очень плавно
  score = Math.floor(dist / 10);

  if (keys["ArrowLeft"] || keys["a"] || keys["ф"]) car.x -= 4;
  if (keys["ArrowRight"] || keys["d"] || keys["в"]) car.x += 4;
  car.x = Math.max(L + 2, Math.min(R - CAR_W - 2, car.x));

  if (--laneTimer <= 0) {
    spawnCar();
    laneTimer = 55;                          // реже, чем было
  }

  for (const o of obstacles) o.y += o.vy;
  obstacles = obstacles.filter(o => o.y < H + 90);

  for (const o of obstacles) {
    if (car.x < o.x + o.w && car.x + CAR_W > o.x &&
        H - 90 < o.y + o.h && H - 90 + CAR_H > o.y) {
      crash();
      return;
    }
  }
}

function draw() {
  ctx.fillStyle = "#3c4656";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#4f7a4f";
  ctx.fillRect(0, 0, L, H);
  ctx.fillRect(R, 0, W - R, H);

  ctx.fillStyle = "#fff";
  const offset = dist % 40;
  for (let i = -1; i < 5; i++) {
    for (let lane = 0; lane < 5; lane++) {
      const x = L + 40 + lane * 66;
      ctx.fillRect(x - 2, i * 40 + offset, 4, 22);
    }
  }
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(L - 4, 0, 4, H);
  ctx.fillRect(R, 0, 4, H);

  if (state === "menu" || state === "over") {
    ctx.fillStyle = state === "menu" ? "#ffd166" : "#ef476f";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state === "menu" ? "Автослалом" : "Авария!", W / 2, H / 2 - 30);
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText(state === "menu" ? "Управляй стрелками ◀ ▶" : `Очки: ${score}`, W / 2, H / 2 + 8);
    ctx.fillText("Нажми «Играть»", W / 2, H / 2 + 40);
  }

  if (state !== "menu") {
    for (const o of obstacles) {
      ctx.fillStyle = "#ef476f";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#9db4d8";
      ctx.fillRect(o.x + 6, o.y + 14, o.w - 12, 24);
      ctx.fillStyle = "#333";
      ctx.fillRect(o.x - 3, o.y + o.h - 14, 9, 14);
      ctx.fillRect(o.x + o.w - 6, o.y + o.h - 14, 9, 14);
    }

    ctx.fillStyle = "#4de3ff";
    ctx.fillRect(car.x, H - 90, CAR_W, CAR_H);
    ctx.fillStyle = "#2d4a6d";
    ctx.fillRect(car.x + 5, H - 78, CAR_W - 10, 20);
    ctx.fillStyle = "#111";
    ctx.fillRect(car.x - 3, H - 92, 8, 14);
    ctx.fillRect(car.x + CAR_W - 5, H - 92, 8, 14);
    ctx.fillRect(car.x - 3, H - 38, 8, 14);
    ctx.fillRect(car.x + CAR_W - 5, H - 38, 8, 14);
  }
}

function loop() {
  if (state === "playing") update();
  draw();
  requestAnimationFrame(loop);
}

addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
});
addEventListener("keyup", e => { keys[e.key] = false; });

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

playBtn.addEventListener("click", reset);
loop();
