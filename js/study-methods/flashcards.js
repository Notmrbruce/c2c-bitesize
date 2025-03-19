/**
 * Flashcards Study Method Module
 * Handles the flashcard learning experience
 */

import { createElement, showElement, hideElement, scrollToTop } from '../ui-utils.js';
import state from '../state-manager.js';

/**
 * Initialize flashcards for the given module in the provided container
 * @param {Object} moduleData - The module data containing flashcard content
 * @param {HTMLElement} container - The container element to render flashcards in
 */
export function initFlashcards(moduleData, container) {
    // Clear container
    container.innerHTML = '';
    
    // Get flashcard data
    const flashcardsData = moduleData.content.flashcards;
    
    // Set initial state
    let currentCardIndex = 0;
    
    // Check for saved progress
    const savedProgress = state.getProgress(moduleData.id, 'flashcards');
    if (savedProgress && savedProgress.currentCardIndex !== undefined) {
        currentCardIndex = savedProgress.currentCardIndex;
    }
    
    // Create flashcard UI
    container.innerHTML = `
        <div class="content-header">
            <h2 class="content-title">${moduleData.title} - Flashcards</h2>
            <span class="progress-indicator">Card <span id="current-card-number">${currentCardIndex + 1}</span> of ${flashcardsData.length}</span>
        </div>
        
        <div class="content-container">
            <div class="flashcard" id="current-flashcard" tabindex="0" aria-label="Flashcard. Press Enter or Space to flip">
                <div class="card-indicator">Click to flip</div>
                <div class="flashcard-question" id="flashcard-question">${flashcardsData[currentCardIndex].question}</div>
                <div class="flashcard-answer" id="flashcard-answer">${flashcardsData[currentCardIndex].answer}</div>
            </div>
            
            <div class="card-controls">
                <button id="prev-card" class="btn" ${currentCardIndex === 0 ? 'disabled' : ''} aria-label="Previous card">
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Previous
                </button>
                
                <button id="flip-card" class="btn btn-primary" aria-label="Flip card">
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 15l5 5 5-5"/>
                        <path d="M12 20V4"/>
                    </svg>
                    Flip Card
                </button>
                
                <button id="next-card" class="btn" ${currentCardIndex === flashcardsData.length - 1 ? 'disabled' : ''} aria-label="Next card">
                    Next
                    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
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
    const flashcardElement = document.getElementById('current-flashcard');
    const prevButton = document.getElementById('prev-card');
    const nextButton = document.getElementById('next-card');
    const flipButton = document.getElementById('flip-card');
    const backButton = document.getElementById('back-to-methods');
    const cardNumberElement = document.getElementById('current-card-number');
    
    // Add event listeners
    flashcardElement.addEventListener('click', toggleFlip);
    flashcardElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFlip();
        }
    });
    
    flipButton.addEventListener('click', toggleFlip);
    
    prevButton.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateFlashcard();
            saveProgress();
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (currentCardIndex < flashcardsData.length - 1) {
            currentCardIndex++;
            updateFlashcard();
            saveProgress();
        }
    });
    
    backButton.addEventListener('click', () => {
        state.navigateTo('methods', { module: moduleData });
    });
    
    // Function to toggle the card flip
    function toggleFlip() {
        flashcardElement.classList.toggle('flipped');
        // Update accessibility attribute
        const isFlipped = flashcardElement.classList.contains('flipped');
        flashcardElement.setAttribute('aria-label', `Flashcard. ${isFlipped ? 'Showing answer' : 'Showing question'}. Press Enter or Space to flip`);
    }
    
    // Function to update the flashcard content
    function updateFlashcard() {
        const card = flashcardsData[currentCardIndex];
        
        const questionElement = document.getElementById('flashcard-question');
        const answerElement = document.getElementById('flashcard-answer');
        
        // Update content
        questionElement.innerHTML = card.question;
        answerElement.innerHTML = card.answer;
        
        // Reset flip state
        flashcardElement.classList.remove('flipped');
        flashcardElement.setAttribute('aria-label', 'Flashcard. Showing question. Press Enter or Space to flip');
        
        // Update card number
        cardNumberElement.textContent = currentCardIndex + 1;
        
        // Update button states
        prevButton.disabled = currentCardIndex === 0;
        nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
    }
    
    // Function to save current progress
    function saveProgress() {
        state.saveProgress(moduleData.id, 'flashcards', {
            currentCardIndex,
            totalCards: flashcardsData.length,
            lastUpdated: new Date().toISOString()
        });
    }
    
    // Initial save
    saveProgress();
    scrollToTop();
}

export default { initFlashcards };