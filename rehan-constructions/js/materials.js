// Materials Management
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    const materialForm = document.getElementById('material-form');
    if (!materialForm) return;

    const quantityInput = document.getElementById('quantity');
    const materialRateInput = document.getElementById('material-rate');
    const leaseDaysInput = document.getElementById('lease-days');
    const materialTotalInput = document.getElementById('material-total-amount');
    const materialPaidInput = document.getElementById('material-paid');
    const materialBalanceInput = document.getElementById('material-balance');

    // Calculate material total
    function calculateMaterialTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(materialRateInput.value) || 0;
        const days = parseFloat(leaseDaysInput.value) || 0;
        const total = quantity * rate * days;
        materialTotalInput.value = total.toFixed(2);
        calculateMaterialBalance();
    }

    // Calculate material balance
    function calculateMaterialBalance() {
        const total = parseFloat(materialTotalInput.value) || 0;
        const paid = parseFloat(materialPaidInput.value) || 0;
        const balance = total - paid;
        materialBalanceInput.value = balance.toFixed(2);
    }

    quantityInput.addEventListener('input', calculateMaterialTotal);
    materialRateInput.addEventListener('input', calculateMaterialTotal);
    leaseDaysInput.addEventListener('input', calculateMaterialTotal);
    materialPaidInput.addEventListener('input', calculateMaterialBalance);

    // Submit material form
    materialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const materialId = document.getElementById('material-id').value;
        const projectSelect = document.getElementById('material-project');
        const selectedProject = projects.find(p => p.id === projectSelect.value);

        if (!selectedProject && projectSelect.value !== 'all') {
            alert('Please select a valid project');
            return;
        }

        const materialData = {
            projectId: projectSelect.value,
            projectName: selectedProject ? `${selectedProject.venue} - ${selectedProject.customerName}` : '',
            materialType: document.getElementById('material-type').value,
            quantity: parseFloat(quantityInput.value) || 0,
            rate: parseFloat(materialRateInput.value) || 0,
            leaseDays: parseFloat(leaseDaysInput.value) || 0,
            totalAmount: parseFloat(materialTotalInput.value) || 0,
            paidAmount: parseFloat(materialPaidInput.value) || 0,
            balanceAmount: parseFloat(materialBalanceInput.value) || 0,
            userId: currentUser.userId,
            updatedAt: new Date().toISOString()
        };

        if (materialId) {
            db.ref('materials/' + materialId).update(materialData)
                .then(() => {
                    alert('Material updated successfully!');
                    resetMaterialForm();
                    loadAllData();
                    loadMaterialsTable();
                })
                .catch(error => {
                    console.error('Error updating material:', error);
                    alert('Error updating material. Please try again.');
                });
        } else {
            materialData.createdAt = new Date().toISOString();
            db.ref('materials').push(materialData)
                .then(() => {
                    alert('Material expense added successfully!');
                    resetMaterialForm();
                    loadAllData();
                    loadMaterialsTable();
                })
                .catch(error => {
                    console.error('Error saving material:', error);
                    alert('Error saving material. Please try again.');
                });
        }
    });

    // Cancel material form
    document.getElementById('cancel-material-btn').addEventListener('click', resetMaterialForm);

    // Table loaded by loadAllData() in dashboard.js - don't call here to avoid race condition
    // Setup material filters
    setupMaterialFilters();
});

// Reset material form
function resetMaterialForm() {
    document.getElementById('material-id').value = '';
    document.getElementById('material-project').value = 'all';
    document.getElementById('material-type').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('material-rate').value = '';
    document.getElementById('lease-days').value = '';
    document.getElementById('material-total-amount').value = '';
    document.getElementById('material-paid').value = '';
    document.getElementById('material-balance').value = '';
}

// Load materials table
function loadMaterialsTable() {
    const materialsTableBody = document.getElementById('materials-table-body');
    if (!materialsTableBody) return;

    const projectFilter = document.getElementById('material-filter-project')?.value || 'all';

    Utils.showLoading(materialsTableBody);

    let filteredMaterials = [...materials];

    // Apply project filter
    if (projectFilter !== 'all') {
        filteredMaterials = filteredMaterials.filter(m => m.projectId === projectFilter);
    }

    materialsTableBody.innerHTML = '';

    let totalExpense = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    if (filteredMaterials.length === 0) {
        Utils.showEmpty(materialsTableBody, 'No materials found');
    } else {
        filteredMaterials.forEach(material => {
            totalExpense += material.totalAmount;
            totalPaid += material.paidAmount || 0;
            totalBalance += material.balanceAmount || 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.projectName}</td>
                <td>${material.materialType.replace('-', ' ').toUpperCase()}</td>
                <td>${material.quantity}</td>
                <td>${Utils.formatCurrency(material.rate)}</td>
                <td>${material.leaseDays}</td>
                <td>${Utils.formatCurrency(material.totalAmount)}</td>
                <td>${Utils.formatCurrency(material.paidAmount || 0)}</td>
                <td>${Utils.formatCurrency(material.balanceAmount || 0)}</td>
                <td class="action-buttons">
                    <button class="btn-sm btn-primary" onclick="editMaterial('${material.id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="deleteMaterial('${material.id}')">Delete</button>
                </td>
            `;
            materialsTableBody.appendChild(row);
        });
    }

    document.getElementById('total-material-expense').textContent = Utils.formatCurrency(totalExpense);
    document.getElementById('total-material-paid').textContent = Utils.formatCurrency(totalPaid);
    document.getElementById('total-material-balance').textContent = Utils.formatCurrency(totalBalance);
}

// Edit material
window.editMaterial = function(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (material) {
        document.getElementById('material-id').value = material.id;
        document.getElementById('material-project').value = material.projectId;
        document.getElementById('material-type').value = material.materialType;
        document.getElementById('quantity').value = material.quantity;
        document.getElementById('material-rate').value = material.rate;
        document.getElementById('lease-days').value = material.leaseDays;
        document.getElementById('material-total-amount').value = material.totalAmount;
        document.getElementById('material-paid').value = material.paidAmount || 0;
        document.getElementById('material-balance').value = material.balanceAmount || 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Delete material
window.deleteMaterial = function(materialId) {
    if (confirm('Are you sure you want to delete this material expense?')) {
        db.ref('materials/' + materialId).remove()
            .then(() => {
                alert('Material expense deleted successfully!');
                loadAllData();
                loadMaterialsTable();
            })
            .catch(error => {
                console.error('Error deleting material:', error);
                alert('Error deleting material. Please try again.');
            });
    }
};

// Setup material filters
function setupMaterialFilters() {
    const projectFilter = document.getElementById('material-filter-project');
    
    if (projectFilter) {
        projectFilter.addEventListener('change', function() {
            loadMaterialsTable();
        });
    }
}