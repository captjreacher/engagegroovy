#!/usr/bin/env node

/**
 * Simple HTTP server for previewing site/ directory
 * This serves the real production site locally, NOT the Express app
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../site');
const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function servFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let filePath = path.join(SITE_DIR, req.url === '/' ? 'index.html' : req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(SITE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try adding .html
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (err2, stats2) => {
        if (err2 || !stats2.isFile()) {
          // Try 404.html
          const notFoundPath = path.join(SITE_DIR, '404.html');
          fs.stat(notFoundPath, (err3, stats3) => {
            if (err3 || !stats3.isFile()) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('404 Not Found');
            } else {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              servFile(res, notFoundPath);
            }
          });
        } else {
          servFile(res, htmlPath);
        }
      });
    } else {
      servFile(res, filePath);
    }
  });
});

// Check if site/ exists
if (!fs.existsSync(SITE_DIR)) {
  log('\n✗ ERROR: site/ directory not found!', '\x1b[31m');
  log('  You need to import the cPanel live site first.', '\x1b[33m');
  log('  Run: npm run import:cpanel-live\n', '\x1b[33m');
  process.exit(1);
}

// Check if site/ has files
const files = fs.readdirSync(SITE_DIR);
if (files.length === 0 || !files.includes('index.html')) {
  log('\n✗ ERROR: site/ directory is empty or missing index.html!', '\x1b[31m');
  log('  You need to import the cPanel live site first.', '\x1b[33m');
  log('  Run: npm run import:cpanel-live\n', '\x1b[33m');
  process.exit(1);
}

server.listen(PORT, () => {
  log('\n╔═══════════════════════════════════════════════════╗', '\x1b[36m');
  log('║       EngageGroovy Site Preview (cPanel)         ║', '\x1b[36m');
  log('╚═══════════════════════════════════════════════════╝\n', '\x1b[36m');
  log(`✓ Serving from: site/`, '\x1b[32m');
  log(`✓ Local preview: http://localhost:${PORT}`, '\x1b[32m');
  log(`\n  Press Ctrl+C to stop\n`, '\x1b[90m');
});
