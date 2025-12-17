export enum RFPStatus {
  INBOX = "INBOX",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

// Flexible Key-Value pair for specs (e.g., "ports": "24 x 1GbE")
export interface OEMSpec {
  [key: string]: string | number | boolean;
}

export interface OEMItem {
  oem: string;
  sku: string;
  specs: OEMSpec;
}

// Dictionary style database: { "Category Name": [Items...] }
export type OEMDatabase = Record<string, OEMItem[]>;
export type ProductPrices = Record<string, number>;
export type TestServices = Record<string, number>;

export interface TechnicalMatch {
  requirement: string;
  matchedSku: string | null;
  confidence: number;
  reasoning: string;
  cost?: number;
}

export interface CostBreakdown {
  products: {
    requirement: string;
    sku: string;
    cost: number;
  }[];
  services: {
    service: string;
    cost: number;
  }[];
  total: number;
}

// Represents the new structured JSON output from the agent
export interface AgentResponse {
  RFP_Metadata: {
    Title: string;
    Issuing_Organization: string;
    Submission_Deadline: string;
    Summary: string;
  };
  Technical_Recommendations: {
    RFP_Product: string;
    Top_3_Recommendations: {
      OEM: string;
      Model: string;
      Product_Type: string;
      Specs: Record<string, string | number>;
      Semantic_Score: number;
    }[];
    Top_OEM: string;
  }[];
  Pricing_Summary: {
    RFP_Product: string;
    Winning_OEM: string;
    Winning_Quote: {
      Model: string;
      Unit_Price_INR: number;
      Services_Cost_INR: number;
      Applied_Services: string[];
      Total_Item_Cost: number;
    };
  }[];
  Grand_Total_INR: number;
}

export interface RFP {
  id: string;
  title: string;
  clientName: string;
  sourceUrl: string;
  receivedDate: string;
  dueDate: string;
  rawContent: string;
  status: RFPStatus;

  // Scraper Output
  pdfPath?: string; // Path to the downloaded PDF file

  // Sales Agent Output
  summary?: string;
  productRequirements?: string[];
  testingRequirements?: string[];

  // Technical Agent Output
  technicalMatches?: TechnicalMatch[];
  finalReport?: string;
  costBreakdown?: CostBreakdown;

  // New field for the agent's structured JSON output
  agentResponse?: AgentResponse;

  // UI State
  isAnalyzing?: boolean;
}

export type ViewState =
  | "dashboard"
  | "inbox"
  | "reports"
  | "database"
  | "prices"
  | "services";
