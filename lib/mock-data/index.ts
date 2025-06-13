import type { Supplement, Nutrient, SupplementNutrient } from '@/types';

export const mockSupplements: Supplement[] = [
  {
    id: '1',
    iherbId: 'NOW-00733',
    nameJa: 'ビタミンD-3 5000IU',
    nameEn: 'Vitamin D-3 5000 IU',
    brand: 'NOW Foods',
    images: {
      main: '/images/supplements/vitamin-d3.jpg',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    iherbId: 'NOW-00490',
    nameJa: 'マグネシウム 400mg',
    nameEn: 'Magnesium 400mg',
    brand: 'NOW Foods',
    images: {
      main: '/images/supplements/magnesium.jpg',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    iherbId: 'THN-01051',
    nameJa: 'アシュワガンダ KSM-66',
    nameEn: 'Ashwagandha KSM-66',
    brand: 'Thorne',
    images: {
      main: '/images/supplements/ashwagandha.jpg',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockNutrients: Nutrient[] = [
  {
    id: '1',
    nameJa: 'ビタミンD',
    nameEn: 'Vitamin D',
    category: 'vitamin',
    rdaLowerMg: 0.015,
    rdaUpperMg: 0.1,
    perKgLowerMg: 0.0002,
    perKgUpperMg: 0.0015,
    unit: 'μg',
  },
  {
    id: '2',
    nameJa: 'マグネシウム',
    nameEn: 'Magnesium',
    category: 'mineral',
    rdaLowerMg: 300,
    rdaUpperMg: 400,
    perKgLowerMg: 4.5,
    perKgUpperMg: 6,
    unit: 'mg',
  },
  {
    id: '3',
    nameJa: 'ビタミンC',
    nameEn: 'Vitamin C',
    category: 'vitamin',
    rdaLowerMg: 100,
    rdaUpperMg: 2000,
    perKgLowerMg: 1.5,
    perKgUpperMg: 30,
    unit: 'mg',
  },
  {
    id: '4',
    nameJa: '亜鉛',
    nameEn: 'Zinc',
    category: 'mineral',
    rdaLowerMg: 8,
    rdaUpperMg: 40,
    perKgLowerMg: 0.12,
    perKgUpperMg: 0.6,
    unit: 'mg',
  },
  {
    id: '5',
    nameJa: 'ビタミンB12',
    nameEn: 'Vitamin B12',
    category: 'vitamin',
    rdaLowerMg: 0.0024,
    rdaUpperMg: 0.1,
    perKgLowerMg: 0.00004,
    perKgUpperMg: 0.0015,
    unit: 'μg',
  },
];

export const mockSupplementNutrients: SupplementNutrient[] = [
  {
    supplementId: '1',
    nutrientId: '1',
    amountPerServing: 125,
    amountPerUnit: 125,
    servingSize: 1,
    unit: 'μg',
    bioavailabilityFactor: 0.8,
  },
  {
    supplementId: '2',
    nutrientId: '2',
    amountPerServing: 400,
    amountPerUnit: 400,
    servingSize: 1,
    unit: 'mg',
    bioavailabilityFactor: 0.4,
  },
];