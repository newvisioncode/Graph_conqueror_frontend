
const canvas = document.getElementById("mapCanvas");
const svgLayer = document.getElementById("castleLayer");
const ctx = canvas.getContext("2d");
const mapSvg = new Image();
mapSvg.src = 'svg/map.svg'; 

let castles = []; 
let offsetX = 0, offsetY = 0;
let scale = 0.1;
let capturedStatus = {}; 
let alreadyCaptured = {}; 

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// لود اطلاعات قلعه‌ها از فایل JSON
function loadCastles() {
  fetch('castles.json?' + new Date().getTime()) 
    .then(res => res.json())
    .then(data => {
      castles = data;
      capturedStatus = {}; 
      console.log("قلعه‌ها: ", castles); 
      drawMap();
      drawCastles();
    })
    .catch(error => console.error("خطا در لود داده‌ها: ", error));
}

mapSvg.onload = () => {
  drawMap();
  drawCastles();
  console.log("نقشه لود شد", mapSvg.width, mapSvg.height);
};

// رسم نقشه اصلی
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.drawImage(mapSvg, 0, 0);
}

// رسم قلعه‌ها
function drawCastles() {
  svgLayer.innerHTML = '';

  const compressionFactor = 0.63; 

  castles.forEach(castle => {
    const x = castle.X * compressionFactor * scale + offsetX;
    const y = castle.Y * compressionFactor * scale + offsetY;

    // تصویر قلعه قبل از فتح
    const castleIcon = document.createElementNS("http://www.w3.org/2000/svg", "image");
    castleIcon.setAttributeNS(null, 'href', capturedStatus[castle.Name] ? 'svg/captured-castle.svg' : 'svg/castle.svg'); // بررسی وضعیت فتح
    castleIcon.setAttributeNS(null, 'x', x - 16); 
    castleIcon.setAttributeNS(null, 'y', y - 16);
    castleIcon.setAttributeNS(null, 'width', 32);
    castleIcon.setAttributeNS(null, 'height', 32);
    castleIcon.setAttributeNS(null, 'title', castle.Name);

    svgLayer.appendChild(castleIcon);

    // اضافه کردن نام قلعه زیر تصویر آن
    const castleName = document.createElementNS("http://www.w3.org/2000/svg", "text");
    castleName.setAttributeNS(null, 'x', x);
    castleName.setAttributeNS(null, 'y', y + 25); 
    castleName.setAttributeNS(null, 'text-anchor', 'middle');
    castleName.setAttributeNS(null, 'font-size', '12');
    castleName.setAttributeNS(null, 'fill', '#000'); 
    castleName.setAttributeNS(null, 'fill', '#e9dcc4');
castleName.setAttributeNS(null, 'font-family', 'IranYekan'); 

castleName.textContent = castle.Name;

    svgLayer.appendChild(castleName);

    // فقط به قلعه‌های فتح‌شده انیمیشن می‌دهیم
    if (castle.isCaptured && !capturedStatus[castle.Name]) {
      capturedStatus[castle.Name] = true; 
      castleIcon.classList.add('animate__animated', 'animate__fadeOut');
      castleIcon.addEventListener('animationend', () => {
      
        castleIcon.setAttributeNS(null, 'href', 'svg/captured-castle.svg'); 
        castleIcon.classList.remove('animate__fadeOut');
        castleIcon.classList.add('animate__fadeIn'); 

        castleIcon.addEventListener('animationend', () => {
          castleIcon.classList.remove('animate__fadeIn'); 
        });
      });
    }
  });
}

// بروزرسانی نقشه و قلعه‌ها
function updateView() {
  drawMap();
  drawCastles();
}

// محدود کردن حرکت نقشه
function clampOffsets() {
  const maxOffsetX = -(mapSvg.width * scale - canvas.width);
  const maxOffsetY = -(mapSvg.height * scale - canvas.height);
  offsetX = Math.min(0, Math.max(offsetX, maxOffsetX));
  offsetY = Math.min(0, Math.max(offsetY, maxOffsetY));
}

// جابجایی با موس
let isDragging = false, lastX = 0, lastY = 0;

canvas.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});

canvas.addEventListener("mousemove", e => {
  if (!isDragging) return;

  const deltaX = e.offsetX - lastX;
  const deltaY = e.offsetY - lastY;

  offsetX += deltaX / scale;
  offsetY += deltaY / scale;

  lastX = e.offsetX;
  lastY = e.offsetY;

  clampOffsets();
  updateView();
});

canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

// زوم با موس
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const scaleFactor = 1.1;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  const worldX = (mouseX - offsetX * scale) / scale;
  const worldY = (mouseY - offsetY * scale) / scale;

  scale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
  scale = Math.min(2, Math.max(0.05, scale));

  offsetX = -(worldX * scale - mouseX) / scale;
  offsetY = -(worldY * scale - mouseY) / scale;

  clampOffsets();
  updateView();
});

loadCastles();
