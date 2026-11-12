const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const bestEl = document.getElementById("best");
const msgEl = document.getElementById("msg");
const playBtn = document.getElementById("play");

// дорога: от L до R, обочины по бокам
const L = 60, R = W - 60;
const CAR_W = 34, CAR_H = 56;

let state = "menu";
let keys = {};
let score, best, speed, dist, car, obstacles, laneTimer, bestSaved;

best = Number(localStorage.getItem("autoslalom-best") || 0);
bestEl.textContent = best;

// ── звук ──
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

// ── препятствия: встречные машины (1), ямы (2), конусы (3) ──
function spawnObstacle() {
  const roll = Math.random();
  if (roll < 0.5) {
    // встречная машина — занимает полосу, едет вниз навстречу
    const x = L + 20 + Math.floor(Math.random() * 4) * 66; // 4 полосы
    obstacles.push({ type: 1, x, y: -70, w: 40, h: 70, vy: speed * 0.55 });
  } else if (roll < 0.8) {
    obstacles.push({ type: 2, x: L + 20 + Math.random() * (R - L - 60), y: -40, w: 30, h: 26, vy: speed * 0.35 });
  } else {
    obstacles.push({ type: 3, x: L + 20 + Math.random() * (R - L - 60), y: -40, w: 18, h: 18, vy: speed * 0.35 });
  }
}

function reset() {
  score = 0;
  speed = 100;
  dist = 0;
  car = { x: W / 2 - CAR_W / 2 };
  obstacles = [];
  laneTimer = 40;
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
    msgEl.textContent = `Авария! Новы рекорд: ${score} 🏆`;
  } else {
    msgEl.textContent = `Авария! Очки: ${score}. Нажми «Играть»`;
  }
  playBtn.style.display = "inline-block";
}

function update() {
  dist++;
  // скорость и очки растут со временем
  speed = 100 + Math.floor(dist / 120) * 10;
  score = Math.floor(dist / 10);

  // управление
  if (keys["ArrowLeft"] || keys["a"] || keys["ф"]) car.x -= 4.5;
  if (keys["ArrowRight"] || keys["d"] || keys["в"]) car.x += 4.5;
  car.x = Math.max(L + 2, Math.min(R - CAR_W - 2, car.x));

  // появление препятствий — тем чаще, чем выше скорость
  if (--laneTimer <= 0) {
    spawnObstacle();
    laneTimer = Math.max(14, 42 - Math.floor(speed / 30));
  }

  // движение препятствий
  for (const o of obstacles) o.y += o.vy;
  obstacles = obstacles.filter(o => o.y < H + 80);

  // столкновения
  for (const o of obstacles) {
    if (car.x < o.x + o.w && car.x + CAR_W > o.x &&
        H - 90 < o.y + o.h && H - 90 + CAR_H > o.y) {
      crash();
      return;
    }
  }
}

function draw() {
  // асфальт и обочины
  ctx.fillStyle = "#3c4656";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#4f7a4f";          // трава
  ctx.fillRect(0, 0, L, H);
  ctx.fillRect(R, 0, W - R, H);

  // движущаяся разметка
  ctx.fillStyle = "#fff";
  const offset = dist % 40;
  for (let i = -1; i < 5; i++) {
    for (let lane = 0; lane < 5; lane++) {
      const x = L + 40 + lane * 66;
      ctx.fillRect(x - 2, (i * 40 + offset), 4, 22);
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
    // препятствия
    for (const o of obstacles) {
      if (o.type === 1) {
        // встречная машина
        ctx.fillStyle = "#ef476f";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "#9db4d8";
        ctx.fillRect(o.x + 5, o.y + 10, o.w - 10, 18);
        ctx.fillStyle = "#333";
        ctx.fillRect(o.x - 2, o.y + o.h - 12, 8, 12);
        ctx.fillRect(o.x + o.w - 6, o.y + o.h - 12, 8, 12);
      } else if (o.type === 2) {
        // яма
        ctx.fillStyle = "#1c2230";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // конус
        ctx.fillStyle = "#ff8c42";
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(o.x + 4, o.y + 8, o.w - 8, 4);
      }
    }

    // машина игрока
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
