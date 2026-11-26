// Account area navigation, one list for both menus:
//  - the side menu on account screens (links, one screen per item)
//  - the header dropdown on every storefront page
// To add a screen later (for example "الدفع"), add one item here and create its page.
const ACCOUNT_GROUPS = [
    { title: "", items: [
        { id: "orders", label: "طلباتي", icon: "fa-box", href: "account.html" },
        { id: "returns", label: "المرتجعات", icon: "fa-rotate-left", href: "account-returns.html" },
        { id: "favorites", label: "المفضلة", icon: "fa-heart", href: "account-favorites.html" }
    ] },
    { title: "حسابي", items: [
        { id: "profile", label: "بياناتي", icon: "fa-user", href: "account-profile.html" },
        { id: "addresses", label: "العناوين", icon: "fa-location-dot", href: "account-addresses.html" }
    ] },
    { title: "أخرى", items: [
        { id: "notifications", label: "الإشعارات", icon: "fa-bell", href: "account-notifications.html" },
        { id: "security", label: "إعدادات الأمان", icon: "fa-shield-halved", href: "account-security.html" }
    ] }
];
const ACCOUNT_MENU = ACCOUNT_GROUPS.reduce((all, g) => all.concat(g.items), []);

function shellInitials(n){const p=String(n||'').trim().split(/\s+/).filter(Boolean);if(!p.length)return '؟';return (Array.from(p[0])[0]+(p[1]?Array.from(p[1])[0]:'')).toUpperCase();}

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
        const user = this.currentUser();
        const name = user && ((user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email || "").split("@")[0]) || "حسابي";
        const initial = Array.from(name.trim())[0] || "؟";
        const item = i => `
            <a class="asm-item${i.id === cur ? " active" : ""}" href="${i.href}"${i.id === cur ? ' aria-current="page"' : ""}>
                <i class="fa-solid ${i.icon}"></i><span>${i.label}</span>
            </a>`;
        side.innerHTML = `
            <a class="asm-user" href="account-profile.html" aria-label="ملفي الشخصي">
                <span class="asm-avatar">${this.esc(shellInitials(name))}</span>
                <span class="asm-user-text"><b>${this.esc(name)}</b><small>ملفي الشخصي <i class="fa-solid fa-chevron-left"></i></small></span>
            </a>
            ${ACCOUNT_GROUPS.map(g => `
                ${g.title ? `<div class="asm-label">${g.title}</div>` : ""}
                <nav class="asm-card">${g.items.map(item).join("")}</nav>`).join("")}
            <nav class="asm-card asm-out">
                <a class="asm-item" href="account.html?logout=1"><i class="fa-solid fa-right-from-bracket"></i><span>تسجيل الخروج</span></a>
            </nav>`;
        this.injectSideCss();
    },
    injectSideCss() {
        if (document.getElementById("asm-css")) return;
        const st = document.createElement("style");
        st.id = "asm-css";
        st.textContent = `
.account-side{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;display:flex!important;flex-direction:column!important;gap:0!important;overflow:visible!important;position:static}
.asm-user{display:flex;align-items:center;gap:12px;padding:4px 6px 14px;text-decoration:none}
.asm-avatar{width:46px;height:46px;border-radius:50%;background:#14213D;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex:none;letter-spacing:.5px}
.asm-user-text{display:flex;flex-direction:column;min-width:0}
.asm-user-text b{color:#14213D;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asm-user-text small{color:#1F8A8A;font-size:13px;font-weight:700;white-space:nowrap}
.asm-user-text small i{font-size:10px;margin-inline-start:4px}
.asm-user:hover .asm-user-text small{text-decoration:underline}
.asm-label{font-size:12px;font-weight:800;color:#6b7280;padding:6px 8px;letter-spacing:.3px}
.asm-card{background:#fff;border:1px solid #E0DDD4;border-radius:18px;padding:8px;margin-bottom:12px;display:flex;flex-direction:column;gap:2px}
.asm-item{display:flex;align-items:center;gap:14px;padding:12px 12px;border-radius:12px;color:#14213D;text-decoration:none;font-weight:700;font-size:14px}
.asm-item i{width:20px;text-align:center;color:#1F8A8A;font-size:15px}
.asm-item:hover{background:#F7F5F0}
.asm-item.active{background:#E8ECF3;font-weight:800}
.asm-out .asm-item i{color:#b42318}
`;
        document.head.appendChild(st);
    },
    renderDropdown() {
        const trigger = document.querySelector('.header-actions a.icon-button[href="account.html"]');
        if (!trigger || trigger.dataset.menuReady) return;
        trigger.dataset.menuReady = "1";
        const user = this.currentUser();
        const name = user && ((user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email || "").split("@")[0]);
        const link = (href, icon, label) => `<a class="acm-item" href="${href}"><i class="fa-solid ${icon}"></i><span>${label}</span></a>`;
        const DD = ["orders", "returns", "favorites", "addresses"];
        const items = user
            ? ACCOUNT_MENU.filter(i => DD.indexOf(i.id) > -1).map(i => link(i.href, i.icon, i.label)).join("") +
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
        panel.innerHTML = (user ? `<a class="acm-head" href="account-profile.html"><span class="acm-av">${this.esc(shellInitials(name))}</span><span class="acm-ht"><b>${this.esc(name || "حسابي")}</b><small>ملفي الشخصي <i class="fa-solid fa-chevron-left"></i></small></span></a>` : "") + items;
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
.acm-panel{display:none;position:absolute;top:calc(100% + 8px);left:0;min-width:250px;background:#fff;border:1px solid #E0DDD4;border-radius:14px;box-shadow:0 14px 36px rgba(20,33,61,.16);padding:8px;z-index:3000;text-align:right}
.acm-wrap.open .acm-panel{display:block}
.acm-head{display:flex;align-items:center;gap:12px;padding:10px 10px 12px;border-bottom:1px solid #E0DDD4;margin-bottom:6px;text-decoration:none;border-radius:10px}
.acm-head:hover{background:#F7F5F0}
.acm-av{width:42px;height:42px;border-radius:50%;background:#14213D;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none}
.acm-ht{display:flex;flex-direction:column;min-width:0}
.acm-ht b{color:#14213D;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}
.acm-ht small{color:#1F8A8A;font-size:12.5px;font-weight:700}
.acm-ht small i{font-size:9px;margin-inline-start:4px}
.acm-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:14px;font-weight:700;color:#14213D;text-decoration:none;white-space:nowrap}
.acm-item i{width:18px;text-align:center;color:#1F8A8A}
.acm-item:hover{background:#E8ECF3}
.acm-item[href*="logout"]{color:#b42318}.acm-item[href*="logout"] i{color:#b42318}
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
