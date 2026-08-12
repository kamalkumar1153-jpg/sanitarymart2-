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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let allProducts = [];
let cart = [];
let selectedProduct = null;

// Realtime Database Fetch
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
    updateCategoryCounts();
    filterAndSort();
  } else {
    document.getElementById('container').innerHTML = 
      `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">Firebase database me koi product nahi mila.</p>`;
  }
});

// Category Counters Update
function updateCategoryCounts() {
  let sanitaryCount = 0;
  let tapsCount = 0;
  let healthCount = 0;

  allProducts.forEach(p => {
    const pCat = (p.category || p.cat || p.type || '').toLowerCase();
    if (pCat.includes('sanitary') || pCat.includes('seat') || pCat.includes('basin')) sanitaryCount++;
    if (pCat.includes('tap') || pCat.includes('shower') || pCat.includes('faucet') || pCat.includes('mixer')) tapsCount++;
    if (pCat.includes('health') || pCat.includes('faucet')) healthCount++;
  });

  document.getElementById('count-all').innerText = `(${allProducts.length})`;
  document.getElementById('count-sanitary').innerText = `(${sanitaryCount})`;
  document.getElementById('count-taps').innerText = `(${tapsCount})`;
  document.getElementById('count-health').innerText = `(${healthCount})`;
}

// Render Products
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
    
    const productIndex = p._index !== undefined ? p._index : index;
    card.setAttribute('onclick', `openProductModalByIndex(${productIndex})`);

    const title = p.name || p.title || p.productName || 'Sanitary Product';
    const price = p.price || p.sellingPrice || 0;
    const oldPrice = p.oldPrice || p.originalPrice || p.mrp || Math.round(price * 1.25);
    const imgSrc = p.image || p.imageUrl || p.img || 'https://via.placeholder.com/150';
    
    let rawDiscount = p.discount || p.offer || '18';
    let discountText = String(rawDiscount).includes('%') ? rawDiscount : `${rawDiscount}% OFF`;

    card.innerHTML = `
      <div>
        <span class="badge-discount">${discountText}</span>
        <img src="${imgSrc}" alt="${title}" class="product-img" onerror="this.src='https://via.placeholder.com/120'">
        <h3 class="product-title">${title}</h3>
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

// Search & Clear Logic
window.filterAndSort = function() {
  const searchInput = document.getElementById('search');
  const clearBtn = document.getElementById('clearSearch');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  if (clearBtn) {
    clearBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
  }

  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCategory = activeBtn ? activeBtn.innerText.trim().toLowerCase() : 'all';

  let filtered = allProducts.filter(p => {
    const pName = (p.name || p.title || p.productName || '').toLowerCase();
    const pCat = (p.category || p.cat || p.type || '').toLowerCase();
    
    const matchesSearch = searchQuery === '' || pName.includes(searchQuery) || pCat.includes(searchQuery);

    let matchesCategory = false;
    if (currentCategory.includes('all')) {
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

window.clearSearchInput = function() {
  document.getElementById('search').value = '';
  filterAndSort();
};

window.filterData = function(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterAndSort();
};

// Modal & Image Lightbox Zoom
window.openProductModalByIndex = function(index) {
  const product = allProducts.find(p => p._index === index) || allProducts[index];
  if (!product) return;

  selectedProduct = product;

  const title = product.name || product.title || product.productName || 'Sanitary Product';
  const price = product.price || product.sellingPrice || 0;
  const imgSrc = product.image || product.imageUrl || product.img || 'https://via.placeholder.com/150';

  document.getElementById('m-img').src = imgSrc;
  document.getElementById('m-name').innerText = title;
  document.getElementById('m-price').innerText = '₹' + price;
  document.getElementById('m-wa').href = `https://wa.me/919024686665?text=Hi,%20I%20am%20interested%20in%20${encodeURIComponent(title)}`;

  document.getElementById('prodModal').style.display = 'flex';
};

window.openImageZoom = function() {
  const currentImgSrc = document.getElementById('m-img').src;
  document.getElementById('lightboxImg').src = currentImgSrc;
  document.getElementById('imageZoomModal').style.display = 'flex';
};

window.closeImageZoom = function() {
  document.getElementById('imageZoomModal').style.display = 'none';
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).style.display = 'none';
};

// Cart & WhatsApp Order Direct Integration
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
  const checkoutDetails = document.getElementById('checkoutDetails');

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  if (cartCount) cartCount.innerText = totalItems;

  if (cart.length === 0) {
    if (cartList) cartList.innerHTML = `<p style='color:#64748b; text-align:center;'>Cart khali hai.</p>`;
    if (cartTotal) cartTotal.innerText = '0';
    if (checkoutDetails) checkoutDetails.style.display = 'none';
    return;
  }

  if (checkoutDetails) checkoutDetails.style.display = 'block';

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

// Send Order to WhatsApp & Save in Firebase Database
window.sendWhatsAppOrder = function() {
  if (cart.length === 0) {
    alert("Pehle cart me products add karein!");
    return;
  }

  const nameInput = document.getElementById('custName').value.trim();
  const phoneInput = document.getElementById('custPhone').value.trim();

  if (!nameInput || !phoneInput) {
    alert("Kripya apna Naam aur Mobile Number bharein!");
    return;
  }

  let totalBill = 0;
  let itemDetailsText = "";

  const orderItemsArray = cart.map(item => {
    const pTitle = item.name || item.title || 'Product';
    const pPrice = item.price || item.sellingPrice || 0;
    const itemTotal = pPrice * item.qty;
    totalBill += itemTotal;

    itemDetailsText += `• ${pTitle} (Qty: ${item.qty}) - ₹${itemTotal}\n`;

    return {
      title: pTitle,
      price: pPrice,
      qty: item.qty,
      subtotal: itemTotal
    };
  });

  // 1. Save in Firebase Realtime Database node 'orders'
  const newOrderRef = db.ref('orders').push();
  const orderPayload = {
    orderId: newOrderRef.key,
    customerName: nameInput,
    customerPhone: phoneInput,
    items: orderItemsArray,
    totalBill: totalBill,
    createdAt: new Date().toISOString()
  };

  newOrderRef.set(orderPayload, (error) => {
    if (error) {
      console.error("Firebase Order Save Error:", error);
    } else {
      console.log("Order saved to Firebase successfully!");
    }
  });

  // 2. Format WhatsApp Message & Open
  const waMessage = `🛒 *NEW ORDER - SANITARY MART*\n\n` +
    `👤 *Customer Name:* ${nameInput}\n` +
    `📞 *Phone:* ${phoneInput}\n\n` +
    `📦 *Order Items:*\n${itemDetailsText}\n` +
    `💰 *Total Amount:* ₹${totalBill}\n\n` +
    `Please confirm my order and share payment details!`;

  const waURL = `https://wa.me/919024686665?text=${encodeURIComponent(waMessage)}`;
  window.open(waURL, '_blank');
  
  clearCart();
  closeModal('cartModal');
};

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







    


            

            

