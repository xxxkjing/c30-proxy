// pages/index.js

import { useState, useEffect } from "react";

export default function Home() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/logs")
        .then((res) => res.json())
        .then((data) => setLogs(data.logs))
        .catch((err) => console.error("获取日志失败", err));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>代理服务器日志</h1>
      <p>
        所有请求都将统一转发到指定目标。请在 Vercel 环境变量中配置 <code>TARGET_URL</code>
      </p>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            [{new Date(log.timestamp).toLocaleString()}] {log.method} {log.url}
          </li>
        ))}
      </ul>
    </div>
  );
}
