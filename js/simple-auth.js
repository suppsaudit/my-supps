// Simple Authentication for Demo Mode
// Always use demo mode for easier access

// Demo user credentials
const DEMO_CREDENTIALS = {
    email: 'demo@example.com',
    password: 'demo123'
};

// Initialize simple auth
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Initializing simple auth...');
    
    // Force demo mode
    window.isDemo = true;
    
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // Login handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            console.log('🎭 Demo login attempt:', { email });
            
            if (email && password) {
                // Create demo user
                const demoUser = {
                    id: 'demo-user-1',
                    email: email,
                    created_at: new Date().toISOString()
                };
                
                localStorage.setItem('mockUser', JSON.stringify(demoUser));
                
                showMessage('login-message', 'ログイン成功！マイページに移動します...', false);
                
                setTimeout(() => {
                    const redirect = new URLSearchParams(window.location.search).get('redirect') || 'dashboard';
                    window.location.href = `${redirect}.html`;
                }, 1500);
            } else {
                showMessage('login-message', 'メールアドレスとパスワードを入力してください', true);
            }
        });
    }
    
    // Signup handler
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const passwordConfirm = document.getElementById('signup-password-confirm').value;
            
            console.log('🎭 Demo signup attempt:', { email });
            
            // Basic validation
            if (password !== passwordConfirm) {
                showMessage('signup-message', 'パスワードが一致しません', true);
                return;
            }
            
            if (password.length < 6) {
                showMessage('signup-message', 'パスワードは6文字以上にしてください', true);
                return;
            }
            
            if (email && password) {
                // Create demo user
                const demoUser = {
                    id: 'demo-user-1',
                    email: email,
                    created_at: new Date().toISOString()
                };
                
                localStorage.setItem('mockUser', JSON.stringify(demoUser));
                
                showMessage('signup-message', 'アカウント作成成功！マイページに移動します...', false);
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage('signup-message', 'メールアドレスとパスワードを入力してください', true);
            }
        });
    }
});

// Helper function to show messages
function showMessage(elementId, message, isError = false) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = 'auth-message';
        messageEl.classList.add(isError ? 'error' : 'success');
        messageEl.style.display = 'block';
    }
}

// Check if user is logged in
function getCurrentUser() {
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
        return JSON.parse(mockUser);
    }
    return null;
}

// Logout function
function logout() {
    localStorage.removeItem('mockUser');
    window.location.href = 'auth.html';
}

// Export functions
window.getCurrentUser = getCurrentUser;
window.logout = logout;