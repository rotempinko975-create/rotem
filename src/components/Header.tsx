import React from 'react';
import { Lock, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentView: 'hub' | 'investigate' | 'facilitator';
  isFacilitator: boolean;
  hasAnswers: boolean;
  onNavigateHub: () => void;
  onOpenFacilitatorLogin: () => void;
  onNavigateFacilitator: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  isFacilitator,
  hasAnswers,
  onNavigateHub,
  onOpenFacilitatorLogin,
  onNavigateFacilitator,
  onReset,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <button 
            onClick={onNavigateHub} 
            className="text-right group flex items-center gap-3 transition-opacity hover:opacity-90 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              10
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                עשרת תחומי איכות חיים
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                  מתי״א יבנה
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                חקר קבוצתי ואינטגרציה מערכתית
              </p>
            </div>
          </button>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {currentView === 'investigate' && (
              <button
                onClick={onNavigateHub}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>בחירת תחום אחר</span>
              </button>
            )}

            {/* Quick Reset Button if there are answers entered */}
            {hasAnswers && (
              <button
                onClick={onReset}
                title="איפוס כל התשובות והתחלת סדנה חדשה"
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">איפוס תשובות</span>
                <span className="sm:hidden">איפוס</span>
              </button>
            )}

            {/* Facilitator Entry Button */}
            {isFacilitator ? (
              <button
                onClick={onNavigateFacilitator}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'facilitator'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>מסך מנחה (מחובר)</span>
              </button>
            ) : (
              <button
                onClick={onOpenFacilitatorLogin}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>כניסת מנחה</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
