import {
  createContext,
  useReducer,
  useCallback,
  type ReactNode,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { FlowNode, FlowEdge, ValidationError, FlowSchema } from "../types";

// --- State ---
interface FlowState {
  nodes: FlowNode[];
  selectedNodeId: string | null;
  startNodeId: string | null;
}

const initialState: FlowState = {
  nodes: [],
  selectedNodeId: null,
  startNodeId: null,
};

// --- Actions ---
type FlowAction =
  | { type: "ADD_NODE"; payload: FlowNode }
  | { type: "DELETE_NODE"; payload: string }
  | { type: "UPDATE_NODE"; payload: { id: string; updates: Partial<FlowNode> } }
  | { type: "MOVE_NODE"; payload: { id: string; position: { x: number; y: number } } }
  | { type: "SELECT_NODE"; payload: string | null }
  | { type: "SET_START_NODE"; payload: string }
  | { type: "ADD_EDGE"; payload: { nodeId: string; edge: FlowEdge } }
  | { type: "UPDATE_EDGE"; payload: { nodeId: string; edgeId: string; updates: Partial<FlowEdge> } }
  | { type: "DELETE_EDGE"; payload: { nodeId: string; edgeId: string } }
  | { type: "IMPORT_FLOW"; payload: { nodes: FlowNode[]; startNodeId: string | null } }
  | { type: "RENAME_NODE_ID"; payload: { oldId: string; newId: string } };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "ADD_NODE":
      return { ...state, nodes: [...state.nodes, action.payload] };

    case "DELETE_NODE": {
      const id = action.payload;
      const updatedNodes = state.nodes
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          edges: n.edges.filter((e) => e.to_node_id !== id),
        }));
      return {
        ...state,
        nodes: updatedNodes,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        startNodeId: state.startNodeId === id ? null : state.startNodeId,
      };
    }

    case "UPDATE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
        ),
      };

    case "MOVE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, position: action.payload.position } : n
        ),
      };

    case "SELECT_NODE":
      return { ...state, selectedNodeId: action.payload };

    case "SET_START_NODE":
      return { ...state, startNodeId: action.payload };

    case "ADD_EDGE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.nodeId
            ? { ...n, edges: [...n.edges, action.payload.edge] }
            : n
        ),
      };

    case "UPDATE_EDGE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.nodeId
            ? {
                ...n,
                edges: n.edges.map((e) =>
                  e.id === action.payload.edgeId
                    ? { ...e, ...action.payload.updates }
                    : e
                ),
              }
            : n
        ),
      };

    case "DELETE_EDGE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.nodeId
            ? { ...n, edges: n.edges.filter((e) => e.id !== action.payload.edgeId) }
            : n
        ),
      };

    case "RENAME_NODE_ID": {
      const { oldId, newId } = action.payload;
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          const updatedEdges = n.edges.map((e) =>
            e.to_node_id === oldId ? { ...e, to_node_id: newId } : e
          );
          if (n.id === oldId) {
            return { ...n, id: newId, edges: updatedEdges };
          }
          return { ...n, edges: updatedEdges };
        }),
        selectedNodeId: state.selectedNodeId === oldId ? newId : state.selectedNodeId,
        startNodeId: state.startNodeId === oldId ? newId : state.startNodeId,
      };
    }

    case "IMPORT_FLOW":
      return {
        nodes: action.payload.nodes,
        startNodeId: action.payload.startNodeId,
        selectedNodeId: null,
      };

    default:
      return state;
  }
}

// --- Validation ---
function validateFlow(state: FlowState): ValidationError[] {
  const errors: ValidationError[] = [];
  const idSet = new Set<string>();

  // Check start node
  if (!state.startNodeId) {
    errors.push({ field: "startNode", message: "A start node must be designated" });
  } else if (!state.nodes.find((n) => n.id === state.startNodeId)) {
    errors.push({ field: "startNode", message: "Start node does not exist in the flow" });
  }

  for (const node of state.nodes) {
    // Duplicate ID check
    if (idSet.has(node.id)) {
      errors.push({ nodeId: node.id, field: "id", message: `Duplicate node ID: "${node.id}"` });
    }
    idSet.add(node.id);

    // Empty ID
    if (!node.id.trim()) {
      errors.push({ nodeId: node.id, field: "id", message: "Node ID cannot be empty" });
    }

    // Description required
    if (!node.description.trim()) {
      errors.push({
        nodeId: node.id,
        field: "description",
        message: `Node "${node.id}" is missing a description`,
      });
    }

    // Edge validation
    for (const edge of node.edges) {
      if (!edge.to_node_id) {
        errors.push({
          nodeId: node.id,
          edgeId: edge.id,
          field: "to_node_id",
          message: `Edge in "${node.id}" has no target node`,
        });
      } else if (!state.nodes.find((n) => n.id === edge.to_node_id)) {
        errors.push({
          nodeId: node.id,
          edgeId: edge.id,
          field: "to_node_id",
          message: `Edge in "${node.id}" points to non-existent node "${edge.to_node_id}"`,
        });
      }

      if (!edge.condition.trim()) {
        errors.push({
          nodeId: node.id,
          edgeId: edge.id,
          field: "condition",
          message: `Edge in "${node.id}" is missing a condition`,
        });
      }
    }
  }

  // Disconnected nodes warning (no incoming or outgoing edges, excluding start)
  for (const node of state.nodes) {
    if (node.id === state.startNodeId) continue;
    const hasIncoming = state.nodes.some((n) =>
      n.edges.some((e) => e.to_node_id === node.id)
    );
    const hasOutgoing = node.edges.length > 0;
    if (!hasIncoming && !hasOutgoing) {
      errors.push({
        nodeId: node.id,
        field: "connectivity",
        message: `Node "${node.id}" is disconnected (no incoming or outgoing edges)`,
      });
    }
  }

  return errors;
}

