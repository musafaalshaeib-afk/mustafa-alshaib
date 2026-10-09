import { DeviceProfile, TrustedContact, SupportSession } from '../types';

const STORAGE_KEYS = {
  DEVICE_PROFILE: 'kijkhulp_device_profile',
  TRUSTED_CONTACT: 'kijkhulp_trusted_contact',
  TRUSTED_CONTACTS: 'kijkhulp_trusted_contacts',
  ACTIVE_SESSION: 'kijkhulp_active_session',
  FONT_SIZE: 'kijkhulp_font_size',
  VOICE_ENABLED: 'kijkhulp_voice_enabled',
  AUTO_TTS: 'kijkhulp_auto_tts',
  VOICE_LANGUAGE: 'kijkhulp_voice_language',
  SPEECH_RATE: 'kijkhulp_speech_rate',
  HISTORY: 'kijkhulp_session_history',
  HOME_ADDRESS: 'kijkhulp_home_address',
};

export const defaultDeviceProfile: DeviceProfile = {
  windowsVersion: 'Windows 11',
  deviceType: 'Laptop',
  brand: 'HP',
  browser: 'Google Chrome',
  printerBrand: 'HP',
  notes: '',
};

export const defaultTrustedContactsList: TrustedContact[] = [
  {
    id: 'tc-1',
    name: 'Mark',
    relationship: 'Zoon',
    phoneNumber: '06 12345678',
    email: 'mark@voorbeeld.nl',
    isPrimary: true,
  },
];

export const defaultTrustedContact: TrustedContact = defaultTrustedContactsList[0];

export function getStoredDeviceProfile(): DeviceProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVICE_PROFILE);
    return raw ? JSON.parse(raw) : defaultDeviceProfile;
  } catch {
    return defaultDeviceProfile;
  }
}

export function saveDeviceProfile(profile: DeviceProfile): void {
  localStorage.setItem(STORAGE_KEYS.DEVICE_PROFILE, JSON.stringify(profile));
}

export function getStoredTrustedContacts(): TrustedContact[] {
  try {
    const rawList = localStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACTS);
    if (rawList) {
      const parsed = JSON.parse(rawList);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const singleRaw = localStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACT);
    if (singleRaw) {
      const single = JSON.parse(singleRaw);
      if (single && single.name) {
        return [{ id: single.id || 'tc-1', ...single, isPrimary: true }];
      }
    }
    return defaultTrustedContactsList;
  } catch {
    return defaultTrustedContactsList;
  }
}

export function saveTrustedContacts(contacts: TrustedContact[]): void {
  localStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACTS, JSON.stringify(contacts));
  if (contacts.length > 0) {
    const primary = contacts.find((c) => c.isPrimary) || contacts[0];
    localStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACT, JSON.stringify(primary));
  } else {
    localStorage.removeItem(STORAGE_KEYS.TRUSTED_CONTACT);
  }
}

export function getStoredTrustedContact(): TrustedContact | null {
  const list = getStoredTrustedContacts();
  return list.length > 0 ? (list.find((c) => c.isPrimary) || list[0]) : null;
}

export function saveTrustedContact(contact: TrustedContact): void {
  const list = getStoredTrustedContacts();
  const idToMatch = contact.id;
  const existingIdx = idToMatch ? list.findIndex((c) => c.id === idToMatch) : list.findIndex((c) => c.name === contact.name);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...contact, id: list[existingIdx].id };
  } else {
    list.unshift({ ...contact, id: contact.id || `tc-${Date.now()}` });
  }
  saveTrustedContacts(list);
}

export function getStoredActiveSession(): SupportSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: SupportSession | null): void {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }
}

export function getStoredFontSize(): 'normal' | 'large' | 'extralarge' {
  try {
    return (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as any) || 'large';
  } catch {
    return 'large';
  }
}

export function saveFontSize(size: 'normal' | 'large' | 'extralarge'): void {
  localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
}

export function getStoredVoiceEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.VOICE_ENABLED);
    // Voice reading is OFF (false) by default
    return val !== null ? JSON.parse(val) === true : false;
  } catch {
    return false;
  }
}

export function saveVoiceEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.VOICE_ENABLED, JSON.stringify(enabled));
  localStorage.setItem(STORAGE_KEYS.AUTO_TTS, JSON.stringify(enabled));
}

export function getStoredAutoTTS(): boolean {
  return getStoredVoiceEnabled();
}

export function saveAutoTTS(val: boolean): void {
  saveVoiceEnabled(val);
}

export function getStoredVoiceLanguage(): 'nl' | 'ar' | 'auto' {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.VOICE_LANGUAGE);
    return (val as any) || 'nl'; // Default to Dutch (taal van de app)
  } catch {
    return 'nl';
  }
}

export function saveVoiceLanguage(lang: 'nl' | 'ar' | 'auto'): void {
  localStorage.setItem(STORAGE_KEYS.VOICE_LANGUAGE, lang);
}

