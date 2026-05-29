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

export const hasOpenSession = (records: WorkRecord[]): boolean => {
  if (records.length === 0) return false

  const sorted = [...records].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  )

  let open = false
  for (const record of sorted) {
    if (record.actionType === "start") {
      open = true
    } else if (record.actionType === "stop") {
      open = false
    }
  }
  return open
}

/**
 * 秒精度の総作業時間。仕事中（STARTのみでSTOP未到来）のセッションは
 * `nowMs`（現在時刻のミリ秒）までを仮STOPとして加算する。
 */
export const calculateTotalWorkSeconds = (
  records: WorkRecord[],
  nowMs: number,
): number => {
  if (records.length === 0) return 0

  const sorted = [...records].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  )

  let totalSeconds = 0
  let sessionStart: number | null = null
  let sessionBreakSeconds = 0

  for (const record of sorted) {
    if (record.actionType === "start") {
      sessionStart = new Date(record.datetime).getTime()
      sessionBreakSeconds = 0
    } else if (record.actionType === "break") {
      if (sessionStart !== null) {
        sessionBreakSeconds += parseBreakMinutes(record.description) * 60
      }
    } else if (record.actionType === "stop") {
      if (sessionStart !== null) {
        const elapsedSeconds =
          (new Date(record.datetime).getTime() - sessionStart) / 1000
        totalSeconds += elapsedSeconds - sessionBreakSeconds
        sessionStart = null
        sessionBreakSeconds = 0
      }
    }
  }

  // 仕事中のセッションを now まで加算
  if (sessionStart !== null) {
    const elapsedSeconds = (nowMs - sessionStart) / 1000
    totalSeconds += elapsedSeconds - sessionBreakSeconds
  }

  return Math.max(0, Math.round(totalSeconds))
}

export const formatSecondsAsHHMMSS = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const mins = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

export const formatMinutesAsHHMM = (minutes: number): string => {
  const safe = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return `${hours}:${String(mins).padStart(2, "0")}`
}
