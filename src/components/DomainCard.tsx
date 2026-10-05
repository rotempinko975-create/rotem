import React from 'react';
import { 
  UserCheck, 
  Home, 
  Users, 
  MapPin, 
  ShieldAlert, 
  GraduationCap, 
  Briefcase, 
  Megaphone, 
  Sparkles, 
  HeartHandshake,
  CheckCircle,
  Clock,
  CircleDashed,
  ArrowLeft
} from 'lucide-react';
import { DomainDefinition, DomainState } from '../types';

interface DomainCardProps {
  domain: DomainDefinition;
  state: DomainState;
  onSelect: (domainId: number) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  UserCheck,
  Home,
  Users,
  MapPin,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  Megaphone,
  Sparkles,
  HeartHandshake,
};

export const DomainCard: React.FC<DomainCardProps> = ({ domain, state, onSelect }) => {
  const IconComponent = ICON_MAP[domain.iconName] || Users;
  
  // Calculate completed questions
  const answeredCount = Object.values(state.answers || {}).filter((v) => v && v.trim().length > 0).length;
  const hasSummary = Boolean(state.summary?.mainInsight?.trim());

  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <CircleDashed className="w-3.5 h-3.5" />
      טרם התחיל
    </span>
  );

  if (state.status === 'completed') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        הושלם
      </span>
    );
  } else if (state.status === 'in_progress' || answeredCount > 0) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        בתהליך ({answeredCount}/5)
      </span>
    );
  }

  return (
    <div 
      onClick={() => onSelect(domain.id)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden"
    >
      {/* Top accent line when completed or active */}
      <div 
        className={`absolute top-0 right-0 left-0 h-1 transition-colors ${
          state.status === 'completed' 
            ? 'bg-emerald-500' 
            : answeredCount > 0 
              ? 'bg-amber-400' 
              : 'bg-transparent group-hover:bg-teal-300'
        }`} 
      />

      <div>
        {/* Header row: Number, icon, status */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-teal-800 tracking-wider">
                קבוצה {domain.number}
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug">
                {domain.title}
              </h3>
            </div>
          </div>
          <div>{statusBadge}</div>
        </div>

        {/* Focus description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3 font-normal">
          {domain.focusDescription}
        </p>

        {/* Group members chip if entered */}
        {state.groupMembers && state.groupMembers.trim().length > 0 && (
          <div className="text-[11px] text-teal-800 font-medium mb-3 flex items-center gap-1.5 bg-teal-50/70 px-2.5 py-1 rounded-lg border border-teal-100/60">
            <Users className="w-3 h-3 text-teal-600 shrink-0" />
            <span className="truncate">חברות הקבוצה: {state.groupMembers}</span>
          </div>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto text-xs">
        <div className="text-slate-500">
          {state.status === 'completed' ? (
            <span className="text-emerald-700 font-medium">5 שאלות + סיכום וממשקים</span>
          ) : answeredCount > 0 ? (
            <span>נענו {answeredCount} מתוך 5 שאלות</span>
          ) : (
            <span>5 שאלות חקר קצרות</span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-teal-700 group-hover:translate-x-[-3px] transition-transform">
          {state.status === 'completed' ? 'צפייה / עריכה' : answeredCount > 0 ? 'המשך חקר' : 'התחלת חקר'}
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
