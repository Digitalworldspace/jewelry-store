// js/analytics.js
// Analytics Helper for Style Of Life

const Analytics = {
    enabled: true,
    initialized: false,
    sessionId: null,
    
    // Initialize analytics
    init: function() {
        if (this.initialized) return;
        
        this.sessionId = localStorage.getItem('analytics_session') || this.generateSessionId();
        localStorage.setItem('analytics_session', this.sessionId);
        
        console.log("Analytics initializing... Session ID:", this.sessionId);
        this.trackPageView(document.title, window.location.href);
        
        this.initialized = true;
        console.log("✅ Analytics initialized");
    },

    generateSessionId: function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Track page view
    trackPageView: function(pageName, pageUrl) {
        if (!this.enabled) return;
        
        const data = {
            type: 'page_view',
            page: pageName || document.title,
            url: pageUrl || window.location.href,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'direct',
            user_agent: navigator.userAgent,
            screen_width: window.innerWidth,
            screen_height: window.innerHeight
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Page view tracked - ${data.page}`);
    },

    // Track product view
    trackProductView: function(product) {
        if (!this.enabled) return;
        
        const data = {
            type: 'product_view',
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            product_sku: product.sku,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Product view tracked - ${product.name}`);
    },

    // Track add to cart
    trackAddToCart: function(product, quantity) {
        if (!this.enabled) return;
        
        const data = {
            type: 'add_to_cart',
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            quantity: quantity || 1,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Add to cart tracked - ${product.name} x${quantity}`);
    },

    // Track remove from cart
    trackRemoveFromCart: function(product, quantity) {
        if (!this.enabled) return;
        
        const data = {
            type: 'remove_from_cart',
            product_id: product.id,
            product_name: product.name,
            quantity: quantity || 1,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Remove from cart tracked - ${product.name}`);
    },

    // Track purchase
    trackPurchase: function(order) {
        if (!this.enabled) return;
        
        const data = {
            type: 'purchase',
            order_id: order.order_id,
            total: order.total,
            items: order.items,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Purchase tracked - Order ${order.order_id} - ₹${order.total}`);
    },

    // Track search
    trackSearch: function(query, resultsCount) {
        if (!this.enabled) return;
        
        const data = {
            type: 'search',
            query: query,
            results_count: resultsCount || 0,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Search tracked - "${query}" (${resultsCount} results)`);
    },

    // Track wishlist action
    trackWishlist: function(product, action) {
        if (!this.enabled) return;
        
        const data = {
            type: 'wishlist',
            action: action,
            product_id: product.id,
            product_name: product.name,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
        console.log(`Analytics: Wishlist ${action} - ${product.name}`);
    },

    // Send to analytics endpoint
    sendToAnalytics: async function(data) {
        try {
            if (window.supabaseClient) {
                await window.supabaseClient.from('analytics').insert([data]);
            }
        } catch (error) {
            console.debug('Analytics send error:', error.message);
        }
    },

    // Store locally for offline analytics
    storeLocally: function(data) {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics_data') || '[]');
            stored.push(data);
            while (stored.length > 500) stored.shift();
            localStorage.setItem('analytics_data', JSON.stringify(stored));
        } catch (error) {
            console.debug('Analytics storage error:', error.message);
        }
    },

    // Get analytics summary
    getAnalyticsSummary: function() {
        const stored = JSON.parse(localStorage.getItem('analytics_data') || '[]');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const last7Days = stored.filter(d => new Date(d.timestamp) > sevenDaysAgo);
        
        return {
            total_views: stored.filter(d => d.type === 'page_view').length,
            total_product_views: stored.filter(d => d.type === 'product_view').length,
            total_add_to_cart: stored.filter(d => d.type === 'add_to_cart').length,
            total_remove_from_cart: stored.filter(d => d.type === 'remove_from_cart').length,
            total_purchases: stored.filter(d => d.type === 'purchase').length,
            total_searches: stored.filter(d => d.type === 'search').length,
            total_wishlist: stored.filter(d => d.type === 'wishlist').length,
            last_7_days_views: last7Days.filter(d => d.type === 'page_view').length,
            session_id: this.sessionId,
            top_products: this.getTopProducts(stored),
            conversion_rate: this.getConversionRate(stored)
        };
    },

    getTopProducts: function(stored) {
        const productViews = {};
        stored.filter(d => d.type === 'product_view').forEach(d => {
            if (d.product_id) {
                productViews[d.product_id] = productViews[d.product_id] || { views: 0, name: d.product_name };
                productViews[d.product_id].views++;
            }
        });
        
        return Object.entries(productViews)
            .sort((a, b) => b[1].views - a[1].views)
            .slice(0, 10)
            .map(([id, data]) => ({ product_id: id, product_name: data.name, views: data.views }));
    },

    getConversionRate: function(stored) {
        const views = stored.filter(d => d.type === 'product_view').length;
        const purchases = stored.filter(d => d.type === 'purchase').length;
        if (views === 0) return 0;
        return ((purchases / views) * 100).toFixed(2);
    },

    // Clear analytics data
    clearAnalytics: function() {
        localStorage.removeItem('analytics_data');
        console.log("Analytics: Data cleared");
    },

    // Export analytics data
    exportAnalytics: function() {
        const stored = JSON.parse(localStorage.getItem('analytics_data') || '[]');
        const dataStr = JSON.stringify(stored, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log("Analytics: Data exported");
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
    Analytics.init();
}

// Make global
window.Analytics = Analytics;
