/**
 * Module loader for C2C Bitesize
 * Handles loading module data from JSON files with support for unified format
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
        
        // Process the module data based on its format
        return processModuleData(data);
    } catch (error) {
        console.error(`Error loading module '${moduleId}':`, error);
        throw error;
    }
}

/**
 * Process module data based on its format (unified or legacy)
 * @param {Object} moduleData - The loaded module data
 * @returns {Object} Processed module data with consistent format
 */
function processModuleData(moduleData) {
    // Check if this is using the unified format
    if (moduleData.version === "unified" && moduleData.knowledgeUnits) {
        console.log("Processing unified format module");
        
        // Create content object with adapted data for each method
        const methods = ["flashcards", "quiz", "time-trial", "true-false"];
        const content = {};
        
        // Only include methods that have data
        const availableMethods = [];
        
        methods.forEach(method => {
            // Generate content for this method from the knowledge units
            const methodContent = adaptToMethod(moduleData.knowledgeUnits, method);
            
            // Only include the method if it has content
            if (methodContent && methodContent.length > 0) {
                content[method] = methodContent;
                availableMethods.push(method);
            }
        });
        
        // Return a module object in the expected format
        return {
            id: moduleData.id,
            title: moduleData.title,
            description: moduleData.description,
            methods: availableMethods,
            content: content
        };
    }
    
    // If it's already in the expected format, return as is
    return moduleData;
}

/**
 * Adapt knowledge units to a specific method format
 * @param {Array} knowledgeUnits - Array of knowledge units
 * @param {string} method - The study method to adapt for
 * @returns {Array} Formatted data for the specified method
 */
function adaptToMethod(knowledgeUnits, method) {
    switch (method) {
        case "flashcards":
            return adaptToFlashcards(knowledgeUnits);
        case "quiz":
            return adaptToQuiz(knowledgeUnits);
        case "time-trial":
            return adaptToTimeTrial(knowledgeUnits);
        case "true-false":
            return adaptToTrueFalse(knowledgeUnits);
        default:
            console.warn(`Unknown method: ${method}`);
            return [];
    }
}

/**
 * Adapt knowledge units to flashcard format
 * @param {Array} knowledgeUnits - Array of knowledge units
 * @returns {Array} Formatted flashcard data
 */
export function adaptToFlashcards(knowledgeUnits) {
    return knowledgeUnits.map(unit => ({
        question: unit.concept,
        answer: unit.definition,
        image: unit.image,
        imageAlt: unit.imageAlt
    }));
}

/**
 * Adapt knowledge units to quiz format
 * @param {Array} knowledgeUnits - Array of knowledge units
 * @returns {Array} Formatted quiz data
 */
export function adaptToQuiz(knowledgeUnits) {
    return knowledgeUnits.map(unit => {
        // Create array of options with correct answer and distractors
        const options = [
            unit.definition,
            unit.distractor1,
            unit.distractor2,
            unit.distractor3
        ];
        
        // Shuffle options to randomize position of correct answer
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
        
        return {
            question: unit.concept,
            options: shuffledOptions,
            correctAnswer: shuffledOptions.indexOf(unit.definition),
            image: unit.image,
            imageAlt: unit.imageAlt
        };
    });
}

/**
 * Adapt knowledge units to time trial format
 * @param {Array} knowledgeUnits - Array of knowledge units
 * @returns {Array} Formatted time trial data
 */
export function adaptToTimeTrial(knowledgeUnits) {
    return knowledgeUnits.map(unit => ({
        term: unit.concept,
        definition: unit.definition,
        image: unit.image,
        imageAlt: unit.imageAlt
    }));
}

/**
 * Adapt knowledge units to true/false format
 * @param {Array} knowledgeUnits - Array of knowledge units
 * @returns {Array} Formatted true/false data
 */
export function adaptToTrueFalse(knowledgeUnits) {
    // Create two types of items from each knowledge unit:
    // 1. True statements using the correct definition
    // 2. False statements using one of the distractors
    
    const statements = [];
    
    knowledgeUnits.forEach(unit => {
        // Add the true statement
        statements.push({
            statement: `${unit.concept.replace(/\?$/, '')} means ${unit.definition}`,
            isTrue: true,
            explanation: unit.explanation,
            image: unit.image,
            imageAlt: unit.imageAlt
        });
        
        // Randomly select one of the distractors for a false statement
        const distractors = [unit.distractor1, unit.distractor2, unit.distractor3];
        const selectedDistractor = distractors[Math.floor(Math.random() * distractors.length)];
        
        statements.push({
            statement: `${unit.concept.replace(/\?$/, '')} means ${selectedDistractor}`,
            isTrue: false,
            explanation: unit.explanation,
            image: unit.image,
            imageAlt: unit.imageAlt
        });
    });
    
    // Shuffle and limit to a reasonable number (e.g., 20 statements)
    return statements.sort(() => Math.random() - 0.5).slice(0, 20);
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
