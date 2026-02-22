import { useState, useMemo, useRef } from "react";
import { useFlow } from "../store/useFlow";
import { highlightJson } from "../utils/jsonHighlight";

export default function JsonPreview() {
  const { exportFlow, importFlow, errors } = useFlow();
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = exportFlow();
  const jsonStr = useMemo(() => JSON.stringify(schema, null, 2), [schema]);
  const highlighted = useMemo(() => highlightJson(jsonStr), [jsonStr]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const err = importFlow(importText);
    if (err) {
      setImportError(err);
    } else {
      setIsImporting(false);
      setImportText("");
      setImportError(null);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  const errorCount = errors.length;
  const warningCount = errors.filter((e) => e.field === "connectivity").length;
  const actualErrors = errorCount - warningCount;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">JSON Preview</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsImporting(!isImporting)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                isImporting
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isImporting ? "Cancel" : "Import"}
            </button>
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="px-2 py-1 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              Download
            </button>
          </div>
        </div>

        {/* Validation status */}
        <div className="flex items-center gap-2">
          {actualErrors > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {actualErrors} error{actualErrors !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </span>
          )}
          {errorCount === 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Valid
            </span>
          )}
        </div>
      </div>

      {/* Import panel */}
      {isImporting && (
        <div className="p-4 border-b border-slate-200 bg-indigo-50/50 fade-in">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-700">Import JSON</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                From File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportError(null);
            }}
            rows={6}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            placeholder='Paste your JSON here...'
          />
          {importError && (
            <p className="text-xs text-red-500 mt-1 fade-in">{importError}</p>
          )}
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="mt-2 w-full px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import Flow
          </button>
        </div>
      )}

      {/* Validation errors list */}
      {errors.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-200 max-h-32 overflow-y-auto custom-scrollbar">
          {errors.map((err, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 py-1 ${
                i > 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  err.field === "connectivity" ? "bg-amber-400" : "bg-red-400"
                }`}
              />
              <span className="text-[10px] text-slate-600">{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* JSON output */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <pre
          className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}
