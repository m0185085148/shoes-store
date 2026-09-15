// ========================================
// STEP Store - Admin System
// admin.js
// ========================================

// ========================================
// 1. SUPABASE
// ========================================

function getSupabaseClient() {
    if (window.supabaseClient) return window.supabaseClient;
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
const menuUsername = document.getElementById("menuUsername");
const menuEmail = document.getElementById("menuEmail");
const adminProductsList = document.getElementById("adminProductsList");
const adminOrdersList = document.getElementById("adminOrdersList");
const approvalRequests = document.getElementById("approvalRequests");
const statTotal = document.getElementById("statTotal");
const dashStatRevenue = document.getElementById("dashStatRevenue");
const dashStatNewOrders = document.getElementById("dashStatNewOrders");
const dashStatPending = document.getElementById("dashStatPending");
const dashStatProducts = document.getElementById("dashStatProducts");
const dashStatTodaySales = document.getElementById("dashStatTodaySales");
const dashStatCustomers = document.getElementById("dashStatCustomers");
const dashStatLowStock = document.getElementById("dashStatLowStock");
const dashPendingCard = document.getElementById("dashPendingCard");
const dashStatMonthSales = document.getElementById("dashStatMonthSales");
const dashStatAOV = document.getElementById("dashStatAOV");
const dashStatFollowUp = document.getElementById("dashStatFollowUp");
const sidebarNewOrdersBadge = document.getElementById("sidebarNewOrdersBadge");
const sidebarPendingBadge = document.getElementById("sidebarPendingBadge");
const sidebarLowStockBadge = document.getElementById("sidebarLowStockBadge");
const dashRecentOrdersList = document.getElementById("dashRecentOrdersList");
const dashTopSellingList = document.getElementById("dashTopSellingList");

// ========================================
// 5. ADD PRODUCT ELEMENTS
// ========================================

const addProductForm = document.getElementById("addProductForm");
const addProductModal = document.getElementById("addProductModal");
const openAddProductBtn = document.getElementById("openAddProductBtn");
const closeAddProductModal = document.getElementById("closeAddProductModal");
const cancelAddBtn = document.getElementById("cancelAddBtn");
const addName = document.getElementById("name");
const addPrice = document.getElementById("price");
const addOldPrice = document.getElementById("oldPrice");
const addBadge = document.getElementById("badge");
const addDescription = document.getElementById("description");
const addImageUrl = document.getElementById("imageUrl");
const addSubmitButton = document.getElementById("submitBtn");

// ========================================
// 6. EDIT PRODUCT ELEMENTS
// ========================================

const editModal = document.getElementById("editModal");
const closeEditModal = document.getElementById("closeEditModal");
const editProductForm = document.getElementById("editProductForm");
const editProductId = document.getElementById("editProductId");
const editName = document.getElementById("editName");
const editPrice = document.getElementById("editPrice");
const editOldPrice = document.getElementById("editOldPrice");
const editBadge = document.getElementById("editBadge");
const editDescription = document.getElementById("editDescription");
const editImageUrl = document.getElementById("editImageUrl");
const saveEditButton = document.getElementById("saveEditButton");
const cancelEditButton = document.getElementById("cancelEditButton");

// ========================================
// 7. ORDER MODAL ELEMENTS
// ========================================

const orderModal = document.getElementById("orderModal");
const closeOrderModalBtn = document.getElementById("closeOrderModal");
const orderModalDetails = document.getElementById("orderModalDetails");

// ========================================
// 8. APPROVAL MODAL ELEMENTS
// ========================================

const approvalModal = document.getElementById("approvalModal");
const closeApprovalModal = document.getElementById("closeApprovalModal");
const approvalModalBody = document.getElementById("approvalModalBody");
const approvalModalActions = document.getElementById("approvalModalActions");

// ========================================
// 9. ADJUST STOCK MODAL ELEMENTS
// ========================================

const adjustStockModal = document.getElementById("adjustStockModal");
const closeAdjustStockModal = document.getElementById("closeAdjustStockModal");
const adjustStockForm = document.getElementById("adjustStockForm");
const adjustProductId = document.getElementById("adjustProductId");
const adjustMovementType = document.getElementById("adjustMovementType");
const adjustQuantity = document.getElementById("adjustQuantity");
const adjustReason = document.getElementById("adjustReason");
const adjustNotes = document.getElementById("adjustNotes");
const cancelAdjustBtn = document.getElementById("cancelAdjustBtn");

// ========================================
// 10. GLOBAL VARIABLES
// ========================================

let currentAdmin = null;
let adminProducts = [];
let currentSessionToken = null;
let heartbeatInterval = null;
let adminProductSizes = {};
let adminOrders = [];
let adminApprovalRequests = [];

let currentApprovalFilter = "pending";
let currentInventoryFilter = "all";
let inventorySearchTerm = "";
let inventoryMovements = [];

let productsSearchFilters = { id: "", sku: "", name: "", price: "" };
let ordersSearchFilters = { id: "", name: "", phone: "", amount: "" };
let inventoryColumnFilters = { sku: "", name: "", available: "", reserved: "" };

let customOrderStatuses = null;
let currentExchangeOrder = null;
let currentExchangeReceivedOrder = null;
let currentAdjustProduct = null;
let currentAdjustType = "purchase";

// ✅ الحالات اللي بتُحسب كمبيعات
const SOLD_STATUSES = [
    "delivered",
    "return_requested",
    "return_received",
    "exchange_requested",
    "exchange_received",
    "exchange_shipped",
    "exchanged"
];

// ========================================
// 11. HELPERS
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
    loginMessage.classList.add(type === "success" ? "success" : "error");
}

function showPageTransition() {
    if (loginCard) loginCard.classList.add("login-success");
    if (pageTransition) pageTransition.classList.add("show");
}

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatRelative(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `منذ ${diffMin} د`;
    if (diffHr < 24) return `منذ ${diffHr} س`;
    if (diffDay < 7) return `منذ ${diffDay} يوم`;
    return formatDate(dateValue);
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
    return Number(value || 0).toLocaleString("en-US");
}

function normalizeBadge(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (text === "new" || text === "New" || text === "جديد") return "جديد";
    if (text === "sale" || text === "Sale" || text === "خصم") return "خصم";
    return text;
}

// ✅ رابط الموقع اللايف (Vercel)
// لو هتغيّر الدومين بعدين، عدّل السطر ده بس
const SITE_BASE_URL = 'https://shoes-store-egypt.vercel.app';

function getTrackingUrl(orderId, customerPhone) {
    if (!SITE_BASE_URL) return null;
    return `${SITE_BASE_URL}/track.html?id=${orderId}&phone=${encodeURIComponent(customerPhone)}`;
}

function getProductById(id) {
    return adminProducts.find(p => Number(p.id) === Number(id));
}

function parseImagesArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }
    return [];
}

function showToast(message) {
    document.querySelector('.toast-notification')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 30);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ========================================
// 12. SIZE-BASED STOCK HELPERS
// ========================================

function getProductSizes(productId) {
    return adminProductSizes[Number(productId)] || [];
}

function getSizeData(productId, size) {
    const sizes = getProductSizes(productId);
    return sizes.find(s => String(s.size) === String(size)) || null;
}

function getAvailableStock(product) {
    const sizes = getProductSizes(product.id);
    return sizes.reduce((sum, s) => {
        return sum + Math.max(0, Number(s.stock || 0) - Number(s.reserved || 0));
    }, 0);
}

function getProductReservedTotal(product) {
    const sizes = getProductSizes(product.id);
    return sizes.reduce((sum, s) => sum + Number(s.reserved || 0), 0);
}

function getProductTotalStock(product) {
    const sizes = getProductSizes(product.id);
    return sizes.reduce((sum, s) => sum + Number(s.stock || 0), 0);
}

function getStockStatus(product) {
    const sizes = getProductSizes(product.id);

    if (sizes.length) {
        const totalAvailable = sizes.reduce((sum, s) => {
            return sum + Math.max(0, Number(s.stock || 0) - Number(s.reserved || 0));
        }, 0);

        if (totalAvailable === 0) return "out";

        const hasOutSize = sizes.some(s => {
            const avail = Math.max(0, Number(s.stock) - Number(s.reserved));
            return avail === 0;
        });

        const hasLowSize = sizes.some(s => {
            const avail = Math.max(0, Number(s.stock) - Number(s.reserved));
            return avail > 0 && avail <= 5;
        });

        if (hasOutSize || hasLowSize) return "low";
        return "good";
    }

    const available = getAvailableStock(product);
    const threshold = Number(product.low_stock_threshold || 5);
    if (available === 0) return "out";
    if (available <= threshold) return "low";
    return "good";
}

// ========================================
// 13. SIZE TOGGLES HELPERS
// ========================================

function getSelectedSizes(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return [];
    const checked = grid.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checked)
        .map(input => input.value)
        .sort((a, b) => Number(a) - Number(b));
}

function getSizesWithQuantities(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return [];
    const result = [];
    grid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const row = cb.closest(".size-qty-row");
        if (!row) return;
        const qtyInput = row.querySelector(".size-qty-input");
        const qty = parseInt(qtyInput?.value || "0", 10) || 0;
        result.push({ size: cb.value, quantity: qty });
    });
    return result.sort((a, b) => Number(a.size) - Number(b.size));
}

function setSizeQuantities(gridId, sizesData) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const row = cb.closest(".size-qty-row");
        const qtyInput = row?.querySelector(".size-qty-input");
        if (qtyInput) {
            qtyInput.value = "0";
            qtyInput.disabled = true;
        }
    });

    (sizesData || []).forEach(item => {
        const cb = grid.querySelector(`input[type="checkbox"][value="${item.size}"]`);
        if (!cb) return;
        cb.checked = true;
        const row = cb.closest(".size-qty-row");
        const qtyInput = row?.querySelector(".size-qty-input");
        if (qtyInput) {
            qtyInput.disabled = false;
            qtyInput.value = item.stock ?? item.quantity ?? 0;
        }
    });

    const mode = gridId === "editSizesGrid" ? "edit" : "add";
    updateTotalPreview(mode);
}

function resetSizesGrid(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const row = cb.closest(".size-qty-row");
        const qtyInput = row?.querySelector(".size-qty-input");
        if (qtyInput) {
            qtyInput.value = "0";
            qtyInput.disabled = true;
        }
    });
    const mode = gridId === "editSizesGrid" ? "edit" : "add";
    updateTotalPreview(mode);
}

function toggleSizeQuantity(checkbox, mode = "add") {
    const row = checkbox.closest(".size-qty-row");
    if (!row) return;
    const qtyInput = row.querySelector(".size-qty-input");
    if (!qtyInput) return;

    if (checkbox.checked) {
        qtyInput.disabled = false;
        if (parseInt(qtyInput.value || "0", 10) === 0) {
            qtyInput.value = "";
        }
        qtyInput.focus();
    } else {
        qtyInput.disabled = true;
        qtyInput.value = "0";
    }

    updateTotalPreview(mode);
}

function updateTotalPreview(mode = "add") {
    const gridId = mode === "edit" ? "editSizesGrid" : "sizesGrid";
    const previewId = mode === "edit" ? "editTotalStockPreview" : "totalStockPreview";
    const grid = document.getElementById(gridId);
    const preview = document.getElementById(previewId);

    if (!grid || !preview) return;

    let total = 0;
    grid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const row = cb.closest(".size-qty-row");
        const qty = parseInt(row?.querySelector(".size-qty-input")?.value || "0", 10) || 0;
        total += qty;
    });

    preview.textContent = total;
}

// ========================================
// 14. TIME HELPERS
// ========================================

function getOrderTimeRemaining(order) {
    if (order.status !== "pending" && order.status !== "payment_pending") {
        return null;
    }

    const created = new Date(order.created_at);
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
        return { expired: true, text: "منتهي", color: "#991b1b" };
    }

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    // ✅ نص مختلف حسب الحالة
    const isPaymentPending = order.status === "payment_pending";
    const prefix = isPaymentPending ? "مهلة التحويل:" : "باقي";

    if (hours > 6) {
        return { expired: false, text: `${prefix} ${hours}س`, color: "#16a34a" };
    } else if (hours > 2) {
        return { expired: false, text: `${prefix} ${hours}س ${minutes}د`, color: "#d97706" };
    } else {
        return { expired: false, text: `⚠️ ${prefix} ${hours}س ${minutes}د`, color: "#dc2626" };
    }
}

// ========================================
// 15. LOGIN PASSWORD TOGGLE
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
// 16. CURRENT ADMIN
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

// ========================================
// SESSION MANAGEMENT
// ========================================

function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = "جهاز غير معروف";

    if (ua.includes("Windows")) device = "Windows";
    else if (ua.includes("Mac")) device = "Mac";
    else if (ua.includes("Linux")) device = "Linux";
    else if (ua.includes("Android")) device = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) device = "iOS";

    let browser = "متصفح";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    return `${browser} على ${device}`;
}

function generateSessionToken() {
    const rand = Math.random().toString(36).substring(2, 15)
        + Math.random().toString(36).substring(2, 15);
    return `${Date.now()}_${rand}`;
}

async function checkActiveSession(adminId) {
    const client = getSupabaseClient();
    if (!client) return { has_active: false };

    try {
        const { data, error } = await client.rpc("check_admin_session", {
            p_admin_id: adminId
        });

        if (error) {
            console.warn("Check session error:", error);
            return { has_active: false };
        }

        return data || { has_active: false };
    } catch (err) {
        console.warn("Check session exception:", err);
        return { has_active: false };
    }
}

async function createAdminSession(adminId) {
    const client = getSupabaseClient();
    if (!client) return null;

    const token = generateSessionToken();
    const deviceInfo = getDeviceInfo();

    try {
        const { data, error } = await client.rpc("create_admin_session", {
            p_admin_id: adminId,
            p_session_token: token,
            p_device_info: deviceInfo
        });

        if (error) throw error;

        currentSessionToken = token;
        localStorage.setItem("adminSessionToken", token);

        return token;
    } catch (err) {
        console.error("Create session error:", err);
        return null;
    }
}

async function endAdminSession(reason = "logout") {
    const client = getSupabaseClient();
    const token = currentSessionToken || localStorage.getItem("adminSessionToken");

    if (!client || !token) return;

    try {
        await client.rpc("end_admin_session", {
            p_session_token: token,
            p_reason: reason
        });
    } catch (err) {
        console.warn("End session error:", err);
    }

    currentSessionToken = null;
    localStorage.removeItem("adminSessionToken");
}

async function verifyCurrentSession() {
    const client = getSupabaseClient();
    const token = localStorage.getItem("adminSessionToken");

    if (!client || !token || !currentAdmin) return true;

    try {
        const { data, error } = await client.rpc("verify_admin_session", {
            p_session_token: token
        });

        if (error) {
            console.warn("Verify session error:", error);
            return true; // ✅ نسمح بالمرور لو حصل خطأ مؤقت
        }

        return Boolean(data?.valid);
    } catch (err) {
        console.warn("Verify session exception:", err);
        return true;
    }
}

function startHeartbeat() {
    stopHeartbeat();

    heartbeatInterval = setInterval(async () => {
        const client = getSupabaseClient();
        const token = currentSessionToken || localStorage.getItem("adminSessionToken");
        if (!client || !token) return;

        try {
            await client.rpc("heartbeat_admin_session", {
                p_session_token: token
            });
        } catch (err) {
            console.warn("Heartbeat error:", err);
        }
    }, 60 * 1000); // كل دقيقة
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
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
// 17. LOGIN PAGE SESSION
// ========================================

async function checkLoginPageSession() {
    if (!isLoginPage()) return;

    // ✅ نتحقق من وجود التوكن الأول
    const token = localStorage.getItem("adminSessionToken");
    if (!token) return;

    const admin = await getCurrentAdmin();
    if (!admin) {
        // مستخدم مسجل بس مش أدمن — نمسح التوكن
        localStorage.removeItem("adminSessionToken");
        return;
    }

    // ✅ نتحقق إن الجلسة لسه صالحة قبل ما نعمل redirect
    const client = getSupabaseClient();
    if (!client) return;

    const { data } = await client.rpc("verify_admin_session", {
        p_session_token: token
    });

    if (data?.valid && data.admin_id === admin.id) {
        showPageTransition();
        setTimeout(() => {
            window.location.replace("admin.html");
        }, 500);
    } else {
        // جلسة منتهية — نمسحها ونخليه يسجل دخول
        localStorage.removeItem("adminSessionToken");
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
                showLoginMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة");
                return;
            }

            const { data: adminData, error: adminError } = await client
                .from("admin_users")
                .select("id, username, role, is_active")
                .eq("id", data.user.id)
                .maybeSingle();

            if (adminError || !adminData) {
                const { data: customerData } = await client
                    .from("customer_profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .maybeSingle();

                await client.auth.signOut();

                if (customerData) {
                    showLoginMessage("هذا حساب عميل. جاري تحويلك...");
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

            // ✅ فحص الجلسة النشطة
            const sessionCheck = await checkActiveSession(data.user.id);

            if (sessionCheck.has_active) {
                await client.auth.signOut();
                const loggedInTime = sessionCheck.last_active_at
                    ? new Date(sessionCheck.last_active_at).toLocaleString("ar-EG")
                    : "-";

                showLoginMessage(
                    `⚠️ هذا الحساب مفتوح حاليًا على جهاز آخر\n` +
                    `الجهاز: ${sessionCheck.device_info || "غير معروف"}\n` +
                    `آخر نشاط: ${loggedInTime}\n\n` +
                    `اطلب من المدير إنهاء الجلسة`,
                    "error"
                );
                return;
            }

            // ✅ إنشاء جلسة جديدة
            const token = await createAdminSession(data.user.id);
            if (!token) {
                showLoginMessage("فشل إنشاء الجلسة، حاول مرة أخرى");
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
// 18. TAB NAVIGATION
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

        // ✅ تحديث تلقائي
        loadAdminOrders();
        loadAdminProducts();
        loadApprovalRequests();
    } else if (tabId === "orders") {
        document.getElementById("viewOrders")?.classList.add("active");
        document.getElementById("tabNavOrders")?.classList.add("active");
        title.textContent = "طلبات العملاء والشحن";
        subtitle.textContent = "إدارة الطلبات ومتابعة حالات التوصيل";

        // ✅ تحديث تلقائي
        loadAdminOrders();
    } else if (tabId === "approvals") {
        document.getElementById("viewApprovals")?.classList.add("active");
        document.getElementById("tabNavApprovals")?.classList.add("active");
        title.textContent = "طلبات موافقة الموظفين";
        subtitle.textContent = "مراجعة واعتماد تعديلات الموظفين";

        // ✅ تحديث تلقائي
        loadApprovalRequests();
    } else if (tabId === "products") {
        document.getElementById("viewProducts")?.classList.add("active");
        document.getElementById("tabNavProducts")?.classList.add("active");
        title.textContent = "إدارة المنتجات";
        subtitle.textContent = "إضافة وتعديل وحذف منتجات المتجر";

        // ✅ تحديث تلقائي
        loadAdminProducts();
    } else if (tabId === "inventory") {
        document.getElementById("viewInventory")?.classList.add("active");
        document.getElementById("tabNavInventory")?.classList.add("active");
        title.textContent = "المخزون";
        subtitle.textContent = "متابعة حركات المخزون والكميات المتاحة";

        // ✅ تحديث تلقائي
        loadAdminProducts().then(() => {
            loadInventory();
            loadMovements();
        });
    } else if (tabId === "reports") {
        document.getElementById("viewReports")?.classList.add("active");
        document.getElementById("tabNavReports")?.classList.add("active");
        title.textContent = "التقارير والتحليلات";
        subtitle.textContent = "مركز التقارير الشامل";

        backToReportsHome();
    }

    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("mobileOverlay")?.classList.remove("show");
}

// ========================================
// 19. PROTECT ADMIN DASHBOARD
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

    // ✅ التحقق من وجود جلسة
    const sessionToken = localStorage.getItem("adminSessionToken");
    if (!sessionToken) {
        window.location.replace("admin-login.html");
        return;
    }

    currentAdmin = admin;
    window.currentAdmin = admin;

    // ✅ التحقق من صحة الجلسة عبر RPC
    const { data: sessionCheck } = await client.rpc("verify_admin_session", {
        p_session_token: sessionToken
    });

    if (!sessionCheck?.valid) {
        localStorage.removeItem("adminSessionToken");
        await client.auth.signOut();
        window.location.replace("admin-login.html");
        return;
    }

    // ✅ تأكد إن الجلسة لصاحب الحساب ده
    if (sessionCheck.admin_id !== admin.id) {
        localStorage.removeItem("adminSessionToken");
        await client.auth.signOut();
        window.location.replace("admin-login.html");
        return;
    }

    currentSessionToken = sessionToken;
    startHeartbeat();

    if (adminUsername) adminUsername.textContent = admin.username || admin.email || "Admin";
    if (adminRole) adminRole.textContent = getRoleName(admin.role);
    if (menuUsername) menuUsername.textContent = admin.username || "Admin";
    if (menuEmail) menuEmail.textContent = admin.email || "";

    await autoReleaseStaleOrders();

    await Promise.all([
        loadAdminProducts(),
        loadAdminOrders(),
        loadApprovalRequests()
    ]);

    updateDashboard();
    setupMobileMenu();
    setupUserDropdown();
    setupProductsSearch();
    setupAddProductModal();
    setupNotificationsDropdown();

    // ✅ تشغيل التحديث التلقائي
    startAutoRefresh();
}

// ========================================
// 20. MOBILE MENU
// ========================================

function setupMobileMenu() {
    const toggle = document.getElementById("mobileSidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("mobileOverlay");

    toggle?.addEventListener("click", () => {
        sidebar?.classList.toggle("open");
        overlay?.classList.toggle("show");
    });

    overlay?.addEventListener("click", () => {
        sidebar?.classList.remove("open");
        overlay?.classList.remove("show");
    });
}

// ========================================
// 21. USER DROPDOWN
// ========================================

function setupUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    const btn = document.getElementById("userInfoBtn");

    if (!dropdown || !btn) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });
}

// ========================================
// 22. NOTIFICATIONS DROPDOWN
// ========================================

function setupNotificationsDropdown() {
    const btn = document.getElementById("notificationsBtn");
    const dropdown = document.getElementById("notificationsDropdown");

    if (!btn || !dropdown) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });
}

function closeNotificationsDropdown() {
    document.getElementById("notificationsDropdown")?.classList.remove("open");
}

// ========================================
// 23. ADD PRODUCT MODAL SETUP
// ========================================

function setupAddProductModal() {
    openAddProductBtn?.addEventListener("click", () => {
        addProductForm.reset();
        resetSizesGrid("sizesGrid");
        clearImageUpload("add");
        addImagesList = [];
        renderMultiImageGrid("add");
        addProductModal?.classList.add("open");
    });

    closeAddProductModal?.addEventListener("click", () => {
        addProductModal?.classList.remove("open");
    });

    cancelAddBtn?.addEventListener("click", () => {
        addProductModal?.classList.remove("open");
    });

    document.querySelectorAll("#sizesGrid .size-qty-input").forEach(input => {
        input.addEventListener("input", () => updateTotalPreview("add"));
    });
    document.querySelectorAll("#editSizesGrid .size-qty-input").forEach(input => {
        input.addEventListener("input", () => updateTotalPreview("edit"));
    });
}

// ========================================
// 24. AUTO RELEASE STALE ORDERS
// ========================================

async function autoReleaseStaleOrders() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data, error } = await client.rpc("auto_release_stale_orders");
        if (error) {
            console.warn("Auto release failed:", error);
            return;
        }

        const count = data?.released_count || 0;
        if (count > 0) {
            showToast(`تم تحرير ${count} طلب منتهي الصلاحية ⏱️`);
            await loadAdminProducts();
            await loadAdminOrders();
        }
    } catch (err) {
        console.warn("Auto release error:", err);
    }
}

// ========================================
// 25. ORDERS — LOAD & RENDER
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

        // ✅ صفّر أي فلتر مخصص قبل ما نعرض "بانتظار الدفع" افتراضيًا
        customOrderStatuses = null;

        // ✅ تطبيق فلتر "بانتظار الدفع" افتراضيًا
        const oldOrders = adminOrders;
        adminOrders = adminOrders.filter(o => o.status === "payment_pending");
        renderAdminOrders();
        adminOrders = oldOrders;

        // ✅ ضبط الفلتر النشط بصريًا
        document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
        const paymentPendingBtn = document.querySelector('.filter-chip[onclick*="payment_pending"]');
        if (paymentPendingBtn) paymentPendingBtn.classList.add("active");

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
        payment_pending: { text: "بانتظار الدفع", bg: "#dbeafe", color: "#1e40af" },
        pending: { text: "جديدة", bg: "#fef3c7", color: "#92400e" },
        preparing: { text: "قيد التحضير", bg: "#e0f2fe", color: "#0369a1" },
        shipped: { text: "تم الشحن", bg: "#f3e8ff", color: "#6b21a8" },
        delivered: { text: "تم التوصيل", bg: "#dcfce7", color: "#15803d" },
        return_requested: { text: "طلب استرجاع", bg: "#fef3c7", color: "#92400e" },
        return_received: { text: "تم استلام المنتج", bg: "#fed7aa", color: "#9a3412" },
        refunded: { text: "تم رد المبلغ", bg: "#dbeafe", color: "#1e40af" },
        exchange_requested: { text: "طلب استبدال", bg: "#fef3c7", color: "#92400e" },
        exchange_received: { text: "تم استلام المنتج", bg: "#fed7aa", color: "#9a3412" },
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

