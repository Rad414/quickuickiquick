const startScreen = document.getElementById("start-screen");
const gameArea = document.getElementById("game-area");

const goalEl = document.getElementById("goal");
const left = document.getElementById("left");
const right = document.getElementById("right");
const msg = document.getElementById("msg");
const stopBtn = document.getElementById("stop");

// Наборы
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

let mode = "letters"; // "letters" или "syllables"
let goal = "";

function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function randomFrom(list, except = "") {
  let item;
  do {
    item = list[Math.floor(Math.random() * list.length)];
  } while (item === except);
  return item;
}

function startGame(newMode) {
  mode = newMode;
  startScreen.style.display = "none";
  gameArea.style.display = "flex";
  gameArea.style.flexDirection = "column";
  msg.textContent = "";
  newRound();
}

function newRound() {
  // Выбираем цель
  if (mode === "letters") {
    goal = randomFrom(LETTERS);
  } else {
    goal = randomFrom(SYLLABLES);
  }
  goalEl.textContent = goal;
  say("Найди " + goal);

  // Вторая плашка — гарантированно другая
  const other = randomFrom(mode === "letters" ? LETTERS : SYLLABLES, goal);

  // Случайный порядок
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
  if (btn.textContent === goal) {
    btn.style.background = "#06d6a0";
    say(goal);
    setTimeout(newRound, 500);
  } else {
    say("мимо!");
    btn.classList.remove("shake");
    void btn.offsetWidth; // перезапуск анимации
    btn.classList.add("shake");
    newRound();
  }
}

// Кнопки выбора режима
document.getElementById("btn-letters").addEventListener("click", () => startGame("letters"));
document.getElementById("btn-syllables").addEventListener("click", () => startGame("syllables"));

// Остановка
stopBtn.addEventListener("click", () => {
  msg.textContent = "Игра остановлена. Чтобы продолжить — выбери режим снова.";
  say("Молодец!");
  gameArea.style.display = "none";
  startScreen.style.display = "block";
});

left.addEventListener("click", () => pick(left));
right.addEventListener("click", () => pick(right));
