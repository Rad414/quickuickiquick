const field = document.getElementById("field");
const target = document.getElementById("target");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start");

const COLORS = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#a78bfa", "#ff8fa3"];
const LETTERS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
let colorIndex = 0;

let score = 0;
let timeLeft = 30;
let timer = null;
let currentLetter = "";

// озвучка
function say(text) {
  if (!("speechSynthesis" in window)) return; // если браузер не умеет — просто пропускаем
  speechSynthesis.cancel(); // прерываем предыдущее произношение, чтобы не копились в очередь
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function nextColor() {
  colorIndex = (colorIndex + 1) % COLORS.length;
  return COLORS[colorIndex];
}

function placeTarget() {
  currentLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  target.textContent = currentLetter;

  const x = Math.random() * (field.clientWidth - 70);
  const y = Math.random() * (field.clientHeight - 70);
  target.style.left = x + "px";
  target.style.top = y + "px";
  target.style.display = "flex";
}

function endGame() {
  clearInterval(timer);
  target.style.display = "none";
  startBtn.disabled = false;
  alert(`Время вышло! Ваш счёт: ${score} 🎉`);
}

function startGame() {
  score = 0;
  timeLeft = 30;
  scoreEl.textContent = 0;
  timeEl.textContent = timeLeft;
  startBtn.disabled = true;
  placeTarget();

  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

target.addEventListener("click", () => {
  score++;
  scoreEl.textContent = score;

  say(currentLetter);                 // озвучиваем пойманную букву

  const color = nextColor();
  field.style.background = color;
  target.style.background = "#fff";

  placeTarget();
});

startBtn.addEventListener("click", startGame);
