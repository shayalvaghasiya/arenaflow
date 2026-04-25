import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { StadiumState, Zone } from '../types';

interface StadiumMapProps {
  state: StadiumState;
  onZoneClick?: (zone: Zone) => void;
  selectedZoneId?: string;
  showHeatmap?: boolean;
  isOperationsMode?: boolean;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({ 
  state, 
  onZoneClick, 
  selectedZoneId,
  showHeatmap: initialShowHeatmap = true,
  isOperationsMode = false
}) => {
  const [internalShowHeatmap, setInternalShowHeatmap] = React.useState(initialShowHeatmap);
  const [hoveredZoneId, setHoveredZoneId] = React.useState<string | null>(null);
  const [showLegend, setShowLegend] = React.useState(false);
  const zones = Object.values(state.zones) as Zone[];

  const getZoneColor = (zone: Zone) => {
    if (!internalShowHeatmap) return 'fill-slate-800 hover:fill-slate-700';
    const density = zone.currentCount / zone.capacity;
    if (density > 0.9) return 'fill-rose-500';
    if (density > 0.7) return 'fill-amber-500';
    if (density > 0.4) return 'fill-emerald-500';
    return 'fill-emerald-500/40';
  };

  const getGlowEffect = (zone: Zone) => {
    const density = zone.currentCount / zone.capacity;
    if (density > 0.9) return 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    if (density > 0.7) return 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    if (density > 0.4) return 'drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]';
    return '';
  };

  const getSectorPath = (innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 50 + outerRadius * Math.cos(startRad);
    const y1 = 50 + outerRadius * Math.sin(startRad);
    const x2 = 50 + outerRadius * Math.cos(endRad);
    const y2 = 50 + outerRadius * Math.sin(endRad);
    
    const x3 = 50 + innerRadius * Math.cos(endRad);
    const y3 = 50 + innerRadius * Math.sin(endRad);
    const x4 = 50 + innerRadius * Math.cos(startRad);
    const y4 = 50 + innerRadius * Math.sin(startRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const ringSpecs: Record<string, { inner: number, outer: number, start: number, end: number }> = {
    // Inner Ring (8 blocks)
    'block-d': { inner: 20, outer: 28, start: -45, end: 0 },
    'block-e': { inner: 20, outer: 28, start: 0, end: 45 },
    'block-f': { inner: 20, outer: 28, start: 45, end: 90 },
    'block-g': { inner: 20, outer: 28, start: 90, end: 135 },
    'block-h': { inner: 20, outer: 28, start: 135, end: 180 },
    'block-a': { inner: 20, outer: 28, start: 180, end: 225 },
    'block-b': { inner: 20, outer: 28, start: 225, end: 270 },
    'block-c': { inner: 20, outer: 28, start: 270, end: 315 },

    // Outer Ring (8 blocks)
    'block-m': { inner: 28, outer: 48, start: -45, end: -15 },
    'block-n': { inner: 28, outer: 48, start: -15, end: 15 },
    'block-p': { inner: 28, outer: 48, start: 15, end: 60 },
    'block-q': { inner: 28, outer: 48, start: 60, end: 115 },
    'block-r': { inner: 28, outer: 48, start: 115, end: 165 },
    'block-j': { inner: 28, outer: 48, start: 195, end: 235 },
    'block-k': { inner: 28, outer: 48, start: 235, end: 285 },
    'block-l': { inner: 28, outer: 48, start: 285, end: 315 },

    // Bottom Specialized (Presidents)
    'presidential-gallery': { inner: 28, outer: 35, start: 165, end: 195 },
    'presidential-suites': { inner: 35, outer: 42, start: 160, end: 200 },
    'premium-suites': { inner: 42, outer: 49, start: 155, end: 205 },

    // Facilities (as points, but we can give them small arcs or circles)
    'gate-south': { inner: 49, outer: 52, start: 175, end: 185 },
    'gate-north': { inner: 49, outer: 52, start: -5, end: 5 },
    'gate-east': { inner: 49, outer: 52, start: 85, end: 95 },
    'gate-west': { inner: 49, outer: 52, start: 265, end: 275 },
  };

  return (
    <div className="relative w-full h-full bg-[#030303] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredZoneId && state.zones[hoveredZoneId] && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-600 rounded-lg shadow-xl border border-white/20 z-50 flex items-center gap-4 pointer-events-none"
          >
            <div>
              <p className="text-[10px] font-black uppercase text-white/60 tracking-widest leading-none mb-1">Target Zone</p>
              <p className="text-sm font-black text-white uppercase tracking-tight leading-none">
                {state.zones[hoveredZoneId].name}
              </p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex gap-4">
              {/* Only show load for Admin, density/wait for User */}
              {isOperationsMode && (
                <div>
                  <p className="text-[8px] font-black uppercase text-white/50 tracking-widest leading-none mb-1">Load</p>
                  <p className="text-[12px] font-black text-white font-mono leading-none tracking-tighter">
                    {state.zones[hoveredZoneId].currentCount.toLocaleString()} / {state.zones[hoveredZoneId].capacity.toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[8px] font-black uppercase text-white/50 tracking-widest leading-none mb-1">Density</p>
                <p className={cn(
                  "text-[12px] font-black font-mono leading-none tracking-tighter",
                  (state.zones[hoveredZoneId].currentCount / state.zones[hoveredZoneId].capacity) > 0.8 ? "text-rose-300" : "text-emerald-300"
                )}>
                  {Math.round((state.zones[hoveredZoneId].currentCount / state.zones[hoveredZoneId].capacity) * 100)}%
                </p>
              </div>
              {/* Show Wait Time for non-seating blocks */}
              {state.zones[hoveredZoneId].type !== 'seating' && (
                <div>
                  <p className="text-[8px] font-black uppercase text-white/50 tracking-widest leading-none mb-1">Est. Wait</p>
                  <p className="text-[12px] font-black text-white font-mono leading-none tracking-tighter">
                    {state.waitTimes[hoveredZoneId]?.minutes || Math.round((state.zones[hoveredZoneId].currentCount / state.zones[hoveredZoneId].capacity) * 15)}m
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Toggle */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button 
          onClick={() => setInternalShowHeatmap(!internalShowHeatmap)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-md",
            internalShowHeatmap 
              ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
              : "bg-slate-900/80 border-white/10 text-slate-400"
          )}
        >
          {internalShowHeatmap ? 'Telemetry: Active' : 'Blueprint: Alpha'}
        </button>
      </div>

      {/* Data Overlays */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none opacity-40">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-indigo-500 rounded-full" />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Lat: 23.0911° N</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-indigo-500 rounded-full" />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Lon: 72.5975° E</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-indigo-500 rounded-full" />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Elev: 53m MSL</span>
        </div>
      </div>
      
      <svg viewBox="0 0 100 100" className="w-full h-full p-2 filter grayscale-[20%] contrast-[120%]">
        <defs>
          <radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a2e1d" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Tactical Perimeter Layers */}
        <ellipse cx="50" cy="50" rx="49" ry="49" className="fill-none stroke-white/5 stroke-[0.25px]" />
        <ellipse cx="50" cy="50" rx="45" ry="45" className="fill-none stroke-indigo-500/10 stroke-[0.5px] stroke-dasharray-[2,2]" />
        
        {/* Exterior Ribs (Architectural detail) */}
        {[...Array(48)].map((_, i) => {
          const angle = (i * 7.5) * Math.PI / 180;
          return (
            <line
              key={`rib-${i}`}
              x1={50 + 45 * Math.cos(angle)}
              y1={50 + 45 * Math.sin(angle)}
              x2={50 + 49 * Math.cos(angle)}
              y2={50 + 49 * Math.sin(angle)}
              className="stroke-indigo-500/10 stroke-[0.3px]"
            />
          );
        })}

        {/* Corporate Box Ring */}
        <ellipse cx="50" cy="50" rx="28" ry="28" className="fill-none stroke-indigo-500/30 stroke-[1.5px] stroke-dasharray-[0.5,2]" />
        
        {/* Tactical Scanning Line */}
        <g style={{ originX: "50px", originY: "50px" }}>
          <motion.path
            d="M 50 50 L 50 2 A 48 48 0 0 0 40 5 Z"
            className="fill-indigo-500/5 stroke-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.line
            x1="50" y1="50"
            x2="50" y2="2"
            className="stroke-indigo-500/30 stroke-[0.3px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </g>

        <ellipse cx="50" cy="50" rx="35" ry="35" className="fill-none stroke-white/5 stroke-[0.5px]" />
        
        {/* Pitch (Cricket Field) */}
        <g className="opacity-80">
          <ellipse cx="50" cy="50" rx="14" ry="16" className="fill-emerald-950/40 stroke-emerald-500/20 stroke-[0.2px]" />
          <line x1="50" y1="46" x2="50" y2="54" className="stroke-white/10 stroke-[0.1px] opacity-20" />
          <ellipse cx="50" cy="50" rx="4" ry="4.5" className="fill-none stroke-white/5 stroke-[0.1px]" />
          {/* Main Batting Pitch */}
          <rect x="49.5" y="47.5" width="1" height="5" className="fill-amber-900/50 stroke-white/10 stroke-[0.1px]" rx="0.1" />
        </g>
               {/* Sector Grid Lines (Tactical) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line 
            key={deg}
            x1="50" y1="50" 
            x2={50 + 48 * Math.cos((deg - 90) * Math.PI / 180)} 
            y2={50 + 48 * Math.sin((deg - 90) * Math.PI / 180)} 
            className="stroke-white/[0.05] stroke-[0.3px] pointer-events-none"
          />
        ))}

        {/* Concentric Tiers (Visual Guides) */}
        <ellipse cx="50" cy="50" rx="18" ry="20" className="fill-none stroke-white/5 stroke-[0.2px]" />
        <ellipse cx="50" cy="50" rx="28" ry="32" className="fill-none stroke-white/5 stroke-[0.2px]" />
        <ellipse cx="50" cy="50" rx="38" ry="44" className="fill-none stroke-white/5 stroke-[0.2px]" />

        {/* Neighbors (System Sync Lines) & Traffic Flow */}
        {zones.map(zone => 
          zone.neighbors.map(nId => {
            const neighbor = state.zones[nId];
            if (!neighbor) return null;
            const isHeavy = (zone.currentCount / zone.capacity) > 0.7 || (neighbor.currentCount / neighbor.capacity) > 0.7;
            
            return (
              <React.Fragment key={`${zone.id}-${nId}`}>
                <line 
                  x1={zone.x}
                  y1={zone.y}
                  x2={neighbor.x}
                  y2={neighbor.y}
                  className={cn(
                    "transition-all duration-1000 pointer-events-none",
                    isHeavy ? "stroke-indigo-500/30 stroke-[0.8px]" : "stroke-indigo-500/10 stroke-[0.3px]"
                  )}
                />
                {/* Traffic Particles */}
                {internalShowHeatmap && (
                  <motion.circle
                    r="0.4"
                    fill="#6366f1"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{ 
                      duration: isHeavy ? 1.5 : 3, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: Math.random() * 2
                    }}
                    style={{
                      offsetPath: `path('M ${zone.x} ${zone.y} L ${neighbor.x} ${neighbor.y}')`,
                      opacity: 0.6
                    }}
                  />
                )}
              </React.Fragment>
            )
          })
        )}

        {/* Interactive Zones */}
        {zones.map((zone) => {
          const spec = ringSpecs[zone.id];
          const isSelected = selectedZoneId === zone.id;
          const isHovered = hoveredZoneId === zone.id;
          
          if (spec) {
            const pathD = getSectorPath(spec.inner, spec.outer, spec.start, spec.end);
            
            // Calculate label position (mid-angle, mid-radius)
            const midAngle = (spec.start + spec.end) / 2;
            const midRadius = (spec.inner + spec.outer) / 2;
            const labelRad = (midAngle - 90) * Math.PI / 180;
            const lx = 50 + midRadius * Math.cos(labelRad);
            const ly = 50 + midRadius * Math.sin(labelRad);

            return (
              <g 
                key={zone.id} 
                data-zone-id={zone.id}
                onClick={() => onZoneClick?.(zone)} 
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="cursor-pointer group"
              >
                <motion.path
                  d={pathD}
                  className={cn(
                    "transition-all duration-500",
                    getZoneColor(zone),
                    isSelected || isHovered ? "stroke-white stroke-[0.5px]" : "stroke-white/10 stroke-[0.1px]",
                    getGlowEffect(zone)
                  )}
                />
                <text 
                  x={lx} 
                  y={ly} 
                  className={cn(
                    "text-[2px] font-black pointer-events-none transition-colors select-none",
                    isSelected || isHovered ? "fill-white" : "fill-black/40 group-hover:fill-white"
                  )}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {zone.name.split(' ').pop()}
                </text>
              </g>
            );
          } else {
            // Point based facilities (Food, Transit)
            return (
              <g 
                key={zone.id} 
                data-zone-id={zone.id}
                onClick={() => onZoneClick?.(zone)} 
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
                className="cursor-pointer group"
              >
                <motion.circle
                  cx={zone.x}
                  cy={zone.y}
                  r={isSelected || isHovered ? (zone.type === 'gate' ? 6 : 4) : (zone.type === 'gate' ? 5 : 3)}
                  className={cn(
                    "transition-all duration-500",
                    zone.type === 'food' ? "fill-fuchsia-500" : zone.type === 'gate' ? "fill-slate-200" : zone.type === 'concourse' ? "fill-blue-500" : "fill-indigo-500",
                    isSelected || isHovered ? "stroke-indigo-500 stroke-[1.5px]" : "stroke-white/20 stroke-[0.2px]",
                    zone.type === 'gate' && "drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]",
                    getGlowEffect(zone)
                  )}
                />
                <text 
                  x={zone.x} 
                  y={zone.y + 4.5} 
                  className={cn(
                    "text-[2.5px] font-black pointer-events-none transition-colors select-none uppercase tracking-tighter",
                    zone.type === 'gate' ? "fill-black" : "fill-slate-400",
                    isSelected || isHovered ? (zone.type === 'gate' ? "fill-black" : "fill-white") : "group-hover:fill-white"
                  )}
                  textAnchor="middle"
                >
                  {zone.name.replace('Court', '').replace('Gate', 'G').trim()}
                </text>
              </g>
            );
          }
        })}

        {/* Staff Units */}
        {state.staff?.map(staff => {
           const zone = state.zones[staff.zoneId];
           if (!zone) return null;
           return (
             <motion.g key={staff.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <circle 
                cx={zone.x - 2} 
                cy={zone.y - 2} 
                r="1.2" 
                className={cn(
                  "stroke-white stroke-[0.3px]",
                  staff.role === 'security' ? 'fill-blue-500' : 'fill-rose-500'
                )}
               />
               <circle 
                cx={zone.x - 2} 
                cy={zone.y - 2} 
                r="3" 
                className={cn(
                  "fill-none stroke-[0.1px] animate-pulse",
                  staff.role === 'security' ? 'stroke-blue-500' : 'stroke-rose-500'
                )}
               />
             </motion.g>
           )
        })}
      </svg>

      {/* Modern Tactical Legend */}
      <AnimatePresence>
        {internalShowHeatmap && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "absolute right-4 flex flex-col gap-3 p-4 bg-slate-900/80 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl z-20 transition-all duration-500",
              showLegend ? "top-16 opacity-100" : "top-16 opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto md:top-4"
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NMS_Telemetry</span>
              <Activity className="w-3 h-3 text-indigo-500" />
            </div>
            {/* Legend Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Normal (0-40%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Stable (40-70%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Congested (70-90%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter">CRITICAL (&gt;90%)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setShowLegend(!showLegend)}
        className="absolute top-4 right-4 z-30 p-2 bg-slate-900/80 border border-white/10 rounded-lg text-slate-400 md:hidden"
      >
        <Activity className="w-4 h-4" />
      </button>
    </div>
  );
};
