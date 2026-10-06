import React from 'react';
import {
  Shield,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  onDownloadMigrationPack: () => void;
  totalAnomalies: number;
}

export const Header: React.FC<HeaderProps> = ({
  onDownloadMigrationPack,
  totalAnomalies,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Logo / Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">

          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Shield className="w-5 h-5 text-white" />

              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                  SchemaGuardian
                  <span className="text-cyan-400 font-sans">
                    AI
                  </span>
                </h1>

                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Database Auditor
                </span>
              </div>

              <p className="text-xs text-slate-400 hidden sm:block">
                Database Normalization &bull; Migration &bull; Security Audit
              </p>
            </div>
          </div>

          {/* Mobile anomaly indicator */}
          <div className="flex md:hidden items-center gap-2 text-xs">
            {totalAnomalies > 0 ? (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                <AlertTriangle className="w-3.5 h-3.5" />
                {totalAnomalies}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Clean
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">

          <div className="flex items-center bg-slate-900/90 rounded-lg px-3 py-1.5 border border-slate-800 text-xs">
            <Database className="w-3 h-3 text-cyan-400 mr-2" />
            <span className="text-slate-300 font-medium">
              SQLite
            </span>
          </div>

          <button
            onClick={onDownloadMigrationPack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />

            <span className="hidden sm:inline">
              Export Migration Pack
            </span>

            <span className="sm:hidden">
              Export
            </span>
          </button>

        </div>
      </div>
    </header>
  );
};