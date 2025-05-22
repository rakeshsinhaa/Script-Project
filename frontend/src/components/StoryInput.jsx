import { useState } from "react";
import axios from "axios";

const StoryInput = ({ onScriptGenerated }) => {
  const [storyline, setStoryline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!storyline.trim()) {
      setError("Please enter a storyline.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/api/generate-script", {
        storyline,
      });

      onScriptGenerated(response.data.script);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl text-center font-bold mb-4">Enter a Storyline</h2>

      <textarea
        className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., A young girl discovers a portal in her backyard that leads to another world..."
        value={storyline}
        onChange={(e) => setStoryline(e.target.value)}
      />

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Script "}
      </button>
    </div>
  );
};

export default StoryInput;
