// js/analytics.js
// Analytics Helper for Style Of Life

export class AnalyticsHelper {
    constructor() {
        this.enabled = true;
        this.sessionId = localStorage.getItem('analytics_session') || this.generateSessionId();
        localStorage.setItem('analytics_session', this.sessionId);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Track page view
    trackPageView(pageName, pageUrl) {
        if (!this.enabled) return;
        
        const data = {
            type: 'page_view',
            page: pageName,
            url: pageUrl,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_width: window.innerWidth,
            screen_height: window.innerHeight
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
    }

    // Track product view
    trackProductView(product) {
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
    }

    // Track add to cart
    trackAddToCart(product, quantity) {
        if (!this.enabled) return;
        
        const data = {
            type: 'add_to_cart',
            product_id: product.id,
            product_name: product.name,
            product_price: product.price,
            quantity: quantity,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
    }

    // Track purchase
    trackPurchase(order) {
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
    }

    // Track search
    trackSearch(query, resultsCount) {
        if (!this.enabled) return;
        
        const data = {
            type: 'search',
            query: query,
            results_count: resultsCount,
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics(data);
        this.storeLocally(data);
    }

    // Send to analytics endpoint (Supabase)
    async sendToAnalytics(data) {
        try {
            const supabase = window.supabaseClient;
            if (supabase) {
                await supabase.from('analytics').insert([data]);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    // Store locally for offline analytics
    storeLocally(data) {
        const stored = JSON.parse(localStorage.getItem('analytics_data') || '[]');
        stored.push(data);
        
        // Keep only last 1000 records
        if (stored.length > 1000) {
            stored.shift();
        }
        
        localStorage.setItem('analytics_data', JSON.stringify(stored));
    }

    // Get analytics summary
    getAnalyticsSummary() {
        const stored = JSON.parse(localStorage.getItem('analytics_data') || '[]');
        
        const summary = {
            total_views: stored.filter(d => d.type === 'page_view').length,
            total_product_views: stored.filter(d => d.type === 'product_view').length,
            total_add_to_cart: stored.filter(d => d.type === 'add_to_cart').length,
            total_purchases: stored.filter(d => d.type === 'purchase').length,
            total_searches: stored.filter(d => d.type === 'search').length,
            top_products: this.getTopProducts(stored),
            session_id: this.sessionId
        };
        
        return summary;
    }

    getTopProducts(stored) {
        const productViews = {};
        stored.filter(d => d.type === 'product_view').forEach(d => {
            const id = d.product_id;
            productViews[id] = (productViews[id] || 0) + 1;
        });
        
        return Object.entries(productViews)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ product_id: id, views: count }));
    }
}

// Export singleton instance
export const analytics = new AnalyticsHelper();
