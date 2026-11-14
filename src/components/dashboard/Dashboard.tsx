'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletData {
  cash_balance: number
}

interface JobPreset {
  id: string
  name: string
  color?: string
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
}

function BalanceCard({ title, amount, subtitle, gradient, icon, delay = 0 }: BalanceCardProps) {
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
        <div className="flex items-center gap-2 text-white/70">
          {icon}
          <p className="text-sm font-medium">{title}</p>
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
  const [resetting, setResetting] = useState(false)

  const [presetsMap, setPresetsMap] = useState<Record<string, JobPreset>>({})

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      const [walletRes, cyclesRes, sessionsRes, recentRes, presetsRes] = await Promise.allSettled([
        fetch('/api/wallet'),
        fetch('/api/cycles?status=open'),
        fetch('/api/sessions?status=pending'),
        fetch('/api/sessions?limit=10'),
        fetch('/api/presets'),
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
      toast.success('Đã reset dữ liệu thành công')
      setTimeout(() => window.location.reload(), 800)
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
                  {brandGroups.map((brand) => (
                    <motion.li
                      key={brand.preset_id}
                      variants={staggerItem}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#222] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
                        style={{ backgroundColor: brand.color + '33', borderColor: brand.color + '66', border: '1px solid' }}
                      >
                        <span style={{ color: brand.color }}>
                          {brand.name.slice(0, 2).toUpperCase()}
                        </span>
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
                  ))}
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
                {recentSessions.map((session, idx) => (
                  <motion.li
                    key={session.id}
                    variants={staggerItem}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#222] transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center">
                        <Timer size={15} className="text-violet-400" />
                      </div>
                      {idx < recentSessions.length - 1 && (
                        <div className="w-px h-full bg-[#2a2a2a] mt-1" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.preset?.name ?? (session as any).job_presets?.name ?? presetsMap[session.preset_id]?.name ?? 'Công việc'}
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
                ))}
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
            ⚠️ Reset dữ liệu
          </button>
        </section>
      </div>

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
