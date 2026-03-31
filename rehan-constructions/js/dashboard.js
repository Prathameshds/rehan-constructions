// Dashboard Management
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    // Display user name
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName && currentUser) {
        userDisplayName.textContent = currentUser.username;
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const pageId = this.dataset.page;
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${pageId}-page`).classList.add('active');

            // Update page title
            const pageTitle = this.querySelector('span').textContent;
            document.querySelector('.page-title').textContent = pageTitle;

            // Load page specific data
            switch(pageId) {
                case 'dashboard':
                    updateDashboard();
                    break;
                case 'pending-balance':
                    updatePendingBalance();
                    break;
                case 'reports':
                    loadReportsData();
                    break;
            }
        });
    });

    // Refresh data
    document.getElementById('refresh-data').addEventListener('click', function() {
        loadAllData();
    });

    // Sidebar toggle (mobile)
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar && sidebarOverlay && sidebarToggleBtn) {
        function openSidebar() {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
        function closeSidebar() {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
        sidebarToggleBtn.addEventListener('click', openSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
        navItems.forEach(item => {
            item.addEventListener('click', closeSidebar);
        });
    }

    // Load initial data
    loadAllData();
});

// Global variables
let projects = [];
let workers = [];
let materials = [];

// Load all data
function loadAllData() {
    if (!currentUser || !currentUser.userId) return;

    // Show loading state on tables
    const dealsBody = document.getElementById('deals-table-body');
    const workersBody = document.getElementById('workers-table-body');
    const materialsBody = document.getElementById('materials-table-body');
    if (dealsBody) Utils.showLoading(dealsBody, 'Loading deals...', 7);
    if (workersBody) Utils.showLoading(workersBody, 'Loading workers...', 6);
    if (materialsBody) Utils.showLoading(materialsBody, 'Loading materials...', 9);

    Promise.all([
        loadProjects(),
        loadWorkers(),
        loadMaterials()
    ]).then(() => {
        updateDashboard();
        // Refresh all tables with loaded data
        if (typeof loadDealsTable === 'function') loadDealsTable();
        if (typeof loadWorkersTable === 'function') loadWorkersTable();
        if (typeof loadMaterialsTable === 'function') loadMaterialsTable();
    }).catch(error => {
        console.error('Error loading data:', error);
        if (dealsBody) Utils.showError(dealsBody, 'Error loading data. Please refresh.', 7);
        if (workersBody) Utils.showError(workersBody, 'Error loading data. Please refresh.', 6);
        if (materialsBody) Utils.showError(materialsBody, 'Error loading data. Please refresh.', 9);
    });
}

// Load projects
function loadProjects() {
    return new Promise((resolve, reject) => {
        db.ref('deals').orderByChild('userId').equalTo(currentUser.userId).once('value')
            .then(snapshot => {
                projects = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        projects.push({ id: childSnapshot.key, ...childSnapshot.val() });
                    });
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading projects:', error);
                reject(error);
            });
    });
}

// Load workers
function loadWorkers() {
    return new Promise((resolve, reject) => {
        db.ref('workers').orderByChild('userId').equalTo(currentUser.userId).once('value')
            .then(snapshot => {
                workers = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        workers.push({ id: childSnapshot.key, ...childSnapshot.val() });
                    });
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading workers:', error);
                reject(error);
            });
    });
}

// Load materials
function loadMaterials() {
    return new Promise((resolve, reject) => {
        db.ref('materials').orderByChild('userId').equalTo(currentUser.userId).once('value')
            .then(snapshot => {
                materials = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        materials.push({ id: childSnapshot.key, ...childSnapshot.val() });
                    });
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading materials:', error);
                reject(error);
            });
    });
}

// Update dashboard stats
function updateDashboard() {
    const totalAdvance = projects.reduce((sum, deal) => sum + (deal.advance || 0), 0);
    const totalBalance = projects.reduce((sum, deal) => sum + (deal.balance || 0), 0);
    const totalWorkerExpenses = workers.reduce((sum, worker) => sum + (worker.paidAmount || 0) + (worker.remainingAmount || 0), 0);
    const totalMaterialExpenses = materials.reduce((sum, material) => sum + (material.totalAmount || 0), 0);
    const totalProfit = totalAdvance - totalWorkerExpenses - totalMaterialExpenses;

    document.getElementById('total-ongoing-deals').textContent = projects.length;
    document.getElementById('advance-collected').textContent = Utils.formatCurrency(totalAdvance);
    document.getElementById('remaining-balance').textContent = Utils.formatCurrency(totalBalance);
    document.getElementById('total-worker-expenses').textContent = Utils.formatCurrency(totalWorkerExpenses);
    document.getElementById('total-material-expenses').textContent = Utils.formatCurrency(totalMaterialExpenses);
    document.getElementById('total-profit').textContent = Utils.formatCurrency(totalProfit);

    updateRecentActivity();
}

// Update recent activity
function updateRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;

    activityList.innerHTML = '';
    const activities = [];

    // Add project activities
    projects.slice(-5).forEach(deal => {
        activities.push({
            type: 'project',
            title: 'New Project Added',
            description: `${deal.venue} - ${deal.customerName}`,
            timestamp: deal.createdAt || deal.updatedAt,
            icon: 'fa-handshake'
        });
    });

    // Add worker activities
    workers.slice(-5).forEach(worker => {
        activities.push({
            type: 'worker',
            title: 'Worker Payment Processed',
            description: `Payment of ${Utils.formatCurrency(worker.paidAmount)} to ${worker.workerName}`,
            timestamp: worker.createdAt || worker.updatedAt,
            icon: 'fa-user-check'
        });
    });

    // Add material activities
    materials.slice(-5).forEach(material => {
        activities.push({
            type: 'material',
            title: 'Materials Leased',
            description: `${material.materialType} for ${material.projectName}`,
            timestamp: material.createdAt || material.updatedAt,
            icon: 'fa-tools'
        });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Display activities
    if (activities.length === 0) {
        activityList.innerHTML = '<div class="activity-item"><p>No recent activity</p></div>';
    } else {
        activities.slice(0, 10).forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description} • ${Utils.formatTimestamp(activity.timestamp)}</p>
                </div>
            `;
            activityList.appendChild(item);
        });
    }
}

