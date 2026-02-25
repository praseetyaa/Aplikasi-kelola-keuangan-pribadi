// ============================================
// Dashboard Page
// ============================================

function getThemeColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme-500').trim() || '#10b981';
}

function getThemeColorRgb() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme-rgb').trim() || '16, 185, 129';
}

const dashboardPage = {
    charts: {},

    async render(container) {
        const month = getCurrentMonth();

        container.innerHTML = `
        <div class="page-enter">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                        Hi! <span class="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">${app.user ? app.user.name.split(' ')[0] : ''}</span>
                    </h2>
                    <p class="text-dark-200/50 mt-1">Ringkasan keuangan bulan ini</p>
                </div>
                <button onclick="app.navigate('notifications')" class="p-2 rounded-xl hover:bg-white/5 transition-colors relative">
                    <svg class="w-6 h-6 text-dark-200/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span id="dash-notification-badge" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">0</span>
                </button>
            </div>

            <!-- Summary Card -->
            <div class="glass-card rounded-2xl p-5 sm:p-6 mb-8 relative overflow-hidden">
                <!-- Decorative background elements -->
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div class="relative z-10 flex flex-col gap-6">
                    <!-- Total Saldo (Highlighted) -->
                    <div class="flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <svg class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                            </div>
                            <span class="text-sm text-dark-200/60 font-medium">Total Saldo</span>
                        </div>
                        <p id="dash-balance" class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
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
                                <span class="text-xs sm:text-sm text-dark-200/60 font-medium">Pemasukan</span>
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
                                <span class="text-xs sm:text-sm text-dark-200/60 font-medium">Pengeluaran</span>
                            </div>
                            <p id="dash-expense" class="text-lg sm:text-xl font-bold text-red-400">
                                <span class="skeleton inline-block w-24 h-6"></span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                <!-- Monthly Trend -->
                <div class="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6">
                    <h3 class="text-base font-semibold text-white mb-4">Tren Bulanan</h3>
                    <div class="relative h-[240px] md:h-[280px]">
                        <canvas id="dash-trend-chart"></canvas>
                    </div>
                </div>
                <!-- Expense by Category -->
                <div class="glass-card rounded-2xl p-4 sm:p-6">
                    <h3 class="text-base font-semibold text-white mb-4">Pengeluaran per Kategori</h3>
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
                        <h3 class="text-base font-semibold text-white">💳 Dompet</h3>
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
                        <h3 class="text-base font-semibold text-white">🎯 Planning Aktif</h3>
                        <a href="#planning" class="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium">Lihat Semua →</a>
                    </div>
                    <div id="dash-planning" class="space-y-3">
                        <div class="skeleton w-full h-14 rounded-xl"></div>
                        <div class="skeleton w-full h-14 rounded-xl"></div>
                    </div>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="glass-card rounded-2xl p-4 sm:p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base font-semibold text-white">Transaksi Terbaru</h3>
                    <a href="#transactions" class="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium">Lihat Semua →</a>
                </div>
                <div id="dash-recent-list" class="space-y-3">
                    <div class="skeleton w-full h-16"></div>
                    <div class="skeleton w-full h-16"></div>
                    <div class="skeleton w-full h-16"></div>
                </div>
            </div>
        </div>`;

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
                    <p class="text-white/70 text-sm">Kamu belum menabung <strong>${formatCurrency(p.monthly_saving)}</strong> untuk target ini di bulan berjalan. Ayo tetap konsisten!</p>
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
                    <p class="text-dark-200/40 text-sm">Belum ada data pengeluaran</p>
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
                    <p class="text-dark-200/40 text-sm">Belum ada transaksi</p>
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
                    <p class="text-sm font-medium text-white truncate">${tx.description || tx.category_name || 'Transaksi'}</p>
                    <p class="text-xs text-dark-200/40">${tx.category_name || '-'} · ${formatDate(tx.date)}</p>
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
                <p class="text-dark-200/40 text-sm">Belum ada dompet</p>
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
                    <p class="text-sm font-medium text-white truncate">${w.name}</p>
                    <p class="text-xs text-dark-200/40 capitalize">${w.type}</p>
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
                <p class="text-dark-200/40 text-sm">Belum ada planning aktif</p>
                <a href="#planning" class="text-[#10b981] text-sm mt-1 hover:opacity-80">+ Tambah Goal</a>
            </div>`;
            return;
        }

        // Show max 3 active plans
        el.innerHTML = plans.slice(0, 3).map(p => {
            const pct = Math.min(100, parseFloat(p.progress_pct) || 0);
            const color = pct >= 60 ? getThemeColor() : pct >= 30 ? '#f59e0b' : '#ef4444';
            const info = p.monthly_needed
                ? `Nabung/bln: ${formatCurrency(p.monthly_needed)}`
                : p.estimated_months
                    ? `~${p.estimated_months} bln lagi`
                    : `${formatCurrency(p.saved_amount)} / ${formatCurrency(p.target_amount)}`;
            return `
            <div class="group cursor-pointer" onclick="app.navigate('planning')">
                <div class="flex items-center gap-2.5 mb-1.5">
                    <span class="text-lg leading-none">${p.icon || '🎯'}</span>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">${p.name}</p>
                        <p class="text-xs text-dark-200/40">${info}</p>
                    </div>
                    <span class="text-xs font-semibold flex-shrink-0" style="color:${color}">${pct}%</span>
                </div>
                <div class="w-full bg-white/5 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all" style="width:${pct}%;background:${color}"></div>
                </div>
            </div>`;
        }).join('');

        if (plans.length > 3) {
            el.innerHTML += `<a href="#planning" class="block text-center text-xs text-primary-400 hover:text-primary-300 mt-2 pt-2 border-t border-white/5">+${plans.length - 3} goal lainnya →</a>`;
        }
    }
};
