/**
 * Path Resolver Utility
 * Provides consistent path resolution for application resources
 */

/**
 * Base URL for the application
 * Derives the base path from the current location or uses a fallback
 */
const BASE_URL = (function() {
    // Try to determine base URL from script tags
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('/js/')) {
            return scripts[i].src.split('/js/')[0];
        }
    }
    
    // Fallback to current origin
    return window.location.origin;
})();

// Log the determined base URL for debugging
console.log('[PathResolver] Using base URL:', BASE_URL);

/**
 * Get the absolute path for a resource
 * @param {string} path - Relative path to the resource
 * @returns {string} - Absolute URL to the resource
 */
export function getResourcePath(path) {
    // Remove leading slash if present - we'll add it later
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/${cleanPath}`;
}

/**
 * Get the absolute path for a module JSON file
 * @param {string} moduleId - Module identifier
 * @returns {string} - Absolute URL to the module JSON file
 */
export function getModulePath(moduleId) {
    return getResourcePath(`data/modules/${moduleId}.json`);
}

/**
 * Get the absolute path for the modules index JSON file
 * @returns {string} - Absolute URL to the modules index
 */
export function getModulesIndexPath() {
    return getResourcePath('data/modules/index.json');
}

/**
 * Get the absolute path for a study method JS file
 * @param {string} methodName - Study method name
 * @returns {string} - Absolute URL to the study method JS file
 */
export function getStudyMethodPath(methodName) {
    return getResourcePath(`js/study-methods/${methodName}.js`);
}

/**
 * Get the absolute URL for a module import
 * This is different from getModulePath as it's formatted for ES6 imports
 * @param {string} modulePath - Relative module path
 * @returns {string} - Absolute URL for import
 */
export function getImportPath(modulePath) {
    // For dynamic imports, we need to ensure the path is correctly formatted
    return new URL(modulePath, BASE_URL).href;
}

export default {
    BASE_URL,
    getResourcePath,
    getModulePath,
    getModulesIndexPath,
    getStudyMethodPath,
    getImportPath
};
