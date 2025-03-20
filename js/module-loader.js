/**
 * Module loader for C2C Bitesize
 * Handles loading module data from JSON files with improved error handling and caching
 */

import config from './config.js';
import { showToast } from './ui-utils.js';

// Module cache to prevent redundant network requests
const moduleCache = new Map();

/**
 * Debug logging helper
 * @param {string} message - Message to log
 * @param {*} data - Optional data to log
 */
function debugLog(message, data) {
    if (config.debug) {
        console.log(`[ModuleLoader] ${message}`, data || '');
    }
}

/**
 * Load the list of available modules
 * @returns {Promise<Array>} Array of module metadata
 */
export async function loadModulesList() {
    try {
        debugLog('Loading modules list...');
        console.log('[ModuleLoader] Attempt to load modules from:', config.api.modulesList);
        
        // Check cache first
        if (moduleCache.has('index')) {
            debugLog('Using cached module index');
            return moduleCache.get('index');
        }
        
        // Check if the path is correct
        console.log('[ModuleLoader] Current page path:', window.location.pathname);
        
        // Determine the relative path based on the current page
        let moduleListPath = config.api.modulesList;
        if (window.location.pathname.includes('/modules.html')) {
            // We're in the root directory
            debugLog('On modules.html page, using the original path');
        } else if (window.location.pathname.endsWith('/')) {
            // We're in the root directory
            debugLog('On root page, using the original path');
        }
        
        console.log('[ModuleLoader] Using path:', moduleListPath);
        
        // Try to fetch the modules list
        const response = await fetch(moduleListPath);
        
        console.log('[ModuleLoader] Fetch response status:', response.status);
        
        if (!response.ok) {
            console.error(`[ModuleLoader] Failed to load modules index: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to load modules index: ${response.status} ${response.statusText}`);
        }
        
        // First get as text to help with debugging
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            console.error('[ModuleLoader] Empty response when loading modules index');
            throw new Error('Empty response when loading modules index');
        }
        
        debugLog(`Received text response (first 100 chars): ${text.substring(0, 100)}...`);
        
        try {
            const data = JSON.parse(text);
            debugLog(`Successfully loaded module index with ${data.length} modules`);
            console.log(`[ModuleLoader] Loaded ${data.length} modules`);
            
            // Cache the result
            moduleCache.set('index', data);
            
            return data;
        } catch (parseError) {
            console.error('[ModuleLoader] JSON parse error in modules index:', parseError);
            console.error('[ModuleLoader] First 100 chars of response:', text.substring(0, 100));
            throw new Error(`Invalid JSON in modules index: ${parseError.message}`);
        }
    } catch (error) {
        console.error('[ModuleLoader] Error loading modules list:', error);
        
        // Try with XMLHttpRequest as a fallback
        try {
            console.log('[ModuleLoader] Trying XHR fallback for loading modules list');
            const modulesList = await loadModulesListWithXHR();
            console.log('[ModuleLoader] XHR fallback successful');
            return modulesList;
        } catch (xhrError) {
            console.error('[ModuleLoader] XHR fallback also failed:', xhrError);
            showToast('Failed to load modules. Please check console for details.', 'error');
            return [];
        }
    }
}

/**
 * Fallback method to load modules list using XMLHttpRequest
 * @returns {Promise<Array>} Array of module metadata
 */
function loadModulesListWithXHR() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        console.log('[ModuleLoader] XHR attempting to load from:', config.api.modulesList);
        
        xhr.open('GET', config.api.modulesList);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    console.log('[ModuleLoader] XHR successfully loaded modules list');
                    moduleCache.set('index', data);
                    resolve(data);
                } catch (error) {
                    reject(new Error(`Error parsing modules list: ${error.message}`));
                }
            } else {
                reject(new Error(`Failed to load modules list: ${xhr.status} ${xhr.statusText}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error when loading modules list'));
        };
        
        xhr.send();
    });
}

/**
 * Load a specific module by ID
 * @param {string} moduleId - The ID of the module to load
 * @returns {Promise<Object>} Module data
 */
export async function loadModule(moduleId) {
    if (!moduleId) {
        console.error('[ModuleLoader] No moduleId provided to loadModule');
        throw new Error('Module ID is required');
    }
    
    try {
        debugLog(`Loading module: ${moduleId}`);
        
        // Check cache first
        if (moduleCache.has(moduleId)) {
            debugLog(`Using cached module: ${moduleId}`);
            return moduleCache.get(moduleId);
        }
        
        const moduleUrl = `${config.api.modulePrefix}${moduleId}.json`;
        debugLog(`Fetching from URL: ${moduleUrl}`);
        console.log(`[ModuleLoader] Fetching module from URL: ${moduleUrl}`);
        
        const response = await fetch(moduleUrl);
        console.log(`[ModuleLoader] Fetch response status for ${moduleId}:`, response.status);
        
        if (!response.ok) {
            console.error(`[ModuleLoader] Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }
        
        // First get as text to help with debugging
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            console.error(`[ModuleLoader] Empty response when loading module '${moduleId}'`);
            throw new Error(`Empty response when loading module '${moduleId}'`);
        }
        
        debugLog(`Module '${moduleId}' text length: ${text.length}`);
        
        try {
            const data = JSON.parse(text);
            debugLog(`Successfully parsed module: ${moduleId}`);
            console.log(`[ModuleLoader] Successfully parsed module: ${moduleId}`);
            
            // Validate module structure
            try {
                validateModuleStructure(data);
                debugLog(`Module structure valid: ${moduleId}`);
            } catch (validationError) {
                console.error(`[ModuleLoader] Invalid module structure for '${moduleId}':`, validationError);
                throw validationError;
            }
            
            // Cache the result
            moduleCache.set(moduleId, data);
            
            return data;
        } catch (parseError) {
            console.error(`[ModuleLoader] JSON parse error in module '${moduleId}':`, parseError);
            console.error('[ModuleLoader] First 100 chars of response:', text.substring(0, 100));
            throw new Error(`Invalid JSON in module '${moduleId}': ${parseError.message}`);
        }
    } catch (error) {
        console.error(`[ModuleLoader] Error loading module '${moduleId}':`, error);
        
        // Try using XMLHttpRequest as fallback for fetch issues
        try {
            debugLog(`Trying XHR fallback for module: ${moduleId}`);
            console.log(`[ModuleLoader] Trying XHR fallback for module: ${moduleId}`);
            const data = await loadModuleWithXHR(moduleId);
            moduleCache.set(moduleId, data);
            return data;
        } catch (xhrError) {
            console.error(`[ModuleLoader] XHR fallback also failed for module '${moduleId}':`, xhrError);
            showToast(`Failed to load module. Please try again.`, 'error');
            throw error; // Throw the original error
        }
    }
}

