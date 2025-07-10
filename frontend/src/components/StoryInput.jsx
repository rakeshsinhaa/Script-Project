import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const StoryInput = ({ setGlobalLoading, setLoadingMessage }) => {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleGenerateStory = async () => {
    if (!prompt.trim()) return setError("Enter a prompt to generate story.");
    setError("");
    setLoadingMessage("Generating story...");
    setGlobalLoading(true);
    try {
      const res = await api.post("/api/generate-story", { prompt });
      setStory(res.data.story);
    } catch (err) {
      console.error("Story generation error:", err.response?.data || err.message);
      setError("Error generating story.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!story.trim()) return setError("Story cannot be empty.");
    setError("");
    setLoadingMessage("Generating script...");
    setGlobalLoading(true);
    try {
      const res = await api.post("/api/generate-script", { storyline: story });

      navigate("/script-viewer", { state: { script: res.data.script } });
    } catch (err) {
      setError("Error generating script.");
    } finally {
      setGlobalLoading(false);
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
    <div className="max-w-3xl mx-auto space-y-2 p-6 bg-slate-500 rounded-2xl shadow-md">
      <h2 className="text-2xl text-center font-Doto text-white font-bold">Generate Story from Prompt</h2>

      <textarea
        placeholder="Enter a short idea or theme..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-48 p-4 border bg-white border-gray-300 rounded-2xl shadow-sm resize-none overflow-y-scroll hide-scrollbar focus:outline-none focus:ring-2 focus:ring-cyan-900 focus:border-cyan-900 font-Doto "
      />
      <button
        onClick={handleGenerateStory}
        className="bg-slate-700 font-Doto hover:bg-slate-600 text-white px-4 py-2 rounded-md"
      >
        Generate Story
      </button>

      <h2 className="text-2xl font-Doto text-center text-white font-bold mt-6">Story</h2>
      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        className="w-full h-48 p-4 border bg-white border-gray-300 rounded-2xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-900 focus:border-cyan-900 font-Doto overflow-y-scroll hide-scrollbar"
        placeholder="Or write your own story here..."
      />
      <div className="flex gap-4 mt-2">
        <button
          onClick={() => download(story, "story.txt")}
          className="bg-slate-700 font-Doto hover:bg-slate-600 text-white px-4 py-2 rounded-md"
        >
          Download Story
        </button>
        <button
          onClick={handleGenerateScript}
          className="bg-slate-700 font-Doto hover:bg-slate-600 text-white px-4 py-2 rounded-md"
        >
          Generate Script
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default StoryInput;
