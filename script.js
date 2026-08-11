// ==========================================
// 1. FIREBASE INITIALIZATION & CONFIG
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCuhd6WeneZFqkScgyVv2-8k5_xZz5N5o",
    databaseURL: "https://sanitarymart-65014-default-rtdb.firebaseio.com/",
    projectId: "sanitarymart-65014",
    appId: "1:285578370716:web:c47f43f25ad2ab86b25759"
};

// Prevent duplicate initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Global Variables
let allProducts = [];
let cart = [];
let currentCategory = 'All';

// ==========================================
// 2. FETCH FLASH BANNER TICKER
// ==========================================
function initBannerListener() {
    database.ref().on('value', (snapshot) => {
        const rootData = snapshot.val() || {};
        const tickerEl = document.getElementById('tickerText');
        if (!tickerEl) return;

        let bannerVal = "";
        if (rootData.storeSettings && rootData.storeSettings.flashBanner) {
            bannerVal = rootData.storeSettings.flashBanner;
        } else if (rootData.settings && rootData.settings.flashBanner) {
            bannerVal = rootData.settings.flashBanner;
        }

        if (bannerVal) {
            const text = typeof bannerVal === 'object' ? Object.values(bannerVal)[0] : bannerVal;
            tickerEl.innerText = "⚡ " + text;
        }
    });
}

// ==========================================
// 3. COMBINED DUAL-NODE PRODUCT FETCHING
// ==========================================
function initProductsListener() {
    database.ref().on('value', (snapshot) => {
        const rootData = snapshot.val() || {};
        allProducts = [];

        // Fetch from 'ecommerce_products'
        if (rootData.ecommerce_products) {
            parseNodeData(rootData.ecommerce_products, 'ecom_');
        }

        // Fetch from 'products'
        if (rootData.products) {
            parseNodeData(rootData.products, 'prod_');
        }

        renderProducts();
    });
}

function parseNodeData(data, prefix) {
    if (Array.isArray(data)) {
        data.forEach((item, index) => {
            if (item) allProducts.push({ id: prefix + index, ...item });
        });
    } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            if (data[key]) {
                allProducts.push({ id: key, ...data[key] });
            }
        });
    }
}

