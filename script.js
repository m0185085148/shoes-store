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
let productReviewStats = {}; // { productId: { avg, count } }

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
    return Number(n || 0).toLocaleString('en-US');
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
        const [productsRes, sizesRes, reviewsRes] = await Promise.all([
            supabaseClient
                .from('products')
                .select('*')
                .order('id', { ascending: false }),
            supabaseClient
                .from('product_sizes')
                .select('product_id, size, stock, reserved'),
            supabaseClient
                .from('product_reviews')
                .select('product_id, rating')
                .eq('status', 'approved')
        ]);

        if (productsRes.error) {
            console.error('Supabase error:', productsRes.error);
            showToast('تعذر تحميل المنتجات');
            return;
        }

        // ✅ الخريطة الأساسية للمقاسات
        const sizesMap = {};
        (sizesRes.data || []).forEach(row => {
            const pid = Number(row.product_id);
            if (!sizesMap[pid]) sizesMap[pid] = {};
            const available = Math.max(0, Number(row.stock || 0) - Number(row.reserved || 0));
            sizesMap[pid][String(row.size)] = available;
        });

        // ✅ حساب متوسط التقييمات لكل منتج
        const reviewsMap = {};
        (reviewsRes.data || []).forEach(r => {
            const pid = Number(r.product_id);
            if (!reviewsMap[pid]) reviewsMap[pid] = { sum: 0, count: 0 };
            reviewsMap[pid].sum += Number(r.rating || 0);
            reviewsMap[pid].count++;
        });

        productReviewStats = {};
        Object.keys(reviewsMap).forEach(pid => {
            const { sum, count } = reviewsMap[pid];
            productReviewStats[pid] = {
                avg: count > 0 ? sum / count : 0,
                count
            };
        });

        // ✅ نجهز المنتجات
        products = (productsRes.data || []).map(p => ({
            ...normalizeProduct(p),
            stockBySize: sizesMap[Number(p.id)] || {}
        }));

        window.products = products;

        console.log("📦 Products loaded:", products.length);

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
// ✅ توليد نجوم التقييم الحقيقية
function renderRatingStars(productId) {
    const stats = productReviewStats[Number(productId)];

    // لو مفيش مراجعات
    if (!stats || stats.count === 0) {
        return `
            <div class="product-rating-empty">
                <i class="fa-regular fa-star"></i>
                <span>لا توجد مراجعات</span>
            </div>
        `;
    }

    const avg = stats.avg;
    const fullStars = Math.floor(avg);
    const hasHalf = (avg - fullStars) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    let starsHTML = "";

    for (let i = 0; i < fullStars; i++) {
        starsHTML += `<i class="fa-solid fa-star"></i>`;
    }
    if (hasHalf) {
        starsHTML += `<i class="fa-solid fa-star-half-stroke"></i>`;
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += `<i class="fa-regular fa-star"></i>`;
    }

    return `
        <div class="product-rating">
            <div class="product-rating-stars">${starsHTML}</div>
            <span class="product-rating-text">
                ${avg.toFixed(1)} (${stats.count})
            </span>
        </div>
    `;
}

