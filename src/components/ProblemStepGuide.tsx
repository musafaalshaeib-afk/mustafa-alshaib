import React, { useState, useEffect } from 'react';
import { SupportSession, DeviceProfile, TrustedContact } from '../types';
import { VisualGuideOverlay } from './VisualGuideOverlay';
import { CameraViewfinder } from './CameraViewfinder';
import { PrintExportModal } from './PrintExportModal';
import { speakDutch, stopSpeaking, isSpeaking } from '../services/speech';
import { getNextStep } from '../services/api';
import { 
  Check, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  XOctagon, 
  Camera, 
  PartyPopper, 
  Phone, 
  MessageSquare, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Printer
} from 'lucide-react';

interface ProblemStepGuideProps {
  session: SupportSession;
  deviceProfile: DeviceProfile;
  trustedContact: TrustedContact | null;
  onUpdateSession: (session: SupportSession) => void;
  onEndSession: () => void;
  onAskFamily: (problem: string, stepsDone: string[]) => void;
  fontSize: 'normal' | 'large' | 'extralarge';
  autoTTS?: boolean;
  onAutoTTSChange?: (val: boolean) => void;
}

export const ProblemStepGuide: React.FC<ProblemStepGuideProps> = ({
  session,
  deviceProfile,
  trustedContact,
  onUpdateSession,
  onEndSession,
  onAskFamily,
  fontSize,
  autoTTS,
  onAutoTTSChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fallbackFirstStep = {
    stepNumber: 1,
    totalEstimatedSteps: 3,
    title: 'Kijk naar uw beeldscherm',
    instruction: 'Kijk rustig naar het beeldscherm. Staat het programma dat u zoekt open of ziet u een melding?',
    detailedTip: 'Als er een venster in de weg staat, klik dan op het kruisje (x) rechtsboven.',
    visualHint: {
      targetArea: 'center' as const,
      label: 'Kijk naar het midden van het scherm',
    },
  };

  const currentStep =
    (session.steps && session.steps[session.currentStepIndex]) || fallbackFirstStep;

  // Auto-read step aloud if autoTTS is enabled
  useEffect(() => {
    if (autoTTS && currentStep) {
      const speechText = `Stap ${currentStep.stepNumber}. ${currentStep.title}. ${currentStep.instruction}. ${currentStep.detailedTip || ''}`;
      speakDutch(
        speechText,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  }, [currentStep.stepNumber, autoTTS]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleReadAloud = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    if (!currentStep) return;

    const speechText = `Stap ${currentStep.stepNumber}. ${currentStep.title}. ${currentStep.instruction}. ${currentStep.detailedTip || ''}`;

    speakDutch(
      speechText,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  const handleSuccess = async () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setFeedbackNote(null);

    // 1. If session already has a predefined next step, advance immediately!
    if (session.currentStepIndex + 1 < session.steps.length) {
      const nextIndex = session.currentStepIndex + 1;
      const nextStep = session.steps[nextIndex];
      const updated: SupportSession = {
        ...session,
        currentStepIndex: nextIndex,
      };
      onUpdateSession(updated);
      speakDutch(`Goed gedaan! Nu de volgende stap. Stap ${nextStep.stepNumber}: ${nextStep.title}. ${nextStep.instruction}`);
      return;
    }

    // 2. Otherwise request next step or check if resolved
    setIsLoading(true);
    const history = session.steps.map((s) => ({
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      userFeedback: 'Gelukt',
    }));

    try {
      const response = await getNextStep(
        session.detectedProblem || session.originalProblem,
        currentStep.stepNumber,
        'success',
        undefined,
        undefined,
        history,
        deviceProfile
      );

      if (response.isResolved || !response.nextStep) {
        // Marked as Solved
        const updated: SupportSession = {
          ...session,
          status: 'solved',
        };
        onUpdateSession(updated);
        speakDutch('Wat fijn! Het probleem is opgelost. Goed gedaan!');
      } else {
        // Next single step
        const updatedSteps = [...session.steps, response.nextStep];
        const updated: SupportSession = {
          ...session,
          steps: updatedSteps,
          currentStepIndex: session.currentStepIndex + 1,
        };
        onUpdateSession(updated);

        speakDutch(
          `Goed gedaan! Nu de volgende stap. Stap ${response.nextStep.stepNumber}: ${response.nextStep.title}. ${response.nextStep.instruction}`
        );
      }
    } catch (err: any) {
      console.warn('Next step fallback:', err);
      // Resilient fallback so the senior is never blocked by an error message!
      if (session.currentStepIndex >= 2) {
        // After 2-3 steps, conclude successfully
        const updated: SupportSession = {
          ...session,
          status: 'solved',
        };
        onUpdateSession(updated);
        speakDutch('Wat fijn! Alle stappen zijn doorlopen. Uw computer zou nu weer moeten werken.');
      } else {
        // Add a safe final verification step
        const fallbackNextStep = {
          stepNumber: session.currentStepIndex + 2,
          totalEstimatedSteps: session.currentStepIndex + 2,
          title: 'Computer opnieuw opstarten',
          instruction: 'Start de computer nu een keertje rustig opnieuw op via de Windows startknop linksonder. Vaak werkt alles daarna direct weer.',
          detailedTip: 'Klik linksonder op Start -> Aan/Uit -> Opnieuw opstarten.',
          visualHint: {
            targetArea: 'bottom-left' as const,
            label: 'Startknop linksonder -> Opnieuw opstarten',
          },
        };
        const updatedSteps = [...session.steps, fallbackNextStep];
        const updated: SupportSession = {
          ...session,
          steps: updatedSteps,
          currentStepIndex: session.currentStepIndex + 1,
        };
        onUpdateSession(updated);
        speakDutch(`Nu de volgende stap: ${fallbackNextStep.instruction}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCannotFind = async () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setFeedbackNote(null);
    setIsLoading(true);

    const history = session.steps.map((s) => ({
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      userFeedback: 'Kon de knop of plek niet vinden',
    }));

    try {
      const response = await getNextStep(
        session.detectedProblem || session.originalProblem,
        currentStep.stepNumber,
        'cannot_find',
        undefined,
        undefined,
        history,
        deviceProfile
      );

      if (response.nextStep) {
        const updatedSteps = [...session.steps];
        updatedSteps[session.currentStepIndex] = {
          ...response.nextStep,
          title: `Alternatief: ${response.nextStep.title}`,
        };

        const updated: SupportSession = {
          ...session,
          steps: updatedSteps,
        };
        onUpdateSession(updated);

        speakDutch(
          `Geen probleem, we proberen het anders. ${response.nextStep.instruction}`
        );
      }
    } catch (err: any) {
      console.warn('Cannot find fallback:', err);
      // In-place friendly alternative without showing an error
      const updatedSteps = [...session.steps];
      updatedSteps[session.currentStepIndex] = {
        ...currentStep,
        title: 'Kijk op uw toetsenbord',
        instruction: 'Kunt u de knop niet vinden? Druk op uw toetsenbord op de Windows-toets (met het vlaggetje of de vier vierkantjes linksonder).',
        detailedTip: 'Deze zit meestal linksonder tussen de Ctrl en Alt toets.',
        visualHint: {
          targetArea: 'keyboard' as const,
          label: 'Windows-toets op toetsenbord',
        },
      };
      onUpdateSession({ ...session, steps: updatedSteps });
      speakDutch('Geen probleem, we proberen het anders: Druk op uw toetsenbord op de Windows-toets met de vier vierkantjes linksonder.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraSnapshot = async (base64Image: string) => {
    setIsCameraOpen(false);
    stopSpeaking();
    setIsLoading(true);

    const history = session.steps.map((s) => ({
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      userFeedback: 'Schermfoto ingestuurd',
    }));

    try {
      const response = await getNextStep(
        session.detectedProblem || session.originalProblem,
        currentStep.stepNumber,
        'success',
        undefined,
        base64Image,
        history,
        deviceProfile
      );

      if (response.isResolved || !response.nextStep) {
        const updated: SupportSession = {
          ...session,
          status: 'solved',
        };
        onUpdateSession(updated);
      } else {
        const updatedSteps = [...session.steps, response.nextStep];
        const updated: SupportSession = {
          ...session,
          steps: updatedSteps,
          currentStepIndex: session.currentStepIndex + 1,
        };
        onUpdateSession(updated);
        speakDutch(`Ik heb uw scherm bekeken! Hier is de volgende stap: ${response.nextStep.instruction}`);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackNote('Kon de foto niet analyseren. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  // If session is solved
  if (session.status === 'solved') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 my-6 text-center animate-in zoom-in-95">
        <div className="bg-emerald-50 border-4 border-emerald-500 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-emerald-200 animate-bounce">
            <PartyPopper className="w-12 h-12" />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mb-2">
              Wat fijn! Het is gelukt! 🎉
            </h2>
            <p className="text-xl text-emerald-800 font-medium">
              Uw computerprobleem is opgelost. U heeft het fantastisch gedaan.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 text-slate-700 text-base">
            <span className="font-bold text-slate-900">Opgelost probleem:</span> {session.detectedProblem || session.originalProblem}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 bg-white hover:bg-emerald-100 text-emerald-950 font-extrabold text-base sm:text-lg py-4 px-6 rounded-2xl shadow-md border-2 border-emerald-400 flex items-center justify-center gap-2.5 active:scale-98 transition-all min-h-[60px]"
            >
              <Printer className="w-6 h-6 text-emerald-700" />
              <span>🖨️ Stappenplan afdrukken voor later</span>
            </button>
            <button
              onClick={onEndSession}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-emerald-400 active:scale-98 transition-all min-h-[60px]"
            >
              Klaar / Terug naar startscherm
            </button>
          </div>

          <PrintExportModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            session={session}
            deviceProfile={deviceProfile}
            trustedContact={trustedContact}
          />
        </div>
      </div>
    );
  }

  // Dynamic font sizing classes
  const textSizeClass =
    fontSize === 'extralarge'
      ? 'text-2xl sm:text-3xl leading-relaxed'
      : fontSize === 'large'
      ? 'text-xl sm:text-2xl leading-relaxed'
      : 'text-lg sm:text-xl leading-normal';

  const titleSizeClass =
    fontSize === 'extralarge' ? 'text-3xl sm:text-4xl font-black' : 'text-2xl sm:text-3xl font-black';

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-28">
      
      {/* Problem Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block">Probleem:</span>
          <p className="text-lg font-bold text-blue-950">
            {session.detectedProblem || session.originalProblem}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-white hover:bg-blue-100 text-blue-900 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl border-2 border-blue-300 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all min-h-[42px]"
            title="Exporteer naar printervriendelijk formaat"
          >
            <Printer className="w-4 h-4 text-blue-700" />
            <span>🖨️ Stappenplan afdrukken</span>
          </button>
          <button
            onClick={onEndSession}
            className="text-xs text-slate-500 hover:text-red-700 font-bold px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 min-h-[42px]"
          >
            Stop hulp
          </button>
        </div>
      </div>

      {/* Main Single Step Card */}
      <div className="bg-white rounded-3xl border-4 border-blue-600 p-4 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
        
        {/* Step Badge & Voice Reading / Print button */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-slate-100 pb-3 sm:pb-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-black text-lg sm:text-xl shadow-sm">
            <span>Stap {currentStep.stepNumber}</span>
            {currentStep.totalEstimatedSteps && (
              <span className="text-blue-200 text-xs sm:text-sm font-semibold">
                (ongeveer {currentStep.totalEstimatedSteps} stappen)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Auto-TTS Badge & Quick Toggle */}
            {onAutoTTSChange && (
              <button
                type="button"
                onClick={() => onAutoTTSChange(!autoTTS)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl font-bold text-xs border-2 transition-all min-h-[44px] ${
                  autoTTS
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
                title={autoTTS ? 'Automatisch voorlezen staat AAN. Klik om uit te zetten.' : 'Automatisch voorlezen staat UIT. Klik om in te schakelen.'}
              >
                <span>{autoTTS ? '🔊 Auto: Aan' : '🔇 Auto: Uit'}</span>
              </button>
            )}

            {/* Afdrukken Button */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border-2 border-slate-300 transition-all min-h-[44px]"
              title="Afdrukken of opslaan als document"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span className="hidden xs:inline">Afdrukken</span>
            </button>

            {/* Lees Voor Button */}
            <button
              onClick={handleReadAloud}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-bold text-sm sm:text-base transition-all border-2 shadow-sm min-h-[44px] ${
                isPlayingAudio
                  ? 'bg-amber-400 text-slate-950 border-amber-500 animate-pulse'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-950 border-blue-300'
              }`}
              aria-label="Lees deze stap rustig voor"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                  <span>🔊 Lees voor</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step Title & Instruction (THE SINGLE ACTION) */}
        <div className="space-y-4">
          <h2 className={`${titleSizeClass} text-slate-900 tracking-tight`}>
            {currentStep.title}
          </h2>

          <div className="bg-amber-50/70 border-l-8 border-amber-400 p-5 rounded-r-2xl">
            <p className={`${textSizeClass} text-slate-950 font-bold`}>
              {currentStep.instruction}
            </p>
          </div>

          {currentStep.detailedTip && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-base flex items-start gap-2">
              <span className="text-xl">💡</span>
              <span className="font-medium">{currentStep.detailedTip}</span>
            </div>
          )}
        </div>

        {/* Visual Guide Simulation / Screen Overlay */}
        {currentStep.visualHint && (
          <VisualGuideOverlay
            hint={currentStep.visualHint}
            windowsVersion={deviceProfile.windowsVersion}
          />
        )}

        {feedbackNote && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 text-base font-semibold">
            {feedbackNote}
          </div>
        )}

        {/* PRIMARY ACTION BUTTONS (GOUDEN REGEL) */}
        <div className="space-y-4 pt-4 border-t-2 border-slate-100">
          
          {/* Button 1: GELUKT */}
          <button
            onClick={handleSuccess}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xl sm:text-2xl py-4 sm:py-5 px-4 sm:px-6 rounded-2xl shadow-xl border-4 border-emerald-400 flex items-center justify-center gap-3 sm:gap-4 active:scale-98 transition-all min-h-[64px] sm:min-h-[72px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-2xl">⏳</span>
                <span>Even geduld a.u.b...</span>
              </span>
            ) : (
              <>
                <Check className="w-7 h-7 sm:w-9 sm:h-9 stroke-[3.5] text-white shrink-0" />
                <span>Gelukt (Volgende stap)</span>
              </>
            )}
          </button>

          {/* Secondary helper row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Button 2: IK ZIE DIT NIET */}
            <button
              onClick={handleCannotFind}
              disabled={isLoading}
              className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-lg py-4 px-4 rounded-2xl border-2 border-amber-400 flex items-center justify-center gap-2 min-h-[56px] active:scale-98 transition-all shadow-sm"
            >
              <HelpCircle className="w-6 h-6 text-amber-800 shrink-0" />
              <span>Ik zie dit niet</span>
            </button>

            {/* Button 3: CAMERA KIJK MEE */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-950 font-extrabold text-lg py-4 px-4 rounded-2xl border-2 border-blue-400 flex items-center justify-center gap-2 min-h-[56px] active:scale-98 transition-all shadow-sm"
            >
              <Camera className="w-6 h-6 text-blue-700 shrink-0" />
              <span>Foto van scherm maken</span>
            </button>
          </div>

          {/* Button 4: Vraag familie / vertrouwde contact */}
          <div className="pt-2">
            <button
              onClick={() =>
                onAskFamily(
                  session.detectedProblem || session.originalProblem,
                  session.steps.map((s) => `Stap ${s.stepNumber}: ${s.title}`)
                )
              }
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base py-3.5 px-4 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 min-h-[50px]"
            >
              <Phone className="w-5 h-5 text-emerald-700" />
              <span>
                Komt u er niet uit? Vraag hulp aan {trustedContact?.name || 'een familielid'}
              </span>
            </button>
          </div>

          {/* Handige link: Stappenplan op papier */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-blue-700 hover:text-blue-900 py-2 px-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Wilt u alle stappen op papier lezen? Klik hier voor printervriendelijk afdrukken</span>
            </button>
          </div>

        </div>

      </div>

      {/* Camera Viewfinder Modal */}
      <CameraViewfinder
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureImage={handleCameraSnapshot}
      />

      {/* Printervriendelijk Stappenplan Export Modal */}
      <PrintExportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        session={session}
        deviceProfile={deviceProfile}
        trustedContact={trustedContact}
      />

    </div>
  );
};
