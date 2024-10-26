const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreValue");
const livesDisplay = document.getElementById("livesValue");
const restartButton = document.getElementById("restartButton");
const startButton = document.getElementById("startButton");
const backgroundMusic = document.getElementById("backgroundMusic");
const hitSound = document.getElementById("hitSound");
const levelCompleteSound = document.getElementById("levelCompleteSound");
const difficultySelect = document.getElementById("difficulty");
const backgroundSelect = document.getElementById("backgroundSelect");
const ballTrail = [];
const maxTrailLength = 10; // 尾跡的長度
const currentLevelDisplay = document.getElementById("levelValue"); // 顯示當前關卡的元素
let isTransitioning = false; // 是否正在過場動畫中
let level = 1; // 當前關卡
const levelBricks = [15, 20, 25, 30, 35]; // 每個關卡的磚塊數量
let isLevelComplete = false; // 標記是否過關
let completeAnimationFrame = 0; // 用於動畫幀數
let jumpCooldown = false; // 用來檢查是否在冷卻中
let isTimeChallengeEnabled = false;  // 用於記錄是否啟用時間挑戰賽
let timeLimit = 240;  // 每關的時間限制（秒）
let timeRemaining = timeLimit;  // 剩餘時間
let timer;  // 用於記錄 setInterval
const explosions = [];
let totalBricks = 0; // 總磚塊數量
let remainingBricks = 0; // 剩餘磚塊數量
let remainingBricksDisplay = document.getElementById('remainingBricks'); // 確保有對應的 DOM 元素

canvas.width = 800;
canvas.height = 500;

let score = 0;
let lives = 3;
let isGameOver = false;
let gameStarted = false;

const paddle = { 
  width: 120, 
  height: 20, 
  x: canvas.width / 2 - 60, 
  y: canvas.height - 30 
};

