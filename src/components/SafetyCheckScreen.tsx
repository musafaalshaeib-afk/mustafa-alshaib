import React, { useState } from 'react';
import { SafetyCheckResult, TrustedContact } from '../types';
import { checkSafety } from '../services/api';
import { speakDutch, stopSpeaking } from '../services/speech';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  Phone, 
  Upload, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  CheckCircle2, 
  Copy, 
  X, 
  ExternalLink,
  Lock
} from 'lucide-react';

interface SafetyCheckScreenProps {
  trustedContact: TrustedContact | null;
  onBack: () => void;
  onOpenTrustedContact: () => void;
}

export const SafetyCheckScreen: React.FC<SafetyCheckScreenProps> = ({
  trustedContact,
  onBack,
  onOpenTrustedContact,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SafetyCheckResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunCheck = async () => {
    if (!inputText && !imageBase64 && !inputUrl) {
      setErrorMsg('Voer alstublieft een tekst, link of foto in om te controleren.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    stopSpeaking();
    setIsPlayingAudio(false);

    try {
      const data = await checkSafety(inputText, imageBase64 || undefined, inputUrl || undefined);
      setResult(data);

      // Read summary automatically
      speakDutch(`${data.headline}. ${data.explanation}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Kon de veiligheidscontrole niet voltooien. Neem bij twijfel altijd contact op met familie of uw bank!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadResult = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    if (!result) return;
    const textToRead = `${result.headline}. ${result.explanation}. Dingen die u niet moet doen: ${result.warningActions.join('. ')}. Veilige acties: ${result.safeNextSteps.join('. ')}`;
    speakDutch(
      textToRead,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  const handleReset = () => {
    setInputText('');
    setInputUrl('');
    setImageBase64(null);
    setResult(null);
    setErrorMsg(null);
    stopSpeaking();
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
        <div className="flex items-center gap-2 text-red-600 font-black text-xl">
          <ShieldAlert className="w-7 h-7" />
          <span>Veiligheidscontrole</span>
        </div>
      </div>

      {!result ? (
        /* Input Form */
        <div className="bg-white rounded-3xl border-4 border-red-500 p-5 sm:p-8 shadow-2xl space-y-6">
          
          <div className="border-b-2 border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>🚨 Is dit veilig?</span>
            </h2>
            <p className="text-lg text-slate-600 font-medium mt-1">
              Twijfelt u over een verdachte e-mail, sms, website, telefoontje of pop-up op uw scherm? KijkHulp controleert het direct voor u.
            </p>
          </div>

          {/* Option 1: Paste Text */}
          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-900">
              1. Plak of typ hier de tekst van het bericht of telefoontje:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Bijvoorbeeld: 'Uw DigiD verloopt', 'Pakketje bezorgen klik hier', 'Microsoft medewerker belt u'..."
              rows={4}
              className="w-full p-4 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-red-500 focus:ring-4 focus:ring-red-200 outline-none"
            />
          </div>

          {/* Option 2: Upload Screenshot / Photo */}
          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-900">
              2. Of voeg een foto/screenshot van het scherm toe:
            </label>
            {imageBase64 ? (
              <div className="relative rounded-2xl border-2 border-emerald-500 overflow-hidden bg-slate-100 p-2 flex items-center justify-between">
                <img src={imageBase64} alt="Voorbeeld" className="h-24 object-contain rounded-lg" />
                <button
                  onClick={() => setImageBase64(null)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-4 py-2 rounded-xl border border-red-300 flex items-center gap-1"
                >
                  <X className="w-5 h-5" />
                  <span>Verwijder foto</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-3 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/50 rounded-2xl cursor-pointer transition-all">
                <Upload className="w-8 h-8 text-red-500 mb-2" />
                <span className="text-lg font-bold text-slate-800">📸 Kies een foto of screenshot</span>
                <span className="text-sm text-slate-500">Van de e-mail, het sms'je of de pop-up</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Option 3: URL Link */}
          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-900">
              3. Of typ het websiteadres (link) dat u niet vertrouwt:
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Bijvoorbeeld: www.mijn-bank-inloggen-veilig.xyz"
              className="w-full p-4 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-red-500 focus:ring-4 focus:ring-red-200 outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 text-base font-bold">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleRunCheck}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-2xl py-5 px-6 rounded-2xl shadow-xl border-4 border-red-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[68px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-2xl">⏳</span>
                <span>Veiligheid wordt gecontroleerd...</span>
              </span>
            ) : (
              <>
                <ShieldAlert className="w-8 h-8" />
                <span>Controleer dit direct</span>
              </>
            )}
          </button>

          {/* Quick Examples */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Veelvoorkomende voorbeelden:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInputText('Microsoft medewerker belt dat er virussen op mijn computer staan en dat ik AnyDesk moet installeren')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl border border-slate-300"
              >
                📞 "Microsoft belt over virus"
              </button>
              <button
                onClick={() => setInputText('Sms ontvangen van DigiD: Uw inlogcode is verlopen, klik op deze link om te vernieuwen')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl border border-slate-300"
              >
                💬 "DigiD sms verlopen"
              </button>
              <button
                onClick={() => setInputText('Pop-up op scherm: Uw computer is geblokkeerd! Bel direct 0800-12345')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl border border-slate-300"
              >
                🖥️ "Scherm geblokkeerd pop-up"
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Result Screen */
        <div className="space-y-6">
          
          {result.isDangerous || result.riskLevel === 'dangerous' ? (
            /* HUGE RED STOP SCREEN */
            <div className="bg-red-600 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-red-800 space-y-6 text-center animate-in zoom-in-95">
              
              <div className="w-28 h-28 bg-white text-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-8 ring-red-400 animate-bounce">
                <AlertOctagon className="w-18 h-18 stroke-[2.5]" />
              </div>

              <div>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                  ⚠️ STOP! GEVAARLIJK
                </h2>
                <p className="text-2xl font-bold text-red-100">
                  {result.headline}
                </p>
              </div>

              <div className="bg-red-950/70 p-5 rounded-2xl border-2 border-red-400 text-left space-y-2">
                <p className="text-xl font-bold text-red-200">Uitleg:</p>
                <p className="text-lg text-white font-medium leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Warning Actions (Things NEVER to do) */}
              <div className="bg-white text-red-950 rounded-2xl p-6 text-left border-3 border-red-300 shadow-lg space-y-3">
                <h3 className="text-2xl font-black text-red-700 flex items-center gap-2">
                  <X className="w-7 h-7 stroke-[3]" />
                  <span>Wat u ABSOLUUT NIET moet doen:</span>
                </h3>
                <ul className="space-y-2 text-lg font-bold">
                  {result.warningActions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-600 text-xl font-black">❌</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safe Next Steps */}
              <div className="bg-emerald-950/80 text-white rounded-2xl p-6 text-left border-3 border-emerald-400 space-y-3">
                <h3 className="text-2xl font-black text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-7 h-7" />
                  <span>Wat u nu veilig kunt doen:</span>
                </h3>
                <ul className="space-y-2 text-lg font-medium">
                  {result.safeNextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 text-xl">✅</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trusted Contact Call */}
              <div className="pt-4 space-y-3">
                <p className="text-xl font-bold text-red-100">
                  Wilt u iemand die u vertrouwt bellen?
                </p>
                {trustedContact && trustedContact.phoneNumber ? (
                  <a
                    href={`tel:${trustedContact.phoneNumber}`}
                    className="w-full bg-white hover:bg-slate-100 text-red-700 font-black text-2xl py-5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 border-4 border-amber-300 min-h-[68px]"
                  >
                    <Phone className="w-8 h-8" />
                    <span>Bel nu {trustedContact.name} ({trustedContact.relationship})</span>
                  </a>
                ) : (
                  <button
                    onClick={onOpenTrustedContact}
                    className="w-full bg-white hover:bg-slate-100 text-red-700 font-black text-xl py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 min-h-[60px]"
                  >
                    <Phone className="w-6 h-6" />
                    <span>Stel een vertrouwd familielid in om te bellen</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* SAFE / SUSPICIOUS RESULT SCREEN */
            <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border-4 space-y-6 ${
              result.riskLevel === 'safe'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-amber-50 border-amber-500 text-amber-950'
            }`}>
              
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  result.riskLevel === 'safe' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  {result.riskLevel === 'safe' ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">
                    {result.headline}
                  </h2>
                  <p className="text-base font-semibold opacity-80">
                    Status: {result.riskLevel === 'safe' ? 'Veilig' : 'Twijfelachtig / Let op'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 text-lg leading-relaxed font-medium">
                {result.explanation}
              </div>

              {result.safeNextSteps && result.safeNextSteps.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 space-y-2">
                  <p className="font-bold text-lg">Aanbevolen stappen:</p>
                  <ul className="space-y-1.5 text-base">
                    {result.safeNextSteps.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 font-medium">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* Voice read aloud and reset buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReadResult}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-lg py-4 px-6 rounded-2xl border-2 border-blue-500 flex items-center justify-center gap-2 min-h-[56px]"
            >
              <Volume2 className="w-6 h-6" />
              <span>{isPlayingAudio ? 'Stop voorlezen' : '🔊 Lees advies voor'}</span>
            </button>

            <button
              onClick={handleReset}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg py-4 px-6 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 min-h-[56px]"
            >
              <span>Nog iets controleren</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
