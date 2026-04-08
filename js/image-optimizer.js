// Enhanced image optimization
const ImageOptimizer = {
    // Convert to WebP if supported
    toWebP: function(url) {
        return supportsWebP() ? url.replace(/\.(jpg|jpeg|png)$/, '.webp') : url;
    },
    
    // Generate responsive srcset
    getSrcSet: function(url, widths = [300, 600, 900]) {
        return widths.map(w => `${url}?w=${w} ${w}w`).join(', ');
    },
    
    // Compress images before upload
    compressImage: function(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };
            };
        });
    }
};
