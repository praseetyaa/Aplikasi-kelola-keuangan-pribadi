// ============================================
// App Core — Router, Auth, Navigation
// ============================================

const app = {
    currentPage: 'dashboard',
    user: null,

    async init() {
        // Try to get current user
        try {
            const res = await api.getMe();
            this.user = res.user;
            this.showApp();
        } catch {
            this.showAuth();
        }

        this.bindEvents();
    },

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
        this.user = null;
        this.initGoogleSignIn();
    },

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.updateUserUI();
        this.navigate(window.location.hash.slice(1) || 'dashboard');
    },

    updateUserUI() {
        if (!this.user) return;
        const initial = this.user.name?.charAt(0)?.toUpperCase() || '?';

        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const mobileAvatar = document.getElementById('mobile-user-avatar');

        if (this.user.avatar) {
            sidebarAvatar.innerHTML = `<img src="${this.user.avatar}" class="w-full h-full object-cover rounded-full" alt="">`;
            mobileAvatar.innerHTML = `<img src="${this.user.avatar}" class="w-full h-full object-cover rounded-full" alt="">`;
        } else {
            sidebarAvatar.textContent = initial;
            mobileAvatar.textContent = initial;
        }

        document.getElementById('sidebar-username').textContent = this.user.name;
        document.getElementById('sidebar-email').textContent = this.user.email;
    },

    initGoogleSignIn() {
        // Google Sign-In requires a valid Client ID
        // For now, show a placeholder button that guides users
        const loginBtn = document.getElementById('google-signin-btn');
        const signupBtn = document.getElementById('google-signup-btn');

        if (typeof google !== 'undefined' && google.accounts) {
            try {
                google.accounts.id.initialize({
                    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
                    callback: this.handleGoogleCallback.bind(this)
                });
                google.accounts.id.renderButton(loginBtn, {
                    theme: 'filled_black',
                    size: 'large',
                    width: '100%',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'center'
                });
                google.accounts.id.renderButton(signupBtn, {
                    theme: 'filled_black',
                    size: 'large',
                    width: '100%',
                    text: 'signup_with',
                    shape: 'rectangular',
                    logo_alignment: 'center'
                });
            } catch (e) {
                this.renderFallbackGoogleBtn(loginBtn);
                this.renderFallbackGoogleBtn(signupBtn);
            }
        } else {
            this.renderFallbackGoogleBtn(loginBtn);
            this.renderFallbackGoogleBtn(signupBtn);
        }
    },

    renderFallbackGoogleBtn(container) {
        container.innerHTML = `
            <button class="btn-secondary w-full flex items-center justify-center gap-3 py-3 opacity-60 cursor-not-allowed" disabled>
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span class="text-sm">Google Sign-In (Perlu Client ID)</span>
            </button>
        `;
    },

    async handleGoogleCallback(response) {
        try {
            const res = await api.googleLogin(response.credential);
            this.user = res.user;
            this.showApp();
            showToast('Berhasil masuk dengan Google!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('login-error');

            toggleBtnLoading(btn, true);
            errorEl.classList.add('hidden');

            try {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const res = await api.login(email, password);
                this.user = res.user;
                this.showApp();
                showToast('Selamat datang kembali! 👋', 'success');
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('register-error');

            toggleBtnLoading(btn, true);
            errorEl.classList.add('hidden');

            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;

            if (password !== confirm) {
                errorEl.textContent = 'Password tidak cocok';
                errorEl.classList.remove('hidden');
                toggleBtnLoading(btn, false);
                return;
            }

            try {
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const res = await api.register(name, email, password);
                this.user = res.user;
                this.showApp();
                showToast('Akun berhasil dibuat! 🎉', 'success');
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                await api.logout();
                this.showAuth();
                showToast('Berhasil keluar', 'info');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigate(page);
            });
        });

        // Mobile menu
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            this.toggleSidebar(true);
        });

        document.getElementById('sidebar-overlay').addEventListener('click', () => {
            this.toggleSidebar(false);
        });

        // Hash change
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'dashboard';
            this.navigate(page);
        });
    },

    toggleSidebar(show) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (show) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    },

    navigate(page) {
        if (!['dashboard', 'transactions', 'categories', 'reports'].includes(page)) {
            page = 'dashboard';
        }

        this.currentPage = page;
        window.location.hash = page;

        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Close mobile sidebar
        this.toggleSidebar(false);

        // Render page
        const content = document.getElementById('page-content');
        content.innerHTML = '<div class="page-enter"></div>';

        switch (page) {
            case 'dashboard': dashboardPage.render(content); break;
            case 'transactions': transactionsPage.render(content); break;
            case 'categories': categoriesPage.render(content); break;
            case 'reports': reportsPage.render(content); break;
        }
    }
};

// ============================================
// Utilities
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
}

function formatMonthYear(monthStr) {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

function getMonthOptions() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = formatMonthYear(value);
        months.push({ value, label });
    }
    return months;
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error: `<svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        info: `<svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span class="text-white/90">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function toggleBtnLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    if (loading) {
        if (text) text.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
        btn.disabled = true;
    } else {
        if (text) text.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
        btn.disabled = false;
    }
}

function showModal(title, bodyHTML, footerHTML = '') {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'app-modal';
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    overlay.innerHTML = `
        <div class="modal-content">
            <div class="flex items-center justify-between p-6 pb-0">
                <h3 class="text-lg font-semibold text-white">${title}</h3>
                <button onclick="closeModal()" class="btn-icon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-6">${bodyHTML}</div>
            ${footerHTML ? `<div class="px-6 pb-6">${footerHTML}</div>` : ''}
        </div>
    `;

    document.body.appendChild(overlay);
}

function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.remove();
}

function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('register-page').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('register-page').classList.remove('hidden');
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => app.init());
