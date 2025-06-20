// Dashboard functionality

let currentTimeOfDay = 'morning';
let userSchedules = [];
let currentScoreChart = null;
let dailyIntakeLogs = {};
let savedCheckboxStates = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            console.log('⚠️ No authenticated user, redirecting to auth page');
            window.location.href = 'auth.html?redirect=dashboard';
            return;
        }
        
        console.log('✅ User authenticated:', user.email || user.id);

        // Set current time period based on actual time
        setCurrentTimePeriod();
        
        // Initialize charts first
        initializeCurrentScoreChart();
        
        // Load user data
        await loadUserSchedules();
        await loadDailyIntakeLogs();
        
        // If no schedules found but user has supplements, regenerate schedules
        if (userSchedules.length === 0) {
            console.log('🔄 No schedules found, attempting to regenerate...');
            await regenerateAllSchedules();
        }
        
        // If still no schedules, generate from My Supps data or create minimal test data
        if (userSchedules.length === 0) {
            console.log('🔧 No schedules found, checking My Supps data...');
            await generateSchedulesFromMySupps();
        }
        
        // Update UI
        updateScheduleDisplay();
        updateStats();
        
        // Handle window resize - preserve checkbox states
        window.addEventListener('resize', debounce(() => {
            preserveCheckboxStates();
            updateScheduleDisplay();
            restoreCheckboxStates();
        }, 250));
        
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        
        // Check if it's an auth error
        if (error.message && error.message.includes('auth')) {
            console.log('🔀 Authentication error, redirecting to auth page');
            window.location.href = 'auth.html?redirect=dashboard';
            return;
        }
        
        // Show error state but don't break the page
        const scheduleContent = document.getElementById('scheduleContent');
        if (scheduleContent) {
            scheduleContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p class="empty-state-text">データの読み込みに失敗しました</p>
                    <button class="empty-state-action" onclick="location.reload()">
                        再読み込み
                    </button>
                    <small style="margin-top: 10px; color: #666;">
                        エラー: ${error.message}
                    </small>
                </div>
            `;
        }
    }
});

// Set current time period based on actual time
function setCurrentTimePeriod() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        currentTimeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
        currentTimeOfDay = 'day';
    } else {
        currentTimeOfDay = 'night';
    }
    
    // Update active tab
    document.querySelectorAll('.time-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.time === currentTimeOfDay);
    });
}

// Switch time period
window.switchTimePeriod = function(timeOfDay) {
    currentTimeOfDay = timeOfDay;
    
    // Update active tab
    document.querySelectorAll('.time-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.time === timeOfDay);
    });
    
    // Update schedule display
    updateScheduleDisplay();
};

// Load user schedules
async function loadUserSchedules() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            console.log('❌ No user found in loadUserSchedules');
            userSchedules = [];
            return;
        }
        
        console.log('🔍 Loading schedules for user:', user.id);
        
        // Check if we're in demo mode
        if (window.isDemo || !window.supabase) {
            console.log('📱 Demo mode: Loading schedules from localStorage');
            
            // Load from localStorage if available
            const savedSchedules = JSON.parse(localStorage.getItem('mockUserSchedules') || '[]');
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            
            console.log('📊 Demo data loaded:', {
                savedSchedules: savedSchedules.length,
                mockUserSupps: mockUserSupps.length,
                mockSupplements: mockSupplements.length,
                userId: user.id
            });
            
            userSchedules = [];
            
            // Use saved schedules if available
            if (savedSchedules.length > 0) {
                userSchedules = savedSchedules
                    .filter(s => s.user_id === user.id)
                    .map(schedule => {
                        const supplement = mockSupplements.find(s => s.id === schedule.supplement_id);
                        return {
                            ...schedule,
                            supplements: supplement || {
                                id: schedule.supplement_id,
                                name_ja: 'Unknown Supplement',
                                name_en: 'Unknown Supplement',
                                brand: 'Unknown Brand',
                                serving_size: '1回分'
                            }
                        };
                    });
                console.log('✅ Using existing schedules:', userSchedules.length);
            } else {
                console.log('🔄 Generating new schedules from My Supps');
                
                // Generate schedules for existing supplements
                const userSupps = mockUserSupps.filter(us => us.user_id === user.id && us.is_my_supps);
                console.log('👤 User supplements found:', userSupps.length);
                
                userSupps.forEach(us => {
                    const supplement = mockSupplements.find(s => s.id === us.supplement_id);
                    if (supplement) {
                        console.log('📅 Generating schedule for:', supplement.name_ja || supplement.name_en);
                        const schedules = generateMockSchedules(supplement);
                        // Add user_id to each schedule
                        schedules.forEach(schedule => {
                            schedule.user_id = user.id;
                        });
                        userSchedules.push(...schedules);
                    }
                });
                
                console.log('🗓️ Total schedules generated:', userSchedules.length);
                
                // Save generated schedules
                if (userSchedules.length > 0) {
                    localStorage.setItem('mockUserSchedules', JSON.stringify(userSchedules));
                    console.log('💾 Schedules saved to localStorage');
                }
            }
                
            console.log('Demo mode: loaded schedules', userSchedules);
            return;
        }
        
        const { data, error } = await supabase
            .from('user_intake_schedules')
            .select(`
                *,
                supplements (
                    id,
                    name_ja,
                    name_en,
                    brand,
                    serving_size,
                    image_url
                )
            `)
            .eq('user_id', user.id);

        if (error) throw error;
        userSchedules = data || [];
    } catch (error) {
        console.error('Error loading schedules:', error);
        userSchedules = [];
    }
}

// Generate mock schedules for demo mode
function generateMockSchedules(supplement) {
    const schedules = [];
    
    // Extract dosage information from various possible fields
    const dosageFields = [
        supplement.dosage_instructions,
        supplement.dosage_form,
        supplement.directions_for_use,
        supplement.instructions,
        supplement.label_serving_info
    ];
    
    let dosage = '1日1回'; // Default
    
    // Check all possible fields for dosage information
    for (const field of dosageFields) {
        if (field && typeof field === 'string') {
            if (field.includes('朝晩') || field.includes('2回')) {
                dosage = '朝晩2回';
                break;
            } else if (field.includes('朝昼晩') || field.includes('3回')) {
                dosage = '朝昼晩3回';
                break;
            } else if (field.includes('1日1回') || field.includes('daily')) {
                dosage = '1日1回';
                break;
            }
        }
    }
    
    console.log(`💊 Generating schedule for ${supplement.name_ja || supplement.name_en}: ${dosage}`);
    
    // Extract serving size info for dosage calculation
    const servingSizeMatch = (supplement.serving_size || '').match(/(\d+)/);
    const totalAmount = servingSizeMatch ? parseInt(servingSizeMatch[1]) : 2; // Default 2 if not found
    
    // Determine unit from serving_size
    let dosageUnit = '粒';
    const servingSize = supplement.serving_size || '';
    if (servingSize.includes('tablet') || servingSize.includes('錠')) {
        dosageUnit = '錠';
    } else if (servingSize.includes('capsule') || servingSize.includes('カプセル')) {
        dosageUnit = 'カプセル';
    } else if (servingSize.includes('softgel') || servingSize.includes('ソフトジェル')) {
        dosageUnit = 'ソフトジェル';
    }
    
    // Generate schedules based on dosage
    if (dosage.includes('朝晩') || dosage.includes('2回')) {
        const dosagePerTime = Math.floor(totalAmount / 2);
        schedules.push({
            id: `mock-${supplement.id}-morning`,
            supplement_id: supplement.id,
            time_of_day: 'morning',
            timing_type: '朝食後',
            frequency: dosage,
            dosage_current: dosagePerTime,
            dosage_total: totalAmount,
            dosage_unit: dosageUnit,
            dosage_position: 1,
            total_times: 2,
            supplements: {
                id: supplement.id,
                name_ja: supplement.name_ja,
                name_en: supplement.name_en,
                brand: supplement.brand,
                serving_size: supplement.serving_size || '1回分'
            }
        });
        schedules.push({
            id: `mock-${supplement.id}-night`,
            supplement_id: supplement.id,
            time_of_day: 'night',
            timing_type: '夕食後',
            frequency: dosage,
            dosage_current: dosagePerTime,
            dosage_total: totalAmount,
            dosage_unit: dosageUnit,
            dosage_position: 2,
            total_times: 2,
            supplements: {
                id: supplement.id,
                name_ja: supplement.name_ja,
                name_en: supplement.name_en,
                brand: supplement.brand,
                serving_size: supplement.serving_size || '1回分'
            }
        });
    } else if (dosage.includes('朝昼晩') || dosage.includes('3回')) {
        const dosagePerTime = Math.floor(totalAmount / 3);
        ['morning', 'day', 'night'].forEach((timeOfDay, index) => {
            const timingTypes = ['朝食後', '昼食後', '夕食後'];
            schedules.push({
                id: `mock-${supplement.id}-${timeOfDay}`,
                supplement_id: supplement.id,
                time_of_day: timeOfDay,
                timing_type: timingTypes[index],
                frequency: dosage,
                dosage_current: dosagePerTime,
                dosage_total: totalAmount,
                dosage_unit: dosageUnit,
                dosage_position: index + 1,
                total_times: 3,
                supplements: {
                    id: supplement.id,
                    name_ja: supplement.name_ja,
                    name_en: supplement.name_en,
                    brand: supplement.brand,
                    serving_size: supplement.serving_size || '1回分'
                }
            });
        });
    } else {
        // Default: once daily in the morning
        schedules.push({
            id: `mock-${supplement.id}-morning`,
            supplement_id: supplement.id,
            time_of_day: 'morning',
            timing_type: '朝食後',
            frequency: dosage,
            dosage_current: totalAmount,
            dosage_total: totalAmount,
            dosage_unit: dosageUnit,
            dosage_position: 1,
            total_times: 1,
            supplements: {
                id: supplement.id,
                name_ja: supplement.name_ja,
                name_en: supplement.name_en,
                brand: supplement.brand,
                serving_size: supplement.serving_size || '1回分'
            }
        });
    }
    
    console.log(`✅ Generated ${schedules.length} schedule(s) for ${supplement.name_ja || supplement.name_en}`);
    return schedules;
}

// Regenerate all schedules for user's supplements
async function regenerateAllSchedules() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        console.log('🔄 Regenerating all schedules...');
        
        if (window.isDemo || !window.supabase) {
            // Demo mode: regenerate from localStorage
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            
            const userSupps = mockUserSupps.filter(us => us.user_id === user.id && us.is_my_supps);
            console.log(`🔍 Found ${userSupps.length} user supplements to process`);
            
            if (userSupps.length > 0) {
                userSchedules = [];
                
                for (const us of userSupps) {
                    const supplement = mockSupplements.find(s => s.id === us.supplement_id);
                    if (supplement) {
                        console.log(`📅 Creating schedule for: ${supplement.name_ja || supplement.name_en}`);
                        if (window.scheduleGenerator) {
                            await window.scheduleGenerator.autoGenerateSchedule(user.id, supplement.id);
                        } else {
                            // Fallback: generate directly
                            const schedules = generateMockSchedules(supplement);
                            schedules.forEach(schedule => {
                                schedule.user_id = user.id;
                            });
                            userSchedules.push(...schedules);
                        }
                    }
                }
                
                // Reload schedules after generation
                await loadUserSchedules();
                console.log(`✅ Regenerated ${userSchedules.length} schedules`);
            }
        } else {
            // Database mode: query user supplements and regenerate
            const { data: userSupps } = await supabase
                .from('user_supplements')
                .select('supplement_id')
                .eq('user_id', user.id)
                .eq('is_my_supps', true);
                
            if (userSupps && userSupps.length > 0) {
                for (const us of userSupps) {
                    if (window.scheduleGenerator) {
                        await window.scheduleGenerator.autoGenerateSchedule(user.id, us.supplement_id);
                    }
                }
                
                // Reload schedules after generation
                await loadUserSchedules();
            }
        }
        
    } catch (error) {
        console.error('❌ Error regenerating schedules:', error);
    }
}

// Load daily intake logs for today
async function loadDailyIntakeLogs() {
    try {
        const user = await getCurrentUser();
        const today = new Date().toISOString().split('T')[0];
        
        if (window.isDemo || !window.supabase) {
            // Demo mode: load from localStorage
            const mockLogs = JSON.parse(localStorage.getItem('mockDailyIntakeLogs') || '{}');
            dailyIntakeLogs = {};
            
            // Filter logs for today and convert to lookup object
            Object.values(mockLogs).forEach(log => {
                if (log.taken_date === today) {
                    dailyIntakeLogs[log.schedule_id] = log;
                }
            });
            
            console.log('Demo mode: loaded intake logs', dailyIntakeLogs);
            return;
        }
        
        const { data, error } = await supabase
            .from('daily_intake_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('taken_date', today);

        if (error) throw error;
        
        // Convert to object for easy lookup
        dailyIntakeLogs = {};
        (data || []).forEach(log => {
            dailyIntakeLogs[log.schedule_id] = log;
        });
    } catch (error) {
        console.error('Error loading intake logs:', error);
        dailyIntakeLogs = {};
    }
}

// Update schedule display
function updateScheduleDisplay() {
    // Check if we're on desktop or mobile
    const isDesktop = window.innerWidth >= 768;
    
    if (isDesktop) {
        updateDesktopScheduleDisplay();
    } else {
        updateMobileScheduleDisplay();
    }
}

// Update mobile schedule display (tab-based)
function updateMobileScheduleDisplay() {
    const scheduleContent = document.getElementById('scheduleContent');
    
    if (!scheduleContent) {
        console.error('Schedule content element not found');
        return;
    }
    
    console.log('Updating mobile schedule display for time:', currentTimeOfDay);
    console.log('All schedules:', userSchedules);
    
    const schedulesForTime = userSchedules.filter(s => s.time_of_day === currentTimeOfDay);
    console.log('Schedules for current time:', schedulesForTime);
    
    if (schedulesForTime.length === 0) {
        // Check if user has any supplements at all
        const totalSchedules = userSchedules.length;
        const message = totalSchedules === 0 
            ? 'サプリメントが登録されていません' 
            : 'この時間帯に摂取するサプリメントはありません';
        
        scheduleContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p class="empty-state-text">${message}</p>
                <a href="my-supps.html" class="empty-state-action">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    サプリメントを追加
                </a>
            </div>
        `;
        return;
    }
    
    scheduleContent.innerHTML = schedulesForTime.map(schedule => formatScheduleItem(schedule)).join('');
}

