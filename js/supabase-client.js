// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

// ==================== PRODUCTS ====================
export async function getProducts(filters = {}) {
    try {
        let query = supabase.from('products').select('*').eq('is_active', true);
        
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }
        if (filters.sort) {
            if (filters.sort === 'price_asc') query = query.order('price', { ascending: true });
            if (filters.sort === 'price_desc') query = query.order('price', { ascending: false });
            if (filters.sort === 'newest') query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('id');
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        
        console.log(`✅ Loaded ${data?.length || 0} products`);
        return data || [];
    } catch (error) {
        console.error('Products error:', error);
        return [];
    }
}

export async function getProductById(id) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function getFeaturedProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_featured', true)
            .eq('is_active', true)
            .limit(8);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}

// ==================== CART ====================
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

export async function getCart(userId = null) {
    try {
        let query = supabase.from('carts').select('*');
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            query = query.eq('session_id', sessionId);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (error) throw error;
        return { items: data?.items || [], total: data?.total || 0 };
    } catch (error) {
        console.error('Error loading cart:', error);
        return { items: [], total: 0 };
    }
}

export async function addToCart(product, quantity = 1, userId = null) {
    try {
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
        
        if (userId) {
            cartData.user_id = userId;
        } else {
            cartData.session_id = sessionId;
        }
        
        const { error } = await supabase.from('carts').upsert(cartData);
        
        if (error) throw error;
        return { success: true, items, total };
    } catch (error) {
        console.error('Error adding to cart:', error);
        return { success: false, error: error.message };
    }
}

export async function updateCartItem(productId, quantity, userId = null) {
    try {
        const { items } = await getCart(userId);
        const itemIndex = items.findIndex(i => i.id === productId);
        
        if (itemIndex !== -1) {
            if (quantity <= 0) {
                items.splice(itemIndex, 1);
            } else {
                items[itemIndex].quantity = quantity;
            }
        }
        
        const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const cartData = { items, total, updated_at: new Date().toISOString() };
        
        if (userId) {
            cartData.user_id = userId;
        } else {
            cartData.session_id = sessionId;
        }
        
        const { error } = await supabase.from('carts').upsert(cartData);
        
        if (error) throw error;
        return { success: true, items, total };
    } catch (error) {
        console.error('Error updating cart:', error);
        return { success: false, error: error.message };
    }
}

export async function clearCart(userId = null) {
    try {
        const cartData = { items: [], total: 0, updated_at: new Date().toISOString() };
        
        if (userId) {
            cartData.user_id = userId;
        } else {
            cartData.session_id = sessionId;
        }
        
        const { error } = await supabase.from('carts').upsert(cartData);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error clearing cart:', error);
        return { success: false, error: error.message };
    }
}

export async function getCartCount(userId = null) {
    const { items } = await getCart(userId);
    return items.reduce((sum, i) => sum + i.quantity, 0);
}

// ==================== AUTHENTICATION ====================
export async function signUp(email, password, userData) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: userData }
        });
        
        if (error) throw error;
        
        if (data.user) {
            await supabase.from('profiles').insert([{
                id: data.user.id,
                email: email,
                full_name: userData.full_name,
                phone: userData.phone
            }]);
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            return { ...user, profile };
        }
        return null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// ==================== ORDERS ====================
export async function createOrder(orderData) {
    try {
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
            notes: orderData.notes || null,
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select();
        
        if (error) throw error;
        return { success: true, orderId, orderData: data[0] };
    } catch (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserOrders(userId) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

export async function getOrderById(orderId) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

// ==================== WISHLIST ====================
export async function getWishlist(userId) {
    if (!userId) return [];
    try {
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, products(*)')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return [];
    }
}

export async function addToWishlist(userId, productId) {
    try {
        const { error } = await supabase
            .from('wishlist')
            .insert([{ user_id: userId, product_id: productId }]);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function removeFromWishlist(userId, productId) {
    try {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== ADDRESSES ====================
export async function getUserAddresses(userId) {
    try {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return [];
    }
}

export async function addAddress(userId, address) {
    try {
        const { error } = await supabase
            .from('addresses')
            .insert([{ user_id: userId, ...address }]);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== REVIEWS ====================
export async function getProductReviews(productId) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, profiles(full_name)')
            .eq('product_id', productId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

export async function addReview(productId, userId, rating, title, comment) {
    try {
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
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Export supabase instance for direct use
export { supabase };
