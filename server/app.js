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
