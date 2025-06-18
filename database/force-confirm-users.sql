-- 無料プラン対応: 新規ユーザーを強制確認済みにする
-- SQL Editor で実行

-- 1. 既存の未確認ユーザーを確認済みに変更
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. 結果確認
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

-- 3. トリガー作成（新規ユーザーを自動確認）
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガー適用
DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
CREATE TRIGGER auto_confirm_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auto_confirm_user();

-- 完了メッセージ
SELECT '🎉 メール確認を無効化しました（無料プラン対応）' as message;