import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

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
        error: 'Failed to analyze sentence.', 
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Node server is running on port ${port}`);
});
