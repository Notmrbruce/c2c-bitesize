/**
 * Navigation handler for C2C Bitesize
 * Manages page navigation and active link state
 */

import state from './state-manager.js';
import { loadModulesList } from './module-loader.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Navigation] Initializing navigation...');
    
    // Setup navigation
    setupNavigation();
    
    // Check if app.js has already initialized the page
    const appInitialized = window.appInitialized || false;
    console.log('[Navigation] App initialized:', appInitialized);
    
    // If we're on the modules page and app hasn't loaded modules yet, load them
    if (isCurrentPage('modules') && !window.modulesContentLoaded) {
        console.log('[Navigation] Loading modules content from navigation.js');
        loadModulesContent();
    }
});

/**
 * Setup navigation event listeners and initial state
 */
function setupNavigation() {
    console.log('[Navigation] Setting up navigation event listeners');
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('[Navigation] Found', navLinks.length, 'navigation links');
    
    // Add click handlers for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const page = this.getAttribute('data-page');
            console.log('[Navigation] Link clicked for page:', page);
            
            // For same-page navigation, prevent default and use client-side routing
            if (isCurrentPage(page)) {
                e.preventDefault();
                handlePageNavigation(page);
            }
            // Else, let the browser handle the navigation to a new page
        });
    });
    
    // Set active nav based on current URL
    setActiveNavLinks();
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const mobileDropdown = document.getElementById('mobile-dropdown');
    
    if (mobileMenuButton && hamburgerIcon && mobileDropdown) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            hamburgerIcon.classList.toggle('open');
            mobileDropdown.classList.toggle('open');
            console.log('[Navigation] Mobile menu toggled');
        });
    } else {
        console.warn('[Navigation] Mobile menu elements not found:', {
            mobileMenuButton: !!mobileMenuButton, 
            hamburgerIcon: !!hamburgerIcon, 
            mobileDropdown: !!mobileDropdown
        });
    }
    
    // Handle scroll behavior for navbar
    window.addEventListener('scroll', handleScrollBehavior);
    
    console.log('[Navigation] Navigation setup complete');
}

/**
 * Load modules content for the modules page
 */
async function loadModulesContent() {
    try {
        console.log('[Navigation] Loading modules content...');
        const modulesList = document.getElementById('modules-list');
        if (!modulesList) {
            console.error('[Navigation] Modules list container not found');
            return;
        }
        
        // Show loading
        modulesList.innerHTML = '<div class="loading-indicator">Loading modules...</div>';
        
        // Load modules data
        console.log('[Navigation] Fetching modules data...');
        const modules = await loadModulesList();
        console.log('[Navigation] Modules data loaded:', modules?.length || 0, 'modules');
        
        // Clear loading
        modulesList.innerHTML = '';
        
        // Display modules
        if (modules && modules.length > 0) {
            console.log('[Navigation] Rendering modules');
            
            modules.forEach((module, index) => {
                const moduleCard = document.createElement('div');
                moduleCard.className = 'module-card';
                moduleCard.setAttribute('role', 'listitem');
                moduleCard.setAttribute('tabindex', '0');
                moduleCard.setAttribute('aria-label', `Module: ${module.title}`);
                
                moduleCard.innerHTML = `
                    <h3 class="module-title">${module.title}</h3>
                    <p class="module-desc">${module.description}</p>
                `;
                
                // Add click handler to navigate to module
                moduleCard.addEventListener('click', () => {
                    navigateToModule(module.id);
                });
                
                // Add keyboard handler
                moduleCard.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToModule(module.id);
                    }
                });
                
                modulesList.appendChild(moduleCard);
                
                // Add fade-in animation with delay
                setTimeout(() => {
                    moduleCard.classList.add('fade-in');
                }, index * 100);
            });
            
            // Set flag to indicate modules have been loaded
            window.modulesContentLoaded = true;
        } else {
            console.warn('[Navigation] No modules found');
            modulesList.innerHTML = '<p>No modules available.</p>';
        }
    } catch (error) {
        console.error('[Navigation] Error loading modules:', error);
        const modulesList = document.getElementById('modules-list');
        if (modulesList) {
            modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
        }
    }
}

/**
 * Navigate to a specific module
 * @param {string} moduleId - The ID of the module to navigate to
 */
function navigateToModule(moduleId) {
    console.log('[Navigation] Navigating to module:', moduleId);
    
    // Since we've moved to a multi-page structure, we need to load the module details
    // This requires us to import the module loader and then navigate via state
    import('./module-loader.js').then(({ loadModule }) => {
        console.log('[Navigation] Loading module data for:', moduleId);
        
        loadModule(moduleId)
            .then(moduleData => {
                console.log('[Navigation] Module data loaded, navigating to methods view');
                state.navigateTo('methods', { module: moduleData });
                
                // Update the breadcrumb
                const breadcrumbModule = document.getElementById('breadcrumb-module');
                const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
                const breadcrumbItem = document.getElementById('breadcrumb-item');
                
                if (breadcrumbModule) {
                    breadcrumbModule.textContent = moduleData.title;
                    breadcrumbModule.href = '#';
                }
                
                if (mobileBreadcrumb) {
                    mobileBreadcrumb.textContent = moduleData.title;
                    mobileBreadcrumb.href = '#';
                    mobileBreadcrumb.style.display = 'block';
                }
                
                if (breadcrumbItem) {
                    breadcrumbItem.style.display = 'block';
                }
                
                // Show methods view, hide modules view
                const methodsView = document.getElementById('methods-view');
                const modulesView = document.getElementById('modules-view');
                const contentView = document.getElementById('content-view');
                
                if (methodsView) {
                    methodsView.classList.remove('hidden');
                }
                
                if (modulesView) {
                    modulesView.classList.add('hidden');
                }
                
                if (contentView) {
                    contentView.classList.add('hidden');
                }
                
                // Update the selected module title
                const selectedModuleTitle = document.getElementById('selected-module-title');
                if (selectedModuleTitle) {
                    selectedModuleTitle.textContent = moduleData.title.toUpperCase();
                }
            })
            .catch(error => {
                console.error(`[Navigation] Error loading module ${moduleId}:`, error);
            });
    }).catch(error => {
        console.error('[Navigation] Error importing module-loader.js:', error);
    });
}

