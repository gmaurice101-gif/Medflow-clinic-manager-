# Security Specification: Medflow Clinic Manager

## Data Invariants
1. **Prescriptions**: Must be linked to a valid appointment and patient. Initial status must be 'Pending'.
2. **Appointments**: Must belong to a registered patient. Status transitions must follow clinical workflow.
3. **Invoices**: Every service (medication, lab, procedure) must generate an 'unpaid' bill.
4. **Identity**: Patient records and clinical notes are restricted to verified staff.

## The "Dirty Dozen" Payloads (Targets: Prescriptions)

1. **Identity Spoofing**: Attempt to create a prescription for a patient ID the user doesn't have access to (bypassed if verified staff).
2. **Orphaned Write**: Create a prescription with a non-existent `appointmentId`.
3. **Status Hijack**: Create a prescription with `status: 'Dispensed'` to skip pharmacy workflow.
4. **Time Travel**: Set `createdAt` to a past or future date.
5. **PII Leak**: Read all prescriptions without being a verified staff member.
6. **Medication Poisoning**: Inject a 1MB string into the `medications` array name.
7. **Phantom Dispensing**: Update `dispensedAt` without changing status to 'Dispensed'.
8. **Resource Exhaustion**: Send 10,000 keys in the prescription document.
9. **Role Escalation**: Attempt to update `patientId` on an existing prescription.
10. **Shadow Billing**: Create a prescription without an associated bill (checked via existsAfter/exists).
11. **ID Injection**: Use a 2KB string as a `prescriptionId`.
12. **Anonymous Write**: Create a prescription without being logged in.

## Test Runner (firestore.rules.test.ts)
*(Summary of core tests)*
- `test('Anonymous cannot create prescription')` -> Denied
- `test('User cannot spoof createdAt')` -> Denied
- `test('User cannot create prescription for non-existent appointment')` -> Denied
- `test('User cannot modify patientId after creation')` -> Denied
