/**
 * Export functionality for CSV and PDF generation
 */

const ExportManager = {
    /**
     * Export amortization schedule to CSV
     */
    exportToCSV(schedule, filename = 'amortization-schedule.csv') {
        const headers = [
            'Payment #',
            'Date',
            'Payment',
            'Principal',
            'Interest',
            'Extra Payment',
            'Balance',
            'Cumulative Interest'
        ];

        const rows = schedule.map(row => [
            row.paymentNumber,
            row.date,
            row.payment.toFixed(2),
            row.principal.toFixed(2),
            row.interest.toFixed(2),
            row.extraPayment.toFixed(2),
            row.balance.toFixed(2),
            row.cumulativeInterest.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv');
    },

    /**
     * Export summary report to PDF (using browser print)
     */
    exportToPDF(summaryData, loanData, accelerationOptions) {
        // Create a printable HTML document
        const printContent = this.generatePrintableHTML(summaryData, loanData, accelerationOptions);

        // Open in new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = function() {
            printWindow.print();
        };
    },

    /**
     * Generate printable HTML for PDF export
     */
    generatePrintableHTML(summaryData, loanData, accelerationOptions) {
        const formatCurrency = (val) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(val);
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            const [year, month] = dateStr.split('-');
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        };

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Mortgage Payoff Report</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        h2 {
            color: #334155;
            margin: 30px 0 15px;
            font-size: 1.25rem;
        }
        .date {
            color: #64748b;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.highlight {
            background: #eff6ff;
            border: 2px solid #2563eb;
        }
        .summary-card.success {
            background: #f0fdf4;
            border: 2px solid #16a34a;
        }
        .summary-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
        }
        .summary-card.highlight .summary-value { color: #2563eb; }
        .summary-card.success .summary-value { color: #16a34a; }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-label { color: #64748b; }
        .detail-value { font-weight: 600; }
        .disclaimer {
            margin-top: 40px;
            padding: 15px;
            background: #fef3c7;
            border-radius: 8px;
            font-size: 0.875rem;
            color: #92400e;
        }
        .disclaimer strong { display: block; margin-bottom: 5px; }
        @media print {
            body { padding: 20px; }
            .summary-card { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>Mortgage Payoff Report</h1>
    <p class="date">Generated on ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}</p>

    <h2>Summary</h2>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-label">Original Payoff Date</div>
            <div class="summary-value">${formatDate(summaryData.originalPayoffDate)}</div>
        </div>
        <div class="summary-card highlight">
            <div class="summary-label">New Payoff Date</div>
            <div class="summary-value">${formatDate(summaryData.acceleratedPayoffDate)}</div>
        </div>
        <div class="summary-card success">
            <div class="summary-label">Time Saved</div>
            <div class="summary-value">${summaryData.timeSaved}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Monthly Payment</div>
            <div class="summary-value">${formatCurrency(summaryData.monthlyPayment)}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Original Interest</div>
            <div class="summary-value">${formatCurrency(summaryData.originalInterest)}</div>
        </div>
        <div class="summary-card success">
            <div class="summary-label">Interest Saved</div>
            <div class="summary-value">${formatCurrency(summaryData.interestSaved)}</div>
        </div>
    </div>

    <h2>Loan Details</h2>
    <div class="detail-row">
        <span class="detail-label">Loan Amount</span>
        <span class="detail-value">${formatCurrency(loanData.principal)}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Interest Rate</span>
        <span class="detail-value">${loanData.annualRate}%</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Loan Term</span>
        <span class="detail-value">${loanData.termYears} years</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Start Date</span>
        <span class="detail-value">${formatDate(loanData.startDate)}</span>
    </div>

    <h2>Acceleration Strategy</h2>
    ${accelerationOptions.extraMonthly > 0 ? `
    <div class="detail-row">
        <span class="detail-label">Extra Monthly Payment</span>
        <span class="detail-value">${formatCurrency(accelerationOptions.extraMonthly)}</span>
    </div>
    ` : ''}
    ${accelerationOptions.biweekly ? `
    <div class="detail-row">
        <span class="detail-label">Payment Frequency</span>
        <span class="detail-value">Bi-Weekly</span>
    </div>
    ` : ''}
    ${accelerationOptions.lumpSum > 0 ? `
    <div class="detail-row">
        <span class="detail-label">One-Time Lump Sum</span>
        <span class="detail-value">${formatCurrency(accelerationOptions.lumpSum)} (${formatDate(accelerationOptions.lumpSumDate)})</span>
    </div>
    ` : ''}
    ${accelerationOptions.annualExtra > 0 ? `
    <div class="detail-row">
        <span class="detail-label">Annual Extra Payment</span>
        <span class="detail-value">${formatCurrency(accelerationOptions.annualExtra)}</span>
    </div>
    ` : ''}
    ${!accelerationOptions.extraMonthly && !accelerationOptions.biweekly &&
      !accelerationOptions.lumpSum && !accelerationOptions.annualExtra ? `
    <div class="detail-row">
        <span class="detail-label">Strategy</span>
        <span class="detail-value">No acceleration applied</span>
    </div>
    ` : ''}

    <div class="disclaimer">
        <strong>Disclaimer</strong>
        This report provides estimates for educational purposes only. Actual loan terms,
        payments, and payoff dates may vary based on your specific loan agreement,
        lender policies, and other factors. Consult with a qualified financial advisor
        before making financial decisions.
    </div>
</body>
</html>
        `;
    },

    /**
     * Download a file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    },

    /**
     * Export schedule data as JSON (for backup/restore)
     */
    exportToJSON(data, filename = 'mortgage-data.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}
