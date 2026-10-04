import React, { useState } from 'react';
import { MapPin, Info, ArrowUpRight } from 'lucide-react';

// Simplified representative SVG map geometry for primary agricultural states of India
const STATE_PATHS = [
  { id: "Punjab", name: "Punjab", d: "M 150 140 L 180 135 L 195 160 L 175 185 L 140 170 Z", cx: 165, cy: 155 },
  { id: "Haryana", name: "Haryana", d: "M 175 185 L 205 170 L 215 195 L 185 210 Z", cx: 195, cy: 190 },
  { id: "Rajasthan", name: "Rajasthan", d: "M 120 180 L 175 185 L 185 250 L 140 280 L 95 240 Z", cx: 140, cy: 230 },
  { id: "Uttar Pradesh", name: "Uttar Pradesh", d: "M 215 195 L 290 190 L 320 230 L 260 265 L 200 240 Z", cx: 260, cy: 225 },
  { id: "Bihar", name: "Bihar", d: "M 320 230 L 375 235 L 370 275 L 320 270 Z", cx: 345, cy: 250 },
  { id: "West Bengal", name: "West Bengal", d: "M 370 250 L 395 240 L 400 310 L 365 315 L 370 275 Z", cx: 380, cy: 280 },
  { id: "Gujarat", name: "Gujarat", d: "M 85 270 L 140 280 L 150 330 L 105 340 L 70 310 Z", cx: 110, cy: 305 },
  { id: "Madhya Pradesh", name: "Madhya Pradesh", d: "M 160 260 L 260 265 L 280 320 L 200 340 L 160 300 Z", cx: 215, cy: 300 },
  { id: "Maharashtra", name: "Maharashtra", d: "M 130 335 L 220 335 L 250 390 L 170 420 L 135 370 Z", cx: 185, cy: 375 },
  { id: "Odisha", name: "Odisha", d: "M 290 310 L 350 300 L 340 370 L 280 350 Z", cx: 315, cy: 335 },
  { id: "Andhra Pradesh", name: "Andhra Pradesh", d: "M 220 400 L 280 370 L 270 470 L 220 450 Z", cx: 250, cy: 425 },
  { id: "Karnataka", name: "Karnataka", d: "M 160 410 L 210 410 L 200 500 L 160 480 Z", cx: 185, cy: 450 },
  { id: "Tamil Nadu", name: "Tamil Nadu", d: "M 190 490 L 240 480 L 220 560 L 180 540 Z", cx: 210, cy: 520 },
  { id: "Kerala", name: "Kerala", d: "M 165 500 L 185 500 L 180 565 L 160 550 Z", cx: 172, cy: 530 },
  { id: "Telangana", name: "Telangana", d: "M 215 365 L 260 365 L 255 410 L 215 410 Z", cx: 235, cy: 388 },
  { id: "Assam", name: "Assam", d: "M 420 220 L 480 210 L 475 250 L 420 245 Z", cx: 450, cy: 230 }
];

