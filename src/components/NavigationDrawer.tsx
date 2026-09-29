import React from "react";
import { TabType } from "../types";

interface NavigationDrawerProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeJobsCount: number;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
  badge?: number;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  activeTab,
  setActiveTab,
  activeJobsCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: "jobs",
      label: "Create Job",
      icon: "add_box",
    },
    {
      id: "applicants",
      label: "Applicants",
      icon: "group",
    },
    {
      id: "process",
      label: "AI Processing",
      icon: "psychology",
    },
    {
      id: "versions",
      label: "Job Versions",
      icon: "layers",
      badge: activeJobsCount,
    },
    {
      id: "unstructured",
      label: "Unstructured Data",
      icon: "data_object",
    },
    {
      id: "architecture",
      label: "System Blueprint",
      icon: "account_tree",
    },
    {
      id: "drive-sync",
      label: "Google Drive Sync",
      icon: "cloud_sync",
    },
  ];

  const handleNavigation = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 w-[280px] h-screen bg-[#f2f4f6] border-r border-[#c1c7cf] flex flex-col">
      {/* Recruitment Profile */}
      <div className="h-[116px] px-7 flex items-center border-b border-[#c1c7cf]">
        <div className="w-[56px] h-[56px] rounded-full border-2 border-[#003b5a] bg-white flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-[38px] text-[#003b5a]">
            person
          </span>
        </div>

        <div className="ml-4">
          <div className="text-[20px] font-semibold text-[#003b5a] leading-tight">
            Recruitment Lead
          </div>

          <div className="text-[14px] font-medium text-[#41474e] tracking-wide">
            HR DEPARTMENT
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 py-7 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  w-full
                  h-[48px]
                  px-4
                  flex
                  items-center
                  gap-3
                  rounded-full
                  text-left
                  transition-all
                  duration-150
                  cursor-pointer
                  ${
                    isActive
                      ? "bg-[#fed023] text-[#6f5900]"
                      : "text-[#41474e] hover:bg-[#e4e7e9]"
                  }
                `}
              >
                <span className="material-symbols-outlined text-[23px]">
                  {item.icon}
                </span>

                <span className="flex-1 text-[15px] font-semibold">
                  {item.label}
                </span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="
                      min-w-[30px]
                      h-[30px]
                      px-2
                      rounded-full
                      bg-[#e0e3e5]
                      text-[#41474e]
                      text-[13px]
                      font-semibold
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="h-[58px] px-4 border-t border-[#c1c7cf] flex items-center justify-between">
        <span className="text-[12px] text-[#72787f]">
          HR AI Assist v2.4.1
        </span>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>

          <span className="text-[12px] font-medium text-green-700">
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};

export default NavigationDrawer;