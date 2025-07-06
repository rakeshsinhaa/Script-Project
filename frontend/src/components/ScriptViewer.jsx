import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, Component, useState } from "react";
import ReactMarkdown from "react-markdown";
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';



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

// Function to process script text and apply formatting
const formatScriptText = (text) => {
  if (!text) return '';
  
  // Convert **text** to <strong>text</strong> for bold formatting
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Return the formatted text as HTML
  return formattedText;
};

// Component to render formatted script text
const FormattedScriptText = ({ text, isHeader = false }) => {
  const formattedText = formatScriptText(text);
  
  return (
    <div 
      className={`whitespace-pre-wrap transition-all duration-200 ${isHeader ? 'text-xl font-semibold text-blue-700' : 'text-sm'}`}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading script...</span>
  </div>
);

// Scene navigation component
const SceneNavigation = ({ scenes, currentScene, onSceneChange }) => {
  if (scenes.length <= 1) return null;
  
  return (
    <div className="sticky top-4 z-10 mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Scene Navigation</h3>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {scenes.map((scene, index) => (
          <button
            key={index}
            onClick={() => onSceneChange(index)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentScene === index
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            Scene {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

const ScriptViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const script = location.state?.script;
  
  // State for enhanced UX
  const [currentScene, setCurrentScene] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('scenes'); // 'scenes' or 'full'
  const [fontSize, setFontSize] = useState('normal'); // 'small', 'normal', 'large'
  const [showImages, setShowImages] = useState(true);

  // Redirect to home if no script was passed
  useEffect(() => {
    if (!script) {
      navigate("/");
    } else {
      // Simulate loading for better UX
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [script, navigate]);

  if (!script) return null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle plain string script (parse scenes and images)
  const renderScript = () => {
    if (Array.isArray(script)) {
      // Handle array of scene objects (unlikely, but kept for compatibility)
      return script.map((scene, index) => (
        <div
          key={index}
          className="mb-8 p-6 border border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ErrorBoundary>
            <div className={`prose prose-slate max-w-none ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
              <FormattedScriptText text={scene.text} />
            </div>
            {scene.image_url && showImages && (
              <div className="mt-4 relative group">
                <img
                  src={scene.image_url}
                  alt={`Scene ${index + 1}`}
                  className="w-full max-w-md rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.error(`Failed to load image for scene ${index + 1}:`, scene.image_url);
                    e.target.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
              </div>
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

    if (scenes.length === 0) {
      return <p className="text-gray-500 text-center py-8">No scenes found in the script.</p>;
    }

    // Scene-by-scene view
    if (viewMode === 'scenes' && scenes.length > 1) {
      const scene = scenes[currentScene];
      return (
        <>
          <SceneNavigation 
            scenes={scenes} 
            currentScene={currentScene} 
            onSceneChange={setCurrentScene} 
          />
          <div className="mb-8 p-6 border border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FormattedScriptText 
                text={scene.header.replace(/\*\*/g, "")} 
                isHeader={true} 
              />
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                {currentScene + 1} of {scenes.length}
              </span>
            </div>
            <ErrorBoundary>
              <div className={`prose prose-slate max-w-none mt-4 ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                <FormattedScriptText text={scene.text} />
              </div>
              {scene.image && showImages ? (
                <div className="mt-6 relative group">
                  <img
                    src={scene.image}
                    alt={`Scene ${currentScene + 1}`}
                    className="w-full max-w-md rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105 mx-auto"
                    onError={(e) => {
                      console.error(`Failed to load image for scene ${currentScene + 1}:`, scene.image);
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
                </div>
              ) : !scene.image && showImages ? (
                <p className="text-gray-400 italic mt-4 text-center bg-gray-100 py-4 rounded-lg">No image available for this scene.</p>
              ) : null}
            </ErrorBoundary>
            
            {/* Scene navigation buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
                disabled={currentScene === 0}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentScene(Math.min(scenes.length - 1, currentScene + 1))}
                disabled={currentScene === scenes.length - 1}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      );
    }

    // Full script view
    return scenes.map((scene, index) => (
      <div
        key={index}
        className="mb-8 p-6 border border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
        id={`scene-${index}`}
      >
        <FormattedScriptText 
          text={scene.header.replace(/\*\*/g, "")} 
          isHeader={true} 
        />
        <ErrorBoundary>
          <div className={`prose prose-slate max-w-none mt-2 ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
            <FormattedScriptText text={scene.text} />
          </div>
          {scene.image && showImages ? (
            <div className="mt-4 relative group">
              <img
                src={scene.image}
                alt={`Scene ${index + 1}`}
                className="w-full max-w-md rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.error(`Failed to load image for scene ${index + 1}:`, scene.image);
                  e.target.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
            </div>
          ) : !scene.image && showImages ? (
            <p className="text-gray-400 italic mt-2 text-center bg-gray-100 py-3 rounded-lg">No image available for this scene.</p>
          ) : null}
        </ErrorBoundary>
      </div>
    ));
  };

  // Fixed download logic for plain text version of the script
  const handleDownload = () => {
    try {
      let text = '';
      
      if (Array.isArray(script)) {
        // Handle array of scene objects
        text = script.map((scene) => scene.text || '').join("\n\n");
      } else {
        // Handle string script - clean it and format it properly
        text = script.replace(/!\[.*?\]\([^\)]+\)/g, "").trim();
        // Remove markdown formatting for plain text
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');
      }

      // Ensure we have some text to download
      if (!text || text.trim() === '') {
        alert('No script content to download');
        return;
      }

      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `script_${new Date().toISOString().slice(0, 10)}.txt`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

const triggerPDFDownload = async (includeImages) => {
  const originalShowImages = showImages;

  if (!includeImages) {
    setShowImages(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const node = document.querySelector(".script-content");
  if (!node) {
    alert("Unable to generate PDF. Content not found.");
    return;
  }

  try {
    const dataUrl = await domtoimage.toPng(node);

    const img = new Image();
    img.src = dataUrl;

    img.onload = () => {
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (img.height * pageWidth) / img.width;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const totalPages = Math.ceil(imgHeight / pageHeight);

      for (let i = 0; i < totalPages; i++) {
        const startY = (img.height / totalPages) * i;
        const sliceHeight = (img.height / totalPages);

        canvas.width = img.width;
        canvas.height = sliceHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          0,
          startY,
          img.width,
          sliceHeight,
          0,
          0,
          img.width,
          sliceHeight
        );

        const pageData = canvas.toDataURL("image/png");

        if (i > 0) pdf.addPage();
        pdf.addImage(pageData, "PNG", 0, 0, pageWidth, pageHeight);
      }

      pdf.save(`script-${includeImages ? "with-images" : "no-images"}.pdf`);
    };
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    if (!includeImages) {
      setShowImages(originalShowImages);
    }
  }
};


  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-800">Generated Script</h2>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('scenes')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'scenes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Scene View
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Full View
                </button>
              </div>

              {/* Font Size */}
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="small">Small Text</option>
                <option value="normal">Normal Text</option>
                <option value="large">Large Text</option>
              </select>

              {/* Toggle Images */}
              <button
                onClick={() => setShowImages(!showImages)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showImages ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showImages ? '🖼️ Hide Images' : '🖼️ Show Images'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              📄 Download TXT
            </button>

            <button
              onClick={() => triggerPDFDownload(false)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
            >
              📄 PDF (No Images)
            </button>

            <button
              onClick={() => triggerPDFDownload(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              🖼️ PDF (With Images)
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Script Content */}
        <div className="script-content">
          {/* Render scenes if array of objects, otherwise render plain script */}
          {Array.isArray(script) ? (
            script.map((scene, index) => (
              <div
                key={index}
                className="mb-8 p-6 bg-white border border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`font-mono mb-4 ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                  <FormattedScriptText text={scene.text} />
                </div>
                {scene.image_url && showImages && (
                  <div className="relative group">
                    <img
                      src={scene.image_url}
                      alt={`Scene ${index + 1}`}
                      className="w-full rounded-lg shadow-lg transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 bg-white border border-gray-300 rounded-xl font-serif shadow-lg">
              <div className={fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}>
                <FormattedScriptText text={script} />
              </div>
            </div>
          )}

          {/* Render parsed scenes */}
          {!Array.isArray(script) && renderScript()}
        </div>
      </div>

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .script-content { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
};

export default ScriptViewer;