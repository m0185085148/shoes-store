// ========================================
// STEP Store - Track Order
// track.js
// ========================================

const SUPABASE_URL = 'https://uobuxepixrqijgciurve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5cu-Flvr7CSvRPMT3hByMQ_CfO7mBIv';

const supabaseClient =
    window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;

const WHATSAPP_NUMBER = '201120915594';

// ========================================
// STATUS CONFIG
// ========================================

const STATUS_CONFIG = {
    payment_pending: {
        text: "بانتظار الدفع",
        icon: "fa-mobile-screen",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        badgeBg: "#dbeafe",
        badgeColor: "#1e40af"
    },
    pending: {
        text: "قيد المراجعة",
        icon: "fa-clock",
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        badgeBg: "#fef3c7",
        badgeColor: "#92400e"
    },
    preparing: {
        text: "قيد التحضير",
        icon: "fa-box-open",
        iconBg: "#e0f2fe",
        iconColor: "#0284c7",
        badgeBg: "#e0f2fe",
        badgeColor: "#0369a1"
    },
    shipped: {
        text: "تم الشحن",
        icon: "fa-truck-fast",
        iconBg: "#f3e8ff",
        iconColor: "#7c3aed",
        badgeBg: "#f3e8ff",
        badgeColor: "#6b21a8"
    },
    delivered: {
        text: "تم التوصيل",
        icon: "fa-circle-check",
        iconBg: "#dcfce7",
        iconColor: "#16a34a",
        badgeBg: "#dcfce7",
        badgeColor: "#15803d"
    },
    return_requested: {
        text: "طلب استرجاع",
        icon: "fa-rotate-left",
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        badgeBg: "#fef3c7",
        badgeColor: "#92400e"
    },
    return_received: {
        text: "تم استلام المنتج",
        icon: "fa-box",
        iconBg: "#fed7aa",
        iconColor: "#c2410c",
        badgeBg: "#fed7aa",
        badgeColor: "#9a3412"
    },
    refunded: {
        text: "تم رد المبلغ",
        icon: "fa-money-bill-wave",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        badgeBg: "#dbeafe",
        badgeColor: "#1e40af"
    },
    exchange_requested: {
        text: "طلب استبدال",
        icon: "fa-arrows-rotate",
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        badgeBg: "#fef3c7",
        badgeColor: "#92400e"
    },
    exchange_received: {
        text: "تم استلام المنتج",
        icon: "fa-box",
        iconBg: "#fed7aa",
        iconColor: "#c2410c",
        badgeBg: "#fed7aa",
        badgeColor: "#9a3412"
    },
    exchange_shipped: {
        text: "تم شحن البديل",
        icon: "fa-truck-fast",
        iconBg: "#e9d5ff",
        iconColor: "#7c3aed",
        badgeBg: "#e9d5ff",
        badgeColor: "#6b21a8"
    },
    exchanged: {
        text: "تم الاستبدال",
        icon: "fa-circle-check",
        iconBg: "#bbf7d0",
        iconColor: "#16a34a",
        badgeBg: "#bbf7d0",
        badgeColor: "#166534"
    },
    cancelled: {
        text: "ملغى",
        icon: "fa-circle-xmark",
        iconBg: "#f3f4f6",
        iconColor: "#4b5563",
        badgeBg: "#f3f4f6",
        badgeColor: "#4b5563"
    }
};

const CANCELLABLE_STATUSES = ["payment_pending", "pending", "preparing"];

// ========================================
// HELPERS
// ========================================

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
// STATE
// ========================================

let currentOrder = null;
let currentPhone = null;

// ========================================
// DOM ELEMENTS
// ========================================

const $ = id => document.getElementById(id);

const trackForm = $("trackForm");
const trackBtn = $("trackBtn");
const trackResult = $("trackResult");
const trackError = $("trackError");

// ========================================
// SUBMIT
// ========================================

trackForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderId = $("orderId").value.trim();
    const phone = $("phone").value.trim();

    if (!orderId || !phone) {
        showError("اكمل البيانات", "اكتب رقم الطلب ورقم الهاتف");
        return;
    }

    if (!/^01[0-9]{9}$/.test(phone)) {
        showError("رقم هاتف غير صحيح", "لازم يبدأ ب 01 ويكون 11 رقم");
        return;
    }

    await searchOrder(orderId, phone);
});

// ========================================
// SEARCH ORDER
// ========================================

async function searchOrder(orderId, phone) {
    if (!supabaseClient) {
        showError("خطأ في الاتصال", "تعذر الاتصال بقاعدة البيانات");
        return;
    }

    // Reset UI
    trackResult.classList.remove("show");
    trackError.classList.remove("show");
    trackBtn.disabled = true;
    trackBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> جاري البحث...';

    try {
        const { data, error } = await supabaseClient.rpc(
            "get_order_by_tracking",
            {
                p_order_id: Number(orderId),
                p_phone: phone
            }
        );

        if (error) throw error;

        if (!data) {
            showError(
                "مفيش نتائج",
                "اتأكد من رقم الطلب ورقم الهاتف وحاول تاني"
            );
            return;
        }

        currentOrder = data;
        currentPhone = phone;

        renderResult(data);

    } catch (error) {
        console.error("Search Error:", error);
        showError(
            "حدث خطأ",
            error.message || "حاول تاني بعد شوية"
        );
    } finally {
        trackBtn.disabled = false;
        trackBtn.innerHTML =
            '<i class="fa-solid fa-magnifying-glass"></i> تتبع الطلب';
    }
}

// ========================================
// RENDER RESULT
// ========================================

