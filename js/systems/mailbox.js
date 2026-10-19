/**
 * mailbox.js — Hệ thống Hòm Thư Quà Tặng (Mailbox / Inbox System)
 * 
 * Cho phép Bạn (Admin / Nhà phát triển) dễ dàng gửi quà, coin SSC,
 * và lời nhắn tri ân tới tất cả người chơi.
 * 
 * Mỗi người chơi (theo tên tài khoản) chỉ nhận quà mỗi thư đúng 1 lần!
 */

const Mailbox = {
  // ═════════════════════════════════════════════════════════════════
  // 🎁 DANH SÁCH THƯ QUÀ TẶNG TỪ ADMIN
  // Bạn có thể thêm, bớt hoặc chỉnh sửa phần thưởng tại đây!
  // ═════════════════════════════════════════════════════════════════
  MAILS: [
    {
      id: "mail_welcome",
      icon: "🎉",
      title: "Quà Chào Mừng Tân Thủ",
      sender: "BQT Shadow Survivors",
      date: "Vĩnh viễn",
      content: "Chào mừng bạn đến với thế giới sinh tồn bóng đêm! Đây là món quà tiếp sức ban đầu dành riêng cho bạn.",
      reward: { ssc: 200 }
    },
    {
      id: "mail_mobile_v2",
      icon: "🚀",
      title: "Mừng Bản Cập Nhật 2.0 (Mobile)",
      sender: "Nhà Phát Triển",
      date: "Mới",
      content: "Giao diện game đã được tối ưu hoàn toàn cho điện thoại với 5 Tab và Hòm Thư mới! Tặng bạn coin để nâng cấp.",
      reward: { ssc: 150 }
    },
    {
      id: "mail_gratitude",
      icon: "❤️",
      title: "Quà Tri Ân Người Chơi",
      sender: "Admin Game",
      date: "Mới",
      content: "Cảm ơn bạn đã luôn đồng hành và trải nghiệm Shadow Survivors. Chúc bạn có những trận chiến sinh tồn thật mãn nhãn!",
      reward: { ssc: 300 }
    },
    {
      id: "mail_weekend_supply",
      icon: "⚡",
      title: "Gói Tiếp Tế Chiến Binh",
      sender: "Hội Đồng Sinh Tồn",
      date: "Đặc biệt",
      content: "Tiếp tế năng lượng khẩn cấp! Hãy dùng coin này cường hóa vũ khí và thử thách bản thân ở Ải 2 & Ải 3 nhé.",
      reward: { ssc: 100 }
    },

    // ─────────────────────────────────────────────────────────────
    // 👑 VÍ DỤ: TẶNG QUÀ RIÊNG CHO 1 NGƯỜI CHƠI CỤ THỂ
    // Chỉ tài khoản có tên trùng khớp với `targetUser` mới thấy và nhận được!
    // (Bỏ dấu // ở dưới và đổi 'phudepzai' thành tên tài khoản bạn muốn tặng)
    // ─────────────────────────────────────────────────────────────
    // {
    //   id: "mail_vip_phu",
    //   icon: "👑",
    //   title: "Quà Tặng Riêng Cho Bạn",
    //   sender: "Admin",
    //   targetUser: "phudepzai",       // <-- Điền tên tài khoản người nhận ở đây
    //   date: "Độc quyền",
    //   content: "Món quà đặc biệt dành riêng cho bạn vì những cống hiến xuất sắc!",
    //   reward: { ssc: 1000 }
    // }
  ],

  /** Lấy key lưu trữ theo tài khoản đang đăng nhập để tránh nhận đè */
  _getStorageKey() {
    try {
      const user = (typeof Save !== "undefined" && Save.loggedIn && Save.loggedIn()) ? Save.user : "guest";
      return `shadowSurvivors.mailbox_${user}`;
    } catch (e) {
      return "shadowSurvivors.mailbox_guest";
    }
  },

  /** Lấy danh sách ID các thư đã nhận */
  getClaimedMap() {
    try {
      const raw = localStorage.getItem(this._getStorageKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  /** Lưu trạng thái đã nhận */
  _saveClaimedMap(map) {
    try {
      localStorage.setItem(this._getStorageKey(), JSON.stringify(map));
    } catch (e) {}
  },

  _cloudMails: [],
  _isFetching: false,

  /** Tải thư quà tặng trực tiếp từ Firebase Realtime Database */
  async fetchCloudMails() {
    if (this._isFetching) return;
    this._isFetching = true;

    try {
      const dbUrl = (typeof DB_ROOT !== "undefined")
        ? DB_ROOT
        : "https://dsurvivalgame-4a736-default-rtdb.asia-southeast1.firebasedatabase.app";

      const promises = [];

      // 1. Thư toàn server (/global_mails.json)
      promises.push(
        fetch(`${dbUrl}/global_mails.json`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      );

      // 2. Thư riêng cho tài khoản (/accounts/<username>/mails.json)
      const isLogged = typeof Save !== "undefined" && Save.loggedIn && Save.loggedIn();
      if (isLogged && Save.user) {
        promises.push(
          fetch(`${dbUrl}/accounts/${Save.user}/mails.json`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      const [globalMails, personalMails] = await Promise.all(promises);

      const parsedMails = [];

      // Xử lý thư toàn server từ Firebase
      if (globalMails && typeof globalMails === "object") {
        Object.keys(globalMails).forEach((key) => {
          const m = globalMails[key];
          if (m) {
            parsedMails.push({
              id: "cloud_global_" + key,
              icon: m.icon || "🎁",
              title: m.title || "Quà Toàn Server (Firebase)",
              sender: m.sender || "Ban Quản Trị",
              date: m.date || "Sự kiện",
              content: m.content || "Phần quà từ hệ thống gửi tặng toàn thể người chơi.",
              reward: { ssc: parseInt(m.ssc || (m.reward && m.reward.ssc) || 0, 10) }
            });
          }
        });
      }

      // Xử lý thư riêng của từng người chơi từ Firebase
      if (personalMails && typeof personalMails === "object") {
        Object.keys(personalMails).forEach((key) => {
          const m = personalMails[key];
          if (m) {
            parsedMails.push({
              id: "cloud_user_" + key,
              icon: m.icon || "👑",
              title: m.title || "Quà Dành Riêng Cho Bạn",
              sender: m.sender || "Admin",
              date: m.date || "Độc quyền",
              content: m.content || "Món quà đặc biệt dành tặng riêng cho bạn!",
              reward: { ssc: parseInt(m.ssc || (m.reward && m.reward.ssc) || 0, 10) }
            });
          }
        });
      }

      this._cloudMails = parsedMails;

      // Cập nhật giao diện nếu UI đang chạy
      if (window._gameRef && window._gameRef.ui) {
        window._gameRef.ui.updateMailBadge();
        const modal = document.getElementById("modal-mailbox");
        if (modal && !modal.classList.contains("hidden")) {
          window._gameRef.ui.renderMailbox();
        }
      }
    } catch (err) {
      console.warn("Mailbox cloud fetch error:", err);
    } finally {
      this._isFetching = false;
    }
  },

  /** Lấy danh sách các thư mà tài khoản hiện tại được phép nhìn thấy */
  getVisibleMails() {
    const isLogged = typeof Save !== "undefined" && Save.loggedIn && Save.loggedIn();
    const currentUser = (isLogged && Save.user) ? Save.user.trim().toLowerCase() : "";

    // 1. Lọc thư tĩnh trong code
    const localVisible = this.MAILS.filter((m) => {
      if (!m.targetUser && !m.targetUsers) return true;
      if (m.targetUser === "all" || m.targetUser === "*") return true;

      if (!isLogged || !currentUser) return false;

      if (m.targetUser && typeof m.targetUser === "string") {
        return m.targetUser.trim().toLowerCase() === currentUser;
      }

      if (Array.isArray(m.targetUsers)) {
        return m.targetUsers.some((u) => typeof u === "string" && u.trim().toLowerCase() === currentUser);
      }

      return false;
    });

    // 2. Gộp với thư trực tuyến tải từ Firebase Cloud
    return [...localVisible, ...this._cloudMails];
  },

  /** Lấy danh sách thư của người chơi kèm trạng thái isClaimed */
  getAllMails() {
    const claimedMap = this.getClaimedMap();
    return this.getVisibleMails().map((m) => ({
      ...m,
      isClaimed: Boolean(claimedMap[m.id])
    }));
  },

  /** Đếm số thư chưa nhận của tài khoản hiện tại */
  getUnclaimedCount() {
    const claimedMap = this.getClaimedMap();
    return this.getVisibleMails().filter((m) => !claimedMap[m.id]).length;
  },

  /** Có thư chưa nhận hay không (để hiện chấm đỏ trên icon) */
  hasUnclaimed() {
    return this.getUnclaimedCount() > 0;
  },

  /** Nhận quà của 1 lá thư */
  claimMail(mailId) {
    const visibleMails = this.getVisibleMails();
    const mail = visibleMails.find((m) => m.id === mailId);
    if (!mail) return { success: false, msg: "Không tìm thấy thư hoặc thư này không dành cho bạn!" };

    const claimedMap = this.getClaimedMap();
    if (claimedMap[mailId]) {
      return { success: false, msg: "Thư này bạn đã nhận quà rồi!" };
    }

    // Đánh dấu đã nhận
    claimedMap[mailId] = true;
    this._saveClaimedMap(claimedMap);

    // Cộng SSC vào tài khoản
    const rewardSsc = mail.reward && mail.reward.ssc ? mail.reward.ssc : 0;
    if (rewardSsc > 0 && typeof Save !== "undefined" && Save.addSsc) {
      Save.addSsc(rewardSsc);
    }

    return {
      success: true,
      mail,
      rewardSsc,
      msg: `Đã nhận +${rewardSsc} SSC từ "${mail.title}"!`
    };
  },

  /** Nhận tất cả các thư chưa nhận của người này */
  claimAll() {
    const claimedMap = this.getClaimedMap();
    const visibleMails = this.getVisibleMails();
    let totalSsc = 0;
    let claimedCount = 0;

    visibleMails.forEach((mail) => {
      if (!claimedMap[mail.id]) {
        claimedMap[mail.id] = true;
        claimedCount++;
        if (mail.reward && mail.reward.ssc) {
          totalSsc += mail.reward.ssc;
        }
      }
    });

    if (claimedCount === 0) {
      return { success: false, count: 0, totalSsc: 0, msg: "Bạn đã nhận hết tất cả quà trong hòm thư rồi!" };
    }

    this._saveClaimedMap(claimedMap);

    if (totalSsc > 0 && typeof Save !== "undefined" && Save.addSsc) {
      Save.addSsc(totalSsc);
    }

    return {
      success: true,
      count: claimedCount,
      totalSsc,
      msg: `Đã nhận thành công ${claimedCount} thư: +${totalSsc} SSC!`
    };
  }
};

// Tự động tải thư mới từ Firebase ngay khi khởi động
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => Mailbox.fetchCloudMails());
  } else {
    Mailbox.fetchCloudMails();
  }
}

