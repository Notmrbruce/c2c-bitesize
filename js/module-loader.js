/**
 * Module loader for C2C Bitesize
 * Handles loading module data from JSON files
 */

// Base path for module data
const DATA_PATH = 'data/modules';

/**
 * Load the list of available modules
 * @returns {Promise<Array>} Array of module metadata
 */
export async function loadModulesList() {
    try {
        const response = await fetch(`${DATA_PATH}/index.json`);
        if (!response.ok) {
            throw new Error(`Failed to load modules index: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading modules list:', error);
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
        const response = await fetch(`${DATA_PATH}/${moduleId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading module '${moduleId}':`, error);
        throw error;
    }
}
