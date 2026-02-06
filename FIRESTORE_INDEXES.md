# Firestore Indexes Setup Guide

This guide will help you create the necessary composite indexes in Firebase Firestore for the Dynamic Queue & Appointment Management System.

## Why Do We Need Indexes?

Firestore requires composite indexes when you query with:
- Multiple `where` clauses
- `where` + `orderBy` clauses
- Multiple `orderBy` clauses

Without these indexes, your queries will fail with an error message containing a link to create the index.

---

## Method 1: Automatic Index Creation (Recommended)

### Step-by-Step:

1. **Run the application** and use the features
2. **When a query fails**, Firestore will show an error in the console
3. **Click the link** in the error message - it will take you directly to Firebase Console
4. **Click "Create Index"** - Firebase will auto-configure it for you
5. **Wait 2-5 minutes** for the index to build

### Example Error:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

---

## Method 2: Manual Index Creation

### Go to Firebase Console:

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**

### Required Indexes:

#### Index 1: Users by Organization and Role
```
Collection: users
Fields:
  - organizationId (Ascending)
  - role (Ascending)
Query Scope: Collection
```

**Used by:** Employee Management, fetching employees for an organization

---

#### Index 2: Services by Organization and Status
```
Collection: services
Fields:
  - organizationId (Ascending)
  - isActive (Ascending)
Query Scope: Collection
```

**Used by:** Service Management, fetching active services

---

#### Index 3: Appointments by Customer with Time Ordering
```
Collection: appointments
Fields:
  - customerId (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

**Used by:** My Appointments, showing customer's appointments sorted by date

---

#### Index 4: Appointments by Organization, Service, and Date
```
Collection: appointments
Fields:
  - organizationId (Ascending)
  - serviceId (Ascending)
  - appointmentDate (Ascending)
Query Scope: Collection
```

**Used by:** Queue Management, filtering appointments by service and date

---

#### Index 5: Appointments by Organization and Date
```
Collection: appointments
Fields:
  - organizationId (Ascending)
  - appointmentDate (Ascending)
  - status (Ascending)
Query Scope: Collection
```

**Used by:** Analytics, filtering appointments by organization and status

---

#### Index 6: Organizations by Approval Status
```
Collection: organizations
Fields:
  - isApproved (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

**Used by:** Platform Admin Dashboard, viewing pending organizations

---

## Method 3: Using Firebase CLI (Advanced)

### 1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase:
```bash
firebase login
```

### 3. Initialize Firestore:
```bash
firebase init firestore
```

### 4. Edit `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "services",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "serviceId", "order": "ASCENDING" },
        { "fieldPath": "appointmentDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "appointmentDate", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "organizations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isApproved", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 5. Deploy Indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Verification

### Check Index Status:

1. Go to Firebase Console → Firestore → Indexes
2. You should see all indexes listed
3. Status should be **"Enabled"** (green)
4. If status is **"Building"**, wait 2-5 minutes

### Test Queries:

After indexes are created, test these features:
- ✅ Employee Management (load employees)
- ✅ Service Management (load services)
- ✅ My Appointments (load appointments)
- ✅ Queue Control (load queue)
- ✅ Platform Admin (load organizations)

---

## Troubleshooting

### Index Building Takes Too Long
- Small datasets: 1-2 minutes
- Large datasets: 5-10 minutes
- If stuck for >15 minutes, delete and recreate

### Query Still Failing
- Check the error message for the exact index needed
- Click the auto-generated link in the error
- Verify field names match exactly (case-sensitive)

### Index Already Exists Error
- Go to Firestore → Indexes
- Delete the duplicate index
- Create a new one

---

## Cost Considerations

**Indexes are FREE for:**
- Read operations
- Write operations
- Storage (minimal cost)

**Best Practices:**
- Only create indexes you actually use
- Delete unused indexes to save storage
- Monitor index usage in Firebase Console

---

## Quick Reference

| Feature | Collection | Fields | Order |
|---------|-----------|--------|-------|
| Employee List | users | organizationId, role | ASC, ASC |
| Service List | services | organizationId, isActive | ASC, ASC |
| My Appointments | appointments | customerId, createdAt | ASC, DESC |
| Queue by Service | appointments | organizationId, serviceId, appointmentDate | ASC, ASC, ASC |
| Analytics | appointments | organizationId, appointmentDate, status | ASC, ASC, ASC |
| Pending Orgs | organizations | isApproved, createdAt | ASC, DESC |

---

## Support

If you encounter issues:
1. Check Firebase Console → Firestore → Indexes
2. Look for error messages in browser console
3. Click the auto-generated index creation link
4. Wait for indexes to build (2-5 minutes)

**Remember:** The easiest way is to let Firebase auto-create indexes when queries fail!
