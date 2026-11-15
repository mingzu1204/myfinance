'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  Moon,
  Sun,
  Filter,
  CheckCircle2,
  Clock3,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  X,
  Trash2,
} from 'lucide-react'
import { formatVND, formatHours } from '@/lib/calculations'
import { WorkSession, JobPreset } from '@/lib/types'
import { parsePresetMeta } from '@/lib/metadata'
import { BrandIcon } from '@/lib/iconRegistry'
import toast from 'react-hot-toast'

export default function WorkHistory() {
  const [sessions, setSessions] = useState<WorkSession[]>([])
  const [presets, setPresets] = useState<JobPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all')

  // Calendar specific state
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())
  const [selectedDayModal, setSelectedDayModal] = useState<{
    dateStr: string
    sessions: WorkSession[]
  } | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resSessions, resPresets] = await Promise.all([
        fetch('/api/sessions?limit=300', { cache: 'no-store' }),
        fetch('/api/presets', { cache: 'no-store' }),
      ])

      if (resSessions.ok) {
        const data = await resSessions.json()
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setSessions(list)
      }

      if (resPresets.ok) {
        const data = await resPresets.json()
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setPresets(list)
      }
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải lịch sử chấm công')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Presets mapping dictionary for quick lookup
  const presetsMap = useMemo(() => {
    const map: Record<string, JobPreset> = {}
    presets.forEach((p) => {
      if (p.id) map[p.id] = p
    })
    return map
  }, [presets])

  // Extract unique months from sessions (YYYY-MM)
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    sessions.forEach((s) => {
      if (s.work_date) {
        const m = s.work_date.substring(0, 7) // 'YYYY-MM'
        set.add(m)
      }
    })
    return Array.from(set).sort().reverse()
  }, [sessions])

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedPresetId !== 'all' && s.preset_id !== selectedPresetId) return false
      if (selectedMonth !== 'all' && !s.work_date.startsWith(selectedMonth)) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [sessions, selectedPresetId, selectedMonth, statusFilter])

  // Summary statistics
  const summary = useMemo(() => {
    const totalHours = filteredSessions.reduce((acc, s) => acc + Number(s.total_hours || 0), 0)
    const nightHours = filteredSessions.reduce((acc, s) => acc + Number(s.night_hours || 0), 0)
    const dayHours = filteredSessions.reduce((acc, s) => acc + Number(s.day_hours || 0), 0)
    const totalAmount = filteredSessions.reduce((acc, s) => acc + Number(s.calculated_amount || 0), 0)
    return { totalHours, nightHours, dayHours, totalAmount, count: filteredSessions.length }
  }, [filteredSessions])

  // Group by date for List View
  const groupedSessions = useMemo(() => {
    const map = new Map<string, WorkSession[]>()
    filteredSessions.forEach((s) => {
      const dateKey = s.work_date
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(s)
    })
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredSessions])

  // Sessions map by date for Calendar View
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkSession[]>()
    filteredSessions.forEach((s) => {
      const dateKey = s.work_date
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(s)
    })
    return map
  }, [filteredSessions])

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-')
      const d = new Date(Number(year), Number(month) - 1, Number(day))
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
      return `${daysOfWeek[d.getDay()]}, ${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const formatTimeOnly = (isoString: string) => {
    try {
      const d = new Date(isoString)
      const hours = String(d.getHours()).padStart(2, '0')
      const mins = String(d.getMinutes()).padStart(2, '0')
      return `${hours}:${mins}`
    } catch {
      return '--:--'
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ca làm việc này?')) return
    setDeletingSessionId(sessionId)
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Đã xóa ca làm việc')
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (selectedDayModal) {
        const remaining = selectedDayModal.sessions.filter((s) => s.id !== sessionId)
        if (remaining.length === 0) {
          setSelectedDayModal(null)
        } else {
          setSelectedDayModal({ ...selectedDayModal, sessions: remaining })
        }
      }
    } catch {
      toast.error('Không thể xóa ca làm việc')
    } finally {
      setDeletingSessionId(null)
    }
  }

  // Calendar calculations
  const calYear = currentCalendarDate.getFullYear()
  const calMonth = currentCalendarDate.getMonth() // 0 - 11

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calYear, calMonth, 1)
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

    // In Vietnam, week starts Monday (0: Mon, 1: Tue ... 6: Sun)
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7

    const days: {
      dayNumber: number
      dateStr: string
      isCurrentMonth: boolean
      isToday: boolean
    }[] = []

    // Previous month padding
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const prevDate = new Date(calYear, calMonth - 1, d)
      const dateStr = prevDate.toISOString().split('T')[0]
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
      })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      })
    }

    // Trailing days to round to complete weeks (multiples of 7)
    const totalCells = Math.ceil(days.length / 7) * 7
    const remaining = totalCells - days.length
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(calYear, calMonth + 1, d)
      const dateStr = nextDate.toISOString().split('T')[0]
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
      })
    }

    return days
  }, [calYear, calMonth])

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1))
  }

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1))
  }

  const goToday = () => {
    setCurrentCalendarDate(new Date())
  }

  return (
    <div className="space-y-5 pb-16">
      {/* View Switcher & Actions */}
      <div className="flex items-center justify-between gap-3">
        {/* Toggle List / Calendar */}
        <div className="flex items-center p-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Danh Sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Lịch Tháng
          </button>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-gray-300 text-xs rounded-xl transition-colors border border-[#2a2a2a]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Bộ lọc lịch sử</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Preset filter */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Thương hiệu / Công việc</label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tất cả thương hiệu</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month filter */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Lọc theo tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tất cả các tháng</option>
              {availableMonths.map((m) => {
                const [year, month] = m.split('-')
                return (
                  <option key={m} value={m}>
                    Tháng {month}/{year}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Trạng thái lương</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ nhận lương</option>
              <option value="approved">Đã duyệt lương</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3.5 rounded-2xl">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
            Số ca làm
          </p>
          <p className="text-xl font-bold text-white mt-1">
            {summary.count} <span className="text-xs text-gray-500 font-normal">ca</span>
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3.5 rounded-2xl">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Tổng thời gian
          </p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatHours(summary.totalHours)}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
            <span className="flex items-center gap-0.5">
              <Sun className="w-2.5 h-2.5 text-yellow-500" /> {summary.dayHours.toFixed(1)}h
            </span>
            <span className="flex items-center gap-0.5">
              <Moon className="w-2.5 h-2.5 text-indigo-400" /> {summary.nightHours.toFixed(1)}h
            </span>
          </div>
        </div>

        <div className="col-span-2 bg-gradient-to-br from-violet-950/40 to-[#1a1a1a] border border-violet-800/40 p-3.5 rounded-2xl flex flex-col justify-between">
          <p className="text-xs text-violet-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            Tổng thu nhập theo bộ lọc
          </p>
          <p className="text-2xl font-bold text-violet-400 mt-1 tracking-tight">
            {formatVND(summary.totalAmount)}
          </p>
        </div>
      </div>

      {/* ── CALENDAR VIEW ── */}
      {viewMode === 'calendar' && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-4">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Tháng {calMonth + 1} / {calYear}
              </h3>
              <button
                onClick={goToday}
                className="px-2 py-0.5 bg-[#252525] hover:bg-[#333] text-gray-300 text-xs rounded-md transition-colors"
              >
                Hôm nay
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 rounded-lg transition-colors border border-[#333]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 rounded-lg transition-colors border border-[#333]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <div
                key={w}
                className={`text-xs font-semibold py-1.5 ${
                  idx >= 5 ? 'text-amber-400' : 'text-gray-400'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((cell) => {
              const daySessions = sessionsByDate.get(cell.dateStr) || []
              const hasWork = daySessions.length > 0
              const totalDayHours = daySessions.reduce((acc, s) => acc + Number(s.total_hours || 0), 0)
              const hasNight = daySessions.some((s) => Number(s.night_hours) > 0)
              const totalAmount = daySessions.reduce((acc, s) => acc + Number(s.calculated_amount || 0), 0)

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => {
                    if (hasWork) {
                      setSelectedDayModal({ dateStr: cell.dateStr, sessions: daySessions })
                    }
                  }}
                  disabled={!hasWork}
                  className={`min-h-[64px] sm:min-h-[76px] p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all ${
                    !cell.isCurrentMonth
                      ? 'opacity-30 border-transparent bg-[#141414]'
                      : cell.isToday
                      ? 'border-violet-500 bg-violet-950/20'
                      : hasWork
                      ? 'border-[#333] bg-[#202020] hover:border-violet-500/70 hover:scale-[1.02] cursor-pointer'
                      : 'border-[#242424] bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        cell.isToday
                          ? 'w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]'
                          : cell.isCurrentMonth
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {hasNight && <Moon className="w-3 h-3 text-indigo-400" />}
                  </div>

                  {hasWork && (
                    <div className="mt-1 space-y-0.5">
                      {/* Dots / mini icons */}
                      <div className="flex items-center gap-1 overflow-hidden">
                        {daySessions.slice(0, 3).map((s, idx) => {
                          const p = s.preset || presetsMap[s.preset_id]
                          const color = p?.color || '#7c3aed'
                          return (
                            <span
                              key={idx}
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                              title={p?.name}
                            />
                          )
                        })}
                        {daySessions.length > 3 && (
                          <span className="text-[9px] text-gray-400">+{daySessions.length - 3}</span>
                        )}
                      </div>

                      {/* Total wage / hours */}
                      <p className="text-[10px] sm:text-xs font-bold text-violet-400 truncate">
                        +{Math.round(totalAmount / 1000)}k
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono hidden sm:block">
                        {totalDayHours.toFixed(1)}h
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] animate-pulse" />
              ))}
            </div>
          ) : groupedSessions.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center mx-auto text-gray-500">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h4 className="text-base font-medium text-white">Chưa có dữ liệu chấm công nào</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Hãy chuyển sang tab "Chấm Công" để bắt đầu ghi nhận ca làm việc đầu tiên của bạn!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedSessions.map(([dateStr, daySessions]) => (
                <div key={dateStr} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      {formatDisplayDate(dateStr)}
                    </h4>
                    <div className="flex-1 h-[1px] bg-[#222]" />
                    <span className="text-xs text-gray-500 font-medium">
                      {daySessions.length} ca
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {daySessions.map((session) => {
                      const presetObj = session.preset || (session as any).job_presets || presetsMap[session.preset_id]
                      const presetName = presetObj?.name || 'Công việc'
                      const presetColor = presetObj?.color || '#7c3aed'
                      const presetMeta = parsePresetMeta(presetObj?.description)
                      const isNight = Number(session.night_hours) > 0
                      const isApproved = session.status === 'approved'

                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#1a1a1a] hover:bg-[#202020] border border-[#2a2a2a] rounded-2xl p-4 transition-all relative overflow-hidden"
                          style={{ borderLeftWidth: '4px', borderLeftColor: presetColor }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
                                  style={{
                                    backgroundColor: presetColor + '22',
                                    borderColor: presetColor + '55',
                                  }}
                                >
                                  <BrandIcon
                                    iconId={presetMeta.icon}
                                    className="w-3.5 h-3.5"
                                    style={{ color: presetColor } as any}
                                  />
                                </div>
                                <span className="font-semibold text-white text-base">
                                  {presetName}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                    isApproved
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                >
                                  {isApproved ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Đã duyệt lương
                                    </>
                                  ) : (
                                    <>
                                      <Clock3 className="w-3 h-3" />
                                      Chờ nhận lương
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                                  {formatTimeOnly(session.check_in)} - {formatTimeOnly(session.check_out)}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-gray-200">
                                  {formatHours(Number(session.total_hours))}
                                </span>
                                {isNight && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                      <Moon className="w-3 h-3" />
                                      {Number(session.night_hours).toFixed(1)}h ca đêm (+{presetObj?.night_allowance_pct || 0}%)
                                    </span>
                                  </>
                                )}
                              </div>

                              {session.notes && (
                                <p className="text-xs text-gray-400 italic bg-[#141414] px-2.5 py-1 rounded-lg border border-[#222]">
                                  "{session.notes}"
                                </p>
                              )}
                            </div>

                            <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 border-[#262626] pt-2 sm:pt-0">
                              <span className="text-xs text-gray-400 sm:hidden">Lương ca:</span>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-violet-400 tracking-tight">
                                  +{formatVND(Number(session.calculated_amount))}
                                </span>
                                <button
                                  onClick={() => handleDeleteSession(session.id)}
                                  disabled={deletingSessionId === session.id}
                                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                  title="Xóa ca làm"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── DAY DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedDayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setSelectedDayModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] shrink-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-violet-400" />
                  <div>
                    <h4 className="text-white font-bold text-base">
                      {formatDisplayDate(selectedDayModal.dateStr)}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Tổng {selectedDayModal.sessions.length} ca làm trong ngày
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDayModal(null)}
                  className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Day summary */}
              <div className="p-4 bg-[#141414] border-b border-[#252525] grid grid-cols-2 gap-3 shrink-0">
                <div>
                  <p className="text-xs text-gray-400">Tổng giờ làm</p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {formatHours(
                      selectedDayModal.sessions.reduce(
                        (sum, s) => sum + Number(s.total_hours || 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Tổng thu nhập ngày</p>
                  <p className="text-lg font-bold text-violet-400 mt-0.5">
                    {formatVND(
                      selectedDayModal.sessions.reduce(
                        (sum, s) => sum + Number(s.calculated_amount || 0),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>

              {/* Sessions list */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3 pb-8 sm:pb-4">
                {selectedDayModal.sessions.map((session) => {
                  const presetObj = session.preset || (session as any).job_presets || presetsMap[session.preset_id]
                  const presetName = presetObj?.name || 'Công việc'
                  const presetColor = presetObj?.color || '#7c3aed'
                  const presetMeta = parsePresetMeta(presetObj?.description)
                  const isNight = Number(session.night_hours) > 0
                  const isApproved = session.status === 'approved'

                  return (
                    <div
                      key={session.id}
                      className="bg-[#202020] border border-[#2e2e2e] rounded-xl p-3.5 space-y-2 relative overflow-hidden"
                      style={{ borderLeftWidth: '4px', borderLeftColor: presetColor }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
                            style={{
                              backgroundColor: presetColor + '22',
                              borderColor: presetColor + '55',
                            }}
                          >
                            <BrandIcon
                              iconId={presetMeta.icon}
                              className="w-3.5 h-3.5"
                              style={{ color: presetColor } as any}
                            />
                          </div>
                          <span className="font-semibold text-white text-sm">{presetName}</span>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isApproved ? 'Đã duyệt lương' : 'Chờ nhận lương'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                        <span>
                          {formatTimeOnly(session.check_in)} - {formatTimeOnly(session.check_out)} ({formatHours(Number(session.total_hours))})
                        </span>
                        <span className="font-bold text-violet-400 text-sm">
                          +{formatVND(Number(session.calculated_amount))}
                        </span>
                      </div>

                      {isNight && (
                        <p className="text-[11px] text-indigo-400 flex items-center gap-1">
                          <Moon className="w-3 h-3" />
                          {Number(session.night_hours).toFixed(1)}h ca đêm (+{presetObj?.night_allowance_pct || 0}%)
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#2a2a2a] flex justify-end">
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={deletingSessionId === session.id}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Xóa ca này
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
