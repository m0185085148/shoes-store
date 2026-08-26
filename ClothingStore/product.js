const products = [

    {
        id: 1,
        name: "Urban Runner",
        category: "رجالي",
        price: 1290,
        oldPrice: null,
        badge: "جديد",
        tags: ["جديد"],
        rating: 5,
        sizes: [40, 41, 42, 43, 44, 45],
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85",
        description: "حذاء Urban Runner بتصميم يناسب الاستخدام اليومي والحركة. تصميم عملي مع شكل مناسب للملابس اليومية."
    },

    {
        id: 2,
        name: "Street Black",
        category: "رجالي",
        price: 1090,
        oldPrice: 1290,
        badge: "خصم",
        tags: ["خصم"],
        rating: 4,
        sizes: [40, 41, 42, 43, 44],
        image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=85",
        description: "حذاء Street Black بلون أسود وتصميم مناسب للإطلالات اليومية."
    },

    {
        id: 3,
        name: "Classic White",
        category: "حريمي",
        price: 1190,
        oldPrice: null,
        badge: "جديد",
        tags: ["جديد"],
        rating: 5,
        sizes: [36, 37, 38, 39, 40],
        image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=85",
        description: "حذاء Classic White بتصميم أبيض يناسب الإطلالات اليومية."
    },

    {
        id: 4,
        name: "Daily Sneaker",
        category: "حريمي",
        price: 990,
        oldPrice: 1190,
        badge: "خصم",
        tags: ["خصم"],
        rating: 4,
        sizes: [36, 37, 38, 39, 40],
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=85",
        description: "Daily Sneaker خيار مناسب للاستخدام اليومي مع تصميم بسيط."
    },

    {
        id: 5,
        name: "Urban White",
        category: "رجالي",
        price: 1390,
        oldPrice: null,
        badge: "",
        tags: [],
        rating: 5,
        sizes: [40, 41, 42, 43, 44, 45],
        image: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=800&q=85",
        description: "Urban White بتصميم يناسب الاستخدام اليومي والإطلالات الكاجوال."
    },

    {
        id: 6,
        name: "Street Runner",
        category: "حريمي",
        price: 1250,
        oldPrice: null,
        badge: "",
        tags: [],
        rating: 5,
        sizes: [36, 37, 38, 39, 40],
        image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=85",
        description: "Street Runner بتصميم عملي للاستخدام اليومي."
    }

]


const urlParams =
    new URLSearchParams(
        window.location.search
    )


const productId =
    Number(
        urlParams.get("id")
    )


let cart = []


try {

    cart =
        JSON.parse(
            localStorage.getItem("myCart")
        ) || []

} catch (error) {

    cart = []

}


cart =
    cart.filter(cartItem =>
        products.some(
            product =>
                product.id === cartItem.id
        )
    )


localStorage.setItem(
    "myCart",
    JSON.stringify(cart)
)


let detailsQuantity = 1


const productDetails =
    document.getElementById(
        "productDetails"
    )


const relatedProducts =
    document.getElementById(
        "relatedProducts"
    )


const cartCountElement =
    document.getElementById(
        "cartCount"
    )


const cartModal =
    document.getElementById(
        "cartModal"
    )


const cartBtn =
    document.getElementById(
        "cartBtn"
    )


const closeCartBtn =
    document.getElementById(
        "closeCartBtn"
    )


const cartItemsContainer =
    document.getElementById(
        "cartItemsContainer"
    )


const cartTotalPrice =
    document.getElementById(
        "cartTotalPrice"
    )


const checkoutBtn =
    document.getElementById(
        "checkoutBtn"
    )


const menuBtn =
    document.getElementById(
        "menuBtn"
    )


const mobileMenu =
    document.getElementById(
        "mobileMenu"
    )


const searchBtn =
    document.getElementById(
        "searchBtn"
    )