function getAllowedStatuses(currentStatus) {
    const flows = {
        payment_pending: ["payment_pending", "pending", "cancelled"],
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
    payment_pending: "بانتظار الدفع",
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

    // ✅ أزرار خاصة لـ "بانتظار الدفع"
    if (current === "payment_pending") {
        return `
            <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                <button type="button" 
                    onclick="confirmInstaPayPayment(${Number(order.id)})"
                    style="background:#2563eb;color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:800;border:0;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;flex:1;justify-content:center;">
                    <i class="fa-solid fa-check-circle"></i>
                    تأكيد الدفع
                </button>
                <button type="button" 
                    onclick="updateOrderStatus(${Number(order.id)}, 'cancelled')"
                    style="background:#fef2f2;color:#dc2626;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:800;border:1.5px solid #fecaca;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;flex:1;justify-content:center;">
                    <i class="fa-solid fa-xmark"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    // ✅ "تم التوصيل" → زرارين صريحين
    if (current === "delivered") {
        return `
            <div style="display:flex;gap:6px;justify-content:center;">
                <button type="button" 
                    onclick="updateOrderStatus(${Number(order.id)}, 'return_requested')"
                    style="background:#fef3c7;color:#92400e;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;border:1.5px solid #fcd34d;cursor:pointer;font-family:inherit;"
                    title="طلب استرجاع">
                    <i class="fa-solid fa-rotate-left"></i>
                    استرجاع
                </button>
                <button type="button" 
                    onclick="openExchangeRequestModal(${Number(order.id)})"
                    style="background:#e0f2fe;color:#0369a1;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;border:1.5px solid #7dd3fc;cursor:pointer;font-family:inherit;"
                    title="طلب استبدال">
                    <i class="fa-solid fa-arrows-rotate"></i>
                    استبدال
                </button>
            </div>
        `;
    }

    const allowed = getAllowedStatuses(current);
    const nextOptions = allowed.filter(s => s !== current);

    if (!nextOptions.length) return getStatusBadge(current);

    // ✅ لو الطلب قيد التحضير وفيه مشكلة في المخزون → نظهر تحذير
    let stockWarning = "";
    if (current === "preparing" && nextOptions.includes("shipped")) {
        const { canShip } = canShipOrder(order);
        if (!canShip) {
            stockWarning = `
                <div style="margin-top:6px;padding:5px 10px;background:#fef2f2;color:#dc2626;border-radius:6px;font-size:11px;font-weight:800;text-align:center;border:1px solid #fecaca;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    مخزون غير كافي للشحن
                </div>
            `;
        }
    }

    const options = nextOptions.map(s => `
        <option value="${s}">
            ${STATUS_LABELS[s] || s}
        </option>
    `).join("");

    return `
        <select class="status-modern-select status-${current}"
            onchange="if(this.value) updateOrderStatus(${Number(order.id)}, this.value)">
            <option value="">تغيير إلى...</option>
            ${options}
        </select>
        ${stockWarning}
    `;
}

function renderAdminOrders() {
    if (!adminOrdersList) return;

    let filtered = adminOrders;
    const f = ordersSearchFilters;

    // ✅ فلتر مخصص من التنبيهات
    if (customOrderStatuses && customOrderStatuses.length > 0) {
        filtered = filtered.filter(o => customOrderStatuses.includes(o.status));
    }

    if (f.id) {
        filtered = filtered.filter(o => String(o.id).includes(f.id.trim()));
    }
    if (f.name) {
        filtered = filtered.filter(o =>
            String(o.customer_name || "").toLowerCase().includes(f.name.trim().toLowerCase())
        );
    }
    if (f.phone) {
        const term = f.phone.trim().toLowerCase();
        filtered = filtered.filter(o =>
            String(o.customer_phone || "").includes(term) ||
            String(o.governorate || o.city || "").toLowerCase().includes(term)
        );
    }
    if (f.amount) {
        filtered = filtered.filter(o =>
            String(o.total_amount || "").includes(f.amount.trim())
        );
    }

    if (!filtered.length) {
        adminOrdersList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:35px;color:#64748b;">
                    ${adminOrders.length === 0 ? "لا توجد طلبات مسجلة حالياً" : "لا توجد نتائج مطابقة للبحث"}
                </td>
            </tr>
        `;
        return;
    }

    adminOrdersList.innerHTML = filtered.map(order => {
        const totalAmount = Number(order.total_amount || 0).toLocaleString("en-US");
        const phone = escapeAdminHTML(order.customer_phone || "-");
        const governorate = escapeAdminHTML(
            order.governorate || order.customer_governorate || order.city || "-"
        );

        return `
            <tr>
                <td class="order-id-cell">
                    <span>#</span>${escapeAdminHTML(order.id)}
                </td>
                <td class="customer-cell">
                    <strong>${escapeAdminHTML(order.customer_name || "عميل")}</strong>
                </td>
                <td class="phone-cell">
                    <div class="phone">
                        <i class="fa-solid fa-phone"></i>
                        ${phone}
                    </div>
                    <div class="gov">
                        <i class="fa-solid fa-location-dot"></i>
                        ${governorate}
                    </div>
                </td>
                <td class="amount-cell">
                    ${totalAmount}
                    <span class="currency">ج.م</span>
                </td>
                <td>${getStatusBadge(order.status)}</td>
                <td class="date-cell">
                    ${formatDate(order.created_at)}
                    ${
                        (() => {
                            const rem = getOrderTimeRemaining(order);
                            if (!rem) return "";
                            const bg = rem.expired ? '#fee2e2' 
                                : rem.color === '#dc2626' ? '#fef2f2' 
                                : rem.color === '#d97706' ? '#fef3c7' 
                                : '#dcfce7';
                            return `
                                <div style="margin-top:6px;">
                                    <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;background:${bg};color:${rem.color};">
                                        <i class="fa-solid fa-clock"></i>
                                        ${rem.text}
                                    </span>
                                </div>
                            `;
                        })()
                    }
                </td>
                <td>${renderStatusControl(order)}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button type="button" class="action-icon-btn preview"
                            onclick="viewOrderDetails(${Number(order.id)})"
                            title="عرض التفاصيل">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button type="button" class="action-icon-btn wa"
                            onclick="sendWhatsAppStatusUpdate(${Number(order.id)})"
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
// 26. ORDER FILTER
// ========================================

function filterOrders(status, btnElement) {
    // ✅ مسح الفلتر المخصص لما المستخدم يضغط على فلتر عادي
    customOrderStatuses = null;

    if (btnElement) {
        document.querySelectorAll(".filter-chip").forEach(button => {
            button.classList.remove("active");
        });
        btnElement.classList.add("active");
    }

    if (!adminOrdersList) return;

    let filtered;

    if (status === "all") {
        filtered = adminOrders;
    } else if (status === "exchange") {
        filtered = adminOrders.filter(o =>
            ["exchange_requested", "exchange_received", "exchange_shipped", "exchanged"].includes(o.status)
        );
    } else if (status === "return") {
        filtered = adminOrders.filter(o =>
            ["return_requested", "return_received", "refunded"].includes(o.status)
        );
    } else {
        filtered = adminOrders.filter(order => order.status === status);
    }

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
// 27. UPDATE ORDER STATUS
// ========================================

async function updateOrderStatus(orderId, newStatus) {
    const order = adminOrders.find(
        item => Number(item.id) === Number(orderId)
    );
    if (!order) return;

    // ✅ لو استلام استبدال → افتح المودال
    if (newStatus === "exchange_received" && order.status === "exchange_requested") {
        openExchangeReceivedModal(orderId);
        return;
    }

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

    // ✅ حالة الشحن: نفتح modal مخصص بالتحقق من المخزون
    if (newStatus === "shipped") {
        openShipConfirmModal(order.id);
        return;
    }

    let confirmMessage =
        `هل تريد تغيير حالة الطلب #${order.id} إلى "${STATUS_LABELS[newStatus]}"؟`;

    if (newStatus === "refunded" || newStatus === "exchanged") {
        confirmMessage += "\n\n⚠️ تحذير: هذه حالة نهائية!";
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

    // ✅ تسجيل وقت التوصيل الفعلي
    // order.status لسه محتفظ بالحالة القديمة لحد هذه اللحظة
    if (newStatus === "delivered" && order.status !== "delivered") {
        updates.delivered_at = new Date().toISOString();
    }

    try {
        const { error } = await client
            .from("orders")
            .update(updates)
            .eq("id", orderId);

        if (error) throw error;

        const oldStatus = order.status;
        order.status = newStatus;
        order.status_history = newHistory;

        if (newStatus === "return_requested" && reason) {
            order.return_reason = reason;
        }
        if (newStatus === "exchange_requested" && reason) {
            order.exchange_reason = reason;
        }

                // ✅ لو التحويل من payment_pending لـ pending → نأكد الدفع
        if (oldStatus === "payment_pending" && newStatus === "pending") {
            try {
                await client.rpc("confirm_instapay_payment", {
                    p_order_id: orderId
                });
                showToast("تم تأكيد استلام الدفع ✅");
            } catch (e) {
                console.warn("Confirm payment failed:", e);
            }
        }


        // ✅ خصم المخزون عند الشحن
        if (newStatus === "shipped" && oldStatus !== "shipped") {
            try {
                await client.rpc("process_order_shipped", {
                    p_order_id: orderId
                });
                showToast("تم خصم الكميات من المخزون ✅");
            } catch (e) {
                console.warn("Stock deduction failed:", e);
                showToast("⚠️ فشل خصم المخزون");
            }
        }


        // تحرير الحجز عند الإلغاء
        if ((newStatus === "cancelled" || newStatus === "refunded") &&
            oldStatus !== newStatus) {
            try {
                await client.rpc("release_order_stock", {
                    p_order_id: orderId
                });
            } catch (e) {
                console.warn("Release stock failed:", e);
            }
        }

        renderAdminOrders();
        updateDashboard();
        await loadAdminProducts();
    } catch (error) {
        console.error("Update Order Status Error:", error);
        alert("فشل تحديث حالة الطلب:\n\n" + error.message);
        renderAdminOrders();
    }
}

// ========================================
// 28. WHATSAPP
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

    // ✅ حماية: تأكد إن الرقم في النطاق المعقول
    if (phone.length < 11 || phone.length > 15) {
        alert("رقم الهاتف غير صحيح");
        return;
    }

    const trackingUrl = getTrackingUrl(order.id, order.customer_phone);
    const customerName = order.customer_name || "عميل";
    const totalAmount = Number(order.total_amount || 0).toLocaleString("en-US");

    // ✅ لو مفيش رابط (تطوير محلي)، منضيفوش في الرسالة
    const trackingLine = trackingUrl ? `\n\nلتتبع طلبك:\n${trackingUrl}` : '';

    // ✅ هيدر موحّد — يظهر في الـ notification وفي أول الرسالة
    const header = `طلب #${order.id} - STEP Store`;

    const messages = {
        payment_pending: `${header}\n\nمرحباً ${customerName}\n\nتم استلام طلبك من متجر STEP.\n\n==========\nلإتمام الدفع عبر إنستاباي\n==========\n\nرقم إنستاباي:\n01120915594\n\nاسم الحساب:\nMohamed El Hanafy\n\nالمبلغ المطلوب:\n${totalAmount} جنيه\n\n==========\n\nبعد التحويل، ابعتلنا صورة الإيصال هنا على واتساب عشان نأكد طلبك في أسرع وقت.${trackingLine}`,
        pending: `${header}\n\nمرحباً ${customerName}\n\nتم استلام طلبك من متجر STEP بنجاح.${trackingLine}`,
        preparing: `${header}\n\nمرحباً ${customerName}\n\nجاري تجهيز طلبك من متجر STEP.${trackingLine}`,
        shipped: `${header}\n\nمرحباً ${customerName}\n\nبشرى سارة! تم شحن طلبك وهو في طريقه إليك.${trackingLine}`,
        delivered: `${header}\n\nمرحباً ${customerName}\n\nتم توصيل طلبك بنجاح.\n\nشكراً لتسوقك من STEP!${trackingLine}`,
        return_requested: `${header}\n\nمرحباً ${customerName}\n\nتم تسجيل طلب الاسترجاع.${trackingLine}`,
        refunded: `${header}\n\nمرحباً ${customerName}\n\nتم رد مبلغ الطلب بنجاح.${trackingLine}`,
        exchanged: `${header}\n\nمرحباً ${customerName}\n\nتم استبدال الطلب بنجاح.${trackingLine}`,
        cancelled: `${header}\n\nمرحباً ${customerName}\n\nتم إلغاء طلبك.\n\nلو محتاج مساعدة كلمنا في أي وقت.`
    };

    const text = messages[order.status] ||
        `${header}\n\nمرحباً ${customerName}، تحديث بخصوص طلبك.${trackingLine}`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    const waWindow = window.open(waUrl, "_blank");

    // ✅ لو الـ popup blocker منع الفتح، انسخ الرسالة للعميل
    if (!waWindow) {
        navigator.clipboard.writeText(text).then(() => {
            alert("⚠️ المتصفح منع فتح واتساب\n\nتم نسخ الرسالة — الصقها في واتساب يدويًا");
        }).catch(() => {
            prompt("انسخ الرسالة دي وأرسلها للعميل:", text);
        });
    }
}

// ========================================
// 29. COPY TRACKING LINK
// ========================================

function copyTrackingLink(orderId, customerPhone, buttonEl) {
    const url = getTrackingUrl(orderId, customerPhone);

    navigator.clipboard.writeText(url).then(() => {
        if (buttonEl) {
            const originalHTML = buttonEl.innerHTML;
            buttonEl.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ!';
            buttonEl.style.background = '#16a34a';
            setTimeout(() => {
                buttonEl.innerHTML = originalHTML;
                buttonEl.style.background = '#2563eb';
            }, 2000);
        }
    }).catch(err => {
        console.error('Copy failed:', err);
        prompt('انسخ الرابط ده:', url);
    });
}

// ========================================
// 30. VIEW ORDER DETAILS
// ========================================

function viewOrderDetails(orderId) {
    const order = adminOrders.find(
        item => Number(item.id) === Number(orderId)
    );

    if (!order || !orderModal || !orderModalDetails) return;

    const items = Array.isArray(order.items) ? order.items : [];
    const exchangeItems = order.exchange_details?.items || [];

    const itemsHTML = items.map((item, index) => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);

        const product = getProductById(item.id);
        const image = item.image || product?.image || "";

        const exchangeInfo = exchangeItems.find(e =>
            Number(e.product_id) === Number(item.id) &&
            String(e.old_size) === String(item.size)
        );

        const effectiveSize = exchangeInfo?.new_size || item.size;
        const isExchanged = Boolean(exchangeInfo?.new_size);

        const sizeData = product ? getSizeData(product.id, effectiveSize) : null;
        const sizeAvailable = sizeData ? Math.max(0, Number(sizeData.stock) - Number(sizeData.reserved)) : 0;
        const sizeReserved = sizeData ? Number(sizeData.reserved) : 0;
        const sizeStock = sizeData ? Number(sizeData.stock) : 0;

        // ✅ هل الكمية كافية؟
        const canFulfill = sizeAvailable >= quantity;
        const statusClass = canFulfill ? 'available' : 'low';
        const statusIcon = canFulfill ? 'fa-check-circle' : 'fa-exclamation-triangle';
        const statusText = canFulfill 
            ? 'الكمية كافية' 
            : `⚠️ غير كافي! المتاح ${sizeAvailable} بس`;

        let stockHTML = "";
        if (product && sizeData) {
            stockHTML = `
                <div class="stock-info">
                    <span class="${statusClass}">
                        <i class="fa-solid ${statusIcon}"></i>
                        ${statusText}
                    </span>
                    <span>
                        <i class="fa-solid fa-box"></i>
                        المطلوب: <strong>${quantity}</strong>
                    </span>
                    <span class="${sizeAvailable === 0 ? 'low' : ''}">
                        <i class="fa-solid fa-warehouse"></i>
                        المتاح: <strong>${sizeAvailable}</strong>
                    </span>
                    ${sizeReserved > 0 ? `
                        <span class="reserved">
                            <i class="fa-solid fa-lock"></i>
                            محجوز: <strong>${sizeReserved}</strong>
                        </span>
                    ` : ""}
                    <span>
                        <i class="fa-solid fa-cubes"></i>
                        إجمالي المخزون: <strong>${sizeStock}</strong>
                    </span>
                    ${product.sku ? `
                        <span>
                            <i class="fa-solid fa-barcode"></i>
                            ${escapeAdminHTML(product.sku)}
                        </span>
                    ` : ""}
                </div>
            `;
        } else if (product) {
            stockHTML = `
                <div class="stock-info">
                    <span class="low">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        المقاس ${escapeAdminHTML(effectiveSize)} غير موجود
                    </span>
                </div>
            `;
        }

        const sizeDisplayHTML = isExchanged
            ? `
                <div class="size-display exchanged">
                    <span class="size-old">${escapeAdminHTML(item.size)}</span>
                    <i class="fa-solid fa-arrow-left size-arrow"></i>
                    <span class="size-new">${escapeAdminHTML(exchangeInfo.new_size)}</span>
                    <span class="size-tag">مستبدل</span>
                </div>
            `
            : `
                <div class="size-display">
                    <span class="size-label">المقاس:</span>
                    <span class="size-value">${escapeAdminHTML(item.size || "-")}</span>
                </div>
            `;

        return `
            <div class="order-detail-item">
                <div class="order-detail-img"
                    style="background-image:url('${escapeAdminHTML(image)}');">
                </div>
                <div class="order-detail-info">
                    <h4>${escapeAdminHTML(item.name || "منتج")}</h4>
                    ${sizeDisplayHTML}
                    <div class="qty-info">
                        <i class="fa-solid fa-cubes"></i>
                        الكمية: <strong>${quantity}</strong>
                    </div>
                    ${stockHTML}
                </div>
                <div class="order-detail-price">
                    ${(price * quantity).toLocaleString("en-US")} ج
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

    const trackUrl = order.customer_phone
        ? getTrackingUrl(order.id, order.customer_phone)
        : null;

    const trackingHTML = trackUrl ? `
        <div style="margin-top:16px;padding:14px;background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;">
            <div style="font-size:13px;font-weight:800;color:#1e40af;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                <i class="fa-solid fa-truck-fast"></i>
                رابط تتبع الطلب للعميل:
            </div>
            <div style="font-size:11px;color:#475569;word-break:break-all;background:#fff;padding:10px;border-radius:6px;margin-bottom:10px;line-height:1.6;">
                ${escapeAdminHTML(trackUrl)}
            </div>
            <button type="button"
                onclick="copyTrackingLink(${order.id}, '${escapeAdminHTML(order.customer_phone)}', this)"
                style="background:#2563eb;color:#fff;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:700;border:0;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-copy"></i>
                نسخ الرابط
            </button>
        </div>
    ` : "";

    orderModalDetails.innerHTML = `
        <h3>تفاصيل الطلب #${escapeAdminHTML(order.id)}</h3>

        <p><strong>اسم العميل:</strong> ${escapeAdminHTML(order.customer_name || "-")}</p>
        <p><strong>رقم الهاتف:</strong> ${escapeAdminHTML(order.customer_phone || "-")}</p>
        <p><strong>العنوان:</strong> ${escapeAdminHTML(order.customer_address || "غير مدون")}</p>
        <p><strong>الحالة:</strong> ${getStatusBadge(order.status)}</p>
        <p><strong>تاريخ الطلب:</strong> ${formatDate(order.created_at)}</p>

        ${trackingHTML}
        ${returnReasonHTML}
        ${exchangeReasonHTML}

        <hr style="margin:15px 0;border:0;border-top:1px solid #ddd;">

        <h4>المنتجات:</h4>
        ${itemsHTML || "<p>لا توجد تفاصيل للمنتجات</p>"}

        <div style="margin-top:15px;padding-top:15px;border-top:2px solid #f0f0f0;">
            <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:5px 0;">
                <span>المنتجات:</span>
                <strong>${Number(order.subtotal || order.total_amount || 0).toLocaleString("en-US")} جنيه</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:5px 0;">
                <span>الشحن:</span>
                <strong style="color:${Number(order.shipping_cost) === 0 ? '#16a34a' : '#111'};">
                    ${Number(order.shipping_cost) === 0
                        ? 'مجاني'
                        : Number(order.shipping_cost || 0).toLocaleString("en-US") + ' جنيه'}
                </strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:16px;padding:10px 0 0;border-top:1px solid #eee;margin-top:8px;">
                <strong>الإجمالي:</strong>
                <strong style="color:#2563eb;">${Number(order.total_amount || 0).toLocaleString("en-US")} جنيه</strong>
            </div>
        </div>

        ${
            (order.status === "pending" || order.status === "preparing")
                ? `
                    <div style="margin-top:16px;padding:14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;">
                        <div style="font-size:13px;font-weight:800;color:#78350f;margin-bottom:10px;">
                            <i class="fa-solid fa-clock"></i>
                            إجراءات الحجز
                        </div>
                        <button type="button"
                            onclick="releaseOrderReservation(${order.id})"
                            style="background:#d97706;color:#fff;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:700;border:0;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;">
                            <i class="fa-solid fa-unlock"></i>
                            تحرير الحجز
                        </button>
                    </div>
                `
                : ""
        }

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
// 31. RELEASE ORDER RESERVATION
// ========================================

async function releaseOrderReservation(orderId) {
    const confirmed = confirm(
        "هل تريد تحرير حجز هذا الطلب؟\n\n" +
        "⚠️ الكميات هترجع للمخزون المتاح"
    );
    if (!confirmed) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client.rpc("release_order_stock", {
            p_order_id: orderId
        });

        if (error) throw error;

        showToast("تم تحرير الحجز ✅");
        orderModal?.classList.remove("open");

        await loadAdminProducts();
        await loadAdminOrders();
    } catch (err) {
        console.error("Release error:", err);
        alert("فشل التحرير:\n\n" + err.message);
    }
}

// ========================================
// 32. PRODUCTS — LOAD & RENDER
// ========================================

async function loadAdminProducts() {
    const client = getSupabaseClient();
    if (!client || !adminProductsList) return;

    try {
        const [productsRes, sizesRes] = await Promise.all([
            client
                .from("products")
                .select(`
                    id, name, price, old_price, badge, sizes, image,
                    created_at, description, sku, barcode, purchase_price,
                    low_stock_threshold,
                    created_by, created_by_username,
                    updated_by, updated_by_username, updated_at,
                    created_user_id, created_username,
                    updated_user_id, updated_username
                `)
                .order("id", { ascending: false }),
            client
                .from("product_sizes")
                .select("*")
                .order("size", { ascending: true })
        ]);

        if (productsRes.error) throw productsRes.error;

        adminProducts = productsRes.data || [];
        window.adminProducts = adminProducts;

        adminProductSizes = {};
        (sizesRes.data || []).forEach(row => {
            const pid = Number(row.product_id);
            if (!adminProductSizes[pid]) adminProductSizes[pid] = [];
            adminProductSizes[pid].push(row);
        });

        if (statTotal) statTotal.textContent = adminProducts.length;
        if (dashStatProducts) dashStatProducts.textContent = adminProducts.length;

        renderAdminProducts();
        updateLowStockBadge();
    } catch (error) {
        console.error("Load Products Error:", error);
        adminProductsList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">
                    حدث خطأ أثناء تحميل المنتجات
                    <br>
                    <small>${escapeAdminHTML(error.message)}</small>
                </td>
            </tr>
        `;
    }
}

function updateLowStockBadge() {
    const lowCount = adminProducts.filter(p => {
        const status = getStockStatus(p);
        return status === "low" || status === "out";
    }).length;

    if (sidebarLowStockBadge) {
        if (lowCount > 0) {
            sidebarLowStockBadge.textContent = lowCount;
            sidebarLowStockBadge.style.display = "inline-block";
        } else {
            sidebarLowStockBadge.style.display = "none";
        }
    }
}

function renderAdminProducts() {
    if (!adminProductsList) return;

    let filtered = adminProducts;
    const f = productsSearchFilters;

    if (f.id) {
        filtered = filtered.filter(p => String(p.id).includes(f.id.trim()));
    }
    if (f.sku) {
        filtered = filtered.filter(p =>
            String(p.sku || "").toLowerCase().includes(f.sku.trim().toLowerCase())
        );
    }
    if (f.name) {
        filtered = filtered.filter(p =>
            String(p.name || "").toLowerCase().includes(f.name.trim().toLowerCase())
        );
    }
    if (f.price) {
        filtered = filtered.filter(p =>
            String(p.price || "").includes(f.price.trim())
        );
    }

    if (!filtered.length) {
        adminProductsList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:35px;color:#64748b;">
                    ${adminProducts.length === 0 ? "لا توجد منتجات" : "لا توجد نتائج مطابقة"}
                </td>
            </tr>
        `;
        return;
    }

    adminProductsList.innerHTML = filtered.map(product => {
        const image = product.image ? escapeAdminHTML(product.image) : "";
        const name = escapeAdminHTML(product.name);
        const price = Number(product.price || 0);
        const available = getAvailableStock(product);
        const reserved = getProductReservedTotal(product);
        const status = getStockStatus(product);
        const sizesCount = getProductSizes(product.id).length;

        return `
            <tr>
                <td class="product-id-cell">#${product.id}</td>
                <td>
                    ${product.sku ? `
                        <span class="sku-badge">${escapeAdminHTML(product.sku)}</span>
                    ` : "<span style='color:#cbd5e1;'>—</span>"}
                </td>
                <td class="product-img-cell">
                    ${image ? `
                        <img src="${image}" alt="${name}">
                    ` : `
                        <div style="width:55px;height:55px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">
                            <i class="fa-solid fa-image"></i>
                        </div>
                    `}
                </td>
                <td class="product-name-cell">
                    <strong>${name}</strong>
                    ${product.badge ? `
                        <span style="display:inline-block;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:800;background:${normalizeBadge(product.badge) === 'خصم' ? '#fee2e2' : '#dcfce7'};color:${normalizeBadge(product.badge) === 'خصم' ? '#991b1b' : '#166534'};">
                            ${escapeAdminHTML(normalizeBadge(product.badge))}
                        </span>
                    ` : ""}
                    ${sizesCount > 0 ? `
                        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                            <i class="fa-solid fa-shoe-prints"></i>
                            ${sizesCount} مقاس
                        </div>
                    ` : ""}
                </td>
                <td class="price-cell">${price.toLocaleString("en-US")} ج</td>
                <td class="stock-cell">
                    <span class="stock-pill ${status}">
                        <i class="fa-solid fa-cubes"></i>
                        ${available}
                    </span>
                </td>
                <td>
                    ${reserved > 0
                        ? `<span class="stock-pill reserved">${reserved}</span>`
                        : `<span style="color:#cbd5e1;">0</span>`}
                </td>
                <td>
                    <div class="action-btns-group">
                        <button type="button" class="action-icon-btn edit"
                            onclick="prepareEditProduct(${Number(product.id)})"
                            title="تعديل">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="action-icon-btn stock"
                            onclick="openAdjustStockModal(${Number(product.id)})"
                            title="تعديل المخزون">
                            <i class="fa-solid fa-cubes"></i>
                        </button>
                        <button type="button" class="action-icon-btn delete"
                            onclick="prepareDeleteProduct(${Number(product.id)})"
                            title="حذف">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================
// 33. PRODUCTS SEARCH
// ========================================

function setupProductsSearch() {
    const productFields = ["Id", "Sku", "Name", "Price"];
    productFields.forEach(field => {
        const input = document.getElementById("search" + field);
        if (!input) return;

        input.addEventListener("input", () => {
            const key = field.toLowerCase();
            productsSearchFilters[key] = input.value;
            renderAdminProducts();
        });
    });

    const orderFields = ["Id", "Name", "Phone", "Amount"];
    orderFields.forEach(field => {
        const input = document.getElementById("orderSearch" + field);
        if (!input) return;

        input.addEventListener("input", () => {
            const key = field.toLowerCase();
            ordersSearchFilters[key] = input.value;
            renderAdminOrders();
        });
    });

    document.getElementById("invSearchInput")?.addEventListener("input", (e) => {
        inventorySearchTerm = e.target.value;
        renderInventoryList();
    });

    const invColumnFields = ["Sku", "Name", "Available", "Reserved"];
    invColumnFields.forEach(field => {
        const input = document.getElementById("invSearch" + field);
        if (!input) return;

        input.addEventListener("input", () => {
            const key = field.toLowerCase();
            inventoryColumnFilters[key] = input.value;
            renderInventoryList();
        });
    });
}

// ========================================
// 34. PRODUCT SNAPSHOT & CHANGE LOG
// ========================================

function getProductSnapshot(product) {
    const sizes = getProductSizes(product.id).map(s => ({
        size: s.size,
        stock: s.stock
    }));

    return {
        id: product.id,
        name: product.name || "",
        price: Number(product.price || 0),
        old_price: product.old_price == null ? null : Number(product.old_price),
        badge: product.badge || null,
        sizes: parseSizes(product.sizes),
        sizes_with_quantities: sizes,
        image: product.image || null,
        images: parseImagesArray(product.images),
        description: product.description || ""
    };
}

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

// ========================================
// 35. EDIT PRODUCT FORM HELPERS
// ========================================

function getEditProductData() {
    const sizesWithQty = getSizesWithQuantities("editSizesGrid");
    return {
        name: editName?.value.trim() || "",
        price: Number(editPrice?.value || 0),
        old_price: editOldPrice?.value === "" ? null : Number(editOldPrice.value),
        badge: editBadge?.value.trim() || null,
        sizes: sizesWithQty.map(s => s.size),
        sizes_with_quantities: sizesWithQty,
        image: editImageUrl?.value.trim() || null,
        images: [...editImagesList],
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
    if (!data.sizes || data.sizes.length === 0) {
        alert("اختر مقاس واحد على الأقل");
        return false;
    }
    return true;
}

// ========================================
// 36. EDIT PRODUCT
// ========================================

function prepareEditProduct(productId) {
    const product = getProductById(productId);
    if (!product || !editModal) return;

    editProductId.value = product.id;
    editName.value = product.name || "";
    editPrice.value = product.price ?? "";
    editOldPrice.value = product.old_price ?? "";
    editBadge.value = normalizeBadge(product.badge);
    editDescription.value = product.description || "";
    editImageUrl.value = product.image || "";

    // ✅ عرض صورة المنتج في الـ preview
    if (product.image) {
        showImagePreview(product.image, {
            emptyId: "editImageEmpty",
            previewId: "editImagePreview",
            previewImgId: "editImagePreviewImg"
        });
    } else {
        hideImagePreview({
            emptyId: "editImageEmpty",
            previewId: "editImagePreview"
        });
    }

    const sizesData = getProductSizes(product.id).map(s => ({
        size: s.size,
        stock: s.stock
    }));

    setSizeQuantities("editSizesGrid", sizesData);

    // ✅ تحميل الصور الإضافية
    editImagesList = parseImagesArray(product.images);
    renderMultiImageGrid("edit");

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
// 37. CHANGE REQUEST
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
// 38. APPLY SIZE CHANGES
// ========================================

async function applySizeChanges(client, productId, newSizesWithQty, oldSizes) {
    const oldSizeMap = {};
    (oldSizes || []).forEach(s => {
        oldSizeMap[String(s.size)] = s;
    });

    const newSizeMap = {};
    newSizesWithQty.forEach(s => {
        newSizeMap[String(s.size)] = s;
    });

    const toDelete = Object.keys(oldSizeMap).filter(sz => !newSizeMap[sz]);
    if (toDelete.length) {
        await client
            .from("product_sizes")
            .delete()
            .eq("product_id", productId)
            .in("size", toDelete);
    }

    for (const item of newSizesWithQty) {
        const sizeKey = String(item.size);
        const existing = oldSizeMap[sizeKey];

        if (existing) {
            if (Number(existing.stock) !== Number(item.quantity)) {
                await client
                    .from("product_sizes")
                    .update({
                        stock: item.quantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq("product_id", productId)
                    .eq("size", item.size);

                await client.from("inventory_movements").insert({
                    product_id: productId,
                    movement_type: "adjustment",
                    quantity: item.quantity - Number(existing.stock),
                    previous_stock: Number(existing.stock),
                    new_stock: item.quantity,
                    reason: `تعديل مخزون مقاس ${item.size}`,
                    performed_by: currentAdmin.id,
                    performed_by_username: currentAdmin.username || currentAdmin.email
                });
            }
        } else {
            await client.from("product_sizes").insert({
                product_id: productId,
                size: item.size,
                stock: item.quantity,
                reserved: 0
            });

            if (item.quantity > 0) {
                await client.from("inventory_movements").insert({
                    product_id: productId,
                    movement_type: "initial",
                    quantity: item.quantity,
                    previous_stock: 0,
                    new_stock: item.quantity,
                    reason: `إضافة مقاس ${item.size}`,
                    performed_by: currentAdmin.id,
                    performed_by_username: currentAdmin.username || currentAdmin.email
                });
            }
        }
    }
}

// ========================================
// 39. EDIT PRODUCT SUBMIT
// ========================================

if (editProductForm) {
    editProductForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!currentAdmin) return;

        const productId = Number(editProductId.value);
        const product = getProductById(productId);
        if (!product) return;

        const newData = getEditProductData();
        if (!validateProductData(newData)) return;

        saveEditButton.disabled = true;
        saveEditButton.textContent = isManager() ? "جاري الحفظ..." : "جاري الإرسال...";

        try {
            const client = getSupabaseClient();

            if (isManager()) {
                const { error } = await client
                    .from("products")
                    .update({
                        name: newData.name,
                        price: newData.price,
                        old_price: newData.old_price,
                        badge: newData.badge,
                        sizes: newData.sizes,
                        image: newData.image,
                        images: newData.images || [],
                        description: newData.description,
                        updated_by: currentAdmin.id,
                        updated_by_username: currentAdmin.username || currentAdmin.email,
                        updated_at: new Date().toISOString(),
                        updated_user_id: currentAdmin.id,
                        updated_username: currentAdmin.username || currentAdmin.email
                    })
                    .eq("id", product.id);

                if (error) throw error;

                const oldSizes = getProductSizes(product.id);
                await applySizeChanges(
                    client,
                    product.id,
                    newData.sizes_with_quantities,
                    oldSizes
                );

                await createProductChangeLog({
                    productId: product.id,
                    action: "update",
                    oldData: getProductSnapshot(product),
                    newData: newData,
                    performedBy: currentAdmin.id,
                    performedByUsername: currentAdmin.username || currentAdmin.email || "Manager"
                });

                showToast("تم تعديل المنتج بنجاح ✅");
            } else {
                await createChangeRequest(product, "update", newData);
                showToast("تم إرسال الطلب للموافقة ⏳");
            }

            closeEditProductModal();
            await loadAdminProducts();
            await loadApprovalRequests();
        } catch (error) {
            console.error("Edit Product Error:", error);
            alert("حدث خطأ:\n\n" + error.message);
        } finally {
            saveEditButton.disabled = false;
            saveEditButton.textContent = "حفظ التغييرات";
        }
    });
}

// ========================================
// 40. DELETE PRODUCT
// ========================================

async function prepareDeleteProduct(productId) {
    const product = getProductById(productId);
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

            showToast("تم حذف المنتج بنجاح ✅");
        } else {
            await createChangeRequest(product, "delete", null);
            showToast("تم إرسال طلب الحذف للموافقة ⏳");
        }

        await loadAdminProducts();
        await loadApprovalRequests();
    } catch (error) {
        console.error("Delete Product Error:", error);
        alert("حدث خطأ:\n\n" + error.message);
    }
}

// ========================================
// 41. ADD PRODUCT SUBMIT
// ========================================

if (addProductForm) {
    addProductForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const client = getSupabaseClient();
        if (!client || !currentAdmin) return;

        const name = addName?.value.trim() || "";
        const price = Number(addPrice?.value || 0);
        const sizesWithQty = getSizesWithQuantities("sizesGrid");
        const sizes = sizesWithQty.map(s => s.size);
        const totalStock = sizesWithQty.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

        if (!name || !Number.isFinite(price) || price <= 0) {
            alert("يرجى التأكد من إدخال البيانات الصحيحة");
            return;
        }

        if (sizes.length === 0) {
            alert("اختر مقاس واحد على الأقل");
            return;
        }

        // ✅ الكميات اختيارية — يُسمح بـ 0

        addSubmitButton.disabled = true;
        addSubmitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإضافة...';

        try {
            // ✅ توليد كود الصنف تلقائيًا
            const { data: newSku, error: skuError } = await client.rpc("generate_product_sku");
            if (skuError) throw new Error("فشل توليد كود الصنف: " + skuError.message);

            // ✅ توليد الباركود تلقائيًا
            const { data: newBarcode, error: barcodeError } = await client.rpc("generate_product_barcode");
            if (barcodeError) throw new Error("فشل توليد الباركود: " + barcodeError.message);

            const productData = {
                name,
                sku: newSku,
                barcode: newBarcode,
                price,
                old_price: addOldPrice?.value === "" ? null : Number(addOldPrice.value),
                badge: addBadge?.value.trim() || null,
                sizes: sizes,
                image: addImageUrl?.value.trim() || null,
                images: [...addImagesList],
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

            const sizeRows = sizesWithQty.map(item => ({
                product_id: insertedProduct.id,
                size: item.size,
                stock: Number(item.quantity || 0),
                reserved: 0
            }));

            if (sizeRows.length) {
                const { error: sizesError } = await client
                    .from("product_sizes")
                    .insert(sizeRows);
                if (sizesError) {
                    console.warn("Size insert failed:", sizesError);
                }
            }

            for (const item of sizesWithQty) {
                if (Number(item.quantity) > 0) {
                    try {
                        await client.from("inventory_movements").insert({
                            product_id: insertedProduct.id,
                            movement_type: "initial",
                            quantity: Number(item.quantity),
                            previous_stock: 0,
                            new_stock: Number(item.quantity),
                            reason: `رصيد افتتاحي - مقاس ${item.size}`,
                            performed_by: currentAdmin.id,
                            performed_by_username: currentAdmin.username || currentAdmin.email
                        });
                    } catch (e) {
                        console.warn("Movement insert failed:", e);
                    }
                }
            }

            await createProductChangeLog({
                productId: insertedProduct.id,
                action: "create",
                oldData: null,
                newData: getProductSnapshot(insertedProduct),
                performedBy: currentAdmin.id,
                performedByUsername: currentAdmin.username || currentAdmin.email || "Admin"
            });

            showToast("تم إضافة المنتج بنجاح ✅");
            addProductModal?.classList.remove("open");
            addProductForm.reset();
            resetSizesGrid("sizesGrid");
            addImagesList = [];
            renderMultiImageGrid("add");
            await loadAdminProducts();
        } catch (error) {
            console.error(error);
            alert("حدث خطأ:\n\n" + error.message);
        } finally {
            addSubmitButton.disabled = false;
            addSubmitButton.innerHTML = '<i class="fa-solid fa-check"></i> إضافة المنتج';
        }
    });
}

// ========================================
// 42. INVENTORY
// ========================================

async function loadInventory() {
    const client = getSupabaseClient();
    if (!client) return;

    const listEl = document.getElementById("inventoryList");
    if (!listEl) return;

    listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">جاري التحميل...</td></tr>`;

    if (!adminProducts.length) {
        await loadAdminProducts();
    }

    const totalProducts = adminProducts.length;
    const totalStock = adminProducts.reduce((s, p) => s + getProductTotalStock(p), 0);
    const totalReserved = adminProducts.reduce((s, p) => s + getProductReservedTotal(p), 0);
    // ✅ عدد المنتجات اللي حالتها low فقط (مش out)
    const lowStockCount = adminProducts.filter(p => {
        return getStockStatus(p) === "low";
    }).length;

    // ✅ عدد المنتجات اللي حالتها out فقط
    const outStockCount = adminProducts.filter(p => {
        return getStockStatus(p) === "out";
    }).length;

    // ✅ التنبيه الذكي بيجمع الاتنين
    const lowStock = lowStockCount + outStockCount;

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set("invTotalProducts", totalProducts);
    set("invTotalStock", totalStock.toLocaleString("en-US"));
    set("invTotalReserved", totalReserved.toLocaleString("en-US"));
    set("invLowStock", lowStock);

    const countAll = document.getElementById("invCountAll");
    const countLow = document.getElementById("invCountLow");
    const countOut = document.getElementById("invCountOut");

    if (countAll) countAll.textContent = totalProducts;
    if (countLow) countLow.textContent = lowStockCount;
    if (countOut) countOut.textContent = outStockCount;

    renderInventoryList();
}

function renderInventoryList() {
    const listEl = document.getElementById("inventoryList");
    if (!listEl) return;

    let filtered = [...adminProducts];

    if (inventorySearchTerm) {
        const term = inventorySearchTerm.toLowerCase();
        filtered = filtered.filter(p =>
            String(p.name || "").toLowerCase().includes(term) ||
            String(p.sku || "").toLowerCase().includes(term)
        );
    }

    const cf = inventoryColumnFilters;
    if (cf.sku) {
        filtered = filtered.filter(p =>
            String(p.sku || "").toLowerCase().includes(cf.sku.trim().toLowerCase())
        );
    }
    if (cf.name) {
        filtered = filtered.filter(p =>
            String(p.name || "").toLowerCase().includes(cf.name.trim().toLowerCase())
        );
    }
    if (cf.available) {
        filtered = filtered.filter(p =>
            String(getAvailableStock(p)).includes(cf.available.trim())
        );
    }
    if (cf.reserved) {
        filtered = filtered.filter(p =>
            String(getProductReservedTotal(p)).includes(cf.reserved.trim())
        );
    }

    if (currentInventoryFilter === "low") {
        filtered = filtered.filter(p => getStockStatus(p) === "low");
    } else if (currentInventoryFilter === "out") {
        filtered = filtered.filter(p => getStockStatus(p) === "out");
    }

    if (!filtered.length) {
        listEl.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:30px;color:#64748b;">
                    لا توجد منتجات مطابقة
                </td>
            </tr>
        `;
        return;
    }

    filtered.sort((a, b) => getAvailableStock(a) - getAvailableStock(b));

    listEl.innerHTML = filtered.map(product => {
        const available = getAvailableStock(product);
        const reserved = getProductReservedTotal(product);
        const total = getProductTotalStock(product);
        const status = getStockStatus(product);

        const barClass = status === "good" ? "good"
            : status === "low" ? "medium" : "low";

        const max = Math.max(total, 20);
        const percent = total > 0 ? Math.min(100, (available / max) * 100) : 0;

        const sizes = getProductSizes(product.id).sort((a, b) => Number(a.size) - Number(b.size));
        const sizesHTML = sizes.length
            ? `<div class="sizes-wrapper">${sizes.map(s => {
                const avail = Math.max(0, Number(s.stock) - Number(s.reserved));
                const cls = avail === 0 ? "out" : (avail <= 3 ? "low" : "good");
                return `
                    <span class="size-chip ${cls}" title="مقاس ${escapeAdminHTML(s.size)}: ${avail} متاح من ${s.stock}">
                        <span class="size-chip-num">${escapeAdminHTML(s.size)}</span>
                        <span class="size-chip-sep"></span>
                        <span class="size-chip-qty">${avail}</span>
                    </span>
                `;
            }).join("")}</div>`
            : `<span style="color:#cbd5e1;font-size:11px;">لا توجد مقاسات</span>`;

        return `
            <tr>
                <td>
                    ${product.sku ? `
                        <span class="sku-badge">${escapeAdminHTML(product.sku)}</span>
                    ` : "-"}
                </td>
                <td>
                    ${product.image ? `
                        <img src="${escapeAdminHTML(product.image)}"
                            style="width:50px;height:50px;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb;">
                    ` : `
                        <div style="width:50px;height:50px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">
                            <i class="fa-solid fa-image"></i>
                        </div>
                    `}
                </td>
                <td>
                    <strong>${escapeAdminHTML(product.name)}</strong>
                    <div style="margin-top:6px;">${sizesHTML}</div>
                </td>
                <td>
                    <div style="font-weight:800;font-size:16px;color:${status === "out" ? "#dc2626" : status === "low" ? "#d97706" : "#16a34a"};">
                        ${available}
                    </div>
                    <div class="stock-bar">
                        <div class="stock-bar-fill ${barClass}" style="width:${percent}%"></div>
                    </div>
                </td>
                <td>
                    ${reserved > 0
                        ? `<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:6px;font-weight:700;">${reserved}</span>`
                        : `<span style="color:#cbd5e1;">0</span>`}
                </td>
                <td><strong>${total}</strong></td>
                <td>
                    <button type="button" onclick="openAdjustStockModal(${Number(product.id)})"
                        style="border:none;background:#2563eb;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;font-size:12px;">
                        <i class="fa-solid fa-plus-minus"></i>
                        تعديل
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function filterInventory(filter, btnEl) {
    currentInventoryFilter = filter;

    document.querySelectorAll(".inv-filter-chip").forEach(b => {
        b.classList.remove("active");
    });
    btnEl?.classList.add("active");

    renderInventoryList();
}

// ========================================
// 43. MOVEMENTS
// ========================================

async function loadMovements() {
    const client = getSupabaseClient();
    if (!client) return;

    const listEl = document.getElementById("movementsList");
    if (!listEl) return;

    listEl.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>جاري التحميل...</p>
        </div>
    `;

    try {
        const { data, error } = await client
            .from("inventory_movements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) throw error;

        inventoryMovements = data || [];
        renderMovements();
    } catch (error) {
        console.error("Load Movements Error:", error);
        listEl.innerHTML = `
            <div class="empty-state" style="color:#dc2626;">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>تعذر تحميل الحركات</p>
                <small>${escapeAdminHTML(error.message)}</small>
            </div>
        `;
    }
}

function renderMovements() {
    const listEl = document.getElementById("movementsList");
    if (!listEl) return;

    if (!inventoryMovements.length) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>لا توجد حركات بعد</p>
            </div>
        `;
        return;
    }

    const typeLabels = {
        purchase: "شراء",
        sale: "بيع",
        damage: "تلف",
        adjustment: "تسوية",
        initial: "رصيد افتتاحي",
        return: "مرتجع"
    };

    listEl.innerHTML = inventoryMovements.map(m => {
        const product = getProductById(m.product_id);
        const isPositive = m.quantity > 0;
        const iconClass = m.movement_type === "sale"
            ? "out"
            : m.movement_type === "damage"
                ? "out"
                : isPositive ? "in" : "adjust";

        const icon = m.movement_type === "sale" ? "fa-cart-shopping"
            : m.movement_type === "damage" ? "fa-triangle-exclamation"
            : m.movement_type === "purchase" ? "fa-truck-ramp-box"
            : m.movement_type === "initial" ? "fa-flag"
            : "fa-sliders";

        return `
            <div class="movement-item">
                <div class="movement-icon ${iconClass}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="movement-info">
                    <h4>${escapeAdminHTML(product?.name || "منتج محذوف")}</h4>
                    <p>
                        ${escapeAdminHTML(typeLabels[m.movement_type] || m.movement_type)}
                        ${m.reason ? ` · ${escapeAdminHTML(m.reason)}` : ""}
                        · ${escapeAdminHTML(m.performed_by_username || "system")}
                        · ${formatRelative(m.created_at)}
                    </p>
                </div>
                <div class="movement-change ${isPositive ? "positive" : "negative"}">
                    ${isPositive ? "+" : ""}${m.quantity}
                </div>
            </div>
        `;
    }).join("");
}

// ========================================
// 44. ADJUST STOCK MODAL
// ========================================

function openAdjustStockModal(productId) {
    const product = getProductById(productId);
    if (!product) return;

    currentAdjustProduct = product;
    currentAdjustType = "purchase";

    document.querySelectorAll(".movement-type-tab").forEach(t => {
        t.classList.remove("active");
    });
    document.querySelector('.movement-type-tab[data-type="purchase"]')?.classList.add("active");

    document.getElementById("adjustProductName").textContent = product.name;
    document.getElementById("adjustProductSku").textContent = product.sku || "-";

    document.getElementById("adjustProductId").value = product.id;
    document.getElementById("adjustMovementType").value = "purchase";

    const sizeSelect = document.getElementById("adjustSizeSelect");
    const productSizes = getProductSizes(product.id)
        .sort((a, b) => Number(a.size) - Number(b.size));

    if (sizeSelect) {
        sizeSelect.innerHTML = '<option value="">اختر المقاس</option>' +
            productSizes.map(s => {
                const avail = Math.max(0, Number(s.stock) - Number(s.reserved));
                return `<option value="${escapeAdminHTML(s.size)}">
                    مقاس ${escapeAdminHTML(s.size)} (متاح: ${avail})
                </option>`;
            }).join("");
    }

    document.getElementById("adjustQuantityLabel").textContent = "الكمية المضافة *";
    document.getElementById("adjustQuantity").value = "";
    document.getElementById("adjustQuantity").min = "1";
    document.getElementById("adjustReason").value = "";
    document.getElementById("adjustNotes").value = "";

    updateAdjustPreview();

    adjustStockModal.classList.add("open");
}

function closeAdjustStockModalFn() {
    adjustStockModal?.classList.remove("open");
    currentAdjustProduct = null;
}

function selectMovementType(type, btnEl) {
    currentAdjustType = type;

    document.querySelectorAll(".movement-type-tab").forEach(t => {
        t.classList.remove("active");
    });
    btnEl?.classList.add("active");

    document.getElementById("adjustMovementType").value = type;

    const label = document.getElementById("adjustQuantityLabel");
    const input = document.getElementById("adjustQuantity");

    if (type === "purchase") {
        label.textContent = "الكمية المضافة *";
        input.min = "1";
    } else if (type === "damage") {
        label.textContent = "الكمية التالفة *";
        input.min = "1";
    } else {
        label.textContent = "الكمية (موجب = إضافة، سالب = خصم) *";
        input.min = "";
    }

    updateAdjustPreview();
}

function updateAdjustPreview() {
    if (!currentAdjustProduct) return;

    const sizeSelect = document.getElementById("adjustSizeSelect");
    const selectedSize = sizeSelect?.value;

    let current = 0;
    if (selectedSize) {
        const sizeData = getSizeData(currentAdjustProduct.id, selectedSize);
        current = sizeData ? Number(sizeData.stock) : 0;
    }

    const qtyVal = parseInt(adjustQuantity.value || "0", 10);
    let change = 0;

    if (!isNaN(qtyVal)) {
        if (currentAdjustType === "purchase") change = Math.abs(qtyVal);
        else if (currentAdjustType === "damage") change = -Math.abs(qtyVal);
        else change = qtyVal;
    }

    const newVal = Math.max(0, current + change);

    document.getElementById("adjustFrom").textContent = current;
    const toEl = document.getElementById("adjustTo");
    toEl.textContent = newVal;
    toEl.classList.toggle("decrease", change < 0);
}

adjustQuantity?.addEventListener("input", updateAdjustPreview);

if (closeAdjustStockModal) {
    closeAdjustStockModal.addEventListener("click", closeAdjustStockModalFn);
}
if (cancelAdjustBtn) {
    cancelAdjustBtn.addEventListener("click", closeAdjustStockModalFn);
}

if (adjustStockForm) {
    adjustStockForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!currentAdjustProduct) return;

        const client = getSupabaseClient();
        if (!client) return;

        const productId = currentAdjustProduct.id;
        const size = document.getElementById("adjustSizeSelect")?.value;
        const type = currentAdjustType;
        const qtyVal = parseInt(adjustQuantity.value || "0", 10);
        const reason = adjustReason.value.trim();
        const notes = adjustNotes.value.trim();

        if (!size) {
            alert("اختر المقاس");
            return;
        }

        if (isNaN(qtyVal) || qtyVal === 0) {
            alert("اكتب كمية صحيحة");
            return;
        }

        if (!reason) {
            alert("اكتب السبب");
            return;
        }

        let change = 0;
        if (type === "purchase") change = Math.abs(qtyVal);
        else if (type === "damage") change = -Math.abs(qtyVal);
        else change = qtyVal;

        const saveBtn = document.getElementById("saveAdjustBtn");
        saveBtn.disabled = true;
        saveBtn.textContent = "جاري الحفظ...";

        try {
            const { error } = await client.rpc("adjust_stock", {
                p_product_id: productId,
                p_size: size,
                p_quantity_change: change,
                p_movement_type: type,
                p_reason: reason,
                p_notes: notes || null
            });

            if (error) throw error;

            showToast("تم تعديل المخزون بنجاح ✅");
            closeAdjustStockModalFn();

            await loadAdminProducts();
            await loadInventory();
            await loadMovements();
        } catch (error) {
            console.error("Adjust Stock Error:", error);
            alert("فشل التعديل:\n\n" + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "تأكيد التعديل";
        }
    });
}

// ========================================
// 45. APPROVAL REQUESTS
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

        if (dashStatPending) {
            dashStatPending.textContent = pendingCount;
        }

        if (dashPendingCard) {
            dashPendingCard.style.display = "";
        }

        if (sidebarPendingBadge) {
            if (pendingCount > 0) {
                sidebarPendingBadge.textContent = pendingCount;
                sidebarPendingBadge.style.display = "inline-block";
            } else {
                sidebarPendingBadge.style.display = "none";
            }
        }

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

function filterApprovalRequests(status, button) {
    currentApprovalFilter = status;
    document.querySelectorAll(".approval-filter-modern button").forEach(btn => {
        btn.classList.remove("active");
    });
    if (button) button.classList.add("active");
    renderApprovalRequests();
}

function renderApprovalRequests() {
    if (!approvalRequests) return;

    let requests = adminApprovalRequests;
    if (currentApprovalFilter !== "all") {
        requests = requests.filter(r => r.status === currentApprovalFilter);
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

    approvalRequests.innerHTML = requests.map(r => buildApprovalCard(r)).join("");
}

function buildApprovalCard(request) {
    const actionText = request.action === "update"
        ? "تعديل منتج"
        : request.action === "delete" ? "حذف منتج" : request.action;

    const statusText = request.status === "pending"
        ? "في انتظار الموافقة"
        : request.status === "approved" ? "تمت الموافقة" : "مرفوض";

    const statusClass = request.status === "pending"
        ? "status-waiting"
        : request.status === "approved" ? "status-approved" : "status-rejected";

    const product = getProductById(request.product_id);

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
// 46. FORMAT REQUEST VALUE
// ========================================

function formatRequestValue(field, value) {
    if (value === null || value === undefined || value === "") {
        return "غير موجود";
    }
    if (field === "price") {
        return Number(value).toLocaleString("en-US") + " جنيه";
    }
    if (field === "old_price") {
        return value === null ? "غير موجود" : Number(value).toLocaleString("en-US") + " جنيه";
    }
    if (field === "sizes") {
        const sizes = parseSizes(value);
        return sizes.length
            ? sizes.map(size => `<span style="display:inline-block;background:#f1f5f9;padding:3px 7px;border-radius:5px;margin:2px;">${escapeAdminHTML(size)}</span>`).join("")
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
// 47. VIEW APPROVAL DETAILS
// ========================================

function viewApprovalRequest(requestId) {
    const request = adminApprovalRequests.find(
        item => Number(item.id) === Number(requestId)
    );

    if (!request || !approvalModal || !approvalModalBody) return;

    const actionText = request.action === "update"
        ? "تعديل المنتج"
        : request.action === "delete" ? "حذف المنتج" : request.action;

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
                <strong><i class="fa-solid fa-triangle-exclamation"></i> طلب حذف المنتج</strong>
                <p>سيتم حذف المنتج بالكامل إذا تمت الموافقة.</p>
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
                    البيانات باللون الأحمر هي الحالية، والأخضر هي التعديل المقترح.
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
                <i class="fa-solid fa-check"></i> الموافقة وتنفيذ
            </button>
            <button type="button" class="modal-reject"
                onclick="rejectChangeRequest(${Number(request.id)}, true)">
                <i class="fa-solid fa-xmark"></i> رفض
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
// 48. APPROVE CHANGE REQUEST
// ========================================

async function approveChangeRequest(requestId, fromModal = false) {
    if (!isManager()) {
        alert("ليس لديك صلاحية الموافقة");
        return;
    }
    const client = getSupabaseClient();
    if (!client) return;

    const confirmed = confirm("هل تريد الموافقة على هذا الطلب؟");
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
            const sizesWithQty = newData.sizes_with_quantities || [];

            const { error } = await client
                .from("products")
                .update({
                    name: newData.name || "",
                    price: Number(newData.price || 0),
                    old_price: newData.old_price == null ? null : Number(newData.old_price),
                    badge: newData.badge || null,
                    sizes: Array.isArray(newData.sizes) ? newData.sizes : [],
                    image: newData.image || null,
                    images: Array.isArray(newData.images) ? newData.images : [],
                    description: newData.description || "",
                    updated_by: request.requested_by,
                    updated_by_username: request.requested_by_username,
                    updated_at: new Date().toISOString(),
                    updated_user_id: request.requested_by,
                    updated_username: request.requested_by_username
                })
                .eq("id", request.product_id);

            if (error) throw error;

            if (sizesWithQty.length) {
                const oldSizes = (request.old_data?.sizes_with_quantities || []);
                await applySizeChanges(
                    client,
                    request.product_id,
                    sizesWithQty,
                    oldSizes
                );
            }

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

        showToast("تمت الموافقة بنجاح ✅");
        closeApprovalRequestModal();

        await loadAdminProducts();
        await loadApprovalRequests();
    } catch (error) {
        console.error("Approve Request Error:", error);
        alert("حدث خطأ:\n\n" + error.message);
    }
}

// ========================================
// 49. REJECT CHANGE REQUEST
// ========================================

async function rejectChangeRequest(requestId, fromModal = false) {
    if (!isManager()) {
        alert("ليس لديك صلاحية الرفض");
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

        showToast("تم رفض الطلب ❌");
        closeApprovalRequestModal();
        await loadApprovalRequests();
    } catch (error) {
        console.error("Reject Request Error:", error);
        alert("حدث خطأ:\n\n" + error.message);
    }
}

// ========================================
// 50. STATUS REASON MODAL
// ========================================

const REASON_OPTIONS = {
    return_requested: [
        "المقاس غير مناسب", "اللون مختلف عن الصورة", "المنتج به عيب",
        "المنتج مختلف عن الوصف", "العميل غير رأيه", "سبب آخر"
    ],
    exchange_requested: [
        "المقاس غير مناسب", "اللون مختلف",
        "العميل عايز موديل تاني", "المنتج به عيب", "سبب آخر"
    ],
    cancelled: [
        "لم يتم التحويل خلال المدة المحددة",
        "العميل غيّر رأيه", "العميل مش بيرد",
        "العنوان غلط", "المنتج مش متوفر", "سبب آخر"
    ]
};

function openStatusReasonModal(order, newStatus) {
    const modal = document.getElementById("statusReasonModal");
    if (!modal) return;

    document.getElementById("statusReasonOrderId").value = order.id;
    document.getElementById("statusReasonNewStatus").value = newStatus;

    const titles = {
        return_requested: "طلب استرجاع",
        exchange_requested: "طلب استبدال",
        cancelled: "إلغاء الطلب"
    };

    document.getElementById("statusReasonTitle").textContent =
        `${titles[newStatus]} - الطلب #${order.id}`;
    document.getElementById("reasonTypeLabel").textContent = titles[newStatus];

    const select = document.getElementById("statusReasonSelect");
    const options = REASON_OPTIONS[newStatus] || [];

    select.innerHTML = '<option value="">اختر السبب</option>' +
        options.map(o => `<option value="${escapeAdminHTML(o)}">${escapeAdminHTML(o)}</option>`).join("");

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
    "click", closeStatusReasonModal
);
document.getElementById("cancelStatusReasonBtn")?.addEventListener(
    "click", closeStatusReasonModal
);

document.getElementById("statusReasonForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const orderId = Number(document.getElementById("statusReasonOrderId").value);
    const newStatus = document.getElementById("statusReasonNewStatus").value;
    const selectedReason = document.getElementById("statusReasonSelect").value;
    const customReason = document.getElementById("statusReasonCustom").value.trim();
    const notes = document.getElementById("statusReasonNotes").value.trim();

    let finalReason = selectedReason;

    if (selectedReason === "سبب آخر") {
        if (!customReason) { alert("اكتب السبب"); return; }
        finalReason = customReason;
    }

    if (!finalReason) { alert("اختر السبب"); return; }

    const btn = document.getElementById("saveStatusReasonBtn");
    btn.disabled = true;
    btn.textContent = "جاري الحفظ...";

    await applyStatusChange(orderId, newStatus, finalReason, notes);

    btn.disabled = false;
    btn.textContent = "تأكيد التغيير";
    closeStatusReasonModal();
});

// ========================================
// 51. EXCHANGE REQUEST
// ========================================

function openExchangeRequestModal(orderId) {
    const order = adminOrders.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    if (!["delivered", "exchange_requested"].includes(order.status)) {
        alert("الاستبدال متاح فقط للطلبات المُسلَّمة");
        return;
    }

    currentExchangeOrder = order;

    const items = Array.isArray(order.items) ? order.items : [];

    const previousExchanges = order.exchange_details?.items || [];
    const previousKeys = new Set(
        previousExchanges.map(e => `${e.product_id}_${e.old_size}`)
    );

    const previousMap = {};
    previousExchanges.forEach(e => {
        previousMap[`${e.product_id}_${e.old_size}`] = e;
    });

    const itemsHTML = items.map((item, index) => {
        const product = getProductById(item.id);
        const image = item.image || product?.image || "";
        const key = `${item.id}_${item.size}`;
        const previous = previousMap[key];
        const wasSelected = previousKeys.has(key);
        const totalQty = Number(item.quantity || 1);
        const selectedQty = previous?.quantity || totalQty;

        return `
            <div class="exchange-item-row ${wasSelected ? "selected" : ""}" data-index="${index}">
                <div class="exchange-item-header">
                    <label class="exchange-checkbox-label">
                        <input type="checkbox" class="exchange-item-check" 
                            data-index="${index}" 
                            ${wasSelected ? "checked" : ""}
                            onchange="toggleExchangeItem(this)">
                        <span class="exchange-checkbox-custom"></span>
                    </label>
                    <div class="exchange-item-img"
                        style="background-image:url('${escapeAdminHTML(image)}');"></div>
                    <div class="exchange-item-info">
                        <div class="exchange-item-name">
                            ${escapeAdminHTML(item.name || "منتج")}
                        </div>
                        <div class="exchange-item-meta">
                            المقاس الحالي: 
                            <strong style="color:#8b5cf6;">${escapeAdminHTML(item.size || "-")}</strong>
                            · الكمية الأصلية: 
                            <strong>${totalQty}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="exchange-item-qty-row">
                    <label class="exchange-qty-label">
                        <i class="fa-solid fa-cubes"></i>
                        الكمية المطلوب استبدالها:
                    </label>
                    <input 
                        type="number" 
                        class="exchange-qty-input" 
                        data-index="${index}"
                        min="1" 
                        max="${totalQty}" 
                        value="${selectedQty}"
                        ${wasSelected ? "" : "disabled"}
                    >
                    <span class="exchange-qty-max">/ ${totalQty}</span>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("exchangeRequestBody").innerHTML = `
        <div style="margin-bottom:16px;padding:12px 14px;background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;">
            <div style="font-size:13px;color:#1e40af;font-weight:700;">
                <i class="fa-solid fa-info-circle"></i>
                الطلب رقم #${escapeAdminHTML(order.id)} — ${escapeAdminHTML(order.customer_name || "عميل")}
            </div>
        </div>
        ${itemsHTML}
    `;

    if (order.exchange_reason) {
        const reasonSelect = document.getElementById("exchangeRequestReason");
        for (let opt of reasonSelect.options) {
            if (opt.value === order.exchange_reason || opt.text === order.exchange_reason) {
                reasonSelect.value = opt.value || opt.text;
                break;
            }
        }
    } else {
        document.getElementById("exchangeRequestReason").value = "";
    }

    document.getElementById("exchangeRequestNotes").value =
        order.exchange_details?.notes || "";

    document.getElementById("exchangeRequestModal").classList.add("open");
}

function closeExchangeRequestModalFn() {
    document.getElementById("exchangeRequestModal")?.classList.remove("open");
    currentExchangeOrder = null;
}

function toggleExchangeItem(checkbox) {
    const index = checkbox.dataset.index;
    const row = document.querySelector(`.exchange-item-row[data-index="${index}"]`);
    const qtyInput = row?.querySelector(".exchange-qty-input");
    const checkboxes = document.querySelectorAll(".exchange-item-check:checked");

    if (currentExchangeOrder?.status === "exchange_requested") {
        if (checkboxes.length > 1) {
            checkbox.checked = false;
            alert("في وضع التعديل، نقدر نغيّر منتج واحد بس. احذف الطلب الأول لو عايز تبدّل منتجات تانية.");
            return;
        }
    }

    if (checkbox.checked) {
        row?.classList.add("selected");
        if (qtyInput) qtyInput.disabled = false;
    } else {
        row?.classList.remove("selected");
        if (qtyInput) {
            qtyInput.disabled = true;
            qtyInput.value = qtyInput.max;
        }
    }
}

async function saveExchangeRequest() {
    if (!currentExchangeOrder) return;

    const order = currentExchangeOrder;
    const client = getSupabaseClient();
    if (!client) return;

    const checkedBoxes = document.querySelectorAll(".exchange-item-check:checked");
    if (!checkedBoxes.length) {
        alert("اختر منتج واحد على الأقل");
        return;
    }

    const reason = document.getElementById("exchangeRequestReason")?.value;
    if (!reason) {
        alert("اختر السبب");
        return;
    }

    const notes = document.getElementById("exchangeRequestNotes")?.value.trim() || "";
    const items = Array.isArray(order.items) ? order.items : [];

    const previousExchanges = order.exchange_details?.items || [];
    const previousMap = {};
    previousExchanges.forEach(e => {
        previousMap[`${e.product_id}_${e.old_size}`] = e;
    });

    const selectedItems = Array.from(checkedBoxes).map(cb => {
        const idx = Number(cb.dataset.index);
        const item = items[idx];
        const key = `${item.id}_${item.size}`;
        const previous = previousMap[key];

        const row = document.querySelector(`.exchange-item-row[data-index="${idx}"]`);
        const qtyInput = row?.querySelector(".exchange-qty-input");
        const totalQty = Number(item.quantity || 1);
        let selectedQty = parseInt(qtyInput?.value || totalQty, 10);

        if (isNaN(selectedQty) || selectedQty < 1) selectedQty = 1;
        if (selectedQty > totalQty) selectedQty = totalQty;

        return {
            product_id: item.id,
            product_name: item.name,
            image: item.image,
            old_size: item.size,
            new_size: previous?.new_size || null,
            quantity: selectedQty,
            original_quantity: totalQty,
            reason: previous?.reason || reason
        };
    });

    const exchangeDetails = {
        items: selectedItems,
        notes: notes,
        requested_at: order.exchange_details?.requested_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const btn = document.getElementById("saveExchangeRequestBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

    try {
        const historyEntry = {
            status: "exchange_requested",
            reason: reason,
            notes: notes || null,
            by: currentAdmin?.username || currentAdmin?.email || "admin",
            at: new Date().toISOString()
        };

        const currentHistory = Array.isArray(order.status_history) ? order.status_history : [];
        const newHistory = [...currentHistory, historyEntry];

        const { error } = await client
            .from("orders")
            .update({
                status: "exchange_requested",
                exchange_reason: reason,
                exchange_details: exchangeDetails,
                status_history: newHistory,
                updated_at: new Date().toISOString()
            })
            .eq("id", order.id);

        if (error) throw error;

        order.status = "exchange_requested";
        order.exchange_reason = reason;
        order.exchange_details = exchangeDetails;
        order.status_history = newHistory;

        showToast("تم تسجيل طلب الاستبدال ✅");
        closeExchangeRequestModalFn();

        renderAdminOrders();
        updateDashboard();
    } catch (error) {
        console.error("Exchange Request Error:", error);
        alert("فشل تسجيل الطلب:\n\n" + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> تأكيد طلب الاستبدال';
    }
}

document.getElementById("closeExchangeRequestModal")?.addEventListener(
    "click", closeExchangeRequestModalFn
);
document.getElementById("cancelExchangeRequestBtn")?.addEventListener(
    "click", closeExchangeRequestModalFn
);
document.getElementById("saveExchangeRequestBtn")?.addEventListener(
    "click", saveExchangeRequest
);
document.getElementById("exchangeRequestModal")?.addEventListener("click", (e) => {
    if (e.target.id === "exchangeRequestModal") {
        closeExchangeRequestModalFn();
    }
});

// ========================================
// 52. EXCHANGE RECEIVED
// ========================================

function selectExchangeSize(btn, index) {
    const picker = btn.closest(".size-picker");
    if (!picker) return;

    picker.querySelectorAll(".size-pick-btn").forEach(b => {
        b.classList.remove("selected");
    });

    btn.classList.add("selected");

    const hidden = picker.querySelector(".exchange-newsize-value");
    if (hidden) hidden.value = btn.dataset.size;
}

function openExchangeReceivedModal(orderId) {
    const order = adminOrders.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    if (order.status !== "exchange_requested") {
        alert("هذا الإجراء متاح فقط لطلبات الاستبدال");
        return;
    }

    const items = order.exchange_details?.items || [];
    if (!items.length) {
        alert("لا يوجد منتجات في طلب الاستبدال");
        return;
    }

    currentExchangeReceivedOrder = order;

    const itemsHTML = items.map((item, index) => {
        const product = getProductById(item.product_id);
        const allSizes = product ? parseSizes(product.sizes) : [];
        const productSizesData = getProductSizes(item.product_id);

        const sizesOptions = allSizes.map(sizeStr => {
            const sizeData = productSizesData.find(
                s => String(s.size) === String(sizeStr)
            );
            const available = sizeData
                ? Math.max(0, Number(sizeData.stock) - Number(sizeData.reserved))
                : 0;
            const isOld = String(sizeStr) === String(item.old_size);

            if (isOld) {
                return `
                    <button type="button" class="size-pick-btn old" disabled>
                        <span class="size-pick-num">${escapeAdminHTML(sizeStr)}</span>
                        <span class="size-pick-label">الحالي</span>
                    </button>
                `;
            }

            if (available === 0) {
                return `
                    <button type="button" class="size-pick-btn unavailable" disabled>
                        <span class="size-pick-num">${escapeAdminHTML(sizeStr)}</span>
                        <span class="size-pick-label">غير متاح</span>
                    </button>
                `;
            }

            return `
                <button type="button" class="size-pick-btn available" 
                    data-size="${escapeAdminHTML(sizeStr)}"
                    onclick="selectExchangeSize(this, ${index})">
                    <span class="size-pick-num">${escapeAdminHTML(sizeStr)}</span>
                    <span class="size-pick-label">متاح ${available}</span>
                </button>
            `;
        }).join("");

        return `
            <div class="exchange-received-item" data-index="${index}">
                <div class="exchange-received-header">
                    <div class="exchange-item-img" 
                        style="background-image:url('${escapeAdminHTML(item.image || '')}');"></div>
                    <div class="exchange-item-info">
                        <div class="exchange-item-name">
                            ${escapeAdminHTML(item.product_name || "منتج")}
                        </div>
                        <div class="exchange-item-meta">
                            المقاس القديم: 
                            <strong style="color:#dc2626;">${escapeAdminHTML(item.old_size)}</strong>
                            · الكمية: 
                            <strong>${item.quantity}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="exchange-received-newsize">
                    <label>
                        <i class="fa-solid fa-shoe-prints"></i>
                        المقاس الجديد *
                    </label>
                    <div class="size-picker" data-index="${index}">
                        ${sizesOptions}
                        <input type="hidden" class="exchange-newsize-value" data-index="${index}" required>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("exchangeReceivedBody").innerHTML = `
        <div style="margin-bottom:16px;padding:12px 14px;background:#ecfdf5;border:1px solid #86efac;border-radius:10px;">
            <div style="font-size:13px;color:#166534;font-weight:700;">
                <i class="fa-solid fa-info-circle"></i>
                الطلب رقم #${escapeAdminHTML(order.id)} — 
                ${escapeAdminHTML(order.customer_name || "عميل")}
            </div>
            <div style="font-size:12px;color:#166534;margin-top:6px;">
                سيرجع المقاس القديم للمخزون، ويتم حجز المقاس الجديد تلقائيًا.
            </div>
        </div>
        ${itemsHTML}
    `;

    document.getElementById("exchangeReceivedModal").classList.add("open");
}

function closeExchangeReceivedModalFn() {
    document.getElementById("exchangeReceivedModal")?.classList.remove("open");
    currentExchangeReceivedOrder = null;
}

async function saveExchangeReceived() {
    if (!currentExchangeReceivedOrder) return;

    const order = currentExchangeReceivedOrder;
    const client = getSupabaseClient();
    if (!client) return;

    const selects = document.querySelectorAll(".exchange-newsize-value");
    const newItems = [];

    for (const select of selects) {
        const idx = Number(select.dataset.index);
        const newSize = select.value;

        if (!newSize) {
            alert("اختر المقاس الجديد لكل منتج");
            const picker = select.closest(".size-picker");
            picker?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const item = order.exchange_details.items[idx];

        newItems.push({
            product_id: item.product_id,
            product_name: item.product_name,
            image: item.image,
            old_size: item.old_size,
            new_size: newSize,
            quantity: item.quantity,
            reason: item.reason
        });
    }

    const btn = document.getElementById("saveExchangeReceivedBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

    try {
        const { data, error } = await client.rpc("process_exchange_received", {
            p_order_id: order.id,
            p_new_items: newItems
        });

        if (error) throw error;
        if (!data?.success) throw new Error("فشل الاستلام");

        const historyEntry = {
            status: "exchange_received",
            reason: "تم استلام المنتج وتحديد المقاس الجديد",
            notes: null,
            by: currentAdmin?.username || currentAdmin?.email || "admin",
            at: new Date().toISOString()
        };

        const currentHistory = Array.isArray(order.status_history)
            ? order.status_history
            : [];
        const newHistory = [...currentHistory, historyEntry];

        const updatedDetails = {
            ...order.exchange_details,
            items: newItems,
            received_at: new Date().toISOString()
        };

        const { error: updateError } = await client
            .from("orders")
            .update({
                status: "exchange_received",
                exchange_details: updatedDetails,
                status_history: newHistory,
                updated_at: new Date().toISOString()
            })
            .eq("id", order.id);

        if (updateError) throw updateError;

        order.status = "exchange_received";
        order.exchange_details = updatedDetails;
        order.status_history = newHistory;

        showToast("تم استلام المنتج بنجاح ✅");
        closeExchangeReceivedModalFn();

        renderAdminOrders();
        updateDashboard();
        await loadAdminProducts();
    } catch (error) {
        console.error("Exchange Received Error:", error);
        alert("فشل الاستلام:\n\n" + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> تأكيد الاستلام';
    }
}

document.getElementById("closeExchangeReceivedModal")?.addEventListener(
    "click", closeExchangeReceivedModalFn
);
document.getElementById("cancelExchangeReceivedBtn")?.addEventListener(
    "click", closeExchangeReceivedModalFn
);
document.getElementById("saveExchangeReceivedBtn")?.addEventListener(
    "click", saveExchangeReceived
);
document.getElementById("exchangeReceivedModal")?.addEventListener("click", (e) => {
    if (e.target.id === "exchangeReceivedModal") {
        closeExchangeReceivedModalFn();
    }
});

// ========================================
// 53. NOTIFICATION FILTER HELPERS
// ========================================

function showLowStockProducts() {
    closeNotificationsDropdown();
    switchTab('inventory');

    setTimeout(() => {
        const lowBtn = document.querySelector('.inv-filter-chip[data-filter="low"]');
        if (lowBtn) {
            document.querySelectorAll('.inv-filter-chip').forEach(b => b.classList.remove('active'));
            lowBtn.classList.add('active');
            currentInventoryFilter = 'low';
            renderInventoryList();
        }
    }, 100);
}

function showOutOfStockProducts() {
    closeNotificationsDropdown();
    switchTab('inventory');

    setTimeout(() => {
        const outBtn = document.querySelector('.inv-filter-chip[data-filter="out"]');
        if (outBtn) {
            document.querySelectorAll('.inv-filter-chip').forEach(b => b.classList.remove('active'));
            outBtn.classList.add('active');
            currentInventoryFilter = 'out';
            renderInventoryList();
        }
    }, 100);
}

function showUrgentOrders() {
    closeNotificationsDropdown();
    switchTab('orders');

    setTimeout(() => {
        customOrderStatuses = ["pending"];
        const pendingBtn = document.querySelector('.filter-chip[onclick*="pending"]');
        if (pendingBtn) {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            pendingBtn.classList.add('active');
        }
        renderAdminOrders();
    }, 100);
}

function showActiveOrders() {
    closeNotificationsDropdown();
    switchTab('orders');

    setTimeout(() => {
        customOrderStatuses = [
            "pending", "preparing", "shipped",
            "return_requested", "return_received",
            "exchange_requested", "exchange_received", "exchange_shipped"
        ];

        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        renderAdminOrders();
    }, 100);
}

function showFollowUpOrders() {
    closeNotificationsDropdown();
    switchTab('orders');

    setTimeout(() => {
        customOrderStatuses = ["exchange_requested", "return_requested"];
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        renderAdminOrders();
    }, 100);
}

function showExchangeOrders() {
    closeNotificationsDropdown();
    switchTab('orders');

    setTimeout(() => {
        customOrderStatuses = ["exchange_requested", "return_requested"];
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        renderAdminOrders();
    }, 100);
}

// ========================================
// 54. SMART ALERTS
// ========================================

function renderSmartAlerts(lowStockCount) {
    const listEl = document.getElementById("notificationsList");
    const badgeEl = document.getElementById("notificationsBadge");
    const countEl = document.getElementById("notificationsCount");

    if (!listEl || !badgeEl) return;

    const alerts = [];

    // ⚠️ منتجات نفذت أو قاربت على النفاد
    const outCount = adminProducts.filter(p => getStockStatus(p) === "out").length;
    const lowOnlyCount = adminProducts.filter(p => getStockStatus(p) === "low").length;

    if (lowOnlyCount > 0) {
        alerts.push({
            type: "warning",
            icon: "fa-triangle-exclamation",
            text: `${lowOnlyCount} ${lowOnlyCount === 1 ? "منتج قارب" : "منتجات قاربت"} على النفاد`,
            action: "showLowStockProducts()",
            actionText: "مراجعة"
        });
    }

    if (outCount > 0) {
        alerts.push({
            type: "danger",
            icon: "fa-circle-xmark",
            text: `${outCount} ${outCount === 1 ? "منتج نفذ" : "منتجات نفذت"} من المخزون`,
            action: "showOutOfStockProducts()",
            actionText: "مراجعة"
        });
    }

    // ⏰ طلبات قربت تنتهي
    const urgentOrders = adminOrders.filter(o => {
        if (o.status !== "pending") return false;
        const rem = getOrderTimeRemaining(o);
        if (!rem || rem.expired) return false;
        const created = new Date(o.created_at);
        const diffHr = (new Date() - created) / 3600000;
        return diffHr > 20;
    });

    if (urgentOrders.length > 0) {
        alerts.push({
            type: "danger",
            icon: "fa-clock",
            text: `${urgentOrders.length} ${urgentOrders.length === 1 ? "طلب قارب" : "طلبات قاربت"} على انتهاء الوقت`,
            action: "showUrgentOrders()",
            actionText: "عرض"
        });
    }

    // 🔄 طلبات استبدال/استرجاع محتاجة متابعة
    const pendingExchange = adminOrders.filter(o =>
        ["exchange_requested", "return_requested"].includes(o.status)
    ).length;

    if (pendingExchange > 0) {
        alerts.push({
            type: "info",
            icon: "fa-arrows-rotate",
            text: `${pendingExchange} ${pendingExchange === 1 ? "طلب" : "طلبات"} استبدال/استرجاع محتاجة متابعة`,
            action: "showExchangeOrders()",
            actionText: "عرض"
        });
    }

    // ✅ طلبات موافقة
    const pendingApprovals = adminApprovalRequests.filter(r => r.status === "pending").length;
    if (pendingApprovals > 0) {
        alerts.push({
            type: "warning",
            icon: "fa-user-check",
            text: `${pendingApprovals} ${pendingApprovals === 1 ? "طلب موافقة" : "طلبات موافقة"} من الموظفين`,
            action: "switchTab('approvals')",
            actionText: "مراجعة"
        });
    }

    if (alerts.length > 0) {
        badgeEl.textContent = alerts.length;
        badgeEl.style.display = "flex";
        if (countEl) countEl.textContent = alerts.length;
    } else {
        badgeEl.style.display = "none";
        if (countEl) countEl.textContent = 0;
    }

    if (!alerts.length) {
        listEl.innerHTML = `
            <div class="notifications-empty">
                <i class="fa-solid fa-check-circle"></i>
                <p>لا توجد تنبيهات</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = alerts.map(a => `
        <div class="notification-item notification-${a.type}">
            <div class="notification-icon">
                <i class="fa-solid ${a.icon}"></i>
            </div>
            <div class="notification-text">${a.text}</div>
            <button type="button" class="notification-action" onclick="${a.action}">
                ${a.actionText}
                <i class="fa-solid fa-arrow-left"></i>
            </button>
        </div>
    `).join("");
}

// ========================================
// 55. DASHBOARD RENDERING
// ========================================

function renderDashboardOrders() {
    if (!dashRecentOrdersList) return;

    const recent = adminOrders.slice(0, 5);

    const activeOrders = adminOrders.filter(o =>
        !["delivered", "cancelled", "refunded", "exchanged", "returned"].includes(o.status)
    );

    if (dashStatNewOrders) dashStatNewOrders.textContent = activeOrders.length;

    if (sidebarNewOrdersBadge) {
        if (activeOrders.length > 0) {
            sidebarNewOrdersBadge.textContent = activeOrders.length;
            sidebarNewOrdersBadge.style.display = "inline-block";
        } else {
            sidebarNewOrdersBadge.style.display = "none";
        }
    }

    if (!recent.length) {
        dashRecentOrdersList.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#64748b;">
                    لا توجد طلبات حديثة
                </td>
            </tr>
        `;
        return;
    }

    dashRecentOrdersList.innerHTML = recent.map(order => {
        const governorate = order.governorate || order.customer_governorate || order.city || "-";
        return `
            <tr>
                <td>#${escapeAdminHTML(order.id)}</td>
                <td>${escapeAdminHTML(order.customer_name || "عميل")}</td>
                <td>${escapeAdminHTML(governorate)}</td>
                <td>${Number(order.total_amount || 0).toLocaleString("en-US")} جنيه</td>
                <td>${getStatusBadge(order.status)}</td>
            </tr>
        `;
    }).join("");
}

async function loadCustomersCount() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data, error } = await client.rpc("get_customers_count");
        if (error) throw error;

        if (dashStatCustomers) {
            dashStatCustomers.textContent = data || 0;
        }
    } catch (err) {
        console.warn("Load customers count failed:", err);
    }
}

function openSalesPage() {
    switchTab('reports');
}

function updateDashboard() {
    // ===== المبيعات =====
    const soldOrders = adminOrders.filter(o => SOLD_STATUSES.includes(o.status));

    const totalRevenue = soldOrders.reduce(
        (sum, o) => sum + Number(o.total_amount || 0), 0
    );

    if (dashStatRevenue) {
        dashStatRevenue.textContent = `${totalRevenue.toLocaleString("en-US")} ج.م`;
    }

    // مبيعات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = soldOrders
        .filter(o => new Date(o.created_at) >= today)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    if (dashStatTodaySales) {
        dashStatTodaySales.textContent = `${todaySales.toLocaleString("en-US")} ج.م`;
    }

    // ✅ مبيعات الشهر
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthSales = soldOrders
        .filter(o => new Date(o.created_at) >= monthStart)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    if (dashStatMonthSales) {
        dashStatMonthSales.textContent = `${monthSales.toLocaleString("en-US")} ج.م`;
    }

    // ✅ متوسط قيمة الطلب (AOV)
    const aov = soldOrders.length > 0 ? totalRevenue / soldOrders.length : 0;
    if (dashStatAOV) {
        dashStatAOV.textContent = `${Math.round(aov).toLocaleString("en-US")} ج.م`;
    }

    // ===== منتجات قاربت على النفاد =====
    // ✅ نعرض "قاربت على النفاد" فقط (low)
    const lowStockCount = adminProducts.filter(p => {
        return getStockStatus(p) === "low";
    }).length;

    // ✅ "نفذت" فقط (out)
    const outOfStockCount = adminProducts.filter(p => {
        return getStockStatus(p) === "out";
    }).length;

    // ✅ المجموع للتنبيهات
    const totalNeedAttention = lowStockCount + outOfStockCount;

    if (dashStatLowStock) {
        dashStatLowStock.textContent = totalNeedAttention;
    }

    // ===== طلبات محتاجة متابعة (استبدال / استرجاع) =====
    const followUpCount = adminOrders.filter(o =>
        ["exchange_requested", "return_requested"].includes(o.status)
    ).length;

    if (dashStatFollowUp) {
        dashStatFollowUp.textContent = followUpCount;
    }

    // ===== أعلى عميل شراءً =====
    computeTopCustomer();

    // ===== التنبيهات =====
    updateLowStockBadge();
    renderSmartAlerts(totalNeedAttention);

    // ===== باقي الويدجت =====
    renderDashboardOrders();
    renderTopSelling();
    loadCustomersCount();

    // ✅ رسم الـ Sparkline
    renderSparkline();
}

// ========================================
// TOP CUSTOMER + SPARKLINE
// ========================================

function computeTopCustomer() {
    const el = document.getElementById("dashStatTopCustomer");
    const labelEl = document.getElementById("dashStatTopCustomerLabel");
    if (!el) return;

    const map = {};

    // ✅ نستثني الطلبات الملغية والمرتجعة نهائيًا
    adminOrders
        .filter(o => !["cancelled", "refunded"].includes(o.status))
        .forEach(o => {
            const key = o.customer_id
                ? `id:${o.customer_id}`
                : `phone:${o.customer_phone || "unknown"}`;

            if (!map[key]) {
                map[key] = {
                    name: o.customer_name || "عميل",
                    phone: o.customer_phone || "-",
                    total: 0
                };
            }
            map[key].total += Number(o.total_amount || 0);
        });

    const sorted = Object.values(map).sort((a, b) => b.total - a.total);

    if (!sorted.length) {
        el.textContent = "-";
        if (labelEl) labelEl.textContent = "أعلى عميل";
        return;
    }

    const top = sorted[0];
    el.textContent = top.name;
    el.title = `${top.name} — ${top.total.toLocaleString("en-US")} ج.م`;

    if (labelEl) {
        labelEl.textContent = `أعلى عميل · ${Math.round(top.total).toLocaleString("en-US")} ج.م`;
    }
}

function renderSparkline() {
    const canvas = document.getElementById("dashSparkline");
    if (!canvas) return;

    // آخر 7 أيام
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
    }

    const soldOrders = adminOrders.filter(o => SOLD_STATUSES.includes(o.status));

    const values = days.map(day => {
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        return soldOrders
            .filter(o => {
                const d = new Date(o.created_at);
                return d >= day && d < next;
            })
            .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    });

    // إعداد الـ canvas
    const dpr = window.devicePixelRatio || 1;
    const w = 90;
    const h = 46;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...values, 1);
    const stepX = w / (values.length - 1 || 1);

    // نقاط الرسم
    const points = values.map((v, i) => ({
        x: i * stepX,
        y: h - (v / max) * (h - 6) - 3
    }));

    // gradient تحت الخط
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(22, 163, 74, 0.35)");
    grad.addColorStop(1, "rgba(22, 163, 74, 0)");

    // المسار المملوء
    ctx.beginPath();
    ctx.moveTo(points[0].x, h);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // الخط
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p, i) => {
        if (i === 0) return;
        ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // النقطة الأخيرة
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x - 1, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#16a34a";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function renderTopSelling() {
    if (!dashTopSellingList) return;

    const productSales = {};
    const validOrders = adminOrders.filter(o => SOLD_STATUSES.includes(o.status));

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
                        <div class="top-item-sales">${product.quantity} قطعة</div>
                    </div>
                </div>
                <div class="top-item-revenue">
                    ${product.revenue.toLocaleString("en-US")} ج.م
                </div>
            </div>
        `;
    }).join("");
}

// ========================================
// 56. LOGOUT
// ========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        const confirmed = confirm("هل أنت متأكد من تسجيل الخروج؟");
        if (!confirmed) return;

        stopHeartbeat();
        stopAutoRefresh();
        await endAdminSession("logout");

        const client = getSupabaseClient();
        if (client) await client.auth.signOut();

        window.location.replace("admin-login.html");
    });
}

// ========================================
// 57. CLOSE MODALS ON OUTSIDE CLICK
// ========================================

window.addEventListener("click", function (event) {
    if (event.target === editModal) closeEditProductModal();
    if (event.target === orderModal) orderModal.classList.remove("open");
    if (event.target === approvalModal) closeApprovalRequestModal();
    if (event.target === adjustStockModal) closeAdjustStockModalFn();
    if (event.target === addProductModal) {
        addProductModal.classList.remove("open");
    }
    if (event.target === document.getElementById("statusReasonModal")) {
        closeStatusReasonModal();
    }
});

// ========================================
// 58. START
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    if (isLoginPage()) await checkLoginPageSession();
    if (isAdminDashboard()) {
        await protectAdminDashboard();
        setupImageUploads(); // ✅ تهيئة رفع الصور
    }
});

// ========================================
// 58.5 AUTO REFRESH (كل دقيقة)
// ========================================

let autoRefreshInterval = null;

function startAutoRefresh() {
    stopAutoRefresh();

    autoRefreshInterval = setInterval(async () => {
        if (!isAdminDashboard() || !currentAdmin) return;

        // ✅ نحدّث الطلبات والتنبيهات كل دقيقة
        try {
            await loadAdminOrders();
            await loadApprovalRequests();

            // ✅ لو المستخدم على شاشة المخزون، نحدّثها كمان
            const currentTab = document.querySelector(".tab-content.active")?.id;
            if (currentTab === "viewInventory") {
                await loadAdminProducts();
                loadInventory();
                loadMovements();
            }
        } catch (err) {
            console.warn("Auto refresh error:", err);
        }
    }, 60 * 1000); // كل دقيقة
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ========================================
// 59. SESSION PROTECTION
// ========================================

window.addEventListener("pageshow", async function () {
    if (isAdminDashboard() && !(await getCurrentAdmin())) {
        window.location.replace("admin-login.html");
    }
});

// ✅ فحص الجلسة كل دقيقة — لو اتنهت من السوبر أدمن → يخرج فورًا
setInterval(async () => {
    if (isAdminDashboard() && currentAdmin && currentSessionToken) {
        const ok = await verifyCurrentSession();
        if (!ok) {
            stopHeartbeat();
            const client = getSupabaseClient();
            if (client) await client.auth.signOut();
            localStorage.removeItem("adminSessionToken");
            alert("تم إنهاء جلستك من قبل المدير. جاري تسجيل الخروج...");
            window.location.replace("admin-login.html");
        }
    }
}, 60 * 1000);

// ✅ إغلاق التاب مش بيلغي الجلسة (عشان لو رجع يكمل)
// الجلسة بتلغي تلقائيًا بعد 30 دقيقة عدم نشاط

// ========================================
// 60. GLOBAL FUNCTIONS
// ========================================

window.switchTab = switchTab;
window.filterOrders = filterOrders;
window.filterApprovalRequests = filterApprovalRequests;
window.loadAdminProducts = loadAdminProducts;
window.loadAdminOrders = loadAdminOrders;
window.loadApprovalRequests = loadApprovalRequests;
window.loadInventory = loadInventory;
window.loadMovements = loadMovements;
window.filterInventory = filterInventory;
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
window.copyTrackingLink = copyTrackingLink;
window.openAdjustStockModal = openAdjustStockModal;
window.selectMovementType = selectMovementType;
window.releaseOrderReservation = releaseOrderReservation;
window.toggleSizeQuantity = toggleSizeQuantity;
window.updateTotalPreview = updateTotalPreview;
window.openExchangeRequestModal = openExchangeRequestModal;
window.closeExchangeRequestModal = closeExchangeRequestModalFn;
window.openExchangeReceivedModal = openExchangeReceivedModal;
window.closeExchangeReceivedModal = closeExchangeReceivedModalFn;
window.selectExchangeSize = selectExchangeSize;
window.showLowStockProducts = showLowStockProducts;
window.showOutOfStockProducts = showOutOfStockProducts;
window.showUrgentOrders = showUrgentOrders;
window.showExchangeOrders = showExchangeOrders;
window.openSalesPage = openSalesPage;
window.showActiveOrders = showActiveOrders;
window.showFollowUpOrders = showFollowUpOrders;
// ========================================
// 61. REPORTS — MAIN
// ========================================

let currentReportKey = null;

let salesReportOrders = [];
let salesReportTab = "orders";  // "orders" | "products"
let salesReportFilters = {
    from: null,
    to: null,
    preset: "month",
    status: "delivered",
    governorate: "all",
    customer: ""
};

let customersReportRaw = [];
let customersReportFilters = { sort: "spent_desc", type: "all", search: "" };

let dailyReportFilters = { from: null, to: null, preset: "month" };
let govReportFilters = { from: null, to: null, preset: "month" };
let prodReportFilters = { from: null, to: null, preset: "month" };
let statusReportFilters = { from: null, to: null, preset: "month" };
let exchangeReportFilters = { from: null, to: null, preset: "month" };

let productsReportData = [];
let inventoryReportData = [];
let exchangeReportData = [];

const PAYMENT_METHODS_META = {
    cash: { text: "كاش عند الاستلام", icon: "fa-money-bill-wave" },
    instapay: { text: "InstaPay", icon: "fa-mobile-screen" },
    unknown: { text: "غير محدد", icon: "fa-circle-question" }
};

// ========================================
// 62. NAVIGATION
// ========================================

function openReport(key) {
    // 1) نروح لتاب التقارير الأول
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    document.getElementById("viewReports")?.classList.add("active");
    document.getElementById("tabNavReports")?.classList.add("active");

    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "التقارير والتحليلات";

    // قفل السايدبار في الموبايل
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("mobileOverlay")?.classList.remove("show");

    // 2) نخفي الـ home ونظهر التقرير المطلوب
    currentReportKey = key;

    const home = document.getElementById('reportsHome');
    if (home) home.style.display = 'none';

    document.querySelectorAll('.report-panel').forEach(p => p.classList.remove('active'));

    const panelMap = {
        sales: 'reportSales',
        daily: 'reportDaily',
        governorate: 'reportGovernorate',
        customers: 'reportCustomers',
        products: 'reportProducts',
        inventory: 'reportInventory',
        status: 'reportStatus',
        exchange: 'reportExchange'
    };

    const panelId = panelMap[key];
    if (panelId) {
        document.getElementById(panelId)?.classList.add('active');
    }

    const titles = {
        sales: 'المبيعات التفصيلية',
        daily: 'المبيعات اليومية',
        governorate: 'المبيعات حسب المحافظة',
        customers: 'تقرير العملاء',
        products: 'أداء المنتجات',
        inventory: 'حركة المخزون',
        status: 'حالات الطلبات',
        exchange: 'الاستبدال والاسترجاع'
    };

    if (subtitle) subtitle.textContent = titles[key] || '';

    // 3) نحمّل بيانات التقرير
    loadReportByKey(key);
}

function backToReportsHome() {
    currentReportKey = null;

    document.querySelectorAll('.report-panel').forEach(p => p.classList.remove('active'));
    const home = document.getElementById('reportsHome');
    if (home) home.style.display = 'block';

    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle) subtitle.textContent = 'مركز التقارير الشامل';
}

function loadReportByKey(key) {
    if (key === 'sales') loadSalesReport();
    else if (key === 'daily') loadDailyReport();
    else if (key === 'governorate') loadGovernorateReport();
    else if (key === 'customers') loadCustomersReport();
    else if (key === 'products') loadProductsReport();
    else if (key === 'inventory') loadInventoryReport();
    else if (key === 'status') loadStatusReport();
    else if (key === 'exchange') loadExchangeReport();
}

// ========================================
// 63. PRESETS HELPERS
// ========================================

function _getPresetRange(preset) {
    const now = new Date();
    const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const eod = d => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

    if (preset === "today") return { from: sod(now), to: eod(now) };
    if (preset === "week") {
        const f = new Date(now); f.setDate(f.getDate() - 6);
        return { from: sod(f), to: eod(now) };
    }
    if (preset === "month") {
        const f = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: sod(f), to: eod(now) };
    }
    return { from: null, to: null };
}

function _applyPresetToFilters(preset, filters, fromId, toId) {
    filters.preset = preset;
    const r = _getPresetRange(preset);
    filters.from = r.from;
    filters.to = r.to;

    const fEl = document.getElementById(fromId);
    const tEl = document.getElementById(toId);
    if (fEl) fEl.value = r.from ? r.from.toISOString().slice(0, 10) : '';
    if (tEl) tEl.value = r.to ? r.to.toISOString().slice(0, 10) : '';
}

function _applyManualFilters(filters, fromId, toId) {
    const fv = document.getElementById(fromId)?.value || '';
    const tv = document.getElementById(toId)?.value || '';
    filters.from = fv ? new Date(fv + 'T00:00:00') : null;
    filters.to = tv ? new Date(tv + 'T23:59:59') : null;
    filters.preset = 'custom';
}

// ========================================
// 64. SALES PRESETS
// ========================================

function setGovPreset(preset, btnEl) {
    document.querySelectorAll("#reportGovernorate .preset-chip").forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');
    _applyPresetToFilters(preset, govReportFilters, 'govDateFrom', 'govDateTo');
    loadGovernorateReport();
}

function setProdPreset(preset, btnEl) {
    document.querySelectorAll("#reportProducts .preset-chip").forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');
    _applyPresetToFilters(preset, prodReportFilters, 'prodDateFrom', 'prodDateTo');
    loadProductsReport();
}

function setStatusPreset(preset, btnEl) {
    document.querySelectorAll("#reportStatus .preset-chip").forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');
    _applyPresetToFilters(preset, statusReportFilters, null, null);
    loadStatusReport();
}

function setExchangePreset(preset, btnEl) {
    document.querySelectorAll("#reportExchange .preset-chip").forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');
    _applyPresetToFilters(preset, exchangeReportFilters, null, null);
    loadExchangeReport();
}

// ========================================
// 65. FETCH ORDERS IN RANGE (helper)
// ========================================

async function _fetchOrdersInRange(filters) {
    const client = getSupabaseClient();
    if (!client) return [];

    let q = client.from("orders").select("*").order("created_at", { ascending: false });
    if (filters?.from) q = q.gte("created_at", filters.from.toISOString());
    if (filters?.to) q = q.lte("created_at", filters.to.toISOString());

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

// ========================================
// 66. SALES REPORT
// ========================================

async function loadSalesReport() {
    const listEl = document.getElementById("salesOrdersList");
    const prodEl = document.getElementById("salesProductsList");
    if (listEl) listEl.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;
    if (prodEl) prodEl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;

    // ✅ تحديث ملخص الفلاتر
    updateSalesFilterSummary();

    try {
        const allOrders = await _fetchOrdersInRange(salesReportFilters);

        // ✅ فلترة أولية (استثناء الملغي والمرتجع نهائيًا)
        let filtered = allOrders.filter(o => !["cancelled", "refunded"].includes(o.status));

        // ✅ فلترة الحالة
        if (salesReportFilters.status && salesReportFilters.status !== "all") {
            filtered = filtered.filter(o => o.status === salesReportFilters.status);
        }

        // ✅ فلترة المحافظة
        if (salesReportFilters.governorate && salesReportFilters.governorate !== "all") {
            filtered = filtered.filter(o => o.governorate === salesReportFilters.governorate);
        }

        // ✅ فلترة العميل (اسم أو هاتف)
        if (salesReportFilters.customer) {
            const term = salesReportFilters.customer.toLowerCase();
            filtered = filtered.filter(o =>
                String(o.customer_name || "").toLowerCase().includes(term) ||
                String(o.customer_phone || "").includes(term)
            );
        }

        salesReportOrders = filtered;

        renderSalesKPIs();
        renderSalesOrdersTable();
        renderSalesProductsTable();
    } catch (err) {
        console.error("Sales Report Error:", err);
        if (listEl) listEl.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
        if (prodEl) prodEl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

// ✅ حساب الإجماليات
function _calcSalesTotals(orders) {
    let gross = 0, discount = 0, shipping = 0, total = 0, items = 0;

    orders.forEach(o => {
        const oItems = Array.isArray(o.items) ? o.items : [];
        const orderGross = oItems.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0);
        const orderDiscount = Number(o.discount_total || 0);
        const orderShipping = Number(o.shipping_cost || 0);

        gross += orderGross;
        discount += orderDiscount;
        shipping += orderShipping;
        total += orderGross - orderDiscount + orderShipping;

        items += oItems.reduce((s, i) => s + Number(i.quantity || 0), 0);
    });

    const net = gross - discount;

    return { gross, discount, net, shipping, total, items, orders: orders.length };
}

function renderSalesKPIs() {
    const t = _calcSalesTotals(salesReportOrders);

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

    set("salesKpiGross", t.gross.toLocaleString("en-US"));
    set("salesKpiDiscount", t.discount.toLocaleString("en-US"));
    set("salesKpiNet", t.net.toLocaleString("en-US"));
    set("salesKpiShipping", t.shipping.toLocaleString("en-US"));
    set("salesKpiTotal", t.total.toLocaleString("en-US"));
}

function renderSalesOrdersTable() {
    const listEl = document.getElementById("salesOrdersList");
    const totalsEl = document.getElementById("salesOrdersTotals");
    const countEl = document.getElementById("salesOrdersCount");

    if (!listEl) return;

    if (countEl) countEl.textContent = `${salesReportOrders.length} طلب`;

    if (!salesReportOrders.length) {
        listEl.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:35px;color:#64748b;">لا توجد طلبات</td></tr>`;
        if (totalsEl) totalsEl.innerHTML = "";
        return;
    }

    listEl.innerHTML = salesReportOrders.map((o, i) => {
        const items = Array.isArray(o.items) ? o.items : [];
        const gross = items.reduce((s, item) => s + Number(item.price || 0) * Number(item.quantity || 0), 0);
        const discount = Number(o.discount_total || 0);
        const net = gross - discount;
        const shipping = Number(o.shipping_cost || 0);
        const total = net + shipping;

        const discountCell = discount > 0
            ? `<div class="discount-cell"><span class="discount-amount">${discount.toLocaleString("en-US")}</span><button type="button" class="discount-view-btn" onclick="showDiscountDetails(${Number(o.id)})" title="تفاصيل الخصم"><i class="fa-solid fa-magnifying-glass"></i></button></div>`
            : `<span class="discount-amount zero">0</span>`;

        return `
            <tr>
                <td style="color:#94a3b8;font-weight:800;">${i + 1}</td>
                <td class="order-id-cell"><span>#</span>${escapeAdminHTML(o.id)}</td>
                <td class="customer-cell"><strong>${escapeAdminHTML(o.customer_name || "عميل")}</strong></td>
                <td style="font-size:12px;color:#64748b;">${escapeAdminHTML(o.governorate || "-")}</td>
                <td class="amount-cell">${gross.toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                <td>${discountCell}</td>
                <td class="amount-cell" style="color:#16a34a;">${net.toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                <td class="amount-cell" style="font-size:12px;color:#64748b;">${shipping === 0 ? "مجاني" : shipping.toLocaleString("en-US") + " ج.م"}</td>
                <td class="amount-cell" style="color:#2563eb;font-weight:800;">${total.toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                <td>
                    <button type="button" class="action-icon-btn preview" onclick="viewOrderDetails(${Number(o.id)})">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // ✅ صف الإجمالي
    if (totalsEl) {
        const t = _calcSalesTotals(salesReportOrders);
        totalsEl.innerHTML = `
            <tr>
                <td colspan="2" class="totals-label">الإجمالي: ${t.orders} طلب</td>
                <td colspan="2" class="totals-value">${t.items} قطعة</td>
                <td class="totals-value">${t.gross.toLocaleString("en-US")} ج</td>
                <td class="totals-value" style="color:#dc2626;">${t.discount.toLocaleString("en-US")} ج</td>
                <td class="totals-value" style="color:#16a34a;">${t.net.toLocaleString("en-US")} ج</td>
                <td class="totals-value">${t.shipping.toLocaleString("en-US")} ج</td>
                <td class="totals-value" style="color:#2563eb;">${t.total.toLocaleString("en-US")} ج</td>
                <td></td>
            </tr>
        `;
    }
}

// ✅ دالة المنتجات (نفس منطق التوزيع)
function renderSalesProductsTable() {
    const listEl = document.getElementById("salesProductsList");
    const totalsEl = document.getElementById("salesProductsTotals");
    const countEl = document.getElementById("salesProductsCount");

    if (!listEl) return;

    // ✅ نبني قائمة المنتجات مع توزيع الخصم
    const productMap = {};

    salesReportOrders.forEach(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const orderGross = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
        const orderDiscount = Number(o.discount_total || 0);

        items.forEach(item => {
            const key = String(item.id ?? item.name ?? "unknown");
            const qty = Number(item.quantity || 1);
            const price = Number(item.price || 0);
            const before = qty * price;

            // ✅ توزيع الخصم بنسبة القيمة
            let discountShare = 0;
            if (orderDiscount > 0 && orderGross > 0) {
                discountShare = (before / orderGross) * orderDiscount;
            }

            if (!productMap[key]) {
                productMap[key] = {
                    id: item.id,
                    name: item.name || "منتج",
                    image: item.image || "",
                    qty: 0,
                    before: 0,
                    discount: 0
                };
            }

            productMap[key].qty += qty;
            productMap[key].before += before;
            productMap[key].discount += discountShare;
        });
    });

    const list = Object.values(productMap).sort((a, b) => b.before - a.before);

    if (countEl) {
        const totalQty = list.reduce((s, p) => s + p.qty, 0);
        countEl.textContent = `${totalQty} قطعة`;
    }

    if (!list.length) {
        listEl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:35px;color:#64748b;">لا توجد منتجات</td></tr>`;
        if (totalsEl) totalsEl.innerHTML = "";
        return;
    }

    listEl.innerHTML = list.map((p, i) => {
        const net = p.before - p.discount;
        const discountCell = p.discount > 0
            ? `<span class="discount-amount">${Math.round(p.discount).toLocaleString("en-US")}</span>`
            : `<span class="discount-amount zero">0</span>`;

        return `
            <tr>
                <td style="color:#94a3b8;font-weight:800;">${i + 1}</td>
                <td>
                    ${p.image
                        ? `<img src="${escapeAdminHTML(p.image)}" style="width:45px;height:45px;border-radius:10px;object-fit:cover;">`
                        : `<div style="width:45px;height:45px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fa-solid fa-image"></i></div>`
                    }
                </td>
                <td><strong>${escapeAdminHTML(p.name)}</strong></td>
                <td style="text-align:center;font-weight:800;color:#8b5cf6;font-size:15px;">${p.qty}</td>
                <td class="amount-cell">${Math.round(p.before).toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                <td>${discountCell}</td>
                <td class="amount-cell" style="color:#16a34a;font-weight:800;">${Math.round(net).toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                <td>
                    <button type="button" class="action-icon-btn preview" onclick="showProductSalesDetails('${escapeAdminHTML(p.id)}')" title="تفاصيل">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // ✅ صف الإجمالي
    if (totalsEl) {
        const totalQty = list.reduce((s, p) => s + p.qty, 0);
        const totalBefore = list.reduce((s, p) => s + p.before, 0);
        const totalDiscount = list.reduce((s, p) => s + p.discount, 0);
        const totalNet = totalBefore - totalDiscount;

        totalsEl.innerHTML = `
            <tr>
                <td colspan="3" class="totals-label">الإجمالي: ${list.length} منتج</td>
                <td class="totals-value">${totalQty} قطعة</td>
                <td class="totals-value">${Math.round(totalBefore).toLocaleString("en-US")} ج</td>
                <td class="totals-value" style="color:#dc2626;">${Math.round(totalDiscount).toLocaleString("en-US")} ج</td>
                <td class="totals-value" style="color:#16a34a;">${Math.round(totalNet).toLocaleString("en-US")} ج</td>
                <td></td>
            </tr>
        `;
    }
}

function exportSalesCSV() {
    if (!salesReportOrders.length) {
        alert("لا توجد بيانات");
        return;
    }

    const headers = [
        "Order ID",
        "Date",
        "Customer",
        "Phone",
        "Governorate",
        "City",
        "Address",
        "Payment",
        "Status",
        "Items",
        "Subtotal",
        "Shipping",
        "Total"
    ];

    const rows = salesReportOrders.map(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const itemsCount = items.reduce((s, i) => s + Number(i.quantity || 0), 0);

        // ✅ الإجمالي بيتحسب صح حتى للطلبات القديمة
        const total = Number(o.total_amount || 0);
        const shipping = Number(o.shipping_cost || 0);
        const subtotal = Number(o.subtotal || 0) || (total - shipping);

        return [
            o.id,
            formatDateForCSV(o.created_at),
            o.customer_name || "",
            o.customer_phone || "",
            o.governorate || "",
            o.city || "",
            (o.customer_address || "").replace(/\n/g, " ").replace(/\r/g, ""),
            o.payment_method === "instapay" ? "InstaPay" : "كاش",
            getStatusLabelArabic(o.status),
            itemsCount,
            subtotal,
            shipping,
            total
        ];
    });

    downloadCSV([headers, ...rows], `step-sales-${Date.now()}.csv`);
}

// ========================================
// 67. DAILY REPORT
// ========================================

async function loadDailyReport() {
    const el = document.getElementById("dailyList");
    const totalsEl = document.getElementById("dailyTotals");
    if (el) el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;
    if (totalsEl) totalsEl.innerHTML = "";

    try {
        const allOrders = await _fetchOrdersInRange(dailyReportFilters);

        // ✅ نستثني الملغية والمرتجعة نهائيًا
        const orders = allOrders.filter(o => 
            !["cancelled", "refunded"].includes(o.status)
        );

        // ✅ تجميع حسب اليوم
        const map = {};
        orders.forEach(o => {
            const d = new Date(o.created_at);
            const key = d.toISOString().slice(0, 10);

            if (!map[key]) {
                map[key] = {
                    date: key,
                    orders: 0,
                    gross: 0,
                    discount: 0,
                    net: 0,
                    shipping: 0,
                    total: 0
                };
            }

            const items = Array.isArray(o.items) ? o.items : [];
            const orderGross = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
            const orderDiscount = Number(o.discount_total || 0);
            const orderShipping = Number(o.shipping_cost || 0);
            const orderNet = orderGross - orderDiscount;
            const orderTotal = orderNet + orderShipping;

            map[key].orders++;
            map[key].gross += orderGross;
            map[key].discount += orderDiscount;
            map[key].net += orderNet;
            map[key].shipping += orderShipping;
            map[key].total += orderTotal;
        });

        const list = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));

        // ✅ الإجماليات الكلية
        const totals = {
            orders: list.reduce((s, d) => s + d.orders, 0),
            gross: list.reduce((s, d) => s + d.gross, 0),
            discount: list.reduce((s, d) => s + d.discount, 0),
            net: list.reduce((s, d) => s + d.net, 0),
            shipping: list.reduce((s, d) => s + d.shipping, 0),
            total: list.reduce((s, d) => s + d.total, 0)
        };

        // ✅ KPIs
        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set("dailyKpiGross", totals.gross.toLocaleString("en-US"));
        set("dailyKpiDiscount", totals.discount.toLocaleString("en-US"));
        set("dailyKpiNet", totals.net.toLocaleString("en-US"));
        set("dailyKpiShipping", totals.shipping.toLocaleString("en-US"));
        set("dailyKpiTotal", totals.total.toLocaleString("en-US"));

        if (!list.length) {
            if (el) el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:35px;color:#64748b;">لا توجد بيانات</td></tr>`;
            return;
        }

        // ✅ الجدول
        if (el) {
            el.innerHTML = list.map(d => {
                const dateObj = new Date(d.date);
                const dateStr = dateObj.toLocaleDateString("ar-EG-u-nu-latn", {
                    weekday: "long",
                    day: "numeric",
                    month: "short"
                });

                const discountCell = d.discount > 0
                    ? `<span style="color:#dc2626;font-weight:800;">${Math.round(d.discount).toLocaleString("en-US")}</span>`
                    : `<span style="color:#cbd5e1;">0</span>`;

                return `
                    <tr>
                        <td style="font-weight:700;color:#111;">${escapeAdminHTML(dateStr)}<div style="font-size:11px;color:#94a3b8;margin-top:3px;">${d.date}</div></td>
                        <td style="text-align:center;font-weight:800;color:#8b5cf6;">${d.orders}</td>
                        <td class="amount-cell">${Math.round(d.gross).toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                        <td>${discountCell}</td>
                        <td class="amount-cell" style="color:#16a34a;font-weight:800;">${Math.round(d.net).toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                        <td class="amount-cell" style="font-size:12px;color:#64748b;">${d.shipping === 0 ? "—" : Math.round(d.shipping).toLocaleString("en-US") + " ج.م"}</td>
                        <td class="amount-cell" style="color:#2563eb;font-weight:800;">${Math.round(d.total).toLocaleString("en-US")} <span class="currency">ج.م</span></td>
                    </tr>
                `;
            }).join("");
        }

        // ✅ صف الإجمالي
        if (totalsEl) {
            totalsEl.innerHTML = `
                <tr>
                    <td colspan="1" class="totals-label">الإجمالي: ${list.length} يوم</td>
                    <td class="totals-value" style="text-align:center;">${totals.orders} طلب</td>
                    <td class="totals-value">${Math.round(totals.gross).toLocaleString("en-US")} ج</td>
                    <td class="totals-value" style="color:#dc2626;">${Math.round(totals.discount).toLocaleString("en-US")} ج</td>
                    <td class="totals-value" style="color:#16a34a;">${Math.round(totals.net).toLocaleString("en-US")} ج</td>
                    <td class="totals-value">${Math.round(totals.shipping).toLocaleString("en-US")} ج</td>
                    <td class="totals-value" style="color:#2563eb;">${Math.round(totals.total).toLocaleString("en-US")} ج</td>
                </tr>
            `;
        }
    } catch (err) {
        console.error("Daily Report Error:", err);
        if (el) el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

// ========================================
// 68. GOVERNORATE REPORT
// ========================================

async function loadGovernorateReport() {
    const el = document.getElementById("govList");
    if (el) el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;

    try {
        const allOrders = await _fetchOrdersInRange(govReportFilters);

        // ✅ نستثني الملغية
        const orders = allOrders.filter(o => 
            !["cancelled", "refunded"].includes(o.status)
        );
        const map = {};
        orders.forEach(o => {
            const g = o.governorate || "غير محدد";
            if (!map[g]) map[g] = { gov: g, orders: 0, items: 0, revenue: 0 };
            map[g].orders++;
            map[g].revenue += Number(o.total_amount || 0);
            (Array.isArray(o.items) ? o.items : []).forEach(i => map[g].items += Number(i.quantity || 0));
        });
        const list = Object.values(map).sort((a, b) => b.revenue - a.revenue);
        const totalRev = list.reduce((s, x) => s + x.revenue, 0);

        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set("govKpiCount", list.length);
        set("govKpiTop", list[0]?.gov || "-");
        set("govKpiRevenue", totalRev.toLocaleString("en-US"));

        if (!list.length) { el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:35px;color:#64748b;">لا توجد بيانات</td></tr>`; return; }

        el.innerHTML = list.map((g, i) => {
            const pct = totalRev > 0 ? Math.round((g.revenue / totalRev) * 100) : 0;
            return `<tr><td style="font-weight:800;color:#94a3b8;">${i+1}</td><td><strong>${escapeAdminHTML(g.gov)}</strong></td><td style="text-align:center;font-weight:800;">${g.orders}</td><td style="text-align:center;font-weight:800;">${g.items}</td><td class="amount-cell">${g.revenue.toLocaleString("en-US")} <span class="currency">ج.م</span></td><td class="amount-cell" style="font-size:13px;color:#64748b;">${Math.round(g.revenue / g.orders).toLocaleString("en-US")} ج.م</td><td><div class="gov-bar"><div class="gov-bar-fill" style="width:${pct}%"></div></div><div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:700;">${pct}%</div></td></tr>`;
        }).join("");
    } catch (err) {
        if (el) el.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

function exportGovernorateCSV() {
    const rows = Array.from(document.querySelectorAll("#govList tr")).map(tr =>
        Array.from(tr.querySelectorAll("td")).map(td => td.innerText.trim())
    );
    if (!rows.length) { alert("لا توجد بيانات"); return; }
    downloadCSV([["#","Governorate","Orders","Items","Revenue","AOV","Percent"], ...rows], `step-governorate-${Date.now()}.csv`);
}

// ========================================
// 69. CUSTOMERS REPORT
// ========================================

async function loadCustomersReport() {
    const listEl = document.getElementById("customersList");
    if (listEl) listEl.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const [ordersRes, profilesRes] = await Promise.all([
            client.from("orders").select("*").order("created_at", { ascending: false }),
            client.from("customer_profiles").select("id, full_name, phone")
        ]);
        if (ordersRes.error) throw ordersRes.error;

        // ✅ نستثني الطلبات الملغية والمرتجعة نهائيًا
        const orders = (ordersRes.data || []).filter(o => 
            !["cancelled", "refunded"].includes(o.status)
        );
        const profiles = profilesRes.data || [];

        const byPhone = {}, byId = {};
        profiles.forEach(p => { if (p.phone) byPhone[String(p.phone)] = p; if (p.id) byId[String(p.id)] = p; });

        const map = new Map();
        orders.forEach(o => {
            const k = o.customer_id ? `id:${o.customer_id}` : `phone:${o.customer_phone || "unknown"}`;
            if (!map.has(k)) {
                const p = o.customer_id ? byId[String(o.customer_id)] : byPhone[String(o.customer_phone)];
                map.set(k, { key: k, name: p?.full_name || o.customer_name || "عميل", phone: p?.phone || o.customer_phone || "-", ordersCount: 0, totalSpent: 0, firstOrderAt: o.created_at, lastOrderAt: o.created_at, orders: [] });
            }
            const c = map.get(k);
            c.ordersCount++;
            c.totalSpent += Number(o.total_amount || 0);
            c.orders.push(o);
            if (new Date(o.created_at) < new Date(c.firstOrderAt)) c.firstOrderAt = o.created_at;
            if (new Date(o.created_at) > new Date(c.lastOrderAt)) c.lastOrderAt = o.created_at;
        });

        customersReportRaw = Array.from(map.values());

        const sorted = [...customersReportRaw].sort((a, b) => b.totalSpent - a.totalSpent);
        const vipCount = Math.max(1, Math.ceil(sorted.length * 0.2));
        const vipKeys = new Set(sorted.slice(0, vipCount).filter(c => c.ordersCount >= 2).map(c => c.key));
        customersReportRaw.forEach(c => {
            c.isVIP = vipKeys.has(c.key);
            c.type = c.ordersCount === 1 ? "new" : "repeat";
        });

        renderCustomersKPIs();
        renderCustomersTable();
    } catch (err) {
        console.error(err);
        if (listEl) listEl.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

function renderCustomersKPIs() {
    const c = customersReportRaw;
    const total = c.length;
    const totalSpent = c.reduce((s, x) => s + x.totalSpent, 0);
    const ltv = total > 0 ? totalSpent / total : 0;
    const newCount = c.filter(x => x.type === "new").length;
    const repeat = c.filter(x => x.type === "repeat").length;
    const rr = total > 0 ? Math.round((repeat / total) * 100) : 0;
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("customersKpiTotal", total.toLocaleString("en-US"));
    set("customersKpiLTV", Math.round(ltv).toLocaleString("en-US"));
    set("customersKpiNew", newCount.toLocaleString("en-US"));
    set("customersKpiRepeatRate", `${rr}%`);
}

function setCustomerType(type, btnEl) {
    customersReportFilters.type = type;
    document.querySelectorAll(".customer-type-chips .preset-chip").forEach(b => b.classList.toggle("active", b.dataset.type === type));
    renderCustomersTable();
}

function renderCustomersTable() {
    const listEl = document.getElementById("customersList");
    const countEl = document.getElementById("customersCount");
    if (!listEl) return;

    let list = [...customersReportRaw];
    const t = customersReportFilters.type;
    if (t === "vip") list = list.filter(c => c.isVIP);
    else if (t === "new") list = list.filter(c => c.type === "new");
    else if (t === "repeat") list = list.filter(c => c.type === "repeat");

    const s = (customersReportFilters.search || "").trim().toLowerCase();
    if (s) list = list.filter(c => String(c.name).toLowerCase().includes(s) || String(c.phone).toLowerCase().includes(s));

    const sort = customersReportFilters.sort;
    list.sort((a, b) => {
        if (sort === "spent_desc") return b.totalSpent - a.totalSpent;
        if (sort === "orders_desc") return b.ordersCount - a.ordersCount;
        if (sort === "recent") return new Date(b.lastOrderAt) - new Date(a.lastOrderAt);
        if (sort === "name") return String(a.name).localeCompare(String(b.name), "ar");
        return 0;
    });

    if (countEl) countEl.textContent = `${list.length} عميل`;
    if (!list.length) { listEl.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:35px;color:#64748b;">لا يوجد عملاء مطابقين</td></tr>`; return; }

    listEl.innerHTML = list.map((c, i) => {
        const aov = c.ordersCount > 0 ? c.totalSpent / c.ordersCount : 0;
        const tb = c.type === "new" ? `<span class="type-badge new"><i class="fa-solid fa-user-plus"></i> جديد</span>` : `<span class="type-badge repeat"><i class="fa-solid fa-repeat"></i> متكرر</span>`;
        const vb = c.isVIP ? `<span class="vip-badge"><i class="fa-solid fa-crown"></i> VIP</span>` : "";
        return `<tr><td style="font-weight:800;color:#94a3b8;">${i+1}</td><td><div class="customer-cell-modern"><strong>${escapeAdminHTML(c.name)}</strong><small>${c.ordersCount} طلب</small>${vb}</div></td><td class="phone-cell"><div class="phone" style="direction:ltr;justify-content:flex-end;">${escapeAdminHTML(c.phone)}</div></td><td style="text-align:center;font-weight:800;font-size:15px;">${c.ordersCount}</td><td class="amount-cell">${c.totalSpent.toLocaleString("en-US")} <span class="currency">ج.م</span></td><td class="amount-cell" style="font-size:13px;color:#64748b;">${Math.round(aov).toLocaleString("en-US")} ج.م</td><td class="date-cell">${formatDate(c.lastOrderAt)}</td><td>${tb}</td><td><button type="button" class="action-icon-btn preview" onclick="showCustomerDetails('${escapeAdminHTML(c.key)}')"><i class="fa-solid fa-eye"></i></button></td></tr>`;
    }).join("");
}

function showCustomerDetails(key) {
    const c = customersReportRaw.find(x => x.key === key);
    if (!c || !orderModal || !orderModalDetails) return;

    const ordersHTML = c.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(o => {
        const pm = (o.payment_method || "unknown").toLowerCase();
        const m = PAYMENT_METHODS_META[pm] || PAYMENT_METHODS_META.unknown;
        const cls = pm === "cash" ? "cash" : pm === "instapay" ? "instapay" : "unknown";
        return `<div class="order-detail-item" style="cursor:pointer;" onclick="viewOrderDetails(${Number(o.id)})"><div class="order-detail-info"><h4>طلب #${escapeAdminHTML(o.id)}</h4><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">${getStatusBadge(o.status)}<span class="payment-badge ${cls}"><i class="fa-solid ${m.icon}"></i> ${escapeAdminHTML(m.text)}</span></div><div style="font-size:12px;color:#64748b;margin-top:8px;">${formatDate(o.created_at)}</div></div><div class="order-detail-price">${Number(o.total_amount || 0).toLocaleString("en-US")} ج</div></div>`;
    }).join("");

    const aov = c.ordersCount > 0 ? c.totalSpent / c.ordersCount : 0;
    orderModalDetails.innerHTML = `<h3 style="margin-bottom:14px;"><i class="fa-solid fa-user"></i> ملف العميل</h3><div style="background:#f8fafc;padding:16px;border-radius:12px;margin-bottom:18px;line-height:1.9;"><div><strong>الاسم:</strong> ${escapeAdminHTML(c.name)}</div><div><strong>الهاتف:</strong> <span style="direction:ltr;display:inline-block;">${escapeAdminHTML(c.phone)}</span></div><div><strong>عدد الطلبات:</strong> ${c.ordersCount}</div><div><strong>إجمالي الشراء:</strong> <span style="color:#16a34a;font-weight:800;">${c.totalSpent.toLocaleString("en-US")} ج.م</span></div><div><strong>متوسط الطلب:</strong> ${Math.round(aov).toLocaleString("en-US")} ج.م</div><div><strong>أول طلب:</strong> ${formatDate(c.firstOrderAt)}</div><div><strong>آخر طلب:</strong> ${formatDate(c.lastOrderAt)}</div>${c.isVIP ? `<div style="margin-top:8px;"><span class="vip-badge"><i class="fa-solid fa-crown"></i> عميل VIP</span></div>` : ""}</div><h4 style="margin-bottom:10px;"><i class="fa-solid fa-box"></i> سجل الطلبات (${c.ordersCount})</h4>${ordersHTML}`;
    orderModal.classList.add("open");
}

function exportCustomersCSV() {
    if (!customersReportRaw.length) { alert("لا توجد بيانات"); return; }
    let list = [...customersReportRaw];
    const t = customersReportFilters.type;
    if (t === "vip") list = list.filter(c => c.isVIP);
    else if (t === "new") list = list.filter(c => c.type === "new");
    else if (t === "repeat") list = list.filter(c => c.type === "repeat");
    const s = (customersReportFilters.search || "").trim().toLowerCase();
    if (s) list = list.filter(c => String(c.name).toLowerCase().includes(s) || String(c.phone).toLowerCase().includes(s));
    const headers = [
        "Customer Name",
        "Phone",
        "Orders Count",
        "Total Spent",
        "AOV",
        "First Order",
        "Last Order",
        "Type",
        "VIP"
    ];

    const rows = list.map(c => {
        const aov = c.ordersCount > 0 ? c.totalSpent / c.ordersCount : 0;
        return [
            c.name || "",
            c.phone || "",
            c.ordersCount,
            c.totalSpent,
            Math.round(aov),
            formatDateForCSV(c.firstOrderAt),
            formatDateForCSV(c.lastOrderAt),
            c.type === "new" ? "جديد" : "متكرر",
            c.isVIP ? "نعم" : "لا"
        ];
    });

    downloadCSV([headers, ...rows], `step-customers-${Date.now()}.csv`);
}

// ========================================
// 70. PRODUCTS PERFORMANCE
// ========================================

async function loadProductsReport() {
    const listEl = document.getElementById("productsReportList");
    if (listEl) listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;

    try {
        const allOrders = await _fetchOrdersInRange(prodReportFilters);

        // ✅ نستثني الملغية
        const orders = allOrders.filter(o => 
            !["cancelled", "refunded"].includes(o.status)
        );
        const map = {};
        orders.forEach(o => (Array.isArray(o.items) ? o.items : []).forEach(item => {
            const k = String(item.id ?? item.name);
            if (!map[k]) {
                const product = adminProducts.find(p => Number(p.id) === Number(item.id));
                map[k] = {
                    id: item.id, name: item.name || "منتج", image: item.image || "",
                    quantity: 0, revenue: 0,
                    stock: product ? getAvailableStock(product) : null
                };
            }
            map[k].quantity += Number(item.quantity || 1);
            map[k].revenue += Number(item.quantity || 1) * Number(item.price || 0);
        }));

        const list = Object.values(map).sort((a, b) => b.revenue - a.revenue);
        productsReportData = list;

        const totalItems = list.reduce((s, p) => s + p.quantity, 0);
        const totalRev = list.reduce((s, p) => s + p.revenue, 0);

        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set("prodKpiTotal", list.length);
        set("prodKpiItems", totalItems.toLocaleString("en-US"));
        set("prodKpiRevenue", totalRev.toLocaleString("en-US"));
        set("prodKpiTop", list[0]?.name || "-");

        if (!list.length) { listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:35px;color:#64748b;">لا توجد مبيعات</td></tr>`; return; }

        listEl.innerHTML = list.map((p, i) => {
            let stockBadge = "-";
            if (p.stock !== null) {
                const cls = p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "good";
                stockBadge = `<span class="stock-pill ${cls}">${p.stock}</span>`;
            }
            return `<tr><td style="font-weight:800;color:#94a3b8;">${i+1}</td><td>${p.image ? `<img src="${escapeAdminHTML(p.image)}" style="width:45px;height:45px;border-radius:10px;object-fit:cover;">` : `<div style="width:45px;height:45px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fa-solid fa-image"></i></div>`}</td><td><strong>${escapeAdminHTML(p.name)}</strong></td><td style="text-align:center;font-weight:800;color:#8b5cf6;font-size:15px;">${p.quantity}</td><td class="amount-cell">${p.revenue.toLocaleString("en-US")} <span class="currency">ج.م</span></td><td style="text-align:center;">${stockBadge}</td><td><span style="font-size:12px;color:#16a34a;font-weight:800;">مبيع</span></td></tr>`;
        }).join("");
    } catch (err) {
        if (listEl) listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

function exportProductsCSV() {
    if (!productsReportData.length) { alert("لا توجد بيانات"); return; }
    const headers = ["#","Product","Qty Sold","Revenue","Stock"];
    const rows = productsReportData.map((p, i) => [
        i + 1,
        p.name || "",
        p.quantity,
        p.revenue,
        p.stock ?? "-"
    ]);
    downloadCSV([headers, ...rows], `step-products-${Date.now()}.csv`);
}

// ========================================
// 71. INVENTORY MOVEMENTS REPORT
// ========================================

async function loadInventoryReport() {
    const listEl = document.getElementById("inventoryReportList");
    if (listEl) listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { data, error } = await client.from("inventory_movements").select("*").order("created_at", { ascending: false }).limit(500);
        if (error) throw error;
        inventoryReportData = data || [];
        renderInventoryReport();
    } catch (err) {
        if (listEl) listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

function renderInventoryReport() {
    const listEl = document.getElementById("inventoryReportList");
    if (!listEl) return;

    let list = [...inventoryReportData];
    const t = document.getElementById("invReportType")?.value || "all";

    // ✅ فلتر نوع الحركة
    if (t !== "all") {
        list = list.filter(m => m.movement_type === t);
    }

    // ✅ فلتر المنتج المختار من الـ Picker
    if (selectedPickerProductId !== null) {
        list = list.filter(m => 
            Number(m.product_id) === Number(selectedPickerProductId)
        );
    }

    const totalIn = list.filter(m => Number(m.quantity) > 0).reduce((s, m) => s + Number(m.quantity), 0);
    const totalOut = list.filter(m => Number(m.quantity) < 0).reduce((s, m) => s + Math.abs(Number(m.quantity)), 0);

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("invReportKpiTotal", list.length.toLocaleString("en-US"));
    set("invReportKpiIn", totalIn.toLocaleString("en-US"));
    set("invReportKpiOut", totalOut.toLocaleString("en-US"));

    if (!list.length) { listEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:35px;color:#64748b;">لا توجد حركات</td></tr>`; return; }

    const typeLabels = { purchase: "شراء", sale: "بيع", damage: "تلف", adjustment: "تسوية", initial: "رصيد افتتاحي", return: "مرتجع" };
    const typeColors = {
        purchase: { bg: "#dcfce7", color: "#16a34a" },
        sale: { bg: "#dbeafe", color: "#2563eb" },
        damage: { bg: "#fee2e2", color: "#dc2626" },
        adjustment: { bg: "#fef3c7", color: "#d97706" },
        initial: { bg: "#f3e8ff", color: "#8b5cf6" },
        return: { bg: "#fed7aa", color: "#c2410c" }
    };

    listEl.innerHTML = list.map(m => {
        const p = adminProducts.find(x => Number(x.id) === Number(m.product_id));
        const c = typeColors[m.movement_type] || { bg: "#f1f5f9", color: "#64748b" };
        const qty = Number(m.quantity);
        const sign = qty > 0 ? "+" : "";
        const qtyColor = qty > 0 ? "#16a34a" : "#dc2626";
        return `<tr><td class="date-cell">${formatDate(m.created_at)}</td><td><strong>${escapeAdminHTML(p?.name || "منتج محذوف")}</strong></td><td><span style="display:inline-block;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:800;background:${c.bg};color:${c.color};">${escapeAdminHTML(typeLabels[m.movement_type] || m.movement_type)}</span></td><td style="font-weight:800;color:${qtyColor};font-size:15px;">${sign}${qty}</td><td style="font-weight:800;">${m.new_stock ?? "-"}</td><td style="font-size:12px;color:#475569;">${escapeAdminHTML(m.reason || "-")}</td><td style="font-size:12px;color:#94a3b8;">${escapeAdminHTML(m.performed_by_username || "system")}</td></tr>`;
    }).join("");
}

function exportInventoryCSV() {
    if (!inventoryReportData.length) {
        alert("لا توجد بيانات");
        return;
    }

    const typeLabels = {
        purchase: "شراء",
        sale: "بيع",
        damage: "تلف",
        adjustment: "تسوية",
        initial: "رصيد افتتاحي",
        return: "مرتجع"
    };

    const headers = [
        "Date",
        "Product",
        "Type",
        "Change",
        "New Stock",
        "Reason",
        "By"
    ];

    const rows = inventoryReportData.map(m => {
        const p = adminProducts.find(x => Number(x.id) === Number(m.product_id));
        return [
            formatDateForCSV(m.created_at),
            p?.name || "منتج محذوف",
            typeLabels[m.movement_type] || m.movement_type || "",
            Number(m.quantity || 0),
            Number(m.new_stock || 0),
            m.reason || "",
            m.performed_by_username || "system"
        ];
    });

    downloadCSV([headers, ...rows], `step-inventory-${Date.now()}.csv`);
}
// ========================================
// 72. STATUS REPORT
// ========================================

async function loadStatusReport() {
    const el = document.getElementById("statusFullBreakdown");
    if (el) el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    try {
        const orders = await _fetchOrdersInRange(statusReportFilters);
        const map = {};
        orders.forEach(o => { const s = o.status || "unknown"; map[s] = (map[s] || 0) + 1; });

        const total = orders.length;
        const delivered = orders.filter(o => o.status === "delivered").length;
        const cancelled = orders.filter(o => o.status === "cancelled").length;
        const active = orders.filter(o => ["pending","preparing","shipped"].includes(o.status)).length;

        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set("statusKpiTotal", total);
        set("statusKpiDelivered", delivered);
        set("statusKpiActive", active);
        set("statusKpiCancelled", cancelled);

        const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
        if (!entries.length) { el.innerHTML = `<div class="empty-state"><p>لا توجد بيانات</p></div>`; return; }

        el.innerHTML = entries.map(([s, c]) => {
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            return `<div class="breakdown-item"><div style="flex:1;display:flex;align-items:center;gap:12px;">${getStatusBadge(s)}<div style="font-size:12px;color:#64748b;font-weight:700;">${pct}%</div></div><div class="breakdown-value">${c} طلب</div></div>`;
        }).join("");
    } catch (err) {
        if (el) el.innerHTML = `<div class="empty-state" style="color:#dc2626;"><p>حدث خطأ: ${escapeAdminHTML(err.message)}</p></div>`;
    }
}

// ========================================
// 73. EXCHANGE / RETURN REPORT
// ========================================

async function loadExchangeReport() {
    const listEl = document.getElementById("exchangeList");
    if (listEl) listEl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">جاري التحميل...</td></tr>`;

    try {
        const orders = await _fetchOrdersInRange(exchangeReportFilters);
        const relevant = orders.filter(o => ["return_requested","return_received","refunded","exchange_requested","exchange_received","exchange_shipped","exchanged"].includes(o.status));
        exchangeReportData = relevant;

        const returns = relevant.filter(o => o.status.startsWith("return")).length;
        const exchanges = relevant.filter(o => o.status.startsWith("exchange")).length;
        const completed = relevant.filter(o => ["refunded","exchanged"].includes(o.status)).length;
        const value = relevant.reduce((s, o) => s + Number(o.total_amount || 0), 0);

        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set("exchKpiReturns", returns);
        set("exchKpiExchanges", exchanges);
        set("exchKpiCompleted", completed);
        set("exchKpiValue", value.toLocaleString("en-US"));

        if (!relevant.length) { listEl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:35px;color:#64748b;">لا توجد طلبات استبدال أو استرجاع</td></tr>`; return; }

        listEl.innerHTML = relevant.map(o => {
            const reason = o.return_reason || o.exchange_reason || "-";
            return `<tr><td class="order-id-cell"><span>#</span>${escapeAdminHTML(o.id)}</td><td class="customer-cell"><strong>${escapeAdminHTML(o.customer_name || "عميل")}</strong></td><td class="phone-cell"><div class="phone" style="direction:ltr;justify-content:flex-end;">${escapeAdminHTML(o.customer_phone || "-")}</div></td><td class="date-cell">${formatDate(o.created_at)}</td><td>${getStatusBadge(o.status)}</td><td class="amount-cell">${Number(o.total_amount || 0).toLocaleString("en-US")} <span class="currency">ج.م</span></td><td style="font-size:12px;color:#475569;">${escapeAdminHTML(reason)}</td><td><button type="button" class="action-icon-btn preview" onclick="viewOrderDetails(${Number(o.id)})"><i class="fa-solid fa-eye"></i></button></td></tr>`;
        }).join("");
    } catch (err) {
        if (listEl) listEl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#dc2626;font-weight:700;">حدث خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
}

// ========================================
// 74. CSV HELPER
// ========================================

function formatDateForCSV(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ✅ خريطة تحويل حالات الطلبات للعربي
function getStatusLabelArabic(status) {
    const map = {
        pending: "جديدة",
        preparing: "قيد التحضير",
        shipped: "تم الشحن",
        delivered: "تم التوصيل",
        return_requested: "طلب استرجاع",
        return_received: "تم استلام المنتج للاسترجاع",
        returned: "تم الاسترجاع",
        refunded: "تم رد المبلغ",
        exchange_requested: "طلب استبدال",
        exchange_received: "تم استلام المنتج للاستبدال",
        exchange_shipped: "تم شحن البديل",
        exchanged: "تم الاستبدال",
        cancelled: "ملغى"
    };
    return map[status] || status || "";
}

function downloadCSV(rows, filename) {
    // ✅ Excel في المنطقة العربية بيستخدم ; كفاصل افتراضي
    const SEP = ";";

    const escapeCell = (cell, colIndex, headers) => {
        if (cell == null) return "";
        let v = String(cell);

        // ✅ لو رقم موبايل → نستخدم صيغة ="" عشان Excel يخليه نص بدون Tab
        if (/^0\d{9,}$/.test(v)) {
            return `"=""${v}"""`;
        }

        if (
            v.includes(SEP) ||
            v.includes('"') ||
            v.includes("\n") ||
            v.includes("\r")
        ) {
            return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
    };

    const headers = rows[0] || [];

    const csv = rows
        .map(row => row.map((cell, i) => escapeCell(cell, i, headers)).join(SEP))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("تم تصدير الملف ✅");
}

// ========================================
// 75. WIRE INPUTS
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const s = document.getElementById("customersSearchInput");
    if (s) {
        let t;
        s.addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { customersReportFilters.search = e.target.value; renderCustomersTable(); }, 250); });
    }
    const so = document.getElementById("customersSortSelect");
    if (so) so.addEventListener("change", e => { customersReportFilters.sort = e.target.value; renderCustomersTable(); });

    // ✅ نوع الحركة
    const it = document.getElementById("invReportType");
    if (it) it.addEventListener("change", renderInventoryReport);

    // ✅ بحث المنتج في الـ Picker (SKU)
    const pickerSku = document.getElementById("pickerSearchSku");
    if (pickerSku) {
        let t;
        pickerSku.addEventListener("input", e => {
            clearTimeout(t);
            t = setTimeout(() => {
                renderProductPickerList(e.target.value, document.getElementById("pickerSearchName")?.value || "");
            }, 200);
        });
    }

    // ✅ بحث المنتج في الـ Picker (Name)
    const pickerName = document.getElementById("pickerSearchName");
    if (pickerName) {
        let t;
        pickerName.addEventListener("input", e => {
            clearTimeout(t);
            t = setTimeout(() => {
                renderProductPickerList(document.getElementById("pickerSearchSku")?.value || "", e.target.value);
            }, 200);
        });
    }
});

// ========================================
// 76. GLOBAL EXPORTS
// ========================================

window.openReport = openReport;
window.backToReportsHome = backToReportsHome;
window.setGovPreset = setGovPreset;
window.setProdPreset = setProdPreset;
window.setStatusPreset = setStatusPreset;
window.setExchangePreset = setExchangePreset;
window.exportSalesCSV = exportSalesCSV;
window.exportCustomersCSV = exportCustomersCSV;
window.exportGovernorateCSV = exportGovernorateCSV;
window.exportProductsCSV = exportProductsCSV;
window.exportInventoryCSV = exportInventoryCSV;
window.setCustomerType = setCustomerType;
window.showCustomerDetails = showCustomerDetails;
window.loadDailyReport = loadDailyReport;
window.loadGovernorateReport = loadGovernorateReport;
window.loadProductsReport = loadProductsReport;
window.loadInventoryReport = loadInventoryReport;
window.loadStatusReport = loadStatusReport;
window.loadExchangeReport = loadExchangeReport;

// ========================================
// 77. PRODUCT IMAGE UPLOAD
// ========================================

const SUPABASE_STORAGE_BUCKET = "product-images";

function setupImageUploads() {
    setupOneImageUpload({
        zoneId: "addImageZone",
        fileId: "addImageFile",
        emptyId: "addImageEmpty",
        previewId: "addImagePreview",
        previewImgId: "addImagePreviewImg",
        loadingId: "addImageLoading",
        urlInputId: "imageUrl"
    });

    setupOneImageUpload({
        zoneId: "editImageZone",
        fileId: "editImageFile",
        emptyId: "editImageEmpty",
        previewId: "editImagePreview",
        previewImgId: "editImagePreviewImg",
        loadingId: "editImageLoading",
        urlInputId: "editImageUrl"
    });

    // ✅ تهيئة رفع الصور المتعددة
    setupMultiImageUploads();
}

function setupOneImageUpload(config) {
    const zone = document.getElementById(config.zoneId);
    const fileInput = document.getElementById(config.fileId);
    const urlInput = document.getElementById(config.urlInputId);

    if (!zone || !fileInput) return;

    // ✅ ضغط على المنطقة → فتح نافذة اختيار الملف
    zone.addEventListener("click", (e) => {
        if (e.target.closest(".image-remove-btn")) return;
        fileInput.click();
    });

    // ✅ اختيار ملف
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) uploadProductImage(file, config);
    });

    // ✅ سحب وإفلات
    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("dragover");
    });
    zone.addEventListener("dragleave", () => {
        zone.classList.remove("dragover");
    });
    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("dragover");
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            uploadProductImage(file, config);
        }
    });

    // ✅ لو المستخدم لصق رابط في الـ input
    urlInput?.addEventListener("input", () => {
        const url = urlInput.value.trim();
        if (url) {
            showImagePreview(url, config);
        } else {
            hideImagePreview(config);
        }
    });
}

async function uploadProductImage(file, config) {
    // ✅ التحقق
    if (!file.type.startsWith("image/")) {
        alert("الملف المختار ليس صورة");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة أكبر من 5 ميجا");
        return;
    }

    const client = getSupabaseClient();
    if (!client) return;

    const emptyEl = document.getElementById(config.emptyId);
    const previewEl = document.getElementById(config.previewId);
    const loadingEl = document.getElementById(config.loadingId);

    // ✅ إظهار حالة التحميل
    if (emptyEl) emptyEl.style.display = "none";
    if (previewEl) previewEl.style.display = "none";
    if (loadingEl) loadingEl.style.display = "flex";

    try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `products/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;

        const { data, error } = await client.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(filename, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = client.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(data.path);

        const publicUrl = urlData.publicUrl;

        // ✅ حفظ الرابط في الـ input
        const urlInput = document.getElementById(config.urlInputId);
        if (urlInput) urlInput.value = publicUrl;

        // ✅ عرض المعاينة
        showImagePreview(publicUrl, config);

        showToast("تم رفع الصورة ✅");

    } catch (err) {
        console.error("Upload error:", err);
        alert("فشل رفع الصورة:\n\n" + (err.message || "خطأ غير متوقع"));
        if (emptyEl) emptyEl.style.display = "flex";
    } finally {
        if (loadingEl) loadingEl.style.display = "none";
    }
}

function showImagePreview(url, config) {
    const emptyEl = document.getElementById(config.emptyId);
    const previewEl = document.getElementById(config.previewId);
    const previewImg = document.getElementById(config.previewImgId);

    if (emptyEl) emptyEl.style.display = "none";
    if (previewEl) previewEl.style.display = "flex";
    if (previewImg) previewImg.src = url;
}

function hideImagePreview(config) {
    const emptyEl = document.getElementById(config.emptyId);
    const previewEl = document.getElementById(config.previewId);

    if (emptyEl) emptyEl.style.display = "flex";
    if (previewEl) previewEl.style.display = "none";
}

function clearImageUpload(mode) {
    const map = {
        add: {
            emptyId: "addImageEmpty",
            previewId: "addImagePreview",
            previewImgId: "addImagePreviewImg",
            urlInputId: "imageUrl",
            fileId: "addImageFile"
        },
        edit: {
            emptyId: "editImageEmpty",
            previewId: "editImagePreview",
            previewImgId: "editImagePreviewImg",
            urlInputId: "editImageUrl",
            fileId: "editImageFile"
        }
    };

    const config = map[mode];
    if (!config) return;

    const urlInput = document.getElementById(config.urlInputId);
    if (urlInput) urlInput.value = "";

    const fileInput = document.getElementById(config.fileId);
    if (fileInput) fileInput.value = "";

    const previewImg = document.getElementById(config.previewImgId);
    if (previewImg) previewImg.src = "";

    hideImagePreview(config);
}

// ✅ Global exports
window.clearImageUpload = clearImageUpload;

// ========================================
// 78. MULTI IMAGE UPLOAD
// ========================================

let addImagesList = [];
let editImagesList = [];

const MAX_MULTI_IMAGES = 5;

function setupMultiImageUploads() {
    setupMultiImageInput("addImagesFile", "add");
    setupMultiImageInput("editImagesFile", "edit");
}

function setupMultiImageInput(fileInputId, mode) {
    const input = document.getElementById(fileInputId);
    if (!input) return;

    input.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        input.value = "";
        await uploadMultipleImages(files, mode);
    });
}

async function uploadMultipleImages(files, mode) {
    const list = mode === "edit" ? editImagesList : addImagesList;
    const remaining = MAX_MULTI_IMAGES - list.length;

    if (remaining <= 0) {
        alert(`الحد الأقصى ${MAX_MULTI_IMAGES} صور إضافية`);
        return;
    }

    const filesToUpload = files.slice(0, remaining);

    if (files.length > remaining) {
        alert(`هيتم رفع ${remaining} صور بس (الحد الأقصى ${MAX_MULTI_IMAGES})`);
    }

    const client = getSupabaseClient();
    if (!client) return;

    for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
            alert(`الملف "${file.name}" ليس صورة`);
            continue;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(`الصورة "${file.name}" أكبر من 5 ميجا`);
            continue;
        }

        // ✅ نضيف placeholder
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        list.push({ tempId, uploading: true });
        renderMultiImageGrid(mode);

        try {
            const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
            const filename = `products/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;

            const { data, error } = await client.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .upload(filename, file, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (error) throw error;

            const { data: urlData } = client.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .getPublicUrl(data.path);

            // ✅ نستبدل الـ placeholder بالرابط الحقيقي
            const idx = list.findIndex((x) => x.tempId === tempId);
            if (idx !== -1) {
                list[idx] = urlData.publicUrl;
            }

        } catch (err) {
            console.error("Upload error:", err);
            alert(`فشل رفع "${file.name}": ${err.message || "خطأ"}`);
            const idx = list.findIndex((x) => x.tempId === tempId);
            if (idx !== -1) list.splice(idx, 1);
        }

        renderMultiImageGrid(mode);
    }

    showToast("تم رفع الصور ✅");
}

function renderMultiImageGrid(mode) {
    const gridId = mode === "edit" ? "editImagesGrid" : "addImagesGrid";
    const grid = document.getElementById(gridId);
    if (!grid) return;

    // ✅ نضمن إن الـ input موجود (حماية إضافية)
    const fileInputId = mode === "edit" ? "editImagesFile" : "addImagesFile";
    if (!document.getElementById(fileInputId)) {
        console.warn("File input missing:", fileInputId);
        return;
    }

    const list = mode === "edit" ? editImagesList : addImagesList;

    const addBtnHTML = `
        <button type="button" class="multi-image-add" 
            onclick="document.getElementById('${mode === 'edit' ? 'editImagesFile' : 'addImagesFile'}').click()">
            <i class="fa-solid fa-plus"></i>
            <span>إضافة صور</span>
        </button>
    `;

    const itemsHTML = list.map((item, index) => {
        if (typeof item === "object" && item.uploading) {
            return `
                <div class="multi-image-item uploading">
                    <div class="upload-spinner">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                    </div>
                </div>
            `;
        }

        return `
            <div class="multi-image-item">
                <img src="${escapeAdminHTML(item)}" alt="">
                <button type="button" class="multi-image-remove"
                    onclick="removeMultiImage('${mode}', ${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    }).join("");

    grid.innerHTML = addBtnHTML + itemsHTML;
}

function removeMultiImage(mode, index) {
    const list = mode === "edit" ? editImagesList : addImagesList;
    if (index < 0 || index >= list.length) return;

    list.splice(index, 1);
    renderMultiImageGrid(mode);
}

// ✅ Global exports
window.removeMultiImage = removeMultiImage;

// ========================================
// 79. PRODUCT PICKER (لل تقارير)
// ========================================

let selectedPickerProductId = null;

function openProductPicker() {
    const modal = document.getElementById("productPickerModal");
    if (!modal) return;

    // ✅ نعبّي القائمة
    renderProductPickerList("", "");

    // ✅ نصفّر حقول البحث
    const skuInput = document.getElementById("pickerSearchSku");
    const nameInput = document.getElementById("pickerSearchName");
    if (skuInput) skuInput.value = "";
    if (nameInput) nameInput.value = "";

    modal.classList.add("open");
}

function closeProductPicker() {
    document.getElementById("productPickerModal")?.classList.remove("open");
}

function renderProductPickerList(skuQuery, nameQuery) {
    const listEl = document.getElementById("productPickerList");
    if (!listEl) return;

    const sku = String(skuQuery || "").trim().toLowerCase();
    const name = String(nameQuery || "").trim().toLowerCase();

    let filtered = [...adminProducts];

    if (sku) {
        filtered = filtered.filter(p =>
            String(p.id).includes(sku) ||
            String(p.sku || "").toLowerCase().includes(sku)
        );
    }

    if (name) {
        filtered = filtered.filter(p =>
            String(p.name || "").toLowerCase().includes(name)
        );
    }

    if (!filtered.length) {
        listEl.innerHTML = `
            <div class="empty-state" style="padding:30px;">
                <i class="fa-solid fa-box-open"></i>
                <p>لا توجد منتجات مطابقة</p>
            </div>
        `;
        return;
    }

    // ✅ خيار "الكل"
    const clearBtn = `
        <div class="product-picker-item-clear" onclick="selectPickerProduct(null)">
            <i class="fa-solid fa-rotate-left"></i>
            عرض كل المنتجات
        </div>
    `;

    listEl.innerHTML = clearBtn + filtered.map(p => `
        <div class="product-picker-item ${selectedPickerProductId === p.id ? 'selected' : ''}"
            onclick="selectPickerProduct(${Number(p.id)})">
            <div class="product-picker-item-id">#${p.id}</div>
            <div class="product-picker-item-info">
                <strong>${escapeAdminHTML(p.name || "منتج")}</strong>
                <small>${p.sku ? `كود الصنف: ${escapeAdminHTML(p.sku)}` : "بدون كود"}</small>
            </div>
        </div>
    `).join("");
}

function selectPickerProduct(productId) {
    selectedPickerProductId = productId;

    const labelEl = document.getElementById("invProductPickerLabel");
    const btnEl = document.getElementById("invProductPickerBtn");

    if (productId === null) {
        if (labelEl) labelEl.textContent = "كل المنتجات";
        if (btnEl) btnEl.classList.remove("active");
    } else {
        const product = adminProducts.find(p => Number(p.id) === Number(productId));
        if (labelEl) labelEl.textContent = product?.name || `#${productId}`;
        if (btnEl) btnEl.classList.add("active");
    }

    closeProductPicker();
    renderInventoryReport();
}

// ✅ Global exports
window.openProductPicker = openProductPicker;
window.closeProductPicker = closeProductPicker;
window.selectPickerProduct = selectPickerProduct;
window.renderProductPickerList = renderProductPickerList;
// ========================================
// 80. CONFIRM INSTAPAY PAYMENT
// ========================================

async function confirmInstaPayPayment(orderId) {
    const confirmed = confirm(
        "هل تأكدت من استلام المبلغ في حساب إنستاباي؟\n\n" +
        "⚠️ بعد التأكيد، الطلب هيتحول لـ 'جديدة'"
    );

    if (!confirmed) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client.rpc("confirm_instapay_payment", {
            p_order_id: orderId
        });

        if (error) throw error;

        showToast("تم تأكيد الدفع ✅");
        await loadAdminOrders();
    } catch (err) {
        console.error("Confirm payment error:", err);
        alert("فشل التأكيد:\n\n" + err.message);
    }
}

// ========================================
// 81. SALES REPORT — FILTERS + TABS
// ========================================

function switchSalesSubTab(tab, btnEl) {
    salesReportTab = tab;

    document.querySelectorAll(".report-sub-tab").forEach(b => b.classList.remove("active"));
    btnEl?.classList.add("active");

    document.querySelectorAll(".report-sub-panel").forEach(p => p.classList.remove("active"));

    if (tab === "orders") {
        document.getElementById("salesTabOrders")?.classList.add("active");
    } else {
        document.getElementById("salesTabProducts")?.classList.add("active");
    }
}

function updateSalesFilterSummary() {
    ["date", "status", "governorate", "customer"].forEach(key => {
        updateFiltersChip("sales", key);
    });
}

window.switchSalesSubTab = switchSalesSubTab;

// ========================================
// 84. COLLAPSIBLE FILTERS + PICKER
// ========================================

let filterPickerState = {
    reportKey: null,
    filterKey: null
};

// ✅ Toggle filters body
function toggleFiltersBar(reportKey) {
    const body = document.getElementById(reportKey + "FiltersBody");
    const icon = document.getElementById(reportKey + "FiltersIcon");

    if (!body) return;

    body.classList.toggle("open");
    icon?.classList.toggle("open", body.classList.contains("open"));
}

// ✅ Open filter picker
function openFilterPicker(reportKey, filterKey) {
    filterPickerState.reportKey = reportKey;
    filterPickerState.filterKey = filterKey;

    const modal = document.getElementById("filterPickerModal");
    const titleEl = document.getElementById("filterPickerTitle");
    const subtitleEl = document.getElementById("filterPickerSubtitle");
    const bodyEl = document.getElementById("filterPickerBody");
    const iconEl = document.getElementById("filterPickerIcon");

    if (!modal || !bodyEl) return;

    const configs = {
        date: { title: "الفترة الزمنية", subtitle: "اختر الفترة اللي عايز تشوفها", icon: "fa-calendar", bg: "#eff6ff", color: "#2563eb" },
        status: { title: "حالة الطلب", subtitle: "اختر الحالة المطلوبة", icon: "fa-tag", bg: "#fef3c7", color: "#d97706" },
        governorate: { title: "المحافظة", subtitle: "اختر المحافظة", icon: "fa-location-dot", bg: "#dcfce7", color: "#16a34a" },
        customer: { title: "العميل", subtitle: "ابحث باسم العميل أو رقمه", icon: "fa-user", bg: "#f3e8ff", color: "#8b5cf6" }
    };

    const cfg = configs[filterKey] || configs.date;
    titleEl.textContent = cfg.title;
    subtitleEl.textContent = cfg.subtitle;
    iconEl.innerHTML = `<i class="fa-solid ${cfg.icon}"></i>`;
    iconEl.style.background = cfg.bg;
    iconEl.style.color = cfg.color;

    if (filterKey === "date") renderDatePicker(bodyEl, reportKey);
    else if (filterKey === "status") renderListPicker(bodyEl, reportKey, "status");
    else if (filterKey === "governorate") renderListPicker(bodyEl, reportKey, "governorate");
    else if (filterKey === "customer") renderCustomerPicker(bodyEl, reportKey);

    modal.classList.add("open");
}

function closeFilterPicker() {
    document.getElementById("filterPickerModal")?.classList.remove("open");
    filterPickerState = { reportKey: null, filterKey: null };
}

// ✅ Date Picker
function renderDatePicker(bodyEl, reportKey) {
    const filters = getFiltersByReport(reportKey);
    const fromStr = filters.from ? filters.from.toISOString().slice(0, 10) : '';
    const toStr = filters.to ? filters.to.toISOString().slice(0, 10) : '';

    bodyEl.innerHTML = `
        <div class="filter-picker-date">
            <div class="filter-picker-date-group">
                <label><i class="fa-solid fa-calendar-day"></i> من تاريخ</label>
                <input type="date" id="pickerDateFrom" value="${fromStr}">
            </div>
            <div class="filter-picker-date-group">
                <label><i class="fa-solid fa-calendar-day"></i> إلى تاريخ</label>
                <input type="date" id="pickerDateTo" value="${toStr}">
            </div>

            <div class="filter-picker-presets">
                <button type="button" class="filter-picker-preset ${filters.preset === 'today' ? 'active' : ''}" onclick="setPickerDatePreset('today', this)">اليوم</button>
                <button type="button" class="filter-picker-preset ${filters.preset === 'week' ? 'active' : ''}" onclick="setPickerDatePreset('week', this)">آخر 7 أيام</button>
                <button type="button" class="filter-picker-preset ${filters.preset === 'month' ? 'active' : ''}" onclick="setPickerDatePreset('month', this)">هذا الشهر</button>
                <button type="button" class="filter-picker-preset ${filters.preset === 'all' ? 'active' : ''}" onclick="setPickerDatePreset('all', this)">الكل</button>
            </div>

            <div class="filter-picker-actions">
                <button type="button" class="apply" onclick="applyDateFilter()">
                    <i class="fa-solid fa-check"></i> تطبيق
                </button>
                <button type="button" class="reset" onclick="resetDateFilter()">
                    <i class="fa-solid fa-rotate-left"></i> إعادة تعيين
                </button>
            </div>
        </div>
    `;
}

function setPickerDatePreset(preset, btnEl) {
    document.querySelectorAll(".filter-picker-preset").forEach(b => b.classList.remove("active"));
    btnEl?.classList.add("active");

    const r = _getPresetRange(preset);
    const fromEl = document.getElementById("pickerDateFrom");
    const toEl = document.getElementById("pickerDateTo");

    if (fromEl) fromEl.value = r.from ? r.from.toISOString().slice(0, 10) : '';
    if (toEl) toEl.value = r.to ? r.to.toISOString().slice(0, 10) : '';
}

function applyDateFilter() {
    const reportKey = filterPickerState.reportKey;
    const filters = getFiltersByReport(reportKey);

    const fromStr = document.getElementById("pickerDateFrom")?.value || '';
    const toStr = document.getElementById("pickerDateTo")?.value || '';

    filters.from = fromStr ? new Date(fromStr + 'T00:00:00') : null;
    filters.to = toStr ? new Date(toStr + 'T23:59:59') : null;

    const r_today = _getPresetRange("today");
    const r_week = _getPresetRange("week");
    const r_month = _getPresetRange("month");
    const key = d => d ? d.toISOString().slice(0, 10) : '';

    if (fromStr === key(r_today.from) && toStr === key(r_today.to)) filters.preset = "today";
    else if (fromStr === key(r_week.from) && toStr === key(r_week.to)) filters.preset = "week";
    else if (fromStr === key(r_month.from) && toStr === key(r_month.to)) filters.preset = "month";
    else if (!fromStr && !toStr) filters.preset = "all";
    else filters.preset = "custom";

    updateFiltersChip(reportKey, "date");
    closeFilterPicker();
    reloadReport(reportKey);
}

function resetDateFilter() {
    const fromEl = document.getElementById("pickerDateFrom");
    const toEl = document.getElementById("pickerDateTo");
    if (fromEl) fromEl.value = '';
    if (toEl) toEl.value = '';

    document.querySelectorAll(".filter-picker-preset").forEach(b => {
        b.classList.toggle("active", b.textContent.trim() === "الكل");
    });
}

// ✅ List Picker (Status + Governorate)
function renderListPicker(bodyEl, reportKey, filterKey) {
    const filters = getFiltersByReport(reportKey);
    const currentValue = filters[filterKey] || "all";

    let options = [];

    if (filterKey === "status") {
        options = [
            { value: "all", label: "كل الحالات", icon: "fa-list" },
            { value: "delivered", label: "تم التوصيل", icon: "fa-circle-check" },
            { value: "pending", label: "جديدة", icon: "fa-clock" },
            { value: "preparing", label: "قيد التحضير", icon: "fa-box-open" },
            { value: "shipped", label: "تم الشحن", icon: "fa-truck-fast" },
            { value: "payment_pending", label: "بانتظار الدفع", icon: "fa-hourglass-half" }
        ];
    } else if (filterKey === "governorate") {
        const govs = new Set();
        adminOrders.forEach(o => { if (o.governorate) govs.add(o.governorate); });
        govs.add("القاهرة");
        govs.add("الجيزة");

        options = [
            { value: "all", label: "كل المحافظات", icon: "fa-map" },
            ...Array.from(govs).sort().map(g => ({
                value: g, label: g, icon: "fa-location-dot"
            }))
        ];
    }

    bodyEl.innerHTML = options.map(opt => `
        <button type="button" class="filter-picker-item ${currentValue === opt.value ? 'selected' : ''}"
            onclick="applyListFilter('${escapeAdminHTML(opt.value)}')">
            <i class="fa-solid ${opt.icon}"></i>
            <span>${escapeAdminHTML(opt.label)}</span>
            <span class="filter-picker-check"><i class="fa-solid fa-check"></i></span>
        </button>
    `).join("");
}

function applyListFilter(value) {
    const reportKey = filterPickerState.reportKey;
    const filterKey = filterPickerState.filterKey;
    const filters = getFiltersByReport(reportKey);

    filters[filterKey] = value;
    updateFiltersChip(reportKey, filterKey);
    closeFilterPicker();
    reloadReport(reportKey);
}

// ✅ Customer Picker
function renderCustomerPicker(bodyEl, reportKey) {
    const filters = getFiltersByReport(reportKey);
    const currentValue = filters.customer || "";

    bodyEl.innerHTML = `
        <div class="filter-picker-date">
            <div class="filter-picker-date-group">
                <label><i class="fa-solid fa-user"></i> اسم العميل أو رقم الهاتف</label>
                <input type="text" id="pickerCustomerInput" value="${escapeAdminHTML(currentValue)}" placeholder="اكتب للبحث...">
            </div>

            <div class="filter-picker-actions">
                <button type="button" class="apply" onclick="applyCustomerFilter()">
                    <i class="fa-solid fa-check"></i> تطبيق
                </button>
                <button type="button" class="reset" onclick="resetCustomerFilter()">
                    <i class="fa-solid fa-rotate-left"></i> إعادة تعيين
                </button>
            </div>
        </div>
    `;

    setTimeout(() => document.getElementById("pickerCustomerInput")?.focus(), 100);
}

function applyCustomerFilter() {
    const reportKey = filterPickerState.reportKey;
    const filters = getFiltersByReport(reportKey);

    filters.customer = document.getElementById("pickerCustomerInput")?.value.trim() || "";
    updateFiltersChip(reportKey, "customer");
    closeFilterPicker();
    reloadReport(reportKey);
}

function resetCustomerFilter() {
    const input = document.getElementById("pickerCustomerInput");
    if (input) input.value = "";
}

// ✅ Helpers
function getFiltersByReport(reportKey) {
    if (reportKey === "sales") return salesReportFilters;
    if (reportKey === "daily") return dailyReportFilters;
    if (reportKey === "gov") return govReportFilters;
    if (reportKey === "prod") return prodReportFilters;
    if (reportKey === "status") return statusReportFilters;
    if (reportKey === "exchange") return exchangeReportFilters;
    return {};
}

function reloadReport(reportKey) {
    if (reportKey === "sales") loadSalesReport();
    else if (reportKey === "daily") loadDailyReport();
    else if (reportKey === "gov") loadGovernorateReport();
    else if (reportKey === "prod") loadProductsReport();
    else if (reportKey === "status") loadStatusReport();
    else if (reportKey === "exchange") loadExchangeReport();
}

function updateFiltersChip(reportKey, filterKey) {
    const filters = getFiltersByReport(reportKey);

    if (filterKey === "date") {
        const el = document.getElementById(reportKey + "ChipDate");
        if (!el) return;

        if (!filters.from || !filters.to) {
            el.textContent = "كل الفترات";
        } else {
            const f = filters.from.toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
            const t = filters.to.toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
            el.textContent = `${f} - ${t}`;
        }

        const pill = el.closest(".filter-pill");
        if (pill) pill.classList.toggle("active", filters.preset === "custom");
    } else if (filterKey === "status") {
        const el = document.getElementById(reportKey + "ChipStatus");
        if (!el) return;

        const labels = {
            all: "الكل",
            delivered: "تم التوصيل",
            pending: "جديدة",
            preparing: "قيد التحضير",
            shipped: "تم الشحن",
            payment_pending: "بانتظار الدفع"
        };

        el.textContent = labels[filters.status] || filters.status;
        const pill = el.closest(".filter-pill");
        if (pill) pill.classList.toggle("active", filters.status && filters.status !== "delivered");
    } else if (filterKey === "governorate") {
        const el = document.getElementById(reportKey + "ChipGov");
        if (!el) return;

        el.textContent = filters.governorate === "all" ? "الكل" : filters.governorate;
        const pill = el.closest(".filter-pill");
        if (pill) pill.classList.toggle("active", filters.governorate !== "all");
    } else if (filterKey === "customer") {
        const el = document.getElementById(reportKey + "ChipCustomer");
        if (!el) return;

        el.textContent = filters.customer || "الكل";
        const pill = el.closest(".filter-pill");
        if (pill) pill.classList.toggle("active", Boolean(filters.customer));
    }
}

window.toggleFiltersBar = toggleFiltersBar;
window.openFilterPicker = openFilterPicker;
window.closeFilterPicker = closeFilterPicker;
window.setPickerDatePreset = setPickerDatePreset;
window.applyDateFilter = applyDateFilter;
window.resetDateFilter = resetDateFilter;
window.applyListFilter = applyListFilter;
window.applyCustomerFilter = applyCustomerFilter;
window.resetCustomerFilter = resetCustomerFilter;

// ✅ إغلاق Modal الفلاتر عند الضغط على الخلفية
document.getElementById("filterPickerModal")?.addEventListener("click", (e) => {
    if (e.target.id === "filterPickerModal") closeFilterPicker();
});

// ========================================
// 82. DISCOUNT DETAILS MODAL
// ========================================

function showDiscountDetails(orderId) {
    const order = salesReportOrders.find(o => Number(o.id) === Number(orderId)) ||
                  adminOrders.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    const modal = document.getElementById("discountDetailsModal");
    const body = document.getElementById("discountDetailsBody");
    if (!modal || !body) return;

    const items = Array.isArray(order.items) ? order.items : [];
    const orderGross = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);
    const totalDiscount = Number(order.discount_total || 0);

    // ✅ لو مفيش خصم
    if (totalDiscount === 0) {
        body.innerHTML = `
            <div style="text-align:center;padding:30px 20px;">
                <div style="width:60px;height:60px;margin:0 auto 14px;border-radius:50%;background:#f1f5f9;color:#94a3b8;display:flex;align-items:center;justify-content:center;font-size:24px;">
                    <i class="fa-solid fa-percent"></i>
                </div>
                <h3 style="font-size:15px;font-weight:800;color:#111;margin-bottom:6px;">مفيش خصم على الطلب ده</h3>
                <p style="font-size:13px;color:#64748b;">الطلب اتباع بسعره الكامل بدون أي خصومات</p>
            </div>
        `;
        modal.classList.add("open");
        return;
    }

    // ✅ تفاصيل المصدر
    const discountType = order.discount_type || "manual";
    const discountCode = order.discount_code || null;
    const discountPercent = order.discount_percentage || null;

    const typeLabels = {
        coupon: "كود خصم",
        auto: "خصم تلقائي",
        manual: "خصم يدوي",
        mixed: "متعدد",
        none: "بدون"
    };

    let sourceHTML = `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5;">
            <span style="color:#64748b;font-size:13px;">نوع الخصم</span>
            <strong style="color:#111;font-size:13px;">${escapeAdminHTML(typeLabels[discountType] || discountType)}</strong>
        </div>
    `;

    if (discountCode) {
        sourceHTML += `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5;">
                <span style="color:#64748b;font-size:13px;">الكود</span>
                <strong style="color:#8b5cf6;font-size:13px;font-family:monospace;">${escapeAdminHTML(discountCode)}</strong>
            </div>
        `;
    }

    if (discountPercent) {
        sourceHTML += `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f5;">
                <span style="color:#64748b;font-size:13px;">النسبة</span>
                <strong style="color:#dc2626;font-size:13px;">${discountPercent}%</strong>
            </div>
        `;
    }

    // ✅ توزيع الخصم على المنتجات
    const distributionHTML = items.map(item => {
        const qty = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        const before = qty * price;
        const share = orderGross > 0 ? (before / orderGross) * totalDiscount : 0;
        const after = before - share;

        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:6px;gap:10px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeAdminHTML(item.name || "منتج")}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:3px;">الكمية: ${qty}</div>
                </div>
                <div style="text-align:left;font-size:12px;">
                    <div style="color:#64748b;text-decoration:line-through;">${Math.round(before).toLocaleString("en-US")} ج</div>
                    <div style="color:#dc2626;font-weight:800;">- ${Math.round(share).toLocaleString("en-US")} ج</div>
                    <div style="color:#16a34a;font-weight:800;">${Math.round(after).toLocaleString("en-US")} ج</div>
                </div>
            </div>
        `;
    }).join("");

    // ✅ التصميم النهائي
    body.innerHTML = `
        <div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1.5px solid #fecaca;border-radius:12px;padding:18px;margin-bottom:18px;text-align:center;">
            <div style="font-size:12px;color:#991b1b;font-weight:700;margin-bottom:6px;">إجمالي الخصم</div>
            <div style="font-size:28px;font-weight:800;color:#dc2626;">${totalDiscount.toLocaleString("en-US")} <span style="font-size:16px;">ج.م</span></div>
        </div>

        <div style="margin-bottom:18px;">
            <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                <i class="fa-solid fa-tag" style="color:#8b5cf6;"></i>
                مصدر الخصم
            </div>
            <div style="background:#fafbfc;border-radius:10px;padding:6px 14px;">
                ${sourceHTML}
            </div>
        </div>

        <div>
            <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                <i class="fa-solid fa-cubes" style="color:#8b5cf6;"></i>
                التوزيع على المنتجات
            </div>
            ${distributionHTML}
        </div>

        <div style="margin-top:14px;padding:12px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;display:flex;justify-content:space-between;font-size:13px;">
            <span style="color:#166534;font-weight:700;">صافي بعد الخصم:</span>
            <strong style="color:#16a34a;font-size:15px;">${Math.round(orderGross - totalDiscount).toLocaleString("en-US")} ج.م</strong>
        </div>
    `;

    modal.classList.add("open");
}

function closeDiscountDetailsModal() {
    document.getElementById("discountDetailsModal")?.classList.remove("open");
}

// ========================================
// 83. PRODUCT SALES DETAILS
// ========================================

function showProductSalesDetails(productId) {
    if (productId === null || productId === undefined) return;

    const product = adminProducts.find(p => Number(p.id) === Number(productId));
    if (!product) {
        alert("المنتج غير موجود");
        return;
    }

    // ✅ نجمع كل الطلبات اللي فيها المنتج ده
    const relevantOrders = salesReportOrders.filter(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        return items.some(it => Number(it.id) === Number(productId));
    });

    if (!relevantOrders.length) {
        alert("لا توجد طلبات بيع للمنتج ده");
        return;
    }

    // ✅ نبني جدول الطلبات
    const ordersHTML = relevantOrders.map(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const productItems = items.filter(it => Number(it.id) === Number(productId));
        const qty = productItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
        const value = productItems.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0);

        return `
            <div class="order-detail-item" style="cursor:pointer;" onclick="closeDiscountDetailsModal(); viewOrderDetails(${Number(o.id)})">
                <div class="order-detail-info">
                    <h4 style="font-size:14px;">طلب #${escapeAdminHTML(o.id)}</h4>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                        ${getStatusBadge(o.status)}
                    </div>
                    <div style="font-size:12px;color:#64748b;margin-top:8px;">
                        ${escapeAdminHTML(o.customer_name || "عميل")} · ${formatDate(o.created_at)}
                    </div>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:12px;color:#64748b;">${qty} قطعة</div>
                    <div style="font-size:14px;font-weight:800;color:#2563eb;margin-top:4px;">${Math.round(value).toLocaleString("en-US")} ج</div>
                </div>
            </div>
        `;
    }).join("");

    const totalQty = relevantOrders.reduce((s, o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return s + items.filter(it => Number(it.id) === Number(productId))
                        .reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    }, 0);

    const totalValue = relevantOrders.reduce((s, o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return s + items.filter(it => Number(it.id) === Number(productId))
                        .reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
    }, 0);

    // ✅ نستخدم discountDetailsModal برضو
    const modal = document.getElementById("discountDetailsModal");
    const body = document.getElementById("discountDetailsBody");
    if (!modal || !body) return;

    body.innerHTML = `
        <div style="display:flex;gap:14px;padding:14px;background:#f8fafc;border-radius:12px;margin-bottom:18px;align-items:center;">
            ${product.image
                ? `<img src="${escapeAdminHTML(product.image)}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;">`
                : `<div style="width:60px;height:60px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fa-solid fa-image"></i></div>`
            }
            <div style="flex:1;min-width:0;">
                <div style="font-size:15px;font-weight:800;color:#111;">${escapeAdminHTML(product.name)}</div>
                ${product.sku ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;font-family:monospace;">${escapeAdminHTML(product.sku)}</div>` : ""}
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
            <div style="background:#f3e8ff;padding:14px;border-radius:10px;text-align:center;">
                <div style="font-size:22px;font-weight:800;color:#8b5cf6;">${totalQty}</div>
                <div style="font-size:11px;color:#64748b;font-weight:700;margin-top:4px;">قطعة مُباعة</div>
            </div>
            <div style="background:#dcfce7;padding:14px;border-radius:10px;text-align:center;">
                <div style="font-size:22px;font-weight:800;color:#16a34a;">${Math.round(totalValue).toLocaleString("en-US")}</div>
                <div style="font-size:11px;color:#64748b;font-weight:700;margin-top:4px;">إجمالي المبيعات (ج.م)</div>
            </div>
        </div>

        <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-list" style="color:#8b5cf6;"></i>
            الطلبات (${relevantOrders.length})
        </div>
        ${ordersHTML}
    `;

    modal.classList.add("open");
}

window.showDiscountDetails = showDiscountDetails;
window.closeDiscountDetailsModal = closeDiscountDetailsModal;
window.showProductSalesDetails = showProductSalesDetails;
window.confirmInstaPayPayment = confirmInstaPayPayment;
// ========================================
// SHIP CONFIRM MODAL
// ========================================

let pendingShipOrderId = null;

/**
 * فحص المخزون لكل منتجات الطلب
 */
function canShipOrder(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    const results = [];

    for (const item of items) {
        const product = getProductById(item.id);
        const sizeData = getSizeData(item.id, item.size);
        const available = sizeData ? Number(sizeData.stock || 0) : 0;
        const needed = Number(item.quantity || 1);
        const isAvailable = available >= needed;

        results.push({
            productId: item.id,
            name: item.name || "منتج",
            image: item.image || product?.image || "",
            sku: product?.sku || null,
            size: item.size,
            needed,
            available,
            isAvailable
        });
    }

    const canShip = results.every(r => r.isAvailable);
    const totalItems = results.reduce((s, r) => s + r.needed, 0);

    return { canShip, results, totalItems };
}

/**
 * فتح Modal الشحن
 */
function openShipConfirmModal(orderId) {
    const order = adminOrders.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    pendingShipOrderId = orderId;

    const modal = document.getElementById("shipConfirmModal");
    const body = document.getElementById("shipConfirmBody");
    const title = document.getElementById("shipConfirmOrderId");
    const confirmBtn = document.getElementById("shipConfirmBtn");

    if (!modal || !body) return;

    if (title) title.textContent = `#${order.id}`;

    const { canShip, results, totalItems } = canShipOrder(order);

    // ✅ Items list
    const itemsHTML = results.map(item => {
        const icon = item.isAvailable
            ? `<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>`
            : `<i class="fa-solid fa-circle-xmark" style="color:#dc2626;"></i>`;

        const bgColor = item.isAvailable ? "#f0fdf4" : "#fef2f2";
        const borderColor = item.isAvailable ? "#86efac" : "#fecaca";

        return `
            <div style="display:flex;gap:12px;padding:12px;background:${bgColor};border:1px solid ${borderColor};border-radius:10px;margin-bottom:8px;align-items:center;">
                <div style="width:52px;height:52px;border-radius:10px;background:#f5f5f5;background-image:url('${escapeAdminHTML(item.image)}');background-size:cover;background-position:center;flex-shrink:0;border:1px solid #e5e7eb;"></div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:4px;">${escapeAdminHTML(item.name)}</div>
                    <div style="font-size:11px;color:#64748b;display:flex;gap:10px;flex-wrap:wrap;">
                        <span>المقاس: <strong>${escapeAdminHTML(item.size)}</strong></span>
                        <span>المطلوب: <strong>${item.needed}</strong></span>
                        <span>المتاح: <strong style="color:${item.isAvailable ? '#16a34a' : '#dc2626'};">${item.available}</strong></span>
                    </div>
                </div>
                <div style="font-size:18px;flex-shrink:0;">${icon}</div>
            </div>
        `;
    }).join("");

    // ✅ Warning
    const warningHTML = canShip
        ? `
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;color:#166534;display:flex;gap:10px;align-items:center;">
                <i class="fa-solid fa-circle-check" style="font-size:18px;"></i>
                <span>كل الكميات متوفرة. الشحن آمن ✅</span>
            </div>
        `
        : `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;color:#991b1b;display:flex;gap:10px;align-items:flex-start;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:18px;flex-shrink:0;margin-top:2px;"></i>
                <div>
                    <strong style="display:block;margin-bottom:4px;">⚠️ لا يمكن الشحن</strong>
                    <span>بعض الكميات مش متوفرة في المخزون. عدّل المخزون الأول أو ألغِ الطلب.</span>
                </div>
            </div>
        `;

    // ✅ Summary
    const summaryHTML = `
        <div style="display:flex;justify-content:space-between;padding:12px 14px;background:#f9fafb;border-radius:10px;margin-top:12px;font-size:13px;">
            <span style="color:#64748b;">إجمالي القطع:</span>
            <strong style="color:#111;">${totalItems} قطعة</strong>
        </div>
    `;

    body.innerHTML = warningHTML + itemsHTML + summaryHTML;

    // ✅ Enable/Disable confirm button
    if (confirmBtn) {
        if (canShip) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = "1";
            confirmBtn.style.cursor = "pointer";
            confirmBtn.innerHTML = '<i class="fa-solid fa-truck-fast"></i> تأكيد الشحن';
        } else {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = "0.5";
            confirmBtn.style.cursor = "not-allowed";
            confirmBtn.innerHTML = '<i class="fa-solid fa-ban"></i> مش ممكن الشحن';
        }
    }

    modal.classList.add("open");
}

/**
 * إغلاق Modal الشحن
 */
function closeShipConfirmModal() {
    document.getElementById("shipConfirmModal")?.classList.remove("open");
    pendingShipOrderId = null;
    renderAdminOrders();
}

/**
 * تأكيد الشحن — ينفذ تغيير الحالة
 */
async function confirmShipOrder() {
    if (!pendingShipOrderId) return;

    const orderId = pendingShipOrderId;
    const order = adminOrders.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    const { canShip } = canShipOrder(order);
    if (!canShip) {
        alert("لا يمكن الشحن — المخزون غير كافي");
        return;
    }

    const btn = document.getElementById("shipConfirmBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الشحن...';
    }

    await applyStatusChange(orderId, "shipped", null, null);

    closeShipConfirmModal();
    showToast("تم شحن الطلب بنجاح ✅");
}

window.openShipConfirmModal = openShipConfirmModal;
window.closeShipConfirmModal = closeShipConfirmModal;
window.confirmShipOrder = confirmShipOrder;

// ✅ ربط زر تأكيد الشحن
document.getElementById("shipConfirmBtn")?.addEventListener("click", confirmShipOrder);