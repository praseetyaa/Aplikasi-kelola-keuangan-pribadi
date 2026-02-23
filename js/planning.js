// ============================================
// Planning / Wishlist Page
// ============================================

const planningPage = {
    plans: [],
    activeTab: 'active', // 'active' | 'completed' | 'all'

    async render(container) {
        this.activeTab = 'active';
        container.innerHTML = `
        <div class="page-enter">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-white">Planning & Wishlist</h2>
                    <p class="text-dark-200/50 mt-1">Rencanakan tabunganmu menuju impian</p>
                </div>
                <button onclick="planningPage.showAddModal()" class="btn-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <span>Tambah Goal</span>
                </button>
            </div>

            <!-- Summary cards -->
            <div id="planning-summary" class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"></div>

            <!-- Tabs -->
            <div class="flex gap-1 mb-4 glass-card rounded-xl p-1 w-fit">
                <button onclick="planningPage.switchTab('active')" class="planning-tab active px-4 py-2 rounded-lg text-sm font-medium transition-all" data-tab="active">🔥 Aktif</button>
                <button onclick="planningPage.switchTab('completed')" class="planning-tab px-4 py-2 rounded-lg text-sm font-medium transition-all" data-tab="completed">✅ Selesai</button>
                <button onclick="planningPage.switchTab('all')" class="planning-tab px-4 py-2 rounded-lg text-sm font-medium transition-all" data-tab="all">📋 Semua</button>
            </div>

            <!-- Grid -->
            <div id="planning-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <div class="skeleton w-full h-52 rounded-2xl"></div>
                <div class="skeleton w-full h-52 rounded-2xl"></div>
                <div class="skeleton w-full h-52 rounded-2xl"></div>
            </div>
        </div>`;

        // Tab style
        const style = document.createElement('style');
        style.id = 'planning-tab-style';
        if (!document.getElementById('planning-tab-style')) {
            style.textContent = `.planning-tab { color: rgba(226,232,240,0.5); }
.planning-tab.active { background: rgba(255,255,255,0.07); color: #fff; }`;
            document.head.appendChild(style);
        }

        await this.loadPlans();
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.planning-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.renderGrid();
    },

    async loadPlans() {
        try {
            this.plans = await api.getPlanning();
            this.renderSummary();
            this.renderGrid();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    renderSummary() {
        const active = this.plans.filter(p => p.status === 'active');
        const completed = this.plans.filter(p => p.status === 'completed');
        const totalTarget = active.reduce((s, p) => s + parseFloat(p.target_amount), 0);
        const totalSaved = active.reduce((s, p) => s + parseFloat(p.saved_amount), 0);

        const el = document.getElementById('planning-summary');
        if (!el) return;
        el.innerHTML = `
            <div class="glass-card rounded-2xl p-4">
                <p class="text-xs text-dark-200/50 mb-1">Goal Aktif</p>
                <p class="text-2xl font-bold text-white">${active.length}</p>
            </div>
            <div class="glass-card rounded-2xl p-4">
                <p class="text-xs text-dark-200/50 mb-1">Total Terkumpul</p>
                <p class="text-xl font-bold text-primary-400">${formatCurrency(totalSaved)}</p>
                <p class="text-xs text-dark-200/40 mt-0.5">dari ${formatCurrency(totalTarget)}</p>
            </div>
            <div class="glass-card rounded-2xl p-4 hidden sm:block">
                <p class="text-xs text-dark-200/50 mb-1">Selesai</p>
                <p class="text-2xl font-bold text-emerald-400">${completed.length}</p>
            </div>`;
    },

    renderGrid() {
        const grid = document.getElementById('planning-grid');
        if (!grid) return;

        const tabMap = { active: ['active'], completed: ['completed'], all: ['active', 'completed', 'cancelled'] };
        const allow = tabMap[this.activeTab] || ['active'];
        const list = this.plans.filter(p => allow.includes(p.status));

        if (list.length === 0) {
            grid.innerHTML = `
                <div class="col-span-1 md:col-span-2 xl:col-span-3 empty-state py-16">
                    <div class="text-6xl mb-4">🎯</div>
                    <p class="text-dark-200/40 text-base font-medium mb-1">Belum ada goal di sini</p>
                    <p class="text-dark-200/30 text-sm mb-4">Yuk mulai rencanakan impianmu!</p>
                    <button onclick="planningPage.showAddModal()" class="btn-primary">+ Tambah Goal</button>
                </div>`;
            return;
        }

        grid.innerHTML = '';
        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'glass-card rounded-2xl p-5 flex flex-col group relative overflow-hidden';
            card.innerHTML = this.buildCard(p);
            grid.appendChild(card);
        });
    },

    buildCard(p) {
        const pct = Math.min(100, parseFloat(p.progress_pct) || 0);
        const isActive = p.status === 'active';
        const isDone = p.status === 'completed';
        const target = parseFloat(p.target_amount);
        const saved = parseFloat(p.saved_amount);
        const remain = parseFloat(p.remaining_amount) || Math.max(0, target - saved);

        // Progress bar color
        const pctColor = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-primary-500' : pct >= 30 ? 'bg-amber-500' : 'bg-rose-500';

        // Deadline tag
        let deadlineHtml = '';
        if (p.deadline) {
            const dl = new Date(p.deadline);
            const now = new Date();
            const days = Math.ceil((dl - now) / 86400000);
            const dlStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const urgency = days < 0 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-dark-200/50';
            const tag = days < 0 ? '⚠️ Terlewat' : days === 0 ? '🔔 Hari ini' : `${days} hari lagi`;
            deadlineHtml = `<span class="text-xs ${urgency}">📅 ${dlStr} · ${tag}</span>`;
        }

        // Monthly info
        let monthlyHtml = '';
        if (isActive && remain > 0) {
            if (p.monthly_needed) {
                monthlyHtml = `<div class="flex items-center gap-1.5 text-xs text-dark-200/60">
                    <span>🎯</span><span>Nabung/bln: <span class="text-primary-400 font-semibold">${formatCurrency(p.monthly_needed)}</span></span>
                </div>`;
            } else if (p.monthly_saving > 0 && p.estimated_months) {
                monthlyHtml = `<div class="flex items-center gap-1.5 text-xs text-dark-200/60">
                    <span>⏳</span><span>Estimasi selesai: <span class="text-primary-400 font-semibold">${p.estimated_months} bulan</span></span>
                </div>`;
            } else if (p.monthly_saving > 0) {
                monthlyHtml = `<div class="flex items-center gap-1.5 text-xs text-dark-200/60">
                    <span>💰</span><span>Target/bln: <span class="font-semibold">${formatCurrency(p.monthly_saving)}</span></span>
                </div>`;
            }
        }

        // Status badge
        const statusBadge = isDone
            ? `<span class="badge" style="background:rgba(16,185,129,0.15);color:#34d399">✅ Selesai</span>`
            : p.status === 'cancelled'
                ? `<span class="badge" style="background:rgba(239,68,68,0.15);color:#f87171">❌ Dibatalkan</span>`
                : '';

        // Action buttons
        const actions = isActive ? `
            <button onclick="planningPage.updateSaved(${p.id})" class="btn-icon" title="Update tabungan">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </button>
            <button onclick="planningPage.viewHistory(${p.id})" class="btn-icon" title="Lihat Riwayat">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
            <button onclick="planningPage.showEditModal(${p.id})" class="btn-icon" title="Edit">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="planningPage.markDone(${p.id})" class="btn-icon hover:!text-emerald-400 hover:!bg-emerald-500/10" title="Tandai selesai">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </button>
            <button onclick="planningPage.deletePlan(${p.id})" class="btn-icon hover:!text-red-400 hover:!bg-red-500/10" title="Hapus">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>` : `
            <button onclick="planningPage.showEditModal(${p.id})" class="btn-icon" title="Lihat detail">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onclick="planningPage.deletePlan(${p.id})" class="btn-icon hover:!text-red-400 hover:!bg-red-500/10" title="Hapus">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>`;

        return `
            <!-- Decorative glow -->
            <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                style="background: ${isDone ? '#f43f5e' : pct >= 60 ? 'var(--theme-500, #f43f5e)' : '#f59e0b'}"></div>

            <!-- Top row: icon + name + actions -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style="background:rgba(255,255,255,0.06)">
                        ${p.icon || '🎯'}
                    </div>
                    <div>
                        <h3 class="text-base font-semibold text-white leading-tight">${p.name}</h3>
                        ${statusBadge}
                    </div>
                </div>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                    ${actions}
                </div>
            </div>

            <!--Amount -->
            <div class="flex justify-between items-baseline mb-2">
                <div>
                    <p class="text-xs text-dark-200/50 mb-0.5">Terkumpul</p>
                    <p class="text-lg font-bold text-white">${formatCurrency(saved)}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-dark-200/50 mb-0.5">Target</p>
                    <p class="text-base font-semibold text-dark-200/80">${formatCurrency(target)}</p>
                </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-white/5 rounded-full h-2.5 mb-1.5">
                <div class="${pctColor} h-2.5 rounded-full transition-all duration-500" style="width:${pct}%"></div>
            </div>
            <div class="flex justify-between items-center mb-3">
                <span class="text-xs text-dark-200/40">${pct}%</span>
                ${remain > 0 ? `<span class="text-xs text-dark-200/40">Kurang ${formatCurrency(remain)}</span>` : `<span class="text-xs text-emerald-400">🎉 Target tercapai!</span>`}
            </div>

            <!-- Info bawah -->
            <div class="mt-auto space-y-1.5 pt-2 border-t border-white/5">
        ${deadlineHtml ? `<div>${deadlineHtml}</div>` : ''}
        ${monthlyHtml}
        ${p.notes ? `<p class="text-xs text-dark-200/40 truncate" title="${p.notes}">📝 ${p.notes}</p>` : ''}
    </div>`;
    },

    // ── Modal Tambah / Edit ──────────────────────────────────────────────────

    showAddModal() {
        this.showPlanModal(null);
    },

    showEditModal(id) {
        const plan = this.plans.find(p => p.id == id);
        if (plan) this.showPlanModal(plan);
    },

    showPlanModal(plan = null) {
        const isEdit = plan !== null;
        const icons = ['🎯', '📱', '💻', '🏠', '🚗', '✈️', '👜', '⌚', '📷', '🎮', '🎸', '🏋️', '💍', '🏖️', '📚', '🎓'];

        const iconPicker = icons.map(ic => `
            <button type="button" onclick="planningPage._pickIcon(this,'${ic}')"
class="plan-icon-btn w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all hover:bg-white/10 ${plan?.icon === ic ? 'bg-white/15 ring-1 ring-primary-500/60' : ''}">
    ${ic}
            </button>`).join('');

        const body = `
    <form id="plan-form" class="space-y-4">
        <input type="hidden" id="plan-icon-val" value="${plan?.icon || '🎯'}">

            <!-- Icon picker -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-2">Ikon</label>
                <div class="flex flex-wrap gap-1.5">${iconPicker}</div>
            </div>

            <!-- Nama -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Nama Tujuan</label>
                <input type="text" id="plan-name" class="input-field w-full" placeholder="Cth: Beli iPhone 17" required
                    value="${plan?.name || ''}">
            </div>

            <!-- Target -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Target Harga (Rp)</label>
                <input type="text" id="plan-target" class="input-field w-full" placeholder="0" required
                    inputmode="numeric" autocomplete="off"
                    oninput="this.value=formatInputNumber(this.value);planningPage._recalc()"
                    value="${plan?.target_amount ? formatInputNumber(plan.target_amount) : ''}">
            </div>

            <!-- Terkumpul -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Sudah Terkumpul (Rp)</label>
                <input type="text" id="plan-saved" class="input-field w-full" placeholder="0"
                    inputmode="numeric" autocomplete="off"
                    oninput="this.value=formatInputNumber(this.value);planningPage._recalc()"
                    value="${plan?.saved_amount ? formatInputNumber(plan.saved_amount) : ''}">
            </div>

            <!-- Deadline -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Deadline (Opsional)</label>
                <input type="date" id="plan-deadline" class="input-field w-full"
                    min="${new Date().toISOString().split('T')[0]}"
                    value="${plan?.deadline || ''}">
                    <p class="text-xs text-dark-200/40 mt-1">Kosongkan jika tidak ada target waktu</p>
            </div>

            <!-- Target nabung/bulan -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Target Nabung/Bulan (Rp) <span class="text-dark-200/40 font-normal">– opsional</span></label>
                <input type="text" id="plan-monthly" class="input-field w-full" placeholder="0"
                    inputmode="numeric" autocomplete="off"
                    oninput="this.value=formatInputNumber(this.value);planningPage._recalc()"
                    value="${plan?.monthly_saving ? formatInputNumber(plan.monthly_saving) : ''}">
            </div>

            <!-- Kalkulator real-time -->
            <div id="plan-calc-box" class="hidden rounded-xl p-4 space-y-2" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07)">
                <p class="text-xs font-semibold text-dark-200/60 uppercase tracking-wide">📊 Kalkulator</p>
                <div id="plan-calc-content" class="space-y-1.5 text-sm"></div>
            </div>

            <!-- Notes -->
            <div>
                <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Catatan (Opsional)</label>
                <input type="text" id="plan-notes" class="input-field w-full" placeholder="Keterangan tambahan"
                    value="${plan?.notes || ''}">
            </div>

            <div class="flex gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                <button type="submit" class="btn-primary flex-1">
                    <span class="btn-text">${isEdit ? 'Simpan' : 'Buat Goal'}</span>
                    <span class="btn-loading hidden">
                        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    </span>
                </button>
            </div>
        </form>`;

        showModal(isEdit ? 'Edit Goal' : 'Tambah Goal', body);

        // Auto-recalc on deadline change
        const dlInput = document.getElementById('plan-deadline');
        if (dlInput) dlInput.addEventListener('change', () => planningPage._recalc());

        // Initial calc
        setTimeout(() => this._recalc(), 50);

        document.getElementById('plan-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            toggleBtnLoading(btn, true);

            const data = {
                name: document.getElementById('plan-name').value,
                icon: document.getElementById('plan-icon-val').value,
                target_amount: parseInputNumber(document.getElementById('plan-target').value),
                saved_amount: parseInputNumber(document.getElementById('plan-saved').value),
                monthly_saving: parseInputNumber(document.getElementById('plan-monthly').value),
                deadline: document.getElementById('plan-deadline').value || null,
                notes: document.getElementById('plan-notes').value
            };

            try {
                if (isEdit) {
                    await api.updatePlanning(plan.id, data);
                    showToast('Goal berhasil diperbarui', 'success');
                } else {
                    await api.createPlanning(data);
                    showToast('Goal baru berhasil dibuat! 🎯', 'success');
                }
                closeModal();
                await this.loadPlans();
            } catch (err) {
                showToast(err.message, 'error');
                toggleBtnLoading(btn, false);
            }
        });
    },

    _pickIcon(btn, icon) {
        document.getElementById('plan-icon-val').value = icon;
        document.querySelectorAll('.plan-icon-btn').forEach(b => {
            b.classList.remove('bg-white/15', 'ring-1', 'ring-primary-500/60');
        });
        btn.classList.add('bg-white/15', 'ring-1', 'ring-primary-500/60');
    },

    _recalc() {
        const target = parseInputNumber(document.getElementById('plan-target')?.value || '0');
        const saved = parseInputNumber(document.getElementById('plan-saved')?.value || '0');
        const monthly = parseInputNumber(document.getElementById('plan-monthly')?.value || '0');
        const dlVal = document.getElementById('plan-deadline')?.value;

        const box = document.getElementById('plan-calc-box');
        const content = document.getElementById('plan-calc-content');
        if (!box || !content) return;

        if (target <= 0) { box.classList.add('hidden'); return; }

        const remain = Math.max(0, target - saved);
        const pct = Math.min(100, Math.round((saved / target) * 100));
        let rows = [];

        rows.push(`<div class="flex justify-between"><span class="text-dark-200/50">Progress</span><span class="font-semibold text-white">${pct}%</span></div>`);
        rows.push(`<div class="flex justify-between"><span class="text-dark-200/50">Sisa dibutuhkan</span><span class="font-semibold text-white">${formatCurrency(remain)}</span></div>`);

        if (dlVal) {
            const now = new Date();
            const dl = new Date(dlVal);
            const days = Math.ceil((dl - now) / 86400000);
            const months = Math.max(1, Math.ceil(days / 30));
            const perMonth = remain > 0 ? Math.ceil(remain / months) : 0;
            rows.push(`<div class="flex justify-between"><span class="text-dark-200/50">Waktu tersisa</span><span class="font-semibold text-white">${months} bulan (${days} hari)</span></div>`);
            if (remain > 0) {
                rows.push(`<div class="flex justify-between"><span class="text-dark-200/50">Nabung/bulan agar tepat waktu</span><span class="font-bold text-primary-400">${formatCurrency(perMonth)}</span></div>`);
            } else {
                rows.push(`<div class="text-emerald-400 font-semibold text-center">🎉 Target sudah tercapai!</div>`);
            }
        } else if (monthly > 0 && remain > 0) {
            const estMonths = Math.ceil(remain / monthly);
            const finDate = new Date();
            finDate.setMonth(finDate.getMonth() + estMonths);
            const finStr = finDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            rows.push(`<div class="flex justify-between"><span class="text-dark-200/50">Estimasi selesai</span><span class="font-bold text-primary-400">${estMonths} bulan (${finStr})</span></div>`);
        } else if (monthly > 0 && remain <= 0) {
            rows.push(`<div class="text-emerald-400 font-semibold text-center">🎉 Target sudah tercapai!</div>`);
        }

        content.innerHTML = rows.join('');
        box.classList.remove('hidden');
    },

    // ── Update saved amount modal ────────────────────────────────────────────

    updateSaved(id) {
        const plan = this.plans.find(p => p.id == id);
        if (!plan) return;

        const remain = Math.max(0, parseFloat(plan.target_amount) - parseFloat(plan.saved_amount));
        const suggestAmount = plan.monthly_needed > 0 ? plan.monthly_needed : (plan.monthly_saving > 0 ? plan.monthly_saving : remain);
        const currentMonth = getCurrentMonth();

        const body = `
            <div class="space-y-4">
                <div class="rounded-xl p-4" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07)">
                    <p class="text-sm text-dark-200/60 mb-1">Target</p>
                    <p class="text-xl font-bold text-white">${formatCurrency(plan.target_amount)}</p>
                    <p class="text-sm text-dark-200/60 mt-1 mb-1">Sudah Terkumpul: <span class="text-white">${formatCurrency(plan.saved_amount)}</span></p>
                    <div class="w-full bg-white/5 rounded-full h-1.5 mt-2">
                        <div class="bg-primary-500 h-1.5 rounded-full" style="width:${Math.min(100, plan.progress_pct)}%"></div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Bulan Pembayaran</label>
                    <input type="month" id="update-saved-month" class="input-field w-full" value="${currentMonth}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Nominal Tambahan (Rp)</label>
                    <input type="text" id="update-saved-val" class="input-field w-full" placeholder="0"
                        inputmode="numeric" autocomplete="off"
                        oninput="this.value=formatInputNumber(this.value)"
                        value="${formatInputNumber(suggestAmount)}">
                </div>
                <div class="flex gap-3 pt-1">
                    <button type="button" onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                    <button type="button" id="update-saved-btn" onclick="planningPage._submitUpdateSaved(${id})" class="btn-primary flex-1">
                        <span class="btn-text">Simpan</span>
                        <span class="btn-loading hidden"><svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>
                    </button>
                </div>
            </div>`;
        showModal(`Update Tabungan – ${plan.icon} ${plan.name}`, body);
    },

    async _submitUpdateSaved(id) {
        const btn = document.getElementById('update-saved-btn');
        const val = parseInputNumber(document.getElementById('update-saved-val').value);
        const month = document.getElementById('update-saved-month').value;
        if (val <= 0) return showToast('Nominal harus lebih dari 0', 'error');

        toggleBtnLoading(btn, true);
        try {
            await api.addPlanningHistory(id, { amount: val, month, type: 'deposit' });
            showToast('Topup berhasil dicatat 💰', 'success');
            closeModal();
            await this.loadPlans();
        } catch (err) {
            showToast(err.message, 'error');
            toggleBtnLoading(btn, false);
        }
    },

    async viewHistory(id) {
        const plan = this.plans.find(p => p.id == id);
        if (!plan) return;

        try {
            const history = await api.getPlanningHistory(id);
            let historyHtml = '<div class="space-y-3 max-h-96 overflow-y-auto pr-1">';

            if (history.length === 0) {
                historyHtml += `<div class="text-center py-6 text-dark-200/50 text-sm"> Belum ada riwayat pembayaran</div>`;
            } else {
                historyHtml += history.map(h => `
                    <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                            <p class="text-sm font-medium text-white">${new Date(h.month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                            <p class="text-xs text-dark-200/50">${formatDate(h.created_at)} · ${h.type === 'deposit' ? 'Pemasukan' : 'Perubahan'}</p>
                        </div>
                        <span class="text-sm font-bold text-emerald-400">+${formatCurrency(h.amount)}</span>
                    </div>
                `).join('');
            }
            historyHtml += '</div>';

            showModal(`Riwayat – ${plan.icon} ${plan.name} `, historyHtml);
        } catch (err) {
            showToast('Gagal memuat riwayat: ' + err.message, 'error');
        }
    },

    // ── Mark done / delete ──────────────────────────────────────────────────

    async markDone(id) {
        const plan = this.plans.find(p => p.id == id);
        if (!plan) return;

        const body = `
            <div class="text-center py-2">
                <div class="text-5xl mb-4">🎉</div>
                <p class="text-white text-lg font-medium mb-2">Selesaikan Goal?</p>
                <p class="text-dark-200/60 text-sm">"${plan.name}" akan ditandai sebagai selesai.</p>
            </div>
            <div class="flex gap-3 mt-6">
                <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                <button onclick="planningPage._confirmMarkDone(${Number(id)})" class="btn-primary flex-1">Selesai</button>
            </div>`;
        showModal('Konfirmasi', body);
    },

    async _confirmMarkDone(id) {
        closeModal();
        try {
            await api.updatePlanning(Number(id), { status: 'completed' });
            showToast('Selamat! Goal tercapai! 🎉', 'success');
            await this.loadPlans();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async deletePlan(id) {
        const plan = this.plans.find(p => p.id == id);
        if (!plan) return;

        const body = `
            <div class="text-center py-2">
                <div class="text-5xl mb-4">🗑️</div>
                <p class="text-white text-lg font-medium mb-2">Hapus Goal?</p>
                <p class="text-dark-200/60 text-sm">"${plan.name}" akan dihapus permanen.</p>
            </div>
            <div class="flex gap-3 mt-6">
                <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
                <button onclick="planningPage._confirmDelete(${Number(id)})" class="btn-primary flex-1" style="background:#ef4444">Hapus</button>
            </div>`;
        showModal('Konfirmasi', body);
    },

    async _confirmDelete(id) {
        closeModal();
        try {
            await api.deletePlanning(Number(id));
            showToast('Goal dihapus', 'info');
            await this.loadPlans();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};
