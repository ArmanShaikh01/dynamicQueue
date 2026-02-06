# Test Account Creation Scripts

This directory contains scripts to automatically create test accounts for the Dynamic Queue & Appointment Management System.

## Setup

1. Make sure your `.env` file in the root directory has all Firebase credentials
2. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

## Create Test Accounts

Run the script to create all test accounts:

```bash
npm run create-accounts
```

This will create the following accounts:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@test.com | Admin@123 |
| Organization Admin | org@test.com | Org@123 |
| Employee | emp@test.com | Emp@123 |
| Customer | customer@test.com | Cust@123 |

## What the Script Does

1. Creates users in Firebase Authentication
2. Creates corresponding user profiles in Firestore with:
   - Correct role assignment
   - Appropriate permissions
   - User details (name, phone, etc.)
3. Handles duplicate accounts gracefully
4. Provides a summary of created accounts

## Troubleshooting

**Error: "Email already in use"**
- This is normal if accounts already exist
- The script will skip existing accounts and continue

**Error: "Firebase configuration not found"**
- Make sure your `.env` file exists in the root directory
- Verify all Firebase credentials are correct

**Error: "Permission denied"**
- Check your Firebase Authentication settings
- Ensure Email/Password authentication is enabled in Firebase Console

## Manual Account Creation

If the script doesn't work, you can create accounts manually:

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Copy the User UID
5. Go to Firestore → users collection
6. Create a document with the User UID as the document ID
7. Add the required fields (see `createTestAccounts.js` for field structure)
