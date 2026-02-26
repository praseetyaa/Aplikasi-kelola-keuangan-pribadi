// ============================================
// Dashboard Page
// ============================================

function getThemeColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme-500').trim() || '#10b981';
}

function getThemeColorRgb() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme-rgb').trim() || '16, 185, 129';
}

const AVAILABLE_SHORTCUTS = [
    { id: 'categories', label: 'Kategori', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />` },
    { id: 'reports', label: 'Laporan', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />` },
    { id: 'settings', label: 'Pengaturan', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />` },
    { id: 'wallets', label: 'Dompet', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />` },
    { id: 'planning', label: 'Rencana', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />` },
    { id: 'profile', label: 'Profil', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />` },
    { id: 'transactions', label: 'Transaksi', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />` }
];

const dashboardPage = {
    charts: {},

    async render(container) {
        const month = getCurrentMonth();

        // Load shortcuts logic
        let savedShortcuts = [];
        try {
            const raw = localStorage.getItem('dashboard_shortcuts');
            if (raw) savedShortcuts = JSON.parse(raw);
        } catch (e) { }

        if (!savedShortcuts.length) {
            savedShortcuts = ['categories', 'reports', 'settings']; // Default
        }

        const renderedShortcutsHTML = savedShortcuts.map(id => {
            const feat = AVAILABLE_SHORTCUTS.find(s => s.id === id);
            if (!feat) return '';
            return `
                <button onclick="app.navigate('${feat.id}')" class="flex flex-col items-center gap-2 group outline-none">
                    <div class="w-12 h-12 rounded-2xl bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:bg-primary-500/20 group-hover:border-primary-500/30 transition-all">
                        <svg class="w-5 h-5 text-gray-600 dark:text-dark-200/70 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${feat.icon}
                        </svg>
                    </div>
                    <span class="text-xs font-medium text-gray-600 dark:text-dark-200/70 group-hover:text-dark-950 dark:text-dark-950 dark:text-white transition-colors truncate w-full text-center px-1">${feat.label}</span>
                </button>
            `;
        }).join('');

        container.innerHTML = `
            <div class="page-enter">
                <!-- Header -->
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h2 class="text-2xl lg:text-3xl font-bold text-dark-950 dark:text-dark-950 dark:text-white tracking-tight">
                            Hi! <span class="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">${app.user ? app.user.name.split(' ')[0] : ''}</span>
                        </h2>
                        <p class="text-gray-400 dark:text-dark-200/50 mt-1">Ringkasan keuangan bulan ini</p>
                    </div>
                    <button onclick="app.navigate('notifications')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-black/10 dark:border-white/10 transition-colors relative">
                        <svg class="w-6 h-6 text-dark-950 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span id="dash-notification-badge" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-dark-950 dark:text-white text-xs font-bold rounded-full flex items-center justify-center">0</span>
                    </button>
                </div>

                <!-- Summary Card -->
                <div class="glass-card rounded-2xl p-5 sm:p-6 mb-8 relative overflow-hidden">
                    <!-- Decorative background elements -->
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div class="relative z-10 flex flex-col gap-6">
                        <!-- Total Saldo -->
                        <div class="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                </div>
                                <span class="text-sm text-gray-500 dark:text-dark-200/60 font-medium">Total Saldo</span>
                            </div>
                            <p id="dash-balance" class="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-950 dark:text-white tracking-tight">
                                <span class="skeleton inline-block w-40 h-10 sm:h-12"></span>
                            </p>
                        </div>

                        <div class="w-full h-px bg-white/5"></div>

                        <!-- Income & Expense Row -->
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Income -->
                            <div class="flex flex-col">
                                <div class="flex items-center gap-2 mb-1.5">
                                    <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
                                    </div>
                                    <span class="text-xs sm:text-sm text-gray-500 dark:text-dark-200/60 font-medium">Pemasukan</span>
                                </div>
                                <p id="dash-income" class="text-lg sm:text-xl font-bold text-green-400">
                                    <span class="skeleton inline-block w-24 h-6"></span>
                                </p>
                            </div>
                            <!-- Expense -->
                            <div class="flex flex-col">
                                <div class="flex items-center gap-2 mb-1.5">
                                    <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>
                                    </div>
                                    <span class="text-xs sm:text-sm text-gray-500 dark:text-dark-200/60 font-medium">Pengeluaran</span>
                                </div>
                                <p id="dash-expense" class="text-lg sm:text-xl font-bold text-red-400">
                                    <span class="skeleton inline-block w-24 h-6"></span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mobile Only Quick Menu -->
                <div class="lg:hidden grid grid-cols-4 gap-3 mb-8" id="quick-menu-grid">
                    ${renderedShortcutsHTML}
                    
                    <!-- Edit Menu -->
                    <button onclick="dashboardPage.editShortcuts()" class="flex flex-col items-center gap-2 group outline-none">
                        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-black/5 dark:border-white/5 border-dashed flex items-center justify-center group-hover:bg-white/10 group-hover:border-black/20 dark:border-white/20 transition-all">
                            <svg class="w-5 h-5 text-gray-400 dark:text-dark-200/50 group-hover:text-dark-950 dark:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-gray-400 dark:text-dark-200/50 group-hover:text-dark-950 dark:text-white transition-colors">Edit</span>
                    </button>
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                    <!-- Monthly Trend -->
                    <div class="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6">
                        <h3 class="text-base font-semibold text-dark-950 dark:text-white mb-4">Tren Bulanan</h3>
                        <div class="relative h-[240px] md:h-[280px]">
                            <canvas id="dash-trend-chart"></canvas>
                        </div>
                    </div>
                    <!-- Expense by Category -->
                    <div class="glass-card rounded-2xl p-4 sm:p-6">
                        <h3 class="text-base font-semibold text-dark-950 dark:text-white mb-4">Pengeluaran per Kategori</h3>
                        <div id="dash-category-chart-container" class="relative flex items-center justify-center h-[240px] md:h-[280px]">
                            <canvas id="dash-category-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Wallets & Planning Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
                    <!-- Dompet Widget -->
                    <div class="glass-card rounded-2xl p-4 sm:p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-base font-semibold text-dark-950 dark:text-white">💳 Dompet</h3>
                            <a href="#wallets" class="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium">Kelola →</a>
                        </div>
                        <div id="dash-wallets" class="space-y-2">
                            <div class="skeleton w-full h-12 rounded-xl"></div>
                            <div class="skeleton w-full h-12 rounded-xl"></div>
                        </div>
                    </div>
                    <!-- Planning Widget -->
                    <div class="glass-card rounded-2xl p-4 sm:p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-base font-semibold text-dark-950 dark:text-white">🎯 Planning Aktif</h3>
                            <a href="#planning" class="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium">Lihat Semua →</a>
                        </div>
                        <div id="dash-planning" class="space-y-3">
                            <div class="skeleton w-full h-14 rounded-xl"></div>
                            <div class="skeleton w-full h-14 rounded-xl"></div>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="glass-card rounded-2xl p-4 sm:p-6 mb-0">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-base font-semibold text-dark-950 dark:text-white">Transaksi Terbaru</h3>
                        <a href="#transactions" class="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium">Lihat Semua →</a>
                    </div>
                    <div id="dash-recent-list" class="space-y-3">
                        <div class="skeleton w-full h-16"></div>
                        <div class="skeleton w-full h-16"></div>
                        <div class="skeleton w-full h-16"></div>
                    </div>
                </div>
            </div>
        `;

        this.loadData(month);
    },

    async loadData(month) {
        try {
            // Load dashboard, wallets, planning in parallel
            const [data, wallets, plans] = await Promise.all([
                api.getDashboard(month),
                api.getWallets().catch(() => []),
                api.getPlanning('active').catch(() => [])
            ]);

            // Summary cards
            document.getElementById('dash-balance').textContent = formatCurrency(data.balance);
            document.getElementById('dash-income').textContent = formatCurrency(data.total_income);
            document.getElementById('dash-expense').textContent = formatCurrency(data.total_expense);

            // Charts
            this.renderTrendChart(data.monthly_trend);
            this.renderCategoryChart(data.expense_by_category);

            // Recent transactions
            this.renderRecentTransactions(data.recent_transactions);

            // New widgets
            this.renderAlerts(data.planning_alerts);
            this.renderWallets(wallets);
            this.renderPlanning(plans);

            // Update notification badges
            this.updateNotificationBadge(data.planning_alerts);
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    updateNotificationBadge(alerts) {
        const count = alerts ? alerts.length : 0;
        const badges = ['notification-badge', 'mobile-notification-badge', 'dash-notification-badge'];
        badges.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = count;
                el.classList.toggle('hidden', count === 0);
            }
        });
    },

    renderAlerts(alerts) {
        const el = document.getElementById('dash-alerts');
        if (!el) return;

        if (!alerts || alerts.length === 0) {
            el.innerHTML = '';
            return;
        }

        el.innerHTML = alerts.map(p => `
            <div class="glass-card bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-4 animate-fade-in cursor-pointer" onclick="app.navigate('planning')">
                <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 mt-0.5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                    <h4 class="text-amber-500 font-bold mb-1">Update Tabungan: ${p.name}</h4>
                    <p class="text-dark-950 dark:text-dark-950 dark:text-white/70 text-sm">Kamu belum menabung <strong>${formatCurrency(p.monthly_saving)}</strong> untuk target ini di bulan berjalan. Ayo tetap konsisten!</p>
                </div>
            </div>
        `).join('');
    },

    renderTrendChart(trends) {
        if (this.charts.trend) this.charts.trend.destroy();

        const ctx = document.getElementById('dash-trend-chart');
        if (!ctx) return;

        // Pad to 6 months
        const now = new Date();
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);
            labels.push(label);

            const found = trends.find(t => t.month === key);
            incomeData.push(found ? parseFloat(found.income) : 0);
            expenseData.push(found ? parseFloat(found.expense) : 0);
        }

        this.charts.trend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: incomeData,
                        backgroundColor: `rgba(${getThemeColorRgb()}, 0.6)`,
                        borderColor: getThemeColor(),
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'Pengeluaran',
                        data: expenseData,
                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: 'rgba(255,255,255,0.6)', padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fff',
                        bodyColor: 'rgba(255,255,255,0.8)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 12 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: {
                            color: 'rgba(255,255,255,0.4)',
                            font: { size: 11 },
                            callback: (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : v
                        }
                    }
                }
            }
        });
    },

    renderCategoryChart(categories) {
        if (this.charts.category) this.charts.category.destroy();

        const container = document.getElementById('dash-category-chart-container');
        const ctx = document.getElementById('dash-category-chart');
        if (!ctx) return;

        if (!categories || categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-gray-400 dark:text-dark-200/40 text-sm">Belum ada data pengeluaran</p>
                </div>`;
            return;
        }

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => `${c.icon} ${c.name}`),
                datasets: [{
                    data: categories.map(c => parseFloat(c.total)),
                    backgroundColor: categories.map(c => c.color + 'cc'),
                    borderColor: categories.map(c => c.color),
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'rgba(255,255,255,0.6)', padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fff',
                        bodyColor: 'rgba(255,255,255,0.8)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}`
                        }
                    }
                }
            }
        });
    },

    renderRecentTransactions(transactions) {
        const list = document.getElementById('dash-recent-list');
        if (!list) return;

        if (!transactions || transactions.length === 0) {
            list.innerHTML = `
                <div class="empty-state py-8">
                    <svg class="w-12 h-12 text-dark-200/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <p class="text-gray-400 dark:text-dark-200/40 text-sm">Belum ada transaksi</p>
                    <a href="#transactions" class="text-primary-400 text-sm mt-2 hover:text-primary-300">+ Tambah Transaksi</a>
                </div>`;
            return;
        }

        list.innerHTML = transactions.map(tx => `
            <div class="transaction-row">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style="background: ${tx.category_color || '#6b7280'}20">
                    ${tx.category_icon || '💰'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-dark-950 dark:text-dark-950 dark:text-white truncate">${tx.description || tx.category_name || 'Transaksi'}</p>
                    <p class="text-xs text-gray-400 dark:text-dark-200/40">${tx.category_name || '-'} · ${formatDate(tx.date)}</p>
                </div>
                <span class="text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'} flex-shrink-0">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                </span>
            </div>
        `).join('');
    },

    renderWallets(wallets) {
        const el = document.getElementById('dash-wallets');
        if (!el) return;

        if (!wallets || wallets.length === 0) {
            el.innerHTML = `<div class="empty-state py-4">
                <p class="text-gray-400 dark:text-dark-200/40 text-sm">Belum ada dompet</p>
                <a href="#wallets" class="text-primary-400 text-sm mt-1 hover:text-primary-300">+ Tambah Dompet</a>
            </div>`;
            return;
        }

        const typeIcon = { bank: '🏦', ewallet: '📱', credit: '💳' };
        el.innerHTML = wallets.map(w => {
            const bal = parseFloat(w.balance ?? w.starting_balance ?? 0);
            const isNeg = bal < 0;
            return `
            <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5 cursor-pointer" onclick="app.navigate('wallets')">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style="background:rgba(255,255,255,0.06)">
                    ${typeIcon[w.type] || '💰'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-dark-950 dark:text-dark-950 dark:text-white truncate">${w.name}</p>
                    <p class="text-xs text-gray-400 dark:text-dark-200/40 capitalize">${w.type}</p>
                </div>
                <span class="text-sm font-semibold flex-shrink-0 ${isNeg ? 'text-red-400' : 'text-emerald-400'}">${formatCurrency(bal)}</span>
            </div>`;
        }).join('');
    },

    renderPlanning(plans) {
        const el = document.getElementById('dash-planning');
        if (!el) return;

        if (!plans || plans.length === 0) {
            el.innerHTML = `<div class="empty-state py-4">
                <p class="text-gray-400 dark:text-dark-200/40 text-sm">Belum ada planning aktif</p>
                <a href="#planning" class="text-[#10b981] text-sm mt-1 hover:opacity-80">+ Tambah Goal</a>
            </div>`;
            return;
        }

        // Show max 3 active plans
        el.innerHTML = plans.slice(0, 3).map(p => {
            const pct = Math.min(100, parseFloat(p.progress_pct) || 0);
            const color = pct >= 60 ? getThemeColor() : pct >= 30 ? '#f59e0b' : '#ef4444';
            const info = p.monthly_needed
                ? `Nabung / bln: ${formatCurrency(p.monthly_needed)} `
                : p.estimated_months
                    ? `~${p.estimated_months} bln lagi`
                    : `${formatCurrency(p.saved_amount)} / ${formatCurrency(p.target_amount)}`;
            return `
            <div class="group cursor-pointer" onclick="app.navigate('planning')">
                <div class="flex items-center gap-2.5 mb-1.5">
                    <span class="text-lg leading-none">${p.icon || '🎯'}</span>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-dark-950 dark:text-dark-950 dark:text-white truncate">${p.name}</p>
                        <p class="text-xs text-gray-400 dark:text-dark-200/40">${info}</p>
                    </div>
                    <span class="text-xs font-semibold flex-shrink-0" style="color:${color}">${pct}%</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all" style="width:${pct}%;background:${color}"></div>
                </div>
            </div>`;
        }).join('');

        if (plans.length > 3) {
            el.innerHTML += `<a href="#planning" class="block text-center text-xs text-primary-400 hover:text-primary-300 mt-2 pt-2 border-t border-black/5 dark:border-white/5">+${plans.length - 3} goal lainnya →</a>`;
        }
    },

    editShortcuts() {
        let savedShortcuts = [];
        try {
            const raw = localStorage.getItem('dashboard_shortcuts');
            if (raw) savedShortcuts = JSON.parse(raw);
        } catch (e) { }
        if (!savedShortcuts.length) savedShortcuts = ['categories', 'reports', 'settings'];

        const modalHtml = `
            <div class="modal fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                <div class="fixed inset-0 bg-gray-50 dark:bg-dark-950/80 backdrop-blur-sm transition-opacity" onclick="closeModal(this)"></div>
                <div class="glass-card w-full max-w-md rounded-3xl z-10 p-6 transform transition-all shadow-2xl relative flex flex-col max-h-[90vh]">
                     <div class="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 class="text-lg font-semibold text-dark-950 dark:text-dark-950 dark:text-white">Sesuaikan Menu Cepat</h3>
                        <button onclick="closeModal(this)" class="p-2 text-gray-500 dark:text-dark-200/60 hover:text-dark-950 dark:text-white hover:bg-white/5 rounded-xl transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    
                    <p class="text-xs text-gray-500 dark:text-dark-200/60 mb-4 pb-4 border-b border-black/5 dark:border-white/5 flex-shrink-0">Pilih fitur yang ingin ditampilkan pada menu cepat di beranda. Perubahan otomatis tersimpan pada perangkat Anda.</p>
                    
                    <div class="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide" id="shortcut-checkboxes">
                        ${AVAILABLE_SHORTCUTS.map(feat => `
                            <label class="flex items-center p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-black/10 dark:border-white/10 transition-colors cursor-pointer group">
                                <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 dark:text-dark-200/70 group-hover:text-primary-400 mr-4">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        ${feat.icon}
                                    </svg>
                                </div>
                                <span class="flex-1 text-sm font-medium text-dark-950 dark:text-white">${feat.label}</span>
                                <div class="relative flex items-center">
                                    <input type="checkbox" value="${feat.id}" class="peer sr-only shortcut-cb" ${savedShortcuts.includes(feat.id) ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-dark-800 rounded-full peer peer-checked:bg-primary-500 transition-colors"></div>
                                    <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                                </div>
                            </label>
                        `).join('')}
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-black/5 dark:border-white/5 flex-shrink-0">
                        <button type="button" onclick="closeModal(this)" class="btn-secondary flex-1 py-3">Batal</button>
                        <button id="save-shortcuts-btn" class="btn-primary flex-1 py-3">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(modalHtml, 'text/html');
        const modalEl = doc.body.firstChild;
        document.body.appendChild(modalEl);

        // Show modal animation
        setTimeout(() => modalEl.classList.add('show'), 10);

        // Save action
        modalEl.querySelector('#save-shortcuts-btn').addEventListener('click', () => {
            const checkboxes = modalEl.querySelectorAll('.shortcut-cb');
            const newShortcuts = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            if (newShortcuts.length === 0) {
                showToast('Pilih minimal 1 pintasan', 'error');
                return;
            }

            localStorage.setItem('dashboard_shortcuts', JSON.stringify(newShortcuts));
            closeModal(modalEl.querySelector('.bg-gray-50 dark:bg-dark-950\\/80'));

            // Re-render dashboard gracefully to apply
            dashboardPage.render(document.getElementById('page-content'));
            showToast('Pintasan berhasil diperbarui', 'success');
        });
    }
};
