// START OF FILE: js/assessments.js --- REPLACE ENTIRE FILE ---

import { loadAssessmentsList, loadAssessment, getImagePath, checkImageExists } from './module-loader.js';

// DOM Elements (declare globally or ensure available in scope)
let assessmentsView, assessmentIntro, assessmentContent, assessmentTitle, assessmentDescription,
    questionCount, timeLimit, passingScore, startButton, backButton, assessmentsList, assessmentsLoading;

// Assessment state (declare globally or ensure available in scope)
let currentAssessment = null;
let userAnswers = [];
let currentQuestionIndex = 0;
let totalQuestions = 0;
let assessmentTimer = null;
let timeRemaining = 0;
let assessmentCompleted = false;

// Initialize the assessments page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Assessments page loaded');

    // Assign DOM elements
    assessmentsView = document.getElementById('assessments-view');
    assessmentIntro = document.getElementById('assessment-intro');
    assessmentContent = document.getElementById('assessment-content');
    assessmentTitle = document.getElementById('assessment-title');
    assessmentDescription = document.getElementById('assessment-description');
    questionCount = document.getElementById('question-count');
    timeLimit = document.getElementById('time-limit');
    passingScore = document.getElementById('passing-score');
    startButton = document.getElementById('start-assessment');
    backButton = document.getElementById('back-to-assessments');
    assessmentsList = document.getElementById('assessments-list');
    assessmentsLoading = document.getElementById('assessments-loading'); // Get loader

    // Initial view setup
    if (assessmentsView) assessmentsView.classList.add('view-hidden');
    if (assessmentIntro) assessmentIntro.classList.add('view-hidden');
    if (assessmentContent) assessmentContent.classList.add('view-hidden');

    initAssessments();

     // Add loaded class to body
    document.body.classList.add('loaded');
});

/**
 * Initialize assessments functionality
 */
async function initAssessments() {
    console.log('Initializing assessments');
    await loadAssessments(); // Load list first
    setupEventListeners();
    showAssessmentsView(); // Show the initial list view
}

/**
 * Setup main event listeners
 */
function setupEventListeners() {
    console.log('Setting up assessment event listeners');
    if (backButton) backButton.addEventListener('click', showAssessmentsView);
    if (startButton) startButton.addEventListener('click', startAssessment);
}

/**
 * Load and display the list of available assessments
 */
async function loadAssessments() {
    console.log('Loading assessments list');
    if (!assessmentsList) return; // Guard if element missing

    if (assessmentsLoading) assessmentsLoading.style.display = 'flex'; // Show loader
    assessmentsList.innerHTML = ''; // Clear previous

    try {
        const assessmentsData = await loadAssessmentsList(); // Use loader function
        if (assessmentsLoading) assessmentsLoading.style.display = 'none'; // Hide loader

        if (!assessmentsData || assessmentsData.length === 0) {
            assessmentsList.innerHTML = `<div class="empty-state"><p>No assessments available.</p></div>`;
            return;
        }

        assessmentsData.forEach(assessment => {
            const assessmentCard = createAssessmentCard(assessment);
            assessmentsList.appendChild(assessmentCard);
        });
    } catch (error) {
        console.error('Error rendering assessments list:', error);
        if (assessmentsLoading) assessmentsLoading.style.display = 'none';
        assessmentsList.innerHTML = `<div class="error-message"><p>Could not load assessments list.</p></div>`;
    }
}

/**
 * Create HTML for a single assessment card
 */
function createAssessmentCard(assessment) {
    const card = document.createElement('div');
    card.className = 'assessment-card';
    card.innerHTML = `
        <h3 class="assessment-card-title">${assessment.title || 'Assessment'}</h3>
        <p class="assessment-card-desc">${assessment.description || 'Test your knowledge.'}</p>
        <div class="assessment-card-meta">
            <span>${assessment.questionCount || '?'} Questions</span>
            ${assessment.timeLimit ? `<span>${assessment.timeLimit} min</span>` : ''}
        </div>`;
    card.addEventListener('click', () => loadAssessmentDetails(assessment.id));
    return card;
}

/**
 * Load details for a specific assessment and display intro view
 */
