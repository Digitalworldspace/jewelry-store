// js/cart.js - Complete Cart System
let cart = [];
let sessionId = localStorage.getItem('sessionId');

if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

// Load cart from localStorage
function loadCart() {
    try {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
        cart = [];
    }
    updateCartCount();
    return cart;
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count display
function updateCartCount() {
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        if (el) {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        }
    });
}

// Get cart
window.getCart = function() {
    return [...cart];
};

// Get cart count
window.getCartCount = function() {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
};

// Get cart total
window.getCartTotal = function() {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
};

// Add to cart
window.addToCart = function(productId, sku, name, price, image) {
    console.log('Adding to cart:', { productId, sku, name, price });
    
    const existingIndex = cart.findIndex(item => item.id === productId);
    
    if (existingIndex >= 0) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
        cart.push({
            id: productId,
            sku: sku,
            name: name,
            price: Number(price),
            image: image || 'https://via.placeholder.com/100x100?text=No+Image',
            quantity: 1
        });
    }
    
    saveCart();
    showNotification(`${name} added to cart!`);
    return true;
};

// Remove from cart
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    if (window.location.pathname.includes('cart.html')) {
        displayCartPage();
    }
    showNotification('Item removed');
};

// Update quantity
window.updateQuantity = function(productId, newQuantity) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) {
        cart.splice(itemIndex, 1);
    } else {
        if (newQuantity > 10) newQuantity = 10;
        cart[itemIndex].quantity = newQuantity;
    }
    
    saveCart();
    if (window.location.pathname.includes('cart.html')) {
        displayCartPage();
    }
};

// Clear cart
window.clearCart = function() {
    if (cart.length === 0) return;
    if (confirm('Clear your cart?')) {
        cart = [];
        saveCart();
        if (window.location.pathname.includes('cart.html')) {
            displayCartPage();
        }
        showNotification('Cart cleared');
    }
};

// Display cart page
function displayCartPage() {
    const container = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 80px; background: white; border-radius: 24px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🛒</div>
                <h3 style="margin-bottom: 10px;">Your cart is empty</h3>
                <p style="color: #888; margin-bottom: 25px;">Looks like you haven't added any items yet.</p>
                <a href="index.html" style="display: inline-block; padding: 12px 35px; background: linear-gradient(135deg, #D4AF37, #E8C47E); border-radius: 50px; color: #1A1A1A; text-decoration: none; font-weight: 600;">Continue Shopping</a>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = '0';
        if (taxEl) taxEl.textContent = '0';
        if (totalEl) totalEl.textContent = '0';
        return;
    }
    
    let html = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-sku">SKU: ${item.sku}</div>
                </div>
                <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                <div class="cart-item-quantity">
                    <input type="number" value="${item.quantity}" min="1" max="10" onchange="updateQuantity(${item.id}, this.value)">
                </div>
                <div class="cart-item-total">₹${itemTotal.toLocaleString('en-IN')}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    const tax = Math.round(subtotal * 0.18);
    const shipping = subtotal >= 50000 ? 0 : 100;
    const total = subtotal + tax + shipping;
    
    if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('en-IN');
    if (taxEl) taxEl.textContent = tax.toLocaleString('en-IN');
    if (totalEl) totalEl.textContent = total.toLocaleString('en-IN');
}

// Show notification
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        z-index: 9999;
        animation: slideIn 0.3s;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    if (window.location.pathname.includes('cart.html')) {
        displayCartPage();
    }
});

// Make functions global
window.displayCartPage = displayCartPage;
window.updateCartCount = updateCartCount;
window.showNotification = showNotification;
