'use client'
import { useState } from 'react'
import { LayoutDashboard, Clock, Building2, Heart } from 'lucide-react'
import Dashboard from '@/components/dashboard/Dashboard'
import CheckinPanel from '@/components/checkin/CheckinPanel'
import BrandsPanel from '@/components/brands/BrandsPanel'
import WishesPanel from '@/components/wishes/WishesPanel'

const tabs = [
  { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
  { id: 'checkin', label: 'Chấm Công', icon: Clock },
  { id: 'brands', label: 'Thương Hiệu', icon: Building2 },
  { id: 'wishes', label: 'Mục Tiêu', icon: Heart },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] p-6 gap-2 fixed h-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-violet-400">💰 MyFinance</h1>
          <p className="text-xs text-gray-500 mt-1">Quản lý tài chính cá nhân</p>
        </div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-[#222] hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'checkin' && <CheckinPanel />}
        {activeTab === 'brands' && <BrandsPanel />}
        {activeTab === 'wishes' && <WishesPanel />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] flex z-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-all ${
              activeTab === tab.id ? 'text-violet-400' : 'text-gray-500'
            }`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
