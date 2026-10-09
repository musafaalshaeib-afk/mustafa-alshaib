import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

// Health check endpoints for Cloud Run and container orchestrators
app.get(['/health', '/healthz', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'KijkHulp' });
});

// Trust reverse proxy headers (Cloud Run, Nginx, HTTPS proxies)
app.set('trust proxy', true);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in preference order (lite models have separate quota pools)
const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

async function generateWithModelFallback(params: any) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      // Set a 7-second timeout per model so it never hangs or freezes
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 7000ms for ${model}`)), 7000)
      );

      const requestPromise = ai.models.generateContent({
        ...params,
        model,
      });

      const res = (await Promise.race([requestPromise, timeoutPromise])) as any;
      return res;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 0;
      console.log(`[AI] Model ${model} temporarily unavailable (status ${status}). Trying next model...`);
      // Brief pause on 429 rate limit before switching model pool
      if (status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }
  throw lastError;
}

const KIJKHULP_SYSTEM_PROMPT = `
Je bent KijkHulp, een uiterst geduldige, warme en vriendelijke computerhulp voor Nederlandse senioren en mensen met weinig computerervaring.

GOUDEN REGELS:
1. Communiceer ALTIJD in eenvoudig, geruststellend Nederlands (taalniveau A2/B1).
2. Gebruik korte zinnen. Vermijd technische vaktermen. Als een term noodzakelijk is (zoals 'Wi-Fi'), leg hem direct simpel uit.
3. Geef ALTIJD SLECHTS ÉÉN DUIDELIJKE ACTIE PER STAP. Nooit lijstjes van 1, 2, 3 tegelijk!
4. Geef nooit gevaarlijke instructies (geen register-aanpassingen, geen BIOS, geen systeembestanden wissen, geen Windows herinstallaties).
5. Vraag NOOIT om wachtwoorden, pincodes, bankgegevens, DigiD, of herstelcodes.
6. Als je ook maar een vermoeden van oplichting, nep-Microsoft helpdesk, valse pop-ups, telefoontjes of verzoeken om AnyDesk / TeamViewer / geld overmaken herkent: waarschuw direct met een STOP-alarm.
7. Als een screenshot gevoelige informatie bevat, noem die niet onnodig.
8. Geef bij elke stap aan waar de gebruiker moet kijken of klikken (bijvoorbeeld: 'Kijk linksonder', 'Kijk rechtsonder', 'Op het toetsenbord').
9. Wees bemoedigend en geruststellend (bijvoorbeeld: 'Maakt u zich geen zorgen, we lossen dit stap voor stap op.').
`;

function fallbackAnalyseProblem(problemText?: string, imageBase64?: string, deviceProfile?: any) {
  const query = (problemText || '').toLowerCase();
  
  if (query.includes('wifi') || query.includes('wi-fi') || query.includes('internet') || query.includes('verbinding') || query.includes('online')) {
    return {
      detectedProblem: 'Uw computer heeft geen verbinding met Wi-Fi of internet.',
      reassuringMessage: 'Geen zorgen, dit komt vaak voor en lossen we rustig samen op.',
      programName: 'Wi-Fi & Internet',
      isUrgentSafetyAlert: false,
      firstStep: {
        stepNumber: 1,
        totalEstimatedSteps: 3,
        title: 'Kijk rechtsonder op het beeldscherm',
        instruction: 'Kijk helemaal rechtsonder op uw scherm naast de klok. Ziet u daar een Wi-Fi boogje of een wereldbolletje? Klik daar één keer op met de linkermuisknop.',
        detailedTip: 'Dit icoon opent de lijst met beschikbare netwerken.',
        visualHint: {
          targetArea: 'bottom-right' as const,
          label: 'Klik op het Wi-Fi of Wereldbol symbool rechtsonder',
          positionX: 92,
          positionY: 94,
        },
      },
    };
  }

  if (query.includes('printer') || query.includes('printen') || query.includes('afdrukken') || query.includes('papier')) {
    return {
      detectedProblem: 'De printer reageert niet of staat offline.',
      reassuringMessage: 'We gaan eerst rustig de eenvoudigste dingen controleren.',
      programName: 'Printer',
      isUrgentSafetyAlert: false,
      firstStep: {
        stepNumber: 1,
        totalEstimatedSteps: 3,
        title: 'Controleer of de printer aanstaat',
        instruction: 'Kijk naar uw printer. Brandt het aan/uit-lampje op de printer zelf?',
        detailedTip: 'Als er geen lampje brandt, druk dan één keer op de aan/uit knop van de printer.',
        visualHint: {
          targetArea: 'center' as const,
          label: 'Aan/uit knop op de printer',
        },
      },
    };
  }

  if (query.includes('traag') || query.includes('langzaam') || query.includes('wachten') || query.includes('cirkel')) {
    return {
      detectedProblem: 'De computer is erg langzaam of programma\'s reageren traag.',
      reassuringMessage: 'We gaan het geheugen van de computer even rustig ontlasten.',
      programName: 'Windows',
      isUrgentSafetyAlert: false,
      firstStep: {
        stepNumber: 1,
        totalEstimatedSteps: 2,
        title: 'Sluit programma\'s die u niet gebruikt',
        instruction: 'Kijk naar de balk helemaal onderaan het scherm. Sluit vensters die u nu niet nodig heeft met het rode kruisje (x) rechtsboven.',
        detailedTip: 'Te veel geopende programma\'s vertragen de computer.',
        visualHint: {
          targetArea: 'top-right' as const,
          label: 'Kruisje rechtsboven om venster te sluiten',
          positionX: 98,
          positionY: 4,
        },
      },
    };
  }

  if (query.includes('geluid') || query.includes('horen') || query.includes('stil') || query.includes('audio') || query.includes('volume')) {
    return {
      detectedProblem: 'Er komt geen geluid uit de computer.',
      reassuringMessage: 'Vaak staat het volume per ongeluk uit of gedempt.',
      programName: 'Audio & Geluid',
      isUrgentSafetyAlert: false,
      firstStep: {
        stepNumber: 1,
        totalEstimatedSteps: 2,
        title: 'Kijk rechtsonder naar het luidsprekertje',
        instruction: 'Kijk rechtsonder op het beeldscherm naast de klok. Ziet u een luidsprekertje? Klik erop en schuif het volume omhoog naar ongeveer 70%.',
        detailedTip: 'Controleer ook of er geen koptelefoon meer in de computer zit.',
        visualHint: {
          targetArea: 'bottom-right' as const,
          label: 'Luidspreker icoon rechtsonder',
          positionX: 88,
          positionY: 95,
        },
      },
    };
  }

  return {
    detectedProblem: problemText ? `Probleem: ${problemText}` : 'Computerscherm geanalyseerd.',
    reassuringMessage: 'Geen zorgen, we helpen u rustig stap voor stap.',
    programName: 'Windows',
    isUrgentSafetyAlert: false,
    firstStep: {
      stepNumber: 1,
      totalEstimatedSteps: 2,
      title: 'Computer rustig opnieuw opstarten',
      instruction: 'Klik linksonder op de Windows startknop, klik op het Aan/Uit icoon en kies "Opnieuw opstarten".',
      detailedTip: 'Veel computerproblemen worden direct verholpen door een frisse herstart.',
      visualHint: {
        targetArea: 'bottom-left' as const,
        label: 'Startknop linksonder -> Aan/Uit -> Opnieuw opstarten',
        positionX: 3,
        positionY: 96,
      },
    },
  };
}

/**
 * Endpoint: POST /api/analyse-problem
 * Analyseren van probleem (tekst + optionele screenshot + apparaatprofiel)
 */
app.post('/api/analyse-problem', async (req: Request, res: Response) => {
  try {
    const { problemText, imageBase64, deviceProfile } = req.body;

    if (!problemText && !imageBase64) {
      return res.json(fallbackAnalyseProblem(problemText, imageBase64, deviceProfile));
    }

    if (!apiKey) {
      return res.json(fallbackAnalyseProblem(problemText, imageBase64, deviceProfile));
    }

    const contents: any[] = [];
    let prompt = `De gebruiker vraagt hulp bij een computerprobleem.\n`;

    if (deviceProfile) {
      prompt += `Apparaatprofiel van gebruiker:
