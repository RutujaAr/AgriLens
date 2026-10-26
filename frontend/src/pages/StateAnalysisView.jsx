import React, { useState, useEffect } from 'react';
import { 
  MapPin, Filter, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Loader2, Table 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { api } from '../api';
import IndiaMap from '../components/IndiaMap';
import EmptyDatasetState from '../components/EmptyDatasetState';

export default function StateAnalysisView({ profile, t, onExploreDemo, isDemoLoading = false, setCurrentView }) {
  if (!profile) {
    return (
      <EmptyDatasetState 
        title="State-wise Agricultural Analysis"
        subtitle="Please load or upload a dataset to explore state productivity rankings, regional maps, and zone aggregations."
        onExploreDemo={onExploreDemo}
        isDemoLoading={isDemoLoading}
        setCurrentView={setCurrentView}
      />
    );
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchStates = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.getStateAnalysis(profile.id);
        setData(resp);
      } catch (err) {
        setError(err.message || "Failed to load state-wise analysis.");
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, [profile?.id, profile?.is_cleaned]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-agri-muted">Aggregating state-level agricultural observations...</p>
      </div>
    );
  }

  if (error || !data || !data.available) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-agri-border shadow-xs">
          <MapPin className="w-12 h-12 text-agri-muted mx-auto mb-3 opacity-60" />
          <h2 className="text-lg font-bold text-agri-text mb-2">
            {t.states.unavailableTitle}
          </h2>
          <p className="text-xs text-agri-muted leading-relaxed">
            {data?.reason || "State-wise analysis is unavailable because this dataset does not contain recognizable state or geographic information."}
          </p>
        </div>
      </div>
    );
  }

  const summaries = data.state_summaries || [];
  const topStates = data.top_producing_states || [];
  const lowestStates = data.lowest_producing_states || [];

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
          <MapPin className="w-6 h-6 text-agri-primary" />
          <span>{t.states.title}</span>
        </h1>
        <p className="text-xs text-agri-muted mt-1">
          {t.states.subtitle}
        </p>
      </div>

      {/* Embedded Interactive India Map */}
      <IndiaMap stateAnalysisData={data} t={t} />

      {/* Top vs Lowest Producing States Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Producing States */}
        <div className="bg-white rounded-2xl p-5 border border-agri-border shadow-xs">
          <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>{t.states.topStates}</span>
          </h3>
          <div className="space-y-2">
            {topStates.map((st, i) => (
              <div 
                key={st.state}
                className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-agri-dark">#{i+1} {st.state}</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">Top Crop: {st.top_crop}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-950">{st.total_production?.toLocaleString()} T</span>
                  <p className="text-[10px] text-gray-500">Yield: {st.avg_yield?.toLocaleString()} kg/ha</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Producing States */}
        <div className="bg-white rounded-2xl p-5 border border-agri-border shadow-xs">
          <h3 className="text-sm font-bold text-agri-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
            <span>{t.states.lowestStates}</span>
          </h3>
          <div className="space-y-2">
            {lowestStates.map((st, i) => (
              <div 
                key={st.state}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-agri-dark">{st.state}</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">Top Crop: {st.top_crop}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-950">{st.total_production?.toLocaleString()} T</span>
                  <p className="text-[10px] text-gray-500">Yield: {st.avg_yield?.toLocaleString()} kg/ha</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Complete State Comparison Table */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
          <Table className="w-5 h-5 text-agri-primary" />
          <span>{t.states.stateTable}</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-agri-border">
          <table className="min-w-full text-xs text-left divide-y divide-gray-200">
            <thead className="bg-[#F8FAF9] text-agri-dark font-semibold">
              <tr>
                <th className="px-4 py-2.5">{t.states.state}</th>
                <th className="px-4 py-2.5">{t.states.zone}</th>
                <th className="px-4 py-2.5">{t.states.production}</th>
                <th className="px-4 py-2.5">{t.states.yield}</th>
                <th className="px-4 py-2.5">{t.states.rainfall}</th>
                <th className="px-4 py-2.5">{t.states.topCrop}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {summaries.map((s) => (
                <tr key={s.state} className="hover:bg-agri-light/30 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-agri-dark">{s.state}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.zone}</td>
                  <td className="px-4 py-2.5 font-semibold text-agri-text">{s.total_production?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700">{s.avg_yield?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700">{s.avg_rainfall?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-medium text-agri-primary">{s.top_crop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
