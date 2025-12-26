# Test Credentials for Insurance Broker Pro

## Overview
This document contains test credentials for different user roles in the Insurance Broker Pro application. **These are for development/testing purposes only.**

## Test Accounts

### 1. Admin User
- **Email:** admin@insurancebroker.pro
- **Password:** Admin123!
- **Role:** Administrator
- **Access:** Full system access, user management, all reports
- **Name:** Admin User

### 2. Senior Broker
- **Email:** broker@insurancebroker.pro
- **Password:** Broker123!
- **Role:** Senior Broker
- **Access:** All client management, quotes, policies, tasks, documents, reports
- **Name:** Sarah Johnson
- **License:** LIC-2024-001

### 3. Junior Broker
- **Email:** junior@insurancebroker.pro
- **Password:** Junior123!
- **Role:** Junior Broker
- **Access:** Limited client management, basic quotes, assigned tasks
- **Name:** Mike Chen
- **License:** LIC-2024-002

### 4. Client Representative
- **Email:** rep@insurancebroker.pro
- **Password:** Rep123!
- **Role:** Client Representative
- **Access:** Client communication, document management, task assignments
- **Name:** Emily Rodriguez

### 5. Demo User
- **Email:** demo@insurancebroker.pro
- **Password:** Demo123!
- **Role:** Demo Account
- **Access:** Read-only access to sample data
- **Name:** Demo User

## Quick Test Account Creation

Since Firebase Authentication is set up, you can create these accounts by:

1. **Using the Sign-Up Form:**
   - Go to `/auth/signup`
   - Use the credentials above
   - The app will create the account with default "broker" role

2. **For Google Sign-In Testing:**
   - Use any Google account
   - The app will create a new user profile automatically

## Default App Behavior

- **New Users:** Automatically assigned "broker" role
- **Profile Creation:** User profiles are created in Firestore on first sign-up
- **Sample Data:** Mock data is available for testing all features
- **No Real Payments:** All financial data is simulated

## Testing Different Features

### Authentication Flow
1. Test signup with `demo@insurancebroker.pro` / `Demo123!`
2. Test login/logout
3. Test password reset functionality
4. Test Google OAuth (if configured)

### Dashboard & Navigation
1. View dashboard with sample metrics
2. Navigate through all protected routes
3. Test mobile responsive design
4. Test sidebar navigation

### Client Management
1. View clients list with pagination
2. Test search and filtering
3. View individual client details
4. Test client creation (mock data)

### Quotes & Policies
1. Browse quotes with different statuses
2. View policy details and renewals
3. Test filtering by type and status
4. Mock quote comparisons

### Tasks & Workflow
1. View tasks with priorities
2. Test task status updates
3. Filter by client and priority
4. Test task completion

### Documents
1. Test file upload simulation
2. View documents by category
3. Test search functionality
4. Test document viewer (mock)

### Reports & Analytics
1. View business overview reports
2. Test different report types
3. View charts and metrics
4. Test report generation

### Settings
1. Update profile information
2. Configure notification preferences
3. Test security settings
4. Test preference persistence

## Security Notes

- **Development Only:** These credentials are for development/testing
- **No Real Data:** All data is simulated for demonstration
- **Firebase Rules:** Firestore security rules are configured for testing
- **Password Policy:** Follows standard security practices

## Support

If you encounter any issues with these test accounts:
1. Check the browser console for errors
2. Verify Firebase configuration
3. Ensure all environment variables are set
4. Check network connectivity

---

**Important:** In production, implement proper user management with:
- Email verification
- Strong password policies
- Role-based access control
- Audit logging
- Session management 