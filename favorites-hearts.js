// STEP Store - Favorite hearts on product cards and the product page.
// Saves to customer_favorites (RLS: own rows). Guests are sent to the login page. Adds only a button; it does not touch cart or checkout code.
(function () {
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;

    const st = document.createElement("style");
    st.textContent = `
.fav-heart{position:absolute;top:12px;left:12px;z-index:3;width:38px;height:38px;border-radius:50%;border:0;background:#fff;color:#14213D;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .15s}
.fav-heart:hover{transform:scale(1.08)}
.fav-heart.on{color:#c2334d}
.fav-heart:focus-visible{outline:2px solid #14213D;outline-offset:2px}`;
    document.head.appendChild(st);

    let uid = null;
    let ids = new Set();
    let ready = false;

    function idFromHref(href) {
        const m = /[?&]id=(\d+)/.exec(href || "");
        return m ? Number(m[1]) : null;
    }

    function paint(btn) {
        const on = ids.has(Number(btn.dataset.pid));
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.setAttribute("aria-label", on ? "إزالة من المفضلة" : "إضافة للمفضلة");
        btn.innerHTML = `<i class="fa-${on ? "solid" : "regular"} fa-heart"></i>`;
    }

    function makeBtn(pid) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "fav-heart";
        b.dataset.pid = String(pid);
        paint(b);
        return b;
    }

    function attach() {
        document.querySelectorAll(".product-card").forEach(card => {
            const host = card.querySelector(".product-image");
            if (!host || host.querySelector(".fav-heart")) return;
            const link = card.querySelector("a.product-image-link, a[href*='product.html']");
            const pid = idFromHref(link && link.getAttribute("href"));
            if (pid) host.appendChild(makeBtn(pid));
        });
        const det = document.querySelector(".product-details-image");
        if (det && !det.querySelector(".fav-heart")) {
            const pid = idFromHref(location.search);
            if (pid) {
                if (getComputedStyle(det).position === "static") det.style.position = "relative";
                det.appendChild(makeBtn(pid));
            }
        }
    }

    document.addEventListener("click", async e => {
        const btn = e.target.closest(".fav-heart");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        if (!uid) { location.href = "account-login.html"; return; }
        const pid = Number(btn.dataset.pid);
        const had = ids.has(pid);
        if (had) ids.delete(pid); else ids.add(pid);
        document.querySelectorAll('.fav-heart[data-pid="' + pid + '"]').forEach(paint);
        const res = had
            ? await supabaseClient.from("customer_favorites").delete().eq("customer_id", uid).eq("product_id", pid)
            : await supabaseClient.from("customer_favorites").insert({ customer_id: uid, product_id: pid });
        if (res.error && !(res.error.code === "23505")) {
            if (had) ids.add(pid); else ids.delete(pid);
            document.querySelectorAll('.fav-heart[data-pid="' + pid + '"]').forEach(paint);
        }
    }, true);

    let queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; attach(); });
    }
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });

    async function init() {
        try {
            const { data: sess } = await supabaseClient.auth.getSession();
            uid = sess && sess.session && sess.session.user && sess.session.user.id;
            if (uid) {
                const { data } = await supabaseClient.from("customer_favorites").select("product_id").eq("customer_id", uid);
                ids = new Set((data || []).map(r => Number(r.product_id)));
            }
        } catch (e) { /* guests and errors: hearts stay empty */ }
        ready = true;
        document.querySelectorAll(".fav-heart").forEach(paint);
        attach();
    }
    attach();
    window.addEventListener("load", init);
})();