async function loadAssessmentDetails(assessmentId) {
    console.log(`Loading assessment details for ${assessmentId}`);
     // Add basic loading state to intro view if desired
     if(assessmentTitle) assessmentTitle.textContent = "Loading...";
     if(assessmentDescription) assessmentDescription.textContent = "";
     showAssessmentIntroView(); // Show the view while loading

    try {
        const assessment = await loadAssessment(assessmentId);
        currentAssessment = assessment;

         if (!assessment || !assessment.questions || !Array.isArray(assessment.questions) || assessment.questions.length === 0) {
             throw new Error(`Data for assessment '${assessmentId}' is invalid or missing questions.`);
         }

        // Populate intro details
        if (assessmentTitle) assessmentTitle.textContent = assessment.title || 'Assessment';
        if (assessmentDescription) assessmentDescription.textContent = assessment.description || 'Test your knowledge.';
        if (questionCount) questionCount.textContent = assessment.questions.length;
        if (timeLimit) timeLimit.textContent = assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit';
        if (passingScore) passingScore.textContent = assessment.passingScore ? `${assessment.passingScore}%` : '70%';
        if (startButton) startButton.disabled = false; // Enable start button

        // Set time remaining
         timeRemaining = assessment.timeLimit ? assessment.timeLimit * 60 : 0;

        // Update breadcrumb
        if (window.updateAssessmentBreadcrumb) {
             window.updateAssessmentBreadcrumb(assessment.title, () => showAssessmentIntroView());
         }
    } catch (error) {
        console.error(`Error loading assessment details ${assessmentId}:`, error);
         if(assessmentTitle) assessmentTitle.textContent = 'Load Error';
         if(assessmentDescription) assessmentDescription.textContent = `Could not load details: ${error.message}. Please try another assessment.`;
         if(questionCount) questionCount.textContent = 'N/A';
         if(timeLimit) timeLimit.textContent = 'N/A';
         if(passingScore) passingScore.textContent = 'N/A';
         if (startButton) { startButton.disabled = true; startButton.textContent = 'Unavailable'; }
    }
}

/**
 * Start the loaded assessment
 */
function startAssessment() {
    console.log('Starting assessment:', currentAssessment?.id);
    if (!currentAssessment || !currentAssessment.questions || currentAssessment.questions.length === 0) {
        alert('Cannot start assessment. Data is missing or invalid.');
        return;
    }
    userAnswers = new Array(currentAssessment.questions.length).fill(null);
    currentQuestionIndex = 0;
    totalQuestions = currentAssessment.questions.length;
    assessmentCompleted = false;
    showAssessmentContentView(); // Show the content view
    loadQuestion(currentQuestionIndex);
    if (currentAssessment.timeLimit && currentAssessment.timeLimit > 0) {
        startTimer();
    }
}

/**
 * Load and display a specific question
 */
async function loadQuestion(index) {
    console.log(`Loading assessment question ${index}`);
     if (!currentAssessment || index < 0 || index >= totalQuestions || assessmentCompleted) return;

    const question = currentAssessment.questions[index];
    if (!assessmentContent || !question || !Array.isArray(question.options)) {
         console.error("Error loading question: Content area or question data invalid.");
         assessmentContent.innerHTML = "<p>Error displaying question.</p>"; return;
     }

    // Check image existence using helpers
    const imagePath = question.image ? question.image : getImagePath(currentAssessment.moduleId || currentAssessment.id, 'assessment', index);
    const imageExists = await checkImageExists(imagePath);
    const displayImagePath = imageExists ? imagePath : '';
    const imageAlt = imageExists ? (question.imageAlt || `Image for question ${index + 1}`) : '';

    assessmentContent.innerHTML = `
         <div class="content-header">
             <h2 class="content-title">${currentAssessment.title}</h2>
             <span class="progress-indicator">Question <span id="current-question">${index + 1}</span> / ${totalQuestions}</span>
         </div>
         <div class="content-container">
             <div class="assessment-progress-bar"><div class="progress-fill" style="width:${((index + 1) / totalQuestions) * 100}%"></div></div>
             ${currentAssessment.timeLimit ? `<div class="assessment-timer"><div class="timer-label">Time:</div><div class="timer-value" id="timer-display">--:--</div></div>` : ''}
             <div class="quiz-container">
                 <div class="quiz-question">${question.question}</div>
                 ${displayImagePath ? `<div class="question-image-container"><img src="${displayImagePath}" alt="${imageAlt}" class="question-image"></div>` : ''}
                 <ul class="quiz-options" id="question-options"></ul>
             </div>
             <div class="assessment-controls">
                 <button id="prev-question" class="btn" ${index === 0 ? 'disabled' : ''}>Previous</button>
                 <span class="questions-indicator">${index + 1} / ${totalQuestions}</span>
                 <button id="next-question" class="btn">${index === totalQuestions - 1 ? 'Finish' : 'Next'}</button>
             </div>
         </div>`;

     if (currentAssessment.timeLimit) updateTimerDisplay();

    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
         question.options.forEach((option, optionIndex) => {
             const optionElement = createOptionElement(option, index, optionIndex);
             optionsContainer.appendChild(optionElement);
         });
     }

    // Add navigation listeners
     const prevButton = document.getElementById('prev-question');
     const nextButton = document.getElementById('next-question');
     if (prevButton) prevButton.addEventListener('click', () => navigateQuestion(-1));
     if (nextButton) nextButton.addEventListener('click', () => navigateQuestion(1));
}


