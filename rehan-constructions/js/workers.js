// Workers Management
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    const workerForm = document.getElementById('worker-form');
    if (!workerForm) return;

    // Submit worker form
    workerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const workerId = document.getElementById('worker-id').value;
        const projectSelect = document.getElementById('worker-project');
        const selectedProject = projects.find(p => p.id === projectSelect.value);

        if (!selectedProject && projectSelect.value !== 'all') {
            alert('Please select a valid project');
            return;
        }

        const workerData = {
            projectId: projectSelect.value,
            projectName: selectedProject ? `${selectedProject.venue} - ${selectedProject.customerName}` : '',
            workerName: document.getElementById('worker-name').value,
            paidAmount: parseFloat(document.getElementById('paid-amount').value) || 0,
            remainingAmount: parseFloat(document.getElementById('remaining-amount').value) || 0,
            userId: currentUser.userId,
            updatedAt: new Date().toISOString()
        };

        if (workerId) {
            db.ref('workers/' + workerId).update(workerData)
                .then(() => {
                    alert('Worker updated successfully!');
                    resetWorkerForm();
                    loadAllData();
                    loadWorkersTable();
                })
                .catch(error => {
                    console.error('Error updating worker:', error);
                    alert('Error updating worker. Please try again.');
                });
        } else {
            workerData.createdAt = new Date().toISOString();
            db.ref('workers').push(workerData)
                .then(() => {
                    alert('Worker added successfully!');
                    resetWorkerForm();
                    loadAllData();
                    loadWorkersTable();
                })
                .catch(error => {
                    console.error('Error saving worker:', error);
                    alert('Error saving worker. Please try again.');
                });
        }
    });

    // Cancel worker form
    document.getElementById('cancel-worker-btn').addEventListener('click', resetWorkerForm);

    // Table loaded by loadAllData() in dashboard.js - don't call here to avoid race condition
    // Setup worker filters
    setupWorkerFilters();
});

// Reset worker form
function resetWorkerForm() {
    document.getElementById('worker-id').value = '';
    document.getElementById('worker-project').value = 'all';
    document.getElementById('worker-name').value = '';
    document.getElementById('paid-amount').value = '';
    document.getElementById('remaining-amount').value = '';
}

// Load workers table
function loadWorkersTable() {
    const workersTableBody = document.getElementById('workers-table-body');
    if (!workersTableBody) return;

    const projectFilter = document.getElementById('worker-filter-project')?.value || 'all';

    Utils.showLoading(workersTableBody);

    let filteredWorkers = [...workers];

    // Apply project filter
    if (projectFilter !== 'all') {
        filteredWorkers = filteredWorkers.filter(w => w.projectId === projectFilter);
    }

    workersTableBody.innerHTML = '';

    let totalPaid = 0;
    let totalRemaining = 0;
    let totalExpense = 0;

    if (filteredWorkers.length === 0) {
        Utils.showEmpty(workersTableBody, 'No workers found');
    } else {
        filteredWorkers.forEach(worker => {
            totalPaid += worker.paidAmount;
            totalRemaining += worker.remainingAmount;
            totalExpense += worker.paidAmount + worker.remainingAmount;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${worker.projectName}</td>
                <td>${worker.workerName}</td>
                <td>${Utils.formatCurrency(worker.paidAmount)}</td>
                <td>${Utils.formatCurrency(worker.remainingAmount)}</td>
                <td>${Utils.formatCurrency(worker.paidAmount + worker.remainingAmount)}</td>
                <td class="action-buttons">
                    <button class="btn-sm btn-primary" onclick="editWorker('${worker.id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="deleteWorker('${worker.id}')">Delete</button>
                </td>
            `;
            workersTableBody.appendChild(row);
        });
    }

    document.getElementById('total-paid').textContent = Utils.formatCurrency(totalPaid);
    document.getElementById('total-remaining').textContent = Utils.formatCurrency(totalRemaining);
    document.getElementById('total-worker-expense').textContent = Utils.formatCurrency(totalExpense);
}

// Edit worker
window.editWorker = function(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
        document.getElementById('worker-id').value = worker.id;
        document.getElementById('worker-project').value = worker.projectId;
        document.getElementById('worker-name').value = worker.workerName;
        document.getElementById('paid-amount').value = worker.paidAmount;
        document.getElementById('remaining-amount').value = worker.remainingAmount;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Delete worker
window.deleteWorker = function(workerId) {
    if (confirm('Are you sure you want to delete this worker?')) {
        db.ref('workers/' + workerId).remove()
            .then(() => {
                alert('Worker deleted successfully!');
                loadAllData();
                loadWorkersTable();
            })
            .catch(error => {
                console.error('Error deleting worker:', error);
                alert('Error deleting worker. Please try again.');
            });
    }
};

// Setup worker filters
function setupWorkerFilters() {
    const projectFilter = document.getElementById('worker-filter-project');
    
    if (projectFilter) {
        projectFilter.addEventListener('change', function() {
            loadWorkersTable();
        });
    }
}