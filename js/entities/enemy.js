/**
 * enemy.js — Kẻ địch. 4 loại: basic / fast / tank / boss.
 * Chỉ số được scale theo thời gian sống sót (càng lâu càng khỏe).
 */
class Enemy {
  /**
   * @param {number} x,y vị trí spawn
   * @param {string} type 'basic' | 'fast' | 'tank' | 'boss'
   * @param {number} time thời gian đã sống sót (giây) — dùng để scale chỉ số
   */
  constructor(x, y, type, time) {
    const base = CONFIG.enemy.types[type];
    this.type = type;
    this.x = x;
    this.y = y;

    const minutes = time / 60;
    this.maxHp = Math.round(base.hp * (1 + minutes * 0.4));       // +40% HP mỗi phút
    this.hp = this.maxHp;
    this.speed = base.speed * (1 + Math.min(0.5, minutes * 0.08)); // tăng nhẹ tốc độ, tối đa +50%
    this.damage = base.damage * (1 + minutes * 0.15);              // +15% sát thương mỗi phút
    this.radius = base.radius;
    this.color = base.color;
    this.xpValue = base.xp;
    this.isBoss = type === "boss";

    // Knockback khi trúng đạn
    this.kbx = 0;
    this.kby = 0;
    this.dead = false;
    this.hitFlash = 0; // nhấp nháy trắng khi vừa trúng đòn

    // Làm chậm (skill Dòng Chảy Thời Gian)
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.aimAngle = 0; // hướng nhìn (để xoay sprite)
  }

  update(dt, player) {
    // Hết thời gian bị chậm -> trở lại bình thường
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }
    if (player && !player.isDead) {
      const d = dist(this.x, this.y, player.x, player.y) || 1;
      this.x += ((player.x - this.x) / d) * this.speed * this.slowFactor * dt;
      this.y += ((player.y - this.y) / d) * this.speed * this.slowFactor * dt;
      this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x); // hướng nhìn (để xoay sprite)
    }
    // Áp dụng & giảm dần knockback
    this.x += this.kbx * dt;
    this.y += this.kby * dt;
    this.kbx *= Math.pow(0.001, dt);
    this.kby *= Math.pow(0.001, dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 6);
  }

  takeDamage(amount, fromX, fromY) {
    this.hp -= amount;
    this.hitFlash = 1;
    // Đẩy lùi nhẹ theo hướng đạn bay
    if (fromX !== undefined) {
      const d = dist(fromX, fromY, this.x, this.y) || 1;
      const kb = this.isBoss ? 30 : 140;
      this.kbx += ((this.x - fromX) / d) * kb;
      this.kby += ((this.y - fromY) / d) * kb;
    }
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx) {
    // Ưu tiên sprite từ assets/ (enemy-basic.png, boss.png...), thiếu thì vẽ tròn
    const spriteKey = this.isBoss ? "boss" : `enemy-${this.type}`;
    const sprite = Sprites.get(spriteKey);

    if (sprite) {
      const size = this.radius * 2.9;
      ctx.save();
      if (this.isBoss) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 24;
      }
      ctx.translate(this.x, this.y);
      ctx.rotate(this.aimAngle); // hình gốc hướng về PHẢI
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      // Nháy trắng khi vừa trúng đòn (đặt vòng tròn mờ đè lên)
      if (this.hitFlash > 0.01) {
        ctx.save();
        ctx.globalAlpha = this.hitFlash * 0.5;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.fillStyle = this.hitFlash > 0.01 ? "#ffffff" : this.color;
      if (this.isBoss) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 24;
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // "Mắt" quái hướng về người chơi cho sinh động
      if (!this.isBoss) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath();
        ctx.arc(
          this.x + Math.cos(this.aimAngle) * this.radius * 0.4,
          this.y + Math.sin(this.aimAngle) * this.radius * 0.4,
          this.radius * 0.32,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Thanh máu nhỏ (chỉ hiện khi bị mất máu)
    if (this.hp < this.maxHp) {
      const w = this.radius * 2;
      const ratio = clamp(this.hp / this.maxHp, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, w, 5);
      ctx.fillStyle = this.isBoss ? "#ff5252" : "#66bb6a";
      ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, w * ratio, 5);
    }

    // Vòng sáng xanh khi đang bị làm chậm (skill Dòng Chảy Thời Gian)
    if (this.slowTimer > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(128, 216, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
