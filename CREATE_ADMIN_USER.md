# 🔑 Quick Admin User Setup

## **Option 1: Manual Setup (Recommended)**

### Step 1: Register a New User
1. **Go to**: `http://localhost:5173/auth/signup` (or your app URL)
2. **Create account with**:
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Name: `Admin User`
   - Complete the registration

### Step 2: Update User Role in Firebase
1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Go to**: Firestore Database
3. **Navigate to**: `users` collection
4. **Find your user document** (use the email to identify)
5. **Edit the document** and change:
   ```json
   {
     "role": "admin"
   }
   ```
6. **Save the changes**

### Step 3: Refresh and Access Admin Features
1. **Refresh your browser** or log out and back in
2. **Go to**: Settings page (`/settings`)
3. **You should now see an "Admin" tab** in the settings
4. **Click Admin tab** to access all admin features

---

## **Option 2: Direct Firebase Console Setup**

### Create User in Firebase Auth
1. **Firebase Console** > **Authentication** > **Users**
2. **Add User**:
   - Email: `admin@test.com`
   - Password: `Admin123!`
3. **Copy the User UID**

### Create User Document in Firestore
1. **Firestore Database** > **users** collection
2. **Add Document** with **Document ID = User UID**
3. **Add fields**:
   ```json
   {
     "email": "admin@test.com",
     "firstName": "Admin",
     "lastName": "User",
     "role": "admin",
     "phone": "+1-555-0100",
     "licenseNumber": "ADMIN-001",
     "createdAt": "2024-08-20T12:00:00Z",
     "updatedAt": "2024-08-20T12:00:00Z"
   }
   ```

---

## **🎯 Admin Features Available:**

Once logged in as admin, you'll have access to:

- **🏢 Insurance Carriers**: Manage insurance companies
- **🔢 Number Formats**: Configure quote/policy prefixes  
- **👥 User Management**: CRUD for all users
- **📋 Product Types**: Manage insurance products
- **🎛️ Dropdown Values**: Configure app-wide options
- **💰 Currency Settings**: Global currency configuration
- **📊 User Activity**: View activity logs

### Access Methods:
1. **Settings > Admin Tab**: Quick access from main settings
2. **Direct URL**: `/settings/admin` for full admin dashboard
3. **Individual pages**: `/settings/admin/carriers`, `/settings/admin/users`, etc.

---

## **🔐 Security Note:**
- Admin users have **full system access**
- Change default passwords immediately
- Only grant admin access to trusted users
- Admin activities should be audited regularly 