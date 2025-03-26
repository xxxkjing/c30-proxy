// pages/api/proxy.js

import { addLog } from "../../lib/logs";

// 禁用 Next.js 自带的 bodyParser，确保我们可以手动读取原始请求体
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
  // 将当前请求记录到日志中
  addLog({
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: Date.now(),
  });

  // 从查询参数获取目标 URL，例如：/api/proxy?target=https://example.com/api
  const { target } = req.query;
  if (!target) {
    return res.status(400).json({ error: "缺少 target 查询参数" });
  }

  // 如果请求不是 GET/HEAD，则读取请求体（此处简单处理，不考虑大体积数据）
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await getRawBody(req);
    } catch (err) {
      return res.status(500).json({ error: "读取请求体失败: " + err.toString() });
    }
  }

  try {
    // 转发请求到 target URL
    const fetchResponse = await fetch(target, {
      method: req.method,
      // 可选择性转发头信息，但一般需去掉或修改 Host 等字段
      headers: { ...req.headers, host: new URL(target).host },
      body: body,
      // 请求重定向等选项可根据需求配置
      redirect: "manual",
    });

    // 将被代理的响应数据取出
    const responseBuffer = Buffer.from(await fetchResponse.arrayBuffer());

    // 将响应头复制（注意：有些头不适合直接复制）
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(fetchResponse.status).send(responseBuffer);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
