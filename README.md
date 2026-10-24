# PayWise India — AI Payment & Rewards Optimizer SuperApp Agent

[![CI Status](https://github.com/shrihariwork/paywise-india/actions/workflows/ci.yml/badge.svg)](https://github.com/shrihariwork/paywise-india/actions/workflows/ci.yml)
[![Security SAST](https://github.com/shrihariwork/paywise-india/actions/workflows/security.yml/badge.svg)](https://github.com/shrihariwork/paywise-india/actions/workflows/security.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://www.typescriptlang.org/)
[![Zero PCI DSS](https://img.shields.io/badge/Security-Zero--PCI%20Compliant-success.svg)](#zero-pci-dss-compliance)

PayWise India is a production-grade, AI-powered Payment & Rewards Optimizer SuperApp Agent tailored for the complex Indian payments ecosystem (Credit Cards, RuPay on UPI, Dining Aggregators, and Instant Gift Voucher Stacking).

---

## 🌟 The Problem
In India, a single ₹3,000 bill at a restaurant, supermarket, or mall can yield anywhere from **0% to 35%** in effective returns depending on *how* you pay. Between credit card reward multipliers, RuPay-on-UPI cashback apps, dining aggregators (Swiggy Dineout / Zomato Dining), instant vouchers (GyFTR / HDFC SmartBuy), and monthly caps, consumers face checkout paralysis.

## 💡 The Solution: Hybrid Neuro-Symbolic Engine
1. **AI Intent Extraction (Gemini 3.8 Flash):** The LLM parses natural language queries (e.g. *"I'm at DMart with a ₹3,500 bill"* or *"Dinner at Mainland China with ₹4,200 bill"*) into structured parameters: `{ merchantName, category, mccEstimate, billAmount, isOnline, channelPreferences }`.
2. **Deterministic Calculation Engine (`optimizerEngine.ts`):** 100% mathematically exact calculations that evaluate:
   - **Strategy A:** Direct Card Swipe / Tap (POS / Online)
   - **Strategy B:** Dining Aggregator Stacking (Double-Dip: Upfront bill discount + partner card boost)
   - **Strategy C:** Instant Gift Voucher Stacking (SmartBuy / GyFTR / Tata Neu 5X-10X)
   - **Strategy D:** RuPay on UPI & UPI SuperApps
3. **Transparent Mathematical Output:** Real-time breakdown of Instant Discount + Card Cashback + Voucher Multipliers - Convenience Fees = Net INR Return (and Effective Return %).

---

## 💳 Supported Payment Instruments Seed Catalog
- **Top Indian Credit Cards:**
  - HDFC Infinia (3.3% base, 16.5% via SmartBuy GyFTR vouchers)
  - HDFC Regalia Gold (1.33% base, 6.65% via SmartBuy)
  - SBI Cashback Card (5% online up to ₹5,000/mo, 1% offline POS)
  - HSBC Live+ Credit Card (10% on Dining, Food Delivery, and Grocery up to ₹1,000/mo)
  - HDFC Swiggy Credit Card (10% on Swiggy/Dineout up to ₹1,500/mo, 5% online shopping)
  - Airtel Axis Bank Credit Card (10% on Swiggy/Zomato/BigBasket up to ₹500/mo, 25% Airtel)
  - Axis Atlas (4% general travel spend, 10% on direct airline/hotels)
  - ICICI Amazon Pay (5% Amazon Prime, 2% partner, 1% offline)
  - Tata Neu Infinity HDFC (RuPay) (1.5% UPI Scan & Pay, up to 10% Tata brands)
  - Kiwi Yes Bank / Axis RuPay (2% to 5% assured cashback on UPI Scan & Pay)
  - Amex Platinum Travel (Milestone booster up to ~7.5% net value)
  - ICICI Sapphiro (BOGO up to ₹500 on BookMyShow)
- **UPI Apps:** Super.money, CRED UPI, Tata Neu UPI, Google Pay, PhonePe
- **Aggregators & Vouchers:** Swiggy Dineout, Zomato District (Dining), EazyDiner Prime, GyFTR / HDFC SmartBuy, Tata Neu

---

## 🔒 Zero-PCI DSS Compliance
PayWise India **never** asks for, receives, or stores:
- 16-digit Primary Account Numbers (PANs)
- Expiry Dates
- Card Verification Values (CVVs)
- Banking Passwords or OTPs

Users only select card variant names (e.g. `HDFC Regalia Gold`) and configure monthly cap usage sliders.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation
```bash
# Clone the repository
git clone git@github.com:shrihariwork/paywise-india.git
cd paywise-india

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY (optional for local mock preview mode)
```

### Running Locally
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

### Running Tests
```bash
# Run Vitest unit tests with coverage report
npm run test:coverage

# Run Playwright end-to-end tests
npm run test:e2e
```

---

## 🏗️ Architecture & Directory Structure
```
paywise-india/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── optimize/route.ts  # Gemini 3.8 Flash intent parser & fallback
│   │   ├── layout.tsx             # Root dark-mode fintech layout
│   │   └── page.tsx               # SuperApp UI (Agent, Wallet, MCC Explorer)
│   ├── data/
│   │   └── indianPaymentCatalog.ts # 12+ Cards, UPI apps, merchant MCC knowledge graph
│   └── lib/
│       ├── optimizerEngine.ts     # Deterministic 4-strategy calculation engine
│       └── utils.ts               # en-IN currency formatters & helper routines
├── e2e/
│   └── superapp.spec.ts           # Playwright E2E suite
├── vitest.config.ts               # Unit test config
└── vercel.json                    # Security headers & deployment config
```

---

## 📄 License
MIT License. Built for the Indian FinTech developer community.