// ==========================================
// 4. RENDER PRODUCTS TO GRID
// ==========================================
function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const searchInput = document.getElementById('searchInput');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    grid.innerHTML = "";

    // Filter Products by Category & Search
    const filtered = allProducts.filter(p => {
        const title = (p.title || p.name || p.productName || "").toLowerCase();
        const cat = (p.category || p.cat || "").toLowerCase();
        const selectedCat = currentCategory.toLowerCase();

        const matchesCat = (currentCategory === 'All' || cat === selectedCat || cat.includes(selectedCat));
        const matchesSearch = title.includes(searchVal);

        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fa-solid fa-box-open fs-1 mb-2"></i>
                <p class="mb-0 fw-semibold">No products found in this category.</p>
            </div>`;
        return;
    }

    // Generate HTML Card for Each Product
    filtered.forEach(p => {
        const id = p.id || Math.random().toString(36).substring(7);
        const title = p.title || p.name || "Sanitary Item";
        const price = Number(p.price || p.rate || 0);
        const disc = Number(p.discount || p.disc || 0);
        const finalPrice = disc > 0 ? Math.round(price - (price * disc / 100)) : price;
        const imgUrl = p.image || p.img || p.imageUrl || 'https://via.placeholder.com/150';
        const isOut = p.outOfStock || p.stock === 0;

        grid.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card product-card h-100 shadow-sm">
                    ${disc > 0 ? `<div class="discount-badge">${disc}% OFF</div>` : ''}
                    <div class="img-container">
                        <img src="${imgUrl}" class="product-img" alt="${title}">
                    </div>
                    <div class="card-body d-flex flex-column p-2 pt-0">
                        <h6 class="card-title text-truncate mb-1 fw-bold fs-6">${title}</h6>
                        <div class="mb-2">
                            <span class="fw-bold text-dark fs-6">₹${finalPrice}</span>
                            ${disc > 0 ? `<small class="text-muted text-decoration-line-through ms-1">₹${price}</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-primary w-100 mt-auto rounded-pill fw-semibold" 
                            ${isOut ? 'disabled' : ''} onclick="addToCart('${id}')">
                            <i class="fa-solid fa-plus me-1"></i> Add
                        </button>
                    </div>
                    ${isOut ? `<div class="stock-overlay"><i class="fa-solid fa-ban me-1"></i> Out of Stock</div>` : ''}
                </div>
            </div>
        `;
    });
}

// ==========================================
// 5. FILTERING FUNCTIONS
// ==========================================
function filterCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProducts();
}

function filterProducts() {
    renderProducts();
}

// ==========================================
// 6. CART MANAGEMENT & UI LOGIC
// ==========================================
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function updateCartUI() {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const cartTotalFloat = document.getElementById('cartTotalFloat');
    const cartCount = document.getElementById('cartCount');
    const cartBadgeFloat = document.getElementById('cartBadgeFloat');

    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        if(cartList) cartList.innerHTML = "<p class='text-muted text-center py-3'>Aapki cart khali hai.</p>";
        if(cartTotal) cartTotal.innerText = "0";
        if(cartTotalFloat) cartTotalFloat.innerText = "0";
        if(cartCount) cartCount.innerText = "0";
        if(cartBadgeFloat) cartBadgeFloat.innerText = "0";
        return;
    }

    if(cartList) cartList.innerHTML = "";

    cart.forEach((item, index) => {
        const price = Number(item.price || 0);
        const disc = Number(item.discount || 0);
        const itemPrice = disc > 0 ? Math.round(price - (price * disc / 100)) : price;
        const itemSubtotal = itemPrice * item.quantity;
        
        total += itemSubtotal;
        count += item.quantity;

        if(cartList) {
            cartList.innerHTML += `
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div style="flex:1;">
                        <strong class="d-block text-truncate" style="max-width: 180px;">${item.title || item.name}</strong>
                        <small class="text-muted">₹${itemPrice} x ${item.quantity} = ₹${itemSubtotal}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-light border px-2 py-0" onclick="changeQty(${index}, -1)">-</button>
                        <span class="fw-bold fs-6">${item.quantity}</span>
                        <button class="btn btn-sm btn-light border px-2 py-0" onclick="changeQty(${index}, 1)">+</button>
                        <button class="btn btn-sm text-danger ms-1" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        }
    });

    if(cartTotal) cartTotal.innerText = total;
    if(cartTotalFloat) cartTotalFloat.innerText = total;
    if(cartCount) cartCount.innerText = count;
    if(cartBadgeFloat) cartBadgeFloat.innerText = count;
}

// ==========================================
// 7. WHATSAPP CHECKOUT FUNCTION
// ==========================================
function sendWhatsAppOrder() {
    if (cart.length === 0) {
        alert("Pehle cart me koi product add karein!");
        return;
    }

    let msg = "🛒 *New Order - Sanitary Mart*\n---------------------------\n";
    let grandTotal = 0;

    cart.forEach((item, i) => {
        const price = Number(item.price || 0);
        const disc = Number(item.discount || 0);
        const itemPrice = disc > 0 ? Math.round(price - (price * disc / 100)) : price;
        const subtotal = itemPrice * item.quantity;
        grandTotal += subtotal;
        msg += `${i+1}. *${item.title || item.name}*\n   Qty: ${item.quantity} | Price: ₹${subtotal}\n`;
    });

    msg += `---------------------------\n💰 *Grand Total: ₹${grandTotal}*\n\nPlease confirm my order!`;

    // Modern WhatsApp order routing
    const phone = "919000000000"; // Aap yahan apna WhatsApp Mobile Number Dalein
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// 8. START LISTENERS
// ==========================================
initBannerListener();
initProductsListener();

            

            

