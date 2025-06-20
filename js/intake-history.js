// Intake History Page Functionality

let currentMonth = new Date();
let currentPage = 0;
const pageSize = 20;
let allIntakeLogs = [];
let filteredLogs = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'auth.html?redirect=intake-history';
            return;
        }

        // Initialize date filters to last 30 days
        setDateRange('month');
        
        // Load data
        await loadSupplementFilter();
        await loadIntakeHistory();
        
        // Generate calendar
        generateCalendar();
        
        // Initialize charts
        initializeCharts();
        
        console.log('✅ Intake history page initialized');
        
    } catch (error) {
        console.error('❌ Failed to initialize intake history page:', error);
        showError('データの読み込みに失敗しました');
    }
});

// Load supplement filter options
async function loadSupplementFilter() {
    try {
        const user = await getCurrentUser();
        const select = document.getElementById('supplement-filter');
        
        let supplements = [];
        
        if (window.isDemo || !window.supabase) {
            // Demo mode
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            
            supplements = mockUserSupps
                .filter(us => us.user_id === user.id && us.is_my_supps)
                .map(us => mockSupplements.find(s => s.id === us.supplement_id))
                .filter(Boolean);
        } else {
            // Database mode
            const { data } = await supabase
                .from('user_supplements')
                .select(`
                    supplement_id,
                    supplements (
                        id,
                        name_ja,
                        name_en,
                        brand
                    )
                `)
                .eq('user_id', user.id)
                .eq('is_my_supps', true);
            
            supplements = data?.map(item => item.supplements).filter(Boolean) || [];
        }
        
        // Populate filter
        select.innerHTML = '<option value="">全て</option>';
        supplements.forEach(supplement => {
            const option = document.createElement('option');
            option.value = supplement.id;
            const displayName = formatSupplementName(supplement);
            option.textContent = displayName;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Failed to load supplement filter:', error);
    }
}

// Load intake history data
async function loadIntakeHistory() {
    try {
        const user = await getCurrentUser();
        
        if (window.isDemo || !window.supabase) {
            // Demo mode
            await loadDemoIntakeHistory(user);
        } else {
            // Database mode
            await loadDatabaseIntakeHistory(user);
        }
        
        // Apply current filters
        filterLogs();
        
        console.log(`📊 Loaded ${allIntakeLogs.length} intake records`);
        
    } catch (error) {
        console.error('❌ Failed to load intake history:', error);
        showError('摂取履歴の読み込みに失敗しました');
    }
}

// Load demo intake history
async function loadDemoIntakeHistory(user) {
    const mockLogs = JSON.parse(localStorage.getItem('mockDailyIntakeLogs') || '{}');
    const mockSchedules = JSON.parse(localStorage.getItem('mockUserSchedules') || '[]');
    const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
    
    allIntakeLogs = Object.values(mockLogs)
        .filter(log => {
            const schedule = mockSchedules.find(s => s.id === log.schedule_id);
            return schedule && schedule.user_id === user.id;
        })
        .map(log => {
            const schedule = mockSchedules.find(s => s.id === log.schedule_id);
            const supplement = schedule ? mockSupplements.find(s => s.id === schedule.supplement_id) : null;
            
            return {
                ...log,
                schedule: schedule,
                supplement: supplement,
                timing_type: schedule?.timing_type,
                supplement_name: formatSupplementName(supplement)
            };
        })
        .sort((a, b) => new Date(b.taken_date) - new Date(a.taken_date));
}

// Load database intake history
async function loadDatabaseIntakeHistory(user) {
    const { data } = await supabase
        .from('daily_intake_logs')
        .select(`
            *,
            user_intake_schedules (
                timing_type,
                frequency,
                supplements (
                    id,
                    name_ja,
                    name_en,
                    brand,
                    serving_size
                )
            )
        `)
        .eq('user_id', user.id)
        .order('taken_date', { ascending: false })
        .order('taken_at', { ascending: false });
    
    allIntakeLogs = data?.map(log => ({
        ...log,
        schedule: log.user_intake_schedules,
        supplement: log.user_intake_schedules?.supplements,
        timing_type: log.user_intake_schedules?.timing_type,
        supplement_name: formatSupplementName(log.user_intake_schedules?.supplements)
    })) || [];
}

// Set date range filter
window.setDateRange = function(range) {
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const today = new Date();
    
    endDate.value = today.toISOString().split('T')[0];
    
    switch (range) {
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            startDate.value = weekAgo.toISOString().split('T')[0];
            break;
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            startDate.value = monthAgo.toISOString().split('T')[0];
            break;
        case 'all':
            startDate.value = '';
            break;
    }
    
    if (allIntakeLogs.length > 0) {
        filterLogs();
    }
};

// Filter logs based on current filters
window.filterLogs = function() {
    const startDateStr = document.getElementById('start-date').value;
    const endDateStr = document.getElementById('end-date').value;
    const supplementId = document.getElementById('supplement-filter').value;
    
    filteredLogs = allIntakeLogs.filter(log => {
        // Date filter
        if (startDateStr && log.taken_date < startDateStr) return false;
        if (endDateStr && log.taken_date > endDateStr) return false;
        
        // Supplement filter
        if (supplementId && log.supplement?.id !== supplementId) return false;
        
        return true;
    });
    
    // Update displays
    updateStatistics();
    updateHistoryList();
    generateCalendar();
    updateCharts();
    
    currentPage = 0; // Reset pagination
};

// Update statistics
function updateStatistics() {
    const totalDays = new Set(filteredLogs.map(log => log.taken_date)).size;
    const totalIntakes = filteredLogs.filter(log => log.is_taken).length;
    const totalScheduled = filteredLogs.length;
    const adherenceRate = totalScheduled > 0 ? Math.round((totalIntakes / totalScheduled) * 100) : 0;
    
    // Calculate streak
    const streakDays = calculateStreak();
    
    document.getElementById('total-days').textContent = totalDays;
    document.getElementById('total-intakes').textContent = totalIntakes;
    document.getElementById('adherence-rate').textContent = adherenceRate + '%';
    document.getElementById('streak-days').textContent = streakDays;
}

// Calculate consecutive intake streak
function calculateStreak() {
    if (filteredLogs.length === 0) return 0;
    
    // Group by date and calculate daily adherence
    const dailyStats = {};
    filteredLogs.forEach(log => {
        if (!dailyStats[log.taken_date]) {
            dailyStats[log.taken_date] = { taken: 0, total: 0 };
        }
        dailyStats[log.taken_date].total++;
        if (log.is_taken) {
            dailyStats[log.taken_date].taken++;
        }
    });
    
    // Calculate streak from most recent date
    const dates = Object.keys(dailyStats).sort().reverse();
    let streak = 0;
    
    for (const date of dates) {
        const stats = dailyStats[date];
        const adherence = stats.taken / stats.total;
        
        if (adherence >= 0.8) { // 80% adherence considered good
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Update history list
function updateHistoryList() {
    const container = document.getElementById('history-entries');
    
    if (filteredLogs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">摂取記録がありません</div>
            </div>
        `;
        return;
    }
    
    // Group by date
    const groupedLogs = {};
    filteredLogs.forEach(log => {
        if (!groupedLogs[log.taken_date]) {
            groupedLogs[log.taken_date] = [];
        }
        groupedLogs[log.taken_date].push(log);
    });
    
    // Generate HTML
    const entries = Object.entries(groupedLogs)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .slice(0, (currentPage + 1) * pageSize)
        .map(([date, logs]) => {
            const taken = logs.filter(log => log.is_taken).length;
            const total = logs.length;
            const rate = Math.round((taken / total) * 100);
            
            let rateClass = 'poor';
            if (rate >= 80) rateClass = 'excellent';
            else if (rate >= 50) rateClass = 'good';
            
            const supplements = [...new Set(logs.map(log => log.supplement_name))].join(', ');
            
            return `
                <div class="history-entry">
                    <div class="history-entry-info">
                        <div class="history-entry-date">${formatDate(date)}</div>
                        <div class="history-entry-supplements">${supplements}</div>
                    </div>
                    <div class="history-entry-stats">
                        <div class="history-entry-rate ${rateClass}">${rate}%</div>
                        <div class="history-entry-count">${taken}/${total} 摂取</div>
                    </div>
                </div>
            `;
        });
    
    container.innerHTML = entries.join('');
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('load-more');
    const hasMore = Object.keys(groupedLogs).length > (currentPage + 1) * pageSize;
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

// Load more history entries
window.loadMoreHistory = function() {
    currentPage++;
    updateHistoryList();
};

// Generate calendar view
window.generateCalendar = function() {
    const grid = document.getElementById('calendar-grid');
    const monthElement = document.getElementById('calendar-month');
    
    // Update month display
    monthElement.textContent = currentMonth.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long' 
    });
    
    // Generate calendar
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Group logs by date
    const logsByDate = {};
    filteredLogs.forEach(log => {
        if (!logsByDate[log.taken_date]) {
            logsByDate[log.taken_date] = [];
        }
        logsByDate[log.taken_date].push(log);
    });
    
    // Generate calendar HTML
    let html = '';
    
    // Day headers
    const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Calendar days
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) { // 6 weeks
        const dateStr = current.toISOString().split('T')[0];
        const isCurrentMonth = current.getMonth() === month;
        const isToday = current.toDateString() === new Date().toDateString();
        const logs = logsByDate[dateStr] || [];
        
        let classes = 'calendar-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (logs.length > 0) classes += ' has-intake';
        
        // Generate intake indicators
        const indicators = logs.map(log => {
            let indicatorClass = 'intake-indicator';
            if (!log.is_taken) indicatorClass += ' missed';
            else if (logs.filter(l => l.is_taken).length < logs.length) indicatorClass += ' partial';
            
            return `<div class="${indicatorClass}"></div>`;
        }).join('');
        
        html += `
            <div class="${classes}">
                <div class="day-number">${current.getDate()}</div>
                <div class="intake-indicators">${indicators}</div>
            </div>
        `;
        
        current.setDate(current.getDate() + 1);
    }
    
    grid.innerHTML = html;
};

// Change calendar month
window.changeMonth = function(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    generateCalendar();
};

// Initialize charts
function initializeCharts() {
    initializeAdherenceChart();
    initializeFrequencyChart();
}

// Initialize adherence trend chart
function initializeAdherenceChart() {
    const ctx = document.getElementById('adherence-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '摂取率',
                data: [],
                borderColor: 'rgb(255, 107, 157)',
                backgroundColor: 'rgba(255, 107, 157, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize frequency chart
function initializeFrequencyChart() {
    const ctx = document.getElementById('frequency-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6B9D',
                    '#4ECDC4',
                    '#45B7D1',
                    '#96CEB4',
                    '#FFEAA7',
                    '#DDA0DD',
                    '#98D8C8'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update charts with current data
function updateCharts() {
    updateAdherenceChart();
    updateFrequencyChart();
}

// Update adherence chart
function updateAdherenceChart() {
    // Group by week and calculate adherence
    const weeklyData = {};
    
    filteredLogs.forEach(log => {
        const date = new Date(log.taken_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { taken: 0, total: 0 };
        }
        
        weeklyData[weekKey].total++;
        if (log.is_taken) {
            weeklyData[weekKey].taken++;
        }
    });
    
    const weeks = Object.keys(weeklyData).sort();
    const adherenceData = weeks.map(week => {
        const stats = weeklyData[week];
        return Math.round((stats.taken / stats.total) * 100);
    });
    
    const chart = Chart.getChart('adherence-chart');
    if (chart) {
        chart.data.labels = weeks.map(week => formatWeek(week));
        chart.data.datasets[0].data = adherenceData;
        chart.update();
    }
}

// Update frequency chart
function updateFrequencyChart() {
    const supplementCounts = {};
    
    filteredLogs
        .filter(log => log.is_taken)
        .forEach(log => {
            const name = log.supplement_name;
            supplementCounts[name] = (supplementCounts[name] || 0) + 1;
        });
    
    const chart = Chart.getChart('frequency-chart');
    if (chart) {
        chart.data.labels = Object.keys(supplementCounts);
        chart.data.datasets[0].data = Object.values(supplementCounts);
        chart.update();
    }
}

// Utility functions
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });
}

function formatWeek(weekStart) {
    const date = new Date(weekStart);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Format supplement name in proper commercial format
function formatSupplementName(supplement) {
    if (!supplement) return 'Unknown Supplement';
    
    // Use Japanese name if available, otherwise English
    const name = supplement.name_ja || supplement.name_en;
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

function showError(message) {
    const container = document.getElementById('history-entries');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
    }
}