function renderResult(order) {
    const statusInfo = STATUS_CONFIG[order.status] || {
        text: order.status,
        icon: "fa-circle-info",
        iconBg: "#f1f5f9",
        iconColor: "#475569",
        badgeBg: "#f1f5f9",
        badgeColor: "#475569"
    };

    // ===== STATUS CARD =====
    const icon = $("trackStatusIcon");
    icon.innerHTML =
        `<i class="fa-solid ${statusInfo.icon}"></i>`;
    icon.style.background = statusInfo.iconBg;
    icon.style.color = statusInfo.iconColor;

    $("trackOrderTitle").textContent =
        `طلب #${order.id}`;
    $("trackOrderDate").textContent =
        `📅 ${formatDate(order.created_at)}`;

    const badge = $("trackStatusBadge");
    badge.textContent = statusInfo.text;
    badge.style.background = statusInfo.badgeBg;
    badge.style.color = statusInfo.badgeColor;

    // ===== TIMELINE =====
    const history = Array.isArray(order.status_history)
        ? order.status_history
        : [];

    if (history.length) {
        $("trackTimelineSection").style.display = "block";

        $("trackTimeline").innerHTML = history
            .map((entry, index) => {
                const entryInfo = STATUS_CONFIG[entry.status] || {
                    text: entry.status
                };
                const isLast = index === history.length - 1;
                const isCurrent = isLast &&
                    !["delivered", "cancelled", "refunded", "exchanged"]
                        .includes(entry.status);

                const classes = [
                    "track-timeline-item",
                    isCurrent ? "current" : "done"
                ].join(" ");

                return `
                    <div class="${classes}">
                        <div class="track-timeline-status">
                            ${escapeHTML(entryInfo.text)}
                        </div>
                        ${entry.reason ? `
                            <div class="track-timeline-reason">
                                السبب: ${escapeHTML(entry.reason)}
                            </div>
                        ` : ""}
                        ${entry.notes ? `
                            <div class="track-timeline-notes">
                                ${escapeHTML(entry.notes)}
                            </div>
                        ` : ""}
                        <div class="track-timeline-meta">
                            ${formatDate(entry.at)}
                        </div>
                    </div>
                `;
            })
            .join("");
    } else {
        $("trackTimelineSection").style.display = "none";
    }

    // ===== ITEMS =====
    const items = Array.isArray(order.items) ? order.items : [];

    if (items.length) {
        $("trackItems").innerHTML = items.map(item => `
            <div class="track-item">
                <div class="track-item-img"
                    style="background-image:url('${escapeHTML(item.image || '')}')"></div>
                <div class="track-item-info">
                    <h4>${escapeHTML(item.name || 'منتج')}</h4>
                    <small>
                        المقاس: ${escapeHTML(item.size || '-')} ·
                        الكمية: ${Number(item.quantity || 1)}
                    </small>
                </div>
                <div class="track-item-price">
                    ${formatPrice(Number(item.price) * Number(item.quantity))} ج
                </div>
            </div>
        `).join("");
    } else {
        $("trackItems").innerHTML =
            "<p style='color:#888;text-align:center;padding:14px 0;'>لا توجد تفاصيل</p>";
    }

    // ===== SUMMARY =====
    const subtotal = Number(order.subtotal || order.total_amount || 0);
    const shipping = Number(order.shipping_cost || 0);

    $("trackSubtotal").textContent = `${formatPrice(subtotal)} ج`;

    const shippingEl = $("trackShipping");
    if (shipping === 0) {
        shippingEl.textContent = "مجاني 🎉";
        shippingEl.style.color = "#16a34a";
    } else {
        shippingEl.textContent = `${formatPrice(shipping)} ج`;
        shippingEl.style.color = "#111";
    }

    $("trackTotal").textContent =
        `${formatPrice(order.total_amount)} ج`;

    // ===== DELIVERY INFO =====
    $("trackCustomerName").textContent = order.customer_name || "-";
    $("trackCustomerPhone").textContent = order.customer_phone || "-";
    $("trackGovernorate").textContent = order.governorate || "-";

    if (order.city) {
        $("trackCityRow").style.display = "flex";
        $("trackCity").textContent = order.city;
    } else {
        $("trackCityRow").style.display = "none";
    }

    $("trackAddress").textContent = order.customer_address || "-";

    // ===== INSTAPAY BOX =====
    renderInstapayBox(order);

    // ✅ نظّف بانر إنستاباي المعلق لو الطلب مش محتاج تحويل تاني
    cleanupPendingInstapay(order);

    // ===== ACTIONS =====
    renderActions(order);

    // ===== SHOW =====
    trackResult.classList.add("show");
    trackError.classList.remove("show");

    // Scroll to result
    setTimeout(() => {
        trackResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 100);
}

// ========================================
// ACTIONS
// ========================================

function renderActions(order) {
    const canCancel = CANCELLABLE_STATUSES.includes(order.status);

    const whatsappText = encodeURIComponent(
        `مرحباً، بخصوص طلبي رقم #${order.id} من متجر STEP`
    );

    let html = `
        <a class="track-action-btn whatsapp"
           href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}"
           target="_blank" rel="noopener">
            <i class="fa-brands fa-whatsapp"></i>
            تواصل معنا
        </a>
    `;

    if (canCancel) {
        html += `
            <button class="track-action-btn cancel"
                onclick="cancelMyOrder()">
                <i class="fa-solid fa-xmark"></i>
                إلغاء الطلب
            </button>
        `;
    }

    $("trackActions").innerHTML = html;
}

// ========================================
// CANCEL ORDER
// ========================================

async function cancelMyOrder() {
    if (!currentOrder || !currentPhone) return;

    if (!CANCELLABLE_STATUSES.includes(currentOrder.status)) {
        alert("لا يمكن إلغاء الطلب في هذه المرحلة");
        return;
    }

    const confirmed = confirm(
        `هل أنت متأكد من إلغاء الطلب #${currentOrder.id}؟\n\n` +
        `⚠️ لا يمكن التراجع عن هذا الإجراء`
    );

    if (!confirmed) return;

    try {
        const { data, error } = await supabaseClient.rpc(
            "cancel_order_by_tracking",
            {
                p_order_id: Number(currentOrder.id),
                p_phone: currentPhone
            }
        );

        if (error) throw error;

        if (data && data.success === false) {
            throw new Error("فشل الإلغاء");
        }

        // Update local
        currentOrder.status = "cancelled";

        const newEntry = {
            status: "cancelled",
            reason: "إلغاء من العميل",
            notes: null,
            by: "customer",
            at: new Date().toISOString()
        };

        if (!Array.isArray(currentOrder.status_history)) {
            currentOrder.status_history = [];
        }
        currentOrder.status_history.push(newEntry);

        renderResult(currentOrder);
        showToast("تم إلغاء الطلب بنجاح ✅");

    } catch (error) {
        console.error("Cancel Error:", error);
        alert("فشل إلغاء الطلب:\n\n" + error.message);
    }
}

// ========================================
// ERROR STATE
// ========================================

function showError(title, message) {
    $("trackErrorTitle").textContent = title;
    $("trackErrorMsg").textContent = message;
    trackError.classList.add("show");
    trackResult.classList.remove("show");

    setTimeout(() => {
        trackError.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }, 100);
}

// ========================================
// TOAST
// ========================================

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
// URL PARAMS (auto-fill)
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get("id");
    const phoneParam = params.get("phone");

    if (orderIdParam) $("orderId").value = orderIdParam;
    if (phoneParam) $("phone").value = phoneParam;

    // Auto search if both present
    if (orderIdParam && phoneParam) {
        searchOrder(orderIdParam, phoneParam);
    }
});

