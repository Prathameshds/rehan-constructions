// ===== MATERIALS MANAGEMENT =====
$(document).ready(function () {
    if (!checkAuth()) return;
    const $matForm = $('#material-form');
    if (!$matForm.length) return;

    const $qty = $('#quantity');
    const $rateEl = $('#material-rate');
    const $days = $('#lease-days');
    const $total = $('#material-total-amount');
    const $paid = $('#material-paid');
    const $balance = $('#material-balance');

    function calcTotal() {
        $total.val(((parseFloat($qty.val()) || 0) * (parseFloat($rateEl.val()) || 0) * (parseFloat($days.val()) || 0)).toFixed(2));
        calcBalance();
    }
    function calcBalance() {
        $balance.val(((parseFloat($total.val()) || 0) - (parseFloat($paid.val()) || 0)).toFixed(2));
    }

    $qty.on('input', calcTotal);
    $rateEl.on('input', calcTotal);
    $days.on('input', calcTotal);
    $paid.on('input', calcBalance);

    $matForm.on('submit', function (e) {
        e.preventDefault();
        const id = $('#material-id').val();
        const $projectSel = $('#material-project');
        const selectedProject = projects.find(p => p.id === $projectSel.val());

        if (!selectedProject) { alert('Please select a valid project'); return; }

        const data = {
            projectId: $projectSel.val(),
            projectName: `${selectedProject.venue} – ${selectedProject.customerName}`,
            materialType: $('#material-type').val(),
            quantity: parseFloat($qty.val()) || 0,
            rate: parseFloat($rateEl.val()) || 0,
            leaseDays: parseFloat($days.val()) || 0,
            totalAmount: parseFloat($total.val()) || 0,
            paidAmount: parseFloat($paid.val()) || 0,
            balanceAmount: parseFloat($balance.val()) || 0,
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

    $('#cancel-material-btn').on('click', resetMaterialForm);
    setupMaterialFilters();
});

function resetMaterialForm() {
    ['material-id', 'material-type', 'quantity', 'material-rate', 'lease-days', 'material-total-amount', 'material-paid', 'material-balance'].forEach(id => {
        $(`#${id}`).val('');
    });
    $('#material-project').val('');
}

function loadMaterialsTable() {
    const $tbody = $('#materials-table-body');
    if (!$tbody.length) return;
    const proj = $('#material-filter-project').val() || 'all';
    Utils.showLoading($tbody[0], 'Loading...', 9);

    let filtered = [...materials];
    if (proj !== 'all') filtered = filtered.filter(m => m.projectId === proj);

    $tbody.empty();
    let totExp = 0, totPaid = 0, totBal = 0;

    if (!filtered.length) { Utils.showEmpty($tbody[0], 'No materials found', 9); }
    else {
        filtered.forEach(m => {
            totExp += m.totalAmount;
            totPaid += m.paidAmount || 0;
            totBal += m.balanceAmount || 0;
            const $row = $('<tr>').html(`
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
                </td>`);
            $tbody.append($row);
        });
    }

    $('#total-material-expense').text(Utils.formatCurrency(totExp));
    $('#total-material-paid').text(Utils.formatCurrency(totPaid));
    $('#total-material-balance').text(Utils.formatCurrency(totBal));
}

window.editMaterial = function (id) {
    const m = materials.find(x => x.id === id);
    if (!m) return;
    $('#material-id').val(m.id);
    $('#material-project').val(m.projectId);
    $('#material-type').val(m.materialType);
    $('#quantity').val(m.quantity);
    $('#material-rate').val(m.rate);
    $('#lease-days').val(m.leaseDays);
    $('#material-total-amount').val(m.totalAmount);
    $('#material-paid').val(m.paidAmount || 0);
    $('#material-balance').val(m.balanceAmount || 0);
    $('html, body').animate({ scrollTop: 0 }, 'smooth');
};

window.deleteMaterial = function (id) {
    if (!confirm('Delete this material expense?')) return;
    db.ref('materials/' + id).remove()
        .then(() => { alert('Deleted!'); loadAllData(); loadMaterialsTable(); })
        .catch(err => { console.error(err); alert('Error deleting.'); });
};

function setupMaterialFilters() {
    $('#material-filter-project').on('change', loadMaterialsTable);
}