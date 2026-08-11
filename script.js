// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCuhd6WeneZFqkScgyVv2-8k5_xZz5N5o",
    databaseURL: "https://sanitarymart-65014-default-rtdb.firebaseio.com/",
    projectId: "sanitarymart-65014",
    appId: "1:285578370716:web:c47f43f25ad2ab86b25759"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let allProducts = [];
let cart = [];
let currentCategory = 'All';

// 1. Fetch Flash Banner Ticker
database.ref('storeSettings/flashBanner').on('value', (snap) => {
    if(snap.exists()) {
        document.getElementById('tickerText').innerText = "⚡ " + snap.val();
    }
});

// 2. Fetch Products
database.ref('ecommerce_products').on('value', (snap) => {
    allProducts = [];
    if(snap.exists()) {
        snap.forEach((child) => {
            allProducts.push({ id: child.key, ...child.val() });
        });
    }
    renderProducts();
});

// 3. Render Product Cards
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    grid.innerHTML = "";

    const filtered = allProducts.filter(p => {
        const matchesCat = (currentCategory === 'All' || p.category === currentCategory);
        const matchesSearch = (p.title && p.title.toLowerCase().includes(searchVal));
        return matchesCat && matchesSearch;
    });

    if(filtered.length === 0) {
        grid.innerHTML = `<div class="text-center py-5 text-muted"><i class="fa-solid fa-box-open fs-1 mb-2"></i><p>No products found in this category.</p></div>`;
        return;
    }

    filtered.forEach(p => {
        const disc = p.discount || 0;
        const finalPrice = Math.round(p.price - (p.price * disc / 100));
        const isOut = p.outOfStock;

        grid.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card product-card h-100">
                    ${disc > 0 ? `<div class="discount-badge">${disc}% OFF</div>` : ''}
                    <div class="img-container">
                        <img src="${p.image || 'https://via.placeholder.com/150'}" class="product-img" alt="${p.title}">
                    </div>
                    <div class="card-body d-flex flex-column p-2 pt-0">
                        <h6 class="card-title text-truncate mb-1 fw-bold fs-6">${p.title}</h6>
                        <div class="mb-2">
                            <span class="fw-bold text-dark fs-6">₹${finalPrice}</span>
                            ${disc > 0 ? `<small class="text-muted text-decoration-line-through ms-1">₹${p.price}</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-primary w-100 mt-auto rounded-pill fw-semibold" 
                            ${isOut ? 'disabled' : ''} onclick="addToCart('${p.id}')">
                            <i class="fa-solid fa-plus me-1"></i> Add
                        </button>
                    </div>
                    ${isOut ? `<div class="stock-overlay"><i class="fa-solid fa-ban me-1"></i> Out of Stock</div>` : ''}
                </div>
            </div>
        `;
    });
}

// 4. Filters
function filterCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
}

function filterProducts() {
    renderProducts();
}

// 5. Cart Logic
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if(!product) return;

    const existing = cart.find(item => item.id === productId);
    if(existing) {
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
    if(cart[index].quantity <= 0) {
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

    if (cart.length === 0) {
        cartList.innerHTML = "<p class='text-muted text-center py-3'>Aapki cart khali hai.</p>";
        cartTotal.innerText = "0";
        cartTotalFloat.innerText = "0";
        cartCount.innerText = "0";
        cartBadgeFloat.innerText = "0";
        return;
    }

    let total = 0;
    let count = 0;
    cartList.innerHTML = "";

    cart.forEach((item, index) => {
        const itemPrice = Math.round(item.price - (item.price * (item.discount || 0) / 100));
        const itemSubtotal = itemPrice * item.quantity;
        total += itemSubtotal;
        count += item.quantity;

        cartList.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <div style="flex:1;">
                    <strong class="d-block text-truncate" style="max-width: 180px;">${item.title}</strong>
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
    });

    cartTotal.innerText = total;
    cartTotalFloat.innerText = total;
    cartCount.innerText = count;
    cartBadgeFloat.innerText = count;
}

// 6. WhatsApp Order Integration
function sendWhatsAppOrder() {
    if(cart.length === 0) {
        alert("Pehle cart me koi product add karein!");
        return;
    }

    let msg = "🛒 *New Order - Sanitary Mart*\n---------------------------\n";
    let grandTotal = 0;

    cart.forEach((item, i) => {
        const itemPrice = Math.round(item.price - (item.price * (item.discount || 0) / 100));
        const subtotal = itemPrice * item.quantity;
        grandTotal += subtotal;
        msg += `${i+1}. *${item.title}*\n   Qty: ${item.quantity} | Price: ₹${subtotal}\n`;
    });

    msg += `---------------------------\n💰 *Grand Total: ₹${grandTotal}*\n\nPlease confirm my order!`;

    const phone = "919000000000"; // <--- Apna WhatsApp number add karein
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}
