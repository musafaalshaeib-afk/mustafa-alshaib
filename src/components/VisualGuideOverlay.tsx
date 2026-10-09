import React from 'react';
import { VisualHint } from '../types';
import { MousePointer, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, CornerDownRight, Keyboard, Power, Plug, Wifi, Volume2 } from 'lucide-react';

interface VisualGuideOverlayProps {
  hint?: VisualHint;
  windowsVersion?: string;
}

export const VisualGuideOverlay: React.FC<VisualGuideOverlayProps> = ({ hint, windowsVersion = 'Windows 11' }) => {
  if (!hint) return null;

  if (hint.targetArea === 'keyboard') {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 my-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2 text-amber-900 font-bold text-lg">
          <div className="p-2 bg-amber-200 rounded-xl">
            <Keyboard className="w-6 h-6 text-amber-800" />
          </div>
          <span>Kijk op uw toetsenbord</span>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
          <p className="text-slate-800 text-lg font-medium text-center">{hint.label}</p>
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 px-4 py-2 rounded-lg text-slate-900 font-mono font-bold text-lg shadow-sm animate-pulse">
            <span>⌨️ Toetscombinatie</span>
          </div>
        </div>
      </div>
    );
  }

  if (hint.targetArea === 'cable') {
    return (
      <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 my-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2 text-blue-900 font-bold text-lg">
          <div className="p-2 bg-blue-200 rounded-xl">
            <Plug className="w-6 h-6 text-blue-800" />
          </div>
          <span>Kabel of apparaat</span>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-xl p-3 text-center">
          <p className="text-slate-800 text-lg font-medium">{hint.label}</p>
        </div>
      </div>
    );
  }

  // Visual Computer Screen simulation
  const isWindows11 = windowsVersion.includes('11');

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 my-4 shadow-md border-2 border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-slate-300 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
          <span className="ml-2 font-sans text-xs uppercase tracking-wider text-slate-400">Computerscherm voorbeeld</span>
        </div>
        <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">{windowsVersion}</span>
      </div>

      {/* Screen Frame Mockup */}
      <div className="relative aspect-video w-full bg-gradient-to-b from-sky-900 to-indigo-950 rounded-xl border border-slate-700 overflow-hidden flex flex-col justify-between p-3 select-none">
        
        {/* Desktop Content Area */}
        <div className="flex justify-between items-start">
          {/* Top Left Area */}
          <div className={`transition-all ${hint.targetArea === 'top-left' ? 'ring-4 ring-amber-400 rounded-lg bg-amber-400/20 p-2' : ''}`}>
            <div className="space-y-2">
              <div className="w-10 h-8 bg-white/20 rounded border border-white/30 flex items-center justify-center text-[10px]">📁 Bestanden</div>
              <div className="w-10 h-8 bg-white/20 rounded border border-white/30 flex items-center justify-center text-[10px]">🌐 Internet</div>
            </div>
          </div>

          {/* Center Area */}
          {hint.targetArea === 'center' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl border-4 border-white flex items-center gap-2 animate-bounce max-w-[85%] text-center">
                <MousePointer className="w-6 h-6 text-slate-900" />
                <span className="text-base">{hint.label}</span>
              </div>
            </div>
          )}

          {/* Top Right Area */}
          <div className={`transition-all ${hint.targetArea === 'top-right' ? 'ring-4 ring-amber-400 rounded-lg bg-amber-400/30 p-2 animate-pulse' : ''}`}>
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-600">
              <div className="w-3 h-3 text-slate-300 font-bold text-xs flex items-center justify-center">_</div>
              <div className="w-3 h-3 text-slate-300 font-bold text-xs flex items-center justify-center">□</div>
              <div className="w-4 h-4 bg-red-600 rounded text-white font-bold text-xs flex items-center justify-center">✕</div>
            </div>
            {hint.targetArea === 'top-right' && (
              <div className="mt-1 text-right">
                <span className="inline-block bg-amber-400 text-slate-900 font-bold text-xs px-2 py-0.5 rounded shadow">
                  {hint.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Taskbar Bottom */}
        <div className="mt-auto bg-slate-950/90 backdrop-blur border border-slate-700/80 rounded-lg p-1.5 flex items-center justify-between text-xs">
          
          {/* Start Button area */}
          <div className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${
            hint.targetArea === 'bottom-left' 
              ? 'ring-4 ring-amber-400 bg-amber-400 text-slate-950 font-bold scale-105 animate-pulse' 
              : 'bg-slate-800 text-slate-200'
          }`}>
            <div className="w-4 h-4 flex items-center justify-center font-bold">🪟</div>
            <span className="hidden sm:inline text-xs font-semibold">Start</span>
          </div>

          {/* Center taskbar icons (Windows 11 style) */}
          {isWindows11 && hint.targetArea !== 'bottom-left' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
              <div className="w-4 h-4 bg-sky-400 rounded-sm"></div>
            </div>
          )}

          {/* System Tray area (Bottom Right) */}
          <div className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${
            hint.targetArea === 'bottom-right'
              ? 'ring-4 ring-amber-400 bg-amber-400 text-slate-950 font-bold scale-105 animate-pulse'
              : 'bg-slate-800 text-slate-300'
          }`}>
            <Wifi className="w-3.5 h-3.5" />
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">14:30</span>
          </div>
        </div>

        {/* Pointer Arrow Indicator */}
        {hint.targetArea === 'bottom-right' && (
          <div className="absolute bottom-8 right-6 flex flex-col items-center animate-bounce pointer-events-none">
            <span className="bg-amber-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg border border-white">
              👉 {hint.label}
            </span>
            <ArrowDown className="w-6 h-6 text-amber-300 stroke-[3]" />
          </div>
        )}

        {hint.targetArea === 'bottom-left' && (
          <div className="absolute bottom-8 left-6 flex flex-col items-center animate-bounce pointer-events-none">
            <span className="bg-amber-400 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg border border-white">
              👉 {hint.label}
            </span>
            <ArrowDown className="w-6 h-6 text-amber-300 stroke-[3]" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl">
        <span className="font-semibold text-amber-400">💡 Aanwijzing op uw scherm:</span>
        <span className="text-white font-medium">{hint.label}</span>
      </div>
    </div>
  );
};
