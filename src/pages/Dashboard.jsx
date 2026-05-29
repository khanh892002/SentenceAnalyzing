import { useState } from 'react';
import { analyzeSentence } from '../services/sentenceService';
import SentenceStructure from '../components/SentenceStructure';
import './Dashboard.css';

function Dashboard() {
  const [sentence, setSentence] = useState('');
  const [responseJSON, setResponseJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!sentence.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const responseData = await analyzeSentence(sentence);
      setResponseJSON(responseData);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Sentence Structure Analyzer</h2>
      </div>
      
      <div className="analyzer-layout">
        <div className="left-panel">
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
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
          {loading && <div className="loading">Analyzing...</div>}
          {responseJSON && (
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
