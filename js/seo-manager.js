// js/seo-manager.js - Complete SEO Management System

class SEOManager {
    constructor() {
        this.supabase = null;
        this.init();
    }
    
    async init() {
        const { createClient } = await import('@supabase/supabase-js');
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    
    // Generate all SEO metadata
    generateAllSEO() {
        return {
            metaTags: this.generateMetaTags(),
            structuredData: this.generateStructuredData(),
            openGraph: this.generateOpenGraph(),
            twitterCard: this.generateTwitterCard(),
            hreflang: this.generateHreflang(),
            canonical: this.generateCanonical()
        };
    }
    
    generateMetaTags() {
        const page = window.location.pathname;
        const saved = localStorage.getItem(`metaTags_${page}`);
        if (saved) return JSON.parse(saved);
        
        return {
            title: "Style Of Life - Luxury Jewelry",
            description: "Discover timeless elegance at Style Of Life. Shop luxury jewelry including diamond rings, gold necklaces, and custom-made pieces. Free shipping on orders above ₹3000.",
            keywords: "jewelry, luxury jewelry, diamond rings, gold necklace, earrings, fine jewelry, style of life",
            author: "Style Of Life",
            robots: "index, follow",
            viewport: "width=device-width, initial-scale=1.0"
        };
    }
    
    generateStructuredData() {
        return {
            "@context": "https://schema.org",
            "@graph": [
                this.generateOrganizationSchema(),
                this.generateWebsiteSchema(),
                this.generateLocalBusinessSchema()
            ]
        };
    }
    
    generateOrganizationSchema() {
        return {
            "@type": "JewelryStore",
            "@id": "https://style-of-life.vercel.app/#organization",
            "name": "Style Of Life",
            "url": "https://style-of-life.vercel.app",
            "logo": "https://style-of-life.vercel.app/images/logo.png",
            "sameAs": [
                "https://www.instagram.com/styleoflife",
                "https://www.facebook.com/styleoflife",
                "https://twitter.com/styleoflife",
                "https://pinterest.com/styleoflife"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-9876543210",
                "contactType": "customer service",
                "availableLanguage": ["English", "Hindi"]
            }
        };
    }
    
    generateWebsiteSchema() {
        return {
            "@type": "WebSite",
            "@id": "https://style-of-life.vercel.app/#website",
            "url": "https://style-of-life.vercel.app",
            "name": "Style Of Life",
            "description": "Premium luxury jewelry store in India",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://style-of-life.vercel.app/shop.html?search={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        };
    }
    
    generateLocalBusinessSchema() {
        return {
            "@type": "LocalBusiness",
            "@id": "https://style-of-life.vercel.app/#localbusiness",
            "name": "Style Of Life Jewelry",
            "image": "https://style-of-life.vercel.app/images/store.jpg",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Linking Road, Bandra West",
                "addressLocality": "Mumbai",
                "addressRegion": "MH",
                "postalCode": "400050",
                "addressCountry": "IN"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "19.0760",
                "longitude": "72.8777"
            },
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "10:00",
                    "closes": "20:00"
                }
            ],
            "priceRange": "₹₹₹",
            "telephone": "+91-9876543210"
        };
    }
    
    generateOpenGraph() {
        const saved = localStorage.getItem('openGraph');
        if (saved) return saved;
        
        return {
            "og:type": "website",
            "og:title": "Style Of Life - Luxury Jewelry",
            "og:description": "Discover timeless elegance with our luxury jewelry collection",
            "og:image": "https://style-of-life.vercel.app/images/og-image.jpg",
            "og:url": "https://style-of-life.vercel.app",
            "og:site_name": "Style Of Life",
            "og:locale": "en_IN"
        };
    }
    
    generateTwitterCard() {
        const saved = localStorage.getItem('twitterCard');
        if (saved) return saved;
        
        return {
            "twitter:card": "summary_large_image",
            "twitter:title": "Style Of Life - Luxury Jewelry",
            "twitter:description": "Discover timeless elegance with our luxury jewelry collection",
            "twitter:image": "https://style-of-life.vercel.app/images/og-image.jpg",
            "twitter:site": "@styleoflife"
        };
    }
    
    generateHreflang() {
        return [
            { lang: "en", url: "https://style-of-life.vercel.app/" },
            { lang: "hi", url: "https://style-of-life.vercel.app/hi/" }
        ];
    }
    
    generateCanonical() {
        return window.location.href.split('?')[0];
    }
    
    // Sitemap generation
    async generateSitemap() {
        try {
            const { data: products } = await this.supabase
                .from('products')
                .select('id, name, updated_at, images');
            
            const siteUrl = CONFIG.SITE_URL || 'https://style-of-life.vercel.app';
            const today = new Date().toISOString().split('T')[0];
            
            let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    
    <url>
        <loc>${siteUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    
    <url>
        <loc>${siteUrl}/shop.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    
    <url>
        <loc>${siteUrl}/track.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`;
            
            if (products) {
                products.forEach(product => {
                    sitemap += `
    <url>
        <loc>${siteUrl}/product.html?id=${product.id}</loc>
        <lastmod>${product.updated_at?.split('T')[0] || today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>`;
                    
                    if (product.images && product.images[0]) {
                        sitemap += `
        <image:image>
            <image:loc>${product.images[0]}</image:loc>
            <image:title>${this.escapeXml(product.name)}</image:title>
        </image:image>`;
                    }
                    
                    sitemap += `
    </url>`;
                });
            }
            
            sitemap += `
</urlset>`;
            
            return sitemap;
            
        } catch (error) {
            console.error('Sitemap generation error:', error);
            return null;
        }
    }
    
    // Robots.txt generation
    generateRobotsTxt() {
        const siteUrl = CONFIG.SITE_URL || 'https://style-of-life.vercel.app';
        
        return `# Style Of Life - robots.txt
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /
Allow: /shop.html
Allow: /product.html
Allow: /track.html
Allow: /cart.html
Allow: /customer-portal.html
Allow: /register.html
Allow: /images/
Allow: /css/
Allow: /js/

Disallow: /admin.html
Disallow: /admin-*.html
Disallow: /login.html
Disallow: /checkout.html
Disallow: /api/
Disallow: /*?*
Disallow: /*&*

Sitemap: ${siteUrl}/sitemap.xml
Crawl-delay: 2

User-agent: Googlebot
Allow: /
Disallow: /admin*
Disallow: /login*
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Disallow: /admin*
Crawl-delay: 2

User-agent: Pinterest
Allow: /
Allow: /images/
Disallow: /admin*

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /`;
    }
    
    // Performance monitoring
    async measureCoreWebVitals() {
        const metrics = {};
        
        // Get navigation timing
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
            metrics['First Paint'] = nav.domContentLoadedEventEnd - nav.fetchStart;
            metrics['DOM Load'] = nav.domComplete - nav.domLoading;
            metrics['Page Load'] = nav.loadEventEnd - nav.fetchStart;
        }
        
        // Get Largest Contentful Paint
        const lcp = await this.getLCP();
        if (lcp) metrics['Largest Contentful Paint'] = lcp;
        
        // Get First Input Delay
        const fid = await this.getFID();
        if (fid) metrics['First Input Delay'] = fid;
        
        // Get Cumulative Layout Shift
        const cls = await this.getCLS();
        if (cls) metrics['Cumulative Layout Shift'] = cls;
        
        return metrics;
    }
    
    getLCP() {
        return new Promise((resolve) => {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry.renderTime || lastEntry.loadTime);
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            
            setTimeout(() => resolve(null), 5000);
        });
    }
    
    getFID() {
        return new Promise((resolve) => {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const firstInput = entries[0];
                resolve(firstInput.processingStart - firstInput.startTime);
            }).observe({ type: 'first-input', buffered: true });
            
            setTimeout(() => resolve(null), 5000);
        });
    }
    
    getCLS() {
        return new Promise((resolve) => {
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                resolve(clsValue);
            }).observe({ type: 'layout-shift', buffered: true });
            
            setTimeout(() => resolve(null), 5000);
        });
    }
    
    // Keyword analysis
    analyzeKeywords(content) {
        const words = content.toLowerCase().match(/\b\w+\b/g) || [];
        const wordCount = {};
        
        words.forEach(word => {
            if (word.length > 3 && !this.isStopWord(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        
        const sorted = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        return sorted.map(([word, count]) => ({
            keyword: word,
            count: count,
            density: ((count / words.length) * 100).toFixed(2)
        }));
    }
    
    isStopWord(word) {
        const stopWords = ['the', 'and', 'for', 'are', 'with', 'this', 'that', 'from', 'your', 'have', 'not', 'was', 'were', 'but', 'they'];
        return stopWords.includes(word);
    }
    
    // Backlink analysis (simulated)
    analyzeBacklinks() {
        return {
            total: 156,
            uniqueDomains: 89,
            dofollow: 112,
            nofollow: 44,
            topDomains: [
                { domain: 'instagram.com', authority: 92, type: 'Social' },
                { domain: 'facebook.com', authority: 95, type: 'Social' },
                { domain: 'pinterest.com', authority: 88, type: 'Social' },
                { domain: 'jewelryblog.com', authority: 65, type: 'Blog' },
                { domain: 'fashionmagazine.com', authority: 72, type: 'Magazine' }
            ]
        };
    }
    
    // Competitor analysis
    async analyzeCompetitor(url) {
        // This would normally call an API
        return {
            url: url,
            domainAuthority: 72,
            totalBacklinks: 1245,
            topKeywords: [
                { keyword: 'diamond rings', position: 3, volume: 1200 },
                { keyword: 'gold necklace', position: 5, volume: 980 },
                { keyword: 'bridal jewelry', position: 2, volume: 750 }
            ],
            estimatedTraffic: 12500,
            socialShares: {
                facebook: 2340,
                pinterest: 1890,
                instagram: 4560
            }
        };
    }
    
    // Helper functions
    escapeXml(str) {
        if (!str) return '';
        return str.replace(/[<>&]/g, m => {
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '&') return '&amp;';
            return m;
        });
    }
    
    // Save all SEO data to localStorage
    saveAll() {
        const seoData = this.generateAllSEO();
        localStorage.setItem('seoData', JSON.stringify(seoData));
        return seoData;
    }
    
    // Load SEO data
    loadAll() {
        const saved = localStorage.getItem('seoData');
        return saved ? JSON.parse(saved) : this.generateAllSEO();
    }
}

// Export for use
window.SEOManager = SEOManager;
window.seoManager = new SEOManager();
