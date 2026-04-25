import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StadiumState, Zone, Alert } from '../types';
import { StadiumMap } from './StadiumMap';
import { stadiumService } from '../services/stadiumService';
import { 
  Activity as ActivityIcon, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Map as MapIcon,
  ShieldCheck,
  TrendingUp,
  Radio
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface OperationsViewProps {
  state: StadiumState;
  alerts: Alert[];
  onLogout: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({ state, alerts, onLogout }) => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'staff' | 'analytics'>('map');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiReport, setAIReport] = useState<{ summary: string, recommendations: any[] } | null>(null);
  const [transitFeeds, setTransitFeeds] = useState<any[]>([]);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());

  // Filter for unacknowledged critical alerts
  const criticalAlerts = alerts.filter(a => 
    (a.severity === 'critical' || a.severity === 'incident') && 
    !acknowledgedAlertIds.has(a.id)
  );

  useEffect(() => {
    // Sound alert for new critical notifications
    if (criticalAlerts.length > 0) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        // Audio might be blocked by browser policy until user interaction
      }
    }
  }, [criticalAlerts.length]);

  useEffect(() => {
    // Listen for transit confirmations
    const unsubscribe = stadiumService.onTransitUpdate((data) => {
      if (!data) return;
      // Sort by timestamp if available, most recent first
      const sorted = [...(data || [])].sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setTransitFeeds(sorted.slice(0, 5)); // Keep last 5
    });
    return unsubscribe;
  }, []);

  const zones = Object.values(state.zones || {}) as Zone[];
  const totalPeople = zones.reduce((sum, z) => sum + z.currentCount, 0);
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const avgDensity = totalCapacity > 0 ? (totalPeople / totalCapacity) * 100 : 0;

  const eventPhases: StadiumState['eventStatus'][] = ['pre-match', 'ongoing', 'halftime', 'ending', 'post-match'];

  const chartData = zones.map(z => ({
    name: z.name.split(' ')[0],
    occupancy: Math.round((z.currentCount / z.capacity) * 100)
  }));

  const handleStatusChange = (status: StadiumState['eventStatus']) => {
    stadiumService.setEventStatus(status);
    setIsStatusMenuOpen(false);
  };

  const runAIAnalysis = async () => {
    setIsAIAnalyzing(true);
    try {
      const data = await stadiumService.getAIAnalysis?.();
      setAIReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-slate-800 px-2 sm:px-4 md:px-6 bg-slate-900/50">
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
            <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 text-[10px] sm:text-xs md:text-base shrink-0">AF</div>
            <h1 className="text-[10px] sm:text-xs md:text-lg font-black tracking-tighter md:tracking-tight uppercase whitespace-nowrap">
              ARENAFLOW <span className="hidden lg:inline text-slate-500 font-normal ml-2">| OPS CENTER</span>
            </h1>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-800 shrink-0"></div>

          {/* Match HUD */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 overflow-hidden pointer-events-none sm:pointer-events-auto">
             <div className="flex flex-col relative shrink-0">
               <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                 <span className="text-[6px] xs:text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-tight">Phase</span>
                 <span className="hidden md:inline-block px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black rounded border border-indigo-500/20 italic tracking-tighter">PRO</span>
               </div>
               <button 
                 onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                 className="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity pointer-events-auto"
               >
                 <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse", 
                   state.eventStatus === 'ongoing' ? 'bg-emerald-500' : 
                   state.eventStatus === 'halftime' ? 'bg-amber-500' : 'bg-indigo-500'
                 )} />
                 <span className={cn("text-[8px] md:text-xs font-black uppercase tracking-tighter truncate max-w-[50px] xs:max-w-none", 
                    state.eventStatus === 'ongoing' ? 'text-emerald-400' : 
                    state.eventStatus === 'halftime' ? 'text-amber-400' : 'text-indigo-400'
                 )}>
                   {state.eventStatus.replace('-', ' ')}
                 </span>
               </button>

               <AnimatePresence>
                 {isStatusMenuOpen && (
                   <>
                     <div 
                       className="fixed inset-0 z-40" 
                       onClick={() => setIsStatusMenuOpen(false)} 
                     />
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 10 }}
                       className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                     >
                        <div className="p-2 border-b border-slate-800 bg-slate-950/50">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Update State</p>
                        </div>
                        {eventPhases.map(phase => (
                          <button
                            key={phase}
                            onClick={() => handleStatusChange(phase)}
                            className={cn(
                              "w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors",
                              state.eventStatus === phase ? "text-indigo-400 bg-indigo-500/5" : "text-slate-400"
                            )}
                          >
                            {phase.replace('-', ' ')}
                          </button>
                        ))}
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
             </div>

             <div className="hidden md:flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Match Time</span>
               <span className="text-xs font-black font-mono text-white italic">{state.matchMinute}' <span className="text-slate-600 font-normal">ELAPSED</span></span>
             </div>

             <div className="hidden sm:flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Telemetry</span>
               <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-emerald-400 font-mono">{(state.totalAttendees || totalPeople).toLocaleString()}</span>
                 <span className="text-[9px] font-bold text-slate-600 uppercase">HITS</span>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-8">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Event</span>
            <span className="text-sm font-medium">Championship Finals</span>
          </div>
          <div className="hidden md:block h-10 w-px bg-slate-800"></div>
          <button 
            onClick={onLogout}
            className="px-2 py-1.5 md:px-4 md:py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2 active:scale-95 shadow-lg"
          >
            <ShieldCheck className="w-3 md:w-4 h-3 md:h-4 text-rose-500" />
            <span className="hidden xs:inline">Exit</span>
          </button>
        </div>
      </header>

      <main className={cn(
        "flex flex-1 overflow-hidden relative transition-all duration-700",
        criticalAlerts.length > 0 && "ring-4 ring-inset ring-rose-600/50 shadow-[inset_0_0_100px_rgba(225,29,72,0.1)] animate-pulse"
      )}>
        {/* Critical Alerts Overlay */}
        <AnimatePresence>
          {criticalAlerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-0 left-0 right-0 z-[100] px-4 py-3 bg-rose-600 shadow-2xl flex items-center justify-between pointer-events-auto"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-white leading-none mb-1">
                    CRITICAL EMERGENCY ALERT ({criticalAlerts.length})
                  </h4>
                  <p className="text-xs font-bold text-rose-100 uppercase italic">
                    {criticalAlerts[0].message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const idsToAck = new Set(acknowledgedAlertIds);
                    criticalAlerts.forEach(a => idsToAck.add(a.id));
                    setAcknowledgedAlertIds(idsToAck);
                  }}
                  className="px-6 py-2 bg-white text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-rose-50 transition-colors active:scale-95"
                >
                  Acknowledge All
                </button>
              </div>
              
              {/* Visual "Scanner" scanline effect */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-white/40 animate-[shimmer_2s_infinite]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Nav */}
        <aside className="w-16 flex flex-col items-center py-6 gap-8 border-r border-slate-800 bg-slate-950 shrink-0">
          <button 
            onClick={() => setActiveTab('map')}
            className={cn(
              "p-2 rounded transition-all",
              activeTab === 'map' ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-xl" : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
            )}
          >
             <MapIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "p-2 rounded transition-all",
              activeTab === 'analytics' ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-xl" : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
            )}
          >
             <BarChart3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={cn(
              "p-2 rounded transition-all",
              activeTab === 'staff' ? "bg-slate-800 text-indigo-400 border border-slate-700 shadow-xl" : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
            )}
          >
             <Users className="w-5 h-5" />
          </button>
        </aside>

        {/* Content Grid */}
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto custom-scrollbar min-h-0 bg-slate-950/40">
           {activeTab === 'map' && (
            <div className="flex flex-col gap-6">
               <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-2xl relative overflow-hidden group h-[500px] ring-1 ring-white/5">
                  <div className="absolute inset-0 pointer-events-none z-10 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-2 bg-slate-950/90 backdrop-blur rounded border border-white/10 shadow-2xl">
                        <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1 tracking-widest">Global Surveillance</p>
                        <p className="text-[11px] font-black italic text-indigo-400 leading-none">SECTOR_{selectedZone?.id.split('-')[1] || 'SYNCHRONIZED'}</p>
                      </div>
                      <div className="px-3 py-2 bg-slate-950/90 backdrop-blur rounded border border-white/10 text-right shadow-2xl">
                        <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1 tracking-widest">Venue Integrity</p>
                        <p className="text-[11px] font-black italic text-emerald-400 leading-none">{(totalPeople / totalCapacity * 100).toFixed(1)}% LOAD</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/90 backdrop-blur rounded-xl border border-white/10 text-[9px] font-bold self-end w-full max-w-[140px] shadow-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Density Spectrum</span>
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                  
                  <StadiumMap 
                    state={state} 
                    onZoneClick={setSelectedZone} 
                    selectedZoneId={selectedZone?.id} 
                    showHeatmap={true} 
                    isOperationsMode={true}
                  />
               </div>
               
               {/* Analytics and Command row below map */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl border-t-indigo-500/20">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sector Analysis</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500 opacity-60">LIVE</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {zones.map(zone => {
                        const occupancy = (zone.currentCount / zone.capacity) * 100;
                        const isSelected = selectedZone?.id === zone.id;
                        return (
                          <div 
                            key={zone.id}
                            onClick={() => setSelectedZone(zone)}
                            className={cn(
                              "p-4 rounded-xl border transition-all cursor-pointer group active:scale-95",
                              isSelected 
                                ? "bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-600/20" 
                                : "bg-slate-950/50 border-white/5 hover:border-white/10 hover:bg-slate-900"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-tight",
                                isSelected ? "text-white" : "text-slate-300"
                              )}>{zone.name}</span>
                              <span className={cn(
                                "text-[10px] font-mono",
                                isSelected ? "text-indigo-200" : "text-slate-500"
                              )}>{Math.round(occupancy)}%</span>
                            </div>
                            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${occupancy}%` }}
                                className={cn(
                                  "h-full rounded-full transition-colors",
                                  isSelected ? "bg-white" :
                                  occupancy > 80 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-indigo-500"
                                )} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>

                 {/* Command Actions Column */}
                 <div className="flex flex-col gap-6">
                    {/* Global Command Node */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-4 shadow-xl border-t-rose-500/20">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Global Broadcast</h3>
                        <Radio className="w-3 h-3 text-rose-500" />
                      </div>
                      
                      <div className="relative">
                        <textarea 
                          placeholder="Type emergency alert..." 
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:border-rose-500 transition-colors resize-none placeholder:text-slate-700 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const msg = (e.target as HTMLTextAreaElement).value;
                              if (msg) {
                                stadiumService.broadcastAlert(msg, 'critical');
                                (e.target as HTMLTextAreaElement).value = '';
                                alert('Broadcast Sent');
                              }
                            }
                          }}
                        />
                      </div>
                      <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest text-center">Press Enter to Transmit</p>
                    </div>

                    {/* Zone-Specific Actions */}
                    {selectedZone ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden group flex-1 border-t-indigo-500/20"
                      >
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ActivityIcon className="w-12 h-12" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-3 flex items-center gap-2">
                            <Radio className="w-3 h-3" />
                            Tactical Module
                        </h4>
                        <p className="text-sm font-black text-white italic uppercase tracking-tighter mb-4">{selectedZone.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {selectedZone.type === 'gate' && (
                              <button 
                                onClick={() => {
                                  stadiumService.confirmTransit(selectedZone.id, selectedZone.name);
                                  alert(`ACCESS GRANTED: ${selectedZone.name}`);
                                }}
                                className="col-span-2 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 mb-1"
                              >
                                Grant Entry Access
                              </button>
                            )}
                            <button 
                              onClick={() => stadiumService.reinforceStaff()}
                              className="py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                              Deploy Staff
                            </button>
                            <button 
                              onClick={() => stadiumService.broadcastAlert(`ATTENTION ${selectedZone.name.toUpperCase()}: MAINTAIN FLOW`, 'warning')}
                              className="py-3 bg-slate-800 text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/10 active:scale-95"
                            >
                              Zone Alert
                            </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-5 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 flex-1">
                          <MapIcon className="w-8 h-8 text-slate-800 mb-2" />
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Target Unselected</p>
                          <p className="text-[8px] font-bold text-slate-800 uppercase max-w-[120px]">Select a sector for localized commands</p>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Personnel Deployment Table */}
                 <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col border-t-indigo-500/20">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Personnel Deployment Overview</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                          <tr>
                            <th className="pb-3 pl-2">Member ID</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Deployment Zone</th>
                            <th className="pb-3 text-right pr-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {state.staff?.map(member => (
                            <tr key={member.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                              <td className="py-4 pl-2 font-mono font-bold text-indigo-400">{member.id}</td>
                              <td className="py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                  member.role === 'security' ? "bg-indigo-500/10 text-indigo-400" : "bg-rose-500/10 text-rose-400"
                                )}>
                                  {member.role}
                                </span>
                              </td>
                              <td className="py-4 font-black uppercase text-slate-300">{state.zones?.[member.zoneId]?.name || member.zoneId}</td>
                              <td className="py-4 text-right pr-2">
                                <div className="flex items-center justify-end gap-2">
                                  {state.instructions?.find(i => i.staffId === member.id && i.status === 'pending') && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  )}
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase",
                                    member.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                                  )}>{member.status}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>

                 {/* Incident & Queue Sidebar for Staff Tab */}
                 <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col border-t-rose-500/20">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Alerts</h3>
                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[7px] font-black">{alerts?.length || 0}</span>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        {alerts?.map(alert => (
                          <div key={alert.id} className="p-3 bg-slate-950/50 border border-rose-500/20 rounded-xl">
                            <p className="text-[10px] font-black text-rose-400 uppercase leading-tight mb-2">{alert.message}</p>
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-600">
                              <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                              <button 
                                onClick={() => stadiumService.resolveIncident(alert.id)}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                RESOLVE
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!alerts || alerts.length === 0) && (
                          <p className="text-[9px] font-black text-slate-700 uppercase italic text-center py-4">No active incidents</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col border-t-indigo-500/20">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Command Actions</h3>
                       <div className="space-y-3">
                          <button 
                            onClick={() => stadiumService.recallAllStaff()}
                            className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 active:scale-95"
                          >
                            Recall All
                          </button>
                          <button 
                            onClick={() => stadiumService.reinforceStaff()}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95"
                          >
                            Reinforce All
                          </button>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          )}          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col border-t-indigo-500/20">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-slate-800 pb-4 text-slate-300">Stadium Occupancy Telemetry</h3>
                  <div className="h-80 md:h-96 w-full px-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis 
                          dataKey="name" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          interval={0}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip 
                          contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '8px' }}
                          itemStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}
                          cursor={{ fill: '#ffffff05' }}
                        />
                        <Bar 
                          dataKey="occupancy" 
                          fill="#4f46e5" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Detail Stats */}
                 <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Efficiency Rating</p>
                    <p className="text-4xl font-mono font-black tracking-tighter italic text-indigo-400">{(totalPeople / totalCapacity * 100).toFixed(1)}%</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Manifest Utilization Index</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Flow Velocity</p>
                    <p className="text-4xl font-mono font-black tracking-tighter italic text-emerald-400">842 <span className="text-xs text-slate-700 font-normal">PPM</span></p>
                    <p className="text-[9px) font-bold text-slate-500 mt-2 uppercase">Measured Sector Passage</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Telemetry Health</p>
                    <p className="text-4xl font-mono font-black tracking-tighter italic text-rose-500">99.9%</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Node Signal Integrity</p>
                 </div>
               </div>

               {/* Move Command Node and AI Feed here to fix layout and keep them accessible */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {/* Command Module */}
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-4 shadow-xl border-t-rose-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Command Node</h3>
                      <ActivityIcon className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    
                    <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                        <div className="flex-1">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Safety Index</p>
                          <p className={cn(
                            "text-3xl font-mono font-black tracking-tighter",
                            alerts.length > 0 || avgDensity > 75 ? "text-rose-500" : "text-emerald-400"
                          )}>
                            {(100 - (alerts.length * 2) - (avgDensity > 80 ? (avgDensity - 80) * 1.5 : 0)).toFixed(1)}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-slate-800"></div>
                        <div className="flex-1">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Flow PPM</p>
                          <p className="text-3xl font-mono font-black tracking-tighter text-indigo-400">142</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Broadcast Urgent Msg..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-[10px] font-bold text-white focus:border-rose-500 transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const msg = (e.target as HTMLInputElement).value;
                                if (msg) {
                                  stadiumService.broadcastAlert(msg, 'critical');
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <Radio className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                        </div>
                        <button 
                          onClick={() => confirm('Full system reset?') && stadiumService.resetSimulation()}
                          className="w-full py-2.5 bg-slate-800/50 hover:bg-rose-900/20 hover:text-rose-400 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Reset Simulation Node
                        </button>
                    </div>
                  </div>

                  {/* AI & Routing Module */}
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-4 shadow-xl border-t-indigo-500/20 lg:col-span-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Intelligence Feed</h3>
                      <div className="flex items-center gap-2">
                        {transitFeeds?.length > 0 && (
                          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[7px] font-black text-emerald-400 uppercase">Live_Feed</span>
                          </div>
                        )}
                        <button 
                          onClick={runAIAnalysis}
                          disabled={isAIAnalyzing}
                          className={cn(
                            "px-3 py-1 bg-indigo-600 rounded text-[8px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-600/20",
                            isAIAnalyzing && "opacity-50 animate-pulse"
                          )}
                        >
                          {isAIAnalyzing ? 'Analyzing...' : 'Sync AI Intelligence'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Routing Telemetry</p>
                        <div className="space-y-1.5 h-32 overflow-y-auto custom-scrollbar pr-2">
                          {transitFeeds?.length > 0 ? (
                             transitFeeds.map((t, i) => (
                              <div key={t.id || i} className="flex justify-between items-center p-2 bg-slate-950/30 rounded border border-white/5">
                                <span className="text-[9px] font-black text-slate-400 uppercase italic">Fan_Exit ➔ {t.gateName}</span>
                                <span className="text-[8px] font-mono text-indigo-500">{new Date(t.timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString()}</span>
                              </div>
                             ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 border border-dashed border-slate-800 rounded">
                              <Users className="w-6 h-6 mb-1" />
                              <p className="text-[8px] font-bold uppercase">No Active Egress Signals</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Tactical Proposals</p>
                        <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar pr-2">
                          {aiReport?.recommendations?.map((rec, i) => (
                             <div key={i} className="flex items-center gap-3 p-2 bg-slate-950/50 rounded border border-indigo-500/10">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  rec.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                                )} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-black text-slate-300 uppercase truncate leading-none mb-1">{rec.title}</p>
                                  <p className="text-[8px] text-slate-500 font-bold">{rec.action}</p>
                                </div>
                             </div>
                          )) || (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 border border-dashed border-slate-800 rounded">
                              <BarChart3 className="w-6 h-6 mb-1" />
                              <p className="text-[8px] font-bold uppercase">Awaiting Re-calculation</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* System Footer */}
      <footer className="h-10 shrink-0 border-t border-slate-800 flex items-center px-6 justify-between bg-slate-950/80">
        <div className="flex items-center gap-6 text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />System: Online</span>
          <span>Latency: <span className="text-slate-300">12ms</span></span>
          <span>Nodes: <span className="text-slate-300">1,042</span></span>
        </div>
        <div className="text-[10px] text-slate-600 font-bold tracking-tight uppercase font-mono">
          ARENAFLOW_OS_STABLE // 2026.04.24
        </div>
      </footer>
    </div>
  );
};

