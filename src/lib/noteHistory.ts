const KEY = 'kontor_notes'

export function saveNoteToHistory(note: string) {
  if (!note.trim()) return
  const existing: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
  const updated = [note.trim(), ...existing.filter(n => n !== note.trim())].slice(0, 50)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function getNoteHistory(): string[] {
  return JSON.parse(localStorage.getItem(KEY) ?? '[]')
}
