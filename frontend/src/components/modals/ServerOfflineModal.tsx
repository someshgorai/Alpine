import React from "react";
import { ServerCrash, Info, RefreshCw } from "lucide-react";

interface ServerOfflineModalProps {
  isOpen: boolean;
  onRetry: () => void;
  error: string | null;
}

const ServerOfflineModal: React.FC<ServerOfflineModalProps> = ({
  isOpen,
  onRetry,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-start gap-4 bg-rose-50/70">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 flex items-center justify-center rounded-xl flex-shrink-0">
            <ServerCrash size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Server Connection Failed
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              The frontend cannot reach the API.
            </p>
          </div>
        </div>
        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800 font-semibold">
                    Error Details
                  </p>
                  <p className="mt-1 text-xs text-amber-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              Troubleshooting
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Ensure your backend is running on port 8000. Run this in your
              terminal:
            </p>
            <code className="block w-full text-left bg-slate-900 text-slate-200 p-3 rounded-md text-xs font-mono">
              uvicorn fastapi_app:app --reload --host 0.0.0.0 --port 8000
            </code>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end items-center">
          <div>
            <button
              onClick={onRetry}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200 text-sm flex items-center gap-2 ml-2"
            >
              <RefreshCw size={16} /> Retry Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerOfflineModal;
