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
        document.querySelector('.nav-links a').addEventListener('click', (e) => {
            e.preventDefault();
            showModulesView();
        });
        
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Window scroll event for floating nav
        window.addEventListener('scroll', handleFloatingNavScroll);
    }
    
    function handleFloatingNavScroll() {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        
        if (st > lastScrollTop && st > 200) {
            // Scrolling down
            floatingNav.classList.add('hidden');
        } else {
            // Scrolling up
            floatingNav.classList.remove('hidden');
        }
        
        lastScrollTop = st <= 0 ? 0 : st;
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
        fetch('data/modules/index.json')
            .then(response => response.json())
            .then(modules => {
                modulesList.innerHTML = '';
                
                modules.forEach((module, index) => {
                    const moduleElement = document.createElement('div');
                    moduleElement.className = 'module-card';
                    moduleElement.innerHTML = `
                        <div class="module-number">${index + 1}</div>
                        <h3 class="module-title">${module.title}</h3>
                        <p class="module-desc">${module.description}</p>
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
        // Update UI
        modulesView.style.display = 'block';
        methodsView.style.display = 'none';
        contentView.style.display = 'none';
        
        // Update navigation
        document.querySelector('.nav-links a').classList.add('active');
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
    
    // The rest of the method implementations (loadFlashcards, loadQuiz, etc.) would remain the same as in the previous version
    // I'll omit them for brevity, but they would be identical to the previous implementation

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
