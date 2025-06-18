'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Package, Check, Link as LinkIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { DatabaseService } from '@/lib/services/database';
import { useRouter } from 'next/navigation';
import type { UserSupplementWithSupplement } from '@/types/database';

export default function MySuppsPage() {
  const { user, loading } = useSupabase();
  const router = useRouter();
  const [supplements, setSupplements] = useState<UserSupplementWithSupplement[]>([]);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSupplements = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const db = new DatabaseService();
      const userSupps = await db.getUserSupplements(user.id);
      setSupplements(userSupps);
      setSelectedSupplements(
        userSupps
          .filter((us) => us.is_selected)
          .map((us) => us.supplement_id)
      );
      setIsLoading(false);
    };

    if (!loading) {
      loadSupplements();
    }
  }, [user, loading]);

  const toggleSupplement = async (id: string) => {
    if (!user) return;

    const isSelected = selectedSupplements.includes(id);
    const newSelected = isSelected
      ? selectedSupplements.filter(suppId => suppId !== id)
      : [...selectedSupplements, id];
    
    setSelectedSupplements(newSelected);

    try {
      const db = new DatabaseService();
      await db.updateUserSupplement(user.id, id, {
        isSelected: !isSelected
      });
    } catch (error) {
      console.error('Failed to update supplement:', error);
      // エラー時は元に戻す
      setSelectedSupplements(selectedSupplements);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black flex items-center justify-center">
        <div className="text-spotify-gray-light">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-spotify-gray-light hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Button>
          </Link>
          <Link href="/simulation">
            <Button variant="spotify" className="gap-2">
              <Plus className="w-4 h-4" />
              購入シミュレーション
            </Button>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              MY SUPPS
            </h1>
            <p className="text-lg text-spotify-gray-light">
              あなたのサプリメントコレクション
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">所有サプリメント</h2>
              <p className="text-spotify-gray-light">
                {selectedSupplements.length}個選択中
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplements.map((userSupplement) => {
                const supplement = userSupplement.supplement;
                const isSelected = selectedSupplements.includes(supplement.id);
                
                return (
                  <Card 
                    key={supplement.id}
                    className={cn(
                      "relative overflow-hidden cursor-pointer transition-all duration-300",
                      isSelected 
                        ? "bg-pink/20 border-pink shadow-lg shadow-pink/20 scale-[1.02]" 
                        : "bg-spotify-gray-dark/50 border-spotify-gray hover:bg-spotify-gray-dark/70 grayscale"
                    )}
                    onClick={() => toggleSupplement(supplement.id)}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-pink rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className={cn(
                        "text-lg",
                        isSelected ? "text-white" : "text-spotify-gray-light"
                      )}>
                        {supplement.name_ja}
                      </CardTitle>
                      <CardDescription className={cn(
                        isSelected ? "text-pink-light" : "text-spotify-gray"
                      )}>
                        {supplement.brand}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={cn(
                        "w-full h-32 bg-spotify-black/30 rounded-lg flex items-center justify-center",
                        !isSelected && "opacity-50"
                      )}>
                        <Package className={cn(
                          "w-16 h-16",
                          isSelected ? "text-pink-light" : "text-spotify-gray"
                        )} />
                      </div>
                      {supplement.iherb_id && (
                        <p className={cn(
                          "text-xs mt-2",
                          isSelected ? "text-pink-light" : "text-spotify-gray"
                        )}>
                          iHerb: {supplement.iherb_id}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
            <CardHeader>
              <CardTitle className="text-white">サプリメントを追加</CardTitle>
              <CardDescription className="text-spotify-gray-light">
                新しいサプリメントをコレクションに追加しましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                URLから追加
              </Button>
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" />
                検索して追加
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}