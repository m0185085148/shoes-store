// STEP storefront v2: additive behaviour on top of script.js (cart summary, undo, size guide, sticky buy bar, hero photo).
(function () {
  // Store WhatsApp (number given by the store owner for manual claim/size questions). Confirm before publishing.
  var WA = 'https://wa.me/201120915594';
  // Size chart per product id: { "<productId>": { "40": "24.6", ... } }. Intentionally empty until the real box/label
  // sizes and foot lengths are confirmed by the store. While empty the guide shows measuring steps only.
  var SIZE_CHART = window.STEP_SIZE_CHART || {};
  var shipping = function () { return (typeof FLAT_SHIPPING_COST !== 'undefined') ? FLAT_SHIPPING_COST : 80; };
  var fmt = function (n) { return Number(n || 0).toLocaleString('en-US'); };

  // ---- cart summary with shipping line ----
  var origRender = window.renderCartModal;
  if (typeof origRender === 'function') {
    window.renderCartModal = function () {
      origRender.apply(this, arguments);
      var footer = document.querySelector('.cart-footer');
      if (!footer) return;
      var sum = footer.querySelector('.cart-summary');
      var has = typeof cart !== 'undefined' && cart.length;
      var cb = footer.querySelector('.checkout-btn'); if (cb) { cb.disabled = !has; cb.style.display = has ? '' : 'none'; }
      if (!has) { if (sum) sum.remove(); footer.querySelector('.cart-help')?.remove(); return; }
      var sub = cart.reduce(function (s, i) { return s + Number(i.price) * Number(i.quantity); }, 0);
      var sh = shipping();
      if (!sum) {
        sum = document.createElement('div'); sum.className = 'cart-summary';
        footer.insertBefore(sum, footer.querySelector('.checkout-btn'));
      }
      sum.innerHTML = '<div><span>المنتجات</span><span>' + fmt(sub) + ' جنيه</span></div>' +
        '<div><span>الشحن (القاهرة والجيزة)</span><span>' + fmt(sh) + ' جنيه</span></div>' +
        '<div class="cs-total"><span>الإجمالي</span><span>' + fmt(sub + sh) + ' جنيه</span></div>';
      if (!footer.querySelector('.cart-help')) {
        var h = document.createElement('div'); h.className = 'cart-help';
        h.innerHTML = '<a href="' + WA + '" target="_blank" rel="noopener">اسأل على واتساب</a>';
        footer.appendChild(h);
      }
    };
  }

  // ---- undo for removal (also covers minus at quantity 1) ----
  var origRemove = window.removeFromCart;
  if (typeof origRemove === 'function') {
    window.removeFromCart = function (id, size) {
      var item = (typeof cart !== 'undefined') ? cart.find(function (i) { return i.id === Number(id) && String(i.size) === String(size); }) : null;
      var copy = item ? JSON.parse(JSON.stringify(item)) : null;
      origRemove.apply(this, arguments);
      document.querySelector('.toast-notification')?.remove();
      if (!copy) return;
      document.querySelector('.undo-toast')?.remove();
      var t = document.createElement('div'); t.className = 'undo-toast';
      t.innerHTML = '<span>تم حذف المنتج</span><button type="button">تراجع</button>';
      t.querySelector('button').onclick = function () { cart.push(copy); updateCartUI(); t.remove(); };
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 6000);
    };
  }

  // ---- size guide sheet ----
  function openGuide(productId) {
    var chart = SIZE_CHART[String(productId)];
    var rows = chart ? Object.keys(chart).map(function (k) { return '<tr><td>' + k + '</td><td>' + chart[k] + '</td></tr>'; }).join('') : '';
    var d = document.createElement('div'); d.className = 'sg-dim';
    d.innerHTML = '<div class="sg-sheet" role="dialog" aria-label="دليل المقاسات"><h4>إزاي تختار مقاسك</h4>' +
      '<ol><li>حط ورقة على الأرض وسند الكعب على الحيطة.</li><li>وقّف رجلك على الورقة وعلّم عند أطول صباع.</li><li>قيس المسافة بالسنتيمتر واسأل المتجر على واتساب عن المقاس المناسب للموديل.</li></ol>' +
      (rows ? '<table><tr><th>المقاس</th><th>طول القدم بالسم</th></tr>' + rows + '</table>' : '') +
      '<div class="sg-note">لو رجلك بين مقاسين أو عريضة، كلمنا على واتساب قبل الطلب.</div>' +
      '<div class="sg-actions"><a href="' + WA + '" target="_blank" rel="noopener">واتساب</a><button type="button">تمام</button></div></div>';
    d.onclick = function (e) { if (e.target === d || e.target.tagName === 'BUTTON') d.remove(); };
    document.body.appendChild(d);
  }

  // ---- product page enhancements, applied when details render ----
  function enhanceProduct() {
    var info = document.querySelector('.product-details-info');
    if (!info || info.dataset.v2) return;
    info.dataset.v2 = '1';
    var grid = document.getElementById('sizeOptionsGrid');
    if (grid) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'size-guide-link'; b.textContent = 'دليل المقاسات';
      b.onclick = function () { openGuide(typeof currentProductId !== 'undefined' ? currentProductId : ''); };
      grid.parentNode.insertBefore(b, grid.nextSibling);
    }
    if (!document.querySelector('.sticky-buy')) {
      var bar = document.createElement('div'); bar.className = 'sticky-buy';
      bar.innerHTML = '<a href="' + WA + '" target="_blank" rel="noopener">واتساب</a><button type="button">إضافة للسلة</button>';
      bar.querySelector('button').onclick = function () { document.getElementById('detailsAddBtn')?.click(); };
      document.body.appendChild(bar); document.body.classList.add('has-sticky-buy');
    }
  }
  var pd = document.getElementById('productDetails');
  if (pd) { new MutationObserver(enhanceProduct).observe(pd, { childList: true, subtree: true }); enhanceProduct(); }

  // ---- hero photo: first catalogue product that has an image ----
  var heroText = document.querySelector('.hero-content');
  if (heroText) {
    var tries = 0, t = setInterval(function () {
      tries++;
      var p = (typeof products !== 'undefined' && products.length) ? products.find(function (x) { return x.image && x.stockBySize && Object.keys(x.stockBySize).some(function (k) { return x.stockBySize[k] > 0; }); }) : null;
      if (p || tries > 40) {
        clearInterval(t);
        if (p && !document.querySelector('.hero-photo')) {
          var w = document.createElement('div'); w.className = 'hero-photo';
          var im = document.createElement('img'); im.src = p.image; im.alt = p.name; w.appendChild(im);
          heroText.appendChild(w);
        }
      }
    }, 250);
  }
})();

(function(){function lab(){var m={searchBtn:'بحث',cartBtn:'السلة'};Object.keys(m).forEach(function(i){var e=document.getElementById(i);if(e)e.setAttribute('data-label',m[i]);});
document.querySelectorAll('.header-actions a.icon-button').forEach(function(a){var h=a.getAttribute('href')||'';if(h.indexOf('track')>-1)a.setAttribute('data-label','تتبع');if(h.indexOf('account')>-1)a.setAttribute('data-label','حسابي');});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',lab);else lab();})();
