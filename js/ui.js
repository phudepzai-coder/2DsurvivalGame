/**
 * ui.js — Quản lý các overlay DOM:
 *  - Menu chính: tài khoản (đăng nhập/đăng ký) + shop nâng cấp vĩnh viễn bằng SSC
 *  - Bảng chọn nâng cấp khi lên cấp
 *  - Màn hình Game Over
 * HUD trong game (timer, thanh máu, XP, coin) được vẽ trực tiếp trên canvas (xem game.js).
 */
class UI {
  constructor(game) {
    this.game = game;
    this.menuOverlay = document.getElementById("overlay-menu");
    this.levelOverlay = document.getElementById("overlay-levelup");
    this.goOverlay = document.getElementById("overlay-gameover");
    this.cardsEl = document.getElementById("upgrade-cards");
    this.goStats = document.getElementById("go-stats");

    // Phần tử menu
    this.loginForm = document.getElementById("login-form");
    this.accountInfo = document.getElementById("account-info");
    this.inpUsername = document.getElementById("inp-username");
    this.inpPin = document.getElementById("inp-pin");
    this.authMsg = document.getElementById("auth-msg");
    this.accName = document.getElementById("acc-name");
    this.accSsc = document.getElementById("acc-ssc");
    this.shopEl = document.getElementById("meta-shop");

    this.choices = null; // 3 nâng cấp đang hiển thị
    this.onPick = null;  // callback khi chọn

    this._bindMenu();
    document.addEventListener("keydown", (e) => this.handleHotkey(e));
    this.renderMenu(); // vẽ trạng thái ban đầu (tự đăng nhập lại nếu còn phiên)
  }

