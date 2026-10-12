import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, CheckCircle2, ShieldCheck, 
  Sprout, CloudRain, MapPin, Sparkles, Loader2 
} from 'lucide-react';
import { api } from '../api';

export default function ReportView({ profile, t, lang, role = 'farmer' }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.getSummary(profile.id);
        setSummaryData(resp);
      } catch (err) {
        setError(err.message || "Failed to load complete summary report.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [profile?.id, profile?.is_cleaned]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-agri-muted">Compiling final agricultural analysis report...</p>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        {error || "Unable to display report."}
      </div>
    );
  }

  const { dataset_info, cleaning_report, eda, rainfall_yield, state_analysis, insights, data_source_metadata } = summaryData;

  const isOfficer = role === 'officer';

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-agri-border no-print">
        <div>
          <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-agri-primary" />
            <span>{isOfficer ? t.report.title : (lang === 'mr' ? "किसान कृषी सल्लागार अहवाल" : "Kisan Farm Advisory Summary")}</span>
          </h1>
          <p className="text-xs text-agri-muted mt-1">
            {isOfficer ? t.report.subtitle : (lang === 'mr' ? "शेतकऱ्यांसाठी सोप्या व परिणामकारक भाषेतील कृषी निष्कर्ष आणि आकडेवारी" : "Practical agricultural findings and productivity highlights prepared for farm practitioners")}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-agri-dark text-white font-semibold text-xs hover:bg-agri-primary shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{t.report.printBtn}</span>
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-agri-border shadow-md space-y-8">
        
        {/* Document Header */}
        <div className="border-b border-gray-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="w-6 h-6 text-agri-primary" />
              <h2 className="text-xl font-bold text-agri-dark tracking-tight">
                {isOfficer ? "AgriLens Official Analytics Report" : "AgriLens Kisan Farm Advisory Report"}
              </h2>
            </div>
            <p className="text-xs text-agri-muted">
              {isOfficer ? "AgriLens Analytics Platform • Agricultural Data Analysis & Verification" : "AgriLens Platform • Farmer Decision Support & Agro-Climatic Intelligence"}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-agri-muted">
            <p><span className="font-semibold text-agri-text">{t.report.generatedOn}:</span> {new Date().toLocaleDateString()}</p>
            <p><span className="font-semibold text-agri-text">Quality Rating:</span> {dataset_info.quality_score}%</p>
            <p className="font-bold text-agri-primary text-[11px] mt-0.5">{isOfficer ? "Mode: Officer Review" : "Mode: Farmer Advisory"}</p>
          </div>
        </div>

        {/* Section 1: Dataset Metadata */}
        <div>
          <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3">
            {t.report.datasetMetadata}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl text-xs border border-gray-100">
            <div>
              <span className="text-gray-500">File Name:</span>
              <p className="font-bold text-agri-text mt-0.5 break-all">{dataset_info.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Total Observations:</span>
              <p className="font-bold text-agri-text mt-0.5">{dataset_info.row_count?.toLocaleString()} rows</p>
            </div>
            <div>
              <span className="text-gray-500">Feature Count:</span>
              <p className="font-bold text-agri-text mt-0.5">{dataset_info.col_count} columns</p>
            </div>
            <div>
              <span className="text-gray-500">Authenticity:</span>
              <p className="font-bold text-emerald-800 mt-0.5">
                {dataset_info.is_official ? "Official Verified Source" : "User Uploaded Dataset"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Data Preprocessing & Cleaning */}
        <div>
          <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3">
            {t.report.cleaningSummary}
          </h3>
          {cleaning_report ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-xs bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-emerald-800">Rows After Cleaning:</span>
                  <p className="font-bold text-emerald-950 text-sm mt-0.5">{cleaning_report.after_rows}</p>
                </div>
                <div>
                  <span className="text-emerald-800">Duplicates Removed:</span>
                  <p className="font-bold text-emerald-950 text-sm mt-0.5">{cleaning_report.duplicates_removed}</p>
                </div>
                <div>
                  <span className="text-emerald-800">Remaining Missing:</span>
                  <p className="font-bold text-emerald-950 text-sm mt-0.5">{cleaning_report.after_missing}</p>
                </div>
              </div>
              {cleaning_report.operations_applied?.length > 0 && (
                <ul className="text-xs text-agri-text space-y-1 list-disc pl-5">
                  {cleaning_report.operations_applied.map((op, i) => (
                    <li key={i}>{op}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-agri-muted italic">
              Original dataset evaluated at {dataset_info.quality_score}% quality score.
            </p>
          )}
        </div>

        {/* Section 3: Agro-Climatic Relationship (Rainfall vs Yield) */}
        {rainfall_yield && rainfall_yield.available && (
          <div>
            <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3">
              {t.report.rainfallRelationship}
            </h3>
            <div className="bg-[#F8FAF9] p-4 rounded-xl border border-agri-border text-xs space-y-2">
              <div className="flex flex-wrap items-baseline gap-4">
                <div>
                  <span className="text-gray-500">Correlation Coefficient:</span>
                  <span className="font-bold text-agri-dark ml-1 font-mono">r = {rainfall_yield.correlation_coefficient}</span>
                </div>
                <div>
                  <span className="text-gray-500">Relationship Strength:</span>
                  <span className="font-bold text-agri-primary ml-1">{rainfall_yield.relationship_strength}</span>
                </div>
              </div>
              <p className="text-agri-text font-medium italic pt-1">
                "{rainfall_yield.statistical_interpretation}"
              </p>
            </div>
          </div>
        )}

        {/* Section 4: State Rankings */}
        {state_analysis && state_analysis.available && (
          <div>
            <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3">
              {t.report.stateRankings}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-emerald-800 block mb-1">Top Producing States</span>
                {state_analysis.top_producing_states?.slice(0, 3).map((st, i) => (
                  <p key={i} className="text-gray-700 py-0.5">
                    {i+1}. {st.state}: <span className="font-semibold">{st.total_production?.toLocaleString()} T</span>
                  </p>
                ))}
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-agri-primary block mb-1">Highest Average Rainfall States</span>
                {state_analysis.state_summaries
                  ?.sort((a,b) => (b.avg_rainfall || 0) - (a.avg_rainfall || 0))
                  .slice(0, 3)
                  .map((st, i) => (
                    <p key={i} className="text-gray-700 py-0.5">
                      {i+1}. {st.state}: <span className="font-semibold">{st.avg_rainfall?.toLocaleString()} mm</span>
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Synthesized Key Insights */}
        {insights?.insights?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3">
              {t.report.keyInsights}
            </h3>
            <div className="space-y-2 text-xs">
              {insights.insights.map((ins) => {
                const title = (lang === 'mr' && ins.title_mr) ? ins.title_mr : ins.title;
                const desc = (lang === 'mr' && ins.description_mr) ? ins.description_mr : ins.description;

                return (
                  <div key={ins.id} className="p-3 rounded-xl border border-agri-border bg-white flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-agri-dark">{title}</span>
                      <p className="text-gray-600 mt-0.5">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 6: Official Data Citations */}
        {data_source_metadata && (
          <div className="border-t border-gray-200 pt-6 text-xs text-agri-muted space-y-1">
            <h4 className="font-bold text-agri-dark">{t.report.dataAuthenticityCitations}</h4>
            <p><strong>Source:</strong> {data_source_metadata.source_organization}</p>
            <p><strong>Publication:</strong> {data_source_metadata.publication} ({data_source_metadata.coverage_years})</p>
            <p><strong>Portal URL:</strong> {data_source_metadata.source_url}</p>
          </div>
        )}

      </div>
    </div>
  );
}
