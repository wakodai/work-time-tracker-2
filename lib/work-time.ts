export type ActionType = "start" | "stop" | "break"

export interface WorkRecord {
  id: string
  datetime: string
  actionType: ActionType
  description: string
}

const parseBreakMinutes = (description: string): number => {
  const match = description.match(/-?\d+(?:\.\d+)?/)
  if (!match) return 0
  const minutes = Number(match[0])
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0
}

export const calculateTotalWorkMinutes = (records: WorkRecord[]): number => {
  if (records.length === 0) return 0

  const sorted = [...records].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  )

  let total = 0
  let sessionStart: number | null = null
  let sessionBreakMinutes = 0

  for (const record of sorted) {
    if (record.actionType === "start") {
      sessionStart = new Date(record.datetime).getTime()
      sessionBreakMinutes = 0
    } else if (record.actionType === "break") {
      if (sessionStart !== null) {
        sessionBreakMinutes += parseBreakMinutes(record.description)
      }
    } else if (record.actionType === "stop") {
      if (sessionStart !== null) {
        const elapsedMinutes =
          (new Date(record.datetime).getTime() - sessionStart) / 60000
        total += elapsedMinutes - sessionBreakMinutes
        sessionStart = null
        sessionBreakMinutes = 0
      }
    }
  }

  return Math.max(0, Math.round(total))
}

export const formatMinutesAsHHMM = (minutes: number): string => {
  const safe = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return `${hours}:${String(mins).padStart(2, "0")}`
}
