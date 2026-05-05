// ========== MARKETPLACE SYSTEM ==========
const marketplace = {
    // Constants
    PRODUCTS_KEY: 'mr3c0_products',
    CART_KEY: 'mr3c0_cart',
    ORDERS_KEY: 'mr3c0_orders',
    TAX_RATE: 0.1,

    // Initialize
    init() {
        if (!localStorage.getItem(this.PRODUCTS_KEY)) {
            localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify([]));
        }
        if (!sessionStorage.getItem(this.CART_KEY)) {
            sessionStorage.setItem(this.CART_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.ORDERS_KEY)) {
            localStorage.setItem(this.ORDERS_KEY, JSON.stringify([]));
        }
    },

    // Generate unique ID
    generateId() {
        return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Validate product data
    validateProduct(product) {
        if (!product.name || product.name.trim().length === 0) return false;
        if (!product.description || product.description.trim().length === 0) return false;
        if (product.price <= 0 || typeof product.price !== 'number') return false;
        if (!product.category || product.category.trim().length === 0) return false;
        if (product.stock < 0 || !Number.isInteger(product.stock)) return false;
        return true;
    },

    // Add product
    addProduct(productData) {
        if (!this.validateProduct(productData)) {
            console.error('Invalid product data');
            return false;
        }

        const product = {
            id: this.generateId(),
            name: this.escapeHtml(productData.name),
            description: this.escapeHtml(productData.description),
            price: parseFloat(productData.price),
            category: this.escapeHtml(productData.category),
            stock: parseInt(productData.stock),
            image_url: productData.image_url || null,
            emoji: productData.emoji || '📦',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            active: true
        };

        const products = JSON.parse(localStorage.getItem(this.PRODUCTS_KEY));
        products.push(product);
        localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
        console.log('Product added successfully:', product);
        return product;
    },

    // Get all products
    getProducts() {
        return JSON.parse(localStorage.getItem(this.PRODUCTS_KEY));
    },

    // Get product by ID
    getProduct(productId) {
        const products = this.getProducts();
        return products.find(p => p.id === productId);
    },

    // Update product stock
    updateStock(productId, quantity) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.stock = Math.max(0, product.stock - quantity);
            product.updated_at = new Date().toISOString();
            localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
            return true;
        }
        return false;
    },

    // Add to cart
    addToCart(productId, quantity) {
        const product = this.getProduct(productId);
        if (!product) {
            console.error('Product not found');
            return false;
        }

        if (quantity > product.stock) {
            console.error('Insufficient stock');
            return false;
        }

        const cart = JSON.parse(sessionStorage.getItem(this.CART_KEY));
        const existingItem = cart.find(item => item.productId === productId);

        if (existingItem) {
            if (existingItem.quantity + quantity > product.stock) {
                console.error('Insufficient stock for requested quantity');
                return false;
            }
            existingItem.quantity += quantity;
        } else {
            cart.push({
                productId: productId,
                productName: product.name,
                price: product.price,
                quantity: quantity,
                added_at: new Date().toISOString()
            });
        }

        sessionStorage.setItem(this.CART_KEY, JSON.stringify(cart));
        this.updateCartCount();
        console.log('Added to cart:', productId, 'Quantity:', quantity);
        return true;
    },

    // Get cart
    getCart() {
        return JSON.parse(sessionStorage.getItem(this.CART_KEY));
    },

    // Remove from cart
    removeFromCart(productId) {
        let cart = JSON.parse(sessionStorage.getItem(this.CART_KEY));
        cart = cart.filter(item => item.productId !== productId);
        sessionStorage.setItem(this.CART_KEY, JSON.stringify(cart));
        this.updateCartCount();
        return true;
    },

    // Clear cart
    clearCart() {
        sessionStorage.setItem(this.CART_KEY, JSON.stringify([]));
        this.updateCartCount();
    },

    // Update cart count
    updateCartCount() {
        const cart = this.getCart();
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = count;
        }
    },

    // Calculate cart totals
    calculateTotals() {
        const cart = this.getCart();
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * this.TAX_RATE;
        const total = subtotal + tax;
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    },

    // Create order
    createOrder() {
        const session = auth.getSession();
        if (!session) {
            console.error('Not logged in');
            return false;
        }

        const cart = this.getCart();
        if (cart.length === 0) {
            console.error('Cart is empty');
            return false;
        }

        const totals = this.calculateTotals();
        const order = {
            id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: session.username,
            userId: session.userId,
            items: cart.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                subtotal: parseFloat((item.price * item.quantity).toFixed(2))
            })),
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Update stock for each item
        cart.forEach(item => {
            this.updateStock(item.productId, item.quantity);
        });

        // Save order
        const orders = JSON.parse(localStorage.getItem(this.ORDERS_KEY));
        orders.push(order);
        localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));

        // Clear cart
        this.clearCart();

        console.log('Order created successfully:', order);
        return order;
    },

    // Get user orders
    getUserOrders(username) {
        const orders = JSON.parse(localStorage.getItem(this.ORDERS_KEY));
        return orders.filter(o => o.username === username);
    },

    // Search products
    searchProducts(query) {
        const products = this.getProducts();
        const searchTerm = query.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    },

    // Filter products by category
    filterByCategory(category) {
        const products = this.getProducts();
        return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    },

    // ===== UI FUNCTIONS =====

    // Render products
    renderProducts(products = null) {
        if (products === null) {
            products = this.getProducts();
        }

        const productsGrid = document.getElementById('products-grid');
        const productsSection = document.getElementById('products-section');
        const welcomeSection = document.getElementById('welcome-section');

        if (products.length === 0) {
            productsSection.style.display = 'none';
            welcomeSection.style.display = 'block';
            return;
        }

        productsSection.style.display = 'block';
        welcomeSection.style.display = 'none';
        productsGrid.innerHTML = '';

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">${product.emoji}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-footer">
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                        <div class="product-stock ${product.stock < 5 ? 'low' : ''}">
                            ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </div>
                    </div>
                    <div class="product-actions">
                        <select class="quantity-select" id="qty-${product.id}">
                            ${Array.from({length: Math.min(product.stock, 10)}, (_, i) => 
                                `<option value="${i + 1}">${i + 1}</option>`
                            ).join('')}
                        </select>
                        <button class="btn-secondary" 
                            onclick="marketplace.addToCart('${product.id}', parseInt(document.getElementById('qty-${product.id}').value))" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
    },

    // View cart
    viewCart() {
        const cart = this.getCart();
        const cartSection = document.getElementById('cart-section');
        const cartItems = document.getElementById('cart-items');
        const cartSummary = document.getElementById('cart-summary');
        const emptyCart = document.getElementById('empty-cart');
        const productsSection = document.getElementById('products-section');
        const welcomeSection = document.getElementById('welcome-section');

        productsSection.style.display = 'none';
        welcomeSection.style.display = 'none';
        document.getElementById('orders-section').style.display = 'none';
        cartSection.style.display = 'block';

        if (cart.length === 0) {
            cartItems.innerHTML = '';
            emptyCart.style.display = 'block';
            cartSummary.style.display = 'none';
            return;
        }

        emptyCart.style.display = 'none';
        cartItems.innerHTML = '';
        cartSummary.style.display = 'block';

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} per item</div>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-quantity">Qty: ${item.quantity}</div>
                    <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                    <button class="btn-remove" onclick="marketplace.removeFromCart('${item.productId}')">Remove</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        const totals = this.calculateTotals();
        document.getElementById('subtotal').textContent = '$' + totals.subtotal.toFixed(2);
        document.getElementById('tax').textContent = '$' + totals.tax.toFixed(2);
        document.getElementById('total').textContent = '$' + totals.total.toFixed(2);
    },

    // Checkout
    checkout() {
        const order = this.createOrder();
        if (order) {
            alert(`Order #${order.id.slice(0, 20)}... created successfully!\nTotal: $${order.total.toFixed(2)}`);
            this.viewCart();
        }
    },

    // View orders
    viewOrders() {
        const session = auth.getSession();
        const orders = this.getUserOrders(session.username);
        const ordersSection = document.getElementById('orders-section');
        const ordersList = document.getElementById('orders-list');
        const noOrders = document.getElementById('no-orders');
        const productsSection = document.getElementById('products-section');
        const welcomeSection = document.getElementById('welcome-section');
        const cartSection = document.getElementById('cart-section');

        productsSection.style.display = 'none';
        welcomeSection.style.display = 'none';
        cartSection.style.display = 'none';
        ordersSection.style.display = 'block';

        if (orders.length === 0) {
            ordersList.innerHTML = '';
            noOrders.style.display = 'block';
            return;
        }

        noOrders.style.display = 'none';
        ordersList.innerHTML = '';

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            const createdDate = new Date(order.created_at).toLocaleDateString();
            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <div class="order-id">Order #${order.id.slice(0, 20)}...</div>
                        <div class="order-date">${createdDate}</div>
                    </div>
                    <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span class="order-item-name">${item.productName}</span>
                            <span>${item.quantity}x</span>
                            <span>$${item.subtotal.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">Total: $${order.total.toFixed(2)}</div>
            `;
            ordersList.appendChild(orderCard);
        });
    },

    // Back to products
    backToProducts() {
        this.renderProducts();
        document.getElementById('cart-section').style.display = 'none';
        document.getElementById('orders-section').style.display = 'none';
    }
};

// Initialize
marketplace.init();

// Auto-update cart count on page load
window.addEventListener('load', () => {
    marketplace.updateCartCount();
    marketplace.renderProducts();
});