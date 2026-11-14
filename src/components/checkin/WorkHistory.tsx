'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Moon,
  Sun,
  Filter,
  CheckCircle2,
  Clock3,
  Building2,
  TrendingUp,
  RefreshCw,
  Search,
  ChevronDown
} from 'lucide-react'
import { formatVND, formatHours } from '@/lib/calculations'
import { WorkSession, JobPreset } from '@/lib/types'
import toast from 'react-hot-toast'

export default function WorkHistory() {
  const [sessions, setSessions] = useState<WorkSession[]>([])
  const [presets, setPresets] = useState<JobPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resSessions, resPresets] = await Promise.all([
        fetch('/api/sessions?limit=200'),
        fetch('/api/presets')
      ])

      if (resSessions.ok) {
        const data = await resSessions.json()
        setSessions(data)
      }

      if (resPresets.ok) {
        const data = await resPresets.json()
        setPresets(data)
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

  // Group by date
  const groupedSessions = useMemo(() => {
    const map = new Map<string, WorkSession[]>()
    filteredSessions.forEach((s) => {
      const dateKey = s.work_date
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(s)
    })
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
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

  return (
    <div className="space-y-6 pb-12">
      {/* Filter and Control Bar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Bộ lọc lịch sử</h3>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-xs rounded-lg transition-colors border border-[#333]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Preset filter */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Thương hiệu / Công việc</label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
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
            <label className="text-xs text-gray-400 mb-1 block">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
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
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">⏳ Chờ nhận lương</option>
              <option value="approved">✅ Đã duyệt lương</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3.5 rounded-2xl">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Số ca làm
          </p>
          <p className="text-xl font-bold text-white mt-1">{summary.count} <span className="text-xs text-gray-500 font-normal">ca</span></p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3.5 rounded-2xl">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Tổng thời gian
          </p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatHours(summary.totalHours)}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
            <span className="flex items-center gap-0.5"><Sun className="w-2.5 h-2.5 text-yellow-500" /> {summary.dayHours.toFixed(1)}h</span>
            <span className="flex items-center gap-0.5"><Moon className="w-2.5 h-2.5 text-indigo-400" /> {summary.nightHours.toFixed(1)}h</span>
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

      {/* History Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] animate-pulse" />
          ))}
        </div>
      ) : groupedSessions.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center mx-auto text-gray-500">
            <Calendar className="w-6 h-6" />
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
                <span className="text-xs text-gray-500">
                  {daySessions.length} ca
                </span>
              </div>

              <div className="space-y-2.5">
                {daySessions.map((session) => {
                  const presetColor = session.preset?.color || '#7c3aed'
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
                            <span className="font-semibold text-white text-base">
                              {session.preset?.name || 'Công việc'}
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
                                  {Number(session.night_hours).toFixed(1)}h ca đêm (+{session.preset?.night_allowance_pct || 0}%)
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
                          <span className="text-lg font-bold text-violet-400 tracking-tight">
                            +{formatVND(Number(session.calculated_amount))}
                          </span>
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
    </div>
  )
}
