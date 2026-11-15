'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Sun,
  Moon,
  DollarSign,
  ChevronRight,
  Zap,
  Sparkles,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DatePicker, TimePicker } from './ScrollPicker'
import confetti from 'canvas-confetti'
import type { JobPreset, QuickShift } from '@/lib/types'
import { parsePresetMeta } from '@/lib/metadata'
import { BrandIcon } from '@/lib/iconRegistry'

// Night hours: 22:00 - 06:00
function calcWorkBreakdown(checkIn: Date, checkOut: Date) {
  const totalMs = checkOut.getTime() - checkIn.getTime()
  if (totalMs <= 0) return { totalHours: 0, dayHours: 0, nightHours: 0 }

  const totalHours = totalMs / 3_600_000
  let nightMs = 0
  const stepMs = 60_000 // 1 minute steps

  for (let t = checkIn.getTime(); t < checkOut.getTime(); t += stepMs) {
    const h = new Date(t).getHours()
    if (h >= 22 || h < 6) nightMs += stepMs
  }

  const nightHours = nightMs / 3_600_000
  const dayHours = totalHours - nightHours
  return { totalHours, dayHours, nightHours }
}

function calcAmount(preset: JobPreset, dayHours: number, nightHours: number): number {
  const dayPay = dayHours * preset.hourly_rate
  const nightPay = nightHours * preset.hourly_rate * (1 + preset.night_allowance_pct / 100)
  return Math.round(dayPay + nightPay)
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatHM(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

// Celebration Modal
interface CelebrationProps {
  visible: boolean
  totalHours: number
  nightHours: number
  amount: number
  nightPct: number
  onClose: () => void
}

function CelebrationModal({ visible, totalHours, nightHours, amount, nightPct, onClose }: CelebrationProps) {
  const [countdown, setCountdown] = useState(4)
  const confettiFired = useRef(false)

  useEffect(() => {
    if (!visible) {
      setCountdown(4)
      confettiFired.current = false
      return
    }
    if (!confettiFired.current) {
      confettiFired.current = true
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#a78bfa', '#fbbf24', '#34d399', '#f472b6'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.6, x: 0.2 },
          angle: 60,
        })
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.6, x: 0.8 },
          angle: 120,
        })
      }, 300)
    }

    setCountdown(4)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          onClose()
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-6 text-center space-y-4 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Chấm công thành công!</h3>
              <p className="text-gray-400 text-sm mt-1">Đã ghi nhận ca làm việc của bạn</p>
            </div>

            <div className="space-y-2 text-left">
              <div className="bg-[#111] rounded-2xl p-3 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Thời gian</span>
                <span className="text-white font-semibold">{formatHM(totalHours)}</span>
              </div>
              <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/30 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">Thu nhập dự tính</p>
                <p className="text-violet-300 text-2xl font-bold">{formatVND(amount)}</p>
              </div>
              {nightHours > 0 && (
                <div className="bg-[#111] rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Moon className="w-4 h-4" />
                    <span className="text-sm">{formatHM(nightHours)} ca đêm</span>
                  </div>
                  <span className="text-amber-400 text-sm font-medium">+{nightPct}% phụ cấp</span>
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="relative w-7 h-7">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#2a2a2a" strokeWidth="3" />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={75.4}
                    animate={{ strokeDashoffset: 75.4 * (1 - countdown / 4) }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">
                  {countdown}
                </span>
              </div>
              <span className="text-gray-500 text-xs">Tự đóng sau {countdown}s</span>
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Đóng ngay
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Salary preview card
function SalaryPreview({
  checkIn,
  checkOut,
  preset,
}: {
  checkIn: Date
  checkOut: Date
  preset: JobPreset
}) {
  const { totalHours, dayHours, nightHours } = calcWorkBreakdown(checkIn, checkOut)
  const amount = calcAmount(preset, dayHours, nightHours)
  const isValid = checkOut > checkIn

  if (!isValid) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dự tính thu nhập ca này</p>
        <span className="text-xs text-violet-400 font-medium">Lương: {formatVND(preset.hourly_rate)}/h</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#252525]">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            Tổng giờ
          </div>
          <p className="text-white font-bold text-base">{formatHM(totalHours)}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#252525]">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Giờ ngày
          </div>
          <p className="text-white font-bold text-base">{formatHM(dayHours)}</p>
        </div>
        {nightHours > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#252525]">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-1">
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              Giờ đêm (+{preset.night_allowance_pct}%)
            </div>
            <p className="text-blue-300 font-bold text-base">{formatHM(nightHours)}</p>
          </div>
        )}
        <div
          className={`bg-violet-950/30 border border-violet-500/30 rounded-xl p-3 ${
            nightHours > 0 ? '' : 'col-span-1'
          }`}
        >
          <div className="flex items-center gap-1.5 text-violet-400 text-xs mb-1 font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            Thu nhập
          </div>
          <motion.p
            key={amount}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-violet-300 font-extrabold text-base"
          >
            {formatVND(amount)}
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

type Step = 'preset' | 'time'

export default function CheckinForm() {
  const [presets, setPresets] = useState<JobPreset[]>([])
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<JobPreset | null>(null)
  const [step, setStep] = useState<Step>('preset')
  const [submitting, setSubmitting] = useState(false)
  const [celebration, setCelebration] = useState<{
    visible: boolean
    totalHours: number
    nightHours: number
    amount: number
    nightPct: number
  }>({ visible: false, totalHours: 0, nightHours: 0, amount: 0, nightPct: 0 })

  const now = new Date()

  // Check-in date/time
  const [checkInDate, setCheckInDate] = useState(now)
  const [checkInHour, setCheckInHour] = useState(now.getHours())
  const [checkInMinute, setCheckInMinute] = useState(Math.floor(now.getMinutes() / 5) * 5)

  // Check-out date/time
  const [checkOutDate, setCheckOutDate] = useState(now)
  const [checkOutHour, setCheckOutHour] = useState(Math.min(23, now.getHours() + 8))
  const [checkOutMinute, setCheckOutMinute] = useState(Math.floor(now.getMinutes() / 5) * 5)

  const getCheckIn = useCallback(() => {
    const d = new Date(checkInDate)
    d.setHours(checkInHour, checkInMinute, 0, 0)
    return d
  }, [checkInDate, checkInHour, checkInMinute])

  const getCheckOut = useCallback(() => {
    const d = new Date(checkOutDate)
    d.setHours(checkOutHour, checkOutMinute, 0, 0)
    return d
  }, [checkOutDate, checkOutHour, checkOutMinute])

  useEffect(() => {
    fetch('/api/presets')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setPresets(list)
      })
      .catch(() => toast.error('Không thể tải presets'))
      .finally(() => setLoadingPresets(false))
  }, [])

  const handleSelectPreset = (preset: JobPreset) => {
    setSelectedPreset(preset)
    setStep('time')
  }

  // 1-Click Quick Shift Application
  const handleApplyQuickShift = (qs: { name: string; start_time: string; end_time: string }) => {
    const [startH, startM] = qs.start_time.split(':').map(Number)
    const [endH, endM] = qs.end_time.split(':').map(Number)

    const today = new Date()
    setCheckInDate(today)
    setCheckInHour(startH)
    setCheckInMinute(startM || 0)

    // If end_time is less than or equal to start_time, it's an overnight shift (crosses midnight)
    if (endH < startH || (endH === startH && endM <= startM)) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      setCheckOutDate(tomorrow)
    } else {
      setCheckOutDate(today)
    }

    setCheckOutHour(endH)
    setCheckOutMinute(endM || 0)

    toast.success(`Đã điền nhanh: ${qs.name} (${qs.start_time} - ${qs.end_time})`)
  }

  const handleSubmit = async () => {
    if (!selectedPreset) return
    const checkIn = getCheckIn()
    const checkOut = getCheckOut()

    if (checkOut <= checkIn) {
      toast.error('Giờ ra phải sau giờ vào!')
      return
    }

    const { totalHours, dayHours, nightHours } = calcWorkBreakdown(checkIn, checkOut)
    const amount = calcAmount(selectedPreset, dayHours, nightHours)

    setSubmitting(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset_id: selectedPreset.id,
          work_date: checkIn.toISOString().split('T')[0],
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          total_hours: totalHours,
          day_hours: dayHours,
          night_hours: nightHours,
          calculated_amount: amount,
        }),
      })

      if (!res.ok) throw new Error()

      setCelebration({
        visible: true,
        totalHours,
        nightHours,
        amount,
        nightPct: selectedPreset.night_allowance_pct,
      })
    } catch {
      toast.error('Có lỗi khi lưu ca làm, thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  const checkIn = getCheckIn()
  const checkOut = getCheckOut()

  const presetMeta = selectedPreset ? parsePresetMeta(selectedPreset.description) : null
  const quickShifts: QuickShift[] = presetMeta?.quick_shifts && presetMeta.quick_shifts.length > 0
    ? presetMeta.quick_shifts
    : [
        { id: 'def-1', name: 'Ca Sáng', start_time: '08:00', end_time: '16:00' },
        { id: 'def-2', name: 'Ca Chiều', start_time: '14:00', end_time: '22:00' },
        { id: 'def-3', name: 'Ca Đêm', start_time: '22:00', end_time: '06:00' },
      ]

  return (
    <div className="space-y-4">
      {/* Step: Chọn preset */}
      {step === 'preset' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Chọn thương hiệu & công việc</h3>
            <p className="text-sm text-gray-500">Chọn nơi bạn đã làm việc để ghi nhận ca làm</p>
          </div>

          {loadingPresets && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-[#1a1a1a] rounded-2xl animate-pulse border border-[#2a2a2a]" />
              ))}
            </div>
          )}

          {!loadingPresets && presets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p>Chưa có preset nào.</p>
              <p className="text-sm mt-1">Thêm preset trong tab Cài Đặt để bắt đầu.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => {
              const meta = parsePresetMeta(preset.description)
              const color = preset.color || '#7c3aed'
              return (
                <motion.button
                  key={preset.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSelectPreset(preset)}
                  className="relative overflow-hidden p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] group"
                  style={{
                    backgroundColor: '#161616',
                    borderColor: `${color}40`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 border"
                    style={{
                      backgroundColor: `${color}20`,
                      borderColor: `${color}44`,
                    }}
                  >
                    <BrandIcon iconId={meta.icon} className="w-5 h-5" style={{ color } as any} />
                  </div>
                  <p className="text-white font-semibold text-sm leading-tight truncate">{preset.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-medium" style={{ color }}>
                      {new Intl.NumberFormat('vi-VN').format(preset.hourly_rate)}đ/h
                    </span>
                    {preset.night_allowance_pct > 0 && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.2 rounded font-medium">
                        +{preset.night_allowance_pct}%
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                    style={{ color }}
                  />
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step: Nhập thời gian */}
      {step === 'time' && selectedPreset && (
        <div className="space-y-4">
          {/* Selected preset badge */}
          <div
            className="flex items-center justify-between p-3.5 rounded-2xl border"
            style={{
              borderColor: (selectedPreset.color || '#7c3aed') + '40',
              backgroundColor: (selectedPreset.color || '#7c3aed') + '15',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                style={{
                  backgroundColor: (selectedPreset.color || '#7c3aed') + '25',
                  borderColor: (selectedPreset.color || '#7c3aed') + '50',
                }}
              >
                <BrandIcon
                  iconId={presetMeta?.icon}
                  className="w-5 h-5"
                  style={{ color: selectedPreset.color || '#7c3aed' } as any}
                />
              </div>
              <div>
                <span className="text-white text-sm font-bold">{selectedPreset.name}</span>
                <p className="text-xs text-gray-400">
                  {formatVND(selectedPreset.hourly_rate)}/giờ
                  {selectedPreset.night_allowance_pct > 0 && ` • +${selectedPreset.night_allowance_pct}% đêm`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setStep('preset')
                setSelectedPreset(null)
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] text-gray-300 hover:text-white transition-colors"
            >
              Đổi việc khác
            </button>
          </div>

          {/* Quick Shifts 1-Touch Toolbar */}
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Ca Mẫu 1-Chạm</span>
              </div>
              <span className="text-[11px] text-gray-400">Bấm để tự điền giờ vào/ra</span>
            </div>

            <div className="flex items-center flex-wrap gap-2 pt-1">
              {quickShifts.map((qs) => {
                const isNight = qs.name.toLowerCase().includes('đêm') || qs.start_time >= '20:00' || qs.end_time <= '07:00'
                return (
                  <button
                    key={qs.id}
                    type="button"
                    onClick={() => handleApplyQuickShift(qs)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#222] hover:bg-violet-600/30 border border-[#333] hover:border-violet-500/50 text-xs font-medium text-white transition-all shadow-sm active:scale-95"
                  >
                    {isNight ? (
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{qs.name}</span>
                    <span className="text-gray-400 font-mono text-[11px]">
                      ({qs.start_time} - {qs.end_time})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Check-in */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-white font-bold text-sm">Giờ Vào Ca (Check-In)</p>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {checkIn.toLocaleDateString('vi-VN')} {String(checkInHour).padStart(2, '0')}:{String(checkInMinute).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <DatePicker value={checkInDate} onChange={setCheckInDate} />
              <div className="border-t border-[#2a2a2a]" />
              <TimePicker
                hour={checkInHour}
                minute={checkInMinute}
                onHourChange={setCheckInHour}
                onMinuteChange={setCheckInMinute}
              />
            </div>
          </div>

          {/* Check-out */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <p className="text-white font-bold text-sm">Giờ Ra Ca (Check-Out)</p>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {checkOut.toLocaleDateString('vi-VN')} {String(checkOutHour).padStart(2, '0')}:{String(checkOutMinute).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <DatePicker value={checkOutDate} onChange={setCheckOutDate} />
              <div className="border-t border-[#2a2a2a]" />
              <TimePicker
                hour={checkOutHour}
                minute={checkOutMinute}
                onHourChange={setCheckOutHour}
                onMinuteChange={setCheckOutMinute}
              />
            </div>
          </div>

          {/* Salary preview */}
          <SalaryPreview checkIn={checkIn} checkOut={checkOut} preset={selectedPreset} />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || checkOut <= checkIn}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2 text-base active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu ca làm...
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Lưu Ca Làm Việc
              </>
            )}
          </button>

          {checkOut <= checkIn && (
            <p className="text-center text-red-400 text-xs">Giờ ra phải sau giờ vào. Nếu là ca đêm qua ngày hôm sau, vui lòng chọn ngày ra là ngày mai.</p>
          )}
        </div>
      )}

      {/* Celebration */}
      <CelebrationModal
        {...celebration}
        onClose={() => {
          setCelebration((c) => ({ ...c, visible: false }))
          setStep('preset')
          setSelectedPreset(null)
        }}
      />
    </div>
  )
}
