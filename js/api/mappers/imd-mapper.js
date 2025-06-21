// IMD Data Mapper Implementation

class IMDMapper {
    static mapToUnified(imdData) {
        if (!imdData) {
            console.warn('⚠️ IMD data is null or undefined');
            return null;
        }
        
        const product = new SupplementProduct();
        
        // Basic information
        product.id = imdData.識別子 || imdData.id || '';
        product.name = imdData.名称 || imdData.商品名 || '';
        product.brand = imdData.メーカー名 || imdData.ブランド || '';
        product.identifier = imdData.JANコード || imdData.識別子 || '';
        
        // Serving information
        product.servingSize = this.formatServingSize(imdData);
        product.container = imdData.見当 || imdData.内容量 || '';
        
        // Images
        product.images = {
            thumbnail: imdData.フードサンプル写真 || imdData.商品画像URL || '',
            label: imdData.栄養成分表示画像 || imdData.フードサンプル写真 || ''
        };
        
        // Nutrition facts
        product.nutritionFacts = this.mapNutritionFacts(imdData);
        
        // Usage information
        product.usage = {
            servingAmount: imdData.見当 || imdData.一回あたり || '',
            instructions: imdData.摂取方法 || imdData.お召し上がり方 || '',
            warnings: this.extractWarnings(imdData)
        };
        
        // Metadata
        product.region = 'JP';
        product.source = 'IMD';
        
        console.log(`✅ Mapped IMD product: ${product.name}`);
        return product;
    }
    
    static formatServingSize(imdData) {
        if (imdData.分量) {
            return `${imdData.分量}g`;
        }
        if (imdData.一回あたり) {
            return imdData.一回あたり;
        }
        if (imdData.見当) {
            return imdData.見当;
        }
        return '1回分';
    }
    
    static extractWarnings(imdData) {
        const warnings = [];
        
        if (imdData.注意事項) {
            if (Array.isArray(imdData.注意事項)) {
                warnings.push(...imdData.注意事項);
            } else {
                warnings.push(imdData.注意事項);
            }
        }
        
        if (imdData.アレルギー物質) {
            warnings.push(`アレルギー物質: ${imdData.アレルギー物質}`);
        }
        
        return warnings;
    }
    
