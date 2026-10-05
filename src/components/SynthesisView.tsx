import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Printer, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  Key, 
  Compass, 
  HelpCircle, 
  Scale, 
  Share2, 
  CheckCircle2, 
  Network, 
  Building2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Quote,
  Users
} from 'lucide-react';
import { AISynthesisResult, DomainState } from '../types';
import { DOMAINS } from '../data/domains';

interface SynthesisViewProps {
  synthesis: AISynthesisResult;
  domainsState: Record<number, DomainState>;
  onBackToHub: () => void;
  onRefreshSynthesis: () => void;
  isRefreshing?: boolean;
}

export const SynthesisView: React.FC<SynthesisViewProps> = ({
  synthesis,
  domainsState,
  onBackToHub,
  onRefreshSynthesis,
  isRefreshing = false,
}) => {
  const [expandedConnectionIndex, setExpandedConnectionIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'insights' | 'themes' | 'connections' | 'barriers' | 'matya'>('all');
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  // Collect raw participant highlights if entered by groups
  const participantHighlights = Object.values(domainsState).filter(
    (d) => d.summary?.mainInsight?.trim() || d.summary?.highlightedBarrier?.trim()
  );

  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 transition-all ${isProjectorMode ? 'text-base sm:text-lg' : ''}`}>
      
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-slate-200 pb-5">
        <button
          onClick={onBackToHub}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer self-start"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה למסך הסדנה</span>
        </button>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Projector / Plenary Presentation Mode toggle */}
          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className={`px-3.5 py-2 text-sm font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isProjectorMode
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            {isProjectorMode ? <Minimize2 className="w-4 h-4 text-teal-400" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isProjectorMode ? 'יציאה ממצב הקרנה' : 'מצב מקרן למליאה'}</span>
          </button>

          <button
            onClick={onRefreshSynthesis}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'מבצע סינתזה...' : 'חיבור מחדש עם Gemini'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>הדפסה / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Header Presentation */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-teal-600" />
          אינטגרציה מערכתית — מתי״א יבנה
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          מה גילינו כשחיברנו את הכול?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
          סינתזה מערכתית ממוקדת המחברת את תובנות עשר הקבוצות של <strong>מתי״א יבנה</strong>. זיהוי תמות עומק, נקודות ממשק וחסמים החוצים את התחום הבודד.
        </p>
      </div>

      {/* Quick Section Tabs */}
      <div className="no-print flex items-center justify-center flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl max-w-3xl mx-auto">
        {[
          { id: 'all', label: 'התמונה המלאה' },
          { id: 'insights', label: 'מסקנות ותובנות מפתח' },
          { id: 'connections', label: 'חיבורים וממשקים ויזואליים' },
          { id: 'themes', label: 'תמות רוחביות' },
          { id: 'barriers', label: 'חסמים וגורמים מאפשרים' },
          { id: 'matya', label: 'המשמעות עבור מתי״א יבנה' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. BIG PICTURE BANNER */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-7 sm:p-9 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-4xl">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            תמונת העל המערכתית (The Big Picture)
          </div>
          <p className="text-lg sm:text-2xl text-teal-50 font-bold leading-relaxed">
            {synthesis.big_picture}
          </p>
        </div>
      </div>

      {/* 2. KEY INSIGHTS (3-5 CARDS) */}
      {(activeTab === 'all' || activeTab === 'insights') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Key className="w-5 h-5 text-teal-700" />
            <h3 className="text-xl font-bold text-slate-900">
              מסקנות ותובנות מפתח מחיבור התחומים
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {synthesis.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-teal-400 transition-colors"
              >
                <div>
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-sm mb-3 border border-teal-100">
                    0{idx + 1}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {insight.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-normal">
                    {insight.explanation}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-xs sm:text-sm font-medium text-teal-900 bg-teal-50/60 p-3 rounded-xl border border-teal-100/80">
                  <span className="font-bold block text-xs text-teal-950 mb-0.5">משמעות יישומית:</span>
                  {insight.significance}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. VISUAL DOMAIN CONNECTIONS (חיבורים וממשקים ויזואליים) */}
      {(activeTab === 'all' || activeTab === 'connections') && (
        <section className="space-y-5 bg-gradient-to-br from-slate-50 to-teal-50/40 p-6 sm:p-8 rounded-3xl border border-teal-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-6 h-6 text-teal-700" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                נקודות הממשק – רשת החיבורים הוויזואלית בין התחומים
              </h3>
            </div>
            <span className="text-xs font-semibold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-200 self-start">
              {synthesis.domain_connections.length} חיבורים מרכזיים
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {synthesis.domain_connections.map((conn, idx) => {
              const isExpanded = expandedConnectionIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setExpandedConnectionIndex(isExpanded ? null : idx)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center flex-wrap gap-2 text-sm sm:text-base font-bold text-slate-900">
                      <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">
                        {conn.domainA}
                      </span>
                      <span className="text-teal-600 font-extrabold text-base">⟷</span>
                      <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">
                        {conn.domainB}
                      </span>
                    </div>
                    <div className="text-slate-400 hover:text-slate-600 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-teal-700" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-teal-950 block mb-1">מה מחבר ביניהם?</span>
                    <p>{conn.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. EMERGING INSIGHTS (תובנות חדשות מחיבור) */}
      {(activeTab === 'all' || activeTab === 'insights') && synthesis.emerging_insights?.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="text-xl font-bold text-slate-900">
                תובנות חדשות שנולדו מהחיבור הכולל
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              תובנה שעלתה מחיבור בין התחומים
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {synthesis.emerging_insights.map((item, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 rounded-2xl border border-amber-200 p-5 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold mb-3 border border-amber-300">
                    {item.tag || 'תובנה שעלתה מחיבור בין התחומים'}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                    {item.insightText}
                  </p>
                </div>

                <div className="pt-3 border-t border-amber-200/60">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    הוסק מחיבור התחומים:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.deducedFromDomains.map((dName, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900 text-[10px] font-medium"
                      >
                        {dName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. CROSS-DOMAIN THEMES (5-7 THEMES) */}
      {(activeTab === 'all' || activeTab === 'themes') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Layers className="w-5 h-5 text-teal-700" />
            <h3 className="text-xl font-bold text-slate-900">
              התמות שחוצות את התחומים
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {synthesis.cross_domain_themes.map((theme, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-lg font-bold text-teal-900">
                      {theme.name}
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      תמה {idx + 1}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {theme.explanation}
                  </p>
                </div>

                {/* Domains chips */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    הופיעה בתחומים:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.domains.map((dom, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What emerged in responses */}
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-700 space-y-1 border border-slate-100">
                  <span className="font-bold text-slate-900 block text-xs">מה עלה בתשובות הקבוצות:</span>
                  <p className="leading-relaxed">{theme.whatEmerged}</p>
                </div>

                {/* Professional Implication */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs sm:text-sm text-emerald-900">
                  <span className="font-bold block text-emerald-950 text-xs mb-0.5">משמעות מקצועית למתי״א יבנה:</span>
                  {theme.professionalImplication}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. SYSTEMIC BARRIERS & ENABLING FACTORS */}
      {(activeTab === 'all' || activeTab === 'barriers') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Systemic Barriers */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-200 pb-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-xl font-bold text-slate-900">
                חסמים רוחביים שמופיעים במספר תחומים
              </h3>
            </div>

            <div className="space-y-4">
              {synthesis.systemic_barriers.map((bar, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-rose-100 p-5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-rose-950">
                      {bar.name}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      חסם רוחבי
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {bar.domains.map((dom, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    <span className="font-semibold text-slate-800">השפעה על איכות החיים: </span>
                    {bar.impactOnQualityOfLife}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Enabling Factors */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-900">
                גורמים מאפשרים שחוזרים שוב ושוב
              </h3>
            </div>

            <div className="space-y-4">
              {synthesis.enabling_factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-emerald-950">
                      {factor.name}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      גורם מאפשר
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {factor.domains.map((dom, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    <span className="font-semibold text-slate-800">מדוע הוא מקדם איכות חיים: </span>
                    {factor.whyItEnables}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}

      {/* 7. PROFESSIONAL TENSIONS / DILEMMAS */}
      {(activeTab === 'all' || activeTab === 'insights') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Scale className="w-5 h-5 text-teal-700" />
            <h3 className="text-xl font-bold text-slate-900">
              דילמות מקצועיות ומתחים שעלו
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {synthesis.professional_tensions.map((tension, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md inline-block mb-2">
                    מתח מקצועי {idx + 1}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mb-3">
                    {tension.dilemmaTitle}
                  </h4>

                  <div className="space-y-2 mb-4 text-xs sm:text-sm">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">קוטב א׳:</span>
                      {tension.poleA}
                    </div>
                    <div className="text-center font-bold text-slate-400 text-xs">מול</div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">קוטב ב׳:</span>
                      {tension.poleB}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 pt-3 border-t border-slate-100 italic">
                  {tension.contextAndTension}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. KNOWLEDGE GAPS & AREAS TO EXPLORE FURTHER */}
      {(activeTab === 'all' || activeTab === 'insights') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <HelpCircle className="w-5 h-5 text-teal-700" />
            <h3 className="text-xl font-bold text-slate-900">
              דברים שכדאי להמשיך לחקור (פערים)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {synthesis.knowledge_gaps.map((gap, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5"
              >
                <h4 className="text-base font-bold text-slate-900">
                  {gap.topic}
                </h4>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-medium text-amber-900">
                  {gap.statement || 'נושא שקיבל מעט התייחסות בתהליך החקר הנוכחי וייתכן שכדאי להעמיק בו.'}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-700">מדוע חשוב להעמיק: </span>
                  {gap.whyImportant}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. MATYA YAVNE IMPLICATIONS ("ומה זה אומר עבורנו?") */}
      {(activeTab === 'all' || activeTab === 'matya') && (
        <section className="space-y-5 bg-gradient-to-br from-teal-50/90 via-white to-slate-50 p-7 sm:p-9 rounded-3xl border border-teal-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-teal-600" />
              חיבור לעשייה המקצועית של מתי״א יבנה
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              ומה זה אומר עבורנו במתי״א יבנה?
            </h3>
            <p className="text-sm text-slate-600 font-normal">
              מוקדים מעשיים להמשך חשיבה מקצועית, שיתופי פעולה בין מומחיות תחום והעמקת הפרקטיקה המערכתית במרכז:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {synthesis.matya_implications.map((imp, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900">
                      {imp.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">מוקד {idx + 1}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {imp.focusArea}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {imp.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-teal-950">
                  <span className="font-bold block text-teal-900 mb-0.5">שאלה להמשך דיאלוג צוותי במתי״א יבנה:</span>
                  <p className="italic">“{imp.reflectiveQuestion}”</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom return to hub action */}
      <div className="text-center pt-6 pb-10 no-print">
        <button
          onClick={onBackToHub}
          className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה למסך הסדנה</span>
        </button>
      </div>

    </div>
  );
};
