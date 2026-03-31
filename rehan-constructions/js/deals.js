// Deals Management
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    const dealForm = document.getElementById('deal-form');
    if (!dealForm) return;

    const squareFootageInput = document.getElementById('square-footage');
    const ratePerFootInput = document.getElementById('rate-per-foot');
    const projectEstimateInput = document.getElementById('project-estimate');
    const advanceInput = document.getElementById('advance');
    const balanceInput = document.getElementById('balance');

    // Calculate project estimate
    function calculateProjectEstimate() {
        const sqFt = parseFloat(squareFootageInput.value) || 0;
        const rate = parseFloat(ratePerFootInput.value) || 0;
        const estimate = sqFt * rate;
        projectEstimateInput.value = estimate.toFixed(2);
        calculateBalance();
    }

    // Calculate balance
    function calculateBalance() {
        const estimate = parseFloat(projectEstimateInput.value) || 0;
        const advance = parseFloat(advanceInput.value) || 0;
        const balance = estimate - advance;
        balanceInput.value = balance.toFixed(2);
    }

    squareFootageInput.addEventListener('input', calculateProjectEstimate);
    ratePerFootInput.addEventListener('input', calculateProjectEstimate);
    advanceInput.addEventListener('input', calculateBalance);

    // Submit deal form
    dealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const dealId = document.getElementById('deal-id').value;
        const dealData = {
            venue: document.getElementById('venue').value,
            customerName: document.getElementById('customer-name').value,
            date: document.getElementById('date-timing').value,
            squareFootage: parseFloat(squareFootageInput.value),
            ratePerFoot: parseFloat(ratePerFootInput.value),
            projectEstimate: parseFloat(projectEstimateInput.value),
            advance: parseFloat(advanceInput.value),
            balance: parseFloat(balanceInput.value),
            userId: currentUser.userId,
            updatedAt: new Date().toISOString()
        };

        if (dealId) {
            db.ref('deals/' + dealId).update(dealData)
                .then(() => {
                    alert('Deal updated successfully!');
                    resetDealForm();
                    loadAllData();
                    loadDealsTable();
                })
                .catch(error => {
                    console.error('Error updating deal:', error);
                    alert('Error updating deal. Please try again.');
                });
        } else {
            dealData.createdAt = new Date().toISOString();
            db.ref('deals').push(dealData)
                .then(() => {
                    alert('Deal saved successfully!');
                    resetDealForm();
                    loadAllData();
                    loadDealsTable();
                })
                .catch(error => {
                    console.error('Error saving deal:', error);
                    alert('Error saving deal. Please try again.');
                });
        }
    });

    // Cancel deal form
    document.getElementById('cancel-deal-btn').addEventListener('click', resetDealForm);

    // Table loaded by loadAllData() in dashboard.js - don't call here to avoid race condition
    // Setup deal filters
    setupDealFilters();
});

// Reset deal form
function resetDealForm() {
    document.getElementById('deal-id').value = '';
    document.getElementById('venue').value = '';
    document.getElementById('customer-name').value = '';
    document.getElementById('date-timing').value = '';
    document.getElementById('square-footage').value = '';
    document.getElementById('rate-per-foot').value = '';
    document.getElementById('project-estimate').value = '';
    document.getElementById('advance').value = '';
    document.getElementById('balance').value = '';
}

