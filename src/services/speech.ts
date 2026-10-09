/**
 * Speech Recognition and Speech Synthesis utilities for KijkHulp
 */
import { 
  getStoredVoiceLanguage, 
  getStoredSpeechRate, 
  getStoredSpeechRateMultiplier, 
  getStoredVoiceEnabled,
  SpeechSpeed 
} from './storage';

let currentAudio: HTMLAudioElement | null = null;

export function getSpeechRateMultiplier(speedPref?: SpeechSpeed): number {
  if (speedPref) {
    if (speedPref === 'veryslow') return 0.70;
    if (speedPref === 'slow') return 0.85;
    if (speedPref === 'fast') return 1.20;
    return 1.0;
  }
  return getStoredSpeechRateMultiplier();
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}

export function isSpeaking(): boolean {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    return true;
  }
  return currentAudio !== null && !currentAudio.paused;
}

export function detectLanguage(text: string): string {
  if (!text) return 'nl-NL';
  // Arabic detection
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA';
  // Russian/Cyrillic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU';
  // Greek
  if (/[\u0370-\u03FF]/.test(text)) return 'el-GR';
  // Chinese / Japanese / Korean
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja-JP';

  const lower = text.toLowerCase();
  // Turkish
  if (lower.includes('nasıl') || lower.includes('merhaba') || lower.includes('sorun') || lower.includes('bilgisayar')) return 'tr-TR';
  // German
  if (lower.includes('hallo') || lower.includes('bitte') || lower.includes('computer') || lower.includes('danke') || lower.includes('wie')) return 'de-DE';
  // French
  if (lower.includes('bonjour') || lower.includes('ordinateur') || lower.includes('merci') || lower.includes('problème')) return 'fr-FR';
  // Spanish
  if (lower.includes('hola') || lower.includes('computadora') || lower.includes('gracias') || lower.includes('problema')) return 'es-ES';
  // English common words
  if (/\b(how|what|why|is|my|the|can|you|hello|please|computer|screen)\b/i.test(lower)) return 'en-US';

  // Default to Dutch for KijkHulp
  return 'nl-NL';
}

/**
 * Lees een tekst rustig en duidelijk voor.
 * Speelt ALLEEN af als Voice On actief is (of bij expliciete test/bypass).
 * Voorkomt meerdere audios tegelijk door eerdere audio direct af te breken.
 */
export async function speakDutch(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void,
  forceAppLanguage: boolean = false,
  bypassVoiceCheck: boolean = false
): Promise<void> {
  // Voorkom overlappende audio: breek altijd eerdere spraak direct af
  stopSpeaking();

  // Als spraakbegeleiding UIT staat (Voice Off), speel NIETS af
  if (!bypassVoiceCheck && !getStoredVoiceEnabled()) {
    if (onEnd) onEnd();
    return;
  }

  if (!text || text.trim() === '') {
    if (onEnd) onEnd();
    return;
  }

  // Bepaal de doeltaal voor het voorlezen
  const userPref = getStoredVoiceLanguage();
  let langCode = 'nl-NL';
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  if (forceAppLanguage || userPref === 'nl') {
    // Altijd de officiële taal van de app (Nederlands)
    langCode = 'nl-NL';
  } else if (userPref === 'ar') {
    // Gebruiker heeft Arabische stem gekozen
    langCode = 'ar-SA';
  } else {
    // Automatisch op basis van tekst
    langCode = hasArabic ? 'ar-SA' : 'nl-NL';
  }

  // Probeert Web Speech API
  if ('speechSynthesis' in window) {
    try {
      // Zorg dat voices geladen zijn
      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = getSpeechRateMultiplier(); // Dynamische spreeksnelheid (langzaam, normaal, snel)
      utterance.pitch = 1.0;

      // Zoek specifiek de mooiste natuurlijke stem voor de gekozen taal
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (langCode === 'nl-NL') {
        // Zoek naar hoogwaardige Nederlandse stemmen (Google Nederlands, Microsoft Frank/Fenke/Bart, Apple Claire/Xander)
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith('nl') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced'))
        ) || voices.find(
          (v) => v.lang.toLowerCase().replace('_', '-').startsWith('nl')
        );
      } else if (langCode === 'ar-SA') {
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith('ar') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Maged') || v.name.includes('Laila'))
        ) || voices.find(
          (v) => v.lang.toLowerCase().replace('_', '-').startsWith('ar')
        );
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = async (e) => {
        console.warn('Browser TTS fout, probeer server-side audio fallback...', e);
        try {
          await fallbackServerTTS(text, onStart, onEnd, onError);
        } catch (serverErr) {
          if (onError) onError(serverErr);
          if (onEnd) onEnd();
        }
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch (e) {
      console.warn('SpeechSynthesis gefaald, probeer server TTS', e);
    }
  }

  // Fallback via server
  await fallbackServerTTS(text, onStart, onEnd, onError);
}

async function fallbackServerTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Server TTS niet beschikbaar');
    const data = await res.json();
    if (data.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      audio.playbackRate = getSpeechRateMultiplier();
      currentAudio = audio;
      audio.onplay = () => {
        if (onStart) onStart();
      };
      audio.onended = () => {
        currentAudio = null;
        if (onEnd) onEnd();
      };
      audio.onerror = (err) => {
        currentAudio = null;
        if (onError) onError(err);
        if (onEnd) onEnd();
      };
      await audio.play();
    } else {
      if (onEnd) onEnd();
    }
  } catch (err) {
    if (onError) onError(err);
    if (onEnd) onEnd();
  }
}

/**
 * Speech Recognition helper voor alle talen (Nederlands, Arabisch, Engels, etc.)
 */
export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  lang?: string
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = lang || (navigator.language ? navigator.language : 'nl-NL');
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      onResult(text.trim(), !!finalTranscript);
    };

    recognition.onerror = (event: any) => {
      onError(event.error || 'Spraakherkenning fout');
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (e) {
    console.error('Speech recognition initialization error:', e);
    return null;
  }
}
