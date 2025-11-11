import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Mic, Send, Sparkles, Star, ChevronRight, ChevronDown,
  Menu, Check, Plus, Award, Layers, SlidersHorizontal
} from 'lucide-react'
import ThemeToggle from './components/ThemeToggle'

function RatingStars({ value = 0, size = 14 }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < full
              ? 'text-amber-400 fill-amber-400'
              : i === full && half
              ? 'text-amber-300 fill-amber-300'
              : 'text-gray-300 dark:text-neutral-700'
          }
        />
      ))}
      <span className="ml-1 text-xs text-gray-500 dark:text-neutral-400">{value.toFixed(1)}</span>
    </div>
  )
}

function ProductCard({ item, selected, onToggleSelect }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className={
        'group relative rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm hover:shadow-md transition-all ' +
        'hover:-translate-y-0.5'
      }
    >
      <div className="absolute top-3 right-3">
        <button
          onClick={onToggleSelect}
          className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${selected ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700 dark:hover:border-neutral-600'}`}
          aria-label={selected ? 'Deselect' : 'Select for compare'}
        >
          {selected ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50 dark:bg-neutral-800">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">{item.title}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">{item.category}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">${item.price.toFixed(0)}</div>
          <RatingStars value={item.rating ?? 4.6} />
        </div>
      </div>
      {item.specs?.length ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {item.specs.slice(0, 4).map((s, i) => (
              <span key={i} className="inline-flex items-center rounded-full border border-gray-200 dark:border-neutral-700 px-2 py-0.5 text-[10px] text-gray-600 dark:text-neutral-300 bg-white dark:bg-neutral-900">
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {item.retailers?.length ? (
        <div className="mt-3 border-t border-gray-100 dark:border-neutral-800 pt-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {item.retailers.map((r, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 border ${r.best ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                {r.name} · ${r.price}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-3">
        <div className="relative group/why">
          <div className="text-xs text-gray-500 dark:text-neutral-400 inline-flex items-center gap-1">
            <Sparkles size={14} className="text-blue-500" /> Why we recommend this
          </div>
          <div className="pointer-events-none opacity-0 group-hover/why:opacity-100 transition-opacity">
            <div className="absolute z-10 mt-2 w-64 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-xs text-gray-600 dark:text-neutral-300 shadow-xl">
              Balanced performance-to-price, reliable brand support, and strong user feedback.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I’m your shopping expert. Tell me what you’re looking for — I’ll summarize the best options and show top picks.",
      summary: 'Premium overview tailored to your goals',
      insights: [
        'I’ll give you a quick summary first, then details on demand.',
        'You’ll see prices across retailers with best price highlighted.',
        'Tap compare to line up specs instantly.'
      ],
      suggestions: []
    }
  ])
  const [trending, setTrending] = useState([])
  const [essentials, setEssentials] = useState([])
  const [picks, setPicks] = useState([])
  const [selections, setSelections] = useState([])
  const [showSummary, setShowSummary] = useState(true)
  const [listening, setListening] = useState(false)
  const [achievement, setAchievement] = useState(null)
  const chatEndRef = useRef(null)
  const userId = 'demo-user-1'

  useEffect(() => {
    fetch(`${baseUrl}/api/trending`).then(r => r.json()).then(setTrending).catch(() => {})
    fetch(`${baseUrl}/api/essentials`).then(r => r.json()).then(setEssentials).catch(() => {})
    fetch(`${baseUrl}/api/picks/${userId}`).then(r => r.json()).then(setPicks).catch(() => {})
  }, [baseUrl])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const quickActions = useMemo(() => [
    'Best earbuds under $150', 'Quietest vacuum for apartments', 'Sleek desk lamp', 'Travel essentials kit'
  ], [])

  const smartSearch = useMemo(() => trending.slice(0, 4).map(t => t.title), [trending])

  const sendMessage = async (text) => {
    const message = (text ?? query).trim()
    if (!message) return
    setQuery('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: message }])
    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message })
      })
      const data = await res.json()
      const assistantMsg = {
        role: 'assistant',
        content: 'Here are refined picks tailored to your request.',
        summary: data.summary,
        suggestions: data.suggestions || [],
        insights: data.insights || []
      }
      setMessages(prev => [...prev, assistantMsg])
      if ((data.suggestions || []).length >= 2) {
        setAchievement({ title: 'Smart Move', desc: 'Compared multiple options for best value.' })
        setTimeout(() => setAchievement(null), 2600)
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Having trouble reaching the server. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (title) => {
    setSelections((sel) => sel.includes(title) ? sel.filter(t => t !== title) : [...sel, title])
  }

  const startVoice = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return alert('Voice input not supported in this environment.')
    }
    try {
      setListening(true)
      setTimeout(() => {
        setListening(false)
        setQuery(q => q || 'Find premium noise‑cancelling earbuds for commuting')
      }, 1500)
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setListening(false)
    }
  }

  const compareItems = () => {
    setMessages(prev => [...prev, { role: 'assistant', content: `Comparing ${selections.length} items: ${selections.join(', ')}. Prioritizing value, reliability, and warranty coverage.` }])
    setSelections([])
  }

  return (
    <div className="min-h-screen surface text-basecolor transition-colors">
      {/* Floating theme toggle (desktop) */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-40 bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur border-b border-gray-100 dark:border-neutral-800 px-4 py-3 flex items-center gap-3 md:hidden">
        <button onClick={() => setSidebarOpen(s => !s)} className="h-9 w-9 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 bg-white/70 dark:bg-neutral-900/60 flex items-center justify-center">
          <Menu size={18} />
        </button>
        <div className="font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Shopping Assistant</div>
        <div className="ml-auto"><ThemeToggle /></div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[300px,1fr]">
        {/* Sidebar */}
        <aside className={`border-r border-gray-100 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur md:static fixed inset-y-0 left-0 z-30 w-[80%] md:w-auto transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="hidden md:block h-16" />
          <div className="p-4 md:p-6 space-y-8">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-3">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((qa, i) => (
                  <button key={i} onClick={() => sendMessage(qa)} className="rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs px-3 py-1.5 transition-colors">
                    {qa}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-3">Trending This Week</div>
              <div className="space-y-3">
                {trending.map((t, i) => (
                  <button key={i} onClick={() => sendMessage(`Find ${t.title.toLowerCase()}`)} className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 hover:shadow-sm transition">
                    <img src={t.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-neutral-100 line-clamp-1">{t.title}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">${t.price.toFixed(0)} · {t.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-3">Daily Essentials</div>
              <div className="grid grid-cols-2 gap-3">
                {essentials.map((t, i) => (
                  <button key={i} onClick={() => sendMessage(`Best ${t.title.toLowerCase()}`)} className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 hover:shadow-sm transition">
                    <img src={t.image} alt="" className="h-9 w-9 rounded-md object-cover" />
                    <div className="text-left">
                      <div className="text-[11px] font-medium text-gray-900 dark:text-neutral-100 line-clamp-2 leading-4">{t.title}</div>
                      <div className="text-[10px] text-gray-500 dark:text-neutral-400">${t.price.toFixed(0)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-3">Personal Picks</div>
              <div className="space-y-3">
                {picks.map((t, i) => (
                  <button key={i} onClick={() => sendMessage(`Recommend a ${t.title.toLowerCase()}`)} className="w-full flex items-center gap-3 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 hover:shadow-sm transition">
                    <img src={t.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-neutral-100 line-clamp-1">{t.title}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">{t.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Chat pane */}
        <main className="min-h-screen p-4 md:p-8">
          <div className="mx-auto max-w-3xl">
            {/* Header */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Your personal shopping expert</h1>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Structured, premium recommendations — facts first, opinions clearly marked.</p>
              </div>
            </div>

            {/* Smart search suggestions */}
            {smartSearch.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {smartSearch.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800/70">
                    <SlidersHorizontal className="inline mr-1" size={12} /> {s}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            <div className="space-y-6">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${m.role === 'user' ? 'bg-black text-white rounded-br-sm' : 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 border border-gray-100 dark:border-neutral-800 rounded-bl-sm'}`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    {m.role === 'assistant' && (m.summary || (m.insights && m.insights.length > 0)) && (
                      <div className="mt-3">
                        <button onClick={() => setShowSummary(s => !s)} className="text-xs text-gray-500 dark:text-neutral-400 inline-flex items-center gap-1">
                          {showSummary ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Research Summary
                        </button>
                        <AnimatePresence initial={false}>
                          {showSummary && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              {m.summary && <p className="mt-2 text-sm text-gray-700 dark:text-neutral-300">{m.summary}</p>}
                              {m.insights?.length ? (
                                <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-neutral-300 list-disc pl-5">
                                  {m.insights.map((i, k) => <li key={k}>{i}</li>)}
                                </ul>
                              ) : null}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {m.suggestions?.length ? (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {m.suggestions.map((p, pi) => (
                          <ProductCard
                            key={pi}
                            item={p}
                            selected={selections.includes(p.title)}
                            onToggleSelect={() => toggleSelect(p.title)}
                          />
                        ))}
                      </div>
                    ) : null}

                    {m.suggestions?.length ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button onClick={() => sendMessage('Find better alternatives to these')} className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-black">
                          <Layers size={14} /> Find Better Alternatives
                        </button>
                        <button onClick={() => setShowSummary(true)} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800/70">
                          <Sparkles size={14} className="text-blue-500" /> Ask for a deeper analysis
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                      <Sparkles size={16} className="text-blue-500" /> Thinking…
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Composer */}
            <div className="sticky bottom-0 pt-6 bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent dark:from-neutral-950 dark:via-neutral-950">
              <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-gray-400 dark:text-neutral-500 ml-1" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                    placeholder="What are you shopping for today?"
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-gray-900 dark:text-neutral-100"
                  />
                  <button onClick={startVoice} className={`h-9 w-9 rounded-xl border ${listening ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300' : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800/70'} flex items-center justify-center`} aria-label="Voice input">
                    <Mic size={16} />
                  </button>
                  <button onClick={() => sendMessage()} className="h-9 rounded-xl bg-black text-white px-3 inline-flex items-center gap-1.5 text-sm hover:bg-gray-900">
                    <Send size={14} />
                    Send
                  </button>
                </div>
              </div>
              {/* helper suggestions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[...quickActions.slice(0,2), ...smartSearch.slice(0,2)].map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs px-3 py-1.5 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Compare bar */}
      <AnimatePresence>
        {selections.length > 0 && (
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
            <div className="rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg px-3 py-2 flex items-center gap-3">
              <div className="text-sm text-gray-700 dark:text-neutral-200">{selections.length} selected</div>
              <button onClick={compareItems} className="rounded-full bg-black text-white text-sm px-3 py-1.5 hover:bg-gray-900">
                Compare
              </button>
              <button onClick={() => setSelections([])} className="rounded-full border border-gray-200 dark:border-neutral-800 text-sm px-3 py-1.5 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800/70 text-gray-700 dark:text-neutral-200">
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement toast */}
      <AnimatePresence>
        {achievement && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="fixed bottom-20 right-4 z-40">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/10 px-4 py-3 shadow">
              <Award className="text-emerald-600 dark:text-emerald-300" size={18} />
              <div>
                <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{achievement.title}</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300/90">{achievement.desc}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
