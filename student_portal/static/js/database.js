class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('student_office_db')) {
            const initialData = {
                users: [
                    {
                        id: 1,
                        email: 'student@nstu.ru',
                        password: 'password123',
                        name: 'Иван Иванов',
                        role: 'student',
                        institute: 'Институт автоматики и вычислительной техники',
                        group: '22БАП1',
                        studentId: '1234567'
                    },
                    {
                        id: 2,
                        email: 'admin@nstu.ru',
                        password: 'admin123',
                        name: 'Администратор Системы',
                        role: 'admin'
                    }
                ],
                requests: [],
                institutes: [
                    { id: 1, name: 'Институт автоматики и вычислительной техники' },
                    { id: 2, name: 'Институт радиэлектроники и информационных технологий' },
                    { id: 3, name: 'Институт экономики и менеджмента' },
                    { id: 4, name: 'Институт машиностроения' },
                    { id: 5, name: 'Институт физико-химических технологий' }
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

    getUserStatistics(userId) {
        const requests = this.getRequestsByUserId(userId);
        return {
            total: requests.length,
            pending: requests.filter(r => r.status === 'pending').length,
            completed: requests.filter(r => r.status === 'completed').length
        };
    }
}

window.db = new Database();