// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCuhd6WeneZFqkScgyVv2-8k5_xZz5N5o",
    databaseURL: "https://sanitarymart-65014-default-rtdb.firebaseio.com/",
    projectId: "sanitarymart-65014",
    appId: "1:285578370716:web:c47f43f25ad2ab86b25759"
};

// Pehle check karein ki Firebase initialized hai ya nahi
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let allProducts = [];
let currentCategory = 'All';

// 1. Flash Banner
database.ref('storeSettings/flashBanner').on('value', (snap) => {
    if(snap.exists()) {
        const text = snap.val();
        document.getElementById('tickerText').innerText = "⚡ " + (typeof text === 'object' ? Object.values(text)[0] : text);
    }
});

// 2. Fetch Products (Dono nodes check karega: 'ecommerce_products' aur 'products')
function loadProducts() {
    const dbRef = database.ref();
    
    // Pehle 'ecommerce_products' try karein
    dbRef.child('ecommerce_products').on('value', (snap) => {
        if (snap.exists()) {
            parseAndSetProducts(snap.val());
        } else {
            // Agar wahan nahi mila to 'products' node check karein
            dbRef.child('products').on('value', (snap2) => {
                if (snap2.exists()) {
                    parseAndSetProducts(snap2.val());
                } else {
                    allProducts = [];
                    renderProducts();
                }
            });
        }
    });
}

function parseAndSetProducts(data) {
    allProducts = [];
    if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            allProducts.push({ id: key, ...data[key] });
        });
    }
    renderProducts();
}

loadProducts();

// 3. Render Products (Flexible Key Check)
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const searchVal = (document.getElementById('searchInput')?.value || "").toLowerCase().trim();
    
    if(!grid) return;
    grid.innerHTML = "";

    const filtered = allProducts.filter(p => {
        // Safe null/undefined checks
        const pName = (p.title || p.name || p.productName || "").toLowerCase();
        const pCat = (p.category || p.cat || "").trim().toLowerCase();
        const selectedCat = currentCategory.trim().toLowerCase();

        const matchesCat = (currentCategory === 'All' || pCat === selectedCat || pCat.includes(selectedCat));
        const matchesSearch = (pName.includes(searchVal));

        return matchesCat && matchesSearch;
    });

    if(filtered.length === 0) {
        grid.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-box-open fs-1 mb-2"></i>
                <p class="mb-0 fw-semibold">No products found in this category.</p>
                <small>Check if products exist in Firebase Realtime Database.</small>
            </div>`;
        return;
    }

    filtered.forEach(p => {
        const title = p.title || p.name || "Sanitary Product";
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