/**
 * Check if the specified page is the current page
 * @param {string} page - Page identifier
 * @returns {boolean} True if it's the current page
 */
function isCurrentPage(page) {
    const currentPath = window.location.pathname;
    console.log('[Navigation] Checking if current page is', page, 'currentPath:', currentPath);
    
    if (page === 'home') {
        return currentPath.endsWith('index.html') || currentPath.endsWith('/');
    } else if (page === 'modules') {
        return currentPath.endsWith('modules.html');
    }
    
    return false;
}

/**
 * Handle navigation to a specific page
 * @param {string} page - Page identifier
 */
function handlePageNavigation(page) {
    console.log('[Navigation] Handling navigation to page:', page);
    
    if (page === 'home') {
        // Handle home page specific logic
        // This should now properly display the home content
        if (typeof state !== 'undefined') {
            state.navigateTo('home');
            
            // Update view visibility
            const modulesView = document.getElementById('modules-view');
            const methodsView = document.getElementById('methods-view');
            const contentView = document.getElementById('content-view');
            
            if (modulesView) {
                console.log('[Navigation] Showing modules view for home');
                modulesView.classList.remove('hidden');
            }
            if (methodsView) methodsView.classList.add('hidden');
            if (contentView) contentView.classList.add('hidden');
        }
    } else if (page === 'modules') {
        // Handle modules page specific logic
        if (typeof state !== 'undefined') {
            state.navigateTo('modules');
            
            // Only load modules if they haven't been loaded yet
            if (!window.modulesContentLoaded) {
                console.log('[Navigation] Loading modules content for modules page');
                loadModulesContent();
            }
        }
    }
}

/**
 * Set active state on navigation links based on current URL
 */
function setActiveNavLinks() {
    const currentPath = window.location.pathname;
    console.log('[Navigation] Setting active nav links for path:', currentPath);
    
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // Remove any existing active states
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        
        // Get the link URL without domain
        const linkPath = new URL(link.href, window.location.origin).pathname;
        
        // Set active state based on path matching
        if (linkPath === currentPath) {
            console.log('[Navigation] Setting active state for link:', link.getAttribute('data-page'));
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
        // Special case for index/home
        else if ((currentPath === '/' || currentPath.endsWith('index.html')) && 
                 link.getAttribute('data-page') === 'home') {
            console.log('[Navigation] Setting active state for home link');
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/**
 * Handle scroll behavior for navbar and logo
 */
function handleScrollBehavior() {
    const navbarWrapper = document.getElementById('navbar-wrapper');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const logoContainer = document.getElementById('logo-container');
    
    if (!navbarWrapper || !logoContainer) {
        // Only log this once to prevent console spam
        if (!window.scrollHandlerWarningLogged) {
            console.warn('[Navigation] Missing elements for scroll behavior');
            window.scrollHandlerWarningLogged = true;
        }
        return;
    }
    
    const st = window.pageYOffset || document.documentElement.scrollTop;
    
    // Get last scroll position from state if available
    let lastScrollTop = 0;
    if (typeof state !== 'undefined') {
        lastScrollTop = state.get('ui.lastScrollTop') || 0;
        
        // Update scroll position in state
        state.set('ui.lastScrollTop', st <= 0 ? 0 : st);
    }
    
    const isScrollingDown = st > lastScrollTop;
    
    // Threshold for hiding elements (from config or hardcoded fallback)
    const scrollHideThreshold = 50;
    
    // When scrolling down past threshold, hide elements
    if (st > scrollHideThreshold) {
        logoContainer.classList.add('hidden-logo');
        
        // Only hide navbar when scrolling down
        if (isScrollingDown) {
            navbarWrapper.classList.add('hidden-nav');
            if (mobileMenuButton) mobileMenuButton.classList.add('hidden-nav');
        } else {
            navbarWrapper.classList.remove('hidden-nav');
            if (mobileMenuButton) mobileMenuButton.classList.remove('hidden-nav');
        }
    } else {
        // When at top, show everything
        logoContainer.classList.remove('hidden-logo');
        navbarWrapper.classList.remove('hidden-nav');
        if (mobileMenuButton) mobileMenuButton.classList.remove('hidden-nav');
    }
}

// Export for use in other modules
export {
    setupNavigation,
    setActiveNavLinks,
    handleScrollBehavior,
    loadModulesContent,
    navigateToModule
};

export default {
    setupNavigation,
    setActiveNavLinks,
    handleScrollBehavior,
    loadModulesContent,
    navigateToModule
};
