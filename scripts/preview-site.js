#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, '..');
const port = Number(process.env.PORT || 4176);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function resolveFile(urlPath) {
  if (urlPath === '/' || urlPath === '') {
    return path.join(root, 'index.html');
  }

  if (urlPath.startsWith('/games/') && !urlPath.endsWith('.html')) {
    const routed = path.join(root, `${urlPath}.html`);
    if (fs.existsSync(routed)) {
      return routed;
    }
  }

  const direct = path.join(root, urlPath);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    return direct;
  }

  return direct;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://localhost:${port}`);
  const filePath = resolveFile(requestUrl.pathname);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Preview server running at http://localhost:${port}/`);
});