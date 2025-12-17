import React from "react";
import { ArrowRight, Info, Cpu, Award, DollarSign } from "lucide-react";
import type { RFP } from "../../../types.ts";

interface JsonReportViewProps {
  rfp: RFP;
  onBack: () => void;
}

const JsonReportView: React.FC<JsonReportViewProps> = ({ rfp, onBack }) => {
  const { agentResponse } = rfp;
  if (!agentResponse) return null;

  const formatInr = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    let colorClasses = "bg-slate-100 text-slate-700";
    if (score > 90) colorClasses = "bg-emerald-100 text-emerald-800";
    else if (score > 85) colorClasses = "bg-sky-100 text-sky-800";
    else if (score > 80) colorClasses = "bg-amber-100 text-amber-800";
    return (
      <div
        className={`px-3 py-1 text-sm font-bold rounded-full ${colorClasses}`}
      >
        {score.toFixed(2)}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {agentResponse.RFP_Metadata.Title}
            </h2>
            <p className="text-sm text-slate-500">
              {agentResponse.RFP_Metadata.Issuing_Organization}
            </p>
          </div>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">
          Export PDF
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Metadata Summary */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Info size={16} /> RFP Summary
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {agentResponse.RFP_Metadata.Summary}
            </p>
          </section>

          {/* Technical Recommendations */}
          <section>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Cpu className="text-indigo-600" size={28} /> Technical
              Recommendations
            </h3>
            <div className="space-y-6">
              {agentResponse.Technical_Recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                >
                  <h4 className="font-bold text-lg text-slate-800 mb-5 pb-4 border-b border-slate-100">
                    {rec.RFP_Product}
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {rec.Top_3_Recommendations.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className={`rounded-xl border-2 p-5 transition-all ${item.OEM === rec.Top_OEM ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 bg-white"}`}
                      >
                        {item.OEM === rec.Top_OEM && (
                          <div className="text-xs font-bold text-white bg-indigo-500 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
                            <Award size={14} /> Top Recommendation
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-slate-800">
                              {item.OEM}
                            </p>
                            <p className="text-sm text-indigo-700 font-mono">
                              {item.Model}
                            </p>
                          </div>
                          <ScoreBadge score={item.Semantic_Score} />
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          {item.Product_Type}
                        </p>
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          <h5 className="text-xs font-semibold text-slate-500 uppercase">
                            Key Specs
                          </h5>
                          {Object.entries(item.Specs).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-xs text-slate-600"
                            >
                              <span className="font-medium opacity-70">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing Summary */}
          <section>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <DollarSign className="text-emerald-600" size={28} /> Pricing
              Summary
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">RFP Product Requirement</th>
                    <th className="px-6 py-4">Winning Bid</th>
                    <th className="px-6 py-4">Applied Services</th>
                    <th className="px-6 py-4 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {agentResponse.Pricing_Summary.map((priceItem, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {priceItem.RFP_Product}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {priceItem.Winning_OEM}
                        </p>
                        <p className="font-mono text-xs text-indigo-700">
                          {priceItem.Winning_Quote.Model}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {priceItem.Winning_Quote.Applied_Services.join(", ")}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                        {formatInr(priceItem.Winning_Quote.Total_Item_Cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-right font-bold text-slate-800 text-base"
                    >
                      Grand Total
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-xl text-indigo-700">
                      {formatInr(agentResponse.Grand_Total_INR)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default JsonReportView;
