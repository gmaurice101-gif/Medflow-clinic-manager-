# Security Specification - MedFlow Clinic Management

## Data Invariants
1. **Patient Integrity**: A patient record must have a name, contact, and a valid creation timestamp.
2. **Appointment Context**: Every appointment must belong to a valid patient.
3. **Prescription Safety**: Only a doctor (authenticated staff) can create or modify prescriptions.
4. **Billing Accuracy**: Total amounts must be calculated correctly and once paid, status cannot be reverted easily without admin intervention.
5. **Role-Based Access**: 
    - Patients should only be able to view their own records (if we enabled patient login, but for now it's staff-only).
    - Staff members have broad access but distinct roles (Doctor, Receptionist, Pharmacist, Admin).
    - For this initial version, we will assume all authenticated users are staff, but we will add `isAdmin()` checks for critical operations.

## The Dirty Dozen Payloads (Target: Permission Denied)
1. **Identity Spoofing**: Attempt to create a patient with `ownerId` set to another user.
2. **ID Poisoning**: Attempt to create a document with a path variable longer than 128 characters or with malicious characters.
3. **State Shortcut**: Attempt to update an appointment directly to 'Completed' without going through 'Checked-in'.
4. **Shadow Field**: Attempt to inject an `isVerified: true` field into a patient record during creation.
5. **Immortal Field Breach**: Attempt to change `createdAt` on an existing patient record.
6. **Large Payload Attack**: Attempt to write a 1MB string into a patient's address field.
7. **Phantom Relationship**: Attempt to create an appointment for a `patientId` that does not exist.
8. **Negative Billing**: Attempt to create a bill with a negative total amount.
9. **Unverified Auth**: Attempt to write data while signed in but with an unverified email.
10. **Admin Escalation**: Attempt to add oneself to the `/admins/` collection.
11. **Cross-User Leak**: Attempt to list all bills without any filters as a non-admin.
12. **Terminal State Reversal**: Attempt to change the status of a 'Paid' bill back to 'Unpaid'.

## Rules Validation Plan
- All helper functions will be defined globally.
- `isValid[Entity]` will be used for every write.
- `affectedKeys()` will be used for all updates.
- `exists()` will verify relationships during creation.
