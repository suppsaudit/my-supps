// MY SUPPS - Main JavaScript

// Supabase configuration (will be replaced with actual credentials)
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client (when credentials are available)
let supabase = null;
if (SUPABASE_URL !== 'https://your-project.supabase.co') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// State management
const appState = {
    selectedSupplements: [],
    mySupps: [],
    currentUser: null,
    viewMode: 'perServing' // or 'perUnit'
};

// Demo functionality
function showDemo() {
    const modal = document.getElementById('demo-modal');
    modal.style.display = 'block';
    
    // Create demo chart
    const ctx = document.getElementById('demo-chart').getContext('2d');
    
    const demoData = {
        labels: ['ビタミンC', 'ビタミンD', 'カルシウム', 'マグネシウム', 'オメガ3', '亜鉛'],
        datasets: [{
            label: 'California Gold Nutrition',
            data: [80, 100, 45, 60, 70, 85],
            backgroundColor: 'rgba(255, 107, 157, 0.2)',
            borderColor: 'rgba(255, 107, 157, 1)',
            pointBackgroundColor: 'rgba(255, 107, 157, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255, 107, 157, 1)'
        }, {
            label: 'Now Foods',
            data: [65, 75, 90, 40, 85, 70],
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: 'rgba(102, 126, 234, 1)',
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
        }]
    };
    
    new Chart(ctx, {
        type: 'radar',
        data: demoData,
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: 'white',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.formattedValue + '% RDA';
                        }
                    }
                }
            }
        }
    });
}

function closeDemo() {
    const modal = document.getElementById('demo-modal');
    modal.style.display = 'none';
}

// Supplement selection with pink pop effect
function toggleSupplementSelection(supplementId, element) {
    const isSelected = appState.selectedSupplements.includes(supplementId);
    
    if (isSelected) {
        // Remove from selection
        appState.selectedSupplements = appState.selectedSupplements.filter(id => id !== supplementId);
        element.classList.remove('selected');
        element.classList.add('unselected');
        
        // Remove badge
        const badge = element.querySelector('.my-supps-badge');
        if (badge) badge.remove();
    } else {
        // Add to selection
        appState.selectedSupplements.push(supplementId);
        element.classList.remove('unselected');
        element.classList.add('selected');
        
        // Add badge
        const badge = document.createElement('span');
        badge.className = 'my-supps-badge';
        badge.textContent = 'My Supps';
        element.appendChild(badge);
    }
    
    // Update chart if on Supps Audit page
    if (window.updateSuppsAudit) {
        updateSuppsAudit();
    }
}

// Toggle between per serving and per unit view
function toggleViewMode() {
    appState.viewMode = appState.viewMode === 'perServing' ? 'perUnit' : 'perServing';
    
    // Update all displays
    updateAllDisplays();
}

// Calculate combined nutrients
async function calculateCombinedNutrients(supplementIds) {
    const nutrients = {};
    
    // If no Supabase connection, use demo data
    if (!supabase) {
        // Demo data
        const demoNutrients = {
            'ビタミンC': 150,
            'ビタミンD': 125,
            'カルシウム': 80,
            'マグネシウム': 95,
            'オメガ3': 110,
            '亜鉛': 90
        };
        return demoNutrients;
    }
    
    // Real implementation with Supabase
    for (const suppId of supplementIds) {
        const { data, error } = await supabase
            .from('supplement_nutrients')
            .select(`
                nutrient_id,
                amount_per_serving,
                amount_per_unit,
                nutrients (name_ja, unit)
            `)
            .eq('supplement_id', suppId);
        
        if (data) {
            data.forEach(item => {
                const name = item.nutrients.name_ja;
                const amount = appState.viewMode === 'perServing' 
                    ? item.amount_per_serving 
                    : item.amount_per_unit;
                
                nutrients[name] = (nutrients[name] || 0) + amount;
            });
        }
    }
    
    return nutrients;
}

// Update all displays when view mode changes
function updateAllDisplays() {
    const modeText = appState.viewMode === 'perServing' ? '1日分' : '1粒';
    const modeButtons = document.querySelectorAll('.view-mode-toggle');
    
    modeButtons.forEach(btn => {
        btn.textContent = modeText;
    });
    
    // Refresh charts and displays
    if (window.updateSuppsAudit) {
        updateSuppsAudit();
    }
}

// Modal close on outside click
window.onclick = function(event) {
    const modal = document.getElementById('demo-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check for user session if Supabase is configured
    if (supabase) {
        checkUserSession();
    }
    
    // Add view mode toggle buttons where needed
    const viewToggles = document.querySelectorAll('.view-mode-toggle');
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleViewMode);
    });
});

// User session management
async function checkUserSession() {
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        appState.currentUser = user;
        updateUserMenu(user);
    }
}

function updateUserMenu(user) {
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.innerHTML = `
            <span class="user-email">${user.email}</span>
            <button onclick="logout()" class="btn-logout">ログアウト</button>
        `;
    }
}

async function logout() {
    if (supabase) {
        await supabase.auth.signOut();
        window.location.href = '/';
    }
}