import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

// Middleware to parse incoming JSON
app.use(bodyParser.json());

// Allow requests from the React Vite frontend
app.use(cors());

/**
 * Mock function to analyze a sentence and return structured JSON
 * In a real-world case, you might use an NLP library like 'compromise' or 'natural'
 */
function analyzeSentence(sentence) {
  // Example of a complex, nested sentence structure using the Node-based AST model
  return [
    { 
      "role": "np",
      "type": "phrase",
      "content": [
        { "role": "det", "type": "word", "text": "The" },
        { 
          "role": "adj", 
          "type": "phrase",
          "content": [
            { "role": "adv", "type": "word", "text": "extremely" },
            { "role": "adj", "type": "word", "text": "large" }
          ]
        },
        { "role": "punct", "type": "punctuation", "text": "," },
        { 
          "role": "adj", 
          "type": "phrase",
          "content": [
            { "role": "adv", "type": "word", "text": "beautifully" },
            { "role": "adj", "type": "word", "text": "decorated" }
          ]
        },
        { "role": "noun", "type": "word", "text": "house" }
      ]
    },
    { "role": "punct", "type": "punctuation", "text": "." },
    { "role": "gibberish", "type": "unknown", "text": "asdfghj", "error": "Unknown word" }
  ];
}

// Route to receive the sentence and respond with structured JSON
app.post('/analyze-sentence', (req, res) => {
  const { sentence } = req.body;
  // Validate input
  if (!sentence || sentence.trim() === '') {
    return res.status(400).json({ error: 'Sentence input is required.' });
  }

  // Analyze the sentence
  const analysis = analyzeSentence(sentence);
  // Return the structured JSON data
  res.json(analysis);
  console.log("responsed")
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
