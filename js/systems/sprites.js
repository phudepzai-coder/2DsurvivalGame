/**
 * sprites.js — Nạp hình ảnh nhân vật/quái từ thư mục assets/.
 *
 * QUY ƯỚC HÌNH ẢNH (rất quan trọng):
 *  - File PNG nền TRONG SUỐT.
 *  - Nhân vật phải HƯỚNG VỀ PHẢI (game sẽ xoay hình theo hướng di chuyển).
 *  - Khuyến nghị kích thước: player/enemy 64x64, boss 128x128.
 *  - Chỉ cần đặt đúng tên file, game tự nhận. Thiếu file nào -> game tự
 *    vẽ lại hình tròn cũ làm dự phòng, không gây lỗi.
 */
const Sprites = {
  images: {}, // key -> HTMLImageElement đã nạp xong

  manifest: {
    player: "assets/player.png",
    "enemy-basic": "assets/enemy-basic.png",
    "enemy-fast": "assets/enemy-fast.png",
    "enemy-tank": "assets/enemy-tank.png",
    boss: "assets/boss.png",
  },

  init() {
    for (const [key, src] of Object.entries(this.manifest)) {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        console.log(`[Sprites] Đã nạp: ${src}`);
      };
      img.onerror = () => {
        // Không có file -> dùng hình vẽ dự phòng, không sao cả
        console.warn(`[Sprites] Không tìm thấy ${src} — dùng hình dự phòng cho "${key}"`);
      };
      img.src = src;
    }
  },

  /** Lấy ảnh đã nạp, trả về null nếu chưa có -> caller dùng hình vẽ dự phòng */
  get(key) {
    return this.images[key] || null;
  },
};
