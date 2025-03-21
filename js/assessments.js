/**
 * Assessments functionality for C2C Bitesize
 * Handles loading and interaction with assessment content
 */

import { loadAssessmentsList, loadAssessment, getAssessmentImagePath, checkImageExists } from './module-loader.js';

// DOM Elements
let assessmentsView;
let assessmentIntro;
let assessmentContent;
let assessmentTitle;
let assessmentDescription;
let questionCount;
let timeLimit;
let passingScore;
let startButton;
let backButton;
let assessmentsList;

// Assessment state
let currentAssessment = null;
let userAnswers = [];
let currentQuestionIndex = 0;
let totalQuestions = 0;
let assessmentTimer = null;
let timeRemaining = 0;
let assessmentCompleted = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
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
    
    // Initialize
    init();
});

/**
 * Initialize the assessments functionality
 */
async function init() {
    // Load the list of assessments
    await loadAssessments();
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Back button
    if (backButton) {
        backButton.addEventListener('click', showAssessmentsView);
    }
    
    // Start assessment button
    if (startButton) {
        startButton.addEventListener('click', startAssessment);
    }
}

/**
 * Load the list of available assessments
 */
async function loadAssessments() {
    try {
        const assessments = await loadAssessmentsList();
        
        if (assessmentsList) {
            assessmentsList.innerHTML = '';
            
            if (assessments.length === 0) {
                assessmentsList.innerHTML = '<p class="no-assessments">No assessments are currently available.</p>';
                return;
            }
            
            assessments.forEach(assessment => {
                const assessmentCard = document.createElement('div');
                assessmentCard.className = 'assessment-card';
                assessmentCard.innerHTML = `
                    <h3 class="assessment-card-title">${assessment.title}</h3>
                    <p class="assessment-card-desc">${assessment.description}</p>
                    <div class="assessment-card-meta">
                        <span class="assessment-questions">${assessment.questionCount || '?'} Questions</span>
                        ${assessment.timeLimit ? `<span class="assessment-time">${assessment.timeLimit} min</span>` : ''}
                    </div>
                `;
                
                assessmentCard.addEventListener('click', () => {
                    loadAssessmentDetails(assessment.id);
                });
                
                assessmentsList.appendChild(assessmentCard);
            });
        }
    } catch (error) {
        console.error('Error loading assessments:', error);
        if (assessmentsList) {
            assessmentsList.innerHTML = '<p class="error-message">Error loading assessments. Please try again later.</p>';
        }
    }
}

/**
 * Load details for a specific assessment
 * @param {string} assessmentId - The ID of the assessment to load
 */
async function loadAssessmentDetails(assessmentId) {
    try {
        const assessment = await loadAssessment(assessmentId);
        currentAssessment = assessment;
        
        // Update UI with assessment details
        assessmentTitle.textContent = assessment.title;
        assessmentDescription.textContent = assessment.description;
        questionCount.textContent = assessment.questions.length;
        
        if (assessment.timeLimit) {
            timeLimit.textContent = `${assessment.timeLimit} minutes`;
            timeRemaining = assessment.timeLimit * 60; // Convert to seconds
        } else {
            timeLimit.textContent = 'No limit';
            timeRemaining = 0;
        }
        
        passingScore.textContent = assessment.passingScore ? `${assessment.passingScore}%` : '70%';
        
        // Show the assessment intro view
        showAssessmentIntroView();
        
        // Update breadcrumb
        if (window.updateAssessmentBreadcrumb) {
            window.updateAssessmentBreadcrumb(assessment.title, () => {
                showAssessmentIntroView();
            });
        }
    } catch (error) {
        console.error(`Error loading assessment ${assessmentId}:`, error);
        alert('Error loading assessment. Please try again later.');
    }
}

/**
 * Start the assessment
 */
function startAssessment() {
    if (!currentAssessment) return;
    
    // Initialize assessment state
    userAnswers = new Array(currentAssessment.questions.length).fill(null);
    currentQuestionIndex = 0;
    totalQuestions = currentAssessment.questions.length;
    assessmentCompleted = false;
    
    // Show the assessment content view
    showAssessmentContentView();
    
    // Load the first question
    loadQuestion(currentQuestionIndex);
    
    // Start timer if there's a time limit
    if (currentAssessment.timeLimit) {
        startTimer();
    }
}

