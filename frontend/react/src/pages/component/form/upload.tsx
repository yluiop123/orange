import Uppy from '@uppy/core'
import { useUppyState } from '@uppy/react'
import Tus from '@uppy/tus'
import { HardDrive, Loader2, Upload } from "lucide-react"
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// --- 方式 A: React-Dropzone (标准上传 | Standard Upload) ---
function DropzoneStandard() {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
          <Upload className="w-4 h-4" />
          方式 1: 标准上传 | Option 1: Standard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 hover:bg-accent cursor-pointer transition-colors text-center">
          <input {...getInputProps()} />
          <p className="text-sm">
            {isDragActive ? "松开放置 | Drop here" : "普通文件拖拽 | Drag files here"}
          </p>
        </div>
        <ul className="text-xs space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex justify-between border-b pb-1">
              <span className="truncate w-40">{f.name}</span>
              <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// --- 方式 B: Uppy + Tus (大文件续传 | Large File Resumable) ---
const uppyInstance = new Uppy().use(Tus, {
  endpoint: 'https://tusd.tusdemo.net/files/',
  chunkSize: 5 * 1024 * 1024
})

function UppyTus() {
  const { files, isUploadStarted } = useUppyState(uppyInstance, (s) => ({
    files: s.files,
    totalProgress: s.totalProgress,
    isUploadStarted: s.totalProgress > 0 && s.totalProgress < 100
  }))

  const fileList = Object.values(files)

  return (
    <Card className="flex-1 border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-primary">
          <HardDrive className="w-4 h-4" />
          方式 2: 大文件续传 | Option 2: Tus Resumable
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full border-dashed" onClick={() => (document.getElementById('uppy-in') as HTMLInputElement).click()}>
          选择大文件 | Select Large Files
          <input id="uppy-in" type="file" hidden onChange={(e) => {
             Array.from(e.target.files || []).forEach(f => uppyInstance.addFile({ data: f, name: f.name, type: f.type }))
          }} />
        </Button>
        
        <div className="space-y-2">
          {fileList.map((f) => (
            <div key={f.id} className="text-xs flex flex-col gap-1 border-b pb-2">
              <div className="flex justify-between">
                <span className="truncate font-medium">{f.name}</span>
                <span>{(f.size ?? 0) > 0 ? ((f.size ?? 0) / 1024 / 1024).toFixed(2) : "0"} MB</span>
              </div>
              <Progress value={f.progress?.percentage ?? 0} className="h-1" />
            </div>
          ))}
        </div>

        <Button className="w-full" size="sm" onClick={() => uppyInstance.upload()} disabled={fileList.length === 0 || isUploadStarted}>
          {isUploadStarted ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          开始大文件上传 | Start Large Upload
        </Button>
      </CardContent>
    </Card>
  )
}

// --- 主页面 | Main Page ---
export default function UploadShowcase() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">上传方案对比 | Upload Solutions Comparison</h1>
        <p className="text-muted-foreground text-sm">根据文件大小选择合适的技术 | Choose the right tech based on file size</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <DropzoneStandard />
        <UppyTus />
      </div>
    </div>
  )
}