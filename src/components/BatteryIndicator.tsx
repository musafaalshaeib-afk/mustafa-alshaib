import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  BatteryLow, 
  BatteryMedium, 
  BatteryWarning, 
  Zap, 
  Plug, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Info
} from 'lucide-react';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: 'chargingchange' | 'levelchange', listener: (this: BatteryManager, ev: Event) => any): void;
  removeEventListener(type: 'chargingchange' | 'levelchange', listener: (this: BatteryManager, ev: Event) => any): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export const BatteryIndicator: React.FC = () => {
  const [level, setLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [dismissedWarning, setDismissedWarning] = useState<boolean>(false);

  useEffect(() => {
    let batteryInstance: BatteryManager | null = null;

    const updateBatteryInfo = (battery: BatteryManager) => {
      const percentage = Math.round(battery.level * 100);
      setLevel(percentage);
      setIsCharging(battery.charging);
    };

    const handleLevelChange = () => {
      if (batteryInstance) updateBatteryInfo(batteryInstance);
    };

    const handleChargingChange = () => {
      if (batteryInstance) updateBatteryInfo(batteryInstance);
    };

    if (
      typeof navigator !== 'undefined' && 
      'getBattery' in navigator && 
      typeof (navigator as NavigatorWithBattery).getBattery === 'function'
    ) {
      (navigator as NavigatorWithBattery).getBattery!()
        .then((battery) => {
          batteryInstance = battery;
          setIsSupported(true);
          updateBatteryInfo(battery);
          battery.addEventListener('levelchange', handleLevelChange);
          battery.addEventListener('chargingchange', handleChargingChange);
        })
        .catch((err) => {
          console.warn('Battery API not available or blocked:', err);
          setIsSupported(false);
        });
    } else {
      setIsSupported(false);
    }

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', handleLevelChange);
        batteryInstance.removeEventListener('chargingchange', handleChargingChange);
      }
    };
  }, []);

  const isLow = level !== null && level <= 20 && !isCharging;
  const isMedium = level !== null && level > 20 && level <= 50;

  // Render icon based on battery state
  const renderIcon = () => {
    if (isSupported === false) {
      return <Plug className="w-4 h-4 text-emerald-300" />;
    }
    if (isCharging) {
      return <BatteryCharging className="w-4 h-4 text-amber-300 animate-pulse" />;
    }
    if (level === null) {
      return <Battery className="w-4 h-4 text-blue-200" />;
    }
    if (level <= 20) {
      return <BatteryWarning className="w-4 h-4 text-red-200 animate-bounce" />;
    }
    if (level <= 50) {
      return <BatteryMedium className="w-4 h-4 text-amber-300" />;
    }
    return <Battery className="w-4 h-4 text-emerald-300" />;
  };

  // Button text & styling
  const getButtonContent = () => {
    if (isSupported === false) {
      return (
        <>
          {renderIcon()}
          <span className="hidden sm:inline font-bold">Lader</span>
        </>
      );
    }

    if (level === null) {
      return (
        <>
          {renderIcon()}
          <span className="font-bold">Accu</span>
        </>
      );
    }

    if (isCharging) {
      return (
        <>
          {renderIcon()}
          <span className="font-extrabold text-amber-300">{level}%</span>
          <span className="hidden md:inline text-xs font-semibold text-emerald-200">(Laden)</span>
        </>
      );
    }

    if (isLow) {
      return (
        <>
          {renderIcon()}
          <span className="font-extrabold text-white">{level}%</span>
          <span className="hidden sm:inline font-black text-xs uppercase tracking-wider bg-red-800 text-white px-1.5 py-0.5 rounded">
            Lader!
          </span>
        </>
      );
    }

    return (
      <>
        {renderIcon()}
        <span className="font-extrabold">{level}%</span>
      </>
    );
  };

  const getButtonClass = () => {
    if (isLow) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-300 ring-2 ring-red-400 shadow-md animate-pulse';
    }
    if (isCharging) {
      return 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-100 border-emerald-500';
    }
    if (isMedium) {
      return 'bg-amber-950/80 hover:bg-amber-900 text-amber-100 border-amber-600';
    }
    return 'bg-blue-950/80 hover:bg-blue-800 text-white border-blue-600';
  };

  return (
    <>
      {/* Battery Quick Button in Header */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border-2 active:scale-95 transition-all text-xs sm:text-sm min-h-[44px] ${getButtonClass()}`}
        title={
          isSupported === false
            ? 'Stroomvoorziening & Oplaadstatus bekijken'
            : isCharging
            ? `Batterij: ${level}% - Wordt nu opgeladen`
            : isLow
            ? `Waarschuwing: Batterij is bijna leeg (${level}%)! Sluit uw oplader aan.`
            : `Batterij: ${level}%`
        }
        aria-label="Batterij status controleren"
      >
        {getButtonContent()}
      </button>

      {/* Prominent Low Battery Warning Banner for Seniors */}
      {isLow && !dismissedWarning && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2.5 shadow-xl border-b-4 border-red-800 animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300 animate-bounce" />
              <span>
                <strong>Let op:</strong> Uw batterij is nog maar <strong>{level}%</strong>. 
                Steek de oplader in het stopcontact zodat uw computer niet uitvalt tijdens de hulpsessie!
              </span>
            </div>
            <button
              onClick={() => setDismissedWarning(true)}
              className="p-1 hover:bg-red-700 rounded-lg text-white font-black text-sm shrink-0 flex items-center gap-1 border border-red-400"
              title="Waarschuwing sluiten"
              aria-label="Sluit batterijwaarschuwing"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Begrepen</span>
            </button>
          </div>
        </div>
      )}

      {/* Senior-friendly Battery Status Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-md p-5 sm:p-7 shadow-2xl border-4 border-blue-600 space-y-5 sm:space-y-6 text-slate-900 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="battery-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3 sm:pb-4 border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black ${
                  isLow ? 'bg-red-100 text-red-600 border-2 border-red-300' :
                  isCharging ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' :
                  'bg-blue-100 text-blue-700 border-2 border-blue-300'
                }`}>
                  {isCharging ? '⚡' : isLow ? '⚠️' : '🔋'}
                </div>
                <div>
                  <h3 id="battery-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    Batterij & Stroom
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Voor een rustige en veilige hulpsessie
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95 transition-all"
                aria-label="Sluit venster"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Battery Status Gauges */}
            {isSupported !== false && level !== null ? (
              <div className="space-y-4">
                {/* Visual Level Progress Bar */}
                <div className="bg-slate-100 p-4 rounded-2xl border-2 border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Batterijlading:</span>
                    <span className={`text-2xl font-black ${
                      isLow ? 'text-red-600' : isCharging ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {level}%
                    </span>
                  </div>
                  
                  {/* Progress track */}
                  <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden border border-slate-300 p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-red-500' :
                        isCharging ? 'bg-emerald-500' :
                        level <= 50 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, level))}%` }}
                    />
                  </div>
                </div>

                {/* Charging Status Badge */}
                <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                  isCharging 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : isLow
                    ? 'bg-red-50 border-red-300 text-red-950'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}>
                  {isCharging ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : isLow ? (
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                  ) : (
                    <Plug className="w-6 h-6 text-blue-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-black text-base">
                      {isCharging
                        ? 'Oplader is aangesloten (Laadt op)'
                        : isLow
                        ? 'Batterij is laag (Niet aan de oplader)'
                        : 'Werkt op batterij (Niet aan de lader)'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium">
                      {isCharging
                        ? 'Uitstekend! Uw apparaat blijft aanstaan tijdens de hulpsessie.'
                        : isLow
                        ? 'Sluit nu uw oplader aan zodat uw scherm niet plotseling uitvalt.'
                        : 'Als u een lange sessie verwacht, is het handig om de lader aan te sluiten.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback when Battery API is not supported by current browser or is a desktop PC */
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-black text-lg">
                    <Plug className="w-5 h-5 text-blue-700" />
                    <span>Stroomvoorziening</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Gebruikt u een <strong>vaste desktop computer</strong>? Dan zit de stekker al in het stopcontact en hoeft u niets te doen.
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Gebruikt u een <strong>laptop of tablet</strong>? Zorg ervoor dat de oplader in het stopcontact zit tijdens het oplossen van problemen.
                  </p>
                </div>
              </div>
            )}

            {/* Practical Advice for Senior Users */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Waarom is dit belangrijk?</span>
              </div>
              <p className="leading-relaxed">
                Tijdens het bekijken van handleidingen, foto&apos;s maken of bellen met familiehulp blijft het scherm continu aan. Met een aangesloten oplader voorkomt u dat uw computer tussentijds uitvalt.
              </p>
            </div>

            {/* Easy action button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black text-lg py-3.5 px-6 rounded-2xl shadow-md border-2 border-blue-700 active:scale-98 transition-all min-h-[50px]"
            >
              Begrepen, venster sluiten
            </button>
          </div>
        </div>
      )}
    </>
  );
};
