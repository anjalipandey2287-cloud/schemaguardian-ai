import React from 'react';
import { Search, Network, Terminal, ShieldAlert, CheckCircle2 } from 'lucide-react';

export type ActivePhase = 'discovery' | 'decomposition' | 'migration' | 'security';

interface PhaseNavProps {
  activePhase: ActivePhase;
  onSelectPhase: (phase: ActivePhase) => void;
  anomalyCount: number;
  tableCount: number;
  complianceGrade: string;
}

export const PhaseNav: React.FC<PhaseNavProps> = ({
  activePhase,
  onSelectPhase,
  anomalyCount,
  tableCount,
  complianceGrade,
}) => {
  const phases = [
    {
      id: 'discovery' as ActivePhase,
      number: '1',
      title: 'Ingestion & Discovery',
      subtitle: 'Anomalies & Functional Deps',
      icon: Search,
      badge: `${anomalyCount} Issues`,
      badgeColor: anomalyCount > 0 ? 'bg-amber-950/80 text-amber-400 border-amber-800/60' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    },
    {
      id: 'decomposition' as ActivePhase,
      number: '2',
      title: 'Refactoring & Decomposition',
      subtitle: '3NF Relational Model & Keys',
      icon: Network,
      badge: `${tableCount} Tables`,
      badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60',
    },
    {
      id: 'migration' as ActivePhase,
      number: '3',
      title: 'Migration Scripts & Safety',
      subtitle: 'Forward/Down SQL & Cursors',
      icon: Terminal,
      badge: 'Throttled & Idempotent',
      badgeColor: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
    },
    {
      id: 'security' as ActivePhase,
      number: '4',
      title: 'Security, Views & Compliance',
      subtitle: 'RBAC Mockups & 3NF Scorecard',
      icon: ShieldAlert,
      badge: `Grade: ${complianceGrade}`,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    },
  ];

  return (
    <nav className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {phases.map((phase) => {
          const isActive = activePhase === phase.id;
          const Icon = phase.icon;
          return (
            <button
              key={phase.id}
              onClick={() => onSelectPhase(phase.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                isActive
                  ? 'bg-gradient-to-b from-slate-900 to-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {phase.number}
                  </div>
                  <div>
                    <h3
                      className={`text-xs font-bold transition-colors ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {phase.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-[170px] xl:max-w-[200px]">
                      {phase.subtitle}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${phase.badgeColor}`}>
                  {phase.badge}
                </span>
                {isActive && (
                  <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Active Phase
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
