import React, { useState } from 'react';
import { SupportSession } from '../types';
import { speakDutch, stopSpeaking } from '../services/speech';
import { PrintExportModal } from './PrintExportModal';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowRight, 
  Trash2, 
  Search, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Wrench,
  HelpCircle,
  Calendar,
  Sparkles,
  Layers,
  Printer
} from 'lucide-react';

interface HistoryScreenProps {
  history: SupportSession[];
  onReopenSession: (session: SupportSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllHistory: () => void;
  onRestoreSampleHistory: () => void;
  fontSize: 'normal' | 'large' | 'extralarge';
  onNavigateHome: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onReopenSession,
  onDeleteSession,
  onClearAllHistory,
  onRestoreSampleHistory,
  fontSize,
  onNavigateHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'in_progress' | 'needs_family'>('all');
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});
  const [speakingSessionId, setSpeakingSessionId] = useState<string | null>(null);
  const [printingSession, setPrintingSession] = useState<SupportSession | null>(null);

  const textSizeClass =
    fontSize === 'extralarge'
      ? 'text-xl sm:text-2xl'
      : fontSize === 'large'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const headingSizeClass =
    fontSize === 'extralarge'
      ? 'text-2xl sm:text-3xl'
      : fontSize === 'large'
      ? 'text-xl sm:text-2xl'
      : 'text-lg sm:text-xl';

  const toggleExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleReadSteps = (session: SupportSession) => {
    if (speakingSessionId === session.id) {
      stopSpeaking();
      setSpeakingSessionId(null);
      return;
    }

    stopSpeaking();
    setSpeakingSessionId(session.id);

    const problemName = session.detectedProblem || session.originalProblem;
    const stepsText = session.steps
      .map((s, idx) => `Stap ${s.stepNumber || idx + 1}: ${s.title}. ${s.instruction}`)
      .join('. ');

    const fullText = `Overzicht van opgelost probleem: ${problemName}. ${stepsText}`;

    speakDutch(
      fullText,
      () => setSpeakingSessionId(session.id),
      () => setSpeakingSessionId(null),
      () => setSpeakingSessionId(null)
    );
  };

  // Filter & Search logic
  const filteredHistory = history.filter((session) => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'solved' && session.status !== 'solved') return false;
      if (statusFilter === 'in_progress' && session.status !== 'in_progress') return false;
      if (statusFilter === 'needs_family' && session.status !== 'needs_family') return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const detected = (session.detectedProblem || '').toLowerCase();
      const original = (session.originalProblem || '').toLowerCase();
      const program = (session.programName || '').toLowerCase();
      const stepsMatch = session.steps.some(
        (s) => (s.title || '').toLowerCase().includes(q) || (s.instruction || '').toLowerCase().includes(q)
      );
      return detected.includes(q) || original.includes(q) || program.includes(q) || stepsMatch;
    }

    return true;
  });

  const solvedCount = history.filter((s) => s.status === 'solved').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-500 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400 text-amber-950 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-sm">
              <History className="w-4 h-4" />
              <span>Ondersteuningshistorie / سجل المساعدة</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Eerdere Problemen & Oplossingen
            </h1>
            <p className="text-amber-100 text-sm sm:text-base font-medium max-w-xl">
              Kijk rustig terug hoe eerdere computerproblemen stap voor stap zijn opgelost, of heropen een stappenplan direct.
            </p>
          </div>

          <div className="bg-amber-950/50 backdrop-blur-sm p-4 rounded-2xl border-2 border-amber-400/50 text-center shrink-0">
            <span className="text-xs uppercase font-bold text-amber-200 block">Opgeloste problemen</span>
            <div className="text-3xl font-black text-amber-300 mt-0.5">
              {solvedCount} <span className="text-lg font-bold text-white">/ {history.length}</span>
            </div>
            <span className="text-[11px] text-amber-200">Succesvol afgerond</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-3 border-slate-300 shadow-md space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek in eerdere oplossingen (bijv. Wi-Fi, printer, scherm)..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 rounded-2xl outline-none font-medium text-slate-800 text-base transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-lg"
            >
              Wissen
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs sm:text-sm font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap border-2 min-h-[44px] ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            Alle ({history.length})
          </button>
          <button
            onClick={() => setStatusFilter('solved')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap border-2 min-h-[44px] ${
              statusFilter === 'solved'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            ✅ Opgelost ({solvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap border-2 min-h-[44px] ${
              statusFilter === 'in_progress'
                ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
            }`}
          >
            ⏳ Bezig ({history.filter((s) => s.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('needs_family')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap border-2 min-h-[44px] ${
              statusFilter === 'needs_family'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
            }`}
          >
            👨‍👩‍👦 Familie ({history.filter((s) => s.status === 'needs_family').length})
          </button>
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-3 border-slate-300 shadow-md text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {searchQuery ? 'Geen eerdere sessies gevonden met deze zoekterm' : 'Nog geen sessies in uw historie'}
            </h3>
            <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
              {searchQuery
                ? 'Probeer een ander zoekwoord zoals "internet", "geluid" of "scherm".'
                : 'Zodra u een computerprobleem oplost via KijkHulp, wordt het stappenplan hier bewaard.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateHome}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-md border-2 border-amber-400 min-h-[48px]"
            >
              Start een nieuw probleem
            </button>
            <button
              onClick={onRestoreSampleHistory}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-3 rounded-2xl border-2 border-slate-300 min-h-[48px] flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>Voorbeelden herstellen</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((session) => {
            const isExpanded = !!expandedSessionIds[session.id];
            const isSpeakingThis = speakingSessionId === session.id;
            const isSolved = session.status === 'solved';
            const formattedDate = new Date(session.timestamp).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className="bg-white rounded-3xl border-3 border-slate-300 shadow-md hover:border-amber-400 transition-all overflow-hidden"
              >
                {/* Card Top Banner / Summary */}
                <div className="p-5 sm:p-6 space-y-3">
                  
                  {/* Status, Date & Program Tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isSolved ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs sm:text-sm px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Opgelost</span>
                        </span>
                      ) : session.status === 'needs_family' ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 border border-blue-300 font-black text-xs sm:text-sm px-3 py-1 rounded-full">
                          <Users className="w-4 h-4 text-blue-700" />
                          <span>Familie gevraagd</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 font-black text-xs sm:text-sm px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>In behandeling</span>
                        </span>
                      )}

                      {session.programName && (
                        <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200">
                          {session.programName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Problem Title */}
                  <div className="space-y-1">
                    <h3 className={`${headingSizeClass} font-black text-slate-900 leading-snug`}>
                      {session.detectedProblem || session.originalProblem}
                    </h3>
                    {session.originalProblem && session.originalProblem !== session.detectedProblem && (
                      <p className="text-xs sm:text-sm text-slate-500 italic">
                        Oorspronkelijke vraag: &ldquo;{session.originalProblem}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Steps summary bar */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>Aantal doorlopen stappen: {session.steps.length}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPrintingSession(session)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border bg-white hover:bg-blue-50 text-blue-900 border-slate-300 font-bold transition-all"
                        title="Stappenplan afdrukken"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-700" />
                        <span>Afdrukken</span>
                      </button>

                      <button
                        onClick={() => handleReadSteps(session)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSpeakingThis
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold animate-pulse'
                            : 'bg-white hover:bg-slate-100 text-amber-900 border-slate-300 font-bold'
                        }`}
                        title="Lees de stappen voor"
                      >
                        {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isSpeakingThis ? 'Stop audio' : 'Voorlezen'}</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(session.id)}
                        className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-bold px-2 py-1"
                      >
                        <span>{isExpanded ? 'Verberg stappen' : 'Toon stappen'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Detailed Steps Accordion */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        Doorlopen stappenplan:
                      </h4>
                      <div className="space-y-2.5">
                        {session.steps.map((st, index) => (
                          <div
                            key={index}
                            className="p-3.5 bg-amber-50/50 rounded-2xl border-2 border-amber-200/80 space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {st.stepNumber || index + 1}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                                {st.title}
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium text-xs sm:text-sm pl-8">
                              {st.instruction}
                            </p>
                            {st.detailedTip && (
                              <p className="text-xs text-amber-900 bg-amber-100/70 p-2 rounded-xl mt-1.5 pl-3 border border-amber-300/50">
                                💡 Tip: {st.detailedTip}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <button
                      onClick={() => onReopenSession(session)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base px-4 py-2.5 rounded-xl border border-amber-500 flex items-center gap-2 shadow-sm min-h-[44px] transition-all"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Opnieuw bekijken in Stappen</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPrintingSession(session)}
                        className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm min-h-[44px] transition-all"
                        title="Stappenplan afdrukken of opslaan"
                      >
                        <Printer className="w-4 h-4 text-blue-700" />
                        <span>Afdrukken / Exporteren</span>
                      </button>

                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"
                        title="Verwijder deze sessie uit historie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Option at Bottom */}
      {history.length > 0 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500 px-2">
          <span>Totaal {history.length} sessies bewaard in lokaal geheugen</span>
          <button
            onClick={() => {
              if (window.confirm('Weet u zeker dat u de hele historie wilt wissen?')) {
                onClearAllHistory();
              }
            }}
            className="text-red-600 hover:text-red-800 font-bold hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wis hele historie</span>
          </button>
        </div>
      )}

      {/* Printervriendelijk Stappenplan Modal */}
      {printingSession && (
        <PrintExportModal
          isOpen={true}
          onClose={() => setPrintingSession(null)}
          session={printingSession}
        />
      )}

    </div>
  );
};
