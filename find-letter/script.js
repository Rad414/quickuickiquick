const goalEl = document.getElementById("goal");
const left = document.getElementById("left");
const right = document.getElementById("right");
const msg = document.getElementById("msg");
const stopBtn = document.getElementById("stop");

const LETTERS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
let goal = "";

function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function randomLetter(except = "") {
  let l;
  do { l = LETTERS[Math.floor(Math.random() * LETTERS.length)]; }
  while (l === except);
  return l;
}

// ставим пару: одна плашка с нужной буквой, вторая — другая, порядок случайный
function newRound() {
  goal = randomLetter();
  goalEl.textContent = goal;
  say("Найди " + goal);

  const other = randomLetter(goal);
  if (Math.random() < 0.5) {
    left.textContent = goal;
    right.textContent = other;
  } else {
    left.textContent = other;
    right.textContent = goal;
  }

  left.disabled = false;
  right.disabled = false;
  msg.textContent = "";
}

function pick(btn) {
  if (btn.textContent === goal) {
    btn.style.background = "#06d6a0";
    say(goal);
    setTimeout(newRound, 500);   // небольшая пауза, чтобы увидеть зелёный
  } else {
    say("мимо!");
    btn.classList.remove("shake");
    void btn.offsetWidth;        // перезапуск анимации
    btn.classList.add("shake");
    newRound();                  // другой неверный вариант, чтобы не залипать
  }
}

left.addEventListener("click", () => pick(left));
right.addEventListener("click", () => pick(right));

stopBtn.addEventListener("click", () => {
  msg.textContent = "Игра остановлена. Ещё раз — просто нажми на любую букву 🙂";
  say("Молодец!");
  newRound();
});

newRound();
