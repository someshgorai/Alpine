import React from "react";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Database,
  Shield,
  DollarSign,
  ClipboardCheck,
} from "lucide-react";
import type { ViewState } from "../../types";

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  inboxCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  inboxCount,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "inbox", label: "RFP Inbox", icon: Inbox, count: inboxCount },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "database", label: "OEM Database", icon: Database },
    { id: "prices", label: "Product Pricing", icon: DollarSign },
    { id: "services", label: "Service Costs", icon: ClipboardCheck },
  ];

  return (
    <div className="w-72 bg-[#0f172a] text-slate-300 flex flex-col h-full border-r border-slate-800 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Shield size={20} fill="currentColor" className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Alpine
          </h1>
        </div>
        <p className="text-xs font-medium text-slate-500 pl-1">
          Intelligent RFP Response System
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider px-4 mb-4">
          Main Menu
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-400"
                  : "hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
              )}
              <div className="flex items-center gap-3.5">
                <Icon
                  size={20}
                  className={`transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}
                />
                <span
                  className={`font-medium text-sm ${isActive ? "text-white" : ""}`}
                >
                  {item.label}
                </span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? "bg-indigo-500 text-white border-indigo-400"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 m-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              John Doe
            </p>
            <p className="text-xs text-slate-400 truncate">
              Senior Sales Engineer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
