// Account area shell: right-side menu (top strip on mobile), driven by a list.
// To add a page later (for example "الدفع"), add one item to ACCOUNT_MENU
// and one <div class="tab-panel" id="..."> in account.html. Nothing else changes.
const ACCOUNT_MENU = [
    { id: "orders", label: "طلباتي", icon: "fa-box", panel: "tabOrders", badgeId: "ordersTabCount" },
    { id: "profile", label: "بياناتي", icon: "fa-user", panel: "tabProfile" }
];

const AccountShell = {
    onSelect: null,
    render() {
        const side = document.getElementById("accountSide");
        if (!side) return;
        side.innerHTML = ACCOUNT_MENU.map(item => `
            <button class="account-tab" data-tab="${item.id}" type="button">
                <i class="fa-solid ${item.icon}"></i>
                <span class="account-tab-label">${item.label}</span>
                ${item.badgeId ? `<span class="account-tab-badge" id="${item.badgeId}" style="display:none;">0</span>` : ""}
            </button>
        `).join("");
        side.querySelectorAll(".account-tab").forEach(btn => {
            btn.addEventListener("click", () => this.select(btn.dataset.tab));
        });
    },
    select(id) {
        const item = ACCOUNT_MENU.find(i => i.id === id) || ACCOUNT_MENU[0];
        document.querySelectorAll(".account-tab").forEach(t => {
            t.classList.toggle("active", t.dataset.tab === item.id);
        });
        document.querySelectorAll(".tab-panel").forEach(p => {
            p.classList.toggle("active", p.id === item.panel);
        });
        if (typeof this.onSelect === "function") this.onSelect(item.id);
    },
    init(onSelect, firstId) {
        this.onSelect = onSelect;
        this.render();
        this.select(firstId || ACCOUNT_MENU[0].id);
    }
};
