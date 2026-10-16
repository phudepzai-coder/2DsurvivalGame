/**
 * config.js — Toàn bộ hằng số cân bằng game.
 * Muốn chỉnh độ khó / tốc độ / sát thương... chỉ cần sửa ở đây.
 */
const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,

  player: {
    radius: 16,
    speed: 260,            // px/giây
    maxHp: 100,
    hpRegenPerSec: 0.6,    // tự hồi máu
    baseDamage: 12,
    baseAttackCooldown: 0.5, // giây giữa 2 phát bắn
    invulnTime: 0.6,       // bất tử tạm thời sau khi bị đánh (giây)
    projectileSpeed: 540,
    pickupRange: 26,       // bán kính nhặt gem
    magnetRange: 110,      // bán kính hút gem
    color: "#4fc3f7",
  },

  xp: {
    // Công thức XP cần để lên cấp theo level
    curve: (level) => 8 + (level - 1) * 5,
  },

  enemy: {
    // Thông số gốc của từng loại quái (được scale theo thời gian)
    types: {
      basic: { radius: 13, hp: 20, speed: 95, damage: 10, xp: 1, color: "#e74c3c", weight: 10, minTime: 0 },
      fast:  { radius: 9,  hp: 12, speed: 175, damage: 6,  xp: 1, color: "#e67e22", weight: 6, minTime: 60 },
      tank:  { radius: 24, hp: 90, speed: 55, damage: 18, xp: 4, color: "#8e44ad", weight: 4, minTime: 150 },
      boss:  { radius: 46, hp: 1500, speed: 45, damage: 35, xp: 0, color: "#ff1744", weight: 0, minTime: 999999 }, // boss chỉ spawn theo sự kiện
    },
    maxEnemies: 260, // giới hạn để tránh lag
  },

  gem: {
    radius: 6,
    maxGems: 250, // quá số này thì gộp giá trị vào gem cũ
    color: "#26c6da",
  },

  projectile: {
    radius: 5,
    life: 1.6,     // giây tồn tại
    color: "#fff176",
  },

  spawn: {
    baseInterval: 1.3,     // giây giữa các đợt spawn lúc đầu
    minInterval: 0.3,      // interval nhỏ nhất (cuối game)
    rampMinutes: 6,        // sau 6 phút thì chạm minInterval
    baseBatch: 1,          // số quái/đợt lúc đầu
  },

  // Sự kiện theo mốc thời gian (giây): spawn BOSS
  events: [
    { time: 120, type: "boss", label: "⚠️ BOSS XUẤT HIỆN! (phút 2)" },
    { time: 300, type: "boss", label: "⚠️ BOSS THỨ HAI! (phút 5)" },
    { time: 480, type: "boss", label: "⚠️ BOSS CUỐI! (phút 8)" },
  ],
};
