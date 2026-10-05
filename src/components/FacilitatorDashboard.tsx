import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Users, 
  CheckCircle2, 
  Clock, 
  CircleDashed, 
  Eye, 
  FileText, 
  RotateCcw, 
  LogOut, 
  Sliders, 
  Building2, 
  X,
  Compass,
  Key,
  Network
} from 'lucide-react';
import { DOMAINS } from '../data/domains';
import { AISynthesisResult, DomainState } from '../types';
import { SynthesisView } from './SynthesisView';

interface FacilitatorDashboardProps {
  domainsState: Record<number, DomainState>;
  synthesis: AISynthesisResult | null;
  onRunSynthesis: () => void;
  isSynthesizing: boolean;
  onLoadSample: () => void;
  onReset: () => void;
  onLogout: () => void;
  onBackToHub: () => void;
}

export const FacilitatorDashboard: React.FC<FacilitatorDashboardProps> = ({
  domainsState,
  synthesis,
  onRunSynthesis,
  isSynthesizing,
  onLoadSample,
  onReset,
  onLogout,
  onBackToHub,
}) => {
  const [inspectingDomainId, setInspectingDomainId] = useState<number | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'monitor' | 'synthesis'>('monitor');

  const completedCount = Object.values(domainsState).filter((d) => d.status === 'completed').length;
  const inProgressCount = Object.values(domainsState).filter(
    (d) => d.status === 'in_progress' || (d.answers && Object.values(d.answers).some((a) => a && a.trim().length > 0))
  ).length;

  const inspectingDomain = DOMAINS.find((d) => d.id === inspectingDomainId);
  const inspectingState = inspectingDomainId ? domainsState[inspectingDomainId] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Facilitator Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Compass className="w-4 h-4" />
            לוח בקרה ואינטגרציה למנחה הסדנה
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            מסך מנחה — עשרת תחומי איכות חיים
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 font-medium">
              קוד מאומת: 2026
            </span>
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            מעקב אחר מילוי שאלות החקר של 10 הקבוצות, הפעלת האינטגרציה המערכתית (AI) והצגת התמונה הכוללת למליאה.
          </p>
        </div>

        {/* Facilitator actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onLoadSample}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="טען תשובות לדוגמה של כל 10 הקבוצות"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>טעינת נתוני הדגמה (10 קבוצות)</span>
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 transition-colors cursor-pointer"
            title="איפוס כל התשובות בסדנה"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>יציאה ממסך מנחה</span>
          </button>
        </div>
      </div>

      {/* Synthesis Control Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
            <Users className="w-4 h-4" />
            <span>סטטוס מילוי הסדנה: {completedCount} מתוך 10 קבוצות סיימו את החקר</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {completedCount === 10
              ? 'כל עשר הקבוצות השלימו את החקר! ניתן לחבר את התמונה המלאה.'
              : completedCount > 0
                ? `${completedCount} קבוצות מוכנות. ניתן לבצע אינטגרציה כעת או להמתין לשאר הקבוצות.`
                : 'הקבוצות ממלאות כעת את שאלות החקר. לחצו על "טעינת נתוני הדגמה" כדי לצפות בסימולציה.'}
          </h3>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRunSynthesis}
            disabled={isSynthesizing}
            className="px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>{isSynthesizing ? 'ה-AI מחבר את התמונה...' : 'חברו את התמונה (אינטגרציה)'}</span>
          </button>

          {synthesis && (
            <button
              onClick={() => setActiveViewMode(activeViewMode === 'synthesis' ? 'monitor' : 'synthesis')}
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>{activeViewMode === 'synthesis' ? 'חזרה למעקב קבוצות' : 'צפייה בתוצר המחובר'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs to switch between Live Monitor and Full Synthesis */}
      <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-3 no-print">
        <button
          onClick={() => setActiveViewMode('monitor')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeViewMode === 'monitor'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          מעקב חקר הקבוצות (10 קבוצות)
        </button>

        {synthesis && (
          <button
            onClick={() => setActiveViewMode('synthesis')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'synthesis'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>התוצר המערכתי המחובר (מליאה)</span>
          </button>
        )}
      </div>

      {/* VIEW 1: LIVE MONITOR GRID */}
      {activeViewMode === 'monitor' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              מעקב חי אחר עבודת הקבוצות בסדנה
            </h3>
            <span className="text-xs text-slate-500">
              לחצו על ״צפייה בתשובות״ כדי לראות מה נכתב בכל קבוצה
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {DOMAINS.map((domain) => {
              const state = domainsState[domain.id];
              const answeredCount = Object.values(state?.answers || {}).filter((a) => a && a.trim().length > 0).length;
              const hasMembers = Boolean(state?.groupMembers?.trim());
              const isDone = state?.status === 'completed';

              return (
                <div
                  key={domain.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                    isDone
                      ? 'border-emerald-300 ring-1 ring-emerald-100'
                      : answeredCount > 0
                        ? 'border-amber-300 ring-1 ring-amber-50'
                        : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-800">
                        קבוצה {domain.number}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          הושלם
                        </span>
                      ) : answeredCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {answeredCount}/5 שאלות
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          <CircleDashed className="w-3 h-3" />
                          טרם התחיל
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {domain.title}
                    </h4>

                    {/* Group members */}
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 min-h-[42px] flex items-center">
                      {hasMembers ? (
                        <span className="line-clamp-2 font-medium text-slate-700">
                          👥 {state.groupMembers}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          טרם הוזנו שמות משתתפות
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3">
                    <button
                      onClick={() => setInspectingDomainId(domain.id)}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>צפייה בתשובות</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SYNTHESIS PRESENTATION (OR IF ACTIVE VIEW MODE IS SYNTHESIS) */}
      {activeViewMode === 'synthesis' && synthesis && (
        <SynthesisView
          synthesis={synthesis}
          domainsState={domainsState}
          onBackToHub={() => setActiveViewMode('monitor')}
          onRefreshSynthesis={onRunSynthesis}
          isRefreshing={isSynthesizing}
        />
      )}

      {/* INSPECTOR MODAL TO VIEW RAW GROUP WORK */}
      {inspectingDomain && inspectingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              onClick={() => setInspectingDomainId(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-4 mb-6">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                קבוצה {inspectingDomain.number}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {inspectingDomain.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {inspectingDomain.focusDescription}
              </p>
              {inspectingState.groupMembers && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-900 text-xs font-semibold border border-teal-200">
                  <Users className="w-3.5 h-3.5" />
                  <span>חברות הקבוצה: {inspectingState.groupMembers}</span>
                </div>
              )}
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>תשובות ל-5 שאלות החקר:</span>
                </h4>
                <div className="space-y-3.5">
                  {inspectingDomain.questions.map((q) => (
                    <div key={q.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="font-semibold text-slate-900 text-xs mb-1.5">
                        שאלה {q.id}: {q.question}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-100">
                        {inspectingState.answers?.[q.id] || '(טרם נרשמה תשובה)'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 mb-3">סיכום הקבוצה (מה גילינו):</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs">
                    <span className="font-bold block text-teal-900 mb-1">התובנה המשמעותית:</span>
                    <p className="text-slate-700">{inspectingState.summary?.mainInsight || 'טרם מולא'}</p>
                  </div>
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs">
                    <span className="font-bold block text-rose-900 mb-1">חסם שחשוב להבליט:</span>
                    <p className="text-slate-700">{inspectingState.summary?.highlightedBarrier || 'טרם מולא'}</p>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs">
                    <span className="font-bold block text-amber-900 mb-1">מסר לאנשי מקצוע:</span>
                    <p className="text-slate-700">{inspectingState.summary?.colleagueMessage || 'טרם מולא'}</p>
                  </div>
                </div>
              </div>

              {/* Connections */}
              {inspectingState.summary?.connectedDomains?.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-900 mb-2 text-xs">תחומי ממשק שנבחרו על ידי הקבוצה:</h4>
                  <div className="space-y-1.5">
                    {inspectingState.summary.connectedDomains.map((c) => {
                      const target = DOMAINS.find((d) => d.id === c.domainId);
                      return (
                        <div key={c.domainId} className="text-xs bg-slate-50 p-2 rounded-lg flex items-start gap-2">
                          <span className="font-bold text-teal-800 shrink-0">⟷ {target?.title}:</span>
                          <span className="text-slate-600">{c.connectionReason || '(לא נרשם נימוק)'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-left">
              <button
                onClick={() => setInspectingDomainId(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
