import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StadiumState, Zone, WaitTime } from '../types';
import { StadiumMap } from './StadiumMap';
import { 
  Navigation, 
  Clock, 
  Utensils, 
  DoorOpen, 
  Map as MapIcon,
  ChevronRight,
  Info,
  CircleDot
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AttendeeViewProps {
  state: StadiumState;
  onExit: () => void;
}

export const AttendeeView: React.FC<AttendeeViewProps> = ({ state, onExit }) => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'facilities' | 'routing'>('map');

  const facilities = (Object.values(state.zones) as Zone[]).filter(z => z.type === 'food' || z.type === 'restroom' || z.type === 'gate');

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans uppercase">
      {/* Header */}
      <header className="p-6 bg-white border-b border-slate-200 shrink-0 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-950 uppercase italic">Arena<span className="text-indigo-600">Flow</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Venue Assistant // LIVE</p>
        </div>
        <button 
          onClick={onExit}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-slate-200 shadow-sm active:scale-95"
        >
          <DoorOpen className="w-4 h-4" />
          Exit
        </button>
      </header>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4 h-full flex flex-col"
            >
              <div className="bg-slate-900 rounded-2xl p-1 shadow-2xl border border-slate-800 flex-1 min-h-[450px]">
                <StadiumMap 
                  state={state} 
                  onZoneClick={setSelectedZone} 
                  selectedZoneId={selectedZone?.id}
                  isOperationsMode={false}
                />
              </div>

              {selectedZone ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Venue Location</span>
                      <h3 className="text-xl font-black uppercase tracking-tight">{selectedZone.name}</h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Navigation className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Density</p>
                      <p className="text-xl font-black font-mono tracking-tighter">
                        {Math.round((selectedZone.currentCount / selectedZone.capacity) * 100)}%
                      </p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Est. Wait</p>
                      <p className="text-xl font-black font-mono tracking-tighter">
                        {state.waitTimes[selectedZone.id]?.minutes || Math.round((selectedZone.currentCount / selectedZone.capacity) * 15)}m
                      </p>
                    </div>
                  </div>

                  <button className="w-full mt-5 py-3 bg-white text-indigo-600 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-transform active:scale-95">
                    Navigate Here
                  </button>
                </motion.div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                  <CircleDot className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-tight">Select a zone to view telemetry</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'facilities' && (
            <motion.div 
              key="facilities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Facility Concierge</h2>
                <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-widest animate-pulse">Live</span>
              </div>

              <div className="space-y-3">
                {facilities.map(facility => (
                  <div 
                    key={facility.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
                    onClick={() => { setSelectedZone(facility); setActiveTab('map'); }}
                  >
                    <div className={cn(
                      "p-3 rounded-lg shadow-sm border",
                      facility.type === 'food' ? "bg-amber-50 border-amber-100 text-amber-500" :
                      facility.type === 'restroom' ? "bg-indigo-50 border-indigo-100 text-indigo-500" : "bg-slate-50 border-slate-100 text-slate-500"
                    )}>
                      {facility.type === 'food' ? <Utensils className="w-5 h-5" /> : <DoorOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{facility.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{facility.type === 'food' ? 'Food & Drink' : facility.type === 'gate' ? 'Exit Gate' : 'Facility'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <p className={cn(
                          "font-black text-sm font-mono",
                          state.waitTimes[facility.id]?.status === 'high' ? 'text-rose-500' : 'text-emerald-500'
                        )}>
                          {state.waitTimes[facility.id]?.minutes || 0}m
                        </p>
                      </div>
                      <p className="text-[8px] uppercase font-black tracking-widest opacity-40">Wait Time</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart Suggestion */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 shadow-xl">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">AI Routing Update</p>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Gate 3 (North) is currently at <span className="text-rose-400 font-bold">92% load</span>. We recommend using <span className="text-emerald-400 font-bold italic">Gate 2 (West)</span> for immediate exit (approx. 2m wait).
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'routing' && (
            <motion.div 
               key="routing"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="p-6 space-y-6 flex-1 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Transit & Egress</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-emerald-600">Sync Active</span>
                </div>
              </div>

              {/* Transit Nodes */}
              <div className="space-y-4">
                {(Object.values(state.zones) as Zone[]).filter(z => z.id === 'metro-station' || z.id.includes('parking')).map(node => (
                  <div key={node.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest leading-none mb-1">Hub Status</p>
                        <h4 className="text-lg font-black uppercase tracking-tight">{node.name}</h4>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Navigation className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimated Wait</p>
                        <p className="text-xl font-black font-mono tracking-tighter">
                          {Math.round((node.currentCount / node.capacity) * 25)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Density</p>
                        <div className="flex items-end gap-1">
                          <p className="text-xl font-black font-mono tracking-tighter">
                            {Math.round((node.currentCount / node.capacity) * 100)}%
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-300 pb-0.5">Cap.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gate Selection */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/40">
                <div className="flex items-center gap-3 mb-4">
                  <DoorOpen className="w-6 h-6 text-indigo-400" />
                  <h4 className="font-black uppercase tracking-tight">Recommended Exit Gate</h4>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Optimized for shortest wait time</p>
                
                <div className="space-y-3">
                  {(Object.values(state.zones) as Zone[]).filter(z => z.type === 'gate').map(gate => (
                    <div key={gate.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                      <span className="text-xs font-black uppercase tracking-tight opacity-70">{gate.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-emerald-400">{state.waitTimes[gate.id]?.minutes || 0}m Wait</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  )).slice(0, 2)}
                </div>

                <button className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                  Confirm Transit Route
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <footer className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-2xl">
        <div className="flex justify-between items-center px-4">
          <button 
            onClick={() => setActiveTab('map')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors uppercase",
              activeTab === 'map' ? "text-indigo-600" : "text-slate-400"
            )}
          >
            <MapIcon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
          </button>

          <button 
            onClick={() => setActiveTab('facilities')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors uppercase",
              activeTab === 'facilities' ? "text-indigo-600" : "text-slate-400"
            )}
          >
            <Utensils className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Amenities</span>
          </button>

          <button 
            onClick={() => setActiveTab('routing')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors uppercase",
              activeTab === 'routing' ? "text-indigo-600" : "text-slate-400"
            )}
          >
            <Navigation className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">Transit</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

