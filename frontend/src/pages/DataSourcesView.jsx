import React, { useState, useEffect } from 'react';
import { 
  Bookmark, ShieldCheck, Download, ExternalLink, 
  CheckCircle2, Info, Loader2, RefreshCw, AlertCircle
} from 'lucide-react';
import { api, API_BASE } from '../api';

const VERIFIED_FALLBACK_SOURCES = [
  {
    dataset_name: "Curated All-India Crop Production & Agro-Climatic Demonstration Dataset",
    source_organization: "Directorate of Economics and Statistics (DES), Department of Agriculture & Farmers Welfare, Ministry of Agriculture, Govt. of India & IMD Pune",
    source_url: "https://upag.gov.in",
    publication: "Agricultural Statistics at a Glance (DES) & UPAg Unified Portal for Agricultural Statistics",
    coverage_years: "2017 to 2022",
    variables: [
      "State", "Year", "Season", "Crop", "Cultivated_Area_ha",
      "Crop_Production_tonnes", "Crop_Yield_kg_per_ha", "Annual_Rainfall_mm",
      "Fertilizer_Usage_kg_per_ha", "Average_Temperature_C"
    ],
    description: "Curated demonstration dataset compiled according to historical crop cutting experiment benchmarks and agro-meteorological reporting frameworks published by DES and IMD Pune. Features primary Indian staple and cash crops across major agricultural states with controlled scenarios for data cleaning and pipeline verification.",
    verification_status: "Curated Benchmark Demonstration Dataset",
    download_available: true
  },
  {
    dataset_name: "Open Government Data (OGD) Platform India",
    source_organization: "National Informatics Centre (NIC), Ministry of Electronics & IT, Govt. of India",
    source_url: "https://data.gov.in",
    publication: "Ministry of Agriculture & Farmers Welfare Datasets",
    coverage_years: "2010 to Present",
    variables: ["State", "District", "Crop", "Season", "Area", "Production", "Yield"],
    description: "Government of India central data repository providing machine-readable datasets published by various ministries under the NDSAP policy.",
    verification_status: "Official Govt Portal",
    download_available: false
  },
  {
    dataset_name: "ICAR Agricultural Research Repository",
    source_organization: "Indian Council of Agricultural Research (ICAR)",
    source_url: "https://icar.org.in",
    publication: "All India Coordinated Research Project Reports",
    coverage_years: "Annual Observational Data",
    variables: ["Crop Varieties", "Soil NPK", "Agro-Climatic Zones", "Fertilizer Trials"],
    description: "Apex body for coordinating, guiding and managing agricultural research and education in India.",
    verification_status: "National Apex Research Body",
    download_available: false
  },
  {
    dataset_name: "IMD Pune Agro-Meteorological Database",
    source_organization: "India Meteorological Department (IMD), Ministry of Earth Sciences",
    source_url: "https://dsp.imdpune.gov.in",
    publication: "National Data Centre Climate Bulletins",
    coverage_years: "1901 to Present",
    variables: ["Rainfall (mm)", "Minimum Temp", "Maximum Temp", "Humidity (%)", "Solar Radiation"],
    description: "Comprehensive meteorological and precipitation records collected across nationwide observatories and automatic weather stations.",
    verification_status: "Official National Meteorological Agency",
    download_available: false
  }
];

export default function DataSourcesView({ t, onExploreDemo, isDemoLoading = false }) {
  const [sources, setSources] = useState(VERIFIED_FALLBACK_SOURCES);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('verified'); // 'verified', 'syncing', 'synced', 'cached'
  const [syncError, setSyncError] = useState(null);

  const fetchSources = async () => {
    setLoading(true);
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const data = await api.getDataSources();
      if (Array.isArray(data) && data.length > 0) {
        setSources(data);
        setSyncStatus('synced');
      } else {
        setSyncStatus('cached');
      }
    } catch (err) {
      console.warn("Live data sources fetch warning:", err.message);
      setSyncStatus('cached');
      setSyncError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-agri-primary" />
            <span>{t.sources.title}</span>
          </h1>
          <p className="text-xs text-agri-muted mt-1">
            {t.sources.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {syncStatus === 'syncing' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-agri-muted px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-agri-primary" />
              <span>Checking live API...</span>
            </span>
          )}
          {syncStatus === 'synced' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live API Verified</span>
            </span>
          )}
          {syncStatus === 'cached' && (
            <button
              onClick={fetchSources}
              className="inline-flex items-center gap-1.5 text-xs text-amber-900 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Click to retry connecting to live documentation endpoint"
            >
              <RefreshCw className="w-3 h-3 text-amber-700" />
              <span>Official Registry (Cached) • Retry Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Authenticity Notice Card */}
      <div className="p-4 rounded-2xl bg-[#F0F7F0] border border-agri-leaf/30 text-xs text-agri-dark flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-agri-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Official Data Integrity Policy</p>
          <p className="leading-relaxed text-agri-muted">
            {t.sources.notice}
          </p>
        </div>
      </div>

      {/* Canonical Sample Dataset Actions Card */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-agri-dark flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{t.sources.sampleDatasetTitle}</span>
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              DES & IMD Curated Benchmark
            </span>
          </div>
          <p className="text-xs text-agri-muted leading-relaxed max-w-xl">
            {t.sources.sampleDatasetSubtitle || "Download the canonical CSV file to your device for offline analysis, or explore it directly inside AgriLens."}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-1">
            <span>• <strong>Download CSV:</strong> saves the raw file to your computer</span>
            <span>• <strong>Explore in AgriLens:</strong> activates pipeline & analytics</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <a
            href={`${API_BASE}/download/sample-csv`}
            download="All_India_Agriculture_Official_Sample_DES_IMD.csv"
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs border border-gray-300 transition-all flex items-center justify-center gap-2 shadow-2xs"
            title="Download CSV file directly to your disk"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>{t.sources.downloadSampleBtn}</span>
          </a>

          {onExploreDemo && (
            <button
              onClick={onExploreDemo}
              disabled={isDemoLoading}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDemoLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-agri-dark hover:bg-agri-primary'
              }`}
              title="Load dataset into AgriLens active analytics session"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t.sources.exploreInAppBtn || "Explore in AgriLens"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Trusted Sources Cards Grid */}
      <div className="space-y-4">
        {sources.map((src, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs hover:border-agri-leaf transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-agri-text">
                {src.dataset_name}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                {src.verification_status}
              </span>
            </div>

            <p className="text-xs text-agri-muted leading-relaxed">
              {src.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-500 font-semibold">{t.sources.sourceOrg}:</span>
                <p className="text-agri-dark mt-0.5">{src.source_organization}</p>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">{t.sources.coverage}:</span>
                <p className="text-agri-dark mt-0.5">{src.coverage_years}</p>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">{t.sources.officialLink}:</span>
                <a 
                  href={src.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-agri-primary hover:text-agri-dark font-medium flex items-center gap-1 mt-0.5"
                >
                  <span>Visit Official Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {src.variables?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
                  {t.sources.variables}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {src.variables.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-agri-light text-agri-dark text-[10px] font-mono border border-agri-leaf/20">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
