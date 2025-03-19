/**
 * Navigation handler for C2C Bitesize
 * Manages page navigation and active link state
 */

import state from './state-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation
    setupNavigation();
});

/**
 * Setup navigation event listeners and initial state
 */
function setupNavigation() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Add click handlers for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const page = this.getAttribute('data-page');
            
            // Allow normal navigation for multi-page structure
            // (No need to prevent default since we're using real page navigation)
            
            // However, if we're already on the right page, prevent default
            // and use client-side navigation
            if (isCurrentPage(page)) {
                e.preventDefault();
                handlePageNavigation(page);
            }
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
        });
    }
    
    // Handle scroll behavior for navbar
    window.addEventListener('scroll', handleScrollBehavior);
}

/**
 * Check if the specified page is the current page
 * @param {string} page - Page identifier
 * @returns {boolean} True if it's the current page
 */
function isCurrentPage(page) {
    const currentPath = window.location.pathname;
    
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
    if (page === 'home') {
        // Handle home page specific logic (if any)
        if (typeof state !== 'undefined') {
            state.navigateTo('home');
        }
    } else if (page === 'modules') {
        // Handle modules page specific logic
        if (typeof state !== 'undefined') {
            state.navigateTo('modules');
        }
    }
}

/**
 * Set active state on navigation links based on current URL
 */
function setActiveNavLinks() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // Remove any existing active states
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        
        // Get the link URL without domain
        const linkPath = new URL(link.href, window.location.origin).pathname;
        
        // Set active state based on path matching
        if (linkPath === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
        // Special case for index/home
        else if ((currentPath === '/' || currentPath.endsWith('index.html')) && 
                 link.getAttribute('data-page') === 'home') {
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
    
    if (!navbarWrapper || !logoContainer) return;
    
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
    handleScrollBehavior
};

export default {
    setupNavigation,
    setActiveNavLinks,
    handleScrollBehavior
};
