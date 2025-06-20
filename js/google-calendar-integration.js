// Google Calendar Integration for Supplement Intake Tracking
// Requires Google Calendar API v3

class GoogleCalendarIntegration {
    constructor() {
        this.isSignedIn = false;
        this.calendarId = 'primary'; // Use primary calendar
        this.eventColor = '9'; // Blue color for supplement events
        
        // Google API configuration
        this.clientId = ''; // Will be set from config
        this.apiKey = ''; // Will be set from config
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/calendar.events';
        
        this.initializeGapi();
    }

    async initializeGapi() {
        try {
            // Wait for config to be available
            while (!window.APP_CONFIG) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Get Google Calendar config
            const googleConfig = window.APP_CONFIG.GOOGLE_CALENDAR;
            if (googleConfig) {
                this.clientId = googleConfig.CLIENT_ID;
                this.apiKey = googleConfig.API_KEY;
            }
            
            // Initialize Google API
            await new Promise((resolve) => {
                gapi.load('client:auth2', resolve);
            });
            
            await gapi.client.init({
                apiKey: this.apiKey,
                clientId: this.clientId,
                discoveryDocs: [this.discoveryDoc],
                scope: this.scopes
            });
            
            // Listen for sign-in state changes
            const authInstance = gapi.auth2.getAuthInstance();
            authInstance.isSignedIn.listen(this.updateSigninStatus.bind(this));
            
            // Handle initial sign-in state
            this.updateSigninStatus(authInstance.isSignedIn.get());
            
            console.log('✅ Google Calendar API initialized');
            
        } catch (error) {
            console.error('❌ Google Calendar API initialization failed:', error);
            this.showCalendarStatus('Google Calendar連携の初期化に失敗しました', 'error');
        }
    }

    updateSigninStatus(isSignedIn) {
        this.isSignedIn = isSignedIn;
        const authButton = document.getElementById('google-calendar-auth');
        const syncButton = document.getElementById('sync-to-calendar');
        
        if (isSignedIn) {
            if (authButton) {
                authButton.textContent = '📅 Google Calendar 連携中';
                authButton.disabled = true;
            }
            if (syncButton) {
                syncButton.style.display = 'inline-block';
            }
            this.showCalendarStatus('Google Calendar に接続されています', 'connected');
        } else {
            if (authButton) {
                authButton.textContent = '📅 Google Calendar と連携';
                authButton.disabled = false;
            }
            if (syncButton) {
                syncButton.style.display = 'none';
            }
            this.showCalendarStatus('Google Calendar に接続されていません', '');
        }
    }

    showCalendarStatus(message, className = '') {
        const statusElement = document.getElementById('calendar-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `calendar-status ${className}`;
        }
    }

