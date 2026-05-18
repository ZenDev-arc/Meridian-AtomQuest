import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Goal } from '../../api/goals';

const SEGMENT_COLORS = [
  '#c8873a', // gold
  '#6b8e23', // moss
  '#708090', // slate
  '#9370db', // purple
  '#ffbf00', // amber
  '#4a90d9', // blue
  '#e07070', // coral
  '#5cb85c', // green
];

interface WeightageBuilderProps {
  goals: Array<Pick<Goal, 'id' | 'title' | 'weightage'>>;
  onChange: (id: string, newWeightage: number) => void;
}

export function WeightageBuilder({ goals, onChange }: WeightageBuilderProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    dragging: boolean;
    segmentIndex: number;
    startX: number;
    startWeightages: number[];
  } | null>(null);

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  const isValid = Math.round(total) === 100;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handleIndex: number) => {
      e.preventDefault();
      dragState.current = {
        dragging: true,
        segmentIndex: handleIndex,
        startX: e.clientX,
        startWeightages: goals.map((g) => g.weightage),
      };

      const onMove = (e: MouseEvent) => {
        if (!dragState.current || !barRef.current) return;
        const barWidth = barRef.current.offsetWidth;
        const dx = e.clientX - dragState.current.startX;
        const percentDelta = (dx / barWidth) * 100;

        const { segmentIndex, startWeightages } = dragState.current;
        const leftGoal = goals[segmentIndex];
        const rightGoal = goals[segmentIndex + 1];

        if (!leftGoal || !rightGoal) return;

        const newLeft = Math.max(10, Math.min(startWeightages[segmentIndex] + percentDelta, startWeightages[segmentIndex] + startWeightages[segmentIndex + 1] - 10));
        const newRight = startWeightages[segmentIndex] + startWeightages[segmentIndex + 1] - newLeft;

        onChange(leftGoal.id, Math.round(newLeft));
        onChange(rightGoal.id, Math.round(newRight));
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [goals, onChange]
  );

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {goals.map((g, i) => (
          <div key={g.id} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            />
            <span className="font-mono text-xs text-meridian-ink/70 max-w-[120px] truncate">{g.title}</span>
            <span
              className="font-mono text-xs font-semibold"
              style={{ color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            >
              {g.weightage}%
            </span>
          </div>
        ))}
      </div>

      {/* Segment bar */}
      <div
        ref={barRef}
        className="relative h-8 flex rounded-full overflow-visible select-none"
        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
      >
        {goals.map((g, i) => (
          <motion.div
            key={g.id}
            className="relative h-full flex items-center justify-center first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${g.weightage}%`,
              backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
              transition: 'width 0.1s',
            }}
            layout
          >
            <span className="font-mono text-xs text-white font-semibold drop-shadow">
              {g.weightage >= 12 ? `${g.weightage}%` : ''}
            </span>

            {/* Drag handle — between segments */}
            {i < goals.length - 1 && (
              <div
                className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-col-resize z-10 group"
                onMouseDown={(e) => handleMouseDown(e, i)}
              >
                <div className="w-1 h-5 rounded-full bg-white/60 group-hover:bg-white transition-colors" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Validation status bar */}
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isValid ? '#6b8e23' : '#ffbf00' }}
            animate={{ scale: isValid ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.4 }}
          />
          <span
            style={{ color: isValid ? '#6b8e23' : '#ffbf00' }}
          >
            {total.toFixed(0)} / 100%
          </span>
        </div>
        <span className={isValid ? 'text-status-track' : 'text-status-risk'}>
          {isValid ? '✓ Valid allocation' : `${(100 - total).toFixed(0)}% remaining`}
        </span>
      </div>
    </div>
  );
}
