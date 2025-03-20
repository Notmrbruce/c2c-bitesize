/**
 * Application Controller
 * Integrates all components and provides the main application flow
 */

import state from './state-manager.js';
import viewManager from './view-manager.js';
import { loadModulesList, loadModule } from './enhanced-module-loader.js';
import { initializeStudyMethod, getAvailableMethods } from './study-method-initializer.js';
import { showToast, createElement } from './ui-utils.js';

// DOM elements
let modulesList;
let methodButtons;
let selectedModuleTitle;
let breadcrumbModule;
let mobileBreadcrumb;

// Current module data
let currentModuleData = null;

/**
 * Initialize the application
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export async function initApp() {
    console.log('[AppController] Initializing application');
    
    try {
        // Initialize view manager
        if (!viewManager.initViewManager()) {
            console.error('[AppController] View manager initialization failed');
            return false;
        }
        
        // Get DOM elements
        modulesList = document.getElementById('modules-list');
        methodButtons = document.getElementById('method-buttons');
        selectedModuleTitle = document.getElementById('selected-module-title');
        breadcrumbModule = document.getElementById('breadcrumb-module');
        mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
        
        // Check if required elements exist
        const elementsFound = !!modulesList && !!methodButtons && !!selectedModuleTitle;
        
        if (!elementsFound) {
            console.error('[AppController] Could not find all required DOM elements');
            return false;
        }
        
        // Set up event listeners for navigation
        setupNavigationListeners();
        
        // Subscribe to state changes
        state.subscribe('navigation', handleNavigationChange);
        
        // Determine current page and initialize accordingly
        const currentPath = window.location.pathname;
        
        if (currentPath.endsWith('modules.html')) {
            // Load modules on the modules page
            await loadModulesContent();
            state.navigateTo('modules');
        } else if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
            // Show home content on the index page
            state.navigateTo('home');
        }
        
        console.log('[AppController] Application initialized successfully');
        return true;
    } catch (error) {
        console.error('[AppController] Error during application initialization:', error);
        showToast('Failed to initialize the application. Please refresh the page.', 'error');
        return false;
    }
}

/**
 * Set up event listeners for navigation elements
 */
function setupNavigationListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const page = this.getAttribute('data-page');
            
            // If navigating within the same page, use client-side routing
            if (window.location.pathname.includes(page) || 
                (page === 'home' && (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')))) {
                e.preventDefault();
                state.navigateTo(page);
            }
            // Otherwise, let the browser handle the navigation
        });
    });
    
    // Back to methods buttons
    document.querySelectorAll('.back-to-methods').forEach(button => {
        button.addEventListener('click', () => {
            if (currentModuleData) {
                state.navigateTo('methods', { module: currentModuleData });
            } else {
                state.navigateTo('modules');
            }
        });
    });
}

/**
 * Handle navigation state changes
 * @param {Object} navigation - Navigation state from state manager
 */
function handleNavigationChange(navigation) {
    console.log('[AppController] Navigation change:', navigation);
    
    const { view, params } = navigation;
    
    // Update UI based on the navigation state
    switch (view) {
        case 'home':
            viewManager.showView('modules');
            updateActiveNavLink('home');
            break;
            
        case 'modules':
            viewManager.showView('modules');
            updateActiveNavLink('modules');
            break;
            
        case 'methods':
            if (params && params.module) {
                handleMethodsView(params.module);
            } else {
                viewManager.showView('modules');
            }
            break;
            
        case 'content':
            if (params && params.module && params.method) {
                handleContentView(params.module, params.method);
            } else {
                viewManager.showView('modules');
            }
            break;
            
        default:
            viewManager.showView('modules');
            break;
    }
}

/**
 * Update active navigation link
 * @param {string} view - Current view
 */
function updateActiveNavLink(view) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
    
    // Add active class to links matching the current view
    document.querySelectorAll(`.nav-link[data-page="${view}"]`).forEach(link => {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
    });
    
    // Update breadcrumb visibility
    const breadcrumbItem = document.getElementById('breadcrumb-item');
    
    if (breadcrumbItem) {
        if (view === 'methods' || view === 'content') {
            breadcrumbItem.style.display = 'block';
        } else {
            breadcrumbItem.style.display = 'none';
        }
    }
    
    if (mobileBreadcrumb) {
        if (view === 'methods' || view === 'content') {
            mobileBreadcrumb.style.display = 'block';
        } else {
            mobileBreadcrumb.style.display = 'none';
        }
    }
}

/**
 * Load and display the list of available modules
 * @returns {Promise<boolean>} - Whether modules were loaded successfully
 */
