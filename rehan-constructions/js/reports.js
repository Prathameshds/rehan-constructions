// Reports Management
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    // Setup report filters
    setupReportFilters();

    // Export buttons
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
    document.getElementById('export-excel').addEventListener('click', exportToExcel);
});

// Setup report filters
function setupReportFilters() {
    const periodSelect = document.getElementById('report-filter-period');
    const dateRange = document.getElementById('report-date-range');
    const startDate = document.getElementById('report-start-date');
    const endDate = document.getElementById('report-end-date');
    const applyBtn = document.getElementById('apply-report-filter');
    const projectFilter = document.getElementById('report-project-filter');

    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                dateRange.style.display = 'flex';
            } else {
                dateRange.style.display = 'none';
                generateReport();
            }
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', generateReport);
    }

    if (projectFilter) {
        projectFilter.addEventListener('change', generateReport);
    }

    // Initial report generation
    generateReport();
}

// Generate report
function generateReport() {
    const reportsTableBody = document.getElementById('reports-table-body');
    if (!reportsTableBody) return;

    const period = document.getElementById('report-filter-period')?.value || 'all';
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    const projectFilter = document.getElementById('report-project-filter')?.value || 'all';

    Utils.showLoading(reportsTableBody, 'Generating report...');

    // Filter projects
    let filteredProjects = [...projects];
    
    if (projectFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.id === projectFilter);
    }

    // Apply date filter
    if (period === 'custom' && startDate && endDate) {
        filteredProjects = Utils.filterByDateRange(filteredProjects, startDate, endDate);
    } else if (period !== 'all') {
        filteredProjects = Utils.filterByPeriod(filteredProjects, period);
    }

    reportsTableBody.innerHTML = '';

    let totalValue = 0;
    let totalAdvance = 0;
    let totalBalance = 0;
    let totalWorker = 0;
    let totalMaterial = 0;
    let totalProfit = 0;

    if (filteredProjects.length === 0) {
        Utils.showEmpty(reportsTableBody, 'No data found for selected filters');
    } else {
        filteredProjects.forEach(project => {
            const projectWorkers = workers.filter(w => w.projectId === project.id);
            const projectMaterials = materials.filter(m => m.projectId === project.id);

            const workerExpenses = projectWorkers.reduce((sum, w) => sum + w.paidAmount + w.remainingAmount, 0);
            const materialExpenses = projectMaterials.reduce((sum, m) => sum + m.totalAmount, 0);
            const profit = (project.advance || 0) - workerExpenses - materialExpenses;

            totalValue += project.projectEstimate || 0;
            totalAdvance += project.advance || 0;
            totalBalance += project.balance || 0;
            totalWorker += workerExpenses;
            totalMaterial += materialExpenses;
            totalProfit += profit;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.venue} - ${project.customerName}</td>
                <td>${Utils.formatCurrency(project.projectEstimate || 0)}</td>
                <td>${Utils.formatCurrency(project.advance || 0)}</td>
                <td>${Utils.formatCurrency(project.balance || 0)}</td>
                <td>${Utils.formatCurrency(workerExpenses)}</td>
                <td>${Utils.formatCurrency(materialExpenses)}</td>
                <td>${Utils.formatCurrency(profit)}</td>
            `;
            reportsTableBody.appendChild(row);
        });
    }

    document.getElementById('report-total-value').textContent = Utils.formatCurrency(totalValue);
    document.getElementById('report-total-advance').textContent = Utils.formatCurrency(totalAdvance);
    document.getElementById('report-total-balance').textContent = Utils.formatCurrency(totalBalance);
    document.getElementById('report-total-worker').textContent = Utils.formatCurrency(totalWorker);
    document.getElementById('report-total-material').textContent = Utils.formatCurrency(totalMaterial);
    document.getElementById('report-total-profit').textContent = Utils.formatCurrency(totalProfit);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('Rehan Constructions - Financial Report', 14, 15);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`User: ${currentUser.username}`, 14, 27);

    const period = document.getElementById('report-filter-period')?.value || 'all';
    const projectFilter = document.getElementById('report-project-filter')?.value || 'all';
    
    doc.text(`Period: ${period}`, 14, 32);
    if (projectFilter !== 'all') {
        const project = projects.find(p => p.id === projectFilter);
        if (project) {
            doc.text(`Project: ${project.venue} - ${project.customerName}`, 14, 37);
        }
    }

    // Prepare table data
    const tableData = [];
    const filteredProjects = getFilteredProjectsForReport();

    filteredProjects.forEach(project => {
        const workerExpenses = workers.filter(w => w.projectId === project.id)
            .reduce((sum, w) => sum + w.paidAmount + w.remainingAmount, 0);
        const materialExpenses = materials.filter(m => m.projectId === project.id)
            .reduce((sum, m) => sum + m.totalAmount, 0);
        const profit = (project.advance || 0) - workerExpenses - materialExpenses;

        tableData.push([
            `${project.venue} - ${project.customerName}`,
            `₹${(project.projectEstimate || 0).toFixed(2)}`,
            `₹${(project.advance || 0).toFixed(2)}`,
            `₹${(project.balance || 0).toFixed(2)}`,
            `₹${workerExpenses.toFixed(2)}`,
            `₹${materialExpenses.toFixed(2)}`,
            `₹${profit.toFixed(2)}`
        ]);
    });

    // Add totals
    const totals = calculateReportTotals(filteredProjects);
    tableData.push([
        'TOTAL',
        `₹${totals.totalValue.toFixed(2)}`,
        `₹${totals.totalAdvance.toFixed(2)}`,
        `₹${totals.totalBalance.toFixed(2)}`,
        `₹${totals.totalWorker.toFixed(2)}`,
        `₹${totals.totalMaterial.toFixed(2)}`,
        `₹${totals.totalProfit.toFixed(2)}`
    ]);

    // Generate table
    doc.autoTable({
        startY: projectFilter !== 'all' ? 42 : 37,
        head: [['Project', 'Deal Value', 'Advance', 'Balance', 'Worker Exp', 'Material Exp', 'Profit']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        foot: [['', '', '', '', '', '', '']],
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 30, halign: 'right' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' },
            6: { cellWidth: 30, halign: 'right' }
        }
    });

    // Save PDF
    doc.save(`Rehan_Constructions_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export to Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Rehan Constructions - Financial Report'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [`User: ${currentUser.username}`],
        [],
        ['Report Filters'],
        ['Period', document.getElementById('report-filter-period')?.value || 'all'],
        ['Project', document.getElementById('report-project-filter')?.value || 'all'],
        [],
        ['Overall Summary'],
        ['Metric', 'Value']
    ];

    const filteredProjects = getFilteredProjectsForReport();
    const totals = calculateReportTotals(filteredProjects);

    summaryData.push(
        ['Total Deal Value', `₹${totals.totalValue.toFixed(2)}`],
        ['Total Advance Collected', `₹${totals.totalAdvance.toFixed(2)}`],
        ['Total Balance Remaining', `₹${totals.totalBalance.toFixed(2)}`],
        ['Total Worker Expenses', `₹${totals.totalWorker.toFixed(2)}`],
        ['Total Material Expenses', `₹${totals.totalMaterial.toFixed(2)}`],
        ['Total Net Profit', `₹${totals.totalProfit.toFixed(2)}`]
    );

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Project details sheet
    const projectData = [
        ['Project Name', 'Deal Value', 'Advance', 'Balance', 'Worker Expenses', 'Material Expenses', 'Profit']
    ];

    filteredProjects.forEach(project => {
        const workerExpenses = workers.filter(w => w.projectId === project.id)
            .reduce((sum, w) => sum + w.paidAmount + w.remainingAmount, 0);
        const materialExpenses = materials.filter(m => m.projectId === project.id)
            .reduce((sum, m) => sum + m.totalAmount, 0);
        const profit = (project.advance || 0) - workerExpenses - materialExpenses;

        projectData.push([
            `${project.venue} - ${project.customerName}`,
            project.projectEstimate || 0,
            project.advance || 0,
            project.balance || 0,
            workerExpenses,
            materialExpenses,
            profit
        ]);
    });

    projectData.push([
        'TOTAL',
        totals.totalValue,
        totals.totalAdvance,
        totals.totalBalance,
        totals.totalWorker,
        totals.totalMaterial,
        totals.totalProfit
    ]);

    const wsProjects = XLSX.utils.aoa_to_sheet(projectData);
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Project Details');

    // Save Excel file
    XLSX.writeFile(wb, `Rehan_Constructions_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Get filtered projects for report
function getFilteredProjectsForReport() {
    const period = document.getElementById('report-filter-period')?.value || 'all';
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    const projectFilter = document.getElementById('report-project-filter')?.value || 'all';

    let filteredProjects = [...projects];
    
    if (projectFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.id === projectFilter);
    }

    if (period === 'custom' && startDate && endDate) {
        filteredProjects = Utils.filterByDateRange(filteredProjects, startDate, endDate);
    } else if (period !== 'all') {
        filteredProjects = Utils.filterByPeriod(filteredProjects, period);
    }

    return filteredProjects;
}

// Calculate report totals
function calculateReportTotals(projects) {
    let totalValue = 0;
    let totalAdvance = 0;
    let totalBalance = 0;
    let totalWorker = 0;
    let totalMaterial = 0;
    let totalProfit = 0;

    projects.forEach(project => {
        const workerExpenses = workers.filter(w => w.projectId === project.id)
            .reduce((sum, w) => sum + w.paidAmount + w.remainingAmount, 0);
        const materialExpenses = materials.filter(m => m.projectId === project.id)
            .reduce((sum, m) => sum + m.totalAmount, 0);
        const profit = (project.advance || 0) - workerExpenses - materialExpenses;

        totalValue += project.projectEstimate || 0;
        totalAdvance += project.advance || 0;
        totalBalance += project.balance || 0;
        totalWorker += workerExpenses;
        totalMaterial += materialExpenses;
        totalProfit += profit;
    });

    return {
        totalValue,
        totalAdvance,
        totalBalance,
        totalWorker,
        totalMaterial,
        totalProfit
    };
}