export interface DeviceProfile {
  windowsVersion: 'Windows 11' | 'Windows 10' | 'Windows 8/7' | 'Weet ik niet';
  deviceType: 'Laptop' | 'Vaste computer (Desktop)' | 'All-in-one scherm' | 'Tablet';
  brand: string; // e.g. HP, Dell, Lenovo, Acer, Asus, Medion, Apple
  browser: string; // e.g. Google Chrome, Microsoft Edge, Firefox
  printerBrand: string; // e.g. HP, Canon, Epson, Brother, Geen printer
  notes?: string;
}

export interface TrustedContact {
  id?: string;
  name: string;
  relationship: string; // bijv. Zoon, Dochter, Buurman, Kleinkind
  phoneNumber: string;
  email?: string;
  isPrimary?: boolean;
}

export interface VisualHint {
  targetArea: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center' | 'keyboard' | 'cable';
  label: string;
  iconName?: string;
  positionX?: number; // 0-100 percentage
  positionY?: number; // 0-100 percentage
}

export interface SupportStep {
  stepNumber: number;
  totalEstimatedSteps?: number;
  title: string;
  instruction: string; // Single, clear action!
  detailedTip?: string;
  visualHint?: VisualHint;
  completed?: boolean;
}

export interface SupportSession {
  id: string;
  timestamp: string;
  originalProblem: string;
  detectedProblem: string;
  programName?: string;
  status: 'in_progress' | 'solved' | 'needs_family' | 'cancelled';
  steps: SupportStep[];
  currentStepIndex: number;
  screenshotUrl?: string;
}

export interface SafetyCheckResult {
  isDangerous: boolean;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  headline: string;
  explanation: string;
  warningActions: string[];
  safeNextSteps: string[];
  trustedContactAdvice?: string;
}

export interface ErrorCodeInfo {
  code: string;
  meaning: string;
  isDangerous: boolean;
  simpleExplanation: string;
  safeAttempt: string;
  firstStep: SupportStep;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  imageBase64?: string;
}

export type ChatRoleMode = 'patient_coach' | 'expert_detective' | 'quick_tip';

