'use client'

// Copy-to-clipboard buttons for a publication's Chicago citation and BibTeX.
import { useState } from 'react'
import { s } from '@/lib/style'

function CopyBox({ label, text, mono }: { label: string; text: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try { navigator.clipboard.writeText(text) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div style={s('display:flex;flex-direction:column;gap:10px')}>
      <div style={s('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
        <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#a39a8f")}>{label}</span>
        <button type="button" onClick={copy} style={s(`font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;color:${copied ? '#0f8a6f' : '#16142e'};background:#fff;border:1px solid #d9d3ca;padding:7px 13px;border-radius:7px;transition:color .2s`)}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre style={s(`margin:0;white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #e7e3dd;border-radius:9px;padding:14px 16px;font-size:${mono ? '12.5px' : '13.5px'};line-height:1.55;color:#44403c;${mono ? "font-family:'JetBrains Mono',monospace" : "font-family:Georgia,'Times New Roman',serif"}`)}>{text}</pre>
    </div>
  )
}

export default function PubActions({ chicago, bibtex }: { chicago: string; bibtex: string }) {
  return (
    <div style={s('display:flex;flex-direction:column;gap:22px')}>
      <CopyBox label="Chicago citation" text={chicago} />
      <CopyBox label="BibTeX" text={bibtex} mono />
    </div>
  )
}
