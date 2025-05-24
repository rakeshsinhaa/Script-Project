import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, Component } from "react";
import ReactMarkdown from "react-markdown";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in Markdown rendering:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <p className="text-red-500">Error rendering script. Please try again.</p>;
    }
    return this.props.children;
  }
}

// Utility to extract base64 data from Markdown image syntax
const extractBase64FromMarkdown = (text) => {
  const markdownImageRegex = /!\[.*?\]\((data:image\/[a-z]+;base64,[^\)]+)\)/g;
  const matches = text.match(markdownImageRegex) || [];
  console.log("Extracted markdown images:", matches); // Debug log
  return matches
    .map((match) => {
      const dataUriMatch = match.match(/data:image\/[a-z]+;base64,([^\)]+)/);
      return dataUriMatch ? `data:image/png;base64,${dataUriMatch[1]}` : null;
    })
    .filter(Boolean);
};

const ScriptViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const script = location.state?.script;

  // Redirect to home if no script was passed
  useEffect(() => {
    if (!script) {
      navigate("/");
    }
  }, [script, navigate]);

  if (!script) return null;

  // Handle plain string script (parse scenes and images)
  const renderScript = () => {
    if (Array.isArray(script)) {
      // Handle array of scene objects (unlikely, but kept for compatibility)
      return script.map((scene, index) => (
        <div
          key={index}
          className="mb-8 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm"
        >
          <ErrorBoundary>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap">
              <ReactMarkdown>{scene.text}</ReactMarkdown>
            </div>
            {scene.image_url && (
              <img
                src={scene.image_url}
                alt={`Scene ${index + 1}`}
                className="w-full max-w-md rounded-md shadow-md mt-4"
                onError={(e) => {
                  console.error(`Failed to load image for scene ${index + 1}:`, scene.image_url);
                  e.target.style.display = "none";
                }}
              />
            )}
          </ErrorBoundary>
        </div>
      ));
    }

    // Parse string script
    const images = extractBase64FromMarkdown(script);
    console.log("Final images:", images); // Debug log

    // Remove markdown image tags from script
    const cleanedScript = script.replace(/!\[.*?\]\([^\)]+\)/g, "").trim();

    // Split by scene headers (bold or plain: EXT., INT., CUT TO:, FADE OUT:)
    const sceneRegex = /((?:\*\*)?(?:EXT\.|INT\.|CUT TO:|FADE OUT:)[^\n]*(?:\*\*)?)/g;
    const sceneParts = cleanedScript.split(sceneRegex).filter(Boolean);
    console.log("Scene parts:", sceneParts); // Debug log

    // Merge headers with content
    const scenes = [];
    let currentHeader = null;
    let imageIndex = 0;
    for (let i = 0; i < sceneParts.length; i++) {
      if (sceneParts[i].match(sceneRegex)) {
        currentHeader = sceneParts[i].trim();
      } else if (currentHeader) {
        const imageSrc = images[imageIndex] || null;
        imageIndex++;
        const sceneText = sceneParts[i]?.trim() || "";
        scenes.push({
          header: currentHeader,
          text: sceneText,
          image: imageSrc,
        });
        currentHeader = null;
      }
    }

    console.log("Processed scenes:", scenes); // Debug log

    return scenes.length === 0 ? (
      <p className="text-gray-500">No scenes found in the script.</p>
    ) : (
      scenes.map((scene, index) => (
        <div
          key={index}
          className="mb-8 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm"
        >
          <h3 className="text-xl font-semibold text-blue-700 mb-2">{scene.header.replace(/\*\*/g, "")}</h3>
          <ErrorBoundary>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap">
              <ReactMarkdown>{scene.text}</ReactMarkdown>
            </div>
            {scene.image ? (
              <img
                src={scene.image}
                alt={`Scene ${index + 1}`}
                className="w-full max-w-md rounded-md shadow-md mt-4"
                onError={(e) => {
                  console.error(`Failed to load image for scene ${index + 1}:`, scene.image);
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <p className="text-gray-500 italic mt-2">No image available for this scene.</p>
            )}
          </ErrorBoundary>
        </div>
      ))
    );
  };

  // Download logic for plain text version of the script
  const handleDownload = () => {
    const text = Array.isArray(script)
      ? script.map((scene) => scene.text).join("\n\n")
      : script.replace(/!\[.*?\]\([^\)]+\)/g, "").trim();

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