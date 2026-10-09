import React, { useState, useEffect } from 'react';
import { TrustedContact, DeviceProfile } from '../types';
import { 
  getStoredTrustedContacts, 
  saveTrustedContacts, 
  getStoredTrustedContact, 
  saveTrustedContact,
  getStoredHomeAddress,
  saveHomeAddress
} from '../services/storage';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  AlertCircle, 
  Heart, 
  X, 
  Check, 
  Copy, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Send, 
  Navigation, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Home,
  RefreshCw,
  HelpCircle,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TrustedContactScreenProps {
  trustedContact: TrustedContact | null;
  onSaveContact: (contact: TrustedContact) => void;
  currentProblemText?: string;
  stepsDone?: string[];
  deviceProfile: DeviceProfile;
  fontSize?: 'normal' | 'large' | 'extralarge';
}

export const TrustedContactScreen: React.FC<TrustedContactScreenProps> = ({
  trustedContact,
  onSaveContact,
  currentProblemText = 'Mijn computer reageert niet zoals verwacht.',
  stepsDone = [],
  deviceProfile,
  fontSize = 'large',
}) => {
  // Contacts list
  const [contacts, setContacts] = useState<TrustedContact[]>(() => {
    return getStoredTrustedContacts();
  });

  // Modal states
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<TrustedContact | null>(null);

  // Email Modal state
  const [emailModalContact, setEmailModalContact] = useState<TrustedContact | null>(null);
  const [emailSubject, setEmailSubject] = useState('Hulp nodig met mijn computer');
  const [emailBody, setEmailBody] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  // WhatsApp Modal state
  const [whatsappModalContact, setWhatsappModalContact] = useState<TrustedContact | null>(null);
  const [whatsappText, setWhatsappText] = useState('Hallo, ik heb hulp nodig met mijn computer.');

  // Location Sharing states
  const [locationPermissionContact, setLocationPermissionContact] = useState<TrustedContact | null>(null);
  const [locationMode, setLocationMode] = useState<'prompt' | 'manual'>('prompt');
  const [manualAddress, setManualAddress] = useState('');
  const [savedHomeAddress, setSavedHomeAddress] = useState<string>(() => getStoredHomeAddress());
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);
  const [saveAsHomeAddress, setSaveAsHomeAddress] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationResult, setLocationResult] = useState<{
    lat?: number;
    lng?: number;
    url: string;
    contact: TrustedContact;
    addressText?: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationCopied, setLocationCopied] = useState(false);

  // Home Address Modal state
  const [isHomeAddressModalOpen, setIsHomeAddressModalOpen] = useState(false);
  const [homeAddressInput, setHomeAddressInput] = useState(() => getStoredHomeAddress());

  // Add / Edit Contact Modal state
  const [isAddOrEditOpen, setIsAddOrEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRelationship, setFormRelationship] = useState('Zoon');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Delete Contact Confirmation
  const [contactToDelete, setContactToDelete] = useState<TrustedContact | null>(null);

  useEffect(() => {
    const list = getStoredTrustedContacts();
    setContacts(list);
  }, []);

  // Update primary contact when list changes
  const updateContactsList = (newList: TrustedContact[]) => {
    setContacts(newList);
    saveTrustedContacts(newList);
    if (newList.length > 0) {
      const primary = newList.find((c) => c.isPrimary) || newList[0];
      onSaveContact(primary);
    }
  };

  // Helper to format clean phone for WhatsApp
  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    let cleaned = phoneStr.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('06')) {
      cleaned = '316' + cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = '31' + cleaned.substring(1);
    }
    return cleaned;
  };

  // 1. EMAIL FLOW
  const handleOpenEmailModal = (contact: TrustedContact) => {
    setEmailModalContact(contact);
    setEmailSubject('Hulp nodig met mijn computer');
    setEmailBody(
      `Hallo ${contact.name},\n\nIk loop even vast met mijn computer en heb jouw hulp nodig.\nProbleem: "${currentProblemText}"\n\nKun je mij alsjeblieft bellen of helpen als je tijd hebt?\n\nAlvast bedankt!`
    );
    setEmailCopied(false);
  };

  const handleSendEmail = () => {
    if (!emailModalContact?.email) return;
    const mailtoUrl = `mailto:${encodeURIComponent(emailModalContact.email)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    setEmailModalContact(null);
  };

  // 2. WHATSAPP FLOW
  const handleOpenWhatsAppModal = (contact: TrustedContact) => {
    setWhatsappModalContact(contact);
    setWhatsappText(`Hallo ${contact.name}, ik heb hulp nodig met mijn computer.`);
  };

  const handleConfirmSendWhatsApp = () => {
    if (!whatsappModalContact?.phoneNumber) return;
    const phoneNum = cleanPhoneForWhatsApp(whatsappModalContact.phoneNumber);
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank');
    setWhatsappModalContact(null);
  };

  // 3. LOCATION SHARING FLOW (ALWAYS ASKS PERMISSION FIRST)
  const handleOpenLocationPermission = (contact: TrustedContact, initialMode?: 'prompt' | 'manual') => {
    setLocationPermissionContact(contact);
    setLocationError(null);
    setShowBrowserGuide(false);
    if (savedHomeAddress) {
      setManualAddress(savedHomeAddress);
    } else {
      setManualAddress('');
    }

    // Check if browser permission for geolocation is already known/denied
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((p) => {
        if (p.state === 'denied') {
          // Browser has denied GPS; default to guaranteed working address mode!
          setLocationMode('manual');
          setLocationError('💡 Opgelost: Browser-GPS staat uitgeschakeld. U kunt hier direct uw adres of woonplaats kiezen.');
        } else {
          setLocationMode(initialMode || (savedHomeAddress ? 'manual' : 'prompt'));
        }
      }).catch(() => {
        setLocationMode(initialMode || (savedHomeAddress ? 'manual' : 'prompt'));
      });
    } else {
      setLocationMode(initialMode || (savedHomeAddress ? 'manual' : 'prompt'));
    }
  };

  const handleConfirmLocationPermission = () => {
    if (!locationPermissionContact) return;
    const targetContact = locationPermissionContact;
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationMode('manual');
      if (savedHomeAddress) {
        setManualAddress(savedHomeAddress);
      }
      setLocationError('💡 Opgelost: Dit apparaat ondersteunt geen GPS. Kies hieronder uw adres of woonplaats.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setLocationResult({
          lat,
          lng,
          url: mapsUrl,
          contact: targetContact,
          addressText: 'Huidige GPS-locatie',
        });
        setIsLocating(false);
        setLocationPermissionContact(null);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        // Automatically switch to address mode so user is never stuck!
        setLocationMode('manual');
        if (savedHomeAddress && !manualAddress) {
          setManualAddress(savedHomeAddress);
        }
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('💡 Opgelost: Browser-GPS is geblokkeerd. U kunt hier direct uw adres of plaatsnaam kiezen. Dit werkt altijd 100% gegarandeerd!');
        } else {
          setLocationError('💡 GPS-signaal kon niet worden bepaald. Vul hier direct uw adres of plaatsnaam in.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleShareManualAddress = (contact: TrustedContact, addressToShare: string) => {
    const clean = addressToShare.trim();
    if (!clean) return;

    if (saveAsHomeAddress) {
      saveHomeAddress(clean);
      setSavedHomeAddress(clean);
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
    setLocationResult({
      url: mapsUrl,
      contact,
      addressText: clean,
    });
    setLocationPermissionContact(null);
    setLocationError(null);
  };

  const handleShareSavedHomeAddress = (contact: TrustedContact) => {
    if (!savedHomeAddress.trim()) {
      setHomeAddressInput('');
      setIsHomeAddressModalOpen(true);
      return;
    }
    const clean = savedHomeAddress.trim();
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
    setLocationResult({
      url: mapsUrl,
      contact,
      addressText: clean,
    });
    setLocationPermissionContact(null);
    setLocationError(null);
  };

  const handleFetchIpLocation = async (contact: TrustedContact) => {
    setIsLocating(true);
    try {
      const res = await fetch('/api/ip-location');
      const data = await res.json();
      if (data && data.success && data.lat && data.lng) {
        const mapsUrl = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
        setLocationResult({
          lat: data.lat,
          lng: data.lng,
          url: mapsUrl,
          contact,
          addressText: data.city ? `Geschatte locatie: ${data.city}` : 'Geschatte internet-locatie',
        });
        setLocationPermissionContact(null);
        setLocationError(null);
      } else {
        setLocationError('Kon de internet-locatie niet automatisch vaststellen. Vul alstublieft hieronder uw adres of postcode in.');
        setLocationMode('manual');
      }
    } catch {
      setLocationError('Kon internet-locatie niet ophalen. Vul alstublieft uw adres of postcode hieronder in.');
      setLocationMode('manual');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveHomeAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = homeAddressInput.trim();
    saveHomeAddress(clean);
    setSavedHomeAddress(clean);
    setIsHomeAddressModalOpen(false);
  };

  const handleDeleteHomeAddress = () => {
    saveHomeAddress('');
    setSavedHomeAddress('');
    setHomeAddressInput('');
    setIsHomeAddressModalOpen(false);
  };

  // 4. ADD / EDIT CONTACT
  const handleOpenAddContact = () => {
    setEditingId(null);
    setFormName('');
    setFormRelationship('Zoon');
    setFormPhone('');
    setFormEmail('');
    setIsAddOrEditOpen(true);
  };

  const handleOpenEditContact = (c: TrustedContact) => {
    setEditingId(c.id || 'tc-1');
    setFormName(c.name);
    setFormRelationship(c.relationship || 'Zoon');
    setFormPhone(c.phoneNumber || '');
    setFormEmail(c.email || '');
    setIsAddOrEditOpen(true);
  };

  const handleSaveContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingId) {
      // Edit existing
      const updated = contacts.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: formName.trim(),
              relationship: formRelationship.trim(),
              phoneNumber: formPhone.trim(),
              email: formEmail.trim(),
            }
          : c
      );
      updateContactsList(updated);
    } else {
      // Add new
      const newContact: TrustedContact = {
        id: `tc-${Date.now()}`,
        name: formName.trim(),
        relationship: formRelationship.trim(),
        phoneNumber: formPhone.trim(),
        email: formEmail.trim(),
        isPrimary: contacts.length === 0,
      };
      updateContactsList([newContact, ...contacts]);
    }

    setIsAddOrEditOpen(false);
  };

  // 5. DELETE CONTACT
  const handleConfirmDelete = () => {
    if (!contactToDelete) return;
    const filtered = contacts.filter((c) => c.id !== contactToDelete.id);
    updateContactsList(filtered);
    setContactToDelete(null);
  };

  // 6. EMERGENCY MODAL HELPERS
  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0] || null;
  const currentEmergencyTarget = emergencyContact || primaryContact;

  const textSizeClass =
    fontSize === 'extralarge'
      ? 'text-xl sm:text-2xl'
      : fontSize === 'large'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-32">
      
      {/* Title Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-emerald-500 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-300 text-emerald-950 px-3.5 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-sm">
              <Heart className="w-4 h-4 fill-emerald-950" />
              <span>Speciaal voor ouderen</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Familie en vertrouwde personen
            </h1>
            <p className="text-emerald-100 text-base sm:text-lg font-medium max-w-xl">
              Eenvoudig, overzichtelijk en met één druk op de knop contact opnemen met uw zoon, dochter of buurman.
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-900/60 text-white rounded-3xl flex items-center justify-center font-black text-4xl shadow-inner border-2 border-emerald-400 shrink-0">
            👨‍👩‍👧
          </div>
        </div>
      </div>

      {/* PROMINENTE KNOP: "🚨 IK HEB HULP NODIG" */}
      <div className="bg-white rounded-3xl border-4 border-rose-500 p-5 sm:p-6 shadow-2xl space-y-3">
        <button
          onClick={() => {
            setEmergencyContact(primaryContact);
            setIsEmergencyModalOpen(true);
          }}
          className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-98 text-white font-black text-2xl sm:text-3xl py-5 px-6 rounded-2xl shadow-xl border-4 border-rose-300 flex items-center justify-center gap-4 transition-all min-h-[76px]"
          aria-label="Direct hulp inschakelen van een vertrouwd persoon"
        >
          <AlertCircle className="w-10 h-10 animate-pulse text-amber-300 stroke-[2.5]" />
          <span>🚨 Ik heb hulp nodig</span>
        </button>
        <p className="text-center text-xs sm:text-sm text-slate-600 font-medium">
          Druk hierop voor snelle noodkeuzes: direct bellen, WhatsAppen, e-mailen of uw locatie delen.
        </p>
      </div>

      {/* KAART: MIJN VASTE THUISADRES (OPLOSSING BIJ LOCATIEFOUT OF GPS GEWEIGERD) */}
      <div className="bg-white rounded-3xl border-3 border-teal-400 p-5 sm:p-6 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0">
              🏡
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Mijn vaste thuisadres
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Sla uw adres eenmalig op. Zo kunt u dit altijd met één klik delen als GPS uitstaat of geweigerd is.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setHomeAddressInput(savedHomeAddress);
              setIsHomeAddressModalOpen(true);
            }}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-4 py-2.5 rounded-2xl border-2 border-teal-500 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0 min-h-[46px]"
          >
            <Edit3 className="w-4 h-4" />
            <span>{savedHomeAddress ? 'Adres wijzigen' : 'Thuisadres instellen'}</span>
          </button>
        </div>

        {savedHomeAddress ? (
          <div className="bg-teal-50/80 border-2 border-teal-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-teal-950 font-bold text-sm sm:text-base">
              <Check className="w-5 h-5 text-teal-700 shrink-0" />
              <span>Opgeslagen adres: <strong>{savedHomeAddress}</strong></span>
            </div>
            {primaryContact && (
              <button
                onClick={() => handleShareSavedHomeAddress(primaryContact)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-sm border border-teal-400 flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Deel direct met {primaryContact.name.split(' ')[0]}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-3 text-slate-600 text-xs sm:text-sm flex items-center justify-between gap-2">
            <span>Nog geen thuisadres ingevuld. Handig voor als GPS geblokkeerd is!</span>
            <button
              onClick={() => {
                setHomeAddressInput('');
                setIsHomeAddressModalOpen(true);
              }}
              className="text-teal-700 font-extrabold underline shrink-0 hover:text-teal-900"
            >
              Nu invullen
            </button>
          </div>
        )}
      </div>

      {/* Overzicht Vertrouwde Personen */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-700" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Mijn vertrouwde personen
            </h2>
          </div>

          <button
            onClick={handleOpenAddContact}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-4 py-2.5 rounded-2xl border-2 border-emerald-400 shadow-md flex items-center gap-2 active:scale-95 transition-all min-h-[48px]"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Persoon toevoegen</span>
          </button>
        </div>

        {contacts.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-3 border-slate-300 shadow-md text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold">
              👤
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Nog geen vertrouwde persoon opgeslagen
            </h3>
            <p className="text-slate-600 text-base max-w-md mx-auto">
              Voeg bijvoorbeeld uw zoon, dochter, kleinkind of buurman toe. Dan kunt u altijd met één klik hulp vragen.
            </p>
            <button
              onClick={handleOpenAddContact}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg px-6 py-3.5 rounded-2xl shadow-lg border-2 border-emerald-400 min-h-[52px]"
            >
              ➕ Nu persoon toevoegen
            </button>
          </div>
        ) : (
          /* Cards list */
          <div className="space-y-5">
            {contacts.map((contact) => (
              <div
                key={contact.id || contact.name}
                className="bg-white rounded-3xl border-4 border-emerald-500 shadow-xl p-5 sm:p-7 space-y-5 hover:border-emerald-600 transition-all"
              >
                {/* Contact Header */}
                <div className="flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl border-2 border-emerald-300 shrink-0">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                          {contact.name}
                        </h3>
                        {contact.isPrimary && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            Hoofdcontact
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-700 font-extrabold text-base sm:text-lg block">
                        {contact.relationship}
                      </span>
                      <div className="text-xs sm:text-sm text-slate-500 font-medium space-x-3 pt-0.5">
                        {contact.phoneNumber && <span>📞 {contact.phoneNumber}</span>}
                        {contact.email && <span>✉️ {contact.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Edit & Delete mini actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditContact(contact)}
                      className="p-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs flex items-center gap-1 min-h-[40px]"
                      title="Gegevens wijzigen"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Wijzigen</span>
                    </button>
                    <button
                      onClick={() => setContactToDelete(contact)}
                      className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-300 min-h-[40px]"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* GROTE DUIDELIJKE KNOPPEN VOOR OUDEREN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  
                  {/* 1. Bel contact */}
                  {contact.phoneNumber ? (
                    <a
                      href={`tel:${contact.phoneNumber}`}
                      className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-lg sm:text-xl py-4 px-4 rounded-2xl shadow-md border-2 border-emerald-400 flex items-center justify-center gap-3 transition-all min-h-[64px]"
                      title={`Bel ${contact.name}`}
                    >
                      <Phone className="w-6 h-6 stroke-[2.5]" />
                      <span>Bel {contact.name.split(' ')[0]}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => handleOpenEditContact(contact)}
                      className="bg-slate-100 text-slate-400 font-bold text-sm py-4 px-4 rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-2 min-h-[64px]"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Geen nummer</span>
                    </button>
                  )}

                  {/* 2. WhatsApp versturen */}
                  {contact.phoneNumber ? (
                    <button
                      onClick={() => handleOpenWhatsAppModal(contact)}
                      className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-extrabold text-lg sm:text-xl py-4 px-4 rounded-2xl shadow-md border-2 border-green-400 flex items-center justify-center gap-3 transition-all min-h-[64px]"
                      title={`Stuur WhatsApp naar ${contact.name}`}
                    >
                      <MessageSquare className="w-6 h-6 stroke-[2.5]" />
                      <span>Stuur via WhatsApp</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenEditContact(contact)}
                      className="bg-slate-100 text-slate-400 font-bold text-sm py-4 px-4 rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-2 min-h-[64px]"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Geen nummer</span>
                    </button>
                  )}

                  {/* 3. E-mail versturen */}
                  {contact.email ? (
                    <button
                      onClick={() => handleOpenEmailModal(contact)}
                      className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-lg sm:text-xl py-4 px-4 rounded-2xl shadow-md border-2 border-blue-400 flex items-center justify-center gap-3 transition-all min-h-[64px]"
                      title={`Stuur een e-mail naar ${contact.name}`}
                    >
                      <Mail className="w-6 h-6 stroke-[2.5]" />
                      <span>E-mail versturen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenEditContact(contact)}
                      className="bg-slate-100 text-slate-400 font-bold text-sm py-4 px-4 rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-2 min-h-[64px]"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Geen e-mailadres</span>
                    </button>
                  )}

                  {/* 4. Mijn locatie delen */}
                  <button
                    onClick={() => handleOpenLocationPermission(contact)}
                    className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-lg sm:text-xl py-4 px-4 rounded-2xl shadow-md border-2 border-amber-400 flex items-center justify-center gap-3 transition-all min-h-[64px]"
                    title={`Deel uw huidige locatie met ${contact.name}`}
                  >
                    <MapPin className="w-6 h-6 stroke-[2.5]" />
                    <span>Deel mijn locatie</span>
                  </button>

                </div>

                {/* Snelle optie: Direct opgeslagen thuisadres delen */}
                {savedHomeAddress && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleShareSavedHomeAddress(contact)}
                      className="w-full bg-teal-50 hover:bg-teal-100 active:scale-98 text-teal-950 font-bold text-sm sm:text-base py-3 px-4 rounded-2xl border-2 border-teal-300 flex items-center justify-between transition-all min-h-[50px]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Home className="w-5 h-5 text-teal-700 shrink-0" />
                        <span className="truncate">Thuisadres delen: <strong>{savedHomeAddress}</strong></span>
                      </div>
                      <span className="text-xs bg-teal-700 text-white font-extrabold px-3 py-1 rounded-xl shrink-0">
                        Direct sturen
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Privacy Verklaring */}
      <div className="bg-slate-100 rounded-3xl p-5 border-2 border-slate-300 flex items-start sm:items-center gap-3.5 text-slate-700 text-sm">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
        <p>
          <strong>Veilig & Beschermd:</strong> Uw contact- en locatiegegevens worden nooit zonder uw uitdrukkelijke toestemming gedeeld en blijven veilig in uw eigen browser opgeslagen.
        </p>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: "IK HEB HULP NODIG" (SNELLE OVERZICHTSPOPUP) */}
      {/* ========================================================= */}
      {isEmergencyModalOpen && currentEmergencyTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-xl p-5 sm:p-8 shadow-2xl border-4 border-rose-600 space-y-5 sm:space-y-6 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black border-2 border-rose-300">
                🚨
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Directe Hulp Inschakelen
              </h2>
              <p className="text-slate-600 text-base font-medium">
                Kies hoe u direct contact wilt opnemen met <strong>{currentEmergencyTarget.name}</strong> ({currentEmergencyTarget.relationship}):
              </p>
            </div>

            {/* Selecteer andere persoon indien er meerdere zijn */}
            {contacts.length > 1 && (
              <div className="bg-slate-50 p-3 rounded-2xl border-2 border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kies contactpersoon:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {contacts.map((c) => (
                    <button
                      key={c.id || c.name}
                      onClick={() => setEmergencyContact(c)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 border-2 transition-all ${
                        currentEmergencyTarget.id === c.id
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      👤 {c.name} ({c.relationship})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Snelle Noodopties */}
            <div className="space-y-3">
              {/* Optie 1: Bellen */}
              {currentEmergencyTarget.phoneNumber && (
                <a
                  href={`tel:${currentEmergencyTarget.phoneNumber}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-between active:scale-98 transition-all min-h-[64px]"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-7 h-7" />
                    <span>Bel {currentEmergencyTarget.name}</span>
                  </div>
                  <span className="text-sm bg-emerald-700/60 px-3 py-1 rounded-xl">Direct bellen</span>
                </a>
              )}

              {/* Optie 2: WhatsApp */}
              {currentEmergencyTarget.phoneNumber && (
                <button
                  onClick={() => {
                    setIsEmergencyModalOpen(false);
                    handleOpenWhatsAppModal(currentEmergencyTarget);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-green-400 flex items-center justify-between active:scale-98 transition-all min-h-[64px]"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-7 h-7" />
                    <span>Stuur via WhatsApp</span>
                  </div>
                  <span className="text-sm bg-green-700/60 px-3 py-1 rounded-xl">Bericht klaar</span>
                </button>
              )}

              {/* Optie 3: E-mail */}
              {currentEmergencyTarget.email && (
                <button
                  onClick={() => {
                    setIsEmergencyModalOpen(false);
                    handleOpenEmailModal(currentEmergencyTarget);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-blue-400 flex items-center justify-between active:scale-98 transition-all min-h-[64px]"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-7 h-7" />
                    <span>Stuur een e-mail</span>
                  </div>
                  <span className="text-sm bg-blue-700/60 px-3 py-1 rounded-xl">E-mail venster</span>
                </button>
              )}

              {/* Optie 4: Deel Locatie */}
              <button
                onClick={() => {
                  setIsEmergencyModalOpen(false);
                  handleOpenLocationPermission(currentEmergencyTarget);
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-amber-400 flex items-center justify-between active:scale-98 transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-7 h-7" />
                  <span>Deel mijn locatie</span>
                </div>
                <span className="text-sm bg-amber-700/60 px-3 py-1 rounded-xl">Google Maps</span>
              </button>

              {/* Optie 5 (Indien thuisadres bekend): Direct thuisadres delen */}
              {savedHomeAddress && (
                <button
                  onClick={() => {
                    setIsEmergencyModalOpen(false);
                    handleShareSavedHomeAddress(currentEmergencyTarget);
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xl py-4 px-6 rounded-2xl shadow-lg border-2 border-teal-400 flex items-center justify-between active:scale-98 transition-all min-h-[64px]"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-7 h-7" />
                    <span>Deel mijn thuisadres</span>
                  </div>
                  <span className="text-sm bg-teal-700/60 px-3 py-1 rounded-xl truncate max-w-[160px]">
                    {savedHomeAddress}
                  </span>
                </button>
              )}
            </div>

            {/* Duidelijke Annuleren knop */}
            <div className="pt-2 border-t-2 border-slate-100">
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-lg py-3.5 px-6 rounded-2xl border-2 border-slate-300 min-h-[52px]"
              >
                Annuleren
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: E-MAIL VERSTUREN VENSTER */}
      {/* ========================================================= */}
      {emailModalContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-blue-600 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl font-bold">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    E-mail versturen
                  </h3>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    Aan: {emailModalContact.name} ({emailModalContact.email})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEmailModalContact(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Onderwerp veld */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-800">
                Onderwerp:
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-base text-slate-900 font-bold focus:border-blue-600 outline-none"
              />
            </div>

            {/* Snelle onderwerp keuzes */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-slate-400 font-bold shrink-0">Snel:</span>
              <button
                onClick={() => setEmailSubject('Hulp nodig met mijn computer')}
                className="bg-slate-100 hover:bg-blue-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 font-medium"
              >
                Algemene hulp
              </button>
              <button
                onClick={() => setEmailSubject('Mijn internet of Wi-Fi werkt niet')}
                className="bg-slate-100 hover:bg-blue-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 font-medium"
              >
                Wi-Fi probleem
              </button>
              <button
                onClick={() => setEmailSubject('Printer print niet')}
                className="bg-slate-100 hover:bg-blue-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 font-medium"
              >
                Printer probleem
              </button>
            </div>

            {/* Berichttekst */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-800">
                Uw bericht:
              </label>
              <textarea
                rows={5}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-base text-slate-900 font-medium focus:border-blue-600 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Actieknoppen */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSendEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-3.5 px-6 rounded-2xl shadow-lg border-2 border-blue-400 flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[56px]"
              >
                <Send className="w-5 h-5" />
                <span>Verstuur e-mail direct</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(emailBody);
                  setEmailCopied(true);
                  setTimeout(() => setEmailCopied(false), 3000);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-3 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-1.5 min-h-[56px]"
              >
                {emailCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{emailCopied ? 'Gekopieerd!' : 'Kopieer tekst'}</span>
              </button>
            </div>

            <button
              onClick={() => setEmailModalContact(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3 rounded-2xl border-2 border-slate-300 min-h-[48px]"
            >
              Annuleren
            </button>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: WHATSAPP BEVESTIGINGSVENSTER */}
      {/* ========================================================= */}
      {whatsappModalContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-green-600 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black border-2 border-green-300">
                💬
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Contact via WhatsApp
              </h3>
              <p className="text-slate-600 text-base font-medium">
                Wilt u WhatsApp openen om een bericht te sturen naar <strong>{whatsappModalContact.name}</strong>?
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Bericht dat klaarstaat:
              </label>
              <textarea
                rows={3}
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                className="w-full p-3.5 bg-green-50 border-2 border-green-300 rounded-2xl text-base text-slate-900 font-medium focus:border-green-600 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleConfirmSendWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-xl py-4 px-6 rounded-2xl shadow-xl border-4 border-green-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
              >
                <MessageSquare className="w-7 h-7 stroke-[2.5]" />
                <span>Ja, open WhatsApp</span>
              </button>

              <button
                onClick={() => setWhatsappModalContact(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-slate-300 min-h-[52px]"
              >
                Annuleren
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: LOCATIE DELEN (GPS OF ADRES INVOEREN) */}
      {/* ========================================================= */}
      {locationPermissionContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-amber-500 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black border-2 border-amber-300">
                {locationMode === 'manual' ? '🏠' : '📍'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Locatie delen met {locationPermissionContact.name}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                Zo weet <strong>{locationPermissionContact.name}</strong> precies waar u bent om u te helpen.
              </p>
            </div>

            {/* TAB SELECTIE: GPS OF HANDMATIG ADRES */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setLocationMode('prompt');
                  setLocationError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  locationMode === 'prompt'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>GPS (Automatisch)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocationMode('manual');
                  setLocationError(null);
                  if (!manualAddress && savedHomeAddress) {
                    setManualAddress(savedHomeAddress);
                  }
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  locationMode === 'manual'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Adres (Werkt altijd)</span>
              </button>
            </div>

            {/* MODUS 1: GPS LOCATIE */}
            {locationMode === 'prompt' && (
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 text-xs sm:text-sm text-amber-900 font-medium">
                  🔒 <strong>Uw privacy:</strong> Uw locatie wordt <em>nooit automatisch gedeeld</em>. Alleen als u op de knop klikt, vraagt de browser uw GPS-locatie op.
                </div>

                <div className="space-y-3">
                  {savedHomeAddress && (
                    <button
                      type="button"
                      onClick={() => handleShareSavedHomeAddress(locationPermissionContact)}
                      className="w-full bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold text-base py-3 px-4 rounded-2xl border-2 border-teal-300 flex items-center justify-center gap-2 transition-all min-h-[52px]"
                    >
                      <Home className="w-5 h-5 text-teal-700" />
                      <span>Of deel direct opgeslagen thuisadres ({savedHomeAddress})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmLocationPermission}
                    disabled={isLocating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xl py-4 px-6 rounded-2xl shadow-xl border-4 border-emerald-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
                  >
                    {isLocating ? (
                      <>
                        <span className="animate-spin text-2xl">⏳</span>
                        <span>Locatie wordt opgehaald...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-7 h-7 stroke-[2.5]" />
                        <span>Ja, vraag mijn GPS-locatie op</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('manual');
                      setLocationError(null);
                      if (savedHomeAddress && !manualAddress) {
                        setManualAddress(savedHomeAddress);
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-base py-3 px-4 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 min-h-[50px] transition-all"
                  >
                    <Home className="w-5 h-5 text-amber-700" />
                    <span>Of kies direct uw adres / woonplaats (Werkt altijd)</span>
                  </button>
                </div>

                {/* BROWSERHANDLEIDING ACCORDION */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowBrowserGuide(!showBrowserGuide)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-200 flex items-center justify-between min-h-[44px]"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Hoe werkt locatietoestemming in Chrome of Edge?</span>
                    </div>
                    {showBrowserGuide ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {showBrowserGuide && (
                    <div className="mt-2.5 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 text-slate-800 text-xs sm:text-sm space-y-2.5 animate-in fade-in">
                      <p className="font-bold text-slate-900">
                        Als uw browser GPS blokkeert, kunt u dit zo aanzetten:
                      </p>
                      <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 font-medium">
                        <li>Kijk linksboven in de adresbalk van uw browser.</li>
                        <li>Klik op het <strong>slotje 🔒</strong> of <strong>instellingenicoon 🎛️</strong>.</li>
                        <li>Zet <strong>"Locatie"</strong> op <strong>"Toestaan"</strong>.</li>
                      </ol>
                      <button
                        type="button"
                        onClick={handleConfirmLocationPermission}
                        disabled={isLocating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-2.5 px-3 rounded-xl border border-blue-400 flex items-center justify-center gap-2 mt-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>🔄 Probeer GPS opnieuw</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODUS 2: HANDMATIG ADRES / THUISADRES INVOEREN (WERKT ALTIJD 100%) */}
            {locationMode === 'manual' && (
              <div className="space-y-4">
                {/* DIRECTE OPLOSSING MELDING INDIEN VAN TOEPASSING */}
                {locationError ? (
                  <div className="bg-emerald-50 border-2 border-emerald-400 p-3.5 sm:p-4 rounded-2xl flex items-start gap-3 text-emerald-950 font-medium text-xs sm:text-sm animate-in fade-in">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block">Directe oplossing actief:</span>
                      <p>{locationError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border-2 border-emerald-200 text-xs sm:text-sm text-emerald-900 font-medium">
                    💡 <strong>Werkt altijd:</strong> Typ hieronder uw straat + huisnummer, postcode of woonplaats. KijkHulp maakt hier direct een Google Maps link van.
                  </div>
                )}

                {/* Snelkoppeling naar Thuisadres */}
                {savedHomeAddress && (
                  <button
                    type="button"
                    onClick={() => handleShareSavedHomeAddress(locationPermissionContact)}
                    className="w-full bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-base py-3.5 px-4 rounded-2xl shadow-md border-2 border-teal-400 flex items-center justify-center gap-2.5 transition-all min-h-[54px]"
                  >
                    <Home className="w-5 h-5 text-teal-100" />
                    <span>🏠 Deel direct thuisadres: <strong>{savedHomeAddress}</strong></span>
                  </button>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-800">
                    {savedHomeAddress ? 'Of typ een ander adres, postcode of plaatsnaam:' : 'Straat + huisnummer, postcode of plaatsnaam:'}
                  </label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Bijv. Dorpsstraat 12, Utrecht of 1012 AB"
                    className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-base sm:text-lg text-slate-900 font-bold focus:border-emerald-600 outline-none"
                    autoFocus
                  />
                </div>

                {/* Snelle voorbeeldknoppen voor Nederlandse steden */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <span className="text-slate-400 font-bold shrink-0">Snel:</span>
                  {['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven', 'Groningen'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setManualAddress(city)}
                      className="bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 font-medium transition-all"
                    >
                      {city}
                    </button>
                  ))}
                </div>

                {/* Optie om direct als thuisadres op te slaan */}
                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAsHomeAddress}
                    onChange={(e) => setSaveAsHomeAddress(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Bewaar dit adres als mijn vaste thuisadres voor volgende keer</span>
                </label>

                {/* Grote Verzendknop */}
                <button
                  type="button"
                  onClick={() => handleShareManualAddress(locationPermissionContact, manualAddress)}
                  disabled={!manualAddress.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xl py-4 px-6 rounded-2xl shadow-xl border-4 border-emerald-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
                >
                  <MapPin className="w-6 h-6 stroke-[2.5]" />
                  <span>🗺️ Maak Google Maps link & Deel met {locationPermissionContact.name.split(' ')[0]}</span>
                </button>

                {/* Internet locatie knop */}
                <button
                  type="button"
                  onClick={() => handleFetchIpLocation(locationPermissionContact)}
                  disabled={isLocating}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-blue-200 flex items-center justify-center gap-2 transition-all min-h-[44px]"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>🌐 Of bepaal geschatte regio via internetverbinding</span>
                </button>
              </div>
            )}

            {/* ANNULEREN KNOP */}
            <div className="pt-2 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setLocationPermissionContact(null);
                  setLocationError(null);
                  setShowBrowserGuide(false);
                }}
                disabled={isLocating}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-slate-300 min-h-[52px]"
              >
                Annuleren
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: LOCATIE RESULTAAT & VERZEND OPTIES */}
      {/* ========================================================= */}
      {locationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-emerald-600 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black border-2 border-emerald-300">
                ✅
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Locatie succesvol bepaald!
              </h3>
              <p className="text-slate-600 text-base font-medium">
                Er is een veilige Google Maps link gemaakt voor <strong>{locationResult.contact.name}</strong>.
              </p>
            </div>

            {/* Locatie / Adres weergave */}
            {locationResult.addressText && (
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border-2 border-emerald-200 flex items-center gap-2.5 text-emerald-950 font-bold text-sm sm:text-base">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Locatie: <strong>{locationResult.addressText}</strong></span>
              </div>
            )}

            {/* Google Maps link preview card */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Google Maps Link:</span>
              </div>
              <a
                href={locationResult.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 font-bold text-sm break-all underline flex items-center gap-1"
              >
                <span>{locationResult.url}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            {/* Deel opties via WhatsApp of E-mail */}
            <div className="space-y-3">
              {locationResult.contact.phoneNumber && (
                <button
                  type="button"
                  onClick={() => {
                    const phoneNum = cleanPhoneForWhatsApp(locationResult.contact.phoneNumber);
                    const addrPart = locationResult.addressText ? ` (${locationResult.addressText})` : '';
                    const msg = `Hallo ${locationResult.contact.name}, dit is mijn huidige locatie${addrPart}: ${locationResult.url}`;
                    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-md border-2 border-green-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[58px]"
                >
                  <MessageSquare className="w-6 h-6 stroke-[2.5]" />
                  <span>Deel via WhatsApp met {locationResult.contact.name.split(' ')[0]}</span>
                </button>
              )}

              {locationResult.contact.email && (
                <button
                  type="button"
                  onClick={() => {
                    const subject = locationResult.addressText ? `Mijn locatie (${locationResult.addressText})` : 'Mijn huidige locatie';
                    const body = `Hallo ${locationResult.contact.name},\n\nDit is mijn huidige locatie op Google Maps:\n${locationResult.url}${locationResult.addressText ? `\nAdres/Plaats: ${locationResult.addressText}` : ''}\n\nGroeten!`;
                    window.location.href = `mailto:${encodeURIComponent(locationResult.contact.email || '')}?subject=${encodeURIComponent(
                      subject
                    )}&body=${encodeURIComponent(body)}`;
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-md border-2 border-blue-400 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[58px]"
                >
                  <Mail className="w-6 h-6 stroke-[2.5]" />
                  <span>Deel via E-mail met {locationResult.contact.name.split(' ')[0]}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(locationResult.url);
                  setLocationCopied(true);
                  setTimeout(() => setLocationCopied(false), 3000);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base py-3 px-6 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 min-h-[50px]"
              >
                {locationCopied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                <span>{locationCopied ? 'Link gekopieerd!' : 'Kopieer link'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLocationResult(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3 rounded-2xl border-2 border-slate-300 min-h-[48px]"
            >
              Sluiten
            </button>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: THUISADRES INSTELLEN OF WIJZIGEN */}
      {/* ========================================================= */}
      {isHomeAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleSaveHomeAddressSubmit}
            className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-teal-500 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-100 text-teal-800 rounded-2xl font-bold">
                  🏡
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Mijn vaste thuisadres
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Voor altijd snelle hulp zonder GPS-fouten
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHomeAddressModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-sm font-medium">
                Vul uw adres in (straat, huisnummer, postcode en woonplaats). Wanneer GPS in de browser niet werkt, kunt u dit adres altijd direct met één klik delen met uw familie.
              </p>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">
                  Uw adres of woonplaats:
                </label>
                <input
                  type="text"
                  required
                  value={homeAddressInput}
                  onChange={(e) => setHomeAddressInput(e.target.value)}
                  placeholder="Bijv. Kerkstraat 15, 3512 AB Utrecht"
                  className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-base sm:text-lg text-slate-900 focus:border-teal-600 outline-none font-bold"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t-2 border-slate-100">
              <button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg py-3.5 px-6 rounded-2xl shadow-lg border-2 border-teal-400 flex items-center justify-center gap-2 min-h-[56px]"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Opslaan</span>
              </button>

              {savedHomeAddress && (
                <button
                  type="button"
                  onClick={handleDeleteHomeAddress}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm px-4 py-3.5 rounded-2xl border-2 border-rose-300 min-h-[56px]"
                >
                  Verwijderen
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsHomeAddressModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-slate-300 min-h-[56px]"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CONTACT TOEVOEGEN / WIJZIGEN */}
      {/* ========================================================= */}
      {isAddOrEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleSaveContactForm}
            className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-lg p-5 sm:p-8 shadow-2xl border-4 border-emerald-500 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl font-bold">
                  👤
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {editingId ? 'Contactpersoon wijzigen' : 'Nieuw persoon toevoegen'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOrEditOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1">
                  Naam: *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Bijv. Ahmed, Karin of Henk"
                  className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-emerald-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-900 mb-1">
                  Wie is dit van u?
                </label>
                <select
                  value={formRelationship}
                  onChange={(e) => setFormRelationship(e.target.value)}
                  className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-emerald-600 outline-none bg-white font-medium"
                >
                  <option value="Zoon">Zoon</option>
                  <option value="Dochter">Dochter</option>
                  <option value="Kleinkind">Kleinkind</option>
                  <option value="Partner">Partner</option>
                  <option value="Buurman / Buurvrouw">Buurman / Buurvrouw</option>
                  <option value="Vriend / Vriendin">Vriend / Vriendin</option>
                  <option value="Vrijwilliger / Hulp">Vrijwilliger / Hulp</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-slate-900 mb-1">
                  Telefoonnummer (voor bellen & WhatsApp):
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Bijv. 06 12345678"
                  className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-emerald-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-900 mb-1">
                  E-mailadres:
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Bijv. ahmed@email.nl"
                  className="w-full p-3.5 border-2 border-slate-300 rounded-2xl text-lg text-slate-900 focus:border-emerald-600 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t-2 border-slate-100">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-3.5 px-6 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-center gap-2 min-h-[56px]"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Opslaan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddOrEditOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-slate-300 min-h-[56px]"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: VERWIJDEREN BEVESTIGING */}
      {/* ========================================================= */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[calc(100%-24px)] max-w-md p-5 sm:p-8 shadow-2xl border-4 border-rose-500 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
                🗑️
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Contactpersoon verwijderen?
              </h3>
              <p className="text-slate-600 text-base font-medium">
                Weet u zeker dat u <strong>{contactToDelete.name}</strong> wilt verwijderen uit uw vertrouwde personen?
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-lg py-3.5 px-6 rounded-2xl shadow-md border-2 border-rose-400 min-h-[52px]"
              >
                Ja, verwijderen
              </button>

              <button
                onClick={() => setContactToDelete(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base py-3 px-6 rounded-2xl border-2 border-slate-300 min-h-[48px]"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
