import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Layers, TrendingUp, Grid, 
  HelpCircle, AlertCircle, Loader2, ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { api } from '../api';
import EmptyDatasetState from '../components/EmptyDatasetState';

export default function EDAView({ profile, t, onExploreDemo, isDemoLoading = false, setCurrentView }) {
  if (!profile) {
    return (
      <EmptyDatasetState 
        title="Exploratory Data Analysis"
        subtitle="Please load or upload a dataset to compute numerical statistics, category distributions, and feature correlations."
        onExploreDemo={onExploreDemo}
        isDemoLoading={isDemoLoading}
        setCurrentView={setCurrentView}
      />
    );
  }

  const [activeTab, setActiveTab] = useState('numerical'); // 'numerical', 'distributions', 'categorical', 'correlation'
  const [edaData, setEdaData] = useState(null);
  const [corrData, setCorrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [edaResp, corrResp] = await Promise.all([
          api.getEDA(profile.id),
          api.getCorrelations(profile.id)
        ]);
        setEdaData(edaResp);
        setCorrData(corrResp);
      } catch (err) {
        setError(err.message || "Failed to load exploratory data analysis.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [profile?.id, profile?.is_cleaned]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-agri-muted">Computing exploratory statistics...</p>
      </div>
    );
  }

  if (error || !edaData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        {error || "Unable to display EDA."}
      </div>
    );
  }

  const numStats = edaData.numerical_stats || {};
  const catStats = edaData.categorical_stats || {};
  const distributions = edaData.distributions || {};

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-agri-primary" />
          <span>{t.eda.title}</span>
        </h1>
        <p className="text-xs text-agri-muted mt-1">
          {t.eda.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        {[
          { id: 'numerical', label: t.eda.numericalTab },
          { id: 'distributions', label: t.eda.distributionsTab },
          { id: 'categorical', label: t.eda.categoricalTab },
          { id: 'correlation', label: t.eda.correlationTab },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-agri-primary text-agri-dark'
                : 'border-transparent text-gray-500 hover:text-agri-text hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Numerical Statistics Table */}
      {activeTab === 'numerical' && (
        <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
          <div className="overflow-x-auto rounded-xl border border-agri-border">
            <table className="min-w-full text-xs text-left divide-y divide-gray-200">
              <thead className="bg-[#F8FAF9] text-agri-dark font-semibold">
                <tr>
                  <th className="px-3 py-2.5">{t.eda.col}</th>
                  <th className="px-3 py-2.5">{t.eda.count}</th>
                  <th className="px-3 py-2.5">{t.eda.mean}</th>
                  <th className="px-3 py-2.5">{t.eda.median}</th>
                  <th className="px-3 py-2.5">{t.eda.std}</th>
                  <th className="px-3 py-2.5">{t.eda.min}</th>
                  <th className="px-3 py-2.5">{t.eda.q25}</th>
                  <th className="px-3 py-2.5">{t.eda.q75}</th>
                  <th className="px-3 py-2.5">{t.eda.max}</th>
                  <th className="px-3 py-2.5">{t.eda.skewness}</th>
                  <th className="px-3 py-2.5">{t.eda.outliers}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {Object.entries(numStats).map(([colName, s]) => (
                  <tr key={colName} className="hover:bg-agri-light/30 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-agri-dark whitespace-nowrap">
                      {colName}
                      {s.variable_role && (
                        <span className="block text-[10px] text-agri-primary font-normal">
                          ({s.variable_role})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{s.count}</td>
                    <td className="px-3 py-2.5 font-medium text-agri-text">{s.mean?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-semibold text-agri-dark">{s.median?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.std?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.min?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.q25?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.q75?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.max?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-600">{s.skewness}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.outlier_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {s.outlier_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Distributions */}
      {activeTab === 'distributions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(distributions).map(([colName, bins]) => (
            <div key={colName} className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
              <h4 className="text-sm font-bold text-agri-dark mb-1">{colName}</h4>
              <p className="text-[11px] text-agri-muted mb-4">Frequency across value intervals</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 9 }} 
                      angle={-25} 
                      textAnchor="end" 
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(val) => [`${val} records`, 'Frequency']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Categorical Features */}
      {activeTab === 'categorical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(catStats).map(([colName, info]) => (
            <div key={colName} className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
              <div className="flex justify-between items-baseline mb-3">
                <h4 className="text-sm font-bold text-agri-dark">{colName}</h4>
                <span className="text-xs text-agri-muted">
                  {info.unique_count} Unique Categories
                </span>
              </div>
              <div className="space-y-2">
                {info.top_categories?.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-agri-text">{cat.label}</span>
                      <span className="font-semibold text-agri-dark">{cat.count} records</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-agri-leaf h-2 rounded-full"
                        style={{ width: `${Math.min(100, (cat.count / (profile?.row_count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Correlation Matrix */}
      {activeTab === 'correlation' && corrData && (
        <div className="space-y-6">
          {/* Strongest Correlations Badges */}
          <div className="bg-white p-5 rounded-2xl border border-agri-border shadow-xs">
            <h4 className="text-sm font-bold text-agri-dark mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-agri-primary" />
              <span>{t.eda.strongestCorrelations}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {corrData.strongest_correlations?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-agri-text">{item.var1} ↔ {item.var2}</span>
                    <span className={`font-mono font-bold text-xs ${item.r > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      r = {item.r}
                    </span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    item.strength === 'Strong' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.strength} Association
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Correlation Heatmap Grid */}
          <div className="bg-white p-6 rounded-2xl border border-agri-border shadow-xs overflow-x-auto">
            <h4 className="text-sm font-bold text-agri-dark mb-4">Pearson Correlation Matrix</h4>
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border border-gray-200 bg-gray-50 text-left"></th>
                  {corrData.columns.map((c, i) => (
                    <th key={i} className="p-2 border border-gray-200 bg-gray-50 font-semibold text-agri-text max-w-[100px] truncate" title={c}>
                      {c.substring(0, 10)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrData.columns.map((rowName, rIdx) => (
                  <tr key={rIdx}>
                    <th className="p-2 border border-gray-200 bg-gray-50 font-semibold text-left max-w-[120px] truncate" title={rowName}>
                      {rowName.substring(0, 12)}
                    </th>
                    {corrData.matrix[rIdx].map((val, cIdx) => {
                      const numVal = Number(val);
                      // Green for positive, Amber/Red for negative
                      const bg = numVal === 1 ? 'bg-emerald-200 text-emerald-950 font-bold' :
                        numVal > 0.5 ? 'bg-emerald-100 text-emerald-900' :
                        numVal > 0 ? 'bg-emerald-50 text-emerald-800' :
                        numVal < -0.5 ? 'bg-red-100 text-red-900' :
                        numVal < 0 ? 'bg-amber-50 text-amber-900' : 'bg-gray-50 text-gray-500';

                      return (
                        <td key={cIdx} className={`p-2 border border-gray-200 text-center font-mono ${bg}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
