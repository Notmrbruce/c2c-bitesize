/**
 * Enhanced Module Loader
 * Provides robust module loading with consistent error handling and caching
 */

import pathResolver from './path-resolver.js';
import { normalizeModuleData } from './module-normalizer.js';
import { showToast } from './ui-utils.js';

// Module cache to prevent redundant network requests
const moduleCache = new Map();

/**
 * Debug logging helper
 * @param {string} message - Message to log
 * @param {*} data - Optional data to log
 */
function debugLog(message, data) {
    console.log(`[EnhancedModuleLoader] ${message}`, data || '');
}

/**
 * Load the list of available modules
 * @returns {Promise<Array>} Array of module metadata
 */
export async function loadModulesList() {
    try {
        debugLog('Loading modules list...');
        
        // Check cache first
        if (moduleCache.has('index')) {
            debugLog('Using cached module index');
            return moduleCache.get('index');
        }
        
        // Get path using resolver
        const modulesPath = pathResolver.getModulesIndexPath();
        debugLog(`Fetching modules index from: ${modulesPath}`);
        
        // Try to fetch the modules list
        const response = await fetch(modulesPath);
        
        if (!response.ok) {
            console.error(`[EnhancedModuleLoader] Failed to load modules index: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to load modules index: ${response.status} ${response.statusText}`);
        }
        
        // Parse the response
        const data = await response.json();
        debugLog(`Successfully loaded module index with ${data.length} modules`);
        
        // Cache the result
        moduleCache.set('index', data);
        
        return data;
    } catch (error) {
        console.error('[EnhancedModuleLoader] Error loading modules list:', error);
        showToast('Failed to load modules. Please try again later.', 'error');
        
        // Return empty array as fallback
        return [];
    }
}

/**
 * Load a specific module by ID
 * @param {string} moduleId - The ID of the module to load
 * @returns {Promise<Object>} Normalized module data
 */
export async function loadModule(moduleId) {
    if (!moduleId) {
        console.error('[EnhancedModuleLoader] No moduleId provided');
        throw new Error('Module ID is required');
    }
    
    try {
        debugLog(`Loading module: ${moduleId}`);
        
        // Check cache first
        if (moduleCache.has(moduleId)) {
            debugLog(`Using cached module: ${moduleId}`);
            const cachedModule = moduleCache.get(moduleId);
            return normalizeModuleData(cachedModule);
        }
        
        // Get path using resolver
        const modulePath = pathResolver.getModulePath(moduleId);
        debugLog(`Fetching module from: ${modulePath}`);
        
        // Fetch the module data
        const response = await fetch(modulePath);
        
        if (!response.ok) {
            console.error(`[EnhancedModuleLoader] Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }
        
        // Parse the response
        const data = await response.json();
        debugLog(`Successfully loaded module: ${moduleId}`);
        
        // Normalize the module data to ensure consistent structure
        const normalizedData = normalizeModuleData(data);
        
        // Cache the normalized result
        moduleCache.set(moduleId, normalizedData);
        
        return normalizedData;
    } catch (error) {
        console.error(`[EnhancedModuleLoader] Error loading module '${moduleId}':`, error);
        
        // Try to load from a predefined list of modules if available
        debugLog(`Attempting to use local data for module '${moduleId}'`);
        
        // Check if we have sample modules loaded
        if (window.sampleModules && window.sampleModules[moduleId]) {
            debugLog(`Found local data for module '${moduleId}'`);
            const localData = window.sampleModules[moduleId];
            const normalizedData = normalizeModuleData(localData);
            moduleCache.set(moduleId, normalizedData);
            return normalizedData;
        }
        
        // Create a basic placeholder module as last resort
        debugLog(`Creating placeholder module for '${moduleId}'`);
        const placeholderModule = normalizeModuleData({
            id: moduleId,
            title: moduleId.charAt(0).toUpperCase() + moduleId.slice(1).replace(/-/g, ' '),
            description: 'This is a placeholder module. The actual module data could not be loaded.',
            methods: ['flashcards', 'quiz', 'time-trial', 'true-false'],
            content: {}
        });
        
        // Cache the placeholder
        moduleCache.set(moduleId, placeholderModule);
        
        // Show error toast, but still return the placeholder
        showToast(`Could not load module "${placeholderModule.title}". Using placeholder content.`, 'warning');
        
        return placeholderModule;
    }
}

/**
 * Clear the module cache to fetch fresh data
 * @param {string} [moduleId] - Specific module ID to clear from cache, or all if not provided
 */
export function clearModuleCache(moduleId = null) {
    if (moduleId) {
        moduleCache.delete(moduleId);
        debugLog(`Cleared cache for module: ${moduleId}`);
    } else {
        moduleCache.clear();
        debugLog('Cleared entire module cache');
    }
}

export default {
    loadModulesList,
    loadModule,
    clearModuleCache
};
