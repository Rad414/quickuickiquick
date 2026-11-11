const field = document.getElementById("field");
const target = document.getElementById("target");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start");

let score = 0;
let timeLeft = 30;
let timer = null;

function placeTarget() {
  const x = Math.random() * (field.clientWidth - 50);
  const y = Math.random() * (field.clientHeight - 50);
  target.style.left = x + "px";
  target.style.top = y + "px";
  target.style.display = "block";
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
  placeTarget(); // точка сразу перепрыгивает в новое место
});

startBtn.addEventListener("click", startGame);
