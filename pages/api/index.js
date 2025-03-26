// pages/index.js

import { useState, useEffect } from "react";

export default function Home() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 每 3 秒轮询一次日志接口
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
        请求记录将实时显示在下方，你可以通过调用{" "}
        <code>/api/proxy?target=目标地址</code> 来测试代理效果。
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
