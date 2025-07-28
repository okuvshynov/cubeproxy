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
  
  // Collect E and P cluster metrics for aggregation
  const eClusters = {};
  const pClusters = {};
  
  // Include all metric categories (cpu, gpu, memory, etc.)
  for (const [category, categoryMetrics] of Object.entries(allMetrics)) {
    for (const [key, value] of Object.entries(categoryMetrics)) {
      // Check for E/P cluster patterns like "[4] E0-cluster total" or "[4] P1-cluster total"
      const eClusterMatch = key.match(/\[\d+\]\s+E(\d+)-cluster\s+total/);
      const pClusterMatch = key.match(/\[\d+\]\s+P(\d+)-cluster\s+total/);
      
      if (eClusterMatch) {
        // Store E-cluster data for aggregation
        eClusters[key] = value;
      } else if (pClusterMatch) {
        // Store P-cluster data for aggregation
        pClusters[key] = value;
      } else if (!key.match(/cluster CPU \d+/) && 
                 !key.startsWith('mock') && 
                 !key.startsWith('mock.test.value.count') &&
                 !key.match(/\[\d+\]\s+[EP]\d+-cluster\s+total/)) {
        // Include other metrics but exclude individual CPUs, mocks, and original E/P clusters
        filtered[key] = value;
      }
    }
  }
  
  // Aggregate E-clusters if any exist
  if (Object.keys(eClusters).length > 0) {
    filtered['CPU E-clusters avg %'] = aggregateClusters(eClusters);
  }
  
  // Aggregate P-clusters if any exist
  if (Object.keys(pClusters).length > 0) {
    filtered['CPU P-clusters avg %'] = aggregateClusters(pClusters);
  }
  
  return {
    timestamp: data.timestamp,
    metrics: filtered
  };
}

function aggregateClusters(clusters) {
  const clusterKeys = Object.keys(clusters);
  if (clusterKeys.length === 0) return null;
  
  // Get the history length from the first cluster
  const historyLength = clusters[clusterKeys[0]].history.length;
  const aggregatedHistory = new Array(historyLength).fill(0);
  
  // Sum all cluster values at each time point
  for (const cluster of Object.values(clusters)) {
    for (let i = 0; i < historyLength; i++) {
      aggregatedHistory[i] += cluster.history[i] || 0;
    }
  }
  
  // Calculate average for each time point
  const clusterCount = clusterKeys.length;
  for (let i = 0; i < historyLength; i++) {
    aggregatedHistory[i] /= clusterCount;
  }
  
  // Calculate current value (average of all current values)
  const currentSum = Object.values(clusters).reduce((sum, cluster) => 
    sum + (cluster.current_value || 0), 0);
  const currentAvg = currentSum / clusterCount;
  
  return {
    current_value: currentAvg,
    history: aggregatedHistory,
    count: historyLength
  };
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});