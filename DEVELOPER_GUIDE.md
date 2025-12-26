# 🛠️ Developer Guide - X Insurance Brokers Platform

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Development Workflow](#development-workflow)
- [API Integration](#api-integration)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Architecture Overview

X Insurance Brokers is built using a modern, scalable architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   External      │
│   (SvelteKit)   │◄──►│   (Firebase)     │◄──►│   Services      │
│                 │    │                  │    │   (Groq AI)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components
- **Frontend**: SvelteKit with TypeScript
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **AI Engine**: Groq API for intelligent features
- **Styling**: TailwindCSS with custom components
- **State Management**: Svelte stores
- **Build Tool**: Vite

---

## Technology Stack

### Frontend
- **Framework**: SvelteKit 2.0
- **Language**: TypeScript
- **Styling**: TailwindCSS 3.4
- **Icons**: Heroicons
- **Charts**: Chart.js
- **Validation**: Custom form validation

### Backend
- **Authentication**: Firebase Auth
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Functions**: Firebase Functions
- **Analytics**: Firebase Analytics

### AI & External Services
- **AI Provider**: Groq API
- **Models**: Llama 3.1 70B, Mixtral 8x7B
- **Use Cases**: Risk assessment, document analysis, chat support

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier

---

## Project Structure

```
insurance-broker-app/
├── src/
│   ├── app.css                 # Global styles
│   ├── app.html               # HTML template
│   ├── lib/
│   │   ├── components/        # Reusable components
│   │   │   ├── ai/           # AI-related components
│   │   │   ├── dashboard/    # Dashboard widgets
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # UI components
│   │   ├── config/           # Configuration files
│   │   │   └── firebase.ts   # Firebase configuration
│   │   ├── services/         # Business logic services
│   │   │   ├── auth.ts       # Authentication service
│   │   │   ├── clients.ts    # Client management
│   │   │   ├── groq.ts       # AI service integration
│   │   │   └── currency.ts   # Currency utilities
│   │   ├── types/            # TypeScript type definitions
│   │   │   └── index.ts      # Core types
│   │   └── utils/            # Utility functions
│   └── routes/               # SvelteKit routes
│       ├── (protected)/      # Protected routes (auth required)
│       │   ├── admin/        # Admin-only pages
│       │   ├── dashboard/    # Main dashboard
│       │   ├── clients/      # Client management
│       │   ├── quotes/       # Quote management
│       │   ├── policies/     # Policy management
│       │   ├── tasks/        # Task management
│       │   ├── documents/    # Document management
│       │   ├── reports/      # Analytics & reports
│       │   └── settings/     # Settings & configuration
│       ├── customer/         # Customer portal
│       │   ├── dashboard/    # Customer dashboard
│       │   ├── apply/        # Insurance applications
│       │   ├── policies/     # Policy viewing
│       │   ├── claims/       # Claims management
│       │   └── support/      # Customer support
│       ├── auth/             # Authentication pages
│       │   ├── login/        # Broker/admin login
│       │   ├── signup/       # Registration
│       │   └── reset-password/ # Password reset
│       └── +layout.svelte    # Root layout
├── static/                   # Static assets
├── firebase.json            # Firebase configuration
├── firestore.rules         # Firestore security rules
├── package.json            # Dependencies
├── svelte.config.js        # Svelte configuration
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd insurance-broker-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env` file:
```env
# Firebase Configuration
PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
PUBLIC_FIREBASE_APP_ID=your-app-id

# Groq AI Configuration
VITE_GROQ_API_KEY=gsk_your_groq_api_key
VITE_GROQ_API_URL=https://api.groq.com/openai/v1

# Application Configuration
NODE_ENV=development
PUBLIC_APP_URL=http://localhost:5173
```

### 4. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### 5. Start Development Server
```bash
npm run dev
```

Application will be available at `http://localhost:5173`

---

## Development Workflow

### 1. Code Structure Guidelines

#### Component Organization
```typescript
// Component structure
<script lang="ts">
  // Imports
  import { component } from 'svelte';
  
  // Props and exports
  export let prop: string;
  
  // Reactive declarations
  $: computed = prop.toUpperCase();
  
  // Functions
  function handleClick() {
    // Logic here
  }
</script>

<!-- HTML template -->
<div class="component-wrapper">
  <!-- Content -->
</div>

<style>
  /* Component-specific styles */
</style>
```

#### Service Layer Pattern
```typescript
// services/example.ts
export class ExampleService {
  private static instance: ExampleService;
  
  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
  
  async getData(): Promise<Data[]> {
    // Service logic
  }
}

export const exampleService = ExampleService.getInstance();
```

### 2. State Management

#### Svelte Stores
```typescript
// stores/example.ts
import { writable, derived } from 'svelte/store';

export const data = writable<Data[]>([]);
export const filteredData = derived(
  data,
  $data => $data.filter(item => item.active)
);
```

#### Store Usage in Components
```typescript
<script lang="ts">
  import { data } from '$lib/stores/example';
  
  // Subscribe to store
  $: console.log($data);
  
  // Update store
  function updateData(newData: Data[]) {
    data.set(newData);
  }
</script>
```

### 3. Routing & Navigation

#### Protected Routes
```typescript
// routes/(protected)/+layout.ts
import { redirect } from '@sveltejs/kit';
import { currentUser } from '$lib/services/auth';

export async function load({ url }) {
  // Check authentication
  if (!currentUser) {
    throw redirect(302, '/auth/login');
  }
  
  return {
    user: currentUser
  };
}
```

#### Dynamic Routes
```typescript
// routes/client/[id]/+page.ts
export async function load({ params }) {
  const client = await getClient(params.id);
  
  if (!client) {
    throw error(404, 'Client not found');
  }
  
  return {
    client
  };
}
```

---

## API Integration

### 1. Firebase Integration

#### Authentication Service
```typescript
// lib/services/auth.ts
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { auth } from '$lib/config/firebase';

export class AuthService {
  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }
  
  async signUp(userData: UserData) {
    const result = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    await this.createUserProfile(result.user, userData);
    return result.user;
  }
}
```

#### Firestore Integration
```typescript
// lib/services/clients.ts
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';

export class ClientService {
  private collection = collection(db, 'clients');
  
  async getClients(): Promise<Client[]> {
    const snapshot = await getDocs(this.collection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));
  }
  
  async createClient(clientData: Partial<Client>): Promise<string> {
    const docRef = await addDoc(this.collection, clientData);
    return docRef.id;
  }
}
```

### 2. Groq AI Integration

#### AI Service
```typescript
// lib/services/groq.ts
import { VITE_GROQ_API_KEY, VITE_GROQ_API_URL } from '$env/static/private';

export class GroqService {
  private apiKey = VITE_GROQ_API_KEY;
  private baseUrl = VITE_GROQ_API_URL;
  
  async analyzeRisk(data: RiskData): Promise<RiskAssessment> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an insurance risk assessment expert.'
          },
          {
            role: 'user',
            content: `Analyze this risk data: ${JSON.stringify(data)}`
          }
        ]
      })
    });
    
    return response.json();
  }
}
```

---

## Database Schema

### Firestore Collections

#### Users Collection
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'broker' | 'assistant' | 'customer';
  licenseNumber?: string;
  phone?: string;
  address?: Address;
  preferences?: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Clients Collection
```typescript
interface Client {
  id: string;
  brokerId: string; // Reference to broker
  companyName: string;
  contactPerson: ContactPerson;
  industry: string;
  riskLevel: 'low' | 'medium' | 'high';
  address: Address;
  phone: string;
  email: string;
  policies: string[]; // Policy IDs
  status: 'active' | 'inactive' | 'prospect';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Quotes Collection
```typescript
interface Quote {
  id: string;
  brokerId: string;
  clientId: string;
  type: 'auto' | 'home' | 'life' | 'health' | 'business' | 'renters';
  status: 'draft' | 'pending' | 'approved' | 'declined' | 'expired';
  premium: number;
  currency: string;
  coverage: Coverage[];
  carrierQuotes: CarrierQuote[];
  validUntil: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Policies Collection
```typescript
interface Policy {
  id: string;
  brokerId: string;
  clientId: string;
  quoteId?: string;
  policyNumber: string;
  type: InsuranceType;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  premium: number;
  currency: string;
  coverage: Coverage[];
  carrier: string;
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  renewalDate?: Timestamp;
  documents: string[]; // Document IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security Rules

#### Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can read/write all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Brokers can read/write their own data
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
        resource.data.brokerId == request.auth.uid;
    }
    
    match /quotes/{quoteId} {
      allow read, write: if request.auth != null && 
        resource.data.brokerId == request.auth.uid;
    }
    
    match /policies/{policyId} {
      allow read, write: if request.auth != null && 
        resource.data.brokerId == request.auth.uid;
    }
  }
}
```

---

## Authentication & Security

### 1. Role-Based Access Control

#### Route Protection
```typescript
// lib/utils/auth-guard.ts
export function requireRole(allowedRoles: UserRole[]) {
  return (user: User | null) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };
}

// Usage in layout
export const load = async ({ url, locals }) => {
  const user = await getCurrentUser();
  
  if (url.pathname.startsWith('/admin')) {
    if (!requireRole(['admin'])(user)) {
      throw redirect(302, '/dashboard');
    }
  }
  
  return { user };
};
```

#### Component-Level Authorization
```typescript
<script lang="ts">
  import { currentUser } from '$lib/services/auth';
  
  $: canEdit = $currentUser?.role === 'admin' || 
               $currentUser?.role === 'broker';
</script>

{#if canEdit}
  <button on:click={editItem}>Edit</button>
{/if}
```

### 2. Data Security

#### Input Validation
```typescript
// lib/utils/validation.ts
export const validators = {
  email: (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Invalid email format';
  },
  
  required: (value: any) => {
    return value && value.toString().trim() ? null : 'This field is required';
  },
  
  phone: (value: string) => {
    const regex = /^\+?[\d\s\-\(\)]+$/;
    return regex.test(value) ? null : 'Invalid phone number';
  }
};
```

#### Secure API Calls
```typescript
// lib/utils/api.ts
export async function secureApiCall(endpoint: string, options: RequestInit = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');
  
  const token = await user.getIdToken();
  
  return fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}
```

---

## Testing

### 1. Unit Testing Setup

#### Vitest Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts']
  }
});
```

#### Test Examples
```typescript
// src/lib/services/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth';

