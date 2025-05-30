import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StoryInput from "./components/StoryInput";
import ScriptViewer from "./components/ScriptViewer";
import Navbar from './components/Navbar'
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <div className="in-h-[200vh] p-6 pt-32  px-4">
        <h1 className="text-4xl text-center font-Doto text-gray-200 font-bold mb-1 ">StoryScript Generator</h1>
        <p className="text-white text-l text-center leading-relaxed font-Doto mb-6 mx-auto w-fit typing-effect">
          A long time ago, in a galaxy far, far away...
        </p>
        <Routes>
          <Route path="/" element={<StoryInput />} />
          <Route path="/script-viewer" element={<ScriptViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
