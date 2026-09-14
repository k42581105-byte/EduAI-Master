import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCode,
  Copy,
  Info
} from 'lucide-react';
import { HierarchyLevel } from '../../../../types';
import { ContentManagementService } from '../../../../services/contentManagementService';
import { Button } from '../../../common/Button';
import { Badge } from '../../../common/Badge';

interface CmsImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const CmsImportExportModal: React.FC<CmsImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'templates'>('export');
  const [exportLevel, setExportLevel] = useState<HierarchyLevel>('book');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadExport = () => {
    let content = '';
    let mimeType = 'application/json';
    let fileExt = 'json';

    if (exportFormat === 'json') {
      content = ContentManagementService.exportAsJson(exportLevel);
      mimeType = 'application/json';
      fileExt = 'json';
    } else {
      content = ContentManagementService.exportAsCsv(exportLevel);
      mimeType = 'text/csv';
      fileExt = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduai-${exportLevel}-${new Date().toISOString().slice(0, 10)}.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportErrors([]);
    setImportFeedback(null);

    if (!importJsonText.trim()) {
      setImportErrors(['Please provide valid JSON content to import.']);
      return;
    }

    const res = ContentManagementService.importContent(importJsonText, importMode);
    if (!res.success) {
      setImportErrors(res.errors || ['Import failed due to schema mismatch.']);
    } else {
      setImportFeedback(`Successfully imported and committed ${res.importedCount} records into the dynamic curriculum database!`);
      setImportJsonText('');
      onImportSuccess(res.importedCount);
    }
  };

  const handleCopyTemplate = (level: HierarchyLevel) => {
    const tmpl = ContentManagementService.getSampleImportTemplate(level);
    navigator.clipboard.writeText(tmpl);
    setCopiedTemplate(level);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Curriculum Import & Export Center
              </h3>
              <p className="text-xs text-slate-500">
                Authorized schema interchange, NCERT OER snapshots & data portability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-800/20">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Curriculum
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import / Ingest JSON
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'templates'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Sample Templates
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Legal Fair-Use Compliance Note */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300">
                Legal & Open Curriculum Compliance Notice
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5 leading-relaxed">
                All exports & imports conform with the National Curriculum Framework (NCF) Open Educational Resource standards under CC-BY-NC 4.0. Copyrighted private textbooks remain strictly protected.
              </p>
            </div>
          </div>

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Select Hierarchy Level to Export:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['book', 'question', 'subject', 'session', 'board', 'quiz', 'exam'] as HierarchyLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExportLevel(lvl)}
                      className={`p-2.5 rounded-xl border text-center font-bold capitalize transition-all ${
                        exportLevel === lvl
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lvl}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Export Format:</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`flex-1 p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      exportFormat === 'json'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileJson className="w-4 h-4" /> JSON (Structured Data)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`flex-1 p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      exportFormat === 'csv'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" /> CSV (Spreadsheet Table)
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <Button variant="primary" className="w-full justify-center" onClick={handleDownloadExport}>
                  <Download className="w-4 h-4 mr-1.5" /> Download Export ({exportFormat.toUpperCase()})
                </Button>
              </div>
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === 'import' && (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              {importFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importFeedback}</span>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Import Validation Errors:</span>
                  </div>
                  <ul className="list-disc ml-5 text-[11px] space-y-0.5">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Paste JSON Content:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Mode:</span>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as any)}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                    >
                      <option value="merge">Merge & Preserve Existing</option>
                      <option value="overwrite">Overwrite Collection</option>
                    </select>
                  </div>
                </div>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste JSON array of Books, Questions, or full ContentExportData..."
                  rows={8}
                  className="w-full font-mono text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full justify-center">
                <Upload className="w-4 h-4 mr-1.5" /> Validate & Ingest Content
              </Button>
            </form>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <p className="text-slate-500">
                Copy ready-to-use template schemas for batch curriculum entry and automated question ingestion.
              </p>

              {(['book', 'question', 'session'] as HierarchyLevel[]).map((lvl) => (
                <div key={lvl} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white capitalize">{lvl} Schema Template</h5>
                    <p className="text-[11px] text-slate-500">Standardized JSON structure with required fields.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyTemplate(lvl)}
                    className="text-xs"
                  >
                    {copiedTemplate === lvl ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> Copy JSON
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
