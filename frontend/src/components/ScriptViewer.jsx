import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ScriptViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Can be either a plain string or an array of scene objects
  const script = location.state?.script;

  // Redirect to home if no script was passed
  useEffect(() => {
    if (!script) {
      navigate("/");
    }
  }, [script, navigate]);

  if (!script) return null;

  // Download logic for plain text version of the script
  const handleDownload = () => {
    const text = Array.isArray(script)
      ? script.map((scene) => scene.text).join("\n\n")
      : script;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "script.txt";
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-center">Generated Script</h2>

      {/* Render scenes if array of objects, otherwise render plain script */}
      {Array.isArray(script) ? (
        script.map((scene, index) => (
          <div
            key={index}
            className="mb-8 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm"
          >
            <pre className="whitespace-pre-wrap font-mono text-sm mb-4">{scene.text}</pre>
            {scene.image_url && (
              <img
                src={scene.image_url}
                alt={`Scene ${index + 1}`}
                className="w-full rounded-md shadow-md"
              />
            )}
          </div>
        ))
      ) : (
        <div className="whitespace-pre-wrap p-4 border border-gray-300 rounded-md font-mono bg-gray-50 text-sm">
          {script}
        </div>
      )}

      <div className="text-center mt-6">
        <button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Download Script
        </button>
      </div>
    </div>
  );
};

export default ScriptViewer;
