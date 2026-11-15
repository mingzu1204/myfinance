'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  Star,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Sparkles,
  Target,
  AlertCircle,
  ShoppingBag,
  Zap,
  Trophy,
  PiggyBank,
  CheckCircle2,
  RotateCcw,
  Clock,
  ArrowRight,
  Wallet,
  Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatVND } from '@/lib/calculations'
import { estimateDaysToGoal } from '@/lib/calculations'
import type { WishItem, JobPreset } from '@/lib/types'
import { parseWishMeta, serializeWishMeta } from '@/lib/metadata'
import confetti from 'canvas-confetti'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WishesPanelProps {
  onNavigate?: (tab: string) => void
}

interface ProgressInfo {
  totalAvailable: number
  progressPct: number
  cashOnlyPct: number
  lockedPct: number
  daysLeft: number
  amountLeft: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeProgress(
  cashBalance: number,
  pendingTotal: number,
  itemPrice: number,
  avgDaily: number,
  allocatedAmount: number = 0,
): ProgressInfo {
  // Free cash is cashBalance minus already allocated money (or total available for this item)
  const totalAvailable = Math.max(allocatedAmount, cashBalance + pendingTotal * 0.85)
  const progressPct = Math.min(100, Math.round((totalAvailable / itemPrice) * 100))
  const cashOnlyPct = Math.min(100, Math.round((cashBalance / itemPrice) * 100))
  const lockedPct = Math.min(100, Math.round((allocatedAmount / itemPrice) * 100))
  const daysLeft = estimateDaysToGoal(cashBalance, pendingTotal * 0.85, itemPrice, avgDaily)
  const amountLeft = Math.max(0, itemPrice - totalAvailable)
  return { totalAvailable, progressPct, cashOnlyPct, lockedPct, daysLeft, amountLeft }
}

function parsePriceInput(formatted: string): number {
  return Number(formatted.replace(/\./g, '').replace(/,/g, ''))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WishCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden animate-pulse">
      <div className="w-full h-52 bg-[#2a2a2a]" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-[#2a2a2a] rounded" />
        <div className="h-5 w-1/2 bg-[#2a2a2a] rounded" />
        <div className="h-2 w-full bg-[#2a2a2a] rounded-full" />
        <div className="h-3 w-2/3 bg-[#2a2a2a] rounded" />
      </div>
    </div>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'hover:scale-110 transition-transform'}`}
        >
          <Star
            size={16}
            className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── TikTok Icon ─────────────────────────────────────────────────────────────

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
    </svg>
  )
}

function triggerConfetti() {
  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#7c3aed', '#a855f7', '#10b981', '#f59e0b', '#ec4899'],
    scalar: 0.8,
  })
}

// ─── Wish Card ───────────────────────────────────────────────────────────────

interface WishCardProps {
  item: WishItem
  progress: ProgressInfo
  isFirst: boolean
  isLast: boolean
  onDelete: (id: string) => void
  onEdit: (item: WishItem) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onShiftCalc: (item: WishItem) => void
  onBuyNow: (item: WishItem) => void
  onPiggyBank: (item: WishItem) => void
}

function WishCard({
  item,
  progress,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  onShiftCalc,
  onBuyNow,
  onPiggyBank,
}: WishCardProps) {
  const isAffordable = progress.progressPct >= 100
  const hasImage = !!item.image_url
  const meta = parseWishMeta(item.notes)
  const confettiFiredRef = useRef(false)
  const [tiktokOpen, setTiktokOpen] = useState(false)

  useEffect(() => {
    if (isAffordable && !confettiFiredRef.current) {
      confettiFiredRef.current = true
      triggerConfetti()
    }
    if (!isAffordable) confettiFiredRef.current = false
  }, [isAffordable])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      className={`relative rounded-2xl bg-[#1a1a1a] border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
        isAffordable
          ? 'border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
          : 'border-[#2a2a2a]'
      }`}
    >
      <div>
        {/* Affordable badge */}
        {isAffordable && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md">
            <span className="text-emerald-400 text-xs font-semibold">✅ Đủ tiền mua rồi!</span>
          </div>
        )}

        {/* Piggy locked badge */}
        {meta.allocated_amount && meta.allocated_amount > 0 ? (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 backdrop-blur-md text-pink-300 text-xs font-semibold">
            <PiggyBank size={13} />
            <span>Đã khóa {formatVND(meta.allocated_amount)}</span>
          </div>
        ) : null}

        {/* Image */}
        {hasImage ? (
          <div className="relative w-full" style={{ background: '#111' }}>
            <div className="relative w-full" style={{ minHeight: 160 }}>
              <Image
                src={item.image_url!}
                alt={item.name}
                width={600}
                height={400}
                className="w-full h-auto object-contain"
                style={{ display: 'block', background: '#111' }}
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-36 bg-[#111] flex items-center justify-center">
            <Target size={40} className="text-[#2a2a2a]" />
          </div>
        )}

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Name + Priority */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white text-base leading-tight">🎯 {item.name}</p>
              {meta.note && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{meta.note}</p>}
            </div>
            <StarRating value={item.priority} readonly />
          </div>

          {/* Price */}
          <p className="text-violet-300 font-bold text-lg">{formatVND(item.price_vnd)}</p>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Tiến trình</span>
              <span className={`font-semibold ${isAffordable ? 'text-emerald-400' : 'text-violet-400'}`}>
                {progress.progressPct}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden flex">
              {/* Locked portion */}
              {progress.lockedPct > 0 && (
                <div
                  style={{ width: `${Math.min(100, progress.lockedPct)}%` }}
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                  title={`Đã khóa riêng: ${progress.lockedPct}%`}
                />
              )}
              {/* Rest of progress */}
              <div
                style={{ width: `${Math.max(0, progress.progressPct - progress.lockedPct)}%` }}
                className={`h-full ${
                  isAffordable
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600'
                }`}
              />
            </div>
          </div>

          {/* Amount left + days */}
          {!isAffordable ? (
            <div className="space-y-1 text-xs">
              <p className="text-gray-400">
                Còn thiếu: <span className="text-red-400 font-medium">{formatVND(progress.amountLeft)}</span>
              </p>
              {progress.daysLeft > 0 && (
                <p className="text-gray-400">
                  Dự kiến: <span className="text-amber-400 font-medium">~{progress.daysLeft} ngày nữa</span> ✨
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-emerald-400 font-medium">✨ Bạn đã có đủ tiền để sở hữu món đồ này!</p>
          )}

          {/* Quick Actions (Buy Now & Piggy Bank) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onBuyNow(item)}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ShoppingBag size={14} />
              <span>Rước Về Ngay</span>
            </button>
            <button
              onClick={() => onPiggyBank(item)}
              className="py-2.5 px-3 rounded-xl bg-[#222] hover:bg-[#282828] text-pink-300 border border-pink-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <PiggyBank size={14} className="text-pink-400" />
              <span>Nuôi Heo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Card actions */}
      <div className="p-4 pt-0">
        <div className="flex items-center gap-2 flex-wrap border-t border-[#252525] pt-3">
          {/* TikTok links */}
          {item.tiktok_links?.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setTiktokOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111] border border-[#2a2a2a] text-xs text-gray-300 hover:text-white transition-all"
              >
                <TikTokIcon size={12} />
                <span>TikTok ({item.tiktok_links.length})</span>
              </button>
              <AnimatePresence>
                {tiktokOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-10 left-0 z-30 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-2 shadow-xl min-w-[200px] max-w-[280px] space-y-1"
                  >
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span className="text-xs text-gray-400 font-medium">TikTok Links</span>
                      <button onClick={() => setTiktokOpen(false)}>
                        <X size={12} className="text-gray-500" />
                      </button>
                    </div>
                    {item.tiktok_links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#222] transition-colors group"
                      >
                        <TikTokIcon size={12} />
                        <span className="text-xs text-gray-400 group-hover:text-white truncate max-w-[180px]">
                          {link.replace('https://', '').slice(0, 32)}…
                        </span>
                        <ExternalLink size={10} className="text-gray-600 shrink-0" />
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Shift calc button */}
          <button
            onClick={() => onShiftCalc(item)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111] border border-[#2a2a2a] text-xs text-gray-300 hover:text-amber-400 transition-all"
          >
            <Zap size={12} />
            <span>+Ca làm</span>
          </button>

          <div className="flex-1" />

          {/* Reorder */}
          <div className="flex gap-1">
            <button
              onClick={() => onMoveUp(item.id)}
              disabled={isFirst}
              className="p-1 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronUp size={13} />
            </button>
            <button
              onClick={() => onMoveDown(item.id)}
              disabled={isLast}
              className="p-1 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronDown size={13} />
            </button>
          </div>

          {/* Edit */}
          <button
            onClick={() => onEdit(item)}
            className="p-1 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-400 hover:text-violet-400"
          >
            <Edit2 size={13} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-400 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Trophy Card (Bức Tường Thành Tựu) ─────────────────────────────────────────

interface TrophyCardProps {
  item: WishItem
  onRevert: (item: WishItem) => void
  onDelete: (id: string) => void
}

function TrophyCard({ item, onRevert, onDelete }: TrophyCardProps) {
  const meta = parseWishMeta(item.notes)
  const hasImage = !!item.image_url

  const formattedDate = meta.purchased_at
    ? new Date(meta.purchased_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Gần đây'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative rounded-2xl bg-[#181611] border border-amber-500/40 p-4 space-y-3 shadow-lg shadow-amber-950/20 overflow-hidden"
    >
      {/* Golden glow banner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Trophy Badge */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
          <Trophy size={13} className="text-amber-400" />
          ĐÃ SỞ HỮU
        </span>
        <span className="text-xs text-gray-400">🗓️ {formattedDate}</span>
      </div>

      {/* Image if available */}
      {hasImage && (
        <div className="relative w-full rounded-xl overflow-hidden max-h-40 bg-[#111] border border-[#2a2a2a]">
          <Image
            src={item.image_url!}
            alt={item.name}
            width={400}
            height={250}
            className="w-full h-auto object-contain max-h-40"
            unoptimized
          />
        </div>
      )}

      {/* Name and Price */}
      <div>
        <h4 className="font-bold text-white text-base leading-tight">🏆 {item.name}</h4>
        <p className="text-amber-400 font-extrabold text-lg mt-0.5">{formatVND(item.price_vnd)}</p>
      </div>

      {/* Effort Badge: Hours Worked */}
      <div className="p-3 bg-[#241e12] border border-amber-500/20 rounded-xl space-y-1">
        <p className="text-xs text-amber-200/80 font-medium flex items-center gap-1.5">
          <Clock size={13} className="text-amber-400" />
          Thành quả cày cuốc:
        </p>
        <p className="text-xs text-gray-300">
          Bạn đã cày cuốc tương đương{' '}
          <strong className="text-amber-300 font-bold">
            ~{meta.hours_worked_to_buy || Math.max(1, Math.round(item.price_vnd / 50000))} giờ làm việc
          </strong>{' '}
          để rước em này về!
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          onClick={() => onRevert(item)}
          className="flex items-center gap-1 text-gray-400 hover:text-amber-300 transition-colors"
        >
          <RotateCcw size={12} />
          <span>Hoàn lại ước mơ</span>
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
          <span>Xóa</span>
        </button>
      </div>
    </motion.div>
  )
}

// ─── Buy Now Confirmation Modal ───────────────────────────────────────────────

interface BuyNowModalProps {
  item: WishItem | null
  cashBalance: number
  avgHourlyRate: number
  onClose: () => void
  onSuccess: () => void
}

function BuyNowModal({ item, cashBalance, avgHourlyRate, onClose, onSuccess }: BuyNowModalProps) {
  const [submitting, setSubmitting] = useState(false)

  if (!item) return null

  const isEnough = cashBalance >= item.price_vnd
  const remaining = cashBalance - item.price_vnd
  const hours = Math.max(1, Math.round(item.price_vnd / (avgHourlyRate || 50000)))

  const handleConfirmPurchase = async () => {
    try {
      setSubmitting(true)

      // 1. Deduct wallet cash
      const walletRes = await fetch('/api/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: item.price_vnd,
          operation: 'subtract',
          note: `Mua mục tiêu: ${item.name}`,
        }),
      })

      if (!walletRes.ok) throw new Error('Không thể trừ tiền trong ví')

      // 2. Mark item as purchased in notes
      const existingMeta = parseWishMeta(item.notes)
      const serialized = serializeWishMeta({
        note: existingMeta.note,
        is_purchased: true,
        purchased_at: new Date().toISOString(),
        hours_worked_to_buy: hours,
        allocated_amount: 0,
      })

      const wishRes = await fetch(`/api/wishes/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: serialized }),
      })

      if (!wishRes.ok) throw new Error('Không thể cập nhật trạng thái mục tiêu')

      // Confetti burst
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#7c3aed'],
      })

      toast.success(`🎉 Chúc mừng! Bạn đã rước thành công "${item.name}"!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi mua mục tiêu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl md:rounded-2xl p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Xác Nhận Rước Mục Tiêu</h3>
            </div>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded-lg">
              <X size={16} />
            </button>
          </div>

          {/* Item Info Card */}
          <div className="p-4 bg-[#141414] border border-[#282828] rounded-2xl space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mục tiêu mua sắm</p>
            <p className="font-bold text-white text-lg">🎯 {item.name}</p>
            <p className="text-xl font-extrabold text-violet-400">{formatVND(item.price_vnd)}</p>
          </div>

          {/* Financial Calculation */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Số dư ví hiện tại:</span>
              <span className="font-semibold text-white">{formatVND(cashBalance)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Số tiền trừ khỏi ví:</span>
              <span className="font-semibold text-red-400">-{formatVND(item.price_vnd)}</span>
            </div>
            <div className="h-px bg-[#2a2a2a]" />
            <div className="flex justify-between font-bold">
              <span className="text-gray-300">Ví sau khi mua:</span>
              <span className={remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {formatVND(remaining)}
              </span>
            </div>
          </div>

          {/* Warning if insufficient */}
          {!isEnough && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p>
                Số dư ví hiện tại chưa đủ (còn thiếu {formatVND(Math.abs(remaining))}). Bạn vẫn có thể mua nếu đã dùng tiền mặt ngoài!
              </p>
            </div>
          )}

          {/* Effort stat */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Clock size={15} className="shrink-0 text-amber-400" />
            <span>Món này tương đương ~<strong>{hours} giờ làm việc</strong> chăm chỉ!</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#222] hover:bg-[#282828] text-gray-300 text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmPurchase}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '🛍️ Xác Nhận Mua'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Piggy Bank Modal (Hũ Tiết Kiệm Riêng / Khóa Tiền) ─────────────────────────

interface PiggyBankModalProps {
  item: WishItem | null
  cashBalance: number
  onClose: () => void
  onSuccess: () => void
}

function PiggyBankModal({ item, cashBalance, onClose, onSuccess }: PiggyBankModalProps) {
  const [amountRaw, setAmountRaw] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!item) return null

  const meta = parseWishMeta(item.notes)
  const currentLocked = meta.allocated_amount || 0
  const parsedInput = Number(amountRaw.replace(/\D/g, '')) || 0

  const handleUpdateLocked = async (newAmount: number) => {
    try {
      setSubmitting(true)
      const targetAmount = Math.max(0, Math.min(item.price_vnd, newAmount))

      const serialized = serializeWishMeta({
        ...meta,
        allocated_amount: targetAmount,
      })

      const res = await fetch(`/api/wishes/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: serialized }),
      })

      if (!res.ok) throw new Error()
      toast.success(`Đã cập nhật tiền khóa vào hũ: ${formatVND(targetAmount)}`)
      onSuccess()
      onClose()
    } catch {
      toast.error('Không thể cập nhật hũ tiết kiệm')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl md:rounded-2xl p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2 text-pink-400">
              <PiggyBank size={18} />
              <h3 className="font-bold text-white text-base">Hũ Tiết Kiệm Riêng</h3>
            </div>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="p-3 bg-[#141414] border border-[#252525] rounded-xl space-y-1">
            <p className="text-xs text-gray-400">Dành riêng cho món đồ:</p>
            <p className="font-bold text-white text-sm">🎯 {item.name}</p>
            <p className="text-xs text-gray-500">Giá trị món đồ: {formatVND(item.price_vnd)}</p>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Hiện đã khóa trong hũ:</span>
            <span className="font-bold text-pink-400 text-sm">{formatVND(currentLocked)}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">Nhập số tiền muốn khóa vào hũ:</label>
            <input
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setAmountRaw(raw ? Number(raw).toLocaleString('vi-VN') : '')
              }}
              placeholder="VD: 500.000"
              className="w-full px-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Quick chips */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-gray-500">Nhanh:</span>
            {[200000, 500000, 1000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountRaw(amt.toLocaleString('vi-VN'))}
                className="px-2 py-1 bg-[#222] hover:bg-pink-600/30 text-gray-300 hover:text-pink-300 border border-[#333] rounded-lg transition-colors"
              >
                +{formatVND(amt)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmountRaw(cashBalance.toLocaleString('vi-VN'))}
              className="px-2 py-1 bg-[#222] hover:bg-pink-600/30 text-gray-300 hover:text-pink-300 border border-[#333] rounded-lg transition-colors"
            >
              Toàn bộ ví ({formatVND(cashBalance)})
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleUpdateLocked(currentLocked + parsedInput)}
              disabled={submitting || parsedInput <= 0}
              className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-pink-900/30"
            >
              + Khóa thêm vào hũ
            </button>
            {currentLocked > 0 && (
              <button
                type="button"
                onClick={() => handleUpdateLocked(0)}
                disabled={submitting}
                className="py-2.5 px-3 bg-[#222] hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-[#333] font-semibold text-xs rounded-xl transition-colors"
              >
                Mở khóa hết
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface WishFormData {
  name: string
  price_vnd_display: string
  image_url: string
  tiktok_links: string
  priority: number
  notes: string
}

type ImageStatus = 'idle' | 'loading' | 'valid' | 'invalid'

interface WishModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  editItem?: WishItem | null
}

function WishModal({ isOpen, onClose, onSaved, editItem }: WishModalProps) {
  const isEdit = !!editItem

  const [form, setForm] = useState<WishFormData>({
    name: '',
    price_vnd_display: '',
    image_url: '',
    tiktok_links: '',
    priority: 3,
    notes: '',
  })
  const [imageStatus, setImageStatus] = useState<ImageStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof WishFormData, string>>>({})
  const imageDebounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (editItem) {
      const meta = parseWishMeta(editItem.notes)
      setForm({
        name: editItem.name,
        price_vnd_display: editItem.price_vnd ? Number(editItem.price_vnd).toLocaleString('vi-VN') : '',
        image_url: editItem.image_url ?? '',
        tiktok_links: (editItem.tiktok_links ?? []).join('\n'),
        priority: editItem.priority ?? 3,
        notes: meta.note ?? '',
      })
      setImageStatus(editItem.image_url ? 'valid' : 'idle')
    } else {
      setForm({ name: '', price_vnd_display: '', image_url: '', tiktok_links: '', priority: 3, notes: '' })
      setImageStatus('idle')
    }
    setErrors({})
  }, [isOpen, editItem])

  const validateImageUrl = useCallback((url: string) => {
    if (!url.trim()) {
      setImageStatus('idle')
      return
    }
    setImageStatus('loading')
    if (imageDebounceRef.current) clearTimeout(imageDebounceRef.current)
    imageDebounceRef.current = setTimeout(() => {
      const img = new window.Image()
      img.onload = () => setImageStatus('valid')
      img.onerror = () => setImageStatus('invalid')
      img.src = url.trim()
    }, 500)
  }, [])

  const handleField = (field: keyof WishFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === 'image_url') validateImageUrl(value)
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Partial<Record<keyof WishFormData, string>> = {}
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên món đồ'
    const price = parsePriceInput(form.price_vnd_display)
    if (!price || price <= 0) errs.price_vnd_display = 'Vui lòng nhập giá tiền hợp lệ'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const links = form.tiktok_links
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const existingMeta = editItem ? parseWishMeta(editItem.notes) : null
    const serializedNotes = serializeWishMeta({
      note: form.notes.trim(),
      is_purchased: existingMeta?.is_purchased || false,
      purchased_at: existingMeta?.purchased_at,
      hours_worked_to_buy: existingMeta?.hours_worked_to_buy,
      allocated_amount: existingMeta?.allocated_amount || 0,
    })

    const payload = {
      name: form.name.trim(),
      price_vnd: price,
      image_url: form.image_url.trim() || null,
      tiktok_links: links,
      priority: form.priority,
      notes: serializedNotes,
    }

    try {
      setSubmitting(true)
      const url = isEdit ? `/api/wishes/${editItem.id}` : '/api/wishes'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      toast.success(isEdit ? 'Cập nhật mục tiêu thành công!' : 'Đã thêm mục tiêu mới!')
      onSaved()
      onClose()
    } catch {
      toast.error('Lỗi khi lưu mục tiêu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl md:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a] shrink-0">
              <h3 className="font-bold text-white text-base">
                {isEdit ? '✏️ Chỉnh Sửa Mục Tiêu' : '🎯 Thêm Mục Tiêu Mới'}
              </h3>
              <button onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1">
                  Tên mục tiêu <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                  placeholder="VD: iPhone 16 Pro, Xe máy, Tai nghe Sony..."
                  className="w-full px-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1">
                  Giá tiền (VND) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.price_vnd_display}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    handleField('price_vnd_display', raw ? Number(raw).toLocaleString('vi-VN') : '')
                  }}
                  placeholder="VD: 25.000.000"
                  className="w-full px-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
                {errors.price_vnd_display && (
                  <p className="text-xs text-red-400 mt-1">{errors.price_vnd_display}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1">
                  Link ảnh sản phẩm <span className="text-gray-500">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => handleField('image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1">Độ ưu tiên</label>
                <StarRating value={form.priority} onChange={(v) => handleField('priority', v)} />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1">
                  Ghi chú <span className="text-gray-500">(tùy chọn)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleField('notes', e.target.value)}
                  placeholder="Ghi chú thêm về món đồ này..."
                  rows={2}
                  className="w-full px-4 py-2 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2"
              >
                {submitting ? 'Đang lưu...' : isEdit ? 'Cập Nhật Mục Tiêu' : 'Thêm Mục Tiêu'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Shift Calculator Modal ───────────────────────────────────────────────────

interface ShiftCalcModalProps {
  item: WishItem | null
  onClose: () => void
}

function ShiftCalcModal({ item, onClose }: ShiftCalcModalProps) {
  const [amount, setAmount] = useState('')

  if (!item) return null

  const shiftAmount = parsePriceInput(amount)
  const pct = shiftAmount > 0 ? ((shiftAmount / item.price_vnd) * 100).toFixed(1) : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl md:rounded-2xl p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2a2a]">
            <h4 className="font-bold text-white text-sm">Tính toán tỷ lệ ca làm</h4>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded-lg">
              <X size={15} />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Mục tiêu: <strong className="text-white">{item.name}</strong> ({formatVND(item.price_vnd)})
          </p>
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              Thu nhập 1 ca làm của bạn (VND):
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setAmount(raw ? Number(raw).toLocaleString('vi-VN') : '')
              }}
              placeholder="VD: 350.000"
              className="w-full px-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {pct && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-xs text-gray-400">1 ca làm việc đóng góp được:</p>
              <p className="text-2xl font-black text-amber-400 mt-1">+{pct}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Cần khoảng ~{Math.ceil(item.price_vnd / shiftAmount)} ca làm nữa để hoàn thành!
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#222] text-gray-400 text-xs hover:bg-[#282828] transition-colors"
          >
            Đóng
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  itemName: string | null
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirm({ itemName, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <AnimatePresence>
      {itemName !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Xóa mục tiêu?</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Bạn chắc muốn xóa <span className="text-white font-medium">"{itemName}"</span>?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#222] text-gray-300 text-sm font-medium hover:bg-[#2a2a2a] border border-[#333] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Xóa
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function WishesPanel({ onNavigate: _onNavigate }: WishesPanelProps) {
  const [wishes, setWishes] = useState<WishItem[]>([])
  const [presets, setPresets] = useState<JobPreset[]>([])
  const [cashBalance, setCashBalance] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [avgDaily, setAvgDaily] = useState(0)
  const [loading, setLoading] = useState(true)

  // Sub-tabs: 'active' | 'trophy'
  const [activeTab, setActiveTab] = useState<'active' | 'trophy'>('active')

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<WishItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<WishItem | null>(null)
  const [shiftItem, setShiftItem] = useState<WishItem | null>(null)
  const [buyNowItem, setBuyNowItem] = useState<WishItem | null>(null)
  const [piggyBankItem, setPiggyBankItem] = useState<WishItem | null>(null)

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const ts = Date.now()
      const [wishesRes, walletRes, cyclesRes, sessionsRes, presetsRes] = await Promise.allSettled([
        fetch(`/api/wishes?_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/wallet?_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/cycles?status=open&_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/sessions?limit=100&_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/presets?_t=${ts}`, { cache: 'no-store' }),
      ])

      if (wishesRes.status === 'fulfilled' && wishesRes.value.ok) {
        const data = await wishesRes.value.json()
        setWishes(Array.isArray(data) ? data : [])
      }

      if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
        const data = await walletRes.value.json()
        setCashBalance(data.cash_balance ?? 0)
      }

      if (cyclesRes.status === 'fulfilled' && cyclesRes.value.ok) {
        const data = await cyclesRes.value.json()
        const cycles = Array.isArray(data) ? data : data.cycles ?? []
        const total = cycles.reduce((s: number, c: any) => s + (c.total_calculated ?? 0), 0)
        setPendingTotal(total)
      }

      if (presetsRes.status === 'fulfilled' && presetsRes.value.ok) {
        const data = await presetsRes.value.json()
        setPresets(Array.isArray(data) ? data : (data?.data ?? []))
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.ok) {
        const data = await sessionsRes.value.json()
        const sessions: any[] = Array.isArray(data) ? data : data.sessions ?? []
        const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000
        const recent = sessions.filter((s) => new Date(s.work_date).getTime() >= sevenDaysAgo)
        if (recent.length > 0) {
          const totalEarned = recent.reduce((s: number, s2: any) => s + (s2.calculated_amount ?? 0), 0)
          setAvgDaily(totalEarned / 7)
        }
      }
    } catch (err) {
      console.error('WishesPanel fetch error:', err)
      toast.error('Lỗi tải dữ liệu mục tiêu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Average hourly rate across user presets
  const avgHourlyRate = useMemo(() => {
    if (presets.length === 0) return 50000
    return Math.round(presets.reduce((acc, p) => acc + (p.hourly_rate || 0), 0) / presets.length)
  }, [presets])

  // Separate active wishes vs purchased/trophy wishes
  const { activeWishes, trophyWishes } = useMemo(() => {
    const active: WishItem[] = []
    const trophy: WishItem[] = []

    wishes.forEach((w) => {
      const meta = parseWishMeta(w.notes)
      if (meta.is_purchased) {
        trophy.push(w)
      } else {
        active.push(w)
      }
    })

    active.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return { activeWishes: active, trophyWishes: trophy }
  }, [wishes])

  // Revert purchased item back to active wishlist
  const handleRevertTrophy = async (item: WishItem) => {
    try {
      const meta = parseWishMeta(item.notes)
      const serialized = serializeWishMeta({
        ...meta,
        is_purchased: false,
        purchased_at: undefined,
      })

      const res = await fetch(`/api/wishes/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: serialized }),
      })

      if (!res.ok) throw new Error()
      toast.success(`Đã đưa "${item.name}" trở lại mục tiêu đang phấn đấu!`)
      fetchData()
    } catch {
      toast.error('Không thể hoàn tác mục tiêu')
    }
  }

  // Move up/down (adjust priority)
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = activeWishes.findIndex((w) => w.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= activeWishes.length) return

    const current = activeWishes[idx]
    const swap = activeWishes[swapIdx]

    const newCurrentPriority = swap.priority
    const newSwapPriority = current.priority

    // Optimistic update
    setWishes((prev) =>
      prev.map((w) =>
        w.id === current.id
          ? { ...w, priority: newCurrentPriority }
          : w.id === swap.id
          ? { ...w, priority: newSwapPriority }
          : w,
      ),
    )

    try {
      await Promise.all([
        fetch(`/api/wishes/${current.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: newCurrentPriority }),
        }),
        fetch(`/api/wishes/${swap.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: newSwapPriority }),
        }),
      ])
    } catch {
      toast.error('Lỗi sắp xếp, đang tải lại...')
      fetchData()
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/wishes/${deleteItem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Đã xóa "${deleteItem.name}"`)
      setWishes((prev) => prev.filter((w) => w.id !== deleteItem.id))
    } catch {
      toast.error('Lỗi xóa mục tiêu')
    } finally {
      setDeleteItem(null)
    }
  }

  // Open edit
  const handleEdit = (item: WishItem) => {
    setEditItem(item)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditItem(null)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">Mục Tiêu & Ước Mơ</span>
          </div>
          <button
            onClick={() => {
              setEditItem(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            <Plus size={14} />
            Thêm Mục Tiêu
          </button>
        </div>
      </div>

      {/* Sub-tabs switcher */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 p-1 bg-[#161616] border border-[#2a2a2a] rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'active'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target size={14} />
            <span>Đang Phấn Đấu ({activeWishes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('trophy')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'trophy'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'text-gray-400 hover:text-amber-300'
            }`}
          >
            <Trophy size={14} className={activeTab === 'trophy' ? 'text-white' : 'text-amber-400'} />
            <span>Thành Tựu ({trophyWishes.length})</span>
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
              <span className="text-gray-400">Ví tiền mặt</span>
              <div className="text-white font-bold mt-0.5">{formatVND(cashBalance)}</div>
            </div>
            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
              <span className="text-gray-400">Lương chờ (×0.85)</span>
              <div className="text-amber-400 font-bold mt-0.5">{formatVND(pendingTotal * 0.85)}</div>
            </div>
            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
              <span className="text-gray-400">Thu nhập TB/ngày</span>
              <div className="text-violet-300 font-bold mt-0.5">
                {avgDaily > 0 ? formatVND(avgDaily) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards container */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <WishCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === 'active' ? (
          /* Active Wishes Tab */
          activeWishes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-gray-600"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <ShoppingBag size={28} className="opacity-40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Chưa có mục tiêu nào đang phấn đấu</p>
                <p className="text-xs text-gray-600 mt-1">Thêm mục tiêu mới hoặc xem lại thành tựu đã mua!</p>
              </div>
              <button
                onClick={() => {
                  setEditItem(null)
                  setModalOpen(true)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-600/30 transition-colors"
              >
                <Sparkles size={14} />
                Thêm mục tiêu đầu tiên
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
            >
              <AnimatePresence>
                {activeWishes.map((item, idx) => {
                  const meta = parseWishMeta(item.notes)
                  const progress = computeProgress(
                    cashBalance,
                    pendingTotal,
                    item.price_vnd,
                    avgDaily,
                    meta.allocated_amount || 0,
                  )
                  return (
                    <WishCard
                      key={item.id}
                      item={item}
                      progress={progress}
                      isFirst={idx === 0}
                      isLast={idx === activeWishes.length - 1}
                      onDelete={() => setDeleteItem(item)}
                      onEdit={handleEdit}
                      onMoveUp={(id) => handleMove(id, 'up')}
                      onMoveDown={(id) => handleMove(id, 'down')}
                      onShiftCalc={setShiftItem}
                      onBuyNow={setBuyNowItem}
                      onPiggyBank={setPiggyBankItem}
                    />
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          /* Trophy Room / Achievement Wall Tab */
          trophyWishes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-gray-600"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-amber-500/20 flex items-center justify-center">
                <Trophy size={28} className="text-amber-500/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-400">Bức tường thành tựu đang trống</p>
                <p className="text-xs text-gray-600 mt-1">
                  Khi bạn hoàn thành và ấn "Rước về ngay", các chiến tích sẽ được trưng bày tại đây! 🏆
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-950/30 to-[#181611] border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-amber-300 text-sm">🏆 Bức Tường Thành Tựu</h3>
                  <p className="text-xs text-amber-200/60 mt-0.5">
                    Tổng cộng {trophyWishes.length} món đồ bạn đã đổ mồ hôi cày cuốc để sở hữu!
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {formatVND(trophyWishes.reduce((sum, w) => sum + w.price_vnd, 0))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {trophyWishes.map((item) => (
                    <TrophyCard
                      key={item.id}
                      item={item}
                      onRevert={handleRevertTrophy}
                      onDelete={() => setDeleteItem(item)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <WishModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSaved={fetchData}
        editItem={editItem}
      />

      <ShiftCalcModal item={shiftItem} onClose={() => setShiftItem(null)} />

      <BuyNowModal
        item={buyNowItem}
        cashBalance={cashBalance}
        avgHourlyRate={avgHourlyRate}
        onClose={() => setBuyNowItem(null)}
        onSuccess={fetchData}
      />

      <PiggyBankModal
        item={piggyBankItem}
        cashBalance={cashBalance}
        onClose={() => setPiggyBankItem(null)}
        onSuccess={fetchData}
      />

      <DeleteConfirm
        itemName={deleteItem?.name ?? null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  )
}
