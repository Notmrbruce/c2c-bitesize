// Main application script
// Import from module-loader.js correctly
import { loadModulesList, loadModuleData, getImagePath, checkImageExists } from './module-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modulesView = document.getElementById('modules-view');
    const methodsView = document.getElementById('methods-view');
    const contentView = document.getElementById('content-view');
    const modulesList = document.getElementById('modules-list');
    const selectedModuleTitle = document.getElementById('selected-module-title');
    const methodButtons = document.getElementById('method-buttons');
    const breadcrumbModule = document.getElementById('breadcrumb-module');
    const breadcrumbItem = document.getElementById('breadcrumb-item');
    const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
    
    // App state
    let currentModule = null;
    
    // Method descriptions and icons
    const methodInfo = {
        'flashcards': {
            description: 'Flip through digital cards to test your recall of key information. Tap or click to reveal the answer.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8"/><path d="M8 12h8"/></svg>'
        },
        'quiz': {
            description: 'Test your knowledge with multiple-choice questions and get immediate feedback on your answers.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        },
        'time-trial': {
            description: 'Race against the clock to match terms with their definitions. Challenge yourself to recall information quickly.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        },
        'true-false': {
            description: 'Determine whether statements are true or false and learn the reasoning behind each answer.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        }
    };
    
    // Initialize the application
    init();
    
    // Functions
    async function init() {
        await loadModules();
        
        // Initially show only the modules view
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        
        // Add entrance animations
        animateElements();
    }
    
    function animateElements() {
        // Add fade-in to elements with data-animate attribute
        const animateElements = document.querySelectorAll('[data-animate]');
        animateElements.forEach(el => {
            el.classList.add('fade-in');
        });
    }
    
    async function loadModules() {
        try {
            const modules = await loadModulesList();
            
            modulesList.innerHTML = '';
            
            modules.forEach((module, index) => {
                const moduleElement = document.createElement('div');
                moduleElement.className = 'module-card';
                moduleElement.innerHTML = `
                    <h3 class="module-title">${module.title}</h3>
                    <p class="module-desc">${module.description}</p>
                `;
                
                moduleElement.addEventListener('click', () => {
                    // Use moduleId to load module data
                    loadSelectedModule(module.id);
                });
                
                modulesList.appendChild(moduleElement);
            });
        } catch (error) {
            console.error('Error loading modules:', error);
            modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
        }
    }
    
    // Fixed loadModule function that uses the imported loadModuleData function
    async function loadSelectedModule(moduleId) {
        try {
            console.log(`Loading module with ID: ${moduleId}`);
            const moduleData = await loadModuleData(moduleId);
            console.log('Module data loaded successfully:', moduleData);
            currentModule = moduleData;
            showMethodsView(moduleData);
        } catch (error) {
            console.error(`Error loading module ${moduleId}:`, error);
            alert('Error loading module. Please try again later.');
        }
    }
    
    function showModulesView() {
        // Update UI
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        
        // Hide breadcrumb
        if (breadcrumbItem) {
            breadcrumbItem.style.display = 'none';
        }
        if (mobileBreadcrumb) {
            mobileBreadcrumb.style.display = 'none';
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function showMethodsView(moduleData) {
        // Update titles
        selectedModuleTitle.textContent = moduleData.title;
        
        // Update breadcrumb
        if (breadcrumbModule && breadcrumbItem && mobileBreadcrumb) {
            breadcrumbModule.textContent = moduleData.title;
            breadcrumbItem.style.display = 'block';
            mobileBreadcrumb.style.display = 'block';
            mobileBreadcrumb.textContent = moduleData.title;
            
            // Set event listeners for breadcrumbs
            breadcrumbModule.onclick = (e) => {
                e.preventDefault();
                showMethodsView(currentModule);
            };
            
            mobileBreadcrumb.onclick = (e) => {
                e.preventDefault();
                showMethodsView(currentModule);
            };
        }
        
        // Create method buttons
        createMethodButtons(moduleData);
        
        // Show methods view, hide others
        modulesView.style.display = 'none';
        methodsView.style.display = 'block';
        contentView.style.display = 'none';
        
        // Update method description
        const methodDescriptionElement = document.getElementById('method-description');
        if (methodDescriptionElement) {
            methodDescriptionElement.textContent = 'Select a study method to begin';
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function createMethodButtons(moduleData) {
        methodButtons.innerHTML = '';
        
        moduleData.methods.forEach(method => {
            const button = document.createElement('button');
            button.className = 'method-button';
            button.id = `${method}-button`;
            
            // Get method info
            const info = methodInfo[method] || {
                description: `Learn with ${method}`,
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
            };
            
            // Format the method name properly
            let methodName = method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' ');
            
            // Special case for true-false
            if (method === 'true-false') {
                methodName = 'True or False';
            }
            
            button.innerHTML = `
                <div class="method-icon">${info.icon}</div>
                <div class="method-content">
                    <div class="method-title">${methodName}</div>
                    <div class="method-desc">${info.description}</div>
                </div>
            `;
            
            button.addEventListener('click', () => {
                loadStudyMethod(moduleData, method);
            });
            
            methodButtons.appendChild(button);
        });
    }
    
    function loadStudyMethod(moduleData, method) {
        // Clear previous content
        contentView.innerHTML = '';
        
        // Show the content view and hide other views
        modulesView.style.display = 'none';
        methodsView.style.display = 'none';
        contentView.style.display = 'block';
        contentView.classList.add('slide-up');
        
        // Remove the animation class after animation completes
        setTimeout(() => {
            contentView.classList.remove('slide-up');
        }, 500);
        
        // Load the appropriate study method
        switch (method) {
            case 'flashcards':
                loadFlashcards(moduleData);
                break;
            case 'quiz':
                loadQuiz(moduleData);
                break;
            case 'time-trial':
                initTimeTrialGame(moduleData);
                break;
            case 'true-false':
                initTrueFalseQuestions(moduleData);
                break;
            default:
                contentView.innerHTML = `<div class="content-container"><p>Study method "${method}" is not implemented yet.</p></div>`;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Rest of the functions remain the same...
    // Note: You should include the rest of your app.js functions here
    // Including loadFlashcards, loadQuiz, initTimeTrialGame, and initTrueFalseQuestions

    async function loadFlashcards(moduleData) {
        const flashcardsData = moduleData.content.flashcards;
        let currentCardIndex = 0;
        
        // Create flashcard container
        contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Flashcards</h2>
                <span class="progress-indicator">Card <span id="current-card-number">1</span> of ${flashcardsData.length}</span>
            </div>
            
            <div class="content-container">
                <div class="flashcard" id="current-flashcard">
                    <div class="card-indicator">Click to flip</div>
                    <div class="flashcard-question" id="flashcard-question-content">${flashcardsData[currentCardIndex].question}</div>
                    <div class="flashcard-answer" id="flashcard-answer-content">${flashcardsData[currentCardIndex].answer}</div>
                </div>
                
                <div id="flashcard-image-container" class="flashcard-image-container" style="display: none;">
                    <img id="flashcard-image" src="" alt="Flashcard image" class="flashcard-image">
                </div>
                
                <div class="card-controls">
                    <button id="prev-card" class="btn" ${currentCardIndex === 0 ? 'disabled' : ''}>
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        Previous
                    </button>
                    
                    <button id="flip-card" class="btn btn-primary">
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 15l5 5 5-5"/>
                            <path d="M12 20V4"/>
                        </svg>
                        Flip Card
                    </button>
                    
                    <button id="next-card" class="btn" ${currentCardIndex === flashcardsData.length - 1 ? 'disabled' : ''}>
                        Next
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <button id="back-to-methods" class="btn">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Methods
            </button>
        `;
        
        // Add event listeners
        const flashcardElement = document.getElementById('current-flashcard');
        const prevButton = document.getElementById('prev-card');
        const nextButton = document.getElementById('next-card');
        const flipButton = document.getElementById('flip-card');
        const backButton = document.getElementById('back-to-methods');
        const cardNumberElement = document.getElementById('current-card-number');
        
        flashcardElement.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
        });
        
        flipButton.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
        });
        
        prevButton.addEventListener('click', () => {
            if (currentCardIndex > 0) {
                currentCardIndex--;
                updateFlashcard();
            }
        });
        
        nextButton.addEventListener('click', () => {
            if (currentCardIndex < flashcardsData.length - 1) {
                currentCardIndex++;
                updateFlashcard();
            }
        });
        
        backButton.addEventListener('click', () => {
            showMethodsView(moduleData);
        });
        
        // Initial flashcard update
        await updateFlashcard();
        
        async function updateFlashcard() {
            const card = flashcardsData[currentCardIndex];
            
            // Update question and answer text
            document.getElementById('flashcard-question-content').textContent = card.question;
            document.getElementById('flashcard-answer-content').textContent = card.answer;
            
            // Reset card flip state
            flashcardElement.classList.remove('flipped');
            
            // Check for image
            const imageContainer = document.getElementById('flashcard-image-container');
            const imageElement = document.getElementById('flashcard-image');
            
            if (card.image || moduleData.id) {
                // Try direct image path first, then fallback to standard path
                const hasDirectImage = card.image ? await checkImageExists(card.image) : false;
                const standardPath = getImagePath(moduleData.id, 'flashcards', currentCardIndex);
                const hasStandardImage = await checkImageExists(standardPath);
                
                if (hasDirectImage || hasStandardImage) {
                    const imagePath = hasDirectImage ? card.image : standardPath;
                    imageElement.src = imagePath;
                    imageElement.alt = card.imageAlt || `Image for ${card.question}`;
                    imageContainer.style.display = 'block';
                } else {
                    imageContainer.style.display = 'none';
                }
            } else {
                imageContainer.style.display = 'none';
            }
            
            // Update card number
            cardNumberElement.textContent = currentCardIndex + 1;
            
            // Update button states
            prevButton.disabled = currentCardIndex === 0;
            nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
        }
    }

    // Include the remaining functions as needed for your application
    // loadQuiz, initTimeTrialGame, initTrueFalseQuestions
});