'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Beaker, Info } from 'lucide-react';
import { mockNutrients } from '@/lib/mock-data';
import { formatNutrientAmount } from '@/lib/utils';
import { useState } from 'react';

export default function NutrientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredNutrients = mockNutrients.filter(nutrient =>
    nutrient.nameJa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nutrient.nameEn && nutrient.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categoryLabels: Record<string, string> = {
    vitamin: 'ビタミン',
    mineral: 'ミネラル',
    adaptogen: 'アダプトゲン',
    'amino-acid': 'アミノ酸',
    'fatty-acid': '脂肪酸',
    other: 'その他'
  };

  const categoryColors: Record<string, string> = {
    vitamin: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    mineral: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    adaptogen: 'bg-green-500/20 text-green-400 border-green-500/50',
    'amino-acid': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    'fatty-acid': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
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

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              栄養素データベース
            </h1>
            <p className="text-lg text-spotify-gray-light">
              各栄養素の推奨摂取量と効果を確認
            </p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-spotify-gray-light" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="栄養素を検索..."
                className="w-full pl-12 pr-4 py-3 bg-spotify-black/50 border border-spotify-gray rounded-lg text-white placeholder-spotify-gray-light focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNutrients.map((nutrient) => (
              <Card 
                key={nutrient.id}
                className="bg-spotify-gray-dark/50 border-spotify-gray hover:bg-spotify-gray-dark/70 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{nutrient.nameJa}</CardTitle>
                      {nutrient.nameEn && (
                        <CardDescription className="text-spotify-gray-light">
                          {nutrient.nameEn}
                        </CardDescription>
                      )}
                    </div>
                    {nutrient.category && (
                      <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[nutrient.category]}`}>
                        {categoryLabels[nutrient.category]}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-spotify-gray-light mb-1">推奨摂取量（日本人成人）</p>
                      <div className="flex items-center gap-2">
                        <Beaker className="w-4 h-4 text-spotify-green" />
                        <span className="text-white">
                          {nutrient.rdaLowerMg && nutrient.rdaUpperMg ? (
                            <>
                              {formatNutrientAmount(nutrient.rdaLowerMg, nutrient.unit)} - {formatNutrientAmount(nutrient.rdaUpperMg, nutrient.unit)}
                            </>
                          ) : (
                            '情報なし'
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {nutrient.perKgLowerMg && nutrient.perKgUpperMg && (
                      <div>
                        <p className="text-sm text-spotify-gray-light mb-1">体重1kgあたり</p>
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-pink" />
                          <span className="text-white text-sm">
                            {formatNutrientAmount(nutrient.perKgLowerMg, nutrient.unit)}/kg - {formatNutrientAmount(nutrient.perKgUpperMg, nutrient.unit)}/kg
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNutrients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-spotify-gray-light text-lg">
                「{searchTerm}」に一致する栄養素が見つかりませんでした
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}