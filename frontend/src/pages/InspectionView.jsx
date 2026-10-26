import React, { useState, useMemo } from 'react';
import { 
  Database, Search, ArrowUpDown, CheckCircle2, 
  ChevronLeft, ChevronRight, Layers 
} from 'lucide-react';
import EmptyDatasetState from '../components/EmptyDatasetState';

export default function InspectionView({ profile, t, onExploreDemo, isDemoLoading = false, setCurrentView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const rowsPerPage = 10;

  const rawRows = profile?.preview_rows || [];
  const columns = profile?.columns || [];

  // Filter & Sort preview rows
  const filteredRows = useMemo(() => {
    let result = [...rawRows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))
      );
    }

    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [rawRows, searchTerm, sortCol, sortAsc]);

  if (!profile) {
    return (
      <EmptyDatasetState 
        title="Dataset Schema & Inspection"
        subtitle="Please load or upload a dataset to inspect schema definitions, column data types, null percentages, and preview records."
        onExploreDemo={onExploreDemo}
        isDemoLoading={isDemoLoading}
        setCurrentView={setCurrentView}
      />
    );
  }

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const pagedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (colName) => {
    if (sortCol === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
          <Database className="w-6 h-6 text-agri-primary" />
          <span>{t.inspection.title}</span>
        </h1>
        <p className="text-xs text-agri-muted mt-1">
          {t.inspection.subtitle}
        </p>
      </div>

      {/* Dataset Preview Section */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <h3 className="text-base font-bold text-agri-text">
            {t.inspection.previewTitle}
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={t.inspection.searchPlaceholder}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-agri-border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-agri-primary w-52"
              />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto mt-4 border border-agri-border rounded-xl">
          <table className="min-w-full text-xs text-left divide-y divide-gray-200">
            <thead className="bg-[#F8FAF9] text-agri-text font-semibold">
              <tr>
                <th className="px-3 py-2.5 text-gray-400 w-12 text-center">#</th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="px-4 py-2.5 cursor-pointer hover:bg-agri-light/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pagedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-agri-light/30 transition-colors">
                  <td className="px-3 py-2 text-center text-gray-400 font-mono">
                    {(currentPage - 1) * rowsPerPage + idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.name];
                    const isMissing = val === null || val === undefined;
                    return (
                      <td key={col.name} className="px-4 py-2 whitespace-nowrap text-agri-text">
                        {isMissing ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                            null
                          </span>
                        ) : typeof val === 'number' ? (
                          val.toLocaleString()
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-4 text-xs text-agri-muted">
          <span>
            Showing {filteredRows.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} preview rows
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-agri-border hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-agri-border hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Identified Column Profiles */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-agri-primary" />
          <span>{t.inspection.columnsTitle}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {columns.map((col) => {
            const isAgri = !!col.detected_variable;
            return (
              <div 
                key={col.name}
                className={`p-4 rounded-xl border transition-all ${
                  isAgri 
                    ? 'border-agri-leaf/40 bg-[#FBFDFB]' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-agri-dark break-all">{col.name}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">{col.data_type}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    col.semantic_type === 'numerical' ? 'bg-blue-100 text-blue-800' :
                    col.semantic_type === 'geographic' ? 'bg-purple-100 text-purple-800' :
                    col.semantic_type === 'datetime' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {col.semantic_type}
                  </span>
                </div>

                {/* Agri Variable Detection Badge */}
                <div className="my-2">
                  {col.detection_label ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-agri-light text-agri-dark text-xs font-semibold border border-agri-leaf/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-agri-primary" />
                      <span>{col.detection_label}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">
                      {t.inspection.notAgriVar}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="text-[11px] space-y-1 text-agri-muted pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>{t.inspection.missing}:</span>
                    <span className={`font-semibold ${col.missing_count > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {col.missing_count} ({col.missing_percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.inspection.unique}:</span>
                    <span className="font-semibold text-agri-text">{col.unique_count}</span>
                  </div>
                  {col.min_val !== null && col.max_val !== null && (
                    <div className="flex justify-between">
                      <span>{t.inspection.minMax}:</span>
                      <span className="font-mono text-agri-text">[{col.min_val} to {col.max_val}]</span>
                    </div>
                  )}
                  {col.sample_values?.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-gray-400 block mb-0.5">Sample Values:</span>
                      <div className="flex flex-wrap gap-1">
                        {col.sample_values.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-700 font-mono">
                            {String(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