// --- Context ---
interface FlowContextValue {
  state: FlowState;
  errors: ValidationError[];
  addNode: (position?: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  setStartNode: (id: string) => void;
  addEdge: (nodeId: string, toNodeId: string, condition?: string) => void;
  updateEdge: (nodeId: string, edgeId: string, updates: Partial<FlowEdge>) => void;
  deleteEdge: (nodeId: string, edgeId: string) => void;
  renameNodeId: (oldId: string, newId: string) => void;
  importFlow: (json: string) => string | null;
  exportFlow: () => FlowSchema;
  getSelectedNode: () => FlowNode | undefined;
  getNodeErrors: (nodeId: string) => ValidationError[];
}

const FlowContext = createContext<FlowContextValue | null>(null);
export { FlowContext };

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, initialState);

  const errors = useMemo(() => validateFlow(state), [state]);

  const addNode = useCallback(
    (position?: { x: number; y: number }) => {
      const count = state.nodes.length + 1;
      const id = `node_${count}`;
      // Ensure unique id
      let finalId = id;
      let i = count;
      while (state.nodes.some((n) => n.id === finalId)) {
        i++;
        finalId = `node_${i}`;
      }
      const node: FlowNode = {
        id: finalId,
        name: finalId,
        description: "",
        edges: [],
        position: position || { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      };
      dispatch({ type: "ADD_NODE", payload: node });
      if (state.nodes.length === 0) {
        dispatch({ type: "SET_START_NODE", payload: finalId });
      }
    },
    [state.nodes]
  );

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: "DELETE_NODE", payload: id });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<FlowNode>) => {
    dispatch({ type: "UPDATE_NODE", payload: { id, updates } });
  }, []);

  const moveNode = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: "MOVE_NODE", payload: { id, position } });
  }, []);

  const selectNode = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_NODE", payload: id });
  }, []);

  const setStartNode = useCallback((id: string) => {
    dispatch({ type: "SET_START_NODE", payload: id });
  }, []);

  const addEdge = useCallback(
    (nodeId: string, toNodeId: string, condition?: string) => {
      const edge: FlowEdge = {
        id: uuidv4(),
        to_node_id: toNodeId,
        condition: condition || "",
      };
      dispatch({ type: "ADD_EDGE", payload: { nodeId, edge } });
    },
    []
  );

  const updateEdge = useCallback(
    (nodeId: string, edgeId: string, updates: Partial<FlowEdge>) => {
      dispatch({ type: "UPDATE_EDGE", payload: { nodeId, edgeId, updates } });
    },
    []
  );

  const deleteEdge = useCallback((nodeId: string, edgeId: string) => {
    dispatch({ type: "DELETE_EDGE", payload: { nodeId, edgeId } });
  }, []);

  const renameNodeId = useCallback(
    (oldId: string, newId: string) => {
      if (state.nodes.some((n) => n.id !== oldId && n.id === newId)) {
        return; // duplicate, don't rename
      }
      dispatch({ type: "RENAME_NODE_ID", payload: { oldId, newId } });
    },
    [state.nodes]
  );

  const importFlow = useCallback((json: string): string | null => {
    try {
      const data = JSON.parse(json) as FlowSchema;
      if (!data.nodes || !Array.isArray(data.nodes)) {
        return "Invalid schema: 'nodes' array is required";
      }
      const flowNodes: FlowNode[] = data.nodes.map((n, i) => ({
        id: n.id,
        name: n.name || n.id,
        description: n.description || "",
        edges: (n.edges || []).map((e) => ({
          id: uuidv4(),
          to_node_id: e.to_node_id,
          condition: e.condition || "",
          parameters: e.parameters,
        })),
        position: { x: 100 + (i % 4) * 250, y: 100 + Math.floor(i / 4) * 200 },
      }));
      dispatch({
        type: "IMPORT_FLOW",
        payload: { nodes: flowNodes, startNodeId: data.startNodeId },
      });
      return null;
    } catch {
      return "Invalid JSON format";
    }
  }, []);

  const exportFlow = useCallback((): FlowSchema => {
    return {
      startNodeId: state.startNodeId,
      nodes: state.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        description: n.description,
        edges: n.edges.map((e) => {
          const edge: { to_node_id: string; condition: string; parameters?: Record<string, string> } = {
            to_node_id: e.to_node_id,
            condition: e.condition,
          };
          if (e.parameters && Object.keys(e.parameters).length > 0) {
            edge.parameters = e.parameters;
          }
          return edge;
        }),
      })),
    };
  }, [state.nodes, state.startNodeId]);

  const getSelectedNode = useCallback(() => {
    return state.nodes.find((n) => n.id === state.selectedNodeId);
  }, [state.nodes, state.selectedNodeId]);

  const getNodeErrors = useCallback(
    (nodeId: string) => {
      return errors.filter((e) => e.nodeId === nodeId);
    },
    [errors]
  );

  const value = useMemo(
    () => ({
      state,
      errors,
      addNode,
      deleteNode,
      updateNode,
      moveNode,
      selectNode,
      setStartNode,
      addEdge,
      updateEdge,
      deleteEdge,
      renameNodeId,
      importFlow,
      exportFlow,
      getSelectedNode,
      getNodeErrors,
    }),
    [
      state,
      errors,
      addNode,
      deleteNode,
      updateNode,
      moveNode,
      selectNode,
      setStartNode,
      addEdge,
      updateEdge,
      deleteEdge,
      renameNodeId,
      importFlow,
      exportFlow,
      getSelectedNode,
      getNodeErrors,
    ]
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

