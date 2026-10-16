/**
 * coin.js — 🪙 SSC (Shadow Survivors Coin): tiền tệ meta dùng mua nâng cấp vĩnh viễn ở menu.
 * Rơi theo tỷ lệ khi quái chết, bị hút về người chơi giống XP gem.
 */
class Coin {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 7 + Math.min(4, value * 0.4);
    // Văng ra một chút rồi nằm yên
    const a = rand(0, Math.PI * 2);
    const s = rand(50, 150);
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.dead = false;
    this.spin = rand(0, Math.PI * 2);
  }

  update(dt, player, game) {
    // Ma sát
    this.vx *= Math.pow(0.02, dt);
    this.vy *= Math.pow(0.02, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += dt * 4;

    if (!player) return;
    const magnet = player.magnetRange * 1.4; // coin hút xa hơn gem một chút (cho đã tay)
    const d2 = dist2(this.x, this.y, player.x, player.y);

    if (d2 < magnet * magnet) {
      const d = Math.sqrt(d2) || 1;
      const pull = 460 * (1 - d / magnet) + 180;
      this.x += ((player.x - this.x) / d) * pull * dt;
      this.y += ((player.y - this.y) / d) * pull * dt;
    }

    // Nhặt coin -> cộng vào tài khoản (nếu có đăng nhập)
    if (d2 < Math.pow(player.radius + this.radius + 8, 2)) {
      this.dead = true;
      if (game) game.addSsc(this.value);
    }
  }

  draw(ctx) {
    const squash = Math.abs(Math.cos(this.spin)); // xoay 3D giả lập
    ctx.save();
    ctx.fillStyle = "#ffd54f";
    ctx.shadowColor = "#ffd54f";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radius * Math.max(0.25, squash), this.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    // Viền đồng
    ctx.strokeStyle = "#ff8f00";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Chấm sáng
    if (squash > 0.5) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
