import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Key,
  GitBranch,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { AnalysisResult, ColumnProfile } from '../types/schema';

interface Phase1DiscoveryProps {
  analysis: AnalysisResult;
}

export const Phase1Discovery: React.FC<Phase1DiscoveryProps> = ({
  analysis,
}) => {
  const [anomalyFilter, setAnomalyFilter] = useState<
    'ALL' | '1NF' | '2NF' | '3NF' | 'SECURITY'
  >('ALL');

  const [selectedColumn, setSelectedColumn] =
    useState<ColumnProfile | null>(null);

  const filteredAnomalies = analysis.anomalies.filter((a) => {
    if (anomalyFilter === 'ALL') return true;
    return a.normalizationLevel === anomalyFilter;
  });

  const sensitiveCount = analysis.columnProfiles.filter(
    (c) => c.isPII
  ).length;

  const criticalCount = analysis.anomalies.filter(
    (a) => a.severity === 'CRITICAL'
  ).length;

  const pkCandidates = analysis.columnProfiles.filter(
    (c) => c.isPKCandidate
  );

  return (
    <div className="space-y-6">

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dataset</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="text-xl font-bold font-mono text-white">
            {analysis.totalRows}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            rows • {analysis.totalColumns} columns
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical Issues</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>

          <div className="text-xl font-bold font-mono text-rose-400">
            {criticalCount}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            of {analysis.anomalies.length} detected issues
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Sensitive Fields</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>

          <div className="text-xl font-bold font-mono text-amber-300">
            {sensitiveCount}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            fields requiring protection
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dependencies</span>
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="text-xl font-bold font-mono text-indigo-300">
            {analysis.functionalDependencies.length}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            candidate functional dependencies
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Key Candidates</span>
            <Key className="w-4 h-4 text-yellow-400" />
          </div>

          <div className="text-xl font-bold font-mono text-yellow-300">
            {pkCandidates.length}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            possible primary keys
          </div>
        </div>

      </div>


      {/* DETECTED PROBLEMS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

        <div className="p-4 lg:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Detected Problems
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Data quality and normalization issues found in the uploaded dataset.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['ALL', '1NF', '2NF', '3NF', 'SECURITY'] as const).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setAnomalyFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    anomalyFilter === filter
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              )
            )}
          </div>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs">

            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Columns</th>
                <th className="py-3 px-4">Recommended Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">

              {filteredAnomalies.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-500"
                  >
                    No issues found for this category.
                  </td>
                </tr>
              ) : (
                filteredAnomalies.map((anomaly) => {

                  const isCritical =
                    anomaly.severity === 'CRITICAL';

                  const isHigh =
                    anomaly.severity === 'HIGH';

                  return (
                    <tr
                      key={anomaly.id}
                      className="hover:bg-slate-800/40"
                    >

                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? 'bg-rose-950/90 text-rose-300 border-rose-700/60'
                              : isHigh
                              ? 'bg-amber-950/90 text-amber-300 border-amber-700/60'
                              : 'bg-blue-950/90 text-blue-300 border-blue-700/60'
                          }`}
                        >
                          {anomaly.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {anomaly.normalizationLevel}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {anomaly.title}
                        </div>

                        <div className="text-slate-400 text-[11px] mt-1">
                          {anomaly.description}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {anomaly.impactedColumns.map((col) => (
                            <span
                              key={col}
                              className="font-mono text-[10px] bg-slate-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{anomaly.recommendation}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* DATA PROFILER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

        <div className="p-4 lg:p-5 border-b border-slate-800">

          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            Data Profile
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Automatically inferred data types, uniqueness, keys and sensitive fields.
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs">

            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">

              <tr>
                <th className="py-3 px-4">Column</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4">Unique</th>
                <th className="py-3 px-4">Nulls</th>
                <th className="py-3 px-4">Key</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4">Sample Values</th>
              </tr>

            </thead>


            <tbody className="divide-y divide-slate-800/60">

              {analysis.columnProfiles.map((col) => {

                const uniquePct = Math.round(
                  col.uniquenessRatio * 100
                );

                return (
                  <tr
                    key={col.name}
                    className="hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => setSelectedColumn(col)}
                  >

                    <td className="py-3 px-4">
                      <span className="font-bold text-white">
                        {col.name}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-cyan-300 font-bold bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                        {col.inferredType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {uniquePct}%
                    </td>

                    <td className="py-3 px-4">
                      {col.nullPercentage > 0 ? (
                        <span className="text-amber-400">
                          {col.nullPercentage}%
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          0%
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">

                      {col.isPKCandidate ? (
                        <span className="text-emerald-300 text-[10px]">
                          PK Candidate
                        </span>
                      ) : col.isFKCandidate ? (
                        <span className="text-indigo-300 text-[10px]">
                          FK Candidate
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          —
                        </span>
                      )}

                    </td>

                    <td className="py-3 px-4">

                      {col.isPII ? (
                        <span className="text-amber-300 text-[10px]">
                          {col.piiCategory}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          Normal
                        </span>
                      )}

                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300 text-[10px]">
                      {col.sampleValues
                        .map((v) => String(v))
                        .join(' , ')}
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>


      {/* FUNCTIONAL DEPENDENCIES */}
      {analysis.functionalDependencies.length > 0 && (

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-5">

          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            Detected Functional Dependencies
          </h3>

          <p className="text-xs text-slate-400 mb-4">
            Candidate dependencies identified from the uploaded data.
            These findings help guide normalization and decomposition.
          </p>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {analysis.functionalDependencies.map((fd, idx) => (

              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5"
              >

                <div className="flex items-center gap-2 text-xs font-mono mb-2">

                  <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40">
                    {fd.determinant.join(', ')}
                  </span>

                  <span className="text-slate-500 font-bold">
                    →
                  </span>

                  <span className="text-indigo-300 font-bold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40">
                    {fd.dependent.join(', ')}
                  </span>

                </div>


                <p className="text-xs text-slate-300 leading-relaxed">
                  {fd.explanation}
                </p>


                <div className="mt-3 pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">

                  <span>
                    Confidence: {Math.round(fd.confidence * 100)}%
                  </span>

                  <span className="text-cyan-400">
                    Used for normalization
                  </span>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}


      {/* COLUMN DETAILS */}
      {selectedColumn && (

        <div className="bg-slate-900 border border-cyan-800/40 rounded-2xl p-5">

          <div className="flex items-center justify-between mb-3">

            <h3 className="text-sm font-bold text-white">
              Column Details: {selectedColumn.name}
            </h3>

            <button
              onClick={() => setSelectedColumn(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">

            <div>
              <span className="text-slate-500">Type</span>
              <div className="text-cyan-300 mt-1">
                {selectedColumn.inferredType}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Unique Values</span>
              <div className="text-white mt-1">
                {selectedColumn.uniqueCount}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Null Values</span>
              <div className="text-white mt-1">
                {selectedColumn.nullCount}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Sensitivity</span>
              <div className="text-amber-300 mt-1">
                {selectedColumn.sensitivityLevel}
              </div>
            </div>

          </div>

        </div>

      )}

    </div>
  );
};