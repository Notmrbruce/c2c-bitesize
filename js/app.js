// START OF FILE: js/app.js --- REPLACE ENTIRE FILE ---

import { loadModulesList, loadModuleData, getImagePath, checkImageExists } from './module-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modulesView = document.getElementById('modules-view');
    const methodsView = document.getElementById('methods-view');
    const contentView = document.getElementById('content-view');
    const modulesList = document.getElementById('modules-list');
    const modulesLoading = document.getElementById('modules-loading'); // Get loading indicator
    const selectedModuleTitle = document.getElementById('selected-module-title');
    const methodButtons = document.getElementById('method-buttons');
    const breadcrumbModule = document.getElementById('breadcrumb-module');
    const breadcrumbItem = document.getElementById('breadcrumb-item');
    const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
    const methodDescriptionElement = document.getElementById('method-description');

    // App state
    let currentModule = null;

    // Method descriptions and icons (as before)
    const methodInfo = {
        'flashcards': { description: 'Flip through digital cards to test your recall of key information. Tap or click to reveal the answer.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8"/><path d="M8 12h8"/></svg>'},
        'quiz': { description: 'Test your knowledge with multiple-choice questions and get immediate feedback on your answers.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'},
        'time-trial': { description: 'Race against the clock to match terms with their definitions. Challenge yourself to recall information quickly.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'},
        'true-false': { description: 'Determine whether statements are true or false and learn the reasoning behind each answer.', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'}
    };

    // Initialize the application
    init();

    // --- Core Functions ---
    async function init() {
        // Initial view setup: Hide all views first
        if (modulesView) modulesView.classList.add('view-hidden');
        if (methodsView) methodsView.classList.add('view-hidden');
        if (contentView) contentView.classList.add('view-hidden');

        await loadModules(); // Load modules list
        showModulesView(); // Show the initial view
        animateElements(); // Trigger animations for elements (can be added if needed)
         // Add loaded class to body once everything is ready
        document.body.classList.add('loaded');
    }

    function animateElements() {
        // Optional: Add animation classes dynamically if needed, e.g., based on visibility
        // For now, CSS handles entry animation via .view-visible
    }

    async function loadModules() {
        // NEW: Loading indicator logic
        if (modulesLoading) modulesLoading.style.display = 'flex';
        if (modulesList) modulesList.innerHTML = ''; // Clear potential stale content

        try {
            const modules = await loadModulesList();
            if (modulesLoading) modulesLoading.style.display = 'none'; // Hide indicator

            if (!modules || modules.length === 0) {
                if (modulesList) modulesList.innerHTML = '<p>No learning modules found. Please check the data source.</p>';
                return;
            }

            modules.forEach(module => {
                const moduleElement = createModuleElement(module);
                if (modulesList) modulesList.appendChild(moduleElement);
            });
        } catch (error) {
            console.error('Error loading modules:', error);
            if (modulesLoading) modulesLoading.style.display = 'none'; // Hide on error
            if (modulesList) modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
        }
    }

    function createModuleElement(module) {
        const moduleElement = document.createElement('div');
        moduleElement.className = 'module-card';
        moduleElement.innerHTML = `
            <h3 class="module-title">${module.title || 'Untitled Module'}</h3>
            <p class="module-desc">${module.description || 'No description available.'}</p>`;
        moduleElement.addEventListener('click', () => loadSelectedModule(module.id));
        return moduleElement;
    }

    async function loadSelectedModule(moduleId) {
        // Optional: Add loading indicator to methodsView or block interaction briefly
        try {
            console.log(`Loading processed module data for ID: ${moduleId}`);
            const moduleData = await loadModuleData(moduleId);
            if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
                console.warn(`Module ${moduleId} has no available study methods.`);
                alert(`The module '${moduleData?.title || moduleId}' has no available study content.`);
                return;
            }
            console.log('Processed module data loaded:', moduleData);
            currentModule = moduleData;
            showMethodsView(moduleData);
        } catch (error) {
            console.error(`Error loading processed module ${moduleId}:`, error);
            alert(`Error loading module content for ${moduleId}. Please try again later.`);
            // Optional: Show modules view again if loading fails
            showModulesView();
        } finally {
            // Hide loading indicator if one was added
        }
    }

    // --- View Switching Functions (with class changes) ---
    function showView(viewToShow) {
        const views = [modulesView, methodsView, contentView];
        views.forEach(view => {
            if (view) {
                if (view === viewToShow) {
                    view.classList.remove('view-hidden');
                    view.classList.add('view-visible'); // Trigger enter animation
                } else {
                    view.classList.add('view-hidden');
                    view.classList.remove('view-visible');
                }
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showModulesView() {
        showView(modulesView);
        // Reset breadcrumbs
        if (breadcrumbItem) breadcrumbItem.style.display = 'none';
        if (mobileBreadcrumb) mobileBreadcrumb.style.display = 'none';
    }

    function showMethodsView(moduleData) {
        if (!moduleData || !selectedModuleTitle || !methodDescriptionElement || !methodButtons) {
            console.error("Cannot show methods view - elements missing or no data.");
            return;
        }
        selectedModuleTitle.textContent = moduleData.title;

        // Update breadcrumb
        if (breadcrumbModule && breadcrumbItem && mobileBreadcrumb) {
            breadcrumbModule.textContent = moduleData.title;
            breadcrumbItem.style.display = 'block'; // Needs style control, not class here
            mobileBreadcrumb.style.display = 'block'; // Needs style control
            mobileBreadcrumb.textContent = moduleData.title;
            const handler = (e) => { e.preventDefault(); showMethodsView(currentModule); };
            breadcrumbModule.onclick = handler;
            mobileBreadcrumb.onclick = handler;
        }

        createMethodButtons(moduleData);
        methodDescriptionElement.textContent = 'Select a study method to begin';
        showView(methodsView);
    }

    function createMethodButtons(moduleData) {
         methodButtons.innerHTML = '';
         if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
             methodButtons.innerHTML = '<p>No study methods available.</p>';
             return;
         }
        moduleData.methods.forEach(methodKey => {
            const info = methodInfo[methodKey] || { description: `Learn with ${methodKey}`, icon: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>'}; // Generic icon fallback
            let methodName = methodKey.charAt(0).toUpperCase() + methodKey.slice(1).replace('-', ' ');
            if (methodKey === 'true-false') methodName = 'True or False';
            const button = document.createElement('button');
            button.className = 'method-button';
            button.id = `${methodKey}-button`;
            button.innerHTML = `
                <div class="method-icon">${info.icon}</div>
                <div class="method-content">
                    <div class="method-title">${methodName}</div>
                    <div class="method-desc">${info.description}</div>
                </div>`;
            button.addEventListener('click', () => loadStudyMethod(moduleData, methodKey));
            methodButtons.appendChild(button);
        });
    }

    function loadStudyMethod(moduleData, method) {
        contentView.innerHTML = `<div class="loading-indicator"><div class="spinner"></div></div>`; // Show loader immediately
        showView(contentView); // Show the content view area

        const methodContentData = moduleData.content ? moduleData.content[method] : null;

        // Use a short timeout to allow the loading indicator to render before heavy work
        setTimeout(async () => { // Make inner function async for awaits in study methods
            if (!methodContentData || !Array.isArray(methodContentData) || methodContentData.length === 0) {
                console.warn(`No content found for method "${method}" in module "${moduleData.title}".`);
                contentView.innerHTML = `<div class="content-container"><p>No content available for "${method}".</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                const backBtn = document.getElementById('back-to-methods');
                if (backBtn) backBtn.addEventListener('click', () => showMethodsView(currentModule));
                return;
            }

            // Call appropriate method loader - Ensure these functions set contentView.innerHTML
            try {
                switch (method) {
                    case 'flashcards': await loadFlashcards(moduleData.title, methodContentData); break;
                    case 'quiz': await loadQuiz(moduleData.title, methodContentData); break;
                    case 'time-trial': await initTimeTrialGame(moduleData.title, methodContentData); break;
                    case 'true-false': await initTrueFalseQuestions(moduleData.title, methodContentData); break;
                    default:
                        console.error(`Study method "${method}" loading function not implemented.`);
                        contentView.innerHTML = `<div class="content-container"><p>Method "${method}" not ready.</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                        const backBtnDef = document.getElementById('back-to-methods');
                        if (backBtnDef) backBtnDef.addEventListener('click', () => showMethodsView(currentModule));
                }
            } catch(error) {
                 console.error(`Error loading study method ${method}:`, error);
                 contentView.innerHTML = `<div class="content-container"><p>Error loading content for "${method}".</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                 const backBtnErr = document.getElementById('back-to-methods');
                 if (backBtnErr) backBtnErr.addEventListener('click', () => showMethodsView(currentModule));
            }
        }, 50); // Short delay (e.g., 50ms)
    }


    // --- Study Method Implementations (remain structurally the same as provided last) ---
    // Make sure the *inner* logic of these functions correctly replaces contentView.innerHTML
    // Ensure they attach listeners to buttons *within* the newly created content

    async function loadFlashcards(moduleTitle, flashcardsData) { /* ... Implementation as before ... */
        let currentCardIndex = 0;
        // Use contentView.innerHTML = `...` to set the layout
        // Remember to attach listeners to newly created buttons (#prev-card, #next-card etc.) inside this function
        contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - Flashcards</h2>
                <span class="progress-indicator">Card <span id="current-card-number">1</span> of ${flashcardsData.length}</span>
            </div>
            <div class="content-container">
                <div class="flashcard" id="current-flashcard">
                    <div class="card-indicator">Click to flip</div>
                    <div class="flashcard-question" id="flashcard-question-content"></div>
                    <div class="flashcard-answer" id="flashcard-answer-content"></div>
                </div>
                <div id="flashcard-image-container" class="flashcard-image-container" style="display: none;">
                    <img id="flashcard-image" src="" alt="Flashcard image" class="flashcard-image">
                </div>
                <div class="card-controls">
                    <button id="prev-card" class="btn">Previous</button>
                    <button id="flip-card" class="btn btn-primary">Flip Card</button>
                    <button id="next-card" class="btn">Next</button>
                </div>
            </div>
            <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`;

        const flashcardElement = document.getElementById('current-flashcard');
        const prevButton = document.getElementById('prev-card');
        const nextButton = document.getElementById('next-card');
        const flipButton = document.getElementById('flip-card');
        const backButton = document.getElementById('back-to-methods');
        const cardNumberElement = document.getElementById('current-card-number');
        const imageContainer = document.getElementById('flashcard-image-container');
        const imageElement = document.getElementById('flashcard-image');

        const updateFlashcard = async () => {
            if (currentCardIndex < 0 || currentCardIndex >= flashcardsData.length) return;
            const card = flashcardsData[currentCardIndex];
            document.getElementById('flashcard-question-content').textContent = card.question;
            document.getElementById('flashcard-answer-content').textContent = card.answer;
            cardNumberElement.textContent = currentCardIndex + 1;
            flashcardElement.classList.remove('flipped');
            const imagePath = card.image;
            const imageExists = await checkImageExists(imagePath);
            if (imageExists && imageContainer && imageElement) {
                imageElement.src = imagePath;
                imageElement.alt = card.imageAlt || `Image for ${card.question}`;
                imageContainer.style.display = (card.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
            } else if (imageContainer) {
                imageContainer.style.display = 'none';
            }
            prevButton.disabled = currentCardIndex === 0;
            nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
        };

        const toggleFlashcard = () => {
            flashcardElement.classList.toggle('flipped');
            const card = flashcardsData[currentCardIndex];
            if (imageContainer && imageElement && imageElement.src && card.imageDisplayTiming === "after-answer") {
                imageContainer.style.display = flashcardElement.classList.contains('flipped') ? 'block' : 'none';
            }
        };

        flashcardElement.addEventListener('click', toggleFlashcard);
        flipButton.addEventListener('click', toggleFlashcard);
        prevButton.addEventListener('click', async () => { if (currentCardIndex > 0) { currentCardIndex--; await updateFlashcard(); } });
        nextButton.addEventListener('click', async () => { if (currentCardIndex < flashcardsData.length - 1) { currentCardIndex++; await updateFlashcard(); } });
        backButton.addEventListener('click', () => showMethodsView(currentModule));
        await updateFlashcard();
    }

    async function loadQuiz(moduleTitle, quizData) { /* ... Implementation as before ... */
        let currentQuestionIndex = 0;
        let score = 0;
        let userAnswers = new Array(quizData.length).fill(null);

        const showQuizResults = () => {
            const percentage = quizData.length > 0 ? Math.round((score / quizData.length) * 100) : 0;
            contentView.innerHTML = `
               <div class="content-header"><h2 class="content-title">${moduleTitle} - Quiz Results</h2></div>
               <div class="content-container"><div class="quiz-results">
                   <div class="quiz-score">${score} / ${quizData.length}</div><div class="quiz-percentage">${percentage}%</div>
                   ${score === quizData.length ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Review or retry!</p>'}
                   <div class="quiz-actions"><button id="review-quiz" class="btn btn-primary">Review</button><button id="retry-quiz" class="btn">Retry</button><button id="back-to-methods" class="btn">Methods</button></div>
               </div></div>`;
            document.getElementById('review-quiz').addEventListener('click', showQuizReview);
            document.getElementById('retry-quiz').addEventListener('click', () => loadQuiz(moduleTitle, quizData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const showQuizReview = async () => {
            contentView.innerHTML = `
               <div class="content-header"><h2 class="content-title">${moduleTitle} - Quiz Review</h2></div>
               <div class="content-container" id="review-container"></div>
               <button id="back-to-results" class="btn">Back to Results</button>`;
           const reviewContainer = document.getElementById('review-container');
           for (let i = 0; i < quizData.length; i++) { /* ... rest of review rendering ... */
                const question = quizData[i];
                 const userAnswerIndex = userAnswers[i];
                 const isCorrect = userAnswerIndex === question.correctAnswer;
                 const imagePath = question.image;
                 const imageExists = await checkImageExists(imagePath);
                 const reviewItem = document.createElement('div');
                 reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
                 reviewItem.innerHTML = `
                    <div class="review-statement">${i + 1}. ${question.question}</div>
                    ${imageExists ? `<div class="review-image-container"><img src="${imagePath}" alt="${question.imageAlt || 'Review image'}" class="review-image"></div>` : ''}
                    <div class="review-details">
                        <div class="review-answer">Your answer: ${userAnswerIndex !== null ? `<strong>${question.options[userAnswerIndex]}</strong>` : 'Not answered'}</div>
                        <div class="review-answer">Correct answer: ${question.options[question.correctAnswer]}</div>
                    </div>`;
                reviewContainer.appendChild(reviewItem);
            }
            document.getElementById('back-to-results').addEventListener('click', showQuizResults);
        };

        const loadQuestion = async () => {
            if (currentQuestionIndex < 0 || currentQuestionIndex >= quizData.length) return;
             const questionData = quizData[currentQuestionIndex];
             const imagePath = questionData.image;
             const imageExists = await checkImageExists(imagePath);
             // Important: Set innerHTML for the contentView which is the parent for all quiz elements
             contentView.innerHTML = `
                <div class="content-header">
                     <h2 class="content-title">${moduleTitle} - Quiz</h2>
                     <span class="progress-indicator">Question <span id="current-question-number">${currentQuestionIndex + 1}</span> of ${quizData.length}</span>
                 </div>
                 <div class="content-container">
                     <div class="quiz-container" id="quiz-container">
                         <div class="quiz-question">${questionData.question}</div>
                         <div id="quiz-image-container" class="quiz-image-container" style="display: ${imageExists && questionData.imageDisplayTiming !== 'after-answer' ? 'block' : 'none'};">
                            <img id="quiz-image" src="${imageExists ? imagePath : ''}" alt="${imageExists ? questionData.imageAlt || 'Quiz image' : ''}" class="quiz-image">
                         </div>
                         <ul class="quiz-options" id="quiz-options"></ul>
                         <div id="answer-feedback" class="true-false-feedback" style="display: none;"></div>
                     </div>
                     <div class="quiz-controls">
                        <button id="prev-question" class="btn" ${currentQuestionIndex === 0 ? 'disabled' : ''}>Previous</button>
                        <button id="next-question" class="btn">${currentQuestionIndex === quizData.length - 1 ? 'Submit' : 'Next'}</button>
                    </div>
                 </div>
                 <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`;

             const optionsElement = document.getElementById('quiz-options');
             const feedbackElement = document.getElementById('answer-feedback');
             const imageContainer = document.getElementById('quiz-image-container');
             //const imageElement = document.getElementById('quiz-image'); // No need for direct ref here

            questionData.options.forEach((option, index) => {
                const optionElement = createOptionElement(option, index);
                 optionsElement.appendChild(optionElement);
             });

            // Re-attach nav listeners AFTER innerHTML is set
            document.getElementById('prev-question').addEventListener('click', async () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; await loadQuestion(); } });
            document.getElementById('next-question').addEventListener('click', async () => { if (currentQuestionIndex < quizData.length - 1) { currentQuestionIndex++; await loadQuestion(); } else { showQuizResults(); } });
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        // Helper to create option elements and attach listener
        const createOptionElement = (optionText, index) => {
             const optionElement = document.createElement('li');
             optionElement.className = 'quiz-option';
             optionElement.textContent = optionText;
             const isAnswered = userAnswers[currentQuestionIndex] !== null;

             if (isAnswered) { // If reviewing or navigating back
                 optionElement.style.pointerEvents = 'none';
                 if (userAnswers[currentQuestionIndex] === index) {
                    optionElement.classList.add('selected');
                    // Optionally highlight correct/incorrect state if reviewing
                    // if(index !== quizData[currentQuestionIndex].correctAnswer) optionElement.style.borderColor = 'red'; // Example
                }
             } else { // Only add click listener if question is not yet answered
                optionElement.addEventListener('click', async () => {
                     if (userAnswers[currentQuestionIndex] !== null) return; // Prevent re-answer

                    // Mark selection and update state
                    document.querySelectorAll('.quiz-option').forEach(el => {
                         el.classList.remove('selected');
                         el.style.pointerEvents = 'none'; // Disable all after selection
                    });
                    optionElement.classList.add('selected');
                    userAnswers[currentQuestionIndex] = index;
                    const questionData = quizData[currentQuestionIndex];
                    const isCorrect = index === questionData.correctAnswer;
                    if (isCorrect) score++;

                    // Show feedback
                    const feedbackElement = document.getElementById('answer-feedback'); // Get feedback element again
                    const imageContainer = document.getElementById('quiz-image-container'); // Get image container again
                    if (feedbackElement) {
                         feedbackElement.innerHTML = isCorrect ? '<div class="feedback-header">Correct!</div>' : `<div class="feedback-header">Incorrect! Correct: ${questionData.options[questionData.correctAnswer]}</div>`;
                         feedbackElement.className = `true-false-feedback visible ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
                         feedbackElement.style.display = 'block';
                    }
                    // Show image after answer?
                    const imagePath = questionData.image;
                    const imageExists = await checkImageExists(imagePath);
                    if(imageExists && questionData.imageDisplayTiming === 'after-answer' && imageContainer) {
                        document.getElementById('quiz-image').src = imagePath; // Set src
                        document.getElementById('quiz-image').alt = questionData.imageAlt || 'Quiz image';
                        imageContainer.style.display = 'block';
                    }
                 });
             }
             return optionElement;
         };

        await loadQuestion(); // Initial load
     }


    async function initTimeTrialGame(moduleTitle, timeTrialData) { /* ... Implementation as before ... */
         let score = 0;
         let currentRound = 0;
         let timer;
         let timeLeft = 7;
         const totalRounds = timeTrialData.length;
         let isRoundActive = false;

        const updateTimerDisplay = () => { /* ... */
            const timeElement = document.getElementById('time-trial-time');
           if(timeElement) { timeElement.textContent = timeLeft + 's'; timeElement.classList.toggle('warning', timeLeft <= 3); }
        };
        const endGame = () => { /* ... */
             clearInterval(timer); isRoundActive = false; const percentage = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;
             contentView.innerHTML = `
               <div class="content-header"><h2 class="content-title">${moduleTitle} - Time Trial Results</h2></div>
               <div class="content-container"><div class="time-trial-results">
                   <div class="quiz-score">${score} / ${totalRounds}</div><div class="quiz-percentage">${percentage}%</div>
                   ${score === totalRounds ? '<div class="quiz-perfect">Perfect!</div>' : '<p>Practice makes perfect!</p>'}
                   <div class="quiz-actions"><button id="time-trial-replay" class="btn btn-primary">Play Again</button><button id="back-to-methods" class="btn">Methods</button></div>
               </div></div>`;
             document.getElementById('time-trial-replay').addEventListener('click', () => initTimeTrialGame(moduleTitle, timeTrialData));
             document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
         };
        const timeOut = async () => { /* ... */
            if (!isRoundActive) return; clearInterval(timer); isRoundActive = false;
             const currentItem = timeTrialData[currentRound - 1];
             const feedbackElement = document.getElementById('time-trial-feedback');
             const options = document.querySelectorAll('.time-trial-option');
             const nextButton = document.getElementById('time-trial-next');
             const imageContainer = document.getElementById('time-trial-image-container');
             const imageElement = document.getElementById('time-trial-image');
            options.forEach(option => { option.disabled = true; if (option.dataset.term === currentItem.term) option.classList.add('correct'); });
             if (feedbackElement) feedbackElement.innerHTML = `<div class="feedback-timeout">Time's up! Correct: ${currentItem.term}</div>`;

             if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                  const imagePath = currentItem.image; const exists = await checkImageExists(imagePath);
                  if(exists) { imageElement.src = imagePath; imageElement.alt = currentItem.imageAlt || 'Image'; imageContainer.style.display = 'block';}
             }
             if (nextButton) {
                nextButton.style.display = 'block';
                if (currentRound >= totalRounds) { nextButton.textContent = "Show Results"; nextButton.onclick = endGame; }
                else { nextButton.textContent = "Next Term"; nextButton.onclick = nextRound; }
             }
        };
        const startTimer = () => { /* ... */
            timeLeft = 7; isRoundActive = true; updateTimerDisplay(); clearInterval(timer);
            timer = setInterval(() => { if (!isRoundActive) { clearInterval(timer); return; } timeLeft--; updateTimerDisplay(); if (timeLeft <= 0) { timeOut(); } }, 1000);
        };
        const selectOption = async (selectedTerm) => { /* ... */
            if (!isRoundActive) return; isRoundActive = false; clearInterval(timer);
             const currentItem = timeTrialData[currentRound - 1]; const correctTerm = currentItem.term;
            const isCorrect = selectedTerm === correctTerm;
            const feedbackElement = document.getElementById('time-trial-feedback'); const options = document.querySelectorAll('.time-trial-option'); const nextButton = document.getElementById('time-trial-next'); const scoreElement = document.getElementById('time-trial-score'); const imageContainer = document.getElementById('time-trial-image-container'); const imageElement = document.getElementById('time-trial-image');
            options.forEach(option => { option.disabled = true; if (option.dataset.term === correctTerm) option.classList.add('correct'); if (option.dataset.term === selectedTerm && !isCorrect) option.classList.add('incorrect'); });
            if (isCorrect) { score++; if (scoreElement) scoreElement.textContent = score; }
            if (feedbackElement) feedbackElement.innerHTML = isCorrect ? '<div class="feedback-correct">Correct!</div>' : `<div class="feedback-incorrect">Incorrect! Correct: ${correctTerm}</div>`;

             if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                 const imagePath = currentItem.image; const imageExists = await checkImageExists(imagePath);
                 if (imageExists) { imageElement.src = imagePath; imageElement.alt = currentItem.imageAlt || 'Image'; imageContainer.style.display = 'block'; }
             }
            if (nextButton) {
                 nextButton.style.display = 'block';
                if (currentRound >= totalRounds) { nextButton.textContent = "Show Results"; nextButton.onclick = endGame; }
                 else { nextButton.textContent = "Next Term"; nextButton.onclick = nextRound; }
            }
        };
         const nextRound = async () => { /* ... */
            if (currentRound >= totalRounds) { endGame(); return; }
             const currentItem = timeTrialData[currentRound]; const definitionElement = document.getElementById('time-trial-definition'); const optionsElement = document.getElementById('time-trial-options'); const feedbackElement = document.getElementById('time-trial-feedback'); const nextButton = document.getElementById('time-trial-next'); const currentElement = document.getElementById('time-trial-current'); const imageContainer = document.getElementById('time-trial-image-container'); const imageElement = document.getElementById('time-trial-image');
            if(feedbackElement) feedbackElement.innerHTML = ''; if(nextButton) nextButton.style.display = 'none'; if(currentElement) currentElement.textContent = `${currentRound + 1}/${totalRounds}`; if(definitionElement) definitionElement.textContent = currentItem.definition;
            const imagePath = currentItem.image; const imageExists = await checkImageExists(imagePath);
            if (imageContainer && imageElement) {
                if (imageExists) { imageElement.src = imagePath; imageElement.alt = currentItem.imageAlt || `Image for ${currentItem.term}`; imageContainer.style.display = (currentItem.imageDisplayTiming !== "after-answer") ? 'block' : 'none'; }
                else { imageContainer.style.display = 'none'; }
             }
            const distractors = timeTrialData.map(item => item.term).filter(term => term !== currentItem.term).sort(() => 0.5 - Math.random()).slice(0, 3); const optionsTerms = [currentItem.term, ...distractors].sort(() => 0.5 - Math.random());
             if (optionsElement) { optionsElement.innerHTML = ''; optionsTerms.forEach(term => { const optionButton = document.createElement('button'); optionButton.className = 'time-trial-option'; optionButton.textContent = term; optionButton.dataset.term = term; optionButton.addEventListener('click', () => selectOption(term)); optionsElement.appendChild(optionButton); }); }
            currentRound++; startTimer();
         };
        const startGame = () => { /* ... */
             score = 0; currentRound = 0; document.getElementById('time-trial-score').textContent = '0'; document.getElementById('time-trial-start-screen').style.display = 'none'; document.getElementById('time-trial-gameplay').style.display = 'block'; nextRound();
         };

         // Initial Time Trial UI (cleaned)
         contentView.innerHTML = `
             <div class="content-header"><h2 class="content-title">${moduleTitle} - Time Trial</h2></div>
             <div class="content-container">
                 <div class="time-trial-header"><div class="time-trial-info"><div class="info-item"><div class="info-label">Score</div><div class="info-value" id="time-trial-score">0</div></div><div class="info-item"><div class="info-label">Time</div><div class="info-value time-value" id="time-trial-time">7s</div></div><div class="info-item"><div class="info-label">Q</div><div class="info-value" id="time-trial-current">0/${totalRounds}</div></div></div></div>
                 <div id="time-trial-gameplay" style="display: none;"><div class="time-trial-definition" id="time-trial-definition"></div><div id="time-trial-image-container" class="time-trial-image-container" style="display: none;"><img id="time-trial-image" src="" alt="" class="time-trial-image"></div><div class="time-trial-options" id="time-trial-options"></div><div class="time-trial-feedback" id="time-trial-feedback" style="min-height: 40px;"></div><div class="time-trial-controls" style="margin-top: 1rem; display: flex; justify-content: center;"><button id="time-trial-next" class="btn btn-primary" style="display: none;">Next</button></div></div>
                 <div id="time-trial-start-screen" class="text-center" style="padding: 2rem 0;"><p style="margin-bottom: 1.5rem;">Match definition to term in 7s!</p><button id="time-trial-start" class="btn btn-primary btn-large">Start</button></div>
             </div><button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Methods</button>`;
        document.getElementById('time-trial-start').addEventListener('click', startGame);
        document.getElementById('back-to-methods').addEventListener('click', () => { clearInterval(timer); showMethodsView(currentModule); });
     }

     async function initTrueFalseQuestions(moduleTitle, trueFalseData) { /* ... Implementation as before ... */
         let score = 0; let currentQuestionIndex = 0; let userAnswers = new Array(trueFalseData.length).fill(null); const totalQuestions = trueFalseData.length;
        const showResults = () => { /* ... */
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            contentView.innerHTML = `
               <div class="content-header"><h2 class="content-title">${moduleTitle} - T/F Results</h2></div>
               <div class="content-container"><div class="time-trial-results"><div class="quiz-score">${score}/${totalQuestions}</div><div class="quiz-percentage">${percentage}%</div>
               ${score === totalQuestions ? '<div class="quiz-perfect">Perfect!</div>' : ''}<div class="quiz-actions"><button id="tf-review" class="btn btn-primary">Review</button><button id="tf-replay" class="btn">Retry</button><button id="back-to-methods" class="btn">Methods</button></div></div></div>`;
             document.getElementById('tf-review').addEventListener('click', showReview); document.getElementById('tf-replay').addEventListener('click', () => initTrueFalseQuestions(moduleTitle, trueFalseData)); document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
         };
         const showReview = async () => { /* ... */
            contentView.innerHTML = `
               <div class="content-header"><h2 class="content-title">${moduleTitle} - T/F Review</h2></div><div class="content-container" id="review-container"></div><button id="back-to-results" class="btn">Results</button>`;
             const reviewContainer = document.getElementById('review-container');
            for (let i = 0; i < trueFalseData.length; i++) { const q = trueFalseData[i]; const ans = userAnswers[i]; const imgPath = q.image; const imgExists = await checkImageExists(imgPath); const item = document.createElement('div'); item.className = `review-item ${ans && ans.isCorrect ? 'correct' : 'incorrect'}`; item.innerHTML = `<div class="review-statement">${i + 1}. ${q.statement}</div> ${imgExists ? `<div class="r-img-c"><img src="${imgPath}" alt="${q.imageAlt||''}" class="r-img"></div>` : ''} <div class="review-details"><div class="r-ans">Correct: <strong>${q.isTrue?'T':'F'}</strong></div> ${ans ? `<div class="r-ans">Yours: <strong>${ans.userAnswer?'T':'F'}</strong></div>`:''} <div class="review-explanation">${q.explanation||''}</div></div>`; reviewContainer.appendChild(item); } // Simplified class names
            document.getElementById('back-to-results').addEventListener('click', showResults);
         };
         const nextQuestion = async () => { currentQuestionIndex++; if (currentQuestionIndex >= totalQuestions) { showResults(); } else { await loadQuestion(); } };
        const selectAnswer = async (userAnswer) => { /* ... */
             const questionData = trueFalseData[currentQuestionIndex]; const isCorrect = userAnswer === questionData.isTrue; if (isCorrect) score++; userAnswers[currentQuestionIndex] = { userAnswer, isCorrect };
            const trueBtn=document.getElementById('true-button'); const falseBtn=document.getElementById('false-button'); const feedbackEl=document.getElementById('true-false-feedback'); const nextBtn=document.getElementById('true-false-next'); const imgCont=document.getElementById('true-false-image-container'); const imgEl=document.getElementById('true-false-image');
             if(trueBtn) trueBtn.disabled = true; if(falseBtn) falseBtn.disabled = true; document.getElementById(userAnswer ? 'true-button' : 'false-button').classList.add('selected');
            if (feedbackEl) { feedbackEl.innerHTML = `<div class="fb-hdr" style="color: ${isCorrect?'var(--success)':'var(--error)'};">${isCorrect?'Correct!':'Incorrect!'}</div><div class="fb-cont">${questionData.explanation||''}</div>`; feedbackEl.className=`tf-fb visible ${isCorrect?'fb-correct':'fb-incorrect'}`; feedbackEl.style.display='block'; } // Simplified class names
             if (imgCont && imgEl && questionData.imageDisplayTiming==='after-answer'){ const imgPath=questionData.image; const exists=await checkImageExists(imgPath); if(exists){imgEl.src=imgPath; imgEl.alt=questionData.imageAlt||''; imgCont.style.display='block';} }
            if (nextBtn) { nextBtn.style.display='block'; nextBtn.textContent=(currentQuestionIndex===totalQuestions-1)?"Results":"Next"; }
         };
        const loadQuestion = async () => { /* ... */
             if (currentQuestionIndex < 0 || currentQuestionIndex >= totalQuestions) return; const questionData = trueFalseData[currentQuestionIndex]; const imagePath = questionData.image; const imageExists = await checkImageExists(imagePath);
            contentView.innerHTML = `
                <div class="content-header"><h2 class="content-title">${moduleTitle}-T/F</h2><span class="progress-indicator">Q <span id="tf-current">${currentQuestionIndex + 1}</span>/${totalQuestions}</span></div>
                 <div class="content-container"><div class="tf-container"><div class="tf-statement" id="tf-statement">${questionData.statement}</div><div id="tf-img-c" class="tf-img-c" style="display:${imageExists&&questionData.imageDisplayTiming!=='after-answer'?'block':'none'};"><img id="tf-img" src="${imageExists?imagePath:''}" alt="${imageExists?questionData.imageAlt||'':''}" class="tf-img"></div><div class="tf-options"><button id="true-button" class="btn btn-true">T</button><button id="false-button" class="btn btn-false">F</button></div><div class="tf-fb" id="tf-feedback" style="display:none;"></div></div><div class="quiz-controls" style="justify-content:flex-end;"><button id="tf-next" class="btn btn-primary" style="display:none;">Next</button></div></div><button id="back-to-methods" class="btn" style="margin-top:1.5rem;">Methods</button>`; // Shortened element IDs and text
            document.getElementById('true-button').addEventListener('click', () => selectAnswer(true)); document.getElementById('false-button').addEventListener('click', () => selectAnswer(false)); document.getElementById('tf-next').addEventListener('click', nextQuestion); document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };
        await loadQuestion();
    }

}); // --- END OF FILE: js/app.js ---
