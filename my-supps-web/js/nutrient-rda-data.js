// NIH ODS Nutrient RDA/UL Data Management

// Cache for RDA/UL data
let rdaDataCache = null;

// Default RDA values for common nutrients (adult male/female average)
// These will be overridden by NIH ODS data when available
const DEFAULT_RDA_VALUES = {
    'ビタミンA': { rda: 900, ul: 3000, unit: 'mcg' },
    'ビタミンC': { rda: 90, ul: 2000, unit: 'mg' },
    'ビタミンD': { rda: 15, ul: 100, unit: 'mcg' },
    'ビタミンE': { rda: 15, ul: 1000, unit: 'mg' },
    'ビタミンK': { rda: 120, ul: null, unit: 'mcg' },
    'チアミン(B1)': { rda: 1.2, ul: null, unit: 'mg' },
    'リボフラビン(B2)': { rda: 1.3, ul: null, unit: 'mg' },
    'ナイアシン(B3)': { rda: 16, ul: 35, unit: 'mg' },
    'ビタミンB6': { rda: 1.7, ul: 100, unit: 'mg' },
    '葉酸': { rda: 400, ul: 1000, unit: 'mcg' },
    'ビタミンB12': { rda: 2.4, ul: null, unit: 'mcg' },
    'ビオチン': { rda: 30, ul: null, unit: 'mcg' },
    'パントテン酸': { rda: 5, ul: null, unit: 'mg' },
    'カルシウム': { rda: 1000, ul: 2500, unit: 'mg' },
    '鉄': { rda: 8, ul: 45, unit: 'mg' },
    'マグネシウム': { rda: 420, ul: 350, unit: 'mg' },
    '亜鉛': { rda: 11, ul: 40, unit: 'mg' },
    'セレン': { rda: 55, ul: 400, unit: 'mcg' },
    '銅': { rda: 0.9, ul: 10, unit: 'mg' },
    'マンガン': { rda: 2.3, ul: 11, unit: 'mg' },
    'クロム': { rda: 35, ul: null, unit: 'mcg' },
    'モリブデン': { rda: 45, ul: 2000, unit: 'mcg' },
    'ヨウ素': { rda: 150, ul: 1100, unit: 'mcg' }
};

// Load RDA/UL data from database
async function loadRDAData() {
    if (rdaDataCache) return rdaDataCache;
    
    try {
        const { data, error } = await supabase
            .from('nutrient_rda_ul')
            .select('*');
        
        if (error) throw error;
        
        // Convert to lookup object
        rdaDataCache = {};
        data.forEach(item => {
            const key = item.nutrient_name;
            if (!rdaDataCache[key]) {
                rdaDataCache[key] = [];
            }
            rdaDataCache[key].push(item);
        });
        
        return rdaDataCache;
        
    } catch (error) {
        console.error('Error loading RDA data:', error);
        return {};
    }
}

// Get RDA/UL values for a specific nutrient
async function getRDAValues(nutrientName, age = 'adult', gender = 'male') {
    const rdaData = await loadRDAData();
    
    // First check NIH ODS data
    if (rdaData[nutrientName]) {
        // Find matching entry for age/gender
        const match = rdaData[nutrientName].find(item => {
            return item.age_group.includes(age) && 
                   (item.gender === gender || item.gender === 'both');
        });
        
        if (match) {
            return {
                rda: parseFloat(match.rda_ai_value) || 0,
                ul: parseFloat(match.upper_limit_ul) || null,
                unit: match.unit,
                type: match.rda_ai_type
            };
        }
    }
    
    // Fall back to default values
    if (DEFAULT_RDA_VALUES[nutrientName]) {
        return DEFAULT_RDA_VALUES[nutrientName];
    }
    
    // For nutrients not in RDA database (like Carnosine), 
    // use manufacturer recommended dosage
    return null;
}

// Calculate RDA percentage for a nutrient amount
async function calculateRDAPercentage(nutrientName, amount, unit) {
    const rdaValues = await getRDAValues(nutrientName);
    
    if (!rdaValues || !rdaValues.rda) {
        // For non-RDA nutrients, use manufacturer's recommended dose as 100%
        return null;
    }
    
    // Convert units if necessary
    const convertedAmount = convertToRDAUnit(amount, unit, rdaValues.unit);
    
    return (convertedAmount / rdaValues.rda) * 100;
}

