import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type { CyclePhase } from '../api/admin';
import { Calendar, AlertCircle, Compass, Settings, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminControl() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCyclePhase, setNewCyclePhase] = useState<CyclePhase>('GOAL_SETTING');
  const [newCycleOpen, setNewCycleOpen] = useState('');
  const [newCycleClose, setNewCycleClose] = useState('');

  // Editing state for active cycle dates
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [editOpenDate, setEditOpenDate] = useState('');
  const [editCloseDate, setEditCloseDate] = useState('');

  const { data: cycles, isLoading: isCyclesLoading } = useQuery({
    queryKey: ['adminCycles'],
    queryFn: () => adminApi.getCycles().then((r) => r.data),
  });

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => adminApi.getAnalytics().then((r) => r.data),
  });

  const updateCycleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateCycle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCycles'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setEditingCycleId(null);
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCycles'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setIsCreating(false);
      setNewCycleName('');
      setNewCycleOpen('');
      setNewCycleClose('');
    },
  });

  const handlePhaseChange = (cycleId: string, phase: CyclePhase) => {
    updateCycleMutation.mutate({ id: cycleId, data: { phase } });
  };

  const handleToggleActive = (cycleId: string, isActive: boolean) => {
    updateCycleMutation.mutate({ id: cycleId, data: { isActive } });
  };

  const handleSaveDates = (cycleId: string) => {
    updateCycleMutation.mutate({
      id: cycleId,
      data: {
        windowOpen: new Date(editOpenDate).toISOString(),
        windowClose: new Date(editCloseDate).toISOString(),
      },
    });
  };

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleName || !newCycleOpen || !newCycleClose) return;
    createCycleMutation.mutate({
      name: newCycleName,
      phase: newCyclePhase,
      windowOpen: new Date(newCycleOpen).toISOString(),
      windowClose: new Date(newCycleClose).toISOString(),
      isActive: true, // Make active immediately
    });
  };

  if (isCyclesLoading || isAnalyticsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-[70vh] bg-meridian-parchment font-mono text-xs uppercase tracking-widest text-meridian-ink/40">
        Syncing Admin Control systems…
      </div>
    );
  }

  const activeCycle = cycles?.find((c) => c.isActive);
  const otherCycles = cycles?.filter((c) => !c.isActive) ?? [];

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-4.5rem)] bg-meridian-parchment">
      
      {/* Sidebar Controls */}
      <aside className="w-72 border-r border-meridian-ink/10 p-6 flex flex-col gap-6 bg-meridian-parchment overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Compass className="text-meridian-gold animate-spin-slow" size={14} />
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 font-bold">Appraisal Year</h4>
          </div>
          
          {activeCycle ? (
            <div className="p-4 border border-meridian-gold bg-meridian-gold/5 rounded relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 opacity-5 border border-meridian-ink rounded-full translate-x-2 -translate-y-2" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-meridian-gold font-bold">ACTIVE CYCLE</span>
              <h5 className="font-serif text-lg text-meridian-ink font-bold mt-1">{activeCycle.name}</h5>
              <p className="font-mono text-[9px] text-meridian-ink/50 uppercase mt-0.5 tracking-wider">
                Phase: {activeCycle.phase}
              </p>
              
              <div className="mt-4 border-t border-meridian-ink/10 pt-3 space-y-2 font-mono text-[10px] text-meridian-ink/60">
                <div className="flex justify-between">
                  <span>Window Open:</span>
                  <span className="font-bold">{new Date(activeCycle.windowOpen).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Window Close:</span>
                  <span className="font-bold">{new Date(activeCycle.windowClose).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-meridian-ink/20 rounded text-center py-6">
              <AlertCircle className="mx-auto text-meridian-ink/30 mb-2" size={16} />
              <p className="font-mono text-[10px] text-meridian-ink/40 uppercase">No active cycle set</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3 font-bold">Cycle Operations</h4>
          <div className="space-y-2 font-mono text-xs">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-meridian-ink/30 hover:border-meridian-gold hover:text-meridian-gold rounded transition-colors text-[10px] uppercase tracking-wider"
            >
              <Plus size={11} /> Create New Cycle
            </button>
          </div>
        </div>

        {otherCycles.length > 0 && (
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3 font-bold">Archived Cycles</h4>
            <div className="space-y-2 font-mono text-[11px]">
              {otherCycles.map((c) => (
                <div key={c.id} className="p-3 border border-meridian-ink/5 bg-white/40 rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-meridian-ink">{c.name}</span>
                    <div className="text-[9px] text-meridian-ink/40 uppercase mt-0.5">{c.phase}</div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(c.id, true)}
                    className="px-2 py-0.5 bg-meridian-ink text-white hover:bg-meridian-gold hover:text-meridian-ink text-[8px] uppercase tracking-widest rounded-sm font-bold transition-all"
                  >
                    Activate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 relative">
        <div className="pb-4 flex-shrink-0 flex justify-between items-center border-b border-meridian-ink/10">
          <div>
            <h1 className="font-serif text-4xl text-meridian-ink leading-tight flex items-center gap-3">
              <span>Admin Health & Operations</span>
              <Settings className="text-meridian-gold" size={24} />
            </h1>
            <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mt-1">
              appraisal portal diagnostics, performance scoreboards & timeline adjustments
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 mt-4 pr-1">
          
          {/* Active Cycle Management Switchboard */}
          {activeCycle && (
            <section className="bg-white/60 border border-meridian-ink/10 rounded-lg p-5">
              <h3 className="font-serif text-xl text-meridian-ink mb-1">Cycle Switchboard</h3>
              <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mb-4">
                control active check-in phases & adjust operational windows
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3 font-bold">Appraisal Phase Control</h4>
                  <div className="flex p-0.5 border border-meridian-ink/10 rounded font-mono text-[10px] tracking-wider font-bold w-fit bg-[#fcfaf5] dark:bg-[#2a241d]">
                    {(['GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4'] as CyclePhase[]).map((phase) => (
                      <button
                        key={phase}
                        onClick={() => handlePhaseChange(activeCycle.id, phase)}
                        className={`px-3 py-1.5 rounded transition-all ${
                          activeCycle.phase === phase ? 'bg-meridian-ink text-white shadow-sm' : 'text-meridian-ink/40 hover:text-meridian-ink'
                        }`}
                      >
                        {phase}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-meridian-ink/40 mb-3 font-bold">Window Target Dates</h4>
                  {editingCycleId === activeCycle.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-meridian-ink/40">Open Date</label>
                        <input
                          type="date"
                          value={editOpenDate}
                          onChange={(e) => setEditOpenDate(e.target.value)}
                          className="border border-meridian-ink/10 p-1 bg-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[8px] uppercase tracking-widest text-meridian-ink/40">Close Date</label>
                        <input
                          type="date"
                          value={editCloseDate}
                          onChange={(e) => setEditCloseDate(e.target.value)}
                          className="border border-meridian-ink/10 p-1 bg-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2 self-end">
                        <button
                          onClick={() => handleSaveDates(activeCycle.id)}
                          className="px-3 py-1.5 bg-meridian-ink text-white font-mono text-[10px] uppercase tracking-widest rounded font-bold hover:bg-meridian-gold hover:text-meridian-ink"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCycleId(null)}
                          className="px-3 py-1.5 border border-meridian-ink/10 font-mono text-[10px] uppercase tracking-widest rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="font-mono text-xs text-meridian-ink/80 flex items-center gap-4">
                        <div>
                          <span className="opacity-50 text-[10px]">Open:</span> <span className="font-bold">{new Date(activeCycle.windowOpen).toLocaleDateString()}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-meridian-ink/15" />
                        <div>
                          <span className="opacity-50 text-[10px]">Close:</span> <span className="font-bold">{new Date(activeCycle.windowClose).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setEditingCycleId(activeCycle.id);
                          setEditOpenDate(new Date(activeCycle.windowOpen).toISOString().split('T')[0]);
                          setEditCloseDate(new Date(activeCycle.windowClose).toISOString().split('T')[0]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 border border-meridian-gold text-meridian-gold font-mono text-[10px] uppercase tracking-widest rounded hover:bg-meridian-gold/10"
                      >
                        <Calendar size={10} /> Edit Dates
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Create Cycle Modal Form Overlay */}
          {isCreating && (
            <section className="bg-white border border-meridian-gold rounded-lg p-5 shadow-md">
              <h3 className="font-serif text-lg text-meridian-ink mb-1 flex items-center gap-2">
                <span>Initiate Appraisal Cycle</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-meridian-gold/15 text-meridian-gold uppercase border border-meridian-gold/25 font-bold">Appraisal Launch</span>
              </h3>
              <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mb-4">
                setup new operational calendar year and goal boundaries
              </p>

              <form onSubmit={handleCreateCycle} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-meridian-ink/50">Cycle Title</label>
                    <input
                      type="text"
                      placeholder="e.g. FY 2026-27"
                      value={newCycleName}
                      onChange={(e) => setNewCycleName(e.target.value)}
                      className="border border-meridian-ink/20 p-2 font-mono text-xs focus:outline-none focus:border-meridian-gold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-meridian-ink/50">Initial Phase</label>
                    <select
                      value={newCyclePhase}
                      onChange={(e) => setNewCyclePhase(e.target.value as CyclePhase)}
                      className="border border-meridian-ink/20 p-2 font-mono text-xs focus:outline-none focus:border-meridian-gold bg-transparent"
                    >
                      <option value="GOAL_SETTING">GOAL SETTING</option>
                      <option value="Q1">Q1 CHECK-IN</option>
                      <option value="Q2">Q2 CHECK-IN</option>
                      <option value="Q3">Q3 CHECK-IN</option>
                      <option value="Q4">Q4 CHECK-IN</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-meridian-ink/50">Open Date</label>
                    <input
                      type="date"
                      value={newCycleOpen}
                      onChange={(e) => setNewCycleOpen(e.target.value)}
                      className="border border-meridian-ink/20 p-2 font-mono text-xs focus:outline-none focus:border-meridian-gold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-meridian-ink/50">Close Date</label>
                    <input
                      type="date"
                      value={newCycleClose}
                      onChange={(e) => setNewCycleClose(e.target.value)}
                      className="border border-meridian-ink/20 p-2 font-mono text-xs focus:outline-none focus:border-meridian-gold"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-meridian-ink/5">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-meridian-ink text-white font-mono text-xs uppercase tracking-widest rounded hover:bg-meridian-gold hover:text-meridian-ink font-bold transition-all"
                  >
                    Launch Cycle
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-5 py-2.5 border border-meridian-ink/20 font-mono text-xs uppercase tracking-widest rounded"
                  >
                    Dismiss
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Submission Funnel Funnel Card */}
          <section className="bg-white/60 border border-meridian-ink/10 rounded-lg p-5">
            <h3 className="font-serif text-xl text-meridian-ink mb-1">Workforce Submission funnel</h3>
            <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mb-4">
              completion metrics & pending review ratios for all employee sheets
            </p>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Approved', value: analytics?.sheets.approved ?? 0, color: '#4e7a62' },
                        { name: 'Under Review', value: analytics?.sheets.submitted ?? 0, color: '#4895ef' },
                        { name: 'Returned', value: analytics?.sheets.returned ?? 0, color: '#8d6e15' },
                        { name: 'Draft', value: analytics?.sheets.draft ?? 0, color: '#a08f80' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Approved', value: analytics?.sheets.approved ?? 0, color: '#4e7a62' },
                        { name: 'Under Review', value: analytics?.sheets.submitted ?? 0, color: '#4895ef' },
                        { name: 'Returned', value: analytics?.sheets.returned ?? 0, color: '#8d6e15' },
                        { name: 'Draft', value: analytics?.sheets.draft ?? 0, color: '#a08f80' },
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Sheets`, 'Count']} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 grid grid-cols-2 gap-4 font-mono text-center">
                <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded">
                  <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">Approved Sheets</div>
                  <div className="text-xl font-bold mt-1 text-[#4e7a62]">{analytics?.sheets.approved}</div>
                </div>
                <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded">
                  <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">Submitted / Under Review</div>
                  <div className="text-xl font-bold mt-1 text-[#4895ef]">{analytics?.sheets.submitted}</div>
                </div>
                <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded">
                  <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">Returned / Corrections</div>
                  <div className="text-xl font-bold mt-1 text-[#8d6e15]">{analytics?.sheets.returned}</div>
                </div>
                <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded">
                  <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">Drafts pending</div>
                  <div className="text-xl font-bold mt-1 text-meridian-ink/50">{analytics?.sheets.draft}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Departmental Diagnostic Table */}
          <section className="bg-white/60 border border-meridian-ink/10 rounded-lg p-5">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-serif text-xl text-meridian-ink">Departmental Diagnostic Ledger</h3>
              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-meridian-ink/5 text-meridian-ink/65 uppercase tracking-widest font-bold border border-meridian-ink/10">Organizational Grid</span>
            </div>
            <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mb-4">
              diagnostic aggregates filtered by geographical and organizational departments
            </p>

            <div className="h-64 mb-6 bg-white/40 p-4 rounded-lg border border-meridian-ink/5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.departments.map(dept => ({
                  name: dept.department,
                  score: dept.averageProgressScore,
                })) ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#5a5047" style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase' }} />
                  <YAxis stroke="#5a5047" style={{ fontSize: '9px', fontFamily: 'monospace' }} unit="%" />
                  <RechartsTooltip formatter={(value) => [`${value}%`, 'Avg Score']} />
                  <Bar dataKey="score" fill="#c8873a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-meridian-ink/10 rounded bg-[#fcfaf5] dark:bg-[#2a241d] overflow-hidden">
              <div className="grid grid-cols-6 bg-meridian-ink/5 border-b border-meridian-ink/10 p-2.5 font-mono text-[9px] uppercase tracking-wider text-meridian-ink/50 font-bold">
                <div>Department</div>
                <div className="text-center">Staff Count</div>
                <div className="text-center">Total Goals</div>
                <div className="text-center">Approved Sheets</div>
                <div className="text-center">Submitted Sheets</div>
                <div className="text-right">Avg Performance Score</div>
              </div>

              <div className="font-mono text-[11px] divide-y divide-meridian-ink/5">
                {analytics?.departments.map((dept) => (
                  <div key={dept.department} className="grid grid-cols-6 p-2.5 items-center hover:bg-meridian-ink/[0.02]">
                    <div className="text-meridian-ink font-bold">{dept.department}</div>
                    <div className="text-center font-semibold text-meridian-ink/60">{dept.totalEmployees}</div>
                    <div className="text-center font-semibold text-meridian-ink/60">{dept.totalGoals}</div>
                    <div className="text-center font-bold text-[#4e7a62]">{dept.approvedSheets}</div>
                    <div className="text-center font-bold text-[#4895ef]">{dept.submittedSheets}</div>
                    <div className="text-right">
                      <span className="font-bold text-meridian-gold text-xs">{dept.averageProgressScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Goal checkin state counts */}
          <section className="bg-white/60 border border-meridian-ink/10 rounded-lg p-5">
            <h3 className="font-serif text-xl text-meridian-ink mb-1">Workforce Goal Check-in Diagnostic</h3>
            <p className="font-mono text-[9px] text-meridian-ink/40 uppercase tracking-widest mb-4">
              real-time count of progress status indicators across all active employee goals
            </p>

            <div className="grid grid-cols-3 gap-4 font-mono text-center">
              <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded flex flex-col justify-between items-center">
                <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">COMPLETED</div>
                <div className="text-2xl font-bold mt-2 text-[#4e7a62]">{analytics?.goals.completed}</div>
                <div className="w-12 h-0.5 bg-[#4e7a62] mt-3" />
              </div>
              <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded flex flex-col justify-between items-center">
                <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">ON TRACK</div>
                <div className="text-2xl font-bold mt-2 text-[#4895ef]">{analytics?.goals.onTrack}</div>
                <div className="w-12 h-0.5 bg-[#4895ef] mt-3" />
              </div>
              <div className="p-3 border border-meridian-ink/5 bg-white/40 rounded flex flex-col justify-between items-center">
                <div className="text-[9px] uppercase tracking-wider text-meridian-ink/40">NOT STARTED</div>
                <div className="text-2xl font-bold mt-2 text-meridian-ink/50">{analytics?.goals.notStarted}</div>
                <div className="w-12 h-0.5 bg-meridian-ink/10 mt-3" />
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
