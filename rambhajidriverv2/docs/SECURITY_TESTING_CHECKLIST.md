# SECURITY TESTING CHECKLIST
## GharTak — Driver Delivery Mobile Application
### Security QA & Penetration Testing Verification Document

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Ready for Security QA  
**Classification:** Internal — Confidential Security  
**Prepared By:** Security Architect / Penetration Testing Lead  
**Reference:** OWASP Mobile Security Testing Guide (MSTG), OWASP Mobile Top 10  

---

## How to Use This Checklist
- Each item maps to an OWASP Mobile Top 10 risk or a GharTak-specific threat model
- Mark `✅ PASS`, `❌ FAIL`, or `⚠️ NEEDS REVIEW`
- All items must reach `✅ PASS` before production deployment

---

## Category 1: Authentication Security (OWASP M1)

- [ ] `SEC-AUTH-01` OTP is rejected after 3 consecutive incorrect attempts
- [ ] `SEC-AUTH-02` Account lock message does not reveal OTP value
- [ ] `SEC-AUTH-03` Expired OTP (> 5 min) is rejected by the backend
- [ ] `SEC-AUTH-04` Reused OTP cannot be submitted twice (server-side check)
- [ ] `SEC-AUTH-05` JWT access token expiry is enforced server-side (15 min)
- [ ] `SEC-AUTH-06` Expired refresh token triggers full logout (not silent renewal)
- [ ] `SEC-AUTH-07` Reused refresh token (rotation violation) invalidates all sessions
- [ ] `SEC-AUTH-08` JWT payload does not contain sensitive PII beyond driver ID and role
- [ ] `SEC-AUTH-09` Device fingerprint mismatch blocks API access
- [ ] `SEC-AUTH-10` Driver cannot use another driver's token on their device

---

## Category 2: Insecure Data Storage (OWASP M2)

- [ ] `SEC-STOR-01` JWT tokens are NOT stored in AsyncStorage (plain text)
- [ ] `SEC-STOR-02` JWT tokens stored in MMKV with AES-256 encryption confirmed
- [ ] `SEC-STOR-03` Encryption key for MMKV is stored in Android KeyStore / iOS Keychain
- [ ] `SEC-STOR-04` MMKV data is NOT accessible via ADB backup (`android:allowBackup=false`)
- [ ] `SEC-STOR-05` Photos in the offline cache are NOT readable by other apps
- [ ] `SEC-STOR-06` Sensitive data does NOT appear in system logs (no `console.log` of tokens)
- [ ] `SEC-STOR-07` After logout, all MMKV secure keys are wiped completely
- [ ] `SEC-STOR-08` Offline queue items do NOT appear in plain-text device storage

---

## Category 3: Insecure Communication (OWASP M3)

- [ ] `SEC-NET-01` All API requests use HTTPS (no HTTP fallback allowed)
- [ ] `SEC-NET-02` TLS version is 1.2 minimum; TLS 1.3 preferred
- [ ] `SEC-NET-03` Weak cipher suites (RC4, DES, 3DES) are rejected
- [ ] `SEC-NET-04` SSL Pinning is active and rejects unknown server certificates
- [ ] `SEC-NET-05` Proxying with Burp Suite / Charles is blocked by SSL pin
- [ ] `SEC-NET-06` Server certificate CN/SAN matches `api.ghartak.com`
- [ ] `SEC-NET-07` API responses do not expose internal server stack traces

---

## Category 4: Insufficient Authentication (OWASP M4)

- [ ] `SEC-SESS-01` Accessing dashboard URL directly without auth redirects to login
- [ ] `SEC-SESS-02` Route guards block protected screens if token is absent
- [ ] `SEC-SESS-03` Permission guards prevent delivery confirmation without location grant
- [ ] `SEC-SESS-04` Force logout from admin panel takes effect within one API cycle
- [ ] `SEC-SESS-05` Multi-device login attempt blocks older session

---

## Category 5: Broken Cryptography (OWASP M5)

