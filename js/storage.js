/**
 * Local Storage Management
 * Handles saving/loading calculator data and share link generation
 */

const StorageManager = {
    STORAGE_KEY: 'mortgage_calculator_data',

    /**
     * Save calculator data to localStorage
     */
    save(data) {
        try {
            const saveData = {
                loanData: data.loanData,
                accelerationOptions: data.accelerationOptions,
                savedAt: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            return { success: true };
        } catch (error) {
            console.error('Error saving data:', error);

            if (error.name === 'QuotaExceededError') {
                return { success: false, error: 'Storage quota exceeded. Please clear some browser data.' };
            }

            return { success: false, error: 'Failed to save data.' };
        }
    },

    /**
     * Load calculator data from localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;

            const parsed = JSON.parse(data);
            return parsed;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    },

    /**
     * Clear saved data
     */
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return { success: true };
        } catch (error) {
            console.error('Error clearing data:', error);
            return { success: false, error: 'Failed to clear data.' };
        }
    },

    /**
     * Check if data exists in storage
     */
    hasData() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    /**
     * Generate a shareable URL with loan parameters
     * Note: Does not include sensitive data, just basic loan parameters
     */
    generateShareUrl(loanData, accelerationOptions) {
        const params = new URLSearchParams();

        // Loan data (rounded to avoid exposing exact values)
        params.set('p', Math.round(loanData.principal / 1000)); // Principal in thousands
        params.set('r', loanData.annualRate.toFixed(2)); // Rate
        params.set('t', loanData.termYears); // Term
        params.set('s', loanData.startDate); // Start date

        // Acceleration options (only if set)
        if (accelerationOptions.extraMonthly > 0) {
            params.set('em', Math.round(accelerationOptions.extraMonthly));
        }
        if (accelerationOptions.biweekly) {
            params.set('bw', '1');
        }
        if (accelerationOptions.lumpSum > 0) {
            params.set('ls', Math.round(accelerationOptions.lumpSum / 1000)); // In thousands
            if (accelerationOptions.lumpSumDate) {
                params.set('lsd', accelerationOptions.lumpSumDate);
            }
        }
        if (accelerationOptions.annualExtra > 0) {
            params.set('ae', Math.round(accelerationOptions.annualExtra / 1000)); // In thousands
            params.set('aem', accelerationOptions.annualExtraMonth);
        }

        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?${params.toString()}`;
    },

    /**
     * Parse share URL parameters
     */
    parseShareUrl() {
        const params = new URLSearchParams(window.location.search);

        if (!params.has('p')) return null;

        try {
            const loanData = {
                principal: parseInt(params.get('p')) * 1000,
                annualRate: parseFloat(params.get('r')),
                termYears: parseInt(params.get('t')),
                startDate: params.get('s')
            };

            const accelerationOptions = {
                extraMonthly: parseInt(params.get('em')) || 0,
                biweekly: params.get('bw') === '1',
                lumpSum: (parseInt(params.get('ls')) || 0) * 1000,
                lumpSumDate: params.get('lsd') || '',
                annualExtra: (parseInt(params.get('ae')) || 0) * 1000,
                annualExtraMonth: parseInt(params.get('aem')) || 11
            };

            return { loanData, accelerationOptions };
        } catch (error) {
            console.error('Error parsing share URL:', error);
            return null;
        }
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return { success: true };
            }

            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            return { success: true };
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return { success: false, error: 'Failed to copy to clipboard.' };
        }
    },

    /**
     * Get saved data timestamp
     */
    getSavedTimestamp() {
        const data = this.load();
        if (data && data.savedAt) {
            return new Date(data.savedAt).toLocaleString();
        }
        return null;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
