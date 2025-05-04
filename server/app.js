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
  // Example of a complex, nested sentence structure
  return [
    {
      {"text": "The"},
      {
        "adjective" : {
          "adverb" : "extremely",
          "text" : "large"
        }
      },
      {"punctuation" : ","},
      {
        "adjective" : {
          "adverb" : "beautifully",
          "text" : "decorated"
        }
      },
      {"object" : "house"},
      {"adverb" : "at the end of the street"},
      {"punctuation" : "."}
    }
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
