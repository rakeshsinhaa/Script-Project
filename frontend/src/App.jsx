import { useState } from "react";
import StoryInput from "./components/StoryInput";
import ScriptDisplay from "./components/ScriptDisplay";

function App() {
  const [script, setScript] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl text-center font-bold mb-6"> StoryScript Generator</h1>
      <StoryInput onScriptGenerated={setScript} />
      {script && <ScriptDisplay script={script} />}
    </div>
  );
}

export default App;
