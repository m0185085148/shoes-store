// STEP Store - "تتبّع طلب" popup. Any link to track.html opens this small form; submitting goes to the result screen.
// Order number and phone travel in sessionStorage (not in the address bar) and are removed as soon as track.html reads them.
(function () {
    if (window.__stepTrackModal) return;
    window.__stepTrackModal = true;
    var KEY = "step_track_lookup";
    var onTrack = !!document.getElementById("trackForm");

    var css = document.createElement("style");
    css.textContent =
        "#tm-ov{position:fixed;inset:0;z-index:99999;background:rgba(14,22,42,.6);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:16px;direction:rtl;font-family:inherit}" +
        "#tm-ov.open{display:flex}" +
        "#tm-ov.open .tm-box{animation:tmIn .22s ease-out}" +
        "@keyframes tmIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}" +
        ".tm-box{position:relative;background:#fff;border-radius:26px;width:100%;max-width:410px;overflow:hidden;box-shadow:0 36px 90px rgba(10,16,32,.5)}" +
        ".tm-top{position:relative;background:radial-gradient(120% 140% at 85% 0%,#25427a 0%,#14213D 55%,#0f1a31 100%);padding:28px 24px 30px;text-align:center;color:#fff}" +
        ".tm-top:after{content:'';position:absolute;inset-inline:0;bottom:-1px;height:18px;background:#fff;border-radius:22px 22px 0 0}" +
        ".tm-badge{width:60px;height:60px;margin:0 auto 12px;border-radius:20px;background:rgba(127,214,214,.16);border:1px solid rgba(127,214,214,.35);color:#7FD6D6;display:flex;align-items:center;justify-content:center;font-size:25px}" +
        ".tm-box h2{margin:0 0 4px;font-size:22px;color:#fff;font-weight:800}" +
        ".tm-box p.tm-sub{margin:0;font-size:13px;color:#BFCBE3}" +
        ".tm-x{position:absolute;top:12px;left:12px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:20px;line-height:1;cursor:pointer}" +
        ".tm-x:hover{background:rgba(255,255,255,.26)}" +
        ".tm-body{padding:6px 24px 24px}" +
        ".tm-f{position:relative;margin-bottom:14px}" +
        ".tm-f label{display:block;font-size:12.5px;font-weight:800;color:#14213D;margin-bottom:7px}" +
        ".tm-f i{position:absolute;inset-inline-start:15px;bottom:16px;color:#1F8A8A;font-size:15px;pointer-events:none}" +
        ".tm-box input{width:100%;box-sizing:border-box;border:1.5px solid #E6E2D8;background:#F7F5F0;border-radius:14px;padding:14px 16px;padding-inline-start:42px;font:inherit;font-size:16px;font-weight:700;color:#14213D;outline:0;text-align:start;transition:border-color .15s,box-shadow .15s,background .15s}" +
        ".tm-box input::placeholder{font-weight:500;color:#a6a9b3}" +
        ".tm-box input:focus{border-color:#1F8A8A;box-shadow:0 0 0 4px rgba(31,138,138,.15);background:#fff}" +
        ".tm-err{color:#b42318;background:#FDECEA;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:700;margin:0 0 12px}" +
        ".tm-err:empty{display:none}" +
        ".tm-go{width:100%;border:0;border-radius:14px;background:linear-gradient(135deg,#1F8A8A,#17706f);color:#fff;font:inherit;font-weight:800;font-size:16px;padding:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 24px rgba(31,138,138,.32);transition:transform .12s,box-shadow .12s}" +
        ".tm-go:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(31,138,138,.38)}" +
        ".tm-hint{margin:16px 0 0;display:flex;gap:9px;align-items:flex-start;background:#F7F5F0;border-radius:12px;padding:11px 13px;font-size:12px;color:#5b6270;line-height:1.8}" +
        ".tm-hint i{color:#1F8A8A;font-size:16px;margin-top:3px}" +
        ".tm-hint strong{color:#14213D}" +
        "body.tm-lock{overflow:hidden}" +
        ".tm-again-wrap{max-width:760px;margin:0 auto 14px;display:flex;justify-content:center}" +
        ".tm-again{display:inline-flex;align-items:center;gap:8px;border:1.5px solid #14213D;background:#fff;color:#14213D;border-radius:12px;padding:11px 20px;font:inherit;font-weight:800;font-size:14px;cursor:pointer}" +
        ".tm-again:hover{background:#14213D;color:#fff}" +
        "body.tm-page .track-search-card{display:none!important}" +
        "body.tm-page .track-wrapper{margin-top:-34px!important}";
    document.head.appendChild(css);

    function digits(s) {
        return String(s || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
    }

    var ov = null;
    function build() {
        ov = document.createElement("div");
        ov.id = "tm-ov";
        ov.setAttribute("role", "dialog");
        ov.setAttribute("aria-modal", "true");
        ov.setAttribute("aria-labelledby", "tm-t");
        ov.innerHTML =
            '<div class="tm-box">' +
            '<div class="tm-top">' +
            '<button type="button" class="tm-x" aria-label="إغلاق">&times;</button>' +
            '<div class="tm-badge"><i class="fa-solid fa-truck-fast"></i></div>' +
            '<h2 id="tm-t">تتبّع طلبك</h2>' +
            '<p class="tm-sub">اعرف حالة طلبك من غير ما تحتاج تسجيل دخول</p>' +
            '</div>' +
            '<div class="tm-body"><form novalidate>' +
            '<div class="tm-f"><label for="tm-id">رقم الطلب</label><input id="tm-id" inputmode="numeric" autocomplete="off" placeholder="مثال: 123"><i class="fa-solid fa-hashtag"></i></div>' +
            '<div class="tm-f"><label for="tm-ph">رقم الهاتف</label><input id="tm-ph" inputmode="tel" autocomplete="tel" maxlength="11" placeholder="01xxxxxxxxx"><i class="fa-solid fa-phone"></i></div>' +
            '<div class="tm-err" role="alert"></div>' +
            '<button type="submit" class="tm-go"><i class="fa-solid fa-magnifying-glass" style="position:static;color:#fff"></i> تتبّع الطلب</button>' +
            '</form>' +
            '<div class="tm-hint"><i class="fa-brands fa-whatsapp"></i><span>رقم الطلب هتلاقيه في رسالة التأكيد اللي وصلتلك على <strong>واتساب</strong> أو في الإيميل</span></div>' +
            '</div></div>';
        document.body.appendChild(ov);
        ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
        ov.querySelector(".tm-x").addEventListener("click", close);
        ov.querySelector("form").addEventListener("submit", submit);
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.classList.contains("open")) close(); });
    }

    function open() {
        if (!ov) build();
        ov.classList.add("open");
        document.body.classList.add("tm-lock");
        setTimeout(function () { var f = document.getElementById("tm-id"); if (f) f.focus(); }, 50);
    }
    function close() {
        if (!ov) return;
        ov.classList.remove("open");
        document.body.classList.remove("tm-lock");
    }

    function submit(e) {
        e.preventDefault();
        var id = digits(document.getElementById("tm-id").value).trim();
        var ph = digits(document.getElementById("tm-ph").value).trim();
        var err = ov.querySelector(".tm-err");
        if (!id || !ph) { err.textContent = "اكتب رقم الطلب ورقم الهاتف"; return; }
        if (!/^[0-9]+$/.test(id)) { err.textContent = "رقم الطلب أرقام بس"; return; }
        if (!/^01[0-9]{9}$/.test(ph)) { err.textContent = "رقم الهاتف لازم يبدأ ب 01 ويكون 11 رقم"; return; }
        err.textContent = "";
        if (onTrack && document.getElementById("trackForm")) {
            runLookup(id, ph);
            close();
        } else {
            try { sessionStorage.setItem(KEY, JSON.stringify({ id: id, phone: ph })); } catch (x) { /* fall through */ }
            location.href = "track.html";
        }
    }

    function runLookup(id, ph) {
        var o = document.getElementById("orderId"), p = document.getElementById("phone"), f = document.getElementById("trackForm");
        if (!o || !p || !f) return;
        o.value = id; p.value = ph;
        if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event("submit", { cancelable: true }));
    }

    // any link to track.html opens the popup
    document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest('a[href="track.html"]');
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        open();
    }, true);

    if (onTrack) {
        document.body.classList.add("tm-page");
        var q = new URLSearchParams(location.search);
        var hasParams = q.get("id") && q.get("phone");
        var wrap = document.querySelector(".track-wrapper");
        if (wrap) {
            var row = document.createElement("div");
            row.className = "tm-again-wrap";
            row.innerHTML = '<button type="button" class="tm-again"><i class="fa-solid fa-magnifying-glass"></i> <span class="tm-again-t">تتبّع طلب</span></button>';
            wrap.insertBefore(row, wrap.firstChild);
            row.querySelector("button").addEventListener("click", open);
            var res = document.getElementById("trackResult");
            if (res) new MutationObserver(function () {
                row.querySelector(".tm-again-t").textContent = res.classList.contains("show") ? "تتبّع طلب آخر" : "تتبّع طلب";
            }).observe(res, { attributes: true, attributeFilter: ["class"] });
        }
        window.addEventListener("load", function () {
            var saved = null;
            try { saved = JSON.parse(sessionStorage.getItem(KEY) || "null"); sessionStorage.removeItem(KEY); } catch (x) { saved = null; }
            if (saved && saved.id && saved.phone) runLookup(saved.id, saved.phone);
            else if (!hasParams) open();   // opened track.html directly: ask for the details right away
        });
    }
})();
