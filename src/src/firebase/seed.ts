import { db } from './seedConfig'
import { doc, setDoc } from 'firebase/firestore'
import type { Service, StaffMember } from '../shared/types'

const services: Service[] = [
  {
    id: 'svc-1',
    name: 'Dámský střih',
    category: 'haircut',
    duration: 60,
    price: 650,
    description: 'Mytí, střih, foukaná',
    staffIds: ['staff-1', 'staff-2', 'staff-3', 'staff-4'],
  },
  {
    id: 'svc-2',
    name: 'Pánský střih',
    category: 'haircut',
    duration: 30,
    price: 350,
    staffIds: ['staff-1', 'staff-2', 'staff-3', 'staff-4'],
  },
  {
    id: 'svc-3',
    name: 'Dětský střih',
    category: 'kids',
    duration: 30,
    price: 250,
    staffIds: ['staff-2', 'staff-3'],
  },
  {
    id: 'svc-4',
    name: 'Barvení — jednoduchá barva',
    category: 'color',
    duration: 90,
    price: 1200,
    staffIds: ['staff-1', 'staff-2', 'staff-3'],
  },
  {
    id: 'svc-5',
    name: 'Melír / Balayage',
    category: 'color',
    duration: 150,
    price: 2500,
    staffIds: ['staff-1', 'staff-2'],
  },
  {
    id: 'svc-6',
    name: 'Foukaná',
    category: 'styling',
    duration: 30,
    price: 350,
    staffIds: ['staff-1', 'staff-2', 'staff-3', 'staff-4'],
  },
  {
    id: 'svc-7',
    name: 'Regenerační ošetření',
    category: 'treatment',
    duration: 45,
    price: 800,
    staffIds: ['staff-1', 'staff-2', 'staff-3'],
  },
  {
    id: 'svc-8',
    name: 'Svatební styling',
    category: 'styling',
    duration: 120,
    price: 3500,
    staffIds: ['staff-1'],
  },
]

const staff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Markéta Nováková',
    role: 'master',
    bio: '15 let zkušeností, specialistka na barvení a svatební styling',
    skills: ['haircut', 'color', 'styling', 'treatment'],
    weeklySchedule: {
      mon: { start: '09:00', end: '18:00' },
      tue: { start: '09:00', end: '18:00' },
      wed: { start: '09:00', end: '18:00' },
      thu: { start: '09:00', end: '18:00' },
      fri: { start: '09:00', end: '17:00' },
      sat: null,
      sun: null,
    },
    exceptions: [],
  },
  {
    id: 'staff-2',
    name: 'Jana Procházková',
    role: 'senior',
    bio: 'Specialistka na dámské střihy a dětské klienty',
    skills: ['haircut', 'color', 'styling', 'treatment', 'kids'],
    weeklySchedule: {
      mon: null,
      tue: { start: '10:00', end: '19:00' },
      wed: { start: '10:00', end: '19:00' },
      thu: { start: '10:00', end: '19:00' },
      fri: { start: '10:00', end: '19:00' },
      sat: { start: '09:00', end: '15:00' },
      sun: null,
    },
    exceptions: [],
  },
  {
    id: 'staff-3',
    name: 'Petra Horáková',
    role: 'senior',
    bio: 'Zkušená kadeřnice, milovnice moderních střihů',
    skills: ['haircut', 'color', 'styling', 'treatment', 'kids'],
    weeklySchedule: {
      mon: { start: '09:00', end: '18:00' },
      tue: { start: '09:00', end: '18:00' },
      wed: null,
      thu: { start: '09:00', end: '18:00' },
      fri: { start: '09:00', end: '18:00' },
      sat: { start: '09:00', end: '14:00' },
      sun: null,
    },
    exceptions: [],
  },
  {
    id: 'staff-4',
    name: 'Tomáš Dvořák',
    role: 'junior',
    bio: 'Nováček v týmu, specializuje se na pánské střihy',
    skills: ['haircut', 'styling'],
    weeklySchedule: {
      mon: { start: '12:00', end: '20:00' },
      tue: { start: '12:00', end: '20:00' },
      wed: { start: '12:00', end: '20:00' },
      thu: null,
      fri: { start: '12:00', end: '20:00' },
      sat: { start: '10:00', end: '16:00' },
      sun: null,
    },
    exceptions: [],
  },
]

export async function seedDatabase() {
  console.log('🌱 Seeding database...')

  for (const service of services) {
    await setDoc(doc(db, 'services', service.id), service)
    console.log(`✅ Service: ${service.name}`)
  }

  for (const member of staff) {
    await setDoc(doc(db, 'staff', member.id), member)
    console.log(`✅ Staff: ${member.name}`)
  }

  console.log('🎉 Seed complete!')
}