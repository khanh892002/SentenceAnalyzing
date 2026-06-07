import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXAMPLES_FILE = path.join(__dirname, 'data', 'examples.json');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const FASTAPI_URL = 'http://127.0.0.1:8000/analyze';

app.post('/analyze-sentence', async (req, res) => {
  console.log("Received request to analyze sentence");
  const { sentence } = req.body;
  if (!sentence || sentence.trim() === '') {
    return res.status(400).json({ error: 'Sentence input is required.' });
  }

  try {
    const response = await fetch(FASTAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sentence })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('FastAPI error:', errorData);
      return res.status(response.status).json({
        error: errorData.detail || 'Failed to analyze sentence.',
        details: errorData
      });
    }

    const analysis = await response.json();
    res.json(analysis);
    console.log("Response generated via FastAPI service");

  } catch (e) {
    console.error('Failed to communicate with FastAPI service:', e.message);
    res.status(500).json({ error: 'Internal server error while calling analysis service.' });
  }
});

app.get('/examples', async (req, res) => {
  try {
    const data = await fs.readFile(EXAMPLES_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to read examples:', error);
    res.status(500).json({ error: 'Failed to read examples data.' });
  }
});

app.post('/examples', async (req, res) => {
  try {
    const updatedExamples = req.body;
    await fs.writeFile(EXAMPLES_FILE, JSON.stringify(updatedExamples, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save examples:', error);
    res.status(500).json({ error: 'Failed to save examples data.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Node server is running on port ${port}`);
});
