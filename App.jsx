import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  QrCode, 
  Users, 
  Monitor, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Sparkles, 
  ChevronRight, 
  Trash2, 
  Smartphone, 
  Download,
  Settings,
  X,
  Plus,
  Check,
  Edit2,
  Palette,
  Megaphone,
  Radio,
  Sliders,
  Info,
  Lock,
  ExternalLink,
  Copy,
  Upload,
  Image,
  PauseCircle,
  PlayCircle,
  FileText,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Trash,
  Link2,
  Wifi,
  WifiOff
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "demo-api-key",
      authDomain: "demo-app.firebaseapp.com",
      projectId: "demo-app",
      storageBucket: "demo-app.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'workshop-queue-portal';

const COLOR_THEMES = [
  { id: 'indigo', name: 'Vibrant Indigo', primary: 'bg-indigo-600 hover:bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500', ring: 'ring-indigo-500/30', lightBg: 'bg-indigo-500/10' },
  { id: 'emerald', name: 'Fresh Emerald', primary: 'bg-emerald-600 hover:bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', ring: 'ring-emerald-500/30', lightBg: 'bg-emerald-500/10' },
  { id: 'cyan', name: 'Bright Cyan', primary: 'bg-cyan-600 hover:bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', ring: 'ring-cyan-500/30', lightBg: 'bg-cyan-500/10' },
  { id: 'amber', name: 'Warm Amber', primary: 'bg-amber-600 hover:bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', ring: 'ring-amber-500/30', lightBg: 'bg-amber-500/10' },
  { id: 'rose', name: 'Vivid Rose', primary: 'bg-rose-600 hover:bg-rose-500', text: 'text-rose-400', border: 'border-rose-500', ring: 'ring-rose-500/30', lightBg: 'bg-rose-500/10' },
  { id: 'purple', name: 'Electric Purple', primary: 'bg-purple-600 hover:bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', ring: 'ring-purple-500/30', lightBg: 'bg-purple-500/10' },
];

const DEFAULT_CONFIG = {
  customDomainUrl: '', 
  eventTitle: "Interactive Tech Workshops 2026",
  eventSubtitle: "Scan QR Code to join queue for any station",
  announcementMsg: "Please keep your digital ticket ready on your phone screen when approaching the counter.",
  footerNotice: "Present your ticket pass upon arrival.",
  theme: 'indigo',
  fontSize: 'normal',
  chimeSound: 'classic',
  chimeVolume: 0.8,
  chimeRepeat: 1,
  customQrImageUrl: '', 
  customQrMode: 'generated',
  minsPerPerson: 4,
  isQueueOpen: true,
  queueClosedMessage: "The queue is currently paused or closed for new entries. Please check back shortly!",
  requireContact: false,
  hideContactField: false,
  contactFieldLabel: "Mobile Number / Email",
  contactPlaceholder: "For direct alerts",
  nameFieldLabel: "Your Full Name",
  namePlaceholder: "e.g. Alex Morgan",
  stationSelectLabel: "Select Workshop Station",
  joinButtonText: "Get Spot in Queue",
  counterTitle: "Now Serving",
  upNextTitle: "Up Next in Line",
  ticketLabel: "Your Ticket Pass",
  callToActionText: "Please proceed to the workshop front counter immediately.",
  completedMessageText: "Thank you for attending! We hope you enjoyed the session.",
};

const DEFAULT_WORKSHOPS = [
  { id: 'A', name: '3D Printing & Modeling', prefix: 'A', color: 'bg-purple-500', border: 'border-purple-500', badge: 'bg-purple-500/20 text-purple-200 border-purple-400/40' },
  { id: 'B', name: 'Robotics & Hardware', prefix: 'B', color: 'bg-emerald-500', border: 'border-emerald-500', badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' },
  { id: 'C', name: 'AI & Web Development', prefix: 'C', color: 'bg-blue-500', border: 'border-blue-500', badge: 'bg-blue-500/20 text-blue-200 border-blue-400/40' },
];

const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      console.warn('Storage blocked by iframe restrictions:', e);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage clear blocked by iframe restrictions:', e);
    }
  }
};

