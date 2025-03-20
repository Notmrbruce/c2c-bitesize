/**
 * View Manager
 * Handles consistent view transitions and state
 */

import { animateElement, scrollToTop } from './ui-utils.js';

// Keep references to view elements
let modulesView;
let methodsView;
let contentView;

// Track current view state
let currentView = 'modules';

/**
 * Initialize the view manager
 * @returns {boolean} - Whether initialization was successful
 */
export function initViewManager() {
    console.log('[ViewManager] Initializing view manager');
    
    // Get references to the view containers
    modulesView = document.getElementById('modules-view');
    methodsView = document.getElementById('methods-view');
    contentView = document.getElementById('content-view');
    
    // Check if views are found
    const viewsFound = !!modulesView && !!methodsView && !!contentView;
    
    if (!viewsFound) {
        console.error('[ViewManager] Could not find all required view containers');
        console.error({
            modulesView: !!modulesView,
            methodsView: !!methodsView,
            contentView: !!contentView
        });
        return false;
    }
    
    console.log('[ViewManager] Successfully initialized view manager');
    return true;
}

/**
 * Check if the view manager has been initialized
 * @returns {boolean} - Whether the view manager is initialized
 */
export function isInitialized() {
    return !!modulesView && !!methodsView && !!contentView;
}

/**
 * Show the specified view
 * @param {string} viewName - Name of the view to show ('modules', 'methods', or 'content')
 * @param {Object} options - Additional options
 * @returns {boolean} - Whether the transition was successful
 */
export function showView(viewName, options = {}) {
    if (!isInitialized()) {
        console.error('[ViewManager] Cannot show view - view manager not initialized');
        return false;
    }
    
    console.log(`[ViewManager] Showing view: ${viewName}`);
    
    // Options
    const animate = options.animate !== false;
    const updateCurrentView = options.updateCurrentView !== false;
    
    // Update current view if requested
    if (updateCurrentView) {
        currentView = viewName;
    }
    
    // Hide all views first
    hideAllViews();
    
    // Show the requested view
    let targetView;
    switch (viewName) {
        case 'modules':
            targetView = modulesView;
            break;
            
        case 'methods':
            targetView = methodsView;
            break;
            
        case 'content':
            targetView = contentView;
            break;
            
        default:
            console.error(`[ViewManager] Unknown view: ${viewName}`);
            return false;
    }
    
    // Show the target view
    if (targetView) {
        targetView.classList.remove('hidden');
        
        // Apply animation if requested
        if (animate) {
            animateElement(targetView, 'fade-in');
        }
        
        // Scroll to top (with a slight delay to let the view transition complete)
        setTimeout(() => {
            scrollToTop();
        }, 50);
        
        return true;
    }
    
    return false;
}

/**
 * Hide all views
 */
function hideAllViews() {
    if (modulesView) {
        modulesView.classList.add('hidden');
    }
    
    if (methodsView) {
        methodsView.classList.add('hidden');
    }
    
    if (contentView) {
        contentView.classList.add('hidden');
    }
}

/**
 * Get the currently active view
 * @returns {string} - Current view name
 */
export function getCurrentView() {
    return currentView;
}

/**
 * Get a specific view element
 * @param {string} viewName - Name of the view ('modules', 'methods', or 'content')
 * @returns {HTMLElement|null} - The view element or null if not found
 */
export function getViewElement(viewName) {
    switch (viewName) {
        case 'modules':
            return modulesView;
            
        case 'methods':
            return methodsView;
            
        case 'content':
            return contentView;
            
        default:
            console.error(`[ViewManager] Unknown view: ${viewName}`);
            return null;
    }
}

export default {
    initViewManager,
    isInitialized,
    showView,
    getCurrentView,
    getViewElement
};
