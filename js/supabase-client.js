// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ==================== PRODUCTS WITH IMAGE UPLOAD ====================
export async function getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data || [];
}

export async function uploadProductImages(productId, files) {
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}_${i}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Upload error:', error);
            continue;
        }
        
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
        
        uploadedUrls.push(urlData.publicUrl);
    }
    
    return uploadedUrls;
}

export async function addProduct(product, imageFiles = []) {
    // First insert product
    const { data, error } = await supabase.from('products').insert([{
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description,
        images: []
    }]).select();
    
    if (error) return { success: false, error: error.message };
    
    const productId = data[0].id;
    
    // Upload images if any
    let uploadedImages = [];
    if (imageFiles.length > 0) {
        uploadedImages = await uploadProductImages(productId, imageFiles);
        
        // Update product with image URLs
        await supabase.from('products')
            .update({ images: uploadedImages })
            .eq('id', productId);
    }
    
    return { success: true, data: { ...data[0], images: uploadedImages } };
}

export async function updateProductWithImages(id, updates, newImageFiles = []) {
    // Update product details
    const { error: updateError } = await supabase.from('products')
        .update(updates)
        .eq('id', id);
    
    if (updateError) return { success: false, error: updateError.message };
    
    // Upload new images if any
    if (newImageFiles.length > 0) {
        const newImages = await uploadProductImages(id, newImageFiles);
        
        // Get existing images
        const { data: product } = await supabase.from('products')
            .select('images')
            .eq('id', id)
            .single();
        
        const allImages = [...(product?.images || []), ...newImages].slice(0, 5);
        
        await supabase.from('products')
            .update({ images: allImages })
            .eq('id', id);
    }
    
    return { success: true };
}

export async function deleteProductWithImages(id) {
    // Get product images first
    const { data: product } = await supabase.from('products')
        .select('images')
        .eq('id', id)
        .single();
    
    // Delete images from storage
    if (product?.images) {
        for (const imageUrl of product.images) {
            const path = imageUrl.split('/').pop();
            await supabase.storage
                .from('product-images')
                .remove([path]);
        }
    }
    
    // Delete product from database
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteProductImage(productId, imageUrl) {
    const path = imageUrl.split('/').pop();
    
    // Delete from storage
    await supabase.storage.from('product-images').remove([path]);
    
    // Update product images array
    const { data: product } = await supabase.from('products')
        .select('images')
        .eq('id', productId)
        .single();
    
    const updatedImages = (product?.images || []).filter(img => img !== imageUrl);
    
    const { error } = await supabase.from('products')
        .update({ images: updatedImages })
        .eq('id', productId);
    
    return { success: !error, error: error?.message };
}

// ==================== ORDERS (unchanged) ====================
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

// ==================== CART (unchanged) ====================
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

// ==================== DASHBOARD STATS (unchanged) ====================
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
