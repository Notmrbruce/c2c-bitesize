/**
 * Bridge Module
 * Connects the existing application with the new enhanced modules
 * Place this file in the js/ directory
 */

import appController from './app-controller.js';
import { loadModule } from './enhanced-module-loader.js';
import viewManager from './view-manager.js';
import { initializeStudyMethod } from './study-method-initializer.js';

// Expose key functionality to the window for legacy code
window.enhancedModules = {
    // Navigate to a module
    navigateToModule: function(moduleId) {
        console.log('[Bridge] Navigating to module through bridge:', moduleId);
        appController.navigateToModule(moduleId);
        return true;
    },
    
    // Display methods for a module
    displayMethodsForModule: async function(moduleId) {
        console.log('[Bridge] Displaying methods for module through bridge:', moduleId);
        try {
            const moduleData = await loadModule(moduleId);
            appController.navigateToModule(moduleId);
            return moduleData;
        } catch (error) {
            console.error('[Bridge] Error displaying methods:', error);
            return null;
        }
    },
    
    // Prepare module for study methods (adapter for existing code)
    prepareModuleForStudyMethods: async function(moduleId) {
        console.log('[Bridge] Preparing module through bridge:', moduleId);
        try {
            const moduleData = await loadModule(moduleId);
            
            // Add legacy navigation method for backward compatibility
            moduleData.navigateToStudyMethod = function(methodName) {
                console.log('[Bridge] Navigating to study method through legacy adapter:', methodName);
                
                // Get content view
                const contentView = viewManager.getViewElement('content');
                
                if (!contentView) {
                    console.error('[Bridge] Content view not found');
                    return;
                }
                
                // Switch views
                viewManager.showView('content');
                
                // Initialize study method
                initializeStudyMethod(methodName, moduleData, contentView);
            };
            
            return moduleData;
        } catch (error) {
            console.error('[Bridge] Error preparing module:', error);
            return null;
        }
    }
};

// Patch existing functions for compatibility
window.navigateToModule = window.enhancedModules.navigateToModule;
window.displayMethodsForModule = window.enhancedModules.displayMethodsForModule;
window.prepareModuleForStudyMethods = window.enhancedModules.prepareModuleForStudyMethods;
