import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowProvider } from "./store/FlowContext";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import JsonPreview from "./components/JsonPreview";

function App() {
  const [showJson, setShowJson] = useState(true);

  return (
    <FlowProvider>
      <ReactFlowProvider>
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
          <Toolbar />
          <div className="flex flex-1 overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 relative">
              <Canvas />
              {/* Toggle JSON Panel */}
              <button
                onClick={() => setShowJson(!showJson)}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 text-[10px] font-medium bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
              >
                {showJson ? "Hide JSON" : "Show JSON"}
              </button>
            </div>

            {/* JSON Preview */}
            {showJson && (
              <div className="w-80">
                <JsonPreview />
              </div>
            )}

            {/* Sidebar */}
            <Sidebar />
          </div>
        </div>
      </ReactFlowProvider>
    </FlowProvider>
  );
}

export default App;
