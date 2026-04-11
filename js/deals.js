// ===== DEALS MANAGEMENT =====
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    const dealForm = document.getElementById('deal-form');
    if (!dealForm) return;

    const sqFt = document.getElementById('square-footage');
    const rate = document.getElementById('rate-per-foot');
    const est = document.getElementById('project-estimate');
    const adv = document.getElementById('advance');
    const bal = document.getElementById('balance');

    function calcEst() {
        const e = (parseFloat(sqFt.value) || 0) * (parseFloat(rate.value) || 0);
        est.value = e.toFixed(2);
        calcBal();
    }
    function calcBal() {
        bal.value = ((parseFloat(est.value) || 0) - (parseFloat(adv.value) || 0)).toFixed(2);
    }

    sqFt.addEventListener('input', calcEst);
    rate.addEventListener('input', calcEst);
    adv.addEventListener('input', calcBal);

    dealForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = document.getElementById('deal-id').value;
        const data = {
            venue: document.getElementById('venue').value,
            customerName: document.getElementById('customer-name').value,
            date: document.getElementById('date-timing').value,
            squareFootage: parseFloat(sqFt.value),
            ratePerFoot: parseFloat(rate.value),
            projectEstimate: parseFloat(est.value),
            advance: parseFloat(adv.value),
            balance: parseFloat(bal.value),
            userId: currentUser.userId,
            updatedAt: new Date().toISOString()
        };

        const ref = id ? db.ref('deals/' + id).update(data) : (data.createdAt = new Date().toISOString(), db.ref('deals').push(data));
        ref.then(() => {
            alert(id ? 'Deal updated!' : 'Deal saved!');
            resetDealForm();
            loadAllData();
        }).catch(err => { console.error(err); alert('Error saving deal.'); });
    });

    document.getElementById('cancel-deal-btn').addEventListener('click', resetDealForm);
    setupDealFilters();
});

function resetDealForm() {
    ['deal-id', 'venue', 'customer-name', 'date-timing', 'square-footage', 'rate-per-foot', 'project-estimate', 'advance', 'balance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

function loadDealsTable() {
    const tbody = document.getElementById('deals-table-body');
    if (!tbody) return;
    const period = document.getElementById('deal-filter-period')?.value || 'all';
    const startDate = document.getElementById('deal-start-date')?.value;
    const endDate = document.getElementById('deal-end-date')?.value;
    Utils.showLoading(tbody, 'Loading...', 7);

    let filtered = [...projects];
    if (period === 'custom' && startDate && endDate) filtered = Utils.filterByDateRange(filtered, startDate, endDate);
    else if (period !== 'all') filtered = Utils.filterByPeriod(filtered, period);

    tbody.innerHTML = '';
    if (!filtered.length) { Utils.showEmpty(tbody, 'No deals found', 7); return; }

    filtered.forEach(deal => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${deal.venue}</td>
      <td>${deal.customerName}</td>
      <td>${Utils.formatDateTime(deal.date)}</td>
      <td>${Utils.formatCurrency(deal.projectEstimate)}</td>
      <td>${Utils.formatCurrency(deal.advance)}</td>
      <td>${Utils.formatCurrency(deal.balance)}</td>
      <td class="action-buttons">
        <button class="btn-sm btn-primary" onclick="editDeal('${deal.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-sm btn-danger" onclick="deleteDeal('${deal.id}')"><i class="fas fa-trash"></i></button>
      </td>`;
        tbody.appendChild(row);
    });
    updateProjectSelects();
}

window.editDeal = function (id) {
    const d = projects.find(p => p.id === id);
    if (!d) return;
    document.getElementById('deal-id').value = d.id;
    document.getElementById('venue').value = d.venue;
    document.getElementById('customer-name').value = d.customerName;
    document.getElementById('date-timing').value = d.date;
    document.getElementById('square-footage').value = d.squareFootage;
    document.getElementById('rate-per-foot').value = d.ratePerFoot;
    document.getElementById('project-estimate').value = d.projectEstimate;
    document.getElementById('advance').value = d.advance;
    document.getElementById('balance').value = d.balance;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteDeal = function (id) {
    if (!confirm('Delete this deal and all associated data?')) return;
    Promise.all([
        db.ref('workers').orderByChild('projectId').equalTo(id).once('value'),
        db.ref('materials').orderByChild('projectId').equalTo(id).once('value')
    ]).then(([ws, ms]) => {
        const dels = [];
        ws.forEach(c => dels.push(db.ref('workers/' + c.key).remove()));
        ms.forEach(c => dels.push(db.ref('materials/' + c.key).remove()));
        return Promise.all(dels);
    }).then(() => db.ref('deals/' + id).remove())
        .then(() => { alert('Deleted!'); loadAllData(); loadDealsTable(); })
        .catch(err => { console.error(err); alert('Error deleting.'); });
};

function updateProjectSelects() {
    const formSelects = ['worker-project', 'material-project'].map(id => document.getElementById(id)).filter(Boolean);
    const filterSelects = ['worker-filter-project', 'material-filter-project', 'report-project-filter'].map(id => document.getElementById(id)).filter(Boolean);

    formSelects.forEach(sel => {
        const val = sel.value;
        sel.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(p => sel.add(new Option(`${p.venue} – ${p.customerName}`, p.id)));
        if (val && projects.some(p => p.id === val)) sel.value = val;
    });

    filterSelects.forEach(sel => {
        const val = sel.value;
        sel.innerHTML = '<option value="all">All Projects</option>';
        projects.forEach(p => sel.add(new Option(`${p.venue} – ${p.customerName}`, p.id)));
        if (val && projects.some(p => p.id === val)) sel.value = val;
    });
}

function setupDealFilters() {
    const periodSel = document.getElementById('deal-filter-period');
    const dateRange = document.getElementById('deal-date-range');
    const applyBtn = document.getElementById('apply-deal-filter');

    periodSel?.addEventListener('change', function () {
        if (this.value === 'custom') dateRange.style.display = 'flex';
        else { dateRange.style.display = 'none'; loadDealsTable(); }
    });
    applyBtn?.addEventListener('click', loadDealsTable);
}