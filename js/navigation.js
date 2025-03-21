/**
 * Navigation utilities for C2C Bitesize
 * Handles navigation behavior across the platform
 */

// Set up navigation and UI behaviors
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const logoContainer = document.getElementById('logo-container');
    const navbarWrapper = document.getElementById('navbar-wrapper');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const mobileDropdown = document.getElementById('mobile-dropdown');
    
    // Initialize navigation
    initNavigation();
    
    /**
     * Initialize navigation functionality
     */
    function initNavigation() {
        // Force all navbar links to be clickable
        document.querySelectorAll('.nav-links a, .mobile-dropdown a').forEach(function(link) {
            link.style.pointerEvents = 'auto';
            link.style.cursor = 'pointer';
            link.style.zIndex = '9999';
        });
        
        // Mobile menu toggle
        mobileMenuButton.addEventListener('click', function() {
            hamburgerIcon.classList.toggle('open');
            mobileDropdown.classList.toggle('open');
        });
        
        // Set active link based on current page
        setActiveLinks();
        
        // Set up scroll behavior
        handleScrollEffects();
    }
    
    /**
     * Set the active state for navigation links based on current URL
     */
    function setActiveLinks() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.nav-links a, .mobile-dropdown a');
        
        links.forEach(link => {
            if (!link.id.includes('breadcrumb')) { // Skip breadcrumb links
                // Get the link href without domain
                const linkPath = new URL(link.href, window.location.origin).pathname;
                
                // If paths match or if we're on index page
                if (isPathMatch(currentPath, linkPath)) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Check if two paths match, considering edge cases
     * @param {string} currentPath - Current page path
     * @param {string} linkPath - Link destination path
     * @returns {boolean} Whether the paths match
     */
    function isPathMatch(currentPath, linkPath) {
        // Direct match
        if (currentPath === linkPath) return true;
        
        // Home page cases
        if (currentPath.endsWith('/') && linkPath.includes('index.html')) return true;
        if (currentPath.includes('index.html') && linkPath.includes('index.html')) return true;
        
        // Handle modules subdirectories
        if (currentPath.includes('/modules/') && linkPath.includes('modules.html')) return false;
        
        // Handle assessment subdirectories
        if (currentPath.includes('/assessments/') && linkPath.includes('assessments.html')) return false;
        
        return false;
    }
    
    /**
     * Handle scroll effects for the navigation
     */
    function handleScrollEffects() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', function() {
            const st = window.scrollY;
            
            // Determine scroll direction
            const isScrollingDown = st > lastScrollTop;
            lastScrollTop = st;
            
            // When scrolling down past threshold, hide elements
            if (st > 50) {
                logoContainer.classList.add('hidden-logo');
                
                // Only hide navbar when scrolling down
                if (isScrollingDown) {
                    navbarWrapper.classList.add('hidden-nav');
                    mobileMenuButton.classList.add('hidden-nav');
                    
                    // Close mobile menu if open
                    hamburgerIcon.classList.remove('open');
                    mobileDropdown.classList.remove('open');
                } else {
                    navbarWrapper.classList.remove('hidden-nav');
                    mobileMenuButton.classList.remove('hidden-nav');
                }
            } else {
                // When at top, show everything
                logoContainer.classList.remove('hidden-logo');
                navbarWrapper.classList.remove('hidden-nav');
                mobileMenuButton.classList.remove('hidden-nav');
            }
        });
    }
    
    /**
     * Update breadcrumb with module information
     * @param {string} title - Module title
     * @param {Function} clickHandler - Click handler function
     */
    window.updateBreadcrumb = function(title, clickHandler) {
        // Get breadcrumb elements
        const breadcrumbItem = document.getElementById('breadcrumb-item');
        const breadcrumbLink = document.getElementById('breadcrumb-module');
        const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
        
        if (breadcrumbItem && breadcrumbLink && mobileBreadcrumb) {
            // Update content
            breadcrumbLink.textContent = title;
            mobileBreadcrumb.textContent = title;
            
            // Show breadcrumb
            breadcrumbItem.style.display = 'block';
            mobileBreadcrumb.style.display = 'block';
            
            // Set click handlers
            breadcrumbLink.onclick = clickHandler;
            mobileBreadcrumb.onclick = clickHandler;
        }
    };
    
    /**
     * Hide breadcrumb navigation
     */
    window.hideBreadcrumb = function() {
        const breadcrumbItem = document.getElementById('breadcrumb-item');
        const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
        
        if (breadcrumbItem && mobileBreadcrumb) {
            breadcrumbItem.style.display = 'none';
            mobileBreadcrumb.style.display = 'none';
        }
    };
    
    /**
     * Update assessment breadcrumb with assessment information
     * @param {string} title - Assessment title
     * @param {Function} clickHandler - Click handler function
     */
    window.updateAssessmentBreadcrumb = function(title, clickHandler) {
        // Get breadcrumb elements
        const breadcrumbItem = document.getElementById('assessment-breadcrumb-item');
        const breadcrumbLink = document.getElementById('assessment-breadcrumb');
        const mobileBreadcrumb = document.getElementById('mobile-assessment-breadcrumb');
        
        if (breadcrumbItem && breadcrumbLink && mobileBreadcrumb) {
            // Update content
            breadcrumbLink.textContent = title;
            mobileBreadcrumb.textContent = title;
            
            // Show breadcrumb
            breadcrumbItem.style.display = 'block';
            mobileBreadcrumb.style.display = 'block';
            
            // Set click handlers
            breadcrumbLink.onclick = clickHandler;
            mobileBreadcrumb.onclick = clickHandler;
        }
    };
    
    /**
     * Hide assessment breadcrumb
     */
    window.hideAssessmentBreadcrumb = function() {
        const breadcrumbItem = document.getElementById('assessment-breadcrumb-item');
        const mobileBreadcrumb = document.getElementById('mobile-assessment-breadcrumb');
        
        if (breadcrumbItem && mobileBreadcrumb) {
            breadcrumbItem.style.display = 'none';
            mobileBreadcrumb.style.display = 'none';
        }
    };
});