export const SLOT_INTERVAL = 30 // минут — шаг слотов

export const SERVICE_CATEGORIES = {
  haircut: { label: 'Střihy', icon: '✂️' },
  color:   { label: 'Barvení', icon: '🎨' },
  styling: { label: 'Styling', icon: '💨' },
  treatment: { label: 'Ošetření', icon: '✨' },
  kids:    { label: 'Dětské', icon: '👶' },
} as const

export const BOOKING_STATUS_LABELS = {
  pending:   { label: 'Čeká', color: 'yellow' },
  confirmed: { label: 'Potvrzeno', color: 'blue' },
  completed: { label: 'Dokončeno', color: 'green' },
  cancelled: { label: 'Zrušeno', color: 'red' },
  no_show:   { label: 'Nepřišel/a', color: 'gray' },
} as const