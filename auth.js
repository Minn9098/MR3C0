// ========== AUTHENTICATION SYSTEM ==========
const auth = {
    // Constants
    USERS_KEY: 'mr3c0_users',
    SESSION_KEY: 'mr3c0_session',
    LOCKOUT_KEY: 'mr3c0_lockout',
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    MAX_LOGIN_ATTEMPTS: 5,

    // Initialize users array
    init() {
        if (!localStorage.getItem(this.USERS_KEY)) {
            localStorage.setItem(this.USERS_KEY, JSON.stringify([]));
        }
    },

    // Generate unique ID
    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Generate salt for password
    generateSalt() {
        return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
    },

    // Simple hash function (SHA-256 simulation)
    async hashPassword(password, salt) {
        const combined = password + salt;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    },

    // Validate username format
    validateUsername(username) {
        const regex = /^[a-zA-Z0-9_-]{3,20}$/;
        return regex.test(username);
    },

    // Validate email format
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validate password strength
    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
        return requirements;
    },

    // Check if username exists
    usernameExists(username) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY));
        return users.some(u => u.username.toLowerCase() === username.toLowerCase());
    },

    // Check if email exists
    emailExists(email) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY));
        return users.some(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // Toggle between login and signup forms
    toggleForm() {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        loginForm.classList.toggle('active');
        signupForm.classList.toggle('active');
        this.clearErrors();
    },

    // Real-time validation for signup
    validateRealtime(type, value) {
        const validationEl = document.getElementById(type + '-validation');
        let valid = false;
        let message = '';

        switch (type) {
            case 'username':
                if (!this.validateUsername(value)) {
                    message = 'Username must be 3-20 characters (letters, numbers, - and _)';
                } else if (this.usernameExists(value)) {
                    message = 'Username already taken';
                } else {
                    message = '✓ Username available';
                    valid = true;
                }
                break;
            case 'email':
                if (!this.validateEmail(value)) {
                    message = 'Invalid email format';
                } else if (this.emailExists(value)) {
                    message = 'Email already registered';
                } else {
                    message = '✓ Email valid';
                    valid = true;
                }
                break;
            case 'password':
                const strength = this.validatePasswordStrength(value);
                const strengthBar = document.getElementById('strength-bar');
                const strengthText = document.getElementById('strength-text');
                const passedRequirements = Object.values(strength).filter(v => v).length;
                const percentStrength = (passedRequirements / 5) * 100;

                if (strengthBar) strengthBar.style.width = percentStrength + '%';
                if (strengthText) {
                    if (percentStrength === 0) {
                        strengthText.textContent = '';
                    } else if (percentStrength < 40) {
                        strengthText.textContent = '🔴 Weak password';
                    } else if (percentStrength < 80) {
                        strengthText.textContent = '🟡 Moderate password';
                    } else {
                        strengthText.textContent = '🟢 Strong password';
                    }
                }

                if (!strength.length) message = 'Minimum 8 characters required';
                else if (!strength.uppercase) message = 'Must contain uppercase letter';
                else if (!strength.lowercase) message = 'Must contain lowercase letter';
                else if (!strength.number) message = 'Must contain a number';
                else if (!strength.special) message = 'Must contain special character (!@#$%^&*)';
                else {
                    message = '✓ Password meets all requirements';
                    valid = true;
                }
                break;
            case 'confirm':
                const password = document.getElementById('signup-password').value;
                if (value !== password) {
                    message = 'Passwords do not match';
                } else if (value) {
                    message = '✓ Passwords match';
                    valid = true;
                }
                break;
        }

        if (validationEl) {
            validationEl.textContent = message;
            if (valid) {
                validationEl.classList.add('valid');
            } else {
                validationEl.classList.remove('valid');
            }
        }
    },

    // Signup function
    async signup() {
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const errorEl = document.getElementById('signup-error');

        // Validation
        if (!username || !email || !password || !confirm) {
            this.showError('All fields are required', errorEl);
            return;
        }

        if (!this.validateUsername(username)) {
            this.showError('Invalid username format', errorEl);
            return;
        }

        if (this.usernameExists(username)) {
            this.showError('Username already taken', errorEl);
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Invalid email address', errorEl);
            return;
        }

        if (this.emailExists(email)) {
            this.showError('Email already registered', errorEl);
            return;
        }

        const strength = this.validatePasswordStrength(password);
        if (!Object.values(strength).every(v => v)) {
            this.showError('Password does not meet requirements', errorEl);
            return;
        }

        if (password !== confirm) {
            this.showError('Passwords do not match', errorEl);
            return;
        }

        // Create user
        const salt = this.generateSalt();
        const passwordHash = await this.hashPassword(password, salt);
        const user = {
            id: this.generateId(),
            username: username,
            email: email,
            passwordHash: passwordHash,
            salt: salt,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            loginAttempts: 0,
            locked: false
        };

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY));
        users.push(user);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        // Auto-login
        this.createSession(user);
        this.showMarketplace();
    },

    // Check if account is locked
    isAccountLocked(username) {
        const lockout = JSON.parse(localStorage.getItem(this.LOCKOUT_KEY) || '{}');
        if (lockout[username] && lockout[username].lockedUntil > Date.now()) {
            return true;
        }
        return false;
    },

    // Lock account
    lockAccount(username) {
        const lockout = JSON.parse(localStorage.getItem(this.LOCKOUT_KEY) || '{}');
        lockout[username] = {
            lockedUntil: Date.now() + this.LOCKOUT_DURATION
        };
        localStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(lockout));
    },

    // Login function
    async login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (!username || !password) {
            this.showError('Username and password required', errorEl);
            return;
        }

        // Check if account is locked
        if (this.isAccountLocked(username)) {
            this.showError('Account locked. Try again in 15 minutes', errorEl);
            return;
        }

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY));
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!user) {
            this.showError('Invalid username or password', errorEl);
            return;
        }

        // Check password
        const passwordHash = await this.hashPassword(password, user.salt);
        if (passwordHash !== user.passwordHash) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
                this.lockAccount(username);
                this.showError('Too many failed attempts. Account locked for 15 minutes', errorEl);
            } else {
                this.showError(`Invalid username or password (${this.MAX_LOGIN_ATTEMPTS - user.loginAttempts} attempts left)`, errorEl);
            }
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            return;
        }

        // Reset login attempts
        user.loginAttempts = 0;
        user.last_login = new Date().toISOString();
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        // Create session and show marketplace
        this.createSession(user);
        this.showMarketplace();
    },

    // Create session token
    createSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            email: user.email,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.SESSION_DURATION,
            token: this.generateId()
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },

    // Check if user is logged in
    isLoggedIn() {
        const session = sessionStorage.getItem(this.SESSION_KEY);
        if (!session) return false;
        const sessionData = JSON.parse(session);
        return sessionData.expiresAt > Date.now();
    },

    // Get current session
    getSession() {
        if (!this.isLoggedIn()) return null;
        return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
    },

    // Show marketplace
    showMarketplace() {
        const session = this.getSession();
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('marketplace-container').style.display = 'block';
        document.getElementById('user-welcome').textContent = session.username;
        this.clearForm();
    },

    // Show auth
    showAuth() {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('marketplace-container').style.display = 'none';
        this.clearForm();
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem(this.SESSION_KEY);
            this.showAuth();
        }
    },

    // Show error message
    showError(message, element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    },

    // Clear errors
    clearErrors() {
        document.getElementById('login-error').classList.remove('show');
        document.getElementById('signup-error').classList.remove('show');
    },

    // Clear form
    clearForm() {
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm').value = '';
        document.querySelectorAll('.validation-text').forEach(el => {
            el.textContent = '';
            el.classList.remove('valid');
        });
        document.getElementById('strength-bar').style.width = '0%';
        document.getElementById('strength-text').textContent = '';
    }
};

// Initialize
auth.init();

// Check if already logged in
if (auth.isLoggedIn()) {
    auth.showMarketplace();
}

// Real-time validation listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signup-username')?.addEventListener('input', (e) => {
        auth.validateRealtime('username', e.target.value);
    });
    document.getElementById('signup-email')?.addEventListener('input', (e) => {
        auth.validateRealtime('email', e.target.value);
    });
    document.getElementById('signup-password')?.addEventListener('input', (e) => {
        auth.validateRealtime('password', e.target.value);
    });
    document.getElementById('signup-confirm')?.addEventListener('input', (e) => {
        auth.validateRealtime('confirm', e.target.value);
    });
});