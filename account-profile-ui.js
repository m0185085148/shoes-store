// STEP Store - Profile screen: login email, pencil-to-edit fields, first/last name <-> full_name,
// and birth date / gender / nationality. Saving name and phone is still done by account.js (same form).
(function () {
    const form = document.getElementById("profileForm");
    if (!form) return;
    const $ = id => document.getElementById(id);
    const bar = $("pfSaveBar");
    const msg = $("profileMessage");
    let userId = null;

    // years: newest first, from 16 years ago back to 1940
    (function fillYears() {
        const sel = $("birthYear");
        const top = new Date().getFullYear() - 16;
        for (let y = top; y >= 1940; y--) { const o = document.createElement("option"); o.value = y; o.textContent = y; sel.appendChild(o); }
    })();

    const controls = w => Array.from(w.querySelectorAll("input,select,textarea"));
    function unlock(w) {
        w.classList.add("editing");
        controls(w).forEach(f => { f.removeAttribute("readonly"); f.disabled = false; });
        bar.hidden = false;
        const f = controls(w)[0]; if (f) f.focus();
    }
    function lockAll() {
        form.querySelectorAll(".pf-edit").forEach(w => {
            w.classList.remove("editing");
            controls(w).forEach(f => { if (f.tagName === "SELECT") f.disabled = true; else f.setAttribute("readonly", ""); });
        });
        bar.hidden = true;
    }
    form.addEventListener("click", e => {
        const w = e.target.closest(".pf-edit");
        if (w && !w.classList.contains("editing")) unlock(w);
    });
    $("pfCancel").addEventListener("click", () => location.reload());

    // first/last name <-> full_name (account.js reads and saves #fullName)
    function syncFull() { $("fullName").value = ($("firstName").value.trim() + " " + $("lastName").value.trim()).trim(); }
    $("firstName").addEventListener("input", syncFull);
    $("lastName").addEventListener("input", syncFull);
    let tries = 0;
    const splitTimer = setInterval(() => {
        const v = $("fullName").value.trim();
        if (v || ++tries > 40) {
            clearInterval(splitTimer);
            if (v) { const i = v.indexOf(" "); $("firstName").value = i < 0 ? v : v.slice(0, i); $("lastName").value = i < 0 ? "" : v.slice(i + 1).trim(); }
        }
    }, 150);

    function birthValue() {
        const d = $("birthDay").value, m = $("birthMonth").value, y = $("birthYear").value;
        if (!d && !m && !y) return { ok: true, v: null };
        if (!d || !m || !y) return { ok: false };
        const dt = new Date(Date.UTC(+y, +m - 1, +d));
        if (dt.getUTCFullYear() !== +y || dt.getUTCMonth() !== +m - 1 || dt.getUTCDate() !== +d) return { ok: false };
        return { ok: true, v: y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0") };
    }
    function say(t) { if (msg) { msg.textContent = t; msg.className = "auth-message show"; } }

    // runs before account.js's own submit handler
    form.addEventListener("submit", async e => {
        syncFull();
        const b = birthValue();
        if (!b.ok) { e.stopImmediatePropagation(); e.preventDefault(); say("كمّل تاريخ الميلاد (اليوم والشهر والسنة) أو سيبه فاضي"); return; }
        if (!userId) return;
        try {
            const { error } = await supabaseClient.from("customer_profiles")
                .update({ birth_date: b.v, gender: $("gender").value || null, nationality: $("nationality").value || null })
                .eq("id", userId);
            if (error) throw error;
        } catch (x) { console.warn("Profile extras save error:", x); say("تعذّر حفظ تاريخ الميلاد أو النوع أو الجنسية"); }
    }, true);

    // after account.js reports a successful save, lock the fields again
    if (msg) new MutationObserver(() => { if (msg.classList.contains("success")) setTimeout(lockAll, 400); })
        .observe(msg, { attributes: true, childList: true, characterData: true, subtree: true });

    window.addEventListener("load", async () => {
        try {
            const { data } = await supabaseClient.auth.getSession();
            const u = data && data.session && data.session.user;
            if (!u) return;
            userId = u.id;
            if (u.email) $("profileEmail").value = u.email;
            const r = await supabaseClient.from("customer_profiles").select("birth_date,gender,nationality").eq("id", u.id).maybeSingle();
            const p = r && r.data;
            if (p) {
                if (p.birth_date) { const [y, m, d] = String(p.birth_date).split("-"); $("birthYear").value = String(+y); $("birthMonth").value = String(+m); $("birthDay").value = String(+d); }
                if (p.gender) $("gender").value = p.gender;
                if (p.nationality) $("nationality").value = p.nationality;
            }
        } catch (x) { /* leave empty */ }
    });
})();
