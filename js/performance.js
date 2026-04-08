// js/performance.js - Performance optimization script

// 1. Lazy load images
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});
lazyImages.forEach(img => imageObserver.observe(img));

// 2. Defer non-critical JavaScript
function deferScripts() {
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.async = true;
        document.body.appendChild(newScript);
        script.remove();
    });
}

// 3. Load after page load
if (window.requestIdleCallback) {
    requestIdleCallback(deferScripts);
} else {
    setTimeout(deferScripts, 2000);
}

// 4. Add loading="lazy" to all images
document.querySelectorAll('img:not([loading])').forEach(img => {
    img.setAttribute('loading', 'lazy');
});

// 5. WebP detection and conversion
function supportsWebP() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
}

// 6. Prefetch next page on hover
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('mouseenter', () => {
        const href = link.href;
        if (href && href.startsWith(window.location.origin)) {
            const prefetch = document.createElement('link');
            prefetch.rel = 'prefetch';
            prefetch.href = href;
            document.head.appendChild(prefetch);
        }
    });
});
