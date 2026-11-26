// Account area navigation, one list for both menus:
//  - the side menu on account screens (links, one screen per item)
//  - the header dropdown on every storefront page
// To add a screen later (for example "الدفع"), add one item here and create its page.
const ACCOUNT_MENU = [
    { id: "orders", label: "طلباتي", icon: "fa-box", href: "account.html" },
    { id: "profile", label: "بياناتي", icon: "fa-user", href: "account-profile.html" }
];

const AccountShell = {
    currentUser() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!/^sb-.+-auth-token$/.test(k)) continue;
                const v = JSON.parse(localStorage.getItem(k) || "null");
                const u = v && (v.user || (v.currentSession && v.currentSession.user));
                if (u) return u;
            }
        } catch (e) { /* no session info */ }
        return null;
    },
    esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },
    renderSide() {
        const side = document.getElementById("accountSide");
        if (!side) return;
        const cur = document.body.dataset.screen || "";
        side.innerHTML = ACCOUNT_MENU.map(item => `
            <a class="account-tab${item.id === cur ? " active" : ""}" href="${item.href}">
                <i class="fa-solid ${item.icon}"></i>
                <span class="account-tab-label">${item.label}</span>
            </a>
        `).join("");
    },
    renderDropdown() {
        const trigger = document.querySelector('.header-actions a.icon-button[href="account.html"]');
        if (!trigger || trigger.dataset.menuReady) return;
        trigger.dataset.menuReady = "1";
        const user = this.currentUser();
        const name = user && ((user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email || "").split("@")[0]);
        const link = (href, icon, label) => `<a class="acm-item" href="${href}"><i class="fa-solid ${icon}"></i><span>${label}</span></a>`;
        const items = user
            ? ACCOUNT_MENU.map(i => link(i.href, i.icon, i.label)).join("") +
              link("track.html", "fa-truck-fast", "تتبّع طلب") +
              '<div class="acm-sep"></div>' +
              link("account.html?logout=1", "fa-right-from-bracket", "تسجيل الخروج")
            : link("track.html", "fa-truck-fast", "تتبّع طلب") +
              link("account-login.html", "fa-right-to-bracket", "تسجيل الدخول") +
              link("account-register.html", "fa-user-plus", "إنشاء حساب");

        const wrap = document.createElement("div");
        wrap.className = "acm-wrap";
        trigger.parentNode.insertBefore(wrap, trigger);
        wrap.appendChild(trigger);
        trigger.setAttribute("aria-haspopup", "menu");
        trigger.setAttribute("aria-expanded", "false");
        const panel = document.createElement("div");
        panel.className = "acm-panel";
        panel.setAttribute("role", "menu");
        panel.innerHTML = (user ? `<div class="acm-head">${this.esc(name || "حسابي")}</div>` : "") + items;
        wrap.appendChild(panel);

        const close = () => { wrap.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); };
        trigger.addEventListener("click", e => {
            e.preventDefault();
            const open = wrap.classList.toggle("open");
            trigger.setAttribute("aria-expanded", open ? "true" : "false");
        });
        document.addEventListener("click", e => { if (!wrap.contains(e.target)) close(); });
        document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

        const st = document.createElement("style");
        st.textContent = `
.acm-wrap{position:relative;display:inline-flex}
.acm-panel{display:none;position:absolute;top:calc(100% + 8px);left:0;min-width:210px;background:#fff;border:1px solid #E0DDD4;border-radius:14px;box-shadow:0 14px 36px rgba(20,33,61,.16);padding:8px;z-index:3000;text-align:right}
.acm-wrap.open .acm-panel{display:block}
.acm-head{padding:10px 12px 8px;font-weight:800;font-size:14px;color:#14213D;border-bottom:1px solid #E0DDD4;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
.acm-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:14px;font-weight:700;color:#14213D;text-decoration:none;white-space:nowrap}
.acm-item i{width:18px;text-align:center;color:#1F8A8A}
.acm-item:hover{background:#E8ECF3}
.acm-sep{height:1px;background:#E0DDD4;margin:6px 4px}
@media(max-width:700px){.acm-panel{position:fixed;top:78px;inset-inline-start:12px;inset-inline-end:12px;min-width:0}}`;
        document.head.appendChild(st);
    },
    init() {
        this.renderSide();
        this.renderDropdown();
    }
};

document.addEventListener("DOMContentLoaded", () => AccountShell.renderDropdown());
