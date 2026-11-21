import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
  shareLocation: boolean;
}

export interface Journey {
  id: string;
  destination: string;
  /** Display string, e.g. "21:30". */
  expectedArrival: string;
  startTime: number;
  /** Epoch ms when the journey is due. */
  deadline: number;
  status: 'active' | 'safe' | 'alerted';
  date: string;
}

export interface Activity {
  id: string;
  text: string;
  /** Epoch ms. */
  at: number;
  icon: 'alert-circle' | 'map' | 'check-circle' | 'phone' | 'camera' | 'alert-triangle';
}

export interface ScanRecord {
  id: string;
  location: string;
  result: 'safe' | 'alert';
  timestamp: string;
}

interface PersistedState {
  userName: string;
  contacts: Contact[];
  journeys: Journey[];
  activeJourney: Journey | null;
  activities: Activity[];
  totalSOS: number;
  journeysCompleted: number;
  incidentsReported: number;
  shakeToSOS: boolean;
}

interface AppState extends PersistedState {
  hydrated: boolean;
  scans: ScanRecord[];
  distressListenerOn: boolean;
  setUserName: (name: string) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  setPrimaryContact: (id: string) => void;
  startJourney: (journey: Journey) => void;
  extendJourney: (minutes: number) => void;
  endJourney: (id: string, status: 'safe' | 'alerted') => void;
  logActivity: (text: string, icon: Activity['icon']) => void;
  addScan: (scan: ScanRecord) => void;
  setDistressListener: (val: boolean) => void;
  setShakeToSOS: (val: boolean) => void;
  recordSOS: (summary: string) => void;
  recordIncident: (type: string) => void;
  resetAll: () => Promise<void>;
}

const STORAGE_KEY = 'rakshak:state:v2';

const initialState: PersistedState = {
  userName: '',
  contacts: [],
  journeys: [],
  activeJourney: null,
  activities: [],
  totalSOS: 0,
  journeysCompleted: 0,
  incidentsReported: 0,
  shakeToSOS: true,
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [distressListenerOn, setDistressListenerOn] = useState(false);
  const skipFirstSave = useRef(true);

  // Load once. The legacy 'userName' key is what App.tsx uses to decide on onboarding.
  useEffect(() => {
    (async () => {
      try {
        const [raw, legacyName] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem('userName'),
        ]);
        const saved = raw ? (JSON.parse(raw) as Partial<PersistedState>) : {};
        setState(s => ({ ...s, ...saved, userName: saved.userName || legacyName || '' }));
      } catch {
        // Corrupt storage: start fresh rather than crash.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const update = useCallback((fn: (s: PersistedState) => Partial<PersistedState>) => {
    setState(s => ({ ...s, ...fn(s) }));
  }, []);

  const logActivity = useCallback((text: string, icon: Activity['icon']) => {
    update(s => ({ activities: [{ id: uid(), text, at: Date.now(), icon }, ...s.activities].slice(0, 30) }));
  }, [update]);

  const value: AppState = {
    ...state,
    hydrated,
    scans,
    distressListenerOn,
    setUserName: (name) => {
      update(() => ({ userName: name }));
      AsyncStorage.setItem('userName', name).catch(() => {});
    },
    addContact: (contact) => update(s => {
      const isFirst = s.contacts.length === 0;
      return { contacts: [...s.contacts, { ...contact, isPrimary: contact.isPrimary || isFirst }] };
    }),
    removeContact: (id) => update(s => {
      const rest = s.contacts.filter(c => c.id !== id);
      if (rest.length && !rest.some(c => c.isPrimary)) rest[0] = { ...rest[0], isPrimary: true };
      return { contacts: rest };
    }),
    setPrimaryContact: (id) => update(s => ({ contacts: s.contacts.map(c => ({ ...c, isPrimary: c.id === id })) })),
    startJourney: (journey) => update(s => ({ activeJourney: journey, journeys: [journey, ...s.journeys].slice(0, 20) })),
    extendJourney: (minutes) => update(s => {
      if (!s.activeJourney) return {};
      const deadline = Math.max(s.activeJourney.deadline, Date.now()) + minutes * 60_000;
      const expectedArrival = new Date(deadline).toTimeString().slice(0, 5);
      const activeJourney = { ...s.activeJourney, deadline, expectedArrival };
      return { activeJourney, journeys: s.journeys.map(j => (j.id === activeJourney.id ? activeJourney : j)) };
    }),
    endJourney: (id, status) => {
      update(s => ({
        activeJourney: null,
        journeys: s.journeys.map(j => (j.id === id ? { ...j, status } : j)),
        journeysCompleted: status === 'safe' ? s.journeysCompleted + 1 : s.journeysCompleted,
      }));
      logActivity(status === 'safe' ? 'Journey completed safely' : 'Journey overdue, SOS opened', status === 'safe' ? 'check-circle' : 'alert-circle');
    },
    logActivity,
    addScan: (scan) => setScans(prev => [scan, ...prev.slice(0, 4)]),
    setDistressListener: setDistressListenerOn,
    setShakeToSOS: (val) => update(() => ({ shakeToSOS: val })),
    recordSOS: (summary) => {
      update(s => ({ totalSOS: s.totalSOS + 1 }));
      logActivity(summary, 'alert-circle');
    },
    recordIncident: (type) => {
      update(s => ({ incidentsReported: s.incidentsReported + 1 }));
      logActivity(`Incident noted: ${type}`, 'alert-triangle');
    },
    resetAll: async () => {
      await AsyncStorage.multiRemove([STORAGE_KEY, 'userName', 'onboardingComplete']).catch(() => {});
      skipFirstSave.current = true;
      setState(initialState);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { uid };
