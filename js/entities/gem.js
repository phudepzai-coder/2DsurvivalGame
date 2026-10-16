/**
 * gem.js — Viên XP rơi ra khi quái chết.
 * Bay tán loạn một chút, rồi bị hút về phía người chơi khi vào tầm magnet.
 */
class Gem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = CONFIG.gem.radius + Math.min(4, value * 0.5); // gem giá trị cao thì to hơn
    // Vận tốc tán loạn ban đầu
    const a = rand(0, Math.PI * 2);
    const s = rand(40, 130);
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.dead = false;
    this.wobble = rand(0, Math.PI * 2); // để tạo hiệu ứng lấp lánh
  }

  update(dt, player) {
    // Ma sát — giảm tốc độ tán loạn
    this.vx *= Math.pow(0.02, dt);
    this.vy *= Math.pow(0.02, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.wobble += dt * 6;

    if (!player) return;

    const d2 = dist2(this.x, this.y, player.x, player.y);

    // Trong tầm hút -> bay nhanh dần về người chơi
    if (d2 < player.magnetRange * player.magnetRange) {
      const d = Math.sqrt(d2) || 1;
      const pull = 480 * (1 - d / player.magnetRange) + 200;
      this.x += ((player.x - this.x) / d) * pull * dt;
      this.y += ((player.y - this.y) / d) * pull * dt;
    }

    // Chạm người chơi -> nhặt
    if (d2 < Math.pow(player.radius + this.radius + 6, 2)) {
      this.dead = true;
      player.gainXp(this.value);
    }
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.wobble) * 0.15;
    ctx.save();
    ctx.fillStyle = CONFIG.gem.color;
    ctx.shadowColor = CONFIG.gem.color;
    ctx.shadowBlur = 10;
    // Hình thoi
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.scale(pulse, pulse);
    ctx.fillRect(-this.radius * 0.8, -this.radius * 0.8, this.radius * 1.6, this.radius * 1.6);
    ctx.restore();
  }
}
