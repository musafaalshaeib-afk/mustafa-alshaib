import React, { useState } from 'react';
import { SupportSession, DeviceProfile, TrustedContact } from '../types';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileText, 
  HelpCircle, 
  Calendar, 
  Laptop, 
  CheckSquare, 
  Phone,
  Type,
  Sparkles
} from 'lucide-react';

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SupportSession;
  deviceProfile?: DeviceProfile;
  trustedContact?: TrustedContact | null;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  isOpen,
  onClose,
  session,
  deviceProfile,
  trustedContact,
}) => {
  const [printTextSize, setPrintTextSize] = useState<'normal' | 'large' | 'extralarge'>('large');
  const [isCopied, setIsCopied] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const toggleStepCheck = (stepNum: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate plain text version for clipboard
  const generatePlainText = () => {
    const dateStr = new Date(session.timestamp || Date.now()).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let text = `====================================================\n`;
    text += `KIJKHULP - STAPPENPLAN VOOR COMPUTERPROBLEEM\n`;
    text += `====================================================\n\n`;
    text += `Datum: ${dateStr}\n`;
    text += `Probleem: ${session.detectedProblem || session.originalProblem}\n`;
    if (session.programName) {
      text += `Onderdeel / Programma: ${session.programName}\n`;
    }
    if (deviceProfile) {
      text += `Apparaat: ${deviceProfile.windowsVersion} - ${deviceProfile.deviceType} (${deviceProfile.brand})\n`;
    }
    text += `\nSTAPPEN OM UIT TE VOEREN:\n`;
    text += `----------------------------------------------------\n`;

    session.steps.forEach((step, idx) => {
      const isDone = checkedSteps[step.stepNumber] || step.completed;
      text += `\n[${isDone ? 'X' : ' '}] STAP ${step.stepNumber || idx + 1}: ${step.title}\n`;
      text += `    Instructie: ${step.instruction}\n`;
      if (step.detailedTip) {
        text += `    Handige tip: ${step.detailedTip}\n`;
      }
      if (step.visualHint?.label) {
        text += `    Waar te kijken: ${step.visualHint.label}\n`;
      }
    });

    text += `\n----------------------------------------------------\n`;
    text += `NOTITIES & AANTEKENINGEN:\n`;
    text += `____________________________________________________\n`;
    text += `____________________________________________________\n\n`;

    if (trustedContact?.name) {
      text += `Komt u er niet uit? Bel ${trustedContact.name} (${trustedContact.relationship}): ${trustedContact.phoneNumber}\n`;
    }

    text += `\nGemaakt met KijkHulp - Rustige en veilige computerhulp voor senioren.\n`;
    return text;
  };

  const handleCopyText = () => {
    const text = generatePlainText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Generate standalone downloadable HTML file
  const handleDownloadHtml = () => {
    const dateStr = new Date(session.timestamp || Date.now()).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const stepsHtml = session.steps
      .map(
        (step, idx) => `
      <div class="step-card">
        <div class="step-header">
          <span class="checkbox-box">[ &nbsp; ]</span>
          <span class="step-title">Stap ${step.stepNumber || idx + 1}: ${step.title}</span>
        </div>
        <p class="step-instruction">${step.instruction}</p>
        ${
          step.detailedTip
            ? `<div class="step-tip"><strong>💡 Tip:</strong> ${step.detailedTip}</div>`
            : ''
        }
        ${
          step.visualHint?.label
            ? `<div class="step-hint"><strong>📍 Waar te kijken:</strong> ${step.visualHint.label}</div>`
            : ''
        }
      </div>
    `
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>KijkHulp Stappenplan - ${session.detectedProblem || session.originalProblem}</title>
  <style>
    @page { margin: 1.5cm; }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.6;
      font-size: 16px;
      margin: 0;
      padding: 20px;
    }
    .header-box {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-size: 12px;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 26px;
      margin: 8px 0;
      color: #0f172a;
    }
    .meta-info {
      font-size: 14px;
      color: #475569;
      margin-top: 5px;
    }
    .problem-box {
      background: #f8fafc;
      border: 2px solid #cbd5e1;
      border-left: 6px solid #2563eb;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .problem-title {
      font-size: 18px;
      font-weight: bold;
      color: #0f172a;
      margin: 0;
    }
    .step-card {
      border: 2px solid #e2e8f0;
      background: #ffffff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .checkbox-box {
      font-family: monospace;
      font-size: 20px;
      font-weight: bold;
      border: 2px solid #475569;
      border-radius: 4px;
      padding: 2px 8px;
      background: #f8fafc;
    }
    .step-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .step-instruction {
      font-size: 17px;
      font-weight: 600;
      color: #0f172a;
      margin: 6px 0 10px 0;
      line-height: 1.5;
    }
    .step-tip {
      background: #fefce8;
      border-left: 4px solid #eab308;
      padding: 8px 12px;
      font-size: 14px;
      color: #713f12;
      border-radius: 4px;
      margin-top: 6px;
    }
    .step-hint {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 8px 12px;
      font-size: 14px;
      color: #14532d;
      border-radius: 4px;
      margin-top: 6px;
    }
    .notes-box {
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      padding: 16px;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .notes-line {
      border-bottom: 1px solid #cbd5e1;
      height: 28px;
    }
    .footer-box {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <span class="badge">KijkHulp Computerhulp</span>
    <h1>Stap-voor-stap Oplossing voor Computerprobleem</h1>
    <div class="meta-info">
      📅 <strong>Datum:</strong> ${dateStr} &nbsp;|&nbsp; 
      💻 <strong>Apparaat:</strong> ${deviceProfile?.windowsVersion || 'Windows'} (${deviceProfile?.deviceType || 'Computer'})
    </div>
  </div>

  <div class="problem-box">
    <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #2563eb; margin-bottom: 4px;">Probleem:</div>
    <div class="problem-title">${session.detectedProblem || session.originalProblem}</div>
    ${
      session.programName
        ? `<div style="font-size: 14px; color: #475569; margin-top: 4px;"><strong>Onderdeel:</strong> ${session.programName}</div>`
        : ''
    }
  </div>

  <h2 style="font-size: 20px; color: #0f172a; margin-bottom: 15px;">Uit te voeren stappen:</h2>
  ${stepsHtml}

  <div class="notes-box">
    <strong style="color: #334155; font-size: 15px;">✏️ Mijn eigen aantekeningen & wachtwoorden (met pen in te vullen):</strong>
    <div class="notes-line"></div>
    <div class="notes-line"></div>
    <div class="notes-line"></div>
  </div>

  ${
    trustedContact?.name
      ? `
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 12px 16px; margin-top: 20px; font-size: 15px; color: #166534;">
    <strong>🤝 Heeft u hulp nodig?</strong> Vraag uw vertrouwde persoon: <strong>${trustedContact.name}</strong> (${trustedContact.relationship}) &nbsp;|&nbsp; 📞 <strong>${trustedContact.phoneNumber}</strong>
  </div>
  `
      : ''
  }

  <div class="footer-box">
    <span>Gemaakt met KijkHulp - Bewaar dit stappenplan bij uw computer om het rustig na te lezen.</span>
    <span>Pagina 1</span>
  </div>

  <div class="no-print-btn" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; padding: 14px 28px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer;">
      🖨️ Nu dit document afdrukken
    </button>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KijkHulp-Stappenplan-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(session.timestamp || Date.now()).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fontMultiplierClass =
    printTextSize === 'extralarge'
      ? 'text-xl'
      : printTextSize === 'large'
      ? 'text-lg'
      : 'text-base';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-4xl max-h-[calc(100dvh-24px)] flex flex-col shadow-2xl border-4 border-blue-600 overflow-hidden">
        
        {/* MODAL CONTROL BAR (NOT PRINTED) */}
        <div className="no-print bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
              🖨️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Stappenplan Printervriendelijk Exporteren
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-medium">
                Druk dit stappenplan af voor op papier of download het als bestand.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-end sm:self-center p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Venster sluiten"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ACTION BUTTONS TOOLBAR (NOT PRINTED) */}
        <div className="no-print bg-slate-100 p-3 sm:p-4 border-b-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* BUTTON 1: NU AFDRUKKEN */}
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base sm:text-lg px-5 py-3 rounded-2xl shadow-md border-2 border-blue-400 flex items-center gap-2.5 active:scale-95 transition-all min-h-[50px]"
            >
              <Printer className="w-6 h-6 stroke-[2.5]" />
              <span>Nu afdrukken (Printer / PDF)</span>
            </button>

            {/* BUTTON 2: DOWNLOADEN ALS BESTAND */}
            <button
              onClick={handleDownloadHtml}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-4 py-3 rounded-2xl shadow-sm border border-emerald-400 flex items-center gap-2 active:scale-95 transition-all min-h-[50px]"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download als bestand (.html)</span>
            </button>

            {/* BUTTON 3: KOPIEER TEKST */}
            <button
              onClick={handleCopyText}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base px-4 py-3 rounded-2xl border-2 border-slate-300 flex items-center gap-2 active:scale-95 transition-all min-h-[50px]"
            >
              {isCopied ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                  <span className="text-emerald-700">Gekopieerd!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-slate-600" />
                  <span>Kopieer tekst</span>
                </>
              )}
            </button>
          </div>

          {/* LETTERGROOTTE VOOR AFDRUKKEN */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border-2 border-slate-300">
            <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              <span>Tekst:</span>
            </span>
            <button
              onClick={() => setPrintTextSize('normal')}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                printTextSize === 'normal'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Normaal
            </button>
            <button
              onClick={() => setPrintTextSize('large')}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                printTextSize === 'large'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Groot
            </button>
            <button
              onClick={() => setPrintTextSize('extralarge')}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                printTextSize === 'extralarge'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Extra groot
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW SHEET (THIS IS WHAT GETS PRINTED!) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60">
          
          <div className="printable-stappenplan bg-white mx-auto max-w-3xl rounded-2xl shadow-xl border-2 border-slate-300 p-6 sm:p-10 space-y-6 text-slate-900">
            
            {/* Document Header */}
            <div className="border-b-4 border-blue-600 pb-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <span>💻 KijkHulp Computerhulp</span>
                </div>
                <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Stap-voor-stap Handleiding voor uw Computer
              </h1>

              {deviceProfile && (
                <div className="text-xs sm:text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>
                    Apparaat: <strong>{deviceProfile.windowsVersion}</strong> - {deviceProfile.deviceType} ({deviceProfile.brand})
                  </span>
                </div>
              )}
            </div>

            {/* Probleem Kader */}
            <div className="bg-slate-50 border-2 border-slate-300 border-l-8 border-l-blue-600 p-4 sm:p-5 rounded-2xl space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 block">
                Het computerprobleem:
              </span>
              <p className="text-lg sm:text-xl font-black text-slate-950 leading-snug">
                {session.detectedProblem || session.originalProblem}
              </p>
              {session.programName && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Windows onderdeel: <strong>{session.programName}</strong>
                </p>
              )}
            </div>

            {/* Inleiding voor op papier */}
            <div className="text-slate-700 text-sm sm:text-base font-medium">
              Voer de onderstaande stappen rustig één voor één uit. U kunt met een pen of potlood de vakjes <strong>[ ✓ ]</strong> afvinken zodra een stap is gelukt.
            </div>

            {/* Alle Stappen */}
            <div className="space-y-4">
              {session.steps.map((step, idx) => {
                const isStepDone = checkedSteps[step.stepNumber] || step.completed;

                return (
                  <div
                    key={step.stepNumber || idx}
                    className="print-step-item bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 space-y-3 relative hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Interactive checkbox on screen, clear print checkbox on paper */}
                      <button
                        type="button"
                        onClick={() => toggleStepCheck(step.stepNumber)}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 font-bold text-lg transition-all ${
                          isStepDone
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                            : 'bg-white border-slate-400 text-transparent hover:border-blue-600'
                        }`}
                        title="Klik om af te vinken"
                      >
                        ✓
                      </button>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-lg sm:text-xl font-black text-blue-950">
                            Stap {step.stepNumber || idx + 1}: {step.title}
                          </h3>
                          {isStepDone && (
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                              Uitgevoerd ✓
                            </span>
                          )}
                        </div>

                        {/* De Instructie */}
                        <p className={`font-bold text-slate-900 ${fontMultiplierClass}`}>
                          {step.instruction}
                        </p>

                        {/* Handige tip */}
                        {step.detailedTip && (
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-2.5 rounded-r-xl text-xs sm:text-sm text-amber-950 font-medium">
                            💡 <strong>Tip:</strong> {step.detailedTip}
                          </div>
                        )}

                        {/* Visual Hint */}
                        {step.visualHint?.label && (
                          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2.5 rounded-r-xl text-xs sm:text-sm text-emerald-950 font-medium">
                            📍 <strong>Waar te kijken:</strong> {step.visualHint.label}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notitiesectie met schrijflijntjes voor de pen */}
            <div className="print-step-item border-2 border-dashed border-slate-400 rounded-2xl p-5 space-y-3 bg-slate-50/50">
              <span className="text-sm font-black text-slate-900 block">
                ✏️ Eigen aantekeningen & wachtwoorden (met pen in te vullen):
              </span>
              <div className="space-y-4 pt-1">
                <div className="border-b border-slate-300 h-6"></div>
                <div className="border-b border-slate-300 h-6"></div>
                <div className="border-b border-slate-300 h-6"></div>
              </div>
            </div>

            {/* Vertrouwde Persoon Contactblok */}
            {trustedContact?.name && (
              <div className="print-step-item bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 text-emerald-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-200 rounded-xl flex items-center justify-center text-xl shrink-0">
                    👨‍👩‍👧
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block text-emerald-800">
                      Hulp nodig? Neem contact op:
                    </span>
                    <strong className="text-base sm:text-lg">
                      {trustedContact.name} ({trustedContact.relationship})
                    </strong>
                  </div>
                </div>

                <div className="font-black text-base sm:text-lg bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-sm">
                  📞 {trustedContact.phoneNumber}
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Gemaakt met KijkHulp - Bewaar dit stappenplan bij uw computer om het rustig na te lezen.</span>
              <span>kijk-hulp.nl</span>
            </div>

          </div>

        </div>

        {/* BOTTOM CLOSE BAR (NOT PRINTED) */}
        <div className="no-print bg-white p-3 sm:p-4 border-t-2 border-slate-200 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            💡 <em>Tip: Kies in het afdrukmenu van uw printer voor "Opslaan als PDF" om het als digitaal bestand te bewaren.</em>
          </p>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base px-6 py-2.5 rounded-2xl border-2 border-slate-300 min-h-[46px]"
          >
            Sluiten
          </button>
        </div>

      </div>
    </div>
  );
};
