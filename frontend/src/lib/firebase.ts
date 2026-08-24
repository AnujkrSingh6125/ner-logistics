import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase singleton
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);

/**
 * Format raw phone number into standard international E.164 format (+91XXXXXXXXXX)
 */
export function formatE164PhoneNumber(rawPhone: string, defaultCountryCode: string = '+91'): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (rawPhone.trim().startsWith('+')) {
    return `+${digitsOnly}`;
  }
  if (digitsOnly.length === 10) {
    return `${defaultCountryCode}${digitsOnly}`;
  }
  if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }
  return `+${digitsOnly}`;
}

/**
 * Initialize or retrieve a RecaptchaVerifier instance attached to a DOM container
 */
export function getRecaptchaVerifier(
  containerId: string = 'recaptcha-container',
  size: 'invisible' | 'normal' = 'invisible'
): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('RecaptchaVerifier can only be initialized on the client side.');
  }

  // Clear any existing verifier instance attached to window to prevent duplicated widgets
  const win = window as any;
  if (win.__recaptchaVerifier) {
    try {
      win.__recaptchaVerifier.clear();
    } catch (e) {
      // ignore widget clear warnings
    }
  }

  win.__recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {
      console.log('[Firebase RecaptchaVerifier] reCAPTCHA solved successfully');
    },
    'expired-callback': () => {
      console.warn('[Firebase RecaptchaVerifier] reCAPTCHA expired, reset required');
    },
  });

  return win.__recaptchaVerifier;
}

export {
  app,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
};
export type { ConfirmationResult, FirebaseUser };
