'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Music2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatVND } from '@/lib/calculations'
import { estimateDaysToGoal } from '@/lib/calculations'
import type { WishItem } from '@/lib/types'
import confetti from 'canvas-confetti'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WishesPanelProps {
  onNavigate?: (tab: string) => void
}

interface ProgressInfo {
  totalAvailable: number
  progressPct: number
  cashOnlyPct: number
  daysLeft: number
  amountLeft: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeProgress(
  cashBalance: number,
  pendingTotal: number,
  itemPrice: number,
  avgDaily: number,
): ProgressInfo {
  const totalAvailable = cashBalance + pendingTotal * 0.85
  const progressPct = Math.min(100, Math.round((totalAvailable / itemPrice) * 100))
  const cashOnlyPct = Math.min(100, Math.round((cashBalance / itemPrice) * 100))
  const daysLeft = estimateDaysToGoal(cashBalance, pendingTotal * 0.85, itemPrice, avgDaily)
  const amountLeft = Math.max(0, itemPrice - totalAvailable)
  return { totalAvailable, progressPct, cashOnlyPct, daysLeft, amountLeft }
}

function formatVNDInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
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
        <div className="flex gap-2 pt-1">
          <div className="h-8 w-24 bg-[#2a2a2a] rounded-lg" />
          <div className="h-8 w-8 bg-[#2a2a2a] rounded-lg" />
          <div className="h-8 w-8 bg-[#2a2a2a] rounded-lg" />
        </div>
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
            size={18}
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

// ─── Confetti burst ───────────────────────────────────────────────────────────

function triggerConfetti() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.6 },
    colors: ['#7c3aed', '#a855f7', '#10b981', '#f59e0b'],
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
}: WishCardProps) {
  const isAffordable = progress.progressPct >= 100
  const hasImage = !!item.image_url
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
      className={`relative rounded-2xl bg-[#1a1a1a] border overflow-hidden transition-all duration-300 ${
        isAffordable
          ? 'border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
          : 'border-[#2a2a2a]'
      }`}
    >
      {/* ── Affordable badge ── */}
      {isAffordable && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-sm">
          <span className="text-emerald-400 text-xs font-semibold">✅ Đủ tiền mua rồi!</span>
        </div>
      )}

      {/* ── Image ── */}
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

      {/* ── Body ── */}
      <div className="p-4 space-y-3">
        {/* Name + Priority */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-white text-base leading-tight">🎯 {item.name}</p>
            {item.notes && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.notes}</p>}
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
          <div className="h-2.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isAffordable
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600'
              }`}
            />
          </div>
        </div>

        {/* Amount left + days */}
        {!isAffordable ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              Còn thiếu: <span className="text-red-400 font-medium">{formatVND(progress.amountLeft)}</span>
            </p>
            {progress.daysLeft > 0 && (
              <p className="text-sm text-gray-400">
                Dự kiến: <span className="text-amber-400 font-medium">~{progress.daysLeft} ngày nữa</span> ✨
              </p>
            )}
            {progress.daysLeft === -1 && (
              <p className="text-xs text-gray-600">Chưa đủ dữ liệu để dự báo</p>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/40">
              🛒 Mua thôi!
            </button>
          </motion.div>
        )}

        {/* Secondary stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-[#2a2a2a] pt-2">
          <span>💵 Tiền mặt: <span className="text-gray-300">{progress.cashOnlyPct}%</span></span>
          <span>💰 Kể cả lương: <span className="text-violet-300">{progress.progressPct}%</span></span>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* TikTok links */}
          {item.tiktok_links?.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setTiktokOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-xs text-gray-300 hover:text-white hover:border-[#444] transition-all"
              >
                <TikTokIcon size={13} />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-xs text-gray-300 hover:text-amber-400 hover:border-amber-500/30 transition-all"
          >
            <Zap size={12} />
            <span>+% ca làm</span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Reorder */}
          <div className="flex gap-1">
            <button
              onClick={() => onMoveUp(item.id)}
              disabled={isFirst}
              className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-500 hover:text-white hover:border-[#444] disabled:opacity-30 transition-all"
            >
              <ChevronUp size={13} />
            </button>
            <button
              onClick={() => onMoveDown(item.id)}
              disabled={isLast}
              className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-500 hover:text-white hover:border-[#444] disabled:opacity-30 transition-all"
            >
              <ChevronDown size={13} />
            </button>
          </div>

          {/* Edit */}
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-500 hover:text-violet-400 hover:border-violet-500/30 transition-all"
          >
            <Edit2 size={13} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
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

  // Reset/populate when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (editItem) {
      setForm({
        name: editItem.name,
        price_vnd_display: editItem.price_vnd ? Number(editItem.price_vnd).toLocaleString('vi-VN') : '',
        image_url: editItem.image_url ?? '',
        tiktok_links: (editItem.tiktok_links ?? []).join('\n'),
        priority: editItem.priority ?? 3,
        notes: editItem.notes ?? '',
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
      const img = document.createElement('img')
      img.onload = () => setImageStatus('valid')
      img.onerror = () => setImageStatus('invalid')
      img.src = url
    }, 600)
  }, [])

  const handleField = (key: keyof WishFormData, value: string | number) => {
    if (key === 'price_vnd_display' && typeof value === 'string') {
      const formatted = formatVNDInput(value)
      setForm((prev) => ({ ...prev, price_vnd_display: formatted }))
      return
    }
    if (key === 'image_url' && typeof value === 'string') {
      setForm((prev) => ({ ...prev, image_url: value }))
      validateImageUrl(value)
      return
    }
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = 'Tên món đồ là bắt buộc'
    const price = parsePriceInput(form.price_vnd_display)
    if (!price || price <= 0) newErrors.price_vnd_display = 'Vui lòng nhập giá hợp lệ'
    if (imageStatus === 'invalid') newErrors.image_url = 'Link ảnh không hợp lệ'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        price_vnd: parsePriceInput(form.price_vnd_display),
        image_url: form.image_url.trim() || null,
        tiktok_links: form.tiktok_links
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        priority: form.priority,
        notes: form.notes.trim() || null,
      }

      const url = isEdit ? `/api/wishes/${editItem!.id}` : '/api/wishes'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Lỗi không xác định')
      }

      toast.success(isEdit ? 'Đã cập nhật mục tiêu!' : 'Đã thêm mục tiêu mới! 🎯')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi khi lưu mục tiêu')
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
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl md:rounded-2xl border border-[#2a2a2a] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#1a1a1a] flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <Target size={14} className="text-violet-400" />
                </div>
                <h2 className="text-base font-semibold text-white">
                  {isEdit ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#222] text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">
                  Tên món đồ <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                  placeholder="VD: iPhone 16 Pro Max, PS5, ..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm text-white bg-[#222] border outline-none transition-all
                    placeholder:text-gray-600
                    ${errors.name ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'}
                  `}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">
                  Giá (VNĐ) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    value={form.price_vnd_display}
                    onChange={(e) => handleField('price_vnd_display', e.target.value)}
                    placeholder="29.990.000"
                    inputMode="numeric"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm text-white bg-[#222] border outline-none transition-all
                      placeholder:text-gray-600 pr-8
                      ${errors.price_vnd_display ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-[#2a2a2a] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'}
                    `}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₫</span>
                </div>
                {errors.price_vnd_display && <p className="text-xs text-red-400">{errors.price_vnd_display}</p>}
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Link ảnh (tùy chọn)</label>
                <input
                  value={form.image_url}
                  onChange={(e) => handleField('image_url', e.target.value)}
                  placeholder="https://..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm text-white bg-[#222] border outline-none transition-all
                    placeholder:text-gray-600
                    ${errors.image_url ? 'border-red-500/60 focus:border-red-500' :
                      imageStatus === 'valid' ? 'border-emerald-500/50 focus:border-emerald-500' :
                      'border-[#2a2a2a] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'}
                  `}
                />
                {/* Image validation feedback */}
                <AnimatePresence mode="wait">
                  {imageStatus === 'loading' && (
                    <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                      Đang kiểm tra ảnh...
                    </motion.p>
                  )}
                  {imageStatus === 'invalid' && (
                    <motion.p key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> Link ảnh không hợp lệ
                    </motion.p>
                  )}
                  {imageStatus === 'valid' && (
                    <motion.p key="valid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-emerald-400 flex items-center gap-1">
                      ✓ Ảnh hợp lệ
                    </motion.p>
                  )}
                </AnimatePresence>
                {/* Image preview */}
                <AnimatePresence>
                  {imageStatus === 'valid' && form.image_url && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl overflow-hidden border border-[#2a2a2a]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image_url}
                        alt="preview"
                        className="w-full h-auto object-contain max-h-48"
                        style={{ background: '#111' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TikTok links */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <TikTokIcon size={13} /> Link TikTok (mỗi dòng 1 link, tùy chọn)
                </label>
                <textarea
                  value={form.tiktok_links}
                  onChange={(e) => handleField('tiktok_links', e.target.value)}
                  placeholder={'https://www.tiktok.com/@user/video/...\nhttps://vm.tiktok.com/...'}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-[#222] border border-[#2a2a2a] outline-none transition-all
                    placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Độ ưu tiên</label>
                <StarRating value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v }))} />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Ghi chú (tùy chọn)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleField('notes', e.target.value)}
                  placeholder="Ghi chú thêm..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-[#222] border border-[#2a2a2a] outline-none transition-all
                    placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#222] text-gray-300 text-sm font-medium hover:bg-[#2a2a2a] border border-[#333] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>{isEdit ? '✅ Cập nhật' : '🎯 Thêm mục tiêu'}</>
                  )}
                </button>
              </div>
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
      {!!item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[#1a1a1a] rounded-t-3xl md:rounded-2xl border border-[#2a2a2a] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">% tăng sau ca làm</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{item.name}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#222] text-gray-400">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Số tiền sẽ nhận (VNĐ)</label>
              <div className="relative">
                <input
                  value={amount}
                  onChange={(e) => setAmount(formatVNDInput(e.target.value))}
                  placeholder="500.000"
                  inputMode="numeric"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-white bg-[#222] border border-[#2a2a2a] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-base font-mono pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
              </div>
            </div>

            {pct !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/30 p-5 text-center space-y-1"
              >
                <div className="text-3xl font-bold text-violet-300">+{pct}%</div>
                <div className="text-sm text-gray-400">sau ca hôm nay ✨</div>
                <div className="text-xs text-gray-600 mt-1">
                  {formatVND(shiftAmount)} / {formatVND(item.price_vnd)}
                </div>
              </motion.div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#222] text-gray-400 text-sm hover:bg-[#2a2a2a] transition-colors border border-[#333]"
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      )}
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
  const [cashBalance, setCashBalance] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [avgDaily, setAvgDaily] = useState(0)
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<WishItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<WishItem | null>(null)
  const [shiftItem, setShiftItem] = useState<WishItem | null>(null)

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [wishesRes, walletRes, cyclesRes, sessionsRes] = await Promise.allSettled([
        fetch('/api/wishes'),
        fetch('/api/wallet'),
        fetch('/api/cycles?status=open'),
        fetch('/api/sessions?limit=100'),
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

      // Compute avg daily earning from last 7 days sessions
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

  // ── Sort by priority desc ──
  const sortedWishes = [...wishes].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || 0)

  // ── Move up/down (adjust priority) ──
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = sortedWishes.findIndex((w) => w.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedWishes.length) return

    const current = sortedWishes[idx]
    const swap = sortedWishes[swapIdx]

    // Swap priorities
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

  // ── Delete ──
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

  // ── Open edit ──
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
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <Target size={15} className="text-violet-400" />
            </div>
            <span className="text-base font-semibold text-white">Mục Tiêu</span>
          </div>
          <button
            onClick={() => { setEditItem(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors shadow-lg shadow-violet-900/30"
          >
            <Plus size={14} />
            Thêm Mục Tiêu
          </button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      {!loading && wishes.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
              <span className="text-gray-500">Tiền mặt</span>
              <div className="text-white font-semibold mt-0.5">{formatVND(cashBalance)}</div>
            </div>
            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
              <span className="text-gray-500">Lương chờ (×0.85)</span>
              <div className="text-amber-400 font-semibold mt-0.5">{formatVND(pendingTotal * 0.85)}</div>
            </div>
            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
              <span className="text-gray-500">Thu nhập TB/ngày</span>
              <div className="text-violet-300 font-semibold mt-0.5">
                {avgDaily > 0 ? formatVND(avgDaily) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cards grid ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => <WishCardSkeleton key={i} />)}
          </div>
        ) : sortedWishes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-gray-600"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
              <ShoppingBag size={28} className="opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Chưa có mục tiêu nào</p>
              <p className="text-xs text-gray-700 mt-1">Thêm mục tiêu để theo dõi tiến trình tiết kiệm</p>
            </div>
            <button
              onClick={() => { setEditItem(null); setModalOpen(true) }}
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
              {sortedWishes.map((item, idx) => {
                const progress = computeProgress(cashBalance, pendingTotal, item.price_vnd, avgDaily)
                return (
                  <WishCard
                    key={item.id}
                    item={item}
                    progress={progress}
                    isFirst={idx === 0}
                    isLast={idx === sortedWishes.length - 1}
                    onDelete={() => setDeleteItem(item)}
                    onEdit={handleEdit}
                    onMoveUp={(id) => handleMove(id, 'up')}
                    onMoveDown={(id) => handleMove(id, 'down')}
                    onShiftCalc={setShiftItem}
                  />
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Modals ── */}
      <WishModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSaved={fetchData}
        editItem={editItem}
      />

      <ShiftCalcModal item={shiftItem} onClose={() => setShiftItem(null)} />

      <DeleteConfirm
        itemName={deleteItem?.name ?? null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  )
}
