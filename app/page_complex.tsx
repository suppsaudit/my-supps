'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Package, TrendingUp, BarChart3, User } from 'lucide-react';
import { UserHeader } from '@/components/layout/user-header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      <main className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-spotify-green">
            MY SUPPS
          </Link>
          <UserHeader />
        </header>
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              MY SUPPS
            </h1>
            <p className="text-xl md:text-2xl text-spotify-gray-light mb-12">
              iHerbパワーユーザーのための革新的サプリ管理
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/simulation">
                <Button size="lg" className="bg-spotify-green hover:bg-spotify-green/90 text-black font-bold px-8 py-4 text-lg">
                  <Package className="w-6 h-6 mr-2" />
                  購入シミュレーション
                </Button>
              </Link>
              <Link href="/my-supps">
                <Button size="lg" variant="outline" className="border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-black font-bold px-8 py-4 text-lg">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  MY SUPPS
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="bg-spotify-gray-dark/50 border-spotify-gray p-8 hover:border-spotify-green transition-colors">
              <div className="flex items-center mb-4">
                <Search className="w-8 h-8 text-spotify-green mr-3" />
                <h3 className="text-2xl font-bold text-white">スマート検索</h3>
              </div>
              <p className="text-spotify-gray-light mb-4">
                iHerb URLを貼り付けるだけで、サプリメント情報を自動取得
              </p>
              <div className="flex items-center text-spotify-green">
                <span className="font-medium">URLを入力 →</span>
              </div>
            </Card>

            <Card className="bg-spotify-gray-dark/50 border-spotify-gray p-8 hover:border-spotify-green transition-colors">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-8 h-8 text-spotify-green mr-3" />
                <h3 className="text-2xl font-bold text-white">革新的栄養チャート</h3>
              </div>
              <p className="text-spotify-gray-light mb-4">
                サプリメントが栄養素チャートの外枠を形成する革命的視覚化
              </p>
              <div className="flex items-center text-spotify-green">
                <span className="font-medium">チャートを確認 →</span>
              </div>
            </Card>

            <Card className="bg-spotify-gray-dark/50 border-spotify-gray p-8 hover:border-spotify-green transition-colors">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-8 h-8 text-spotify-green mr-3" />
                <h3 className="text-2xl font-bold text-white">購入シミュレーション</h3>
              </div>
              <p className="text-spotify-gray-light mb-4">
                最適なサプリメント組み合わせと購入タイミングを提案
              </p>
              <div className="flex items-center text-spotify-green">
                <span className="font-medium">シミュレーション開始 →</span>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8">今すぐ始めよう</h2>
            <p className="text-xl text-spotify-gray-light mb-12">
              あなたのサプリメント管理を次のレベルへ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-spotify-green hover:bg-spotify-green/90 text-black font-bold px-8 py-4 text-lg">
                  <User className="w-6 h-6 mr-2" />
                  アカウント作成
                </Button>
              </Link>
              <Link href="/nutrients">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black font-bold px-8 py-4 text-lg">
                  栄養素を探索
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}