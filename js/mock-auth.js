// Mock Authentication System for Demo
// This provides a demo mode when Supabase is not configured

class MockAuth {
    constructor() {
        this.currentUser = this.loadUser();
    }

    // Load user from localStorage
    loadUser() {
        const savedUser = localStorage.getItem('mockUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }

    // Save user to localStorage
    saveUser(user) {
        if (user) {
            localStorage.setItem('mockUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('mockUser');
        }
        this.currentUser = user;
    }

    // Sign in with email/password (mock)
    async signInWithPassword({ email, password }) {
        // Simple validation
        if (!email || !password) {
            return { 
                data: null, 
                error: { message: 'メールアドレスとパスワードを入力してください' } 
            };
        }

        // Mock user data
        const user = {
            id: 'mock-user-' + email.replace('@', '-at-'),
            email: email,
            user_metadata: {
                name: email.split('@')[0]
            },
            created_at: new Date().toISOString()
        };

        this.saveUser(user);

        return {
            data: { user, session: { access_token: 'mock-token' } },
            error: null
        };
    }

    // Sign up (mock)
    async signUp({ email, password }) {
        // In demo mode, signup works the same as signin
        return this.signInWithPassword({ email, password });
    }

    // Sign in with OAuth (mock)
    async signInWithOAuth({ provider }) {
        // Mock Google OAuth
        if (provider === 'google') {
            // Simulate OAuth flow with alert
            const email = prompt('デモモード: Googleアカウントのメールアドレスを入力してください\n（例: demo@gmail.com）');
            
            if (!email) {
                return {
                    data: null,
                    error: { message: 'ログインがキャンセルされました' }
                };
            }

            const user = {
                id: 'mock-google-user-' + Date.now(),
                email: email,
                user_metadata: {
                    name: email.split('@')[0],
                    provider: 'google'
                },
                created_at: new Date().toISOString()
            };

            this.saveUser(user);

            // Simulate redirect
            setTimeout(() => {
                window.location.href = 'my-supps.html';
            }, 1000);

            return {
                data: { provider: 'google', url: '#' },
                error: null
            };
        }

        return {
            data: null,
            error: { message: 'サポートされていないプロバイダーです' }
        };
    }

    // Sign out (mock)
    async signOut() {
        this.saveUser(null);
        return { error: null };
    }

    // Get current user (mock)
    async getUser() {
        return {
            data: { user: this.currentUser },
            error: null
        };
    }

    // Auth state change listener (mock)
    onAuthStateChange(callback) {
        // Call callback with current state
        callback('INITIAL_SESSION', this.currentUser ? { user: this.currentUser } : null);
        
        // Return unsubscribe function
        return {
            data: { subscription: { unsubscribe: () => {} } },
            error: null
        };
    }
}

// Mock Supabase Client
class MockSupabaseClient {
    constructor() {
        this.auth = new MockAuth();
        this.mockData = this.loadMockData();
    }

    loadMockData() {
        // Load supplements from localStorage
        const supplements = localStorage.getItem('mockSupplements');
        const userSupplements = localStorage.getItem('mockUserSupplements');
        
        return {
            supplements: supplements ? JSON.parse(supplements) : this.getDefaultSupplements(),
            userSupplements: userSupplements ? JSON.parse(userSupplements) : []
        };
    }

    saveMockData() {
        localStorage.setItem('mockSupplements', JSON.stringify(this.mockData.supplements));
        localStorage.setItem('mockUserSupplements', JSON.stringify(this.mockData.userSupplements));
    }

    getDefaultSupplements() {
        return [
            {
                id: 'DSLD-12345',
                dsld_id: 'DSLD-12345',
                name_en: 'Vitamin C 1000mg Tablets',
                name_ja: 'ビタミンC 1000mg タブレット',
                brand: 'Nature\'s Way',
                serving_size: '1 tablet',
                servings_per_container: 100,
                image_url: null,
                label_url: null,
                dosage_instructions: '1日1回'
            },
            {
                id: 'DSLD-12346',
                dsld_id: 'DSLD-12346',
                name_en: 'Vitamin D3 5000 IU Softgels',
                name_ja: 'ビタミンD3 5000IU ソフトジェル',
                brand: 'NOW Foods',
                serving_size: '1 softgel',
                servings_per_container: 120,
                image_url: null,
                label_url: null,
                dosage_instructions: '1日1回'
            },
            {
                id: 'DSLD-12347',
                dsld_id: 'DSLD-12347',
                name_en: 'Magnesium Glycinate 200mg',
                name_ja: 'マグネシウム グリシネート 200mg',
                brand: "Doctor's Best",
                serving_size: '2 tablets',
                servings_per_container: 120,
                image_url: null,
                label_url: null,
                dosage_instructions: '1日2回'
            },
            {
                id: 'DSLD-12348',
                dsld_id: 'DSLD-12348',
                name_en: 'Omega-3 Fish Oil 1000mg',
                name_ja: 'オメガ3 フィッシュオイル 1000mg',
                brand: 'Nordic Naturals',
                serving_size: '2 softgels',
                servings_per_container: 60,
                image_url: null,
                label_url: null,
                dosage_instructions: '1日2回'
            },
            {
                id: 'DSLD-12349',
                dsld_id: 'DSLD-12349',
                name_en: 'Zinc Picolinate 15mg',
                name_ja: '亜鉛 ピコリネート 15mg',
                brand: 'Thorne',
                serving_size: '1 capsule',
                servings_per_container: 60,
                image_url: null,
                label_url: null,
                dosage_instructions: '1日1回'
            }
        ];
    }

    // Mock database operations
    from(table) {
        const self = this;
        
        return {
            select: (columns) => {
                let query = {
                    data: null,
                    error: null
                };
                
                // Handle user_supplements with supplement joins
                if (table === 'user_supplements' && columns.includes('supplements')) {
                    query.eq = (column, value) => {
                        if (column === 'user_id') {
                            const userSupps = self.mockData.userSupplements.filter(us => us.user_id === value);
                            const result = userSupps.map(us => {
                                const supplement = self.mockData.supplements.find(s => s.id === us.supplement_id);
                                return {
                                    supplement_id: us.supplement_id,
                                    supplements: supplement || {
                                        id: us.supplement_id,
                                        name_ja: 'Unknown Supplement',
                                        brand: 'Unknown Brand'
                                    }
                                };
                            });
                            
                            return {
                                eq: (col2, val2) => {
                                    if (col2 === 'is_my_supps' && val2 === true) {
                                        return {
                                            data: result.filter((_, i) => self.mockData.userSupplements[i]?.is_my_supps),
                                            error: null
                                        };
                                    }
                                    return { data: result, error: null };
                                },
                                data: result,
                                error: null
                            };
                        }
                        return { data: [], error: null };
                    };
                    return query;
                }
                
                // Handle supplement_nutrients joins
                if (table === 'supplement_nutrients') {
                    query.select = (cols) => ({
                        in: (column, values) => ({
                            data: [], // Mock empty data for now
                            error: null
                        })
                    });
                    return query;
                }
                
                // Handle user_intake_schedules
                if (table === 'user_intake_schedules') {
                    query.eq = (column, value) => ({
                        eq: (col2, val2) => ({
                            data: [], // Mock empty schedules for now
                            error: null
                        }),
                        data: [],
                        error: null
                    });
                    return query;
                }
                
                // Handle daily_intake_logs
                if (table === 'daily_intake_logs') {
                    query.eq = (column, value) => ({
                        eq: (col2, val2) => ({
                            data: [], // Mock empty logs for now
                            error: null
                        }),
                        data: [],
                        error: null
                    });
                    return query;
                }
                
                // Handle supplements table
                if (table === 'supplements') {
                    query.eq = (column, value) => ({
                        data: null,
                        error: null,
                        limit: (n) => ({ data: null, error: null })
                    });
                    
                    query.or = (condition) => ({
                        limit: (n) => ({
                            data: self.mockData.supplements.filter(s => {
                                const searchTerm = condition.split('%')[1].toLowerCase();
                                return s.name_ja.toLowerCase().includes(searchTerm) || 
                                       s.name_en.toLowerCase().includes(searchTerm) ||
                                       s.brand.toLowerCase().includes(searchTerm);
                            }).slice(0, n),
                            error: null
                        })
                    });
                    
                    query.in = (column, values) => ({
                        data: [],
                        error: null
                    });
                }
                
                return query;
            },
            upsert: (data, options) => {
                if (table === 'user_supplements') {
                    const existingIndex = self.mockData.userSupplements.findIndex(
                        us => us.user_id === data.user_id && us.supplement_id === data.supplement_id
                    );
                    
                    if (existingIndex >= 0) {
                        self.mockData.userSupplements[existingIndex] = { ...self.mockData.userSupplements[existingIndex], ...data };
                    } else {
                        self.mockData.userSupplements.push(data);
                    }
                    
                    self.saveMockData();
                } else if (table === 'user_intake_schedules') {
                    // Mock schedule creation - for now just return success
                    console.log('Mock: Creating intake schedule', data);
                }
                return { data: data, error: null };
            },
            delete: () => ({
                eq: (column, value) => ({
                    eq: (column2, value2) => {
                        if (table === 'user_supplements') {
                            self.mockData.userSupplements = self.mockData.userSupplements.filter(
                                us => !(us.user_id === value && us.supplement_id === value2)
                            );
                            self.saveMockData();
                        }
                        return { data: null, error: null };
                    }
                })
            }),
            update: (updateData) => ({
                eq: (column, value) => ({
                    eq: (col2, val2) => ({
                        eq: (col3, val3) => ({
                            data: null,
                            error: null
                        }),
                        data: null,
                        error: null
                    }),
                    data: null,
                    error: null
                })
            })
        };
    }
}

// Export mock client for demo mode
window.MockSupabaseClient = MockSupabaseClient;