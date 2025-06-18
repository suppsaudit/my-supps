'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NutrientChart } from '@/components/charts/nutrient-chart';
import { SimulationResult } from '@/types';
import { AlertCircle, CheckCircle2, Package, TrendingUp } from 'lucide-react';
import { formatNutrientAmount } from '@/lib/utils';

interface SimulationResultsProps {
  results: SimulationResult;
  onClear: () => void;
}

const supplementColors = [
  '#1DB954', // Spotify Green
  '#FF1493', // Pink
  '#00D9FF', // Cyan
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
];

export function SimulationResults({ results, onClear }: SimulationResultsProps) {
  const supplementsWithColors = results.supplements.map((supp, index) => ({
    id: supp.id,
    name: supp.nameJa,
    color: supplementColors[index % supplementColors.length]
  }));

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-spotify-green" />
              総合カバレッジ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-spotify-green">
              {results.coveragePercentage}%
            </div>
            <p className="text-sm text-spotify-gray-light mt-1">
              推奨摂取量に対する充足率
            </p>
          </CardContent>
        </Card>

        <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-pink" />
              選択サプリメント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink">
              {results.supplements.length}個
            </div>
            <p className="text-sm text-spotify-gray-light mt-1">
              分析中のサプリメント数
            </p>
          </CardContent>
        </Card>

        <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              {results.warnings.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-spotify-green" />
              )}
              摂取状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results.warnings.length > 0 ? (
                <span className="text-yellow-500">要確認</span>
              ) : (
                <span className="text-spotify-green">良好</span>
              )}
            </div>
            <p className="text-sm text-spotify-gray-light mt-1">
              {results.warnings.length > 0 
                ? `${results.warnings.length}件の注意事項`
                : '問題なし'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 警告表示 */}
      {results.warnings.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              注意事項
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-200 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 栄養素チャート */}
      <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
        <CardHeader>
          <CardTitle className="text-white">栄養素カバレッジチャート</CardTitle>
          <CardDescription className="text-spotify-gray-light">
            サプリメントが外枠を形成する革新的ビジュアライゼーション
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NutrientChart 
            nutrients={results.totalNutrients}
            supplements={supplementsWithColors}
            showRDAZones={true}
          />
        </CardContent>
      </Card>

      {/* 栄養素詳細 */}
      <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
        <CardHeader>
          <CardTitle className="text-white">栄養素詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.totalNutrients.map(nutrientData => (
              <div key={nutrientData.nutrient.id} className="border-b border-spotify-gray pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{nutrientData.nutrient.nameJa}</h4>
                  <span className={`text-sm font-semibold ${
                    nutrientData.coverage > 120 ? 'text-yellow-500' :
                    nutrientData.coverage >= 80 ? 'text-spotify-green' :
                    'text-spotify-gray-light'
                  }`}>
                    {Math.round(nutrientData.coverage)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-spotify-gray-light mb-2">
                  <span>
                    摂取量: {formatNutrientAmount(nutrientData.actualAmount, nutrientData.nutrient.unit)}
                  </span>
                  <span>
                    推奨量: {formatNutrientAmount(nutrientData.recommendedAmount, nutrientData.nutrient.unit)}
                  </span>
                </div>
                <div className="space-y-1">
                  {nutrientData.supplements.map(supp => {
                    const color = supplementsWithColors.find(s => s.id === supp.supplement.id)?.color;
                    return (
                      <div key={supp.supplement.id} className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-spotify-gray-light">
                          {supp.supplement.nameJa}: {formatNutrientAmount(supp.amount, nutrientData.nutrient.unit)} ({Math.round(supp.percentage)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={onClear} variant="outline" size="lg">
          シミュレーションをクリア
        </Button>
      </div>
    </div>
  );
}