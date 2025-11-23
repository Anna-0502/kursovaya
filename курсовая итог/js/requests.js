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

    updateRequestWithAdminMessage(requestId, message) {
        return db.updateRequestWithAdminMessage(requestId, message);
    }

    returnRequestToPending(requestId) {
        return db.returnRequestToPending(requestId);
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'На рассмотрении',
            'approved': 'Одобрено', 
            'rejected': 'Отклонено',
            'completed': 'Завершено',
            'needs_data': 'Требуются данные'
        };
        return statusMap[status] || status;
    }

    getStatusClass(status) {
        const classMap = {
            'pending': 'status-pending',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'completed': 'status-completed',
            'needs_data': 'status-needs_data'
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

        if (!isAdmin) {
            // Отображение для студентов с сообщениями
            return `
                <table class="requests-table">
                    <thead>
                        <tr>
                            <th>Тип заявки</th>
                            <th>Дата подачи</th>
                            <th>Статус</th>
                            <th>Сообщение от администратора</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(request => `
                            <tr>
                                <td>${request.type}</td>
                                <td>${new Date(request.createdAt).toLocaleDateString('ru-RU')}</td>
                                <td>
                                    <span class="status-badge ${this.getStatusClass(request.status)}">
                                        ${this.getStatusText(request.status)}
                                        ${request.status === 'needs_data' ? ' ⚠️' : ''}
                                    </span>
                                </td>
                                <td>
                                    ${request.adminMessage ? `
                                        <div class="admin-message">
                                            <strong>Требуются дополнительные данные:</strong>
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

        // Отображение для администратора
        return `
            <table class="requests-table">
                <thead>
                    <tr>
                        <th>Тип заявки</th>
                        <th>Дата подачи</th>
                        <th>Статус</th>
                        <th>Студент</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(request => `
                        <tr>
                            <td>${request.type}</td>
                            <td>${new Date(request.createdAt).toLocaleDateString('ru-RU')}</td>
                            <td>
                                <span class="status-badge ${this.getStatusClass(request.status)}">
                                    ${this.getStatusText(request.status)}
                                    ${request.status === 'needs_data' ? ' ⚠️' : ''}
                                    ${request.adminMessage ? ' 💬' : ''}
                                </span>
                            </td>
                            <td>${request.userEmail}</td>
                            <td class="actions">
                                <button class="btn small view" onclick="showAdminRequestDetails('${request.id}')" title="Просмотр деталей">🔍</button>
                                ${request.status === 'pending' ? `
                                    <button class="btn small warning" onclick="requestMoreData('${request.id}')" title="Запросить данные">📋</button>
                                    <button class="btn small success" onclick="updateRequestStatus('${request.id}', 'approved')">✓</button>
                                    <button class="btn small danger" onclick="updateRequestStatus('${request.id}', 'rejected')">✗</button>
                                ` : ''}
                                ${request.status === 'needs_data' ? `
                                    <button class="btn small warning" onclick="requestMoreData('${request.id}')" title="Изменить запрос данных">✏️</button>
                                    <div style="font-size: 0.7rem; color: #666; margin-top: 2px;">
                                        Ожидаем данные
                                    </div>
                                ` : ''}
                                ${request.status === 'approved' ? `
                                    <button class="btn small primary" onclick="updateRequestStatus('${request.id}', 'completed')">Завершить</button>
                                ` : ''}
                            </td>
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

window.showRequestDataModal = (requestId) => {
    alert('Функция запроса данных доступна в панели администратора');
};
// Добавьте в конец requests.js
window.requestMoreData = (requestId) => {
    if (!authManager.isAdmin()) return;
    
    const message = prompt('Введите сообщение для студента с запросом дополнительных данных:');
    if (message && message.trim()) {
        const request = requestsManager.updateRequestWithAdminMessage(requestId, message.trim());
        if (request) {
            requestsManager.showNotification('Запрос данных отправлен студенту', 'success');
            loadUserRequests();
        }
    }
};

window.showAdminRequestDetails = (requestId) => {
    const requests = requestsManager.getAllRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (request) {
        let details = `Детали заявки #${request.id}\n\n`;
        details += `Тип: ${request.type}\n`;
        details += `Студент: ${request.userEmail}\n`;
        details += `Дата подачи: ${new Date(request.createdAt).toLocaleString('ru-RU')}\n`;
        details += `Статус: ${requestsManager.getStatusText(request.status)}\n\n`;
        
        if (request.personalData) {
            details += 'Личные данные:\n';
            Object.entries(request.personalData).forEach(([key, value]) => {
                if (value) details += `${formatFieldName(key)}: ${value}\n`;
            });
        }
        
        if (request.formData) {
            details += '\nДанные формы:\n';
            Object.entries(request.formData).forEach(([key, value]) => {
                if (value && !request.personalData?.[key]) {
                    details += `${formatFieldName(key)}: ${value}\n`;
                }
            });
        }
        
        if (request.adminMessage) {
            details += `\nСообщение администратора:\n${request.adminMessage}\n`;
        }
        
        alert(details);
    }
};

function formatFieldName(fieldName) {
    const fieldMap = {
        'lastname': 'Фамилия',
        'firstname': 'Имя', 
        'middlename': 'Отчество',
        'institute': 'Институт',
        'group': 'Группа',
        'student_id': 'Студенческий билет',
        'purpose': 'Цель',
        'leave_type': 'Тип отпуска',
        'start_date': 'Дата начала',
        'duration': 'Продолжительность',
        'reason': 'Причина',
        'certificate_type': 'Тип справки',
        'language': 'Язык',
        'copies': 'Количество экземпляров',
        'delivery': 'Способ получения',
        'phone': 'Телефон',
        'email': 'Email'
    };
    return fieldMap[fieldName] || fieldName;
}
