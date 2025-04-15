 const canvas = document.getElementById("mapCanvas");
    const svgLayer = document.getElementById("castleLayer");
    const ctx = canvas.getContext("2d");
    const mapSvg = new Image();
    mapSvg.src = 'svg/map.svg';

    let castles = [];
    let offsetX = 0, offsetY = 0;
    let scale = 0.1;
    let capturedStatus = {};

    // تنظیم ابعاد به طور خودکار
    function setCanvasSize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    setCanvasSize();

    // بارگذاری قلعه‌ها
    function loadCastles() {
      fetch('castles.json?' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
          castles = data;
          capturedStatus = {};
          drawMap();
          drawCastles();
        })
        .catch(error => console.error("خطا در لود داده‌ها: ", error));
    }

    mapSvg.onload = () => {
      drawMap();
      drawCastles();
    };

    // رسم نقشه
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

        const castleIcon = document.createElementNS("http://www.w3.org/2000/svg", "image");
        castleIcon.setAttributeNS(null, 'href', capturedStatus[castle.Name] ? 'svg/captured-castle.svg' : 'svg/castle.svg');
        castleIcon.setAttributeNS(null, 'x', x - 16);
        castleIcon.setAttributeNS(null, 'y', y - 16);
        castleIcon.setAttributeNS(null, 'width', 32);
        castleIcon.setAttributeNS(null, 'height', 32);
        castleIcon.setAttributeNS(null, 'title', castle.Name);
        svgLayer.appendChild(castleIcon);

        const castleName = document.createElementNS("http://www.w3.org/2000/svg", "text");
        castleName.setAttributeNS(null, 'x', x);
        castleName.setAttributeNS(null, 'y', y + 25);
        castleName.setAttributeNS(null, 'text-anchor', 'middle');
        castleName.setAttributeNS(null, 'font-size', '12');
        castleName.setAttributeNS(null, 'fill', '#e9dcc4');
        castleName.setAttributeNS(null, 'font-family', 'IranYekan');
        castleName.textContent = castle.Name;
        svgLayer.appendChild(castleName);

        // انیمیشن فتح قلعه
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

    // محدود کردن حرکت
    function clampOffsets() {
      const maxOffsetX = -(mapSvg.width * scale - canvas.width);
      const maxOffsetY = -(mapSvg.height * scale - canvas.height);
      offsetX = Math.min(0, Math.max(offsetX, maxOffsetX));
      offsetY = Math.min(0, Math.max(offsetY, maxOffsetY));
    }

    // حرکت نرم
    let isDragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener("mousedown", e => {
      isDragging = true;
      lastX = e.offsetX;
      lastY = e.offsetY;
    });
    canvas.addEventListener("mousemove", e => {
      if (!isDragging) return;
      const deltaX = (e.offsetX - lastX) * 0.3;
      const deltaY = (e.offsetY - lastY) * 0.3;
      offsetX += deltaX / scale;
      offsetY += deltaY / scale;
      lastX = e.offsetX;
      lastY = e.offsetY;
      clampOffsets();
      drawMap();
      drawCastles();
    });
    canvas.addEventListener("mouseup", () => isDragging = false);
    canvas.addEventListener("mouseleave", () => isDragging = false);

    // زوم نرم
    canvas.addEventListener("wheel", e => {
      e.preventDefault();

      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const worldX = (mouseX - offsetX) / scale;
      const worldY = (mouseY - offsetY) / scale;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(2, Math.max(0.05, scale * zoomFactor));

      offsetX = mouseX - worldX * newScale;
      offsetY = mouseY - worldY * newScale;
      scale = newScale;

      clampOffsets();
      drawMap();
      drawCastles();
    });

    //  Toast نمایش پیام
    function showToast(text) {
      Toastify({
        text: text,
        duration: 4000,
        gravity: "top",
        position: "right",
        backgroundColor: "#2b2b2b",
        stopOnFocus: true
      }).showToast();
    }

    //  شبیه‌سازی وب‌سوکت
    setTimeout(() => {
      const fakeMessage = {
        type: "castleCaptured",
        data: {
          castleName: "قلعه 3",
          by: "گروه آذرخش"
        }
      };

      // پیام قلعه فتح شده
      if (fakeMessage.type === "castleCaptured") {
        castles = castles.map(c =>
          c.Name === fakeMessage.data.castleName ? { ...c, isCaptured: true } : c
        );
        showToast(`🎉 ${fakeMessage.data.by} قلعه ${fakeMessage.data.castleName} را فتح کرد!`);
        drawCastles();
      }
    }, 5000);

    loadCastles();

    // هندل ریسایز 
    window.addEventListener('resize', () => {
      setCanvasSize();

      // حفظ مرکز نقشه
      const prevWidth = canvas.width;
      const prevHeight = canvas.height;

      const dx = (canvas.width - prevWidth) / 2;
      const dy = (canvas.height - prevHeight) / 2;
      offsetX += dx / scale;
      offsetY += dy / scale;

      drawMap();
      drawCastles();
    });

    // لمس برای موبایل و تبلت
    let isTouching = false, lastTouchX = 0, lastTouchY = 0;
    canvas.addEventListener("touchstart", e => {
      isTouching = true;
      lastTouchX = e.touches[0].pageX;
      lastTouchY = e.touches[0].pageY;
    });
    canvas.addEventListener("touchmove", e => {
      if (!isTouching) return;
      const deltaX = (e.touches[0].pageX - lastTouchX) * 0.3;
      const deltaY = (e.touches[0].pageY - lastTouchY) * 0.3;
      offsetX += deltaX / scale;
      offsetY += deltaY / scale;
      lastTouchX = e.touches[0].pageX;
      lastTouchY = e.touches[0].pageY;
      clampOffsets();
      drawMap();
      drawCastles();
    });
    canvas.addEventListener("touchend", () => isTouching = false);