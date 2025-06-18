import type { Supplement, NutrientData, SimulationResult } from '@/types';
import { calculatePersonalRDA, calculateCoverage } from '@/lib/utils';
import { mockSupplements, mockNutrients, mockSupplementNutrients } from '@/lib/mock-data';

export class SupplementAnalyzer {
  private supplements: Supplement[] = [];
  private userWeight: number = 60; // デフォルト体重

  constructor(userWeight?: number) {
    if (userWeight) this.userWeight = userWeight;
  }

  addSupplement(supplement: Supplement) {
    if (!this.supplements.find(s => s.id === supplement.id)) {
      this.supplements.push(supplement);
    }
  }

  removeSupplement(supplementId: string) {
    this.supplements = this.supplements.filter(s => s.id !== supplementId);
  }

  clearSupplements() {
    this.supplements = [];
  }

  setUserWeight(weight: number) {
    this.userWeight = weight;
  }

  analyze(): SimulationResult {
    const nutrientMap = new Map<string, NutrientData>();
    
    // 各栄養素の初期化
    mockNutrients.forEach(nutrient => {
      const rda = calculatePersonalRDA(nutrient, this.userWeight);
      nutrientMap.set(nutrient.id, {
        nutrient,
        actualAmount: 0,
        recommendedAmount: rda.upperBound || nutrient.rdaUpperMg || 0,
        coverage: 0,
        supplements: []
      });
    });

    // 各サプリメントの栄養素を集計
    this.supplements.forEach(supplement => {
      const supplementNutrients = mockSupplementNutrients.filter(
        sn => sn.supplementId === supplement.id
      );

      supplementNutrients.forEach(sn => {
        const nutrientData = nutrientMap.get(sn.nutrientId);
        if (nutrientData) {
          const amount = sn.amountPerServing * sn.bioavailabilityFactor;
          nutrientData.actualAmount += amount;
          nutrientData.supplements.push({
            supplement,
            amount,
            percentage: 0 // 後で計算
          });
        }
      });
    });

    // カバレッジと割合を計算
    let totalCoverage = 0;
    let nutrientCount = 0;
    const warnings: string[] = [];

    nutrientMap.forEach((data, nutrientId) => {
      const nutrient = mockNutrients.find(n => n.id === nutrientId);
      if (!nutrient) return;

      // カバレッジ計算
      data.coverage = calculateCoverage(data.actualAmount, data.recommendedAmount);
      
      if (data.coverage > 0) {
        totalCoverage += data.coverage;
        nutrientCount++;
      }

      // 各サプリメントの貢献度を計算
      data.supplements.forEach(supData => {
        supData.percentage = data.actualAmount > 0 
          ? (supData.amount / data.actualAmount) * 100 
          : 0;
      });

      // 過剰摂取の警告
      const rda = calculatePersonalRDA(nutrient, this.userWeight);
      if (data.actualAmount > (rda.upperBound || nutrient.rdaUpperMg || Infinity)) {
        warnings.push(
          `${nutrient.nameJa}が推奨上限を超えています（${Math.round(data.coverage)}%）`
        );
      }
    });

    const averageCoverage = nutrientCount > 0 ? totalCoverage / nutrientCount : 0;

    return {
      totalNutrients: Array.from(nutrientMap.values()).filter(n => n.actualAmount > 0),
      warnings,
      coveragePercentage: Math.round(averageCoverage),
      supplements: this.supplements
    };
  }

  // URLから商品情報を取得（モック実装）
  fetchSupplementFromUrl(url: string): Promise<Supplement | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // URLパターンマッチング
        const iherbMatch = url.match(/iherb\.com\/pr\/.*?\/(\w+-\d+)/);
        
        if (iherbMatch) {
          const iherbId = iherbMatch[1];
          // モックデータから検索
          const supplement = mockSupplements.find(s => s.iherbId === iherbId);
          if (supplement) {
            resolve(supplement);
            return;
          }
        }

        // デモ用：ランダムにサプリメントを返す
        if (url.includes('iherb.com') || url.includes('amazon')) {
          const randomIndex = Math.floor(Math.random() * mockSupplements.length);
          resolve(mockSupplements[randomIndex]);
          return;
        }

        resolve(null);
      }, 1000);
    });
  }
}