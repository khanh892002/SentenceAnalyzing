import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
import './testing.css'

function App() {
  const [sentence, setSentence] = useState('')
  const [responseJSON, setResponseJSON] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/analyze-sentence', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ sentence })
      });
      const responseData = await response.json();
      setResponseJSON(responseData);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Hàm tính độ sâu tối đa của cấu trúc và lưu kết quả
  const calculateDepths = (part) => {
    if (typeof part !== 'object' || part === null) {
      return { depth: 0, children: {} };
    }
    
    const entries = Object.entries(part);
    if (entries.length === 0) {
      return { depth: 0, children: {} };
    }

    const children = {};
    let maxDepth = 0;

    // Tính độ sâu cho từng phần tử con
    entries.forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const childResult = calculateDepths(value);
        children[key] = childResult;
        maxDepth = Math.max(maxDepth, 1 + childResult.depth);
      }
    });

    return { depth: maxDepth, children };
  };

  const renderSentencePart = (part, index, depth = 0, depthMap = null) => {
    // Nếu part là một object có các thuộc tính lồng nhau
    if (typeof part === 'object' && part !== null) {
      const entries = Object.entries(part);
      const currentDepth = depthMap ? depthMap.depth : 0;
      
      return (
        <span 
          key={index} 
          className="sentence-part nested"
          style={{
            minHeight: `${(depth + currentDepth + 1) * 40}px`,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 10px'
          }}
        >
          {entries.map(([key, value], i) => {
            // Nếu value là một object, gọi đệ quy với depth tăng lên
            if (typeof value === 'object' && value !== null) {
              const childDepthMap = depthMap ? depthMap.children[key] : null;
              return (
                <span 
                  key={i} 
                  className="nested-part"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  {renderSentencePart(value, i, depth + 1, childDepthMap)}
                </span>
              );
            }
            // Nếu value là string, hiển thị trực tiếp
            return (
              <span 
                key={i} 
                className={`part ${key}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                {value}
              </span>
            );
          })}
        </span>
      );
    }
    // Nếu part là string, hiển thị trực tiếp
    return (
      <span 
        key={index} 
        className="sentence-part"
        style={{
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        {part}
      </span>
    );
  };

  return (<>
    <div className="container">
      <h1>Sentence Structure Analyzer</h1>
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
          <div className="sentence-structure">
            {responseJSON.map((part, index) => {
              const depthMap = calculateDepths(part);
              return renderSentencePart(part, index, 0, depthMap);
            })}
          </div>
        </div>
      )}
    </div>
  </>)
}

export default App
