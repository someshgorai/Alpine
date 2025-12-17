import axios, { AxiosError } from "axios";
import { axiosInstance } from "../lib/axios.ts"; // Import the instance here
import type { RFP, AgentResponse } from "../../types.ts"; // Adjust your types path

// ------------------------------------------------------------------
// ERROR HANDLING
// ------------------------------------------------------------------

const handleApiError = (
  error: unknown,
  serviceName: string,
  endpoint: string,
) => {
  console.error(`--- ${serviceName.toUpperCase()} API FAILED ---`);
  console.error(`Endpoint: ${endpoint}`);

  if (axios.isAxiosError(error)) {
    // Check using the instance or global axios
    const err = error as AxiosError;
    if (err.response) {
      console.error("Server Status:", err.response.status);
      console.error("Server Response Data:", err.response.data);
    } else if (err.request) {
      console.error("No response received:", err.request);
    } else {
      console.error("Request Setup Error:", err.message);
    }
  } else {
    console.error("Unexpected Error:", error);
  }

  throw new Error(
    `${serviceName} request failed. Please check backend connection.`,
  );
};

// ------------------------------------------------------------------
// SHARED API CLIENT
// ------------------------------------------------------------------

const apiClient = async <T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data: any = null,
  agentName: string,
): Promise<T> => {
  try {
    const response = await axiosInstance({
      method,
      url: path,
      data: data,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, agentName, path);
    throw error;
  }
};

// ------------------------------------------------------------------
// EXPORTED FUNCTIONS
// ------------------------------------------------------------------

export const testBackendConnection = async (): Promise<{
  ok: boolean;
  error?: string;
}> => {
  try {
    // Just ping the root to see if the proxy/server is alive
    await axiosInstance.get("/");
    return { ok: true };
  } catch (error: unknown) {
    console.error(`Connection test failed:`, error);
    return { ok: false, error: "Could not connect to backend." };
  }
};

export const triggerWebScraper = (): Promise<RFP[]> => {
  return apiClient<RFP[]>(`/scraper/run`, "POST", {}, "Web Scraper");
};

export const invokeMainAgent = (pdfPath: string): Promise<AgentResponse> => {
  return apiClient<AgentResponse>(
    `/agent/invoke`,
    "POST",
    { pdf_path: pdfPath },
    "Main Agent",
  );
};
