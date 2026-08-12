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

// Initialize Firebase
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
      allProducts = data.filter(item => item != null);
    } else {
      Object.keys(data).forEach(key => {
        allProducts.push({ id: key, ...data[key] });
      });
    }
    filterAndSort();
  } else {
    document.getElementById('container').innerHTML = 
      `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">Firebase database me koi product nahi mila.</p>`;
  }
}, (error) => {
  console.error("Firebase Read Error:", error);
  document.getElementById('container').innerHTML = 
    `<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px 0;">Connection failed! Rules ya Internet check karein.</p>`;
});

// Render Product Cards
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
    card.onclick = () => openProductModal(p);

    const title = p.name || p.title || 'Product';
    const price = p.price || 0;
    const oldPrice = p.oldPrice || p.originalPrice || Math.round(price * 1.22);
    const imgSrc = p.image || p.imageUrl || 'https://via.placeholder.com/150';
    const discount = p.discount || '18% OFF';

    card.innerHTML = `
      <div>
        <span class="badge-discount">${discount}</span>
        <img src="${imgSrc}" alt="${title}" class="product-img" onerror="this.src='https://via.placeholder.com/120'">
        <h3 class="product-title">${title}</h3>
        <div class="rating">★★★★★</div>
        <div class="price-row">
          <span class="old-price">₹${oldPrice}</span>
          <span class="new-price">₹${price}</span>
        </div>
      </div>
      <button class="add-btn" onclick="event.stopPropagation(); addToCartDirect('${p.id || title}')">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

// Filter and Search Logic
window.filterAndSort = function() {
  const searchInput = document.getElementById('search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
  
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

  renderProducts(filtered);
};

window.filterData = function(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterAndSort();
};

// Modals
window.openProductModal = function(product) {
  selectedProduct = product;
  document.getElementById('m-img').src = product.image || product.imageUrl || '';
  document.getElementById('m-name').innerText = product.name || product.title || '';
  document.getElementById('m-price').innerText = '₹' + (product.price || 0);
  document.getElementById('m-wa').href = `https://wa.me/919024686665?text=Hi,%20I%20am%20interested%20in%20${encodeURIComponent(product.name || product.title || '')}`;
  
  document.getElementById('prodModal').style.display = 'flex';
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).style.display = 'none';
};

// Cart Logic
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

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  if (cartCount) cartCount.innerText = totalItems;

  if (cart.length === 0) {
    if (cartList) cartList.innerHTML = `<p style='color:#64748b; text-align:center;'>Cart is empty.</p>`;
    if (cartTotal) cartTotal.innerText = '0';
    return;
  }

  if (cartList) {
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
      const pPrice = item.price || 0;
      total += pPrice * item.qty;
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

    if (cartTotal) cartTotal.innerText = total;
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
  document.getElementById('cartModal').style.display = 'flex';
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }
}




    


            

            

