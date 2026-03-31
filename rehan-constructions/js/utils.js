// Utility Functions
const Utils = {
    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    },

    // Format date
    formatDate: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    // Format datetime
    formatDateTime: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format timestamp for activity
    formatTimestamp: (timestamp) => {
        if (!timestamp) return 'Recently';
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return Utils.formatDate(date);
    },

    // Filter data by date range
    filterByDateRange: (data, startDate, endDate, dateField = 'date') => {
        if (!startDate && !endDate) return data;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        });
    },

    // Filter data by period
    filterByPeriod: (data, period, dateField = 'date') => {
        const now = new Date();
        let startDate, endDate = new Date(now);

        switch(period) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                return data;
        }

        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= startDate && itemDate <= endDate;
        });
    },

    // Calculate totals
    calculateTotals: (items, fields) => {
        const totals = {};
        fields.forEach(field => {
            totals[field] = items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
        });
        return totals;
    },

    // Show loading state
    showLoading: (element, message = 'Loading...', colspan = 15) => {
        if (element) {
            element.innerHTML = `<tr><td colspan="${colspan}" class="loading">${message}</td></tr>`;
        }
    },

    // Show error state
    showError: (element, message = 'Error loading data', colspan = 15) => {
        if (element) {
            element.innerHTML = `<tr><td colspan="${colspan}" class="loading" style="color: var(--danger);">${message}</td></tr>`;
        }
    },

    // Show empty state
    showEmpty: (element, message = 'No data found', colspan = 15) => {
        if (element) {
            element.innerHTML = `<tr><td colspan="${colspan}" class="loading">${message}</td></tr>`;
        }
    }
};