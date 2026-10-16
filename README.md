# 🎮 Shadow Survivors — 2D Survival Game

Một tựa game sinh tồn Roguelite phong cách **Horde Survival / Bullet Heaven** (lấy cảm hứng từ *Vampire Survivors*), được xây dựng bằng **HTML5 Canvas** và **JavaScript thuần**.

---

## ✨ Tính Năng Nổi Bật

- **🎮 Đa dạng chế độ điều khiển:**
  - 🖱️ **Máy tính (Chuột / WASD):** Giữ chuột trái để chạy theo chuột hoặc dùng phím WASD, súng tự động nhắm bắn quái gần nhất.
  - ⌨️ **Máy tính (WASD + Ngắm bắn thủ công):** WASD di chuyển, chuột trái ngắm bắn.
  - 📱 **Điện thoại (Virtual Joystick):** Cần điều khiển ảo cảm ứng mượt mà 360 độ, tự động bắn quái.
- **⚡ Hệ thống Kỹ năng đa dạng:** Sét dây chuyền, Sóng xung kích đẩy lùi, Lỗ đen gom quái, Dòng chảy thời gian làm chậm, Lời nguyền Voodoo, Hợp đồng máu.
- **🪙 Tiến trình vĩnh viễn (Meta-Progression):** Nhặt coin SSC từ quái và Boss để nâng cấp vĩnh viễn chỉ số nhân vật (Sát thương, Máu, Hồi máu, Tầm hút...).
- **👾 Các loại quái & Boss:** Quái thường, quái nhanh, quái trâu và Boss khổng lồ xuất hiện theo từng mốc thời gian (phút 2, 5, 8).
- **🚀 Tự động Deploy GitHub Pages:** Tích hợp sẵn GitHub Actions, push code lên là có ngay link game chơi trực tiếp trên web!

---

## 🚀 Cách Cập Nhật Code Lên GitHub Tự Động

Trong thư mục game đã có sẵn 2 công cụ tiện lợi:

### Cách 1: Cập nhật nhanh với 1 cú click (Khuyên dùng)
👉 **Nhấp đúp chuột vào file [`sync-github.bat`](sync-github.bat)**:
- Lần đầu tiên chạy, chương trình sẽ hỏi bạn:
  1. Tên & Email GitHub của bạn.
  2. Link repository GitHub (dạng `https://github.com/<username>/survival-game.git`).
- Những lần sau, bạn chỉ cần nhấp đúp là code sẽ tự động được `add`, `commit` và `push` lên GitHub trong vài giây!

### Cách 2: Tự động hoàn toàn theo thời gian thực (Realtime Watcher)
👉 **Nhấp đúp chuột vào file [`auto-watch-start.bat`](auto-watch-start.bat)**:
- Cửa sổ này sẽ chạy nền theo dõi thư mục.
- Bất cứ khi nào bạn nhấn `Ctrl + S` lưu file trong trình soạn thảo, sau vài giây hệ thống sẽ **tự động commit và push lên GitHub** mà bạn không cần gõ bất kỳ lệnh nào!

---

## 🌐 Chơi Trực Tiếp Trên Web Qua GitHub Pages

Khi bạn đẩy code lên repository GitHub:
1. Vào repository của bạn trên GitHub: **Settings** -> **Pages**.
2. Ở mục **Build and deployment** -> **Source**: Chọn **GitHub Actions**.
3. Workflow đã được tạo sẵn trong thư mục `.github/workflows/deploy.yml` sẽ tự động build và cung cấp cho bạn một đường link web để bạn bè có thể vào chơi ngay trên cả máy tính lẫn điện thoại!
