// Supabase configuration
// 設定は config.js で管理されています

// Initialize Supabase client with error handling
let initializationPromise = null;

// 設定が読み込まれるまで待機
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
    // 既に初期化中または完了している場合はスキップ
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = (async () => {
        await waitForConfig();
        
        const config = window.APP_CONFIG.SUPABASE;
        
        try {
        // 実際のSupabase設定があるかチェック
        if (window.supabase && 
            config.URL !== 'https://your-project-ref.supabase.co' && 
            config.ANON_KEY !== 'your-anon-public-key-here') {
            
            // グローバルに一つのクライアントのみ作成
            if (!window.supabaseClient) {
                window.supabaseClient = window.supabase.createClient(config.URL, config.ANON_KEY);
            }
            window.isDemo = false;
            isDemo = false;
            console.log('✅ Supabase client initialized successfully');
            console.log('🚀 Production Mode - Connected to:', config.URL);
        } else {
            console.warn('⚠️ Supabase configuration is missing or placeholder. Running in demo mode.');
            
            // Load mock auth system for demo mode
            const script = document.createElement('script');
            script.src = 'js/mock-auth.js';
            script.onload = () => {
                window.supabaseClient = new window.MockSupabaseClient();
                window.isDemo = true;
                isDemo = true;
                console.log('🎭 Demo mode activated with mock authentication');
                
                // Update auth UI after initialization
                updateAuthUI();
            };
            document.head.appendChild(script);
        }
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        console.log('🎭 Falling back to demo mode');
        window.isDemo = true;
        isDemo = true;
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
    while (!window.supabaseClient && attempts < 50) { // Wait up to 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Use the shared client
    const client = window.supabaseClient;
    
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
    if (!window.supabaseClient) {
        console.warn('Supabase client not initialized');
        return;
    }
    try {
        const { error } = await window.supabaseClient.auth.signOut();
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
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session ? 'Logged in' : 'Logged out');
            updateAuthUI();
        });
    }
}

// Set up auth listener when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListener();
});

// APIレスポンス取得例
async function fetchSupplements() {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return;
    }
    const { data, error } = await window.supabaseClient
        .from('supplements')
        .select('*');
    console.log('APIレスポンス: supplements', { data, error });
    return { data, error };
}