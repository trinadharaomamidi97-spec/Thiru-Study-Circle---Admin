import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, writeBatch, getDocs, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig);
// Initializing firestore with databaseId from config and enabling long polling to bypass WebSocket restrictions in iframes
export const db = databaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, databaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);

// Collection Names
const COURSES_COLL = 'courses';
const VIDEOS_COLL = 'videos';
const EXAMS_COLL = 'exams';
const MATERIALS_COLL = 'materials';
const ANNOUNCEMENTS_COLL = 'announcements';
const USERS_COLL = 'app_users';

/**
 * Checks if Firestore is empty. Seeding is disabled to protect the live connected database.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  // Prevent automated seeding of sample data on the user's live production database
  console.log('Automated seeding has been bypassed to protect the live database thiru-study-cercle.');
  return false;
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
    onSnapshot(collection(db, COURSES_COLL), (snap) => {
      currentData.courses = snap.docs.map(d => ({ ...d.data(), id: d.id } as Course));
      handleUpdate();
    }, (err) => console.error('Error fetching courses:', err))
  );

  // 2. Videos
  unsubscribes.push(
    onSnapshot(collection(db, VIDEOS_COLL), (snap) => {
      currentData.videos = snap.docs.map(d => ({ ...d.data(), id: d.id } as Video));
      handleUpdate();
    }, (err) => console.error('Error fetching videos:', err))
  );

  // 3. Exams
  unsubscribes.push(
    onSnapshot(collection(db, EXAMS_COLL), (snap) => {
      currentData.exams = snap.docs.map(d => ({ ...d.data(), id: d.id } as Exam));
      handleUpdate();
    }, (err) => console.error('Error fetching exams:', err))
  );

  // 4. Materials
  unsubscribes.push(
    onSnapshot(collection(db, MATERIALS_COLL), (snap) => {
      currentData.materials = snap.docs.map(d => ({ ...d.data(), id: d.id } as StudyMaterial));
      handleUpdate();
    }, (err) => console.error('Error fetching materials:', err))
  );

  // 5. Announcements
  unsubscribes.push(
    onSnapshot(collection(db, ANNOUNCEMENTS_COLL), (snap) => {
      currentData.announcements = snap.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
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
  return onSnapshot(collection(db, USERS_COLL), (snap) => {
    const users = snap.docs.map(d => d.data() as AppUser);
    onUpdate(users);
  }, (err) => console.error('Error fetching users:', err));
}

