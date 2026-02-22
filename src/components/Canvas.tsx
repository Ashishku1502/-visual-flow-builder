import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFlow } from "../store/useFlow";
import FlowNodeComponent from "./FlowNode";
import ConditionEdge from "./ConditionEdge";

const nodeTypes = { flowNode: FlowNodeComponent };
const edgeTypes = { conditionEdge: ConditionEdge };

export default function Canvas() {
  const {
    state,
    addEdge: addFlowEdge,
    moveNode,
    selectNode,
    deleteNode,
    deleteEdge,
    getNodeErrors,
  } = useFlow();

  // Convert flow nodes to React Flow nodes
  const rfNodes: RFNode[] = useMemo(
    () =>
      state.nodes.map((n) => ({
        id: n.id,
        type: "flowNode",
        position: n.position,
        data: {
          label: n.name || n.id,
          description: n.description,
          isStart: state.startNodeId === n.id,
          hasErrors: getNodeErrors(n.id).length > 0,
          isSelected: state.selectedNodeId === n.id,
        },
        selected: state.selectedNodeId === n.id,
      })),
    [state.nodes, state.startNodeId, state.selectedNodeId, getNodeErrors]
  );

  // Convert flow edges to React Flow edges
  const rfEdges: RFEdge[] = useMemo(() => {
    const edges: RFEdge[] = [];
    for (const node of state.nodes) {
      for (const edge of node.edges) {
        edges.push({
          id: edge.id,
          source: node.id,
          target: edge.to_node_id,
          type: "conditionEdge",
          data: { condition: edge.condition },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        });
      }
    }
    return edges;
  }, [state.nodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Sync state -> React Flow
  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          moveNode(change.id, change.position);
        }
        if (change.type === "remove") {
          deleteNode(change.id);
        }
      }
    },
    [onNodesChange, moveNode, deleteNode]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      for (const change of changes) {
        if (change.type === "remove") {
          // Find the edge's source node
          for (const node of state.nodes) {
            const edge = node.edges.find((e) => e.id === change.id);
            if (edge) {
              deleteEdge(node.id, edge.id);
              break;
            }
          }
        }
      }
    },
    [onEdgesChange, state.nodes, deleteEdge]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addFlowEdge(connection.source, connection.target, "");
      }
    },
    [addFlowEdge]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-slate-50"
        defaultEdgeOptions={{
          type: "conditionEdge",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls className="!bg-white !border-slate-200 !rounded-lg !shadow-md" />
        <MiniMap
          className="!bg-white !border-slate-200 !rounded-lg !shadow-md"
          nodeColor={(node) => {
            if (state.startNodeId === node.id) return "#10b981";
            if (state.selectedNodeId === node.id) return "#6366f1";
            return "#e2e8f0";
          }}
          maskColor="rgba(241, 245, 249, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
