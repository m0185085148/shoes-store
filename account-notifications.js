// STEP Store - Notification preferences (account-notifications.html). Table: customer_prefs (RLS: own row only).
(function () {
    const form = document.getElementById("prefForm");
    if (!form) return;
    const msg = document.getElementById("prefMsg");
    let uid = null;
    const show = (t, cls) => { msg.textContent = t || ""; msg.className = "set-msg" + (cls ? " " + cls : ""); };

    async function load() {
        const { data: sess } = await supabaseClient.auth.getSession();
        uid = sess && sess.session && sess.session.user && sess.session.user.id;
        if (!uid) return;
        const { data, error } = await supabaseClient.from("customer_prefs").select("order_updates,offers").eq("customer_id", uid).maybeSingle();
        if (error) { show("ماقدرناش نحمّل تفضيلاتك", "bad"); return; }
        form.order_updates.checked = data ? !!data.order_updates : true;
        form.offers.checked = data ? !!data.offers : false;
    }

    form.addEventListener("change", async () => {
        if (!uid) return;
        show("");
        const { error } = await supabaseClient.from("customer_prefs").upsert({
            customer_id: uid,
            order_updates: form.order_updates.checked,
            offers: form.offers.checked,
            updated_at: new Date().toISOString()
        }, { onConflict: "customer_id" });
        if (error) show("ماقدرناش نحفظ التغيير، حاول تاني", "bad");
        else show("تم حفظ تفضيلاتك", "ok");
    });

    window.addEventListener("load", load);
})();
