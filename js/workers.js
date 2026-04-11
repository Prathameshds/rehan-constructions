// ===== WORKERS MANAGEMENT =====
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    const workerForm = document.getElementById('worker-form');
    if (!workerForm) return;

    workerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = document.getElementById('worker-id').value;
        const projectSel = document.getElementById('worker-project');
        const selectedProject = projects.find(p => p.id === projectSel.value);

        if (!selectedProject) { alert('Please select a valid project'); return; }

        const data = {
            projectId: projectSel.value,
            projectName: `${selectedProject.venue} – ${selectedProject.customerName}`,
            workerName: document.getElementById('worker-name').value,
            paidAmount: parseFloat(document.getElementById('paid-amount').value) || 0,
            remainingAmount: parseFloat(document.getElementById('remaining-amount').value) || 0,
            userId: currentUser.userId,
            updatedAt: new Date().toISOString()
        };

        const ref = id ? db.ref('workers/' + id).update(data) : (data.createdAt = new Date().toISOString(), db.ref('workers').push(data));
        ref.then(() => {
            alert(id ? 'Worker updated!' : 'Worker added!');
            resetWorkerForm();
            loadAllData();
        }).catch(err => { console.error(err); alert('Error saving worker.'); });
    });

    document.getElementById('cancel-worker-btn').addEventListener('click', resetWorkerForm);
    setupWorkerFilters();
});

function resetWorkerForm() {
    ['worker-id', 'worker-name', 'paid-amount', 'remaining-amount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sel = document.getElementById('worker-project');
    if (sel) sel.value = '';
}

function loadWorkersTable() {
    const tbody = document.getElementById('workers-table-body');
    if (!tbody) return;
    const proj = document.getElementById('worker-filter-project')?.value || 'all';
    Utils.showLoading(tbody, 'Loading...', 6);

    let filtered = [...workers];
    if (proj !== 'all') filtered = filtered.filter(w => w.projectId === proj);

    tbody.innerHTML = '';
    let totPaid = 0, totRem = 0, totExp = 0;

    if (!filtered.length) { Utils.showEmpty(tbody, 'No workers found', 6); }
    else {
        filtered.forEach(w => {
            totPaid += w.paidAmount;
            totRem += w.remainingAmount;
            totExp += w.paidAmount + w.remainingAmount;
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${w.projectName}</td>
        <td>${w.workerName}</td>
        <td>${Utils.formatCurrency(w.paidAmount)}</td>
        <td>${Utils.formatCurrency(w.remainingAmount)}</td>
        <td>${Utils.formatCurrency(w.paidAmount + w.remainingAmount)}</td>
        <td class="action-buttons">
          <button class="btn-sm btn-primary" onclick="editWorker('${w.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-sm btn-danger" onclick="deleteWorker('${w.id}')"><i class="fas fa-trash"></i></button>
        </td>`;
            tbody.appendChild(row);
        });
    }

    document.getElementById('total-paid').textContent = Utils.formatCurrency(totPaid);
    document.getElementById('total-remaining').textContent = Utils.formatCurrency(totRem);
    document.getElementById('total-worker-expense').textContent = Utils.formatCurrency(totExp);
}

window.editWorker = function (id) {
    const w = workers.find(x => x.id === id);
    if (!w) return;
    document.getElementById('worker-id').value = w.id;
    document.getElementById('worker-project').value = w.projectId;
    document.getElementById('worker-name').value = w.workerName;
    document.getElementById('paid-amount').value = w.paidAmount;
    document.getElementById('remaining-amount').value = w.remainingAmount;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteWorker = function (id) {
    if (!confirm('Delete this worker?')) return;
    db.ref('workers/' + id).remove()
        .then(() => { alert('Deleted!'); loadAllData(); loadWorkersTable(); })
        .catch(err => { console.error(err); alert('Error deleting.'); });
};

function setupWorkerFilters() {
    document.getElementById('worker-filter-project')?.addEventListener('change', loadWorkersTable);
}