// ============================================
// Dashboard Page
// ============================================

const dashboardPage = {
    charts: {},

    async render(container) {
        const month = getCurrentMonth();

        container.innerHTML = `
        <div class="page-enter">
            <!-- Header -->
            <div class="mb-8">
                <h2 class="text-2xl lg:text-3xl font-bold text-white">Dashboard</h2>
                <p class="text-dark-200/50 mt-1">Ringkasan keuangan bulan ini</p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                <div class="summary-card card-balance">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                        </div>
                        <span class="text-sm text-dark-200/60 font-medium">Total Saldo</span>
                    </div>
                    <p id="dash-balance" class="text-2xl lg:text-3xl font-bold text-white">
                        <span class="skeleton inline-block w-40 h-8"></span>
                    </p>
                </div>
                <div class="summary-card card-income">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
                        </div>
                        <span class="text-sm text-dark-200/60 font-medium">Pemasukan</span>
                    </div>
                    <p id="dash-income" class="text-2xl lg:text-3xl font-bold text-green-400">
                        <span class="skeleton inline-block w-36 h-8"></span>
                    </p>
                </div>
                <div class="summary-card card-expense">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>
                        </div>
                        <span class="text-sm text-dark-200/60 font-medium">Pengeluaran</span>
                    </div>
                    <p id="dash-expense" class="text-2xl lg:text-3xl font-bold text-red-400">
                        <span class="skeleton inline-block w-36 h-8"></span>
                    </p>
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
            const data = await api.getDashboard(month);

            // Update summary cards
            document.getElementById('dash-balance').textContent = formatCurrency(data.balance);
            document.getElementById('dash-income').textContent = formatCurrency(data.total_income);
            document.getElementById('dash-expense').textContent = formatCurrency(data.total_expense);

            // Trend chart
            this.renderTrendChart(data.monthly_trend);

            // Category chart
            this.renderCategoryChart(data.expense_by_category);

            // Recent transactions
            this.renderRecentTransactions(data.recent_transactions);
        } catch (err) {
            showToast(err.message, 'error');
        }
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
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: '#10b981',
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
    }
};
