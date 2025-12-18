class AuthManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.updateUI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('loginModal');
            if (e.target === modal) {
                this.closeLoginModal();
            }
        });
    }

    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        const user = db.getUserByEmail(email);
        
        // Проверка на блокировку аккаунта
        if (user && user.isActive === false) {
            this.showError(errorDiv, 'Аккаунт заблокирован. Обратитесь к администратору.');
            return;
        }
        
        if (user && user.password === password) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUI();
            this.closeLoginModal();
            
            if (typeof updateUserStats === 'function') updateUserStats();
            if (typeof loadUserRequests === 'function') loadUserRequests();
            
        } else {
            this.showError(errorDiv, 'Неверный email или пароль');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        location.reload();
    }

    updateUI() {
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const userNameSpan = document.getElementById('userName');
        const userStats = document.getElementById('userStats');
        const requestsList = document.getElementById('requestsList');
        const adminSection = document.getElementById('adminSection');

        if (this.currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = this.currentUser.name;
            if (userStats) userStats.style.display = 'flex';
            if (requestsList) requestsList.style.display = 'block';
            
            // Показываем админ-панель только для администраторов
            if (adminSection) {
                adminSection.style.display = this.isAdmin() ? 'flex' : 'none';
            }
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (userStats) userStats.style.display = 'none';
            if (requestsList) requestsList.style.display = 'none';
            if (adminSection) adminSection.style.display = 'none';
        }
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            setTimeout(() => { element.style.display = 'none'; }, 5000);
        }
    }

    isAuthenticated() { 
        return this.currentUser !== null; 
    }
    
    isAdmin() { 
        return this.currentUser && this.currentUser.role === 'admin'; 
    }
    
    getCurrentUser() { 
        return this.currentUser; 
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
    }

    closeLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
    }
}

window.authManager = new AuthManager();
window.showLoginModal = () => authManager.showLoginModal();
window.closeLoginModal = () => authManager.closeLoginModal();
window.logout = () => authManager.logout();
