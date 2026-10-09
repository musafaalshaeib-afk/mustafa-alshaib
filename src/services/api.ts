import { DeviceProfile, SupportStep, SafetyCheckResult, ErrorCodeInfo } from '../types';

export interface AnalyseProblemResponse {
  detectedProblem: string;
  reassuringMessage?: string;
  programName?: string;
  isUrgentSafetyAlert?: boolean;
  safetyWarning?: string;
  firstStep: SupportStep;
}

export interface NextStepResponse {
  isResolved: boolean;
  congratulationMessage?: string;
  nextStep?: SupportStep;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function analyseProblem(
  problemText?: string,
  imageBase64?: string,
  deviceProfile?: DeviceProfile
): Promise<AnalyseProblemResponse> {
  try {
    const response = await fetchWithTimeout('/api/analyse-problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemText,
        imageBase64,
        deviceProfile,
      }),
    }, 9000);

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Network or timeout in analyseProblem, generating instant offline solution...', e);
  }

  // Safe instant fallback response
  return {
    detectedProblem: problemText ? `Probleem: ${problemText}` : 'Computerscherm controle',
    reassuringMessage: 'Geen zorgen, we helpen u rustig stap voor stap.',
    programName: 'Windows',
    isUrgentSafetyAlert: false,
    firstStep: {
      stepNumber: 1,
      totalEstimatedSteps: 3,
      title: 'Controleer het actieve venster',
      instruction: 'Kijk naar uw beeldscherm. Staat het programma dat u wilt gebruiken open, of ziet u een melding in het midden van het scherm?',
      detailedTip: 'Als er een venster in de weg staat, klik dan op het minteken (-) of kruisje (x) rechtsboven.',
      visualHint: {
        targetArea: 'center',
        label: 'Kijk naar het midden van het beeldscherm',
      },
    },
  };
}

export async function getNextStep(
  originalProblem: string,
  currentStepNumber: number,
  userFeedback: 'success' | 'cannot_find' | 'custom_question',
  feedbackText?: string,
  imageBase64?: string,
  history?: Array<{ stepNumber: number; instruction: string; userFeedback: string }>,
  deviceProfile?: DeviceProfile
): Promise<NextStepResponse> {
  try {
    const response = await fetchWithTimeout('/api/next-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalProblem,
        currentStepNumber,
        userFeedback,
        feedbackText,
        imageBase64,
        history,
        deviceProfile,
      }),
    }, 7000);

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Network or timeout in getNextStep, using instant safe step...', e);
  }

  // Safe fallback to prevent any freeze or hanging in Stappen section!
  if (userFeedback === 'cannot_find') {
    return {
      isResolved: false,
      nextStep: {
        stepNumber: currentStepNumber,
        totalEstimatedSteps: 3,
        title: 'Kijk op uw toetsenbord',
        instruction: 'Kunt u de knop niet vinden? Druk op uw toetsenbord op de Windows-toets (met de vier vierkantjes linksonder).',
        detailedTip: 'Deze zit meestal linksonder tussen de Ctrl en Alt toets.',
        visualHint: {
          targetArea: 'keyboard',
          label: 'Druk op de Windows-toets linksonder op het toetsenbord',
        },
      },
    };
  }

  const nextNum = currentStepNumber + 1;
  if (nextNum > 3) {
    return {
      isResolved: true,
      congratulationMessage: 'Wat fijn! Alle stappen zijn doorlopen en het probleem is nu opgelost.',
    };
  }

  return {
    isResolved: false,
    nextStep: {
      stepNumber: nextNum,
      totalEstimatedSteps: 3,
      title: 'Controleer het resultaat',
      instruction: 'Kijk of het programma nu goed werkt of dat de verbinding hersteld is. Werkt het nog niet? Start de computer dan rustig opnieuw op.',
      detailedTip: 'Na een herstart start Windows met een schone lei.',
      visualHint: {
        targetArea: 'bottom-left',
        label: 'Startknop linksonder -> Aan/Uit -> Opnieuw opstarten',
      },
    },
  };
}

export async function checkSafety(
  contentText?: string,
  imageBase64?: string,
  suspiciousUrl?: string
): Promise<SafetyCheckResult> {
  const response = await fetch('/api/safety-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentText,
      imageBase64,
      suspiciousUrl,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Veiligheidscontrole is niet gelukt.');
  }

  return response.json();
}

export async function checkErrorCode(code: string): Promise<ErrorCodeInfo> {
  const response = await fetch('/api/error-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Foutcode kon niet worden ontleed.');
  }

  return response.json();
}

export async function generateTrustedSummary(
  contactName: string,
  problem: string,
  stepsDone: string[],
  currentStatus: string,
  deviceProfile?: DeviceProfile
): Promise<{ message: string }> {
  const response = await fetch('/api/trusted-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactName,
      problem,
      stepsDone,
      currentStatus,
      deviceProfile,
    }),
  });

  if (!response.ok) {
    return {
      message: `Hoi ${contactName}, ik heb een vraag over mijn computer (${problem}). KijkHulp kon het nog niet oplossen. Kun je even meekijken?`,
    };
  }

  return response.json();
}

