import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Check, ArrowRight, Play, Database, Sparkles, RefreshCw } from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset } from '../data/samples';
import { parseSpreadsheetOrCSV } from '../utils/analyzer';

interface DatasetUploaderProps {
  onDatasetLoaded: (name: string, headers: string[], rows: Record<string, any>[]) => void;
  currentDatasetName: string;
  totalRows: number;
  totalCols: number;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({
  onDatasetLoaded,
  currentDatasetName,
  totalRows,
  totalCols,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('ecommerce_monolith');
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'paste'>('presets');
  const [pastedContent, setPastedContent] = useState<string>('');
  const [customName, setCustomName] = useState<string>('Custom Ingested Schema');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (sample: SampleDataset) => {
    setSelectedSampleId(sample.id);
    setIsProcessing(true);
    setTimeout(() => {
      const parsed = parseSpreadsheetOrCSV(sample.rawCSV);
      onDatasetLoaded(sample.name, parsed.headers, parsed.rows);
      setIsProcessing(false);
    }, 150);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const fileName = file.name;

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const parsed = parseSpreadsheetOrCSV(buffer);
          onDatasetLoaded(fileName, parsed.headers, parsed.rows);
        } catch (err) {
          console.error('Error reading excel file:', err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const parsed = parseSpreadsheetOrCSV(text);
          onDatasetLoaded(fileName, parsed.headers, parsed.rows);
        } catch (err) {
          console.error('Error reading text/csv file:', err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedContent.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = parseSpreadsheetOrCSV(pastedContent);
      onDatasetLoaded(customName || 'Pasted Dataset', parsed.headers, parsed.rows);
    } catch (err) {
      console.error('Error parsing pasted data:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-xl shadow-black/40">
        {/* Top bar with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              <Database className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Ingestion Source & Dataset Profiler
                <span className="text-xs font-normal text-slate-400 font-mono">
                  [{currentDatasetName} &bull; {totalCols} cols, {totalRows} records]
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'presets' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enterprise Presets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'upload' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload CSV / .xlsx
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'paste' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Raw Data
            </button>
          </div>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="pt-3">
            <p className="text-xs text-slate-400 mb-3">
              Select an unnormalized enterprise legacy file to trigger autonomous discovery, 3NF decomposition, and security masking:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_DATASETS.map((sample) => {
                const isSelected = selectedSampleId === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectPreset(sample)}
                    disabled={isProcessing}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {sample.tag}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-semibold">
                          <Check className="w-3 h-3 text-cyan-400" /> Ingested
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {sample.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Upload */}
        {activeTab === 'upload' && (
          <div className="pt-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center bg-slate-950/40 hover:bg-slate-950/80 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-950/70 border border-cyan-800/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Drag & Drop or Click to Ingest Legacy File
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Supports Comma-Separated (.csv), Tab-Separated (.tsv), or Microsoft Excel (.xlsx, .xls)
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-cyan-400">
                <span>Direct in-memory stream parser</span> &bull; <span>Auto-constraint inference</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Paste */}
        {activeTab === 'paste' && (
          <div className="pt-3 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Dataset Name (e.g. legacy_users_export)"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-full sm:w-72"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={!pastedContent.trim() || isProcessing}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" /> Ingest & Decompose
              </button>
            </div>
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste raw CSV text with headers on the first line...&#10;e.g.&#10;cust_id,cust_name,email,street,city,zip,order_id,amount"
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
};
