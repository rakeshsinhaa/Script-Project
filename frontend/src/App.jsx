import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StoryInput from "./components/StoryInput";
import ScriptViewer from "./components/ScriptViewer";
import Navbar from './components/Navbar'
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
        <Navbar/>
      <div className="min-h-screen bg-gray-50 p-6 pt-32 px-4">
        <h1 className="text-4xl text-center font-bold mb-6">StoryScript Generator</h1>
        <Routes>
          <Route path="/" element={<StoryInput />} />
          <Route path="/script-viewer" element={<ScriptViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
