"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Clock, Copy, RotateCcw, Save, X, List, GripVertical } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface WorkRecord {
  id: string
  datetime: string
  actionType: "start" | "stop" | "break"
  description: string
}

interface WorkContent {
  id: string
  content: string
}

export default function WorkTimeTracker() {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [workContents, setWorkContents] = useState<WorkContent[]>([])

  // Summary states
  const [summaryText, setSummaryText] = useState("")
  const [showSummary, setShowSummary] = useState(false)

  // Editing states
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<WorkRecord>>({})

  // Work content management states
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false)
  const [newContentText, setNewContentText] = useState("")
  const [editingContent, setEditingContent] = useState<WorkContent | null>(null)

  // New record states
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newRecord, setNewRecord] = useState<Partial<WorkRecord>>({
    datetime: "",
    actionType: "start",
    description: "",
  })

  // Drag and drop states
  const [draggedRecord, setDraggedRecord] = useState<string | null>(null)
  const [dragOverRecord, setDragOverRecord] = useState<string | null>(null)

  useEffect(() => {
    // Load data from localStorage
    const savedRecords = localStorage.getItem("workRecords")
    const savedContents = localStorage.getItem("workContents")

    if (savedRecords) {
      setRecords(JSON.parse(savedRecords))
    }
    if (savedContents) {
      setWorkContents(JSON.parse(savedContents))
    } else {
      // Default work contents
      const defaultContents = [
        { id: "1", content: "開発作業" },
        { id: "2", content: "会議" },
        { id: "3", content: "レビュー" },
        { id: "4", content: "調査・検討" },
      ]
      setWorkContents(defaultContents)
    }
  }, [])

  useEffect(() => {
    // Save records to localStorage
    localStorage.setItem("workRecords", JSON.stringify(records))
  }, [records])

  useEffect(() => {
    // Save work contents to localStorage
    localStorage.setItem("workContents", JSON.stringify(workContents))
  }, [workContents])

  // 現在の日時を取得（UTC+9時間として）
  const getCurrentDateTime = () => {
    const now = new Date()
    // 日本時間として扱うため、ローカル時間をそのまま使用
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // 日時の表示用フォーマット（入力された値をそのまま日本時間として表示）
  const formatDateTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const startAddingNew = () => {
    setNewRecord({
      datetime: getCurrentDateTime(),
      actionType: "start",
      description: "",
    })
    setIsAddingNew(true)
  }

  const saveNewRecord = () => {
    if (!newRecord.datetime) {
      toast({
        title: "エラー",
        description: "日時を入力してください",
        variant: "destructive",
      })
      return
    }

    const record: WorkRecord = {
      id: Date.now().toString(),
      datetime: newRecord.datetime,
      actionType: newRecord.actionType ?? "start",
      description: newRecord.description ?? "",
    }

    setRecords([...records, record])
    setIsAddingNew(false)
    setNewRecord({
      datetime: "",
      actionType: "start",
      description: "",
    })

    toast({
      title: "記録を追加しました",
      description: record.actionType === "start" ? "START" : record.actionType === "break" ? "BREAK" : "STOP",
    })
  }

  const startEditing = (record: WorkRecord) => {
    setEditingRecord(record.id)
    setEditForm({ ...record })
  }

  const saveEdit = () => {
    if (!editForm.datetime) {
      toast({
        title: "エラー",
        description: "日時を入力してください",
        variant: "destructive",
      })
      return
    }

    setRecords(
      records.map((record) =>
        record.id === editingRecord
          ? {
              ...record,
              datetime: editForm.datetime!,
              actionType: editForm.actionType!,
              description: editForm.description!,
            }
          : record,
      ),
    )

    setEditingRecord(null)
    setEditForm({})
    toast({
      title: "記録を更新しました",
    })
  }

  const cancelEdit = () => {
    setEditingRecord(null)
    setEditForm({})
    setIsAddingNew(false)
  }

  const deleteRecord = (id: string) => {
    setRecords(records.filter((record) => record.id !== id))
    toast({
      title: "記録を削除しました",
    })
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    setDraggedRecord(recordId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, recordId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverRecord(recordId)
  }

  const handleDragLeave = () => {
    setDragOverRecord(null)
  }

  const handleDrop = (e: React.DragEvent, targetRecordId: string) => {
    e.preventDefault()

    if (!draggedRecord || draggedRecord === targetRecordId) {
      setDraggedRecord(null)
      setDragOverRecord(null)
      return
    }

    const sortedRecords = [...records].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    const draggedIndex = sortedRecords.findIndex((record) => record.id === draggedRecord)
    const targetIndex = sortedRecords.findIndex((record) => record.id === targetRecordId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const draggedRecordData = sortedRecords[draggedIndex]
    const targetRecordData = sortedRecords[targetIndex]

    // Swap datetime to maintain sort order
    const tempDateTime = draggedRecordData.datetime
    draggedRecordData.datetime = targetRecordData.datetime
    targetRecordData.datetime = tempDateTime

    setRecords(
      records.map((record) => {
        if (record.id === draggedRecordData.id) return draggedRecordData
        if (record.id === targetRecordData.id) return targetRecordData
        return record
      }),
    )

    setDraggedRecord(null)
    setDragOverRecord(null)

    toast({
      title: "記録を移動しました",
    })
  }

  const handleDragEnd = () => {
    setDraggedRecord(null)
    setDragOverRecord(null)
  }

  // Work content management functions
  const addWorkContent = () => {
    if (!newContentText.trim()) return

    const newContent: WorkContent = {
      id: Date.now().toString(),
      content: newContentText.trim(),
    }

    setWorkContents([...workContents, newContent])
    setNewContentText("")
    toast({
      title: "作業内容を追加しました",
      description: newContentText,
    })
  }

  const updateWorkContent = () => {
    if (!editingContent || !newContentText.trim()) return

    setWorkContents(
      workContents.map((content) =>
        content.id === editingContent.id ? { ...content, content: newContentText.trim() } : content,
      ),
    )

    setEditingContent(null)
    setNewContentText("")
    toast({
      title: "作業内容を更新しました",
    })
  }

  const deleteWorkContent = (contentId: string) => {
    const contentToDelete = workContents.find((content) => content.id === contentId)
    if (!contentToDelete) return

    setWorkContents(workContents.filter((content) => content.id !== contentId))

    toast({
      title: "作業内容を削除しました",
      description: contentToDelete.content,
    })
  }

  // Handle Enter key press for work content input
  const handleWorkContentKeyDown = (e: React.KeyboardEvent, isNewRecord = false) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (isNewRecord) {
        saveNewRecord()
      } else {
        saveEdit()
      }
    }
  }

  const generateTSVDump = () => {
    if (records.length === 0) {
      toast({
        title: "エラー",
        description: "記録がありません",
        variant: "destructive",
      })
      return
    }

    // Sort records by datetime
    const sortedRecords = [...records].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

    // Generate TSV format
    const tsvLines: string[] = []

    sortedRecords.forEach((record) => {
      const date = new Date(record.datetime)
      const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`
      const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`

      let action = ""
      let description = record.description || ""

      if (record.actionType === "start") {
        action = "START()"
      } else if (record.actionType === "stop") {
        action = "STOP()"
      } else if (record.actionType === "break") {
        action = `BREAK(${description})`
        description = ""
      }

      tsvLines.push(`${dateStr} ${timeStr}\t${action}\t${description}`)
    })

    const tsvContent = tsvLines.join("\n")
    setSummaryText(tsvContent)
    setShowSummary(true)
  }

  const copyAsHTMLTable = async () => {
    if (records.length === 0) {
      toast({
        title: "エラー",
        description: "記録がありません",
        variant: "destructive",
      })
      return
    }

    // Sort records by datetime
    const sortedRecords = [...records].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

    // Generate HTML table
    let htmlTable = `<table border="1" cellpadding="5" cellspacing="0">
<thead>
<tr>
<th>日時</th>
<th>種別</th>
<th>作業内容</th>
</tr>
</thead>
<tbody>`

    sortedRecords.forEach((record) => {
      const date = new Date(record.datetime)
      const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`
      const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`

      let action = ""
      let description = record.description || ""

      if (record.actionType === "start") {
        action = "START()"
      } else if (record.actionType === "stop") {
        action = "STOP()"
      } else if (record.actionType === "break") {
        action = `BREAK(${description})`
        description = ""
      }

      htmlTable += `
<tr>
<td>${dateStr} ${timeStr}</td>
<td>${action}</td>
<td>${description}</td>
</tr>`
    })

    htmlTable += `
</tbody>
</table>`

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlTable], { type: "text/html" }),
        }),
      ])
      toast({
        title: "HTMLテーブルをコピーしました",
        description: "Confluenceに貼り付けできます",
      })
    } catch (error) {
      // Fallback to plain text
      await navigator.clipboard.writeText(htmlTable)
      toast({
        title: "HTMLテーブル（テキスト）をコピーしました",
      })
    }
  }

  const clearAll = () => {
    setRecords([])
    setSummaryText("")
    setShowSummary(false)
    toast({
      title: "すべてクリアしました",
    })
  }

  const renderEditableCell = (
    record: WorkRecord,
    field: keyof WorkRecord,
    type: "text" | "datetime" | "select" | "textarea" = "text",
  ) => {
    const isEditing = editingRecord === record.id
    const value = isEditing ? editForm[field] : record[field]

    if (!isEditing) {
      if (field === "datetime") {
        return formatDateTime(record.datetime)
      }
      if (field === "actionType") {
        const variant =
          record.actionType === "start" ? "default" : record.actionType === "break" ? "secondary" : "outline"
        const text = record.actionType === "start" ? "START" : record.actionType === "break" ? "BREAK" : "STOP"
        return <Badge variant={variant}>{text}</Badge>
      }
      return record[field]
    }

    switch (type) {
      case "datetime":
        return (
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={value as string}
              onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
              className="min-w-48"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditForm({ ...editForm, [field]: getCurrentDateTime() })}
            >
              <Clock className="h-3 w-3" />
            </Button>
          </div>
        )
      case "select":
        if (field === "actionType") {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={editForm.actionType === "start" ? "default" : "outline"}
                onClick={() => setEditForm({ ...editForm, actionType: "start", description: "" })}
              >
                START
              </Button>
              <Button
                size="sm"
                variant={editForm.actionType === "stop" ? "default" : "outline"}
                onClick={() => setEditForm({ ...editForm, actionType: "stop", description: "" })}
              >
                STOP
              </Button>
              <Button
                size="sm"
                variant={editForm.actionType === "break" ? "default" : "outline"}
                onClick={() => setEditForm({ ...editForm, actionType: "break", description: "" })}
              >
                BREAK
              </Button>
            </div>
          )
        }
        break
      case "textarea":
        const isStartMode = editForm.actionType === "start"
        const isBreakMode = editForm.actionType === "break"
        return (
          <div>
            <Input
              list="work-contents"
              value={value as string}
              onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
              onKeyDown={(e) => handleWorkContentKeyDown(e, false)}
              className="min-w-48"
              disabled={isStartMode}
              placeholder={
                isStartMode
                  ? "START時は入力不可"
                  : isBreakMode
                    ? "休憩時間を(nn)形式で入力（Enterで保存）"
                    : "作業内容を入力（Enterで保存）"
              }
            />
            <datalist id="work-contents">
              {workContents.map((content) => (
                <option key={content.id} value={content.content} />
              ))}
            </datalist>
          </div>
        )
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
            className="min-w-32"
          />
        )
    }
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">作業時間記録システム</h1>

      {/* Main Table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              作業記録
            </CardTitle>
            <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <List className="h-4 w-4 mr-2" />
                  作業内容管理
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>作業内容管理</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="新しい作業内容"
                      value={newContentText}
                      onChange={(e) => setNewContentText(e.target.value)}
                    />
                    <Button
                      onClick={editingContent ? updateWorkContent : addWorkContent}
                      disabled={!newContentText.trim()}
                    >
                      {editingContent ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {workContents.map((content) => (
                      <div key={content.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{content.content}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingContent(content)
                              setNewContentText(content.content)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteWorkContent(content.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>日時</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>作業内容</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    draggable={editingRecord !== record.id}
                    onDragStart={(e) => handleDragStart(e, record.id)}
                    onDragOver={(e) => handleDragOver(e, record.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, record.id)}
                    onDragEnd={handleDragEnd}
                    className={`
                      ${draggedRecord === record.id ? "opacity-50" : ""}
                      ${dragOverRecord === record.id ? "bg-muted/50" : ""}
                      ${editingRecord !== record.id ? "cursor-move" : ""}
                    `}
                  >
                    <TableCell className="text-center">
                      {editingRecord !== record.id && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell>{renderEditableCell(record, "datetime", "datetime")}</TableCell>
                    <TableCell>{renderEditableCell(record, "actionType", "select")}</TableCell>
                    <TableCell>{renderEditableCell(record, "description", "textarea")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingRecord === record.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEditing(record)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteRecord(record.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* New Record Row */}
                {isAddingNew && (
                  <TableRow className="bg-muted/50">
                    <TableCell></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          type="datetime-local"
                          value={newRecord.datetime}
                          onChange={(e) => setNewRecord({ ...newRecord, datetime: e.target.value })}
                          className="min-w-48"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNewRecord({ ...newRecord, datetime: getCurrentDateTime() })}
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={newRecord.actionType === "start" ? "default" : "outline"}
                          onClick={() => setNewRecord({ ...newRecord, actionType: "start", description: "" })}
                        >
                          START
                        </Button>
                        <Button
                          size="sm"
                          variant={newRecord.actionType === "stop" ? "default" : "outline"}
                          onClick={() => setNewRecord({ ...newRecord, actionType: "stop", description: "" })}
                        >
                          STOP
                        </Button>
                        <Button
                          size="sm"
                          variant={newRecord.actionType === "break" ? "default" : "outline"}
                          onClick={() => setNewRecord({ ...newRecord, actionType: "break", description: "" })}
                        >
                          BREAK
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Input
                          list="work-contents-new"
                          placeholder={
                            newRecord.actionType === "start"
                              ? "START時は入力不可"
                              : newRecord.actionType === "break"
                                ? "休憩時間を(nn)形式で入力（Enterで保存）"
                                : "作業内容を入力（Enterで保存）"
                          }
                          value={newRecord.description}
                          onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                          onKeyDown={(e) => handleWorkContentKeyDown(e, true)}
                          className="min-w-48"
                          disabled={newRecord.actionType === "start"}
                        />
                        <datalist id="work-contents-new">
                          {workContents.map((content) => (
                            <option key={content.id} value={content.content} />
                          ))}
                        </datalist>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={saveNewRecord}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {/* Add New Record Button Row */}
                {!isAddingNew && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-4">
                      <Button onClick={startAddingNew} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        新規追加
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TSV Dump Section */}
      <Card>
        <CardHeader>
          <CardTitle>TSVダンプ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={generateTSVDump}>TSVダンプ実行</Button>
            <Button onClick={copyAsHTMLTable} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              HTMLテーブルでコピー
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              すべてクリア
            </Button>
          </div>

          {showSummary && (
            <div className="space-y-2">
              <Textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="min-h-32 font-mono text-sm"
                placeholder="TSVダンプ結果がここに表示されます（編集可能）"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
