// lib/logs.js

let logs = [];

function addLog(entry) {
  logs.push(entry);
  // 控制日志数量不过多，最多保留最近 100 条记录
  if (logs.length > 100) {
    logs.shift();
  }
}

function getLogs() {
  return logs;
}

export { addLog, getLogs };