- Windows versie: ${deviceProfile.windowsVersion || 'Onbekend'}
- Apparaat type: ${deviceProfile.deviceType || 'Onbekend'}
- Merk: ${deviceProfile.brand || 'Onbekend'}
- Browser: ${deviceProfile.browser || 'Onbekend'}
- Printer: ${deviceProfile.printerBrand || 'Onbekend'}\n\n`;
    }

    if (problemText) {
      prompt += `Probleembeschrijving van de gebruiker: "${problemText}"\n\n`;
    }

    if (imageBase64) {
      prompt += `De gebruiker heeft een foto van het beeldscherm meegestuurd. Analyseer het venster, eventuele foutmeldingen, actieve knoppen en herkenbare iconen op het scherm.\n`;
      // Clean base64 header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    prompt += `
Bepaal:
1. Wat het concrete probleem is (in maximaal 1 hele eenvoudige zin in A2-Nederlands).
2. Welk programma eventueel openstaat.
3. Wat de ALLEREERSTE, ENKELE, VEILIGSTE actie is die de gebruiker nu moet doen (Stap 1).
4. Waar op het scherm de gebruiker moet kijken of klikken (targetArea: bottom-left, bottom-right, top-left, top-right, center, keyboard, of cable).
5. Of er een veiligheidsrisico is (bijv. nepvirus melding of oplichting).
`;

    contents.push({ text: prompt });

    let parsed: any = null;

    try {
      const response = await generateWithModelFallback({
        contents: contents,
        config: {
          systemInstruction: KIJKHULP_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedProblem: {
                type: Type.STRING,
                description: 'Korte diagnose in eenvoudige taal (bijv: "Uw computer heeft geen verbinding met internet.")',
              },
              reassuringMessage: {
                type: Type.STRING,
                description: 'Korte bemoedigende zin (bijv: "Geen zorgen, we lossen dit rustig stap voor stap op.")',
              },
              programName: {
                type: Type.STRING,
                description: 'Naam van het programma dat zichtbaar is indien van toepassing',
              },
              isUrgentSafetyAlert: {
                type: Type.BOOLEAN,
                description: 'True als dit phishing, nep-support of een oplichtingspoging is',
              },
              safetyWarning: {
                type: Type.STRING,
                description: 'Waarschuwing als er sprake is van een veiligheidsrisico',
              },
              firstStep: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  totalEstimatedSteps: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: 'Korte duidelijke titel van de actie' },
                  instruction: { type: Type.STRING, description: 'Slechts ÉÉN enkele handeling in rustig Nederlands' },
                  detailedTip: { type: Type.STRING, description: 'Optionele geruststellende tip' },
                  visualHint: {
                    type: Type.OBJECT,
                    properties: {
                      targetArea: {
                        type: Type.STRING,
                        enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center', 'keyboard', 'cable'],
                      },
                      label: { type: Type.STRING, description: 'Korte aanduiding van de knop of plek' },
                      positionX: { type: Type.NUMBER, description: 'Geschatte percentage X op het scherm (0-100)' },
                      positionY: { type: Type.NUMBER, description: 'Geschatte percentage Y op het scherm (0-100)' },
                    },
                    required: ['targetArea', 'label'],
                  },
                },
                required: ['stepNumber', 'title', 'instruction'],
              },
            },
            required: ['detectedProblem', 'firstStep'],
          },
        },
      });

      const text = response.text || '{}';
      parsed = JSON.parse(text);
    } catch (_modelErr: any) {
      console.log('[AI Fallback] Analyse problem fallback served');
      parsed = fallbackAnalyseProblem(problemText, imageBase64, deviceProfile);
    }

    if (!parsed || !parsed.firstStep) {
      parsed = fallbackAnalyseProblem(problemText, imageBase64, deviceProfile);
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Final fallback in /api/analyse-problem:', error);
    return res.json(fallbackAnalyseProblem(req.body.problemText, req.body.imageBase64, req.body.deviceProfile));
  }
});

function generateFallbackNextStep(currentStepNumber: number = 1, userFeedback: string = 'success') {
  const stepNum = currentStepNumber + 1;
  if (userFeedback === 'cannot_find') {
    return {
      isResolved: false,
      nextStep: {
        stepNumber: currentStepNumber,
        totalEstimatedSteps: 3,
        title: 'Geen probleem, we proberen het zo:',
        instruction: 'Kijk naar uw toetsenbord. Ziet u linksonder de Windows-toets (met de 4 vierkantjes)? Druk daar één keer op.',
        detailedTip: 'Deze toets zit meestal tussen de Ctrl en Alt toets linksonder.',
        visualHint: {
          targetArea: 'keyboard' as const,
          label: 'Druk op de Windows-toets op uw toetsenbord',
        },
      },
    };
  }

  if (stepNum > 3) {
    return {
      isResolved: true,
      congratulationMessage: 'Wat fijn! Alle stappen zijn voltooid en het probleem zou nu opgelost moeten zijn.',
    };
  }

  return {
    isResolved: false,
    nextStep: {
      stepNumber: stepNum,
      totalEstimatedSteps: 3,
      title: 'Controleer het resultaat',
      instruction: 'Kijk of het programma nu opent of dat de verbinding weer hersteld is. Werkt het nog niet? Start de computer dan een keertje rustig opnieuw op.',
      detailedTip: 'Na een herstart start Windows met een schone lei.',
      visualHint: {
        targetArea: 'bottom-left' as const,
        label: 'Startknop linksonder -> Aan/Uit -> Opnieuw opstarten',
      },
    },
  };
}

/**
 * Endpoint: POST /api/next-step
 * Bepalen van de volgende stap na feedback van de gebruiker ("Gelukt", "Ik zie dit niet", of nieuwe foto)
 */
app.post('/api/next-step', async (req: Request, res: Response) => {
  try {
    const {
      originalProblem,
      currentStepNumber,
      userFeedback, // 'success' | 'cannot_find' | 'custom_question'
      feedbackText,
      imageBase64,
      history,
      deviceProfile,
    } = req.body;

    if (!apiKey) {
      return res.json(generateFallbackNextStep(currentStepNumber || 1, userFeedback));
    }

    const contents: any[] = [];
    let prompt = `De gebruiker is bezig met een stappenplan voor het probleem: "${originalProblem}".\n`;

    if (deviceProfile) {
      prompt += `Apparaat: ${deviceProfile.deviceType} (${deviceProfile.windowsVersion || 'Windows'})\n`;
    }

    if (history && history.length > 0) {
      prompt += `Eerdere stappen:\n`;
      history.forEach((h: any) => {
        prompt += `- Stap ${h.stepNumber}: "${h.instruction}" (Resultaat: ${h.userFeedback})\n`;
      });
    }

    prompt += `\nHuidige stap was Stap ${currentStepNumber}.\n`;

    if (userFeedback === 'cannot_find') {
      prompt += `Gebruikersfeedback: De gebruiker kan de knop of plek NIET vinden ("Ik zie dit niet").
