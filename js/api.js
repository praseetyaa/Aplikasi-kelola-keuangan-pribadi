// ============================================
// API Client
// ============================================

const API_BASE = 'api';

const api = {
    async request(url, options = {}) {
        const defaults = {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        };
        const config = { ...defaults, ...options };

        try {
            const res = await fetch(`${API_BASE}/${url}`, config);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    app.showAuth();
                }
                throw new Error(data.error || 'Terjadi kesalahan');
            }
            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Tidak dapat terhubung ke server');
            }
            throw err;
        }
    },

    // Auth
    async login(email, password) {
        return this.request('auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async register(name, email, password) {
        return this.request('auth.php?action=register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    },

    async googleLogin(credential) {
        return this.request('auth.php?action=google', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
    },

    async getMe() {
        return this.request('auth.php?action=me');
    },

    async logout() {
        return this.request('auth.php?action=logout');
    },

    // Dashboard
    async getDashboard(month) {
        const params = month ? `?month=${month}` : '';
        return this.request(`dashboard.php${params}`);
    },

    // Transactions
    async getTransactions(filters = {}) {
        const params = new URLSearchParams();
        if (filters.type) params.set('type', filters.type);
        if (filters.category_id) params.set('category_id', filters.category_id);
        if (filters.month) params.set('month', filters.month);
        if (filters.search) params.set('search', filters.search);
        if (filters.limit) params.set('limit', filters.limit);
        if (filters.offset) params.set('offset', filters.offset);
        const qs = params.toString();
        return this.request(`transactions.php${qs ? '?' + qs : ''}`);
    },

    async createTransaction(data) {
        return this.request('transactions.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateTransaction(id, data) {
        return this.request(`transactions.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteTransaction(id) {
        return this.request(`transactions.php?id=${id}`, {
            method: 'DELETE'
        });
    },

    // Categories
    async getCategories(type) {
        const params = type ? `?type=${type}` : '';
        return this.request(`categories.php${params}`);
    },

    async createCategory(data) {
        return this.request('categories.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateCategory(id, data) {
        return this.request(`categories.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteCategory(id) {
        return this.request(`categories.php?id=${id}`, {
            method: 'DELETE'
        });
    },

    // Reports
    async getReports(year) {
        const params = year ? `?year=${year}` : '';
        return this.request(`reports.php${params}`);
    }
};
