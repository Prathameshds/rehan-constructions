// Authentication Management
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
        return true;
    } else {
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
}

// Handle login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const mobile = document.getElementById('mobile').value.trim();

            if (username && mobile && mobile.length === 10) {
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
                                alert('Invalid mobile number for this username');
                            }
                        } else {
                            // Create new user
                            const newUserRef = db.ref('users').push();
                            const userId = newUserRef.key;
                            newUserRef.set({
                                username: username,
                                mobile: mobile,
                                createdAt: new Date().toISOString()
                            }).then(() => {
                                currentUser = { username, mobile, userId };
                                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                                window.location.href = 'dashboard.html';
                            }).catch(error => {
                                console.error('Error creating user:', error);
                                alert('Error creating account. Please try again.');
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error checking user:', error);
                        alert('Error logging in. Please try again.');
                    });
            } else {
                alert('Please enter valid username and 10-digit mobile number');
            }
        });
    }

    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            }
        });
    }

    // Check authentication
    checkAuth();
});