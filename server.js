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
  
  // Collect RAM metrics for processing
  let ramUsed = null;
  let ramUsedPercent = null;
  let ramWired = null;
  
  // Include all metric categories (cpu, gpu, memory, etc.)
  for (const [category, categoryMetrics] of Object.entries(allMetrics)) {
    for (const [key, value] of Object.entries(categoryMetrics)) {
      // Collect RAM metrics for later processing
      if (key === 'RAM used') {
        ramUsed = value;
      } else if (key === 'RAM used %') {
        ramUsedPercent = value;
      } else if (key === 'RAM wired') {
        ramWired = value;
      }
      
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
                 !key.match(/\[\d+\]\s+[EP]\d+-cluster\s+total/) &&
                 !(key.endsWith(' power') && key !== 'total power') &&
                 key !== 'RAM used' && key !== 'RAM wired') {
        // Include other metrics but exclude individual CPUs, mocks, original E/P clusters, component power (except total), and RAM metrics we'll process
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
  
  // Process RAM metrics
  if (ramUsed && ramUsedPercent && ramWired) {
    // Calculate total RAM from used RAM and used percentage
    // total = used / (used% / 100)
    const totalRam = calculateTotalRam(ramUsed, ramUsedPercent);
    
    // Add RAM used % (already exists, just ensure it's included)
    if (ramUsedPercent) {
      filtered['RAM used %'] = ramUsedPercent;
    }
    
    // Calculate and add RAM wired %
    const ramWiredPercent = calculateRamWiredPercent(ramWired, totalRam);
    if (ramWiredPercent) {
      filtered['RAM wired %'] = ramWiredPercent;
    }
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

function calculateTotalRam(ramUsed, ramUsedPercent) {
  // Calculate total RAM for each point in history
  const historyLength = ramUsed.history.length;
  const totalHistory = new Array(historyLength);
  
  for (let i = 0; i < historyLength; i++) {
    const used = ramUsed.history[i] || 0;
    const usedPercent = ramUsedPercent.history[i] || 0;
    if (usedPercent > 0) {
      totalHistory[i] = used / (usedPercent / 100);
    } else {
      totalHistory[i] = 0;
    }
  }
  
  // Calculate current total
  const currentUsed = ramUsed.current_value || 0;
  const currentUsedPercent = ramUsedPercent.current_value || 0;
  const currentTotal = currentUsedPercent > 0 ? currentUsed / (currentUsedPercent / 100) : 0;
  
  return {
    current: currentTotal,
    history: totalHistory
  };
}

function calculateRamWiredPercent(ramWired, totalRam) {
  const historyLength = ramWired.history.length;
  const wiredPercentHistory = new Array(historyLength);
  
  // Calculate wired percentage for each point in history
  for (let i = 0; i < historyLength; i++) {
    const wired = ramWired.history[i] || 0;
    const total = totalRam.history[i] || 0;
    if (total > 0) {
      wiredPercentHistory[i] = (wired / total) * 100;
    } else {
      wiredPercentHistory[i] = 0;
    }
  }
  
  // Calculate current wired percentage
  const currentWired = ramWired.current_value || 0;
  const currentTotal = totalRam.current || 0;
  const currentWiredPercent = currentTotal > 0 ? (currentWired / currentTotal) * 100 : 0;
  
  return {
    current_value: currentWiredPercent,
    history: wiredPercentHistory,
    count: historyLength
  };
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});