import React, { useState, useEffect } from 'react';
import { 
  PieChart as PieIcon, BarChart3, TrendingUp, Printer, 
  HelpCircle, Sparkles, Loader2 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { api } from '../api';

const COLORS = ['#2E7D32', '#1B5E20', '#4CAF50', '#F9A825', '#0284C7', '#7C3AED', '#DB2777', '#EA580C'];

export default function VisualizationsView({ profile, t, lang }) {
  const [vizData, setVizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    const fetchViz = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.getVisualizations(profile.id);
        setVizData(resp);
      } catch (err) {
        setError(err.message || "Failed to generate visualizations.");
      } finally {
        setLoading(false);
      }
    };
    fetchViz();
  }, [profile?.id, profile?.is_cleaned]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-agri-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-agri-muted">Synthesizing meaningful agricultural charts...</p>
      </div>
    );
  }

  if (error || !vizData) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        {error || "Unable to load visualizations."}
      </div>
    );
  }

  const charts = vizData.charts || [];

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-agri-primary" />
            <span>{t.viz.title}</span>
          </h1>
          <p className="text-xs text-agri-muted mt-1">
            {t.viz.subtitle}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-agri-border text-agri-dark font-medium text-xs hover:bg-agri-light shadow-xs transition-all flex items-center gap-2 cursor-pointer no-print"
        >
          <Printer className="w-4 h-4 text-agri-primary" />
          <span>{t.viz.exportBtn}</span>
        </button>
      </div>

      {/* Grid of Automated Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart) => {
          const title = (lang === 'mr' && chart.title_mr) ? chart.title_mr : chart.title;
          const question = (lang === 'mr' && chart.question_answered_mr) ? chart.question_answered_mr : chart.question_answered;

          return (
            <div 
              key={chart.id}
              className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-agri-dark mb-1">
                  {title}
                </h3>
                {question && (
                  <p className="text-xs text-agri-muted flex items-start gap-1.5 mb-4">
                    <span className="font-semibold text-agri-primary shrink-0">{t.viz.questionAnswered}</span>
                    <span>{question}</span>
                  </p>
                )}

                {/* Chart Rendering */}
                <div className="h-64 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {chart.type === 'bar' ? (
                      <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }} 
                          angle={-20} 
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(val) => [typeof val === 'number' ? val.toLocaleString() : val, chart.y_axis || 'Value']}
                          contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#2E7D32" radius={[4, 4, 0, 0]}>
                          {chart.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : chart.type === 'line' ? (
                      <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(val) => [typeof val === 'number' ? val.toLocaleString() : val, chart.y_axis || 'Value']}
                          contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#1B5E20" 
                          strokeWidth={2.5} 
                          dot={{ r: 4, fill: '#4CAF50' }}
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    ) : chart.type === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={chart.data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={45}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chart.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val, name, item) => [`${val}% (${item.payload.raw_value?.toLocaleString()} Tonnes)`, name]}
                          contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                        />
                      </PieChart>
                    ) : null}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart Insight */}
              {chart.insight && (
                <div className="mt-4 p-3 rounded-xl bg-agri-light/60 border border-agri-leaf/30 text-xs text-agri-dark flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-agri-primary shrink-0 mt-0.5" />
                  <span>{chart.insight}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
