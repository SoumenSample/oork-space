'use client';

import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import AuthModal from '@/components/AuthModal';
import LoginPage from './(auth)/login/page';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [mounted, setMounted] = useState(typeof window !== 'undefined');

  // Use useCallback to handle the auth check
  const checkAndShowAuth = useCallback(() => {
    // Check if component is still mounted before setting state
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isLoading, isAuthenticated]);

  // Check auth on mount
  useEffect(() => {
    // Delay the auth check slightly to avoid hydration issues
    const timer = setTimeout(checkAndShowAuth, 0);
    return () => clearTimeout(timer);
  }, [checkAndShowAuth]);

  const handleCloseAuth = () => {
    setShowAuthModal(false);
    if (!isAuthenticated) {
      router.push('/');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1625]">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AppShell defaultView="Dashboard" activeMenu="dashboard" />;
  }

  return (
    // <div className="min-h-screen bg-[#1a1625] relative overflow-hidden">
    //   {/* Background effects */}
    //   <div className="absolute inset-0 overflow-hidden">
    //     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"></div>
    //     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
    //     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"></div>
    //   </div>

    //   {/* Hero Section */}
    //   <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
    //     <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-center">
    //       Welcome to <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">ooakspace</span>
    //     </h1>
    //     <p className="text-xl text-gray-400 mb-12 text-center max-w-2xl">
    //       Your all-in-one workspace for projects, tasks, and collaboration. 
    //       Get started today and transform how you work.
    //     </p>

    //     {/* Login/Signup Buttons with 3D effects */}
    //     <div className="flex flex-col sm:flex-row gap-4">
    //       <button
    //         onClick={() => { setAuthMode('sign-in'); setShowAuthModal(true); }}
    //         className="relative px-8 py-4 rounded-2xl font-bold text-lg text-white
    //           bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500
    //           shadow-lg shadow-pink-500/30
    //           hover:shadow-xl hover:shadow-pink-500/50
    //           transform hover:-translate-y-1 hover:scale-105
    //           transition-all duration-200
    //           before:absolute before:inset-0 before:rounded-2xl before:bg-white/20
    //           before:opacity-0 hover:before:opacity-100
    //           after:absolute after:bottom-0 after:left-4 after:right-4 after:h-2
    //           after:bg-black/20 after:rounded-b-xl
    //           after:opacity-0 hover:after:opacity-100
    //           active:translate-y-0 active:scale-95"
    //       >
    //         <span className="relative z-10">Sign In</span>
    //       </button>

    //       <button
    //         onClick={() => { setAuthMode('sign-up'); setShowAuthModal(true); }}
    //         className="relative px-8 py-4 rounded-2xl font-bold text-lg text-white
    //           bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500
    //           shadow-lg shadow-purple-500/30
    //           hover:shadow-xl hover:shadow-purple-500/50
    //           transform hover:-translate-y-1 hover:scale-105
    //           transition-all duration-200
    //           before:absolute before:inset-0 before:rounded-2xl before:bg-white/20
    //           before:opacity-0 hover:before:opacity-100
    //           after:absolute after:bottom-0 after:left-4 after:right-4 after:h-2
    //           after:bg-black/20 after:rounded-b-xl
    //           after:opacity-0 hover:after:opacity-100
    //           active:translate-y-0 active:scale-95"
    //       >
    //         <span className="relative z-10">Create Account</span>
    //       </button>
    //     </div>

    //     {/* Features */}
    //     <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
    //       {[
    //         { title: 'Project Management', desc: 'Organize tasks and projects efficiently', icon: '📁' },
    //         { title: 'Team Collaboration', desc: 'Work together seamlessly with your team', icon: '👥' },
    //         { title: 'Real-time Updates', desc: 'Stay synchronized with instant updates', icon: '⚡' },
    //       ].map((feature, i) => (
    //         <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
    //           <div className="text-4xl mb-4">{feature.icon}</div>
    //           <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
    //           <p className="text-gray-400 text-sm">{feature.desc}</p>
    //         </div>
    //       ))}
    //     </div>
    //   </div>

    //   {/* Auth Modal */}
    //   <AuthModal 
    //     isOpen={showAuthModal} 
    //     onClose={handleCloseAuth}
    //     initialMode={authMode}
    //   />
    // </div>
    <LoginPage/>
  );
}
