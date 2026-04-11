// ===== DASHBOARD MANAGEMENT =====
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;

    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName && currentUser) {
        userDisplayName.textContent = currentUser.username;
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            const pageId = this.dataset.page;
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`${pageId}-page`).classList.add('active');
            const pageTitle = this.querySelector('span').textContent;
            document.querySelector('.page-title').textContent = pageTitle;

            switch (pageId) {
                case 'dashboard': updateDashboard(); break;
                case 'pending-balance': updatePendingBalance(); break;
                case 'reports': 
                    loadReportsData(); 
                    if (typeof generateReport === 'function') generateReport();
                    break;
            }
        });
    });

    document.getElementById('refresh-data').addEventListener('click', loadAllData);

    // Sidebar toggle mobile
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    navItems.forEach(item => item.addEventListener('click', closeSidebar));

    loadAllData();
});

// Global data arrays
let projects = [], workers = [], materials = [];

function loadAllData() {
    if (!currentUser?.userId) return;

    const dealsBody = document.getElementById('deals-table-body');
    const workersBody = document.getElementById('workers-table-body');
    const materialsBody = document.getElementById('materials-table-body');
    if (dealsBody) Utils.showLoading(dealsBody, 'Loading deals...', 7);
    if (workersBody) Utils.showLoading(workersBody, 'Loading workers...', 6);
    if (materialsBody) Utils.showLoading(materialsBody, 'Loading materials...', 9);

    Promise.all([loadProjects(), loadWorkers(), loadMaterials()])
        .then(() => {
            updateDashboard();
            updatePendingBalance();
            if (typeof loadDealsTable === 'function') loadDealsTable();
            if (typeof loadWorkersTable === 'function') loadWorkersTable();
            if (typeof loadMaterialsTable === 'function') loadMaterialsTable();
            if (typeof generateReport === 'function') generateReport();
        })
        .catch(err => {
            console.error('Load error:', err);
            if (dealsBody) Utils.showError(dealsBody, 'Error loading data.', 7);
        });
}

function loadProjects() {
    return new Promise((res, rej) => {
        db.ref('deals').orderByChild('userId').equalTo(currentUser.userId).once('value')
            .then(snap => {
                projects = [];
                snap.forEach(child => projects.push({ id: child.key, ...child.val() }));
                res();
            }).catch(rej);
    });
}

function loadWorkers() {
    return new Promise((res, rej) => {
        db.ref('workers').orderByChild('userId').equalTo(currentUser.userId).once('value')
            .then(snap => {
                workers = [];
                snap.forEach(child => workers.push({ id: child.key, ...child.val() }));
                res();
            }).catch(rej);
    });
}

function loadMaterials() {
    return new Promise((res, rej) => {
        db.ref('materials').orderByChild('userId').equalTo(currentUser.userId).once('value')
            .then(snap => {
                materials = [];
                snap.forEach(child => materials.push({ id: child.key, ...child.val() }));
                res();
            }).catch(rej);
    });
}