Geef een veel eenvoudigere alternatieve manier of een nog duidelijkere aanwijzing (bijvoorbeeld een sneltoets op het toetsenbord, of een andere herkenbare plek).
Blijf bij exact ÉÉN eenvoudige handeling.`;
    } else if (userFeedback === 'success') {
      prompt += `Gebruikersfeedback: De vorige stap is GELUKT!
Bepaal of het probleem nu vermoedelijk al is opgelost (isResolved: true) of geef de ENKELE volgende veilige stap ${currentStepNumber + 1}.`;
    } else if (feedbackText) {
      prompt += `De gebruiker heeft een vraag of opmerking ingevoerd: "${feedbackText}".
Reageer uiterst vriendelijk en geduldig en geef de volgende enkele actie.`;
    }

    if (imageBase64) {
      prompt += `\nDe gebruiker heeft een nieuwe foto van het scherm gemaakt om de voortgang te tonen. Kijk of de eerdere stap al zichtbaar is voltooid en wat nu de volgende actie is.\n`;
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    contents.push({ text: prompt });

    const response = await generateWithModelFallback({
      contents: contents,
      config: {
        systemInstruction: KIJKHULP_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isResolved: {
              type: Type.BOOLEAN,
              description: 'True als het probleem nu succesvol is opgelost',
            },
            congratulationMessage: {
              type: Type.STRING,
              description: 'Fijne felicitatie als het opgelost is (bijv: "Wat fijn dat het gelukt is! Uw computer werkt weer.")',
            },
            nextStep: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                totalEstimatedSteps: { type: Type.INTEGER },
                title: { type: Type.STRING },
                instruction: { type: Type.STRING, description: 'Slechts ÉÉN enkele handeling in eenvoudig Nederlands' },
                detailedTip: { type: Type.STRING },
                visualHint: {
                  type: Type.OBJECT,
                  properties: {
                    targetArea: {
                      type: Type.STRING,
                      enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center', 'keyboard', 'cable'],
                    },
                    label: { type: Type.STRING },
                    positionX: { type: Type.NUMBER },
                    positionY: { type: Type.NUMBER },
                  },
                  required: ['targetArea', 'label'],
                },
              },
              required: ['stepNumber', 'title', 'instruction'],
            },
          },
          required: ['isResolved'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (_error: any) {
    console.log('[AI Fallback] Next step fallback served');
    const stepNum = (req.body.currentStepNumber || 1) + 1;
    
    if (req.body.userFeedback === 'cannot_find') {
      return res.json({
        isResolved: false,
        nextStep: {
          stepNumber: req.body.currentStepNumber || 1,
          totalEstimatedSteps: 3,
          title: 'Geen probleem, we proberen het zo:',
          instruction: 'Kijk naar uw toetsenbord. Ziet u linksonder de Windows-toets (met de 4 vierkantjes)? Druk daar één keer op.',
          detailedTip: 'Deze toets zit meestal tussen de Ctrl en Alt toets linksonder.',
          visualHint: {
            targetArea: 'keyboard',
            label: 'Druk op de Windows-toets op uw toetsenbord',
          },
        },
      });
    }

    if (stepNum > 3) {
      return res.json({
        isResolved: true,
        congratulationMessage: 'Wat fijn! Alle stappen zijn voltooid en het probleem zou nu opgelost moeten zijn.',
      });
    }

    return res.json({
      isResolved: false,
      nextStep: {
        stepNumber: stepNum,
        totalEstimatedSteps: 3,
        title: 'Controleer het resultaat',
        instruction: 'Kijk of het programma nu opent of dat de verbinding weer hersteld is. Werkt het nog niet? Start de computer dan een keertje rustig opnieuw op.',
        detailedTip: 'Na een herstart start Windows met een schone lei.',
        visualHint: {
          targetArea: 'bottom-left',
          label: 'Startknop linksonder -> Aan/Uit -> Opnieuw opstarten',
        },
      },
    });
  }
});

/**
 * Endpoint: POST /api/safety-check
 * Inspecteert e-mails, sms'jes, websites of pop-ups op fraude / oplichting / malware
 */
app.post('/api/safety-check', async (req: Request, res: Response) => {
  try {
    const { contentText, imageBase64, suspiciousUrl } = req.body;

    if (!contentText && !imageBase64 && !suspiciousUrl) {
      return res.status(400).json({ error: 'Geen inhoud meegegeven om te controleren' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API sleutel is niet geconfigureerd op de server' });
    }

    const contents: any[] = [];
    let prompt = `Beoordeel de veiligheid van dit bericht, deze website of dit beeldscherm voor een senior.\n\n`;

    if (contentText) {
      prompt += `Tekst van het bericht:\n"""${contentText}"""\n\n`;
    }

    if (suspiciousUrl) {
      prompt += `Link of websiteadres: ${suspiciousUrl}\n\n`;
    }

    if (imageBase64) {
      prompt += `Er is een screenshot/foto bijgevoegd van het bericht of de pop-up.\n`;
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    prompt += `
Controleer specifiek op:
1. Valse Microsoft / Windows Helpdesk waarschuwingen ("Uw computer is geblokkeerd", "Bel direct 0800...").
2. Valse bankberichten (ING, Rabobank, ABN AMRO, SNS, DigiD, CJIB, Belastingdienst, PostNL, DHL).
3. Verzoeken om AnyDesk, TeamViewer, UltraViewer of andere software voor hulp op afstand te installeren.
4. Verzoeken om geld over te maken, tikkies, of inlogcodes/pincodes door te geven.
5. Valse virusmeldingen in de browser.

