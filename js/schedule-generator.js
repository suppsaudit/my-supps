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
async function generateIntakeSchedule(supplementId, instructions = '') {
    const schedules = [];
    
    // Parse instructions
    const parsedSchedule = parseInstructions(instructions);
    
    // If no specific times found, use default based on frequency
    if (parsedSchedule.times.length === 0) {
        parsedSchedule.times = getDefaultTimes(parsedSchedule.frequency);
    }
    
    // Create schedule entries
    parsedSchedule.times.forEach(timeOfDay => {
        schedules.push({
            supplement_id: supplementId,
            time_of_day: timeOfDay,
            timing_type: parsedSchedule.timingType,
            frequency: instructions
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
        
        // Generate schedules
        const schedules = await generateIntakeSchedule(supplementId, instructions);
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
            .upsert(scheduleData, {
                onConflict: 'user_id,supplement_id,time_of_day'
            });
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Error saving intake schedule:', error);
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
        console.error('Error updating intake schedule:', error);
        return { success: false, error };
    }
}

// Get schedule summary for display
function getScheduleSummary(schedules) {
    const timeMap = {
        morning: '朝',
        day: '昼',
        night: '夜',
        before_sleep: '就寝前'
    };
    
    const times = schedules.map(s => timeMap[s.time_of_day] || s.time_of_day);
    const timingTypes = [...new Set(schedules.map(s => s.timing_type).filter(Boolean))];
    
    let summary = times.join('・');
    if (timingTypes.length > 0) {
        summary += ` (${timingTypes.join('・')})`;
    }
    
    return summary;
}

// Auto-generate schedules when adding supplement to My Supps
async function autoGenerateSchedule(userId, supplementId) {
    try {
        console.log('🔄 Auto-generating schedule for:', { userId, supplementId });
        
        // Try to get supplement data from database first
        let supplement = null;
        let instructions = '';
        
        if (!window.isDemo && window.supabase) {
            const { data, error } = await supabase
                .from('supplements')
                .select('*')
                .eq('id', supplementId)
                .single();
            
            if (!error && data) {
                supplement = data;
            }
        }
        
        // If not found in database, get from mock data or DSLD API
        if (!supplement) {
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            supplement = mockSupplements.find(s => s.id === supplementId);
            
            if (!supplement) {
                console.log('⚠️ Supplement not found, using default schedule');
                instructions = '1日1回';
            }
        }
        
        if (supplement) {
            // Extract dosage instructions from supplement data
            instructions = extractDosageInstructions(supplement);
            console.log('📋 Extracted instructions:', instructions);
        }
        
        // Generate and save schedule
        const result = await saveIntakeSchedule(userId, supplementId, instructions);
        console.log('💾 Schedule save result:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error auto-generating schedule:', error);
        // Default schedule if error occurs
        return await saveIntakeSchedule(userId, supplementId, '1日1回');
    }
}

// Extract dosage instructions from supplement data
function extractDosageInstructions(supplement) {
    // Check various fields where dosage information might be stored
    const fields = [
        'dosage_instructions',
        'dosage_form',
        'serving_size',
        'directions_for_use',
        'instructions',
        'label_serving_info'
    ];
    
    for (const field of fields) {
        if (supplement[field] && typeof supplement[field] === 'string') {
            const value = supplement[field];
            
            // Look for common Japanese patterns
            if (value.includes('朝晩') || value.includes('2回')) {
                return '朝晩2回';
            }
            if (value.includes('朝昼晩') || value.includes('3回')) {
                return '朝昼晩3回';
            }
            if (value.includes('1日1回') || value.includes('daily')) {
                return '1日1回';
            }
            if (value.includes('朝') && !value.includes('晩')) {
                return '1日1回 朝';
            }
            if (value.includes('夜') || value.includes('就寝前')) {
                return '1日1回 就寝前';
            }
        }
    }
    
    // Default to once daily
    return '1日1回';
}

// Export functions for use in other modules
window.scheduleGenerator = {
    generateIntakeSchedule,
    saveIntakeSchedule,
    updateIntakeSchedule,
    getScheduleSummary,
    autoGenerateSchedule
};