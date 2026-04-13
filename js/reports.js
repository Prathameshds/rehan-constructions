// ===== REPORTS MANAGEMENT =====
$(document).ready(function () {
    if (!checkAuth()) return;
    setupReportFilters();
    $('#export-pdf').on('click', exportToPDF);
    $('#export-excel').on('click', exportToExcel);
});

function setupReportFilters() {
    const $periodSel = $('#report-filter-period');
    const $dateRange = $('#report-date-range');
    const $applyBtn = $('#apply-report-filter');
    const $projFilter = $('#report-project-filter');

    $periodSel.on('change', function () {
        if ($(this).val() === 'custom') $dateRange.css('display', 'flex');
        else { $dateRange.css('display', 'none'); generateReport(); }
    });
    $applyBtn.on('click', generateReport);
    $projFilter.on('change', generateReport);
    generateReport();
}

function generateReport() {
    const $tbody = $('#reports-table-body');
    if (!$tbody.length) return;

    const period = $('#report-filter-period').val() || 'all';
    const startDate = $('#report-start-date').val();
    const endDate = $('#report-end-date').val();
    const projFilter = $('#report-project-filter').val() || 'all';

    Utils.showLoading($tbody[0], 'Generating report...', 7);
    let filtered = [...projects];
    if (projFilter !== 'all') filtered = filtered.filter(p => p.id === projFilter);
    if (period === 'custom' && startDate && endDate) filtered = Utils.filterByDateRange(filtered, startDate, endDate);
    else if (period !== 'all') filtered = Utils.filterByPeriod(filtered, period);

    $tbody.empty();
    let totVal = 0, totAdv = 0, totBal = 0, totW = 0, totM = 0, totP = 0;

    if (!filtered.length) { Utils.showEmpty($tbody[0], 'No data found for selected filters', 7); }
    else {
        filtered.forEach(proj => {
            const wExp = workers.filter(w => w.projectId === proj.id).reduce((s, w) => s + (Number(w.paidAmount) || 0) + (Number(w.remainingAmount) || 0), 0);
            const mExp = materials.filter(m => m.projectId === proj.id).reduce((s, m) => s + (Number(m.totalAmount) || 0), 0);
            const profit = (Number(proj.projectEstimate) || 0) - wExp - mExp;

            totVal += proj.projectEstimate || 0;
            totAdv += proj.advance || 0;
            totBal += proj.balance || 0;
            totW += wExp; totM += mExp; totP += profit;

            const $row = $('<tr>').html(`
                <td>${proj.venue} – ${proj.customerName}</td>
                <td>${Utils.formatCurrency(proj.projectEstimate || 0)}</td>
                <td>${Utils.formatCurrency(proj.advance || 0)}</td>
                <td>${Utils.formatCurrency(proj.balance || 0)}</td>
                <td>${Utils.formatCurrency(wExp)}</td>
                <td>${Utils.formatCurrency(mExp)}</td>
                <td style="color:${profit >= 0 ? 'var(--success-color, #16a34a)' : '#dc2626'};font-weight:600">${Utils.formatCurrency(profit)}</td>`);
            $tbody.append($row);
        });
    }

    $('#report-total-value').text(Utils.formatCurrency(totVal));
    $('#report-total-advance').text(Utils.formatCurrency(totAdv));
    $('#report-total-balance').text(Utils.formatCurrency(totBal));
    $('#report-total-worker').text(Utils.formatCurrency(totW));
    $('#report-total-material').text(Utils.formatCurrency(totM));
    $('#report-total-profit').text(Utils.formatCurrency(totP));
}

function getFilteredProjectsForReport() {
    const period = $('#report-filter-period').val() || 'all';
    const startDate = $('#report-start-date').val();
    const endDate = $('#report-end-date').val();
    const projFilter = $('#report-project-filter').val() || 'all';
    let filtered = [...projects];
    if (projFilter !== 'all') filtered = filtered.filter(p => p.id === projFilter);
    if (period === 'custom' && startDate && endDate) filtered = Utils.filterByDateRange(filtered, startDate, endDate);
    else if (period !== 'all') filtered = Utils.filterByPeriod(filtered, period);
    return filtered;
}

