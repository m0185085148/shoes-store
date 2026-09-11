// ========================================
// STEP Store - Admin System
// admin.js
// ========================================

// ========================================
// 1. SUPABASE
// ========================================

function getSupabaseClient() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    console.error("Supabase Client غير موجود");
    return null;
}

// ========================================
// 2. PAGE DETECTION
// ========================================

function isLoginPage() {
    return Boolean(document.getElementById("loginForm"));
}

function isAdminDashboard() {
    return Boolean(document.getElementById("adminDashboard"));
}

// ========================================
// 3. LOGIN ELEMENTS
// ========================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const passwordToggle = document.getElementById("passwordToggle");
const loginCard = document.getElementById("loginCard");
const pageTransition = document.getElementById("pageTransition");

// ========================================
// 4. ADMIN ELEMENTS
// ========================================

const logoutButton = document.getElementById("logoutButton");
const adminUsername = document.getElementById("adminUsername");
const adminRole = document.getElementById("adminRole");

const adminProductsList = document.getElementById("adminProductsList");
const adminOrdersList = document.getElementById("adminOrdersList");
const approvalRequests = document.getElementById("approvalRequests");

const statTotal = document.getElementById("statTotal");

const dashStatRevenue = document.getElementById("dashStatRevenue");
const dashStatNewOrders = document.getElementById("dashStatNewOrders");
const dashStatPending = document.getElementById("dashStatPending");
const dashStatProducts = document.getElementById("dashStatProducts");

const sidebarNewOrdersBadge = document.getElementById("sidebarNewOrdersBadge");
const sidebarPendingBadge = document.getElementById("sidebarPendingBadge");

const dashRecentOrdersList = document.getElementById("dashRecentOrdersList");
const dashTopSellingList = document.getElementById("dashTopSellingList");

// ========================================
// 5. ADD PRODUCT
// ========================================

const addProductForm = document.getElementById("addProductForm");
const addName = document.getElementById("name");
const addPrice = document.getElementById("price");
const addOldPrice = document.getElementById("oldPrice");
const addBadge = document.getElementById("badge");
const addSizes = document.getElementById("sizes");
const addDescription = document.getElementById("description");
const addImageUrl = document.getElementById("imageUrl");
const addSubmitButton = document.getElementById("submitBtn");

// ========================================
// 6. EDIT PRODUCT
// ========================================

const editModal = document.getElementById("editModal");
const closeEditModal = document.getElementById("closeEditModal");
const editProductForm = document.getElementById("editProductForm");
const editProductId = document.getElementById("editProductId");
const editName = document.getElementById("editName");
const editPrice = document.getElementById("editPrice");
const editOldPrice = document.getElementById("editOldPrice");
const editBadge = document.getElementById("editBadge");
const editSizes = document.getElementById("editSizes");
const editDescription = document.getElementById("editDescription");
const editImageUrl = document.getElementById("editImageUrl");
const saveEditButton = document.getElementById("saveEditButton");
const cancelEditButton = document.getElementById("cancelEditButton");

// ========================================
// 7. ORDER MODAL
// ========================================

const orderModal = document.getElementById("orderModal");
const closeOrderModalBtn = document.getElementById("closeOrderModal");
const orderModalDetails = document.getElementById("orderModalDetails");

// ========================================
// 8. APPROVAL MODAL
// ========================================

const approvalModal = document.getElementById("approvalModal");
const closeApprovalModal = document.getElementById("closeApprovalModal");
const approvalModalBody = document.getElementById("approvalModalBody");
const approvalModalActions = document.getElementById("approvalModalActions");

// ========================================
// 9. GLOBAL VARIABLES
// ========================================

let currentAdmin = null;
let adminProducts = [];
let adminOrders = [];
let adminApprovalRequests = [];
let currentApprovalFilter = "pending";

// ========================================
// 10. HELPERS
// ========================================

function showLoginMessage(message, type = "error") {
    if (!loginMessage) return;

    if (!message) {
        loginMessage.textContent = "";
        loginMessage.className = "message";
        return;
    }

    loginMessage.textContent = message;
    loginMessage.className = "message show";
    loginMessage.classList.add(
        type === "success" ? "success" : "error"
    );
}

function showPageTransition() {
    if (loginCard) loginCard.classList.add("login-success");
    if (pageTransition) pageTransition.classList.add("show");
}

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeAdminHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseSizes(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch (error) {}
        return value.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
}

function formatPrice(value) {
    return Number(value || 0).toLocaleString("ar-EG");
}

function normalizeBadge(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (text === "new" || text === "New" || text === "جديد") return "جديد";
    if (text === "sale" || text === "Sale" || text === "خصم") return "خصم";
    return text;
}

// ========================================
// 11. LOGIN PASSWORD TOGGLE
// ========================================

if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", function () {
        const icon = passwordToggle.querySelector("i");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            if (icon) {
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            }
        } else {
            passwordInput.type = "password";
            if (icon) {
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        }
    });
}

// ========================================
// 12. CURRENT ADMIN
// ========================================

async function getCurrentAdmin() {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
        const { data: sessionData, error: sessionError } =
            await client.auth.getSession();
        if (sessionError || !sessionData?.session) return null;
        const user = sessionData.session.user;

        const { data: adminData, error: adminError } = await client
            .from("admin_users")
            .select("id, username, role, is_active")
            .eq("id", user.id)
            .maybeSingle();

        if (adminError || !adminData || adminData.is_active === false) {
            return null;
        }

        return { ...adminData, email: user.email };
    } catch (error) {
        console.error("getCurrentAdmin Error:", error);
        return null;
    }
}

function getRoleName(role) {
    const roles = {
        super_admin: "مدير النظام",
        manager: "مدير",
        admin: "مسؤول"
    };
    return roles[role] || role || "مسؤول";
}

function isManager() {
    return Boolean(
        currentAdmin &&
        (currentAdmin.role === "manager" ||
            currentAdmin.role === "super_admin")
    );
}

// ========================================
// 13. LOGIN PAGE SESSION
// ========================================

async function checkLoginPageSession() {
    if (!isLoginPage()) return;
    const admin = await getCurrentAdmin();
    if (admin) {
        showPageTransition();
        setTimeout(() => {
            window.location.replace("admin.html");
        }, 500);
    }
}

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const client = getSupabaseClient();
        if (!client) {
            showLoginMessage("تعذر الاتصال بقاعدة البيانات");
            return;
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            showLoginMessage("اكتب البريد الإلكتروني وكلمة المرور");
            return;
        }
        loginButton.disabled = true;
        loginButton.textContent = "جاري تسجيل الدخول...";
        showLoginMessage("");

        try {
            const { data, error } =
                await client.auth.signInWithPassword({ email, password });

            if (error || !data?.user) {
                showLoginMessage(
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة"
                );
                return;
            }

            const { data: adminData, error: adminError } = await client
                .from("admin_users")
                .select("id, username, role, is_active")
                .eq("id", data.user.id)
                .maybeSingle();

            if (adminError || !adminData) {
                // نتحقق لو ده حساب عميل
                const { data: customerData } = await client
                    .from("customer_profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .maybeSingle();

                await client.auth.signOut();

                if (customerData) {
                    showLoginMessage(
                        "هذا حساب عميل. جاري تحويلك لصفحة حسابك..."
                    );
                    setTimeout(() => {
                        window.location.replace("account-login.html");
                    }, 1500);
                    return;
                }

                showLoginMessage("هذا الحساب غير مسجل كمسؤول");
                return;
            }

            if (adminData.is_active === false) {
                await client.auth.signOut();
                showLoginMessage("هذا الحساب تم تعطيله");
                return;
            }

            showLoginMessage("تم تسجيل الدخول بنجاح", "success");
            showPageTransition();
            setTimeout(() => {
                window.location.replace("admin.html");
            }, 800);
        } catch (error) {
            console.error(error);
            showLoginMessage("حدث خطأ أثناء تسجيل الدخول");
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "تسجيل الدخول";
        }
    });
}