Geef direct en onomwonden advies in heldere Nederlandse taal.`;

    contents.push({ text: prompt });

    let parsed: any = null;

    try {
      const response = await generateWithModelFallback({
        contents: contents,
        config: {
          systemInstruction: KIJKHULP_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isDangerous: { type: Type.BOOLEAN },
              riskLevel: {
                type: Type.STRING,
                enum: ['safe', 'suspicious', 'dangerous'],
              },
              headline: {
                type: Type.STRING,
                description: 'Grote duidelijke kop (bijv: "⚠️ STOP - Dit is een gevaarlijk nepbericht" of "Dit bericht lijkt veilig")',
              },
              explanation: {
                type: Type.STRING,
                description: 'Rustige, heldere uitleg waarom het gevaarlijk of veilig is (2-3 zinnen, A2 niveau)',
              },
              warningActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lijst met 2-3 dingen die de gebruiker ABSOLUUT NIET moet doen (bijv: "Klik niet op de link", "Geef geen codes door")',
              },
              safeNextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lijst met 2-3 veilige acties (bijv: "Sluit dit tabblad direct af", "Verwijder het sms-bericht")',
              },
              trustedContactAdvice: {
                type: Type.STRING,
                description: 'Advies om een vertrouwd familielid te bellen als er twijfel is',
              },
            },
            required: ['isDangerous', 'riskLevel', 'headline', 'explanation', 'warningActions', 'safeNextSteps'],
          },
        },
      });

      const text = response.text || '{}';
      parsed = JSON.parse(text);
    } catch (_modelErr: any) {
      console.log('[AI Fallback] Safety-check fallback served');
      const combined = `${contentText || ''} ${suspiciousUrl || ''}`.toLowerCase();
      const isSus =
        combined.includes('anydesk') ||
        combined.includes('teamviewer') ||
        combined.includes('remote') ||
        combined.includes('digid') ||
        combined.includes('bank') ||
        combined.includes('ing') ||
        combined.includes('rabobank') ||
        combined.includes('abn') ||
        combined.includes('0800') ||
        combined.includes('blokkeerd') ||
        combined.includes('geblokkeerd') ||
        combined.includes('virus') ||
        combined.includes('overmaken') ||
        combined.includes('pincode') ||
        combined.includes('wachtwoord') ||
        combined.includes('bel nu') ||
        combined.includes('microsoft');

      if (isSus) {
        parsed = {
          isDangerous: true,
          riskLevel: 'dangerous',
          headline: '⚠️ STOP - Zeer verdacht bericht of pop-up!',
          explanation:
            'Dit bericht lijkt sterk op een poging tot oplichting of phishing. Officiële instanties zoals banken of Microsoft vragen u nooit om programma\'s te installeren of codes door te geven.',
          warningActions: [
            'Klik nergens op en open geen bijlagen.',
            'Installeer geen AnyDesk, TeamViewer of andere hulp-software.',
            'Geef nooit uw pincode, inlogcode of bankgegevens door.',
          ],
          safeNextSteps: [
            'Sluit het tabblad of venster met het rode kruisje rechtsboven.',
            'Verwijder het sms- of e-mailbericht.',
            'Bel bij twijfel een vertrouwd familielid.',
          ],
          trustedContactAdvice: 'Bel een vertrouwd familielid om dit bericht samen te controleren.',
        };
      } else {
        parsed = {
          isDangerous: false,
          riskLevel: 'safe',
          headline: 'Geen directe gevaren herkend',
          explanation:
            'We zien geen directe tekenen van oplichting. Blijf echter altijd voorzichtig met vreemde links of verzoeken om betalingen.',
          warningActions: ['Deel nooit gevoelige bank- of inloggegevens.'],
          safeNextSteps: ['U kunt veilig doorgaan als u de afzender kent.'],
          trustedContactAdvice: 'Bij blijvende twijfel kunt u altijd even overleggen met familie.',
        };
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Final error in /api/safety-check:', error);
    return res.json({
      isDangerous: true,
      riskLevel: 'suspicious',
      headline: '⚠️ Voorzichtigheid geboden',
      explanation: 'We raden aan om voorzichtig te zijn en nergens op te klikken totdat een familielid heeft meegekeken.',
      warningActions: ['Klik niet op vreemde links.', 'Geef geen bankgegevens door.'],
      safeNextSteps: ['Sluit het venster.', 'Overleg met familie.'],
    });
  }
});

/**
 * Endpoint: POST /api/error-code
 * Ontcijfert Windows foutcodes (zoals 0x80070005) in kindertaal
 */
app.post('/api/error-code', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Geen foutcode opgegeven' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API sleutel is niet geconfigureerd' });
    }

    let parsed: any = null;

    try {
      const response = await generateWithModelFallback({
        contents: `De gebruiker ziet de volgende computer foutcode op het scherm: "${code}".