function productCardHTML(product) {
    const badgeClass = getBadgeClass(product.badge);
    const stockBySize = product.stockBySize || {};

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
                <span class="size-chip-text">${escapeHTML(sizeKey)}</span>
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
                ${renderRatingStars(product.id)}
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

// ✅ نجوم التقييم في صفحة المنتج
function renderDetailsRating(productId) {
    const stats = productReviewStats[Number(productId)];

    if (!stats || stats.count === 0) {
        return `
            <div class="details-rating details-rating-empty">
                <i class="fa-regular fa-star"></i>
                <span>لا توجد مراجعات بعد — كن أول من يقيّم</span>
            </div>
        `;
    }

    const avg = stats.avg;
    const fullStars = Math.floor(avg);
    const hasHalf = (avg - fullStars) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    let starsHTML = "";
    for (let i = 0; i < fullStars; i++) {
        starsHTML += `<i class="fa-solid fa-star"></i>`;
    }
    if (hasHalf) {
        starsHTML += `<i class="fa-solid fa-star-half-stroke"></i>`;
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += `<i class="fa-regular fa-star"></i>`;
    }

    return `
        <div class="details-rating">
            <div class="details-rating-stars">${starsHTML}</div>
            <span class="details-rating-score">${avg.toFixed(1)}</span>
            <span class="details-rating-count">(${stats.count} مراجعة)</span>
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

                <div class="details-rating-wrapper" id="detailsRatingWrapper">
                    ${renderDetailsRating(product.id)}
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

        <!-- ✅ قسم الـ Accordion — عرض كامل تحت الصورة -->
        <div class="product-accordion-section">
            <div class="product-accordion">

                <div class="accordion-item">
                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                        <span>
                            <i class="fa-solid fa-circle-info"></i>
                            الوصف
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-body">
                        <p>${escapeHTML(product.description || 'لا يوجد وصف متاح لهذا المنتج.')}</p>
                    </div>
                </div>

                <div class="accordion-item">
                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                        <span>
                            <i class="fa-solid fa-truck-fast"></i>
                            الشحن والتوصيل
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-body">
                        <ul class="accordion-list">
                            <li><i class="fa-solid fa-check"></i> توصيل سريع داخل القاهرة والجيزة (2-3 أيام)</li>
                            <li><i class="fa-solid fa-check"></i> شحن مجاني عند شراء قطعتين أو أكثر</li>
                            <li><i class="fa-solid fa-check"></i> يمكنك تتبع طلبك مباشرة من الموقع</li>
                        </ul>
                    </div>
                </div>

                <div class="accordion-item">
                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                        <span>
                            <i class="fa-solid fa-arrows-rotate"></i>
                            الاستبدال والاسترجاع
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-body">
                        <ul class="accordion-list">
                            <li><i class="fa-solid fa-check"></i> استبدال المقاس خلال 14 يوم من الاستلام</li>
                            <li><i class="fa-solid fa-check"></i> إمكانية الاسترجاع في حالة وجود عيب مصنعي</li>
                            <li><i class="fa-solid fa-check"></i> المنتج لازم يكون بحالته الأصلية مع الكرتونة</li>
                        </ul>
                    </div>
                </div>

                <div class="accordion-item">
                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                        <span>
                            <i class="fa-solid fa-shield-halved"></i>
                            الضمان
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-body">
                        <ul class="accordion-list">
                            <li><i class="fa-solid fa-check"></i> ضمان أصلي من الشركة المصنعة</li>
                            <li><i class="fa-solid fa-check"></i> منتجات أصلية 100%</li>
                            <li><i class="fa-solid fa-check"></i> الدفع عند الاستلام متاح</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    `;

    detailsQuantity = 1;
    detailsSelectedSize = null;

    $('detailsMinus').onclick = () => changeDetailsQuantity(-1);
    $('detailsPlus').onclick = () => changeDetailsQuantity(1);
    $('detailsAddBtn').onclick = addDetailsToCart;

    // ✅ نحمّل المراجعات
    loadProductReviews(product.id);
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

// ========================================
// ORDER FORM PERSISTENCE
// ========================================

const ORDER_FORM_KEY = 'step_order_form_draft';
const ORDER_FORM_TTL_DAYS = 30; // ✅ 30 يوم

function saveOrderFormData() {
    const data = {
        customerName: $('customerName')?.value || '',
        customerPhone: $('customerPhone')?.value || '',
        governorate: $('governorate')?.value || '',
        city: $('city')?.value || '',
        customerAddress: $('customerAddress')?.value || '',
        orderNotes: $('orderNotes')?.value || '',
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash',
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(ORDER_FORM_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Save form error:', e);
    }
}

function loadOrderFormData() {
    try {
        const raw = localStorage.getItem(ORDER_FORM_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        if (!data) return null;

        // ✅ نتجاهل البيانات القديمة (أكتر من 30 يوم)
        const ttlMs = ORDER_FORM_TTL_DAYS * 24 * 60 * 60 * 1000;
        if (data.savedAt && Date.now() - data.savedAt > ttlMs) {
            localStorage.removeItem(ORDER_FORM_KEY);
            return null;
        }

        return data;
    } catch (e) {
        return null;
    }
}

function clearOrderFormData() {
    localStorage.removeItem(ORDER_FORM_KEY);
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

    // ✅ الأول: نحمّل الـ draft من localStorage
    const draft = loadOrderFormData();
    if (draft) {
        const nameField = $('customerName');
        const phoneField = $('customerPhone');
        const govField = $('governorate');
        const cityField = $('city');
        const addressField = $('customerAddress');
        const notesField = $('orderNotes');

        if (nameField && !nameField.value && draft.customerName) nameField.value = draft.customerName;
        if (phoneField && !phoneField.value && draft.customerPhone) phoneField.value = draft.customerPhone;
        if (govField && !govField.value && draft.governorate) govField.value = draft.governorate;
        if (cityField && !cityField.value && draft.city) cityField.value = draft.city;
        if (addressField && !addressField.value && draft.customerAddress) addressField.value = draft.customerAddress;
        if (notesField && !notesField.value && draft.orderNotes) notesField.value = draft.orderNotes;

        // ✅ استرجاع طريقة الدفع
        if (draft.paymentMethod) {
            const paymentRadio = document.querySelector(`input[name="paymentMethod"][value="${draft.paymentMethod}"]`);
            if (paymentRadio) paymentRadio.checked = true;
        }
    }

    // ✅ ثانيًا: لو مسجل دخول، نكمّل البيانات الناقصة من البروفايل
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

    // ✅ التحقق من المخزون
    const stockErrors = [];

    cart.forEach(item => {
        const product = products.find(p => p.id === Number(item.id));
        if (!product) return;

        const available = product.stockBySize?.[String(item.size)] || 0;

        if (item.quantity > available) {
            stockErrors.push(
                `${product.name} - مقاس ${item.size}: المتاح ${available} بس (طلبك ${item.quantity})`
            );
        }
    });

    if (stockErrors.length > 0) {
        showToast('⚠️ بعض المنتجات مش متوفرة بالكمية المطلوبة');
        alert(
            '⚠️ الكميات المطلوبة مش متوفرة:\n\n' +
            stockErrors.join('\n\n') +
            '\n\nعدّل السلة وحاول تاني 🙏'
        );
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

        // ✅ امسح draft بعد النجاح
        clearOrderFormData();

        // ✅ احفظ تعليمات إنستاباي للوصول السريع
        if (paymentMethod === 'instapay') {
            try {
                localStorage.setItem('pendingInstapayOrder', JSON.stringify({
                    orderId: data.id,
                    total: total,
                    phone: phone,
                    savedAt: Date.now()
                }));
            } catch (e) {}
        }

        orderForm.reset();
        orderModal?.classList.remove('open');

        if (successOrderId) successOrderId.textContent = `#${data.id}`;

        // ✅ لو الدفع إنستاباي، نعرض التعليمات
        const instaPayBox = $('instapayInstructions');
        if (instaPayBox) {
            if (paymentMethod === 'instapay') {
                instaPayBox.style.display = 'block';

                // ✅ نحدّث المبلغ
                const amountEl = $('instapayAmount');
                if (amountEl) {
                    amountEl.textContent = `${formatPrice(total)} جنيه`;
                }

                // ✅ نحدّث رقم الطلب
                const orderNumEl = $('instapayOrderNumber');
                if (orderNumEl) {
                    orderNumEl.textContent = `#${data.id}`;
                }
            } else {
                instaPayBox.style.display = 'none';
            }
        }

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

        const errorMsg = err.message || '';

        if (
            errorMsg.includes('غير متوفر') ||
            errorMsg.includes('المتاح') ||
            errorMsg.includes('غير متوفرة')
        ) {
            showToast('⚠️ بعض المنتجات مش متوفرة');
            alert(
                '⚠️ الكميات المطلوبة مش متوفرة:\n\n' +
                errorMsg +
                '\n\nعدّل السلة وحاول تاني 🙏'
            );
        } else {
            alert('فشل إرسال الطلب:\n\n' + errorMsg);
        }
    } finally {
        submitOrderBtn.disabled = false;
        submitOrderBtn.innerHTML =
            '<i class="fa-solid fa-check"></i> تأكيد الطلب';
    }
}

// ========================================
// 14. SEARCH
// ========================================

// ========================================
// SEARCH MODAL
// ========================================

function performSearch() {
    openSearchModal();
}

function openSearchModal() {
    let modal = document.getElementById('searchModal');

    if (!modal) {
        createSearchModal();
        modal = document.getElementById('searchModal');
    }

    modal.classList.add('open');
    document.body.classList.add('cart-open');

    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }

    renderSearchResults('');
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    modal?.classList.remove('open');
    document.body.classList.remove('cart-open');
}

function createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'searchModal';
    modal.className = 'search-modal';

    modal.innerHTML = `
        <div class="search-modal-content">
            <div class="search-modal-header">
                <div>
                    <span class="search-modal-small">STEP STORE</span>
                    <h2>ابحث عن حذائك</h2>
                </div>
                <button type="button" class="search-close-btn" onclick="closeSearchModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="search-modal-body">
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="اكتب اسم الحذاء..."
                        autocomplete="off"
                    >
                    <button type="button" class="search-clear-btn" id="searchClearBtn" style="display:none;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="search-results" id="searchResults"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSearchModal();
    });

    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');

    input?.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearBtn) {
            clearBtn.style.display = val ? 'flex' : 'none';
        }
        renderSearchResults(val);
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearchModal();
    });

    clearBtn?.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        renderSearchResults('');
        input.focus();
    });
}

function renderSearchResults(query) {
    const resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return;

    const q = String(query || '').trim().toLowerCase();

    let list = products;

    if (q) {
        list = products.filter(p =>
            String(p.name || '').toLowerCase().includes(q)
        );
    }

    if (!list.length) {
        resultsEl.innerHTML = `
            <div class="search-empty">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>مفيش نتائج</h3>
                <p>جرّب تكتب اسم مختلف أو جزء من الاسم</p>
            </div>
        `;
        return;
    }

    resultsEl.innerHTML = `
        <div class="search-results-count">
            ${q ? `${list.length} نتيجة` : `${list.length} منتج متاح`}
        </div>
        ${list.map(product => `
            <a href="product.html?id=${product.id}" class="search-result-item">
                <div class="search-result-img">
                    <img src="${escapeHTML(product.image || '')}" alt="${escapeHTML(product.name)}" loading="lazy">
                </div>
                <div class="search-result-info">
                    <h4>${escapeHTML(product.name)}</h4>
                    <div class="search-result-price">
                        ${formatPrice(product.price)} جنيه
                    </div>
                </div>
                <i class="fa-solid fa-chevron-left search-result-arrow"></i>
            </a>
        `).join('')}
    `;
}

window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
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
        closeSearchModal();
    }
});

// ========================================
// 16. GLOBAL FUNCTIONS
// ========================================

function toggleAccordion(btn) {
    const item = btn.closest('.accordion-item');
    if (!item) return;

    const isOpen = item.classList.contains('open');

    const parent = item.closest('.product-accordion');
    if (parent) {
        parent.querySelectorAll('.accordion-item.open').forEach(el => {
            el.classList.remove('open');
        });
    }

    if (!isOpen) {
        item.classList.add('open');
    }
}

window.addToCartFromGrid = addToCartFromGrid;
window.switchProductImage = switchProductImage;
window.selectSizeOption = selectSizeOption;
window.selectGridSize = selectGridSize;
window.changeCartQuantity = changeCartQuantity;
window.removeFromCart = removeFromCart;
window.closeSuccessModal = closeSuccessModal;
window.toggleAccordion = toggleAccordion;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;

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

    $('governorate')?.addEventListener('change', () => {
        updateOrderSummary();
        saveOrderFormData();
    });

        // ✅ تنبيه إن في طلب إنستاباي معلق
    checkPendingInstapay();

    // ✅ Auto-save لكل حقول الفورم
    ['customerName', 'customerPhone', 'city', 'customerAddress', 'orderNotes'].forEach(id => {
        $(id)?.addEventListener('input', saveOrderFormData);
    });

    // ✅ Auto-save لطريقة الدفع
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', saveOrderFormData);
    });
});
function copyToClipboard(text, btnEl) {
    navigator.clipboard.writeText(text).then(() => {
        if (btnEl) {
            const original = btnEl.innerHTML;
            btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
            btnEl.style.background = '#16a34a';
            btnEl.style.color = '#fff';
            setTimeout(() => {
                btnEl.innerHTML = original;
                btnEl.style.background = '';
                btnEl.style.color = '';
            }, 1500);
        }
        showToast('تم النسخ ✅');
    }).catch(err => {
        console.error('Copy failed:', err);
        prompt('انسخ الرقم ده:', text);
    });
}

window.copyToClipboard = copyToClipboard;
// ========================================
// PENDING INSTAPAY BANNER
// ========================================

async function checkPendingInstapay() {
    try {
        const raw = localStorage.getItem('pendingInstapayOrder');
        if (!raw) return;

        const data = JSON.parse(raw);
        if (!data || !data.orderId) {
            localStorage.removeItem('pendingInstapayOrder');
            return;
        }

        // ✅ نتجاهل الطلبات الأقدم من 24 ساعة
        if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('pendingInstapayOrder');
            return;
        }

        // ✅ نتأكد إن الطلب لسه موجود في الداتابيز ولسه payment_pending
        if (!supabaseClient) return;

        const { data: order, error } = await supabaseClient
            .from("orders")
            .select("id, status, payment_method")
            .eq("id", data.orderId)
            .maybeSingle();

        // ✅ لو الطلب اتمسح أو حالته اتغيرت → امسح البانر
        if (error || !order || order.status !== "payment_pending") {
            localStorage.removeItem('pendingInstapayOrder');
            return;
        }

        // ✅ نعرض البانر
        showInstapayBanner(data);
    } catch (e) {
        console.warn("Check pending instapay error:", e);
    }
}

function showInstapayBanner(data) {
    // شيل أي بانر قديم
    document.getElementById('instapayPendingBanner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'instapayPendingBanner';
    banner.className = 'instapay-pending-banner';

    banner.innerHTML = `
        <i class="fa-solid fa-mobile-screen"></i>
        <div style="flex:1;">
            <strong>لسه محتاج تحوّل ${formatPrice(data.total)} ج للطلب #${data.orderId}</strong>
            <small>اضغط هنا لتعليمات إنستاباي</small>
        </div>
        <button type="button" class="instapay-pending-close" onclick="hideInstapayBanner(event)">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    banner.addEventListener('click', (e) => {
        if (e.target.closest('.instapay-pending-close')) return;
        window.location.href = `track.html?id=${data.orderId}&phone=${encodeURIComponent(data.phone)}`;
    });

    document.body.appendChild(banner);
}

function hideInstapayBanner(e) {
    e.stopPropagation();
    document.getElementById('instapayPendingBanner')?.remove();
}

window.hideInstapayBanner = hideInstapayBanner;
// ========================================
// PRODUCT REVIEWS (CUSTOMER SIDE)
// ========================================

let currentReviews = [];
let currentReviewSort = "recent";
let selectedReviewRating = 0;
let reviewImagesList = [];
let reviewCurrentProductId = null;
let reviewCurrentCustomerPhone = null;
const MAX_REVIEW_IMAGES = 3;
const REVIEW_IMAGES_BUCKET = "review-images";

// ✅ تحميل مراجعات المنتج
async function loadProductReviews(productId) {
    reviewCurrentProductId = productId;

    const listEl = document.getElementById("reviewsList");
    const summaryEl = document.getElementById("reviewsSummary");
    const sectionEl = document.getElementById("productReviewsSection");

    if (!listEl || !sectionEl) return;

    sectionEl.style.display = "block";

    listEl.innerHTML = `
        <div class="reviews-empty">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>جاري التحميل...</p>
        </div>
    `;

    if (!supabaseClient) {
        listEl.innerHTML = `
            <div class="reviews-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>تعذر الاتصال بالبيانات</p>
            </div>
        `;
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("product_reviews")
            .select("*")
            .eq("product_id", productId)
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) throw error;

        currentReviews = data || [];

        // ✅ نحدّث الإحصائيات
        const total = currentReviews.length;
        const sum = currentReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
        productReviewStats[Number(productId)] = {
            avg: total > 0 ? sum / total : 0,
            count: total
        };

        // ✅ نحدّث نجوم صفحة المنتج
        const wrapper = document.getElementById("detailsRatingWrapper");
        if (wrapper) {
            wrapper.innerHTML = renderDetailsRating(productId);
        }

        renderReviewsSummary();
        renderReviewsList();
        await setupReviewForm(productId);

    } catch (err) {
        console.error("Load Reviews Error:", err);
        listEl.innerHTML = `
            <div class="reviews-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>تعذر تحميل المراجعات</p>
                <small>${escapeHTML(err.message)}</small>
            </div>
        `;
    }
}

// ✅ ملخص التقييمات
function renderReviewsSummary() {
    const scoreEl = document.getElementById("reviewsAvgScore");
    const starsEl = document.getElementById("reviewsAvgStars");
    const countEl = document.getElementById("reviewsCountText");

    if (!scoreEl || !starsEl || !countEl) return;

    const total = currentReviews.length;
    let avg = 0;

    if (total > 0) {
        const sum = currentReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
        avg = sum / total;
    }

    scoreEl.textContent = total > 0 ? avg.toFixed(1) : "0";
    countEl.textContent = total > 0
        ? `${total} ${total === 1 ? "مراجعة" : "مراجعة"}`
        : "لا توجد مراجعات بعد";

    // ✅ النجوم
    const stars = starsEl.querySelectorAll("i");
    stars.forEach((star, i) => {
        star.classList.remove("filled", "half");
        const pos = i + 1;

        if (avg >= pos) {
            star.classList.add("filled");
        } else if (avg >= pos - 0.5) {
            star.classList.add("half");
        }
    });
}

// ✅ عرض قائمة المراجعات
function renderReviewsList() {
    const listEl = document.getElementById("reviewsList");
    if (!listEl) return;

    if (!currentReviews.length) {
        listEl.innerHTML = `
            <div class="reviews-empty">
                <i class="fa-solid fa-comments"></i>
                <p>لا توجد مراجعات بعد</p>
                <small>كن أول من يشارك تجربته</small>
            </div>
        `;
        return;
    }

    let sorted = [...currentReviews];

    if (currentReviewSort === "highest") {
        sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (currentReviewSort === "lowest") {
        sorted.sort((a, b) => Number(a.rating) - Number(b.rating));
    } else {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    listEl.innerHTML = sorted.map(r => {
        const initial = String(r.customer_name || "؟").trim().charAt(0).toUpperCase();
        const rating = Number(r.rating || 0);

        const starsHTML = Array.from({ length: 5 }, (_, i) => {
            return `<i class="fa-solid fa-star" style="${i < rating ? "color:#f59e0b;" : "color:#cbd5e1;"}"></i>`;
        }).join("");

        const images = Array.isArray(r.images) ? r.images : [];
        const imagesHTML = images.length
            ? `
                <div class="review-item-images">
                    ${images.map(img => `
                        <div class="review-item-image" onclick="openReviewImage('${escapeHTML(img)}')">
                            <img src="${escapeHTML(img)}" alt="صورة المراجعة" loading="lazy">
                        </div>
                    `).join("")}
                </div>
            `
            : "";

        const replyHTML = r.admin_reply
            ? `
                <div class="review-item-admin-reply">
                    <div class="review-admin-reply-header">
                        <i class="fa-solid fa-reply"></i>
                        <strong>رد STEP Store</strong>
                    </div>
                    <div class="review-admin-reply-text">
                        ${escapeHTML(r.admin_reply)}
                    </div>
                </div>
            `
            : "";

        return `
            <div class="review-item">
                <div class="review-item-header">
                    <div class="review-item-avatar">${escapeHTML(initial)}</div>
                    <div class="review-item-info">
                        <div class="review-item-name">
                            <strong>${escapeHTML(r.customer_name || "عميل")}</strong>
                            <span class="review-verified-badge">
                                <i class="fa-solid fa-circle-check"></i>
                                عميل موثّق
                            </span>
                        </div>
                        <div class="review-item-stars">${starsHTML}</div>
                        <div class="review-item-date">${formatReviewDate(r.created_at)}</div>
                    </div>
                </div>

                ${r.review_text ? `
                    <div class="review-item-text">
                        ${escapeHTML(r.review_text)}
                    </div>
                ` : ""}

                ${imagesHTML}
                ${replyHTML}
            </div>
        `;
    }).join("");
}

// ✅ تنسيق التاريخ النسبي
function formatReviewDate(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    if (diffDay < 7) return `منذ ${diffDay} يوم`;
    if (diffDay < 30) return `منذ ${Math.floor(diffDay / 7)} أسبوع`;

    return date.toLocaleDateString("ar-EG-u-nu-latn", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// ✅ ترتيب المراجعات
function sortReviews(sortBy) {
    currentReviewSort = sortBy || "recent";
    renderReviewsList();
}

// ✅ إعداد الفورم (هل يقدر يكتب مراجعة؟)
async function setupReviewForm(productId) {
    const formCard = document.getElementById("reviewFormCard");
    const loginReq = document.getElementById("reviewLoginRequired");
    const alreadyDone = document.getElementById("reviewAlreadyDone");

    if (!formCard || !loginReq || !alreadyDone) return;

    formCard.style.display = "none";
    loginReq.style.display = "none";
    alreadyDone.style.display = "none";

    // ✅ 1) العميل مسجل دخول؟
    let customer = null;

    try {
        if (typeof loadCurrentCustomer === "function") {
            customer = await loadCurrentCustomer();
        }
    } catch (e) {
        console.warn("Customer check failed:", e);
    }

    if (!customer || !customer.profile?.phone) {
        loginReq.style.display = "block";
        return;
    }

    const phone = String(customer.profile.phone).trim();
    reviewCurrentCustomerPhone = phone;

    // ✅ 2) اشترى المنتج؟
    let hasPurchased = false;

    try {
        const { data: orders } = await supabaseClient
            .from("orders")
            .select("id, items, status")
            .eq("customer_phone", phone)
            .in("status", ["delivered", "exchanged"]);

        if (orders && orders.length) {
            hasPurchased = orders.some(o => {
                const items = Array.isArray(o.items) ? o.items : [];
                return items.some(it => Number(it.id) === Number(productId));
            });
        }
    } catch (e) {
        console.warn("Purchase check failed:", e);
    }

    if (!hasPurchased) {
        // ✅ مش اشترى → نخفي الفورم، نعرض رسالة عامة
        formCard.style.display = "none";
        return;
    }

    // ✅ 3) عنده مراجعة بالفعل؟
    try {
        const { data: existing } = await supabaseClient
            .from("product_reviews")
            .select("id, status")
            .eq("product_id", productId)
            .eq("customer_phone", phone)
            .maybeSingle();

        if (existing) {
            // عنده مراجعة → نخفي الفورم، نعرض "شكراً"
            alreadyDone.style.display = "block";
            return;
        }
    } catch (e) {
        console.warn("Existing check failed:", e);
    }

    // ✅ مفيش مراجعة → نظهر الفورم
    formCard.style.display = "block";

    // ✅ نملأ البيانات
    document.getElementById("reviewProductId").value = productId;
    document.getElementById("reviewCustomerPhone").value = phone;
    document.getElementById("reviewCustomerName").value =
        customer.profile.full_name || "";

    // ✅ نصفر التقييم والصور
    selectedReviewRating = 0;
    reviewImagesList = [];

    document.querySelectorAll(".review-star-btn").forEach(b => {
        b.classList.remove("active");
    });

    const label = document.getElementById("reviewStarsLabel");
    if (label) {
        label.textContent = "اختر التقييم";
        label.classList.remove("filled");
    }

    document.getElementById("reviewRating").value = "";
    document.getElementById("reviewText").value = "";
    document.getElementById("reviewTextCount").textContent = "0";

    renderReviewImagesGrid();

    // ✅ ربط الأحداث (لو مش مربوطة من قبل)
    if (!formCard.dataset.bound) {
        bindReviewFormEvents();
        formCard.dataset.bound = "true";
    }
}

// ✅ ربط أحداث الفورم
function bindReviewFormEvents() {
    // عداد الأحرف
    const textEl = document.getElementById("reviewText");
    const countEl = document.getElementById("reviewTextCount");

    textEl?.addEventListener("input", () => {
        if (countEl) countEl.textContent = textEl.value.length;
    });

    // زر إضافة الصور
    const addBtn = document.getElementById("reviewImageAdd");
    const fileInput = document.getElementById("reviewImagesInput");

    addBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput?.click();
    });

    fileInput?.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        fileInput.value = "";
        await uploadReviewImages(files);
    });

    // إرسال الفورم
    document.getElementById("reviewForm")?.addEventListener("submit", submitReview);
}

// ✅ اختيار النجوم
function selectReviewStar(rating) {
    selectedReviewRating = rating;
    document.getElementById("reviewRating").value = rating;

    document.querySelectorAll(".review-star-btn").forEach(btn => {
        const star = Number(btn.dataset.star);
        btn.classList.toggle("active", star <= rating);
    });

    const label = document.getElementById("reviewStarsLabel");
    const labels = {
        1: "سيئ جدًا 😞",
        2: "سيئ 😕",
        3: "مقبول 😐",
        4: "جيد جدًا 😊",
        5: "ممتاز! 🤩"
    };

    if (label) {
        label.textContent = labels[rating] || "اختر التقييم";
        label.classList.add("filled");
    }
}

// ✅ رفع الصور
async function uploadReviewImages(files) {
    if (!files.length) return;

    const remaining = MAX_REVIEW_IMAGES - reviewImagesList.length;

    if (remaining <= 0) {
        showToast(`الحد الأقصى ${MAX_REVIEW_IMAGES} صور`);
        return;
    }

    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
        showToast(`هيتم رفع ${remaining} صور بس`);
    }

    if (!supabaseClient) return;

    for (const file of toUpload) {
        if (!file.type.startsWith("image/")) {
            showToast(`الملف "${file.name}" ليس صورة`);
            continue;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast(`الصورة "${file.name}" أكبر من 5 ميجا`);
            continue;
        }

        const tempId = `temp_${Date.now()}_${Math.random()}`;
        reviewImagesList.push({ tempId, uploading: true });
        renderReviewImagesGrid();

        try {
            const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
            const filename = `reviews/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;

            const { data, error } = await supabaseClient.storage
                .from(REVIEW_IMAGES_BUCKET)
                .upload(filename, file, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (error) throw error;

            const { data: urlData } = supabaseClient.storage
                .from(REVIEW_IMAGES_BUCKET)
                .getPublicUrl(data.path);

            const idx = reviewImagesList.findIndex(x => x.tempId === tempId);
            if (idx !== -1) {
                reviewImagesList[idx] = urlData.publicUrl;
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast(`فشل رفع "${file.name}"`);
            const idx = reviewImagesList.findIndex(x => x.tempId === tempId);
            if (idx !== -1) reviewImagesList.splice(idx, 1);
        }

        renderReviewImagesGrid();
    }
}

// ✅ عرض شبكة الصور
function renderReviewImagesGrid() {
    const grid = document.getElementById("reviewImagesGrid");
    if (!grid) return;

    const itemsHTML = reviewImagesList.map((item, index) => {
        if (typeof item === "object" && item.uploading) {
            return `
                <div class="review-image-item" style="display:flex;align-items:center;justify-content:center;background:#f1f5f9;">
                    <i class="fa-solid fa-spinner fa-spin" style="color:#8b5cf6;font-size:20px;"></i>
                </div>
            `;
        }

        return `
            <div class="review-image-item">
                <img src="${escapeHTML(item)}" alt="">
                <button type="button" class="review-image-remove" onclick="removeReviewImage(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    }).join("");

    const canAddMore = reviewImagesList.length < MAX_REVIEW_IMAGES;

    grid.innerHTML = (canAddMore ? `
        <button type="button" class="review-image-add" id="reviewImageAdd">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>أضف صور</span>
        </button>
    ` : "") + itemsHTML;

    // ✅ نربط زر الإضافة من جديد (لو لسه موجود)
    const newAddBtn = document.getElementById("reviewImageAdd");
    const fileInput = document.getElementById("reviewImagesInput");

    if (newAddBtn && fileInput) {
        newAddBtn.addEventListener("click", (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }
}

// ✅ حذف صورة
function removeReviewImage(index) {
    reviewImagesList.splice(index, 1);
    renderReviewImagesGrid();
}

// ✅ إرسال المراجعة
async function submitReview(e) {
    e.preventDefault();

    const productId = reviewCurrentProductId;
    const phone = reviewCurrentCustomerPhone;

    if (!productId || !phone) {
        showReviewFormMessage("حدث خطأ، حاول تاني", "error");
        return;
    }

    const name = document.getElementById("reviewCustomerName")?.value.trim() || "";
    const rating = Number(document.getElementById("reviewRating")?.value || 0);
    const text = document.getElementById("reviewText")?.value.trim() || "";

    if (!name || name.length < 2) {
        showReviewFormMessage("اكتب اسمك", "error");
        return;
    }

    if (!rating || rating < 1 || rating > 5) {
        showReviewFormMessage("اختر التقييم", "error");
        return;
    }

    if (!text || text.length < 5) {
        showReviewFormMessage("اكتب مراجعة (5 أحرف على الأقل)", "error");
        return;
    }

    // ✅ نفلتر الصور اللي اترفعت فعلاً
    const uploadedImages = reviewImagesList.filter(x => typeof x === "string");

    const btn = document.getElementById("reviewSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

    try {
        const { data, error } = await supabaseClient.rpc("submit_product_review", {
            p_product_id: productId,
            p_customer_phone: phone,
            p_customer_name: name,
            p_rating: rating,
            p_review_text: text,
            p_images: uploadedImages
        });

        if (error) throw error;

        if (!data?.success) throw new Error("فشل الإرسال");

        showReviewFormMessage("تم إرسال مراجعتك! في انتظار موافقة الإدارة ✅", "success");

        setTimeout(() => {
            document.getElementById("reviewFormCard").style.display = "none";
            document.getElementById("reviewAlreadyDone").style.display = "block";
        }, 2000);

    } catch (err) {
        console.error("Submit Review Error:", err);
        showReviewFormMessage(err.message || "فشل الإرسال", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال المراجعة';
    }
}

// ✅ رسائل الفورم
function showReviewFormMessage(message, type = "error") {
    const el = document.getElementById("reviewFormMessage");
    if (!el) return;

    el.textContent = message;
    el.className = "auth-message";

    if (message) {
        el.classList.add("show", type);
    }
}

// ✅ فتح صورة في نافذة
function openReviewImage(url) {
    const w = window.open("", "_blank");
    if (w) {
        w.document.write(`
            <html>
            <head><title>صورة المراجعة</title></head>
            <body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                <img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;">
            </body>
            </html>
        `);
    }
}

// ✅ Exports
window.loadProductReviews = loadProductReviews;
window.sortReviews = sortReviews;
window.selectReviewStar = selectReviewStar;
window.removeReviewImage = removeReviewImage;
window.openReviewImage = openReviewImage;