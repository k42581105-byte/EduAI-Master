import React, { useState } from 'react';
import { Database, Download, FileSpreadsheet, RefreshCw, X, Shield, Info, Check, HardDrive } from 'lucide-react';
import { PrivacyService, StoredDataInventory } from '../../services/privacyService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface DataInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataInventoryModal: React.FC<DataInventoryModalProps> = ({ isOpen, onClose }) => {
  const [inventory, setInventory] = useState<StoredDataInventory>(() => PrivacyService.calculateStoredDataInventory());
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setInventory(PrivacyService.calculateStoredDataInventory());
  };

  const handleDownloadJSON = () => {
    try {
      const dataStr = PrivacyService.exportAllUserDataJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduai_student_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMessage('JSON data export completed successfully.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (e: any) {
      setExportMessage(`Export failed: ${e.message}`);
    }
  };

  const handleDownloadCSV = () => {
    try {
      const csvStr = PrivacyService.exportUserDataCSV();
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduai_student_summary_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMessage('CSV tabular summary exported successfully.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (e: any) {
      setExportMessage(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Stored Data & Privacy Transparency
                <Badge variant="primary" size="sm">
                  {inventory.totalSizeFormatted}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent breakdown of all personal data, learning records, and study items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {exportMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportMessage}</span>
            </div>
          )}

          {/* Overall Footprint Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Stored Records</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{inventory.totalItems} items</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Storage Footprint</p>
              <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{inventory.totalSizeFormatted}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Data Minimization</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Zero Trackers / No Ads
              </p>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Detailed Category Breakdown
              </h4>
              <button
                onClick={handleRefresh}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Breakdown
              </button>
            </div>

            <div className="space-y-2">
              {inventory.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{cat.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                        {cat.itemCount} {cat.itemCount === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {(cat.estimatedSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong>Your Data Rights:</strong> Under GDPR, FERPA, and COPPA, you have full ownership over your educational profile. You can download an offline archive or request irreversible deletion at any time.
            </p>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Calculated at {inventory.lastCalculated}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs"
              onClick={handleDownloadCSV}
              icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            >
              Export CSV Summary
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs"
              onClick={handleDownloadJSON}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Download Full JSON Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
