// Static Navigation Bar - No Dynamic Behavior
// Fixed navigation to prevent flickering and clicking issues

class StaticNavigation {
    constructor() {
        this.header = document.getElementById('main-header');
        
        if (!this.header) {
            console.error('❌ Navigation: Header element not found!');
            return;
        }
        
        console.log('✅ Static Navigation: Initialized');
        this.init();
    }
    
    init() {
        // Remove any existing collapsed class
        this.header.classList.remove('collapsed');
        
        // Ensure header is always visible and clickable
        this.header.style.position = 'sticky';
        this.header.style.top = '0';
        this.header.style.zIndex = '9999';
        this.header.style.transition = 'none';
        
        // Make sure navigation links are always clickable
        const navLinks = this.header.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.style.pointerEvents = 'auto';
            link.style.cursor = 'pointer';
        });
        
        console.log('✅ Navigation: Static mode enabled, no scroll behavior');
    }
}

// Initialize static navigation immediately
(function initNavigation() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new StaticNavigation();
        });
    } else {
        new StaticNavigation();
    }
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaticNavigation;
}