import React, { useState } from 'react';
import { DeviceProfile, SupportSession, SupportStep } from '../types';
import { PROBLEM_LIBRARY, LibraryCategory, findLibraryProblem } from '../data/problemLibrary';
import { analyseProblem } from '../services/api';
import { speakDutch } from '../services/speech';
import { 
  Mic, 
  Camera, 
  Keyboard, 
  ShieldAlert, 
  Wifi, 
  Printer, 
  Laptop, 
  Volume2, 
  Monitor, 
  Mail, 
  Search, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  Smartphone,
  CheckCircle,
  Play,
  History,
  Tablet,
  Check
} from 'lucide-react';

interface HomeScreenProps {
  onOpenVoiceModal: () => void;
  onOpenCameraModal: () => void;
  onOpenSafetyCheck: () => void;
  onOpenErrorCodeSearch: () => void;
  onOpenChat: () => void;
  onOpenHistory?: () => void;
  onOpenTrustedContact?: () => void;
  onStartSession: (session: SupportSession) => void;
  deviceProfile: DeviceProfile;
  onUpdateDeviceProfile?: (profile: DeviceProfile) => void;
  fontSize: 'normal' | 'large' | 'extralarge';
  isVoiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenVoiceModal,
  onOpenCameraModal,
  onOpenSafetyCheck,
  onOpenErrorCodeSearch,
  onOpenChat,
  onOpenHistory,
  onOpenTrustedContact,
  onStartSession,
  deviceProfile,
  onUpdateDeviceProfile,
  fontSize,
  isVoiceEnabled = false,
  onToggleVoice,
}) => {
  const [typedProblem, setTypedProblem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | null>(null);
  const [justSelectedDevice, setJustSelectedDevice] = useState<string | null>(null);

  const handleSelectDeviceType = (type: DeviceProfile['deviceType']) => {
    const updated = { ...deviceProfile, deviceType: type };
    if (onUpdateDeviceProfile) {
      onUpdateDeviceProfile(updated);
    }
    setJustSelectedDevice(type);
    speakDutch(`Uw computer is ingesteld als ${type}. Onze hulp en beeldherkenning houden hier nu direct rekening mee.`);
    setTimeout(() => setJustSelectedDevice(null), 3000);
  };

  const handleStartAnalysis = async (problemText: string) => {
    if (!problemText.trim()) return;

    // Check offline library first for instant safe response
    const libraryMatch = findLibraryProblem(problemText);
    if (libraryMatch) {
      const newSession: SupportSession = {
        id: `lib-${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalProblem: problemText,
        detectedProblem: libraryMatch.title,
        status: 'in_progress',
        currentStepIndex: 0,
        steps: libraryMatch.steps,
      };
      onStartSession(newSession);
      return;
    }

    setIsLoading(true);
    try {
      const response = await analyseProblem(problemText, undefined, deviceProfile);
      const newSession: SupportSession = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalProblem: problemText,
        detectedProblem: response.detectedProblem,
        programName: response.programName,
        status: 'in_progress',
        currentStepIndex: 0,
        steps: [response.firstStep],
      };
      onStartSession(newSession);
    } catch (err: any) {
      console.error(err);
      // Fallback safe first step
      const fallbackSession: SupportSession = {
        id: `fallback-${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalProblem: problemText,
        detectedProblem: `Computerprobleem: ${problemText}`,
        status: 'in_progress',
        currentStepIndex: 0,
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Computer rustig opnieuw opstarten',
            instruction: 'Klik linksonder op de Windows startknop, kies het Aan/Uit icoontje en druk op "Opnieuw opstarten".',
            detailedTip: 'Veel tijdelijke problemen worden direct verholpen door de computer even opnieuw te laten starten.',
            visualHint: {
              targetArea: 'bottom-left',
              label: 'Startknop linksonder op de balk',
            },
          },
        ],
      };
      onStartSession(fallbackSession);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wifi':
        return <Wifi className="w-7 h-7 text-blue-600" />;
      case 'Printer':
        return <Printer className="w-7 h-7 text-emerald-600" />;
      case 'Laptop':
        return <Laptop className="w-7 h-7 text-purple-600" />;
      case 'Volume2':
        return <Volume2 className="w-7 h-7 text-amber-600" />;
      case 'Monitor':
        return <Monitor className="w-7 h-7 text-sky-600" />;
      case 'Mail':
        return <Mail className="w-7 h-7 text-rose-600" />;
      default:
        return <HelpCircle className="w-7 h-7 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-8 pb-32">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-10 shadow-2xl border-4 border-blue-700 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-amber-400 text-blue-950 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-sm">
              <span>Nederlandse Computerhulp</span>
            </div>
            {onToggleVoice && (
              <button
                type="button"
                onClick={onToggleVoice}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs border-2 shadow-sm transition-all active:scale-95 ${
                  isVoiceEnabled
                    ? 'bg-amber-400 hover:bg-amber-300 text-blue-950 border-amber-300 ring-2 ring-amber-200'
                    : 'bg-blue-950/80 hover:bg-blue-800 text-slate-200 border-blue-400'
                }`}
                title={isVoiceEnabled ? 'Voice is ON. Click to turn Voice OFF.' : 'Voice is OFF. Click to turn Voice ON.'}
                aria-label={isVoiceEnabled ? 'Voice On' : 'Voice Off'}
              >
                <span className="text-sm select-none leading-none">{isVoiceEnabled ? '🔊' : '🔇'}</span>
                <span className="whitespace-nowrap font-extrabold">{isVoiceEnabled ? 'Voice On' : 'Voice Off'}</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight">
            Waar kunnen we u mee helpen?
          </h1>
          <p className="text-blue-100 text-base sm:text-xl font-medium max-w-2xl pt-1">
            Kies hieronder hoe u uw vraag wilt stellen. We helpen u rustig, duidelijk en met <strong>één handeling tegelijk</strong>.
          </p>
        </div>
        <div className="absolute right-4 bottom-2 text-8xl opacity-10 select-none pointer-events-none hidden sm:block">
          💻
        </div>
      </div>

      {/* 💻 SNELLE COMPUTERHERKENNING (MODEL SELECTIE) */}
      <div className="bg-white rounded-3xl border-3 border-blue-200 p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🖥️</span>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Wat voor computer gebruikt u nu?
              </h3>
              <p className="text-xs text-slate-600">
                Kies uw model zodat onze AI-begeleiding en camera exact de juiste knoppen en vensters toont.
              </p>
            </div>
          </div>
          {deviceProfile.deviceType && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-300 self-start sm:self-auto">
              <Check className="w-3.5 h-3.5" /> Actief: <strong>{deviceProfile.deviceType}</strong>
            </span>
          )}
        </div>

        {/* 3 hoofdmodellen (Laptop, Desktop, Tablet) + All-in-one */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Laptop */}
          <button
            type="button"
            onClick={() => handleSelectDeviceType('Laptop')}
            className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[92px] group ${
              deviceProfile.deviceType === 'Laptop'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-4 ring-blue-200'
                : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${deviceProfile.deviceType === 'Laptop' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                <Laptop className="w-6 h-6 stroke-[2.5]" />
              </div>
              {deviceProfile.deviceType === 'Laptop' && (
                <span className="bg-white text-blue-700 rounded-full p-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-base block">💻 Laptop</span>
              <span className={`text-[11px] block leading-tight ${deviceProfile.deviceType === 'Laptop' ? 'text-blue-100' : 'text-slate-500'}`}>
                Draagbaar met klapscherm
              </span>
            </div>
          </button>

          {/* 2. Desktop (Vaste computer) */}
          <button
            type="button"
            onClick={() => handleSelectDeviceType('Vaste computer (Desktop)')}
            className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[92px] group ${
              deviceProfile.deviceType === 'Vaste computer (Desktop)'
                ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-4 ring-purple-200'
                : 'bg-slate-50 hover:bg-purple-50 text-slate-800 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${deviceProfile.deviceType === 'Vaste computer (Desktop)' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'}`}>
                <Monitor className="w-6 h-6 stroke-[2.5]" />
              </div>
              {deviceProfile.deviceType === 'Vaste computer (Desktop)' && (
                <span className="bg-white text-purple-700 rounded-full p-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-base block">🖥️ Desktop (PC)</span>
              <span className={`text-[11px] block leading-tight ${deviceProfile.deviceType === 'Vaste computer (Desktop)' ? 'text-purple-100' : 'text-slate-500'}`}>
                Met losse kast & monitor
              </span>
            </div>
          </button>

          {/* 3. Tablet */}
          <button
            type="button"
            onClick={() => handleSelectDeviceType('Tablet')}
            className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[92px] group ${
              deviceProfile.deviceType === 'Tablet'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-4 ring-emerald-200'
                : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${deviceProfile.deviceType === 'Tablet' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                <Tablet className="w-6 h-6 stroke-[2.5]" />
              </div>
              {deviceProfile.deviceType === 'Tablet' && (
                <span className="bg-white text-emerald-700 rounded-full p-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-base block">📱 Tablet</span>
              <span className={`text-[11px] block leading-tight ${deviceProfile.deviceType === 'Tablet' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Touchscreen (iPad/Surface)
              </span>
            </div>
          </button>

          {/* 4. All-in-one scherm */}
          <button
            type="button"
            onClick={() => handleSelectDeviceType('All-in-one scherm')}
            className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[92px] group ${
              deviceProfile.deviceType === 'All-in-one scherm'
                ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-4 ring-amber-200'
                : 'bg-slate-50 hover:bg-amber-50 text-slate-800 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${deviceProfile.deviceType === 'All-in-one scherm' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                <Monitor className="w-6 h-6 stroke-[2.5]" />
              </div>
              {deviceProfile.deviceType === 'All-in-one scherm' && (
                <span className="bg-white text-amber-700 rounded-full p-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-base block">🖥️ All-in-one</span>
              <span className={`text-[11px] block leading-tight ${deviceProfile.deviceType === 'All-in-one scherm' ? 'text-amber-100' : 'text-slate-500'}`}>
                Computer in beeldscherm
              </span>
            </div>
          </button>
        </div>

        {justSelectedDevice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>AI-analyse is nu geoptimaliseerd voor <strong>{justSelectedDevice}</strong>!</span>
          </div>
        )}
      </div>

      {/* 🚨 FAMILIE & VERTROUWDE PERSONEN SNELLE TOEGANG */}
      {onOpenTrustedContact && (
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-4 border-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 border-white/30">
              👥
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-wider text-emerald-300 block">
                Directe familiehulp
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">
                Familie & Vertrouwde Personen
              </h2>
              <p className="text-emerald-100 text-sm sm:text-base font-medium">
                Bel direct uw zoon of dochter, stuur via WhatsApp of deel uw locatie.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenTrustedContact}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-2.5 active:scale-95 transition-all shrink-0 min-h-[58px]"
          >
            <span>🚨 Ik heb hulp nodig</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 4 ENORME HOOFDKNOPPEN (STARTSCHERM BASIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6">
        
        {/* 1. 🎤 VERTEL UW PROBLEEM */}
        <button
          onClick={onOpenVoiceModal}
          className="group bg-white hover:bg-blue-50/70 border-4 border-blue-600 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center gap-3.5 sm:gap-5 text-left active:scale-98 transition-all min-h-[96px] sm:min-h-[110px]"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <Mic className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <span className="text-xl sm:text-3xl font-black text-blue-950 block leading-tight">
              🎤 Vertel uw probleem
            </span>
            <span className="text-sm sm:text-base text-slate-600 font-medium block">
              Spreek rustig in wat er mis is.
            </span>
          </div>
        </button>

        {/* 2. 📷 MAAK EEN FOTO */}
        <button
          onClick={onOpenCameraModal}
          className="group bg-white hover:bg-emerald-50/70 border-4 border-emerald-600 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center gap-3.5 sm:gap-5 text-left active:scale-98 transition-all min-h-[96px] sm:min-h-[110px]"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <span className="text-xl sm:text-3xl font-black text-emerald-950 block leading-tight">
              📷 Maak een foto
            </span>
            <span className="text-sm sm:text-base text-slate-600 font-medium block">
              Van het computerscherm of foutmelding.
            </span>
          </div>
        </button>

        {/* 3. ⌨️ TYP UW PROBLEEM */}
        <button
          onClick={() => {
            const el = document.getElementById('manual-problem-input');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
              (el.querySelector('input') as HTMLElement)?.focus();
            }
          }}
          className="group bg-white hover:bg-purple-50/70 border-4 border-purple-600 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center gap-3.5 sm:gap-5 text-left active:scale-98 transition-all min-h-[96px] sm:min-h-[110px]"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-purple-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <Keyboard className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <span className="text-xl sm:text-3xl font-black text-purple-950 block leading-tight">
              ⌨️ Typ uw probleem
            </span>
            <span className="text-sm sm:text-base text-slate-600 font-medium block">
              Schrijf zelf met uw toetsenbord.
            </span>
          </div>
        </button>

        {/* 4. 🚨 IS DIT VEILIG? */}
        <button
          onClick={onOpenSafetyCheck}
          className="group bg-white hover:bg-red-50/70 border-4 border-red-600 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center gap-3.5 sm:gap-5 text-left active:scale-98 transition-all min-h-[96px] sm:min-h-[110px]"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <span className="text-xl sm:text-3xl font-black text-red-950 block leading-tight">
              🚨 Is dit veilig?
            </span>
            <span className="text-sm sm:text-base text-slate-600 font-medium block">
              Verdachte pop-ups, e-mails of telefoontjes.
            </span>
          </div>
        </button>

      </div>

      {/* DIRECT INVOERVELD VOOR TYPEN */}
      <div id="manual-problem-input" className="bg-white rounded-3xl border-3 border-slate-300 p-5 sm:p-7 shadow-lg space-y-3">
        <label className="block text-xl font-black text-slate-900">
          ⌨️ Typ hier uw vraag of probleem:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={typedProblem}
            onChange={(e) => setTypedProblem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStartAnalysis(typedProblem);
            }}
            placeholder="Bijvoorbeeld: 'Mijn printer print niet' of 'Geen geluid'..."
            className="flex-1 p-4 border-2 border-slate-300 rounded-2xl text-xl text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
          />
          <button
            onClick={() => handleStartAnalysis(typedProblem)}
            disabled={isLoading || !typedProblem.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xl px-8 py-4 rounded-2xl shadow-lg border-2 border-blue-400 flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[60px]"
          >
            {isLoading ? (
              <span className="animate-spin text-2xl">⏳</span>
            ) : (
              <>
                <span>Help mij</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* SNELKEUZE: LIVE CAMERA & FOUTCODES & CHAT & HISTORIE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kijk mee met scherm button */}
        <button
          onClick={onOpenCameraModal}
          className="bg-slate-900 text-white hover:bg-slate-800 rounded-3xl p-5 border-3 border-slate-700 shadow-md flex flex-col justify-between text-left group min-h-[110px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold block text-white">
                📱 Kijk mee
              </span>
              <span className="text-xs text-slate-300">
                Camera op monitor
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs font-bold text-blue-400">
            <span>Start camera</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Foutcode zoeken button */}
        <button
          onClick={onOpenErrorCodeSearch}
          className="bg-slate-900 text-white hover:bg-slate-800 rounded-3xl p-5 border-3 border-slate-700 shadow-md flex flex-col justify-between text-left group min-h-[110px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-2xl text-slate-950 font-black text-xl">
              🔢
            </div>
            <div>
              <span className="text-lg font-bold block text-white">
                Foutcodes
              </span>
              <span className="text-xs text-slate-300">
                0x80070005 etc.
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs font-bold text-amber-400">
            <span>Uitleg zoeken</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Chatbot Assistent button */}
        <button
          onClick={onOpenChat}
          className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white hover:from-indigo-800 hover:to-blue-800 rounded-3xl p-5 border-3 border-indigo-500 shadow-md flex flex-col justify-between text-left group min-h-[110px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 rounded-2xl text-white font-black text-xl">
              🤖
            </div>
            <div>
              <span className="text-lg font-bold block text-white">
                KijkHulp Chat
              </span>
              <span className="text-xs text-indigo-200">
                Stel alle vragen
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs font-bold text-indigo-300">
            <span>Open gesprek</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Historie button */}
        <button
          onClick={onOpenHistory}
          className="bg-gradient-to-br from-amber-900 to-amber-950 text-white hover:from-amber-800 hover:to-amber-900 rounded-3xl p-5 border-3 border-amber-600 shadow-md flex flex-col justify-between text-left group min-h-[110px]"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600 rounded-2xl text-white font-black text-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold block text-white">
                📜 Historie
              </span>
              <span className="text-xs text-amber-200">
                Eerdere stappenplannen
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs font-bold text-amber-300">
            <span>Bekijk oplossingen</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* DEMO PROBLEMEN UIT DE OPDRACHT */}
      <div className="bg-amber-50/80 border-3 border-amber-300 rounded-3xl p-5 sm:p-7 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-amber-950 font-black text-xl">
          <Sparkles className="w-6 h-6 text-amber-600" />
          <span>Veelgestelde voorbeelden (Klik om direct te proberen):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Demo 1: Internet */}
          <button
            onClick={() => handleStartAnalysis('Mijn internet werkt niet')}
            className="p-4 bg-white hover:bg-blue-50 border-2 border-amber-200 hover:border-blue-400 rounded-2xl text-left shadow-sm flex items-center justify-between group active:scale-98 transition-all"
          >
            <div>
              <span className="font-extrabold text-blue-950 text-lg block">
                🌐 "Mijn internet werkt niet"
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Vraagt eerst: "Ziet u rechtsonder een Wi-Fi symbool?"
              </span>
            </div>
            <Play className="w-5 h-5 text-blue-600 shrink-0" />
          </button>

          {/* Demo 2: Printer */}
          <button
            onClick={() => handleStartAnalysis('Mijn printer doet het niet')}
            className="p-4 bg-white hover:bg-emerald-50 border-2 border-amber-200 hover:border-emerald-400 rounded-2xl text-left shadow-sm flex items-center justify-between group active:scale-98 transition-all"
          >
            <div>
              <span className="font-extrabold text-emerald-950 text-lg block">
                🖨️ "Mijn printer doet het niet"
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Vraagt eerst: "Staat uw printer aan?"
              </span>
            </div>
            <Play className="w-5 h-5 text-emerald-600 shrink-0" />
          </button>

          {/* Demo 3: Computer traag */}
          <button
            onClick={() => handleStartAnalysis('Mijn computer is erg langzaam')}
            className="p-4 bg-white hover:bg-purple-50 border-2 border-amber-200 hover:border-purple-400 rounded-2xl text-left shadow-sm flex items-center justify-between group active:scale-98 transition-all"
          >
            <div>
              <span className="font-extrabold text-purple-950 text-lg block">
                ⚡ "Mijn computer is erg langzaam"
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Adviseert: "Sluit programma's die u niet gebruikt"
              </span>
            </div>
            <Play className="w-5 h-5 text-purple-600 shrink-0" />
          </button>

          {/* Demo 4: Foutcode */}
          <button
            onClick={onOpenErrorCodeSearch}
            className="p-4 bg-white hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400 rounded-2xl text-left shadow-sm flex items-center justify-between group active:scale-98 transition-all"
          >
            <div>
              <span className="font-extrabold text-amber-950 text-lg block">
                🔢 "Foutcode 0x80070005"
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Legt uit over Windows toestemming en machtigingen
              </span>
            </div>
            <Play className="w-5 h-5 text-amber-600 shrink-0" />
          </button>

        </div>
      </div>

      {/* POPULAIRE CATEGORIEËN */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900">
          Of kies een categorie:
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {PROBLEM_LIBRARY.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className="bg-white hover:bg-slate-50 border-3 border-slate-200 hover:border-blue-500 rounded-2xl p-4 sm:p-5 text-left shadow-sm transition-all flex flex-col justify-between min-h-[110px]"
            >
              <div className="p-2.5 bg-slate-100 rounded-xl w-fit">
                {getCategoryIcon(category.icon)}
              </div>
              <div>
                <span className="font-black text-lg text-slate-900 block mt-2">
                  {category.name}
                </span>
                <span className="text-xs text-slate-500 font-medium line-clamp-1">
                  {category.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Problem Picker Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-6 shadow-2xl border-4 border-blue-600 space-y-4 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
              <div className="flex items-center gap-2 font-black text-xl sm:text-2xl text-slate-900">
                {getCategoryIcon(selectedCategory.icon)}
                <span>{selectedCategory.name}</span>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl min-h-[44px] min-w-[44px] font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm sm:text-base text-slate-600 font-semibold">
              Kies het probleem dat het meest lijkt op wat u ervaart:
            </p>

            <div className="space-y-3">
              {selectedCategory.problems.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => {
                    setSelectedCategory(null);
                    const newSession: SupportSession = {
                      id: `session-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      originalProblem: prob.title,
                      detectedProblem: prob.title,
                      status: 'in_progress',
                      currentStepIndex: 0,
                      steps: prob.steps,
                    };
                    onStartSession(newSession);
                  }}
                  className="w-full p-3.5 sm:p-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 rounded-2xl text-left transition-all flex items-center justify-between min-h-[56px]"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-black text-base sm:text-lg text-blue-950 block">
                      {prob.title}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {prob.description}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
