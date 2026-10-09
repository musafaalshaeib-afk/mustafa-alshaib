import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { createSpeechRecognizer } from '../services/speech';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitProblem: (text: string) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onSubmitProblem,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confirmedText, setConfirmedText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setConfirmedText(null);
      setErrorMessage(null);
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setConfirmedText(null);

    const recognizer = createSpeechRecognizer(
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 2) {
          setConfirmedText(text.trim());
          setIsRecording(false);
        }
      },
      (err: string) => {
        console.warn('Spraakfout:', err);
        setErrorMessage('We konden uw microfoon niet goed horen. Probeer het nog eens of typ uw probleem.');
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (!recognizer) {
      setIsSupported(false);
      setErrorMessage('Spraakherkenning wordt niet ondersteund in deze browser. U kunt hieronder typen.');
      return;
    }

    try {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }
    setIsRecording(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-blue-600 animate-in fade-in zoom-in duration-200 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-blue-950 font-black text-lg sm:text-xl">
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <span>Vertel wat er mis is</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sluiten"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Recording Animation & Instructions */}
        <div className="my-4 sm:my-6 text-center">
          {!confirmedText ? (
            <div>
              <div className="flex justify-center my-3 sm:my-6">
                <button
                  onClick={isRecording ? stopListening : startListening}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                    isRecording
                      ? 'bg-red-500 text-white ring-8 ring-red-200 animate-pulse'
                      : 'bg-blue-600 text-white ring-8 ring-blue-100 hover:bg-blue-700'
                  }`}
                  aria-label={isRecording ? 'Stop opname' : 'Start opname'}
                >
                  {isRecording ? <Mic className="w-12 h-12 sm:w-14 sm:h-14" /> : <MicOff className="w-12 h-12 sm:w-14 sm:h-14" />}
                </button>
              </div>

              <p className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5 sm:mb-2">
                {isRecording ? '🎙️ Wij luisteren... Spreek rustig.' : 'Druk op de knop om te spreken'}
              </p>
              <p className="text-sm sm:text-base text-slate-600">
                Bijvoorbeeld: <span className="italic font-medium">"Mijn printer print niet"</span> of <span className="italic font-medium">"Geen internet"</span>
              </p>

              {transcript && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                  <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">Gehoord:</p>
                  <p className="text-lg sm:text-xl font-semibold text-blue-950 italic break-words">"{transcript}"</p>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-left">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-base">Even opletten</p>
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-5 bg-amber-50 border-3 border-amber-300 rounded-3xl text-left shadow-inner">
                <p className="text-base sm:text-lg font-bold text-amber-900 mb-1.5 sm:mb-2">Bedoelt u dit?</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-amber-200 shadow-sm break-words">
                  "{confirmedText}"
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:gap-3">
                <button
                  onClick={() => onSubmitProblem(confirmedText)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg sm:text-xl py-3.5 sm:py-4 px-6 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[56px] sm:min-h-[60px]"
                >
                  <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  <span>Ja, help mij</span>
                </button>

                <button
                  onClick={startListening}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base sm:text-lg py-3 px-6 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[48px] sm:min-h-[52px]"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Opnieuw inspreken</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fallback Typing option */}
        <div className="pt-4 border-t-2 border-slate-100 text-center">
          <button
            onClick={() => {
              onClose();
              const el = document.getElementById('manual-problem-input');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-blue-700 hover:text-blue-900 font-bold text-base underline underline-offset-4"
          >
            Liever zelf typen met toetsenbord? Klik hier
          </button>
        </div>

      </div>
    </div>
  );
};
