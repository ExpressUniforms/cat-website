import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API: Config endpoint
app.get('/api/config', (req, res) => {
  console.log('[v0] /api/config hit');
  console.log('[v0] CAT_API_KEY:', process.env.CAT_API_KEY ? 'SET' : 'NOT SET');
  console.log('[v0] ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET');
  res.json({
    CAT_API_KEY: process.env.CAT_API_KEY || '',
    HAS_ANTHROPIC_KEY: !!process.env.ANTHROPIC_API_KEY,
  });
});

// API: Claude proxy endpoint
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not configured' } });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html for SPA-like behavior
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[v0] Server running on http://localhost:${PORT}`);
  console.log('[v0] Environment check on startup:');
  console.log('[v0] CAT_API_KEY:', process.env.CAT_API_KEY ? 'SET' : 'NOT SET');
  console.log('[v0] ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET');
});
