import React, { useState } from 'react';
import { ErrorCodeInfo, SupportSession, DeviceProfile } from '../types';
import { checkErrorCode } from '../services/api';
import { speakDutch, stopSpeaking } from '../services/speech';
import { HelpCircle, Search, ArrowLeft, ShieldCheck, AlertCircle, ArrowRight, Volume2, Sparkles } from 'lucide-react';

interface ErrorCodeSearchProps {
  onBack: () => void;
  onStartSession: (session: SupportSession) => void;
  deviceProfile: DeviceProfile;
}

export const ErrorCodeSearch: React.FC<ErrorCodeSearchProps> = ({
  onBack,
  onStartSession,
  deviceProfile,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ErrorCodeInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (codeToSearch?: string) => {
    const targetCode = (codeToSearch || code).trim();
    if (!targetCode) {
      setErrorMessage('Typ alstublieft de letters of cijfers van de foutcode in.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    stopSpeaking();

    try {
      const data = await checkErrorCode(targetCode);
      setErrorInfo(data);
      speakDutch(`Foutcode ${data.code}. ${data.meaning}. ${data.simpleExplanation}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Kon deze foutcode niet ontleden. Controleer of de cijfers en letters kloppen.');
    } finally {
      setIsLoading(false);
    }
  };

  const startStepByStep = () => {
    if (!errorInfo) return;

    const newSession: SupportSession = {
      id: `error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      originalProblem: `Foutcode ${errorInfo.code}`,
      detectedProblem: `${errorInfo.code}: ${errorInfo.meaning}`,
      status: 'in_progress',
      currentStepIndex: 0,
      steps: [errorInfo.firstStep],
    };

    onStartSession(newSession);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-28">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-2xl border-2 border-slate-300 min-h-[48px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Terug</span>
        </button>
        <div className="flex items-center gap-2 text-blue-900 font-black text-xl">
          <HelpCircle className="w-7 h-7 text-blue-600" />
          <span>Foutcode Zoeken</span>
        </div>
      </div>

      {!errorInfo ? (
        <div className="bg-white rounded-3xl border-4 border-blue-600 p-5 sm:p-8 shadow-2xl space-y-6">
          
          <div className="border-b-2 border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welke foutcode ziet u?
            </h2>
            <p className="text-lg text-slate-600 font-medium mt-1">
              Staat er een vreemde code met cijfers of letters op uw scherm? Wij leggen in gewone mensentaal uit wat het betekent.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-bold text-slate-900">
              Typ de foutcode hier in:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Bijv. 0x80070005 of 0x80070422"
                className="flex-1 p-4 border-2 border-slate-300 rounded-2xl text-2xl font-mono uppercase font-bold text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
              />
              <button
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xl px-8 py-4 rounded-2xl shadow-lg border-2 border-blue-400 flex items-center justify-center gap-2 min-h-[60px]"
              >
                {isLoading ? <span className="animate-spin text-2xl">⏳</span> : <Search className="w-6 h-6" />}
                <span>Uitleggen</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 font-bold">
              {errorMessage}
            </div>
          )}

          {/* Quick Clickable Examples */}
          <div className="pt-4 border-t-2 border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Voorbeelden om te testen:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setCode('0x80070005');
                  handleSearch('0x80070005');
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all"
              >
                <span className="font-mono font-bold text-blue-900 block text-lg">0x80070005</span>
                <span className="text-xs text-slate-600">Toegang geweigerd / Machtiging</span>
              </button>
              <button
                onClick={() => {
                  setCode('0x80070422');
                  handleSearch('0x80070422');
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all"
              >
                <span className="font-mono font-bold text-blue-900 block text-lg">0x80070422</span>
                <span className="text-xs text-slate-600">Windows Update dienst staat uit</span>
              </button>
              <button
                onClick={() => {
                  setCode('0x8024402F');
                  handleSearch('0x8024402F');
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all"
              >
                <span className="font-mono font-bold text-blue-900 block text-lg">0x8024402F</span>
                <span className="text-xs text-slate-600">Verbindingsfout tijdens update</span>
              </button>
              <button
                onClick={() => {
                  setCode('ERR_INTERNET_DISCONNECTED');
                  handleSearch('ERR_INTERNET_DISCONNECTED');
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all"
              >
                <span className="font-mono font-bold text-blue-900 block text-sm">ERR_INTERNET_DISCONNECTED</span>
                <span className="text-xs text-slate-600">Internetkabel of Wi-Fi weg</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Explanatory breakdown */
        <div className="bg-white rounded-3xl border-4 border-blue-600 p-5 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
          
          <div className="border-b-2 border-slate-100 pb-4">
            <span className="text-xs text-blue-600 font-black uppercase tracking-widest block mb-1">
              Foutcode Analyse
            </span>
            <h2 className="text-3xl font-black text-slate-900 font-mono">
              {errorInfo.code}
            </h2>
            <p className="text-xl font-bold text-blue-950 mt-1">
              {errorInfo.meaning}
            </p>
          </div>

          {/* 3 Questions answered simply */}
          <div className="space-y-4">
            
            {/* Wat betekent dit? */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-xl font-extrabold text-blue-950 flex items-center gap-2">
                <span>📖 Wat betekent dit?</span>
              </h3>
              <p className="text-lg text-slate-800 leading-relaxed font-medium">
                {errorInfo.simpleExplanation}
              </p>
            </div>

            {/* Is het gevaarlijk? */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <span>Is het gevaarlijk?</span>
              </h3>
              <p className="text-lg text-slate-800 leading-relaxed font-medium">
                {errorInfo.isDangerous
                  ? 'Let even extra op, we helpen u stap voor stap veilig verder.'
                  : 'Nee, uw computer en bestanden zijn niet in gevaar. Dit is een gewone foutmelding die vaak voorkomt.'}
              </p>
            </div>

            {/* Wat kunt u zelf proberen? */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
                <span>🛠️ Wat kunt u zelf proberen?</span>
              </h3>
              <p className="text-lg text-slate-800 leading-relaxed font-medium">
                {errorInfo.safeAttempt || 'We kunnen dit met een paar simpele klikken oplossen.'}
              </p>
            </div>

          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-4 border-t-2 border-slate-100">
            <button
              onClick={startStepByStep}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl py-5 px-6 rounded-2xl shadow-xl border-4 border-emerald-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[68px]"
            >
              <Sparkles className="w-7 h-7 text-amber-300" />
              <span>Start Stap 1 van de oplossing</span>
              <ArrowRight className="w-7 h-7" />
            </button>

            <button
              onClick={() => setErrorInfo(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg py-3 px-4 rounded-2xl border-2 border-slate-300 min-h-[50px]"
            >
              Andere foutcode zoeken
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