/**
 * Load a specific question from the current assessment
 * @param {number} index - The index of the question to load
 */
async function loadQuestion(index) {
    if (!currentAssessment || !currentAssessment.questions[index]) return;
    
    const question = currentAssessment.questions[index];
    
    // Check if the question has an image
    const hasImage = question.image ? await checkImageExists(question.image) : false;
    const imagePath = hasImage ? question.image : (await checkImageExists(getAssessmentImagePath(currentAssessment.id, index)) ? getAssessmentImagePath(currentAssessment.id, index) : null);
    
    // Create the question UI
    assessmentContent.innerHTML = `
        <div class="content-header">
            <h2 class="content-title">${currentAssessment.title}</h2>
            <span class="progress-indicator">Question <span id="current-question">${index + 1}</span> of ${totalQuestions}</span>
        </div>
        
        <div class="content-container">
            <div class="assessment-progress-bar">
                <div class="progress-fill" style="width: ${((index + 1) / totalQuestions) * 100}%"></div>
            </div>
            
            ${currentAssessment.timeLimit ? `
                <div class="assessment-timer">
                    <div class="timer-label">Time Remaining:</div>
                    <div class="timer-value" id="timer-display"></div>
                </div>
            ` : ''}
            
            <div class="quiz-container">
                <div class="quiz-question">${question.question}</div>
                
                ${imagePath ? `
                    <div class="question-image-container">
                        <img src="${imagePath}" alt="${question.imageAlt || 'Question image'}" class="question-image">
                    </div>
                ` : ''}
                
                <ul class="quiz-options" id="question-options"></ul>
            </div>
            
            <div class="assessment-controls">
                <button id="prev-question" class="btn" ${index === 0 ? 'disabled' : ''}>
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Previous
                </button>
                
                <span class="questions-indicator">${index + 1} of ${totalQuestions}</span>
                
                <button id="next-question" class="btn">
                    ${index === totalQuestions - 1 ? 'Finish' : 'Next'}
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Update timer display
    if (currentAssessment.timeLimit) {
        updateTimerDisplay();
    }
    
    // Add options
    const optionsContainer = document.getElementById('question-options');
    if (optionsContainer) {
        question.options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('li');
            optionElement.className = 'quiz-option';
            
            // Check if this option was previously selected
            if (userAnswers[index] === optionIndex) {
                optionElement.classList.add('selected');
            }
            
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => {
                // Clear previous selection
                document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
                
                // Select this option
                optionElement.classList.add('selected');
                
                // Save the answer
                userAnswers[index] = optionIndex;
            });
            
            optionsContainer.appendChild(optionElement);
        });
    }
    
    // Add navigation event listeners
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (index > 0) {
                loadQuestion(index - 1);
                currentQuestionIndex = index - 1;
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (index === totalQuestions - 1) {
                // Last question - finish assessment
                if (confirm('Are you sure you want to finish the assessment? You can review your answers before submitting.')) {
                    finishAssessment();
                }
            } else {
                // Go to next question
                loadQuestion(index + 1);
                currentQuestionIndex = index + 1;
            }
        });
    }
}

/**
 * Start the assessment timer
 */
function startTimer() {
    if (assessmentTimer) {
        clearInterval(assessmentTimer);
    }
    
    assessmentTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(assessmentTimer);
            alert('Time is up! Your assessment will be submitted automatically.');
            finishAssessment();
        }
    }, 1000);
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning class when time is running low (less than 2 minutes)
        if (timeRemaining < 120) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    }
}

/**
 * Finish and score the assessment
 */
function finishAssessment() {
    // Stop the timer if it's running
    if (assessmentTimer) {
        clearInterval(assessmentTimer);
        assessmentTimer = null;
    }
    
    // Mark assessment as completed
    assessmentCompleted = true;
    
    // Calculate score
    const totalAnswered = userAnswers.filter(answer => answer !== null).length;
    const correctAnswers = userAnswers.filter((answer, index) => {
        return answer === currentAssessment.questions[index].correctAnswer;
    }).length;
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingThreshold = currentAssessment.passingScore || 70;
    const passed = score >= passingThreshold;
    
    // Show results
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
                        <div class="result-item">
                            <div class="result-label">Questions:</div>
                            <div class="result-value">${totalQuestions}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Answered:</div>
                            <div class="result-value">${totalAnswered}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Correct:</div>
                            <div class="result-value">${correctAnswers}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Passing Score:</div>
                            <div class="result-value">${passingThreshold}%</div>
                        </div>
                    </div>
                </div>
                
                <div class="result-message">
                    ${passed 
                        ? `<p>Congratulations! You have successfully passed the assessment.</p>` 
                        : `<p>You did not meet the passing score for this assessment. Review the material and try again.</p>`}
                </div>
                
                <div class="result-actions">
                    <button id="review-answers" class="btn btn-primary">Review Answers</button>
                    <button id="retry-assessment" class="btn">Retry Assessment</button>
                    <button id="back-to-assessments-list" class="btn">Back to Assessments</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const reviewButton = document.getElementById('review-answers');
    const retryButton = document.getElementById('retry-assessment');
    const backToListButton = document.getElementById('back-to-assessments-list');
    
    if (reviewButton) {
        reviewButton.addEventListener('click', showReview);
    }
    
    if (retryButton) {
        retryButton.addEventListener('click', () => {
            startAssessment();
        });
    }
    
    if (backToListButton) {
        backToListButton.addEventListener('click', showAssessmentsView);
    }
}

/**
 * Show the review of all answers
 */
function showReview() {
    assessmentContent.innerHTML = `
        <div class="content-header">
            <h2 class="content-title">${currentAssessment.title} - Review</h2>
        </div>
        
        <div class="content-container">
            <div id="review-container" class="review-container"></div>
            
            <button id="back-to-results" class="btn">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Results
            </button>
        </div>
    `;
    
    const reviewContainer = document.getElementById('review-container');
    const backButton = document.getElementById('back-to-results');
    
    if (reviewContainer) {
        currentAssessment.questions.forEach(async (question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            // Check if the question has an image
            const hasImage = question.image ? await checkImageExists(question.image) : false;
            const imagePath = hasImage ? question.image : (await checkImageExists(getAssessmentImagePath(currentAssessment.id, index)) ? getAssessmentImagePath(currentAssessment.id, index) : null);
            
            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
            
            reviewItem.innerHTML = `
                <div class="review-question">
                    <span class="question-number">${index + 1}.</span> ${question.question}
                </div>
                
                ${imagePath ? `
                    <div class="question-image-container">
                        <img src="${imagePath}" alt="${question.imageAlt || 'Question image'}" class="question-image">
                    </div>
                ` : ''}
                
                <div class="review-details">
                    <div class="review-answer">Your answer: ${userAnswer !== null ? question.options[userAnswer] : 'Not answered'}</div>
                    <div class="review-answer">Correct answer: ${question.options[question.correctAnswer]}</div>
                    ${question.explanation ? `<div class="review-explanation">${question.explanation}</div>` : ''}
                </div>
            `;
            
            reviewContainer.appendChild(reviewItem);
        });
    }
    
    if (backButton) {
        backButton.addEventListener('click', finishAssessment);
    }
}

/**
 * Show the assessments list view
 */
function showAssessmentsView() {
    // Hide all views
    assessmentsView.style.display = 'block';
    assessmentIntro.style.display = 'none';
    assessmentContent.style.display = 'none';
    
    // Reset state
    currentAssessment = null;
    
    // Clear any running timer
    if (assessmentTimer) {
        clearInterval(assessmentTimer);
        assessmentTimer = null;
    }
    
    // Hide breadcrumb
    if (window.hideAssessmentBreadcrumb) {
        window.hideAssessmentBreadcrumb();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show the assessment intro view
 */
function showAssessmentIntroView() {
    // Show only the assessment intro view
    assessmentsView.style.display = 'none';
    assessmentIntro.style.display = 'block';
    assessmentContent.style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show the assessment content view
 */
function showAssessmentContentView() {
    // Show only the assessment content view
    assessmentsView.style.display = 'none';
    assessmentIntro.style.display = 'none';
    assessmentContent.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}