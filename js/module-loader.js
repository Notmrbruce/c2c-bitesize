/**
 * Module loader for C2C Bitesize
 * Handles loading module data from JSON files with improved error handling and caching
 */

import config from './config.js';
import { showToast } from './ui-utils.js';

// Module cache to prevent redundant network requests
const moduleCache = new Map();

/**
 * Load the list of available modules
 * @returns {Promise<Array>} Array of module metadata
 */
export async function loadModulesList() {
    try {
        // Check cache first
        if (moduleCache.has('index')) {
            return moduleCache.get('index');
        }
        
        const response = await fetch(`${config.api.modulesList}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load modules index: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the result
        moduleCache.set('index', data);
        
        return data;
    } catch (error) {
        console.error('Error loading modules list:', error);
        showToast('Failed to load modules. Please try again later.', 'error');
        throw error;
    }
}

/**
 * Load a specific module by ID
 * @param {string} moduleId - The ID of the module to load
 * @returns {Promise<Object>} Module data
 */
export async function loadModule(moduleId) {
    try {
        // Check cache first
        if (moduleCache.has(moduleId)) {
            return moduleCache.get(moduleId);
        }
        
        const response = await fetch(`${config.api.modulePrefix}${moduleId}.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate module structure
        validateModuleStructure(data);
        
        // Cache the result
        moduleCache.set(moduleId, data);
        
        return data;
    } catch (error) {
        console.error(`Error loading module '${moduleId}':`, error);
        showToast(`Failed to load module. Please try again later.`, 'error');
        throw error;
    }
}

/**
 * Clear the module cache to fetch fresh data
 * @param {string} [moduleId] - Specific module ID to clear from cache, or all if not provided
 */
export function clearModuleCache(moduleId = null) {
    if (moduleId) {
        moduleCache.delete(moduleId);
    } else {
        moduleCache.clear();
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
        const modulesList = await loadModulesList();
        const loadPromises = modulesList.map(module => loadModule(module.id));
        
        await Promise.all(loadPromises);
        
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