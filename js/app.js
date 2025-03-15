import { loadModulesList, loadModule } from './module-loader.js';

// DOM Elements
const homeLink = document.getElementById('home-link');
const modulesView = document.getElementById('modules-view');
const methodsView = document.getElementById('methods-view');
const contentView = document.getElementById('content-view');
const modulesList = document.getElementById('modules-list');
const methodButtons = document.getElementById('method-buttons');
const selectedModuleTitle = document.getElementById('selected-module-title');

// Current state
let currentModule = null;
let currentMethod = null;
let allModules = [];

// Initialize the application
async function init() {
    try {
        allModules = await loadModulesList();
        renderModules(allModules);
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        modulesList.innerHTML = '<p class="error">Error loading modules. Please try again later.</p>';
    }
}

// Render modules list
function renderModules(modules) {
    modulesList.innerHTML = '';
    
    modules.forEach((module, index) => {
        const circleClass = `circle-${(index % 4) + 1}`;
        
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';
        moduleItem.dataset.id = module.id;
        
        moduleItem.innerHTML = `
            <div class="number-circle ${circleClass}">${index + 1}</div>
            <div class="module-item-content">
                <div class="module-item-title">${module.title}</div>
                <div class="module-item-desc">${module.description}</div>
            </div>
        `;
        
        modulesList.appendChild(moduleItem);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Home link
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetToHome();
    });
    
    // Module selection
    modulesList.addEventListener('click', (e) => {
        const moduleItem = e.target.closest('.module-item');
        if (moduleItem) {
            const moduleId = moduleItem.dataset.id;
            selectModule(moduleId);
        }
    });
}

// Select a module
async function selectModule(moduleId) {
    try {
        const moduleData = await loadModule(moduleId);
        currentModule = moduleData;
        
        if (currentModule) {
            // Update UI
            modulesView.style.display = 'none';
            methodsView.style.display = 'block';
            selectedModuleTitle.textContent = currentModule.title;
            
            // Update breadcrumb
            document.querySelector('.breadcrumb').innerHTML = `
                <a href="#" id="home-breadcrumb">Home</a>
                <span>></span>
                <span>${currentModule.title}</span>
            `;
            
            document.getElementById('home-breadcrumb').addEventListener('click', (e) => {
                e.preventDefault();
                resetToHome();
            });
            
            // Render study methods
            renderStudyMethods();
        }
    } catch (error) {
        console.error('Error loading module:', error);
        alert('Error loading module. Please try again.');
        resetToHome();
    }
}

// Render study methods
function renderStudyMethods() {
    methodButtons.innerHTML = '';
    
    const methods = [
        { id: 'flashcards', name: 'Flashcards' },
        { id: 'quiz', name: 'Quiz' },
        { id: 'match', name: 'Match the Pairs' },
        { id: 'visual', name: 'Visual Learning' }
    ];
    
    methods.forEach((method, index) => {
        const isAvailable = currentModule.methods && currentModule.methods.includes(method.id);
        const circleClass = `circle-${(index % 4) + 1}`;
        
        const button = document.createElement('button');
        button.className = isAvailable ? 'method-button' : 'method-button disabled';
        button.disabled = !isAvailable;
        
        button.innerHTML = `
            <div class="number-circle ${circleClass}">${index + 1}</div>
            ${method.name}
        `;
        
        if (isAvailable) {
            button.addEventListener('click', () => {
                selectMethod(method.id);
            });
        }
        
        methodButtons.appendChild(button);
    });
}

// Select a study method
function selectMethod(methodId) {
    currentMethod = methodId;
    
    // Update UI
    methodsView.style.display = 'none';
    contentView.style.display = 'block';
    
    // Update breadcrumb
    document.querySelector('.breadcrumb').innerHTML = `
        <a href="#" id="home-breadcrumb">Home</a>
        <span>></span>
        <a href="#" id="module-breadcrumb">${currentModule.title}</a>
        <span>></span>
        <span>${getMethodName(methodId)}</span>
    `;
    
    document.getElementById('home-breadcrumb').addEventListener('click', (e) => {
        e.preventDefault();
        resetToHome();
    });
    
    document.getElementById('module-breadcrumb').addEventListener('click', (e) => {
        e.preventDefault();
        resetToModule();
    });
    
    // Render content based on method
    switch (methodId) {
        case 'flashcards':
            renderFlashcards();
            break;
        case 'quiz':
            renderQuiz();
            break;
        case 'match':
            renderMatchPairs();
            break;
        case 'visual':
            renderVisualLearning();
            break;
    }
}

