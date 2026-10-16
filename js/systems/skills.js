/**
 * skills.js — Hệ thống kỹ năng (skill) độc đáo, tách khỏi nâng cấp chỉ số thường.
 *
 * 2 loại skill:
 *  - ACTIVE: tự kích hoạt theo cooldown, xử lý trong game.js (updateSkills)
 *  - PASSIVE: phát huy khi có sự kiện (ví dụ giết quái, bị đánh)
 * Mỗi skill có thể nâng cấp nhiều lần lên maxLevel.
 */
const SKILLS = [
  {
    id: "chain",
    icon: "⚡",
    name: "Sét Dây Chuyền",
    maxLevel: 5,
    desc: (lv) =>
      lv === 0
        ? "Mỗi 4s, tia sét tự nhảy qua 4 con quái đứng gần nhau."
        : `Sét nhảy qua ${3 + lv} mục tiêu, mạnh hơn và nhanh hơn (Lv.${lv}).`,
    apply: (p) => { p.skills.chain++; },
  },
  {
    id: "shockwave",
    icon: "💥",
    name: "Sóng Xung Kích",
    maxLevel: 5,
    desc: (lv) =>
      lv === 0
        ? "Mỗi 6s, phát 1 vòng xung đẩy văng và gây sát thương mọi quái xung quanh."
        : `Vòng xung to hơn, đau hơn, hồi nhanh hơn (Lv.${lv}).`,
    apply: (p) => { p.skills.shockwave++; },
  },
  {
    id: "blackhole",
    icon: "🌀",
    name: "Lỗ Đen",
    maxLevel: 5,
    desc: (lv) =>
      lv === 0
        ? "Mỗi 14s, mở 1 lỗ đen hút cả đám quái lại rồi NỔ diện rộng."
        : `Lỗ đen hút rộng hơn, vụ nổ càng đau (Lv.${lv}).`,
    apply: (p) => { p.skills.blackhole++; },
  },
  {
    id: "chrono",
    icon: "⏳",
    name: "Dòng Chảy Thời Gian",
    maxLevel: 5,
    desc: (lv) =>
      lv === 0
        ? "Mỗi 18s, bóp nghẹt thời gian: chậm 60% toàn bộ quái trong 2.5s."
        : `Hiệu ứng làm chậm kéo dài hơn (Lv.${lv}).`,
    apply: (p) => { p.skills.chrono++; },
  },
  {
    id: "voodoo",
    icon: "🔮",
    name: "Búp Bê Voodoo",
    maxLevel: 5,
    desc: (lv) =>
      lv === 0
        ? "Lời nguyền: khi 1 quái chết, con GẦN NÓ NHẤT cũng nhận 40% sát thương đó."
        : `Sát thương lan tăng lên ${40 + (lv - 1) * 15}% (Lv.${lv}).`,
    apply: (p) => { p.skills.voodoo++; },
  },
  {
    id: "bloodpact",
    icon: "🩸",
    name: "Hợp Đồng Máu",
    maxLevel: 3,
    desc: (lv) =>
      lv === 0
        ? "Rủi ro đổi mạng sống: -15% Max HP, đổi lấy +35% sát thương!"
        : `Tiếp tục đặt cược: -15% Max HP, +35% sát thương (Lv.${lv}).`,
    apply: (p) => {
      p.maxHp = Math.max(30, Math.round(p.maxHp * 0.85));
      p.hp = Math.min(p.hp, p.maxHp);
      p.damage *= 1.35;
    },
  },
];
