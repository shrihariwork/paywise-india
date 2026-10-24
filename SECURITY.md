# Security Policy & Zero-PCI-DSS Compliance

## Zero-PCI DSS Architecture
PayWise India is designed from the ground up as a **Zero-PCI-DSS footprint** application:
1. **No Sensitive Authentication Data (SAD):** The application never requests, parses, transmits, or stores Card Verification Values (CVVs), PINs, or OTPs.
2. **No Primary Account Numbers (PANs):** Users only select public card variant titles (e.g. *SBI Cashback*, *HDFC Infinia*). 16-digit card numbers are strictly prohibited.
3. **No Financial Credentials:** Bank logins, net-banking credentials, or UPI PINs are never handled.

## Reporting a Security Vulnerability
If you discover a security vulnerability or sensitive data exposure risk in PayWise India, please report it privately:
- **Email:** security@paywise-india.dev
- Please include steps to reproduce, impact assessment, and any proposed fixes.
- We will acknowledge receipt within 24 hours and provide an update within 72 hours.
