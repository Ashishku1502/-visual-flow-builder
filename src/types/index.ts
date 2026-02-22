export interface FlowEdge {
  id: string;
  to_node_id: string;
  condition: string;
  parameters?: Record<string, string>;
}

export interface FlowNode {
  id: string;
  name: string;
  description: string;
  edges: FlowEdge[];
  position: { x: number; y: number };
  isStart?: boolean;
}

export interface FlowSchema {
  startNodeId: string | null;
  nodes: Array<{
    id: string;
    name: string;
    description: string;
    edges: Array<{
      to_node_id: string;
      condition: string;
      parameters?: Record<string, string>;
    }>;
  }>;
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  field: string;
  message: string;
}
