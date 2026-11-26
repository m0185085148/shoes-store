// ========================================
// STEP Store - Account System
// account.js
// ========================================

// ========================================
// 1. SUPABASE CLIENT
// ========================================

const SUPABASE_URL = 'https://uobuxepixrqijgciurve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5cu-Flvr7CSvRPMT3hByMQ_CfO7mBIv';

const supabaseClient =
    window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;

// ========================================
// 2. GLOBAL STATE
// ========================================

let currentUserId = null;
let customerOrders = [];

// ========================================
// 3. PAGE DETECTION
// ========================================

function isRegisterPage() {
    return Boolean(document.getElementById("registerForm"));
}
function isLoginPage() {
    return Boolean(document.getElementById("loginForm"));
}
function isAccountPage() {
    return Boolean(document.getElementById("accountSide"));
}

// ========================================
// 4. HELPERS
// ========================================

function showMessage(elementId, message, type = "error") {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = "auth-message";
    if (message) {
        el.classList.add("show", type);
    }
}

function getInitials(name) {
    if (!name) return "؟";
    const parts = String(name).trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[c]);
}

function formatPrice(n) {
    return Number(n || 0).toLocaleString('en-US');
}

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("ar-EG-u-nu-latn", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ========================================
// 5. CUSTOMER STATUS BADGES
// ========================================

const CUSTOMER_STATUS = {
    pending: { text: "قيد المراجعة", bg: "#fef3c7", color: "#92400e" },
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

let ordersFilter = "all";
const ORDER_FILTERS = {
    all: () => true,
    active: s => ["pending", "preparing", "shipped", "return_requested", "return_received",
        "exchange_requested", "exchange_received", "exchange_shipped"].includes(s),
    delivered: s => ["delivered", "exchanged", "refunded"].includes(s),
    cancelled: s => s === "cancelled"
};

const CUSTOMER_CANCELLABLE = ["pending", "preparing"];

function getCustomerStatusBadge(status) {
    const s = CUSTOMER_STATUS[status] || {
        text: status || "غير محدد",
        bg: "#f1f5f9",
        color: "#475569"
    };

    return `<span class="order-status-badge" style="background:${s.bg};color:${s.color};">
        ${escapeHTML(s.text)}
    </span>`;
}

// ========================================
// 6. PASSWORD TOGGLE
// ========================================

const passwordToggle = document.getElementById("passwordToggle");
const passwordInput = document.getElementById("password");

if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", () => {
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
// 7. REGISTER
// ========================================

if (isRegisterPage()) {
    const registerForm = document.getElementById("registerForm");
    const registerBtn = document.getElementById("registerBtn");

    (async () => {
        const current = await getCurrentUserType();
        if (!current) return;

        // لو الجلسة الحالية أدمن: نسيب صفحة العميل تفتح عادي (الأدمن له صفحته admin-login.html)
        if (current.type === "customer") {
            window.location.replace("account.html");
        }
    })();

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!supabaseClient) {
            showMessage("registerMessage", "تعذر الاتصال بقاعدة البيانات");
            return;
        }

        const fullName = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!fullName || fullName.length < 3) {
            showMessage("registerMessage", "اكتب اسم صحيح (3 أحرف على الأقل)");
            return;
        }
        if (!/^01[0-9]{9}$/.test(phone)) {
            showMessage("registerMessage", "رقم الهاتف غير صحيح");
            return;
        }
        if (password.length < 6) {
            showMessage("registerMessage", "كلمة المرور لازم 6 أحرف على الأقل");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("registerMessage", "كلمتا المرور غير متطابقتين");
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
        showMessage("registerMessage", "");

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email, password,
                options: { data: { full_name: fullName, phone } }
            });

            if (error) throw error;
            if (!data?.user) throw new Error("لم يتم إنشاء الحساب");

            await supabaseClient.from("customer_profiles").insert({
                id: data.user.id,
                full_name: fullName,
                phone: phone
            });

            // ✅ ربط الطلبات القديمة تلقائيًا
            try {
                const { data: linkedCount } =
                    await supabaseClient.rpc("link_my_guest_orders");

                if (linkedCount && linkedCount > 0) {
                    showMessage(
                        "registerMessage",
                        `تم إنشاء الحساب! وتم ربط ${linkedCount} طلب قديم بحسابك ✅`,
                        "success"
                    );
                } else {
                    showMessage(
                        "registerMessage",
                        "تم إنشاء الحساب بنجاح! جاري تحويلك...",
                        "success"
                    );
                }
            } catch (err) {
                console.warn("Link orders error:", err);
                showMessage(
                    "registerMessage",
                    "تم إنشاء الحساب بنجاح! جاري تحويلك...",
                    "success"
                );
            }

            setTimeout(() => window.location.replace("account.html"), 1800);
        } catch (error) {
            console.error("Register Error:", error);
            let msg = error.message || "حدث خطأ أثناء إنشاء الحساب";

            if (msg.includes("already registered") ||
                msg.includes("User already registered")) {
                msg = "هذا البريد الإلكتروني مسجل بالفعل";
            } else if (msg.includes("Invalid email")) {
                msg = "البريد الإلكتروني غير صحيح";
            } else if (msg.includes("Password")) {
                msg = "كلمة المرور ضعيفة جداً";
            }

            showMessage("registerMessage", msg);
            registerBtn.disabled = false;
            registerBtn.innerHTML =
                '<i class="fa-solid fa-user-plus"></i> إنشاء الحساب';
        }
    });
}
// ========================================
// 7.5 GOOGLE SIGN IN
// ========================================

