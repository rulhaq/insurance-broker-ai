# Admin Setup Guide

## 🔧 Step 1: Create Admin User Account

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Navigate to Authentication > Users**
3. **Click "Add User"**
4. **Create admin account**:
   - Email: `admin@xinsurancebrokers.com`
   - Password: `Admin123!` (change after first login)
   - Note the User UID that gets generated

## 📊 Step 2: Set Admin Role in Firestore

1. **Go to Firestore Database**
2. **Navigate to `users` collection**
3. **Create document with ID = User UID from step 1**
4. **Add these fields**:

```json
{
  "email": "admin@xinsurancebrokers.com",
  "firstName": "Admin",
  "lastName": "User", 
  "role": "admin",
  "licenseNumber": "ADMIN-001",
  "phone": "+1-555-0100",
  "avatar": "",
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z",
  "preferences": {
    "theme": "light",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "taskReminders": true,
      "renewalAlerts": true,
      "quotesExpiring": true
    },
    "language": "en",
    "dashboardLayout": ["summary", "tasks", "recent_clients", "quotes"],
    "timezone": "UTC"
  },
  "activity": {
    "lastLogin": "2024-08-20T12:00:00Z",
    "loginCount": 1,
    "lastAction": "2024-08-20T12:00:00Z",
    "actionsToday": 0
  }
}
```

## 👥 Step 3: Create Sample Broker Users

**Create documents in `users` collection**:

### Broker 1: John Smith
```json
{
  "email": "john.broker@xinsurancebrokers.com",
  "firstName": "John",
  "lastName": "Smith",
  "role": "broker",
  "licenseNumber": "BR-001",
  "phone": "+1-555-0101",
  "avatar": "",
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z",
  "preferences": {
    "theme": "light",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "taskReminders": true,
      "renewalAlerts": true,
      "quotesExpiring": true
    },
    "language": "en",
    "dashboardLayout": ["summary", "tasks", "recent_clients", "quotes"],
    "timezone": "America/New_York"
  },
  "activity": {
    "lastLogin": "2024-08-20T12:00:00Z",
    "loginCount": 15,
    "lastAction": "2024-08-20T12:00:00Z",
    "actionsToday": 3
  }
}
```

## 📋 Step 4: Create Sample Data

### Clients Collection

**Document 1**:
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@techcorp.com",
  "phone": "+1-555-1001",
  "businessName": "TechCorp Solutions LLC",
  "industry": "Technology",
  "employeeCount": 45,
  "annualRevenue": 2500000,
  "status": "active",
  "brokerId": "broker-001", // Use actual broker UID
  "tags": ["technology", "high-priority"],
  "notes": "Growing tech company, expanding internationally.",
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z",
  "address": {
    "street": "123 Tech Avenue",
    "city": "San Francisco", 
    "state": "California",
    "zipCode": "94102",
    "country": "United States"
  },
  "riskAssessment": {
    "level": "MEDIUM",
    "score": 65,
    "factors": ["Technology industry", "Growth phase"],
    "lastUpdated": "2024-08-20T12:00:00Z",
    "recommendations": ["Consider cyber liability insurance"]
  }
}
```

**Document 2**:
```json
{
  "firstName": "Mohammed",
  "lastName": "Al-Rashid",
  "email": "m.alrashid@dubaifinance.ae", 
  "phone": "+971-4-555-2001",
  "businessName": "Dubai Finance Group",
  "industry": "Finance",
  "employeeCount": 120,
  "annualRevenue": 8500000,
  "status": "active",
  "brokerId": "broker-001",
  "tags": ["finance", "middle-east", "high-value"],
  "notes": "Established financial services company in Dubai.",
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z",
  "address": {
    "street": "Sheikh Zayed Road, DIFC",
    "city": "Dubai",
    "state": "Dubai", 
    "zipCode": "00000",
    "country": "United Arab Emirates"
  },
  "riskAssessment": {
    "level": "LOW",
    "score": 35,
    "factors": ["Financial services", "Established business"],
    "lastUpdated": "2024-08-20T12:00:00Z",
    "recommendations": ["Professional indemnity insurance"]
  }
}
```

### Quotes Collection

```json
{
  "quoteNumber": "QUO-2024-001",
  "clientId": "client-001", // Use actual client document ID
  "clientName": "Sarah Johnson",
  "brokerId": "broker-001", // Use actual broker UID
  "carrier": "Zurich Insurance",
  "coverageType": "cyber_liability",
  "status": "quoted",
  "premium": {
    "annual": 15000,
    "monthly": 1250,
    "currency": "USD"
  },
  "coverage": {
    "limits": {
      "perOccurrence": 2000000,
      "aggregate": 4000000
    },
    "deductible": 10000
  },
  "dates": {
    "effective": "2024-09-01T00:00:00Z",
    "expiration": "2025-09-01T00:00:00Z"
  },
  "commission": {
    "rate": 15,
    "amount": 2250
  },
  "notes": "Cyber liability coverage for growing tech company.",
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z"
}
```

### Policies Collection

```json
{
  "policyNumber": "POL-2024-001",
  "clientId": "client-002", // Use actual client document ID  
  "clientName": "Mohammed Al-Rashid",
  "brokerId": "broker-001", // Use actual broker UID
  "carrier": "AIG",
  "productType": "professional_liability",
  "status": "active",
  "premium": {
    "annual": 25000,
    "monthly": 2083,
    "currency": "USD"
  },
  "coverage": {
    "limits": {
      "perOccurrence": 5000000,
      "aggregate": 10000000
    },
    "deductible": 25000
  },
  "dates": {
    "effective": "2024-01-01T00:00:00Z",
    "expiration": "2025-01-01T00:00:00Z"
  },
  "commission": {
    "rate": 18,
    "amount": 4500
  },
  "notes": "Professional indemnity coverage for financial services company.",
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z"
}
```

### Tasks Collection

```json
{
  "title": "Follow up on TechCorp cyber liability quote",
  "description": "Sarah Johnson requested additional coverage details.",
  "priority": "high", 
  "status": "pending",
  "dueDate": "2024-08-25T00:00:00Z",
  "brokerId": "broker-001", // Use actual broker UID
  "clientId": "client-001", // Use actual client document ID
  "clientName": "Sarah Johnson", 
  "category": "follow_up",
  "assignedTo": "broker-001", // Use actual broker UID
  "estimatedHours": 2,
  "createdAt": "2024-08-20T12:00:00Z",
  "updatedAt": "2024-08-20T12:00:00Z"
}
```

## ✅ Step 5: Test Admin Functionality

1. **Login as admin**: `admin@xinsurancebrokers.com`
2. **Navigate to each page**:
   - Dashboard: Should show ALL data 
   - Clients: Should show all clients with broker IDs
   - Quotes: Should show all quotes with broker IDs  
   - Policies: Should show all policies with broker IDs
   - Tasks: Should show all tasks with broker IDs
   - Documents: Should show all documents with broker IDs
   - Reports: Should show all reports with broker IDs

3. **Test CRUD operations**: Admin should be able to Edit/Delete any record

## 🎯 Result

- ✅ Admin sees ALL data across the entire system
- ✅ Admin has full CRUD control over everything  
- ✅ Brokers see only their own data
- ✅ All role-based permissions working correctly
- ✅ Real Firebase data, no mock data
- ✅ Production-ready application 