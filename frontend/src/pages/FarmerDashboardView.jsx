import React, { useState, useEffect } from 'react';
import { 
  Sprout, CloudRain, TrendingUp, MapPin, Sparkles, 
  FileText, UploadCloud, ShieldCheck, CheckCircle2, 
  ChevronDown, ChevronUp, Info, ArrowUpRight, ArrowRight,
  BarChart3, PieChart as PieIcon, Loader2, Printer, Check
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, ZAxis 
} from 'recharts';
import { api } from '../api';
import IndiaMap from '../components/IndiaMap';

const CHART_COLORS = ['#2E7D32', '#1B5E20', '#4CAF50', '#F9A825', '#0284C7', '#7C3AED', '#DB2777', '#EA580C'];

export default function FarmerDashboardView({ 
  profile, 
  t, 
  lang, 
  setCurrentView, 
  onExploreDemo 
}) {
  const [loading, setLoading] = useState(true);
  const [vizData, setVizData] = useState(null);
  const [rainfallData, setRainfallData] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [showStatsDetails, setShowStatsDetails] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const fetchFarmerData = async () => {
      setLoading(true);
      try {
        const [viz, rf, st, ins] = await Promise.all([
          api.getVisualizations(profile.id).catch(() => null),
          api.getRainfallYield(profile.id).catch(() => null),
          api.getStateAnalysis(profile.id).catch(() => null),
          api.getInsights(profile.id).catch(() => null)
        ]);
        setVizData(viz);
        setRainfallData(rf);
        setStateData(st);
        setInsightsData(ins);
      } catch (err) {
        console.error("Error loading farmer view data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmerData();
  }, [profile?.id, profile?.is_cleaned]);

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl p-10 border border-agri-border shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-agri-light text-agri-primary flex items-center justify-center mx-auto mb-4 border border-agri-leaf/30">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-agri-dark mb-2">
            {t.farmer.welcomeTitle}
          </h2>
          <p className="text-sm text-agri-muted max-w-lg mx-auto mb-6">
            {t.farmer.welcomeSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('upload')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-agri-primary text-white font-semibold text-sm hover:bg-agri-dark shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t.nav.upload}</span>
            </button>
            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-agri-primary text-agri-dark font-semibold text-sm hover:bg-agri-light shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sprout className="w-4 h-4 text-agri-primary" />
              <span>{t.landing.btnDemo}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const charts = vizData?.charts || [];
  const topCropChart = charts.find(c => c.id === 'crop_production_bar');
  const cropShareChart = charts.find(c => c.id === 'crop_share_donut');
  const yearlyTrendChart = charts.find(c => c.id === 'yearly_trend_line');
  const insights = insightsData?.insights || [];

  return (
    <div className="space-y-8 py-6">
      
      {/* Farmer Greeting & Active Dataset Status Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 border border-white/30">
                🌾 {t.farmer.badge}
              </span>
              {profile.is_official_sample && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-white text-[11px] font-medium border border-emerald-400/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t.dashboard.officialBadge}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.farmer.title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
              {t.farmer.subtitle} ({profile.original_name})
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentView('report')}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>{t.farmer.printAdvisoryBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
          <p className="text-xs text-agri-muted">Preparing farmer insights & visual charts...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: Key Agricultural Summary Cards (Simplified) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Data Health */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.farmer.healthTitle}</span>
                <p className="text-xl font-extrabold text-agri-dark mt-0.5">{profile.quality_score}%</p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {profile.quality_score >= 85 ? t.farmer.healthExcellent : t.farmer.healthGood}
                </p>
              </div>
            </div>

            {/* Card 2: Average Crop Yield */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.farmer.yieldTitle}</span>
                <p className="text-xl font-extrabold text-amber-900 mt-0.5">
                  {rainfallData?.summary_stats?.avg_yield ? `${rainfallData.summary_stats.avg_yield.toLocaleString()} kg/ha` : "N/A"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {t.farmer.yieldSubtitle}
                </p>
              </div>
            </div>

            {/* Card 3: Average Annual Rainfall */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0">
                <CloudRain className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.farmer.rainfallTitle}</span>
                <p className="text-xl font-extrabold text-sky-900 mt-0.5">
                  {rainfallData?.summary_stats?.avg_rainfall ? `${rainfallData.summary_stats.avg_rainfall} mm` : "N/A"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {rainfallData?.summary_stats?.avg_rainfall ? t.farmer.rainfallRecorded : t.farmer.notRecorded}
                </p>
              </div>
            </div>

            {/* Card 4: Top Producing State */}
            <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.farmer.topStateTitle}</span>
                <p className="text-xl font-extrabold text-purple-950 mt-0.5 truncate max-w-[150px]">
                  {stateData?.top_producing_states?.[0]?.state || "All India"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {stateData?.top_producing_states?.[0]?.top_crop ? `Leading: ${stateData.top_producing_states[0].top_crop}` : "Regional Leader"}
                </p>
              </div>
            </div>

          </div>

          {/* SECTION 2: Important Agricultural Insights Cards */}
          {insights.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-agri-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-agri-dark flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-agri-primary" />
                  <span>{t.farmer.insightsTitle}</span>
                </h3>
                <span className="text-xs text-agri-muted">{t.farmer.insightsSubtitle}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.slice(0, 3).map((item) => {
                  const title = (lang === 'mr' && item.title_mr) ? item.title_mr : item.title;
                  const desc = (lang === 'mr' && item.description_mr) ? item.description_mr : item.description;

                  return (
                    <div 
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#F8FAF9] border border-gray-100 flex flex-col justify-between space-y-2 hover:border-agri-leaf transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-agri-primary">{item.metric_value}</span>
                        </div>
                        <h4 className="text-sm font-bold text-agri-dark mb-1">
                          {title}
                        </h4>
                        <p className="text-xs text-agri-text leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: Visual Crop Production Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Crops Production Bar Chart */}
            {topCropChart && (
              <div className="bg-white rounded-3xl p-6 border border-agri-border shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-agri-dark mb-1">
                    {(lang === 'mr' && topCropChart.title_mr) ? topCropChart.title_mr : topCropChart.title}
                  </h3>
                  <p className="text-xs text-agri-muted mb-4">
                    {(lang === 'mr' && topCropChart.question_answered_mr) ? topCropChart.question_answered_mr : topCropChart.question_answered}
                  </p>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCropChart.data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} Tonnes`, "Production"]} />
                        <Bar dataKey="value" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {topCropChart.insight && (
                  <p className="text-xs font-medium text-agri-dark bg-agri-light/60 p-3 rounded-xl border border-agri-leaf/30 mt-3">
                    💡 {topCropChart.insight}
                  </p>
                )}
              </div>
            )}

            {/* Annual Trend Line Chart */}
            {yearlyTrendChart && (
              <div className="bg-white rounded-3xl p-6 border border-agri-border shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-agri-dark mb-1">
                    {(lang === 'mr' && yearlyTrendChart.title_mr) ? yearlyTrendChart.title_mr : yearlyTrendChart.title}
                  </h3>
                  <p className="text-xs text-agri-muted mb-4">
                    {(lang === 'mr' && yearlyTrendChart.question_answered_mr) ? yearlyTrendChart.question_answered_mr : yearlyTrendChart.question_answered}
                  </p>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyTrendChart.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [Number(value).toLocaleString(), "Average"]} />
                        <Line type="monotone" dataKey="value" stroke="#1B5E20" strokeWidth={3} dot={{ r: 5, fill: '#2E7D32' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {yearlyTrendChart.insight && (
                  <p className="text-xs font-medium text-agri-dark bg-agri-light/60 p-3 rounded-xl border border-agri-leaf/30 mt-3">
                    📈 {yearlyTrendChart.insight}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* SECTION 4: Plain-Language Rainfall vs. Crop Yield Module with Collapsible Stats Details */}
          {rainfallData && rainfallData.available ? (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-agri-border shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-agri-dark flex items-center gap-2">
                    <CloudRain className="w-5 h-5 text-sky-600" />
                    <span>{t.farmer.rainfallImpactTitle}</span>
                  </h3>
                  <p className="text-xs text-agri-muted mt-0.5">
                    {t.farmer.rainfallImpactSubtitle}
                  </p>
                </div>

                {/* Plain language summary pill */}
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {rainfallData.relationship_strength || "Positive Association"}
                </span>
              </div>

              {/* Plain-Language Message Callout */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs sm:text-sm text-sky-950 leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-agri-dark">
                    "{rainfallData.statistical_interpretation}"
                  </p>
                  <p className="text-xs text-sky-800 mt-1">
                    {t.rainfall.nonCausalNote}
                  </p>
                </div>
              </div>

              {/* Scatter Plot */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" dataKey="rainfall" name={t.rainfall.xAxis} unit=" mm" tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="yield" name={t.rainfall.yAxis} unit=" kg/ha" tick={{ fontSize: 11 }} />
                    <ZAxis range={[50, 150]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-xl border border-agri-border shadow-lg text-xs space-y-1">
                              <p className="font-bold text-agri-dark">{d.crop} ({d.state})</p>
                              <p className="text-gray-600">Rainfall: <span className="font-semibold">{d.rainfall} mm</span></p>
                              <p className="text-gray-600">Yield: <span className="font-semibold">{d.yield?.toLocaleString()} kg/ha</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={rainfallData.scatter_data} fill="#2E7D32" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Optional Collapsible Technical Statistics Details for Curious Farmers/Teachers */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStatsDetails(!showStatsDetails)}
                  className="text-xs font-semibold text-agri-primary hover:text-agri-dark flex items-center gap-1.5 cursor-pointer py-1"
                >
                  {showStatsDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{showStatsDetails ? t.farmer.hideStatsDetails : t.farmer.viewStatsDetails}</span>
                </button>

                {showStatsDetails && (
                  <div className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
                    <div>
                      <span className="text-gray-500">Pearson r:</span>
                      <p className="font-mono font-bold text-agri-dark text-sm">r = {rainfallData.correlation_coefficient}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">p-value:</span>
                      <p className="font-mono font-bold text-agri-dark text-sm">{rainfallData.summary_stats?.p_value}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Trend Equation:</span>
                      <p className="font-mono font-bold text-agri-dark text-xs">y = {rainfallData.regression_line?.slope}x + {rainfallData.regression_line?.intercept}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Rainfall Range:</span>
                      <p className="font-bold text-agri-dark text-xs">{rainfallData.summary_stats?.min_rainfall} – {rainfallData.summary_stats?.max_rainfall} mm</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-agri-border shadow-xs text-center py-8">
              <CloudRain className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-agri-text">{t.rainfall.unavailableTitle}</h4>
              <p className="text-xs text-agri-muted max-w-md mx-auto mt-1">
                {rainfallData?.reason || t.farmer.noRainfallData}
              </p>
            </div>
          )}

          {/* SECTION 5: Regional Analysis & Interactive India Map */}
          {stateData && stateData.available && (
            <div>
              <IndiaMap stateAnalysisData={stateData} t={t} />
            </div>
          )}
        </>
      )}

    </div>
  );
}
