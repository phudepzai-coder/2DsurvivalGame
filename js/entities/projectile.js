/**
 * projectile.js — Đạn của người chơi. Bay thẳng theo 1 góc, hết đời thì biến mất.
 */
class Projectile {
  constructor(x, y, angle, damage) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.radius = CONFIG.projectile.radius;
    this.speed = CONFIG.player.projectileSpeed;
    this.life = CONFIG.projectile.life;
    this.dead = false;
  }

  update(dt) {
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = CONFIG.projectile.color;
    ctx.shadowColor = CONFIG.projectile.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    // Vệt đạn
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(
      this.x - Math.cos(this.angle) * 10,
      this.y - Math.sin(this.angle) * 10,
      this.radius * 0.6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
}
