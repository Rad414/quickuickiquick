const field = document.getElementById("field");
const target = document.getElementById("target");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start");
const hint = document.getElementById("hint");

const COLORS = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#a78bfa", "#ff8fa3"];
const LETTERS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
let colorIndex = 0;

let score = 0;
let timeLeft = 30;
let timer = null;
let currentLetter = "";
let goalLetter = "";   // нужная буква в режиме «Лови букву»
let mode = "free";

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

// озвучка
function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function nextColor() {
  colorIndex = (colorIndex + 1) % COLORS.length;
  return COLORS[colorIndex];
}

function pickLetter() {
  // в режиме «лови букву» нужная буква должна попадаться почаще
  if (mode === "target" && Math.random() < 0.5) return goalLetter;
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function placeTarget() {
  currentLetter = pickLetter();
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
  hint.style.display = "none";
  startBtn.disabled = false;
  const note = mode === "target" ? ` Нужная буква: «${goalLetter}».` : "";
  alert(`Время вышло! Ваш счёт: ${score} 🎉${note}`);
}

function startGame() {
  mode = getMode();
  score = 0;
  timeLeft = 30;
  scoreEl.textContent = 0;
  timeEl.textContent = timeLeft;
  startBtn.disabled = true;

  if (mode === "target") {
    goalLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    hint.textContent = `Лови: ${goalLetter}`;
    hint.style.display = "block";
    say(goalLetter); // озвучиваем задание — удобно для детей, которые не читают
  }

  placeTarget();

  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

target.addEventListener("click", () => {
  const isHit = mode === "free" || currentLetter === goalLetter;

  if (isHit) {
    score++;
    scoreEl.textContent = score;
    say(currentLetter);

    const color = nextColor();
    field.style.background = color;
    target.style.background = "#fff";
  } else {
    say("мимо!"); // промах по не той букве — очки не начисляются
  }

  placeTarget();
});

startBtn.addEventListener("click", startGame);
