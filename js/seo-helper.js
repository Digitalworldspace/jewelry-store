// js/seo-helper.js
// Dynamic SEO Helper for Style Of Life

const SEOHelper = {
    siteName: "Style Of Life",
    siteUrl: "https://styleoflife987-hub.github.io/jewelry-store/",
    defaultImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
    defaultDescription: "Discover exquisite handcrafted jewelry at Style Of Life. Shop diamond rings, gold necklaces, earrings, and luxury accessories.",
    initialized: false,

    // Initialize SEO Helper
    init: function() {
        if (this.initialized) return;
        
        console.log("SEO Helper initializing...");
        this.addMissingMetaTags();
        this.addOrganizationSchema();
        
        this.initialized = true;
        console.log("✅ SEO Helper initialized");
    },

    // Add missing meta tags
    addMissingMetaTags: function() {
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
            document.head.appendChild(viewport);
        }

        if (!document.querySelector('meta[name="robots"]')) {
            const robots = document.createElement('meta');
            robots.name = 'robots';
            robots.content = 'index, follow, max-image-preview:large';
            document.head.appendChild(robots);
        }

        if (!document.querySelector('meta[name="theme-color"]')) {
            const themeColor = document.createElement('meta');
            themeColor.name = 'theme-color';
            themeColor.content = '#d4af37';
            document.head.appendChild(themeColor);
        }
    },

    // Set page title
    setTitle: function(title) {
        document.title = `${title} | ${this.siteName}`;
        this.updateMetaProperty('og:title', `${title} | ${this.siteName}`);
        this.updateMetaName('twitter:title', `${title} | ${this.siteName}`);
        console.log(`SEO: Title set to "${document.title}"`);
    },

    // Set meta description
    setDescription: function(description) {
        this.updateMetaName('description', description);
        this.updateMetaProperty('og:description', description);
        this.updateMetaName('twitter:description', description);
        console.log("SEO: Description set");
    },

    // Set canonical URL
    setCanonical: function(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
        this.updateMetaProperty('og:url', url);
        console.log(`SEO: Canonical URL set to "${url}"`);
    },

    // Set Open Graph image
    setOgImage: function(imageUrl, width = 1200, height = 630) {
        this.updateMetaProperty('og:image', imageUrl);
        this.updateMetaProperty('og:image:width', width.toString());
        this.updateMetaProperty('og:image:height', height.toString());
        this.updateMetaName('twitter:image', imageUrl);
        console.log("SEO: OG Image set");
    },

    // Update meta property (for Open Graph)
    updateMetaProperty: function(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    },

    // Update meta name (for Twitter and standard)
    updateMetaName: function(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    },

    // Add product schema
    addProductSchema: function(product) {
        const existing = document.querySelector('script[data-product-schema]');
        if (existing) existing.remove();
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-product-schema', 'true');
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description || this.defaultDescription,
            "sku": product.sku,
            "mpn": product.sku,
            "image": product.image || this.defaultImage,
            "offers": {
                "@type": "Offer",
                "price": product.price,
                "priceCurrency": "INR",
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
        });
        document.head.appendChild(script);
        console.log(`SEO: Product schema added for "${product.name}"`);
    },

    // Add breadcrumb schema
    addBreadcrumbSchema: function(items) {
        const existing = document.querySelector('script[data-breadcrumb-schema]');
        if (existing) existing.remove();
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-breadcrumb-schema', 'true');
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
        document.head.appendChild(script);
        console.log(`SEO: Breadcrumb schema added with ${items.length} items`);
    },

    // Add organization schema
    addOrganizationSchema: function() {
        const existing = document.querySelector('script[data-organization-schema]');
        if (existing) existing.remove();
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-organization-schema', 'true');
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.siteName,
            "url": this.siteUrl,
            "logo": this.siteUrl + "logo.png",
            "sameAs": [
                "https://www.instagram.com/styleoflife.in",
                "https://www.facebook.com/styleoflife",
                "https://twitter.com/styleoflife"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-6352925472",
                "contactType": "customer service",
                "availableLanguage": ["English", "Hindi"]
            }
        });
        document.head.appendChild(script);
        console.log("SEO: Organization schema added");
    },

    // Track page view for analytics
    trackPageView: function(pageName, pageUrl) {
        const analytics = JSON.parse(localStorage.getItem('seo_analytics') || '[]');
        analytics.push({
            page: pageName,
            url: pageUrl,
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            userAgent: navigator.userAgent
        });
        
        while (analytics.length > 100) analytics.shift();
        localStorage.setItem('seo_analytics', JSON.stringify(analytics));
        console.log(`SEO: Page view tracked for "${pageName}"`);
    },

    // Get analytics summary
    getAnalyticsSummary: function() {
        const analytics = JSON.parse(localStorage.getItem('seo_analytics') || '[]');
        const pageViews = {};
        
        analytics.forEach(item => {
            if (item.page) pageViews[item.page] = (pageViews[item.page] || 0) + 1;
        });
        
        return {
            total_views: analytics.length,
            unique_pages: Object.keys(pageViews).length,
            top_pages: Object.entries(pageViews)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([page, views]) => ({ page, views })),
            last_7_days: analytics.filter(a => {
                const date = new Date(a.timestamp);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return date > sevenDaysAgo;
            }).length
        };
    },

    // Initialize SEO for page
    initPage: function(pageData) {
        console.log("SEO: Initializing page SEO...");
        
        if (pageData.title) this.setTitle(pageData.title);
        if (pageData.description) this.setDescription(pageData.description);
        if (pageData.canonical) this.setCanonical(pageData.canonical);
        if (pageData.image) this.setOgImage(pageData.image);
        if (pageData.breadcrumbs && pageData.breadcrumbs.length > 0) this.addBreadcrumbSchema(pageData.breadcrumbs);
        if (pageData.product) this.addProductSchema(pageData.product);
        
        this.trackPageView(pageData.title || document.title, window.location.href);
        console.log("SEO: Page SEO initialization complete");
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SEOHelper.init());
} else {
    SEOHelper.init();
}

// Make global
window.SEOHelper = SEOHelper;
