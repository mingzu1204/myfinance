'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Settings, History } from 'lucide-react'
import CheckinForm from './CheckinForm'
import PresetSettings from './PresetSettings'
import WorkHistory from './WorkHistory'

type Tab = 'checkin' | 'settings' | 'history'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'checkin', label: 'Chấm Công', icon: <Clock className="w-4 h-4" /> },
  { id: 'settings', label: 'Cài Đặt', icon: <Settings className="w-4 h-4" /> },
  { id: 'history', label: 'Lịch Sử', icon: <History className="w-4 h-4" /> },
]

export default function CheckinPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('checkin')

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex gap-1 p-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="checkin-tab-bg"
                className="absolute inset-0 bg-violet-600 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'checkin' && <CheckinForm />}
            {activeTab === 'settings' && <PresetSettings />}
            {activeTab === 'history' && <WorkHistory />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
