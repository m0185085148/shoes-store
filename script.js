const SUPABASE_URL = 'https://uobuxepixrqijgciurve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5cu-Flvr7CSvRPMT3hByMQ_CfO7mBIv';
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;
let products = [];
let cart = [];
try { cart = JSON.parse(localStorage.getItem('myCart')) || []; } catch { cart = []; }

const $ = id => document.getElementById(id);
const cartCountElement = $('cartCount'), cartModal = $('cartModal'), cartBtn = $('cartBtn'), closeCartBtn = $('closeCartBtn');
const cartItemsContainer = $('cartItemsContainer'), cartTotalPrice = $('cartTotalPrice'), checkoutBtn = $('checkoutBtn');
const menuBtn = $('menuBtn'), mobileMenu = $('mobileMenu'), searchBtn = $('searchBtn'), productGrid = $('productGrid'), emptyProducts = $('emptyProducts');

function normalizeProduct(item) {
  let sizes = item.sizes;
  if (typeof sizes === 'string') { try { sizes = JSON.parse(sizes); } catch { sizes = []; } }
  if (!Array.isArray(sizes)) sizes = [];
  return { id: Number(item.id), name: item.name || '', category: item.category || '', price: Number(item.price || 0), oldPrice: item.old_price == null ? null : Number(item.old_price), badge: item.badge || '', tags: item.badge ? [item.badge] : [], rating: 5, sizes, image: item.image || '', description: item.description || '' };
}

async function fetchProductsFromSupabase() {
  if (!supabaseClient) { showToast('تعذر تحميل Supabase'); return; }
  const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: false });
  if (error) { console.error(error); showToast('تعذر تحميل المنتجات'); return; }
  products = (data || []).map(normalizeProduct);
  const savedCategory = sessionStorage.getItem('stepCategory');
  if (savedCategory) { sessionStorage.removeItem('stepCategory'); filterProducts(savedCategory); } else displayProducts(products);
  syncCartWithProducts();
}

async function saveProductToSupabase(productData) {
  if (!supabaseClient) throw new Error('Supabase غير متصل');
  const payload = { name: productData.name.trim(), category: productData.category, price: Number(productData.price), old_price: productData.oldPrice === '' || productData.oldPrice == null ? null : Number(productData.oldPrice), badge: productData.badge || null, sizes: Array.isArray(productData.sizes) ? productData.sizes : [], image: productData.image || null, description: productData.description || '' };
  const { error } = await supabaseClient.from('products').insert(payload);
  if (error) throw error;
}

