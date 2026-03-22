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

// ==================== PRODUCTS ====================
export async function getProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*').order('id');
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

export async function getProductById(id) {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching product:', err);
        return null;
    }
}

// ==================== CART ====================
export async function getCart() {
    try {
        const { data, error } = await supabase
            .from('carts')
            .select('items, total')
            .eq('session_id', sessionId)
            .maybeSingle();
        
        if (error) throw error;
        return { items: data?.items || [], total: data?.total || 0 };
    } catch (err) {
        console.error('Error fetching cart:', err);
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
        
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error saving cart:', err);
        return false;
    }
}

export async function addToCart(product, quantity = 1) {
    try {
        const { items: currentItems } = await getCart();
        let cartItems = [...currentItems];
        const existingIndex = cartItems.findIndex(i => i.id === product.id);
        
        if (existingIndex >= 0) {
            cartItems[existingIndex].quantity += quantity;
        } else {
            cartItems.push({
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.price,
                quantity: quantity,
                image: product.images?.[0] || ''
            });
        }
        
        const total = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
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

export async function updateCartQuantity(productId, quantity) {
    try {
        const { items } = await getCart();
        const cartItems = [...items];
        const index = cartItems.findIndex(i => i.id === productId);
        
        if (index >= 0) {
            if (quantity <= 0) {
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

// ==================== ORDERS ====================
export async function placeOrder(orderData) {
    try {
        // Check stock for each item
        for (const item of orderData.items) {
            const product = await getProductById(item.id);
            if (!product) {
                return { success: false, error: `Product ${item.name} not found` };
            }
            if (product.stock < item.quantity) {
                return { success: false, error: `Insufficient stock for ${item.name}. Only ${product.stock} left.` };
            }
        }
        
        // Deduct stock
        for (const item of orderData.items) {
            const product = await getProductById(item.id);
            const newStock = product.stock - item.quantity;
            const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            if (error) throw error;
        }
        
        // Create order
        const { data, error } = await supabase.from('orders').insert([{
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
        }]).select();
        
        if (error) throw error;
        
        // Clear cart
        await clearCart();
        
        return { success: true, orderId: data[0].order_id };
    } catch (err) {
        console.error('Order placement error:', err);
        return { success: false, error: err.message };
    }
}

export async function getOrders() {
    try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching orders:', err);
        return [];
    }
}

export async function updateOrderStatus(orderId, status) {
    try {
        const { error } = await supabase.from('orders').update({ status }).eq('order_id', orderId);
        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error updating order:', err);
        return { success: false, error: err.message };
    }
}

export async function deleteOrder(orderId) {
    try {
        const { error } = await supabase.from('orders').delete().eq('order_id', orderId);
        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error deleting order:', err);
        return { success: false, error: err.message };
    }
}

// ==================== ADMIN ====================
export async function addProduct(product) {
    try {
        const { data, error } = await supabase.from('products').insert([{
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            description: product.description || '',
            images: product.images || []
        }]).select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error adding product:', err);
        return { success: false, error: err.message };
    }
}

export async function updateProduct(id, updates) {
    try {
        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error updating product:', err);
        return { success: false, error: err.message };
    }
}

export async function deleteProduct(id) {
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error deleting product:', err);
        return { success: false, error: err.message };
    }
}

export async function getDashboardStats() {
    try {
        const [products, orders] = await Promise.all([
            supabase.from('products').select('count', { count: 'exact', head: true }),
            supabase.from('orders').select('total, status')
        ]);
        
        const totalProducts = products.count || 0;
        const orderData = orders.data || [];
        const totalOrders = orderData.length;
        const totalRevenue = orderData.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orderData.filter(o => o.status === 'Pending').length;
        
        return { totalProducts, totalOrders, totalRevenue, pendingOrders };
    } catch (err) {
        console.error('Error fetching stats:', err);
        return { totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 };
    }
}
