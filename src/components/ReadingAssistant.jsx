import { useState, useRef } from 'react';
import SentenceStructure from './SentenceStructure';
import ExportModal from './ExportModal';

function ReadingAssistant({ responseJSON, onSave, onReAnalyze, showSaveButton = true, showReAnalyzeButton = false }) {
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);
  const [isFlatMode, setIsFlatMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewMode, setViewMode] = useState('sentence'); // 'sentence' or 'document'
  const resultRef = useRef(null);

  const extractSentenceText = (node) => {
    if (!node) return "";
    let words = [];
    const traverse = (n) => {
      if (n.type === 'word' || (!n.content && n.text)) words.push(n.text);
      if (n.content) n.content.forEach(traverse);
    };
    traverse(node);
    let text = words.join(' ');
    text = text.replace(/ ([.,?!;:'"”\])}])/g, '$1');
    text = text.replace(/([\'"“\[({]) /g, '$1');
    return text;
  };

  const handleSentenceClick = (idx) => {
    setSelectedSentenceIndex(idx);
    if (viewMode === 'document') {
      const element = document.getElementById(`doc-sentence-${idx}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleCopyJSON = () => {
    if (responseJSON) {
      navigator.clipboard.writeText(JSON.stringify(responseJSON, null, 2))
        .then(() => alert('JSON copied to clipboard!'))
        .catch(err => console.error('Failed to copy JSON:', err));
    }
  };

  if (!responseJSON || responseJSON.length === 0) return null;

  return (
    <>
      <div className="reading-assistant-layout">
        <div className="reading-pane">
          {responseJSON.map((tree, idx) => (
            <span
              key={idx}
              className={`reading-sentence ${idx === selectedSentenceIndex ? 'active' : ''}`}
              onClick={() => handleSentenceClick(idx)}
            >
              {extractSentenceText(tree)}{" "}
            </span>
          ))}
        </div>
        <div className="analysis-pane result-container">
          <div className="result-header">
            <div className="result-header-top">
              <h3>Analysis Result:</h3>
              <div className="result-actions">
                {showSaveButton && <button onClick={onSave} className="action-button" style={{ backgroundColor: '#e67e22' }}>Save</button>}
                {showReAnalyzeButton && <button onClick={onReAnalyze} className="action-button" style={{ backgroundColor: '#2980b9' }}>Re-analyze</button>}
                <button onClick={handleCopyJSON} className="action-button">Copy JSON</button>
                <button onClick={() => setShowExportModal(true)} className="action-button">Export Image</button>
              </div>
            </div>
            <div className="view-toggles">
              <div className="segmented-control">
                <button 
                  type="button" 
                  className={`segmented-btn ${viewMode === 'sentence' ? 'active' : ''}`}
                  onClick={() => setViewMode('sentence')}
                >
                  Sentence
                </button>
                <button 
                  type="button" 
                  className={`segmented-btn ${viewMode === 'document' ? 'active' : ''}`}
                  onClick={() => setViewMode('document')}
                >
                  Document
                </button>
              </div>
              <label className="toggle-label">
                <input type="checkbox" checked={isFlatMode} onChange={(e) => setIsFlatMode(e.target.checked)} />
                <span>Flat Mode</span>
              </label>
              <label className="toggle-label">
                <input type="checkbox" checked={isFocusMode} onChange={(e) => setIsFocusMode(e.target.checked)} />
                <span>Focus Mode</span>
              </label>
            </div>
          </div>
          <div className="tree-scroll-container" ref={resultRef}>
            {viewMode === 'sentence' ? (
              <SentenceStructure data={[responseJSON[selectedSentenceIndex]]} isFlatMode={isFlatMode} isFocusMode={isFocusMode} />
            ) : (
              <div className="document-view-container">
                {responseJSON.map((tree, idx) => (
                  <div 
                    key={idx} 
                    id={`doc-sentence-${idx}`}
                    className={`document-sentence-card ${idx === selectedSentenceIndex ? 'highlighted' : ''}`}
                    onClick={() => setSelectedSentenceIndex(idx)}
                  >
                    <div className="document-sentence-header">
                      <h4>Sentence {idx + 1}</h4>
                      <span className="card-text-preview">{extractSentenceText(tree)}</span>
                    </div>
                    <div className="document-sentence-body">
                      <SentenceStructure data={[tree]} isFlatMode={isFlatMode} isFocusMode={isFocusMode} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showExportModal && (
        <ExportModal 
           data={viewMode === 'sentence' ? [responseJSON[selectedSentenceIndex]] : responseJSON} 
           isFlatMode={isFlatMode} 
           isFocusMode={isFocusMode} 
           onClose={() => setShowExportModal(false)} 
        />
      )}
    </>
  );
}

export default ReadingAssistant;
