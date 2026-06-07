import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeSentence } from '../services/sentenceService';
import SentenceStructure from '../components/SentenceStructure';
import ExamplesList from '../components/ExamplesList';
import PosLegend from '../components/PosLegend';
import { auth, db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './Dashboard.css';

function Dashboard() {
  const [sentence, setSentence] = useState('');
  const [responseJSON, setResponseJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);
  const [isFlatMode, setIsFlatMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  const handleSubmit = async () => {
    let finalSentence = sentence.trim();
    if (!finalSentence) return;

    // Kiểm tra và tự động thêm dấu chấm nếu thiếu ký hiệu kết thúc câu
    if (!/[.?!…]$/.test(finalSentence)) {
      finalSentence += '.';
      setSentence(finalSentence);
    }

    try {
      setLoading(true);
      setError(null);
      const responseData = await analyzeSentence(finalSentence);
      setResponseJSON(responseData);
      setSelectedSentenceIndex(0);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred. Please try again later.');
    } finally setLoading(false);
  };

  const handleSelectExample = (exSentence, exResult) => {
    setSentence(exSentence);
    if (exResult === "loading") {
      setLoading(true);
      setError(null);
      setResponseJSON(null);
    } else {
      setLoading(false);
      if (exResult === null) {
        setError('Failed to analyze example sentence.');
        setResponseJSON(null);
      } else {
        setError(null);
        setResponseJSON(exResult);
        setSelectedSentenceIndex(0);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && sentence.trim()) handleSubmit();
    }
  };

  const [previewImage, setPreviewImage] = useState(null);
  const resultRef = useRef(null);

  const handleCopyJSON = () => {
    if (responseJSON) {
      navigator.clipboard.writeText(JSON.stringify(responseJSON, null, 2))
        .then(() => alert('JSON copied to clipboard!'))
        .catch(err => console.error('Failed to copy JSON:', err));
    }
  };

  const handleExportImageClick = async () => {
    if (resultRef.current) {
      try {
        const { toPng } = await import('html-to-image');
        // Get current color scheme
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const bgColor = isDark ? '#2c2c2c' : '#ffffff';

        const dataUrl = await toPng(resultRef.current, { backgroundColor: bgColor });
        setPreviewImage(dataUrl);
      } catch (err) {
        console.error('Failed to export image:', err);
      }
    }
  };

  const handleDownloadImage = () => {
    if (previewImage) {
      const link = document.createElement('a');
      link.download = 'sentence-analysis.png';
      link.href = previewImage;
      link.click();
      setPreviewImage(null);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!user) {
      if (window.confirm('You must be logged in to save analyses. Go to login page?')) {
        navigate('/login');
      }
      return;
    }

    if (responseJSON && sentence) {
      try {
        await addDoc(collection(db, 'analyses'), {
          uid: user.uid,
          sentence: sentence,
          result: responseJSON,
          createdAt: serverTimestamp()
        });
        alert('Analysis saved successfully!');
      } catch (err) {
        console.error('Failed to save analysis', err);
        alert('Failed to save analysis. See console for details.');
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Sentence Structure Analyzer</h2>
      </div>

      <PosLegend />
      <ExamplesList onSelectExample={handleSelectExample} />

      <div className="analyzer-layout">
        <div className="left-panel">
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a sentence or paragraph here to analyze..."
            className="sentence-textarea"
          />
        </div>

        <div className="center-panel">
          <button onClick={handleSubmit} className="analyze-button" disabled={loading || !sentence.trim()}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div className="right-panel">
          {error && <div className="error">{error}</div>}
          {!responseJSON && !error && !loading && (
            <div className="placeholder-result">
              Analysis results will appear here.
            </div>
          )}
          {loading && (
            <div className="skeleton-container">
              <div className="skeleton-line short"></div>
              <div className="skeleton-box"></div>
              <div className="skeleton-line medium" style={{ marginLeft: '20px' }}></div>
              <div className="skeleton-box" style={{ marginLeft: '40px' }}></div>
              <div className="skeleton-line long" style={{ marginLeft: '20px' }}></div>
            </div>
          )}
          {responseJSON && !loading && (
            <div className="reading-assistant-layout">
              <div className="reading-pane">
                {responseJSON.map((tree, idx) => (
                  <span
                    key={idx}
                    className={`reading-sentence ${idx === selectedSentenceIndex ? 'active' : ''}`}
                    onClick={() => setSelectedSentenceIndex(idx)}
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
                      <button onClick={handleSaveAnalysis} className="action-button" style={{ backgroundColor: '#e67e22' }}>Save</button>
                      <button onClick={handleCopyJSON} className="action-button">Copy JSON</button>
                      <button onClick={handleExportImageClick} className="action-button">Export Image</button>
                    </div>
                  </div>
                  <div className="view-toggles">
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
                  <SentenceStructure data={[responseJSON[selectedSentenceIndex]]} isFlatMode={isFlatMode} isFocusMode={isFocusMode} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewImage && (
        <div className="modal-overlay">
          <div className="modal-content image-preview-modal">
            <h3>Image Preview</h3>
            <img src={previewImage} alt="Analysis Preview" className="preview-image" />
            <div className="modal-actions">
              <button onClick={() => setPreviewImage(null)} className="cancel-button">Cancel</button>
              <button onClick={handleDownloadImage} className="download-button">Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
