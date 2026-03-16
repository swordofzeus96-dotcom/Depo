const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

const gameState = {
  running: false,
  gameOver: false,
  score: 0,
  bestScore: Number(localStorage.getItem("suzulenSincapBest")) || 0,
  frame: 0,
};

const squirrel = {
  x: 95,
  y: canvas.height / 2,
  width: 52,
  height: 34,
  velocity: 0,
  gravity: 0.42,
  flapPower: -7.1,
  rotation: 0,
};

const treeSettings = {
  speed: 2.55,
  width: 74,
  gap: 180,
  spawnInterval: 118,
  minTop: 90,
  groundHeight: 76,
};

let trees = [];

function resetGame() {
  gameState.running = true;
  gameState.gameOver = false;
  gameState.score = 0;
  gameState.frame = 0;
  squirrel.y = canvas.height / 2;
  squirrel.velocity = 0;
  squirrel.rotation = 0;
  trees = [];
}

function flap() {
  if (!gameState.running) {
    resetGame();
  }
  if (!gameState.gameOver) {
    squirrel.velocity = squirrel.flapPower;
  }
}

function spawnTree() {
  const maxTop = canvas.height - treeSettings.groundHeight - treeSettings.gap - 130;
  const topHeight =
    treeSettings.minTop + Math.random() * Math.max(40, maxTop - treeSettings.minTop);

  trees.push({
    x: canvas.width + treeSettings.width,
    topHeight,
    passed: false,
  });
}

function update() {
  if (!gameState.running || gameState.gameOver) return;

  gameState.frame += 1;

  squirrel.velocity += squirrel.gravity;
  squirrel.y += squirrel.velocity;
  squirrel.rotation = Math.max(-0.42, Math.min(1.1, squirrel.velocity * 0.07));

  if (gameState.frame % treeSettings.spawnInterval === 0) {
    spawnTree();
  }

  trees.forEach((tree) => {
    tree.x -= treeSettings.speed;

    if (!tree.passed && tree.x + treeSettings.width < squirrel.x) {
      tree.passed = true;
      gameState.score += 1;
      if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem("suzulenSincapBest", String(gameState.bestScore));
      }
    }
  });

  trees = trees.filter((tree) => tree.x + treeSettings.width > -30);

  const ceilingHit = squirrel.y - squirrel.height / 2 <= 0;
  const groundHit = squirrel.y + squirrel.height / 2 >= canvas.height - treeSettings.groundHeight;

  if (ceilingHit || groundHit || treeCollision()) {
    gameState.gameOver = true;
  }
}

function treeCollision() {
  return trees.some((tree) => {
    const squirrelLeft = squirrel.x - squirrel.width / 2 + 8;
    const squirrelRight = squirrel.x + squirrel.width / 2 - 8;
    const squirrelTop = squirrel.y - squirrel.height / 2 + 4;
    const squirrelBottom = squirrel.y + squirrel.height / 2 - 4;

    const treeLeft = tree.x;
    const treeRight = tree.x + treeSettings.width;
    const treeBottomTopPart = tree.topHeight;
    const treeTopBottomPart = tree.topHeight + treeSettings.gap;

    const horizontalOverlap = squirrelRight > treeLeft && squirrelLeft < treeRight;
    const hitTopTree = squirrelTop < treeBottomTopPart;
    const hitBottomTree = squirrelBottom > treeTopBottomPart;

    return horizontalOverlap && (hitTopTree || hitBottomTree);
  });
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#99d59f");
  gradient.addColorStop(0.55, "#72b977");
  gradient.addColorStop(1, "#4a8f57");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawForestLayer(0.24, 120, "#5f9d65", 0.4);
  drawForestLayer(0.45, 95, "#4d8752", 0.55);
  drawForestLayer(0.75, 75, "#3f7446", 0.75);

  ctx.fillStyle = "#6d4f2d";
  ctx.fillRect(0, canvas.height - treeSettings.groundHeight, canvas.width, treeSettings.groundHeight);

  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillStyle = i % 80 === 0 ? "#4d3520" : "#5a3f24";
    ctx.fillRect(i, canvas.height - treeSettings.groundHeight, 18, treeSettings.groundHeight);
  }
}

function drawForestLayer(speedFactor, treeHeight, color, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  const offset = -((gameState.frame * speedFactor) % 70);

  for (let x = offset - 70; x <= canvas.width + 70; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - treeSettings.groundHeight);
    ctx.lineTo(x + 26, canvas.height - treeSettings.groundHeight - treeHeight);
    ctx.lineTo(x + 52, canvas.height - treeSettings.groundHeight);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawTrees() {
  trees.forEach((tree) => {
    drawTreeSegment(tree.x, 0, tree.topHeight, true);
    drawTreeSegment(
      tree.x,
      tree.topHeight + treeSettings.gap,
      canvas.height - treeSettings.groundHeight - (tree.topHeight + treeSettings.gap),
      false,
    );
  });
}

function drawTreeSegment(x, y, height, isTop) {
  const trunkColor = "#6f4d2f";
  const barkColor = "#5a3e27";
  const leafColor = "#2d713a";

  ctx.fillStyle = trunkColor;
  ctx.fillRect(x, y, treeSettings.width, height);

  ctx.fillStyle = barkColor;
  for (let i = y + 8; i < y + height; i += 22) {
    ctx.fillRect(x + 9, i, treeSettings.width - 18, 5);
  }

  const canopyY = isTop ? y + height - 25 : y - 22;
  ctx.fillStyle = leafColor;
  ctx.beginPath();
  ctx.ellipse(x + treeSettings.width / 2, canopyY, treeSettings.width * 0.75, 28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSquirrel() {
  ctx.save();
  ctx.translate(squirrel.x, squirrel.y);
  ctx.rotate(squirrel.rotation);

  ctx.fillStyle = "#8d5a3d";
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9f6a4a";
  ctx.beginPath();
  ctx.ellipse(-18, -2, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6f432f";
  ctx.beginPath();
  ctx.ellipse(14, -8, 11, 20, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7f0df";
  ctx.beginPath();
  ctx.ellipse(6, 2, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(-20, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6f432f";
  ctx.beginPath();
  ctx.moveTo(-26, -12);
  ctx.lineTo(-22, -23);
  ctx.lineTo(-15, -11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f3d9b8";
  ctx.beginPath();
  ctx.ellipse(-3, -2, 15, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "rgba(20, 40, 22, 0.8)";
  ctx.font = "bold 28px 'Segoe UI', sans-serif";
  ctx.fillText(`Skor: ${gameState.score}`, 16, 42);
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.fillText(`En iyi: ${gameState.bestScore}`, 16, 68);

  if (!gameState.running) {
    drawCenteredMessage("Başlamak için Boşluk veya tıkla");
  } else if (gameState.gameOver) {
    drawCenteredMessage("Oyun bitti! Tekrar için tıkla / boşluk");
  }
}

function drawCenteredMessage(text) {
  const boxWidth = canvas.width - 40;
  const boxHeight = 78;
  const boxX = 20;
  const boxY = canvas.height / 2 - boxHeight / 2;

  ctx.fillStyle = "rgba(15, 33, 18, 0.72)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, boxY + 48);
  ctx.textAlign = "start";
}

function render() {
  drawBackground();
  drawTrees();
  drawSquirrel();
  drawHud();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", flap);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flap();
  }
});
canvas.addEventListener("pointerdown", flap);

loop();
