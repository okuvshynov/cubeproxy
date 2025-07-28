const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// API endpoint to fetch and filter metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const options = {
      hostname: 'localhost',
      port: 5555,
      path: '/metrics',
      method: 'GET',
    };

    const request = http.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const metrics = JSON.parse(data);
          const filteredMetrics = filterCpuMetrics(metrics);
          res.json(filteredMetrics);
        } catch (error) {
          res.status(500).json({ error: 'Failed to parse metrics data' });
        }
      });
    });

    request.on('error', (error) => {
      res.status(500).json({ error: 'Failed to fetch metrics' });
    });

    request.end();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

function filterCpuMetrics(data) {
  const allMetrics = data.metrics;
  const filtered = {};
  
  // Include all metric categories (cpu, gpu, memory, etc.)
  for (const [category, categoryMetrics] of Object.entries(allMetrics)) {
    for (const [key, value] of Object.entries(categoryMetrics)) {
      // Only exclude individual CPU cores (pattern 'cluster CPU <number>')
      if (!key.match(/cluster CPU \d+/)) {
        filtered[key] = value;
      }
    }
  }
  
  return {
    timestamp: data.timestamp,
    metrics: filtered
  };
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});