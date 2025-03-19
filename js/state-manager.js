/**
 * State Management for C2C Bitesize
 * A simple state manager to handle application state across modules
 */

class StateManager {
    constructor() {
        this._state = {
            // Current module state
            currentModule: null,
            
            // Current view
            currentView: 'modules', // 'modules', 'methods', 'content'
            
            // Current learning method
            currentMethod: null,
            
            // Progress tracking
            progress: {}, // Will store progress by module ID
            
            // UI state
            ui: {
                lastScrollTop: 0,
                theme: 'dark', // 'dark' or 'light'
                menuOpen: false
            },
            
            // Navigation state
            navigation: {
                view: 'modules',
                params: {}
            }
        };
        
        // Register for subscribers (observer pattern)
        this._subscribers = {};
    }
    
    /**
     * Get a value from state
     * @param {string} key - Path to the state value (dot notation)
     * @returns {*} State value
     */
    get(key) {
        return this._getNestedValue(this._state, key);
    }
    
    /**
     * Set a value in state and notify subscribers
     * @param {string} key - Path to set (dot notation)
     * @param {*} value - Value to set
     */
    set(key, value) {
        const oldState = JSON.parse(JSON.stringify(this._state));
        this._setNestedValue(this._state, key, value);
        this._notifySubscribers(key, oldState);
        
        // Save any progress to localStorage
        if (key.startsWith('progress')) {
            this._saveProgressToLocalStorage();
        }
    }
    
    /**
     * Subscribe to state changes
     * @param {string} key - State path to subscribe to
     * @param {Function} callback - Function to call on change
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this._subscribers[key]) {
            this._subscribers[key] = [];
        }
        
        this._subscribers[key].push(callback);
        
        // Return unsubscribe function
        return () => {
            this._subscribers[key] = this._subscribers[key].filter(cb => cb !== callback);
        };
    }
    
    /**
     * Initialize state from localStorage if available
     */
    init() {
        try {
            const savedProgress = localStorage.getItem('c2c_bitesize_progress');
            if (savedProgress) {
                this._state.progress = JSON.parse(savedProgress);
            }
            
            const savedTheme = localStorage.getItem('c2c_bitesize_theme');
            if (savedTheme) {
                this._state.ui.theme = savedTheme;
                if (savedTheme === 'light') {
                    document.body.classList.add('light-theme');
                }
            }
        } catch (error) {
            console.error('Error initializing state from localStorage:', error);
        }
    }
    
    /**
     * Navigate to a specific view
     * @param {string} view - View to navigate to ('modules', 'methods', 'content')
     * @param {Object} params - Additional parameters for the view
     */
    navigateTo(view, params = {}) {
        // Update navigation state
        this._state.navigation = {
            view,
            params
        };
        
        // Update current view
        this._state.currentView = view;
        
        // Handle specific view parameters
        if (view === 'methods' && params.module) {
            this._state.currentModule = params.module;
        }
        
        if (view === 'content' && params.method) {
            this._state.currentMethod = params.method;
        }
        
        // Publish navigation event for view components to respond to
        this._notifySubscribers('navigation', {});
    }
    
    /**
     * Save current progress for a module
     * @param {string} moduleId - Module ID
     * @param {string} method - Learning method
     * @param {Object} data - Progress data
     */
    saveProgress(moduleId, method, data) {
        if (!this._state.progress[moduleId]) {
            this._state.progress[moduleId] = {};
        }
        
        this._state.progress[moduleId][method] = {
            ...data,
            timestamp: new Date().toISOString()
        };
        
        // Notify subscribers and save to localStorage
        this.set(`progress.${moduleId}.${method}`, this._state.progress[moduleId][method]);
    }
    
    /**
     * Get progress for a specific module and method
     * @param {string} moduleId - Module ID
     * @param {string} method - Learning method
     * @returns {Object|null} Progress data or null if not found
     */
    getProgress(moduleId, method) {
        if (!this._state.progress[moduleId]) return null;
        return this._state.progress[moduleId][method] || null;
    }
    
    /**
     * Toggle UI theme between dark and light
     */
    toggleTheme() {
        const newTheme = this._state.ui.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('light-theme');
        this.set('ui.theme', newTheme);
        localStorage.setItem('c2c_bitesize_theme', newTheme);
    }
    
    /**
     * Private: Helper to get nested value using dot notation
     * @private
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev && prev[curr] !== undefined ? prev[curr] : null;
        }, obj);
    }
    
    /**
     * Private: Helper to set nested value using dot notation
     * @private
     */
    _setNestedValue(obj, path, value) {
        const parts = path.split('.');
        const lastKey = parts.pop();
        const target = parts.reduce((prev, curr) => {
            if (!prev[curr]) prev[curr] = {};
            return prev[curr];
        }, obj);
        
        target[lastKey] = value;
    }
    
    /**
     * Private: Notify subscribers of state changes
     * @private
     */
    _notifySubscribers(key, oldState) {
        // Notify exact key subscribers
        if (this._subscribers[key]) {
            this._subscribers[key].forEach(callback => {
                if (key === 'navigation') {
                    // For navigation events, pass the current navigation state
                    callback(this._state.navigation);
                } else {
                    callback(this.get(key), this._getNestedValue(oldState, key), this._state);
                }
            });
        }
        
        // Notify wildcard subscribers
        if (this._subscribers['*']) {
            this._subscribers['*'].forEach(callback => {
                callback(this._state, oldState, key);
            });
        }
    }
    
    /**
     * Private: Save progress to localStorage
     * @private
     */
    _saveProgressToLocalStorage() {
        try {
            localStorage.setItem('c2c_bitesize_progress', JSON.stringify(this._state.progress));
        } catch (error) {
            console.error('Error saving progress to localStorage:', error);
        }
    }
}

// Create singleton instance
const state = new StateManager();

// Initialize on load
state.init();

// Export singleton
export default state;