/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from 'firebase/auth';
import { useAuthStore } from './store/index.ts';
import { Loader2, LogIn } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout.tsx';
import TraineeDashboard from './components/TraineeDashboard.tsx';
import TrainerDashboard from './components/TrainerDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import AssessmentEngine from './components/AssessmentEngine.tsx';

const queryClient = new QueryClient();

function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: result.user.displayName })
      });
      
      if (res.ok) {
        const dbUser = await res.json();
        setAuth(token, dbUser);
        navigate('/');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleAuthProvider);
        } catch (redirectError) {
          console.error('Redirect login failed:', redirectError);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-sm w-full text-center border border-gray-100">
        <div className="bg-blue-600 text-white w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Capacity Connect</h1>
        <p className="text-gray-500 mb-8">Sign in to access your learning portal</p>
        <button
          onClick={handleLogin}
          className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRouter() {
  const { user } = useAuthStore();
  if (user?.role === 'TRAINER') return <TrainerDashboard />;
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  return <TraineeDashboard />;
}

export default function App() {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const dbUser = await res.json();
          setAuth(token, dbUser);
        } else {
          // Fallback to sync if user doesn't exist (e.g., returned from redirect login)
          const syncRes = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: firebaseUser.displayName })
          });
          if (syncRes.ok) {
            const dbUser = await syncRes.json();
            setAuth(token, dbUser);
          } else {
            logout();
          }
        }
      } else {
        logout();
      }
    });
    return () => unsubscribe();
  }, [setAuth, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout>
                <RoleRouter />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/assessments/:id" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AssessmentEngine />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

