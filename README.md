# iPhone 3G System Metrics Monitor

A specialized web application designed to display system metrics on iPhone 3G using horizon charts. Optimized for the device's constraints including limited JavaScript support, small screen, and touch interface.

## Features

- 📱 **iPhone 3G Optimized**: ES5 JavaScript, touch-friendly interface, fullscreen web app
- 📊 **Horizon Charts**: Compact visualization showing trends across time
- 🔄 **Auto-refresh**: Updates every 15 seconds with visibility change detection
- 📈 **Logical Grouping**: Metrics organized by Compute → Memory → IO → Power
- 🎯 **Clean Interface**: Filtered and aggregated metrics for essential monitoring

## Quick Start

### Prerequisites
- Node.js installed on your system
- A metrics service running on `localhost:5555/metrics` (providing JSON metrics data)
- iPhone 3G connected to the same network

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```
   Server will run on `http://0.0.0.0:3000`

3. **Access from iPhone 3G**:
   - Find your computer's IP address (e.g., `192.168.1.100`)
   - Open Safari on iPhone 3G
   - Navigate to `http://192.168.1.100:3000`
   - Tap the share button and select "Add to Home Screen"
   - Launch from home screen for fullscreen experience

## Displayed Metrics

### Compute Group
- **E-CPU %**: Efficiency cores average utilization
- **P-CPU %**: Performance cores average utilization  
- **GPU %**: Graphics processor utilization
- **ANE %**: Apple Neural Engine utilization

### Memory Group
- **RAM used %**: Overall memory utilization
- **RAM wired %**: Locked memory percentage
- **Swap %**: Virtual memory usage (capped at 100% of RAM)

### IO Group
- **Network RX/TX**: Incoming/outgoing network traffic
- **Disk Read/Write**: Storage read/write activity

### Power Group
- **Power**: Total system power consumption

## Expected Data Format

The metrics service at `localhost:5555/metrics` should return JSON in this format:

```json
{
  "timestamp": null,
  "metrics": {
    "cpu": {
      "[4] E0-cluster total CPU util %": {
        "current_value": 25.5,
        "history": [23.1, 24.2, 25.5, ...],
        "count": 500
      }
    },
    "memory": {
      "RAM used": { "current_value": 8192, "history": [...] },
      "RAM used %": { "current_value": 75.2, "history": [...] },
      "RAM wired": { "current_value": 2048, "history": [...] }
    }
  }
}
```

## iPhone 3G Compatibility

This app is specifically designed for iPhone 3G limitations:

- **JavaScript**: ES5 only (no ES6+ features)
- **APIs**: XMLHttpRequest instead of fetch()
- **Touch**: Prevents unwanted scrolling/bouncing
- **Screen**: Optimized for 320×480 display
- **Network**: Accessible via local network (not localhost)

## Troubleshooting

### "Failed to load metrics data"
- Ensure metrics service is running on `localhost:5555/metrics`
- Check that both devices are on the same network
- Verify computer's IP address is correct

### JavaScript errors on iPhone 3G
- The app uses ES5-compatible code specifically for iPhone 3G
- If you see syntax errors, the device may not be iPhone 3G or iOS version is incompatible

### Network connectivity issues
- Ensure computer firewall allows connections on port 3000
- Try accessing `http://[computer-ip]:3000` from another device to test

## Development

See `CLAUDE.md` for technical documentation, architecture details, and development journey.

## License

See LICENSE file for details.