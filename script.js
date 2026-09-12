// ========================================
// STEP Store - Main Script
// Home + Product + Cart + Orders + Customer
// ========================================

// ========================================
// 1. SUPABASE CLIENT
// ========================================

const SUPABASE_URL = 'https://uobuxepixrqijgciurve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5cu-Flvr7CSvRPMT3hByMQ_CfO7mBIv';

const supabaseClient =
    window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;

// ========================================
// 2. GLOBAL STATE
// ========================================

let products = [];
let cart = [];
let currentProductId = null;
let detailsQuantity = 1;
let detailsSelectedSize = null;
let currentCustomer = null;

try {
    cart = JSON.parse(localStorage.getItem('myCart')) || [];
} catch {
    cart = [];
}

// ========================================
// 3. PAGE DETECTION
// ========================================

const productDetailsEl = document.getElementById('productDetails');
const isProductPage = Boolean(productDetailsEl);

if (isProductPage) {
    currentProductId = Number(
        new URLSearchParams(location.search).get('id')
    );
}

// ========================================
// 4. DOM ELEMENTS
// ========================================

const $ = id => document.getElementById(id);

const productGrid = $('productGrid');
const emptyProducts = $('emptyProducts');
const relatedProducts = $('relatedProducts');

const cartCountElement = $('cartCount');
const cartModal = $('cartModal');
const cartBtn = $('cartBtn');
const closeCartBtn = $('closeCartBtn');
const cartItemsContainer = $('cartItemsContainer');
const cartTotalPrice = $('cartTotalPrice');
const checkoutBtn = $('checkoutBtn');

const orderModal = $('orderModal');
const closeOrderBtn = $('closeOrderBtn');
const orderForm = $('orderForm');
const submitOrderBtn = $('submitOrderBtn');
const summaryCount = $('summaryCount');
const summaryTotal = $('summaryTotal');

const successModal = $('successModal');
const successOrderId = $('successOrderId');

const menuBtn = $('menuBtn');
const mobileMenu = $('mobileMenu');
const searchBtn = $('searchBtn');

// ========================================
// 5. HELPERS
// ========================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[c]);
}

function showToast(message) {
    document.querySelector('.toast-notification')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 30);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function formatPrice(n) {
    return Number(n || 0).toLocaleString('ar-EG');
}

function normalizeProduct(item) {
    let sizes = item.sizes;
    if (typeof sizes === 'string') {
        try { sizes = JSON.parse(sizes); } catch { sizes = []; }
    }
    if (!Array.isArray(sizes)) sizes = [];

    let images = item.images;
    if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch { images = []; }
    }
    if (!Array.isArray(images)) images = [];

    return {
        id: Number(item.id),
        name: item.name || '',
        price: Number(item.price || 0),
        oldPrice: item.old_price == null ? null : Number(item.old_price),
        badge: item.badge || '',
        sizes,
        image: item.image || '',
        images,
        description: item.description || '',
        stockBySize: {}
    };
}

function getBadgeClass(badge) {
    const b = String(badge || '').trim().toLowerCase();
    if (b === 'خصم' || b === 'sale') return 'sale';
    if (b === 'جديد' || b === 'new') return 'new';
    return '';
}

// ========================================
// 6. SHIPPING RATES
// ========================================

const SHIPPING_RATES = {
    "القاهرة": 80,
    "الجيزة": 80
};

const FREE_SHIPPING_MIN_ITEMS = 2;

function getShippingCost(governorate, itemsCount) {
    if (!governorate) return null;
    if (itemsCount >= FREE_SHIPPING_MIN_ITEMS) return 0;
    return SHIPPING_RATES[governorate] ?? 50;
}