/**
 * Fallback method to load module using XMLHttpRequest
 * @param {string} moduleId - The module ID to load
 * @returns {Promise<Object>} Module data
 */
function loadModuleWithXHR(moduleId) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const moduleUrl = `${config.api.modulePrefix}${moduleId}.json`;
        console.log(`[ModuleLoader] XHR loading from: ${moduleUrl}`);
        
        xhr.open('GET', moduleUrl);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    validateModuleStructure(data);
                    console.log(`[ModuleLoader] XHR successfully loaded module: ${moduleId}`);
                    resolve(data);
                } catch (error) {
                    reject(new Error(`Error processing module '${moduleId}': ${error.message}`));
                }
            } else {
                reject(new Error(`Failed to load module '${moduleId}': ${xhr.status} ${xhr.statusText}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error(`Network error when loading module '${moduleId}'`));
        };
        
        xhr.send();
    });
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

/**
 * Validate module data structure to ensure it has required properties
 * @param {Object} module - Module data object to validate
 * @throws {Error} If module structure is invalid
 */
function validateModuleStructure(module) {
    // Check for required fields
    const requiredFields = ['id', 'title', 'description'];
    
    for (const field of requiredFields) {
        if (!module[field]) {
            console.error(`[ModuleLoader] Module missing required field: ${field}`);
            throw new Error(`Invalid module structure: missing required field '${field}'`);
        }
    }
    
    // Check if methods field exists, if not, create an empty array
    if (!module.methods) {
        console.warn(`[ModuleLoader] Module ${module.id} has no methods defined, creating empty array`);
        module.methods = [];
    }
    
    // Check that module.methods is an array
    if (!Array.isArray(module.methods)) {
        console.error(`[ModuleLoader] Module ${module.id} has methods that is not an array`);
        throw new Error(`Invalid module structure: 'methods' must be an array`);
    }
    
    // Check that module.content exists, if not, create an empty object
    if (!module.content) {
        console.warn(`[ModuleLoader] Module ${module.id} has no content defined, creating empty object`);
        module.content = {};
    }
    
    // Check that module.content is an object
    if (typeof module.content !== 'object' || module.content === null) {
        console.error(`[ModuleLoader] Module ${module.id} has content that is not an object`);
        throw new Error(`Invalid module structure: 'content' must be an object`);
    }
    
    // Check that each method listed has corresponding content
    for (const method of module.methods) {
        if (!module.content[method]) {
            console.warn(`[ModuleLoader] Method ${method} listed in module ${module.id} but no content provided, creating empty array`);
            module.content[method] = [];
        }
    }
    
    console.log(`[ModuleLoader] Module ${module.id} validated successfully`);
}

/**
 * Pre-load all modules for faster access
 * @returns {Promise<Map>} Map of all loaded modules
 */
export async function preloadAllModules() {
    try {
        debugLog('Preloading all modules...');
        const modulesList = await loadModulesList();
        
        // Skip if no modules found
        if (!modulesList || !modulesList.length) {
            debugLog('No modules to preload');
            return moduleCache;
        }
        
        debugLog(`Starting preload of ${modulesList.length} modules`);
        
        const loadPromises = modulesList.map(module => 
            loadModule(module.id).catch(error => {
                console.error(`[ModuleLoader] Error preloading module '${module.id}':`, error);
                return null; // Continue with other modules even if one fails
            })
        );
        
        await Promise.all(loadPromises);
        
        debugLog(`Preloaded ${moduleCache.size} modules successfully`);
        return moduleCache;
    } catch (error) {
        console.error('[ModuleLoader] Error preloading modules:', error);
        throw error;
    }
}

export default {
    loadModulesList,
    loadModule,
    clearModuleCache,
    preloadAllModules
};
