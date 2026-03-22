// js/cart.js - COMPLETE FIXED CART SYSTEM
let cart = [];
let sessionId = localStorage.getItem('sessionId');

if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

// Initialize cart
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartCount();
    
    if (window.location.pathname.includes('cart.html')) {
        displayCart();
    }
});

// Load cart from Supabase
async function loadCart() {
    try {
        const { data, error } = await supabase
            .from('carts')
            .select('items')
            .eq('session_id', sessionId)
            .maybeSingle();
        
        if (error) throw error;
        cart = data?.items || [];
        saveCartToLocal();
        updateCartCount();
        if (window.location.pathname.includes('cart.html')) displayCart();
        if (window.location.pathname.includes('checkout.html') && typeof updateCheckoutSummary === 'function') {
            updateCheckoutSummary();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        loadCartFromLocal();
    }
}

// Save cart to Supabase
async function saveCartToServer() {
    try {
        const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const { error } = await supabase
            .from('carts')
            .upsert({ 
                session_id: sessionId, 
                items: cart, 
                total: total, 
                updated_at: new Date().toISOString() 
            });
        
        if (error) throw error;
        saveCartToLocal();
    } catch (error) {
        console.error('Error saving cart to server:', error);
        saveCartToLocal();
    }
}

// Local storage backup
function saveCartToLocal() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartVersion', Date.now().toString());
}

function loadCartFromLocal() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartCount();
        if (window.location.pathname.includes('cart.html')) displayCart();
        if (window.location.pathname.includes('checkout.html') && typeof updateCheckoutSummary === 'function') {
            updateCheckoutSummary();
        }
    }
}

// Add to cart - FIXED VERSION
window.addToCart = async function(productId, sku, name, price, image) {
    console.log('Adding to cart:', { productId, sku, name, price });
    
    // Find if product already exists
    const existingIndex = cart.findIndex(item => item.id === productId || item.sku === sku);
    
    if (existingIndex >= 0) {
        // Increase quantity
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        console.log('Increased quantity for:', name);
    } else {
        // Add new item
        cart.push({
            id: productId,
            sku: sku,
            name: name,
            price: Number(price),
            image: image || 'https://via.placeholder.com/100x100?text=No+Image',
            quantity: 1
        });
        console.log('Added new item:', name);
    }
    
    // Save to server and local
    await saveCartToServer();
    updateCartCount();
    
    // Show notification
    showNotification(`${name} added to cart!`, 'success');
    return true;
};

// Update quantity
window.updateQuantity = async function(productId, newQuantity) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) {
        cart.splice(itemIndex, 1);
    } else {
        if (newQuantity > 10) newQuantity = 10;
        cart[itemIndex].quantity = newQuantity;
    }
    
    await saveCartToServer();
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) displayCart();
    if (window.location.pathname.includes('checkout.html') && typeof updateCheckoutSummary === 'function') {
        updateCheckoutSummary();
    }
};

// Remove item
window.removeFromCart = async function(productId) {
    cart = cart.filter(item => item.id !== productId);
    await saveCartToServer();
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) displayCart();
    if (window.location.pathname.includes('checkout.html') && typeof updateCheckoutSummary === 'function') {
        updateCheckoutSummary();
    }
    showNotification('Item removed from cart', 'info');
};

// Clear cart
window.clearCart = async function() {
    if (cart.length === 0) return;
    if (confirm('Clear your cart?')) {
        cart = [];
        await saveCartToServer();
        updateCartCount();
        if (window.location.pathname.includes('cart.html')) displayCart();
        if (window.location.pathname.includes('checkout.html') && typeof updateCheckoutSummary === 'function') {
            updateCheckoutSummary();
        }
        showNotification('Cart cleared', 'info');
    }
};

// Get cart functions
window.getCart = function() { return [...cart]; };
window.getCartCount = function() { return cart.reduce((total, item) => total + (item.quantity || 1), 0); };
window.getCartTotal = function() { return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0); };

// Update cart count display
function updateCartCount() {
    const count = window.getCartCount();
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
        if (el) {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        }
    });
}

// Display cart page
function displayCart() {
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
                <img src="${item.image}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
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
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Make functions global
window.updateCartCount = updateCartCount;
window.displayCart = displayCart;
window.showNotification = showNotification;

// Export for other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCart, getCartCount, getCartTotal, addToCart, removeFromCart, updateQuantity, clearCart };
}
