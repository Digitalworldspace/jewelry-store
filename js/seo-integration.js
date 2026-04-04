// js/seo-integration.js
// Main SEO Integration File - Connects all SEO components

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('SEO Integration - Loading...');
        
        // 1. Add robots meta tag if missing
        if (!document.querySelector('meta[name="robots"]')) {
            const meta = document.createElement('meta');
            meta.name = 'robots';
            meta.content = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
            document.head.appendChild(meta);
            console.log('SEO Integration: Added robots meta tag');
        }
        
        // 2. Add canonical URL if missing
        if (!document.querySelector('link[rel="canonical"]')) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = window.location.href.split('?')[0].split('#')[0];
            document.head.appendChild(link);
            console.log('SEO Integration: Added canonical URL');
        }
        
        // 3. Add language meta if missing
        if (!document.querySelector('meta[http-equiv="content-language"]')) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'content-language';
            meta.content = 'en-IN';
            document.head.appendChild(meta);
            console.log('SEO Integration: Added language meta');
        }
        
        // 4. Add viewport if missing
        if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
            document.head.appendChild(meta);
            console.log('SEO Integration: Added viewport meta');
        }
        
        // 5. Add theme-color if missing
        if (!document.querySelector('meta[name="theme-color"]')) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = '#d4af37';
            document.head.appendChild(meta);
            console.log('SEO Integration: Added theme-color');
        }
        
        // 6. Add author if missing
        if (!document.querySelector('meta[name="author"]')) {
            const meta = document.createElement('meta');
            meta.name = 'author';
            meta.content = 'Style Of Life Jewelry';
            document.head.appendChild(meta);
            console.log('SEO Integration: Added author meta');
        }
        
        // 7. Initialize SEO Helper if available
        if (typeof window.SEOHelper !== 'undefined' && window.SEOHelper.init) {
            window.SEOHelper.init();
            console.log('SEO Integration: SEO Helper initialized');
        } else if (typeof window.seoHelper !== 'undefined' && window.seoHelper.init) {
            window.seoHelper.init();
            console.log('SEO Integration: seoHelper initialized');
        }
        
        // 8. Initialize Analytics if available
        if (typeof window.Analytics !== 'undefined' && window.Analytics.init) {
            window.Analytics.init();
            console.log('SEO Integration: Analytics initialized');
        } else if (typeof window.analytics !== 'undefined' && window.analytics.init) {
            window.analytics.init();
            console.log('SEO Integration: analytics initialized');
        }
        
        // 9. Track product page if product data exists
        if (window.currentProduct && typeof window.Analytics !== 'undefined') {
            window.Analytics.trackProductView(window.currentProduct);
            console.log('SEO Integration: Product view tracked');
        }
        
        // 10. Add structured data for contact page if applicable
        if (window.location.pathname.includes('contact') || 
            window.location.pathname.includes('customer-portal')) {
            addContactPageSchema();
        }
        
        // 11. Add structured data for FAQ page if applicable
        if (window.location.pathname.includes('faq')) {
            addFAQPageSchema();
        }
        
        console.log('SEO Integration - Complete');
    });
    
    // Add Contact Page Schema
    function addContactPageSchema() {
        if (document.querySelector('script[data-contact-schema]')) return;
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-contact-schema', 'true');
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Us - Style Of Life",
            "description": "Get in touch with Style Of Life Jewelry for inquiries, support, and feedback.",
            "url": window.location.href,
            "mainEntity": {
                "@type": "Organization",
                "name": "Style Of Life",
                "telephone": "+91-6352925472",
                "email": "styleoflife987@gmail.com",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Surat",
                    "addressRegion": "Gujarat",
                    "addressCountry": "IN"
                }
            }
        });
        document.head.appendChild(script);
        console.log('SEO Integration: Contact page schema added');
    }
    
    // Add FAQ Page Schema
    function addFAQPageSchema() {
        if (document.querySelector('script[data-faq-schema]')) return;
        
        // Get all FAQ items from the page
        const faqItems = [];
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach((question, index) => {
            const answer = question.nextElementSibling;
            if (answer && answer.classList.contains('faq-answer')) {
                faqItems.push({
                    "@type": "Question",
                    "name": question.innerText.replace(/[↓↑]/g, '').trim(),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answer.innerText.trim()
                    }
                });
            }
        });
        
        if (faqItems.length > 0) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-faq-schema', 'true');
            script.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqItems
            });
            document.head.appendChild(script);
            console.log(`SEO Integration: FAQ schema added with ${faqItems.length} items`);
        }
    }
    
    // Track outbound links
    function trackOutboundLinks() {
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            if (!link.href.includes(window.location.hostname)) {
                link.addEventListener('click', function(e) {
                    if (typeof window.Analytics !== 'undefined') {
                        window.Analytics.trackEvent('outbound_click', {
                            url: this.href,
                            text: this.innerText
                        });
                    }
                    console.log(`SEO Integration: Outbound link clicked - ${this.href}`);
                });
            }
        });
    }
    
    // Track file downloads
    function trackDownloads() {
        const downloadLinks = document.querySelectorAll('a[href$=".pdf"], a[href$=".zip"], a[href$=".doc"], a[href$=".jpg"], a[href$=".png"]');
        downloadLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (typeof window.Analytics !== 'undefined') {
                    window.Analytics.trackEvent('download', {
                        file: this.href,
                        type: this.href.split('.').pop()
                    });
                }
                console.log(`SEO Integration: Download tracked - ${this.href}`);
            });
        });
    }
    
    // Execute additional tracking after delay
    setTimeout(() => {
        trackOutboundLinks();
        trackDownloads();
    }, 2000);
    
})();

// Make functions available globally for dynamic content
window.refreshSEOSchemas = function() {
    console.log('SEO Integration: Refreshing schemas...');
    if (window.location.pathname.includes('faq')) {
        // This will be called by the FAQ page after loading dynamic content
        setTimeout(() => {
            if (typeof addFAQPageSchema === 'function') {
                addFAQPageSchema();
            }
        }, 500);
    }
};
