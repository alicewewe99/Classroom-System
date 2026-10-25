export interface LeaveData {
  date: string;
  caseName: string;
  attendance: { id: string; name: string; status: string }[];
  bus: { id: string; name: string; status: string }[];
  meal: { id: string; name: string; status: string }[];
  notes: { id: string; name: string; reason: string }[];
}

export function drawMarioLeaveCard(
  canvas: HTMLCanvasElement,
  data: LeaveData,
  scale = 2,
  mascotImg?: HTMLImageElement | null
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 基礎尺寸 (虛擬寬度 640px)
  const virtualWidth = 640;
  
  // 計算需要的卡片內部內容高度
  let contentHeight = 40; // 內距

  if (data.date || data.caseName) {
    contentHeight += 70;
  }

  const validAtt = data.attendance.filter(a => a.name.trim() !== '');
  if (validAtt.length > 0) {
    contentHeight += 44 + validAtt.length * 32;
  }

  const validBus = data.bus.filter(b => b.name.trim() !== '');
  if (validBus.length > 0) {
    contentHeight += 44 + validBus.length * 32;
  }

  const validMeal = data.meal.filter(m => m.name.trim() !== '');
  if (validMeal.length > 0) {
    contentHeight += 44 + validMeal.length * 32;
  }

  const validNotes = data.notes.filter(n => n.name.trim() !== '' || n.reason.trim() !== '');
  if (validNotes.length > 0) {
    contentHeight += 44 + validNotes.length * 32;
  }

  contentHeight = Math.max(contentHeight, 100);

  // 總高度 = 頂部天空(70) + 內頁白卡高度 + 底部草地與水管(65)
  const cardY = 80;
  const cardMargin = 20;
  const cardW = virtualWidth - cardMargin * 2;
  const cardH = contentHeight + 40;
  const virtualHeight = cardY + cardH + 75;

  // 設定實體尺寸 (支援高解析度 2x 縮放)
  canvas.width = virtualWidth * scale;
  canvas.height = virtualHeight * scale;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. 背景：瑪利歐經典藍天
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, virtualWidth, virtualHeight);

  // 點綴像素雲朵
  drawPixelCloud(ctx, 40, 25, 1.2);
  drawPixelCloud(ctx, virtualWidth - 140, 18, 0.9);

  // 2. 頂部磚塊金幣標頭條
  ctx.fillStyle = '#b84418';
  ctx.fillRect(0, 0, virtualWidth, 54);
  
  // 磚塊紋理分割線
  ctx.fillStyle = '#601804';
  ctx.fillRect(0, 0, virtualWidth, 4);
  ctx.fillRect(0, 50, virtualWidth, 4);
  for (let bx = 0; bx < virtualWidth; bx += 40) {
    ctx.fillRect(bx, 4, 3, 46);
  }

  // 磚塊頂部金色亮線
  ctx.fillStyle = '#f8b800';
  ctx.fillRect(0, 52, virtualWidth, 3);

  // 頂部標題文字
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px "Noto Sans TC", sans-serif';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.fillText('🍄 長輩請假通知 🌟', 22, 36);
  
  // 右上角像素標籤
  ctx.font = '700 12px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffe600';
  ctx.fillText('WORLD 1-1', virtualWidth - 130, 34);
  ctx.restore();

  // 3. 主要卡片外框
  ctx.fillStyle = '#000000';
  ctx.fillRect(cardMargin + 5, cardY + 5, cardW, cardH);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cardMargin, cardY, cardW, cardH);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(cardMargin, cardY, cardW, cardH);

  // 內框裝飾金黃邊
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fbd000';
  ctx.strokeRect(cardMargin + 6, cardY + 6, cardW - 12, cardH - 12);

  // 繪製卡片內容
  let curY = cardY + 36;
  const leftX = cardMargin + 24;
  const rightBoundary = cardMargin + cardW - 24;

  // 基本資訊 (日期與個案)
  if (data.date || data.caseName) {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(leftX - 8, curY - 22, cardW - 32, 60);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftX - 8, curY - 22, cardW - 32, 60);

    if (data.date) {
      ctx.fillStyle = '#9a3412';
      ctx.font = '900 17px "Noto Sans TC", sans-serif';
      ctx.fillText(`📅 請假日期：`, leftX, curY);

      ctx.fillStyle = '#000000';
      ctx.font = '700 17px "Noto Sans TC", sans-serif';
      ctx.fillText(data.date, leftX + 105, curY);
    }

    if (data.caseName) {
      const caseY = data.date ? curY + 28 : curY;
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 17px "Noto Sans TC", sans-serif';
      ctx.fillText(`👤 對象個案：`, leftX, caseY);

      ctx.fillStyle = '#000000';
      ctx.font = '700 17px "Noto Sans TC", sans-serif';
      ctx.fillText(data.caseName, leftX + 105, caseY);
    }

    // 若有吉祥物，在資訊欄右側展示可愛的花栗鼠小章
    if (mascotImg && mascotImg.complete && mascotImg.naturalWidth > 0) {
      try {
        const mSize = 52;
        const mx = cardMargin + cardW - 24 - mSize;
        const my = curY - 18;

        ctx.save();
        ctx.beginPath();
        ctx.arc(mx + mSize / 2, my + mSize / 2, mSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(mascotImg, mx, my, mSize, mSize);
        ctx.restore();

        // 圓形黑色邊框
        ctx.beginPath();
        ctx.arc(mx + mSize / 2, my + mSize / 2, mSize / 2, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      } catch {
        // ignore
      }
    }

    curY += 56;
  }

  // 區塊 1: 出席狀態
  if (validAtt.length > 0) {
    curY += 12;
    drawSectionBadge(ctx, leftX, curY, '🏫 出席狀態', '#d97706', '#fef3c7');
    curY += 32;

    validAtt.forEach((item) => {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(leftX + 8, curY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = '700 16px "Noto Sans TC", sans-serif';
      ctx.fillText(item.name, leftX + 22, curY);

      drawStatusPill(ctx, rightBoundary - 95, curY - 18, 90, 24, item.status, getAttColor(item.status));
      curY += 32;
    });
  }

  // 區塊 2: 交通車接送
  if (validBus.length > 0) {
    curY += 8;
    drawSectionBadge(ctx, leftX, curY, '🚐 交通車接送', '#1d4ed8', '#dbeafe');
    curY += 32;

    validBus.forEach((item) => {
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(leftX + 8, curY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = '700 16px "Noto Sans TC", sans-serif';
      ctx.fillText(item.name, leftX + 22, curY);

      drawStatusPill(ctx, rightBoundary - 110, curY - 18, 105, 24, item.status, getBusColor(item.status));
      curY += 32;
    });
  }

  // 區塊 3: 伙食需求
  if (validMeal.length > 0) {
    curY += 8;
    drawSectionBadge(ctx, leftX, curY, '🍱 伙食需求', '#15803d', '#dcfce7');
    curY += 32;

    validMeal.forEach((item) => {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(leftX + 8, curY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = '700 16px "Noto Sans TC", sans-serif';
      ctx.fillText(item.name, leftX + 22, curY);

      drawStatusPill(ctx, rightBoundary - 130, curY - 18, 125, 24, item.status, '#16a34a');
      curY += 32;
    });
  }

  // 區塊 4: 備註與原因
  if (validNotes.length > 0) {
    curY += 8;
    drawSectionBadge(ctx, leftX, curY, '📌 備註與原因', '#be185d', '#fce7f3');
    curY += 32;

    validNotes.forEach((item) => {
      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.arc(leftX + 8, curY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = '700 15px "Noto Sans TC", sans-serif';
      const label = item.name ? `${item.name}：${item.reason}` : item.reason;
      ctx.fillText(label, leftX + 22, curY);
      curY += 32;
    });
  }

  // 4. 底部瑪利歐草地與地面
  const groundY = virtualHeight - 48;

  // 綠色草皮頂
  ctx.fillStyle = '#00a800';
  ctx.fillRect(0, groundY, virtualWidth, 14);
  ctx.fillStyle = '#30d030';
  ctx.fillRect(0, groundY, virtualWidth, 4);

  // 棕色泥土塊
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(0, groundY + 14, virtualWidth, 34);

  // 泥土黑色格線
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, groundY, virtualWidth, 3);
  for (let gx = 0; gx < virtualWidth; gx += 24) {
    ctx.fillRect(gx, groundY + 14, 2, 34);
  }

  // 右下角綠色水管
  drawWarpPipe(ctx, virtualWidth - 85, groundY - 50, 60, 50);

  // 左下角金色無敵星星裝飾
  drawRetroStar(ctx, 35, groundY - 18, 14);

  // 底部文字浮水印
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Noto Sans TC", sans-serif';
  ctx.fillText('✨ 蘑菇冒險隊照護通報 · 一鍵即時發送', 60, groundY + 26);

  ctx.restore();

  return canvas.toDataURL('image/png');
}

// 輔助函式：繪製像素雲朵
function drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const s = 10 * scale;
  
  ctx.fillRect(x + s, y + s, s * 6, s * 2);
  ctx.fillRect(x + s * 2, y, s * 4, s * 3);
  ctx.fillRect(x, y + s * 1.5, s * 8, s * 1.5);
  ctx.restore();
}

// 輔助函式：標題標籤
function drawSectionBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  color: string,
  bgColor: string
) {
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.fillRect(x - 6, y - 18, 160, 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 6, y - 18, 160, 24);

  ctx.fillStyle = color;
  ctx.font = '900 15px "Noto Sans TC", sans-serif';
  ctx.fillText(title, x + 2, y);
  ctx.restore();
}

// 輔助函式：狀態標籤
function drawStatusPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 16);
  ctx.restore();
}

