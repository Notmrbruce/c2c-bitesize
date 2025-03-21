/**
 * Home page functionality for C2C Bitesize
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the home page
    initHome();
    
    /**
     * Initialize home page functionality
     */
    function initHome() {
        // Add animation classes to elements
        animateElements();
        
        // Set up any interactive elements
        setupInteractiveElements();
    }
    
    /**
     * Add entrance animation classes to elements
     */
    function animateElements() {
        // Stagger animations for feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            // Add animation with delay based on index
            card.style.animationDelay = `${0.1 * (index + 1)}s`;
            card.classList.add('fade-in');
        });
        
        // Animate hero content
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.classList.add('slide-up');
        }
        
        // Animate step items
        const stepItems = document.querySelectorAll('.step-item');
        stepItems.forEach((step, index) => {
            step.style.animationDelay = `${0.15 * (index + 1)}s`;
            step.classList.add('fade-in');
        });
    }
    
    /**
     * Set up any interactive elements on the home page
     */
    function setupInteractiveElements() {
        // Feature card hover effect
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.querySelector('.feature-icon').classList.add('pulse');
            });
            
            card.addEventListener('mouseleave', () => {
                card.querySelector('.feature-icon').classList.remove('pulse');
            });
        });
        
        // CTA button hover effect
        const ctaButtons = document.querySelectorAll('.hero-cta .btn');
        ctaButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.classList.add('btn-hover');
            });
            
            button.addEventListener('mouseleave', () => {
                button.classList.remove('btn-hover');
            });
        });
    }
});