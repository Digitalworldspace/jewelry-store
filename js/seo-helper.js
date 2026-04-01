// js/seo-helper.js
// Dynamic SEO Helper for Style Of Life

export class SEOHelper {
    constructor() {
        this.siteName = "Style Of Life";
        this.siteUrl = "https://styleoflife987-hub.github.io/jewelry-store/";
        this.defaultImage = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338";
        this.defaultDescription = "Discover exquisite handcrafted jewelry at Style Of Life. Shop diamond rings, gold necklaces, earrings, and luxury accessories.";
    }

    // Set page title
    setTitle(title) {
        document.title = `${title} | ${this.siteName}`;
        
        // Update Open Graph title
        this.updateMetaProperty('og:title', `${title} | ${this.siteName}`);
        
        // Update Twitter title
        this.updateMetaName('twitter:title', `${title} | ${this.siteName}`);
    }

    // Set meta description
    setDescription(description) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = description;
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }
        
        // Update Open Graph description
        this.updateMetaProperty('og:description', description);
        
        // Update Twitter description
        this.updateMetaName('twitter:description', description);
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
    }

    // Set Open Graph image
    setOgImage(imageUrl, width = 1200, height = 630) {
        this.updateMetaProperty('og:image', imageUrl);
        this.updateMetaProperty('og:image:width', width.toString());
        this.updateMetaProperty('og:image:height', height.toString());
        
        // Update Twitter image
        this.updateMetaName('twitter:image', imageUrl);
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
        const script = document.createElement('script');
        script.type = 'application/ld+json';
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
                "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                        "@type": "MonetaryAmount",
                        "value": product.price >= 3000 ? 0 : 100,
                        "currency": "INR"
                    },
                    "deliveryTime": {
                        "@type": "ShippingDeliveryTime",
                        "handlingTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 1,
                            "maxValue": 2,
                            "unitCode": "DAY"
                        },
                        "transitTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 3,
                            "maxValue": 5,
                            "unitCode": "DAY"
                        }
                    }
                },
                "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "applicableCountry": "IN",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "returnDays": 15,
                    "returnFees": "https://schema.org/FreeReturn"
                }
            }
        });
        
        // Remove existing product schema
        const existingScript = document.querySelector('script[data-product-schema]');
        if (existingScript) {
            existingScript.remove();
        }
        
        script.setAttribute('data-product-schema', 'true');
        document.head.appendChild(script);
    }

    // Add breadcrumb schema
    addBreadcrumbSchema(items) {
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
        
        // Remove existing breadcrumb schema
        const existingScript = document.querySelector('script[data-breadcrumb-schema]');
        if (existingScript) {
            existingScript.remove();
        }
        
        script.setAttribute('data-breadcrumb-schema', 'true');
        document.head.appendChild(script);
    }

    // Add organization schema
    addOrganizationSchema() {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.siteName,
            "url": this.siteUrl,
            "logo": `${this.siteUrl}logo.png`,
            "sameAs": [
                "https://www.instagram.com/styleoflife",
                "https://www.facebook.com/styleoflife",
                "https://twitter.com/styleoflife"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-9876543210",
                "contactType": "customer service",
                "availableLanguage": ["English", "Hindi"]
            }
        });
        
        script.setAttribute('data-organization-schema', 'true');
        document.head.appendChild(script);
    }

    // Track page view for analytics
    trackPageView(pageName, pageUrl) {
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
            referrer: document.referrer
        });
        
        // Keep only last 100 records
        if (analytics.length > 100) {
            analytics.shift();
        }
        
        localStorage.setItem('seo_analytics', JSON.stringify(analytics));
    }

    // Initialize SEO for page
    initPage(pageData) {
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
        
        if (pageData.breadcrumbs) {
            this.addBreadcrumbSchema(pageData.breadcrumbs);
        }
        
        // Add organization schema only once
        if (!document.querySelector('script[data-organization-schema]')) {
            this.addOrganizationSchema();
        }
        
        // Track page view
        this.trackPageView(pageData.title || document.title, window.location.href);
    }
}

// Export singleton instance
export const seoHelper = new SEOHelper();
