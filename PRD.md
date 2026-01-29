# Product Requirements Document: Mortgage Payoff Calculator

## Overview

A web-based financial calculator that helps homeowners visualize and plan accelerated payoff strategies for their home loans. Built with vanilla HTML, CSS, and JavaScript for maximum compatibility and ease of deployment.

---

## Problem Statement

Homeowners often lack clear visibility into how extra payments, different payment frequencies, or lump-sum contributions can impact their mortgage payoff timeline and total interest paid. This calculator bridges that gap by providing intuitive, actionable insights.

---

## Target Users

- Homeowners with existing mortgages seeking to pay off their loans faster
- Prospective homebuyers evaluating loan scenarios
- Financial education students learning about amortization and compound interest
- Financial advisors demonstrating payoff strategies to clients

---

## Technical Requirements

### Stack
- **HTML5** - Semantic markup, accessibility-compliant
- **CSS3** - Responsive design, no frameworks (pure CSS)
- **JavaScript (ES6+)** - Vanilla JS, no external libraries

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Performance
- Initial load under 1 second on 3G connection
- All calculations performed client-side
- No backend or database required

---

## Core Features

### 1. Loan Input Section

| Field | Type | Validation |
|-------|------|------------|
| Original Loan Amount | Currency input | $1,000 - $10,000,000 |
| Interest Rate (APR) | Percentage | 0.1% - 25% |
| Loan Term | Dropdown/Input | 1 - 40 years |
| Start Date | Date picker | Any valid date |
| Current Balance (optional) | Currency | Must be ≤ original amount |
| Payments Already Made (optional) | Number | 0 - total payments |

### 2. Acceleration Strategies

Users can apply one or more strategies simultaneously:

#### Extra Monthly Payment
- Additional fixed amount added to each monthly payment
- Input: Currency field ($0 - $50,000)

#### Bi-Weekly Payments
- Toggle to switch from monthly to bi-weekly payments
- Results in 26 half-payments (equivalent to 13 monthly payments/year)

#### One-Time Lump Sum Payment
- Single additional payment at a specified date
- Inputs: Amount and date

#### Annual Extra Payment
- Recurring yearly additional payment
- Inputs: Amount and month of year

### 3. Results Dashboard

#### Summary Cards
- **Original Payoff Date** - When loan would be paid off without acceleration
- **New Payoff Date** - Projected payoff with selected strategies
- **Time Saved** - Years and months difference
- **Total Interest (Original)** - Interest over full loan term
- **Total Interest (Accelerated)** - Interest with acceleration applied
- **Interest Saved** - Dollar amount saved

#### Amortization Schedule Table
- Month/Year column
- Payment number
- Beginning balance
- Principal portion
- Interest portion
- Extra payment (if applicable)
- Ending balance
- Cumulative interest paid

Features:
- Sortable columns
- Pagination or virtual scrolling for large datasets
- Export to CSV functionality
- Highlight rows where extra payments are applied

#### Visual Charts
- **Payoff Timeline Comparison** - Bar chart comparing original vs accelerated payoff
- **Principal vs Interest Over Time** - Stacked area chart
- **Balance Remaining** - Line chart showing balance decline over time
- **Interest Savings Breakdown** - Pie chart showing interest paid vs saved

### 4. Comparison Mode

Allow users to compare up to 3 different scenarios side-by-side:
- Scenario A: Original loan terms
- Scenario B: User-defined acceleration strategy
- Scenario C: Alternative acceleration strategy

### 5. Save & Share

- **Save to Browser** - LocalStorage for returning users
- **Export PDF** - Generate printable summary report
- **Share Link** - URL parameters encoding loan details (no sensitive data)

---

