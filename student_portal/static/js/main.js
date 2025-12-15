class StudentOfficeApp {
    constructor() {
        this.init();
    }

    async init() {
        await this.updateUserStats();
        await this.loadUserRequests();
    }

    async updateUserStats() {
        if (!authManager.isAuthenticated()) return;

        try {
            const data = await api.getUserStats(authManager.getCurrentUser().id);
            const stats = data.stats;

            const totalEl = document.getElementById('totalRequests');
            const pendingEl = document.getElementById('pendingRequests');
            const completedEl = document.getElementById('completedRequests');

            if (totalEl) totalEl.textContent = stats.total;
            if (pendingEl) pendingEl.textContent = stats.pending;
            if (completedEl) completedEl.textContent = stats.completed;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async loadUserRequests() {
        if (!authManager.isAuthenticated()) return;

        const requestsTable = document.getElementById('requestsTable');
        if (!requestsTable) return;

        try {
            let requests;
            if (authManager.isAdmin()) {
                requests = await requestsManager.getAllRequests();
                requestsTable.innerHTML = requestsManager.renderRequestsTable(requests, true);
            } else {
                requests = await requestsManager.getUserRequests();
                requestsTable.innerHTML = requestsManager.renderRequestsTable(requests);
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    }
}

// Глобальные функции
window.updateUserStats = async () => {
    const app = window.app;
    if (app && app.updateUserStats) await app.updateUserStats();
};

window.loadUserRequests = async () => {
    const app = window.app;
    if (app && app.loadUserRequests) await app.loadUserRequests();
};

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudentOfficeApp();
});