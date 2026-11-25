// Manual account-link request (customer side). Calls request_account_link / get_my_link_claim only.
(function () {
  const STORE_WA = "01120915594";
  const box = document.getElementById("claimBox");
  if (!box || typeof supabaseClient === "undefined" || !supabaseClient) return;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = d => { try { return new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } };

  function renderForm(note) {
    box.innerHTML = `
      <p class="claim-lead">لو كنت طلبت قبل كده من غير حساب، ابعتلنا طلب ربط وهنراجعه بإيدينا. مش هتشوف أي بيانات طلبات قبل ما نوافق.</p>
      ${note ? `<p class="claim-note">${esc(note)}</p>` : ""}
      <form id="claimForm" class="claim-form">
        <label for="claimPhone">رقم الموبايل اللي طلبت بيه</label>
        <input type="tel" id="claimPhone" inputmode="numeric" placeholder="01xxxxxxxxx" required>
        <button type="submit" class="btn-primary" id="claimSubmit">اطلب الربط</button>
      </form>`;
    document.getElementById("claimForm").addEventListener("submit", onSubmit);
  }

  function renderPending(c) {
    box.innerHTML = `
      <p class="claim-lead">طلب الربط اتسجل. كمّل الخطوات دي:</p>
      <ol class="claim-steps">
        <li>افتح واتساب من نفس الرقم اللي طلبت بيه.</li>
        <li>ابعت الكود ده لرقم المتجر <strong dir="ltr">${STORE_WA}</strong></li>
        <li>هنراجع ونوافق، وطلباتك هتظهر هنا.</li>
      </ol>
      <div class="claim-code" dir="ltr" aria-label="كود الربط">${esc(c.code)}</div>
      <p class="claim-meta">الكود صالح لحد ${esc(fmtDate(c.expires_at))}</p>
      <p class="claim-warn">الموافقة على الكود دي معناها إن طلبات الرقم ده تتربط بالحساب اللي طلب الربط. ما تبعتش الكود ده لأي حد، وما تبعتش كود حد تاني ليك.</p>`;
  }

  function renderStatus(c) {
    if (c.status === "pending") return renderPending(c);
    if (c.status === "approved") {
      box.innerHTML = `<p class="claim-ok">تم الربط. ظهر عندك ${esc(c.linked_count || 0)} طلب في "طلباتي".</p>`;
      if (typeof loadCustomerOrders === "function") loadCustomerOrders();
      return;
    }
    if (c.status === "expired") return renderForm("الكود انتهى. تقدر تطلب كود جديد.");
    if (c.status === "rejected") return renderForm("مقدرناش نكمل الربط. تقدر تحاول تاني أو تكلمنا على واتساب.");
    if (c.status === "undone") return renderForm("الربط اتلغى. تقدر تطلب ربط جديد.");
    return renderForm();
  }

  async function onSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("claimSubmit");
    const phone = document.getElementById("claimPhone").value.trim();
    if (!/^(\+?20|0)?1[0-9]{9}$/.test(phone.replace(/[\s-]/g, ""))) return renderForm("اكتب رقم موبايل مصري صحيح.");
    btn.disabled = true;
    const { data, error } = await supabaseClient.rpc("request_account_link", { p_phone: phone });
    if (error || !data) return renderForm("حصلت مشكلة. جرّب تاني بعد شوية.");
    renderPending(data);
  }

  async function init() {
    const { data, error } = await supabaseClient.rpc("get_my_link_claim");
    if (error) return renderForm();
    renderStatus(data || { status: "none" });
  }
  init();
})();
