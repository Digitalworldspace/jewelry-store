// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ==================== AUTHENTICATION ====================
export async function signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: userData }
    });
    if (error) return { success: false, error: error.message };
    
    // Create profile
    if (data.user) {
        await supabase.from('profiles').insert([{
            id: data.user.id,
            email: email,
            full_name: userData.full_name,
            phone: userData.phone
        }]);
    }
    return { success: true, data };
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        return { ...user, profile };
    }
    return null;
}

// ==================== PRODUCTS ====================
export async function getProducts(filters = {}) {
    let query = supabase.from('products').select('*').eq('is_active', true);
    
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters.sort) {
        if (filters.sort === 'price_asc') query = query.order('price', { ascending: true });
        if (filters.sort === 'price_desc') query = query.order('price', { ascending: false });
        if (filters.sort === 'newest') query = query.order('created_at', { ascending: false });
    } else {
        query = query.order('id');
    }
    
    const { data, error } = await query;
    if (error) return [];
    return data || [];
}

export async function getProductById(id) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return null;
    return data;
}

export async function getFeaturedProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(8);
    if (error) return [];
    return data || [];
}

// ==================== CART ====================
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

export async function getCart(userId = null) {
    let query = supabase.from('carts').select('*');
    if (userId) {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('session_id', sessionId);
    }
    
    const { data, error } = await query.maybeSingle();
    if (error) return { items: [], total: 0 };
    return { items: data?.items || [], total: data?.total || 0, coupon: data?.coupon_code };
}

export async function addToCart(product, quantity = 1, userId = null) {
    const { items } = await getCart(userId);
    const existingItem = items.find(i => i.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        items.push({
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.images?.[0] || null
        });
    }
    
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const cartData = { items, total, updated_at: new Date().toISOString() };
    
    if (userId) cartData.user_id = userId;
    else cartData.session_id = sessionId;
    
    const { error } = await supabase.from('carts').upsert(cartData);
    if (error) return { success: false, error: error.message };
    return { success: true, items, total };
}

export async function updateCartItem(productId, quantity, userId = null) {
    const { items } = await getCart(userId);
    const item = items.find(i => i.id === productId);
    if (item) {
        if (quantity <= 0) {
            const index = items.indexOf(item);
            items.splice(index, 1);
        } else {
            item.quantity = quantity;
        }
    }
    
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const cartData = { items, total, updated_at: new Date().toISOString() };
    
    if (userId) cartData.user_id = userId;
    else cartData.session_id = sessionId;
    
    const { error } = await supabase.from('carts').upsert(cartData);
    if (error) return { success: false, error: error.message };
    return { success: true, items, total };
}

export async function clearCart(userId = null) {
    const cartData = { items: [], total: 0, updated_at: new Date().toISOString() };
    if (userId) cartData.user_id = userId;
    else cartData.session_id = sessionId;
    
    const { error } = await supabase.from('carts').upsert(cartData);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function getCartCount(userId = null) {
    const { items } = await getCart(userId);
    return items.reduce((sum, i) => sum + i.quantity, 0);
}

// ==================== WISHLIST ====================
export async function getWishlist(userId) {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', userId);
    if (error) return [];
    return data || [];
}

export async function addToWishlist(userId, productId) {
    const { error } = await supabase
        .from('wishlist')
        .insert([{ user_id: userId, product_id: productId }]);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function removeFromWishlist(userId, productId) {
    const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function isInWishlist(userId, productId) {
    if (!userId) return false;
    const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();
    if (error) return false;
    return !!data;
}

// ==================== ORDERS ====================
export async function createOrder(orderData) {
    const orderId = 'ORD' + Date.now();
    const order = {
        order_id: orderId,
        user_id: orderData.user_id || null,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address || orderData.shipping_address,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        tax: orderData.tax,
        shipping_charge: orderData.shipping_charge,
        total: orderData.total,
        payment_method: orderData.payment_method,
        notes: orderData.notes || null
    };
    
    const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select();
    
    if (error) return { success: false, error: error.message };
    return { success: true, orderId, orderData: data[0] };
}

export async function getUserOrders(userId) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
}

export async function getOrderById(orderId) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
    if (error) return null;
    return data;
}

// ==================== REVIEWS ====================
export async function getProductReviews(productId) {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
}

export async function addReview(productId, userId, rating, title, comment) {
    const { error } = await supabase
        .from('reviews')
        .insert([{
            product_id: productId,
            user_id: userId,
            rating: rating,
            title: title,
            comment: comment,
            is_approved: false
        }]);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ==================== ADDRESSES ====================
export async function getUserAddresses(userId) {
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
    if (error) return [];
    return data || [];
}

export async function addAddress(userId, address) {
    const { error } = await supabase
        .from('addresses')
        .insert([{ user_id: userId, ...address }]);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function updateAddress(addressId, address) {
    const { error } = await supabase
        .from('addresses')
        .update(address)
        .eq('id', addressId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteAddress(addressId) {
    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ==================== COUPONS ====================
export async function validateCoupon(code, subtotal) {
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
    
    if (error || !data) return { success: false, error: 'Invalid coupon code' };
    
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) {
        return { success: false, error: 'Coupon not yet valid' };
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
        return { success: false, error: 'Coupon expired' };
    }
    if (subtotal < data.minimum_order) {
        return { success: false, error: `Minimum order of ₹${data.minimum_order} required` };
    }
    if (data.usage_limit && data.used_count >= data.usage_limit) {
        return { success: false, error: 'Coupon usage limit reached' };
    }
    
    let discount = 0;
    if (data.type === 'percentage') {
        discount = (subtotal * data.value) / 100;
        if (data.maximum_discount && discount > data.maximum_discount) {
            discount = data.maximum_discount;
        }
    } else {
        discount = data.value;
    }
    
    return { success: true, discount, coupon: data };
}