// Convert between units
function convertToRDAUnit(amount, fromUnit, toUnit) {
    if (fromUnit === toUnit) return amount;
    
    // Common conversions
    const conversions = {
        'mg_to_mcg': 1000,
        'mcg_to_mg': 0.001,
        'g_to_mg': 1000,
        'mg_to_g': 0.001,
        'IU_to_mcg_vitD': 0.025,
        'mcg_to_IU_vitD': 40,
        'IU_to_mg_vitE': 0.67,
        'mg_to_IU_vitE': 1.49
    };
    
    const conversionKey = `${fromUnit}_to_${toUnit}`;
    if (conversions[conversionKey]) {
        return amount * conversions[conversionKey];
    }
    
    // If no conversion found, return original amount
    console.warn(`No conversion found from ${fromUnit} to ${toUnit}`);
    return amount;
}

// Get chart configuration with RDA/UL lines
async function getChartConfigWithRDA(nutrients) {
    const labels = [];
    const currentIntake = [];
    const rdaLine = [];
    const ulLine = [];
    
    for (const [name, data] of Object.entries(nutrients)) {
        labels.push(name);
        
        const rdaValues = await getRDAValues(name);
        if (rdaValues && rdaValues.rda) {
            const percentage = (data.amount / rdaValues.rda) * 100;
            currentIntake.push(percentage);
            rdaLine.push(100); // RDA is always 100%
            
            if (rdaValues.ul) {
                const ulPercentage = (rdaValues.ul / rdaValues.rda) * 100;
                ulLine.push(ulPercentage);
            } else {
                ulLine.push(null); // No upper limit
            }
        } else {
            // For non-RDA nutrients, show actual amount
            currentIntake.push(data.amount);
            rdaLine.push(null);
            ulLine.push(null);
        }
    }
    
    return {
        labels,
        datasets: [{
            label: '現在の摂取量',
            data: currentIntake,
            backgroundColor: 'rgba(255, 20, 147, 0.2)',
            borderColor: 'rgba(255, 20, 147, 1)',
            pointBackgroundColor: 'rgba(255, 20, 147, 1)'
        }, {
            label: 'RDA (推奨摂取量)',
            data: rdaLine,
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            borderColor: 'rgba(0, 255, 0, 0.3)',
            borderDash: [5, 5],
            pointRadius: 0
        }, {
            label: 'UL (安全上限値)',
            data: ulLine,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderColor: 'rgba(255, 0, 0, 0.3)',
            borderDash: [10, 5],
            pointRadius: 0
        }]
    };
}

// Format nutrient display with RDA info
async function formatNutrientWithRDA(nutrientName, amount, unit) {
    const rdaValues = await getRDAValues(nutrientName);
    
    if (!rdaValues || !rdaValues.rda) {
        return {
            name: nutrientName,
            amount: amount,
            unit: unit,
            percentage: null,
            status: 'no-rda'
        };
    }
    
    const percentage = await calculateRDAPercentage(nutrientName, amount, unit);
    let status = 'normal';
    
    if (percentage < 50) {
        status = 'low';
    } else if (percentage > 100 && rdaValues.ul) {
        const ulPercentage = (amount / rdaValues.ul) * 100;
        if (ulPercentage > 80) {
            status = 'warning';
        }
        if (ulPercentage > 100) {
            status = 'danger';
        }
    }
    
    return {
        name: nutrientName,
        amount: amount,
        unit: unit,
        percentage: percentage,
        rda: rdaValues.rda,
        ul: rdaValues.ul,
        status: status
    };
}

// Initialize RDA data on page load
async function initializeRDAData() {
    try {
        // Load RDA data from database
        await loadRDAData();
        
        // If database is empty, potentially load from CSV
        // This would be done during initial setup
        
        console.log('RDA data initialized');
        
    } catch (error) {
        console.error('Error initializing RDA data:', error);
    }
}

// Export functions
window.nutrientRDA = {
    getRDAValues,
    calculateRDAPercentage,
    getChartConfigWithRDA,
    formatNutrientWithRDA,
    initializeRDAData
};