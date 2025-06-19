// Dynamic Navigation Bar
// Collapses header when scrolling down, expands when scrolling up

class DynamicNavigation {
    constructor() {
        this.header = document.getElementById('main-header');
        
        if (!this.header) {
            console.error('❌ Dynamic Navigation: Header element not found!');
            return;
        }
        
        // console.log('✅ Dynamic Navigation: Initializing...');
        
        this.lastScrollY = window.scrollY;
        this.scrollThreshold = 50; // Reduced threshold for quicker response
        this.isCollapsed = false;
        
        this.init();
    }
    
    init() {
        // Add scroll event listener with throttling
        let ticking = false;
        
        // Try both window and document scroll events
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // Use only window scroll event to avoid duplicate handlers
        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Removed container scroll listener to avoid conflicts
        
        // Initialize state
        this.handleScroll();
    }
    
    handleScroll() {
        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - this.lastScrollY;
        
        // Only trigger changes if scroll is significant enough
        if (Math.abs(scrollDifference) < 5) {
            return;
        }
        
        // Debounce mechanism to prevent rapid state changes
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        this.scrollTimeout = setTimeout(() => {
            // console.log('🔍 Scroll:', { currentScrollY, scrollDifference, isCollapsed: this.isCollapsed });
            
            // Check if we're at the top of the page
            if (currentScrollY <= this.scrollThreshold) {
                this.expandHeader();
            }
            // Scrolling down
            else if (scrollDifference > 0 && currentScrollY > this.scrollThreshold) {
                this.collapseHeader();
            }
            // Scrolling up
            else if (scrollDifference < 0) {
                this.expandHeader();
            }
            
            this.lastScrollY = currentScrollY;
        }, 50); // 50ms debounce
    }
    
    collapseHeader() {
        if (!this.isCollapsed) {
            // console.log('📱 Collapsing header');
            this.header.classList.add('collapsed');
            this.isCollapsed = true;
        }
    }
    
    expandHeader() {
        if (this.isCollapsed) {
            // console.log('📱 Expanding header');
            this.header.classList.remove('collapsed');
            this.isCollapsed = false;
        }
    }
}

// Initialize immediately when script loads, not waiting for DOMContentLoaded
(function initNavigation() {
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupNavigation);
    } else {
        // DOM is already loaded, initialize immediately
        setupNavigation();
    }
    
    function setupNavigation() {
        // console.log('🚀 Setting up Dynamic Navigation...');
        const nav = new DynamicNavigation();
        
        // Store navigation instance globally for debugging
        window._dynamicNav = nav;
        
        // Remove test button for production
        // Uncomment below to add test button
        /*
        const testBtn = document.createElement('button');
        testBtn.textContent = 'Test Collapse';
        testBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: #ff1493; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;';
        testBtn.onclick = () => {
            if (nav.header) {
                nav.header.classList.toggle('collapsed');
                console.log('🧪 Test toggle:', nav.header.classList.contains('collapsed'));
            }
        };
        document.body.appendChild(testBtn);
        */
    }
})();