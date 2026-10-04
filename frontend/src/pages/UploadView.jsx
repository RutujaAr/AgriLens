import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, 
  Sprout, ShieldAlert, ArrowRight, Loader2, Compass 
} from 'lucide-react';
import { api } from '../api';

export default function UploadView({ t, onUploadSuccess, onExploreDemo }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const inputRef = useRef(null);

  const processingSteps = [
    t.upload.status1,
    t.upload.status2,
    t.upload.status3,
    t.upload.status4,
    t.upload.status5,
    t.upload.status6
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setError(null);
    setFileInfo({ name: file.name, size: file.size, type: file.type });
    setUploading(true);
    setCurrentStep(1);

    try {
      // Step 1: Uploading
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 400));

      // Step 2: Parsing
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 400));

      // Step 3: Columns Identification
      setCurrentStep(3);
      
      const profile = await api.uploadDataset(file);

      // Step 4 & 5: Profiling & Quality calculation
      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 300));
      setCurrentStep(5);
      await new Promise(r => setTimeout(r, 300));
      setCurrentStep(6);

      setTimeout(() => {
        onUploadSuccess(profile);
      }, 600);
    } catch (err) {
      setError(err.message || "Failed to process the uploaded dataset. Ensure it has valid header rows.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-agri-text">
          {t.upload.title}
        </h1>
        <p className="text-sm text-agri-muted mt-2">
          {t.upload.subtitle}
        </p>
      </div>

      {/* Main Upload Drag-and-Drop Box */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
          dragActive 
            ? 'border-agri-primary bg-agri-light/60 scale-[1.01]' 
            : 'border-agri-border bg-white hover:border-agri-leaf hover:bg-agri-light/20 shadow-sm'
        }`}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleChange}
          className="hidden" 
        />

        <div className="w-16 h-16 rounded-2xl bg-agri-light text-agri-primary flex items-center justify-center mx-auto mb-4 border border-agri-leaf/30 shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-agri-text mb-1">
          {t.upload.dropzoneText}
        </h3>
        <p className="text-xs text-agri-muted mb-5">
          Comma-separated (CSV), Excel Spreadsheet (XLSX, XLS), or structured JSON
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-2.5 rounded-xl bg-agri-dark text-white font-medium text-xs hover:bg-agri-primary shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t.upload.browseBtn}</span>
        </button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-agri-muted font-bold uppercase tracking-wider">
              {t.upload.orText}
            </span>
          </div>
        </div>

        {/* Demo Dataset CTA */}
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#F0F7F0] border border-agri-leaf/30 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white text-agri-primary border border-agri-leaf/30 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-agri-dark">
                {t.upload.tryDemoBtn}
              </h4>
              <p className="text-[11px] text-agri-muted mt-0.5 leading-relaxed">
                {t.upload.demoNote}
              </p>
              <button
                type="button"
                onClick={onExploreDemo}
                disabled={uploading}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-agri-primary text-white text-xs font-semibold hover:bg-agri-dark transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Load Verified Sample Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Uploading Progress Checklist */}
      {uploading && (
        <div className="bg-white rounded-2xl p-6 border border-agri-border shadow-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-agri-dark flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-agri-primary animate-spin" />
              <span>{t.upload.processingTitle}</span>
            </h4>
            {fileInfo && (
              <span className="text-xs text-agri-muted font-medium">
                {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {processingSteps.map((step, idx) => {
              const isPassed = currentStep > idx + 1;
              const isCurrent = currentStep === idx + 1;

              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 text-xs p-2 rounded-lg transition-all ${
                    isCurrent 
                      ? 'bg-agri-light text-agri-dark font-semibold' 
                      : isPassed
                      ? 'text-emerald-800'
                      : 'text-gray-400'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-agri-primary animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">{t.upload.errorPrefix}</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Data Authenticity Notice */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-agri-muted flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-agri-gold shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t.upload.authenticityNotice}
        </p>
      </div>
    </div>
  );
}
