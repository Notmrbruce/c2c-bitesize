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
        
        // Check cache first
        if (moduleCache.has('index')) {
            debugLog('Using cached module index');
            return moduleCache.get('index');
        }
        
        const response = await fetch(`${config.api.modulesList}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load modules index: ${response.status} ${response.statusText}`);
        }
        
        // First get as text to help with debugging
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            throw new Error('Empty response when loading modules index');
        }
        
        try {
            const data = JSON.parse(text);
            debugLog(`Successfully loaded module index with ${data.length} modules`);
            
            // Cache the result
            moduleCache.set('index', data);
            
            return data;
        } catch (parseError) {
            console.error('JSON parse error in modules index:', parseError);
            console.error('First 100 chars of response:', text.substring(0, 100));
            throw new Error(`Invalid JSON in modules index: ${parseError.message}`);
        }
    } catch (error) {
        console.error('Error loading modules list:', error);
        showToast('Failed to load modules. Please check console for details.', 'error');
        
        // Return empty array as fallback
        return [];
    }
}

/**
 * Load a specific module by ID
 * @param {string} moduleId - The ID of the module to load
 * @returns {Promise<Object>} Module data
 */
export async function loadModule(moduleId) {
    if (!moduleId) {
        console.error('No moduleId provided to loadModule');
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
        
        const response = await fetch(moduleUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }
        
        // First get as text to help with debugging
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            throw new Error(`Empty response when loading module '${moduleId}'`);
        }
        
        debugLog(`Module '${moduleId}' text length: ${text.length}`);
        
        try {
            const data = JSON.parse(text);
            debugLog(`Successfully parsed module: ${moduleId}`);
            
            // Validate module structure
            try {
                validateModuleStructure(data);
                debugLog(`Module structure valid: ${moduleId}`);
            } catch (validationError) {
                console.error(`Invalid module structure for '${moduleId}':`, validationError);
                throw validationError;
            }
            
            // Cache the result
            moduleCache.set(moduleId, data);
            
            return data;
        } catch (parseError) {
            console.error(`JSON parse error in module '${moduleId}':`, parseError);
            console.error('First 100 chars of response:', text.substring(0, 100));
            throw new Error(`Invalid JSON in module '${moduleId}': ${parseError.message}`);
        }
    } catch (error) {
        console.error(`Error loading module '${moduleId}':`, error);
        
        // Try using XMLHttpRequest as fallback for fetch issues
        try {
            debugLog(`Trying XHR fallback for module: ${moduleId}`);
            const data = await loadModuleWithXHR(moduleId);
            moduleCache.set(moduleId, data);
            return data;
        } catch (xhrError) {
            console.error(`XHR fallback also failed for module '${moduleId}':`, xhrError);
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
        
        xhr.open('GET', moduleUrl);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    validateModuleStructure(data);
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
    const requiredFields = ['id', 'title', 'description', 'methods', 'content'];
    
    for (const field of requiredFields) {
        if (!module[field]) {
            throw new Error(`Invalid module structure: missing required field '${field}'`);
        }
    }
    
    // Check that module.methods is an array
    if (!Array.isArray(module.methods)) {
        throw new Error(`Invalid module structure: 'methods' must be an array`);
    }
    
    // Check that module.content is an object
    if (typeof module.content !== 'object' || module.content === null) {
        throw new Error(`Invalid module structure: 'content' must be an object`);
    }
    
    // Check that each method listed has corresponding content
    for (const method of module.methods) {
        if (!module.content[method]) {
            throw new Error(`Invalid module structure: method '${method}' listed but no content provided`);
        }
    }
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
                console.error(`Error preloading module '${module.id}':`, error);
                return null; // Continue with other modules even if one fails
            })
        );
        
        await Promise.all(loadPromises);
        
        debugLog(`Preloaded ${moduleCache.size} modules successfully`);
        return moduleCache;
    } catch (error) {
        console.error('Error preloading modules:', error);
        throw error;
    }
}

export default {
    loadModulesList,
    loadModule,
    clearModuleCache,
    preloadAllModules
};