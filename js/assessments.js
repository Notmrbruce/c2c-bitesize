/**
 * Assessments functionality for C2C Bitesize
 * Handles loading and interaction with assessment content
 */

 // MODIFIED: Updated import statement
import { loadAssessmentsList, loadAssessment, getImagePath, checkImageExists } from './module-loader.js';

// DOM Elements (declarations remain the same)
let assessmentsView;
// ... (rest of declarations)
let assessmentCompleted = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Assessments page loaded');
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
    init();
});

async function init() {
    console.log('Initializing assessments');
    await loadAssessments(); // Load assessments list first
    setupEventListeners();
}

function setupEventListeners() {
    console.log('Setting up event listeners');
    if (backButton) backButton.addEventListener('click', showAssessmentsView);
    if (startButton) startButton.addEventListener('click', startAssessment);
}

async function loadAssessments() {
     console.log('Loading assessments list');
     if (!assessmentsList) {
        console.error('Assessment list element not found in the DOM');
        return;
     }
     try {
         let assessmentsData = [];
         try {
             assessmentsData = await loadAssessmentsList(); // Uses the function from module-loader
            console.log('Loaded assessments:', assessmentsData);
         } catch (error) {
            console.warn('No assessments found or error loading assessments index.json. Displaying empty state.', error);
            assessmentsData = []; // Fallback to empty array
         }

        assessmentsList.innerHTML = ''; // Clear previous list

        if (assessmentsData.length === 0) {
            assessmentsList.innerHTML = `<div class="empty-state"><p>No assessments currently available.</p></div>`;
            return;
        }

        assessmentsData.forEach(assessment => {
            const assessmentCard = createAssessmentCard(assessment);
            assessmentsList.appendChild(assessmentCard);
        });
     } catch (error) {
        console.error('Error rendering assessments list:', error);
        assessmentsList.innerHTML = `<div class="error-message"><p>Could not load assessments. Please try again later.</p></div>`;
    }
}

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


async function loadAssessmentDetails(assessmentId) {
    console.log(`Loading assessment details for ${assessmentId}`);
    if (!assessmentTitle || !assessmentDescription || !questionCount || !timeLimit || !passingScore) {
        console.error('Required assessment detail DOM elements missing.');
        return;
    }

    try {
        const assessment = await loadAssessment(assessmentId); // Uses function from module-loader
        console.log('Assessment loaded:', assessment);
        currentAssessment = assessment;

        // Validate essential data
         if (!assessment || !assessment.questions || !Array.isArray(assessment.questions) || assessment.questions.length === 0) {
             throw new Error(`Assessment data for '${assessmentId}' is missing questions or is invalid.`);
         }

        assessmentTitle.textContent = assessment.title || 'Assessment';
        assessmentDescription.textContent = assessment.description || 'Ready to test your knowledge?';
        questionCount.textContent = assessment.questions.length;
        timeLimit.textContent = assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit';
        passingScore.textContent = assessment.passingScore ? `${assessment.passingScore}%` : '70%';
        timeRemaining = assessment.timeLimit ? assessment.timeLimit * 60 : 0; // Reset timeRemaining

        if (startButton) startButton.disabled = false; // Enable start button

        showAssessmentIntroView();
        // Update breadcrumb if function exists
        if (window.updateAssessmentBreadcrumb) {
            window.updateAssessmentBreadcrumb(assessment.title, () => showAssessmentIntroView());
        }
    } catch (error) {
        console.error(`Error loading or validating assessment ${assessmentId}:`, error);
        assessmentTitle.textContent = 'Assessment Error';
        assessmentDescription.textContent = `Could not load assessment details. Please try selecting another or check back later. Error: ${error.message}`;
        questionCount.textContent = 'N/A';
        timeLimit.textContent = 'N/A';
        passingScore.textContent = 'N/A';
        if (startButton) startButton.disabled = true;
        showAssessmentIntroView(); // Show intro view even with error
    }
}


function startAssessment() {
    console.log('Starting assessment');
    if (!currentAssessment || !currentAssessment.questions || currentAssessment.questions.length === 0) {
        console.error('Cannot start: No valid assessment data loaded.');
        alert('Sorry, this assessment cannot be started currently.');
        return;
    }
    userAnswers = new Array(currentAssessment.questions.length).fill(null);
    currentQuestionIndex = 0;
    totalQuestions = currentAssessment.questions.length;
    assessmentCompleted = false;
    showAssessmentContentView();
    loadQuestion(currentQuestionIndex);
    if (currentAssessment.timeLimit && currentAssessment.timeLimit > 0) {
        startTimer();
    }
}

