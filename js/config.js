// MY SUPPS Configuration
// このファイルでアプリケーションの設定を管理します

window.APP_CONFIG = {
    // Supabase設定
    SUPABASE: {
        URL: 'https://xkcaxrvnvefstzvpldzf.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2F4cnZudmVmc3R6dnBsZHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc3ODYsImV4cCI6MjA2NTY0Mzc4Nn0.KPI-586rKSlcGTi9o2YWR1n1pxfaqoPaPouclCu6Q5I'
    },
    
    // サイト設定
    SITE: {
        URL: window.location.protocol === 'file:' ? window.location.origin : 'http://localhost:3000',
        NAME: 'MY SUPPS',
        DESCRIPTION: 'サプリメントをData Drivenに管理するなら。'
    },
    
    // API設定
    APIs: {
        // NIH DSLD API（CC0ライセンス）
        DSLD: {
            BASE_URL: 'https://dsld.od.nih.gov/dsld/api',
            ENABLED: true
        },
        
        // NIH ODS API（栄養素RDA/UL値）
        ODS: {
            CSV_URL: 'https://cdn1.genspark.ai/user-upload-image/jupyter/toolu_01GD6z1fc7X1hXkndv7fk8TJ/output/NIH_Comprehensive_Supplement_Database_70_Nutrients.csv',
            ENABLED: true
        },
        
        // Barcode Lookup API（製品画像取得）
        BARCODE: {
            BASE_URL: 'https://api.barcodelookup.com/v3/products',
            API_KEY: 'YOUR_API_KEY_HERE', // 実際のAPIキーに置き換え
            ENABLED: false // APIキーが設定されるまで無効
        }
    },
    
    // レート制限
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 60
    },
    
    // デバッグ設定
    DEBUG: {
        ENABLED: true, // 本番環境では false に設定
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
        SHOW_DEMO_NOTIFICATION: true
    },
    
    // 機能フラグ
    FEATURES: {
        GOOGLE_OAUTH: false, // 無料プランでは利用不可
        IMAGE_UPLOAD: false,
        ADVANCED_ANALYTICS: false,
        EXPORT_DATA: true
    },
    
    // デフォルト設定
    DEFAULTS: {
        LANGUAGE: 'ja',
        TIMEZONE: 'Asia/Tokyo',
        CURRENCY: 'JPY'
    }
};

// 設定検証関数
window.validateConfig = function() {
    const config = window.APP_CONFIG;
    const issues = [];
    
    // Supabase設定チェック
    if (config.SUPABASE.URL === 'https://your-project-ref.supabase.co') {
        issues.push('Supabase URLが設定されていません');
    }
    
    if (config.SUPABASE.ANON_KEY === 'your-anon-public-key-here') {
        issues.push('Supabase API Keyが設定されていません');
    }
    
    // API設定チェック
    if (config.APIs.BARCODE.ENABLED && config.APIs.BARCODE.API_KEY === 'YOUR_API_KEY_HERE') {
        issues.push('Barcode Lookup APIが有効ですがAPIキーが設定されていません');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues
    };
};

// 設定初期化（ページロード時）
document.addEventListener('DOMContentLoaded', function() {
    const validation = window.validateConfig();
    
    if (window.APP_CONFIG.DEBUG.ENABLED) {
        console.log('🔧 APP CONFIG:', window.APP_CONFIG);
        console.log('✅ Config Validation:', validation);
        
        if (!validation.isValid) {
            console.warn('⚠️ Configuration Issues:', validation.issues);
            
            // デモモード判定
            if (validation.issues.some(issue => issue.includes('Supabase'))) {
                console.log('🎭 Running in Demo Mode');
                window.isDemo = true;
                
                if (window.APP_CONFIG.DEBUG.SHOW_DEMO_NOTIFICATION) {
                    setTimeout(() => {
                        showDemoNotification();
                    }, 1000);
                }
            }
        } else {
            console.log('🚀 Production Mode - Supabase Connected');
            window.isDemo = false;
        }
    }
});

// デモモード通知表示
function showDemoNotification() {
    if (document.body) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: #f59e0b; color: white; padding: 12px 20px; border-radius: 8px; z-index: 9999; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 300px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>📌</span>
                    <div>
                        <div style="font-size: 14px;">デモモード</div>
                        <div style="font-size: 12px; opacity: 0.9;">実際のデータベースには接続されていません</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: auto;">×</button>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // 10秒後に自動で非表示
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
}

// 設定更新用ヘルパー関数
window.updateSupabaseConfig = function(url, anonKey) {
    window.APP_CONFIG.SUPABASE.URL = url;
    window.APP_CONFIG.SUPABASE.ANON_KEY = anonKey;
    
    console.log('✅ Supabase設定を更新しました');
    
    // ページリロードを推奨
    const reload = confirm('設定を反映するためにページをリロードしますか？');
    if (reload) {
        window.location.reload();
    }
};