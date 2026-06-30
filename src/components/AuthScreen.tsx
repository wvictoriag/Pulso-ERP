import React from 'react';
import { Database, LogIn } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export default function AuthScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">ERP Empresarial</h1>
        <p className="text-slate-500 text-sm mb-6">Inicia sesión con Google para acceder al sistema.</p>
        <button 
          onClick={() => signInWithPopup(auth, googleAuthProvider)}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <LogIn className="w-5 h-5" /> Iniciar Sesión con Google
        </button>
      </div>
    </div>
  );
}
