import React, { useState } from 'react';
import { 
  auth 
} from '../utils/firebase';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  ShieldAlert, Lock, Mail, Eye, EyeOff, RefreshCw, Sparkles, ExternalLink, Settings, UserCheck 
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom interactive setup helper trigger
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const [configErrorType, setConfigErrorType] = useState<'provider_not_enabled' | 'user_not_added' | null>(null);

  const projectId = firebaseConfigJson.projectId || 'thiru-study-cercle';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowConfigHelper(false);
    setConfigErrorType(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        onLoginSuccess(userCredential.user.email || '');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found') {
        setErrorMsg('Email/Password provider is not yet enabled in your Firebase console.');
        setConfigErrorType('provider_not_enabled');
        setShowConfigHelper(true);
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid login details or User not found in Firebase database.');
        setConfigErrorType('user_not_added');
        setShowConfigHelper(true);
      } else if (err.code === 'auth/wrong-password') {
        setErrorMsg('Incorrect password. If you forgot your password, click "Forgot Password".');
      } else {
        setErrorMsg(err.message || 'Failed to sign in. Please verify your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address first.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('A secure password reset link has been sent to your admin email!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to send reset link. Please check the email spelling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full filter blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full filter blur-[100px] -z-10 animate-pulse delay-700"></div>

      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight animate-fade-in">Thiru Study Circle</h1>
        <p className="text-sm text-slate-400 mt-1.5 uppercase tracking-widest font-bold">Official Admin Portal</p>
      </div>

      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        
        {isForgotPassword ? (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-1">Reset Admin Password</h2>
            <p className="text-xs text-slate-400">Enter your email and we'll send you an inbox link to reset your password.</p>
          </div>
        ) : (
          <div className="mb-6 text-center border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-white">Administrator Secure Login</h2>
            <p className="text-xs text-slate-400 mt-1">Please sign in with your registered admin credentials.</p>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg flex items-start gap-2.5 text-xs text-red-200">
            <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          </div>
        )}

        {/* Dynamic Troubleshooting Helper Panel */}
        {showConfigHelper && configErrorType === 'provider_not_enabled' && (
          <div className="mb-6 p-4 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs space-y-3 text-slate-300">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Settings className="w-4 h-4 animate-spin" />
              <span>Easy Setup Guide:</span>
            </div>
            <p className="leading-relaxed">
              Your Firebase project <strong>{projectId}</strong> is successfully connected, but the <strong>Email/Password</strong> provider is disabled. Let's fix this:
            </p>
            <div className="space-y-2.5 pl-1">
              <p><strong>Step 1:</strong> Click below to open your auth dashboard:</p>
              <a 
                href={`https://console.firebase.google.com/project/${projectId}/authentication`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300 underline py-1"
              >
                Open Firebase Authentication Dashboard <ExternalLink className="w-3 h-3" />
              </a>
              <p><strong>Step 2:</strong> Click <strong>"Get Started"</strong>, click on <strong>"Email/Password"</strong>, turn on the <strong>"Enable"</strong> switch, and click Save.</p>
              <p><strong>Step 3:</strong> Go to the <strong>"Users"</strong> tab next to Sign-in method, click <strong>"Add user"</strong>, and add your email: <code>trinadharaomamidi97@gmail.com</code> and password!</p>
            </div>
          </div>
        )}

        {showConfigHelper && configErrorType === 'user_not_added' && (
          <div className="mb-6 p-4 bg-amber-950/20 border border-amber-800/60 rounded-xl text-xs space-y-3 text-slate-300">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <UserCheck className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <span>Administrator Account Setup Required:</span>
            </div>
            <p className="leading-relaxed">
              Your dashboard is connected to your existing project <strong>{projectId}</strong>, but the user <strong>{email || 'trinadharaomamidi97@gmail.com'}</strong> is missing from this project's user list.
            </p>
            <div className="space-y-2.5 pl-1">
              <p><strong>Step 1:</strong> Click below to open your secure Firebase user directory directly:</p>
              <a 
                href={`https://console.firebase.google.com/project/${projectId}/authentication/users`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300 underline py-1"
              >
                Open Firebase Users Directory <ExternalLink className="w-3 h-3" />
              </a>
              <p><strong>Step 2:</strong> Click the <strong>"Add user"</strong> button on the right.</p>
              <p><strong>Step 3:</strong> Enter your email: <code>trinadharaomamidi97@gmail.com</code> and set a secure password.</p>
              <p><strong>Step 4:</strong> Click <strong>"Add user"</strong>, return here, and sign in! It will grant you instant access.</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg flex items-start gap-2.5 text-xs text-emerald-200">
            <span className="shrink-0 mt-0.5 font-bold">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms */}
        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Registered Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-100 rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-750 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg('');
                setSuccessMsg('');
                setShowConfigHelper(false);
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 font-semibold"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Admin Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-100 rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setErrorMsg('');
                    setSuccessMsg('');
                    setShowConfigHelper(false);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-100 rounded-xl pl-11 pr-10 py-2.5 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-750 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Log In To Admin Panel'}
            </button>
          </form>
        )}

      </div>

      <div className="mt-6 text-xs text-slate-600 text-center select-none">
        Unauthorized access attempts will be logged.
      </div>
    </div>
  );
}
