/**
 * Chart rendering using Canvas API
 * No external dependencies - pure JavaScript
 */

const ChartRenderer = {
    colors: {
        primary: '#f97316',
        primaryLight: '#fb923c',
        secondary: '#64748b',
        success: '#f97316',
        successLight: '#fb923c',
        gray: '#94a3b8',
        grayLight: '#e2e8f0',
        white: '#ffffff'
    },

    /**
     * Initialize a canvas context with proper scaling for retina displays
     */
    initCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Get the size from CSS
        const rect = canvas.getBoundingClientRect();

        // Set actual size in memory
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Set display size
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        // Scale context to account for retina
        ctx.scale(dpr, dpr);

        return { canvas, ctx, width: rect.width, height: rect.height };
    },

    /**
     * Clear canvas
     */
    clearCanvas(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
    },

    /**
     * Draw balance over time chart (line chart)
     */
    drawBalanceChart(canvasId, originalSchedule, acceleratedSchedule) {
        const setup = this.initCanvas(canvasId);
        if (!setup) return;

        const { ctx, width, height } = setup;
        this.clearCanvas(ctx, width, height);

        const padding = { top: 30, right: 30, bottom: 50, left: 70 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Get data points (sample every nth point for performance)
        const maxPoints = 60;
        const originalData = this.sampleData(originalSchedule, maxPoints);
        const acceleratedData = this.sampleData(acceleratedSchedule, maxPoints);

        // Calculate scales
        const maxBalance = originalSchedule[0]?.balance || 0;
        const maxPayments = originalSchedule.length;

        const xScale = chartWidth / maxPayments;
        const yScale = chartHeight / maxBalance;

        // Draw grid lines
        ctx.strokeStyle = this.colors.grayLight;
        ctx.lineWidth = 1;

        // Horizontal grid lines
        const yGridLines = 5;
        for (let i = 0; i <= yGridLines; i++) {
            const y = padding.top + (i * chartHeight / yGridLines);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxBalance - (i * maxBalance / yGridLines);
            ctx.fillStyle = this.colors.secondary;
            ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(this.formatCompactCurrency(value), padding.left - 10, y + 4);
        }

        // X-axis labels
        const xLabels = 6;
        for (let i = 0; i <= xLabels; i++) {
            const x = padding.left + (i * chartWidth / xLabels);
            const paymentNum = Math.round(i * maxPayments / xLabels);
            const years = Math.round(paymentNum / 12);

            ctx.fillStyle = this.colors.secondary;
            ctx.textAlign = 'center';
            ctx.fillText(`Year ${years}`, x, height - padding.bottom + 20);
        }

        // Draw original line
        ctx.strokeStyle = this.colors.gray;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        this.drawLine(ctx, originalData, padding, xScale, yScale, chartHeight);

        // Draw accelerated line
        ctx.strokeStyle = this.colors.success;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        this.drawLine(ctx, acceleratedData, padding, xScale, yScale, chartHeight);

        // Draw legend
        this.drawLegend(ctx, width, padding, [
            { color: this.colors.gray, label: 'Original', dashed: true },
            { color: this.colors.success, label: 'Accelerated', dashed: false }
        ]);
    },

    /**
     * Draw a line on the chart
     */
    drawLine(ctx, data, padding, xScale, yScale, chartHeight) {
        if (data.length === 0) return;

        ctx.beginPath();
        data.forEach((point, i) => {
            const x = padding.left + (point.paymentNumber * xScale);
            const y = padding.top + chartHeight - (point.balance * yScale);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    },

    /**
     * Draw comparison bar chart
     */
    drawComparisonChart(canvasId, originalResult, acceleratedResult) {
        const setup = this.initCanvas(canvasId);
        if (!setup) return;

        const { ctx, width, height } = setup;
        this.clearCanvas(ctx, width, height);

        const padding = { top: 40, right: 30, bottom: 60, left: 30 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const barWidth = chartWidth / 6;
        const gap = barWidth / 2;

        // Data for bars
        const data = [
            {
                label: 'Total Interest',
                original: originalResult.totalInterest,
                accelerated: acceleratedResult.totalInterest
            },
            {
                label: 'Total Payments',
                original: originalResult.totalPayments,
                accelerated: acceleratedResult.totalPayments
            }
        ];

        // Draw interest comparison
        const maxInterest = originalResult.totalInterest;
        const interestScale = (chartHeight - 30) / maxInterest;

        // Original interest bar
        const x1 = padding.left + gap;
        const h1 = data[0].original * interestScale;
        ctx.fillStyle = this.colors.gray;
        ctx.fillRect(x1, padding.top + chartHeight - h1, barWidth, h1);

        // Accelerated interest bar
        const x2 = x1 + barWidth + gap / 2;
        const h2 = data[0].accelerated * interestScale;
        ctx.fillStyle = this.colors.success;
        ctx.fillRect(x2, padding.top + chartHeight - h2, barWidth, h2);

        // Labels for interest
        ctx.fillStyle = this.colors.secondary;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Original', x1 + barWidth / 2, height - padding.bottom + 15);
        ctx.fillText('Accelerated', x2 + barWidth / 2, height - padding.bottom + 15);
        ctx.fillText('Total Interest', (x1 + x2 + barWidth) / 2, height - padding.bottom + 35);

        // Value labels on bars (position above bar if too short)
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        const minBarHeight = 35;

        // Original interest label
        ctx.fillStyle = this.colors.white;
        ctx.fillText(this.formatCompactCurrency(data[0].original), x1 + barWidth / 2, padding.top + chartHeight - h1 + 20);

        // Accelerated interest label - above bar if too short
        if (h2 < minBarHeight) {
            ctx.fillStyle = this.colors.secondary;
            ctx.fillText(this.formatCompactCurrency(data[0].accelerated), x2 + barWidth / 2, padding.top + chartHeight - h2 - 10);
        } else {
            ctx.fillStyle = this.colors.white;
            ctx.fillText(this.formatCompactCurrency(data[0].accelerated), x2 + barWidth / 2, padding.top + chartHeight - h2 + 20);
        }

        // Draw payments comparison
        const maxPayments = originalResult.totalPayments;
        const paymentsScale = (chartHeight - 30) / maxPayments;

        // Original payments bar
        const x3 = width / 2 + gap;
        const h3 = data[1].original * paymentsScale;
        ctx.fillStyle = this.colors.gray;
        ctx.fillRect(x3, padding.top + chartHeight - h3, barWidth, h3);

        // Accelerated payments bar
        const x4 = x3 + barWidth + gap / 2;
        const h4 = data[1].accelerated * paymentsScale;
        ctx.fillStyle = this.colors.success;
        ctx.fillRect(x4, padding.top + chartHeight - h4, barWidth, h4);

        // Labels for payments
        ctx.fillStyle = this.colors.secondary;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Original', x3 + barWidth / 2, height - padding.bottom + 15);
        ctx.fillText('Accelerated', x4 + barWidth / 2, height - padding.bottom + 15);
        ctx.fillText('# of Payments', (x3 + x4 + barWidth) / 2, height - padding.bottom + 35);

        // Value labels on bars (position above bar if too short)
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';

        // Original payments label
        ctx.fillStyle = this.colors.white;
        ctx.fillText(data[1].original, x3 + barWidth / 2, padding.top + chartHeight - h3 + 20);

        // Accelerated payments label - above bar if too short
        if (h4 < minBarHeight) {
            ctx.fillStyle = this.colors.secondary;
            ctx.fillText(data[1].accelerated, x4 + barWidth / 2, padding.top + chartHeight - h4 - 10);
        } else {
            ctx.fillStyle = this.colors.white;
            ctx.fillText(data[1].accelerated, x4 + barWidth / 2, padding.top + chartHeight - h4 + 20);
        }

        // Title
        ctx.fillStyle = this.colors.secondary;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Original vs Accelerated Comparison', width / 2, 20);
    },

    /**
     * Draw payment breakdown pie chart
     */
    drawBreakdownChart(canvasId, originalResult, acceleratedResult, loanAmount) {
        const setup = this.initCanvas(canvasId);
        if (!setup) return;

        const { ctx, width, height } = setup;
        this.clearCanvas(ctx, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        // Calculate totals
        const totalOriginal = loanAmount + originalResult.totalInterest;
        const principalPercent = (loanAmount / totalOriginal) * 100;
        const interestOriginalPercent = (originalResult.totalInterest / totalOriginal) * 100;

        const interestSaved = originalResult.totalInterest - acceleratedResult.totalInterest;
        const interestPaidPercent = (acceleratedResult.totalInterest / totalOriginal) * 100;
        const savedPercent = (interestSaved / totalOriginal) * 100;

        // Draw pie slices
        let currentAngle = -Math.PI / 2;

        // Principal (blue)
        const principalAngle = (principalPercent / 100) * 2 * Math.PI;
        this.drawPieSlice(ctx, centerX, centerY, radius, currentAngle, currentAngle + principalAngle, this.colors.primary);
        currentAngle += principalAngle;

        // Interest paid (gray)
        const interestPaidAngle = (interestPaidPercent / 100) * 2 * Math.PI;
        this.drawPieSlice(ctx, centerX, centerY, radius, currentAngle, currentAngle + interestPaidAngle, this.colors.gray);
        currentAngle += interestPaidAngle;

        // Interest saved (green)
        const savedAngle = (savedPercent / 100) * 2 * Math.PI;
        this.drawPieSlice(ctx, centerX, centerY, radius, currentAngle, currentAngle + savedAngle, this.colors.success);

        // Draw center circle (donut hole)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = this.colors.white;
        ctx.fill();

        // Center text
        ctx.fillStyle = this.colors.secondary;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Total Cost', centerX, centerY - 10);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(this.formatCompactCurrency(loanAmount + acceleratedResult.totalInterest), centerX, centerY + 15);

        // Legend
        const legendY = height - 40;
        const legendItems = [
            { color: this.colors.primary, label: `Principal: ${this.formatCompactCurrency(loanAmount)}` },
            { color: this.colors.gray, label: `Interest Paid: ${this.formatCompactCurrency(acceleratedResult.totalInterest)}` },
            { color: this.colors.success, label: `Interest Saved: ${this.formatCompactCurrency(interestSaved)}` }
        ];

        const legendWidth = 150;
        const startX = (width - legendWidth * 3) / 2;

        legendItems.forEach((item, i) => {
            const x = startX + i * legendWidth;

            ctx.fillStyle = item.color;
            ctx.fillRect(x, legendY, 12, 12);

            ctx.fillStyle = this.colors.secondary;
            ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + 18, legendY + 10);
        });
    },

    /**
     * Draw a pie slice
     */
    drawPieSlice(ctx, x, y, radius, startAngle, endAngle, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    /**
     * Draw legend
     */
    drawLegend(ctx, width, padding, items) {
        const legendY = padding.top - 10;
        const itemWidth = 100;
        const startX = width - padding.right - (items.length * itemWidth);

        items.forEach((item, i) => {
            const x = startX + i * itemWidth;

            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.setLineDash(item.dashed ? [5, 5] : []);
            ctx.beginPath();
            ctx.moveTo(x, legendY);
            ctx.lineTo(x + 20, legendY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = this.colors.secondary;
            ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + 25, legendY + 4);
        });
    },

    /**
     * Sample data for performance (reduce number of points)
     */
    sampleData(schedule, maxPoints) {
        if (schedule.length <= maxPoints) return schedule;

        const step = Math.ceil(schedule.length / maxPoints);
        const sampled = [];

        for (let i = 0; i < schedule.length; i += step) {
            sampled.push(schedule[i]);
        }

        // Always include the last point
        if (sampled[sampled.length - 1] !== schedule[schedule.length - 1]) {
            sampled.push(schedule[schedule.length - 1]);
        }

        return sampled;
    },

    /**
     * Format currency in compact form (e.g., $150K)
     */
    formatCompactCurrency(value) {
        if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K';
        }
        return '$' + Math.round(value);
    },

    /**
     * Handle window resize
     */
    handleResize(callback) {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(callback, 250);
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartRenderer;
}