/**
 * Create an option list item element for assessment questions
 */
function createOptionElement(optionText, questionIndex, optionIndex) {
    const optionElement = document.createElement('li');
    optionElement.className = 'quiz-option';
    optionElement.textContent = optionText;
    if (userAnswers[questionIndex] === optionIndex) { // Restore selection state
        optionElement.classList.add('selected');
    }
    // Listener to handle selection
    optionElement.addEventListener('click', () => handleOptionSelect(questionIndex, optionIndex));
    return optionElement;
}

/**
 * Handle user selecting an answer option
 */
function handleOptionSelect(questionIndex, optionIndex) {
     if (assessmentCompleted) return;
     const options = document.querySelectorAll('#question-options .quiz-option');
     options.forEach((el, idx) => el.classList.toggle('selected', idx === optionIndex));
     userAnswers[questionIndex] = optionIndex;
}

/**
 * Navigate between questions or finish
 */
function navigateQuestion(direction) {
     if (assessmentCompleted) return;
     const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < totalQuestions) {
         currentQuestionIndex = newIndex;
         loadQuestion(currentQuestionIndex); // Load the new question
    } else if (direction > 0 && newIndex >= totalQuestions) { // Finishing
        // Count unanswered before confirming
        const unanswered = userAnswers.filter(ans => ans === null).length;
        const message = unanswered > 0
            ? `You have ${unanswered} unanswered question(s). Are you sure you want to finish?`
            : 'Are you sure you want to finish the assessment?';
        if (confirm(message)) {
             finishAssessment();
        }
     }
 }

/**
 * Start the assessment timer (if applicable)
 */
function startTimer() {
     console.log('Starting assessment timer');
     if (assessmentTimer) clearInterval(assessmentTimer);
     assessmentTimer = setInterval(() => {
         timeRemaining--;
         updateTimerDisplay();
         if (timeRemaining <= 0) {
             clearInterval(assessmentTimer);
             alert('Time is up! Your assessment will be submitted.');
             finishAssessment(); // Automatically finish when time runs out
         }
    }, 1000);
}

/**
 * Update the on-screen timer display
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay && timeRemaining >= 0) { // Prevent displaying negative time
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerDisplay.classList.toggle('warning', timeRemaining < 120 && timeRemaining > 0); // Show warning under 2 min
    }
}

/**
 * Finalize the assessment, calculate score, and show results
 */
function finishAssessment() {
     console.log('Finishing assessment and calculating results');
     if (assessmentCompleted) return; // Prevent multiple calls
     if (assessmentTimer) clearInterval(assessmentTimer);
     assessmentCompleted = true;

     const correctAnswers = userAnswers.reduce((count, answer, index) => {
         return (currentAssessment?.questions?.[index] && answer === currentAssessment.questions[index].correctAnswer) ? count + 1 : count;
     }, 0);
     const totalAnswered = userAnswers.filter(answer => answer !== null).length;
     const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
     const passingThreshold = currentAssessment?.passingScore || 70;
     const passed = score >= passingThreshold;

     renderResults(score, correctAnswers, totalAnswered, passed, passingThreshold);
}

/**
 * Display the assessment results screen
 */