describe('AuthService', () => {
  it('should sign in user with valid credentials', async () => {
    const authService = new AuthService();
    const mockUser = { uid: '123', email: 'test@example.com' };
    
    vi.spyOn(authService, 'signIn').mockResolvedValue(mockUser);
    
    const result = await authService.signIn('test@example.com', 'password');
    expect(result).toEqual(mockUser);
  });
});
```

### 2. Component Testing

```typescript
// src/lib/components/ClientCard.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ClientCard from './ClientCard.svelte';

describe('ClientCard', () => {
  it('renders client information correctly', () => {
    const client = {
      id: '1',
      companyName: 'Test Company',
      contactPerson: { firstName: 'John', lastName: 'Doe' }
    };
    
    render(ClientCard, { props: { client } });
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 3. Test Users & Data

#### Creating Test Data
```typescript
// src/test/test-data.ts
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'broker',
  ...overrides
});

export const createTestClient = (overrides = {}) => ({
  id: 'test-client-1',
  brokerId: 'test-user-1',
  companyName: 'Test Company',
  industry: 'Technology',
  riskLevel: 'medium',
  ...overrides
});
```

---

## Deployment

### 1. Firebase Hosting

#### Build for Production
```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

#### Firebase Deployment
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with functions and firestore rules
firebase deploy
```

#### Firebase Configuration
```json
// firebase.json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### 2. Environment Variables

#### Production Environment
```env
# Production .env
NODE_ENV=production
PUBLIC_APP_URL=https://your-domain.com
PUBLIC_FIREBASE_API_KEY=prod-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-prod-project-id
VITE_GROQ_API_KEY=prod-groq-key
```

### 3. CI/CD Pipeline

#### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

---

## Contributing

### 1. Development Guidelines

#### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for public APIs

#### Pull Request Process
1. Create feature branch from `main`
2. Make changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

#### Commit Message Format
```
type(scope): description

feat(auth): add Google OAuth integration
fix(dashboard): resolve chart rendering issue
docs(api): update authentication documentation
```

### 2. Issue Reporting

#### Bug Reports
- Use bug report template
- Include reproduction steps
- Provide browser/OS information
- Include relevant error messages

#### Feature Requests
- Use feature request template
- Describe the problem/need
- Propose solution approach
- Consider implementation impact

---

## Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase project
firebase projects:list

# Login to Firebase
firebase login

# Set active project
firebase use your-project-id
```

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear SvelteKit cache
rm -rf .svelte-kit
npm run dev
```

#### Type Errors
```bash
# Regenerate types
npm run check

# Update TypeScript
npm update typescript @types/node
```

---

## Resources

### Documentation Links
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Community & Support
- [SvelteKit Discord](https://svelte.dev/chat)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/sveltekit)

---

*Happy coding! 🚀* 