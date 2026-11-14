'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ScrollPickerProps {
  items: { label: string; value: number }[]
  value: number
  onChange: (v: number) => void
  className?: string
  label?: string
}

const ITEM_HEIGHT = 48

export function ScrollPicker({ items, value, onChange, className = '', label }: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getIndexByValue = useCallback(
    (v: number) => items.findIndex((item) => item.value === v),
    [items]
  )

  // Scroll to selected item
  const scrollToIndex = useCallback((index: number, smooth = false) => {
    if (!containerRef.current) return
    containerRef.current.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }, [])

  // Initial scroll
  useEffect(() => {
    const index = getIndexByValue(value)
    if (index >= 0) scrollToIndex(index)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to value when it changes externally
  useEffect(() => {
    if (isScrollingRef.current) return
    const index = getIndexByValue(value)
    if (index >= 0) scrollToIndex(index, true)
  }, [value, getIndexByValue, scrollToIndex])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    isScrollingRef.current = true

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return
      const rawIndex = containerRef.current.scrollTop / ITEM_HEIGHT
      const index = Math.round(rawIndex)
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1))

      // Snap
      scrollToIndex(clampedIndex, true)
      onChange(items[clampedIndex].value)
      isScrollingRef.current = false
    }, 120)
  }, [items, onChange, scrollToIndex])

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {label && <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>}
      <div className="relative w-16 overflow-hidden" style={{ height: ITEM_HEIGHT * 3 }}>
        {/* Top/bottom fade */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#111] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#111] to-transparent pointer-events-none z-10" />
        {/* Selection highlight */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10 border-y border-violet-500/50 bg-violet-600/10"
          style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
        />
        {/* Scrollable list */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll scrollbar-none scroll-smooth"
          style={{ scrollSnapType: 'y mandatory', paddingTop: ITEM_HEIGHT, paddingBottom: ITEM_HEIGHT }}
        >
          {items.map((item, i) => {
            const isSelected = item.value === value
            return (
              <div
                key={item.value}
                onClick={() => {
                  scrollToIndex(i, true)
                  onChange(item.value)
                }}
                className="flex items-center justify-center cursor-pointer transition-all duration-200"
                style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'start' }}
              >
                <span
                  className={`text-lg font-mono font-semibold transition-all duration-200 ${
                    isSelected ? 'text-white scale-110' : 'text-gray-600'
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

// Date Picker
interface DatePickerProps {
  value: Date
  onChange: (d: Date) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const days = Array.from({ length: getDaysInMonth(value.getFullYear(), value.getMonth()) }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: i + 1,
  }))
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: i + 1,
  }))
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i,
  }))

  const setDay = (d: number) => {
    const nd = new Date(value)
    nd.setDate(d)
    onChange(nd)
  }
  const setMonth = (m: number) => {
    const nd = new Date(value)
    nd.setMonth(m - 1)
    // Clamp day
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
      <ScrollPicker items={days} value={value.getDate()} onChange={setDay} label="Ngày" />
      <span className="text-gray-600 pb-6 text-xl">/</span>
      <ScrollPicker items={months} value={value.getMonth() + 1} onChange={setMonth} label="Tháng" />
      <span className="text-gray-600 pb-6 text-xl">/</span>
      <ScrollPicker
        items={years}
        value={value.getFullYear()}
        onChange={setYear}
        label="Năm"
        className="!w-20"
      />
    </div>
  )
}

// Time Picker
interface TimePickerProps {
  hour: number
  minute: number
  onHourChange: (h: number) => void
  onMinuteChange: (m: number) => void
}

export function TimePicker({ hour, minute, onHourChange, onMinuteChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    label: String(i).padStart(2, '0'),
    value: i,
  }))
  const minutes = Array.from({ length: 12 }, (_, i) => ({
    label: String(i * 5).padStart(2, '0'),
    value: i * 5,
  }))

  return (
    <div className="flex gap-2 items-end justify-center">
      <ScrollPicker items={hours} value={hour} onChange={onHourChange} label="Giờ" />
      <span className="text-gray-600 pb-6 text-2xl font-bold">:</span>
      <ScrollPicker items={minutes} value={minute} onChange={onMinuteChange} label="Phút" />
    </div>
  )
}

// Animated number for celebration
export function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{value.toLocaleString('vi-VN')}{suffix}
    </motion.span>
  )
}
