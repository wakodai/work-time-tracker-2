import { describe, expect, it } from "vitest"
import {
  calculateTotalWorkMinutes,
  calculateTotalWorkSeconds,
  formatMinutesAsHHMM,
  formatSecondsAsHHMMSS,
  hasOpenSession,
  type WorkRecord,
} from "@/lib/work-time"

describe("calculateTotalWorkMinutes", () => {
  it("レコードが空なら0分", () => {
    expect(calculateTotalWorkMinutes([])).toBe(0)
  })

  it("STARTのみ・STOPのみのレコードは加算されない", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(0)
  })

  it("単純なSTART→STOPの差分（分）を返す", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T10:30", actionType: "stop", description: "" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(90)
  })

  it("複数のSTART/STOPペアを合計する", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T12:00", actionType: "stop", description: "" },
      { id: "3", datetime: "2026-05-13T13:00", actionType: "start", description: "" },
      { id: "4", datetime: "2026-05-13T18:00", actionType: "stop", description: "" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(180 + 300)
  })

  it("BREAKの分数を引く（descriptionが数値）", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T12:00", actionType: "break", description: "15" },
      { id: "3", datetime: "2026-05-13T18:00", actionType: "stop", description: "" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(540 - 15)
  })

  it("BREAKのdescriptionが括弧付きでも数値を取り出す", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T12:00", actionType: "break", description: "(30)" },
      { id: "3", datetime: "2026-05-13T18:00", actionType: "stop", description: "" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(540 - 30)
  })

  it("並びがバラバラでも時系列でペアにする", () => {
    const records: WorkRecord[] = [
      { id: "2", datetime: "2026-05-13T18:00", actionType: "stop", description: "" },
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "3", datetime: "2026-05-13T12:00", actionType: "break", description: "60" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(540 - 60)
  })

  it("STOPの後の単独BREAKは無視する", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T10:00", actionType: "stop", description: "" },
      { id: "3", datetime: "2026-05-13T11:00", actionType: "break", description: "30" },
    ]
    expect(calculateTotalWorkMinutes(records)).toBe(60)
  })
})

describe("calculateTotalWorkSeconds", () => {
  const at = (datetime: string) => new Date(datetime).getTime()

  it("レコードが空なら0秒", () => {
    expect(calculateTotalWorkSeconds([], at("2026-05-13T10:00:00"))).toBe(0)
  })

  it("STARTのみのセッションは now までの経過秒を加算する", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
    ]
    // 09:00:00 → 09:30:45 = 1845秒
    expect(calculateTotalWorkSeconds(records, at("2026-05-13T09:30:45"))).toBe(1845)
  })

  it("STOP済みセッションは now の影響を受けず秒差分を返す", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T10:30", actionType: "stop", description: "" },
    ]
    expect(calculateTotalWorkSeconds(records, at("2026-05-13T23:59:59"))).toBe(90 * 60)
  })

  it("仕事中セッションでも BREAK 分を秒に換算して引く", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T10:00", actionType: "break", description: "15" },
    ]
    // 09:00:00 → 10:30:00 = 5400秒 - 休憩15分(900秒) = 4500秒
    expect(calculateTotalWorkSeconds(records, at("2026-05-13T10:30:00"))).toBe(4500)
  })

  it("完了セッション + 仕事中セッションを合算する", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T10:00", actionType: "stop", description: "" },
      { id: "3", datetime: "2026-05-13T11:00", actionType: "start", description: "" },
    ]
    // 完了分 3600秒 + 仕事中 11:00:00→11:00:30 = 30秒
    expect(calculateTotalWorkSeconds(records, at("2026-05-13T11:00:30"))).toBe(3600 + 30)
  })

  it("now が START より前でも負にならない", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
    ]
    expect(calculateTotalWorkSeconds(records, at("2026-05-13T08:00:00"))).toBe(0)
  })
})

describe("hasOpenSession", () => {
  it("STARTのみなら true", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
    ]
    expect(hasOpenSession(records)).toBe(true)
  })

  it("START→STOP で閉じていれば false", () => {
    const records: WorkRecord[] = [
      { id: "1", datetime: "2026-05-13T09:00", actionType: "start", description: "" },
      { id: "2", datetime: "2026-05-13T10:00", actionType: "stop", description: "" },
    ]
    expect(hasOpenSession(records)).toBe(false)
  })

  it("レコードが空なら false", () => {
    expect(hasOpenSession([])).toBe(false)
  })
})

describe("formatSecondsAsHHMMSS", () => {
  it("0秒は 0:00:00", () => {
    expect(formatSecondsAsHHMMSS(0)).toBe("0:00:00")
  })
  it("3661秒は 1:01:01", () => {
    expect(formatSecondsAsHHMMSS(3661)).toBe("1:01:01")
  })
  it("59秒は 0:00:59", () => {
    expect(formatSecondsAsHHMMSS(59)).toBe("0:00:59")
  })
  it("負の値は 0:00:00 として扱う", () => {
    expect(formatSecondsAsHHMMSS(-10)).toBe("0:00:00")
  })
})

describe("formatMinutesAsHHMM", () => {
  it("0分は 0:00", () => {
    expect(formatMinutesAsHHMM(0)).toBe("0:00")
  })
  it("90分は 1:30", () => {
    expect(formatMinutesAsHHMM(90)).toBe("1:30")
  })
  it("60分は 1:00", () => {
    expect(formatMinutesAsHHMM(60)).toBe("1:00")
  })
  it("125分は 2:05", () => {
    expect(formatMinutesAsHHMM(125)).toBe("2:05")
  })
  it("負の値は 0:00 として扱う", () => {
    expect(formatMinutesAsHHMM(-10)).toBe("0:00")
  })
})
