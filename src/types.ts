export interface Question {
  id: number;
  question: string;
  thinkingHints?: string[];
  helperNote?: string;
}

export interface DomainDefinition {
  id: number;
  number: number;
  title: string;
  focusDescription: string;
  iconName: string;
  questions: Question[];
}

export interface DomainConnection {
  domainId: number;
  connectionReason: string;
}

export interface DomainSummary {
  mainInsight: string;
  highlightedBarrier: string;
  colleagueMessage: string;
  connectedDomains: DomainConnection[];
}

export interface DomainState {
  id: number;
  groupMembers?: string; // שמות חברות הקבוצה
  answers: Record<number, string>; // questionId -> answer
  summary: DomainSummary;
  status: 'not_started' | 'in_progress' | 'completed';
  updatedAt: string | null;
}

export interface KeyInsight {
  title: string;
  explanation: string;
  significance: string;
}

export interface CrossDomainTheme {
  name: string;
  explanation: string;
  domains: string[];
  whatEmerged: string;
  professionalImplication: string;
}

export interface DomainConnectionItem {
  domainA: string;
  domainB: string;
  explanation: string;
}

export interface SystemicBarrier {
  name: string;
  domains: string[];
  impactOnQualityOfLife: string;
}

export interface EnablingFactor {
  name: string;
  domains: string[];
  whyItEnables: string;
}

export interface ProfessionalTension {
  dilemmaTitle: string;
  poleA: string;
  poleB: string;
  contextAndTension: string;
}

export interface KnowledgeGap {
  topic: string;
  statement: string; // "נושא שקיבל מעט התייחסות בתהליך החקר הנוכחי וייתכן שכדאי להעמיק בו."
  whyImportant: string;
}

export interface EmergingInsight {
  title: string;
  deducedFromDomains: string[];
  insightText: string;
  tag: string; // Always "תובנה שעלתה מחיבור בין התחומים"
}

export interface MatyaImplication {
  focusArea: string;
  category: 'פיתוח ידע' | 'חיבור בין מומחיות תחום' | 'שינוי פרקטיקה' | 'פיתוח כלי או משאב' | 'הדרכה והטמעה' | 'סוגיה מערכתית';
  description: string;
  reflectiveQuestion: string;
}

export interface AISynthesisResult {
  big_picture: string;
  key_insights: KeyInsight[];
  cross_domain_themes: CrossDomainTheme[];
  domain_connections: DomainConnectionItem[];
  systemic_barriers: SystemicBarrier[];
  enabling_factors: EnablingFactor[];
  professional_tensions: ProfessionalTension[];
  knowledge_gaps: KnowledgeGap[];
  emerging_insights: EmergingInsight[];
  matya_implications: MatyaImplication[];
}
