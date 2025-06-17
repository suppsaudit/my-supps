-- メール確認の問題を修正
-- Supabase SQL Editor で実行

-- 1. 既存の未確認ユーザーを確認状態に変更
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. 確認状況をチェック
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ 確認済み'
        ELSE '❌ 未確認'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- 3. 今後の新規ユーザー用の確認
SELECT 'メール確認設定を無効化してください' as instruction,
       'Authentication → Settings → Auth → Enable email confirmations: OFF' as action;

-- 完了メッセージ
SELECT '🎉 既存ユーザーのメール確認状態を修正しました' as message;