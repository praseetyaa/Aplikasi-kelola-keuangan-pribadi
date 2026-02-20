// ============================================
// Categories Page
// ============================================

const categoriesPage = {
    categories: [],
    activeTab: 'expense',

    async render(container) {
        container.innerHTML = `
        <div class="page-enter">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-white">Kategori</h2>
                    <p class="text-dark-200/50 mt-1">Kelola kategori pemasukan &amp; pengeluaran</p>
                </div>
                <button onclick="categoriesPage.showAddModal()" class="btn-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <span>Tambah Kategori</span>
                </button>
            </div>
            <div class="flex gap-2 mb-6">
                <button class="tab-btn active" onclick="categoriesPage.switchTab('expense')">Pengeluaran</button>
                <button class="tab-btn" onclick="categoriesPage.switchTab('income')">Pemasukan</button>
            </div>
            <div id="cat-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="skeleton w-full h-20"></div>
                <div class="skeleton w-full h-20"></div>
            </div>
        </div>`;
        this.loadCategories();
    },

    async loadCategories() {
        try {
            this.categories = await api.getCategories();
            this.renderGrid();
        } catch (err) { showToast(err.message, 'error'); }
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', (tab === 'expense' && i === 0) || (tab === 'income' && i === 1));
        });
        this.renderGrid();
    },

    renderGrid() {
        const grid = document.getElementById('cat-grid');
        if (!grid) return;
        const filtered = this.categories.filter(c => c.type === this.activeTab);
        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full empty-state py-12"><p class="text-dark-200/40">Belum ada kategori</p></div>`;
            return;
        }
        grid.innerHTML = filtered.map(cat => `
            <div class="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-white/10 transition-all">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style="background:${cat.color}20">${cat.icon}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-white truncate">${cat.name}</p>
                    <span class="badge ${cat.type === 'income' ? 'badge-income' : 'badge-expense'} mt-1">${cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                </div>
                <div class="hidden group-hover:flex items-center gap-1">
                    <button onclick="categoriesPage.showEditModal(${cat.id})" class="btn-icon" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onclick="categoriesPage.deleteCategory(${cat.id})" class="btn-icon hover:!text-red-400 hover:!bg-red-500/10" title="Hapus">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </div>`).join('');
    },

    showAddModal() { this.showCategoryModal(null); },
    showEditModal(id) {
        const cat = this.categories.find(c => c.id == id);
        if (cat) this.showCategoryModal(cat);
    },

    showCategoryModal(cat = null) {
        const isEdit = cat !== null;
        const emojis = ['💰', '💼', '💻', '📈', '🎁', '🍔', '🚗', '🛍️', '📄', '🎮', '🏥', '📚', '📦', '🏠', '✈️', '👕', '☕', '🎬'];
        const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#f97316', '#ec4899', '#6366f1', '#a855f7', '#14b8a6', '#3b82f6', '#6b7280'];

        const body = `
            <form id="cat-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Nama</label>
                    <input type="text" id="cat-name" class="input-field w-full" required value="${cat?.name || ''}">
                </div>
                ${!isEdit ? `<div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Tipe</label>
                    <div class="pill-group w-full">
                        <button type="button" class="pill-btn flex-1 active" data-type="expense" onclick="categoriesPage.switchModalType('expense')">Pengeluaran</button>
                        <button type="button" class="pill-btn flex-1" data-type="income" onclick="categoriesPage.switchModalType('income')">Pemasukan</button>
                    </div>
                    <input type="hidden" id="cat-type" value="expense">
                </div>` : ''}
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-2">Icon</label>
                    <div class="flex flex-wrap gap-2" id="cat-icon-picker">
                        ${emojis.map(e => `<button type="button" class="w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 ${cat?.icon === e ? 'ring-2 ring-primary-500 bg-white/10' : 'bg-white/5'}" onclick="categoriesPage.selectIcon(this,'${e}')">${e}</button>`).join('')}
                    </div>
                    <input type="hidden" id="cat-icon" value="${cat?.icon || '💰'}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-2">Warna</label>
                    <div class="flex flex-wrap gap-2" id="cat-color-picker">
                        ${colors.map(c => `<button type="button" class="w-8 h-8 rounded-lg hover:scale-110 transition-transform ${cat?.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''}" style="background:${c}" onclick="categoriesPage.selectColor(this,'${c}')"></button>`).join('')}
                    </div>
                    <input type="hidden" id="cat-color" value="${cat?.color || '#10b981'}">
                </div>
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                    <button type="submit" class="btn-primary flex-1"><span class="btn-text">${isEdit ? 'Simpan' : 'Tambah'}</span><span class="btn-loading hidden"><svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span></button>
                </div>
            </form>`;

        showModal(isEdit ? 'Edit Kategori' : 'Tambah Kategori', body);

        document.getElementById('cat-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            toggleBtnLoading(btn, true);
            const data = { name: document.getElementById('cat-name').value, icon: document.getElementById('cat-icon').value, color: document.getElementById('cat-color').value };
            if (!isEdit) data.type = document.getElementById('cat-type').value;
            try {
                if (isEdit) { await api.updateCategory(cat.id, data); showToast('Kategori diubah', 'success'); }
                else { await api.createCategory(data); showToast('Kategori ditambahkan!', 'success'); }
                closeModal(); this.loadCategories();
            } catch (err) { showToast(err.message, 'error'); toggleBtnLoading(btn, false); }
        });
    },

    switchModalType(type) {
        document.querySelectorAll('#cat-form .pill-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
        document.getElementById('cat-type').value = type;
    },
    selectIcon(btn, icon) {
        document.querySelectorAll('#cat-icon-picker button').forEach(b => { b.classList.remove('ring-2', 'ring-primary-500', 'bg-white/10'); b.classList.add('bg-white/5'); });
        btn.classList.add('ring-2', 'ring-primary-500', 'bg-white/10'); btn.classList.remove('bg-white/5');
        document.getElementById('cat-icon').value = icon;
    },
    selectColor(btn, color) {
        document.querySelectorAll('#cat-color-picker button').forEach(b => b.classList.remove('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-dark-800'));
        btn.classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-dark-800');
        document.getElementById('cat-color').value = color;
    },
    async deleteCategory(id) {
        if (!confirm('Hapus kategori ini?')) return;
        try { await api.deleteCategory(id); showToast('Kategori dihapus', 'success'); this.loadCategories(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
