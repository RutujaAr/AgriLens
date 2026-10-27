import React, { useState, useEffect } from 'react';
import { 
  Sprout, CloudRain, MapPin, Sparkles, 
  UploadCloud, ShieldCheck, CheckCircle2, 
  Loader2, Printer
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { api } from '../api';
import IndiaMap from '../components/IndiaMap';

export default function FarmerDashboardView({ 
  profile, 
  t, 
  lang, 
  setCurrentView, 
  onExploreDemo,
  isDemoLoading = false,
  demoError = null
}) {
  const [loading, setLoading] = useState(true);
  const [vizData, setVizData] = useState(null);
  const [edaData, setEdaData] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchFarmerData = async () => {
      setLoading(true);
      try {
        const [viz, eda, st, ins] = await Promise.all([
          api.getVisualizations(profile.id).catch(() => null),
          api.getEDA(profile.id).catch(() => null),
          api.getStateAnalysis(profile.id).catch(() => null),
          api.getInsights(profile.id).catch(() => null)
        ]);
        setVizData(viz);
        setEdaData(eda);
        setStateData(st);
        setInsightsData(ins);
      } catch (err) {
        console.error("Error loading farmer view data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmerData();
  }, [profile, profile?.id, profile?.is_cleaned]);

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
              disabled={isDemoLoading}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl border font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDemoLoading
                  ? 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white border-agri-primary text-agri-dark hover:bg-agri-light'
              }`}
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-agri-primary animate-spin" />
                  <span>Loading Official Dataset...</span>
                </>
              ) : (
                <>
                  <Sprout className="w-4 h-4 text-agri-primary" />
                  <span>{t.landing.btnDemo}</span>
                </>
              )}
            </button>
          </div>

          {demoError && (
            <div className="mt-5 max-w-md mx-auto p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 text-left">
              <span>{demoError}</span>
              <button
                onClick={onExploreDemo}
                disabled={isDemoLoading}
                className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-[11px] shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const charts = vizData?.charts || [];
  const topCropChart = charts.find(c => c.id === 'crop_production_bar');
  const yearlyTrendChart = charts.find(c => c.id === 'yearly_trend_line');
  const insights = insightsData?.insights || [];

  let avgYield = null;
  let avgRainfall = null;
  if (edaData?.numerical_stats) {
    for (const [colName, stats] of Object.entries(edaData.numerical_stats)) {
      if (stats.variable_role === 'yield') {
        avgYield = stats.mean;
      } else if (avgYield === null && /yield/i.test(colName)) {
        avgYield = stats.mean;
      }
      if (stats.variable_role === 'rainfall') {
        avgRainfall = stats.mean;
      } else if (avgRainfall === null && /rain/i.test(colName)) {
        avgRainfall = stats.mean;
      }
    }
  }

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
                  {avgYield != null ? `${avgYield.toLocaleString()} kg/ha` : "N/A"}
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
                  {avgRainfall != null ? `${avgRainfall} mm` : "N/A"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {avgRainfall != null ? t.farmer.rainfallRecorded : t.farmer.notRecorded}
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

          {/* SECTION 4: Regional Analysis & Interactive India Map */}
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
