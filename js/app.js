/**
 * Main application script for C2C Bitesize Learning Platform
 * Handles app initialization, navigation, and ties all modules together
 */

// Import modules
import config from './config.js';
import state from './state-manager.js';
import { loadModulesList, loadModule } from './module-loader.js';
import * as ui from './ui-utils.js';

// Import study methods
import flashcards from './study-methods/flashcards.js';
import quiz from './study-methods/quiz.js';
import timeTrial from './study-methods/time-trial.js';
import trueFalse from './study-methods/true-false.js';

// DOM Elements
let modulesView;
let methodsView;
let contentView;
let modulesList;
let selectedModuleTitle;
let methodButtons;
let breadcrumbModule;
let mobileBreadcrumb;
let themeToggle;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the application
 */
async function init() {
    // Get DOM elements
    modulesView = document.getElementById('modules-view');
    methodsView = document.getElementById('methods-view');
    contentView = document.getElementById('content-view');
    modulesList = document.getElementById('modules-list');
    selectedModuleTitle = document.getElementById('selected-module-title');
    methodButtons = document.getElementById('method-buttons');
    breadcrumbModule = document.getElementById('breadcrumb-module');
    mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
    themeToggle = document.getElementById('theme-toggle');
    
    // Setup event listeners
    setupEventListeners();
    
    // Subscribe to state changes
    state.subscribe('navigation', handleNavigation);
    
    // Load modules
    try {
        await loadModules();
        
        // Initially show only the modules view
        state.navigateTo('modules');
        
        // Add entrance animations
        animateElements();
    } catch (error) {
        console.error('Error during initialization:', error);
        ui.showToast('There was an error initializing the application. Please try again.', 'error');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Home navigation
    document.querySelectorAll('.nav-links a')[0].addEventListener('click', (e) => {
        e.preventDefault();
        state.navigateTo('modules');
    });
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            state.toggleTheme();
            updateThemeIcon();
        });
        
        // Set initial theme icon
        updateThemeIcon();
    }
    
    // Window scroll event for floating nav
    window.addEventListener('scroll', handleFloatingNavScroll);
}

/**
 * Handle navigation state changes
 * @param {Object} navigation - New navigation state
 */
function handleNavigation(navigation) {
    // Get navigation from state if not provided (safeguard)
    const navData = navigation || state.get('navigation') || { view: 'modules', params: {} };
    const { view, params } = navData;
    
    // Hide all views
    ui.hideElement(modulesView);
    ui.hideElement(methodsView);
    ui.hideElement(contentView);
    
    // Show the appropriate view
    switch (view) {
        case 'modules':
            ui.showElement(modulesView);
            break;
            
        case 'methods':
            if (params && params.module) {
                showMethodsView(params.module);
            } else {
                // Fallback to modules view if no module specified
                ui.showElement(modulesView);
            }
            break;
            
        case 'content':
            if (params && params.module && params.method) {
                loadStudyMethod(params.module, params.method);
            } else {
                // Fallback to modules view if missing params
                ui.showElement(modulesView);
            }
            break;
            
        default:
            // Default to modules view
            ui.showElement(modulesView);
    }
    
    // Update active navigation link
    updateActiveNavLink(view);
    
    // Scroll to top
    ui.scrollToTop();
}

/**
 * Update active navigation link
 * @param {string} view - Current view
 */
function updateActiveNavLink(view) {
    document.querySelectorAll('.nav-links a, .mobile-dropdown a').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
    
    // Set home link as active for modules view
    if (view === 'modules') {
        document.querySelectorAll('.nav-links a')[0].classList.add('active');
        document.querySelectorAll('.nav-links a')[0].setAttribute('aria-current', 'page');
        document.querySelectorAll('.mobile-dropdown a')[0].classList.add('active');
        document.querySelectorAll('.mobile-dropdown a')[0].setAttribute('aria-current', 'page');
        
        // Hide module breadcrumb
        document.getElementById('breadcrumb-item').style.display = 'none';
        mobileBreadcrumb.style.display = 'none';
    } else {
        // Show module breadcrumb for other views
        document.getElementById('breadcrumb-item').style.display = 'block';
        mobileBreadcrumb.style.display = 'block';
    }
}

/**
 * Handle floating nav scroll behavior
 */