async function signInWithGoogle() {
    if (!supabaseClient) {
        showMessage(
            "loginMessage",
            "تعذر الاتصال بقاعدة البيانات"
        );
        return;
    }

    try {
        const redirectTo =
            window.location.origin +
            "/account.html";

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent"
                }
            }
        });

        if (error) throw error;
        // Supabase هيعمل redirect تلقائي لـ Google
    } catch (error) {
        console.error("Google Sign In Error:", error);
        showMessage(
            "loginMessage",
            "فشل تسجيل الدخول بـ Google: " + error.message
        );
    }
}

window.signInWithGoogle = signInWithGoogle;
// ========================================
// 8. LOGIN
// ========================================

if (isLoginPage()) {
    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");

    (async () => {
        const current = await getCurrentUserType();
        if (!current) return;

        // لو الجلسة الحالية أدمن: نسيب صفحة تسجيل دخول العميل تفتح عادي
        if (current.type === "customer" || current.type === "new_user") {
            window.location.replace("account.html");
        }
    })();

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!supabaseClient) {
            showMessage("loginMessage", "تعذر الاتصال بقاعدة البيانات");
            return;
        }

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            showMessage("loginMessage", "اكتب البريد وكلمة المرور");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        showMessage("loginMessage", "");

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email, password
            });
            if (error) throw error;

            const current = await getCurrentUserType();

            if (current?.type === "admin") {
                // الأدمن له صفحة دخول مستقلة بتعمل جلسة الإدارة، فنخرج من جلسة العميل ونحوله لها
                try { await supabaseClient.auth.signOut(); } catch (e) { console.warn("Admin signOut error:", e); }
                showMessage("loginMessage",
                    "هذا حساب إدارة. جاري تحويلك لصفحة دخول الإدارة...", "info");
                setTimeout(() => window.location.replace("admin-login.html"), 1200);
                return;
            }

            // ✅ ربط الطلبات القديمة تلقائيًا
            try {
                await supabaseClient.rpc("link_my_guest_orders");
            } catch (err) {
                console.warn("Link orders error:", err);
            }

            showMessage("loginMessage",
                "تم تسجيل الدخول! جاري تحويلك...", "success");
            setTimeout(() => window.location.replace("account.html"), 800);
        } catch (error) {
            console.error("Login Error:", error);
            let msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";

            if (error.message?.includes("Email not confirmed")) {
                msg = "لم يتم تفعيل الحساب. راجع إيميلك";
            }

            showMessage("loginMessage", msg);
            loginBtn.disabled = false;
            loginBtn.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i> تسجيل الدخول';
        }
    });
}

