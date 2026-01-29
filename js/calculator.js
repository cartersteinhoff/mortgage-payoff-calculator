/**
 * Mortgage Calculator Core Logic
 * Handles all financial calculations for mortgage amortization and acceleration strategies
 */

const MortgageCalculator = {
    /**
     * Calculate monthly payment using standard amortization formula
     * M = P * [r(1+r)^n] / [(1+r)^n - 1]
     */
    calculateMonthlyPayment(principal, annualRate, termYears) {
        if (annualRate === 0) {
            return principal / (termYears * 12);
        }

        const monthlyRate = annualRate / 100 / 12;
        const numPayments = termYears * 12;

        const payment = principal *
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);

        return payment;
    },

    /**
     * Generate full amortization schedule without acceleration
     */
    generateOriginalSchedule(loanData) {
        const { principal, annualRate, termYears, startDate } = loanData;
        const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, termYears);
        const monthlyRate = annualRate / 100 / 12;

        const schedule = [];
        let balance = principal;
        let cumulativeInterest = 0;
        let paymentNumber = 0;

        const start = new Date(startDate + '-01');

        while (balance > 0.01 && paymentNumber < termYears * 12) {
            paymentNumber++;

            const paymentDate = new Date(start);
            paymentDate.setMonth(paymentDate.getMonth() + paymentNumber - 1);

            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;

            // Handle final payment
            if (principalPayment > balance) {
                principalPayment = balance;
            }

            const actualPayment = principalPayment + interestPayment;
            balance -= principalPayment;
            cumulativeInterest += interestPayment;

            schedule.push({
                paymentNumber,
                date: this.formatDate(paymentDate),
                dateObj: paymentDate,
                payment: actualPayment,
                principal: principalPayment,
                interest: interestPayment,
                extraPayment: 0,
                balance: Math.max(0, balance),
                cumulativeInterest
            });
        }

        return {
            schedule,
            monthlyPayment,
            totalInterest: cumulativeInterest,
            totalPayments: paymentNumber,
            payoffDate: schedule[schedule.length - 1]?.date || this.formatDate(start)
        };
    },

    /**
     * Generate accelerated amortization schedule with extra payments
     */
    generateAcceleratedSchedule(loanData, accelerationOptions) {
        const { principal, annualRate, termYears, startDate } = loanData;
        const { extraMonthly, biweekly, lumpSum, lumpSumDate, annualExtra, annualExtraMonth } = accelerationOptions;

        const baseMonthlyPayment = this.calculateMonthlyPayment(principal, annualRate, termYears);
        const monthlyRate = annualRate / 100 / 12;

        const schedule = [];
        let balance = principal;
        let cumulativeInterest = 0;
        let paymentNumber = 0;

        const start = new Date(startDate + '-01');
        const maxPayments = termYears * 12 * 2; // Safety limit

        // Parse lump sum date if provided
        let lumpSumDateObj = null;
        let lumpSumApplied = false;
        if (lumpSum > 0 && lumpSumDate) {
            lumpSumDateObj = new Date(lumpSumDate + '-01');
        }

        if (biweekly) {
            // Bi-weekly payment schedule
            const biweeklyPayment = baseMonthlyPayment / 2;
            let dayCounter = 0;

            while (balance > 0.01 && paymentNumber < maxPayments * 2) {
                paymentNumber++;

                const paymentDate = new Date(start);
                paymentDate.setDate(paymentDate.getDate() + dayCounter);
                dayCounter += 14; // Every 2 weeks

                // Calculate interest for this period (14 days)
                const dailyRate = (annualRate / 100) / 365;
                const periodInterest = balance * dailyRate * 14;

                let periodPayment = biweeklyPayment;
                let extraPayment = 0;

                // Add extra monthly equivalent (divided by 2.17 for bi-weekly)
                if (extraMonthly > 0) {
                    extraPayment += extraMonthly / 2.17;
                }

                // Check for lump sum
                if (!lumpSumApplied && lumpSumDateObj && paymentDate >= lumpSumDateObj) {
                    extraPayment += lumpSum;
                    lumpSumApplied = true;
                }

                // Check for annual extra payment
                if (annualExtra > 0 && paymentDate.getMonth() === annualExtraMonth) {
                    const lastPayment = schedule[schedule.length - 1];
                    if (!lastPayment || lastPayment.dateObj.getMonth() !== annualExtraMonth ||
                        lastPayment.dateObj.getFullYear() !== paymentDate.getFullYear()) {
                        extraPayment += annualExtra;
                    }
                }

                let principalPayment = periodPayment - periodInterest;

                // Apply extra payment to principal
                principalPayment += extraPayment;

                // Handle final payment
                if (principalPayment > balance) {
                    principalPayment = balance;
                    periodPayment = principalPayment + periodInterest;
                }

                balance -= principalPayment;
                cumulativeInterest += periodInterest;

                schedule.push({
                    paymentNumber,
                    date: this.formatDate(paymentDate),
                    dateObj: new Date(paymentDate),
                    payment: periodPayment,
                    principal: principalPayment - extraPayment,
                    interest: periodInterest,
                    extraPayment,
                    balance: Math.max(0, balance),
                    cumulativeInterest
                });

                if (balance <= 0.01) break;
            }
        } else {
            // Monthly payment schedule
            while (balance > 0.01 && paymentNumber < maxPayments) {
                paymentNumber++;

                const paymentDate = new Date(start);
                paymentDate.setMonth(paymentDate.getMonth() + paymentNumber - 1);

                const interestPayment = balance * monthlyRate;
                let principalPayment = baseMonthlyPayment - interestPayment;
                let extraPayment = 0;

                // Add extra monthly payment
                if (extraMonthly > 0) {
                    extraPayment += extraMonthly;
                }

                // Check for lump sum
                if (!lumpSumApplied && lumpSumDateObj) {
                    const paymentMonth = paymentDate.getFullYear() * 12 + paymentDate.getMonth();
                    const lumpSumMonth = lumpSumDateObj.getFullYear() * 12 + lumpSumDateObj.getMonth();

                    if (paymentMonth >= lumpSumMonth) {
                        extraPayment += lumpSum;
                        lumpSumApplied = true;
                    }
                }

                // Check for annual extra payment
                if (annualExtra > 0 && paymentDate.getMonth() === annualExtraMonth) {
                    extraPayment += annualExtra;
                }

                // Apply extra payment to principal
                principalPayment += extraPayment;

                // Handle final payment
                if (principalPayment > balance) {
                    principalPayment = balance;
                }

                const actualPayment = (baseMonthlyPayment - extraPayment > balance + interestPayment)
                    ? balance + interestPayment
                    : baseMonthlyPayment;

                balance -= principalPayment;
                cumulativeInterest += interestPayment;

                schedule.push({
                    paymentNumber,
                    date: this.formatDate(paymentDate),
                    dateObj: new Date(paymentDate),
                    payment: actualPayment,
                    principal: principalPayment - extraPayment,
                    interest: interestPayment,
                    extraPayment,
                    balance: Math.max(0, balance),
                    cumulativeInterest
                });

                if (balance <= 0.01) break;
            }
        }

        return {
            schedule,
            monthlyPayment: baseMonthlyPayment,
            totalInterest: cumulativeInterest,
            totalPayments: paymentNumber,
            payoffDate: schedule[schedule.length - 1]?.date || this.formatDate(start)
        };
    },

    /**
     * Calculate the difference between original and accelerated schedules
     */
    calculateSavings(originalResult, acceleratedResult) {
        const originalDate = this.parseDate(originalResult.payoffDate);
        const acceleratedDate = this.parseDate(acceleratedResult.payoffDate);

        const timeDiff = originalDate - acceleratedDate;
        const monthsSaved = Math.round(timeDiff / (1000 * 60 * 60 * 24 * 30.44));

        const yearsSaved = Math.floor(monthsSaved / 12);
        const remainingMonths = monthsSaved % 12;

        let timeSavedText = '';
        if (yearsSaved > 0) {
            timeSavedText = `${yearsSaved} year${yearsSaved !== 1 ? 's' : ''}`;
            if (remainingMonths > 0) {
                timeSavedText += `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
            }
        } else if (remainingMonths > 0) {
            timeSavedText = `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        } else {
            timeSavedText = 'No time saved';
        }

        const interestSaved = originalResult.totalInterest - acceleratedResult.totalInterest;

        return {
            monthsSaved,
            yearsSaved,
            remainingMonths,
            timeSavedText,
            interestSaved,
            originalInterest: originalResult.totalInterest,
            acceleratedInterest: acceleratedResult.totalInterest
        };
    },

    /**
     * Format a date object to YYYY-MM format for display
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    /**
     * Format date for display (e.g., "Jan 2024")
     */
    formatDateDisplay(dateStr) {
        const [year, month] = dateStr.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    },

    /**
     * Parse a YYYY-MM string to Date object
     */
    parseDate(dateStr) {
        return new Date(dateStr + '-01');
    },

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Format currency with cents
     */
    formatCurrencyPrecise(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Parse currency string to number
     */
    parseCurrency(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/[,$]/g, '')) || 0;
    },

    /**
     * Validate loan data
     */
    validateLoanData(data) {
        const errors = {};

        if (!data.principal || data.principal < 1000) {
            errors.loanAmount = 'Loan amount must be at least $1,000';
        }
        if (data.principal > 10000000) {
            errors.loanAmount = 'Loan amount cannot exceed $10,000,000';
        }

        if (!data.annualRate || data.annualRate < 0.1) {
            errors.interestRate = 'Interest rate must be at least 0.1%';
        }
        if (data.annualRate > 25) {
            errors.interestRate = 'Interest rate cannot exceed 25%';
        }

        if (!data.termYears || data.termYears < 1) {
            errors.loanTerm = 'Please select a loan term';
        }

        if (!data.startDate) {
            errors.startDate = 'Please enter a start date';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MortgageCalculator;
}
