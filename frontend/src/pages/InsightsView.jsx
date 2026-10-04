import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, TrendingUp, CloudRain, 
  MapPin, ShieldCheck, Loader2 
} from 'lucide-react';
import { api } from '../api';

export default function InsightsView({ profile, t, lang }) {
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.getInsights(profile.id);
        setInsightsData(resp);
      } catch (err) {
        setError(err.message || "Failed to generate agricultural insights.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [profile?.id, profile?.is_cleaned]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-agri-muted">Synthesizing dataset-derived agricultural insights...</p>
      </div>
    );
  }

  if (error || !insightsData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        {error || "Unable to display insights."}
      </div>
    );
  }

  const insights = insightsData.insights || [];

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'production': return TrendingUp;
      case 'rainfall': return CloudRain;
      case 'geography': return MapPin;
      case 'quality': return ShieldCheck;
      default: return Sparkles;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'production': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'rainfall': return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'geography': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'quality': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-agri-primary" />
          <span>{t.insights.title}</span>
        </h1>
        <p className="text-xs text-agri-muted mt-1">
          {t.insights.subtitle}
        </p>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {insights.map((item) => {
          const Icon = getCategoryIcon(item.category);
          const colorClass = getCategoryColor(item.category);
          const title = (lang === 'mr' && item.title_mr) ? item.title_mr : item.title;
          const description = (lang === 'mr' && item.description_mr) ? item.description_mr : item.description;

          return (
            <div 
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs hover:border-agri-leaf hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${colorClass} flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />
                    <span>{item.category}</span>
                  </span>
                  
                  {/* Metric Pill */}
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-agri-dark border border-gray-200">
                    {item.metric_label}: {item.metric_value}
                  </span>
                </div>

                <h3 className="text-base font-bold text-agri-dark mb-2">
                  {title}
                </h3>
                <p className="text-xs text-agri-text leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-agri-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-agri-leaf" />
                <span>Computed directly from dataset facts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
