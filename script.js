// Data Fetcher - Reads BOTH 'ecommerce_products' and 'products' nodes simultaneously
function loadProducts() {
    const dbRef = database.ref();
    
    // Listen to both nodes and combine them
    dbRef.on('value', (snapshot) => {
        const rootData = snapshot.val() || {};
        allProducts = [];

        // 1. Fetch from 'ecommerce_products'
        if (rootData.ecommerce_products) {
            parseNodeData(rootData.ecommerce_products);
        }

        // 2. Fetch from 'products'
        if (rootData.products) {
            parseNodeData(rootData.products);
        }

        // 3. Render integrated catalog
        renderProducts();
    });
}

function parseNodeData(data) {
    if (Array.isArray(data)) {
        data.forEach((item, index) => {
            if (item) allProducts.push({ id: 'arr_' + index, ...item });
        });
    } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            if (data[key]) {
                allProducts.push({ id: key, ...data[key] });
            }
        });
    }
}


            

