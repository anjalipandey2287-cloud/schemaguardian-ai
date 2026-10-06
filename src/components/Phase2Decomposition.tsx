import React, { useState } from 'react';
import {
  Network,
  Table as TableIcon,
  Key,
  ArrowRight,
  Database,
  GitCommit,
} from 'lucide-react';
import { AnalysisResult } from '../types/schema';

interface Phase2DecompositionProps {
  analysis: AnalysisResult;
}

export const Phase2Decomposition: React.FC<Phase2DecompositionProps> = ({
  analysis,
}) => {
  const [selectedTableName, setSelectedTableName] = useState('');
  const [activeTab, setActiveTab] = useState<
    'tables' | 'lineage' | 'mappings'
  >('tables');

  const selectedTable =
    analysis.decomposedTables.find(
      (t) => t.tableName === selectedTableName
    ) || analysis.decomposedTables[0];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/40">
            <Network className="w-4 h-4" />
          </span>

          <h2 className="text-base font-bold text-white">
            Phase 2: Database Decomposition
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Decompose the original dataset into smaller normalized tables
          using functional dependencies and key relationships.
        </p>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono mt-5 w-fit">

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Normalized Tables
          </button>

          <button
            onClick={() => setActiveTab('lineage')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'lineage'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Structure
          </button>

          <button
            onClick={() => setActiveTab('mappings')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mappings'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            Column Mapping
          </button>

        </div>
      </div>


      {/* NORMALIZED TABLES */}
      {activeTab === 'tables' && (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* TABLE LIST */}
          <div className="lg:col-span-4 space-y-3">

            <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold px-1">
              Normalized Tables
            </h3>

            {analysis.decomposedTables.map((table) => {

              const isSelected =
                selectedTable?.tableName === table.tableName;

              const fkCount = table.columns.filter(
                (c) => c.isForeignKey
              ).length;

              return (
                <button
                  key={table.tableName}
                  onClick={() =>
                    setSelectedTableName(table.tableName)
                  }
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/60'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <span className="font-mono font-bold text-xs text-white">
                      {table.tableName}
                    </span>

                    <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {table.entityType}
                    </span>

                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    {table.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[10px] font-mono">

                    <span className="text-yellow-400 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      PK: {table.primaryKey.join(', ')}
                    </span>

                    {fkCount > 0 && (
                      <span className="text-indigo-400">
                        {fkCount} FK
                      </span>
                    )}

                  </div>

                </button>
              );
            })}

          </div>


          {/* TABLE DETAILS */}
          <div className="lg:col-span-8">

            {selectedTable ? (

              <div className="space-y-4">

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">

                  <div className="p-5 border-b border-slate-800">

                    <div className="flex items-center gap-2">

                      <h3 className="text-base font-mono font-bold text-white">
                        {selectedTable.tableName}
                      </h3>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {selectedTable.entityType}
                      </span>

                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {selectedTable.description}
                    </p>

                  </div>


                  {/* COLUMNS */}
                  <div className="overflow-x-auto">

                    <table className="w-full text-left text-xs">

                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">

                        <tr>
                          <th className="py-3 px-4">Column</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Key</th>
                          <th className="py-3 px-4">Source</th>
                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-800/60">

                        {selectedTable.columns.map((col) => (

                          <tr
                            key={col.name}
                            className="hover:bg-slate-800/30"
                          >

                            <td className="py-3 px-4">

                              <span className="font-bold text-white">
                                {col.name}
                              </span>

                              {!col.nullable && (
                                <span className="ml-2 text-[9px] text-slate-500">
                                  NOT NULL
                                </span>
                              )}

                            </td>

                            <td className="py-3 px-4">

                              <span className="text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                                {col.dataType}
                              </span>

                            </td>

                            <td className="py-3 px-4">

                              {col.isPrimaryKey ? (

                                <span className="text-yellow-300 text-[10px] flex items-center gap-1">
                                  <Key className="w-3 h-3" />
                                  PRIMARY KEY
                                </span>

                              ) : col.isForeignKey && col.references ? (

                                <span className="text-indigo-300 text-[10px] flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3" />
                                  FK → {col.references.table}
                                  ({col.references.column})
                                </span>

                              ) : (

                                <span className="text-slate-500 text-[10px]">
                                  —
                                </span>

                              )}

                            </td>

                            <td className="py-3 px-4 text-slate-400">

                              {col.originalColumn || 'Generated key'}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                </div>


                {/* SAMPLE RECORDS */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2 mb-3">

                    <Database className="w-3.5 h-3.5 text-cyan-400" />

                    Sample Normalized Records

                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">

                    <table className="w-full text-left text-xs">

                      <thead className="bg-slate-950 text-slate-400">

                        <tr>

                          {selectedTable.columns.map((col) => (
                            <th
                              key={col.name}
                              className="py-2 px-3"
                            >
                              {col.name}
                            </th>
                          ))}

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-800">

                        {selectedTable.sampleRecords
                          .slice(0, 5)
                          .map((row, index) => (

                            <tr key={index}>

                              {selectedTable.columns.map((col) => (

                                <td
                                  key={col.name}
                                  className="py-2.5 px-3 text-slate-300 whitespace-nowrap"
                                >
                                  {row[col.name] !== undefined
                                    ? String(row[col.name])
                                    : '-'}
                                </td>

                              ))}

                            </tr>

                          ))}

                      </tbody>

                    </table>

                  </div>

                </div>

              </div>

            ) : (

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                No normalized tables available.
              </div>

            )}

          </div>

        </div>
      )}


      {/* STRUCTURE */}
      {activeTab === 'lineage' && (

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">

          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            Before → After Structure
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            The original dataset is decomposed into related tables to
            reduce redundancy and improve data organization.
          </p>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-8">

            {/* ORIGINAL */}
            <div className="bg-slate-950 border border-rose-800/60 rounded-xl p-5 text-center">

              <div className="text-[10px] text-rose-400 font-mono font-bold mb-2">
                ORIGINAL DATASET
              </div>

              <div className="text-sm font-mono text-white">
                {analysis.datasetName}
              </div>

              <div className="text-xs text-slate-500 mt-2">
                {analysis.totalColumns} columns
              </div>

            </div>


            {/* ARROW */}
            <div className="flex justify-center">

              <div className="flex flex-col items-center gap-2">

                <ArrowRight className="w-6 h-6 text-cyan-400" />

                <span className="text-[10px] text-cyan-300 font-mono">
                  DECOMPOSE
                </span>

              </div>

            </div>


            {/* NORMALIZED */}
            <div className="bg-slate-950 border border-emerald-800/60 rounded-xl p-5">

              <div className="text-[10px] text-emerald-400 font-mono font-bold mb-3 text-center">
                NORMALIZED TABLES
              </div>

              <div className="space-y-2">

                {analysis.decomposedTables.map((table) => (

                  <div
                    key={table.tableName}
                    className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2"
                  >

                    <span className="text-xs text-cyan-300 font-mono">
                      {table.tableName}
                    </span>

                    <span className="text-[10px] text-yellow-400">
                      PK: {table.primaryKey.join(', ')}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>
      )}


      {/* COLUMN MAPPING */}
      {activeTab === 'mappings' && (

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">

          <div className="p-5 border-b border-slate-800">

            <h3 className="text-sm font-bold text-white flex items-center gap-2">

              <GitCommit className="w-4 h-4 text-cyan-400" />

              Column Mapping

            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Shows how columns from the original dataset are mapped
              into the normalized tables.
            </p>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">

                <tr>

                  <th className="py-3 px-4">
                    Original Column
                  </th>

                  <th className="py-3 px-4">
                    Transformation
                  </th>

                  <th className="py-3 px-4">
                    Target Table
                  </th>

                  <th className="py-3 px-4">
                    Target Column
                  </th>

                  <th className="py-3 px-4">
                    Reason
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-800/60">

                {analysis.semanticMappings.map((mapping, index) => (

                  <tr
                    key={index}
                    className="hover:bg-slate-800/30"
                  >

                    <td className="py-3 px-4 text-rose-300 font-mono">
                      {mapping.originalName}
                    </td>

                    <td className="py-3 px-4">

                      <span className="text-cyan-300 text-[10px] bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
                        {mapping.transformationType}
                      </span>

                    </td>

                    <td className="py-3 px-4 text-white font-mono">
                      {mapping.normalizedTable}
                    </td>

                    <td className="py-3 px-4 text-emerald-400 font-mono">
                      {mapping.normalizedColumn}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {mapping.rationale}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
};