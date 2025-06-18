'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/browser';

export function AuthForm() {
  const supabase = createClient();

  return (
    <div className="w-full max-w-md">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#1DB954',
                brandAccent: '#1ed760',
                defaultButtonBackground: '#191414',
                defaultButtonBackgroundHover: '#1DB954',
                inputBackground: 'transparent',
                inputBorder: '#535353',
                inputBorderHover: '#B3B3B3',
                inputBorderFocus: '#1DB954',
              },
              space: {
                inputPadding: '12px 16px',
                buttonPadding: '12px 24px',
              },
              radii: {
                borderRadiusButton: '9999px',
                inputBorderRadius: '8px',
                buttonBorderRadius: '9999px',
              },
            },
          },
          className: {
            container: 'auth-container',
            label: 'text-spotify-gray-light text-sm font-medium mb-2',
            input: 'bg-spotify-black/50 text-white',
            button: 'font-semibold transition-all',
            anchor: 'text-spotify-green hover:text-spotify-green/80',
            message: 'text-red-500 text-sm',
          },
        }}
        localization={{
          variables: {
            sign_in: {
              email_label: 'メールアドレス',
              password_label: 'パスワード',
              button_label: 'ログイン',
              loading_button_label: 'ログイン中...',
              email_input_placeholder: 'your@email.com',
              password_input_placeholder: 'パスワードを入力',
              link_text: 'すでにアカウントをお持ちですか？ログイン',
            },
            sign_up: {
              email_label: 'メールアドレス',
              password_label: 'パスワード',
              button_label: 'アカウント作成',
              loading_button_label: '作成中...',
              email_input_placeholder: 'your@email.com',
              password_input_placeholder: '強力なパスワード',
              link_text: 'アカウントをお持ちでない方はこちら',
            },
            forgotten_password: {
              email_label: 'メールアドレス',
              button_label: 'パスワードリセット',
              loading_button_label: '送信中...',
              link_text: 'パスワードをお忘れですか？',
            },
          },
        }}
        providers={[]}
        redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}
      />
    </div>
  );
}