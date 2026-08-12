// Exact Config matching your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCuhd6WeneZFqkScgyahmkzGPV-U78Zb0s",
  authDomain: "sanitarymart-65014.firebaseapp.com",
  databaseURL: "https://sanitarymart-65014-default-rtdb.firebaseio.com",
  projectId: "sanitarymart-65014",
  storageBucket: "sanitarymart-65014.firebasestorage.app",
  messagingSenderId: "285578370716",
  appId: "1:285578370716:web:e689a8c22951da1fb25759",
  measurementId: "G-0XJC8RN9"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let allProducts = [];
let cart = [];
let selectedProduct = null;

// Fetch Products from Realtime Database
const productsRef = db.ref('products');

productsRef.on('value', (snapshot) => {
  const data = snapshot.val();
  allProducts = [];

  if (data) {
    if (Array.isArray(data)) {
      allProducts = data.filter(item => item != null).map((item, idx) => ({ _index: idx, ...item }));
    } else {
      Object.keys(data).forEach((key, idx) => {
        allProducts.push({ _id: key, _index: idx, ...data[key] });
      });
    }
    filterAndSort();
  } else {
    document.getElementById('container').innerHTML = 
      `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">Firebase database me koi product nahi mila.</p>`;
  }
}, (error) => {
  console.error("Firebase Read Error:", error);
});

// Render Product Cards with Actual Firebase Names
function renderProducts(products) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">Koi product nahi mila.</p>`;
    return;
  }

  products.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Index Mapping for Click Trigger
    const productIndex = p._index !== undefined ? p._index : index;
    card.setAttribute('onclick', `openProductModalByIndex(${productIndex})`);

    // Dynamic Property Fallbacks for Exact Name Detection
    const title = p.name || p.title || p.productName || p.label || 'Sanitary Product';
    const price = p.price || p.sellingPrice || 0;
    const oldPrice = p.oldPrice || p.originalPrice || p.mrp || Math.round(price * 1.25);
    const imgSrc = p.image || p.imageUrl || p.img || 'https://via.placeholder.com/150';
    
    let rawDiscount = p.discount || p.offer || '18';
    let discountText = String(rawDiscount).includes('%') ? rawDiscount : `${rawDiscount}% OFF`;

    card.innerHTML = `
      <div>
        <span class="badge-discount">${discountText}</span>
        <img src="${imgSrc}" alt="${title}" class="product-img" onerror="this.src='https://via.placeholder.com/120'">
        <h3 class="product-title" style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 6px 0; line-height: 1.3; height: 34px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${title}</h3>
        <div class="rating">★★★★★</div>
        <div class="price-row">
          <span class="old-price">₹${oldPrice}</span>
          <span class="new-price">₹${price}</span>
        </div>
      </div>
      <button class="add-btn" onclick="event.stopPropagation(); addToCartByIndex(${productIndex})">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

// Open Product Modal with Name & Image
window.openProductModalByIndex = function(index) {
  const product = allProducts.find(p => p._index === index) || allProducts[index];
  if (!product) return;

  selectedProduct = product;

  const title = product.name || product.title || product.productName || 'Sanitary Product';
  const price = product.price || product.sellingPrice || 0;
  const imgSrc = product.image || product.imageUrl || product.img || 'https://via.placeholder.com/150';

  const mImg = document.getElementById('m-img');
  const mName = document.getElementById('m-name');
  const mPrice = document.getElementById('m-price');
  const mWa = document.getElementById('m-wa');

  if (mImg) mImg.src = imgSrc;
  if (mName) mName.innerText = title;
  if (mPrice) mPrice.innerText = '₹' + price;
  if (mWa) mWa.href = `https://wa.me/919024686665?text=Hi,%20I%20am%20interested%20in%20${encodeURIComponent(title)}`;

  const prodModal = document.getElementById('prodModal');
  if (prodModal) prodModal.style.display = 'flex';
};

// Filter & Category Logic
window.filterAndSort = function() {
  const searchInput = document.getElementById('search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCategory = activeBtn ? activeBtn.innerText.trim().toLowerCase() : 'all products';

  let filtered = allProducts.filter(p => {
    const pName = (p.name || p.title || p.productName || '').toLowerCase();
    const pCat = (p.category || p.cat || p.type || '').toLowerCase();
    
    const matchesSearch = searchQuery === '' || pName.includes(searchQuery) || pCat.includes(searchQuery);

    let matchesCategory = false;
    if (currentCategory === 'all products' || currentCategory === 'all') {
      matchesCategory = true;
    } else if (currentCategory.includes('sanitary')) {
      matchesCategory = pCat.includes('sanitary') || pCat.includes('seat') || pCat.includes('basin');
    } else if (currentCategory.includes('taps') || currentCategory.includes('shower')) {
      matchesCategory = pCat.includes('tap') || pCat.includes('shower') || pCat.includes('faucet') || pCat.includes('mixer');
    } else if (currentCategory.includes('health')) {
      matchesCategory = pCat.includes('health') || pCat.includes('faucet');
    } else {
      matchesCategory = pCat.includes(currentCategory);
    }

    return matchesSearch && matchesCategory;
  });

  renderProducts(filtered);
};

window.filterData = function(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterAndSort();
};

window.closeModal = function(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'none';
};

// Cart Functionality
window.addToCartByIndex = function(index) {
  const p = allProducts.find(item => item._index === index) || allProducts[index];
  if (p) {
    const pTitle = p.name || p.title || 'Product';
    const exist = cart.find(item => item._index === p._index);
    if (exist) {
      exist.qty += 1;
    } else {
      cart.push({ ...p, qty: 1 });
    }
    updateCartUI();
    showToast(`${pTitle} cart me add ho gaya!`);
  }
};

window.addSelectedToCart = function() {
  if (selectedProduct) {
    addToCartByIndex(selectedProduct._index);
    closeModal('prodModal');
  }
};

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  if (cartCount) cartCount.innerText = totalItems;

  if (cart.length === 0) {
    if (cartList) cartList.innerHTML = `<p style='color:#64748b; text-align:center;'>Cart khali hai.</p>`;
    if (cartTotal) cartTotal.innerText = '0';
    return;
  }

  if (cartList) {
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
      const pPrice = item.price || item.sellingPrice || 0;
      const pTitle = item.name || item.title || 'Product';
      total += pPrice * item.qty;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px;';
      row.innerHTML = `
        <div>
          <strong>${pTitle}</strong><br>
          <span style="color:#64748b;">₹${pPrice} x ${item.qty}</span>
        </div>
        <div>
          <button onclick="changeQty(${item._index}, -1)" style="padding:2px 8px; border-radius:4px; border:1px solid #ccc;">-</button>
          <span style="margin:0 6px; font-weight:bold;">${item.qty}</span>
          <button onclick="changeQty(${item._index}, 1)" style="padding:2px 8px; border-radius:4px; border:1px solid #ccc;">+</button>
        </div>
      `;
      cartList.appendChild(row);
    });

    if (cartTotal) cartTotal.innerText = total;
  }
}

window.changeQty = function(index, delta) {
  const item = cart.find(i => i._index === index);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i._index !== index);
    }
    updateCartUI();
  }
};

window.clearCart = function() {
  cart = [];
  updateCartUI();
};

window.openCartModal = function() {
  updateCartUI();
  const cartModal = document.getElementById('cartModal');
  if (cartModal) cartModal.style.display = 'flex';
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }
}







    


            

            

