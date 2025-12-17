import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import OemDatabase from "./pages/OEMDatabase";
import ProductPrices from "./pages/ProductPrices";
import TestServices from "./pages/TestServices";
import ServerOfflineModal from "./components/modals/ServerOfflineModal.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Inbox from "./pages/Inbox";
import Reports from "./pages/Reports";

import {
  MOCK_INCOMING_RFPS,
  MOCK_OEM_DATABASE,
  MOCK_PRODUCT_PRICES,
  MOCK_TEST_SERVICES,
} from "./constants/constants.ts";
import type {
  RFP,
  OEMDatabase as OEMDatabaseType,
  ViewState,
  ProductPrices as ProductPricesType,
  TestServices as TestServicesType,
} from "../types.ts";
import { RFPStatus } from "../types.ts";
import {
  testBackendConnection,
  triggerWebScraper,
  invokeMainAgent,
} from "./api/geminiapi.ts";

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");

  // Data State
  const [rfps, setRfps] = useState<RFP[]>(MOCK_INCOMING_RFPS);
  const [oemDatabase, setOemDatabase] =
    useState<OEMDatabaseType>(MOCK_OEM_DATABASE);
  const [productPrices, setProductPrices] =
    useState<ProductPricesType>(MOCK_PRODUCT_PRICES);
  const [testServices, setTestServices] =
    useState<TestServicesType>(MOCK_TEST_SERVICES);

  // UI Interaction State
  const [selectedRfp, setSelectedRfp] = useState<RFP | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  // Connection State
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [actionToRetry, setActionToRetry] = useState<{ fn: () => void } | null>(
    null,
  );

  // Initial Connection Check
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const result = await testBackendConnection();
    if (!result.ok) {
      setConnectionError(result.error || "Connection refused");
      setIsServerOffline(true);
    } else {
      setConnectionError(null);
      setIsServerOffline(false);
    }
    return result.ok;
  };

  const handleRetryConnection = async () => {
    const isOk = await checkConnection();
    if (isOk && actionToRetry) {
      // If the connection works, retry the last action
      actionToRetry.fn();
      setActionToRetry(null);
    }
  };

  const handleRefreshInbox = async () => {
    setIsScraping(true);
    setSelectedRfp(null);

    try {
      const newRfps = await triggerWebScraper();
      const existingIds = new Set(rfps.map((r) => r.id));
      const uniqueNew = newRfps.filter((r) => !existingIds.has(r.id));
      if (uniqueNew.length > 0) {
        setRfps((prev) => [...uniqueNew, ...prev]);
        alert(`Scraping complete! Found ${uniqueNew.length} new RFP(s).`);
      } else {
        alert("Scraping complete. No new RFPs were found.");
      }
    } catch (error) {
      console.error("Scraper failed", error);
      setConnectionError("Failed to run scraper. Ensure backend is active.");
      setIsServerOffline(true);
      setActionToRetry({ fn: handleRefreshInbox });
    } finally {
      setIsScraping(false);
    }
  };

  const handleInvokeAgent = async (rfpId: string) => {
    const rfpToProcess = rfps.find((r) => r.id === rfpId);
    if (!rfpToProcess || !rfpToProcess.pdfPath) {
      console.error("RFP not found or has no PDF path");
      return;
    }

    setRfps((prev) =>
      prev.map((r) => (r.id === rfpId ? { ...r, isAnalyzing: true } : r)),
    );
    if (selectedRfp?.id === rfpId) {
      setSelectedRfp((prev) => ({ ...prev!, isAnalyzing: true }));
    }

    try {
      const agentResult = await invokeMainAgent(rfpToProcess.pdfPath);

      const completedRfp: RFP = {
        ...rfpToProcess,
        agentResponse: agentResult,
        status: RFPStatus.COMPLETED,
        isAnalyzing: false,
      };

      setRfps((prev) => prev.map((r) => (r.id === rfpId ? completedRfp : r)));
      setSelectedRfp(null);

      alert(
        `Main agent processing complete for "${rfpToProcess.title}".\nThe final report is now available in the Reports section.`,
      );
    } catch (error) {
      console.error("Main Agent failed", error);
      setRfps((prev) =>
        prev.map((r) => (r.id === rfpId ? { ...r, isAnalyzing: false } : r)),
      );
      if (selectedRfp?.id === rfpId) {
        setSelectedRfp((prev) => ({ ...prev!, isAnalyzing: false }));
      }
      setConnectionError("Agent Invocation Failed. Check backend.");
      setIsServerOffline(true);
      setActionToRetry({ fn: () => handleInvokeAgent(rfpId) });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/*<ServerOfflineModal*/}
      {/*  isOpen={isServerOffline}*/}
      {/*  onRetry={handleRetryConnection}*/}
      {/*  error={connectionError}*/}
      {/*/>*/}
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        inboxCount={rfps.filter((r) => r.status === RFPStatus.INBOX).length}
      />
      <main className="flex-1 overflow-auto bg-[#f8fafc] p-8">
        <div className="max-w-7xl mx-auto h-full">
          {currentView === "dashboard" && (
            <Dashboard rfps={rfps} isScraping={isScraping} />
          )}

          {currentView === "inbox" && (
            <Inbox
              rfps={rfps}
              selectedRfp={selectedRfp}
              onSelectRfp={setSelectedRfp}
              onRefresh={handleRefreshInbox}
              onInvokeAgent={handleInvokeAgent}
              isScraping={isScraping}
            />
          )}

          {currentView === "reports" && (
            <Reports
              rfps={rfps}
              selectedRfp={selectedRfp}
              onSelectRfp={setSelectedRfp}
            />
          )}

          {currentView === "database" && (
            <OemDatabase products={oemDatabase} onUpdate={setOemDatabase} />
          )}
          {currentView === "prices" && (
            <ProductPrices prices={productPrices} onUpdate={setProductPrices} />
          )}
          {currentView === "services" && (
            <TestServices services={testServices} onUpdate={setTestServices} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
