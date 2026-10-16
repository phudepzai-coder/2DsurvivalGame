/**
 * upgrades.js — Danh sách nâng cấp khi lên cấp + logic chọn ngẫu nhiên 3 cái.
 * Muốn thêm nâng cấp mới: chỉ cần thêm 1 object vào mảng UPGRADES.
 */
const UPGRADES = [
  {
    id: "maxhp",
    icon: "❤️",
    name: "Max HP +25",
    desc: "Tăng máu tối đa thêm 25 và hồi ngay 25 HP.",
    canOffer: (p) => true,
    apply: (p) => {
      p.maxHp += 25;
      p.hp = Math.min(p.maxHp, p.hp + 25);
    },
  },
  {
    id: "damage",
    icon: "⚔️",
    name: "Damage +25%",
    desc: "Tăng sát thương mỗi viên đạn thêm 25%.",
    canOffer: (p) => true,
    apply: (p) => {
      p.damage *= 1.25;
    },
  },
  {
    id: "attackspeed",
    icon: "⚡",
    name: "Attack Speed +18%",
    desc: "Bắn nhanh hơn (giảm cooldown 18%, tối thiểu 0.12s).",
    canOffer: (p) => true,
    apply: (p) => {
      p.attackCooldown = Math.max(0.12, p.attackCooldown * 0.82);
    },
  },
  {
    id: "speed",
    icon: "👟",
    name: "Move Speed +12%",
    desc: "Di chuyển nhanh hơn 12%.",
    canOffer: (p) => true,
    apply: (p) => {
      p.speed *= 1.12;
    },
  },
  {
    id: "magnet",
    icon: "🧲",
    name: "Magnet +50%",
    desc: "Tăng tầm hút XP gem thêm 50%.",
    canOffer: (p) => p.magnetRange < 600,
    apply: (p) => {
      p.magnetRange *= 1.5;
    },
  },
  {
    id: "regen",
    icon: "✨",
    name: "Regen +1.2/s",
    desc: "Hồi thêm 1.2 máu mỗi giây.",
    canOffer: (p) => true,
    apply: (p) => {
      p.hpRegen += 1.2;
    },
  },
];

/**
 * Chọn ngẫu nhiên `count` nâng cấp khác nhau (mặc định 3).
 * Bảng chọn gồm: nâng cấp chỉ số (UPGRADES) + nâng cấp/học skill mới (SKILLS).
 */
function rollUpgrades(count = 3, player) {
  const available = UPGRADES.filter((u) => !player || u.canOffer(player));

  // Thêm skill còn chưa max level vào bảng chọn
  if (player && player.skills) {
    for (const s of SKILLS) {
      const lv = player.skills[s.id] || 0;
      if (lv < s.maxLevel) {
        available.push({
          id: `skill:${s.id}`,
          icon: s.icon,
          name: lv === 0 ? s.name : `${s.name} → Lv.${lv + 1}`,
          desc: s.desc(lv),
          apply: (p) => s.apply(p),
        });
      }
    }
  }
  // Xáo trộn (Fisher–Yates)
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return available.slice(0, count);
}
