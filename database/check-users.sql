-- ユーザー状況確認
-- Supabase SQL Editor で実行

-- 1. 登録済みユーザーの確認
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ 確認済み'
        ELSE '❌ 未確認'
    END as email_status,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ アクティブ'
        ELSE '❌ 未アクティブ'
    END as user_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. ユーザー数の確認
SELECT COUNT(*) as total_users FROM auth.users;

-- 3. 確認設定の状況
SELECT 
    'Email confirmation required' as setting_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OFF (正しい設定)'
        ELSE 'ON (要修正)'
    END as status
FROM auth.users 
WHERE email_confirmed_at IS NULL AND created_at > NOW() - INTERVAL '1 day';

-- テスト指示
SELECT 
    '新規アカウント作成をテストしてください' as instruction,
    'newuser@example.com で登録してみてください' as action;