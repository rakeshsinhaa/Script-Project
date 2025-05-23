import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StoryInput from "./components/StoryInput";
import ScriptViewer from "./components/ScriptViewer";
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
        <Navbar/>
      <div className="min-h-screen bg-gray-50 p-6">
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