function calcTotals(projs) {
    return projs.reduce((acc, p) => {
        const wE = workers.filter(w => w.projectId === p.id).reduce((s, w) => s + w.paidAmount + w.remainingAmount, 0);
        const mE = materials.filter(m => m.projectId === p.id).reduce((s, m) => s + m.totalAmount, 0);
        acc.totalValue += Number(p.projectEstimate) || 0;
        acc.totalAdvance += Number(p.advance) || 0;
        acc.totalBalance += Number(p.balance) || 0;
        acc.totalWorker += wE;
        acc.totalMaterial += mE;
        acc.totalProfit += (Number(p.projectEstimate) || 0) - wE - mE;
        return acc;
    }, { totalValue: 0, totalAdvance: 0, totalBalance: 0, totalWorker: 0, totalMaterial: 0, totalProfit: 0 });
}

function exportToPDF() {
    if (!window.jspdf) { alert('PDF library not loaded.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('Rehan Constructions – Financial Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | User: ${currentUser.username}`, 14, 22);

    const fp = getFilteredProjectsForReport();
    const totals = calcTotals(fp);

    const rows = fp.map(p => {
        const wE = workers.filter(w => w.projectId === p.id).reduce((s, w) => s + w.paidAmount + w.remainingAmount, 0);
        const mE = materials.filter(m => m.projectId === p.id).reduce((s, m) => s + m.totalAmount, 0);
        return [`${p.venue} – ${p.customerName}`, `₹${(p.projectEstimate || 0).toFixed(2)}`, `₹${(p.advance || 0).toFixed(2)}`, `₹${(p.balance || 0).toFixed(2)}`, `₹${wE.toFixed(2)}`, `₹${mE.toFixed(2)}`, `₹${((p.projectEstimate || 0) - wE - mE).toFixed(2)}`];
    });
    rows.push(['TOTAL', `₹${totals.totalValue.toFixed(2)}`, `₹${totals.totalAdvance.toFixed(2)}`, `₹${totals.totalBalance.toFixed(2)}`, `₹${totals.totalWorker.toFixed(2)}`, `₹${totals.totalMaterial.toFixed(2)}`, `₹${totals.totalProfit.toFixed(2)}`]);

    doc.autoTable({
        startY: 27,
        head: [['Project', 'Deal Value', 'Advance', 'Balance', 'Worker Exp', 'Material Exp', 'Profit']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save(`Rehan_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportToExcel() {
    if (!window.XLSX) { alert('Excel library not loaded.'); return; }
    const wb = XLSX.utils.book_new();
    const fp = getFilteredProjectsForReport();
    const totals = calcTotals(fp);

    const summaryData = [
        ['Rehan Constructions – Financial Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`User: ${currentUser.username}`],
        [],
        ['OVERALL SUMMARY'],
        ['Total Deal Value', totals.totalValue],
        ['Total Advance', totals.totalAdvance],
        ['Total Balance', totals.totalBalance],
        ['Worker Expenses', totals.totalWorker],
        ['Material Expenses', totals.totalMaterial],
        ['Net Profit', totals.totalProfit]
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

    const projData = [['Project', 'Deal Value', 'Advance', 'Balance', 'Worker Expenses', 'Material Expenses', 'Profit']];
    fp.forEach(p => {
        const wE = workers.filter(w => w.projectId === p.id).reduce((s, w) => s + w.paidAmount + w.remainingAmount, 0);
        const mE = materials.filter(m => m.projectId === p.id).reduce((s, m) => s + m.totalAmount, 0);
        projData.push([`${p.venue} – ${p.customerName}`, p.projectEstimate || 0, p.advance || 0, p.balance || 0, wE, mE, (p.projectEstimate || 0) - wE - mE]);
    });
    projData.push(['TOTAL', totals.totalValue, totals.totalAdvance, totals.totalBalance, totals.totalWorker, totals.totalMaterial, totals.totalProfit]);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(projData), 'Projects');
    XLSX.writeFile(wb, `Rehan_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}