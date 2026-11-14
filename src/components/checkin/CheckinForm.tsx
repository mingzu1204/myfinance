'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Sun, Moon, DollarSign, ChevronRight, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { DatePicker, TimePicker } from './ScrollPicker'
import confetti from 'canvas-confetti'

interface Preset {
  id: string
  name: string
  hourly_rate: number
  night_allowance_pct: number
  color: string
  description?: string
}

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

function calcAmount(preset: Preset, dayHours: number, nightHours: number): number {
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
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const h = Math.floor(totalHours)
  const m = Math.round((totalHours - h) * 60)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden"
          >
            {/* BG glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none" />

            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-1">Ca làm hoàn thành!</h2>
            <p className="text-gray-400 text-sm mb-6">Tuyệt vời, bạn đã làm rất tốt!</p>

            <div className="space-y-3 mb-6">
              <div className="bg-[#111] rounded-2xl p-4">
                <p className="text-gray-500 text-xs mb-1">Thời gian làm việc</p>
                <p className="text-white text-xl font-bold">
                  {h} giờ {m} phút
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/30 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">Thu nhập</p>
                <p className="text-violet-300 text-2xl font-bold">{formatVND(amount)}</p>
              </div>
              {nightHours > 0 && (
                <div className="bg-[#111] rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Moon className="w-4 h-4" />
                    <span className="text-sm">{formatHM(nightHours)} đêm</span>
                  </div>
                  <span className="text-amber-400 text-sm font-medium">+{nightPct}% phụ cấp</span>
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
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
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                  {countdown}
                </span>
              </div>
              <span className="text-gray-500 text-sm">Tự đóng sau {countdown}s</span>
            </div>

            <button
              onClick={onClose}
              className="mt-4 text-gray-500 hover:text-gray-300 text-sm transition-colors"
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
  preset: Preset
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
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dự tính lương</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1a1a1a] rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Tổng giờ
          </div>
          <p className="text-white font-semibold">{formatHM(totalHours)}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-amber-500 text-xs mb-1">
            <Sun className="w-3.5 h-3.5" />
            Giờ ngày
          </div>
          <p className="text-white font-semibold">{formatHM(dayHours)}</p>
        </div>
        {nightHours > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-1">
              <Moon className="w-3.5 h-3.5" />
              Giờ đêm
            </div>
            <p className="text-white font-semibold">{formatHM(nightHours)}</p>
          </div>
        )}
        <div
          className={`bg-[#1a1a1a] rounded-xl p-3 ${nightHours > 0 ? '' : 'col-span-1'}`}
          style={{ gridColumn: nightHours > 0 ? undefined : '2' }}
        >
          <div className="flex items-center gap-1.5 text-violet-400 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Thu nhập
          </div>
          <motion.p
            key={amount}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-violet-300 font-bold text-sm"
          >
            {formatVND(amount)}
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

type Step = 'preset' | 'checkin' | 'checkout'

export default function CheckinForm() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
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
      .then(setPresets)
      .catch(() => toast.error('Không thể tải presets'))
      .finally(() => setLoadingPresets(false))
  }, [])

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset)
    setStep('checkin')
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

  return (
    <div className="space-y-4">
      {/* Step: Chọn preset */}
      {step === 'preset' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Chọn công việc</h3>
            <p className="text-sm text-gray-500">Chọn loại ca bạn muốn chấm công</p>
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
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p>Chưa có preset nào.</p>
              <p className="text-sm mt-1">Thêm preset trong tab Cài Đặt.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <motion.button
                key={preset.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelectPreset(preset)}
                className="relative overflow-hidden p-4 rounded-2xl border border-[#2a2a2a] text-left transition-all hover:border-opacity-60 group"
                style={{
                  background: `linear-gradient(135deg, ${preset.color}15 0%, ${preset.color}05 100%)`,
                  borderColor: `${preset.color}30`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: preset.color + '30' }}
                >
                  <Briefcase className="w-4 h-4" style={{ color: preset.color }} />
                </div>
                <p className="text-white font-semibold text-sm leading-tight">{preset.name}</p>
                <p className="text-xs mt-1" style={{ color: preset.color }}>
                  {new Intl.NumberFormat('vi-VN').format(preset.hourly_rate)}đ/h
                </p>
                <ChevronRight
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: preset.color }}
                />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Nhập thời gian */}
      {(step === 'checkin' || step === 'checkout') && selectedPreset && (
        <div className="space-y-4">
          {/* Selected preset badge */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{
              borderColor: selectedPreset.color + '40',
              backgroundColor: selectedPreset.color + '10',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: selectedPreset.color + '30' }}
            >
              <Briefcase className="w-3.5 h-3.5" style={{ color: selectedPreset.color }} />
            </div>
            <span className="text-white text-sm font-medium flex-1">{selectedPreset.name}</span>
            <button
              onClick={() => { setStep('preset'); setSelectedPreset(null) }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Đổi
            </button>
          </div>

          {/* Check-in */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-white font-semibold text-sm">Giờ Vào</p>
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-white font-semibold text-sm">Giờ Ra</p>
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
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Lưu Ca Làm
              </>
            )}
          </button>

          {checkOut <= checkIn && checkIn.getTime() !== checkOut.getTime() && (
            <p className="text-center text-red-400 text-sm">⚠️ Giờ ra phải sau giờ vào</p>
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
