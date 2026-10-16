# 🎨 Thư mục Sprites — đặt hình của bạn vào đây

Game tự động nạp các file PNG dưới đây. **Thiếu file nào, game tự dùng hình tròn vẽ tay làm dự phòng** — không bao giờ lỗi.

## Quy ước bắt buộc

| Quy tắc | Chi tiết |
|---|---|
| Định dạng | PNG, nền **trong suốt** |
| Hướng nhân vật | Phải **hướng về PHẢI** ➡️ (game sẽ tự xoay theo hướng di chuyển) |
| Kích thước | `player` / `enemy-*`: **64×64** · `boss`: **128×128** (kích thước khác cũng được, game tự scale) |

## Tên file mà game tìm kiếm

| Tên file | Dùng cho |
|---|---|
| `player.png` | Người chơi |
| `enemy-basic.png` | Quái thường (đỏ) |
| `enemy-fast.png` | Quái nhanh (cam) — xuất hiện từ phút 1 |
| `enemy-tank.png` | Quái trâu (tím) — xuất hiện từ phút 2.5 |
| `boss.png` | BOSS (phút 2, 5, 8) |

## Cách thay hình

1. Vẽ hình của bạn (Paint / Photoshop / Aseprite / Krita / AI...)
2. Xuất PNG nền trong suốt, đặt đúng tên theo bảng trên
3. Ghi đè lên file cũ trong thư mục này
4. Refresh trình duyệt (F5) — xong! 🎮

💡 *Mẹo: muốn hình to hơn/bé hơn trong game, sửa hệ số `size = this.radius * 2.9` trong `player.js` / `enemy.js` (phần vẽ sprite).*
