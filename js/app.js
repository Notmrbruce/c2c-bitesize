// Main application script
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
    const methodDescriptionElement = document.getElementById('method-description');

    // App state
    let currentModule = null;

    // Method descriptions and icons (remain the same)
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
        await loadModules();
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        animateElements();
    }

    function animateElements() {
        const animateElements = document.querySelectorAll('[data-animate]');
        animateElements.forEach(el => el.classList.add('fade-in'));
    }

    async function loadModules() {
        try {
            const modules = await loadModulesList();
            modulesList.innerHTML = ''; // Clear existing
             if (!modules || modules.length === 0) {
                 modulesList.innerHTML = '<p>No learning modules found. Please check the data source.</p>';
                 return;
            }
            modules.forEach(module => {
                const moduleElement = createModuleElement(module);
                modulesList.appendChild(moduleElement);
            });
        } catch (error) {
            console.error('Error loading modules:', error);
            modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
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
        try {
            console.log(`Loading processed module data for ID: ${moduleId}`);
            const moduleData = await loadModuleData(moduleId);
            if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
                 console.warn(`Module ${moduleId} has no available study methods after processing.`);
                 alert(`The module '${moduleData.title}' currently has no available study content.`);
                 return;
            }
            console.log('Processed module data loaded:', moduleData);
            currentModule = moduleData;
            showMethodsView(moduleData);
        } catch (error) {
            console.error(`Error loading processed module ${moduleId}:`, error);
            alert('Error loading module content. Please try again later.');
        }
    }

    // --- View Switching Functions ---
    function showModulesView() {
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        if (breadcrumbItem) breadcrumbItem.style.display = 'none';
        if (mobileBreadcrumb) mobileBreadcrumb.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showMethodsView(moduleData) {
        if (!moduleData || !selectedModuleTitle || !methodDescriptionElement || !methodButtons) {
             console.error("Cannot show methods view - DOM elements missing or no module data.");
             return;
        }
        selectedModuleTitle.textContent = moduleData.title;
        if (breadcrumbModule && breadcrumbItem && mobileBreadcrumb) {
            breadcrumbModule.textContent = moduleData.title;
            breadcrumbItem.style.display = 'block';
            mobileBreadcrumb.style.display = 'block';
            mobileBreadcrumb.textContent = moduleData.title;
            const handler = (e) => {
                 e.preventDefault();
                 showMethodsView(currentModule);
            };
            breadcrumbModule.onclick = handler;
            mobileBreadcrumb.onclick = handler;
        }
        createMethodButtons(moduleData);
        modulesView.style.display = 'none';
        methodsView.style.display = 'block';
        contentView.style.display = 'none';
        methodDescriptionElement.textContent = 'Select a study method to begin';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function createMethodButtons(moduleData) {
         methodButtons.innerHTML = '';
         if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
             methodButtons.innerHTML = '<p>No study methods available for this module.</p>';
             return;
         }
        moduleData.methods.forEach(methodKey => {
            const info = methodInfo[methodKey] || { description: `Learn with ${methodKey}`, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' };
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
        contentView.innerHTML = '';
        modulesView.style.display = 'none';
        methodsView.style.display = 'none';
        contentView.style.display = 'block';
        contentView.classList.add('slide-up');
        setTimeout(() => contentView.classList.remove('slide-up'), 500);

        const methodContentData = moduleData.content[method];
        if (!methodContentData || methodContentData.length === 0) {
            contentView.innerHTML = `<div class="content-container"><p>No content available for the "${method}" method in this module.</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
             const backBtn = document.getElementById('back-to-methods');
             if (backBtn) backBtn.addEventListener('click', () => showMethodsView(currentModule)); // Use currentModule
             return;
        }

        // Use correct 'this' binding or ensure currentModule is accessible if needed in methods
        switch (method) {
            case 'flashcards': loadFlashcards(moduleData.title, methodContentData); break;
            case 'quiz': loadQuiz(moduleData.title, methodContentData); break;
            case 'time-trial': initTimeTrialGame(moduleData.title, methodContentData); break;
            case 'true-false': initTrueFalseQuestions(moduleData.title, methodContentData); break;
            default:
                contentView.innerHTML = `<div class="content-container"><p>Study method "${method}" is not implemented yet.</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                const backBtn = document.getElementById('back-to-methods');
                if (backBtn) backBtn.addEventListener('click', () => showMethodsView(currentModule));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Study Method Implementations ---

    async function loadFlashcards(moduleTitle, flashcardsData) {
        let currentCardIndex = 0;
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
            <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`; // Added margin

        const flashcardElement = document.getElementById('current-flashcard');
        const prevButton = document.getElementById('prev-card');
        const nextButton = document.getElementById('next-card');
        const flipButton = document.getElementById('flip-card');
        const backButton = document.getElementById('back-to-methods');
        const cardNumberElement = document.getElementById('current-card-number');

        const updateFlashcard = async () => {
            if (currentCardIndex < 0 || currentCardIndex >= flashcardsData.length) return;
            const card = flashcardsData[currentCardIndex];
            document.getElementById('flashcard-question-content').textContent = card.question;
            document.getElementById('flashcard-answer-content').textContent = card.answer;
            cardNumberElement.textContent = currentCardIndex + 1;
            flashcardElement.classList.remove('flipped');
            const imageContainer = document.getElementById('flashcard-image-container');
            const imageElement = document.getElementById('flashcard-image');
            const imagePath = card.image;
            const imageExists = await checkImageExists(imagePath);
            if (imageExists) {
                imageElement.src = imagePath;
                imageElement.alt = card.imageAlt || `Image for ${card.question}`;
                imageContainer.style.display = (card.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
            } else {
                imageContainer.style.display = 'none';
            }
            prevButton.disabled = currentCardIndex === 0;
            nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
        };

        const toggleFlashcard = () => {
            flashcardElement.classList.toggle('flipped');
            const card = flashcardsData[currentCardIndex];
            const imageContainer = document.getElementById('flashcard-image-container');
            const imageElement = document.getElementById('flashcard-image');
            // Check if image actually exists before trying to show/hide on flip
            if (imageElement.src && imageElement.src !== window.location.href && card.imageDisplayTiming === "after-answer") {
                imageContainer.style.display = flashcardElement.classList.contains('flipped') ? 'block' : 'none';
            }
        };

        flashcardElement.addEventListener('click', toggleFlashcard);
        flipButton.addEventListener('click', toggleFlashcard);
        prevButton.addEventListener('click', async () => {
            if (currentCardIndex > 0) { currentCardIndex--; await updateFlashcard(); }
        });
        nextButton.addEventListener('click', async () => {
            if (currentCardIndex < flashcardsData.length - 1) { currentCardIndex++; await updateFlashcard(); }
        });
        backButton.addEventListener('click', () => showMethodsView(currentModule)); // Use stored module
        await updateFlashcard(); // Initial load
    }

    async function loadQuiz(moduleTitle, quizData) {
        let currentQuestionIndex = 0;
        let score = 0;
        let userAnswers = new Array(quizData.length).fill(null);

        const showQuizResults = () => { /* Definition remains the same */
           const percentage = quizData.length > 0 ? Math.round((score / quizData.length) * 100) : 0;
           contentView.innerHTML = `
               <div class="content-header">
                   <h2 class="content-title">${moduleTitle} - Quiz Results</h2>
               </div>
               <div class="content-container">
                   <div class="quiz-results">
                       <div class="quiz-score">${score} / ${quizData.length}</div>
                       <div class="quiz-percentage">${percentage}%</div>
                       ${score === quizData.length ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Review your answers or try again!</p>'}
                       <div class="quiz-actions">
                           <button id="review-quiz" class="btn btn-primary">Review Answers</button>
                           <button id="retry-quiz" class="btn">Try Again</button>
                           <button id="back-to-methods" class="btn">Back to Methods</button>
                       </div>
                   </div>
               </div>`;
            document.getElementById('review-quiz').addEventListener('click', showQuizReview);
            document.getElementById('retry-quiz').addEventListener('click', () => loadQuiz(moduleTitle, quizData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const showQuizReview = async () => { /* Definition remains the same */
           contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - Quiz Review</h2>
                </div>
                <div class="content-container" id="review-container"></div>
                <button id="back-to-results" class="btn">Back to Results</button>`;
            const reviewContainer = document.getElementById('review-container');
            for (let i = 0; i < quizData.length; i++) {
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
                <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`; // Added margin

            const optionsElement = document.getElementById('quiz-options');
            const feedbackElement = document.getElementById('answer-feedback');
            const imageContainer = document.getElementById('quiz-image-container');
            const imageElement = document.getElementById('quiz-image'); // Get image element ref

            questionData.options.forEach((option, index) => {
                const optionElement = document.createElement('li');
                optionElement.className = 'quiz-option';
                optionElement.textContent = option;
                if(userAnswers[currentQuestionIndex] === index) {
                    optionElement.classList.add('selected');
                     if (userAnswers[currentQuestionIndex] !== null) { // Only show feedback if answered
                         const isCorrect = userAnswers[currentQuestionIndex] === questionData.correctAnswer;
                         feedbackElement.innerHTML = isCorrect ? '<div class="feedback-header">Correct!</div>' : `<div class="feedback-header">Incorrect! Correct: ${questionData.options[questionData.correctAnswer]}</div>`;
                         feedbackElement.className = `true-false-feedback visible ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`; // Set class directly
                         feedbackElement.style.display = 'block';
                         if(imageExists && questionData.imageDisplayTiming === 'after-answer') imageContainer.style.display = 'block';
                         optionsElement.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');
                    }
                 } else if (userAnswers[currentQuestionIndex] !== null) {
                    optionElement.style.pointerEvents = 'none'; // Disable others if answered
                 }
                if(userAnswers[currentQuestionIndex] === null) {
                    optionElement.addEventListener('click', async () => { // Make async
                        if (userAnswers[currentQuestionIndex] !== null) return;
                        document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
                        optionElement.classList.add('selected');
                        userAnswers[currentQuestionIndex] = index;
                        const isCorrect = index === questionData.correctAnswer;
                        if (isCorrect) score++;
                         feedbackElement.innerHTML = isCorrect ? '<div class="feedback-header">Correct!</div>' : `<div class="feedback-header">Incorrect! Correct: ${questionData.options[questionData.correctAnswer]}</div>`;
                         feedbackElement.className = `true-false-feedback visible ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`; // Set class directly
                         feedbackElement.style.display = 'block';

                         // Show image after answer if needed
                        if(imageExists && questionData.imageDisplayTiming === 'after-answer' && imageContainer) {
                           imageContainer.style.display = 'block';
                        }

                         optionsElement.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');
                    });
                 }
                optionsElement.appendChild(optionElement);
            });
            document.getElementById('prev-question').addEventListener('click', async () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; await loadQuestion(); } });
            document.getElementById('next-question').addEventListener('click', async () => { if (currentQuestionIndex < quizData.length - 1) { currentQuestionIndex++; await loadQuestion(); } else { showQuizResults(); } });
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
         };
        await loadQuestion(); // Initial load
     }

    async function initTimeTrialGame(moduleTitle, timeTrialData) {
        let score = 0;
        let currentRound = 0; // Use round instead of index
        let timer;
        let timeLeft = 7;
        const totalRounds = timeTrialData.length;
        let isRoundActive = false; // Flag to prevent multiple answers

        const updateTimerDisplay = () => { /* Definition remains the same */
           const timeElement = document.getElementById('time-trial-time');
           if(timeElement) {
               timeElement.textContent = timeLeft + 's';
               timeElement.classList.toggle('warning', timeLeft <= 3);
           }
        };

        const endGame = () => { /* Definition remains the same */
           clearInterval(timer);
           isRoundActive = false;
           const percentage = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;
           contentView.innerHTML = `
               <div class="content-header">
                   <h2 class="content-title">${moduleTitle} - Time Trial Results</h2>
               </div>
               <div class="content-container">
                   <div class="time-trial-results">
                       <div class="quiz-score">${score} / ${totalRounds}</div>
                       <div class="quiz-percentage">${percentage}%</div>
                       ${score === totalRounds ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Keep practicing!</p>'}
                       <div class="quiz-actions">
                           <button id="time-trial-replay" class="btn btn-primary">Play Again</button>
                           <button id="back-to-methods" class="btn">Back to Methods</button>
                       </div>
                   </div>
               </div>`;
           document.getElementById('time-trial-replay').addEventListener('click', () => initTimeTrialGame(moduleTitle, timeTrialData));
           document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const timeOut = () => { /* Modified slightly for correctness */
           if (!isRoundActive) return; // Prevent running if round ended
           clearInterval(timer);
           isRoundActive = false;
           const currentItem = timeTrialData[currentRound - 1]; // currentRound is already incremented
           const feedbackElement = document.getElementById('time-trial-feedback');
           const options = document.querySelectorAll('.time-trial-option');
           const nextButton = document.getElementById('time-trial-next');
           const imageContainer = document.getElementById('time-trial-image-container');
           const imageElement = document.getElementById('time-trial-image');

           options.forEach(option => {
               option.disabled = true;
               if (option.dataset.term === currentItem.term) option.classList.add('correct');
           });
           if (feedbackElement) feedbackElement.innerHTML = `<div class="feedback-timeout">Time's up! Correct: ${currentItem.term}</div>`;
           if (nextButton) nextButton.style.display = 'block';

            // Show image if applicable
            if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                 const imagePath = currentItem.image;
                 checkImageExists(imagePath).then(exists => {
                      if(exists) {
                           imageElement.src = imagePath;
                           imageElement.alt = currentItem.imageAlt || 'Image';
                           imageContainer.style.display = 'block';
                      }
                 });
            }

            if (currentRound >= totalRounds) { // Check before showing next button sometimes
                setTimeout(endGame, 1500); // Auto end after timeout on last round
           }
       };


        const startTimer = () => {
            timeLeft = 7;
            isRoundActive = true;
            updateTimerDisplay();
            clearInterval(timer);
            timer = setInterval(() => {
                if (!isRoundActive) { // Stop timer if round ended by selection
                     clearInterval(timer);
                     return;
                 }
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    timeOut();
                }
            }, 1000);
        };

         const selectOption = async (selectedTerm) => { // Now only takes selectedTerm
            if (!isRoundActive) return; // Prevent multiple clicks
            isRoundActive = false; // Mark round as ended
            clearInterval(timer);

            const currentItem = timeTrialData[currentRound - 1]; // currentRound already incremented
             const correctTerm = currentItem.term; // Get correct term for this round
            const isCorrect = selectedTerm === correctTerm;
            const feedbackElement = document.getElementById('time-trial-feedback');
            const options = document.querySelectorAll('.time-trial-option');
            const nextButton = document.getElementById('time-trial-next');
            const scoreElement = document.getElementById('time-trial-score');
            const imageContainer = document.getElementById('time-trial-image-container');
            const imageElement = document.getElementById('time-trial-image');

            options.forEach(option => {
                option.disabled = true;
                if (option.dataset.term === correctTerm) option.classList.add('correct');
                if (option.dataset.term === selectedTerm && !isCorrect) option.classList.add('incorrect');
            });

             if (isCorrect) {
                 score++;
                 if(scoreElement) scoreElement.textContent = score;
                 if(feedbackElement) feedbackElement.innerHTML = '<div class="feedback-correct">Correct!</div>';
             } else {
                 if(feedbackElement) feedbackElement.innerHTML = `<div class="feedback-incorrect">Incorrect! Correct: ${correctTerm}</div>`;
             }
             if(nextButton) {
                 nextButton.style.display = 'block'; // Show the button
                 nextButton.onclick = nextRound; // ** Crucial: Attach/reattach listener **
             }

             // Show image if applicable
             if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                 const imagePath = currentItem.image;
                 const imageExists = await checkImageExists(imagePath);
                 if(imageExists) {
                     imageElement.src = imagePath;
                     imageElement.alt = currentItem.imageAlt || 'Image';
                     imageContainer.style.display = 'block';
                 }
            }

             // End game if last round
            if (currentRound >= totalRounds) {
                if(nextButton) nextButton.textContent = "Show Results"; // Change button text
                 nextButton.onclick = endGame; // Make button go to end game
            }
        };


         const nextRound = async () => { // Combined start/next logic
            if (currentRound >= totalRounds) {
                endGame(); // Should not happen if button directs to endGame, but safety check
                return;
             }

             const currentItem = timeTrialData[currentRound];
            const definitionElement = document.getElementById('time-trial-definition');
            const optionsElement = document.getElementById('time-trial-options');
            const feedbackElement = document.getElementById('time-trial-feedback');
            const nextButton = document.getElementById('time-trial-next');
            const currentElement = document.getElementById('time-trial-current');
            const imageContainer = document.getElementById('time-trial-image-container');
            const imageElement = document.getElementById('time-trial-image');


             // Reset UI elements
            if(feedbackElement) feedbackElement.innerHTML = '';
             if(nextButton) nextButton.style.display = 'none'; // Hide until answer/timeout
            if(currentElement) currentElement.textContent = `${currentRound + 1}/${totalRounds}`;
             if(definitionElement) definitionElement.textContent = currentItem.definition;

             // Image handling
             const imagePath = currentItem.image;
             const imageExists = await checkImageExists(imagePath);
            if (imageContainer && imageElement) {
                if (imageExists) {
                    imageElement.src = imagePath;
                     imageElement.alt = currentItem.imageAlt || `Image for ${currentItem.term}`;
                     imageContainer.style.display = (currentItem.imageDisplayTiming !== "after-answer") ? 'block' : 'none'; // Show with question unless told otherwise
                } else {
                     imageContainer.style.display = 'none'; // Hide if no image
                }
             }

             // Generate options
            const distractors = timeTrialData.map(item => item.term).filter(term => term !== currentItem.term).sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [currentItem.term, ...distractors].sort(() => 0.5 - Math.random());

             if(optionsElement) {
                optionsElement.innerHTML = ''; // Clear old options
                 options.forEach(term => {
                    const optionButton = document.createElement('button');
                    optionButton.className = 'time-trial-option';
                    optionButton.textContent = term;
                    optionButton.dataset.term = term;
                     optionButton.addEventListener('click', () => selectOption(term)); // Pass only selected term
                    optionsElement.appendChild(optionButton);
                });
            }

            currentRound++; // Increment round *after* setting up the current round
             startTimer(); // Start the timer for *this* round
        };

         const startGame = () => { // Starts the process
            score = 0;
            currentRound = 0; // Reset round counter
             document.getElementById('time-trial-score').textContent = '0';
             document.getElementById('time-trial-start-screen').style.display = 'none'; // Hide start screen
            document.getElementById('time-trial-gameplay').style.display = 'block'; // Show game area
             nextRound(); // Load the first round
        };

         // Initial UI setup for Time Trial
         contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - Time Trial</h2>
            </div>
            <div class="content-container">
                <div class="time-trial-header">
                    <div class="time-trial-info">
                        <div class="info-item"><div class="info-label">Score</div><div class="info-value" id="time-trial-score">0</div></div>
                        <div class="info-item"><div class="info-label">Time</div><div class="info-value time-value" id="time-trial-time">7s</div></div>
                        <div class="info-item"><div class="info-label">Question</div><div class="info-value" id="time-trial-current">0/${totalRounds}</div></div>
                    </div>
                </div>
                 <div id="time-trial-gameplay" style="display: none;"> {/* Starts hidden */}
                     <div class="time-trial-definition" id="time-trial-definition">Definition goes here...</div>
                      <div id="time-trial-image-container" class="time-trial-image-container" style="display: none;">
                          <img id="time-trial-image" src="" alt="Time trial image" class="time-trial-image">
                      </div>
                     <div class="time-trial-options" id="time-trial-options">Options will load here...</div>
                    <div class="time-trial-feedback" id="time-trial-feedback" style="min-height: 40px;"></div> {/* Maintain space */}
                    <div class="time-trial-controls" style="margin-top: 1rem; display: flex; justify-content: center;"> {/* Centered Next button */}
                          <button id="time-trial-next" class="btn btn-primary" style="display: none;">Next Term</button> {/* Listener attached dynamically */}
                    </div>
                 </div>
                 <div id="time-trial-start-screen" class="text-center" style="padding: 2rem 0;"> {/* Corrected start screen */}
                    <p style="margin-bottom: 1.5rem;">Match the definition to the correct term within 7 seconds!</p>
                     <button id="time-trial-start" class="btn btn-primary btn-large">Start Game</button>
                </div>
            </div>
            <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`; // Back button outside content container

         document.getElementById('time-trial-start').addEventListener('click', startGame);
         document.getElementById('back-to-methods').addEventListener('click', () => {
            clearInterval(timer); // Stop timer if exiting
             showMethodsView(currentModule);
         });
         // **Crucially, the 'Next' button listener is added in the selectOption/timeOut functions when the button is shown**
    }

    async function initTrueFalseQuestions(moduleTitle, trueFalseData) { // Takes adapted data
        let score = 0;
        let currentQuestionIndex = 0;
        let userAnswers = new Array(trueFalseData.length).fill(null); // Store results
        const totalQuestions = trueFalseData.length;

        const showResults = () => { /* Definition remains the same */
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            contentView.innerHTML = `
               <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - True or False Results</h2>
               </div>
                <div class="content-container">
                    <div class="time-trial-results">
                        <div class="quiz-score">${score} / ${totalQuestions}</div>
                        <div class="quiz-percentage">${percentage}%</div>
                        ${score === totalQuestions ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Keep learning!</p>'}
                        <div class="quiz-actions">
                            <button id="true-false-review" class="btn btn-primary">Review Answers</button>
                             <button id="true-false-replay" class="btn">Try Again</button>
                            <button id="back-to-methods" class="btn">Back to Methods</button>
                         </div>
                     </div>
                </div>`;
            document.getElementById('true-false-review').addEventListener('click', showReview);
            document.getElementById('true-false-replay').addEventListener('click', () => initTrueFalseQuestions(moduleTitle, trueFalseData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const showReview = async () => { /* Definition remains the same */
           contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - True or False Review</h2>
                </div>
                <div class="content-container" id="review-container"></div>
                 <button id="back-to-results" class="btn">Back to Results</button>`;
            const reviewContainer = document.getElementById('review-container');
            for (let i = 0; i < trueFalseData.length; i++) {
                 const question = trueFalseData[i];
                const answerRecord = userAnswers[i];
                 const imagePath = question.image;
                 const imageExists = await checkImageExists(imagePath);
                const reviewItem = document.createElement('div');
                reviewItem.className = `review-item ${answerRecord && answerRecord.isCorrect ? 'correct' : 'incorrect'}`;
                reviewItem.innerHTML = `
                    <div class="review-statement">${i + 1}. ${question.statement}</div>
                     ${imageExists ? `<div class="review-image-container"><img src="${imagePath}" alt="${question.imageAlt || 'Review image'}" class="review-image"></div>` : ''}
                     <div class="review-details">
                         <div class="review-answer">Correct answer: <strong>${question.isTrue ? 'TRUE' : 'FALSE'}</strong></div>
                        ${answerRecord ? `<div class="review-answer">Your answer: <strong>${answerRecord.userAnswer ? 'TRUE' : 'FALSE'}</strong></div>` : '<div class="review-answer">Your answer: Not answered</div>'}
                         <div class="review-explanation">${question.explanation || 'No explanation provided.'}</div>
                    </div>`;
                 reviewContainer.appendChild(reviewItem);
            }
             document.getElementById('back-to-results').addEventListener('click', showResults);
        };

         const nextQuestion = async () => {
            currentQuestionIndex++;
             if (currentQuestionIndex >= totalQuestions) {
                showResults();
             } else {
                 await loadQuestion();
             }
        };

         const selectAnswer = async (userAnswer) => {
            const questionData = trueFalseData[currentQuestionIndex];
            const isCorrect = userAnswer === questionData.isTrue;
             if (isCorrect) score++;
            userAnswers[currentQuestionIndex] = { userAnswer, isCorrect }; // Store answer and correctness

            // Disable T/F buttons
             document.getElementById('true-button').disabled = true;
             document.getElementById('false-button').disabled = true;
             // Highlight selected
             document.getElementById(userAnswer ? 'true-button' : 'false-button').classList.add('selected');

            const feedbackElement = document.getElementById('true-false-feedback');
            const nextButton = document.getElementById('true-false-next');
             const imageContainer = document.getElementById('true-false-image-container');
             const imageElement = document.getElementById('true-false-image');


             if(feedbackElement) {
                 feedbackElement.innerHTML = `
                     <div class="feedback-header" style="color: ${isCorrect ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'};">${isCorrect ? 'Correct!' : 'Incorrect!'}</div>
                    <div class="feedback-content">${questionData.explanation || ''}</div>`;
                feedbackElement.classList.add('visible');
                 // Add correct/incorrect class for border color
                 feedbackElement.className = `true-false-feedback visible ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
                 feedbackElement.style.display = 'block'; // Ensure it's visible
            }

            // Show image after answer if needed
            if (imageContainer && imageElement && questionData.imageDisplayTiming === "after-answer") {
                 const imagePath = questionData.image;
                 const imageExists = await checkImageExists(imagePath);
                 if(imageExists) {
                     imageElement.src = imagePath;
                     imageElement.alt = questionData.imageAlt || 'Image';
                     imageContainer.style.display = 'block';
                 }
            }

            if(nextButton) {
                nextButton.style.display = 'block'; // Show Next button
                if(currentQuestionIndex === totalQuestions - 1) {
                     nextButton.textContent = "Show Results"; // Change text on last question
                 } else {
                    nextButton.textContent = "Next Question";
                 }
            }
         };


        const loadQuestion = async () => {
            if (currentQuestionIndex < 0 || currentQuestionIndex >= totalQuestions) return;
            const questionData = trueFalseData[currentQuestionIndex];
            const imagePath = questionData.image;
             const imageExists = await checkImageExists(imagePath);

             // Removed innerHTML rewrite, target elements specifically
             const currentEl = document.getElementById('true-false-current');
             const statementEl = document.getElementById('true-false-statement');
             const trueBtn = document.getElementById('true-button');
             const falseBtn = document.getElementById('false-button');
             const feedbackEl = document.getElementById('true-false-feedback');
             const nextBtn = document.getElementById('true-false-next');
             const imageContainer = document.getElementById('true-false-image-container');
             const imageElement = document.getElementById('true-false-image');


             if (currentEl) currentEl.textContent = currentQuestionIndex + 1;
             if (statementEl) statementEl.textContent = questionData.statement;

            // Reset buttons and feedback
             if (trueBtn) { trueBtn.disabled = false; trueBtn.classList.remove('selected'); }
             if (falseBtn) { falseBtn.disabled = false; falseBtn.classList.remove('selected'); }
             if (feedbackEl) { feedbackEl.classList.remove('visible', 'feedback-correct', 'feedback-incorrect'); feedbackEl.style.display = 'none'; feedbackEl.innerHTML=''; }
             if (nextBtn) { nextBtn.style.display = 'none'; nextBtn.textContent="Next Question"; }

            // Handle image display
             if (imageContainer && imageElement) {
                if (imageExists) {
                    imageElement.src = imagePath;
                     imageElement.alt = questionData.imageAlt || `Image for statement ${currentQuestionIndex + 1}`;
                     imageContainer.style.display = (questionData.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
                } else {
                     imageContainer.style.display = 'none';
                }
             }
        };

         // Initial UI Setup
         contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - True or False</h2>
                <span class="progress-indicator">Question <span id="true-false-current">1</span> of ${totalQuestions}</span>
            </div>
             <div class="content-container">
                <div class="true-false-container">
                    <div class="true-false-statement" id="true-false-statement">Loading statement...</div>
                     <div id="true-false-image-container" class="true-false-image-container" style="display: none;">
                         <img id="true-false-image" src="" alt="True/False question image" class="true-false-image">
                    </div>
                    <div class="true-false-options">
                        <button id="true-button" class="btn btn-true">TRUE</button>
                        <button id="false-button" class="btn btn-false">FALSE</button>
                     </div>
                     <div class="true-false-feedback" id="true-false-feedback"></div>
                </div>
                 <div class="quiz-controls" style="justify-content: flex-end;">
                     <button id="true-false-next" class="btn btn-primary" style="display: none;">Next Question</button>
                 </div>
             </div>
             <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`;

         // Re-attach listeners after setting innerHTML
        document.getElementById('true-button').addEventListener('click', () => selectAnswer(true));
        document.getElementById('false-button').addEventListener('click', () => selectAnswer(false));
        document.getElementById('true-false-next').addEventListener('click', nextQuestion); // Listener for next
        document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));


        await loadQuestion(); // Load first question
     }


}); // End DOMContentLoaded
