import type { Report, User, Organization } from './definitions';

export const mockUser: User = {
  id: '1',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  ageRange: 'adult',
  emergencyContacts: [{ name: 'John Doe', phone: '123-456-7890' }],
  consent: {
    shareLocation: true,
    shareHealthInfo: false,
  },
  lastActive: new Date(),
  isAdmin: true,
};

export const mockReports: Report[] = [
  {
    id: 'rep1',
    userId: '1',
    type: 'Medical',
    notes: 'Person collapsed, difficulty breathing.',
    peopleAffected: 1,
    isInjury: true,
    location: { latitude: 34.0522, longitude: -118.2437 },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    status: 'In Progress',
  },
  {
    id: 'rep2',
    userId: '1',
    type: 'Fire',
    notes: 'Small kitchen fire, smoke visible.',
    peopleAffected: 2,
    isInjury: false,
    location: { latitude: 34.053, longitude: -118.244 },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'Resolved',
  },
  {
    id: 'rep3',
    userId: '1',
    type: 'Accident',
    notes: 'Minor traffic collision, no injuries reported.',
    peopleAffected: 3,
    isInjury: false,
    location: { latitude: 34.058, longitude: -118.25 },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'Resolved',
  },
];

export let mockOrganizations: Organization[] = [
    { id: 'org1', name: 'City Fire Department', webhookUrl: 'https://example.com/webhook/fire', secret: 'secret-fire-key-long' },
    { id: 'org2', name: 'County Paramedics', webhookUrl: 'https://example.com/webhook/medical', secret: 'secret-medical-key-long' },
];
