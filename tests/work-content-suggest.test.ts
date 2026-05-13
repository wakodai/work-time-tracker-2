import { describe, expect, it } from "vitest"
import {
  filterSuggestions,
  getCurrentToken,
  replaceTokenAt,
} from "@/lib/work-content-suggest"

describe("getCurrentToken", () => {
  it("空文字なら空文字", () => {
    expect(getCurrentToken("", 0)).toEqual({ token: "", start: 0, end: 0 })
  })

  it("末尾の単語を返す", () => {
    expect(getCurrentToken("TYT", 3)).toEqual({ token: "TYT", start: 0, end: 3 })
  })

  it("空白で区切られた最後の単語を返す", () => {
    expect(getCurrentToken("foo TYT", 7)).toEqual({ token: "TYT", start: 4, end: 7 })
  })

  it("カーソル位置の単語を返す（末尾でない）", () => {
    expect(getCurrentToken("foo TYT bar", 7)).toEqual({ token: "TYT", start: 4, end: 7 })
  })

  it("空白の直後（次のトークンの先頭）は空のトークン", () => {
    expect(getCurrentToken("foo ", 4)).toEqual({ token: "", start: 4, end: 4 })
  })

  it("改行・タブも区切りとして扱う", () => {
    expect(getCurrentToken("foo\nTYT", 7)).toEqual({ token: "TYT", start: 4, end: 7 })
  })
})

describe("filterSuggestions", () => {
  const contents = [
    { id: "1", content: "TYTPAVECHK" },
    { id: "2", content: "TYTBRCMAP" },
    { id: "3", content: "開発作業" },
    { id: "4", content: "review" },
  ]

  it("空トークンなら候補なし", () => {
    expect(filterSuggestions(contents, "")).toEqual([])
  })

  it("プレフィックス（大小文字無視）に一致する候補を返す", () => {
    expect(filterSuggestions(contents, "t").map((c) => c.content)).toEqual([
      "TYTPAVECHK",
      "TYTBRCMAP",
    ])
  })

  it("一致しなければ空配列", () => {
    expect(filterSuggestions(contents, "z")).toEqual([])
  })

  it("日本語もプレフィックスで一致", () => {
    expect(filterSuggestions(contents, "開発").map((c) => c.content)).toEqual([
      "開発作業",
    ])
  })

  it("完全一致のみの場合は候補に出さない（既に入力済み）", () => {
    expect(filterSuggestions(contents, "TYTPAVECHK")).toEqual([])
  })
})

describe("replaceTokenAt", () => {
  it("末尾トークンを置換", () => {
    expect(replaceTokenAt("foo TYT", { start: 4, end: 7 }, "TYTPAVECHK")).toEqual({
      text: "foo TYTPAVECHK",
      caret: 14,
    })
  })

  it("中間のトークンを置換しカーソル位置を補正", () => {
    expect(replaceTokenAt("foo TYT bar", { start: 4, end: 7 }, "TYTPAVECHK")).toEqual({
      text: "foo TYTPAVECHK bar",
      caret: 14,
    })
  })

  it("空文字に挿入", () => {
    expect(replaceTokenAt("", { start: 0, end: 0 }, "TYTPAVECHK")).toEqual({
      text: "TYTPAVECHK",
      caret: 10,
    })
  })
})
