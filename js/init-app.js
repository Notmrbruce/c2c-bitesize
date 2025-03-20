/**
 * Application Initialization
 * Standalone file to initialize the application
 * Place this file in the js/ directory
 */

import appController from './app-controller.js';

// Log initial environment information
console.log('[InitApp] Current page:', window.location.pathname);
console.log('[InitApp] Browser information:', navigator.userAgent);

// Setup global error handling
window.addEventListener('error', function(e) {
    console.error('[InitApp] Uncaught error:', e.message);
    console.error('[InitApp] File:', e.filename);
    console.error('[InitApp] Line:', e.lineno);
    console.error('[InitApp] Column:', e.colno);
    console.error('[InitApp] Stack:', e.error?.stack);
    
    // Optional: Show user-friendly error message
    if (!window.errorNotified) {
        window.errorNotified = true;
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-notification';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h3>Something went wrong</h3>
                <p>We encountered an unexpected error. Try refreshing the page.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Remove after 10 seconds or if user clicks refresh
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
                window.errorNotified = false;
            }
        }, 10000);
    }
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[InitApp] Document loaded, initializing application');
    
    // Initialize application with new controller
    appController.initApp().then(success => {
        if (success) {
            console.log('[InitApp] Application successfully initialized');
        } else {
            console.error('[InitApp] Application initialization failed, trying fallback');
            
            // Try alternative initialization if the new controller fails
            tryFallbackInitialization();
        }
    }).catch(error => {
        console.error('[InitApp] Error during application initialization:', error);
        tryFallbackInitialization();
    });
});

// Fallback initialization for robustness
function tryFallbackInitialization() {
    console.log('[InitApp] Using fallback initialization');
    
    try {
        // Simple approach to just get modules loaded
        const modulesView = document.getElementById('modules-view');
        const methodsView = document.getElementById('methods-view');
        const contentView = document.getElementById('content-view');
        const modulesList = document.getElementById('modules-list');
        
        // Show modules view
        if (modulesView) {
            modulesView.classList.remove('hidden');
        }
        
        if (methodsView) {
            methodsView.classList.add('hidden');
        }
        
        if (contentView) {
            contentView.classList.add('hidden');
        }
        
        // Try to load modules directly
        if (modulesList) {
            import('./enhanced-module-loader.js').then(({ loadModulesList }) => {
                loadModulesList().then(modules => {
                    // Clear any existing content
                    modulesList.innerHTML = '';
                    
                    // Display modules
                    if (modules && modules.length > 0) {
                        modules.forEach(module => {
                            const moduleCard = document.createElement('div');
                            moduleCard.className = 'module-card';
                            moduleCard.innerHTML = `
                                <h3 class="module-title">${module.title}</h3>
                                <p class="module-desc">${module.description}</p>
                            `;
                            
                            // Add click handler
                            moduleCard.addEventListener('click', () => {
                                if (window.navigateToModule) {
                                    window.navigateToModule(module.id);
                                }
                            });
                            
                            modulesList.appendChild(moduleCard);
                        });
                    } else {
                        modulesList.innerHTML = '<p>No modules available.</p>';
                    }
                }).catch(error => {
                    console.error('[InitApp] Error loading modules in fallback:', error);
                    modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
                });
            }).catch(error => {
                console.error('[InitApp] Error importing module loader in fallback:', error);
            });
        }
    } catch (error) {
        console.error('[InitApp] Fallback initialization failed:', error);
    }
}

// Check page load completion
window.addEventListener('load', function() {
    console.log('[InitApp] Page fully loaded at:', new Date().toISOString());
    
    // You can add additional verification checks here
});

export default { 
    // Export to make this importable, though we're using it via script tag
};
