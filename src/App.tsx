/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DeviceProfile, 
  TrustedContact, 
  SupportSession, 
  SupportStep 
} from './types';
import { 
  getStoredDeviceProfile, 
  saveDeviceProfile, 
  getStoredTrustedContact, 
  saveTrustedContact, 
  getStoredActiveSession, 
  saveActiveSession, 
  getStoredFontSize, 
  saveFontSize, 
  getStoredAutoTTS, 
  saveAutoTTS,
  getStoredVoiceEnabled,
  saveVoiceEnabled,
  getStoredSessionHistory,
  saveSessionToHistory,
  deleteSessionFromHistory,
  clearSessionHistory,
  sampleSessionHistory
} from './services/storage';
import { Header } from './components/Header';
import { Navbar, NavTab } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ProblemStepGuide } from './components/ProblemStepGuide';
import { SafetyCheckScreen } from './components/SafetyCheckScreen';
import { ErrorCodeSearch } from './components/ErrorCodeSearch';
import { TrustedContactScreen } from './components/TrustedContactScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ChatbotScreen } from './components/ChatbotScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { VoiceInputModal } from './components/VoiceInputModal';
import { CameraViewfinder } from './components/CameraViewfinder';
import { analyseProblem } from './services/api';
import { speakDutch, stopSpeaking } from './services/speech';
import { Sparkles, Check, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>(getStoredDeviceProfile());
  const [trustedContact, setTrustedContact] = useState<TrustedContact | null>(getStoredTrustedContact());
  const [activeSession, setActiveSession] = useState<SupportSession | null>(getStoredActiveSession());
  const [history, setHistory] = useState<SupportSession[]>(getStoredSessionHistory());
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extralarge'>(getStoredFontSize());
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(getStoredVoiceEnabled());
  const [autoTTS, setAutoTTS] = useState<boolean>(getStoredVoiceEnabled());

  // Modals & Sub-screens
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isSafetyCheckOpen, setIsSafetyCheckOpen] = useState(false);
  const [isErrorCodeSearchOpen, setIsErrorCodeSearchOpen] = useState(false);

  // Photo analysis preview confirmation modal
  const [analyzedPhotoData, setAnalyzedPhotoData] = useState<{
    detectedProblem: string;
    programName?: string;
    firstStep: SupportStep;
    image?: string;
  } | null>(null);
  const [isAnalysingPhoto, setIsAnalysingPhoto] = useState(false);

  // Sync to storage
  const handleUpdateDeviceProfile = (profile: DeviceProfile) => {
    setDeviceProfile(profile);
    saveDeviceProfile(profile);
  };

  const handleUpdateTrustedContact = (contact: TrustedContact) => {
    setTrustedContact(contact);
    saveTrustedContact(contact);
  };

  const handleUpdateSession = (session: SupportSession) => {
    setActiveSession(session);
    saveActiveSession(session);
    saveSessionToHistory(session);
    setHistory(getStoredSessionHistory());
  };

  const handleEndSession = () => {
    setActiveSession(null);
    saveActiveSession(null);
    setActiveTab('home');
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'extralarge') => {
    setFontSize(size);
    saveFontSize(size);
  };

  const handleToggleVoice = () => {
    const nextVal = !isVoiceEnabled;
    setIsVoiceEnabled(nextVal);
    setAutoTTS(nextVal);
    saveVoiceEnabled(nextVal);
    if (!nextVal) {
      stopSpeaking();
    }
  };

  const handleAutoTTSChange = (val: boolean) => {
    setAutoTTS(val);
    setIsVoiceEnabled(val);
    saveVoiceEnabled(val);
    if (!val) {
      stopSpeaking();
    }
  };

  // Start new step-by-step session
  const handleStartSession = (session: SupportSession) => {
    setActiveSession(session);
    saveActiveSession(session);
    saveSessionToHistory(session);
    setHistory(getStoredSessionHistory());
    setIsErrorCodeSearchOpen(false);
    setIsSafetyCheckOpen(false);
    setActiveTab('support');

    if (session.steps && session.steps[0]) {
      const step = session.steps[0];
      speakDutch(`We gaan u helpen met: ${session.detectedProblem || session.originalProblem}. Stap 1: ${step.title}. ${step.instruction}`);
    }
  };

  // History action handlers
  const handleReopenSessionFromHistory = (session: SupportSession) => {
    setActiveSession(session);
    saveActiveSession(session);
    setActiveTab('support');
    const step = session.steps[session.currentStepIndex || 0] || session.steps[0];
    if (step) {
      speakDutch(`Stappenplan geopend voor: ${session.detectedProblem || session.originalProblem}. Stap ${step.stepNumber}: ${step.title}. ${step.instruction}`);
    }
  };

  const handleDeleteSessionFromHistory = (sessionId: string) => {
    deleteSessionFromHistory(sessionId);
    setHistory(getStoredSessionHistory());
  };

  const handleClearAllHistory = () => {
    clearSessionHistory();
    setHistory([]);
  };

  const handleRestoreSampleHistory = () => {
    localStorage.setItem('kijkhulp_session_history', JSON.stringify(sampleSessionHistory));
    setHistory(sampleSessionHistory);
  };

  // Handle image analysis from camera or file
  const handlePhotoCaptured = async (base64Image: string) => {
    setIsCameraModalOpen(false);
    setIsAnalysingPhoto(true);

    try {
      const response = await analyseProblem(undefined, base64Image, deviceProfile);
      setAnalyzedPhotoData({
        detectedProblem: response.detectedProblem,
        programName: response.programName,
        firstStep: response.firstStep,
        image: base64Image,
      });

      speakDutch(
        `Ik denk dat ik het probleem zie: ${response.detectedProblem}. Wilt u dat ik u stap voor stap help?`
      );
    } catch (err: any) {
      console.error(err);
      // Fallback
      setAnalyzedPhotoData({
        detectedProblem: 'Scherm geanalyseerd: Windows probleem gedetecteerd',
        firstStep: {
          stepNumber: 1,
          totalEstimatedSteps: 2,
          title: 'Controleer openstaande vensters',
          instruction: 'Kijk naar het actieve venster en klik op het kruisje (x) rechtsboven als u het wilt sluiten.',
          visualHint: {
            targetArea: 'top-right',
            label: 'Kruisje rechtsboven',
          },
        },
        image: base64Image,
      });
    } finally {
      setIsAnalysingPhoto(false);
    }
  };

  const handleConfirmPhotoHelp = () => {
    if (!analyzedPhotoData) return;

    const newSession: SupportSession = {
      id: `photo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      originalProblem: 'Foto van computerscherm',
      detectedProblem: analyzedPhotoData.detectedProblem,
      programName: analyzedPhotoData.programName,
      status: 'in_progress',
      currentStepIndex: 0,
      steps: [analyzedPhotoData.firstStep],
      screenshotUrl: analyzedPhotoData.image,
    };

    setAnalyzedPhotoData(null);
    handleStartSession(newSession);
  };

  const handleVoiceProblemSubmit = (spokenText: string) => {
    setIsVoiceModalOpen(false);
    const newSession: SupportSession = {
      id: `voice-${Date.now()}`,
      timestamp: new Date().toISOString(),
      originalProblem: spokenText,
      detectedProblem: spokenText,
      status: 'in_progress',
      currentStepIndex: 0,
      steps: [],
    };

    // Analyse and start
    analyseProblem(spokenText, undefined, deviceProfile)
      .then((res) => {
        newSession.detectedProblem = res.detectedProblem;
        newSession.programName = res.programName;
        newSession.steps = [res.firstStep];
        handleStartSession(newSession);
      })
      .catch(() => {
        newSession.steps = [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Eerste controle',
            instruction: 'Kijk rustig naar het beeldscherm. Staat het programma dat u zoekt in de balk onderaan?',
            visualHint: {
              targetArea: 'bottom-left',
              label: 'Taakbalk onderaan',
            },
          },
        ];
        handleStartSession(newSession);
      });
  };

  const handleAskFamily = (problem: string, stepsDone: string[]) => {
    setActiveTab('trusted');
  };

  // Font size multiplier
  const fontSizeWrapper =
    fontSize === 'extralarge'
      ? 'text-xl'
      : fontSize === 'large'
      ? 'text-lg'
      : 'text-base';

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col ${fontSizeWrapper}`}>
      
      {/* Header */}
      <Header
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={handleToggleVoice}
        trustedContact={trustedContact}
        onOpenTrustedContact={() => setActiveTab('trusted')}
        onEmergencySafety={() => {
          setIsSafetyCheckOpen(true);
          setIsErrorCodeSearchOpen(false);
        }}
      />

      {/* Main Content View */}
      <main className={`flex-1 w-full ${activeTab === 'chat' ? 'h-[calc(100dvh-148px)] max-h-[calc(100dvh-148px)] overflow-hidden flex flex-col' : ''}`}>
        {isSafetyCheckOpen ? (
          <SafetyCheckScreen
            trustedContact={trustedContact}
            onBack={() => setIsSafetyCheckOpen(false)}
            onOpenTrustedContact={() => {
              setIsSafetyCheckOpen(false);
              setActiveTab('trusted');
            }}
          />
        ) : isErrorCodeSearchOpen ? (
          <ErrorCodeSearch
            onBack={() => setIsErrorCodeSearchOpen(false)}
            onStartSession={handleStartSession}
            deviceProfile={deviceProfile}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                onOpenCameraModal={() => setIsCameraModalOpen(true)}
                onOpenSafetyCheck={() => setIsSafetyCheckOpen(true)}
                onOpenErrorCodeSearch={() => setIsErrorCodeSearchOpen(true)}
                onOpenChat={() => setActiveTab('chat')}
                onOpenHistory={() => setActiveTab('history')}
                onOpenTrustedContact={() => setActiveTab('trusted')}
                onStartSession={handleStartSession}
                deviceProfile={deviceProfile}
                onUpdateDeviceProfile={handleUpdateDeviceProfile}
                fontSize={fontSize}
                isVoiceEnabled={isVoiceEnabled}
                onToggleVoice={handleToggleVoice}
              />
            )}

            {activeTab === 'chat' && (
              <ChatbotScreen
                deviceProfile={deviceProfile}
                fontSize={fontSize}
                onFontSizeChange={handleFontSizeChange}
                onStartSupportFlow={(text) => {
                  handleVoiceProblemSubmit(text);
                }}
              />
            )}

            {activeTab === 'support' && (
              activeSession ? (
                <ProblemStepGuide
                  session={activeSession}
                  deviceProfile={deviceProfile}
                  trustedContact={trustedContact}
                  onUpdateSession={handleUpdateSession}
                  onEndSession={handleEndSession}
                  onAskFamily={handleAskFamily}
                  fontSize={fontSize}
                  autoTTS={autoTTS}
                  onAutoTTSChange={handleAutoTTSChange}
                />
              ) : (
                <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
                  <div className="bg-white rounded-3xl p-8 border-3 border-slate-300 shadow-lg space-y-4">
                    <div className="w-20 h-20 bg-blue-100 text-blue-800 rounded-3xl flex items-center justify-center mx-auto text-4xl">
                      🛠️
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">
                      Geen actief stappenplan
                    </h2>
                    <p className="text-slate-600 text-lg">
                      U heeft op dit moment geen actief probleem geopend. Ga naar het startscherm om een vraag in te spreken of een foto te maken.
                    </p>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl py-4 px-8 rounded-2xl shadow-lg border-2 border-blue-400 min-h-[56px]"
                    >
                      Naar het startscherm
                    </button>
                  </div>
                </div>
              )
            )}

            {activeTab === 'history' && (
              <HistoryScreen
                history={history}
                onReopenSession={handleReopenSessionFromHistory}
                onDeleteSession={handleDeleteSessionFromHistory}
                onClearAllHistory={handleClearAllHistory}
                onRestoreSampleHistory={handleRestoreSampleHistory}
                fontSize={fontSize}
                onNavigateHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'trusted' && (
              <TrustedContactScreen
                trustedContact={trustedContact}
                onSaveContact={handleUpdateTrustedContact}
                currentProblemText={activeSession?.detectedProblem || activeSession?.originalProblem}
                stepsDone={activeSession?.steps.map((s) => `Stap ${s.stepNumber}: ${s.title}`)}
                deviceProfile={deviceProfile}
                fontSize={fontSize}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                profile={deviceProfile}
                onSaveProfile={handleUpdateDeviceProfile}
                fontSize={fontSize}
                onFontSizeChange={handleFontSizeChange}
                autoTTS={autoTTS}
                onAutoTTSChange={handleAutoTTSChange}
                onClearData={() => {
                  setDeviceProfile(getStoredDeviceProfile());
                  setTrustedContact(null);
                  setActiveSession(null);
                  clearSessionHistory();
                  setHistory([]);
                  setActiveTab('home');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Navigation (max 4 items) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsSafetyCheckOpen(false);
          setIsErrorCodeSearchOpen(false);
          setActiveTab(tab);
        }}
        hasActiveSession={!!activeSession && activeSession.status === 'in_progress'}
      />

      {/* Voice Recognition Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSubmitProblem={handleVoiceProblemSubmit}
      />

      {/* Live Camera Viewfinder Modal */}
      <CameraViewfinder
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureImage={handlePhotoCaptured}
      />

      {/* Loading overlay during photo analysis */}
      {isAnalysingPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-24 h-24 rounded-full border-8 border-blue-400 border-t-amber-400 animate-spin mb-6" />
          <h2 className="text-3xl font-black mb-2">📸 Foto wordt bekeken...</h2>
          <p className="text-xl text-blue-200 max-w-md">
            Onze assistent herkent het venster, eventuele knoppen en foutmeldingen. Even geduld alstublieft.
          </p>
        </div>
      )}

      {/* Photo Analysis Confirmation Screen ("Ik denk dat ik het probleem zie") */}
      {analyzedPhotoData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-blue-600 space-y-5 sm:space-y-6 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center mx-auto text-2xl sm:text-3xl font-black border-2 border-blue-300">
                🔍
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                Ik denk dat ik het probleem zie.
              </h2>
            </div>

            <div className="p-4 sm:p-5 bg-blue-50 border-3 border-blue-200 rounded-2xl space-y-1.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Gedetecteerd:</span>
              <p className="text-xl sm:text-2xl font-black text-blue-950 break-words">
                {analyzedPhotoData.detectedProblem}
              </p>
            </div>

            <p className="text-lg sm:text-xl font-bold text-slate-800 text-center">
              Wilt u dat ik u stap voor stap help?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmPhotoHelp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl sm:text-2xl py-4 sm:py-5 px-6 rounded-2xl shadow-xl border-4 border-emerald-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[60px] sm:min-h-[68px]"
              >
                <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5]" />
                <span>Ja, help mij</span>
              </button>

              <button
                onClick={() => setAnalyzedPhotoData(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base sm:text-lg py-3 px-6 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px]"
              >
                <X className="w-5 h-5" />
                <span>Nee, terug</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
