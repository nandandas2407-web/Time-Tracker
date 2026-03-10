/**
 * ============================================
 * AUTHENTICATION MODULE
 * Handles user login, registration, and session management
 * ============================================
 */

// Constants
const AUTH_STORAGE_KEY = 'jee_tracker_auth';
const SESSION_KEY = 'jee_tracker_session';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const helpText = document.getElementById('helpText');

/**
 * Initialize authentication system
 */
function init() {
    // Check if user is already logged in
    checkSession();
    
    // Setup form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Apply dark mode if previously set
    const darkMode = localStorage.getItem('jee_tracker_darkmode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Check if user has an active session
 */
function checkSession() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            // Session valid for 30 days
            if (sessionData.expiry > now) {
                // Auto-login: redirect to dashboard
                window.location.href = 'dashboard.html';
                return;
            } else {
                // Session expired
                localStorage.removeItem(SESSION_KEY);
            }
        } catch (e) {
            console.error('Invalid session data:', e);
            localStorage.removeItem(SESSION_KEY);
        }
    }
}

/**
 * Handle login form submission
 */
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    // Check if user exists
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!storedAuth) {
        // First time login - create new account
        createAccount(username, password);
    } else {
        // Existing user - validate credentials
        validateCredentials(username, password, storedAuth);
    }
}

/**
 * Create new user account
 */
function createAccount(username, password) {
    // Simple hash function (in production, use proper encryption)
    const hashedPassword = simpleHash(password);
    
    const authData = {
        username: username,
        password: hashedPassword,
        createdAt: Date.now()
    };
    
    // Store credentials
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    
    // Create session
    createSession(username);
    
    // Show success and redirect
    showSuccess('Account created successfully! Redirecting...');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

/**
 * Validate user credentials
 */
function validateCredentials(username, password, storedAuth) {
    try {
        const authData = JSON.parse(storedAuth);
        const hashedPassword = simpleHash(password);
        
        if (authData.username === username && authData.password === hashedPassword) {
            // Login successful
            createSession(username);
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            // Invalid credentials
            showError('Invalid username or password');
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (e) {
        console.error('Error validating credentials:', e);
        showError('Authentication error. Please try again.');
    }
}

/**
 * Create user session
 */
function createSession(username) {
    const sessionData = {
        username: username,
        loginTime: Date.now(),
        expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Simple hash function (for demonstration - NOT cryptographically secure)
 * In production, use bcrypt or similar on a backend
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

/**
 * Show error message
 */
function showError(message) {
    helpText.textContent = message;
    helpText.style.color = '#ef4444';
    helpText.style.fontWeight = '500';
    
    // Shake animation
    loginForm.style.animation = 'shake 0.5s';
    setTimeout(() => {
        loginForm.style.animation = '';
    }, 500);
}

/**
 * Show success message
 */
function showSuccess(message) {
    helpText.textContent = message;
    helpText.style.color = '#10b981';
    helpText.style.fontWeight = '500';
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
