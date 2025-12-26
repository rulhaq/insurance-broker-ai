import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	sendPasswordResetEmail,
	updateProfile,
	GoogleAuthProvider,
	signInWithPopup,
	sendEmailVerification,
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider,
	type User as FirebaseUser
} from 'firebase/auth';
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	serverTimestamp,
	collection,
	addDoc
} from 'firebase/firestore';
import { auth, db } from '$lib/config/firebase';
import type { User, UserPreferences, UserActivity } from '$types';
import { writable } from 'svelte/store';

// Auth store
export const currentUser = writable<User | null>(null);
export const authLoading = writable<boolean>(true);
export const authError = writable<string | null>(null);

interface CreateUserData {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	role?: 'broker' | 'admin' | 'assistant' | 'customer';
	licenseNumber?: string;
	phone?: string;
	dateOfBirth?: string;
	// Company Information
	companyName?: string;
	jobTitle?: string;
	companySize?: string;
	industry?: string;
	// Address Information
	address?: {
		street: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
	};
	marketingOptIn?: boolean;
}

interface SignInData {
	email: string;
	password: string;
}

class AuthService {
	private unsubscribe: (() => void) | null = null;

	constructor() {
		this.initializeAuthListener();
	}

	// Initialize authentication state listener
	private initializeAuthListener(): void {
		this.unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			console.log('Auth state changed:', firebaseUser?.email || 'No user');
			authLoading.set(true);
			
			if (firebaseUser) {
				try {
					console.log('Getting user profile for:', firebaseUser.uid);
					let user = await this.getUserProfile(firebaseUser.uid);
					if (user) {
						console.log('User profile found:', user);
						currentUser.set(user);
						await this.updateUserActivity(firebaseUser.uid);
					} else {
						console.log('No user profile found, creating new one');
						// User exists in Firebase Auth but not in Firestore
						await this.createUserProfile(firebaseUser);
						const newUser = await this.getUserProfile(firebaseUser.uid);
						console.log('New user profile created:', newUser);
						currentUser.set(newUser);
					}
					authError.set(null);
				} catch (error) {
					console.error('Error loading user profile:', error);
					authError.set('Failed to load user profile');
					currentUser.set(null);
				}
			} else {
				console.log('No Firebase user, clearing current user');
				currentUser.set(null);
				authError.set(null);
			}
			
			console.log('Auth loading complete');
			authLoading.set(false);
		});
	}

	// Sign up with email and password
	async signUp(userData: CreateUserData): Promise<User> {
		try {
			authError.set(null);
			authLoading.set(true);

			const userCredential = await createUserWithEmailAndPassword(
				auth,
				userData.email,
				userData.password
			);

			// Update Firebase Auth profile
			await updateProfile(userCredential.user, {
				displayName: `${userData.firstName} ${userData.lastName}`
			});

			// Skip email verification for development
			// await sendEmailVerification(userCredential.user);

			// Create user profile in Firestore
			await this.createUserProfile(userCredential.user, userData);

			const user = await this.getUserProfile(userCredential.user.uid);
			if (!user) throw new Error('Failed to create user profile');

			currentUser.set(user);
			return user;
		} catch (error: any) {
			const errorMessage = this.getAuthErrorMessage(error.code);
			authError.set(errorMessage);
			throw new Error(errorMessage);
		} finally {
			authLoading.set(false);
		}
	}

	// Sign in with email and password
	async signIn(credentials: SignInData): Promise<User> {
		try {
			authError.set(null);
			authLoading.set(true);

			const userCredential = await signInWithEmailAndPassword(
				auth,
				credentials.email,
				credentials.password
			);

			const user = await this.getUserProfile(userCredential.user.uid);
			if (!user) throw new Error('User profile not found');

			await this.logAuthentication(userCredential.user, 'email', 'web');
			
			currentUser.set(user);
			return user;
		} catch (error: any) {
			const errorMessage = this.getAuthErrorMessage(error.code);
			authError.set(errorMessage);
			throw new Error(errorMessage);
		} finally {
			authLoading.set(false);
		}
	}

	// Sign in with Google
	async signInWithGoogle(): Promise<User> {
		try {
			authError.set(null);
			authLoading.set(true);

			const provider = new GoogleAuthProvider();
			provider.addScope('email');
			provider.addScope('profile');

			console.log('Starting Google sign-in...');
			const userCredential = await signInWithPopup(auth, provider);
			console.log('Google sign-in successful:', userCredential.user.email);
			
			// Check if user profile exists, create if not
			let user = await this.getUserProfile(userCredential.user.uid);
			if (!user) {
				console.log('Creating new user profile for:', userCredential.user.email);
				await this.createUserProfile(userCredential.user);
				user = await this.getUserProfile(userCredential.user.uid);
				console.log('User profile created:', user);
			} else {
				console.log('Existing user profile found:', user);
			}

			if (!user) throw new Error('Failed to load user profile');

			await this.logAuthentication(userCredential.user, 'google', 'web');
			
			currentUser.set(user);
			console.log('User set in store:', user);
			return user;
		} catch (error: any) {
			console.error('Google sign-in error:', error);
			const errorMessage = this.getAuthErrorMessage(error.code);
			authError.set(errorMessage);
			throw new Error(errorMessage);
		} finally {
			authLoading.set(false);
		}
	}

	// Sign out
	async signOut(): Promise<void> {
		try {
			authError.set(null);
			await signOut(auth);
			currentUser.set(null);
		} catch (error: any) {
			const errorMessage = 'Failed to sign out';
			authError.set(errorMessage);
			throw new Error(errorMessage);
		}
	}

	// Send password reset email
	async resetPassword(email: string): Promise<void> {
		try {
			authError.set(null);
			await sendPasswordResetEmail(auth, email);
		} catch (error: any) {
			const errorMessage = this.getAuthErrorMessage(error.code);
			authError.set(errorMessage);
			throw new Error(errorMessage);
		}
	}

	// Update user password
	async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
		try {
			if (!auth.currentUser) throw new Error('No authenticated user');

			// Re-authenticate user
			const credential = EmailAuthProvider.credential(
				auth.currentUser.email!,
				currentPassword
			);
			await reauthenticateWithCredential(auth.currentUser, credential);

			// Update password
			await updatePassword(auth.currentUser, newPassword);
		} catch (error: any) {
			const errorMessage = this.getAuthErrorMessage(error.code);
			throw new Error(errorMessage);
		}
	}

	// Update user profile - can accept uid or use current user
	async updateUserProfile(uidOrUpdates: string | Partial<User>, updates?: Partial<User>): Promise<User> {
		try {
			let targetUid: string;
			let profileUpdates: Partial<User>;

			// Handle overloaded parameters
			if (typeof uidOrUpdates === 'string') {
				targetUid = uidOrUpdates;
				profileUpdates = updates || {};
			} else {
				if (!auth.currentUser) throw new Error('No authenticated user');
				targetUid = auth.currentUser.uid;
				profileUpdates = uidOrUpdates;
			}

			const userRef = doc(db, 'users', targetUid);
			
			await updateDoc(userRef, {
				...profileUpdates,
				updatedAt: serverTimestamp() as any
			});

			// Update Firebase Auth profile if name changed and it's current user
			if (targetUid === auth.currentUser?.uid && (profileUpdates.firstName || profileUpdates.lastName)) {
				await updateProfile(auth.currentUser, {
					displayName: `${profileUpdates.firstName || ''} ${profileUpdates.lastName || ''}`.trim()
				});
			}

			const updatedUser = await this.getUserProfile(targetUid);
			if (!updatedUser) throw new Error('Failed to load updated profile');

			// Update store if it's current user
			if (targetUid === auth.currentUser?.uid) {
				currentUser.set(updatedUser);
			}
			
			return updatedUser;
		} catch (error: any) {
			console.error('Profile update error:', error);
			throw new Error('Failed to update profile');
		}
	}

	// Get user profile from Firestore
	private async getUserProfile(uid: string): Promise<User | null> {
		try {
			const userDoc = await getDoc(doc(db, 'users', uid));
			if (userDoc.exists()) {
				return { uid, ...userDoc.data() } as User;
			}
			return null;
		} catch (error) {
			console.error('Error fetching user profile:', error);
			return null;
		}
	}

	// Create user profile in Firestore
	private async createUserProfile(
		firebaseUser: FirebaseUser,
		additionalData?: Partial<CreateUserData>
	): Promise<void> {
		const defaultPreferences: UserPreferences = {
			theme: 'light',
			notifications: {
				email: true,
				push: true,
				sms: false,
				taskReminders: true,
				renewalAlerts: true,
				quotesExpiring: true
			},
			language: 'en',
			dashboardLayout: ['summary', 'tasks', 'recent_clients', 'quotes'],
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
		};

		const defaultActivity: UserActivity = {
			lastLogin: serverTimestamp() as any,
			loginCount: 1,
			lastAction: serverTimestamp() as any,
			actionsToday: 0
		};

		const userProfile: Omit<User, 'uid'> = {
			email: firebaseUser.email!,
			firstName: additionalData?.firstName || firebaseUser.displayName?.split(' ')[0] || '',
			lastName: additionalData?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
			role: additionalData?.role || 'customer', // Default to customer for new registrations
			licenseNumber: additionalData?.licenseNumber || '',
			phone: additionalData?.phone || '',
			avatar: firebaseUser.photoURL || '',
			createdAt: serverTimestamp() as any,
			updatedAt: serverTimestamp() as any,
			preferences: defaultPreferences,
			activity: defaultActivity
		};

		await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

		// Store additional customer data if provided
		if (additionalData?.dateOfBirth || additionalData?.address || additionalData?.marketingOptIn !== undefined || additionalData?.companyName) {
			const customerData: any = {};
			
			if (additionalData.dateOfBirth) {
				customerData.dateOfBirth = additionalData.dateOfBirth;
			}
			
			if (additionalData.address) {
				customerData.address = additionalData.address;
			}
			
			if (additionalData.marketingOptIn !== undefined) {
				customerData.marketingOptIn = additionalData.marketingOptIn;
			}

			// Store company information
			if (additionalData.companyName) {
				customerData.companyName = additionalData.companyName;
			}
			
			if (additionalData.jobTitle) {
				customerData.jobTitle = additionalData.jobTitle;
			}
			
			if (additionalData.companySize) {
				customerData.companySize = additionalData.companySize;
			}
			
			if (additionalData.industry) {
				customerData.industry = additionalData.industry;
			}

			// Store customer-specific data in a separate collection
			await setDoc(doc(db, 'customer_profiles', firebaseUser.uid), {
				...customerData,
				userId: firebaseUser.uid,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			});
		}
	}

	// Update user activity
	private async updateUserActivity(uid: string): Promise<void> {
		try {
			const userRef = doc(db, 'users', uid);
			const userDoc = await getDoc(userRef);
			
			if (userDoc.exists()) {
				const userData = userDoc.data();
				const today = new Date().toDateString();
				const lastLoginDate = userData.activity?.lastLogin?.toDate?.()?.toDateString();
				
				const updates: any = {
					'activity.lastLogin': serverTimestamp(),
					'activity.lastAction': serverTimestamp()
				};

				// Increment login count
				updates['activity.loginCount'] = (userData.activity?.loginCount || 0) + 1;

				// Reset daily actions if new day
				if (lastLoginDate !== today) {
					updates['activity.actionsToday'] = 0;
				}

				await updateDoc(userRef, updates);
			}
		} catch (error) {
			console.error('Error updating user activity:', error);
		}
	}

	// Log authentication event
	private async logAuthentication(
		user: FirebaseUser,
		provider: string,
		platform: string
	): Promise<void> {
		try {
			await addDoc(collection(db, 'auth_logs'), {
				userId: user.uid,
				email: user.email,
				provider,
				platform,
				timestamp: serverTimestamp(),
				userAgent: navigator.userAgent
			});
		} catch (error) {
			console.error('Error logging authentication:', error);
		}
	}

	// Get user-friendly error messages
	private getAuthErrorMessage(errorCode: string): string {
		switch (errorCode) {
			case 'auth/user-not-found':
				return 'No account found with this email address.';
			case 'auth/wrong-password':
				return 'Incorrect password.';
			case 'auth/email-already-in-use':
				return 'An account with this email already exists.';
			case 'auth/weak-password':
				return 'Password should be at least 6 characters.';
			case 'auth/invalid-email':
				return 'Please enter a valid email address.';
			case 'auth/user-disabled':
				return 'This account has been disabled.';
			case 'auth/too-many-requests':
				return 'Too many failed attempts. Please try again later.';
			case 'auth/network-request-failed':
				return 'Network error. Please check your connection.';
			case 'auth/popup-closed-by-user':
				return 'Sign-in popup was closed.';
			case 'auth/cancelled-popup-request':
				return 'Sign-in was cancelled.';
			default:
				return 'An error occurred. Please try again.';
		}
	}

	// Cleanup
	destroy(): void {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}

// Export singleton instance
export const authService = new AuthService();

// Utility functions
export function requireAuth(): User {
	let user: User | null = null;
	const unsubscribe = currentUser.subscribe(u => user = u);
	unsubscribe();
	
	if (!user) {
		throw new Error('Authentication required');
	}
	
	return user;
}

export function hasRole(requiredRoles: string[]): boolean {
	let user: User | null = null;
	const unsubscribe = currentUser.subscribe(u => user = u);
	unsubscribe();
	
	return user ? requiredRoles.includes(user.role as string) : false;
}

export function isAdmin(): boolean {
	return hasRole(['admin']);
}

export function isBroker(): boolean {
	return hasRole(['broker', 'admin']);
} 