/**
 * UI Utilities for C2C Bitesize
 * Common UI helper functions
 */

import config from './config.js';

/**
 * Creates an element with given attributes and children
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Element attributes
 * @param {Array|string|Node} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.entries(value).forEach(([prop, val]) => {
                element.style[prop] = val;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children
    if (children) {
        if (!Array.isArray(children)) {
            children = [children];
        }
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

/**
 * Shows an element by display style
 * @param {HTMLElement} element - Element to show
 * @param {string} displayType - Display style to use
 */
export function showElement(element, displayType = 'block') {
    if (element) {
        element.style.display = displayType;
    }
}

/**
 * Hides an element by setting display to none
 * @param {HTMLElement} element - Element to hide
 */
export function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Add a class with animation delay for staggered animations
 * @param {HTMLElement} element - Element to animate
 * @param {string} className - Animation class name
 * @param {number} delay - Delay in milliseconds
 */
export function animateElement(element, className, delay = 0) {
    if (element) {
        if (delay > 0) {
            element.style.animationDelay = `${delay}ms`;
        }
        element.classList.add(className);
        
        // Remove the class after animation completes to allow re-animation
        const duration = parseFloat(getComputedStyle(element).animationDuration) * 1000;
        setTimeout(() => {
            element.classList.remove(className);
            element.style.animationDelay = '';
        }, duration + delay);
    }
}

/**
 * Shows a loading indicator
 * @param {HTMLElement} container - Container to show loading in
 * @param {string} message - Optional loading message
 * @returns {HTMLElement} Loading element that was created
 */
export function showLoading(container, message = 'Loading...') {
    const loadingElement = createElement('div', {
        className: 'loading-indicator',
        'aria-label': message,
        role: 'status'
    }, [
        createElement('div', { className: 'loading-spinner' }),
        createElement('p', { className: 'loading-text' }, message)
    ]);
    
    container.appendChild(loadingElement);
    return loadingElement;
}

/**
 * Removes a loading indicator
 * @param {HTMLElement} loadingElement - Loading element to remove
 */
export function hideLoading(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

/**
 * Scroll to element with smooth behavior
 * @param {HTMLElement} element - Element to scroll to
 * @param {number} offset - Offset from top (e.g., for fixed header)
 */
export function scrollToElement(element, offset = 0) {
    if (element) {
        const rect = element.getBoundingClientRect();
        const top = rect.top + window.pageYOffset - offset;
        
        window.scrollTo({
            top,
            behavior: config.ui.scrollBehavior
        });
    }
}

/**
 * Scroll to top of page
 */
export function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: config.ui.scrollBehavior
    });
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('info', 'success', 'error')
 * @param {number} duration - Display duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = createElement('div', {
        className: `toast-notification toast-${type}`,
        role: 'alert',
        'aria-live': 'polite'
    }, message);
    
    // Add to body
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('toast-visible');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300); // Transition duration
    }, duration);
    
    return toast;
}

/**
 * Format a percentage score with appropriate icons
 * @param {number} score - Score value (0-100)
 * @returns {string} Formatted HTML for score display
 */
export function formatScore(score) {
    let icon, colorClass;
    
    if (score >= 90) {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        colorClass = 'score-excellent';
    } else if (score >= 70) {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
        colorClass = 'score-good';
    } else if (score >= 50) {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
        colorClass = 'score-average';
    } else {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
        colorClass = 'score-needs-improvement';
    }
    
    return `<span class="score-display ${colorClass}">${icon} ${score}%</span>`;
}

/**
 * Create a module card element
 * @param {Object} module - Module data
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Module card element
 */
export function createModuleCard(module, onClick) {
    return createElement('div', {
        className: 'module-card',
        role: 'listitem',
        tabIndex: 0,
        'aria-label': `Module: ${module.title}`,
        onClick: onClick,
        onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            }
        }
    }, [
        createElement('h3', { className: 'module-title' }, module.title),
        createElement('p', { className: 'module-desc' }, module.description)
    ]);
}

/**
 * Create a method button element
 * @param {string} method - Method name
 * @param {Object} methodInfo - Method information
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Method button element
 */
export function createMethodButton(method, methodInfo, onClick) {
    // Format method name for display
    let methodName = method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' ');
    if (method === 'true-false') {
        methodName = 'True or False';
    }
    
    return createElement('button', {
        className: 'method-button',
        id: `${method}-button`,
        'aria-label': `Start ${methodName} study method`,
        onClick: onClick
    }, [
        createElement('div', { 
            className: 'method-icon',
            innerHTML: methodInfo.icon
        }),
        createElement('div', { className: 'method-content' }, [
            createElement('div', { className: 'method-title' }, methodName),
            createElement('div', { className: 'method-desc' }, methodInfo.description)
        ])
    ]);
}

// Export all UI utilities
export default {
    createElement,
    showElement,
    hideElement,
    animateElement,
    showLoading,
    hideLoading,
    scrollToElement,
    scrollToTop,
    showToast,
    formatScore,
    createModuleCard,
    createMethodButton
};