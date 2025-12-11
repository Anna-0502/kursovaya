class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('student_office_db')) {
            const initialData = {
                users: [
                    {
                        id: "1",
                        email: 'student@nstu.ru',
                        password: 'password123',
                        name: 'Иван Иванов',
                        role: 'student',
                        institute: 'ИРИТ',
                        group: '24-ПМ-2',
                        studentId: '1234567',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: "2",
                        email: 'admin@nstu.ru',
                        password: 'admin123',
                        name: 'Администратор Системы',
                        role: 'admin',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    }
                ],
                requests: [
                    // Пример заявки с статусом "требуются данные"
                    {
                        id: "1001",
                        type: "Справка о периоде обучения",
                        userId: "1",
                        userEmail: "student@nstu.ru",
                        status: "needs_data",
                        personalData: {
                            lastname: "Иванов",
                            firstname: "Иван",
                            institute: "ИРИТ",
                            group: "24-ПМ-2"
                        },
                        formData: {
                            purpose: "Для представления в организацию"
                        },
                        adminMessage: "Требуется предоставить копию паспорта и справку об обучении за последний семестр",
                        dataRequestedAt: new Date().toISOString(),
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ],
                institutes: [
                    { id: 1, name: 'ИРИТ' },
                    { id: 2, name: 'ИТС' },
                    { id: 3, name: 'ИФХТиМ' },
                    { id: 4, name: 'ИЯЭиТФ' },
                    { id: 5, name: 'ИНЭУ' },
                    { id: 6, name: 'ИПТМ' },
                    { id: 7, name: 'ИНЭЛ' }
                ]
            };
            this.saveData(initialData);
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem('student_office_db') || '{}');
    }

    saveData(data) {
        localStorage.setItem('student_office_db', JSON.stringify(data));
    }

    getUserByEmail(email) {
        const data = this.getData();
        return data.users.find(user => user.email === email);
    }

    // === УПРАВЛЕНИЕ ЗАЯВКАМИ ===
    createRequest(requestData) {
        const data = this.getData();
        const newRequest = {
            id: Date.now().toString(),
            ...requestData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.requests.push(newRequest);
        this.saveData(data);
        return newRequest;
    }

    getRequestsByUserId(userId) {
        const data = this.getData();
        return data.requests.filter(request => request.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getAllRequests() {
        const data = this.getData();
        return data.requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getRequestsByType(type) {
        const data = this.getData();
        return data.requests.filter(request => request.type === type);
    }

    getRequestsByStatus(status) {
        const data = this.getData();
        return data.requests.filter(request => request.status === status);
    }

    updateRequestStatus(requestId, status) {
        const data = this.getData();
        const request = data.requests.find(req => req.id === requestId);
        if (request) {
            request.status = status;
            request.updatedAt = new Date().toISOString();
            this.saveData(data);
            return request;
        }
        return null;
    }

    updateRequestWithAdminMessage(requestId, message) {
        const data = this.getData();
        const request = data.requests.find(req => req.id === requestId);
        if (request) {
            request.adminMessage = message;
            request.status = 'needs_data'; // Автоматически меняем статус на "требуются данные"
            request.dataRequestedAt = new Date().toISOString();
            request.updatedAt = new Date().toISOString();
            this.saveData(data);
            return request;
        }
        return null;
    }

    returnRequestToPending(requestId) {
        const data = this.getData();
        const request = data.requests.find(req => req.id === requestId);
        if (request && request.status === 'needs_data') {
            request.status = 'pending';
            request.adminMessage = null;
            request.dataRequestedAt = null;
            request.updatedAt = new Date().toISOString();
            this.saveData(data);
            return request;
        }
        return null;
    }

    getUserStatistics(userId) {
        const requests = this.getRequestsByUserId(userId);
        return {
            total: requests.length,
            pending: requests.filter(r => r.status === 'pending').length,
            completed: requests.filter(r => r.status === 'completed').length,
            needs_data: requests.filter(r => r.status === 'needs_data').length
        };
    }

    // === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===
    
    getAllUsers() {
        const data = this.getData();
        return data.users.filter(user => user.role !== 'admin');
    }

    addUser(userData) {
        const data = this.getData();
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            role: 'student',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        data.users.push(newUser);
        this.saveData(data);
        return newUser;
    }

    updateUser(userId, updates) {
        const data = this.getData();
        const userIndex = data.users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            data.users[userIndex] = {
                ...data.users[userIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.users[userIndex];
        }
        return null;
    }

    toggleUserStatus(userId) {
        const data = this.getData();
        const userIndex = data.users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            data.users[userIndex].isActive = !data.users[userIndex].isActive;
            data.users[userIndex].updatedAt = new Date().toISOString();
            this.saveData(data);
            return data.users[userIndex];
        }
        return null;
    }

    deleteUser(userId) {
        const data = this.getData();
        const userIndex = data.users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            const deletedUser = data.users.splice(userIndex, 1)[0];
            this.saveData(data);
            return deletedUser;
        }
        return null;
    }

    isEmailExists(email) {
        const data = this.getData();
        return data.users.some(user => user.email === email);
    }
}

window.db = new Database();