// ========================================
// 14. TAB NAVIGATION
// ========================================

function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");

    if (tabId === "dashboard") {
        document.getElementById("viewDashboard")?.classList.add("active");
        document.getElementById("tabNavDashboard")?.classList.add("active");
        title.textContent = "اللوحة الرئيسية";
        subtitle.textContent = "متابعة الأداء اليومي وطلبات STEP Store";
    } else if (tabId === "orders") {
        document.getElementById("viewOrders")?.classList.add("active");
        document.getElementById("tabNavOrders")?.classList.add("active");
        title.textContent = "طلبات العملاء والشحن";
        subtitle.textContent = "إدارة الطلبات ومتابعة حالات التوصيل";
    } else if (tabId === "approvals") {
        document.getElementById("viewApprovals")?.classList.add("active");
        document.getElementById("tabNavApprovals")?.classList.add("active");
        title.textContent = "طلبات موافقة الموظفين";
        subtitle.textContent = "مراجعة واعتماد تعديلات الموظفين على المنتجات";
    } else if (tabId === "products") {
        document.getElementById("viewProducts")?.classList.add("active");
        document.getElementById("tabNavProducts")?.classList.add("active");
        title.textContent = "إدارة المنتجات";
        subtitle.textContent = "إضافة وتعديل وحذف منتجات المتجر";
    }

    if (tabId === "approvals") loadApprovalRequests();
}

// ========================================
// 15. PROTECT ADMIN DASHBOARD
// ========================================

async function protectAdminDashboard() {
    if (!isAdminDashboard()) return;

    const client = getSupabaseClient();
    if (!client) {
        window.location.replace("admin-login.html");
        return;
    }

    const admin = await getCurrentAdmin();

    if (!admin) {
        const { data: sessionData } = await client.auth.getSession();
        const isCustomerSession = Boolean(sessionData?.session);

        if (isCustomerSession) {
            window.location.replace("account.html");
        } else {
            window.location.replace("admin-login.html");
        }
        return;
    }

    currentAdmin = admin;
    window.currentAdmin = admin;

    if (adminUsername) {
        adminUsername.textContent =
            admin.username || admin.email || "Admin";
    }

    if (adminRole) {
        adminRole.textContent = getRoleName(admin.role);
    }

    await Promise.all([
        loadAdminProducts(),
        loadAdminOrders(),
        loadApprovalRequests()
    ]);

    updateDashboard();
}

// ========================================
// 16. ORDERS
// ========================================

async function loadAdminOrders() {
    const client = getSupabaseClient();
    if (!client || !adminOrdersList) return;

    adminOrdersList.innerHTML = `
        <tr>
            <td colspan="8" style="text-align:center;padding:30px;color:#64748b;">
                جاري تحميل الطلبات...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await client
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        adminOrders = data || [];
        window.adminOrders = adminOrders;

        renderAdminOrders();
        updateDashboard();
    } catch (error) {
        console.error("Load Orders Error:", error);
        adminOrdersList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">
                    تعذر تحميل الطلبات
                    <br>
                    <small>${escapeAdminHTML(error.message)}</small>
                </td>
            </tr>
        `;
    }
}

function getStatusBadge(status) {
    const badges = {
        pending: { text: "جديدة", bg: "#fef3c7", color: "#92400e" },
        preparing: { text: "قيد التحضير", bg: "#e0f2fe", color: "#0369a1" },
        shipped: { text: "تم الشحن", bg: "#f3e8ff", color: "#6b21a8" },
        delivered: { text: "تم التوصيل", bg: "#dcfce7", color: "#15803d" },
        return_requested: { text: "طلب استرجاع", bg: "#fef3c7", color: "#92400e" },
        return_received: { text: "تم استلام المنتج للاسترجاع", bg: "#fed7aa", color: "#9a3412" },
        refunded: { text: "تم رد المبلغ", bg: "#dbeafe", color: "#1e40af" },
        exchange_requested: { text: "طلب استبدال", bg: "#fef3c7", color: "#92400e" },
        exchange_received: { text: "تم استلام المنتج للاستبدال", bg: "#fed7aa", color: "#9a3412" },
        exchange_shipped: { text: "تم شحن البديل", bg: "#e9d5ff", color: "#6b21a8" },
        exchanged: { text: "تم الاستبدال", bg: "#bbf7d0", color: "#166534" },
        cancelled: { text: "ملغى", bg: "#f3f4f6", color: "#4b5563" }
    };

    const badge = badges[status] || {
        text: status || "غير محدد",
        bg: "#f1f5f9",
        color: "#475569"
    };

    return `
        <span class="order-status-badge"
            style="background:${badge.bg};color:${badge.color};">
            ${escapeAdminHTML(badge.text)}
        </span>
    `;
}

function getNextOrderAction(status) {
    const actions = {
        pending: "بدء تجهيز الطلب",
        preparing: "تأكيد الشحن",
        shipped: "تأكيد التوصيل",
        delivered: "تم التسليم",
        return_requested: "استلام المنتج",
        return_received: "رد المبلغ",
        refunded: "تم الاسترجاع",
        exchange_requested: "استلام المنتج",
        exchange_received: "شحن البديل",
        exchange_shipped: "تأكيد الاستبدال",
        exchanged: "تم الاستبدال",
        cancelled: "الطلب ملغى"
    };
    return actions[status] || "متابعة الطلب";
}

// ========================================
// STATUS FLOW
// ========================================

function getAllowedStatuses(currentStatus) {
    const flows = {
        pending: ["pending", "preparing", "cancelled"],
        preparing: ["preparing", "shipped", "cancelled"],
        shipped: ["shipped", "delivered", "cancelled"],
        delivered: ["delivered", "return_requested", "exchange_requested"],
        return_requested: ["return_requested", "return_received", "cancelled"],
        return_received: ["return_received", "refunded"],
        refunded: ["refunded"],
        exchange_requested: ["exchange_requested", "exchange_received", "cancelled"],
        exchange_received: ["exchange_received", "exchange_shipped"],
        exchange_shipped: ["exchange_shipped", "exchanged"],
        exchanged: ["exchanged"],
        cancelled: ["cancelled"]
    };
    return flows[currentStatus] || [currentStatus];
}

function isLockedStatus(status) {
    return (
        status === "refunded" ||
        status === "exchanged" ||
        status === "cancelled"
    );
}

const STATUS_REQUIRES_REASON = [
    "return_requested",
    "exchange_requested",
    "cancelled"
];

const STATUS_LABELS = {
    pending: "جديدة",
    preparing: "قيد التحضير",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    return_requested: "طلب استرجاع",
    return_received: "تم استلام المنتج للاسترجاع",
    refunded: "تم رد المبلغ",
    exchange_requested: "طلب استبدال",
    exchange_received: "تم استلام المنتج للاستبدال",
    exchange_shipped: "تم شحن البديل",
    exchanged: "تم الاستبدال",
    cancelled: "ملغى"
};

function renderStatusControl(order) {
    const current = order.status;
    if (isLockedStatus(current)) return getStatusBadge(current);

    const allowed = getAllowedStatuses(current);
    const options = allowed.map(s => `
        <option value="${s}" ${s === current ? "selected" : ""}>
            ${STATUS_LABELS[s] || s}
        </option>
    `).join("");

    return `
        <select
            onchange="updateOrderStatus(${Number(order.id)}, this.value)"
            style="padding:6px 8px;border-radius:6px;border:1px solid #cbd5e1;font-family:inherit;cursor:pointer;background:#fff;">
            ${options}
        </select>
    `;
}