- [ ] `SEC-CRYPT-01` HMAC request signing uses SHA-256 (not MD5 or SHA-1)
- [ ] `SEC-CRYPT-02` Signed requests with stale timestamps (> 5 min) are rejected by server
- [ ] `SEC-CRYPT-03` Encryption key is never hardcoded in JavaScript source code
- [ ] `SEC-CRYPT-04` Encryption key is never committed to version control (`.gitignore`)

---

## Category 6: Privacy Violations (OWASP M6)

- [ ] `SEC-PRIV-01` Location is only accessed when app is actively in use (no background always-on)
- [ ] `SEC-PRIV-02` Camera is only triggered explicitly by driver action
- [ ] `SEC-PRIV-03` Customer PII (phone, address) is not cached beyond the active delivery day
- [ ] `SEC-PRIV-04` Crash logs do not contain driver personal data or tokens

---

## Category 7: Device Integrity & Tampering (OWASP M8)

- [ ] `SEC-INT-01` Rooted Android device — app shows security block screen and halts
- [ ] `SEC-INT-02` Jailbroken iOS device — app shows security block screen and halts
- [ ] `SEC-INT-03` App running on Android emulator — location and camera are disabled
- [ ] `SEC-INT-04` App running on Genymotion / BlueStacks — map features blocked
- [ ] `SEC-INT-05` App running in debug mode — shows developer warning banner
- [ ] `SEC-INT-06` Tamper detection fires when app binary checksum changes

---

## Category 8: Fraud Prevention (GharTak-Specific)

- [ ] `SEC-FRAUD-01` Mock location (Android Developer Options) — DELIVER button blocked
- [ ] `SEC-FRAUD-02` Delivery outside geofence (> 100m) — DELIVER button blocked
- [ ] `SEC-FRAUD-03` GPS disabled during delivery attempt — clear prompt shown, action blocked
- [ ] `SEC-FRAUD-04` Security violation events (mock GPS, root) are logged to server within 5s
- [ ] `SEC-FRAUD-05` Duplicate delivery confirmation (same order ID) is rejected by server (`409`)
- [ ] `SEC-FRAUD-06` Photo cannot be submitted without actual camera capture (gallery blocked)
- [ ] `SEC-FRAUD-07` Driver cannot confirm delivery from a different city's GPS coordinates

---

## Category 9: Screenshot & Recording Prevention

- [ ] `SEC-SCR-01` Android: Screenshots result in a blank/black capture for app screens
- [ ] `SEC-SCR-02` Android: Screen recording shows blank app content
- [ ] `SEC-SCR-03` iOS: Screen recording triggers a blur overlay on sensitive screens
- [ ] `SEC-SCR-04` Recent apps list does not reveal app content in Android task switcher

---

## Category 10: Incident Response Verification

- [ ] `SEC-INC-01` Security violation payload reaches `/api/v1/security/violation` within 5 seconds
- [ ] `SEC-INC-02` Admin portal shows security violation alert for the affected driver
- [ ] `SEC-INC-03` Remote force logout terminates the driver's session within one API cycle
- [ ] `SEC-INC-04` Audit log records login, logout, and delivery events with GPS and device info
- [ ] `SEC-INC-05` Audit logs are transmitted successfully in batch via `/telemetry/audit-logs`
- [ ] `SEC-INC-06` Dead Letter Queue items are retained for 7 days before auto-purge
- [ ] `SEC-INC-07` All security events in MMKV are encrypted and not readable in plain text

---

## Tools & Test Environment Requirements

| Tool | Purpose |
|------|---------|
| **Burp Suite Community** | Proxy interception / SSL pinning verification |
| **Frida / Objection** | Runtime manipulation detection |
| **MobSF (Mobile Security Framework)** | Static + dynamic analysis |
| **Rooted Android Device** | Root detection testing |
| **Genymotion / Android Emulator** | Emulator detection testing |
| **Android Developer Options** | Mock location activation testing |
| **ADB** | `adb backup` and storage exposure testing |

---

*Document End — SECURITY_TESTING_CHECKLIST.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
