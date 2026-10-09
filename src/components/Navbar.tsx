import React from 'react';
import { Home, Wrench, MessageSquare, History, Users, Settings } from 'lucide-react';

export type NavTab = 'home' | 'support' | 'chat' | 'history' | 'trusted' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveSession: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveSession,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-slate-200 shadow-2xl safe-area-bottom">
      <div className="max-w-5xl mx-auto px-1 sm:px-2 py-2 grid grid-cols-6 gap-0.5 sm:gap-1">
        
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-h-[58px] ${
            activeTab === 'home'
              ? 'bg-blue-100 text-blue-900 font-extrabold border-2 border-blue-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 font-bold'
          }`}
          aria-label="Startpagina"
        >
          <Home className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'home' ? 'text-blue-900 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs mt-0.5">Start</span>
        </button>

        {/* Mijn Hulp / Stappen */}
        <button
          onClick={() => onSelectTab('support')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-h-[58px] ${
            activeTab === 'support'
              ? 'bg-amber-100 text-amber-950 font-extrabold border-2 border-amber-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 font-bold'
          }`}
          aria-label="Mijn computerhulp stappenplan"
        >
          {hasActiveSession && (
            <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-ping" />
          )}
          <Wrench className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'support' ? 'text-amber-900 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs mt-0.5">Stappen</span>
        </button>

        {/* Chatbot Assistent */}
        <button
          onClick={() => onSelectTab('chat')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-h-[58px] ${
            activeTab === 'chat'
              ? 'bg-indigo-100 text-indigo-950 font-extrabold border-2 border-indigo-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 font-bold'
          }`}
          aria-label="Praat met de KijkHulp chatbot assistent"
        >
          <MessageSquare className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'chat' ? 'text-indigo-900 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs mt-0.5">Chat</span>
        </button>

        {/* Historie (Nieuw!) */}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-h-[58px] ${
            activeTab === 'history'
              ? 'bg-amber-100 text-amber-950 font-extrabold border-2 border-amber-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 font-bold'
          }`}
          aria-label="Overzicht van eerdere ondersteuningssessies"
        >
          <History className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'history' ? 'text-amber-900 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs mt-0.5">Historie</span>
        </button>

        {/* Vertrouwd Contact */}
        <button
          onClick={() => onSelectTab('trusted')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-h-[58px] ${
            activeTab === 'trusted'
              ? 'bg-emerald-100 text-emerald-950 font-extrabold border-2 border-emerald-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 font-bold'
          }`}
          aria-label="Vertrouwd contactpersoon"
        >
          <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'trusted' ? 'text-emerald-900 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs mt-0.5">Familie</span>
        </button>

        {/* Instellingen */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-h-[58px] ${
            activeTab === 'settings'
              ? 'bg-purple-100 text-purple-950 font-extrabold border-2 border-purple-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 font-bold'
          }`}
          aria-label="Instellingen en apparaatprofiel"
        >
          <Settings className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === 'settings' ? 'text-purple-900 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] sm:text-xs mt-0.5">Mijn PC</span>
        </button>

      </div>
    </nav>
  );
};

