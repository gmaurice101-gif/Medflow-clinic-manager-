/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from '@/pages/Dashboard';
import Reception from '@/pages/Reception';
import Patients from '@/pages/Patients';
import Consultation from '@/pages/Consultation';
import Pharmacy from '@/pages/Pharmacy';
import Billing from '@/pages/Billing';
import Laboratory from '@/pages/Laboratory';
import Radiology from '@/pages/Radiology';
import Admin from '@/pages/Admin';
import { auth, testFirestoreConnection, signInWithGoogle } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, FileText } from 'lucide-react';

// Placeholder for Lab/Radiology
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
      <FileText className="w-8 h-8" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 max-w-sm">This department management module is coming soon.</p>
    </div>
  </div>
);

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MedFlow Clinic</h1>
          <p className="text-slate-500 mt-2">Sign in to access staff portal</p>
        </div>
        <Button 
          onClick={signInWithGoogle} 
          className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-12 flex gap-3"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reception" element={<Reception />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/lab" element={<Laboratory />} />
          <Route path="/radiology" element={<Radiology />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </Router>
  );
}



