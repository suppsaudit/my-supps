-- クイック認証テスト
-- Supabase SQL Editorで実行

-- 1. 認証テーブルの存在確認
SELECT 'auth.users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
            THEN '✅ 存在' 
            ELSE '❌ なし' 
       END as status
UNION ALL
SELECT 'public.user_supplements',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_supplements') 
            THEN '✅ 存在' 
            ELSE '❌ なし' 
       END;

-- 2. サンプルデータの確認
SELECT 'supplements count' as check_name, COUNT(*)::text as result FROM supplements
UNION ALL
SELECT 'nutrients count', COUNT(*)::text FROM nutrients;

-- 3. RLSの確認
SELECT 'RLS on user_supplements' as check_name,
       CASE WHEN rowsecurity THEN '✅ 有効' ELSE '❌ 無効' END as result
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_supplements';

-- 完了メッセージ
SELECT '🎉 認証設定準備完了！auth.htmlでテストしてください' as message;