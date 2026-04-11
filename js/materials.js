// ===== MATERIALS MANAGEMENT =====
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    const matForm = document.getElementById('material-form');
    if (!matForm) return;

    const qty = document.getElementById('quantity');
    const rateEl = document.getElementById('material-rate');
    const days = document.getElementById('lease-days');
    const total = document.getElementById('material-total-amount');
    const paid = document.getElementById('material-paid');
    const balance = document.getElementById('material-balance');

    function calcTotal() {
        total.value = ((parseFloat(qty.value) || 0) * (parseFloat(rateEl.value) || 0) * (parseFloat(days.value) || 0)).toFixed(2);
        calcBalance();
    }
    function calcBalance() {
        balance.value = ((parseFloat(total.value) || 0) - (parseFloat(paid.value) || 0)).toFixed(2);
    }

    qty.addEventListener('input', calcTotal);
    rateEl.addEventListener('input', calcTotal);
    days.addEventListener('input', calcTotal);
    paid.addEventListener('input', calcBalance);

    matForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = document.getElementById('material-id').value;
        const projectSel = document.getElementById('material-project');
        const selectedProject = projects.find(p => p.id === projectSel.value);

        if (!selectedProject) { alert('Please select a valid project'); return; }

        const data = {
            projectId: projectSel.value,
            projectName: `${selectedProject.venue} – ${selectedProject.customerName}`,
            materialType: document.getElementById('material-type').value,
            quantity: parseFloat(qty.value) || 0,
            rate: parseFloat(rateEl.value) || 0,
            leaseDays: parseFloat(days.value) || 0,
            totalAmount: parseFloat(total.value) || 0,
            paidAmount: parseFloat(paid.value) || 0,
            balanceAmount: parseFloat(balance.value) || 0,
            userId: currentUser.userId,
            updatedAt: new Date().toISOString()
        };

        const ref = id ? db.ref('materials/' + id).update(data) : (data.createdAt = new Date().toISOString(), db.ref('materials').push(data));
        ref.then(() => {
            alert(id ? 'Material updated!' : 'Material added!');
            resetMaterialForm();
            loadAllData();
        }).catch(err => { console.error(err); alert('Error saving material.'); });
    });

    document.getElementById('cancel-material-btn').addEventListener('click', resetMaterialForm);
    setupMaterialFilters();
});

function resetMaterialForm() {
    ['material-id', 'material-type', 'quantity', 'material-rate', 'lease-days', 'material-total-amount', 'material-paid', 'material-balance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sel = document.getElementById('material-project');
    if (sel) sel.value = '';
}

function loadMaterialsTable() {
    const tbody = document.getElementById('materials-table-body');
    if (!tbody) return;
    const proj = document.getElementById('material-filter-project')?.value || 'all';
    Utils.showLoading(tbody, 'Loading...', 9);

    let filtered = [...materials];
    if (proj !== 'all') filtered = filtered.filter(m => m.projectId === proj);

    tbody.innerHTML = '';
    let totExp = 0, totPaid = 0, totBal = 0;

    if (!filtered.length) { Utils.showEmpty(tbody, 'No materials found', 9); }
    else {
        filtered.forEach(m => {
            totExp += m.totalAmount;
            totPaid += m.paidAmount || 0;
            totBal += m.balanceAmount || 0;
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${m.projectName}</td>
        <td>${(m.materialType || '').replace('-', ' ').toUpperCase()}</td>
        <td>${m.quantity}</td>
        <td>${Utils.formatCurrency(m.rate)}</td>
        <td>${m.leaseDays}</td>
        <td>${Utils.formatCurrency(m.totalAmount)}</td>
        <td>${Utils.formatCurrency(m.paidAmount || 0)}</td>
        <td>${Utils.formatCurrency(m.balanceAmount || 0)}</td>
        <td class="action-buttons">
          <button class="btn-sm btn-primary" onclick="editMaterial('${m.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-sm btn-danger" onclick="deleteMaterial('${m.id}')"><i class="fas fa-trash"></i></button>
        </td>`;
            tbody.appendChild(row);
        });
    }

    document.getElementById('total-material-expense').textContent = Utils.formatCurrency(totExp);
    document.getElementById('total-material-paid').textContent = Utils.formatCurrency(totPaid);
    document.getElementById('total-material-balance').textContent = Utils.formatCurrency(totBal);
}

window.editMaterial = function (id) {
    const m = materials.find(x => x.id === id);
    if (!m) return;
    document.getElementById('material-id').value = m.id;
    document.getElementById('material-project').value = m.projectId;
    document.getElementById('material-type').value = m.materialType;
    document.getElementById('quantity').value = m.quantity;
    document.getElementById('material-rate').value = m.rate;
    document.getElementById('lease-days').value = m.leaseDays;
    document.getElementById('material-total-amount').value = m.totalAmount;
    document.getElementById('material-paid').value = m.paidAmount || 0;
    document.getElementById('material-balance').value = m.balanceAmount || 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteMaterial = function (id) {
    if (!confirm('Delete this material expense?')) return;
    db.ref('materials/' + id).remove()
        .then(() => { alert('Deleted!'); loadAllData(); loadMaterialsTable(); })
        .catch(err => { console.error(err); alert('Error deleting.'); });
};

function setupMaterialFilters() {
    document.getElementById('material-filter-project')?.addEventListener('change', loadMaterialsTable);
}