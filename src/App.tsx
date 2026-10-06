import React, { useMemo, useState } from 'react';

import { Header } from './components/Header';
import { PhaseNav, ActivePhase } from './components/PhaseNav';
import { DatasetUploader } from './components/DatasetUploader';
import { Phase1Discovery } from './components/Phase1Discovery';
import { Phase2Decomposition } from './components/Phase2Decomposition';
import { Phase3Migration } from './components/Phase3Migration';
import { Phase4Security } from './components/Phase4Security';

import { SAMPLE_DATASETS } from './data/samples';

import {
  analyzeLegacyDataset,
  parseSpreadsheetOrCSV,
} from './utils/analyzer';

import { AnalysisResult } from './types/schema';

export default function App() {
  const [activePhase, setActivePhase] =
    useState<ActivePhase>('discovery');

  // Dataset state
  const [rawDataset, setRawDataset] = useState<{
    name: string;
    headers: string[];
    rows: Record<string, any>[];
  }>(() => {
    const defaultSample = SAMPLE_DATASETS[0];

    const parsed = parseSpreadsheetOrCSV(
      defaultSample.rawCSV
    );

    return {
      name: defaultSample.name,
      headers: parsed.headers,
      rows: parsed.rows,
    };
  });

  // Analyze dataset whenever it changes
  const analysis: AnalysisResult = useMemo(() => {
    return analyzeLegacyDataset(
      rawDataset.name,
      rawDataset.headers,
      rawDataset.rows
    );
  }, [rawDataset]);

  // Handle uploaded dataset
  const handleDatasetLoaded = (
    name: string,
    headers: string[],
    rows: Record<string, any>[]
  ) => {
    setRawDataset({
      name,
      headers,
      rows,
    });

    // Return to Discovery after loading a new dataset
    setActivePhase('discovery');
  };

  // Download SQLite migration pack
  const handleDownloadMigrationPack = () => {
    const scripts = analysis.migrationScripts.sqlite;

    const fullPack = [
      '-- ============================================================',
      '-- SCHEMAGUARDIAN AI',
      '-- SQLITE MIGRATION PACK',
      '-- ============================================================',
      `-- Dataset: ${analysis.datasetName}`,
      `-- Generated: ${new Date().toISOString()}`,
      '-- ============================================================',
      '',
      '-- ============================================================',
      '-- FORWARD MIGRATION',
      '-- ============================================================',
      scripts.forwardSQL,
      '',
      '-- ============================================================',
      '-- ROLLBACK',
      '-- ============================================================',
      scripts.rollbackSQL,
      '',
      '-- ============================================================',
      '-- SECURE VIEWS',
      '-- ============================================================',
      scripts.secureViewsSQL,
      '',
      '-- ============================================================',
      '-- AUDIT TABLE',
      '-- ============================================================',
      scripts.auditTableSQL,
    ].join('\n\n');

    const blob = new Blob(
      [fullPack],
      { type: 'text/sql' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download =
      `SchemaGuardian_${analysis.datasetName}_SQLite.sql`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* Header */}
      <Header
        onDownloadMigrationPack={
          handleDownloadMigrationPack
        }
        totalAnomalies={
          analysis.anomalies.length
        }
      />

      {/* Dataset Uploader */}
      <DatasetUploader
        onDatasetLoaded={handleDatasetLoaded}
        currentDatasetName={
          analysis.datasetName
        }
        totalRows={
          analysis.totalRows
        }
        totalCols={
          analysis.totalColumns
        }
      />

      {/* Phase Navigation */}
      <PhaseNav
        activePhase={activePhase}
        onSelectPhase={setActivePhase}
        anomalyCount={
          analysis.anomalies.length
        }
        tableCount={
          analysis.decomposedTables.length
        }
        complianceGrade={
          analysis.complianceScorecard.after.healthGrade
        }
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-5 flex-1 w-full">

        {activePhase === 'discovery' && (
          <Phase1Discovery
            analysis={analysis}
          />
        )}

        {activePhase === 'decomposition' && (
          <Phase2Decomposition
            analysis={analysis}
          />
        )}

        {activePhase === 'migration' && (
          <Phase3Migration
            analysis={analysis}
          />
        )}

        {activePhase === 'security' && (
          <Phase4Security
            analysis={analysis}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs font-mono text-slate-500">

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">

          <div>
            SchemaGuardian AI • Database Normalization & Security Auditor
          </div>

          <div className="flex items-center gap-3 text-[11px]">

            <span>
              1NF • 2NF • 3NF
            </span>

            <span>•</span>

            <span>
              SQLite Migration
            </span>

            <span>•</span>

            <span className="text-cyan-400">
              Secure Views
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}