import React from "react";

const ScriptDisplay = ({ script }) => {
  if (!script) return null;

  // Optional: split script by "Scene" or some consistent marker
  const scenes = script.split(/(Scene\s+\d+:)/g).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-gray-100 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4"> Generated Script</h2>

      {scenes.length > 1 ? (
        scenes.map((block, index) => {
          if (block.startsWith("Scene")) {
            return (
              <div key={index} className="mb-6">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">{block}</h3>
                <p className="whitespace-pre-wrap text-gray-800">
                  {scenes[index + 1] || ""}
                </p>
              </div>
            );
          }
          return null;
        })
      ) : (
        <p className="whitespace-pre-wrap text-gray-800">{script}</p>
      )}

      <button
        onClick={() => downloadScript(script)}
        className="mt-6 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
      >
        Save Script
      </button>
    </div>
  );
};

// Helper to download script as .txt
const downloadScript = (script) => {
  const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "generated_script.txt";
  link.click();
};

export default ScriptDisplay;
