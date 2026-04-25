/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StadiumState, Alert } from './types';
import { stadiumService } from './services/stadiumService';
import { OperationsView } from './components/OperationsView';
import { AttendeeView } from './components/AttendeeView';
import { StaffView } from './components/StaffView';
import { Shield, User, Globe, Loader2, ArrowRight, Radio, MapPin } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [view, setView] = useState<'welcome' | 'operations' | 'attendee' | 'staff'>('welcome');
  const [activeRole, setActiveRole] = useState<'attendee' | 'operations' | 'staff' | null>(null);
  const [showAuth, setShowAuth] = useState<'operations' | 'staff' | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [state, setState] = useState<StadiumState | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubState = stadiumService.onStateUpdate(newState => {
      setState(newState);
      setLoading(false);
    });

    const unsubAlerts = stadiumService.onAlertsUpdate(newAlerts => {
      setAlerts(newAlerts);
    });

    return () => {
      unsubState();
      unsubAlerts();
    };
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock logic: admin123 for ops, staff123 for staff
    if ((showAuth === 'operations' && password === 'admin123') || 
        (showAuth === 'staff' && password === 'staff123')) {
      setView(showAuth);
      setActiveRole(showAuth);
      setShowAuth(null);
      setPassword('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 border-t-2 border-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Initializing ArenaFlow OS</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden selection:bg-indigo-500/30 bg-slate-950 font-sans">
      <AnimatePresence mode="wait">
        {view === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-full w-full flex relative"
          >
            {/* Sidebar for Pro Roles */}
            <aside className="w-16 md:w-20 border-r border-white/5 bg-slate-900/50 flex flex-col items-center py-8 gap-10 z-50">
               <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-black text-white text-xs shadow-lg shadow-indigo-600/20">AF</div>
               
               <div className="flex-1 flex flex-col gap-6">
                 <button 
                  onClick={() => setShowAuth('operations')}
                  className="group relative p-3 text-slate-500 hover:text-emerald-400 transition-colors"
                  title="Command Center"
                 >
                   <Shield className="w-6 h-6" />
                   <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-[10px] font-black uppercase rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap tracking-widest border border-white/5">Ops Login</div>
                 </button>
                 <button 
                  onClick={() => setShowAuth('staff')}
                  className="group relative p-3 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Staff Node"
                 >
                   <Radio className="w-6 h-6" />
                   <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-[10px] font-black uppercase rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap tracking-widest border border-white/5">Staff Login</div>
                 </button>
               </div>

               <div className="text-slate-700 hover:text-slate-500 cursor-help transition-colors">
                  <Globe className="w-5 h-5" />
               </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] bg-[size:64px_64px]" />
                
                {/* Visual Accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
                  <header className="space-y-6">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 text-indigo-400 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-sm"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Narendra Modi Stadium // Live Telemetry
                    </motion.div>
                    
                    <div className="space-y-4">
                       <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black uppercase tracking-tighter text-white leading-[0.8] whitespace-nowrap px-4 scale-[0.8] sm:scale-100"
                      >
                        ARENA<span className="text-indigo-600">FLOW</span>
                      </motion.h1>
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent w-full opacity-50"
                      />
                    </div>

                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed mt-8"
                    >
                      High-fidelity venue intelligence for global events. <span className="text-slate-600">Real-time crowd telemetry and predictive facility routing.</span>
                    </motion.p>
                  </header>

                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center gap-8 pt-8"
                  >
                    <button
                      onClick={() => setView('attendee')}
                      className="group relative px-16 py-6 bg-white rounded-2xl flex items-center gap-6 transition-all hover:scale-[1.05] active:scale-95 shadow-[0_0_50px_rgba(79,70,229,0.3)] hover:shadow-[0_0_70px_rgba(79,70,229,0.5)]"
                    >
                      <div className="p-3 bg-indigo-600 rounded-lg text-white group-hover:rotate-12 transition-transform">
                        <User className="w-8 h-8" />
                      </div>
                      <div className="text-left">
                        <span className="block text-2xl font-black uppercase tracking-tighter text-slate-950 leading-none mb-1">Enter Experience</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Public Gateway Alpha</span>
                      </div>
                      <ArrowRight className="w-8 h-8 text-indigo-600 group-hover:translate-x-2 transition-transform ml-4" />
                    </button>
                    
                    <div className="flex items-center gap-6 opacity-30">
                       <div className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-widest">AI_Routing_Live</span>
                       </div>
                       <div className="w-1 h-1 rounded-full bg-slate-800" />
                       <div className="flex items-center gap-2 text-indigo-400">
                         <span className="text-[9px] font-black uppercase tracking-widest">v2.4.0_Stable</span>
                       </div>
                    </div>
                  </motion.div>
                </div>
            </main>

            {/* Auth Overlay */}
            <AnimatePresence>
              {showAuth && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl"
                  >
                    <div className="flex justify-between items-start mb-8">
                       <div>
                         <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pro Authentication</h2>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Role: {showAuth} Access Point</p>
                       </div>
                       <button onClick={() => { setShowAuth(null); setAuthError(false); setPassword(''); }} className="text-slate-500 hover:text-white">
                         <Shield className="w-6 h-6" />
                       </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Key</label>
                         <input 
                           type="password" 
                           autoFocus
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className={cn(
                             "w-full bg-slate-950 border rounded-lg px-4 py-3 text-white font-mono focus:outline-none transition-all",
                             authError ? "border-rose-500 animate-shake" : "border-white/10 focus:border-indigo-500"
                           )}
                           placeholder="••••••••"
                         />
                         {authError && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">Unauthorized Access Attempt</p>}
                       </div>
                       <button 
                         type="submit"
                         className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20"
                       >
                         Authenticate Mission
                       </button>
                    </form>
                    <p className="mt-6 text-[9px] text-slate-600 text-center font-mono lowercase">Hint: admin123 / staff123 for testing</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === 'operations' && state && (
          <motion.div key="ops" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full">
            <OperationsView state={state} alerts={alerts} onLogout={() => { setView('welcome'); setActiveRole(null); }} />
          </motion.div>
        )}

        {view === 'attendee' && state && (
          <motion.div key="attendee" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative">
            <AttendeeView state={state} onExit={() => setView('welcome')} />
          </motion.div>
        )}

        {view === 'staff' && state && (
          <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative">
            <StaffView state={state} onLogout={() => { setView('welcome'); setActiveRole(null); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

