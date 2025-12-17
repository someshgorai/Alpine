import React from "react";
import { FileCheck, ChevronRight, Calendar } from "lucide-react";
import type { RFP } from "../../types.ts";
import { RFPStatus } from "../../types.ts";
import JsonReportView from "../components/reports/JsonReportView";

interface ReportsProps {
  rfps: RFP[];
  selectedRfp: RFP | null;
  onSelectRfp: (rfp: RFP | null) => void;
}

const Reports: React.FC<ReportsProps> = ({
  rfps,
  selectedRfp,
  onSelectRfp,
}) => {
  const completed = rfps.filter((r) => r.status === RFPStatus.COMPLETED);
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (selectedRfp && selectedRfp.status === RFPStatus.COMPLETED) {
    if (selectedRfp.agentResponse) {
      return (
        <JsonReportView rfp={selectedRfp} onBack={() => onSelectRfp(null)} />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-xl font-bold text-slate-700">
          Report Data Not Available
        </h2>
        <p className="text-slate-500 mt-2">
          The structured report for this item could not be displayed.
        </p>
        <button
          onClick={() => onSelectRfp(null)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Final Reports
          </h2>
          <p className="text-slate-500 mt-1">
            Generated technical proposals and compliance matrices.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completed.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <FileCheck size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">
              No completed reports found.
            </p>
            <p className="text-sm text-slate-400">
              Process an RFP from the Inbox to generate reports.
            </p>
          </div>
        )}
        {completed.map((rfp) => (
          <div
            key={rfp.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
            onClick={() => onSelectRfp(rfp)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileCheck size={24} />
              </div>
              <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded text-xs">
                <Calendar size={12} /> {formatDate(rfp.dueDate)}
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
              {rfp.clientName}
            </h3>
            <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">
              {rfp.title}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Ready for Review
              </span>
              <div className="flex items-center text-sm text-indigo-600 font-bold gap-1 group-hover:gap-2 transition-all">
                View Proposal <ChevronRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
