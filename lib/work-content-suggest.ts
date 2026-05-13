export interface WorkContent {
  id: string
  content: string
}

export interface TokenRange {
  token: string
  start: number
  end: number
}

const SEPARATOR = /\s/

export const getCurrentToken = (text: string, caret: number): TokenRange => {
  const clampedCaret = Math.max(0, Math.min(caret, text.length))
  let start = clampedCaret
  while (start > 0 && !SEPARATOR.test(text[start - 1])) {
    start -= 1
  }
  let end = clampedCaret
  while (end < text.length && !SEPARATOR.test(text[end])) {
    end += 1
  }
  return { token: text.slice(start, end), start, end }
}

export const filterSuggestions = (
  contents: WorkContent[],
  token: string,
): WorkContent[] => {
  if (!token) return []
  const lower = token.toLowerCase()
  return contents.filter((content) => {
    const value = content.content
    if (!value.toLowerCase().startsWith(lower)) return false
    return value !== token
  })
}

export const replaceTokenAt = (
  text: string,
  range: { start: number; end: number },
  replacement: string,
): { text: string; caret: number } => {
  const before = text.slice(0, range.start)
  const after = text.slice(range.end)
  const nextText = `${before}${replacement}${after}`
  const caret = before.length + replacement.length
  return { text: nextText, caret }
}
