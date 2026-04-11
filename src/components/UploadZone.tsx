import { useRef, useState, useCallback } from 'react'

interface UploadZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export default function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const pdfs = Array.from(fileList).filter(
        (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'),
      )
      if (pdfs.length) onFiles(pdfs)
    },
    [onFiles],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
        transition-all duration-200 select-none
        ${dragging
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
          : 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className={`text-5xl transition-transform duration-200 ${dragging ? 'scale-110' : ''}`}>
          📄
        </div>
        <p className="text-lg font-semibold text-gray-200">
          {dragging ? 'Drop CVs here' : 'Upload CVs'}
        </p>
        <p className="text-sm text-gray-500">
          Drag & drop PDF files here, or click to browse
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Supports multiple files · PDF only
        </p>
      </div>
    </div>
  )
}
