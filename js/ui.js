/**
 * ui.js — Quản lý toàn bộ giao diện Mobile-First Gaming UI:
 *  1. Màn hình chờ mở đầu (Splash Screen / Đăng nhập)
 *  2. Sảnh chính với 5 Tab điều hướng ở đáy (Shop, Trang bị, Chiến đấu, Kỹ năng, Sự kiện)
 *  3. Màn hình trận đấu Canvas (HUD, Joystick, Level Up, Game Over)
 *  4. Modal Cài đặt
 */
class UI {
  constructor(game) {
    this.game = game;

    // Các màn hình chính
    this.screenSplash = document.getElementById("screen-splash");
    this.screenLobby = document.getElementById("screen-lobby");
    this.screenBattle = document.getElementById("screen-battle");
    this.gameApp = document.getElementById("game-app");

    // Overlays trong trận
    this.levelOverlay = document.getElementById("overlay-levelup");
    this.goOverlay = document.getElementById("overlay-gameover");
    this.cardsEl = document.getElementById("upgrade-cards");
    this.goStats = document.getElementById("go-stats");

    // Modal cài đặt
    this.modalSettings = document.getElementById("modal-settings");

    // Form Splash
    this.loginForm = document.getElementById("login-form");
    this.accountInfo = document.getElementById("account-info");
    this.inpUsername = document.getElementById("inp-username");
    this.inpPin = document.getElementById("inp-pin");
    this.authMsg = document.getElementById("auth-msg");
    this.accName = document.getElementById("acc-name");
    this.accSsc = document.getElementById("acc-ssc");

    // Lobby Topbar
    this.lobbyUsername = document.getElementById("lobby-username");
    this.lobbySsc = document.getElementById("lobby-ssc");
    this.shopEl = document.getElementById("meta-shop");

    this.currentTab = "battle";
    this.choices = null; // 3 thẻ nâng cấp đang hiển thị
    this.onPick = null;

    this._bindEvents();
    document.addEventListener("keydown", (e) => this.handleHotkey(e));

    // Khởi tạo trạng thái ban đầu: luôn bắt đầu ở Màn hình chờ (Splash)
    this.renderMenu();
    this.showScreen("splash");
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. ĐIỀU HƯỚNG MÀN HÌNH (SCREEN NAVIGATION)
  // ═════════════════════════════════════════════════════════════════
  showScreen(screenName) {
    this.screenSplash.classList.toggle("hidden", screenName !== "splash");
    this.screenLobby.classList.toggle("hidden", screenName !== "lobby");
    this.screenBattle.classList.toggle("hidden", screenName !== "battle");

    if (screenName === "battle") {
      this.gameApp.classList.add("battle-mode");
      Input.updateJoystickVisibility();
    } else {
      this.gameApp.classList.remove("battle-mode");
      Input.updateJoystickVisibility();
      if (screenName === "lobby") {
        this.renderLobby();
        this.switchTab(this.currentTab);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. CHUYỂN ĐỔI 5 TAB Ở SẢNH CHÍNH (BOTTOM NAVIGATION)
  // ═════════════════════════════════════════════════════════════════
  switchTab(tabId) {
    this.currentTab = tabId;

    // Cập nhật class active cho 5 nút điều hướng đáy
    document.querySelectorAll(".nav-tab").forEach((tabBtn) => {
      tabBtn.classList.toggle("active", tabBtn.dataset.tab === tabId);
    });

    // Ẩn/Hiện nội dung của Tab tương ứng
    const tabPanels = {
      shop: document.getElementById("tab-shop"),
      equip: document.getElementById("tab-equip"),
      battle: document.getElementById("tab-battle"),
      skills: document.getElementById("tab-skills"),
      event: document.getElementById("tab-event"),
    };

    Object.keys(tabPanels).forEach((id) => {
      if (tabPanels[id]) {
        tabPanels[id].classList.toggle("hidden", id !== tabId);
      }
    });

    if (tabId === "shop") {
      this.renderShop();
    }
    this.renderControlSelector();
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. GẮN SỰ KIỆN NÚT BẤM (EVENT BINDING)
  // ═════════════════════════════════════════════════════════════════
  _bindEvents() {
    const game = this.game;

    // --- Màn hình Chờ (Splash) ---
    document.getElementById("btn-login").addEventListener("click", () => this._auth("login"));
    document.getElementById("btn-register").addEventListener("click", () => this._auth("register"));
    document.getElementById("btn-logout").addEventListener("click", () => {
      Save.logout();
      this.renderMenu();
    });

    // Nút "VÀO GAME": mở Sảnh chính 5 tab
    document.getElementById("btn-enter-lobby").addEventListener("click", () => {
      this.showScreen("lobby");
    });
    // Nút "Chơi ngay (Khách)"
    document.getElementById("btn-guest").addEventListener("click", () => {
      this.showScreen("lobby");
    });

    // Enter trong ô đăng nhập
    const enterLogin = (e) => { if (e.key === "Enter") this._auth("login"); };
    this.inpUsername.addEventListener("keydown", enterLogin);
    this.inpPin.addEventListener("keydown", enterLogin);

    // --- 5 Tab Điều hướng đáy ---
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // --- Tab 3: Chiến Đấu -> Nút "XUẤT TRẬN" ---
    document.getElementById("btn-start-battle").addEventListener("click", () => {
      game.startRun();
    });

    // --- Bộ chọn kiểu điều khiển (ở Tab Chiến đấu và Modal Cài đặt) ---
    document.querySelectorAll(".ctrl-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        Input.setControlMode(mode);
        this.renderControlSelector();
      });
    });

    // --- Rương may mắn ở Tab Shop ---
    const btnChest = document.getElementById("btn-claim-chest");
    if (btnChest) {
      btnChest.addEventListener("click", () => {
        const chestStatus = document.getElementById("chest-status");
        btnChest.disabled = true;
        const reward = Math.floor(Math.random() * 36) + 15; // 15 - 50 SSC
        Save.addSsc(reward);
        this.renderLobby();
        if (chestStatus) chestStatus.textContent = `🎉 Bạn vừa nhận được +${reward} SSC!`;
        btnChest.textContent = "ĐÃ NHẬN";
      });
    }

    // --- Điểm danh ở Tab Sự kiện ---
    const btnDaily = document.getElementById("btn-daily-claim");
    if (btnDaily) {
      btnDaily.addEventListener("click", () => {
        btnDaily.disabled = true;
        btnDaily.textContent = "✔ Đã nhận";
        Save.addSsc(25);
        this.renderLobby();
        const box = document.getElementById("daily-box-today");
        if (box) box.classList.add("claimed");
      });
    }

    // --- Modal Cài đặt ---
    const btnSettingsOpen = document.getElementById("btn-settings-open");
    const btnSettingsClose = document.getElementById("btn-settings-close");
    const btnSettingsDone = document.getElementById("btn-settings-done");
    const btnSettingsLogout = document.getElementById("btn-settings-logout");

    if (btnSettingsOpen) {
      btnSettingsOpen.addEventListener("click", () => {
        this.modalSettings.classList.remove("hidden");
        const userDisp = document.getElementById("settings-user-display");
        if (userDisp) {
          userDisp.textContent = Save.loggedIn() ? `Tài khoản: ${Save.user}` : "Đang chơi chế độ Khách";
        }
        this.renderControlSelector();
      });
    }
    const closeModal = () => this.modalSettings.classList.add("hidden");
    if (btnSettingsClose) btnSettingsClose.addEventListener("click", closeModal);
    if (btnSettingsDone) btnSettingsDone.addEventListener("click", closeModal);
    if (btnSettingsLogout) {
      btnSettingsLogout.addEventListener("click", () => {
        Save.logout();
        closeModal();
        this.renderMenu();
        this.showScreen("splash");
      });
    }

    // --- Nút Pause trên HUD ---
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

    // --- Game Over Buttons ---
    document.getElementById("btn-restart").addEventListener("click", () => game.startRun());
    document.getElementById("btn-menu").addEventListener("click", () => game.returnToMenu());
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. ĐĂNG NHẬP / ĐĂNG KÝ (FIREBASE ASYNC)
  // ═════════════════════════════════════════════════════════════════
  async _auth(mode) {
    const username = this.inpUsername.value;
    const pin = this.inpPin.value;

    this.authMsg.style.color = "#80cbc4";
    this.authMsg.textContent = mode === "login" ? "⏳ Đang đăng nhập..." : "⏳ Đang đăng ký...";
    const btnLogin = document.getElementById("btn-login");
    const btnReg = document.getElementById("btn-register");
    if (btnLogin) btnLogin.disabled = true;
    if (btnReg) btnReg.disabled = true;

    const result = mode === "login"
      ? await Save.login(username, pin)
      : await Save.register(username, pin);

    if (btnLogin) btnLogin.disabled = false;
    if (btnReg) btnReg.disabled = false;

    if (result.ok) {
      this.authMsg.style.color = "";
      this.authMsg.textContent = "";
      this.inpUsername.value = "";
      this.inpPin.value = "";
      this.renderMenu();
      this.renderLobby();
    } else {
      this.authMsg.style.color = "#ff8a80";
      this.authMsg.textContent = "⚠️ " + result.error;
    }
  }

  /** Đồng bộ thông tin tài khoản trên Màn hình chờ */
  renderMenu() {
    const logged = Save.loggedIn();

    this.loginForm.classList.toggle("hidden", logged);
    this.accountInfo.classList.toggle("hidden", !logged);

    if (logged) {
      this.accName.textContent = Save.user;
      this.accSsc.textContent = Save.account().ssc || 0;
    }
    this.renderLobby();
  }

  /** Đồng bộ thông tin tài khoản trên Sảnh chính */
  renderLobby() {
    const logged = Save.loggedIn();
    const name = logged ? Save.user : "Khách";
    const ssc = logged && Save.account() ? (Save.account().ssc || 0) : 0;

    if (this.lobbyUsername) this.lobbyUsername.textContent = name;
    if (this.lobbySsc) this.lobbySsc.textContent = ssc;
  }

  /** Đồng bộ trạng thái active của bộ chọn chế độ điều khiển */
  renderControlSelector() {
    document.querySelectorAll(".ctrl-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.mode === Input.controlMode);
    });
  }

  /** Vẽ danh sách thẻ nâng cấp vĩnh viễn trong Tab Shop */
  renderShop() {
    if (!this.shopEl) return;
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
        <div class="shop-lv">Cấp ${lv}/${u.maxLevel}</div>
        <button class="btn buy" ${(!logged || maxed || !affordable) ? "disabled" : ""}>
          ${maxed ? "✔ TỐI ĐA" : `🪙 ${cost}`}
        </button>
      `;

      if (!maxed && logged) {
        card.querySelector(".buy").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          btn.textContent = "⏳";
          const ok = await Save.buyUpgrade(u);
          if (ok) {
            this.renderMenu();
            this.renderLobby();
            this.renderShop();
          } else {
            btn.disabled = false;
            btn.textContent = `🪙 ${cost}`;
          }
        });
      }
      this.shopEl.appendChild(card);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. TRẬN ĐẤU: LEVEL UP & GAME OVER
  // ═════════════════════════════════════════════════════════════════
  showLevelUp(choices, onPick) {
    this.choices = choices;
    this.onPick = onPick;
    this.cardsEl.innerHTML = "";

    choices.forEach((u, i) => {
      const card = document.createElement("button");
      card.className = "card";
      card.innerHTML = `
        <div class="card-icon">${u.icon}</div>
        <div class="card-details">
          <div class="card-name">${u.name}</div>
          <div class="card-desc">${u.desc}</div>
        </div>
        <div class="card-key">Phím ${i + 1}</div>
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

  showGameOver(elapsed, level, kills, sscEarned, loggedIn) {
    const sscLine = loggedIn
      ? `🪙 Thu được: <b class="gold">+${sscEarned} SSC</b> (đã lưu cloud Firebase)`
      : `🪙 Thu được: <b class="gold">+${sscEarned} SSC</b> <span class="warn">(chưa đăng nhập nên không lưu)</span>`;

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
    this.levelOverlay.classList.add("hidden");
    this.goOverlay.classList.add("hidden");
    Input.updateJoystickVisibility();
  }
}
