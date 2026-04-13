// ===== DASHBOARD MANAGEMENT =====
$(document).ready(function () {
    if (!checkAuth()) return;

    const $userDisplayName = $('#user-display-name');
    if ($userDisplayName.length && currentUser) {
        $userDisplayName.text(currentUser.username);
    }

    // Navigation with jQuery
    const $navItems = $('.nav-item');
    const $pages = $('.page');

    $navItems.on('click', function (e) {
        e.preventDefault();
        $navItems.removeClass('active');
        $(this).addClass('active');
        const pageId = $(this).data('page');
        $pages.removeClass('active');
        $(`#${pageId}-page`).addClass('active');
        const pageTitle = $(this).find('span').text();
        $('.page-title').text(pageTitle);

        switch (pageId) {
            case 'dashboard': updateDashboard(); break;
            case 'pending-balance': updatePendingBalance(); break;
            case 'reports': 
                loadReportsData(); 
                if (typeof generateReport === 'function') generateReport();
                break;
        }
    });

    $('#refresh-data').on('click', loadAllData);

    // Sidebar toggle mobile
    const $sidebar = $('.sidebar');
    const $overlay = $('#sidebar-overlay');
    const $toggleBtn = $('#sidebar-toggle-btn');

    function openSidebar() {
        $sidebar.addClass('open');
        $overlay.addClass('show');
        $('body').css('overflow', 'hidden');
    }
    function closeSidebar() {
        $sidebar.removeClass('open');
        $overlay.removeClass('show');
        $('body').css('overflow', '');
    }

    if ($toggleBtn.length) $toggleBtn.on('click', openSidebar);
    if ($overlay.length) $overlay.on('click', closeSidebar);
    $navItems.on('click', closeSidebar);

    loadAllData();
});

// Global data arrays
let projects = [], workers = [], materials = [];

function loadAllData() {
    if (!currentUser?.userId) return;

    const $dealsBody = $('#deals-table-body');
    const $workersBody = $('#workers-table-body');
    const $materialsBody = $('#materials-table-body');
    if ($dealsBody.length) Utils.showLoading($dealsBody[0], 'Loading deals...', 7);
    if ($workersBody.length) Utils.showLoading($workersBody[0], 'Loading workers...', 6);
    if ($materialsBody.length) Utils.showLoading($materialsBody[0], 'Loading materials...', 9);

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
            if ($dealsBody.length) Utils.showError($dealsBody[0], 'Error loading data.', 7);
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

    $('#total-ongoing-deals').text(projects.length);
    $('#advance-collected').text(Utils.formatCurrency(totalAdvance));
    $('#remaining-balance').text(Utils.formatCurrency(totalBalance));
    $('#total-worker-expenses').text(Utils.formatCurrency(totalWorkerExp));
    $('#total-material-expenses').text(Utils.formatCurrency(totalMaterialExp));
    $('#total-profit').text(Utils.formatCurrency(totalProfit));

    updateRecentActivity();
}

function updateRecentActivity() {
    const $activityList = $('#recent-activity-list');
    if (!$activityList.length) return;
    $activityList.empty();

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
        $activityList.html('<div class="activity-item"><p style="color:var(--text-muted)">No recent activity</p></div>');
        return;
    }

    activities.slice(0, 10).forEach(a => {
        const $item = $('<div>')
            .addClass('activity-item')
            .html(`
                <div class="activity-icon"><i class="fas ${a.icon}"></i></div>
                <div class="activity-content">
                    <h4>${a.title}</h4>
                    <p>${a.description} • ${Utils.formatTimestamp(a.timestamp)}</p>
                </div>`);
        $activityList.append($item);
    });
}

function updatePendingBalance() {
    const activeProjectIds = new Set(projects.map(p => p.id));
    const totalDealBal = projects.reduce((s, d) => s + (Number(d.balance) || 0), 0);
    const totalWorkerRem = workers.filter(w => activeProjectIds.has(w.projectId)).reduce((s, w) => s + (Number(w.remainingAmount) || 0), 0);
    const totalMatBal = materials.filter(m => activeProjectIds.has(m.projectId)).reduce((s, m) => s + (Number(m.balanceAmount) || 0), 0);

    $('#pending-deal-balance').text(Utils.formatCurrency(totalDealBal));
    $('#pending-worker-balance').text(Utils.formatCurrency(totalWorkerRem));
    $('#pending-material-balance').text(Utils.formatCurrency(totalMatBal));

    // Deals
    const $pdt = $('#pending-deals-table-body');
    if ($pdt.length) {
        $pdt.empty();
        const pd = projects.filter(d => d.balance > 0);
        if (!pd.length) { Utils.showEmpty($pdt[0], 'No pending deal balances', 5); }
        else pd.forEach(d => {
            const $row = $('<tr>').html(`<td>${d.venue}</td><td>${d.customerName}</td><td>${Utils.formatCurrency(d.projectEstimate)}</td><td>${Utils.formatCurrency(d.advance)}</td><td>${Utils.formatCurrency(d.balance)}</td>`);
            $pdt.append($row);
        });
    }

    // Workers
    const $pwt = $('#pending-workers-table-body');
    if ($pwt.length) {
        $pwt.empty();
        const pw = workers.filter(w => w.remainingAmount > 0);
        if (!pw.length) { Utils.showEmpty($pwt[0], 'No pending worker payments', 5); }
        else pw.forEach(w => {
            const $row = $('<tr>').html(`<td>${w.projectName}</td><td>${w.workerName}</td><td>${Utils.formatCurrency(w.paidAmount + w.remainingAmount)}</td><td>${Utils.formatCurrency(w.paidAmount)}</td><td>${Utils.formatCurrency(w.remainingAmount)}</td>`);
            $pwt.append($row);
        });
    }

    // Materials
    const $pmt = $('#pending-materials-table-body');
    if ($pmt.length) {
        $pmt.empty();
        const pm = materials.filter(m => m.balanceAmount > 0);
        if (!pm.length) { Utils.showEmpty($pmt[0], 'No pending material payments', 5); }
        else pm.forEach(m => {
            const $row = $('<tr>').html(`<td>${m.projectName}</td><td>${m.materialType}</td><td>${Utils.formatCurrency(m.totalAmount)}</td><td>${Utils.formatCurrency(m.paidAmount || 0)}</td><td>${Utils.formatCurrency(m.balanceAmount || 0)}</td>`);
            $pmt.append($row);
        });
    }
}

function loadReportsData() {
    const $pf = $('#report-project-filter');
    if ($pf.length) {
        $pf.html('<option value="all">All Projects</option>');
        projects.forEach(p => $pf.append(new Option(`${p.venue} – ${p.customerName}`, p.id)));
    }
}

window.loadAllData = loadAllData;
window.updateDashboard = updateDashboard;
window.updatePendingBalance = updatePendingBalance;