function handleFloatingNavScroll() {
    const navbarWrapper = document.getElementById('navbar-wrapper');
    const floatingNav = document.getElementById('floating-nav');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const logoContainer = document.getElementById('logo-container');
    
    const st = window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingDown = st > state.get('ui.lastScrollTop');
    
    state.set('ui.lastScrollTop', st <= 0 ? 0 : st);
    
    // When scrolling down past threshold, hide elements
    if (st > config.ui.thresholds.scrollHide) {
        logoContainer.classList.add('hidden-logo');
        
        // Only hide navbar when scrolling down
        if (isScrollingDown) {
            navbarWrapper.classList.add('hidden-nav');
            mobileMenuButton.classList.add('hidden-nav');
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
}

/**
 * Add entrance animations to elements
 */
function animateElements() {
    // Add fade-in to elements with data-animate attribute
    const animateElements = document.querySelectorAll('[data-animate]');
    animateElements.forEach((el, index) => {
        // Stagger the animations
        setTimeout(() => {
            el.classList.add('fade-in');
        }, index * 100);
    });
}

/**
 * Update theme toggle icon based on current theme
 */
function updateThemeIcon() {
    if (!themeToggle) return;
    
    if (state.get('ui.theme') === 'light') {
        themeToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
        themeToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 20V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 4.93L6.34 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.66 17.66L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.34 17.66L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.07 4.93L17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
}

/**
 * Load all available modules
 */
async function loadModules() {
    // Show loading indicator
    const loadingIndicator = ui.showLoading(modulesList);
    
    try {
        const modules = await loadModulesList();
        
        // Clear container
        modulesList.innerHTML = '';
        
        // Create module cards
        modules.forEach((module, index) => {
            const moduleCard = ui.createModuleCard(module, () => {
                loadModule(module.id)
                    .then(moduleData => {
                        state.navigateTo('methods', { module: moduleData });
                    })
                    .catch(error => {
                        console.error(`Error loading module ${module.id}:`, error);
                        ui.showToast('Error loading module. Please try again.', 'error');
                    });
            });
            
            // Add staggered animation
            ui.animateElement(moduleCard, 'fade-in', index * 100);
            
            modulesList.appendChild(moduleCard);
        });
    } catch (error) {
        console.error('Error loading modules:', error);
        modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
    } finally {
        // Remove loading indicator
        ui.hideLoading(loadingIndicator);
    }
}

/**
 * Show the methods view for a specific module
 * @param {Object} moduleData - The module data
 */
function showMethodsView(moduleData) {
    // Update titles
    selectedModuleTitle.textContent = moduleData.title;
    
    // Update breadcrumb
    breadcrumbModule.textContent = moduleData.title;
    breadcrumbModule.href = '#';
    mobileBreadcrumb.textContent = moduleData.title;
    mobileBreadcrumb.href = '#';
    
    breadcrumbModule.addEventListener('click', (e) => {
        e.preventDefault();
        state.navigateTo('methods', { module: moduleData });
    });
    
    mobileBreadcrumb.addEventListener('click', (e) => {
        e.preventDefault();
        state.navigateTo('methods', { module: moduleData });
    });
    
    // Create method buttons
    createMethodButtons(moduleData);
    
    // Show methods view
    ui.showElement(methodsView);
    
    // Update method description
    const methodDescriptionElement = document.getElementById('method-description');
    if (methodDescriptionElement) {
        methodDescriptionElement.textContent = 'Select a study method to begin';
    }
}

/**
 * Create method buttons for a module
 * @param {Object} moduleData - The module data
 */
function createMethodButtons(moduleData) {
    // Clear container
    methodButtons.innerHTML = '';
    
    // Create a button for each available method
    moduleData.methods.forEach((method, index) => {
        // Get method info from config
        const methodInfo = config.methods[method] || {
            description: `Learn with ${method}`,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
        };
        
        // Create the button
        const button = ui.createMethodButton(method, methodInfo, () => {
            state.navigateTo('content', { module: moduleData, method });
        });
        
        // Add staggered animation
        ui.animateElement(button, 'fade-in', index * 100);
        
        methodButtons.appendChild(button);
    });
}

/**
 * Load a specific study method
 * @param {Object} moduleData - The module data
 * @param {string} method - The study method to load
 */
function loadStudyMethod(moduleData, method) {
    // Clear previous content
    contentView.innerHTML = '';
    
    // Show the content view
    ui.showElement(contentView);
    contentView.classList.add('slide-up');
    
    // Remove the animation class after animation completes
    setTimeout(() => {
        contentView.classList.remove('slide-up');
    }, 500);
    
    // Load the appropriate study method
    switch (method) {
        case 'flashcards':
            flashcards.initFlashcards(moduleData, contentView);
            break;
            
        case 'quiz':
            quiz.initQuiz(moduleData, contentView);
            break;
            
        case 'time-trial':
        case 'match': // Handle legacy 'match' method as time-trial
            timeTrial.initTimeTrial(moduleData, contentView);
            break;
            
        case 'true-false':
            trueFalse.initTrueFalse(moduleData, contentView);
            break;
            
        default:
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleData.title} - ${method}</h2>
                </div>
                <div class="content-container">
                    <p>Study method "${method}" is not implemented yet.</p>
                    <button id="back-to-methods" class="btn">Back to Methods</button>
                </div>
            `;
            
            document.getElementById('back-to-methods').addEventListener('click', () => {
                state.navigateTo('methods', { module: moduleData });
            });
    }
}

// Export for potential reuse in extensions
export {
    init,
    loadModules,
    showMethodsView,
    loadStudyMethod
};