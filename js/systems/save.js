/**
 * save.js — Hệ thống tài khoản & lưu tiến trình qua Firebase Realtime Database.
 *
 * 🔥 Dữ liệu lưu TRÊN CLOUD — đăng nhập bất kỳ thiết bị nào đều đồng bộ!
 *
 * Cấu trúc dữ liệu trên Firebase:
 * /accounts/<username>/
 *   ├── pin       : string  (hash djb2)
 *   ├── ssc       : number
 *   └── upgrades/ : { <metaId>: level }
 *
 * API public (giữ nguyên 100% tương thích với code cũ):
 *   Save.init()          — khởi động, kiểm tra phiên đăng nhập cũ
 *   Save.register()      — đăng ký (async, trả về Promise)
 *   Save.login()         — đăng nhập (async, trả về Promise)
 *   Save.logout()        — đăng xuất
 *   Save.loggedIn()      — kiểm tra đang đăng nhập không
 *   Save.account()       — lấy dữ liệu tài khoản hiện tại (cache cục bộ)
 *   Save.addSsc(v)       — cộng SSC (đồng bộ Firebase + cache)
 *   Save.canAfford(cost) — kiểm tra đủ SSC
 *   Save.getUpgradeLevel(id)   — lấy level 1 upgrade
 *   Save.getUpgradeLevels()    — lấy toàn bộ levels (object)
 *   Save.buyUpgrade(meta)      — mua nâng cấp (async)
 */

// ════════════════════════════════════════
//  ⚙️  CẤU HÌNH FIREBASE — chỉ sửa ở đây
// ════════════════════════════════════════
const FIREBASE_CONFIG = {
  databaseURL: "https://dsurvivalgame-4a736-default-rtdb.asia-southeast1.firebasedatabase.app",
};
// REST API gốc của Realtime Database (không cần SDK, hoạt động với file:// và GitHub Pages)
const DB_ROOT = FIREBASE_CONFIG.databaseURL;

