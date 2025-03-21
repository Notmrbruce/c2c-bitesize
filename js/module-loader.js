/**
 * Module loader for C2C Bitesize
 * Handles loading module data from JSON files
 */

// Base paths for data
const MODULES_PATH = 'data/modules';
const ASSESSMENTS_PATH = 'data/assessments';

/**
 * Load the list of available modules
 * @returns {Promise<Array>} Array of module metadata
 */
export async function loadModulesList() {
    try {
        const response = await fetch(`${MODULES_PATH}/index.json`);
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
export async function loadModuleData(moduleId) {
    try {
        console.log(`Fetching module from: ${MODULES_PATH}/${moduleId}.json`);
        const response = await fetch(`${MODULES_PATH}/${moduleId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully loaded module: ${moduleId}`);
        return data;
    } catch (error) {
        console.error(`Error loading module '${moduleId}':`, error);
        throw error;
    }
}

/**
 * Load the list of available assessments
 * @returns {Promise<Array>} Array of assessment metadata
 */
export async function loadAssessmentsList() {
    try {
        // Try to load assessments, but handle gracefully if directory doesn't exist yet
        const response = await fetch(`${ASSESSMENTS_PATH}/index.json`);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Assessments index not found. This feature may not be set up yet.');
                return []; // Return empty array instead of throwing
            }
            throw new Error(`Failed to load assessments index: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading assessments list:', error);
        // Return empty array instead of throwing, for a more graceful fallback
        return [];
    }
}

/**
 * Load a specific assessment by ID
 * @param {string} assessmentId - The ID of the assessment to load
 * @returns {Promise<Object>} Assessment data
 */
export async function loadAssessment(assessmentId) {
    try {
        const response = await fetch(`${ASSESSMENTS_PATH}/${assessmentId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load assessment '${assessmentId}': ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading assessment '${assessmentId}':`, error);
        throw error;
    }
}

/**
 * Check if an image exists for the given path
 * @param {string} imagePath - Path to the image
 * @returns {Promise<boolean>} Whether the image exists
 */
export async function checkImageExists(imagePath) {
    if (!imagePath) return false;
    
    try {
        const response = await fetch(imagePath, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.warn(`Error checking image existence for '${imagePath}':`, error);
        return false;
    }
}

/**
 * Helper function to get the image path for a module item
 * @param {string} moduleId - The module ID
 * @param {string} method - The study method (flashcards, quiz, etc.)
 * @param {number} index - The item index
 * @returns {string} The image path if specified, null otherwise
 */
export function getImagePath(moduleId, method, index) {
    return `${MODULES_PATH}/images/${moduleId}/${method}_${index}.jpg`;
}