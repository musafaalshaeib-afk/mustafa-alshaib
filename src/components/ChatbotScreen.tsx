import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatRoleMode, DeviceProfile } from '../types';
import { sendChatMessage, isExplicitCreatorQuestion } from '../services/api';
import { speakDutch, stopSpeaking, isSpeaking } from '../services/speech';
import { createSpeechRecognizer } from '../services/speech';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  User, 
  ChevronRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Type
} from 'lucide-react';

interface ChatbotScreenProps {
  deviceProfile: DeviceProfile;
  fontSize: 'normal' | 'large' | 'extralarge';
  onFontSizeChange?: (size: 'normal' | 'large' | 'extralarge') => void;
  onStartSupportFlow?: (problemText: string) => void;
}

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({
  deviceProfile,
  fontSize,
  onFontSizeChange,
  onStartSupportFlow,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content:
        'Dag! Ik ben uw KijkHulp assistent. / أهلاً بك! أنا مساعدك الذكي.\n\nStel gerust elke computer- of smartphonevraag in uw eigen taal (Nederlands, العربية, English, Türkçe, Deutsch, Español...). Ik help u rustig en stap voor stap!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roleMode, setRoleMode] = useState<ChatRoleMode>('patient_coach');
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text && !selectedImage) return;

    stopSpeaking();
    setPlayingMessageId(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || 'Kijk alstublieft naar deze afbeelding van mijn scherm.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageBase64: selectedImage || undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Send only actual conversation turns (exclude system error bubbles or welcome messages)
      const historyPayload = newMessages
        .filter((m) => !m.id.startsWith('err-') && m.id !== 'welcome-1')
        .map((m) => ({
          role: m.role,
          content: m.content,
          imageBase64: m.imageBase64,
        }));

      const res = await sendChatMessage(historyPayload, deviceProfile, roleMode);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const isArabic = /[\u0600-\u06FF]/.test(text);
      const lower = text.toLowerCase();
      let friendlyError =
        'Ik ben er om u te helpen! Kunt u uw vraag nog eens rustig stellen? Dan kijken we er samen naar.';

      if (isExplicitCreatorQuestion(text)) {
        if (isArabic) {
          friendlyError =
            'تم تصميم وتطوير وبرمجة هذا التطبيق بواسطة مصطفى الشايب (Mustafa Al-Shaeib). 🌟 وقد قام بتصميمه ليكون مساعداً هادئاً وصبوراً وذكياً لمساعدتكم في كل ما يخص مشاكل الكمبيوتر والهاتف خطوة بخطوة.';
        } else if (/\b(who|designed|created|developer|built|made)\b/i.test(text)) {
          friendlyError =
            'This application was designed, developed, and built by Mustafa Al-Shaeib (مصطفى الشايب). 🌟 It was created to provide calm, patient, and step-by-step assistance with computer and smartphone questions.';
        } else {
          friendlyError =
            'Deze applicatie is ontworpen, ontwikkeld en gebouwd door Mustafa Al-Shaeib (مصطفى الشايب). 🌟 Hij heeft KijkHulp ontworpen om u rustig, geduldig en stap voor stap te helpen met al uw computer- en smartphonevragen.';
        }
      } else if (isArabic) {
        friendlyError = 'أنا هنا لمساعدتك دائماً! صف لي المشكلة أو السؤال الذي تريده وسأساعدك خطوة بخطوة.';
      }

      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: friendlyError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript: string, isFinal: boolean) => {
        setInputText(transcript);
        if (isFinal) {
          setIsRecording(false);
        }
      },
      () => {
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    }
  };

  const handleReadMessage = (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      stopSpeaking();
      setPlayingMessageId(null);
      return;
    }

    stopSpeaking();
    setPlayingMessageId(msg.id);
    speakDutch(
      msg.content,
      () => setPlayingMessageId(msg.id),
      () => setPlayingMessageId(null),
      () => setPlayingMessageId(null)
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearHistory = () => {
    stopSpeaking();
    setPlayingMessageId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: 'Gesprek gewist! Waar kan ik u nu rustig mee helpen?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickQuestions = [
    'Hoe maak ik letters groter? / كيف أكبر الخط؟',
    'Mijn internet werkt niet / الإنترنت لا يعمل',
    'Printer is offline / الطابعة لا تطبع',
    'Wie heeft jou gemaakt? / مين عملك؟',
  ];

  const textSizeClass =
    fontSize === 'extralarge'
      ? 'text-xl sm:text-2xl'
      : fontSize === 'large'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const inputIsRtl = /[\u0600-\u06FF]/.test(inputText);

  const fontSizeLabel = fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++';

  const handleNextFontSize = () => {
    if (!onFontSizeChange) return;
    if (fontSize === 'normal') onFontSizeChange('large');
    else if (fontSize === 'large') onFontSizeChange('extralarge');
    else onFontSizeChange('normal');
  };

  return (
    <div
      className={
        isExpanded
          ? 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 flex flex-col justify-center items-center'
          : 'w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 flex flex-col h-full flex-1 min-h-0'
      }
    >
      <div
        className={
          isExpanded
            ? 'w-full max-w-6xl h-full bg-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-blue-600 p-2 sm:p-4 space-y-2 sm:space-y-3'
            : 'w-full h-full flex flex-col flex-1 min-h-0 space-y-2 sm:space-y-3'
        }
      >
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border-3 border-blue-500 shadow-sm flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm shrink-0">
              🤖
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-blue-950 truncate">
                  KijkHulp Gesprek / الشات الذكي
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                  Online
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full border border-blue-300 shrink-0 hidden md:inline-flex">
                  🌐 Alle talen / كل اللغات
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                مساعدتك التقنية الفورية باللغة التي تختارها
              </p>
            </div>
          </div>

          {/* Action buttons (Expand, Text Size, Role, Clear) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Assistant Role selector (Desktop) */}
            <div className="hidden lg:flex bg-slate-100 p-0.5 rounded-xl border border-slate-300 text-xs font-bold">
              <button
                onClick={() => setRoleMode('patient_coach')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  roleMode === 'patient_coach' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Geduldige begeleider"
              >
                🛋️ Geduldig
              </button>
              <button
                onClick={() => setRoleMode('quick_tip')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  roleMode === 'quick_tip' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Korte directe antwoorden"
              >
                ⚡ Snel
              </button>
              <button
                onClick={() => setRoleMode('expert_detective')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  roleMode === 'expert_detective' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Speurder die doorvraagt"
              >
                🕵️ Speurder
              </button>
            </div>

            {/* Font Size button */}
            {onFontSizeChange && (
              <button
                onClick={handleNextFontSize}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center gap-1 text-xs min-h-[42px] transition-all"
                title="Vergroot tekstgrootte / تكبير الخط"
              >
                <Type className="w-3.5 h-3.5 text-blue-700" />
                <span>{fontSizeLabel}</span>
              </button>
            )}

            {/* Maximize / Expand button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl border-2 border-blue-400 flex items-center gap-1.5 text-xs min-h-[42px] transition-all"
              title={isExpanded ? 'Verklein venster / تصغير الشات' : 'Vergroot venster / تكبير الشات ملء الشاشة'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4 text-blue-700" />
                  <span className="hidden sm:inline">تصغير</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-blue-700" />
                  <span className="font-extrabold text-blue-900">تكبير الشات</span>
                </>
              )}
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              className="p-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 flex items-center gap-1 text-xs min-h-[42px]"
              title="Wis gesprek en begin opnieuw / مسح المحادثة"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">جديد</span>
            </button>
          </div>
        </div>

        {/* Messages Thread (min-h-0 is essential for proper flex scrolling) */}
        <div className="flex-1 min-h-0 bg-white rounded-3xl border-3 border-slate-300 p-3 sm:p-5 shadow-inner overflow-y-auto space-y-3 sm:space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isRtl = /[\u0600-\u06FF]/.test(msg.content);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1 font-bold">
                    🤖
                  </div>
                )}

                <div
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-2 ${
                    isRtl ? 'text-right' : 'text-left'
                  } ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm border-2 border-blue-700'
                      : 'bg-slate-100 text-slate-900 rounded-tl-sm border-2 border-slate-200'
                  }`}
                >
                  {/* Image attachment if any */}
                  {msg.imageBase64 && (
                    <div className="rounded-xl overflow-hidden border-2 border-white/50 max-h-48 max-w-xs mb-2">
                      <img src={msg.imageBase64} alt="Screenshot bijlage" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className={`${textSizeClass} font-medium leading-relaxed whitespace-pre-line`}>
                    {msg.content}
                  </p>

                  {/* Footer bar with Timestamp and Listen aloud button */}
                  <div
                    className={`flex items-center justify-between text-xs pt-2 border-t ${
                      isUser ? 'border-blue-500/50 text-blue-200' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    <button
                      onClick={() => handleReadMessage(msg)}
                      className={`flex items-center gap-1 font-bold px-2 py-1 rounded-lg transition-all ${
                        playingMessageId === msg.id
                          ? 'bg-amber-400 text-slate-950 animate-pulse font-extrabold'
                          : isUser
                          ? 'hover:bg-blue-700 text-blue-100'
                          : 'hover:bg-slate-200 text-blue-700'
                      }`}
                      title="Lees dit bericht rustig voor / قراءة صوتية"
                    >
                      {playingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Voorlezen / قراءة</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-1 font-bold">
                    👤
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
                🤖
              </div>
              <div className="bg-slate-100 border-2 border-slate-200 rounded-3xl p-3.5 sm:p-4 flex items-center gap-2">
                <span className="animate-spin text-xl">⏳</span>
                <span className="text-slate-700 font-bold text-sm sm:text-base">
                  KijkHulp denkt na / جاري التفكير في أفضل إجابة...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions chips */}
        {messages.length < 3 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 shrink-0 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              💡 اقتراحات:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-200 hover:border-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 shadow-sm transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Selected Image Preview before sending */}
        {selectedImage && (
          <div className="bg-white p-2 rounded-2xl border-2 border-emerald-500 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <img src={selectedImage} alt="Voorbeeld" className="w-12 h-12 object-cover rounded-lg" />
              <span className="text-xs font-bold text-emerald-800">Foto bijgevoegd / تم إرفاق الصورة</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar (Cleanly pinned to bottom, never overflowing) */}
        <div className="bg-white rounded-3xl border-3 border-blue-600 p-2 sm:p-2.5 shadow-lg flex items-center gap-2 shrink-0 mb-1">
          {/* Upload image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 sm:p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border-2 border-slate-200 min-h-[48px] min-w-[48px] flex items-center justify-center transition-all shrink-0"
            title="Foto van scherm meesturen / إرسال لقطة شاشة"
          >
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Microphone speech input button */}
          <button
            onClick={handleToggleVoiceRecord}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 min-h-[48px] min-w-[48px] flex items-center justify-center transition-all shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200'
            }`}
            title={isRecording ? 'Stop opname / إيقاف التسجيل' : 'Spreek uw vraag in / تحدث بصوتك'}
          >
            {isRecording ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            dir={inputIsRtl ? 'rtl' : 'ltr'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isRecording
                ? 'Aan het luisteren... / جاري الاستماع...'
                : 'اكتب سؤالك بأي لغة / Stel uw vraag...'
            }
            className={`flex-1 p-2 sm:p-3 text-base sm:text-lg text-slate-900 bg-transparent outline-none font-medium min-w-0 ${
              inputIsRtl ? 'text-right' : 'text-left'
            }`}
          />

          {/* Send button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border-2 border-blue-400 shadow-md flex items-center justify-center gap-1.5 min-h-[48px] shrink-0 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm sm:text-base">إرسال</span>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>
    </div>
  );
};
