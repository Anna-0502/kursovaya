class StudentOfficeApp {
    constructor() {
        this.init();
    }

    init() {
        this.updateUserStats();
        this.loadUserRequests();
    }

    updateUserStats() {
        if (!authManager.isAuthenticated()) return;

        const stats = db.getUserStatistics(authManager.getCurrentUser().id);
        
        const totalEl = document.getElementById('totalRequests');
        const pendingEl = document.getElementById('pendingRequests');
        const completedEl = document.getElementById('completedRequests');
        
        if (totalEl) totalEl.textContent = stats.total;
        if (pendingEl) pendingEl.textContent = stats.pending;
        if (completedEl) completedEl.textContent = stats.completed;
    }

    loadUserRequests() {
        if (!authManager.isAuthenticated()) return;

        const requestsTable = document.getElementById('requestsTable');
        if (!requestsTable) return;

        let requests;
        if (authManager.isAdmin()) {
            requests = requestsManager.getAllRequests();
            requestsTable.innerHTML = requestsManager.renderRequestsTable(requests, true);
        } else {
            requests = requestsManager.getUserRequests();
            requestsTable.innerHTML = this.renderUserRequestsTable(requests);
        }
    }

    // Новый метод для отображения заявок студента с сообщениями
    renderUserRequestsTable(requests) {
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
                        <th>Сообщение</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(request => `
                        <tr>
                            <td>${request.type}</td>
                            <td>${new Date(request.createdAt).toLocaleDateString('ru-RU')}</td>
                            <td>
                                <span class="status-badge ${requestsManager.getStatusClass(request.status)}">
                                    ${requestsManager.getStatusText(request.status)}
                                    ${request.status === 'needs_data' ? ' ⚠️' : ''}
                                </span>
                            </td>
                            <td>
                                ${request.adminMessage ? `
                                    <div class="admin-message">
                                        <strong>Сообщение от администратора:</strong>
                                        <div class="message-content">${request.adminMessage}</div>
                                        <small>Запрошено: ${new Date(request.dataRequestedAt).toLocaleString('ru-RU')}</small>
                                        <div style="margin-top: 10px; padding: 8px; background: #e7f3ff; border-radius: 4px;">
                                            <small>📝 Пожалуйста, предоставьте запрошенные данные для продолжения рассмотрения заявки</small>
                                        </div>
                                    </div>
                                ` : '<span class="no-message">—</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

window.updateUserStats = () => {
    const app = window.app;
    if (app && app.updateUserStats) app.updateUserStats();
};

window.loadUserRequests = () => {
    const app = window.app;
    if (app && app.loadUserRequests) app.loadUserRequests();
};

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudentOfficeApp();
});

const additionalStyles = `
.stats-container {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    justify-content: center;
}

.stat-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    min-width: 120px;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
    margin: 10px 0 0 0;
}

.requests-container {
    margin-top: 40px;
}

.requests-table table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.requests-table th,
.requests-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
}

.requests-table th {
    background: #667eea;
    color: white;
    font-weight: 600;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-approved { background: #d1edff; color: #004085; }
.status-rejected { background: #f8d7da; color: #721c24; }
.status-completed { background: #d4edda; color: #155724; }
.status-needs_data { 
    background: #fff3cd; 
    color: #856404; 
    border: 1px solid #ffeaa7;
}

.actions {
    display: flex;
    gap: 5px;
}

.btn.small {
    padding: 5px 10px;
    font-size: 0.8rem;
}

.btn.small.view { background: #17a2b8; border-color: #17a2b8; color: white; }
.btn.small.warning { background: #ffc107; border-color: #ffc107; color: #212529; }
.btn.small.success { background: #28a745; border-color: #28a745; color: white; }
.btn.small.danger { background: #dc3545; border-color: #dc3545; color: white; }
.btn.small.primary { background: #007bff; border-color: #007bff; color: white; }

.no-requests {
    text-align: center;
    color: #666;
    padding: 40px;
    background: white;
    border-radius: 10px;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 10% auto;
    padding: 30px;
    border-radius: 10px;
    width: 90%;
    max-width: 400px;
    position: relative;
}

.close {
    position: absolute;
    right: 15px;
    top: 15px;
    font-size: 24px;
    cursor: pointer;
}

.demo-accounts {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 5px;
    font-size: 0.9rem;
}

.demo-accounts h4 {
    margin: 0 0 10px 0;
    color: #333;
}

.error-message {
    color: #dc3545;
    background: #f8d7da;
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
}

.auth-section, .user-section {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-section span {
    font-weight: 600;
    color: #333;
}

/* Стили для сообщений администратора */
.admin-message {
    background: #f8f9fa;
    border-left: 4px solid #ffc107;
    padding: 10px 15px;
    border-radius: 4px;
    margin: 5px 0;
}

.admin-message strong {
    color: #856404;
    display: block;
    margin-bottom: 5px;
}

.message-content {
    color: #333;
    line-height: 1.4;
    margin-bottom: 8px;
    white-space: pre-wrap;
}

.admin-message small {
    color: #6c757d;
    font-size: 0.8rem;
}

.no-message {
    color: #6c757d;
    font-style: italic;
}

@media (max-width: 768px) {
    .stats-container {
        flex-direction: column;
        align-items: center;
    }
    
    .stat-card {
        width: 100%;
        max-width: 200px;
    }
    
    .requests-table table {
        font-size: 0.9rem;
    }
    
    .requests-table th,
    .requests-table td {
        padding: 8px 10px;
    }
    
    .admin-message {
        padding: 8px 10px;
    }
    
    .message-content {
        font-size: 0.9rem;
    }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
