// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Session management
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

// ==================== CART FUNCTIONS ====================

export async function getCart() {
    try {
        const { data, error } = await supabase
            .from('carts')
            .select('items, total')
            .eq('session_id', sessionId)
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching cart:', error);
            return { items: [], total: 0 };
        }
        return { items: data?.items || [], total: data?.total || 0 };
    } catch (err) {
        console.error('Cart fetch error:', err);
        return { items: [], total: 0 };
    }
}

export async function saveCart(items, total) {
    try {
        const { error } = await supabase.from('carts').upsert({
            session_id: sessionId,
            items: items,
            total: total,
            updated_at: new Date().toISOString()
        });
        
        if (error) {
            console.error('Error saving cart:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Cart save error:', err);
        return false;
    }
}

export async function addToCart(product) {
    try {
        // Get current cart
        const { items } = await getCart();
        let cartItems = [...items];
        
        // Check if product already in cart
        const existingIndex = cartItems.findIndex(i => i.id === product.id);
        
        if (existingIndex >= 0) {
            // Increase quantity
            cartItems[existingIndex].quantity += 1;
        } else {
            // Add new item
            cartItems.push({
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.images?.[0] || ''
            });
        }
        
        // Calculate total
        const total = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Save to Supabase
        const success = await saveCart(cartItems, total);
        return { success, items: cartItems, total };
        
    } catch (err) {
        console.error('Add to cart error:', err);
        return { success: false, error: err.message };
    }
}

export async function removeFromCart(productId) {
    try {
        const { items } = await getCart();
        const cartItems = items.filter(i => i.id !== productId);
        const total = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        const success = await saveCart(cartItems, total);
        return { success, items: cartItems, total };
        
    } catch (err) {
        console.error('Remove from cart error:', err);
        return { success: false, error: err.message };
    }
}

export async function updateQuantity(productId, quantity) {
    try {
        const { items } = await getCart();
        const cartItems = [...items];
        const index = cartItems.findIndex(i => i.id === productId);
        
        if (index >= 0) {
            if (quantity <= 0) {
                // Remove item
                cartItems.splice(index, 1);
            } else {
                cartItems[index].quantity = quantity;
            }
        }
        
        const total = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const success = await saveCart(cartItems, total);
        return { success, items: cartItems, total };
        
    } catch (err) {
        console.error('Update quantity error:', err);
        return { success: false, error: err.message };
    }
}

export async function clearCart() {
    try {
        const success = await saveCart([], 0);
        return { success };
    } catch (err) {
        console.error('Clear cart error:', err);
        return { success: false, error: err.message };
    }
}

// ==================== PRODUCT FUNCTIONS ====================

export async function getProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Products fetch error:', err);
        return [];
    }
}

// ==================== ORDER FUNCTIONS ====================

export async function placeOrder(orderData) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                order_id: 'ORD' + Date.now(),
                customer_name: orderData.name,
                phone: orderData.phone,
                email: orderData.email || '',
                address: orderData.address,
                items: orderData.items,
                subtotal: orderData.subtotal,
                tax: orderData.tax,
                shipping: orderData.shipping,
                total: orderData.total,
                status: 'Pending'
            }])
            .select();
        
        if (error) throw error;
        
        // Clear cart after successful order
        await clearCart();
        
        return { success: true, orderId: data[0].order_id };
        
    } catch (err) {
        console.error('Order placement error:', err);
        return { success: false, error: err.message };
    }
}