export default function IndiaMap({ stateAnalysisData, t }) {
  const [selectedMetric, setSelectedMetric] = useState('production'); // 'production', 'yield', 'rainfall'
  const [hoveredState, setHoveredState] = useState(null);

  if (!stateAnalysisData || !stateAnalysisData.available) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-agri-border text-center shadow-xs">
        <MapPin className="w-12 h-12 text-agri-muted mx-auto mb-3 opacity-60" />
        <h4 className="text-base font-semibold text-agri-text mb-1">
          {t.map.unavailableTitle}
        </h4>
        <p className="text-xs text-agri-muted max-w-md mx-auto">
          {stateAnalysisData?.reason || "Geographical visualization is unavailable because this dataset does not contain recognizable state/district information."}
        </p>
      </div>
    );
  }

  const summaries = stateAnalysisData.state_summaries || [];
  const stateMap = {};
  summaries.forEach((s) => {
    stateMap[s.state] = s;
  });

  // Calculate min & max for color scaling
  const getMetricVal = (stateItem) => {
    if (!stateItem) return 0;
    if (selectedMetric === 'production') return stateItem.total_production || 0;
    if (selectedMetric === 'yield') return stateItem.avg_yield || 0;
    if (selectedMetric === 'rainfall') return stateItem.avg_rainfall || 0;
    return 0;
  };

  const values = summaries.map(getMetricVal).filter(v => v > 0);
  const maxVal = values.length ? Math.max(...values) : 1;
  const minVal = values.length ? Math.min(...values) : 0;

  const getColor = (stateName) => {
    const data = stateMap[stateName];
    if (!data) return "#E2E8F0"; // Slate-200 for unrecorded states
    const val = getMetricVal(data);
    const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));

    // Interpolate between soft green (#A5D6A7) to rich forest green (#1B5E20)
    if (selectedMetric === 'rainfall') {
      // Blue tint for rainfall
      const lightness = 90 - (ratio * 55);
      return `hsl(200, 75%, ${lightness}%)`;
    } else {
      // Green tint for crops & yield
      const lightness = 88 - (ratio * 58);
      return `hsl(125, 60%, ${lightness}%)`;
    }
  };

  const formatValue = (num) => {
    if (selectedMetric === 'production') return `${Number(num).toLocaleString()} Tonnes`;
    if (selectedMetric === 'yield') return `${Number(num).toLocaleString()} kg/ha`;
    if (selectedMetric === 'rainfall') return `${Number(num).toLocaleString()} mm`;
    return num;
  };

  // Sorted leaderboard
  const leaderboard = [...summaries].sort((a, b) => getMetricVal(b) - getMetricVal(a)).slice(0, 6);

  return (
    <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
      {/* Header and Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-agri-dark flex items-center gap-2">
            <MapPin className="w-5 h-5 text-agri-primary" />
            {t.map.title}
          </h3>
          <p className="text-xs text-agri-muted mt-0.5">
            {t.map.subtitle}
          </p>
        </div>

        {/* Metric Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-agri-text">
            {t.map.visualizeBy}
          </span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 rounded-lg border border-agri-border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-agri-primary"
          >
            <option value="production">{t.map.metricProduction}</option>
            <option value="yield">{t.map.metricYield}</option>
            <option value="rainfall">{t.map.metricRainfall}</option>
          </select>
        </div>
      </div>

      {/* Main Map & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* SVG Choropleth Map */}
        <div className="lg:col-span-7 bg-[#F8FAF9] rounded-xl p-4 flex flex-col items-center justify-center relative border border-gray-100">
          <svg
            viewBox="50 110 450 470"
            className="w-full max-w-[460px] h-[380px] drop-shadow-sm"
          >
            {STATE_PATHS.map((st) => {
              const hasData = !!stateMap[st.name];
              const isHovered = hoveredState?.state === st.name;

              return (
                <g key={st.id}>
                  <path
                    d={st.d}
                    fill={getColor(st.name)}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? "2.5" : "1.2"}
                    className="cursor-pointer transition-all duration-150 hover:opacity-90"
                    onMouseEnter={() => setHoveredState(stateMap[st.name] || { state: st.name, notRecorded: true })}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {hasData && (
                    <text
                      x={st.cx}
                      y={st.cy}
                      fontSize="9"
                      fontWeight="600"
                      fill="#1E293B"
                      textAnchor="middle"
                      className="pointer-events-none select-none"
                    >
                      {st.name.substring(0, 4)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-agri-muted">
            <span>Low</span>
            <div className={`h-2.5 w-32 rounded-full ${
              selectedMetric === 'rainfall' 
                ? 'bg-gradient-to-r from-sky-100 via-sky-400 to-sky-700' 
                : 'bg-gradient-to-r from-emerald-100 via-emerald-400 to-emerald-800'
            }`}></div>
            <span>High</span>
            <span className="text-[10px] text-gray-400 ml-2">({t.map.hoverHint})</span>
          </div>
        </div>

        {/* State Detail Inspection & Leaderboard */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Active Hover Inspection Card */}
          <div className="p-4 rounded-xl border border-agri-leaf/30 bg-agri-light/40 shadow-xs">
            <h4 className="text-xs uppercase tracking-wider text-agri-dark font-bold flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-agri-primary" />
              {t.map.selectedState}
            </h4>

            {hoveredState ? (
              hoveredState.notRecorded ? (
                <div className="py-2">
                  <p className="text-base font-bold text-gray-700">{hoveredState.state}</p>
                  <p className="text-xs text-gray-500">No records present in uploaded dataset.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-agri-dark">{hoveredState.state}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-agri-leaf/40 text-agri-dark font-semibold">
                      {hoveredState.zone} India
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-agri-border space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-agri-muted">Production:</span>
                      <span className="font-semibold text-agri-text">{hoveredState.total_production?.toLocaleString()} Tonnes</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-agri-muted">Avg Yield:</span>
                      <span className="font-semibold text-agri-text">{hoveredState.avg_yield?.toLocaleString()} kg/ha</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-agri-muted">Avg Rainfall:</span>
                      <span className="font-semibold text-agri-text">{hoveredState.avg_rainfall?.toLocaleString()} mm</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-100 pt-1">
                      <span className="text-agri-muted">Dominant Crop:</span>
                      <span className="font-bold text-agri-primary">{hoveredState.top_crop}</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="py-6 text-center text-xs text-agri-muted">
                Hover over any state on the map to inspect localized agricultural metrics.
              </div>
            )}
          </div>

          {/* Top States Leaderboard */}
          <div>
            <h4 className="text-xs font-bold text-agri-dark uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Top States ({selectedMetric})</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-agri-primary" />
            </h4>
            <div className="space-y-1.5">
              {leaderboard.map((item, idx) => (
                <div 
                  key={item.state}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-agri-light/60 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-gray-400">{idx + 1}</span>
                    <span className="font-medium text-agri-text">{item.state}</span>
                  </div>
                  <span className="font-bold text-agri-dark">
                    {formatValue(getMetricVal(item))}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
