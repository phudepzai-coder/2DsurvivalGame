/**
 * game.js — Lõi game: vòng lặp chính, state machine, va chạm, HUD trên canvas.
 *
 * States: 'menu' -> 'playing' <-> 'levelup' / 'paused' -> 'gameover'
 */
class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    Save.init(); // nạp tài khoản + phiên đăng nhập từ localStorage
    this.ui = new UI(this);

    Input.init(this.canvas);
    Sprites.init(); // nạp hình nhân vật/quái từ assets/ (nếu có)
    window._gameRef = this; // để enemy vẽ mắt hướng về player (đơn giản hóa)

    this.state = "splash";
    this.reset();

    this.canvas.addEventListener("click", () => {
      if (this.state === "paused") {
        this.state = "playing";
        Input.updateJoystickVisibility();
      }
    });

    // Vòng lặp chính
    this._lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  /** Thiết lập lại toàn bộ ván chơi (dùng khi start / restart) */
  reset() {
    // Áp dụng nâng cấp vĩnh viễn từ tài khoản (nếu có đăng nhập)
    this.player = new Player(Save.getUpgradeLevels());
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.coins = [];
    this.runSsc = 0; // SSC thu được trong ván này
    this.spawner = new Spawner(this);
    this.elapsed = 0;      // giây đã sống sót
    this.kills = 0;
    this.pendingLevelUps = 0;
    this.shakeTime = 0;    // hiệu ứng rung màn hình
    this.shakeMag = 0;
    this.banner = null;    // { text, timer }
    this.effects = [];     // hiệu ứng skill (sét, vòng xung, lỗ đen...)
    // Cooldown của các skill active { t: còn lại, max: tổng }
    this.skillTimers = {
      chain: { t: 3, max: 4 },
      shockwave: { t: 4, max: 6 },
      blackhole: { t: 8, max: 14 },
      chrono: { t: 10, max: 18 },
    };
  }

  startRun() {
    this.reset();
    this.state = "playing";
    this.ui.hideAll();
    this.ui.showScreen("battle");
  }

  // ============ VÒNG LẶP CHÍNH ============
  loop(now) {
    // dt tính bằng giây, clamp để không "nhảy cóc" khi tab bị ẩn
    const dt = clamp((now - this._lastTime) / 1000, 0, 0.05);
    this._lastTime = now;

    if (this.state === "playing") this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  // ============ UPDATE ============
  update(dt) {
    this.elapsed += dt;
    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.banner) {
      this.banner.timer -= dt;
      if (this.banner.timer <= 0) this.banner = null;
    }

    this.spawner.update(dt);
    this.player.update(dt, this);
    this.updateSkills(dt);
    this.updateEffects(dt);

    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateGems(dt);
    this.updateCoins(dt);

    // Kiểm tra lên cấp
    this.pendingLevelUps += this.player.consumeLevelUps();
    if (this.pendingLevelUps > 0) this.openLevelUp();
  }

  updateProjectiles(dt) {
    for (const p of this.projectiles) {
      p.update(dt);
      if (p.dead) continue;
      // Va chạm đạn <-> quái
      for (const e of this.enemies) {
        if (e.dead) continue;
        const rSum = p.radius + e.radius;
        if (dist2(p.x, p.y, e.x, e.y) < rSum * rSum) {
          e.takeDamage(p.damage, p.x, p.y);
          p.dead = true;
          if (e.dead) this.onEnemyKilled(e, p.damage);
          break; // 1 đạn chỉ trúng 1 mục tiêu
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  updateEnemies(dt) {
    const pl = this.player;
    for (const e of this.enemies) {
      e.update(dt, pl);
      if (e.dead) continue;
      // Va chạm quái <-> người chơi
      const rSum = e.radius + pl.radius;
      if (dist2(e.x, e.y, pl.x, pl.y) < rSum * rSum) {
        pl.takeDamage(e.damage, this);
        if (pl.isDead) return; // game over sẽ xử lý ở onPlayerDeath
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  updateGems(dt) {
    for (const g of this.gems) g.update(dt, this.player);
    this.gems = this.gems.filter((g) => !g.dead);
  }

  updateCoins(dt) {
    for (const c of this.coins) c.update(dt, this.player, this);
    this.coins = this.coins.filter((c) => !c.dead);
  }

  /** Nhặt coin -> cộng vào tổng ván + lưu vào tài khoản (nếu có) */
  addSsc(value) {
    this.runSsc += value;
    Save.addSsc(value); // tự bỏ qua nếu chưa đăng nhập
  }

  // ============ SỰ KIỆN ============
  nearestEnemy(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      const d = dist2(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  onEnemyKilled(e, sourceDamage = 0, allowVoodoo = true) {
    this.kills++;

    // 🔮 Búp Bê Voodoo: quái chết -> con gần nó nhất nhận thêm % sát thương
    const voodooLv = this.player.skills.voodoo || 0;
    if (allowVoodoo && voodooLv > 0 && sourceDamage > 0) {
      let best = null;
      let bestD = Infinity;
      for (const o of this.enemies) {
        if (o === e || o.dead) continue;
        const d = dist2(e.x, e.y, o.x, o.y);
        if (d < bestD) { bestD = d; best = o; }
      }
      if (best) {
        const dmg = sourceDamage * (0.4 + 0.15 * (voodooLv - 1));
        best.takeDamage(dmg);
        if (best.dead) this.onEnemyKilled(best, dmg, false); // không lan tiếp để tránh dây chuyền vô hạn
      }
    }
    if (e.isBoss) {
      this.addShake(12, 0.4);
      // Boss rơi nhiều gem giá trị cao + gem hồi máu lớn
      for (let i = 0; i < 12; i++) {
        this.spawnGem(e.x + rand(-40, 40), e.y + rand(-40, 40), 4);
      }
    } else {
      this.spawnGem(e.x, e.y, e.xpValue);
    }

    // 🪙 Rơi coin SSC theo tỷ lệ từng loại quái
    const drops = { basic: [0.18, 1], fast: [0.18, 1], tank: [0.7, 3], boss: [1, 0] };
    const [chance, value] = drops[e.type] || [0.1, 1];
    if (Math.random() < chance) {
      if (e.isBoss) {
        // Boss rơi 1 mưa coin to
        for (let i = 0; i < 6; i++) {
          this.coins.push(new Coin(e.x + rand(-50, 50), e.y + rand(-50, 50), 5));
        }
      } else {
        this.coins.push(new Coin(e.x, e.y, value));
      }
    }
  }

  spawnGem(x, y, value) {
    // Giới hạn số gem: gộp giá trị vào gem có sẵn nếu quá nhiều
    if (this.gems.length >= CONFIG.gem.maxGems) {
      pick(this.gems).value += value;
      return;
    }
    this.gems.push(new Gem(x, y, value));
  }

  onPlayerHit() {
    this.addShake(6, 0.25);
  }

  // ============ SKILLS ============
  /** Đếm cooldown và kích hoạt các skill active đã học */
  updateSkills(dt) {
    const p = this.player;
    const casters = {
      chain: (lv) => this.castChainLightning(lv),
      shockwave: (lv) => this.castShockwave(lv),
      blackhole: (lv) => this.castBlackHole(lv),
      chrono: (lv) => this.castChrono(lv),
    };
    // Cooldown cơ bản, giảm dần theo level skill
    const cooldownFn = {
      chain: (lv) => 4 - 0.25 * lv,
      shockwave: (lv) => 6 - 0.4 * lv,
      blackhole: (lv) => 14 - lv,
      chrono: (lv) => 18 - 1.5 * lv,
    };

    for (const id of Object.keys(casters)) {
      const lv = p.skills[id] || 0;
      if (lv === 0) continue;
      const timer = this.skillTimers[id];
      timer.t -= dt;
      if (timer.t <= 0) {
        casters[id](lv);
        timer.max = cooldownFn[id](lv);
        timer.t = timer.max;
      }
    }
  }

  /** ⚡ Sét Dây Chuyền: nhảy qua nhiều con quái đứng gần nhau */
  castChainLightning(lv) {
    let current = this.nearestEnemy(this.player.x, this.player.y);
    if (!current) return;

    const points = [{ x: this.player.x, y: this.player.y }];
    const hit = [current];
    const jumps = 3 + lv;
    let dmg = this.player.damage * (2 + 0.5 * lv);
    const chainRange2 = 260 * 260;

    for (let i = 0; i < jumps && current; i++) {
      const wasDead = current.dead;
      current.takeDamage(dmg);
      points.push({ x: current.x, y: current.y });
      if (!wasDead && current.dead) this.onEnemyKilled(current, dmg);
      dmg *= 0.85; // mỗi nhánh yếu dần

      // Tìm con kế tiếp gần con vừa trúng, chưa bị đánh
      let next = null;
      let best = chainRange2;
      for (const e of this.enemies) {
        if (e.dead || hit.includes(e)) continue;
        const d = dist2(current.x, current.y, e.x, e.y);
        if (d < best) { best = d; next = e; }
      }
      current = next;
      if (current) hit.push(current);
    }

    this.effects.push({ type: "lightning", points, life: 0.2, maxLife: 0.2 });
  }

  /** 💥 Sóng Xung Kích: vòng tròn đẩy văng + sát thương quanh người chơi */
  castShockwave(lv) {
    const radius = 130 + 30 * lv;
    const dmg = this.player.damage * (1.5 + 0.6 * lv);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist(e.x, e.y, this.player.x, this.player.y) <= radius + e.radius) {
        e.takeDamage(dmg, this.player.x, this.player.y);
        // Đẩy mạnh hơn bình thường
        const d = dist(e.x, e.y, this.player.x, this.player.y) || 1;
        e.kbx += ((e.x - this.player.x) / d) * 420;
        e.kby += ((e.y - this.player.y) / d) * 420;
        if (e.dead) this.onEnemyKilled(e, dmg);
      }
    }
    this.effects.push({ type: "ring", x: this.player.x, y: this.player.y, r: 20, targetR: radius, life: 0.35, maxLife: 0.35, color: "#ffcc80" });
  }

  /** 🌀 Lỗ Đen: hút quái về 1 điểm rồi nổ (vụ nổ xử lý trong updateEffects) */
  castBlackHole(lv) {
    if (!this.enemies.length) return;
    const t = pick(this.enemies);
    this.effects.push({
      type: "blackhole",
      x: t.x,
      y: t.y,
      life: 1.5,
      maxLife: 1.5,
      pullRadius: 200 + 40 * lv,
      boomRadius: 150 + 20 * lv,
      damage: this.player.damage * (4 + lv),
      exploded: false,
    });
  }

  /** ⏳ Dòng Chảy Thời Gian: chậm toàn bộ quái trên màn hình */
  castChrono(lv) {
    const duration = 2.5 + 0.5 * lv;
    for (const e of this.enemies) {
      e.slowTimer = Math.max(e.slowTimer, duration);
      e.slowFactor = 0.4;
    }
    this.effects.push({ type: "ring", x: this.player.x, y: this.player.y, r: 30, targetR: 900, life: 0.6, maxLife: 0.6, color: "#80d8ff" });
  }

  /** Cập nhật hiệu ứng: lỗ đen hút quái + nổ, các vòng sáng mờ dần */
  updateEffects(dt) {
    for (const fx of this.effects) {
      fx.life -= dt;
      if (fx.type === "blackhole" && fx.life > 0) {
        // Giai đoạn hút quái
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = dist(e.x, e.y, fx.x, fx.y);
          if (d < fx.pullRadius && d > 1) {
            const pull = 420 * (1 - d / fx.pullRadius) + 140;
            e.x += ((fx.x - e.x) / d) * pull * dt;
            e.y += ((fx.y - e.y) / d) * pull * dt;
          }
        }
      }
      // Hết giờ -> NỔ
      if (fx.type === "blackhole" && fx.life <= 0 && !fx.exploded) {
        fx.exploded = true;
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (dist(e.x, e.y, fx.x, fx.y) <= fx.boomRadius + e.radius) {
            e.takeDamage(fx.damage, fx.x, fx.y);
            if (e.dead) this.onEnemyKilled(e, fx.damage);
          }
        }
        this.effects.push({ type: "ring", x: fx.x, y: fx.y, r: 10, targetR: fx.boomRadius, life: 0.4, maxLife: 0.4, color: "#b388ff" });
        this.addShake(10, 0.35);
      }
    }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  /** Vẽ hiệu ứng skill (gọi trong draw, trong vùng bị rung) */
  drawEffects(ctx) {
    for (const fx of this.effects) {
      const a = clamp(fx.life / fx.maxLife, 0, 1);
      if (fx.type === "ring") {
        const r = fx.r + (fx.targetR - fx.r) * (1 - a);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === "lightning") {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = "#fff176";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#fff176";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let i = 0; i < fx.points.length - 1; i++) {
          const p1 = fx.points[i];
          const p2 = fx.points[i + 1];
          ctx.moveTo(p1.x, p1.y);
          // Vẽ zigzag cho giống tia sét
          const segs = 4;
          for (let s = 1; s <= segs; s++) {
            const t = s / segs;
            const jx = s < segs ? rand(-8, 8) : 0;
            const jy = s < segs ? rand(-8, 8) : 0;
            ctx.lineTo(p1.x + (p2.x - p1.x) * t + jx, p1.y + (p2.y - p1.y) * t + jy);
          }
        }
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === "blackhole") {
        ctx.save();
        const grow = 1 - clamp(fx.life / fx.maxLife, 0, 1);
        // Vùng hút (gradient tím)
        ctx.globalAlpha = 0.3 + 0.25 * Math.abs(Math.sin(fx.life * 10));
        const grad = ctx.createRadialGradient(fx.x, fx.y, 5, fx.x, fx.y, fx.pullRadius * (0.4 + 0.6 * grow));
        grad.addColorStop(0, "rgba(30,0,50,0.9)");
        grad.addColorStop(0.5, "rgba(140,60,255,0.35)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.pullRadius, 0, Math.PI * 2);
        ctx.fill();
        // Lõi đen rung lắc
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#12001f";
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 18 + 6 * Math.sin(fx.life * 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#b388ff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  onPlayerDeath() {
    this.state = "gameover";
    this.ui.showGameOver(this.elapsed, this.player.level, this.kills, this.runSsc, Save.loggedIn());
  }

  /** Quay về sảnh chính (sau Game Over) */
  returnToMenu() {
    this.reset();
    this.ui.hideAll();
    this.state = "lobby";
    this.ui.showScreen("lobby");
  }

  openLevelUp() {
    this.state = "levelup";
    const choices = rollUpgrades(3, this.player);
    this.ui.showLevelUp(choices, (upgrade) => {
      upgrade.apply(this.player);
      this.pendingLevelUps--;
      if (this.pendingLevelUps > 0) {
        this.openLevelUp(); // lên nhiều cấp cùng lúc -> chọn tiếp
      } else {
        this.state = "playing";
      }
    });
  }

  showBanner(text, duration) {
    this.banner = { text, timer: duration };
  }

  addShake(mag, duration) {
    this.shakeMag = mag;
    this.shakeTime = duration;
  }

  // ============ DRAW ============
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Rung màn hình khi bị đánh
    ctx.save();
    if (this.shakeTime > 0) {
      ctx.translate(rand(-this.shakeMag, this.shakeMag), rand(-this.shakeMag, this.shakeMag));
    }

    this.drawBackground(ctx);

    const inBattle = this.state === "playing" || this.state === "levelup" || this.state === "paused" || this.state === "gameover";

    if (inBattle) {
      for (const g of this.gems) g.draw(ctx);
      for (const c of this.coins) c.draw(ctx);
      for (const e of this.enemies) e.draw(ctx);
      this.player.draw(ctx);
      for (const p of this.projectiles) p.draw(ctx);
      this.drawEffects(ctx);
    }

    ctx.restore(); // hết rung — HUD không rung

    if (inBattle) this.drawHUD(ctx);

    if (this.state === "paused") this.drawPauseText(ctx);
  }

  drawBackground(ctx) {
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    // Lưới caro mờ
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= CONFIG.canvasWidth; x += 64) {
      ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.canvasHeight);
    }
    for (let y = 0; y <= CONFIG.canvasHeight; y += 64) {
      ctx.moveTo(0, y); ctx.lineTo(CONFIG.canvasWidth, y);
    }
    ctx.stroke();
  }

  drawHUD(ctx) {
    const ctx2 = ctx;
    // ---- Timer (giữa trên) ----
    ctx2.save();
    ctx2.font = "bold 30px 'Segoe UI', sans-serif";
    ctx2.fillStyle = "#fff";
    ctx2.textAlign = "center";
    ctx2.shadowColor = "rgba(0,0,0,0.8)";
    ctx2.shadowBlur = 6;
    ctx2.fillText(formatTime(this.elapsed), CONFIG.canvasWidth / 2, 42);

    // ---- HP bar (góc trên trái) ----
    const hpX = 20, hpY = 20, hpW = 220, hpH = 20;
    const hpRatio = clamp(this.player.hp / this.player.maxHp, 0, 1);
    ctx2.fillStyle = "rgba(0,0,0,0.6)";
    ctx2.fillRect(hpX, hpY, hpW, hpH);
    ctx2.fillStyle = hpRatio > 0.3 ? "#43a047" : "#e53935";
    ctx2.fillRect(hpX, hpY, hpW * hpRatio, hpH);
    ctx2.strokeStyle = "rgba(255,255,255,0.4)";
    ctx2.lineWidth = 2;
    ctx2.strokeRect(hpX, hpY, hpW, hpH);
    ctx2.font = "12px 'Segoe UI', sans-serif";
    ctx2.fillStyle = "#fff";
    ctx2.textAlign = "left";
    ctx2.fillText(
      `HP ${Math.ceil(this.player.hp)} / ${Math.round(this.player.maxHp)}`,
      hpX + 6, hpY + 14
    );

    // ---- XP bar (dưới HP bar) ----
    const xpY = hpY + hpH + 8, xpH = 12;
    const xpRatio = clamp(this.player.xp / this.player.xpToNext, 0, 1);
    ctx2.fillStyle = "rgba(0,0,0,0.6)";
    ctx2.fillRect(hpX, xpY, hpW, xpH);
    ctx2.fillStyle = "#26c6da";
    ctx2.fillRect(hpX, xpY, hpW * xpRatio, xpH);
    ctx2.strokeStyle = "rgba(255,255,255,0.3)";
    ctx2.strokeRect(hpX, xpY, hpW, xpH);
    ctx2.fillStyle = "#9ae6f2";
    ctx2.fillText(`LV ${this.player.level}  (${this.player.xp}/${this.player.xpToNext} XP)`, hpX, xpY + xpH + 14);

    // ---- Kills + SSC thu được (góc trên phải) ----
    ctx2.font = "bold 18px 'Segoe UI', sans-serif";
    ctx2.textAlign = "right";
    ctx2.fillStyle = "#ffab91";
    const killsX = CONFIG.canvasWidth - 75;
    ctx2.fillText(`💀 ${this.kills}`, killsX, 32);
    ctx2.fillStyle = "#ffd54f";
    ctx2.fillText(`🪙 +${this.runSsc} SSC`, killsX, 58);

    // ---- Boss HP bar (dưới timer) ----
    const boss = this.enemies.find((e) => e.isBoss);
    if (boss) {
      const bw = 420, bx = (CONFIG.canvasWidth - bw) / 2, by = 58;
      ctx2.fillStyle = "rgba(0,0,0,0.6)";
      ctx2.fillRect(bx, by, bw, 14);
      ctx2.fillStyle = "#ff1744";
      ctx2.fillRect(bx, by, bw * clamp(boss.hp / boss.maxHp, 0, 1), 14);
      ctx2.strokeStyle = "#fff";
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(bx, by, bw, 14);
      ctx2.font = "bold 12px 'Segoe UI', sans-serif";
      ctx2.fillStyle = "#ffcdd2";
      ctx2.textAlign = "center";
      ctx2.fillText("BOSS", CONFIG.canvasWidth / 2, by + 11);
    }

    // ---- Skill icons + cooldown ----
    const skillIcons = { chain: "⚡", shockwave: "💥", blackhole: "🌀", chrono: "⏳", voodoo: "🔮", bloodpact: "🩸" };
    const learnedSkills = Object.keys(skillIcons).filter((id) => (this.player.skills[id] || 0) > 0);
    // Khi dùng Joystick ở giữa lệch phải, đặt skill icons ở góc dưới bên trái để không bị tay che
    let sx = 20;
    const sy = CONFIG.canvasHeight - 58;
    for (const id of learnedSkills) {
      const lv = this.player.skills[id];
      // Khung skill
      ctx2.fillStyle = "rgba(0,0,0,0.55)";
      ctx2.fillRect(sx, sy, 42, 40);
      ctx2.strokeStyle = "rgba(255,255,255,0.35)";
      ctx2.lineWidth = 1.5;
      ctx2.strokeRect(sx, sy, 42, 40);
      // Icon
      ctx2.font = "19px 'Segoe UI', sans-serif";
      ctx2.textAlign = "center";
      ctx2.fillStyle = "#fff";
      ctx2.fillText(skillIcons[id], sx + 21, sy + 29);
      // Lớp phủ cooldown (chỉ skill active có đếm giờ)
      const timer = this.skillTimers[id];
      if (timer && timer.t > 0) {
        const ratio = clamp(timer.t / timer.max, 0, 1);
        ctx2.fillStyle = "rgba(0,0,0,0.7)";
        ctx2.fillRect(sx, sy, 42, 40 * ratio);
      }
      // Cấp skill
      ctx2.font = "bold 10px 'Segoe UI', sans-serif";
      ctx2.textAlign = "left";
      ctx2.fillStyle = "#ffd54f";
      ctx2.fillText("Lv" + lv, sx + 3, sy + 10);
      sx += 48;
    }

    // ---- Banner thông báo (BOSS xuất hiện...) ----
    if (this.banner) {
      ctx2.font = "bold 34px 'Segoe UI', sans-serif";
      ctx2.textAlign = "center";
      ctx2.globalAlpha = clamp(this.banner.timer, 0, 1);
      ctx2.fillStyle = "#ff5252";
      ctx2.fillText(this.banner.text, CONFIG.canvasWidth / 2, 150);
    }
    ctx2.restore();
  }

  drawPauseText(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    ctx.font = "bold 48px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 - 10);
    ctx.font = "18px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#9aa0a6";
    ctx.fillText("Nhấn P / Esc hoặc chạm màn hình để tiếp tục", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 35);
    ctx.restore();
  }
}

// ============ Pause bằng P / Esc, tự pause khi mất focus ============
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if ((k === "p" || k === "escape") && window._gameRef) {
    const g = window._gameRef;
    if (g.state === "playing") g.state = "paused";
    else if (g.state === "paused") g.state = "playing";
    Input.updateJoystickVisibility();
  }
});
window.addEventListener("blur", () => {
  if (window._gameRef && window._gameRef.state === "playing") {
    window._gameRef.state = "paused";
    Input.updateJoystickVisibility();
  }
});

// Khởi động game
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