// Get method name
function getMethodName(methodId) {
    const names = {
        'flashcards': 'Flashcards',
        'quiz': 'Quiz',
        'match': 'Match the Pairs',
        'visual': 'Visual Learning'
    };
    return names[methodId] || 'Unknown';
}

// Reset to home view
function resetToHome() {
    modulesView.style.display = 'block';
    methodsView.style.display = 'none';
    contentView.style.display = 'none';
    contentView.innerHTML = '';
    
    document.querySelector('.breadcrumb').innerHTML = `
        <a href="#" id="home-link">Home</a>
    `;
    
    document.getElementById('home-link').addEventListener('click', (e) => {
        e.preventDefault();
        resetToHome();
    });
    
    currentModule = null;
    currentMethod = null;
}

// Reset to module view
function resetToModule() {
    methodsView.style.display = 'block';
    contentView.style.display = 'none';
    contentView.innerHTML = '';
    
    document.querySelector('.breadcrumb').innerHTML = `
        <a href="#" id="home-breadcrumb">Home</a>
        <span>></span>
        <span>${currentModule.title}</span>
    `;
    
    document.getElementById('home-breadcrumb').addEventListener('click', (e) => {
        e.preventDefault();
        resetToHome();
    });
    
    currentMethod = null;
}

// Render flashcards
function renderFlashcards() {
    const flashcards = currentModule.content.flashcards;
    let currentCardIndex = 0;
    
    contentView.innerHTML = `
        <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 16h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 11.9 13 12.5 13 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            Flashcards - ${currentModule.title}
        </h2>
        
        <div class="flashcard">
            <div class="flashcard-question">
                <h3>${flashcards[currentCardIndex].question}</h3>
            </div>
            <div class="flashcard-answer">
                <p>${flashcards[currentCardIndex].answer}</p>
            </div>
        </div>
        
        <div class="flashcard-nav">
            <button class="back-button" id="prev-card" ${currentCardIndex === 0 ? 'disabled' : ''}>Previous</button>
            <button class="back-button" id="flip-card">Flip Card</button>
            <button class="back-button" id="next-card" ${currentCardIndex === flashcards.length - 1 ? 'disabled' : ''}>Next</button>
        </div>
        
        <p style="text-align: center; margin-top: 1rem; color: var(--light-text);">
            Card ${currentCardIndex + 1} of ${flashcards.length}
        </p>
    `;
    
    const card = document.querySelector('.flashcard');
    const flipBtn = document.getElementById('flip-card');
    const prevBtn = document.getElementById('prev-card');
    const nextBtn = document.getElementById('next-card');
    
    // Flip card
    flipBtn.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });
    
    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });
    
    // Navigation
    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateCard();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < flashcards.length - 1) {
            currentCardIndex++;
            updateCard();
        }
    });
    
    function updateCard() {
        document.querySelector('.flashcard-question h3').textContent = flashcards[currentCardIndex].question;
        document.querySelector('.flashcard-answer p').textContent = flashcards[currentCardIndex].answer;
        
        card.classList.remove('flipped');
        
        prevBtn.disabled = currentCardIndex === 0;
        nextBtn.disabled = currentCardIndex === flashcards.length - 1;
        
        document.querySelector('p[style*="text-align: center"]').textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
    }
}

