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
    this.currentTab = tabId || "battle";

    // Cập nhật class active cho 5 nút điều hướng đáy
    document.querySelectorAll(".nav-tab").forEach((tabBtn) => {
      tabBtn.classList.toggle("active", tabBtn.dataset.tab === this.currentTab);
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
        tabPanels[id].classList.toggle("hidden", id !== this.currentTab);
      }
    });

    // Render giao diện chuyên biệt cho từng tab
    if (this.currentTab === "shop") {
      this.renderShop();
    } else if (this.currentTab === "equip") {
      this.renderEquip();
    } else if (this.currentTab === "battle") {
      this.renderBattleTab();
    } else if (this.currentTab === "skills") {
      this.renderSkillsTab();
    } else if (this.currentTab === "event") {
      this.renderEventTab();
    }
  }

  /** Hiển thị thông báo Toast nổi */
  showToast(msg) {
    const toast = document.getElementById("lobby-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    void toast.offsetWidth;
    toast.classList.add("show");
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 260);
    }, 2200);
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

    // --- Tab 3: Chọn Ải Chiến Đấu ---
    document.querySelectorAll(".stage-card").forEach((card) => {
      card.addEventListener("click", () => {
        const stage = card.dataset.stage;
        this.selectedStage = stage;
        this.renderBattleTab();
        const names = { 1: "Ải 1: Rừng Bóng Đêm", 2: "Ải 2: Hang Dung Nham", 3: "Ải 3: Đỉnh Hư Không" };
        this.showToast(`🗺️ Đã chọn ${names[stage] || "Ải 1"}`);
      });
    });

    // --- Bộ chọn kiểu điều khiển (ở Tab Chiến đấu và Modal Cài đặt) ---
    document.querySelectorAll(".ctrl-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        Input.setControlMode(mode);
        this.renderControlSelector();
      });
    });

    // --- Tab 1: Shop -> Rương may mắn ---
    const btnChest = document.getElementById("btn-claim-chest");
    if (btnChest) {
      btnChest.addEventListener("click", () => {
        const chestStatus = document.getElementById("chest-status");
        btnChest.disabled = true;
        const reward = Math.floor(Math.random() * 36) + 15; // 15 - 50 SSC
        Save.addSsc(reward);
        this.renderLobby();
        this.renderShop();
        if (chestStatus) chestStatus.textContent = `🎉 Bạn vừa nhận được +${reward} SSC!`;
        btnChest.textContent = "ĐÃ NHẬN";
        this.showToast(`🎁 Mở rương thành công: +${reward} SSC!`);
      });
    }

    // --- Tab 1: Shop -> Gói tân thủ ---
    const btnStarter = document.getElementById("btn-claim-starter");
    if (btnStarter) {
      if (localStorage.getItem("shadowSurvivors.starterClaimed") === "true") {
        btnStarter.disabled = true;
        btnStarter.textContent = "ĐÃ NHẬN";
      } else {
        btnStarter.addEventListener("click", () => {
          btnStarter.disabled = true;
          btnStarter.textContent = "ĐÃ NHẬN";
          localStorage.setItem("shadowSurvivors.starterClaimed", "true");
          Save.addSsc(100);
          this.renderLobby();
          this.renderShop();
          const st = document.getElementById("starter-status");
          if (st) st.textContent = "Đã nhận 100 SSC quà tân thủ";
          this.showToast("⚡ Đã nhận 100 SSC Quà Tân Thủ!");
        });
      }
    }

    // --- Tab 2: Trang Bị -> Đổi món túi đồ ---
    const btnWand = document.getElementById("btn-equip-wand");
    if (btnWand) btnWand.addEventListener("click", () => this.showToast("🔮 Đã trang bị Trượng Hư Không!"));
    const btnRing = document.getElementById("btn-equip-ring");
    if (btnRing) btnRing.addEventListener("click", () => this.showToast("💍 Đã trang bị Nhẫn Bạo Kích!"));

    // --- Tab 5: Điểm danh ở Tab Sự kiện ---
    const btnDaily = document.getElementById("btn-daily-claim");
    if (btnDaily) {
      btnDaily.addEventListener("click", () => {
        btnDaily.disabled = true;
        btnDaily.textContent = "✔ Đã nhận";
        localStorage.setItem("shadowSurvivors.dailyClaimed", "true");
        Save.addSsc(25);
        this.renderLobby();
        this.renderEventTab();
        const box = document.getElementById("daily-box-today");
        if (box) box.classList.add("claimed");
        this.showToast("🎁 Điểm danh thành công: Nhận 25 SSC!");
      });
    }

    // --- Tab 5: Nhiệm vụ hàng ngày ---
    const bindQuest = (btnId, qId, reward, qName) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener("click", () => {
          let claimed = {};
          try { claimed = JSON.parse(localStorage.getItem("shadowSurvivors.claimedQuests") || "{}"); } catch(e){}
          if (claimed[qId]) return;
          claimed[qId] = true;
          localStorage.setItem("shadowSurvivors.claimedQuests", JSON.stringify(claimed));
          Save.addSsc(reward);
          this.renderLobby();
          this.renderEventTab();
          this.showToast(`🎯 Hoàn thành ${qName}: +${reward} SSC!`);
        });
      }
    };
    bindQuest("btn-quest-login", "login", 15, "Đăng nhập hôm nay");
    bindQuest("btn-quest-kills", "kills", 20, "Diệt 50 quái vật");
    bindQuest("btn-quest-survive", "survive", 25, "Sống sót 2 phút");
    bindQuest("btn-quest-upgrade", "upgrade", 30, "Cường hóa 1 lần");

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

    for (const u of META_UPGRADES) {
      const lv = Save.getUpgradeLevel(u.id);
      const maxed = lv >= u.maxLevel;
      const cost = maxed ? 0 : u.cost(lv);
      const affordable = Save.canAfford(cost);

      const card = document.createElement("div");
      card.className = "shop-card" + (maxed ? " maxed" : "");
      card.innerHTML = `
        <div class="shop-head">
          <span class="shop-icon">${u.icon}</span>
          <span class="shop-name">${u.name}</span>
        </div>
        <div class="shop-effect">${u.effect(lv)}${maxed ? "" : ` <span class="next">→ ${u.effect(lv + 1)}</span>`}</div>
        <div class="shop-lv">Cấp ${lv}/${u.maxLevel}</div>
        <button class="btn buy" ${maxed || !affordable ? "disabled" : ""}>
          ${maxed ? "✔ TỐI ĐA" : `🪙 ${cost}`}
        </button>
      `;

      if (!maxed) {
        card.querySelector(".buy").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          btn.textContent = "⏳";
          const ok = await Save.buyUpgrade(u);
          if (ok) {
            this.showToast(`✨ Đã nâng cấp ${u.name} lên Cấp ${lv + 1}!`);
            this.renderMenu();
            this.renderLobby();
            this.renderShop();
            if (this.currentTab === "equip") this.renderEquip();
          } else {
            btn.disabled = false;
            btn.textContent = `🪙 ${cost}`;
            this.showToast("⚠️ Không đủ SSC để nâng cấp!");
          }
        });
      }
      this.shopEl.appendChild(card);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 2: TRANG BỊ & TÚI ĐỒ (EQUIPMENT)
  // ═════════════════════════════════════════════════════════════════
  _getEquip() {
    const eq = {
      weapon: { name: "Kiếm Hắc Ám", icon: "🗡️", type: "Vũ khí chính", lv: 1 },
      armor: { name: "Áo Giáp Thép", icon: "🛡️", type: "Giáp ngực", lv: 1 },
      boots: { name: "Giày Gió Nhẹ", icon: "👟", type: "Giày chạy", lv: 1 },
      amulet: { name: "Bùa Hút Hồn", icon: "📿", type: "Dây chuyền", lv: 1 },
    };
    try {
      const s = localStorage.getItem("shadowSurvivors.equip");
      if (s) {
        const parsed = JSON.parse(s);
        Object.keys(parsed).forEach((k) => {
          if (eq[k]) eq[k].lv = parsed[k];
        });
      }
    } catch (e) {}
    return eq;
  }

  _saveEquip(eq) {
    try {
      const out = {};
      Object.keys(eq).forEach((k) => (out[k] = eq[k].lv));
      localStorage.setItem("shadowSurvivors.equip", JSON.stringify(out));
    } catch (e) {}
  }

  renderEquip() {
    const eq = this._getEquip();
    const metaDmg = Save.getUpgradeLevel("damage");
    const metaHp = Save.getUpgradeLevel("maxhp");
    const metaSpd = Save.getUpgradeLevel("speed");
    const metaMag = Save.getUpgradeLevel("magnet");

    // Tính toán lực chiến tổng hợp
    const totalDmg = Math.round(10 * (1 + 0.06 * metaDmg) + eq.weapon.lv * 3);
    const totalHp = Math.round(100 + 10 * metaHp + eq.armor.lv * 25);
    const totalSpd = Math.round(100 * (1 + 0.03 * metaSpd) + eq.boots.lv * 2.5);
    const totalMag = Math.round(100 * (1 + 0.1 * metaMag) + eq.amulet.lv * 15);

    const elDmg = document.getElementById("stat-val-damage");
    const elHp = document.getElementById("stat-val-hp");
    const elSpd = document.getElementById("stat-val-speed");
    const elMag = document.getElementById("stat-val-magnet");

    if (elDmg) elDmg.textContent = totalDmg;
    if (elHp) elHp.textContent = totalHp;
    if (elSpd) elSpd.textContent = totalSpd + "%";
    if (elMag) elMag.textContent = totalMag;

    // 4 Ô trang bị
    const container = document.getElementById("equip-slots-container");
    if (!container) return;
    container.innerHTML = "";

    const slotConfigs = [
      { key: "weapon", statName: (lv) => `ST +${12 + lv * 3}` },
      { key: "armor", statName: (lv) => `Máu +${100 + lv * 25}` },
      { key: "boots", statName: (lv) => `Tốc độ +${10 + Math.round(lv * 2.5)}%` },
      { key: "amulet", statName: (lv) => `Tầm hút +${25 + lv * 15}` },
    ];

    slotConfigs.forEach((cfg) => {
      const item = eq[cfg.key];
      const cost = Math.round(15 * Math.pow(1.5, item.lv - 1));
      const affordable = Save.canAfford(cost);

      const slot = document.createElement("div");
      slot.className = "slot-card active";
      slot.innerHTML = `
        <span class="slot-icon">${item.icon}</span>
        <div class="slot-info">
          <b>${item.name} <span class="slot-lv-tag">Cấp ${item.lv}</span></b>
          <small>${item.type} · ${cfg.statName(item.lv)}</small>
        </div>
        <button class="enhance-btn" ${!affordable ? "disabled" : ""}>
          <span>Cường Hóa</span>
          <small>🪙 ${cost}</small>
        </button>
      `;

      slot.querySelector(".enhance-btn").addEventListener("click", () => {
        if (!Save.canAfford(cost)) {
          this.showToast("⚠️ Không đủ SSC để cường hóa!");
          return;
        }
        Save.addSsc(-cost);
        item.lv += 1;
        this._saveEquip(eq);
        this.renderLobby();
        this.renderEquip();
        this.showToast(`⚔️ Cường hóa ${item.name} lên Cấp ${item.lv} thành công!`);
      });

      container.appendChild(slot);
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 3: CHIẾN ĐẤU (BATTLE)
  // ═════════════════════════════════════════════════════════════════
  renderBattleTab() {
    this.renderControlSelector();

    const stageData = {
      1: {
        badge: "ẢI 1 · RỪNG BÓNG ĐÊM",
        title: "Mục Tiêu Sống Sót: 10 Phút",
        desc: "Boss khổng lồ xuất hiện ở các phút <b>2</b>, <b>5</b> và <b>8</b>!",
      },
      2: {
        badge: "ẢI 2 · HANG DUNG NHAM",
        title: "Độ Khó Cao · Quái Tăng Tốc +20%",
        desc: "Dung nham thiêu đốt, quái chạy nhanh hơn và rơi x1.5 lượng SSC!",
      },
      3: {
        badge: "ẢI 3 · ĐỈNH HƯ KHÔNG",
        title: "Chế Độ Ác Mộng · Thách Thức Tột Đỉnh",
        desc: "Bão hư không hủy diệt! Boss xuất hiện mỗi 90 giây liên tục!",
      },
    };

    const currentStage = this.selectedStage || "1";
    document.querySelectorAll(".stage-card").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.stage === currentStage);
    });

    const info = stageData[currentStage] || stageData[1];
    const elBadge = document.getElementById("battle-stage-badge");
    const elTitle = document.getElementById("battle-stage-title");
    const elDesc = document.getElementById("battle-stage-desc");
    if (elBadge) elBadge.textContent = info.badge;
    if (elTitle) elTitle.textContent = info.title;
    if (elDesc) elDesc.innerHTML = info.desc;
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 4: KỸ NĂNG (SKILLS)
  // ═════════════════════════════════════════════════════════════════
  renderSkillsTab() {
    const container = document.getElementById("skills-catalog-container");
    if (!container) return;
    container.innerHTML = "";

    const catalog = [
      {
        id: "chain",
        icon: "⚡",
        name: "Sét Dây Chuyền",
        type: "Tấn công diện rộng",
        desc: "Tự động phóng tia sét giật nảy liên hoàn qua kẻ địch gần nhau.",
        levels: [
          "Lv 1: Phóng tia sét giật qua 3 quái, sát thương 25",
          "Lv 2: Giật qua 4 quái, giảm 0.25s hồi chiêu",
          "Lv 3: Giật qua 5 quái, sát thương tăng lên 50",
          "Lv 4: Giật qua 6 quái, giảm hồi chiêu còn 3 giây",
          "Lv 5 (Tối thượng): Giật qua 8 quái, sát thương 100, giật kép!",
        ],
        synergy: "Gợi ý: Dùng kèm 🌀 Lỗ Đen Không Gian để quét sạch bầy quái gom lại.",
      },
      {
        id: "shockwave",
        icon: "💥",
        name: "Sóng Xung Kích",
        type: "Khống chế đẩy lùi",
        desc: "Phát ra luồng sóng chấn động đẩy văng và gây sát thương quái áp sát.",
        levels: [
          "Lv 1: Bán kính 120px, sát thương 30, đẩy lùi kẻ địch",
          "Lv 2: Bán kính 150px, sát thương 45, hồi chiêu 5.2s",
          "Lv 3: Bán kính 180px, sát thương 65, đẩy lùi mạnh hơn",
          "Lv 4: Bán kính 210px, sát thương 90, hồi chiêu 4.4s",
          "Lv 5 (Tối thượng): Bán kính 260px, sát thương 140 cực đại!",
        ],
        synergy: "Gợi ý: Cứu tinh số 1 khi đàn quái đông bao vây chặt lấy bạn.",
      },
      {
        id: "blackhole",
        icon: "🌀",
        name: "Lỗ Đen Không Gian",
        type: "Hút quái hủy diệt",
        desc: "Mở hố đen hút toàn bộ quái vật lại gần tâm điểm rồi phát nổ lớn.",
        levels: [
          "Lv 1: Hút bán kính 140px trong 1.5s, phát nổ 40 sát thương",
          "Lv 2: Bán kính 170px, nổ 60 sát thương, hồi chiêu 12s",
          "Lv 3: Bán kính 200px, nổ 85 sát thương, lực hút mạnh hơn",
          "Lv 4: Bán kính 230px, nổ 115 sát thương, hồi chiêu 10s",
          "Lv 5 (Tối thượng): Bán kính 280px, nổ hủy diệt 180 sát thương!",
        ],
        synergy: "Gợi ý: Kết hợp hoàn hảo với ⚡ Sét Dây Chuyền và đạn bốc cháy.",
      },
      {
        id: "chrono",
        icon: "⏳",
        name: "Dòng Chảy Thời Gian",
        type: "Khống chế toàn bản đồ",
        desc: "Bóp nghẹt thời gian, làm chậm 60% toàn bộ chuyển động quái vật.",
        levels: [
          "Lv 1: Làm chậm 60% trong 2.5 giây toàn màn hình",
          "Lv 2: Thời gian duy trì 3.0 giây, giảm hồi chiêu còn 15s",
          "Lv 3: Thời gian duy trì 3.5 giây, làm chậm cả tốc độ ra đòn của Boss",
          "Lv 4: Thời gian duy trì 4.0 giây, giảm hồi chiêu còn 12s",
          "Lv 5 (Tối thượng): Làm chậm 70% trong 5.0 giây, thời gian gần như đóng băng!",
        ],
        synergy: "Gợi ý: Cực kỳ hữu dụng ở phút 2, 5, 8 khi Boss khổng lồ xuất hiện.",
      },
      {
        id: "voodoo",
        icon: "🔮",
        name: "Búp Bê Voodoo",
        type: "Nội tại nguyền rủa",
        desc: "Khi 1 quái vật chết, kẻ địch đứng gần nó nhất cũng phải nhận sát thương.",
        levels: [
          "Lv 1: Truyền 40% sát thương kết liễu sang 1 quái gần nhất",
          "Lv 2: Truyền 55% sát thương sang 1 quái gần nhất",
          "Lv 3: Truyền 70% sát thương sang 2 quái lân cận",
          "Lv 4: Truyền 85% sát thương sang 2 quái lân cận",
          "Lv 5 (Tối thượng): Truyền 100% sát thương sang 3 quái cùng lúc!",
        ],
        synergy: "Gợi ý: Kỹ năng dọn dẹp bầy quái số lượng lớn nhanh nhất game.",
      },
      {
        id: "bloodpact",
        icon: "🩸",
        name: "Hợp Đồng Máu",
        type: "Nội tại cuồng chiến",
        desc: "Đánh đổi sinh mệnh: Giảm Max HP để nhận lấy tăng vọt sát thương đạn!",
        levels: [
          "Lv 1: Giảm 15% Max HP, tăng +35% toàn bộ sát thương đạn",
          "Lv 2: Tăng thêm +35% sát thương đạn (Tổng +70%)",
          "Lv 3 (Tối thượng): Tăng thêm +40% sát thương đạn (Tổng +110% sát thương)!",
        ],
        synergy: "Gợi ý: Hãy mua thêm nâng cấp Hồi Máu trong Shop để bù lại lượng HP.",
      },
    ];

    catalog.forEach((s) => {
      const entry = document.createElement("div");
      entry.className = "skill-entry";
      entry.innerHTML = `
        <div class="skill-entry-header">
          <div class="skill-entry-icon">${s.icon}</div>
          <div class="skill-entry-summary">
            <div class="skill-entry-title">
              <b>${s.name}</b>
              <span class="skill-type-tag">${s.type}</span>
            </div>
            <p>${s.desc}</p>
          </div>
          <span class="skill-expand-arrow">▼</span>
        </div>
        <div class="skill-levels-detail">
          <div class="skill-progression-list">
            ${s.levels.map((txt, i) => `
              <div class="prog-item">
                <span class="prog-badge">Cấp ${i + 1}</span>
                <span class="prog-text">${txt}</span>
              </div>
            `).join("")}
            <div class="prog-item" style="margin-top: 4px; color: var(--accent-gold);">
              <small>💡 ${s.synergy}</small>
            </div>
          </div>
        </div>
      `;

      entry.addEventListener("click", () => {
        entry.classList.toggle("expanded");
      });

      container.appendChild(entry);
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 5: SỰ KIỆN & ĐIỂM DANH (EVENT)
  // ═════════════════════════════════════════════════════════════════
  renderEventTab() {
    // Điểm danh hôm nay
    const btnDaily = document.getElementById("btn-daily-claim");
    const isDailyClaimed = localStorage.getItem("shadowSurvivors.dailyClaimed") === "true";
    if (btnDaily) {
      if (isDailyClaimed) {
        btnDaily.disabled = true;
        btnDaily.textContent = "✔ Đã nhận";
        const box = document.getElementById("daily-box-today");
        if (box) box.classList.add("claimed");
      } else {
        btnDaily.disabled = false;
        btnDaily.textContent = "NHẬN 25🪙";
      }
    }

    // Nhiệm vụ ngày
    const quests = [
      { id: "login", btnId: "btn-quest-login", reward: 15 },
      { id: "kills", btnId: "btn-quest-kills", reward: 20 },
      { id: "survive", btnId: "btn-quest-survive", reward: 25 },
      { id: "upgrade", btnId: "btn-quest-upgrade", reward: 30 },
    ];

    let claimedQuests = {};
    try {
      claimedQuests = JSON.parse(localStorage.getItem("shadowSurvivors.claimedQuests") || "{}");
    } catch (e) {}

    quests.forEach((q) => {
      const btn = document.getElementById(q.btnId);
      if (btn) {
        if (claimedQuests[q.id]) {
          btn.disabled = true;
          btn.textContent = "✔ Đã nhận";
        } else {
          btn.disabled = false;
          btn.textContent = "Nhận";
        }
      }
    });
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
