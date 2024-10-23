body {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background-color: #f0f0f0;
}

.container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

canvas {
    border: 2px solid #333;
    background-color: #fff;
    display: none; /* 初始隱藏畫布 */
}

button {
    margin-top: 20px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}