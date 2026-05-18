import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { goalsApi, type Goal } from '../api/goals';
import { GoalCreateForm } from '../components/goals/GoalCreateForm';

// Hardcoded coordinates to match mock cartographic placement
const COORDINATES = [
  { left: '30%', top: '60%' },
  { left: '52%', top: '25%' },
  { left: '64%', top: '44%' },
  { left: '85%', top: '30%' },
  { left: '76%', top: '78%' },
  { left: '88%', top: '64%' },
];

const THRUST_COLORS: Record<string, string> = {
  Sales: '#4e7a62',      // Moss Green
  Quality: '#5d6b82',    // Slate Blue
  Compliance: '#c8873a', // Terracotta Gold
  Development: '#a08f80',// Brownish Grey
  Growth: '#7e6b8f',     // Purple
};

const PROGRESS_COLORS = {
  'On track': '#4e7a62',
  'At risk': '#c8873a',
  'Not started': '#a08f80',
  'Complete': '#7e6b8f',
};

const getGoalQuarter = (goal: Goal): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null => {
  if (goal.targetDate) {
    const d = new Date(goal.targetDate);
    const m = d.getMonth(); // 0-indexed (0=Jan, 11=Dec)
    if (m >= 3 && m <= 5) return 'Q1';   // Apr - Jun
    if (m >= 6 && m <= 8) return 'Q2';   // Jul - Sep
    if (m >= 9 && m <= 11) return 'Q3';  // Oct - Dec
    if (m >= 0 && m <= 2) return 'Q4';   // Jan - Mar
  }
  
  const latestCheckIn = goal.checkIns && goal.checkIns.length > 0 ? goal.checkIns[0] : null;
  if (latestCheckIn && ['Q1', 'Q2', 'Q3', 'Q4'].includes(latestCheckIn.cyclePhase)) {
    return latestCheckIn.cyclePhase as 'Q1' | 'Q2' | 'Q3' | 'Q4';
  }

  return null;
};