  // ================= MENU CHÍNH =================
  _bindMenu() {
    const game = this.game;

    document.getElementById("btn-login").addEventListener("click", () => this._auth("login"));
    document.getElementById("btn-register").addEventListener("click", () => this._auth("register"));
    document.getElementById("btn-logout").addEventListener("click", () => {
      Save.logout();
      this.renderMenu();
    });
    document.getElementById("btn-guest").addEventListener("click", () => game.startRun());
    document.getElementById("btn-start").addEventListener("click", () => game.startRun());
    document.getElementById("btn-restart").addEventListener("click", () => game.startRun());
    document.getElementById("btn-menu").addEventListener("click", () => game.returnToMenu());

    // Bộ chọn chế độ điều khiển
    document.querySelectorAll(".ctrl-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        Input.setControlMode(mode);
        this.renderControlSelector();
      });
    });

    // Nút Tạm dừng / Tiếp tục trên HUD (mobile / chuột)
    const pauseBtn = document.getElementById("btn-mobile-pause");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.game.state === "playing") {
          this.game.state = "paused";
          pauseBtn.textContent = "▶️";
        } else if (this.game.state === "paused") {
          this.game.state = "playing";
          pauseBtn.textContent = "⏸️";
        }
        Input.updateJoystickVisibility();
      });
    }

    // Enter trong ô nhập -> đăng nhập
    const enterLogin = (e) => { if (e.key === "Enter") this._auth("login"); };
    this.inpUsername.addEventListener("keydown", enterLogin);
    this.inpPin.addEventListener("keydown", enterLogin);
  }

  /** Xử lý nút Đăng nhập / Đăng ký */
  _auth(mode) {
    const username = this.inpUsername.value;
    const pin = this.inpPin.value;
    const result = mode === "login" ? Save.login(username, pin) : Save.register(username, pin);

    if (result.ok) {
      this.authMsg.textContent = "";
      this.inpUsername.value = "";
      this.inpPin.value = "";
      this.renderMenu();
    } else {
      this.authMsg.textContent = "⚠️ " + result.error;
    }
  }

  /** Vẽ lại toàn bộ menu theo trạng thái đăng nhập hiện tại */
  renderMenu() {
    const logged = Save.loggedIn();

    this.loginForm.classList.toggle("hidden", logged);
    this.accountInfo.classList.toggle("hidden", !logged);

    if (logged) {
      this.accName.textContent = Save.user;
      this.accSsc.textContent = Save.account().ssc;
    }
    this.renderShop();
    this.renderControlSelector();
  }

  /** Đồng bộ trạng thái active của bộ chọn chế độ điều khiển */
  renderControlSelector() {
    document.querySelectorAll(".ctrl-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.mode === Input.controlMode);
    });
  }

  /** Vẽ lưới thẻ nâng cấp vĩnh viễn */
  renderShop() {
    this.shopEl.innerHTML = "";
    const logged = Save.loggedIn();

    for (const u of META_UPGRADES) {
      const lv = Save.getUpgradeLevel(u.id);
      const maxed = lv >= u.maxLevel;
      const cost = maxed ? 0 : u.cost(lv);
      const affordable = logged && Save.canAfford(cost);

      const card = document.createElement("div");
      card.className = "shop-card" + (maxed ? " maxed" : "");
      card.innerHTML = `
        <div class="shop-head">
          <span class="shop-icon">${u.icon}</span>
          <span class="shop-name">${u.name}</span>
        </div>
        <div class="shop-effect">${u.effect(lv)}${maxed ? "" : ` <span class="next">→ ${u.effect(lv + 1)}</span>`}</div>
        <div class="shop-lv">Lv ${lv}/${u.maxLevel}</div>
        <button class="btn buy" ${(!logged || maxed || !affordable) ? "disabled" : ""}>
          ${maxed ? "✔ TỐI ĐA" : `🪙 ${cost}`}
        </button>
      `;

      if (!maxed && logged) {
        card.querySelector(".buy").addEventListener("click", () => {
          if (Save.buyUpgrade(u)) this.renderMenu();
        });
      }
      this.shopEl.appendChild(card);
    }
  }

  showMenu() {
    this.renderMenu();
    this.menuOverlay.classList.remove("hidden");
    Input.updateJoystickVisibility();
  }

  // ================= LEVEL UP =================
  /** Hiển thị bảng chọn nâng cấp. onPick(upgrade) được gọi khi người chơi chọn xong. */
  showLevelUp(choices, onPick) {
    this.choices = choices;
    this.onPick = onPick;
    this.cardsEl.innerHTML = "";

    choices.forEach((u, i) => {
      const card = document.createElement("button");
      card.className = "card";
      card.innerHTML = `
        <div class="card-key">Phím ${i + 1}</div>
        <div class="card-icon">${u.icon}</div>
        <div class="card-name">${u.name}</div>
        <div class="card-desc">${u.desc}</div>
      `;
      card.addEventListener("click", () => this.pick(u));
      this.cardsEl.appendChild(card);
    });

    this.levelOverlay.classList.remove("hidden");
    Input.updateJoystickVisibility();
  }

  pick(upgrade) {
    if (!this.onPick) return;
    this.levelOverlay.classList.add("hidden");
    const cb = this.onPick;
    this.choices = null;
    this.onPick = null;
    cb(upgrade);
    Input.updateJoystickVisibility();
  }

  handleHotkey(e) {
    if (this.game.state !== "levelup" || !this.choices) return;
    const idx = ["1", "2", "3"].indexOf(e.key);
    if (idx >= 0 && this.choices[idx]) this.pick(this.choices[idx]);
  }

  // ================= GAME OVER =================
  showGameOver(elapsed, level, kills, sscEarned, loggedIn) {
    const sscLine = loggedIn
      ? `🪙 Thu được: <b class="gold">+${sscEarned} SSC</b> (đã lưu vào tài khoản)`
      : `🪙 Thu được: <b class="gold">+${sscEarned} SSC</b> <span class="warn">(chưa đăng nhập nên KHÔNG được lưu!)</span>`;

    this.goStats.innerHTML = `
      🕐 Sống sót: <b>${formatTime(elapsed)}</b><br>
      ⭐ Level đạt được: <b>${level}</b><br>
      💀 Quái đã hạ: <b>${kills}</b><br>
      ${sscLine}
    `;
    this.goOverlay.classList.remove("hidden");
    Input.updateJoystickVisibility();
  }

  hideAll() {
    this.menuOverlay.classList.add("hidden");
    this.levelOverlay.classList.add("hidden");
    this.goOverlay.classList.add("hidden");
    Input.updateJoystickVisibility();
  }
}
