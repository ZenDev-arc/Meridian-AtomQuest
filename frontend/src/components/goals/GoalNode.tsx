import { motion, AnimatePresence } from 'framer-motion';
import type { Goal } from '../../api/goals';

const STATUS_COLORS: Record<Goal['status'], string> = {
  DRAFT: '#d3d3d3',
  SUBMITTED: '#708090',
  APPROVED: '#6b8e23',
  RETURNED: '#ffbf00',
};

const STATUS_LABELS: Record<Goal['status'], string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  RETURNED: 'Returned',
};

const UOM_LABELS: Record<string, string> = {
  MIN: 'Min (Higher is Better)',
  MAX: 'Max (Lower is Better)',
  TIMELINE: 'Timeline',
  ZERO: 'Zero-based',
};

function getLatestScore(goal: Goal): number | null {
  if (!goal.checkIns || goal.checkIns.length === 0) return null;
  const sorted = [...goal.checkIns].sort(
    (a, b) => new Date(b.cyclePhase).getTime() - new Date(a.cyclePhase).getTime()
  );
  return sorted[0]?.computedScore ?? null;
}

function getLatestCheckIn(goal: Goal) {
  if (!goal.checkIns || goal.checkIns.length === 0) return null;
  return goal.checkIns[goal.checkIns.length - 1];
}

