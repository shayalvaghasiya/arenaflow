import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StadiumState, StaffMember, StaffInstruction } from '../types';
import { stadiumService } from '../services/stadiumService';
import { 
  Bell, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  User,
  Users,
  Shield,
  Stethoscope,
  Info,
  Flame,
  Activity,
  AlertTriangle,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StadiumMap } from './StadiumMap';

interface StaffViewProps {
  state: StadiumState;
  onLogout: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ state, onLogout }) => {
  const [activeTab, setActiveTab] = React.useState<'tactical' | 'mapping' | 'instructions'>('tactical');
  const [selectedInstructionId, setSelectedInstructionId] = React.useState<string | null>(null);

  // Simulatively picking one staff member for this view
  const currentStaffId = 'S-1';
  const staffMember = state.staff.find(s => s.id === currentStaffId);
  const myInstructions = state.instructions.filter(i => i.staffId === currentStaffId);

  const handleReportIncident = (type: 'medical' | 'security' | 'fire' | 'crowd') => {
    if (staffMember) {
      stadiumService.reportIncident(staffMember.id, staffMember.zoneId, type);
    }
  };

  const handleLocationUpdate = (zoneId: string) => {
    stadiumService.deployStaff(currentStaffId, zoneId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'security': return <Shield className="w-5 h-5" />;
      case 'medical': return <Stethoscope className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans uppercase overflow-hidden">
      {/* Staff Header */}
      <header className="p-6 bg-slate-900 border-b border-white/10 flex justify-between items-center shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded shadow-lg shadow-indigo-600/30">
            {staffMember ? getRoleIcon(staffMember.role) : <User className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-indigo-400">Tactical Node // {staffMember?.id}</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-tighter">{staffMember?.name} // {staffMember?.role.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-500">Node_Active</span>
          </div>
          <button 
            onClick={onLogout}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2 active:scale-95"
          >
            <Clock className="w-3 h-3 rotate-180" />
            Out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'tactical' && (
          <div className="p-4 space-y-6">
            {/* Quick Stats Overlay */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-900 border border-white/5 rounded-xl shadow-lg">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Post</p>
                <p className="text-lg font-black text-white italic">{state.zones[staffMember?.zoneId || '']?.name || 'Mobilizing'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-white/5 rounded-xl shadow-lg">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Sector Heat</p>
                <p className="text-lg font-black text-emerald-400 italic">Nominal</p>
              </div>
            </div>

            {/* Active Instruction Callout */}
            <AnimatePresence>
              {myInstructions.find(i => i.status === 'pending') && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="p-5 bg-indigo-600 rounded-xl shadow-2xl shadow-indigo-600/20 border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Bell className="w-12 h-12 rotate-12" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Priority Order Received</h3>
                  <p className="text-sm font-black leading-tight mb-4 text-white">
                    {myInstructions.find(i => i.status === 'pending')?.message}
                  </p>
                  <button 
                    onClick={() => stadiumService.acknowledgeInstruction(myInstructions.find(i => i.status === 'pending')!.id)}
                    className="w-full py-3 bg-white text-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-transform"
                  >
                    Confirm Engagement
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Incident Dispatch Hub */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h2 className="text-[10px] font-black tracking-widest text-slate-500 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Report Incident
                </h2>
                <span className="text-[9px] font-mono text-slate-600">AUTH_MODE: {staffMember?.role.toUpperCase()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleReportIncident('security')}
                  className="p-6 bg-slate-900 border border-white/5 rounded-xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-slate-800"
                >
                  <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20">
                    <Shield className="w-6 h-6 text-rose-500" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest">Security</span>
                </button>
                <button 
                  onClick={() => handleReportIncident('medical')}
                  className="p-6 bg-slate-900 border border-white/5 rounded-xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-slate-800"
                >
                  <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <Activity className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest">Medical</span>
                </button>
                <button 
                  onClick={() => handleReportIncident('fire')}
                  className="p-6 bg-slate-900 border border-white/5 rounded-xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-slate-800"
                >
                  <div className="p-3 bg-orange-500/10 rounded-full border border-orange-500/20">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest">Fire</span>
                </button>
                <button 
                  onClick={() => handleReportIncident('crowd')}
                  className="p-6 bg-slate-900 border border-white/5 rounded-xl flex flex-col items-center gap-3 active:scale-95 transition-all hover:bg-slate-800"
                >
                  <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    <Users className="w-6 h-6 text-indigo-500" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest">Crowd</span>
                </button>
              </div>
            </section>

            {/* Geo Presence */}
            <section className="p-4 bg-slate-900 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Sector Control</h3>
                <Key className="w-3 h-3 text-amber-500" />
              </div>
              
              <div className="flex flex-col gap-2">
                <p className="text-[8px] font-black text-slate-600 uppercase">Authentication Overrides</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => alert('Access Granted: Manual Override active for 30s')}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Key className="w-3 h-3" />
                    Open Gate
                  </button>
                  <button 
                    onClick={() => alert('Sector Lockdown initiated')}
                    className="flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Shield className="w-3 h-3" />
                    Lockdown
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="flex-1">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Report New Position</p>
                  <select 
                    value={staffMember?.zoneId} 
                    onChange={(e) => handleLocationUpdate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-black uppercase text-white outline-none focus:border-indigo-500"
                  >
                    {(Object.values(state.zones) as any[]).map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'instructions' && (
          <div className="p-4 space-y-4">
            <h2 className="text-[10px] font-black tracking-widest text-slate-500 border-b border-white/5 pb-2">Mission Log // Active Orders</h2>
            <div className="space-y-3">
              {myInstructions.length > 0 ? [...myInstructions].reverse().map(instr => (
                <div 
                  key={instr.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    instr.status === 'pending' ? "bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/20 shadow-xl shadow-indigo-600/10" : "bg-slate-950 border-white/5 opacity-60"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        instr.status === 'pending' ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"
                      )} />
                      <span className="text-[10px] font-black uppercase text-slate-100 italic">LOGID_{instr.id.split('-')[1]}</span>
                    </div>
                    <span className="text-[8px] font-mono opacity-40">{new Date(instr.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200 mb-4 tracking-tight leading-relaxed">{instr.message}</p>
                  {instr.status === 'pending' && (
                    <button 
                      onClick={() => stadiumService.acknowledgeInstruction(instr.id)}
                      className="w-full py-2 bg-indigo-600 text-white rounded font-black text-[9px] uppercase tracking-widest active:scale-95 transition-transform"
                    >
                      Acknowledge & Deploy
                    </button>
                  )}
                  {instr.status === 'acknowledged' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1.5 uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Operation in Progress
                      </span>
                      <button 
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-black uppercase border border-white/5"
                        onClick={() => setSelectedInstructionId(instr.id)} // Mocking complete flow if needed
                      >
                        Details
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-10">
                  <Clock className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black tracking-widest">Awaiting Command</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-slate-900 relative">
              <div className="absolute inset-0 pointer-events-none z-10 p-4">
                 <div className="px-3 py-2 bg-slate-950/80 backdrop-blur rounded border border-white/10 w-fit">
                    <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Target Sector</p>
                    <p className="text-[10px] font-black italic text-indigo-400 leading-none">Sector {staffMember?.zoneId.split('-')[1] || 'S'}</p>
                 </div>
              </div>
              <StadiumMap 
                state={state} 
                showHeatmap={false} 
                isOperationsMode={false} 
                onZoneClick={(z) => handleLocationUpdate(z.id)}
                selectedZoneId={staffMember?.zoneId}
              />
              <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2">
                 <div className="p-3 bg-slate-950/80 backdrop-blur rounded-lg border border-white/10 text-[9px] font-bold">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-slate-500 uppercase tracking-widest">Crowd Density Spectrum</span>
                       <span className="text-[8px] font-mono opacity-40 italic">Live_Overlay_v4.2</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <nav className="p-4 bg-slate-900 border-t border-white/10 shrink-0">
         <div className="flex items-center justify-around">
            <button 
              onClick={() => setActiveTab('tactical')}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all text-[8px] font-black uppercase tracking-widest",
                activeTab === 'tactical' ? "text-indigo-400" : "text-slate-500"
              )}
            >
               <Shield className={cn("w-6 h-6", activeTab === 'tactical' ? "fill-indigo-500/20" : "")} />
               Tactical
            </button>
            <button 
              onClick={() => setActiveTab('mapping')}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all text-[8px] font-black uppercase tracking-widest",
                activeTab === 'mapping' ? "text-indigo-400" : "text-slate-500"
              )}
            >
               <MapPin className={cn("w-6 h-6", activeTab === 'mapping' ? "fill-indigo-500/20" : "")} />
               Mapping
            </button>
            <button 
              onClick={() => setActiveTab('instructions')}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest relative",
                activeTab === 'instructions' ? "text-indigo-400" : "text-slate-500"
              )}
            >
               <Bell className={cn("w-6 h-6", activeTab === 'instructions' ? "fill-indigo-500/20" : "")} />
               {myInstructions.some(i => i.status === 'pending') && (
                 <div className="absolute top-0 right-1 w-2 h-2 bg-rose-500 rounded-full border border-slate-900 animate-pulse" />
               )}
               Alerts
            </button>
         </div>
      </nav>
    </div>
  );
};

