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
    
    async function loadQuiz(moduleData) {
        const quizData = moduleData.content.quiz;
        let currentQuestionIndex = 0;
        let score = 0;
        let userAnswers = [];
        
        // Initialize user answers array
        quizData.forEach(() => userAnswers.push(null));
        
        // Create quiz container
        contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Quiz</h2>
                <span class="progress-indicator">Question <span id="current-question-number">1</span> of ${quizData.length}</span>
            </div>
            
            <div class="content-container">
                <div class="quiz-container" id="quiz-container">
                    <div class="quiz-question" id="quiz-question"></div>
                    <div id="quiz-image-container" class="quiz-image-container" style="display: none;">
                        <img id="quiz-image" src="" alt="Quiz question image" class="quiz-image">
                    </div>
                    <ul class="quiz-options" id="quiz-options"></ul>
                </div>
                
                <div class="quiz-controls">
                    <button id="prev-question" class="btn">
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        Previous
                    </button>
                    
                    <button id="next-question" class="btn">
                        Next
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                    
                    <button id="submit-quiz" class="btn btn-primary" style="display: none;">Submit Quiz</button>
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
        const prevButton = document.getElementById('prev-question');
        const nextButton = document.getElementById('next-question');
        const submitButton = document.getElementById('submit-quiz');
        const backButton = document.getElementById('back-to-methods');
        const questionNumberElement = document.getElementById('current-question-number');
        
        prevButton.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                loadQuestion();
            }
        });
        
        nextButton.addEventListener('click', () => {
            if (currentQuestionIndex < quizData.length - 1) {
                currentQuestionIndex++;
                loadQuestion();
            }
        });
        
        submitButton.addEventListener('click', () => {
            if (userAnswers.includes(null)) {
                if (confirm("You haven't answered all questions. Are you sure you want to submit?")) {
                    showQuizResults();
                }
            } else {
                showQuizResults();
            }
        });
        
        backButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to exit the quiz? Your progress will be lost.")) {
                showMethodsView(moduleData);
            }
        });
        
        // Load first question
        await loadQuestion();
        
        async function loadQuestion() {
            const questionData = quizData[currentQuestionIndex];
            const questionElement = document.getElementById('quiz-question');
            const optionsElement = document.getElementById('quiz-options');
            const imageContainer = document.getElementById('quiz-image-container');
            const imageElement = document.getElementById('quiz-image');
            
            questionElement.textContent = `${currentQuestionIndex + 1}. ${questionData.question}`;
            
            // Check for image
            if (questionData.image || moduleData.id) {
                // Try direct image path first, then fallback to standard path
                const hasDirectImage = questionData.image ? await checkImageExists(questionData.image) : false;
                const standardPath = getImagePath(moduleData.id, 'quiz', currentQuestionIndex);
                const hasStandardImage = await checkImageExists(standardPath);
                
                if (hasDirectImage || hasStandardImage) {
                    const imagePath = hasDirectImage ? questionData.image : standardPath;
                    imageElement.src = imagePath;
                    imageElement.alt = questionData.imageAlt || `Image for question ${currentQuestionIndex + 1}`;
                    imageContainer.style.display = 'block';
                } else {
                    imageContainer.style.display = 'none';
                }
            } else {
                imageContainer.style.display = 'none';
            }
            
            // Update question number
            questionNumberElement.textContent = currentQuestionIndex + 1;
            
            optionsElement.innerHTML = '';
            questionData.options.forEach((option, index) => {
                const optionElement = document.createElement('li');
                optionElement.className = 'quiz-option';
                optionElement.textContent = option;
                
                if (userAnswers[currentQuestionIndex] === index) {
                    optionElement.classList.add('selected');
                }
                
                optionElement.addEventListener('click', () => {
                    // Clear previous selection
                    document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
                    
                    // Select this option
                    optionElement.classList.add('selected');
                    
                    // Save user's answer
                    userAnswers[currentQuestionIndex] = index;
                });
                
                optionsElement.appendChild(optionElement);
            });
            
            // Update button states
            prevButton.disabled = currentQuestionIndex === 0;
            
            // Show/hide appropriate buttons
            if (currentQuestionIndex === quizData.length - 1) {
                nextButton.style.display = 'none';
                submitButton.style.display = 'block';
            } else {
                nextButton.style.display = 'block';
                submitButton.style.display = 'none';
            }
        }
        
        function showQuizResults() {
            // Calculate score
            score = 0;
            userAnswers.forEach((answer, index) => {
                if (answer === quizData[index].correctAnswer) {
                    score++;
                }
            });
            
            const percentage = Math.round((score / quizData.length) * 100);
            
            // Display results
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleData.title} - Quiz Results</h2>
                </div>
                
                <div class="content-container">
                    <div class="quiz-results">
                        <div class="quiz-score">${score} / ${quizData.length}</div>
                        <div class="quiz-percentage">${percentage}%</div>
                        ${score === quizData.length ? 
                            '<div class="quiz-perfect">Perfect Score! 🎉</div>' : 
                            '<p>Keep learning to improve your score!</p>'}
                        
                        <div class="quiz-actions">
                            <button id="review-quiz" class="btn btn-primary">Review Answers</button>
                            <button id="retry-quiz" class="btn">Try Again</button>
                            <button id="back-to-methods" class="btn">Back to Methods</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('review-quiz').addEventListener('click', showQuizReview);
            document.getElementById('retry-quiz').addEventListener('click', () => loadQuiz(moduleData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(moduleData));
        }
        
        async function showQuizReview() {
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleData.title} - Quiz Review</h2>
                </div>
                
                <div class="content-container">
                    <div id="quiz-review"></div>
                </div>
                
                <button id="back-to-results" class="btn">
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5"/>
                        <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Results
                </button>
            `;
            
            const reviewElement = document.getElementById('quiz-review');
            
            for (let index = 0; index < quizData.length; index++) {
                const question = quizData[index];
                const userAnswer = userAnswers[index] !== null ? userAnswers[index] : -1;
                const isCorrect = userAnswer === question.correctAnswer;
                
                const questionElement = document.createElement('div');
                questionElement.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
                
                // Check for image
                let imageHtml = '';
                if (question.image || moduleData.id) {
                    // Try direct image path first, then fallback to standard path
                    const hasDirectImage = question.image ? await checkImageExists(question.image) : false;
                    const standardPath = getImagePath(moduleData.id, 'quiz', index);
                    const hasStandardImage = await checkImageExists(standardPath);
                    
                    if (hasDirectImage || hasStandardImage) {
                        const imagePath = hasDirectImage ? question.image : standardPath;
                        imageHtml = `
                            <div class="review-image-container">
                                <img src="${imagePath}" alt="${question.imageAlt || `Image for question ${index + 1}`}" class="review-image">
                            </div>
                        `;
                    }
                }
                
                questionElement.innerHTML = `
                    <div class="review-statement">${index + 1}. ${question.question}</div>
                    ${imageHtml}
                    <div class="review-details">
                        <div class="review-answer">Your answer: ${userAnswer >= 0 ? question.options[userAnswer] : 'Not answered'}</div>
                        <div class="review-answer">Correct answer: ${question.options[question.correctAnswer]}</div>
                    </div>
                `;
                
                reviewElement.appendChild(questionElement);
            }
            
            document.getElementById('back-to-results').addEventListener('click', showQuizResults);
        }
    }
    
    // Time Trial Game Implementation
    async function initTimeTrialGame(moduleData) {
        const timeTrialData = moduleData.content['time-trial'];
        let score = 0;
        let currentRound = 0;
        let timer;
        let timeLeft = 7;
        let gameStarted = false;
        
        // Shuffle and prepare data
        const shuffledData = [...timeTrialData].sort(() => Math.random() - 0.5);
        
        // Create the game UI
        contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Time Trial</h2>
            </div>
            
            <div class="content-container">
                <div class="time-trial-header">
                    <div class="time-trial-info">
                        <div class="info-item">
                            <div class="info-label">Score</div>
                            <div class="info-value" id="time-trial-score">0</div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">Time</div>
                            <div class="info-value time-value" id="time-trial-time">7s</div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">Question</div>
                            <div class="info-value" id="time-trial-current">0/${timeTrialData.length}</div>
                        </div>
                    </div>
                </div>
                
                <div id="time-trial-gameplay" style="display: none;">
                    <div class="time-trial-definition" id="time-trial-definition"></div>
                    <div id="time-trial-image-container" class="time-trial-image-container" style="display: none;">
                        <img id="time-trial-image" src="" alt="Time trial image" class="time-trial-image">
                    </div>
                    <div class="time-trial-options" id="time-trial-options"></div>
                    <div class="time-trial-feedback" id="time-trial-feedback"></div>
                </div>
                
                <div id="time-trial-start-screen" class="text-center">
                    <p class="mb-lg">Match the term with its definition as quickly as possible. You have 7 seconds for each question.</p>
                    <button id="time-trial-start" class="btn btn-primary btn-large">Start Game</button>
                </div>
                
                <div class="time-trial-controls">
                    <button id="time-trial-next" class="btn btn-primary" style="display: none;">Next Term</button>
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
        
        const scoreElement = document.getElementById('time-trial-score');
        const timeElement = document.getElementById('time-trial-time');
        const currentElement = document.getElementById('time-trial-current');
        const definitionElement = document.getElementById('time-trial-definition');
        const optionsElement = document.getElementById('time-trial-options');
        const feedbackElement = document.getElementById('time-trial-feedback');
        const startButton = document.getElementById('time-trial-start');
        const nextButton = document.getElementById('time-trial-next');
        const backButton = document.getElementById('back-to-methods');
        const gameplayElement = document.getElementById('time-trial-gameplay');
        const startScreenElement = document.getElementById('time-trial-start-screen');
        const imageContainer = document.getElementById('time-trial-image-container');
        const imageElement = document.getElementById('time-trial-image');
        
        // Initialize the game
        startButton.addEventListener('click', startGame);
        nextButton.addEventListener('click', nextRound);
        backButton.addEventListener('click', () => {
            clearInterval(timer);
            showMethodsView(moduleData);
        });
        
        function startGame() {
            gameStarted = true;
            score = 0;
            currentRound = 0;
            scoreElement.textContent = '0';
            
            // Hide start screen, show gameplay
            startScreenElement.style.display = 'none';
            gameplayElement.style.display = 'block';
            
            // Start the first round
            nextRound();
        }
        
        async function nextRound() {
            if (currentRound >= timeTrialData.length) {
                endGame();
                return;
            }
            
            // Reset UI state
            clearInterval(timer);
            timeLeft = 7;
            timeElement.textContent = timeLeft + 's';
            timeElement.classList.remove('warning');
            feedbackElement.innerHTML = '';
            nextButton.style.display = 'none';
            
            // Update progress
            currentElement.textContent = `${currentRound + 1}/${timeTrialData.length}`;
            
            // Get current item and generate options
            const currentItem = shuffledData[currentRound];
            
            // Display the definition
            definitionElement.textContent = currentItem.definition;
            
            // Check for and display image if available
            if (currentItem.image || moduleData.id) {
                // Try direct image path first, then fallback to standard path
                const hasDirectImage = currentItem.image ? await checkImageExists(currentItem.image) : false;
                const standardPath = getImagePath(moduleData.id, 'time-trial', currentRound);
                const hasStandardImage = await checkImageExists(standardPath);
                
                if (hasDirectImage || hasStandardImage) {
                    const imagePath = hasDirectImage ? currentItem.image : standardPath;
                    imageElement.src = imagePath;
                    imageElement.alt = currentItem.imageAlt || `Image for ${currentItem.term}`;
                    imageContainer.style.display = 'block';
                } else {
                    imageContainer.style.display = 'none';
                }
            } else {
                imageContainer.style.display = 'none';
            }
            
            // Generate options
            generateOptions(currentItem);
            
            // Start the timer
            startTimer();
            
            // Increment round counter
            currentRound++;
        }
        
        function generateOptions(currentItem) {
            // Clear previous options
            optionsElement.innerHTML = '';
            
            // Get 3 random distractors (different from the correct one)
            const distractors = timeTrialData
                .filter(item => item.term !== currentItem.term)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
                
            // Combine correct option with distractors and shuffle
            const options = [currentItem, ...distractors].sort(() => Math.random() - 0.5);
            
            // Create option buttons
            options.forEach(option => {
                const optionButton = document.createElement('button');
                optionButton.className = 'time-trial-option';
                optionButton.textContent = option.term;
                optionButton.dataset.term = option.term;
                optionButton.addEventListener('click', () => selectOption(option.term, currentItem.term));
                optionsElement.appendChild(optionButton);
            });
        }
        
        function selectOption(selectedTerm, correctTerm) {
            // Stop the timer
            clearInterval(timer);
            
            // Disable all options
            const options = document.querySelectorAll('.time-trial-option');
            options.forEach(option => {
                option.disabled = true;
                if (option.dataset.term === correctTerm) {
                    option.classList.add('correct');
                } else if (option.dataset.term === selectedTerm && selectedTerm !== correctTerm) {
                    option.classList.add('incorrect');
                }
            });
            
            // Check if answer is correct
            const isCorrect = selectedTerm === correctTerm;
            
            // Update score if correct
            if (isCorrect) {
                score++;
                scoreElement.textContent = score;
                feedbackElement.innerHTML = '<div class="feedback-correct">Correct!</div>';
            } else {
                feedbackElement.innerHTML = `<div class="feedback-incorrect">Incorrect! The correct answer was: ${correctTerm}</div>`;
            }
            
            // Show next button
            nextButton.style.display = 'block';
            
            // Auto-advance if it's the last question
            if (currentRound >= timeTrialData.length) {
                setTimeout(endGame, 1500);
            }
        }
        
        function startTimer() {
            timer = setInterval(() => {
                timeLeft--;
                timeElement.textContent = timeLeft + 's';
                
                if (timeLeft <= 3) {
                    timeElement.classList.add('warning');
                } else {
                    timeElement.classList.remove('warning');
                }
                
                if (timeLeft <= 0) {
                    timeOut();
                }
            }, 1000);
        }
        
        function timeOut() {
            clearInterval(timer);
            
            // Get the current item
            const currentItem = shuffledData[currentRound - 1];
            
            // Highlight the correct answer
            const options = document.querySelectorAll('.time-trial-option');
            options.forEach(option => {
                option.disabled = true;
                if (option.dataset.term === currentItem.term) {
                    option.classList.add('correct');
                }
            });
            
            feedbackElement.innerHTML = `<div class="feedback-timeout">Time's up! The correct answer was: ${currentItem.term}</div>`;
            
            // Show next button
            nextButton.style.display = 'block';
            
            // Auto-advance if it's the last question
            if (currentRound >= timeTrialData.length) {
                setTimeout(endGame, 1500);
            }
        }
        
        function endGame() {
            // Clear any running timer
            clearInterval(timer);
            
            const percentage = Math.round((score / timeTrialData.length) * 100);
            
            // Display final score and game over message
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleData.title} - Time Trial</h2>
                </div>
                
                <div class="content-container">
                    <div class="time-trial-results">
                        <div class="quiz-score">${score} / ${timeTrialData.length}</div>
                        <div class="quiz-percentage">${percentage}%</div>
                        ${score === timeTrialData.length ? 
                            '<div class="quiz-perfect">Perfect Score! 🎉</div>' : 
                            '<p>Keep practicing to improve your speed and accuracy!</p>'}
                        
                        <div class="quiz-actions">
                            <button id="time-trial-replay" class="btn btn-primary">Play Again</button>
                            <button id="back-to-methods" class="btn">Back to Methods</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('time-trial-replay').addEventListener('click', () => {
                initTimeTrialGame(moduleData);
            });
            
            document.getElementById('back-to-methods').addEventListener('click', () => {
                showMethodsView(moduleData);
            });
        }
    }
    
    // True-False Questions Implementation
    async function initTrueFalseQuestions(moduleData) {
        const trueFalseData = moduleData.content['true-false'];
        let score = 0;
        let currentQuestionIndex = 0;
        let userAnswers = [];
        
        // Create the UI
        contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - True or False</h2>
                <span class="progress-indicator">Question <span id="true-false-current">1</span> of ${trueFalseData.length}</span>
            </div>
            
            <div class="content-container">
                <div class="true-false-container">
                    <div class="true-false-statement" id="true-false-statement"></div>
                    
                    <div id="true-false-image-container" class="true-false-image-container" style="display: none;">
                        <img id="true-false-image" src="" alt="True/False question image" class="true-false-image">
                    </div>
                    
                    <div class="true-false-options">
                        <button id="true-button" class="btn btn-true">TRUE</button>
                        <button id="false-button" class="btn btn-false">FALSE</button>
                    </div>
                    
                    <div class="true-false-feedback" id="true-false-feedback"></div>
                </div>
                
                <div class="quiz-controls">
                    <button id="true-false-next" class="btn btn-primary" style="display: none;">Next Question</button>
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
        
        const currentElement = document.getElementById('true-false-current');
        const statementElement = document.getElementById('true-false-statement');
        const trueButton = document.getElementById('true-button');
        const falseButton = document.getElementById('false-button');
        const feedbackElement = document.getElementById('true-false-feedback');
        const nextButton = document.getElementById('true-false-next');
        const backButton = document.getElementById('back-to-methods');
        const imageContainer = document.getElementById('true-false-image-container');
        const imageElement = document.getElementById('true-false-image');
        
        // Initialize
        const shuffledData = [...trueFalseData].sort(() => Math.random() - 0.5);
        await loadQuestion();
        
        // Add event listeners
        trueButton.addEventListener('click', () => selectAnswer(true));
        falseButton.addEventListener('click', () => selectAnswer(false));
        nextButton.addEventListener('click', nextQuestion);
        backButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
                showMethodsView(moduleData);
            }
        });
        
        async function loadQuestion() {
            const questionData = shuffledData[currentQuestionIndex];
            
            // Update statement
            statementElement.textContent = questionData.statement;
            
            // Check for image
            if (questionData.image || moduleData.id) {
                // Try direct image path first, then fallback to standard path
                const hasDirectImage = questionData.image ? await checkImageExists(questionData.image) : false;
                const standardPath = getImagePath(moduleData.id, 'true-false', currentQuestionIndex);
                const hasStandardImage = await checkImageExists(standardPath);
                
                if (hasDirectImage || hasStandardImage) {
                    const imagePath = hasDirectImage ? questionData.image : standardPath;
                    imageElement.src = imagePath;
                    imageElement.alt = questionData.imageAlt || `Image for statement ${currentQuestionIndex + 1}`;
                    imageContainer.style.display = 'block';
                } else {
                    imageContainer.style.display = 'none';
                }
            } else {
                imageContainer.style.display = 'none';
            }
            
            // Update progress
            currentElement.textContent = currentQuestionIndex + 1;
            
            // Reset buttons
            trueButton.disabled = false;
            falseButton.disabled = false;
            trueButton.classList.remove('selected');
            falseButton.classList.remove('selected');
            
            // Hide feedback and next button
            feedbackElement.classList.remove('visible');
            nextButton.style.display = 'none';
        }
        
        function selectAnswer(userAnswer) {
            const questionData = shuffledData[currentQuestionIndex];
            const isCorrect = userAnswer === questionData.isTrue;
            
            // Update UI to show selected answer
            if (userAnswer) {
                trueButton.classList.add('selected');
            } else {
                falseButton.classList.add('selected');
            }
            
            // Disable buttons
            trueButton.disabled = true;
            falseButton.disabled = true;
            
            // Show feedback
            if (isCorrect) {
                score++;
                feedbackElement.innerHTML = `
                    <div class="feedback-header">Correct!</div>
                    <div class="feedback-content">${questionData.explanation}</div>
                `;
            } else {
                feedbackElement.innerHTML = `
                    <div class="feedback-header">Incorrect!</div>
                    <div class="feedback-content">${questionData.explanation}</div>
                `;
            }
            
            feedbackElement.classList.add('visible');
            
            // Show next button
            nextButton.style.display = 'block';
            
            // Save user's answer
            userAnswers[currentQuestionIndex] = {
                userAnswer,
                isCorrect
            };
        }
        
        async function nextQuestion() {
            currentQuestionIndex++;
            
            if (currentQuestionIndex >= shuffledData.length) {
                showResults();
                return;
            }
            
            await loadQuestion();
        }
        
        function showResults() {
            // Calculate final score
            const percentage = Math.round((score / trueFalseData.length) * 100);
            
            // Display results
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleData.title} - True or False Results</h2>
                </div>
                
                <div class="content-container">
                    <div class="time-trial-results">
                        <div class="quiz-score">${score} / ${trueFalseData.length}</div>
                        <div class="quiz-percentage">${percentage}%</div>
                        ${score === trueFalseData.length ? 
                            '<div class="quiz-perfect">Perfect Score! 🎉</div>' : 
                            '<p>Keep learning to improve your knowledge!</p>'}
                        
                        <div class="quiz-actions">
                            <button id="true-false-review" class="btn btn-primary">Review Answers</button>
                            <button id="true-false-replay" class="btn">Try Again</button>
                            <button id="back-to-methods" class="btn">Back to Methods</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('true-false-review').addEventListener('click', showReview);
            document.getElementById('true-false-replay').addEventListener('click', () => {
                initTrueFalseQuestions(moduleData);
            });
            document.getElementById('back-to-methods').addEventListener('click', () => {
                showMethodsView(moduleData);
            });
        }
        
        async function showReview() {
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleData.title} - True or False Review</h2>
                </div>
                
                <div class="content-container" id="review-container">
                    <!-- Review items will be added here -->
                </div>
                
                <button id="back-to-results" class="btn">
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5"/>
                        <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Results
                </button>
            `;
            
            const reviewContainer = document.getElementById('review-container');
            
            // Add review items
            for (let index = 0; index < shuffledData.length; index++) {
                const question = shuffledData[index];
                const userAnswer = userAnswers[index];
                
                // Check for image
                let imageHtml = '';
                if (question.image || moduleData.id) {
                    // Try direct image path first, then fallback to standard path
                    const hasDirectImage = question.image ? await checkImageExists(question.image) : false;
                    const standardPath = getImagePath(moduleData.id, 'true-false', index);
                    const hasStandardImage = await checkImageExists(standardPath);
                    
                    if (hasDirectImage || hasStandardImage) {
                        const imagePath = hasDirectImage ? question.image : standardPath;
                        imageHtml = `
                            <div class="review-image-container">
                                <img src="${imagePath}" alt="${question.imageAlt || `Image for statement ${index + 1}`}" class="review-image">
                            </div>
                        `;
                    }
                }
                
                // Create review item
                const reviewItem = document.createElement('div');
                reviewItem.className = `review-item ${userAnswer && userAnswer.isCorrect ? 'correct' : 'incorrect'}`;
                reviewItem.innerHTML = `
                    <div class="review-statement">${index + 1}. ${question.statement}</div>
                    ${imageHtml}
                    <div class="review-details">
                        <div class="review-answer">Correct answer: <strong>${question.isTrue ? 'TRUE' : 'FALSE'}</strong></div>
                        ${userAnswer ? `<div class="review-answer">Your answer: <strong>${userAnswer.userAnswer ? 'TRUE' : 'FALSE'}</strong></div>` : ''}
                        <div class="review-explanation">${question.explanation}</div>
                    </div>
                `;
                
                reviewContainer.appendChild(reviewItem);
            }
            
            // Add back button listener
            document.getElementById('back-to-results').addEventListener('click', showResults);
        }
    }
});