function updateOrderSummary() {
    const subtotal = cart.reduce(
        (s, i) => s + Number(i.price) * Number(i.quantity), 0
    );
    const count = cart.reduce((s, i) => s + Number(i.quantity), 0);

    const govField = $('governorate');
    const gov = govField?.value || '';

    const shipping = getShippingCost(gov, count);
    const total = subtotal + (shipping || 0);

    if (summaryCount) summaryCount.textContent = count;
    if ($('summarySubtotal')) {
        $('summarySubtotal').textContent = `${formatPrice(subtotal)} جنيه`;
    }

    const shippingEl = $('summaryShipping');
    if (shippingEl) {
        if (!gov) {
            shippingEl.textContent = 'اختر المحافظة';
            shippingEl.style.color = '#999';
            shippingEl.style.fontWeight = '500';
        } else if (shipping === 0) {
            shippingEl.textContent = 'مجاني 🎉';
            shippingEl.style.color = '#16a34a';
            shippingEl.style.fontWeight = '800';
        } else {
            shippingEl.textContent = `${formatPrice(shipping)} جنيه`;
            shippingEl.style.color = '#111';
            shippingEl.style.fontWeight = '700';
        }
    }

    const hintEl = $('shippingHint');
    if (hintEl) {
        if (!gov) {
            hintEl.style.display = 'none';
        } else if (count >= FREE_SHIPPING_MIN_ITEMS) {
            hintEl.textContent = '🎉 مبروك! الشحن مجاني';
            hintEl.style.display = 'block';
            hintEl.style.color = '#16a34a';
            hintEl.style.background = '#dcfce7';
        } else {
            const remaining = FREE_SHIPPING_MIN_ITEMS - count;
            hintEl.textContent =
                `أضف ${remaining} قطعة أخرى للحصول على شحن مجاني`;
            hintEl.style.display = 'block';
            hintEl.style.color = '#92400e';
            hintEl.style.background = '#fef3c7';
        }
    }

    if (summaryTotal) {
        summaryTotal.textContent = `${formatPrice(total)} جنيه`;
    }
}

// ========================================
// 7. LOAD CUSTOMER
// ========================================

async function loadCurrentCustomer() {
    if (!supabaseClient) return null;

    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData?.session) return null;

        const user = sessionData.session.user;

        const { data: adminData } = await supabaseClient
            .from("admin_users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

        if (adminData) return null;

        const { data: profile } = await supabaseClient
            .from("customer_profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        return {
            id: user.id,
            email: user.email,
            profile: profile || null
        };
    } catch (error) {
        console.error("Load Customer Error:", error);
        return null;
    }
}

// ========================================
// 8. FETCH PRODUCTS
// ========================================

async function fetchProducts() {
    if (!supabaseClient) {
        showToast('تعذر الاتصال بقاعدة البيانات');
        return;
    }

    try {
        // ✅ نجيب المنتجات + المقاسات مع بعض
        const [productsRes, sizesRes] = await Promise.all([
            supabaseClient
                .from('products')
                .select('*')
                .order('id', { ascending: false }),
            supabaseClient
                .from('product_sizes')
                .select('product_id, size, stock, reserved')
        ]);

        if (productsRes.error) {
            console.error('Supabase error:', productsRes.error);
            showToast('تعذر تحميل المنتجات');
            return;
        }

        // ✅ خريطة المخزون
        const sizesMap = {};
        (sizesRes.data || []).forEach(row => {
            const pid = Number(row.product_id);
            if (!sizesMap[pid]) sizesMap[pid] = {};
            const available = Math.max(0, Number(row.stock || 0) - Number(row.reserved || 0));
            sizesMap[pid][String(row.size)] = available;
        });

        products = (productsRes.data || []).map(p => ({
            ...normalizeProduct(p),
            stockBySize: sizesMap[Number(p.id)] || {}
        }));

        window.products = products;

        console.log("📦 Products loaded:", products.length);
        console.log("🖼️ First product images:", products[0]?.images);

        syncCartWithProducts();

        if (productGrid) renderHomeGrid();
        if (productDetailsEl) renderProductDetails();
        if (relatedProducts) renderRelatedProducts();
    } catch (err) {
        console.error('Fetch Products Error:', err);
    }
}

// ========================================
// 9. HOME GRID
// ========================================

