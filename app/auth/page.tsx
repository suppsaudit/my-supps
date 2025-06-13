import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-spotify-gray-light hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              MY SUPPS
            </h1>
            <p className="text-lg text-spotify-gray-light">
              アカウントにログインして続ける
            </p>
          </div>

          <AuthForm />
        </div>
      </div>
    </div>
  );
}