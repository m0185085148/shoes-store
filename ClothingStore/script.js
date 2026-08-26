// ==========================================
// تهيئة الاتصال بـ Supabase
// ==========================================
const SUPABASE_URL = 'https://uobuxepixrqijgciurve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5cu-Flvr7CSvRPMT3hByMQ_CfO7mBIv'; // الـ Key الخاص بك

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let products = [];

// جلب المنتجات تلقائياً عند فتح الموقع
async function fetchProductsFromSupabase() {
    try {
        let fetchedData = [];

        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('Error fetching products via SDK:', error);
            } else {
                fetchedData = data;
            }
        }

        // طريقة احتياطية لجلب البيانات عبر REST API في حالة عدم تحميل SDK
        if (!fetchedData || fetchedData.length === 0) {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id.desc`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            fetchedData = await res.json();
        }

        if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            products = fetchedData.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                price: item.price,
                oldPrice: item.old_price,
                badge: item.badge,
                tags: item.badge ? [item.badge] : [],
                rating: 5,
                sizes: typeof item.sizes === 'string' ? JSON.parse(item.sizes) : (item.sizes || []),
                image: item.image,
                description: item.description || ""
            }));

            const savedCategory = sessionStorage.getItem("stepCategory");
            if (savedCategory) {
                sessionStorage.removeItem("stepCategory");
                filterProducts(savedCategory);
            } else {
                displayProducts(products);
            }

            updateCartUI();
        }
    } catch (err) {
        console.error("خطأ أثناء جلب البيانات:", err);
    }
}

// حفظ المنتج الجديد في Supabase
async function saveProductToSupabase(productData) {
    if (!supabaseClient) {
        alert("مكتبة Supabase غير محملة بالشكل الصحيح");
        return;
    }

    const { data, error } = await supabaseClient
        .from('products')
        .insert([
            {
                name: productData.name,
                category: productData.category,
                price: parseFloat(productData.price),
                old_price: productData.oldPrice ? parseFloat(productData.oldPrice) : null,
                badge: productData.badge,
                sizes: productData.sizes,
                image: productData.image,
                description: productData.description || ""
            }
        ]);

    if (error) {
        alert("حدث خطأ أثناء حفظ المنتج!");
        console.error(error);
    } else {
        alert("تمت إضافة المنتج وحفظه بنجاح!");
        fetchProductsFromSupabase();
    }
}

let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("myCart")) || [];
} catch (error) {
    cart = [];
}

const cartCountElement = document.getElementById("cartCount");
const cartModal = document.getElementById("cartModal");
const cartBtn = document.getElementById("cartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalPrice = document.getElementById("cartTotalPrice");
const checkoutBtn = document.getElementById("checkoutBtn");
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const searchBtn = document.getElementById("searchBtn");
const productGrid = document.getElementById("productGrid");
const emptyProducts = document.getElementById("emptyProducts");

function displayProducts(filteredList = products) {
    if (!productGrid) return;

    productGrid.innerHTML = "";

    if (filteredList.length === 0) {
        if (emptyProducts) emptyProducts.style.display = "block";
        return;
    }

    if (emptyProducts) emptyProducts.style.display = "none";

    filteredList.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        const stars = "★".repeat(product.rating || 5);
        const sizesOptions = (product.sizes || [])
            .map(size => `<option value="${size}">${size}</option>`)
            .join("");

        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" class="product-image-link">
                <div class="product-image">
                    <img class="product-image-inner" src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
                </div>
            </a>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <a href="product.html?id=${product.id}">
                    <h3>${product.name}</h3>
                </a>
                <div class="product-rating">${stars}</div>
                <div class="price-box">
                    <span class="product-price">${product.price} جنيه</span>
                    ${product.oldPrice ? `<span class="old-price">${product.oldPrice} جنيه</span>` : ""}
                </div>
                <label class="size-label" for="size-select-${product.id}">المقاس</label>
                <select class="size-select" id="size-select-${product.id}">
                    <option value="">اختر المقاس</option>
                    ${sizesOptions}
                </select>
                <button class="add-to-cart" type="button" onclick="addToCartFromGrid(${product.id})">
                    <i class="fa-solid fa-bag-shopping"></i> إضافة للسلة
                </button>
            </div>
        `;

        productGrid.appendChild(productCard);
    });
}

function setActiveFilter(category, buttonElement = null) {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => button.classList.remove("active"));

    if (buttonElement) {
        buttonElement.classList.add("active");
        return;
    }

    const matchingButton = [...filterButtons].find(button => button.dataset.filter === category);
    if (matchingButton) matchingButton.classList.add("active");
}

