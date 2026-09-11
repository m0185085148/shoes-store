<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>STEP | تفاصيل المنتج</title>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body>

<div class="top-announcement">
  <i class="fa-solid fa-truck-fast"></i>
  شحن مجاني للطلبات أكثر من 1000 جنيه
</div>

<header class="header">
  <div class="container header-content">
    <a href="index.html" class="logo">STEP</a>

    <nav class="main-nav">
      <a href="index.html">الرئيسية</a>
      <a href="index.html#products">الأحذية</a>
    </nav>

    <div class="header-actions">
      <button class="icon-button" id="searchBtn" type="button" aria-label="بحث">
        <i class="fa-solid fa-magnifying-glass"></i>
      </button>

      <div class="cart-icon-wrapper">
        <button class="icon-button" id="cartBtn" type="button" aria-label="سلة التسوق">
          <i class="fa-solid fa-bag-shopping"></i>
          <span id="cartCount" class="cart-count">0</span>
        </button>
      </div>

      <button class="menu-button" id="menuBtn" type="button" aria-label="القائمة">
        <i class="fa-solid fa-bars"></i>
      </button>
    </div>
  </div>

  <div id="mobileMenu" class="mobile-menu">
    <a href="index.html">الرئيسية</a>
    <a href="index.html#products">الأحذية</a>
  </div>
</header>

<main>
  <section class="product-details">
    <div class="container">
      <div id="productDetails"></div>
    </div>
  </section>

  <section class="products related-products">
    <div class="container">
      <div class="section-title">
        <p>اختيارات STEP</p>
        <h2>منتجات أخرى</h2>
      </div>
      <div class="product-grid" id="relatedProducts"></div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container footer-content">
    <div>
      <div class="footer-logo">STEP</div>
      <p>متجر أحذية عصرية.</p>
    </div>
    <div class="footer-links">
      <a href="index.html">الرئيسية</a>
      <a href="index.html#products">الأحذية</a>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>© 2026 STEP. جميع الحقوق محفوظة.</p>
  </div>
</footer>

<!-- CART MODAL -->
<div id="cartModal" class="cart-modal">
  <div class="cart-modal-content">
    <div class="cart-header">
      <div>
        <span class="cart-header-small">STEP STORE</span>
        <h2>سلة التسوق</h2>
      </div>
      <button id="closeCartBtn" class="close-btn" type="button">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div id="cartItemsContainer" class="cart-body"></div>

    <div class="cart-footer">
      <div class="cart-total">
        <span>الإجمالي</span>
        <span id="cartTotalPrice">0 جنيه</span>
      </div>
      <button id="checkoutBtn" class="checkout-btn" type="button">
        <i class="fa-solid fa-credit-card"></i>
        إتمام الطلب
      </button>
    </div>
  </div>
</div>

<!-- ORDER FORM MODAL -->
<div id="orderModal" class="order-modal">
  <div class="order-modal-content">
    <div class="order-header">
      <div>
        <span class="cart-header-small">STEP STORE</span>
        <h2>بيانات التوصيل</h2>
      </div>
      <button id="closeOrderBtn" class="close-btn" type="button">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <form id="orderForm" class="order-form">
      <div class="form-group">
        <label for="customerName">الاسم بالكامل *</label>
        <input type="text" id="customerName" required placeholder="مثال: أحمد محمد">
      </div>

      <div class="form-group">
        <label for="customerPhone">رقم الهاتف *</label>
        <input type="tel" id="customerPhone" required placeholder="01xxxxxxxxx" pattern="01[0-9]{9}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="governorate">المحافظة *</label>
          <select id="governorate" required>
            <option value="">اختر المحافظة</option>
            <option>القاهرة</option>
            <option>الجيزة</option>
            <option>الإسكندرية</option>
            <option>الدقهلية</option>
            <option>الشرقية</option>
            <option>القليوبية</option>
            <option>المنوفية</option>
            <option>الغربية</option>
            <option>كفر الشيخ</option>
            <option>دمياط</option>
            <option>بورسعيد</option>
            <option>الإسماعيلية</option>
            <option>السويس</option>
            <option>شمال سيناء</option>
            <option>جنوب سيناء</option>
            <option>البحيرة</option>
            <option>الفيوم</option>
            <option>بني سويف</option>
            <option>المنيا</option>
            <option>أسيوط</option>
            <option>سوهاج</option>
            <option>قنا</option>
            <option>الأقصر</option>
            <option>أسوان</option>
            <option>البحر الأحمر</option>
            <option>الوادي الجديد</option>
            <option>مطروح</option>
          </select>
        </div>

        <div class="form-group">
          <label for="city">المدينة / المنطقة</label>
          <input type="text" id="city" placeholder="مثال: مدينة نصر">
        </div>
      </div>

      <div class="form-group">
        <label for="customerAddress">العنوان بالتفصيل *</label>
        <textarea id="customerAddress" required rows="3" placeholder="اسم الشارع، رقم المبنى، رقم الشقة، علامة مميزة..."></textarea>
      </div>

      <div class="form-group">
        <label for="orderNotes">ملاحظات إضافية</label>
        <textarea id="orderNotes" rows="2" placeholder="أي تفاصيل تحب تضيفها (اختياري)"></textarea>
      </div>

      <div class="order-summary">
        <div class="order-summary-row">
          <span>عدد المنتجات</span>
          <span id="summaryCount">0</span>
        </div>
        <div class="order-summary-row total">
          <span>الإجمالي</span>
          <span id="summaryTotal">0 جنيه</span>
        </div>
      </div>

      <button type="submit" class="submit-order-btn" id="submitOrderBtn">
        <i class="fa-solid fa-check"></i>
        تأكيد الطلب
      </button>
    </form>
  </div>
</div>

<!-- SUCCESS MODAL -->
<div id="successModal" class="order-modal">
  <div class="order-modal-content success-content">
    <div class="success-icon">
      <i class="fa-solid fa-check"></i>
    </div>
    <h2>تم استلام طلبك بنجاح!</h2>
    <p>رقم طلبك: <strong id="successOrderId">-</strong></p>
    <p class="success-note">سيتم التواصل معك قريباً لتأكيد الطلب.</p>
    <button class="submit-order-btn" onclick="closeSuccessModal()">
      <i class="fa-solid fa-check"></i>
      تمام
    </button>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="script.js"></script>
</body>
</html>