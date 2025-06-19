// Production Supabase client initialization
// NEVER use demo mode - always connect to real database

let supabase = null;
let initializationPromise = null;

function waitForConfig() {
    return new Promise((resolve) => {
        if (window.APP_CONFIG) {
            resolve();
        } else {
            const checkConfig = () => {
                if (window.APP_CONFIG) {
                    resolve();
                } else {
                    setTimeout(checkConfig, 100);
                }
            };
            checkConfig();
        }
    });
}

async function initializeSupabase() {
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = (async () => {
        await waitForConfig();
        
        const config = window.APP_CONFIG.SUPABASE;
        
        // Validate configuration
        if (config.URL === 'https://your-project-ref.supabase.co' || 
            config.ANON_KEY === 'your-anon-public-key-here') {
            console.error('❌ CRITICAL: Supabase configuration contains placeholder values');
            console.error('❌ Real Supabase credentials required in js/config.js');
            throw new Error('Production Supabase configuration required');
        }

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.error('❌ CRITICAL: Supabase SDK not available');
            throw new Error('Supabase SDK not loaded');
        }

        try {
            // Create single global Supabase client
            if (!window.supabaseClient) {
                window.supabaseClient = window.supabase.createClient(config.URL, config.ANON_KEY);
                console.log('✅ Production Supabase client initialized');
                console.log('🚀 Connected to:', config.URL);
            }
            
            supabase = window.supabaseClient;
            window.isDemo = false;
            
            // Test connection
            const { data, error } = await supabase.from('supplements').select('count', { count: 'exact', head: true });
            if (error && error.code !== 'PGRST116') {
                console.warn('⚠️ Database connection issue:', error.message);
            } else {
                console.log('✅ Database connection verified');
            }
            
        } catch (error) {
            console.error('❌ CRITICAL: Supabase initialization failed:', error);
            throw error;
        }
    })();
    
    return initializationPromise;
}

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();
});

// Auth state management
async function checkAuth() {
    // Wait for initialization if needed
    let attempts = 0;
    while ((!window.supabaseClient && !supabase) && attempts < 50) { // Wait up to 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Use the shared client
    const client = window.supabaseClient || supabase;
    
    if (!client) {
        console.warn('Supabase client not initialized after waiting');
        return null;
    }
    
    try {
        const { data: { user } } = await client.auth.getUser();
        console.log('checkAuth result:', user ? 'User found' : 'No user');
        return user;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Update navigation based on auth state
async function updateAuthUI() {
    const user = await checkAuth();
    const userMenu = document.getElementById('user-menu');
    
    if (!userMenu) return;
    
    if (user) {
        userMenu.innerHTML = `
            <div class="user-menu-content">
                <a href="my-supps.html" class="nav-link">My Supps</a>
                <button onclick="logout()" class="btn-logout">ログアウト</button>
            </div>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="auth.html" class="btn btn-primary btn-small">ログイン</a>
        `;
    }
}

// Logout function
async function logout() {
    if (!supabase) {
        console.warn('Supabase client not initialized');
        return;
    }
    try {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

// Listen for auth state changes after initialization
async function setupAuthListener() {
    await initializationPromise;
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session ? 'Logged in' : 'Logged out');
            updateAuthUI();
        });
    }
}

// Set up auth listener when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListener();
});