/**
 * Time Trial Study Method Module
 * Handles the time trial learning experience
 */

import { createElement, showElement, hideElement, scrollToTop, formatScore } from '../ui-utils.js';
import state from '../state-manager.js';
import config from '../config.js';

/**
 * Initialize time trial game for the given module in the provided container
 * @param {Object} moduleData - The module data containing time trial content
 * @param {HTMLElement} container - The container element to render time trial in
 */
export function initTimeTrial(moduleData, container) {
    // Clear container
    container.innerHTML = '';
    
    // Get the appropriate data based on module structure
    // Some modules use 'time-trial' and others might use 'match'
    const methodKey = moduleData.methods.includes('time-trial') ? 'time-trial' : 
                      moduleData.methods.includes('match') ? 'match' : null;
                      
    if (!methodKey || !moduleData.content[methodKey]) {
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Time Trial</h2>
            </div>
            <div class="content-container">
                <p>No time trial content available for this module.</p>
                <button id="back-to-methods" class="btn">Back to Methods</button>
            </div>
        `;
        
        document.getElementById('back-to-methods').addEventListener('click', () => {
            state.navigateTo('methods', { module: moduleData });
        });
        
        return;
    }
    
    const timeTrialData = moduleData.content[methodKey];
    
    // Game state
    let score = 0;
    let currentRound = 0;
    let timer;
    let timeLeft = config.defaults.timeout; // Default 7 seconds from config
    let gameStarted = false;
    
    // Shuffle and prepare data
    const shuffledData = [...timeTrialData].sort(() => Math.random() - 0.5);
    
    // Create the game UI
    container.innerHTML = `
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
                        <div class="info-value time-value" id="time-trial-time">${timeLeft}s</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Question</div>
                        <div class="info-value" id="time-trial-current">0/${timeTrialData.length}</div>
                    </div>
                </div>
            </div>
            
            <div id="time-trial-gameplay" style="display: none;" aria-live="polite">
                <div class="time-trial-definition" id="time-trial-definition" tabindex="0"></div>
                <div class="time-trial-options" id="time-trial-options" role="listbox" aria-labelledby="time-trial-definition"></div>
                <div class="time-trial-feedback" id="time-trial-feedback" aria-live="assertive"></div>
            </div>
            
            <div id="time-trial-start-screen" class="text-center">
                <p class="mb-lg">Match the term with its definition as quickly as possible. You have ${timeLeft} seconds for each question.</p>
                <button id="time-trial-start" class="btn btn-primary btn-large" aria-label="Start game">Start Game</button>
            </div>
            
            <div class="time-trial-controls">
                <button id="time-trial-next" class="btn btn-primary" style="display: none;" aria-label="Next term">Next Term</button>
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
    
    // Initialize the game
    startButton.addEventListener('click', startGame);
    nextButton.addEventListener('click', nextRound);
    backButton.addEventListener('click', () => {
        clearInterval(timer);
        state.navigateTo('methods', { module: moduleData });
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
    
    function nextRound() {
        if (currentRound >= timeTrialData.length) {
            endGame();
            return;
        }
        
        // Reset UI state
        clearInterval(timer);
        timeLeft = config.defaults.timeout;
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
        options.forEach((option, index) => {
            const optionButton = createElement('button', {
                className: 'time-trial-option',
                textContent: option.term,
                'data-term': option.term,
                'aria-selected': 'false',
                role: 'option',
                id: `option-${index}`,
                onClick: () => selectOption(option.term, currentItem.term)
            });
            
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
                option.setAttribute('aria-selected', 'true');
            } else if (option.dataset.term === selectedTerm && selectedTerm !== correctTerm) {
                option.classList.add('incorrect');
                option.setAttribute('aria-selected', 'true');
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
                option.setAttribute('aria-selected', 'true');
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
        
        // Save progress
        state.saveProgress(moduleData.id, 'time-trial', {
            completed: true,
            score,
            totalQuestions: timeTrialData.length,
            percentage,
            completedDate: new Date().toISOString()
        });
        
        // Display final score and game over message
        container.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Time Trial</h2>
            </div>
            
            <div class="content-container">
                <div class="time-trial-results">
                    <div class="quiz-score">${score} / ${timeTrialData.length}</div>
                    <div class="quiz-percentage">${formatScore(percentage)}</div>
                    ${score === timeTrialData.length ? 
                        '<div class="quiz-perfect">Perfect Score! 🎉</div>' : 
                        '<p>Keep practicing to improve your speed and accuracy!</p>'}
                    
                    <div class="quiz-actions">
                        <button id="time-trial-replay" class="btn btn-primary" aria-label="Play again">Play Again</button>
                        <button id="back-to-methods" class="btn" aria-label="Return to study methods">Back to Methods</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('time-trial-replay').addEventListener('click', () => {
            initTimeTrial(moduleData, container);
        });
        
        document.getElementById('back-to-methods').addEventListener('click', () => {
            state.navigateTo('methods', { module: moduleData });
        });
    }
    
    scrollToTop();
}

export default { initTimeTrial };