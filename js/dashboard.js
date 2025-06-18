// Dashboard functionality

let currentTimeOfDay = 'morning';
let userSchedules = [];
let currentScoreChart = null;
let dailyIntakeLogs = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'auth.html?redirect=dashboard';
            return;
        }

        // Set current time period based on actual time
        setCurrentTimePeriod();
        
        // Initialize charts first
        initializeCurrentScoreChart();
        
        // Load user data
        await loadUserSchedules();
        await loadDailyIntakeLogs();
        
        // Update UI
        updateScheduleDisplay();
        updateStats();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        // Show error state but don't break the page
        document.getElementById('scheduleContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">データの読み込みに失敗しました</p>
                <button class="empty-state-action" onclick="location.reload()">
                    再読み込み
                </button>
            </div>
        `;
    }
});

// Set current time period based on actual time
function setCurrentTimePeriod() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) {
        currentTimeOfDay = 'morning';
    } else if (hour >= 11 && hour < 17) {
        currentTimeOfDay = 'day';
    } else if (hour >= 17 && hour < 22) {
        currentTimeOfDay = 'night';
    } else {
        currentTimeOfDay = 'before_sleep';
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
        
        // Check if we're in demo mode
        if (window.isDemo || !window.supabase) {
            // Demo mode: create mock schedules based on user supplements
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            
            userSchedules = [];
            
            mockUserSupps
                .filter(us => us.user_id === user.id && us.is_my_supps)
                .forEach(us => {
                    const supplement = mockSupplements.find(s => s.id === us.supplement_id);
                    if (supplement) {
                        // Generate schedules based on dosage instructions
                        const schedules = generateMockSchedules(supplement);
                        userSchedules.push(...schedules);
                    }
                });
                
            console.log('Demo mode: loaded mock schedules', userSchedules);
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
    const dosage = supplement.dosage_instructions || '1日1回';
    
    if (dosage.includes('2回')) {
        schedules.push({
            id: `mock-${supplement.id}-morning`,
            supplement_id: supplement.id,
            time_of_day: 'morning',
            timing_type: '朝食後',
            frequency: dosage,
            supplements: {
                id: supplement.id,
                name_ja: supplement.name_ja,
                name_en: supplement.name_en,
                brand: supplement.brand,
                serving_size: supplement.serving_size
            }
        });
        schedules.push({
            id: `mock-${supplement.id}-night`,
            supplement_id: supplement.id,
            time_of_day: 'night',
            timing_type: '夕食後',
            frequency: dosage,
            supplements: {
                id: supplement.id,
                name_ja: supplement.name_ja,
                name_en: supplement.name_en,
                brand: supplement.brand,
                serving_size: supplement.serving_size
            }
        });
    } else {
        schedules.push({
            id: `mock-${supplement.id}-morning`,
            supplement_id: supplement.id,
            time_of_day: 'morning',
            timing_type: '朝食後',
            frequency: dosage,
            supplements: {
                id: supplement.id,
                name_ja: supplement.name_ja,
                name_en: supplement.name_en,
                brand: supplement.brand,
                serving_size: supplement.serving_size
            }
        });
    }
    
    return schedules;
}

// Load daily intake logs for today
async function loadDailyIntakeLogs() {
    try {
        const user = await getCurrentUser();
        const today = new Date().toISOString().split('T')[0];
        
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
    const scheduleContent = document.getElementById('scheduleContent');
    
    if (!scheduleContent) {
        console.error('Schedule content element not found');
        return;
    }
    
    console.log('Updating schedule display for time:', currentTimeOfDay);
    console.log('All schedules:', userSchedules);
    
    const schedulesForTime = userSchedules.filter(s => s.time_of_day === currentTimeOfDay);
    console.log('Schedules for current time:', schedulesForTime);
    
    if (schedulesForTime.length === 0) {
        scheduleContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p class="empty-state-text">この時間帯に摂取するサプリメントはありません</p>
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
    
    scheduleContent.innerHTML = schedulesForTime.map(schedule => {
        const isChecked = dailyIntakeLogs[schedule.id]?.is_taken || false;
        const timingDisplay = schedule.timing_type || '指定なし';
        const supplementName = schedule.supplements.name_ja || schedule.supplements.name_en || schedule.supplements.name || 'Unknown Supplement';
        
        return `
            <div class="schedule-item" data-schedule-id="${schedule.id}">
                <div class="supplement-info">
                    <div class="supplement-name">${supplementName}</div>
                    <div class="supplement-timing">
                        <span class="timing-badge">${timingDisplay}</span>
                        <span>${schedule.supplements.serving_size || ''}</span>
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
    }).join('');
}

// Toggle intake status
window.toggleIntake = async function(scheduleId, isChecked) {
    try {
        const user = await getCurrentUser();
        const today = new Date().toISOString().split('T')[0];
        
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
        
        // Update chart and stats
        updateCurrentScoreChart();
        updateStats();
        
    } catch (error) {
        console.error('Error toggling intake:', error);
        // Revert checkbox state on error
        const checkbox = document.querySelector(`input[onchange="toggleIntake('${scheduleId}', this.checked)"]`);
        if (checkbox) {
            checkbox.checked = !isChecked;
        }
    }
};

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
                backgroundColor: 'rgba(255, 20, 147, 0.2)',
                borderColor: 'rgba(255, 20, 147, 1)',
                pointBackgroundColor: 'rgba(255, 20, 147, 1)',
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
        const supplements = userSchedules
            .filter(s => takenScheduleIds.includes(s.id))
            .map(s => s.supplements.id);
        
        // Load nutrient data for these supplements
        const { data: nutrientData, error } = await supabase
            .from('supplement_nutrients')
            .select(`
                *,
                nutrients (
                    name_ja,
                    name_en,
                    unit
                )
            `)
            .in('supplement_id', supplements);
        
        if (error) throw error;
        
        // Aggregate nutrients
        const nutrients = {};
        nutrientData.forEach(item => {
            const name = item.nutrients.name_ja || item.nutrients.name_en;
            if (!nutrients[name]) {
                nutrients[name] = {
                    amount: 0,
                    unit: item.nutrients.unit,
                    rda: 100 // Default RDA, will be updated from NIH ODS data
                };
            }
            nutrients[name].amount += item.amount_per_serving;
        });
        
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
        const { count: totalSupps } = await supabase
            .from('user_supplements')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_my_supps', true);
        
        document.getElementById('totalSupplements').textContent = totalSupps || 0;
        
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
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}