function renderAdminOrders() {
    if (!adminOrdersList) return;

    if (!adminOrders.length) {
        adminOrdersList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:35px;color:#64748b;">
                    لا توجد طلبات مسجلة حالياً
                </td>
            </tr>
        `;
        return;
    }

    adminOrdersList.innerHTML = adminOrders.map(order => {
        const totalAmount = Number(order.total_amount || 0).toLocaleString("ar-EG");
        const phone = escapeAdminHTML(order.customer_phone || "-");
        const governorate = escapeAdminHTML(
            order.governorate || order.customer_governorate || order.city || "-"
        );

        return `
            <tr>
                <td><strong>#${escapeAdminHTML(order.id)}</strong></td>
                <td><strong>${escapeAdminHTML(order.customer_name || "عميل")}</strong></td>
                <td>
                    <div>${phone}</div>
                    <small style="color:#64748b;">${governorate}</small>
                </td>
                <td><strong>${totalAmount} جنيه</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>${renderStatusControl(order)}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button type="button" onclick="viewOrderDetails(${Number(order.id)})"
                            style="border:none;background:#eff6ff;color:#2563eb;border-radius:6px;padding:7px 10px;cursor:pointer;"
                            title="عرض التفاصيل">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button type="button" onclick="sendWhatsAppStatusUpdate(${Number(order.id)})"
                            style="border:none;background:#dcfce7;color:#16a34a;border-radius:6px;padding:7px 10px;cursor:pointer;"
                            title="إرسال واتساب">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================
// 17. ORDER FILTER
// ========================================

function filterOrders(status, btnElement) {
    if (btnElement) {
        document.querySelectorAll(".filter-btn").forEach(button => {
            button.classList.remove("active");
        });
        btnElement.classList.add("active");
    }

    if (!adminOrdersList) return;

    const filtered = status === "all"
        ? adminOrders
        : adminOrders.filter(order => order.status === status);

    if (!filtered.length) {
        adminOrdersList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:35px;color:#64748b;">
                    لا توجد طلبات في هذه الحالة
                </td>
            </tr>
        `;
        return;
    }

    const oldOrders = adminOrders;
    adminOrders = filtered;
    renderAdminOrders();
    adminOrders = oldOrders;
}

// ========================================
// 18. UPDATE ORDER STATUS
// ========================================

async function updateOrderStatus(orderId, newStatus) {
    const order = adminOrders.find(
        item => Number(item.id) === Number(orderId)
    );
    if (!order) return;

    if (isLockedStatus(order.status)) {
        alert("لا يمكن تعديل حالة هذا الطلب — الحالة نهائية");
        renderAdminOrders();
        return;
    }

    const allowed = getAllowedStatuses(order.status);
    if (!allowed.includes(newStatus)) {
        alert("هذا التغيير في الحالة غير مسموح");
        renderAdminOrders();
        return;
    }

    if (STATUS_REQUIRES_REASON.includes(newStatus)) {
        openStatusReasonModal(order, newStatus);
        return;
    }

    let confirmMessage =
        `هل تريد تغيير حالة الطلب #${order.id} إلى "${STATUS_LABELS[newStatus]}"؟`;

    if (newStatus === "refunded" || newStatus === "exchanged") {
        confirmMessage +=
            "\n\n⚠️ تحذير: هذه حالة نهائية ولا يمكن التراجع عنها!";
    }

    if (!confirm(confirmMessage)) {
        renderAdminOrders();
        return;
    }

    await applyStatusChange(order.id, newStatus, null, null);
}

async function applyStatusChange(orderId, newStatus, reason, notes) {
    const client = getSupabaseClient();
    if (!client) return;

    const order = adminOrders.find(
        item => Number(item.id) === Number(orderId)
    );
    if (!order) return;

    const historyEntry = {
        status: newStatus,
        reason: reason || null,
        notes: notes || null,
        by: currentAdmin?.username || currentAdmin?.email || "admin",
        at: new Date().toISOString()
    };

    const currentHistory = Array.isArray(order.status_history)
        ? order.status_history
        : [];
    const newHistory = [...currentHistory, historyEntry];

    const updates = {
        status: newStatus,
        status_history: newHistory,
        updated_at: new Date().toISOString()
    };

    if (newStatus === "return_requested" && reason) {
        updates.return_reason = reason;
    }
    if (newStatus === "exchange_requested" && reason) {
        updates.exchange_reason = reason;
    }

    try {
        const { error } = await client
            .from("orders")
            .update(updates)
            .eq("id", orderId);

        if (error) throw error;

        order.status = newStatus;
        order.status_history = newHistory;

        if (newStatus === "return_requested" && reason) {
            order.return_reason = reason;
        }
        if (newStatus === "exchange_requested" && reason) {
            order.exchange_reason = reason;
        }

        renderAdminOrders();
        updateDashboard();
    } catch (error) {
        console.error("Update Order Status Error:", error);
        alert("فشل تحديث حالة الطلب:\n\n" + error.message);
        renderAdminOrders();
    }
}

// ========================================
// 19. WHATSAPP
// ========================================

function sendWhatsAppStatusUpdate(orderId) {
    const order = adminOrders.find(
        item => Number(item.id) === Number(orderId)
    );

    if (!order || !order.customer_phone) {
        alert("رقم الهاتف غير مسجل لهذا الطلب");
        return;
    }

    let phone = String(order.customer_phone).replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "2" + phone;

    const messages = {
        preparing: `مرحباً ${order.customer_name || "عميل"} 👋\nتم البدء في تجهيز طلبك رقم #${order.id} من متجر STEP! 👟`,
        shipped: `مرحباً ${order.customer_name || "عميل"} 🚚\nبشرى سارة! تم شحن طلبك رقم #${order.id} وهو في طريقه إليك.`,
        delivered: `مرحباً ${order.customer_name || "عميل"} ✅\nتم توصيل طلبك رقم #${order.id} بنجاح. شكراً لتسوقك من STEP!`,
        return_requested: `مرحباً ${order.customer_name || "عميل"}\nتم تسجيل طلب الاسترجاع للطلب رقم #${order.id}.`,
        refunded: `مرحباً ${order.customer_name || "عميل"}\nتم رد مبلغ الطلب #${order.id} بنجاح.`,
        exchanged: `مرحباً ${order.customer_name || "عميل"}\nتم استبدال الطلب #${order.id} بنجاح.`
    };

    const text = messages[order.status] ||
        `مرحباً ${order.customer_name || "عميل"}، تحديث بخصوص طلبك رقم #${order.id}.`;

    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
        "_blank"
    );
}

// ========================================
// 20. VIEW ORDER DETAILS
// ========================================

function viewOrderDetails(orderId) {
    const order = adminOrders.find(
        item => Number(item.id) === Number(orderId)
    );

    if (!order || !orderModal || !orderModalDetails) return;

    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHTML = items.map(item => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:10px 0;gap:15px;">
                <div>
                    <strong>${escapeAdminHTML(item.name || "منتج")}</strong>
                    <div style="font-size:12px;color:#64748b;">
                        المقاس: ${escapeAdminHTML(item.size || "-")} |
                        الكمية: ${quantity}
                    </div>
                </div>
                <div>
                    <strong>${(price * quantity).toLocaleString("ar-EG")} جنيه</strong>
                </div>
            </div>
        `;
    }).join("");

    const returnReasonHTML = order.return_reason ? `
        <p style="margin-top:10px;background:#fef2f2;padding:10px;border-radius:8px;">
            <strong style="color:#dc2626;">سبب الاسترجاع:</strong>
            ${escapeAdminHTML(order.return_reason)}
        </p>
    ` : "";

    const exchangeReasonHTML = order.exchange_reason ? `
        <p style="margin-top:10px;background:#fff7ed;padding:10px;border-radius:8px;">
            <strong style="color:#d97706;">سبب الاستبدال:</strong>
            ${escapeAdminHTML(order.exchange_reason)}
        </p>
    ` : "";

    const historyHTML = Array.isArray(order.status_history) && order.status_history.length
        ? `
            <div style="margin-top:20px;">
                <h4 style="margin-bottom:10px;">سجل تغييرات الحالة:</h4>
                <div style="border-right:3px solid #e5e7eb;padding-right:12px;">
                    ${order.status_history.map(h => `
                        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed #f0f0f0;">
                            <div style="font-weight:700;font-size:13px;color:#111;">
                                ${escapeAdminHTML(STATUS_LABELS[h.status] || h.status)}
                            </div>
                            ${h.reason ? `
                                <div style="font-size:12px;color:#dc2626;margin-top:3px;">
                                    السبب: ${escapeAdminHTML(h.reason)}
                                </div>
                            ` : ""}
                            ${h.notes ? `
                                <div style="font-size:12px;color:#555;margin-top:3px;">
                                    ملاحظات: ${escapeAdminHTML(h.notes)}
                                </div>
                            ` : ""}
                            <div style="font-size:11px;color:#999;margin-top:4px;">
                                ${escapeAdminHTML(h.by || "-")} · ${formatDate(h.at)}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `
        : "";

    orderModalDetails.innerHTML = `
        <h3>تفاصيل الطلب #${escapeAdminHTML(order.id)}</h3>

        <p><strong>اسم العميل:</strong> ${escapeAdminHTML(order.customer_name || "-")}</p>
        <p><strong>رقم الهاتف:</strong> ${escapeAdminHTML(order.customer_phone || "-")}</p>
        <p><strong>العنوان:</strong> ${escapeAdminHTML(order.customer_address || "غير مدون")}</p>
        <p><strong>الحالة:</strong> ${getStatusBadge(order.status)}</p>
        <p><strong>تاريخ الطلب:</strong> ${formatDate(order.created_at)}</p>

        ${returnReasonHTML}
        ${exchangeReasonHTML}

        <hr style="margin:15px 0;border:0;border-top:1px solid #ddd;">

        <h4>المنتجات:</h4>
        ${itemsHTML || "<p>لا توجد تفاصيل للمنتجات</p>"}

        <div style="margin-top:15px;padding-top:15px;border-top:2px solid #f0f0f0;">
            <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:5px 0;">
                <span>المنتجات:</span>
                <strong>
                    ${Number(order.subtotal || order.total_amount || 0).toLocaleString("ar-EG")} جنيه
                </strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:5px 0;">
                <span>الشحن:</span>
                <strong style="color:${Number(order.shipping_cost) === 0 ? '#16a34a' : '#111'};">
                    ${
                        Number(order.shipping_cost) === 0
                            ? 'مجاني'
                            : Number(order.shipping_cost || 0).toLocaleString("ar-EG") + ' جنيه'
                    }
                </strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:16px;padding:10px 0 0;border-top:1px solid #eee;margin-top:8px;">
                <strong>الإجمالي الكلي:</strong>
                <strong style="color:#2563eb;">
                    ${Number(order.total_amount || 0).toLocaleString("ar-EG")} جنيه
                </strong>
            </div>
        </div>

        ${historyHTML}
    `;

    orderModal.classList.add("open");
}

if (closeOrderModalBtn) {
    closeOrderModalBtn.addEventListener("click", () => {
        orderModal?.classList.remove("open");
    });
}

// ========================================
// 21. PRODUCTS
// ========================================

async function loadAdminProducts() {
    const client = getSupabaseClient();
    if (!client || !adminProductsList) return;

    adminProductsList.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:30px;color:#64748b;">
                جاري تحميل المنتجات...
            </td>
        </tr>
    `;

    try {
        const { data, error } = await client
            .from("products")
            .select(`
                id, name, price, old_price, badge, sizes, image,
                created_at, description,
                created_by, created_by_username,
                updated_by, updated_by_username, updated_at,
                created_user_id, created_username,
                updated_user_id, updated_username
            `)
            .order("id", { ascending: false });

        if (error) throw error;

        adminProducts = data || [];
        window.adminProducts = adminProducts;

        if (statTotal) statTotal.textContent = adminProducts.length;
        if (dashStatProducts) dashStatProducts.textContent = adminProducts.length;

        renderAdminProducts();
    } catch (error) {
        console.error("Load Products Error:", error);
        adminProductsList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">
                    حدث خطأ أثناء تحميل المنتجات
                    <br>
                    <small>${escapeAdminHTML(error.message)}</small>
                </td>
            </tr>
        `;
    }
}

function renderAdminProducts() {
    if (!adminProductsList) return;

    if (!adminProducts.length) {
        adminProductsList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:35px;color:#64748b;">
                    لا توجد منتجات حالياً
                </td>
            </tr>
        `;
        return;
    }

    adminProductsList.innerHTML = adminProducts.map(product => {
        const image = product.image ? escapeAdminHTML(product.image) : "";
        const name = escapeAdminHTML(product.name);
        const price = Number(product.price || 0);
        const creator = product.created_username || product.created_by_username || "System";
        const updater = product.updated_username || product.updated_by_username || "-";
        const lastUpdated = product.updated_at
            ? formatDate(product.updated_at)
            : formatDate(product.created_at);

        return `
            <tr>
                <td>
                    ${image ? `
                        <img src="${image}" alt="${name}"
                            style="width:60px;height:60px;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb;">
                    ` : `
                        <div style="width:60px;height:60px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">
                            <i class="fa-solid fa-image"></i>
                        </div>
                    `}
                </td>
                <td>
                    <strong>${name}</strong>
                    ${product.badge ? `
                        <div style="margin-top:5px;font-size:11px;color:#2563eb;font-weight:700;">
                            ${escapeAdminHTML(normalizeBadge(product.badge))}
                        </div>
                    ` : ""}
                </td>
                <td>${price.toLocaleString("ar-EG")} جنيه</td>
                <td>${escapeAdminHTML(creator)}</td>
                <td>
                    <div>${escapeAdminHTML(updater)}</div>
                    <small style="color:#94a3b8;">${lastUpdated}</small>
                </td>
                <td>
                    <div style="display:flex;gap:7px;flex-wrap:wrap;">
                        <button type="button" onclick="prepareEditProduct(${Number(product.id)})"
                            style="border:none;background:#eff6ff;color:#2563eb;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;">
                            <i class="fa-solid fa-pen"></i> تعديل
                        </button>
                        <button type="button" onclick="prepareDeleteProduct(${Number(product.id)})"
                            style="border:none;background:#fef2f2;color:#dc2626;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;">
                            <i class="fa-solid fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================
// 22. PRODUCT SNAPSHOT
// ========================================

function getProductSnapshot(product) {
    return {
        id: product.id,
        name: product.name || "",
        price: Number(product.price || 0),
        old_price: product.old_price == null ? null : Number(product.old_price),
        badge: product.badge || null,
        sizes: parseSizes(product.sizes),
        image: product.image || null,
        description: product.description || ""
    };
}

// ========================================
// 23. PRODUCT CHANGE LOG
// ========================================

async function createProductChangeLog({
    productId, action, oldData = null, newData = null,
    performedBy = null, performedByUsername = null,
    approvedBy = null, approvedByUsername = null
}) {
    const client = getSupabaseClient();
    if (!client) throw new Error("غير متصل بـ Supabase");

    const { error } = await client.from("product_change_logs").insert({
        product_id: productId,
        action,
        old_data: oldData,
        new_data: newData,
        performed_by: performedBy,
        performed_by_username: performedByUsername,
        approved_by: approvedBy,
        approved_by_username: approvedByUsername
    });

    if (error) throw error;
}

function getEditProductData() {
    return {
        name: editName?.value.trim() || "",
        price: Number(editPrice?.value || 0),
        old_price: editOldPrice?.value === "" ? null : Number(editOldPrice.value),
        badge: editBadge?.value.trim() || null,
        sizes: parseSizes(editSizes?.value || ""),
        image: editImageUrl?.value.trim() || null,
        description: editDescription?.value.trim() || ""
    };
}

function validateProductData(data) {
    if (!data.name) {
        alert("اكتب اسم المنتج");
        return false;
    }
    if (!Number.isFinite(data.price) || data.price <= 0) {
        alert("اكتب سعر صحيح للمنتج");
        return false;
    }
    return true;
}

// ========================================
// 24. EDIT PRODUCT
// ========================================

function prepareEditProduct(productId) {
    const product = adminProducts.find(
        item => Number(item.id) === Number(productId)
    );
    if (!product || !editModal) return;

    editProductId.value = product.id;
    editName.value = product.name || "";
    editPrice.value = product.price ?? "";
    editOldPrice.value = product.old_price ?? "";
    editBadge.value = normalizeBadge(product.badge);
    editSizes.value = parseSizes(product.sizes).join(", ");
    editDescription.value = product.description || "";
    editImageUrl.value = product.image || "";

    editModal.classList.add("open");
}

function closeEditProductModal() {
    if (!editModal) return;
    editModal.classList.remove("open");
}

if (closeEditModal) {
    closeEditModal.addEventListener("click", closeEditProductModal);
}
if (cancelEditButton) {
    cancelEditButton.addEventListener("click", closeEditProductModal);
}

// ========================================
// 25. CHANGE REQUEST
// ========================================

async function createChangeRequest(product, action, newData) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase غير متصل");

    const requestData = {
        product_id: product.id,
        action: action,
        requested_by: currentAdmin.id,
        requested_by_username: currentAdmin.username || currentAdmin.email || "Admin",
        old_data: getProductSnapshot(product),
        new_data: newData,
        status: "pending"
    };

    const { error } = await client
        .from("product_change_requests")
        .insert(requestData);

    if (error) throw error;
}

// ========================================
// 26. EDIT SUBMIT
// ========================================

if (editProductForm) {
    editProductForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!currentAdmin) return;

        const productId = Number(editProductId.value);
        const product = adminProducts.find(
            item => Number(item.id) === productId
        );
        if (!product) return;

        const newData = getEditProductData();
        if (!validateProductData(newData)) return;

        saveEditButton.disabled = true;
        saveEditButton.textContent = isManager()
            ? "جاري الحفظ..."
            : "جاري إرسال الطلب...";

        try {
            const client = getSupabaseClient();

            if (isManager()) {
                const { error } = await client
                    .from("products")
                    .update({
                        ...newData,
                        updated_by: currentAdmin.id,
                        updated_by_username: currentAdmin.username || currentAdmin.email,
                        updated_at: new Date().toISOString(),
                        updated_user_id: currentAdmin.id,
                        updated_username: currentAdmin.username || currentAdmin.email
                    })
                    .eq("id", product.id);

                if (error) throw error;

                await createProductChangeLog({
                    productId: product.id,
                    action: "update",
                    oldData: getProductSnapshot(product),
                    newData: newData,
                    performedBy: currentAdmin.id,
                    performedByUsername: currentAdmin.username || currentAdmin.email || "Manager"
                });

                alert("تم تعديل المنتج بنجاح ✅");
            } else {
                await createChangeRequest(product, "update", newData);
                alert("تم إرسال طلب تعديل المنتج للمدير للموافقة ⏳");
            }

            closeEditProductModal();
            await loadAdminProducts();
            await loadApprovalRequests();
        } catch (error) {
            console.error("Edit Product Error:", error);
            alert("حدث خطأ أثناء تعديل المنتج:\n\n" + error.message);
        } finally {
            saveEditButton.disabled = false;
            saveEditButton.textContent = "حفظ التغييرات";
        }
    });
}

// ========================================
// 27. DELETE PRODUCT
// ========================================

async function prepareDeleteProduct(productId) {
    const product = adminProducts.find(
        item => Number(item.id) === Number(productId)
    );
    if (!product) return;

    const confirmed = confirm(`هل تريد حذف المنتج؟\n\n${product.name}`);
    if (!confirmed) return;
    if (!currentAdmin) return;

    try {
        const client = getSupabaseClient();

        if (isManager()) {
            const { error } = await client
                .from("products")
                .delete()
                .eq("id", product.id);
            if (error) throw error;

            await createProductChangeLog({
                productId: product.id,
                action: "delete",
                oldData: getProductSnapshot(product),
                newData: null,
                performedBy: currentAdmin.id,
                performedByUsername: currentAdmin.username || currentAdmin.email || "Manager"
            });

            alert("تم حذف المنتج بنجاح ✅");
        } else {
            await createChangeRequest(product, "delete", null);
            alert("تم إرسال طلب حذف المنتج للمدير للموافقة ⏳");
        }

        await loadAdminProducts();
        await loadApprovalRequests();
    } catch (error) {
        console.error("Delete Product Error:", error);
        alert("حدث خطأ أثناء حذف المنتج:\n\n" + error.message);
    }
}

// ========================================
// 28. ADD PRODUCT
// ========================================

if (addProductForm) {
    addProductForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const client = getSupabaseClient();
        if (!client || !currentAdmin) return;

        const name = addName?.value.trim() || "";
        const price = Number(addPrice?.value || 0);

        if (!name || !Number.isFinite(price) || price <= 0) {
            alert("يرجى التأكد من إدخال البيانات الصحيحة");
            return;
        }

        addSubmitButton.disabled = true;
        addSubmitButton.textContent = "جاري الإضافة...";

        try {
            const productData = {
                name,
                price,
                old_price: addOldPrice?.value === "" ? null : Number(addOldPrice.value),
                badge: addBadge?.value.trim() || null,
                sizes: parseSizes(addSizes?.value || ""),
                image: addImageUrl?.value.trim() || null,
                description: addDescription?.value.trim() || "",
                created_by: currentAdmin.id,
                created_by_username: currentAdmin.username || currentAdmin.email,
                created_user_id: currentAdmin.id,
                created_username: currentAdmin.username || currentAdmin.email
            };

            const { data: insertedProduct, error } = await client
                .from("products")
                .insert(productData)
                .select()
                .single();

            if (error) throw error;

            await createProductChangeLog({
                productId: insertedProduct.id,
                action: "create",
                oldData: null,
                newData: getProductSnapshot(insertedProduct),
                performedBy: currentAdmin.id,
                performedByUsername: currentAdmin.username || currentAdmin.email || "Admin"
            });

            alert("تم إضافة المنتج بنجاح ✅");
            addProductForm.reset();
            await loadAdminProducts();
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء إضافة المنتج:\n\n" + error.message);
        } finally {
            addSubmitButton.disabled = false;
            addSubmitButton.textContent = "إضافة المنتج";
        }
    });
}

