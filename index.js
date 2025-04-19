const http = require('http');

const PORT = process.env.PORT || 2025;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(`Hello, your request has been received on port ${PORT}!\n`);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
