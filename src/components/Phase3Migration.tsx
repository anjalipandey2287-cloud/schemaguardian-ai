import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Download,
  RotateCcw,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { AnalysisResult } from '../types/schema';

interface Phase3MigrationProps {
  analysis: AnalysisResult;
}

export const Phase3Migration: React.FC<Phase3MigrationProps> = ({
  analysis,
}) => {
  const [activeScriptTab, setActiveScriptTab] = useState<
    'forward' | 'rollback' | 'audit'
  >('forward');

  const [copied, setCopied] = useState(false);

  const scripts = analysis.migrationScripts.sqlite;

  const getActiveCode = () => {
    switch (activeScriptTab) {
      case 'forward':
        return scripts.forwardSQL;

      case 'rollback':
        return scripts.rollbackSQL;

      case 'audit':
        return scripts.auditTableSQL;

      default:
        return scripts.forwardSQL;
    }
  };

  const getFileName = () => {
    switch (activeScriptTab) {
      case 'forward':
        return 'schemaguardian_forward_migration.sql';

      case 'rollback':
        return 'schemaguardian_rollback.sql';

      case 'audit':
        return 'schemaguardian_audit.sql';

      default:
        return 'schemaguardian_migration.sql';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getActiveCode());

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy SQL:', error);
    }
  };

  const handleDownload = () => {
    const code = getActiveCode();

    const blob = new Blob([code], {
      type: 'text/sql',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = getFileName();

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <span className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/40">
                <Terminal className="w-4 h-4" />
              </span>

              <h2 className="text-base font-bold text-white">
                Phase 3: Migration
              </h2>

            </div>

            <p className="text-xs text-slate-400 mt-2">
              Generate SQL scripts to create the normalized database,
              reverse the migration, and maintain an audit table.
            </p>

          </div>


          {/* DATABASE TARGET */}

          <div className="flex items-center gap-2">

            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Database
            </span>

            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-mono font-bold">
              SQLite
            </span>

          </div>

        </div>

      </div>


      {/* SCRIPT CONSOLE */}

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

        {/* TAB BAR */}

        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-mono">

            {/* FORWARD */}

            <button
              onClick={() => setActiveScriptTab('forward')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeScriptTab === 'forward'
                  ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >

              <FileCode className="w-3.5 h-3.5" />

              Forward Migration

            </button>


            {/* ROLLBACK */}

            <button
              onClick={() => setActiveScriptTab('rollback')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeScriptTab === 'rollback'
                  ? 'bg-slate-800 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >

              <RotateCcw className="w-3.5 h-3.5" />

              Rollback

            </button>


            {/* AUDIT */}

            <button
              onClick={() => setActiveScriptTab('audit')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeScriptTab === 'audit'
                  ? 'bg-slate-800 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >

              <ShieldCheck className="w-3.5 h-3.5" />

              Audit

            </button>

          </div>


          {/* ACTIONS */}

          <div className="flex items-center gap-2">

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors cursor-pointer"
            >

              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}

              {copied ? 'Copied' : 'Copy SQL'}

            </button>


            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-medium border border-cyan-500/40 transition-colors cursor-pointer"
            >

              <Download className="w-3.5 h-3.5" />

              Download .SQL

            </button>

          </div>

        </div>


        {/* CODE AREA */}

        <div className="p-4 lg:p-5 max-h-[520px] overflow-y-auto bg-slate-950">

          <div className="flex items-center justify-between mb-3">

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-emerald-400" />

              <span className="text-[10px] text-slate-500 font-mono uppercase">
                Generated SQLite SQL
              </span>

            </div>

            <span className="text-[10px] text-slate-600 font-mono">
              {getFileName()}
            </span>

          </div>


          <pre className="whitespace-pre-wrap text-xs text-slate-300 font-mono leading-relaxed selection:bg-cyan-500/30">
            {getActiveCode()}
          </pre>

        </div>

      </div>


      {/* MIGRATION SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* FORWARD */}

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2 mb-2">

            <FileCode className="w-4 h-4 text-emerald-400" />

            <h3 className="text-xs font-bold text-white">
              Forward Migration
            </h3>

          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Creates the normalized tables, keys, relationships and
            required database structures.
          </p>

        </div>


        {/* ROLLBACK */}

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2 mb-2">

            <RotateCcw className="w-4 h-4 text-rose-400" />

            <h3 className="text-xs font-bold text-white">
              Rollback
            </h3>

          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Provides SQL commands for reversing the generated database
            structure when required.
          </p>

        </div>


        {/* AUDIT */}

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2 mb-2">

            <ShieldCheck className="w-4 h-4 text-purple-400" />

            <h3 className="text-xs font-bold text-white">
              Migration Audit
            </h3>

          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Creates an audit structure for recording migration-related
            database activity.
          </p>

        </div>

      </div>


      {/* DATASET INFO */}

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

          <div>

            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              Migration Source
            </div>

            <div className="text-sm text-white font-mono mt-1">
              {analysis.datasetName}
            </div>

          </div>


          <div className="flex items-center gap-4 text-[11px] font-mono">

            <div>
              <span className="text-slate-500">
                Tables:
              </span>{' '}
              <span className="text-cyan-300">
                {analysis.decomposedTables.length}
              </span>
            </div>

            <div>
              <span className="text-slate-500">
                Rows:
              </span>{' '}
              <span className="text-cyan-300">
                {analysis.totalRows}
              </span>
            </div>

            <div>
              <span className="text-slate-500">
                Columns:
              </span>{' '}
              <span className="text-cyan-300">
                {analysis.totalColumns}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};