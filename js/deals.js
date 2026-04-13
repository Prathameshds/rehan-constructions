// ===== DEALS MANAGEMENT =====
$(document).ready(function () {
    if (!checkAuth()) return;
    const $dealForm = $('#deal-form');
    if (!$dealForm.length) return;

    const $sqFt = $('#square-footage');
    const $rate = $('#rate-per-foot');
    const $est = $('#project-estimate');
    const $adv = $('#advance');
    const $bal = $('#balance');

    function calcEst() {
        const e = (parseFloat($sqFt.val()) || 0) * (parseFloat($rate.val()) || 0);
        $est.val(e.toFixed(2));
        calcBal();
    }
    function calcBal() {
        $bal.val(((parseFloat($est.val()) || 0) - (parseFloat($adv.val()) || 0)).toFixed(2));
    }

    $sqFt.on('input', calcEst);
    $rate.on('input', calcEst);
    $adv.on('input', calcBal);

    $dealForm.on('submit', function (e) {
        e.preventDefault();
        const id = $('#deal-id').val();
        const data = {
            venue: $('#venue').val(),
            customerName: $('#customer-name').val(),
            date: $('#date-timing').val(),
            squareFootage: parseFloat($sqFt.val()),
            ratePerFoot: parseFloat($rate.val()),
            projectEstimate: parseFloat($est.val()),
            advance: parseFloat($adv.val()),
            balance: parseFloat($bal.val()),
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

    $('#cancel-deal-btn').on('click', resetDealForm);
    setupDealFilters();
});

function resetDealForm() {
    ['deal-id', 'venue', 'customer-name', 'date-timing', 'square-footage', 'rate-per-foot', 'project-estimate', 'advance', 'balance'].forEach(id => {
        $(`#${id}`).val('');
    });
}

function loadDealsTable() {
    const $tbody = $('#deals-table-body');
    if (!$tbody.length) return;
    const period = $('#deal-filter-period').val() || 'all';
    const startDate = $('#deal-start-date').val();
    const endDate = $('#deal-end-date').val();
    Utils.showLoading($tbody[0], 'Loading...', 7);

    let filtered = [...projects];
    if (period === 'custom' && startDate && endDate) filtered = Utils.filterByDateRange(filtered, startDate, endDate);
    else if (period !== 'all') filtered = Utils.filterByPeriod(filtered, period);

    $tbody.empty();
    if (!filtered.length) { Utils.showEmpty($tbody[0], 'No deals found', 7); return; }

    filtered.forEach(deal => {
        const $row = $('<tr>').html(`
            <td>${deal.venue}</td>
            <td>${deal.customerName}</td>
            <td>${Utils.formatDateTime(deal.date)}</td>
            <td>${Utils.formatCurrency(deal.projectEstimate)}</td>
            <td>${Utils.formatCurrency(deal.advance)}</td>
            <td>${Utils.formatCurrency(deal.balance)}</td>
            <td class="action-buttons">
                <button class="btn-sm btn-primary" onclick="editDeal('${deal.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-sm btn-danger" onclick="deleteDeal('${deal.id}')"><i class="fas fa-trash"></i></button>
            </td>`);
        $tbody.append($row);
    });
    updateProjectSelects();
}

window.editDeal = function (id) {
    const d = projects.find(p => p.id === id);
    if (!d) return;
    $('#deal-id').val(d.id);
    $('#venue').val(d.venue);
    $('#customer-name').val(d.customerName);
    $('#date-timing').val(d.date);
    $('#square-footage').val(d.squareFootage);
    $('#rate-per-foot').val(d.ratePerFoot);
    $('#project-estimate').val(d.projectEstimate);
    $('#advance').val(d.advance);
    $('#balance').val(d.balance);
    $('html, body').animate({ scrollTop: 0 }, 'smooth');
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
    const formSelects = ['worker-project', 'material-project'].map(id => $(`#${id}`)).filter(sel => sel.length > 0);
    const filterSelects = ['worker-filter-project', 'material-filter-project', 'report-project-filter'].map(id => $(`#${id}`)).filter(sel => sel.length > 0);

    formSelects.forEach($sel => {
        const val = $sel.val();
        $sel.html('<option value="">Select Project</option>');
        projects.forEach(p => $sel.append(new Option(`${p.venue} – ${p.customerName}`, p.id)));
        if (val && projects.some(p => p.id === val)) $sel.val(val);
    });

    filterSelects.forEach($sel => {
        const val = $sel.val();
        $sel.html('<option value="all">All Projects</option>');
        projects.forEach(p => $sel.append(new Option(`${p.venue} – ${p.customerName}`, p.id)));
        if (val && projects.some(p => p.id === val)) $sel.val(val);
    });
}

function setupDealFilters() {
    const $periodSel = $('#deal-filter-period');
    const $dateRange = $('#deal-date-range');
    const $applyBtn = $('#apply-deal-filter');

    $periodSel.on('change', function () {
        if ($(this).val() === 'custom') $dateRange.css('display', 'flex');
        else { $dateRange.css('display', 'none'); loadDealsTable(); }
    });
    $applyBtn.on('click', loadDealsTable);
}