// ========================================
// 9. GET USER TYPE
// ========================================

async function getCurrentUserType() {
    if (!supabaseClient) return null;

    const { data: sessionData, error } = await supabaseClient.auth.getSession();
    if (error || !sessionData?.session) return null;

    const user = sessionData.session.user;

    const { data: adminData } = await supabaseClient
        .from("admin_users")
        .select("id, is_active")
        .eq("id", user.id)
        .maybeSingle();

    if (adminData) {
        return {
            type: "admin",
            user,
            isActive: adminData.is_active !== false
        };
    }

    const { data: profileData } = await supabaseClient
        .from("customer_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileData) return { type: "customer", user, profile: profileData };

    // ✅ مستخدم جديد (مش أدمن ومش عنده بروفايل)
    // ممكن يكون مسجل بإيميل أو Google
    return { type: "new_user", user };
}

// ========================================
// 10. ACCOUNT PAGE INIT
// ========================================

if (isAccountPage()) {
    initAccountPage();
}

async function initAccountPage() {
    if (!supabaseClient) {
        window.location.replace("account-login.html");
        return;
    }

    // تسجيل الخروج من قايمة الحساب في الهيدر
    if (new URLSearchParams(window.location.search).get("logout") === "1") {
        await supabaseClient.auth.signOut();
        window.location.replace("index.html");
        return;
    }

    const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

    if (sessionError || !sessionData?.session) {
        window.location.replace("account-login.html");
        return;
    }

    const user = sessionData.session.user;
    currentUserId = user.id;

    // نتأكد مش أدمن
    const { data: adminData } = await supabaseClient
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (adminData) {
        // جلسة أدمن مش جلسة عميل: نرجّعه لصفحة دخول العميل بدل لوحة الأدمن
        window.location.replace("account-login.html");
        return;
    }

    // جب البروفايل
    let { data: profile } = await supabaseClient
        .from("customer_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // لو مش موجود، ننشئه
    if (!profile) {
        const meta = user.user_metadata || {};
        const fallbackName =
            meta.full_name ||
            meta.name ||
            user.email?.split("@")[0] ||
            "عميل";

        const { data: newProfile, error: createError } = await supabaseClient
            .from("customer_profiles")
            .insert({
                id: user.id,
                full_name: fallbackName,
                phone: meta.phone || null
            })
            .select()
            .single();

        if (!createError && newProfile) profile = newProfile;
    }

    // ✅ ربط أي طلبات قديمة تلقائيًا
    try {
        await supabaseClient.rpc("link_my_guest_orders");
    } catch (err) {
        console.warn("Link orders error:", err);
    }


    const fullName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "عميل";

    document.getElementById("userAvatar").textContent = getInitials(fullName);
    document.getElementById("userGreeting").textContent = `مرحباً ${fullName}`;
    document.getElementById("userEmail").textContent = user.email;

    // املأ الفورم
    const setField = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v || "";
    };
    setField("fullName", profile?.full_name);
    setField("phone", profile?.phone);
    setField("governorate", profile?.governorate);
    setField("city", profile?.city);
    setField("address", profile?.address);

// ========================================
// PHONE REMINDER BANNER
// ========================================

function updatePhoneReminder(phone) {
    const banner = document.getElementById("phoneReminderBanner");
    if (!banner) return;

    const hasPhone = phone && String(phone).trim() !== "";
    banner.style.display = hasPhone ? "none" : "flex";
}

    // ============================
    // ✅ بانر تذكير رقم الهاتف
    // ============================
    updatePhoneReminder(profile?.phone);

    // زر "ضيف رقمك" يوديه لحقل الهاتف
    document.getElementById("addPhoneBtn")?.addEventListener("click", () => {
        const phoneField = document.getElementById("phone");
        phoneField?.focus();
        phoneField?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // ============================
    // ACCOUNT SHELL (side menu)
    // ============================
    document.querySelectorAll(".orders-filter").forEach(btn => {
        btn.addEventListener("click", () => {
            ordersFilter = btn.dataset.filter;
            document.querySelectorAll(".orders-filter").forEach(b => {
                b.classList.toggle("active", b === btn);
            });
            renderOrdersList();
        });
    });
    document.getElementById("ordersSearch")?.addEventListener("input", e => {
        ordersQuery = e.target.value;
        renderOrdersList();
    });
    AccountShell.init();
    if (document.getElementById("ordersList")) loadCustomerOrders();

    // ============================
    // SAVE PROFILE
    // ============================
    const profileForm = document.getElementById("profileForm");
    const saveProfileBtn = document.getElementById("saveProfileBtn");

    profileForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const governorate = document.getElementById("governorate").value;
        const city = document.getElementById("city").value.trim();
        const address = document.getElementById("address").value.trim();

        if (!fullName || fullName.length < 3) {
            showMessage("profileMessage", "اكتب اسم صحيح (3 أحرف على الأقل)");
            return;
        }
        if (phone && !/^01[0-9]{9}$/.test(phone)) {
            showMessage("profileMessage", "رقم الهاتف غير صحيح");
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
        showMessage("profileMessage", "");

        try {
            const { error } = await supabaseClient
                .from("customer_profiles")
                .update({
                    full_name: fullName,
                    phone: phone || null,
                    governorate: governorate || null,
                    city: city || null,
                    address: address || null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", user.id);

            if (error) throw error;

            document.getElementById("userAvatar").textContent = getInitials(fullName);
            document.getElementById("userGreeting").textContent = `مرحباً ${fullName}`;

            // ✅ نحدّث البانر بعد الحفظ
            updatePhoneReminder(phone);

            showMessage("profileMessage", "تم حفظ التعديلات بنجاح ✅", "success");
            setTimeout(() => showMessage("profileMessage", ""), 3000);
        } catch (error) {
            console.error("Save Profile Error:", error);
            showMessage("profileMessage", "فشل الحفظ: " + error.message);
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML =
                '<i class="fa-solid fa-check"></i> حفظ التعديلات';
        }
    });

    // ============================
    // LOGOUT
    // ============================
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        const confirmed = confirm("هل أنت متأكد من تسجيل الخروج؟");
        if (!confirmed) return;
        await supabaseClient.auth.signOut();
        window.location.replace("index.html");
    });

    // ============================
    // ORDER DETAILS MODAL
    // ============================
    document.getElementById("closeOrderDetailsBtn")
        ?.addEventListener("click", closeOrderDetails);

    document.getElementById("orderDetailsModal")
        ?.addEventListener("click", (e) => {
            if (e.target.id === "orderDetailsModal") closeOrderDetails();
        });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeOrderDetails();
    });

    // نحمّل عدد الطلبات مبدئيًا (يظهر في تبويب "طلباتي")
    loadCustomerOrders();
}

