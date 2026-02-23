// ============================================
// Notifications Page
// ============================================

const notificationsPage = {
    notifications: [],

    async render(container) {
        container.innerHTML = `
        <div class="page-enter">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-white">Notifikasi</h2>
                    <p class="text-dark-200/50 mt-1">Pengingat dan informasi penting</p>
                </div>
                ${this.notifications.length > 0 ? `<button onclick="notificationsPage.clearAll()" class="text-sm text-dark-200/50 hover:text-white">Tandai semua dibaca</button>` : ''}
            </div>

            <div id="notifications-list" class="space-y-3">
                <div class="skeleton w-full h-20 rounded-xl"></div>
                <div class="skeleton w-full h-20 rounded-xl"></div>
            </div>
        </div>`;

        await this.loadNotifications();
    },

    async loadNotifications() {
        try {
            const res = await api.getDashboard();
            this.notifications = (res.planning_alerts || []).map(p => ({
                id: `planning-${p.id}`,
                type: 'planning',
                title: 'Update Tabungan',
                message: `Kamu belum menabung ${formatCurrency(p.monthly_saving)} untuk target "${p.name}" di bulan berjalan.`,
                icon: '🔔',
                iconBg: 'bg-amber-500/20',
                iconColor: 'text-amber-400',
                created_at: new Date().toISOString(),
                read: false,
                planId: p.id
            }));

            this.renderList();
            this.updateBadge();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    renderList() {
        const el = document.getElementById('notifications-list');
        if (!el) return;

        if (this.notifications.length === 0) {
            el.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-6xl mb-4">🔔</div>
                    <p class="text-dark-200/40 text-base font-medium mb-1">Tidak ada notifikasi</p>
                    <p class="text-dark-200/30 text-sm">Semua sudah terkini!</p>
                </div>`;
            return;
        }

        el.innerHTML = this.notifications.map(n => `
            <div class="glass-card rounded-xl p-4 flex items-start gap-4 cursor-pointer ${n.read ? 'opacity-50' : ''}" onclick="notificationsPage.handleClick(${n.planId})">
                <div class="w-10 h-10 rounded-full ${n.iconBg} flex items-center justify-center flex-shrink-0 ${n.iconColor}">
                    ${n.icon}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-white font-medium mb-1">${n.title}</h4>
                    <p class="text-dark-200/60 text-sm">${n.message}</p>
                    <p class="text-dark-200/40 text-xs mt-1">${formatDate(n.created_at)}</p>
                </div>
                ${!n.read ? '<div class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-2"></div>' : ''}
            </div>
        `).join('');
    },

    handleClick(planId) {
        app.navigate('planning');
    },

    clearAll() {
        this.notifications = [];
        this.renderList();
        const badges = ['notification-badge', 'mobile-notification-badge', 'dash-notification-badge'];
        badges.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    },

    updateBadge() {
        const count = this.notifications.length;
        const badges = ['notification-badge', 'mobile-notification-badge', 'dash-notification-badge'];
        badges.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = count;
                el.classList.toggle('hidden', count === 0);
            }
        });
    }
};
