// Exact Config directly matching your Console Screenshot
const firebaseConfig = {
  apiKey: "AIzaSyCuhd6WeneZFqkScgyahmkzGPV-U78Zb0s",
  authDomain: "sanitarymart-65014.firebaseapp.com",
  databaseURL: "https://sanitarymart-65014-default-rtdb.firebaseio.com",
  projectId: "sanitarymart-65014",
  storageBucket: "sanitarymart-65014.firebasestorage.app",
  messagingSenderId: "285578370716",
  appId: "1:285578370716:web:e689a8c22951da1fb25759",
  measurementId: "G-0XJC8RN9..." // Updated from console
};

// Initialize Firebase safely
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let allProducts = [];
let cart = [];
let selectedProduct = null;
let discountPercent = 0;

// Fetch Products from Realtime Database
const productsRef = db.ref('products');

productsRef.on('value', (snapshot) => {
  const data = snapshot.val();
  allProducts = [];

  if (data) {
    // If database returns Object of objects or Array
    if (Array.isArray(data)) {
      allProducts = data.filter(item => item != null);
    } else {
      Object.keys(data).forEach(key => {
        allProducts.push({ id: key, ...data[key] });
      });
    }
    console.log("Firebase Products Connected:", allProducts);
    filterAndSort();
  } else {
    console.log("Database Node 'products' is empty!");
    document.getElementById('container').innerHTML = 
      `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">No products found in Firebase.</p>`;
  }
}, (error) => {
  console.error("Firebase Read Error:", error);
});

// Render Products Grid (Matching Your Design)
function renderProducts(products) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">Koi product nahi mila.</p>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cssText = "background:#fff; border-radius:16px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); position:relative; border:1px solid #f1f5f9;";
    card.onclick = () => openProductModal(p);

    const title = p.name || p.title || 'Product';
    const price = p.price || 0;
    const oldPrice = p.oldPrice || p.originalPrice || Math.round(price * 1.22);
    const imgSrc = p.image || p.imageUrl || 'https://via.placeholder.com/150';
    const discount = p.discount || '18% OFF';

    card.innerHTML = `
      <div style="position:relative; text-align:center;">
        <span style="position:absolute; top:0; left:0; background:#ffc107; color:#000; font-size:10px; font-weight:800; padding:2px 8px; border-radius:6px;">${discount}</span>
        <img src="${imgSrc}" alt="${title}" style="width:100%; height:120px; object-fit:contain; margin:8px 0;" onerror="this.src='https://via.placeholder.com/120'">
      </div>
      <h3 style="font-size:12px; font-weight:700; color:#1e293b; margin:4px 0; line-height:1.3; height:32px; overflow:hidden;">${title}</h3>
      <div style="color:#ffc107; font-size:10px; margin-bottom:4px;">★★★★★</div>
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:8px;">
        <span style="text-decoration:line-through; color:#94a3b8; font-size:11px;">₹${oldPrice}</span>
        <span style="color:#ef4444; font-weight:800; font-size:14px;">₹${price}</span>
      </div>
      <button class="buy-btn" style="width:100%; bg-color:#007bff; background:#007bff; color:white; border:none; padding:8px; border-radius:10px; font-weight:bold; font-size:12px; cursor:pointer;" onclick="event.stopPropagation(); addToCartDirect('${p.id || title}')">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

// Filter and Search Logic
window.filterAndSort = function() {
  const searchInput = document.getElementById('search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
  const sortSelect = document.getElementById('sortSelect');
  const sortOption = sortSelect ? sortSelect.value : 'default';
  
  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCategory = activeBtn ? activeBtn.innerText.trim() : 'All Products';

  let filtered = allProducts.filter(p => {
    const pName = (p.name || p.title || '').toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    
    const matchesSearch = pName.includes(searchQuery);
    const matchesCategory = (currentCategory === 'All Products' || currentCategory === 'All') 
      ? true 
      : pCat.includes(currentCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  if (sortOption === 'low-high') {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortOption === 'high-low') {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  renderProducts(filtered);
};

window.filterData = function(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterAndSort();
};

// Modal Handling
window.openProductModal = function(product) {
  selectedProduct = product;
  const modalImg = document.getElementById('m-img');
  const modalName = document.getElementById('m-name');
  const modalPrice = document.getElementById('m-price');
  const modalWa = document.getElementById('m-wa');

  if(modalImg) modalImg.src = product.image || product.imageUrl || '';
  if(modalName) modalName.innerText = product.name || product.title || '';
  if(modalPrice) modalPrice.innerText = '₹' + (product.price || 0);
  if(modalWa) modalWa.href = `https://wa.me/919024686665?text=Hi,%20I%20am%20interested%20in%20${encodeURIComponent(product.name || product.title || '')}`;
  
  const prodModal = document.getElementById('prodModal');
  if(prodModal) prodModal.style.display = 'flex';
};

window.closeModal = function(modalId) {
  const m = document.getElementById(modalId);
  if(m) m.style.display = 'none';
};

// Cart Handling
window.addToCartDirect = function(id) {
  const p = allProducts.find(item => (item.id === id || item.name === id || item.title === id));
  if (p) {
    const exist = cart.find(item => item.id === (p.id || p.name));
    if (exist) {
      exist.qty += 1;
    } else {
      cart.push({ ...p, id: p.id || p.name, qty: 1 });
    }
    updateCartUI();
    showToast(`${p.name || p.title} added to cart!`);
  }
};

window.addSelectedToCart = function() {
  if (selectedProduct) {
    addToCartDirect(selectedProduct.id || selectedProduct.name);
    closeModal('prodModal');
  }
};

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutForm = document.getElementById('checkoutForm');

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  if(cartCount) cartCount.innerText = totalItems;

  if (cart.length === 0) {
    if(cartList) cartList.innerHTML = `<p style='color:#64748b; text-align:center;'>Your shopping cart is empty.</p>`;
    if(checkoutForm) checkoutForm.style.display = 'none';
    if(cartTotal) cartTotal.innerText = '0';
    return;
  }

  if(checkoutForm) checkoutForm.style.display = 'block';
  if(cartList) {
    cartList.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
      const pPrice = item.price || 0;
      subtotal += pPrice * item.qty;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px;';
      row.innerHTML = `
        <div>
          <strong>${item.name || item.title}</strong><br>
          <span style="color:#64748b;">₹${pPrice} x ${item.qty}</span>
        </div>
        <div>
          <button onclick="changeQty('${item.id}', -1)" style="padding:2px 8px; border-radius:4px; border:1px solid #ccc;">-</button>
          <span style="margin:0 6px; font-weight:bold;">${item.qty}</span>
          <button onclick="changeQty('${item.id}', 1)" style="padding:2px 8px; border-radius:4px; border:1px solid #ccc;">+</button>
        </div>
      `;
      cartList.appendChild(row);
    });

    const finalTotal = subtotal - (subtotal * (discountPercent / 100));
    if(cartTotal) cartTotal.innerText = Math.round(finalTotal);
  }
}

window.changeQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== id);
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
  if(cartModal) cartModal.style.display = 'flex';
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  if(toast) {
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }
}



    


            

            

