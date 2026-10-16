/**
 * meta.js — Nâng cấp vĩnh viễn mua bằng SSC ở menu (meta-progression).
 * Bonus được áp dụng vào mọi ván chơi mới qua Player constructor.
 */
const META_UPGRADES = [
  {
    id: "damage",
    icon: "⚔️",
    name: "Sát Thương",
    maxLevel: 10,
    effect: (lv) => `+${lv * 6}% damage`,
    cost: (lv) => Math.round(10 * Math.pow(1.6, lv)), // giá level tiếp theo
  },
  {
    id: "maxhp",
    icon: "❤️",
    name: "Máu Tối Đa",
    maxLevel: 10,
    effect: (lv) => `+${lv * 10} HP`,
    cost: (lv) => Math.round(10 * Math.pow(1.6, lv)),
  },
  {
    id: "attackspeed",
    icon: "⚡",
    name: "Tốc Độ Ra Chiêu",
    maxLevel: 10,
    effect: (lv) => `-${lv * 4}% cooldown`,
    cost: (lv) => Math.round(12 * Math.pow(1.6, lv)),
  },
  {
    id: "speed",
    icon: "👟",
    name: "Tốc Độ Di Chuyển",
    maxLevel: 5,
    effect: (lv) => `+${lv * 3}% speed`,
    cost: (lv) => Math.round(8 * Math.pow(1.6, lv)),
  },
  {
    id: "regen",
    icon: "✨",
    name: "Hồi Máu",
    maxLevel: 10,
    effect: (lv) => `+${(lv * 0.2).toFixed(1)} HP/s`,
    cost: (lv) => Math.round(8 * Math.pow(1.6, lv)),
  },
  {
    id: "magnet",
    icon: "🧲",
    name: "Tầm Hút XP",
    maxLevel: 5,
    effect: (lv) => `+${lv * 10}% magnet`,
    cost: (lv) => Math.round(6 * Math.pow(1.6, lv)),
  },
];
