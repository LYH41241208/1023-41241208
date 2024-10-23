const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 320;

let ballRadius = 10;
let x, y, dx, dy;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX;

let rightPressed = false;
let leftPressed = false;

let brickRowCount, brickColumnCount;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let bricks = [];
let score = 0;
let lives = 3;
let difficulty = 1; // 1: 簡單, 2: 中等, 3: 困難
let currentLevel = 0; // 當前關卡
let backgrounds = [
    'https://thumb.photo-ac.com/86/86ec2853fae2d0e2624d9a999236c444_t.jpeg',
    'https://i.pinimg.com/736x/2e/85/8a/2e858a53567e5b7db3243ce9277e6980.jpg',
    'https://i2.kknews.cc/dxDFT2D6MiujKXhs2EHZWQCGZhnF1RbNd6ZAByVuQBY/0.jpg',
    'https://pic.616pic.com/bg_w1180/00/11/57/ufHadEgHwB.jpg',
    'https://media.themoviedb.org/t/p/w500_and_h282_face/3uE9SUywNbj1qSAuYCGgbTTYku5.jpg'
];
let currentBackground;
let gamePaused = false;

// 定義關卡
function defineLevels() {
    return [
        { rows: 3, columns: 5, multiHit: false, lives: 5 }, // 簡單
        { rows: 5, columns: 5, multiHit: true, lives: 4 },  // 中等
        { rows: 7, columns: 5, multiHit: true, lives: 4 }    // 困難
    ];
}

// 生成磚塊
function generateBricks() {
    const level = defineLevels()[currentLevel];
    brickRowCount = level.rows;
    brickColumnCount = level.columns;
    bricks = []; // 重置磚塊
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let hitPoints = level.multiHit ? 2 : 1; // 多次擊打的磚塊
            bricks[c][r] = { 
                x: c * (brickWidth + brickPadding) + brickOffsetLeft, 
                y: r * (brickHeight + brickPadding) + brickOffsetTop, 
                status: hitPoints 
            };
        }
    }
}

// 選擇難度
document.getElementById('startGameBtn').addEventListener('click', selectDifficulty);

function selectDifficulty() {
    Swal.fire({
        title: '選擇遊戲難度',
        input: 'select',
        inputOptions: {
            '1': '簡單',
            '2': '中等',
            '3': '困難'
        },
        inputPlaceholder: '選擇難度',
        showCancelButton: true,
        confirmButtonText: '開始',
    }).then((result) => {
        if (result.isConfirmed) {
            difficulty = parseInt(result.value) - 1; // 0-index
            resetGame();
            document.getElementById('startGameBtn').style.display = 'none'; // 隱藏開始按鈕
            canvas.style.display = 'block'; // 顯示遊戲畫布
        }
    });
}

function resetGame() {
    const level = defineLevels()[difficulty];
    lives = level.lives; // 設置生命值
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2 * (difficulty + 1); // 根據難度調整球速
    dy = -2 * (difficulty + 1);
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0; // 重置分數
    currentBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)]; // 隨機背景
    generateBricks(); // 生成磚塊
    gamePaused = false;
    draw(); // 開始繪製
}

// 監聽鍵盤和滑鼠事件
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width - paddleWidth) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

// 碰撞檢測
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status > 0) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status--; // 磚塊減少一次擊打
                    score++; // 每打到一個磚塊分數加1
                    if (isLevelCleared()) {
                        levelCleared();
                    }
                }
            }
        }
    }
}

// 檢查關卡是否清除
function isLevelCleared() {
    return bricks.flat().every(b => b.status <= 0); // 檢查所有磚塊是否被擊破
}

function levelCleared() {
    gamePaused = true; // 暫停遊戲
    Swal.fire({
        title: '恭喜！',
        text: '你已清除此關卡！',
        icon: 'success',
    }).then(() => {
        currentLevel++;
        if (currentLevel < defineLevels().length) {
            resetGame();
        } else {
            endGame('所有關卡完成！');
        }
    });
}

// 繪製磚塊
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status > 0) {
                ctx.beginPath();
                ctx.rect(b.x, b.y, brickWidth, brickHeight);
                ctx.fillStyle = b.status > 1 ? '#FF5733' : '#0095DD'; // 不同顏色區分
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// 繪製球
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

// 繪製擋板
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

// 繪製分數
function drawScore() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#0095DD';
    ctx.fillText('分數: ' + score, 8, 20);
}

// 繪製生命
function drawLives() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#0095DD';
    ctx.fillText('生命: ' + lives, canvas.width - 65, 20);
}

// 繪製背景
function drawBackground() {
    const img = new Image();
    img.src = currentBackground;
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
}

// 遊戲主循環
function draw() {
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    collisionDetection();

    if (!gamePaused) {
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
            dx = -dx;
        }
        if (y + dy < ballRadius) {
            dy = -dy;
        } else if (y + dy > canvas.height - ballRadius) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                dy = -dy;
            } else {
                lives--; // 失去生命
                if (!lives) {
                    endGame('遊戲結束！');
                } else {
                    resetBall();
                }
            }
        }

        x += dx;
        y += dy;

        requestAnimationFrame(draw);
    }
}

// 重置球的位置
function resetBall() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2 * (difficulty + 1);
    dy = -2 * (difficulty + 1);
}

// 遊戲結束
function endGame(message) {
    Swal.fire({
        title: '遊戲結束',
        text: message,
        icon: 'error',
    }).then(() => {
        currentLevel = 0;
        resetGame();
        document.getElementById('startGameBtn').style.display = 'block'; // 顯示開始按鈕
        canvas.style.display = 'none'; // 隱藏畫布
    });
}

// 開始遊戲
resetGame();