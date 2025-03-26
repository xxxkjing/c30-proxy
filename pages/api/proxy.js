// pages/api/proxy.js

import { addLog } from "../../lib/logs";

// 为了手动获取原始请求体，禁用 Next.js 内置的 bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

// 辅助函数：将 Readable stream 中的数据合并为 Buffer
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // 记录请求信息（用于日志查看）
  addLog({
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: Date.now(),
  });

  // 始终使用环境变量 TARGET_URL 作为代理目标
  const targetUrl = process.env.TARGET_URL;
  if (!targetUrl) {
    return res.status(400).json({
      error:
        "请设置环境变量 TARGET_URL 为目标地址，例如 https://example.com",
    });
  }

  // 对于非 GET/HEAD 请求，读取请求体（以便转发请求）
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await getRawBody(req);
    } catch (err) {
      return res
        .status(500)
        .json({ error: "读取请求体失败: " + err.toString() });
    }
  }

  try {
    // 发起转发请求，忽略原始 URL，始终请求 TARGET_URL
    const fetchResponse = await fetch(targetUrl, {
      method: req.method,
      // 转发 headers 时可适当修改，例如 host 字段设置为目标主机
      headers: { ...req.headers, host: new URL(targetUrl).host },
      body: body,
      redirect: "manual",
    });

    // 读取响应数据，并将响应头原样返回给客户端
    const responseBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(fetchResponse.status).send(responseBuffer);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
