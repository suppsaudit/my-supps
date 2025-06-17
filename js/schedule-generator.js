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
        // Generate schedules
        const schedules = await generateIntakeSchedule(supplementId, instructions);
        
        // Prepare data for insertion
        const scheduleData = schedules.map(schedule => ({
            user_id: userId,
            ...schedule
        }));
        
        // Insert schedules
        const { data, error } = await supabase
            .from('user_intake_schedules')
            .upsert(scheduleData, {
                onConflict: 'user_id,supplement_id,time_of_day'
            });
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Error saving intake schedule:', error);
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
        // Get supplement data from DSLD API or database
        const { data: supplement, error } = await supabase
            .from('supplements')
            .select('*')
            .eq('id', supplementId)
            .single();
        
        if (error) throw error;
        
        // Look for dosage instructions in supplement data
        // This would need to be extracted from DSLD API data
        let instructions = '';
        
        // Check common fields where instructions might be stored
        if (supplement.dosage_instructions) {
            instructions = supplement.dosage_instructions;
        } else if (supplement.serving_size && supplement.serving_size.includes('回')) {
            instructions = supplement.serving_size;
        } else {
            // Default to once daily if no instructions found
            instructions = '1日1回';
        }
        
        // Generate and save schedule
        return await saveIntakeSchedule(userId, supplementId, instructions);
        
    } catch (error) {
        console.error('Error auto-generating schedule:', error);
        // Default schedule if error occurs
        return await saveIntakeSchedule(userId, supplementId, '1日1回');
    }
}

// Export functions for use in other modules
window.scheduleGenerator = {
    generateIntakeSchedule,
    saveIntakeSchedule,
    updateIntakeSchedule,
    getScheduleSummary,
    autoGenerateSchedule
};