// ════════════════════════════════════════
const Save = {
  SESSION_KEY: "shadowSurvivors.session",

  user: null,      // username đang đăng nhập (string | null)
  _cache: null,    // dữ liệu tài khoản cache cục bộ { pin, ssc, upgrades }
  _ready: false,   // true sau khi init() hoàn tất

  // ── Tiện ích ──────────────────────────────────────────────────────────────

  /** Hash đơn giản djb2 — giống bản cũ để PIN cũ vẫn hoạt động */
  hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
  },

  /** Đường dẫn REST đến node tài khoản */
  _url(username, sub = "") {
    const path = sub ? `/accounts/${username}/${sub}` : `/accounts/${username}`;
    return `${DB_ROOT}${path}.json`;
  },

  /** GET dữ liệu từ Firebase — trả về null nếu lỗi hoặc không tồn tại */
  async _get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  },

  /** PUT / PATCH / DELETE dữ liệu lên Firebase */
  async _set(url, data, method = "PUT") {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (e) { return false; }
  },

  /** Lưu phiên đăng nhập vào localStorage (chỉ lưu username, không lưu PIN) */
  _saveSession() {
    try {
      if (this.user) localStorage.setItem(this.SESSION_KEY, this.user);
      else localStorage.removeItem(this.SESSION_KEY);
    } catch (e) { /* ignore */ }
  },

  // ── Khởi động ─────────────────────────────────────────────────────────────

  /**
   * Gọi 1 lần khi game load.
   * Kiểm tra phiên đăng nhập cũ → nếu còn hợp lệ thì tự tải dữ liệu từ Firebase.
   * Dùng callback vì game.js gọi Save.init() đồng bộ.
   */
  init() {
    this._ready = false;
    let savedUser = null;
    try { savedUser = localStorage.getItem(this.SESSION_KEY); } catch (e) { /* ignore */ }

    if (savedUser) {
      // Tải dữ liệu tài khoản từ Firebase (bất đồng bộ)
      this._get(this._url(savedUser)).then((data) => {
        if (data && data.pin) {
          this.user = savedUser;
          this._cache = data;
          // Cập nhật giao diện nếu UI đã sẵn sàng
          if (window._gameRef && window._gameRef.ui) {
            window._gameRef.ui.renderMenu();
          }
        } else {
          // Tài khoản không còn tồn tại trên Firebase — xóa phiên cũ
          this._saveSession();
        }
        this._ready = true;
      });
    } else {
      this._ready = true;
    }
  },

  // ── Kiểm tra trạng thái ───────────────────────────────────────────────────

  loggedIn() {
    return this.user !== null && this._cache !== null;
  },

  account() {
    return this._cache;
  },

  // ── Đăng ký / Đăng nhập / Đăng xuất ─────────────────────────────────────

  /**
   * Đăng ký tài khoản mới. Trả về Promise<{ ok, error? }>.
   * UI gọi await Save.register(username, pin).
   */
  async register(username, pin) {
    username = (username || "").trim();
    if (username.length < 3) return { ok: false, error: "Tên tài khoản cần tối thiểu 3 ký tự" };
    if ((pin || "").length < 4) return { ok: false, error: "PIN cần tối thiểu 4 ký tự" };
    if (!/^[a-zA-Z0-9_\-\.À-ỹ]+$/u.test(username)) {
      return { ok: false, error: "Tên tài khoản không được chứa ký tự đặc biệt" };
    }

    // Kiểm tra tài khoản đã tồn tại chưa
    const existing = await this._get(this._url(username, "pin"));
    if (existing !== null) return { ok: false, error: "Tên tài khoản đã tồn tại" };

    const newAcc = { pin: this.hash(pin), ssc: 0, upgrades: {} };
    const ok = await this._set(this._url(username), newAcc, "PUT");
    if (!ok) return { ok: false, error: "Lỗi kết nối Firebase, thử lại sau" };

    this.user = username;
    this._cache = newAcc;
    this._saveSession();
    return { ok: true };
  },

  /**
   * Đăng nhập. Trả về Promise<{ ok, error? }>.
   */
  async login(username, pin) {
    username = (username || "").trim();
    if (!username) return { ok: false, error: "Vui lòng nhập tên tài khoản" };

    const data = await this._get(this._url(username));
    if (!data || !data.pin) return { ok: false, error: "Tài khoản không tồn tại" };
    if (data.pin !== this.hash(pin || "")) return { ok: false, error: "Sai PIN" };

    this.user = username;
    this._cache = {
      pin: data.pin,
      ssc: data.ssc || 0,
      upgrades: data.upgrades || {},
    };
    this._saveSession();
    return { ok: true };
  },

  logout() {
    this.user = null;
    this._cache = null;
    this._saveSession();
  },

  // ── SSC & Nâng cấp ────────────────────────────────────────────────────────

  /** Cộng SSC khi nhặt coin (cập nhật cache ngay, đẩy lên Firebase ngay) */
  addSsc(value) {
    if (!this._cache || !this.user) return;
    this._cache.ssc = (this._cache.ssc || 0) + value;
    // Ghi không chờ (fire-and-forget)
    this._set(this._url(this.user, "ssc"), this._cache.ssc, "PUT");
  },

  canAfford(cost) {
    return this.loggedIn() && (this._cache.ssc || 0) >= cost;
  },

  getUpgradeLevel(id) {
    if (!this._cache) return 0;
    return (this._cache.upgrades && this._cache.upgrades[id]) || 0;
  },

  getUpgradeLevels() {
    return (this._cache && this._cache.upgrades) ? this._cache.upgrades : {};
  },

  /**
   * Mua 1 level nâng cấp. Trả về Promise<boolean>.
   */
  async buyUpgrade(metaUpgrade) {
    if (!this._cache || !this.user) return false;
    const lv = this.getUpgradeLevel(metaUpgrade.id);
    if (lv >= metaUpgrade.maxLevel) return false;
    const cost = metaUpgrade.cost(lv);
    if ((this._cache.ssc || 0) < cost) return false;

    // Cập nhật cache cục bộ ngay để UI mượt mà
    this._cache.ssc -= cost;
    this._cache.upgrades[metaUpgrade.id] = lv + 1;

    // Đồng bộ lên Firebase
    await this._set(this._url(this.user, "ssc"), this._cache.ssc, "PUT");
    await this._set(
      this._url(this.user, `upgrades/${metaUpgrade.id}`),
      lv + 1,
      "PUT"
    );
    return true;
  },
};
