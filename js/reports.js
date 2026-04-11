// ===== REPORTS MANAGEMENT =====
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    setupReportFilters();
    document.getElementById('export-pdf')?.addEventListener('click', exportToPDF);
    document.getElementById('export-excel')?.addEventListener('click', exportToExcel);
});

function setupReportFilters() {
    const periodSel = document.getElementById('report-filter-period');
    const dateRange = document.getElementById('report-date-range');
    const applyBtn = document.getElementById('apply-report-filter');
    const projFilter = document.getElementById('report-project-filter');

    periodSel?.addEventListener('change', function () {
        if (this.value === 'custom') dateRange.style.display = 'flex';
        else { dateRange.style.display = 'none'; generateReport(); }
    });
    applyBtn?.addEventListener('click', generateReport);
    projFilter?.addEventListener('change', generateReport);
    generateReport();
}

function generateReport() {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    const period = document.getElementById('report-filter-period')?.value || 'all';
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    const projFilter = document.getElementById('report-project-filter')?.value || 'all';

    Utils.showLoading(tbody, 'Generating report...', 7);
    let filtered = [...projects];
    if (projFilter !== 'all') filtered = filtered.filter(p => p.id === projFilter);
    if (period === 'custom' && startDate && endDate) filtered = Utils.filterByDateRange(filtered, startDate, endDate);
    else if (period !== 'all') filtered = Utils.filterByPeriod(filtered, period);

    tbody.innerHTML = '';
    let totVal = 0, totAdv = 0, totBal = 0, totW = 0, totM = 0, totP = 0;

    if (!filtered.length) { Utils.showEmpty(tbody, 'No data found for selected filters', 7); }
    else {
        filtered.forEach(proj => {
            const wExp = workers.filter(w => w.projectId === proj.id).reduce((s, w) => s + (Number(w.paidAmount) || 0) + (Number(w.remainingAmount) || 0), 0);
            const mExp = materials.filter(m => m.projectId === proj.id).reduce((s, m) => s + (Number(m.totalAmount) || 0), 0);
            const profit = (Number(proj.projectEstimate) || 0) - wExp - mExp;

            totVal += proj.projectEstimate || 0;
            totAdv += proj.advance || 0;
            totBal += proj.balance || 0;
            totW += wExp; totM += mExp; totP += profit;

            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${proj.venue} – ${proj.customerName}</td>
        <td>${Utils.formatCurrency(proj.projectEstimate || 0)}</td>
        <td>${Utils.formatCurrency(proj.advance || 0)}</td>
        <td>${Utils.formatCurrency(proj.balance || 0)}</td>
        <td>${Utils.formatCurrency(wExp)}</td>
        <td>${Utils.formatCurrency(mExp)}</td>
        <td style="color:${profit >= 0 ? 'var(--success-color, #16a34a)' : '#dc2626'};font-weight:600">${Utils.formatCurrency(profit)}</td>`;
            tbody.appendChild(row);
        });
    }

    document.getElementById('report-total-value').textContent = Utils.formatCurrency(totVal);
    document.getElementById('report-total-advance').textContent = Utils.formatCurrency(totAdv);
    document.getElementById('report-total-balance').textContent = Utils.formatCurrency(totBal);
    document.getElementById('report-total-worker').textContent = Utils.formatCurrency(totW);
    document.getElementById('report-total-material').textContent = Utils.formatCurrency(totM);
    document.getElementById('report-total-profit').textContent = Utils.formatCurrency(totP);
}

function getFilteredProjectsForReport() {
    const period = document.getElementById('report-filter-period')?.value || 'all';
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    const projFilter = document.getElementById('report-project-filter')?.value || 'all';
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