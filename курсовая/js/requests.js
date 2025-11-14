class RequestsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('loginModal');
            if (e.target === modal) {
                authManager.closeLoginModal();
            }
        });
    }

    async createRequest(requestData) {
        if (!authManager.isAuthenticated()) {
            alert('Пожалуйста, войдите в систему для подачи заявки');
            authManager.showLoginModal();
            return null;
        }

        const requestWithUser = {
            ...requestData,
            userId: authManager.getCurrentUser().id,
            userEmail: authManager.getCurrentUser().email
        };

        try {
            const newRequest = db.createRequest(requestWithUser);
            this.showNotification('Заявка успешно подана!', 'success');
            
            if (typeof updateUserStats === 'function') updateUserStats();
            if (typeof loadUserRequests === 'function') loadUserRequests();
            
            return newRequest;
        } catch (error) {
            this.showNotification('Ошибка при подаче заявки', 'error');
            return null;
        }
    }

    getUserRequests() {
        if (!authManager.isAuthenticated()) return [];
        return db.getRequestsByUserId(authManager.getCurrentUser().id);
    }

    getAllRequests() {
        if (!authManager.isAdmin()) return [];
        return db.getAllRequests();
    }

    updateRequestStatus(requestId, status) {
        return db.updateRequestStatus(requestId, status);
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'На рассмотрении',
            'approved': 'Одобрено', 
            'rejected': 'Отклонено',
            'completed': 'Завершено'
        };
        return statusMap[status] || status;
    }

    getStatusClass(status) {
        const classMap = {
            'pending': 'status-pending',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'completed': 'status-completed'
        };
        return classMap[status] || 'status-pending';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 5px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 5000);
    }

    renderRequestsTable(requests, isAdmin = false) {
        if (!requests.length) {
            return '<p class="no-requests">Заявок пока нет</p>';
        }

        return `
            <table class="requests-table">
                <thead>
                    <tr>
                        <th>Тип заявки</th>
                        <th>Дата подачи</th>
                        <th>Статус</th>
                        ${isAdmin ? '<th>Студент</th><th>Действия</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(request => `
                        <tr>
                            <td>${request.type}</td>
                            <td>${new Date(request.createdAt).toLocaleDateString('ru-RU')}</td>
                            <td><span class="status-badge ${this.getStatusClass(request.status)}">${this.getStatusText(request.status)}</span></td>
                            ${isAdmin ? `
                                <td>${request.userEmail}</td>
                                <td class="actions">
                                    ${request.status === 'pending' ? `
                                        <button class="btn small success" onclick="updateRequestStatus('${request.id}', 'approved')">✓</button>
                                        <button class="btn small danger" onclick="updateRequestStatus('${request.id}', 'rejected')">✗</button>
                                    ` : ''}
                                    ${request.status === 'approved' ? `
                                        <button class="btn small primary" onclick="updateRequestStatus('${request.id}', 'completed')">Завершить</button>
                                    ` : ''}
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

window.requestsManager = new RequestsManager();

window.navigateTo = (page) => {
    if (!authManager.isAuthenticated()) {
        authManager.showLoginModal();
        return;
    }
    
    const pages = {
        'study-period': 'index1.html',
        'academic-leave': 'index2.html', 
        'status-certificate': 'index3.html'
    };
    
    if (pages[page]) {
        window.location.href = pages[page];
    }
};

window.updateRequestStatus = (requestId, status) => {
    if (!authManager.isAdmin()) return;
    
    const request = requestsManager.updateRequestStatus(requestId, status);
    if (request) {
        requestsManager.showNotification(`Статус заявки изменен на: ${requestsManager.getStatusText(status)}`, 'success');
        loadUserRequests();
    }
};