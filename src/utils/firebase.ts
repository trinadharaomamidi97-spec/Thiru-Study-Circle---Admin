import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, collection, doc, writeBatch, getDocs, getDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ThiruData, Course, Video, Exam, StudyMaterial, Announcement, AppUser } from '../types';
import { INITIAL_THIRU_DATA } from '../sampleData';

// Dynamically load config directly from provisioned firebase credentials at the root
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId
};

const databaseId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== "(default)"
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

// Ensure strictly ONE Firebase app instance is initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use standard Firestore web transport (replaces forced long-polling)
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

// Print Diagnostic App Info
const apps = getApps();
console.log('=== FIREBASE APPS INITIALIZATION ===');
console.log('Number of Firebase apps:', apps.length);
console.log('auth.app === db.app:', auth.app === db.app);
apps.forEach((a, idx) => {
  console.log(`App [${idx}] Name: ${a.name}, ProjectId: ${a.options.projectId}`);
});
console.log('db initialized at: src/utils/firebase.ts (Project:', firebaseConfig.projectId, 'DatabaseId:', databaseId || '(default)', ')');

// Collection Names
const COURSES_COLL = 'courses';
const VIDEOS_COLL = 'videos';
const EXAMS_COLL = 'exams';
const MATERIALS_COLL = 'materials';
const ANNOUNCEMENTS_COLL = 'announcements';
const USERS_COLL = 'app_users';

/**
 * Helper to log request details
 */
export function logFirestoreRequest(path: string, operation: string) {
  const currentUser = auth.currentUser;
  console.log('=== FIRESTORE REQUEST ===');
  console.log(`PATH: ${path}`);
  console.log(`OPERATION: ${operation}`);
  console.log(`PROJECT ID: ${firebaseConfig.projectId}`);
  console.log(`DATABASE ID: ${databaseId || '(default)'}`);
  console.log(`AUTH UID: ${currentUser ? currentUser.uid : 'UNAUTHENTICATED'}`);
  console.log(`AUTH EMAIL: ${currentUser ? currentUser.email : 'UNAUTHENTICATED'}`);
}

export function logFirestoreError(path: string, err: any) {
  console.error('=== FIRESTORE ERROR ===');
  console.error(`PATH: ${path}`);
  console.error(`ERROR CODE: ${err.code || 'unknown'}`);
  console.error(`ERROR MESSAGE: ${err.message || String(err)}`);
}

/**
 * Step 5: Direct Firestore Access Verification Function
 */
