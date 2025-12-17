import {
  type OEMDatabase,
  type RFP,
  RFPStatus,
  type ProductPrices,
  type TestServices,
} from "../../types.ts";

export const MOCK_OEM_DATABASE: OEMDatabase = {
  "Salt Bath Pit Type Furnace": [
    {
      oem: "InductoTherm",
      sku: "SBP-1000",
      specs: {
        Max_Temp: "1300°C",
        Capacity: "500 kg",
        Controller: "PID Auto-Tune Digital",
        Power_Supply: "3 Phase, 440V AC",
        Certification: "ISO 9001, CE",
      },
    },
    {
      oem: "ThermTech Engineering",
      sku: "TT-SBF-750",
      specs: {
        Max_Temp: "1200°C",
        Capacity: "400 kg",
        Controller: "Digital Microprocessor",
        Power_Supply: "415V, 50Hz",
        Certification: "ISO 9001",
      },
    },
    {
      oem: "HeatPro",
      sku: "HP-SBP-520",
      specs: {
        Max_Temp: "1250°C",
        Capacity: "520 kg",
        Controller: "PLC + HMI",
        Power: "3 Phase",
      },
    },
  ],
  "Benchtop Thermocouple Calibration Furnace": [
    {
      oem: "Fluke Calibration",
      sku: "9142-X",
      specs: {
        Temp_Range: "35°C to 650°C",
        Stability: "±0.01°C",
        Resolution: "0.001°C",
        Certification: "ISO 17025",
      },
    },
    {
      oem: "Omega",
      sku: "CTF-700",
      specs: {
        Temp_Range: "50°C to 700°C",
        Stability: "±0.02°C",
      },
    },
  ],
  "Tubular Furnace": [
    {
      oem: "Carbolite Gero",
      sku: "TF-1200",
      specs: {
        Max_Temp: "1200°C",
        Tube_Diameter: "60 mm",
        Heating_Zones: "1",
        Certification: "ISO 9001",
      },
    },
    {
      oem: "Nabertherm",
      sku: "RT-1000",
      specs: {
        Max_Temp: "1000°C",
        Tube_Diameter: "80 mm",
        Heating_Zones: "3",
      },
    },
  ],
  "Portable Calibration Furnace": [
    {
      oem: "Additel",
      sku: "ADT875-155",
      specs: {
        Temp_Range: "33°C to 660°C",
        Stability: "±0.005°C",
        Warmup_Time: "10 minutes",
        Certification: "ISO 9001, CE",
      },
    },
    {
      oem: "Kaye",
      sku: "K-660",
      specs: {
        Temp_Range: "40°C to 660°C",
        Stability: "±0.01°C",
      },
    },
    {
      oem: "MiniTherm",
      sku: "MT-500P",
      specs: {
        Temp_Range: "30°C to 500°C",
        Portability: "Hand-carry",
      },
    },
  ],
  "Muffle Furnace": [
    {
      oem: "ThermoTech",
      sku: "MT-200",
      specs: {
        Max_Temp: "1200°C",
        Chamber_Volume: "5L",
        Controller: "PID Digital",
        Certification: "ISO 9001",
      },
    },
    {
      oem: "LabHeat",
      sku: "LH-MF500",
      specs: {
        Max_Temp: "1150°C",
        Chamber_Volume: "6L",
        Controller: "Analog PID",
        Certification: "ISO 9001",
      },
    },
    {
      oem: "Furnax",
      sku: "FX-MF250",
      specs: {
        Max_Temp: "1100°C",
        Chamber_Volume: "4L",
      },
    },
  ],
  "Atomic Absorption Spectrophotometer": [
    {
      oem: "Shimadzu",
      sku: "AA-6700",
      specs: {
        Wavelength_Range: "185-900nm",
        Autosampler: "Optional",
        Detector: "Flame/Graphite Furnace",
        Certification: "ISO 9001",
      },
    },
  ],
  "Electronic Weigh Bridge": [
    {
      oem: "WeighCorp",
      sku: "WB-50K",
      specs: {
        Capacity: "50,000 kg",
        Platform_Size: "6m x 3m",
        Indicator: "Digital",
        Accuracy: "±20 kg",
      },
    },
  ],
  "Alumina Beam type Brick": [
    {
      oem: "Refracta",
      sku: "RB-Alu-60",
      specs: {
        Material: "High alumina (60%)",
        Size: "230x114x65 mm",
        Application: "Sinter Furnace lining",
      },
    },
  ],
  "Portable Gas Analyzer": [
    {
      oem: "Testo",
      sku: "Testo-350",
      specs: {
        Gases: "O2/CO/NOx",
        Display: "LCD",
        Battery: "8 hours",
      },
    },
  ],
  "Calibration Bath": [
    {
      oem: "ThermoBath",
      sku: "TB-300",
      specs: {
        Temp_Range: "-30°C to 150°C",
        Stability: "±0.02°C",
        Volume: "10L",
      },
    },
  ],
  "Laser Particle Size Analyzer": [
    {
      oem: "Malvern",
      sku: "Mastersizer-3000",
      specs: {
        Range: "0.01 to 3500 µm",
        Repeatability: "±0.1%",
      },
    },
  ],
  "Humidity Chamber": [
    {
      oem: "ClimaticWorks",
      sku: "HC-500",
      specs: {
        Temp_Range: "-20°C to 150°C",
        Humidity: "10% - 98% RH",
      },
    },
  ],
};

