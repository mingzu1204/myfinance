'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Check, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

interface Preset {
  id: string
  name: string
  hourly_rate: number
  night_allowance_pct: number
  color: string
  description?: string
  created_at: string
}

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
  description: string
}

const DEFAULT_FORM: PresetFormState = {
  name: '',
  hourly_rate: '',
  night_allowance_pct: 30,
  color: '#7c3aed',
  description: '',
}

export default function PresetSettings() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)
  const [form, setForm] = useState<PresetFormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/presets')
      if (!res.ok) throw new Error('Lỗi tải preset')
      const data = await res.json()
      setPresets(data)
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
    setShowModal(true)
  }

  const openEditModal = (preset: Preset) => {
    setEditingPreset(preset)
    setForm({
      name: preset.name,
      hourly_rate: String(preset.hourly_rate),
      night_allowance_pct: preset.night_allowance_pct,
      color: preset.color,
      description: preset.description ?? '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPreset(null)
    setForm(DEFAULT_FORM)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nhập tên công việc')
    const rate = Number(form.hourly_rate.replace(/\D/g, ''))
    if (!rate || rate <= 0) return toast.error('Nhập lương hợp lệ')

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        hourly_rate: rate,
        night_allowance_pct: form.night_allowance_pct,
        color: form.color,
        description: form.description.trim() || null,
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

  const handleDelete = async (preset: Preset) => {
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

  const colorMeta = (hex: string) => COLOR_OPTIONS.find((c) => c.value === hex)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Job Presets</h3>
          <p className="text-sm text-gray-500">Cấu hình các loại công việc của bạn</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Preset
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] rounded-2xl animate-pulse border border-[#2a2a2a]" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && presets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-gray-600" />
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
          {presets.map((preset) => (
            <motion.div
              key={preset.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex items-center gap-4"
            >
              {/* Color stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: preset.color }}
              />

              {/* Color dot */}
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ml-2"
                style={{ backgroundColor: preset.color + '20' }}
              >
                <Briefcase className="w-5 h-5" style={{ color: preset.color }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{preset.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm text-gray-400">{formatVND(preset.hourly_rate)}/giờ</span>
                  {preset.night_allowance_pct > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      +{preset.night_allowance_pct}% đêm
                    </span>
                  )}
                </div>
                {preset.description && (
                  <p className="text-xs text-gray-600 mt-1 truncate">{preset.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(preset)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(preset)}
                  disabled={deletingId === preset.id}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === preset.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
                <h4 className="text-white font-semibold text-lg">
                  {editingPreset ? 'Chỉnh sửa Preset' : 'Thêm Preset Mới'}
                </h4>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Tên công việc <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Ca ngày tại công ty ABC"
                    className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Hourly rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
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

                {/* Night allowance */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Phụ cấp ca đêm:{' '}
                    <span className="text-amber-400 font-semibold">{form.night_allowance_pct}%</span>
                  </label>
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

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Màu sắc</label>
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Mô tả <span className="text-gray-600">(tùy chọn)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Ghi chú thêm về công việc này..."
                    className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
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
    </div>
  )
}