function displayProductDetails() {

    if (!productDetails) {
        return
    }


    const product =
        products.find(
            item =>
                item.id === productId
        )


    if (!product) {

        productDetails.innerHTML = `

            <div class="product-not-found">

                <h2>
                    المنتج غير موجود
                </h2>

                <p>
                    المنتج المطلوب غير متاح حاليًا.
                </p>

                <br>

                <a href="index.html#products">
                    العودة للمنتجات
                </a>

            </div>

        `

        return
    }


    document.title =
        `STEP | ${product.name}`


    detailsQuantity = 1


    const stars =
        "★".repeat(
            product.rating || 5
        )


    const sizes =
        product.sizes
            .map(
                size =>
                    `
                        <option value="${size}">
                            ${size}
                        </option>
                    `
            )
            .join("")


    productDetails.innerHTML = `

        <div class="product-details-grid">


            <div class="product-details-image">

                ${
                    product.badge
                        ? `
                            <span class="product-details-badge">
                                ${product.badge}
                            </span>
                        `
                        : ""
                }


                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

            </div>


            <div class="product-details-info">


                <p class="product-details-category">
                    ${product.category}
                </p>


                <h1>
                    ${product.name}
                </h1>


                <div class="details-rating">

                    <span>
                        ${stars}
                    </span>

                    <span>
                        (${product.rating || 5})
                    </span>

                </div>


                <div class="details-price">

                    <span class="details-current-price">
                        ${product.price} جنيه
                    </span>

                    ${
                        product.oldPrice
                            ? `
                                <span class="details-old-price">
                                    ${product.oldPrice} جنيه
                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="details-divider"></div>


                <p class="product-description">
                    ${product.description}
                </p>


                <div class="details-option">

                    <label for="detailsSize">
                        المقاس
                    </label>


                    <select
                        id="detailsSize"
                        class="details-size-select"
                    >

                        <option value="">
                            اختر المقاس
                        </option>

                        ${sizes}

                    </select>

                </div>


                <div class="details-option">

                    <label>
                        الكمية
                    </label>


                    <div class="details-quantity">

                        <button
                            id="detailsQuantityMinus"
                            type="button"
                        >
                            −
                        </button>


                        <span id="detailsQuantity">
                            1
                        </span>


                        <button
                            id="detailsQuantityPlus"
                            type="button"
                        >
                            +
                        </button>

                    </div>

                </div>


                <button
                    id="detailsAddButton"
                    class="details-add-btn"
                    type="button"
                >

                    <i class="fa-solid fa-bag-shopping"></i>

                    إضافة للسلة

                </button>


                <a
                    href="index.html#products"
                    class="back-products-btn"
                >

                    <i class="fa-solid fa-arrow-right"></i>

                    العودة للمنتجات

                </a>


            </div>

        </div>

    `


    const minusButton =
        document.getElementById(
            "detailsQuantityMinus"
        )


    const plusButton =
        document.getElementById(
            "detailsQuantityPlus"
        )


    const addButton =
        document.getElementById(
            "detailsAddButton"
        )


    minusButton?.addEventListener(
        "click",
        () =>
            changeDetailsQuantity(-1)
    )


    plusButton?.addEventListener(
        "click",
        () =>
            changeDetailsQuantity(1)
    )


    addButton?.addEventListener(
        "click",
        addProductToCart
    )

}


function changeDetailsQuantity(change) {

    detailsQuantity += change


    if (detailsQuantity < 1) {
        detailsQuantity = 1
    }


    if (detailsQuantity > 20) {
        detailsQuantity = 20
    }


    const quantityElement =
        document.getElementById(
            "detailsQuantity"
        )


    if (quantityElement) {

        quantityElement.textContent =
            detailsQuantity

    }

}


function addProductToCart() {

    const product =
        products.find(
            item =>
                item.id === productId
        )


    if (!product) {
        return
    }


    const sizeSelect =
        document.getElementById(
            "detailsSize"
        )


    const selectedSize =
        sizeSelect
            ? sizeSelect.value
            : ""


    if (!selectedSize) {

        showToast(
            "اختار المقاس الأول"
        )


        sizeSelect?.focus()

        return
    }


    const existingProduct =
        cart.find(
            item =>
                item.id === product.id &&
                String(item.size) ===
                String(selectedSize)
        )


    if (existingProduct) {

        existingProduct.quantity =
            Number(existingProduct.quantity || 0) +
            detailsQuantity

    } else {

        cart.push({

            ...product,

            size: selectedSize,

            quantity: detailsQuantity

        })

    }


    updateCartUI()


    showToast(
        `تمت إضافة ${product.name} مقاس ${selectedSize} للسلة`
    )

}


function updateCartUI() {

    cart =
        cart.filter(cartItem =>
            products.some(
                product =>
                    product.id === cartItem.id
            )
        )


    const totalItems =
        cart.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        )


    if (cartCountElement) {

        cartCountElement.textContent =
            totalItems

    }


    localStorage.setItem(
        "myCart",
        JSON.stringify(cart)
    )


    renderCartModal()

}


function renderCartModal() {

    if (
        !cartItemsContainer ||
        !cartTotalPrice
    ) {
        return
    }


    cartItemsContainer.innerHTML = ""


    if (cart.length === 0) {

        cartItemsContainer.innerHTML = `

            <div class="cart-empty">

                <i class="fa-solid fa-bag-shopping"></i>

                <p>
                    السلة فارغة حاليًا
                </p>

            </div>

        `


        cartTotalPrice.textContent =
            "0 جنيه"


        return
    }


    let total = 0


    cart.forEach(item => {

        const itemTotal =
            Number(item.price) *
            Number(item.quantity)


        total += itemTotal


        const itemElement =
            document.createElement(
                "div"
            )


        itemElement.className =
            "cart-item"


        itemElement.innerHTML = `

            <div
                class="cart-item-image"
                style="background-image: url('${item.image}')"
            ></div>


            <div class="cart-item-info">

                <h4>
                    ${item.name}
                </h4>


                <div class="cart-item-size">
                    المقاس: ${item.size}
                </div>


                <div class="cart-item-price">
                    ${item.price} جنيه
                </div>


                <div class="cart-controls">

                    <button
                        class="quantity-btn"
                        type="button"
                        onclick="changeCartQuantity(
                            ${item.id},
                            '${item.size}',
                            -1
                        )"
                    >
                        −
                    </button>


                    <span class="quantity-value">
                        ${item.quantity}
                    </span>


                    <button
                        class="quantity-btn"
                        type="button"
                        onclick="changeCartQuantity(
                            ${item.id},
                            '${item.size}',
                            1
                        )"
                    >
                        +
                    </button>

                </div>


                <button
                    class="remove-item-btn"
                    type="button"
                    onclick="removeFromCart(
                        ${item.id},
                        '${item.size}'
                    )"
                >
                    حذف المنتج
                </button>

            </div>

        `


        cartItemsContainer.appendChild(
            itemElement
        )

    })


    cartTotalPrice.textContent =
        `${total} جنيه`

}


function changeCartQuantity(
    productId,
    size,
    change
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.id === productId &&
                String(cartItem.size) ===
                String(size)
        )


    if (!item) {
        return
    }


    item.quantity =
        Number(item.quantity || 0) +
        Number(change)


    if (item.quantity <= 0) {

        cart =
            cart.filter(
                cartItem =>
                    !(
                        cartItem.id === productId &&
                        String(cartItem.size) ===
                        String(size)
                    )
            )

    }


    updateCartUI()

}


function removeFromCart(
    productId,
    size
) {

    cart =
        cart.filter(
            item =>
                !(
                    item.id === productId &&
                    String(item.size) ===
                    String(size)
                )
        )


    updateCartUI()


    showToast(
        "تم حذف المنتج من السلة"
    )

}


function openCart() {

    cartModal?.classList.add(
        "open"
    )


    document.body.classList.add(
        "cart-open"
    )

}


function closeCart() {

    cartModal?.classList.remove(
        "open"
    )


    document.body.classList.remove(
        "cart-open"
    )

}


if (cartBtn) {

    cartBtn.addEventListener(
        "click",
        openCart
    )

}


if (closeCartBtn) {

    closeCartBtn.addEventListener(
        "click",
        closeCart
    )

}


if (cartModal) {

    cartModal.addEventListener(
        "click",
        event => {

            if (
                event.target === cartModal
            ) {

                closeCart()

            }

        }
    )

}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeCart()

        }

    }
)


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            mobileMenu?.classList.toggle(
                "open"
            )

        }
    )

}


if (mobileMenu) {

    mobileMenu
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    mobileMenu.classList.remove(
                        "open"
                    )

                }
            )

        })

}


function showToast(message) {

    const oldToast =
        document.querySelector(
            ".toast-notification"
        )


    if (oldToast) {
        oldToast.remove()
    }


    const toast =
        document.createElement(
            "div"
        )


    toast.className =
        "toast-notification"


    toast.textContent =
        message


    document.body.appendChild(
        toast
    )


    setTimeout(
        () =>
            toast.classList.add("show"),
        50
    )


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            )


            setTimeout(
                () =>
                    toast.remove(),
                300
            )

        },
        2500
    )

}


function checkoutWhatsApp() {

    if (cart.length === 0) {

        showToast(
            "السلة فارغة. أضف حذاء أولًا"
        )

        return
    }


    const phoneNumber =
        "201060722464"


    let message =
        "مرحبًا، أريد إتمام طلب شراء من STEP\n\n"


    let total = 0


    cart.forEach(
        (item, index) => {

            const itemTotal =
                Number(item.price) *
                Number(item.quantity)


            total += itemTotal


            message +=
                `${index + 1}. ${item.name}\n` +
                `المقاس: ${item.size}\n` +
                `الكمية: ${item.quantity}\n` +
                `السعر: ${item.price} جنيه\n` +
                `الإجمالي: ${itemTotal} جنيه\n\n`

        }
    )


    message +=
        `الإجمالي الكلي: ${total} جنيه\n\n`


    message +=
        "أريد تأكيد الطلب."


    const whatsappUrl =
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`


    window.open(
        whatsappUrl,
        "_blank"
    )

}


