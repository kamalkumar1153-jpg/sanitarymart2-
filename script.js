// Smart & Flexible Filter Logic
window.filterAndSort = function() {
  const searchInput = document.getElementById('search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCategory = activeBtn ? activeBtn.innerText.trim().toLowerCase() : 'all products';

  let filtered = allProducts.filter(p => {
    // Collect all text from product object safely
    const pName = (p.name || p.title || p.productName || '').toLowerCase();
    const pCat = (p.category || p.cat || p.type || '').toLowerCase();
    
    // Check Search Match
    const matchesSearch = searchQuery === '' || pName.includes(searchQuery) || pCat.includes(searchQuery);

    // Flexible Category Match
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

// Fixed Render Function (Correct Name & Discount Formatting)
function renderProducts(products) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;">Koi product nahi mila.</p>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openProductModal(p);

    // Smart Fallbacks for Firebase Keys
    const title = p.name || p.title || p.productName || p.label || 'Sanitary Item';
    const price = p.price || p.sellingPrice || 0;
    const oldPrice = p.oldPrice || p.originalPrice || p.mrp || Math.round(price * 1.25);
    const imgSrc = p.image || p.imageUrl || p.img || 'https://via.placeholder.com/150';
    
    // Discount Badge Format Fix (30 -> 30% OFF)
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
      <button class="add-btn" onclick="event.stopPropagation(); addToCartDirect('${p.id || title}')">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}





    


            

            

