import React from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronRight,
  FolderOpen,
  Sparkles,
  Target,
  TrendingDown,
  Upload
} from 'lucide-react';
import type { ConfusionTopic } from '../../lib/ragIndex';

/**
 * Weak Spot Analysis
 * ---------------------------------------------------------------------------
 * Surfaces two kinds of academic blind spot:
 *
 *   1. Low-engagement subjects — folders with few documents, little study
 *      activity and no recent AI questions.
 *   2. Confusion topics — questions the RAG assistant repeatedly failed to
 *      answer confidently from the indexed notes.
 */

export interface SubjectEngagement {
  id: string;
  name: string;
  code?: string;
  fileCount: number;
  queries: number;
  /** Timestamp of the most recent activity in this subject, if any. */
  lastActivityTs?: number;
  isStarred?: boolean;
}

export interface WeakSpotAnalysisProps {
  subjects: SubjectEngagement[];
  confusionTopics: ConfusionTopic[];
  /** Drives the bar grow-in animation, matching the rest of Analytics. */
  mounted: boolean;
  onOpenFolder: (folderId: string) => void;
  onUploadToFolder: (folderId: string) => void;
  onAskAiAbout: (topic: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_ENGAGEMENT_CUTOFF = 45;

interface ScoredSubject extends SubjectEngagement {
  score: number;
  reasons: string[];
  daysIdle: number | null;
}

/** Blend document volume, AI question activity and recency into one 0-100 score. */
const scoreSubject = (subject: SubjectEngagement, maxFiles: number, maxQueries: number): ScoredSubject => {
  const fileScore = maxFiles > 0 ? (subject.fileCount / maxFiles) * 45 : 0;
  const queryScore = maxQueries > 0 ? (subject.queries / maxQueries) * 35 : 0;

  const daysIdle = subject.lastActivityTs
    ? Math.floor((Date.now() - subject.lastActivityTs) / DAY_MS)
    : null;

  const recencyScore =
    daysIdle === null ? 0 : daysIdle <= 2 ? 20 : daysIdle <= 7 ? 12 : daysIdle <= 14 ? 6 : 2;

  const reasons: string[] = [];
  if (subject.fileCount === 0) reasons.push('No study material uploaded');
  else if (subject.fileCount <= 2) reasons.push(`Only ${subject.fileCount} document${subject.fileCount === 1 ? '' : 's'} stored`);

  if (subject.queries === 0) reasons.push('Never queried in AI Studio');
  else if (subject.queries <= 2) reasons.push(`${subject.queries} AI question${subject.queries === 1 ? '' : 's'} asked`);

  if (daysIdle === null) reasons.push('No recorded activity yet');
  else if (daysIdle > 7) reasons.push(`Idle for ${daysIdle} days`);

  return {
    ...subject,
    score: Math.round(Math.min(100, fileScore + queryScore + recencyScore)),
    reasons: reasons.slice(0, 3),
    daysIdle
  };
};

export const WeakSpotAnalysis: React.FC<WeakSpotAnalysisProps> = ({
  subjects,
  confusionTopics,
  mounted,
  onOpenFolder,
  onUploadToFolder,
  onAskAiAbout
}) => {
  const maxFiles = Math.max(1, ...subjects.map(s => s.fileCount));
  const maxQueries = Math.max(1, ...subjects.map(s => s.queries));

  const scored = subjects
    .map(s => scoreSubject(s, maxFiles, maxQueries))
    .sort((a, b) => a.score - b.score);

  const weakSubjects = scored.filter(s => s.score < LOW_ENGAGEMENT_CUTOFF).slice(0, 5);
  const topConfusion = confusionTopics.slice(0, 5);
  const maxConfused = Math.max(1, ...topConfusion.map(t => t.confusedQueries));

  const flaggedCount = weakSubjects.length + topConfusion.length;

  return (
    <div className="p-4 sm:p-6 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Weak Spot Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Subjects losing momentum and topics your notes cannot answer yet
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg border shrink-0 self-start sm:self-auto ${
            flaggedCount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {flaggedCount} {flaggedCount === 1 ? 'FLAG' : 'FLAGS'}
        </span>
      </div>

      {/* 1. Low-engagement subjects */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
          <h4 className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
            Low Engagement Subjects
          </h4>
        </div>

        {weakSubjects.length === 0 ? (
          <div className="p-4 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 text-center">
            <p className="text-xs font-semibold text-emerald-700">
              Every subject folder is being actively studied. Nothing to flag.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {weakSubjects.map((subject, idx) => (
              <div
                key={subject.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-black text-slate-900 truncate">{subject.name}</span>
                    {subject.code && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                        {subject.code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {subject.fileCount} files · {subject.queries} queries
                    </span>
                    <span className="text-xs font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {subject.score}
                    </span>
                  </div>
                </div>

                {/* Engagement bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: mounted ? `${Math.max(4, subject.score)}%` : '0%',
                      transitionDelay: `${idx * 90}ms`
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <ul className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {subject.reasons.map(reason => (
                      <li
                        key={reason}
                        className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onUploadToFolder(subject.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-[10px] font-bold hover:bg-slate-100 cursor-pointer transition-all"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Add notes</span>
                    </button>
                    <button
                      onClick={() => onOpenFolder(subject.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 cursor-pointer transition-all"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. RAG confusion topics */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 pt-3">
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          <h4 className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
            AI Confusion Topics
          </h4>
        </div>

        {topConfusion.length === 0 ? (
          <div className="p-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-600">
              No repeated confusion detected in your AI Studio history.
            </p>
            <p className="text-[11px] text-slate-400">
              Topics appear here when the assistant cannot ground an answer in your indexed notes.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topConfusion.map((topic, idx) => (
              <div
                key={topic.topic}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black text-slate-900 truncate">{topic.topic}</span>
                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shrink-0">
                      {Math.round(topic.confusionRate * 100)}% unresolved
                    </span>
                  </div>

                  <button
                    onClick={() => onAskAiAbout(topic.topic)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 cursor-pointer transition-all shrink-0 self-start sm:self-auto"
                  >
                    <Bot className="w-3 h-3" />
                    <span>Revise with AI</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: mounted ? `${(topic.confusedQueries / maxConfused) * 100}%` : '0%',
                        transitionDelay: `${idx * 90}ms`
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 w-28 text-right">
                    {topic.confusedQueries}/{topic.queries} queries
                  </span>
                </div>

                {topic.samples.length > 0 && (
                  <p className="text-[11px] text-slate-500 italic truncate" title={topic.samples[topic.samples.length - 1]}>
                    Last asked: “{topic.samples[topic.samples.length - 1]}”
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeakSpotAnalysis;