// Load deals table
function loadDealsTable() {
    const dealsTableBody = document.getElementById('deals-table-body');
    if (!dealsTableBody) return;

    const period = document.getElementById('deal-filter-period')?.value || 'all';
    const startDate = document.getElementById('deal-start-date')?.value;
    const endDate = document.getElementById('deal-end-date')?.value;

    Utils.showLoading(dealsTableBody);

    let filteredDeals = [...projects];

    // Apply date filter
    if (period === 'custom' && startDate && endDate) {
        filteredDeals = Utils.filterByDateRange(filteredDeals, startDate, endDate);
    } else if (period !== 'all') {
        filteredDeals = Utils.filterByPeriod(filteredDeals, period);
    }

    dealsTableBody.innerHTML = '';

    if (filteredDeals.length === 0) {
        Utils.showEmpty(dealsTableBody, 'No deals found');
        return;
    }

    filteredDeals.forEach(deal => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${deal.venue}</td>
            <td>${deal.customerName}</td>
            <td>${Utils.formatDateTime(deal.date)}</td>
            <td>${Utils.formatCurrency(deal.projectEstimate)}</td>
            <td>${Utils.formatCurrency(deal.advance)}</td>
            <td>${Utils.formatCurrency(deal.balance)}</td>
            <td class="action-buttons">
                <button class="btn-sm btn-primary" onclick="editDeal('${deal.id}')">Edit</button>
                <button class="btn-sm btn-danger" onclick="deleteDeal('${deal.id}')">Delete</button>
            </td>
        `;
        dealsTableBody.appendChild(row);
    });

    // Update project selects in other pages
    updateProjectSelects();
}

// Edit deal
window.editDeal = function(dealId) {
    const deal = projects.find(p => p.id === dealId);
    if (deal) {
        document.getElementById('deal-id').value = deal.id;
        document.getElementById('venue').value = deal.venue;
        document.getElementById('customer-name').value = deal.customerName;
        document.getElementById('date-timing').value = deal.date;
        document.getElementById('square-footage').value = deal.squareFootage;
        document.getElementById('rate-per-foot').value = deal.ratePerFoot;
        document.getElementById('project-estimate').value = deal.projectEstimate;
        document.getElementById('advance').value = deal.advance;
        document.getElementById('balance').value = deal.balance;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Delete deal
window.deleteDeal = function(dealId) {
    if (confirm('Are you sure you want to delete this deal? This will also delete associated workers and materials.')) {
        Promise.all([
            db.ref('workers').orderByChild('projectId').equalTo(dealId).once('value'),
            db.ref('materials').orderByChild('projectId').equalTo(dealId).once('value')
        ]).then(([workersSnapshot, materialsSnapshot]) => {
            const deletePromises = [];

            workersSnapshot.forEach(child => {
                deletePromises.push(db.ref('workers/' + child.key).remove());
            });

            materialsSnapshot.forEach(child => {
                deletePromises.push(db.ref('materials/' + child.key).remove());
            });

            return Promise.all(deletePromises);
        }).then(() => {
            return db.ref('deals/' + dealId).remove();
        }).then(() => {
            alert('Deal and associated data deleted successfully!');
            loadAllData();
            loadDealsTable();
        }).catch(error => {
            console.error('Error deleting deal:', error);
            alert('Error deleting deal. Please try again.');
        });
    }
};

// Update project selects in worker and material forms
function updateProjectSelects() {
    const workerProjectSelect = document.getElementById('worker-project');
    const materialProjectSelect = document.getElementById('material-project');
    const workerFilterProject = document.getElementById('worker-filter-project');
    const materialFilterProject = document.getElementById('material-filter-project');
    const reportProjectFilter = document.getElementById('report-project-filter');

    // Form selects need "Select Project", filter selects need "All Projects"
    const formSelects = [workerProjectSelect, materialProjectSelect].filter(Boolean);
    const filterSelects = [workerFilterProject, materialFilterProject, reportProjectFilter].filter(Boolean);

    formSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            select.add(new Option(`${project.venue} - ${project.customerName}`, project.id));
        });
        if (currentValue && projects.some(p => p.id === currentValue)) select.value = currentValue;
    });

    filterSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="all">All Projects</option>';
        projects.forEach(project => {
            select.add(new Option(`${project.venue} - ${project.customerName}`, project.id));
        });
        if (currentValue && projects.some(p => p.id === currentValue)) select.value = currentValue;
    });
}

// Setup deal filters
function setupDealFilters() {
    const periodSelect = document.getElementById('deal-filter-period');
    const dateRange = document.getElementById('deal-date-range');
    const startDate = document.getElementById('deal-start-date');
    const endDate = document.getElementById('deal-end-date');
    const applyBtn = document.getElementById('apply-deal-filter');

    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                dateRange.style.display = 'flex';
            } else {
                dateRange.style.display = 'none';
                loadDealsTable();
            }
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            loadDealsTable();
        });
    }
}