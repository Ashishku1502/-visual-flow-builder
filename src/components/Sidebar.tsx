import { useState } from "react";
import { useFlow } from "../store/useFlow";

export default function Sidebar() {
  const {
    state,
    getSelectedNode,
    updateNode,
    deleteNode,
    setStartNode,
    renameNodeId,
    addEdge,
    updateEdge,
    deleteEdge,
    getNodeErrors,
    selectNode,
  } = useFlow();

  const selectedNode = getSelectedNode();
  const [editingId, setEditingId] = useState("");
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamValue, setNewParamValue] = useState("");
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [prevNodeId, setPrevNodeId] = useState<string | null>(null);

  // Sync editingId when selected node changes (render-time, no useEffect)
  if (selectedNode && selectedNode.id !== prevNodeId) {
    setPrevNodeId(selectedNode.id);
    setEditingId(selectedNode.id);
  } else if (!selectedNode && prevNodeId !== null) {
    setPrevNodeId(null);
  }

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No Node Selected</h3>
        <p className="text-xs text-slate-500">Click a node on the canvas to edit its properties</p>
      </div>
    );
  }

  const nodeErrors = getNodeErrors(selectedNode.id);
  const getFieldError = (field: string) => nodeErrors.find((e) => e.field === field);
  const isStart = state.startNodeId === selectedNode.id;

  const handleIdBlur = () => {
    const newId = editingId.trim();
    if (newId && newId !== selectedNode.id) {
      renameNodeId(selectedNode.id, newId);
    } else {
      setEditingId(selectedNode.id);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full slide-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-800">Node Properties</h2>
        <button
          onClick={() => selectNode(null)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Node ID */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Node ID</label>
          <input
            type="text"
            value={editingId}
            onChange={(e) => setEditingId(e.target.value)}
            onBlur={handleIdBlur}
            onKeyDown={(e) => e.key === "Enter" && handleIdBlur()}
            className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
              getFieldError("id")
                ? "border-red-300 bg-red-50 focus:ring-red-200"
                : "border-slate-200 bg-white focus:ring-indigo-200"
            } focus:outline-none focus:ring-2`}
          />
          {getFieldError("id") && (
            <p className="text-xs text-red-500 mt-1 fade-in">{getFieldError("id")!.message}</p>
          )}
        </div>

        {/* Node Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
          <input
            type="text"
            value={selectedNode.name}
            onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
            placeholder="Node display name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={selectedNode.description}
            onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors resize-none ${
              getFieldError("description")
                ? "border-red-300 bg-red-50 focus:ring-red-200"
                : "border-slate-200 bg-white focus:ring-indigo-200"
            } focus:outline-none focus:ring-2`}
            placeholder="Describe what this node does..."
          />
          {getFieldError("description") && (
            <p className="text-xs text-red-500 mt-1 fade-in">{getFieldError("description")!.message}</p>
          )}
        </div>

        {/* Start node toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs font-medium text-slate-700">Start Node</span>
            <p className="text-[10px] text-slate-500">Entry point of the flow</p>
          </div>
          <button
            onClick={() => setStartNode(selectedNode.id)}
            disabled={isStart}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              isStart
                ? "bg-emerald-100 text-emerald-700 cursor-default"
                : "bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
            }`}
          >
            {isStart ? "✓ Start" : "Set as Start"}
          </button>
        </div>

        {/* Disconnected warning */}
        {getFieldError("connectivity") && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg fade-in">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs text-amber-700">{getFieldError("connectivity")!.message}</p>
          </div>
        )}

        {/* Edges Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600">Outgoing Edges</label>
            <button
              onClick={() => {
                const otherNodes = state.nodes.filter((n) => n.id !== selectedNode.id);
                if (otherNodes.length > 0) {
                  addEdge(selectedNode.id, otherNodes[0].id, "");
                }
              }}
              disabled={state.nodes.length < 2}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              + Add Edge
            </button>
          </div>

          {selectedNode.edges.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No outgoing edges. Add one or drag from the node handle.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedNode.edges.map((edge) => {
                const edgeErrors = nodeErrors.filter((e) => e.edgeId === edge.id);
                const isExpanded = editingEdgeId === edge.id;

                return (
                  <div
                    key={edge.id}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      edgeErrors.length > 0 ? "border-red-200 bg-red-50/50" : "border-slate-200"
                    }`}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setEditingEdgeId(isExpanded ? null : edge.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          → {edge.to_node_id || "?"}
                        </span>
                        {edge.condition && (
                          <span className="text-[10px] text-slate-500 truncate">({edge.condition})</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEdge(selectedNode.id, edge.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-0.5 transition-colors shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-3 space-y-2 fade-in">
                        {/* Target node */}
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">Target Node</label>
                          <select
                            value={edge.to_node_id}
                            onChange={(e) =>
                              updateEdge(selectedNode.id, edge.id, { to_node_id: e.target.value })
                            }
                            className={`w-full px-2 py-1.5 text-xs rounded-md border ${
                              edgeErrors.some((e) => e.field === "to_node_id")
                                ? "border-red-300 bg-red-50"
                                : "border-slate-200"
                            } focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                          >
                            <option value="">Select target...</option>
                            {state.nodes
                              .filter((n) => n.id !== selectedNode.id)
                              .map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.name || n.id}
                                </option>
                              ))}
                          </select>
                          {edgeErrors.find((e) => e.field === "to_node_id") && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {edgeErrors.find((e) => e.field === "to_node_id")!.message}
                            </p>
                          )}
                        </div>

                        {/* Condition */}
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">Condition</label>
                          <input
                            type="text"
                            value={edge.condition}
                            onChange={(e) =>
                              updateEdge(selectedNode.id, edge.id, { condition: e.target.value })
                            }
                            className={`w-full px-2 py-1.5 text-xs rounded-md border ${
                              edgeErrors.some((e) => e.field === "condition")
                                ? "border-red-300 bg-red-50"
                                : "border-slate-200"
                            } focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                            placeholder="e.g., score > 80"
                          />
                          {edgeErrors.find((e) => e.field === "condition") && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {edgeErrors.find((e) => e.field === "condition")!.message}
                            </p>
                          )}
                        </div>

                        {/* Parameters */}
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1">
                            Parameters (optional)
                          </label>
                          {edge.parameters && Object.keys(edge.parameters).length > 0 && (
                            <div className="space-y-1 mb-2">
                              {Object.entries(edge.parameters).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-1">
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600 truncate">
                                    {key}
                                  </span>
                                  <span className="text-[10px] text-slate-400">=</span>
                                  <span className="text-[10px] text-slate-600 truncate">{value}</span>
                                  <button
                                    onClick={() => {
                                      const params = { ...edge.parameters };
                                      delete params[key];
                                      updateEdge(selectedNode.id, edge.id, { parameters: params });
                                    }}
                                    className="text-slate-400 hover:text-red-500 shrink-0"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newParamKey}
                              onChange={(e) => setNewParamKey(e.target.value)}
                              placeholder="key"
                              className="flex-1 px-2 py-1 text-[10px] rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                            />
                            <input
                              type="text"
                              value={newParamValue}
                              onChange={(e) => setNewParamValue(e.target.value)}
                              placeholder="value"
                              className="flex-1 px-2 py-1 text-[10px] rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                            />
                            <button
                              onClick={() => {
                                if (newParamKey.trim()) {
                                  const params = { ...(edge.parameters || {}), [newParamKey.trim()]: newParamValue };
                                  updateEdge(selectedNode.id, edge.id, { parameters: params });
                                  setNewParamKey("");
                                  setNewParamValue("");
                                }
                              }}
                              disabled={!newParamKey.trim()}
                              className="px-2 py-1 text-[10px] bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => {
            deleteNode(selectedNode.id);
            selectNode(null);
          }}
          className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
