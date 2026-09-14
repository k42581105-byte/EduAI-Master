import React, { useState } from 'react';
import {
  X,
  BookOpen,
  FileText,
  HelpCircle,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import {
  CurriculumBook,
  CurriculumChapter,
  CurriculumTopic,
  CurriculumLesson,
  AdminQuestionRecord,
  AdminQuizRecord,
  AdminExamRecord,
} from '../../../../types';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

export interface CmsPreviewPayload {
  type: 'book' | 'chapter' | 'topic' | 'lesson' | 'question' | 'quiz' | 'exam';
  data: any;
}

interface CmsPreviewModalProps {
  payload: CmsPreviewPayload | null;
  onClose: () => void;
}

export const CmsPreviewModal: React.FC<CmsPreviewModalProps> = ({ payload, onClose }) => {
  const [selectedQuestionOption, setSelectedQuestionOption] = useState<string | null>(null);
  const [showQuestionExplanation, setShowQuestionExplanation] = useState(false);

  if (!payload) return null;

  const renderSimpleMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-black text-slate-900 dark:text-white pt-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                {trimmed.replace('# ', '')}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-indigo-700 dark:text-indigo-400 pt-2">
                {trimmed.replace('## ', '')}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-slate-100 pt-1">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-slate-700 dark:text-slate-300">
                {trimmed.replace(/^[-*]\s+/, '')}
              </li>
            );
          }
          if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
            return (
              <div key={idx} className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-center font-mono text-sm text-indigo-950 dark:text-indigo-200 font-semibold my-2">
                {trimmed.replace(/\$\$/g, '')}
              </div>
            );
          }
          if (trimmed.length === 0) {
            return <div key={idx} className="h-1.5" />;
          }
          return (
            <p key={idx} className="text-slate-700 dark:text-slate-300">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {payload.type === 'book' && <BookOpen className="w-5 h-5" />}
              {payload.type === 'chapter' && <Layers className="w-5 h-5" />}
              {payload.type === 'topic' && <FileText className="w-5 h-5" />}
              {payload.type === 'lesson' && <Sparkles className="w-5 h-5" />}
              {payload.type === 'question' && <HelpCircle className="w-5 h-5" />}
              {payload.type === 'quiz' && <CheckCircle2 className="w-5 h-5" />}
              {payload.type === 'exam' && <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {payload.type} Preview
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Live Simulator</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                {payload.data.title || payload.data.name || payload.data.question || 'Preview Item'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* LESSON PREVIEW */}
          {payload.type === 'lesson' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Badge variant="indigo">
                  {payload.data.contentType === 'ai-explained' ? 'AI Explained' : payload.data.contentType || 'Text'}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{payload.data.estimatedMinutes || 8} min read</span>
                </div>
                <Badge variant={payload.data.status === 'published' ? 'emerald' : 'amber'}>
                  {payload.data.status || 'Published'}
                </Badge>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                {renderSimpleMarkdown(payload.data.contentMarkdown || '# No Content Markdown Provided')}
              </div>
            </div>
          )}

          {/* TOPIC PREVIEW */}
          {payload.type === 'topic' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{payload.data.title}</h4>
                  <p className="text-xs text-slate-500">{payload.data.summary}</p>
                </div>
                <Badge variant="indigo">{payload.data.difficulty || 'Medium'}</Badge>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Topic Lessons ({payload.data.lessons?.length || 0})
                </h5>
                <div className="space-y-2">
                  {(payload.data.lessons || []).map((ls: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {ls.title}
                      </span>
                      <span className="text-[11px] text-slate-500">{ls.estimatedMinutes || 8} min</span>
                    </div>
                  ))}
                  {(!payload.data.lessons || payload.data.lessons.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No lessons attached to this topic yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHAPTER PREVIEW */}
          {payload.type === 'chapter' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Chapter {payload.data.number}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {payload.data.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{payload.data.description}</p>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Included Topics ({payload.data.topics?.length || 0})
                </h5>
                <div className="space-y-2">
                  {(payload.data.topics || []).map((t: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.title}</span>
                        <Badge variant="slate" className="text-[10px]">{t.difficulty || 'Medium'}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BOOK PREVIEW */}
          {payload.type === 'book' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className={`w-16 h-20 rounded-xl bg-gradient-to-br ${payload.data.coverGradient || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0`}>
                  {payload.data.subjectName?.slice(0, 2) || 'BK'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">Class {payload.data.classLevel}</Badge>
                    <Badge variant="slate">{payload.data.subjectName}</Badge>
                    <Badge variant={payload.data.status === 'published' ? 'emerald' : 'amber'}>
                      {payload.data.status || 'Published'}
                    </Badge>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {payload.data.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    By {payload.data.author || 'NCERT Faculty'} • {payload.data.publisher || 'NCERT'}
                  </p>
                </div>
              </div>

              {/* Copyright Notice */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">
                    Legal Authorization: {payload.data.licenseInfo || 'NCERT Open Educational Resource (OER)'}
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                    {payload.data.copyrightDisclaimer || 'Authorized educational curriculum distribution.'}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Table of Contents ({payload.data.chapters?.length || 0} Chapters)
                </h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(payload.data.chapters || []).map((ch: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {ch.number}. {ch.title}
                      </span>
                      <span className="text-slate-400 text-[11px]">{ch.topics?.length || 0} topics</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* QUESTION PREVIEW (Interactive Solver) */}
          {payload.type === 'question' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo">{payload.data.subject}</Badge>
                  <Badge variant="slate">Class {payload.data.classLevel}</Badge>
                  <Badge variant="amber">{payload.data.difficulty}</Badge>
                </div>
                {payload.data.verifiedByAdmin && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {payload.data.question}
                </p>
              </div>

              {/* MCQ Options Tester */}
              {payload.data.options && payload.data.options.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Interactive Option Tester
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {payload.data.options.map((opt: string, idx: number) => {
                      const isSelected = selectedQuestionOption === opt;
                      const isCorrect = opt.trim().toLowerCase() === payload.data.correctAnswer?.trim().toLowerCase();
                      let optClass = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300';
                      if (isSelected) {
                        optClass = isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedQuestionOption(opt);
                            setShowQuestionExplanation(true);
                          }}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${optClass}`}
                        >
                          <span>{opt}</span>
                          {isSelected && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-rose-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solution & Explanation Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Model Solution & Answer Key
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-indigo-600"
                    onClick={() => setShowQuestionExplanation(!showQuestionExplanation)}
                  >
                    {showQuestionExplanation ? 'Hide Details' : 'Show Solution'}
                  </Button>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  <strong>Correct Answer:</strong>{' '}
                  <span className="font-mono text-indigo-700 dark:text-indigo-300">{payload.data.correctAnswer}</span>
                </div>

                {showQuestionExplanation && payload.data.explanation && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 leading-relaxed">
                    {payload.data.explanation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QUIZ / EXAM PREVIEW */}
          {(payload.type === 'quiz' || payload.type === 'exam') && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {payload.type === 'quiz' ? 'Diagnostic Assessment' : 'Summative Mock Examination'}
                  </span>
                  <Badge variant="indigo">Class {payload.data.classLevel}</Badge>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {payload.data.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                  <span>Subject: {payload.data.subject}</span>
                  {payload.data.totalQuestions && <span>• {payload.data.totalQuestions} Questions</span>}
                  {payload.data.totalMarks && <span>• {payload.data.totalMarks} Total Marks</span>}
                  {payload.data.durationMinutes && <span>• {payload.data.durationMinutes} Mins Duration</span>}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Test Blueprint & Guidelines</p>
                <p className="mt-0.5 text-[11px]">
                  Configured with step-marking scheme, negative marking guards, and AI diagnostic rubric.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
