// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ==================== PRODUCTS ====================
export async function getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data || [];
}

export async function addProduct(product) {
    const { data, error } = await supabase.from('products').insert([{
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description,
        images: product.images || []
    }]).select();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data: data[0] };
}

export async function updateProduct(id, updates) {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ==================== ORDERS ====================
export async function getOrders() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
}

export async function placeOrder(order) {
    const { data, error } = await supabase.from('orders').insert([{
        order_id: 'ORD' + Date.now(),
        customer_name: order.name,
        phone: order.phone,
        email: order.email || '',
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: 'Pending'
    }]).select();
    
    if (error) return { success: false, error: error.message };
    return { success: true, orderId: data[0].order_id };
}

export async function updateOrderStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('order_id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteOrder(orderId) {
    const { error } = await supabase.from('orders').delete().eq('order_id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ==================== CART ====================
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

export async function getCart() {
    const { data, error } = await supabase.from('carts').select('items, total').eq('session_id', sessionId).maybeSingle();
    if (error) return { items: [], total: 0 };
    return { items: data?.items || [], total: data?.total || 0 };
}

export async function saveCart(items, total) {
    const { error } = await supabase.from('carts').upsert({
        session_id: sessionId,
        items: items,
        total: total,
        updated_at: new Date().toISOString()
    });
    if (error) return false;
    return true;
}

// ==================== DASHBOARD ====================
export async function getDashboardStats() {
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
}
