import React, { useState } from "react";
import type { TestServices as TestServicesType } from "../../types";
import { Search, Plus, Trash2, X, Check, Edit } from "lucide-react";

interface TestServicesProps {
  services: TestServicesType;
  onUpdate: (services: TestServicesType) => void;
}

const TestServices: React.FC<TestServicesProps> = ({ services, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState("");
  const [newCost, setNewCost] = useState("");
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string>("");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const handleDelete = (serviceToDelete: string) => {
    if (
      confirm(
        `Are you sure you want to delete the service: ${serviceToDelete}?`,
      )
    ) {
      const updatedServices = { ...services };
      delete updatedServices[serviceToDelete];
      onUpdate(updatedServices);
    }
  };

  const handleAdd = () => {
    if (!newService || !newCost || isNaN(parseFloat(newCost))) {
      alert("Please enter a valid service name and a numeric cost.");
      return;
    }
    if (services[newService]) {
      alert("This service already exists. Please use a unique name.");
      return;
    }
    onUpdate({ ...services, [newService]: parseFloat(newCost) });
    setNewService("");
    setNewCost("");
    setIsAdding(false);
  };

  const handleStartEdit = (service: string, cost: number) => {
    setEditingService(service);
    setEditingCost(String(cost));
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setEditingCost("");
  };

  const handleSaveEdit = () => {
    if (editingService && !isNaN(parseFloat(editingCost))) {
      onUpdate({ ...services, [editingService]: parseFloat(editingCost) });
      setEditingService(null);
    }
  };

  const filteredServices = Object.keys(services)
    .filter((service) =>
      service.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort();

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Services & Labor Costs
          </h2>
          <p className="text-slate-500 mt-1">
            Manage costs for testing, installation, and other services.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all text-sm font-medium"
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by service name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-medium text-slate-500">
            {filteredServices.length} Total Services
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
              <tr>
                <th className="px-6 py-3">Service / Activity</th>
                <th className="px-6 py-3">Cost (USD)</th>
                <th className="px-6 py-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((service) => (
                <tr
                  key={service}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {service}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-800">
                    {editingService === service ? (
                      <input
                        type="number"
                        value={editingCost}
                        onChange={(e) => setEditingCost(e.target.value)}
                        className="px-2 py-1 rounded border border-indigo-300 bg-white"
                        autoFocus
                      />
                    ) : (
                      formatCurrency(services[service])
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingService === service ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            handleStartEdit(service, services[service])
                          }
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                Add New Service
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Service Name
                </label>
                <input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="e.g., Installation & Commissioning"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Cost (USD)
                </label>
                <input
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  type="number"
                  placeholder="e.g., 10000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
              <button
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestServices;
