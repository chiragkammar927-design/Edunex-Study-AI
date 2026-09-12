import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  StudentProfile,
  WeaknessItem,
  Flashcard,
  StudyPlanSchedule,
  SnapStudyDraft,
  StudyCircle,
} from '../types';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firestore with explicit databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connectivity.');
    }
    return false;
  }
}

// Password Strength Validation Standards
export interface PasswordValidationResult {
  hasMinLength: boolean; // >= 8 chars
  hasUpperCase: boolean; // >= 1 uppercase
  hasLowerCase: boolean; // >= 1 lowercase
  hasNumber: boolean; // >= 1 digit
  hasSpecialChar: boolean; // >= 1 symbol
  score: number; // 0 to 5
  isStrong: boolean; // meets all criteria
  feedback: string;
}

export function validateStrongPassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  let feedback = 'Very Weak';
  if (score === 5) feedback = 'Very Strong';
  else if (score === 4) feedback = 'Strong';
  else if (score === 3) feedback = 'Medium';
  else if (score === 2) feedback = 'Weak';

  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    score,
    isStrong: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    feedback,
  };
}

// Auth operations
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ user: User; verificationSent: boolean }> {
  const validation = validateStrongPassword(pass);
  if (!validation.isStrong) {
    throw new Error('Please ensure your password meets all strong security requirements (min 8 chars, uppercase, lowercase, number, and special character).');
  }

  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = res.user;

    if (displayName && displayName.trim()) {
      try {
        await updateProfile(user, { displayName: displayName.trim() });
      } catch (err) {
        console.warn('Could not set displayName on profile:', err);
      }
    }

    let verificationSent = false;
    try {
      await sendEmailVerification(user);
      verificationSent = true;
    } catch (err) {
      console.warn('Could not dispatch initial email verification:', err);
    }

    return { user, verificationSent };
  } catch (error) {
    console.error('Sign-Up Error:', error);
    throw error;
  }
}

export async function resendVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Resend Verification Error:', error);
    throw error;
  }
}

export async function reloadUser(user: User): Promise<User> {
  try {
    await user.reload();
    return auth.currentUser || user;
  } catch (error) {
    console.error('Reload User Error:', error);
    throw error;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error('Password Reset Error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User Profile Firestore Sync
export async function syncUserProfileToFirestore(userId: string, profile: StudentProfile) {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        uid: userId,
        name: profile.name || 'Student',
        grade: profile.grade || 'Grade 11 - STEM',
        avatar: profile.avatar || '🎓',
        level: profile.level || 1,
        xp: profile.xp || 0,
        xpToNextLevel: profile.xpToNextLevel || 1000,
        streakDays: profile.streakDays || 1,
        todayStudyMinutes: profile.todayStudyMinutes || 0,
        todayGoalMinutes: profile.todayGoalMinutes || 90,
        overallMastery: profile.overallMastery || 72,
        phoneNumber: profile.phoneNumber || profile.subscription?.phoneNumber || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(userId: string, onData: (data: Partial<StudentProfile>) => void) {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          name: data.name,
          grade: data.grade,
          avatar: data.avatar,
          level: data.level,
          xp: data.xp,
          xpToNextLevel: data.xpToNextLevel,
          streakDays: data.streakDays,
          todayStudyMinutes: data.todayStudyMinutes,
          todayGoalMinutes: data.todayGoalMinutes,
          overallMastery: data.overallMastery,
          phoneNumber: data.phoneNumber,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// User Weaknesses Sync
export async function syncWeaknessesToFirestore(userId: string, weaknesses: WeaknessItem[]) {
  const basePath = `users/${userId}/weaknesses`;
  try {
    for (const item of weaknesses) {
      const itemPath = `${basePath}/${item.id}`;
      await setDoc(
        doc(db, 'users', userId, 'weaknesses', item.id),
        {
          id: item.id,
          userId,
          subject: item.subject,
          chapter: item.chapter,
          subtopic: item.subtopic,
          score: item.score,
          maxScore: item.maxScore,
          weaknessLabel: item.weaknessLabel,
          rootCause: item.rootCause || '',
          confidence: item.confidence || 'Medium',
          recommendedPracticeMinutes: item.recommendedPracticeMinutes || 15,
          mistakeFrequency: item.mistakeFrequency || 1,
          sampleMistake: item.sampleMistake || '',
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}

export function subscribeWeaknesses(userId: string, onData: (items: WeaknessItem[]) => void) {
  const path = `users/${userId}/weaknesses`;
  return onSnapshot(
    collection(db, 'users', userId, 'weaknesses'),
    (snapshot) => {
      const items: WeaknessItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as WeaknessItem);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// User Flashcards Sync
export async function syncFlashcardsToFirestore(userId: string, flashcards: Flashcard[]) {
  const basePath = `users/${userId}/flashcards`;
  try {
    for (const card of flashcards) {
      await setDoc(
        doc(db, 'users', userId, 'flashcards', card.id),
        {
          id: card.id,
          userId,
          subject: card.subject,
          chapter: card.chapter,
          front: card.front,
          back: card.back,
          intervalDays: card.intervalDays || 1,
          repetitions: card.repetitions || 0,
          easeFactor: card.easeFactor || 2.5,
          nextReviewDate: card.nextReviewDate || new Date().toISOString().split('T')[0],
          status: card.status || 'learning',
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}

export function subscribeFlashcards(userId: string, onData: (cards: Flashcard[]) => void) {
  const path = `users/${userId}/flashcards`;
  return onSnapshot(
    collection(db, 'users', userId, 'flashcards'),
    (snapshot) => {
      const cards: Flashcard[] = [];
      snapshot.forEach((docSnap) => {
        cards.push(docSnap.data() as Flashcard);
      });
      if (cards.length > 0) {
        onData(cards);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// User Notes & Drafts Sync
export async function saveSnapNoteToFirestore(userId: string, draft: SnapStudyDraft) {
  const path = `users/${userId}/notes/${draft.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'notes', draft.id),
      {
        id: draft.id,
        userId,
        title: draft.title || 'Untitled Note',
        subject: draft.subject || 'Mathematics',
        content: draft.content || '',
        createdAt: draft.createdAt || new Date().toISOString(),
        priority: draft.priority || 'normal',
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeSnapNotes(userId: string, onData: (drafts: SnapStudyDraft[]) => void) {
  const path = `users/${userId}/notes`;
  return onSnapshot(
    collection(db, 'users', userId, 'notes'),
    (snapshot) => {
      const drafts: SnapStudyDraft[] = [];
      snapshot.forEach((docSnap) => {
        drafts.push(docSnap.data() as SnapStudyDraft);
      });
      if (drafts.length > 0) {
        onData(drafts);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
