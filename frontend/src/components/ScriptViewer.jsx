import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ScriptViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const script = location.state?.script;

  // Redirect if no script was passed
  useEffect(() => {
    if (!script) {
      navigate("/");
    }
  }, [script, navigate]);

  if (!script) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-center">Generated Script</h2>

      <div className="whitespace-pre-wrap p-4 border border-gray-300 rounded-md font-mono bg-gray-50 text-sm">
        {script}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => {
            const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "script.txt";
            a.click();
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Download Script
        </button>
      </div>
    </div>
  );
};

export default ScriptViewer;
