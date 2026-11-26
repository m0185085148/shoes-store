// STEP Store - Security settings (account-security.html): change password through Supabase Auth.
(function () {
    const form = document.getElementById("securityForm");
    if (!form) return;
    const msg = document.getElementById("securityMsg");
    const btn = document.getElementById("securityBtn");
    const show = (t, cls) => { msg.textContent = t || ""; msg.className = "set-msg" + (cls ? " " + cls : ""); };

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const cur = form.current.value, next = form.next.value, again = form.again.value;
        if (!cur || !next) { show("من فضلك املأ كل الخانات", "bad"); return; }
        if (next.length < 6) { show("كلمة المرور الجديدة لازم تكون 6 أحرف على الأقل", "bad"); return; }
        if (next !== again) { show("كلمة المرور الجديدة والتأكيد مش متطابقين", "bad"); return; }
        if (next === cur) { show("كلمة المرور الجديدة لازم تختلف عن الحالية", "bad"); return; }
        btn.disabled = true;
        show("");
        try {
            const { data: sess } = await supabaseClient.auth.getSession();
            const email = sess && sess.session && sess.session.user && sess.session.user.email;
            if (!email) { show("سجّل الدخول الأول", "bad"); btn.disabled = false; return; }
            const check = await supabaseClient.auth.signInWithPassword({ email, password: cur });
            if (check.error) { show("كلمة المرور الحالية غلط", "bad"); btn.disabled = false; return; }
            const { error } = await supabaseClient.auth.updateUser({ password: next });
            if (error) { show("ماقدرناش نغيّر كلمة المرور، حاول تاني", "bad"); btn.disabled = false; return; }
            form.reset();
            show("تم تغيير كلمة المرور", "ok");
        } catch (err) {
            show("حصل خطأ، حاول تاني", "bad");
        }
        btn.disabled = false;
    });
})();
