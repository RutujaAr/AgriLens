import React from 'react';
import { 
  BarChart3, UploadCloud, Database, Sprout, 
  PieChart, MapPin, FileText, CheckCircle2, 
  ShieldCheck, RefreshCw, Layers
} from 'lucide-react';

export default function DashboardView({ 
  profile, 
  t, 
  setCurrentView, 
  onExploreDemo,
  isDemoLoading = false,
  demoError = null
}) {
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl p-10 border border-agri-border shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-agri-light text-agri-primary flex items-center justify-center mx-auto mb-4 border border-agri-leaf/30">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-agri-text mb-2">
            {t.dashboard.title}
          </h2>
          <p className="text-sm text-agri-muted max-w-lg mx-auto mb-6">
            {t.dashboard.noDataset}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('upload')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-agri-dark text-white font-semibold text-sm hover:bg-agri-primary shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                  <RefreshCw className="w-4 h-4 text-agri-primary animate-spin" />
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

  const numVars = profile.columns?.filter(c => c.semantic_type === 'numerical')?.length || 0;
  const catVars = profile.columns?.filter(c => c.semantic_type === 'categorical')?.length || 0;
  const qScore = profile.quality_score || 0;
  const qBreakdown = profile.quality_breakdown || {};

  return (
    <div className="space-y-8 py-6">
      
      {/* Header with Dataset Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-border shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-agri-text">
              {profile.original_name}
            </h1>
            {profile.is_official_sample ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.dashboard.officialBadge}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                {t.dashboard.userUploadedBadge}
              </span>
            )}
            {profile.is_cleaned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.dashboard.cleanedBadge}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                {t.dashboard.rawBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-agri-muted">
            Format: <span className="uppercase font-semibold">{profile.file_type}</span> • Size: {(profile.file_size_bytes / 1024).toFixed(1)} KB
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!profile.is_cleaned && (
            <button
              onClick={() => setCurrentView('cleaning')}
              className="px-4 py-2 rounded-xl bg-agri-primary text-white font-medium text-xs hover:bg-agri-dark shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sprout className="w-4 h-4" />
              <span>{t.dashboard.cleanData}</span>
            </button>
          )}
          <button
            onClick={() => setCurrentView('report')}
            className="px-4 py-2 rounded-xl bg-white border border-agri-border text-agri-dark font-medium text-xs hover:bg-agri-light shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-agri-primary" />
            <span>{t.dashboard.viewReport}</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-agri-border shadow-xs">
          <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.dashboard.totalRecords}</span>
          <p className="text-2xl font-bold text-agri-text mt-1">{profile.row_count?.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-agri-border shadow-xs">
          <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.dashboard.totalColumns}</span>
          <p className="text-2xl font-bold text-agri-text mt-1">{profile.col_count}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-agri-border shadow-xs">
          <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.dashboard.missingCells}</span>
          <p className={`text-2xl font-bold mt-1 ${profile.missing_cells_total > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.missing_cells_total} <span className="text-xs font-normal">({profile.missing_cells_percentage}%)</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-agri-border shadow-xs">
          <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.dashboard.duplicateRows}</span>
          <p className={`text-2xl font-bold mt-1 ${profile.duplicate_rows_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.duplicate_rows_count}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-agri-border shadow-xs">
          <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.dashboard.numericalVars}</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{numVars}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-agri-border shadow-xs">
          <span className="text-[11px] font-semibold text-agri-muted uppercase tracking-wider">{t.dashboard.categoricalVars}</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{catVars}</p>
        </div>
      </div>

      {/* Data Quality Score Card */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div>
            <h3 className="text-lg font-bold text-agri-text flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-agri-primary" />
              {t.dashboard.qualityScoreTitle}
            </h3>
            <p className="text-xs text-agri-muted mt-0.5">
              Mathematically derived from dataset completeness, duplicate records, and invalid values.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-agri-dark">{qScore}%</span>
              <p className="text-[11px] font-medium text-emerald-700">
                {qScore >= 85 ? "Excellent Quality" : (qScore >= 70 ? "Good Quality" : "Needs Cleaning")}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-agri-leaf flex items-center justify-center bg-agri-light/60">
              <CheckCircle2 className="w-7 h-7 text-agri-primary" />
            </div>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Completeness Rating</span>
            <p className="text-lg font-bold text-agri-text mt-0.5">{qBreakdown.completeness_score || 100}%</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Penalized {qBreakdown.penalties?.missing_penalty || 0} pts for missing cells</p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Uniqueness Rating</span>
            <p className="text-lg font-bold text-agri-text mt-0.5">{qBreakdown.uniqueness_score || 100}%</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Penalized {qBreakdown.penalties?.duplicate_penalty || 0} pts for duplicate rows</p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Validity Rating</span>
            <p className="text-lg font-bold text-agri-text mt-0.5">{qBreakdown.validity_score || 100}%</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Penalized {qBreakdown.penalties?.invalid_penalty || 0} pts for out-of-bounds</p>
          </div>
        </div>

        {qBreakdown.explanation && (
          <p className="text-xs text-agri-muted mt-3 italic">
            Evaluation: {qBreakdown.explanation}
          </p>
        )}
      </div>

      {/* Pipeline Status Stepper */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-agri-primary" />
          {t.dashboard.pipelineTitle}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {t.dashboard.pipelineSteps.map((step, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between"
            >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-800">Step {idx + 1}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-emerald-950 leading-tight">
                  {step}
                </p>
              </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-base font-bold text-agri-text mb-3">
          {t.dashboard.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setCurrentView('inspect')}
            className="p-4 rounded-xl bg-white border border-agri-border hover:border-agri-leaf hover:bg-agri-light/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <Database className="w-5 h-5 text-agri-primary mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-agri-text">{t.dashboard.inspectData}</h4>
            <p className="text-[10px] text-agri-muted mt-0.5">Columns & types</p>
          </button>

          <button
            onClick={() => setCurrentView('cleaning')}
            className="p-4 rounded-xl bg-white border border-agri-border hover:border-agri-leaf hover:bg-agri-light/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <Sprout className="w-5 h-5 text-agri-leaf mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-agri-text">{t.dashboard.cleanData}</h4>
            <p className="text-[10px] text-agri-muted mt-0.5">Impute & deduplicate</p>
          </button>

          <button
            onClick={() => setCurrentView('eda')}
            className="p-4 rounded-xl bg-white border border-agri-border hover:border-agri-leaf hover:bg-agri-light/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-agri-text">{t.dashboard.viewEDA}</h4>
            <p className="text-[10px] text-agri-muted mt-0.5">Summary statistics</p>
          </button>

          <button
            onClick={() => setCurrentView('visualizations')}
            className="p-4 rounded-xl bg-white border border-agri-border hover:border-agri-leaf hover:bg-agri-light/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <PieChart className="w-5 h-5 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-agri-text">{t.nav.visualizations}</h4>
            <p className="text-[10px] text-agri-muted mt-0.5">Production & trends</p>
          </button>

          <button
            onClick={() => setCurrentView('states')}
            className="p-4 rounded-xl bg-white border border-agri-border hover:border-agri-leaf hover:bg-agri-light/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-agri-text">{t.dashboard.viewMap}</h4>
            <p className="text-[10px] text-agri-muted mt-0.5">Choropleth mapping</p>
          </button>

          <button
            onClick={() => setCurrentView('report')}
            className="p-4 rounded-xl bg-white border border-agri-border hover:border-agri-leaf hover:bg-agri-light/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-agri-text">{t.dashboard.viewReport}</h4>
            <p className="text-[10px] text-agri-muted mt-0.5">Printable summary</p>
          </button>
        </div>
      </div>

    </div>
  );
}
