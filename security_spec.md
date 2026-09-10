# Security Specification & Threat Model for EduNex / NEXORA Firestore

## 1. Data Invariants & Access Control Model
- **User Profile (`/users/{userId}`)**: Only the authenticated user matching `{userId}` can read and write their profile. Writing requires `request.auth.uid == userId`.
- **User Subcollections (`/users/{userId}/weaknesses`, `/flashcards`, `/schedule`, `/notes`)**:
  - Only the owner (`request.auth.uid == userId`) can read, list, create, update, or delete subcollection items.
  - Subcollection records must validate `userId == request.auth.uid` and valid schema limits.
- **Study Circles (`/studyCircles/{circleId}`)**:
  - Readable by all authenticated users.
  - Creatable/updatable by authenticated users with strict field size and schema checks.
  - Subcollection `/studyCircles/{circleId}/messages/{messageId}`:
    - Readable by authenticated users.
    - Creatable by authenticated users where `incoming().senderId == request.auth.uid`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated User Profile Read/Write**: Unauthenticated client attempts to query or set `/users/victim_123`. -> *DENIED*
2. **Cross-User Profile Spoofing**: User A (`uid_A`) attempts to write to `/users/uid_B`. -> *DENIED*
3. **Ghost Field / Shadow Field Injection**: User A adds unauthorized keys like `isAdmin: true` or `role: 'superadmin'` to profile. -> *DENIED*
4. **ID Poisoning / Oversized Path**: Attacker uses a 5KB path ID to exhaust compute. -> *DENIED via `isValidId()`*
5. **Cross-User Flashcard Tampering**: User A writes to `/users/uid_B/flashcards/card_1`. -> *DENIED*
6. **Cross-User Weakness Manipulation**: User A deletes or updates `/users/uid_B/weaknesses/math_weakness`. -> *DENIED*
7. **Cross-User Note Snooping**: User A lists `/users/uid_B/notes`. -> *DENIED*
8. **Forged Message Sender ID**: User A attempts to send a circle message with `senderId: 'uid_victim'`. -> *DENIED*
9. **Volumetric Text Flooding**: User attempts to post 1MB text payload in chat or note. -> *DENIED via `.size()` checks*
10. **Study Circle Arbitrary Property Injection**: Adding arbitrary unrecognized root-level metadata properties. -> *DENIED*
11. **Negative Study Time Attack**: Setting negative XP, study minutes, or levels. -> *DENIED*
12. **Blanket Query Scraping**: Attempting an unrestricted collection query across subcollections without user constraint. -> *DENIED*
