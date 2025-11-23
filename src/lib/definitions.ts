export type User = {
  id: string;
  name: string;
  email: string;
  ageRange: 'adult' | 'child' | 'senior';
  emergencyContacts: { name: string; phone: string }[];
  consent: {
    shareLocation: boolean;
    shareHealthInfo: boolean;
  };
  lastActive: Date;
  fcmTokens?: string[];
  isAdmin: boolean;
};

export type Report = {
  id: string;
  userId: string;
  type: 'Medical' | 'Fire' | 'Accident' | 'Natural Disaster' | 'Other';
  notes: string;
  peopleAffected: number;
  isInjury: boolean;
  location: { latitude: number; longitude: number };
  createdAt: Date;
  status: 'New' | 'In Progress' | 'Resolved';
};

export type Organization = {
  id: string;
  name: string;
  webhookUrl: string;
  secret: string; // For mock data, in real app use hash
};


// AI-related types
export type Intent =
  | 'REPORT_CREATE'
  | 'FIRST_AID_INFO'
  | 'STATUS_CHECK'
  | 'ESCALATE_EMERGENCY'
  | 'SMALL_TALK';

export type Entities = {
  category?: 'disaster' | 'personal';
  subtype?: string;
  symptoms?: string[];
  peopleCount?: number;
  injured?: boolean;
};

export type AiDecision = {
  intent: Intent;
  entities: Entities;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  nextSteps: string[];
};

export type AlertSettings = {
  sound: 'alarm'|'siren'|'beep';
  repeat: boolean;
  repeatIntervalSec: 30|60|120;
  vibrate: boolean;
  vibrationPattern: number[]; // ms: [200,200,600,...]
  flashStrobe: boolean;
  ttsGuidance: boolean;
  dndBypassAttempt: boolean;
};
export const DEFAULT_SETTINGS: AlertSettings = {
  sound: 'alarm',
  repeat: true,
  repeatIntervalSec: 60,
  vibrate: true,
  vibrationPattern: [200,200,600,200,600],
  flashStrobe: false,
  ttsGuidance: true,
  dndBypassAttempt: true
};
