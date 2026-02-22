import { useFlow } from "../store/useFlow";

export default function Toolbar() {
  const { addNode, state, errors } = useFlow();

  const errorCount = errors.filter((e) => e.field !== "connectivity").length;
  const warningCount = errors.filter((e) => e.field === "connectivity").length;

  return (
    <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-800">Flow Builder</span>
        </div>

        <div className="w-px h-6 bg-slate-200" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>{state.nodes.length} node{state.nodes.length !== 1 ? "s" : ""}</span>
          <span>
            {state.nodes.reduce((acc, n) => acc + n.edges.length, 0)} edge
            {state.nodes.reduce((acc, n) => acc + n.edges.length, 0) !== 1 ? "s" : ""}
          </span>
          {errorCount > 0 && (
            <span className="text-red-500 font-medium">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-500 font-medium">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => addNode()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Node
        </button>
      </div>
    </div>
  );
}
