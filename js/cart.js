// js/cart.js
// Cart management utilities

const CART_STORAGE_KEY = 'styleoflife_cart';

function getCartFromStorage() {
    try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : { items: [], total: 0 };
    } catch (e) {
        return { items: [], total: 0 };
    }
}

function saveCartToStorage(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCountDisplay();
}

function updateCartCountDisplay() {
    const cart = getCartFromStorage();
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        if (el) el.textContent = count;
    });
}

function addToCartLocal(product, quantity = 1) {
    const cart = getCartFromStorage();
    const existingItem = cart.items.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.images?.[0] || ''
        });
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    saveCartToStorage(cart);
    
    showNotification(`${product.name} added to cart!`);
    return cart;
}

function removeFromCartLocal(productId) {
    const cart = getCartFromStorage();
    cart.items = cart.items.filter(item => item.id !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    saveCartToStorage(cart);
    return cart;
}

function updateCartQuantityLocal(productId, quantity) {
    const cart = getCartFromStorage();
    const item = cart.items.find(item => item.id === productId);
    
    if (item) {
        if (quantity <= 0) {
            cart.items = cart.items.filter(i => i.id !== productId);
        } else {
            item.quantity = quantity;
        }
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    saveCartToStorage(cart);
    return cart;
}

function clearCartLocal() {
    saveCartToStorage({ items: [], total: 0 });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCountDisplay();
});

// Make functions globally available
window.cartUtils = {
    getCart: getCartFromStorage,
    addToCart: addToCartLocal,
    removeFromCart: removeFromCartLocal,
    updateQuantity: updateCartQuantityLocal,
    clearCart: clearCartLocal,
    updateCount: updateCartCountDisplay
};