## User Interface Requirements

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo + "Mortgage Payoff Calculator"        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌───────────────────────────┐ │
│  │  Input Panel    │  │  Results Dashboard        │ │
│  │                 │  │                           │ │
│  │  - Loan Details │  │  - Summary Cards          │ │
│  │  - Acceleration │  │  - Charts                 │ │
│  │    Options      │  │  - Amortization Table     │ │
│  │                 │  │                           │ │
│  │  [Calculate]    │  │                           │ │
│  └─────────────────┘  └───────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Footer: Disclaimer + Company Info                  │
└─────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Desktop**: ≥1024px - Two-column layout
- **Tablet**: 768px - 1023px - Stacked layout with collapsible sections
- **Mobile**: <768px - Single column, accordion-style inputs

### Design Principles
- Clean, professional aesthetic suitable for financial services
- High contrast for readability
- Clear visual hierarchy
- Immediate feedback on input changes
- Tooltips/help icons explaining financial terms
- Progress indicators during calculations

### Accessibility (WCAG 2.1 AA)
- Keyboard navigable
- Screen reader compatible
- Color contrast ratio ≥ 4.5:1
- Focus indicators
- ARIA labels on interactive elements
- Error messages linked to form fields

---

## Financial Calculations

### Standard Amortization Formula

```
M = P * [r(1+r)^n] / [(1+r)^n - 1]

Where:
M = Monthly payment
P = Principal (loan amount)
r = Monthly interest rate (annual rate / 12)
n = Total number of payments (years * 12)
```

### Interest for Period

```
Interest = Current Balance * Monthly Interest Rate
```

### Principal for Period

```
Principal = Monthly Payment - Interest
```

### Extra Payment Application
- All extra payments applied directly to principal
- Recalculate remaining term after each extra payment

### Bi-Weekly Calculation
- Payment = Monthly Payment / 2
- 26 payments per year
- Apply every 2 weeks (not semi-monthly)

---

## Edge Cases & Validation

| Scenario | Handling |
|----------|----------|
| Extra payment exceeds remaining balance | Cap at remaining balance, mark loan as paid |
| Interest rate of 0% | Handle as simple division (no compound interest) |
| Very large loan amounts | Use BigInt or decimal library if precision issues |
| Negative amortization | Display warning, prevent invalid scenarios |
| Past start date | Allow for "what if" scenarios |
| Loan already paid off | Display message, disable acceleration inputs |

---

## Error States

- Invalid input formatting → Inline error with correction hint
- Missing required fields → Highlight fields, prevent calculation
- Impossible scenarios → Explanatory modal with guidance
- Browser storage full → Graceful degradation with user notification

---

## Future Considerations (Out of Scope for V1)

- Multiple loan comparison (mortgage + HELOC + auto)
- Integration with real-time interest rates
- User accounts with cloud sync
- Refinance analysis tool
- Amortization schedule email delivery
- Mobile app version
- Multi-currency support
- Tax implication estimates

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page Load Time | < 1 second |
| Calculation Time | < 100ms |
| Mobile Usability Score | > 90 (Lighthouse) |
| Accessibility Score | > 95 (Lighthouse) |
| User Task Completion | > 85% complete a calculation |

---

## File Structure

```
mortgage-payoff-calculator/
├── index.html
├── css/
│   ├── styles.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── calculator.js
│   ├── charts.js
│   ├── storage.js
│   └── export.js
├── assets/
│   └── images/
└── README.md
```

---

## Disclaimer Requirements

The calculator must display a prominent disclaimer:

> "This calculator provides estimates for educational purposes only. Actual loan terms, payments, and payoff dates may vary based on your specific loan agreement, lender policies, and other factors. Consult with a qualified financial advisor before making financial decisions."

---

## Acceptance Criteria

- [ ] User can input loan details and see monthly payment calculated
- [ ] User can apply at least one acceleration strategy
- [ ] Results update in real-time as inputs change
- [ ] Amortization schedule generates correctly for full loan term
- [ ] Charts render accurately and are interactive
- [ ] All calculations match industry-standard amortization formulas (±$0.01)
- [ ] Works offline after initial load
- [ ] Passes WCAG 2.1 AA accessibility audit
- [ ] Responsive design works on all target breakpoints
- [ ] Data persists in browser storage between sessions
- [ ] Export to CSV produces valid, importable file
