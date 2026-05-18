import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const UOM_INFO = {
  MIN: {
    label: 'Numeric / % — Min (Higher is Better)',
    description: 'This goal scores higher when achievement exceeds target.',
    formula: 'Score = Achievement ÷ Target × 100',
    example: 'e.g. Revenue, NPS, Units Sold',
  },
  MAX: {
    label: 'Numeric / % — Max (Lower is Better)',
    description: 'This goal scores higher when achievement stays below target.',
    formula: 'Score = Target ÷ Achievement × 100',
    example: 'e.g. Error rate, Days to close, Cost',
  },
  TIMELINE: {
    label: 'Timeline (Date-based)',
    description: 'This goal scores 100% if completed on or before the deadline.',
    formula: 'Score = 100% if on time, else 0%',
    example: 'e.g. Project delivery, Certification',
  },
  ZERO: {
    label: 'Zero-based (Zero = Success)',
    description: 'This goal scores 100% only if the actual value is zero.',
    formula: 'Score = 100% if actual = 0, else 0%',
    example: 'e.g. Violations, Escalations, Incidents',
  },
};

const THRUST_AREAS = [
  'Revenue Growth',
  'Customer Success',
  'Operational Excellence',
  'Learning & Development',
  'Compliance',
  'Innovation',
  'People & Culture',
  'Process Improvement',
];

const schema = z.object({
  thrustArea: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  uomType: z.enum(['MIN', 'MAX', 'TIMELINE', 'ZERO']),
  targetValue: z.number().optional(),
  targetDate: z.string().optional(),
  weightage: z.number().min(10, 'Minimum 10% weightage').max(90, 'Maximum 90% weightage'),
});

type FormData = z.infer<typeof schema>;

interface GoalCreateFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  existingTotal: number;
  existingCount: number;
}

export function GoalCreateForm({ onSubmit, onClose, existingTotal, existingCount }: GoalCreateFormProps) {
  // Lock body scroll while modal is mounted to prevent double scrollbars
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, []);

  const remaining = 100 - existingTotal;
  const suggestedWeightage = Math.max(10, Math.min(remaining, remaining));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      uomType: 'MIN',
      weightage: Math.max(10, Math.min(suggestedWeightage, 90)),
    },
  });

  const watchedWeightage = watch('weightage') || 0;
  const watchedUom = watch('uomType');
  const uomInfo = UOM_INFO[watchedUom as keyof typeof UOM_INFO] || UOM_INFO.MIN;

  const handleUomChange = (type: keyof typeof UOM_INFO) => {
    setValue('uomType', type);
  };

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-meridian-ink/80 backdrop-blur-sm z-50 overflow-y-auto flex justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-meridian-parchment w-full max-w-2xl shadow-2xl relative my-auto"
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="bg-meridian-ink text-white p-6 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl text-meridian-gold">Add New Goal</h2>
            <p className="font-mono text-xs text-white/50 mt-1 uppercase tracking-widest">
              {existingCount}/8 goals · {existingTotal}% allocated · {remaining}% remaining
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors mt-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Row: Thrust Area + Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-meridian-ink/70">
                Thrust Area
              </label>
              <select
                {...register('thrustArea')}
                className="w-full bg-white border border-meridian-ink/20 px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors appearance-none rounded-none"
              >
                <option value="">Select area…</option>
                {THRUST_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              {errors.thrustArea && (
                <p className="text-red-600 text-xs mt-1 font-mono">{errors.thrustArea.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-meridian-ink/70">
                Weightage %
              </label>
              <input
                type="number"
                min={10}
                max={90}
                {...register('weightage', { valueAsNumber: true })}
                className="w-full bg-white border border-meridian-ink/20 px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors rounded-none"
              />
              {errors.weightage && (
                <p className="text-red-600 text-xs mt-1 font-mono">{errors.weightage.message}</p>
              )}
              <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-meridian-gold rounded-full"
                  animate={{ width: `${Math.min(watchedWeightage, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 200 }}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-meridian-ink/70">
              Goal Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Achieve ₹1.5 Cr in Q2 Sales"
              className="w-full bg-white border border-meridian-ink/20 px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors rounded-none"
            />
            {errors.title && (
              <p className="text-red-600 text-xs mt-1 font-mono">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-meridian-ink/70">
              Description <span className="normal-case opacity-60">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Describe what success looks like…"
              className="w-full bg-white border border-meridian-ink/20 px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors resize-none rounded-none"
            />
          </div>

          {/* UoM Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-3 text-meridian-ink/70">
              Unit of Measurement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(UOM_INFO) as [keyof typeof UOM_INFO, typeof UOM_INFO.MIN][]).map(([type, info]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleUomChange(type)}
                  className="text-left p-3 border transition-all"
                  style={{
                    borderColor: watchedUom === type ? '#c8873a' : 'rgba(26,22,18,0.15)',
                    backgroundColor: watchedUom === type ? '#c8873a10' : 'white',
                  }}
                >
                  <p
                    className="font-mono text-xs font-semibold"
                    style={{ color: watchedUom === type ? '#c8873a' : '#1a1612' }}
                  >
                    {type}
                  </p>
                  <p className="text-[10px] text-meridian-ink/50 mt-0.5 font-mono">{info.example}</p>
                </button>
              ))}
            </div>

            {/* Formula preview — live */}
            <AnimatePresence mode="wait">
              <motion.div
                key={watchedUom}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 p-3 bg-meridian-ink text-white border-l-2 border-meridian-gold"
              >
                <p className="font-mono text-xs text-meridian-gold uppercase tracking-widest mb-1">
                  How your score is calculated
                </p>
                <p className="text-white/80 text-xs">{uomInfo.description}</p>
                <p className="font-mono text-sm text-white mt-1.5 font-semibold">{uomInfo.formula}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Target input — conditional by UoM */}
          {(watchedUom === 'MIN' || watchedUom === 'MAX') && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-meridian-ink/70">
                Target Value
              </label>
              <input
                type="number"
                step="any"
                {...register('targetValue', { valueAsNumber: true })}
                placeholder="Enter target number…"
                className="w-full bg-white border border-meridian-ink/20 px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors rounded-none"
              />
            </div>
          )}

          {watchedUom === 'TIMELINE' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-meridian-ink/70">
                Target Date / Deadline
              </label>
              <input
                type="date"
                {...register('targetDate')}
                className="w-full bg-white border border-meridian-ink/20 px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors rounded-none"
              />
            </div>
          )}

          {watchedUom === 'ZERO' && (
            <div className="p-3 bg-black/5 border border-black/10 font-mono text-xs text-meridian-ink/70">
              ℹ Target is fixed at 0 — this goal scores 100% when no violations / incidents are logged.
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-meridian-ink/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-mono text-sm border border-meridian-ink/30 hover:bg-meridian-ink hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-meridian-gold text-meridian-ink font-mono text-sm font-semibold hover:bg-meridian-ink hover:text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding…' : 'Add Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
