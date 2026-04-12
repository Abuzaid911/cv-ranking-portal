import { useRef, useState, useCallback } from 'react'
import { IconUpload, IconDocument } from './Icons'

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
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click() }}
      aria-label="Upload CV files"
      className={[
        'relative border-2 border-dashed rounded-2xl p-10 text-center select-none',
        'transition-all duration-200 ease-out',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 focus:ring-offset-[#020817]',
        dragging
          ? 'border-[#0EA5E9] bg-[#0EA5E9]/8 glow-accent-sm scale-[1.01]'
          : disabled
            ? 'border-[#334155] bg-[#0F172A]'
            : 'border-[#334155] bg-[#0F172A] hover:border-[#0EA5E9]/60 hover:bg-[#0EA5E9]/5',
      ].join(' ')}
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

      <div className="flex flex-col items-center gap-4 pointer-events-none">
        {/* Icon cluster */}
        <div className={`relative transition-transform duration-200 ${dragging ? 'scale-110' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
            {dragging
              ? <IconDocument className="w-8 h-8 text-[#0EA5E9]" />
              : <IconUpload className="w-8 h-8 text-[#0EA5E9]" />
            }
          </div>
          {/* Subtle glow ring when dragging */}
          {dragging && (
            <div className="absolute inset-0 rounded-2xl ring-2 ring-[#0EA5E9]/40 animate-pulse" />
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold text-[#F8FAFC]">
            {dragging ? 'Drop CVs here' : 'Upload CVs'}
          </p>
          <p className="text-sm text-[#94A3B8]">
            Drag & drop PDF files, or{' '}
            <span className="text-[#0EA5E9] font-medium underline underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-[#334155] pt-1">
            Multiple files supported · PDF only
          </p>
        </div>
      </div>
    </div>
  )
}
