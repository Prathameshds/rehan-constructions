/* ===========================
   UTILITY FUNCTIONS
   js/utils.js
   =========================== */
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    },

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Recently';
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return this.formatDate(date);
    },

    filterByDateRange(data, startDate, endDate, dateField = 'date') {
        if (!startDate && !endDate) return data;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        return data.filter(item => {
            const d = new Date(item[dateField]);
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
        });
    },

    filterByPeriod(data, period, dateField = 'date') {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'week': startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
            case 'month': startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); break;
            case 'year': startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
            default: return data;
        }
        return data.filter(item => new Date(item[dateField]) >= startDate);
    },

    showLoading(element, message = 'Loading...', colspan = 15) {
        if (element) element.innerHTML = `<tr><td colspan="${colspan}" class="loading"><i class="fas fa-spinner fa-spin"></i> ${message}</td></tr>`;
    },

    showError(element, message = 'Error loading data', colspan = 15) {
        if (element) element.innerHTML = `<tr><td colspan="${colspan}" class="loading" style="color:var(--color-red)"><i class="fas fa-exclamation-circle"></i> ${message}</td></tr>`;
    },

    showEmpty(element, message = 'No data found', colspan = 15) {
        if (element) element.innerHTML = `<tr><td colspan="${colspan}" class="loading"><i class="fas fa-inbox"></i> ${message}</td></tr>`;
    }
};