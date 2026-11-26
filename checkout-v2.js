// STEP Store - checkout delivery step: neighborhood list, saved addresses, landmark.
// Works on top of the existing form fields (same ids). script.js still builds the order.
(function () {
    var $ = function (id) { return document.getElementById(id); };
    var sheet = $('coSheet');
    if (!sheet || !window.STORE_AREAS_V2) return;

    var MAX_ADDR = 5;
    var gov = $('governorate'), city = $('city'), addr = $('customerAddress');
    var nameF = $('customerName'), phoneF = $('customerPhone');
    var lm = $('coLandmark');
    var combo = $('coCombo'), q = $('coQ');
    var addresses = [], uid = null, mode = 'new', loaded = false;

    function esc(v) { return typeof escapeHTML === 'function' ? escapeHTML(v) : String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function fire(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }
    function areasOf(g) { var d = window.STORE_AREAS_V2[g]; return d ? d.all.slice().sort(function (a, b) { return a.localeCompare(b, 'ar'); }) : []; }
    function validContact() { return nameF.value.trim().length > 0 && /^01[0-9]{9}$/.test(phoneF.value.trim()); }

    // ---- governorate switch + area combo
    function syncUI() {
        var g = gov.value;
        sheet.querySelectorAll('#coSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.g === g); });
        if (g && city.value && areasOf(g).indexOf(city.value) < 0) city.value = '';
        var t = $('coAreaTxt');
        t.textContent = city.value || 'اختار منطقتك';
        t.className = city.value ? '' : 'ph2';
        $('coGovTag').textContent = g || '';
        renderAreas();
    }
    function renderAreas() {
        var g = gov.value, term = q.value.trim();
        var list = areasOf(g).filter(function (a) { return !term || a.indexOf(term) > -1; });
        var ul = $('coAreaList');
        ul.innerHTML = '';
        $('coCnt').textContent = g ? (list.length + ' منطقة في ' + g) : '';
        $('coEmpty').style.display = list.length || !g ? 'none' : 'block';
        list.forEach(function (a) {
            var li = document.createElement('li');
            if (a === city.value) li.className = 'on';
            li.innerHTML = '<span>' + esc(a) + '</span><i class="fa-solid fa-check"></i>';
            li.addEventListener('click', function () {
                city.value = a;
                fire(city, 'input');
                closeCombo();
                syncUI();
                $('coAreaFld').classList.remove('bad');
            });
            ul.appendChild(li);
        });
    }
    function openCombo() {
        if (!gov.value) {
            var s = $('coSeg');
            s.classList.add('bad', 'shake');
            setTimeout(function () { s.classList.remove('shake'); }, 400);
            return;
        }
        combo.classList.add('open');
        sheet.classList.add('sheet-open');
        q.value = '';
        renderAreas();
        setTimeout(function () {
            var on = sheet.querySelector('#coAreaList li.on');
            if (on) on.scrollIntoView({ block: 'center' });
        }, 30);
    }
    function closeCombo() { combo.classList.remove('open'); sheet.classList.remove('sheet-open'); }

    $('coAreaFld').addEventListener('click', function () { combo.classList.contains('open') ? closeCombo() : openCombo(); });
    $('coAreaFld').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCombo(); } });
    $('bk').addEventListener('click', closeCombo);
    q.addEventListener('input', renderAreas);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCombo(); });
    document.addEventListener('click', function (e) {
        if (combo.classList.contains('open') && !combo.contains(e.target)) closeCombo();
    });
    sheet.querySelectorAll('#coSeg button').forEach(function (b) {
        b.addEventListener('click', function () {
            if (gov.value !== b.dataset.g) {
                gov.value = b.dataset.g;
                city.value = '';
                fire(gov, 'change');
                fire(city, 'input');
            }
            $('coSeg').classList.remove('bad');
            syncUI();
        });
    });
    gov.addEventListener('change', syncUI);

    // ---- saved addresses
    function iconFor(label) {
        label = label || '';
        if (/بيت|منزل|سكن/.test(label)) return 'fa-house';
        if (/شغل|عمل|مكتب/.test(label)) return 'fa-briefcase';
        return 'fa-location-dot';
    }
    function renderTickets() {
        var box = $('coTickets');
        var nm = esc(nameF.value.trim()), ph = esc(phoneF.value.trim());
        var html = addresses.map(function (a) {
            return '<div class="tk' + (String(a.id) === String(mode) ? ' sel' : '') + '" data-id="' + Number(a.id) + '" tabindex="0" role="button">' +
                '<div class="top"><span class="chip"><i class="fa-solid ' + iconFor(a.label) + '"></i>' + esc(a.label || 'عنوان') +
                (a.is_default ? '<span class="def">الأساسي</span>' : '') + '</span><span class="ring"><i class="fa-solid fa-check"></i></span></div>' +
                (nm ? '<h4>' + nm + '</h4>' : '') +
                '<div class="area">' + esc(a.city || '') + (a.city ? ' · ' : '') + esc(a.governorate) + '</div>' +
                '<p>' + esc(a.address) + '</p>' +
                (ph ? '<div class="ph"><i class="fa-solid fa-phone"></i><bdi>' + ph + '</bdi></div>' : '') + '</div>';
        }).join('');
        if (addresses.length < MAX_ADDR) {
            html += '<div class="tk add' + (mode === 'new' ? ' sel' : '') + '" data-id="new" tabindex="0" role="button"><span class="plus"><i class="fa-solid fa-plus"></i></span>عنوان جديد</div>';
        }
        box.innerHTML = html;
    }
    function applyMode() {
        var hasSaved = addresses.length > 0;
        $('coSaved').classList.toggle('hide', !hasSaved);
        $('coAddr').classList.toggle('hide', hasSaved && mode !== 'new');
        $('coAddrT').classList.toggle('hide', hasSaved);
        $('coContact').classList.toggle('hide', hasSaved && mode !== 'new' && validContact());
        $('coSaveRow').classList.toggle('hide', !(uid && mode === 'new' && addresses.length < MAX_ADDR));
        if (hasSaved) renderTickets();
        syncUI();
    }
    function pick(id) {
        var prev = mode;
        if (id === 'new') {
            if (prev !== 'new') {
                gov.value = ''; city.value = ''; addr.value = ''; lm.value = '';
                fire(gov, 'change'); fire(city, 'input'); fire(addr, 'input');
            }
            mode = 'new';
        } else {
            var a = addresses.filter(function (x) { return String(x.id) === String(id); })[0];
            if (!a) return;
            mode = String(a.id);
            gov.value = a.governorate; city.value = a.city || ''; addr.value = a.address; lm.value = '';
            fire(gov, 'change'); fire(city, 'input'); fire(addr, 'input');
        }
        applyMode();
    }
    $('coTickets').addEventListener('click', function (e) {
        var t = e.target.closest('.tk'); if (t) pick(t.dataset.id);
    });
    $('coTickets').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var t = e.target.closest('.tk'); if (t) { e.preventDefault(); pick(t.dataset.id); }
    });

    async function loadAddresses() {
        addresses = []; uid = null;
        try {
            var s = await supabaseClient.auth.getSession();
            uid = s && s.data && s.data.session && s.data.session.user && s.data.session.user.id || null;
            if (uid) {
                var r = await supabaseClient.from('customer_addresses').select('*').eq('customer_id', uid)
                    .order('is_default', { ascending: false }).order('created_at', { ascending: false });
                if (!r.error && r.data) addresses = r.data;
            }
        } catch (e) { addresses = []; }
    }

    function buildItems() {
        var box = $('coItems');
        var list = (typeof cart !== 'undefined' && Array.isArray(cart)) ? cart : [];
        box.innerHTML = list.map(function (i) {
            var img = i.image ? '<img src="' + esc(i.image) + '" alt="">' : '<i class="fa-solid fa-shoe-prints"></i>';
            var price = Number(i.price) * Number(i.quantity);
            return '<div class="it"><div class="im">' + img + '</div><div class="nm"><b>' + esc(i.name) + '</b><small>مقاس <bdi>' + esc(i.size) + '</bdi> · الكمية <bdi>' + Number(i.quantity) + '</bdi></small></div>' +
                '<div class="pr"><bdi>' + (typeof formatPrice === 'function' ? formatPrice(price) : price) + '</bdi> ج.م</div></div>';
        }).join('');
    }

    // called by script.js when the order modal opens (after draft/profile fill)
    async function onOpen() {
        buildItems();
        closeCombo();
        await loadAddresses();
        var hasDraft = gov.value && addr.value.trim();
        mode = 'new';
        if (addresses.length) {
            var match = hasDraft && addresses.filter(function (a) {
                return a.governorate === gov.value && (a.city || '') === city.value && a.address === addr.value.trim();
            })[0];
            if (match) mode = String(match.id);
            else if (!hasDraft) {
                var d = addresses.filter(function (a) { return a.is_default; })[0] || addresses[0];
                mode = String(d.id);
                gov.value = d.governorate; city.value = d.city || ''; addr.value = d.address;
                fire(gov, 'change'); fire(city, 'input'); fire(addr, 'input');
            }
        }
        $('coSaveAddr').checked = true;
        applyMode();
        if (typeof updateOrderSummary === 'function') updateOrderSummary();
    }

    function fullAddress() {
        var raw = addr.value.trim(), l = lm.value.trim();
        if (!l || raw.indexOf(l) > -1) return raw;
        return raw + '، علامة مميزة: ' + l;
    }

    // called by script.js after the order was created, before the form resets
    async function onSuccess() {
        try {
            if (!uid || mode !== 'new' || !$('coSaveAddr').checked || addresses.length >= MAX_ADDR) return;
            var row = { governorate: gov.value, city: city.value || null, address: fullAddress() };
            var dup = addresses.some(function (a) { return a.governorate === row.governorate && (a.city || null) === row.city && a.address === row.address; });
            if (dup) return;
            row.customer_id = uid;
            row.is_default = addresses.length === 0;
            await supabaseClient.from('customer_addresses').insert(row);
        } catch (e) { /* saving the address is optional */ }
    }

    function focusArea() {
        if (!gov.value) { $('coSeg').classList.add('bad'); return; }
        $('coAreaFld').classList.add('bad');
        $('coAddr').classList.remove('hide');
        openCombo();
    }

    $('orderForm').addEventListener('reset', function () {
        setTimeout(function () { lm.value = ''; mode = 'new'; syncUI(); }, 0);
    });
    nameF.addEventListener('input', function () { if (addresses.length) renderTickets(); });
    phoneF.addEventListener('input', function () { if (addresses.length) renderTickets(); });

    window.checkoutV2 = { onOpen: onOpen, onSuccess: onSuccess, fullAddress: fullAddress, focusArea: focusArea };
    syncUI();
})();