// ========================================
// 29. APPROVAL REQUESTS
// ========================================

async function loadApprovalRequests() {
    const client = getSupabaseClient();
    if (!client || !approvalRequests) return;

    approvalRequests.innerHTML = `
        <div style="text-align:center;padding:30px;color:#64748b;">
            جاري تحميل طلبات الموافقة...
        </div>
    `;

    try {
        const { data, error } = await client
            .from("product_change_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        adminApprovalRequests = data || [];
        window.adminApprovalRequests = adminApprovalRequests;

        const pendingCount = adminApprovalRequests.filter(
            request => request.status === "pending"
        ).length;

        if (dashStatPending) dashStatPending.textContent = pendingCount;
        if (sidebarPendingBadge) sidebarPendingBadge.textContent = pendingCount;

        renderApprovalRequests();
    } catch (error) {
        console.error("Approval Requests Error:", error);
        approvalRequests.innerHTML = `
            <div style="text-align:center;padding:30px;color:#dc2626;">
                حدث خطأ أثناء تحميل طلبات الموافقة
                <br>
                <small>${escapeAdminHTML(error.message)}</small>
            </div>
        `;
    }
}

// ========================================
// 30. APPROVAL FILTER
// ========================================

function filterApprovalRequests(status, button) {
    currentApprovalFilter = status;

    document.querySelectorAll(".approval-filter button").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) button.classList.add("active");

    renderApprovalRequests();
}

