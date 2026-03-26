// js/supabase-client.js
// NOTE: This file is now self-contained without ES module imports

// Initialize Supabase client manually (since we can't import ES modules in all contexts)
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    async request(endpoint, options = {}) {
        const headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(`${this.url}/rest/v1/${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok && options.method !== 'DELETE') {
            const error = await response.text();
            throw new Error(error);
        }

        if (options.method === 'DELETE') return true;
        return await response.json();
    }

    from(table) {
        return {
            select: (columns = '*') => ({
                eq: async (column, value) => {
                    return this.request(`${table}?${column}=eq.${value}&select=${columns}`);
                },
                order: async (column, { ascending = true } = {}) => {
                    const orderDir = ascending ? 'asc' : 'desc';
                    return this.request(`${table}?select=${columns}&order=${column}.${orderDir}`);
                },
                maybeSingle: async () => {
                    const data = await this.request(`${table}?select=${columns}&limit=1`);
                    return { data: data?.[0] || null, error: null };
                }
            }),
            insert: async (data) => {
                return this.request(table, { method: 'POST', body: JSON.stringify(data) });
            },
            update: async (updates) => ({
                eq: async (column, value) => {
                    return this.request(`${table}?${column}=eq.${value}`, { method: 'PATCH', body: JSON.stringify(updates) });
                }
            }),
            delete: () => ({
                eq: async (column, value) => {
                    return this.request(`${table}?${column}=eq.${value}`, { method: 'DELETE' });
                }
            })
        };
    }
}

// Get config from window
const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || "https://tbopyyocuvlsjvtdogcp.supabase.co";
const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib3B5eW9jdXZsc2p2dGRvZ2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzYxNzcsImV4cCI6MjA4OTYxMjE3N30.TfEtU1NBHCGnZqZzm4LuI1iw22lSPav0OrUskhDw5wc";

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Session management
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

// ==================== PRODUCTS ====================
async function getProducts() {
    try {
        const data = await supabase.from('products').select('*').order('id', { ascending: true });
        return data || [];
    } catch (err) {
        console.error('Error fetching products:', err);
        return [];
    }
}

async function getProductById(id) {
    try {
        const data = await supabase.from('products').select('*').eq('id', id);
        return data?.[0] || null;
    } catch (err) {
        console.error('Error fetching product:', err);
        return null;
    }
}

// ==================== CART FUNCTIONS ====================
async function getCart() {
    try {
        const data = await supabase.from('carts').select('items, total').eq('session_id', sessionId);
        return { items: data?.[0]?.items || [], total: data?.[0]?.total || 0 };
    } catch (err) {
        console.error('Error fetching cart:', err);
        return { items: [], total: 0 };
    }
}

async function saveCart(items, total) {
    try {
        await supabase.from('carts').delete().eq('session_id', sessionId);
        if (items.length > 0) {
            await supabase.from('carts').insert({
                session_id: sessionId,
                items: items,
                total: total,
                updated_at: new Date().toISOString()
            });
        }
        return true;
    } catch (err) {
        console.error('Error saving cart:', err);
        return false;
    }
}

async function addToCart(product, quantity = 1) {
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

async function removeFromCart(productId) {
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

async function updateCartQuantity(productId, quantity) {
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

async function clearCart() {
    try {
        const success = await saveCart([], 0);
        return { success };
    } catch (err) {
        console.error('Clear cart error:', err);
        return { success: false, error: err.message };
    }
}

// ==================== ORDERS ====================
async function placeOrder(orderData) {
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
            await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        }
        
        // Create order
        const orderId = 'ORD' + Date.now();
        await supabase.from('orders').insert({
            order_id: orderId,
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
        });
        
        // Clear cart
        await clearCart();
        
        return { success: true, orderId: orderId };
    } catch (err) {
        console.error('Order placement error:', err);
        return { success: false, error: err.message };
    }
}

async function getOrders() {
    try {
        const data = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (err) {
        console.error('Error fetching orders:', err);
        return [];
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await supabase.from('orders').update({ status }).eq('order_id', orderId);
        return { success: true };
    } catch (err) {
        console.error('Error updating order:', err);
        return { success: false, error: err.message };
    }
}

async function deleteOrder(orderId) {
    try {
        await supabase.from('orders').delete().eq('order_id', orderId);
        return { success: true };
    } catch (err) {
        console.error('Error deleting order:', err);
        return { success: false, error: err.message };
    }
}

// ==================== ADMIN ====================
async function addProduct(product) {
    try {
        const data = await supabase.from('products').insert({
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            description: product.description || '',
            images: product.images || []
        });
        
        return { success: true, data: data?.[0] || null };
    } catch (err) {
        console.error('Error adding product:', err);
        return { success: false, error: err.message };
    }
}

async function updateProduct(id, updates) {
    try {
        await supabase.from('products').update(updates).eq('id', id);
        return { success: true };
    } catch (err) {
        console.error('Error updating product:', err);
        return { success: false, error: err.message };
    }
}

async function deleteProduct(id) {
    try {
        await supabase.from('products').delete().eq('id', id);
        return { success: true };
    } catch (err) {
        console.error('Error deleting product:', err);
        return { success: false, error: err.message };
    }
}

async function getDashboardStats() {
    try {
        const products = await supabase.from('products').select('*');
        const orders = await supabase.from('orders').select('*');
        
        const totalProducts = products?.length || 0;
        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const pendingOrders = orders?.filter(o => o.status === 'Pending').length || 0;
        
        return { totalProducts, totalOrders, totalRevenue, pendingOrders };
    } catch (err) {
        console.error('Error fetching stats:', err);
        return { totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 };
    }
}

// Export functions to window for global access
window.supabaseClient = {
    getProducts,
    getProductById,
    getCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    getOrders,
    updateOrderStatus,
    deleteOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    getDashboardStats
};
