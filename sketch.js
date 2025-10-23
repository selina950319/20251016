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
let isAnimating = false; // 追蹤是否正在進行動畫

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
        
        // 【優化】當收到新的分數時，停止所有動畫並清空粒子。
        if (isAnimating) {
             noLoop();
             isAnimating = false;
        }
        particles = []; // 清空粒子
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製
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
        this.vel.mult(random(2, 8)); // 初速度
        this.lifespan = 255;
        this.hu = hue;
        this.gravity = createVector(0, 0.1); // 簡化重力
    }

    update() {
        this.vel.add(this.gravity);
        this.pos.add(this.vel);
        this.lifespan -= 4; // 讓它淡出得快一點
    }

    show() {
        // 臨時切換到 HSB 模式繪製粒子
        push(); // 儲存當前的繪圖設定
        colorMode(HSB, 255);
        strokeWeight(3);
        // 使用 this.hu 作為色相，lifespan 作為透明度 (Alpha)
        stroke(this.hu, 255, 255, this.lifespan); 
        point(this.pos.x, this.pos.y);
        pop(); // 恢復之前的繪圖設定 (RGB)
    }

    isFinished() {
        return this.lifespan < 0;
    }
}


function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    colorMode(RGB, 255); // 確保預設為 RGB 模式 (用於文字和背景)
    noLoop(); // 預設停止迴圈，只在分數改變或動畫時繪製
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 【優化】為了解決動畫時的殘影問題，使用帶有透明度的背景，
    // 但因為這裡的動畫很短，先使用不透明背景確保畫面清晰。
    background(255); // 清除背景
    
    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
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
    
    if (percentage === 100 && !isAnimating) {
        
        // 1. 觸發爆炸並進入持續繪圖模式
        isAnimating = true; 
        loop(); // 啟動 draw 迴圈以實現動畫

        // 2. 初始化粒子
        let particleCount = 70; // 增加粒子數量
        let explosionX = width / 2; // 爆炸中心 X
        let explosionY = height / 2 + 150; // 爆炸中心 Y 
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
    if (isAnimating && particles.length === 0) {
        noLoop();
        isAnimating = false; // 重設狀態，準備下一次滿分
        // 由於我們在開頭呼叫了 background(255)，所以不需要額外的 redraw()
    }
}
