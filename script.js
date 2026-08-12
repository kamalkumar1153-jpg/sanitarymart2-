// Smart Filtering Logic (Case Insensitive + Partial Match)
function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  let filtered = allProductsData.filter(item => {
    const name = (item.title || item.name || item.productName || "").toLowerCase();
    const cat = (item.category || item.type || item.cat || "").toLowerCase().trim();
    const selected = currentCategory.toLowerCase().trim();

    // 1. Check Search Match
    const matchSearch = name.includes(searchQuery.toLowerCase());

    // 2. Check Smart Category Match
    let matchCat = false;
    if (selected === 'all') {
      matchCat = true;
    } else if (selected.includes('tap') || selected.includes('faucet')) {
      // Tap ya Faucet dono me se kuch bhi ho toh match kare
      matchCat = cat.includes('tap') || cat.includes('faucet');
    } else if (selected.includes('basin')) {
      matchCat = cat.includes('basin') || cat.includes('wash');
    } else if (selected.includes('health')) {
      matchCat = cat.includes('health') || cat.includes('spray');
    } else {
      matchCat = cat === selected;
    }

    return matchCat && matchSearch;
  });

  if (currentSort === 'low-high') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (currentSort === 'high-low') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

  document.getElementById("product-count-text").innerText = `${filtered.length} Items Available`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-2 text-center py-10 text-gray-500 font-semibold">
        "${currentCategory}" category me koyi product nahi mila!<br>
        <span class="text-xs text-gray-400 font-normal">("All" tab par click karke check karein)</span>
      </div>`;
    return;
  }

  filtered.forEach((item) => {
    const name = item.title || item.name || item.productName || "Sanitary Item";
    const imgSrc = item.image || item.imageUrl || item.img || "https://via.placeholder.com/300?text=Sanitary+Mart";
    const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");

    grid.innerHTML += `
      <div class="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
        ${item.discount ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">${item.discount}</span>` : ''}

        <div onclick='window.openDetailModal(${itemJson})' class="w-full h-36 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative">
          <img src="${imgSrc}" alt="Product" class="w-full h-full object-contain p-1" onerror="this.onerror=null; this.src='https://via.placeholder.com/300?text=No+Image';" />
        </div>

        <div onclick='window.openDetailModal(${itemJson})' class="product-title cursor-pointer" title="${name}">${name}</div>

        <div class="flex items-baseline gap-1.5 my-1">
          <span class="text-base font-extrabold text-gray-900">₹${item.price || 0}</span>
          ${item.originalPrice ? `<span class="text-xs text-gray-400 line-through">₹${item.originalPrice}</span>` : ''}
        </div>

        <button onclick='window.addToCart(${itemJson})' class="w-full mt-1 border-2 border-blue-500 text-blue-600 font-bold py-1.5 rounded-xl text-xs active:bg-blue-50 transition-all">
          + Add
        </button>
      </div>
    `;
  });
}


            

            

