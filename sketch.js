// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 【新增】煙火特效相關全域變數
let particles = []; // 用於儲存爆炸粒子
let explosionTriggered = false; // 追蹤是否已觸發爆炸

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 【新增】檢查是否達到滿分來重設爆炸狀態
        if (finalScore === maxScore && maxScore > 0) {
             // 滿分且 maxScore 有效時，準備觸發爆炸
             explosionTriggered = false; 
        } else {
             // 非滿分或分數重設時，重設爆炸狀態
             explosionTriggered = true; // 設為 true 避免非滿分時意外觸發
             particles = []; // 清空粒子
        }
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

// 【新增】粒子類別 (簡化版)
class ExplosionParticle {
    constructor(x, y, hue) {
        this.pos = createVector(x, y);
        // 隨機方向和速度
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(2, 10)); // 初速度
        this.acc = createVector(0, 0);
        this.lifespan = 255;
        this.hu = hue;
        this.gravity = createVector(0, 0.1); // 簡化重力
    }

    update() {
        this.vel.add(this.acc);
        this.vel.add(this.gravity);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.lifespan -= 5;
    }

    show() {
        colorMode(HSB, 255);
        strokeWeight(3);
        stroke(this.hu, 255, 255, this.lifespan);
        point(this.pos.x, this.pos.y);
        colorMode(RGB, 255); // 恢復預設顏色模式
    }

    isFinished() {
        return this.lifespan < 0;
    }
}


function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    noLoop(); // 如果您希望分數只有在改變時才繪製，保留此行
    colorMode(RGB, 255); // 確保顏色模式為 RGB (p5.js 預設值)
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    background(255); // 清除背景

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // 【新增】C. 滿分時觸發煙火特效
    // -----------------------------------------------------------------
    
    if (percentage === 100 && !explosionTriggered) {
        
        // 1. 觸發爆炸並進入持續繪圖模式
        explosionTriggered = true; 
        loop(); // 啟動 draw 迴圈以實現動畫

        // 2. 初始化粒子
        let particleCount = 60;
        let explosionX = width / 2; // 爆炸中心 X
        let explosionY = height / 2 + 150; // 爆炸中心 Y (在幾何圖形上方一點)
        let randomHue = random(255); // 隨機顏色
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(new ExplosionParticle(explosionX, explosionY, randomHue));
        }
    }
    
    // 3. 更新和繪製粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.show();
        
        if (p.isFinished()) {
            particles.splice(i, 1); // 移除已經結束生命的粒子
        }
    }
    
    // 4. 當所有粒子都消失後，停止 draw 迴圈
    if (explosionTriggered && particles.length === 0) {
        noLoop();
        explosionTriggered = false; // 重設狀態，準備下一次滿分
        // 這裡需要手動呼叫一次 redraw 以確保靜止畫面是最新的 (雖然 noLoop() 會在下一次 redraw() 後生效)
        // 由於前面已經有 background(255)，所以可以讓它自然停止。
    }
    
    // 如果您想要更複雜的視覺效果，還可以根據分數修改線條粗細 (strokeWeight) 
    // 或使用 sin/cos 函數讓圖案的動畫效果有所不同 [8, 9]。
}
