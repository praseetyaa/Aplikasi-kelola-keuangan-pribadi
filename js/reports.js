// ============================================
// Reports Page
// ============================================

function getThemeColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme-500').trim() || '#10b981';
}

function getThemeColorRgb() {
    return getComputedStyle(document.documentElement).getPropertyValue('--theme-rgb').trim() || '16, 185, 129';
}

const reportsPage = {
    charts: {},
    currentYear: new Date().getFullYear(),

    async render(container) {
        const years = [];
        for (let y = this.currentYear; y >= this.currentYear - 4; y--) years.push(y);

        container.innerHTML = `
        <div class="page-enter">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-dark-950 dark:text-white">Laporan</h2>
                    <p class="text-gray-400 dark:text-dark-200/50 mt-1">Analisis keuangan tahunan</p>
                </div>
                <select id="report-year" class="select-field" onchange="reportsPage.changeYear(this.value)">
                    ${years.map(y => `<option value="${y}" ${y === this.currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
            </div>

            <!-- Year Summary -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                <div class="summary-card card-income">
                    <p class="text-sm text-gray-500 dark:text-dark-200/60 mb-1">Total Pemasukan</p>
                    <p id="rpt-income" class="text-2xl font-bold text-green-400"><span class="skeleton inline-block w-32 h-7"></span></p>
                </div>
                <div class="summary-card card-expense">
                    <p class="text-sm text-gray-500 dark:text-dark-200/60 mb-1">Total Pengeluaran</p>
                    <p id="rpt-expense" class="text-2xl font-bold text-red-400"><span class="skeleton inline-block w-32 h-7"></span></p>
                </div>
                <div class="summary-card card-balance">
                    <p class="text-sm text-gray-500 dark:text-dark-200/60 mb-1">Selisih</p>
                    <p id="rpt-balance" class="text-2xl font-bold text-dark-950 dark:text-white"><span class="skeleton inline-block w-32 h-7"></span></p>
                </div>
            </div>

            <!-- Monthly Chart -->
            <div class="glass-card rounded-2xl p-6 mb-8">
                <h3 class="text-base font-semibold text-dark-950 dark:text-white mb-4">Pemasukan vs Pengeluaran Bulanan</h3>
                <div style="height:300px"><canvas id="rpt-monthly-chart"></canvas></div>
            </div>

            <!-- Category Breakdown -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-base font-semibold text-dark-950 dark:text-white mb-4">Pemasukan per Kategori</h3>
                    <div id="rpt-income-cat" style="height:260px"><canvas id="rpt-income-chart"></canvas></div>
                </div>
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-base font-semibold text-dark-950 dark:text-white mb-4">Pengeluaran per Kategori</h3>
                    <div id="rpt-expense-cat" style="height:260px"><canvas id="rpt-expense-chart"></canvas></div>
                </div>
            </div>
        </div>`;

        this.loadData();
    },

    changeYear(year) {
        this.currentYear = parseInt(year);
        this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getReports(this.currentYear);

            document.getElementById('rpt-income').textContent = formatCurrency(data.total_income);
            document.getElementById('rpt-expense').textContent = formatCurrency(data.total_expense);
            document.getElementById('rpt-balance').textContent = formatCurrency(data.balance);

            this.renderMonthlyChart(data.monthly_summary);
            this.renderCategoryChart('income', data.income_by_category);
            this.renderCategoryChart('expense', data.expense_by_category);
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    renderMonthlyChart(summary) {
        if (this.charts.monthly) this.charts.monthly.destroy();
        const ctx = document.getElementById('rpt-monthly-chart');
        if (!ctx) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const incomeData = new Array(12).fill(0);
        const expenseData = new Array(12).fill(0);

        summary.forEach(s => {
            const m = parseInt(s.month.split('-')[1]) - 1;
            incomeData[m] = parseFloat(s.income);
            expenseData[m] = parseFloat(s.expense);
        });

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Pemasukan', data: incomeData,
                        borderColor: getThemeColor(), backgroundColor: `rgba(${getThemeColorRgb()},0.1)`,
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2
                    },
                    {
                        label: 'Pengeluaran', data: expenseData,
                        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.6)', padding: 16, usePointStyle: true, font: { size: 12 } } },
                    tooltip: {
                        backgroundColor: 'rgba(30,41,59,0.95)', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                        borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 10, padding: 12,
                        callbacks: { label: (c) => `${c.dataset.label}: ${formatCurrency(c.raw)}` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', callback: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'jt' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'rb' : v } }
                }
            }
        });
    },

    renderCategoryChart(type, categories) {
        const key = type + 'Cat';
        if (this.charts[key]) this.charts[key].destroy();
        const canvasId = type === 'income' ? 'rpt-income-chart' : 'rpt-expense-chart';
        const containerId = type === 'income' ? 'rpt-income-cat' : 'rpt-expense-cat';
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (!categories || categories.length === 0) {
            document.getElementById(containerId).innerHTML = '<div class="empty-state h-full"><p class="text-gray-400 dark:text-dark-200/40 text-sm">Belum ada data</p></div>';
            return;
        }

        this.charts[key] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => `${c.icon} ${c.name}`),
                datasets: [{ data: categories.map(c => parseFloat(c.total)), backgroundColor: categories.map(c => c.color + 'cc'), borderColor: categories.map(c => c.color), borderWidth: 2, hoverOffset: 6 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', padding: 10, usePointStyle: true, font: { size: 11 } } },
                    tooltip: { backgroundColor: 'rgba(30,41,59,0.95)', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 10, padding: 12, callbacks: { label: c => `${c.label}: ${formatCurrency(c.raw)}` } }
                }
            }
        });
    }
};
