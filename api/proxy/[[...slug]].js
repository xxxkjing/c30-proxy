import { createProxyMiddleware } from 'http-proxy-middleware';
import { sql } from '@vercel/postgres';

const SAFE_HEADERS = ['user-agent', 'accept', 'accept-encoding', 'connection'];

export default async function handler(req, res) {
  // 处理预检请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 解析目标地址
  const [targetDomain, ...pathParts] = req.query.slug || [];
  const targetPath = `/${pathParts.join('/')}`;
  
  if (!targetDomain) {
    return res.status(400).json({ error: 'Missing target domain' });
  }

  // 记录请求到数据库
  try {
    const clientIP = req.headers['x-forwarded-for'] || req.ip;
    const filteredHeaders = Object.fromEntries(
      Object.entries(req.headers).filter(([k]) => SAFE_HEADERS.includes(k.toLowerCase()))
    );

    await sql`
      INSERT INTO requests 
        (timestamp, method, domain, path, client_ip, headers)
      VALUES 
        (NOW(), ${req.method}, ${targetDomain}, ${targetPath}, ${clientIP}, ${filteredHeaders})
    `;
  } catch (error) {
    console.error('Database error:', error);
  }

  // 创建代理中间件
  const proxy = createProxyMiddleware({
    target: `https://${targetDomain}`,
    changeOrigin: true,
    pathRewrite: { [`^/api/proxy/${targetDomain}`]: '' },
    secure: true,
    onProxyReq(proxyReq) {
      proxyReq.setHeader('X-Proxy-Server', 'vercel-proxy');
    },
    onError(err) {
      console.error('Proxy error:', err);
    }
  });

  return proxy(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};
