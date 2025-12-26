import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

// Firebase configuration for production
const PUBLIC_FIREBASE_API_KEY = 'AIzaSyAB77WY4cKILXOJSfs7ywxHu8SGchNbQfY';
const PUBLIC_FIREBASE_AUTH_DOMAIN = 'insurance-broker-61f11.firebaseapp.com';
const PUBLIC_FIREBASE_PROJECT_ID = 'insurance-broker-61f11';
const PUBLIC_FIREBASE_STORAGE_BUCKET = 'insurance-broker-61f11.firebasestorage.app';
const PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '719578122352';
const PUBLIC_FIREBASE_APP_ID = '1:719578122352:web:2969b92db688f4efff8cb5';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID,
	measurementId: "G-9H59XVSP65"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Analytics and Performance (browser only)
let analytics: any = null;
let performance: any = null;

if (typeof window !== 'undefined') {
	analytics = getAnalytics(app);
	performance = getPerformance(app);
}

export { analytics, performance };

// Connect to emulators in development (disabled for now)
if (false && typeof window !== 'undefined') {
	try {
		// Connect emulators with proper checks
		let authEmulatorConnected = false;
		let firestoreEmulatorConnected = false;
		let storageEmulatorConnected = false;
		let functionsEmulatorConnected = false;

		if (!authEmulatorConnected) {
			connectAuthEmulator(auth, 'http://localhost:9099');
			authEmulatorConnected = true;
		}
		if (!firestoreEmulatorConnected) {
			connectFirestoreEmulator(db, 'localhost', 8080);
			firestoreEmulatorConnected = true;
		}
		if (!storageEmulatorConnected) {
			connectStorageEmulator(storage, 'localhost', 9199);
			storageEmulatorConnected = true;
		}
		if (!functionsEmulatorConnected) {
			connectFunctionsEmulator(functions, 'localhost', 5001);
			functionsEmulatorConnected = true;
		}
	} catch (error) {
		console.warn('Firebase emulators connection failed:', error);
	}
}

// Firebase configuration validation
export function validateFirebaseConfig(): boolean {
	const requiredConfigs = [
		PUBLIC_FIREBASE_API_KEY,
		PUBLIC_FIREBASE_AUTH_DOMAIN,
		PUBLIC_FIREBASE_PROJECT_ID,
		PUBLIC_FIREBASE_STORAGE_BUCKET,
		PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		PUBLIC_FIREBASE_APP_ID
	];

	return requiredConfigs.every(config => config && config.length > 0);
}

// Export for server-side usage
export { firebaseConfig }; 