function renderResults(score, correctCount, answeredCount, passed, passingThreshold) {
     console.log(`Rendering results: Score ${score}%, Passed: ${passed}`);
    assessmentContent.innerHTML = `
        <div class="content-header"><h2 class="content-title">${currentAssessment.title} - Results</h2></div>
        <div class="content-container">
            <div class="assessment-results">
                <div class="result-summary">
                    <div class="result-score ${passed ? 'pass' : 'fail'}"><div class="score-value">${score}%</div><div class="score-label">${passed ? 'PASSED' : 'FAILED'}</div></div>
                    <div class="result-details">
                         <div class="result-item"><div class="result-label">Questions:</div><div class="result-value">${totalQuestions}</div></div>
                         <div class="result-item"><div class="result-label">Answered:</div><div class="result-value">${answeredCount}</div></div>
                         <div class="result-item"><div class="result-label">Correct:</div><div class="result-value">${correctCount}</div></div>
                         <div class="result-item"><div class="result-label">Passing:</div><div class="result-value">${passingThreshold}%</div></div>
                     </div></div>
                <div class="result-message">${passed ? '<p>Congratulations!</p>' : '<p>You did not meet the passing score.</p>'}</div>
                <div class="result-actions">
                     <button id="review-answers" class="btn btn-primary">Review Answers</button>
                     <button id="retry-assessment" class="btn">Retry Assessment</button>
                     <button id="back-to-assessments-list" class="btn">All Assessments</button>
                 </div></div></div>`;

    document.getElementById('review-answers').addEventListener('click', showReview);
    document.getElementById('retry-assessment').addEventListener('click', () => startAssessment()); // Resets state
    document.getElementById('back-to-assessments-list').addEventListener('click', showAssessmentsView);
}

/**
 * Display the detailed review of answers
 */
async function showReview() {
     console.log('Showing assessment answer review');
     assessmentContent.innerHTML = `
         <div class="content-header"><h2 class="content-title">${currentAssessment.title} - Review</h2></div>
         <div class="content-container">
             <div id="review-container" class="review-container"></div>
            <button id="back-to-results" class="btn" style="margin-top: 1.5rem;">Back to Results</button>
         </div>`;

     const reviewContainer = document.getElementById('review-container');
     if (!reviewContainer) return;

     for (let index = 0; index < totalQuestions; index++) {
        const question = currentAssessment.questions[index];
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        const imagePath = question.image ? question.image : getImagePath(currentAssessment.moduleId || currentAssessment.id, 'assessment', index);
        const imageExists = await checkImageExists(imagePath);
        const displayImagePath = imageExists ? imagePath : '';
        const imageAlt = imageExists ? (question.imageAlt || `Image for question ${index + 1}`) : '';

        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        reviewItem.innerHTML = `
             <div class="review-question" style="font-weight: 500; margin-bottom: 0.5rem;">${index + 1}. ${question.question}</div>
             ${displayImagePath ? `<div class="question-image-container" style="margin-bottom: 0.5rem;"><img src="${displayImagePath}" alt="${imageAlt}" class="question-image"></div>` : ''}
             <div class="review-details" style="background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
                 <div class="review-answer" style="font-size: 0.9em;">Your answer: ${userAnswer !== null ? `<strong>${question.options[userAnswer]}</strong>` : 'Not answered'}</div>
                 <div class="review-answer" style="font-size: 0.9em;">Correct answer: ${question.options[question.correctAnswer]}</div>
                 ${question.explanation ? `<div class="review-explanation" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); font-size: 0.9em; color: var(--text-secondary);">${question.explanation}</div>` : ''}
             </div>`;
         reviewContainer.appendChild(reviewItem);
     }

    document.getElementById('back-to-results').addEventListener('click', () => {
        // Need to recalculate results as they aren't stored globally
        finishAssessment(); // This function calculates and renders results
    });
 }

/**
 * Show the assessments list view and reset state
 */
function showAssessmentsView() {
     console.log('Showing assessments list view');
    showView(assessmentsView); // Use helper function
    currentAssessment = null;
     if (assessmentTimer) clearInterval(assessmentTimer); assessmentTimer = null;
    if (window.hideAssessmentBreadcrumb) window.hideAssessmentBreadcrumb();
 }

/**
 * Show the assessment introduction view
 */
function showAssessmentIntroView() {
     console.log('Showing assessment intro view');
    showView(assessmentIntro); // Use helper function
 }

/**
 * Show the main assessment content view
 */
function showAssessmentContentView() {
     console.log('Showing assessment content view');
    showView(assessmentContent); // Use helper function
 }

 /**
 * Helper function to manage view visibility using classes
 */
function showView(viewToShow) {
    const views = [assessmentsView, assessmentIntro, assessmentContent];
    views.forEach(view => {
         if (view) { // Check if element exists
            view.classList.toggle('view-hidden', view !== viewToShow);
            view.classList.toggle('view-visible', view === viewToShow);
         }
    });
     if (viewToShow) window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for the shown view
}

// --- END OF FILE: js/assessments.js ---