// Update desktop schedule display (3-column grid)
function updateDesktopScheduleDisplay() {
    const timeSlots = ['morning', 'day', 'night'];
    
    timeSlots.forEach(timeSlot => {
        const columnContent = document.getElementById(`${timeSlot}Schedule`);
        if (!columnContent) return;
        
        const schedulesForTime = userSchedules.filter(s => s.time_of_day === timeSlot);
        
        if (schedulesForTime.length === 0) {
            columnContent.innerHTML = `
                <div class="empty-state-small">
                    <p class="empty-state-text">なし</p>
                </div>
            `;
        } else {
            columnContent.innerHTML = schedulesForTime.map(schedule => formatScheduleItem(schedule)).join('');
        }
    });
}

// Format a single schedule item
function formatScheduleItem(schedule) {
    const isChecked = dailyIntakeLogs[schedule.id]?.is_taken || false;
    const timingDisplay = schedule.timing_type || '指定なし';
    const supplementName = formatSupplementNameForSchedule(schedule.supplements);
    
    // Format dosage display (e.g., "1/2 粒" for split dosages)
    const dosageDisplay = formatDosageDisplay(schedule);
    
    return `
        <div class="schedule-item" data-schedule-id="${schedule.id}">
            <div class="supplement-info">
                <div class="supplement-name">${supplementName}</div>
                <div class="supplement-timing">
                    <span class="timing-badge">${timingDisplay}</span>
                    <span class="dosage-display">${dosageDisplay}</span>
                </div>
            </div>
            <label class="intake-toggle">
                <input type="checkbox" class="toggle-input" 
                       ${isChecked ? 'checked' : ''} 
                       onchange="toggleIntake('${schedule.id}', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </div>
    `;
}

