'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, ChevronDown, ChevronUp, Clock, Calendar,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Minus, History, Banknote, Loader2, RefreshCw, Star
} from 'lucide-react'
import { JobPreset, SalaryCycle, WorkSession, WishItem, Wallet } from '@/lib/types'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseCycleMonth(cycle: SalaryCycle): string {
  const d = new Date(cycle.start_date)
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface BrandData {
  preset: JobPreset
  openCycle: SalaryCycle | null
  closedCycles: SalaryCycle[]
  sessions: WorkSession[]          // sessions of open cycle
  sessionCount: number
  totalHours: number
}

// ─── Success overlay ─────────────────────────────────────────────────────────

interface SuccessOverlayProps {
  received: number
  brandName: string
  newBalance: number
  wishes: WishItem[]
  onClose: () => void
}

function SuccessOverlay({ received, brandName, newBalance, wishes, onClose }: SuccessOverlayProps) {
  const [selectedWish, setSelectedWish] = useState<string>('')

  const handleAllocate = async () => {
    if (!selectedWish) { onClose(); return }
    // POST allocation is handled by the user browsing wishes panel
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 260 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 max-w-sm w-full text-center">
        {/* Lottie-style CSS animation */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-green-500/20"
          />
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="absolute inset-2 rounded-full bg-green-500/30 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>
        </div>

        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-white mb-1"
        >
          Nhận lương thành công! 🎉
        </motion.h3>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-sm mb-4"
        >
          Đã nhận <span className="text-green-400 font-semibold">{formatVND(received)}</span> từ{' '}
          <span className="text-white font-medium">{brandName}</span>
        </motion.p>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#222] rounded-2xl p-4 mb-6 border border-[#2a2a2a]"
        >
          <p className="text-xs text-gray-500 mb-1">Số dư ví hiện tại</p>
          <p className="text-2xl font-bold text-green-400">{formatVND(newBalance)}</p>
        </motion.div>

        {wishes.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-2 justify-center">
              <Star size={14} className="text-amber-400" />
              Bạn muốn phân bổ cho mục tiêu nào?
            </p>
            <select
              value={selectedWish}
              onChange={e => setSelectedWish(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            >
              <option value="">-- Chọn mục tiêu --</option>
              {wishes.map(w => {
                const pct = Math.min(100, Math.round((newBalance / w.price_vnd) * 100))
                return (
                  <option key={w.id} value={w.id}>
                    {w.name} — {formatVND(w.price_vnd)} ({pct}% hoàn thành)
                  </option>
                )
              })}
            </select>
          </motion.div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Bỏ qua
          </Button>
          <Button className="flex-1" onClick={handleAllocate}>
            {selectedWish ? 'Xem tiến trình →' : 'Đóng'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Approval Modal ───────────────────────────────────────────────────────────

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  brand: BrandData
  onSuccess: (received: number, newBalance: number) => void
}

function ApprovalModal({ isOpen, onClose, brand, onSuccess }: ApprovalModalProps) {
  const [amountRaw, setAmountRaw] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { preset, openCycle, sessionCount, totalHours } = brand
  const calculated = openCycle?.total_calculated ?? 0
  const received = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0
  const diff = received - calculated

  // Reset on open
  useEffect(() => {
    if (isOpen) { setAmountRaw(''); setNote(''); setError('') }
  }, [isOpen])

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    // Format with dots as thousands separator
    const formatted = digits ? parseInt(digits, 10).toLocaleString('vi-VN') : ''
    setAmountRaw(formatted)
  }

  async function handleConfirm() {
    if (!received) { setError('Vui lòng nhập số tiền nhận được'); return }
    setError('')
    setLoading(true)
    try {
      let cycleId = openCycle?.id

      // If cycle doesn't exist yet in DB, create it first
      if (!cycleId || cycleId.startsWith('temp-')) {
        const createRes = await fetch('/api/cycles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preset_id: preset.id,
            start_date: new Date().toISOString().split('T')[0],
            cycle_number: (brand.closedCycles?.length || 0) + 1,
            status: 'open',
          }),
        })
        if (!createRes.ok) throw new Error('Không thể tạo chu kỳ lương')
        const newCycleData = await createRes.json()
        cycleId = newCycleData.id
      }

      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_received: received, diff_note: note || null }),
      })
      if (!res.ok) throw new Error('Lỗi khi duyệt lương')
      const data = await res.json()
      const newBalance: number = Number(data.wallet?.cash_balance ?? received)
      onClose()
      onSuccess(received, newBalance)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Duyệt lương — ${preset.name}`} size="md">
      <div className="space-y-5">
        {/* Stats */}
        <div className="bg-[#222] rounded-2xl p-4 border border-[#2a2a2a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Building2 size={14} /> Tổng ca làm
            </span>
            <span className="text-white font-semibold">{sessionCount} ca</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Clock size={14} /> Tổng giờ
            </span>
            <span className="text-white font-semibold">{totalHours.toFixed(1)}h</span>
          </div>
          <div className="h-px bg-[#2a2a2a]" />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Banknote size={14} /> Lương tính toán
            </span>
            <span className="text-violet-400 font-bold text-lg">{formatVND(calculated)}</span>
          </div>
        </div>

        {/* Input amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Số tiền công ty chuyển khoản
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0"
              className={cn(
                'w-full px-4 py-3 pr-12 rounded-xl text-sm text-white bg-[#222] border transition-all outline-none placeholder:text-gray-600',
                error
                  ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-[#2a2a2a] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₫</span>
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        {/* Diff realtime */}
        {received > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 border',
              diff > 0
                ? 'bg-green-500/10 border-green-500/20'
                : diff < 0
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-[#222] border-[#2a2a2a]'
            )}
          >
            {diff > 0 ? (
              <TrendingUp size={16} className="text-green-400 shrink-0" />
            ) : diff < 0 ? (
              <TrendingDown size={16} className="text-red-400 shrink-0" />
            ) : (
              <Minus size={16} className="text-gray-400 shrink-0" />
            )}
            <div>
              <p className="text-xs text-gray-400">Chênh lệch</p>
              <p className={cn(
                'font-semibold text-sm',
                diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-300'
              )}>
                {diff > 0 ? '+' : ''}{formatVND(diff)}
                {diff > 0 && <span className="text-xs font-normal ml-1 text-green-400/70">(thưởng thêm)</span>}
                {diff < 0 && <span className="text-xs font-normal ml-1 text-red-400/70">(khấu trừ)</span>}
                {diff === 0 && <span className="text-xs font-normal ml-1 text-gray-500">(khớp đúng)</span>}
              </p>
            </div>
          </motion.div>
        )}

        {/* Note textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ghi chú chênh lệch <span className="text-gray-500 font-normal">(nếu có)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Lý do thưởng/khấu trừ..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-[#222] border border-[#2a2a2a] outline-none resize-none placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            loading={loading}
            disabled={!received || loading}
          >
            ✅ Xác nhận nhận lương
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── History Accordion ────────────────────────────────────────────────────────

interface HistoryAccordionProps {
  cycles: SalaryCycle[]
  color: string
}

function HistoryAccordion({ cycles, color }: HistoryAccordionProps) {
  const [open, setOpen] = useState(false)

  if (cycles.length === 0) return null

  return (
    <div className="border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1e1e1e] hover:bg-[#222] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm text-gray-300 font-medium">
          <History size={14} className="text-gray-500" />
          Lịch sử duyệt ({cycles.length} chu kỳ)
        </span>
        {open
          ? <ChevronUp size={16} className="text-gray-500" />
          : <ChevronDown size={16} className="text-gray-500" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-[#2a2a2a]">
              {cycles.map(c => {
                const diff = (c.total_received ?? 0) - c.total_calculated
                return (
                  <div key={c.id} className="px-4 py-3 bg-[#1a1a1a] text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="font-medium"
                        style={{ color }}
                      >
                        {parseCycleMonth(c)} · Chu kỳ #{c.cycle_number}
                      </span>
                      <span className="text-xs text-gray-500">
                        {c.closed_at ? formatDate(c.closed_at) : '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 mb-0.5">Tính toán</p>
                        <p className="text-gray-200">{formatVND(c.total_calculated)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Đã nhận</p>
                        <p className="text-white font-semibold">
                          {c.total_received != null ? formatVND(c.total_received) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Chênh lệch</p>
                        <p className={cn(
                          'font-semibold',
                          diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'
                        )}>
                          {c.total_received != null
                            ? `${diff > 0 ? '+' : ''}${formatVND(diff)}`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {c.diff_note && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{c.diff_note}"</p>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sessions List ────────────────────────────────────────────────────────────

interface SessionsListProps {
  sessions: WorkSession[]
  color: string
}

function SessionsList({ sessions, color }: SessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-600 text-sm">
        Chưa có ca làm trong chu kỳ này
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div
          key={s.id}
          className="flex items-center justify-between bg-[#1e1e1e] rounded-xl px-3 py-2.5 border border-[#252525]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <p className="text-sm text-gray-200 font-medium">{formatDate(s.work_date)}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(s.check_in).split(' ')[1]} → {formatDateTime(s.check_out).split(' ')[1]}
                {' · '}{Number(s.total_hours).toFixed(1)}h
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-semibold text-gray-100">{formatVND(s.calculated_amount)}</p>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              s.status === 'approved'
                ? 'bg-green-500/15 text-green-400'
                : 'bg-amber-500/15 text-amber-400'
            )}>
              {s.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Brand Card ───────────────────────────────────────────────────────────────

interface BrandCardProps {
  data: BrandData
  onApprove: () => void
}

function BrandCard({ data, onApprove }: BrandCardProps) {
  const { preset, openCycle, closedCycles, sessions, sessionCount } = data
  const [expanded, setExpanded] = useState(false)

  const hasOpenCycle = openCycle !== null
  const hasPending = hasOpenCycle && sessionCount > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden"
      style={{ borderLeftColor: preset.color, borderLeftWidth: 4 }}
    >
      {/* Card header */}
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: preset.color + '22' }}
            >
              <Building2 size={18} style={{ color: preset.color }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base uppercase tracking-wide">
                {preset.name}
              </h3>
              {preset.description && (
                <p className="text-xs text-gray-500">{preset.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPending && (
              <span className="bg-amber-500/15 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
                CHỜ DUYỆT
              </span>
            )}
            {!hasPending && hasOpenCycle && (
              <span className="bg-green-500/15 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-500/20">
                ĐÃ DUYỆT
              </span>
            )}
            {!hasOpenCycle && (
              <span className="bg-blue-500/15 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                SẴN SÀNG
              </span>
            )}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown size={16} className="text-gray-500" />
            </motion.div>
          </div>
        </div>

        {/* Cycle info */}
        {hasOpenCycle ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar size={13} />
              <span>Chu kỳ hiện tại: <span className="text-gray-200">{parseCycleMonth(openCycle)}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock size={13} />
              <span>Số ca: <span className="text-gray-200">{sessionCount} ca</span>
                {data.totalHours > 0 && <span className="ml-2 text-gray-500">· {data.totalHours.toFixed(1)}h</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tính toán:</span>
              <span
                className="text-2xl font-bold"
                style={{ color: preset.color }}
              >
                {formatVND(openCycle.total_calculated)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar size={13} />
              <span>Chu kỳ mới: <span className="text-gray-300">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span></span>
            </div>
            <p className="text-xs text-gray-500">Chưa có ca làm việc nào trong chu kỳ này</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-5 pb-5" onClick={e => e.stopPropagation()}>
        {closedCycles.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setExpanded(v => !v)}
          >
            <History size={13} />
            {expanded ? 'Ẩn lịch sử' : 'Lịch sử chu kỳ'}
          </Button>
        )}
        <Button
          size="sm"
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{ backgroundColor: preset.color + 'dd', borderColor: preset.color }}
          onClick={onApprove}
          disabled={sessionCount === 0 || !openCycle}
        >
          <Banknote size={13} />
          💰 Duyệt Lương →
        </Button>
      </div>

      {/* Expanded: sessions + history */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#222] px-5 pt-4 pb-5 space-y-4">
              {/* Current cycle sessions */}
              {hasOpenCycle && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Ca làm — {parseCycleMonth(openCycle)}
                  </p>
                  <SessionsList sessions={sessions} color={preset.color} />
                </div>
              )}

              {/* History accordion */}
              <HistoryAccordion cycles={closedCycles} color={preset.color} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function BrandsPanel() {
  const [brands, setBrands] = useState<BrandData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Approval modal
  const [approvalTarget, setApprovalTarget] = useState<BrandData | null>(null)

  // Success overlay
  const [successInfo, setSuccessInfo] = useState<{
    received: number; brandName: string; newBalance: number
  } | null>(null)
  const [wishes, setWishes] = useState<WishItem[]>([])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [presetsRes, openCyclesRes, closedCyclesRes, wishesRes] = await Promise.all([
        fetch('/api/presets', { cache: 'no-store' }),
        fetch('/api/cycles?status=open', { cache: 'no-store' }),
        fetch('/api/cycles?status=closed', { cache: 'no-store' }),
        fetch('/api/wishes', { cache: 'no-store' }),
      ])

      const [presetsData, openCycles, closedCycles, wishData] = await Promise.all([
        presetsRes.json(),
        openCyclesRes.json(),
        closedCyclesRes.json(),
        wishesRes.json(),
      ])

      const presetsList: JobPreset[] = Array.isArray(presetsData) ? presetsData : (presetsData?.data ?? [])
      const openList: SalaryCycle[] = Array.isArray(openCycles) ? openCycles : (openCycles?.data ?? [])
      const closedList: SalaryCycle[] = Array.isArray(closedCycles) ? closedCycles : (closedCycles?.data ?? [])
      const wishesList: WishItem[] = Array.isArray(wishData) ? wishData : (wishData?.data ?? [])

      setWishes(wishesList)

      // For each preset, fetch sessions of its open cycle or pending sessions
      const brandDataList: BrandData[] = await Promise.all(
        presetsList.map(async (preset) => {
          const rawOpenCycle = openList.find(c => c.preset_id === preset.id) ?? null
          const closedForPreset = closedList
            .filter(c => c.preset_id === preset.id)
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

          let sessions: WorkSession[] = []
          try {
            const sessRes = await fetch(`/api/sessions?preset_id=${preset.id}&status=pending`)
            const sessData = await sessRes.json()
            sessions = (Array.isArray(sessData) ? sessData : (sessData?.data ?? [])) as WorkSession[]
          } catch {
            sessions = []
          }

          const sessionCount = sessions.length
          const totalHours = sessions.reduce((sum, s) => sum + Number(s.total_hours || 0), 0)
          const sessionCalcAmount = sessions.reduce((sum, s) => sum + Number(s.calculated_amount || 0), 0)

          const openCycle: SalaryCycle | null = rawOpenCycle
            ? { ...rawOpenCycle, total_calculated: Math.max(rawOpenCycle.total_calculated || 0, sessionCalcAmount) }
            : (sessionCount > 0 ? {
                id: 'temp-' + preset.id,
                preset_id: preset.id,
                cycle_number: closedForPreset.length + 1,
                start_date: sessions[sessions.length - 1]?.work_date || new Date().toISOString().split('T')[0],
                total_calculated: sessionCalcAmount,
                status: 'open',
                created_at: new Date().toISOString(),
              } : null)

          return { preset, openCycle, closedCycles: closedForPreset, sessions, sessionCount, totalHours }
        })
      )

      setBrands(brandDataList)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Computed ───────────────────────────────────────────────────────────────

  const totalPending = brands.reduce((sum, b) => {
    return sum + (b.openCycle?.total_calculated ?? 0)
  }, 0)

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSuccess(received: number, newBalance: number) {
    setSuccessInfo({
      received,
      brandName: approvalTarget?.preset.name ?? '',
      newBalance,
    })
    // Refresh data
    await fetchAll()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-[#1a1a1a] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 size={20} className="text-violet-400" />
              Thương Hiệu
            </h1>
            {!loading && totalPending > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">
                Tổng chờ duyệt:{' '}
                <span className="text-amber-400 font-semibold">{formatVND(totalPending)}</span>
              </p>
            )}
          </div>
          <button
            onClick={fetchAll}
            className="p-2 rounded-xl hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#222] rounded-xl" />
                  <div>
                    <div className="h-4 w-28 bg-[#222] rounded mb-1" />
                    <div className="h-3 w-20 bg-[#1e1e1e] rounded" />
                  </div>
                </div>
                <div className="h-8 w-40 bg-[#222] rounded mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-[#222] rounded-xl" />
                  <div className="h-8 flex-1 bg-[#222] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={20} />
            <div>
              <p className="text-red-400 font-medium text-sm">Lỗi tải dữ liệu</p>
              <p className="text-gray-500 text-xs mt-0.5">{error}</p>
            </div>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={fetchAll}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && brands.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Building2 size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Chưa có thương hiệu nào</p>
            <p className="text-sm mt-1">Thêm job preset để bắt đầu</p>
          </div>
        )}

        {/* Brand cards */}
        {!loading && !error && (
          <AnimatePresence>
            {brands.map(b => (
              <BrandCard
                key={b.preset.id}
                data={b}
                onApprove={() => setApprovalTarget(b)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Summary footer */}
        {!loading && brands.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2">
                <Banknote size={14} />
                Tổng lương đang chờ (tất cả brand)
              </span>
              <span className="text-amber-400 font-bold text-base">{formatVND(totalPending)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500 flex items-center gap-2">
                <CheckCircle2 size={14} />
                Đã duyệt (tổng lịch sử)
              </span>
              <span className="text-green-400 font-semibold">
                {formatVND(
                  brands.reduce((sum, b) =>
                    sum + b.closedCycles.reduce((s, c) => s + (c.total_received ?? 0), 0), 0)
                )}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Approval Modal */}
      {approvalTarget && (
        <ApprovalModal
          isOpen={!!approvalTarget}
          onClose={() => setApprovalTarget(null)}
          brand={approvalTarget}
          onSuccess={handleSuccess}
        />
      )}

      {/* Success Overlay */}
      <AnimatePresence>
        {successInfo && (
          <SuccessOverlay
            received={successInfo.received}
            brandName={successInfo.brandName}
            newBalance={successInfo.newBalance}
            wishes={wishes}
            onClose={() => setSuccessInfo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
