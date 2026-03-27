// js/config.js
const CONFIG = {
    SITE_NAME: "Style Of Life Jewelry",
    SITE_TAGLINE: "Timeless Elegance",
    CURRENCY: "₹",
    CURRENCY_SYMBOL: "₹",
    
    // Supabase Configuration
    SUPABASE_URL: "https://tbopyyocuvlsjvtdogcp.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib3B5eW9jdXZsc2p2dGRvZ2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzYxNzcsImV4cCI6MjA4OTYxMjE3N30.TfEtU1NBHCGnZqZzm4LuI1iw22lSPav0OrUskhDw5wc",
    
    // Shipping Settings
    FREE_SHIPPING_THRESHOLD: 50000,
    SHIPPING_CHARGE: 100,
    TAX_RATE: 18,
    
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

window.CONFIG = CONFIG;
