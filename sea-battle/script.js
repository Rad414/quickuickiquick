const SIZE = 10;
const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

const statusEl = document.getElementById("status");
const msgEl = document.getElementById("msg");
const enemyBoard = document.getElementById("enemy");
const playerBoard = document.getElementById("player");

let enemy, player;          // {board, ships}
let enemyShots, playerShots;// Set индексов, куда уже стреляли
let myTurn = true;
let busy = false;

function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ru-RU";
  u.rate = 1;
  speechSynthesis.speak(u);
}

// расстановка флота: корабли не касаются друг друга даже углами
function generateFleet() {
  const board = Array(SIZE * SIZE).fill(0);
  const ships = [];

  for (const size of SHIP_SIZES) {
    let placed = false, guard = 0;
    while (!placed && guard++ < 1000) {
      const horiz = Math.random() < 0.5;
      const row = Math.floor(Math.random() * (horiz ? SIZE : SIZE - size + 1));
      const col = Math.floor(Math.random() * (horiz ? SIZE - size + 1 : SIZE));
      const cells = [];
      let ok = true;

      for (let i = 0; i < size; i++) {
        const r = row + (horiz ? 0 : i);
        const c = col + (horiz ? i : 0);
        for (let dr = -1; dr <= 1 && ok; dr++) {
          for (let dc = -1; dc <= 1 && ok; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr * SIZE + nc]) ok = false;
          }
        }
        cells.push(r * SIZE + c);
      }
      if (ok) { cells.forEach(x => (board[x] = 1)); ships.push(cells); placed = true; }
    }
  }
  return { board, ships };
}

// проверка: корабль потоплен (все его клетки подбиты)
function isSunk(state, shots, cells) {
  return cells.every(c => shots.has(c));
}

// все ли корабли уничтожены
function allSunk(state, shots) {
  return state.ships.every(s => s.every(c => shots.has(c)));
}

// соседи клетки (для добивания компьютером)
function neighbors(idx) {
  const r = Math.floor(idx / SIZE), c = idx % SIZE;
  const res = [];
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) res.push(nr * SIZE + nc);
  });
  return res;
}

function buildBoard(container, isEnemy) {
  container.innerHTML = "";
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    if (isEnemy) {
      cell.addEventListener("click", () => playerShoot(i));
    }
    container.appendChild(cell);
  }
}

function render() {
  // поле противника: корабли скрыты
  [...enemyBoard.children].forEach((cell, i) => {
    cell.classList.remove("hit", "miss", "sunk");
    if (enemyShots.has(i)) {
      if (enemy.board[i]) {
        cell.classList.add(isSunk(enemy, enemyShots, findShip(enemy, i)) ? "sunk" : "hit");
      } else {
        cell.classList.add("miss");
      }
      cell.classList.add("done");
    }
  });

  // своё поле: корабли видны
  [...playerBoard.children].forEach((cell, i) => {
    cell.classList.remove("ship", "hit", "miss", "sunk");
    if (player.board[i]) cell.classList.add("ship");
    if (playerShots.has(i)) {
      if (player.board[i]) {
        cell.classList.add(isSunk(player, playerShots, findShip(player, i)) ? "sunk" : "hit");
      } else {
        cell.classList.add("miss");
      }
      cell.classList.add("done");
    }
  });
}

function findShip(state, idx) {
  return state.ships.find(s => s.includes(idx));
}

// ход игрока
function playerShoot(idx) {
  if (!myTurn || busy || enemyShots.has(idx)) return;
  busy = true;

  enemyShots.add(idx);
  const hit = enemy.board[idx];

  render();

  if (allSunk(enemy, enemyShots)) {
    statusEl.textContent = "🏆 Победа! Ты потопил весь флот противника!";
    say("Победа! Молодец!");
    busy = false;
    return;
  }

  if (hit) {
    msgEl.textContent = isSunk(enemy, enemyShots, findShip(enemy, idx))
      ? "Убил! Стреляй ещё!"
      : "Попал! Стреляй ещё!";
    if (isSunk(enemy, enemyShots, findShip(enemy, idx))) say("Убил!");
    busy = false;                 // попал — ходит снова
  } else {
    msgEl.textContent = "Мимо. Ход противника…";
    setTimeout(computerTurn, 800);
  }
}

// ход компьютера
function computerTurn() {
  if (allSunk(player, playerShots)) {
    statusEl.textContent = "😢 Компьютер победил. Попробуй ещё раз!";
    say("Компьютер победил");
    busy = false;
    return;
  }

  let idx = -1;

  // если есть подбитая клетка без потопленного корабля — добиваем соседей
  for (let i = 0; i < SIZE * SIZE && idx === -1; i++) {
    if (playerShots.has(i) && player.board[i] && !isSunk(player, playerShots, findShip(player, i))) {
      idx = neighbors(i).find(n => !playerShots.has(n)) ?? -1;
    }
  }

  // иначе — случайная клетка
  if (idx === -1) {
    const free = [];
    for (let i = 0; i < SIZE * SIZE; i++) if (!playerShots.has(i)) free.push(i);
    idx = free[Math.floor(Math.random() * free.length)];
  }

  playerShots.add(idx);
  const hit = player.board[idx];
  render();

  if (allSunk(player, playerShots)) {
    statusEl.textContent = "😢 Компьютер победил. Попробуй ещё раз!";
    say("Компьютер победил");
    busy = false;
    return;
  }

  if (hit) {
    msgEl.textContent = isSunk(player, playerShots, findShip(player, idx))
      ? "Компьютер: убил! Ходи!"
      : "Компьютер попал! Он стреляет ещё…";
    setTimeout(computerTurn, 800);
  } else {
    msgEl.textContent = "Компьютер промахнулся. Твой ход!";
    myTurn = true;
    busy = false;
  }
}

function newGame() {
  enemy = generateFleet();
  player = generateFleet();
  enemyShots = new Set();
  playerShots = new Set();
  myTurn = true;
  busy = false;
  msgEl.textContent = "";
  statusEl.textContent = "Твой ход! Кликни по клетке поля противника";
  buildBoard(enemyBoard, true);
  buildBoard(playerBoard, false);
  render();
}

document.getElementById("new").addEventListener("click", newGame);
newGame();
