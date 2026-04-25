import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StadiumState, Zone, Alert } from '../types';
import { StadiumMap } from './StadiumMap';
import { stadiumService } from '../services/stadiumService';
import { 
  Activity, 
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

  const zones = Object.values(state.zones) as Zone[];
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
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-6 bg-slate-900/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">AF</div>
            <h1 className="text-lg font-bold tracking-tight uppercase">ARENAFLOW <span className="text-slate-500 font-normal ml-2">| OPS CENTER</span></h1>
          </div>

          <div className="h-10 w-px bg-slate-800"></div>

          {/* Match HUD */}
          <div className="flex items-center gap-8">
             <div className="flex flex-col relative">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">Event Phase</span>
                 <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black rounded border border-indigo-500/20 italic tracking-tighter">PRO_MODE</span>
               </div>
               <button 
                 onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                 className="flex items-center gap-2 hover:opacity-80 transition-opacity"
               >
                 <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                   state.eventStatus === 'ongoing' ? 'bg-emerald-500' : 
                   state.eventStatus === 'halftime' ? 'bg-amber-500' : 'bg-indigo-500'
                 )} />
                 <span className={cn("text-xs font-black uppercase tracking-tighter", 
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

             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Match Time</span>
               <span className="text-xs font-black font-mono text-white italic">{state.matchMinute}' <span className="text-slate-600 font-normal">ELAPSED</span></span>
             </div>

             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Telemetry</span>
               <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-emerald-400 font-mono">{(state.totalAttendees || totalPeople).toLocaleString()}</span>
                 <span className="text-[9px] font-bold text-slate-600 uppercase">HITS</span>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Event</span>
            <span className="text-sm font-medium">Championship Finals: Hawks vs. Lions</span>
          </div>
          <div className="h-10 w-px bg-slate-800"></div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2 active:scale-95 shadow-lg"
          >
            <Radio className="w-4 h-4" />
            Terminal Exit
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
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
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden min-h-0">
          {activeTab === 'map' && (
            <div className="grid grid-cols-12 gap-6 h-full min-h-0">
              
              {/* Main Visualizer */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 min-h-0">
                <div className="flex-[3] rounded-xl bg-slate-900 border border-slate-800 p-0 relative overflow-hidden shadow-2xl group flex flex-col">
                  {/* Heatmap UI Overlays */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="bg-slate-950/80 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Live Flow View</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 font-mono">Normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 font-mono">Busy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 font-mono">Critical</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-full p-2">
                    <StadiumMap 
                      state={state} 
                      onZoneClick={setSelectedZone} 
                      selectedZoneId={selectedZone?.id} 
                      showHeatmap={true} 
                      isOperationsMode={true}
                    />
                  </div>

                  {/* Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] bg-[size:40px_40px]" />

                  {/* Inspect Overlay */}
                  {selectedZone && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-lg p-5 flex justify-between items-center z-20 shadow-2xl"
                    >
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono tracking-tighter">Zone Inspector</p>
                          <h4 className="text-xl font-black uppercase text-white tracking-tighter">{selectedZone.name}</h4>
                        </div>
                        <div className="h-10 w-px bg-slate-800"></div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Utilization</p>
                          <p className={cn(
                            "text-xl font-black font-mono",
                            (selectedZone.currentCount / selectedZone.capacity) > 0.8 ? "text-rose-500" : "text-emerald-400"
                          )}>
                            {Math.round((selectedZone.currentCount / selectedZone.capacity) * 100)}%
                          </p>
                        </div>
                        <div className="hidden lg:block lg:w-32 xl:w-48 space-y-2">
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(selectedZone.currentCount / selectedZone.capacity) * 100}%` }}
                              className={cn(
                                "h-full transition-all duration-1000",
                                (selectedZone.currentCount / selectedZone.capacity) > 0.8 ? "bg-rose-500" : "bg-emerald-500"
                              )}
                            />
                          </div>
                          <p className="text-[8px] text-slate-500 font-bold uppercase font-mono tracking-widest text-right">Capacity Index: {selectedZone.capacity} Max</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <p className="text-[8px] opacity-40 uppercase font-black tracking-widest leading-none">Disaptch Instruction</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Message..." 
                              className="w-32 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const msg = (e.target as HTMLInputElement).value;
                                  if (msg) {
                                    stadiumService.dispatchInstruction('S-1', msg);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              // Deploy nearest available staff to this zone
                              stadiumService.deployStaff('S-1', selectedZone.id);
                            }}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                          >
                            Deploy
                          </button>
                          <button 
                            onClick={() => {
                              // Simulate opening gate by reducing count
                              stadiumService.replaceZoneCount(selectedZone.id, Math.floor(selectedZone.currentCount * 0.1));
                            }}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
                          >
                            Egress
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Bottom Ops Shelf */}
                <div className="h-48 flex gap-6 shrink-0">
                  <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-4 overflow-hidden flex flex-col shadow-xl">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Smart Routing Engine</h3>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                      <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg hover:bg-indigo-500/10 transition-colors">
                        <div className="p-1.5 bg-indigo-600 rounded text-white shadow-lg shadow-indigo-600/20">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase text-white truncate italic">Reroute Proposal // Gate_4 ➔ Gate_1</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5">High friction at North junction. West capacity at 32%.</p>
                        </div>
                        <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] rounded uppercase shadow-lg shadow-indigo-600/20 transition-all active:scale-95">EXECUTE</button>
                      </div>
                    </div>
                  </div>

                  <div className="w-64 rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between shadow-xl">
                     <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public Safety Index</h3>
                     <div className="flex flex-col items-center py-2">
                       <span className={cn(
                         "text-5xl font-mono font-black tracking-tighter",
                         alerts.length > 0 || avgDensity > 75 ? "text-rose-500" : "text-emerald-400"
                       )}>
                         {(100 - (alerts.length * 2) - (avgDensity > 80 ? (avgDensity - 80) * 1.5 : 0)).toFixed(1)}
                       </span>
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-[0.2em] mt-1",
                         alerts.length > 0 || avgDensity > 75 ? 'text-rose-500' : 'text-emerald-500/60'
                       )}>Status: {alerts.length > 0 ? 'Incident_Active' : avgDensity > 75 ? 'Advisory' : 'Nominal'}</span>
                     </div>
                     <div className="space-y-1.5 border-t border-slate-800 pt-4">
                       <div className="flex justify-between text-[9px] font-bold uppercase font-mono text-slate-500">
                         <span className="opacity-50">Flow Rate</span>
                         <span className="text-slate-300">142 PPM</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-bold uppercase font-mono text-slate-500">
                         <span className="opacity-50">Entry_Load</span>
                         <span className="text-slate-300 tracking-tighter">{(totalPeople / totalCapacity * 100).toFixed(1)}%</span>
                       </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Side Terminal */}
              <div className="col-span-4 flex flex-col gap-6 min-h-0">
                <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
                   <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                      <h3 className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Queue Telemetry</h3>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">Live_Feed</span>
                      </span>
                   </div>
                   <div className="p-4 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
                     {zones.filter(z => z.type === 'food' || z.type === 'gate').map(z => {
                       const wait = state.waitTimes[z.id];
                       return (
                        <div key={z.id}>
                          <div className="flex justify-between text-[11px] mb-1.5 font-bold uppercase tracking-tight">
                            <span className="text-slate-400">{z.name}</span>
                            <span className={cn(
                              "font-mono",
                              wait?.status === 'high' ? 'text-rose-500' : 
                              wait?.status === 'medium' ? 'text-amber-500' : 'text-emerald-400'
                            )}>{wait?.minutes || 0} min</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                wait?.status === 'high' ? 'bg-rose-500' : 
                                wait?.status === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(100, (wait?.minutes || 0) * 5)}%` }}
                            />
                          </div>
                        </div>
                       )
                     })}
                   </div>
                </div>

                <div className="h-80 rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col shadow-2xl">
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest border-b border-slate-800 pb-2 flex items-center justify-between">
                     <span>Incident Log</span>
                     <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[8px]">{alerts.length} Active</span>
                   </h3>
                   <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                     {alerts.map(alert => (
                       <div key={alert.id} className={cn(
                         "group flex gap-3 border-l-2 pl-3 py-2 transition-all hover:bg-white/5",
                         alert.severity === 'critical' ? 'border-rose-600 bg-rose-500/5' : 'border-amber-600 bg-amber-500/5'
                       )}>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center gap-2 mb-1">
                             <p className={cn(
                               "text-[10px] font-black uppercase truncate",
                               alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                             )}>{alert.message}</p>
                             <button 
                               onClick={() => stadiumService.resolveIncident(alert.id)}
                               className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded text-[8px] font-bold transition-all border border-emerald-500/30"
                             >
                               RESOLVE
                             </button>
                           </div>
                           <p className="text-[8px] text-slate-500 font-bold">
                             {new Date(alert.timestamp).toLocaleTimeString()} // ZONE_{alert.zoneId.split('-')[1]?.toUpperCase() || 'NA'}
                           </p>
                         </div>
                       </div>
                     ))}
                     {alerts.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center opacity-10">
                          <ShieldCheck className="w-12 h-12 mb-2" />
                          <p className="text-[10px] font-black uppercase">No Active Incidents</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-12 gap-6 h-full min-h-0">
               <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Personnel Deployment Overview</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    <table className="w-full text-left">
                      <thead className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="pb-3 pl-2">Member ID</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Deployment Zone</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Active Tasking</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {state.staff.map(member => (
                          <tr key={member.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                            <td className="py-4 pl-2 font-mono font-bold text-indigo-400">{member.id}</td>
                            <td className="py-4">
                              <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black uppercase tracking-tighter">
                                {member.role}
                              </span>
                            </td>
                            <td className="py-4 font-black uppercase text-slate-300">{state.zones[member.zoneId]?.name || member.zoneId}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-emerald-400 uppercase">{member.status}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right pr-2">
                              {state.instructions.find(i => i.staffId === member.id && i.status === 'pending') ? (
                                <span className="text-[9px] font-black italic text-amber-400 animate-pulse">PENDING_TASK</span>
                              ) : (
                                <span className="text-[9px] font-black text-slate-600 uppercase">Idle_Standby</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-6 tracking-widest leading-none italic border-b border-slate-800 pb-4">Resource Allocation</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                        <span className="text-slate-400">Security Personnel</span>
                        <span className="text-white">128/150</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[85%]" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                        <span className="text-slate-400">Medical Units</span>
                        <span className="text-white">12/15</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[80%]" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                        <span className="text-slate-400">Logistics Staff</span>
                        <span className="text-white">45/60</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[75%]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-800">
                    <p className="text-[10px] font-black italic text-slate-500 uppercase mb-4">Quick Dispatch</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-black text-[9px] uppercase tracking-widest transition-all">Recall All</button>
                      <button className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20">Reinforce</button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-12 gap-6 h-full min-h-0">
               <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Stadium Occupancy Telemetry</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis 
                          dataKey="name" 
                          stroke="#475569" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip 
                          contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
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

               <div className="col-span-4 flex flex-col gap-6">
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
                     <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-6 tracking-widest">Attendance Efficiency</h3>
                     <div className="space-y-8">
                        <div>
                          <p className="text-3xl font-black font-mono tracking-tighter italic text-indigo-400">{(totalPeople / totalCapacity * 100).toFixed(1)}%</p>
                          <p className="text-[9px] font-black uppercase text-slate-500 mt-1">Total Manifest Utilization</p>
                        </div>
                        <div>
                          <p className="text-3xl font-black font-mono tracking-tighter italic text-emerald-400">842 <span className="text-xs text-slate-600 font-normal">PPM</span></p>
                          <p className="text-[9px] font-black uppercase text-slate-500 mt-1">Peak Flow Velocity</p>
                        </div>
                        <div className="pt-6 border-t border-slate-800">
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-[9px] font-black uppercase text-slate-400 italic">Predictive AI Engine</p>
                            <button 
                              onClick={runAIAnalysis}
                              disabled={isAIAnalyzing}
                              className={cn(
                                "text-[9px] font-black uppercase px-3 py-1.5 rounded transition-all active:scale-95",
                                isAIAnalyzing ? "bg-slate-800 text-slate-600 animate-pulse" : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
                              )}
                            >
                              {isAIAnalyzing ? 'Analyzing...' : 'Run Crowd AI'}
                            </button>
                          </div>
                          
                          {aiReport && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-indigo-600/10 border border-indigo-600/20 rounded-xl p-4 space-y-4 shadow-xl"
                            >
                              <div className="flex items-center gap-2">
                                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">{aiReport.summary}</p>
                              </div>
                              <div className="space-y-3">
                                {aiReport.recommendations.map((rec, i) => (
                                  <div key={i} className="p-3 bg-slate-950/50 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[9px] font-black text-slate-100 uppercase">{rec.title}</span>
                                      <span className={cn(
                                        "text-[8px] font-bold px-1 rounded uppercase",
                                        rec.priority === 'high' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                                      )}>{rec.priority}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-relaxed font-bold">{rec.action}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {!aiReport && !isAIAnalyzing && (
                            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center">
                              <BarChart3 className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                              <p className="text-[9px] font-black text-slate-700 uppercase">Awaiting AI Activation</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-slate-800">
                          <p className="text-[9px] font-black uppercase text-slate-400 italic mb-3">Live Capacity Heatmap</p>
                          <div className="grid grid-cols-4 gap-1">
                            {zones.slice(0, 16).map(z => {
                              const density = z.currentCount / z.capacity;
                              return (
                                <div 
                                  key={z.id} 
                                  className={cn(
                                    "h-6 rounded-sm transition-all",
                                    density > 0.9 ? 'bg-rose-500' : 
                                    density > 0.7 ? 'bg-amber-500' : 'bg-emerald-500/20 shadow-inner'
                                  )}
                                  title={`${z.name}: ${Math.round(density * 100)}%`}
                                />
                              )
                            })}
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

