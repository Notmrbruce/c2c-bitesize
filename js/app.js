// Main application script
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modulesView = document.getElementById('modules-view');
    const methodsView = document.getElementById('methods-view');
    const contentView = document.getElementById('content-view');
    const modulesList = document.getElementById('modules-list');
    const selectedModuleTitle = document.getElementById('selected-module-title');
    const methodButtons = document.getElementById('method-buttons');
    const homeLink = document.getElementById('home-link');
    
    // App state
    let currentModule = null;
    
    // Initialize the application
    init();
    
    // Event Listeners
    homeLink.addEventListener('click', showModulesView);
    
    // Functions
    function init() {
        loadModules();
        
        // Initially show only the modules view
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
    }
    
    function loadModules() {
        fetch('data/modules/index.json')
            .then(response => response.json())
            .then(modules => {
                modulesList.innerHTML = '';
                
                modules.forEach((module, index) => {
                    const moduleElement = document.createElement('div');
                    moduleElement.className = 'module-item';
                    moduleElement.innerHTML = `
                        <div class="number-circle circle-${(index % 4) + 1}">${index + 1}</div>
                        <div class="module-item-content">
                            <div class="module-item-title">${module.title}</div>
                            <div class="module-item-desc">${module.description}</div>
                        </div>
                    `;
                    
                    moduleElement.addEventListener('click', () => {
                        loadModule(module.id);
                    });
                    
                    modulesList.appendChild(moduleElement);
                });
            })
            .catch(error => {
                console.error('Error loading modules:', error);
                modulesList.innerHTML = '<p>Error loading modules. Please try again later.</p>';
            });
    }
    
    function loadModule(moduleId) {
        fetch(`data/modules/${moduleId}.json`)
            .then(response => response.json())
            .then(moduleData => {
                currentModule = moduleData;
                showMethodsView(moduleData);
            })
            .catch(error => {
                console.error(`Error loading module ${moduleId}:`, error);
                alert('Error loading module. Please try again later.');
            });
    }
    
    function showModulesView() {
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
    }
    
    function showMethodsView(moduleData) {
        // Update title
        selectedModuleTitle.textContent = moduleData.title;
        
        // Create method buttons
        createMethodButtons(moduleData);
        
        // Show methods view, hide others
        modulesView.style.display = 'none';
        methodsView.style.display = 'block';
        contentView.style.display = 'none';
    }
    
    function createMethodButtons(moduleData) {
        methodButtons.innerHTML = '';
        
        moduleData.methods.forEach(method => {
            const button = document.createElement('button');
            button.className = 'method-button';
            button.id = `${method}-button`;
            
            // Use appropriate icons for each method
            let icon = '';
            let methodName = '';
            
            switch (method) {
                case 'flashcards':
                    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14z"/><path d="M13 10H7v2h6v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>';
                    methodName = 'Flashcards';
                    break;
                case 'quiz':
                    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>';
                    methodName = 'Quiz';
                    break;
                case 'time-trial':
                    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
                    methodName = 'Time Trial';
                    break;
                case 'true-false':
                    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>';
                    methodName = 'True & False';
                    break;
                default:
                    methodName = method.charAt(0).toUpperCase() + method.slice(1);
            }
            
            button.innerHTML = `${icon} ${methodName}`;
            
            button.addEventListener('click', () => {
                loadStudyMethod(moduleData, method);
            });
            
            methodButtons.appendChild(button);
        });
    }
    
    function loadStudyMethod(moduleData, method) {
        // Clear previous content
        contentView.innerHTML = '';
        
        // Show the content view
        contentView.style.display = 'block';
        
        // Load the appropriate study method
        switch (method) {
            case 'flashcards':
                loadFlashcards(moduleData);
                break;
            case 'quiz':
                loadQuiz(moduleData);
                break;
            case 'time-trial':
                initTimeTrialGame(moduleData);
                break;
            case 'true-false':
                initTrueFalseQuestions(moduleData);
                break;
            default:
                contentView.innerHTML = `<p>Study method "${method}" is not implemented yet.</p>`;
        }
    }
    
    function loadFlashcards(moduleData) {
        const flashcardsData = moduleData.content.flashcards;
        let currentCardIndex = 0;
        
        // Create flashcard container
        contentView.innerHTML = `
            <h3>${moduleData.title} - Flashcards</h3>
            <div class="flashcard" id="current-flashcard">
                <div class="flashcard-question">${flashcardsData[currentCardIndex].question}</div>
                <div class="flashcard-answer">${flashcardsData[currentCardIndex].answer}</div>
            </div>
            <div class="flashcard-nav">
                <button id="prev-card" class="back-button" ${currentCardIndex === 0 ? 'disabled' : ''}>Previous</button>
                <button id="flip-card" class="back-button">Flip Card</button>
                <button id="next-card" class="back-button" ${currentCardIndex === flashcardsData.length - 1 ? 'disabled' : ''}>Next</button>
            </div>
            <button id="back-to-methods" class="back-button">Back to Methods</button>
        `;
        
        // Add event listeners
        const flashcardElement = document.getElementById('current-flashcard');
        const prevButton = document.getElementById('prev-card');
        const nextButton = document.getElementById('next-card');
        const flipButton = document.getElementById('flip-card');
        const backButton = document.getElementById('back-to-methods');
        
        flashcardElement.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
        });
        
        flipButton.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
        });
        
        prevButton.addEventListener('click', () => {
            if (currentCardIndex > 0) {
                currentCardIndex--;
                updateFlashcard();
            }
        });
        
        nextButton.addEventListener('click', () => {
            if (currentCardIndex < flashcardsData.length - 1) {
                currentCardIndex++;
                updateFlashcard();
            }
        });
        
        backButton.addEventListener('click', () => {
            showMethodsView(moduleData);
        });
        
        function updateFlashcard() {
            const card = flashcardsData[currentCardIndex];
            document.querySelector('.flashcard-question').textContent = card.question;
            document.querySelector('.flashcard-answer').textContent = card.answer;
            flashcardElement.classList.remove('flipped');
            
            // Update button states
            prevButton.disabled = currentCardIndex === 0;
            nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
        }
    }
    
    function loadQuiz(moduleData) {
        const quizData = moduleData.content.quiz;
        let currentQuestionIndex = 0;
        let score = 0;
        let userAnswers = [];
        
        // Initialize user answers array
        quizData.forEach(() => userAnswers.push(null));
        
        // Create quiz container
        contentView.innerHTML = `
            <h3>${moduleData.title} - Quiz</h3>
            <div class="quiz-container" id="quiz-container">
                <div class="quiz-question" id="quiz-question"></div>
                <ul class="quiz-options" id="quiz-options"></ul>
            </div>
            <div class="quiz-nav">
                <button id="prev-question" class="back-button">Previous</button>
                <button id="next-question" class="back-button">Next</button>
                <button id="submit-quiz" class="back-button">Submit Quiz</button>
            </div>
            <button id="back-to-methods" class="back-button">Back to Methods</button>
        `;
        
        // Add event listeners
        const prevButton = document.getElementById('prev-question');
        const nextButton = document.getElementById('next-question');
        const submitButton = document.getElementById('submit-quiz');
        const backButton = document.getElementById('back-to-methods');
        
        prevButton.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                loadQuestion();
            }
        });
        
        nextButton.addEventListener('click', () => {
            if (currentQuestionIndex < quizData.length - 1) {
                currentQuestionIndex++;
                loadQuestion();
            }
        });
        
        submitButton.addEventListener('click', () => {
            if (userAnswers.includes(null)) {
                if (confirm("You haven't answered all questions. Are you sure you want to submit?")) {
                    showQuizResults();
                }
            } else {
                showQuizResults();
            }
        });
        
        backButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to exit the quiz? Your progress will be lost.")) {
                showMethodsView(moduleData);
            }
        });
        
        // Load first question
        loadQuestion();
        
        function loadQuestion() {
            const questionData = quizData[currentQuestionIndex];
            const questionElement = document.getElementById('quiz-question');
            const optionsElement = document.getElementById('quiz-options');
            
            questionElement.textContent = `${currentQuestionIndex + 1}. ${questionData.question}`;
            
            optionsElement.innerHTML = '';
            questionData.options.forEach((option, index) => {
                const optionElement = document.createElement('li');
                optionElement.className = 'quiz-option';
                optionElement.textContent = option;
                
                if (userAnswers[currentQuestionIndex] === index) {
                    optionElement.classList.add('selected');
                }
                
                optionElement.addEventListener('click', () => {
                    // Clear previous selection
                    document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
                    
                    // Select this option
                    optionElement.classList.add('selected');
                    
                    // Save user's answer
                    userAnswers[currentQuestionIndex] = index;
                });
                
                optionsElement.appendChild(optionElement);
            });
            
            // Update button states
            prevButton.disabled = currentQuestionIndex === 0;
            nextButton.disabled = currentQuestionIndex === quizData.length - 1;
            
            // Show/hide appropriate buttons
            if (currentQuestionIndex === quizData.length - 1) {
                nextButton.style.display = 'none';
                submitButton.style.display = 'block';
            } else {
                nextButton.style.display = 'block';
                submitButton.style.display = 'none';
            }
        }
        
        function showQuizResults() {
            // Calculate score
            score = 0;
            userAnswers.forEach((answer, index) => {
                if (answer === quizData[index].correctAnswer) {
                    score++;
                }
            });
            
            // Display results
            contentView.innerHTML = `
                <h3>${moduleData.title} - Quiz Results</h3>
                <div class="quiz-results">
                    <h4>Your Score: ${score} out of ${quizData.length}</h4>
                    <p>Percentage: ${Math.round((score / quizData.length) * 100)}%</p>
                    <div class="quiz-feedback">
                        ${score === quizData.length ? 
                            '<p>Perfect! You got all the questions right.</p>' : 
                            '<p>Keep learning to improve your score.</p>'}
                    </div>
                    <button id="review-quiz" class="back-button">Review Answers</button>
                    <button id="retry-quiz" class="back-button">Retry Quiz</button>
                    <button id="back-to-methods" class="back-button">Back to Methods</button>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('review-quiz').addEventListener('click', () => {
                showQuizReview();
            });
            
            document.getElementById('retry-quiz').addEventListener('click', () => {
                loadQuiz(moduleData);
            });
            
            document.getElementById('back-to-methods').addEventListener('click', () => {
                showMethodsView(moduleData);
            });
        }
        
        function showQuizReview() {
            contentView.innerHTML = `
                <h3>${moduleData.title} - Quiz Review</h3>
                <div class="quiz-review" id="quiz-review"></div>
                <button id="back-to-results" class="back-button">Back to Results</button>
            `;
            
            const reviewElement = document.getElementById('quiz-review');
            
            quizData.forEach((question, index) => {
                const userAnswer = userAnswers[index] !== null ? userAnswers[index] : -1;
                const isCorrect = userAnswer === question.correctAnswer;
                
                const questionElement = document.createElement('div');
                questionElement.className = `quiz-review-item ${isCorrect ? 'correct' : 'incorrect'}`;
                
                questionElement.innerHTML = `
                    <div class="quiz-review-question">${index + 1}. ${question.question}</div>
                    <div class="quiz-review-answers">
                        <div class="quiz-review-your-answer">
                            Your answer: ${userAnswer >= 0 ? question.options[userAnswer] : 'Not answered'}
                        </div>
                        <div class="quiz-review-correct-answer">
                            Correct answer: ${question.options[question.correctAnswer]}
                        </div>
                    </div>
                `;
                
                reviewElement.appendChild(questionElement);
            });
            
            document.getElementById('back-to-results').addEventListener('click', () => {
                showQuizResults();
            });
        }
    }
    
    // Time Trial Game Implementation
    function initTimeTrialGame(moduleData) {
        const timeTrialData = moduleData.content['time-trial'];
        let score = 0;
        let currentRound = 0;
        let timer;
        let timeLeft = 7;
        let gameStarted = false;
        let selectedItems = [];
        
        // Create the game UI
        const contentView = document.getElementById('content-view');
        contentView.innerHTML = `
            <h3>${moduleData.title} - Time Trial</h3>
            <div class="time-trial-container">
                <div class="time-trial-header">
                    <div class="time-trial-score">Score: <span id="time-trial-score">0</span></div>
                    <div class="time-trial-timer">Time: <span id="time-trial-time">7</span>s</div>
                    <div class="time-trial-progress">Question <span id="time-trial-current">1</span>/${timeTrialData.length}</div>
                </div>
                
                <div class="time-trial-answer-container">
                    <div class="time-trial-answer" id="time-trial-answer"></div>
                </div>
                
                <div class="time-trial-options" id="time-trial-options"></div>
                
                <div class="time-trial-feedback" id="time-trial-feedback"></div>
                
                <div class="time-trial-controls">
                    <button id="time-trial-start" class="time-trial-button">Start Game</button>
                    <button id="time-trial-next" class="time-trial-button" style="display: none;">Next</button>
                </div>
            </div>
        `;
        
        const scoreElement = document.getElementById('time-trial-score');
        const timeElement = document.getElementById('time-trial-time');
        const currentElement = document.getElementById('time-trial-current');
        const answerElement = document.getElementById('time-trial-answer');
        const optionsElement = document.getElementById('time-trial-options');
        const feedbackElement = document.getElementById('time-trial-feedback');
        const startButton = document.getElementById('time-trial-start');
        const nextButton = document.getElementById('time-trial-next');
        
        // Initialize the game
        startButton.addEventListener('click', startGame);
        nextButton.addEventListener('click', nextRound);
        
        function startGame() {
            gameStarted = true;
            score = 0;
            currentRound = 0;
            scoreElement.textContent = '0';
            startButton.style.display = 'none';
            
            // Shuffle the data for a random order
            shuffleArray(timeTrialData);
            
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
            timeLeft = 7;
            timeElement.textContent = timeLeft;
            feedbackElement.innerHTML = '';
            nextButton.style.display = 'none';
            
            // Update progress
            currentElement.textContent = currentRound + 1;
            
            // Get current item and generate options
            const currentItem = timeTrialData[currentRound];
            
            // Display the definition (answer)
            answerElement.textContent = currentItem.definition;
            
            // Generate options (including the correct one)
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
            const allItems = [...timeTrialData];
            const correctIndex = allItems.findIndex(item => item.term === currentItem.term);
            allItems.splice(correctIndex, 1); // Remove the correct item
            shuffleArray(allItems);
            
            // Use 3 distractors plus the correct option
            const distractors = allItems.slice(0, 3);
            const options = [...distractors, currentItem];
            shuffleArray(options); // Shuffle so correct answer isn't always in the same position
            
            // Create option buttons
            options.forEach(option => {
                const optionButton = document.createElement('button');
                optionButton.className = 'time-trial-option';
                optionButton.textContent = option.term;
                optionButton.dataset.term = option.term;
                optionButton.addEventListener('click', () => selectOption(option.term, currentItem.term));
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
                    option.classList.add('time-trial-correct');
                } else if (option.dataset.term === selectedTerm && selectedTerm !== correctTerm) {
                    option.classList.add('time-trial-incorrect');
                }
            });
            
            // Check if answer is correct
            const isCorrect = selectedTerm === correctTerm;
            
            // Update score if correct
            if (isCorrect) {
                score++;
                scoreElement.textContent = score;
                feedbackElement.innerHTML = '<div class="time-trial-correct-feedback">Correct!</div>';
            } else {
                feedbackElement.innerHTML = `<div class="time-trial-incorrect-feedback">Incorrect! The correct answer was: ${correctTerm}</div>`;
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
                timeElement.textContent = timeLeft;
                
                if (timeLeft <= 3) {
                    timeElement.classList.add('time-trial-time-warning');
                } else {
                    timeElement.classList.remove('time-trial-time-warning');
                }
                
                if (timeLeft <= 0) {
                    timeOut();
                }
            }, 1000);
        }
        
        function timeOut() {
            clearInterval(timer);
            
            // Get the current item
            const currentItem = timeTrialData[currentRound - 1];
            
            // Highlight the correct answer
            const options = document.querySelectorAll('.time-trial-option');
            options.forEach(option => {
                option.disabled = true;
                if (option.dataset.term === currentItem.term) {
                    option.classList.add('time-trial-correct');
                }
            });
            
            feedbackElement.innerHTML = `<div class="time-trial-timeout-feedback">Time's up! The correct answer was: ${currentItem.term}</div>`;
            
            // Show next button
            nextButton.style.display = 'block';
            
            // Auto-advance if it's the last question
            if (currentRound >= timeTrialData.length) {
                setTimeout(endGame, 1500);
            }
        }
        
        function endGame() {
            // Display final score and game over message
            contentView.innerHTML = `
                <h3>${moduleData.title} - Time Trial</h3>
                <div class="time-trial-container">
                    <div class="time-trial-game-over">
                        <h2>Game Over!</h2>
                        <p>Your final score: ${score} out of ${timeTrialData.length}</p>
                        <p>Accuracy: ${Math.round((score / timeTrialData.length) * 100)}%</p>
                        ${score === timeTrialData.length ? 
                            '<p class="time-trial-perfect">Perfect Score!</p>' : 
                            '<p>Keep practicing to improve your knowledge!</p>'}
                        <button id="time-trial-replay" class="time-trial-button">Play Again</button>
                        <button id="time-trial-back" class="time-trial-button">Back to Methods</button>
                    </div>
                </div>
            `;
            
            // Set up event listeners for the replay and back buttons
            document.getElementById('time-trial-replay').addEventListener('click', () => {
                initTimeTrialGame(moduleData);
            });
            
            document.getElementById('time-trial-back').addEventListener('click', () => {
                showMethodsView(moduleData);
            });
        }
    }
    
    // True-False Questions Implementation
    function initTrueFalseQuestions(moduleData) {
        const trueFalseData = moduleData.content['true-false'];
        let score = 0;
        let currentQuestionIndex = 0;
        let userAnswers = [];
        
        // Create the UI
        const contentView = document.getElementById('content-view');
        contentView.innerHTML = `
            <h3>${moduleData.title} - True & False</h3>
            <div class="true-false-container">
                <div class="true-false-header">
                    <div class="true-false-score">Score: <span id="true-false-score">0</span></div>
                    <div class="true-false-progress">Question <span id="true-false-current">1</span>/${trueFalseData.length}</div>
                </div>
                
                <div class="true-false-statement-container">
                    <div class="true-false-statement" id="true-false-statement"></div>
                </div>
                
                <div class="true-false-buttons">
                    <button id="true-button" class="true-button">TRUE</button>
                    <button id="false-button" class="false-button">FALSE</button>
                </div>
                
                <div class="true-false-feedback" id="true-false-feedback"></div>
                
                <div class="true-false-controls">
                    <button id="true-false-next" class="true-false-button" style="display: none;">Next</button>
                    <button id="back-to-methods" class="back-button">Back to Methods</button>
                </div>
            </div>
        `;
        
        const scoreElement = document.getElementById('true-false-score');
        const currentElement = document.getElementById('true-false-current');
        const statementElement = document.getElementById('true-false-statement');
        const trueButton = document.getElementById('true-button');
        const falseButton = document.getElementById('false-button');
        const feedbackElement = document.getElementById('true-false-feedback');
        const nextButton = document.getElementById('true-false-next');
        const backButton = document.getElementById('back-to-methods');
        
        // Initialize
        shuffleArray(trueFalseData);
        loadQuestion();
        
        // Add event listeners
        trueButton.addEventListener('click', () => selectAnswer(true));
        falseButton.addEventListener('click', () => selectAnswer(false));
        nextButton.addEventListener('click', nextQuestion);
        backButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
                showMethodsView(moduleData);
            }
        });
        
        function loadQuestion() {
            const questionData = trueFalseData[currentQuestionIndex];
            
            // Update statement
            statementElement.textContent = questionData.statement;
            
            // Update progress
            currentElement.textContent = currentQuestionIndex + 1;
            
            // Reset buttons
            trueButton.disabled = false;
            falseButton.disabled = false;
            trueButton.classList.remove('true-button-selected');
            falseButton.classList.remove('false-button-selected');
            
            // Hide feedback and next button
            feedbackElement.classList.remove('visible');
            nextButton.style.display = 'none';
        }
        
        function selectAnswer(userAnswer) {
            const questionData = trueFalseData[currentQuestionIndex];
            const isCorrect = userAnswer === questionData.isTrue;
            
            // Update UI to show selected answer
            if (userAnswer) {
                trueButton.classList.add('true-button-selected');
            } else {
                falseButton.classList.add('false-button-selected');
            }
            
            // Disable buttons
            trueButton.disabled = true;
            falseButton.disabled = true;
            
            // Show feedback
            if (isCorrect) {
                score++;
                scoreElement.textContent = score;
                feedbackElement.innerHTML = `
                    <div class="true-false-correct-feedback">Correct!</div>
                    <div class="true-false-explanation">${questionData.explanation}</div>
                `;
            } else {
                feedbackElement.innerHTML = `
                    <div class="true-false-incorrect-feedback">Incorrect!</div>
                    <div class="true-false-explanation">${questionData.explanation}</div>
                `;
            }
            
            feedbackElement.classList.add('visible');
            
            // Show next button
            nextButton.style.display = 'block';
            
            // Save user's answer
            userAnswers[currentQuestionIndex] = {
                userAnswer,
                isCorrect
            };
        }
        
        function nextQuestion() {
            currentQuestionIndex++;
            
            if (currentQuestionIndex >= trueFalseData.length) {
                showResults();
                return;
            }
            
            loadQuestion();
        }
        
        function showResults() {
            // Calculate final score
            const accuracy = Math.round((score / trueFalseData.length) * 100);
            
            // Display results
            contentView.innerHTML = `
                <h3>${moduleData.title} - True & False Results</h3>
                <div class="true-false-container">
                    <div class="true-false-results">
                        <h2>Quiz Complete!</h2>
                        <p>Your final score: ${score} out of ${trueFalseData.length}</p>
                        <p>Accuracy: ${accuracy}%</p>
                        ${score === trueFalseData.length ? 
                            '<p class="true-false-perfect">Perfect Score!</p>' : 
                            '<p>Keep practicing to improve your knowledge!</p>'}
                        <button id="true-false-review" class="true-false-button">Review Answers</button>
                        <button id="true-false-replay" class="true-false-button">Play Again</button>
                        <button id="true-false-back" class="true-false-button">Back to Methods</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('true-false-review').addEventListener('click', showReview);
            document.getElementById('true-false-replay').addEventListener('click', () => {
                initTrueFalseQuestions(moduleData);
            });
            document.getElementById('true-false-back').addEventListener('click', () => {
                showMethodsView(moduleData);
            });
        }
        
        function showReview() {
            contentView.innerHTML = `
                <h3>${moduleData.title} - True & False Review</h3>
                <div class="true-false-container" id="review-container">
                    <!-- Review items will be added here -->
                </div>
                <button id="back-to-results" class="back-button">Back to Results</button>
            `;
            
            const reviewContainer = document.getElementById('review-container');
            
            // Add review items
            trueFalseData.forEach((question, index) => {
                const userAnswer = userAnswers[index];
                
                // Create review item
                const reviewItem = document.createElement('div');
                reviewItem.className = 'true-false-statement-container';
                reviewItem.innerHTML = `
                    <div class="true-false-statement">${index + 1}. ${question.statement}</div>
                    <div class="true-false-feedback visible">
                        <div class="${userAnswer && userAnswer.isCorrect ? 
                            'true-false-correct-feedback' : 'true-false-incorrect-feedback'}">
                            ${userAnswer ? (userAnswer.isCorrect ? 'Correct!' : 'Incorrect!') : 'Not answered'}
                        </div>
                        <div>
                            <p>Correct answer: <strong>${question.isTrue ? 'TRUE' : 'FALSE'}</strong></p>
                            ${userAnswer ? `<p>Your answer: <strong>${userAnswer.userAnswer ? 'TRUE' : 'FALSE'}</strong></p>` : ''}
                        </div>
                        <div class="true-false-explanation">${question.explanation}</div>
                    </div>
                `;
                
                reviewContainer.appendChild(reviewItem);
            });
            
            // Add back button listener
            document.getElementById('back-to-results').addEventListener('click', showResults);
        }
    }
    
    // Helper function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
