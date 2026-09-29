import React from 'react';
import { TabType } from '../types';

interface TopAppBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onSyncPlatforms: () => void;
  isSyncing: boolean;
  onOpenMobileMenu: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  setActiveTab,
  onSyncPlatforms,
  isSyncing,
  onOpenMobileMenu,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'jobs':
        return 'Create Job';
      case 'process':
        return 'AI Processing';
      case 'versions':
        return 'Version Control';
      case 'unstructured':
        return 'Unstructured Data View';
      case 'architecture':
        return 'System Architecture';
      default:
        return 'HR AI Assist';
    }
  };

  return (
    <header
      id="top-app-bar"
      className="bg-[#f7f9fb] border-b border-[#c1c7cf] fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 md:px-8 md:pl-[304px] transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          id="mobile-menu-button"
          onClick={onOpenMobileMenu}
          className="md:hidden text-[#41474e] hover:bg-[#e0e3e5] p-2 rounded-full active:scale-95 transition-all cursor-pointer"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Back Button if not on default tab */}
        {activeTab !== 'versions' && (
          <button
            id="topbar-back-button"
            onClick={() => setActiveTab('versions')}
            className="hidden sm:flex text-[#41474e] hover:bg-[#e0e3e5] p-2 rounded-full active:scale-95 transition-all cursor-pointer items-center justify-center"
            title="Back to Versions"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[#003b5a] font-bold text-[20px] md:text-[22px] tracking-tight">
            HR AI Assist
          </span>
          <span className="hidden sm:inline-block text-[#72787f] font-normal text-[16px]">
            / {getTabTitle()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sync Platforms Action */}
        <button
          id="topbar-sync-button"
          onClick={onSyncPlatforms}
          disabled={isSyncing}
          className="flex items-center gap-1.5 bg-[#fed023] hover:bg-[#eec209] text-[#6f5900] text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          title="Sync all active jobs to connected job platforms"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              isSyncing ? 'animate-spin' : ''
            }`}
          >
            sync
          </span>
          <span className="hidden sm:inline">
            {isSyncing ? 'Syncing...' : 'Sync Platforms'}
          </span>
        </button>

        {/* User profile button */}
        <button
          id="topbar-profile-button"
          onClick={() => setActiveTab('architecture')}
          className="text-[#003b5a] hover:bg-[#e0e3e5] p-2 rounded-full active:scale-95 transition-all cursor-pointer"
          title="System Architecture & Profile"
        >
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
        </button>
      </div>
    </header>
  );
};
