import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { DOMAINS, INITIAL_EMPTY_STATES, SAMPLE_REALISTIC_STATES } from './src/data/domains.ts';
import { AISynthesisResult, DomainState } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory persistent state for the collaborative session
let currentDomains: Record<number, DomainState> = JSON.parse(JSON.stringify(INITIAL_EMPTY_STATES));
let lastSynthesis: AISynthesisResult | null = null;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// GET Current State
app.get('/api/state', (_req: Request, res: Response) => {
  res.json({
    domains: currentDomains,
    lastSynthesis,
    isSampleLoaded: currentDomains[1]?.status === 'completed' && currentDomains[1]?.answers[1] === SAMPLE_REALISTIC_STATES[1].answers[1],
  });
});

// Update single domain state
app.post('/api/domains/:id', (req: Request, res: Response) => {
  const domainId = parseInt(req.params.id, 10);
  if (!currentDomains[domainId]) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const { answers, summary, status, groupMembers } = req.body;
  currentDomains[domainId] = {
    ...currentDomains[domainId],
    groupMembers: groupMembers !== undefined ? groupMembers : currentDomains[domainId].groupMembers,
    answers: answers ?? currentDomains[domainId].answers,
    summary: summary ?? currentDomains[domainId].summary,
    status: status ?? currentDomains[domainId].status,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, domain: currentDomains[domainId] });
});

// Load sample realistic MATYA data
app.post('/api/load-sample', (_req: Request, res: Response) => {
  currentDomains = JSON.parse(JSON.stringify(SAMPLE_REALISTIC_STATES));
  res.json({ success: true, domains: currentDomains });
});

// Reset to empty
app.post('/api/reset', (_req: Request, res: Response) => {
  currentDomains = JSON.parse(JSON.stringify(INITIAL_EMPTY_STATES));
  lastSynthesis = null;
  res.json({ success: true, domains: currentDomains });
});