if (checkoutBtn) {

    checkoutBtn.addEventListener(
        "click",
        checkoutWhatsApp
    )

}


function performSearch() {

    const searchTerm =
        prompt(
            "اكتب اسم الحذاء الذي تبحث عنه"
        )


    if (!searchTerm) {
        return
    }


    const normalizedSearch =
        searchTerm
            .trim()
            .toLowerCase()


    if (!normalizedSearch) {
        return
    }


    const results =
        products.filter(product =>
            product.name
                .toLowerCase()
                .includes(normalizedSearch) ||
            product.category
                .toLowerCase()
                .includes(normalizedSearch)
        )


    if (results.length === 0) {

        showToast(
            "لم يتم العثور على المنتج"
        )

        return
    }


    displaySearchResults(results)

}


function displaySearchResults(results) {

    const related =
        results.filter(
            product =>
                product.id !== productId
        )


    const productsToShow =
        related.length > 0
            ? related
            : results


    if (!relatedProducts) {
        return
    }


    relatedProducts.innerHTML = ""


    productsToShow.forEach(product => {

        const card =
            document.createElement(
                "div"
            )


        card.className =
            "product-card"


        const stars =
            "★".repeat(
                product.rating || 5
            )


        card.innerHTML = `

            <a
                href="product.html?id=${product.id}"
                class="product-image-link"
            >

                <div class="product-image">

                    <img
                        class="product-image-inner"
                        src="${product.image}"
                        alt="${product.name}"
                        loading="lazy"
                    >

                    ${
                        product.badge
                            ? `
                                <span class="product-badge">
                                    ${product.badge}
                                </span>
                            `
                            : ""
                    }

                </div>

            </a>


            <div class="product-info">

                <div class="product-category">
                    ${product.category}
                </div>

                <a
                    href="product.html?id=${product.id}"
                >

                    <h3>
                        ${product.name}
                    </h3>

                </a>

                <div class="product-rating">
                    ${stars}
                </div>

                <div class="price-box">

                    <span class="product-price">
                        ${product.price} جنيه
                    </span>

                    ${
                        product.oldPrice
                            ? `
                                <span class="old-price">
                                    ${product.oldPrice} جنيه
                                </span>
                            `
                            : ""
                    }

                </div>

                <a
                    href="product.html?id=${product.id}"
                    class="add-to-cart"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                    "
                >
                    عرض المنتج
                </a>

            </div>

        `


        relatedProducts.appendChild(
            card
        )

    })

}


