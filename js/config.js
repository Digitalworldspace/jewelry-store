// js/config.js
const CONFIG = {
    SITE_NAME: "Style Of Life Jewelry",
    SITE_TAGLINE: "Timeless Elegance",
    CURRENCY: "₹",
    CURRENCY_SYMBOL: "₹",
    
    // Supabase Configuration - YOUR ACTUAL CREDENTIALS
    SUPABASE_URL: "https://kkvgdagjboxhtuyqlomq.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdmdkYWdqYm94aHR1eXFsb21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzgyMTksImV4cCI6MjA5MDA1NDIxOX0.5A4UUcvwAi5UM8K81mmrN3lOTmzUYq70qRouaVqpwDA",
    
    // Shipping Settings
    FREE_SHIPPING_THRESHOLD: 3000,
    SHIPPING_CHARGE: 100,
    TAX_RATE: 18,
    
    // Exchange Policy
    EXCHANGE_DAYS: 15,
    EXCHANGE_POLICY: "Free size exchange within 15 days of delivery",
    
    // Order Status Flow
    ORDER_STATUSES: {
        'pending': { label: 'Pending', color: '#ffc107', icon: '⏳', next: ['processing', 'cancelled'] },
        'processing': { label: 'Processing', color: '#17a2b8', icon: '⚙️', next: ['shipped', 'cancelled'] },
        'shipped': { label: 'Shipped', color: '#28a745', icon: '🚚', next: ['delivered'] },
        'delivered': { label: 'Delivered', color: '#20c997', icon: '🎁', next: [] },
        'cancelled': { label: 'Cancelled', color: '#dc3545', icon: '❌', next: [] }
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
        'razorpay': { label: 'Razorpay', icon: '💳', enabled: true },
        'cod': { label: 'Cash on Delivery', icon: '💵', enabled: true }
    }
};

// Make config available globally
window.CONFIG = CONFIG;

// Also store in localStorage for debugging
console.log('✅ Config loaded');
console.log('Supabase URL:', CONFIG.SUPABASE_URL);
console.log('Supabase Key:', CONFIG.SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing');
