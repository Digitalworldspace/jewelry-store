// js/image-optimizer.js
// Image optimization helper

const ImageOptimizer = {
    // Convert images to WebP format
    init: function() {
        this.optimizeProductImages();
        this.addLazyLoading();
    },
    
    optimizeProductImages: function() {
        document.querySelectorAll('img').forEach(img => {
            // Add loading lazy
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Add decoding async
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
            
            // Add width and height to prevent layout shift
            if (!img.hasAttribute('width') && img.naturalWidth) {
                img.setAttribute('width', img.naturalWidth);
                img.setAttribute('height', img.naturalHeight);
            }
        });
    },
    
    addLazyLoading: function() {
        // Use Intersection Observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ImageOptimizer.init());
} else {
    ImageOptimizer.init();
}

window.ImageOptimizer = ImageOptimizer;