function ReliableQRCode({ value, config, size = 160 }) {
  if (config.customQrMode === 'custom' && config.customQrImageUrl) {
    return (
      <div 
        style={{ width: `${size}px`, height: `${size}px` }} 
        className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden"
      >
        <img 
          src={config.customQrImageUrl} 
          alt="Scan QR Code" 
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
    );
  }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value || 'https://example.com')}&margin=10&color=0f172a&format=png`;

  return (
    <div 
      style={{ width: `${size}px`, height: `${size}px` }} 
      className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden"
    >
      <img 
        src={qrApiUrl} 
        alt="Scan QR Code to join queue" 
        className="w-full h-full object-contain rounded-xl"
      />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isAttendeeOnlyMode, setIsAttendeeOnlyMode] = useState(false);
  const [activeTab, setActiveTab] = useState('attendee');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMonitorKioskMode, setIsMonitorKioskMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'attendee' || (window.location.hash && window.location.hash.includes('attendee'))) {
          setIsAttendeeOnlyMode(true);
          setActiveTab('attendee');
        }
      }
    } catch (e) {
      console.warn("Could not read URL params inside iframe context:", e);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error (iframe fallback mode enabled):", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [workshops, setWorkshops] = useState(DEFAULT_WORKSHOPS);
  const [queue, setQueue] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [myTicketId, setMyTicketId] = useState(() => safeLocalStorage.getItem('my_workshop_ticket_id') || null);

  useEffect(() => {
    if (!user) return;

    const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...DEFAULT_CONFIG, ...docSnap.data() }));
      } else {
        setDoc(configDocRef, DEFAULT_CONFIG).catch(console.error);
      }
    }, (error) => console.error("Config sync error:", error));

    const workshopsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'workshops');
    const unsubWorkshops = onSnapshot(workshopsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setWorkshops(docSnap.data().items || DEFAULT_WORKSHOPS);
      } else {
        setDoc(workshopsDocRef, { items: DEFAULT_WORKSHOPS }).catch(console.error);
      }
    }, (error) => console.error("Workshops sync error:", error));

    const queueColRef = collection(db, 'artifacts', appId, 'public', 'data', 'queue');
    const unsubQueue = onSnapshot(queueColRef, (querySnap) => {
      const tickets = [];
      querySnap.forEach((doc) => {
        tickets.push({ id: doc.id, ...doc.data() });
      });
      tickets.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setQueue(tickets);
      setIsConnected(true);
    }, (error) => console.error("Queue sync error:", error));

    return () => {
      unsubConfig();
      unsubWorkshops();
      unsubQueue();
    };
  }, [user]);

  const updateCloudConfig = async (newConfig) => {
    setConfig(newConfig);
    if (!user) return;
    try {
      const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
      await setDoc(configDocRef, newConfig, { merge: true });
    } catch (e) {
      console.error("Failed to update config:", e);
    }
  };

  const updateCloudWorkshops = async (newWorkshops) => {
    setWorkshops(newWorkshops);
    if (!user) return;
    try {
      const workshopsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'workshops');
      await setDoc(workshopsDocRef, { items: newWorkshops });
    } catch (e) {
      console.error("Failed to update workshops:", e);
    }
  };

  const playChime = (soundType = config.chimeSound) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const vol = config.chimeVolume || 0.8;
      const repeats = config.chimeRepeat || 1;

      const triggerTone = (freq, startTime, duration, type = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      for (let rep = 0; rep < repeats; rep++) {
        const offset = rep * 0.8;
        if (soundType === 'classic') {
          triggerTone(659.25, offset, 0.4);
          triggerTone(880.00, offset + 0.25, 0.6);
        } else if (soundType === 'hitech') {
          triggerTone(523.25, offset, 0.15, 'square');
          triggerTone(659.25, offset + 0.12, 0.15, 'square');
          triggerTone(783.99, offset + 0.24, 0.3, 'square');
        } else if (soundType === 'sweep') {
          triggerTone(440, offset, 0.2);
          triggerTone(554.37, offset + 0.15, 0.2);
          triggerTone(659.25, offset + 0.3, 0.4);
        } else {
          triggerTone(987.77, offset, 0.6);
          triggerTone(1318.51, offset + 0.2, 0.8);
        }
      }
    } catch (e) {
      console.log('Audio play blocked or restricted', e);
    }
  };

  const handleCallTicket = async (id) => {
    if (!user) return;
    try {
      const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'queue', id);
      await updateDoc(ticketRef, { status: 'serving', calledAt: Date.now() });
      playChime();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteTicket = async (id) => {
    if (!user) return;
    try {
      const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'queue', id);
      await updateDoc(ticketRef, { status: 'completed' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkipTicket = async (id) => {
    if (!user) return;
    try {
      const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'queue', id);
      await updateDoc(ticketRef, { status: 'skipped' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequeueTicket = async (id) => {
    if (!user) return;
    try {
      const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'queue', id);
      await updateDoc(ticketRef, { status: 'waiting' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetQueue = async () => {
    if (window.confirm("Are you sure you want to reset the queue? This will clear all tickets for everyone.")) {
      if (!user) return;
      try {
        queue.forEach(async (t) => {
          const tRef = doc(db, 'artifacts', appId, 'public', 'data', 'queue', t.id);
          await deleteDoc(tRef);
        });
        safeLocalStorage.removeItem('my_workshop_ticket_id');
        setMyTicketId(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCreateTicket = async (name, email, workshopId) => {
    const workshop = workshops.find(w => w.id === workshopId) || workshops[0];
    const prefix = workshop.prefix || workshop.id;
    const countForWorkshop = queue.filter(q => q.workshopId === workshopId).length + 1;
    const numberStr = `${prefix}-${String(countForWorkshop).padStart(3, '0')}`;
    
    const ticketId = `ticket-${Date.now()}`;
    const newTicket = {
      number: numberStr,
      name: name || 'Attendee',
      email: email || '',
      workshopId,
      status: 'waiting',
      createdAt: Date.now()
    };

    setMyTicketId(ticketId);
    safeLocalStorage.setItem('my_workshop_ticket_id', ticketId);

    if (user) {
      try {
        const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'queue', ticketId);
        await setDoc(ticketRef, newTicket);
      } catch (e) {
        console.error("Error creating ticket:", e);
      }
    }

    return { id: ticketId, ...newTicket };
  };

  const exportCSV = () => {
    const headers = ["Ticket Number", "Name", "Email/Contact", "Workshop Booth", "Status", "Joined At"];
    const rows = queue.map(t => {
      const ws = workshops.find(w => w.id === t.workshopId);
      return [
        t.number,
        `"${t.name}"`,
        `"${t.email || ''}"`,
        `"${ws ? ws.name : t.workshopId}"`,
        t.status,
        new Date(t.createdAt).toLocaleString()
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `queue_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeTheme = COLOR_THEMES.find(t => t.id === config.theme) || COLOR_THEMES[0];

  const getAttendeeOnlyUrl = () => {
    let target = '';
    
    if (config.customDomainUrl && config.customDomainUrl.trim() !== '') {
      target = config.customDomainUrl.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = `https://${target}`;
      }
    } else if (typeof window !== 'undefined') {
      try {
        target = window.location.href;
      } catch (e) {
        target = 'https://example.com';
      }
    }

    try {
      const u = new URL(target);
      u.searchParams.set('mode', 'attendee');
      return u.toString();
    } catch (e) {
      const cleanTarget = target.split('?')[0];
      return `${cleanTarget}?mode=attendee`;
    }
  };

  const attendeeUrl = getAttendeeOnlyUrl();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {(!isAttendeeOnlyMode && (!isMonitorKioskMode || activeTab !== 'monitor')) && (
        <header className="bg-slate-800/95 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40 px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${activeTheme.primary} flex items-center justify-center shadow-lg transition-colors`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base md:text-lg leading-tight text-white flex items-center gap-2">
                  {config.eventTitle}
                </h1>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <span>{config.eventSubtitle}</span>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Wifi className="w-3 h-3" /> Live Cloud Sync
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <WifiOff className="w-3 h-3" /> Connecting...
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-700 shadow-inner">
              <button
                onClick={() => setActiveTab('attendee')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'attendee'
                    ? `${activeTheme.primary} text-white shadow-md`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Attendee Join</span>
              </button>

              <button
                onClick={() => setActiveTab('monitor')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'monitor'
                    ? `${activeTheme.primary} text-white shadow-md`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Counter Monitor</span>
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'staff'
                    ? `${activeTheme.primary} text-white shadow-md`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Staff Admin</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl border border-slate-600 text-xs font-semibold transition-all shadow-sm"
                title="All Controls & Settings"
              >
                <Settings className="w-4 h-4 text-indigo-300" />
                <span className="hidden md:inline">Full Settings</span>
              </button>

              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playChime();
                }}
                className={`p-2 rounded-xl border transition-all ${
                  soundEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
                title={soundEnabled ? "Audio Mute Toggle" : "Unmute"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl w-full mx-auto">
        {(activeTab === 'attendee' || isAttendeeOnlyMode) && (
          <AttendeeView 
            queue={queue} 
            workshops={workshops}
            myTicketId={myTicketId} 
            setMyTicketId={setMyTicketId} 
            onCreateTicket={handleCreateTicket} 
            playChime={playChime}
            config={config}
            activeTheme={activeTheme}
          />
        )}

        {!isAttendeeOnlyMode && activeTab === 'monitor' && (
          <MonitorView 
            queue={queue} 
            workshops={workshops} 
            config={config}
            activeTheme={activeTheme}
            attendeeUrl={attendeeUrl}
            isKiosk={isMonitorKioskMode}
            setIsKiosk={setIsMonitorKioskMode}
          />
        )}

        {!isAttendeeOnlyMode && activeTab === 'staff' && (
          <StaffView 
            queue={queue} 
            workshops={workshops}
            config={config}
            updateCloudConfig={updateCloudConfig}
            onCall={handleCallTicket} 
            onComplete={handleCompleteTicket} 
            onSkip={handleSkipTicket} 
            onRequeue={handleRequeueTicket} 
            onCreate={handleCreateTicket}
            onReset={handleResetQueue}
            onExportCSV={exportCSV}
            activeTheme={activeTheme}
          />
        )}
      </main>

      {!isAttendeeOnlyMode && (
        <SettingsDrawer 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          updateCloudConfig={updateCloudConfig}
          workshops={workshops}
          updateCloudWorkshops={updateCloudWorkshops}
          queue={queue}
          onTestSound={(type) => playChime(type)}
          activeTheme={activeTheme}
          attendeeUrl={attendeeUrl}
        />
      )}
    </div>
  );
}

function AttendeeView({ queue, workshops, myTicketId, setMyTicketId, onCreateTicket, playChime, config, activeTheme }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState(workshops[0]?.id || 'A');

  const myTicket = queue.find(q => q.id === myTicketId);

  useEffect(() => {
    if (myTicket && myTicket.status === 'serving') {
      playChime();
    }
  }, [myTicket?.status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateTicket(name, email, selectedWorkshop);
  };

  const handleCancelTicket = () => {
    setMyTicketId(null);
    safeLocalStorage.removeItem('my_workshop_ticket_id');
  };

  let peopleAhead = 0;
  let estimatedWaitMins = 0;
  if (myTicket && myTicket.status === 'waiting') {
    const waitingTickets = queue.filter(q => q.status === 'waiting' || q.status === 'serving');
    const myIndex = waitingTickets.findIndex(q => q.id === myTicket.id);
    peopleAhead = Math.max(0, myIndex);
    estimatedWaitMins = (peopleAhead + 1) * (config.minsPerPerson || 4);
  }

  const myWorkshop = myTicket ? workshops.find(w => w.id === myTicket.workshopId) : null;

  return (
    <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center py-4">
      {!myTicket ? (
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className={`w-14 h-14 bg-slate-900 ${activeTheme.text} rounded-2xl flex items-center justify-center mx-auto border border-slate-700 shadow-md`}>
              <QrCode className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white">Join Virtual Queue</h2>
            <p className="text-xs text-slate-300">{config.eventSubtitle}</p>
          </div>

          {!config.isQueueOpen ? (
            <div className="bg-amber-500/20 border border-amber-500/40 p-5 rounded-2xl text-center space-y-3">
              <PauseCircle className="w-9 h-9 text-amber-400 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider">Queue Currently Paused</h3>
              <p className="text-xs text-slate-200 leading-relaxed">{config.queueClosedMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  {config.nameFieldLabel || "Your Full Name"} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={config.namePlaceholder || "e.g. Alex Morgan"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                />
              </div>

              {!config.hideContactField && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    {config.contactFieldLabel || "Mobile / Email"} {config.requireContact ? <span className="text-rose-400">*</span> : <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>}
                  </label>
                  <input
                    type="text"
                    required={config.requireContact}
                    placeholder={config.contactPlaceholder || "For direct alerts"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  {config.stationSelectLabel || "Select Workshop Station"}
                </label>
                <div className="space-y-2.5">
                  {workshops.map((ws) => (
                    <label
                      key={ws.id}
                      onClick={() => setSelectedWorkshop(ws.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedWorkshop === ws.id
                          ? `${ws.border} bg-slate-900 shadow-md ring-2 ring-indigo-500/30`
                          : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-3.5 h-3.5 rounded-full ${ws.color}`} />
                        <span className="text-xs font-bold text-slate-100">{ws.name}</span>
                      </div>
                      {selectedWorkshop === ws.id && (
                        <Check className={`w-4 h-4 ${activeTheme.text}`} />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full ${activeTheme.primary} text-white font-bold py-4 px-4 rounded-xl shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-sm`}
              >
                <span>{config.joinButtonText || "Get Spot in Queue"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="flex items-center gap-2.5 p-3.5 bg-slate-900 rounded-xl border border-slate-700/80 text-slate-300 text-xs">
            <Info className={`w-4 h-4 ${activeTheme.text} flex-shrink-0`} />
            <span>Keep this screen open. The main counter display will alert you when your number is called.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`bg-slate-800 border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all ${
            myTicket.status === 'serving'
              ? 'border-emerald-400 ring-4 ring-emerald-500/30 bg-slate-800'
              : 'border-slate-700'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${myWorkshop?.badge || 'bg-slate-700 text-slate-200'}`}>
                {myWorkshop?.name || 'Workshop Station'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(myTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {myTicket.status === 'serving' && (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-4 text-center mb-6 animate-bounce">
                <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm mb-1">
                  <Bell className="w-4 h-4 animate-spin" />
                  <span>NOW SERVING YOU!</span>
                </div>
                <p className="text-xs text-emerald-100 font-medium">
                  {config.callToActionText || "Please proceed to the workshop front counter immediately."}
                </p>
              </div>
            )}

            {myTicket.status === 'completed' && (
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Session Completed</span>
                </div>
                <p className="text-xs text-slate-300">
                  {config.completedMessageText || "Thank you for attending! We hope you enjoyed the session."}
                </p>
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{config.ticketLabel || "Your Ticket Pass"}</p>
              <p className="text-6xl md:text-7xl font-black tracking-tight text-white font-mono my-2 drop-shadow-md">
                {myTicket.number}
              </p>
              <h3 className="text-xl font-bold text-slate-200">{myTicket.name}</h3>
            </div>

            {myTicket.status === 'waiting' && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700">
                <div className="bg-slate-900 p-3.5 rounded-2xl text-center border border-slate-700/80 shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">People Ahead</span>
                  <div className="flex items-center justify-center gap-1">
                    <Users className={`w-4 h-4 ${activeTheme.text}`} />
                    <span className="text-xl font-black text-white">{peopleAhead}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-2xl text-center border border-slate-700/80 shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Est. Wait</span>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xl font-black text-white">~{estimatedWaitMins}m</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  myTicket.status === 'serving' ? 'bg-emerald-400 animate-ping' :
                  myTicket.status === 'waiting' ? 'bg-amber-400' : 'bg-slate-500'
                }`} />
                <span className="capitalize font-bold text-slate-200">{myTicket.status}</span>
              </div>
              <button
                onClick={handleCancelTicket}
                className="text-slate-400 hover:text-rose-300 text-xs transition-colors underline"
              >
                Get New Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonitorView({ queue, workshops, config, activeTheme, attendeeUrl, isKiosk, setIsKiosk }) {
  const [copied, setCopied] = useState(false);
  const servingTickets = queue.filter(q => q.status === 'serving');
  const upcomingTickets = queue.filter(q => q.status === 'waiting').slice(0, 6);

  const isLarge = config.fontSize === 'large';
  const isXLarge = config.fontSize === 'xlarge';

  const copyUrl = () => {
    navigator.clipboard.writeText(attendeeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-5 py-2">
      <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Monitor className={`w-4 h-4 ${activeTheme.text}`} />
          <span>Counter Monitor Display Mode</span>
        </div>
        <button
          onClick={() => setIsKiosk(!isKiosk)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all border border-slate-600"
        >
          {isKiosk ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-300" />}
          <span>{isKiosk ? 'Exit Full Screen Kiosk' : 'Enter Full Screen Display (Hide Nav)'}</span>
        </button>
      </div>

      {config.announcementMsg && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 flex items-center gap-3 text-xs md:text-sm text-slate-200 shadow-lg">
          <Megaphone className={`w-5 h-5 ${activeTheme.text} flex-shrink-0 animate-bounce`} />
          <p className="font-semibold">{config.announcementMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
                {config.counterTitle || "Now Serving"}
              </h2>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold border border-emerald-500/40">
              Live Counter
            </span>
          </div>

          {servingTickets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 my-auto">
              {servingTickets.map((ticket) => {
                const workshop = workshops.find(w => w.id === ticket.workshopId);
                return (
                  <div 
                    key={ticket.id} 
                    className="bg-slate-900 border-4 border-emerald-400 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse"
                  >
                    <div className="text-center md:text-left space-y-2">
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${workshop?.badge || 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'}`}>
                        {workshop?.name || 'Workshop Station'}
                      </span>
                      <h3 className={`${isXLarge ? 'text-5xl md:text-6xl' : isLarge ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'} font-black text-white`}>
                        {ticket.name}
                      </h3>
                      <p className="text-xs text-emerald-400 font-bold flex items-center justify-center md:justify-start gap-1">
                        <Sparkles className="w-4 h-4" /> Please proceed to counter
                      </p>
                    </div>

                    <div className="bg-emerald-500/20 border border-emerald-400/40 px-8 py-5 rounded-2xl text-center shadow-inner">
                      <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-black block">Ticket Pass</span>
                      <span className={`${isXLarge ? 'text-7xl md:text-8xl' : isLarge ? 'text-6xl md:text-7xl' : 'text-5xl md:text-6xl'} font-black text-emerald-300 font-mono tracking-tight drop-shadow-md`}>
                        {ticket.number}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="my-auto py-16 text-center space-y-3">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500 border border-slate-700">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-300">Front Counter Ready</h3>
              <p className="text-sm text-slate-400">Waiting for staff to call next attendee...</p>
            </div>
          )}

          <div className="pt-6 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300">
            <span className="font-medium">{config.footerNotice || "Present your ticket pass upon arrival."}</span>
            <span className="font-mono font-bold text-indigo-300">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex-1 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${activeTheme.text}`} /> {config.upNextTitle || "Up Next in Line"}
                </h3>
                <span className="text-xs font-mono font-bold text-white bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                  {upcomingTickets.length} Waiting
                </span>
              </div>

              {upcomingTickets.length > 0 ? (
                <div className="space-y-2.5">
                  {upcomingTickets.map((ticket, index) => {
                    const ws = workshops.find(w => w.id === ticket.workshopId);
                    return (
                      <div
                        key={ticket.id}
                        className="bg-slate-900 border border-slate-700/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0 border border-slate-700">
                            {index + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-100 truncate">{ticket.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{ws?.name || 'Station'}</p>
                          </div>
                        </div>

                        <span className={`font-mono font-bold text-xs ${activeTheme.text} bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 flex-shrink-0`}>
                          {ticket.number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No queue waiting</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 bg-slate-900 p-4 rounded-2xl border border-slate-700/90 flex flex-col sm:flex-row items-center gap-4 shadow-inner">
              <div className="flex-shrink-0">
                <ReliableQRCode value={attendeeUrl} config={config} size={110} />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                    <span>Scan to Join Queue</span>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 truncate" title={attendeeUrl}>
                    Attendee Link: <span className="text-indigo-300 font-mono">{attendeeUrl}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={copyUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Attendee Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffView({ queue, workshops, config, updateCloudConfig, onCall, onComplete, onSkip, onRequeue, onCreate, onReset, onExportCSV, activeTheme }) {
  const [filterWorkshop, setFilterWorkshop] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualWorkshop, setManualWorkshop] = useState(workshops[0]?.id || 'A');

  const totalServed = queue.filter(q => q.status === 'completed').length;
  const currentlyServing = queue.filter(q => q.status === 'serving').length;
  const waitingCount = queue.filter(q => q.status === 'waiting').length;

  const filteredQueue = queue.filter(q => {
    if (filterWorkshop === 'ALL') return true;
    return q.workshopId === filterWorkshop;
  });

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    onCreate(manualName, 'Walk-in', manualWorkshop);
    setManualName('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-300 font-semibold">Waiting in Queue</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{waitingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-300 font-semibold">Currently Called</p>
            <p className="text-3xl font-black text-indigo-400 mt-1">{currentlyServing}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-300 font-semibold">Completed Sessions</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{totalServed}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-300 font-semibold">Queue Status</p>
            <button
              onClick={() => updateCloudConfig({ ...config, isQueueOpen: !config.isQueueOpen })}
              className={`text-xs font-bold mt-1 px-3 py-1.5 rounded-full flex items-center gap-1 border transition-all ${
                config.isQueueOpen 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {config.isQueueOpen ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
              <span>{config.isQueueOpen ? 'OPEN FOR ENTRIES' : 'PAUSED / CLOSED'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterWorkshop('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterWorkshop === 'ALL'
                ? 'bg-slate-900 text-white border border-slate-600'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Stations ({queue.length})
          </button>
          {workshops.map(ws => {
            const count = queue.filter(q => q.workshopId === ws.id).length;
            return (
              <button
                key={ws.id}
                onClick={() => setFilterWorkshop(ws.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  filterWorkshop === ws.id
                    ? `${activeTheme.primary} text-white shadow-md`
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${ws.color}`} />
                <span>{ws.name} ({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 ${activeTheme.primary} text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Walk-in Ticket</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            title="Download CSV Queue Log"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Queue</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700 text-slate-300 text-[11px] uppercase tracking-wider font-bold">
                <th className="p-4">Ticket</th>
                <th className="p-4">Attendee Name</th>
                <th className="p-4">Workshop Booth</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs">
              {filteredQueue.length > 0 ? (
                filteredQueue.map((ticket) => {
                  const ws = workshops.find(w => w.id === ticket.workshopId);
                  return (
                    <tr 
                      key={ticket.id} 
                      className={`hover:bg-slate-700/40 transition-colors ${
                        ticket.status === 'serving' ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-white text-sm">
                        {ticket.number}
                      </td>

                      <td className="p-4 font-bold text-slate-100">
                        {ticket.name}
                        {ticket.email && (
                          <span className="block text-[10px] text-slate-400 font-normal">{ticket.email}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${ws?.badge || 'bg-slate-700 text-slate-200'}`}>
                          <span className={`w-2 h-2 rounded-full ${ws?.color || 'bg-slate-400'}`} />
                          {ws?.name || ticket.workshopId}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ticket.status === 'serving' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse' :
                          ticket.status === 'waiting' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                          ticket.status === 'completed' ? 'bg-slate-700 text-slate-300' :
                          'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {ticket.status === 'waiting' && (
                          <button
                            onClick={() => onCall(ticket.id)}
                            className={`${activeTheme.primary} text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition-all`}
                          >
                            Call Ticket
                          </button>
                        )}

                        {ticket.status === 'serving' && (
                          <button
                            onClick={() => onComplete(ticket.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition-all inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}

                        {ticket.status !== 'completed' && (
                          <button
                            onClick={() => onSkip(ticket.id)}
                            className="text-slate-400 hover:text-rose-300 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Skip
                          </button>
                        )}

                        {(ticket.status === 'completed' || ticket.status === 'skipped') && (
                          <button
                            onClick={() => onRequeue(ticket.id)}
                            className="text-slate-400 hover:text-indigo-300 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Re-queue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No tickets found in live queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Issue Walk-In Queue Ticket</h3>
            
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attendee Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Workshop Station</label>
                <select
                  value={manualWorkshop}
                  onChange={(e) => setManualWorkshop(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                >
                  {workshops.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${activeTheme.primary} text-white px-4 py-2 rounded-xl text-xs font-bold shadow`}
                >
                  Issue Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsDrawer({ isOpen, onClose, config, updateCloudConfig, workshops, updateCloudWorkshops, queue, onTestSound, activeTheme, attendeeUrl }) {
  const [newWsName, setNewWsName] = useState('');
  const [newWsPrefix, setNewWsPrefix] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('qr');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAddWorkshop = (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const nextId = String.fromCharCode(65 + workshops.length);
    const colors = ['bg-purple-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    const chosenColor = colors[workshops.length % colors.length];

    const newWs = {
      id: `WS-${Date.now()}`,
      name: newWsName,
      prefix: newWsPrefix.trim() || nextId,
      color: chosenColor,
      border: `border-${chosenColor.replace('bg-', '')}`,
      badge: `${chosenColor}/20 text-slate-100 border-${chosenColor.replace('bg-', '')}/40`
    };

    updateCloudWorkshops([...workshops, newWs]);
    setNewWsName('');
    setNewWsPrefix('');
  };

  const handleDeleteWorkshop = (id) => {
    if (workshops.length <= 1) return;
    updateCloudWorkshops(workshops.filter(w => w.id !== id));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCloudConfig({
          ...config,
          customQrImageUrl: reader.result,
          customQrMode: 'custom'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(attendeeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end">
      <div className="bg-slate-900 border-l border-slate-700 w-full max-w-2xl h-full flex flex-col p-6 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className={`w-5 h-5 ${activeTheme.text}`} />
            <div>
              <h2 className="text-lg font-bold text-white">Full Event & Portal Customizer</h2>
              <p className="text-xs text-slate-300">Control live links, titles, fields, audio, and design</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-slate-700 shrink-0">
          {[
            { id: 'qr', label: 'QR & Link Settings', icon: QrCode },
            { id: 'general', label: 'Titles & Text', icon: Edit2 },
            { id: 'form', label: 'Attendee Form', icon: FileText },
            { id: 'stations', label: 'Booths/Stations', icon: Users },
            { id: 'theme', label: 'Theme & Font', icon: Palette },
            { id: 'audio', label: 'Audio Chime', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeSettingsTab === tab.id
                    ? `${activeTheme.primary} text-white shadow-md`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {activeSettingsTab === 'qr' && (
            <div className="space-y-6">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-400" /> Public Attendee Link
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Custom Hosting Domain / External Website (Optional Override)</label>
                  <input
                    type="text"
                    placeholder="https://your-custom-site.com"
                    value={config.customDomainUrl || ''}
                    onChange={(e) => updateCloudConfig({ ...config, customDomainUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to use automatic live link detection.</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between gap-2 shadow-inner">
                  <div className="truncate min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Attendee-Only QR Code Link Target</span>
                    <span className="text-xs text-slate-100 font-mono truncate block">{attendeeUrl}</span>
                  </div>
                  <button
                    onClick={copyUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 border border-slate-600"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Public Link'}</span>
                  </button>
                </div>
              </div>

              {config.customQrMode === 'custom' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-slate-950 rounded-2xl border border-slate-700 p-2 flex items-center justify-center shrink-0">
                      {config.customQrImageUrl ? (
                        <img src={config.customQrImageUrl} alt="Custom QR" className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Image className="w-8 h-8 text-slate-500" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Custom QR Image</span>
                      </button>

                      <input
                        type="text"
                        placeholder="Or paste Image URL (http://...)"
                        value={config.customQrImageUrl}
                        onChange={(e) => updateCloudConfig({ ...config, customQrImageUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
                  <ReliableQRCode value={attendeeUrl} config={{ customQrMode: 'generated' }} size={90} />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-slate-100">Live Scannable QR Code Active</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Scanners will be directed straight to the public Attendee Join view.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSettingsTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" /> Headlines & Branding
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Header Title</label>
                  <input
                    type="text"
                    value={config.eventTitle}
                    onChange={(e) => updateCloudConfig({ ...config, eventTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={config.eventSubtitle}
                    onChange={(e) => updateCloudConfig({ ...config, eventSubtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monitor "Now Serving" Title</label>
                  <input
                    type="text"
                    value={config.counterTitle}
                    onChange={(e) => updateCloudConfig({ ...config, counterTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monitor "Up Next" Title</label>
                  <input
                    type="text"
                    value={config.upNextTitle}
                    onChange={(e) => updateCloudConfig({ ...config, upNextTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Ticker Banner</label>
                <textarea
                  rows={2}
                  value={config.announcementMsg}
                  onChange={(e) => updateCloudConfig({ ...config, announcementMsg: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monitor Footer Notice Text</label>
                <input
                  type="text"
                  value={config.footerNotice}
                  onChange={(e) => updateCloudConfig({ ...config, footerNotice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeSettingsTab === 'form' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Attendee Join Form Fields
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Name Field Label</label>
                  <input
                    type="text"
                    value={config.nameFieldLabel}
                    onChange={(e) => updateCloudConfig({ ...config, nameFieldLabel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Name Input Placeholder</label>
                  <input
                    type="text"
                    value={config.namePlaceholder}
                    onChange={(e) => updateCloudConfig({ ...config, namePlaceholder: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Field Label</label>
                  <input
                    type="text"
                    value={config.contactFieldLabel}
                    onChange={(e) => updateCloudConfig({ ...config, contactFieldLabel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Input Placeholder</label>
                  <input
                    type="text"
                    value={config.contactPlaceholder}
                    onChange={(e) => updateCloudConfig({ ...config, contactPlaceholder: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-700">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireContact}
                    onChange={(e) => updateCloudConfig({ ...config, requireContact: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
                  />
                  <span>Require Contact Field</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.hideContactField}
                    onChange={(e) => updateCloudConfig({ ...config, hideContactField: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
                  />
                  <span>Hide Contact Field Entirely</span>
                </label>
              </div>
            </div>
          )}

          {activeSettingsTab === 'stations' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Workshop Counters & Booths
              </h3>

              <div className="space-y-2">
                {workshops.map((ws) => (
                  <div key={ws.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-700 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-3.5 h-3.5 rounded-full ${ws.color}`} />
                      <div>
                        <p className="font-semibold text-white">{ws.name}</p>
                        <p className="text-[10px] text-slate-400">Prefix: <span className="font-mono text-slate-200">{ws.prefix}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkshop(ws.id)}
                      className="text-slate-400 hover:text-rose-300 p-1.5 transition-colors"
                      title="Delete Station"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddWorkshop} className="bg-slate-950/60 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <p className="text-[11px] font-semibold text-slate-200">Add New Workshop Booth</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Station Name"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Prefix (e.g. D)"
                    value={newWsPrefix}
                    onChange={(e) => setNewWsPrefix(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-1.5 rounded-lg border border-slate-600 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Station</span>
                </button>
              </form>
            </div>
          )}

          {activeSettingsTab === 'theme' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" /> Color Accent Theme
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => updateCloudConfig({ ...config, theme: th.id })}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        config.theme === th.id
                          ? `${th.border} bg-slate-800 text-white shadow-md`
                          : 'border-slate-700 bg-slate-950 text-slate-300'
                      }`}
                    >
                      <span>{th.name}</span>
                      {config.theme === th.id && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-700 pt-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Monitor Screen Font Size
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Standard' },
                    { id: 'large', label: 'Large' },
                    { id: 'xlarge', label: 'Extra Large' },
                  ].map((fz) => (
                    <button
                      key={fz.id}
                      onClick={() => updateCloudConfig({ ...config, fontSize: fz.id })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        config.fontSize === fz.id
                          ? 'border-indigo-400 bg-indigo-600/30 text-indigo-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300'
                      }`}
                    >
                      {fz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'audio' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" /> Calling Sound & Volume
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'classic', label: 'Classic Dual Tone' },
                  { id: 'hitech', label: 'Hi-Tech Digital Beep' },
                  { id: 'sweep', label: 'Chime Sweep' },
                  { id: 'bell', label: 'Crystal Bell' },
                ].map((sound) => (
                  <div key={sound.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs">
                    <span className="font-semibold text-slate-200">{sound.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTestSound(sound.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px]"
                      >
                        Test Sound
                      </button>
                      <button
                        onClick={() => updateCloudConfig({ ...config, chimeSound: sound.id })}
                        className={`p-1 rounded-lg ${config.chimeSound === sound.id ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="pt-4 border-t border-slate-700 mt-4">
          <button
            onClick={onClose}
            className={`w-full ${activeTheme.primary} text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg`}
          >
            Save & Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
