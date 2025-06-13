import type { Supplement } from '@/types';

interface IHerbProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  nutrients: Array<{
    name: string;
    amount: number;
    unit: string;
    perServing: boolean;
  }>;
}

export class IHerbScraper {
  private baseUrl = 'https://jp.iherb.com';

  async fetchProductFromUrl(url: string): Promise<IHerbProduct | null> {
    try {
      // URLからproduct IDを抽出
      const match = url.match(/\/pr\/.*?\/([\w-]+)$/);
      if (!match) return null;

      const productId = match[1];

      // 実際のスクレイピングの代わりに、デモ用のモックデータを返す
      // 本番環境では、プロキシAPIやPuppeteerを使用
      return this.getMockProduct(productId);
    } catch (error) {
      console.error('Failed to fetch iHerb product:', error);
      return null;
    }
  }

  private getMockProduct(productId: string): IHerbProduct {
    // デモ用のモックデータ
    const mockProducts: Record<string, IHerbProduct> = {
      'NOW-00733': {
        id: 'NOW-00733',
        name: 'ビタミンD-3、5,000 IU、240ソフトジェル',
        brand: 'NOW Foods',
        image: 'https://s3.images-iherb.com/now/now00733/w/11.jpg',
        nutrients: [
          { name: 'ビタミンD3', amount: 125, unit: 'μg', perServing: true }
        ]
      },
      'LFE-01823': {
        id: 'LFE-01823',
        name: 'マグネシウムキャップ、500mg、100粒',
        brand: 'Life Extension',
        image: 'https://s3.images-iherb.com/lex/lex01823/w/11.jpg',
        nutrients: [
          { name: 'マグネシウム', amount: 500, unit: 'mg', perServing: true }
        ]
      },
      'CGN-01234': {
        id: 'CGN-01234',
        name: 'オメガ3 プレミアムフィッシュオイル',
        brand: 'California Gold Nutrition',
        image: 'https://s3.images-iherb.com/cgn/cgn01234/w/11.jpg',
        nutrients: [
          { name: 'EPA', amount: 360, unit: 'mg', perServing: true },
          { name: 'DHA', amount: 240, unit: 'mg', perServing: true }
        ]
      }
    };

    // デフォルトのモック商品
    const defaultProduct: IHerbProduct = {
      id: productId,
      name: 'サンプルサプリメント',
      brand: 'Sample Brand',
      image: '/images/supplement-placeholder.png',
      nutrients: [
        { name: 'ビタミンC', amount: 1000, unit: 'mg', perServing: true }
      ]
    };

    return mockProducts[productId] || defaultProduct;
  }

  async searchProducts(query: string): Promise<IHerbProduct[]> {
    // 検索機能のモック実装
    const allProducts = [
      this.getMockProduct('NOW-00733'),
      this.getMockProduct('LFE-01823'),
      this.getMockProduct('CGN-01234')
    ];

    const lowerQuery = query.toLowerCase();
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery)
    );
  }

  convertToSupplement(product: IHerbProduct): Partial<Supplement> {
    return {
      iherbId: product.id,
      nameJa: product.name,
      brand: product.brand,
      images: {
        main: product.image
      }
    };
  }
}