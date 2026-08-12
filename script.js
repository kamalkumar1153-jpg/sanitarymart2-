// Firebase Initialization (Compat Syntax)
const firebaseConfig = {
  apiKey: "AIzaSyCuhd6WeneZFqkScgyahmkzGPV-U78Zb0s",
  authDomain: "sanitarymart-65014.firebaseapp.com",
  databaseURL: "https://sanitarymart-65014-default-rtdb.firebaseio.com",
  projectId: "sanitarymart-65014",
  storageBucket: "sanitarymart-65014.firebasestorage.app",
  messagingSenderId: "285578370716",
  appId: "1:285578370716:web:e689a8c22951da1fb25759",
  measurementId: "G-MDC3VWKHW9"
};

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
    Object.keys(data).forEach(key => {
      allProducts.push({ id: key, ...data[key] });
    });
  } else {
    // Default Sample Data (if database empty)
    allProducts = [
      { id: '1', name: 'Studio Wall Mixer L Bend', category: 'Taps', price: 4326, originalPrice: 5275, image: 'https://via.placeholder.com/150' },
      { id: '2', name: 'Studio Sink Mixer with Swivel Spout', category: 'Taps', price: 3272, originalPrice: 3990, image: 'https://via.placeholder.com/150' },
      { id: '3', name: 'Ceramic Table Top Basin', category: 'Sanitary', price: 2800, originalPrice: 3500, image: 'https://via.placeholder.com/150' },
      { id: '4', name: 'Health Faucet Brass Set', category: 'Health Faucet', price: 850, originalPrice: 1100, image: 'https://via.placeholder.com/150' }
    ];
  }
  filterAndSort();
});

// Render Products
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
    card.innerHTML = `
      <div style="position:relative;">
        <span style="position:absolute; top:8px; left:8px; background:#eab308; color:#000; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">18% OFF</span>
        <img src="${p.image}" alt="${p.name}" style="width:100%; height:130px; object-fit:contain; border-radius:8px;">
      </div>
      <h3 style="font-size:13px; font-weight:700; margin:8px 0 4px; line-height:1.2; height:32px; overflow:hidden;">${p.name}</h3>
      <div style="color:#eab308; font-size:10px; margin-bottom:4px;">⭐⭐⭐⭐⭐</div>
      <div style="display:flex; gap:6px; items-center;">
        <span style="text-decoration:line-through; color:#94a3b8; font-size:11px;">₹${p.originalPrice || p.price + 500}</span>
        <span style="color:#ef4444; font-weight:bold; font-size:14px;">₹${p.price}</span>
      </div>
      <button class="buy-btn" style="margin-top:8px; font-size:12px; padding:6px;" onclick="event.stopPropagation(); addToCartDirect('${p.id}')">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

// Filter and Sort Logic
window.filterAndSort = function() {
  const searchQuery = document.getElementById('search').value.toLowerCase();
  const sortOption = document.getElementById('sortSelect').value;
  const activeFilterBtn = document.querySelector('.filter-btn.active');
  const currentCategory = activeFilterBtn ? activeFilterBtn.innerText : 'All Products';

  let filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery);
    const matchesCategory = (currentCategory === 'All Products' || currentCategory === 'All') 
      ? true 
      : p.category.toLowerCase().includes(currentCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  if (sortOption === 'low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'high-low') {
    filtered.sort((a, b) => b.price - a.price);
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
  document.getElementById('m-img').src = product.image;
  document.getElementById('m-name').innerText = product.name;
  document.getElementById('m-price').innerText = '₹' + product.price;
  document.getElementById('m-wa').href = `https://wa.me/919024686665?text=Hi,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}`;
  document.getElementById('prodModal').style.display = 'flex';
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).style.display = 'none';
};

// Cart Logic
window.addToCartDirect = function(id) {
  const p = allProducts.find(item => item.id === id);
  if (p) {
    const exist = cart.find(item => item.id === id);
    if (exist) {
      exist.qty += 1;
    } else {
      cart.push({ ...p, qty: 1 });
    }
    updateCartUI();
    showToast(`${p.name} added to cart!`);
  }
};

window.addSelectedToCart = function() {
  if (selectedProduct) {
    addToCartDirect(selectedProduct.id);
    closeModal('prodModal');
  }
};

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutForm = document.getElementById('checkoutForm');

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.innerText = totalItems;

  if (cart.length === 0) {
    cartList.innerHTML = `<p style='color:#64748b; text-align:center;'>Your shopping cart is empty.</p>`;
    checkoutForm.style.display = 'none';
    cartTotal.innerText = '0';
    return;
  }

  checkoutForm.style.display = 'block';
  cartList.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-between; align-items:center; margin-bottom:8px; font-size:13px;';
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        <span style="color:#64748b;">₹${item.price} x ${item.qty}</span>
      </div>
      <div>
        <button onclick="changeQty('${item.id}', -1)" style="padding:2px 6px;">-</button>
        <span style="margin:0 4px;">${item.qty}</span>
        <button onclick="changeQty('${item.id}', 1)" style="padding:2px 6px;">+</button>
      </div>
    `;
    cartList.appendChild(row);
  });

  const finalTotal = subtotal - (subtotal * (discountPercent / 100));
  cartTotal.innerText = Math.round(finalTotal);
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

window.applyCoupon = function() {
  const coupon = document.getElementById('couponInput').value.trim().toUpperCase();
  const discountTag = document.getElementById('discountTag');
  
  if (coupon === 'FIRST50' || coupon === 'SAN500') {
    discountPercent = 10;
    discountTag.innerText = '(10% Discount Applied)';
    showToast('Coupon Applied Successfully!');
  } else {
    discountPercent = 0;
    discountTag.innerText = '';
    showToast('Invalid Coupon Code');
  }
  updateCartUI();
};

// Checkout & Payment
window.generatePaymentOptions = function() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const payMode = document.querySelector('input[name="paymentMode"]:checked').value;

  if (!name || !phone || !address) {
    alert('Kripya saari details fill karein!');
    return;
  }

  const amount = document.getElementById('cartTotal').innerText;
  const paymentArea = document.getElementById('paymentArea');

  if (payMode === 'UPI') {
    const upiUri = `upi://pay?pa=9024686665@ybl&pn=Sanitary%20Mart&am=${amount}&cu=INR`;
    document.getElementById('qrCodeImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
    document.getElementById('directUpiBtn').href = upiUri;
    
    const waMsg = `*New Order - Sanitary Mart*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nTotal: ₹${amount}\nPayment: UPI`;
    document.getElementById('waReceiptBtn').href = `https://wa.me/919024686665?text=${encodeURIComponent(waMsg)}`;
    
    paymentArea.style.display = 'block';
  } else {
    // COD
    const waMsg = `*New Order (COD) - Sanitary Mart*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nTotal: ₹${amount}\nPayment: Cash on Delivery`;
    window.open(`https://wa.me/919024686665?text=${encodeURIComponent(waMsg)}`, '_blank');
  }

  // Save order to Firebase
  db.ref('orders').push({
    name, phone, address, payMode, amount, items: cart, timestamp: Date.now()
  });
};

window.copyUpi = function() {
  navigator.clipboard.writeText('9024686665@ybl');
  showToast('UPI ID Copied!');
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  if(toast) {
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }
}

window.openTrackModal = function() { document.getElementById('trackModal').style.display = 'flex'; };
window.enableAudioAlert = function() { alert('Voice Alert Enabled'); };

    


            

            