// 輔助函式：經典水管
function drawWarpPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  const capH = 18;
  const capOverhang = 6;

  // 管身
  ctx.fillStyle = '#00a800';
  ctx.fillRect(x, y + capH, w, h - capH);
  ctx.fillStyle = '#5cfc5c';
  ctx.fillRect(x + 6, y + capH, 8, h - capH);
  ctx.fillStyle = '#005800';
  ctx.fillRect(x + w - 10, y + capH, 10, h - capH);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y + capH, w, h - capH);

  // 管帽
  const capX = x - capOverhang;
  const capW = w + capOverhang * 2;
  ctx.fillStyle = '#00a800';
  ctx.fillRect(capX, y, capW, capH);
  ctx.fillStyle = '#5cfc5c';
  ctx.fillRect(capX + 7, y + 2, 8, capH - 4);
  ctx.fillStyle = '#005800';
  ctx.fillRect(capX + capW - 12, y + 2, 10, capH - 4);

  ctx.strokeRect(capX, y, capW, capH);
  ctx.restore();
}

// 輔助函式：經典無敵星星
function drawRetroStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number
) {
  ctx.save();
  const spikes = 5;
  const innerRadius = outerRadius * 0.45;
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();

  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  // 眼睛
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx - 3, cy - 4, 2, 5);
  ctx.fillRect(cx + 1, cy - 4, 2, 5);
  ctx.restore();
}

function getAttColor(status: string): string {
  if (status.includes('上午')) return '#eab308';
  if (status.includes('下午')) return '#3b82f6';
  return '#ef4444';
}

function getBusColor(status: string): string {
  if (status.includes('早上')) return '#2563eb';
  if (status.includes('下午')) return '#0284c7';
  if (status.includes('自行') || status.includes('家屬')) return '#059669';
  return '#dc2626';
}
