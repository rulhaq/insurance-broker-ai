import { authService } from '$lib/services/auth';

export async function createTestUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'broker' | 'admin';
}) {
  try {
    console.log('Creating test user:', userData.email);
    
    const user = await authService.signUp({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'broker'
    });
    
    console.log('Test user created successfully:', user);
    return user;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

export async function signInTestUser(email: string, password: string) {
  try {
    console.log('Signing in test user:', email);
    
    const user = await authService.signIn({
      email,
      password
    });
    
    console.log('Test user signed in successfully:', user);
    return user;
  } catch (error) {
    console.error('Failed to sign in test user:', error);
    throw error;
  }
}

// Pre-defined test users
export const testUsers = [
  {
    email: 'demo@insurancebroker.pro',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'User',
    role: 'broker' as const
  },
  {
    email: 'admin@insurancebroker.pro',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const
  },
  {
    email: 'broker@insurancebroker.pro',
    password: 'Broker123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'broker' as const
  }
];

export async function createAllTestUsers() {
  console.log('Creating all test users...');
  
  for (const userData of testUsers) {
    try {
      await createTestUser(userData);
      console.log(`✅ Created: ${userData.email}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️  Already exists: ${userData.email}`);
      } else {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }
  }
  
  console.log('Test user creation complete!');
} 