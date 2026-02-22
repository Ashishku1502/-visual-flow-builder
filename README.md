# Flow Builder — Visual Flow Editor

A single-page visual flow builder app where users can construct flowcharts by adding nodes, connecting them with conditional edges, and exporting the result as JSON. Built as a lightweight alternative to tools like Zapier or n8n's visual editors.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-blue) ![React Flow](https://img.shields.io/badge/ReactFlow-12-blue)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173/`.

## Features

### Canvas
- **Add nodes** via the toolbar button
- **Drag nodes** freely around the canvas
- **Connect nodes** by dragging from source handle (right side) to target handle (left side)
- **Delete nodes/edges** by selecting them and pressing `Delete` or `Backspace`
- **Start node** visually distinguished with a green border and "Start" badge
- Minimap for navigation, zoom controls, and fit-to-view

### Node Sidebar
- Click any node to open the property editor
- **Edit Node ID** — validated for uniqueness; all edge references update automatically on rename
- **Edit Name** — display label shown on the canvas
- **Edit Description** — required field with inline validation
- **Set as Start Node** — designate the flow entry point
- **Manage Outgoing Edges**:
  - Add/remove edges with collapsible panels
  - Pick target node from a dropdown
  - Write condition text (shown as edge labels on canvas)
  - Add optional key-value parameters per edge

### JSON Preview
- **Live-generated JSON** that updates in real time as you edit
- **Syntax highlighting** with color-coded keys, strings, numbers, and booleans
- **Copy to clipboard** / **Download as .json**
- **Import JSON** — paste JSON or upload a `.json` file to reconstruct a flow
- **Validation status** — shows error/warning counts with an itemized error list

### Validations
- Node IDs must be unique (enforced on rename)
- Description fields are required
- A start node must exist
- Edge targets must reference existing nodes
- Edge conditions are required
- **Disconnected node warnings** — nodes with no incoming or outgoing edges are flagged
- All errors shown as **inline messages** next to the relevant fields, plus a summary in the JSON panel

## Architecture & Design Choices

### Tech Stack
- **React 19 + TypeScript** — type-safe component development
- **Vite** — fast dev server and production builds
- **React Flow (@xyflow/react)** — battle-tested canvas library for node-based UIs with built-in drag, zoom, minimap, and connection handling
- **Tailwind CSS 4** — utility-first styling via the Vite plugin (no config file needed)

### State Management
Used **React Context + `useReducer`** instead of a third-party state library. This keeps the dependency footprint small while providing a clear, Redux-like pattern:

- `FlowContext.tsx` contains the full state, a typed reducer with all actions, and memoized helper functions
- Validation runs as a derived computation (`useMemo`) — errors recompute on every state change
- All action creators are `useCallback`-wrapped for render stability

### Project Structure

```
src/
├── components/
│   ├── Canvas.tsx        # React Flow canvas wrapper
│   ├── ConditionEdge.tsx # Custom edge with condition label
│   ├── FlowNode.tsx      # Custom node with start badge & error indicator
│   ├── JsonPreview.tsx   # JSON output, import, copy, download
│   ├── Sidebar.tsx       # Node property editor & edge management
│   └── Toolbar.tsx       # Top bar with add node, stats
├── store/
│   └── FlowContext.tsx   # Centralized state (reducer + context)
├── types/
│   └── index.ts          # TypeScript interfaces
├── utils/
│   └── jsonHighlight.ts  # JSON syntax highlighting
├── App.tsx               # Root layout composition
├── main.tsx              # Entry point
└── index.css             # Tailwind + custom styles
```

### Key Design Decisions

1. **Single source of truth**: The `FlowNode[]` array in context is the canonical state. React Flow's internal node/edge arrays are synced via `useEffect`, keeping data flow unidirectional.

2. **Validation as derived state**: Instead of imperative validation on submit, errors are computed on every render. This enables real-time inline feedback without user-triggered actions.

3. **Node ID renaming propagation**: When a node's ID changes, all edge references (`to_node_id`), the selected node tracking, and the start node reference update atomically in a single reducer action.

4. **Custom node/edge components**: Using React Flow's custom node and edge APIs allows full control over visual styling (start badge, error indicators, condition labels) while retaining all built-in interaction behaviors.

5. **No external state library**: For a project of this scope, Context + useReducer provides the right balance of simplicity and power without adding bundle weight.

## JSON Schema

```json
{
  "startNodeId": "node_1",
  "nodes": [
    {
      "id": "node_1",
      "name": "Start",
      "description": "Entry point",
      "edges": [
        {
          "to_node_id": "node_2",
          "condition": "user.age > 18",
          "parameters": {
            "redirect": "/dashboard"
          }
        }
      ]
    }
  ]
}
```

## License

MIT @Ashish Kumar 