// ========================================
// 11. LOAD CUSTOMER ORDERS
// ========================================

async function loadCustomerOrders() {
    if (!supabaseClient || !currentUserId) return;

    const ordersList = document.getElementById("ordersList");
    const ordersCount = document.getElementById("ordersCount");
    const tabCount = document.getElementById("ordersTabCount");

    if (!ordersList) return;

    ordersList.innerHTML = `
        <div class="account-empty">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>جاري تحميل الطلبات...</p>
        </div>
    `;

    try {
        const { data, error } = await supabaseClient
            .from("orders")
            .select("*")
            .eq("customer_id", currentUserId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        customerOrders = data || [];

        if (ordersCount) ordersCount.textContent = customerOrders.length;

        // نعرض العدد في تبويب "طلباتي"
        if (tabCount && customerOrders.length > 0) {
            tabCount.textContent = customerOrders.length;
            tabCount.style.display = "inline-block";
        } else if (tabCount) {
            tabCount.style.display = "none";
        }

        renderOrdersList();
    } catch (error) {
        console.error("Load Orders Error:", error);
        ordersList.innerHTML = `
            <div class="account-empty">
                <i class="fa-solid fa-circle-exclamation" style="color:#dc2626;"></i>
                <p>تعذر تحميل الطلبات</p>
                <small>${escapeHTML(error.message)}</small>
            </div>
        `;
    }
}

// ========================================
// 12. RENDER ORDERS LIST
// ========================================

let ordersQuery = "";

const ORDER_PROGRESS = {
    pending: { pct: 20, label: "بنراجع طلبك" },
    preparing: { pct: 45, label: "بنجهّز طلبك" },
    shipped: { pct: 75, label: "في الطريق إليك" },
    delivered: { pct: 100, label: "تم التوصيل" }
};

function updateOrdersChrome() {
    const sum = document.getElementById("ordersSummary");
    const counts = {};
    Object.keys(ORDER_FILTERS).forEach(k => {
        counts[k] = customerOrders.filter(o => ORDER_FILTERS[k](o.status)).length;
    });
    document.querySelectorAll(".orders-filter").forEach(btn => {
        const c = btn.querySelector(".of-count");
        if (c) c.textContent = counts[btn.dataset.filter] ?? 0;
    });
    if (sum) {
        sum.hidden = !customerOrders.length;
        sum.innerHTML = [["all", "كل الطلبات"], ["active", "جارية"], ["delivered", "تم التوصيل"]]
            .map(([k, l]) => `<div><b><bdi>${counts[k]}</bdi></b><span>${l}</span></div>`).join("");
    }
}

function renderOrdersList() {
    const ordersList = document.getElementById("ordersList");
    if (!ordersList) return;
    updateOrdersChrome();

    if (!customerOrders.length) {
        ordersList.innerHTML = `
            <div class="account-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>لسه ماعندكش طلبات</p>
                <small>ابدأ التسوق من المتجر وهيظهر طلباتك هنا</small>
                <div style="margin-top:20px;">
                    <a href="index.html#products" class="btn-primary"
                        style="display:inline-flex;width:auto;padding:12px 24px;text-decoration:none;">
                        <i class="fa-solid fa-bag-shopping"></i>
                        تسوق الآن
                    </a>
                </div>
            </div>
        `;
        return;
    }

    const filterFn = ORDER_FILTERS[ordersFilter] || ORDER_FILTERS.all;
    const q = (ordersQuery || "").replace(/[^0-9]/g, "");
    const shownOrders = customerOrders.filter(o =>
        filterFn(o.status) && (!q || String(o.id).includes(q)));
    if (!shownOrders.length) {
        ordersList.innerHTML = `
            <div class="account-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>مفيش طلبات في القسم ده</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = shownOrders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);
        const prog = ORDER_PROGRESS[order.status];
        const trackHref = order.customer_phone
            ? `track.html?id=${encodeURIComponent(order.id)}&phone=${encodeURIComponent(order.customer_phone)}`
            : "";
        const firstPid = items.find(i => i && i.product_id);
        const againHref = firstPid
            ? `product.html?id=${encodeURIComponent(firstPid.product_id)}`
            : "index.html#productsSection";

        const itemsHTML = items.slice(0, 3).map(i => `
            <div class="oc-item">
                <div class="oc-thumb" style="background-image:url('${escapeHTML(i.image || "")}')"></div>
                <div class="oc-item-info">
                    <b>${escapeHTML(i.name || "منتج")}</b>
                    <span>${i.size ? `مقاس <bdi>${escapeHTML(i.size)}</bdi> · ` : ""}<bdi>${Number(i.quantity || 1)}</bdi> قطعة</span>
                </div>
            </div>`).join("") +
            (items.length > 3 ? `<div class="oc-more">+<bdi>${items.length - 3}</bdi> منتجات تانية</div>` : "");

        const progHTML = prog ? `
            <div class="oc-prog">
                <div class="oc-bar"><i style="width:${prog.pct}%"></i></div>
                <div class="oc-bar-label">${prog.label}</div>
            </div>` : "";

        const primary = order.status === "delivered"
            ? `<a class="oc-btn primary" href="${againHref}"><i class="fa-solid fa-rotate-right"></i> اطلب مرة تانية</a>`
            : (trackHref ? `<a class="oc-btn primary" href="${trackHref}"><i class="fa-solid fa-route"></i> تتبّع</a>` : "");

        return `
            <div class="order-card oc">
                <div class="oc-head">
                    <div>
                        <div class="order-card-id">طلب #${escapeHTML(order.id)}</div>
                        <div class="order-card-date">${formatDate(order.created_at)}</div>
                    </div>
                    ${getCustomerStatusBadge(order.status)}
                </div>
                <div class="oc-body">
                    ${itemsHTML}
                    ${progHTML}
                </div>
                <div class="oc-foot">
                    <div class="oc-total"><bdi>${formatPrice(order.total_amount)}</bdi> ج</div>
                    <div class="oc-actions">
                        ${canCancel ? `<button type="button" class="oc-cancel" onclick="cancelOrder(${Number(order.id)}, this)">إلغاء الطلب</button>` : ""}
                        <button type="button" class="oc-btn" onclick="viewOrderDetails(${Number(order.id)})">التفاصيل</button>
                        ${primary}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ========================================
// 13. VIEW ORDER DETAILS
// ========================================

function viewOrderDetails(orderId) {
    const order = customerOrders.find(
        o => Number(o.id) === Number(orderId)
    );
    if (!order) return;

    const modal = document.getElementById("orderDetailsModal");
    const body = document.getElementById("orderDetailsBody");
    const title = document.getElementById("orderDetailsTitle");

    if (!modal || !body) return;

    title.textContent = `تفاصيل الطلب #${order.id}`;

    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHTML = items.map(item => `
        <div class="detail-item">
            <div class="detail-item-img"
                style="background-image:url('${escapeHTML(item.image || '')}')"></div>
            <div class="detail-item-info">
                <h4>${escapeHTML(item.name || 'منتج')}</h4>
                <small>
                    المقاس: ${escapeHTML(item.size || '-')} ·
                    الكمية: ${Number(item.quantity || 1)}
                </small>
            </div>
            <div class="detail-item-price">
                ${formatPrice(Number(item.price) * Number(item.quantity))} ج
            </div>
        </div>
    `).join("");

    const historyHTML = (Array.isArray(order.status_history) && order.status_history.length)
        ? `
            <div class="order-details-section">
                <h3>
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    تتبع الطلب
                </h3>
                <div class="order-timeline">
                    ${order.status_history.map(h => {
                        const statusInfo = CUSTOMER_STATUS[h.status] || {
                            text: h.status
                        };
                        return `
                            <div class="timeline-item">
                                <div class="timeline-status">
                                    ${escapeHTML(statusInfo.text || h.status)}
                                </div>
                                ${h.reason ? `
                                    <div class="timeline-reason">
                                        ${escapeHTML(h.reason)}
                                    </div>
                                ` : ""}
                                ${h.notes ? `
                                    <div class="timeline-notes">
                                        ${escapeHTML(h.notes)}
                                    </div>
                                ` : ""}
                                <div class="timeline-meta">
                                    ${formatDate(h.at)}
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `
        : "";

    const subtotal = Number(order.subtotal || order.total_amount || 0);
    const shipping = Number(order.shipping_cost || 0);

    const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);

    body.innerHTML = `
        <div class="order-details-section">
            <h3>
                <i class="fa-solid fa-circle-info"></i>
                معلومات الطلب
            </h3>
            <div class="order-details-row">
                <span>الحالة:</span>
                <strong>${getCustomerStatusBadge(order.status)}</strong>
            </div>
            <div class="order-details-row">
                <span>تاريخ الطلب:</span>
                <strong>${formatDate(order.created_at)}</strong>
            </div>
            <div class="order-details-row">
                <span>الاسم:</span>
                <strong>${escapeHTML(order.customer_name || "-")}</strong>
            </div>
            <div class="order-details-row">
                <span>الهاتف:</span>
                <strong>${escapeHTML(order.customer_phone || "-")}</strong>
            </div>
            <div class="order-details-row">
                <span>المحافظة:</span>
                <strong>${escapeHTML(order.governorate || "-")}</strong>
            </div>
            ${order.city ? `
                <div class="order-details-row">
                    <span>المدينة:</span>
                    <strong>${escapeHTML(order.city)}</strong>
                </div>
            ` : ""}
            <div class="order-details-row">
                <span>العنوان:</span>
                <strong style="text-align:left;max-width:60%;">
                    ${escapeHTML(order.customer_address || "-")}
                </strong>
            </div>
        </div>

        <div class="order-details-section">
            <h3>
                <i class="fa-solid fa-box"></i>
                المنتجات
            </h3>
            ${itemsHTML || "<p>لا توجد تفاصيل</p>"}
        </div>

        <div class="order-details-section">
            <h3>
                <i class="fa-solid fa-receipt"></i>
                الملخص
            </h3>
            <div class="order-details-row">
                <span>المنتجات:</span>
                <strong>${formatPrice(subtotal)} ج</strong>
            </div>
            <div class="order-details-row">
                <span>الشحن:</span>
                <strong style="color:${shipping === 0 ? '#16a34a' : '#111'};">
                    ${shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping) + ' ج'}
                </strong>
            </div>
            <div class="order-details-row" style="
                border-top:2px dashed #e5e5e5;
                margin-top:8px;padding-top:14px;
                font-size:17px;font-weight:800;
            ">
                <span>الإجمالي:</span>
                <strong style="color:#2563eb;">
                    ${formatPrice(order.total_amount)} ج
                </strong>
            </div>
        </div>

        ${historyHTML}

        ${canCancel ? `
            <button class="cancel-order-btn"
                onclick="cancelOrder(${Number(order.id)}, this)">
                <i class="fa-solid fa-xmark"></i>
                إلغاء الطلب
            </button>
        ` : ""}
    `;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeOrderDetails() {
    document.getElementById("orderDetailsModal")
        ?.classList.remove("open");
    document.body.style.overflow = "";
}

// ========================================
// 14. CANCEL ORDER
// ========================================

async function cancelOrder(orderId, buttonEl) {
    const order = customerOrders.find(
        o => Number(o.id) === Number(orderId)
    );
    if (!order) return;

    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
        alert("لا يمكن إلغاء الطلب في هذه المرحلة");
        return;
    }

    const confirmed = confirm(
        `هل أنت متأكد من إلغاء الطلب #${order.id}؟\n\n` +
        `⚠️ لا يمكن التراجع عن هذا الإجراء`
    );

    if (!confirmed) return;

    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإلغاء...';
    }

    try {
        const { data, error } = await supabaseClient.rpc(
            "cancel_customer_order",
            { order_id: orderId }
        );

        if (error) throw error;
        if (data && data.success === false) {
            throw new Error("فشل الإلغاء");
        }

        // نحدّث البيانات محليًا
        order.status = "cancelled";

        // نضيف السجل محليًا (للعرض الفوري)
        const newEntry = {
            status: "cancelled",
            reason: "إلغاء من العميل",
            notes: null,
            by: "customer",
            at: new Date().toISOString()
        };
        if (!Array.isArray(order.status_history)) {
            order.status_history = [];
        }
        order.status_history.push(newEntry);

        closeOrderDetails();
        renderOrdersList();

        // نعمل toast
        showTemporaryToast("تم إلغاء الطلب بنجاح ✅");
    } catch (error) {
        console.error("Cancel Order Error:", error);
        alert("فشل إلغاء الطلب:\n\n" + error.message);

        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.innerHTML =
                '<i class="fa-solid fa-xmark"></i> إلغاء الطلب';
        }
    }
}

// ========================================
// 15. TOAST
// ========================================

function showTemporaryToast(message) {
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
// 16. GLOBAL FUNCTIONS
// ========================================

window.viewOrderDetails = viewOrderDetails;
window.cancelOrder = cancelOrder;
