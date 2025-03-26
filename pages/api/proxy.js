// pages/api/proxy.js

import { addLog } from "../../lib/logs";

// 为了手动处理请求体，此处禁用 Next.js 内置的 bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

// 辅助函数：聚合 Readable stream 中的数据为 Buffer
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // 将请求信息记录到日志中
  addLog({
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: Date.now(),
  });

  // 固定目标地址由环境变量 TARGET_URL 指定
  const targetUrl = process.env.TARGET_URL;
  if (!targetUrl) {
    return res.status(400).json({
      error:
        "未设置环境变量 TARGET_URL。请在 Vercel 控制台中配置 TARGET_URL 为目标地址，例如 https://example.com",
    });
  }

  // 对于非 GET/HEAD 请求，尝试读取请求体
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await getRawBody(req);
    } catch (err) {
      return res.status(500).json({ error: "读取请求体失败: " + err.toString() });
    }
  }

  try {
    // 发起转发请求。注意：这里不处理原始请求路径，始终以 TARGET_URL 为入口。
    const fetchResponse = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: new URL(targetUrl).host },
      body: body,
      redirect: "manual",
    });

    // 读取返回数据并转发给客户端
    const responseBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(fetchResponse.status).send(responseBuffer);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