function productCardHTML(product) {
    const badgeClass = getBadgeClass(product.badge);
    const stockBySize = product.stockBySize || {};

    // ✅ المقاسات كأزرار صغيرة
    const sizesHTML = product.sizes.map(s => {
        const sizeKey = String(s);
        const available = stockBySize[sizeKey];
        const isOutOfStock = available === undefined || available === 0;

        return `
            <button type="button" 
                class="size-chip-btn ${isOutOfStock ? 'disabled' : ''}" 
                data-size="${escapeHTML(sizeKey)}"
                ${isOutOfStock ? 'disabled' : ''}
                onclick="selectGridSize(this, ${product.id}, '${escapeHTML(sizeKey)}')">
                ${escapeHTML(sizeKey)}
            </button>
        `;
    }).join('');

    const hasAnyStock = product.sizes.some(s => {
        const avail = stockBySize[String(s)];
        return avail !== undefined && avail > 0;
    });

    return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" class="product-image-link">
                <div class="product-image">
                    <img
                        class="product-image-inner"
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                    >
                    ${product.badge ? `
                        <span class="product-badge ${badgeClass}">
                            ${escapeHTML(product.badge)}
                        </span>
                    ` : ''}
                    ${!hasAnyStock ? `
                        <span class="product-badge" style="background:#dc2626;">
                            نفذ المخزون
                        </span>
                    ` : ''}
                </div>
            </a>
            <div class="product-info">
                <a href="product.html?id=${product.id}">
                    <h3>${escapeHTML(product.name)}</h3>
                </a>
                <div class="product-rating">★★★★★</div>
                <div class="price-box">
                    <span class="product-price">${formatPrice(product.price)} جنيه</span>
                    ${product.oldPrice ? `
                        <span class="old-price">${formatPrice(product.oldPrice)} جنيه</span>
                    ` : ''}
                </div>
                <label class="size-label">المقاس</label>
                <div class="size-chips-grid" data-product-id="${product.id}">
                    ${sizesHTML}
                </div>
                <button
                    class="add-to-cart"
                    type="button"
                    onclick="addToCartFromGrid(${product.id})"
                    ${!hasAnyStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
                >
                    <i class="fa-solid fa-bag-shopping"></i>
                    ${hasAnyStock ? 'إضافة للسلة' : 'غير متاح'}
                </button>
            </div>
        </div>
    `;
}

function renderHomeGrid() {
    if (!productGrid) return;

    if (!products.length) {
        productGrid.innerHTML = '';
        if (emptyProducts) emptyProducts.style.display = 'block';
        return;
    }

    if (emptyProducts) emptyProducts.style.display = 'none';
    productGrid.innerHTML = products.map(productCardHTML).join('');
}

// ========================================
// 10. PRODUCT DETAILS PAGE
// ========================================

function switchProductImage(btn) {
    const url = btn.dataset.image;
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) {
        mainImg.src = url;
        mainImg.style.opacity = '0.6';
        setTimeout(() => { mainImg.style.opacity = '1'; }, 150);
    }

    document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

function buildGalleryHTML(product) {
    const mainImage = product.image || '';
    const extraImages = Array.isArray(product.images) ? product.images : [];
    const allImages = [mainImage, ...extraImages].filter(Boolean);

    console.log("🎨 Gallery images:", allImages);

    if (!allImages.length) {
        return `
            <div class="product-gallery">
                <div class="product-details-image">
                    <div class="no-image-placeholder">
                        <i class="fa-solid fa-image"></i>
                        <span>لا توجد صورة</span>
                    </div>
                </div>
            </div>
        `;
    }

    const badgeHTML = product.badge
        ? `<span class="product-details-badge ${getBadgeClass(product.badge)}">
                ${escapeHTML(product.badge)}
           </span>`
        : '';

    const thumbnailsHTML = allImages.length > 1
        ? `<div class="product-thumbnails">
            ${allImages.map((url, i) => `
                <button type="button" 
                    class="product-thumb ${i === 0 ? 'active' : ''}" 
                    data-image="${escapeHTML(url)}" 
                    onclick="switchProductImage(this)">
                    <img src="${escapeHTML(url)}" alt="">
                </button>
            `).join('')}
        </div>`
        : '';

    return `
        <div class="product-gallery">
            <div class="product-details-image">
                <img id="mainProductImage" src="${escapeHTML(allImages[0])}" alt="${escapeHTML(product.name)}">
                ${badgeHTML}
            </div>
            ${thumbnailsHTML}
        </div>
    `;
}

function renderProductDetails() {
    if (!productDetailsEl) return;

    const product = products.find(p => p.id === currentProductId);

    if (!product) {
        productDetailsEl.innerHTML = `
            <div class="product-not-found">
                <h2>المنتج غير موجود</h2>
                <p>المنتج المطلوب غير متاح حاليًا.</p>
                <a href="index.html">العودة للرئيسية</a>
            </div>
        `;
        return;
    }

    document.title = `STEP | ${product.name}`;

    // ✅ المقاسات كدوائر
    const stockBySize = product.stockBySize || {};
    const sizesOptionsHTML = product.sizes.map(s => {
        const sizeKey = String(s);
        const available = stockBySize[sizeKey];
        const isOutOfStock = available === undefined || available === 0;

        return `
            <button type="button" 
                class="size-option ${isOutOfStock ? 'disabled' : ''}" 
                data-size="${escapeHTML(sizeKey)}"
                ${isOutOfStock ? 'disabled' : ''}
                onclick="selectSizeOption(this, ${product.id}, '${escapeHTML(sizeKey)}')"
                title="${isOutOfStock ? 'غير متاح' : 'متاح'}">
                ${escapeHTML(sizeKey)}
            </button>
        `;
    }).join('');

    productDetailsEl.innerHTML = `
        <div class="product-details-grid">
            ${buildGalleryHTML(product)}

            <div class="product-details-info">
                <h1>${escapeHTML(product.name)}</h1>

                <div class="details-rating">
                    <span>★★★★★</span>
                    <span>(5.0)</span>
                </div>

                <div class="details-price">
                    <span class="details-current-price">
                        ${formatPrice(product.price)} جنيه
                    </span>
                    ${product.oldPrice ? `
                        <span class="details-old-price">
                            ${formatPrice(product.oldPrice)} جنيه
                        </span>
                    ` : ''}
                </div>

                <div class="details-divider"></div>

                <p class="product-description">
                    ${escapeHTML(product.description || 'لا يوجد وصف متاح لهذا المنتج.')}
                </p>

                <div class="details-option">
                    <label>المقاس</label>
                    <div class="size-options-grid" id="sizeOptionsGrid">
                        ${sizesOptionsHTML}
                    </div>
                    <div id="sizeHelpText" class="size-help-text">
                        اختر المقاس المناسب
                    </div>
                </div>

                <div class="details-option">
                    <label>الكمية</label>
                    <div class="details-quantity">
                        <button id="detailsMinus" type="button">−</button>
                        <span id="detailsQty">1</span>
                        <button id="detailsPlus" type="button">+</button>
                    </div>
                </div>

                <button class="details-add-btn" id="detailsAddBtn" type="button">
                    <i class="fa-solid fa-bag-shopping"></i>
                    إضافة للسلة
                </button>

                <a href="index.html#productsSection" class="back-products-btn">
                    <i class="fa-solid fa-arrow-right"></i>
                    العودة للمنتجات
                </a>
            </div>
        </div>
    `;

    detailsQuantity = 1;
    detailsSelectedSize = null;

    $('detailsMinus').onclick = () => changeDetailsQuantity(-1);
    $('detailsPlus').onclick = () => changeDetailsQuantity(1);
    $('detailsAddBtn').onclick = addDetailsToCart;
}

function selectSizeOption(btn, productId, size) {
    if (btn.disabled) return;

    document.querySelectorAll('.size-option').forEach(b => {
        b.classList.remove('selected');
    });

    btn.classList.add('selected');
    detailsSelectedSize = size;

    const helpEl = document.getElementById('sizeHelpText');
    if (helpEl) {
        helpEl.textContent = `✅ مقاس ${size} متاح`;
        helpEl.style.color = '#16a34a';
        helpEl.style.background = '#dcfce7';
    }
}

function changeDetailsQuantity(delta) {
    detailsQuantity = Math.max(1, Math.min(20, detailsQuantity + delta));
    const el = $('detailsQty');
    if (el) el.textContent = detailsQuantity;
}

function addDetailsToCart() {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    if (!detailsSelectedSize) {
        showToast('اختار المقاس الأول');

        const grid = document.getElementById('sizeOptionsGrid');
        if (grid) {
            grid.style.animation = 'shake 0.4s';
            setTimeout(() => grid.style.animation = '', 500);
        }
        return;
    }

    const available = product.stockBySize?.[String(detailsSelectedSize)];
    if (!available || available === 0) {
        showToast('المقاس ده مش متاح حاليًا');
        return;
    }

    addProductToCart(product, detailsSelectedSize, detailsQuantity);
}

function renderRelatedProducts() {
    if (!relatedProducts) return;

    const list = products
        .filter(p => p.id !== currentProductId)
        .slice(0, 4);

    if (!list.length) {
        relatedProducts.innerHTML = '';
        return;
    }

    relatedProducts.innerHTML = list.map(productCardHTML).join('');
}

// ========================================
// 11. CART
// ========================================

function selectGridSize(btn, productId, size) {
    if (btn.disabled) return;

    const grid = btn.closest('.size-chips-grid');
    if (grid) {
        grid.querySelectorAll('.size-chip-btn').forEach(b => b.classList.remove('selected'));
    }
    btn.classList.add('selected');
}

function addToCartFromGrid(productId) {
    const product = products.find(p => p.id === Number(productId));
    if (!product) return;

    const grid = document.querySelector(`.size-chips-grid[data-product-id="${productId}"]`);
    const selectedBtn = grid?.querySelector('.size-chip-btn.selected');
    const size = selectedBtn?.dataset.size;

    if (!size) {
        showToast('اختار المقاس الأول');

        if (grid) {
            grid.style.animation = 'shake 0.4s';
            setTimeout(() => grid.style.animation = '', 500);
        }
        return;
    }

    const available = product.stockBySize?.[String(size)];
    if (!available || available === 0) {
        showToast('المقاس ده مش متاح حاليًا');
        return;
    }

    addProductToCart(product, size, 1);
}

function addProductToCart(product, size, qty) {
    const existing = cart.find(
        i => i.id === product.id && String(i.size) === String(size)
    );

    if (existing) {
        existing.quantity = Number(existing.quantity) + qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size,
            quantity: qty
        });
    }

    updateCartUI();
    showToast(`تمت إضافة ${product.name} مقاس ${size} للسلة`);
}

function syncCartWithProducts() {
    const ids = new Set(products.map(p => p.id));
    cart = cart.filter(i => ids.has(Number(i.id)) && i.size != null);
    updateCartUI();
}

function updateCartUI() {
    cart.forEach(i => {
        i.quantity = Math.max(1, Number(i.quantity || 1));
    });

    const count = cart.reduce((s, i) => s + i.quantity, 0);
    if (cartCountElement) cartCountElement.textContent = count;

    localStorage.setItem('myCart', JSON.stringify(cart));
    renderCartModal();
}

function renderCartModal() {
    if (!cartItemsContainer || !cartTotalPrice) return;

    if (!cart.length) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-bag-shopping"></i>
                <p>السلة فارغة حاليًا</p>
            </div>
        `;
        cartTotalPrice.textContent = '0 جنيه';
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        total += itemTotal;

        const safeSize = String(item.size).replaceAll("'", "\\'");

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-image" style="background-image:url('${escapeHTML(item.image)}')"></div>
            <div class="cart-item-info">
                <h4>${escapeHTML(item.name)}</h4>
                <div class="cart-item-size">المقاس: ${escapeHTML(item.size)}</div>
                <div class="cart-item-price">${formatPrice(item.price)} جنيه</div>
                <div class="cart-controls">
                    <button class="quantity-btn" type="button" onclick="changeCartQuantity(${item.id}, '${safeSize}', -1)">−</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" type="button" onclick="changeCartQuantity(${item.id}, '${safeSize}', 1)">+</button>
                </div>
                <button class="remove-item-btn" type="button" onclick="removeFromCart(${item.id}, '${safeSize}')">حذف المنتج</button>
            </div>
        `;
        cartItemsContainer.appendChild(el);
    });

    cartTotalPrice.textContent = `${formatPrice(total)} جنيه`;
}

function changeCartQuantity(id, size, delta) {
    const item = cart.find(
        i => i.id === Number(id) && String(i.size) === String(size)
    );
    if (!item) return;

    item.quantity = Number(item.quantity) + delta;

    if (item.quantity <= 0) {
        removeFromCart(id, size);
        return;
    }

    updateCartUI();
}

function removeFromCart(id, size) {
    cart = cart.filter(
        i => !(i.id === Number(id) && String(i.size) === String(size))
    );
    updateCartUI();
    showToast('تم حذف المنتج من السلة');
}

// ========================================
// 12. MODALS
// ========================================

function openCart() {
    cartModal?.classList.add('open');
    document.body.classList.add('cart-open');
}

function closeCart() {
    cartModal?.classList.remove('open');
    document.body.classList.remove('cart-open');
}

async function openOrderModal() {
    if (!cart.length) {
        showToast('السلة فارغة. أضف منتج أولًا');
        return;
    }

    closeCart();

    if (!currentCustomer) {
        currentCustomer = await loadCurrentCustomer();
    }

    const loginPrompt = $('loginPrompt');
    if (loginPrompt) {
        loginPrompt.style.display = currentCustomer ? 'none' : 'flex';
    }

    if (currentCustomer?.profile) {
        const p = currentCustomer.profile;
        const nameField = $('customerName');
        const phoneField = $('customerPhone');
        const govField = $('governorate');
        const cityField = $('city');
        const addressField = $('customerAddress');

        if (nameField && !nameField.value && p.full_name) nameField.value = p.full_name;
        if (phoneField && !phoneField.value && p.phone) phoneField.value = p.phone;
        if (govField && !govField.value && p.governorate) govField.value = p.governorate;
        if (cityField && !cityField.value && p.city) cityField.value = p.city;
        if (addressField && !addressField.value && p.address) addressField.value = p.address;
    }

    updateOrderSummary();

    orderModal?.classList.add('open');
    document.body.classList.add('cart-open');
}

function closeOrderModal() {
    orderModal?.classList.remove('open');
    document.body.classList.remove('cart-open');
}

function closeSuccessModal() {
    successModal?.classList.remove('open');
    document.body.classList.remove('cart-open');
}

// ========================================
// 13. SUBMIT ORDER
// ========================================

async function submitOrder(event) {
    event.preventDefault();

    if (!cart.length) {
        showToast('السلة فارغة');
        return;
    }

    if (!supabaseClient) {
        showToast('تعذر الاتصال بقاعدة البيانات');
        return;
    }

    const name = $('customerName').value.trim();
    const phone = $('customerPhone').value.trim();
    const gov = $('governorate').value;
    const city = $('city').value.trim();
    const address = $('customerAddress').value.trim();
    const notes = $('orderNotes').value.trim();

    if (!name || !phone || !gov || !address) {
        showToast('اكمل البيانات المطلوبة');
        return;
    }

    if (!/^01[0-9]{9}$/.test(phone)) {
        showToast('رقم الهاتف غير صحيح');
        return;
    }

    const items = cart.map(i => ({
        id: i.id,
        name: i.name,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
        image: i.image
    }));

    const subtotal = cart.reduce(
        (s, i) => s + Number(i.price) * Number(i.quantity), 0
    );
    const totalItems = cart.reduce((s, i) => s + Number(i.quantity), 0);
    const shippingCost = getShippingCost(gov, totalItems);
    const total = subtotal + (shippingCost || 0);

    const paymentMethod =
        document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';

    submitOrderBtn.disabled = true;
    submitOrderBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...';

    try {
        const { data, error } = await supabaseClient.rpc(
            'create_order',
            {
                p_customer_name: name,
                p_customer_phone: phone,
                p_customer_address: address,
                p_governorate: gov,
                p_city: city || null,
                p_notes: notes || null,
                p_items: items,
                p_subtotal: subtotal,
                p_shipping_cost: shippingCost || 0,
                p_total_amount: total,
                p_payment_method: paymentMethod
            }
        );

        if (error) throw error;

        cart = [];
        localStorage.setItem('myCart', '[]');
        updateCartUI();

        orderForm.reset();
        orderModal?.classList.remove('open');

        if (successOrderId) successOrderId.textContent = `#${data.id}`;

        const trackLink = $('trackOrderLink');
        if (trackLink) {
            trackLink.href =
                `track.html?id=${data.id}&phone=${encodeURIComponent(phone)}`;
        }

        const accountPrompt = $('successAccountPrompt');
        if (accountPrompt) {
            accountPrompt.style.display = currentCustomer ? 'none' : 'block';
        }

        successModal?.classList.add('open');
    } catch (err) {
        console.error('Order error:', err);
        alert('فشل إرسال الطلب:\n\n' + err.message);
    } finally {
        submitOrderBtn.disabled = false;
        submitOrderBtn.innerHTML =
            '<i class="fa-solid fa-check"></i> تأكيد الطلب';
    }
}