export async function testDirectFirestoreAccess(uid: string): Promise<{
  profileSuccess: boolean;
  coursesSuccess: boolean;
  profileExists: boolean;
  coursesCount: number;
  errorCode?: string;
  errorMessage?: string;
}> {
  const currentUser = auth.currentUser;
  let hasToken = 'NO';
  try {
    const tokenResult = await currentUser?.getIdTokenResult();
    hasToken = tokenResult?.token ? 'YES' : 'NO';
  } catch {
    hasToken = 'NO';
  }

  const result = {
    profileSuccess: false,
    coursesSuccess: false,
    profileExists: false,
    coursesCount: 0,
    errorCode: undefined as string | undefined,
    errorMessage: undefined as string | undefined
  };

  try {
    const profileRef = doc(db, USERS_COLL, uid);
    logFirestoreRequest(`${USERS_COLL}/${uid}`, 'getDoc (Direct Test)');
    const profileSnap = await getDoc(profileRef);
    result.profileSuccess = true;
    result.profileExists = profileSnap.exists();
    console.log(`DIRECT PROFILE READ = SUCCESS (exists: ${profileSnap.exists()})`);
  } catch (err: any) {
    result.errorCode = err.code || 'unknown';
    result.errorMessage = err.message || String(err);
    console.error(`DIRECT PROFILE READ = FAILED`);
    logFirestoreError(`${USERS_COLL}/${uid}`, err);
  }

  try {
    const coursesRef = collection(db, COURSES_COLL);
    logFirestoreRequest(COURSES_COLL, 'getDocs (Direct Test)');
    const coursesSnap = await getDocs(coursesRef);
    result.coursesSuccess = true;
    result.coursesCount = coursesSnap.size;
    console.log(`DIRECT COURSES READ = SUCCESS (count: ${coursesSnap.size})`);
  } catch (err: any) {
    if (!result.errorCode) {
      result.errorCode = err.code || 'unknown';
      result.errorMessage = err.message || String(err);
    }
    console.error(`DIRECT COURSES READ = FAILED`);
    logFirestoreError(COURSES_COLL, err);
  }

  if (!result.profileSuccess || !result.coursesSuccess) {
    console.log('=== DIRECT TEST FAILURE DIAGNOSTICS ===');
    console.log(`PROJECT ID = ${firebaseConfig.projectId}`);
    console.log(`DATABASE ID = ${databaseId || '(default)'}`);
    console.log(`AUTH UID = ${currentUser ? currentUser.uid : 'UNAUTHENTICATED'}`);
    console.log(`AUTH EMAIL = ${currentUser ? currentUser.email : 'UNAUTHENTICATED'}`);
    console.log(`AUTH TOKEN PRESENT = ${hasToken}`);
    console.log(`DIRECT PROFILE READ = ${result.profileSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`DIRECT COURSES READ = ${result.coursesSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`ERROR CODE = ${result.errorCode}`);
    console.log(`ERROR MESSAGE = ${result.errorMessage}`);
  }

  return result;
}

/**
 * Checks if Firestore is empty. Seeding is disabled to protect the live connected database.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  console.log('Automated seeding has been bypassed to protect the live database thiru-study-cercle.');
  return false;
}

/**
 * Helper to subscribe to onSnapshot with a safe transient error retry mechanism.
 */
function onSnapshotWithRetry(
  queryRef: any,
  pathName: string,
  onNext: (snapshot: any) => void,
  onError: (error: any) => void,
  maxRetries = 4,
  delayMs = 800
): () => void {
  let unsub: (() => void) | undefined;
  let retries = 0;
  let isUnsubscribed = false;

  const subscribe = () => {
    if (isUnsubscribed) return;
    if (unsub) {
      try { unsub(); } catch {}
    }

    logFirestoreRequest(pathName, 'listen (onSnapshotWithRetry)');

    unsub = onSnapshot(queryRef, (snap) => {
      onNext(snap);
    }, (err: any) => {
      if (err.code === 'permission-denied' && retries < maxRetries) {
        retries++;
        console.warn(`Transient permission-denied for ${pathName}. Retrying listener (attempt ${retries}/${maxRetries})...`);
        setTimeout(subscribe, delayMs);
      } else {
        logFirestoreError(pathName, err);
        onError(err);
      }
    });
  };

  subscribe();

  return () => {
    isUnsubscribed = true;
    if (unsub) {
      try { unsub(); } catch {}
    }
  };
}

/**
 * Sync Firestore collections in real-time to the React state.
 */
export function syncFirestoreData(onUpdate: (data: ThiruData) => void): () => void {
  const currentData: ThiruData = {
    courses: [],
    videos: [],
    exams: [],
    materials: [],
    announcements: []
  };

  const unsubscribes: (() => void)[] = [];

  const handleUpdate = () => {
    onUpdate({ ...currentData });
  };

  // 1. Courses
  unsubscribes.push(
    onSnapshotWithRetry(collection(db, COURSES_COLL), COURSES_COLL, (snap: any) => {
      currentData.courses = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Course));
      handleUpdate();
    }, (err) => console.error('Error fetching courses:', err))
  );

  // 2. Videos
  unsubscribes.push(
    onSnapshotWithRetry(collection(db, VIDEOS_COLL), VIDEOS_COLL, (snap: any) => {
      currentData.videos = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Video));
      handleUpdate();
    }, (err) => console.error('Error fetching videos:', err))
  );

  // 3. Exams
  unsubscribes.push(
    onSnapshotWithRetry(collection(db, EXAMS_COLL), EXAMS_COLL, (snap: any) => {
      currentData.exams = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Exam));
      handleUpdate();
    }, (err) => console.error('Error fetching exams:', err))
  );

  // 4. Materials
  unsubscribes.push(
    onSnapshotWithRetry(collection(db, MATERIALS_COLL), MATERIALS_COLL, (snap: any) => {
      currentData.materials = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as StudyMaterial));
      handleUpdate();
    }, (err) => console.error('Error fetching materials:', err))
  );

  // 5. Announcements
  unsubscribes.push(
    onSnapshotWithRetry(collection(db, ANNOUNCEMENTS_COLL), ANNOUNCEMENTS_COLL, (snap: any) => {
      currentData.announcements = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Announcement));
      handleUpdate();
    }, (err) => console.error('Error fetching announcements:', err))
  );

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