    static mapNutritionFacts(imdData) {
        const facts = [];
        
        // エネルギー
        if (imdData.エネルギー !== undefined && imdData.エネルギー !== null) {
            facts.push(new NutritionFact('エネルギー', imdData.エネルギー, 'kcal'));
        }
        
        // 三大栄養素
        const macronutrients = [
            { key: 'たんぱく質', name: 'たんぱく質', unit: 'g' },
            { key: '脂質', name: '脂質', unit: 'g' },
            { key: '炭水化物', name: '炭水化物', unit: 'g' },
            { key: '食物繊維', name: '食物繊維', unit: 'g' },
            { key: '糖質', name: '糖質', unit: 'g' }
        ];
        
        macronutrients.forEach(nutrient => {
            if (imdData[nutrient.key] !== undefined && imdData[nutrient.key] !== null) {
                facts.push(new NutritionFact(nutrient.name, imdData[nutrient.key], nutrient.unit));
            }
        });
        
        // ビタミン類
        const vitamins = [
            { key: 'ビタミンA', name: 'ビタミンA', unit: 'μg' },
            { key: 'ビタミンB1', name: 'ビタミンB1', unit: 'mg' },
            { key: 'ビタミンB2', name: 'ビタミンB2', unit: 'mg' },
            { key: 'ビタミンB6', name: 'ビタミンB6', unit: 'mg' },
            { key: 'ビタミンB12', name: 'ビタミンB12', unit: 'μg' },
            { key: 'ビタミンC', name: 'ビタミンC', unit: 'mg' },
            { key: 'ビタミンD', name: 'ビタミンD', unit: 'μg' },
            { key: 'ビタミンE', name: 'ビタミンE', unit: 'mg' },
            { key: 'ビタミンK', name: 'ビタミンK', unit: 'μg' },
            { key: '葉酸', name: '葉酸', unit: 'μg' },
            { key: 'ナイアシン', name: 'ナイアシン', unit: 'mg' },
            { key: 'パントテン酸', name: 'パントテン酸', unit: 'mg' },
            { key: 'ビオチン', name: 'ビオチン', unit: 'μg' }
        ];
        
        vitamins.forEach(vitamin => {
            if (imdData[vitamin.key] !== undefined && imdData[vitamin.key] !== null) {
                facts.push(new NutritionFact(vitamin.name, imdData[vitamin.key], vitamin.unit));
            }
        });
        
        // ミネラル類
        const minerals = [
            { key: 'カルシウム', name: 'カルシウム', unit: 'mg' },
            { key: '鉄', name: '鉄', unit: 'mg' },
            { key: '亜鉛', name: '亜鉛', unit: 'mg' },
            { key: 'カリウム', name: 'カリウム', unit: 'mg' },
            { key: 'マグネシウム', name: 'マグネシウム', unit: 'mg' },
            { key: 'ナトリウム', name: 'ナトリウム', unit: 'mg' },
            { key: 'リン', name: 'リン', unit: 'mg' },
            { key: '銅', name: '銅', unit: 'mg' },
            { key: 'マンガン', name: 'マンガン', unit: 'mg' },
            { key: 'セレン', name: 'セレン', unit: 'μg' },
            { key: 'クロム', name: 'クロム', unit: 'μg' },
            { key: 'モリブデン', name: 'モリブデン', unit: 'μg' },
            { key: 'ヨウ素', name: 'ヨウ素', unit: 'μg' }
        ];
        
        minerals.forEach(mineral => {
            if (imdData[mineral.key] !== undefined && imdData[mineral.key] !== null) {
                facts.push(new NutritionFact(mineral.name, imdData[mineral.key], mineral.unit));
            }
        });
        
        // 特殊成分
        const specialComponents = [
            { key: 'n-3ドコサヘキサエン酸(DHA)', name: 'DHA', unit: 'mg' },
            { key: 'n-3イコサペンタエン酸', name: 'EPA', unit: 'mg' },
            { key: 'コエンザイムQ10', name: 'コエンザイムQ10', unit: 'mg' },
            { key: 'ルテイン', name: 'ルテイン', unit: 'mg' },
            { key: 'アスタキサンチン', name: 'アスタキサンチン', unit: 'mg' },
            { key: 'グルコサミン', name: 'グルコサミン', unit: 'mg' },
            { key: 'コンドロイチン', name: 'コンドロイチン', unit: 'mg' },
            { key: 'コラーゲン', name: 'コラーゲン', unit: 'mg' },
            { key: 'ヒアルロン酸', name: 'ヒアルロン酸', unit: 'mg' },
            { key: 'プラセンタ', name: 'プラセンタ', unit: 'mg' }
        ];
        
        specialComponents.forEach(component => {
            if (imdData[component.key] !== undefined && imdData[component.key] !== null) {
                facts.push(new NutritionFact(component.name, imdData[component.key], component.unit));
            }
        });
        
        // Also check for any additional nutrients that might be in a different format
        if (imdData.栄養成分 && Array.isArray(imdData.栄養成分)) {
            imdData.栄養成分.forEach(nutrient => {
                if (nutrient.名称 && nutrient.含有量 !== undefined) {
                    // Check if we haven't already added this nutrient
                    const exists = facts.some(f => f.name === nutrient.名称);
                    if (!exists) {
                        facts.push(new NutritionFact(
                            nutrient.名称,
                            nutrient.含有量,
                            nutrient.単位 || 'mg'
                        ));
                    }
                }
            });
        }
        
        console.log(`📊 Mapped ${facts.length} nutrition facts for ${imdData.名称}`);
        return facts;
    }
    
    // Utility method to map multiple products
    static mapMultipleToUnified(imdDataArray) {
        if (!Array.isArray(imdDataArray)) {
            console.warn('⚠️ IMD data array is not an array');
            return [];
        }
        
        return imdDataArray
            .map(data => this.mapToUnified(data))
            .filter(product => product !== null);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IMDMapper;
}