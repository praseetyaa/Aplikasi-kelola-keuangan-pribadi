// ============================================
// Transactions Page
// ============================================

const transactionsPage = {
    filters: {
        type: '',
        category_id: '',
        month: '',
        search: ''
    },
    categories: [],
    wallets: [],
    transactions: [],
    offset: 0,
    limit: 20,

    async render(container) {
        this.filters = { type: '', category_id: '', month: '', search: '' };
        this.offset = 0;

        const monthOptions = getMonthOptions();

        container.innerHTML = `
        <div class="page-enter">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-dark-950 dark:text-white">Transaksi</h2>
                    <p class="text-gray-400 dark:text-dark-200/50 mt-1">Kelola pemasukan dan pengeluaranmu</p>
                </div>
                <button onclick="transactionsPage.showAddModal()" class="btn-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <span>Tambah Transaksi</span>
                </button>
            </div>

            <!-- Filters -->
            <div class="glass-card rounded-2xl p-3 sm:p-4 mb-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="relative">
                        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-200/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" id="tx-search" placeholder="Cari transaksi..." class="input-field w-full pl-10" oninput="transactionsPage.handleSearch(this.value)">
                    </div>
                    <select id="tx-filter-type" class="select-field" onchange="transactionsPage.handleFilter('type', this.value)">
                        <option value="">Semua Tipe</option>
                        <option value="income">Pemasukan</option>
                        <option value="expense">Pengeluaran</option>
                    </select>
                    <select id="tx-filter-category" class="select-field" onchange="transactionsPage.handleFilter('category_id', this.value)">
                        <option value="">Semua Kategori</option>
                    </select>
                    <select id="tx-filter-month" class="select-field" onchange="transactionsPage.handleFilter('month', this.value)">
                        <option value="">Semua Bulan</option>
                        ${monthOptions.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- Transaction List -->
            <div id="tx-list" class="space-y-3">
                <div class="skeleton w-full h-16"></div>
                <div class="skeleton w-full h-16"></div>
                <div class="skeleton w-full h-16"></div>
                <div class="skeleton w-full h-16"></div>
            </div>

            <!-- Load more -->
            <div id="tx-load-more" class="hidden text-center mt-6">
                <button onclick="transactionsPage.loadMore()" class="btn-secondary">Muat Lebih Banyak</button>
            </div>

            <!-- Summary bar -->
            <div id="tx-summary" class="glass-card rounded-2xl p-4 mt-6 hidden">
                <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span id="tx-summary-count" class="text-gray-400 dark:text-dark-200/50"></span>
                    <div class="flex gap-4">
                        <span id="tx-summary-income" class="text-green-400 font-medium"></span>
                        <span id="tx-summary-expense" class="text-red-400 font-medium"></span>
                    </div>
                </div>
            </div>
        </div>`;

        await this.loadCategories();
        await this.loadWallets();
        this.loadTransactions();
    },

    async loadCategories() {
        try {
            this.categories = await api.getCategories();
            const select = document.getElementById('tx-filter-category');
            if (select) {
                const current = select.value;
                select.innerHTML = `<option value="">Semua Kategori</option>` +
                    this.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
                select.value = current;
            }
        } catch (err) {
            console.error(err);
        }
    },

    async loadWallets() {
        try {
            this.wallets = await api.getWallets();
        } catch (err) {
            console.error(err);
        }
    },

    searchTimeout: null,
    handleSearch(value) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filters.search = value;
            this.offset = 0;
            this.loadTransactions();
        }, 350);
    },

    handleFilter(key, value) {
        this.filters[key] = value;
        this.offset = 0;
        this.loadTransactions();
    },

    async loadTransactions(append = false) {
        try {
            const params = { ...this.filters, limit: this.limit, offset: this.offset };
            const res = await api.getTransactions(params);

            if (!append) {
                this.transactions = res.data || [];
            } else {
                this.transactions = [...this.transactions, ...(res.data || [])];
            }

            const list = document.getElementById('tx-list');
            if (!list) return;

            if (!append) {
                if (res.data.length === 0) {
                    list.innerHTML = `
                        <div class="empty-state py-12">
                            <svg class="w-16 h-16 text-dark-200/15 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                            <p class="text-gray-400 dark:text-dark-200/40 text-base font-medium mb-1">Belum ada transaksi</p>
                            <p class="text-dark-200/30 text-sm mb-4">Mulai catat keuanganmu sekarang</p>
                            <button onclick="transactionsPage.showAddModal()" class="btn-primary">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                Tambah Transaksi
                            </button>
                        </div>`;
                    document.getElementById('tx-load-more').classList.add('hidden');
                    document.getElementById('tx-summary').classList.add('hidden');
                    return;
                }
                list.innerHTML = '';
            }

            res.data.forEach(tx => {
                const row = document.createElement('div');
                row.className = 'transaction-row group';
                const rowColor = tx.category_color || '#6b7280';
                row.style.background = `linear-gradient(145deg, ${rowColor}15 0%, rgba(255,255,255,0.02) 100%)`;
                row.style.borderColor = `${rowColor}30`;
                row.innerHTML = `
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style="background: ${tx.category_color || '#6b7280'}20">
                        ${tx.category_icon || '💰'}
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-dark-950 dark:text-white truncate">${tx.description || tx.category_name || 'Transaksi'}</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}">${tx.type === 'income' ? 'Masuk' : 'Keluar'}</span>
                                <span class="text-xs text-gray-400 dark:text-dark-200/40 truncate">${tx.category_name || '-'} · ${tx.wallet_name || 'Tunai'} · ${formatDate(tx.date)}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t border-black/5 dark:border-white/5 sm:border-none">
                            <span class="text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'} flex-shrink-0">
                                ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                            </span>
                            <div class="flex items-center gap-1">
                                <button onclick="transactionsPage.showEditModal(${tx.id})" class="btn-icon" title="Edit">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                </button>
                                <button onclick="transactionsPage.deleteTransaction(${tx.id})" class="btn-icon hover:!text-red-400 hover:!bg-red-500/10" title="Hapus">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                list.appendChild(row);
            });

            // Show/hide load more
            const loadMoreBtn = document.getElementById('tx-load-more');
            if (this.offset + this.limit < res.total) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }

            // Summary
            const summaryEl = document.getElementById('tx-summary');
            summaryEl.classList.remove('hidden');
            document.getElementById('tx-summary-count').textContent = `${res.total} transaksi`;
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    loadMore() {
        this.offset += this.limit;
        this.loadTransactions(true);
    },

    showAddModal() {
        this.showTransactionModal(null);
    },

    async showEditModal(id) {
        try {
            const tx = await api.request(`transactions.php?id=${id}`);
            this.showTransactionModal(tx);
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    showTransactionModal(tx = null) {
        const isEdit = tx !== null;
        const incomeCategories = this.categories.filter(c => c.type === 'income');
        const expenseCategories = this.categories.filter(c => c.type === 'expense');
        const selectedType = tx?.type || 'expense';

        const getCategoryOptions = (type) => {
            const cats = type === 'income' ? incomeCategories : expenseCategories;
            return cats.map(c => `<option value="${c.id}" ${tx?.category_id == c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
        };

        const getWalletOptions = () => {
            return '<option value="">Pilih Dompet (Opsional)</option>' +
                this.wallets.map(w => `<option value="${w.id}" ${tx?.wallet_id == w.id ? 'selected' : ''}>${w.name}</option>`).join('');
        };

        const body = `
            <form id="tx-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Tipe</label>
                    <div class="pill-group w-full">
                        <button type="button" class="pill-btn flex-1 ${selectedType === 'income' ? 'active' : ''}" data-type="income"
                            onclick="transactionsPage.switchModalType('income')">
                            💰 Pemasukan
                        </button>
                        <button type="button" class="pill-btn flex-1 ${selectedType === 'expense' ? 'active' : ''}" data-type="expense"
                            onclick="transactionsPage.switchModalType('expense')">
                            💸 Pengeluaran
                        </button>
                    </div>
                    <input type="hidden" id="tx-type" value="${selectedType}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Jumlah (Rp)</label>
                    <input type="text" id="tx-amount" class="input-field w-full" placeholder="0" required
                        inputmode="numeric" autocomplete="off"
                        oninput="this.value=this.value.replace(/\\D/g,'').replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')"
                        value="${tx?.amount ? formatInputNumber(tx.amount) : ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Kategori</label>
                    <select id="tx-category" class="select-field w-full" required>
                        <option value="">Pilih kategori</option>
                        ${getCategoryOptions(selectedType)}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Dompet (Sumber/Tujuan)</label>
                    <select id="tx-wallet" class="select-field w-full">
                        ${getWalletOptions()}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Deskripsi</label>
                    <input type="text" id="tx-desc" class="input-field w-full" placeholder="Keterangan transaksi" value="${tx?.description || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Tanggal</label>
                    <input type="date" id="tx-date" class="input-field w-full" required value="${tx?.date || new Date().toISOString().split('T')[0]}">
                </div>
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                    <button type="submit" class="btn-primary flex-1">
                        <span class="btn-text">${isEdit ? 'Simpan' : 'Tambah'}</span>
                        <span class="btn-loading hidden">
                            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        </span>
                    </button>
                </div>
            </form>
        `;

        showModal(isEdit ? 'Edit Transaksi' : 'Tambah Transaksi', body);
        attachCurrencyInput(document.getElementById('tx-amount'));

        document.getElementById('tx-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            toggleBtnLoading(btn, true);

            const data = {
                type: document.getElementById('tx-type').value,
                amount: parseInputNumber(document.getElementById('tx-amount').value),
                category_id: document.getElementById('tx-category').value || null,
                wallet_id: document.getElementById('tx-wallet').value || null,
                description: document.getElementById('tx-desc').value,
                date: document.getElementById('tx-date').value
            };

            try {
                if (isEdit) {
                    await api.updateTransaction(tx.id, data);
                    showToast('Transaksi berhasil diubah', 'success');
                } else {
                    await api.createTransaction(data);
                    showToast('Transaksi berhasil ditambahkan! 🎉', 'success');
                }
                closeModal();
                this.offset = 0;
                this.loadTransactions();
            } catch (err) {
                showToast(err.message, 'error');
                toggleBtnLoading(btn, false);
            }
        });
    },

    switchModalType(type) {
        document.getElementById('tx-type').value = type;
        document.querySelectorAll('#tx-form .pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        const cats = this.categories.filter(c => c.type === type);
        const select = document.getElementById('tx-category');
        select.innerHTML = `<option value="">Pilih kategori</option>` +
            cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    },

    async deleteTransaction(id) {
        const tx = this.transactions.find(t => t.id == id);
        if (!tx) return;

        const body = `
            <div class="text-center py-2">
                <div class="text-5xl mb-4">🗑️</div>
                <p class="text-dark-950 dark:text-white text-lg font-medium mb-2">Hapus Transaksi?</p>
                <p class="text-gray-500 dark:text-dark-200/60 text-sm">${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatCurrency(tx.amount)} pada ${formatDate(tx.date)} akan dihapus.</p>
            </div>
            <div class="flex gap-3 mt-6">
                <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                <button onclick="transactionsPage._confirmDelete(${Number(id)})" class="btn-primary flex-1" style="background:#ef4444">Hapus</button>
            </div>`;
        showModal('Konfirmasi', body);
    },

    async _confirmDelete(id) {
        closeModal();
        try {
            await api.deleteTransaction(Number(id));
            showToast('Transaksi dihapus', 'success');
            this.offset = 0;
            this.loadTransactions();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
