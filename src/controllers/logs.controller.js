const socketLoggerService = require('../services/socketLogger.service');

/**
 * Serve the log viewer UI with Socket.IO client
 */
exports.getLogViewer = (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Log Viewer - Real-time Monitoring</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: #667eea;
            font-size: 28px;
            margin-bottom: 8px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-card .label {
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .stat-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }

        .controls {
            background: white;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: center;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #f56565;
            color: white;
        }

        .btn-danger:hover {
            background: #e53e3e;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #edf2f7;
            color: #4a5568;
        }

        .btn-secondary:hover {
            background: #e2e8f0;
        }

        .filter-input {
            padding: 10px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            flex: 1;
            min-width: 200px;
        }

        .filter-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .status.connected {
            background: #c6f6d5;
            color: #2f855a;
        }

        .status.disconnected {
            background: #fed7d7;
            color: #c53030;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .logs-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .log-entry {
            padding: 16px 20px;
            border-bottom: 1px solid #edf2f7;
            transition: background 0.3s ease;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .log-entry:hover {
            background: #f7fafc;
        }

        .log-entry.success {
            border-left: 4px solid #48bb78;
        }

        .log-entry.error {
            border-left: 4px solid #f56565;
            background: #fff5f5;
        }

        .log-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .log-method {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
            margin-right: 8px;
        }

        .method-GET { background: #bee3f8; color: #2c5282; }
        .method-POST { background: #c6f6d5; color: #2f855a; }
        .method-PUT { background: #fbd38d; color: #975a16; }
        .method-DELETE { background: #fed7d7; color: #c53030; }
        .method-PATCH { background: #e9d8fd; color: #6b46c1; }

        .log-url {
            font-weight: 600;
            color: #2d3748;
            word-break: break-all;
        }

        .log-meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 12px;
            color: #718096;
        }

        .log-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .log-details {
            margin-top: 12px;
            background: #f7fafc;
            border-radius: 8px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            display: none;
        }

        .log-details.show {
            display: block;
        }

        .log-details pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #2d3748;
        }

        .log-section {
            margin-bottom: 12px;
        }

        .log-section-title {
            font-weight: 700;
            color: #4a5568;
            margin-bottom: 6px;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #a0aec0;
        }

        .empty-state svg {
            width: 80px;
            height: 80px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .toggle-details {
            cursor: pointer;
            color: #667eea;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
            display: inline-block;
        }

        .toggle-details:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 22px;
            }
            
            .controls {
                flex-direction: column;
            }
            
            .filter-input, .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Log Viewer</h1>
            <p>Real-time monitoring powered by Socket.IO</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="label">Total Requests</div>
                <div class="value" id="totalRequests">0</div>
            </div>
            <div class="stat-card">
                <div class="label">Successful</div>
                <div class="value" style="color: #48bb78;" id="successCount">0</div>
            </div>
            <div class="stat-card">
                <div class="label">Errors</div>
                <div class="value" style="color: #f56565;" id="errorCount">0</div>
            </div>
            <div class="stat-card">
                <div class="label">Avg Response Time</div>
                <div class="value" style="color: #667eea; font-size: 24px;" id="avgTime">0ms</div>
            </div>
        </div>

        <div class="controls">
            <span class="status disconnected" id="connectionStatus">
                <span class="status-dot"></span>
                Connecting...
            </span>
            <input type="text" id="filterInput" class="filter-input" placeholder="Filter by URL, method, or status...">
            <button class="btn btn-secondary" id="pauseBtn">⏸️ Pause</button>
            <button class="btn btn-primary" id="exportBtn">💾 Export Logs</button>
            <button class="btn btn-danger" id="clearBtn">🗑️ Clear</button>
        </div>

        <div class="logs-container" id="logsContainer">
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Waiting for API requests...</p>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        let logs = [];
        let isPaused = false;
        let filterText = '';
        let socket = null;
        let totalRequests = 0;
        let successCount = 0;
        let errorCount = 0;
        let totalDuration = 0;

        const logsContainer = document.getElementById('logsContainer');
        const filterInput = document.getElementById('filterInput');
        const pauseBtn = document.getElementById('pauseBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        const connectionStatus = document.getElementById('connectionStatus');

        // Connect to Socket.IO
        function connect() {
            socket = io();

            socket.on('connect', () => {
                console.log('✅ Connected to Socket.IO');
                connectionStatus.className = 'status connected';
                connectionStatus.innerHTML = '<span class="status-dot"></span> Connected';
            });

            socket.on('disconnect', () => {
                console.log('❌ Disconnected from Socket.IO');
                connectionStatus.className = 'status disconnected';
                connectionStatus.innerHTML = '<span class="status-dot"></span> Disconnected';
            });

            // Receive initial logs
            socket.on('init', (initialLogs) => {
                console.log('📥 Received', initialLogs.length, 'initial logs');
                logs = initialLogs.reverse(); // Most recent first
                initialLogs.forEach(log => updateStats(log));
                renderLogs();
            });

            // Receive new log
            socket.on('log', (log) => {
                if (!isPaused) {
                    console.log('📨 New log:', log.request.method, log.request.url);
                    logs.unshift(log);
                    updateStats(log);
                    renderLogs();
                }
            });

            // Clear event
            socket.on('clear', () => {
                logs = [];
                totalRequests = 0;
                successCount = 0;
                errorCount = 0;
                totalDuration = 0;
                updateStatsDisplay();
                renderLogs();
            });
        }

        function updateStats(log) {
            totalRequests++;
            if (log.type === 'success') {
                successCount++;
            } else {
                errorCount++;
            }
            
            const durationMs = parseInt(log.duration);
            if (!isNaN(durationMs)) {
                totalDuration += durationMs;
            }
            updateStatsDisplay();
        }

        function updateStatsDisplay() {
            document.getElementById('totalRequests').textContent = totalRequests;
            document.getElementById('successCount').textContent = successCount;
            document.getElementById('errorCount').textContent = errorCount;
            
            const avgTime = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;
            document.getElementById('avgTime').textContent = avgTime + 'ms';
        }

        function renderLogs() {
            const filteredLogs = logs.filter(log => {
                if (!filterText) return true;
                const searchText = filterText.toLowerCase();
                return (
                    log.request.url.toLowerCase().includes(searchText) ||
                    log.request.method.toLowerCase().includes(searchText) ||
                    log.response.statusCode.toString().includes(searchText)
                );
            });

            if (filteredLogs.length === 0) {
                logsContainer.innerHTML = '<div class="empty-state"><p>' + 
                    (filterText ? 'No logs match your filter' : 'Waiting for API requests...') + 
                    '</p></div>';
                return;
            }

            logsContainer.innerHTML = filteredLogs.map(log => {
                const queryHtml = log.request.query && Object.keys(log.request.query).length > 0 ? 
                    '<div class="log-section"><div class="log-section-title">Query Params</div><pre>' + 
                    JSON.stringify(log.request.query, null, 2) + '</pre></div>' : '';
                
                const bodyHtml = log.request.body && Object.keys(log.request.body).length > 0 ? 
                    '<div class="log-section"><div class="log-section-title">Request Body</div><pre>' + 
                    JSON.stringify(log.request.body, null, 2) + '</pre></div>' : '';
                
                const ipHtml = log.request.ip ? 
                    '<div class="log-section"><div class="log-section-title">Client Info</div><pre>IP: ' + 
                    log.request.ip + '\\nUser-Agent: ' + (log.request.headers['user-agent'] || 'N/A') + '</pre></div>' : '';

                return '<div class="log-entry ' + log.type + '" data-id="' + log.id + '">' +
                    '<div class="log-header">' +
                        '<div>' +
                            '<span class="log-method method-' + log.request.method + '">' + log.request.method + '</span>' +
                            '<span class="log-url">' + log.request.url + '</span>' +
                        '</div>' +
                        '<div class="log-meta">' +
                            '<span>📊 ' + log.response.statusCode + '</span>' +
                            '<span>⏱️ ' + log.duration + '</span>' +
                            '<span>🕐 ' + new Date(log.timestamp).toLocaleTimeString() + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<a class="toggle-details" onclick="toggleDetails(' + log.id + ')">View Details</a>' +
                    '<div class="log-details" id="details-' + log.id + '">' +
                        queryHtml +
                        bodyHtml +
                        '<div class="log-section"><div class="log-section-title">Response</div><pre>' + 
                        JSON.stringify(log.response.body, null, 2) + '</pre></div>' +
                        ipHtml +
                    '</div>' +
                '</div>';
            }).join('');
        }

        window.toggleDetails = function(logId) {
            const detailsEl = document.getElementById('details-' + logId);
            if (detailsEl) {
                detailsEl.classList.toggle('show');
            }
        };

        // Event listeners
        filterInput.addEventListener('input', (e) => {
            filterText = e.target.value;
            renderLogs();
        });

        pauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            pauseBtn.innerHTML = isPaused ? '▶️ Resume' : '⏸️ Pause';
        });

        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(logs, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'api-logs-' + new Date().toISOString() + '.json';
            link.click();
        });

        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all logs?')) {
                fetch('/logs/clear', { method: 'POST' })
                    .then(() => console.log('Logs cleared'))
                    .catch(err => console.error('Failed to clear logs:', err));
            }
        });

        // Start connection
        connect();
    </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

/**
 * Get all logs as JSON
 */
exports.getLogs = (req, res) => {
  const logs = socketLoggerService.getLogs();
  res.json({
    status: 'success',
    count: logs.length,
    data: logs
  });
};

/**
 * Clear all logs
 */
exports.clearLogs = (req, res) => {
  socketLoggerService.clearLogs();
  res.json({
    status: 'success',
    message: 'Logs cleared successfully'
  });
};
