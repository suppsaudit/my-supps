// Schedule Generator - Generates intake schedules from supplement instructions

// Common instruction patterns
const INSTRUCTION_PATTERNS = {
    // Time-based patterns
    朝晩: ['morning', 'night'],
    朝昼晩: ['morning', 'day', 'night'],
    朝夕: ['morning', 'night'],
    朝: ['morning'],
    昼: ['day'],
    夕: ['night'],
    夜: ['night'],
    就寝前: ['before_sleep'],
    寝る前: ['before_sleep'],
    
    // Frequency patterns
    '1日1回': 1,
    '1日2回': 2,
    '1日3回': 3,
    '1日4回': 4,
    
    // Meal timing patterns
    食前: '空腹時',
    食後: '食後',
    食事と一緒: '食事中',
    空腹時: '空腹時'
};

// Generate intake schedule from supplement data
async function generateIntakeSchedule(supplementId, instructions = '', servingSize = '') {
    const schedules = [];
    
    // Parse instructions and serving size
    const parsedSchedule = parseInstructions(instructions);
    const dosageInfo = parseServingSize(servingSize);
    
    // If no specific times found, use default based on frequency
    if (parsedSchedule.times.length === 0) {
        parsedSchedule.times = getDefaultTimes(parsedSchedule.frequency);
    }
    
    // Calculate dosage per time slot
    const totalTimes = parsedSchedule.times.length;
    const dosagePerTime = calculateDosagePerTime(dosageInfo.amount, totalTimes);
    
    // Create schedule entries with proper dosage split
    parsedSchedule.times.forEach((timeOfDay, index) => {
        // Calculate individual dosage, handling remainder
        let individualDosage = dosagePerTime.individual;
        if (dosagePerTime.hasRemainder && index < dosagePerTime.remainder) {
            individualDosage += 1; // Distribute remainder to first few time slots
        }
        
        schedules.push({
            supplement_id: supplementId,
            time_of_day: timeOfDay,
            timing_type: parsedSchedule.timingType,
            frequency: instructions,
            dosage_current: individualDosage,
            dosage_total: dosageInfo.amount,
            dosage_unit: dosageInfo.unit,
            dosage_position: index + 1, // 1st, 2nd, etc.
            total_times: totalTimes
        });
    });
    
    return schedules;
}

// Parse instruction text
function parseInstructions(instructions) {
    const result = {
        times: [],
        frequency: 1,
        timingType: null
    };
    
    if (!instructions) return result;
    
    const lowerInstructions = instructions.toLowerCase();
    
    // Check for time patterns
    for (const [pattern, times] of Object.entries(INSTRUCTION_PATTERNS)) {
        if (typeof times === 'object' && lowerInstructions.includes(pattern)) {
            result.times = times;
            break;
        }
    }
    
    // Check for frequency
    for (const [pattern, freq] of Object.entries(INSTRUCTION_PATTERNS)) {
        if (typeof freq === 'number' && lowerInstructions.includes(pattern)) {
            result.frequency = freq;
            break;
        }
    }
    
    // Check for meal timing
    if (lowerInstructions.includes('食前') || lowerInstructions.includes('空腹時')) {
        result.timingType = '空腹時';
    } else if (lowerInstructions.includes('食後')) {
        result.timingType = '食後';
    } else if (lowerInstructions.includes('食事と一緒')) {
        result.timingType = '食事中';
    }
    
    // Additional parsing for complex patterns
    if (lowerInstructions.includes('朝食後') && lowerInstructions.includes('夕食後')) {
        result.times = ['morning', 'night'];
        result.timingType = '食後';
    }
    
    return result;
}

// Parse serving size to extract dosage information
function parseServingSize(servingSize) {
    if (!servingSize) return { amount: 1, unit: '粒' };
    
    // Extract number and unit from serving size
    const numberMatch = servingSize.match(/(\d+(?:\.\d+)?)/);
    const amount = numberMatch ? parseFloat(numberMatch[1]) : 1;
    
    // Determine unit
    let unit = '粒';
    if (servingSize.includes('capsule') || servingSize.includes('カプセル')) {
        unit = 'カプセル';
    } else if (servingSize.includes('tablet') || servingSize.includes('錠')) {
        unit = '錠';
    } else if (servingSize.includes('softgel') || servingSize.includes('ソフトジェル')) {
        unit = 'ソフトジェル';
    } else if (servingSize.includes('ml') || servingSize.includes('mL')) {
        unit = 'ml';
    } else if (servingSize.includes('粒')) {
        unit = '粒';
    }
    
    return { amount, unit };
}

