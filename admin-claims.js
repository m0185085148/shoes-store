// Admin screen for manual account-link requests. Calls admin_list_link_claims / admin_decide_link_claim / admin_undo_link_claim only.
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = d => { try { return new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } };
  const STATUS = { pending: "بانتظار المراجعة", approved: "تمت الموافقة", rejected: "مرفوض", expired: "منتهي", undone: "اتلغى" };
  const root = () => document.getElementById("claimsList");
  const cl = () => (typeof getSupabaseClient === "function" ? getSupabaseClient() : null);

  // badge count at page load, without opening the tab
  (function waitAdmin(n){ if (window.currentAdmin) { if (window.loadLinkClaims) window.loadLinkClaims(true); } else if (n < 40) setTimeout(() => waitAdmin(n + 1), 500); })(0);

  window.loadLinkClaims = async function (quiet) {
    const el = root(); const client = cl();
    if (!el || !client) return;
    if (!quiet) el.innerHTML = '<p class="claims-empty">جاري التحميل...</p>';
    const { data, error } = await client.rpc("admin_list_link_claims");
    if (error) { el.innerHTML = '<p class="claims-empty">مقدرناش نحمّل الطلبات.</p>'; return; }
    const rows = data || [];
    const pend = rows.filter(r => r.status === "pending").length;
    const badge = document.getElementById("sidebarClaimsBadge");
    if (badge) { badge.textContent = pend; badge.style.display = pend ? "" : "none"; }
    if (!rows.length) { el.innerHTML = '<p class="claims-empty">مفيش طلبات ربط.</p>'; return; }
    el.innerHTML = rows.map(card).join("");
  };

  function card(r) {
    const warn = Number(r.orders_linked_to_other_accounts) > 0
      ? `<p class="claim-alert">تنبيه: في ${esc(r.orders_linked_to_other_accounts)} طلب على الرقم ده مربوط بحساب تاني. راجع كويس قبل الموافقة.</p>` : "";
    const head = `
      <div class="claim-row-head"><strong dir="ltr">${esc(r.claimed_phone)}</strong><span class="claim-status s-${esc(r.status)}">${esc(STATUS[r.status] || r.status)}</span></div>
      <p class="claim-row-meta">اتطلب ${esc(fmt(r.created_at))}</p>
      ${r.status === "pending" ? `<p class="claim-row-meta">الكود المتوقع:</p><div class="claim-code-adm" dir="ltr">${esc(r.code)}</div>
      <p class="claim-row-meta">طلبات ضيف مش مربوطة: <b>${esc(r.unlinked_orders)}</b></p>${warn}` : ""}`;
    let body = "";
    if (r.status === "pending") {
      body = `
        <div class="claim-inputs">
          <label>رقم اللي بعت على واتساب</label><input type="tel" dir="ltr" class="c-sender" placeholder="01xxxxxxxxx">
          <label>الكود زي ما وصل</label><input type="text" dir="ltr" class="c-code" placeholder="ST-XXXXXXXX">
          <p class="claim-hint">وافق بس لو الرسالة وصلت على واتساب المتجر من نفس رقم الطلب، والكود مطابق.</p>
        </div>
        <div class="claim-actions"><button type="button" class="c-approve">موافقة</button><button type="button" class="c-reject">رفض</button></div>`;
    } else if (r.status === "approved") {
      body = `<p class="claim-row-meta">اتربط ${esc(r.linked_count || 0)} طلب.</p><div class="claim-actions"><button type="button" class="c-undo">تراجع عن الربط</button></div>`;
    }
    return `<div class="claim-row" data-id="${esc(r.claim_id)}">${head}${body}<p class="claim-msg" role="status"></p></div>`;
  }

  async function act(row, fn) {
    const msg = row.querySelector(".claim-msg"); msg.textContent = "";
    row.querySelectorAll("button").forEach(b => b.disabled = true);
    const { data, error } = await fn(cl());
    if (error) {
      msg.textContent = /not match|mismatch|does not/i.test(error.message || "") ? "البيانات مش مطابقة للطلب." : "ماتمش: " + (error.message || "خطأ");
      row.querySelectorAll("button").forEach(b => b.disabled = false);
      return;
    }
    await window.loadLinkClaims();
  }

  document.addEventListener("click", e => {
    const row = e.target.closest && e.target.closest(".claim-row");
    if (!row) return;
    const id = Number(row.dataset.id);
    if (e.target.classList.contains("c-approve")) {
      const sender = row.querySelector(".c-sender").value.trim(), code = row.querySelector(".c-code").value.trim();
      if (!sender || !code) { row.querySelector(".claim-msg").textContent = "اكتب رقم المرسل والكود الأول."; return; }
      act(row, c => c.rpc("admin_decide_link_claim", { p_claim_id: id, p_decision: "approve", p_sender_phone: sender, p_code: code, p_reason: null }));
    } else if (e.target.classList.contains("c-reject")) {
      act(row, c => c.rpc("admin_decide_link_claim", { p_claim_id: id, p_decision: "reject", p_sender_phone: null, p_code: null, p_reason: "rejected by admin" }));
    } else if (e.target.classList.contains("c-undo")) {
      if (!confirm("تأكيد التراجع عن الربط؟")) return;
      act(row, c => c.rpc("admin_undo_link_claim", { p_claim_id: id }));
    }
  });
})();
