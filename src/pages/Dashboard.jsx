import { useState } from 'react';
import { analyzeSentence } from '../services/sentenceService';
import SentenceStructure from '../components/SentenceStructure';
import ExamplesList from '../components/ExamplesList';
import PosLegend from '../components/PosLegend';
import './Dashboard.css';

function Dashboard() {
  const [sentence, setSentence] = useState('');
  const [responseJSON, setResponseJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
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
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && sentence.trim()) {
        handleSubmit();
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
            <div className="result-container">
              <h3>Analysis Result:</h3>
              <div className="tree-scroll-container">
                <SentenceStructure data={responseJSON} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
