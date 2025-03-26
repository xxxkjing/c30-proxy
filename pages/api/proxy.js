// pages/api/proxy.js

import { addLog } from "../../lib/logs";

// 为了手动处理请求体，关闭 Next.js 内部的 bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

// 辅助函数：将 Readable stream 数据合并为 Buffer
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // 将请求详细信息记录到日志
  addLog({
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: Date.now(),
  });

  // 获取请求中的 target 与 path 参数
  const { target, path, ...restQuery } = req.query;
  // 首先尝试使用 query 参数中的 target，否则使用环境变量 TARGET_URL
  let targetUrl = target || process.env.TARGET_URL;
  if (!targetUrl) {
    return res.status(400).json({
      error: "缺少 target 参数，并且未设置环境变量 TARGET_URL 作为默认代理目标"
    });
  }

  // 如果包含 path 参数，则将其追加到目标 URL 后（注意处理斜杠）
  if (path) {
    if (targetUrl.endsWith("/")) {
      targetUrl = targetUrl.slice(0, -1);
    }
    if (!path.startsWith("/")) {
      targetUrl = targetUrl + "/" + path;
    } else {
      targetUrl = targetUrl + path;
    }
  }

  // 如果需要进一步转发 query 参数（除了 target 与 path 外）可在此步骤处理
  // 例如：将剩余的查询参数追加到目标 URL 上
  const queryKeys = Object.keys(restQuery);
  if (queryKeys.length > 0) {
    const urlObj = new URL(targetUrl);
    for (const key of queryKeys) {
      // 这里简单地添加所有剩余查询参数，实际可根据需求过滤或处理
      urlObj.searchParams.append(key, restQuery[key]);
    }
    targetUrl = urlObj.toString();
  }

  // 针对非 GET/HEAD 请求，读取请求体（以 Buffer 形式传递）
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await getRawBody(req);
    } catch (err) {
      return res.status(500).json({ error: "读取请求体失败: " + err.toString() });
    }
  }

  try {
    // 转发请求到目标服务器
    const fetchResponse = await fetch(targetUrl, {
      method: req.method,
      // 转发 headers 时可以去除或修改部分字段
      headers: { ...req.headers, host: new URL(targetUrl).host },
      body: body,
      redirect: "manual",
    });

    // 获取响应数据后返回给客户端
    const responseBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(fetchResponse.status).send(responseBuffer);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
