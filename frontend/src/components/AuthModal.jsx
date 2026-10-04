import React, { useState } from 'react';
import { X, User, Lock, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../api';

export default function AuthModal({ isOpen, onClose, t, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('officer'); // 'officer' or 'farmer'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let resp;
      if (isRegister) {
        resp = await api.register({ username, email, password, role });
      } else {
        resp = await api.login({ username_or_email: username, password });
      }

      setAuthToken(resp.access_token);
      setCurrentUser(resp.user);
      onAuthSuccess(resp.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoRole) => {
    setError(null);
    setLoading(true);
    try {
      const creds = demoRole === 'officer' 
        ? { username_or_email: 'officer', password: 'officer123' }
        : { username_or_email: 'farmer', password: 'farmer123' };

      const resp = await api.login(creds);
      setAuthToken(resp.access_token);
      setCurrentUser(resp.user);
      onAuthSuccess(resp.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed demo login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-agri-border animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-agri-dark to-agri-primary text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-agri-gold" />
              {isRegister ? t.auth.registerTitle : t.auth.signInTitle}
            </h3>
            <p className="text-xs text-green-100 mt-0.5">
              {t.appName} — {t.tagline}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Fill Buttons (For effortless Viva / Presentation) */}
        <div className="bg-agri-light/60 border-b border-agri-border px-5 py-3">
          <p className="text-[11px] font-semibold text-agri-dark mb-1.5 uppercase tracking-wider">
            {t.auth.quickDemo}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('officer')}
              className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-agri-primary bg-white text-agri-dark hover:bg-agri-primary hover:text-white transition-all shadow-xs"
            >
              💼 {t.auth.loginAsOfficer}
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('farmer')}
              className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-agri-leaf bg-white text-agri-dark hover:bg-agri-leaf hover:text-white transition-all shadow-xs"
            >
              🌾 {t.auth.loginAsFarmer}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-agri-text mb-1">
              {t.auth.username}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. officer or farmer"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-agri-text mb-1">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-agri-text mb-1">
              {t.auth.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
              />
            </div>
          </div>

          {/* Role Selection for Registration */}
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-agri-text mb-1.5">
                {t.auth.roleLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => setRole('farmer')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    role === 'farmer' 
                      ? 'border-agri-leaf bg-agri-light text-agri-dark font-semibold' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-bold">🌾 {t.nav.roleFarmer}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{t.auth.roleFarmerDesc}</p>
                </div>
                <div 
                  onClick={() => setRole('officer')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    role === 'officer' 
                      ? 'border-agri-primary bg-agri-light text-agri-dark font-semibold' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-bold">💼 {t.nav.roleOfficer}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{t.auth.roleOfficerDesc}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-agri-dark hover:bg-agri-primary text-white font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isRegister ? t.auth.registerBtn : t.auth.signInBtn}</span>
          </button>
        </form>

        {/* Footer switch */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600">
            {isRegister ? t.auth.haveAccount : t.auth.noAccount}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-agri-primary hover:text-agri-dark font-semibold ml-1 underline"
            >
              {isRegister ? t.auth.signInBtn : t.auth.registerBtn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