Leg in heel eenvoudig Nederlands (A2 niveau) uit:
1. Wat betekent deze foutcode in gewone mensentaal?
2. Is het gevaarlijk voor de computer of bestanden?
3. Wat kan de gebruiker zelf rustig proberen?
4. Wat is de allereerste eenvoudige actie (Stap 1)?`,
        config: {
          systemInstruction: KIJKHULP_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              meaning: { type: Type.STRING, description: 'Korte betekenis in 1 zin' },
              isDangerous: { type: Type.BOOLEAN, description: 'Vrijwel altijd false voor standaard foutmeldingen' },
              simpleExplanation: { type: Type.STRING, description: 'Uitleg in rustige taal zonder jargon' },
              safeAttempt: { type: Type.STRING, description: 'Wat we nu gaan proberen' },
              firstStep: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  totalEstimatedSteps: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                  detailedTip: { type: Type.STRING },
                  visualHint: {
                    type: Type.OBJECT,
                    properties: {
                      targetArea: {
                        type: Type.STRING,
                        enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center', 'keyboard', 'cable'],
                      },
                      label: { type: Type.STRING },
                    },
                    required: ['targetArea', 'label'],
                  },
                },
                required: ['stepNumber', 'title', 'instruction'],
              },
            },
            required: ['code', 'meaning', 'isDangerous', 'simpleExplanation', 'firstStep'],
          },
        },
      });

      const text = response.text || '{}';
      parsed = JSON.parse(text);
    } catch (_modelErr: any) {
      console.log('[AI Fallback] Error-code fallback served');
      parsed = {
        code: code,
        meaning: 'Toegangs- of verbindingsfout in Windows',
        isDangerous: false,
        simpleExplanation:
          'Windows kon een bestand of update tijdelijk niet laden of openen. Uw computer en bestanden zijn gewoon veilig.',
        safeAttempt: 'We controleren de internetverbinding en herstarten de computer.',
        firstStep: {
          stepNumber: 1,
          totalEstimatedSteps: 2,
          title: 'Computer opnieuw opstarten',
          instruction:
            'Start de computer een keertje rustig opnieuw op via het Windows Startmenu linksonder. Dit wist tijdelijke blokkades.',
          detailedTip: 'Klik linksonder op Start -> Aan/Uit -> Opnieuw opstarten.',
          visualHint: {
            targetArea: 'bottom-left' as const,
            label: 'Startknop linksonder -> Opnieuw opstarten',
          },
        },
      };
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/error-code:', error);
    return res.json({
      code: req.body.code || 'Onbekend',
      meaning: 'Systeemmelding',
      isDangerous: false,
      simpleExplanation: 'Er is een tijdelijke Windows melding opgetreden. Uw bestanden zijn veilig.',
      safeAttempt: 'Start de computer opnieuw op.',
      firstStep: {
        stepNumber: 1,
        totalEstimatedSteps: 2,
        title: 'Herstart de computer',
        instruction: 'Sluit geopende vensters en start uw computer opnieuw op via de Startknop linksonder.',
        visualHint: {
          targetArea: 'bottom-left' as const,
          label: 'Startknop linksonder',
        },
      },
    });
  }
});

/**
 * Endpoint: POST /api/trusted-summary
 * Genereert een helder WhatsApp/SMS bericht voor een familielid
 */
app.post('/api/trusted-summary', async (req: Request, res: Response) => {
  try {
    const { contactName, problem, stepsDone, currentStatus, deviceProfile } = req.body;

    const prompt = `Maak een kort, duidelijk en beleefd WhatsApp-berichtje dat een senior naar hun vertrouwde contactpersoon (${contactName || 'familielid'}) kan sturen.
