/**
 * Study Method Initializer
 * Handles loading and initializing study methods with error handling
 */

import pathResolver from './path-resolver.js';
import { showToast } from './ui-utils.js';
import state from './state-manager.js';

// Keep track of loaded method modules
const loadedMethods = new Map();

/**
 * Load a study method module dynamically
 * @param {string} methodName - Name of the study method
 * @returns {Promise<Object>} - The loaded study method module
 */
async function loadMethodModule(methodName) {
    try {
        // Check if already loaded
        if (loadedMethods.has(methodName)) {
            return loadedMethods.get(methodName);
        }
        
        // Try to access via global scope first (if non-module script loaded it)
        if (window[methodName] && typeof window[methodName].init === 'function') {
            console.log(`[StudyMethodInitializer] Using globally loaded ${methodName} module`);
            return window[methodName];
        }
        
        // Get the correct path for dynamic import
        const methodPath = pathResolver.getStudyMethodPath(methodName);
        console.log(`[StudyMethodInitializer] Dynamically importing ${methodName} from ${methodPath}`);
        
        // Use dynamic import with the full path
        const moduleUrl = pathResolver.getImportPath(`js/study-methods/${methodName}.js`);
        const module = await import(moduleUrl);
        
        // Cache the loaded module
        loadedMethods.set(methodName, module);
        
        return module;
    } catch (error) {
        console.error(`[StudyMethodInitializer] Error loading ${methodName} module:`, error);
        throw new Error(`Failed to load study method ${methodName}: ${error.message}`);
    }
}

/**
 * Initialize a study method with the given module data
 * @param {string} methodName - Name of the study method to initialize
 * @param {Object} moduleData - The module data to use
 * @param {HTMLElement} container - The container element to render into
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeStudyMethod(methodName, moduleData, container) {
    console.log(`[StudyMethodInitializer] Initializing ${methodName} for module ${moduleData.id}`);
    
    // Ensure container is visible
    container.classList.remove('hidden');
    
    // Show loading state
    container.innerHTML = `
        <div class="content-header">
            <h2 class="content-title">${moduleData.title} - ${methodName.charAt(0).toUpperCase() + methodName.slice(1).replace(/-/g, ' ')}</h2>
        </div>
        <div class="content-container">
            <p>Loading study content...</p>
            <div class="loading-indicator">Please wait while we prepare your learning experience.</div>
        </div>
    `;
    
    try {
        // Load the method module
        const methodModule = await loadMethodModule(methodName);
        
        // Determine the initialization function
        let initFunction;
        
        if (methodName === 'flashcards' && methodModule.initFlashcards) {
            initFunction = methodModule.initFlashcards;
        } else if (methodName === 'quiz' && methodModule.initQuiz) {
            initFunction = methodModule.initQuiz;
        } else if ((methodName === 'time-trial' || methodName === 'match') && methodModule.initTimeTrial) {
            initFunction = methodModule.initTimeTrial;
        } else if (methodName === 'true-false' && methodModule.initTrueFalse) {
            initFunction = methodModule.initTrueFalse;
        } else if (methodModule.default && typeof methodModule.default.init === 'function') {
            initFunction = methodModule.default.init;
        } else if (typeof methodModule.init === 'function') {
            initFunction = methodModule.init;
        } else {
            throw new Error(`No initialization function found for ${methodName}`);
        }
        
        // Initialize the study method
        await initFunction(moduleData, container);
        
        // Update state with current method (for tracking)
        state.set('currentMethod', methodName);
        
        return true;
    } catch (error) {
        console.error(`[StudyMethodInitializer] Error initializing ${methodName}:`, error);
        
        // Show error message
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Error</h2>
            </div>
            <div class="content-container">
                <p>Sorry, we encountered an error loading this study method.</p>
                <p class="error-message">${error.message}</p>
                <button id="error-back-btn" class="btn btn-primary">Back to Methods</button>
            </div>
        `;
        
        // Add event listener to the back button
        document.getElementById('error-back-btn')?.addEventListener('click', () => {
            state.navigateTo('methods', { module: moduleData });
        });
        
        // Show toast notification
        showToast(`Error loading ${methodName}: ${error.message}`, 'error');
        
        return false;
    }
}

/**
 * Checks if a particular study method is available for the given module
 * @param {string} methodName - The study method to check
 * @param {Object} moduleData - The module data
 * @returns {boolean} - Whether the method is available
 */
export function isMethodAvailable(methodName, moduleData) {
    // Check if the method is in the module's methods array
    if (!moduleData.methods || !Array.isArray(moduleData.methods)) {
        return false;
    }
    
    return moduleData.methods.includes(methodName);
}

/**
 * Get information about available methods for a module
 * @param {Object} moduleData - The module data
 * @returns {Array} - Array of available method information
 */
export function getAvailableMethods(moduleData) {
    const methodTypes = [
        { id: 'flashcards', name: 'Flashcards', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8"/><path d="M8 12h8"/></svg>' },
        { id: 'quiz', name: 'Quiz', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
        { id: 'time-trial', name: 'Time Trial', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
        { id: 'true-false', name: 'True or False', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' }
    ];
    
    // Filter available methods based on module data
    return methodTypes.filter(method => isMethodAvailable(method.id, moduleData));
}

export default {
    initializeStudyMethod,
    isMethodAvailable,
    getAvailableMethods
};