if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        performSearch
    )

}


function displayRelatedProducts() {

    if (!relatedProducts) {
        return
    }


    const related =
        products
            .filter(
                product =>
                    product.id !== productId
            )
            .slice(0, 4)


    relatedProducts.innerHTML = ""


    related.forEach(product => {

        const card =
            document.createElement(
                "div"
            )


        card.className =
            "product-card"


        const stars =
            "★".repeat(
                product.rating || 5
            )


        card.innerHTML = `

            <a
                href="product.html?id=${product.id}"
                class="product-image-link"
            >

                <div class="product-image">

                    <img
                        class="product-image-inner"
                        src="${product.image}"
                        alt="${product.name}"
                        loading="lazy"
                    >

                    ${
                        product.badge
                            ? `
                                <span class="product-badge">
                                    ${product.badge}
                                </span>
                            `
                            : ""
                    }

                </div>

            </a>


            <div class="product-info">

                <div class="product-category">
                    ${product.category}
                </div>


                <a
                    href="product.html?id=${product.id}"
                >

                    <h3>
                        ${product.name}
                    </h3>

                </a>


                <div class="product-rating">
                    ${stars}
                </div>


                <div class="price-box">

                    <span class="product-price">
                        ${product.price} جنيه
                    </span>

                    ${
                        product.oldPrice
                            ? `
                                <span class="old-price">
                                    ${product.oldPrice} جنيه
                                </span>
                            `
                            : ""
                    }

                </div>


                <a
                    href="product.html?id=${product.id}"
                    class="add-to-cart"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                    "
                >
                    عرض المنتج
                </a>

            </div>

        `


        relatedProducts.appendChild(
            card
        )

    })

}


function goToCategory(category) {

    sessionStorage.setItem(
        "stepCategory",
        category
    )

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        displayProductDetails()

        displayRelatedProducts()

        updateCartUI()

    }
)