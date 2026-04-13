// ===== WORKERS MANAGEMENT =====
$(document).ready(function () {
    if (!checkAuth()) return;
    const $workerForm = $('#worker-form');
    if (!$workerForm.length) return;

    $workerForm.on('submit', function (e) {
        e.preventDefault();
        const id = $('#worker-id').val();
        const $projectSel = $('#worker-project');
        const selectedProject = projects.find(p => p.id === $projectSel.val());

        if (!selectedProject) { alert('Please select a valid project'); return; }

        const data = {
            projectId: $projectSel.val(),
            projectName: `${selectedProject.venue} – ${selectedProject.customerName}`,
            workerName: $('#worker-name').val(),
            paidAmount: parseFloat($('#paid-amount').val()) || 0,
            remainingAmount: parseFloat($('#remaining-amount').val()) || 0,
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

    $('#cancel-worker-btn').on('click', resetWorkerForm);
    setupWorkerFilters();
});

function resetWorkerForm() {
    ['worker-id', 'worker-name', 'paid-amount', 'remaining-amount'].forEach(id => {
        $(`#${id}`).val('');
    });
    $('#worker-project').val('');
}

function loadWorkersTable() {
    const $tbody = $('#workers-table-body');
    if (!$tbody.length) return;
    const proj = $('#worker-filter-project').val() || 'all';
    Utils.showLoading($tbody[0], 'Loading...', 6);

    let filtered = [...workers];
    if (proj !== 'all') filtered = filtered.filter(w => w.projectId === proj);

    $tbody.empty();
    let totPaid = 0, totRem = 0, totExp = 0;

    if (!filtered.length) { Utils.showEmpty($tbody[0], 'No workers found', 6); }
    else {
        filtered.forEach(w => {
            totPaid += w.paidAmount;
            totRem += w.remainingAmount;
            totExp += w.paidAmount + w.remainingAmount;
            const $row = $('<tr>').html(`
                <td>${w.projectName}</td>
                <td>${w.workerName}</td>
                <td>${Utils.formatCurrency(w.paidAmount)}</td>
                <td>${Utils.formatCurrency(w.remainingAmount)}</td>
                <td>${Utils.formatCurrency(w.paidAmount + w.remainingAmount)}</td>
                <td class="action-buttons">
                    <button class="btn-sm btn-primary" onclick="editWorker('${w.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-danger" onclick="deleteWorker('${w.id}')"><i class="fas fa-trash"></i></button>
                </td>`);
            $tbody.append($row);
        });
    }

    $('#total-paid').text(Utils.formatCurrency(totPaid));
    $('#total-remaining').text(Utils.formatCurrency(totRem));
    $('#total-worker-expense').text(Utils.formatCurrency(totExp));
}

window.editWorker = function (id) {
    const w = workers.find(x => x.id === id);
    if (!w) return;
    $('#worker-id').val(w.id);
    $('#worker-project').val(w.projectId);
    $('#worker-name').val(w.workerName);
    $('#paid-amount').val(w.paidAmount);
    $('#remaining-amount').val(w.remainingAmount);
    $('html, body').animate({ scrollTop: 0 }, 'smooth');
};

window.deleteWorker = function (id) {
    if (!confirm('Delete this worker?')) return;
    db.ref('workers/' + id).remove()
        .then(() => { alert('Deleted!'); loadAllData(); loadWorkersTable(); })
        .catch(err => { console.error(err); alert('Error deleting.'); });
};

function setupWorkerFilters() {
    $('#worker-filter-project').on('change', loadWorkersTable);
}