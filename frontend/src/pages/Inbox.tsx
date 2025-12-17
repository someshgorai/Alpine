import React from "react";
import {
  Inbox as InboxIcon,
  RefreshCw,
  Loader2,
  File,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  Calendar,
  ExternalLink,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import type { RFP } from "../../types.ts";
import { RFPStatus } from "../../types.ts";

interface InboxProps {
  rfps: RFP[];
  selectedRfp: RFP | null;
  onSelectRfp: (rfp: RFP) => void;
  onRefresh: () => void;
  onInvokeAgent: (rfpId: string) => void;
  isScraping: boolean;
}

const Inbox: React.FC<InboxProps> = ({
  rfps,
  selectedRfp,
  onSelectRfp,
  onRefresh,
  onInvokeAgent,
  isScraping,
}) => {
  const inboxItems = rfps.filter((r) => r.status === RFPStatus.INBOX);

  const calculateDaysRemaining = (dueDate: string) =>
    Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="flex h-full gap-6 animate-fade-in">
      <div className="w-96 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <InboxIcon size={18} className="text-slate-400" /> Inbox{" "}
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
              {inboxItems.length}
            </span>
          </h3>
          <button
            onClick={onRefresh}
            disabled={isScraping}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait"
            title="Sync Sources"
          >
            <RefreshCw
              size={16}
              className={isScraping ? "animate-spin text-indigo-600" : ""}
            />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxItems.length === 0 && !isScraping && (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4 text-slate-400">
              <InboxIcon size={24} className="mb-2" />
              <p className="text-sm font-medium text-slate-500">
                Inbox is empty
              </p>
              <p className="text-xs mt-1">
                Click the refresh button to search for new RFPs.
              </p>
            </div>
          )}
          {isScraping && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Loader2
                size={24}
                className="animate-spin mb-3 text-indigo-500"
              />
              <p className="text-sm font-medium">Searching for new RFPs...</p>
            </div>
          )}
          {inboxItems.map((rfp) => {
            const isScraped = !!rfp.pdfPath;
            const isAnalyzed = !!rfp.summary;
            return (
              <div
                key={rfp.id}
                onClick={() => onSelectRfp(rfp)}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 group relative ${selectedRfp?.id === rfp.id ? "bg-indigo-50/60" : "bg-white"}`}
              >
                {selectedRfp?.id === rfp.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-600 truncate max-w-[60%]">
                    {rfp.clientName}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDate(rfp.receivedDate)}
                  </span>
                </div>
                <h4
                  className={`font-semibold text-sm mb-2 leading-tight ${selectedRfp?.id === rfp.id ? "text-indigo-900" : "text-slate-700"}`}
                >
                  {isScraped ? (
                    <span className="flex items-start gap-2">
                      <File
                        size={16}
                        className="text-slate-400 mt-0.5 flex-shrink-0"
                      />
                      <span className="font-mono text-xs">
                        {rfp.pdfPath?.split(/[/\\]/).pop()}
                      </span>
                    </span>
                  ) : (
                    rfp.title
                  )}
                </h4>
                <div className="flex items-center gap-2 mt-3">
                  {isScraped && (
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Sparkles size={10} /> Scraped PDF
                    </span>
                  )}
                  {isAnalyzed && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 size={10} /> Analyzed
                    </span>
                  )}
                  {!isScraped && !isAnalyzed && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      New
                    </span>
                  )}
                  {calculateDaysRemaining(rfp.dueDate) < 5 && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Clock size={10} /> Urgent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {selectedRfp ? (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-slate-100 bg-white">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {selectedRfp.pdfPath
                      ? selectedRfp.pdfPath.split(/[/\\]/).pop()
                      : selectedRfp.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={16} className="text-slate-400" />{" "}
                      {selectedRfp.clientName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-slate-400" /> Due{" "}
                      {formatDate(selectedRfp.dueDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedRfp.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <ExternalLink size={20} />
                  </a>
                  {selectedRfp.pdfPath && (
                    <button
                      onClick={() => onInvokeAgent(selectedRfp.id)}
                      disabled={selectedRfp.isAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 transition-all flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {selectedRfp.isAnalyzing ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      {selectedRfp.isAnalyzing
                        ? "Processing..."
                        : "Invoke Main Agent"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-8 space-y-8 bg-[#f8fafc]/50">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                <AlertCircle className="mx-auto text-blue-500 mb-3" size={32} />
                <h3 className="text-blue-900 font-medium">Analysis Required</h3>
                <p className="text-blue-700/80 text-sm mt-1">
                  Invoke the main agent to begin processing this document.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileCheck size={16} className="text-slate-400" /> Source
                  Content
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-96 overflow-y-auto">
                  <p className="text-xs text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedRfp.rawContent}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <InboxIcon size={48} className="text-slate-300" />
            </div>
            <p className="font-medium text-slate-600">
              Select an RFP to view details
            </p>
            <p className="text-sm mt-1">Or sync to fetch new opportunities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
