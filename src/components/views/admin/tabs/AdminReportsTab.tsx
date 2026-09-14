import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Printer,
  TrendingUp,
  BarChart3,
  Bot,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { AdminSystemStats, AdminAiUsageDayStat } from '../../../../types';
import { AdminService } from '../../../../services/adminService';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

interface AdminReportsTabProps {
  stats: AdminSystemStats;
  aiUsageTrends: AdminAiUsageDayStat[];
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  stats,
  aiUsageTrends,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadCsv = () => {
    const csvContent = AdminService.generateCsvReport();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EduAI_Master_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('Executive CSV Report downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(AdminService.exportJsonReport(), null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EduAI_Master_Audit_Report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('Audit JSON Report exported successfully.');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Download Alert */}
      {downloadSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Executive Reports & Academic Intelligence
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export system KPIs, cohort performance benchmarks, and AI token utilization logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleDownloadJson}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="text-xs shadow-xs"
            onClick={handleDownloadCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download CSV Report
          </Button>
        </div>
      </div>

      {/* Report Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total AI Volume</span>
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalAiQueries.toLocaleString()}
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Token Processing:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {(stats.totalAiTokensEstimated / 1000000).toFixed(1)}M Tokens
              </span>
            </div>
            <div className="flex justify-between">
              <span>Photo OCR Accuracy:</span>
              <span className="font-semibold text-emerald-600">98.4%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Assessment Scale</span>
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {(stats.totalQuizzesGenerated + stats.totalExamsSimulated).toLocaleString()}
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Practice Quizzes:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.totalQuizzesGenerated}</span>
            </div>
            <div className="flex justify-between">
              <span>Mock Examinations:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.totalExamsSimulated}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Infrastructure Uptime</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.systemHealth.uptimePercentage}%
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Latency (P95):</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.systemHealth.avgLatencyMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Allocated:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.systemHealth.storageUsedMb} MB</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Breakdown Breakdown Breakdown */}
      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Subject Engagement & Weak Topic Concentration
        </h4>

        <div className="space-y-3">
          {[
            { subject: 'Science (Physics: Ray Optics, Electricity)', percent: 38, count: '5,658 queries', status: 'High Focus' },
            { subject: 'Mathematics (Quadratic Equations, Trig)', percent: 32, count: '4,764 queries', status: 'Active' },
            { subject: 'Social Science (Nationalism in India, Map Work)', percent: 18, count: '2,680 queries', status: 'Normal' },
            { subject: 'English (Grammar & Analytical Paragraphs)', percent: 12, count: '1,788 queries', status: 'Normal' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 dark:text-slate-200">{item.subject}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {item.count} ({item.percent}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
