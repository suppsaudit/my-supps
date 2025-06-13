'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Link as LinkIcon, Package, X } from 'lucide-react';
import { SupplementAnalyzer } from '@/lib/services/supplement-analyzer';
import { SimulationResults } from '@/components/simulation/simulation-results';
import { useAppStore } from '@/lib/store';
import { Supplement, SimulationResult } from '@/types';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { DatabaseService } from '@/lib/services/database';
import { IHerbScraper } from '@/lib/services/iherb-scraper';

export default function SimulationPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyzer] = useState(() => new SupplementAnalyzer());
  const [selectedSupplements, setSelectedSupplements] = useState<Supplement[]>([]);
  const { simulationResults, setSimulationResults } = useAppStore();
  const { user } = useSupabase();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSupplements.length > 0) {
      analyzer.clearSupplements();
      selectedSupplements.forEach(supp => analyzer.addSupplement(supp));
      const results = analyzer.analyze();
      setSimulationResults(results);
    } else {
      setSimulationResults(null);
    }
  }, [selectedSupplements, analyzer, setSimulationResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const scraper = new IHerbScraper();
      const product = await scraper.fetchProductFromUrl(url);
      
      if (!product) {
        setError('商品情報を取得できませんでした。URLを確認してください。');
        return;
      }

      // データベースでサプリメントを検索または作成
      const db = new DatabaseService();
      let supplement = await db.searchSupplementsByUrl(url);
      
      if (!supplement) {
        // 新しいサプリメントを作成（実際には管理者権限が必要）
        // ここではモックデータを使用
        const mockSupplement = scraper.convertToSupplement(product);
        supplement = {
          id: product.id,
          ...mockSupplement,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Supplement;
      }

      if (!selectedSupplements.find(s => s.id === supplement.id)) {
        setSelectedSupplements([...selectedSupplements, supplement]);
        setUrl('');
        
        // ユーザーがログインしている場合、MY SUPPSに追加
        if (user) {
          try {
            await db.addUserSupplement(user.id, supplement.id);
          } catch (error) {
            console.log('サプリメントのライブラリへの追加に失敗:', error);
          }
        }
      }
    } catch (error) {
      console.error('サプリメントの取得に失敗しました:', error);
      setError('エラーが発生しました。しばらくしてから再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSupplement = (id: string) => {
    setSelectedSupplements(selectedSupplements.filter(s => s.id !== id));
  };

  const clearAll = () => {
    setSelectedSupplements([]);
    setSimulationResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-spotify-gray-light hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              購入シミュレーション
            </h1>
            <p className="text-lg text-spotify-gray-light">
              iHerbやAmazonのURLを入力して、栄養素カバレッジを即座に分析
            </p>
          </div>

          <Card className="bg-spotify-gray-dark/50 border-spotify-gray mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                商品URLを入力
              </CardTitle>
              <CardDescription className="text-spotify-gray-light">
                iHerb、Amazon、楽天などのサプリメント商品ページのURLを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://jp.iherb.com/pr/..."
                  className="w-full px-4 py-3 bg-spotify-black/50 border border-spotify-gray rounded-lg text-white placeholder-spotify-gray-light focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="spotify"
                  disabled={isLoading}
                >
                  {isLoading ? '分析中...' : '栄養素を分析'}
                </Button>
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {simulationResults ? (
            <SimulationResults results={simulationResults as SimulationResult} onClear={clearAll} />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-spotify-gray-dark/50 border-spotify-gray hover:bg-spotify-gray-dark/70 transition-all">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-spotify-green" />
                    分析済みサプリ
                  </CardTitle>
                  <CardDescription className="text-spotify-gray-light">
                    {selectedSupplements.length}個のサプリメントを選択中
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSupplements.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSupplements.map(supplement => (
                        <div 
                          key={supplement.id} 
                          className="flex items-center justify-between p-3 bg-spotify-black/30 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">{supplement.nameJa}</p>
                            <p className="text-xs text-spotify-gray-light">{supplement.brand}</p>
                          </div>
                          <button
                            onClick={() => removeSupplement(supplement.id)}
                            className="p-1 hover:bg-spotify-gray/30 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-spotify-gray-light hover:text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-spotify-gray-light text-center py-8">
                      まだサプリメントが選択されていません
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-spotify-gray-dark/50 border-spotify-gray hover:bg-spotify-gray-dark/70 transition-all">
                <CardHeader>
                  <CardTitle className="text-white">使い方</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-spotify-gray-light">
                  <p>1. 商品URLをコピー</p>
                  <p>2. 上のフォームに貼り付け</p>
                  <p>3. 分析ボタンをクリック</p>
                  <p>4. 複数商品を追加可能</p>
                  <p>5. 栄養素の重複や過剰摂取を確認</p>
                </CardContent>
              </Card>
            </div>

            )}

            <div className="mt-8 text-center">
              <Link href="/my-supps">
                <Button variant="outline" className="gap-2">
                  <Package className="w-4 h-4" />
                  MY SUPPSから選択
                </Button>
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}