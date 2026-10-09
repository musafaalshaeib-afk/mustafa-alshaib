import React from 'react';
import { Volume2, VolumeX, Type, Phone, ShieldAlert, HeartHandshake } from 'lucide-react';
import { TrustedContact } from '../types';
import { stopSpeaking } from '../services/speech';
import { BatteryIndicator } from './BatteryIndicator';

interface HeaderProps {
  fontSize: 'normal' | 'large' | 'extralarge';
  onFontSizeChange: (size: 'normal' | 'large' | 'extralarge') => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  trustedContact: TrustedContact | null;
  onOpenTrustedContact: () => void;
  onEmergencySafety: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fontSize,
  onFontSizeChange,
  isVoiceEnabled,
  onToggleVoice,
  trustedContact,
  onOpenTrustedContact,
  onEmergencySafety,
}) => {
  const nextFontSize = () => {
    if (fontSize === 'normal') onFontSizeChange('large');
    else if (fontSize === 'large') onFontSizeChange('extralarge');
    else onFontSizeChange('normal');
  };

  const fontSizeLabel = fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++';

  return (
    <header className="sticky top-0 z-40 bg-blue-900 text-white shadow-md border-b-4 border-blue-700">
      <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2">
        
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => window.location.href = '/'}>
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white text-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner border-2 border-amber-400">
            👁️
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1 sm:gap-1.5 text-white">
              KijkHulp
              <span className="text-[10px] sm:text-xs bg-amber-400 text-blue-950 font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                NL
              </span>
            </h1>
            <p className="text-xs text-blue-200 font-medium hidden sm:block">
              Rustige en eenvoudige computerhulp
            </p>
          </div>
        </div>

        {/* Quick controls for accessibility */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          {/* Battery status indicator */}
          <BatteryIndicator />

          {/* 🔇 Voice Off / 🔊 Voice On button */}
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1 sm:gap-1.5 font-black px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 shadow-sm active:scale-95 transition-all text-xs sm:text-sm min-h-[40px] sm:min-h-[44px] ${
              isVoiceEnabled
                ? 'bg-amber-400 hover:bg-amber-300 text-blue-950 border-amber-300 ring-2 ring-amber-200'
                : 'bg-blue-950/90 hover:bg-blue-800 text-slate-200 border-blue-600'
            }`}
            title={isVoiceEnabled ? 'Voice is ON. Click to turn Voice OFF.' : 'Voice is OFF. Click to turn Voice ON.'}
            aria-label={isVoiceEnabled ? 'Voice On' : 'Voice Off'}
          >
            <span className="text-sm sm:text-base select-none leading-none">
              {isVoiceEnabled ? '🔊' : '🔇'}
            </span>
            <span className="whitespace-nowrap font-extrabold hidden xs:inline">
              {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
            </span>
          </button>

          {/* Text size button */}
          <button
            onClick={nextFontSize}
            className="flex items-center justify-center gap-1 bg-blue-950/80 hover:bg-blue-800 text-white font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-blue-600 active:scale-95 transition-all text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
            title="Vergroot of verklein de letters"
            aria-label="Lettergrootte aanpassen"
          >
            <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span className="font-extrabold text-amber-300">{fontSizeLabel}</span>
          </button>

          {/* Is dit veilig? Quick shortcut */}
          <button
            onClick={onEmergencySafety}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-red-400 shadow-sm active:scale-95 transition-all text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
            title="Twijfelt u over een pop-up of e-mail?"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden md:inline">Veiligheid</span>
          </button>

          {/* Trusted contact quick button */}
          {trustedContact && trustedContact.phoneNumber ? (
            <a
              href={`tel:${trustedContact.phoneNumber}`}
              className="flex items-center gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-emerald-400 shadow-sm active:scale-95 transition-all text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
              title={`Bel ${trustedContact.name}`}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Bel {trustedContact.name.split(' ')[0]}</span>
            </a>
          ) : (
            <button
              onClick={onOpenTrustedContact}
              className="flex items-center gap-1 sm:gap-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-blue-600 active:scale-95 transition-all text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
              title="Familielid instellen voor hulp"
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Familiehulp</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
