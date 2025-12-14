class API {
    constructor() {
        this.baseURL = '/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка сервера');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
    }

    // Requests methods
    async createRequest(requestData) {
        return await this.request('/requests', {
            method: 'POST',
            body: requestData
        });
    }

    async getAllRequests() {
        return await this.request('/requests');
    }

    async getUserRequests(userId) {
        return await this.request(`/requests/user/${userId}`);
    }

    async updateRequestStatus(requestId, status) {
        return await this.request(`/requests/${requestId}/status`, {
            method: 'PUT',
            body: { status }
        });
    }

    async getUserStats(userId) {
        return await this.request(`/requests/stats/user/${userId}`);
    }
}

window.api = new API();