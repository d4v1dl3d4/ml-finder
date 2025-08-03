import express from 'express';
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve the frontend for all other routes (Express 5 compatible)
app.use((req, res) => {
  // Only serve index.html for GET requests that aren't static files
  if (req.method === 'GET' && !req.url.includes('.')) {
    res.sendFile(path.join(process.cwd(), 'public/index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend server running at http://localhost:${PORT}`);
});
