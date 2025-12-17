import React from "react";
import {
  Briefcase,
  CheckCircle2,
  Cpu,
  Clock,
  Activity,
  Inbox,
  TrendingUp,
  Loader2,
} from "lucide-react";
import type { RFP } from "../../types.ts";
import { RFPStatus } from "../../types.ts";

interface DashboardProps {
  rfps: RFP[];
  isScraping: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ rfps, isScraping }) => {
  const totalWins = 142;
  const winRate = 60;
  const processing = rfps.filter(
    (r) => r.status === RFPStatus.PROCESSING,
  ).length;
  const inbox = rfps.filter((r) => r.status === RFPStatus.INBOX).length;

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-transform hover:scale-[1.01] hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="opacity-90" />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} className="mr-1" /> {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
          {value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Executive Dashboard
          </h2>
          <p className="text-slate-500 mt-2">
            Welcome back. Here's what's happening today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Win Rate (YTD)"
          value={`${winRate}%`}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600"
          trend="+5.2%"
        />
        <StatCard
          title="Active Analysis"
          value={processing}
          icon={Activity}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Inbox Pending"
          value={inbox}
          icon={Inbox}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Wins"
          value={totalWins}
          icon={Briefcase}
          color="bg-violet-100 text-violet-600"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">
              Recent Activity
            </h3>
            <button className="text-sm text-indigo-600 font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((_, i) => (
              <div
                key={i}
                className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                  <Cpu size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Main Agent processed RFP #{1204 - i}
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Generated report for "National Institute of Technology"
                  </p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Clock size={12} /> {i * 45 + 15} mins ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Cpu size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">System Status</h3>
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-indigo-200 text-sm">Main Agent</span>
                <span className="flex items-center gap-2 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>{" "}
                  ONLINE
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-200 text-sm">Web Scraper</span>
                <span
                  className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded ${isScraping ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-300"}`}
                >
                  {isScraping && <Loader2 size={12} className="animate-spin" />}{" "}
                  {isScraping ? "ACTIVE" : "IDLE"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
            <p className="text-xs text-indigo-300">
              Last System Backup: 04:00 AM UTC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
