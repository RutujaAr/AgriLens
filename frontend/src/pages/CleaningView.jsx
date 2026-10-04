import React, { useState } from 'react';
import { 
  Sprout, CheckCircle2, AlertTriangle, ShieldAlert, 
  ArrowRight, Layers, RefreshCw, FileText, Check 
} from 'lucide-react';
import { api } from '../api';

export default function CleaningView({ profile, onCleanSuccess, t }) {
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [imputeNumerical, setImputeNumerical] = useState('median');
  const [imputeCategorical, setImputeCategorical] = useState('mode');
  const [standardizeNames, setStandardizeNames] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleaningReport, setCleaningReport] = useState(null);
  const [error, setError] = useState(null);

  if (!profile) return null;

  const handleClean = async () => {
    setCleaning(true);
    setError(null);
    try {
      const resp = await api.cleanDataset(profile.id, {
        remove_duplicates: removeDuplicates,
        impute_numerical: imputeNumerical,
        impute_categorical: imputeCategorical,
        standardize_column_names: standardizeNames
      });
      setCleaningReport(resp.report);
      onCleanSuccess(resp.updated_profile);
    } catch (err) {
      setError(err.message || "Failed to execute cleaning pipeline.");
    } finally {
      setCleaning(false);
    }
  };

  const invalidRecords = profile.invalid_details || [];

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-agri-text flex items-center gap-2">
          <Sprout className="w-6 h-6 text-agri-primary" />
          <span>{t.cleaning.title}</span>
        </h1>
        <p className="text-xs text-agri-muted mt-1">
          {t.cleaning.subtitle}
        </p>
      </div>

      {/* Before vs After Report */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-agri-primary" />
          <span>{t.cleaning.reportTitle}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              {t.cleaning.beforeLabel}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-agri-muted">{t.cleaning.records}:</span>
                <span className="font-bold text-agri-text">{cleaningReport ? cleaningReport.before_rows : profile.row_count}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-agri-muted">{t.cleaning.columns}:</span>
                <span className="font-bold text-agri-text">{cleaningReport ? cleaningReport.before_cols : profile.col_count}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-agri-muted">{t.cleaning.missingCount}:</span>
                <span className="font-bold text-amber-700">{cleaningReport ? cleaningReport.before_missing : profile.missing_cells_total}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-agri-muted">{t.cleaning.duplicatesCount}:</span>
                <span className="font-bold text-amber-700">{profile.duplicate_rows_count}</span>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>{t.cleaning.afterLabel}</span>
              {profile.is_cleaned && (
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold">
                  Verified Clean
                </span>
              )}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-emerald-200">
                <span className="text-emerald-900">{t.cleaning.records}:</span>
                <span className="font-bold text-emerald-950">{cleaningReport ? cleaningReport.after_rows : (profile.is_cleaned ? profile.row_count : "-")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200">
                <span className="text-emerald-900">{t.cleaning.columns}:</span>
                <span className="font-bold text-emerald-950">{cleaningReport ? cleaningReport.after_cols : (profile.is_cleaned ? profile.col_count : "-")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200">
                <span className="text-emerald-900">{t.cleaning.missingCount}:</span>
                <span className="font-bold text-emerald-950">{cleaningReport ? cleaningReport.after_missing : (profile.is_cleaned ? 0 : "-")}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-emerald-900">{t.cleaning.duplicatesCount}:</span>
                <span className="font-bold text-emerald-950">0 removed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operations Applied Log */}
        {cleaningReport && cleaningReport.operations_applied?.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-agri-light/60 border border-agri-leaf/30">
            <h4 className="text-xs font-bold text-agri-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-agri-primary" />
              <span>{t.cleaning.operationsApplied}</span>
            </h4>
            <ul className="space-y-1.5">
              {cleaningReport.operations_applied.map((op, idx) => (
                <li key={idx} className="text-xs text-agri-dark flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-agri-primary shrink-0" />
                  <span>{op}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cleaning Configuration Form */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-base font-bold text-agri-text mb-4">
          {t.cleaning.cleaningOptions}
        </h3>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Duplicate toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              className="w-4 h-4 text-agri-primary rounded focus:ring-agri-primary"
            />
            <div className="text-xs">
              <span className="font-bold text-agri-text">{t.cleaning.removeDuplicatesLabel}</span>
              <p className="text-[11px] text-agri-muted">
                Drops identical rows across all columns. Currently detected duplicates: {profile.duplicate_rows_count}
              </p>
            </div>
          </label>

          {/* Numerical Imputation */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
            <label className="block text-xs font-bold text-agri-text mb-1.5">
              {t.cleaning.numericalImputation}
            </label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="num_impute"
                  value="median"
                  checked={imputeNumerical === 'median'}
                  onChange={(e) => setImputeNumerical(e.target.value)}
                  className="text-agri-primary"
                />
                <span>{t.cleaning.medianOption}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="num_impute"
                  value="mean"
                  checked={imputeNumerical === 'mean'}
                  onChange={(e) => setImputeNumerical(e.target.value)}
                  className="text-agri-primary"
                />
                <span>{t.cleaning.meanOption}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="num_impute"
                  value="drop"
                  checked={imputeNumerical === 'drop'}
                  onChange={(e) => setImputeNumerical(e.target.value)}
                  className="text-agri-primary"
                />
                <span>{t.cleaning.dropNumericOption}</span>
              </label>
            </div>
          </div>

          {/* Categorical Imputation */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
            <label className="block text-xs font-bold text-agri-text mb-1.5">
              {t.cleaning.categoricalImputation}
            </label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cat_impute"
                  value="mode"
                  checked={imputeCategorical === 'mode'}
                  onChange={(e) => setImputeCategorical(e.target.value)}
                  className="text-agri-primary"
                />
                <span>{t.cleaning.modeOption}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cat_impute"
                  value="unknown"
                  checked={imputeCategorical === 'unknown'}
                  onChange={(e) => setImputeCategorical(e.target.value)}
                  className="text-agri-primary"
                />
                <span>{t.cleaning.unknownOption}</span>
              </label>
            </div>
          </div>

          {/* Execute Button */}
          <button
            type="button"
            onClick={handleClean}
            disabled={cleaning}
            className="w-full py-3 px-4 rounded-xl bg-agri-dark text-white font-semibold text-xs hover:bg-agri-primary shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {cleaning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sprout className="w-4 h-4" />
            )}
            <span>{t.cleaning.applyBtn}</span>
          </button>
        </div>
      </div>

      {/* Invalid Records Inspector */}
      <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-xs">
        <h3 className="text-base font-bold text-agri-text mb-1 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-agri-gold" />
          <span>{t.cleaning.invalidRecordsTitle}</span>
        </h3>
        <p className="text-xs text-agri-muted mb-4">
          {t.cleaning.invalidRecordsNotice}
        </p>

        {invalidRecords.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t.cleaning.noInvalidFound}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {invalidRecords.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-amber-900">{item.column} ({item.variable}):</span>
                  <p className="text-amber-800 mt-0.5">{item.issue}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px] uppercase">
                  Flagged
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
