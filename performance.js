// Performance Optimization
class PerformanceManager {
    constructor() {
        this.cache = new Map();
        this.imageObserver = null;
        this.initializeLazyLoading();
        this.setupCaching();
        this.optimizeImages();
    }

    // Lazy loading for images
    initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        this.imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                this.imageObserver.observe(img);
            });
        }
    }

    // Cache management
    setupCaching() {
        // Cache API responses
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const cacheKey = `${url}_${JSON.stringify(options)}`;
            
            // Check cache for GET requests
            if (!options.method || options.method === 'GET') {
                const cached = this.cache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
                    return Promise.resolve(new Response(JSON.stringify(cached.data)));
                }
            }
            
            const response = await originalFetch(url, options);
            
            // Cache successful GET responses
            if (response.ok && (!options.method || options.method === 'GET')) {
                const data = await response.clone().json();
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return response;
        };
    }

    // Image optimization
    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            // Add loading attribute
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
            
            // Optimize image format
            if (img.src && !img.dataset.optimized) {
                const url = new URL(img.src, window.location.origin);
                if (this.supportsWebP()) {
                    url.searchParams.set('format', 'webp');
                }
                url.searchParams.set('quality', '85');
                img.src = url.toString();
                img.dataset.optimized = 'true';
            }
        });
    }

    // Check WebP support
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // Code splitting - dynamic imports
    async loadModule(moduleName) {
        const cacheKey = `module_${moduleName}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const module = await import(`./${moduleName}.js`);
            this.cache.set(cacheKey, module);
            return module;
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            throw error;
        }
    }

    // Bundle optimization
    minifyCSS() {
        document.querySelectorAll('style').forEach(style => {
            style.textContent = style.textContent
                .replace(/\s+/g, ' ')
                .replace(/;\s*}/g, '}')
                .replace(/\s*{\s*/g, '{')
                .replace(/;\s*/g, ';')
                .trim();
        });
    }

    // Performance monitoring
    measurePerformance() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const metrics = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
            
            console.log('Performance Metrics:', metrics);
            return metrics;
        }
    }

    // Resource preloading
    preloadResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.url;
            link.as = resource.type;
            document.head.appendChild(link);
        });
    }

    // Critical CSS inlining
    inlineCriticalCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.insertBefore(style, document.head.firstChild);
    }

    // Service Worker registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                return registration;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Memory cleanup
    cleanup() {
        // Clear old cache entries
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > 600000) { // 10 minutes
                this.cache.delete(key);
            }
        }
        
        // Disconnect observers
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
    }
}

// Initialize performance manager
const performanceManager = new PerformanceManager();

// Auto cleanup every 10 minutes
setInterval(() => performanceManager.cleanup(), 600000);

window.PerformanceManager = performanceManager;