// ========================================
// 14. SEARCH
// ========================================

function performSearch() {
    const term = prompt('اكتب اسم الحذاء اللي بتدور عليه');
    if (!term) return;

    const query = term.trim().toLowerCase();
    if (!query) return;

    const result = products.filter(p =>
        p.name.toLowerCase().includes(query)
    );

    if (!result.length) {
        showToast('لم يتم العثور على المنتج');
        return;
    }

    if (!productGrid) {
        window.location.href = `index.html#productsSection`;
        return;
    }

    productGrid.innerHTML = result.map(productCardHTML).join('');
    if (emptyProducts) emptyProducts.style.display = 'none';

    $('productsSection')?.scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
        if (products.length) renderHomeGrid();
    }, 4000);
}

// ========================================
// 15. EVENTS
// ========================================

cartBtn?.addEventListener('click', openCart);
closeCartBtn?.addEventListener('click', closeCart);

cartModal?.addEventListener('click', e => {
    if (e.target === cartModal) closeCart();
});

checkoutBtn?.addEventListener('click', openOrderModal);
closeOrderBtn?.addEventListener('click', closeOrderModal);

orderForm?.addEventListener('submit', submitOrder);

successModal?.addEventListener('click', e => {
    if (e.target === successModal) closeSuccessModal();
});

menuBtn?.addEventListener('click', () =>
    mobileMenu?.classList.toggle('open')
);

mobileMenu?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () =>
        mobileMenu.classList.remove('open')
    )
);

searchBtn?.addEventListener('click', performSearch);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeCart();
        closeOrderModal();
        closeSuccessModal();
    }
});

// ========================================
// 16. GLOBAL FUNCTIONS
// ========================================

window.addToCartFromGrid = addToCartFromGrid;
window.switchProductImage = switchProductImage;
window.selectSizeOption = selectSizeOption;
window.selectGridSize = selectGridSize;
window.changeCartQuantity = changeCartQuantity;
window.removeFromCart = removeFromCart;
window.closeSuccessModal = closeSuccessModal;

// ========================================
// 17. INIT
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    updateCartUI();
    await fetchProducts();

    try {
        currentCustomer = await loadCurrentCustomer();
    } catch (err) {
        console.warn('Customer load skipped:', err);
        currentCustomer = null;
    }

    $('governorate')?.addEventListener('change', updateOrderSummary);
});