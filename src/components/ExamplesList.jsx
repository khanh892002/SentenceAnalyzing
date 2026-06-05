import { useState, useEffect } from 'react';
import './ExamplesList.css';
import { analyzeSentence } from '../services/sentenceService';

function ExamplesList({ onSelectExample }) {
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/examples.json')
      .then(res => res.json())
      .then(data => {
        setExamples(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load examples", err);
        setLoading(false);
      });
  }, []);

  const handleExampleClick = async (index) => {
    const exampleItem = examples[index];
    if (!exampleItem.example || exampleItem.example.trim() === "") return;

    // Set UI to loading state in Dashboard first by passing null result momentarily
    onSelectExample(exampleItem.example, "loading");

    // Check if result is empty
    if (!exampleItem.result || exampleItem.result.length === 0) {
      try {
        const result = await analyzeSentence(exampleItem.example);

        // Update local state
        const newExamples = [...examples];
        newExamples[index].result = result;
        setExamples(newExamples);

        onSelectExample(exampleItem.example, result);
      } catch (err) {
        console.error("Error analyzing example", err);
        onSelectExample(exampleItem.example, null);
      }
    } else {
      // Already has result, just use it
      onSelectExample(exampleItem.example, exampleItem.result);
    }
  };

  if (loading || examples.length === 0) return null;

  return (
    <div className="examples-list">
      <span className="examples-label">Try an example:</span>
      <div className="examples-chips">
        {examples.map((item, index) => (
          <button
            key={index}
            className="example-chip"
            onClick={() => handleExampleClick(index)}
          >
            {item.example.length > 30 ? item.example.substring(0, 30) + '...' : item.example}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ExamplesList;
