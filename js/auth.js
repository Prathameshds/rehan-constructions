// ===== AUTHENTICATION MANAGEMENT =====
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        const path = window.location.pathname;
        if (path.includes('login.html') || path.endsWith('/') || path.endsWith('index.html')) {
            // Don't redirect from home page
            if (path.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        }
        return true;
    } else {
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
}

// Handle Login Form
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const mobile = document.getElementById('mobile').value.trim();
            const btn = loginForm.querySelector('button[type=submit]');

            if (!username || !mobile || mobile.length !== 10) {
                showAlert('Please enter a valid username and 10-digit mobile number.', 'error');
                return;
            }

            // Show loading
            const origText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            btn.disabled = true;

            db.ref('users').orderByChild('username').equalTo(username).once('value')
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const userData = Object.values(snapshot.val())[0];
                        if (userData.mobile === mobile) {
                            currentUser = {
                                username,
                                mobile,
                                userId: Object.keys(snapshot.val())[0]
                            };
                            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                            window.location.href = 'dashboard.html';
                        } else {
                            showAlert('Invalid mobile number for this username.', 'error');
                            btn.innerHTML = origText;
                            btn.disabled = false;
                        }
                    } else {
                        // Create new user
                        const newUserRef = db.ref('users').push();
                        newUserRef.set({
                            username,
                            mobile,
                            createdAt: new Date().toISOString()
                        }).then(() => {
                            currentUser = { username, mobile, userId: newUserRef.key };
                            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                            window.location.href = 'dashboard.html';
                        }).catch(err => {
                            console.error('Error creating user:', err);
                            showAlert('Error creating account. Please try again.', 'error');
                            btn.innerHTML = origText;
                            btn.disabled = false;
                        });
                    }
                })
                .catch(err => {
                    console.error('Login error:', err);
                    showAlert('Error logging in. Please try again.', 'error');
                    btn.innerHTML = origText;
                    btn.disabled = false;
                });
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            }
        });
    }

    // Auth check
    checkAuth();
});

// Simple alert helper
function showAlert(message, type = 'info') {
    // Remove existing
    const existing = document.getElementById('login-alert');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'login-alert';
    el.style.cssText = `
    background: ${type === 'error' ? '#fee2e2' : '#d1fae5'};
    color: ${type === 'error' ? '#991b1b' : '#065f46'};
    border: 1px solid ${type === 'error' ? '#fca5a5' : '#6ee7b7'};
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
    el.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;

    const form = document.getElementById('login-form');
    if (form) form.insertAdjacentElement('beforebegin', el);

    setTimeout(() => el.remove(), 5000);
}