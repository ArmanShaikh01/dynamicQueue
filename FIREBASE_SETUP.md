# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "queue-management-system")
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Click "Save"

## Step 3: Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **Production mode**
4. Choose a location (closest to your users)
5. Click "Enable"

## Step 4: Get Firebase Configuration

1. Go to **Project settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

## Step 5: Configure Environment Variables

1. In your project, copy `.env.example` to `.env`
2. Fill in the values from Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

## Step 6: Deploy Firestore Security Rules

### Option A: Using Firebase CLI (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Accept default filenames

4. Replace `firestore.rules` content with the rules from the project

5. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option B: Using Firebase Console

1. Go to **Firestore Database** → **Rules** tab
2. Copy the content from `firestore.rules` file
3. Paste into the rules editor
4. Click "Publish"

## Step 7: Create Platform Admin User

Since the first user needs to be a Platform Admin, create it manually:

1. Go to **Authentication** → **Users** tab
2. Click "Add user"
3. Enter email and password
4. Click "Add user"
5. Copy the User UID

6. Go to **Firestore Database** → **Data** tab
7. Create a new collection called `users`
8. Add a document with the User UID as the document ID
9. Add these fields:
   ```
   uid: [User UID]
   email: [User email]
   name: "Platform Admin"
   phone: ""
   role: "PLATFORM_ADMIN"
   permissions: ["MANAGE_PLATFORM", "APPROVE_ORGANIZATIONS", "VIEW_PLATFORM_ANALYTICS"]
   organizationId: null
   createdAt: [Current timestamp]
   updatedAt: [Current timestamp]
   noShowCount: 0
   isActive: true
   ```

## Step 8: Enable Cloud Messaging (Optional)

For push notifications:

1. Go to **Project settings** → **Cloud Messaging** tab
2. Generate a new key pair for Web Push certificates
3. Copy the key pair
4. Update your Firebase config with the vapidKey

## Step 9: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`

3. Try logging in with the Platform Admin credentials

4. Test creating an organization as a new user

## Troubleshooting

### "Permission denied" errors
- Check that Firestore rules are deployed correctly
- Verify user has correct role and permissions in Firestore

### Authentication not working
- Verify environment variables are set correctly
- Check that Email/Password is enabled in Firebase Console
- Clear browser cache and try again

### Real-time updates not working
- Check browser console for errors
- Verify Firestore rules allow read access
- Ensure user is authenticated

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment-specific configs** - Different Firebase projects for dev/prod
3. **Review security rules** - Test rules thoroughly
4. **Enable App Check** - Protect against abuse (optional)
5. **Monitor usage** - Set up billing alerts

## Next Steps

After Firebase is configured:

1. Test authentication flow
2. Create test organization
3. Add test services
4. Test queue functionality
5. Implement remaining features from task.md
