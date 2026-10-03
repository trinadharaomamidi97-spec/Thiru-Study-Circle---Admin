import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Award, FileText, Megaphone, Users, LayoutDashboard, 
  Settings, LogOut, CheckCircle, AlertCircle, Info, Download, Upload, Eye, RefreshCw, CloudLightning, ShieldAlert, ShieldCheck
} from 'lucide-react';

import { ThiruData, Video as VideoType, Exam, StudyMaterial, Course, Announcement, AppUser } from './types';
import { exportDataAsJSON } from './utils/storage';
import { INITIAL_THIRU_DATA } from './sampleData';
import firebaseConfigJson from '../firebase-applet-config.json';
import { 
  seedFirestoreIfEmpty, 
  syncFirestoreData,
  saveCourseToFirebase,
  deleteCourseFromFirebase,
  saveVideoToFirebase,
  deleteVideoFromFirebase,
  saveExamToFirebase,
  deleteExamFromFirebase,
  saveMaterialToFirebase,
  deleteMaterialFromFirebase,
  saveAnnouncementToFirebase,
  deleteAnnouncementFromFirebase,
  replaceWholeDatabaseInFirebase,
  auth,
  db,
  saveUserToFirebase,
  deleteUserFromFirebase,
  syncUsersFromFirebase,
  logFirestoreRequest,
  logFirestoreError,
  testDirectFirestoreAccess
} from './utils/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Component Imports
import StatsDashboard from './components/StatsDashboard';
import VideoManager from './components/VideoManager';
import ExamManager from './components/ExamManager';
import MaterialManager from './components/MaterialManager';
import CourseManager from './components/CourseManager';
import AnnouncementManager from './components/AnnouncementManager';
import StudentPortalPreview from './components/StudentPortalPreview';
import LoginScreen from './components/LoginScreen';
import UserManager from './components/UserManager';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  const sidebarTabs = [
    { id: 'dashboard', label: 'Admin Studio', icon: LayoutDashboard },
    { id: 'videos', label: 'Manage Videos', icon: Video },
    { id: 'exams', label: 'CBT Exam Builder', icon: Award },
    { id: 'materials', label: 'Study Notes & PDFs', icon: FileText },
    { id: 'courses', label: 'Active Batches', icon: ShieldCheck },
    { id: 'announcements', label: 'Sticky Alert Feed', icon: Megaphone },
    { id: 'users', label: 'Student Details', icon: Users },
  ];

  const [data, setData] = useState<ThiruData>({
    courses: [],
    videos: [],
    exams: [],
    materials: [],
    announcements: []
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication & Profile States
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Sequential Authentication & Real-Time Listeners Lifecycle (Steps 3, 4, 5)
  useEffect(() => {
    setAuthLoading(true);
    let cleanupActiveSession = () => {};

    const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
      // Step 4: Immediately tear down previous listeners on auth state change
      cleanupActiveSession();

      if (!authUser) {
        setFirebaseUser(null);
        setUserProfile(null);
        setUsers([]);
        setIsSyncing(false);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      setIsSyncing(true);
      setFirebaseUser(authUser);

      try {
        // Step 3: Wait for token readiness BEFORE initiating any Firestore listeners
        console.log('[STEP 3 AUTH TIMING] User authenticated:', authUser.uid, authUser.email);
        console.log('[STEP 3 AUTH TIMING] Awaiting authUser.getIdToken(true)...');
        await authUser.getIdToken(true);
        console.log('[STEP 3 AUTH TIMING] ID token resolved and ready.');

        // Step 5: Test direct Firestore access
        console.log('[STEP 5] Testing direct Firestore access...');
        const directTest = await testDirectFirestoreAccess(authUser.uid);
        console.log('[STEP 5] Direct access test completed:', directTest);

        const sessionUnsubscribes: (() => void)[] = [];
        cleanupActiveSession = () => {
          sessionUnsubscribes.forEach(unsub => {
            try { unsub(); } catch {}
          });
          sessionUnsubscribes.length = 0;
        };

        // Step 3 & 4: Start real-time profile listener
        const userDocRef = doc(db, 'app_users', authUser.uid);
        const profilePath = `app_users/${authUser.uid}`;
        let profileRetries = 0;
        let unsubProfile: (() => void) | undefined;

        const startProfileListener = () => {
          if (unsubProfile) {
            try { unsubProfile(); } catch {}
          }
          logFirestoreRequest(profilePath, 'listen (profile snapshot)');
          unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            profileRetries = 0;
            if (docSnap.exists()) {
              const profile = docSnap.data() as AppUser;
              setUserProfile(profile);
              if (profile.role === 'student' && activeTab !== 'student-view') {
                setActiveTab('student-view');
              }
            } else {
              // Default profile fallback for administrator
              const isAdminEmail = authUser.email?.toLowerCase() === 'trinadharaomamidi97@gmail.com';
              setUserProfile({
                id: authUser.uid,
                email: authUser.email || '',
                name: authUser.email?.split('@')[0] || 'Admin',
                role: isAdminEmail ? 'admin' : 'student',
                status: 'Approved',
                enrolledCourses: [],
                createdAt: new Date().toISOString()
              });
            }
            setAuthLoading(false);
          }, (err) => {
            if (err.code === 'permission-denied' && profileRetries < 4) {
              profileRetries++;
              console.warn(`[Profile Listener] Transient permission-denied for ${profilePath}. Retrying (${profileRetries}/4)...`);
              setTimeout(startProfileListener, 800);
            } else {
              logFirestoreError(profilePath, err);
              console.error("Error reading profile snapshot:", err);
              // Ensure administrator is not locked out of UI on profile read failure
              const isAdminEmail = authUser.email?.toLowerCase() === 'trinadharaomamidi97@gmail.com';
              if (isAdminEmail) {
                setUserProfile({
                  id: authUser.uid,
                  email: authUser.email || '',
                  name: authUser.email?.split('@')[0] || 'Admin',
                  role: 'admin',
                  status: 'Approved',
                  enrolledCourses: [],
                  createdAt: new Date().toISOString()
                });
              }
              setAuthLoading(false);
            }
          });
        };
        startProfileListener();
        sessionUnsubscribes.push(() => {
          if (unsubProfile) {
            try { unsubProfile(); } catch {}
          }
        });

        // Step 3: Start /courses, /videos, /materials, /exams, /announcements listeners AFTER token readiness
        const unsubData = syncFirestoreData((firebaseData) => {
          setData(firebaseData);
          setIsSyncing(false);
        });
        sessionUnsubscribes.push(unsubData);

        // Step 3: Start /app_users directory listener for admin
        if (authUser.email?.toLowerCase() === 'trinadharaomamidi97@gmail.com') {
          const unsubUsers = syncUsersFromFirebase((firebaseUsers) => {
            setUsers(firebaseUsers);
          });
          sessionUnsubscribes.push(unsubUsers);
        }

      } catch (err: any) {
        console.error('[AUTH LIFECYCLE] Initialization error:', err);
        setAuthLoading(false);
        setIsSyncing(false);
      }
    });

    return () => {
      unsubAuth();
      cleanupActiveSession();
    };
  }, []);

  // Listen for role updates on userProfile to sync user directory if granted admin later
  useEffect(() => {
    if (userProfile && userProfile.role === 'admin' && firebaseUser?.email?.toLowerCase() !== 'trinadharaomamidi97@gmail.com') {
      const unsub = syncUsersFromFirebase((firebaseUsers) => {
        setUsers(firebaseUsers);
      });
      return () => unsub();
    }
  }, [userProfile, firebaseUser]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleResetData = async () => {
    setIsSyncing(true);
    try {
      await replaceWholeDatabaseInFirebase(INITIAL_THIRU_DATA);
      showToast('Coaching Database has been reset to defaults and synced to Firebase Firestore.', 'success');
    } catch (e) {
      showToast('Failed to reset database on Firebase.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    exportDataAsJSON(data);
    showToast('Data exported successfully. Check your browser downloads.', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.courses && parsed.videos && parsed.exams && parsed.materials && parsed.announcements) {
          setIsSyncing(true);
          await replaceWholeDatabaseInFirebase(parsed);
          showToast('Database restored successfully and synchronized with Firebase Firestore!', 'success');
        } else {
          showToast('Invalid file structure. Required database nodes missing.', 'error');
        }
      } catch (err) {
        showToast('Failed to parse file. Please upload a valid JSON backup.', 'error');
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Updaters for individual schemas
  const updateVideos = async (updatedVideos: VideoType[]) => {
    try {
      // Find deleted
      const currentIds = new Set(updatedVideos.map(v => v.id));
      const deleted = data.videos.filter(v => !currentIds.has(v.id));
      for (const d of deleted) {
        await deleteVideoFromFirebase(d.id);
      }
      // Find added or edited
      for (const v of updatedVideos) {
        const existing = data.videos.find(old => old.id === v.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(v)) {
          await saveVideoToFirebase(v);
        }
      }
    } catch (err) {
      showToast('Failed to sync video changes with Firestore.', 'error');
    }
  };

  const updateExams = async (updatedExams: Exam[]) => {
    try {
      // Find deleted
      const currentIds = new Set(updatedExams.map(e => e.id));
      const deleted = data.exams.filter(e => !currentIds.has(e.id));
      for (const d of deleted) {
        await deleteExamFromFirebase(d.id);
      }
      // Find added or edited
      for (const e of updatedExams) {
        const existing = data.exams.find(old => old.id === e.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(e)) {
          await saveExamToFirebase(e);
        }
      }
    } catch (err) {
      showToast('Failed to sync exam changes with Firestore.', 'error');
    }
  };

  const updateMaterials = async (updatedMaterials: StudyMaterial[]) => {
    try {
      // Find deleted
      const currentIds = new Set(updatedMaterials.map(m => m.id));
      const deleted = data.materials.filter(m => !currentIds.has(m.id));
      for (const d of deleted) {
        await deleteMaterialFromFirebase(d.id);
      }
      // Find added or edited
      for (const m of updatedMaterials) {
        const existing = data.materials.find(old => old.id === m.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(m)) {
          await saveMaterialToFirebase(m);
        }
      }
    } catch (err) {
      showToast('Failed to sync material changes with Firestore.', 'error');
    }
  };

  const updateCourses = async (updatedCourses: Course[]) => {
    try {
      // Find deleted
      const currentIds = new Set(updatedCourses.map(c => c.id));
      const deleted = data.courses.filter(c => !currentIds.has(c.id));
      for (const d of deleted) {
        await deleteCourseFromFirebase(d.id);
      }
      // Find added or edited
      for (const c of updatedCourses) {
        const existing = data.courses.find(old => old.id === c.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(c)) {
          await saveCourseToFirebase(c);
        }
      }
    } catch (err) {
      showToast('Failed to sync batch changes with Firestore.', 'error');
    }
  };

  const updateAnnouncements = async (updatedAnnouncements: Announcement[]) => {
    try {
      // Find deleted
      const currentIds = new Set(updatedAnnouncements.map(a => a.id));
      const deleted = data.announcements.filter(a => !currentIds.has(a.id));
      for (const d of deleted) {
        await deleteAnnouncementFromFirebase(d.id);
      }
      // Find added or edited
      for (const a of updatedAnnouncements) {
        const existing = data.announcements.find(old => old.id === a.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(a)) {
          await saveAnnouncementToFirebase(a);
        }
      }
    } catch (err) {
      showToast('Failed to sync announcement changes with Firestore.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Successfully signed out of Thiru Study Circle.', 'success');
    } catch (err) {
      showToast('Failed to sign out.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-full mb-4 animate-bounce">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Securing Portal Connection</h2>
        <p className="text-xs text-slate-500 mt-1">Verifying your administrative credentials with Firebase...</p>
      </div>
    );
  }

  // Render Login Screen if not logged in
  if (!firebaseUser || !userProfile) {
    return (
      <>
        <LoginScreen onLoginSuccess={() => showToast('Authenticated successfully!', 'success')} />
        {/* Floating Toast notification Stack */}
        <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`flex items-center gap-2.5 p-3 rounded-lg shadow-xl text-xs font-semibold text-white pointer-events-auto animate-in slide-in-from-bottom-5 duration-150 ${
                toast.type === 'success' ? 'bg-emerald-600' :
                toast.type === 'error' ? 'bg-red-600' :
                'bg-blue-600'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-white" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-white" />}
              {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-white" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Render Lock Screen if account is Pending or Rejected
  if (userProfile.status !== 'Approved') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rose-600/10 rounded-full filter blur-[80px] -z-10 animate-pulse"></div>
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto inline-flex p-4 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500">
            <ShieldAlert className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white">Access Pending Approval</h1>
            <p className="text-xs text-slate-400">
              Welcome, <span className="font-semibold text-slate-200">{userProfile.name}</span>. Your registered account is currently awaiting administrative approval.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 text-left">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Email Address:</span>
              <span className="text-slate-300 font-semibold">{userProfile.email}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Account Role:</span>
              <span className="text-slate-300 font-semibold capitalize">{userProfile.role}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Approval Status:</span>
              <span className="text-amber-500 font-bold uppercase">{userProfile.status}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Please contact the primary administrator or instructor at Thiru Study Circle to approve your account access.
          </p>

          <button
            onClick={handleSignOut}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out & Return
          </button>
        </div>
      </div>
    );
  }

  // Render Student-only simplified layout (Students cannot access Admin tab sidebar)
  if (userProfile.role === 'student') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Simplified Student Top Bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              T
            </div>
            <div>
              <h1 className="text-xs font-bold text-white tracking-wide uppercase">Thiru Study Circle</h1>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Aspirant Learning Room</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-200 block">{userProfile.name}</span>
              <span className="text-[9px] text-slate-400 font-semibold block">{userProfile.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-800/50 text-slate-300 hover:text-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Full-width student preview */}
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <StudentPortalPreview 
            data={data} 
            showToast={showToast} 
            currentUserProfile={userProfile}
          />
        </main>

        {/* Floating Toast notification Stack */}
        <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`flex items-center gap-2.5 p-3 rounded-lg shadow-xl text-xs font-semibold text-white pointer-events-auto animate-in slide-in-from-bottom-5 duration-150 ${
                toast.type === 'success' ? 'bg-emerald-600' :
                toast.type === 'error' ? 'bg-red-600' :
                'bg-blue-600'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-white" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-white" />}
              {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-white" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Administrator Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Hidden file input for restoration */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        accept=".json" 
        className="hidden" 
      />

      {/* Side Navigation Bar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base tracking-tight shadow-lg shadow-blue-500/20">
                T
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-wide">Thiru Study</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Studio</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Sign Out */}
              <button 
                onClick={handleSignOut}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded cursor-pointer transition-colors"
                title="Sign Out of Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              {/* Quick Refresh indicators */}
              <button 
                onClick={() => showToast('Database synchronized real-time with Google Cloud Firebase.', 'success')}
                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                title="Database Status Sync"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Switch Button to Student View */}
          <div className="px-4 pt-4">
            <button
              onClick={() => setActiveTab(activeTab === 'student-view' ? 'dashboard' : 'student-view')}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'student-view'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {activeTab === 'student-view' ? 'Return to Admin Studio' : 'Live Student View'}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarTabs.map((tab: any) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin footer controls */}
        <div className="p-4 border-t border-slate-800 space-y-2 text-[10px] text-slate-500 leading-relaxed">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Admin profile:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[100px]">{userProfile.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Firebase Status:</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CloudLightning className="w-3 h-3 text-emerald-500" />
              Synced ({firebaseConfigJson.projectId})
            </span>
          </div>
          <p className="opacity-75">
            Real-time multi-device cloud storage is activated. All data stays updated live.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">
              {activeTab === 'student-view' ? 'Aspirant Learning' : 'System Administration'}
            </span>
            <span>/</span>
            <span className="text-xs font-bold text-slate-700 capitalize">
              {activeTab === 'student-view' ? 'Student Portal' : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export complete database backup as JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup (JSON)</span>
            </button>

            <button
              onClick={handleImportClick}
              className="text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restore database backup from JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore Sync</span>
            </button>

            <span className="h-4 w-px bg-slate-200 hidden sm:block"></span>

            <div className="items-center gap-2 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                Thiru Circle Firebase v3.0
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel Viewport */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <StatsDashboard 
              data={data} 
              setActiveTab={setActiveTab} 
              onReset={handleResetData}
              onExport={handleExport}
              onImportClick={handleImportClick}
            />
          )}

          {activeTab === 'videos' && (
            <VideoManager 
              data={data} 
              onUpdate={updateVideos} 
              showToast={showToast} 
            />
          )}

          {activeTab === 'exams' && (
            <ExamManager 
              data={data} 
              onUpdate={updateExams} 
              showToast={showToast} 
            />
          )}

          {activeTab === 'materials' && (
            <MaterialManager 
              data={data} 
              onUpdate={updateMaterials} 
              showToast={showToast} 
            />
          )}

          {activeTab === 'courses' && (
            <CourseManager 
              data={data} 
              onUpdate={updateCourses} 
              showToast={showToast} 
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementManager 
              data={data} 
              onUpdate={updateAnnouncements} 
              showToast={showToast} 
            />
          )}

          {activeTab === 'users' && (
            <UserManager 
              users={users}
              courses={data.courses}
              onSaveUser={saveUserToFirebase}
              onDeleteUser={deleteUserFromFirebase}
              showToast={showToast}
            />
          )}

          {activeTab === 'student-view' && (
            <StudentPortalPreview 
              data={data} 
              showToast={showToast} 
              currentUserProfile={userProfile}
            />
          )}
        </div>
      </main>

      {/* Floating Toast notification Stack */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`flex items-center gap-2.5 p-3 rounded-lg shadow-xl text-xs font-semibold text-white pointer-events-auto animate-in slide-in-from-bottom-5 duration-150 ${
              toast.type === 'success' ? 'bg-emerald-600' :
              toast.type === 'error' ? 'bg-red-600' :
              'bg-blue-600'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-white" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-white" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-white" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
