import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Layers, 
  Lock,
  Compass,
  Users,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { DOMAINS, INITIAL_EMPTY_STATES, SAMPLE_REALISTIC_STATES } from './data/domains';
import { AISynthesisResult, DomainState } from './types';
import { Header } from './components/Header';
import { DomainCard } from './components/DomainCard';
import { DomainInvestigation } from './components/DomainInvestigation';
import { FacilitatorDashboard } from './components/FacilitatorDashboard';
import { FacilitatorLoginModal } from './components/FacilitatorLoginModal';

const STORAGE_KEY = 'matya_yavne_qol_domains_v3';
const SYNTHESIS_STORAGE_KEY = 'matya_yavne_synthesis_v3';
const FACILITATOR_AUTH_KEY = 'matya_qol_facilitator_auth';

export default function App() {
  const [domainsState, setDomainsState] = useState<Record<number, DomainState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return INITIAL_EMPTY_STATES;
  });

  const [synthesisResult, setSynthesisResult] = useState<AISynthesisResult | null>(() => {
    try {
      const saved = localStorage.getItem(SYNTHESIS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read synthesis from localStorage', e);
    }
    return null;
  });

  const [isFacilitator, setIsFacilitator] = useState<boolean>(() => {
    return sessionStorage.getItem(FACILITATOR_AUTH_KEY) === 'true';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'hub' | 'investigate' | 'facilitator'>('hub');
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submittedDomainName, setSubmittedDomainName] = useState<string | null>(null);

  // Sync state with server on mount
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.domains && Object.keys(data.domains).length > 0) {
          setDomainsState((prev) => {
            const hasLocalWork = Object.values(prev).some(
              (d) => Object.keys(d.answers).length > 0 || d.status === 'completed'
            );
            if (!hasLocalWork) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.domains));
              return data.domains;
            }
            return prev;
          });
        }
        if (data.lastSynthesis && !synthesisResult) {
          setSynthesisResult(data.lastSynthesis);
          localStorage.setItem(SYNTHESIS_STORAGE_KEY, JSON.stringify(data.lastSynthesis));
        }
      })
      .catch((err) => console.log('Offline or server not ready yet:', err));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(domainsState));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [domainsState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectDomain = (domainId: number) => {
    setSelectedDomainId(domainId);
    setCurrentView('investigate');
    setSubmittedDomainName(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDomain = async (updatedDomain: DomainState) => {
    setDomainsState((prev) => ({
      ...prev,
      [updatedDomain.id]: updatedDomain,
    }));

    try {
      await fetch(`/api/domains/${updatedDomain.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDomain),
      });
    } catch (e) {}
  };

  const handleCompleteDomain = (updatedDomain: DomainState) => {
    handleSaveDomain(updatedDomain);
    const domainDef = DOMAINS.find((d) => d.id === updatedDomain.id);
    setSubmittedDomainName(domainDef?.title || '');
    showToast(`החקר של תחום ${updatedDomain.id} הושלם ונשלח למנחה!`);
    setCurrentView('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFacilitatorLoginSuccess = () => {
    setIsFacilitator(true);
    sessionStorage.setItem(FACILITATOR_AUTH_KEY, 'true');
    setIsLoginModalOpen(false);
    setCurrentView('facilitator');
    showToast('ברוך הבא למסך המנחה!');
  };

  const handleFacilitatorLogout = () => {
    setIsFacilitator(false);
    sessionStorage.removeItem(FACILITATOR_AUTH_KEY);
    setCurrentView('hub');
    showToast('יצאת ממסך מנחה.');
  };

  const handleLoadSample = async () => {
    setDomainsState(SAMPLE_REALISTIC_STATES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_REALISTIC_STATES));
    try {
      await fetch('/api/load-sample', { method: 'POST' });
    } catch (e) {}
    showToast('נטענו בהצלחה תשובות הדגמה מלאות של 10 קבוצות מומחיות תחום!');
  };

  const handleReset = async () => {
    if (!window.confirm('האם לאפס את כל התשובות והחקר בכל 10 התחומים ולהתחיל סדנה נקייה לחלוטין?')) return;
    setDomainsState(INITIAL_EMPTY_STATES);
    setSynthesisResult(null);
    setSubmittedDomainName(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNTHESIS_STORAGE_KEY);
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {}
    showToast('כל נתוני הסדנה אופסו בהצלחה. כעת כל התחומים ריקים ומוכנים לחקר חדש.');
  };

  const handleRunSynthesis = async () => {
    setIsSynthesizing(true);
    showToast('הבינה המלאכותית מחברת את כל עשרת התחומים כעת...');
    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: domainsState }),
      });
      const data = await response.json();
      if (data.synthesis) {
        setSynthesisResult(data.synthesis);
        localStorage.setItem(SYNTHESIS_STORAGE_KEY, JSON.stringify(data.synthesis));
        showToast('האינטגרציה המערכתית הושלמה בהצלחה!');
      }
    } catch (err) {
      console.error('Synthesis error:', err);
      showToast('אירעה שגיאה בחיבור הנתונים. נסו שוב.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Check if any answers or group members were entered
  const hasAnswers = Object.values(domainsState).some(
    (d) => Object.keys(d.answers || {}).length > 0 || Boolean(d.groupMembers?.trim()) || d.status === 'completed'
  );

  const selectedDomainDef = DOMAINS.find((d) => d.id === selectedDomainId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Assistant',sans-serif] selection:bg-teal-100 selection:text-teal-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 border border-slate-700 animate-fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Facilitator Login Modal */}
      <FacilitatorLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleFacilitatorLoginSuccess}
      />

      {/* Global Header */}
      <Header
        currentView={currentView}
        isFacilitator={isFacilitator}
        hasAnswers={hasAnswers}
        onNavigateHub={() => {
          setCurrentView('hub');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFacilitatorLogin={() => setIsLoginModalOpen(true)}
        onNavigateFacilitator={() => {
          setCurrentView('facilitator');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReset={handleReset}
      />

      {/* Main Content */}
      <main className="flex-1">
        
        {/* VIEW 1: CLEAN GROUP HUB (למשתתפות הקבוצות) */}
        {currentView === 'hub' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
            
            {/* Friendly Submission Confirmation if group just completed */}
            {submittedDomainName && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-3xl p-6 sm:p-7 shadow-xs flex items-center justify-between gap-4 animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>חקר התחום הושלם בהצלחה!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800/90 font-normal">
                    תשובות קבוצת <strong>{submittedDomainName}</strong> נשמרו ונשלחו למנחה הסדנה לקראת שלב החיבורים והאינטגרציה במליאה.
                  </p>
                </div>
                <button
                  onClick={() => setSubmittedDomainName(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl transition-colors cursor-pointer"
                >
                  הבנתי, תודה
                </button>
              </div>
            )}

            {/* Simple Workshop Hero for Groups */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4 text-teal-600" />
                סדנת חקר עשרת תחומי איכות חיים — מתי״א יבנה
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                איזה תחום אתן חוקרות בסדנה?
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                לחצו על התחום עליו הקבוצה שלכן אחראית, רשמו את שמות המשתתפות וענו על 5 שאלות חקר ממוקדות. בסיום, מנחה הסדנה יחבר בין כל נקודות המבט לתמונה מערכתית אחת.
              </p>

              {/* Reset bar if answers are present */}
              {hasAnswers && (
                <div className="pt-2 flex items-center justify-center">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>ישנן תשובות שמורות. לחצו כאן לאיפוס והתחלת סדנה נקייה</span>
                  </button>
                </div>
              )}
            </div>

            {/* 10 Domain Cards for selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {DOMAINS.map((domain) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    state={domainsState[domain.id] || INITIAL_EMPTY_STATES[domain.id]}
                    onSelect={handleSelectDomain}
                  />
                ))}
              </div>
            </div>

            {/* Bottom info for groups */}
            <div className="text-center text-xs text-slate-400 pt-4">
              <span>החקר מתמקד במהות התחום עצמו (ולא בתלמיד מסוים). משך הפעילות לקבוצה: כ-10–15 דקות.</span>
            </div>

          </div>
        )}

        {/* VIEW 2: STEP-BY-STEP GROUP INVESTIGATION */}
        {currentView === 'investigate' && selectedDomainDef && (
          <DomainInvestigation
            domain={selectedDomainDef}
            initialState={domainsState[selectedDomainDef.id] || INITIAL_EMPTY_STATES[selectedDomainDef.id]}
            onSaveDomain={handleSaveDomain}
            onBackToHub={() => {
              setCurrentView('hub');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompleteDomain={handleCompleteDomain}
          />
        )}

        {/* VIEW 3: DEDICATED FACILITATOR DASHBOARD (רק למנחה עם קוד 2026) */}
        {currentView === 'facilitator' && isFacilitator && (
          <FacilitatorDashboard
            domainsState={domainsState}
            synthesis={synthesisResult}
            onRunSynthesis={handleRunSynthesis}
            isSynthesizing={isSynthesizing}
            onLoadSample={handleLoadSample}
            onReset={handleReset}
            onLogout={handleFacilitatorLogout}
            onBackToHub={() => {
              setCurrentView('hub');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      </main>

      {/* Footer with specified credit */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print space-y-1">
        <p className="font-bold text-slate-800 text-sm">
          עשרת תחומי איכות חיים — סדנה מקצועית לצוותי מתי״א יבנה
        </p>
        <p className="text-slate-400">
          קרדיט: סדנת מתי״א יבנה | משרד החינוך — אגף חינוך מיוחד ומודל Quality of Life
        </p>
      </footer>

    </div>
  );
}
