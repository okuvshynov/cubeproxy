# iPhone 3G System Metrics Horizon Chart

## Project Overview

A web application specifically designed for iPhone 3G that displays system metrics from a local metrics service using horizon charts. The app is optimized for the iPhone 3G's constraints including limited JavaScript support, small screen (320×480px), and touch interface.

## Architecture

### Backend (Node.js/Express)
- **File**: `server.js` (306 lines)
- **Port**: 3000 (binds to 0.0.0.0 for network access)
- **Data Source**: Proxies localhost:5555/metrics
- **Key Features**:
  - Metric filtering and aggregation
  - CPU cluster averaging (E-clusters → E-CPU %, P-clusters → P-CPU %)
  - RAM percentage calculations (used %, wired %)
  - Swap percentage calculation with 100% cap
  - Logical metric ordering by system function

### Frontend (Pure HTML/CSS/JS)
- **File**: `public/index.html` (257 lines)
- **Compatibility**: iPhone 3G Safari (iOS 3.x)
- **Key Features**:
  - Canvas-based horizon charts
  - Touch event handling (prevents scrolling/bouncing)
  - Apple fullscreen web app meta tags
  - 15-second auto-refresh with visibility change detection
  - ES5-compatible JavaScript throughout

## Metric Processing Pipeline

### 1. Data Collection
Raw metrics collected from localhost:5555/metrics including:
- Individual CPU cores and cluster totals
- RAM metrics (used, used %, wired)
- Swap usage
- GPU/ANE utilization
- Network and disk I/O
- Component and total power

### 2. Filtering & Aggregation
- **Excluded**: Individual CPU cores, mock metrics, component power
- **Aggregated**: E-clusters averaged to E-CPU %, P-clusters to P-CPU %
- **Calculated**: RAM wired % from absolute values, Swap % relative to RAM

### 3. Logical Ordering
Metrics presented in hierarchical groups:
1. **Compute**: E-CPU %, P-CPU %, GPU %, ANE %
2. **Memory**: RAM used %, RAM wired %, Swap %
3. **IO**: Network RX/TX, Disk Read/Write
4. **Power**: Power (total system)

### 4. Visualization
- **Horizon Charts**: 32px height, 320px width
- **Technique**: True horizon chart with layered bands (default 4 bands)
- **Scaling**: 100% max for all percentage metrics, dynamic for others
- **Colors**: Green color scheme with increasing intensity per band:
  - Band 1: Light green (rgba(199, 233, 192, 0.8))
  - Band 2: Medium light green (rgba(161, 217, 155, 0.8))
  - Band 3: Medium green (rgba(116, 196, 118, 0.8))
  - Band 4: Dark green (rgba(49, 163, 84, 0.8))
- **Layout**: 15 metrics max, 32px + 1px border spacing
- **Data Display**: Shows latest 'width' points with 1-pixel-per-point rendering, right-aligned when fewer points available

## iPhone 3G Compatibility Measures

### JavaScript Compatibility
- **No ES6+**: var declarations, traditional functions, no arrow functions
- **No Modern APIs**: XMLHttpRequest instead of fetch(), no Promises
- **No Modern Methods**: indexOf() instead of includes(), apply() instead of spread
- **No Template Literals**: String concatenation only
- **No Default Parameters**: Manual parameter checking

### Mobile Optimization
- **Apple Meta Tags**: Fullscreen web app capability
- **Touch Handling**: Prevents unwanted scrolling/bouncing
- **Network Binding**: Server accessible from iPhone via local network
- **Viewport**: Fixed 320×480 dimensions
- **Font/Spacing**: Optimized for small screen readability

## Development Journey

The project evolved through systematic optimizations:

1. **Initial Implementation** (cbde930): Basic horizon chart with iPhone 3G meta tags
2. **Compatibility Fixes** (27112bd): Resolved ES6+ syntax issues for iPhone 3G
3. **Metric Filtering** (198937d): Removed mock/test data
4. **CPU Aggregation** (d56d24b): Averaged E/P clusters instead of individual cores
5. **Power Simplification** (6261d9f): Show only total power, not components
6. **RAM Transformation** (0a5536d): Converted to percentage-based display
7. **Visual Enhancement** (796d939): Increased row height for better visibility
8. **Swap Integration** (51ed44c): Added swap as percentage of RAM with 100% cap
9. **Final Organization** (11c031c): Renamed and logically ordered all metrics
10. **1-Pixel Rendering** (83c8eb9): Fixed stepX to 1 pixel per data point with right-alignment
11. **True Horizon Charts**: Implemented proper horizon chart technique with layered bands instead of simple gradient bars

## Key Technical Decisions

### Metric Scaling Strategy
- **CPU/GPU/ANE/RAM/Swap**: Fixed 100% scale for meaningful comparison
- **Network/Disk/Power**: Dynamic scaling based on historical maximum
- **Rationale**: Percentage metrics are more intuitive than absolute values

### Aggregation Strategy
- **CPU Clusters**: Average utilization across cores of same type
- **RAM Calculations**: Derive total RAM from used/used% ratio
- **Swap Capping**: Limit to 100% of RAM size for consistent visualization
- **Rationale**: Reduce information overload while preserving essential data

### Performance Optimizations
- **Server-side Processing**: Heavy calculations done on server, not iPhone 3G
- **Reduced Refresh Rate**: 15 seconds to accommodate slower network/processing
- **Efficient Rendering**: Canvas API for better performance than DOM manipulation
- **Memory Management**: Traditional JS patterns to avoid potential leaks

## Usage Patterns

### Target Use Case
Mobile system monitoring where:
- User needs quick overview of system health
- iPhone 3G is the available device
- Fullscreen usage via "Add to Home Screen"
- Monitoring sessions are brief but frequent

### Interpretation Guide
- **Compute Metrics**: Higher % = more processing load
- **Memory Metrics**: Higher % = more memory pressure
- **IO Metrics**: Peaks indicate data transfer activity
- **Power**: Higher values = more energy consumption

The horizon chart format allows quick visual scanning of trends and spikes across all system subsystems.

## Technical Debt & Future Considerations

### Current Limitations
- Limited to 15 metrics due to screen constraints
- iPhone 3G JavaScript limitations prevent modern optimizations
- Network-dependent (requires metrics service on localhost:5555)

### Potential Improvements
- Configurable metric selection
- Historical data persistence
- Alert thresholds for critical metrics
- Support for additional metric sources

However, these would need to maintain iPhone 3G compatibility constraints.