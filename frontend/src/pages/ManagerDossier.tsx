import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, CheckCircle, Save } from 'lucide-react';
import { goalsApi } from '../api/goals';

const THRUST_COLORS: Record<string, string> = {
  Sales: '#4e7a62',
  Quality: '#5d6b82',
  Compliance: '#c8873a',
  Development: '#a08f80',
  Growth: '#7e6b8f',
};

export default function ManagerDossier() {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'REVIEW' | 'APPROVED'>('ALL');
  
  // State for inline edit targets
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editedTargetValue, setEditedTargetValue] = useState<number | string>('');
  const [checkInComments, setCheckInComments] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['teamGoals'],
    queryFn: () => goalsApi.getTeamGoals().then(r => r.data),
  });

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => goalsApi.getAuditLogs().then(r => r.data),
  });

  const { data: myGoalsData } = useQuery({
    queryKey: ['myGoals'],
    queryFn: () => goalsApi.getMyGoals().then(r => r.data),
  });

  const [selectedMyGoalId, setSelectedMyGoalId] = useState('');
  const [showPropagationMap, setShowPropagationMap] = useState(false);

  const pushSharedGoalMutation = useMutation({
    mutationFn: (data: { goalId: string; employeeIds: string[] }) => goalsApi.pushSharedGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setSelectedMyGoalId('');
      alert('Shared goal pushed to all team members successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to push goal: ${error.response?.data?.error || error.message}`);
    }
  });

  const handleExport = async () => {
    try {
      const response = await goalsApi.exportAchievements();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'achievement_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export achievements report.');
    }
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => goalsApi.approveTeamGoalSheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setExpandedEmployeeId(null);
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string, comment: string }) => goalsApi.returnTeamGoalSheet(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setCommentText('');
      setExpandedEmployeeId(null);
    },
  });

  const updateGoalMutation = useMutation({
    // Type target value update
    mutationFn: ({ goalId, targetValue }: { goalId: string; targetValue: number }) =>
      goalsApi.updateGoal(goalId, { targetValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      setEditingGoalId(null);
    },
  });

  const commentOnCheckInMutation = useMutation({
    mutationFn: ({ checkInId, comment }: { checkInId: string; comment: string }) =>
      goalsApi.commentOnCheckIn(checkInId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamGoals'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] w-full">
        <p className="font-mono text-sm text-meridian-ink/50 uppercase tracking-widest">Loading Dossiers…</p>
      </div>
    );
  }

  const team = data?.team ?? [];

  // Filter based on tabs
  const filteredTeam = team.filter((emp) => {
    const submitted = emp.goals.some((g: any) => g.status === 'SUBMITTED');
    const approved = emp.goals.every((g: any) => g.status === 'APPROVED') && emp.goals.length > 0;
    const pending = emp.goals.length === 0 || emp.goals.every((g: any) => g.status === 'DRAFT');

    if (activeTab === 'PENDING') return pending;
    if (activeTab === 'REVIEW') return submitted;
    if (activeTab === 'APPROVED') return approved;
    return true; // ALL
  });

  const totalSubmitted = team.filter((emp) => emp.goals.some((g: any) => g.status === 'SUBMITTED')).length;

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-4.5rem)]">
      
      {/* Sidebar - Review / Team */}
      <aside className="w-68 border-r border-meridian-ink/10 p-6 flex flex-col gap-8 bg-meridian-parchment overflow-y-auto">
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">Review</h4>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-meridian-gold/10 border border-meridian-gold text-meridian-gold font-bold">
              <span className="flex items-center gap-2">📄 Submissions</span>
              <span className="bg-meridian-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
            </div>
            <div className="flex items-center justify-between p-2 text-meridian-ink/65 hover:bg-meridian-ink/5 rounded transition-colors cursor-pointer">
              <span>📅 Check-ins</span>
              <span>—</span>
            </div>
            <div className="flex items-center justify-between p-2 text-meridian-ink/65 hover:bg-meridian-ink/5 rounded transition-colors cursor-pointer">
              <span>💬 Comments</span>
              <span>—</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">Team</h4>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between p-2 text-meridian-ink/65 hover:bg-meridian-ink/5 rounded transition-colors cursor-pointer">
              <span>🗺 Progress map</span>
            </div>
            <div className="flex items-center justify-between p-2 text-meridian-ink/65 hover:bg-meridian-ink/5 rounded transition-colors cursor-pointer">
              <span>👥 All members</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">Shared Goals</h4>
          <div className="space-y-2 font-mono text-xs">
            <select
              value={selectedMyGoalId}
              onChange={(e) => setSelectedMyGoalId(e.target.value)}
              className="w-full border border-meridian-ink/20 px-2 py-1.5 text-[10px] focus:outline-none focus:border-meridian-gold bg-[#fcfaf5] dark:bg-[#2a241d]"
            >
              <option value="">Select a goal to push...</option>
              {myGoalsData?.goals.map((g: any) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!selectedMyGoalId) return alert('Please select a goal first.');
                const employeeIds = team.map((emp: any) => emp.id);
                if (employeeIds.length === 0) return alert('No team members found.');
                pushSharedGoalMutation.mutate({ goalId: selectedMyGoalId, employeeIds });
              }}
              disabled={!selectedMyGoalId || pushSharedGoalMutation.isPending}
              className="w-full px-2 py-1.5 bg-meridian-ink text-white text-[10px] uppercase tracking-wider hover:bg-meridian-gold hover:text-meridian-ink transition-colors disabled:opacity-50 disabled:hover:bg-meridian-ink disabled:hover:text-white"
            >
              {pushSharedGoalMutation.isPending ? 'Pushing...' : 'Push to All Members'}
            </button>
            <button
              onClick={() => {
                if (!selectedMyGoalId) return alert('Please select a goal first.');
                setShowPropagationMap(true);
              }}
              disabled={!selectedMyGoalId}
              className="w-full px-2 py-1.5 border border-meridian-ink/30 text-meridian-ink text-[10px] uppercase tracking-wider hover:bg-meridian-ink/5 transition-colors disabled:opacity-50"
            >
              View Propagation Map
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel - Dossier filing cards */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-meridian-parchment p-5">
        
        {/* Header */}
        <div className="pb-4 flex-shrink-0">
          <h1 className="font-serif text-4xl text-meridian-ink leading-none">Goal submissions</h1>
          <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mt-1.5">
            PHASE 1 · GOAL SETTING · {totalSubmitted} of {team.length} SUBMITTED
          </p>
        </div>

        {/* Tab strip */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0 border-b border-meridian-ink/10 pb-3">
          <div className="flex p-0.5 border border-meridian-ink/10 rounded-sm font-mono text-[10px] tracking-wider font-bold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'ALL' ? 'bg-meridian-ink text-white' : 'text-meridian-ink/40 hover:text-meridian-ink'}`}
            >
              ALL {team.length}
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'PENDING' ? 'bg-meridian-ink text-white' : 'text-meridian-ink/40 hover:text-meridian-ink'}`}
            >
              PENDING {team.filter(emp => emp.goals.length === 0 || emp.goals.every((g: any) => g.status === 'DRAFT')).length}
            </button>
            <button
              onClick={() => setActiveTab('REVIEW')}
              className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'REVIEW' ? 'bg-meridian-ink text-white' : 'text-meridian-ink/40 hover:text-meridian-ink'}`}
            >
              UNDER REVIEW {totalSubmitted}
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3 py-1.5 rounded-sm transition-all ${activeTab === 'APPROVED' ? 'bg-meridian-ink text-white' : 'text-meridian-ink/40 hover:text-meridian-ink'}`}
            >
              APPROVED {team.filter(emp => emp.goals.every((g: any) => g.status === 'APPROVED') && emp.goals.length > 0).length}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="font-mono text-[10px] text-meridian-ink/60 hover:text-meridian-ink uppercase tracking-widest flex items-center gap-1 border border-meridian-ink/20 px-2 py-1 rounded hover:bg-meridian-ink/5"
            >
              <FileText size={10} /> Export Achievements
            </button>
            <span className="font-mono text-[10px] text-meridian-ink/40 uppercase tracking-widest">
              Sort: submitted date
            </span>
          </div>
        </div>

        {/* Dossiers List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {filteredTeam.map((emp) => {
            const isExpanded = expandedEmployeeId === emp.id;
            const submitted = emp.goals.some((g: any) => g.status === 'SUBMITTED');
            const approved = emp.goals.every((g: any) => g.status === 'APPROVED') && emp.goals.length > 0;
            
            // Status Pill
            let statusText = 'PENDING';
            let statusColor = 'bg-[#f7c948]/10 text-[#8d6e15] border-[#f7c948]/30';
            if (submitted) {
              statusText = 'UNDER REVIEW';
              statusColor = 'bg-[#4895ef]/10 text-[#1e5aa8] border-[#4895ef]/30';
            } else if (approved) {
              statusText = 'APPROVED';
              statusColor = 'bg-[#4e7a62]/10 text-[#4e7a62] border-[#4e7a62]/30';
            } else if (emp.goals.length === 0) {
              statusText = 'NOT FILED';
              statusColor = 'bg-[#a08f80]/10 text-[#5a5047] border-[#a08f80]/30';
            }

            const initials = emp.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase();

            const totalW = emp.goals.reduce((s: number, g: any) => s + g.weightage, 0);

            return (
              <div
                key={emp.id}
                className="border border-meridian-ink/10 rounded-lg bg-white/60 overflow-hidden transition-all duration-300 shadow-sm"
              >
                {/* Filing card top row */}
                <div
                  onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Circle initials avatar */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-xs bg-[#e9e3d5] text-meridian-ink">
                      {initials}
                    </div>

                    <div>
                      <h3 className="font-serif text-lg font-bold text-meridian-ink">{emp.name}</h3>
                      <p className="font-mono text-[10px] text-meridian-ink/50 uppercase mt-0.5">
                        {emp.department || 'Sales North'} · {emp.goals.length} goals · {submitted ? 'Submitted May 12' : 'Not submitted'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {/* Weightage progress bar preview */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-meridian-ink/40">Weightage</span>
                      <div className="w-24 h-1.5 bg-meridian-ink/5 rounded-full overflow-hidden flex">
                        {emp.goals.map((g: any) => (
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
                      <span className="font-mono text-xs text-meridian-ink/50 font-bold">{totalW}/100</span>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 border rounded-sm font-mono text-[9px] font-bold tracking-widest ${statusColor}`}>
                      {statusText}
                    </span>

                    {/* Chevron toggle */}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Card detail view */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-meridian-ink/10 bg-white"
                    >
                      <div className="p-5 space-y-4">
                        
                        <h4 className="font-mono text-[9px] uppercase tracking-widest text-meridian-ink/40 border-b border-meridian-ink/5 pb-2">
                          Core Goals Sheet
                        </h4>

                        {emp.goals.length === 0 ? (
                          <p className="font-mono text-xs text-meridian-ink/40 py-4">No goals created yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {emp.goals.map((goal: any) => (
                              <div key={goal.id} className="p-4 border border-meridian-ink/5 rounded bg-meridian-parchment/20 flex justify-between items-start">
                                <div>
                                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-mono tracking-widest uppercase mb-1.5 text-white rounded-sm" style={{ backgroundColor: THRUST_COLORS[goal.thrustArea] }}>
                                    {goal.thrustArea}
                                  </span>
                                  <h5 className="font-serif text-base font-bold text-meridian-ink">{goal.title}</h5>
                                  <p className="text-xs text-meridian-ink/60 mt-1 max-w-xl">{goal.description}</p>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1.5 font-mono text-xs">
                                  <span className="font-bold text-meridian-gold">{goal.weightage}% weight</span>
                                  
                                  {/* UOM / Target values - UNDERLINED in amber to signal editability */}
                                  <div className="flex items-center gap-1.5 text-[10px] text-meridian-ink/50 uppercase mt-0.5">
                                    <span>Target:</span>
                                    {editingGoalId === goal.id ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={editedTargetValue}
                                          onChange={(e) => setEditedTargetValue(e.target.value)}
                                          className="w-16 border-b border-meridian-gold focus:outline-none px-1 bg-white font-mono text-xs"
                                        />
                                        <button
                                          onClick={() => updateGoalMutation.mutate({ goalId: goal.id, targetValue: Number(editedTargetValue) })}
                                          className="text-meridian-gold hover:text-meridian-ink"
                                        >
                                          <Save size={10} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span
                                        onClick={() => {
                                          setEditingGoalId(goal.id);
                                          setEditedTargetValue(goal.targetValue ?? '');
                                        }}
                                        className="underline decoration-meridian-gold decoration-2 cursor-pointer font-bold text-meridian-ink hover:text-meridian-gold"
                                        title="Click to edit target value"
                                      >
                                        {goal.targetValue ?? 'Zero'}
                                      </span>
                                    )}
                                    <span>({goal.uomType})</span>
                                  </div>
                                </div>

                                {/* Check-in Review & Manager Comment stream */}
                                {goal.checkIns && goal.checkIns.length > 0 && (
                                  <div className="mt-4 pl-4 border-l-2 border-meridian-gold/20 space-y-3 w-full">
                                    <p className="font-mono text-[9px] uppercase tracking-wider text-meridian-gold font-bold">Check-in Logs & Feedback</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {goal.checkIns.map((ci: any) => (
                                        <div key={ci.id} className="bg-meridian-parchment/30 p-3 rounded border border-meridian-ink/5 space-y-2">
                                          <div className="flex justify-between items-center text-[10px] font-mono">
                                            <span className="font-bold text-meridian-ink">{ci.cyclePhase} Check-in</span>
                                            <span className="text-meridian-ink/40">
                                              {ci.checkedInAt ? new Date(ci.checkedInAt).toLocaleDateString('en-IN') : ''}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-baseline text-xs">
                                            <span className="font-mono text-meridian-ink/65 text-[10px]">
                                              Actual: <strong className="text-meridian-ink font-bold">{ci.actualValue !== null ? ci.actualValue : '—'}</strong>
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-meridian-gold font-mono">
                                              Score: {ci.computedScore !== null ? `${Math.round(ci.computedScore)}%` : '—'}
                                            </span>
                                          </div>

                                          {/* Existing Manager feedback comment */}
                                          {ci.managerComment ? (
                                            <p className="text-[10px] text-meridian-ink/75 bg-meridian-gold/5 p-2 rounded border border-meridian-gold/15 italic leading-relaxed font-mono">
                                              💬 Feedback: "{ci.managerComment}"
                                            </p>
                                          ) : (
                                            <p className="text-[9px] text-meridian-ink/40 font-mono italic">No feedback registered yet.</p>
                                          )}

                                          {/* Post comment form */}
                                          <div className="flex gap-1.5 pt-1">
                                            <input
                                              type="text"
                                              placeholder="Review comment..."
                                              value={checkInComments[ci.id] ?? ''}
                                              onChange={(e) => setCheckInComments(prev => ({ ...prev, [ci.id]: e.target.value }))}
                                              className="flex-1 border border-meridian-ink/10 px-2 py-1 font-mono text-[10px] focus:outline-none focus:border-meridian-gold bg-white"
                                            />
                                            <button
                                              onClick={() => {
                                                const text = checkInComments[ci.id];
                                                if (text?.trim()) {
                                                  commentOnCheckInMutation.mutate({ checkInId: ci.id, comment: text });
                                                  setCheckInComments(prev => ({ ...prev, [ci.id]: '' }));
                                                }
                                              }}
                                              disabled={commentOnCheckInMutation.isPending}
                                              className="px-2.5 py-1 bg-meridian-ink text-white font-mono text-[9px] uppercase tracking-wider hover:bg-meridian-gold hover:text-meridian-ink transition-colors rounded-sm"
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sign-off Form */}
                        {submitted && (
                          <div className="border-t border-meridian-ink/10 pt-6 mt-8">
                            <h5 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3">
                              Dossier Approval Sign-off
                            </h5>
                            
                            <div className="flex gap-4">
                              <input
                                type="text"
                                placeholder="Add optional sign-off remarks/comments..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="flex-1 border border-meridian-ink/20 px-4 py-2 font-mono text-xs focus:outline-none focus:border-meridian-gold bg-transparent"
                              />

                              <button
                                onClick={() => returnMutation.mutate({ id: emp.id, comment: commentText })}
                                className="px-5 py-2.5 border border-meridian-gold text-meridian-gold font-mono text-xs uppercase tracking-wider hover:bg-meridian-gold/10"
                              >
                                Return Sheet
                              </button>

                              <button
                                onClick={() => approveMutation.mutate(emp.id)}
                                className="px-6 py-2.5 bg-meridian-ink text-white font-mono text-xs uppercase tracking-wider hover:bg-meridian-gold hover:text-meridian-ink transition-colors flex items-center gap-2"
                              >
                                <CheckCircle size={12} /> Sign & Approve
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Compliance Logbook & Archival Ledger */}
        <div className="mt-5 border-t border-meridian-ink/10 pt-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-serif text-lg text-meridian-ink">Compliance Logbook</h2>
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-meridian-gold/15 text-meridian-gold uppercase tracking-widest font-semibold border border-meridian-gold/20">HR Audit Trail</span>
          </div>
          <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mb-2.5">
            immutable chronographic log of all appraisal modifications & sign-offs
          </p>

          <div className="border border-meridian-ink/10 rounded bg-[#fcfaf5] dark:bg-[#2a241d] overflow-hidden">
            <div className="grid grid-cols-5 bg-meridian-ink/5 border-b border-meridian-ink/10 p-2 font-mono text-[9px] uppercase tracking-wider text-meridian-ink/50 font-bold">
              <div>Timestamp</div>
              <div>Actor</div>
              <div>Entity</div>
              <div>Action / Field</div>
              <div>Change Record</div>
            </div>
            
            <div className="h-32 overflow-y-auto font-mono text-[10px] divide-y divide-meridian-ink/5">
              {isAuditLoading ? (
                <div className="p-4 text-center text-meridian-ink/30 uppercase tracking-widest">Reading ledger files…</div>
              ) : !auditLogs || auditLogs.length === 0 ? (
                <div className="p-4 text-center text-meridian-ink/30 uppercase tracking-widest">No change records filed.</div>
              ) : (
                auditLogs.map((log: any) => {
                  const date = new Date(log.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateDay = new Date(log.changedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  
                  // Action / value summaries
                  let actionText = '';
                  let changeRecord = '';
                  let badgeColor = '';
                  
                  if (log.entityType === 'GoalSheet') {
                    actionText = `Sheet ${log.newValue}`;
                    changeRecord = `${log.oldValue} ➔ ${log.newValue}`;
                    badgeColor = log.newValue === 'APPROVED' ? 'text-[#4e7a62]' : 'text-[#8d6e15]';
                  } else if (log.entityType === 'Goal') {
                    actionText = `Goal Update`;
                    changeRecord = `${log.fieldName}: ${log.oldValue} ➔ ${log.newValue}`;
                    badgeColor = 'text-[#c8873a]';
                  } else if (log.entityType === 'CheckIn') {
                    actionText = `${log.fieldName} Check-in`;
                    changeRecord = `Value: ${log.newValue}`;
                    badgeColor = 'text-[#1e5aa8]';
                  }

                  return (
                    <div key={log.id} className="grid grid-cols-5 p-2 items-center hover:bg-meridian-ink/[0.02]">
                      <div className="text-meridian-ink/40 font-bold">{dateDay} {date}</div>
                      <div className="text-meridian-ink/70 font-semibold">{log.changedBy?.name} <span className="text-[8px] opacity-40">({log.changedBy?.role})</span></div>
                      <div className="text-meridian-ink/60 uppercase text-[9px] font-bold">{log.entityType}</div>
                      <div className={`font-bold uppercase text-[9px] ${badgeColor}`}>{actionText}</div>
                      <div className="text-meridian-ink/80 truncate font-semibold" title={changeRecord}>{changeRecord}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Propagation Map Modal */}
      <AnimatePresence>
        {showPropagationMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-meridian-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPropagationMap(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-meridian-parchment border border-meridian-ink/20 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-meridian-ink/10 flex justify-between items-center bg-[#fcfaf5] dark:bg-[#2a241d]">
                <div>
                  <h3 className="font-serif text-2xl text-meridian-ink">Shared Goal Propagation Map</h3>
                  <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mt-0.5">
                    Live tracking of goal adoption and achievement across the team
                  </p>
                </div>
                <button
                  onClick={() => setShowPropagationMap(false)}
                  className="font-mono text-xs text-meridian-ink/60 hover:text-meridian-ink uppercase tracking-widest"
                >
                  Close [×]
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 bg-meridian-ink/5 border-b border-meridian-ink/10 p-2 font-mono text-[9px] uppercase tracking-wider text-meridian-ink/50 font-bold">
                  <div>Employee</div>
                  <div className="text-center">Status</div>
                  <div className="text-center">Weightage</div>
                  <div className="text-center">Achievement</div>
                  <div className="text-right">Score</div>
                </div>

                <div className="font-mono text-[11px] divide-y divide-meridian-ink/5">
                  {team.map((emp: any) => {
                    const goalCopy = emp.goals.find((g: any) => g.parentGoalId === selectedMyGoalId);
                    
                    let statusText = 'NOT RECEIVED';
                    let statusColor = 'text-meridian-ink/30';
                    let weightageText = '—';
                    let achievementText = '—';
                    let scoreText = '—';

                    if (goalCopy) {
                      statusText = goalCopy.status;
                      statusColor = 
                        goalCopy.status === 'APPROVED' ? 'text-[#4e7a62]' :
                        goalCopy.status === 'SUBMITTED' ? 'text-[#4895ef]' :
                        'text-[#8d6e15]';
                      
                      weightageText = `${goalCopy.weightage}%`;
                      
                      const latestCheckIn = goalCopy.checkIns?.[0];
                      if (latestCheckIn) {
                        achievementText = latestCheckIn.actualValue != null ? String(latestCheckIn.actualValue) : 'N/A';
                        scoreText = latestCheckIn.computedScore != null ? `${latestCheckIn.computedScore.toFixed(1)}%` : '0%';
                      }
                    }

                    return (
                      <div key={emp.id} className="grid grid-cols-5 p-3 items-center hover:bg-meridian-ink/[0.02]">
                        <div className="font-bold text-meridian-ink">{emp.name}</div>
                        <div className={`text-center font-bold text-[10px] ${statusColor}`}>{statusText}</div>
                        <div className="text-center text-meridian-ink/70">{weightageText}</div>
                        <div className="text-center text-meridian-ink/70">{achievementText}</div>
                        <div className="text-right font-bold text-meridian-gold">{scoreText}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
