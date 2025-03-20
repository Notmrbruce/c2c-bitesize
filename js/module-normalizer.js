/**
 * Module Data Normalizer
 * Ensures consistent module data structure for all study methods
 */

/**
 * Normalize module data to ensure it has all required fields and structure
 * @param {Object} moduleData - The raw module data
 * @returns {Object} - Normalized module data
 */
export function normalizeModuleData(moduleData) {
    if (!moduleData) {
        console.error('[ModuleNormalizer] No module data provided');
        // Create a minimal placeholder module
        moduleData = {
            id: 'placeholder',
            title: 'Placeholder Module',
            description: 'This is a placeholder module.',
            methods: [],
            content: {}
        };
    }
    
    // Ensure required fields exist
    moduleData.id = moduleData.id || 'unknown';
    moduleData.title = moduleData.title || 'Untitled Module';
    moduleData.description = moduleData.description || 'No description available.';
    
    // Ensure methods array exists
    if (!moduleData.methods || !Array.isArray(moduleData.methods)) {
        console.log(`[ModuleNormalizer] Creating standard methods array for module ${moduleData.id}`);
        moduleData.methods = ['flashcards', 'quiz', 'time-trial', 'true-false'];
    }
    
    // Ensure content object exists
    if (!moduleData.content || typeof moduleData.content !== 'object') {
        console.log(`[ModuleNormalizer] Creating content object for module ${moduleData.id}`);
        moduleData.content = {};
    }
    
    // Ensure each method has appropriate content structure
    moduleData.methods.forEach(method => {
        if (!moduleData.content[method]) {
            console.log(`[ModuleNormalizer] Creating placeholder content for ${method}`);
            
            // Create method-specific placeholder content
            moduleData.content[method] = createPlaceholderContent(method, moduleData.title);
        }
    });
    
    return moduleData;
}

/**
 * Create appropriate placeholder content based on study method type
 * @param {string} method - Study method type
 * @param {string} title - Module title for customizing placeholders
 * @returns {Array} - Array of placeholder content items
 */
function createPlaceholderContent(method, title) {
    switch (method) {
        case 'flashcards':
            return [
                {
                    question: `Sample flashcard question for ${title}`,
                    answer: "Sample answer for this flashcard."
                },
                {
                    question: "This is a placeholder flashcard.",
                    answer: "The actual content will be loaded from your module data."
                }
            ];
            
        case 'quiz':
            return [
                {
                    question: `Sample quiz question for ${title}`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correctAnswer: 0
                },
                {
                    question: "This is a placeholder quiz question.",
                    options: ["Placeholder option 1", "Placeholder option 2", "Placeholder option 3", "Placeholder option 4"],
                    correctAnswer: 1
                }
            ];
            
        case 'time-trial':
        case 'match':
            return [
                {
                    term: `Sample term for ${title}`,
                    definition: "Sample definition matching this term."
                },
                {
                    term: "Placeholder term",
                    definition: "This is a placeholder definition."
                }
            ];
            
        case 'true-false':
            return [
                {
                    statement: `Sample statement for ${title} (this statement is true).`,
                    isTrue: true,
                    explanation: "Explanation for why this statement is true."
                },
                {
                    statement: "This is a placeholder statement (this statement is false).",
                    isTrue: false,
                    explanation: "This is a placeholder explanation."
                }
            ];
            
        default:
            return [];
    }
}

export default { normalizeModuleData };
