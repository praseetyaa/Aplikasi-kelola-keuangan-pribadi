// ============================================
// Profile Page
// ============================================

const profilePage = {
    async render(container) {
        // Build base layout first
        container.innerHTML = `
        <div class="page-enter">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-2xl lg:text-3xl font-bold text-dark-950 dark:text-dark-950 dark:text-white">Profil</h2>
                    <p class="text-gray-400 dark:text-dark-200/50 mt-1">Kelola akun dan pengaturan</p>
                </div>
            </div>

            <!-- Profile Info Card -->
            <div class="glass-card rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden group">
                <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary-500/20 transition-colors duration-500"></div>
                
                <div class="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div class="relative">
                        <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-primary-500/20 flex items-center justify-center text-4xl text-primary-400 font-bold overflow-hidden border-4 border-dark-900 shadow-xl" id="profile-avatar">
                            ${app.user ? app.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                    
                    <div class="flex-1 text-center sm:text-left pt-2">
                        <h3 class="text-2xl font-bold text-dark-950 dark:text-white mb-1" id="profile-name">
                            ${app.user ? app.user.name : 'Memuat...'}
                        </h3>
                        <p class="text-gray-500 dark:text-dark-200/60 font-medium flex items-center justify-center sm:justify-start gap-2" id="profile-email">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            ${app.user ? app.user.email : 'Memuat...'}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Profile Menus Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- Kelola Akun -->
                <button onclick="profilePage.editProfile()" class="glass-card rounded-2xl p-5 hover:bg-white/5 transition-all text-left flex items-start gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h4 class="text-dark-950 dark:text-white font-semibold mb-1">Edit Profil</h4>
                        <p class="text-sm text-gray-500 dark:text-dark-200/60 transition-colors line-clamp-2">Ubah nama pengguna atau informasi identitas diri.</p>
                    </div>
                </button>

                <!-- Keamanan -->
                <button onclick="profilePage.editSecurity()" class="glass-card rounded-2xl p-5 hover:bg-white/5 transition-all text-left flex items-start gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <h4 class="text-dark-950 dark:text-white font-semibold mb-1">Ubah Password</h4>
                        <p class="text-sm text-gray-500 dark:text-dark-200/60 transition-colors line-clamp-2">Amankan akun dengan memperbarui kata sandi secara berkala.</p>
                    </div>
                </button>

                <!-- Pengaturan -->
                <button onclick="app.navigate('settings')" class="glass-card rounded-2xl p-5 hover:bg-white/5 transition-all text-left flex items-start gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 class="text-dark-950 dark:text-white font-semibold mb-1">Pengaturan Aplikasi</h4>
                        <p class="text-sm text-gray-500 dark:text-dark-200/60 transition-colors line-clamp-2">Sesuaikan tema, integrasi API, pembaruan, dan notifikasi.</p>
                    </div>
                </button>

                <!-- Logout -->
                <button onclick="profilePage.confirmLogout()" class="glass-card rounded-2xl p-5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-left flex items-start gap-4 group">
                    <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-dark-950 dark:text-white shadow-lg shadow-transparent group-hover:shadow-red-500/30 transition-all flex-shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div>
                        <h4 class="text-dark-950 dark:text-white font-semibold mb-1 group-hover:text-red-400 transition-colors">Keluar</h4>
                        <p class="text-sm text-gray-500 dark:text-dark-200/60 group-hover:text-red-400/70 transition-colors line-clamp-2">Akhiri sesi dan keluar dari aplikasi secara aman.</p>
                    </div>
                </button>

            </div>
            
            <!-- Modals Container -->
            <div id="profile-modals"></div>
        </div>
        `;

        if (app.user && app.user.photo) {
            document.getElementById('profile-avatar').innerHTML = `<img src="${app.user.photo}" class="w-full h-full object-cover">`;
        }
    },

    editProfile() {
        const modalHtml = `
            <div class="modal fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                <div class="fixed inset-0 bg-gray-50 dark:bg-dark-950/80 backdrop-blur-sm transition-opacity" onclick="closeModal(this)"></div>
                <div class="glass-card w-full max-w-md rounded-3xl z-10 p-6 transform transition-all shadow-2xl relative">
                     <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-dark-950 dark:text-dark-950 dark:text-white">Edit Profil</h3>
                        <button onclick="closeModal(this)" class="p-2 text-gray-500 dark:text-dark-200/60 hover:text-dark-950 dark:text-white hover:bg-white/5 rounded-xl transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <form id="profile-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Nama Lengkap</label>
                            <input type="text" id="prof-name" class="input-field w-full" value="${app.user ? app.user.name : ''}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Email (Tidak bisa diubah)</label>
                            <input type="email" class="input-field w-full opacity-60 bg-dark-800" value="${app.user ? app.user.email : ''}" disabled>
                        </div>
                        <div class="flex gap-3 pt-2">
                            <button type="button" onclick="closeModal(this)" class="btn-secondary flex-1 py-3">Batal</button>
                            <button type="submit" class="btn-primary flex-1 py-3">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(modalHtml, 'text/html');
        const modalEl = doc.body.firstChild;
        document.body.appendChild(modalEl);

        setTimeout(() => modalEl.classList.add('show'), 10);

        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const name = document.getElementById('prof-name').value;

            toggleBtnLoading(btn, true);
            try {
                const res = await api.updateProfile(name);
                app.user = res.user;

                document.getElementById('profile-name').textContent = res.user.name;
                document.getElementById('sidebar-username').textContent = res.user.name;

                showToast('Profil berhasil diperbarui', 'success');
                closeModal(modalEl.querySelector('.bg-gray-50 dark:bg-dark-950\\/80'));
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });
    },

    editSecurity() {
        const modalHtml = `
            <div class="modal fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                <div class="fixed inset-0 bg-gray-50 dark:bg-dark-950/80 backdrop-blur-sm transition-opacity" onclick="closeModal(this)"></div>
                <div class="glass-card w-full max-w-md rounded-3xl z-10 p-6 transform transition-all shadow-2xl relative">
                     <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-dark-950 dark:text-dark-950 dark:text-white">Ubah Password</h3>
                        <button onclick="closeModal(this)" class="p-2 text-gray-500 dark:text-dark-200/60 hover:text-dark-950 dark:text-white hover:bg-white/5 rounded-xl transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <form id="password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Password Lama</label>
                            <input type="password" id="prof-old-pass" class="input-field w-full" placeholder="••••••••" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Password Baru</label>
                            <input type="password" id="prof-new-pass" class="input-field w-full" placeholder="Minimal 6 karakter" minlength="6" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-dark-200/70 mb-1.5">Konfirmasi Password Baru</label>
                            <input type="password" id="prof-conf-pass" class="input-field w-full" placeholder="Ulangi password baru" minlength="6" required>
                        </div>
                        <div class="flex gap-3 pt-2">
                            <button type="button" onclick="closeModal(this)" class="btn-secondary flex-1 py-3">Batal</button>
                            <button type="submit" class="btn-primary flex-1 py-3">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(modalHtml, 'text/html');
        const modalEl = doc.body.firstChild;
        document.body.appendChild(modalEl);

        setTimeout(() => modalEl.classList.add('show'), 10);

        document.getElementById('password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPass = document.getElementById('prof-old-pass').value;
            const newPass = document.getElementById('prof-new-pass').value;
            const confPass = document.getElementById('prof-conf-pass').value;

            if (newPass !== confPass) {
                return showToast('Konfirmasi password tidak cocok', 'error');
            }

            const btn = e.target.querySelector('button[type="submit"]');

            toggleBtnLoading(btn, true);
            try {
                await api.updatePassword(oldPass, newPass);
                showToast('Password berhasil diperbarui', 'success');
                closeModal(modalEl.querySelector('.bg-gray-50 dark:bg-dark-950\\/80'));
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                toggleBtnLoading(btn, false);
            }
        });
    },

    confirmLogout() {
        const modalHtml = `
            <div class="modal fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                <div class="fixed inset-0 bg-gray-50 dark:bg-dark-950/80 backdrop-blur-sm transition-opacity" onclick="closeModal(this)"></div>
                <div class="glass-card w-full max-w-sm rounded-3xl z-10 p-6 transform transition-all shadow-2xl relative text-center">
                     <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500">
                         <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     </div>
                     <h3 class="text-xl font-bold text-dark-950 dark:text-dark-950 dark:text-white mb-2">Keluar Aplikasi</h3>
                     <p class="text-gray-500 dark:text-dark-200/60 mb-6 text-sm">Sesi Anda saat ini akan dihentikan. Anda harus masuk kembali untuk melihat data.</p>
                     
                     <div class="flex gap-3">
                         <button onclick="closeModal(this)" class="btn-secondary flex-1 py-3 text-sm">Batal</button>
                         <button onclick="app.logout(); closeModal(this)" class="flex-1 py-3 text-sm bg-red-500 hover:bg-red-600 text-dark-950 dark:text-white font-medium rounded-xl transition-colors">Keluar Sekarang</button>
                     </div>
                </div>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(modalHtml, 'text/html');
        document.body.appendChild(doc.body.firstChild);

        setTimeout(() => document.body.lastChild.classList.add('show'), 10);
    }
};
