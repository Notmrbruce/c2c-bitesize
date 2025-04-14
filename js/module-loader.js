/**
 * Module loader for C2C Bitesize
 * Handles loading module data from JSON files with support for unified format
 */

// Base paths for data
const MODULES_PATH = 'data/modules';
const ASSESSMENTS_PATH = 'data/assessments';
const IMAGES_BASE_PATH = 'data/modules/images'; // Base path for images

/**
 * Load the list of available modules
 * @returns {Promise<Array>} Array of module metadata
 */
export async function loadModulesList() {
    try {
        const response = await fetch(`${MODULES_PATH}/index.json`);
        if (!response.ok) {
            // MODIFIED: Better handling for 404
            if (response.status === 404) {
                 console.warn('Modules index.json not found. Check file path and server configuration.');
                 return []; // Return empty if not found
            }
            throw new Error(`Failed to load modules index: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading modules list:', error);
        return []; // Return empty on error
        // throw error; // Re-throwing might stop the app, decide based on desired behavior
    }
}

/**
 * Load a specific module by ID
 * @param {string} moduleId - The ID of the module to load
 * @returns {Promise<Object>} Module data formatted for the application
 */
export async function loadModuleData(moduleId) {
    try {
        console.log(`Fetching module from: ${MODULES_PATH}/${moduleId}.json`);
        const response = await fetch(`${MODULES_PATH}/${moduleId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load module '${moduleId}': ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json(); // Load the raw JSON data
        console.log(`Successfully loaded raw module data: ${moduleId}`);

        // MODIFIED: Always process the data, assuming unified format now
        return processUnifiedModuleData(rawData);
    } catch (error) {
        console.error(`Error loading module '${moduleId}':`, error);
        throw error;
    }
}

/**
 * Process module data assuming the 'ultra-atomic' unified format.
 * Converts knowledgeUnits into content arrays for each study method.
 * @param {Object} rawData - The raw module data loaded from JSON
 * @returns {Object} Processed module data with `methods` and `content` fields structured for app.js
 */
function processUnifiedModuleData(rawData) {
    console.log("Processing unified format module:", rawData.id);

    if (!rawData.knowledgeUnits || !Array.isArray(rawData.knowledgeUnits)) {
         console.warn(`Module ${rawData.id} is missing or has invalid knowledgeUnits array.`);
         return { // Return basic structure even if content is missing
             id: rawData.id,
             title: rawData.title || "Untitled Module",
             description: rawData.description || "No description available.",
             methods: [],
             content: {}
         };
    }

    // Potential methods based on adaptation logic
    const potentialMethods = ["flashcards", "quiz", "time-trial", "true-false"];
    const content = {};
    const availableMethods = []; // Methods that actually have content

    potentialMethods.forEach(method => {
        // Generate content for this method from the knowledge units
        const methodContent = adaptKnowledgeUnits(rawData.knowledgeUnits, method);

        // Only include the method if it has valid, non-empty content
        if (methodContent && methodContent.length > 0) {
            content[method] = methodContent;
            availableMethods.push(method);
        } else {
            console.log(`No content generated for method '${method}' in module '${rawData.id}'.`);
        }
    });

    if (availableMethods.length === 0) {
        console.warn(`No adaptable content found for any method in module ${rawData.id}.`);
    }

    // Return a module object in the format expected by app.js
    return {
        id: rawData.id,
        title: rawData.title || "Untitled Module",
        description: rawData.description || "No description available.",
        methods: availableMethods, // Only list methods with generated content
        content: content
    };
}

/**
 * Factory function to adapt knowledge units to a specific method format
 * @param {Array} knowledgeUnits - Array of knowledge units
 * @param {string} method - The study method ("flashcards", "quiz", etc.)
 * @returns {Array|null} Formatted data for the specified method or null if adaptation fails
 */
function adaptKnowledgeUnits(knowledgeUnits, method) {
    try {
        switch (method) {
            case "flashcards":
                return adaptToFlashcards(knowledgeUnits);
            case "quiz":
                // MODIFIED: Added filtering for units with enough distractors
                return adaptToQuiz(knowledgeUnits.filter(unit =>
                    unit.distractor1 && unit.distractor2 && unit.distractor3));
            case "time-trial":
                 // MODIFIED: Filter for units suitable for matching (e.g., ensure definition isn't too long, if needed)
                 // For now, just using concept/definition pairs directly
                return adaptToTimeTrial(knowledgeUnits);
            case "true-false":
                // MODIFIED: Requires explanation field for better feedback
                return adaptToTrueFalse(knowledgeUnits.filter(unit => unit.explanation));
            default:
                console.warn(`Unknown or unsupported adaptation method: ${method}`);
                return null; // Return null or empty array for unknown methods
        }
    } catch (error) {
        console.error(`Error adapting knowledge units for method '${method}':`, error);
        return null; // Return null on error
    }
}

// --- Specific Adaptation Functions ---

function adaptToFlashcards(knowledgeUnits) {
    // Simple mapping: concept -> question, definition -> answer
    return knowledgeUnits.map(unit => ({
        question: unit.concept || "Concept missing",
        answer: unit.definition || "Definition missing",
        // NEW: Carry over image details if they exist
        image: unit.image,
        imageAlt: unit.imageAlt,
        imageDisplayTiming: unit.imageDisplayTiming || "with-question"
    }));
}

function adaptToQuiz(knowledgeUnits) {
    // Filters applied in adaptKnowledgeUnits function already
    if (!knowledgeUnits || knowledgeUnits.length === 0) return [];

    return knowledgeUnits.map((unit, index) => {
        const correctAnswer = unit.definition;
        // Ensure distractors exist before trying to use them
        const distractors = [unit.distractor1, unit.distractor2, unit.distractor3].filter(d => d); // Filter out undefined/null
        if (distractors.length < 3) {
            console.warn(`Quiz item ${index} for ${unit.concept} has fewer than 3 valid distractors.`);
            // Optionally skip this question or add generic distractors
        }

        const options = [correctAnswer, ...distractors];

        // Shuffle options - using Fisher-Yates shuffle
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        const correctAnswerIndex = options.indexOf(correctAnswer);

        return {
            question: unit.concept || `Question ${index + 1}`,
            options: options,
            correctAnswer: correctAnswerIndex,
             // NEW: Carry over image details if they exist
            image: unit.image,
            imageAlt: unit.imageAlt,
            imageDisplayTiming: unit.imageDisplayTiming || "with-question"
        };
    });
}

function adaptToTimeTrial(knowledgeUnits) {
     // Map concept -> term, definition -> definition
    return knowledgeUnits.map(unit => ({
        term: unit.concept || "Missing Concept",
        definition: unit.definition || "Missing Definition",
         // NEW: Carry over image details if they exist
        image: unit.image,
        imageAlt: unit.imageAlt,
        imageDisplayTiming: unit.imageDisplayTiming || "with-question"
    }));
}

function adaptToTrueFalse(knowledgeUnits) {
    // Filter applied in adaptKnowledgeUnits already
    if (!knowledgeUnits || knowledgeUnits.length === 0) return [];

    const statements = [];
    knowledgeUnits.forEach(unit => {
        const baseStatement = unit.concept ? unit.concept.replace(/\?$/, '') : "Statement"; // Remove trailing question mark

        // Add TRUE statement (ensure definition exists)
        if (unit.definition) {
            statements.push({
                statement: `${baseStatement} is: ${unit.definition}`,
                isTrue: true,
                explanation: unit.explanation || "Correct. (No further explanation provided)", // Use provided explanation
                image: unit.image, // Carry over image info
                imageAlt: unit.imageAlt,
                imageDisplayTiming: unit.imageDisplayTiming || "with-question"
            });
        }

        // Add FALSE statement using a random distractor (ensure distractors and explanation exist)
        const distractors = [unit.distractor1, unit.distractor2, unit.distractor3].filter(d => d); // Get valid distractors
        if (distractors.length > 0 && unit.explanation) {
            const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
            statements.push({
                statement: `${baseStatement} is: ${randomDistractor}`,
                isTrue: false,
                explanation: unit.explanation || "Incorrect. (No further explanation provided)", // Use provided explanation
                image: unit.image, // Carry over image info
                imageAlt: unit.imageAlt,
                imageDisplayTiming: unit.imageDisplayTiming || "with-question"
            });
        }
    });

    // Shuffle the generated statements
     for (let i = statements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [statements[i], statements[j]] = [statements[j], statements[i]];
    }

    // Limit the number of T/F questions if desired (e.g., 20 max)
    return statements.slice(0, 20);
}


// --- Assessment Loading ---

/**
 * Load the list of available assessments
 * @returns {Promise<Array>} Array of assessment metadata
 */
export async function loadAssessmentsList() {
    try {
        const response = await fetch(`${ASSESSMENTS_PATH}/index.json`);
         if (!response.ok) {
            // MODIFIED: Better handling for 404
             if (response.status === 404) {
                 console.warn('Assessments index.json not found. Assessment feature might be unavailable.');
                 return []; // Return empty if not found
             }
            throw new Error(`Failed to load assessments index: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading assessments list:', error);
        return []; // Return empty on error
        // throw error; // Decide based on desired behavior
    }
}

/**
 * Load a specific assessment by ID
 * @param {string} assessmentId - The ID of the assessment to load
 * @returns {Promise<Object>} Assessment data
 */
export async function loadAssessment(assessmentId) {
    try {
        console.log(`Fetching assessment from: ${ASSESSMENTS_PATH}/${assessmentId}.json`);
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


// --- Image Handling ---

/**
 * Check if an image exists at the given path using a HEAD request.
 * @param {string|null|undefined} imagePath - Path to the image file.
 * @returns {Promise<boolean>} True if the image exists and the request is successful, false otherwise.
 */
export async function checkImageExists(imagePath) {
    // NEW: Handle null or undefined paths gracefully
    if (!imagePath || typeof imagePath !== 'string') {
        console.log(`Image path is invalid or missing: ${imagePath}`);
        return false;
    }

    try {
        // Using HEAD request to check existence without downloading the full image
        const response = await fetch(imagePath, { method: 'HEAD' });
        // Check if response status is OK (e.g., 200)
        return response.ok;
    } catch (error) {
        // Network errors or other issues might occur
        // console.warn(`Error checking image existence for '${imagePath}':`, error.message);
        return false; // Assume image doesn't exist or isn't accessible on error
    }
}


/**
 * Generate the conventional path for an image associated with a learning item.
 * Assumes images are stored like: data/modules/images/{moduleId}/{method}_{index}.jpg
 * @param {string} moduleId - The ID of the module (e.g., 'policies-module').
 * @param {string} method - The learning method (e.g., 'flashcards', 'quiz').
 * @param {number} index - The zero-based index of the item within the method's content array.
 * @returns {string} The constructed image path.
 */
export function getImagePath(moduleId, method, index) {
     // NEW: Robust path construction
    if (!moduleId || !method || index === undefined || index === null) {
        console.warn("Cannot generate image path: Missing moduleId, method, or index.");
        return ''; // Return empty string if parameters are invalid
    }
    // Standard convention - adjust filename/extension if needed
    return `${IMAGES_BASE_PATH}/${moduleId}/${method}_${index}.jpg`;
}
