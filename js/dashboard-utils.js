// Dashboard utility functions

// Format supplement name for schedule display
function formatSupplementNameForSchedule(supplement) {
    if (!supplement) return 'Unknown Supplement';
    
    // Use Japanese name if available, otherwise English
    const name = supplement.name_ja || supplement.name_en || supplement.name;
    const brand = supplement.brand;
    
    if (!name) return 'Unknown Supplement';
    
    // If it's already in proper format (contains brand, dosage, etc.), return as-is
    if (name.includes('mg') || name.includes('mcg') || name.includes('IU') || name.includes('capsule') || name.includes('tablet')) {
        return brand ? `${brand} ${name}` : name;
    }
    
    // Otherwise, format it properly
    const baseNames = {
        'Vitamin C': 'Vitamin C 1,000mg, 60 Capsules',
        'ビタミンC': 'ビタミンC 1,000mg 60カプセル',
        'Vitamin D': 'Vitamin D3 2,000 IU, 120 Softgels', 
        'ビタミンD': 'ビタミンD3 2,000 IU 120ソフトジェル',
        'Omega-3': 'Omega-3 Fish Oil 1,200mg, 90 Softgels',
        'オメガ3': 'オメガ3 フィッシュオイル 1,200mg 90ソフトジェル',
        'Magnesium': 'Magnesium Glycinate 400mg, 120 Capsules',
        'マグネシウム': 'マグネシウム グリシネート 400mg 120カプセル',
        'Zinc': 'Zinc Picolinate 30mg, 60 Tablets',
        '亜鉛': '亜鉛 ピコリン酸 30mg 60錠',
        'Iron': 'Iron Bisglycinate 18mg, 90 Capsules',
        '鉄': '鉄 ビスグリシネート 18mg 90カプセル',
        'B Complex': 'B-Complex High Potency, 100 Capsules',
        'ビタミンB群': 'ビタミンB群 高効力 100カプセル',
        'Multivitamin': 'Daily Multivitamin & Mineral, 120 Tablets',
        'マルチビタミン': 'デイリー マルチビタミン&ミネラル 120錠',
        'Probiotics': 'Probiotic 50 Billion CFU, 30 Capsules',
        'プロバイオティクス': 'プロバイオティクス 500億CFU 30カプセル',
        'Calcium': 'Calcium Citrate 1,000mg, 120 Tablets',
        'カルシウム': 'カルシウム クエン酸 1,000mg 120錠'
    };
    
    const formattedName = baseNames[name] || `${name} Premium, 60 Capsules`;
    
    return brand ? `${brand} ${formattedName}` : formattedName;
}

// Format dosage display (e.g., "1/2 粒" for split dosages)
function formatDosageDisplay(schedule) {
    // If schedule has dosage information from new system
    if (schedule.dosage_current && schedule.dosage_total && schedule.dosage_position) {
        const unit = schedule.dosage_unit || '粒';
        return `${schedule.dosage_position}/${schedule.total_times} (${schedule.dosage_current}${unit})`;
    }
    
    // Fallback: use serving_size or default
    const servingSize = schedule.supplements?.serving_size || '1粒';
    return servingSize;
}