    async authorize() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            console.log('✅ Google Calendar authorization successful');
        } catch (error) {
            console.error('❌ Google Calendar authorization failed:', error);
            this.showCalendarStatus('認証に失敗しました', 'error');
        }
    }

    async signOut() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            console.log('✅ Google Calendar sign out successful');
        } catch (error) {
            console.error('❌ Google Calendar sign out failed:', error);
        }
    }

    // Create calendar event for supplement intake
    async createIntakeEvent(supplement, date, time, status = 'taken') {
        if (!this.isSignedIn) {
            throw new Error('Google Calendar not authorized');
        }

        const eventDate = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(eventDate);
        endDate.setMinutes(endDate.getMinutes() + 15); // 15 minute duration

        const supplementName = this.formatSupplementName(supplement);
        const event = {
            summary: `💊 ${supplementName} ${status === 'taken' ? '✅' : '❌'}`,
            description: `サプリメント摂取記録\n\n` +
                        `商品名: ${supplementName}\n` +
                        `ブランド: ${supplement.brand || 'Unknown'}\n` +
                        `摂取量: ${supplement.serving_size || '1回分'}\n` +
                        `ステータス: ${status === 'taken' ? '摂取済み' : '未摂取'}\n\n` +
                        `🔗 MY SUPPS で管理`,
            start: {
                dateTime: eventDate.toISOString(),
                timeZone: 'Asia/Tokyo'
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Asia/Tokyo'
            },
            colorId: status === 'taken' ? '10' : '11', // Green for taken, Red for missed
            source: {
                title: 'MY SUPPS',
                url: window.location.origin
            }
        };

        try {
            const response = await gapi.client.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            console.log('✅ Calendar event created:', response.result);
            return response.result;
        } catch (error) {
            console.error('❌ Failed to create calendar event:', error);
            throw error;
        }
    }

    // Sync intake logs to Google Calendar
    async syncIntakeLogs(intakeLogs) {
        if (!this.isSignedIn) {
            throw new Error('Google Calendar not authorized');
        }

        const syncResults = {
            success: 0,
            failed: 0,
            errors: []
        };

        this.showCalendarStatus('カレンダーに同期中...', '');

        for (const log of intakeLogs) {
            try {
                // Get supplement data
                const supplement = log.supplement || {
                    name_ja: 'サプリメント',
                    name_en: 'Supplement',
                    brand: 'Unknown',
                    serving_size: '1回分'
                };

                // Determine time based on timing_type
                const time = this.getIntakeTime(log.timing_type);
                const status = log.is_taken ? 'taken' : 'missed';

                await this.createIntakeEvent(supplement, log.taken_date, time, status);
                syncResults.success++;

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error('Failed to sync log:', log, error);
                syncResults.failed++;
                syncResults.errors.push({
                    log: log,
                    error: error.message
                });
            }
        }

        // Show sync results
        const message = `同期完了: ${syncResults.success}件成功, ${syncResults.failed}件失敗`;
        const className = syncResults.failed === 0 ? 'connected' : 'error';
        this.showCalendarStatus(message, className);

        return syncResults;
    }

    // Get appropriate time for intake based on timing type
    getIntakeTime(timingType) {
        const timeMap = {
            '朝食後': '08:30',
            '昼食後': '13:30', 
            '夕食後': '19:30',
            '就寝前': '22:00',
            '空腹時': '07:00'
        };

        return timeMap[timingType] || '08:00';
    }

    // Format supplement name in proper commercial format
    formatSupplementName(supplement) {
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

    // Batch sync recent intake logs
    async syncRecentLogs(days = 30) {
        try {
            const user = await getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Get intake logs from the last N days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            let intakeLogs = [];

            if (window.isDemo || !window.supabase) {
                // Demo mode: get from localStorage
                const mockLogs = JSON.parse(localStorage.getItem('mockDailyIntakeLogs') || '{}');
                const mockSchedules = JSON.parse(localStorage.getItem('mockUserSchedules') || '[]');
                const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');

                intakeLogs = Object.values(mockLogs)
                    .filter(log => {
                        const logDate = new Date(log.taken_date);
                        return logDate >= startDate && logDate <= endDate;
                    })
                    .map(log => {
                        const schedule = mockSchedules.find(s => s.id === log.schedule_id);
                        const supplement = schedule ? mockSupplements.find(s => s.id === schedule.supplement_id) : null;
                        
                        return {
                            ...log,
                            timing_type: schedule?.timing_type || '朝食後',
                            supplement: supplement
                        };
                    });
            } else {
                // Database mode
                const { data } = await supabase
                    .from('daily_intake_logs')
                    .select(`
                        *,
                        user_intake_schedules (
                            timing_type,
                            supplements (
                                name_ja,
                                name_en,
                                brand,
                                serving_size
                            )
                        )
                    `)
                    .eq('user_id', user.id)
                    .gte('taken_date', startDate.toISOString().split('T')[0])
                    .lte('taken_date', endDate.toISOString().split('T')[0]);

                intakeLogs = data?.map(log => ({
                    ...log,
                    timing_type: log.user_intake_schedules?.timing_type || '朝食後',
                    supplement: log.user_intake_schedules?.supplements
                })) || [];
            }

            console.log(`📊 Found ${intakeLogs.length} intake logs to sync`);
            
            if (intakeLogs.length === 0) {
                this.showCalendarStatus('同期するデータがありません', '');
                return;
            }

            const results = await this.syncIntakeLogs(intakeLogs);
            return results;

        } catch (error) {
            console.error('❌ Failed to sync recent logs:', error);
            this.showCalendarStatus('同期に失敗しました: ' + error.message, 'error');
            throw error;
        }
    }
}

// Global instance
let googleCalendar = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    googleCalendar = new GoogleCalendarIntegration();
});

// Global functions for button actions
window.authorizeGoogleCalendar = async function() {
    if (!googleCalendar) {
        alert('Google Calendar の初期化中です。しばらくお待ちください。');
        return;
    }
    
    try {
        await googleCalendar.authorize();
    } catch (error) {
        alert('Google Calendar の認証に失敗しました: ' + error.message);
    }
};

window.syncToGoogleCalendar = async function() {
    if (!googleCalendar) {
        alert('Google Calendar が初期化されていません。');
        return;
    }

    if (!googleCalendar.isSignedIn) {
        alert('まずGoogle Calendar との連携を有効にしてください。');
        return;
    }

    try {
        const results = await googleCalendar.syncRecentLogs(30);
        if (results) {
            alert(`同期が完了しました。\n成功: ${results.success}件\n失敗: ${results.failed}件`);
        }
    } catch (error) {
        alert('同期に失敗しました: ' + error.message);
    }
};

// Export for use in other modules
window.googleCalendar = googleCalendar;