const ball = { x: canvas.width / 2, y: canvas.height - 60, size: 10, speed: 4, dx: 0, dy: -4 };

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10; // 初始大小
    this.alpha = 1; // 初始透明度
    this.growth = 2; // 增長速度
    this.fade = 0.05; // 透明度減少速度
  }

  update() {
    this.size += this.growth; // 增加爆炸的大小
    this.alpha -= this.fade;  // 逐漸減少透明度
  }

  isFinished() {
    return this.alpha <= 0;  // 檢查是否動畫結束
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 69, 0, ${this.alpha})`; // 橘紅色
    ctx.fill();
    ctx.closePath();
  }
}


function createBricks() {
  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < brickColumnCount; c++) {
      bricks.push(new Brick(c * (brick.width + brick.padding) + brick.offsetLeft, r * (brick.height + brick.padding) + brick.offsetTop));
      totalBricks++; // 每創建一個磚塊，總數加一
    }
  }
  remainingBricks = totalBricks; // 初始化剩餘磚塊數量
}

function drawRemainingBricks() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";          // 設置文字填充顏色為白色
  ctx.strokeStyle = "black";        // 設置文字外框顏色為黑色
  ctx.lineWidth = 20;                // 設置外框寬度
  ctx.fillText(`剩餘磚塊: ${remainingBricks}`, 50, 20); // 在左上方顯示剩餘磚塊數量
}

let brickRowCount = 3; // 預設為簡單模式行數
const brickColumnCount = 8; // 縱向磚塊數量始終為 8
let ballSpeed = 4;
let currentBackground = 0; // 預設背景

const bricks = [];
const brick = { width: 75, height: 20, padding: 10, offsetY: 50, color: "#0095dd", specialColor: "orange", strength: 1, specialStrength: 3 };

const volumeControl = document.getElementById("volumeControl");

// 設定初始音量
hitSound.volume = 0.1;
backgroundMusic.volume = 1.0;
levelCompleteSound.volume = 0.4;

volumeControl.addEventListener("input", (e) => {
    const volume = e.target.value; // 獲取滑桿值
    hitSound.volume = volume; // 動態調整擊打音效的音量
    backgroundMusic.volume = volume; // 動態調整背景音樂的音量
    levelCompleteSound.volume = volume; // 動態調整通關音效的音量
});

// 繪製過關動畫
function drawLevelCompleteAnimation() {
  if (completeAnimationFrame < 60) { // 設定動畫持續60幀
    ctx.fillStyle = `rgba(0, 255, 0, ${1 - completeAnimationFrame / 60})`; // 漸變顏色
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 繪製全屏矩形
    completeAnimationFrame++;
  } else {
    isLevelComplete = false; // 動畫完成
    levelCompleteSound.play(); // 播放過關音效
    setTimeout(() => {
      document.addEventListener('click', startBallMovement); // 等待玩家點擊開始
    }, 2000); // 2秒後進入下一關
  }
}

// 添加啟動球的函數
function startBallMovement() {
  document.removeEventListener('click', startBallMovement); // 移除事件
  resetBall(); // 重置球的位置
  ball.dx = ballSpeed * (Math.random() * 2 - 1); // 設定隨機的 x 速度
  ball.dy = -ballSpeed; // 設定球的初始 y 速度
  update(); // 開始更新遊戲
}


// 背景圖片
const backgrounds = [
  "https://thumb.photo-ac.com/86/86ec2853fae2d0e2624d9a999236c444_t.jpeg", // 夜空
  "https://i.pinimg.com/736x/2e/85/8a/2e858a53567e5b7db3243ce9277e6980.jpg", // 森林
  "https://pic.616pic.com/bg_w1180/00/11/57/ufHadEgHwB.jpg", // 山脈
  "https://media.themoviedb.org/t/p/w500_and_h282_face/3uE9SUywNbj1qSAuYCGgbTTYku5.jpg" // 城市
];


let currentLevel = 0; // 當前關卡

// 更新關卡顯示
function updateLevelDisplay() {
  document.getElementById("levelValue").innerText = `第 ${currentLevel+1} 關`; // 當前關卡 + 1 因為索引從 0 開始
}



function levelComplete() {
  isLevelComplete = true; 
  ball.x = canvas.width / 2; 
  ball.y = canvas.height / 2; 
  paddle.x = canvas.width / 2 - paddle.width / 2; 

  updateLevelDisplay(); 
  // 在關卡完成時更新剩餘磚塊數量
  remainingBricks = calculateRemainingBricks(); // 使用函數計算剩餘磚塊數量

  if (level >= levels.length) {
      gameOver("恭喜你通關所有關卡！");
  } else {
      setTimeout(() => {
          drawLevelCompleteAnimation();
          nextLevel(); // 添加這一行，確保進入下一關
      }, 2000); 
  }
}



// 磚塊數量設定
const brickCounts = {
  easy: { rowCount: 2, columnCount: 3 },
  medium: { rowCount: 3, columnCount: 5 },
  hard: { rowCount: 4, columnCount: 6 }
};



function nextLevel() {
  currentLevel++; 
  if (currentLevel < levels.length) {
      initBricks(); 
      resetBall(); 
      paddle.x = canvas.width / 2 - paddle.width / 2; 
      updateLevelDisplay(); 
      completeAnimationFrame = 0; 
      drawLevelCompleteAnimation(); // 確保這行的調用順序
  } else {
      gameOver("你贏了！所有關卡都通過了。");
  }
}




// 關卡設定
const levels = [
  { arrangement: 'rectangle' }, // 矩形
  { arrangement: 'triangle' }, // 三角形
  { arrangement: 'trapezoid' }, // 梯形
  { arrangement: 'invertedTriangle' }, // 倒三角形
  { arrangement: 'polygon' } // 稜形
];

// 初始化磚塊
function initBricks() {
  bricks.length = 0; // 清空磚塊陣列
  const level = levels[currentLevel]; // 當前關卡
  const difficulty = difficultySelect.value; // 取得當前選擇的難度
  const { rowCount, columnCount } = brickCounts[difficulty]; // 獲取對應難度的磚塊行列數

  const totalBrickWidth = brick.width * columnCount + brick.padding * (columnCount - 1);
  const offsetX = (canvas.width - totalBrickWidth) / 2; // 計算水平方向偏移量，使磚塊居中

  // 設定隱藏磚塊機率
  const hiddenBrickProbability = 0.1; // 10% 的磚塊會被隱藏

  // 根據關卡的排列方式生成磚塊
  switch (level.arrangement) {
    case 'rectangle':
      for (let r = 0; r < rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < columnCount; c++) {
          const isSpecial = Math.random() < 0.3; // 30% 機率為特殊磚塊
          const isHidden = Math.random() < hiddenBrickProbability; // 隨機設定是否為隱藏磚塊
          bricks[r][c] = {
            x: c * (brick.width + brick.padding) + offsetX,
            y: r * (brick.height + brick.padding) + brick.offsetY,
            strength: isSpecial ? brick.specialStrength : brick.strength,
            isSpecial: isSpecial,
            isHidden: isHidden // 設定隱藏屬性
          };
          totalBricks++; // 計算所有磚塊
        }
      }
      break;

    case 'triangle':
      for (let r = 0; r < rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < rowCount - r; c++) {
          const isSpecial = Math.random() < 0.3;
          const isHidden = Math.random() < hiddenBrickProbability;
          bricks[r][c] = {
            x: c * (brick.width + brick.padding) + offsetX + (r * (brick.width + brick.padding)) / 2,
            y: r * (brick.height + brick.padding) + brick.offsetY,
            strength: isSpecial ? brick.specialStrength : brick.strength,
            isSpecial: isSpecial,
            isHidden: isHidden
          };
        }
      }
      break;

    case 'trapezoid':
      for (let r = 0; r < rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < columnCount - r; c++) {
          const isSpecial = Math.random() < 0.3;
          const isHidden = Math.random() < hiddenBrickProbability;
          bricks[r][c] = {
            x: c * (brick.width + brick.padding) + offsetX + (r * 10), // 增加偏移以形成梯形
            y: r * (brick.height + brick.padding) + brick.offsetY,
            strength: isSpecial ? brick.specialStrength : brick.strength,
            isSpecial: isSpecial,
            isHidden: isHidden
          };
        }
      }
      break;

    case 'invertedTriangle':
      for (let r = 0; r < rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < rowCount - r; c++) {
          const isSpecial = Math.random() < 0.3;
          const isHidden = Math.random() < hiddenBrickProbability;
          bricks[r][c] = {
            x: c * (brick.width + brick.padding) + offsetX + ((rowCount - r - 1) * (brick.width + brick.padding)) / 2,
            y: r * (brick.height + brick.padding) + brick.offsetY,
            strength: isSpecial ? brick.specialStrength : brick.strength,
            isSpecial: isSpecial,
            isHidden: isHidden
          };
        }
      }
      break;

    case 'polygon':
      for (let r = 0; r < rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < columnCount; c++) {
          const isSpecial = Math.random() < 0.3;
          const isHidden = Math.random() < hiddenBrickProbability;
          bricks[r][c] = {
            x: c * (brick.width + brick.padding) + offsetX + (r % 2) * 10, // 交錯排列
            y: r * (brick.height + brick.padding) + brick.offsetY,
            strength: isSpecial ? brick.specialStrength : brick.strength,
            isSpecial: isSpecial,
            isHidden: isHidden
          };
        }
      }
      break;

    default:
      break;
  }
  remainingBricks = totalBricks; // 設置剩餘磚塊數量
  updateRemainingBricksDisplay();
}

// 更新顯示剩餘磚塊的函數
function updateRemainingBricksDisplay() {
  remainingBricksDisplay.innerText = `磚塊數量: ${remainingBricks}`; // 更新顯示
}

// 隨機打亂磚塊位置的函數
function shuffleBricks() {
  for (let i = bricks.length - 1; i > 0; i--) {
    for (let j = bricks[i].length - 1; j > 0; j--) {
      const randomRow = Math.floor(Math.random() * (i + 1));
      const randomCol = Math.floor(Math.random() * (j + 1));
      const temp = bricks[i][j];
      bricks[i][j] = bricks[randomRow][randomCol];
      bricks[randomRow][randomCol] = temp;
    }
  }
}

function drawBricks() {
  bricks.forEach((row) => {
    row.forEach((b) => {
      if (b.strength > 0 && !b.isHidden) { // 只繪製強度大於 0 且未隱藏的磚塊
        ctx.fillStyle = b.isSpecial ? (b.strength > 1 ? "darkorange" : "orange") : brick.color;
        ctx.fillRect(b.x, b.y, brick.width, brick.height);
        // 顯示磚塊強度
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center"; // 設置文字水平對齊方式為居中
        ctx.textBaseline = "middle"; // 設置文字垂直對齊方式為居中

        // 計算文字的中心位置
        const textX = b.x + brick.width / 2;
        const textY = b.y + brick.height / 2;

        ctx.fillText(b.strength, textX, textY); // 在磚塊中心繪製文字
      }
    });
  });
}

function collisionDetection() {
  bricks.forEach((row) => {
    row.forEach((b) => {
      if (b.strength > 0) {
        if (ball.x > b.x && ball.x < b.x + brick.width && ball.y > b.y && ball.y < b.y + brick.height) {
          ball.dy *= -1;

          // 根據是否啟用時間挑戰賽進行不同的分數計算
          if (isTimeChallengeEnabled) {
            score += 5; // 在時間挑戰賽模式下增加分數
          }

          // 無論如何都應該減少磚塊強度
          if (b.isHidden) {
            b.isHidden = false;
            score += 5; // 這裡也是在擊破隱藏磚塊時加分
          } else {
            b.strength--;
          }

          if (b.strength === 0) {
            explosions.push(new Explosion(b.x + brick.width / 2, b.y + brick.height / 2));
            remainingBricks--; // 磚塊被擊破，減少剩餘數量
            scoreDisplay.innerText = `剩餘磚塊數量: ${remainingBricks}`; // 更新顯示
          }

          score++;
          scoreDisplay.innerText = score;

          hitSound.currentTime = 0;
          hitSound.play();

          if (areAllBricksCleared() && !isLevelComplete) {
            levelComplete();
          }
        }
      }
    });
  });
}

function calculateRemainingBricks() {
  let count = 0;
  bricks.forEach((row) => {
    row.forEach((b) => {
      if (b.strength > 0) { // 如果磚塊的強度大於0，則視為剩餘磚塊
        count++;
      }
    });
  });
  return count;
}


// 檢查所有磚塊是否已被打掉
function areAllBricksCleared() {
  return bricks.every(row => row.every(b => b.strength <= 0));
}

// 繪製球與有速度感的尾跡
function drawBall() {
  // 定義顏色陣列
  const colors = [
    'rgba(255, 0, 0, 0.3)',   // 紅色
    'rgba(255, 165, 0, 0.3)', // 橙色
    'rgba(255, 255, 0, 0.3)', // 黃色
    'rgba(0, 128, 0, 0.3)',   // 綠色
    'rgba(0, 0, 255, 0.3)',   // 藍色
    'rgba(75, 0, 130, 0.3)',  // 靛藍
    'rgba(238, 130, 238, 0.3)' // 紫色
  ];

  // 繪製尾跡
  for (let i = 0; i < ballTrail.length; i++) {
    ctx.beginPath();

    // 計算顏色
    const colorIndex = (i % colors.length);
    const color = colors[colorIndex];

    // 設置透明度
    ctx.fillStyle = color; 
    ctx.ellipse(ballTrail[i].x, ballTrail[i].y, ball.size, ball.size * 0.5, Math.PI / 4, 0, Math.PI * 2); // 使用橢圓形
    ctx.fill();
    ctx.closePath();
  }

  // 繪製邊框
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
  ctx.strokeStyle = "black"; // 設置邊框顏色為黑色
  ctx.lineWidth = 2; // 設置邊框的寬度
  ctx.stroke(); // 繪製邊框
  ctx.closePath();

  // 繪製球的填充顏色
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
  ctx.fillStyle = "white"; // 球的填充顏色
  ctx.fill();
  ctx.closePath();
}

// 繪製擋板
function drawPaddle() {
  // 繪製邊框
  ctx.strokeStyle = "black"; // 設置邊框顏色為黑色
  ctx.lineWidth = 2; // 設置邊框的寬度
  ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height); // 繪製邊框

  // 繪製擋板的填充顏色
  ctx.fillStyle = "white"; // 擋板的填充顏色
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); // 填充擋板
}

// 移動球並儲存位置
function moveBall() {
    // 儲存當前位置到尾跡陣列
    ballTrail.push({ x: ball.x, y: ball.y });
    if (ballTrail.length > maxTrailLength) {
        ballTrail.shift(); // 超過長度時刪除最舊的位置
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.size > canvas.width || ball.x - ball.size < 0) ball.dx *= -1;
    if (ball.y - ball.size < 0) ball.dy *= -1;

    if (ball.y + ball.size > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy *= -1;
    }

    if (ball.y + ball.size > canvas.height) {
        lives--;
        livesDisplay.innerText = lives;
        if (!lives) gameOver("遊戲結束");
        else resetBall();
    }
}

// 重置球
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2; // 將球位置設置為中間
  ball.dx = ballSpeed * (Math.random() * 2 - 1); // 隨機方向
  ball.dy = -ballSpeed; // 向上移動
}

// 遊戲結束
function gameOver(message) {
  isGameOver = true;
  alert(message);
  restartButton.style.display = "block";
}

// 開始遊戲
function startGame() {
  isGameOver = false;
  score = 0;
  lives = 3;
  scoreDisplay.innerText = score;
  livesDisplay.innerText = lives;
  restartButton.style.display = "none";
  startButton.style.display = "none";

  backgroundMusic.play().catch(error => {
    console.log("背景音樂播放失敗:", error);
  });

  // 根據選擇的難度調整磚塊數量和球的速度
  const difficulty = difficultySelect.value;
  if (difficulty === "easy") {
    brickRowCount = 3; // 簡單模式行數
    ballSpeed = 3; // 簡單模式球速
  } else if (difficulty === "medium") {
    brickRowCount = 5; // 中等模式行數
    ballSpeed = 4; // 中等模式球速
  } else if (difficulty === "hard") {
    brickRowCount = 6; // 困難模式行數
    ballSpeed = 5; // 困難模式球速
  }

  currentBackground = parseInt(backgroundSelect.value);
  initBricks();
  resetBall();
  gameStarted = true;
  updateLevelDisplay(); // 更新關卡顯示
  requestAnimationFrame(update);
}

function jumpPaddle() {
  jumpCooldown = true; // 設置冷卻狀態
  let originalY = paddle.y; // 儲存原始位置

  paddle.y -= 30; // 擋板向上跳30像素

  // 檢查球是否打到擋板
  if (ball.y + ball.radius >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
      ballspeed += 0.1; // 增加球速
  }
  
  setTimeout(() => {
      paddle.y = originalY; // 兩秒後恢復擋板位置
      jumpCooldown = false; // 重置冷卻狀態
  }, 500); // 2000毫秒（2秒）
}


function update() {
  if (isGameOver || !gameStarted) return;

  // 繪製背景
  const backgroundImage = new Image();
  backgroundImage.src = backgrounds[currentBackground];
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // 更新和繪製爆炸效果
  explosions.forEach((explosion, index) => {
    explosion.update(); // 更新爆炸
    explosion.draw(ctx); // 繪製爆炸
    if (explosion.isFinished()) {
      explosions.splice(index, 1); // 移除結束的爆炸
    }
  });

  // 繪製所有物件
  drawBricks();   // 確保這裡被呼叫
  drawBall();
  drawPaddle();
  moveBall();
  collisionDetection();
  drawTime();

  // 繪製剩餘磚塊數量
  drawRemainingBricks();

  if (isLevelComplete) {
    drawLevelCompleteAnimation(); // 繪製過關動畫
  } else {
    updateLevelDisplay(); // 繪製當前關卡
  }

  requestAnimationFrame(update); // 繼續更新
}

function startTimer() {
  resetTimer();  // 開始前重置時間
  timer = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
          clearInterval(timer);
          alert("時間挑戰賽失敗！");
          document.location.reload();
      }
  }, 1000);  // 每秒減少1
}

function resetTimer() {
  clearInterval(timer);
  timeRemaining = timeLimit;
}


document.getElementById("timeChallengeBtn").addEventListener("click", () => {
  isTimeChallengeEnabled = !isTimeChallengeEnabled;
  if (isTimeChallengeEnabled) {
      document.getElementById("timeChallengeBtn").textContent = "停用時間挑戰賽";
      startTimer();
  } else {
      document.getElementById("timeChallengeBtn").textContent = "啟用時間挑戰賽";
      resetTimer();
  }
});

function drawTime() {
  if (isTimeChallengeEnabled) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";          // 設置文字填充顏色為白色
    ctx.strokeStyle = "black";        // 設置文字外框顏色為黑色
    ctx.lineWidth = 3;                // 設置外框寬度

    const timeText = "剩餘時間: " + timeRemaining + " 秒";
    const x = canvas.width -70;
    const y = 20;

    ctx.strokeText(timeText, x, y);   // 繪製文字外框
    ctx.fillText(timeText, x, y);     // 填充文字
  }
}



// 滑鼠控制擋板
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  paddle.x = e.clientX - rect.left - paddle.width / 2;


  // 確保擋板不會移出畫面
  if (paddle.x < 0) {
    paddle.x = 0;
  } else if (paddle.x + paddle.width > canvas.width) {
    paddle.x = canvas.width - paddle.width;
  }
});
// 滑鼠按下事件
canvas.addEventListener("mousedown", (e) => {
  if (isLevelComplete) { // 檢查是否關卡完成
      isLevelComplete = false; // 重置關卡狀態，避免重複觸發
      ball.dy = -ballSpeed; // 重置球的速度，開始移動
  }
});

canvas.addEventListener('contextmenu', function(event) {
  event.preventDefault(); // 防止右鍵菜單出現
  if (!jumpCooldown) {
      jumpPaddle();
  }
});

// 開始和重新開始按鈕事件
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