// Update pending balance page
function updatePendingBalance() {
    const totalDealBalance = projects.reduce((sum, deal) => sum + (deal.balance || 0), 0);
    const totalWorkerRemaining = workers.reduce((sum, worker) => sum + (worker.remainingAmount || 0), 0);
    const totalMaterialBalance = materials.reduce((sum, material) => sum + (material.balanceAmount || 0), 0);

    document.getElementById('pending-deal-balance').textContent = Utils.formatCurrency(totalDealBalance);
    document.getElementById('pending-worker-balance').textContent = Utils.formatCurrency(totalWorkerRemaining);
    document.getElementById('pending-material-balance').textContent = Utils.formatCurrency(totalMaterialBalance);

    // Update pending deals table
    const pendingDealsTable = document.getElementById('pending-deals-table-body');
    if (pendingDealsTable) {
        pendingDealsTable.innerHTML = '';
        const pendingDeals = projects.filter(deal => deal.balance > 0);
        
        if (pendingDeals.length === 0) {
            Utils.showEmpty(pendingDealsTable, 'No pending deal balances');
        } else {
            pendingDeals.forEach(deal => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${deal.venue}</td>
                    <td>${deal.customerName}</td>
                    <td>${Utils.formatCurrency(deal.projectEstimate)}</td>
                    <td>${Utils.formatCurrency(deal.advance)}</td>
                    <td>${Utils.formatCurrency(deal.balance)}</td>
                `;
                pendingDealsTable.appendChild(row);
            });
        }
    }

    // Update pending workers table
    const pendingWorkersTable = document.getElementById('pending-workers-table-body');
    if (pendingWorkersTable) {
        pendingWorkersTable.innerHTML = '';
        const pendingWorkers = workers.filter(worker => worker.remainingAmount > 0);
        
        if (pendingWorkers.length === 0) {
            Utils.showEmpty(pendingWorkersTable, 'No pending worker payments');
        } else {
            pendingWorkers.forEach(worker => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${worker.projectName}</td>
                    <td>${worker.workerName}</td>
                    <td>${Utils.formatCurrency(worker.paidAmount + worker.remainingAmount)}</td>
                    <td>${Utils.formatCurrency(worker.paidAmount)}</td>
                    <td>${Utils.formatCurrency(worker.remainingAmount)}</td>
                `;
                pendingWorkersTable.appendChild(row);
            });
        }
    }

    // Update pending materials table
    const pendingMaterialsTable = document.getElementById('pending-materials-table-body');
    if (pendingMaterialsTable) {
        pendingMaterialsTable.innerHTML = '';
        const pendingMaterials = materials.filter(material => material.balanceAmount > 0);
        
        if (pendingMaterials.length === 0) {
            Utils.showEmpty(pendingMaterialsTable, 'No pending material payments');
        } else {
            pendingMaterials.forEach(material => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${material.projectName}</td>
                    <td>${material.materialType}</td>
                    <td>${Utils.formatCurrency(material.totalAmount)}</td>
                    <td>${Utils.formatCurrency(material.paidAmount || 0)}</td>
                    <td>${Utils.formatCurrency(material.balanceAmount || 0)}</td>
                `;
                pendingMaterialsTable.appendChild(row);
            });
        }
    }
}

// Load reports data
function loadReportsData() {
    const projectFilter = document.getElementById('report-project-filter');
    if (projectFilter) {
        projectFilter.innerHTML = '<option value="all">All Projects</option>';
        projects.forEach(project => {
            const option = new Option(`${project.venue} - ${project.customerName}`, project.id);
            projectFilter.add(option);
        });
    }
}

// Export functions
window.loadAllData = loadAllData;
window.updateDashboard = updateDashboard;
window.updatePendingBalance = updatePendingBalance;