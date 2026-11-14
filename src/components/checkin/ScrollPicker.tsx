'use client'

import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

interface ScrollPickerProps {
  items: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
  className?: string
  label?: string
  loop?: boolean
}

const ITEM_HEIGHT = 48
const REPEATS = 25
const MID_CYCLE = 12

export function ScrollPicker({
  items,
  value,
  onChange,
  className = '',
  label,
  loop = true,
}: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAdjustingRef = useRef(false)

  const N = items.length

  // Build repeated items for infinite circular wheel
  const displayItems = useMemo(() => {
    if (!loop || N === 0) return items.map((it, i) => ({ ...it, idx: i, cycle: 0 }))
    const res = []
    for (let c = 0; c < REPEATS; c++) {
      for (let i = 0; i < N; i++) {
        res.push({
          ...items[i],
          idx: c * N + i,
          originalIndex: i,
          cycle: c,
        })
      }
    }
    return res
  }, [items, loop, N])

  const getTargetScrollTop = useCallback(
    (val: number) => {
      const originalIdx = items.findIndex((it) => it.value === val)
      const base = originalIdx >= 0 ? originalIdx : 0
      if (!loop) return base * ITEM_HEIGHT
      return (MID_CYCLE * N + base) * ITEM_HEIGHT
    },
    [items, loop, N]
  )

  // Scroll to current value on mount or when items count changes
  useEffect(() => {
    if (N === 0) return
    const top = getTargetScrollTop(value)
    if (containerRef.current) {
      containerRef.current.scrollTop = top
    }
  }, [N]) // eslint-disable-line react-hooks/exhaustive-deps

  // When value changes from outside, scroll smoothly if not currently user-scrolling
  useEffect(() => {
    if (isUserScrollingRef.current || isAdjustingRef.current || N === 0) return
    if (!containerRef.current) return

    const currentScrollTop = containerRef.current.scrollTop
    const currentNearestIdx = Math.round(currentScrollTop / ITEM_HEIGHT)
    const currentVal = items[((currentNearestIdx % N) + N) % N]?.value
    if (currentVal === value) return

    const targetTop = getTargetScrollTop(value)
    containerRef.current.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    })
  }, [value, getTargetScrollTop, N, items])

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isAdjustingRef.current || N === 0) return
    isUserScrollingRef.current = true

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return

      const scrollTop = containerRef.current.scrollTop
      const rawIdx = scrollTop / ITEM_HEIGHT
      const nearestIdx = Math.round(rawIdx)

      if (loop) {
        const originalIdx = ((nearestIdx % N) + N) % N
        const selectedItem = items[originalIdx]
        if (selectedItem) {
          onChange(selectedItem.value)
        }

        // Snap to nearest position
        containerRef.current.scrollTo({
          top: nearestIdx * ITEM_HEIGHT,
          behavior: 'smooth',
        })

        // Check if we need to silently re-center back to MID_CYCLE
        const currentCycle = Math.floor(nearestIdx / N)
        if (currentCycle < 4 || currentCycle > 20) {
          setTimeout(() => {
            if (!containerRef.current) return
            isAdjustingRef.current = true
            const normalizedTop = (MID_CYCLE * N + originalIdx) * ITEM_HEIGHT
            containerRef.current.scrollTop = normalizedTop
            setTimeout(() => {
              isAdjustingRef.current = false
              isUserScrollingRef.current = false
            }, 50)
          }, 150)
        } else {
          isUserScrollingRef.current = false
        }
      } else {
        const clampedIdx = Math.max(0, Math.min(nearestIdx, N - 1))
        containerRef.current.scrollTo({
          top: clampedIdx * ITEM_HEIGHT,
          behavior: 'smooth',
        })
        if (items[clampedIdx]) {
          onChange(items[clampedIdx].value)
        }
        isUserScrollingRef.current = false
      }
    }, 90)
  }, [items, loop, N, onChange])

  const handleItemClick = (displayIdx: number, val: number) => {
    if (!containerRef.current) return
    isUserScrollingRef.current = true
    containerRef.current.scrollTo({
      top: displayIdx * ITEM_HEIGHT,
      behavior: 'smooth',
    })
    onChange(val)
    setTimeout(() => {
      isUserScrollingRef.current = false
    }, 300)
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {label && <p className="text-xs text-gray-400 font-medium tracking-wider mb-1">{label}</p>}
      <div
        className="relative w-16 overflow-hidden rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-inner"
        style={{ height: ITEM_HEIGHT * 3 }}
      >
        {/* Top/bottom gradient fade */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#141414] via-[#141414]/70 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-transparent pointer-events-none z-10" />

        {/* Selection highlight bar */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10 border-y border-violet-500/60 bg-violet-600/15"
          style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
        />

        {/* Scrollable list */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll scrollbar-none select-none"
          style={{
            scrollSnapType: 'y mandatory',
            paddingTop: ITEM_HEIGHT,
            paddingBottom: ITEM_HEIGHT,
          }}
        >
          {displayItems.map((item, i) => {
            const isSelected = item.value === value
            return (
              <div
                key={`${item.value}-${i}`}
                onClick={() => handleItemClick(i, item.value)}
                className="flex items-center justify-center cursor-pointer transition-all duration-150"
                style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'start' }}
              >
                <span
                  className={`text-lg font-mono font-semibold transition-all duration-150 ${
                    isSelected
                      ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Date Picker ─────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: Date
  onChange: (d: Date) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const daysInMonth = getDaysInMonth(value.getFullYear(), value.getMonth())
  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1).padStart(2, '0'),
        value: i + 1,
      })),
    [daysInMonth]
  )

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: String(i + 1).padStart(2, '0'),
        value: i + 1,
      })),
    []
  )

  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        label: String(currentYear - 2 + i),
        value: currentYear - 2 + i,
      })),
    [currentYear]
  )

  const setDay = (d: number) => {
    const nd = new Date(value)
    nd.setDate(d)
    onChange(nd)
  }

  const setMonth = (m: number) => {
    const nd = new Date(value)
    nd.setMonth(m - 1)
    const maxDay = getDaysInMonth(nd.getFullYear(), nd.getMonth())
    if (nd.getDate() > maxDay) nd.setDate(maxDay)
    onChange(nd)
  }

  const setYear = (y: number) => {
    const nd = new Date(value)
    nd.setFullYear(y)
    const maxDay = getDaysInMonth(y, nd.getMonth())
    if (nd.getDate() > maxDay) nd.setDate(maxDay)
    onChange(nd)
  }

  return (
    <div className="flex gap-2 items-end justify-center">
      <ScrollPicker items={days} value={value.getDate()} onChange={setDay} label="Ngày" loop={true} />
      <span className="text-gray-600 pb-6 text-xl">/</span>
      <ScrollPicker items={months} value={value.getMonth() + 1} onChange={setMonth} label="Tháng" loop={true} />
      <span className="text-gray-600 pb-6 text-xl">/</span>
      <ScrollPicker
        items={years}
        value={value.getFullYear()}
        onChange={setYear}
        label="Năm"
        loop={true}
        className="!w-20"
      />
    </div>
  )
}

// ─── Time Picker ─────────────────────────────────────────────────────────────

interface TimePickerProps {
  hour: number
  minute: number
  onHourChange: (h: number) => void
  onMinuteChange: (m: number) => void
}

export function TimePicker({ hour, minute, onHourChange, onMinuteChange }: TimePickerProps) {
  const hours = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        label: String(i).padStart(2, '0'),
        value: i,
      })),
    []
  )

  const minutes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: String(i * 5).padStart(2, '0'),
        value: i * 5,
      })),
    []
  )

  return (
    <div className="flex gap-2 items-end justify-center">
      <ScrollPicker items={hours} value={hour} onChange={onHourChange} label="Giờ" loop={true} />
      <span className="text-gray-600 pb-6 text-2xl font-bold">:</span>
      <ScrollPicker items={minutes} value={minute} onChange={onMinuteChange} label="Phút" loop={true} />
    </div>
  )
}

// ─── Animated Number for Celebration ─────────────────────────────────────────

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {value.toLocaleString('vi-VN')}
      {suffix}
    </motion.span>
  )
}
