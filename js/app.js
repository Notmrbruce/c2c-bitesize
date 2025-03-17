// Main application script
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modulesView = document.getElementById('modules-view');
    const methodsView = document.getElementById('methods-view');
    const contentView = document.getElementById('content-view');
    const modulesList = document.getElementById('modules-list');
    const selectedModuleTitle = document.getElementById('selected-module-title');
    const methodButtons = document.getElementById('method-buttons');
    const breadcrumbModule = document.getElementById('breadcrumb-module');
    const themeToggle = document.getElementById('theme-toggle');
    const floatingNav = document.querySelector('.floating-nav');
    
    // App state
    let currentModule = null;
    let lastScrollTop = 0;
    
    // Method descriptions and icons
    const methodInfo = {
        'flashcards': {
            description: 'Flip through digital cards to test your recall of key information. Tap or click to reveal the answer.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8"/><path d="M8 12h8"/></svg>'
        },
        'quiz': {
            description: 'Test your knowledge with multiple-choice questions and get immediate feedback on your answers.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        },
        'time-trial': {
            description: 'Race against the clock to match terms with their definitions. Challenge yourself to recall information quickly.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        },
        'true-false': {
            description: 'Determine whether statements are true or false and learn the reasoning behind each answer.',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        }
    };
    
    // Initialize the application
    init();
    
    // Setup Event Listeners
    setupEventListeners();
    
    // Functions
    function init() {
        loadModules();
        
        // Initially show only the modules view
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        
        // Add floating navbar scroll behavior
        handleFloatingNavScroll();
        
        // Add entrance animations
        animateElements();
    }
    
    function setupEventListeners() {
        // Home navigation
        document.querySelectorAll('.nav-links a')[0].addEventListener('click', (e) => {
            e.preventDefault();
            showModulesView();
        });
        
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Window scroll event for floating nav
        window.addEventListener('scroll', handleFloatingNavScroll);
    }
    
    function handleFloatingNavScroll() {
        window.addEventListener('scroll', () => {
            const st = window.pageYOffset || document.documentElement.scrollTop;
            
            if (st > lastScrollTop && st > 200) {
                // Scrolling down
                floatingNav.classList.add('hidden');
            } else {
                // Scrolling up
                floatingNav.classList.remove('hidden');
            }
            
            lastScrollTop = st <= 0 ? 0 : st;
        });
    }
    
    function animateElements() {
        // Add fade-in to elements with data-animate attribute
        const animateElements = document.querySelectorAll('[data-animate]');
        animateElements.forEach(el => {
            el.classList.add('fade-in');
        });
    }
    
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        
        // Update toggle icon based on theme
        if (document.body.classList.contains('light-theme')) {
            themeToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else {
            themeToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 20V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 4.93L6.34 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.66 17.66L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.34 17.66L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.07 4.93L17.66 6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
    }
    
    function loadModules() {
        // For testing, let's directly use the index.json content from the documents
        const modules = [
            {
                "id": "policies",
                "title": "Policies",
                "description": "Essential company policies, responsibility requirements, and regulations for safe operations"
            },
            {
                "id": "medical-requirements",
                "title": "Medical Requirements",
                "description": "Medical standards, requirements for glasses/medication, and drug screening procedures"
            },
            {
                "id": "preparation-for-duty",
                "title": "Preparation for Duty",
                "description": "Requirements for attending duty including documents, equipment, fitness standards, and roster management"
            },
            {
                "id": "signing-on-for-duty",
                "title": "Signing On For Duty",
                "description": "Procedures for signing on including safety critical license requirements, document checks, and readiness statement"
            },
            {
                "id": "leaving-duty",
                "title": "Leaving Duty",
                "description": "Procedures for ending your shift including reports submission and checking next duty"
            },
            {
                "id": "safety-security",
                "title": "Safety and Security",
                "description": "Essential protocols for handling accidents, incidents, suspicious activities, and maintaining operational safety"
            },
            {
                "id": "publications",
                "title": "Publications",
                "description": "Essential operational publications, their contents, and when they should be consulted by staff"
            },
            {
                "id": "notices",
                "title": "Notices",
                "description": "Various notice cases, their contents, importance, and durations"
            },
            {
                "id": "pts",
                "title": "Personal Track Safety (PTS)",
                "description": "Essential safety procedures, requirements, and protocols for working on or near the railway"
            }
        ];
        
        modulesList.innerHTML = '';
                
        modules.forEach((module) => {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'module-card';
            moduleElement.innerHTML = `
                <h3 class="module-title">${module.title}</h3>
                <p class="module-desc">${module.description}</p>
            `;
            
            moduleElement.addEventListener('click', () => {
                loadModule(module.id);
            });
            
            modulesList.appendChild(moduleElement);
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
        // Update UI
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        
        // Update navigation
        document.querySelectorAll('.nav-links a')[0].classList.add('active');
        breadcrumbModule.parentElement.classList.remove('active');
        breadcrumbModule.textContent = '';
        breadcrumbModule.href = '#';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function showMethodsView(moduleData) {
        // Update titles
        selectedModuleTitle.textContent = moduleData.title;
        
        // Update breadcrumb
        breadcrumbModule.textContent = moduleData.title;
        breadcrumbModule.parentElement.classList.add('active');
        
        // Create method buttons
        createMethodButtons(moduleData);
        
        // Show methods view, hide others
        modulesView.style.display = 'none';
        methodsView.style.display = 'block';
        contentView.style.display = 'none';
        
        // Update method description
        const methodDescriptionElement = document.getElementById('method-description');
        if (methodDescriptionElement) {
            methodDescriptionElement.textContent = 'Select a study method to begin';
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function createMethodButtons(moduleData) {
        methodButtons.innerHTML = '';
        
        moduleData.methods.forEach(method => {
            const button = document.createElement('button');
            button.className = 'method-button';
            button.id = `${method}-button`;
            
            // Get method info
            const info = methodInfo[method] || {
                description: `Learn with ${method}`,
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
            };
            
            const methodName = method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' ');
            
            button.innerHTML = `
                <div class="method-icon">${info.icon}</div>
                <div class="method-content">
                    <div class="method-title">${methodName}</div>
                    <div class="method-desc">${info.description}</div>
                </div>
            `;
            
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
        contentView.classList.add('slide-up');
        
        // Remove the animation class after animation completes
        setTimeout(() => {
            contentView.classList.remove('slide-up');
        }, 500);
        
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
                contentView.innerHTML = `<div class="content-container"><p>Study method "${method}" is not implemented yet.</p></div>`;
        }
        
        // Scroll to content view
        contentView.scrollIntoView({ behavior: 'smooth' });
    }
    
    function loadFlashcards(moduleData) {
        const flashcardsData = moduleData.content.flashcards;
        let currentCardIndex = 0;
        
        // Create flashcard container
        contentView.innerHTML = `
            <div class="content-header">
                <h2 class="content-title">${moduleData.title} - Flashcards</h2>
                <span class="progress-indicator">Card <span id="current-card-number">1</span> of ${flashcardsData.length}</span>
            </div>
            
            <div class="content-container">
                <div class="flashcard" id="current-flashcard">
                    <div class="card-indicator">Tap to flip</div>
                    <div class="flashcard-question">${flashcardsData[currentCardIndex].question}</div>
                    <div class="flashcard-answer">${flashcardsData[currentCardIndex].answer}</div>
                </div>
                
                <div class="card-controls">
                    <button id="prev-card" class="btn" ${currentCardIndex === 0 ? 'disabled' : ''}>
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        Previous
                    </button>
                    
                    <button id="flip-card" class="btn btn-primary">
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 15l5 5 5-5"/>
                            <path d="M12 20V4"/>
                        </svg>
                        Flip Card
                    </button>
                    
                    <button id="next-card" class="btn" ${currentCardIndex === flashcardsData.length - 1 ? 'disabled' : ''}>
                        Next
                        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <button id="back-to-methods" class="btn">
                <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Methods
            </button>
        `;
        
        // Add event listeners
        const flashcardElement = document.getElementById('current-flashcard');
        const prevButton = document.getElementById('prev-card');
        const nextButton = document.getElementById('next-card');
        const flipButton = document.getElementById('flip-card');
        const backButton = document.getElementById('back-to-methods');
        const cardNumberElement = document.getElementById('current-card-number');
        const cardIndicator = document.querySelector('.card-indicator');
        
        // Check if using mobile device to update card indicator text
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            cardIndicator.textContent = "Tap to flip";
        } else {
            cardIndicator.textContent = "Click to flip";
        }
        
        flashcardElement.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
            
            // Update card indicator text when flipped
            if (flashcardElement.classList.contains('flipped')) {
                cardIndicator.textContent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                    ? "Tap to return" 
                    : "Click to return";
            } else {
                cardIndicator.textContent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                    ? "Tap to flip"
                    : "Click to flip";
            }
        });
        
        flipButton.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
            
            // Update card indicator text when flipped via button
            if (flashcardElement.classList.contains('flipped')) {
                cardIndicator.textContent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                    ? "Tap to return" 
                    : "Click to return";
            } else {
                cardIndicator.textContent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                    ? "Tap to flip"
                    : "Click to flip";
            }
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
            
            // Reset card indicator text
            cardIndicator.textContent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                ? "Tap to flip"
                : "Click to flip";
            
            // Update card number
            cardNumberElement.textContent = currentCardIndex + 1;
            
            // Update button states
            prevButton.disabled = currentCardIndex === 0;
            nextButton.disabled = currentCardIndex === flashcardsData.length - 1;
        }
    }
    
    // Other methods remain the same...
    // Quiz, time trial, and true-false implementations would follow
    
    // Helper function to shuffle an array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
});