const title = document.getElementById("title");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const msg = document.getElementById("msg");
const startBtn = document.getElementById("start");

const field = document.getElementById("field");
const target = document.getElementById("target");

const quiz = document.getElementById("quiz");
const goalEl = document.getElementById("goal");
const left = document.getElementById("left");
const right = document.getElementById("right");

const LETTERS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
const SYLLABLES = [
  "ла", "ло", "лу", "лы", "ма", "мо", "му", "мы",
  "на", "но", "ну", "ны", "ня", "нё", "ню", "ни",
  "па", "по", "пу", "та", "то", "ту",
  "да", "до", "ду", "ка", "ко", "ку",
  "га", "го", "гу", "ва", "во", "ву",
  "ра", "ро", "ру", "са", "со", "су",
  "за", "зо", "зу", "жа", "жо", "жу",
  "ча", "чо", "чу", "ша", "шо", "шу",
  "фа", "фо", "фу", "ха", "хо", "ху"
];

const GOAL = 10;   // правильных ответов для перехода
const TIME = 30;   // секунд на уровень

let level = 1;
let score = 0;
let timeLeft = TIME;
let timer = null;
let currentLetter = "";
let goal = "";

function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ru-RU";
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

function randomFrom(list, except = "") {
  let item;
  do { item = list[Math.floor(Math.random() * list.length)]; }
  while (item === except);
  return item;
}

function startGame() {
  startBtn.disabled = true;
  showLevel(1);
}

// включает уровень: показывает нужную зону и запускает таймер
function showLevel(l) {
  level = l;
  score = 0;
  timeLeft = TIME;
  scoreEl.textContent = "0";
  timeEl.textContent = timeLeft;
  msg.textContent = "";

  if (level === 1) {
    title.textContent = "🎯 Поймай букву";
    quiz.style.display = "none";
    field.style.display = "block";
    placeTarget();
  } else {
    title.textContent = "🔎 Найди слог";
    field.style.display = "none";
    quiz.style.display = "block";
    newQuiz();
  }

  clearInterval(timer);
  timer = setInterval(tick, 1000);
}

function tick() {
  timeLeft--;
  timeEl.textContent = timeLeft;
  if (timeLeft <= 0) levelEnd();
}

// уровень закончился по времени: прошёл или повтор
function levelEnd() {
  clearInterval(timer);
  field.style.display = "none";
  quiz.style.display = "none";
  target.style.display = "none";
  startBtn.disabled = false;

  if (score >= GOAL) {
    if (level === 1) {
      msg.textContent = "Уровень 1 пройден! Теперь слоги 🎉 Нажми «Начать игру»";
      say("Молодец! Теперь слоги");
    } else {
      msg.textContent = "Ты прошёл все уровни! Ты большой молодец! 🏆 Нажми «Начать игру», чтобы сыграть снова";
      say("Ты прошёл все уровни! Молодец!");
    }
  } else {
    msg.textContent = `Правильных ответов: ${score} из ${GOAL}. Попробуй этот уровень ещё раз!`;
    say("Попробуй ещё раз");
  }
}

// ===== Уровень 1: поймай букву =====

function placeTarget() {
  currentLetter = randomFrom(LETTERS);
  target.textContent = currentLetter;

  const x = Math.random() * (field.clientWidth - 70);
  const y = Math.random() * (field.clientHeight - 70);
  target.style.left = x + "px";
  target.style.top = y + "px";
  target.style.display = "flex";
}

target.addEventListener("click", () => {
  if (level !== 1) return;

  score++;
  scoreEl.textContent = score;
  say(currentLetter);

  if (score >= GOAL) {           // набрал 10 — сразу на слоги
    clearInterval(timer);
    showLevel(2);
    msg.textContent = "Уровень 1 пройден! Теперь слоги 🎉";
    return;
  }

  placeTarget();
});

// ===== Уровень 2: найди слог =====

function newQuiz() {
  goal = randomFrom(SYLLABLES);
  goalEl.textContent = goal;
  say("Найди " + goal);

  const other = randomFrom(SYLLABLES, goal);
  if (Math.random() < 0.5) {
    left.textContent = goal;
    right.textContent = other;
  } else {
    left.textContent = other;
    right.textContent = goal;
  }
  left.disabled = false;
  right.disabled = false;
}

function pick(btn) {
  if (level !== 2) return;

  if (btn.textContent === goal) {
    score++;
    scoreEl.textContent = score;
    say(goal);

    if (score >= GOAL) {         // победа — уровень завершён досрочно
      clearInterval(timer);
      quiz.style.display = "none";
      startBtn.disabled = false;
      msg.textContent = "Ты прошёл все уровни! Ты большой молодец! 🏆 Нажми «Начать игру», чтобы сыграть снова";
      say("Ты прошёл все уровни! Молодец!");
      return;
    }
    newQuiz();
  } else {
    say("мимо!");
    btn.classList.remove("shake");
    void btn.offsetWidth;
    btn.classList.add("shake");
    newQuiz();
  }
}

left.addEventListener("click", () => pick(left));
right.addEventListener("click", () => pick(right));
startBtn.addEventListener("click", startGame);
