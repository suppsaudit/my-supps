// Mock data for demo mode
export const mockNutrients = [
  {
    id: '1',
    name_en: 'Vitamin D3',
    name_ja: 'ビタミンD3',
    unit: 'IU',
    daily_value: 400,
    description: 'Supports bone health and immune function'
  },
  {
    id: '2',
    name_en: 'Magnesium',
    name_ja: 'マグネシウム',
    unit: 'mg',
    daily_value: 400,
    description: 'Essential for muscle and nerve function'
  },
  {
    id: '3',
    name_en: 'Omega-3',
    name_ja: 'オメガ3',
    unit: 'mg',
    daily_value: 1000,
    description: 'Supports heart and brain health'
  },
  {
    id: '4',
    name_en: 'Vitamin B12',
    name_ja: 'ビタミンB12',
    unit: 'mcg',
    daily_value: 2.4,
    description: 'Essential for nerve function and red blood cell formation'
  },
  {
    id: '5',
    name_en: 'Zinc',
    name_ja: '亜鉛',
    unit: 'mg',
    daily_value: 11,
    description: 'Supports immune function and wound healing'
  }
];

export const mockSupplements = [
  {
    id: '1',
    name_en: 'Now Foods Vitamin D3 2000 IU',
    name_ja: 'ナウフーズ ビタミンD3 2000 IU',
    brand: 'Now Foods',
    iherb_id: 'now-00329',
    iherb_url: 'https://iherb.com/pr/now-foods-vitamin-d-3-2000-iu-240-softgels/829',
    amazon_url: '',
    price_usd: 8.99,
    price_jpy: 1200,
    image_url: '/api/placeholder/150/150',
    description: 'High potency vitamin D3 for bone and immune support',
    serving_size: '1 softgel',
    servings_per_container: 240,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name_en: 'Jarrow Formulas Magnesium Optimizer',
    name_ja: 'ジャロウフォーミュラズ マグネシウムオプティマイザー',
    brand: 'Jarrow Formulas',
    iherb_id: 'jarrow-00195',
    iherb_url: 'https://iherb.com/pr/jarrow-formulas-magnesium-optimizer-100-tablets/195',
    amazon_url: '',
    price_usd: 12.95,
    price_jpy: 1800,
    image_url: '/api/placeholder/150/150',
    description: 'Enhanced magnesium absorption formula',
    serving_size: '1 tablet',
    servings_per_container: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name_en: 'Nordic Naturals Ultimate Omega',
    name_ja: 'ノルディックナチュラルズ アルティメットオメガ',
    brand: 'Nordic Naturals',
    iherb_id: 'nordic-00123',
    iherb_url: 'https://iherb.com/pr/nordic-naturals-ultimate-omega-1280-mg-120-soft-gels/123',
    amazon_url: '',
    price_usd: 39.95,
    price_jpy: 5400,
    image_url: '/api/placeholder/150/150',
    description: 'High-potency omega-3 from wild-caught fish',
    serving_size: '2 soft gels',
    servings_per_container: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockSupplementNutrients = [
  // Vitamin D3 supplement
  {
    id: '1',
    supplement_id: '1',
    nutrient_id: '1',
    amount: 2000,
    unit: 'IU'
  },
  // Magnesium supplement
  {
    id: '2',
    supplement_id: '2',
    nutrient_id: '2',
    amount: 200,
    unit: 'mg'
  },
  // Omega-3 supplement
  {
    id: '3',
    supplement_id: '3',
    nutrient_id: '3',
    amount: 1280,
    unit: 'mg'
  }
];

export const mockUserProfile = {
  id: 'demo-user',
  email: 'demo@example.com',
  full_name: 'Demo User',
  avatar_url: '/api/placeholder/80/80',
  profile: {
    age: 30,
    gender: 'male',
    weight_kg: 70,
    height_cm: 175,
    activity_level: 'moderate',
    health_goals: ['general_health', 'energy'],
    allergies: [],
    medications: []
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockUserSupplements = [
  {
    id: '1',
    user_id: 'demo-user',
    supplement_id: '1',
    is_selected: true,
    daily_intake: 1,
    notes: '朝食後に摂取',
    added_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplement: mockSupplements[0]
  },
  {
    id: '2',
    user_id: 'demo-user',
    supplement_id: '2',
    is_selected: false,
    daily_intake: 1,
    notes: '',
    added_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplement: mockSupplements[1]
  },
  {
    id: '3',
    user_id: 'demo-user',
    supplement_id: '3',
    is_selected: true,
    daily_intake: 2,
    notes: '夕食後に2粒',
    added_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplement: mockSupplements[2]
  }
];