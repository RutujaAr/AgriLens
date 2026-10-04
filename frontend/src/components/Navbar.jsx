import React, { useState } from 'react';
import { 
  Sprout, Globe, User, LogOut, LogIn, Menu, X, 
  BarChart3, UploadCloud, Database, PieChart, 
  CloudRain, MapPin, Sparkles, FileText, Bookmark
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

  const effectiveRole = user?.role || activeRole || 'farmer';

  const farmerNavItems = [
    { id: 'dashboard', label: t.nav.farmerDashboard, icon: Sprout, requiresData: false },
    { id: 'upload', label: t.nav.upload, icon: UploadCloud, requiresData: false },
    { id: 'visualizations', label: t.nav.visualizations, icon: PieChart, requiresData: true },
    { id: 'rainfall', label: t.nav.rainfallYield, icon: CloudRain, requiresData: true },
    { id: 'states', label: t.nav.states, icon: MapPin, requiresData: true },
    { id: 'insights', label: t.nav.insights, icon: Sparkles, requiresData: true },
    { id: 'report', label: t.nav.farmerReport, icon: FileText, requiresData: true },
    { id: 'sources', label: t.nav.sources, icon: Bookmark, requiresData: false },
  ];

  const officerNavItems = [
    { id: 'dashboard', label: t.nav.officerDashboard, icon: BarChart3, requiresData: false },
    { id: 'upload', label: t.nav.upload, icon: UploadCloud, requiresData: false },
    { id: 'inspect', label: t.nav.inspect, icon: Database, requiresData: true },
    { id: 'cleaning', label: t.nav.cleaning, icon: Sprout, requiresData: true },
    { id: 'eda', label: t.nav.eda, icon: BarChart3, requiresData: true },
    { id: 'visualizations', label: t.nav.visualizations, icon: PieChart, requiresData: true },
    { id: 'rainfall', label: t.nav.rainfallYield, icon: CloudRain, requiresData: true },
    { id: 'states', label: t.nav.states, icon: MapPin, requiresData: true },
    { id: 'insights', label: t.nav.insights, icon: Sparkles, requiresData: true },
    { id: 'report', label: t.nav.officerReport, icon: FileText, requiresData: true },
    { id: 'sources', label: t.nav.sources, icon: Bookmark, requiresData: false },
  ];

  const navItems = effectiveRole === 'farmer' ? farmerNavItems : officerNavItems;

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-agri-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => handleNavClick('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-agri-dark to-agri-leaf flex items-center justify-center text-white shadow-md shadow-agri-primary/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-agri-text flex items-center gap-1.5">
                {t.appName}
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold border ${
                  effectiveRole === 'officer' 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {effectiveRole === 'officer' ? `💼 ${t.nav.roleOfficer}` : `🌾 ${t.nav.roleFarmer}`}
                </span>
              </span>
              <p className="text-[11px] text-agri-muted hidden sm:block leading-none">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isDisabled = item.requiresData && !hasActiveDataset;

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && handleNavClick(item.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive 
                      ? 'bg-agri-primary text-white shadow-sm' 
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-agri-text hover:bg-agri-light hover:text-agri-dark'
                  }`}
                  title={isDisabled ? "Please upload or load a dataset first" : item.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Role Switcher, Language & User */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Role Toggle (For effortless presentation & testing) */}
            <button
              onClick={onSwitchRole}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow-xs cursor-pointer ${
                effectiveRole === 'officer'
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
              title={`Switch to ${effectiveRole === 'officer' ? 'Farmer Mode' : 'Officer Mode'}`}
            >
              <span>{effectiveRole === 'officer' ? '💼' : '🌾'}</span>
              <span className="hidden sm:inline">
                {effectiveRole === 'officer' ? t.nav.viewAsFarmer : t.nav.viewAsOfficer}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-agri-border bg-white text-agri-dark hover:border-agri-leaf hover:bg-agri-light transition-all shadow-xs cursor-pointer"
              title="Toggle English / मराठी"
            >
              <Globe className="w-3.5 h-3.5 text-agri-leaf" />
              <span>{t.nav.switchLang}</span>
            </button>

            {/* User Session */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-agri-light border border-agri-leaf/30 text-xs">
                  <User className="w-3.5 h-3.5 text-agri-primary" />
                  <span className="font-medium text-agri-dark capitalize">{user.username}</span>
                  <span className={`text-[10px] px-1 rounded uppercase font-bold ${
                    user.role === 'officer' ? 'bg-amber-100 text-amber-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {user.role === 'officer' ? t.nav.roleOfficer : t.nav.roleFarmer}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title={t.nav.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-agri-dark text-white hover:bg-agri-primary shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-agri-text hover:bg-agri-light rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-agri-border bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-agri-muted">Active Mode:</span>
            <button
              onClick={() => { onSwitchRole(); setMobileMenuOpen(false); }}
              className="text-xs font-bold px-2 py-1 rounded bg-agri-light text-agri-dark border border-agri-leaf"
            >
              {effectiveRole === 'officer' ? `💼 ${t.nav.roleOfficer}` : `🌾 ${t.nav.roleFarmer}`} ({t.nav.switchRole})
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isDisabled = item.requiresData && !hasActiveDataset;

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && handleNavClick(item.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-agri-primary text-white font-semibold' 
                    : isDisabled
                    ? 'text-gray-300'
                    : 'text-agri-text hover:bg-agri-light'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
