const KEY = 'kontor_emails'

export function saveEmailToHistory(email: string) {
  if (!email.trim()) return
  const existing: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
  const updated = [email.trim(), ...existing.filter(e => e !== email.trim())].slice(0, 5)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function getEmailHistory(): string[] {
  return JSON.parse(localStorage.getItem(KEY) ?? '[]')
}
