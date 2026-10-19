/**
 * spawner.js — Hệ thống spawn quái từ các cạnh màn hình + sự kiện BOSS theo mốc thời gian.
 */
class Spawner {
  constructor(game) {
    this.game = game;
    this.spawnTimer = 1;      // đếm ngược tới đợt spawn kế tiếp
    this.eventIndex = 0;      // sự kiện tiếp theo trong CONFIG.events
  }

  update(dt) {
    const time = this.game.elapsed;

    // 1) Xử lý sự kiện BOSS theo mốc thời gian và độ khó đã chọn
    const events = (this.game && this.game.difficultyData && this.game.difficultyData.events)
      ? this.game.difficultyData.events
      : CONFIG.events;

    while (this.eventIndex < events.length && time >= events[this.eventIndex].time) {
      const ev = events[this.eventIndex];
      this.spawnEnemy(ev.type, time);
      this.game.showBanner(ev.label, 3);
      this.eventIndex++;
    }

    // 2) Spawn quái thường theo interval giảm dần theo thời gian
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.currentInterval(time);
      this.spawnWave(time);
    }
  }

  /** Interval giữa các đợt: giảm dần từ baseInterval về minInterval trong rampMinutes phút */
  currentInterval(time) {
    const s = CONFIG.spawn;
    const t = clamp(time / (s.rampMinutes * 60), 0, 1);
    return s.baseInterval + (s.minInterval - s.baseInterval) * t;
  }

  /** Số quái mỗi đợt: tăng dần theo thời gian */
  currentBatch(time) {
    return CONFIG.spawn.baseBatch + Math.floor(time / 40);
  }

  spawnWave(time) {
    for (let i = 0; i < this.currentBatch(time); i++) {
      // Chọn loại quái ngẫu nhiên theo trọng số, chỉ chọn loại đã mở khóa theo thời gian
      const pool = Object.entries(CONFIG.enemy.types).filter(
        ([, t]) => t.weight > 0 && time >= t.minTime
      );
      const totalWeight = pool.reduce((sum, [, t]) => sum + t.weight, 0);
      let roll = Math.random() * totalWeight;
      let chosen = pool[0][0];
      for (const [name, t] of pool) {
        roll -= t.weight;
        if (roll <= 0) { chosen = name; break; }
      }
      this.spawnEnemy(chosen, time);
    }
  }

  /** Spawn 1 quái ở vị trí ngẫu nhiên ngay ngoài cạnh màn hình */
  spawnEnemy(type, time) {
    if (this.game.enemies.length >= CONFIG.enemy.maxEnemies) return;
    const pos = this.randomEdgePosition();
    this.game.enemies.push(new Enemy(pos.x, pos.y, type, time));
  }

  randomEdgePosition() {
    const W = CONFIG.canvasWidth;
    const H = CONFIG.canvasHeight;
    const m = 50; // khoảng cách ngoài màn hình
    switch (randInt(0, 3)) {
      case 0: return { x: rand(0, W), y: -m };        // trên
      case 1: return { x: W + m, y: rand(0, H) };     // phải
      case 2: return { x: rand(0, W), y: H + m };     // dưới
      default: return { x: -m, y: rand(0, H) };       // trái
    }
  }
}