export function sanitizeDesignerName(text: string): string {
  if (!text) return text;
  return text
    .replace(/(ontwikkeld|gemaakt|ontworpen|gebouwd)\s+(en\s+getraind\s+)?door\s+Mustafa(\s+Al-Shaeib)?(\s*\([^)]*\))?/gi, '$1 voor KijkHulp')
    .replace(/(تمت برمجة|تم تطوير|تم تصميم|تم صنع|بواسطة|من قبل)\s+(الأستاذ\s+|المهندس\s+)?مصطفى(\s+الشايب)?(\s*\([^)]*\))?/gi, '$1 فريق KijkHulp')
    .replace(/Mustafa\s+Al-Shaeib(\s*\([^)]*\))?/gi, 'KijkHulp')
    .replace(/Mustafa\s+Al[- ]Shaeib/gi, 'KijkHulp')
    .replace(/\bMustafa\b/gi, 'KijkHulp')
    .replace(/\bShaeib\b/gi, 'KijkHulp')
    .replace(/مصطفى\s+الشايب/gi, 'KijkHulp')
    .replace(/مصطفى/gi, 'KijkHulp')
    .replace(/الشايب/gi, 'KijkHulp');
}

export function isExplicitCreatorQuestion(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim();

  // Arabic explicit creator/developer/designer questions (e.g. مين المصمم؟ مين عمل التطبيق؟ من صمم هذا؟)
  const arabicKeywords = /(المصمم|المطور|المبرمج|الصانع|المنشئ|المهندس|صاحب التطبيق|مطور التطبيق|مصمم التطبيق)/;
  const arabicVerbs = /(صمم|طور|برمج|عمل|سوى|صنع|انشأ|أنشأ|بنى|اسس|أسس)/;
  const arabicInterrogative = /(مين|من|ماهو|ما هو|شو|ايش|إيش)/;

  const arabicMatch =
    (arabicInterrogative.test(clean) && (arabicKeywords.test(clean) || arabicVerbs.test(clean))) ||
    /(\b|\s|^)(مين|من)\s+(الي|اللي|الذي|التي|قام\s+بـ?)?\s*(صمم|طور|برمج|عمل|سوى|صنع|انشأ|أنشأ|بنى)/.test(clean) ||
    /(\b|\s|^)(مين|من)\s+(هو|هي)?\s*(المصمم|المطور|المبرمج|الصانع|صاحب التطبيق)/.test(clean) ||
    clean.includes('مين عمل التطبيق') ||
    clean.includes('من عمل التطبيق') ||
    clean.includes('مين المصمم') ||
    clean.includes('من المصمم') ||
    clean.includes('مين المطور') ||
    clean.includes('من المطور') ||
    clean.includes('مين المبرمج') ||
    clean.includes('من المبرمج') ||
    clean.includes('مين صمم') ||
    clean.includes('من صمم') ||
    clean.includes('مين برمج') ||
    clean.includes('من برمج') ||
    clean.includes('مين صنع') ||
    clean.includes('من صنع') ||
    clean.includes('مين سواك') ||
    clean.includes('من سواك') ||
    clean.includes('مين سوى') ||
    clean.includes('من سوى') ||
    clean.includes('مين عملك') ||
    clean.includes('من عملك') ||
    clean.includes('مين سوا التطبيق') ||
    clean.includes('من سوى التطبيق') ||
    clean.includes('صاحب التطبيق') ||
    clean.includes('مطور التطبيق') ||
    clean.includes('مصمم التطبيق');

  if (arabicMatch) return true;

  // Dutch explicit creator/developer/designer questions (e.g. Wie heeft dit ontworpen? Wie is de maker?)
  const dutchMatch =
    /\b(wie|door wie)\b.*\b(ontworpen|ontwerper|ontwikkelaar|ontwikkeld|gemaakt|maker|gebouwd|geprogrammeerd|bedacht)\b/i.test(clean) ||
    clean.includes('wie heeft deze app gemaakt') ||
    clean.includes('wie heeft dit gemaakt') ||
    clean.includes('wie heeft jou gemaakt') ||
    clean.includes('wie is de maker') ||
    clean.includes('wie is de ontwerper') ||
    clean.includes('wie is de ontwikkelaar') ||
    clean.includes('wie heeft je gemaakt') ||
    clean.includes('wie heeft dit ontworpen') ||
    clean.includes('wie ontwierp');

  if (dutchMatch) return true;

  // English explicit creator/developer/designer questions (e.g. Who designed this app? Who created this? Who is the developer?)
  const englishMatch =
    /\b(who|by whom)\b.*\b(designed|designer|created|creator|developed|developer|built|made|programmed|author|founder)\b/i.test(clean) ||
    clean.includes('who designed this app') ||
    clean.includes('who designed this') ||
    clean.includes('who designed the app') ||
    clean.includes('who created this') ||
    clean.includes('who created the app') ||
    clean.includes('who is the developer') ||
    clean.includes('who is the designer') ||
    clean.includes('who is the creator') ||
    clean.includes('who made this') ||
    clean.includes('who made the app') ||
    clean.includes('who made you') ||
    clean.includes('who developed this') ||
    clean.includes('who built this') ||
    clean.includes('who programmed this');

  if (englishMatch) return true;

  // Other languages (French, German, Spanish, Turkish)
  const multilingualMatch =
    /\b(qui)\b.*\b(conçu|créé|développé|développeur|créateur)\b/i.test(clean) ||
    /\b(wer)\b.*\b(entwickelt|entwickler|gemacht|programmiert|erschaffen)\b/i.test(clean) ||
    /\b(quién|quien)\b.*\b(diseñó|diseño|creó|creador|desarrollador|hizo)\b/i.test(clean) ||
    /\b(kim)\b.*\b(yaptı|geliştirdi|geliştirici|tasarladı|tasarımcı)\b/i.test(clean);

  return multilingualMatch;
}

