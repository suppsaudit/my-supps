// User Avatar Dropdown Component
class UserAvatar {
    constructor() {
        this.currentUser = null;
        this.avatarContainer = null;
        this.dropdown = null;
        this.isDropdownOpen = false;
        
        this.init();
    }
    
    async init() {
        console.log('UserAvatar: Starting initialization');
        await this.waitForAuth();
        console.log('UserAvatar: Auth ready, current user:', this.currentUser);
        this.createAvatarElement();
        console.log('UserAvatar: Avatar element created');
        this.bindEvents();
        console.log('UserAvatar: Events bound');
        this.updateUserInfo();
        console.log('UserAvatar: User info updated');
    }
    
    async waitForAuth() {
        // Wait for Supabase client to be ready
        let attempts = 0;
        while (!window.supabaseClient && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.supabaseClient) {
            // Listen for auth state changes
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                this.currentUser = session?.user || null;
                this.updateUserInfo();
            });
            
            // Get current user
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            this.currentUser = user;
        }
    }
    
    createAvatarElement() {
        console.log('UserAvatar: Creating avatar element');
        // Find existing user-menu and replace it
        const existingUserMenu = document.getElementById('user-menu');
        console.log('UserAvatar: Found existing user menu:', existingUserMenu);
        if (!existingUserMenu) {
            console.error('UserAvatar: No user-menu element found!');
            return;
        }
        
        // Create avatar container
        this.avatarContainer = document.createElement('div');
        this.avatarContainer.className = 'user-avatar';
        this.avatarContainer.innerHTML = this.getAvatarHTML();
        console.log('UserAvatar: Avatar HTML:', this.avatarContainer.innerHTML);
        
        // Replace existing user menu
        existingUserMenu.parentNode.replaceChild(this.avatarContainer, existingUserMenu);
        
        // Get dropdown reference
        this.dropdown = this.avatarContainer.querySelector('.user-dropdown');
    }
    
    getAvatarHTML() {
        const userInitials = this.getUserInitials();
        const userEmail = this.currentUser?.email || '';
        
        return `
            <button class="avatar-button" id="avatar-button" aria-label="User menu">
                ${userInitials}
            </button>
            <div class="user-dropdown" id="user-dropdown">
                <div class="user-info">
                    <div class="user-email">${userEmail || 'Guest User'}</div>
                    <div class="user-status">
                        <span class="status-indicator"></span>
                        ${this.currentUser ? 'Online' : 'Not logged in'}
                    </div>
                </div>
                <ul class="dropdown-menu">
                    <li class="dropdown-item">
                        <a href="dashboard.html" class="dropdown-link">
                            <svg class="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                            ダッシュボード
                        </a>
                    </li>
                    <li class="dropdown-item">
                        <a href="my-supps.html" class="dropdown-link">
                            <svg class="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            MY SUPPS
                        </a>
                    </li>
                    <li class="dropdown-item">
                        <a href="supps-audit.html" class="dropdown-link">
                            <svg class="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Supps Audit
                        </a>
                    </li>
                    <li class="dropdown-item">
                        <a href="#" class="dropdown-link logout" onclick="userAvatar.logout()">
                            <svg class="dropdown-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
                            </svg>
                            ログアウト
                        </a>
                    </li>
                </ul>
            </div>
        `;
    }
    
    getUserInitials() {
        if (!this.currentUser?.email) return '?';
        
        const email = this.currentUser.email;
        const nameParts = email.split('@')[0].split(/[._-]/);
        
        if (nameParts.length >= 2) {
            return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        } else {
            return (nameParts[0][0] + (nameParts[0][1] || '')).toUpperCase();
        }
    }
    
    bindEvents() {
        if (!this.avatarContainer) return;
        
        const avatarButton = this.avatarContainer.querySelector('#avatar-button');
        
        if (avatarButton) {
            avatarButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.avatarContainer.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
    }
    
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.add('show');
        this.isDropdownOpen = true;
        
        // Focus management for accessibility
        const firstLink = this.dropdown.querySelector('.dropdown-link');
        if (firstLink) {
            firstLink.focus();
        }
    }
    
    closeDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.remove('show');
        this.isDropdownOpen = false;
    }
    
    updateUserInfo() {
        if (!this.avatarContainer) return;
        
        // Update avatar content
        const avatarButton = this.avatarContainer.querySelector('.avatar-button');
        const userEmailEl = this.avatarContainer.querySelector('.user-email');
        const userStatusEl = this.avatarContainer.querySelector('.user-status');
        
        if (avatarButton) {
            avatarButton.textContent = this.getUserInitials();
        }
        
        if (userEmailEl) {
            userEmailEl.textContent = this.currentUser?.email || 'Guest User';
        }
        
        if (userStatusEl) {
            const statusIndicator = userStatusEl.querySelector('.status-indicator');
            const statusText = userStatusEl.childNodes[2]; // Text node after indicator
            
            if (this.currentUser) {
                if (statusIndicator) statusIndicator.style.background = '#10b981';
                if (statusText) statusText.textContent = 'Online';
            } else {
                if (statusIndicator) statusIndicator.style.background = '#6b7280';
                if (statusText) statusText.textContent = 'Not logged in';
            }
        }
        
        // Show/hide logout option based on auth state
        const logoutLink = this.avatarContainer.querySelector('.logout');
        if (logoutLink) {
            logoutLink.style.display = this.currentUser ? 'flex' : 'none';
        }
    }
    
    async logout() {
        if (!window.supabaseClient || !this.currentUser) return;
        
        try {
            this.closeDropdown();
            
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            
            // Redirect to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('ログアウトに失敗しました。再試行してください。');
        }
    }
}

// Initialize user avatar when DOM is loaded
function initUserAvatar() {
    console.log('UserAvatar: DOM ready, checking for user-menu element');
    const userMenuEl = document.getElementById('user-menu');
    console.log('UserAvatar: User menu element found:', userMenuEl);
    
    if (userMenuEl) {
        console.log('UserAvatar: Initializing UserAvatar class');
        window.userAvatar = new UserAvatar();
    } else {
        console.warn('UserAvatar: No user-menu element found, retrying in 1 second');
        setTimeout(initUserAvatar, 1000);
    }
}

// Multiple initialization attempts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserAvatar);
} else {
    initUserAvatar();
}

// Fallback initialization
setTimeout(initUserAvatar, 2000);

// Export for external use
window.UserAvatar = UserAvatar;