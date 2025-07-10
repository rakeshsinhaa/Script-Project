import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import StoryInput from "./components/StoryInput";
import ScriptViewer from "./components/ScriptViewer";
import Navbar from './components/Navbar';
import ScrollToTop from "./components/ScrollToTop";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  return (
    <Router>
      <ScrollToTop />
      <Navbar />

      {/* ✅ Loader Overlay (blocks view, not execution) */}
      {globalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <LoadingSpinner message={loadingMessage} />
        </div>
      )}

      <div className="min-h-[125vh] p-6 pt-32 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-center font-Doto text-gray-200 font-bold mb-2">
          ScriptStory Generator
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-center text-white leading-relaxed font-Doto mb-6 mx-auto max-w-xl px-4 typing-effect">
          A long time ago, in a galaxy far, far away...
        </p>
        <Routes>
          <Route
            path="/"
            element={
              <StoryInput
                setGlobalLoading={setGlobalLoading}
                setLoadingMessage={setLoadingMessage}
              />
            }
          />
          <Route path="/script-viewer" element={<ScriptViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