Probleem: ${problem}
Apparaat: ${deviceProfile ? `${deviceProfile.deviceType} (${deviceProfile.brand}, ${deviceProfile.windowsVersion})` : 'computer'}
Al geprobeerd met KijkHulp: ${stepsDone && stepsDone.length > 0 ? stepsDone.join('; ') : 'Nog niet gelukt'}
Huidige status: ${currentStatus || 'Hulp nodig'}

Schrijf het berichtje in de ik-vorm (alsof de senior het zelf stuurt). Houd het kort, duidelijk en vriendelijk.`;

    const response = await generateWithModelFallback({
      contents: prompt,
      config: {
        systemInstruction: 'Je genereert een kort, vriendelijk en informatief WhatsApp/SMS berichtje voor familie.',
      },
    });

    const message = response.text?.trim() || `Hoi ${contactName || ''}, ik heb een vraagje over mijn computer (${problem}). Zou je mij een keertje kunnen helpen?`;
    return res.json({ message });
  } catch (_error: any) {
    console.log('[AI Fallback] Trusted-summary fallback served');
    return res.json({
      message: `Hoi ${req.body.contactName || ''}, ik loop vast met mijn computer (${req.body.problem || 'computerprobleem'}). KijkHulp stelt voor om even met jou te overleggen.`,
    });
  }
});

function sanitizeDesignerName(text: string): string {
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

function isExplicitCreatorQuestion(text: string): boolean {
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

  // English explicit creator/developer/designer questions (e.g. Who designed this app? Who is the developer?)
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

function getCreatorResponse(lastUserMsg: string): string {
  const isAr = /[\u0600-\u06FF]/.test(lastUserMsg);
  const isEn = /\b(who|designed|created|developer|built|made)\b/i.test(lastUserMsg);

  if (isAr) {
    return 'تم تصميم وتطوير وبرمجة هذا التطبيق بواسطة مصطفى الشايب (Mustafa Al-Shaeib). 🌟 وقد قام بتصميمه ليكون مساعداً هادئاً وصبوراً وذكياً لمساعدتكم في كل ما يخص مشاكل الكمبيوتر والهاتف خطوة بخطوة.';
  } else if (isEn) {
    return 'This application was designed, developed, and built by Mustafa Al-Shaeib (مصطفى الشايب). 🌟 It was created to provide calm, patient, and step-by-step assistance with computer and smartphone questions.';
  } else {
    return 'Deze applicatie is ontworpen, ontwikkeld en gebouwd door Mustafa Al-Shaeib (مصطفى الشايب). 🌟 Hij heeft KijkHulp ontworpen om u rustig, geduldig en stap voor stap te helpen met al uw computer- en smartphonevragen.';
  }
}

/**
 * Endpoint: POST /api/chat
 * Multi-turn chatbot interface met gesprekgeschiedenis en rolgeheugen
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, deviceProfile, roleMode } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Geen berichten meegegeven' });
    }

    // Extract last user message to check for direct questions
    const rawLastUserMsg = [...messages].reverse().find((m) => m.role === 'user' || m.role === undefined)?.content || '';
    const isCreatorQuestion = isExplicitCreatorQuestion(rawLastUserMsg);

    // ONLY reveal the designer's name if the user explicitly asks about the creator/designer/developer
    if (isCreatorQuestion) {
      return res.json({
        reply: getCreatorResponse(rawLastUserMsg),
      });
    }

    let roleInstruction = `
Je bent KijkHulp Assistent, net zoals Google Gemini maar speciaal ontworpen om uiterst vriendelijk, geduldig, empathisch en deskundig te communiceren met gebruikers van alle leeftijden.
Communiceer altijd in de taal waarin de gebruiker spreekt (Nederlands, Arabisch, Engels, Turks, Duits, Spaans, Frans, etc. - alle talen ter wereld worden ondersteund!).
Wees behulpzaam, bemoedigend en helder. Focus puur op de concrete vraag van de gebruiker.

