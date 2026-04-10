import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  expectedArrival: string;
  startTime: number;
  status: 'active' | 'safe' | 'alerted';
  date: string;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
  icon: string;
}

export interface EvidenceEntry {
  id: string;
  timestamp: string;
  type: 'Audio' | 'Video';
  duration: string;
  sosEvent: string;
}

export interface ScanRecord {
  id: string;
  location: string;
  result: 'safe' | 'alert';
  timestamp: string;
}

interface AppState {
  onboardingComplete: boolean;
  userName: string;
  contacts: Contact[];
  journeys: Journey[];
  activeJourney: Journey | null;
  activities: Activity[];
  evidence: EvidenceEntry[];
  scans: ScanRecord[];
  distressListenerOn: boolean;
  shakeToSOS: boolean;
  journeyAutoAlert: boolean;
  totalSOS: number;
  journeysCompleted: number;
  incidentsReported: number;
  setOnboardingComplete: (val: boolean) => void;
  setUserName: (name: string) => void;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  startJourney: (journey: Journey) => void;
  endJourney: (id: string, status: 'safe' | 'alerted') => void;
  addActivity: (activity: Activity) => void;
  addScan: (scan: ScanRecord) => void;
  setDistressListener: (val: boolean) => void;
  triggerSOS: () => void;
}

const defaultContacts: Contact[] = [
  { id: '1', name: 'Amma', phone: '+91 98765 43210', isPrimary: true, shareLocation: true },
  { id: '2', name: 'Rohan', phone: '+91 91234 56789', isPrimary: false, shareLocation: false },
  { id: '3', name: 'Neha', phone: '+91 87654 32109', isPrimary: false, shareLocation: false },
];

const defaultActivities: Activity[] = [
  { id: '1', text: 'SOS triggered', time: '2 days ago', icon: 'alert-circle' },
  { id: '2', text: 'Safe route used', time: 'Yesterday', icon: 'map' },
  { id: '3', text: 'Journey completed safely', time: '3 days ago', icon: 'check-circle' },
  { id: '4', text: 'Fake call triggered', time: '4 days ago', icon: 'phone' },
  { id: '5', text: 'Camera scan - all clear', time: '5 days ago', icon: 'camera' },
];

const defaultEvidence: EvidenceEntry[] = [
  { id: '1', timestamp: 'Apr 8, 2026 · 10:32 PM', type: 'Audio', duration: '2m 15s', sosEvent: 'SOS Event #003' },
  { id: '2', timestamp: 'Apr 6, 2026 · 8:17 PM', type: 'Video', duration: '0m 47s', sosEvent: 'SOS Event #002' },
  { id: '3', timestamp: 'Apr 3, 2026 · 11:02 PM', type: 'Audio', duration: '1m 30s', sosEvent: 'SOS Event #001' },
];

const defaultJourneys: Journey[] = [
  { id: 'p1', destination: 'Home from Office', expectedArrival: '8:00 PM', startTime: 0, status: 'safe', date: 'Apr 9, 2026' },
  { id: 'p2', destination: 'MG Road Metro', expectedArrival: '6:30 PM', startTime: 0, status: 'alerted', date: 'Apr 7, 2026' },
  { id: 'p3', destination: 'Phoenix Mall', expectedArrival: '9:00 PM', startTime: 0, status: 'safe', date: 'Apr 5, 2026' },
  { id: 'p4', destination: 'Friend\'s Place', expectedArrival: '10:00 PM', startTime: 0, status: 'safe', date: 'Apr 2, 2026' },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [userName, setUserNameState] = useState('Priya');
  const [contacts, setContactsState] = useState<Contact[]>(defaultContacts);
  const [journeys, setJourneys] = useState<Journey[]>(defaultJourneys);
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [activities, setActivities] = useState<Activity[]>(defaultActivities);
  const [evidence] = useState<EvidenceEntry[]>(defaultEvidence);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [distressListenerOn, setDistressListenerOn] = useState(false);
  const [shakeToSOS, setShakeToSOS] = useState(false);
  const [journeyAutoAlert, setJourneyAutoAlert] = useState(true);
  const [totalSOS, setTotalSOS] = useState(2);
  const [journeysCompleted, setJourneysCompleted] = useState(4);
  const [incidentsReported, setIncidentsReported] = useState(1);

  useEffect(() => {
    AsyncStorage.getItem('onboardingComplete').then(val => {
      if (val === 'true') setOnboardingCompleteState(true);
    });
    AsyncStorage.getItem('userName').then(val => {
      if (val) setUserNameState(val);
    });
  }, []);

  const setOnboardingComplete = (val: boolean) => {
    setOnboardingCompleteState(val);
    AsyncStorage.setItem('onboardingComplete', val ? 'true' : 'false');
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    AsyncStorage.setItem('userName', name);
  };

  const setContacts = (c: Contact[]) => setContactsState(c);

  const addContact = (contact: Contact) => {
    setContactsState(prev => [...prev, contact]);
  };

  const removeContact = (id: string) => {
    setContactsState(prev => prev.filter(c => c.id !== id));
  };

  const startJourney = (journey: Journey) => {
    setActiveJourney(journey);
    setJourneys(prev => [journey, ...prev]);
  };

  const endJourney = (id: string, status: 'safe' | 'alerted') => {
    setActiveJourney(null);
    setJourneys(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    if (status === 'safe') {
      setJourneysCompleted(prev => prev + 1);
      addActivity({ id: Date.now().toString(), text: 'Journey completed safely', time: 'Just now', icon: 'check-circle' });
    }
  };

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const addScan = (scan: ScanRecord) => {
    setScans(prev => [scan, ...prev.slice(0, 4)]);
  };

  const setDistressListener = (val: boolean) => setDistressListenerOn(val);

  const triggerSOS = () => {
    setTotalSOS(prev => prev + 1);
    addActivity({ id: Date.now().toString(), text: 'SOS triggered', time: 'Just now', icon: 'alert-circle' });
  };

  return (
    <AppContext.Provider value={{
      onboardingComplete, userName, contacts, journeys, activeJourney,
      activities, evidence, scans, distressListenerOn, shakeToSOS,
      journeyAutoAlert, totalSOS, journeysCompleted, incidentsReported,
      setOnboardingComplete, setUserName, setContacts, addContact, removeContact,
      startJourney, endJourney, addActivity, addScan, setDistressListener, triggerSOS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
