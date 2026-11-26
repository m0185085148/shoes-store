// STEP Store - Favorites (account-favorites.html). Table: customer_favorites (RLS: own rows only). Products are read from the public products table.
(function () {
    const box = document.getElementById("favList");
    if (!box) return;
    const esc = v => escapeHTML(v);
    let uid = null;

    function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

    function render(items) {
        if (!items.length) {
            box.innerHTML = `<div class="account-empty"><i class="fa-regular fa-heart"></i><p>مفيش منتجات في المفضلة لسه</p><small>اضغط على القلب في أي منتج وهتلاقيه هنا</small><br><a class="addr-link" href="index.html#productsSection" style="display:inline-block;margin-top:12px">تصفّح الأحذية</a></div>`;
            return;
        }
        box.innerHTML = `<div class="fav-grid">${items.map(p => {
            const img = (p.image || "").replace(/["'()\\]/g, "");
            return `<div class="fav-card" data-id="${Number(p.id)}">
                <a class="fav-img" href="product.html?id=${Number(p.id)}" style="background-image:url('${img}')" aria-label="${esc(p.name)}">
                    <button type="button" class="fav-remove" data-act="remove" aria-label="إزالة من المفضلة"><i class="fa-solid fa-heart"></i></button>
                </a>
                <div class="fav-info">
                    <a href="product.html?id=${Number(p.id)}">${esc(p.name)}</a>
                    <div class="fav-price"><bdi>${fmt(p.price)}</bdi> جنيه${p.old_price ? ` <s><bdi>${fmt(p.old_price)}</bdi></s>` : ""}</div>
                    <a class="fav-open" href="product.html?id=${Number(p.id)}">عرض المنتج</a>
                </div>
            </div>`;
        }).join("")}</div>`;
    }

    async function load() {
        const { data: sess } = await supabaseClient.auth.getSession();
        uid = sess && sess.session && sess.session.user && sess.session.user.id;
        if (!uid) return;
        const fav = await supabaseClient.from("customer_favorites").select("product_id").eq("customer_id", uid).order("created_at", { ascending: false });
        if (fav.error) { box.innerHTML = '<div class="account-empty"><p>ماقدرناش نحمّل المفضلة، حاول تاني</p></div>'; return; }
        const ids = (fav.data || []).map(r => Number(r.product_id));
        if (!ids.length) { render([]); return; }
        const pr = await supabaseClient.from("products").select("id,name,price,old_price,image").in("id", ids);
        if (pr.error) { box.innerHTML = '<div class="account-empty"><p>ماقدرناش نحمّل المنتجات، حاول تاني</p></div>'; return; }
        const byId = {}; (pr.data || []).forEach(p => { byId[Number(p.id)] = p; });
        render(ids.map(i => byId[i]).filter(Boolean));
    }

    box.addEventListener("click", async e => {
        const btn = e.target.closest("[data-act=remove]");
        if (!btn) return;
        e.preventDefault();
        const card = btn.closest(".fav-card");
        const id = Number(card.dataset.id);
        btn.disabled = true;
        const { error } = await supabaseClient.from("customer_favorites").delete().eq("customer_id", uid).eq("product_id", id);
        if (error) { btn.disabled = false; return; }
        card.remove();
        if (!box.querySelector(".fav-card")) render([]);
    });

    window.addEventListener("load", load);
})();
