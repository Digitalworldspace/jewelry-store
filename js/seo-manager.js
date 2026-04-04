// js/seo-manager.js
// SEO Manager for Style Of Life Customer Pages
// This file manages SEO for index.html and shop.html only

const SEOManager = {
    // Site configuration
    siteName: "Style Of Life",
    siteUrl: "https://styleoflife987-hub.github.io/jewelry-store/",
    phone: "+91-6352925472",
    email: "styleoflife987@gmail.com",
    address: "Surat, Gujarat, India",
    
    // Initialize SEO for current page
    init: function() {
        console.log("SEO Manager initialized for:", window.location.pathname);
        
        const page = window.location.pathname;
        
        if (page === '/' || page === '/index.html') {
            this.initHomepageSEO();
        } else if (page === '/shop.html') {
            this.initShopPageSEO();
        }
        
        this.addCommonSchemas();
    },
    
    // Homepage SEO
    initHomepageSEO: function() {
        // Update title
        document.title = "Style Of Life - Luxury Jewelry Store | Diamond & Gold Jewelry Online India";
        
        // Update meta description
        this.updateMeta("description", "Discover exquisite handcrafted jewelry at Style Of Life. Shop diamond rings, gold necklaces, earrings, and luxury accessories. Free shipping on orders above ₹3000. Best jewelry store in India.");
        
        // Update keywords
        this.updateMeta("keywords", "jewelry store, diamond rings, gold necklaces, luxury jewelry, engagement rings, earrings, bracelets, style of life, Indian jewelry, online jewelry shopping");
        
        // Add homepage schema
        this.addHomepageSchema();
    },
    
    // Shop Page SEO
    initShopPageSEO: function() {
        // Update title
        document.title = "Shop Luxury Jewelry Online - Style Of Life | Diamond Rings, Gold Necklaces";
        
        // Update meta description
        this.updateMeta("description", "Shop the finest collection of luxury jewelry online at Style Of Life. Browse diamond rings, gold necklaces, earrings, bracelets, and more. Best prices. Free shipping available.");
        
        // Update keywords
        this.updateMeta("keywords", "buy jewelry online, shop diamond rings, gold jewelry online, luxury jewelry shopping, best jewelry store, style of life shop, jewelry collection");
        
        // Add product listing schema
        this.addProductListingSchema();
    },
    
    // Common schemas for all pages
    addCommonSchemas: function() {
        // Add Organization Schema
        this.addOrganizationSchema();
        
        // Add Breadcrumb Schema
        this.addBreadcrumbSchema();
        
        // Add Website Schema
        this.addWebsiteSchema();
    },
    
    // Homepage specific schema
    addHomepageSchema: function() {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JewelryStore",
            "name": "Style Of Life",
            "description": "Luxury jewelry store offering diamond rings, gold necklaces, earrings, and fine jewelry",
            "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
            "priceRange": "₹₹₹",
            "telephone": this.phone,
            "email": this.email,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Surat",
                "addressRegion": "Gujarat",
                "addressCountry": "IN"
            },
            "openingHours": "Mo-Su 10:00-20:00",
            "paymentAccepted": ["Razorpay", "Credit Card", "Debit Card", "UPI"],
            "url": this.siteUrl,
            "logo": this.siteUrl + "logo.png",
            "sameAs": [
                "https://www.instagram.com/styleoflife.in",
                "https://www.facebook.com/styleoflife",
                "https://twitter.com/styleoflife"
            ]
        });
        
        // Remove existing if present
        const existing = document.querySelector('script[data-schema="jewelry-store"]');
        if (existing) existing.remove();
        
        script.setAttribute('data-schema', 'jewelry-store');
        document.head.appendChild(script);
    },
    
    // Product listing schema for shop page
    addProductListingSchema: function() {
        // This will be populated dynamically with products
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema', 'product-listing');
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Luxury Jewelry Collection",
            "description": "Shop our exclusive collection of handcrafted luxury jewelry including diamond rings, gold necklaces, earrings, and bracelets.",
            "url": this.siteUrl + "shop.html",
            "hasPart": []
        });
        
        const existing = document.querySelector('script[data-schema="product-listing"]');
        if (existing) existing.remove();
        
        document.head.appendChild(script);
    },
    
    // Organization Schema
    addOrganizationSchema: function() {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.siteName,
            "url": this.siteUrl,
            "logo": this.siteUrl + "logo.png",
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": this.phone,
                "contactType": "customer service",
                "availableLanguage": ["English", "Hindi"],
                "email": this.email
            },
            "sameAs": [
                "https://www.instagram.com/styleoflife.in",
                "https://www.facebook.com/styleoflife",
                "https://twitter.com/styleoflife"
            ]
        });
        
        const existing = document.querySelector('script[data-schema="organization"]');
        if (existing) existing.remove();
        
        script.setAttribute('data-schema', 'organization');
        document.head.appendChild(script);
    },
    
    // Breadcrumb Schema
    addBreadcrumbSchema: function() {
        const page = window.location.pathname;
        let items = [];
        
        if (page === '/' || page === '/index.html') {
            items = [
                { name: "Home", url: this.siteUrl }
            ];
        } else if (page === '/shop.html') {
            items = [
                { name: "Home", url: this.siteUrl },
                { name: "Shop", url: this.siteUrl + "shop.html" }
            ];
        }
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
            }))
        });
        
        const existing = document.querySelector('script[data-schema="breadcrumb"]');
        if (existing) existing.remove();
        
        script.setAttribute('data-schema', 'breadcrumb');
        document.head.appendChild(script);
    },
    
    // Website Schema
    addWebsiteSchema: function() {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.siteName,
            "url": this.siteUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": this.siteUrl + "shop.html?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
            }
        });
        
        const existing = document.querySelector('script[data-schema="website"]');
        if (existing) existing.remove();
        
        script.setAttribute('data-schema', 'website');
        document.head.appendChild(script);
    },
    
    // Update product listing with actual products
    updateProductListing: function(products) {
        const script = document.querySelector('script[data-schema="product-listing"]');
        if (script && products && products.length > 0) {
            const schema = JSON.parse(script.textContent);
            schema.hasPart = products.slice(0, 10).map(product => ({
                "@type": "Product",
                "name": product.name,
                "url": this.siteUrl + "shop.html?product=" + product.id,
                "image": product.images?.[0] || this.siteUrl + "images/placeholder.jpg",
                "description": product.description,
                "sku": product.sku,
                "offers": {
                    "@type": "Offer",
                    "price": product.price,
                    "priceCurrency": "INR",
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
            }));
            script.textContent = JSON.stringify(schema);
            console.log("Product listing schema updated with", products.length, "products");
        }
    },
    
    // Add product schema for individual product (when modal opens)
    addProductSchema: function(product) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema', 'product-' + product.id);
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "sku": product.sku,
            "image": product.image,
            "offers": {
                "@type": "Offer",
                "price": product.price,
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "seller": {
                    "@type": "Organization",
                    "name": this.siteName
                }
            }
        });
        
        // Remove old product schema
        const existing = document.querySelector(`script[data-schema="product-${product.id}"]`);
        if (existing) existing.remove();
        
        document.head.appendChild(script);
    },
    
    // Update meta tag helper
    updateMeta: function(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    },
    
    // Update Open Graph
    updateOG: function(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SEOManager.init());
} else {
    SEOManager.init();
}

// Make global
window.SEOManager = SEOManager;
