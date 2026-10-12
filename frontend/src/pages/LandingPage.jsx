import React from 'react';
import { 
  Sprout, UploadCloud, BarChart3, CloudRain, 
  MapPin, Sparkles, ShieldCheck, ArrowRight, 
  Layers, Globe2, Compass, Award, Loader2
} from 'lucide-react';

export default function LandingPage({ t, onGetStarted, onExploreDemo, isDemoLoading = false, demoError = null }) {
  const steps = [
    { num: "01", title: t.landing.step1Title, desc: t.landing.step1Desc, icon: UploadCloud, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { num: "02", title: t.landing.step2Title, desc: t.landing.step2Desc, icon: Layers, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { num: "03", title: t.landing.step3Title, desc: t.landing.step3Desc, icon: BarChart3, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { num: "04", title: t.landing.step4Title, desc: t.landing.step4Desc, icon: MapPin, color: "bg-purple-50 text-purple-700 border-purple-200" },
    { num: "05", title: t.landing.step5Title, desc: t.landing.step5Desc, icon: Sparkles, color: "bg-green-50 text-green-700 border-green-200" },
  ];

  const capabilities = [
    { title: t.landing.cap1, desc: t.landing.cap1Desc, icon: Layers },
    { title: t.landing.cap2, desc: t.landing.cap2Desc, icon: Award },
    { title: t.landing.cap3, desc: t.landing.cap3Desc, icon: BarChart3 },
    { title: t.landing.cap4, desc: t.landing.cap4Desc, icon: CloudRain },
    { title: t.landing.cap5, desc: t.landing.cap5Desc, icon: MapPin },
    { title: t.landing.cap6, desc: t.landing.cap6Desc, icon: Globe2 },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-agri-light/30 to-[#F0F7F0] border border-agri-border p-8 sm:p-12 lg:p-16 text-center shadow-sm">
        
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-agri-leaf/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-agri-gold/15 blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-agri-leaf/30 shadow-xs text-xs font-semibold text-agri-dark mb-6">
          <Sprout className="w-4 h-4 text-agri-leaf" />
          <span>{t.landing.heroBadge}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-agri-text max-w-4xl mx-auto leading-tight sm:leading-tight">
          {t.landing.heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-agri-muted max-w-2xl mx-auto leading-relaxed">
          {t.landing.heroSubtitle}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-agri-dark text-white font-semibold text-sm hover:bg-agri-primary shadow-lg shadow-agri-dark/20 hover:shadow-agri-dark/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{t.landing.btnGetStarted}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onExploreDemo}
            disabled={isDemoLoading}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isDemoLoading
                ? 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white border-agri-primary text-agri-dark hover:bg-agri-light hover:border-agri-dark'
            }`}
          >
            {isDemoLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-agri-primary animate-spin" />
                <span>Loading Official Dataset...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-agri-primary" />
                <span>{t.landing.btnDemo}</span>
              </>
            )}
          </button>
        </div>

        {/* Error notification banner if demo loading failed */}
        {demoError && (
          <div className="mt-4 max-w-md mx-auto p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 text-left">
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

        {/* Demo Subtitle Note */}
        <p className="mt-3 text-xs text-agri-muted font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-agri-leaf" />
          <span>{t.landing.demoSubtitle}</span>
        </p>

        {/* Core Analytical Workflow Pillars */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-agri-border bg-white p-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Workflow 01</span>
                <p className="text-sm font-bold text-emerald-950 mt-1">Automated Data Inspection</p>
                <p className="text-[11px] text-emerald-700 mt-1 leading-snug">
                  Instant profiling of columns, null counts, data types & quality score.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Workflow 02</span>
                <p className="text-sm font-bold text-amber-950 mt-1">Data Cleaning & Quality Checks</p>
                <p className="text-[11px] text-amber-700 mt-1 leading-snug">
                  Duplicate removal, null imputation & raw vs. cleaned comparison audit.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Workflow 03</span>
                <p className="text-sm font-bold text-blue-950 mt-1">Interactive Visualizations</p>
                <p className="text-[11px] text-blue-700 mt-1 leading-snug">
                  Dynamic production distribution, yield trends & seasonal crop breakdowns.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Workflow 04</span>
                <p className="text-sm font-bold text-purple-950 mt-1">Rainfall, Yield & State Analysis</p>
                <p className="text-[11px] text-purple-700 mt-1 leading-snug">
                  Pearson statistical correlation & geographic state ranking when supported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-agri-text">
            {t.landing.howItWorksTitle}
          </h2>
          <p className="text-sm text-agri-muted mt-2">
            {t.landing.howItWorksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div 
                key={st.num}
                className="bg-white rounded-2xl p-5 border border-agri-border shadow-xs hover:border-agri-leaf hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-agri-light text-agri-dark border border-agri-leaf/20">
                      {st.num}
                    </span>
                    <div className={`p-2 rounded-xl border ${st.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-agri-text mb-1">
                    {st.title}
                  </h3>
                  <p className="text-xs text-agri-muted leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Capabilities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-agri-text">
            {t.landing.capabilitiesTitle}
          </h2>
          <p className="text-sm text-agri-muted mt-2">
            {t.landing.capabilitiesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs hover:border-agri-leaf hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-agri-light text-agri-primary border border-agri-leaf/20 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-agri-text mb-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-agri-muted leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trusted Data Sources Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-agri-dark to-agri-primary text-white rounded-3xl p-8 sm:p-12 shadow-lg">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-agri-gold mb-4 border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authentic Government Data Sourcing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t.landing.trustedSourcesTitle}
            </h2>
            <p className="text-sm text-green-100 leading-relaxed mb-6">
              {t.landing.trustedSourcesDesc}
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium border border-white/15">
                🏛️ Directorate of Economics & Statistics (DES)
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium border border-white/15">
                🌦️ India Meteorological Department (IMD)
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium border border-white/15">
                🌾 Indian Council of Agricultural Research (ICAR)
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium border border-white/15">
                🇮🇳 data.gov.in Open Data Platform
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
