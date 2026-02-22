import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useFlow } from "../store/useFlow";

interface FlowNodeData {
  label: string;
  description: string;
  isStart: boolean;
  hasErrors: boolean;
  isSelected: boolean;
  [key: string]: unknown;
}

function FlowNodeComponent({ id, data }: NodeProps) {
  const { selectNode, state } = useFlow();
  const nodeData = data as unknown as FlowNodeData;
  const isSelected = state.selectedNodeId === id;
  const isStart = state.startNodeId === id;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(id);
      }}
      className={`
        relative px-4 py-3 rounded-xl shadow-md border-2 min-w-[160px] cursor-pointer
        transition-all duration-150 bg-white
        ${isStart ? "border-emerald-500 ring-2 ring-emerald-200" : ""}
        ${isSelected && !isStart ? "border-indigo-500 ring-2 ring-indigo-200" : ""}
        ${!isSelected && !isStart ? "border-slate-200 hover:border-slate-300 hover:shadow-lg" : ""}
        ${nodeData.hasErrors ? "border-red-400 ring-2 ring-red-100" : ""}
      `}
    >
      {/* Start badge */}
      {isStart && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Start
        </div>
      )}

      {/* Node content */}
      <div className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
        {nodeData.label || id}
      </div>
      {nodeData.description && (
        <div className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">
          {nodeData.description}
        </div>
      )}

      {/* Error indicator */}
      {nodeData.hasErrors && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">!</span>
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-indigo-400 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-indigo-400 !border-white"
      />
    </div>
  );
}

export default memo(FlowNodeComponent);