/**
 * Database Write Operations
 */
export async function saveCourseToFirebase(course: Course): Promise<void> {
  await setDoc(doc(db, COURSES_COLL, course.id), course);
}

export async function deleteCourseFromFirebase(courseId: string): Promise<void> {
  await deleteDoc(doc(db, COURSES_COLL, courseId));
}

export async function saveVideoToFirebase(video: Video): Promise<void> {
  await setDoc(doc(db, VIDEOS_COLL, video.id), video);
}

export async function deleteVideoFromFirebase(videoId: string): Promise<void> {
  await deleteDoc(doc(db, VIDEOS_COLL, videoId));
}

export async function saveExamToFirebase(exam: Exam): Promise<void> {
  await setDoc(doc(db, EXAMS_COLL, exam.id), exam);
}

export async function deleteExamFromFirebase(examId: string): Promise<void> {
  await deleteDoc(doc(db, EXAMS_COLL, examId));
}

export async function saveMaterialToFirebase(material: StudyMaterial): Promise<void> {
  await setDoc(doc(db, MATERIALS_COLL, material.id), material);
}

export async function deleteMaterialFromFirebase(materialId: string): Promise<void> {
  await deleteDoc(doc(db, MATERIALS_COLL, materialId));
}

export async function saveAnnouncementToFirebase(announcement: Announcement): Promise<void> {
  await setDoc(doc(db, ANNOUNCEMENTS_COLL, announcement.id), announcement);
}

export async function deleteAnnouncementFromFirebase(announcementId: string): Promise<void> {
  await deleteDoc(doc(db, ANNOUNCEMENTS_COLL, announcementId));
}

/**
 * Bulk updates to wipe database and replace (e.g. for restoring from backup or resetting)
 */
export async function replaceWholeDatabaseInFirebase(newData: ThiruData): Promise<void> {
  // 1. Delete all current items across all collections first
  const deleteBatch = async (collName: string) => {
    const snap = await getDocs(collection(db, collName));
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  };

  await Promise.all([
    deleteBatch(COURSES_COLL),
    deleteBatch(VIDEOS_COLL),
    deleteBatch(EXAMS_COLL),
    deleteBatch(MATERIALS_COLL),
    deleteBatch(ANNOUNCEMENTS_COLL)
  ]);

  // 2. Set new items in batch
  const batch = writeBatch(db);
  newData.courses.forEach(c => batch.set(doc(db, COURSES_COLL, c.id), c));
  newData.videos.forEach(v => batch.set(doc(db, VIDEOS_COLL, v.id), v));
  newData.exams.forEach(e => batch.set(doc(db, EXAMS_COLL, e.id), e));
  newData.materials.forEach(m => batch.set(doc(db, MATERIALS_COLL, m.id), m));
  newData.announcements.forEach(a => batch.set(doc(db, ANNOUNCEMENTS_COLL, a.id), a));
  
  await batch.commit();
}

export async function saveUserToFirebase(user: AppUser): Promise<void> {
  await setDoc(doc(db, USERS_COLL, user.id), user);
}

export async function deleteUserFromFirebase(userId: string): Promise<void> {
  await deleteDoc(doc(db, USERS_COLL, userId));
}

export function syncUsersFromFirebase(onUpdate: (users: AppUser[]) => void): () => void {
  return onSnapshotWithRetry(collection(db, USERS_COLL), USERS_COLL, (snap: any) => {
    const users = snap.docs.map((d: any) => d.data() as AppUser);
    onUpdate(users);
  }, (err) => console.error('Error fetching users:', err));
}