// Calculate dosage per time slot
function calculateDosagePerTime(totalAmount, timesPerDay) {
    if (timesPerDay <= 1) {
        return { individual: totalAmount, remainder: 0 };
    }
    
    // Try to split evenly, but handle odd numbers
    const baseAmount = Math.floor(totalAmount / timesPerDay);
    const remainder = totalAmount % timesPerDay;
    
    return {
        individual: baseAmount,
        remainder: remainder,
        hasRemainder: remainder > 0
    };
}

// Get default times based on frequency
function getDefaultTimes(frequency) {
    switch (frequency) {
        case 1:
            return ['morning'];
        case 2:
            return ['morning', 'night'];
        case 3:
            return ['morning', 'day', 'night'];
        case 4:
            return ['morning', 'day', 'night', 'before_sleep'];
        default:
            return ['morning'];
    }
}

// Save schedule to database
async function saveIntakeSchedule(userId, supplementId, instructions) {
    try {
        console.log('💾 Saving schedule:', { userId, supplementId, instructions });
        
        // Get supplement data for serving size
        const supplement = await getSupplementData(supplementId);
        const servingSize = supplement?.serving_size || '';
        
        // Generate schedules with dosage information
        const schedules = await generateIntakeSchedule(supplementId, instructions, servingSize);
        console.log('📅 Generated schedules:', schedules);
        
        // Prepare data for insertion
        const scheduleData = schedules.map(schedule => ({
            user_id: userId,
            ...schedule
        }));
        
        // Handle demo mode
        if (window.isDemo || !window.supabase) {
            // Save to localStorage for demo mode
            const existingSchedules = JSON.parse(localStorage.getItem('mockUserSchedules') || '[]');
            
            // Remove existing schedules for this supplement
            const filtered = existingSchedules.filter(
                s => !(s.user_id === userId && s.supplement_id === supplementId)
            );
            
            // Add new schedules with mock IDs
            scheduleData.forEach((schedule, index) => {
                filtered.push({
                    ...schedule,
                    id: `mock-schedule-${supplementId}-${schedule.time_of_day}-${Date.now()}-${index}`
                });
            });
            
            localStorage.setItem('mockUserSchedules', JSON.stringify(filtered));
            console.log('💾 Saved to localStorage:', filtered);
            
            return { success: true, data: scheduleData };
        }
        
        // Insert schedules to database
        const { data, error } = await supabase
            .from('user_intake_schedules')
            .insert(scheduleData)
            .select();
        
        if (error) throw error;
        
        console.log('✅ Schedules saved to database:', data);
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Error saving schedule:', error);
        return { success: false, error };
    }
}

// Update schedule for a supplement
async function updateIntakeSchedule(userId, supplementId, newInstructions) {
    try {
        // Delete existing schedules
        const { error: deleteError } = await supabase
            .from('user_intake_schedules')
            .delete()
            .eq('user_id', userId)
            .eq('supplement_id', supplementId);
        
        if (deleteError) throw deleteError;
        
        // Save new schedules
        return await saveIntakeSchedule(userId, supplementId, newInstructions);
        
    } catch (error) {
        console.error('Error updating schedule:', error);
        return { success: false, error };
    }
}

// Get supplement data by ID
async function getSupplementData(supplementId) {
    try {
        if (window.isDemo || !window.supabase) {
            // Demo mode: get from localStorage
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            return mockSupplements.find(s => s.id === supplementId);
        } else {
            // Database mode
            const { data } = await supabase
                .from('supplements')
                .select('*')
                .eq('id', supplementId)
                .single();
            return data;
        }
    } catch (error) {
        console.error('Error getting supplement data:', error);
        return null;
    }
}