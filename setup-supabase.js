#!/usr/bin/env node
// Supabase設定確認・更新スクリプト

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

async function updateSupabaseConfig() {
    console.log('🚀 MY SUPPS - Supabase設定ウィザード\n');
    
    // Step 1: Supabase情報の入力
    console.log('1. Supabaseプロジェクト情報を入力してください：');
    const supabaseUrl = await question('Project URL (例: https://abcdefgh.supabase.co): ');
    const supabaseKey = await question('Anon Public Key: ');
    
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ URL と API Key の両方が必要です。');
        process.exit(1);
    }
    
    // Step 2: ファイル更新
    console.log('\n2. 設定ファイルを更新中...');
    
    try {
        // .env.local更新
        const envPath = path.join(__dirname, '.env.local');
        const envContent = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# iHerb API (if available)
IHERB_API_KEY=demo_key

# Other APIs
AMAZON_API_KEY=demo_key

# Rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env.local を更新しました');
        
        // supabase-client.js更新
        const supabaseClientPath = path.join(__dirname, 'my-supps-web/js/supabase-client.js');
        if (fs.existsSync(supabaseClientPath)) {
            let clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
            
            // URL更新
            clientContent = clientContent.replace(
                /const SUPABASE_URL = '[^']*';/,
                `const SUPABASE_URL = '${supabaseUrl}';`
            );
            
            // Key更新
            clientContent = clientContent.replace(
                /const SUPABASE_ANON_KEY = '[^']*';/,
                `const SUPABASE_ANON_KEY = '${supabaseKey}';`
            );
            
            fs.writeFileSync(supabaseClientPath, clientContent);
            console.log('✅ supabase-client.js を更新しました');
        }
        
        // Step 3: 次のステップの案内
        console.log('\n3. 次に実行してください：');
        console.log('   a) Supabaseダッシュボードで SQL Editor を開く');
        console.log('   b) my-supps-web/database/schema-update-dashboard.sql の内容を実行');
        console.log('   c) サンプルデータを投入（SUPABASE_SETUP.md参照）');
        console.log('   d) ブラウザでアプリを開いてテスト');
        
        console.log('\n🎉 設定完了！デモモードが無効になり、実際のSupabaseに接続されます。');
        
    } catch (error) {
        console.error('❌ ファイル更新エラー:', error.message);
        process.exit(1);
    }
    
    rl.close();
}

// 設定状況確認
function checkCurrentConfig() {
    console.log('📋 現在の設定状況：\n');
    
    // .env.local確認
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
        const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
        
        if (urlMatch && urlMatch[1] !== 'https://demo.supabase.co') {
            console.log('✅ .env.local: 設定済み');
            console.log(`   URL: ${urlMatch[1]}`);
        } else {
            console.log('❌ .env.local: デモ設定のままです');
        }
    } else {
        console.log('❌ .env.local: ファイルが存在しません');
    }
    
    // supabase-client.js確認
    const clientPath = path.join(__dirname, 'my-supps-web/js/supabase-client.js');
    if (fs.existsSync(clientPath)) {
        const clientContent = fs.readFileSync(clientPath, 'utf8');
        if (clientContent.includes('your-project-ref.supabase.co')) {
            console.log('❌ supabase-client.js: プレースホルダーのままです');
        } else {
            console.log('✅ supabase-client.js: 設定済み');
        }
    } else {
        console.log('❌ supabase-client.js: ファイルが存在しません');
    }
    
    // schema-update-dashboard.sql確認
    const schemaPath = path.join(__dirname, 'my-supps-web/database/schema-update-dashboard.sql');
    if (fs.existsSync(schemaPath)) {
        console.log('✅ schema-update-dashboard.sql: 存在します');
    } else {
        console.log('❌ schema-update-dashboard.sql: ファイルが存在しません');
    }
    
    console.log('');
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--check')) {
        checkCurrentConfig();
        return;
    }
    
    if (args.includes('--help')) {
        console.log(`
Supabase設定スクリプト

使用方法:
  node setup-supabase.js           設定ウィザードを実行
  node setup-supabase.js --check   現在の設定状況を確認
  node setup-supabase.js --help    このヘルプを表示

詳細な手順は SUPABASE_SETUP.md を参照してください。
        `);
        return;
    }
    
    checkCurrentConfig();
    
    const proceed = await question('設定を更新しますか？ (y/N): ');
    if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
        await updateSupabaseConfig();
    } else {
        console.log('設定更新をキャンセルしました。');
        rl.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}