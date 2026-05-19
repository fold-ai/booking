import { addDays, addHours, setHours, setMinutes, startOfDay, formatISO } from 'date-fns'
import { BUSINESS_TYPES } from './businessTypes.js'

const today = startOfDay(new Date())

const t = (dayOffset, hour, minute = 0) =>
  formatISO(setMinutes(setHours(addDays(today, dayOffset), hour), minute))

export const seedBusiness = {
  id: 'demo-biz',
  name: 'Evergreen Outdoor Co.',
  slug: 'evergreen',
  type: 'landscaping',
  email: 'hello@evergreen.example',
  phone: '+1 (555) 010-0420',
  city: 'Boulder, CO',
  hours: { start: 7, end: 18 },
  workdays: [1, 2, 3, 4, 5, 6],
  bookingBufferMin: 30,
  brandAccent: '#F4A93C',
}

export const seedWorkers = [
  { id: 'w1', name: 'Maya Alvarez',  role: 'Lead crew',     email: 'maya@evergreen.example',  phone: '555-0100', color: '#3F6B4A', skills: ['Landscaping', 'Hedges'], hireDate: '2023-04-12' },
  { id: 'w2', name: 'Jordan Kim',    role: 'Crew',          email: 'jordan@evergreen.example',phone: '555-0101', color: '#F4A93C', skills: ['Mowing', 'Mulch'], hireDate: '2023-09-01' },
  { id: 'w3', name: 'Sam Okafor',    role: 'Crew',          email: 'sam@evergreen.example',   phone: '555-0102', color: '#B97A1D', skills: ['Mowing', 'Cleanup'], hireDate: '2024-03-22' },
  { id: 'w4', name: 'Priya Shah',    role: 'Apprentice',    email: 'priya@evergreen.example', phone: '555-0103', color: '#1F3A26', skills: ['Mowing'], hireDate: '2025-05-10' },
]

export const seedClients = [
  { id: 'c1', name: 'The Henderson Family', email: 'henderson@example.com', phone: '555-0200', address: '142 Birch Ln, Boulder, CO',     tags: ['weekly', 'gate-code'], notes: 'Gate code 4421. Dog (friendly).', createdAt: '2024-05-02' },
  { id: 'c2', name: 'Carla Reyes',          email: 'carla.r@example.com',  phone: '555-0201', address: '88 Aspen Ct, Boulder, CO',       tags: ['bi-weekly'],            notes: 'Prefers Tuesday afternoons.',         createdAt: '2024-06-19' },
  { id: 'c3', name: 'Northstar Cafe',       email: 'ops@northstar.example', phone: '555-0202', address: '20 Pearl St, Boulder, CO',       tags: ['commercial', 'priority'], notes: 'Service before 9am only.',           createdAt: '2023-11-30' },
  { id: 'c4', name: 'Marcus Bell',          email: 'mbell@example.com',    phone: '555-0203', address: '305 Pine Dr, Louisville, CO',    tags: ['one-time'],             notes: 'Quoted spring cleanup.',              createdAt: '2025-03-01' },
  { id: 'c5', name: 'Wren Lambert',         email: 'wren@example.com',     phone: '555-0204', address: '14 Sage Ave, Boulder, CO',       tags: ['weekly'],               notes: '',                                    createdAt: '2024-07-15' },
]

export const seedServices = BUSINESS_TYPES.find((b) => b.id === 'landscaping').defaultServices.map((s, i) => ({
  id: `s${i + 1}`,
  active: true,
  ...s,
}))

export const seedBookings = [
  { id: 'b1', clientId: 'c1', serviceId: 's1', workerIds: ['w1', 'w2'], start: t(0, 8),  end: t(0, 9),     status: 'scheduled', address: '142 Birch Ln, Boulder, CO',     price: 55,  notes: 'Backyard only this week.' },
  { id: 'b2', clientId: 'c3', serviceId: 's2', workerIds: ['w1'],       start: t(0, 9, 30), end: t(0, 10, 30), status: 'scheduled', address: '20 Pearl St, Boulder, CO',     price: 85,  notes: 'Front hedges along Pearl.' },
  { id: 'b3', clientId: 'c2', serviceId: 's1', workerIds: ['w3'],       start: t(0, 13), end: t(0, 14),    status: 'in_progress', address: '88 Aspen Ct, Boulder, CO',    price: 55,  notes: '' },
  { id: 'b4', clientId: 'c5', serviceId: 's1', workerIds: ['w2', 'w4'], start: t(1, 7, 30),  end: t(1, 8, 30),    status: 'scheduled', address: '14 Sage Ave, Boulder, CO',     price: 55,  notes: '' },
  { id: 'b5', clientId: 'c4', serviceId: 's3', workerIds: ['w1', 'w3', 'w4'], start: t(1, 9), end: t(1, 12), status: 'scheduled', address: '305 Pine Dr, Louisville, CO',  price: 220, notes: 'Spring cleanup, full property.' },
  { id: 'b6', clientId: 'c1', serviceId: 's4', workerIds: ['w2'],       start: t(2, 8),  end: t(2, 10),    status: 'scheduled', address: '142 Birch Ln, Boulder, CO',     price: 350, notes: 'Mulch — bring 4 yards.' },
  { id: 'b7', clientId: 'c5', serviceId: 's1', workerIds: ['w3'],       start: t(3, 11), end: t(3, 12),    status: 'scheduled', address: '14 Sage Ave, Boulder, CO',     price: 55,  notes: '' },
  { id: 'b8', clientId: 'c2', serviceId: 's2', workerIds: ['w1'],       start: t(4, 14), end: t(4, 15),    status: 'scheduled', address: '88 Aspen Ct, Boulder, CO',     price: 85,  notes: 'Front hedge only.' },
]