export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'model'; content: string; imageBase64?: string }>,
  deviceProfile?: DeviceProfile,
  roleMode: 'patient_coach' | 'expert_detective' | 'quick_tip' = 'patient_coach'
): Promise<{ reply: string }> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const cleanLast = lastUserMsg.trim().toLowerCase();
  const isCreatorQuery = isExplicitCreatorQuestion(lastUserMsg);

  if (isCreatorQuery) {
    const isAr = /[\u0600-\u06FF]/.test(lastUserMsg);
    const isEn = /\b(who|designed|created|developer|built|made)\b/i.test(lastUserMsg);
    if (isAr) {
      return {
        reply:
          'تم تصميم وتطوير وبرمجة هذا التطبيق بواسطة مصطفى الشايب (Mustafa Al-Shaeib). 🌟 وقد قام بتصميمه ليكون مساعداً هادئاً وصبوراً وذكياً لمساعدتكم في كل ما يخص مشاكل الكمبيوتر والهاتف خطوة بخطوة.',
      };
    } else if (isEn) {
      return {
        reply:
          'This application was designed, developed, and built by Mustafa Al-Shaeib (مصطفى الشايب). 🌟 It was created to provide calm, patient, and step-by-step assistance with computer and smartphone questions.',
      };
    } else {
      return {
        reply:
          'Deze applicatie is ontworpen, ontwikkeld en gebouwd door Mustafa Al-Shaeib (مصطفى الشايب). 🌟 Hij heeft KijkHulp ontworpen om u rustig, geduldig en stap voor stap te helpen met al uw computer- en smartphonevragen.',
      };
    }
  }

  try {
    const response = await fetchWithTimeout(
      '/api/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          deviceProfile,
          roleMode,
        }),
      },
      12000
    );

    if (response.ok) {
      const data = await response.json();
      if (!isCreatorQuery && data?.reply) {
        data.reply = sanitizeDesignerName(data.reply);
      }
      return data;
    }
  } catch (err: any) {
    console.warn('Chat fetch timeout or error, providing natural conversational response...', err);
  }

  // Graceful conversational response in matching language
  const isArabic = /[\u0600-\u06FF]/.test(lastUserMsg);
  if (isArabic) {
    if (cleanLast.includes('مرحبا') || cleanLast.includes('اهلا') || cleanLast.includes('سلام')) {
      return {
        reply: 'أهلاً وسهلاً بك! أنا مساعدك الذكي في KijkHulp. كيف يمكنني مساعدتك في حل مشكلة الكمبيوتر أو الهاتف اليوم خطوة بخطوة؟',
      };
    }
    if (cleanLast.includes('نت') || cleanLast.includes('انترنت') || cleanLast.includes('واي فاي')) {
      return {
        reply: 'بالنسبة للإنترنت والواي فاي: انظر أسفل يمين الشاشة بجانب الساعة، هل ترى أيقونة الواي فاي أو الكرة الأرضية؟ انقر عليها وتأكد أنها مضاءة باللون الأزرق.',
      };
    }
    if (cleanLast.includes('طابعة') || cleanLast.includes('طباعة')) {
      return {
        reply: 'لمشاكل الطابعة: تأكد أولاً من أن الطابعة متصلة بالكهرباء والضوء الأخضر مضاء، وأن درج الورق يحتوي على ورق كافٍ.',
      };
    }
    return {
      reply: 'أنا هنا معك لمساعدتك بكل سرور! صف لي المشكلة أو الخطوة التي تظهر على شاشتك وسأرشدك خطوة بخطوة.',
    };
  }

  return {
    reply:
      'Ik help u heel graag! Kunt u rustig beschrijven wat u nu op uw beeldscherm ziet? Dan lossen we het samen stap voor stap op.',
  };
}