export type SpeechSpeed = 'veryslow' | 'slow' | 'normal' | 'fast';

export function getStoredSpeechRate(): SpeechSpeed {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SPEECH_RATE);
    if (val === 'veryslow' || val === 'slow' || val === 'normal' || val === 'fast') {
      return val;
    }
    return 'normal';
  } catch {
    return 'normal';
  }
}

export function saveSpeechRate(rate: SpeechSpeed): void {
  localStorage.setItem(STORAGE_KEYS.SPEECH_RATE, rate);
}

export function getStoredSpeechRateMultiplier(): number {
  try {
    const rawVal = localStorage.getItem('kijkhulp_speech_rate_value');
    if (rawVal) {
      const num = parseFloat(rawVal);
      if (!isNaN(num) && num >= 0.5 && num <= 1.5) return num;
    }
    const speed = getStoredSpeechRate();
    if (speed === 'veryslow') return 0.70;
    if (speed === 'slow') return 0.85;
    if (speed === 'fast') return 1.20;
    return 1.0;
  } catch {
    return 1.0;
  }
}

export function saveSpeechRateMultiplier(val: number): void {
  localStorage.setItem('kijkhulp_speech_rate_value', val.toFixed(2));
}

export function getStoredHomeAddress(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.HOME_ADDRESS) || '';
  } catch {
    return '';
  }
}

export function saveHomeAddress(address: string): void {
  localStorage.setItem(STORAGE_KEYS.HOME_ADDRESS, address);
}

export const sampleSessionHistory: SupportSession[] = [
  {
    id: 'hist-sample-1',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    originalProblem: 'Wi-Fi verbinding viel steeds weg',
    detectedProblem: 'Wi-Fi netwerkadapter herstellen',
    programName: 'Netwerkinstellingen',
    status: 'solved',
    currentStepIndex: 1,
    steps: [
      {
        stepNumber: 1,
        totalEstimatedSteps: 2,
        title: 'Wi-Fi uit- en weer inschakelen',
        instruction: 'Klik op het netwerkicoon rechtsonder in de taakbalk, zet Wi-Fi 10 seconden uit en weer aan.',
        detailedTip: 'Het icoon lijkt op halve boogjes rechtsonder naast de klok.',
        completed: true,
      },
      {
        stepNumber: 2,
        totalEstimatedSteps: 2,
        title: 'Verbinden met uw thuisnetwerk',
        instruction: 'Selecteer uw eigen thuisnetwerk en zorg dat "Automatisch verbinden" aangevinkt staat.',
        completed: true,
      },
    ],
  },
  {
    id: 'hist-sample-2',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    originalProblem: 'Letters en tekst waren te klein op mijn scherm',
    detectedProblem: 'Beeldschermschaal en tekstgrootte vergroten',
    programName: 'Windows Instellingen',
    status: 'solved',
    currentStepIndex: 1,
    steps: [
      {
        stepNumber: 1,
        totalEstimatedSteps: 2,
        title: 'Tekstgrootte instellingen openen',
        instruction: 'Druk op de Windows-toets, typ "Tekstgrootte" en druk op de Enter-toets.',
        completed: true,
      },
      {
        stepNumber: 2,
        totalEstimatedSteps: 2,
        title: 'Schuifregelaar naar rechts verplaatsen',
        instruction: 'Verplaats de schuifknop naar een groter percentage (bijv. 125%) en klik op Toepassen.',
        completed: true,
      },
    ],
  },
];

export function getStoredSessionHistory(): SupportSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      // Seed with realistic demo history so senior user can see previous solutions immediately
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleSessionHistory));
      return sampleSessionHistory;
    }
    return JSON.parse(raw);
  } catch {
    return sampleSessionHistory;
  }
}

export function saveSessionToHistory(session: SupportSession): void {
  try {
    const history = getStoredSessionHistory();
    const existingIndex = history.findIndex((h) => h.id === session.id);
    let updatedHistory: SupportSession[];
    if (existingIndex >= 0) {
      updatedHistory = [...history];
      updatedHistory[existingIndex] = { ...session };
    } else {
      updatedHistory = [session, ...history];
    }
    // Limit to latest 30 sessions
    if (updatedHistory.length > 30) {
      updatedHistory = updatedHistory.slice(0, 30);
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error('Failed to save session to history:', err);
  }
}

export function deleteSessionFromHistory(id: string): void {
  try {
    const history = getStoredSessionHistory();
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete session from history:', err);
  }
}

export function clearSessionHistory(): void {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
}

export function clearAllUserData(): void {
  localStorage.removeItem(STORAGE_KEYS.DEVICE_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.TRUSTED_CONTACT);
  localStorage.removeItem(STORAGE_KEYS.TRUSTED_CONTACTS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  localStorage.removeItem(STORAGE_KEYS.SPEECH_RATE);
}
