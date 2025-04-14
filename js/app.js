// START OF FILE: js/app.js --- REPLACE ENTIRE FILE ---

import { loadModulesList, loadModuleData, getImagePath, checkImageExists } from './module-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modulesView = document.getElementById('modules-view');
    const methodsView = document.getElementById('methods-view');
    const contentView = document.getElementById('content-view');
    const modulesList = document.getElementById('modules-list');
    const modulesLoading = document.getElementById('modules-loading');
    const selectedModuleTitle = document.getElementById('selected-module-title');
    const methodButtons = document.getElementById('method-buttons');
    const breadcrumbModule = document.getElementById('breadcrumb-module');
    const breadcrumbItem = document.getElementById('breadcrumb-item');
    const mobileBreadcrumb = document.getElementById('mobile-breadcrumb');
    const methodDescriptionElement = document.getElementById('method-description');

    // App state
    let currentModule = null;
    let currentMethod = null; // NEW: Track current method

    // Method descriptions and icons (ensure these keys match your JSON/methods array)
    const methodInfo = {
        'flashcards': { name: 'Flashcards', description: 'Flip through digital cards...', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8"/><path d="M8 12h8"/></svg>'},
        'quiz': { name: 'Quiz', description: 'Test your knowledge...', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'},
        'time-trial': { name: 'Time Trial', description: 'Race against the clock...', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'},
        'true-false': { name: 'True/False', description: 'Determine truth values...', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'}
    };

    // Initialize the application
    init();

    // --- Core Functions ---
    async function init() {
        if (modulesView) modulesView.classList.add('view-hidden');
        if (methodsView) methodsView.classList.add('view-hidden');
        if (contentView) contentView.classList.add('view-hidden');
        await loadModules();
        showModulesView();
        document.body.classList.add('loaded'); // Make body visible
    }

    async function loadModules() {
        if (modulesLoading) modulesLoading.style.display = 'flex';
        if (modulesList) modulesList.innerHTML = '';
        try {
            const modules = await loadModulesList();
            if (modulesLoading) modulesLoading.style.display = 'none';
            if (!modules || modules.length === 0) { if (modulesList) modulesList.innerHTML = '<p>No modules found.</p>'; return; }
            modules.forEach(module => { if (modulesList) modulesList.appendChild(createModuleElement(module)); });
        } catch (error) {
            console.error('Error loading modules:', error);
            if (modulesLoading) modulesLoading.style.display = 'none';
            if (modulesList) modulesList.innerHTML = '<p>Error loading modules.</p>';
        }
    }

    function createModuleElement(module) {
        const moduleElement = document.createElement('div');
        moduleElement.className = 'module-card';
        moduleElement.innerHTML = `<h3 class="module-title">${module.title||'Untitled'}</h3><p class="module-desc">${module.description||''}</p>`;
        moduleElement.addEventListener('click', () => loadSelectedModule(module.id));
        return moduleElement;
    }

    async function loadSelectedModule(moduleId) {
        // Show loading state? (Optional)
        try {
            const moduleData = await loadModuleData(moduleId);
            if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) {
                 alert(`Module '${moduleData?.title || moduleId}' has no study content.`); return;
            }
            currentModule = moduleData; // Store the fully processed module data
            showMethodsView(moduleData);
        } catch (error) { alert(`Error loading content for ${moduleId}.`); showModulesView(); }
    }

    // --- View Switching Functions ---
    function showView(viewToShow) {
        const views = [modulesView, methodsView, contentView];
        views.forEach(view => { if (view) view.style.display = (view === viewToShow) ? 'block' : 'none'; }); // Simple display toggle
        window.scrollTo({ top: 0, behavior: 'auto' }); // Changed to auto for faster switches
    }

    function showModulesView() {
        showView(modulesView);
        currentModule = null; // Clear selected module
        currentMethod = null; // Clear selected method
        // Hide breadcrumbs
        if (breadcrumbItem) breadcrumbItem.style.display = 'none';
        if (mobileBreadcrumb) mobileBreadcrumb.style.display = 'none';
    }

    function showMethodsView(moduleData) {
        if (!moduleData || !selectedModuleTitle || !methodDescriptionElement || !methodButtons) return;
        selectedModuleTitle.textContent = moduleData.title;
        if (breadcrumbModule && breadcrumbItem && mobileBreadcrumb) { // Update Breadcrumbs
            breadcrumbModule.textContent = moduleData.title;
            breadcrumbItem.style.display = 'block';
            mobileBreadcrumb.style.display = 'block';
            mobileBreadcrumb.textContent = moduleData.title;
            const handler = (e) => { e.preventDefault(); showMethodsView(currentModule); };
            breadcrumbModule.onclick = handler;
            mobileBreadcrumb.onclick = handler;
        }
        createMethodButtons(moduleData); // Populate buttons
        methodDescriptionElement.textContent = 'Select a study method to begin';
        showView(methodsView); // Show this view
        currentMethod = null; // Reset current method
    }

    function createMethodButtons(moduleData) {
        methodButtons.innerHTML = '';
        if (!moduleData || !moduleData.methods || moduleData.methods.length === 0) { methodButtons.innerHTML = '<p>No study methods available.</p>'; return; }
        moduleData.methods.forEach(methodKey => {
            const info = methodInfo[methodKey];
            if (!info) { console.warn(`No method info found for key: ${methodKey}`); return; } // Skip if info missing
            const button = document.createElement('button');
            button.className = 'method-button';
            button.id = `${methodKey}-button`;
            button.innerHTML = `<div class="method-icon">${info.icon}</div><div class="method-content"><div class="method-title">${info.name}</div><div class="method-desc">${info.description}</div></div>`;
            button.addEventListener('click', () => loadStudyMethod(moduleData, methodKey)); // Load this method
            methodButtons.appendChild(button);
        });
    }

    // NEW: Helper to create the study method switcher HTML
    function createMethodSwitcherHTML(moduleData, activeMethodKey) {
        if (!moduleData || !moduleData.methods) return '';
        let switcherHTML = '<div class="study-method-switcher">';
        moduleData.methods.forEach(methodKey => {
            const info = methodInfo[methodKey];
            if (!info) return;
            const isActive = methodKey === activeMethodKey;
            switcherHTML += `
                <button class="switcher-btn ${isActive ? 'active' : ''}" data-method="${methodKey}" title="${info.name}">
                    <span class="method-icon">${info.icon}</span>
                    <span class="switcher-label">${info.name}</span>
                </button>`;
        });
        switcherHTML += '</div>';
        return switcherHTML;
    }

    // NEW: Helper to attach listeners to switcher buttons
    function attachSwitcherListeners(moduleData) {
        document.querySelectorAll('.switcher-btn').forEach(button => {
            button.addEventListener('click', () => {
                const methodKey = button.dataset.method;
                // Don't reload if already on the active method
                if (methodKey !== currentMethod) {
                     loadStudyMethod(moduleData, methodKey);
                }
            });
        });
         // Add listener for the main "Back to Methods" button present in all study views
         const backBtn = document.getElementById('back-to-methods');
         if (backBtn) {
             backBtn.addEventListener('click', () => {
                 currentMethod = null; // Reset current method when going back
                 showMethodsView(currentModule);
             });
         }
    }


    // --- Study Method Loading ---
    async function loadStudyMethod(moduleData, methodKey) {
        currentMethod = methodKey; // Track the currently loaded method
        contentView.innerHTML = `<div class="loading-indicator"><div class="spinner"></div></div>`;
        showView(contentView);

        const methodContentData = moduleData.content ? moduleData.content[methodKey] : null;

        // Short delay to let loader show
        setTimeout(async () => {
            if (!methodContentData || !Array.isArray(methodContentData) || methodContentData.length === 0) {
                contentView.innerHTML = `<div class="content-container"><p>No content available for "${methodInfo[methodKey]?.name || methodKey}".</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                 attachSwitcherListeners(moduleData); // Still attach listener for back button
                 return;
            }

             // ** Construct full content view HTML including the switcher **
             let studyMethodHTML = '';
             // Generate HTML based on method (we'll call the specific functions to get their inner content)
             switch (methodKey) {
                 case 'flashcards': studyMethodHTML = getFlashcardsHTML(moduleData.title, methodContentData); break;
                 case 'quiz': studyMethodHTML = getQuizHTML(moduleData.title, methodContentData); break;
                 case 'time-trial': studyMethodHTML = getTimeTrialHTML(moduleData.title, methodContentData); break;
                 case 'true-false': studyMethodHTML = getTrueFalseHTML(moduleData.title, methodContentData); break;
                 default: studyMethodHTML = `<p>Method ${methodKey} UI not implemented.</p>`;
             }

            // Prepend switcher, append Back button
             contentView.innerHTML = `
                 ${createMethodSwitcherHTML(moduleData, methodKey)}
                 ${studyMethodHTML}
                 <div style="text-align: center; margin-top: var(--spacing-lg);">
                    <button id="back-to-methods" class="btn">Back to Methods</button>
                 </div>`;

            // ** Call initialization/logic function AFTER setting innerHTML **
            try {
                switch (methodKey) {
                     case 'flashcards': await initFlashcardsLogic(methodContentData); break;
                     case 'quiz': await initQuizLogic(moduleData.title, methodContentData); break; // Pass title if needed by results/review
                    case 'time-trial': await initTimeTrialGameLogic(moduleData.title, methodContentData); break;
                    case 'true-false': await initTrueFalseQuestionsLogic(moduleData.title, methodContentData); break;
                }
                 attachSwitcherListeners(moduleData); // Attach listeners AFTER elements exist
             } catch(error) {
                console.error(`Error initializing study method ${methodKey}:`, error);
                 contentView.innerHTML = `<div class="content-container"><p>Error loading "${methodInfo[methodKey]?.name || methodKey}".</p><button id="back-to-methods" class="btn">Back to Methods</button></div>`;
                 attachSwitcherListeners(moduleData);
             }
        }, 50);
    }


    // --- Specific Study Method HTML Generation and Logic Initialization ---
    // Refactor original functions to return HTML string and have separate init logic function

    function getFlashcardsHTML(moduleTitle, flashcardsData) {
        return `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - Flashcards</h2>
                <span class="progress-indicator">Card <span id="current-card-number">1</span> of ${flashcardsData.length}</span>
            </div>
            <div class="content-container">
                <div class="flashcard" id="current-flashcard">
                     <div class="flashcard-question" id="flashcard-question-content"></div>
                     <div class="flashcard-answer" id="flashcard-answer-content"></div>
                </div>
                <div id="flashcard-image-container" class="flashcard-image-container" style="display: none;">
                    <img id="flashcard-image" src="" alt="" class="flashcard-image">
                </div>
                 <div class="card-controls">
                    <button id="prev-card" class="btn">Previous</button>
                    <button id="flip-card" class="btn btn-primary">Flip</button>
                     <button id="next-card" class="btn">Next</button>
                </div>
            </div>`;
    }

    async function initFlashcardsLogic(flashcardsData) {
         let currentCardIndex = 0;
         const flashcardElement = document.getElementById('current-flashcard');
         const prevButton = document.getElementById('prev-card');
         const nextButton = document.getElementById('next-card');
         const flipButton = document.getElementById('flip-card');
         const cardNumberElement = document.getElementById('current-card-number');
         const imageContainer = document.getElementById('flashcard-image-container');
         const imageElement = document.getElementById('flashcard-image');

         const updateFlashcard = async () => {
            if (!flashcardsData || currentCardIndex < 0 || currentCardIndex >= flashcardsData.length) return;
            const card = flashcardsData[currentCardIndex];
             document.getElementById('flashcard-question-content').textContent = card.question;
             document.getElementById('flashcard-answer-content').textContent = card.answer;
             if (cardNumberElement) cardNumberElement.textContent = currentCardIndex + 1;
             if (flashcardElement) flashcardElement.classList.remove('flipped'); // Reset flip
             const imagePath = card.image;
             const imageExists = await checkImageExists(imagePath);
            if (imageExists && imageContainer && imageElement) {
                 imageElement.src = imagePath;
                 imageElement.alt = card.imageAlt || `Image for card ${currentCardIndex + 1}`;
                 imageContainer.style.display = (card.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
             } else if (imageContainer) {
                 imageContainer.style.display = 'none';
             }
            if (prevButton) prevButton.disabled = currentCardIndex === 0;
             if (nextButton) nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
         };

         const toggleFlashcard = () => {
            if (flashcardElement) flashcardElement.classList.toggle('flipped');
             const card = flashcardsData[currentCardIndex];
             // Check if image should be shown on flip
            if (imageContainer && imageElement && imageElement.src && card.imageDisplayTiming === "after-answer") {
                 imageContainer.style.display = flashcardElement.classList.contains('flipped') ? 'block' : 'none';
             }
         };

         if (flashcardElement) flashcardElement.addEventListener('click', toggleFlashcard);
         if (flipButton) flipButton.addEventListener('click', toggleFlashcard);
         if (prevButton) prevButton.addEventListener('click', async () => { if (currentCardIndex > 0) { currentCardIndex--; await updateFlashcard(); } });
         if (nextButton) nextButton.addEventListener('click', async () => { if (currentCardIndex < flashcardsData.length - 1) { currentCardIndex++; await updateFlashcard(); } });

         await updateFlashcard(); // Initial load
     }

    // --- QUIZ HTML AND LOGIC ---
     function getQuizHTML(moduleTitle, quizData) {
         return `
            <div class="content-header">
                 <h2 class="content-title">${moduleTitle} - Quiz</h2>
                 <span class="progress-indicator">Question <span id="current-question-number">1</span> of ${quizData.length}</span>
            </div>
            <div class="content-container">
                 <div class="quiz-container" id="quiz-container">
                     <div class="quiz-question" id="quiz-question"></div>
                     <div id="quiz-image-container" class="quiz-image-container" style="display: none;"><img id="quiz-image" src="" alt="" class="quiz-image"></div>
                     <ul class="quiz-options" id="quiz-options"></ul>
                     <div id="answer-feedback" class="true-false-feedback" style="display: none;"></div>
                </div>
                <div class="quiz-controls">
                    <button id="prev-question" class="btn">Previous</button>
                    <button id="next-question" class="btn">Next</button>
                 </div>
            </div>`;
    }

    async function initQuizLogic(moduleTitle, quizData) {
         let currentQuestionIndex = 0; let score = 0; let userAnswers = new Array(quizData.length).fill(null);

        const showQuizResults = () => { /* ... definition remains same, but uses local title/data vars ... */
             const percentage = quizData.length > 0 ? Math.round((score / quizData.length) * 100) : 0;
             // Overwrite the entire contentView, including the switcher, for results.
             contentView.innerHTML = `
                ${createMethodSwitcherHTML(currentModule, 'quiz')} {/* Regenerate switcher */}
                 <div class="content-header"><h2 class="content-title">${moduleTitle} - Quiz Results</h2></div>
                <div class="content-container"> <div class="quiz-results">
                    <div class="quiz-score">${score} / ${quizData.length}</div> <div class="quiz-percentage">${percentage}%</div>
                    ${score === quizData.length ? '<div class="quiz-perfect">Perfect Score!</div>': '<p>Review or retry!</p>'}
                    <div class="quiz-actions"> <button id="review-quiz" class="btn btn-primary">Review</button> <button id="retry-quiz" class="btn">Retry</button> <button id="back-to-methods" class="btn">Methods</button> </div>
                </div> </div>
                 <div style="text-align: center; margin-top: var(--spacing-lg);"><button id="final-back-to-methods" class="btn">Back to Methods</button></div>`; // Separate Back button
             attachSwitcherListeners(currentModule); // Re-attach switcher listeners
             document.getElementById('review-quiz').addEventListener('click', () => showQuizReview(moduleTitle, quizData, userAnswers));
             document.getElementById('retry-quiz').addEventListener('click', () => loadStudyMethod(currentModule, 'quiz'));
             document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
             document.getElementById('final-back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const showQuizReview = async (moduleTitle, quizData, userAnswers) => { /* ... definition remains same, renders review inside contentView ... */
             // Overwrite contentView, including switcher
            contentView.innerHTML = `
                 ${createMethodSwitcherHTML(currentModule, 'quiz')}
                <div class="content-header"><h2 class="content-title">${moduleTitle} - Quiz Review</h2></div>
                 <div class="content-container" id="review-container"></div>
                <button id="back-to-results" class="btn">Back to Results</button>
                <div style="text-align: center; margin-top: var(--spacing-lg);"><button id="final-back-to-methods" class="btn">Back to Methods</button></div>`;
             attachSwitcherListeners(currentModule); // Re-attach switcher listeners
             const reviewContainer = document.getElementById('review-container');
             if (!reviewContainer) return;
            for (let i = 0; i < quizData.length; i++) { /* ... rest of review rendering ... */
                 const question = quizData[i]; const userAnswerIndex = userAnswers[i]; const isCorrect = userAnswerIndex === question.correctAnswer; const imagePath = question.image; const imageExists = await checkImageExists(imagePath);
                 const reviewItem = document.createElement('div'); reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
                 reviewItem.innerHTML = `<div class="review-statement">${i + 1}. ${question.question}</div>${imageExists ? `<div class="review-image-container"><img src="${imagePath}" alt="${question.imageAlt||''}" class="review-image"></div>` : ''}<div class="review-details"><div class="review-answer">Yours: ${userAnswerIndex!==null?`<strong>${question.options[userAnswerIndex]}</strong>`:'Not answered'}</div><div class="review-answer">Correct: ${question.options[question.correctAnswer]}</div></div>`;
                 reviewContainer.appendChild(reviewItem);
            }
            document.getElementById('back-to-results').addEventListener('click', showQuizResults);
             document.getElementById('final-back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
         };


        const loadQuestion = async () => { // Function to render *just* the question part within the existing #content-view
            if (currentQuestionIndex < 0 || currentQuestionIndex >= quizData.length) return;
            const questionData = quizData[currentQuestionIndex];
            const imagePath = questionData.image;
            const imageExists = await checkImageExists(imagePath);

             // ** Only update the content needed for the question **
             const questionElement = document.getElementById('quiz-question');
             const optionsElement = document.getElementById('quiz-options');
             const feedbackElement = document.getElementById('answer-feedback');
             const imageContainer = document.getElementById('quiz-image-container');
             const imageElement = document.getElementById('quiz-image');
             const currentQNumEl = document.getElementById('current-question-number');
             const prevBtn = document.getElementById('prev-question');
             const nextBtn = document.getElementById('next-question');


             if (currentQNumEl) currentQNumEl.textContent = currentQuestionIndex + 1;
             if (questionElement) questionElement.textContent = questionData.question;
             if (feedbackElement) { feedbackElement.style.display = 'none'; feedbackElement.innerHTML = ''; } // Reset feedback

             // Handle image display
             if (imageContainer && imageElement) {
                 if (imageExists && questionData.imageDisplayTiming !== 'after-answer') {
                     imageElement.src = imagePath;
                     imageElement.alt = questionData.imageAlt || 'Quiz image';
                     imageContainer.style.display = 'block';
                 } else {
                     imageContainer.style.display = 'none';
                 }
            }

             // Handle options
            if (optionsElement) {
                optionsElement.innerHTML = ''; // Clear previous options
                questionData.options.forEach((option, index) => {
                    const optionElement = createOptionElement(option, index); // Use helper
                    optionsElement.appendChild(optionElement);
                 });
            }

            // Update Nav button states
            if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
            if (nextBtn) nextBtn.textContent = (currentQuestionIndex === quizData.length - 1) ? 'Submit' : 'Next';
         };

        // Helper moved from global scope to be within initQuizLogic's closure
         const createOptionElement = (optionText, index) => {
            const optionElement = document.createElement('li');
            optionElement.className = 'quiz-option';
            optionElement.textContent = optionText;
             const isAnswered = userAnswers[currentQuestionIndex] !== null;

            if (isAnswered && userAnswers[currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            if(isAnswered) {
                optionElement.style.pointerEvents = 'none'; // Disable if question already answered
            } else {
                 optionElement.addEventListener('click', async () => { // Only add listener if not answered
                     if (userAnswers[currentQuestionIndex] !== null) return;
                    document.querySelectorAll('#quiz-options .quiz-option').forEach(el => {
                         el.classList.remove('selected'); el.style.pointerEvents = 'none';
                    });
                    optionElement.classList.add('selected');
                     userAnswers[currentQuestionIndex] = index;
                    const questionData = quizData[currentQuestionIndex]; // Get current question data
                    const isCorrect = index === questionData.correctAnswer;
                    if (isCorrect) score++;
                     const feedbackElement = document.getElementById('answer-feedback');
                     const imageContainer = document.getElementById('quiz-image-container');
                    const imageElement = document.getElementById('quiz-image');
                    if (feedbackElement) {
                         feedbackElement.innerHTML = isCorrect ? '<div class="feedback-header">Correct!</div>' : `<div class="feedback-header">Incorrect! Correct: ${questionData.options[questionData.correctAnswer]}</div>`;
                         feedbackElement.className = `true-false-feedback visible ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
                         feedbackElement.style.display = 'block';
                     }
                     // Show image after answer
                     const imagePath = questionData.image; const imageExists = await checkImageExists(imagePath);
                     if (imageExists && questionData.imageDisplayTiming === 'after-answer' && imageContainer && imageElement) {
                         imageElement.src = imagePath; imageElement.alt = questionData.imageAlt || 'Quiz image';
                         imageContainer.style.display = 'block';
                     }
                });
             }
            return optionElement;
         };

        await loadQuestion(); // Load first question automatically (needs the wrapper HTML set first)

         // Attach main Nav listeners to the initial structure created by loadQuestion
        const prevButton = document.getElementById('prev-question');
        const nextButton = document.getElementById('next-question');
        if (prevButton) prevButton.addEventListener('click', async () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; await loadQuestion(); } });
        if (nextButton) nextButton.addEventListener('click', async () => { if (currentQuestionIndex < quizData.length - 1) { currentQuestionIndex++; await loadQuestion(); } else { showQuizResults(); } });
    }


     async function initTimeTrialGameLogic(moduleTitle, timeTrialData) { /* ... Includes fixes from previous version ... */
        let score = 0; let currentRound = 0; let timer; let timeLeft = 7; const totalRounds = timeTrialData.length; let isRoundActive = false;
        const updateTimerDisplay = () => { const el=document.getElementById('time-trial-time'); if(el){el.textContent=timeLeft+'s';el.classList.toggle('warning',timeLeft<=3);} };
        const endGame = () => { clearInterval(timer); isRoundActive = false; const pct=totalRounds>0?Math.round((score/totalRounds)*100):0;
            // Need to generate result HTML inside contentView here
             contentView.innerHTML = `${createMethodSwitcherHTML(currentModule,'time-trial')}<div class="content-header"><h2 class="content-title">${moduleTitle} - TT Results</h2></div><div class="content-container"><div class="time-trial-results"><div class="quiz-score">${score}/${totalRounds}</div><div class="quiz-percentage">${pct}%</div>${score === totalRounds ? '<div class="quiz-perfect">Perfect!</div>' : ''}<div class="quiz-actions"><button id="tt-replay" class="btn btn-primary">Retry</button><button id="back-to-methods" class="btn">Methods</button></div></div></div><div style="text-align:center;margin-top:1rem;"><button id="final-back" class="btn">Back to Methods</button></div>`;
             attachSwitcherListeners(currentModule);
             document.getElementById('tt-replay').addEventListener('click', () => loadStudyMethod(currentModule, 'time-trial'));
             document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
            document.getElementById('final-back').addEventListener('click', () => showMethodsView(currentModule));
         };
        const timeOut = async () => { if (!isRoundActive) return; clearInterval(timer); isRoundActive = false; const item=timeTrialData[currentRound-1]; const fb=document.getElementById('time-trial-feedback'); const opts=document.querySelectorAll('.time-trial-option'); const next=document.getElementById('time-trial-next'); const imgC=document.getElementById('time-trial-image-container'); const imgE=document.getElementById('time-trial-image'); opts.forEach(o=>{o.disabled=true;if(o.dataset.term===item.term)o.classList.add('correct');}); if(fb)fb.innerHTML=`<div class="feedback-timeout">Time Out! Ans: ${item.term}</div>`; if(imgC&&imgE&&item.imageDisplayTiming==="after-answer"){const p=item.image;const ex=await checkImageExists(p);if(ex){imgE.src=p;imgE.alt=item.imageAlt||'';imgC.style.display='block';}} if(next){next.style.display='block'; if(currentRound>=totalRounds){next.textContent="Results"; next.onclick=endGame;} else {next.textContent="Next"; next.onclick=nextRound;}} };
         const startTimer = () => { timeLeft=7; isRoundActive=true; updateTimerDisplay(); clearInterval(timer); timer=setInterval(()=>{if(!isRoundActive){clearInterval(timer);return;}timeLeft--;updateTimerDisplay();if(timeLeft<=0){timeOut();}},1000); };
         const selectOption = async (selectedTerm) => { if(!isRoundActive)return; isRoundActive=false; clearInterval(timer); const item=timeTrialData[currentRound-1]; const correct=item.term; const isCorrect=selectedTerm===correct; const fb=document.getElementById('time-trial-feedback'); const opts=document.querySelectorAll('.time-trial-option'); const next=document.getElementById('time-trial-next'); const scoreEl=document.getElementById('time-trial-score'); const imgC=document.getElementById('time-trial-image-container'); const imgE=document.getElementById('time-trial-image'); opts.forEach(o=>{o.disabled=true;if(o.dataset.term===correct)o.classList.add('correct');if(o.dataset.term===selectedTerm&&!isCorrect)o.classList.add('incorrect');}); if(isCorrect){score++; if(scoreEl)scoreEl.textContent=score;} if(fb)fb.innerHTML=isCorrect?'<div class="fb-correct">Correct!</div>':`<div class="fb-incorrect">Incorrect! Ans: ${correct}</div>`; if(imgC&&imgE&&item.imageDisplayTiming==="after-answer"){const p=item.image; const ex=await checkImageExists(p);if(ex){imgE.src=p;imgE.alt=item.imageAlt||'';imgC.style.display='block';}} if(next){next.style.display='block'; if(currentRound>=totalRounds){next.textContent="Results"; next.onclick=endGame;} else {next.textContent="Next"; next.onclick=nextRound;}} };
         const nextRound = async () => { if(currentRound>=totalRounds){endGame();return;} const item=timeTrialData[currentRound]; const defEl=document.getElementById('time-trial-definition'); const optsEl=document.getElementById('time-trial-options'); const fbEl=document.getElementById('time-trial-feedback'); const nextBtn=document.getElementById('time-trial-next'); const currEl=document.getElementById('time-trial-current'); const imgC=document.getElementById('time-trial-image-container'); const imgE=document.getElementById('time-trial-image'); if(fbEl)fbEl.innerHTML='';if(nextBtn)nextBtn.style.display='none';if(currEl)currEl.textContent=`${currentRound+1}/${totalRounds}`;if(defEl)defEl.textContent=item.definition; const imgPath=item.image;const imgExists=await checkImageExists(imgPath);if(imgC&&imgE){if(imgExists){imgE.src=imgPath;imgE.alt=item.imageAlt||'';imgC.style.display=(item.imageDisplayTiming!=="after-answer")?'block':'none';}else{imgC.style.display='none';}} const distractors=timeTrialData.map(i=>i.term).filter(t=>t!==item.term).sort(()=>0.5-Math.random()).slice(0,3);const terms=[item.term,...distractors].sort(()=>0.5-Math.random());if(optsEl){optsEl.innerHTML='';terms.forEach(t=>{const btn=document.createElement('button');btn.className='time-trial-option';btn.textContent=t;btn.dataset.term=t;btn.onclick=()=>selectOption(t);optsEl.appendChild(btn);});} currentRound++; startTimer(); }; // Use onclick assignment for simplicity
        const startGame = () => { score=0;currentRound=0; const sEl=document.getElementById('time-trial-score'); const startScr=document.getElementById('time-trial-start-screen'); const gameScr=document.getElementById('time-trial-gameplay'); if(sEl)sEl.textContent='0'; if(startScr)startScr.style.display='none'; if(gameScr)gameScr.style.display='block'; nextRound(); };
         // Call startGame on button click - listener attached when HTML is generated by loadStudyMethod
     }

    async function initTrueFalseQuestionsLogic(moduleTitle, trueFalseData) { /* ... Includes fixes ... */
        let score = 0; let currentQuestionIndex = 0; let userAnswers = new Array(trueFalseData.length).fill(null); const totalQuestions = trueFalseData.length;
         const showResults = () => { /* ... definition same, updates contentView ... */
             const pct=totalQuestions>0?Math.round((score/totalQuestions)*100):0;
             contentView.innerHTML = `${createMethodSwitcherHTML(currentModule, 'true-false')} <div class="content-header"><h2 class="content-title">${moduleTitle} - T/F Results</h2></div><div class="content-container"><div class="time-trial-results"><div class="quiz-score">${score}/${totalQuestions}</div><div class="quiz-percentage">${pct}%</div>${score===totalQuestions?'<div class="quiz-perfect">Perfect!</div>':''}<div class="quiz-actions"><button id="tf-review" class="btn btn-primary">Review</button><button id="tf-replay" class="btn">Retry</button><button id="back-to-methods" class="btn">Methods</button></div></div></div><div style="text-align:center;margin-top:1rem;"><button id="final-back" class="btn">Back to Methods</button></div>`;
             attachSwitcherListeners(currentModule); document.getElementById('tf-review').addEventListener('click', () => showReview(moduleTitle, trueFalseData, userAnswers)); document.getElementById('tf-replay').addEventListener('click',()=>loadStudyMethod(currentModule, 'true-false')); document.getElementById('back-to-methods').addEventListener('click',()=>showMethodsView(currentModule)); document.getElementById('final-back').addEventListener('click',()=>showMethodsView(currentModule));
         };
         const showReview = async (moduleTitle, trueFalseData, userAnswers) => { /* ... definition same, updates contentView ... */
            contentView.innerHTML = `${createMethodSwitcherHTML(currentModule, 'true-false')} <div class="content-header"><h2 class="content-title">${moduleTitle} - T/F Review</h2></div><div class="content-container" id="review-container"></div><button id="back-to-results" class="btn">Results</button><div style="text-align:center;margin-top:1rem;"><button id="final-back" class="btn">Back to Methods</button></div>`;
            attachSwitcherListeners(currentModule); const reviewContainer=document.getElementById('review-container');
            for(let i=0;i<trueFalseData.length;i++){const q=trueFalseData[i];const ans=userAnswers[i];const imgPath=q.image; const imgExists=await checkImageExists(imgPath); const item=document.createElement('div');item.className=`review-item ${ans&&ans.isCorrect?'correct':'incorrect'}`; item.innerHTML = `<div class="review-statement">${i+1}. ${q.statement}</div> ${imgExists?`<div class="r-img-c"><img src="${imgPath}" alt="${q.imageAlt||''}" class="r-img"></div>`:''} <div class="review-details"><div class="r-ans">Correct: <strong>${q.isTrue?'T':'F'}</strong></div> ${ans?`<div class="r-ans">Yours: <strong>${ans.userAnswer?'T':'F'}</strong></div>`:''} <div class="review-explanation">${q.explanation||''}</div></div>`; reviewContainer.appendChild(item);} // Simplified review HTML IDs
             document.getElementById('back-to-results').addEventListener('click', showResults); document.getElementById('final-back').addEventListener('click',()=>showMethodsView(currentModule));
        };
        const nextQuestion = async () => { currentQuestionIndex++; if(currentQuestionIndex>=totalQuestions){showResults();}else{await loadQuestion();} };
         const selectAnswer = async (userAnswer) => { /* ... Mostly same logic ... */
            const questionData=trueFalseData[currentQuestionIndex]; const isCorrect=userAnswer===questionData.isTrue; if(isCorrect)score++; userAnswers[currentQuestionIndex]={userAnswer, isCorrect};
            const trueBtn=document.getElementById('true-button');const falseBtn=document.getElementById('false-button'); const fbEl=document.getElementById('tf-feedback'); const nextBtn=document.getElementById('tf-next'); const imgC=document.getElementById('tf-img-c'); const imgE=document.getElementById('tf-img'); // Use simplified IDs
            if(trueBtn)trueBtn.disabled=true; if(falseBtn)falseBtn.disabled=true; document.getElementById(userAnswer?'true-button':'false-button').classList.add('selected');
             if(fbEl){ fbEl.innerHTML = `<div class="fb-hdr" style="color:${isCorrect?'var(--success)':'var(--error)'};">${isCorrect?'Correct!':'Incorrect!'}</div><div class="fb-cont">${questionData.explanation||''}</div>`; fbEl.className=`tf-fb visible ${isCorrect?'fb-correct':'fb-incorrect'}`; fbEl.style.display='block'; }
            if(imgC&&imgE&&questionData.imageDisplayTiming==='after-answer'){const p=questionData.image;const ex=await checkImageExists(p);if(ex){imgE.src=p;imgE.alt=questionData.imageAlt||'';imgC.style.display='block';}}
            if(nextBtn){nextBtn.style.display='block'; nextBtn.textContent=(currentQuestionIndex===totalQuestions-1)?"Results":"Next";}
         };
        const loadQuestion = async () => { /* ... Mostly same logic ... */
            if(currentQuestionIndex<0||currentQuestionIndex>=totalQuestions)return; const qData=trueFalseData[currentQuestionIndex]; const imgPath=qData.image;const imgExists=await checkImageExists(imgPath);
             // Set specific elements, assume wrapper exists from getTrueFalseHTML
             const currentNumEl=document.getElementById('tf-current');const statementEl=document.getElementById('tf-statement');const trueBtn=document.getElementById('true-button');const falseBtn=document.getElementById('false-button');const fbEl=document.getElementById('tf-feedback');const nextBtn=document.getElementById('tf-next');const imgCont=document.getElementById('tf-img-c');const imgEl=document.getElementById('tf-img');
             if(currentNumEl)currentNumEl.textContent=currentQuestionIndex+1;if(statementEl)statementEl.textContent=qData.statement;
            if(trueBtn){trueBtn.disabled=false;trueBtn.classList.remove('selected');} if(falseBtn){falseBtn.disabled=false;falseBtn.classList.remove('selected');}
            if(fbEl){fbEl.style.display='none';fbEl.innerHTML='';fbEl.className='tf-fb';} if(nextBtn)nextBtn.style.display='none';
             if(imgCont&&imgEl){if(imgExists){imgEl.src=imgPath;imgEl.alt=qData.imageAlt||'';imgCont.style.display=(qData.imageDisplayTiming!=='after-answer')?'block':'none';}else{imgCont.style.display='none';}}
        };

        // Initial UI setup (provided by getTrueFalseHTML called by loadStudyMethod)
         await loadQuestion(); // Call loadQuestion to populate the initial state
         // Add listeners after elements are guaranteed to be in DOM by loadQuestion's first run
         document.getElementById('true-button').addEventListener('click', () => selectAnswer(true));
         document.getElementById('false-button').addEventListener('click', () => selectAnswer(false));
         document.getElementById('tf-next').addEventListener('click', nextQuestion);
     }


     // HTML Generation function for True/False (called by loadStudyMethod)
     function getTrueFalseHTML(moduleTitle, trueFalseData) {
         const totalQuestions = trueFalseData.length;
        return `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - True/False</h2>
                <span class="progress-indicator">Question <span id="tf-current">1</span> of ${totalQuestions}</span>
            </div>
            <div class="content-container">
                 <div class="tf-container">
                     <div class="tf-statement" id="tf-statement">Loading statement...</div>
                     <div id="tf-img-c" class="tf-img-c" style="display:none;"><img id="tf-img" src="" alt="" class="tf-img"></div>
                    <div class="true-false-options">
                         <button id="true-button" class="btn btn-true">TRUE</button>
                         <button id="false-button" class="btn btn-false">FALSE</button>
                     </div>
                     <div class="tf-fb" id="tf-feedback" style="display:none;"></div>
                </div>
                 <div class="quiz-controls" style="justify-content: flex-end;">
                     <button id="tf-next" class="btn btn-primary" style="display: none;">Next Question</button>
                 </div>
             </div>`;
             // Note: Back to Methods button is added *outside* this by loadStudyMethod
     }


}); // --- END OF FILE: js/app.js ---
