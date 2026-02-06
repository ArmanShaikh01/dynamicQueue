# Dynamic Queue & Appointment Management System

A comprehensive multi-tenant, role-based, real-time web platform for managing appointments and queues across multiple organizations.

## 🚀 Features

### Multi-Tenant Architecture
- Complete data isolation by organization
- Support for multiple organizations on one platform
- Firestore security rules enforce organization-level access

### Role-Based Access Control (RBAC)
- **Platform Admin**: Manage entire platform and approve organizations
- **Organization Admin**: Create and manage organization, services, and employees
- **Employee/Operator**: Scan QR codes, manage queues, call tokens
- **Customer**: Book appointments, view live queue, track position

### Dynamic Slot Generation
- Automatic slot calculation based on:
  - Working hours
  - Staff count
  - Average service time
  - Break times
  - Overbooking limits

### Queue Management
- Real-time queue updates using Firestore listeners
- QR code-based check-in
- Operator-controlled token calling
- No-show handling with automatic tracking
- Estimated wait time calculation

### Modern UI/UX
- Vibrant gradient color scheme
- Glassmorphism effects
- Smooth animations and transitions
- Mobile-responsive design
- Dark mode optimized

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Modern web browser

## 🛠️ Installation

### 1. Clone or Navigate to Project

```bash
cd "c:\\Users\\M SAAD SHAIKH\\Videos\\vvp\\Dynamic Queue & Appointment Management System"
```

**Note**: The folder name contains an ampersand (&) which can cause issues with PowerShell. To run commands, use one of these methods:

**Method 1: Use CMD instead of PowerShell**
```cmd
cmd
npm install
npm run dev
```

**Method 2: Rename the folder (recommended)**
```bash
# Rename to remove ampersand
cd ..
ren "Dynamic Queue & Appointment Management System" "Dynamic-Queue-Appointment-System"
cd Dynamic-Queue-Appointment-System
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication** with Email/Password
4. Create a **Firestore Database** in production mode
5. Get your Firebase configuration

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

### 5. Deploy Firestore Security Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in project:
   ```bash
   firebase init firestore
   ```

4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## 📖 User Guide

### For Customers

1. **Sign Up**: Create account with email and password
2. **Search Organizations**: Browse and search for organizations
3. **Book Appointment**: Select service, choose date and time slot
4. **Get QR Code**: Receive QR code for check-in
5. **Track Queue**: View live queue position and estimated wait time

### For Organization Admins

1. **Sign Up**: Create account as "Organization Admin"
2. **Setup Organization**: 
   - Enter organization details
   - Configure working hours
   - Add break times
3. **Wait for Approval**: Platform admin must approve organization
4. **Manage Services**: Add services with average time and staff count
5. **Manage Employees**: Add staff and assign permissions

### For Operators/Employees

1. **Login**: Use employee credentials
2. **View Queue**: See today's active queues
3. **Scan QR Code**: Check in customers (feature to be added)
4. **Call Next Token**: Call next customer in queue
5. **Mark Complete**: Mark service as completed
6. **Handle No-Shows**: Mark customers who don't arrive

### For Platform Admins

1. **Login**: Use platform admin credentials
2. **Approve Organizations**: Review and approve new organizations
3. **View Analytics**: Monitor platform-wide metrics

## 🗂️ Project Structure

```
src/
├── config/
│   └── firebase.js           # Firebase initialization
├── contexts/
│   └── AuthContext.jsx       # Authentication context
├── components/
│   └── auth/
│       └── ProtectedRoute.jsx # Route protection
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── organization/
│   │   ├── OrganizationSetup.jsx
│   │   └── OrganizationDashboard.jsx
│   ├── customer/
│   │   └── OrganizationSearch.jsx
│   └── operator/
│       └── QueueControl.jsx
├── utils/
│   ├── permissions.js        # RBAC utilities
│   ├── slotGenerator.js      # Slot calculation
│   ├── queueManager.js       # Queue operations
│   ├── notifications.js      # Notification system
│   ├── dateHelpers.js        # Date/time utilities
│   └── validators.js         # Input validation
├── models/
│   └── schema.js             # Firestore schema definitions
├── styles/
│   └── index.css             # Global styles
├── App.jsx                   # Main app component
└── main.jsx                  # Entry point
```

## 🔐 Security

- Firebase Authentication for user management
- Firestore security rules enforce multi-tenant isolation
- Role-based access control at application and database level
- All sensitive data protected by organizationId

## 🎨 Design System

### Color Palette
- Primary: Purple gradient (#667eea → #764ba2)
- Secondary: Pink gradient (#f093fb → #f5576c)
- Success: Green gradient
- Warning: Yellow gradient
- Danger: Red gradient

### Typography
- Font: Inter (Google Fonts)
- Headings: Gradient text effect
- Body: Clean, readable spacing

### Components
- Glassmorphism cards
- Smooth hover animations
- Responsive grid layouts
- Modern form inputs

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Touch-friendly interface
- Optimized for all screen sizes

## 🔄 Real-Time Features

- Live queue updates using Firestore listeners
- Instant notification delivery
- Real-time position tracking
- Automatic queue shifting

## 🚧 Remaining Features to Implement

- [ ] QR code scanner component (camera-based)
- [ ] Service management page
- [ ] Employee management interface
- [ ] Platform admin dashboard
- [ ] Analytics and reporting
- [ ] Appointment booking flow with QR generation
- [ ] Email/SMS notifications
- [ ] PWA support
- [ ] Advanced search and filters

## 🐛 Known Issues

1. **Folder Name Issue**: The folder name contains an ampersand (&) which causes PowerShell command issues. Use CMD or rename the folder.
2. **Peer Dependencies**: React 19 has peer dependency warnings with qrcode.react. Use `--legacy-peer-deps` flag.

## 📝 License

This project is created for educational/demonstration purposes.

## 👥 Support

For issues or questions, please refer to the implementation plan and task documentation in the `.gemini/antigravity/brain/` directory.

## 🎯 Next Steps

1. Create Firebase project and configure environment variables
2. Deploy Firestore security rules
3. Create first Platform Admin user manually in Firestore
4. Test authentication flow
5. Create test organization
6. Implement remaining features from task.md
