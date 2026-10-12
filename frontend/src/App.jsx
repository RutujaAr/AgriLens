import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import LandingPage from './pages/LandingPage';
import DashboardView from './pages/DashboardView';
import FarmerDashboardView from './pages/FarmerDashboardView';
import UploadView from './pages/UploadView';
import InspectionView from './pages/InspectionView';
import CleaningView from './pages/CleaningView';
import EDAView from './pages/EDAView';
import VisualizationsView from './pages/VisualizationsView';
import RainfallYieldView from './pages/RainfallYieldView';
import StateAnalysisView from './pages/StateAnalysisView';
import InsightsView from './pages/InsightsView';
import ReportView from './pages/ReportView';
import DataSourcesView from './pages/DataSourcesView';
import { translations } from './i18n';
import { getCurrentUser, setCurrentUser, setAuthToken, api } from './api';

export default function App() {
  const [lang, setLang] = useState('en');
  const [user, setUser] = useState(() => getCurrentUser());
  const [guestRole, setGuestRole] = useState('farmer'); // 'farmer' or 'officer'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  const [activeProfile, setActiveProfile] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);

  const t = translations[lang] || translations.en;

  const effectiveRole = user?.role || guestRole;

  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
    setAuthToken(null);
    showToast(t.auth.logoutSuccess, "info");
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    showToast(`${t.auth.loginSuccess} (${authenticatedUser.role === 'officer' ? t.nav.roleOfficer : t.nav.roleFarmer})`, "success");
  };

  const handleSwitchRole = () => {
    if (user) {
      const nextRole = user.role === 'farmer' ? 'officer' : 'farmer';
      const updatedUser = { ...user, role: nextRole };
      setUser(updatedUser);
      setCurrentUser(updatedUser);
      showToast(`Active Mode: ${nextRole === 'officer' ? t.nav.roleOfficer : t.nav.roleFarmer}`, "info");
    } else {
      const nextRole = guestRole === 'farmer' ? 'officer' : 'farmer';
      setGuestRole(nextRole);
      showToast(`Active Mode: ${nextRole === 'officer' ? t.nav.roleOfficer : t.nav.roleFarmer}`, "info");
    }
  };

  const handleExploreDemo = async () => {
    setIsDemoLoading(true);
    setDemoError(null);
    showToast("Connecting to official agricultural dataset...", "info");
    try {
      const profile = await api.loadDemoDataset();
      setActiveProfile(profile);
      setCurrentView('dashboard');
      showToast("Official dataset loaded successfully!", "success");
    } catch (err) {
      console.error("Demo load failed:", err);
      const msg = err.message || "Failed to load demo dataset. Please try again.";
      setDemoError(msg);
      showToast(msg, "error");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleUploadSuccess = (profile) => {
    setActiveProfile(profile);
    setCurrentView(effectiveRole === 'officer' ? 'inspect' : 'dashboard');
    showToast("Dataset uploaded and profiled successfully!", "success");
  };

  const handleCleanSuccess = (updatedProfile) => {
    setActiveProfile(updatedProfile);
    showToast("Dataset cleaned successfully! Quality score updated.", "success");
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#F7FAF7] text-[#1F2937] ${lang === 'mr' ? 'font-marathi' : 'font-sans'}`}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            notification.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' :
            'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        lang={lang}
        setLang={setLang}
        t={t}
        user={user}
        activeRole={effectiveRole}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        hasActiveDataset={!!activeProfile}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {currentView === 'landing' && (
          <LandingPage 
            t={t} 
            onGetStarted={() => setCurrentView(activeProfile ? 'dashboard' : 'upload')} 
            onExploreDemo={handleExploreDemo}
            isDemoLoading={isDemoLoading}
            demoError={demoError}
          />
        )}

        {currentView === 'dashboard' && (
          effectiveRole === 'farmer' ? (
            <FarmerDashboardView
              profile={activeProfile}
              t={t}
              lang={lang}
              setCurrentView={setCurrentView}
              onExploreDemo={handleExploreDemo}
              isDemoLoading={isDemoLoading}
              demoError={demoError}
            />
          ) : (
            <DashboardView 
              profile={activeProfile} 
              t={t} 
              setCurrentView={setCurrentView} 
              onExploreDemo={handleExploreDemo}
              isDemoLoading={isDemoLoading}
              demoError={demoError}
            />
          )
        )}

        {currentView === 'upload' && (
          <UploadView 
            t={t} 
            onUploadSuccess={handleUploadSuccess} 
            onExploreDemo={handleExploreDemo} 
          />
        )}

        {currentView === 'inspect' && (
          <InspectionView 
            profile={activeProfile} 
            t={t} 
          />
        )}

        {currentView === 'cleaning' && (
          <CleaningView 
            profile={activeProfile} 
            onCleanSuccess={handleCleanSuccess} 
            t={t} 
          />
        )}

        {currentView === 'eda' && (
          <EDAView 
            profile={activeProfile} 
            t={t} 
          />
        )}

        {currentView === 'visualizations' && (
          <VisualizationsView 
            profile={activeProfile} 
            t={t} 
            lang={lang} 
          />
        )}

        {currentView === 'rainfall' && (
          <RainfallYieldView 
            profile={activeProfile} 
            t={t} 
            role={effectiveRole}
          />
        )}

        {currentView === 'states' && (
          <StateAnalysisView 
            profile={activeProfile} 
            t={t} 
          />
        )}

        {currentView === 'insights' && (
          <InsightsView 
            profile={activeProfile} 
            t={t} 
            lang={lang} 
          />
        )}

        {currentView === 'report' && (
          <ReportView 
            profile={activeProfile} 
            t={t} 
            lang={lang} 
            role={effectiveRole}
          />
        )}

        {currentView === 'sources' && (
          <DataSourcesView 
            t={t} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-agri-border bg-white py-6 text-xs text-agri-muted no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-agri-dark">
              AgriLens — Agricultural Data Analysis & Visualization
            </p>
            <p className="text-[11px] text-gray-500">
              B.Tech CSE Minor Project • Developed for authentic agricultural data science & policymaking
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setCurrentView('sources')} className="hover:text-agri-dark underline cursor-pointer">
              {t.nav.sources}
            </button>
            <span>•</span>
            <button onClick={handleSwitchRole} className="hover:text-agri-dark font-medium cursor-pointer">
              Mode: {effectiveRole === 'officer' ? `💼 ${t.nav.roleOfficer}` : `🌾 ${t.nav.roleFarmer}`} ({t.nav.switchRole})
            </button>
            <span>•</span>
            <button onClick={() => setLang(lang === 'en' ? 'mr' : 'en')} className="hover:text-agri-dark font-semibold cursor-pointer">
              {t.nav.switchLang}
            </button>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        t={t}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
