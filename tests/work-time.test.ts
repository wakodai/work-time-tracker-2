import { describe, expect, it } from "vitest"
import {
  calculateTotalWorkMinutes,
  formatMinutesAsHHMM,
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