// Render quiz
function renderQuiz() {
    const quizQuestions = currentModule.content.quiz;
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    
    contentView.innerHTML = `
        <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            Quiz - ${currentModule.title}
        </h2>
        
        <div class="quiz-container">
            <div class="quiz-question">
                <h3>${quizQuestions[currentQuestionIndex].question}</h3>
                <ul class="quiz-options">
                    ${quizQuestions[currentQuestionIndex].options.map((option, index) => 
                        `<li class="quiz-option" data-index="${index}">${option}</li>`
                    ).join('')}
                </ul>
            </div>
            
            <div class="quiz-nav">
                <button class="back-button" id="prev-question" disabled>Previous</button>
                <span>Question ${currentQuestionIndex + 1} of ${quizQuestions.length}</span>
                <button class="back-button" id="next-question">Next</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.quiz-option').forEach(o => {
                o.classList.remove('selected');
            });
            
            option.classList.add('selected');
            userAnswers[currentQuestionIndex] = parseInt(option.dataset.index);
        });
    });
    
    document.getElementById('prev-question').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            updateQuestion();
        }
    });
    
    document.getElementById('next-question').addEventListener('click', () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            currentQuestionIndex++;
            updateQuestion();
        } else {
            showResults();
        }
    });
    
    function updateQuestion() {
        document.querySelector('.quiz-question h3').textContent = quizQuestions[currentQuestionIndex].question;
        
        const optionsHtml = quizQuestions[currentQuestionIndex].options.map((option, index) => {
            const selected = userAnswers[currentQuestionIndex] === index ? 'selected' : '';
            return `<li class="quiz-option ${selected}" data-index="${index}">${option}</li>`;
        }).join('');
        
        document.querySelector('.quiz-options').innerHTML = optionsHtml;
        
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.quiz-option').forEach(o => {
                    o.classList.remove('selected');
                });
                
                option.classList.add('selected');
                userAnswers[currentQuestionIndex] = parseInt(option.dataset.index);
            });
        });
        
        document.getElementById('prev-question').disabled = currentQuestionIndex === 0;
        document.getElementById('next-question').textContent = currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next';
        
        document.querySelector('.quiz-nav span').textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
    }
    
    function showResults() {
        // Calculate score
        score = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === quizQuestions[index].correctAnswer) {
                score++;
            }
        });
        
        contentView.innerHTML = `
            <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2h1.5v3l2-3h1.7l-2 3 2 3h-1.7l-2-3v3H12V5zM7 7.25h2.5V6.5H7V5h4v3.75H8.5v.75H11V11H7V7.25zM19 13l-6 6-4-4-4 4v-2.5l4-4 4 4 6-6V13z"/>
                </svg>
                Quiz Results - ${currentModule.title}
            </h2>
            
            <div style="text-align: center; padding: 2rem; background-color: #3a3a3a; border-radius: var(--border-radius); margin-top: 1.5rem;">
                <h3>You scored ${score} out of ${quizQuestions.length}</h3>
                <p>${Math.round((score / quizQuestions.length) * 100)}% correct</p>
                <div style="margin-top: 1.5rem;">
                    <button class="back-button" id="review-quiz">Review Answers</button>
                    <button class="back-button" id="retry-quiz">Try Again</button>
                </div>
            </div>
        `;
        
        document.getElementById('review-quiz').addEventListener('click', showReview);
        document.getElementById('retry-quiz').addEventListener('click', () => {
            currentQuestionIndex = 0;
            userAnswers = [];
            renderQuiz();
        });
    }
    
    function showReview() {
        let reviewHtml = `
            <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                Quiz Review - ${currentModule.title}
            </h2>
        `;
        
        quizQuestions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            reviewHtml += `
                <div class="quiz-container">
                    <div class="quiz-question">
                        <h3>${index + 1}. ${question.question}</h3>
                        <ul class="quiz-options">
            `;
            
            question.options.forEach((option, optIndex) => {
                let optionClass = '';
                
                if (optIndex === question.correctAnswer) {
                    optionClass = 'selected'; // Correct answer
                } else if (userAnswer === optIndex && userAnswer !== question.correctAnswer) {
                    optionClass = 'selected'; // User's incorrect answer
                }
                
                reviewHtml += `<li class="quiz-option ${optionClass}">${option}</li>`;
            });
            
            reviewHtml += `
                        </ul>
                    </div>
                </div>
            `;
        });
        
        reviewHtml += `
            <button class="back-button" id="back-to-results">Back to Results</button>
        `;
        
        contentView.innerHTML = reviewHtml;
        
        document.getElementById('back-to-results').addEventListener('click', showResults);
    }
}

// Render match pairs
function renderMatchPairs() {
    const pairs = currentModule.content.match;
    let cards = [];
    
    // Create pairs array
    pairs.forEach((pair, index) => {
        cards.push({
            id: index,
            content: pair.term,
            type: 'term',
            matchId: index,
            flipped: false,
            matched: false
        });
        
        cards.push({
            id: index + pairs.length,
            content: pair.definition,
            type: 'definition',
            matchId: index,
            flipped: false,
            matched: false
        });
    });
    
    // Shuffle cards
    cards = shuffleArray(cards);
    
    contentView.innerHTML = `
        <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 10h-2v2h-2v-2H8V5h2v6h2V5h2v8z"/>
            </svg>
            Match the Pairs - ${currentModule.title}
        </h2>
        
        <p>Click on two cards to find matching pairs.</p>
        
        <div class="match-grid" id="match-grid">
            ${cards.map(card => `
                <div class="match-card" data-id="${card.id}" data-match-id="${card.matchId}">
                    <div class="match-card-content">${card.content}</div>
                </div>
            `).join('')}
        </div>
        
        <p style="text-align: center; margin-top: 1.5rem;">
            Pairs found: <span id="pairs-found">0</span> of ${pairs.length}
        </p>
    `;
    
    const matchGrid = document.getElementById('match-grid');
    const pairsFoundEl = document.getElementById('pairs-found');
    let flippedCards = [];
    let matchedPairs = 0;
    
    // Hide all card contents initially
    document.querySelectorAll('.match-card-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Add click event to cards
    document.querySelectorAll('.match-card').forEach(card => {
        card.addEventListener('click', () => {
            // Ignore if already matched or already flipped or two cards already flipped
            if (card.classList.contains('matched') || card.classList.contains('flipped') || flippedCards.length >= 2) {
                return;
            }
            
            // Flip card
            card.classList.add('flipped');
            card.querySelector('.match-card-content').style.display = 'block';
            flippedCards.push(card);
            
            // Check for match if we have two flipped cards
            if (flippedCards.length === 2) {
                const card1 = flippedCards[0];
                const card2 = flippedCards[1];
                
                if (card1.dataset.matchId === card2.dataset.matchId) {
                    // Match found
                    setTimeout(() => {
                        card1.classList.add('matched');
                        card2.classList.add('matched');
                        flippedCards = [];
                        
                        matchedPairs++;
                        pairsFoundEl.textContent = matchedPairs;
                        
                        // Check if all pairs are found
                        if (matchedPairs === pairs.length) {
                            showMatchComplete();
                        }
                    }, 500);
                } else {
                    // No match
                    setTimeout(() => {
                        card1.classList.remove('flipped');
                        card2.classList.remove('flipped');
                        card1.querySelector('.match-card-content').style.display = 'none';
                        card2.querySelector('.match-card-content').style.display = 'none';
                        flippedCards = [];
                    }, 1000);
                }
            }
        });
    });
    
    function showMatchComplete() {
        contentView.innerHTML += `
            <div style="text-align: center; padding: 2rem; background-color: #3a3a3a; border-radius: var(--border-radius); margin-top: 1.5rem;">
                <h3>Congratulations!</h3>
                <p>You've successfully matched all the pairs.</p>
                <button class="back-button" id="play-again" style="margin-top: 1rem;">Play Again</button>
            </div>
        `;
        
        document.getElementById('play-again').addEventListener('click', renderMatchPairs);
    }
}

// Render visual learning
function renderVisualLearning() {
    contentView.innerHTML = `
        <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.41 15.95L12 13.4l2.59 2.55L17.5 12.5 21 16h-2v2h-14v-2H9.41zM5 10.5l2-2 4 4 4-4 2 2-4 4z"/>
            </svg>
            Visual Learning - ${currentModule.title}
        </h2>
        
        <div class="visual-content">
            <p>Visual learning content will be added in a future update.</p>
            <p>This section can include animations, diagrams, and interactive visuals that help explain the concepts.</p>
        </div>
        
        <button class="back-button" id="back-to-methods" style="margin-top: 1.5rem;">Back to Study Methods</button>
    `;
    
    document.getElementById('back-to-methods').addEventListener('click', resetToModule);
}

// Helper function to shuffle an array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Initialize the app when document is loaded
document.addEventListener('DOMContentLoaded', init);
