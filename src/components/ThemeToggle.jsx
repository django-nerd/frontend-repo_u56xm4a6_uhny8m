import { useEffect, useState } from 'react'
import { Moon, Sun, Laptop2 } from 'lucide-react'

function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function ThemeToggle({ className = '' }) {
  const [mode, setMode] = useState('dark') // default dark

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setMode(saved)
      applyTheme(saved)
    } else {
      setMode('dark')
      applyTheme('dark')
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (localStorage.getItem('theme') === 'system') applyTheme('system')
    }
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const applyTheme = (val) => {
    const root = document.documentElement
    if (val === 'system') {
      const dark = getSystemPrefersDark()
      root.classList.toggle('dark', dark)
    } else {
      root.classList.toggle('dark', val === 'dark')
    }
  }

  const select = (val) => {
    setMode(val)
    localStorage.setItem('theme', val)
    applyTheme(val)
  }

  const itemClass = (active) => `inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors border ${
    active ? 'bg-black text-white border-black' : 'bg-white/70 border-gray-200 hover:bg-gray-50 text-gray-700'
  }`

  return (
    <div className={`rounded-full backdrop-blur bg-white/70 border border-gray-200 p-1 shadow-sm ${className}`}>
      <div className="flex items-center gap-1">
        <button className={itemClass(mode === 'light')} onClick={() => select('light')} aria-label="Light mode">
          <Sun size={16} /> Light
        </button>
        <button className={itemClass(mode === 'dark')} onClick={() => select('dark')} aria-label="Dark mode">
          <Moon size={16} /> Dark
        </button>
        <button className={itemClass(mode === 'system')} onClick={() => select('system')} aria-label="System theme">
          <Laptop2 size={16} /> System
        </button>
      </div>
    </div>
  )
}