function filterProducts(category, buttonElement = null) {
    setActiveFilter(category, buttonElement);
    let filtered = products;

    if (category === "all") {
        filtered = products;
    } else if (category === "جديد" || category === "خصم") {
        filtered = products.filter(product => product.badge === category || product.tags?.includes(category));
    } else {
        filtered = products.filter(product => product.category === category);
    }

    displayProducts(filtered);

    const productsSection = document.getElementById("products");
    if (productsSection && !buttonElement && window.location.hash !== "#products") {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function addToCartFromGrid(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    const sizeSelect = document.getElementById(`size-select-${productId}`);
    const selectedSize = sizeSelect ? sizeSelect.value : "";

    if (!selectedSize) {
        showToast("اختار المقاس الأول");
        sizeSelect?.focus();
        return;
    }

    const existingProduct = cart.find(
        item => item.id === product.id && String(item.size) === String(selectedSize)
    );

    if (existingProduct) {
        existingProduct.quantity = Number(existingProduct.quantity || 0) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: selectedSize,
            quantity: 1
        });
    }

    updateCartUI();
    showToast(`تمت إضافة ${product.name} مقاس ${selectedSize} للسلة`);
}

function updateCartUI() {
    cart = cart.filter(cartItem => products.some(product => product.id === cartItem.id));

    cart.forEach(item => {
        item.quantity = Math.max(1, Number(item.quantity || 1));
    });

    const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (cartCountElement) cartCountElement.textContent = totalItems;

    localStorage.setItem("myCart", JSON.stringify(cart));
    renderCartModal();
}

function renderCartModal() {
    if (!cartItemsContainer || !cartTotalPrice) return;

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-bag-shopping"></i>
                <p>السلة فارغة حاليًا</p>
            </div>
        `;
        cartTotalPrice.textContent = "0 جنيه";
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        total += itemTotal;

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";

        itemElement.innerHTML = `
            <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-size">المقاس: ${item.size}</div>
                <div class="cart-item-price">${item.price} جنيه</div>
                <div class="cart-controls">
                    <button class="quantity-btn" type="button" onclick="changeCartQuantity(${item.id}, '${item.size}', -1)">−</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" type="button" onclick="changeCartQuantity(${item.id}, '${item.size}', 1)">+</button>
                </div>
                <button class="remove-item-btn" type="button" onclick="removeFromCart(${item.id}, '${item.size}')">حذف المنتج</button>
            </div>
        `;

        cartItemsContainer.appendChild(itemElement);
    });

    cartTotalPrice.textContent = `${total} جنيه`;
}

function changeCartQuantity(productId, size, change) {
    const item = cart.find(
        cartItem => cartItem.id === productId && String(cartItem.size) === String(size)
    );

    if (!item) return;

    item.quantity = Number(item.quantity || 0) + Number(change);

    if (item.quantity <= 0) {
        cart = cart.filter(
            cartItem => !(cartItem.id === productId && String(cartItem.size) === String(size))
        );
    }

    updateCartUI();
}

function removeFromCart(productId, size) {
    const itemExists = cart.some(
        item => item.id === productId && String(item.size) === String(size)
    );

    if (!itemExists) return;

    cart = cart.filter(
        item => !(item.id === productId && String(item.size) === String(size))
    );

    updateCartUI();
    showToast("تم حذف المنتج من السلة");
}

function openCart() {
    if (!cartModal) return;
    cartModal.classList.add("open");
    document.body.classList.add("cart-open");
}

function closeCart() {
    if (!cartModal) return;
    cartModal.classList.remove("open");
    document.body.classList.remove("cart-open");
}

if (cartBtn) cartBtn.addEventListener("click", openCart);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

if (cartModal) {
    cartModal.addEventListener("click", event => {
        if (event.target === cartModal) closeCart();
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
});

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        mobileMenu?.classList.toggle("open");
    });
}

if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("open");
        });
    });
}

function showToast(message) {
    const oldToast = document.querySelector(".toast-notification");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        showToast("السلة فارغة. أضف حذاء أولًا");
        return;
    }

    const phoneNumber = "201060722464";
    let message = "مرحبًا، أريد إتمام طلب شراء من STEP\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        total += itemTotal;

        message +=
            `${index + 1}. ${item.name}\n` +
            `المقاس: ${item.size}\n` +
            `الكمية: ${item.quantity}\n` +
            `السعر: ${item.price} جنيه\n` +
            `الإجمالي: ${itemTotal} جنيه\n\n`;
    });

    message += `الإجمالي الكلي: ${total} جنيه\n\nأريد تأكيد الطلب.`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutWhatsApp);

function performSearch() {
    const searchTerm = prompt("اكتب اسم الحذاء الذي تبحث عنه");
    if (!searchTerm) return;

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return;

    const results = products.filter(
        product =>
            product.name.toLowerCase().includes(normalizedSearch) ||
            product.category.toLowerCase().includes(normalizedSearch)
    );

    if (results.length === 0) {

        showToast("لم يتم العثور على المنتج");
        return;
    }

    displayProducts(results);

    document.querySelectorAll(".filter-btn").forEach(button => button.classList.remove("active"));

    const productsSection = document.getElementById("products");
    productsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (searchBtn) searchBtn.addEventListener("click", performSearch);

document.addEventListener("DOMContentLoaded", () => {
    fetchProductsFromSupabase();
});