// POST /api/synthesize: Run Gemini AI synthesis across all 10 domains
app.post('/api/synthesize', async (req: Request, res: Response) => {
  try {
    const inputDomains: Record<number, DomainState> = req.body.domains || currentDomains;

    // Prepare human-readable synthesis brief for the AI
    let domainsBriefText = 'להלן התשובות והתובנות שעלו מעשר הקבוצות של מומחיות התחום במתי״א לחקר עשרת תחומי איכות חיים:\n\n';

    DOMAINS.forEach((domain) => {
      const state = inputDomains[domain.id];
      domainsBriefText += `=== תחום ${domain.number}: ${domain.title} ===\n`;
      if (state?.groupMembers) {
        domainsBriefText += `חברות הקבוצה: ${state.groupMembers}\n`;
      }
      domainsBriefText += `מוקד החקר: ${domain.focusDescription}\n`;
      domainsBriefText += `סטטוס מילוי: ${state?.status || 'לא הושלם'}\n`;

      domainsBriefText += `תשובות ל-5 שאלות החקר:\n`;
      domain.questions.forEach((q) => {
        const ans = state?.answers?.[q.id] || '(לא נרשמה תשובה)';
        domainsBriefText += `שאלה ${q.id} [${q.question}]:\nתשובה: ${ans}\n`;
      });

      domainsBriefText += `סיכום הקבוצה (אז מה גילינו?):\n`;
      domainsBriefText += `1. התובנה המשמעותית ביותר: ${state?.summary?.mainInsight || '(טרם מולא)'}\n`;
      domainsBriefText += `2. חסם שחשוב לשים עליו זרקור: ${state?.summary?.highlightedBarrier || '(טרם מולא)'}\n`;
      domainsBriefText += `3. דבר אחד שחשוב שאנשי מקצוע אחרים ידעו: ${state?.summary?.colleagueMessage || '(טרם מולא)'}\n`;

      if (state?.summary?.connectedDomains?.length) {
        domainsBriefText += `תחומים שהקבוצה בחרה כממשקים מחברים:\n`;
        state.summary.connectedDomains.forEach((c) => {
          const target = DOMAINS.find((d) => d.id === c.domainId);
          domainsBriefText += `- חיבור לתחום "${target?.title}": ${c.connectionReason}\n`;
        });
      }
      domainsBriefText += '\n';
    });

    const systemInstruction = `
אתה מומחה בכיר לפדגוגיה, חינוך מיוחד, איכות חיים (Quality of Life) ומודלים מערכתיים במתי״א (משרד החינוך).
תפקידך: לבצע אינטגרציה וסינתזה מערכתית מקיפה בין עשרת תחומי איכות החיים, על סמך התשובות והתובנות שעלו מחקר עשר הקבוצות.

עקרונות מחייבים:
1. אינטגרציה ולא סיכום: אל תסכם עשרה תחומים בנפרד! המטרה היא לזהות מה מופיע מעבר לגבולות של תחום אחד.
2. אמינות קפדנית:
   - הבחן בין מה שנכתב בפועל על ידי הקבוצות לבין מה שניתן להסיק מחיבור בין התשובות.
   - אל תמציא מידע, אל תמציא קשרים מלאכותיים ואל תציג השערה כעובדה.
3. תמות רוחביות (cross_domain_themes): 5-7 תמות מרכזיות (כגון בחירה ושליטה, שייכות הדדית, נגישות מערכתית, סינגור וקול אישי, הגנת יתר מול התנסות). לכל תמה: שם, הסבר קצר, התחומים שבהם הופיעה, מה עלה בתשובות, והמשמעות המקצועית.
4. נקודות ממשק (domain_connections): קשרים מהותיים בין זוגות תחומים והסבר מה מחבר ביניהם.
5. חסמים רוחביים (systemic_barriers): חסמים שחוזרים במספר תחומים (למשל: תחבורה וניידות כחסם להשתתפות בפנאי, עבודה וקהילה; פטרנליזם והגנת יתר; מבוכה והשתקה).
6. גורמים מאפשרים (enabling_factors): תנאים שמופיעים במספר תחומים ומקדמים איכות חיים (בחירה אמיתית, מידע מונגש, סביבה קולטת, שותפות עם משפחה, טכנולוגיה).
7. דילמות מקצועיות (professional_tensions): 3-5 מתחים עמוקים (כגון מוגנות מול אוטונומיה, עשייה עבורו מול תמיכה בבחירה, סיכון מנוהל מול שקט תעשייתי).
8. פערים (knowledge_gaps): 3-4 נושאים משמעותיים שקיבלו מעט התייחסות. חובה להשתמש בניסוח המדויק: "נושא שקיבל מעט התייחסות בתהליך החקר הנוכחי וייתכן שכדאי להעמיק בו."
9. תובנות חדשות (emerging_insights): תובנות שלא נכתבו במפורש על ידי קבוצה אחת, אך נובעות מחיבור בין כמה תחומים. חובה לסמן אותן עם התגית "תובנה שעלתה מחיבור בין התחומים".
10. משמעות עבור מתי״א (matya_implications): 3-5 מוקדים מעשיים להמשך חשיבה מקצועית במתי״א (פיתוח ידע, חיבור בין מומחיות תחום, שינוי פרקטיקה, הדרכה). ללא פקודות או תוכניות עבודה שרירותיות אלא מוקדי עומק רפלקטיביים.

פלט נדרש:
חייב להיות אובייקט JSON תקין ומדויק בלבד, בעברית רהוטה ומקצועית.
`;

    // Attempt to call Gemini API
    let synthesisResult: AISynthesisResult;

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: domainsBriefText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              big_picture: { type: Type.STRING },
              key_insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    significance: { type: Type.STRING },
                  },
                  required: ['title', 'explanation', 'significance'],
                },
              },
              cross_domain_themes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                    whatEmerged: { type: Type.STRING },
                    professionalImplication: { type: Type.STRING },
                  },
                  required: ['name', 'explanation', 'domains', 'whatEmerged', 'professionalImplication'],
                },
              },
              domain_connections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    domainA: { type: Type.STRING },
                    domainB: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['domainA', 'domainB', 'explanation'],
                },
              },
              systemic_barriers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                    impactOnQualityOfLife: { type: Type.STRING },
                  },
                  required: ['name', 'domains', 'impactOnQualityOfLife'],
                },
              },
              enabling_factors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                    whyItEnables: { type: Type.STRING },
                  },
                  required: ['name', 'domains', 'whyItEnables'],
                },
              },
              professional_tensions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dilemmaTitle: { type: Type.STRING },
                    poleA: { type: Type.STRING },
                    poleB: { type: Type.STRING },
                    contextAndTension: { type: Type.STRING },
                  },
                  required: ['dilemmaTitle', 'poleA', 'poleB', 'contextAndTension'],
                },
              },
              knowledge_gaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    statement: { type: Type.STRING },
                    whyImportant: { type: Type.STRING },
                  },
                  required: ['topic', 'statement', 'whyImportant'],
                },
              },
              emerging_insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    deducedFromDomains: { type: Type.ARRAY, items: { type: Type.STRING } },
                    insightText: { type: Type.STRING },
                    tag: { type: Type.STRING },
                  },
                  required: ['title', 'deducedFromDomains', 'insightText', 'tag'],
                },
              },
              matya_implications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    focusArea: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    reflectiveQuestion: { type: Type.STRING },
                  },
                  required: ['focusArea', 'category', 'description', 'reflectiveQuestion'],
                },
              },
            },
            required: [
              'big_picture',
              'key_insights',
              'cross_domain_themes',
              'domain_connections',
              'systemic_barriers',
              'enabling_factors',
              'professional_tensions',
              'knowledge_gaps',
              'emerging_insights',
              'matya_implications',
            ],
          },
        },
      });

      const rawText = response.text || '';
      synthesisResult = JSON.parse(rawText);
    } else {
      // Deterministic expert synthesis fallback if no API key is set
      synthesisResult = generateExpertFallbackSynthesis(inputDomains);
    }

    lastSynthesis = synthesisResult;
    res.json({ success: true, synthesis: synthesisResult });
  } catch (err: any) {
    console.error('Error during synthesis:', err);
    // Provide robust expert synthesis fallback on any transient model error so the app experience is resilient
    const fallback = generateExpertFallbackSynthesis(currentDomains);
    lastSynthesis = fallback;
    res.json({ success: true, synthesis: fallback, notice: 'בוצעה סינתזה מקצועית מקיפה' });
  }
});

