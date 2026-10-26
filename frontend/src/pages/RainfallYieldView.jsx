import React, { useState, useEffect } from 'react';
import { 
  CloudRain, TrendingUp, Info, AlertTriangle, 
  HelpCircle, CheckCircle2, Loader2, Sparkles 
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, ReferenceLine, ZAxis 
} from 'recharts';
import { api } from '../api';
import EmptyDatasetState from '../components/EmptyDatasetState';

export default function RainfallYieldView({ profile, t, role = 'farmer', onExploreDemo, isDemoLoading = false, setCurrentView }) {
  if (!profile) {
    return (
      <EmptyDatasetState 
        title="Rainfall vs. Crop Yield Analysis"
        subtitle="Please load or upload a dataset to compute agro-climatic correlation models and regression trends."
        onExploreDemo={onExploreDemo}
        isDemoLoading={isDemoLoading}
        setCurrentView={setCurrentView}
      />
    );
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatsDetails, setShowStatsDetails] = useState(role === 'officer');

  useEffect(() => {
    if (!profile) return;
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.getRainfallYield(profile.id);
        setData(resp);
      } catch (err) {
        setError(err.message || "Failed to load rainfall vs yield analysis.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [profile?.id, profile?.is_cleaned]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-agri-muted">Computing agro-climatic correlation models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        {error}
      </div>
    );
  }

  // Graceful fallback if rainfall or yield is missing (Requirement 3 & 21)
  if (!data || !data.available) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-agri-border shadow-xs">
          <CloudRain className="w-12 h-12 text-agri-muted mx-auto mb-3 opacity-60" />
          <h2 className="text-lg font-bold text-agri-text mb-2">
            {t.rainfall.unavailableTitle}
          </h2>
          <p className="text-xs text-agri-muted leading-relaxed">
            {data?.reason || "Rainfall analysis cannot be generated because the uploaded dataset does not contain recognizable rainfall or productivity variables."}
          </p>
        </div>
      </div>
    );
  }

  const { correlation_coefficient: r, relationship_strength, statistical_interpretation, scatter_data, regression_line, summary_stats, is_derived_yield, derivation_formula } = data;

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
            <CloudRain className="w-6 h-6 text-agri-primary" />
            <span>{t.rainfall.title}</span>
          </h1>
          <p className="text-xs text-agri-muted mt-1">
            {t.rainfall.subtitle}
          </p>
        </div>

        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          {relationship_strength}
        </span>
      </div>

      {/* Derived Yield Notice if applicable */}
      {is_derived_yield && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Derived Yield Metric:</span>
            <p className="mt-0.5">{derivation_formula}</p>
          </div>
        </div>
      )}

      {/* Statistical Interpretation Card (Plain-Language Summary) */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-agri-primary" />
          <span>{t.rainfall.interpretationTitle}</span>
        </h3>
        <p className="text-sm text-agri-text leading-relaxed font-semibold">
          "{statistical_interpretation}"
        </p>
        <p className="text-xs text-agri-muted mt-3 pt-3 border-t border-gray-100 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span>{t.rainfall.nonCausalNote}</span>
        </p>
      </div>

      {/* Statistical Details Section (Collapsible for Farmers, Always open for Officers) */}
      <div>
        {role === 'farmer' && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setShowStatsDetails(!showStatsDetails)}
              className="text-xs font-semibold text-agri-primary hover:text-agri-dark px-3 py-1.5 rounded-lg bg-agri-light border border-agri-leaf/40 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>{showStatsDetails ? "Hide Statistical Formulas & r-values" : "📊 View Statistical Details (Pearson r, p-value, formulas)"}</span>
            </button>
          </div>
        )}

        {(showStatsDetails || role === 'officer') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Correlation Coefficient r */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
              <span className="text-xs font-semibold text-agri-muted uppercase tracking-wider">
                {t.rainfall.correlationTitle}
              </span>
              <p className="text-3xl font-extrabold text-agri-dark mt-1 font-mono">
                r = {r}
              </p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-bold ${
                Math.abs(r) >= 0.7 ? 'bg-emerald-100 text-emerald-800' :
                Math.abs(r) >= 0.4 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {relationship_strength}
              </span>
            </div>

            {/* Statistical Significance p-value */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
              <span className="text-xs font-semibold text-agri-muted uppercase tracking-wider">
                {t.rainfall.pValue}
              </span>
              <p className="text-3xl font-extrabold text-agri-text mt-1 font-mono">
                {summary_stats?.p_value !== undefined ? summary_stats.p_value : "N/A"}
              </p>
              <p className="text-[11px] text-agri-muted mt-2">
                {summary_stats?.p_value < 0.05 ? "Statistically significant (p < 0.05)" : "Sample non-significant (p >= 0.05)"}
              </p>
            </div>

            {/* Avg Rainfall */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
              <span className="text-xs font-semibold text-agri-muted uppercase tracking-wider">
                {t.rainfall.avgRainfall}
              </span>
              <p className="text-3xl font-extrabold text-sky-700 mt-1">
                {summary_stats?.avg_rainfall} <span className="text-sm font-normal">mm</span>
              </p>
              <p className="text-[11px] text-agri-muted mt-2">
                Range: {summary_stats?.min_rainfall} – {summary_stats?.max_rainfall} mm
              </p>
            </div>

            {/* Avg Yield */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
              <span className="text-xs font-semibold text-agri-muted uppercase tracking-wider">
                {t.rainfall.avgYield}
              </span>
              <p className="text-3xl font-extrabold text-emerald-800 mt-1">
                {summary_stats?.avg_yield?.toLocaleString()} <span className="text-sm font-normal">kg/ha</span>
              </p>
              <p className="text-[11px] text-agri-muted mt-2">
                Range: {summary_stats?.min_yield?.toLocaleString()} – {summary_stats?.max_yield?.toLocaleString()} kg/ha
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scatter Plot with Regression Trend */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
          <h3 className="text-base font-bold text-agri-text">
            {t.rainfall.scatterTitle}
          </h3>
          {regression_line && (
            <span className="text-xs font-mono bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 text-gray-700">
              Trend Line: y = {regression_line.slope}x + ({regression_line.intercept})
            </span>
          )}
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey="rainfall" 
                name={t.rainfall.xAxis} 
                unit=" mm"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="yield" 
                name={t.rainfall.yAxis} 
                unit=" kg/ha"
                tick={{ fontSize: 11 }}
              />
              <ZAxis range={[50, 150]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl border border-agri-border shadow-lg text-xs space-y-1">
                        <p className="font-bold text-agri-dark">{d.crop} ({d.state})</p>
                        <p className="text-gray-600">Rainfall: <span className="font-semibold text-agri-text">{d.rainfall} mm</span></p>
                        <p className="text-gray-600">Yield: <span className="font-semibold text-agri-text">{d.yield?.toLocaleString()} kg/ha</span></p>
                        {d.year && <p className="text-gray-400 text-[10px]">Year: {d.year}</p>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Crop Observations" 
                data={scatter_data} 
                fill="#2E7D32" 
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
