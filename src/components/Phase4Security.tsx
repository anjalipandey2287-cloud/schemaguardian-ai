import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  UserCheck,
  Copy,
  Check,
  Database,
  Lock,
} from 'lucide-react';
import { AnalysisResult, UserRole } from '../types/schema';

interface Phase4SecurityProps {
  analysis: AnalysisResult;
}

export const Phase4Security: React.FC<Phase4SecurityProps> = ({
  analysis,
}) => {
  const [activeRole, setActiveRole] =
    useState<UserRole>('SUPPORT_AGENT');

  const [selectedTableIndex, setSelectedTableIndex] =
    useState<number>(0);

  const [copiedViewSQL, setCopiedViewSQL] =
    useState(false);

  const targetTable =
    analysis.decomposedTables[selectedTableIndex] ||
    analysis.decomposedTables[0];

  const roles: {
    role: UserRole;
    title: string;
    desc: string;
    badge: string;
  }[] = [
    {
      role: 'ADMIN',
      title: 'Database Administrator',
      desc: 'Full access to database records, including sensitive fields.',
      badge: 'Full Access',
    },
    {
      role: 'SUPPORT_AGENT',
      title: 'Support Agent',
      desc: 'Sensitive fields are partially masked when displayed.',
      badge: 'Partial Masking',
    },
    {
      role: 'DATA_ANALYST',
      title: 'Data Analyst',
      desc: 'Sensitive fields are pseudonymized for analysis.',
      badge: 'Pseudonymized',
    },
  ];

  const getMaskedValue = (
    value: any,
    isPII: boolean
  ) => {
    if (!isPII || activeRole === 'ADMIN') {
      return value;
    }

    if (value === null || value === undefined) {
      return '-';
    }

    const text = String(value);

    if (activeRole === 'SUPPORT_AGENT') {
      if (text.includes('@')) {
        const [name, domain] = text.split('@');

        return `${name?.charAt(0) || '*'}***@${domain}`;
      }

      if (text.length > 4) {
        return `${text.slice(0, 2)}${'*'.repeat(
          Math.min(text.length - 2, 6)
        )}`;
      }

      return '***';
    }

    // DATA_ANALYST
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    return `PSEUDO_${Math.abs(hash).toString(16)}`;
  };

  const maskedSampleRecords =
    targetTable?.sampleRecords.map((row) => {
      const masked: Record<string, any> = {};

      targetTable.columns.forEach((column) => {
        masked[column.name] = getMaskedValue(
          row[column.name],
          column.isPII
        );
      });

      return masked;
    }) || [];

  const getViewSQL = () => {
    if (!targetTable) {
      return '-- No normalized table available.';
    }

    const viewName =
      `v_${activeRole.toLowerCase()}_${targetTable.tableName}`;

    const columns = targetTable.columns
      .map((column) => {
        if (!column.isPII) {
          return `    ${column.name}`;
        }

        if (activeRole === 'ADMIN') {
          return `    ${column.name}`;
        }

        if (activeRole === 'SUPPORT_AGENT') {
          return `    '[MASKED]' AS ${column.name}`;
        }

        return `    'PSEUDONYMIZED' AS ${column.name}`;
      })
      .join(',\n');

    return `CREATE VIEW ${viewName} AS
SELECT
${columns}
FROM ${targetTable.tableName};`;
  };

  const handleCopyViewSQL = async () => {
    try {
      await navigator.clipboard.writeText(getViewSQL());

      setCopiedViewSQL(true);

      setTimeout(() => {
        setCopiedViewSQL(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy SQL:', error);
    }
  };

  if (!targetTable) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
        <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-3" />

        <p className="text-sm text-slate-300">
          No normalized tables are available for security analysis.
        </p>
      </div>
    );
  }

  const sensitiveFields = analysis.columnProfiles.filter(
    (column) => column.isPII
  );

  const sensitiveCount = sensitiveFields.length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <ShieldAlert className="w-4 h-4" />
              </span>

              <h2 className="text-base font-bold text-white">
                Phase 4: Database Security & Views
              </h2>

            </div>

            <p className="text-xs text-slate-400 mt-2">
              Identify sensitive fields and control how different
              database roles can access them through secure views.
            </p>

          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">

            <ShieldCheck className="w-4 h-4 text-emerald-400" />

            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500">
                Security Status
              </div>

              <div className="text-xs font-mono font-bold text-emerald-400">
                ACCESS CONTROLS ACTIVE
              </div>
            </div>

          </div>

        </div>

      </div>


      {/* SECURITY OVERVIEW */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* SENSITIVE FIELDS */}

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2">

            <ShieldAlert className="w-4 h-4 text-amber-400" />

            <span className="text-xs font-bold text-white">
              Sensitive Fields Detected
            </span>

          </div>

          <div className="text-2xl font-bold font-mono text-amber-300 mt-3">
            {sensitiveCount}
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Fields requiring controlled access or masking.
          </p>

        </div>


        {/* NORMALIZED STRUCTURE */}

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2">

            <Database className="w-4 h-4 text-cyan-400" />

            <span className="text-xs font-bold text-white">
              Protected Tables
            </span>

          </div>

          <div className="text-2xl font-bold font-mono text-cyan-300 mt-3">
            {analysis.decomposedTables.length}
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Normalized tables available for controlled access.
          </p>

        </div>


        {/* ACCESS CONTROL */}

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">

          <div className="flex items-center gap-2">

            <Lock className="w-4 h-4 text-emerald-400" />

            <span className="text-xs font-bold text-white">
              Access Control
            </span>

          </div>

          <div className="text-2xl font-bold font-mono text-emerald-300 mt-3">
            3 Roles
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Different views for different database users.
          </p>

        </div>

      </div>


      {/* BEFORE → AFTER */}

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

        <div className="flex items-center gap-2 mb-4">

          <ShieldCheck className="w-4 h-4 text-emerald-400" />

          <h3 className="text-sm font-bold text-white">
            Before → After Security Status
          </h3>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* BEFORE */}

          <div className="bg-slate-950 border border-rose-800/50 rounded-xl p-4">

            <div className="text-[10px] uppercase tracking-wider text-rose-400 font-mono font-bold">
              BEFORE
            </div>

            <div className="text-sm font-semibold text-white mt-2">
              Direct dataset access
            </div>

            <ul className="mt-3 space-y-2 text-xs text-slate-400">

              <li>
                • Sensitive fields stored alongside normal data
              </li>

              <li>
                • No role-specific masking
              </li>

              <li>
                • Same data representation for different users
              </li>

            </ul>

          </div>


          {/* AFTER */}

          <div className="bg-slate-950 border border-emerald-800/50 rounded-xl p-4">

            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-bold">
              AFTER
            </div>

            <div className="text-sm font-semibold text-white mt-2">
              Controlled view-based access
            </div>

            <ul className="mt-3 space-y-2 text-xs text-slate-400">

              <li>
                • Sensitive fields identified
              </li>

              <li>
                • Role-specific masking or pseudonymization
              </li>

              <li>
                • SQL Views expose only the required representation
              </li>

            </ul>

          </div>

        </div>

      </div>


      {/* ROLE BASED ACCESS */}

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">

          <div>

            <h3 className="text-sm font-bold text-white flex items-center gap-2">

              <Eye className="w-4 h-4 text-cyan-400" />

              Role-Based Access

            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Select a role to see how sensitive fields are presented.
            </p>

          </div>


          {/* TABLE SELECT */}

          <div className="flex items-center gap-2 text-xs font-mono">

            <span className="text-slate-400">
              Table:
            </span>

            <select
              value={selectedTableIndex}
              onChange={(e) =>
                setSelectedTableIndex(Number(e.target.value))
              }
              className="bg-slate-950 text-cyan-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
            >

              {analysis.decomposedTables.map((table, index) => (

                <option
                  key={table.tableName}
                  value={index}
                >
                  {table.tableName}
                </option>

              ))}

            </select>

          </div>

        </div>


        {/* ROLE CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">

          {roles.map((role) => {

            const selected =
              activeRole === role.role;

            return (
              <button
                key={role.role}
                onClick={() => setActiveRole(role.role)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  selected
                    ? 'bg-slate-800 border-cyan-500/60 ring-1 ring-cyan-500/20'
                    : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                }`}
              >

                <div className="flex items-center justify-between">

                  <span className="text-xs font-bold font-mono text-white">
                    {role.role}
                  </span>

                  {selected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}

                </div>

                <div className="text-[11px] text-cyan-300 font-mono mt-2">
                  {role.badge}
                </div>

                <div className="text-xs text-slate-300 mt-2">
                  {role.title}
                </div>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {role.desc}
                </p>

              </button>
            );
          })}

        </div>


        {/* ACCESS TABLE */}

        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">

          <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">

            <span className="text-xs text-slate-300 flex items-center gap-1.5">

              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />

              View Output:

              <span className="text-cyan-300 font-bold font-mono">
                v_{activeRole.toLowerCase()}_{targetTable.tableName}
              </span>

            </span>

            <span className="text-[10px] text-slate-500 font-mono">
              {activeRole}
            </span>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">

                <tr>

                  {targetTable.columns.map((column) => (

                    <th
                      key={column.name}
                      className="py-3 px-3.5 font-semibold font-mono"
                    >

                      <div className="flex items-center gap-1.5">

                        {column.name}

                        {column.isPII && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            SENSITIVE
                          </span>
                        )}

                      </div>

                    </th>

                  ))}

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">

                {maskedSampleRecords
                  .slice(0, 5)
                  .map((row, index) => (

                    <tr
                      key={index}
                      className="hover:bg-slate-800/30"
                    >

                      {targetTable.columns.map((column) => {

                        const isMasked =
                          column.isPII &&
                          activeRole !== 'ADMIN';

                        return (
                          <td
                            key={column.name}
                            className={`py-2.5 px-3.5 whitespace-nowrap ${
                              isMasked
                                ? 'text-amber-300'
                                : 'text-slate-200'
                            }`}
                          >
                            {row[column.name] !== undefined
                              ? String(row[column.name])
                              : '-'}
                          </td>
                        );
                      })}

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* SQL VIEW */}

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

            <div>

              <h3 className="text-sm font-bold text-white flex items-center gap-2">

                <Database className="w-4 h-4 text-purple-400" />

                SQL View Output

              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Example SQL View generated for the selected role.
              </p>

            </div>


            <button
              onClick={handleCopyViewSQL}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 cursor-pointer"
            >

              {copiedViewSQL ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}

              {copiedViewSQL ? 'Copied' : 'Copy View SQL'}

            </button>

          </div>

        </div>


        <div className="p-5 bg-slate-950">

          <pre className="whitespace-pre-wrap text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">
            {getViewSQL()}
          </pre>

        </div>

      </div>

    </div>
  );
};