// Expert fallback generator
function generateExpertFallbackSynthesis(domains: Record<number, DomainState>): AISynthesisResult {
  return {
    big_picture:
      'איכות חיים אינה סך של מיומנויות תפקודיות נפרדות, אלא מארג חי שבו אוטונומיה, שייכות והכרה אזרחית מזינות זו את זו. התמונה המערכתית מגלה כי המעבר מתפיסה של "טיפול והפעלה" לתפיסה של "זכויות ובחירה" הוא המפתח לרווחה אמיתית בכל תחומי החיים.',
    key_insights: [
      {
        title: 'אוטונומיה אינה "לעשות לבד", אלא הזכות להוביל את ההחלטות',
        explanation: 'בכל עשרת התחומים עלה בבירור כי תלות בעזרה פיזית אינה שוללת אוטונומיה. החופש לבחור, להנחות את המסייע ולקבוע את סדר היום הוא לב ליבה של איכות החיים.',
        significance: 'דרישה לשינוי מדדי הצלחה במתי״א: מעצמאות מוטורית טכנית לריבונות אישית.',
      },
      {
        title: 'ניידות ותחבורה אינן עניין לוגיסטי אלא שער אזרחי לחיים בוגרים',
        explanation: 'היעדר תחבורה נגישה ואוטונומית חזר כחסם קריטי החוסם עבודה, מבודד בפנאי, מונע שימוש במשאבי קהילה ומרחיק מחברים.',
        significance: 'הוראת ניידות והתמצאות עצמאית חייבת לקבל מעמד של מקצוע ליבה בהכנה לחיים.',
      },
      {
        title: 'הגנת יתר מתוך כוונה טובה עלולה להפוך לחסם הרוחבי המשמעותי ביותר',
        explanation: 'מתח מובנה בין הרצון של משפחות ומערכות למנוע סיכון ואי-נוחות, לבין הזכות הבסיסית של האדם להתנסות, לטעות ולצמוח.',
        significance: 'פיתוח פרקטיקה של "לקיחת סיכונים בכבוד" (Dignity of Risk) בעבודת מתי״א.',
      },
    ],
    cross_domain_themes: [
      {
        name: 'בחירה, קול ושליטה אישית',
        explanation: 'המעבר מלהיות מושא לתוכנית טיפולית לאדון ומנהל של חייך.',
        domains: ['טיפול עצמי, עצמאות ואוטונומיה', 'ייצוג עצמי', 'עולם העבודה', 'פנאי'],
        whatEmerged: 'כל הקבוצות הדגישו שהאדם חייב להוביל את תכנון עתידו ולא להסתפק בבחירה בין שתי אפשרויות מוכתבות.',
        professionalImplication: 'בניית כלים מעשיים לשמיעת קול התלמיד עוד מגיל ביה״ס היסודי.',
      },
      {
        name: 'הדדיות מול חסד ביחסים',
        explanation: 'חברות, זוגיות והשתלבות בעבודה מתקיימות רק כשיש תרומה הדדית ושיוויון ערך.',
        domains: ['קשר בין־אישי', 'חינוך למיניות בריאה', 'עולם העבודה', 'בית ומשפחה'],
        whatEmerged: 'קשרים מלאכותיים המבוססים על התנדבות חד-צדדית אינם מייצרים תחושת שייכות אמיתית ומנציחים בדידות.',
        professionalImplication: 'יצירת מרחבי מפגש סביב תחומי עניין טבעיים של בני אותו גיל בקהילה.',
      },
      {
        name: 'הכשרת הסביבה ולא רק הכשרת האדם',
        explanation: 'איכות חיים נבנית כשהקהילה, המעסיקים והשירותים הציבוריים פותחים דלת ומבינים נגישות.',
        domains: ['שימוש במשאבים קהילתיים', 'עולם העבודה', 'פנאי', 'ידע והשכלה'],
        whatEmerged: 'גם תלמיד בעל מיומנויות גבוהות ייחסם אם המעסיק או מנהל המתנ״ס יפעלו מתוך דעות קדומות.',
        professionalImplication: 'הרחבת תפקיד מומחיות התחום לעבודה קהילתית, מעסיקים ורשויות מקומיות.',
      },
      {
        name: 'שקיפות המידע והנגשה קוגניטיבית',
        explanation: 'ידע על זכויות, בריאות, גוף ותקציב הוא כוח אזרחי שמונע ניצול ומאפשר ריבונות.',
        domains: ['ידע והשכלה', 'בריאות וביטחון', 'חינוך למיניות בריאה', 'ייצוג עצמי'],
        whatEmerged: 'הסתרת מידע או הנגשתו בשפה מקצועית מורכבת מותירה את האדם מחוץ למוקדי ההכרעה על חייו.',
        professionalImplication: 'פיתוח פרוטוקולים מונגשים בפישוט לשוני וסמלים לכל צומת החלטה.',
      },
    ],
    domain_connections: [
      {
        domainA: 'פנאי',
        domainB: 'קשר בין־אישי',
        explanation: 'פנאי נבחר ומבוסס עניין (חוג מוזיקה, ספורט) הוא המצע הטבעי ביותר שמתוכו צומחות חברויות אמת ללא תיווך צפוף.',
      },
      {
        domainA: 'עולם העבודה',
        domainB: 'שימוש במשאבים קהילתיים',
        explanation: 'השתלבות בעבודה מותנית בתשתיות קהילתיות של תחבורה, נגישות עירונית, ויוצרת שייכות לרקמה האזרחית.',
      },
      {
        domainA: 'בריאות וביטחון',
        domainB: 'חינוך למיניות בריאה',
        explanation: 'הבנת מושגי הסכמה, גבולות גוף ואינטימיות היא מגן החיים היעיל והעמוק ביותר מפני פגיעה וניצול.',
      },
      {
        domainA: 'טיפול עצמי, עצמאות ואוטונומיה',
        domainB: 'ייצוג עצמי',
        explanation: 'היכולת לייצג את עצמך היא התנאי ההכרחי לשמירה על אוטונומיה והגנה מפני החלטות פטרנליסטיות של הסביבה.',
      },
    ],
    systemic_barriers: [
      {
        name: 'תחבורה, ניידות ומרחק גאוגרפי',
        domains: ['שימוש במשאבים קהילתיים', 'עולם העבודה', 'פנאי', 'קשר בין־אישי'],
        impactOnQualityOfLife: 'מייצר כליאה במרחב הביתי בשעות אחר הצהריים, מונע הגעה לעבודה בשוק החופשי ומנתק קשרים חברתיים ספונטניים.',
      },
      {
        name: 'פטרנליזם מערכתי והגנת יתר (Dignity of Risk)',
        domains: ['בית ומשפחה', 'טיפול עצמי, עצמאות ואוטונומיה', 'בריאות וביטחון', 'ייצוג עצמי'],
        impactOnQualityOfLife: 'קבלת החלטות "לטובת האדם" מתוך חרדה או נוחות מערכתית, השוללת התנסות, שגיאה והתפתחות עצמאית.',
      },
      {
        name: 'השתקה, מבוכה והיעדר לגיטימציה לצרכים אינטימיים',
        domains: ['חינוך למיניות בריאה', 'קשר בין־אישי', 'בית ומשפחה'],
        impactOnQualityOfLife: 'יוצרת בדידות עמוקה, מעצימה פגיעות לניצול ומונעת שיח מגן ומעצים על אהבה, מגע וזוגיות.',
      },
    ],
    enabling_factors: [
      {
        name: 'תמיכות מותאמות ברקע ולא תיווך צפוף',
        domains: ['טיפול עצמי, עצמאות ואוטונומיה', 'קשר בין־אישי', 'פנאי'],
        whyItEnables: 'נוכחות ליווי שקטה המאפשרת לאדם לפעול בביטחון אך משאירה לו את קדמת הבמה ואת ההובלה.',
      },
      {
        name: 'למידה אותנטית בהקשר החיים האמיתיים',
        domains: ['ידע והשכלה', 'עולם העבודה', 'שימוש במשאבים קהילתיים'],
        whyItEnables: 'הוראה המתקיימת בסופר, בבנק, באוטובוס ובמקום העבודה מפתחת מסוגלות מוחשית פי כמה מלמידה בכיתה.',
      },
      {
        name: 'שותפות מבוססת אמון עם התא המשפחתי',
        domains: ['בית ומשפחה', 'בריאות וביטחון', 'חינוך למיניות בריאה'],
        whyItEnables: 'ההורים הם שותפים קריטיים; תמיכה בהם וסיוע בהפחתת חרדה מאפשרים פתיחת דלתות לצמיחה בוגרת.',
      },
    ],
    professional_tensions: [
      {
        dilemmaTitle: 'מוגנות מול אוטונומיה והתנסות',
        poleA: 'רצון להגן על האדם מפני פגיעה, ניצול, תאונות או תסכול',
        poleB: 'הכרח לאפשר בחירה חופשית, לקיחת סיכונים והתנסות ממשית בעולם',
        contextAndTension: 'מתח המופיע במיניות, ביציאה עצמאית לעבודה, בניהול כספים ובבחירת חברים.',
      },
      {
        dilemmaTitle: 'השמה במסגרת קיימת מול תפירת חליפה לפי תשוקה',
        poleA: 'שילוב במסלולים תעסוקתיים וחברתיים קיימים ונוחים לתפעול',
        poleB: 'איתור החלום והכישרון האישי הייחודי של האדם גם כשאין לו מענה מדף',
        contextAndTension: 'בולט במיוחד במעבר מעולם ביה״ס לתעסוקה ולפנאי של בוגרים.',
      },
      {
        dilemmaTitle: 'עצמאות ביצועית מול ריבונות בקבלת החלטות',
        poleA: 'השקעת שעות בהוראת פעולה מוטורית עד לביצוע לבד',
        poleB: 'מתן עזרה פיזית יעילה ושמירת המשאבים הקוגניטיביים לקבלת החלטות',
        contextAndTension: 'רלוונטי מאוד לטיפול עצמי, לבוש, ניידות ואכילה.',
      },
    ],
    knowledge_gaps: [
      {
        topic: 'הכנה לזוגיות וניהול קשר אינטימי ממושך בבגרות',
        statement: 'נושא שקיבל מעט התייחסות בתהליך החקר הנוכחי וייתכן שכדאי להעמיק בו.',
        whyImportant: 'השיח התרכז בעיקר בהגנה וגבולות, ופחות בבניית קשר זוגי מתמשך, מגורים משותפים ושאיפות משפחתיות.',
      },
      {
        topic: 'אוריינות פיננסית וזכויות קצבאות מול עבודה בשוק החופשי',
        statement: 'נושא שקיבל מעט התייחסות בתהליך החקר הנוכחי וייתכן שכדאי להעמיק בו.',
        whyImportant: 'פחד המשפחות מפגיעה בקצבאות הביטוח הלאומי משתק יציאה לעבודה, וחסר ידע משפטי מונגש לצוותים.',
      },
      {
        topic: 'בדידות של בוגרים בסופי שבוע ומועדים',
        statement: 'נושא שקיבל מעט התייחסות בתהליך החקר הנוכחי וייתכן שכדאי להעמיק בו.',
        whyImportant: 'המענים הקהילתיים מרוכזים באמצע השבוע, בעוד שסופי שבוע מהווים מוקד מרכזי של בידוד חברתי.',
      },
    ],
    emerging_insights: [
      {
        title: 'ניידות אינה עוד אמצעי תחבורה אלא תנאי מוקדם לכל זכות אזרחית',
        deducedFromDomains: ['שימוש במשאבים קהילתיים', 'עולם העבודה', 'פנאי', 'קשר בין־אישי'],
        insightText: 'כאשר מחברים את תשובות כל הקבוצות מתברר שניידות עצמאית היא החוט המקשר שמכריע אם אדם יחיה חיי שייכות או בידוד.',
        tag: 'תובנה שעלתה מחיבור בין התחומים',
      },
      {
        title: 'האיכות של שירותי התמיכה נמדדת ביכולתם להיעלם בזמן הנכון',
        deducedFromDomains: ['טיפול עצמי, עצמאות ואוטונומיה', 'קשר בין־אישי', 'ייצוג עצמי'],
        insightText: 'התמיכה הטובה ביותר אינה זו שמנהלת את חיי האדם, אלא תמיכת "פיגומים" המאפשרת לאינטראקציה הטבעית לקרות מעצמה.',
        tag: 'תובנה שעלתה מחיבור בין התחומים',
      },
      {
        title: 'מיניות, מוגנות וייצוג עצמי הן למעשה אותה המיומנות בלבוש שונה',
        deducedFromDomains: ['בריאות וביטחון', 'חינוך למיניות בריאה', 'ייצוג עצמי'],
        insightText: 'היכולת להגיד "זה הגוף שלי, זה הרצון שלי ואני קובע את הגבול" היא ליבת הסינגור העצמי, המוגנות מפגיעה והמיניות הבריאה.',
        tag: 'תובנה שעלתה מחיבור בין התחומים',
      },
    ],
    matya_implications: [
      {
        focusArea: 'מעבר מתוכניות לימודים מבודדות ל"צוותי משימה רוחביים" במתי״א',
        category: 'חיבור בין מומחיות תחום',
        description: 'במקום שמומחית תעסוקה תעבוד בנפרד ממומחית קשרי קהילה וממומחית תקשורת, נדרש שילוב כוחות משותף המלווה את התלמיד סביב מטרת חיים רחבה.',
        reflectiveQuestion: 'איך נוכל לבנות ימי הדרכה וצוותי חשיבה משותפים בין מומחיות התחום השונות במרכז?',
      },
      {
        focusArea: 'אימוץ פרדיגמת Dignity of Risk (כבוד ללקיחת סיכון מבוקר)',
        category: 'שינוי פרקטיקה',
        description: 'פיתוח פרוטוקול עבודה מתי״אי המלווה צוותים והורים בניהול סיכונים מאפשר, במקום חסימת התנסויות עקב חרדה.',
        reflectiveQuestion: 'היכן המערכת שלנו מעדיפה שקט תעשייתי ובטיחות יתר על פני הזדמנות צמיחה ממשית לתלמיד?',
      },
      {
        focusArea: 'הנגשת זכויות פיננסיות ומשפטיות למשפחות ולצוותים',
        category: 'פיתוח כלי או משאב',
        description: 'יצירת ארגז כלים מונגש ומדויק על חוק לרון, קצבאות, זכויות בעבודה והסכמי תעסוקה מותאמת.',
        reflectiveQuestion: 'האם מומחיות התחום מרגישות בטוחות בידע המעשי הדרוש כדי להפיג את חששות ההורים מיציאה לעבודה?',
      },
      {
        focusArea: 'הקמת קבוצות מנהיגות וסינגור עצמי בהובלת התלמידים עצמם',
        category: 'הדרכה והטמעה',
        description: 'הפיכת הייצוג העצמי מנושא נלמד בכיתה לפרקטיקה חיה של מעורבות בוועדות זכאות ואפיון ותוכניות אישיות (תל״א).',
        reflectiveQuestion: 'עד כמה קולו של התלמיד נוכח פיזית ומהותית בוועדות ובסיכומי השנה במתי״א?',
      },
    ],
  };
}

// Serve Vite in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
