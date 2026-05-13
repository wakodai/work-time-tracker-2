import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WorkContentInput } from "@/components/work-content-input"

const contents = [
  { id: "1", content: "TYTPAVECHK" },
  { id: "2", content: "TYTBRCMAP" },
  { id: "3", content: "開発作業" },
]

describe("WorkContentInput", () => {
  it("初期状態ではドロップダウンが見えない", () => {
    render(
      <WorkContentInput
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        contents={contents}
      />,
    )
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("Tと入力すると候補が表示される", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    let value = ""
    const { rerender } = render(
      <WorkContentInput
        value={value}
        onChange={(next) => {
          value = next
          handleChange(next)
        }}
        onSubmit={() => {}}
        contents={contents}
      />,
    )
    await user.click(screen.getByRole("textbox"))
    await user.keyboard("T")
    rerender(
      <WorkContentInput
        value={value}
        onChange={(next) => {
          value = next
          handleChange(next)
        }}
        onSubmit={() => {}}
        contents={contents}
      />,
    )
    const listbox = await screen.findByRole("listbox")
    expect(listbox).toBeInTheDocument()
    expect(screen.getByText("TYTPAVECHK")).toBeInTheDocument()
    expect(screen.getByText("TYTBRCMAP")).toBeInTheDocument()
    expect(screen.queryByText("開発作業")).not.toBeInTheDocument()
  })

  it("矢印キーで候補をハイライト、Enterで挿入する", async () => {
    const user = userEvent.setup()
    let value = ""
    const handleChange = vi.fn((next: string) => {
      value = next
    })
    const handleSubmit = vi.fn()
    const Wrapper = () => {
      const [v, setV] = (
        require("react") as typeof import("react")
      ).useState("")
      return (
        <WorkContentInput
          value={v}
          onChange={(next) => {
            setV(next)
            handleChange(next)
          }}
          onSubmit={handleSubmit}
          contents={contents}
        />
      )
    }
    render(<Wrapper />)
    await user.click(screen.getByRole("textbox"))
    await user.keyboard("T")
    await screen.findByRole("listbox")
    // 矢印下で最初の候補をアクティブにし、Enterで挿入
    await user.keyboard("{ArrowDown}")
    await user.keyboard("{Enter}")
    expect(handleChange).toHaveBeenLastCalledWith("TYTPAVECHK")
    // ドロップダウンは閉じている
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    // Enterは候補挿入であって onSubmit ではない
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it("ドロップダウンが閉じているEnterはonSubmitを呼ぶ", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    let value = ""
    const Wrapper = () => {
      const React = require("react") as typeof import("react")
      const [v, setV] = React.useState("作業")
      return (
        <WorkContentInput
          value={v}
          onChange={(next) => {
            setV(next)
            value = next
          }}
          onSubmit={handleSubmit}
          contents={contents}
        />
      )
    }
    render(<Wrapper />)
    const input = screen.getByRole("textbox")
    await user.click(input)
    await user.keyboard("{Enter}")
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it("Escapeでドロップダウンが閉じる", async () => {
    const user = userEvent.setup()
    const Wrapper = () => {
      const React = require("react") as typeof import("react")
      const [v, setV] = React.useState("")
      return (
        <WorkContentInput
          value={v}
          onChange={setV}
          onSubmit={() => {}}
          contents={contents}
        />
      )
    }
    render(<Wrapper />)
    await user.click(screen.getByRole("textbox"))
    await user.keyboard("T")
    await screen.findByRole("listbox")
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("disabledのとき入力できない", () => {
    render(
      <WorkContentInput
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        contents={contents}
        disabled
      />,
    )
    expect(screen.getByRole("textbox")).toBeDisabled()
  })
})
