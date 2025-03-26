/*
  proxy.js
  一个支持 HTTP 和 HTTPS CONNECT 隧道请求的 Node.js 代理服务器。
  HTTP 请求始终转发到环境变量 TARGET_URL 指定的目标，
  而 CONNECT 请求则按照客户端请求的目标建立 TCP 隧道。
*/

const http = require("http");
const https = require("https");
const net = require("net");
const url = require("url");

// 使用环境变量 TARGET_URL 作为固定转发目标（仅对 HTTP 请求生效）
// 例如，在启动前设置： export TARGET_URL=https://example.com
const TARGET_URL = process.env.TARGET_URL;
if (!TARGET_URL) {
  console.error("ERROR: 请设置环境变量 TARGET_URL，例如：export TARGET_URL=https://example.com");
  process.exit(1);
}
const targetUrlObj = new url.URL(TARGET_URL);

/**
 * 处理普通 HTTP 请求
 * 将所有 HTTP 请求转发到 TARGET_URL 指定的目标地址，对请求路径不做覆盖。
 */
function handleHttpRequest(req, res) {
  // 配置转发选项
  const options = {
    hostname: targetUrlObj.hostname,
    port: targetUrlObj.port || (targetUrlObj.protocol === "https:" ? 443 : 80),
    path: req.url, // 这里可以根据需要固定为 targetUrlObj.pathname，但本示例保留原请求路径
    method: req.method,
    headers: { 
      ...req.headers,
      host: targetUrlObj.hostname // 设置 Host 头为目标主机
    }
  };

  // 根据目标使用 http 或 https 模块
  const forwardRequest = targetUrlObj.protocol === "https:" ? https.request : http.request;
  
  const proxyReq = forwardRequest(options, (proxyRes) => {
    // 将目标服务器返回的状态和头信息写回客户端
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("转发请求出错：", err);
    res.writeHead(500);
    res.end("转发请求出错: " + err.message);
  });

  // 将客户端请求体传递给目标服务器
  req.pipe(proxyReq, { end: true });
}

/**
 * 处理 CONNECT 请求，用于 HTTPS 隧道
 * 客户端发起 CONNECT 请求时，req.url 格式为 "目标主机:端口"，
 * 我们尝试与该目标建立 TCP 连接，建立成功后构建双向数据流通道。
 */
function handleConnectRequest(req, clientSocket, head) {
  // 从 req.url 中解析出 host 和 port
  const [host, port] = req.url.split(":");
  if (!host || !port) {
    clientSocket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    clientSocket.end();
    return;
  }
  
  // 建立与目标服务器的 TCP 连接
  const serverSocket = net.connect(port, host, () => {
    // 连接成功后，向客户端发送 200 状态码，表示隧道已建立
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    
    // 如果 CONNECT 请求中有多余数据（head），转发给目标服务器
    if (head && head.length) {
      serverSocket.write(head);
    }
    // 构建双向数据传输通道
    clientSocket.pipe(serverSocket);
    serverSocket.pipe(clientSocket);
  });

  serverSocket.on("error", (err) => {
    console.error("TCP 隧道错误：", err.message);
    clientSocket.write("HTTP/1.1 500 Connection Error\r\n\r\n");
    clientSocket.end();
  });
}

// 创建一个 HTTP 服务器，处理普通 HTTP 请求
const proxyServer = http.createServer(handleHttpRequest);

// 监听 CONNECT 方法，为 HTTPS 隧道服务
proxyServer.on("connect", (req, clientSocket, head) => {
  handleConnectRequest(req, clientSocket, head);
});

// 指定监听端口，建议设置为 80 或环境变量 PORT 指定的端口
const PORT = process.env.PORT || 80;
proxyServer.listen(PORT, () => {
  console.log(`代理服务器已启动，监听端口 ${PORT}`);
  console.log(`所有 HTTP 请求将转发到 ${TARGET_URL}`);
});
