// Wait for Supabase client to be initialized
let supabaseReady = false;

// Initialize Supabase client - 共通のクライアントを使用
async function initializeAuth() {
    // Wait for the main supabase client to be initialized
    let attempts = 0;
    while ((!window.supabaseClient && !window.isDemo) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (window.supabaseClient || window.isDemo) {
        // 既存の共通クライアントを使用
        window.supabase = window.supabaseClient || window.supabase;
        supabaseReady = true;
        console.log('✅ Using shared Supabase client for auth');
    } else {
        console.error('❌ Supabase client not available');
    }
}

// Google OAuth redirect URL
const redirectUrl = window.location.origin + (window.location.pathname.includes('/my-supps-web/') ? '/my-supps-web/auth.html' : '/auth.html');

// Tab switching
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Show message
function showMessage(elementId, message, isError = false) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = 'auth-message';
    messageEl.classList.add(isError ? 'error' : 'success');
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Auth page loading...');
    
    // Initialize authentication first
    await initializeAuth();
    
    // Setup login form handler
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!supabaseReady || !window.supabase) {
            showMessage('login-message', 'サービスが初期化されていません。ページを再読み込みしてください。', true);
            console.error('Supabase not ready for login:', { supabaseReady, supabase: !!window.supabase });
            return;
        }
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            showMessage('login-message', 'ログインしました！', false);
            
            // Redirect to My Supps page after successful login
            setTimeout(() => {
                window.location.href = 'my-supps.html';
            }, 1000);
            
        } catch (error) {
            showMessage('login-message', 'ログインに失敗しました: ' + error.message, true);
        }
    });
    
    // Setup signup form handler
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!supabaseReady || !window.supabase) {
            showMessage('signup-message', 'サービスが初期化されていません。ページを再読み込みしてください。', true);
            console.error('Supabase not ready for signup:', { supabaseReady, supabase: !!window.supabase });
            return;
        }
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-password-confirm').value;
        
        // Password validation
        if (password !== passwordConfirm) {
            showMessage('signup-message', 'パスワードが一致しません', true);
            return;
        }
        
        if (password.length < 8) {
            showMessage('signup-message', 'パスワードは8文字以上にしてください', true);
            return;
        }
        
        try {
            console.log('🔄 Creating account...');
            const { data, error } = await window.supabase.auth.signUp({
                email,
                password
            });
            
            if (error) throw error;
            
            console.log('✅ Account created:', data);
            showMessage('signup-message', 'アカウントを作成しました！マイページに移動します...', false);
            
            // 即座にマイページに遷移
            setTimeout(() => {
                window.location.href = 'my-supps.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Signup error:', error);
            showMessage('signup-message', '登録に失敗しました: ' + error.message, true);
        }
    });
    
    console.log('✅ Auth page initialized');
});

// Google Sign In
async function signInWithGoogle() {
    try {
        // Check if Google OAuth is configured
        if (!window.APP_CONFIG.FEATURES.GOOGLE_OAUTH) {
            throw new Error('Google OAuthが有効化されていません。管理者にお問い合わせください。');
        }
        
        // Check if Supabase is initialized
        if (!supabaseReady || !window.supabase) {
            throw new Error('認証サービスが初期化されていません');
        }
        
        if (!window.supabase.auth) {
            throw new Error('認証モジュールが利用できません');
        }
        
        console.log('Starting Google OAuth with redirect URL:', redirectUrl);
        
        const { data, error } = await window.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
        
        if (error) throw error;
        
        // The user will be redirected to Google for authentication
        console.log('Redirecting to Google OAuth...');
        
    } catch (error) {
        console.error('Google sign in error:', error);
        // Show error in the active form
        const activeForm = document.querySelector('.auth-form.active');
        const messageId = activeForm.id === 'login-form' ? 'login-message' : 'signup-message';
        showMessage(messageId, 'Googleログインエラー: ' + error.message, true);
    }
}

// Check for OAuth callback on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication
    await initializeAuth();
    
    // Check if we're returning from an OAuth redirect
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken && supabaseReady) {
        // User successfully authenticated with Google
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            
            if (user) {
                console.log('OAuth success, redirecting to My Supps');
                // Redirect to My Supps page
                window.location.href = 'my-supps.html';
            }
        } catch (error) {
            console.error('Error getting user after OAuth:', error);
        }
    }
});