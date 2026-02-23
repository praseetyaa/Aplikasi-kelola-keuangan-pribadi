// ============================================
// App Core — Router, Auth, Navigation
// ============================================

const app = {
    currentPage: 'dashboard',
    user: null,
    deferredPrompt: null,

    async init() {
        if (typeof api === 'undefined') return;
        try {
            // Apply theme immediately if available
            const themeMode = localStorage.getItem('theme_mode');
            if (themeMode) this.applyThemeMode(themeMode);

            await this.loadBranding();

            const res = await api.getMe();
            this.user = res.user;

            if (this.user) {
                this.showApp();
            } else {
                this.showAuth();
            }
            this.bindEvents();
            this.initPWA();
        } catch (err) {
            this.showAuth();
            this.bindEvents();
        } finally {
            this.hidePreloader();
        }
    },

    initPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then((reg) => console.log('SW registered'))
                .catch((err) => console.log('SW error:', err));
        }

        // PWA Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            setTimeout(() => this.showInstallPrompt(), 3000);
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            console.log('PWA installed');
        });
    },

    showInstallPrompt() {
        if (!this.deferredPrompt || localStorage.getItem('pwa_install_dismissed')) return;
        
        const toast = document.createElement('div');
        toast.id = 'pwa-install-toast';
        toast.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass-card rounded-2xl p-4 flex items-center gap-4 z-50 animate-fade-in';
        toast.innerHTML = `
            <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
            </div>
            <div class="flex-1">
                <h4 class="text-white font-medium">Install DuitKu</h4>
                <p class="text-dark-200/60 text-sm">Tambah ke layar utama untuk pengalaman terbaik</p>
            </div>
            <div class="flex gap-2">
                <button onclick="app.dismissInstallPrompt()" class="px-3 py-1.5 text-sm text-dark-200/60 hover:text-white">Nanti</button>
                <button onclick="app.installPWA()" class="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg font-medium">Install</button>
            </div>
        `;
        document.body.appendChild(toast);
    },

    async installPWA() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        const toast = document.getElementById('pwa-install-toast');
        if (toast) toast.remove();
        if (outcome === 'accepted') {
            showToast('DuitKu berhasil diinstall!', 'success');
        }
    },

    dismissInstallPrompt() {
        localStorage.setItem('pwa_install_dismissed', 'true');
        const toast = document.getElementById('pwa-install-toast');
        if (toast) toast.remove();
    },

    hidePreloader() {
        const preloader = document.getElementById('app-preloader');
        if (preloader) {
            const enablePreload = localStorage.getItem('enable_preload');
            if (enablePreload === 'false') {
                preloader.style.display = 'none';
            } else {
                // Minimum display time for smooth animation feel
                setTimeout(() => {
                    preloader.style.opacity = '0';
                    preloader.style.pointerEvents = 'none';
                    setTimeout(() => preloader.style.display = 'none', 600);
                }, 800);
            }
        }
    },

    async loadBranding() {
        try {
            const settings = await api.getSettings();
            this.settings = settings;
            const name = settings.app_name || 'DuitKu';
            const tagline = settings.app_tagline || 'Keuangan Pribadi';
            const logo = settings.app_logo || '';
            const themeColor = settings.theme_color || '';

            // Update page title
            document.title = name;
            if (settings) {
                if (settings.app_name) {
                    document.querySelectorAll('.app-name').forEach(el => el.textContent = settings.app_name);
                    document.title = settings.app_name + ' - Kelola Keuangan';
                }
                if (settings.app_tagline) {
                    document.querySelectorAll('.app-tagline').forEach(el => el.textContent = settings.app_tagline);
                }
                if (settings.app_logo) {
                    const url = settings.app_logo + '?t=' + new Date().getTime();
                    ['login-logo-box', 'register-logo-box', 'sidebar-logo-box'].forEach(id => {
                        const box = document.getElementById(id);
                        if (box) box.innerHTML = `<img src="${url}" alt="Logo" class="w-full h-full object-cover rounded-xl shadow-lg">`;
                    });
                }
                if (settings.theme_color) this.applyThemeColor(settings.theme_color);

                // Keep localStorage in sync with DB setup
                if (settings.theme_mode) {
                    localStorage.setItem('theme_mode', settings.theme_mode);
                    this.applyThemeMode(settings.theme_mode);
                }
                if (settings.enable_preload) {
                    localStorage.setItem('enable_preload', settings.enable_preload);
                }

                if (settings.google_client_id) {
                    // Update tagline elements
                    document.querySelectorAll('.app-tagline').forEach(el => {
                        if (el.closest('#login-page')) {
                            el.textContent = 'Kelola keuangan pribadimu dengan mudah';
                        } else {
                            el.textContent = tagline;
                        }
                    });

                    // Update logo elements
                    const logoBoxes = ['login-logo-box', 'register-logo-box', 'sidebar-logo-box'];
                    logoBoxes.forEach(id => {
                        const box = document.getElementById(id);
                        if (!box) return;
                        if (logo) {
                            box.innerHTML = `<img src="${logo}" class="w-full h-full object-cover rounded-xl" alt="${name}">`;
                        } else {
                            const svgSize = id === 'sidebar-logo-box' ? 'w-5 h-5' : 'w-8 h-8';
                            box.innerHTML = `<svg class="${svgSize} text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08.402-2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
                        }
                    });
                }
            }

            // Apply theme color
            if (themeColor) {
                this.applyThemeColor(themeColor);
            }
        } catch (e) {
            console.error("Error loading branding:", e);
        }
    },

    applyThemeColor(hex) {
        const palette = this.generatePalette(hex);
        const root = document.documentElement;
        const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        shades.forEach((shade, i) => {
            root.style.setProperty(`--theme-${shade}`, palette[i]);
        });
        // Set RGB for use in rgba()
        const rgb = this.hexToRgb(palette[5]);
        root.style.setProperty('--theme-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

        // Update Tailwind primary colors dynamically
        if (typeof tailwind !== 'undefined' && tailwind.config) {
            const primaryColors = {};
            shades.forEach((shade, i) => { primaryColors[shade] = palette[i]; });
            tailwind.config.theme.extend.colors.primary = primaryColors;
        }

        // Update gradient text colors on app-name elements
        document.querySelectorAll('.app-name').forEach(el => {
            el.style.background = `linear-gradient(to right, ${palette[4]}, ${palette[3]})`;
            el.style.webkitBackgroundClip = 'text';
            el.style.webkitTextFillColor = 'transparent';
            el.style.backgroundClip = 'text';
        });

        // Update logo box backgrounds
        ['login-logo-box', 'register-logo-box', 'sidebar-logo-box'].forEach(id => {
            const box = document.getElementById(id);
            if (box && !box.querySelector('img')) {
                box.style.background = `linear-gradient(to bottom right, ${palette[4]}, ${palette[6]})`;
            }
        });
    },

    applyThemeMode(mode) {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (mode === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // System mode
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            // Listen for system changes
            if (!this.themeChangeListenerAssigned) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                    if (localStorage.getItem('theme_mode') === 'system') {
                        if (e.matches) document.documentElement.classList.add('dark');
                        else document.documentElement.classList.remove('dark');
                    }
                });
                this.themeChangeListenerAssigned = true;
            }
        }
    },

    generatePalette(hex) {
        const hsl = this.hexToHsl(hex);
        const h = hsl.h;
        return [
            this.hslToHex(h, Math.min(hsl.s + 20, 100), 97),  // 50
            this.hslToHex(h, Math.min(hsl.s + 15, 100), 93),  // 100
            this.hslToHex(h, Math.min(hsl.s + 10, 100), 85),  // 200
            this.hslToHex(h, Math.min(hsl.s + 5, 100), 75),   // 300
            this.hslToHex(h, hsl.s, 62),                       // 400
            this.hslToHex(h, hsl.s, 48),                       // 500 (base)
            this.hslToHex(h, Math.min(hsl.s + 5, 100), 40),   // 600
            this.hslToHex(h, Math.min(hsl.s + 8, 100), 33),   // 700
            this.hslToHex(h, Math.min(hsl.s + 5, 100), 27),   // 800
            this.hslToHex(h, Math.min(hsl.s + 3, 100), 22),   // 900
            this.hslToHex(h, Math.min(hsl.s + 5, 100), 12),   // 950
        ];
    },

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    },

    hexToHsl(hex) {
        let { r, g, b } = this.hexToRgb(hex);
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    },

    hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
        const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
        return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
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
        // Google Sign-In requires a valid Client ID from Settings
        const loginBtn = document.getElementById('google-signin-btn');
        const signupBtn = document.getElementById('google-signup-btn');

        if (!loginBtn && !signupBtn) return;

        if (!this.settings?.google_client_id) {
            if (loginBtn) this.renderFallbackGoogleBtn(loginBtn);
            if (signupBtn) this.renderFallbackGoogleBtn(signupBtn);
            return;
        }

        if (typeof google !== 'undefined' && google.accounts) {
            try {
                google.accounts.id.initialize({
                    client_id: this.settings.google_client_id,
                    callback: this.handleGoogleCallback.bind(this)
                });
                if (loginBtn) {
                    google.accounts.id.renderButton(loginBtn, {
                        theme: 'filled_black',
                        size: 'large',
                        width: '100%',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'center'
                    });
                }
                if (signupBtn) {
                    google.accounts.id.renderButton(signupBtn, {
                        theme: 'filled_black',
                        size: 'large',
                        width: '100%',
                        text: 'signup_with',
                        shape: 'rectangular',
                        logo_alignment: 'center'
                    });
                }
            } catch (e) {
                if (loginBtn) this.renderFallbackGoogleBtn(loginBtn);
                if (signupBtn) this.renderFallbackGoogleBtn(signupBtn);
            }
        } else {
            if (loginBtn) this.renderFallbackGoogleBtn(loginBtn);
            if (signupBtn) this.renderFallbackGoogleBtn(signupBtn);
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

        // Register form — sends verification code
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
                const res = await api.sendCode(name, email, password);
                this._pendingEmail = email;
                showVerify(email, res.dev_code || null);
                showToast(res.message, 'success');
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });

        // Verification code form
        document.getElementById('verify-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('verify-error');
            toggleBtnLoading(btn, true);
            errorEl.classList.add('hidden');

            const digits = document.querySelectorAll('.verify-digit');
            const code = Array.from(digits).map(d => d.value).join('');
            if (code.length !== 6) {
                errorEl.textContent = 'Masukkan 6 digit kode verifikasi';
                errorEl.classList.remove('hidden');
                toggleBtnLoading(btn, false);
                return;
            }

            try {
                const res = await api.verifyRegister(this._pendingEmail, code);
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

        // Digit inputs auto-advance
        document.querySelectorAll('.verify-digit').forEach((input, idx, all) => {
            input.addEventListener('input', (e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = val;
                if (val && idx < all.length - 1) all[idx + 1].focus();
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                    all[idx - 1].focus();
                }
            });
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
                Array.from(all).forEach((inp, i) => { inp.value = paste[i] || ''; });
                const last = Math.min(paste.length, all.length) - 1;
                if (last >= 0) all[last].focus();
            });
        });

        // Forgot password — step 1: send code
        document.getElementById('forgot-email-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('forgot-error');
            toggleBtnLoading(btn, true);
            errorEl.classList.add('hidden');

            try {
                const email = document.getElementById('forgot-email').value;
                const res = await api.forgotPassword(email);
                this._resetEmail = email;
                // Show dev code if available
                if (res.dev_code) {
                    document.getElementById('forgot-dev-code').classList.remove('hidden');
                    document.getElementById('forgot-dev-code-value').textContent = res.dev_code;
                }
                document.getElementById('forgot-step-email').classList.add('hidden');
                document.getElementById('forgot-step-reset').classList.remove('hidden');
                showToast(res.message, 'success');
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });

        // Forgot password — step 2: reset
        document.getElementById('forgot-reset-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('reset-error');
            toggleBtnLoading(btn, true);
            errorEl.classList.add('hidden');

            const newPw = document.getElementById('forgot-new-password').value;
            const confirmPw = document.getElementById('forgot-confirm-password').value;
            if (newPw !== confirmPw) {
                errorEl.textContent = 'Password tidak cocok';
                errorEl.classList.remove('hidden');
                toggleBtnLoading(btn, false);
                return;
            }

            try {
                const code = document.getElementById('forgot-code').value;
                const res = await api.resetPassword(this._resetEmail, code, newPw);
                showToast(res.message, 'success');
                showLogin();
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
            this.toggleSidebar();
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

        const isCurrentlyOpen = !sidebar.classList.contains('-translate-x-full');
        const shouldShow = show !== undefined ? show : !isCurrentlyOpen;

        if (shouldShow) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    },

    navigate(page) {
        if (!['dashboard', 'transactions', 'categories', 'reports', 'settings', 'wallets', 'planning', 'notifications'].includes(page)) {
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
            case 'wallets': walletsPage.render(content); break;
            case 'planning': planningPage.render(content); break;
            case 'settings': settingsPage.render(content); break;
            case 'notifications': notificationsPage.render(content); break;
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

/**
 * Format angka ke string seperti "10.000.000" (titik = pemisah ribuan, tanpa Rp)
 */
/**
 * Format angka ke string seperti "10.000.000" (titik = pemisah ribuan, tanpa Rp)
 */
function formatInputNumber(value) {
    if (value === null || value === undefined || value === '') return '';

    let str = String(value).trim();

    // Check if it's from database (has .00 decimals, and no thousand separators)
    if (str.includes('.') && str.split('.')[1].length === 2 && !str.includes(',')) {
        str = String(Math.round(parseFloat(str)));
    }

    // Remove everything except numbers (strips dots, commas, etc)
    const num = str.replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num, 10).toLocaleString('id-ID');
}

/**
 * Bersihkan string format "10.000" → angka 10000
 */
function parseInputNumber(value) {
    if (value === null || value === undefined) return 0;

    let str = String(value).trim();
    if (str === '') return 0;

    // Deteksi jika ini format database dengan sen (misal 10000.00)
    if (str.includes('.') && str.split('.')[1].length === 2 && !str.includes(',')) {
        return Math.round(parseFloat(str)) || 0;
    }

    // Format input user indonesia (titik sebagai ribuan)
    const clean = str.replace(/\./g, '').replace(/,/g, '');
    return clean === '' ? 0 : (parseInt(clean, 10) || 0);
}

/**
 * Pasang listener auto-format rupiah pada sebuah input element.
 * Nilai mentah (angka) bisa diambil lewat parseInputNumber(el.value).
 */
function attachCurrencyInput(el) {
    if (!el) return;
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('autocomplete', 'off');

    el.addEventListener('input', function () {
        const cursorPos = this.selectionStart;
        const oldLen = this.value.length;
        const raw = this.value.replace(/\D/g, '');
        const formatted = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
        this.value = formatted;
        // Pertahankan posisi kursor
        const diff = formatted.length - oldLen;
        try { this.setSelectionRange(cursorPos + diff, cursorPos + diff); } catch (_) { }
    });

    el.addEventListener('blur', function () {
        const raw = this.value.replace(/\D/g, '');
        this.value = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
    });
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
    document.getElementById('verify-page').classList.add('hidden');
    document.getElementById('forgot-page').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('register-page').classList.remove('hidden');
    document.getElementById('verify-page').classList.add('hidden');
    document.getElementById('forgot-page').classList.add('hidden');
}

function showVerify(email, devCode) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('register-page').classList.add('hidden');
    document.getElementById('verify-page').classList.remove('hidden');
    document.getElementById('forgot-page').classList.add('hidden');
    document.getElementById('verify-email-hint').textContent = 'Masukkan kode 6 digit yang dikirim ke ' + email;
    // Clear digits
    document.querySelectorAll('.verify-digit').forEach(d => d.value = '');
    document.querySelectorAll('.verify-digit')[0]?.focus();
    // Dev code hint
    if (devCode) {
        document.getElementById('dev-code-hint').classList.remove('hidden');
        document.getElementById('dev-code-value').textContent = devCode;
    } else {
        document.getElementById('dev-code-hint').classList.add('hidden');
    }
}

function showForgotPassword() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('register-page').classList.add('hidden');
    document.getElementById('verify-page').classList.add('hidden');
    document.getElementById('forgot-page').classList.remove('hidden');
    // Reset to step 1
    document.getElementById('forgot-step-email').classList.remove('hidden');
    document.getElementById('forgot-step-reset').classList.add('hidden');
    document.getElementById('forgot-dev-code').classList.add('hidden');
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => app.init());
