export default function Dashboard() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-meridian-ink/10 pb-6">
        <div>
          <h2 className="text-4xl font-serif">The Goal Field</h2>
          <p className="font-mono text-sm mt-2 opacity-70 uppercase tracking-widest">FY 2025-26 • Q2 Active</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono uppercase tracking-widest opacity-70 mb-1">Total Progress</div>
          <div className="text-4xl font-mono font-semibold text-meridian-gold">64%</div>
        </div>
      </header>
      
      <div className="flex gap-8 h-[500px] items-center justify-center border border-dashed border-meridian-ink/20 relative group">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
           {/* Decorative concentric rings mimicking topo map */}
           <div className="w-[300px] h-[300px] border border-meridian-ink rounded-full absolute"></div>
           <div className="w-[400px] h-[400px] border border-meridian-ink rounded-full absolute"></div>
           <div className="w-[500px] h-[500px] border border-meridian-ink rounded-full absolute"></div>
        </div>
        <p className="font-mono opacity-50 uppercase tracking-widest relative z-10">Topographical goal field will render here</p>
      </div>

      <div className="mt-8 bg-white/50 p-6 shadow-sm border border-meridian-ink/5 relative overflow-hidden">
        {/* Placeholder for the weightage builder */}
        <h3 className="font-serif text-2xl mb-4">Weightage Allocation</h3>
        <div className="h-4 w-full bg-black/5 flex rounded-full overflow-hidden">
          <div className="h-full bg-[#6b8e23]" style={{ width: '30%' }}></div>
          <div className="h-full bg-[#708090]" style={{ width: '40%' }}></div>
          <div className="h-full bg-[#ffbf00]" style={{ width: '20%' }}></div>
          <div className="h-full bg-meridian-gold" style={{ width: '10%' }}></div>
        </div>
        <div className="flex justify-between mt-2 font-mono text-xs opacity-70 uppercase">
          <span>Current: 100%</span>
          <span>Valid</span>
        </div>
      </div>
    </div>
  );
}
