// Firebase Data Manager
class FirebaseDataManager {
    constructor() {
        this.listeners = [];
        this.data = {
            deals: [],
            workers: [],
            materials: [],
            pendingBalance: {
                deals: [],
                workers: [],
                materials: []
            }
        };
        this.dbRefs = {};
        this.loadingStates = {
            deals: false,
            workers: false,
            materials: false
        };
        this.errors = {
            deals: null,
            workers: null,
            materials: null
        };
    }

    // Add listener for data changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners
    notifyListeners(type, data) {
        this.listeners.forEach(callback => callback(type, data));
    }

    // Set loading state
    setLoading(type, loading) {
        this.loadingStates[type] = loading;
        this.notifyListeners('loading', { type, loading });
    }

    // Set error state
    setError(type, error) {
        this.errors[type] = error;
        this.notifyListeners('error', { type, error });
    }

    // Get loading state
    isLoading(type) {
        return this.loadingStates[type] || false;
    }

    // Get error state
    getError(type) {
        return this.errors[type];
    }

    // Initialize real-time listeners
    initListeners() {
        this.setupDealsListener();
        this.setupWorkersListener();
        this.setupMaterialsListener();
    }

    // Setup deals listener
    setupDealsListener() {
        this.setLoading('deals', true);
        this.dbRefs.deals = db.ref('deals');
        this.dbRefs.deals.on('value', (snapshot) => {
            const deals = [];
            snapshot.forEach((childSnapshot) => {
                deals.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            this.data.deals = deals;
            this.setLoading('deals', false);
            this.setError('deals', null);
            this.notifyListeners('deals', deals);
        }, (error) => {
            console.error('Error loading deals:', error);
            this.setLoading('deals', false);
            this.setError('deals', error.message);
            this.notifyListeners('error', { type: 'deals', error: error.message });
        });
    }

    // Setup workers listener
    setupWorkersListener() {
        this.setLoading('workers', true);
        this.dbRefs.workers = db.ref('workers');
        this.dbRefs.workers.on('value', (snapshot) => {
            const workers = [];
            snapshot.forEach((childSnapshot) => {
                workers.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            this.data.workers = workers;
            this.setLoading('workers', false);
            this.setError('workers', null);
            this.notifyListeners('workers', workers);
        }, (error) => {
            console.error('Error loading workers:', error);
            this.setLoading('workers', false);
            this.setError('workers', error.message);
            this.notifyListeners('error', { type: 'workers', error: error.message });
        });
    }

    // Setup materials listener
    setupMaterialsListener() {
        this.setLoading('materials', true);
        this.dbRefs.materials = db.ref('materials');
        this.dbRefs.materials.on('value', (snapshot) => {
            const materials = [];
            snapshot.forEach((childSnapshot) => {
                materials.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            this.data.materials = materials;
            this.setLoading('materials', false);
            this.setError('materials', null);
            this.notifyListeners('materials', materials);
        }, (error) => {
            console.error('Error loading materials:', error);
            this.setLoading('materials', false);
            this.setError('materials', error.message);
            this.notifyListeners('error', { type: 'materials', error: error.message });
        });
    }

    // Get all data
    getData() {
        return this.data;
    }

    // Add new deal
    async addDeal(dealData) {
        try {
            this.setLoading('deals', true);
            const dealRef = db.ref('deals').push();
            await dealRef.set({
                ...dealData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            this.setLoading('deals', false);
            return { success: true, id: dealRef.key };
        } catch (error) {
            console.error('Error adding deal:', error);
            this.setLoading('deals', false);
            this.setError('deals', error.message);
            return { success: false, error: error.message };
        }
    }

    // Update deal
    async updateDeal(dealId, dealData) {
        try {
            this.setLoading('deals', true);
            await db.ref('deals').child(dealId).update({
                ...dealData,
                updatedAt: new Date().toISOString()
            });
            this.setLoading('deals', false);
            return { success: true };
        } catch (error) {
            console.error('Error updating deal:', error);
            this.setLoading('deals', false);
            this.setError('deals', error.message);
            return { success: false, error: error.message };
        }
    }

    // Delete deal
    async deleteDeal(dealId) {
        try {
            this.setLoading('deals', true);
            await db.ref('deals').child(dealId).remove();
            this.setLoading('deals', false);
            return { success: true };
        } catch (error) {
            console.error('Error deleting deal:', error);
            this.setLoading('deals', false);
            this.setError('deals', error.message);
            return { success: false, error: error.message };
        }
    }

    // Add new worker
    async addWorker(workerData) {
        try {
            this.setLoading('workers', true);
            const workerRef = db.ref('workers').push();
            await workerRef.set({
                ...workerData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            this.setLoading('workers', false);
            return { success: true, id: workerRef.key };
        } catch (error) {
            console.error('Error adding worker:', error);
            this.setLoading('workers', false);
            this.setError('workers', error.message);
            return { success: false, error: error.message };
        }
    }

    // Update worker
    async updateWorker(workerId, workerData) {
        try {
            this.setLoading('workers', true);
            await db.ref('workers').child(workerId).update({
                ...workerData,
                updatedAt: new Date().toISOString()
            });
            this.setLoading('workers', false);
            return { success: true };
        } catch (error) {
            console.error('Error updating worker:', error);
            this.setLoading('workers', false);
            this.setError('workers', error.message);
            return { success: false, error: error.message };
        }
    }

    // Delete worker
    async deleteWorker(workerId) {
        try {
            this.setLoading('workers', true);
            await db.ref('workers').child(workerId).remove();
            this.setLoading('workers', false);
            return { success: true };
        } catch (error) {
            console.error('Error deleting worker:', error);
            this.setLoading('workers', false);
            this.setError('workers', error.message);
            return { success: false, error: error.message };
        }
    }

    // Add new material
    async addMaterial(materialData) {
        try {
            this.setLoading('materials', true);
            const materialRef = db.ref('materials').push();
            await materialRef.set({
                ...materialData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            this.setLoading('materials', false);
            return { success: true, id: materialRef.key };
        } catch (error) {
            console.error('Error adding material:', error);
            this.setLoading('materials', false);
            this.setError('materials', error.message);
            return { success: false, error: error.message };
        }
    }

    // Update material
    async updateMaterial(materialId, materialData) {
        try {
            this.setLoading('materials', true);
            await db.ref('materials').child(materialId).update({
                ...materialData,
                updatedAt: new Date().toISOString()
            });
            this.setLoading('materials', false);
            return { success: true };
        } catch (error) {
            console.error('Error updating material:', error);
            this.setLoading('materials', false);
            this.setError('materials', error.message);
            return { success: false, error: error.message };
        }
    }

    // Delete material
    async deleteMaterial(materialId) {
        try {
            this.setLoading('materials', true);
            await db.ref('materials').child(materialId).remove();
            this.setLoading('materials', false);
            return { success: true };
        } catch (error) {
            console.error('Error deleting material:', error);
            this.setLoading('materials', false);
            this.setError('materials', error.message);
            return { success: false, error: error.message };
        }
    }

    // Get pending balance data
    getPendingBalanceData() {
        const pendingDeals = this.data.deals.filter(deal => parseFloat(deal.balance) > 0);
        const pendingWorkers = this.data.workers.filter(worker => parseFloat(worker.remainingAmount) > 0);
        const pendingMaterials = this.data.materials.filter(material => parseFloat(material.balance) > 0);

        return {
            deals: pendingDeals,
            workers: pendingWorkers,
            materials: pendingMaterials
        };
    }

    // Get dashboard statistics
    getDashboardStats() {
        const totalDeals = this.data.deals.length;
        const totalWorkers = this.data.workers.length;
        const totalMaterials = this.data.materials.length;
        
        const totalRevenue = this.data.deals.reduce((sum, deal) => sum + (parseFloat(deal.projectEstimate) || 0), 0);
        const totalExpenses = this.data.workers.reduce((sum, worker) => 
            sum + (parseFloat(worker.paidAmount) || 0) + (parseFloat(worker.remainingAmount) || 0), 0) +
            this.data.materials.reduce((sum, material) => sum + (parseFloat(material.totalAmount) || 0), 0);
        
        const totalProfit = totalRevenue - totalExpenses;
        const pendingBalance = this.data.deals.reduce((sum, deal) => sum + (parseFloat(deal.balance) || 0), 0);

        return {
            totalDeals,
            totalWorkers,
            totalMaterials,
            totalRevenue,
            totalExpenses,
            totalProfit,
            pendingBalance
        };
    }

    // Get recent activity
    getRecentActivity(limit = 10) {
        const activities = [];
        
        // Add deal activities
        this.data.deals.forEach(deal => {
            activities.push({
                type: 'deal',
                title: `New Deal: ${deal.venue}`,
                description: `Customer: ${deal.customerName}`,
                timestamp: deal.createdAt || deal.updatedAt,
                icon: 'fa-handshake',
                color: 'primary'
            });
        });

        // Add worker activities
        this.data.workers.forEach(worker => {
            activities.push({
                type: 'worker',
                title: `Worker Payment: ${worker.workerName}`,
                description: `Project: ${worker.project}`,
                timestamp: worker.createdAt || worker.updatedAt,
                icon: 'fa-users',
                color: 'success'
            });
        });

        // Add material activities
        this.data.materials.forEach(material => {
            activities.push({
                type: 'material',
                title: `Material Expense: ${material.materialType}`,
                description: `Project: ${material.project}`,
                timestamp: material.createdAt || material.updatedAt,
                icon: 'fa-tools',
                color: 'warning'
            });
        });

        // Sort by timestamp and limit
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Cleanup listeners
    cleanup() {
        Object.values(this.dbRefs).forEach(ref => {
            ref.off();
        });
        this.listeners = [];
    }
}