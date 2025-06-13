'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserHeader() {
  const { user, loading, supabase } = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-32 h-10 bg-spotify-gray/20 animate-pulse rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/auth">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="w-4 h-4" />
            ログイン
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/profile">
        <Button variant="ghost" size="sm" className="gap-2 text-spotify-gray-light hover:text-white">
          <Settings className="w-4 h-4" />
          設定
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleSignOut}
        className="gap-2 text-spotify-gray-light hover:text-white"
      >
        <LogOut className="w-4 h-4" />
        ログアウト
      </Button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-spotify-green/20 rounded-full">
        <User className="w-4 h-4 text-spotify-green" />
        <span className="text-sm text-spotify-green font-medium">
          {user.email?.split('@')[0]}
        </span>
      </div>
    </div>
  );
}