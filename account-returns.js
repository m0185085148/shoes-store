// STEP Store - Returns screen (account-returns.html)
// Shows delivered orders from the last 14 days and lets the customer request a return.
// Uses the database function request_customer_return, which re-checks everything on the server.
(function () {
    if (!document.getElementById("returnsList")) return;

    const RETURN_DAYS = 14;
    const REASONS = [
        { code: "defect", label: "عيب في المنتج (ضمان)", note: "تتحمّل STEP تكلفة الشحن" },
        { code: "wrong_item", label: "المنتج مختلف عن المطلوب", note: "تتحمّل STEP تكلفة الشحن" },
        { code: "changed_mind", label: "غيرت رأيي", note: "يتحمّل العميل تكلفة شحن الاسترجاع" }
    ];

    const listEl = document.getElementById("returnsList");
    let orders = [];

    function esc(v) { return escapeHTML(v); }

    function deliveredAt(order) {
        if (order.delivered_at) return new Date(order.delivered_at);
        const h = Array.isArray(order.status_history) ? order.status_history : [];
        for (let i = h.length - 1; i >= 0; i--) {
            if (h[i] && h[i].status === "delivered" && h[i].at) return new Date(h[i].at);
        }
        return null;
    }

    function daysLeft(order) {
        const d = deliveredAt(order);
        if (!d || isNaN(d)) return null;
        const left = RETURN_DAYS - (Date.now() - d.getTime()) / 86400000;
        return left > 0 ? Math.ceil(left) : 0;
    }

    function thumbs(order) {
        const items = Array.isArray(order.items) ? order.items : [];
        return items.slice(0, 4).map(i =>
            `<div class="order-thumb" style="background-image:url('${esc(i.image || "")}')"></div>`).join("") +
            (items.length > 4 ? `<div class="order-thumb-more">+${items.length - 4}</div>` : "");
    }

    function render() {
        // delivered inside the window, or a return already requested
        const eligible = orders.filter(o => o.status === "delivered" && daysLeft(o) > 0);
        const requested = orders.filter(o => o.status === "return_requested");

        if (!eligible.length && !requested.length) {
            listEl.innerHTML = `
                <div class="account-empty">
                    <i class="fa-solid fa-rotate-left"></i>
                    <p>مفيش طلبات متاحة للاسترجاع دلوقتي</p>
                    <small>الطلبات اللي اتسلمت من أقل من ${RETURN_DAYS} يوم بتظهر هنا</small>
                </div>`;
            return;
        }

        const card = (o, canReturn) => {
            const left = daysLeft(o);
            return `
            <div class="order-card" data-order="${Number(o.id)}">
                <div class="order-card-header">
                    <div>
                        <div class="order-card-id">طلب #${esc(o.id)}</div>
                        <div class="order-card-date">${formatDate(o.created_at)}</div>
                    </div>
                    ${canReturn
                        ? `<span class="returns-days">متاح للاسترجاع <bdi>${left}</bdi> ${left === 1 ? "يوم" : "أيام"}</span>`
                        : `<span class="returns-days requested">تم تسجيل طلب الاسترجاع</span>`}
                </div>
                <div class="order-card-thumbs">${thumbs(o)}</div>
                <div class="order-card-body">
                    <div class="order-card-total">${formatPrice(o.total_amount)} ج</div>
                </div>
                ${canReturn ? `
                <div class="order-card-actions">
                    <button type="button" class="order-action-btn view" data-open="${Number(o.id)}">
                        <i class="fa-solid fa-rotate-left"></i> طلب استرجاع
                    </button>
                </div>
                <form class="returns-form" data-form="${Number(o.id)}" hidden>
                    <div class="returns-q">سبب الاسترجاع</div>
                    ${REASONS.map((r, i) => `
                    <label class="returns-reason">
                        <input type="radio" name="reason-${Number(o.id)}" value="${r.code}"${i === 0 ? " checked" : ""}>
                        <span><strong>${r.label}</strong><small>${r.note}</small></span>
                    </label>`).join("")}
                    <textarea class="returns-notes" rows="2" maxlength="500" placeholder="تفاصيل إضافية (اختياري)"></textarea>
                    <div class="returns-msg" role="alert"></div>
                    <div class="returns-btns">
                        <button type="submit" class="order-action-btn view">تأكيد طلب الاسترجاع</button>
                        <button type="button" class="order-action-btn" data-close="${Number(o.id)}">إلغاء</button>
                    </div>
                </form>` : ""}
            </div>`;
        };

        listEl.innerHTML = eligible.map(o => card(o, true)).join("") + requested.map(o => card(o, false)).join("");
    }

    listEl.addEventListener("click", e => {
        const open = e.target.closest("[data-open]");
        const close = e.target.closest("[data-close]");
        if (open) {
            const f = listEl.querySelector(`[data-form="${open.dataset.open}"]`);
            if (f) { f.hidden = false; open.hidden = true; }
        }
        if (close) {
            const f = listEl.querySelector(`[data-form="${close.dataset.close}"]`);
            const b = listEl.querySelector(`[data-open="${close.dataset.close}"]`);
            if (f) f.hidden = true;
            if (b) b.hidden = false;
        }
    });

    listEl.addEventListener("submit", async e => {
        const form = e.target.closest("[data-form]");
        if (!form) return;
        e.preventDefault();
        const id = Number(form.dataset.form);
        const code = form.querySelector('input[type="radio"]:checked')?.value;
        const notes = form.querySelector(".returns-notes").value.trim();
        const msg = form.querySelector(".returns-msg");
        const btn = form.querySelector('button[type="submit"]');
        msg.textContent = "";
        btn.disabled = true;
        try {
            const { error } = await supabaseClient.rpc("request_customer_return", {
                order_id: id, reason_code: code, notes: notes || null
            });
            if (error) throw error;
            await load();
        } catch (err) {
            msg.textContent = (err && err.message) ? err.message : "حصل خطأ، حاول تاني";
            btn.disabled = false;
        }
    });

    async function load() {
        const { data: sess } = await supabaseClient.auth.getSession();
        const uid = sess && sess.session && sess.session.user && sess.session.user.id;
        if (!uid) return;
        const { data, error } = await supabaseClient
            .from("orders").select("*").eq("customer_id", uid)
            .order("created_at", { ascending: false });
        if (error) {
            listEl.innerHTML = `<div class="account-empty"><p>تعذر تحميل الطلبات</p></div>`;
            return;
        }
        orders = data || [];
        render();
    }

    window.addEventListener("load", () => { if (window.supabaseClient || typeof supabaseClient !== "undefined") load(); });
})();
