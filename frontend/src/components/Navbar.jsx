import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, Globe, User, LogOut, LogIn, Menu, X, 
  BarChart3, UploadCloud, Database, PieChart, 
  MapPin, Sparkles, FileText, Bookmark,
  ChevronDown, Lock, Layers
} from 'lucide-react';

export default function Navbar({ 
  lang, 
  setLang, 
  t, 
  user, 
  activeRole,
  onSwitchRole,
  onLogout, 
  onOpenAuth, 
  currentView, 
  setCurrentView,
  hasActiveDataset
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const effectiveRole = user?.role || activeRole || 'farmer';

  // Analytics sub-items for Officer
  const officerAnalyticsItems = [
    { id: 'inspect', label: t.nav.inspect, desc: "Schema, types & data profiling", icon: Database },
    { id: 'cleaning', label: t.nav.cleaning, desc: "Imputation & duplicate removal", icon: Sprout },
    { id: 'eda', label: t.nav.eda, desc: "Descriptive statistics & correlation", icon: BarChart3 },
    { id: 'visualizations', label: t.nav.visualizations, desc: "Production, area & trend charts", icon: PieChart },
    { id: 'states', label: t.nav.states, desc: "Geographical India state analysis", icon: MapPin },
    { id: 'insights', label: t.nav.insights, desc: "Automated statistical takeaways", icon: Sparkles },
  ];

  // Analytics sub-items for Farmer
  const farmerAnalyticsItems = [
    { id: 'visualizations', label: t.nav.visualizations, desc: "Production & crop distribution", icon: PieChart },
    { id: 'states', label: t.nav.states, desc: "Major crop producing states", icon: MapPin },
    { id: 'insights', label: t.nav.insights, desc: "Clear agricultural recommendations", icon: Sparkles },
  ];

  const currentAnalyticsItems = effectiveRole === 'officer' ? officerAnalyticsItems : farmerAnalyticsItems;
  const isAnalyticsActive = currentAnalyticsItems.some(item => item.id === currentView);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAnalyticsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (viewId, requiresData = false) => {
    if (requiresData && !hasActiveDataset) {
      return;
    }
    setCurrentView(viewId);
    setMobileMenuOpen(false);
    setAnalyticsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-agri-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
            onClick={() => handleNavClick('landing')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-agri-dark">
                  {t.appName}
                </span>
                <span className={`text-[10px] tracking-wide px-1.5 py-0.5 rounded font-bold border leading-none ${
                  effectiveRole === 'officer' 
                    ? 'bg-amber-50 text-amber-900 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  {effectiveRole === 'officer' ? `💼 ${t.nav.roleOfficer}` : `🌾 ${t.nav.roleFarmer}`}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 hidden xl:block leading-tight font-medium">
                {lang === 'mr' ? 'कृषी डेटा विश्लेषण आणि दृश्यांकन' : 'Agri Analytics & Insights'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {effectiveRole === 'officer' ? <BarChart3 className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
              <span>{t.nav.dashboard}</span>
            </button>

            {/* 2. Upload */}
            <button
              onClick={() => handleNavClick('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'upload'
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{t.nav.upload}</span>
            </button>

            {/* 3. Analytics & Exploration (Grouped Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAnalyticsDropdownOpen(!analyticsDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isAnalyticsActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title="View analytical & inspection modules"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.nav.analyticsMenu}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${analyticsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Analytics Dropdown Menu */}
              {analyticsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-gray-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                    <span>{effectiveRole === 'officer' ? 'Officer Analytics Suite' : 'Farmer Insights Suite'}</span>
                    {!hasActiveDataset && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        No Dataset Active
                      </span>
                    )}
                  </div>

                  <div className="p-1 space-y-0.5">
                    {currentAnalyticsItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentView === item.id;
                      const requiresActive = !hasActiveDataset;

                      return (
                        <button
                          key={item.id}
                          disabled={requiresActive}
                          onClick={() => handleNavClick(item.id, true)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                            requiresActive
                              ? 'opacity-50 cursor-not-allowed bg-gray-50/50 text-gray-400'
                              : isItemActive
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 cursor-pointer'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer'
                          }`}
                          title={requiresActive ? "Load or upload a dataset first to unlock this module" : item.desc}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            requiresActive ? 'bg-gray-100 text-gray-400' : isItemActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold truncate">{item.label}</span>
                              {requiresActive && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 font-normal">
                                  <Lock className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5 font-normal">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Report */}
            <button
              disabled={!hasActiveDataset}
              onClick={() => handleNavClick('report', true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !hasActiveDataset
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : currentView === 'report'
                  ? 'bg-agri-primary text-white shadow-xs cursor-pointer'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
              }`}
              title={!hasActiveDataset ? "Load or upload a dataset first to generate the report" : "View final summary report"}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.nav.report}</span>
              {!hasActiveDataset && <Lock className="w-2.5 h-2.5 ml-0.5 text-gray-400" />}
            </button>

            {/* 5. Data Sources */}
            <button
              onClick={() => handleNavClick('sources')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'sources'
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t.nav.sources}</span>
            </button>
          </nav>

          {/* Right Controls: Role Switcher, Language & Account */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Role Switcher Pill */}
            <button
              onClick={onSwitchRole}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                effectiveRole === 'officer'
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
              title={`Switch active role (currently ${effectiveRole === 'officer' ? 'Officer' : 'Farmer'})`}
            >
              <span>{effectiveRole === 'officer' ? '💼' : '🌾'}</span>
              <span className="hidden sm:inline">
                {effectiveRole === 'officer' ? t.nav.viewAsFarmer : t.nav.viewAsOfficer}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
              title="Toggle English / मराठी"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.nav.switchLang}</span>
            </button>

            {/* User Session or Sign In */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-gray-200">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-semibold text-emerald-950 capitalize max-w-[80px] truncate">{user.username}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title={t.nav.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-agri-dark text-white hover:bg-agri-primary shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Active Mode Banner */}
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-gray-500">Mode:</span>
              <span className="font-bold text-gray-800">
                {effectiveRole === 'officer' ? `💼 ${t.nav.roleOfficer}` : `🌾 ${t.nav.roleFarmer}`}
              </span>
            </div>
            <button
              onClick={() => { onSwitchRole(); setMobileMenuOpen(false); }}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-gray-800 shadow-2xs hover:bg-gray-50 cursor-pointer"
            >
              {t.nav.switchRole}
            </button>
          </div>

          {/* Quick Core Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
              General
            </div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-semibold transition-colors cursor-pointer ${
                currentView === 'dashboard' ? 'bg-agri-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {effectiveRole === 'officer' ? <BarChart3 className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
              <span>{t.nav.dashboard}</span>
            </button>
            <button
              onClick={() => handleNavClick('upload')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-semibold transition-colors cursor-pointer ${
                currentView === 'upload' ? 'bg-agri-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t.nav.upload}</span>
            </button>
          </div>

          {/* Analytics Modules */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center justify-between">
              <span>{t.nav.analyticsMenu}</span>
              {!hasActiveDataset && (
                <span className="text-[9px] text-amber-700 font-normal">Requires Dataset</span>
              )}
            </div>
            {currentAnalyticsItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = currentView === item.id;
              const requiresActive = !hasActiveDataset;
              return (
                <button
                  key={item.id}
                  disabled={requiresActive}
                  onClick={() => handleNavClick(item.id, true)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-semibold transition-colors ${
                    requiresActive
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : isItemActive
                      ? 'bg-agri-primary text-white cursor-pointer'
                      : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {requiresActive && <Lock className="w-3 h-3 text-gray-400" />}
                </button>
              );
            })}
          </div>

          {/* Reports & Sources */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <button
              disabled={!hasActiveDataset}
              onClick={() => handleNavClick('report', true)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-semibold transition-colors ${
                !hasActiveDataset
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : currentView === 'report'
                  ? 'bg-agri-primary text-white cursor-pointer'
                  : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>{t.nav.report}</span>
              </div>
              {!hasActiveDataset && <Lock className="w-3 h-3 text-gray-400" />}
            </button>
            <button
              onClick={() => handleNavClick('sources')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl font-semibold transition-colors cursor-pointer ${
                currentView === 'sources' ? 'bg-agri-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{t.nav.sources}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