// ========================================
// 31. RENDER APPROVAL REQUESTS
// ========================================

function renderApprovalRequests() {
    if (!approvalRequests) return;

    let requests = adminApprovalRequests;

    if (currentApprovalFilter !== "all") {
        requests = requests.filter(
            request => request.status === currentApprovalFilter
        );
    }

    if (!requests.length) {
        approvalRequests.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-check-circle"></i>
                <div>لا توجد طلبات في هذه القائمة</div>
            </div>
        `;
        return;
    }

    approvalRequests.innerHTML = requests.map(
        request => buildApprovalCard(request)
    ).join("");
}

// ========================================
// 32. APPROVAL CARD
// ========================================

function buildApprovalCard(request) {
    const actionText = request.action === "update"
        ? "تعديل منتج"
        : request.action === "delete"
            ? "حذف منتج"
            : request.action;

    const statusText = request.status === "pending"
        ? "في انتظار الموافقة"
        : request.status === "approved"
            ? "تمت الموافقة"
            : "مرفوض";

    const statusClass = request.status === "pending"
        ? "status-waiting"
        : request.status === "approved"
            ? "status-approved"
            : "status-rejected";

    const product = adminProducts.find(
        item => Number(item.id) === Number(request.product_id)
    );

    const productName = request.new_data?.name ||
        request.old_data?.name ||
        product?.name ||
        `المنتج #${request.product_id}`;

    const canApprove = isManager() && request.status === "pending";

    return `
        <div class="request-card">
            <div class="request-header">
                <div>
                    <div class="request-title">
                        ${escapeAdminHTML(actionText)} - طلب #${escapeAdminHTML(request.id)}
                    </div>
                    <div style="color:#64748b;margin-top:4px;">
                        ${escapeAdminHTML(productName)}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>

            <div class="request-info">
                <div><strong>المنتج رقم:</strong> ${escapeAdminHTML(request.product_id)}</div>
                <div><strong>مقدم الطلب:</strong> ${escapeAdminHTML(request.requested_by_username || "مسؤول")}</div>
                <div><strong>تاريخ الطلب:</strong> ${formatDate(request.created_at)}</div>
                ${request.approved_by_username ? `
                    <div><strong>تمت المراجعة بواسطة:</strong> ${escapeAdminHTML(request.approved_by_username)}</div>
                ` : ""}
                ${request.approved_at ? `
                    <div><strong>تاريخ المراجعة:</strong> ${formatDate(request.approved_at)}</div>
                ` : ""}
            </div>

            <div class="request-actions">
                <button type="button" class="details-btn"
                    onclick="viewApprovalRequest(${Number(request.id)})">
                    <i class="fa-solid fa-eye"></i> عرض التفاصيل
                </button>
                ${canApprove ? `
                    <button type="button" class="approve-btn"
                        onclick="approveChangeRequest(${Number(request.id)})">
                        <i class="fa-solid fa-check"></i> موافقة
                    </button>
                    <button type="button" class="reject-btn"
                        onclick="rejectChangeRequest(${Number(request.id)})">
                        <i class="fa-solid fa-xmark"></i> رفض
                    </button>
                ` : ""}
            </div>
        </div>
    `;
}

// ========================================
// 33. FORMAT REQUEST VALUE
// ========================================

function formatRequestValue(field, value) {
    if (value === null || value === undefined || value === "") {
        return "غير موجود";
    }

    if (field === "price") {
        return Number(value).toLocaleString("ar-EG") + " جنيه";
    }

    if (field === "old_price") {
        return value === null
            ? "غير موجود"
            : Number(value).toLocaleString("ar-EG") + " جنيه";
    }

    if (field === "sizes") {
        const sizes = parseSizes(value);
        return sizes.length
            ? sizes.map(size => `
                <span style="display:inline-block;background:#f1f5f9;padding:3px 7px;border-radius:5px;margin:2px;">
                    ${escapeAdminHTML(size)}
                </span>
            `).join("")
            : "لا توجد مقاسات";
    }

    if (field === "image") {
        const image = String(value);
        return `
            <div>
                <img src="${escapeAdminHTML(image)}" class="request-image-preview"
                    onerror="this.style.display='none'" alt="">
                <div style="margin-top:5px;word-break:break-all;font-size:11px;">
                    ${escapeAdminHTML(image)}
                </div>
            </div>
        `;
    }

    return escapeAdminHTML(String(value)).replace(/\n/g, "<br>");
}

// ========================================
// 34. BUILD REQUEST CHANGES
// ========================================

function buildRequestChanges(request) {
    const oldData = request.old_data || {};
    const newData = request.new_data || {};

    const fields = [
        { key: "name", label: "اسم المنتج" },
        { key: "price", label: "السعر الحالي" },
        { key: "old_price", label: "السعر القديم" },
        { key: "badge", label: "الشارة" },
        { key: "sizes", label: "المقاسات" },
        { key: "image", label: "الصورة" },
        { key: "description", label: "الوصف" }
    ];

    const rows = fields.map(field => {
        let oldValue = oldData[field.key];
        let newValue = newData[field.key];

        if (field.key === "sizes") {
            oldValue = parseSizes(oldValue);
            newValue = parseSizes(newValue);
        }

        const oldComparable = JSON.stringify(oldValue ?? null);
        const newComparable = JSON.stringify(newValue ?? null);
        const changed = oldComparable !== newComparable;

        return `
            <tr>
                <th>${escapeAdminHTML(field.label)}</th>
                <td class="old-value">
                    ${changed ? `<strong style="color:#dc2626;font-size:11px;">قبل</strong><br>` : ""}
                    ${formatRequestValue(field.key, oldValue)}
                </td>
                <td class="new-value">
                    ${changed ? `<strong style="color:#16a34a;font-size:11px;">بعد</strong><br>` : ""}
                    ${formatRequestValue(field.key, newValue)}
                </td>
            </tr>
        `;
    }).join("");

    return `
        <table class="change-table">
            <thead>
                <tr>
                    <th>البيان</th>
                    <th>البيانات الحالية</th>
                    <th>التعديل المقترح</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// ========================================
// 35. VIEW APPROVAL DETAILS
// ========================================

function viewApprovalRequest(requestId) {
    const request = adminApprovalRequests.find(
        item => Number(item.id) === Number(requestId)
    );

    if (!request || !approvalModal || !approvalModalBody) return;

    const actionText = request.action === "update"
        ? "تعديل المنتج"
        : request.action === "delete"
            ? "حذف المنتج"
            : request.action;

    const productName = request.new_data?.name ||
        request.old_data?.name ||
        `المنتج #${request.product_id}`;

    let bodyHTML = `
        <div style="background:#f8fafc;padding:15px;border-radius:10px;margin-bottom:18px;line-height:1.9;">
            <h3 style="margin-bottom:8px;">${escapeAdminHTML(actionText)}</h3>
            <div><strong>اسم المنتج:</strong> ${escapeAdminHTML(productName)}</div>
            <div><strong>رقم المنتج:</strong> ${escapeAdminHTML(request.product_id)}</div>
            <div><strong>مقدم الطلب:</strong> ${escapeAdminHTML(request.requested_by_username || "مسؤول")}</div>
            <div><strong>تاريخ الطلب:</strong> ${formatDate(request.created_at)}</div>
        </div>
    `;

    if (request.action === "delete") {
        const oldData = request.old_data || {};
        bodyHTML += `
            <div class="delete-warning">
                <strong>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    طلب حذف المنتج
                </strong>
                <p>سيتم حذف المنتج بالكامل من جدول المنتجات إذا تمت الموافقة على هذا الطلب.</p>
                <hr style="border:0;border-top:1px solid #fecdd3;margin:10px 0;">
                <div><strong>اسم المنتج:</strong> ${escapeAdminHTML(oldData.name || "-")}</div>
                <div><strong>السعر:</strong> ${formatRequestValue("price", oldData.price)}</div>
                <div><strong>الشارة:</strong> ${formatRequestValue("badge", oldData.badge)}</div>
                <div><strong>المقاسات:</strong> ${formatRequestValue("sizes", oldData.sizes)}</div>
            </div>
        `;
    } else {
        bodyHTML += `
            <div>
                <h3 style="margin-bottom:10px;">مقارنة البيانات</h3>
                <p style="color:#64748b;font-size:13px;margin-bottom:10px;">
                    البيانات باللون الأحمر هي البيانات الحالية،
                    والبيانات باللون الأخضر هي التعديل المقترح.
                </p>
                ${buildRequestChanges(request)}
            </div>
        `;
    }

    approvalModalBody.innerHTML = bodyHTML;
    approvalModalActions.innerHTML = "";

    if (isManager() && request.status === "pending") {
        approvalModalActions.innerHTML = `
            <button type="button" class="modal-approve"
                onclick="approveChangeRequest(${Number(request.id)}, true)">
                <i class="fa-solid fa-check"></i>
                الموافقة وتنفيذ التعديل
            </button>
            <button type="button" class="modal-reject"
                onclick="rejectChangeRequest(${Number(request.id)}, true)">
                <i class="fa-solid fa-xmark"></i>
                رفض الطلب
            </button>
        `;
    }

    approvalModal.classList.add("open");
}

function closeApprovalRequestModal() {
    approvalModal?.classList.remove("open");
}

if (closeApprovalModal) {
    closeApprovalModal.addEventListener("click", closeApprovalRequestModal);
}

// ========================================
// 36. APPROVE CHANGE REQUEST
// ========================================

async function approveChangeRequest(requestId, fromModal = false) {
    if (!isManager()) {
        alert("ليس لديك صلاحية الموافقة على الطلبات");
        return;
    }
    const client = getSupabaseClient();
    if (!client) return;

    const confirmed = confirm("هل تريد الموافقة على هذا الطلب وتنفيذه؟");
    if (!confirmed) return;

    try {
        const { data: request, error: requestError } = await client
            .from("product_change_requests")
            .select("*")
            .eq("id", requestId)
            .single();

        if (requestError) throw requestError;

        if (!request || request.status !== "pending") {
            alert("هذا الطلب تمت معالجته بالفعل");
            return;
        }

        if (request.action === "update") {
            const newData = request.new_data || {};
            const { error } = await client
                .from("products")
                .update({
                    name: newData.name || "",
                    price: Number(newData.price || 0),
                    old_price: newData.old_price == null
                        ? null
                        : Number(newData.old_price),
                    badge: newData.badge || null,
                    sizes: Array.isArray(newData.sizes) ? newData.sizes : [],
                    image: newData.image || null,
                    description: newData.description || "",
                    updated_by: request.requested_by,
                    updated_by_username: request.requested_by_username,
                    updated_at: new Date().toISOString(),
                    updated_user_id: request.requested_by,
                    updated_username: request.requested_by_username
                })
                .eq("id", request.product_id);

            if (error) throw error;

            await createProductChangeLog({
                productId: request.product_id,
                action: "update",
                oldData: request.old_data || null,
                newData: request.new_data || null,
                performedBy: request.requested_by,
                performedByUsername: request.requested_by_username,
                approvedBy: currentAdmin.id,
                approvedByUsername: currentAdmin.username || currentAdmin.email || "Manager"
            });
        } else if (request.action === "delete") {
            const { error } = await client
                .from("products")
                .delete()
                .eq("id", request.product_id);

            if (error) throw error;

            await createProductChangeLog({
                productId: request.product_id,
                action: "delete",
                oldData: request.old_data || null,
                newData: null,
                performedBy: request.requested_by,
                performedByUsername: request.requested_by_username,
                approvedBy: currentAdmin.id,
                approvedByUsername: currentAdmin.username || currentAdmin.email || "Manager"
            });
        }

        const { error: approvalError } = await client
            .from("product_change_requests")
            .update({
                status: "approved",
                approved_by: currentAdmin.id,
                approved_by_username: currentAdmin.username || currentAdmin.email,
                approved_at: new Date().toISOString()
            })
            .eq("id", request.id)
            .eq("status", "pending");

        if (approvalError) throw approvalError;

        alert("تمت الموافقة على الطلب وتنفيذه بنجاح ✅");
        closeApprovalRequestModal();

        await loadAdminProducts();
        await loadApprovalRequests();
    } catch (error) {
        console.error("Approve Request Error:", error);
        alert("حدث خطأ أثناء الموافقة:\n\n" + error.message);
    }
}

// ========================================
// 37. REJECT CHANGE REQUEST
// ========================================

async function rejectChangeRequest(requestId, fromModal = false) {
    if (!isManager()) {
        alert("ليس لديك صلاحية رفض الطلبات");
        return;
    }
    const client = getSupabaseClient();
    if (!client) return;

    const confirmed = confirm("هل تريد رفض هذا الطلب؟");
    if (!confirmed) return;

    try {
        const { error } = await client
            .from("product_change_requests")
            .update({
                status: "rejected",
                approved_by: currentAdmin.id,
                approved_by_username: currentAdmin.username || currentAdmin.email,
                approved_at: new Date().toISOString()
            })
            .eq("id", requestId)
            .eq("status", "pending");

        if (error) throw error;

        alert("تم رفض الطلب ❌");
        closeApprovalRequestModal();
        await loadApprovalRequests();
    } catch (error) {
        console.error("Reject Request Error:", error);
        alert("حدث خطأ أثناء رفض الطلب:\n\n" + error.message);
    }
}

// ========================================
// 38. DASHBOARD
// ========================================

function renderDashboardOrders() {
    if (!dashRecentOrdersList) return;

    const recent = adminOrders.slice(0, 5);
    const newOrders = adminOrders.filter(
        order => order.status === "pending"
    );

    if (dashStatNewOrders) dashStatNewOrders.textContent = newOrders.length;
    if (sidebarNewOrdersBadge) sidebarNewOrdersBadge.textContent = newOrders.length;

    if (!recent.length) {
        dashRecentOrdersList.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#64748b;">
                    لا توجد طلبات حديثة حالياً
                </td>
            </tr>
        `;
        return;
    }

    dashRecentOrdersList.innerHTML = recent.map(order => {
        const governorate = order.governorate ||
            order.customer_governorate ||
            order.city || "-";

        return `
            <tr>
                <td>#${escapeAdminHTML(order.id)}</td>
                <td>${escapeAdminHTML(order.customer_name || "عميل")}</td>
                <td>${escapeAdminHTML(governorate)}</td>
                <td>${Number(order.total_amount || 0).toLocaleString("ar-EG")} جنيه</td>
                <td>${getStatusBadge(order.status)}</td>
            </tr>
        `;
    }).join("");
}

function updateDashboard() {
    if (dashStatProducts) {
        dashStatProducts.textContent = adminProducts.length;
    }

    const deliveredOrders = adminOrders.filter(
        order => order.status === "delivered"
    );

    const totalRevenue = deliveredOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
    );

    if (dashStatRevenue) {
        dashStatRevenue.textContent =
            `${totalRevenue.toLocaleString("ar-EG")} ج.م`;
    }

    renderDashboardOrders();
    renderTopSelling();
}

function renderTopSelling() {
    if (!dashTopSellingList) return;

    const productSales = {};
    const validOrders = adminOrders.filter(
        order => order.status === "delivered"
    );

    validOrders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach(item => {
            const key = String(item.id ?? item.name ?? "unknown");
            if (!productSales[key]) {
                productSales[key] = {
                    id: item.id,
                    name: item.name || "منتج",
                    image: item.image || "",
                    quantity: 0,
                    revenue: 0
                };
            }
            const qty = Number(item.quantity || 1);
            const price = Number(item.price || 0);
            productSales[key].quantity += qty;
            productSales[key].revenue += qty * price;
        });
    });

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    if (!topProducts.length) {
        dashTopSellingList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-chart-line"></i>
                <p>لا توجد مبيعات بعد</p>
            </div>
        `;
        return;
    }

    dashTopSellingList.innerHTML = topProducts.map((product, index) => {
        const rankColor = index === 0 ? "#fbbf24"
            : index === 1 ? "#94a3b8"
            : index === 2 ? "#cd7f32"
            : "#e5e7eb";
        const rankText = index === 0 ? "🥇"
            : index === 1 ? "🥈"
            : index === 2 ? "🥉"
            : `#${index + 1}`;

        return `
            <div class="top-item">
                <div class="top-item-info">
                    <div style="min-width:32px;height:32px;border-radius:50%;background:${rankColor};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;">
                        ${rankText}
                    </div>
                    ${product.image ? `
                        <img src="${escapeAdminHTML(product.image)}" class="top-item-img" alt=""
                            onerror="this.style.display='none'">
                    ` : `
                        <div class="top-item-img" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;">
                            <i class="fa-solid fa-image"></i>
                        </div>
                    `}
                    <div>
                        <div class="top-item-name">${escapeAdminHTML(product.name)}</div>
                        <div class="top-item-sales">${product.quantity} قطعة مباعة</div>
                    </div>
                </div>
                <div class="top-item-revenue">
                    ${product.revenue.toLocaleString("ar-EG")} ج.م
                </div>
            </div>
        `;
    }).join("");
}

// ========================================
// STATUS REASON MODAL
// ========================================

const REASON_OPTIONS = {
    return_requested: [
        "المقاس غير مناسب",
        "اللون مختلف عن الصورة",
        "المنتج به عيب",
        "المنتج مختلف عن الوصف",
        "العميل غير رأيه",
        "سبب آخر"
    ],
    exchange_requested: [
        "المقاس غير مناسب",
        "اللون مختلف",
        "العميل عايز موديل تاني",
        "المنتج به عيب",
        "سبب آخر"
    ],
    cancelled: [
        "العميل غيّر رأيه",
        "العميل مش بيرد",
        "العنوان غلط",
        "المنتج مش متوفر",
        "سبب آخر"
    ]
};

function openStatusReasonModal(order, newStatus) {
    const modal = document.getElementById("statusReasonModal");
    if (!modal) return;

    document.getElementById("statusReasonOrderId").value = order.id;
    document.getElementById("statusReasonNewStatus").value = newStatus;

    const title = document.getElementById("statusReasonTitle");
    const reasonTypeLabel = document.getElementById("reasonTypeLabel");

    const titles = {
        return_requested: "طلب استرجاع",
        exchange_requested: "طلب استبدال",
        cancelled: "إلغاء الطلب"
    };

    title.textContent = `${titles[newStatus]} - الطلب #${order.id}`;
    reasonTypeLabel.textContent = titles[newStatus];

    const select = document.getElementById("statusReasonSelect");
    const options = REASON_OPTIONS[newStatus] || [];

    select.innerHTML = '<option value="">اختر السبب</option>' +
        options.map(o =>
            `<option value="${escapeAdminHTML(o)}">${escapeAdminHTML(o)}</option>`
        ).join("");

    document.getElementById("statusReasonCustom").value = "";
    document.getElementById("statusReasonNotes").value = "";
    document.getElementById("reasonCustomGroup").style.display = "none";
    document.getElementById("statusReasonCustom").required = false;

    modal.classList.add("open");
    renderAdminOrders();
}

function closeStatusReasonModal() {
    document.getElementById("statusReasonModal")?.classList.remove("open");
}

document.getElementById("statusReasonSelect")?.addEventListener("change", function () {
    const customGroup = document.getElementById("reasonCustomGroup");
    const customInput = document.getElementById("statusReasonCustom");

    if (this.value === "سبب آخر") {
        customGroup.style.display = "block";
        customInput.required = true;
        customInput.focus();
    } else {
        customGroup.style.display = "none";
        customInput.required = false;
    }
});

document.getElementById("closeStatusReasonModal")?.addEventListener(
    "click",
    closeStatusReasonModal
);

document.getElementById("cancelStatusReasonBtn")?.addEventListener(
    "click",
    closeStatusReasonModal
);

document.getElementById("statusReasonForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const orderId = Number(
        document.getElementById("statusReasonOrderId").value
    );
    const newStatus = document.getElementById("statusReasonNewStatus").value;
    const selectedReason = document.getElementById("statusReasonSelect").value;
    const customReason = document.getElementById("statusReasonCustom").value.trim();
    const notes = document.getElementById("statusReasonNotes").value.trim();

    let finalReason = selectedReason;

    if (selectedReason === "سبب آخر") {
        if (!customReason) {
            alert("اكتب السبب");
            return;
        }
        finalReason = customReason;
    }

    if (!finalReason) {
        alert("اختر السبب");
        return;
    }

    const btn = document.getElementById("saveStatusReasonBtn");
    btn.disabled = true;
    btn.textContent = "جاري الحفظ...";

    await applyStatusChange(orderId, newStatus, finalReason, notes);

    btn.disabled = false;
    btn.textContent = "تأكيد التغيير";

    closeStatusReasonModal();
});

