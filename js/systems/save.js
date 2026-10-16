/**
 * save.js — Hệ thống tài khoản & lưu tiến trình bằng localStorage.
 *
 * ⚠️ Lưu ý: dữ liệu lưu CỤC BỘ trên trình duyệt của máy này (không phải server).
 * PIN được hash đơn giản chỉ để phân biệt các save, không phải bảo mật thật.
 *
 * Cấu trúc dữ liệu:
 * { accounts: { "<username>": { pin, ssc, upgrades: { <metaId>: level } } } }
 */
const Save = {
  KEY: "shadowSurvivors.v1",
  SESSION_KEY: "shadowSurvivors.session",
  data: { accounts: {} },
  user: null, // username đang đăng nhập, null = chưa / guest

  init() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.data = JSON.parse(raw);
    } catch (e) { /* dữ liệu hỏng -> dùng mới */ }
    if (!this.data || typeof this.data !== "object" || !this.data.accounts) {
      this.data = { accounts: {} };
    }
    // Khôi phục phiên đăng nhập trước đó
    try {
      const saved = localStorage.getItem(this.SESSION_KEY);
      if (saved && this.data.accounts[saved]) this.user = saved;
    } catch (e) { /* ignore */ }
  },

  // ---------- Lưu trữ ----------
  _persist() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* bỏ qua */ }
  },
  _persistSession() {
    try {
      if (this.user) localStorage.setItem(this.SESSION_KEY, this.user);
      else localStorage.removeItem(this.SESSION_KEY);
    } catch (e) { /* bỏ qua */ }
  },

  // ---------- Tài khoản ----------
  /** Hash đơn giản (djb2) — chỉ để phân biệt, không phải bảo mật thật */
  hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
  },

  loggedIn() {
    return this.user !== null;
  },

  account() {
    return this.user ? this.data.accounts[this.user] : null;
  },

  register(username, pin) {
    username = (username || "").trim();
    if (username.length < 3) return { ok: false, error: "Tên tài khoản cần tối thiểu 3 ký tự" };
    if ((pin || "").length < 4) return { ok: false, error: "PIN cần tối thiểu 4 ký tự" };
    if (this.data.accounts[username]) return { ok: false, error: "Tên tài khoản đã tồn tại" };
    this.data.accounts[username] = { pin: this.hash(pin), ssc: 0, upgrades: {} };
    this._persist();
    this.user = username;
    this._persistSession();
    return { ok: true };
  },

  login(username, pin) {
    const acc = this.data.accounts[(username || "").trim()];
    if (!acc) return { ok: false, error: "Tài khoản không tồn tại" };
    if (acc.pin !== this.hash(pin || "")) return { ok: false, error: "Sai PIN" };
    this.user = username.trim();
    this._persistSession();
    return { ok: true };
  },

  logout() {
    this.user = null;
    this._persistSession();
  },

  // ---------- SSC & nâng cấp ----------
  /** Cộng SSC khi nhặt coin trong trận (chỉ lưu nếu đã đăng nhập) */
  addSsc(value) {
    const acc = this.account();
    if (!acc) return;
    acc.ssc += value;
    this._persist();
  },

  canAfford(cost) {
    const acc = this.account();
    return !!acc && acc.ssc >= cost;
  },

  getUpgradeLevel(id) {
    const acc = this.account();
    return acc ? (acc.upgrades[id] || 0) : 0;
  },

  /** Object {metaId: level} để truyền vào Player khi bắt đầu ván mới */
  getUpgradeLevels() {
    const acc = this.account();
    return acc ? acc.upgrades : {};
  },

  /** Mua 1 level nâng cấp. Trả về true nếu thành công. */
  buyUpgrade(metaUpgrade) {
    const acc = this.account();
    if (!acc) return false;
    const lv = acc.upgrades[metaUpgrade.id] || 0;
    if (lv >= metaUpgrade.maxLevel) return false;
    const cost = metaUpgrade.cost(lv);
    if (acc.ssc < cost) return false;
    acc.ssc -= cost;
    acc.upgrades[metaUpgrade.id] = lv + 1;
    this._persist();
    return true;
  },
};
