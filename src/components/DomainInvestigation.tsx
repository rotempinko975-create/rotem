import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  HelpCircle, 
  Lightbulb, 
  Sparkles, 
  Link2, 
  Plus, 
  Trash2,
  BookmarkCheck,
  Compass,
  Users
} from 'lucide-react';
import { DOMAINS } from '../data/domains';
import { DomainDefinition, DomainState, DomainConnection } from '../types';

interface DomainInvestigationProps {
  domain: DomainDefinition;
  initialState: DomainState;
  onSaveDomain: (updatedState: DomainState) => void;
  onBackToHub: () => void;
  onCompleteDomain: (updatedState: DomainState) => void;
}

export const DomainInvestigation: React.FC<DomainInvestigationProps> = ({
  domain,
  initialState,
  onSaveDomain,
  onBackToHub,
  onCompleteDomain,
}) => {
  // Steps: 1 to 5 are the 5 questions, step 6 is the summary screen ("אז מה גילינו?")
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [groupMembers, setGroupMembers] = useState<string>(initialState.groupMembers || '');
  const [answers, setAnswers] = useState<Record<number, string>>(initialState.answers || {});
  const [mainInsight, setMainInsight] = useState<string>(initialState.summary?.mainInsight || '');
  const [highlightedBarrier, setHighlightedBarrier] = useState<string>(initialState.summary?.highlightedBarrier || '');
  const [colleagueMessage, setColleagueMessage] = useState<string>(initialState.summary?.colleagueMessage || '');
  const [connectedDomains, setConnectedDomains] = useState<DomainConnection[]>(
    initialState.summary?.connectedDomains || []
  );
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Sync state if initial changes (e.g. sample loaded)
  useEffect(() => {
    setGroupMembers(initialState.groupMembers || '');
    setAnswers(initialState.answers || {});
    setMainInsight(initialState.summary?.mainInsight || '');
    setHighlightedBarrier(initialState.summary?.highlightedBarrier || '');
    setColleagueMessage(initialState.summary?.colleagueMessage || '');
    setConnectedDomains(initialState.summary?.connectedDomains || []);
  }, [initialState]);

  // Auto-save helper
  const triggerAutoSave = (
    newMembers = groupMembers,
    newAnswers = answers,
    newMainInsight = mainInsight,
    newBarrier = highlightedBarrier,
    newColleague = colleagueMessage,
    newConnected = connectedDomains
  ) => {
    const answeredCount = Object.values(newAnswers).filter((t) => t && t.trim().length > 0).length;
    const isCompleted = answeredCount === 5 && Boolean(newMainInsight.trim());

    const updatedState: DomainState = {
      id: domain.id,
      groupMembers: newMembers,
      answers: newAnswers,
      summary: {
        mainInsight: newMainInsight,
        highlightedBarrier: newBarrier,
        colleagueMessage: newColleague,
        connectedDomains: newConnected,
      },
      status: isCompleted ? 'completed' : (answeredCount > 0 || Boolean(newMembers.trim())) ? 'in_progress' : 'not_started',
      updatedAt: new Date().toISOString(),
    };

    onSaveDomain(updatedState);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleGroupMembersChange = (val: string) => {
    setGroupMembers(val);
    triggerAutoSave(val);
  };

  const handleAnswerChange = (qId: number, val: string) => {
    const updated = { ...answers, [qId]: val };
    setAnswers(updated);
    triggerAutoSave(undefined, updated);
  };

  // Connected domains helper
  const handleToggleConnection = (targetDomainId: number) => {
    const exists = connectedDomains.find((c) => c.domainId === targetDomainId);
    let updated: DomainConnection[];
    if (exists) {
      updated = connectedDomains.filter((c) => c.domainId !== targetDomainId);
    } else {
      if (connectedDomains.length >= 4) {
        return; // Max 4 domains
      }
      updated = [...connectedDomains, { domainId: targetDomainId, connectionReason: '' }];
    }
    setConnectedDomains(updated);
    triggerAutoSave(undefined, undefined, undefined, undefined, undefined, updated);
  };

  const handleConnectionReasonChange = (targetDomainId: number, reason: string) => {
    const updated = connectedDomains.map((c) =>
      c.domainId === targetDomainId ? { ...c, connectionReason: reason } : c
    );
    setConnectedDomains(updated);
    triggerAutoSave(undefined, undefined, undefined, undefined, undefined, updated);
  };

  const handleFinish = () => {
    const updatedState: DomainState = {
      id: domain.id,
      groupMembers,
      answers,
      summary: {
        mainInsight,
        highlightedBarrier,
        colleagueMessage,
        connectedDomains,
      },
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
    onCompleteDomain(updatedState);
  };

  // Questions 1-5
  const currentQuestion = domain.questions[currentStep - 1];
  const otherDomains = DOMAINS.filter((d) => d.id !== domain.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBackToHub}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה למרכז התחומים</span>
        </button>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium transition-opacity ${savedFeedback ? 'opacity-100 bg-emerald-100 text-emerald-800' : 'opacity-60 bg-slate-100 text-slate-600'}`}>
            {savedFeedback ? '✓ נשמר אוטומטית' : 'שמירה רציפה'}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            תחום {domain.number} מתוך 10
          </span>
        </div>
      </div>

      {/* Domain Context Banner */}
      <div className="bg-gradient-to-l from-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            קבוצה {domain.number} חוקרת את:
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            {domain.title}
          </h2>
          <p className="text-sm sm:text-base text-teal-100/90 max-w-2xl font-normal leading-relaxed">
            {domain.focusDescription}
          </p>
        </div>
        <div className="absolute left-[-20px] bottom-[-20px] w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Group Members Input Card (שמות חברות הקבוצה בתחילת החקר) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs mb-6 transition-all focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label htmlFor="groupMembersInput" className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>שמות חברות הקבוצה</span>
          </label>
          <span className="text-xs text-slate-400 font-normal">מופיע בסיכום המערכתי</span>
        </div>
        <input
          id="groupMembersInput"
          type="text"
          value={groupMembers}
          onChange={(e) => handleGroupMembersChange(e.target.value)}
          placeholder="רשמו כאן את שמות המשתתפות בקבוצה (למשל: דנה, רונית, מיכל)..."
          className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Delicate Step Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span>
            {currentStep <= 5 ? `שלב ${currentStep} מתוך 6: שאלה ${currentStep}` : 'שלב 6 מתוך 6: סיכום וממשקים'}
          </span>
          <span>{Math.round((currentStep / 6) * 100)}% הושלם</span>
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => {
            const isCompletedStep = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-teal-600 ring-2 ring-teal-200'
                    : isCompletedStep
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 hover:bg-slate-300'
                }`}
                title={stepNum <= 5 ? `שאלה ${stepNum}` : 'סיכום וממשקים'}
              />
            );
          })}
        </div>
      </div>

      {/* Main Single Central Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-9 transition-all">
        {currentStep <= 5 ? (
          /* QUESTION STEPS (1-5) */
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm">
                {currentQuestion.id}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                שאלת חקר {currentQuestion.id} מתוך 5
              </span>
            </div>

            {/* The Big Question */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-5">
              {currentQuestion.question}
            </h3>

            {/* Thinking hints chips */}
            {currentQuestion.thinkingHints && currentQuestion.thinkingHints.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>כיווני חשיבה לדיון בקבוצה:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.thinkingHints.map((hint, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea for open-ended answer */}
            <div className="mb-3">
              <textarea
                rows={5}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="כתבו כאן את עיקרי התובנות שעלו בשיחת הקבוצה..."
                className="w-full p-4 text-base text-slate-800 bg-white border border-slate-300 rounded-2xl focus:border-teal-500 focus:ring-3 focus:ring-teal-100 outline-none transition-all resize-y placeholder:text-slate-400"
              />
            </div>

            {/* Short helper sentence required by the prompt */}
            <p className="text-xs text-slate-500 italic mb-8">
              “כתבו את התובנות המרכזיות שעלו בשיחה. אין צורך לענות באריכות.”
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                שאלה קודמת
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{currentStep === 5 ? 'המשך לסיכום התחום' : 'שאלה הבאה'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* SUMMARY STEP 6 ("אז מה גילינו?") */
          <div className="space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                שלב הסיכום
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                אז מה גילינו?
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                שלוש תובנות מפתח מהחקר הקבוצתי, ובחירת תחומי איכות חיים שמשיקים לתחום שלכן.
              </p>
            </div>

            {/* 3 Open text areas */}
            <div className="space-y-6">
              {/* Insight 1 */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  התובנה המשמעותית ביותר שלנו
                </label>
                <span className="block text-xs text-slate-500 mb-2.5 font-normal">
                  מה הדבר החשוב ביותר שלקחנו מהחקר?
                </span>
                <textarea
                  rows={2}
                  value={mainInsight}
                  onChange={(e) => {
                    setMainInsight(e.target.value);
                    triggerAutoSave(undefined, e.target.value);
                  }}
                  placeholder="רשמו כאן את התובנה המרכזית..."
                  className="w-full p-3.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Insight 2 */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  חסם שחשוב לשים עליו זרקור
                </label>
                <span className="block text-xs text-slate-500 mb-2.5 font-normal">
                  איזה חסם משמעותי עלה בשיחה?
                </span>
                <textarea
                  rows={2}
                  value={highlightedBarrier}
                  onChange={(e) => {
                    setHighlightedBarrier(e.target.value);
                    triggerAutoSave(undefined, undefined, e.target.value);
                  }}
                  placeholder="רשמו כאן את החסם המרכזי..."
                  className="w-full p-3.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Insight 3 */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  דבר אחד שחשוב שאנשי מקצוע אחרים ידעו
                </label>
                <span className="block text-xs text-slate-500 mb-2.5 font-normal">
                  מה המסר העיקרי שחשוב להעביר הלאה?
                </span>
                <textarea
                  rows={2}
                  value={colleagueMessage}
                  onChange={(e) => {
                    setColleagueMessage(e.target.value);
                    triggerAutoSave(undefined, undefined, undefined, e.target.value);
                  }}
                  placeholder="רשמו כאן את המסר המקצועי..."
                  className="w-full p-3.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Interconnected domains */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-5 h-5 text-teal-600" />
                <h4 className="text-base font-bold text-slate-900">
                  עם אילו תחומי חיים התחום שלנו מתחבר במיוחד?
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                הקבוצה יכולה לבחור עד 4 תחומים שמשיקים לתחום שנחקר ({connectedDomains.length}/4 נבחרו):
              </p>

              {/* Domain selection chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-6">
                {otherDomains.map((other) => {
                  const isSelected = connectedDomains.some((c) => c.domainId === other.id);
                  const isMaxReached = !isSelected && connectedDomains.length >= 4;

                  return (
                    <button
                      key={other.id}
                      type="button"
                      disabled={isMaxReached}
                      onClick={() => handleToggleConnection(other.id)}
                      className={`text-right p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold shadow-2xs'
                          : isMaxReached
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{other.number}. {other.title}</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-teal-600 text-white' : 'border border-slate-300'}`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanations for selected connections */}
              {connectedDomains.length > 0 && (
                <div className="space-y-3.5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-700">
                    הסבירו בקצרה: מה החיבור בין התחומים?
                  </div>
                  {connectedDomains.map((conn) => {
                    const targetDomain = DOMAINS.find((d) => d.id === conn.domainId);
                    return (
                      <div key={conn.domainId} className="bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-teal-800">
                            חיבור לתחום: {targetDomain?.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleConnection(conn.domainId)}
                            className="text-slate-400 hover:text-rose-600 text-xs p-1"
                          >
                            הסרה
                          </button>
                        </div>
                        <input
                          type="text"
                          value={conn.connectionReason}
                          onChange={(e) => handleConnectionReasonChange(conn.domainId, e.target.value)}
                          placeholder="מה החיבור? (לדוגמה: ניידות בקהילה היא תנאי מוקדם להגעה לתעסוקה)"
                          className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-teal-500 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה לשאלה 5
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookmarkCheck className="w-5 h-5 text-emerald-100" />
                <span>סיום ושמירת החקר</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
