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
$(document).ready(function () {
    const $loginForm = $('#login-form');

    if ($loginForm.length) {
        $loginForm.on('submit', function (e) {
            e.preventDefault();
            const username = $('#username').val().trim();
            const mobile = $('#mobile').val().trim();
            const $btn = $loginForm.find('button[type=submit]');

            if (!username || !mobile || mobile.length !== 10) {
                showAlert('Please enter a valid username and 10-digit mobile number.', 'error');
                return;
            }

            // Show loading
            const origText = $btn.html();
            $btn.html('<i class="fas fa-spinner fa-spin"></i> Logging in...').prop('disabled', true);

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
                            $btn.html(origText).prop('disabled', false);
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
                            $btn.html(origText).prop('disabled', false);
                        });
                    }
                })
                .catch(err => {
                    console.error('Login error:', err);
                    showAlert('Error logging in. Please try again.', 'error');
                    $btn.html(origText).prop('disabled', false);
                });
        });
    }

    // Logout
    const $logoutBtn = $('#logout-btn');
    if ($logoutBtn.length) {
        $logoutBtn.on('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            }
        });
    }

    // Auth check
    checkAuth();
});

// Simple alert helper with jQuery
function showAlert(message, type = 'info') {
    // Remove existing
    $('#login-alert').remove();

    const bgColor = type === 'error' ? '#fee2e2' : '#d1fae5';
    const textColor = type === 'error' ? '#991b1b' : '#065f46';
    const borderColor = type === 'error' ? '#fca5a5' : '#6ee7b7';
    const iconClass = type === 'error' ? 'exclamation-circle' : 'check-circle';

    const $alert = $('<div>')
        .attr('id', 'login-alert')
        .css({
            background: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        })
        .html(`<i class="fas fa-${iconClass}"></i> ${message}`);

    const $form = $('#login-form');
    if ($form.length) {
        $form.before($alert);
    }

    setTimeout(() => $alert.remove(), 5000);
}