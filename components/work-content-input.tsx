"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  filterSuggestions,
  getCurrentToken,
  replaceTokenAt,
  type WorkContent,
} from "@/lib/work-content-suggest"

interface WorkContentInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "onSelect" | "onKeyDown"
  > {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  contents: WorkContent[]
  inputClassName?: string
}

export function WorkContentInput({
  value,
  onChange,
  onSubmit,
  contents,
  className,
  inputClassName,
  disabled,
  ...inputProps
}: WorkContentInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [highlighted, setHighlighted] = React.useState(-1)
  const [isComposing, setIsComposing] = React.useState(false)
  const [caret, setCaret] = React.useState(0)

  const token = React.useMemo(() => getCurrentToken(value, caret), [value, caret])
  const suggestions = React.useMemo(
    () => filterSuggestions(contents, token.token),
    [contents, token.token],
  )

  React.useEffect(() => {
    if (suggestions.length === 0) {
      setOpen(false)
      setHighlighted(-1)
    } else {
      setHighlighted((h) =>
        h >= suggestions.length || h < 0 ? -1 : h,
      )
    }
  }, [suggestions])

  const applySuggestion = (suggestion: WorkContent) => {
    const result = replaceTokenAt(
      value,
      { start: token.start, end: token.end },
      suggestion.content,
    )
    onChange(result.text)
    setOpen(false)
    setHighlighted(-1)
    requestAnimationFrame(() => {
      const input = inputRef.current
      if (input) {
        input.focus()
        input.setSelectionRange(result.caret, result.caret)
        setCaret(result.caret)
      }
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return

    if (open && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setHighlighted((h) => (h + 1) % suggestions.length)
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setHighlighted((h) =>
          h <= 0 ? suggestions.length - 1 : h - 1,
        )
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        setHighlighted(-1)
        return
      }
      if (event.key === "Enter" || event.key === "Tab") {
        if (highlighted >= 0 && highlighted < suggestions.length) {
          event.preventDefault()
          applySuggestion(suggestions[highlighted])
          return
        }
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit?.()
    }
  }

  const updateCaret = () => {
    const input = inputRef.current
    if (!input) return
    setCaret(input.selectionStart ?? input.value.length)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    onChange(nextValue)
    const nextCaret = event.target.selectionStart ?? nextValue.length
    setCaret(nextCaret)
    setOpen(true)
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        {...inputProps}
        ref={inputRef}
        value={value}
        disabled={disabled}
        className={inputClassName}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={updateCaret}
        onClick={updateCaret}
        onSelect={updateCaret}
        onFocus={(event) => {
          updateCaret()
          setOpen(true)
          inputProps.onFocus?.(event)
        }}
        onBlur={(event) => {
          window.setTimeout(() => setOpen(false), 120)
          inputProps.onBlur?.(event)
        }}
        onCompositionStart={(event) => {
          setIsComposing(true)
          inputProps.onCompositionStart?.(event)
        }}
        onCompositionEnd={(event) => {
          setIsComposing(false)
          inputProps.onCompositionEnd?.(event)
        }}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls="work-content-suggestions"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && !disabled && (
        <ul
          id="work-content-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === highlighted}
              className={cn(
                "cursor-pointer rounded px-2 py-1",
                index === highlighted
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                applySuggestion(suggestion)
              }}
              onMouseEnter={() => setHighlighted(index)}
            >
              {suggestion.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
