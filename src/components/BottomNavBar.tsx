import React from 'react';
import { TabType } from '../types';

interface BottomNavBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'jobs', label: 'Jobs', icon: 'work' },
    { id: 'process', label: 'Process', icon: 'auto_awesome' },
    { id: 'versions', label: 'Versions', icon: 'layers' },
    { id: 'unstructured', label: 'Status', icon: 'toggle_on' },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 pb-safe bg-[#f7f9fb] border-t border-[#c1c7cf] z-50 shadow-md"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`mobile-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
              isActive
                ? 'bg-[#fed023] text-[#6f5900] rounded-2xl px-5 py-1 scale-100 shadow-xs font-bold'
                : 'text-[#41474e] scale-95 p-1'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] mb-0.5 ${
                isActive ? 'fill' : ''
              }`}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