function productCardHTML(product) {
  const stars = '★'.repeat(Math.max(0, Math.min(5, Number(product.rating) || 5)));
  const sizesOptions = product.sizes.map(size => `<option value="${escapeHTML(size)}">${escapeHTML(size)}</option>`).join('');
  return `<div class="product-card"><a href="product.html?id=${product.id}" class="product-image-link"><div class="product-image"><img class="product-image-inner" src="${escapeAttr(product.image)}" alt="${escapeAttr(product.name)}" loading="lazy">${product.badge ? `<span class="product-badge">${escapeHTML(product.badge)}</span>` : ''}</div></a><div class="product-info"><div class="product-category">${escapeHTML(product.category)}</div><a href="product.html?id=${product.id}"><h3>${escapeHTML(product.name)}</h3></a><div class="product-rating">${stars}</div><div class="price-box"><span class="product-price">${product.price} جنيه</span>${product.oldPrice ? `<span class="old-price">${product.oldPrice} جنيه</span>` : ''}</div><label class="size-label" for="size-select-${product.id}">المقاس</label><select class="size-select" id="size-select-${product.id}"><option value="">اختر المقاس</option>${sizesOptions}</select><button class="add-to-cart" type="button" onclick="addToCartFromGrid(${product.id})"><i class="fa-solid fa-bag-shopping"></i> إضافة للسلة</button></div></div>`;
}
function displayProducts(list = products) {
  if (!productGrid) return;
  productGrid.innerHTML = list.map(productCardHTML).join('');
  if (emptyProducts) emptyProducts.style.display = list.length ? 'none' : 'block';
}
function setActiveFilter(category, buttonElement = null) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  const target = buttonElement || [...document.querySelectorAll('.filter-btn')].find(btn => btn.dataset.filter === category);
  target?.classList.add('active');
}
function filterProducts(category, buttonElement = null) {
  setActiveFilter(category, buttonElement);
  const list = category === 'all' ? products : products.filter(p => p.category === category);
  displayProducts(list);
  $('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function goToCategory(category) { sessionStorage.setItem('stepCategory', category); }
function addToCartFromGrid(productId) {
  const product = products.find(p => p.id === Number(productId)); if (!product) return;
  const select = $(`size-select-${product.id}`), size = select?.value || '';
  if (!size) { showToast('اختار المقاس الأول'); select?.focus(); return; }
  const existing = cart.find(i => i.id === product.id && String(i.size) === String(size));
  if (existing) existing.quantity = Number(existing.quantity || 0) + 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, size, quantity: 1 });
  updateCartUI(); showToast(`تمت إضافة ${product.name} مقاس ${size} للسلة`);
}
function syncCartWithProducts() { const ids = new Set(products.map(p => p.id)); cart = cart.filter(i => ids.has(Number(i.id)) && i.size != null); updateCartUI(); }
function updateCartUI() { cart.forEach(i => i.quantity = Math.max(1, Number(i.quantity || 1))); const total = cart.reduce((s,i)=>s+i.quantity,0); if(cartCountElement) cartCountElement.textContent=total; localStorage.setItem('myCart',JSON.stringify(cart)); renderCartModal(); }
function renderCartModal() {
  if (!cartItemsContainer || !cartTotalPrice) return;
  if (!cart.length) { cartItemsContainer.innerHTML='<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><p>السلة فارغة حاليًا</p></div>'; cartTotalPrice.textContent='0 جنيه'; return; }
  let total=0; cartItemsContainer.innerHTML='';
  cart.forEach(item=>{ const itemTotal=Number(item.price)*Number(item.quantity); total+=itemTotal; const el=document.createElement('div'); el.className='cart-item'; el.innerHTML=`<div class="cart-item-image" style="background-image:url('${escapeAttr(item.image)}')"></div><div class="cart-item-info"><h4>${escapeHTML(item.name)}</h4><div class="cart-item-size">المقاس: ${escapeHTML(item.size)}</div><div class="cart-item-price">${item.price} جنيه</div><div class="cart-controls"><button class="quantity-btn" type="button" onclick="changeCartQuantity(${item.id}, '${String(item.size).replaceAll("'","\\'")}', -1)">−</button><span class="quantity-value">${item.quantity}</span><button class="quantity-btn" type="button" onclick="changeCartQuantity(${item.id}, '${String(item.size).replaceAll("'","\\'")}', 1)">+</button></div><button class="remove-item-btn" type="button" onclick="removeFromCart(${item.id}, '${String(item.size).replaceAll("'","\\'")}')">حذف المنتج</button></div>`; cartItemsContainer.appendChild(el); });
  cartTotalPrice.textContent=`${total} جنيه`;
}
function changeCartQuantity(id,size,change){ const item=cart.find(i=>i.id===Number(id)&&String(i.size)===String(size)); if(!item)return; item.quantity=Number(item.quantity)+Number(change); if(item.quantity<=0) cart=cart.filter(i=>!(i.id===Number(id)&&String(i.size)===String(size))); updateCartUI(); }
function removeFromCart(id,size){ cart=cart.filter(i=>!(i.id===Number(id)&&String(i.size)===String(size))); updateCartUI(); showToast('تم حذف المنتج من السلة'); }
function openCart(){cartModal?.classList.add('open');document.body.classList.add('cart-open');} function closeCart(){cartModal?.classList.remove('open');document.body.classList.remove('cart-open');}
function showToast(message){document.querySelector('.toast-notification')?.remove();const t=document.createElement('div');t.className='toast-notification';t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.classList.add('show'),30);setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},2500);}
function checkoutWhatsApp(){if(!cart.length){showToast('السلة فارغة. أضف حذاء أولًا');return;} const phone='201060722464';let message='مرحبًا، أريد إتمام طلب شراء من STEP\n\n';let total=0;cart.forEach((i,n)=>{const x=Number(i.price)*Number(i.quantity);total+=x;message+=`${n+1}. ${i.name}\nالمقاس: ${i.size}\nالكمية: ${i.quantity}\nالسعر: ${i.price} جنيه\nالإجمالي: ${x} جنيه\n\n`;});message+=`الإجمالي الكلي: ${total} جنيه\n\nأريد تأكيد الطلب.`;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,'_blank');}
function performSearch(){const term=prompt('اكتب اسم الحذاء أو القسم الذي تبحث عنه');if(!term)return;const q=term.trim().toLowerCase();const result=products.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q));if(!result.length){showToast('لم يتم العثور على المنتج');return;}displayProducts(result);document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));$('products')?.scrollIntoView({behavior:'smooth'});}
function escapeHTML(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));} function escapeAttr(value){return escapeHTML(value);}
cartBtn?.addEventListener('click',openCart);closeCartBtn?.addEventListener('click',closeCart);cartModal?.addEventListener('click',e=>{if(e.target===cartModal)closeCart();});checkoutBtn?.addEventListener('click',checkoutWhatsApp);searchBtn?.addEventListener('click',performSearch);menuBtn?.addEventListener('click',()=>mobileMenu?.classList.toggle('open'));mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mobileMenu.classList.remove('open')));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart();});
document.addEventListener('DOMContentLoaded',()=>{updateCartUI();fetchProductsFromSupabase();});
window.products = products;
window.filterProducts = filterProducts;
window.addToCartFromGrid = addToCartFromGrid;
window.changeCartQuantity = changeCartQuantity;
window.removeFromCart = removeFromCart;
window.goToCategory = goToCategory;
window.fetchProductsFromSupabase = fetchProductsFromSupabase;
window.saveProductToSupabase = saveProductToSupabase;
window.supabaseClient = supabaseClient;