function updateDashboard() {
    const activeProjectIds = new Set(projects.map(p => p.id));
    
    const totalProjectValue = projects.reduce((s, d) => s + (Number(d.projectEstimate) || 0), 0);
    const totalAdvance = projects.reduce((s, d) => s + (Number(d.advance) || 0), 0);
    const totalBalance = projects.reduce((s, d) => s + (Number(d.balance) || 0), 0);
    
    const activeWorkers = workers.filter(w => activeProjectIds.has(w.projectId));
    const totalWorkerExp = activeWorkers.reduce((s, w) => s + (Number(w.paidAmount) || 0) + (Number(w.remainingAmount) || 0), 0);
    
    const activeMaterials = materials.filter(m => activeProjectIds.has(m.projectId));
    const totalMaterialExp = activeMaterials.reduce((s, m) => s + (Number(m.totalAmount) || 0), 0);
    
    // Profit = Total Contract Value - Total Expenses (Projected Profit)
    const totalProfit = totalProjectValue - totalWorkerExp - totalMaterialExp;

    document.getElementById('total-ongoing-deals').textContent = projects.length;
    document.getElementById('advance-collected').textContent = Utils.formatCurrency(totalAdvance);
    document.getElementById('remaining-balance').textContent = Utils.formatCurrency(totalBalance);
    document.getElementById('total-worker-expenses').textContent = Utils.formatCurrency(totalWorkerExp);
    document.getElementById('total-material-expenses').textContent = Utils.formatCurrency(totalMaterialExp);
    document.getElementById('total-profit').textContent = Utils.formatCurrency(totalProfit);

    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;
    activityList.innerHTML = '';

    const activities = [];
    
    // Sort and take actual recent items
    const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    const recentWorkers = [...workers].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    const recentMaterials = [...materials].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

    recentProjects.forEach(d => activities.push({ type: 'project', title: 'Project Added', description: `${d.venue} – ${d.customerName}`, timestamp: d.createdAt, icon: 'fa-handshake' }));
    recentWorkers.forEach(w => activities.push({ type: 'worker', title: 'Worker Payment', description: `${Utils.formatCurrency(w.paidAmount)} to ${w.workerName}`, timestamp: w.createdAt, icon: 'fa-user-check' }));
    recentMaterials.forEach(m => activities.push({ type: 'material', title: 'Material Expense', description: `${(m.materialType || '').replace('-', ' ')} for ${m.projectName}`, timestamp: m.createdAt, icon: 'fa-tools' }));

    activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    if (activities.length === 0) {
        activityList.innerHTML = '<div class="activity-item"><p style="color:var(--text-muted)">No recent activity</p></div>';
        return;
    }

    activities.slice(0, 10).forEach(a => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
      <div class="activity-icon"><i class="fas ${a.icon}"></i></div>
      <div class="activity-content">
        <h4>${a.title}</h4>
        <p>${a.description} • ${Utils.formatTimestamp(a.timestamp)}</p>
      </div>`;
        activityList.appendChild(item);
    });
}

function updatePendingBalance() {
    const activeProjectIds = new Set(projects.map(p => p.id));
    const totalDealBal = projects.reduce((s, d) => s + (Number(d.balance) || 0), 0);
    const totalWorkerRem = workers.filter(w => activeProjectIds.has(w.projectId)).reduce((s, w) => s + (Number(w.remainingAmount) || 0), 0);
    const totalMatBal = materials.filter(m => activeProjectIds.has(m.projectId)).reduce((s, m) => s + (Number(m.balanceAmount) || 0), 0);

    document.getElementById('pending-deal-balance').textContent = Utils.formatCurrency(totalDealBal);
    document.getElementById('pending-worker-balance').textContent = Utils.formatCurrency(totalWorkerRem);
    document.getElementById('pending-material-balance').textContent = Utils.formatCurrency(totalMatBal);

    // Deals
    const pdt = document.getElementById('pending-deals-table-body');
    if (pdt) {
        pdt.innerHTML = '';
        const pd = projects.filter(d => d.balance > 0);
        if (!pd.length) { Utils.showEmpty(pdt, 'No pending deal balances', 5); }
        else pd.forEach(d => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${d.venue}</td><td>${d.customerName}</td><td>${Utils.formatCurrency(d.projectEstimate)}</td><td>${Utils.formatCurrency(d.advance)}</td><td>${Utils.formatCurrency(d.balance)}</td>`;
            pdt.appendChild(row);
        });
    }

    // Workers
    const pwt = document.getElementById('pending-workers-table-body');
    if (pwt) {
        pwt.innerHTML = '';
        const pw = workers.filter(w => w.remainingAmount > 0);
        if (!pw.length) { Utils.showEmpty(pwt, 'No pending worker payments', 5); }
        else pw.forEach(w => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${w.projectName}</td><td>${w.workerName}</td><td>${Utils.formatCurrency(w.paidAmount + w.remainingAmount)}</td><td>${Utils.formatCurrency(w.paidAmount)}</td><td>${Utils.formatCurrency(w.remainingAmount)}</td>`;
            pwt.appendChild(row);
        });
    }

    // Materials
    const pmt = document.getElementById('pending-materials-table-body');
    if (pmt) {
        pmt.innerHTML = '';
        const pm = materials.filter(m => m.balanceAmount > 0);
        if (!pm.length) { Utils.showEmpty(pmt, 'No pending material payments', 5); }
        else pm.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${m.projectName}</td><td>${m.materialType}</td><td>${Utils.formatCurrency(m.totalAmount)}</td><td>${Utils.formatCurrency(m.paidAmount || 0)}</td><td>${Utils.formatCurrency(m.balanceAmount || 0)}</td>`;
            pmt.appendChild(row);
        });
    }
}

function loadReportsData() {
    const pf = document.getElementById('report-project-filter');
    if (pf) {
        pf.innerHTML = '<option value="all">All Projects</option>';
        projects.forEach(p => pf.add(new Option(`${p.venue} – ${p.customerName}`, p.id)));
    }
}

window.loadAllData = loadAllData;
window.updateDashboard = updateDashboard;
window.updatePendingBalance = updatePendingBalance;