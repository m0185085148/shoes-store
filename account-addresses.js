// STEP Store - Addresses screen (account-addresses.html)
// Saved delivery addresses per customer. Table: customer_addresses (row-level security: own rows only).
(function () {
    const listEl = document.getElementById("addressList");
    if (!listEl) return;

    const MAX_ADDRESSES = 5;
    const formWrap = document.getElementById("addressFormWrap");
    const form = document.getElementById("addressForm");
    const addBtn = document.getElementById("addAddressBtn");
    const msgEl = document.getElementById("addressMsg");
    const formTitle = document.getElementById("addressFormTitle");
    let uid = null;
    let addresses = [];
    let editingId = null;

    const esc = v => escapeHTML(v);

    function showMsg(text, bad) {
        msgEl.textContent = text || "";
        msgEl.className = "address-msg" + (bad ? " bad" : "");
    }

    function render() {
        addBtn.hidden = addresses.length >= MAX_ADDRESSES || !formWrap.hidden;
        if (!addresses.length) {
            listEl.innerHTML = `
                <div class="account-empty">
                    <i class="fa-solid fa-location-dot"></i>
                    <p>لسه ماضفتش أي عنوان</p>
                    <small>احفظ عنوانك مرة واحدة وهيظهر لك في صفحة إتمام الطلب</small>
                </div>`;
            return;
        }
        listEl.innerHTML = addresses.map(a => `
            <div class="address-card${a.is_default ? " is-default" : ""}" data-id="${Number(a.id)}">
                <div class="address-head">
                    <strong>${esc(a.label || "عنوان")}</strong>
                    ${a.is_default ? '<span class="address-badge">العنوان الأساسي</span>' : ""}
                </div>
                <div class="address-line">${esc(a.governorate)}${a.city ? " - " + esc(a.city) : ""}</div>
                <div class="address-line">${esc(a.address)}</div>
                <div class="address-actions">
                    ${a.is_default ? "" : `<button type="button" class="addr-link" data-act="default">تعيين كأساسي</button>`}
                    <button type="button" class="addr-link" data-act="edit">تعديل</button>
                    <button type="button" class="addr-link danger" data-act="delete">حذف</button>
                </div>
            </div>`).join("");
    }

    form.governorate.addEventListener("change", () => fillAreas(form.governorate.value, ""));

    function fillAreas(gov, keep) {
        const sel = form.city;
        const list = (window.STORE_AREAS && window.STORE_AREAS[gov]) || [];
        sel.innerHTML = "";
        const first = document.createElement("option");
        first.value = ""; first.textContent = gov ? "اختر المنطقة" : "اختر المحافظة أولاً";
        sel.appendChild(first);
        const all = keep && list.indexOf(keep) < 0 ? [keep].concat(list) : list;
        all.forEach(n => { const o = document.createElement("option"); o.value = n; o.textContent = n; sel.appendChild(o); });
        sel.value = keep || "";
    }

    function openForm(a) {
        editingId = a ? a.id : null;
        formTitle.textContent = a ? "تعديل العنوان" : "إضافة عنوان جديد";
        form.label.value = a ? (a.label || "") : "";
        form.governorate.value = a ? a.governorate : "";
        fillAreas(form.governorate.value, a ? (a.city || "") : "");
        form.address.value = a ? a.address : "";
        form.is_default.checked = a ? !!a.is_default : addresses.length === 0;
        showMsg("");
        formWrap.hidden = false;
        addBtn.hidden = true;
        form.label.focus();
    }
    function closeForm() {
        formWrap.hidden = true;
        editingId = null;
        render();
    }

    async function load() {
        const { data: sess } = await supabaseClient.auth.getSession();
        uid = sess && sess.session && sess.session.user && sess.session.user.id;
        if (!uid) return;
        const { data, error } = await supabaseClient
            .from("customer_addresses").select("*").eq("customer_id", uid)
            .order("is_default", { ascending: false }).order("created_at", { ascending: false });
        if (error) {
            listEl.innerHTML = `<div class="account-empty"><p>تعذر تحميل العناوين</p></div>`;
            return;
        }
        addresses = data || [];
        render();
    }

    // only one default per customer
    async function clearOtherDefaults(exceptId) {
        for (const a of addresses) {
            if (a.is_default && a.id !== exceptId) {
                await supabaseClient.from("customer_addresses")
                    .update({ is_default: false }).eq("id", a.id).eq("customer_id", uid);
            }
        }
    }

    addBtn.addEventListener("click", () => openForm(null));
    document.getElementById("addressCancelBtn").addEventListener("click", closeForm);

    listEl.addEventListener("click", async e => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const card = btn.closest("[data-id]");
        const id = Number(card.dataset.id);
        const a = addresses.find(x => Number(x.id) === id);
        if (!a) return;
        const act = btn.dataset.act;
        if (act === "edit") { openForm(a); return; }
        btn.disabled = true;
        try {
            if (act === "default") {
                await clearOtherDefaults(id);
                const { error } = await supabaseClient.from("customer_addresses")
                    .update({ is_default: true }).eq("id", id).eq("customer_id", uid);
                if (error) throw error;
            } else if (act === "delete") {
                if (!confirm("هل تريد حذف هذا العنوان؟")) { btn.disabled = false; return; }
                const { error } = await supabaseClient.from("customer_addresses")
                    .delete().eq("id", id).eq("customer_id", uid);
                if (error) throw error;
                // keep one default if any address remains
                if (a.is_default) {
                    const rest = addresses.filter(x => Number(x.id) !== id);
                    if (rest.length) {
                        await supabaseClient.from("customer_addresses")
                            .update({ is_default: true }).eq("id", rest[0].id).eq("customer_id", uid);
                    }
                }
            }
            await load();
        } catch (err) {
            btn.disabled = false;
            alert("حصل خطأ، حاول تاني");
        }
    });

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const row = {
            label: form.label.value.trim() || null,
            governorate: form.governorate.value,
            city: form.city.value || null,
            address: form.address.value.trim(),
            is_default: form.is_default.checked
        };
        if (!row.governorate || !row.city || row.address.length < 5) {
            showMsg("من فضلك اختر المحافظة والمنطقة واكتب العنوان بالتفصيل", true);
            return;
        }
        const saveBtn = document.getElementById("addressSaveBtn");
        saveBtn.disabled = true;
        try {
            if (row.is_default) await clearOtherDefaults(editingId);
            if (editingId) {
                const { error } = await supabaseClient.from("customer_addresses")
                    .update(row).eq("id", editingId).eq("customer_id", uid);
                if (error) throw error;
            } else {
                if (addresses.length >= MAX_ADDRESSES) throw new Error("max");
                if (!addresses.length) row.is_default = true;
                const { error } = await supabaseClient.from("customer_addresses")
                    .insert({ ...row, customer_id: uid });
                if (error) throw error;
            }
            formWrap.hidden = true;
            editingId = null;
            await load();
        } catch (err) {
            showMsg("حصل خطأ، حاول تاني", true);
        }
        saveBtn.disabled = false;
    });

    window.addEventListener("load", load);
})();
