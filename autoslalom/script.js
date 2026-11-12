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
   
