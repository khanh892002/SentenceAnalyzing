import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('/analyze-sentence', (req, res) => {
  console.log("Received request to analyze sentence");
  const { sentence } = req.body;
  if (!sentence || sentence.trim() === '') {
    return res.status(400).json({ error: 'Sentence input is required.' });
  }

  // Spawn python child process
  const pythonProcess = spawn('python', [path.join(__dirname, 'analyzer.py'), sentence]);

  let dataString = '';
  let errorString = '';

  // Capture stdout (JSON output from python)
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  // Capture stderr (Errors or print statements from python)
  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
  });

  // Handle process exit
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}: ${errorString}`);
      return res.status(500).json({ error: 'Failed to analyze sentence.', details: errorString });
    }

    try {
      const analysis = JSON.parse(dataString);
      res.json(analysis);
      console.log("Response generated via spaCy");
    } catch (e) {
      console.error('Failed to parse Python output:', dataString);
      res.status(500).json({ error: 'Invalid output from analysis script.' });
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
