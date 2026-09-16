const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for all requests (configured to allow credentials and reflect origin)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-RamBhaji-Timestamp']
}));

// Body parser for JSON
app.use(express.json());

// Endpoint to log browser console messages directly in the Node terminal
app.post('/log-terminal', (req, res) => {
  const { message } = req.body;
  if (message) {
    console.log(message);
  }
  res.sendStatus(200);
});

// Proxy all requests to the real backend
app.use('/', createProxyMiddleware({
  target: 'https://rambhaji.backend.shreenari.com',
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    // Override backend headers to allow credentials and match requesting origin
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-RamBhaji-Timestamp';
  }
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[CORS Proxy] Running at http://localhost:${PORT}`);
  console.log(`[CORS Proxy] Forwarding to https://rambhaji.backend.shreenari.com`);
  console.log(`[CORS Proxy] Update your .env to EXPO_PUBLIC_API_BASE_URL=http://localhost:${PORT}/api`);
});
