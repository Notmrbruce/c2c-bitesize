// Main application script
// MODIFIED: Updated import statement
import { loadModulesList, loadModuleData, getImagePath, checkImageExists } from './module-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements (remain mostly the same)
    const modulesView = document.getElementById('modules-view');
    const methodsView = document.getElementById('methods-view');
    const contentView = document.getElementById('content-view');
    const modulesList = document.getElementById('modules-list');
    const selectedModuleTitle = document.getElementById('selected-module-title');
    const methodButtons = document.getElementById('method-buttons');
    const breadcrumbModule = document.getElementById('breadcrumb-module');
    const breadcrumbItem = document.getElementById('breadcrumb-item');
    const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
    const methodDescriptionElement = document.getElementById('method-description'); // Make sure this exists

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

    // Functions
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
            <p class="module-desc">${module.description || 'No description available.'}</p>
        `;
        moduleElement.addEventListener('click', () => loadSelectedModule(module.id));
        return moduleElement;
    }

    // MODIFIED: Loads data using loadModuleData, which now includes processing
    async function loadSelectedModule(moduleId) {
        try {
            console.log(`Loading processed module data for ID: ${moduleId}`);
            // loadModuleData now returns the processed data in the format app.js expects
            const moduleData = await loadModuleData(moduleId);

            if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
                 console.warn(`Module ${moduleId} has no available study methods after processing.`);
                 // Optionally show a message to the user
                 alert(`The module '${moduleData.title}' currently has no available study content.`);
                 return; // Don't proceed to show methods view if empty
            }

            console.log('Processed module data loaded:', moduleData);
            currentModule = moduleData; // Store the processed data
            showMethodsView(moduleData);
        } catch (error) {
            console.error(`Error loading processed module ${moduleId}:`, error);
            alert('Error loading module content. Please try again later.');
        }
    }

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

            // Update breadcrumb handlers
            const handler = (e) => {
                 e.preventDefault();
                 // Pass the *already processed* currentModule data
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
         methodButtons.innerHTML = ''; // Clear existing

        // Check if moduleData and methods exist
         if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
             methodButtons.innerHTML = '<p>No study methods available for this module.</p>';
             return;
         }

        moduleData.methods.forEach(methodKey => {
            const info = methodInfo[methodKey] || {
                description: `Learn with ${methodKey}`,
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
            };
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
                </div>
            `;
            button.addEventListener('click', () => loadStudyMethod(moduleData, methodKey));
            methodButtons.appendChild(button);
        });
    }

    function loadStudyMethod(moduleData, method) {
        contentView.innerHTML = ''; // Clear previous
        modulesView.style.display = 'none';
        methodsView.style.display = 'none';
        contentView.style.display = 'block';
        contentView.classList.add('slide-up'); // Add animation class
        setTimeout(() => contentView.classList.remove('slide-up'), 500); // Remove after animation

        // Use the already processed content for the selected method
        const methodContentData = moduleData.content[method];

        if (!methodContentData || methodContentData.length === 0) {
            contentView.innerHTML = `<div class="content-container"><p>No content available for the "${method}" method in this module.</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
             // Add listener for the back button here
             const backBtn = document.getElementById('back-to-methods');
             if (backBtn) backBtn.addEventListener('click', () => showMethodsView(moduleData));
             return;
        }

        switch (method) {
            case 'flashcards':
                loadFlashcards(moduleData.title, methodContentData); // Pass adapted data
                break;
            case 'quiz':
                loadQuiz(moduleData.title, methodContentData); // Pass adapted data
                break;
            case 'time-trial':
                initTimeTrialGame(moduleData.title, methodContentData); // Pass adapted data
                break;
            case 'true-false':
                initTrueFalseQuestions(moduleData.title, methodContentData); // Pass adapted data
                break;
            default:
                contentView.innerHTML = `<div class="content-container"><p>Study method "${method}" is not implemented yet.</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                const backBtn = document.getElementById('back-to-methods');
                if (backBtn) backBtn.addEventListener('click', () => showMethodsView(currentModule));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // MODIFIED: Updated function signatures and image handling for all study methods

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
            <button id="back-to-methods" class="btn">Back to Methods</button>`;

        const flashcardElement = document.getElementById('current-flashcard');
        const prevButton = document.getElementById('prev-card');
        const nextButton = document.getElementById('next-card');
        const flipButton = document.getElementById('flip-card');
        const backButton = document.getElementById('back-to-methods');
        const cardNumberElement = document.getElementById('current-card-number');

        const updateFlashcard = async () => { // Made async for checkImageExists
            if (currentCardIndex < 0 || currentCardIndex >= flashcardsData.length) return; // Bounds check

            const card = flashcardsData[currentCardIndex];
            document.getElementById('flashcard-question-content').textContent = card.question;
            document.getElementById('flashcard-answer-content').textContent = card.answer;
            cardNumberElement.textContent = currentCardIndex + 1;
            flashcardElement.classList.remove('flipped'); // Reset flip

            const imageContainer = document.getElementById('flashcard-image-container');
            const imageElement = document.getElementById('flashcard-image');

            // MODIFIED: Simplified image check logic
            const imagePath = card.image; // Use path directly from processed data
            const imageExists = await checkImageExists(imagePath); // Check existence

            if (imageExists) {
                imageElement.src = imagePath;
                imageElement.alt = card.imageAlt || `Image for ${card.question}`;
                // Display based on timing rule
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
            // Show image on flip *if* timing is 'after-answer' and image exists
             if (card.imageDisplayTiming === "after-answer" && imageContainer.style.backgroundImage !== 'none') { // Check if image exists indirectly
                imageContainer.style.display = flashcardElement.classList.contains('flipped') ? 'block' : 'none';
            }
        };

        flashcardElement.addEventListener('click', toggleFlashcard);
        flipButton.addEventListener('click', toggleFlashcard);
        prevButton.addEventListener('click', async () => {
            if (currentCardIndex > 0) {
                currentCardIndex--;
                await updateFlashcard(); // Await image checks
            }
        });
        nextButton.addEventListener('click', async () => {
            if (currentCardIndex < flashcardsData.length - 1) {
                currentCardIndex++;
                await updateFlashcard(); // Await image checks
            }
        });
        backButton.addEventListener('click', () => showMethodsView(currentModule));

        await updateFlashcard(); // Initial load
    }

     async function loadQuiz(moduleTitle, quizData) { // Takes adapted data
         let currentQuestionIndex = 0;
         let score = 0;
         let userAnswers = new Array(quizData.length).fill(null); // Use length of quizData

         // Function to display results (moved inside for scope)
         const showQuizResults = () => {
            const percentage = Math.round((score / quizData.length) * 100);
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

             document.getElementById('review-quiz').addEventListener('click', showQuizReview); // Re-add listener
             document.getElementById('retry-quiz').addEventListener('click', () => loadQuiz(moduleTitle, quizData)); // Re-add listener
             document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule)); // Re-add listener
        };

         // Function to display review (moved inside for scope)
         const showQuizReview = async () => {
             contentView.innerHTML = `
                 <div class="content-header">
                     <h2 class="content-title">${moduleTitle} - Quiz Review</h2>
                 </div>
                 <div class="content-container">
                     <div id="quiz-review"></div>
                 </div>
                 <button id="back-to-results" class="btn">Back to Results</button>`;

            const reviewElement = document.getElementById('quiz-review');
            for (let i = 0; i < quizData.length; i++) {
                 const question = quizData[i];
                 const userAnswerIndex = userAnswers[i];
                 const isCorrect = userAnswerIndex === question.correctAnswer;
                 const imagePath = question.image; // Use processed image path
                 const imageExists = await checkImageExists(imagePath);

                 const reviewItem = document.createElement('div');
                 reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
                 reviewItem.innerHTML = `
                    <div class="review-statement">${i + 1}. ${question.question}</div>
                    ${imageExists ? `<div class="review-image-container"><img src="${imagePath}" alt="${question.imageAlt || 'Review image'}" class="review-image"></div>` : ''}
                    <div class="review-details">
                         <div class="review-answer">Your answer: ${userAnswerIndex !== null ? question.options[userAnswerIndex] : 'Not answered'}</div>
                         <div class="review-answer">Correct answer: ${question.options[question.correctAnswer]}</div>
                         </div>`; // Removed explanation display as it's not in quiz format
                 reviewElement.appendChild(reviewItem);
            }
             document.getElementById('back-to-results').addEventListener('click', showQuizResults); // Re-add listener
        };

         const loadQuestion = async () => { // Made async for image check
            if (currentQuestionIndex < 0 || currentQuestionIndex >= quizData.length) return; // Bounds check

            const questionData = quizData[currentQuestionIndex];
            const imagePath = questionData.image; // Use processed path
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
                <button id="back-to-methods" class="btn">Back to Methods</button>`;

            const optionsElement = document.getElementById('quiz-options');
            const feedbackElement = document.getElementById('answer-feedback');
            const imageContainer = document.getElementById('quiz-image-container');

             questionData.options.forEach((option, index) => {
                 const optionElement = document.createElement('li');
                 optionElement.className = 'quiz-option';
                 optionElement.textContent = option;

                // Check if this option was the user's answer for this question
                const isSelected = userAnswers[currentQuestionIndex] === index;
                if(isSelected) {
                    optionElement.classList.add('selected');
                     // If already answered, show feedback and potentially image
                     if (userAnswers[currentQuestionIndex] !== null) {
                         const isCorrect = userAnswers[currentQuestionIndex] === questionData.correctAnswer;
                         feedbackElement.innerHTML = isCorrect ? '<div class="feedback-header">Correct!</div>' : `<div class="feedback-header">Incorrect! Correct: ${questionData.options[questionData.correctAnswer]}</div>`;
                         feedbackElement.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
                         feedbackElement.style.display = 'block';
                         if(imageExists && questionData.imageDisplayTiming === 'after-answer') imageContainer.style.display = 'block';
                         optionsElement.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none'); // Disable all
                    }
                 } else if (userAnswers[currentQuestionIndex] !== null) {
                    // Disable other options if question already answered
                    optionElement.style.pointerEvents = 'none';
                 }

                // Add click listener only if not already answered
                if(userAnswers[currentQuestionIndex] === null) {
                    optionElement.addEventListener('click', () => {
                        if (userAnswers[currentQuestionIndex] !== null) return; // Prevent re-answering

                        document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
                        optionElement.classList.add('selected');
                        userAnswers[currentQuestionIndex] = index;
                        const isCorrect = index === questionData.correctAnswer;
                        if (isCorrect) score++; // Increment score immediately

                         feedbackElement.innerHTML = isCorrect ? '<div class="feedback-header">Correct!</div>' : `<div class="feedback-header">Incorrect! Correct: ${questionData.options[questionData.correctAnswer]}</div>`;
                         feedbackElement.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
                         feedbackElement.style.display = 'block';
                         if(imageExists && questionData.imageDisplayTiming === 'after-answer') imageContainer.style.display = 'block';

                         // Disable options after answering
                         optionsElement.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');
                    });
                 }
                 optionsElement.appendChild(optionElement);
            });

            // Add Nav button listeners
            document.getElementById('prev-question').addEventListener('click', async () => {
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    await loadQuestion();
                }
            });
            document.getElementById('next-question').addEventListener('click', async () => {
                 if (currentQuestionIndex < quizData.length - 1) {
                    currentQuestionIndex++;
                    await loadQuestion();
                } else {
                    showQuizResults(); // Last question reached
                }
            });
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
         };

         await loadQuestion(); // Load the first question
     }

    async function initTimeTrialGame(moduleTitle, timeTrialData) { // Takes adapted data
        let score = 0;
        let currentRound = 0;
        let timer;
        let timeLeft = 7; // Reset time for each round
        const totalRounds = timeTrialData.length; // Use length of adapted data

        const updateTimerDisplay = () => {
            const timeElement = document.getElementById('time-trial-time');
            if(timeElement) {
                timeElement.textContent = timeLeft + 's';
                timeElement.classList.toggle('warning', timeLeft <= 3);
            }
        };

        const endGame = () => {
             clearInterval(timer); // Stop any running timer
             const percentage = Math.round((score / totalRounds) * 100);
             contentView.innerHTML = `
                 <div class="content-header">
                     <h2 class="content-title">${moduleTitle} - Time Trial Results</h2>
                 </div>
                 <div class="content-container">
                     <div class="time-trial-results">
                         <div class="quiz-score">${score} / ${totalRounds}</div>
                         <div class="quiz-percentage">${percentage}%</div>
                         ${score === totalRounds ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Keep practicing to improve your speed!</p>'}
                         <div class="quiz-actions">
                             <button id="time-trial-replay" class="btn btn-primary">Play Again</button>
                             <button id="back-to-methods" class="btn">Back to Methods</button>
                         </div>
                     </div>
                 </div>`;
            document.getElementById('time-trial-replay').addEventListener('click', () => initTimeTrialGame(moduleTitle, timeTrialData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const timeOut = () => {
            clearInterval(timer);
            const currentItem = timeTrialData[currentRound - 1]; // Use currentRound-1 as it's incremented before check
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

             // Handle image display if time ran out
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

             // Auto-end if last round
            if (currentRound >= totalRounds) {
                 setTimeout(endGame, 1500);
            }
         };

        const startTimer = () => {
             timeLeft = 7; // Reset timer
             updateTimerDisplay();
             clearInterval(timer); // Clear previous timer
             timer = setInterval(() => {
                 timeLeft--;
                 updateTimerDisplay();
                 if (timeLeft <= 0) {
                     timeOut();
                 }
             }, 1000);
        };


        const selectOption = async (selectedTerm, correctTerm) => { // Make async
            clearInterval(timer);
             const isCorrect = selectedTerm === correctTerm;
             const feedbackElement = document.getElementById('time-trial-feedback');
             const options = document.querySelectorAll('.time-trial-option');
             const nextButton = document.getElementById('time-trial-next');
             const scoreElement = document.getElementById('time-trial-score');
             const imageContainer = document.getElementById('time-trial-image-container');
             const imageElement = document.getElementById('time-trial-image');
             const currentItem = timeTrialData[currentRound-1]; // Item related to this selection

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
             if(nextButton) nextButton.style.display = 'block';

             // Handle image display after answer
             if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                  const imagePath = currentItem.image;
                  const imageExists = await checkImageExists(imagePath); // Check existence
                  if(imageExists) {
                       imageElement.src = imagePath;
                       imageElement.alt = currentItem.imageAlt || 'Image';
                       imageContainer.style.display = 'block';
                  }
             }

             // Auto-end if last question
             if (currentRound >= totalRounds) {
                 setTimeout(endGame, 1500);
            }
        };

        const nextRound = async () => { // Make async
            if (currentRound >= totalRounds) {
                endGame();
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


            if(feedbackElement) feedbackElement.innerHTML = '';
            if(nextButton) nextButton.style.display = 'none';
            if(currentElement) currentElement.textContent = `${currentRound + 1}/${totalRounds}`;
            if(definitionElement) definitionElement.textContent = currentItem.definition;


             // Handle image display (shown with definition unless specified otherwise)
            const imagePath = currentItem.image;
            const imageExists = await checkImageExists(imagePath);
            if (imageContainer && imageElement) {
                 if (imageExists) {
                    imageElement.src = imagePath;
                     imageElement.alt = currentItem.imageAlt || `Image for ${currentItem.term}`;
                    imageContainer.style.display = (currentItem.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
                 } else {
                    imageContainer.style.display = 'none';
                 }
            }

             // Generate options (ensure correct item isn't duplicated)
             const distractors = timeTrialData
                .map(item => item.term) // Get all terms
                .filter(term => term !== currentItem.term) // Filter out correct term
                .sort(() => 0.5 - Math.random()) // Shuffle
                .slice(0, 3); // Take 3 distractors

            const options = [currentItem.term, ...distractors].sort(() => 0.5 - Math.random()); // Combine and shuffle


            if(optionsElement) {
                optionsElement.innerHTML = '';
                options.forEach(term => {
                    const optionButton = document.createElement('button');
                    optionButton.className = 'time-trial-option';
                    optionButton.textContent = term;
                    optionButton.dataset.term = term; // Store term for checking
                    optionButton.addEventListener('click', () => selectOption(term, currentItem.term));
                    optionsElement.appendChild(optionButton);
                });
            }

            currentRound++; // Increment for next call
             startTimer(); // Start timer for the new round
        };

        const startGame = () => {
            score = 0;
            currentRound = 0;
            document.getElementById('time-trial-score').textContent = '0';
            document.getElementById('time-trial-start-screen').style.display = 'none';
            document.getElementById('time-trial-gameplay').style.display = 'block';
            nextRound(); // Load first round
        };

         // Setup initial UI
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
                <div id="time-trial-gameplay" style="display: none;">
                     <div class="time-trial-definition" id="time-trial-definition"></div>
                      <div id="time-trial-image-container" class="time-trial-image-container" style="display: none;">
                          <img id="time-trial-image" src="" alt="Time trial image" class="time-trial-image">
                      </div>
                     <div class="time-trial-options" id="time-trial-options"></div>
                     <div class="time-trial-feedback" id="time-trial-feedback" style="min-height: 40px;"></div> {/* Added min-height */}
                     <div class="time-trial-controls" style="margin-top: 1rem;"> {/* Added margin */}
                          <button id="time-trial-next" class="btn btn-primary" style="display: none;">Next Term</button>
                     </div>
                 </div>
                 <div id="time-trial-start-screen" class="text-center" style="padding: 2rem 0;"> {/* Added padding */}
                     <p style="margin-bottom: 1.5rem;">Match the term to the definition within 7 seconds!</p> {/* Added margin */}
                    <button id="time-trial-start" class="btn btn-primary btn-large">Start Game</button>
                 </div>
             </div>
            <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`; // Added margin

        document.getElementById('time-trial-start').addEventListener('click', startGame);
        document.getElementById('back-to-methods').addEventListener('click', () => {
            clearInterval(timer); // Ensure timer stops on exit
            showMethodsView(currentModule);
         });
         // Need to re-attach listener for next button *inside* nextRound/selectOption/timeOut where it's displayed
         const setupNextButtonListener = () => {
             const nextBtn = document.getElementById('time-trial-next');
             if(nextBtn) nextBtn.addEventListener('click', nextRound);
         }
         // Call setup function initially (or better, call it when button displayed) - modification needed in selectOption/timeOut
         // Modifying selectOption and timeOut to call this:
         const originalSelectOption = selectOption;
         selectOption = async (selected, correct) => {
              await originalSelectOption(selected, correct);
              setupNextButtonListener();
         }
          const originalTimeOut = timeOut;
          timeOut = () => {
               originalTimeOut();
               setupNextButtonListener();
          }
    }

    async function initTrueFalseQuestions(moduleTitle, trueFalseData) { // Takes adapted data
        let score = 0;
        let currentQuestionIndex = 0;
        let userAnswers = []; // Stores { userAnswer: boolean, isCorrect: boolean }

        const totalQuestions = trueFalseData.length; // Use length of adapted data

        const showResults = () => {
            const percentage = Math.round((score / totalQuestions) * 100);
            contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - True or False Results</h2>
                </div>
                <div class="content-container">
                    <div class="time-trial-results">
                         <div class="quiz-score">${score} / ${totalQuestions}</div>
                        <div class="quiz-percentage">${percentage}%</div>
                        ${score === totalQuestions ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Review your answers or try again!</p>'}
                        <div class="quiz-actions">
                             <button id="true-false-review" class="btn btn-primary">Review Answers</button>
                             <button id="true-false-replay" class="btn">Try Again</button>
                             <button id="back-to-methods" class="btn">Back to Methods</button>
                         </div>
                    </div>
                </div>`;

             document.getElementById('true-false-review').addEventListener('click', showReview); // Re-add
             document.getElementById('true-false-replay').addEventListener('click', () => initTrueFalseQuestions(moduleTitle, trueFalseData)); // Re-add
             document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule)); // Re-add
         };

         const showReview = async () => {
            contentView.innerHTML = `
                 <div class="content-header">
                     <h2 class="content-title">${moduleTitle} - True or False Review</h2>
                </div>
                <div class="content-container" id="review-container"></div>
                <button id="back-to-results" class="btn">Back to Results</button>`;

            const reviewContainer = document.getElementById('review-container');
            for (let i = 0; i < trueFalseData.length; i++) {
                const question = trueFalseData[i];
                const answerRecord = userAnswers[i]; // Contains userAnswer and isCorrect
                const imagePath = question.image; // Use processed path
                const imageExists = await checkImageExists(imagePath);

                const reviewItem = document.createElement('div');
                 reviewItem.className = `review-item ${answerRecord && answerRecord.isCorrect ? 'correct' : 'incorrect'}`; // Check answerRecord exists
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
             document.getElementById('back-to-results').addEventListener('click', showResults); // Re-add listener
         };

         const nextQuestion = async () => {
            currentQuestionIndex++;
            if (currentQuestionIndex >= totalQuestions) {
                showResults();
            } else {
                await loadQuestion(); // Await the async loadQuestion
            }
         };

         const selectAnswer = async (userAnswer) => { // Make async
             const questionData = trueFalseData[currentQuestionIndex];
             const isCorrect = userAnswer === questionData.isTrue;
             if (isCorrect) score++;

            userAnswers[currentQuestionIndex] = { userAnswer, isCorrect }; // Store result

            // Update UI
            document.getElementById('true-button').disabled = true;
            document.getElementById('false-button').disabled = true;
            document.getElementById(userAnswer ? 'true-button' : 'false-button').classList.add('selected');

             const feedbackElement = document.getElementById('true-false-feedback');
             const imageContainer = document.getElementById('true-false-image-container');
             const imageElement = document.getElementById('true-false-image');
             const nextButton = document.getElementById('true-false-next');

             if(feedbackElement) {
                 feedbackElement.innerHTML = `
                     <div class="feedback-header">${isCorrect ? 'Correct!' : 'Incorrect!'}</div>
                     <div class="feedback-content">${questionData.explanation || ''}</div>`; // Use explanation
                 feedbackElement.classList.add('visible');
             }

             // Handle image display after answer
             if(imageContainer && imageElement && questionData.imageDisplayTiming === 'after-answer') {
                 const imagePath = questionData.image;
                 const imageExists = await checkImageExists(imagePath); // Check again just in case
                 if(imageExists) {
                     imageElement.src = imagePath;
                     imageElement.alt = questionData.imageAlt || 'Image';
                     imageContainer.style.display = 'block';
                 }
             }


             if(nextButton) nextButton.style.display = 'block';
         };


         const loadQuestion = async () => { // Made async for image checks
            if (currentQuestionIndex < 0 || currentQuestionIndex >= totalQuestions) return; // Bounds

            const questionData = trueFalseData[currentQuestionIndex];
            const imagePath = questionData.image; // Use processed path
            const imageExists = await checkImageExists(imagePath); // Check existence

             contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - True or False</h2>
                    <span class="progress-indicator">Question <span id="true-false-current">${currentQuestionIndex + 1}</span> of ${totalQuestions}</span>
                </div>
                <div class="content-container">
                     <div class="true-false-container">
                        <div class="true-false-statement" id="true-false-statement">${questionData.statement}</div>
                        <div id="true-false-image-container" class="true-false-image-container" style="display: ${imageExists && questionData.imageDisplayTiming !== 'after-answer' ? 'block' : 'none'};">
                             <img id="true-false-image" src="${imageExists ? imagePath : ''}" alt="${imageExists ? questionData.imageAlt || 'Image' : ''}" class="true-false-image">
                        </div>
                         <div class="true-false-options">
                            <button id="true-button" class="btn btn-true">TRUE</button>
                             <button id="false-button" class="btn btn-false">FALSE</button>
                         </div>
                         <div class="true-false-feedback" id="true-false-feedback"></div> {/* Ensure visibility class is removed */}
                    </div>
                     <div class="quiz-controls" style="justify-content: flex-end;"> {/* Align next button to right */}
                        <button id="true-false-next" class="btn btn-primary" style="display: none;">Next Question</button>
                     </div>
                </div>
                <button id="back-to-methods" class="btn">Back to Methods</button>`;

             // Re-attach listeners for the new buttons
            document.getElementById('true-button').addEventListener('click', () => selectAnswer(true));
            document.getElementById('false-button').addEventListener('click', () => selectAnswer(false));
             const nextBtn = document.getElementById('true-false-next');
            if(nextBtn) nextBtn.addEventListener('click', nextQuestion); // Attach here
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };


        await loadQuestion(); // Load the first question
     }


}); // End DOMContentLoaded
