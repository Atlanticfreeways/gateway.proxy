// Content Management System
class ContentManager {
    constructor() {
        this.content = JSON.parse(localStorage.getItem('siteContent') || '{}');
        this.initializeEventListeners();
        this.loadContent();
        this.initializeTabs();
    }

    initializeEventListeners() {
        document.getElementById('save-all').addEventListener('click', () => this.saveAllChanges());
        document.getElementById('preview-site').addEventListener('click', () => this.previewSite());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    // Initialize tabs
    initializeTabs() {
        this.switchTab('pricing');
    }

    // Switch between tabs
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // Load existing content
    loadContent() {
        if (Object.keys(this.content).length === 0) {
            this.initializeDefaultContent();
        }

        // Load pricing data
        if (this.content.pricing) {
            this.content.pricing.forEach((plan, index) => {
                const planNum = index + 1;
                document.getElementById(`plan${planNum}-name`).value = plan.name;
                document.getElementById(`plan${planNum}-price`).value = plan.price;
                document.getElementById(`plan${planNum}-features`).value = plan.features.join('\n');
                document.getElementById(`plan${planNum}-popular`).checked = plan.popular;
                document.getElementById(`plan${planNum}-enabled`).checked = plan.enabled;
            });
        }

        // Load feature toggles
        if (this.content.features) {
            Object.entries(this.content.features).forEach(([key, value]) => {
                const element = document.getElementById(`feature-${key}`);
                if (element) element.checked = value;
            });
        }

        // Load site content
        if (this.content.site) {
            Object.entries(this.content.site).forEach(([key, value]) => {
                const element = document.getElementById(key.replace('_', '-'));
                if (element) element.value = value;
            });
        }

        // Load SEO settings
        if (this.content.seo) {
            Object.entries(this.content.seo).forEach(([key, value]) => {
                const element = document.getElementById(`seo-${key}`);
                if (element) element.value = value;
            });
        }
    }

    // Initialize default content
    initializeDefaultContent() {
        this.content = {
            pricing: [
                {
                    name: 'Starter',
                    price: 9.99,
                    features: ['• 1GB bandwidth', '• 10 concurrent connections', '• Basic support', '• HTTP/HTTPS protocols', '• 99.9% uptime'],
                    popular: false,
                    enabled: true
                },
                {
                    name: 'Professional',
                    price: 29.99,
                    features: ['• 10GB bandwidth', '• 50 concurrent connections', '• Priority support', '• All protocols', '• 99.9% uptime'],
                    popular: true,
                    enabled: true
                },
                {
                    name: 'Enterprise',
                    price: 99.99,
                    features: ['• Unlimited bandwidth', '• Unlimited connections', '• 24/7 dedicated support', '• All protocols + SOCKS5', '• 99.99% uptime'],
                    popular: false,
                    enabled: true
                }
            ],
            features: {
                crypto: true,
                referral: false,
                api: true,
                support: true,
                analytics: true
            },
            site: {
                homepage_title: 'Professional Proxy Services',
                homepage_subtitle: 'Fast, reliable, and secure proxy solutions for businesses worldwide',
                contact_email: 'support@gateways-proxy.com'
            },
            seo: {
                title: 'Gateways Proxy - Professional Proxy Services',
                description: 'Professional proxy services with 99.9% uptime. Fast, secure, and reliable proxy solutions for businesses. Multiple payment options including cryptocurrency.',
                keywords: 'proxy, VPN, secure browsing, business proxy, residential proxy',
                canonical: 'https://gateways-proxy.com'
            }
        };
        localStorage.setItem('siteContent', JSON.stringify(this.content));
    }

    // Save all changes
    saveAllChanges() {
        this.savePricingPlans();
        this.saveFeatureToggles();
        this.saveSiteContent();
        this.saveSEOSettings();
        
        localStorage.setItem('siteContent', JSON.stringify(this.content));
        
        // Show success message
        this.showNotification('All changes saved successfully!', 'success');
        
        // Apply changes to live site
        this.applyChanges();
    }

    // Save pricing plans
    savePricingPlans() {
        this.content.pricing = [];
        
        for (let i = 1; i <= 3; i++) {
            const plan = {
                name: document.getElementById(`plan${i}-name`).value,
                price: parseFloat(document.getElementById(`plan${i}-price`).value),
                features: document.getElementById(`plan${i}-features`).value.split('\n').filter(f => f.trim()),
                popular: document.getElementById(`plan${i}-popular`).checked,
                enabled: document.getElementById(`plan${i}-enabled`).checked
            };
            this.content.pricing.push(plan);
        }
    }

    // Save feature toggles
    saveFeatureToggles() {
        this.content.features = {
            crypto: document.getElementById('feature-crypto').checked,
            referral: document.getElementById('feature-referral').checked,
            api: document.getElementById('feature-api').checked,
            support: document.getElementById('feature-support').checked,
            analytics: document.getElementById('feature-analytics').checked
        };
    }

    // Save site content
    saveSiteContent() {
        this.content.site = {
            homepage_title: document.getElementById('homepage-title').value,
            homepage_subtitle: document.getElementById('homepage-subtitle').value,
            contact_email: document.getElementById('contact-email').value
        };
    }

    // Save SEO settings
    saveSEOSettings() {
        this.content.seo = {
            title: document.getElementById('seo-title').value,
            description: document.getElementById('seo-description').value,
            keywords: document.getElementById('seo-keywords').value,
            canonical: document.getElementById('seo-canonical').value
        };
        
        // Save analytics IDs
        this.content.analytics = {
            ga_id: document.getElementById('ga-id').value,
            gtm_id: document.getElementById('gtm-id').value
        };
    }

    // Apply changes to live site
    applyChanges() {
        // Update page title
        document.title = this.content.seo.title;
        
        // Update meta tags
        this.updateMetaTag('description', this.content.seo.description);
        this.updateMetaTag('keywords', this.content.seo.keywords);
        
        // Update canonical URL
        this.updateCanonicalURL(this.content.seo.canonical);
        
        // Apply feature toggles
        this.applyFeatureToggles();
    }

    // Update meta tag
    updateMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    // Update canonical URL
    updateCanonicalURL(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
    }

    // Apply feature toggles
    applyFeatureToggles() {
        // Hide/show features based on toggles
        Object.entries(this.content.features).forEach(([feature, enabled]) => {
            const elements = document.querySelectorAll(`[data-feature="${feature}"]`);
            elements.forEach(el => {
                el.style.display = enabled ? '' : 'none';
            });
        });
    }

    // Preview site
    previewSite() {
        window.open('index.html', '_blank');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#059669' : '#2563eb'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize content manager
document.addEventListener('DOMContentLoaded', () => {
    new ContentManager();
});