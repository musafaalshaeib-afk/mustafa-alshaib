import React, { useState, useEffect } from 'react';
import { DeviceProfile } from '../types';
import { 
  saveDeviceProfile, 
  clearAllUserData, 
  getStoredVoiceLanguage, 
  saveVoiceLanguage,
  getStoredSpeechRate,
  saveSpeechRate,
  getStoredSpeechRateMultiplier,
  saveSpeechRateMultiplier,
  SpeechSpeed
} from '../services/storage';
import { speakDutch, stopSpeaking, isSpeaking } from '../services/speech';
import { 
  Settings, 
  Laptop, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  Type, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Sparkles,
  Languages,
  Gauge,
  Play,
  Square,
  Sliders
} from 'lucide-react';

interface SettingsScreenProps {
  profile: DeviceProfile;
  onSaveProfile: (profile: DeviceProfile) => void;
  fontSize: 'normal' | 'large' | 'extralarge';
  onFontSizeChange: (size: 'normal' | 'large' | 'extralarge') => void;
  autoTTS: boolean;
  onAutoTTSChange: (val: boolean) => void;
  onClearData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  onSaveProfile,
  fontSize,
  onFontSizeChange,
  autoTTS,
  onAutoTTSChange,
  onClearData,
}) => {
  const [formData, setFormData] = useState<DeviceProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [voiceLang, setVoiceLang] = useState<'nl' | 'ar' | 'auto'>('nl');
  const [speechRate, setSpeechRate] = useState<SpeechSpeed>('normal');
  const [speechMultiplier, setSpeechMultiplier] = useState<number>(1.0);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    setVoiceLang(getStoredVoiceLanguage());
    setSpeechRate(getStoredSpeechRate());
    setSpeechMultiplier(getStoredSpeechRateMultiplier());
  }, []);

  const handleVoiceLangChange = (lang: 'nl' | 'ar' | 'auto') => {
    setVoiceLang(lang);
    saveVoiceLanguage(lang);
    if (lang === 'nl') {
      speakDutch('De stem is nu ingesteld op de Nederlandse taal van KijkHulp.', undefined, undefined, undefined, true);
    } else if (lang === 'ar') {
      speakDutch('تم ضبط الصوت الآن على اللغة العربية بنجاح.');
    } else {
      speakDutch('De voorleesstem past zich nu automatisch aan de tekst aan.');
    }
  };

  const handleSpeechRatePresetChange = (rate: SpeechSpeed) => {
    let mult = 1.0;
    if (rate === 'veryslow') mult = 0.70;
    else if (rate === 'slow') mult = 0.85;
    else if (rate === 'normal') mult = 1.0;
    else if (rate === 'fast') mult = 1.20;

    setSpeechRate(rate);
    setSpeechMultiplier(mult);
    saveSpeechRate(rate);
    saveSpeechRateMultiplier(mult);

    stopSpeaking();
    setIsPlayingTest(true);

    let previewText = 'De spreeksnelheid staat nu op een normaal natuurlijk tempo.';
    if (rate === 'veryslow') {
      previewText = 'De spreeksnelheid staat nu ingesteld op extra rustig. U krijgt alle tijd om te luisteren.';
    } else if (rate === 'slow') {
      previewText = 'De spreeksnelheid staat nu ingesteld op een rustig tempo, prettig voor senioren.';
    } else if (rate === 'fast') {
      previewText = 'De spreeksnelheid staat nu ingesteld op een vlot tempo voor snelle hulp.';
    }

    speakDutch(
      previewText,
      () => setIsPlayingTest(true),
      () => setIsPlayingTest(false),
      () => setIsPlayingTest(false)
    );
  };

  const handleSliderChange = (newVal: number) => {
    setSpeechMultiplier(newVal);
    saveSpeechRateMultiplier(newVal);

    // Map to closest preset name
    let matchedRate: SpeechSpeed = 'normal';
    if (newVal <= 0.75) matchedRate = 'veryslow';
    else if (newVal <= 0.92) matchedRate = 'slow';
    else if (newVal <= 1.10) matchedRate = 'normal';
    else matchedRate = 'fast';

    setSpeechRate(matchedRate);
    saveSpeechRate(matchedRate);
  };

  const handleTestSpeech = () => {
    if (isPlayingTest) {
      stopSpeaking();
      setIsPlayingTest(false);
      return;
    }

    stopSpeaking();
    setIsPlayingTest(true);

    let speedDesc = 'normaal';
    if (speechMultiplier <= 0.75) speedDesc = 'extra rustig';
    else if (speechMultiplier <= 0.92) speedDesc = 'rustig';
    else if (speechMultiplier > 1.10) speedDesc = 'vlot';

    const testText = `Dit is een voorbeeld van de automatische stappenbegeleiding op een ${speedDesc} tempo. Stap 1: Kijk rustig naar uw beeldscherm. Ziet u het programma voor u?`;

    speakDutch(
      testText,
      () => setIsPlayingTest(true),
      () => setIsPlayingTest(false),
      () => setIsPlayingTest(false),
      false,
      true
    );
  };

  const handleToggleAutoTTS = () => {
    const nextVal = !autoTTS;
    onAutoTTSChange(nextVal);
    stopSpeaking();

    if (nextVal) {
      speakDutch('Automatische stappenbegeleiding is nu ingeschakeld. Nieuwe stappen worden direct aan u voorgelezen.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    saveDeviceProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-28">
      
      {/* Title */}
      <div className="bg-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between border-4 border-purple-700">
        <div>
          <span className="text-purple-300 font-bold text-sm uppercase tracking-wider block mb-1">
            Profiel & Toegankelijkheid
          </span>
          <h2 className="text-3xl sm:text-4xl font-black">
            Mijn Computer & Instellingen
          </h2>
          <p className="text-purple-100 text-base sm:text-lg font-medium mt-1">
            Door uw computer en printer in te stellen, kan KijkHulp nog passendere hulp geven.
          </p>
        </div>
        <div className="w-16 h-16 bg-purple-800 text-purple-200 rounded-2xl hidden sm:flex items-center justify-center font-black text-3xl border-2 border-purple-600">
          💻
        </div>
      </div>

      {/* Device Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-4 border-purple-500 p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Laptop className="w-7 h-7 text-purple-700" />
            <h3 className="text-2xl font-black text-slate-900">
              Mijn Computergegevens
            </h3>
          </div>
          {savedSuccess && (
            <span className="text-emerald-700 bg-emerald-100 font-bold text-sm px-3 py-1.5 rounded-full flex items-center gap-1">
              <Check className="w-4 h-4" /> Opgeslagen!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Windows Version */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-1.5">
              Windows Versie:
            </label>
            <select
              value={formData.windowsVersion}
              onChange={(e) => setFormData({ ...formData, windowsVersion: e.target.value as any })}
              className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 bg-white"
            >
              <option value="Windows 11">Windows 11 (Nieuwste met taakbalk in midden)</option>
              <option value="Windows 10">Windows 10 (Startknop linksonder)</option>
              <option value="Windows 8/7">Oudere Windows (7 of 8)</option>
              <option value="Weet ik niet">Weet ik niet zeker</option>
            </select>
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-1.5">
              Wat voor computer heeft u?
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
              className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 bg-white"
            >
              <option value="Laptop">Laptop (Draagbare computer die dichtklapt)</option>
              <option value="Vaste computer (Desktop)">Vaste computer (Desktop met losse kast)</option>
              <option value="All-in-one scherm">All-in-one (Computer zit in het beeldscherm)</option>
              <option value="Tablet">Tablet (Bijv. iPad of Surface)</option>
            </select>
          </div>

          {/* Computer Brand */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-1.5">
              Merk van de computer:
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 bg-white"
            >
              <option value="HP">HP (Hewlett-Packard)</option>
              <option value="Dell">Dell</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Acer">Acer</option>
              <option value="Asus">Asus</option>
              <option value="Medion">Medion</option>
              <option value="Apple">Apple (Mac / MacBook)</option>
              <option value="Anders">Ander merk / Weet niet</option>
            </select>
          </div>

          {/* Browser */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-1.5">
              Internetprogramma (Browser):
            </label>
            <select
              value={formData.browser}
              onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
              className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 bg-white"
            >
              <option value="Google Chrome">Google Chrome (Rond gekleurd icoontje)</option>
              <option value="Microsoft Edge">Microsoft Edge (Blauw/groen golfje)</option>
              <option value="Firefox">Mozilla Firefox (Oranje vosje)</option>
              <option value="Safari">Safari (Kompas)</option>
              <option value="Anders">Weet ik niet</option>
            </select>
          </div>

          {/* Printer */}
          <div className="sm:col-span-2">
            <label className="block text-base font-bold text-slate-900 mb-1.5">
              Printermerk:
            </label>
            <select
              value={formData.printerBrand}
              onChange={(e) => setFormData({ ...formData, printerBrand: e.target.value })}
              className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 bg-white"
            >
              <option value="HP">HP</option>
              <option value="Canon">Canon</option>
              <option value="Epson">Epson</option>
              <option value="Brother">Brother</option>
              <option value="Geen printer">Ik heb geen printer</option>
              <option value="Anders">Ander merk</option>
            </select>
          </div>

        </div>

        <div className="pt-4 border-t-2 border-slate-100">
          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-purple-500 flex items-center justify-center gap-2 min-h-[60px]"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>Computerprofiel opslaan</span>
          </button>
        </div>

      </form>

      {/* Accessibility Preferences */}
      <div className="bg-white rounded-3xl border-3 border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
          <Type className="w-7 h-7 text-blue-700" />
          <h3 className="text-2xl font-black text-slate-900">
            Lettergrootte & Weergave
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">
              Kies de lettergrootte van de app:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onFontSizeChange('normal')}
                className={`py-3 px-4 rounded-2xl font-bold border-2 transition-all text-base min-h-[52px] ${
                  fontSize === 'normal'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                Normaal
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange('large')}
                className={`py-3 px-4 rounded-2xl font-bold border-2 transition-all text-lg min-h-[52px] ${
                  fontSize === 'large'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                Groot (A+)
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange('extralarge')}
                className={`py-3 px-4 rounded-2xl font-extrabold border-2 transition-all text-xl min-h-[52px] ${
                  fontSize === 'extralarge'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                Extra (A++)
              </button>
            </div>
          </div>

          {/* Voice Language Selection */}
          <div className="pt-4 border-t-2 border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-6 h-6 text-blue-600" />
              <label className="block text-base font-bold text-slate-900">
                Voorleesstem & Taal van de uitleg:
              </label>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Kies welke stem en taal u wilt horen bij het voorlezen van de stappen en adviezen.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleVoiceLangChange('nl')}
                className={`p-3.5 rounded-2xl font-black border-2 transition-all text-left flex items-center justify-between min-h-[56px] ${
                  voiceLang === 'nl'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="block text-base font-extrabold">🇳🇱 Nederlands</span>
                  <span className={`text-xs block ${voiceLang === 'nl' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Standaard app-stem
                  </span>
                </div>
                {voiceLang === 'nl' && <Check className="w-5 h-5 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleVoiceLangChange('ar')}
                className={`p-3.5 rounded-2xl font-black border-2 transition-all text-left flex items-center justify-between min-h-[56px] ${
                  voiceLang === 'ar'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="block text-base font-extrabold">🇸🇦 صوت عربي</span>
                  <span className={`text-xs block ${voiceLang === 'ar' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    لغة عربية واضحة
                  </span>
                </div>
                {voiceLang === 'ar' && <Check className="w-5 h-5 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleVoiceLangChange('auto')}
                className={`p-3.5 rounded-2xl font-black border-2 transition-all text-left flex items-center justify-between min-h-[56px] ${
                  voiceLang === 'auto'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="block text-base font-extrabold">🌐 Automatisch</span>
                  <span className={`text-xs block ${voiceLang === 'auto' ? 'text-purple-100' : 'text-slate-500'}`}>
                    Volgens teksttaal
                  </span>
                </div>
                {voiceLang === 'auto' && <Check className="w-5 h-5 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Automatische Stappenbegeleiding (TTS) & Voorlezen */}
          <div className="pt-6 border-t-2 border-slate-100 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">
                    Automatische Stappenbegeleiding (TTS)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Laat KijkHulp stappen en instructies rustig hardop voorlezen.
                  </p>
                </div>
              </div>

              {/* AutoTTS Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAutoTTS}
                className={`relative inline-flex h-11 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-amber-200 ${
                  autoTTS ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={autoTTS ? 'Automatisch voorlezen uitschakelen' : 'Automatisch voorlezen inschakelen'}
              >
                <span className="sr-only">Automatisch voorlezen</span>
                <span
                  className={`inline-block h-9 w-9 transform rounded-full bg-white shadow-md transition-transform flex items-center justify-center font-bold text-xs ${
                    autoTTS ? 'translate-x-14 text-emerald-700' : 'translate-x-1 text-slate-500'
                  }`}
                >
                  {autoTTS ? 'AAN' : 'UIT'}
                </span>
                <span className={`text-xs font-bold px-2 select-none ${autoTTS ? 'text-white' : 'text-slate-700'}`}>
                  {autoTTS ? 'Aan' : 'Uit'}
                </span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex items-center justify-between gap-3">
              <div className="text-sm">
                <span className="font-bold text-slate-900 block">Status automatisch voorlezen:</span>
                <span className="text-slate-600">
                  {autoTTS 
                    ? '🔊 Elke nieuwe stap wordt direct rustig aan u voorgelezen.' 
                    : '🔇 Uitgeschakeld. U kunt nog steeds op de luidsprekerknop drukken om voor te lezen.'}
                </span>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${
                autoTTS ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {autoTTS ? 'Actief' : 'Stil'}
              </span>
            </div>

            {/* Spreeksnelheid Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-600" />
                  <label className="block text-base font-bold text-slate-900">
                    Spreeksnelheid van het voorlezen:
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleTestSpeech}
                  className={`inline-flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 min-h-[44px] ${
                    isPlayingTest
                      ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 animate-pulse'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300'
                  }`}
                  title={isPlayingTest ? 'Klik om voorlezen te stoppen' : 'Beluister hoe deze gekozen snelheid klinkt'}
                >
                  {isPlayingTest ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop voorlezen</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Test voorlezen</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Kies een tempo dat voor u comfortabel en prettig te volgen is:
              </p>

              {/* 4 Speed Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Extra rustig */}
                <button
                  type="button"
                  onClick={() => handleSpeechRatePresetChange('veryslow')}
                  className={`p-3 rounded-2xl font-black border-2 transition-all text-left flex flex-col justify-between min-h-[72px] ${
                    speechRate === 'veryslow'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-extrabold">🐢 Extra rustig</span>
                    {speechRate === 'veryslow' && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <span className={`text-xs block mt-1 ${speechRate === 'veryslow' ? 'text-amber-100' : 'text-slate-500'}`}>
                    0.70× (Heel kalm)
                  </span>
                </button>

                {/* Rustig */}
                <button
                  type="button"
                  onClick={() => handleSpeechRatePresetChange('slow')}
                  className={`p-3 rounded-2xl font-black border-2 transition-all text-left flex flex-col justify-between min-h-[72px] ${
                    speechRate === 'slow'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-extrabold">🌿 Rustig</span>
                    {speechRate === 'slow' && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <span className={`text-xs block mt-1 ${speechRate === 'slow' ? 'text-amber-100' : 'text-slate-500'}`}>
                    0.85× (Aanbevolen)
                  </span>
                </button>

                {/* Normaal */}
                <button
                  type="button"
                  onClick={() => handleSpeechRatePresetChange('normal')}
                  className={`p-3 rounded-2xl font-black border-2 transition-all text-left flex flex-col justify-between min-h-[72px] ${
                    speechRate === 'normal'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-extrabold">🚶 Normaal</span>
                    {speechRate === 'normal' && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <span className={`text-xs block mt-1 ${speechRate === 'normal' ? 'text-blue-100' : 'text-slate-500'}`}>
                    1.00× (Standaard)
                  </span>
                </button>

                {/* Snel */}
                <button
                  type="button"
                  onClick={() => handleSpeechRatePresetChange('fast')}
                  className={`p-3 rounded-2xl font-black border-2 transition-all text-left flex flex-col justify-between min-h-[72px] ${
                    speechRate === 'fast'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-extrabold">🐇 Vlot</span>
                    {speechRate === 'fast' && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <span className={`text-xs block mt-1 ${speechRate === 'fast' ? 'text-purple-100' : 'text-slate-500'}`}>
                    1.20× (Snel)
                  </span>
                </button>
              </div>

              {/* Fine-tuning Slider */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border-2 border-amber-200 space-y-2 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-700" /> Precies instellen:
                  </span>
                  <span className="font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-lg">
                    {Math.round(speechMultiplier * 100)}% ({speechMultiplier.toFixed(2)}×)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.60"
                  max="1.30"
                  step="0.05"
                  value={speechMultiplier}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-2 bg-amber-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                  <span>0.60× (Heel rustig)</span>
                  <span>1.00× (Normaal)</span>
                  <span>1.30× (Vlot)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Home Screen Installation Guide */}
      <div className="bg-amber-50 border-3 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <Smartphone className="w-7 h-7 text-amber-800" />
          <h3 className="text-2xl font-black text-amber-950">
            📲 KijkHulp op uw telefoonscherm zetten
          </h3>
        </div>
        <p className="text-slate-800 text-base leading-relaxed font-medium">
          Wilt u KijkHulp net als een gewone app openen vanaf uw telefoonscherm?
        </p>
        <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 text-slate-800 text-sm space-y-2">
          <p className="font-bold text-slate-900">Zo doet u dat:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li><strong>iPhone / iPad (Safari):</strong> Druk onderaan op het Deel-icoontje (vierkantje met pijl omhoog) en kies <em>"Zet op beginscherm"</em>.</li>
            <li><strong>Android (Chrome):</strong> Druk rechtsboven op de 3 puntjes en kies <em>"App installeren"</em> of <em>"Toevoegen aan startscherm"</em>.</li>
          </ul>
        </div>
      </div>

      {/* Privacy & Clear Data */}
      <div className="bg-slate-100 border-2 border-slate-300 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-black text-slate-900">
            Privacy & Geschiedenis
          </h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          KijkHulp slaat geen persoonlijke screenshots of gevoelige privégegevens op servers op. Alle instellingen en contactpersonen staan uitsluitend veilig in uw eigen browser.
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 hover:bg-red-100 border border-red-300 px-4 py-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Verwijder al mijn geschiedenis en opgeslagen gegevens</span>
          </button>
        ) : (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl space-y-3">
            <p className="text-red-950 font-bold text-base">
              Weet u zeker dat u al uw gegevens (contactpersoon, computerprofiel en sessies) wilt wissen?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearAllUserData();
                  onClearData();
                  setShowClearConfirm(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm"
              >
                Ja, alles wissen
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
