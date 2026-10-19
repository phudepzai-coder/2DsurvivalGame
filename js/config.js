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

  // Sự kiện theo mốc thời gian (giây): spawn BOSS mặc định
  events: [
    { time: 120, type: "boss", label: "⚠️ BOSS XUẤT HIỆN! (phút 2)" },
    { time: 300, type: "boss", label: "⚠️ BOSS THỨ HAI! (phút 5)" },
    { time: 480, type: "boss", label: "⚠️ BOSS CUỐI! (phút 8)" },
  ],

  // Cấu hình Bản đồ (Ải)
  stages: {
    1: {
      id: "1",
      name: "Rừng Bóng Đêm",
      subtitle: "Dark Forest",
      badge: "ẢI 1 · RỪNG BÓNG ĐÊM",
      image: "assets/map-forest.jpg",
      desc: "Khu rừng cổ thụ ngàn năm bị bóng tối xâm chiếm. Quái vật rình rập sau những tán cây phát sáng!",
      targetMinutes: 10,
    },
    2: {
      id: "2",
      name: "Ải 2: Sắp Ra Mắt",
      subtitle: "Đang phát triển",
      locked: true,
      desc: "Vùng đất mới đang được khám phá...",
    }
  },

  // 3 Mức Độ Khó cho Ải 1
  difficulties: {
    easy: {
      id: "easy",
      name: "Dễ (Tân thủ)",
      badge: "DỄ",
      icon: "🟢",
      dotClass: "easy",
      hpMult: 0.85,
      speedMult: 0.85,
      damageMult: 0.85,
      sscMult: 1.0,
      rewardText: "x1.0 SSC",
      desc: "Quái yếu hơn, thích hợp cho tân thủ làm quen và thử nghiệm build kỹ năng.",
      events: [
        { time: 180, type: "boss", label: "⚠️ BOSS XUẤT HIỆN! (phút 3)" },
        { time: 420, type: "boss", label: "⚠️ BOSS CUỐI! (phút 7)" },
      ]
    },
    normal: {
      id: "normal",
      name: "Thường (Tiêu chuẩn)",
      badge: "THƯỜNG",
      icon: "🟡",
      dotClass: "normal",
      hpMult: 1.15,
      speedMult: 1.1,
      damageMult: 1.0,
      sscMult: 1.5,
      rewardText: "x1.5 SSC",
      desc: "Trải nghiệm chuẩn mực, quái chạy nhanh hơn và rơi x1.5 Coin SSC!",
      events: [
        { time: 120, type: "boss", label: "⚠️ BOSS XUẤT HIỆN! (phút 2)" },
        { time: 300, type: "boss", label: "⚠️ BOSS THỨ HAI! (phút 5)" },
        { time: 480, type: "boss", label: "⚠️ BOSS CUỐI! (phút 8)" },
      ]
    },
    nightmare: {
      id: "nightmare",
      name: "Ác Mộng (Cực khó)",
      badge: "ÁC MỘNG",
      icon: "🔴",
      dotClass: "nightmare",
      hpMult: 1.45,
      speedMult: 1.25,
      damageMult: 1.3,
      sscMult: 2.5,
      rewardText: "x2.5 SSC",
      desc: "Quái cực đông và hung tợn! Boss xuất hiện liên tục, rơi x2.5 Coin SSC!",
      events: [
        { time: 90, type: "boss", label: "⚠️ BOSS 1 XUẤT HIỆN! (1p30s)" },
        { time: 210, type: "boss", label: "⚠️ BOSS 2 XUẤT HIỆN! (3p30s)" },
        { time: 330, type: "boss", label: "⚠️ BOSS 3 XUẤT HIỆN! (5p30s)" },
        { time: 450, type: "boss", label: "⚠️ ĐẠI MA VƯƠNG! (7p30s)" },
      ]
    }
  }
};
