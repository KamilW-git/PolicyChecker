'use client'

import { ReactNode, useState } from 'react'

interface RequestDetailTabsProps {
  overview: ReactNode
  decision: ReactNode
  attachments: ReactNode
  comments: ReactNode
  history?: ReactNode
}

type TabType = 'overview' | 'decision' | 'attachments' | 'comments' | 'history'

export default function RequestDetailTabs({
  overview,
  decision,
  attachments,
  comments,
  history
}: RequestDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Przegląd' },
    { id: 'decision', label: 'Decyzja' },
    { id: 'attachments', label: 'Załączniki' },
    { id: 'comments', label: 'Komentarze' },
  ]
  
  if (history) {
    tabs.push({ id: 'history', label: 'Historia' })
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <div className="inline-flex bg-slate-200/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'overview' && overview}
        {activeTab === 'decision' && decision}
        {activeTab === 'attachments' && attachments}
        {activeTab === 'comments' && comments}
        {activeTab === 'history' && history}
      </div>
    </div>
  )
}
