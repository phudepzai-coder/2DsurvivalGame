/**
 * player.js — Người chơi: di chuyển, hồi máu, tự động tấn công.
 */
class Player {
  /**
   * @param {object} meta nâng cấp vĩnh viễn từ tài khoản {metaId: level} (xem meta.js)
   */
  constructor(meta = {}) {
    const p = CONFIG.player;
    const lv = (id) => meta[id] || 0; // level nâng cấp vĩnh viễn

    let eq = { weapon: 1, armor: 1, boots: 1, amulet: 1 };
    try {
      const s = localStorage.getItem("shadowSurvivors.equip");
      if (s) eq = Object.assign(eq, JSON.parse(s));
    } catch (e) {}

    this.x = CONFIG.canvasWidth / 2;
    this.y = CONFIG.canvasHeight / 2;
    this.radius = p.radius;
    this.speed = p.speed * (1 + 0.03 * lv("speed") + 0.025 * ((eq.boots || 1) - 1));
    this.maxHp = p.maxHp + 10 * lv("maxhp") + 25 * ((eq.armor || 1) - 1);
    this.hp = this.maxHp;
    this.hpRegen = p.hpRegenPerSec + 0.2 * lv("regen");
    this.damage = (p.baseDamage + 3 * ((eq.weapon || 1) - 1)) * (1 + 0.06 * lv("damage"));
    // Giảm cooldown 4%/level, không giảm quá 60% tổng thể
    this.attackCooldown = p.baseAttackCooldown * Math.max(0.4, 1 - 0.04 * lv("attackspeed"));
    this.invulnTime = p.invulnTime;
    this.magnetRange = (p.magnetRange + 15 * ((eq.amulet || 1) - 1)) * (1 + 0.1 * lv("magnet"));
    this.pickupRange = p.pickupRange;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = CONFIG.xp.curve(1);

    // Mức độ của từng skill (0 = chưa học)
    this.skills = {};
    SKILLS.forEach((s) => (this.skills[s.id] = 0));

    this._cooldownTimer = 0;
    this._invulnTimer = 0;
    this.facing = 0;       // góc hướng nhìn (để vẽ)
    this.isDead = false;
  }

  update(dt, game) {
    // 1) Di chuyển (truyền this để tính vector đi theo chuột nếu dùng chế độ mouse_wasd)
    const axis = Input.getAxis(this);
    this.x = clamp(this.x + axis.x * this.speed * dt, this.radius, CONFIG.canvasWidth - this.radius);
    this.y = clamp(this.y + axis.y * this.speed * dt, this.radius, CONFIG.canvasHeight - this.radius);
    if (axis.x !== 0 || axis.y !== 0) {
      this.facing = Math.atan2(axis.y, axis.x);
    } else if (Input.controlMode === "wasd_aim" && Input.mouse.down) {
      // Đứng yên nhưng đang ngắm bắn thủ công bằng chuột
      this.facing = Math.atan2(Input.mouse.y - this.y, Input.mouse.x - this.x);
    }

    // 2) Tự hồi máu
    this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);

    // 3) Thời gian bất tử sau khi trúng đòn
    this._invulnTimer = Math.max(0, this._invulnTimer - dt);

    // 4) Tấn công tự động
    this._cooldownTimer -= dt;
    if (this._cooldownTimer <= 0) {
      const fired = this._tryFire(game);
      this._cooldownTimer = fired ? this.attackCooldown : 0.05; // chưa có mục tiêu thì thử lại nhanh
    }
  }

  /**
   * Bắn đạn:
   *  - Ở chế độ 'wasd_aim' khi giữ chuột trái: bắn thủ công theo hướng trỏ chuột.
   *  - Ở các chế độ khác ('mouse_wasd', 'touch_joystick'): tự động ngắm và bắn kẻ địch gần nhất.
   */
  _tryFire(game) {
    let angle = null;

    if (Input.controlMode === "wasd_aim" && Input.mouse.down) {
      angle = Math.atan2(Input.mouse.y - this.y, Input.mouse.x - this.x);
    } else {
      const target = game.nearestEnemy(this.x, this.y);
      if (target) angle = Math.atan2(target.y - this.y, target.x - this.x);
    }

    if (angle === null) return false;

    game.projectiles.push(
      new Projectile(
        this.x + Math.cos(angle) * this.radius,
        this.y + Math.sin(angle) * this.radius,
        angle,
        this.damage
      )
    );
    return true;
  }

  takeDamage(amount, game) {
    if (this._invulnTimer > 0 || this.isDead) return;
    this.hp -= amount;
    this._invulnTimer = this.invulnTime;
    game.onPlayerHit();
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      game.onPlayerDeath();
    }
  }

  gainXp(value) {
    this.xp += value;
  }

  /** Kiểm tra đã đủ XP lên cấp chưa. Trả về số lần lên cấp (có thể >1). */
  consumeLevelUps() {
    let ups = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = CONFIG.xp.curve(this.level);
      ups++;
    }
    return ups;
  }

  draw(ctx) {
    // Nhấp nháy khi đang bất tử
    const blink = this._invulnTimer > 0 && Math.floor(this._invulnTimer * 12) % 2 === 0;

    ctx.save();
    ctx.globalAlpha = blink ? 0.4 : 1;

    // Vòng aura tầm hút gem
    ctx.strokeStyle = "rgba(38, 198, 218, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.magnetRange, 0, Math.PI * 2);
    ctx.stroke();

    // Thân người chơi: ưu tiên sprite từ assets/player.png, thiếu thì vẽ tròn
    const sprite = Sprites.get("player");
    if (sprite) {
      const size = this.radius * 2.9;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.facing); // hình gốc hướng về PHẢI
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = CONFIG.player.color;
      ctx.shadowColor = CONFIG.player.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // "Súng" chỉ hướng nhìn
      ctx.strokeStyle = "#e3f6ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.cos(this.facing) * (this.radius + 10), this.y + Math.sin(this.facing) * (this.radius + 10));
      ctx.stroke();
    }

    ctx.restore();

    // Thanh máu nhỏ trên đầu
    const w = 40;
    const ratio = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(this.x - w / 2, this.y - this.radius - 14, w, 6);
    ctx.fillStyle = ratio > 0.3 ? "#66bb6a" : "#ff5252";
    ctx.fillRect(this.x - w / 2, this.y - this.radius - 14, w * ratio, 6);
  }
}
