import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test accounts
const testAccounts = [
    {
        email: 'admin@test.com',
        password: 'Admin@123',
        role: 'PLATFORM_ADMIN',
        name: 'Platform Admin',
        phone: '+1234567890',
        permissions: ['MANAGE_PLATFORM', 'APPROVE_ORGANIZATIONS', 'VIEW_PLATFORM_ANALYTICS']
    },
    {
        email: 'org@test.com',
        password: 'Org@123',
        role: 'ORG_ADMIN',
        name: 'Organization Admin',
        phone: '+1234567891',
        permissions: ['MANAGE_ORGANIZATION', 'MANAGE_SERVICES', 'MANAGE_EMPLOYEES', 'VIEW_APPOINTMENTS']
    },
    {
        email: 'emp@test.com',
        password: 'Emp@123',
        role: 'EMPLOYEE',
        name: 'Employee Operator',
        phone: '+1234567892',
        permissions: ['SCAN_QR', 'MANAGE_QUEUE', 'VIEW_APPOINTMENTS']
    },
    {
        email: 'customer@test.com',
        password: 'Cust@123',
        role: 'CUSTOMER',
        name: 'Test Customer',
        phone: '+1234567893',
        permissions: ['BOOK_APPOINTMENT', 'VIEW_OWN_APPOINTMENTS']
    }
];

async function createTestAccount(accountData) {
    try {
        console.log(`Creating ${accountData.role}: ${accountData.email}...`);

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            accountData.email,
            accountData.password
        );

        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: accountData.email,
            name: accountData.name,
            phone: accountData.phone,
            role: accountData.role,
            permissions: accountData.permissions,
            organizationId: null,
            noShowCount: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`✓ Created: ${accountData.email}\n`);
        return { success: true };
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log(`⚠ Already exists: ${accountData.email}\n`);
            return { success: false, error: 'exists' };
        }
        console.error(`✗ Error: ${error.message}\n`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('Creating Test Accounts');
    console.log('='.repeat(60) + '\n');

    for (const account of testAccounts) {
        await createTestAccount(account);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    testAccounts.forEach(acc => {
        console.log(`${acc.role.padEnd(20)} | ${acc.email.padEnd(25)} | ${acc.password}`);
    });
    console.log('='.repeat(60));

    process.exit(0);
}

main().catch(console.error);