interface GoalNodeProps {
  goal: Goal;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function GoalNode({ goal, index, isSelected, onClick }: GoalNodeProps) {
  const color = STATUS_COLORS[goal.status];
  const score = getLatestScore(goal);

  // Size proportional to weightage: min 90px radius, max 160px radius
  const minR = 56;
  const maxR = 120;
  const radius = minR + ((goal.weightage - 10) / (100 - 10)) * (maxR - minR);
  const size = radius * 2;

  // Number of contour rings = score / 20 (0–5 rings = 0–100%)
  const rings = score !== null ? Math.round((score / 100) * 5) : 0;

  return (
    <motion.div
      className="relative cursor-pointer flex-shrink-0"
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
    >
      {/* Contour rings — radiate outward */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1.5px solid ${color}`,
            opacity: i < rings ? 0.45 - i * 0.07 : 0.06,
            transform: `scale(${1 + (i + 1) * 0.18})`,
            transformOrigin: 'center',
          }}
          animate={{ opacity: i < rings ? 0.45 - i * 0.07 : 0.06 }}
          transition={{ duration: 0.5 }}
        />
      ))}

      {/* Main node circle */}
      <motion.div
        className="absolute inset-0 rounded-full flex flex-col items-center justify-center shadow-lg"
        style={{
          backgroundColor: isSelected ? color : `${color}22`,
          border: `2px solid ${color}`,
          boxShadow: isSelected ? `0 0 0 4px ${color}44, 0 8px 32px ${color}44` : undefined,
        }}
        animate={{ backgroundColor: isSelected ? color : `${color}22` }}
        transition={{ duration: 0.2 }}
      >
        {/* Weightage badge */}
        <span
          className="font-mono font-bold leading-none"
          style={{
            fontSize: radius > 90 ? '1.5rem' : '1.1rem',
            color: isSelected ? '#f7f3ec' : color,
          }}
        >
          {goal.weightage}%
        </span>

        {/* Score if available */}
        {score !== null && (
          <span
            className="font-mono text-xs mt-1 opacity-80"
            style={{ color: isSelected ? '#f7f3ec' : color }}
          >
            {score.toFixed(1)}%
          </span>
        )}

        {/* Status dot */}
        <div
          className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </motion.div>

      {/* Label below node */}
      <div
        className="absolute -bottom-8 left-0 right-0 text-center font-mono text-xs text-meridian-ink/70 leading-tight px-1"
        style={{ width: size }}
      >
        <p className="truncate" style={{ maxWidth: size }}>
          {goal.title.length > 18 ? goal.title.slice(0, 16) + '…' : goal.title}
        </p>
      </div>
    </motion.div>
  );
}

interface GoalDetailPanelProps {
  goal: Goal | null;
  onClose: () => void;
}

export function GoalDetailPanel({ goal, onClose }: GoalDetailPanelProps) {
  const score = goal ? getLatestScore(goal) : null;
  const latestCheckIn = goal ? getLatestCheckIn(goal) : null;

  return (
    <AnimatePresence>
      {goal && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-80 bg-meridian-ink text-white shadow-2xl overflow-y-auto z-20 flex flex-col"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div
                className="text-xs font-mono uppercase tracking-widest px-2 py-1 rounded-sm mb-3"
                style={{
                  backgroundColor: `${STATUS_COLORS[goal.status]}22`,
                  color: STATUS_COLORS[goal.status],
                }}
              >
                {STATUS_LABELS[goal.status]}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors font-mono text-lg">
                ✕
              </button>
            </div>
            <h3 className="font-serif text-xl leading-tight">{goal.title}</h3>
            <p className="font-mono text-xs mt-1 text-meridian-gold/80 uppercase tracking-widest">
              {goal.thrustArea}
            </p>
          </div>

          <div className="p-6 space-y-5 flex-1">
            {goal.description && (
              <p className="text-white/60 text-sm leading-relaxed">{goal.description}</p>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3">
                <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-1">Weightage</p>
                <p className="font-mono text-xl text-meridian-gold">{goal.weightage}%</p>
              </div>
              <div className="bg-white/5 p-3">
                <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-1">Score</p>
                <p className="font-mono text-xl text-white">
                  {score !== null ? `${score.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Target */}
            <div className="bg-white/5 p-3">
              <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-2">Target</p>
              {goal.targetValue !== undefined && goal.targetValue !== null ? (
                <p className="font-mono text-white">
                  {goal.targetValue.toLocaleString()}
                </p>
              ) : goal.targetDate ? (
                <p className="font-mono text-white">
                  {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              ) : (
                <p className="font-mono text-white">Zero</p>
              )}
              <p className="text-white/40 text-xs mt-1 font-mono">{UOM_LABELS[goal.uomType]}</p>
            </div>

            {/* Formula preview */}
            <div className="border border-meridian-gold/20 bg-meridian-gold/5 p-3">
              <p className="text-meridian-gold text-xs font-mono uppercase tracking-wider mb-2">Score Formula</p>
              {goal.uomType === 'MIN' && (
                <p className="font-mono text-white/80 text-sm">Achievement ÷ Target × 100</p>
              )}
              {goal.uomType === 'MAX' && (
                <p className="font-mono text-white/80 text-sm">Target ÷ Achievement × 100</p>
              )}
              {goal.uomType === 'TIMELINE' && (
                <p className="font-mono text-white/80 text-sm">100% if completed on time, else 0%</p>
              )}
              {goal.uomType === 'ZERO' && (
                <p className="font-mono text-white/80 text-sm">100% if actual = 0, else 0%</p>
              )}
              {score !== null && (
                <p className="font-mono text-meridian-gold text-sm mt-1 font-semibold">
                  Current: {score.toFixed(1)}%
                </p>
              )}
            </div>

            {/* Latest check-in */}
            {latestCheckIn && (
              <div className="bg-white/5 p-3">
                <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-2">
                  Latest Check-in · {latestCheckIn.cyclePhase}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        latestCheckIn.progressStatus === 'COMPLETED'
                          ? '#9370db'
                          : latestCheckIn.progressStatus === 'ON_TRACK'
                          ? '#6b8e23'
                          : '#d3d3d3',
                    }}
                  />
                  <span className="font-mono text-xs text-white/70">
                    {latestCheckIn.progressStatus.replace('_', ' ')}
                  </span>
                </div>
                {latestCheckIn.actualValue !== undefined && (
                  <p className="font-mono text-sm text-white">
                    Actual: {latestCheckIn.actualValue.toLocaleString()}
                  </p>
                )}
                {latestCheckIn.managerComment && (
                  <p className="text-white/50 text-xs mt-2 italic leading-relaxed border-l-2 border-white/20 pl-2">
                    "{latestCheckIn.managerComment}"
                  </p>
                )}
              </div>
            )}

            {/* Lock indicator */}
            {goal.status === 'APPROVED' && (
              <div className="flex items-center gap-2 text-status-locked text-xs font-mono opacity-70">
                <span>🔒</span>
                <span>Locked — approved by manager</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
