const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { v4: uuidv4 } = require('uuid');

const app = express();
let trafficLogs = [];

// 请求记录中间件
app.use((req, res, next) => {
  const sessionId = uuidv4();
  const record = {
    id: sessionId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    clientIP: req.headers['x-forwarded-for'] || req.ip,
    userAgent: req.headers['user-agent'],
    status: 'pending'
  };
  
  trafficLogs.push(record);
  req.sessionId = sessionId;
  next();
});

// 代理中间件
app.use(
  createProxyMiddleware({
    target: 'https://example.com', // 修改为实际目标网站
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      const record = trafficLogs.find(r => r.id === req.sessionId);
      if (record) record.status = 'proxied';
    },
    onProxyRes: (proxyRes, req, res) => {
      const record = trafficLogs.find(r => r.id === req.sessionId);
      if (record) {
        record.statusCode = proxyRes.statusCode;
        record.status = 'completed';
      }
    },
    onError: (err, req, res) => {
      const record = trafficLogs.find(r => r.id === req.sessionId);
      if (record) {
        record.status = 'error';
        record.error = err.message;
      }
      res.status(500).send('Proxy error');
    }
  })
);

module.exports = app;
