import { useState } from "react";
import axios from "axios";

const StoryInput = ({ onScriptGenerated }) => {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [script, setScript] = useState("");
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateStory = async () => {
    if (!prompt.trim()) return setError("Enter a prompt to generate story.");
    setError("");
    setLoadingStory(true);
    try {
      const res = await axios.post("http://localhost:8000/api/generate-story", { prompt });
      setStory(res.data.story);
    } catch (err) {
      setError("Error generating story.");
    } finally {
      setLoadingStory(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!story.trim()) return setError("Story cannot be empty.");
    setError("");
    setLoadingScript(true);
    try {
      const res = await axios.post("http://localhost:8000/api/generate-script", { storyline: story });
      const result = res.data.script;
      setScript(result);
      onScriptGenerated(result); 
    } catch (err) {
      setError("Error generating script.");
    } finally {
      setLoadingScript(false);
    }
  };

  const download = (text, filename) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl text-center font-bold"> Generate Story from Prompt</h2>

      <textarea
        placeholder="Enter a short idea or theme..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-3 border rounded-md"
      />
      <button
        onClick={handleGenerateStory}
        disabled={loadingStory}
        className="bg-purple-600 text-white px-4 py-2 rounded-md"
      >
        {loadingStory ? "Generating..." : "Generate Story"}
      </button>

      <h2 className="text-xl text-center font-bold mt-6">Story</h2>
      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        className="w-full p-3 h-40 border rounded-md"
        placeholder="Or write your own story here..."
      />
      <div className="flex gap-4 mt-2">
        <button
          onClick={() => download(story, "story.txt")}
          className="bg-gray-700 text-white px-4 py-2 rounded-md"
        >
          Download Story
        </button>
        <button
          onClick={handleGenerateScript}
          disabled={loadingScript}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {loadingScript ? "Generating Script..." : "Generate Script"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {script && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2"> Generated Script</h2>
          <textarea
            className="w-full p-3 h-60 border rounded-md"
            value={script}
            readOnly
          />
          <button
            onClick={() => download(script, "script.txt")}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Download Script
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryInput;
