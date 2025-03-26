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
        无论访问哪个网页，都会由代理服务器转发到配置的目标地址。请确保已在
        Vercel 控制台设置 <code>TARGET_URL</code>。
      </p>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            [{new Date(log.timestamp).toLocaleString()}] {log.method}{" "}
            {log.url}
          </li>
        ))}
      </ul>
    </div>
  );
}
