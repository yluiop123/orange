import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, File, Upload as UploadIcon, X } from "lucide-react"
import { useRef, useState } from "react"

export type FileItem = {
  uid: string
  name: string
  file?: File
  status: "pending" | "uploading" | "done" | "error"
  percent?: number
  error?: string
}

export type UploadProps = {
  accept?: string
  multiple?: boolean
  maxSize?: number // bytes
  maxCount?: number
  disabled?: boolean
  onChange?: (files: FileItem[]) => void
  onRemove?: (uid: string) => void
  children?: React.ReactNode
  className?: string
  /** 是否显示为拖拽上传 */
  drag?: boolean
}

export default function Upload({
  accept,
  multiple = false,
  maxSize,
  maxCount,
  disabled = false,
  onChange,
  onRemove,
  className,
  drag = false,
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileList, setFileList] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const addFile = (file: File) => {
    // 验证文件大小
    if (maxSize && file.size > maxSize) {
      alert(`文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(2)}MB)`)
      return
    }

    // 验证文件数量
    if (maxCount && fileList.length >= maxCount) {
      alert(`最多只能上传 ${maxCount} 个文件`)
      return
    }

    const newItem: FileItem = {
      uid: `${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
      status: "pending",
    }

    const updated = [...fileList, newItem]
    setFileList(updated)
    onChange?.(updated)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    if (multiple) {
      Array.from(files).forEach((file) => addFile(file))
    } else {
      addFile(files[0])
      setFileList([
        {
          uid: `${Date.now()}-${Math.random()}`,
          name: files[0].name,
          file: files[0],
          status: "pending",
        },
      ])
    }

    // 重置 input
    e.currentTarget.value = ""
  }

  const handleRemove = (uid: string) => {
    const updated = fileList.filter((f) => f.uid !== uid)
    setFileList(updated)
    onChange?.(updated)
    onRemove?.(uid)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files) return

    if (multiple) {
      Array.from(files).forEach((file) => addFile(file))
    } else {
      addFile(files[0])
    }
  }

  const triggerInput = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="hidden"
        aria-label="Upload file input"
      />

      {drag ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <UploadIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">拖拽文件到此处上传 / Drag files here</p>
          <p className="text-xs text-muted-foreground mt-1">或点击下方按钮选择 / Or click button below</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerInput}
            disabled={disabled}
            className="mt-4"
          >
            选择文件 / Select Files
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={triggerInput}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          选择文件 / Select Files
        </Button>
      )}

      {/* 文件列表 */}
      {fileList.length > 0 && (
        <div className="space-y-2">
          {fileList.map((item) => (
            <div
              key={item.uid}
              className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.status === "uploading" && item.percent !== undefined && (
                    <div className="w-full bg-muted-foreground/20 rounded-full h-1 mt-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  )}
                  {item.status === "error" && item.error && (
                    <p className="text-xs text-destructive mt-1">{item.error}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {item.status === "uploading" && (
                  <span className="text-xs text-muted-foreground">{item.percent}%</span>
                )}
                {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {item.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRemove(item.uid)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
