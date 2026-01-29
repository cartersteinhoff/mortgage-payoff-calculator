/**
 * Main Application Logic - Multi-Step Wizard
 */

(function() {
    'use strict';

    // Application State
    const state = {
        currentStep: 1,
        loanData: null,
        accelerationOptions: null,
        originalResult: null,
        acceleratedResult: null,
        currentPage: 1,
        rowsPerPage: 12,
        showAccelerated: true
    };

    // DOM Elements
    const elements = {
        form: document.getElementById('calculator-form'),
        steps: document.querySelectorAll('.stepper .step'),
        connectors: document.querySelectorAll('.step-connector'),
        wizardSteps: document.querySelectorAll('.wizard-step'),

        // Step 1
        loanAmount: document.getElementById('loan-amount'),
        interestRate: document.getElementById('interest-rate'),
        loanTerm: document.getElementById('loan-term'),
        startMonth: document.getElementById('start-month'),
        startYear: document.getElementById('start-year'),
        previewPayment: document.getElementById('preview-payment'),
        previewInterest: document.getElementById('preview-interest'),
        previewPayoff: document.getElementById('preview-payoff'),

        // Step 2
        enableExtraMonthly: document.getElementById('enable-extra-monthly'),
        extraMonthly: document.getElementById('extra-monthly'),
        biweekly: document.getElementById('biweekly'),
        enableLumpSum: document.getElementById('enable-lump-sum'),
        lumpSum: document.getElementById('lump-sum'),
        lumpSumMonth: document.getElementById('lump-sum-month'),
        lumpSumYear: document.getElementById('lump-sum-year'),
        enableAnnualExtra: document.getElementById('enable-annual-extra'),
        annualExtra: document.getElementById('annual-extra'),
        annualExtraMonth: document.getElementById('annual-extra-month'),
        strategySummary: document.getElementById('strategy-summary'),

        // Step 3
        resultInterestSaved: document.getElementById('result-interest-saved'),
        resultTimeSaved: document.getElementById('result-time-saved'),
        originalPayoffDate: document.getElementById('original-payoff-date'),
        originalInterest: document.getElementById('original-interest'),
        originalPayments: document.getElementById('original-payments'),
        newPayoffDate: document.getElementById('new-payoff-date'),
        newInterest: document.getElementById('new-interest'),
        newPayments: document.getElementById('new-payments'),

        // Table & Actions
        showAccelerated: document.getElementById('show-accelerated'),
        amortizationBody: document.getElementById('amortization-body'),
        prevPage: document.getElementById('prev-page'),
        nextPage: document.getElementById('next-page'),
        pageInfo: document.getElementById('page-info'),
        exportCsv: document.getElementById('export-csv'),
        exportPdf: document.getElementById('export-pdf'),
        saveBtn: document.getElementById('save-btn'),
        shareBtn: document.getElementById('share-btn'),
        startOverBtn: document.getElementById('start-over-btn'),
        shareNote: document.getElementById('share-note'),
        confetti: document.getElementById('confetti')
    };

    /**
     * Initialize the application
     */
    function init() {
        setDefaultStartDate();
        setupEventListeners();
        setupStrategyCards();
        setupChartTabs();
        loadFromUrl();
        setupInputFormatting();
        setupLivePreview();
    }

    /**
     * Set default start date to current month
     */
    function setDefaultStartDate() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

        // Populate year dropdowns
        // Start date: past 30 years up to current year (no future years for start date)
        populateYearDropdown(elements.startYear, currentYear - 30, currentYear, currentYear);
        // Lump sum: current year to 10 years in future
        populateYearDropdown(elements.lumpSumYear, currentYear, currentYear + 10, currentYear + 1);

        // Set current month
        elements.startMonth.value = currentMonth;

        // Set lump sum default to next year same month
        elements.lumpSumMonth.value = currentMonth;
    }

    /**
     * Populate a year dropdown
     */
    function populateYearDropdown(select, startYear, endYear, selectedYear) {
        select.innerHTML = '';
        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === selectedYear) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }

    /**
     * Get start date from dropdowns
     */
    function getStartDate() {
        const month = elements.startMonth.value;
        const year = elements.startYear.value;
        if (month && year) {
            return `${year}-${month}`;
        }
        return null;
    }

    /**
     * Get lump sum date from dropdowns
     */
    function getLumpSumDate() {
        const month = elements.lumpSumMonth.value;
        const year = elements.lumpSumYear.value;
        if (month && year) {
            return `${year}-${month}`;
        }
        return '';
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => {
                const nextStep = parseInt(btn.dataset.next);
                if (validateCurrentStep()) {
                    goToStep(nextStep);
                }
            });
        });

        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => {
                const prevStep = parseInt(btn.dataset.prev);
                goToStep(prevStep);
            });
        });

        // Form submission
        elements.form.addEventListener('submit', handleSubmit);

        // Results actions
        elements.showAccelerated?.addEventListener('change', handleToggleSchedule);
        elements.prevPage?.addEventListener('click', () => changePage(-1));
        elements.nextPage?.addEventListener('click', () => changePage(1));
        elements.exportCsv?.addEventListener('click', handleExportCsv);
        elements.exportPdf?.addEventListener('click', handleExportPdf);
        elements.saveBtn?.addEventListener('click', handleSave);
        elements.shareBtn?.addEventListener('click', handleShare);
        elements.startOverBtn?.addEventListener('click', handleStartOver);

        // Chart resize
        ChartRenderer.handleResize(() => {
            if (state.originalResult && state.acceleratedResult) {
                renderActiveChart();
            }
        });
    }

    /**
     * Setup strategy card toggles
     */
    function setupStrategyCards() {
        const strategyCards = document.querySelectorAll('.strategy-card');

        strategyCards.forEach(card => {
            const toggle = card.querySelector('.toggle-input');
            const toggleLabel = card.querySelector('.toggle-label');
            const inputSection = card.querySelector('.strategy-input');

            if (toggle) {
                // Toggle on card click (but not on input fields)
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.strategy-input') &&
                        !e.target.closest('.toggle-label') &&
                        !e.target.closest('.strategy-toggle')) {
                        toggle.checked = !toggle.checked;
                        toggle.dispatchEvent(new Event('change'));
                    }
                });

                // Toggle on label/toggle area click
                if (toggleLabel) {
                    toggleLabel.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle.checked = !toggle.checked;
                        toggle.dispatchEvent(new Event('change'));
                    });
                }

                // Handle toggle change
                toggle.addEventListener('change', () => {
                    card.classList.toggle('active', toggle.checked);
                    if (inputSection) {
                        inputSection.hidden = !toggle.checked;
                    }
                    updateStrategySummary();
                });
            }
        });
    }

    /**
     * Update strategy summary text
     */
    function updateStrategySummary() {
        const activeStrategies = [];

        if (elements.enableExtraMonthly?.checked) activeStrategies.push('Extra Monthly');
        if (elements.biweekly?.checked) activeStrategies.push('Bi-Weekly');
        if (elements.enableLumpSum?.checked) activeStrategies.push('Lump Sum');
        if (elements.enableAnnualExtra?.checked) activeStrategies.push('Annual Extra');

        const summaryText = elements.strategySummary.querySelector('.summary-text');
        const summaryIcon = elements.strategySummary.querySelector('.summary-icon');

        if (activeStrategies.length === 0) {
            summaryIcon.textContent = '✨';
            summaryText.textContent = 'Select at least one strategy to see your potential savings';
        } else {
            summaryIcon.textContent = '🚀';
            summaryText.textContent = `Active strategies: ${activeStrategies.join(', ')}`;
        }
    }

    /**
     * Setup chart tab navigation
     */
    function setupChartTabs() {
        const tabs = document.querySelectorAll('.chart-tab');
        const panels = document.querySelectorAll('.chart-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const chartType = tab.dataset.chart;

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                panels.forEach(panel => {
                    panel.classList.toggle('active', panel.id === `chart-${chartType}`);
                });

                if (state.originalResult && state.acceleratedResult) {
                    renderChart(chartType);
                }
            });
        });
    }

    /**
     * Setup input formatting
     */
    function setupInputFormatting() {
        const currencyInputs = [
            elements.loanAmount,
            elements.extraMonthly,
            elements.lumpSum,
            elements.annualExtra
        ];

        currencyInputs.forEach(input => {
            if (!input) return;

            input.addEventListener('blur', function() {
                const value = MortgageCalculator.parseCurrency(this.value);
                if (value > 0) {
                    this.value = value.toLocaleString();
                }
            });

            input.addEventListener('focus', function() {
                const value = MortgageCalculator.parseCurrency(this.value);
                if (value > 0) {
                    this.value = value;
                } else {
                    this.value = '';
                }
            });
        });

        elements.interestRate?.addEventListener('blur', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value > 0) {
                this.value = value.toFixed(3).replace(/\.?0+$/, '');
            }
        });
    }

    /**
     * Setup live preview for step 1
     */
    function setupLivePreview() {
        const inputs = [
            elements.loanAmount,
            elements.interestRate,
            elements.loanTerm,
            elements.startMonth,
            elements.startYear
        ];

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', updateLivePreview);
                input.addEventListener('change', updateLivePreview);
            }
        });
    }

    /**
     * Update live preview calculations
     */
    function updateLivePreview() {
        const principal = MortgageCalculator.parseCurrency(elements.loanAmount.value);
        const rate = parseFloat(elements.interestRate.value);
        const term = parseInt(elements.loanTerm.value);
        const startDate = getStartDate();

        if (principal > 0 && rate > 0 && term > 0 && startDate) {
            const monthlyPayment = MortgageCalculator.calculateMonthlyPayment(principal, rate, term);
            const totalPayments = term * 12;
            const totalPaid = monthlyPayment * totalPayments;
            const totalInterest = totalPaid - principal;

            const payoffDate = new Date(startDate + '-01');
            payoffDate.setMonth(payoffDate.getMonth() + totalPayments);

            elements.previewPayment.textContent = MortgageCalculator.formatCurrency(monthlyPayment);
            elements.previewInterest.textContent = MortgageCalculator.formatCurrency(totalInterest);
            elements.previewPayoff.textContent = MortgageCalculator.formatDateDisplay(
                MortgageCalculator.formatDate(payoffDate)
            );
        } else {
            elements.previewPayment.textContent = '$--';
            elements.previewInterest.textContent = '$--';
            elements.previewPayoff.textContent = '--';
        }
    }

    /**
     * Navigate to a specific step
     */
    function goToStep(stepNumber) {
        // Update stepper UI
        elements.steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');

            if (stepNum < stepNumber) {
                step.classList.add('completed');
            } else if (stepNum === stepNumber) {
                step.classList.add('active');
            }
        });

        // Update connectors
        elements.connectors.forEach((connector, index) => {
            const progress = connector.querySelector('.connector-progress');
            if (index + 1 < stepNumber) {
                progress.style.width = '100%';
            } else {
                progress.style.width = '0';
            }
        });

        // Update wizard steps
        elements.wizardSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === stepNumber);
        });

        state.currentStep = stepNumber;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Validate current step before proceeding
     */
    function validateCurrentStep() {
        if (state.currentStep === 1) {
            return validateStep1();
        }
        return true;
    }

    /**
     * Validate step 1 inputs
     */
    function validateStep1() {
        clearErrors();
        let isValid = true;

        const validation = MortgageCalculator.validateLoanData({
            principal: MortgageCalculator.parseCurrency(elements.loanAmount.value),
            annualRate: parseFloat(elements.interestRate.value),
            termYears: parseInt(elements.loanTerm.value),
            startDate: getStartDate()
        });

        if (!validation.isValid) {
            Object.entries(validation.errors).forEach(([field, message]) => {
                const errorId = field.replace(/([A-Z])/g, '-$1').toLowerCase() + '-error';
                const errorEl = document.getElementById(errorId);
                if (errorEl) {
                    errorEl.textContent = message;
                    isValid = false;
                }
            });
        }

        return isValid;
    }

    /**
     * Clear all error messages
     */
    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }

    /**
     * Handle form submission
     */
    function handleSubmit(e) {
        e.preventDefault();

        // Gather loan data
        state.loanData = {
            principal: MortgageCalculator.parseCurrency(elements.loanAmount.value),
            annualRate: parseFloat(elements.interestRate.value),
            termYears: parseInt(elements.loanTerm.value),
            startDate: getStartDate()
        };

        // Gather acceleration options
        state.accelerationOptions = {
            extraMonthly: elements.enableExtraMonthly?.checked ?
                MortgageCalculator.parseCurrency(elements.extraMonthly.value) : 0,
            biweekly: elements.biweekly?.checked || false,
            lumpSum: elements.enableLumpSum?.checked ?
                MortgageCalculator.parseCurrency(elements.lumpSum.value) : 0,
            lumpSumDate: getLumpSumDate(),
            annualExtra: elements.enableAnnualExtra?.checked ?
                MortgageCalculator.parseCurrency(elements.annualExtra.value) : 0,
            annualExtraMonth: parseInt(elements.annualExtraMonth?.value || 11)
        };

        // Calculate results
        calculateResults();

        // Go to results step
        goToStep(3);

        // Trigger confetti animation
        triggerConfetti();
    }

    /**
     * Calculate and display results
     */
    function calculateResults() {
        state.originalResult = MortgageCalculator.generateOriginalSchedule(state.loanData);
        state.acceleratedResult = MortgageCalculator.generateAcceleratedSchedule(
            state.loanData,
            state.accelerationOptions
        );

        const savings = MortgageCalculator.calculateSavings(
            state.originalResult,
            state.acceleratedResult
        );

        displayResults(savings);
    }

    /**
     * Display calculation results
     */
    function displayResults(savings) {
        // Hero section
        animateValue(elements.resultInterestSaved, savings.interestSaved, true);
        elements.resultTimeSaved.textContent = savings.timeSavedText;

        // Original plan
        elements.originalPayoffDate.textContent =
            MortgageCalculator.formatDateDisplay(state.originalResult.payoffDate);
        elements.originalInterest.textContent =
            MortgageCalculator.formatCurrency(state.originalResult.totalInterest);
        elements.originalPayments.textContent = state.originalResult.totalPayments;

        // Accelerated plan
        elements.newPayoffDate.textContent =
            MortgageCalculator.formatDateDisplay(state.acceleratedResult.payoffDate);
        elements.newInterest.textContent =
            MortgageCalculator.formatCurrency(state.acceleratedResult.totalInterest);
        elements.newPayments.textContent = state.acceleratedResult.totalPayments;

        // Render charts
        setTimeout(() => {
            renderActiveChart();
        }, 100);

        // Render table
        state.currentPage = 1;
        renderAmortizationTable();
    }

    /**
     * Animate a value counting up
     */
    function animateValue(element, targetValue, isCurrency = false) {
        const duration = 1000;
        const startTime = performance.now();
        const startValue = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (targetValue - startValue) * easeOut;

            if (isCurrency) {
                element.textContent = MortgageCalculator.formatCurrency(Math.round(currentValue));
            } else {
                element.textContent = Math.round(currentValue);
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Trigger confetti animation
     */
    function triggerConfetti() {
        const colors = ['#f97316', '#fb923c', '#f59e0b', '#fbbf24', '#fcd34d'];
        const confettiContainer = elements.confetti;

        confettiContainer.innerHTML = '';

        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            confettiContainer.appendChild(piece);
        }

        // Clean up after animation
        setTimeout(() => {
            confettiContainer.innerHTML = '';
        }, 4000);
    }

    /**
     * Render the currently active chart
     */
    function renderActiveChart() {
        const activeTab = document.querySelector('.chart-tab.active');
        const chartType = activeTab?.dataset.chart || 'balance';
        renderChart(chartType);
    }

    /**
     * Render a specific chart
     */
    function renderChart(chartType) {
        const canvas = document.getElementById(`${chartType}-chart`);
        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '300px';
        }

        switch (chartType) {
            case 'balance':
                ChartRenderer.drawBalanceChart(
                    'balance-chart',
                    state.originalResult.schedule,
                    state.acceleratedResult.schedule
                );
                break;
            case 'comparison':
                ChartRenderer.drawComparisonChart(
                    'comparison-chart',
                    state.originalResult,
                    state.acceleratedResult
                );
                break;
            case 'breakdown':
                ChartRenderer.drawBreakdownChart(
                    'breakdown-chart',
                    state.originalResult,
                    state.acceleratedResult,
                    state.loanData.principal
                );
                break;
        }
    }

    /**
     * Render amortization table with pagination
     */
    function renderAmortizationTable() {
        const schedule = state.showAccelerated ?
            state.acceleratedResult.schedule :
            state.originalResult.schedule;

        const totalPages = Math.ceil(schedule.length / state.rowsPerPage);
        const start = (state.currentPage - 1) * state.rowsPerPage;
        const end = start + state.rowsPerPage;
        const pageData = schedule.slice(start, end);

        elements.amortizationBody.innerHTML = '';

        pageData.forEach(row => {
            const tr = document.createElement('tr');

            if (row.extraPayment > 0) {
                tr.classList.add('extra-payment');
            }

            if (row.balance < 0.01) {
                tr.classList.add('paid-off');
            }

            tr.innerHTML = `
                <td>${row.paymentNumber}</td>
                <td>${MortgageCalculator.formatDateDisplay(row.date)}</td>
                <td>${MortgageCalculator.formatCurrencyPrecise(row.payment)}</td>
                <td>${MortgageCalculator.formatCurrencyPrecise(row.principal)}</td>
                <td>${MortgageCalculator.formatCurrencyPrecise(row.interest)}</td>
                <td>${row.extraPayment > 0 ? MortgageCalculator.formatCurrencyPrecise(row.extraPayment) : '-'}</td>
                <td>${MortgageCalculator.formatCurrencyPrecise(row.balance)}</td>
            `;

            elements.amortizationBody.appendChild(tr);
        });

        elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
        elements.prevPage.disabled = state.currentPage === 1;
        elements.nextPage.disabled = state.currentPage === totalPages;
    }

    /**
     * Change table page
     */
    function changePage(direction) {
        const schedule = state.showAccelerated ?
            state.acceleratedResult.schedule :
            state.originalResult.schedule;
        const totalPages = Math.ceil(schedule.length / state.rowsPerPage);

        state.currentPage = Math.max(1, Math.min(totalPages, state.currentPage + direction));
        renderAmortizationTable();
    }

    /**
     * Toggle between schedules
     */
    function handleToggleSchedule() {
        state.showAccelerated = elements.showAccelerated.checked;
        state.currentPage = 1;
        renderAmortizationTable();
    }

    /**
     * Handle CSV export
     */
    function handleExportCsv() {
        const schedule = state.showAccelerated ?
            state.acceleratedResult.schedule :
            state.originalResult.schedule;

        const filename = state.showAccelerated ?
            'accelerated-amortization.csv' :
            'original-amortization.csv';

        ExportManager.exportToCSV(schedule, filename);
        showToast('CSV exported successfully', 'success');
    }

    /**
     * Handle PDF export
     */
    function handleExportPdf() {
        const savings = MortgageCalculator.calculateSavings(
            state.originalResult,
            state.acceleratedResult
        );

        const summaryData = {
            originalPayoffDate: state.originalResult.payoffDate,
            acceleratedPayoffDate: state.acceleratedResult.payoffDate,
            timeSaved: savings.timeSavedText,
            monthlyPayment: state.originalResult.monthlyPayment,
            originalInterest: state.originalResult.totalInterest,
            interestSaved: savings.interestSaved
        };

        ExportManager.exportToPDF(summaryData, state.loanData, state.accelerationOptions);
    }

    /**
     * Handle save to browser
     */
    function handleSave() {
        const result = StorageManager.save({
            loanData: state.loanData,
            accelerationOptions: state.accelerationOptions
        });

        if (result.success) {
            showToast('Results saved to browser', 'success');
        } else {
            showToast(result.error, 'error');
        }
    }

    /**
     * Handle share link
     */
    async function handleShare() {
        const url = StorageManager.generateShareUrl(state.loanData, state.accelerationOptions);
        const result = await StorageManager.copyToClipboard(url);

        if (result.success) {
            elements.shareNote.textContent = 'Link copied to clipboard!';
            showToast('Share link copied!', 'success');
            setTimeout(() => {
                elements.shareNote.textContent = '';
            }, 3000);
        } else {
            showToast('Failed to copy link', 'error');
        }
    }

    /**
     * Handle start over
     */
    function handleStartOver() {
        // Reset form
        elements.form.reset();
        setDefaultStartDate();
        clearErrors();

        // Reset state
        state.loanData = null;
        state.accelerationOptions = null;
        state.originalResult = null;
        state.acceleratedResult = null;

        // Reset strategy cards
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.classList.remove('active');
            const input = card.querySelector('.strategy-input');
            if (input) input.hidden = true;
        });

        // Reset preview
        elements.previewPayment.textContent = '$--';
        elements.previewInterest.textContent = '$--';
        elements.previewPayoff.textContent = '--';

        // Update summary
        updateStrategySummary();

        // Go to step 1
        goToStep(1);

        // Clear URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    /**
     * Load data from URL parameters
     */
    function loadFromUrl() {
        const data = StorageManager.parseShareUrl();
        if (data) {
            populateForm(data);
            setTimeout(() => {
                updateLivePreview();
            }, 100);
        }
    }

    /**
     * Populate form with data
     */
    function populateForm(data) {
        if (data.loanData) {
            elements.loanAmount.value = data.loanData.principal.toLocaleString();
            elements.interestRate.value = data.loanData.annualRate;
            elements.loanTerm.value = data.loanData.termYears;

            // Parse start date
            if (data.loanData.startDate) {
                const [year, month] = data.loanData.startDate.split('-');
                elements.startMonth.value = month;
                elements.startYear.value = year;
            }
        }

        if (data.accelerationOptions) {
            if (data.accelerationOptions.extraMonthly > 0) {
                elements.enableExtraMonthly.checked = true;
                elements.extraMonthly.value = data.accelerationOptions.extraMonthly;
                elements.enableExtraMonthly.closest('.strategy-card').classList.add('active');
                elements.extraMonthly.closest('.strategy-input').hidden = false;
            }

            if (data.accelerationOptions.biweekly) {
                elements.biweekly.checked = true;
                elements.biweekly.closest('.strategy-card').classList.add('active');
            }

            if (data.accelerationOptions.lumpSum > 0) {
                elements.enableLumpSum.checked = true;
                elements.lumpSum.value = data.accelerationOptions.lumpSum;

                // Parse lump sum date
                if (data.accelerationOptions.lumpSumDate) {
                    const [year, month] = data.accelerationOptions.lumpSumDate.split('-');
                    elements.lumpSumMonth.value = month;
                    elements.lumpSumYear.value = year;
                }

                elements.enableLumpSum.closest('.strategy-card').classList.add('active');
                elements.lumpSum.closest('.strategy-input').hidden = false;
            }

            if (data.accelerationOptions.annualExtra > 0) {
                elements.enableAnnualExtra.checked = true;
                elements.annualExtra.value = data.accelerationOptions.annualExtra;
                elements.annualExtraMonth.value = data.accelerationOptions.annualExtraMonth;
                elements.enableAnnualExtra.closest('.strategy-card').classList.add('active');
                elements.annualExtra.closest('.strategy-input').hidden = false;
            }

            updateStrategySummary();
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
