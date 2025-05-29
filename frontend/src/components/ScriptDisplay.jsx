import React from "react";
import ReactMarkdown from "react-markdown";

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

const ScriptDisplay = ({ script, images = [] }) => {
  if (!script || typeof script !== "string") {
    console.warn("No valid script provided");
    return <div className="text-red-600">No script provided</div>;
  }

  // Extract images from script if not provided separately
  const extractedImages = extractBase64FromMarkdown(script);
  const finalImages = images.length > 0 ? images : extractedImages;
  console.log("Final images:", finalImages); // Debug log

  // Remove markdown image tags from script to prevent rendering as text
  const cleanedScript = script.replace(/!\[.*?\]\([^\)]+\)/g, "").trim();

  // Split by scene headers (bold or plain: EXT., INT., CUT TO:, FADE OUT:)
  const sceneRegex = /((?:\*\*)?(?:EXT\.|INT\.|CUT TO:|FADE OUT:)[^\n]*(?:\*\*)?)/g;
  const sceneParts = cleanedScript.split(sceneRegex).filter(Boolean);
  console.log("Scene parts:", sceneParts); // Debug log

  // Merge headers with their content
  const scenes = [];
  let currentHeader = null;
  let imageIndex = 0;
  for (let i = 0; i < sceneParts.length; i++) {
    if (sceneParts[i].match(sceneRegex)) {
      currentHeader = sceneParts[i].trim();
    } else if (currentHeader) {
      // Assign image based on index, accounting for failed generations
      const imageSrc = finalImages[imageIndex] || null;
      imageIndex++; // Increment to align with next scene

      // Clean scene text
      const sceneText = sceneParts[i]?.trim() || "";

      scenes.push({
        header: currentHeader,
        text: sceneText,
        image: imageSrc,
      });
      currentHeader = null; // Reset header
    }
  }

  console.log("Processed scenes:", scenes); // Debug log

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 rounded-2xl shadow-md space-y-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Generated Script</h2>

      {scenes.length === 0 ? (
        <p className="text-gray-500">No scenes found in the script.</p>
      ) : (
        scenes.map((scene, index) => (
          <div key={index} className="bg-white rounded-xl shadow p-4 space-y-4">
            <h3 className="text-xl font-semibold text-blue-700">{scene.header.replace(/\*\*/g, "")}</h3>
            <ReactMarkdown className="prose prose-slate max-w-none whitespace-pre-wrap">
              {scene.text}
            </ReactMarkdown>
            {scene.image ? (
              <img
                src={scene.image}
                alt={`Scene ${index + 1}`}
                className="w-full max-w-md rounded-lg shadow-md"
                onError={(e) => {
                  console.error(`Failed to load image for scene ${index + 1}:`, scene.image);
                  e.target.style.display = "none"; // Hide broken image
                }}
              />
            ) : (
              <p className="text-gray-500 italic">No image available for this scene.</p>
            )}
          </div>
        ))
      )}

      <button
        onClick={() => downloadScript(script)}
        className="mt-6 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-all"
      >
        Save Script
      </button>
    </div>
  );
};

// Download only text
const downloadScript = (script) => {
  const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "generated_script.txt";
  link.click();
};

export default ScriptDisplay;