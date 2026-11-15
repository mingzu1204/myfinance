'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { JobPreset, QuickShift } from '@/lib/types'
import { parsePresetMeta, serializePresetMeta } from '@/lib/metadata'
import {
  ICON_CATEGORIES,
  BrandIcon,
  getIconComponent,
} from '@/lib/iconRegistry'

const COLOR_OPTIONS = [
  { label: 'Tím', value: '#7c3aed', bg: 'bg-violet-600', ring: 'ring-violet-400' },
  { label: 'Xanh dương', value: '#2563eb', bg: 'bg-blue-600', ring: 'ring-blue-400' },
  { label: 'Xanh lá', value: '#16a34a', bg: 'bg-green-600', ring: 'ring-green-400' },
  { label: 'Đỏ', value: '#dc2626', bg: 'bg-red-600', ring: 'ring-red-400' },
  { label: 'Cam', value: '#ea580c', bg: 'bg-orange-600', ring: 'ring-orange-400' },
  { label: 'Hồng', value: '#db2777', bg: 'bg-pink-600', ring: 'ring-pink-400' },
]

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

interface PresetFormState {
  name: string
  hourly_rate: string
  night_allowance_pct: number
  color: string
  icon: string
  payday: number
  quick_shifts: QuickShift[]
  description: string
}

const DEFAULT_FORM: PresetFormState = {
  name: '',
  hourly_rate: '',
  night_allowance_pct: 30,
  color: '#7c3aed',
  icon: 'UtensilsCrossed',
  payday: 10,
  quick_shifts: [],
  description: '',
}