// ========================================
// GLOBAL
// ========================================

window.cancelMyOrder = cancelMyOrder;
// ========================================
// INSTAPAY HELPERS
// ========================================

function copyInstapayNumber(btnEl) {
    const number = '01120915594';

    navigator.clipboard.writeText(number).then(() => {
        if (btnEl) {
            const original = btnEl.innerHTML;
            btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
            btnEl.style.background = '#16a34a';
            btnEl.style.color = '#fff';
            setTimeout(() => {
                btnEl.innerHTML = original;
                btnEl.style.background = '';
                btnEl.style.color = '';
            }, 1500);
        }
        showToast('تم نسخ الرقم ✅');
    }).catch(err => {
        console.error('Copy failed:', err);
        prompt('انسخ الرقم ده:', number);
    });
}

function renderInstapayBox(order) {
    const section = document.getElementById('trackInstapaySection');
    if (!section) return;

    // ✅ نعرضها فقط لو الطلب payment_pending
    if (order.status !== 'payment_pending') {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // المبلغ
    const amountEl = document.getElementById('trackInstapayAmount');
    if (amountEl) {
        amountEl.textContent = `${formatPrice(order.total_amount)} ج`;
    }

    // رقم الطلب
    const orderNumEl = document.getElementById('trackInstapayOrderNum');
    if (orderNumEl) {
        orderNumEl.textContent = `#${order.id}`;
    }
}

// ========================================
// CLEANUP PENDING INSTAPAY BANNER
// ========================================

function cleanupPendingInstapay(order) {
    try {
        const raw = localStorage.getItem('pendingInstapayOrder');
        if (!raw) return;

        const data = JSON.parse(raw);

        // لو البيانات تالفة → امسحها
        if (!data || !data.orderId) {
            localStorage.removeItem('pendingInstapayOrder');
            return;
        }

        // ✅ لو ده نفس الطلب اللي بيتتبع دلوقتي، وحالته مبقتش payment_pending
        if (
            Number(data.orderId) === Number(order.id) &&
            order.status !== 'payment_pending'
        ) {
            localStorage.removeItem('pendingInstapayOrder');
            console.log('✅ تم تنظيف بانر إنستاباي المعلق');
        }
    } catch (e) {
        // أي خطأ → امسح البيانات التالفة
        localStorage.removeItem('pendingInstapayOrder');
    }
}

window.copyInstapayNumber = copyInstapayNumber;
window.cleanupPendingInstapay = cleanupPendingInstapay;