STRIKTE PRIVACY- EN NAAMSREGEL:
- Noem NOOIT de naam van de maker, ontwerper of ontwikkelaar in begroetingen, introducties, antwoorden op computerproblemen of algemene antwoorden.
- Stel jezelf gewoon voor als 'KijkHulp assistent' als dat van toepassing is.
- Noem de naam van de maker/ontwerper/ontwikkelaar NOOIT, tenzij de gebruiker in zijn huidige bericht EXPLICIET en DIRECT vraagt wie de app/chat heeft ontworpen, gemaakt of ontwikkeld (zoals 'Who designed this app?', 'Who is the developer?', 'Who created this?', 'مين المصمم؟', 'مين عمل التطبيق؟').
- Als de gebruiker iets anders vraagt (zoals 'Hallo', 'Wie ben jij?', 'Wat kan je doen?', 'Help mij met wifi', 'De printer werkt niet', 'Hoe maak ik een map aan?'), noem dan onder GEEN ENKELE voorwaarde een ontwerper of ontwikkelaar.
`;

    if (roleMode === 'quick_tip') {
      roleInstruction += `\nROL: Snelle vraagbaak. Geef direct in 1 of 2 korte, heldere zinnen antwoord op de vraag van de gebruiker.`;
    } else if (roleMode === 'expert_detective') {
      roleInstruction += `\nROL: Digitale Speurder. Vraag rustig door als iets onduidelijk is om het onderliggende computerprobleem te achterhalen, maar houd de taal uiterst eenvoudig.`;
    } else {
      roleInstruction += `\nROL: Vriendelijke en geduldige computerbegeleider. Beantwoord vragen alsof je naast de gebruiker aan tafel zit.`;
    }

    if (deviceProfile) {
      roleInstruction += `\nInformatie over de computer van deze gebruiker: ${deviceProfile.deviceType} (${deviceProfile.windowsVersion || 'Windows'}, ${deviceProfile.brand || ''}, browser: ${deviceProfile.browser || ''}, printer: ${deviceProfile.printerBrand || ''}). Houd hier altijd rekening mee.`;
    }

    // Limit to the last 8 messages to prevent token quota exhaustion and latency
    const recentMessages = messages.slice(-8);

    // Only keep base64 image on the most recent message that contains one
    let latestImageIndex = -1;
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      if (recentMessages[i].imageBase64) {
        latestImageIndex = i;
        break;
      }
    }

    // Convert messages array into Gemini contents structure ensuring first turn is 'user'
    const rawContents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
      const role = (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user';
      const parts: any[] = [];

      if (i === latestImageIndex && msg.imageBase64) {
        const cleanBase64 = msg.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      if (msg.content && msg.content.trim()) {
        let textPart = msg.content.trim();
        // If the current query is not asking for the creator, sanitize any previous mentions in history
        if (!isCreatorQuestion && role === 'model') {
          textPart = sanitizeDesignerName(textPart);
        }
        parts.push({ text: textPart });
      }

      if (parts.length > 0) {
        rawContents.push({ role, parts });
      }
    }

    // Gemini requirement: The first content turn MUST have role 'user'
    let firstUserIndex = rawContents.findIndex((c) => c.role === 'user');
    if (firstUserIndex === -1) {
      rawContents.unshift({ role: 'user', parts: [{ text: 'Hallo, kunt u mij helpen?' }] });
      firstUserIndex = 0;
    }

    const trimmedContents = rawContents.slice(firstUserIndex);

    // Merge adjacent same-role messages so Gemini receives strictly alternating turns
    const validContents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
    for (const item of trimmedContents) {
      if (validContents.length === 0) {
        validContents.push(item);
      } else {
        const prev = validContents[validContents.length - 1];
        if (prev.role === item.role) {
          prev.parts.push(...item.parts);
        } else {
          validContents.push(item);
        }
      }
    }

    try {
      const response = await generateWithModelFallback({
        contents: validContents,
        config: {
          systemInstruction: roleInstruction,
        },
      });

      let reply = response.text || 'Ik begrijp het. Wat wilt u dat we nu doen?';

      // Safety filter: ensure designer name is NEVER leaked in unprompted normal answers
      if (!isCreatorQuestion) {
        reply = sanitizeDesignerName(reply);
      }

      return res.json({ reply });
    } catch (_apiError: any) {
      console.log('[AI] Chat assistant served graceful local response');

      const lastUserMsg = validContents[validContents.length - 1]?.parts?.find((p: any) => p.text)?.text || '';
      
      // If the user explicitly asked about the creator in fallback scenario
      if (isExplicitCreatorQuestion(lastUserMsg)) {
        return res.json({ reply: getCreatorResponse(lastUserMsg) });
      }

      const lower = lastUserMsg.toLowerCase();
      const isArabic = /[\u0600-\u06FF]/.test(lastUserMsg);

      if (isArabic) {
        if (lower.includes('من انت') || lower.includes('من أنت') || lower.includes('مين انت') || lower.includes('شو انت')) {
          return res.json({
            reply: 'أنا مساعدك الذكي في KijkHulp. صُممت لمساعدتك بهدوء وصبر وخطوة بخطوة في حل جميع مشاكل الكمبيوتر والهاتف وتصفح الإنترنت.',
          });
        }
        if (lower.includes('مرحبا') || lower.includes('اهلا') || lower.includes('سلام')) {
          return res.json({
            reply: 'أهلاً وسهلاً بك! أنا مساعدك في KijkHulp. كيف يمكنني مساعدتك في حل مشكلة الكمبيوتر أو الهاتف اليوم خطوة بخطوة؟',
          });
        }
        if (lower.includes('نت') || lower.includes('انترنت') || lower.includes('واي فاي')) {
          return res.json({
            reply: 'بالنسبة للإنترنت والواي فاي: انظر أسفل يمين الشاشة بجانب الساعة، هل ترى أيقونة الواي فاي أو الكرة الأرضية؟ انقر عليها وتأكد أنها مضاءة باللون الأزرق.',
          });
        }
        if (lower.includes('طابعة') || lower.includes('طباعة')) {
          return res.json({
            reply: 'لمشاكل الطابعة: تأكد أولاً من أن الطابعة تعمل والضوء الأخضر مضاء، وأن درج الورق يحتوي على ورق كافٍ.',
          });
        }
        if (lower.includes('بطيء') || lower.includes('معلق')) {
          return res.json({
            reply: 'إذا كان الكمبيوتر بطيئاً: أغلق النوافذ غير المستخدمة من علامة (x) بأعلى اليمين، أو قم بإعادة تشغيل الجهاز بهدوء لتفريغ الذاكرة.',
          });
        }
        return res.json({
          reply: 'أنا هنا معك لمساعدتك بكل سرور! صف لي المشكلة التي تظهر على شاشتك وسأرشدك خطوة بخطوة.',
        });
      }

      let fallbackReply = 'Ik help u heel graag! Kunt u rustig beschrijven wat u nu op uw beeldscherm ziet? Dan lossen we het samen stap voor stap op.';

      if (lower.includes('wie ben je') || lower.includes('wie ben jij') || lower.includes('wat ben je') || lower.includes('wat is kijkhulp')) {
        fallbackReply = 'Ik ben de KijkHulp assistent, uw vriendelijke en geduldige digitale hulp. Ik help u graag stap voor stap met al uw vragen over de computer of telefoon.';
      } else if (lower.includes('wifi') || lower.includes('internet') || lower.includes('verbinding')) {
        fallbackReply = 'Geen zorgen! Kijk helemaal rechtsonder op uw scherm naast de klok. Ziet u daar een Wi-Fi boogje of een wereldbolletje? Klik daar eens op.';
      } else if (lower.includes('printer') || lower.includes('printen') || lower.includes('afdrukken')) {
        fallbackReply = 'Voor de printer: controleer eerst of het aan/uit-lampje op de printer zelf brandt en of er voldoende papier in de lade ligt. Brandt er een lampje?';
      } else if (lower.includes('traag') || lower.includes('langzaam') || lower.includes('vast')) {
        fallbackReply = 'Als de computer traag is: sluit openstaande programma\'s af met het kruisje rechtsboven. Helpt dat niet? Start de computer dan een keertje rustig opnieuw op.';
      } else if (lower.includes('veilig') || lower.includes('virus') || lower.includes('bank') || lower.includes('oplichting')) {
        fallbackReply = '⚠️ Belangrijke tip: Klik nergens op als u het niet vertrouwt, en geef nooit wachtwoorden of bankgegevens door. Wilt u dat we een familielid bellen?';
      }

      return res.json({ reply: fallbackReply });
    }
  } catch (error: any) {
    console.error('Fatal error in /api/chat:', error);
    return res.json({
      reply: 'Ik ben er om u te helpen. Kunt u uw vraag nog eens rustig stellen?',
    });
  }
});

/**
 * Endpoint: POST /api/tts
 * Server-side fallback TTS met gemini-3.8-flash-lite-tts
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Geen tekst opgegeven voor spraak' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API sleutel is niet geconfigureerd' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Calm, clear, gentle, speaking Dutch to an elderly person patiently',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    }
    return res.status(500).json({ error: 'Kon geen audio genereren' });
  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    return res.status(500).json({ error: 'TTS fout', details: error?.message });
  }
});

/**
 * Endpoint: GET /api/ip-location
 * Veilige fallback om een geschatte locatie of stad op te halen wanneer browser-GPS is geblokkeerd
 */
app.get('/api/ip-location', async (req: Request, res: Response) => {
  try {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const isPublicIp = rawIp && !rawIp.startsWith('127.') && !rawIp.startsWith('10.') && !rawIp.startsWith('192.168.') && !rawIp.includes('::1');
    const lookupUrl = isPublicIp
      ? `http://ip-api.com/json/${rawIp}?fields=status,message,country,city,lat,lon`
      : 'http://ip-api.com/json/?fields=status,message,country,city,lat,lon';

    const ipRes = await fetch(lookupUrl, { signal: AbortSignal.timeout(4000) });
    const data = await ipRes.json();
    if (data && data.status === 'success' && data.lat && data.lon) {
      return res.json({
        success: true,
        lat: data.lat,
        lng: data.lon,
        city: data.city || 'Nederland',
        country: data.country || 'Nederland',
      });
    }
    // Veilige Nederlandse fallback (Utrecht, centrum Nederland)
    return res.json({ 
      success: true, 
      lat: 52.0907, 
      lng: 5.1214, 
      city: 'Nederland', 
      country: 'Nederland' 
    });
  } catch (err: any) {
    console.warn('IP location fallback error:', err?.message);
    return res.json({ 
      success: true, 
      lat: 52.0907, 
      lng: 5.1214, 
      city: 'Nederland', 
      country: 'Nederland' 
    });
  }
});

// Setup Dev vs Production Vite Serving
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const isHttps = process.env.APP_URL?.startsWith('https:') || !!process.env.K_SERVICE;

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true as const,
        ws: {
          server: httpServer,
          protocol: isHttps ? 'wss' : undefined,
          clientPort: isHttps ? 443 : undefined,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Handle socket errors gracefully to prevent server crashes
  httpServer.on('clientError', (err: any, socket: any) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      return;
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  httpServer.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`);
    console.log(`KijkHulp server draait op ${host}:${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
