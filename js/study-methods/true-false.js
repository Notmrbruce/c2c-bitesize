/**
 * True/False Study Method Module with Image Support
 * Handles the true/false learning experience
 */

import { createElement, showElement, hideElement, scrollToTop, formatScore } from '../ui-utils.js';
import state from '../state-manager.js';

/**
 * Initialize true/false questions for the given module in the provided container
 * @param {Object} moduleData - The module data containing true/false content
 * @param {HTMLElement} container - The container element to render true/false in
 */
export function initTrueFalse(moduleData, container) {
    // Clear container
    container.innerHTML = '';
    
    // Get true/false data
    const trueFalseData = moduleData.content['true-false'];
    
    // Initialize state
    let score = 0;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    
    // Check for saved progress
    const savedProgress = state.getProgress(moduleData.id, 'true-false');
    if (savedProgress) {
        if (savedProgress.completed) {
            // If quiz was completed, show results immediately
            showResults(savedProgress.score, savedProgress.userAnswers);
            return;
        }
    }
    
    // Shuffle the questions for better learning
    const shuffledData = [...trueFalseData].sort(() => Math.random() - 0.5);
    
    // Create the UI
    container.innerHTML = `
        <div class="content-header">
            <h2 class="content-title">${moduleData.title} - True or False</h2>
            <span class="progress-indicator">Question <span id="true-false-current">1</span> of ${trueFalseData.length}</span>
        </div>
        
        <div class="content-container">
            <div class="true-false-container">
                <div class="true-false-statement" id="true-false-statement" tabindex="0" aria-live="polite"></div>
                
                <div class="true-false-options">
                    <button id="true-button" class="btn btn-true" aria-label="True">TRUE</button>
                    <button id="false-button" class="btn btn-false" aria-label="False">FALSE</button>
                </div>
                
                <div class="true-false-feedback" id="true-false-feedback" aria-live="assertive"></div>
            </div>
            
            <div class="quiz-controls">
                <button id="true-false-next" class="btn btn-primary" style="display: none;" aria-label="Next question">Next Question</button>
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
    const currentElement = document.getElementById('true-false-current');
    const statementElement = document.getElementById('true-false-statement');
    const trueButton = document.getElementById('true-button');
    const falseButton = document.getElementById('false-button');
    const feedbackElement = document.getElementById('true-false-feedback');
    const nextButton = document.getElementById('true-false-next');
    const backButton = document.getElementById('back-to-methods');
    
    // Initialize
    loadQuestion();
    
    // Add event listeners
    trueButton.addEventListener('click', () => selectAnswer(true));
    falseButton.addEventListener('click', () => selectAnswer(false));
    nextButton.addEventListener('click', nextQuestion);
    backButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to exit? Your progress will be saved.")) {
            state.navigateTo('methods', { module: moduleData });
        }
    });
    
    function loadQuestion() {
        const questionData = shuffledData[currentQuestionIndex];
        
        // Generate statement content with possible image
        let statementContent = '';
        
        // Add image if available
        if (questionData.image) {
            statementContent += `
                <div class="question-image-container">
                    <img src="${questionData.image}" alt="Statement image" class="question-image">
                    ${questionData.imageCaption ? `<div class="question-image-caption">${questionData.imageCaption}</div>` : ''}
                </div>
            `;
        }
        
        // Add statement text
        statementContent += `<div class="statement-text">${questionData.statement}</div>`;
        
        // Update statement content
        statementElement.innerHTML = statementContent;
        
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
            trueButton.setAttribute('aria-pressed', 'true');
            falseButton.setAttribute('aria-pressed', 'false');
        } else {
            falseButton.classList.add('selected');
            falseButton.setAttribute('aria-pressed', 'true');
            trueButton.setAttribute('aria-pressed', 'false');
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
            isCorrect,
            statementIndex: shuffledData[currentQuestionIndex]
        };
    }
    
    function nextQuestion() {
        currentQuestionIndex++;
        
        if (currentQuestionIndex >= shuffledData.length) {
            showResults(score, userAnswers);
            saveCompletedProgress(score, userAnswers);
            return;
        }
        
        loadQuestion();
    }
    
    function showResults(score, userAnswers) {
        // Calculate final score
        const percentage = Math.round((score / trueFalseData.length) * 100);
        
        // Display results
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - True or False Results</h2>
            </div>
            
            <div class="content-container">
                <div class="time-trial-results">
                    <div class="quiz-score">${score} / ${trueFalseData.length}</div>
                    <div class="quiz-percentage">${formatScore(percentage)}</div>
                    ${score === trueFalseData.length ? 
                        '<div class="quiz-perfect">Perfect Score! 🎉</div>' : 
                        '<p>Keep learning to improve your knowledge!</p>'}
                    
                    <div class="quiz-actions">
                        <button id="true-false-review" class="btn btn-primary" aria-label="Review answers">Review Answers</button>
                        <button id="true-false-replay" class="btn" aria-label="Try again">Try Again</button>
                        <button id="back-to-methods" class="btn" aria-label="Return to study methods">Back to Methods</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('true-false-review').addEventListener('click', () => showReview(userAnswers));
        document.getElementById('true-false-replay').addEventListener('click', () => {
            // Reset progress
            state.saveProgress(moduleData.id, 'true-false', {
                completed: false
            });
            initTrueFalse(moduleData, container);
        });
        document.getElementById('back-to-methods').addEventListener('click', () => {
            state.navigateTo('methods', { module: moduleData });
        });
    }
    
    function showReview(userAnswers) {
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - True or False Review</h2>
            </div>
            
            <div class="content-container" id="review-container" aria-label="Review of your answers">
                <!-- Review items will be added here -->
            </div>
            
            <button id="back-to-results" class="btn mb-lg" aria-label="Back to results">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Results
            </button>
        `;
        
        const reviewContainer = document.getElementById('review-container');
        
        // Add review items
        userAnswers.forEach((answer, index) => {
            // Get the original question data
            const question = trueFalseData.find(q => q === answer.statementIndex) || shuffledData[index];
            
            // Create statement content with possible image
            let statementContent = '';
            
            // Add image if available
            if (question.image) {
                statementContent += `
                    <div class="question-image-container">
                        <img src="${question.image}" alt="Statement image" class="question-image" style="max-width: 200px;">
                        ${question.imageCaption ? `<div class="question-image-caption">${question.imageCaption}</div>` : ''}
                    </div>
                `;
            }
            
            // Add statement text
            statementContent += `<div class="review-statement">${index + 1}. ${question.statement}</div>`;
            
            // Create review item
            const reviewItem = createElement('div', {
                className: `review-item ${answer && answer.isCorrect ? 'correct' : 'incorrect'}`,
                role: 'region',
                'aria-label': `Question ${index + 1}: ${answer && answer.isCorrect ? 'Correct' : 'Incorrect'}`
            }, [
                createElement('div', { 
                    className: 'review-content',
                    innerHTML: statementContent
                }),
                createElement('div', { className: 'review-details' }, [
                    createElement('div', { className: 'review-answer' }, `Correct answer: <strong>${question.isTrue ? 'TRUE' : 'FALSE'}</strong>`),
                    answer ? createElement('div', { className: 'review-answer' }, `Your answer: <strong>${answer.userAnswer ? 'TRUE' : 'FALSE'}</strong>`) : '',
                    createElement('div', { className: 'review-explanation' }, question.explanation)
                ])
            ]);
            
            reviewContainer.appendChild(reviewItem);
        });
        
        // Add back button listener
        document.getElementById('back-to-results').addEventListener('click', () => {
            showResults(score, userAnswers);
        });
    }
    
    function saveCompletedProgress(score, userAnswers) {
        state.saveProgress(moduleData.id, 'true-false', {
            completed: true,
            score,
            userAnswers,
            percentage: Math.round((score / trueFalseData.length) * 100),
            completedDate: new Date().toISOString()
        });
    }
    
    scrollToTop();
}

export default { initTrueFalse };
