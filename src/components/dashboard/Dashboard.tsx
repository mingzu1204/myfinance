'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatVND } from '@/lib/calculations'
import {
  Wallet,
  Clock,
  Briefcase,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  Timer,
  Edit3,
  Plus,
  Minus,
  RotateCcw,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parsePresetMeta, calculatePaydayRemaining } from '@/lib/metadata'
import { BrandIcon } from '@/lib/iconRegistry'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletData {
  cash_balance: number
}

interface JobPreset {
  id: string
  name: string
  color?: string
  description?: string
}

interface SalaryCycle {
  id: string
  preset_id: string
  total_calculated: number
  status: string
  preset?: JobPreset
}

interface WorkSession {
  id: string
  preset_id: string
  work_date: string
  total_hours: number
  calculated_amount: number
  status: string
  preset?: JobPreset
}

interface BrandPendingGroup {
  preset_id: string
  name: string
  color: string
  totalAmount: number
  sessionCount: number
}

interface DashboardProps {
  onNavigate?: (tab: string) => void
}

// ─── Shimmer Skeleton ────────────────────────────────────────────────────────

function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden ${className}`}>
      <div className="animate-pulse p-6 space-y-3">
        <div className="h-3 w-24 bg-[#2a2a2a] rounded" />
        <div className="h-10 w-40 bg-[#2a2a2a] rounded" />
        <div className="h-2 w-20 bg-[#2a2a2a] rounded" />
      </div>
    </div>
  )
}

function ShimmerRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 p-4">
      <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 bg-[#2a2a2a] rounded" />
        <div className="h-2 w-20 bg-[#2a2a2a] rounded" />
      </div>
      <div className="h-3 w-16 bg-[#2a2a2a] rounded" />
    </div>
  )
}

// ─── Animated Number ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    prevValue.current = value

    if (from === to) return

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(from + (to - from) * easeOut(progress)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        startRef.current = null
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span>{formatVND(display)}</span>
}

// ─── Balance Card ─────────────────────────────────────────────────────────────

interface BalanceCardProps {
  title: string
  amount: number
  subtitle: string
  gradient: string
  icon: React.ReactNode
  delay?: number
  onEdit?: () => void
}

function BalanceCard({ title, amount, subtitle, gradient, icon, delay = 0, onEdit }: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={`rounded-2xl p-6 ${gradient} relative overflow-hidden`}
    >
      {/* Decoration circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute left-1/2 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between text-white/80">
          <div className="flex items-center gap-2">
            {icon}
            <p className="text-sm font-medium">{title}</p>
          </div>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-sm border border-white/20 shadow-sm"
            >
              <Edit3 size={13} />
              Chỉnh sửa
            </button>
          )}
        </div>
        <div className="mt-2 text-4xl md:text-5xl font-bold text-white tracking-tight leading-none">
          <AnimatedNumber value={amount} />
        </div>
        <p className="mt-2 text-xs text-white/50">{subtitle}</p>
      </div>
    </motion.div>
  )
}

// ─── Realtime Clock ───────────────────────────────────────────────────────────

function RealtimeClock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="text-right">
      <p className="text-lg font-semibold text-white tabular-nums">{timeStr}</p>
      <p className="text-xs text-gray-500 capitalize">{dateStr}</p>
    </div>
  )
}

// ─── Wallet Adjust Modal ───────────────────────────────────────────────────

interface WalletAdjustModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

function WalletAdjustModal({ isOpen, onClose, currentBalance, onSuccess }: WalletAdjustModalProps) {
  const [op, setOp] = useState<'add' | 'subtract' | 'set'>('add')
  const [amountRaw, setAmountRaw] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAmountRaw('')
      setNote('')
      setOp('add')
    }
  }, [isOpen])

  const parsedAmount = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0

  const computedNewBalance = useMemo(() => {
    if (op === 'add') return currentBalance + parsedAmount
    if (op === 'subtract') return Math.max(0, currentBalance - parsedAmount)
    return parsedAmount
  }, [op, currentBalance, parsedAmount])

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '')
    setAmountRaw(digits ? parseInt(digits, 10).toLocaleString('vi-VN') : '')
  }

  const addQuickChip = (num: number) => {
    const next = parsedAmount + num
    setAmountRaw(next.toLocaleString('vi-VN'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedAmount <= 0 && op !== 'set') {
      toast.error('Vui lòng nhập số tiền')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          operation: op,
          note: note.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error('Cập nhật thất bại')
      const data = await res.json()
      const newBal = Number(data.cash_balance ?? computedNewBalance)
      toast.success(
        op === 'add'
          ? `+${parsedAmount.toLocaleString('vi-VN')} ₫ vào ví!`
          : op === 'subtract'
          ? `-${parsedAmount.toLocaleString('vi-VN')} ₫ khỏi ví!`
          : `Đã đặt số dư ví: ${newBal.toLocaleString('vi-VN')} ₫`
      )
      onSuccess(newBal)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật tiền')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#1a1a1a] rounded-t-3xl md:rounded-2xl border border-[#2a2a2a] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                  <Wallet size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Chỉnh sửa tiền mặt</h3>
                  <p className="text-xs text-gray-400">
                    Hiện có: <span className="text-violet-400 font-semibold">{formatVND(currentBalance)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Operation Type Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] border border-[#2a2a2a] rounded-xl">
              <button
                type="button"
                onClick={() => setOp('add')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  op === 'add'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Plus size={14} /> Nạp thêm
              </button>
              <button
                type="button"
                onClick={() => setOp('subtract')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  op === 'subtract'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Minus size={14} /> Rút bớt
              </button>
              <button
                type="button"
                onClick={() => setOp('set')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  op === 'set'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <RotateCcw size={13} /> Đặt lại
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">
                  {op === 'add' ? 'Số tiền muốn cộng (+)' : op === 'subtract' ? 'Số tiền muốn trừ (-)' : 'Số tiền mới đặt lại'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountRaw}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl text-white bg-[#222] border border-[#2a2a2a] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-lg font-mono pr-9"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₫</span>
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[50000, 100000, 200000, 500000, 1000000, 2000000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => addQuickChip(num)}
                    className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-gray-300 text-xs font-medium transition-colors"
                  >
                    +{num >= 1000000 ? `${num / 1000000}tr` : `${num / 1000}k`}
                  </button>
                ))}
              </div>

              {/* Realtime calculation preview */}
              <div className="p-3 bg-[#141414] border border-[#2a2a2a] rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-400">Số dư sau khi lưu:</span>
                <span className={`text-sm font-bold font-mono ${op === 'add' ? 'text-emerald-400' : op === 'subtract' ? 'text-red-400' : 'text-violet-400'}`}>
                  {formatVND(computedNewBalance)}
                </span>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={op === 'subtract' ? 'VD: Ăn tối, mua sắm...' : op === 'add' ? 'VD: Thưởng thêm, nạp tiền...' : 'VD: Đếm lại tiền ví...'}
                  className="w-full px-4 py-2.5 rounded-xl text-white bg-[#222] border border-[#2a2a2a] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm placeholder:text-gray-600"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-sm font-medium border border-[#333] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/30"
                >
                  {loading ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-gray-400">{message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#222] text-gray-300 text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  danger
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [cashBalance, setCashBalance] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [brandGroups, setBrandGroups] = useState<BrandPendingGroup[]>([])
  const [recentSessions, setRecentSessions] = useState<WorkSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [presetsMap, setPresetsMap] = useState<Record<string, JobPreset>>({})

  const paydayList = useMemo(() => {
    const list = Object.values(presetsMap).map((p) => {
      const meta = parsePresetMeta(p.description)
      const countdown = calculatePaydayRemaining(meta.payday ?? 10)
      const brandPending = brandGroups.find((bg) => bg.preset_id === p.id)
      return {
        preset: p,
        meta,
        countdown,
        pendingAmount: brandPending?.totalAmount || 0,
      }
    })
    return list.sort((a, b) => a.countdown.daysRemaining - b.countdown.daysRemaining)
  }, [presetsMap, brandGroups])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      const ts = Date.now()
      const [walletRes, cyclesRes, sessionsRes, recentRes, presetsRes] = await Promise.allSettled([
        fetch(`/api/wallet?_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/cycles?status=open&_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/sessions?status=pending&_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/sessions?limit=10&_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/presets?_t=${ts}`, { cache: 'no-store' }),
      ])

      // Presets mapping
      const pMap: Record<string, JobPreset> = {}
      if (presetsRes.status === 'fulfilled' && presetsRes.value.ok) {
        const pData = await presetsRes.value.json()
        const pList: JobPreset[] = Array.isArray(pData) ? pData : (pData?.data ?? [])
        pList.forEach((p) => {
          if (p?.id) pMap[p.id] = p
        })
        setPresetsMap(pMap)
      }

      // Wallet
      if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
        const data: WalletData = await walletRes.value.json()
        setCashBalance(data.cash_balance ?? 0)
      } else {
        toast.error('Không thể tải số dư ví')
      }

      // Open cycles + pending sessions → compute totals by brand
      let cycles: SalaryCycle[] = []
      let pendingSessions: WorkSession[] = []

      if (cyclesRes.status === 'fulfilled' && cyclesRes.value.ok) {
        const data = await cyclesRes.value.json()
        cycles = Array.isArray(data) ? data : (data?.cycles ?? data?.data ?? [])
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.ok) {
        const data = await sessionsRes.value.json()
        pendingSessions = Array.isArray(data) ? data : (data?.sessions ?? data?.data ?? [])
      }

      // Compute pending total from cycles
      const total = cycles.reduce((sum: number, c: SalaryCycle) => sum + (c.total_calculated ?? 0), 0)
      setPendingTotal(total)

      // Group pending sessions by brand
      const groupMap: Record<string, BrandPendingGroup> = {}
      for (const session of pendingSessions) {
        const pid = session.preset_id
        const presetObj = session.preset || (session as any).job_presets || pMap[pid]
        if (!groupMap[pid]) {
          groupMap[pid] = {
            preset_id: pid,
            name: presetObj?.name ?? 'Công việc',
            color: presetObj?.color ?? '#7c3aed',
            totalAmount: 0,
            sessionCount: 0,
          }
        }
        groupMap[pid].totalAmount += session.calculated_amount ?? 0
        groupMap[pid].sessionCount += 1
      }
      setBrandGroups(Object.values(groupMap))

      // Recent sessions
      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        const data = await recentRes.value.json()
        const list: WorkSession[] = Array.isArray(data) ? data : (data?.sessions ?? data?.data ?? [])
        setRecentSessions(list.slice(0, 5))
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      toast.error('Lỗi tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleReset = async () => {
    try {
      setResetting(true)
      const res = await fetch('/api/reset', { method: 'DELETE' })
      if (!res.ok) throw new Error('Reset failed')
      setCashBalance(0)
      setPendingTotal(0)
      setBrandGroups([])
      setRecentSessions([])
      toast.success('Đã reset toàn bộ dữ liệu thành công')
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast.error('Reset thất bại, thử lại sau')
    } finally {
      setResetting(false)
      setShowResetDialog(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  }

  const staggerItem = {
    hidden: { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">MyFinance</span>
          </div>
          <RealtimeClock />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* ── Hero Balance Cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            <ShimmerCard className="h-36" />
            <ShimmerCard className="h-36" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <BalanceCard
              title="Tiền Mặt"
              amount={cashBalance}
              subtitle="Số dư hiện tại trong ví"
              gradient="bg-gradient-to-br from-violet-600 to-violet-800"
              icon={<Wallet size={16} />}
              delay={0}
              onEdit={() => setShowWalletModal(true)}
            />
            <BalanceCard
              title="Lương Chờ Nhận"
              amount={pendingTotal}
              subtitle={`${brandGroups.length > 0 ? brandGroups.length + ' brand đang chờ duyệt' : 'Không có lương chờ'}`}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              icon={<Briefcase size={16} />}
              delay={0.1}
            />
          </div>
        )}

        {/* ── Payday Countdown Widget ── */}
        {!loading && paydayList.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Đếm Ngược Ngày Nhận Lương
                </h2>
              </div>
              <button
                onClick={() => onNavigate?.('brands')}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                Tất cả <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paydayList.map(({ preset, meta, countdown, pendingAmount }) => {
                const color = preset.color || '#7c3aed'
                return (
                  <div
                    key={preset.id}
                    className="relative overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-[#3a3a3a]"
                    style={{ borderLeftWidth: 4, borderLeftColor: color }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: color + '22',
                            borderColor: color + '55',
                          }}
                        >
                          <BrandIcon iconId={meta.icon} className="w-5 h-5" style={{ color } as any} />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{preset.name}</p>
                          <p className="text-[11px] text-gray-400">
                            Ngày {meta.payday ?? 10} hàng tháng
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          countdown.isToday
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                            : countdown.daysRemaining <= 3
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {countdown.isToday ? (
                          <span className="flex items-center gap-1">
                            <Sparkles size={11} /> Hôm nay nhận!
                          </span>
                        ) : countdown.daysRemaining === 1 ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> Ngày mai!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> Còn {countdown.daysRemaining} ngày
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#252525] flex items-center justify-between text-xs">
                      <span className="text-gray-400">Lương dự kiến:</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">
                        {formatVND(pendingAmount)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Pending Brands ── */}
        {(loading || brandGroups.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Lương Chờ Duyệt</h2>
            </div>
            <div className="rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden divide-y divide-[#2a2a2a]">
              {loading ? (
                <>
                  <ShimmerRow />
                  <ShimmerRow />
                </>
              ) : (
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {brandGroups.map((brand) => {
                    const pObj = presetsMap[brand.preset_id]
                    const meta = parsePresetMeta(pObj?.description)
                    return (
                      <motion.li
                        key={brand.preset_id}
                        variants={staggerItem}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#222] transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: brand.color + '22',
                            borderColor: brand.color + '55',
                          }}
                        >
                          <BrandIcon iconId={meta.icon} className="w-5 h-5" style={{ color: brand.color } as any} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{brand.name}</p>
                          <p className="text-xs text-gray-500">{brand.sessionCount} ca làm việc</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-semibold text-amber-400">
                            {formatVND(brand.totalAmount)}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Chờ duyệt
                          </span>
                        </div>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              )}
            </div>
          </section>
        )}

        {/* ── Quick Actions ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Thao Tác Nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate?.('checkin')}
              className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white font-medium text-sm shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-violet-600 transition-all"
            >
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Zap size={16} />
              </div>
              <span>Chấm công ngay</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate?.('goals')}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 font-medium text-sm hover:bg-[#222] hover:text-white transition-all"
            >
              <div className="p-1.5 bg-[#2a2a2a] rounded-lg">
                <Target size={16} />
              </div>
              <span>Thêm mục tiêu</span>
            </motion.button>
          </div>
        </section>

        {/* ── Recent Activity ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hoạt Động Gần Đây</h2>
            <button
              onClick={() => onNavigate?.('sessions')}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              Xem tất cả <ChevronRight size={12} />
            </button>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
            {loading ? (
              <>
                <ShimmerRow />
                <ShimmerRow />
                <ShimmerRow />
              </>
            ) : recentSessions.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-600">
                <Calendar size={32} className="opacity-40" />
                <p className="text-sm">Chưa có ca làm nào</p>
                <button
                  onClick={() => onNavigate?.('checkin')}
                  className="mt-1 text-xs text-violet-400 hover:text-violet-300"
                >
                  Chấm công ngay →
                </button>
              </div>
            ) : (
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="divide-y divide-[#2a2a2a]"
              >
                {recentSessions.map((session, idx) => {
                  const pObj = session.preset || (session as any).job_presets || presetsMap[session.preset_id]
                  const meta = parsePresetMeta(pObj?.description)
                  const pColor = pObj?.color || '#7c3aed'
                  return (
                    <motion.li
                      key={session.id}
                      variants={staggerItem}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#222] transition-colors"
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center border"
                          style={{
                            backgroundColor: pColor + '22',
                            borderColor: pColor + '55',
                          }}
                        >
                          <BrandIcon iconId={meta.icon} className="w-4 h-4" style={{ color: pColor } as any} />
                        </div>
                        {idx < recentSessions.length - 1 && (
                          <div className="w-px h-full bg-[#2a2a2a] mt-1" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {pObj?.name ?? 'Công việc'}
                        </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{formatDate(session.work_date)}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500">{session.total_hours?.toFixed(1)}h</span>
                        {session.status === 'pending' && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                              Chờ duyệt
                            </span>
                          </>
                        )}
                        {session.status === 'paid' && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                              Đã nhận
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">
                        {formatVND(session.calculated_amount)}
                      </p>
                    </div>
                  </motion.li>
                )
              })}
              </motion.ul>
            )}
          </div>
        </section>

        {/* ── Reset Button ── */}
        <section className="pt-2 pb-4 flex justify-center">
          <button
            onClick={() => setShowResetDialog(true)}
            className="text-xs text-red-900 hover:text-red-600 flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-red-500/5 transition-all border border-transparent hover:border-red-900/30"
          >
            <AlertTriangle size={12} />
            <span>Reset dữ liệu</span>
          </button>
        </section>
      </div>

      {/* ── Wallet Adjust Modal ── */}
      <WalletAdjustModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        currentBalance={cashBalance}
        onSuccess={(newBal) => {
          setCashBalance(newBal)
        }}
      />

      {/* ── Reset Confirm Dialog ── */}
      <ConfirmDialog
        open={showResetDialog}
        title="Reset toàn bộ dữ liệu?"
        message="Thao tác này sẽ xóa toàn bộ ca làm, chu kỳ lương, số dư ví và mục tiêu. Không thể hoàn tác."
        confirmLabel={resetting ? 'Đang reset...' : 'Xóa hết'}
        onConfirm={handleReset}
        onCancel={() => setShowResetDialog(false)}
        danger
      />
    </div>
  )
}
