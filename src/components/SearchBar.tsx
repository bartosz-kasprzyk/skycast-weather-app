import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, Search } from 'lucide-react'
import type { GeocodingPlace } from '../types/openMeteo'

export function SearchBar(props: {
  placeholder?: string
  isLoading?: boolean
  debounceMs?: number
  minChars?: number
  fetchOptions: (query: string) => Promise<GeocodingPlace[]>
  onSelect: (place: GeocodingPlace) => void | Promise<void>
}) {
  const id = useId()
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<GeocodingPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [lastSelectedLabel, setLastSelectedLabel] = useState<string>('')
  const reqIdRef = useRef(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const suppressNextFetchRef = useRef(false)
  const restoreOnCancelRef = useRef<string>('')
  const didCommitSelectionRef = useRef(false)

  const debounceMs = props.debounceMs ?? 250
  const minChars = props.minChars ?? 2

  const normalized = useMemo(() => value.trim(), [value])

  useEffect(() => {
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false
      return
    }
    if (!normalized) {
      setOptions([])
      setActiveIndex(-1)
      setIsOpen(false)
      return
    }
    if (normalized === lastSelectedLabel.trim()) {
      setOptions([])
      setActiveIndex(-1)
      setIsOpen(false)
      setIsSearching(false)
      return
    }
    if (normalized.length < minChars) {
      setOptions([])
      setActiveIndex(-1)
      setIsOpen(false)
      setIsSearching(false)
      return
    }

    const myReqId = ++reqIdRef.current
    setIsSearching(true)
    const t = window.setTimeout(() => {
      props.fetchOptions(normalized)
        .then((results) => {
          if (reqIdRef.current !== myReqId) return
          setOptions(results)
          setActiveIndex(results.length > 0 ? 0 : -1)
          setIsOpen(true)
        })
        .catch(() => {
          if (reqIdRef.current !== myReqId) return
          setOptions([])
          setActiveIndex(-1)
          setIsOpen(true)
        })
        .finally(() => {
          if (reqIdRef.current !== myReqId) return
          setIsSearching(false)
        })
    }, debounceMs)

    return () => {
      window.clearTimeout(t)
    }
  }, [debounceMs, normalized, minChars, lastSelectedLabel, props.fetchOptions])

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target as Node)) return
      setIsOpen(false)
      setActiveIndex(-1)
      // If user clicked away without selecting and left input empty, restore.
      if (!didCommitSelectionRef.current && value.trim().length === 0) {
        const restore = restoreOnCancelRef.current
        if (restore) {
          suppressNextFetchRef.current = true
          setOptions([])
          setIsSearching(false)
          setValue(restore)
        }
      }
      didCommitSelectionRef.current = false
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [value])

  async function select(place: GeocodingPlace) {
    // Invalidate any in-flight searches so late responses can't reopen the dropdown.
    reqIdRef.current++
    didCommitSelectionRef.current = true
    setIsOpen(false)
    setActiveIndex(-1)
    const label = `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}`
    setLastSelectedLabel(label)
    suppressNextFetchRef.current = true
    setOptions([])
    setIsSearching(false)
    setValue(label)
    inputRef.current?.blur()
    await props.onSelect(place)
  }

  const showDropdown = isOpen && normalized.length >= minChars

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        City search
      </label>
      <div className="glass-muted flex items-center gap-2 rounded-xl px-3 py-2">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          id={id}
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            didCommitSelectionRef.current = false
            // If focused while showing a selected city, clear it for quick typing,
            // but remember it so we can restore on cancel.
            if (value.trim() && value.trim() === lastSelectedLabel.trim()) {
              restoreOnCancelRef.current = value
              suppressNextFetchRef.current = true
              setOptions([])
              setActiveIndex(-1)
              setIsOpen(false)
              setIsSearching(false)
              setValue('')
              return
            }
            if (normalized.length >= minChars) setIsOpen(true)
          }}
          onKeyDown={(e) => {
            if (!showDropdown) return
            if (e.key === 'Escape') {
              setIsOpen(false)
              setActiveIndex(-1)
              // Cancel editing and restore if we had a selected label.
              if (!didCommitSelectionRef.current && value.trim().length === 0) {
                const restore = restoreOnCancelRef.current
                if (restore) {
                  suppressNextFetchRef.current = true
                  setOptions([])
                  setIsSearching(false)
                  setValue(restore)
                }
              }
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => Math.min(options.length - 1, Math.max(0, i + 1)))
              return
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => Math.max(0, i - 1))
              return
            }
            if (e.key === 'Enter') {
              const opt = options[activeIndex]
              if (opt) {
                e.preventDefault()
                void select(opt)
              }
            }
          }}
          placeholder={props.placeholder ?? 'Search...'}
          className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${id}-listbox`}
        />
        <div className="text-xs font-semibold text-zinc-400">
          {props.isLoading || isSearching ? '…' : null}
        </div>
      </div>

      {showDropdown ? (
        <div
          className="glass absolute z-50 mt-2 w-full overflow-hidden rounded-2xl p-1"
          role="listbox"
          id={`${id}-listbox`}
        >
          {options.length === 0 && !isSearching ? (
            <div className="px-3 py-2 text-xs text-zinc-400">No matches</div>
          ) : (
            options.slice(0, 6).map((opt, idx) => {
              const label = `${opt.name}${opt.admin1 ? `, ${opt.admin1}` : ''}`
              const sub = `${opt.country}`
              const isActive = idx === activeIndex
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={[
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition',
                    isActive ? 'bg-zinc-800/70' : 'hover:bg-zinc-800/40',
                  ].join(' ')}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => void select(opt)}
                  role="option"
                  aria-selected={isActive}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {label}
                    </div>
                    <div className="truncate text-xs text-zinc-500">{sub}</div>
                  </div>
                  {isActive ? <Check className="h-4 w-4 text-sky-400" /> : null}
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}