// Toggle intake status
window.toggleIntake = async function(scheduleId, isChecked) {
    try {
        const user = await getCurrentUser();
        const today = new Date().toISOString().split('T')[0];
        
        console.log('🔄 Toggling intake:', { scheduleId, isChecked, today });
        
        // Prevent multiple rapid toggles
        if (window.toggleInProgress) {
            console.log('⚠️ Toggle already in progress, ignoring');
            return;
        }
        window.toggleInProgress = true;
        
        if (window.isDemo || !window.supabase) {
            // Demo mode: save to localStorage
            const mockLogs = JSON.parse(localStorage.getItem('mockDailyIntakeLogs') || '{}');
            const logKey = `${scheduleId}-${today}`;
            
            if (isChecked) {
                mockLogs[logKey] = {
                    schedule_id: scheduleId,
                    taken_date: today,
                    is_taken: true,
                    taken_at: new Date().toISOString()
                };
                dailyIntakeLogs[scheduleId] = mockLogs[logKey];
            } else {
                if (mockLogs[logKey]) {
                    mockLogs[logKey].is_taken = false;
                    mockLogs[logKey].taken_at = null;
                }
                if (dailyIntakeLogs[scheduleId]) {
                    dailyIntakeLogs[scheduleId].is_taken = false;
                    dailyIntakeLogs[scheduleId].taken_at = null;
                }
            }
            
            localStorage.setItem('mockDailyIntakeLogs', JSON.stringify(mockLogs));
            console.log('💾 Saved to localStorage:', mockLogs);
        } else {
            // Database mode
            if (isChecked) {
                // Create or update intake log
                const { error } = await supabase
                    .from('daily_intake_logs')
                    .upsert({
                        user_id: user.id,
                        schedule_id: scheduleId,
                        taken_date: today,
                        is_taken: true,
                        taken_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,schedule_id,taken_date'
                    });
                    
                if (error) throw error;
                
                // Update local data
                dailyIntakeLogs[scheduleId] = {
                    schedule_id: scheduleId,
                    is_taken: true,
                    taken_at: new Date().toISOString()
                };
            } else {
                // Update to not taken
                const { error } = await supabase
                    .from('daily_intake_logs')
                    .update({ is_taken: false, taken_at: null })
                    .eq('user_id', user.id)
                    .eq('schedule_id', scheduleId)
                    .eq('taken_date', today);
                    
                if (error) throw error;
                
                // Update local data
                if (dailyIntakeLogs[scheduleId]) {
                    dailyIntakeLogs[scheduleId].is_taken = false;
                    dailyIntakeLogs[scheduleId].taken_at = null;
                }
            }
        }
        
        // Update chart and stats WITHOUT refreshing schedule display
        updateCurrentScoreChart();
        updateStats();
        
        // Force checkbox to maintain correct state
        const checkbox = document.querySelector(`input[onchange="toggleIntake('${scheduleId}', this.checked)"]`);
        if (checkbox && checkbox.checked !== isChecked) {
            checkbox.checked = isChecked;
        }
        
        console.log('✅ Successfully toggled intake status', { scheduleId, finalState: isChecked });
        window.toggleInProgress = false;
        
    } catch (error) {
        console.error('❌ Error toggling intake:', error);
        // Revert checkbox state on error
        const checkbox = document.querySelector(`input[onchange="toggleIntake('${scheduleId}', this.checked)"]`);
        if (checkbox) {
            checkbox.checked = !isChecked;
        }
        window.toggleInProgress = false;
    }
};

