// ============================================
// Settings Page
// ============================================

const settingsPage = {
    settings: {},
    _removeLogo: false,

    // Curated color palette presets
    presets: [
        { name: 'Emerald', color: '#10b981', icon: '🌿' },
        { name: 'Blue', color: '#3b82f6', icon: '💎' },
        { name: 'Violet', color: '#8b5cf6', icon: '🔮' },
        { name: 'Rose', color: '#f43f5e', icon: '🌹' },
        { name: 'Amber', color: '#f59e0b', icon: '🌟' },
        { name: 'Cyan', color: '#06b6d4', icon: '🧊' },
        { name: 'Pink', color: '#ec4899', icon: '🌸' },
        { name: 'Indigo', color: '#6366f1', icon: '🪻' },
        { name: 'Teal', color: '#14b8a6', icon: '🌊' },
        { name: 'Orange', color: '#f97316', icon: '🍊' },
        { name: 'Lime', color: '#84cc16', icon: '🍃' },
        { name: 'Sky', color: '#0ea5e9', icon: '☁️' },
    ],

    async render(container) {
        const presetGrid = this.presets.map(p => `
            <button type="button" 
                class="theme-preset-btn group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/5 hover:border-white/15 transition-all duration-200 hover:scale-105"
                data-color="${p.color}" onclick="settingsPage.selectPreset('${p.color}')">
                <div class="w-10 h-10 rounded-lg shadow-lg transition-transform" style="background: ${p.color}"></div>
                <span class="text-[10px] font-medium text-dark-200/50 group-hover:text-white/70 transition-colors">${p.name}</span>
                <div class="theme-check hidden absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                    <svg class="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
            </button>
        `).join('');

        container.innerHTML = `
        <div class="page-enter">
            <div class="mb-6">
                <h2 class="text-2xl lg:text-3xl font-bold text-white">Pengaturan</h2>
                <p class="text-dark-200/50 mt-1">Kustomisasi tampilan aplikasi</p>
            </div>

            <form id="settings-form" class="space-y-6 max-w-3xl">
                <!-- Branding Section -->
                <div class="glass-card rounded-2xl p-6 lg:p-8">
                    <h3 class="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <svg class="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                        Branding
                    </h3>
                    
                    <!-- App Name -->
                    <div class="mb-5">
                        <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Nama Aplikasi</label>
                        <input type="text" id="setting-app-name" class="input-field w-full" placeholder="DuitKu">
                        <p class="text-xs text-dark-200/40 mt-1">Nama di header, sidebar, dan halaman login</p>
                    </div>

                    <!-- Tagline -->
                    <div class="mb-5">
                        <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Tagline</label>
                        <input type="text" id="setting-app-tagline" class="input-field w-full" placeholder="Keuangan Pribadi">
                        <p class="text-xs text-dark-200/40 mt-1">Teks pendek di bawah nama aplikasi</p>
                    </div>

                    <!-- Logo -->
                    <div>
                        <label class="block text-sm font-medium text-dark-200/70 mb-2">Logo Aplikasi</label>
                        <div id="logo-preview-area" class="mb-3">
                            <div id="logo-current" class="hidden flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <img id="logo-preview-img" src="" class="w-14 h-14 rounded-xl object-cover" alt="Logo">
                                <div class="flex-1">
                                    <p class="text-sm text-white">Logo saat ini</p>
                                    <button type="button" onclick="settingsPage.removeLogo()" class="text-xs text-red-400 hover:text-red-300 mt-1 transition-colors">Hapus logo</button>
                                </div>
                            </div>
                        </div>
                        <label class="cursor-pointer block">
                            <div class="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-5 text-center transition-colors">
                                <svg class="w-7 h-7 mx-auto text-dark-200/30 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                <p class="text-xs text-dark-200/50">Upload — PNG, JPG, SVG, WebP (Maks 2MB)</p>
                            </div>
                            <input type="file" id="setting-logo-file" accept="image/*" class="hidden" onchange="settingsPage.previewLogo(this)">
                        </label>
                        <div id="logo-new-preview" class="hidden mt-3 flex items-center gap-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <img id="logo-new-img" src="" class="w-14 h-14 rounded-xl object-cover" alt="Preview">
                            <div class="flex-1">
                                <p class="text-sm text-emerald-400">Logo baru</p>
                                <button type="button" onclick="settingsPage.cancelNewLogo()" class="text-xs text-dark-200/40 hover:text-white mt-1 transition-colors">Batalkan</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Theme Color Section -->
                <div class="glass-card rounded-2xl p-6 lg:p-8">
                    <h3 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
                        Tema Warna
                    </h3>
                    <p class="text-xs text-dark-200/40 mb-5">Pilih warna aksen untuk tombol, navigasi, dan elemen interaktif</p>

                    <!-- Preset Palettes -->
                    <div class="mb-5">
                        <label class="block text-xs font-medium text-dark-200/50 mb-3 uppercase tracking-wider">Palet Warna</label>
                        <div class="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                            ${presetGrid}
                        </div>
                    </div>

                    <!-- Custom Color Picker -->
                    <div class="pt-4 border-t border-white/5">
                        <label class="block text-xs font-medium text-dark-200/50 mb-3 uppercase tracking-wider">Warna Kustom</label>
                        <div class="flex items-center gap-4">
                            <div class="relative">
                                <input type="color" id="setting-theme-picker" value="#10b981" 
                                    class="w-14 h-14 rounded-xl cursor-pointer border-2 border-white/10 hover:border-white/20 transition-colors" 
                                    style="padding: 2px;"
                                    oninput="settingsPage.onPickerChange(this.value)">
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1.5">
                                    <span class="text-xs text-dark-200/40 font-mono">HEX</span>
                                    <input type="text" id="setting-theme-hex" value="#10b981" maxlength="7"
                                        class="input-field text-sm font-mono w-28 py-1.5 px-3" placeholder="#10b981"
                                        oninput="settingsPage.onHexInput(this.value)">
                                </div>
                                <div id="theme-palette-preview" class="flex gap-1 mt-2">
                                    <!-- populated by JS -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Reset theme -->
                    <div class="mt-4 pt-3 border-t border-white/5">
                        <button type="button" onclick="settingsPage.resetTheme()" class="text-xs text-dark-200/40 hover:text-white transition-colors flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            Reset ke warna default (Emerald)
                        </button>
                    </div>
                </div>

                <!-- Save Button (Branding + Theme) -->
                <div class="flex items-center justify-between py-2">
                    <p id="settings-status" class="text-sm text-dark-200/40"></p>
                    <button type="submit" class="btn-primary px-8 py-3">
                        <span class="btn-text">💾 Simpan Tampilan</span>
                        <span class="btn-loading hidden">
                            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        </span>
                    </button>
                </div>
            </form>

            <!-- Account Section (separate forms) -->
            <div class="glass-card rounded-2xl p-6 lg:p-8 max-w-3xl mt-6">
                <h3 class="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <svg class="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Akun
                </h3>

                <!-- Change Name -->
                <form id="account-name-form" class="mb-6 pb-6 border-b border-white/5">
                    <label class="block text-sm font-medium text-dark-200/70 mb-1.5">Nama</label>
                    <div class="flex gap-3">
                        <input type="text" id="setting-account-name" class="input-field flex-1" placeholder="Nama kamu">
                        <button type="submit" class="btn-primary px-5 text-sm whitespace-nowrap">
                            <span class="btn-text">Ubah Nama</span>
                            <span class="btn-loading hidden"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>
                        </button>
                    </div>
                </form>

                <!-- Change Password -->
                <form id="account-password-form" class="space-y-4">
                    <h4 class="text-sm font-medium text-dark-200/70">Ubah Password</h4>
                    <div>
                        <label class="block text-xs text-dark-200/50 mb-1">Password Saat Ini</label>
                        <input type="password" id="setting-current-pw" class="input-field w-full" placeholder="••••••••" required>
                    </div>
                    <div>
                        <label class="block text-xs text-dark-200/50 mb-1">Password Baru</label>
                        <input type="password" id="setting-new-pw" class="input-field w-full" placeholder="Minimal 6 karakter" required minlength="6">
                    </div>
                    <div>
                        <label class="block text-xs text-dark-200/50 mb-1">Konfirmasi Password Baru</label>
                        <input type="password" id="setting-confirm-pw" class="input-field w-full" placeholder="Ulangi password baru" required>
                    </div>
                    <div id="password-error" class="hidden text-red-400 text-sm bg-red-500/10 rounded-lg p-3"></div>
                    <div class="flex justify-end">
                        <button type="submit" class="btn-primary px-5 text-sm">
                            <span class="btn-text">🔒 Ubah Password</span>
                            <span class="btn-loading hidden"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></span>
                        </button>
                    </div>
                </form>
            </div>
        </div>`;

        this.loadSettings();
        this.bindForm();
    },

    async loadSettings() {
        try {
            const settings = await api.getSettings();
            this.settings = settings;
            document.getElementById('setting-app-name').value = settings.app_name || '';
            document.getElementById('setting-app-tagline').value = settings.app_tagline || '';

            if (settings.app_logo) {
                document.getElementById('logo-current').classList.remove('hidden');
                document.getElementById('logo-preview-img').src = settings.app_logo;
            } else {
                document.getElementById('logo-current').classList.add('hidden');
            }

            // Theme color
            const color = settings.theme_color || '#10b981';
            document.getElementById('setting-theme-picker').value = color;
            document.getElementById('setting-theme-hex').value = color;
            this.updatePalettePreview(color);
            this.highlightPreset(color);

            // Account name
            if (app.user) {
                document.getElementById('setting-account-name').value = app.user.name || '';
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    selectPreset(color) {
        document.getElementById('setting-theme-picker').value = color;
        document.getElementById('setting-theme-hex').value = color;
        this.highlightPreset(color);
        this.updatePalettePreview(color);
        // Live preview
        app.applyThemeColor(color);
    },

    highlightPreset(activeColor) {
        document.querySelectorAll('.theme-preset-btn').forEach(btn => {
            const check = btn.querySelector('.theme-check');
            const isActive = btn.dataset.color === activeColor;
            btn.classList.toggle('border-white/30', isActive);
            btn.classList.toggle('bg-white/5', isActive);
            if (check) check.classList.toggle('hidden', !isActive);
        });
    },

    onPickerChange(color) {
        document.getElementById('setting-theme-hex').value = color;
        this.highlightPreset(color);
        this.updatePalettePreview(color);
        app.applyThemeColor(color);
    },

    onHexInput(val) {
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            document.getElementById('setting-theme-picker').value = val;
            this.highlightPreset(val);
            this.updatePalettePreview(val);
            app.applyThemeColor(val);
        }
    },

    updatePalettePreview(color) {
        const palette = app.generatePalette(color);
        const container = document.getElementById('theme-palette-preview');
        if (!container) return;
        container.innerHTML = palette.map((c, i) => {
            const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
            return `<div class="flex flex-col items-center gap-0.5">
                <div class="w-6 h-6 rounded-md shadow-sm border border-white/10" style="background:${c}" title="${shades[i]}"></div>
                <span class="text-[8px] text-dark-200/30">${shades[i]}</span>
            </div>`;
        }).join('');
    },

    resetTheme() {
        const defaultColor = '#10b981';
        this.selectPreset(defaultColor);
        showToast('Warna direset ke default', 'info');
    },

    previewLogo(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.size > 2 * 1024 * 1024) {
                showToast('Ukuran file maksimal 2MB', 'error');
                input.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('logo-new-img').src = e.target.result;
                document.getElementById('logo-new-preview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    },

    cancelNewLogo() {
        document.getElementById('setting-logo-file').value = '';
        document.getElementById('logo-new-preview').classList.add('hidden');
    },

    removeLogo() {
        this._removeLogo = true;
        document.getElementById('logo-current').classList.add('hidden');
        showToast('Logo akan dihapus saat menyimpan', 'info');
    },

    bindForm() {
        // Branding + Theme form
        const form = document.getElementById('settings-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const statusEl = document.getElementById('settings-status');
            toggleBtnLoading(btn, true);
            statusEl.textContent = 'Menyimpan...';

            try {
                const formData = new FormData();
                formData.append('app_name', document.getElementById('setting-app-name').value.trim());
                formData.append('app_tagline', document.getElementById('setting-app-tagline').value.trim());
                formData.append('theme_color', document.getElementById('setting-theme-hex').value.trim());

                const logoFile = document.getElementById('setting-logo-file').files[0];
                if (logoFile) formData.append('logo', logoFile);
                if (this._removeLogo) { formData.append('remove_logo', '1'); this._removeLogo = false; }

                await api.saveSettings(formData);
                showToast('Tampilan berhasil disimpan! 🎉', 'success');
                statusEl.textContent = 'Tersimpan!';
                await app.loadBranding();
                this.cancelNewLogo();
                this.loadSettings();
            } catch (err) {
                showToast(err.message, 'error');
                statusEl.textContent = 'Gagal menyimpan';
            } finally {
                toggleBtnLoading(btn, false);
                setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
            }
        });

        // Account name form
        document.getElementById('account-name-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            toggleBtnLoading(btn, true);
            try {
                const name = document.getElementById('setting-account-name').value.trim();
                if (!name) throw new Error('Nama tidak boleh kosong');
                const res = await api.updateProfile(name);
                app.user = res.user;
                app.updateUserUI();
                showToast('Nama berhasil diubah!', 'success');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });

        // Account password form
        document.getElementById('account-password-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('password-error');
            toggleBtnLoading(btn, true);
            errorEl.classList.add('hidden');

            const newPw = document.getElementById('setting-new-pw').value;
            const confirmPw = document.getElementById('setting-confirm-pw').value;
            if (newPw !== confirmPw) {
                errorEl.textContent = 'Password baru tidak cocok';
                errorEl.classList.remove('hidden');
                toggleBtnLoading(btn, false);
                return;
            }

            try {
                const currentPw = document.getElementById('setting-current-pw').value;
                await api.updatePassword(currentPw, newPw);
                showToast('Password berhasil diubah! 🔒', 'success');
                document.getElementById('setting-current-pw').value = '';
                document.getElementById('setting-new-pw').value = '';
                document.getElementById('setting-confirm-pw').value = '';
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });
    }
};
