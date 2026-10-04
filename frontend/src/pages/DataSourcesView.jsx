import React, { useState, useEffect } from 'react';
import { 
  Bookmark, ShieldCheck, Download, ExternalLink, 
  CheckCircle2, Info, Loader2 
} from 'lucide-react';
import { api, API_BASE } from '../api';

export default function DataSourcesView({ t }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const data = await api.getDataSources();
        setSources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, []);

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-agri-primary" />
          <span>{t.sources.title}</span>
        </h1>
        <p className="text-xs text-agri-muted mt-1">
          {t.sources.subtitle}
        </p>
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

      {/* Download Sample Dataset Card */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-agri-dark flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>{t.sources.sampleDatasetTitle}</span>
          </h3>
          <p className="text-xs text-agri-muted mt-1">
            Directly download the official Ministry of Agriculture (DES) and IMD Pune sample dataset used in this project.
          </p>
        </div>

        <a
          href={`${API_BASE}/download/sample-csv`}
          download="All_India_Agriculture_Official_Sample_DES_IMD.csv"
          className="px-4 py-2.5 rounded-xl bg-agri-dark text-white font-semibold text-xs hover:bg-agri-primary shadow-sm transition-all flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{t.sources.downloadSampleBtn}</span>
        </a>
      </div>

      {/* Trusted Sources Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-agri-muted">
            <Loader2 className="w-6 h-6 text-agri-primary animate-spin mx-auto mb-2" />
            <span>Loading verified repository documentation...</span>
          </div>
        ) : (
          sources.map((src, idx) => (
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
          ))
        )}
      </div>
    </div>
  );
}
