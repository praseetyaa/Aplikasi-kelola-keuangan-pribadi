// ============================================
// Wallets Page
// ============================================

const walletsPage = {
    wallets: [],

    async render(container) {
        container.innerHTML = `
        <div class="page-enter">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-white">Dompet</h2>
                    <p class="text-dark-200/50 mt-1">Kelola rekening perbankan, e-wallet, dan kartu kreditmu</p>
                </div>
                <button onclick="walletsPage.showAddModal()" class="btn-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <span>Tambah Dompet</span>
                </button>
            </div>

            <!-- Total Balance -->
            <div class="glass-card rounded-2xl p-6 mb-8 text-center sm:text-left bg-gradient-to-br from-primary-500/10 to-transparent border border-primary-500/20">
                <p class="text-dark-200/60 text-sm font-medium mb-1">Total Saldo Keseluruhan</p>
                <h3 id="wallets-total-balance" class="text-3xl sm:text-4xl font-bold text-white">Rp 0</h3>
            </div>

            <!-- Wallets Grid -->
            <div id="wallets-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="skeleton w-full h-32"></div>
                <div class="skeleton w-full h-32"></div>
                <div class="skeleton w-full h-32"></div>
            </div>
        </div>`;

        this.loadWallets();
    },

    async loadWallets() {
        try {
            this.wallets = await api.getWallets();
            const grid = document.getElementById('wallets-grid');
            if (!grid) return;

            if (this.wallets.length === 0) {
                grid.parentElement.innerHTML += `
                    <div class="col-span-1 md:col-span-2 lg:col-span-3 empty-state py-12">
                        <svg class="w-16 h-16 text-dark-200/15 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <p class="text-dark-200/40 text-base font-medium mb-1">Belum ada dompet</p>
                        <p class="text-dark-200/30 text-sm mb-4">Mulai tambahkan rekening atau e-walletmu</p>
                    </div>`;
                grid.remove();

                const totalBalanceEl = document.getElementById('wallets-total-balance');
                if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(0);
                return;
            }

            let totalBalance = 0;
            grid.innerHTML = '';

            const getTypeInfo = (type) => {
                switch (type) {
                    case 'bank': return { label: 'Perbankan', icon: '🏦', bg: 'bg-blue-500/20 text-blue-400', color: '#3b82f6' };
                    case 'ewallet': return { label: 'E-Wallet', icon: '📱', bg: 'bg-emerald-500/20 text-emerald-400', color: '#10b981' };
                    case 'credit': return { label: 'Kartu Kredit', icon: '💳', bg: 'bg-rose-500/20 text-rose-400', color: '#f43f5e' };
                    default: return { label: 'Lainnya', icon: '💼', bg: 'bg-gray-500/20 text-gray-400', color: '#9ca3af' };
                }
            };

            this.wallets.forEach(wallet => {
                const balance = parseFloat(wallet.balance) || 0;
                // Exclude credit cards from total balance or subtract them if negative? 
                // Usually credit cards have negative impact if they have outstanding balance, or 0.
                if (wallet.type !== 'credit') {
                    totalBalance += balance;
                } else {
                    // Credit cards might just show credit limit or debt, we subtract if it's debt (represented as negative)
                    totalBalance += balance;
                }

                const typeInfo = getTypeInfo(wallet.type);

                const card = document.createElement('div');
                card.className = 'glass-card rounded-2xl p-5 flex flex-col group relative overflow-hidden transition-all';
                card.style.background = `linear-gradient(145deg, ${typeInfo.color}15 0%, rgba(255,255,255,0.02) 100%)`;
                card.style.borderColor = `${typeInfo.color}30`;
                card.innerHTML = `
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${typeInfo.bg}">
                                ${typeInfo.icon}
                            </div>
                            <div>
                                <h3 class="text-base font-semibold text-white leading-tight">${wallet.name}</h3>
                                <span class="text-xs font-medium text-dark-200/50">${typeInfo.label}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="walletsPage.showEditModal(${wallet.id})" class="p-1.5 rounded-lg hover:bg-white/10 text-dark-200/40 hover:text-white transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onclick="walletsPage.deleteWallet(${wallet.id})" class="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-200/40 hover:text-red-400 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="mt-auto pt-2">
                        <p class="text-xs text-dark-200/50 mb-1">Saldo Saat Ini</p>
                        <p class="text-xl font-bold ${balance < 0 ? 'text-red-400' : 'text-white'}">${formatCurrency(balance)}</p>
                    </div>
                `;
                grid.appendChild(card);
            });

            const totalBalanceEl = document.getElementById('wallets-total-balance');
            if (totalBalanceEl) {
                totalBalanceEl.textContent = formatCurrency(totalBalance);
                totalBalanceEl.className = `text-3xl sm:text-4xl font-bold ${totalBalance < 0 ? 'text-red-400' : 'text-white'}`;
            }

        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    showAddModal() {
        this.showWalletModal(null);
    },

    showEditModal(id) {
        const wallet = this.wallets.find(w => w.id == id);
        if (wallet) {
            this.showWalletModal(wallet);
        }
    },

    showWalletModal(wallet = null) {
        const isEdit = wallet !== null;

        const body = `
            <form id="wallet-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Nama Dompet</label>
                    <input type="text" id="wallet-name" class="input-field w-full" placeholder="Cth: BCA, Gopay, Mandiri" required value="${wallet?.name || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Tipe Dompet</label>
                    <select id="wallet-type" class="select-field w-full" required>
                        <option value="bank" ${wallet?.type === 'bank' ? 'selected' : ''}>🏦 Perbankan (Bank)</option>
                        <option value="ewallet" ${wallet?.type === 'ewallet' ? 'selected' : ''}>📱 E-Wallet (Gopay, OVO, dll)</option>
                        <option value="credit" ${wallet?.type === 'credit' ? 'selected' : ''}>💳 Kartu Kredit & Cicilan</option>
                    </select>
                </div>
                <div id="wallet-balance-container">
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Saldo Awal (Rp)</label>
                    <input type="text" id="wallet-starting-balance" class="input-field w-full" placeholder="0"
                        inputmode="numeric" autocomplete="off"
                        oninput="this.value=this.value.replace(/\\D/g,'').replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')"
                        value="${wallet?.starting_balance ? formatInputNumber(wallet.starting_balance) : ''}">
                    <p class="text-xs text-dark-200/40 mt-1">Saldo saat ini akan dihitung otomatis dari riwayat transaksi.</p>
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

        showModal(isEdit ? 'Edit Dompet' : 'Tambah Dompet', body);
        attachCurrencyInput(document.getElementById('wallet-starting-balance'));

        // Adjust labels based on selected type
        const typeSelect = document.getElementById('wallet-type');
        const updateTypeUI = () => {
            const label = document.querySelector('#wallet-balance-container label');
            if (typeSelect.value === 'credit') {
                label.textContent = 'Tagihan Saat Ini / Saldo Berjalan (Rp)';
                document.getElementById('wallet-starting-balance').placeholder = 'Cth: -500000 (Gunakan minus untuk utang)';
            } else {
                label.textContent = 'Saldo Awal (Rp)';
                document.getElementById('wallet-starting-balance').placeholder = '0';
            }
        };
        typeSelect.addEventListener('change', updateTypeUI);
        updateTypeUI();

        document.getElementById('wallet-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            toggleBtnLoading(btn, true);

            const balanceVal = document.getElementById('wallet-starting-balance').value;

            const data = {
                name: document.getElementById('wallet-name').value,
                type: document.getElementById('wallet-type').value,
                starting_balance: parseInputNumber(document.getElementById('wallet-starting-balance').value)
            };

            try {
                if (isEdit) {
                    await api.updateWallet(wallet.id, data);
                    showToast('Dompet berhasil diubah', 'success');
                } else {
                    await api.createWallet(data);
                    showToast('Dompet berhasil ditambahkan!', 'success');
                }
                closeModal();
                this.render(document.getElementById('page-content'));
            } catch (err) {
                showToast(err.message, 'error');
                toggleBtnLoading(btn, false);
            }
        });
    },

    async deleteWallet(id) {
        const wallet = this.wallets.find(w => w.id == id);
        if (!wallet) return;

        const body = `
            <div class="text-center py-2">
                <div class="text-5xl mb-4">🗑️</div>
                <p class="text-white text-lg font-medium mb-2">Hapus Dompet?</p>
                <p class="text-dark-200/60 text-sm">"${wallet.name}" akan dihapus. Transaksi yang terhubung akan kehilangan referensi dompet (tapi tidak terhapus).</p>
            </div>
            <div class="flex gap-3 mt-6">
                <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                <button onclick="walletsPage._confirmDelete(${Number(id)})" class="btn-primary flex-1" style="background:#ef4444">Hapus</button>
            </div>`;
        showModal('Konfirmasi', body);
    },

    async _confirmDelete(id) {
        closeModal();
        try {
            await api.deleteWallet(Number(id));
            showToast('Dompet dihapus', 'success');
            this.render(document.getElementById('page-content'));
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
