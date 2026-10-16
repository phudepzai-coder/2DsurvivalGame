/**
 * input.js — Quản lý toàn bộ điều khiển game:
 *  - Máy tính 1: Đi theo chuột (giữ chuột trái) / WASD (mouse_wasd) - Tự động bắn
 *  - Máy tính 2: WASD di chuyển + Chuột ngắm bắn thủ công (wasd_aim)
 *  - Điện thoại: Cần điều khiển ảo / Virtual Joystick (touch_joystick) - Tự động bắn
 */
const Input = {
  keys: new Set(),
  mouse: { x: CONFIG.canvasWidth / 2, y: CONFIG.canvasHeight / 2, down: false },
  joystickAxis: { x: 0, y: 0 },
  joystickActive: false,
  controlMode: "mouse_wasd", // 'mouse_wasd' | 'wasd_aim' | 'touch_joystick'
  _canvas: null,
  _joystickZone: null,
  _joystickBase: null,
  _joystickStick: null,

  init(canvas) {
    this._canvas = canvas;

    // Tự động nhận diện thiết bị cảm ứng hoặc nạp cài đặt đã lưu
    const isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    const savedMode = localStorage.getItem("shadowSurvivors.controlMode");
    if (savedMode && ["mouse_wasd", "wasd_aim", "touch_joystick"].includes(savedMode)) {
      this.controlMode = savedMode;
    } else {
      this.controlMode = isTouchDevice ? "touch_joystick" : "mouse_wasd";
    }

    this._setupKeyboard();
    this._setupMouse(canvas);
    this._setupTouchCanvas(canvas);
    this._setupJoystick();
    this.updateJoystickVisibility();
  },

  setControlMode(mode) {
    if (!["mouse_wasd", "wasd_aim", "touch_joystick"].includes(mode)) return;
    this.controlMode = mode;
    try {
      localStorage.setItem("shadowSurvivors.controlMode", mode);
    } catch (e) { /* ignore */ }
    this.updateJoystickVisibility();
  },

  updateJoystickVisibility() {
    if (!this._joystickZone) {
      this._joystickZone = document.getElementById("joystick-zone");
    }
    const isPlaying = window._gameRef && window._gameRef.state === "playing";
    const shouldShow = this.controlMode === "touch_joystick" && isPlaying;

    if (this._joystickZone) {
      this._joystickZone.classList.toggle("hidden", !shouldShow);
    }

    const pauseBtn = document.getElementById("btn-mobile-pause");
    if (pauseBtn) {
      pauseBtn.classList.toggle("hidden", !isPlaying);
      if (window._gameRef) {
        pauseBtn.textContent = window._gameRef.state === "paused" ? "▶️" : "⏸️";
      }
    }
  },

  // ---------- 1. Bàn phím ----------
  _setupKeyboard() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key.toLowerCase());
      // Chặn scroll trang khi bấm mũi tên / space
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    // Mất focus thì xóa hết phím đang giữ (tránh kẹt phím)
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.mouse.down = false;
      this.joystickActive = false;
      this.joystickAxis = { x: 0, y: 0 };
    });
  },

  // ---------- 2. Chuột trên Canvas ----------
  _setupMouse(canvas) {
    const updateMouse = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (clientY - r.top) * (canvas.height / r.height);
    };

    canvas.addEventListener("mousemove", (e) => {
      updateMouse(e.clientX, e.clientY);
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        updateMouse(e.clientX, e.clientY);
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.down = false;
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  },

  // ---------- 3. Cảm ứng trên Canvas (chế độ chạm đi theo ngón tay) ----------
  _setupTouchCanvas(canvas) {
    const updateTouch = (e) => {
      if (this.controlMode === "touch_joystick") return; // chế độ joystick dùng cần gạt riêng
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        this.mouse.x = (t.clientX - r.left) * (canvas.width / r.width);
        this.mouse.y = (t.clientY - r.top) * (canvas.height / r.height);
        this.mouse.down = true;
      }
    };

    canvas.addEventListener("touchstart", (e) => {
      if (this.controlMode === "mouse_wasd") {
        updateTouch(e);
        e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      if (this.controlMode === "mouse_wasd") {
        updateTouch(e);
        e.preventDefault();
      }
    }, { passive: false });

    const endTouch = () => {
      if (this.controlMode === "mouse_wasd") {
        this.mouse.down = false;
      }
    };

    canvas.addEventListener("touchend", endTouch);
    canvas.addEventListener("touchcancel", endTouch);
  },

  // ---------- 4. Cần điều khiển ảo (Virtual Joystick) ----------
  _setupJoystick() {
    this._joystickZone = document.getElementById("joystick-zone");
    this._joystickBase = document.getElementById("joystick-base");
    this._joystickStick = document.getElementById("joystick-stick");
    if (!this._joystickZone || !this._joystickBase || !this._joystickStick) return;

    let activePointerId = null;

    const updateStick = (clientX, clientY) => {
      const rect = this._joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = rect.width / 2 - 10; // khoảng 50px bán kính tối đa

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      this._joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;

      // Bỏ qua vùng chết (deadzone) nhỏ ở tâm để tránh trôi
      if (dist > 5) {
        this.joystickAxis.x = dx / maxRadius;
        this.joystickAxis.y = dy / maxRadius;
        this.joystickActive = true;
      } else {
        this.joystickAxis.x = 0;
        this.joystickAxis.y = 0;
        this.joystickActive = false;
      }
    };

    const onPointerDown = (e) => {
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      try {
        this._joystickZone.setPointerCapture(e.pointerId);
      } catch (err) { /* ignore */ }
      updateStick(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    };

    const onPointerMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      updateStick(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    };

    const onPointerUp = (e) => {
      if (e.pointerId !== activePointerId) return;
      activePointerId = null;
      try {
        this._joystickZone.releasePointerCapture(e.pointerId);
      } catch (err) { /* ignore */ }
      this._joystickStick.style.transform = "translate(0px, 0px)";
      this.joystickAxis = { x: 0, y: 0 };
      this.joystickActive = false;
      e.preventDefault();
      e.stopPropagation();
    };

    this._joystickZone.addEventListener("pointerdown", onPointerDown);
    this._joystickZone.addEventListener("pointermove", onPointerMove);
    this._joystickZone.addEventListener("pointerup", onPointerUp);
    this._joystickZone.addEventListener("pointercancel", onPointerUp);
  },

  /**
   * Trả về vector di chuyển đã chuẩn hóa {x, y} dựa trên chế độ đang chọn:
   *  - Nếu vuốt Joystick ảo: trả về vector của Joystick.
   *  - Nếu chế độ 'mouse_wasd' và đang giữ chuột trái: nhân vật chạy hướng về con trỏ chuột.
   *  - Nếu bấm phím WASD / mũi tên: di chuyển theo phím.
   */
  getAxis(player) {
    // 1) Cần điều khiển ảo (Joystick)
    if (this.joystickActive && (this.joystickAxis.x !== 0 || this.joystickAxis.y !== 0)) {
      return { x: this.joystickAxis.x, y: this.joystickAxis.y };
    }

    // 2) Chế độ đi theo chuột khi nhấn giữ chuột trái
    if (this.controlMode === "mouse_wasd" && this.mouse.down && player) {
      const dx = this.mouse.x - player.x;
      const dy = this.mouse.y - player.y;
      const dist = Math.hypot(dx, dy);
      // Nếu chuột cách người chơi hơn 22px thì di chuyển theo hướng chuột
      if (dist > 22) {
        return { x: dx / dist, y: dy / dist };
      }
      return { x: 0, y: 0 }; // tới vị trí chuột thì dừng lại mượt mà
    }

    // 3) Bàn phím WASD / phím mũi tên
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has("w") || k.has("arrowup")) y -= 1;
    if (k.has("s") || k.has("arrowdown")) y += 1;
    if (k.has("a") || k.has("arrowleft")) x -= 1;
    if (k.has("d") || k.has("arrowright")) x += 1;

    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }
    return { x, y };
  },
};