export const MOCK_PRODUCT_PRICES: ProductPrices = {
  "SBP-1000": 350000,
  "TT-SBF-750": 300000,
  "MT-200": 250000,
  "TF-1200": 180000,
  "ADT875-155": 120000,
  "9142-X": 450000,
  "WB-50K": 200000,
  "AA-6700": 1800000,
  "RB-Alu-60": 15000,
  "TB-300": 60000,
  "RT-1000": 160000,
  "HP-SBP-520": 320000,
  "CTF-700": 420000,
  "K-660": 110000,
  "LH-MF500": 240000,
  "FX-MF250": 200000,
  "Mastersizer-3000": 2200000,
  "HC-500": 350000,
  "MT-500P": 80000,
  "default_Muffle Furnace": 230000,
  "Salt Bath Pit Type Furnace": 310000,
  "Tubular Furnace": 170000,
  "Portable Calibration Furnace": 115000,
};

export const MOCK_TEST_SERVICES: TestServices = {
  FAT: 5000,
  SAT: 7000,
  "Performance Test": 4000,
  "Installation & Commissioning": 10000,
  "Calibration Certificate": 3000,
  "Transport & Handling": 15000,
};

export const MOCK_INCOMING_RFPS: RFP[] = [
  {
    id: "rfp-nit-jsr-1",
    title: "National Institute Of Technology - Salt Bath Pit Type Furnace",
    clientName: "National Institute of Technology, Jamshedpur",
    sourceUrl: "https://nitjsr.ac.in/tenders",
    receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    rawContent: `
TENDER NOTICE

National Institute of Technology, Jamshedpur
Department of Metallurgical and Materials Engineering

Ref: NITJSR/MMED/2024/FURN/001
Date: 14-08-2024

Subject: Invitation of quotations for supply and installation of one (01) Salt Bath Pit Type Furnace.

Sealed tenders are invited from reputed manufacturers/authorized dealers for the supply and installation of a Salt Bath Pit Type Furnace with the following minimum specifications:

1.  **Equipment**: Salt Bath Pit Type Furnace
2.  **Max Temperature**: 1200°C
3.  **Working Temperature**: 1100°C
4.  **Capacity**: 500 kg (approx)
5.  **Controller**: PID Auto-Tune Digital Controller with data logging facility.
6.  **Power Supply**: 3 Phase, 440V AC.
7.  **Safety Features**: Over-temperature protection, emergency shut-off.
8.  **Certifications**: ISO 9001 and CE marking required.
9.  **Warranty**: Minimum 1 year comprehensive warranty.
10. **Scope of Work**: Supply, installation, commissioning, and on-site training.

Interested parties are requested to submit their bids in a sealed envelope to the office of the Head of Department, Metallurgical and Materials Engineering, NIT Jamshedpur, on or before 30-08-2024, 3:00 PM.

The institute reserves the right to accept or reject any tender without assigning any reason.

Head of Department,
MMED, NIT Jamshedpur
    `,
    status: RFPStatus.INBOX,
    pdfPath: "data/raw/Nit_jsr.pdf", // This path will be sent to the agent
  },
];
