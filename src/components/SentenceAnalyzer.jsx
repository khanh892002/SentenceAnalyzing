import { useState } from 'react';
import { analyzeSentence } from '../services/sentenceService';
import SentenceStructure from './SentenceStructure';

function SentenceAnalyzer() {
  const [sentence, setSentence] = useState('');
  const [responseJSON, setResponseJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
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
    <div className="sentence-analyzer">
      <div className="input-container">
        <input
          type="text"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Enter a sentence..."
          className="sentence-input"
        />
        <button onClick={handleSubmit} className="analyze-button">
          Analyze
        </button>
      </div>
      {loading && <div className="loading">Analyzing...</div>}
      {error && <div className="error">{error}</div>}
      {responseJSON && (
        <div className="result-container">
          <h2>Analysis Result:</h2>
          <SentenceStructure data={responseJSON} />
        </div>
      )}
    </div>
  );
}

export default SentenceAnalyzer; 