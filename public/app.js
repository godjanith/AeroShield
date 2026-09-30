const canvas = document.getElementById('gisCanvas');
const ctx = canvas.getContext('2d');

let currentMode = 'radar';
let surgeHeight = 3.8;
let rainfallRate = 45;
let animationFrame = 0;

// Assets state
const assets = [
  { name: "Substation Alpha 132kV (Paradip Coast)", type: "Power Grid", risk: "CRITICAL", rec: "Initiate remote line de-energization. Inundation depth exceeds 1.4m threshold." },
  { name: "NH-16 Arterial Highway (Sector 4)", type: "Highway", risk: "ELEVATED", rec: "Implement detour routes via Inland State Highway 9. Evacuation convoy priority." },
  { name: "District Emergency Shelter 04", type: "Medical Shelter", risk: "SAFE", rec: "Operating on backup generator capacity. Clear for receiving 1,200 evacuees." },
  { name: "Dhamra Port Logistics Feeder", type: "Power & Road", risk: "CRITICAL", rec: "Halt heavy container transport. Flooding across low-lying culvert segments." }
];

function renderAssets() {
  const container = document.getElementById('assetList');
  container.innerHTML = '';
  assets.forEach(asset => {
    const card = document.createElement('div');
    const riskClass = asset.risk === 'CRITICAL' ? 'critical' : (asset.risk === 'ELEVATED' ? 'elevated' : 'safe');
    card.className = `asset-card ${riskClass}`;
    card.innerHTML = `
      <h4>${asset.name} <span class="badge ${asset.risk === 'CRITICAL' ? 'red' : ''}">${asset.risk}</span></h4>
      <p><strong>Type:</strong> ${asset.type}</p>
      <p style="margin-top: 4px;">${asset.rec}</p>
    `;
    container.appendChild(card);
  });
}

// Canvas Visual Simulation
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Base Sea & Land Contour
  ctx.fillStyle = currentMode === 'satellite' ? '#07202b' : '#0b1329';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Coastline path
  ctx.beginPath();
  ctx.moveTo(280, 0);
  ctx.bezierCurveTo(340, 150, 220, 300, 310, 520);
  ctx.lineTo(0, 520);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = currentMode === 'satellite' ? '#143a29' : '#0f172a';
  ctx.fill();

  // Coastline border stroke
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();

  // 2. Storm Surge Inundation Overlay
  const surgeWidth = (surgeHeight / 6.5) * 80;
  ctx.beginPath();
  ctx.moveTo(280 + surgeWidth, 0);
  ctx.bezierCurveTo(340 + surgeWidth, 150, 220 + surgeWidth, 300, 310 + surgeWidth, 520);
  ctx.lineTo(280 - surgeWidth * 0.6, 520);
  ctx.bezierCurveTo(220 - surgeWidth * 0.6, 300, 340 - surgeWidth * 0.6, 150, 280 - surgeWidth * 0.6, 0);
  ctx.closePath();
  ctx.fillStyle = currentMode === 'surge' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.25)';
  ctx.fill();

  // 3. Arterial Roads (NH-16)
  ctx.beginPath();
  ctx.moveTo(120, 0);
  ctx.lineTo(160, 220);
  ctx.lineTo(210, 520);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#06b6d4';
  ctx.stroke();

  // 4. Critical Infrastructure Points
  drawPin(260, 180, '#ef4444', 'Substation Alpha');
  drawPin(165, 230, '#f59e0b', 'NH-16 Corridor');
  drawPin(90, 310, '#10b981', 'Shelter 04 (Safe)');
  drawPin(290, 380, '#ef4444', 'Dhamra Feeder');

  // 5. Radar / Cyclone Eye Scan
  if (currentMode === 'radar') {
    const eyeX = 490 + Math.sin(animationFrame * 0.03) * 15;
    const eyeY = 240 + Math.cos(animationFrame * 0.03) * 15;

    // Spiral bands
    ctx.save();
    ctx.translate(eyeX, eyeY);
    ctx.rotate(animationFrame * 0.04);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 40 + i * 45, 0, Math.PI * 1.3);
      ctx.lineWidth = 14 + (rainfallRate / 10);
      ctx.strokeStyle = i === 0 ? 'rgba(239, 68, 68, 0.65)' : (i === 1 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.35)');
      ctx.stroke();
    }
    ctx.restore();

    // Radar scan beam
    ctx.beginPath();
    ctx.moveTo(eyeX, eyeY);
    ctx.arc(eyeX, eyeY, 190, (animationFrame * 0.05) % (Math.PI * 2), ((animationFrame * 0.05) + 0.35) % (Math.PI * 2));
    ctx.closePath();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
  }

  animationFrame++;
  requestAnimationFrame(drawMap);
}

function drawPin(x, y, color, label) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(label, x + 10, y + 3);
}

// UI Event Handlers
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
  });
});

document.getElementById('surgeSlider').addEventListener('input', (e) => {
  surgeHeight = parseFloat(e.target.value);
  document.getElementById('surgeVal').innerText = `${surgeHeight.toFixed(1)} m`;
});

document.getElementById('rainfallSlider').addEventListener('input', (e) => {
  rainfallRate = parseInt(e.target.value);
  document.getElementById('rainVal').innerText = `${rainfallRate} mm/hr`;
});

document.getElementById('runAiBtn').addEventListener('click', async () => {
  const btn = document.getElementById('runAiBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reasoning via Gemini 2.5 Flash Multimodal Engine...';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-microchip"></i> Run Gemini 2.5 Flash Multimodal Risk Assessment';
    
    // Add updated high priority dispatch
    const container = document.getElementById('dispatchContainer');
    const newDispatch = document.createElement('div');
    newDispatch.className = 'dispatch-card critical';
    newDispatch.innerHTML = `
      <div class="dispatch-head">
        <span class="badge red">GEMINI 2.5 FLASH ADVISORY</span>
        <span class="time">SEC AGO</span>
      </div>
      <h3>Automated Municipal Inundation Warning</h3>
      <p>Computed peak surge of <strong>${surgeHeight}m</strong> combined with <strong>${rainfallRate}mm/hr</strong> rainfall triggers extreme threshold along Paradip sector. 
      Recommended Action: Dispatch boats to evacuation pick-up node Bravo; issue immediate feeder breaker cut-off.</p>
    `;
    container.prepend(newDispatch);
  }, 1400);
});

// Modal Logic
const modal = document.getElementById('deployModal');
document.getElementById('showDeployModal').onclick = () => modal.style.display = 'flex';
document.getElementById('closeModal').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Initial Boot
renderAssets();
requestAnimationFrame(drawMap);
