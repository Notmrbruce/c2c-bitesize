    async function initTimeTrialGame(moduleTitle, timeTrialData) { // Takes adapted data
        let score = 0;
        let currentRound = 0; // Use round instead of index
        let timer;
        let timeLeft = 7; // Reset time for each round
        const totalRounds = timeTrialData.length; // Use length of adapted data
        let isRoundActive = false; // Flag to prevent multiple answers

        const updateTimerDisplay = () => {
           const timeElement = document.getElementById('time-trial-time');
           if(timeElement) {
               timeElement.textContent = timeLeft + 's';
               timeElement.classList.toggle('warning', timeLeft <= 3);
           }
        };

        const endGame = () => { /* ... (endGame function remains the same as before) ... */
            clearInterval(timer);
            isRoundActive = false;
            const percentage = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;
            contentView.innerHTML = `
               <div class="content-header">
                   <h2 class="content-title">${moduleTitle} - Time Trial Results</h2>
               </div>
               <div class="content-container">
                   <div class="time-trial-results">
                       <div class="quiz-score">${score} / ${totalRounds}</div>
                       <div class="quiz-percentage">${percentage}%</div>
                       ${score === totalRounds ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Keep practicing!</p>'}
                       <div class="quiz-actions">
                           <button id="time-trial-replay" class="btn btn-primary">Play Again</button>
                           <button id="back-to-methods" class="btn">Back to Methods</button>
                       </div>
                   </div>
               </div>`;
            document.getElementById('time-trial-replay').addEventListener('click', () => initTimeTrialGame(moduleTitle, timeTrialData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const timeOut = () => { /* ... (timeOut function remains the same as before) ... */
           if (!isRoundActive) return;
           clearInterval(timer);
           isRoundActive = false;
           const currentItem = timeTrialData[currentRound - 1];
           const feedbackElement = document.getElementById('time-trial-feedback');
           const options = document.querySelectorAll('.time-trial-option');
           const nextButton = document.getElementById('time-trial-next');
           const imageContainer = document.getElementById('time-trial-image-container');
           const imageElement = document.getElementById('time-trial-image');

           options.forEach(option => {
               option.disabled = true;
               if (option.dataset.term === currentItem.term) option.classList.add('correct');
           });
           if (feedbackElement) feedbackElement.innerHTML = `<div class="feedback-timeout">Time's up! Correct: ${currentItem.term}</div>`;
           if (nextButton) nextButton.style.display = 'block';

            if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                 const imagePath = currentItem.image;
                 checkImageExists(imagePath).then(exists => {
                      if(exists) {
                           imageElement.src = imagePath;
                           imageElement.alt = currentItem.imageAlt || 'Image';
                           imageContainer.style.display = 'block';
                      }
                 });
            }

            if (currentRound >= totalRounds) {
                setTimeout(endGame, 1500);
           } else {
               // **Ensure listener is attached if nextButton is shown after timeout**
               if (nextButton) nextButton.onclick = nextRound;
           }
       };

        const startTimer = () => { /* ... (startTimer function remains the same as before) ... */
            timeLeft = 7;
            isRoundActive = true;
            updateTimerDisplay();
            clearInterval(timer);
            timer = setInterval(() => {
                if (!isRoundActive) {
                     clearInterval(timer);
                     return;
                 }
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    timeOut();
                }
            }, 1000);
        };

         const selectOption = async (selectedTerm) => { /* ... (selectOption function mostly the same, ensures nextButton listener) ... */
            if (!isRoundActive) return;
            isRoundActive = false;
            clearInterval(timer);

            const currentItem = timeTrialData[currentRound - 1];
             const correctTerm = currentItem.term;
            const isCorrect = selectedTerm === correctTerm;
            const feedbackElement = document.getElementById('time-trial-feedback');
            const options = document.querySelectorAll('.time-trial-option');
            const nextButton = document.getElementById('time-trial-next');
            const scoreElement = document.getElementById('time-trial-score');
            const imageContainer = document.getElementById('time-trial-image-container');
            const imageElement = document.getElementById('time-trial-image');

            options.forEach(option => {
                option.disabled = true;
                if (option.dataset.term === correctTerm) option.classList.add('correct');
                if (option.dataset.term === selectedTerm && !isCorrect) option.classList.add('incorrect');
            });

             if (isCorrect) {
                 score++;
                 if(scoreElement) scoreElement.textContent = score;
                 if(feedbackElement) feedbackElement.innerHTML = '<div class="feedback-correct">Correct!</div>';
             } else {
                 if(feedbackElement) feedbackElement.innerHTML = `<div class="feedback-incorrect">Incorrect! Correct: ${correctTerm}</div>`;
             }

             if(nextButton) {
                nextButton.style.display = 'block';
                 if (currentRound >= totalRounds) {
                     nextButton.textContent = "Show Results";
                     nextButton.onclick = endGame; // Directly assign endGame here
                 } else {
                    nextButton.textContent = "Next Term";
                    nextButton.onclick = nextRound; // Assign nextRound here
                }
             }

             if (imageContainer && imageElement && currentItem.imageDisplayTiming === "after-answer") {
                 const imagePath = currentItem.image;
                 const imageExists = await checkImageExists(imagePath);
                 if(imageExists) {
                     imageElement.src = imagePath;
                     imageElement.alt = currentItem.imageAlt || 'Image';
                     imageContainer.style.display = 'block';
                 }
            }

             // Note: Auto-ending is now handled by changing the button's click handler
         };

        const nextRound = async () => { /* ... (nextRound function mostly the same) ... */
            if (currentRound >= totalRounds) {
                endGame();
                return;
             }
             const currentItem = timeTrialData[currentRound];
            const definitionElement = document.getElementById('time-trial-definition');
            const optionsElement = document.getElementById('time-trial-options');
            const feedbackElement = document.getElementById('time-trial-feedback');
            const nextButton = document.getElementById('time-trial-next');
            const currentElement = document.getElementById('time-trial-current');
            const imageContainer = document.getElementById('time-trial-image-container');
            const imageElement = document.getElementById('time-trial-image');

             // Reset UI elements
            if(feedbackElement) feedbackElement.innerHTML = '';
             if(nextButton) nextButton.style.display = 'none'; // Hide until answer/timeout
            if(currentElement) currentElement.textContent = `${currentRound + 1}/${totalRounds}`;
             if(definitionElement) definitionElement.textContent = currentItem.definition;

             // Image handling
             const imagePath = currentItem.image;
             const imageExists = await checkImageExists(imagePath);
            if (imageContainer && imageElement) {
                if (imageExists) {
                    imageElement.src = imagePath;
                     imageElement.alt = currentItem.imageAlt || `Image for ${currentItem.term}`;
                     imageContainer.style.display = (currentItem.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
                } else {
                     imageContainer.style.display = 'none';
                }
             }

             // Generate options
            const distractors = timeTrialData.map(item => item.term).filter(term => term !== currentItem.term).sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [currentItem.term, ...distractors].sort(() => 0.5 - Math.random());

             if(optionsElement) {
                optionsElement.innerHTML = '';
                 options.forEach(term => {
                    const optionButton = document.createElement('button');
                    optionButton.className = 'time-trial-option';
                    optionButton.textContent = term;
                    optionButton.dataset.term = term;
                     optionButton.addEventListener('click', () => selectOption(term)); // Selects THIS term
                    optionsElement.appendChild(optionButton);
                });
            }

            currentRound++;
             startTimer();
        };

         const startGame = () => { // Starts the process
            score = 0;
            currentRound = 0; // Reset round counter
             document.getElementById('time-trial-score').textContent = '0';
             document.getElementById('time-trial-start-screen').style.display = 'none'; // Hide start screen
            document.getElementById('time-trial-gameplay').style.display = 'block'; // Show game area
             nextRound(); // Load the first round
        };

         // Initial UI Setup - *** REMOVED STRAY COMMENTS ***
         contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - Time Trial</h2>
            </div>
            <div class="content-container">
                <div class="time-trial-header">
                    <div class="time-trial-info">
                        <div class="info-item"><div class="info-label">Score</div><div class="info-value" id="time-trial-score">0</div></div>
                        <div class="info-item"><div class="info-label">Time</div><div class="info-value time-value" id="time-trial-time">7s</div></div>
                         <div class="info-item"><div class="info-label">Question</div><div class="info-value" id="time-trial-current">0/${totalRounds}</div></div>
                    </div>
                </div>
                 <div id="time-trial-gameplay" style="display: none;">
                     <div class="time-trial-definition" id="time-trial-definition">Definition goes here...</div>
                      <div id="time-trial-image-container" class="time-trial-image-container" style="display: none;">
                          <img id="time-trial-image" src="" alt="Time trial image" class="time-trial-image">
                      </div>
                     <div class="time-trial-options" id="time-trial-options">Options will load here...</div>
                    <div class="time-trial-feedback" id="time-trial-feedback" style="min-height: 40px;"></div>
                    <div class="time-trial-controls" style="margin-top: 1rem; display: flex; justify-content: center;">
                          <button id="time-trial-next" class="btn btn-primary" style="display: none;">Next Term</button>
                     </div>
                 </div>
                 <div id="time-trial-start-screen" class="text-center" style="padding: 2rem 0;">
                    <p style="margin-bottom: 1.5rem;">Match the definition to the correct term within 7 seconds!</p>
                     <button id="time-trial-start" class="btn btn-primary btn-large">Start Game</button>
                </div>
            </div>
            <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`;

        document.getElementById('time-trial-start').addEventListener('click', startGame);
        document.getElementById('back-to-methods').addEventListener('click', () => {
            clearInterval(timer);
             showMethodsView(currentModule);
         });
    }

    // --- True/False Implementation ---
    async function initTrueFalseQuestions(moduleTitle, trueFalseData) { /* ... (This function remains the same as before) ... */
        let score = 0;
        let currentQuestionIndex = 0;
        let userAnswers = new Array(trueFalseData.length).fill(null); // Store results
        const totalQuestions = trueFalseData.length;

        const showResults = () => { /* Definition remains the same */
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            contentView.innerHTML = `
               <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - True or False Results</h2>
               </div>
                <div class="content-container">
                    <div class="time-trial-results">
                        <div class="quiz-score">${score} / ${totalQuestions}</div>
                        <div class="quiz-percentage">${percentage}%</div>
                        ${score === totalQuestions ? '<div class="quiz-perfect">Perfect Score! 🎉</div>' : '<p>Keep learning!</p>'}
                        <div class="quiz-actions">
                             <button id="true-false-review" class="btn btn-primary">Review Answers</button>
                             <button id="true-false-replay" class="btn">Try Again</button>
                            <button id="back-to-methods" class="btn">Back to Methods</button>
                         </div>
                     </div>
                </div>`;
            document.getElementById('true-false-review').addEventListener('click', showReview);
            document.getElementById('true-false-replay').addEventListener('click', () => initTrueFalseQuestions(moduleTitle, trueFalseData));
            document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        };

        const showReview = async () => { /* Definition remains the same */
           contentView.innerHTML = `
                <div class="content-header">
                    <h2 class="content-title">${moduleTitle} - True or False Review</h2>
                </div>
                <div class="content-container" id="review-container"></div>
                 <button id="back-to-results" class="btn">Back to Results</button>`;
            const reviewContainer = document.getElementById('review-container');
            for (let i = 0; i < trueFalseData.length; i++) {
                const question = trueFalseData[i];
                const answerRecord = userAnswers[i];
                 const imagePath = question.image;
                 const imageExists = await checkImageExists(imagePath);
                const reviewItem = document.createElement('div');
                reviewItem.className = `review-item ${answerRecord && answerRecord.isCorrect ? 'correct' : 'incorrect'}`;
                reviewItem.innerHTML = `
                    <div class="review-statement">${i + 1}. ${question.statement}</div>
                     ${imageExists ? `<div class="review-image-container"><img src="${imagePath}" alt="${question.imageAlt || 'Review image'}" class="review-image"></div>` : ''}
                     <div class="review-details">
                         <div class="review-answer">Correct answer: <strong>${question.isTrue ? 'TRUE' : 'FALSE'}</strong></div>
                        ${answerRecord ? `<div class="review-answer">Your answer: <strong>${answerRecord.userAnswer ? 'TRUE' : 'FALSE'}</strong></div>` : '<div class="review-answer">Your answer: Not answered</div>'}
                         <div class="review-explanation">${question.explanation || 'No explanation provided.'}</div>
                    </div>`;
                 reviewContainer.appendChild(reviewItem);
            }
             document.getElementById('back-to-results').addEventListener('click', showResults);
        };

         const nextQuestion = async () => {
            currentQuestionIndex++;
             if (currentQuestionIndex >= totalQuestions) {
                showResults();
             } else {
                 await loadQuestion();
             }
        };

         const selectAnswer = async (userAnswer) => {
            const questionData = trueFalseData[currentQuestionIndex];
            const isCorrect = userAnswer === questionData.isTrue;
             if (isCorrect) score++;
            userAnswers[currentQuestionIndex] = { userAnswer, isCorrect };

             // Update UI
             document.getElementById('true-button').disabled = true;
             document.getElementById('false-button').disabled = true;
             document.getElementById(userAnswer ? 'true-button' : 'false-button').classList.add('selected');

            const feedbackElement = document.getElementById('true-false-feedback');
            const nextButton = document.getElementById('true-false-next');
             const imageContainer = document.getElementById('true-false-image-container');
             const imageElement = document.getElementById('true-false-image');

             if(feedbackElement) {
                feedbackElement.innerHTML = `
                     <div class="feedback-header" style="color: ${isCorrect ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'};">${isCorrect ? 'Correct!' : 'Incorrect!'}</div>
                     <div class="feedback-content">${questionData.explanation || ''}</div>`;
                feedbackElement.classList.add('visible');
                feedbackElement.className = `true-false-feedback visible ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`; // Updated className logic
                feedbackElement.style.display = 'block';
             }

             // Show image after answer if needed
             if (imageContainer && imageElement && questionData.imageDisplayTiming === "after-answer") {
                 const imagePath = questionData.image;
                 const imageExists = await checkImageExists(imagePath);
                 if(imageExists) {
                     imageElement.src = imagePath;
                     imageElement.alt = questionData.imageAlt || 'Image';
                     imageContainer.style.display = 'block';
                 }
            }

            if(nextButton) {
                 nextButton.style.display = 'block';
                 nextButton.textContent = (currentQuestionIndex === totalQuestions - 1) ? "Show Results" : "Next Question";
            }
         };


        const loadQuestion = async () => {
            if (currentQuestionIndex < 0 || currentQuestionIndex >= totalQuestions) return;
            const questionData = trueFalseData[currentQuestionIndex];
            const imagePath = questionData.image;
             const imageExists = await checkImageExists(imagePath);

             // Removed innerHTML rewrite
             const currentEl = document.getElementById('true-false-current');
             const statementEl = document.getElementById('true-false-statement');
             const trueBtn = document.getElementById('true-button');
             const falseBtn = document.getElementById('false-button');
             const feedbackEl = document.getElementById('true-false-feedback');
             const nextBtn = document.getElementById('true-false-next');
             const imageContainer = document.getElementById('true-false-image-container');
             const imageElement = document.getElementById('true-false-image');

             if (currentEl) currentEl.textContent = currentQuestionIndex + 1;
             if (statementEl) statementEl.textContent = questionData.statement;
             if (trueBtn) { trueBtn.disabled = false; trueBtn.classList.remove('selected'); }
             if (falseBtn) { falseBtn.disabled = false; falseBtn.classList.remove('selected'); }
             if (feedbackEl) { feedbackEl.classList.remove('visible', 'feedback-correct', 'feedback-incorrect'); feedbackEl.style.display = 'none'; feedbackEl.innerHTML=''; }
             if (nextBtn) { nextBtn.style.display = 'none'; nextBtn.textContent="Next Question"; }

             if (imageContainer && imageElement) {
                if (imageExists) {
                    imageElement.src = imagePath;
                     imageElement.alt = questionData.imageAlt || `Image for statement ${currentQuestionIndex + 1}`;
                     imageContainer.style.display = (questionData.imageDisplayTiming !== "after-answer") ? 'block' : 'none';
                } else {
                     imageContainer.style.display = 'none';
                }
             }
        };

         // Initial UI Setup for True/False - *** REMOVED STRAY COMMENTS ***
         contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleTitle} - True or False</h2>
                <span class="progress-indicator">Question <span id="true-false-current">1</span> of ${totalQuestions}</span>
            </div>
             <div class="content-container">
                <div class="true-false-container">
                    <div class="true-false-statement" id="true-false-statement">Loading statement...</div>
                     <div id="true-false-image-container" class="true-false-image-container" style="display: none;">
                         <img id="true-false-image" src="" alt="True/False question image" class="true-false-image">
                    </div>
                    <div class="true-false-options">
                        <button id="true-button" class="btn btn-true">TRUE</button>
                        <button id="false-button" class="btn btn-false">FALSE</button>
                     </div>
                     <div class="true-false-feedback" id="true-false-feedback"></div>
                </div>
                 <div class="quiz-controls" style="justify-content: flex-end;">
                     <button id="true-false-next" class="btn btn-primary" style="display: none;">Next Question</button>
                 </div>
             </div>
             <button id="back-to-methods" class="btn" style="margin-top: 1.5rem;">Back to Methods</button>`;

         document.getElementById('true-button').addEventListener('click', () => selectAnswer(true));
         document.getElementById('false-button').addEventListener('click', () => selectAnswer(false));
        document.getElementById('true-false-next').addEventListener('click', nextQuestion);
        document.getElementById('back-to-methods').addEventListener('click', () => showMethodsView(currentModule));
        await loadQuestion(); // Load first question
     }


}); // End DOMContentLoaded