// Preserve checkbox states before UI update
function preserveCheckboxStates() {
    savedCheckboxStates = {};
    document.querySelectorAll('.toggle-input').forEach(checkbox => {
        const scheduleId = checkbox.getAttribute('onchange').match(/'([^']+)'/)[1];
        savedCheckboxStates[scheduleId] = checkbox.checked;
    });
    console.log('💾 Preserved checkbox states:', savedCheckboxStates);
}

// Restore checkbox states after UI update  
function restoreCheckboxStates() {
    setTimeout(() => {
        Object.keys(savedCheckboxStates).forEach(scheduleId => {
            const checkbox = document.querySelector(`input[onchange="toggleIntake('${scheduleId}', this.checked)"]`);
            if (checkbox) {
                checkbox.checked = savedCheckboxStates[scheduleId];
            }
        });
        console.log('🔄 Restored checkbox states');
    }, 100);
}

// Initialize Current Score Chart
function initializeCurrentScoreChart() {
    const ctx = document.getElementById('currentScoreChart').getContext('2d');
    
    currentScoreChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [],
            datasets: [{
                label: '摂取量',
                data: [],
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                borderColor: 'rgba(255, 165, 0, 1)',
                pointBackgroundColor: 'rgba(255, 165, 0, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 20, 147, 1)'
            }, {
                label: 'RDA (100%)',
                data: [],
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderColor: 'rgba(0, 255, 0, 0.3)',
                borderDash: [5, 5],
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 150,
                    ticks: {
                        stepSize: 50,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.r.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
    
    updateCurrentScoreChart();
}

// Update Current Score Chart
async function updateCurrentScoreChart() {
    if (!currentScoreChart) return;
    
    try {
        // Get taken supplements for today
        const takenScheduleIds = Object.keys(dailyIntakeLogs)
            .filter(id => dailyIntakeLogs[id].is_taken);
        
        if (takenScheduleIds.length === 0) {
            // Show empty chart
            currentScoreChart.data.labels = ['データなし'];
            currentScoreChart.data.datasets[0].data = [0];
            currentScoreChart.data.datasets[1].data = [100];
            currentScoreChart.update();
            
            document.getElementById('nutrientLegend').innerHTML = `
                <div class="empty-state">
                    <p>本日はまだサプリメントを摂取していません</p>
                </div>
            `;
            return;
        }
        
        // Get supplements data
        const takenSupplements = userSchedules.filter(s => takenScheduleIds.includes(s.id));
        
        let nutrients = {};
        
        if (window.isDemo || !window.supabase) {
            // Demo mode: extract nutrients from supplement data
            console.log('📊 Demo mode: calculating nutrients from supplement data');
            
            takenSupplements.forEach(schedule => {
                const supplement = schedule.supplements;
                
                // Extract nutrients from supplement data
                const extractedNutrients = extractNutrientsFromSupplement(supplement);
                
                extractedNutrients.forEach(nutrient => {
                    if (!nutrients[nutrient.name]) {
                        nutrients[nutrient.name] = {
                            amount: 0,
                            unit: nutrient.unit,
                            rda: nutrient.rda || 100 // Default RDA
                        };
                    }
                    nutrients[nutrient.name].amount += nutrient.amount;
                });
            });
        } else {
            // Database mode or API mode
            console.log('📊 API mode: fetching nutrient data');
            
            for (const schedule of takenSupplements) {
                const supplement = schedule.supplements;
                let supplementNutrients = [];
                
                // Try to get from database first
                if (window.supabase) {
                    try {
                        const { data: dbNutrients } = await supabase
                            .from('supplement_nutrients')
                            .select(`
                                *,
                                nutrients (
                                    name_ja,
                                    name_en,
                                    unit
                                )
                            `)
                            .eq('supplement_id', supplement.id);
                        
                        if (dbNutrients && dbNutrients.length > 0) {
                            dbNutrients.forEach(item => {
                                supplementNutrients.push({
                                    name: item.nutrients.name_ja || item.nutrients.name_en,
                                    amount: item.amount_per_serving,
                                    unit: item.nutrients.unit,
                                    rda: getRDAValue(item.nutrients.name_ja || item.nutrients.name_en)
                                });
                            });
                        }
                    } catch (dbError) {
                        console.log('Database lookup failed, trying API extraction');
                    }
                }
                
                // If no database data, try DSLD API
                if (supplementNutrients.length === 0 && window.dsldApi) {
                    try {
                        const dsldData = await window.dsldApi.getProductDetails(supplement.dsld_id || supplement.id);
                        if (dsldData && dsldData.nutrients) {
                            dsldData.nutrients.forEach(nutrient => {
                                supplementNutrients.push({
                                    name: nutrient.name,
                                    amount: parseFloat(nutrient.amount) || 0,
                                    unit: nutrient.unit,
                                    rda: getRDAValue(nutrient.name)
                                });
                            });
                        }
                    } catch (apiError) {
                        console.log('DSLD API lookup failed, using name extraction');
                    }
                }
                
                // Fallback to name-based extraction
                if (supplementNutrients.length === 0) {
                    supplementNutrients = extractNutrientsFromSupplement(supplement);
                }
                
                // Aggregate all nutrients
                supplementNutrients.forEach(nutrient => {
                    if (!nutrients[nutrient.name]) {
                        nutrients[nutrient.name] = {
                            amount: 0,
                            unit: nutrient.unit,
                            rda: nutrient.rda
                        };
                    }
                    nutrients[nutrient.name].amount += nutrient.amount;
                });
            }
        }
        
        // Update chart
        const labels = Object.keys(nutrients);
        const data = labels.map(label => {
            const nutrient = nutrients[label];
            return (nutrient.amount / nutrient.rda) * 100;
        });
        const rdaData = labels.map(() => 100);
        
        currentScoreChart.data.labels = labels;
        currentScoreChart.data.datasets[0].data = data;
        currentScoreChart.data.datasets[1].data = rdaData;
        currentScoreChart.update();
        
        // Update legend
        updateNutrientLegend(nutrients);
        
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Update nutrient legend
function updateNutrientLegend(nutrients) {
    const legend = document.getElementById('nutrientLegend');
    const colors = [
        '#FF1493', '#00CED1', '#FFD700', '#FF69B4', '#00FA9A',
        '#FF6347', '#DA70D6', '#40E0D0', '#FFA500', '#FF4500'
    ];
    
    legend.innerHTML = Object.entries(nutrients).map(([name, data], index) => {
        const percentage = (data.amount / data.rda * 100).toFixed(1);
        const color = colors[index % colors.length];
        
        return `
            <div class="legend-item">
                <div style="display: flex; align-items: center;">
                    <span class="legend-color" style="background: ${color}"></span>
                    <span class="legend-label">${name}</span>
                </div>
                <div>
                    <span class="legend-value">${data.amount}${data.unit}</span>
                    <span class="legend-percentage">(${percentage}%)</span>
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
async function updateStats() {
    try {
        const user = await getCurrentUser();
        
        // Total supplements
        let totalSupps = 0;
        
        if (window.isDemo || !window.supabase) {
            // Demo mode: count from localStorage
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            totalSupps = mockUserSupps.filter(us => us.user_id === user.id && us.is_my_supps).length;
        } else {
            // Database mode
            if (window.supabase) {
                const { count } = await supabase
                    .from('user_supplements')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_my_supps', true);
                totalSupps = count || 0;
            } else {
                console.log('⚠️ Supabase not available for stats');
                totalSupps = 0;
            }
        }
        
        document.getElementById('totalSupplements').textContent = totalSupps;
        
        // Today's intake rate
        const totalSchedules = userSchedules.length;
        const takenCount = Object.values(dailyIntakeLogs).filter(log => log.is_taken).length;
        const intakeRate = totalSchedules > 0 ? Math.round((takenCount / totalSchedules) * 100) : 0;
        document.getElementById('todayIntake').textContent = intakeRate + '%';
        
        // Streak calculation (simplified)
        document.getElementById('weekStreak').textContent = intakeRate === 100 ? '1' : '0';
        
        // Nutrient count
        const nutrientCount = currentScoreChart?.data.labels.length || 0;
        document.getElementById('nutrientCount').textContent = nutrientCount;
        
        console.log('📊 Stats updated:', { totalSupps, totalSchedules, takenCount, intakeRate });
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Show intake history modal
window.showIntakeHistory = function() {
    // TODO: Implement intake history modal
    alert('過去の摂取ログ機能は近日実装予定です');
}

// Extract nutrients from any supplement data
function extractNutrientsFromSupplement(supplement) {
    const nutrients = [];
    
    // If supplement has explicit nutrients array
    if (supplement.nutrients && Array.isArray(supplement.nutrients)) {
        supplement.nutrients.forEach(nutrient => {
            nutrients.push({
                name: nutrient.name_ja || nutrient.name_en || nutrient.name,
                amount: parseFloat(nutrient.amount) || 0,
                unit: nutrient.unit || 'mg',
                rda: getRDAValue(nutrient.name_ja || nutrient.name_en || nutrient.name)
            });
        });
        return nutrients;
    }
    
    // Extract from supplement name using pattern matching
    const nameToAnalyze = (supplement.name_ja || supplement.name_en || supplement.name || '').toLowerCase();
    
    // Vitamin patterns
    const vitaminPatterns = [
        { pattern: /ビタミンc|vitamin\s*c/i, name: 'ビタミンC', unit: 'mg', rda: 90, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /ビタミンd|vitamin\s*d/i, name: 'ビタミンD', unit: 'IU', rda: 600, extract: /(\d+(?:\.\d+)?)\s*(?:iu|ユニット)/i },
        { pattern: /ビタミンe|vitamin\s*e/i, name: 'ビタミンE', unit: 'mg', rda: 15, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /ビタミンb6|vitamin\s*b6/i, name: 'ビタミンB6', unit: 'mg', rda: 1.3, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /ビタミンb12|vitamin\s*b12/i, name: 'ビタミンB12', unit: 'mcg', rda: 2.4, extract: /(\d+(?:\.\d+)?)\s*(?:mcg|μg)/i },
        { pattern: /葉酸|folic\s*acid|folate/i, name: '葉酸', unit: 'mcg', rda: 400, extract: /(\d+(?:\.\d+)?)\s*(?:mcg|μg)/i }
    ];
    
    // Mineral patterns
    const mineralPatterns = [
        { pattern: /亜鉛|zinc/i, name: '亜鉛', unit: 'mg', rda: 11, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /鉄|iron/i, name: '鉄', unit: 'mg', rda: 8, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /マグネシウム|magnesium/i, name: 'マグネシウム', unit: 'mg', rda: 400, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /カルシウム|calcium/i, name: 'カルシウム', unit: 'mg', rda: 1000, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /セレン|selenium/i, name: 'セレン', unit: 'mcg', rda: 55, extract: /(\d+(?:\.\d+)?)\s*(?:mcg|μg)/i }
    ];
    
    // Other nutrients
    const otherPatterns = [
        { pattern: /オメガ3|omega.*3|epa|dha/i, name: 'オメガ3', unit: 'mg', rda: 1000, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /コエンザイム|coq10|ubiquinone/i, name: 'コエンザイムQ10', unit: 'mg', rda: 100, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /プロバイオティクス|probiotics/i, name: 'プロバイオティクス', unit: 'CFU', rda: 1000000000, extract: /(\d+(?:\.\d+)?)\s*(?:billion|億)\s*cfu/i },
        { pattern: /カルノシン|carnosine/i, name: 'カルノシン', unit: 'mg', rda: 500, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /クルクミン|curcumin|ウコン|turmeric/i, name: 'クルクミン', unit: 'mg', rda: 500, extract: /(\d+(?:\.\d+)?)\s*mg/i },
        { pattern: /アシュワガンダ|ashwagandha/i, name: 'アシュワガンダ', unit: 'mg', rda: 450, extract: /(\d+(?:\.\d+)?)\s*mg/i }
    ];
    
    const allPatterns = [...vitaminPatterns, ...mineralPatterns, ...otherPatterns];
    
    // For multivitamins, check all patterns
    if (nameToAnalyze.includes('マルチ') || nameToAnalyze.includes('multi')) {
        allPatterns.forEach(pattern => {
            if (pattern.pattern.test(nameToAnalyze)) {
                // For multivitamins, use standard amounts
                const standardAmount = getStandardAmount(pattern.name);
                nutrients.push({
                    name: pattern.name,
                    amount: standardAmount,
                    unit: pattern.unit,
                    rda: pattern.rda
                });
            }
        });
    } else {
        // For single supplements, extract specific amounts
        allPatterns.forEach(pattern => {
            if (pattern.pattern.test(nameToAnalyze)) {
                const match = nameToAnalyze.match(pattern.extract);
                const amount = match ? parseFloat(match[1]) : getStandardAmount(pattern.name);
                
                nutrients.push({
                    name: pattern.name,
                    amount: amount,
                    unit: pattern.unit,
                    rda: pattern.rda
                });
            }
        });
    }
    
    return nutrients;
}

// Get standard amount for multivitamins
function getStandardAmount(nutrientName) {
    const standardAmounts = {
        'ビタミンC': 500,
        'ビタミンD': 1000,
        'ビタミンE': 15,
        'ビタミンB6': 1.3,
        'ビタミンB12': 2.4,
        '葉酸': 400,
        '亜鉛': 11,
        '鉄': 8,
        'マグネシウム': 200,
        'カルシウム': 500,
        'セレン': 55
    };
    
    return standardAmounts[nutrientName] || 100;
}

// Get RDA value for nutrients
function getRDAValue(nutrientName) {
    const rdaValues = {
        'ビタミンC': 90,
        'ビタミンD': 600,
        'ビタミンE': 15,
        'ビタミンB6': 1.3,
        'ビタミンB12': 2.4,
        '葉酸': 400,
        '亜鉛': 11,
        '鉄': 8,
        'マグネシウム': 400,
        'カルシウム': 1000,
        'セレン': 55,
        'オメガ3': 1000,
        'コエンザイムQ10': 100,
        'プロバイオティクス': 1000000000,
        'カルノシン': 500,
        'クルクミン': 500,
        'アシュワガンダ': 450
    };
    
    return rdaValues[nutrientName] || 100;
}

// Generate schedules from existing My Supps data
async function generateSchedulesFromMySupps() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        console.log('🔍 Checking for existing My Supps data...');
        
        let mySupplements = [];
        
        // Get My Supps data from localStorage or database
        if (window.isDemo || !window.supabase) {
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            
            mySupplements = mockUserSupps
                .filter(us => us.user_id === user.id && us.is_my_supps)
                .map(us => mockSupplements.find(s => s.id === us.supplement_id))
                .filter(Boolean);
        } else {
            try {
                const { data } = await supabase
                    .from('user_supplements')
                    .select(`
                        supplement_id,
                        supplements (*)
                    `)
                    .eq('user_id', user.id)
                    .eq('is_my_supps', true);
                
                mySupplements = data?.map(item => item.supplements).filter(Boolean) || [];
            } catch (error) {
                console.log('Database query failed, using fallback');
            }
        }
        
        console.log(`📊 Found ${mySupplements.length} supplements in My Supps`);
        
        if (mySupplements.length > 0) {
            // Generate schedules from actual My Supps data
            userSchedules = [];
            
            for (const supplement of mySupplements) {
                const schedules = generateMockSchedules(supplement);
                schedules.forEach(schedule => {
                    schedule.user_id = user.id;
                });
                userSchedules.push(...schedules);
            }
            
            localStorage.setItem('mockUserSchedules', JSON.stringify(userSchedules));
            console.log(`✅ Generated ${userSchedules.length} schedules from My Supps data`);
        } else {
            // No My Supps data, create minimal demo
            console.log('🔧 No My Supps data found, creating minimal demo');
            await createMinimalDemoData();
        }
        
    } catch (error) {
        console.error('❌ Error generating schedules from My Supps:', error);
        await createMinimalDemoData();
    }
}

// Create minimal demo data for empty state
async function createMinimalDemoData() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        console.log('🔧 Creating minimal demo data...');
        
        // Create test supplements with proper serving sizes for dosage splitting
        const testSupplements = [
            {
                id: 'demo-vitamin-c',
                name_ja: 'ビタミンC-1000 徐放性 100錠',
                name_en: 'Vitamin C 1000mg',
                brand: 'Nature\'s Way',
                serving_size: '2 tablets', // This will split into 1 morning + 1 night
                nutrients: [
                    { name_ja: 'ビタミンC', amount: 1000, unit: 'mg' }
                ]
            },
            {
                id: 'demo-buffered-c',
                name_ja: 'バッファードCコンプレックス 1000mg 120カプセル',
                name_en: 'Buffered C Complex 1000mg',
                brand: 'Nature\'s Way',
                serving_size: '2 capsules', // This will split into 1 morning + 1 night
                nutrients: [
                    { name_ja: 'ビタミンC', amount: 1000, unit: 'mg' }
                ]
            },
            {
                id: 'demo-vitamin-d3',
                name_ja: 'Extra Strength ビタミンD3 2000 IU',
                name_en: 'Extra Strength Vitamin D3 2000 IU',
                brand: 'Kirkland Signature',
                serving_size: '1 softgel', // This will stay as 1 dose per day
                nutrients: [
                    { name_ja: 'ビタミンD3', amount: 2000, unit: 'IU' }
                ]
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('mockSupplements', JSON.stringify(testSupplements));
        
        const userSupplements = testSupplements.map(supp => ({
            user_id: user.id,
            supplement_id: supp.id,
            is_my_supps: true,
            is_selected: false
        }));
        localStorage.setItem('mockUserSupplements', JSON.stringify(userSupplements));
        
        // Generate schedules for all test supplements
        userSchedules = [];
        testSupplements.forEach(supplement => {
            const schedules = generateMockSchedules(supplement);
            schedules.forEach(schedule => {
                schedule.user_id = user.id;
            });
            userSchedules.push(...schedules);
        });
        
        localStorage.setItem('mockUserSchedules', JSON.stringify(userSchedules));
        
        console.log(`✅ Minimal demo data created with ${testSupplements.length} supplements and ${userSchedules.length} schedules`);
        
    } catch (error) {
        console.error('❌ Error creating minimal demo data:', error);
    }
}

// DEBUG: Create test schedule data (legacy)
async function createTestScheduleData() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        console.log('🔧 Creating test data for debugging...');
        
        // Create test supplements
        const testSupplements = [
            {
                id: 'test-vitamin-c',
                name_ja: 'ビタミンC 1000mg',
                name_en: 'Vitamin C 1000mg',
                brand: 'Test Brand',
                serving_size: '1 tablet'
            },
            {
                id: 'test-vitamin-d',
                name_ja: 'ビタミンD3 2000IU', 
                name_en: 'Vitamin D3 2000IU',
                brand: 'Test Brand',
                serving_size: '1 capsule'
            },
            {
                id: 'test-multivitamin',
                name_ja: 'マルチビタミン',
                name_en: 'Multivitamin',
                brand: 'Test Brand',
                serving_size: '1 tablet'
            }
        ];
        
        // Save test supplements to localStorage
        localStorage.setItem('mockSupplements', JSON.stringify(testSupplements));
        
        // Create test user supplements
        const testUserSupps = testSupplements.map(supp => ({
            user_id: user.id,
            supplement_id: supp.id,
            is_my_supps: true,
            is_selected: false
        }));
        
        localStorage.setItem('mockUserSupplements', JSON.stringify(testUserSupps));
        
        // Create test schedules
        userSchedules = [
            {
                id: 'test-schedule-1',
                user_id: user.id,
                supplement_id: 'test-vitamin-c',
                time_of_day: 'morning',
                timing_type: '朝食後',
                frequency: '1日2回',
                supplements: testSupplements[0]
            },
            {
                id: 'test-schedule-2',
                user_id: user.id,
                supplement_id: 'test-vitamin-c',
                time_of_day: 'night',
                timing_type: '夕食後',
                frequency: '1日2回',
                supplements: testSupplements[0]
            },
            {
                id: 'test-schedule-3',
                user_id: user.id,
                supplement_id: 'test-vitamin-d',
                time_of_day: 'morning',
                timing_type: '朝食後',
                frequency: '1日1回',
                supplements: testSupplements[1]
            },
            {
                id: 'test-schedule-4',
                user_id: user.id,
                supplement_id: 'test-multivitamin',
                time_of_day: 'morning',
                timing_type: '朝食後',
                frequency: '1日1回',
                supplements: testSupplements[2]
            }
        ];
        
        // Save test schedules
        localStorage.setItem('mockUserSchedules', JSON.stringify(userSchedules));
        
        console.log('✅ Test data created:', userSchedules.length, 'schedules');
        console.log('📝 Test supplements: ビタミンC, ビタミンD, マルチビタミン');
        console.log('🧪 重複テスト: ビタミンCがビタミンCサプリ(1000mg)とマルチビタミン(500mg)に含まれるため、合計1500mgで表示されます');
        
    } catch (error) {
        console.error('❌ Error creating test data:', error);
    }
}

// Toggle intake log for schedule
async function toggleIntakeLog(scheduleId) {
    try {
        // Prevent rapid clicking
        if (window.toggleInProgress) {
            console.log('⏳ Toggle already in progress, skipping...');
            return;
        }
        
        window.toggleInProgress = true;
        
        const today = new Date().toISOString().split('T')[0];
        const logKey = `${scheduleId}-${today}`;
        
        // Toggle the state
        const currentState = dailyIntakeLogs[logKey] || { is_taken: false };
        const newState = !currentState.is_taken;
        
        console.log(`🔄 Toggling intake log for schedule ${scheduleId}: ${currentState.is_taken} → ${newState}`);
        
        // Update local state immediately
        dailyIntakeLogs[logKey] = {
            schedule_id: scheduleId,
            taken_date: today,
            is_taken: newState,
            taken_at: newState ? new Date().toISOString() : null
        };
        
        // Save to localStorage
        localStorage.setItem('mockDailyIntakeLogs', JSON.stringify(dailyIntakeLogs));
        
        // Update the checkbox visually
        const checkbox = document.querySelector(`input[data-schedule-id="${scheduleId}"]`);
        if (checkbox) {
            checkbox.checked = newState;
        }
        
        console.log(`✅ Intake log updated: ${newState ? 'taken' : 'not taken'}`);
        
        // Update the Current Score chart
        updateCurrentScoreChart();
        
        // Add a short delay to prevent rapid toggling
        setTimeout(() => {
            window.toggleInProgress = false;
        }, 300);
        
    } catch (error) {
        console.error('❌ Error toggling intake log:', error);
        window.toggleInProgress = false;
    }
}

// Preserve checkbox states during UI updates
function preserveCheckboxStates() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-schedule-id]');
    savedCheckboxStates = {};
    
    checkboxes.forEach(checkbox => {
        const scheduleId = checkbox.dataset.scheduleId;
        if (scheduleId) {
            savedCheckboxStates[scheduleId] = checkbox.checked;
        }
    });
    
    console.log('📋 Preserved checkbox states:', Object.keys(savedCheckboxStates).length);
}

// Restore checkbox states after UI updates
function restoreCheckboxStates() {
    Object.keys(savedCheckboxStates).forEach(scheduleId => {
        const checkbox = document.querySelector(`input[data-schedule-id="${scheduleId}"]`);
        if (checkbox) {
            checkbox.checked = savedCheckboxStates[scheduleId];
        }
    });
    
    console.log('🔄 Restored checkbox states:', Object.keys(savedCheckboxStates).length);
}

// Debounce function for resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}