// ========================================
// 39. LOGOUT
// ========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        const confirmed = confirm("هل أنت متأكد من تسجيل الخروج؟");
        if (!confirmed) return;

        const client = getSupabaseClient();
        if (client) await client.auth.signOut();

        window.location.replace("admin-login.html");
    });
}

// ========================================
// 40. CLOSE MODALS ON OUTSIDE CLICK
// ========================================

window.addEventListener("click", function (event) {
    if (event.target === editModal) closeEditProductModal();
    if (event.target === orderModal) orderModal.classList.remove("open");
    if (event.target === approvalModal) closeApprovalRequestModal();
    if (event.target === document.getElementById("statusReasonModal")) {
        closeStatusReasonModal();
    }
});

// ========================================
// 41. START
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    if (isLoginPage()) await checkLoginPageSession();
    if (isAdminDashboard()) await protectAdminDashboard();
});

// ========================================
// 42. SESSION PROTECTION
// ========================================

window.addEventListener("pageshow", async function () {
    if (isAdminDashboard() && !(await getCurrentAdmin())) {
        window.location.replace("admin-login.html");
    }
});

// ========================================
// 43. GLOBAL FUNCTIONS
// ========================================

window.switchTab = switchTab;
window.filterOrders = filterOrders;
window.filterApprovalRequests = filterApprovalRequests;
window.loadAdminProducts = loadAdminProducts;
window.loadAdminOrders = loadAdminOrders;
window.loadApprovalRequests = loadApprovalRequests;
window.updateOrderStatus = updateOrderStatus;
window.sendWhatsAppStatusUpdate = sendWhatsAppStatusUpdate;
window.viewOrderDetails = viewOrderDetails;
window.prepareEditProduct = prepareEditProduct;
window.prepareDeleteProduct = prepareDeleteProduct;
window.approveChangeRequest = approveChangeRequest;
window.rejectChangeRequest = rejectChangeRequest;
window.viewApprovalRequest = viewApprovalRequest;
window.closeEditProductModal = closeEditProductModal;
window.closeApprovalRequestModal = closeApprovalRequestModal;
window.openStatusReasonModal = openStatusReasonModal;
window.closeStatusReasonModal = closeStatusReasonModal;