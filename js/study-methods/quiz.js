/**
 * Quiz Study Method Module with Image Support
 * Handles the quiz learning experience
 */

import { createElement, showElement, hideElement, scrollToTop, formatScore } from '../ui-utils.js';
import state from '../state-manager.js';

/**
 * Initialize quiz for the given module in the provided container
 * @param {Object} moduleData - The module data containing quiz content
 * @param {HTMLElement} container - The container element to render quiz in
 */
export function initQuiz(moduleData, container) {
    // Clear container
    container.innerHTML = '';
    
    // Get quiz data
    const quizData = moduleData.content.quiz;
    
    // Set initial state
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = Array(quizData.length).fill(null);
    
    // Check for saved progress
    const savedProgress = state.getProgress(moduleData.id, 'quiz');
    if (savedProgress) {
        if (savedProgress.completed) {
            // If quiz was completed, show results immediately
            showQuizResults(savedProgress.score, savedProgress.userAnswers);
            return;
        } else if (savedProgress.currentQuestionIndex !== undefined) {
            // Resume from saved position
            currentQuestionIndex = savedProgress.currentQuestionIndex;
            userAnswers = savedProgress.userAnswers || Array(quizData.length).fill(null);
        }
    }
    
    // Create quiz UI
    container.innerHTML = `
        <div class="content-header">
            <h2 class="content-title">${moduleData.title} - Quiz</h2>
            <span class="progress-indicator">Question <span id="current-question-number">${currentQuestionIndex + 1}</span> of ${quizData.length}</span>
        </div>
        
        <div class="content-container">
            <div class="quiz-container" id="quiz-container">
                <div class="quiz-question" id="quiz-question" aria-live="polite"></div>
                <ul class="quiz-options" id="quiz-options" role="radiogroup" aria-labelledby="quiz-question"></ul>
            </div>
            
            <div class="quiz-controls">
                <button id="prev-question" class="btn" aria-label="Previous question">
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Previous
                </button>
                
                <button id="next-question" class="btn" aria-label="Next question">
                    Next
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
                
                <button id="submit-quiz" class="btn btn-primary" style="display: none;" aria-label="Submit quiz">Submit Quiz</button>
            </div>
        </div>
        
        <button id="back-to-methods" class="btn mb-lg" aria-label="Return to study methods">
            <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
            </svg>
            Back to Methods
        </button>
    `;
    
    // Get DOM elements
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    const submitButton = document.getElementById('submit-quiz');
    const backButton = document.getElementById('back-to-methods');
    const questionNumberElement = document.getElementById('current-question-number');
    
    // Add event listeners
    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
            saveProgress();
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
            saveProgress();
        }
    });
    
    submitButton.addEventListener('click', () => {
        if (userAnswers.includes(null)) {
            if (confirm("You haven't answered all questions. Are you sure you want to submit?")) {
                calculateScore();
                showQuizResults(score, userAnswers);
                saveCompletedProgress();
            }
        } else {
            calculateScore();
            showQuizResults(score, userAnswers);
            saveCompletedProgress();
        }
    });
    
    backButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to exit the quiz? Your progress will be saved.")) {
            saveProgress();
            state.navigateTo('methods', { module: moduleData });
        }
    });
    
    // Load the first question
    loadQuestion();
    
    // Function to load a question
    function loadQuestion() {
        const questionData = quizData[currentQuestionIndex];
        const questionElement = document.getElementById('quiz-question');
        const optionsElement = document.getElementById('quiz-options');
        
        // Generate question content with possible image
        let questionContent = '';
        
        // Add image if available
        if (questionData.image) {
            questionContent += `
                <div class="question-image-container">
                    <img src="${questionData.image}" alt="Question image" class="question-image">
                    ${questionData.imageCaption ? `<div class="question-image-caption">${questionData.imageCaption}</div>` : ''}
                </div>
            `;
        }
        
        // Add question text
        questionContent += `<div class="question-text">${currentQuestionIndex + 1}. ${questionData.question}</div>`;
        
        // Update question content
        questionElement.innerHTML = questionContent;
        questionElement.setAttribute('id', `question-${currentQuestionIndex}`);
        
        // Update question number
        questionNumberElement.textContent = currentQuestionIndex + 1;
        
        // Update options
        optionsElement.innerHTML = '';
        optionsElement.setAttribute('aria-labelledby', `question-${currentQuestionIndex}`);
        
        questionData.options.forEach((option, index) => {
            const optionId = `option-${currentQuestionIndex}-${index}`;
            const optionElement = createElement('li', {
                className: 'quiz-option',
                role: 'radio',
                tabIndex: 0,
                'aria-checked': userAnswers[currentQuestionIndex] === index ? 'true' : 'false',
                id: optionId,
                onClick: () => selectOption(index),
                onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectOption(index);
                    }
                }
            }, option);
            
            // Apply selected class if this is the user's answer
            if (userAnswers[currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
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
    
    // Function to select an option
    function selectOption(index) {
        // Clear previous selection
        document.querySelectorAll('.quiz-option').forEach(el => {
            el.classList.remove('selected');
            el.setAttribute('aria-checked', 'false');
        });
        
        // Get the selected option element
        const selectedOption = document.getElementById(`option-${currentQuestionIndex}-${index}`);
        
        // Select this option
        selectedOption.classList.add('selected');
        selectedOption.setAttribute('aria-checked', 'true');
        
        // Save user's answer
        userAnswers[currentQuestionIndex] = index;
        
        // Save progress
        saveProgress();
    }
    
    // Function to calculate final score
    function calculateScore() {
        score = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === quizData[index].correctAnswer) {
                score++;
            }
        });
    }
    
    // Function to show quiz results
    function showQuizResults(score, userAnswers) {
        const percentage = Math.round((score / quizData.length) * 100);
        
        // Display results
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Quiz Results</h2>
            </div>
            
            <div class="content-container">
                <div class="quiz-results">
                    <div class="quiz-score">${score} / ${quizData.length}</div>
                    <div class="quiz-percentage">${formatScore(percentage)}</div>
                    ${score === quizData.length ? 
                        '<div class="quiz-perfect">Perfect Score! 🎉</div>' : 
                        '<p>Keep learning to improve your score!</p>'}
                    
                    <div class="quiz-actions">
                        <button id="review-quiz" class="btn btn-primary" aria-label="Review answers">Review Answers</button>
                        <button id="retry-quiz" class="btn" aria-label="Retry quiz">Try Again</button>
                        <button id="back-to-methods" class="btn" aria-label="Return to study methods">Back to Methods</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('review-quiz').addEventListener('click', () => showQuizReview(userAnswers));
        document.getElementById('retry-quiz').addEventListener('click', () => {
            // Reset progress and restart quiz
            state.saveProgress(moduleData.id, 'quiz', {
                currentQuestionIndex: 0,
                userAnswers: Array(quizData.length).fill(null),
                completed: false
            });
            initQuiz(moduleData, container);
        });
        document.getElementById('back-to-methods').addEventListener('click', () => {
            state.navigateTo('methods', { module: moduleData });
        });
    }
    
    // Function to show quiz review
    function showQuizReview(userAnswers) {
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Quiz Review</h2>
            </div>
            
            <div class="content-container">
                <div id="quiz-review" aria-label="Quiz review"></div>
            </div>
            
            <button id="back-to-results" class="btn mb-lg" aria-label="Back to results">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Results
            </button>
        `;
        
        const reviewElement = document.getElementById('quiz-review');
        
        quizData.forEach((question, index) => {
            const userAnswer = userAnswers[index] !== null ? userAnswers[index] : -1;
            const isCorrect = userAnswer === question.correctAnswer;
            
            let questionContent = '';
            
            // Add image if available
            if (question.image) {
                questionContent += `
                    <div class="question-image-container">
                        <img src="${question.image}" alt="Question image" class="question-image" style="max-width: 200px;">
                        ${question.imageCaption ? `<div class="question-image-caption">${question.imageCaption}</div>` : ''}
                    </div>
                `;
            }
            
            // Add question text
            questionContent += `<div class="review-statement">${index + 1}. ${question.question}</div>`;
            
            const questionElement = createElement('div', {
                className: `review-item ${isCorrect ? 'correct' : 'incorrect'}`,
                role: 'region',
                'aria-label': `Question ${index + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`
            }, [
                createElement('div', { 
                    className: 'review-content',
                    innerHTML: questionContent
                }),
                createElement('div', { className: 'review-details' }, [
                    createElement('div', { className: 'review-answer' }, `Your answer: ${userAnswer >= 0 ? question.options[userAnswer] : 'Not answered'}`),
                    createElement('div', { className: 'review-answer' }, `Correct answer: ${question.options[question.correctAnswer]}`)
                ])
            ]);
            
            reviewElement.appendChild(questionElement);
        });
        
        document.getElementById('back-to-results').addEventListener('click', () => {
            showQuizResults(score, userAnswers);
        });
    }
    
    // Function to save current progress
    function saveProgress() {
        state.saveProgress(moduleData.id, 'quiz', {
            currentQuestionIndex,
            userAnswers,
            completed: false
        });
    }
    
    // Function to save completed quiz progress
    function saveCompletedProgress() {
        state.saveProgress(moduleData.id, 'quiz', {
            completed: true,
            score,
            userAnswers,
            percentage: Math.round((score / quizData.length) * 100),
            completedDate: new Date().toISOString()
        });
    }
    
    scrollToTop();
}

export default { initQuiz };