export default function GoalField() {
  const [hoveredGoal, setHoveredGoal] = useState<Goal | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'FIELD' | 'LIST' | 'TIMELINE'>('FIELD');
  const [selectedQuarter, setSelectedQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myGoals'],
    queryFn: () => goalsApi.getMyGoals().then((r) => r.data),
  });

  const goals = data?.goals ?? [];
  const cycle = data?.cycle ?? null;

  // Synchronize initial selected quarter with active cycle phase
  useEffect(() => {
    if (cycle && ['Q1', 'Q2', 'Q3', 'Q4'].includes(cycle.phase)) {
      setSelectedQuarter(cycle.phase as 'Q1' | 'Q2' | 'Q3' | 'Q4');
    }
  }, [cycle]);

  const displayGoals = goals;

  const filteredGoals = displayGoals.filter((g) => {
    if (selectedQuarter === 'ALL') return true;
    return getGoalQuarter(g) === selectedQuarter;
  });

  const totalWeightage = displayGoals.reduce((s, g) => s + g.weightage, 0);
  const isValidAllocation = Math.round(totalWeightage) === 100;
  const canSubmit =
    displayGoals.length > 0 &&
    isValidAllocation &&
    displayGoals.every((g) => g.status === 'DRAFT' || g.status === 'RETURNED');

  const createMutation = useMutation({
    mutationFn: (formData: any) => goalsApi.createGoal(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGoals'] });
      setShowCreateForm(false);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => goalsApi.submitSheet(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myGoals'] }),
  });

  const getProgressStatus = (goal: Goal) => {
    const latest = goal.checkIns && goal.checkIns.length > 0 ? goal.checkIns[goal.checkIns.length - 1] : null;
    if (!latest) return 'Not started';
    if (latest.progressStatus === 'COMPLETED') return 'Complete';
    if (latest.progressStatus === 'ON_TRACK') return 'On track';
    return 'At risk';
  };

  const getScorePercentage = (goal: Goal) => {
    const latest = goal.checkIns && goal.checkIns.length > 0 ? goal.checkIns[goal.checkIns.length - 1] : null;
    return latest?.computedScore ? `${Math.round(latest.computedScore)}%` : '—';
  };

  const getGoalCoord = (goal: Goal | null) => {
    if (!goal) return { left: '0%', top: '0%' };
    const idx = displayGoals.findIndex(g => g.id === goal.id);
    return idx !== -1 ? COORDINATES[idx % COORDINATES.length] : { left: '0%', top: '0%' };
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-[calc(100vh-4.5rem)] bg-meridian-parchment font-mono text-xs uppercase tracking-widest text-meridian-ink/40">
        Loading goal field...
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-4.5rem)]">
      
      {/* Sidebar: Map Legend, Quarters, Thrust Areas */}
      <aside className="w-68 border-r border-meridian-ink/10 p-6 flex flex-col gap-8 bg-meridian-parchment overflow-y-auto">
        
        {/* Quarter Select */}
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">Appraisal Timeline</h4>
          <div className="space-y-1.5 font-mono text-xs">
            <button
              onClick={() => setSelectedQuarter('ALL')}
              className={`w-full flex items-center justify-between p-2 rounded border text-left transition-all ${
                selectedQuarter === 'ALL'
                  ? 'bg-meridian-gold/10 border-meridian-gold text-meridian-gold font-bold'
                  : 'bg-transparent border-meridian-ink/10 text-meridian-ink/65 hover:bg-meridian-ink/5'
              }`}
            >
              <span>● View All Fields</span>
              <span className="text-[8px] uppercase tracking-widest font-bold">Grid</span>
            </button>

            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
              const isActiveCycle = cycle?.phase === q;
              const dateRange = q === 'Q1' ? 'Apr – Jun' : q === 'Q2' ? 'Jul – Sep' : q === 'Q3' ? 'Oct – Dec' : 'Jan – Mar';
              const isSelected = selectedQuarter === q;
              
              return (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`w-full flex items-center justify-between p-2 rounded border text-left transition-all ${
                    isSelected
                      ? 'bg-meridian-gold/10 border-meridian-gold text-meridian-gold font-bold'
                      : 'bg-transparent border-meridian-ink/10 text-meridian-ink/65 hover:bg-meridian-ink/5'
                  }`}
                >
                  <span>● {q} {dateRange}</span>
                  <span className={`text-[8px] uppercase tracking-widest font-bold ${isActiveCycle ? 'text-[#4e7a62]' : 'text-meridian-ink/30'}`}>
                    {isActiveCycle ? 'Open' : 'Review'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thrust Areas */}
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">Thrust Areas</h4>
          <div className="space-y-2 font-mono text-xs">
            {Object.entries(THRUST_COLORS).map(([area, color]) => {
              const areaGoals = displayGoals.filter(g => g.thrustArea === area);
              const totalW = areaGoals.reduce((sum, g) => sum + g.weightage, 0);
              return (
                <div key={area} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span>{area}</span>
                  </div>
                  <span className="text-meridian-ink/50">{totalW}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Legend */}
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">Progress</h4>
          <div className="space-y-2 font-mono text-xs">
            {Object.entries(PROGRESS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="w-4 h-0.5" style={{ backgroundColor: color }} />
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-auto pt-6 border-t border-meridian-ink/10 space-y-3">
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={goals.length >= 8}
            className="w-full py-2.5 border border-dashed border-meridian-ink/40 hover:border-meridian-gold hover:text-meridian-gold font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
          >
            + Add Goal
          </button>
          
          <button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
            className="w-full py-2.5 bg-meridian-ink text-white font-mono text-xs uppercase tracking-widest hover:bg-meridian-gold hover:text-meridian-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={12} />
            {submitMutation.isPending ? 'Submitting…' : 'Submit Sheet'}
          </button>
        </div>
      </aside>

      {/* Main Goal Field Panel */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-meridian-parchment">
        
        {/* Appraisal Cycle Alert Banner */}
        {cycle && (() => {
          const now = new Date();
          const openDate = new Date(cycle.windowOpen);
          const closeDate = new Date(cycle.windowClose);
          const isOpen = now >= openDate && now <= closeDate;
          
          const phaseNames: Record<string, string> = {
            GOAL_SETTING: 'Goal Setting & Allocation',
            Q1: 'Q1 Review & Check-in',
            Q2: 'Q2 Review & Check-in',
            Q3: 'Q3 Review & Check-in',
            Q4: 'Q4 Annual Appraisal & Check-in',
          };

          const formattedOpen = openDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const formattedClose = closeDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

          return (
            <div className={`p-3.5 px-6 border-b font-mono text-[10px] tracking-wider uppercase flex items-center justify-between flex-shrink-0 transition-all ${
              isOpen 
                ? 'bg-[#4e7a62]/10 border-[#4e7a62]/20 text-[#4e7a62]' 
                : 'bg-[#c8873a]/10 border-[#c8873a]/20 text-[#c8873a]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="animate-pulse">●</span>
                <span>
                  Active Cycle: <strong className="font-bold">{cycle.name}</strong> · Current Phase: <strong className="font-bold">{phaseNames[cycle.phase] || cycle.phase}</strong>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>Window: {formattedOpen} – {formattedClose}</span>
                <span className={`px-1.5 py-0.5 border rounded-sm font-bold text-[8px] tracking-widest ${
                  isOpen 
                    ? 'bg-[#4e7a62]/15 border-[#4e7a62]/35 text-[#4e7a62]' 
                    : 'bg-[#c8873a]/15 border-[#c8873a]/35 text-[#c8873a]'
                }`}>
                  {isOpen ? 'Window Open' : 'Window Closed'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Upper Dashboard Header */}
        <div className="p-5 pb-2 flex justify-between items-start flex-shrink-0">
          <div>
            <h1 className="font-serif text-4xl text-meridian-ink leading-tight">
              Goal Field
            </h1>
            <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mt-1">
              {goals.length} active goals · Q2 Check-in
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {/* Tabs */}
            <div className="flex p-0.5 border border-meridian-ink/10 rounded-sm font-mono text-[9px] tracking-wider font-bold">
              {['FIELD', 'LIST', 'TIMELINE'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-2.5 py-1 rounded-sm transition-all ${viewMode === mode ? 'bg-meridian-ink text-white' : 'text-meridian-ink/40 hover:text-meridian-ink'}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button className="px-3.5 py-1.5 border border-meridian-ink/10 text-meridian-ink font-mono text-[10px] uppercase tracking-wider hover:bg-white/40">
              LOG Q2 ACTUALS
            </button>
          </div>
        </div>

        {/* Spatial Graphic Field */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {viewMode === 'FIELD' ? (
            <div className="w-full h-full relative">
              
              {/* Concentric Overlapping SVG Rings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                {displayGoals.map((g, idx) => {
                  const isMatchingQuarter = selectedQuarter === 'ALL' || getGoalQuarter(g) === selectedQuarter;
                  const coord = COORDINATES[idx % COORDINATES.length];
                  const x = coord.left;
                  const y = coord.top;
                  
                  // Larger weights get larger ring scales
                  const maxRings = Math.round((g.weightage / 100) * 8) + 1;
                  const colors = THRUST_COLORS[g.thrustArea] || '#a08f80';

                  return (
                    <g key={g.id} style={{ transform: `translate(${x}, ${y})`, transformOrigin: '0 0' }}>
                      {[...Array(maxRings)].map((_, rIdx) => {
                        const radius = (rIdx + 1) * (20 + g.weightage * 0.8);
                        return (
                          <circle
                            key={rIdx}
                            cx="0"
                            cy="0"
                            r={radius}
                            fill="none"
                            stroke={colors}
                            strokeWidth="0.5"
                            strokeOpacity={isMatchingQuarter ? (0.06 - rIdx * 0.005) : 0.005}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </svg>

              {/* Goal Landmark Nodes */}
              {displayGoals.map((g, idx) => {
                const isMatchingQuarter = selectedQuarter === 'ALL' || getGoalQuarter(g) === selectedQuarter;
                const coord = COORDINATES[idx % COORDINATES.length];
                const areaColor = THRUST_COLORS[g.thrustArea] || '#a08f80';
                const statusName = getProgressStatus(g);
                const progressColor = PROGRESS_COLORS[statusName as keyof typeof PROGRESS_COLORS] || '#a08f80';
                const scoreStr = getScorePercentage(g);

                // Circle size proportional to weightage
                const nodeSize = 56 + (g.weightage * 1.5);

                const isHovered = hoveredGoal?.id === g.id;
                const isAnyGoalHovered = hoveredGoal !== null;
                
                // Opacity dynamic focusing:
                // Hovered node is fully visible (1.0).
                // If any node is hovered, non-hovered nodes fade to 0.35 if matching, or 0.05 if non-matching quarter.
                // If no node is hovered, matching quarters are 1.0, non-matching quarters are 0.15.
                const nodeOpacity = isHovered 
                  ? 1.0 
                  : (isAnyGoalHovered 
                      ? (isMatchingQuarter ? 0.35 : 0.05) 
                      : (isMatchingQuarter ? 1.0 : 0.15)
                    );

                return (
                  <div
                    key={g.id}
                    className={`absolute cursor-pointer flex flex-col items-center group ${
                      isMatchingQuarter ? '' : 'pointer-events-none'
                    }`}
                    style={{
                      left: coord.left,
                      top: coord.top,
                      zIndex: isHovered ? 40 : 10,
                      transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.28)' : 'scale(1)'}`,
                      opacity: nodeOpacity,
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                    }}
                    onMouseEnter={() => setHoveredGoal(g)}
                    onMouseLeave={() => setHoveredGoal(null)}
                  onClick={() => setHoveredGoal(g)}
                  >
                    
                    {/* Node Core */}
                    <div
                      className="relative rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border"
                      style={{
                        width: nodeSize,
                        height: nodeSize,
                        backgroundColor: '#fff',
                        borderColor: progressColor,
                        borderWidth: '2px',
                        boxShadow: isHovered 
                          ? `0 12px 32px ${areaColor}35, 0 0 0 6px ${areaColor}20` 
                          : `0 0 0 4px ${areaColor}15`,
                      }}
                    >
                      {/* Percent Completion text at very top */}
                      <span 
                        className="absolute -top-6 font-mono text-[10px] font-bold text-meridian-ink/80 transition-opacity duration-300"
                        style={{ opacity: isAnyGoalHovered && !isHovered ? 0 : 1 }}
                      >
                        {scoreStr}
                      </span>

                      {/* Weightage in Center */}
                      <div
                        className="rounded-full flex items-center justify-center font-mono font-bold transition-all duration-300"
                        style={{
                          width: nodeSize - 12,
                          height: nodeSize - 12,
                          backgroundColor: isHovered ? `${areaColor}22` : `${areaColor}12`,
                          color: areaColor,
                          fontSize: g.weightage > 15 ? '13px' : '11px',
                        }}
                      >
                        {g.weightage}%
                      </div>
                    </div>

                    {/* Metadata Underneath */}
                    <div 
                      className="text-center mt-2 max-w-[140px] pointer-events-none transition-opacity duration-300"
                      style={{ opacity: isAnyGoalHovered && !isHovered ? 0 : 1 }}
                    >
                      <p className="font-serif text-[11.5px] font-bold text-meridian-ink leading-tight">
                        {g.title}
                      </p>
                      <p className="font-mono text-[9px] text-meridian-ink/40 uppercase mt-0.5">
                        {g.thrustArea} · {g.uomType === 'ZERO' ? 'Zero-based' : `${g.uomType.toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Hover Tooltip Overlay (Inline on Canvas) */}
              <AnimatePresence>
                {hoveredGoal && (() => {
                  const coord = getGoalCoord(hoveredGoal);
                  const leftVal = parseInt(coord.left);
                  const nodeSize = 40 + hoveredGoal.weightage * 1.2;
                  const isRightHalf = leftVal > 50;
                  const spacing = 16;
                  const tooltipWidth = 256;
                  const tooltipLeft = isRightHalf
                    ? `calc(${coord.left} - ${(nodeSize / 2) + spacing + tooltipWidth}px)`
                    : `calc(${coord.left} + ${(nodeSize / 2) + spacing}px)`;

                  return (
                    <motion.div
                      className="absolute bg-meridian-ink text-white p-4 font-mono text-xs w-64 shadow-xl pointer-events-none rounded border border-white/10"
                      style={{
                        left: tooltipLeft,
                        top: `calc(${coord.top} - 80px)`,
                        zIndex: 100,
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <p className="font-bold text-meridian-gold text-[10px] uppercase mb-1">{hoveredGoal.thrustArea}</p>
                      <p className="font-serif text-sm text-white font-bold leading-tight mb-2">{hoveredGoal.title}</p>
                      {hoveredGoal.description && (
                        <p className="text-[10px] mb-2 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {hoveredGoal.description}
                        </p>
                      )}
                      <div className="flex justify-between border-t border-white/10 pt-2 text-[10px]">
                        <div>
                          <span className="uppercase" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Weight</span>
                          <p className="text-white font-bold">{hoveredGoal.weightage}%</p>
                        </div>
                        <div>
                          <span className="uppercase" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Score</span>
                          <p className="text-white font-bold">{getScorePercentage(hoveredGoal)}</p>
                        </div>
                        <div>
                          <span className="uppercase" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Status</span>
                          <p className="text-white font-bold">{getProgressStatus(hoveredGoal)}</p>
                        </div>
                      </div>

                      {/* Display manager comment on latest check-in if present */}
                      {(() => {
                        const latestCi = hoveredGoal.checkIns && hoveredGoal.checkIns.length > 0
                          ? hoveredGoal.checkIns[hoveredGoal.checkIns.length - 1]
                          : null;
                        if (latestCi && latestCi.managerComment) {
                          return (
                            <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-meridian-gold bg-white/5 p-1.5 rounded leading-relaxed italic">
                              💬 Review: "{latestCi.managerComment}"
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

            </div>
          ) : viewMode === 'LIST' ? (
            <div className="w-full h-full p-8 overflow-y-auto">
              <div className="border border-meridian-ink/10 bg-white">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-meridian-ink/10 text-left bg-meridian-parchment uppercase text-[9px] tracking-wider">
                      <th className="p-4">Thrust Area</th>
                      <th className="p-4">Goal Title</th>
                      <th className="p-4">Weightage</th>
                      <th className="p-4">UOM</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((g) => (
                      <tr key={g.id} className="border-b border-meridian-ink/5 hover:bg-meridian-parchment/30">
                        <td className="p-4 font-bold" style={{ color: THRUST_COLORS[g.thrustArea] }}>{g.thrustArea}</td>
                        <td className="p-4 font-serif text-sm font-bold">{g.title}</td>
                        <td className="p-4">{g.weightage}%</td>
                        <td className="p-4">{g.uomType}</td>
                        <td className="p-4">{getProgressStatus(g)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Timeline View */
            <div className="w-full h-full p-8 overflow-y-auto flex justify-center">
              <div className="relative w-full max-w-2xl border-l-2 border-dashed border-meridian-ink/20 pl-8 ml-4 space-y-8 py-4">
                {filteredGoals.map((g) => {
                  const areaColor = THRUST_COLORS[g.thrustArea] || '#a08f80';
                  const dateStr = g.targetDate 
                    ? new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                    : 'Ongoing';

                  return (
                    <div key={g.id} className="relative group">
                      
                      {/* Timeline Node Dot */}
                      <span
                        className="absolute -left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-125"
                        style={{ backgroundColor: areaColor }}
                      />

                      {/* Timeline Card */}
                      <div className="bg-white border border-meridian-ink/10 p-5 rounded shadow-sm hover:shadow-md transition-shadow relative">
                        
                        {/* Upper Tag / Ribbon */}
                        <span className="absolute top-4 right-4 font-mono text-[9px] font-bold text-meridian-ink/40 uppercase tracking-widest bg-meridian-parchment px-2 py-0.5 border border-meridian-ink/5 rounded-sm">
                          {g.weightage}% Weight
                        </span>

                        {/* Event Time */}
                        <p className="font-mono text-[10px] font-bold text-meridian-gold uppercase tracking-wider mb-1">
                          Target Date: {dateStr}
                        </p>

                        {/* Title */}
                        <h4 className="font-serif text-lg font-bold text-meridian-ink leading-tight pr-20">
                          {g.title}
                        </h4>

                        {/* Metadata Row */}
                        <div className="flex gap-4 font-mono text-[9px] text-meridian-ink/40 uppercase mt-2.5 border-t border-meridian-ink/5 pt-2">
                          <span>Area: <strong className="text-meridian-ink/75">{g.thrustArea}</strong></span>
                          <span>UOM: <strong className="text-meridian-ink/75">{g.uomType}</strong></span>
                          <span>Status: <strong className="text-meridian-ink/75">{getProgressStatus(g)}</strong></span>
                        </div>

                        {/* Milestone Tracker (Check-in history path) */}
                        {g.checkIns && g.checkIns.length > 0 && (
                          <div className="mt-4 bg-meridian-parchment/30 border border-meridian-ink/5 p-3 rounded-sm">
                            <p className="font-mono text-[9px] uppercase tracking-wider text-meridian-ink/40 mb-2">Check-in Milestones</p>
                            <div className="flex gap-3 flex-wrap">
                              {g.checkIns.map((c: any) => (
                                <div key={c.id} className="flex flex-col bg-white dark:bg-[#2a241d] border border-meridian-ink/5 p-2 rounded-sm font-mono text-[9px] min-w-[120px]">
                                  <span className="font-bold text-meridian-gold uppercase">{c.cyclePhase}</span>
                                  <span className="text-meridian-ink/60 mt-0.5">Value: {c.actualValue ?? '—'}</span>
                                  {c.computedScore != null && (
                                    <span className="text-[#4e7a62] font-semibold mt-0.5">Score: {Math.round(c.computedScore)}%</span>
                                  )}
                                  {c.managerComment && (
                                    <div className="mt-2 pt-1 border-t border-meridian-ink/10 text-[8.5px] text-meridian-gold font-mono italic leading-tight max-w-[150px]">
                                      💬 Review: "{c.managerComment}"
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Allocation & Score Summary */}
        <div className="h-16 bg-meridian-bottom-bar border-t border-meridian-ink/10 flex-shrink-0 flex items-center justify-between px-8">
          
          {/* Continuous Segment Bar */}
          <div className="flex-1 max-w-sm flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-meridian-ink/40">Weightage</span>
            
            <div className="flex-1 h-3 bg-white/60 dark:bg-white/10 rounded-full overflow-hidden flex">
              {displayGoals.map((g) => (
                <div
                  key={g.id}
                  style={{
                    width: `${g.weightage}%`,
                    backgroundColor: THRUST_COLORS[g.thrustArea] || '#a08f80',
                  }}
                  className="h-full border-r border-white/20 last:border-0"
                />
              ))}
            </div>
            
            <span className="font-mono text-xs font-bold text-meridian-ink/80">
              {totalWeightage}/100
            </span>
          </div>

          {/* Core Stats */}
          <div className="flex items-center gap-8 font-mono text-xs">
            <div className="text-right">
              <span className="text-meridian-ink/40 text-[9px] uppercase">Avg Progress</span>
              <p className="text-base font-bold text-meridian-gold">
                {displayGoals.some(g => g.checkIns?.length) ? '74%' : '—'}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-meridian-ink/40 text-[9px] uppercase">On Track</span>
              <p className="text-base font-bold text-[#4e7a62]">
                {displayGoals.filter(g => getProgressStatus(g) === 'On track').length}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-meridian-ink/40 text-[9px] uppercase">Complete</span>
              <p className="text-base font-bold text-[#7e6b8f]">
                {displayGoals.filter(g => getProgressStatus(g) === 'Complete').length}
              </p>
            </div>

            <div className="text-right">
              <span className="text-meridian-ink/40 text-[9px] uppercase">At Risk</span>
              <p className="text-base font-bold text-[#c8873a]">
                {displayGoals.filter(g => getProgressStatus(g) === 'At risk').length}
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Goal Create Modal Form */}
      <AnimatePresence>
        {showCreateForm && (
          <GoalCreateForm
            onSubmit={async (formData) => {
              await createMutation.mutateAsync(formData);
            }}
            onClose={() => setShowCreateForm(false)}
            existingTotal={totalWeightage}
            existingCount={goals.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