export default function PresetSettings() {
  const [presets, setPresets] = useState<JobPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [activeIconCategory, setActiveIconCategory] = useState<string>(ICON_CATEGORIES[0].id)
  const [editingPreset, setEditingPreset] = useState<JobPreset | null>(null)
  const [form, setForm] = useState<PresetFormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Quick shift input state
  const [shiftName, setShiftName] = useState('')
  const [shiftStart, setShiftStart] = useState('08:00')
  const [shiftEnd, setShiftEnd] = useState('16:00')

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/presets')
      if (!res.ok) throw new Error('Lỗi tải preset')
      const data = await res.json()
      const list: JobPreset[] = Array.isArray(data) ? data : (data?.data ?? [])
      setPresets(list)
    } catch {
      toast.error('Không thể tải danh sách preset')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [])

  const openAddModal = () => {
    setEditingPreset(null)
    setForm(DEFAULT_FORM)
    setShiftName('')
    setShowModal(true)
  }

  const openEditModal = (preset: JobPreset) => {
    setEditingPreset(preset)
    const meta = parsePresetMeta(preset.description)
    setForm({
      name: preset.name,
      hourly_rate: String(preset.hourly_rate),
      night_allowance_pct: preset.night_allowance_pct,
      color: preset.color || '#7c3aed',
      icon: meta.icon || 'Briefcase',
      payday: meta.payday ?? 10,
      quick_shifts: meta.quick_shifts || [],
      description: meta.desc || '',
    })
    setShiftName('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setShowIconPicker(false)
    setEditingPreset(null)
    setForm(DEFAULT_FORM)
  }

  const handleAddQuickShift = (name?: string, start?: string, end?: string) => {
    const sName = name || shiftName.trim()
    const sStart = start || shiftStart
    const sEnd = end || shiftEnd

    if (!sName) {
      toast.error('Vui lòng nhập tên ca (VD: Ca Sáng)')
      return
    }

    const newShift: QuickShift = {
      id: Date.now().toString(),
      name: sName,
      start_time: sStart,
      end_time: sEnd,
    }

    setForm((f) => ({
      ...f,
      quick_shifts: [...f.quick_shifts, newShift],
    }))

    setShiftName('')
  }

  const handleRemoveQuickShift = (shiftId: string) => {
    setForm((f) => ({
      ...f,
      quick_shifts: f.quick_shifts.filter((s) => s.id !== shiftId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nhập tên công việc')
    const rate = Number(form.hourly_rate.replace(/\D/g, ''))
    if (!rate || rate <= 0) return toast.error('Nhập lương hợp lệ')

    setSubmitting(true)
    try {
      const serializedDescription = serializePresetMeta({
        desc: form.description.trim(),
        icon: form.icon,
        payday: form.payday,
        quick_shifts: form.quick_shifts,
      })

      const payload = {
        name: form.name.trim(),
        hourly_rate: rate,
        night_allowance_pct: form.night_allowance_pct,
        color: form.color,
        description: serializedDescription,
      }

      if (editingPreset) {
        const res = await fetch(`/api/presets/${editingPreset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        toast.success('Cập nhật preset thành công')
      } else {
        const res = await fetch('/api/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        toast.success('Thêm preset thành công')
      }

      closeModal()
      fetchPresets()
    } catch {
      toast.error('Có lỗi xảy ra, thử lại sau')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (preset: JobPreset) => {
    if (!confirm(`Xóa preset "${preset.name}"? Các ca làm đã lưu sẽ bị ảnh hưởng.`)) return
    setDeletingId(preset.id)
    try {
      const res = await fetch(`/api/presets/${preset.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Đã xóa preset')
      setPresets((prev) => prev.filter((p) => p.id !== preset.id))
    } catch {
      toast.error('Không thể xóa preset')
    } finally {
      setDeletingId(null)
    }
  }

  const SelectedIconComponent = getIconComponent(form.icon)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Job Presets</h3>
          <p className="text-sm text-gray-500">Cấu hình các thương hiệu & ca làm của bạn</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-900/30"
        >
          <Plus className="w-4 h-4" />
          Thêm Preset
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#1a1a1a] rounded-2xl animate-pulse border border-[#2a2a2a]" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && presets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-gray-400 font-medium">Chưa có preset nào</p>
            <p className="text-gray-600 text-sm mt-1">Thêm preset để bắt đầu chấm công</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Thêm Preset Đầu Tiên
          </button>
        </div>
      )}

      {/* Preset cards */}
      {!loading && presets.length > 0 && (
        <div className="grid gap-3">
          {presets.map((preset) => {
            const meta = parsePresetMeta(preset.description)
            return (
              <motion.div
                key={preset.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col gap-3"
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: preset.color || '#7c3aed' }}
                />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center border"
                      style={{
                        backgroundColor: (preset.color || '#7c3aed') + '22',
                        borderColor: (preset.color || '#7c3aed') + '55',
                      }}
                    >
                      <BrandIcon
                        iconId={meta.icon}
                        className="w-5 h-5"
                        style={{ color: preset.color || '#7c3aed' } as any}
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-base">{preset.name}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-0.5">
                        <span className="text-sm font-medium text-violet-400">
                          {formatVND(preset.hourly_rate)}/giờ
                        </span>
                        {preset.night_allowance_pct > 0 && (
                          <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            +{preset.night_allowance_pct}% đêm
                          </span>
                        )}
                        <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Lương ngày {meta.payday ?? 10}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(preset)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(preset)}
                      disabled={deletingId === preset.id}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {deletingId === preset.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Shifts tags */}
                {meta.quick_shifts && meta.quick_shifts.length > 0 && (
                  <div className="pl-2 pt-1 border-t border-[#252525] flex items-center flex-wrap gap-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Ca mẫu:
                    </span>
                    {meta.quick_shifts.map((qs) => (
                      <span
                        key={qs.id}
                        className="text-xs bg-[#222] border border-[#333] text-gray-300 px-2 py-0.5 rounded-lg font-mono"
                      >
                        {qs.name}: {qs.start_time} - {qs.end_time}
                      </span>
                    ))}
                  </div>
                )}

                {meta.desc && (
                  <p className="text-xs text-gray-500 pl-2 truncate">{meta.desc}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Main Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: form.color + '22',
                      borderColor: form.color + '55',
                    }}
                  >
                    <BrandIcon iconId={form.icon} className="w-5 h-5" style={{ color: form.color } as any} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">
                      {editingPreset ? 'Chỉnh sửa Preset' : 'Thêm Preset Mới'}
                    </h4>
                    <p className="text-xs text-gray-400">Cấu hình icon, ngày nhận lương & ca mẫu 1 chạm</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable form body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 pb-8 sm:pb-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tên công việc / Thương hiệu <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: McDonald, Phúc Long, CGV..."
                    className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Icon Selector Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Biểu tượng ngành nghề <span className="text-violet-400">(SVG Icon)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111] border border-[#2a2a2a] hover:border-violet-500/50 rounded-xl text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center border"
                        style={{
                          backgroundColor: form.color + '22',
                          borderColor: form.color + '55',
                        }}
                      >
                        <SelectedIconComponent className="w-5 h-5" style={{ color: form.color }} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{form.icon}</p>
                        <p className="text-xs text-gray-500">Bấm để đổi biểu tượng</p>
                      </div>
                    </div>
                    <span className="text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 px-2.5 py-1 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      Chọn Icon
                    </span>
                  </button>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Màu nhận diện thương hiệu</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                        className={`w-9 h-9 rounded-full transition-all duration-200 ${c.bg} ${
                          form.color === c.value
                            ? `ring-2 ring-offset-2 ring-offset-[#1a1a1a] ${c.ring} scale-110`
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        title={c.label}
                      >
                        {form.color === c.value && (
                          <Check className="w-4 h-4 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hourly rate & Payday */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Lương theo giờ (VND) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.hourly_rate}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        setForm((f) => ({ ...f, hourly_rate: raw ? Number(raw).toLocaleString('vi-VN') : '' }))
                      }}
                      placeholder="VD: 50.000"
                      className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Ngày nhận lương <span className="text-xs text-gray-500">(hàng tháng)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={form.payday}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            payday: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                          }))
                        }
                        className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        ngày {form.payday}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Night allowance */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-300">
                      Phụ cấp ca đêm (22:00 - 06:00)
                    </label>
                    <span className="text-sm text-amber-400 font-semibold">+{form.night_allowance_pct}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={form.night_allowance_pct}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, night_allowance_pct: Number(e.target.value) }))
                      }
                      className="flex-1 h-2 accent-violet-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.night_allowance_pct}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          night_allowance_pct: Math.min(100, Math.max(0, Number(e.target.value))),
                        }))
                      }
                      className="w-16 px-2 py-2 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-center text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Quick Shifts (Ca Mẫu 1 Chạm) */}
                <div className="p-3.5 bg-[#141414] border border-[#252525] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-white">Ca Mẫu 1 Chạm (Quick Shifts)</span>
                    </div>
                    <span className="text-xs text-gray-500">Giúp chấm công nhanh</span>
                  </div>

                  {/* Existing quick shifts */}
                  {form.quick_shifts.length > 0 ? (
                    <div className="space-y-1.5">
                      {form.quick_shifts.map((qs) => (
                        <div
                          key={qs.id}
                          className="flex items-center justify-between bg-[#1f1f1f] border border-[#333] px-3 py-2 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{qs.name}</span>
                            <span className="text-gray-400 font-mono">
                              {qs.start_time} - {qs.end_time}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickShift(qs.id)}
                            className="p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Chưa có ca mẫu nào. Thêm bên dưới:</p>
                  )}

                  {/* Quick templates presets */}
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    <span className="text-xs text-gray-500">Mẫu sẵn:</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuickShift('Ca Sáng', '08:00', '16:00')}
                      className="text-xs bg-[#222] hover:bg-violet-600/30 text-gray-300 hover:text-violet-300 border border-[#333] px-2 py-1 rounded-lg transition-colors"
                    >
                      + Sáng (08:00 - 16:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickShift('Ca Chiều', '14:00', '22:00')}
                      className="text-xs bg-[#222] hover:bg-violet-600/30 text-gray-300 hover:text-violet-300 border border-[#333] px-2 py-1 rounded-lg transition-colors"
                    >
                      + Chiều (14:00 - 22:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickShift('Ca Đêm', '22:00', '06:00')}
                      className="text-xs bg-[#222] hover:bg-violet-600/30 text-gray-300 hover:text-violet-300 border border-[#333] px-2 py-1 rounded-lg transition-colors"
                    >
                      + Đêm (22:00 - 06:00)
                    </button>
                  </div>

                  {/* Add custom quick shift */}
                  <div className="grid grid-cols-12 gap-2 pt-1 border-t border-[#222]">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Tên ca (VD: Ca gãy)"
                        value={shiftName}
                        onChange={(e) => setShiftName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="time"
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleAddQuickShift()}
                        className="w-full h-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Ghi chú thêm <span className="text-gray-500">(tùy chọn)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Địa chỉ, quản lý ca, ghi chú tính lương..."
                    className="w-full px-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingPreset ? (
                    'Cập nhật Preset'
                  ) : (
                    'Thêm Preset'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categorized Icon Picker Modal */}
      <AnimatePresence>
        {showIconPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setShowIconPicker(false)}
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
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h4 className="text-white font-semibold text-base">Chọn Biểu Tượng Ngành Nghề</h4>
                </div>
                <button
                  onClick={() => setShowIconPicker(false)}
                  className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-[#252525] shrink-0 no-scrollbar">
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveIconCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeIconCategory === cat.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-[#111] text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Icon Grid */}
              <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ICON_CATEGORIES.find((c) => c.id === activeIconCategory)?.icons.map((item) => {
                  const IconComp = item.icon
                  const isSelected = form.icon === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, icon: item.id }))
                        setShowIconPicker(false)
                        toast.success(`Đã chọn icon: ${item.label}`)
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500 text-white shadow-md shadow-violet-900/20'
                          : 'bg-[#111] border-[#2a2a2a] text-gray-300 hover:border-[#444] hover:bg-[#181818]'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected ? form.color + '33' : '#222',
                          color: isSelected ? form.color : '#aaa',
                        }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-white">{item.label}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.id}</p>
                      </div>
                    </button>
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
