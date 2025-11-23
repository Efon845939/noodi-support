export type Channel = 'disaster' | 'personal';

export type NearbyConfig = {
  enabled: boolean;
  radiusKm: 50 | 100 | 250 | 500;
  window: '24h' | '3d' | '7d';
  categories: Array<'earthquake'|'fire'|'flood'|'landslide'|'storm'|'assault'|'robbery'|'abduction'|'other'>;
  minMagnitude?: '3.5+'|'4.0+'|'4.5+'|'5.0+';          // deprem için
  minSeverity?: 'low'|'medium'|'high';                 // kişisel olaylar için
  refreshMins: 15 | 30 | 60;
  autoOpenOnCritical: boolean;
};

export type Escalation = {
  repeat: boolean;
  repeatSec: 30|60|120;
  requireAcknowledge: boolean;
  escalateAt: 3; // 3. tekrarda
  notifyContacts: boolean;
};

export type Privacy = {
  lockscreenPreview: 'show'|'sender_only'|'hidden';
  persistentBanner: boolean;
  groupNotifications: boolean;
};

export type PersonalSettings = {
  sound: 'Alarm'|'Siren'|'Beep';
  vibrate: boolean;
  flash: boolean;
  tts: boolean;
  dnd: boolean;
  nearby: NearbyConfig;
  escalation: Escalation;
  privacy: Privacy;
};

export type DisasterSettings = {
  sound: 'Alarm'|'Siren'|'Beep';
  minMag: '3.5+'|'4.0+'|'4.5+'|'5.0+';
  maxDistanceKm: 50|100|250|500;
  repeat: boolean;
  repeatSec: 30|60|120;
  vibrate: boolean; flash: boolean; tts: boolean; dnd: boolean;
};

export type GeneralSettings = {
  locationOn: boolean;
  criticalTry: boolean;
  focusNearest: boolean;
  quietFrom?: string; quietTo?: string;
  batteryBypassAttempt: boolean;
};

export type AllSettings = {
  disaster: DisasterSettings;
  personal: PersonalSettings;
  general: GeneralSettings;
};

export const DEFAULT_SETTINGS: AllSettings = {
  disaster: { sound:'Alarm', minMag:'4.0+', maxDistanceKm:250, repeat:true, repeatSec:60, vibrate:true, flash:false, tts:true, dnd:true },
  personal: {
    sound:'Siren', vibrate:true, flash:false, tts:true, dnd:true,
    nearby: { enabled:true, radiusKm:100, window:'24h', categories:['earthquake','fire','flood','assault','robbery','other'], minMagnitude:'4.0+', minSeverity:'medium', refreshMins:30, autoOpenOnCritical:true },
    escalation: { repeat:true, repeatSec:60, requireAcknowledge:true, escalateAt:3, notifyContacts:true },
    privacy: { lockscreenPreview:'sender_only', persistentBanner:true, groupNotifications:true }
  },
  general: { locationOn:true, criticalTry:true, focusNearest:true, quietFrom:'00:00', quietTo:'06:00', batteryBypassAttempt:true }
};
