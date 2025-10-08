// Loading States and Error Handling
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.initializeGlobalErrorHandler();
        this.createLoadingComponents();
    }

    // Create loading spinner
    createSpinner(size = 'medium') {
        const spinner = document.createElement('div');
        spinner.className = `spinner spinner-${size}`;
        return spinner;
    }

    // Show loading state
    showLoading(element, text = 'Loading...') {
        const loaderId = Date.now().toString();
        this.activeLoaders.add(loaderId);
        
        const originalContent = element.innerHTML;
        element.dataset.originalContent = originalContent;
        element.dataset.loaderId = loaderId;
        
        element.innerHTML = `
            <div class="loading-state">
                <div class="spinner spinner-medium"></div>
                <span class="loading-text">${text}</span>
            </div>
        `;
        
        element.classList.add('loading');
        return loaderId;
    }

    // Hide loading state
    hideLoading(element) {
        const loaderId = element.dataset.loaderId;
        if (loaderId) {
            this.activeLoaders.delete(loaderId);
        }
        
        const originalContent = element.dataset.originalContent;
        if (originalContent) {
            element.innerHTML = originalContent;
        }
        
        element.classList.remove('loading');
        delete element.dataset.originalContent;
        delete element.dataset.loaderId;
    }

    // Show skeleton screen
    showSkeleton(element, type = 'default') {
        const skeletons = {
            default: `
                <div class="skeleton-item">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            `,
            card: `
                <div class="skeleton-card">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            `,
            table: `
                <div class="skeleton-table">
                    <div class="skeleton-row">
                        <div class="skeleton-cell"></div>
                        <div class="skeleton-cell"></div>
                        <div class="skeleton-cell"></div>
                    </div>
                </div>
            `
        };
        
        element.innerHTML = skeletons[type] || skeletons.default;
        element.classList.add('skeleton-loading');
    }

    // Progress indicator
    showProgress(element, progress = 0) {
        element.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${progress}%</span>
            </div>
        `;
    }

    // Error boundary
    showError(element, message = 'Something went wrong', retry = null) {
        element.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                ${retry ? '<button class="btn btn-secondary retry-btn">Try Again</button>' : ''}
            </div>
        `;
        
        if (retry) {
            element.querySelector('.retry-btn').addEventListener('click', retry);
        }
        
        element.classList.add('error');
    }

    // Global error handler
    initializeGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    handleGlobalError(error) {
        // Show toast notification for global errors
        this.showToast(`Error: ${error.message || 'Something went wrong'}`, 'error');
    }

    // Toast notifications
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Create loading components styles
    createLoadingComponents() {
        if (document.getElementById('loading-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'loading-styles';
        styles.textContent = `
            .spinner {
                border: 2px solid #f3f3f3;
                border-top: 2px solid #2563eb;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .spinner-small { width: 16px; height: 16px; }
            .spinner-medium { width: 32px; height: 32px; }
            .spinner-large { width: 48px; height: 48px; }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 2rem;
            }
            
            .skeleton-item, .skeleton-card, .skeleton-table {
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            .skeleton-line {
                height: 1rem;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            
            .skeleton-line.short { width: 60%; }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .progress-container {
                width: 100%;
                text-align: center;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            
            .progress-fill {
                height: 100%;
                background: #2563eb;
                transition: width 0.3s ease;
            }
            
            .error-state {
                text-align: center;
                padding: 2rem;
                color: #dc2626;
            }
            
            .error-icon {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                min-width: 300px;
                animation: slideIn 0.3s ease;
            }
            
            .toast-info { border-left: 4px solid #2563eb; }
            .toast-success { border-left: 4px solid #059669; }
            .toast-error { border-left: 4px solid #dc2626; }
            .toast-warning { border-left: 4px solid #d97706; }
            
            .toast-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
            }
            
            .toast-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #6b7280;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            .fade-out {
                animation: fadeOut 0.3s ease;
            }
            
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Initialize loading manager
const loadingManager = new LoadingManager();
window.LoadingManager = loadingManager;