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
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        description: product.description || '',
        images: product.images || []
    }]).select();
    
    if (error) {
        console.error('Error adding product:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data: data[0] };
}

export async function updateProduct(id, updates) {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

// ==================== IMAGE UPLOAD ====================
export async function uploadImage(file, productId, imageIndex) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}_${imageIndex}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
    
    if (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
    
    const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
    
    return { success: true, url: urlData.publicUrl };
}

export async function deleteImage(imageUrl) {
    try {
        const filePath = imageUrl.split('/').pop();
        const { error } = await supabase.storage
            .from('product-images')
            .remove([`products/${filePath}`]);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        return false;
    }
}

// ==================== ORDERS ====================
export async function getOrders() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return data || [];
}

export async function placeOrder(order) {
    // First, validate and deduct stock for each item
    for (const item of order.items) {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();
        
        if (fetchError || !product) {
            return { success: false, error: `Product ${item.name} not found` };
        }
        
        if (product.stock < item.quantity) {
            return { success: false, error: `Insufficient stock for ${item.name}` };
        }
        
        // Deduct stock
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.id);
        
        if (updateError) {
            return { success: false, error: `Failed to update stock for ${item.name}` };
        }
    }
    
    // Create order
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
    
    if (error) {
        console.error('Error placing order:', error);
        return { success: false, error: error.message };
    }
    
    // Clear cart after successful order
    await clearCartAfterOrder();
    
    return { success: true, orderId: data[0].order_id };
}

async function clearCartAfterOrder() {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
        await supabase.from('carts').upsert({
            session_id: sessionId,
            items: [],
            total: 0,
            updated_at: new Date().toISOString()
        });
    }
}

export async function updateOrderStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('order_id', orderId);
    if (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function deleteOrder(orderId) {
    const { error } = await supabase.from('orders').delete().eq('order_id', orderId);
    if (error) {
        console.error('Error deleting order:', error);
        return { success: false, error: error.message };
    }
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
    if (error) {
        console.error('Error fetching cart:', error);
        return { items: [], total: 0 };
    }
    return { items: data?.items || [], total: data?.total || 0 };
}

export async function saveCart(items, total) {
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