export async function loadModulesContent() {
    try {
        console.log('[AppController] Loading modules content');
        
        if (!modulesList) {
            console.error('[AppController] Modules list container not found');
            return false;
        }
        
        // Show loading indicator
        modulesList.innerHTML = '<div class="loading-indicator">Loading modules...</div>';
        
        // Load modules data
        const modules = await loadModulesList();
        
        // Clear loading indicator
        modulesList.innerHTML = '';
        
        // Display modules
        if (modules && modules.length > 0) {
            modules.forEach((module, index) => {
                const moduleCard = createElement('div', {
                    className: 'module-card',
                    role: 'listitem',
                    tabIndex: '0',
                    'aria-label': `Module: ${module.title}`
                }, [
                    createElement('h3', { className: 'module-title' }, module.title),
                    createElement('p', { className: 'module-desc' }, module.description)
                ]);
                
                // Add click handler
                moduleCard.addEventListener('click', () => navigateToModule(module.id));
                
                // Add keyboard handler
                moduleCard.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToModule(module.id);
                    }
                });
                
                modulesList.appendChild(moduleCard);
                
                // Add animation with delay
                setTimeout(() => {
                    moduleCard.classList.add('fade-in');
                }, index * 100);
            });
            
            console.log('[AppController] Modules loaded successfully');
            return true;
        } else {
            modulesList.innerHTML = '<p>No modules available.</p>';
            return false;
        }
    } catch (error) {
        console.error('[AppController] Error loading modules:', error);
        
        if (modulesList) {
            modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
        }
        
        return false;
    }
}

/**
 * Navigate to a module by ID
 * @param {string} moduleId - Module ID to navigate to
 */
export async function navigateToModule(moduleId) {
    try {
        console.log(`[AppController] Navigating to module: ${moduleId}`);
        
        // Load module data
        const moduleData = await loadModule(moduleId);
        
        // Store current module data
        currentModuleData = moduleData;
        
        // Navigate to methods view
        state.navigateTo('methods', { module: moduleData });
    } catch (error) {
        console.error(`[AppController] Error navigating to module ${moduleId}:`, error);
        showToast(`Error loading module: ${error.message}`, 'error');
    }
}

/**
 * Handle displaying the methods view for a module
 * @param {Object} moduleData - Module data
 */
function handleMethodsView(moduleData) {
    console.log(`[AppController] Showing methods view for module: ${moduleData.id}`);
    
    // Update current module data
    currentModuleData = moduleData;
    
    // Update title
    if (selectedModuleTitle) {
        selectedModuleTitle.textContent = moduleData.title.toUpperCase();
    }
    
    // Update breadcrumb
    if (breadcrumbModule) {
        breadcrumbModule.textContent = moduleData.title;
        breadcrumbModule.href = '#';
        
        // Add click handler
        breadcrumbModule.addEventListener('click', (e) => {
            e.preventDefault();
            state.navigateTo('methods', { module: moduleData });
        });
    }
    
    if (mobileBreadcrumb) {
        mobileBreadcrumb.textContent = moduleData.title;
        mobileBreadcrumb.href = '#';
        
        // Add click handler
        mobileBreadcrumb.addEventListener('click', (e) => {
            e.preventDefault();
            state.navigateTo('methods', { module: moduleData });
        });
    }
    
    // Create method buttons
    createMethodButtons(moduleData);
    
    // Show methods view
    viewManager.showView('methods');
    
    // Update active nav
    updateActiveNavLink('methods');
}

/**
 * Create method buttons for a module
 * @param {Object} moduleData - Module data
 */
function createMethodButtons(moduleData) {
    if (!methodButtons) return;
    
    console.log(`[AppController] Creating method buttons for module: ${moduleData.id}`);
    
    // Clear container
    methodButtons.innerHTML = '';
    
    // Get available methods for this module
    const availableMethods = getAvailableMethods(moduleData);
    
    // Create buttons for each method
    availableMethods.forEach((method, index) => {
        const button = createElement('button', {
            className: 'method-button',
            'aria-label': `Start ${method.name} study method`
        }, [
            createElement('div', { 
                className: 'method-icon',
                innerHTML: method.icon
            }),
            createElement('div', { className: 'method-content' }, [
                createElement('div', { className: 'method-title' }, method.name),
                createElement('div', { className: 'method-desc' }, `Study using ${method.name.toLowerCase()} to test your knowledge.`)
            ])
        ]);
        
        // Add click handler
        button.addEventListener('click', () => {
            state.navigateTo('content', { module: moduleData, method: method.id });
        });
        
        methodButtons.appendChild(button);
        
        // Add animation with delay
        setTimeout(() => {
            button.classList.add('fade-in');
        }, index * 100);
    });
    
    // Add back button
    const backContainer = createElement('div', { className: 'text-center mt-xl' });
    
    const backButton = createElement('button', {
        className: 'btn',
        'aria-label': 'Back to modules'
    }, [
        createElement('span', { 
            className: 'btn-icon',
            innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
        </svg>`
        }),
        'Back to Modules'
    ]);
    
    backButton.addEventListener('click', () => {
        state.navigateTo('modules');
    });
    
    backContainer.appendChild(backButton);
    methodButtons.appendChild(backContainer);
}

/**
 * Handle displaying the content view for a study method
 * @param {Object} moduleData - Module data
 * @param {string} method - Study method name
 */
async function handleContentView(moduleData, method) {
    console.log(`[AppController] Showing content view for method: ${method}`);
    
    // Update current module data
    currentModuleData = moduleData;
    
    // Get content view container
    const contentView = viewManager.getViewElement('content');
    
    if (!contentView) {
        console.error('[AppController] Content view container not found');
        return;
    }
    
    // Show content view
    viewManager.showView('content');
    
    // Initialize the study method
    await initializeStudyMethod(method, moduleData, contentView);
    
    // Update active nav
    updateActiveNavLink('content');
}

export default {
    initApp,
    loadModulesContent,
    navigateToModule
};
