// js/seo-helper.js
// Dynamic SEO Helper for Style Of Life

class SEOHelper {
    constructor() {
        this.siteName = "Style Of Life";
        this.siteUrl = "https://styleoflife987-hub.github.io/jewelry-store/";
        this.defaultImage = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338";
        this.defaultDescription = "Discover exquisite handcrafted jewelry at Style Of Life. Shop diamond rings, gold necklaces, earrings, and luxury accessories.";
        this.initialized = false;
    }

    // Initialize SEO Helper
    init() {
        if (this.initialized) return;
        
        console.log("SEO Helper initializing...");
        
        // Add missing meta tags
        this.addMissingMetaTags();
        
        // Add organization schema if not present
        if (!document.querySelector('script[data-organization-schema]')) {
            this.addOrganizationSchema();
        }
        
        this.initialized = true;
        console.log("SEO Helper initialized successfully");
    }

    // Add missing meta tags
    addMissingMetaTags() {
        // Check and add viewport if missing
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
            document.head.appendChild(viewport);
        }

        // Add robots meta if missing
        if (!document.querySelector('meta[name="robots"]')) {
            const robots = document.createElement('meta');
            robots.name = 'robots';
            robots.content = 'index, follow, max-image-preview:large';
            document.head.appendChild(robots);
        }

        // Add theme-color if missing
        if (!document.querySelector('meta[name="theme-color"]')) {
            const themeColor = document.createElement('meta');
            themeColor.name = 'theme-color';
            themeColor.content = '#d4af37';
            document.head.appendChild(themeColor);
        }
    }

    // Set page title
    setTitle(title) {
        document.title = `${title} | ${this.siteName}`;
        
        // Update Open Graph title
        this.updateMetaProperty('og:title', `${title} | ${this.siteName}`);
        
        // Update Twitter title
        this.updateMetaName('twitter:title', `${title} | ${this.siteName}`);
        
        console.log(`SEO: Title set to "${document.title}"`);
    }

    // Set meta description
    setDescription(description) {
        // Update standard description
        this.updateMetaName('description', description);
        
        // Update Open Graph description
        this.updateMetaProperty('og:description', description);
        
        // Update Twitter description
        this.updateMetaName('twitter:description', description);
        
        console.log(`SEO: Description set`);
    }

    // Set canonical URL
    setCanonical(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
        
        // Update Open Graph URL
        this.updateMetaProperty('og:url', url);
        
        console.log(`SEO: Canonical URL set to "${url}"`);
    }

    // Set Open Graph image
    setOgImage(imageUrl, width = 1200, height = 630) {
        this.updateMetaProperty('og:image', imageUrl);
        this.updateMetaProperty('og:image:width', width.toString());
        this.updateMetaProperty('og:image:height', height.toString());
        
        // Update Twitter image
        this.updateMetaName('twitter:image', imageUrl);
        
        console.log(`SEO: OG Image set`);
    }

    // Update meta property (for Open Graph)
    updateMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    // Update meta name (for Twitter and standard)
    updateMetaName(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    // Add product schema
    addProductSchema(product) {
        // Remove existing product schema
        const existingScript = document.querySelector('script[data-product-schema]');
        if (existingScript) {
            existingScript.remove();
        }
        
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
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            }
        });
        
        document.head.appendChild(script);
        console.log(`SEO: Product schema added for "${product.name}"`);
    }

    // Add breadcrumb schema
    addBreadcrumbSchema(items) {
        // Remove existing breadcrumb schema
        const existingScript = document.querySelector('script[data-breadcrumb-schema]');
        if (existingScript) {
            existingScript.remove();
        }
        
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
    }

    // Add organization schema
    addOrganizationSchema() {
        // Remove existing organization schema
        const existingScript = document.querySelector('script[data-organization-schema]');
        if (existingScript) {
            existingScript.remove();
        }
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-organization-schema', 'true');
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.siteName,
            "url": this.siteUrl,
            "logo": `${this.siteUrl}logo.png`,
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
    }

    // Track page view for analytics
    trackPageView(pageName, pageUrl) {
        // Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                'page_title': pageName,
                'page_location': pageUrl
            });
        }
        
        // Store in localStorage for custom analytics
        const analytics = JSON.parse(localStorage.getItem('seo_analytics') || '[]');
        analytics.push({
            page: pageName,
            url: pageUrl,
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            userAgent: navigator.userAgent
        });
        
        // Keep only last 100 records
        while (analytics.length > 100) {
            analytics.shift();
        }
        
        localStorage.setItem('seo_analytics', JSON.stringify(analytics));
        console.log(`SEO: Page view tracked for "${pageName}"`);
    }

    // Get analytics summary
    getAnalyticsSummary() {
        const analytics = JSON.parse(localStorage.getItem('seo_analytics') || '[]');
        const pageViews = {};
        
        analytics.forEach(item => {
            if (item.page) {
                pageViews[item.page] = (pageViews[item.page] || 0) + 1;
            }
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
                const七天前 = new Date();
               七天前.setDate(七天前.getDate() - 7);
                return date >七天前;
            }).length
        };
    }

    // Initialize SEO for page
    initPage(pageData) {
        console.log("SEO: Initializing page SEO...");
        
        if (pageData.title) {
            this.setTitle(pageData.title);
        }
        
        if (pageData.description) {
            this.setDescription(pageData.description);
        }
        
        if (pageData.canonical) {
            this.setCanonical(pageData.canonical);
        }
        
        if (pageData.image) {
            this.setOgImage(pageData.image);
        }
        
        if (pageData.breadcrumbs && pageData.breadcrumbs.length > 0) {
            this.addBreadcrumbSchema(pageData.breadcrumbs);
        }
        
        if (pageData.product) {
            this.addProductSchema(pageData.product);
        }
        
        // Track page view
        this.trackPageView(pageData.title || document.title, window.location.href);
        
        console.log("SEO: Page SEO initialization complete");
    }
}

// Create singleton instance
const seoHelper = new SEOHelper();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        seoHelper.init();
    });
} else {
    seoHelper.init();
}

// Make available globally
window.SEOHelper = seoHelper;
window.seoHelper = seoHelper;

// Export for module usage
export { seoHelper, SEOHelper };
