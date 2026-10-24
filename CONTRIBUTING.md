# Contributing to PayWise India

Thank you for contributing to PayWise India! To ensure high reliability, regulatory compliance, and mathematical accuracy, please follow these guidelines.

---

## 🌳 Branching Strategy
- `main` is production-ready and protected. Direct commits are forbidden.
- Always branch from `main` using the conventional prefix:
  - `feat/<issue-id>-<slug>`
  - `fix/<issue-id>-<slug>`
  - `chore/<issue-id>-<slug>`

## 📝 Conventional Commits
All commit messages must adhere to the Conventional Commits specification:
- `feat(engine): add GyFTR 5x multiplier calculation (#2)`
- `fix(mcc): correct DMart offline POS MCC mapping (#1)`
- `test(optimizer): add monthly cap exhaustion boundary tests (#3)`

## 💳 FinTech & Zero-PCI Rules
- **No PCI Data:** Never add forms, inputs, fields, or regexes that capture 16-digit card numbers, CVVs, or OTPs.
- **Deterministic Math:** Round all intermediate and final rupee values deterministically using `Math.round((val + Number.EPSILON) * 100) / 100` or integer paise.
- **Unit Test Coverage:** All mathematical functions in `src/lib/optimizerEngine.ts` must maintain >= 90% test coverage.

## 🚀 Pull Request Checklist
1. Link an open GitHub issue (`Closes #ID`).
2. Run `npm run lint` and `npm run typecheck`.
3. Run `npm run test:coverage` and ensure all tests pass.
4. Assign PR to the maintainer (`shrihariwork`).
