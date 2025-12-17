import React, { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Package,
  Server,
  Wifi,
  Cpu,
  Thermometer,
  Scale,
  Beaker,
} from "lucide-react";
import type { OEMDatabase, OEMItem, OEMSpec } from "../../types.ts";

interface OemDatabaseProps {
  products: OEMDatabase;
  onUpdate: (products: OEMDatabase) => void;
}

const OemDatabase: React.FC<OemDatabaseProps> = ({ products, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const [isAdding, setIsAdding] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const [newOem, setNewOem] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newSpecs, setNewSpecs] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const categories = Object.keys(products);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleDelete = (category: string, skuToDelete: string) => {
    if (confirm(`Are you sure you want to delete SKU: ${skuToDelete}?`)) {
      const updatedCategoryItems = products[category].filter(
        (p) => p.sku !== skuToDelete,
      );
      onUpdate({
        ...products,
        [category]: updatedCategoryItems,
      });
    }
  };

  const handleOpenAdd = (category?: string) => {
    setActiveCategory(category || categories[0] || "");
    setNewOem("");
    setNewSku("");
    if (category && products[category].length > 0) {
      const exampleSpecs = products[category][0].specs;
      const specArr = Object.entries(exampleSpecs).map(([k, v]) => ({
        key: k,
        value: "",
      }));
      setNewSpecs(specArr);
    } else {
      setNewSpecs([{ key: "description", value: "" }]);
    }
    setIsAdding(true);
  };

  const handleSpecChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const updated = [...newSpecs];
    updated[index][field] = val;
    setNewSpecs(updated);
  };

  const addSpecRow = () => {
    setNewSpecs([...newSpecs, { key: "", value: "" }]);
  };

  const removeSpecRow = (index: number) => {
    setNewSpecs(newSpecs.filter((_, i) => i !== index));
  };

  const handleSaveProduct = () => {
    if (!activeCategory || !newSku || !newOem) {
      alert("Please fill in Category, OEM, and SKU.");
      return;
    }
    const specObj: OEMSpec = {};
    newSpecs.forEach((item) => {
      if (item.key.trim()) {
        specObj[item.key] = item.value;
      }
    });

    const newItem: OEMItem = {
      oem: newOem,
      sku: newSku,
      specs: specObj,
    };

    const existingItems = products[activeCategory] || [];
    onUpdate({
      ...products,
      [activeCategory]: [...existingItems, newItem],
    });
    setIsAdding(false);
  };

  const filteredCategories = categories.filter((cat) => {
    if (cat.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    return products[cat].some((p) =>
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  });

  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (
      lower.includes("furnace") ||
      lower.includes("bath") ||
      lower.includes("chamber")
    )
      return <Thermometer size={18} className="text-red-500" />;
    if (lower.includes("analyzer") || lower.includes("spectrophotometer"))
      return <Beaker size={18} className="text-green-500" />;
    if (lower.includes("weigh") || lower.includes("bridge"))
      return <Scale size={18} className="text-yellow-500" />;
    if (lower.includes("switch"))
      return <Server size={18} className="text-blue-500" />;
    if (lower.includes("wi-fi") || lower.includes("access"))
      return <Wifi size={18} className="text-purple-500" />;
    if (lower.includes("compute") || lower.includes("server"))
      return <Cpu size={18} className="text-emerald-500" />;
    return <Package size={18} className="text-slate-500" />;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Product Database
          </h2>
          <p className="text-slate-500 mt-1">
            Manage technical specifications and OEM inventory.
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all text-sm font-medium"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Category, Brand, or SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-medium text-slate-500">
            {Object.values(products).flat().length} Total SKUs
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search size={24} />
              </div>
              <h3 className="text-slate-900 font-medium">No products found</h3>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your search terms
              </p>
            </div>
          )}

          {filteredCategories.map((category) => {
            const items = products[category];
            const visibleItems = items.filter(
              (p) =>
                searchTerm === "" ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            if (visibleItems.length === 0) return null;

            const isExpanded =
              expandedCategories[category] || searchTerm !== "";

            return (
              <div
                key={category}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white transition-all duration-200"
              >
                <div
                  className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isExpanded ? "bg-slate-50 border-b border-slate-100" : "hover:bg-slate-50"}`}
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-md ${isExpanded ? "bg-white shadow-sm" : "bg-slate-100"}`}
                    >
                      {getCategoryIcon(category)}
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">
                      {category}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
                      {visibleItems.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAdd(category);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      + Add Item
                    </button>
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="px-6 py-3 w-40">Manufacturer</th>
                          <th className="px-6 py-3 w-48">SKU</th>
                          <th className="px-6 py-3">
                            Technical Specifications
                          </th>
                          <th className="px-6 py-3 w-20 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-slate-700">
                              {item.oem}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-600 text-xs">
                              {item.sku}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(item.specs).map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="inline-flex items-center px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs max-w-full"
                                  >
                                    <span className="font-semibold text-slate-600 mr-1.5 opacity-70">
                                      {k}:
                                    </span>
                                    <span
                                      className="truncate max-w-[200px]"
                                      title={String(v)}
                                    >
                                      {String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDelete(category, item.sku)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete SKU"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add SKU Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Add Product
                </h3>
                <p className="text-sm text-slate-500">
                  Add a new SKU to the technical database.
                </p>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <input
                      list="category-options"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      placeholder="Select or type..."
                    />
                    <datalist id="category-options">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    OEM / Brand
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    value={newOem}
                    onChange={(e) => setNewOem(e.target.value)}
                    placeholder="e.g. Cisco, Aruba"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  SKU / Model Number
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="e.g. C9300-24P-A"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Specifications
                  </label>
                  <button
                    onClick={addSpecRow}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Field
                  </button>
                </div>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {newSpecs.map((spec, i) => (
                    <div key={i} className="flex gap-3 group">
                      <input
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:border-indigo-500 outline-none"
                        placeholder="Key (e.g. Ports)"
                        value={spec.key}
                        onChange={(e) =>
                          handleSpecChange(i, "key", e.target.value)
                        }
                      />
                      <input
                        className="flex-[2] px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-900 focus:border-indigo-500 outline-none"
                        placeholder="Value (e.g. 24 x 10/100/1000)"
                        value={spec.value}
                        onChange={(e) =>
                          handleSpecChange(i, "value", e.target.value)
                        }
                      />
                      <button
                        onClick={() => removeSpecRow(i)}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
              <button
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200 text-sm"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OemDatabase;
