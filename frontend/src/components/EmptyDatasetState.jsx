import React from 'react';
import { Database, UploadCloud, Compass, Loader2 } from 'lucide-react';

export default function EmptyDatasetState({ 
  title = "No Dataset Active", 
  subtitle = "Please load the curated Indian agricultural demonstration dataset or upload your own CSV file to access this module.",
  onExploreDemo,
  isDemoLoading = false,
  setCurrentView
}) {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-agri-border shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-2xs">
          <Database className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto mb-8">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onExploreDemo && (
            <button
              onClick={onExploreDemo}
              disabled={isDemoLoading}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDemoLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-agri-dark hover:bg-agri-primary shadow-agri-dark/20'
              }`}
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Official Dataset...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <span>Explore Demo Dataset</span>
                </>
              )}
            </button>
          )}

          {setCurrentView && (
            <button
              onClick={() => setCurrentView('upload')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-gray-600" />
              <span>Upload CSV / Excel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