async function loadQuestion(index) {
     console.log(`Loading assessment question ${index}`);
     if (!currentAssessment || index < 0 || index >= totalQuestions || assessmentCompleted) return; // Add completion check

    const question = currentAssessment.questions[index];
    if (!assessmentContent || !question || !Array.isArray(question.options)) {
        console.error("Error loading question: Content area or question data invalid.", question);
        assessmentContent.innerHTML = "<p>Error loading question.</p>"; // Provide feedback
        return;
    }

     // MODIFIED: Use robust image check and path generation
     const imagePath = question.image ? question.image : getImagePath(currentAssessment.moduleId || currentAssessment.id, 'assessment', index);
     const imageExists = await checkImageExists(imagePath);
     const displayImagePath = imageExists ? imagePath : ''; // Use empty if doesn't exist
     const imageAlt = imageExists ? (question.imageAlt || 'Question image') : '';


    assessmentContent.innerHTML = `
         <div class="content-header">
             <h2 class="content-title">${currentAssessment.title}</h2>
             <span class="progress-indicator">Question <span id="current-question">${index + 1}</span> of ${totalQuestions}</span>
         </div>
         <div class="content-container">
             <div class="assessment-progress-bar">
                 <div class="progress-fill" style="width: ${((index + 1) / totalQuestions) * 100}%"></div>
            </div>
             ${currentAssessment.timeLimit ? `<div class="assessment-timer"><div class="timer-label">Time:</div><div class="timer-value" id="timer-display"></div></div>` : ''}
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

    if (currentAssessment.timeLimit) updateTimerDisplay(); // Update timer if needed

    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
        question.options.forEach((option, optionIndex) => {
            const optionElement = createOptionElement(option, index, optionIndex);
             optionsContainer.appendChild(optionElement);
        });
     } else {
         console.error("Could not find #question-options container");
    }

    // Add navigation listeners
     const prevButton = document.getElementById('prev-question');
     const nextButton = document.getElementById('next-question');
     if (prevButton) prevButton.addEventListener('click', () => navigateQuestion(-1));
     if (nextButton) nextButton.addEventListener('click', () => navigateQuestion(1));

}

function createOptionElement(optionText, questionIndex, optionIndex) {
    const optionElement = document.createElement('li');
    optionElement.className = 'quiz-option';
    optionElement.textContent = optionText;
    if (userAnswers[questionIndex] === optionIndex) {
        optionElement.classList.add('selected');
    }
    optionElement.addEventListener('click', () => handleOptionSelect(questionIndex, optionIndex));
    return optionElement;
}

function handleOptionSelect(questionIndex, optionIndex) {
     if (assessmentCompleted) return; // Don't allow changes after completion

     // Deselect others for this question
     const options = document.querySelectorAll('#question-options .quiz-option');
     options.forEach((el, idx) => {
        el.classList.toggle('selected', idx === optionIndex);
    });
    userAnswers[questionIndex] = optionIndex; // Record answer
}

function navigateQuestion(direction) {
     if (assessmentCompleted) return; // Don't allow navigation after completion

     const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < totalQuestions) {
         currentQuestionIndex = newIndex;
        loadQuestion(currentQuestionIndex);
    } else if (newIndex >= totalQuestions) {
        // Attempt to finish
         if (confirm('Are you sure you want to finish the assessment?')) {
            finishAssessment();
        }
    }
 }


function startTimer() {
    console.log('Starting assessment timer');
    if (assessmentTimer) clearInterval(assessmentTimer); // Clear existing if any
     assessmentTimer = setInterval(() => {
         timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            clearInterval(assessmentTimer);
             alert('Time is up! The assessment will be submitted.');
             finishAssessment();
         }
    }, 1000);
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerDisplay.classList.toggle('warning', timeRemaining < 120);
    }
}

function finishAssessment() {
    console.log('Finishing assessment and calculating results');
    if (assessmentCompleted) return; // Prevent multiple finishes
    if (assessmentTimer) clearInterval(assessmentTimer); // Stop timer
    assessmentCompleted = true; // Mark as complete

    const correctAnswers = userAnswers.reduce((count, answer, index) => {
        // Ensure both answer and question exist before checking
        return (currentAssessment && currentAssessment.questions && currentAssessment.questions[index] && answer === currentAssessment.questions[index].correctAnswer)
            ? count + 1
            : count;
    }, 0);

     const totalAnswered = userAnswers.filter(answer => answer !== null).length;
     const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0; // Avoid division by zero
     const passingThreshold = currentAssessment.passingScore || 70;
     const passed = score >= passingThreshold;

    renderResults(score, correctAnswers, totalAnswered, passed, passingThreshold);
}

function renderResults(score, correctCount, answeredCount, passed, passingThreshold) {
    console.log(`Rendering results: Score ${score}%, Passed: ${passed}`);
    assessmentContent.innerHTML = `
        <div class="content-header">
             <h2 class="content-title">${currentAssessment.title} - Results</h2>
        </div>
        <div class="content-container">
            <div class="assessment-results">
                <div class="result-summary">
                    <div class="result-score ${passed ? 'pass' : 'fail'}">
                         <div class="score-value">${score}%</div>
                         <div class="score-label">${passed ? 'PASSED' : 'FAILED'}</div>
                     </div>
                     <div class="result-details">
                        <div class="result-item"><div class="result-label">Total Questions:</div><div class="result-value">${totalQuestions}</div></div>
                        <div class="result-item"><div class="result-label">Answered:</div><div class="result-value">${answeredCount}</div></div>
                        <div class="result-item"><div class="result-label">Correct:</div><div class="result-value">${correctCount}</div></div>
                        <div class="result-item"><div class="result-label">Passing Score:</div><div class="result-value">${passingThreshold}%</div></div>
                     </div>
                 </div>
                 <div class="result-message">
                     ${passed ? '<p>Congratulations!</p>' : '<p>You did not meet the passing score. Review and try again.</p>'}
                 </div>
                 <div class="result-actions">
                     <button id="review-answers" class="btn btn-primary">Review Answers</button>
                     <button id="retry-assessment" class="btn">Retry Assessment</button>
                    <button id="back-to-assessments-list" class="btn">Back to Assessments</button>
                </div>
            </div>
         </div>`;

     // Re-attach listeners for results page
     document.getElementById('review-answers').addEventListener('click', showReview);
     document.getElementById('retry-assessment').addEventListener('click', startAssessment); // Resets and starts again
     document.getElementById('back-to-assessments-list').addEventListener('click', showAssessmentsView);
}

async function showReview() {
     console.log('Showing assessment review');
     assessmentContent.innerHTML = `
         <div class="content-header">
             <h2 class="content-title">${currentAssessment.title} - Review</h2>
         </div>
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

         // MODIFIED: Consistent image check
        const imagePath = question.image ? question.image : getImagePath(currentAssessment.moduleId || currentAssessment.id, 'assessment', index);
        const imageExists = await checkImageExists(imagePath);
        const displayImagePath = imageExists ? imagePath : '';
        const imageAlt = imageExists ? (question.imageAlt || 'Review image') : '';

        const reviewItem = document.createElement('div');
         reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
         reviewItem.innerHTML = `
            <div class="review-question" style="font-weight: 500; margin-bottom: 0.5rem;">
                <span class="question-number">${index + 1}.</span> ${question.question}
            </div>
            ${displayImagePath ? `<div class="question-image-container" style="margin-bottom: 0.5rem;"><img src="${displayImagePath}" alt="${imageAlt}" class="question-image"></div>` : ''}
            <div class="review-details" style="background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 4px;">
                <div class="review-answer" style="font-size: 0.9em;">Your answer: ${userAnswer !== null ? `<strong>${question.options[userAnswer]}</strong>` : 'Not answered'}</div>
                 <div class="review-answer" style="font-size: 0.9em;">Correct answer: ${question.options[question.correctAnswer]}</div>
                 ${question.explanation ? `<div class="review-explanation" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); font-size: 0.9em;">${question.explanation}</div>` : ''}
            </div>`;
         reviewContainer.appendChild(reviewItem);
     }

    document.getElementById('back-to-results').addEventListener('click', () => {
        // Re-render results using the stored values
        finishAssessment(); // This function now handles rendering results correctly
     });
 }


function showAssessmentsView() {
    console.log('Showing assessments list view');
    if (assessmentsView) assessmentsView.style.display = 'block';
    if (assessmentIntro) assessmentIntro.style.display = 'none';
    if (assessmentContent) assessmentContent.style.display = 'none';
    currentAssessment = null; // Reset current assessment
    if (assessmentTimer) clearInterval(assessmentTimer); // Clear timer
    if (window.hideAssessmentBreadcrumb) window.hideAssessmentBreadcrumb(); // Hide breadcrumb
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAssessmentIntroView() {
    console.log('Showing assessment intro view');
    if (assessmentsView) assessmentsView.style.display = 'none';
    if (assessmentIntro) assessmentIntro.style.display = 'block';
    if (assessmentContent) assessmentContent.style.display = 'none';
     // Ensure start button is enabled if assessment data is valid
     if (startButton && currentAssessment && currentAssessment.questions && currentAssessment.questions.length > 0) {
        startButton.disabled = false;
         startButton.textContent = 'Start Assessment'; // Reset button text in case it showed error before
     }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAssessmentContentView() {
    console.log('Showing assessment content view');
    if (assessmentsView) assessmentsView.style.display = 'none';
    if (assessmentIntro) assessmentIntro.style.display = 'none';
    if (assessmentContent) assessmentContent.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
